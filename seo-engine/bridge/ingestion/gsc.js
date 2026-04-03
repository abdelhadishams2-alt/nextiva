/**
 * Google Search Console (GSC) Search Analytics Connector — DI-002
 *
 * Wraps the GSC searchAnalytics.query API with:
 * - 25,000-row pagination
 * - 16-month historical import (monthly chunks, 90-day API window)
 * - Daily incremental pulls (last 3 days for late-arriving data)
 * - Normalization into performance_snapshots table
 * - Health score calculation per URL
 * - Google API error handling (401->refresh, 429->backoff, 403->error)
 *
 * Zero npm dependencies — Node.js built-ins only.
 */

const logger = require('../logger');
const oauth = require('../oauth');
const supabase = require('../supabase-client');

// ── Constants ──────────────────────────────────────────────────

const GSC_API_BASE = 'https://www.googleapis.com/webmasters/v3';
const GSC_SEARCH_ANALYTICS_URL = (siteUrl) =>
  `${GSC_API_BASE}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;

// Pagination limit per request (Google allows max 25,000)
const PAGE_SIZE = 25000;

// Batch size for upserting to Supabase
const UPSERT_BATCH_SIZE = 500;

// Retry backoff delays (5s, 15s, 45s)
const RETRY_DELAYS = [5000, 15000, 45000];

// GSC API limits date ranges to ~16 months back
const HISTORICAL_MONTHS = 16;

// GSC data can arrive late; pull last 3 days on incremental
const INCREMENTAL_LOOKBACK_DAYS = 3;

// Maximum days per API request (Google's ~90-day window for dimension queries)
const MAX_DAYS_PER_CHUNK = 90;

// Health score weights (must sum to 1.0)
const HEALTH_WEIGHTS = {
  clicks: 0.35,
  impressions: 0.25,
  ctr: 0.25,
  position: 0.15
};

// ── Helper: sleep ──────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Helper: format date as YYYY-MM-DD ─────────────────────────

function formatDate(date) {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

// ── Date Range Generators ─────────────────────────────────────

/**
 * Generate monthly date chunks for historical import.
 * GSC API window is ~90 days per dimension query, so we chunk by month.
 * Goes back HISTORICAL_MONTHS months from today.
 *
 * @returns {Array<{ startDate: string, endDate: string }>}
 */
function generateHistoricalChunks() {
  const chunks = [];
  const now = new Date();

  for (let i = HISTORICAL_MONTHS; i >= 0; i--) {
    const chunkStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const chunkEnd = new Date(Date.UTC(chunkStart.getUTCFullYear(), chunkStart.getUTCMonth() + 1, 0));

    // Don't go past today
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const endDate = chunkEnd > today ? today : chunkEnd;

    // Don't include future months
    if (chunkStart > today) continue;

    chunks.push({
      startDate: formatDate(chunkStart),
      endDate: formatDate(endDate)
    });
  }

  return chunks;
}

/**
 * Generate date range for incremental pull (last N days).
 *
 * @returns {{ startDate: string, endDate: string }}
 */
function generateIncrementalRange() {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - INCREMENTAL_LOOKBACK_DAYS);

  return {
    startDate: formatDate(start),
    endDate: formatDate(today)
  };
}

// ── GSC API Query Builder ─────────────────────────────────────

/**
 * Build a searchAnalytics.query request body.
 *
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @param {number} startRow - pagination offset
 * @returns {object} Request body for GSC API
 */
function buildQueryBody(startDate, endDate, startRow = 0) {
  return {
    startDate,
    endDate,
    dimensions: ['page', 'date'],
    rowLimit: PAGE_SIZE,
    startRow,
    dataState: 'final'
  };
}

// ── GSC API Request with Error Handling ───────────────────────

/**
 * Make a single GSC API request with retry and error handling.
 *
 * Error handling:
 * - 401: Token expired, attempt refresh via oauth.refreshToken
 * - 429: Rate limited, exponential backoff
 * - 403: Permission denied, mark connection as error
 * - 5xx: Server error, retry with backoff
 * - 4xx (other): Unrecoverable, throw immediately
 *
 * @param {string} siteUrl - GSC property URL
 * @param {string} connectionId - UUID of client_connections row
 * @param {object} body - Request body
 * @returns {Promise<object>} API response data
 */
async function gscApiRequest(siteUrl, connectionId, body) {
  let lastError = null;
  let accessToken = await oauth.getValidToken(connectionId);

  for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
    try {
      const url = GSC_SEARCH_ANALYTICS_URL(siteUrl);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        return await res.json();
      }

      const status = res.status;
      const errBody = await res.json().catch(() => ({}));
      const errMsg = errBody.error?.message || errBody.error || res.statusText;

      // 401 — Token expired, refresh and retry
      if (status === 401) {
        logger.warn('gsc_token_expired', { connectionId, attempt: attempt + 1 });
        try {
          const refreshed = await oauth.refreshToken(connectionId);
          accessToken = refreshed.accessToken;
          // Retry immediately with new token (no backoff)
          continue;
        } catch (refreshErr) {
          throw new GSCError('Token refresh failed: ' + refreshErr.message, 401, true);
        }
      }

      // 403 — Permission denied (not retryable)
      if (status === 403) {
        logger.error('gsc_permission_denied', { connectionId, siteUrl, error: errMsg });
        await updateConnectionStatus(connectionId, 'error', 'GSC permission denied: ' + errMsg);
        throw new GSCError('Permission denied: ' + errMsg, 403, true);
      }

      // 429 — Rate limited (retryable with backoff)
      if (status === 429) {
        logger.warn('gsc_rate_limited', { connectionId, attempt: attempt + 1 });
        lastError = new GSCError('Rate limited', 429, false);
        if (attempt < RETRY_DELAYS.length - 1) {
          await sleep(RETRY_DELAYS[attempt]);
        }
        continue;
      }

      // 5xx — Server error (retryable)
      if (status >= 500) {
        logger.warn('gsc_server_error', { connectionId, status, attempt: attempt + 1, error: errMsg });
        lastError = new GSCError('Server error: ' + errMsg, status, false);
        if (attempt < RETRY_DELAYS.length - 1) {
          await sleep(RETRY_DELAYS[attempt]);
        }
        continue;
      }

      // Other 4xx — Unrecoverable
      throw new GSCError('GSC API error: ' + errMsg, status, true);

    } catch (e) {
      if (e instanceof GSCError && e.unrecoverable) throw e;
      if (e instanceof GSCError) {
        lastError = e;
      } else {
        lastError = new GSCError(e.message, 0, false);
        logger.warn('gsc_request_error', { connectionId, attempt: attempt + 1, error: e.message });
      }
      if (attempt < RETRY_DELAYS.length - 1) {
        await sleep(RETRY_DELAYS[attempt]);
      }
    }
  }

  throw lastError || new GSCError('GSC API request failed after 3 attempts', 0, true);
}

/**
 * Custom error class for GSC API errors.
 */
class GSCError extends Error {
  constructor(message, statusCode, unrecoverable) {
    super(message);
    this.name = 'GSCError';
    this.statusCode = statusCode;
    this.unrecoverable = unrecoverable;
  }
}

// ── Paginated Query ───────────────────────────────────────────

/**
 * Query GSC searchAnalytics with full 25K-row pagination.
 * Continues fetching pages until fewer rows than PAGE_SIZE are returned.
 *
 * @param {string} siteUrl - GSC property URL
 * @param {string} connectionId - UUID
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {Promise<Array>} All rows from the date range
 */
async function querySearchAnalytics(siteUrl, connectionId, startDate, endDate) {
  const allRows = [];
  let startRow = 0;

  logger.info('gsc_query_start', { siteUrl, startDate, endDate });

  while (true) {
    const body = buildQueryBody(startDate, endDate, startRow);
    const data = await gscApiRequest(siteUrl, connectionId, body);

    const rows = data.rows || [];
    allRows.push(...rows);

    logger.info('gsc_query_page', {
      siteUrl,
      startRow,
      rowsReturned: rows.length,
      totalSoFar: allRows.length
    });

    // If fewer rows than page size, we've reached the end
    if (rows.length < PAGE_SIZE) break;

    startRow += PAGE_SIZE;
  }

  logger.info('gsc_query_complete', {
    siteUrl,
    startDate,
    endDate,
    totalRows: allRows.length
  });

  return allRows;
}

// ── Normalization & Storage ───────────────────────────────────

/**
 * Normalize a GSC row into a performance_snapshots record.
 *
 * GSC row format:
 * { keys: ['https://example.com/page', '2024-01-15'], clicks: 10, impressions: 100, ctr: 0.1, position: 5.2 }
 *
 * @param {object} row - GSC API row
 * @param {string} userId - User UUID
 * @returns {object} performance_snapshots record
 */
function normalizeRow(row, userId) {
  const url = row.keys[0];
  const snapshotDate = row.keys[1];

  return {
    user_id: userId,
    url,
    snapshot_date: snapshotDate,
    source: 'gsc',
    clicks: Math.max(0, Math.round(row.clicks || 0)),
    impressions: Math.max(0, Math.round(row.impressions || 0)),
    ctr: Math.min(1, Math.max(0, parseFloat((row.ctr || 0).toFixed(4)))),
    avg_position: Math.max(0.01, parseFloat((row.position || 0).toFixed(2))),
    health_score: null, // calculated after upsert
    decay_signal: false,
    metadata: {}
  };
}

/**
 * Calculate health score for a URL based on GSC metrics.
 *
 * 4-component weighted formula:
 * - Clicks score (35%): log-scaled, 100+ clicks = max
 * - Impressions score (25%): log-scaled, 10000+ = max
 * - CTR score (25%): linear, 0.10+ = max
 * - Position score (15%): inverse linear, position 1 = max, 100+ = 0
 *
 * @param {object} snapshot - Normalized snapshot record
 * @returns {number} Health score 0-100
 */
function calculateHealthScore(snapshot) {
  // Clicks score: log scale, cap at 100 clicks
  const clicksScore = snapshot.clicks > 0
    ? Math.min(100, (Math.log10(snapshot.clicks + 1) / Math.log10(101)) * 100)
    : 0;

  // Impressions score: log scale, cap at 10000
  const impressionsScore = snapshot.impressions > 0
    ? Math.min(100, (Math.log10(snapshot.impressions + 1) / Math.log10(10001)) * 100)
    : 0;

  // CTR score: linear, 10%+ = max
  const ctrScore = Math.min(100, (snapshot.ctr / 0.10) * 100);

  // Position score: inverse linear, pos 1 = 100, pos 100+ = 0
  const positionScore = snapshot.avg_position > 0
    ? Math.max(0, Math.min(100, ((100 - snapshot.avg_position) / 99) * 100))
    : 0;

  const score =
    HEALTH_WEIGHTS.clicks * clicksScore +
    HEALTH_WEIGHTS.impressions * impressionsScore +
    HEALTH_WEIGHTS.ctr * ctrScore +
    HEALTH_WEIGHTS.position * positionScore;

  return parseFloat(Math.max(0, Math.min(100, score)).toFixed(2));
}

/**
 * Detect decay signal: true if health score is below 30 or position > 50.
 *
 * @param {number} healthScore
 * @param {number} avgPosition
 * @returns {boolean}
 */
function detectDecaySignal(healthScore, avgPosition) {
  return healthScore < 30 || avgPosition > 50;
}

/**
 * Normalize GSC rows and batch-upsert into performance_snapshots.
 *
 * @param {Array} rows - GSC API rows
 * @param {string} userId - User UUID
 * @returns {Promise<{ inserted: number, errors: number }>}
 */
async function normalizeAndStore(rows, userId) {
  if (!rows || rows.length === 0) {
    return { inserted: 0, errors: 0 };
  }

  const { config, serviceRoleKey } = getSupabaseAdmin();

  // Normalize all rows and calculate health scores
  const snapshots = rows.map(row => {
    const snapshot = normalizeRow(row, userId);
    snapshot.health_score = calculateHealthScore(snapshot);
    snapshot.decay_signal = detectDecaySignal(snapshot.health_score, snapshot.avg_position);
    return snapshot;
  });

  let inserted = 0;
  let errors = 0;

  // Batch upsert in chunks of UPSERT_BATCH_SIZE
  for (let i = 0; i < snapshots.length; i += UPSERT_BATCH_SIZE) {
    const batch = snapshots.slice(i, i + UPSERT_BATCH_SIZE);

    try {
      const res = await fetch(
        `${config.url}/rest/v1/performance_snapshots?on_conflict=user_id,url,snapshot_date,source`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': 'Bearer ' + serviceRoleKey,
            'Prefer': 'resolution=merge-duplicates,return=minimal'
          },
          body: JSON.stringify(batch)
        }
      );

      if (res.ok) {
        inserted += batch.length;
      } else {
        const errBody = await res.json().catch(() => ({}));
        logger.error('gsc_upsert_batch_failed', {
          userId,
          batchStart: i,
          batchSize: batch.length,
          error: errBody.message || res.statusText
        });
        errors += batch.length;
      }
    } catch (e) {
      logger.error('gsc_upsert_batch_error', {
        userId,
        batchStart: i,
        batchSize: batch.length,
        error: e.message
      });
      errors += batch.length;
    }
  }

  logger.info('gsc_normalize_complete', { userId, inserted, errors, total: snapshots.length });
  return { inserted, errors };
}

// ── Connection Status Management ──────────────────────────────

/**
 * Update the connection status and last_error in client_connections.
 */
async function updateConnectionStatus(connectionId, status, lastError = null) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  const body = {
    status,
    last_error: lastError,
    updated_at: new Date().toISOString()
  };

  if (status === 'connected') {
    body.last_sync_at = new Date().toISOString();
  }

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
}

/**
 * Increment the sync_count on a connection.
 */
async function incrementSyncCount(connectionId) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  // Fetch current sync_count
  const res = await fetch(
    `${config.url}/rest/v1/client_connections?id=eq.${encodeURIComponent(connectionId)}&select=sync_count`,
    {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey
      }
    }
  );

  if (!res.ok) return;
  const rows = await res.json();
  if (!rows || rows.length === 0) return;

  const currentCount = rows[0].sync_count || 0;

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
      body: JSON.stringify({
        sync_count: currentCount + 1,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  );
}

// ── Sync Job Status Tracking ──────────────────────────────────

/**
 * Store sync job status in Supabase metadata (on the connection record).
 * We store the sync state in the connection's metadata JSONB field.
 */
async function updateSyncJobStatus(connectionId, jobStatus) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  // Fetch current metadata
  const res = await fetch(
    `${config.url}/rest/v1/client_connections?id=eq.${encodeURIComponent(connectionId)}&select=metadata`,
    {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey
      }
    }
  );

  let metadata = {};
  if (res.ok) {
    const rows = await res.json();
    if (rows && rows.length > 0) {
      metadata = rows[0].metadata || {};
    }
  }

  metadata.gsc_sync = jobStatus;

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
      body: JSON.stringify({
        metadata,
        updated_at: new Date().toISOString()
      })
    }
  );
}

/**
 * Get the current sync job status for a connection.
 */
async function getSyncJobStatus(connectionId) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  const res = await fetch(
    `${config.url}/rest/v1/client_connections?id=eq.${encodeURIComponent(connectionId)}&select=metadata,status,last_sync_at,sync_count,gsc_property`,
    {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey
      }
    }
  );

  if (!res.ok) return null;
  const rows = await res.json();
  if (!rows || rows.length === 0) return null;

  const conn = rows[0];
  return {
    connectionStatus: conn.status,
    lastSyncAt: conn.last_sync_at,
    syncCount: conn.sync_count,
    gscProperty: conn.gsc_property,
    syncJob: (conn.metadata || {}).gsc_sync || null
  };
}

// ── Main Sync Orchestrators ───────────────────────────────────

/**
 * Get the user's Google connection for GSC.
 */
async function getGSCConnection(userId) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  const res = await fetch(
    `${config.url}/rest/v1/client_connections?user_id=eq.${encodeURIComponent(userId)}&provider=eq.google&select=id,user_id,gsc_property,status,last_sync_at,sync_count,metadata`,
    {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey
      }
    }
  );

  if (!res.ok) return null;
  const rows = await res.json();
  return rows && rows.length > 0 ? rows[0] : null;
}

/**
 * Run a full historical import (16 months, monthly chunks).
 * This is run on first connection or when explicitly triggered with mode='full'.
 *
 * @param {string} connectionId - UUID
 * @param {string} userId - UUID
 * @param {string} siteUrl - GSC property URL
 * @returns {Promise<{ totalRows: number, inserted: number, errors: number, chunks: number }>}
 */
async function runHistoricalImport(connectionId, userId, siteUrl) {
  const chunks = generateHistoricalChunks();
  let totalRows = 0;
  let totalInserted = 0;
  let totalErrors = 0;

  logger.info('gsc_historical_import_start', {
    connectionId,
    userId,
    siteUrl,
    chunks: chunks.length
  });

  await updateSyncJobStatus(connectionId, {
    status: 'running',
    mode: 'historical',
    startedAt: new Date().toISOString(),
    totalChunks: chunks.length,
    completedChunks: 0,
    totalRows: 0,
    errors: 0
  });

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    try {
      const rows = await querySearchAnalytics(siteUrl, connectionId, chunk.startDate, chunk.endDate);
      totalRows += rows.length;

      const result = await normalizeAndStore(rows, userId);
      totalInserted += result.inserted;
      totalErrors += result.errors;

      await updateSyncJobStatus(connectionId, {
        status: 'running',
        mode: 'historical',
        startedAt: new Date().toISOString(),
        totalChunks: chunks.length,
        completedChunks: i + 1,
        totalRows,
        inserted: totalInserted,
        errors: totalErrors,
        lastChunk: chunk
      });

      logger.info('gsc_historical_chunk_complete', {
        connectionId,
        chunk: i + 1,
        totalChunks: chunks.length,
        chunkRows: rows.length,
        startDate: chunk.startDate,
        endDate: chunk.endDate
      });
    } catch (e) {
      logger.error('gsc_historical_chunk_failed', {
        connectionId,
        chunk: i + 1,
        startDate: chunk.startDate,
        endDate: chunk.endDate,
        error: e.message
      });

      // If unrecoverable (403, auth failure), abort the whole import
      if (e instanceof GSCError && e.unrecoverable) {
        await updateSyncJobStatus(connectionId, {
          status: 'failed',
          mode: 'historical',
          error: e.message,
          completedChunks: i,
          totalChunks: chunks.length,
          failedAt: new Date().toISOString()
        });
        throw e;
      }

      totalErrors++;
      // Continue with next chunk for recoverable errors
    }
  }

  await updateSyncJobStatus(connectionId, {
    status: 'completed',
    mode: 'historical',
    completedAt: new Date().toISOString(),
    totalChunks: chunks.length,
    completedChunks: chunks.length,
    totalRows,
    inserted: totalInserted,
    errors: totalErrors
  });

  await incrementSyncCount(connectionId);

  logger.info('gsc_historical_import_complete', {
    connectionId,
    userId,
    totalRows,
    inserted: totalInserted,
    errors: totalErrors,
    chunks: chunks.length
  });

  return { totalRows, inserted: totalInserted, errors: totalErrors, chunks: chunks.length };
}

/**
 * Run an incremental pull (last 3 days for late-arriving data).
 *
 * @param {string} connectionId - UUID
 * @param {string} userId - UUID
 * @param {string} siteUrl - GSC property URL
 * @returns {Promise<{ totalRows: number, inserted: number, errors: number }>}
 */
async function runIncrementalPull(connectionId, userId, siteUrl) {
  const range = generateIncrementalRange();

  logger.info('gsc_incremental_pull_start', {
    connectionId,
    userId,
    siteUrl,
    startDate: range.startDate,
    endDate: range.endDate
  });

  await updateSyncJobStatus(connectionId, {
    status: 'running',
    mode: 'incremental',
    startedAt: new Date().toISOString(),
    startDate: range.startDate,
    endDate: range.endDate
  });

  try {
    const rows = await querySearchAnalytics(siteUrl, connectionId, range.startDate, range.endDate);
    const result = await normalizeAndStore(rows, userId);

    await updateSyncJobStatus(connectionId, {
      status: 'completed',
      mode: 'incremental',
      completedAt: new Date().toISOString(),
      totalRows: rows.length,
      inserted: result.inserted,
      errors: result.errors,
      startDate: range.startDate,
      endDate: range.endDate
    });

    await incrementSyncCount(connectionId);
    await updateConnectionStatus(connectionId, 'connected');

    logger.info('gsc_incremental_pull_complete', {
      connectionId,
      userId,
      totalRows: rows.length,
      inserted: result.inserted,
      errors: result.errors
    });

    return { totalRows: rows.length, inserted: result.inserted, errors: result.errors };
  } catch (e) {
    logger.error('gsc_incremental_pull_failed', {
      connectionId,
      userId,
      error: e.message
    });

    await updateSyncJobStatus(connectionId, {
      status: 'failed',
      mode: 'incremental',
      error: e.message,
      failedAt: new Date().toISOString()
    });

    throw e;
  }
}

// ── Trigger Endpoint Handler ──────────────────────────────────

/**
 * Handle POST /api/ingestion/trigger/gsc
 *
 * Triggers a GSC sync job. Determines mode automatically:
 * - If sync_count === 0: full historical import
 * - Otherwise: incremental pull (last 3 days)
 *
 * Can be overridden with body.mode = 'full' | 'incremental'
 *
 * @param {string} userId - Authenticated user ID
 * @param {object} body - Optional: { mode: 'full' | 'incremental' }
 * @returns {Promise<object>} Job initiation result
 */
async function handleTrigger(userId, body = {}) {
  const connection = await getGSCConnection(userId);

  if (!connection) {
    return { success: false, error: 'No Google connection found. Please connect Google Search Console first.', statusCode: 404 };
  }

  if (connection.status === 'expired' || connection.status === 'revoked') {
    return { success: false, error: `Google connection is ${connection.status}. Please reconnect.`, statusCode: 403 };
  }

  if (!connection.gsc_property) {
    return { success: false, error: 'No GSC property configured. Please select a Search Console property.', statusCode: 400 };
  }

  // Check if a sync is already running
  const currentSync = (connection.metadata || {}).gsc_sync;
  if (currentSync && currentSync.status === 'running') {
    return {
      success: false,
      error: 'A GSC sync is already in progress.',
      statusCode: 409,
      data: currentSync
    };
  }

  // Determine mode
  const mode = body.mode || (connection.sync_count === 0 ? 'full' : 'incremental');
  const siteUrl = connection.gsc_property;

  logger.info('gsc_trigger', { userId, connectionId: connection.id, mode, siteUrl });

  // Run sync asynchronously — don't block the HTTP response
  const syncPromise = mode === 'full'
    ? runHistoricalImport(connection.id, userId, siteUrl)
    : runIncrementalPull(connection.id, userId, siteUrl);

  // Fire-and-forget with error logging
  syncPromise.catch(e => {
    logger.error('gsc_sync_failed', {
      userId,
      connectionId: connection.id,
      mode,
      error: e.message
    });
    updateConnectionStatus(connection.id, 'error', e.message).catch(() => {});
  });

  return {
    success: true,
    data: {
      connectionId: connection.id,
      mode,
      siteUrl,
      status: 'started',
      message: mode === 'full'
        ? 'Historical import started. This may take several minutes.'
        : 'Incremental sync started.'
    }
  };
}

/**
 * Handle GET /api/ingestion/gsc/status
 *
 * Returns the current GSC sync status for the user.
 *
 * @param {string} userId - Authenticated user ID
 * @returns {Promise<object>} Sync status
 */
async function handleStatus(userId) {
  const connection = await getGSCConnection(userId);

  if (!connection) {
    return {
      success: true,
      data: {
        connected: false,
        status: 'not_connected',
        message: 'No Google connection found.'
      }
    };
  }

  const syncStatus = await getSyncJobStatus(connection.id);

  return {
    success: true,
    data: {
      connected: connection.status === 'connected',
      connectionStatus: syncStatus.connectionStatus,
      gscProperty: syncStatus.gscProperty,
      lastSyncAt: syncStatus.lastSyncAt,
      syncCount: syncStatus.syncCount,
      currentSync: syncStatus.syncJob
    }
  };
}

// ── Exports ───────────────────────────────────────────────────

module.exports = {
  handleTrigger,
  handleStatus,
  // Exported for testing
  formatDate,
  buildQueryBody,
  generateHistoricalChunks,
  generateIncrementalRange,
  normalizeRow,
  calculateHealthScore,
  detectDecaySignal,
  normalizeAndStore,
  querySearchAnalytics,
  gscApiRequest,
  GSCError,
  getGSCConnection,
  runHistoricalImport,
  runIncrementalPull,
  updateConnectionStatus,
  updateSyncJobStatus,
  getSyncJobStatus,
  incrementSyncCount,
  PAGE_SIZE,
  UPSERT_BATCH_SIZE,
  RETRY_DELAYS,
  HEALTH_WEIGHTS,
  HISTORICAL_MONTHS,
  INCREMENTAL_LOOKBACK_DAYS
};
