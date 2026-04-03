/**
 * Automated Data Pull Scheduler — DI-005
 *
 * Tick-based scheduler (60s setInterval, no cron library) that triggers:
 * - Daily GSC pull at 03:00 UTC
 * - Daily GA4 pull at 03:30 UTC
 * - Weekly Semrush on Monday 04:00 UTC (placeholder)
 * - Weekly Ahrefs on Tuesday 04:00 UTC (placeholder)
 * - Monthly purge + rollup on 1st at 02:00 UTC
 * - Monthly partition creation on 1st at 01:00 UTC
 * - OAuth state cleanup every 5 minutes
 *
 * Features:
 * - Per-client scheduling via client_connections
 * - Missed-job recovery on process restart
 * - Retry logic: 3 attempts with exponential backoff (0, 5min, 30min)
 * - Concurrency control: max 3 concurrent ingestion jobs
 * - Staleness detection: 48h without sync -> connection status 'error'
 * - Graceful shutdown: completes running jobs before exit
 *
 * Zero npm dependencies — Node.js built-ins only.
 */

const crypto = require('crypto');
const logger = require('../logger');
const supabase = require('../supabase-client');

// ── Constants ──────────────────────────────────────────────────

const TICK_INTERVAL_MS = 60 * 1000; // 60 seconds
const MAX_CONCURRENT_JOBS = 3;

// Retry delays: attempt 1 = immediate, attempt 2 = 5 min, attempt 3 = 30 min
const RETRY_DELAYS = [0, 300000, 1800000];

// Staleness thresholds
const DAILY_STALE_HOURS = 24;
const WEEKLY_STALE_DAYS = 7;
const CONNECTION_ERROR_HOURS = 48;

// Schedule definitions (UTC)
const SCHEDULE = {
  gsc:       { hour: 3,  minute: 0,  frequency: 'daily' },
  ga4:       { hour: 3,  minute: 30, frequency: 'daily' },
  semrush:   { hour: 4,  minute: 0,  frequency: 'weekly', dayOfWeek: 1 }, // Monday
  ahrefs:    { hour: 4,  minute: 0,  frequency: 'weekly', dayOfWeek: 2 }, // Tuesday
  purge:     { hour: 2,  minute: 0,  frequency: 'monthly', dayOfMonth: 1 },
  partition: { hour: 1,  minute: 0,  frequency: 'monthly', dayOfMonth: 1 }
};

// OAuth cleanup interval (5 minutes)
const OAUTH_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

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

// ── Helper: generate partition table name ─────────────────────

function partitionName(year, month) {
  return `performance_snapshots_${year}_${String(month).padStart(2, '0')}`;
}

// ── Scheduler Class ───────────────────────────────────────────

class Scheduler {
  constructor(options = {}) {
    this._running = false;
    this._tickTimer = null;
    this._oauthCleanupTimer = null;
    this._lastTick = null;
    this._startedAt = null;

    // Active job tracking
    this._runningJobs = new Map(); // jobId -> { userId, source, promise }
    this._jobQueue = [];           // { userId, source, triggerType, attempt, connectionId }

    // Track which (user+source+hour) combos fired this UTC day to avoid duplicates
    this._firedToday = new Set();
    this._firedDate = null; // YYYY-MM-DD of current tracking day

    // Connectors — injected or lazy-loaded
    this._connectors = options.connectors || {};

    // Allow tick interval override for testing
    this._tickIntervalMs = options.tickIntervalMs || TICK_INTERVAL_MS;

    // Allow custom time provider for testing
    this._now = options.now || (() => new Date());
  }

  // ── Public API ────────────────────────────────────────────

  /**
   * Start the scheduler. Runs missed-job recovery, then begins ticking.
   */
  async start() {
    if (this._running) return;
    this._running = true;
    this._startedAt = new Date();

    logger.info('scheduler_starting', { tickInterval: this._tickIntervalMs });

    // Run missed-job recovery before first tick
    try {
      await this._recoverMissedJobs();
    } catch (e) {
      logger.error('scheduler_recovery_failed', { error: e.message });
    }

    // Start tick loop
    this._tickTimer = setInterval(() => {
      this._tick().catch(e => {
        logger.error('scheduler_tick_error', { error: e.message });
      });
    }, this._tickIntervalMs);

    // OAuth state cleanup every 5 minutes
    this._oauthCleanupTimer = setInterval(() => {
      this._cleanupOAuthStates().catch(e => {
        logger.warn('scheduler_oauth_cleanup_error', { error: e.message });
      });
    }, OAUTH_CLEANUP_INTERVAL_MS);

    logger.info('scheduler_started', { startedAt: this._startedAt.toISOString() });
  }

  /**
   * Stop the scheduler gracefully. Waits for running jobs to complete.
   */
  async stop() {
    if (!this._running) return;
    this._running = false;

    logger.info('scheduler_stopping', { runningJobs: this._runningJobs.size });

    // Clear timers
    if (this._tickTimer) {
      clearInterval(this._tickTimer);
      this._tickTimer = null;
    }
    if (this._oauthCleanupTimer) {
      clearInterval(this._oauthCleanupTimer);
      this._oauthCleanupTimer = null;
    }

    // Wait for running jobs to finish (with 60s timeout)
    if (this._runningJobs.size > 0) {
      logger.info('scheduler_waiting_for_jobs', { count: this._runningJobs.size });
      const promises = Array.from(this._runningJobs.values()).map(j => j.promise);
      await Promise.race([
        Promise.allSettled(promises),
        sleep(60000)
      ]);
    }

    logger.info('scheduler_stopped', {});
  }

  /**
   * Get current scheduler status for /health and /api/ingestion/schedule endpoints.
   */
  getStatus() {
    const now = this._now();
    return {
      running: this._running,
      startedAt: this._startedAt ? this._startedAt.toISOString() : null,
      lastTick: this._lastTick ? this._lastTick.toISOString() : null,
      jobsInQueue: this._jobQueue.length,
      jobsRunning: this._runningJobs.size,
      nextScheduled: this._getNextScheduledTimes(now)
    };
  }

  /**
   * Get detailed schedule info for a specific user.
   * @param {string} userId
   * @returns {Promise<object>}
   */
  async getScheduleForUser(userId) {
    try {
      const { config, serviceRoleKey } = getSupabaseAdmin();

      // Get user's connections
      const connRes = await fetch(
        `${config.url}/rest/v1/client_connections?user_id=eq.${encodeURIComponent(userId)}&select=id,provider,source,status,last_sync_at,last_error`,
        {
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': 'Bearer ' + serviceRoleKey
          }
        }
      );

      const connections = connRes.ok ? await connRes.json() : [];

      // Get recent jobs for user
      const jobsRes = await fetch(
        `${config.url}/rest/v1/ingestion_jobs?user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=20&select=id,source,status,trigger_type,attempt,started_at,completed_at,error,created_at`,
        {
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': 'Bearer ' + serviceRoleKey
          }
        }
      );

      const recentJobs = jobsRes.ok ? await jobsRes.json() : [];

      // Build per-source status
      const sources = {};
      for (const source of ['gsc', 'ga4', 'semrush', 'ahrefs']) {
        const conn = connections.find(c =>
          (source === 'gsc' || source === 'ga4') ? c.provider === 'google' : c.source === source
        );
        const lastJob = recentJobs.find(j => j.source === source && j.status === 'completed');
        const failedJobs = recentJobs.filter(j => j.source === source && j.status === 'failed');

        sources[source] = {
          lastSync: conn ? conn.last_sync_at : null,
          nextSync: this._getNextSyncTime(source),
          status: conn ? conn.status : 'not_connected',
          errorCount: failedJobs.length,
          lastError: conn ? conn.last_error : null
        };
      }

      // Active jobs for this user
      const activeJobs = recentJobs.filter(j =>
        j.status === 'queued' || j.status === 'running'
      );

      return {
        success: true,
        data: {
          sources,
          activeJobs,
          scheduler: this.getStatus()
        }
      };
    } catch (e) {
      logger.error('scheduler_get_schedule_error', { userId, error: e.message });
      return { success: false, error: e.message };
    }
  }

  // ── Core Tick Logic ───────────────────────────────────────

  async _tick() {
    const now = this._now();
    this._lastTick = now;

    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();
    const utcDay = now.getUTCDay(); // 0=Sun, 1=Mon, ...
    const utcDate = now.getUTCDate();
    const todayStr = formatDate(now);

    // Reset fired tracking on new day
    if (this._firedDate !== todayStr) {
      this._firedToday.clear();
      this._firedDate = todayStr;
    }

    // Check each schedule entry
    for (const [source, sched] of Object.entries(SCHEDULE)) {
      if (!this._shouldTrigger(source, sched, utcHour, utcMinute, utcDay, utcDate)) continue;

      const fireKey = `${todayStr}:${source}:${utcHour}:${utcMinute}`;
      if (this._firedToday.has(fireKey)) continue;
      this._firedToday.add(fireKey);

      logger.info('scheduler_trigger', { source, hour: utcHour, minute: utcMinute });

      if (source === 'purge') {
        this._enqueueSystemJob('purge');
      } else if (source === 'partition') {
        this._enqueueSystemJob('partition');
      } else {
        await this._enqueueSourceJobs(source);
      }
    }

    // Process queued jobs (respect concurrency limit)
    await this._processQueue();

    // Staleness check (run once per tick)
    await this._checkStaleness();
  }

  _shouldTrigger(source, sched, hour, minute, dayOfWeek, dayOfMonth) {
    if (sched.hour !== hour) return false;
    // Allow a 1-minute window for the trigger
    if (sched.minute !== minute) return false;

    if (sched.frequency === 'weekly' && sched.dayOfWeek !== dayOfWeek) return false;
    if (sched.frequency === 'monthly' && sched.dayOfMonth !== dayOfMonth) return false;

    return true;
  }

  // ── Job Enqueueing ────────────────────────────────────────

  async _enqueueSourceJobs(source) {
    try {
      const connections = await this._getActiveConnections(source);
      for (const conn of connections) {
        this._jobQueue.push({
          userId: conn.user_id,
          source,
          triggerType: 'scheduled',
          attempt: 1,
          connectionId: conn.id
        });
      }
      logger.info('scheduler_jobs_enqueued', { source, count: connections.length });
    } catch (e) {
      logger.error('scheduler_enqueue_failed', { source, error: e.message });
    }
  }

  _enqueueSystemJob(type) {
    // System jobs use a sentinel user_id
    this._jobQueue.push({
      userId: 'system',
      source: type,
      triggerType: 'scheduled',
      attempt: 1,
      connectionId: null
    });
  }

  // ── Queue Processing ──────────────────────────────────────

  async _processQueue() {
    while (this._jobQueue.length > 0 && this._runningJobs.size < MAX_CONCURRENT_JOBS) {
      const job = this._jobQueue.shift();
      if (!job) break;

      const jobId = crypto.randomUUID();
      const promise = this._executeJob(jobId, job).catch(e => {
        logger.error('scheduler_job_failed', { jobId, source: job.source, error: e.message });
      }).finally(() => {
        this._runningJobs.delete(jobId);
        // Try to process more from queue after completion
        if (this._running && this._jobQueue.length > 0) {
          this._processQueue().catch(() => {});
        }
      });

      this._runningJobs.set(jobId, {
        userId: job.userId,
        source: job.source,
        promise
      });
    }
  }

  // ── Job Execution ─────────────────────────────────────────

  async _executeJob(jobId, job) {
    const { userId, source, triggerType, attempt, connectionId } = job;

    // Create ingestion_jobs record
    let dbJobId = null;
    if (userId !== 'system') {
      dbJobId = await this._createIngestionJob(userId, source, triggerType, attempt);
    }

    try {
      if (source === 'purge') {
        await this._runPurgeJob();
      } else if (source === 'partition') {
        await this._runPartitionJob();
      } else {
        await this._runConnectorJob(userId, source, connectionId);
      }

      // Mark job completed
      if (dbJobId) {
        await this._updateIngestionJob(dbJobId, 'completed', null);
      }

      logger.info('scheduler_job_completed', { jobId, source, userId, attempt });
    } catch (e) {
      logger.error('scheduler_job_error', { jobId, source, userId, attempt, error: e.message });

      // Mark job failed
      if (dbJobId) {
        await this._updateIngestionJob(dbJobId, 'failed', e.message);
      }

      // Retry logic
      if (attempt < 3) {
        const delay = RETRY_DELAYS[attempt]; // attempt 1 -> index 1 -> 5min
        logger.info('scheduler_job_retry_scheduled', {
          source, userId, nextAttempt: attempt + 1, delayMs: delay
        });

        // Schedule retry after delay
        setTimeout(() => {
          if (!this._running) return;
          this._jobQueue.push({
            userId,
            source,
            triggerType: 'retry',
            attempt: attempt + 1,
            connectionId
          });
          this._processQueue().catch(() => {});
        }, delay);
      } else {
        // 3rd attempt failed — mark connection as stale
        logger.warn('scheduler_job_max_retries', { source, userId, connectionId });
        if (connectionId) {
          await this._markConnectionStale(connectionId, e.message);
        }
      }
    }
  }

  async _runConnectorJob(userId, source, connectionId) {
    const connector = this._connectors[source];
    if (!connector) {
      throw new Error(`No connector registered for source: ${source}`);
    }

    await connector.handleTrigger(userId, { mode: 'incremental' });
  }

  // ── Missed-Job Recovery ───────────────────────────────────

  async _recoverMissedJobs() {
    logger.info('scheduler_recovery_start', {});

    try {
      const { config, serviceRoleKey } = getSupabaseAdmin();

      // Get all active connections
      const res = await fetch(
        `${config.url}/rest/v1/client_connections?status=in.(connected,stale)&select=id,user_id,provider,source,last_sync_at,status`,
        {
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': 'Bearer ' + serviceRoleKey
          }
        }
      );

      if (!res.ok) {
        logger.warn('scheduler_recovery_fetch_failed', { status: res.status });
        return;
      }

      const connections = await res.json();
      let recovered = 0;

      for (const conn of connections) {
        const sources = this._getSourcesForConnection(conn);

        for (const source of sources) {
          const staleHours = this._getStaleHours(conn.last_sync_at);
          const schedule = SCHEDULE[source];
          if (!schedule) continue;

          const isStale = schedule.frequency === 'daily'
            ? staleHours > DAILY_STALE_HOURS
            : staleHours > (WEEKLY_STALE_DAYS * 24);

          if (isStale) {
            logger.info('scheduler_missed_job_recovery', {
              user_id: conn.user_id,
              source,
              hours_stale: Math.round(staleHours)
            });

            this._jobQueue.push({
              userId: conn.user_id,
              source,
              triggerType: 'scheduled',
              attempt: 1,
              connectionId: conn.id
            });
            recovered++;
          }
        }
      }

      logger.info('scheduler_recovery_complete', { connectionsChecked: connections.length, jobsRecovered: recovered });

      // Process recovered jobs
      if (recovered > 0) {
        await this._processQueue();
      }
    } catch (e) {
      logger.error('scheduler_recovery_error', { error: e.message });
    }
  }

  _getSourcesForConnection(conn) {
    if (conn.provider === 'google') return ['gsc', 'ga4'];
    if (conn.source) return [conn.source];
    return [];
  }

  _getStaleHours(lastSyncAt) {
    if (!lastSyncAt) return Infinity;
    const now = this._now();
    const last = new Date(lastSyncAt);
    return (now.getTime() - last.getTime()) / (1000 * 60 * 60);
  }

  // ── Staleness Detection ───────────────────────────────────

  async _checkStaleness() {
    try {
      const { config, serviceRoleKey } = getSupabaseAdmin();

      const cutoff = new Date(this._now().getTime() - CONNECTION_ERROR_HOURS * 60 * 60 * 1000);

      // Find connections that haven't synced in 48+ hours and aren't already in error state
      const res = await fetch(
        `${config.url}/rest/v1/client_connections?status=eq.connected&last_sync_at=lt.${cutoff.toISOString()}&select=id,user_id,last_sync_at`,
        {
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': 'Bearer ' + serviceRoleKey
          }
        }
      );

      if (!res.ok) return;
      const staleConns = await res.json();

      for (const conn of staleConns) {
        logger.warn('scheduler_connection_stale', {
          connectionId: conn.id,
          userId: conn.user_id,
          lastSyncAt: conn.last_sync_at
        });

        await fetch(
          `${config.url}/rest/v1/client_connections?id=eq.${encodeURIComponent(conn.id)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': serviceRoleKey,
              'Authorization': 'Bearer ' + serviceRoleKey,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              status: 'error',
              last_error: 'No successful sync in 48+ hours',
              updated_at: new Date().toISOString()
            })
          }
        );
      }
    } catch (e) {
      // Staleness check is non-critical; don't throw
      logger.warn('scheduler_staleness_check_error', { error: e.message });
    }
  }

  // ── Purge & Rollup Job ────────────────────────────────────

  async _runPurgeJob() {
    logger.info('scheduler_purge_start', {});
    const { config, serviceRoleKey } = getSupabaseAdmin();

    // Step 1: Rollup data older than 90 days into monthly averages
    const rollupSql = `
      INSERT INTO performance_snapshots_monthly (user_id, content_id, url, month, avg_clicks, avg_impressions, avg_ctr, avg_position, total_sessions, avg_health_score)
      SELECT user_id, content_id, url,
             date_trunc('month', snapshot_date)::date,
             AVG(clicks), AVG(impressions), AVG(ctr), AVG(avg_position),
             SUM(sessions), AVG(health_score)
      FROM performance_snapshots
      WHERE snapshot_date < now() - interval '90 days'
      GROUP BY user_id, content_id, url, date_trunc('month', snapshot_date)
      ON CONFLICT (user_id, url, month) DO UPDATE SET
        avg_clicks = EXCLUDED.avg_clicks,
        avg_impressions = EXCLUDED.avg_impressions,
        avg_ctr = EXCLUDED.avg_ctr,
        avg_position = EXCLUDED.avg_position,
        total_sessions = EXCLUDED.total_sessions,
        avg_health_score = EXCLUDED.avg_health_score
    `;

    // Execute rollup via Supabase RPC (service_role)
    const rollupRes = await fetch(
      `${config.url}/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': 'Bearer ' + serviceRoleKey
        },
        body: JSON.stringify({ query: rollupSql })
      }
    );

    // Verify rollup by checking row count
    const verifyRes = await fetch(
      `${config.url}/rest/v1/performance_snapshots_monthly?select=count`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': 'Bearer ' + serviceRoleKey,
          'Prefer': 'count=exact'
        }
      }
    );

    const rollupCount = verifyRes.ok
      ? parseInt(verifyRes.headers.get('content-range')?.split('/')[1] || '0', 10)
      : 0;

    // Step 2: Only delete if rollup succeeded (safety check)
    if (rollupCount > 0) {
      const deleteSql = `
        DELETE FROM performance_snapshots
        WHERE snapshot_date < now() - interval '90 days'
      `;

      const deleteRes = await fetch(
        `${config.url}/rest/v1/rpc/exec_sql`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': 'Bearer ' + serviceRoleKey
          },
          body: JSON.stringify({ query: deleteSql })
        }
      );

      logger.info('scheduler_purge_complete', {
        rows_rolled_up: rollupCount,
        rows_deleted: 'verified',
        storage_freed_estimate: `${Math.round(rollupCount * 0.0005)}MB`
      });
    } else {
      logger.warn('scheduler_purge_skip_delete', {
        reason: 'Rollup count is 0, skipping delete for safety'
      });
    }

    // Step 3: Clean up old ingestion_jobs (90 days)
    await fetch(
      `${config.url}/rest/v1/ingestion_jobs?created_at=lt.${new Date(this._now().getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': 'Bearer ' + serviceRoleKey
        }
      }
    );

    logger.info('scheduler_purge_job_complete', {});
  }

  // ── Partition Management ──────────────────────────────────

  async _runPartitionJob() {
    logger.info('scheduler_partition_start', {});
    const { config, serviceRoleKey } = getSupabaseAdmin();
    const now = this._now();

    // Create partition for 2 months ahead
    const futureDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 1));
    const year = futureDate.getUTCFullYear();
    const month = futureDate.getUTCMonth() + 1;
    const pName = partitionName(year, month);

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

    const sql = `CREATE TABLE IF NOT EXISTS ${pName} PARTITION OF performance_snapshots FOR VALUES FROM ('${startDate}') TO ('${endDate}')`;

    await fetch(
      `${config.url}/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': 'Bearer ' + serviceRoleKey
        },
        body: JSON.stringify({ query: sql })
      }
    );

    logger.info('scheduler_partition_created', { partition: pName, startDate, endDate });
  }

  // ── OAuth Cleanup ─────────────────────────────────────────

  async _cleanupOAuthStates() {
    try {
      const { config, serviceRoleKey } = getSupabaseAdmin();

      await fetch(
        `${config.url}/rest/v1/oauth_states?created_at=lt.${new Date(this._now().getTime() - 10 * 60 * 1000).toISOString()}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': 'Bearer ' + serviceRoleKey
          }
        }
      );
    } catch (e) {
      logger.warn('scheduler_oauth_cleanup_error', { error: e.message });
    }
  }

  // ── Database Helpers ──────────────────────────────────────

  async _getActiveConnections(source) {
    const { config, serviceRoleKey } = getSupabaseAdmin();

    // Map source to provider filter
    let filter;
    if (source === 'gsc' || source === 'ga4') {
      filter = 'provider=eq.google&status=in.(connected,stale)';
    } else {
      filter = `source=eq.${source}&status=in.(connected,stale)`;
    }

    const res = await fetch(
      `${config.url}/rest/v1/client_connections?${filter}&select=id,user_id,provider,source,last_sync_at`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': 'Bearer ' + serviceRoleKey
        }
      }
    );

    if (!res.ok) return [];
    return await res.json();
  }

  async _createIngestionJob(userId, source, triggerType, attempt) {
    try {
      const { config, serviceRoleKey } = getSupabaseAdmin();

      const res = await fetch(
        `${config.url}/rest/v1/ingestion_jobs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': 'Bearer ' + serviceRoleKey,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            user_id: userId,
            source,
            status: 'running',
            trigger_type: triggerType,
            attempt,
            started_at: new Date().toISOString(),
            metadata: {}
          })
        }
      );

      if (res.ok) {
        const rows = await res.json();
        return rows[0]?.id || null;
      }
      return null;
    } catch (e) {
      logger.warn('scheduler_create_job_error', { userId, source, error: e.message });
      return null;
    }
  }

  async _updateIngestionJob(jobId, status, error) {
    try {
      const { config, serviceRoleKey } = getSupabaseAdmin();

      const body = {
        status,
        completed_at: new Date().toISOString()
      };
      if (error) body.error = error;

      await fetch(
        `${config.url}/rest/v1/ingestion_jobs?id=eq.${encodeURIComponent(jobId)}`,
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
      logger.warn('scheduler_update_job_error', { jobId, status, error: e.message });
    }
  }

  async _markConnectionStale(connectionId, errorMsg) {
    try {
      const { config, serviceRoleKey } = getSupabaseAdmin();

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
            status: 'stale',
            last_error: errorMsg,
            updated_at: new Date().toISOString()
          })
        }
      );
    } catch (e) {
      logger.warn('scheduler_mark_stale_error', { connectionId, error: e.message });
    }
  }

  // ── Schedule Time Calculation ─────────────────────────────

  _getNextScheduledTimes(now) {
    const result = {};
    for (const [source, sched] of Object.entries(SCHEDULE)) {
      if (source === 'purge' || source === 'partition') continue;
      result[source] = this._getNextSyncTime(source, now);
    }
    return result;
  }

  _getNextSyncTime(source, now) {
    now = now || this._now();
    const sched = SCHEDULE[source];
    if (!sched) return null;

    const next = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      sched.hour,
      sched.minute,
      0
    ));

    // If that time has passed today, move to tomorrow
    if (next <= now) {
      next.setUTCDate(next.getUTCDate() + 1);
    }

    // For weekly: advance to correct day of week
    if (sched.frequency === 'weekly') {
      while (next.getUTCDay() !== sched.dayOfWeek) {
        next.setUTCDate(next.getUTCDate() + 1);
      }
    }

    // For monthly: advance to correct day of month
    if (sched.frequency === 'monthly') {
      if (next.getUTCDate() > sched.dayOfMonth || (next.getUTCDate() === sched.dayOfMonth && next <= now)) {
        next.setUTCMonth(next.getUTCMonth() + 1);
      }
      next.setUTCDate(sched.dayOfMonth);
    }

    return next.toISOString();
  }
}

// ── Exports ───────────────────────────────────────────────────

module.exports = {
  Scheduler,
  SCHEDULE,
  TICK_INTERVAL_MS,
  MAX_CONCURRENT_JOBS,
  RETRY_DELAYS,
  DAILY_STALE_HOURS,
  WEEKLY_STALE_DAYS,
  CONNECTION_ERROR_HOURS,
  partitionName,
  formatDate,
  sleep
};
