/**
 * Keyword Gap Analyzer — CI-002
 *
 * Identifies high-impression keywords without dedicated pages by analyzing
 * performance_snapshots data and comparing against content_inventory.
 * Also detects competitor domains repeatedly appearing in SERPs.
 *
 * Writes results to keyword_opportunities table with opportunity_type='gap'.
 *
 * Zero npm dependencies — Node.js built-ins only.
 */

const logger = require('../logger');
const supabase = require('../supabase-client');

// ── Constants ──────────────────────────────────────────────────

const MIN_GAP_IMPRESSIONS = 500;     // Minimum monthly impressions for a gap
const UPSERT_BATCH_SIZE = 500;
const PAGE_SIZE = 1000;

// Scoring weights
const IMPRESSIONS_MAX_SCORE = 30;    // 0-30 for impressions component
const POSITION_MAX_SCORE = 40;       // 0-40 for position component
const COMPETITION_MAX_SCORE = 30;    // 0-30 for competition component

// ── Helpers ────────────────────────────────────────────────────

function getSupabaseAdmin() {
  const config = supabase.loadConfig();
  const serviceRoleKey = supabase.getServiceRoleKey();
  if (!config || !serviceRoleKey) {
    throw new Error('Supabase admin config not available. Set SUPABASE_SERVICE_ROLE_KEY env var.');
  }
  return { config, serviceRoleKey };
}

function formatDate(date) {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Fuzzy title match — checks if keyword appears substantially in a title.
 * Normalizes both strings: lowercase, strip special chars, compare words.
 */
function fuzzyTitleMatch(keyword, title) {
  if (!keyword || !title) return false;
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const normKeyword = normalize(keyword);
  const normTitle = normalize(title);

  // Exact containment
  if (normTitle.includes(normKeyword)) return true;

  // Word overlap: if 80%+ of keyword words appear in title
  const kwWords = normKeyword.split(/\s+/).filter(Boolean);
  const titleWords = new Set(normTitle.split(/\s+/).filter(Boolean));
  if (kwWords.length === 0) return false;

  let matched = 0;
  for (const w of kwWords) {
    if (titleWords.has(w)) matched++;
  }
  return (matched / kwWords.length) >= 0.8;
}

/**
 * Score a keyword gap opportunity (0-100).
 *
 * impressions_component (0-30): log-scaled impressions
 * position_component (0-40): lower position = higher opportunity
 * competition_component (0-30): fewer competing URLs = easier win
 */
function scoreGap(impressions, avgPosition, competingUrlCount) {
  // Impressions component: log scale, 500 = ~10, 10000 = ~30
  const impNorm = Math.min(1, Math.log10(Math.max(1, impressions)) / Math.log10(50000));
  const impressionsScore = Math.round(impNorm * IMPRESSIONS_MAX_SCORE * 100) / 100;

  // Position component: positions 11-50 are most actionable
  // Position 11 = 40 pts, position 50 = 10 pts, position > 50 = low
  let positionScore = 0;
  if (avgPosition !== null && avgPosition !== undefined) {
    if (avgPosition <= 10) {
      positionScore = 20; // Already ranking, moderate opportunity
    } else if (avgPosition <= 20) {
      positionScore = 40; // Prime opportunity — page 2
    } else if (avgPosition <= 50) {
      positionScore = 30; // Good opportunity — page 3-5
    } else {
      positionScore = 10; // Low priority — very far back
    }
  } else {
    positionScore = 25; // No ranking data = moderate opportunity
  }

  // Competition component: fewer competing URLs = easier
  let competitionScore = COMPETITION_MAX_SCORE;
  if (competingUrlCount > 0) {
    competitionScore = Math.max(5, COMPETITION_MAX_SCORE - (competingUrlCount * 5));
  }

  const total = Math.round((impressionsScore + positionScore + competitionScore) * 100) / 100;
  return {
    total: Math.min(100, total),
    impressions_component: impressionsScore,
    position_component: positionScore,
    competition_component: competitionScore
  };
}

// ── Data Fetchers ──────────────────────────────────────────────

/**
 * Fetch performance snapshots and extract unique queries from metadata.topQueries.
 * Returns map: query -> { impressions, clicks, position, urls }
 */
async function fetchQueryData(config, serviceRoleKey, userId) {
  const queries = {};
  let offset = 0;

  const now = new Date();
  const startDate = formatDate(new Date(now.getTime() - 30 * 86400000));
  const endDate = formatDate(now);

  while (true) {
    const url = `${config.url}/rest/v1/performance_snapshots` +
      `?user_id=eq.${encodeURIComponent(userId)}` +
      `&snapshot_date=gte.${startDate}` +
      `&snapshot_date=lte.${endDate}` +
      `&source=eq.gsc` +
      `&select=url,impressions,clicks,avg_position,metadata` +
      `&offset=${offset}&limit=${PAGE_SIZE}` +
      `&order=url.asc`;

    const res = await fetch(url, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey
      }
    });

    if (!res.ok) {
      logger.error('gap_fetch_snapshots_failed', { status: res.status, userId });
      break;
    }

    const rows = await res.json();
    if (!rows || rows.length === 0) break;

    for (const row of rows) {
      const topQueries = (row.metadata && row.metadata.topQueries) || [];
      for (const q of topQueries) {
        const keyword = (q.query || q.keyword || '').toLowerCase().trim();
        if (!keyword) continue;

        if (!queries[keyword]) {
          queries[keyword] = { impressions: 0, clicks: 0, positions: [], urls: new Set() };
        }
        queries[keyword].impressions += q.impressions || 0;
        queries[keyword].clicks += q.clicks || 0;
        if (q.position || q.avg_position) {
          queries[keyword].positions.push(q.position || q.avg_position);
        }
        queries[keyword].urls.add(row.url);
      }
    }

    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  // Compute average position per query
  for (const key of Object.keys(queries)) {
    const q = queries[key];
    q.avgPosition = q.positions.length > 0
      ? q.positions.reduce((a, b) => a + b, 0) / q.positions.length
      : null;
    q.urls = Array.from(q.urls);
  }

  return queries;
}

/**
 * Fetch content inventory titles for fuzzy matching.
 */
async function fetchContentTitles(config, serviceRoleKey, userId) {
  const titles = [];
  let offset = 0;

  while (true) {
    const url = `${config.url}/rest/v1/content_inventory` +
      `?user_id=eq.${encodeURIComponent(userId)}` +
      `&select=id,url,title` +
      `&offset=${offset}&limit=${PAGE_SIZE}`;

    const res = await fetch(url, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey
      }
    });

    if (!res.ok) {
      logger.error('gap_fetch_titles_failed', { status: res.status, userId });
      break;
    }

    const rows = await res.json();
    if (!rows || rows.length === 0) break;
    titles.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return titles;
}

// ── Core Analysis ──────────────────────────────────────────────

/**
 * Find keyword gaps: high-impression keywords without dedicated pages.
 *
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} Array of gap opportunities
 */
async function findKeywordGaps(userId) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  logger.info('gap_analysis_started', { userId });

  const [queryData, contentTitles] = await Promise.all([
    fetchQueryData(config, serviceRoleKey, userId),
    fetchContentTitles(config, serviceRoleKey, userId)
  ]);

  const gaps = [];

  for (const [keyword, data] of Object.entries(queryData)) {
    // Only consider queries with >= MIN_GAP_IMPRESSIONS
    if (data.impressions < MIN_GAP_IMPRESSIONS) continue;

    // Check if dedicated page exists (fuzzy title match)
    const hasPage = contentTitles.some(item => fuzzyTitleMatch(keyword, item.title));
    if (hasPage) continue;

    // Score the gap
    const score = scoreGap(data.impressions, data.avgPosition, data.urls.length);

    gaps.push({
      keyword,
      opportunity_type: 'gap',
      impressions: data.impressions,
      clicks: data.clicks,
      current_position: data.avgPosition ? Math.round(data.avgPosition * 100) / 100 : null,
      competing_urls: data.urls,
      priority_score: score.total,
      recommended_action: 'create_new',
      analysis_metadata: {
        scoring: score,
        url_count: data.urls.length,
        has_ranking: data.avgPosition !== null
      }
    });
  }

  // Sort by priority_score descending
  gaps.sort((a, b) => b.priority_score - a.priority_score);

  // Upsert to keyword_opportunities
  await upsertOpportunities(config, serviceRoleKey, userId, gaps);

  logger.info('gap_analysis_completed', { userId, gaps_found: gaps.length });
  return gaps;
}

/**
 * Detect competitor domains appearing in SERPs for user's queries.
 * Returns top 5 by overlap count.
 *
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} Top 5 competitor domains
 */
async function detectCompetitors(userId) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  logger.info('competitor_detection_started', { userId });

  const queryData = await fetchQueryData(config, serviceRoleKey, userId);

  // Extract domains from URLs competing for user's queries
  const domainCounts = {};

  for (const [keyword, data] of Object.entries(queryData)) {
    const metadata = data;
    // Collect competitor URLs from metadata if available
    for (const url of metadata.urls) {
      try {
        const parsed = new URL(url);
        const domain = parsed.hostname.replace(/^www\./, '');
        if (!domainCounts[domain]) {
          domainCounts[domain] = { count: 0, keywords: [], totalImpressions: 0 };
        }
        domainCounts[domain].count++;
        if (domainCounts[domain].keywords.length < 10) {
          domainCounts[domain].keywords.push(keyword);
        }
        domainCounts[domain].totalImpressions += data.impressions || 0;
      } catch (e) {
        // Skip invalid URLs
      }
    }
  }

  // Sort by overlap count and take top 5
  const competitors = Object.entries(domainCounts)
    .map(([domain, info]) => ({
      domain,
      overlap_count: info.count,
      shared_keywords: info.keywords,
      total_impressions: info.totalImpressions
    }))
    .sort((a, b) => b.overlap_count - a.overlap_count)
    .slice(0, 5);

  logger.info('competitor_detection_completed', { userId, competitors_found: competitors.length });
  return competitors;
}

// ── DB Operations ──────────────────────────────────────────────

/**
 * Upsert gap opportunities to keyword_opportunities table.
 */
async function upsertOpportunities(config, serviceRoleKey, userId, gaps) {
  if (gaps.length === 0) return;

  for (let i = 0; i < gaps.length; i += UPSERT_BATCH_SIZE) {
    const batch = gaps.slice(i, i + UPSERT_BATCH_SIZE).map(g => ({
      user_id: userId,
      keyword: g.keyword,
      opportunity_type: g.opportunity_type,
      priority_score: g.priority_score,
      impressions: g.impressions,
      clicks: g.clicks,
      current_position: g.current_position,
      competing_urls: g.competing_urls,
      recommended_action: g.recommended_action,
      target_url: g.target_url || null,
      status: 'open',
      analysis_metadata: g.analysis_metadata || {}
    }));

    const url = `${config.url}/rest/v1/keyword_opportunities`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey,
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(batch)
    });

    if (!res.ok) {
      logger.error('gap_upsert_failed', { status: res.status, userId, batch_size: batch.length });
    }
  }
}

// ── API Handlers ───────────────────────────────────────────────

/**
 * Handle GET /api/intelligence/gaps — list keyword gaps.
 * Supports ?min_impressions=&sort=&page=&per_page=
 *
 * @param {string} userId - User UUID
 * @param {object} query - URL query parameters
 * @returns {Promise<object>} API response data
 */
async function handleGapList(userId, query) {
  logger.info('gap_list_started', { userId, query });

  const gaps = await findKeywordGaps(userId);

  // Filter by min_impressions
  let filtered = gaps;
  const minImp = parseInt(query.min_impressions || '0', 10);
  if (minImp > 0) {
    filtered = filtered.filter(g => g.impressions >= minImp);
  }

  // Sort
  const sortField = query.sort || 'priority_score';
  filtered.sort((a, b) => {
    if (sortField === 'priority_score') return b.priority_score - a.priority_score;
    if (sortField === 'impressions') return (b.impressions || 0) - (a.impressions || 0);
    if (sortField === 'clicks') return (b.clicks || 0) - (a.clicks || 0);
    if (sortField === 'position') return (a.current_position || 999) - (b.current_position || 999);
    return 0;
  });

  // Pagination
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(query.per_page || '20', 10)));
  const start = (page - 1) * perPage;
  const paginated = filtered.slice(start, start + perPage);

  return {
    items: paginated,
    summary: {
      total: filtered.length,
      avg_priority_score: filtered.length > 0
        ? Math.round(filtered.reduce((s, g) => s + g.priority_score, 0) / filtered.length * 100) / 100
        : 0,
      total_missed_impressions: filtered.reduce((s, g) => s + (g.impressions || 0), 0)
    },
    pagination: {
      page,
      per_page: perPage,
      total: filtered.length,
      total_pages: Math.ceil(filtered.length / perPage)
    }
  };
}

/**
 * Handle GET /api/intelligence/gaps/competitors — competitor domains.
 *
 * @param {string} userId - User UUID
 * @returns {Promise<object>} API response data
 */
async function handleCompetitors(userId) {
  logger.info('competitors_list_started', { userId });
  const competitors = await detectCompetitors(userId);
  return { competitors, total: competitors.length };
}

// ── Exports ────────────────────────────────────────────────────

module.exports = {
  // Core analysis
  findKeywordGaps,
  detectCompetitors,
  // API handlers
  handleGapList,
  handleCompetitors,
  // Helpers (exported for testing)
  fuzzyTitleMatch,
  scoreGap,
  formatDate
};
