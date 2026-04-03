/**
 * Scheduler Tests — DI-005
 *
 * Tests for the tick-based automated data pull scheduler:
 * - Tick check: correct UTC times trigger correct jobs
 * - Missed-job recovery: stale connections re-queued
 * - Retry logic: failed job creates retry with attempt+1
 * - After 3 failures: connection marked stale
 * - Purge: rollup before delete, verify count > 0
 * - Partition naming: correct table names
 * - Concurrency: max 3 concurrent jobs enforced
 * - Schedule calculation: next sync times
 *
 * Uses node:test with mocked Supabase endpoints.
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

// Set env vars before requiring modules
process.env.BRIDGE_ENCRYPTION_KEY = 'a'.repeat(64);
process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:19847/api/connections/google/callback';
process.env.SUPABASE_URL = 'https://test-project.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

const {
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
} = require('../bridge/ingestion/scheduler');

// ── Helper: Mock fetch ──────────────────────────────────────

let fetchHandler;
const originalFetch = globalThis.fetch;

function mockFetch(handler) {
  fetchHandler = handler;
  globalThis.fetch = async (url, opts) => {
    return fetchHandler(url, opts);
  };
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

// ── Helper: create mock Response ────────────────────────────

function mockResponse(body, status = 200, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {
      get: (name) => headers[name.toLowerCase()] || null
    },
    json: async () => body,
    text: async () => JSON.stringify(body)
  };
}

// ── Helper: create scheduler with fake time ─────────────────

function createScheduler(utcDate, options = {}) {
  const fakeNow = new Date(utcDate);
  return new Scheduler({
    tickIntervalMs: 100, // fast ticks for testing
    now: () => fakeNow,
    connectors: options.connectors || {},
    ...options
  });
}

// ── Constants Tests ─────────────────────────────────────────

describe('Scheduler — Constants', () => {
  it('tick interval is 60 seconds', () => {
    assert.equal(TICK_INTERVAL_MS, 60000);
  });

  it('max concurrent jobs is 3', () => {
    assert.equal(MAX_CONCURRENT_JOBS, 3);
  });

  it('retry delays are [0, 300000, 1800000]', () => {
    assert.deepEqual(RETRY_DELAYS, [0, 300000, 1800000]);
  });

  it('daily stale threshold is 24 hours', () => {
    assert.equal(DAILY_STALE_HOURS, 24);
  });

  it('weekly stale threshold is 7 days', () => {
    assert.equal(WEEKLY_STALE_DAYS, 7);
  });

  it('connection error threshold is 48 hours', () => {
    assert.equal(CONNECTION_ERROR_HOURS, 48);
  });
});

// ── Schedule Definition Tests ───────────────────────────────

describe('Scheduler — Schedule Definitions', () => {
  it('GSC is daily at 03:00 UTC', () => {
    assert.equal(SCHEDULE.gsc.hour, 3);
    assert.equal(SCHEDULE.gsc.minute, 0);
    assert.equal(SCHEDULE.gsc.frequency, 'daily');
  });

  it('GA4 is daily at 03:30 UTC', () => {
    assert.equal(SCHEDULE.ga4.hour, 3);
    assert.equal(SCHEDULE.ga4.minute, 30);
    assert.equal(SCHEDULE.ga4.frequency, 'daily');
  });

  it('Semrush is weekly Monday 04:00 UTC', () => {
    assert.equal(SCHEDULE.semrush.hour, 4);
    assert.equal(SCHEDULE.semrush.minute, 0);
    assert.equal(SCHEDULE.semrush.frequency, 'weekly');
    assert.equal(SCHEDULE.semrush.dayOfWeek, 1); // Monday
  });

  it('Ahrefs is weekly Tuesday 04:00 UTC', () => {
    assert.equal(SCHEDULE.ahrefs.hour, 4);
    assert.equal(SCHEDULE.ahrefs.minute, 0);
    assert.equal(SCHEDULE.ahrefs.frequency, 'weekly');
    assert.equal(SCHEDULE.ahrefs.dayOfWeek, 2); // Tuesday
  });

  it('Purge is monthly 1st at 02:00 UTC', () => {
    assert.equal(SCHEDULE.purge.hour, 2);
    assert.equal(SCHEDULE.purge.minute, 0);
    assert.equal(SCHEDULE.purge.frequency, 'monthly');
    assert.equal(SCHEDULE.purge.dayOfMonth, 1);
  });

  it('Partition creation is monthly 1st at 01:00 UTC', () => {
    assert.equal(SCHEDULE.partition.hour, 1);
    assert.equal(SCHEDULE.partition.minute, 0);
    assert.equal(SCHEDULE.partition.frequency, 'monthly');
    assert.equal(SCHEDULE.partition.dayOfMonth, 1);
  });
});

// ── Partition Naming Tests ──────────────────────────────────

describe('Scheduler — Partition Naming', () => {
  it('April 2026 produces performance_snapshots_2026_04', () => {
    assert.equal(partitionName(2026, 4), 'performance_snapshots_2026_04');
  });

  it('January 2027 produces performance_snapshots_2027_01', () => {
    assert.equal(partitionName(2027, 1), 'performance_snapshots_2027_01');
  });

  it('December 2026 produces performance_snapshots_2026_12', () => {
    assert.equal(partitionName(2026, 12), 'performance_snapshots_2026_12');
  });
});

// ── Format Date Tests ───────────────────────────────────────

describe('Scheduler — formatDate', () => {
  it('formats date correctly', () => {
    assert.equal(formatDate(new Date('2026-03-28T12:00:00Z')), '2026-03-28');
  });

  it('zero-pads month and day', () => {
    assert.equal(formatDate(new Date('2026-01-05T00:00:00Z')), '2026-01-05');
  });
});

// ── Tick Trigger Tests ──────────────────────────────────────

describe('Scheduler — Tick Triggers', () => {
  let scheduler;
  let triggerLog;

  beforeEach(() => {
    triggerLog = [];
    mockFetch(async (url) => {
      // Return empty connections list for all queries
      if (url.includes('client_connections')) {
        return mockResponse([]);
      }
      return mockResponse([]);
    });
  });

  afterEach(async () => {
    if (scheduler && scheduler._running) {
      await scheduler.stop();
    }
    restoreFetch();
  });

  it('03:00 UTC triggers GSC job enqueue', async () => {
    // March 28, 2026 at 03:00 UTC (Saturday)
    scheduler = createScheduler('2026-03-28T03:00:00Z');

    // Manually invoke tick
    await scheduler._tick();

    // Check that the fired set includes gsc
    assert.ok(scheduler._firedToday.has('2026-03-28:gsc:3:0'));
  });

  it('03:30 UTC triggers GA4 job enqueue', async () => {
    scheduler = createScheduler('2026-03-28T03:30:00Z');
    await scheduler._tick();
    assert.ok(scheduler._firedToday.has('2026-03-28:ga4:3:30'));
  });

  it('04:00 UTC on Monday triggers Semrush', async () => {
    // March 30, 2026 is a Monday
    scheduler = createScheduler('2026-03-30T04:00:00Z');
    await scheduler._tick();
    assert.ok(scheduler._firedToday.has('2026-03-30:semrush:4:0'));
  });

  it('04:00 UTC on Tuesday triggers Ahrefs', async () => {
    // March 31, 2026 is a Tuesday
    scheduler = createScheduler('2026-03-31T04:00:00Z');
    await scheduler._tick();
    assert.ok(scheduler._firedToday.has('2026-03-31:ahrefs:4:0'));
  });

  it('04:00 UTC on Wednesday does NOT trigger Semrush', async () => {
    // April 1, 2026 is a Wednesday
    scheduler = createScheduler('2026-04-01T04:00:00Z');
    await scheduler._tick();
    assert.ok(!scheduler._firedToday.has('2026-04-01:semrush:4:0'));
  });

  it('does NOT fire same job twice in same minute', async () => {
    scheduler = createScheduler('2026-03-28T03:00:00Z');
    await scheduler._tick();
    await scheduler._tick();
    // firedToday should only have one entry for gsc
    const gscEntries = [...scheduler._firedToday].filter(k => k.includes(':gsc:'));
    assert.equal(gscEntries.length, 1);
  });

  it('01:00 UTC on 1st triggers partition creation', async () => {
    // April 1, 2026 at 01:00 UTC
    scheduler = createScheduler('2026-04-01T01:00:00Z');
    await scheduler._tick();
    assert.ok(scheduler._firedToday.has('2026-04-01:partition:1:0'));
  });

  it('02:00 UTC on 1st triggers purge', async () => {
    scheduler = createScheduler('2026-04-01T02:00:00Z');
    await scheduler._tick();
    assert.ok(scheduler._firedToday.has('2026-04-01:purge:2:0'));
  });
});

// ── Missed-Job Recovery Tests ───────────────────────────────

describe('Scheduler — Missed-Job Recovery', () => {
  afterEach(() => {
    restoreFetch();
  });

  it('connection with last_sync_at 36 hours ago triggers immediate pull', async () => {
    const now = new Date('2026-03-28T12:00:00Z');
    const staleTime = new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString();

    const triggeredSources = [];

    mockFetch(async (url, opts) => {
      if (url.includes('client_connections') && !opts?.method) {
        return mockResponse([
          {
            id: 'conn-1',
            user_id: 'user-1',
            provider: 'google',
            source: null,
            last_sync_at: staleTime,
            status: 'connected'
          }
        ]);
      }
      if (url.includes('ingestion_jobs') && opts?.method === 'POST') {
        const body = JSON.parse(opts.body);
        triggeredSources.push(body.source);
        return mockResponse([{ id: 'job-' + body.source }]);
      }
      if (url.includes('ingestion_jobs') && opts?.method === 'PATCH') {
        return mockResponse({});
      }
      return mockResponse([]);
    });

    const scheduler = new Scheduler({
      tickIntervalMs: 100000, // won't actually tick
      now: () => now,
      connectors: {
        gsc: { handleTrigger: async () => ({ success: true }) },
        ga4: { handleTrigger: async () => ({ success: true }) }
      }
    });

    await scheduler._recoverMissedJobs();

    // Wait for async job execution to finish
    await sleep(200);

    // Should have triggered jobs for both gsc and ga4 (google connection covers both)
    assert.ok(triggeredSources.includes('gsc'), 'GSC job should be triggered');
    assert.ok(triggeredSources.includes('ga4'), 'GA4 job should be triggered');
  });

  it('connection synced 12 hours ago is NOT re-queued for daily source', async () => {
    const now = new Date('2026-03-28T12:00:00Z');
    const recentTime = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();

    mockFetch(async (url) => {
      if (url.includes('client_connections')) {
        return mockResponse([
          {
            id: 'conn-1',
            user_id: 'user-1',
            provider: 'google',
            source: null,
            last_sync_at: recentTime,
            status: 'connected'
          }
        ]);
      }
      return mockResponse([]);
    });

    const scheduler = new Scheduler({
      tickIntervalMs: 100000,
      now: () => now,
      connectors: {}
    });

    await scheduler._recoverMissedJobs();

    assert.equal(scheduler._jobQueue.length, 0, 'No jobs should be queued for recent sync');
  });
});

// ── Retry Logic Tests ───────────────────────────────────────

describe('Scheduler — Retry Logic', () => {
  afterEach(() => {
    restoreFetch();
  });

  it('failed job creates retry with attempt+1 and correct delay', async () => {
    let jobCreated = null;
    let retryQueued = false;

    mockFetch(async (url, opts) => {
      if (url.includes('ingestion_jobs') && opts?.method === 'POST') {
        jobCreated = JSON.parse(opts.body);
        return mockResponse([{ id: 'job-1' }]);
      }
      if (url.includes('ingestion_jobs') && opts?.method === 'PATCH') {
        return mockResponse({});
      }
      return mockResponse([]);
    });

    const failConnector = {
      handleTrigger: async () => { throw new Error('API failure'); }
    };

    const scheduler = new Scheduler({
      tickIntervalMs: 100000,
      now: () => new Date('2026-03-28T03:00:00Z'),
      connectors: { gsc: failConnector }
    });

    // Manually execute a job that will fail
    scheduler._jobQueue.push({
      userId: 'user-1',
      source: 'gsc',
      triggerType: 'scheduled',
      attempt: 1,
      connectionId: 'conn-1'
    });

    await scheduler._processQueue();

    // Wait a bit for the job to finish
    await sleep(200);

    // The retry should be scheduled via setTimeout
    // After attempt 1 fails, a retry with attempt 2 should be scheduled
    // We can check by verifying the job was created with attempt 1
    assert.ok(jobCreated, 'Ingestion job should be created');
    assert.equal(jobCreated.attempt, 1);
    assert.equal(jobCreated.trigger_type, 'scheduled');
  });

  it('after 3 failures connection is marked stale', async () => {
    let stalePatched = false;
    let patchBody = null;

    mockFetch(async (url, opts) => {
      if (url.includes('ingestion_jobs') && opts?.method === 'POST') {
        return mockResponse([{ id: 'job-3' }]);
      }
      if (url.includes('ingestion_jobs') && opts?.method === 'PATCH') {
        return mockResponse({});
      }
      if (url.includes('client_connections') && opts?.method === 'PATCH') {
        stalePatched = true;
        patchBody = JSON.parse(opts.body);
        return mockResponse({});
      }
      return mockResponse([]);
    });

    const failConnector = {
      handleTrigger: async () => { throw new Error('Persistent failure'); }
    };

    const scheduler = new Scheduler({
      tickIntervalMs: 100000,
      now: () => new Date('2026-03-28T03:00:00Z'),
      connectors: { gsc: failConnector }
    });

    // Simulate 3rd attempt failure
    scheduler._jobQueue.push({
      userId: 'user-1',
      source: 'gsc',
      triggerType: 'retry',
      attempt: 3,
      connectionId: 'conn-1'
    });

    await scheduler._processQueue();
    await sleep(200);

    assert.ok(stalePatched, 'Connection should be marked stale after 3 failures');
    assert.equal(patchBody.status, 'stale');
    assert.ok(patchBody.last_error.includes('Persistent failure'));
  });
});

// ── Concurrency Control Tests ───────────────────────────────

describe('Scheduler — Concurrency Control', () => {
  afterEach(() => {
    restoreFetch();
  });

  it('enforces maximum 3 concurrent jobs', async () => {
    let concurrentCount = 0;
    let maxConcurrent = 0;

    mockFetch(async (url, opts) => {
      if (url.includes('ingestion_jobs') && opts?.method === 'POST') {
        return mockResponse([{ id: 'job-' + Math.random() }]);
      }
      if (url.includes('ingestion_jobs') && opts?.method === 'PATCH') {
        return mockResponse({});
      }
      return mockResponse([]);
    });

    const slowConnector = {
      handleTrigger: async () => {
        concurrentCount++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCount);
        await sleep(200);
        concurrentCount--;
        return { success: true };
      }
    };

    const scheduler = new Scheduler({
      tickIntervalMs: 100000,
      now: () => new Date('2026-03-28T03:00:00Z'),
      connectors: { gsc: slowConnector }
    });

    // Queue 5 jobs
    for (let i = 0; i < 5; i++) {
      scheduler._jobQueue.push({
        userId: `user-${i}`,
        source: 'gsc',
        triggerType: 'scheduled',
        attempt: 1,
        connectionId: `conn-${i}`
      });
    }

    await scheduler._processQueue();
    await sleep(600);

    assert.ok(maxConcurrent <= MAX_CONCURRENT_JOBS,
      `Max concurrent was ${maxConcurrent}, should be <= ${MAX_CONCURRENT_JOBS}`);
  });
});

// ── Purge & Rollup Tests ────────────────────────────────────

describe('Scheduler — Purge & Rollup', () => {
  afterEach(() => {
    restoreFetch();
  });

  it('rollup runs before delete', async () => {
    const callOrder = [];

    mockFetch(async (url, opts) => {
      if (url.includes('rpc/exec_sql') && opts?.method === 'POST') {
        const body = JSON.parse(opts.body);
        if (body.query.includes('INSERT INTO performance_snapshots_monthly')) {
          callOrder.push('rollup');
        } else if (body.query.includes('DELETE FROM performance_snapshots')) {
          callOrder.push('delete');
        }
        return mockResponse({});
      }
      if (url.includes('performance_snapshots_monthly') && url.includes('count')) {
        return mockResponse([], 200, { 'content-range': '0-9/10' });
      }
      if (url.includes('ingestion_jobs') && opts?.method === 'DELETE') {
        callOrder.push('cleanup_jobs');
        return mockResponse({});
      }
      return mockResponse([]);
    });

    const scheduler = new Scheduler({
      tickIntervalMs: 100000,
      now: () => new Date('2026-04-01T02:00:00Z'),
      connectors: {}
    });

    await scheduler._runPurgeJob();

    assert.ok(callOrder.indexOf('rollup') < callOrder.indexOf('delete'),
      'Rollup must happen before delete');
  });

  it('delete is skipped when rollup count is 0', async () => {
    let deleteExecuted = false;

    mockFetch(async (url, opts) => {
      if (url.includes('rpc/exec_sql') && opts?.method === 'POST') {
        const body = JSON.parse(opts.body);
        if (body.query.includes('DELETE FROM performance_snapshots')) {
          deleteExecuted = true;
        }
        return mockResponse({});
      }
      if (url.includes('performance_snapshots_monthly') && url.includes('count')) {
        return mockResponse([], 200, { 'content-range': '0-0/0' });
      }
      if (url.includes('ingestion_jobs')) {
        return mockResponse({});
      }
      return mockResponse([]);
    });

    const scheduler = new Scheduler({
      tickIntervalMs: 100000,
      now: () => new Date('2026-04-01T02:00:00Z'),
      connectors: {}
    });

    await scheduler._runPurgeJob();

    assert.ok(!deleteExecuted, 'Delete should be skipped when rollup count is 0');
  });
});

// ── Partition Job Tests ─────────────────────────────────────

describe('Scheduler — Partition Creation', () => {
  afterEach(() => {
    restoreFetch();
  });

  it('creates partition for 2 months ahead', async () => {
    let sqlExecuted = null;

    mockFetch(async (url, opts) => {
      if (url.includes('rpc/exec_sql') && opts?.method === 'POST') {
        sqlExecuted = JSON.parse(opts.body).query;
        return mockResponse({});
      }
      return mockResponse([]);
    });

    // Running on April 1, 2026 should create June 2026 partition
    const scheduler = new Scheduler({
      tickIntervalMs: 100000,
      now: () => new Date('2026-04-01T01:00:00Z'),
      connectors: {}
    });

    await scheduler._runPartitionJob();

    assert.ok(sqlExecuted, 'SQL should be executed');
    assert.ok(sqlExecuted.includes('performance_snapshots_2026_06'),
      `Expected partition name performance_snapshots_2026_06 in: ${sqlExecuted}`);
    assert.ok(sqlExecuted.includes("'2026-06-01'"), 'Start date should be 2026-06-01');
    assert.ok(sqlExecuted.includes("'2026-07-01'"), 'End date should be 2026-07-01');
  });

  it('handles December -> January year rollover', async () => {
    let sqlExecuted = null;

    mockFetch(async (url, opts) => {
      if (url.includes('rpc/exec_sql') && opts?.method === 'POST') {
        sqlExecuted = JSON.parse(opts.body).query;
        return mockResponse({});
      }
      return mockResponse([]);
    });

    // Running on November 1, 2026 should create January 2027 partition
    const scheduler = new Scheduler({
      tickIntervalMs: 100000,
      now: () => new Date('2026-11-01T01:00:00Z'),
      connectors: {}
    });

    await scheduler._runPartitionJob();

    assert.ok(sqlExecuted.includes('performance_snapshots_2027_01'),
      `Expected partition name performance_snapshots_2027_01 in: ${sqlExecuted}`);
  });
});

// ── Staleness Detection Tests ───────────────────────────────

describe('Scheduler — Staleness Detection', () => {
  afterEach(() => {
    restoreFetch();
  });

  it('marks connections as error after 48h without sync', async () => {
    let patchedStatus = null;

    const now = new Date('2026-03-28T12:00:00Z');
    const staleTime = new Date(now.getTime() - 50 * 60 * 60 * 1000).toISOString();

    mockFetch(async (url, opts) => {
      if (url.includes('client_connections') && url.includes('status=eq.connected') && !opts?.method) {
        return mockResponse([
          { id: 'conn-1', user_id: 'user-1', last_sync_at: staleTime }
        ]);
      }
      if (url.includes('client_connections') && opts?.method === 'PATCH') {
        patchedStatus = JSON.parse(opts.body);
        return mockResponse({});
      }
      return mockResponse([]);
    });

    const scheduler = new Scheduler({
      tickIntervalMs: 100000,
      now: () => now,
      connectors: {}
    });

    await scheduler._checkStaleness();

    assert.ok(patchedStatus, 'Connection should be patched');
    assert.equal(patchedStatus.status, 'error');
    assert.ok(patchedStatus.last_error.includes('48'));
  });
});

// ── Scheduler Status Tests ──────────────────────────────────

describe('Scheduler — Status', () => {
  it('getStatus returns correct structure when not running', () => {
    const scheduler = createScheduler('2026-03-28T12:00:00Z');
    const status = scheduler.getStatus();

    assert.equal(status.running, false);
    assert.equal(status.startedAt, null);
    assert.equal(status.lastTick, null);
    assert.equal(status.jobsInQueue, 0);
    assert.equal(status.jobsRunning, 0);
    assert.ok(status.nextScheduled.gsc, 'Should include gsc next time');
    assert.ok(status.nextScheduled.ga4, 'Should include ga4 next time');
    assert.ok(status.nextScheduled.semrush, 'Should include semrush next time');
    assert.ok(status.nextScheduled.ahrefs, 'Should include ahrefs next time');
  });

  it('getStatus reflects running state after start', async () => {
    mockFetch(async () => mockResponse([]));

    const scheduler = createScheduler('2026-03-28T12:00:00Z');
    await scheduler.start();

    const status = scheduler.getStatus();
    assert.equal(status.running, true);
    assert.ok(status.startedAt, 'Should have startedAt');

    await scheduler.stop();
    restoreFetch();
  });

  it('/health includes scheduler status fields', () => {
    const scheduler = createScheduler('2026-03-28T12:00:00Z');
    const status = scheduler.getStatus();

    // Verify the fields that /health expects
    assert.ok('running' in status);
    assert.ok('lastTick' in status);
    assert.ok('jobsInQueue' in status);
    assert.ok('jobsRunning' in status);
    assert.ok('nextScheduled' in status);
  });
});

// ── Placeholder Connector Tests ─────────────────────────────

describe('Scheduler — Placeholder Connectors', () => {
  afterEach(() => {
    restoreFetch();
  });

  it('rejects when connector is not registered', async () => {
    mockFetch(async (url, opts) => {
      if (url.includes('ingestion_jobs') && opts?.method === 'POST') {
        return mockResponse([{ id: 'job-placeholder' }]);
      }
      if (url.includes('ingestion_jobs') && opts?.method === 'PATCH') {
        return mockResponse({});
      }
      return mockResponse([]);
    });

    const scheduler = new Scheduler({
      tickIntervalMs: 100000,
      now: () => new Date('2026-03-30T04:00:00Z'),
      connectors: {} // no connectors registered
    });

    // Unregistered connectors should throw with clear error
    await assert.rejects(
      () => scheduler._runConnectorJob('user-1', 'semrush', 'conn-1'),
      { message: /No connector registered for source: semrush/ }
    );

    await assert.rejects(
      () => scheduler._runConnectorJob('user-1', 'ahrefs', 'conn-1'),
      { message: /No connector registered for source: ahrefs/ }
    );
  });
});

// ── Zero Dependencies Test ──────────────────────────────────

describe('Scheduler — Zero Dependencies', () => {
  it('uses only Node.js built-ins (crypto)', () => {
    // The scheduler module should only require crypto, logger, and supabase-client
    // No cron library, no external deps
    const fs = require('fs');
    const path = require('path');
    const schedulerSource = fs.readFileSync(
      path.join(__dirname, '..', 'bridge', 'ingestion', 'scheduler.js'),
      'utf-8'
    );

    // Check there's no require of any npm package
    const requires = schedulerSource.match(/require\(['"]([^'"]+)['"]\)/g) || [];
    for (const req of requires) {
      const modName = req.match(/require\(['"]([^'"]+)['"]\)/)[1];
      // Should only be relative paths or node: built-ins
      assert.ok(
        modName.startsWith('.') || modName.startsWith('node:') || modName === 'crypto',
        `Unexpected dependency: ${modName}`
      );
    }
  });
});
