/**
 * Semrush API Connector — CI-004
 *
 * Wraps the Semrush API with:
 * - Domain analytics (organic search positions, traffic)
 * - Keyword gap analysis (domain vs competitors)
 * - Topic research (related topics and questions)
 * - 7-day caching layer (skip API call if data < 7 days old)
 * - API cost tracking (units/rows per sync logged)
 * - Graceful degradation (works without API key)
 * - Error handling: 401→alert, 429→backoff, quota→pause+cache
 *
 * API keys resolved from:
 * 1. SEMRUSH_API_KEY env var (ChainIQ-owned, primary)
 * 2. Client-specific encrypted key via KeyManager (optional override)
 *
 * Zero npm dependencies — Node.js built-ins only.
 */

const logger = require('../logger');
const supabase = require('../supabase-client');

// ── Constants ──────────────────────────────────────────────────

const SEMRUSH_API_BASE = 'https://api.semrush.com';

// Cache TTL: 7 days in milliseconds
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Batch size for upserting to Supabase
const UPSERT_BATCH_SIZE = 500;

// Retry backoff delays (5s, 15s, 45s)
const RETRY_DELAYS = [5000, 15000, 45000];

// Maximum rows per Semrush API call
const MAX_ROWS = 100;

// ── Helper: sleep ──────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Helper: get Supabase admin config ─────────────────────────

function getSupabaseAdmin() {
  const config = supabase.loadConfig();
  const serviceRoleKey = supabase.getServiceRoleKey();
  if (!config || !serviceRoleKey) {
    throw new Error('Supabase admin config not available. Set SUPABASE_SERVICE_ROLE_KEY env var.');
  }
  return { config, serviceRoleKey };
}

// ── API Key Resolution ─────────────────────────────────────────

/**
 * Resolve the Semrush API key for a given user.
 * Priority: client-specific encrypted key > SEMRUSH_API_KEY env var
 *
 * @param {string} userId - User UUID (for client key lookup)
 * @param {object} [keyManager] - Optional KeyManager instance
 * @returns {Promise<string|null>} API key or null if unavailable
 */
async function resolveApiKey(userId, keyManager) {
  // Try client-specific key first (if KeyManager provided)
  if (keyManager && userId) {
    try {
      const clientKey = await keyManager.resolveKey('semrush_api_key', userId);
      if (clientKey) {
        logger.debug('semrush_using_client_key', { userId });
        return clientKey;
      }
    } catch (e) {
      logger.warn('semrush_client_key_resolve_failed', { userId, error: e.message });
    }
  }

  // Fall back to ChainIQ-owned env var
  const envKey = process.env.SEMRUSH_API_KEY;
  if (envKey) {
    logger.debug('semrush_using_env_key', {});
    return envKey;
  }

  return null;
}

// ── Custom Error Class ─────────────────────────────────────────

class SemrushError extends Error {
  constructor(message, statusCode, unrecoverable) {
    super(message);
    this.name = 'SemrushError';
    this.statusCode = statusCode;
    this.unrecoverable = unrecoverable;
  }
}

// ── Cache Check ────────────────────────────────────────────────

/**
 * Check if cached data exists and is less than 7 days old.
 *
 * @param {string} userId - User UUID
 * @param {string} cacheType - Cache type identifier (e.g. 'semrush_domain_analytics')
 * @param {string} cacheKey - Cache key (e.g. domain name)
 * @returns {Promise<object|null>} Cached data or null if stale/missing
 */
async function checkCache(userId, cacheType, cacheKey) {
  try {
    const { config, serviceRoleKey } = getSupabaseAdmin();
    const now = new Date();
    const cutoff = new Date(now.getTime() - CACHE_TTL_MS).toISOString();

    const res = await fetch(
      `${config.url}/rest/v1/data_cache?user_id=eq.${encodeURIComponent(userId)}&cache_type=eq.${encodeURIComponent(cacheType)}&cache_key=eq.${encodeURIComponent(cacheKey)}&updated_at=gt.${cutoff}&select=data,updated_at&limit=1&order=updated_at.desc`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': 'Bearer ' + serviceRoleKey
        }
      }
    );

    if (!res.ok) return null;
    const rows = await res.json();
    if (rows.length === 0) return null;

    const age = now.getTime() - new Date(rows[0].updated_at).getTime();
    logger.info('semrush_cache_hit', { cacheType, cacheKey, ageDays: (age / (24 * 60 * 60 * 1000)).toFixed(1) });
    return rows[0].data;
  } catch (e) {
    logger.warn('semrush_cache_check_failed', { cacheType, cacheKey, error: e.message });
    return null;
  }
}

/**
 * Store data in cache.
 *
 * @param {string} userId - User UUID
 * @param {string} cacheType - Cache type identifier
 * @param {string} cacheKey - Cache key
 * @param {object} data - Data to cache
 */
async function updateCache(userId, cacheType, cacheKey, data) {
  try {
    const { config, serviceRoleKey } = getSupabaseAdmin();

    await fetch(
      `${config.url}/rest/v1/data_cache`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': 'Bearer ' + serviceRoleKey,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          user_id: userId,
          cache_type: cacheType,
          cache_key: cacheKey,
          data,
          updated_at: new Date().toISOString()
        })
      }
    );

    logger.debug('semrush_cache_updated', { cacheType, cacheKey });
  } catch (e) {
    logger.warn('semrush_cache_update_failed', { cacheType, cacheKey, error: e.message });
  }
}

// ── Semrush API Request with Error Handling ────────────────────

/**
 * Make a Semrush API request with retry and error handling.
 *
 * Error handling:
 * - 401/403: Invalid key, alert and mark unrecoverable
 * - 429: Rate limited, exponential backoff
 * - Quota exceeded: Pause and use cached data
 * - 5xx: Server error, retry with backoff
 *
 * @param {string} endpoint - API endpoint path
 * @param {object} params - Query parameters
 * @param {string} apiKey - Semrush API key
 * @returns {Promise<string>} Raw API response text (Semrush returns CSV/semicolon-delimited)
 */
async function semrushApiRequest(endpoint, params, apiKey) {
  let lastError = null;

  const queryParams = new URLSearchParams({ ...params, key: apiKey });
  const url = `${SEMRUSH_API_BASE}/${endpoint}?${queryParams.toString()}`;

  for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
    try {
      const res = await fetch(url, { method: 'GET' });

      if (res.ok) {
        const text = await res.text();

        // Semrush returns error messages in response body even with 200
        if (text.startsWith('ERROR')) {
          if (text.includes('NOTHING FOUND')) {
            return ''; // No data — not an error
          }
          if (text.includes('WRONG API KEY') || text.includes('ACCESS DENIED')) {
            logger.error('semrush_auth_failed', { endpoint, error: text });
            throw new SemrushError('Semrush API key invalid: ' + text, 401, true);
          }
          if (text.includes('API UNITS BALANCE IS ZERO') || text.includes('LIMIT REACHED')) {
            logger.warn('semrush_quota_exceeded', { endpoint, error: text });
            throw new SemrushError('Semrush quota exceeded: ' + text, 429, true);
          }
          throw new SemrushError('Semrush API error: ' + text, 400, false);
        }

        return text;
      }

      const status = res.status;
      const errText = await res.text().catch(() => 'Unknown error');

      // 401/403 — Auth failure (unrecoverable)
      if (status === 401 || status === 403) {
        logger.error('semrush_auth_error', { endpoint, status, error: errText });
        throw new SemrushError('Semrush authentication failed: ' + errText, status, true);
      }

      // 429 — Rate limited (retryable with backoff)
      if (status === 429) {
        logger.warn('semrush_rate_limited', { endpoint, attempt: attempt + 1 });
        lastError = new SemrushError('Rate limited', 429, false);
        if (attempt < RETRY_DELAYS.length - 1) {
          await sleep(RETRY_DELAYS[attempt]);
        }
        continue;
      }

      // 5xx — Server error (retryable)
      if (status >= 500) {
        logger.warn('semrush_server_error', { endpoint, status, attempt: attempt + 1 });
        lastError = new SemrushError('Server error: ' + errText, status, false);
        if (attempt < RETRY_DELAYS.length - 1) {
          await sleep(RETRY_DELAYS[attempt]);
        }
        continue;
      }

      // Other errors
      throw new SemrushError('Semrush API error: ' + errText, status, true);

    } catch (e) {
      if (e instanceof SemrushError && e.unrecoverable) throw e;
      if (e instanceof SemrushError) {
        lastError = e;
      } else {
        lastError = new SemrushError(e.message, 0, false);
        logger.warn('semrush_request_error', { endpoint, attempt: attempt + 1, error: e.message });
      }
      if (attempt < RETRY_DELAYS.length - 1) {
        await sleep(RETRY_DELAYS[attempt]);
      }
    }
  }

  throw lastError || new SemrushError('Semrush API request failed after 3 attempts', 0, true);
}

// ── Response Parser ────────────────────────────────────────────

/**
 * Parse Semrush semicolon-delimited response into array of objects.
 * First line is header row, subsequent lines are data.
 *
 * @param {string} text - Raw Semrush response
 * @returns {Array<object>} Parsed rows
 */
function parseSemrushResponse(text) {
  if (!text || !text.trim()) return [];

  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(';').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';');
    if (values.length < headers.length) continue;

    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ? values[j].trim() : '';
    }
    rows.push(row);
  }

  return rows;
}

// ── Core API Methods ───────────────────────────────────────────

/**
 * Fetch domain analytics (organic search overview).
 * Returns top keywords, traffic, and position data for a domain.
 *
 * @param {string} domain - Target domain (e.g. 'example.com')
 * @param {string} userId - User UUID
 * @param {string} apiKey - Semrush API key
 * @param {object} [options] - { database: 'us' (default), limit: 100 }
 * @returns {Promise<object>} Domain analytics data
 */
async function fetchDomainAnalytics(domain, userId, apiKey, options = {}) {
  const cacheType = 'semrush_domain_analytics';
  const cached = await checkCache(userId, cacheType, domain);
  if (cached) return cached;

  const database = options.database || 'us';
  const limit = options.limit || MAX_ROWS;

  logger.info('semrush_fetch_domain_analytics', { domain, database, limit });

  // Domain overview
  const overviewText = await semrushApiRequest('', {
    type: 'domain_ranks',
    domain,
    database,
    export_columns: 'Dn,Rk,Or,Ot,Oc,Ad,At,Ac'
  }, apiKey);

  const overview = parseSemrushResponse(overviewText);

  // Organic keywords
  const keywordsText = await semrushApiRequest('', {
    type: 'domain_organic',
    domain,
    database,
    display_limit: limit,
    export_columns: 'Ph,Po,Nq,Cp,Ur,Tr,Tc,Co,Nr'
  }, apiKey);

  const keywords = parseSemrushResponse(keywordsText);

  const result = {
    domain,
    database,
    overview: overview[0] || {},
    keywords,
    fetchedAt: new Date().toISOString(),
    rowCount: keywords.length,
    apiUnits: 1 + Math.ceil(keywords.length / 10) // Approximate unit cost
  };

  // Log cost tracking
  logger.info('semrush_cost_tracking', {
    operation: 'domain_analytics',
    domain,
    rows: keywords.length,
    estimatedUnits: result.apiUnits
  });

  await updateCache(userId, cacheType, domain, result);
  return result;
}

/**
 * Fetch keyword gap analysis between domain and competitors.
 *
 * @param {string} domain - Target domain
 * @param {string[]} competitors - Competitor domains (max 4)
 * @param {string} userId - User UUID
 * @param {string} apiKey - Semrush API key
 * @param {object} [options] - { database: 'us', limit: 100 }
 * @returns {Promise<object>} Keyword gap data
 */
async function fetchKeywordGap(domain, competitors, userId, apiKey, options = {}) {
  const cacheKey = `${domain}:${competitors.sort().join(',')}`;
  const cacheType = 'semrush_keyword_gap';
  const cached = await checkCache(userId, cacheType, cacheKey);
  if (cached) return cached;

  const database = options.database || 'us';
  const limit = options.limit || MAX_ROWS;

  logger.info('semrush_fetch_keyword_gap', { domain, competitors, database });

  // Build domains parameter (domain|competitor1|competitor2...)
  const domains = [domain, ...competitors.slice(0, 4)];
  const domainsParam = domains.map((d, i) => `${i === 0 ? '+' : '-'}|or|${d}`).join('|');

  const text = await semrushApiRequest('analytics/v1/domain_domains', {
    domains: domainsParam,
    database,
    display_limit: limit,
    export_columns: 'Ph,Nq,Cp,Co,Nr,Td'
  }, apiKey);

  const keywords = parseSemrushResponse(text);

  const result = {
    domain,
    competitors,
    database,
    gapKeywords: keywords,
    fetchedAt: new Date().toISOString(),
    rowCount: keywords.length,
    apiUnits: Math.ceil(keywords.length / 10) + 1
  };

  logger.info('semrush_cost_tracking', {
    operation: 'keyword_gap',
    domain,
    rows: keywords.length,
    estimatedUnits: result.apiUnits
  });

  await updateCache(userId, cacheType, cacheKey, result);
  return result;
}

/**
 * Fetch topic research data for a keyword.
 *
 * @param {string} keyword - Target keyword
 * @param {string} userId - User UUID
 * @param {string} apiKey - Semrush API key
 * @param {object} [options] - { database: 'us', limit: 100 }
 * @returns {Promise<object>} Topic research data
 */
async function fetchTopicResearch(keyword, userId, apiKey, options = {}) {
  const cacheType = 'semrush_topic_research';
  const cached = await checkCache(userId, cacheType, keyword);
  if (cached) return cached;

  const database = options.database || 'us';
  const limit = options.limit || MAX_ROWS;

  logger.info('semrush_fetch_topic_research', { keyword, database });

  // Related keywords
  const relatedText = await semrushApiRequest('', {
    type: 'phrase_related',
    phrase: keyword,
    database,
    display_limit: limit,
    export_columns: 'Ph,Nq,Cp,Co,Nr,Td'
  }, apiKey);

  const relatedKeywords = parseSemrushResponse(relatedText);

  // Keyword questions (people also ask)
  const questionsText = await semrushApiRequest('', {
    type: 'phrase_questions',
    phrase: keyword,
    database,
    display_limit: limit,
    export_columns: 'Ph,Nq,Cp,Co,Nr'
  }, apiKey);

  const questions = parseSemrushResponse(questionsText);

  const result = {
    keyword,
    database,
    relatedKeywords,
    questions,
    fetchedAt: new Date().toISOString(),
    rowCount: relatedKeywords.length + questions.length,
    apiUnits: 2 + Math.ceil((relatedKeywords.length + questions.length) / 10)
  };

  logger.info('semrush_cost_tracking', {
    operation: 'topic_research',
    keyword,
    rows: result.rowCount,
    estimatedUnits: result.apiUnits
  });

  await updateCache(userId, cacheType, keyword, result);
  return result;
}

// ── Data Enrichment ────────────────────────────────────────────

/**
 * Enrich keyword_opportunities table with Semrush data.
 *
 * @param {string} userId - User UUID
 * @param {object} analyticsData - Domain analytics result
 */
async function enrichKeywordOpportunities(userId, analyticsData) {
  if (!analyticsData || !analyticsData.keywords || analyticsData.keywords.length === 0) return;

  try {
    const { config, serviceRoleKey } = getSupabaseAdmin();

    const batch = analyticsData.keywords.map(kw => ({
      user_id: userId,
      keyword: kw.Ph || kw.Keyword || '',
      source: 'semrush',
      search_volume: parseInt(kw.Nq || '0', 10),
      cpc: parseFloat(kw.Cp || '0'),
      competition: parseFloat(kw.Co || '0'),
      current_position: parseInt(kw.Po || '0', 10),
      url: kw.Ur || null,
      traffic_estimate: parseInt(kw.Tr || '0', 10),
      updated_at: new Date().toISOString(),
      metadata: { semrush_rank: kw.Nr || null, traffic_cost: kw.Tc || null }
    })).filter(r => r.keyword);

    // Batch upsert
    for (let i = 0; i < batch.length; i += UPSERT_BATCH_SIZE) {
      const chunk = batch.slice(i, i + UPSERT_BATCH_SIZE);
      await fetch(
        `${config.url}/rest/v1/keyword_opportunities`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': 'Bearer ' + serviceRoleKey,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(chunk)
        }
      );
    }

    logger.info('semrush_enriched_keywords', { userId, count: batch.length });
  } catch (e) {
    logger.error('semrush_enrich_keywords_failed', { userId, error: e.message });
  }
}

/**
 * Enrich performance_snapshots with Semrush traffic data.
 *
 * @param {string} userId - User UUID
 * @param {object} analyticsData - Domain analytics result
 */
async function enrichPerformanceSnapshots(userId, analyticsData) {
  if (!analyticsData || !analyticsData.overview) return;

  try {
    const { config, serviceRoleKey } = getSupabaseAdmin();
    const overview = analyticsData.overview;

    const snapshot = {
      user_id: userId,
      source: 'semrush',
      snapshot_date: new Date().toISOString().split('T')[0],
      url: analyticsData.domain,
      metadata: {
        organic_keywords: parseInt(overview.Or || '0', 10),
        organic_traffic: parseInt(overview.Ot || '0', 10),
        organic_cost: parseFloat(overview.Oc || '0'),
        adwords_keywords: parseInt(overview.Ad || '0', 10),
        adwords_traffic: parseInt(overview.At || '0', 10),
        adwords_cost: parseFloat(overview.Ac || '0'),
        semrush_rank: parseInt(overview.Rk || '0', 10)
      },
      updated_at: new Date().toISOString()
    };

    await fetch(
      `${config.url}/rest/v1/performance_snapshots`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': 'Bearer ' + serviceRoleKey,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(snapshot)
      }
    );

    logger.info('semrush_enriched_snapshots', { userId, domain: analyticsData.domain });
  } catch (e) {
    logger.error('semrush_enrich_snapshots_failed', { userId, error: e.message });
  }
}

// ── Connection Helper ──────────────────────────────────────────

/**
 * Get the Semrush connection for a user.
 *
 * @param {string} userId - User UUID
 * @returns {Promise<object|null>} Connection row or null
 */
async function getSemrushConnection(userId) {
  try {
    const { config, serviceRoleKey } = getSupabaseAdmin();

    const res = await fetch(
      `${config.url}/rest/v1/client_connections?user_id=eq.${encodeURIComponent(userId)}&source=eq.semrush&select=*&limit=1`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': 'Bearer ' + serviceRoleKey
        }
      }
    );

    if (!res.ok) return null;
    const rows = await res.json();
    return rows[0] || null;
  } catch (e) {
    logger.error('semrush_get_connection_failed', { userId, error: e.message });
    return null;
  }
}

/**
 * Update connection status and sync metadata.
 *
 * @param {string} connectionId - Connection UUID
 * @param {string} status - 'connected' | 'error' | 'stale'
 * @param {string|null} error - Error message or null
 * @param {object} [syncMeta] - Additional sync metadata
 */
async function updateConnectionStatus(connectionId, status, error, syncMeta) {
  try {
    const { config, serviceRoleKey } = getSupabaseAdmin();

    const body = {
      status,
      updated_at: new Date().toISOString()
    };
    if (error) body.last_error = error;
    if (status === 'connected') {
      body.last_sync_at = new Date().toISOString();
      body.last_error = null;
    }
    if (syncMeta) body.metadata = syncMeta;

    await fetch(
      `${config.url}/rest/v1/client_connections?id=eq.${encodeURIComponent(connectionId)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': 'Bearer ' + serviceRoleKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(body)
      }
    );
  } catch (e) {
    logger.warn('semrush_update_connection_failed', { connectionId, error: e.message });
  }
}

// ── Trigger Handler ────────────────────────────────────────────

/**
 * Handle POST /api/ingestion/trigger/semrush
 *
 * Triggers a Semrush sync. Requires domain in connection metadata or body.
 *
 * @param {string} userId - Authenticated user ID
 * @param {object} body - { domain?, competitors?, keyword?, keyManager? }
 * @returns {Promise<object>} Job result
 */
async function handleTrigger(userId, body = {}) {
  const keyManager = body.keyManager || null;
  const apiKey = await resolveApiKey(userId, keyManager);

  if (!apiKey) {
    logger.info('semrush_skipped_no_key', { userId });
    return {
      success: true,
      data: {
        status: 'skipped',
        message: 'No Semrush API key configured. Set SEMRUSH_API_KEY env var or add a client key.'
      }
    };
  }

  const connection = await getSemrushConnection(userId);
  const domain = body.domain || (connection && connection.metadata && connection.metadata.domain) || null;

  if (!domain) {
    return {
      success: false,
      error: 'No domain configured. Provide domain in request body or connection metadata.',
      statusCode: 400
    };
  }

  logger.info('semrush_trigger', { userId, domain, connectionId: connection ? connection.id : null });

  let totalUnits = 0;
  let totalRows = 0;
  const results = {};

  try {
    // 1. Domain analytics
    const analytics = await fetchDomainAnalytics(domain, userId, apiKey, body);
    results.domainAnalytics = { rowCount: analytics.rowCount, apiUnits: analytics.apiUnits };
    totalUnits += analytics.apiUnits;
    totalRows += analytics.rowCount;

    // Enrich tables
    await enrichKeywordOpportunities(userId, analytics);
    await enrichPerformanceSnapshots(userId, analytics);

    // 2. Keyword gap (if competitors provided)
    if (body.competitors && Array.isArray(body.competitors) && body.competitors.length > 0) {
      const gap = await fetchKeywordGap(domain, body.competitors, userId, apiKey, body);
      results.keywordGap = { rowCount: gap.rowCount, apiUnits: gap.apiUnits };
      totalUnits += gap.apiUnits;
      totalRows += gap.rowCount;
    }

    // 3. Topic research (if keyword provided)
    if (body.keyword) {
      const topics = await fetchTopicResearch(body.keyword, userId, apiKey, body);
      results.topicResearch = { rowCount: topics.rowCount, apiUnits: topics.apiUnits };
      totalUnits += topics.apiUnits;
      totalRows += topics.rowCount;
    }

    // Update connection status
    if (connection) {
      await updateConnectionStatus(connection.id, 'connected', null, {
        domain,
        last_sync: {
          totalUnits,
          totalRows,
          completedAt: new Date().toISOString()
        }
      });
    }

    logger.info('semrush_sync_complete', { userId, domain, totalUnits, totalRows });

    return {
      success: true,
      data: {
        status: 'completed',
        domain,
        totalUnits,
        totalRows,
        results
      }
    };

  } catch (e) {
    logger.error('semrush_sync_failed', { userId, domain, error: e.message, statusCode: e.statusCode });

    if (connection) {
      await updateConnectionStatus(connection.id, 'error', e.message);
    }

    // For quota errors, return partial success with cached data
    if (e instanceof SemrushError && (e.statusCode === 429 || e.message.includes('quota'))) {
      return {
        success: true,
        data: {
          status: 'partial',
          message: 'Semrush quota/rate limit reached. Using cached data where available.',
          domain,
          totalUnits,
          totalRows,
          results
        }
      };
    }

    return {
      success: false,
      error: e.message,
      statusCode: e.statusCode || 500
    };
  }
}

/**
 * Handle GET /api/ingestion/semrush/status
 *
 * @param {string} userId - Authenticated user ID
 * @returns {Promise<object>} Sync status
 */
async function handleStatus(userId) {
  const connection = await getSemrushConnection(userId);
  const hasEnvKey = !!process.env.SEMRUSH_API_KEY;

  if (!connection) {
    return {
      success: true,
      data: {
        connected: false,
        hasApiKey: hasEnvKey,
        status: hasEnvKey ? 'key_available' : 'not_configured',
        message: hasEnvKey
          ? 'Semrush API key available. Create a connection to start syncing.'
          : 'No Semrush API key configured.'
      }
    };
  }

  return {
    success: true,
    data: {
      connected: connection.status === 'connected',
      connectionStatus: connection.status,
      hasApiKey: hasEnvKey,
      domain: connection.metadata ? connection.metadata.domain : null,
      lastSyncAt: connection.last_sync_at,
      lastError: connection.last_error,
      syncMetadata: connection.metadata ? connection.metadata.last_sync : null
    }
  };
}

// ── Exports ───────────────────────────────────────────────────

module.exports = {
  handleTrigger,
  handleStatus,
  // Core API methods (exported for testing)
  fetchDomainAnalytics,
  fetchKeywordGap,
  fetchTopicResearch,
  // Helpers (exported for testing)
  resolveApiKey,
  parseSemrushResponse,
  checkCache,
  updateCache,
  enrichKeywordOpportunities,
  enrichPerformanceSnapshots,
  getSemrushConnection,
  updateConnectionStatus,
  semrushApiRequest,
  SemrushError,
  // Constants
  CACHE_TTL_MS,
  UPSERT_BATCH_SIZE,
  RETRY_DELAYS,
  MAX_ROWS
};
