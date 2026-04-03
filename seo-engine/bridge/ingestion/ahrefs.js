/**
 * Ahrefs API Connector — CI-004
 *
 * Wraps the Ahrefs API v3 with:
 * - Backlink profile (referring domains, backlinks)
 * - Domain rating (DR score, history)
 * - Keyword explorer (keyword difficulty, volume, SERP)
 * - 7-day caching layer (skip API call if data < 7 days old)
 * - API cost tracking (rows per sync logged)
 * - Graceful degradation (works without API key)
 * - Error handling: 401→alert, 429→backoff, quota→pause+cache
 *
 * API keys resolved from:
 * 1. AHREFS_API_TOKEN env var (ChainIQ-owned, primary)
 * 2. Client-specific encrypted key via KeyManager (optional override)
 *
 * Zero npm dependencies — Node.js built-ins only.
 */

const logger = require('../logger');
const supabase = require('../supabase-client');

// ── Constants ──────────────────────────────────────────────────

const AHREFS_API_BASE = 'https://api.ahrefs.com/v3';

// Cache TTL: 7 days in milliseconds
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Batch size for upserting to Supabase
const UPSERT_BATCH_SIZE = 500;

// Retry backoff delays (5s, 15s, 45s)
const RETRY_DELAYS = [5000, 15000, 45000];

// Maximum rows per Ahrefs API call
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
 * Resolve the Ahrefs API token for a given user.
 * Priority: client-specific encrypted key > AHREFS_API_TOKEN env var
 *
 * @param {string} userId - User UUID (for client key lookup)
 * @param {object} [keyManager] - Optional KeyManager instance
 * @returns {Promise<string|null>} API token or null if unavailable
 */
async function resolveApiKey(userId, keyManager) {
  // Try client-specific key first (if KeyManager provided)
  if (keyManager && userId) {
    try {
      const clientKey = await keyManager.resolveKey('ahrefs_api_token', userId);
      if (clientKey) {
        logger.debug('ahrefs_using_client_key', { userId });
        return clientKey;
      }
    } catch (e) {
      logger.warn('ahrefs_client_key_resolve_failed', { userId, error: e.message });
    }
  }

  // Fall back to ChainIQ-owned env var
  const envKey = process.env.AHREFS_API_TOKEN;
  if (envKey) {
    logger.debug('ahrefs_using_env_key', {});
    return envKey;
  }

  return null;
}

// ── Custom Error Class ─────────────────────────────────────────

class AhrefsError extends Error {
  constructor(message, statusCode, unrecoverable) {
    super(message);
    this.name = 'AhrefsError';
    this.statusCode = statusCode;
    this.unrecoverable = unrecoverable;
  }
}

// ── Cache Check ────────────────────────────────────────────────

/**
 * Check if cached data exists and is less than 7 days old.
 *
 * @param {string} userId - User UUID
 * @param {string} cacheType - Cache type identifier (e.g. 'ahrefs_backlinks')
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
    logger.info('ahrefs_cache_hit', { cacheType, cacheKey, ageDays: (age / (24 * 60 * 60 * 1000)).toFixed(1) });
    return rows[0].data;
  } catch (e) {
    logger.warn('ahrefs_cache_check_failed', { cacheType, cacheKey, error: e.message });
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

    logger.debug('ahrefs_cache_updated', { cacheType, cacheKey });
  } catch (e) {
    logger.warn('ahrefs_cache_update_failed', { cacheType, cacheKey, error: e.message });
  }
}

// ── Ahrefs API Request with Error Handling ─────────────────────

/**
 * Make an Ahrefs API v3 request with retry and error handling.
 *
 * Ahrefs v3 uses Bearer token auth and returns JSON.
 *
 * Error handling:
 * - 401/403: Invalid token, alert and mark unrecoverable
 * - 429: Rate limited, exponential backoff
 * - 402: Payment required / quota exceeded
 * - 5xx: Server error, retry with backoff
 *
 * @param {string} endpoint - API endpoint path (e.g. 'site-explorer/backlinks')
 * @param {object} params - Query parameters
 * @param {string} apiToken - Ahrefs API token
 * @returns {Promise<object>} Parsed JSON response
 */
async function ahrefsApiRequest(endpoint, params, apiToken) {
  let lastError = null;

  const queryParams = new URLSearchParams(params);
  const url = `${AHREFS_API_BASE}/${endpoint}?${queryParams.toString()}`;

  for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json'
        }
      });

      if (res.ok) {
        return await res.json();
      }

      const status = res.status;
      const errBody = await res.json().catch(() => ({}));
      const errMsg = errBody.error || errBody.message || res.statusText;

      // 401/403 — Auth failure (unrecoverable)
      if (status === 401 || status === 403) {
        logger.error('ahrefs_auth_error', { endpoint, status, error: errMsg });
        throw new AhrefsError('Ahrefs authentication failed: ' + errMsg, status, true);
      }

      // 402 — Payment required / quota (unrecoverable for this sync)
      if (status === 402) {
        logger.warn('ahrefs_quota_exceeded', { endpoint, error: errMsg });
        throw new AhrefsError('Ahrefs quota exceeded: ' + errMsg, 402, true);
      }

      // 429 — Rate limited (retryable with backoff)
      if (status === 429) {
        logger.warn('ahrefs_rate_limited', { endpoint, attempt: attempt + 1 });
        lastError = new AhrefsError('Rate limited', 429, false);
        if (attempt < RETRY_DELAYS.length - 1) {
          await sleep(RETRY_DELAYS[attempt]);
        }
        continue;
      }

      // 5xx — Server error (retryable)
      if (status >= 500) {
        logger.warn('ahrefs_server_error', { endpoint, status, attempt: attempt + 1 });
        lastError = new AhrefsError('Server error: ' + errMsg, status, false);
        if (attempt < RETRY_DELAYS.length - 1) {
          await sleep(RETRY_DELAYS[attempt]);
        }
        continue;
      }

      // Other errors
      throw new AhrefsError('Ahrefs API error: ' + errMsg, status, true);

    } catch (e) {
      if (e instanceof AhrefsError && e.unrecoverable) throw e;
      if (e instanceof AhrefsError) {
        lastError = e;
      } else {
        lastError = new AhrefsError(e.message, 0, false);
        logger.warn('ahrefs_request_error', { endpoint, attempt: attempt + 1, error: e.message });
      }
      if (attempt < RETRY_DELAYS.length - 1) {
        await sleep(RETRY_DELAYS[attempt]);
      }
    }
  }

  throw lastError || new AhrefsError('Ahrefs API request failed after 3 attempts', 0, true);
}

// ── Core API Methods ───────────────────────────────────────────

/**
 * Fetch backlink profile for a domain.
 * Returns referring domains, backlink counts, and top backlinks.
 *
 * @param {string} domain - Target domain (e.g. 'example.com')
 * @param {string} userId - User UUID
 * @param {string} apiToken - Ahrefs API token
 * @param {object} [options] - { limit: 100, mode: 'domain' }
 * @returns {Promise<object>} Backlink profile data
 */
async function fetchBacklinkProfile(domain, userId, apiToken, options = {}) {
  const cacheType = 'ahrefs_backlinks';
  const cached = await checkCache(userId, cacheType, domain);
  if (cached) return cached;

  const limit = options.limit || MAX_ROWS;
  const mode = options.mode || 'domain';

  logger.info('ahrefs_fetch_backlinks', { domain, limit, mode });

  // Backlinks overview
  const overviewData = await ahrefsApiRequest('site-explorer/overview', {
    target: domain,
    mode
  }, apiToken);

  // Top backlinks
  const backlinksData = await ahrefsApiRequest('site-explorer/all-backlinks', {
    target: domain,
    mode,
    limit,
    order_by: 'domain_rating:desc'
  }, apiToken);

  const backlinks = backlinksData.backlinks || [];

  const result = {
    domain,
    mode,
    overview: {
      totalBacklinks: overviewData.metrics ? overviewData.metrics.backlinks : 0,
      referringDomains: overviewData.metrics ? overviewData.metrics.refdomains : 0,
      domainRating: overviewData.metrics ? overviewData.metrics.domain_rating : 0,
      organicTraffic: overviewData.metrics ? overviewData.metrics.organic_traffic : 0
    },
    backlinks,
    fetchedAt: new Date().toISOString(),
    rowCount: backlinks.length,
    apiRows: backlinks.length + 1 // overview + backlinks
  };

  logger.info('ahrefs_cost_tracking', {
    operation: 'backlink_profile',
    domain,
    rows: result.apiRows
  });

  await updateCache(userId, cacheType, domain, result);
  return result;
}

/**
 * Fetch domain rating for a domain.
 *
 * @param {string} domain - Target domain
 * @param {string} userId - User UUID
 * @param {string} apiToken - Ahrefs API token
 * @returns {Promise<object>} Domain rating data
 */
async function fetchDomainRating(domain, userId, apiToken) {
  const cacheType = 'ahrefs_domain_rating';
  const cached = await checkCache(userId, cacheType, domain);
  if (cached) return cached;

  logger.info('ahrefs_fetch_domain_rating', { domain });

  const data = await ahrefsApiRequest('site-explorer/domain-rating', {
    target: domain
  }, apiToken);

  const result = {
    domain,
    domainRating: data.domain_rating || 0,
    ahrefs_rank: data.ahrefs_rank || 0,
    fetchedAt: new Date().toISOString(),
    rowCount: 1,
    apiRows: 1
  };

  logger.info('ahrefs_cost_tracking', {
    operation: 'domain_rating',
    domain,
    rows: 1
  });

  await updateCache(userId, cacheType, domain, result);
  return result;
}

/**
 * Fetch keyword explorer data for a keyword.
 *
 * @param {string} keyword - Target keyword
 * @param {string} userId - User UUID
 * @param {string} apiToken - Ahrefs API token
 * @param {object} [options] - { country: 'us', limit: 100 }
 * @returns {Promise<object>} Keyword explorer data
 */
async function fetchKeywordExplorer(keyword, userId, apiToken, options = {}) {
  const cacheType = 'ahrefs_keyword_explorer';
  const cached = await checkCache(userId, cacheType, keyword);
  if (cached) return cached;

  const country = options.country || 'us';
  const limit = options.limit || MAX_ROWS;

  logger.info('ahrefs_fetch_keyword_explorer', { keyword, country });

  // Keyword overview
  const overviewData = await ahrefsApiRequest('keywords-explorer/overview', {
    keyword,
    country
  }, apiToken);

  // Related keywords
  const relatedData = await ahrefsApiRequest('keywords-explorer/related-terms', {
    keyword,
    country,
    limit
  }, apiToken);

  const relatedKeywords = relatedData.terms || [];

  const result = {
    keyword,
    country,
    overview: {
      volume: overviewData.volume || 0,
      difficulty: overviewData.difficulty || 0,
      cpc: overviewData.cpc || 0,
      clicks: overviewData.clicks || 0,
      globalVolume: overviewData.global_volume || 0
    },
    relatedKeywords,
    fetchedAt: new Date().toISOString(),
    rowCount: relatedKeywords.length + 1,
    apiRows: relatedKeywords.length + 1
  };

  logger.info('ahrefs_cost_tracking', {
    operation: 'keyword_explorer',
    keyword,
    rows: result.apiRows
  });

  await updateCache(userId, cacheType, keyword, result);
  return result;
}

// ── Data Enrichment ────────────────────────────────────────────

/**
 * Enrich keyword_opportunities table with Ahrefs keyword data.
 *
 * @param {string} userId - User UUID
 * @param {object} keywordData - Keyword explorer result
 */
async function enrichKeywordOpportunities(userId, keywordData) {
  if (!keywordData || !keywordData.relatedKeywords || keywordData.relatedKeywords.length === 0) return;

  try {
    const { config, serviceRoleKey } = getSupabaseAdmin();

    const batch = keywordData.relatedKeywords.map(kw => ({
      user_id: userId,
      keyword: kw.keyword || kw.term || '',
      source: 'ahrefs',
      search_volume: parseInt(kw.volume || '0', 10),
      cpc: parseFloat(kw.cpc || '0'),
      competition: parseFloat(kw.difficulty || '0') / 100, // Normalize 0-100 to 0-1
      updated_at: new Date().toISOString(),
      metadata: { ahrefs_difficulty: kw.difficulty || null, clicks: kw.clicks || null }
    })).filter(r => r.keyword);

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

    logger.info('ahrefs_enriched_keywords', { userId, count: batch.length });
  } catch (e) {
    logger.error('ahrefs_enrich_keywords_failed', { userId, error: e.message });
  }
}

/**
 * Enrich performance_snapshots with Ahrefs backlink/DR data.
 *
 * @param {string} userId - User UUID
 * @param {object} backlinkData - Backlink profile result
 */
async function enrichPerformanceSnapshots(userId, backlinkData) {
  if (!backlinkData || !backlinkData.overview) return;

  try {
    const { config, serviceRoleKey } = getSupabaseAdmin();

    const snapshot = {
      user_id: userId,
      source: 'ahrefs',
      snapshot_date: new Date().toISOString().split('T')[0],
      url: backlinkData.domain,
      metadata: {
        total_backlinks: backlinkData.overview.totalBacklinks,
        referring_domains: backlinkData.overview.referringDomains,
        domain_rating: backlinkData.overview.domainRating,
        organic_traffic: backlinkData.overview.organicTraffic
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

    logger.info('ahrefs_enriched_snapshots', { userId, domain: backlinkData.domain });
  } catch (e) {
    logger.error('ahrefs_enrich_snapshots_failed', { userId, error: e.message });
  }
}

// ── Connection Helper ──────────────────────────────────────────

/**
 * Get the Ahrefs connection for a user.
 *
 * @param {string} userId - User UUID
 * @returns {Promise<object|null>} Connection row or null
 */
async function getAhrefsConnection(userId) {
  try {
    const { config, serviceRoleKey } = getSupabaseAdmin();

    const res = await fetch(
      `${config.url}/rest/v1/client_connections?user_id=eq.${encodeURIComponent(userId)}&source=eq.ahrefs&select=*&limit=1`,
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
    logger.error('ahrefs_get_connection_failed', { userId, error: e.message });
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
    logger.warn('ahrefs_update_connection_failed', { connectionId, error: e.message });
  }
}

// ── Trigger Handler ────────────────────────────────────────────

/**
 * Handle POST /api/ingestion/trigger/ahrefs
 *
 * Triggers an Ahrefs sync. Requires domain in connection metadata or body.
 *
 * @param {string} userId - Authenticated user ID
 * @param {object} body - { domain?, keyword?, keyManager? }
 * @returns {Promise<object>} Job result
 */
async function handleTrigger(userId, body = {}) {
  const keyManager = body.keyManager || null;
  const apiToken = await resolveApiKey(userId, keyManager);

  if (!apiToken) {
    logger.info('ahrefs_skipped_no_key', { userId });
    return {
      success: true,
      data: {
        status: 'skipped',
        message: 'No Ahrefs API token configured. Set AHREFS_API_TOKEN env var or add a client key.'
      }
    };
  }

  const connection = await getAhrefsConnection(userId);
  const domain = body.domain || (connection && connection.metadata && connection.metadata.domain) || null;

  if (!domain) {
    return {
      success: false,
      error: 'No domain configured. Provide domain in request body or connection metadata.',
      statusCode: 400
    };
  }

  logger.info('ahrefs_trigger', { userId, domain, connectionId: connection ? connection.id : null });

  let totalRows = 0;
  const results = {};

  try {
    // 1. Backlink profile
    const backlinks = await fetchBacklinkProfile(domain, userId, apiToken, body);
    results.backlinkProfile = { rowCount: backlinks.rowCount, apiRows: backlinks.apiRows };
    totalRows += backlinks.apiRows;

    // Enrich performance snapshots with backlink data
    await enrichPerformanceSnapshots(userId, backlinks);

    // 2. Domain rating
    const dr = await fetchDomainRating(domain, userId, apiToken);
    results.domainRating = { domainRating: dr.domainRating, ahrefsRank: dr.ahrefs_rank };
    totalRows += dr.apiRows;

    // 3. Keyword explorer (if keyword provided)
    if (body.keyword) {
      const kwData = await fetchKeywordExplorer(body.keyword, userId, apiToken, body);
      results.keywordExplorer = { rowCount: kwData.rowCount, apiRows: kwData.apiRows };
      totalRows += kwData.apiRows;

      // Enrich keyword opportunities
      await enrichKeywordOpportunities(userId, kwData);
    }

    // Update connection status
    if (connection) {
      await updateConnectionStatus(connection.id, 'connected', null, {
        domain,
        last_sync: {
          totalRows,
          completedAt: new Date().toISOString()
        }
      });
    }

    logger.info('ahrefs_sync_complete', { userId, domain, totalRows });

    return {
      success: true,
      data: {
        status: 'completed',
        domain,
        totalRows,
        results
      }
    };

  } catch (e) {
    logger.error('ahrefs_sync_failed', { userId, domain, error: e.message, statusCode: e.statusCode });

    if (connection) {
      await updateConnectionStatus(connection.id, 'error', e.message);
    }

    // For quota/rate errors, return partial success with cached data
    if (e instanceof AhrefsError && (e.statusCode === 429 || e.statusCode === 402)) {
      return {
        success: true,
        data: {
          status: 'partial',
          message: 'Ahrefs quota/rate limit reached. Using cached data where available.',
          domain,
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
 * Handle GET /api/ingestion/ahrefs/status
 *
 * @param {string} userId - Authenticated user ID
 * @returns {Promise<object>} Sync status
 */
async function handleStatus(userId) {
  const connection = await getAhrefsConnection(userId);
  const hasEnvKey = !!process.env.AHREFS_API_TOKEN;

  if (!connection) {
    return {
      success: true,
      data: {
        connected: false,
        hasApiKey: hasEnvKey,
        status: hasEnvKey ? 'key_available' : 'not_configured',
        message: hasEnvKey
          ? 'Ahrefs API token available. Create a connection to start syncing.'
          : 'No Ahrefs API token configured.'
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
  fetchBacklinkProfile,
  fetchDomainRating,
  fetchKeywordExplorer,
  // Helpers (exported for testing)
  resolveApiKey,
  checkCache,
  updateCache,
  enrichKeywordOpportunities,
  enrichPerformanceSnapshots,
  getAhrefsConnection,
  updateConnectionStatus,
  ahrefsApiRequest,
  AhrefsError,
  // Constants
  CACHE_TTL_MS,
  UPSERT_BATCH_SIZE,
  RETRY_DELAYS,
  MAX_ROWS
};
