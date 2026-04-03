/**
 * Cannibalization Detector & Resolution Engine — CI-002
 *
 * Detects multiple URLs competing for the same query (cannibalization)
 * and recommends resolution strategies: merge, redirect, differentiate, deoptimize.
 *
 * Writes results to keyword_opportunities table with opportunity_type='cannibalization'.
 *
 * Zero npm dependencies — Node.js built-ins only.
 */

const logger = require('../logger');
const supabase = require('../supabase-client');

// ── Constants ──────────────────────────────────────────────────

const MIN_CANNIBALIZATION_IMPRESSIONS = 100;  // Minimum monthly impressions
const MAX_POSITION = 50;                       // Only flag if both URLs in top 50
const UPSERT_BATCH_SIZE = 500;
const PAGE_SIZE = 1000;

// Strategy thresholds
const REDIRECT_MAX_CLICKS = 100;        // Secondary must have < 100 clicks
const REDIRECT_MIN_OVERLAP = 0.80;      // 80%+ content overlap for redirect
const DIFFERENTIATE_MIN_CLICKS = 200;   // Both must have > 200 clicks
const MERGE_TRAFFIC_RATIO = 0.30;       // Secondary < 30% of primary's traffic

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
 * Estimate content overlap between two URLs based on available metadata.
 * Returns a value between 0 and 1.
 * In practice this would compare actual content; here we use URL/title heuristics.
 */
function estimateContentOverlap(url1, url2, metadata1, metadata2) {
  // URL path similarity
  const path1 = extractPath(url1);
  const path2 = extractPath(url2);
  const pathWords1 = new Set(path1.split(/[-_/]/).filter(Boolean));
  const pathWords2 = new Set(path2.split(/[-_/]/).filter(Boolean));

  if (pathWords1.size === 0 || pathWords2.size === 0) return 0.5;

  let overlap = 0;
  for (const w of pathWords1) {
    if (pathWords2.has(w)) overlap++;
  }
  const urlOverlap = overlap / Math.max(pathWords1.size, pathWords2.size);

  // Title similarity if available
  const title1 = (metadata1 && metadata1.title) || '';
  const title2 = (metadata2 && metadata2.title) || '';
  let titleOverlap = 0.5;
  if (title1 && title2) {
    const tw1 = new Set(title1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const tw2 = new Set(title2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    if (tw1.size > 0 && tw2.size > 0) {
      let tOverlap = 0;
      for (const w of tw1) {
        if (tw2.has(w)) tOverlap++;
      }
      titleOverlap = tOverlap / Math.max(tw1.size, tw2.size);
    }
  }

  return Math.round((urlOverlap * 0.4 + titleOverlap * 0.6) * 100) / 100;
}

function extractPath(url) {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

/**
 * Calculate impression split percentages between URLs.
 * Returns array of { url, percentage } that sums to 100.
 */
function calculateImpressionSplit(urlData) {
  const total = urlData.reduce((s, d) => s + (d.impressions || 0), 0);
  if (total === 0) {
    // Equal split
    const pct = Math.round(10000 / urlData.length) / 100;
    return urlData.map((d, i) => ({
      url: d.url,
      percentage: i === urlData.length - 1
        ? Math.round((100 - pct * (urlData.length - 1)) * 100) / 100
        : pct
    }));
  }

  const splits = urlData.map(d => ({
    url: d.url,
    percentage: Math.round(((d.impressions || 0) / total) * 10000) / 100
  }));

  // Ensure sums to exactly 100
  const sum = splits.reduce((s, sp) => s + sp.percentage, 0);
  if (splits.length > 0) {
    splits[splits.length - 1].percentage = Math.round((splits[splits.length - 1].percentage + (100 - sum)) * 100) / 100;
  }

  return splits;
}

/**
 * Select the best resolution strategy and compute confidence score.
 *
 * Strategies:
 * 1. merge: secondary <30% of primary's traffic, same subtopic
 * 2. redirect: secondary <100 clicks AND >80% content overlap
 * 3. differentiate: both >200 clicks, genuinely different content
 * 4. deoptimize: secondary ranks for other valuable keywords
 */
function selectStrategy(primaryData, secondaryData, contentOverlap, secondaryOtherKeywords) {
  const primaryClicks = primaryData.clicks || 0;
  const secondaryClicks = secondaryData.clicks || 0;
  const trafficRatio = primaryClicks > 0 ? secondaryClicks / primaryClicks : 0;

  const candidates = [];

  // Check redirect: secondary < 100 clicks AND > 80% content overlap
  // Redirect is a more specific/actionable form of merge, so it takes priority
  const redirectQualifies = secondaryClicks < REDIRECT_MAX_CLICKS && contentOverlap >= REDIRECT_MIN_OVERLAP;
  if (redirectQualifies) {
    const confidence = Math.round(
      (contentOverlap * 50) + ((REDIRECT_MAX_CLICKS - secondaryClicks) / REDIRECT_MAX_CLICKS * 50)
    );
    candidates.push({
      strategy: 'redirect',
      confidence: Math.min(100, confidence),
      reason: `Secondary has ${secondaryClicks} clicks (<${REDIRECT_MAX_CLICKS}) with ${Math.round(contentOverlap * 100)}% content overlap`
    });
  }

  // Check merge: secondary < 30% of primary's traffic, same subtopic
  // Skip if redirect already qualifies (redirect is the more specific action)
  if (!redirectQualifies && trafficRatio < MERGE_TRAFFIC_RATIO && contentOverlap >= 0.5) {
    const confidence = Math.round(
      ((1 - trafficRatio / MERGE_TRAFFIC_RATIO) * 40) + (contentOverlap * 40) + 20
    );
    candidates.push({
      strategy: 'merge',
      confidence: Math.min(100, confidence),
      reason: `Secondary gets ${Math.round(trafficRatio * 100)}% of primary traffic (<${MERGE_TRAFFIC_RATIO * 100}%), ${Math.round(contentOverlap * 100)}% content overlap`
    });
  }

  // Check differentiate: both > 200 clicks, genuinely different content
  if (primaryClicks >= DIFFERENTIATE_MIN_CLICKS && secondaryClicks >= DIFFERENTIATE_MIN_CLICKS && contentOverlap < 0.5) {
    const confidence = Math.round(
      ((1 - contentOverlap) * 50) + (Math.min(secondaryClicks, 1000) / 1000 * 50)
    );
    candidates.push({
      strategy: 'differentiate',
      confidence: Math.min(100, confidence),
      reason: `Both URLs have significant traffic (${primaryClicks}/${secondaryClicks} clicks) with only ${Math.round(contentOverlap * 100)}% overlap`
    });
  }

  // Check deoptimize: secondary ranks for other valuable keywords
  if (secondaryOtherKeywords && secondaryOtherKeywords > 0) {
    const confidence = Math.round(Math.min(100, 30 + secondaryOtherKeywords * 10));
    candidates.push({
      strategy: 'deoptimize',
      confidence: Math.min(100, confidence),
      reason: `Secondary URL ranks for ${secondaryOtherKeywords} other valuable keywords`
    });
  }

  // Sort by confidence and return best
  candidates.sort((a, b) => b.confidence - a.confidence);

  if (candidates.length === 0) {
    return {
      strategy: 'merge',
      confidence: 30,
      reason: 'Default recommendation: merge secondary into primary'
    };
  }

  return candidates[0];
}

// ── Data Fetchers ──────────────────────────────────────────────

/**
 * Fetch query-level performance data grouped by query and URL.
 * Returns: { query: [{ url, impressions, clicks, position, metadata }] }
 */
async function fetchQueryUrlData(config, serviceRoleKey, userId) {
  const queryUrlMap = {};
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
      logger.error('cannibalization_fetch_failed', { status: res.status, userId });
      break;
    }

    const rows = await res.json();
    if (!rows || rows.length === 0) break;

    for (const row of rows) {
      const topQueries = (row.metadata && row.metadata.topQueries) || [];
      for (const q of topQueries) {
        const keyword = (q.query || q.keyword || '').toLowerCase().trim();
        if (!keyword) continue;

        if (!queryUrlMap[keyword]) queryUrlMap[keyword] = {};
        const urlKey = row.url;

        if (!queryUrlMap[keyword][urlKey]) {
          queryUrlMap[keyword][urlKey] = {
            url: urlKey,
            impressions: 0,
            clicks: 0,
            positions: [],
            metadata: { title: row.metadata && row.metadata.title }
          };
        }

        queryUrlMap[keyword][urlKey].impressions += q.impressions || 0;
        queryUrlMap[keyword][urlKey].clicks += q.clicks || 0;
        if (q.position || q.avg_position) {
          queryUrlMap[keyword][urlKey].positions.push(q.position || q.avg_position);
        }
      }
    }

    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  // Compute averages and convert to arrays
  const result = {};
  for (const [keyword, urlMap] of Object.entries(queryUrlMap)) {
    const urlArr = Object.values(urlMap).map(d => ({
      ...d,
      avg_position: d.positions.length > 0
        ? Math.round(d.positions.reduce((a, b) => a + b, 0) / d.positions.length * 100) / 100
        : null
    }));
    delete urlArr.positions;
    result[keyword] = urlArr;
  }

  return result;
}

/**
 * Count how many other keywords a URL ranks for (for deoptimize strategy).
 */
function countOtherKeywords(queryUrlMap, targetUrl, excludeKeyword) {
  let count = 0;
  for (const [keyword, urls] of Object.entries(queryUrlMap)) {
    if (keyword === excludeKeyword) continue;
    const urlData = Object.values(urls);
    if (urlData.some && urlData.some(u => u.url === targetUrl)) count++;
    // Handle if urls is already array
    if (Array.isArray(urls) && urls.some(u => u.url === targetUrl)) count++;
  }
  return count;
}

// ── Core Analysis ──────────────────────────────────────────────

/**
 * Detect cannibalization: 2+ URLs ranking for same query in top 50
 * with >= 100 monthly impressions.
 *
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} Array of cannibalization conflicts
 */
async function detectCannibalization(userId) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  logger.info('cannibalization_detection_started', { userId });

  const queryUrlData = await fetchQueryUrlData(config, serviceRoleKey, userId);
  const conflicts = [];

  for (const [keyword, urlDataArr] of Object.entries(queryUrlData)) {
    const urlList = Array.isArray(urlDataArr) ? urlDataArr : Object.values(urlDataArr);

    // Total impressions for this keyword
    const totalImpressions = urlList.reduce((s, u) => s + (u.impressions || 0), 0);
    if (totalImpressions < MIN_CANNIBALIZATION_IMPRESSIONS) continue;

    // Filter to URLs ranking within top 50
    const rankingUrls = urlList.filter(u =>
      u.avg_position !== null && u.avg_position <= MAX_POSITION
    );

    // Need 2+ URLs for cannibalization
    if (rankingUrls.length < 2) continue;

    // Sort by clicks descending to determine primary
    rankingUrls.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));

    const primaryUrl = rankingUrls[0];
    const secondaryUrls = rankingUrls.slice(1);

    // Calculate impression split
    const impressionSplit = calculateImpressionSplit(rankingUrls);

    // Position variance
    const positions = rankingUrls.map(u => u.avg_position).filter(p => p != null);
    const meanPos = positions.reduce((a, b) => a + b, 0) / positions.length;
    const posVariance = positions.reduce((s, p) => s + Math.pow(p - meanPos, 2), 0) / positions.length;

    // Determine strategy for each secondary URL
    for (const secondary of secondaryUrls) {
      const contentOverlap = estimateContentOverlap(
        primaryUrl.url, secondary.url,
        primaryUrl.metadata, secondary.metadata
      );
      const otherKeywords = countOtherKeywords(queryUrlData, secondary.url, keyword);
      const strategy = selectStrategy(primaryUrl, secondary, contentOverlap, otherKeywords);

      conflicts.push({
        keyword,
        opportunity_type: 'cannibalization',
        impressions: totalImpressions,
        clicks: (primaryUrl.clicks || 0) + (secondary.clicks || 0),
        current_position: primaryUrl.avg_position,
        competing_urls: rankingUrls.map(u => u.url),
        primary_url: primaryUrl.url,
        recommended_action: strategy.strategy,
        priority_score: Math.round(strategy.confidence * (totalImpressions / 1000) * 100) / 100,
        target_url: primaryUrl.url,
        analysis_metadata: {
          primary_url: primaryUrl.url,
          primary_clicks: primaryUrl.clicks || 0,
          primary_position: primaryUrl.avg_position,
          secondary_url: secondary.url,
          secondary_clicks: secondary.clicks || 0,
          secondary_position: secondary.avg_position,
          impression_split: impressionSplit,
          position_variance: Math.round(posVariance * 100) / 100,
          content_overlap: contentOverlap,
          strategy: strategy,
          other_keywords_count: otherKeywords
        }
      });
    }
  }

  // Sort by priority_score descending
  conflicts.sort((a, b) => b.priority_score - a.priority_score);

  // Upsert to keyword_opportunities
  await upsertConflicts(config, serviceRoleKey, userId, conflicts);

  logger.info('cannibalization_detection_completed', { userId, conflicts_found: conflicts.length });
  return conflicts;
}

// ── DB Operations ──────────────────────────────────────────────

/**
 * Upsert cannibalization conflicts to keyword_opportunities table.
 */
async function upsertConflicts(config, serviceRoleKey, userId, conflicts) {
  if (conflicts.length === 0) return;

  for (let i = 0; i < conflicts.length; i += UPSERT_BATCH_SIZE) {
    const batch = conflicts.slice(i, i + UPSERT_BATCH_SIZE).map(c => ({
      user_id: userId,
      keyword: c.keyword,
      opportunity_type: c.opportunity_type,
      priority_score: c.priority_score,
      impressions: c.impressions,
      clicks: c.clicks,
      current_position: c.current_position,
      competing_urls: c.competing_urls,
      recommended_action: c.recommended_action,
      target_url: c.target_url,
      status: 'open',
      analysis_metadata: c.analysis_metadata
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
      logger.error('cannibalization_upsert_failed', { status: res.status, userId, batch_size: batch.length });
    }
  }
}

/**
 * Resolve a cannibalization conflict — accept a strategy and generate action items.
 *
 * @param {string} config - Supabase config
 * @param {string} serviceRoleKey - Service role key
 * @param {string} userId - User UUID
 * @param {string} opportunityId - keyword_opportunities UUID
 * @param {string} strategy - Accepted strategy (merge|redirect|differentiate|deoptimize)
 * @returns {Promise<object>} Resolution result with action items
 */
async function resolveConflictDb(config, serviceRoleKey, userId, opportunityId, strategy) {
  // Fetch the opportunity
  const fetchUrl = `${config.url}/rest/v1/keyword_opportunities` +
    `?id=eq.${encodeURIComponent(opportunityId)}` +
    `&user_id=eq.${encodeURIComponent(userId)}` +
    `&select=*`;

  const fetchRes = await fetch(fetchUrl, {
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey
    }
  });

  if (!fetchRes.ok) return null;
  const rows = await fetchRes.json();
  if (!rows || rows.length === 0) return null;

  const opportunity = rows[0];
  const meta = opportunity.analysis_metadata || {};

  // Generate action items based on strategy
  const actionItems = generateActionItems(strategy, meta);

  // Update the record
  const updateUrl = `${config.url}/rest/v1/keyword_opportunities` +
    `?id=eq.${encodeURIComponent(opportunityId)}` +
    `&user_id=eq.${encodeURIComponent(userId)}`;

  const updateBody = {
    status: 'accepted',
    recommended_action: strategy,
    analysis_metadata: {
      ...meta,
      resolution: {
        accepted_strategy: strategy,
        accepted_at: new Date().toISOString(),
        action_items: actionItems
      }
    }
  };

  const updateRes = await fetch(updateUrl, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(updateBody)
  });

  if (!updateRes.ok) {
    logger.error('cannibalization_resolve_failed', { status: updateRes.status, userId, opportunityId });
    return null;
  }

  const updated = await updateRes.json();

  return {
    opportunity_id: opportunityId,
    status: 'accepted',
    strategy,
    action_items: actionItems,
    updated: updated[0] || updateBody
  };
}

/**
 * Generate action items for a resolution strategy.
 */
function generateActionItems(strategy, metadata) {
  const primaryUrl = metadata.primary_url || 'primary URL';
  const secondaryUrl = metadata.secondary_url || 'secondary URL';

  switch (strategy) {
    case 'merge':
      return [
        { step: 1, action: 'audit_content', description: `Review content on ${secondaryUrl} for unique value` },
        { step: 2, action: 'merge_content', description: `Merge unique content from ${secondaryUrl} into ${primaryUrl}` },
        { step: 3, action: 'setup_redirect', description: `Set up 301 redirect from ${secondaryUrl} to ${primaryUrl}` },
        { step: 4, action: 'update_internal_links', description: `Update all internal links pointing to ${secondaryUrl}` },
        { step: 5, action: 'monitor', description: 'Monitor rankings for 2 weeks after merge' }
      ];
    case 'redirect':
      return [
        { step: 1, action: 'setup_redirect', description: `Set up 301 redirect from ${secondaryUrl} to ${primaryUrl}` },
        { step: 2, action: 'update_internal_links', description: `Update all internal links pointing to ${secondaryUrl}` },
        { step: 3, action: 'update_sitemap', description: `Remove ${secondaryUrl} from sitemap` },
        { step: 4, action: 'monitor', description: 'Monitor rankings for 1 week after redirect' }
      ];
    case 'differentiate':
      return [
        { step: 1, action: 'identify_angles', description: `Identify unique angle for each URL: ${primaryUrl} vs ${secondaryUrl}` },
        { step: 2, action: 'rewrite_titles', description: 'Rewrite title tags to differentiate topic focus' },
        { step: 3, action: 'adjust_content', description: 'Adjust content to minimize keyword overlap' },
        { step: 4, action: 'internal_linking', description: 'Add cross-links between the two pages with distinct anchor text' },
        { step: 5, action: 'monitor', description: 'Monitor rankings for 4 weeks after changes' }
      ];
    case 'deoptimize':
      return [
        { step: 1, action: 'audit_secondary', description: `Review ${secondaryUrl} for its primary keyword targets` },
        { step: 2, action: 'remove_target_keyword', description: `Remove/reduce target keyword usage in ${secondaryUrl}` },
        { step: 3, action: 'adjust_meta', description: `Update title tag and meta description of ${secondaryUrl} to focus on its other keywords` },
        { step: 4, action: 'internal_linking', description: `Add internal link from ${secondaryUrl} to ${primaryUrl} for the target keyword` },
        { step: 5, action: 'monitor', description: 'Monitor rankings for 2 weeks after deoptimization' }
      ];
    default:
      return [
        { step: 1, action: 'review', description: 'Manually review the competing URLs and decide on a strategy' }
      ];
  }
}

// ── API Handlers ───────────────────────────────────────────────

/**
 * Handle GET /api/intelligence/cannibalization — list conflicts.
 * Supports ?sort=&page=&per_page=
 */
async function handleCannibalizationList(userId, query) {
  logger.info('cannibalization_list_started', { userId, query });

  const conflicts = await detectCannibalization(userId);

  // Sort
  const sortField = query.sort || 'priority_score';
  let sorted = [...conflicts];
  sorted.sort((a, b) => {
    if (sortField === 'priority_score') return b.priority_score - a.priority_score;
    if (sortField === 'impressions') return (b.impressions || 0) - (a.impressions || 0);
    if (sortField === 'clicks') return (b.clicks || 0) - (a.clicks || 0);
    return 0;
  });

  // Pagination
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(query.per_page || '20', 10)));
  const start = (page - 1) * perPage;
  const paginated = sorted.slice(start, start + perPage);

  return {
    items: paginated,
    summary: {
      total: sorted.length,
      by_strategy: {
        merge: sorted.filter(c => c.recommended_action === 'merge').length,
        redirect: sorted.filter(c => c.recommended_action === 'redirect').length,
        differentiate: sorted.filter(c => c.recommended_action === 'differentiate').length,
        deoptimize: sorted.filter(c => c.recommended_action === 'deoptimize').length
      }
    },
    pagination: {
      page,
      per_page: perPage,
      total: sorted.length,
      total_pages: Math.ceil(sorted.length / perPage)
    }
  };
}

/**
 * Handle GET /api/intelligence/cannibalization/:keyword — detail for specific keyword.
 */
async function handleCannibalizationDetail(userId, keyword) {
  logger.info('cannibalization_detail_started', { userId, keyword });

  const conflicts = await detectCannibalization(userId);
  const match = conflicts.filter(c => c.keyword === keyword.toLowerCase().trim());

  if (match.length === 0) return null;

  return {
    keyword: keyword.toLowerCase().trim(),
    conflicts: match,
    total_conflicts: match.length
  };
}

/**
 * Handle POST /api/intelligence/cannibalization/:id/resolve — accept a resolution strategy.
 */
async function handleResolve(userId, opportunityId, body) {
  logger.info('cannibalization_resolve_started', { userId, opportunityId });

  const validStrategies = ['merge', 'redirect', 'differentiate', 'deoptimize'];
  const strategy = body && body.strategy;

  if (!strategy || !validStrategies.includes(strategy)) {
    return { error: 'Invalid strategy. Must be one of: merge, redirect, differentiate, deoptimize' };
  }

  const { config, serviceRoleKey } = getSupabaseAdmin();
  const result = await resolveConflictDb(config, serviceRoleKey, userId, opportunityId, strategy);

  if (!result) {
    return { error: 'Opportunity not found or update failed' };
  }

  return result;
}

// ── Exports ────────────────────────────────────────────────────

module.exports = {
  // Core analysis
  detectCannibalization,
  // Resolution
  resolveConflictDb,
  generateActionItems,
  // API handlers
  handleCannibalizationList,
  handleCannibalizationDetail,
  handleResolve,
  // Helpers (exported for testing)
  estimateContentOverlap,
  calculateImpressionSplit,
  selectStrategy,
  formatDate
};
