/**
 * Google Analytics 4 (GA4) Reporting API Connector — DI-003
 *
 * Wraps the GA4 Data API v1beta with:
 * - 10,000-row pagination (limit/offset)
 * - Historical import in monthly chunks on first connection
 * - Daily incremental pulls (last 3 days for late-arriving data)
 * - Normalization into performance_snapshots table
 * - GSC merge: match GA4 pagePath to GSC full URLs, create combined records
 * - Quota management (10K req/day property-level)
 * - Google API error handling (401->refresh, 429->backoff, 403->error)
 *
 * Zero npm dependencies — Node.js built-ins only.
 */

const logger = require('../logger');
const oauth = require('../oauth');
const supabase = require('../supabase-client');

// ── Constants ──────────────────────────────────────────────────

const GA4_API_BASE = 'https://analyticsdata.googleapis.com/v1beta';
const GA4_RUN_REPORT_URL = (propertyId) =>
  `${GA4_API_BASE}/properties/${encodeURIComponent(propertyId)}:runReport`;

// Pagination limit per request (GA4 allows max 10,000)
const PAGE_SIZE = 10000;

// Batch size for upserting to Supabase
const UPSERT_BATCH_SIZE = 500;

// Retry backoff delays (5s, 15s, 45s)
const RETRY_DELAYS = [5000, 15000, 45000];

// GA4 data can arrive late; pull last 3 days on incremental
const INCREMENTAL_LOOKBACK_DAYS = 3;

// GA4 property-level daily quota (typical)
const DAILY_QUOTA_LIMIT = 10000;

// Quota warning threshold (80%)
const QUOTA_WARNING_THRESHOLD = 0.8;

// GA4 dimensions and metrics for engagement reporting
const GA4_DIMENSIONS = [
  { name: 'pagePath' },
  { name: 'date' }
];

const GA4_METRICS = [
  { name: 'sessions' },
  { name: 'engagedSessions' },
  { name: 'bounceRate' },
  { name: 'averageSessionDuration' },
  { name: 'scrolledUsers' },
  { name: 'totalUsers' }
];

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

// ── Helper: format date for GA4 (YYYYMMDD -> YYYY-MM-DD) ─────

function parseGA4Date(ga4Date) {
  // GA4 returns dates as YYYYMMDD
  if (ga4Date.length === 8 && !ga4Date.includes('-')) {
    return `${ga4Date.slice(0, 4)}-${ga4Date.slice(4, 6)}-${ga4Date.slice(6, 8)}`;
  }
  return ga4Date;
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

// ── Helper: strip protocol+domain from URL ────────────────────

/**
 * Extract the path from a full URL.
 * e.g. "https://example.com/blog/article" -> "/blog/article"
 *
 * @param {string} fullUrl - Full URL with protocol and domain
 * @returns {string} Path portion only
 */
function extractPathFromUrl(fullUrl) {
  try {
    const url = new URL(fullUrl);
    return url.pathname;
  } catch (e) {
    // If it's already a path, return as-is
    return fullUrl;
  }
}

// ── Date Range Generators ─────────────────────────────────────

/**
 * Generate monthly date chunks for historical import.
 * Pulls all available GA4 data in monthly chunks.
 *
 * @returns {Array<{ startDate: string, endDate: string }>}
 */
function generateHistoricalChunks() {
  const chunks = [];
  const now = new Date();
  // GA4 typically has data going back ~14 months
  const historicalMonths = 14;

  for (let i = historicalMonths; i >= 0; i--) {
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

// ── GA4 API Request Body Builder ──────────────────────────────

/**
 * Build a GA4 runReport request body.
 *
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @param {number} offset - pagination offset
 * @returns {object} Request body for GA4 Data API
 */
function buildReportBody(startDate, endDate, offset = 0) {
  return {
    dateRanges: [{ startDate, endDate }],
    dimensions: GA4_DIMENSIONS,
    metrics: GA4_METRICS,
    limit: PAGE_SIZE,
    offset,
    keepEmptyRows: false
  };
}

// ── GA4 API Request with Error Handling ───────────────────────

/**
 * Custom error class for GA4 API errors.
 */
class GA4Error extends Error {
  constructor(message, statusCode, unrecoverable) {
    super(message);
    this.name = 'GA4Error';
    this.statusCode = statusCode;
    this.unrecoverable = unrecoverable;
  }
}

/**
 * Make a single GA4 API request with retry and error handling.
 *
 * Error handling:
 * - 401: Token expired, attempt refresh via oauth.refreshToken
 * - 429: Rate limited, exponential backoff
 * - 403: Permission denied, mark connection as error
 * - 5xx: Server error, retry with backoff
 * - 4xx (other): Unrecoverable, throw immediately
 *
 * @param {string} propertyId - GA4 property ID
 * @param {string} connectionId - UUID of client_connections row
 * @param {object} body - Request body
 * @returns {Promise<object>} API response data
 */
async function ga4ApiRequest(propertyId, connectionId, body) {
  let lastError = null;
  let accessToken = await oauth.getValidToken(connectionId);

  for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
    try {
      const url = GA4_RUN_REPORT_URL(propertyId);
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
        logger.warn('ga4_token_expired', { connectionId, attempt: attempt + 1 });
        try {
          const refreshed = await oauth.refreshToken(connectionId);
          accessToken = refreshed.accessToken;
          // Retry immediately with new token (no backoff)
          continue;
        } catch (refreshErr) {
          throw new GA4Error('Token refresh failed: ' + refreshErr.message, 401, true);
        }
      }

      // 403 — Permission denied (not retryable)
      if (status === 403) {
        logger.error('ga4_permission_denied', { connectionId, propertyId, error: errMsg });
        await updateConnectionStatus(connectionId, 'error', 'GA4 permission denied: ' + errMsg);
        throw new GA4Error('Permission denied: ' + errMsg, 403, true);
      }

      // 429 — Rate limited (retryable with backoff)
      if (status === 429) {
        logger.warn('ga4_rate_limited', { connectionId, attempt: attempt + 1 });
        lastError = new GA4Error('Rate limited', 429, false);
        if (attempt < RETRY_DELAYS.length - 1) {
          await sleep(RETRY_DELAYS[attempt]);
        }
        continue;
      }

      // 5xx — Server error (retryable)
      if (status >= 500) {
        logger.warn('ga4_server_error', { connectionId, status, attempt: attempt + 1, error: errMsg });
        lastError = new GA4Error('Server error: ' + errMsg, status, false);
        if (attempt < RETRY_DELAYS.length - 1) {
          await sleep(RETRY_DELAYS[attempt]);
        }
        continue;
      }

      // Other 4xx — Unrecoverable
      throw new GA4Error('GA4 API error: ' + errMsg, status, true);

    } catch (e) {
      if (e instanceof GA4Error && e.unrecoverable) throw e;
      if (e instanceof GA4Error) {
        lastError = e;
      } else {
        lastError = new GA4Error(e.message, 0, false);
        logger.warn('ga4_request_error', { connectionId, attempt: attempt + 1, error: e.message });
      }
      if (attempt < RETRY_DELAYS.length - 1) {
        await sleep(RETRY_DELAYS[attempt]);
      }
    }
  }

  throw lastError || new GA4Error('GA4 API request failed after 3 attempts', 0, true);
}

// ── Paginated Query ───────────────────────────────────────────

/**
 * Query GA4 runReport with full pagination.
 * Continues fetching pages until fewer rows than PAGE_SIZE are returned.
 *
 * @param {string} propertyId - GA4 property ID
 * @param {string} connectionId - UUID
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {Promise<{ rows: Array, rowCount: number, quotaUsed: number }>}
 */
async function queryGA4Report(propertyId, connectionId, startDate, endDate) {
  const allRows = [];
  let offset = 0;
  let quotaUsed = 0;

  logger.info('ga4_query_start', { propertyId, startDate, endDate });

  while (true) {
    const body = buildReportBody(startDate, endDate, offset);
    const data = await ga4ApiRequest(propertyId, connectionId, body);
    quotaUsed++;

    const rows = data.rows || [];
    allRows.push(...rows);

    logger.info('ga4_query_page', {
      propertyId,
      offset,
      rowsReturned: rows.length,
      totalSoFar: allRows.length
    });

    // If fewer rows than page size, we've reached the end
    if (rows.length < PAGE_SIZE) break;

    offset += PAGE_SIZE;
  }

  logger.info('ga4_query_complete', {
    propertyId,
    startDate,
    endDate,
    totalRows: allRows.length,
    quotaUsed
  });

  return { rows: allRows, rowCount: allRows.length, quotaUsed };
}

// ── Response Parsing ──────────────────────────────────────────

/**
 * Parse a GA4 report row into a flat object with named fields.
 *
 * GA4 row format:
 * {
 *   dimensionValues: [{ value: '/blog/article' }, { value: '20240115' }],
 *   metricValues: [{ value: '100' }, { value: '80' }, { value: '0.2' }, { value: '45.5' }, { value: '60' }, { value: '100' }]
 * }
 *
 * @param {object} row - GA4 API row
 * @returns {object} Parsed row with named fields
 */
function parseGA4Row(row) {
  const pagePath = (row.dimensionValues && row.dimensionValues[0]) ? row.dimensionValues[0].value : '';
  const dateRaw = (row.dimensionValues && row.dimensionValues[1]) ? row.dimensionValues[1].value : '';
  const snapshotDate = parseGA4Date(dateRaw);

  const metrics = row.metricValues || [];
  const sessions = parseInt(metrics[0]?.value || '0', 10);
  const engagedSessions = parseInt(metrics[1]?.value || '0', 10);
  const bounceRate = parseFloat(metrics[2]?.value || '0');
  const avgEngagementTime = parseFloat(metrics[3]?.value || '0');
  const scrolledUsers = parseInt(metrics[4]?.value || '0', 10);
  const totalUsers = parseInt(metrics[5]?.value || '0', 10);

  // Calculate scroll depth as percentage
  const scrollDepth = totalUsers > 0
    ? parseFloat(((scrolledUsers / totalUsers) * 100).toFixed(2))
    : 0;

  return {
    pagePath,
    snapshotDate,
    sessions: Math.max(0, sessions),
    engaged_sessions: Math.max(0, engagedSessions),
    bounce_rate: Math.min(1, Math.max(0, parseFloat(bounceRate.toFixed(4)))),
    avg_engagement_time: Math.max(0, parseFloat(avgEngagementTime.toFixed(2))),
    scroll_depth: Math.min(100, Math.max(0, scrollDepth)),
    scrolled_users: scrolledUsers,
    total_users: totalUsers
  };
}

// ── Normalization & Storage ───────────────────────────────────

/**
 * Normalize a parsed GA4 row into a performance_snapshots record.
 *
 * @param {object} parsed - Parsed GA4 row from parseGA4Row
 * @param {string} userId - User UUID
 * @param {string} pagePath - The page path (used as URL if no GSC match)
 * @returns {object} performance_snapshots record
 */
function normalizeRow(parsed, userId, pagePath) {
  return {
    user_id: userId,
    url: pagePath,
    snapshot_date: parsed.snapshotDate,
    source: 'ga4',
    sessions: parsed.sessions,
    engaged_sessions: parsed.engaged_sessions,
    bounce_rate: parsed.bounce_rate,
    avg_engagement_time: parsed.avg_engagement_time,
    scroll_depth: parsed.scroll_depth,
    metadata: {
      scrolled_users: parsed.scrolled_users,
      total_users: parsed.total_users
    }
  };
}

// ── GSC Merge Logic ───────────────────────────────────────────

/**
 * Fetch existing GSC snapshots for a user within a date range.
 *
 * @param {string} userId - User UUID
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {Promise<Array>} GSC snapshot records
 */
async function fetchGSCSnapshots(userId, startDate, endDate) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  const res = await fetch(
    `${config.url}/rest/v1/performance_snapshots?user_id=eq.${encodeURIComponent(userId)}&source=eq.gsc&snapshot_date=gte.${startDate}&snapshot_date=lte.${endDate}&select=*`,
    {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey
      }
    }
  );

  if (!res.ok) {
    logger.warn('ga4_fetch_gsc_snapshots_failed', { userId, error: res.statusText });
    return [];
  }

  return await res.json();
}

/**
 * Build a lookup map from GSC snapshots: key = "path|date" -> snapshot
 * Strips protocol+domain from GSC URLs for matching with GA4 pagePaths.
 *
 * @param {Array} gscSnapshots - GSC snapshot records
 * @returns {Map<string, object>} Lookup map
 */
function buildGSCLookup(gscSnapshots) {
  const lookup = new Map();
  for (const snapshot of gscSnapshots) {
    const path = extractPathFromUrl(snapshot.url);
    const key = `${path}|${snapshot.snapshot_date}`;
    lookup.set(key, snapshot);
  }
  return lookup;
}

/**
 * Merge GA4 data with GSC snapshots and produce records for upsert.
 *
 * Strategy:
 * - If GSC snapshot exists for URL+date: UPDATE existing GSC row with GA4 fields
 * - If no GSC snapshot: INSERT new row with source='ga4'
 * - Create source='combined' snapshots merging both data sources
 *
 * @param {Array} parsedRows - Parsed GA4 rows from parseGA4Row
 * @param {string} userId - User UUID
 * @param {Map} gscLookup - GSC lookup map from buildGSCLookup
 * @returns {{ ga4Only: Array, gscUpdates: Array, combined: Array }}
 */
function mergeWithGSC(parsedRows, userId, gscLookup) {
  const ga4Only = [];
  const gscUpdates = [];
  const combined = [];

  for (const parsed of parsedRows) {
    const key = `${parsed.pagePath}|${parsed.snapshotDate}`;
    const gscSnapshot = gscLookup.get(key);

    if (gscSnapshot) {
      // GSC snapshot exists — update it with GA4 engagement fields
      gscUpdates.push({
        user_id: userId,
        url: gscSnapshot.url,
        snapshot_date: parsed.snapshotDate,
        source: 'gsc',
        // Preserve GSC fields
        clicks: gscSnapshot.clicks,
        impressions: gscSnapshot.impressions,
        ctr: gscSnapshot.ctr,
        avg_position: gscSnapshot.avg_position,
        health_score: gscSnapshot.health_score,
        decay_signal: gscSnapshot.decay_signal,
        // Add GA4 fields
        sessions: parsed.sessions,
        engaged_sessions: parsed.engaged_sessions,
        bounce_rate: parsed.bounce_rate,
        avg_engagement_time: parsed.avg_engagement_time,
        scroll_depth: parsed.scroll_depth,
        metadata: {
          ...(gscSnapshot.metadata || {}),
          ga4_merged: true,
          scrolled_users: parsed.scrolled_users,
          total_users: parsed.total_users
        }
      });

      // Create combined record
      combined.push({
        user_id: userId,
        url: gscSnapshot.url,
        snapshot_date: parsed.snapshotDate,
        source: 'combined',
        clicks: gscSnapshot.clicks,
        impressions: gscSnapshot.impressions,
        ctr: gscSnapshot.ctr,
        avg_position: gscSnapshot.avg_position,
        health_score: gscSnapshot.health_score,
        decay_signal: gscSnapshot.decay_signal,
        sessions: parsed.sessions,
        engaged_sessions: parsed.engaged_sessions,
        bounce_rate: parsed.bounce_rate,
        avg_engagement_time: parsed.avg_engagement_time,
        scroll_depth: parsed.scroll_depth,
        metadata: {
          gsc_source: true,
          ga4_source: true,
          scrolled_users: parsed.scrolled_users,
          total_users: parsed.total_users
        }
      });
    } else {
      // No GSC match — GA4-only record
      ga4Only.push(normalizeRow(parsed, userId, parsed.pagePath));
    }
  }

  return { ga4Only, gscUpdates, combined };
}

/**
 * Batch upsert records into performance_snapshots.
 *
 * @param {Array} records - Snapshot records to upsert
 * @returns {Promise<{ inserted: number, errors: number }>}
 */
async function batchUpsert(records) {
  if (!records || records.length === 0) {
    return { inserted: 0, errors: 0 };
  }

  const { config, serviceRoleKey } = getSupabaseAdmin();
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < records.length; i += UPSERT_BATCH_SIZE) {
    const batch = records.slice(i, i + UPSERT_BATCH_SIZE);

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
        logger.error('ga4_upsert_batch_failed', {
          batchStart: i,
          batchSize: batch.length,
          error: errBody.message || res.statusText
        });
        errors += batch.length;
      }
    } catch (e) {
      logger.error('ga4_upsert_batch_error', {
        batchStart: i,
        batchSize: batch.length,
        error: e.message
      });
      errors += batch.length;
    }
  }

  return { inserted, errors };
}

/**
 * Normalize GA4 rows, merge with GSC, and batch-upsert into performance_snapshots.
 *
 * @param {Array} rows - Raw GA4 API rows
 * @param {string} userId - User UUID
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {Promise<{ inserted: number, errors: number, merged: number }>}
 */
async function normalizeAndStore(rows, userId, startDate, endDate) {
  if (!rows || rows.length === 0) {
    return { inserted: 0, errors: 0, merged: 0 };
  }

  // Parse all GA4 rows
  const parsedRows = rows.map(row => parseGA4Row(row));

  // Fetch existing GSC snapshots for merge
  const gscSnapshots = await fetchGSCSnapshots(userId, startDate, endDate);
  const gscLookup = buildGSCLookup(gscSnapshots);

  // Merge GA4 with GSC
  const { ga4Only, gscUpdates, combined } = mergeWithGSC(parsedRows, userId, gscLookup);

  // Upsert all record types
  const ga4Result = await batchUpsert(ga4Only);
  const updateResult = await batchUpsert(gscUpdates);
  const combinedResult = await batchUpsert(combined);

  const totalInserted = ga4Result.inserted + updateResult.inserted + combinedResult.inserted;
  const totalErrors = ga4Result.errors + updateResult.errors + combinedResult.errors;

  logger.info('ga4_normalize_complete', {
    userId,
    ga4Only: ga4Only.length,
    gscUpdates: gscUpdates.length,
    combined: combined.length,
    inserted: totalInserted,
    errors: totalErrors
  });

  return {
    inserted: totalInserted,
    errors: totalErrors,
    merged: gscUpdates.length
  };
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

  metadata.ga4_sync = jobStatus;

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
    `${config.url}/rest/v1/client_connections?id=eq.${encodeURIComponent(connectionId)}&select=metadata,status,last_sync_at,sync_count,ga4_property_id`,
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
    ga4PropertyId: conn.ga4_property_id,
    syncJob: (conn.metadata || {}).ga4_sync || null
  };
}

// ── Quota Management ──────────────────────────────────────────

/**
 * Track and check quota usage for a GA4 property.
 *
 * @param {string} connectionId - UUID
 * @param {number} requestsUsed - Number of API requests made
 * @returns {Promise<{ quotaUsed: number, quotaLimit: number, warning: boolean }>}
 */
async function trackQuotaUsage(connectionId, requestsUsed) {
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

  // Initialize or update quota tracking
  const today = formatDate(new Date());
  const quota = metadata.ga4_quota || {};

  if (quota.date !== today) {
    // Reset for new day
    quota.date = today;
    quota.used = 0;
  }

  quota.used = (quota.used || 0) + requestsUsed;
  quota.limit = DAILY_QUOTA_LIMIT;

  const warning = quota.used >= DAILY_QUOTA_LIMIT * QUOTA_WARNING_THRESHOLD;

  if (warning) {
    logger.warn('ga4_quota_warning', {
      connectionId,
      quotaUsed: quota.used,
      quotaLimit: DAILY_QUOTA_LIMIT,
      percentage: ((quota.used / DAILY_QUOTA_LIMIT) * 100).toFixed(1) + '%'
    });
  }

  metadata.ga4_quota = quota;

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

  return { quotaUsed: quota.used, quotaLimit: DAILY_QUOTA_LIMIT, warning };
}

// ── Main Sync Orchestrators ───────────────────────────────────

/**
 * Get the user's Google connection for GA4.
 */
async function getGA4Connection(userId) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  const res = await fetch(
    `${config.url}/rest/v1/client_connections?user_id=eq.${encodeURIComponent(userId)}&provider=eq.google&select=id,user_id,ga4_property_id,status,last_sync_at,sync_count,metadata`,
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
 * Run a full historical import (monthly chunks).
 * This is run on first connection or when explicitly triggered with mode='full'.
 *
 * @param {string} connectionId - UUID
 * @param {string} userId - UUID
 * @param {string} propertyId - GA4 property ID
 * @returns {Promise<{ totalRows: number, inserted: number, errors: number, merged: number, chunks: number, quotaUsed: number }>}
 */
async function runHistoricalImport(connectionId, userId, propertyId) {
  const chunks = generateHistoricalChunks();
  let totalRows = 0;
  let totalInserted = 0;
  let totalErrors = 0;
  let totalMerged = 0;
  let totalQuotaUsed = 0;

  logger.info('ga4_historical_import_start', {
    connectionId,
    userId,
    propertyId,
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
      const { rows, rowCount, quotaUsed } = await queryGA4Report(propertyId, connectionId, chunk.startDate, chunk.endDate);
      totalRows += rowCount;
      totalQuotaUsed += quotaUsed;

      const result = await normalizeAndStore(rows, userId, chunk.startDate, chunk.endDate);
      totalInserted += result.inserted;
      totalErrors += result.errors;
      totalMerged += result.merged;

      // Track quota
      await trackQuotaUsage(connectionId, quotaUsed);

      await updateSyncJobStatus(connectionId, {
        status: 'running',
        mode: 'historical',
        startedAt: new Date().toISOString(),
        totalChunks: chunks.length,
        completedChunks: i + 1,
        totalRows,
        inserted: totalInserted,
        merged: totalMerged,
        errors: totalErrors,
        lastChunk: chunk,
        quota_used: totalQuotaUsed
      });

      logger.info('ga4_historical_chunk_complete', {
        connectionId,
        chunk: i + 1,
        totalChunks: chunks.length,
        chunkRows: rowCount,
        startDate: chunk.startDate,
        endDate: chunk.endDate
      });
    } catch (e) {
      logger.error('ga4_historical_chunk_failed', {
        connectionId,
        chunk: i + 1,
        startDate: chunk.startDate,
        endDate: chunk.endDate,
        error: e.message
      });

      // If unrecoverable (403, auth failure), abort the whole import
      if (e instanceof GA4Error && e.unrecoverable) {
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
    merged: totalMerged,
    errors: totalErrors,
    quota_used: totalQuotaUsed
  });

  await incrementSyncCount(connectionId);

  logger.info('ga4_historical_import_complete', {
    connectionId,
    userId,
    totalRows,
    inserted: totalInserted,
    merged: totalMerged,
    errors: totalErrors,
    chunks: chunks.length,
    quotaUsed: totalQuotaUsed
  });

  return { totalRows, inserted: totalInserted, errors: totalErrors, merged: totalMerged, chunks: chunks.length, quotaUsed: totalQuotaUsed };
}

/**
 * Run an incremental pull (last 3 days for late-arriving data).
 *
 * @param {string} connectionId - UUID
 * @param {string} userId - UUID
 * @param {string} propertyId - GA4 property ID
 * @returns {Promise<{ totalRows: number, inserted: number, errors: number, merged: number, quotaUsed: number }>}
 */
async function runIncrementalPull(connectionId, userId, propertyId) {
  const range = generateIncrementalRange();

  logger.info('ga4_incremental_pull_start', {
    connectionId,
    userId,
    propertyId,
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
    const { rows, rowCount, quotaUsed } = await queryGA4Report(propertyId, connectionId, range.startDate, range.endDate);
    const result = await normalizeAndStore(rows, userId, range.startDate, range.endDate);

    // Track quota
    await trackQuotaUsage(connectionId, quotaUsed);

    await updateSyncJobStatus(connectionId, {
      status: 'completed',
      mode: 'incremental',
      completedAt: new Date().toISOString(),
      totalRows: rowCount,
      inserted: result.inserted,
      merged: result.merged,
      errors: result.errors,
      startDate: range.startDate,
      endDate: range.endDate,
      quota_used: quotaUsed
    });

    await incrementSyncCount(connectionId);
    await updateConnectionStatus(connectionId, 'connected');

    logger.info('ga4_incremental_pull_complete', {
      connectionId,
      userId,
      totalRows: rowCount,
      inserted: result.inserted,
      merged: result.merged,
      errors: result.errors,
      quotaUsed
    });

    return { totalRows: rowCount, inserted: result.inserted, errors: result.errors, merged: result.merged, quotaUsed };
  } catch (e) {
    logger.error('ga4_incremental_pull_failed', {
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
 * Handle POST /api/ingestion/trigger/ga4
 *
 * Triggers a GA4 sync job. Determines mode automatically:
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
  const connection = await getGA4Connection(userId);

  if (!connection) {
    return { success: false, error: 'No Google connection found. Please connect Google Analytics first.', statusCode: 404 };
  }

  if (connection.status === 'expired' || connection.status === 'revoked') {
    return { success: false, error: `Google connection is ${connection.status}. Please reconnect.`, statusCode: 403 };
  }

  if (!connection.ga4_property_id) {
    return { success: false, error: 'No GA4 property configured. Please select a Google Analytics property.', statusCode: 400 };
  }

  // Check if a sync is already running
  const currentSync = (connection.metadata || {}).ga4_sync;
  if (currentSync && currentSync.status === 'running') {
    return {
      success: false,
      error: 'A GA4 sync is already in progress.',
      statusCode: 409,
      data: currentSync
    };
  }

  // Determine mode
  const mode = body.mode || (connection.sync_count === 0 ? 'full' : 'incremental');
  const propertyId = connection.ga4_property_id;

  logger.info('ga4_trigger', { userId, connectionId: connection.id, mode, propertyId });

  // Run sync asynchronously — don't block the HTTP response
  const syncPromise = mode === 'full'
    ? runHistoricalImport(connection.id, userId, propertyId)
    : runIncrementalPull(connection.id, userId, propertyId);

  // Fire-and-forget with error logging
  syncPromise.catch(e => {
    logger.error('ga4_sync_failed', {
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
      propertyId,
      status: 'started',
      message: mode === 'full'
        ? 'Historical import started. This may take several minutes.'
        : 'Incremental sync started.'
    }
  };
}

/**
 * Handle GET /api/ingestion/ga4/status
 *
 * Returns the current GA4 sync status for the user.
 *
 * @param {string} userId - Authenticated user ID
 * @returns {Promise<object>} Sync status
 */
async function handleStatus(userId) {
  const connection = await getGA4Connection(userId);

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

  // Include quota info if available
  const quota = (connection.metadata || {}).ga4_quota || null;

  return {
    success: true,
    data: {
      connected: connection.status === 'connected',
      connectionStatus: syncStatus.connectionStatus,
      ga4PropertyId: syncStatus.ga4PropertyId,
      lastSyncAt: syncStatus.lastSyncAt,
      syncCount: syncStatus.syncCount,
      currentSync: syncStatus.syncJob,
      quota
    }
  };
}

// ── Exports ───────────────────────────────────────────────────

module.exports = {
  handleTrigger,
  handleStatus,
  // Exported for testing
  formatDate,
  parseGA4Date,
  buildReportBody,
  generateHistoricalChunks,
  generateIncrementalRange,
  parseGA4Row,
  normalizeRow,
  extractPathFromUrl,
  buildGSCLookup,
  mergeWithGSC,
  normalizeAndStore,
  batchUpsert,
  queryGA4Report,
  ga4ApiRequest,
  GA4Error,
  getGA4Connection,
  runHistoricalImport,
  runIncrementalPull,
  updateConnectionStatus,
  updateSyncJobStatus,
  getSyncJobStatus,
  incrementSyncCount,
  trackQuotaUsage,
  fetchGSCSnapshots,
  PAGE_SIZE,
  UPSERT_BATCH_SIZE,
  RETRY_DELAYS,
  INCREMENTAL_LOOKBACK_DAYS,
  DAILY_QUOTA_LIMIT,
  QUOTA_WARNING_THRESHOLD,
  GA4_DIMENSIONS,
  GA4_METRICS
};
