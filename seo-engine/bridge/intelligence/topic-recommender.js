/**
 * Topic Recommender — CI-003
 *
 * Scoring engine and recommendation assembly for topic prioritization.
 * Implements a 5-component scoring formula:
 *   priority = (impressions * 0.3) + (decay * 0.25) + (gap * 0.25) + (seasonality * 0.1) + (competition * 0.1)
 *
 * Each component is normalized 0-100. The engine aggregates signals from
 * decay-detector, gap-analyzer, and performance data to produce ranked
 * topic recommendations with human-readable summaries.
 *
 * Zero npm dependencies — Node.js built-ins only.
 */

const logger = require('../logger');
const supabase = require('../supabase-client');

// ── Constants ──────────────────────────────────────────────────

const PAGE_SIZE = 1000;

// Scoring weights (must sum to 1.0)
const WEIGHTS = {
  impressions: 0.30,
  decay: 0.25,
  gap: 0.25,
  seasonality: 0.10,
  competition: 0.10
};

// Impression score breakpoints (logarithmic scale)
// 0 → 0, 1000 → 25, 5000 → 50, 10000 → 75, 50000+ → 100
const IMPRESSION_BREAKPOINTS = [
  { threshold: 50000, score: 100 },
  { threshold: 10000, score: 75 },
  { threshold: 5000, score: 50 },
  { threshold: 1000, score: 25 },
  { threshold: 0, score: 0 }
];

// Decay severity mapping
const DECAY_SCORES = {
  critical: 100,
  high: 70,
  medium: 40,
  low: 0,
  'age-triggered-stable': 30
};

// Gap position mapping
const GAP_THRESHOLDS = {
  no_page: 100,
  rank_20_50: 50,
  well_ranking: 0
};

// Competition type mapping
const COMPETITION_SCORES = {
  thin: 100,
  forum: 80,
  mixed: 50,
  strong: 20,
  brands: 0
};

// Content type suggestions based on scoring signals
const CONTENT_TYPE_MAP = {
  high_impressions_no_page: 'comprehensive-guide',
  decaying_content: 'content-refresh',
  gap_opportunity: 'new-article',
  seasonal_peak: 'timely-update',
  low_competition: 'quick-win-post'
};

// Recommendation statuses
const VALID_STATUSES = ['pending', 'approved', 'rejected', 'in_progress', 'completed'];

// In-memory stores for recommendations and runs
const recommendationStore = new Map(); // userId -> recommendations[]
const runStore = new Map(); // runId -> run status

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

function generateId() {
  const bytes = new Uint8Array(16);
  // Use crypto.randomUUID pattern with fallback
  const hex = [];
  for (let i = 0; i < 16; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
    hex.push(bytes[i].toString(16).padStart(2, '0'));
  }
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join('')
  ].join('-');
}

// ── Scoring Components ─────────────────────────────────────────

/**
 * Score impressions on a logarithmic scale 0-100.
 * 0 → 0, 1000 → 25, 5000 → 50, 10000 → 75, 50000+ → 100
 *
 * Uses logarithmic interpolation between breakpoints.
 *
 * @param {number} impressions - Monthly impression count
 * @returns {number} Score 0-100
 */
function scoreImpressions(impressions) {
  if (!impressions || impressions <= 0) return 0;
  if (impressions >= 50000) return 100;

  // Logarithmic interpolation between breakpoints
  const breakpoints = [
    { imp: 0, score: 0 },
    { imp: 1000, score: 25 },
    { imp: 5000, score: 50 },
    { imp: 10000, score: 75 },
    { imp: 50000, score: 100 }
  ];

  for (let i = 1; i < breakpoints.length; i++) {
    if (impressions <= breakpoints[i].imp) {
      const low = breakpoints[i - 1];
      const high = breakpoints[i];
      // Linear interpolation in log space
      const logLow = low.imp > 0 ? Math.log(low.imp) : 0;
      const logHigh = Math.log(high.imp);
      const logVal = impressions > 0 ? Math.log(impressions) : 0;
      const t = logHigh > logLow ? (logVal - logLow) / (logHigh - logLow) : 0;
      return Math.round((low.score + t * (high.score - low.score)) * 100) / 100;
    }
  }

  return 100;
}

/**
 * Score decay severity 0-100.
 * none → 0, medium → 40, high → 70, critical → 100, age-triggered-stable → 30
 *
 * @param {string} severity - Decay severity level
 * @returns {number} Score 0-100
 */
function scoreDecay(severity) {
  if (!severity) return 0;
  const normalized = severity.toLowerCase().trim();
  if (normalized in DECAY_SCORES) return DECAY_SCORES[normalized];
  return 0;
}

/**
 * Score content gap 0-100.
 * well-ranking (pos 1-20) → 0, rank 20-50 → 50, no page (null or >50) → 100
 *
 * @param {number|null} position - Current ranking position (null = no page)
 * @returns {number} Score 0-100
 */
function scoreGap(position) {
  if (position === null || position === undefined) return 100;
  if (position > 50) return 100;
  if (position >= 20) return 50;
  return 0;
}

/**
 * Score seasonality 0-100.
 * weeks_to_peak <= 8 → 100, 8-16 → 50, >16 → 0, default → 50
 *
 * @param {number|null} weeksToPeak - Weeks until seasonal peak
 * @returns {number} Score 0-100
 */
function scoreSeasonality(weeksToPeak) {
  if (weeksToPeak === null || weeksToPeak === undefined) return 50;
  if (weeksToPeak <= 8) return 100;
  if (weeksToPeak <= 16) return 50;
  return 0;
}

/**
 * Score competition level 0-100.
 * thin → 100, forum → 80, mixed → 50, strong → 20, brands → 0
 *
 * @param {string} competitionType - Competition classification
 * @returns {number} Score 0-100
 */
function scoreCompetition(competitionType) {
  if (!competitionType) return 50; // default to mixed
  const normalized = competitionType.toLowerCase().trim();
  if (normalized in COMPETITION_SCORES) return COMPETITION_SCORES[normalized];
  return 50;
}

// ── Composite Scoring ──────────────────────────────────────────

/**
 * Calculate the composite priority score using the 5-component weighted formula.
 *
 * @param {object} signals - Input signals
 * @param {number} signals.impressions - Monthly impressions
 * @param {string} signals.decaySeverity - Decay severity level
 * @param {number|null} signals.position - Current ranking position
 * @param {number|null} signals.weeksToPeak - Weeks to seasonal peak
 * @param {string} signals.competitionType - Competition classification
 * @returns {object} Scoring breakdown with total and components
 */
function calculatePriority(signals) {
  const impressionsScore = scoreImpressions(signals.impressions || 0);
  const decayScore = scoreDecay(signals.decaySeverity || '');
  const gapScore = scoreGap(signals.position);
  const seasonalityScore = scoreSeasonality(signals.weeksToPeak);
  const competitionScore = scoreCompetition(signals.competitionType || '');

  const total = Math.round((
    impressionsScore * WEIGHTS.impressions +
    decayScore * WEIGHTS.decay +
    gapScore * WEIGHTS.gap +
    seasonalityScore * WEIGHTS.seasonality +
    competitionScore * WEIGHTS.competition
  ) * 100) / 100;

  return {
    total: Math.min(100, Math.max(0, total)),
    components: {
      impressions: { score: impressionsScore, weight: WEIGHTS.impressions, weighted: Math.round(impressionsScore * WEIGHTS.impressions * 100) / 100 },
      decay: { score: decayScore, weight: WEIGHTS.decay, weighted: Math.round(decayScore * WEIGHTS.decay * 100) / 100 },
      gap: { score: gapScore, weight: WEIGHTS.gap, weighted: Math.round(gapScore * WEIGHTS.gap * 100) / 100 },
      seasonality: { score: seasonalityScore, weight: WEIGHTS.seasonality, weighted: Math.round(seasonalityScore * WEIGHTS.seasonality * 100) / 100 },
      competition: { score: competitionScore, weight: WEIGHTS.competition, weighted: Math.round(competitionScore * WEIGHTS.competition * 100) / 100 }
    }
  };
}

// ── Summary Generation ─────────────────────────────────────────

/**
 * Generate a human-readable summary with data-backed justifications.
 *
 * @param {object} signals - Raw input signals
 * @param {object} scoring - Output from calculatePriority
 * @returns {string} Human-readable summary
 */
function generateSummary(signals, scoring) {
  const parts = [];

  // Lead with the strongest signal
  const components = scoring.components;
  const sorted = Object.entries(components)
    .sort(([, a], [, b]) => b.weighted - a.weighted);

  const strongest = sorted[0];
  const strongestName = strongest[0];

  switch (strongestName) {
    case 'impressions':
      parts.push(`High search demand with ${(signals.impressions || 0).toLocaleString()} monthly impressions.`);
      break;
    case 'decay':
      parts.push(`Content showing ${signals.decaySeverity || 'significant'} decay — needs attention.`);
      break;
    case 'gap':
      if (signals.position === null || signals.position === undefined) {
        parts.push('No existing page targeting this topic — clear content gap.');
      } else {
        parts.push(`Currently ranking at position ${signals.position} — opportunity to improve.`);
      }
      break;
    case 'seasonality':
      if (signals.weeksToPeak !== null && signals.weeksToPeak !== undefined) {
        parts.push(`Seasonal peak in ${signals.weeksToPeak} weeks — act now for maximum impact.`);
      } else {
        parts.push('Evergreen topic with consistent year-round demand.');
      }
      break;
    case 'competition':
      parts.push(`${(signals.competitionType || 'mixed')} competition — ${components.competition.score >= 80 ? 'easy win' : 'achievable'} ranking opportunity.`);
      break;
  }

  // Add secondary justification
  if (sorted.length > 1 && sorted[1][1].weighted > 0) {
    const secondName = sorted[1][0];
    switch (secondName) {
      case 'impressions':
        parts.push(`Search volume supports investment (${(signals.impressions || 0).toLocaleString()} impressions/month).`);
        break;
      case 'decay':
        if (signals.decaySeverity && signals.decaySeverity !== 'low') {
          parts.push(`Existing content is ${signals.decaySeverity === 'critical' ? 'critically' : 'noticeably'} declining.`);
        }
        break;
      case 'gap':
        if (signals.position === null || signals.position === undefined) {
          parts.push('No dedicated page exists for this query.');
        }
        break;
      case 'seasonality':
        if (signals.weeksToPeak !== null && signals.weeksToPeak !== undefined && signals.weeksToPeak <= 8) {
          parts.push('Timing is optimal — seasonal interest is rising.');
        }
        break;
      case 'competition':
        if (components.competition.score >= 80) {
          parts.push('Competitors are weak — thin content dominates SERPs.');
        }
        break;
    }
  }

  // Add priority label
  const total = scoring.total;
  if (total >= 75) {
    parts.push('Priority: HIGH — recommend immediate action.');
  } else if (total >= 50) {
    parts.push('Priority: MEDIUM — schedule for upcoming content sprint.');
  } else if (total >= 25) {
    parts.push('Priority: LOW — add to content backlog.');
  } else {
    parts.push('Priority: MINIMAL — monitor only.');
  }

  return parts.join(' ');
}

/**
 * Suggest content type based on the dominant scoring signals.
 *
 * @param {object} signals - Raw input signals
 * @param {object} scoring - Output from calculatePriority
 * @returns {string} Suggested content type
 */
function suggestContentType(signals, scoring) {
  const components = scoring.components;

  if (components.gap.score >= 100 && components.impressions.weighted >= 10) {
    return CONTENT_TYPE_MAP.high_impressions_no_page;
  }
  if (components.decay.score >= 70) {
    return CONTENT_TYPE_MAP.decaying_content;
  }
  if (components.gap.score >= 50) {
    return CONTENT_TYPE_MAP.gap_opportunity;
  }
  if (components.seasonality.score >= 100 && signals.weeksToPeak <= 8) {
    return CONTENT_TYPE_MAP.seasonal_peak;
  }
  if (components.competition.score >= 80) {
    return CONTENT_TYPE_MAP.low_competition;
  }
  return 'new-article';
}

// ── Data Fetching ──────────────────────────────────────────────

/**
 * Fetch keyword opportunities with aggregated signals for scoring.
 * Combines gap data, decay data, and performance data.
 *
 * @param {string} userId - User UUID
 * @param {object} [options] - Filter options
 * @param {string} [options.category] - Category filter
 * @returns {Promise<Array>} Array of topic candidates with signals
 */
async function fetchTopicCandidates(userId, options = {}) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  logger.info('topic_fetch_candidates_started', { userId, options });

  // Fetch keyword opportunities (gaps)
  const gaps = await fetchKeywordOpportunities(config, serviceRoleKey, userId);

  // Fetch performance data for impressions
  const perfData = await fetchPerformanceAggregates(config, serviceRoleKey, userId);

  // Build candidate list
  const candidates = [];

  for (const gap of gaps) {
    const keyword = gap.keyword;
    const perf = perfData[keyword] || {};

    const candidate = {
      keyword,
      category: gap.analysis_metadata?.category || options.category || 'general',
      impressions: gap.impressions || perf.impressions || 0,
      clicks: gap.clicks || perf.clicks || 0,
      position: gap.current_position,
      decaySeverity: gap.analysis_metadata?.decay_severity || null,
      weeksToPeak: gap.analysis_metadata?.weeks_to_peak || null,
      competitionType: gap.analysis_metadata?.competition_type || null,
      competing_urls: gap.competing_urls || [],
      source: 'keyword_opportunities',
      opportunity_id: gap.id || null
    };

    // Category filter
    if (options.category && candidate.category !== options.category) {
      continue;
    }

    candidates.push(candidate);
  }

  logger.info('topic_fetch_candidates_completed', { userId, count: candidates.length });
  return candidates;
}

/**
 * Fetch keyword opportunities from Supabase.
 */
async function fetchKeywordOpportunities(config, serviceRoleKey, userId) {
  const items = [];
  let offset = 0;

  while (true) {
    const url = `${config.url}/rest/v1/keyword_opportunities` +
      `?user_id=eq.${encodeURIComponent(userId)}` +
      `&select=id,keyword,opportunity_type,priority_score,impressions,clicks,current_position,competing_urls,recommended_action,status,analysis_metadata` +
      `&offset=${offset}&limit=${PAGE_SIZE}` +
      `&order=priority_score.desc`;

    const res = await fetch(url, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey
      }
    });

    if (!res.ok) {
      logger.error('topic_fetch_opportunities_failed', { status: res.status, userId });
      break;
    }

    const rows = await res.json();
    if (!rows || rows.length === 0) break;
    items.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return items;
}

/**
 * Fetch aggregated performance data (last 30 days) keyed by query.
 */
async function fetchPerformanceAggregates(config, serviceRoleKey, userId) {
  const aggregated = {};
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
      logger.error('topic_fetch_performance_failed', { status: res.status, userId });
      break;
    }

    const rows = await res.json();
    if (!rows || rows.length === 0) break;

    for (const row of rows) {
      const topQueries = (row.metadata && row.metadata.topQueries) || [];
      for (const q of topQueries) {
        const keyword = (q.query || q.keyword || '').toLowerCase().trim();
        if (!keyword) continue;

        if (!aggregated[keyword]) {
          aggregated[keyword] = { impressions: 0, clicks: 0, positions: [] };
        }
        aggregated[keyword].impressions += q.impressions || 0;
        aggregated[keyword].clicks += q.clicks || 0;
        if (q.position || q.avg_position) {
          aggregated[keyword].positions.push(q.position || q.avg_position);
        }
      }
    }

    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return aggregated;
}

// ── Recommendation Assembly ────────────────────────────────────

/**
 * Build scored and ranked recommendations from topic candidates.
 *
 * @param {string} userId - User UUID
 * @param {object} [options] - Filter and sort options
 * @param {string} [options.category] - Category filter
 * @param {string} [options.sort] - Sort field (priority_score, impressions)
 * @param {number} [options.page] - Page number
 * @param {number} [options.per_page] - Items per page
 * @returns {Promise<object>} Paginated recommendations with summary
 */
async function buildRecommendations(userId, options = {}) {
  logger.info('topic_build_recommendations_started', { userId, options });

  const candidates = await fetchTopicCandidates(userId, { category: options.category });

  // Score each candidate
  const scored = candidates.map(candidate => {
    const signals = {
      impressions: candidate.impressions,
      decaySeverity: candidate.decaySeverity,
      position: candidate.position,
      weeksToPeak: candidate.weeksToPeak,
      competitionType: candidate.competitionType
    };

    const scoring = calculatePriority(signals);
    const summary = generateSummary(signals, scoring);
    const contentType = suggestContentType(signals, scoring);

    return {
      id: candidate.opportunity_id || generateId(),
      keyword: candidate.keyword,
      category: candidate.category,
      priority_score: scoring.total,
      summary,
      suggested_content_type: contentType,
      evidence: {
        impressions: candidate.impressions,
        clicks: candidate.clicks,
        current_position: candidate.position,
        decay_severity: candidate.decaySeverity,
        weeks_to_peak: candidate.weeksToPeak,
        competition_type: candidate.competitionType,
        competing_urls: candidate.competing_urls
      },
      analysis_metadata: {
        scoring: scoring
      },
      status: 'pending',
      created_at: new Date().toISOString()
    };
  });

  // Sort
  const sortField = options.sort || 'priority_score';
  scored.sort((a, b) => {
    if (sortField === 'priority_score') return b.priority_score - a.priority_score;
    if (sortField === 'impressions') return (b.evidence.impressions || 0) - (a.evidence.impressions || 0);
    return b.priority_score - a.priority_score;
  });

  // Store for later retrieval
  recommendationStore.set(userId, scored);

  // Pagination
  const page = Math.max(1, parseInt(options.page || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(options.per_page || '20', 10)));
  const start = (page - 1) * perPage;
  const paginated = scored.slice(start, start + perPage);

  const result = {
    items: paginated,
    summary: {
      total: scored.length,
      avg_priority: scored.length > 0
        ? Math.round(scored.reduce((s, r) => s + r.priority_score, 0) / scored.length * 100) / 100
        : 0,
      by_content_type: countBy(scored, 'suggested_content_type'),
      by_priority: {
        high: scored.filter(r => r.priority_score >= 75).length,
        medium: scored.filter(r => r.priority_score >= 50 && r.priority_score < 75).length,
        low: scored.filter(r => r.priority_score >= 25 && r.priority_score < 50).length,
        minimal: scored.filter(r => r.priority_score < 25).length
      }
    },
    pagination: {
      page,
      per_page: perPage,
      total: scored.length,
      total_pages: Math.ceil(scored.length / perPage)
    }
  };

  logger.info('topic_build_recommendations_completed', { userId, total: scored.length });
  return result;
}

function countBy(items, key) {
  const counts = {};
  for (const item of items) {
    const val = item[key] || 'unknown';
    counts[val] = (counts[val] || 0) + 1;
  }
  return counts;
}

// ── API Handlers ───────────────────────────────────────────────

/**
 * Handle GET /api/intelligence/recommendations — paginated list.
 * Supports ?category=&sort=&page=&per_page=
 *
 * @param {string} userId - User UUID
 * @param {object} query - URL query parameters
 * @returns {Promise<object>} API response data
 */
async function handleRecommendationList(userId, query) {
  logger.info('topic_recommendation_list_started', { userId, query });

  const result = await buildRecommendations(userId, {
    category: query.category || '',
    sort: query.sort || 'priority_score',
    page: query.page || '1',
    per_page: query.per_page || '20'
  });

  return result;
}

/**
 * Handle GET /api/intelligence/recommendations/:id — single recommendation detail.
 *
 * @param {string} userId - User UUID
 * @param {string} recommendationId - Recommendation UUID
 * @returns {Promise<object|null>} Recommendation detail or null
 */
async function handleRecommendationDetail(userId, recommendationId) {
  logger.info('topic_recommendation_detail_started', { userId, recommendationId });

  // Check in-memory store first
  const stored = recommendationStore.get(userId);
  if (stored) {
    const found = stored.find(r => r.id === recommendationId);
    if (found) return found;
  }

  // If not in memory, rebuild recommendations and search
  const result = await buildRecommendations(userId, {});
  const item = result.items.find(r => r.id === recommendationId);

  if (!item) {
    // Search full list (not just paginated)
    const allStored = recommendationStore.get(userId);
    if (allStored) {
      return allStored.find(r => r.id === recommendationId) || null;
    }
  }

  return item || null;
}

/**
 * Handle PATCH /api/intelligence/recommendations/:id/status — update status.
 *
 * @param {string} userId - User UUID
 * @param {string} recommendationId - Recommendation UUID
 * @param {object} body - Request body with { status }
 * @returns {object} Result
 */
async function handleStatusUpdate(userId, recommendationId, body) {
  logger.info('topic_status_update_started', { userId, recommendationId, status: body.status });

  const newStatus = (body.status || '').toLowerCase().trim();
  if (!VALID_STATUSES.includes(newStatus)) {
    return { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` };
  }

  // Update in-memory store
  const stored = recommendationStore.get(userId);
  if (!stored) {
    return { error: 'No recommendations found. Run a recommendations scan first.' };
  }

  const item = stored.find(r => r.id === recommendationId);
  if (!item) {
    return { error: 'Recommendation not found' };
  }

  const previousStatus = item.status;
  item.status = newStatus;
  item.updated_at = new Date().toISOString();

  // Also update in Supabase if the item has an opportunity_id
  if (item.id) {
    try {
      const { config, serviceRoleKey } = getSupabaseAdmin();
      const patchUrl = `${config.url}/rest/v1/keyword_opportunities` +
        `?id=eq.${encodeURIComponent(item.id)}` +
        `&user_id=eq.${encodeURIComponent(userId)}`;

      await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': 'Bearer ' + serviceRoleKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {
      logger.error('topic_status_update_db_failed', { error: e.message });
      // Non-fatal — in-memory update succeeded
    }
  }

  logger.info('topic_status_update_completed', { userId, recommendationId, previousStatus, newStatus });

  return {
    id: item.id,
    keyword: item.keyword,
    previous_status: previousStatus,
    status: newStatus,
    updated_at: item.updated_at
  };
}

/**
 * Handle POST /api/intelligence/recommendations/:id/execute — queue recommendation for article pipeline.
 *
 * @param {string} userId - User UUID
 * @param {string} recommendationId - Recommendation UUID
 * @returns {object} Execution result
 */
async function handleExecute(userId, recommendationId) {
  logger.info('topic_execute_started', { userId, recommendationId });

  const stored = recommendationStore.get(userId);
  if (!stored) {
    return { error: 'No recommendations found. Run a recommendations scan first.' };
  }

  const item = stored.find(r => r.id === recommendationId);
  if (!item) {
    return { error: 'Recommendation not found' };
  }

  // Mark as in_progress
  item.status = 'in_progress';
  item.updated_at = new Date().toISOString();

  const execution = {
    recommendation_id: item.id,
    keyword: item.keyword,
    suggested_content_type: item.suggested_content_type,
    priority_score: item.priority_score,
    status: 'queued',
    queued_at: new Date().toISOString(),
    message: `Topic "${item.keyword}" queued for article generation pipeline.`
  };

  logger.info('topic_execute_completed', { userId, recommendationId, keyword: item.keyword });
  return execution;
}

/**
 * Handle POST /api/intelligence/recommendations/run — trigger a full recommendation scan.
 *
 * @param {string} userId - User UUID
 * @param {object} body - Optional body with { category }
 * @returns {object} Run status
 */
async function handleRun(userId, body = {}) {
  const runId = generateId();
  logger.info('topic_run_started', { userId, runId });

  const run = {
    run_id: runId,
    user_id: userId,
    status: 'running',
    category: body.category || null,
    started_at: new Date().toISOString(),
    completed_at: null,
    result_count: 0,
    error: null
  };

  runStore.set(runId, run);

  // Run asynchronously
  buildRecommendations(userId, { category: body.category || '' })
    .then(result => {
      run.status = 'completed';
      run.completed_at = new Date().toISOString();
      run.result_count = result.summary.total;
      logger.info('topic_run_completed', { userId, runId, total: result.summary.total });
    })
    .catch(err => {
      run.status = 'failed';
      run.completed_at = new Date().toISOString();
      run.error = err.message;
      logger.error('topic_run_failed', { userId, runId, error: err.message });
    });

  return run;
}

/**
 * Handle GET /api/intelligence/recommendations/run/:runId — check run status.
 *
 * @param {string} userId - User UUID
 * @param {string} runId - Run UUID
 * @returns {object|null} Run status or null
 */
async function handleRunStatus(userId, runId) {
  logger.info('topic_run_status_checked', { userId, runId });

  const run = runStore.get(runId);
  if (!run) return null;
  if (run.user_id !== userId) return null;

  return run;
}

// ── Exports ────────────────────────────────────────────────────

module.exports = {
  // Scoring components
  scoreImpressions,
  scoreDecay,
  scoreGap,
  scoreSeasonality,
  scoreCompetition,
  calculatePriority,
  // Summary generation
  generateSummary,
  suggestContentType,
  // Recommendation assembly
  buildRecommendations,
  fetchTopicCandidates,
  // API handlers
  handleRecommendationList,
  handleRecommendationDetail,
  handleStatusUpdate,
  handleExecute,
  handleRun,
  handleRunStatus,
  // Helpers (exported for testing)
  formatDate,
  generateId,
  // Constants (exported for testing)
  WEIGHTS,
  VALID_STATUSES
};
