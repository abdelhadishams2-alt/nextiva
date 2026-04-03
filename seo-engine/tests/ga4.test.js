/**
 * GA4 Connector Tests — DI-003
 *
 * Tests for Google Analytics 4 Data API connector:
 * - Report request body validation
 * - GA4 response parsing (dimensionValues/metricValues)
 * - URL matching (pagePath to full URL)
 * - Scroll depth calculation
 * - Merge logic (update existing GSC, create GA4-only, create combined)
 * - Historical import chunks
 * - Error handling (401, 429, 403)
 * - Quota tracking
 * - Status endpoint response
 *
 * Uses node:test with mocked Supabase + Google endpoints.
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

const { encrypt } = require('../bridge/key-manager');
const ga4 = require('../bridge/ingestion/ga4');

// Pre-encrypt test tokens for mock data
const ENCRYPTED_ACCESS_TOKEN = encrypt('test-access-token');
const ENCRYPTED_REFRESH_TOKEN = encrypt('test-refresh-token');

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

// ── Helper: build a GA4 row ─────────────────────────────────

function makeGA4Row(pagePath, date, sessions, engagedSessions, bounceRate, avgDuration, scrolledUsers, totalUsers) {
  return {
    dimensionValues: [
      { value: pagePath },
      { value: date }
    ],
    metricValues: [
      { value: String(sessions) },
      { value: String(engagedSessions) },
      { value: String(bounceRate) },
      { value: String(avgDuration) },
      { value: String(scrolledUsers) },
      { value: String(totalUsers) }
    ]
  };
}

// ── Report Body Builder Tests ───────────────────────────────

describe('GA4 — Report Body Builder', () => {
  it('buildReportBody produces correct request body with defaults', () => {
    const body = ga4.buildReportBody('2024-01-01', '2024-01-31');
    assert.deepEqual(body.dateRanges, [{ startDate: '2024-01-01', endDate: '2024-01-31' }]);
    assert.deepEqual(body.dimensions, ga4.GA4_DIMENSIONS);
    assert.deepEqual(body.metrics, ga4.GA4_METRICS);
    assert.equal(body.limit, 10000);
    assert.equal(body.offset, 0);
    assert.equal(body.keepEmptyRows, false);
  });

  it('buildReportBody respects offset parameter', () => {
    const body = ga4.buildReportBody('2024-01-01', '2024-01-31', 10000);
    assert.equal(body.offset, 10000);
  });

  it('buildReportBody includes all required dimensions', () => {
    const body = ga4.buildReportBody('2024-01-01', '2024-01-31');
    const dimNames = body.dimensions.map(d => d.name);
    assert.ok(dimNames.includes('pagePath'));
    assert.ok(dimNames.includes('date'));
  });

  it('buildReportBody includes all required metrics', () => {
    const body = ga4.buildReportBody('2024-01-01', '2024-01-31');
    const metricNames = body.metrics.map(m => m.name);
    assert.ok(metricNames.includes('sessions'));
    assert.ok(metricNames.includes('engagedSessions'));
    assert.ok(metricNames.includes('bounceRate'));
    assert.ok(metricNames.includes('averageSessionDuration'));
    assert.ok(metricNames.includes('scrolledUsers'));
    assert.ok(metricNames.includes('totalUsers'));
  });
});

// ── GA4 Response Parsing Tests ──────────────────────────────

describe('GA4 — Response Parsing', () => {
  it('parseGA4Row extracts all fields correctly', () => {
    const row = makeGA4Row('/blog/article', '20240115', 100, 80, 0.2, 45.5, 60, 100);
    const parsed = ga4.parseGA4Row(row);

    assert.equal(parsed.pagePath, '/blog/article');
    assert.equal(parsed.snapshotDate, '2024-01-15');
    assert.equal(parsed.sessions, 100);
    assert.equal(parsed.engaged_sessions, 80);
    assert.equal(parsed.bounce_rate, 0.2);
    assert.equal(parsed.avg_engagement_time, 45.5);
    assert.equal(parsed.scroll_depth, 60);
    assert.equal(parsed.scrolled_users, 60);
    assert.equal(parsed.total_users, 100);
  });

  it('parseGA4Row handles YYYYMMDD date format', () => {
    const row = makeGA4Row('/page', '20240301', 10, 5, 0.5, 30, 3, 10);
    const parsed = ga4.parseGA4Row(row);
    assert.equal(parsed.snapshotDate, '2024-03-01');
  });

  it('parseGA4Row handles already-formatted date', () => {
    const row = makeGA4Row('/page', '2024-03-01', 10, 5, 0.5, 30, 3, 10);
    const parsed = ga4.parseGA4Row(row);
    assert.equal(parsed.snapshotDate, '2024-03-01');
  });

  it('parseGA4Row handles zero totalUsers (no division by zero)', () => {
    const row = makeGA4Row('/page', '20240115', 0, 0, 0, 0, 0, 0);
    const parsed = ga4.parseGA4Row(row);
    assert.equal(parsed.scroll_depth, 0);
  });

  it('parseGA4Row handles missing metricValues gracefully', () => {
    const row = {
      dimensionValues: [{ value: '/page' }, { value: '20240115' }],
      metricValues: []
    };
    const parsed = ga4.parseGA4Row(row);
    assert.equal(parsed.sessions, 0);
    assert.equal(parsed.engaged_sessions, 0);
    assert.equal(parsed.bounce_rate, 0);
    assert.equal(parsed.avg_engagement_time, 0);
    assert.equal(parsed.scroll_depth, 0);
  });

  it('parseGA4Row clamps bounce_rate to [0, 1]', () => {
    const row = makeGA4Row('/page', '20240115', 10, 5, 1.5, 30, 3, 10);
    const parsed = ga4.parseGA4Row(row);
    assert.equal(parsed.bounce_rate, 1);
  });

  it('parseGA4Row ensures non-negative values', () => {
    const row = makeGA4Row('/page', '20240115', -5, -3, -0.1, -10, -2, 10);
    const parsed = ga4.parseGA4Row(row);
    assert.equal(parsed.sessions, 0);
    assert.equal(parsed.engaged_sessions, 0);
    assert.equal(parsed.bounce_rate, 0);
    assert.equal(parsed.avg_engagement_time, 0);
  });
});

// ── Scroll Depth Calculation Tests ──────────────────────────

describe('GA4 — Scroll Depth Calculation', () => {
  it('calculates scroll depth as percentage correctly', () => {
    const row = makeGA4Row('/page', '20240115', 100, 80, 0.2, 45, 75, 100);
    const parsed = ga4.parseGA4Row(row);
    assert.equal(parsed.scroll_depth, 75);
  });

  it('calculates partial scroll depth', () => {
    const row = makeGA4Row('/page', '20240115', 100, 80, 0.2, 45, 33, 100);
    const parsed = ga4.parseGA4Row(row);
    assert.equal(parsed.scroll_depth, 33);
  });

  it('caps scroll depth at 100%', () => {
    // Edge case: scrolledUsers > totalUsers (shouldn't happen but guard against it)
    const row = makeGA4Row('/page', '20240115', 100, 80, 0.2, 45, 150, 100);
    const parsed = ga4.parseGA4Row(row);
    assert.equal(parsed.scroll_depth, 100);
  });

  it('returns 0 scroll depth when no users', () => {
    const row = makeGA4Row('/page', '20240115', 0, 0, 0, 0, 0, 0);
    const parsed = ga4.parseGA4Row(row);
    assert.equal(parsed.scroll_depth, 0);
  });
});

// ── URL Matching Tests ──────────────────────────────────────

describe('GA4 — URL Matching (pagePath to full URL)', () => {
  it('extractPathFromUrl strips protocol and domain', () => {
    assert.equal(ga4.extractPathFromUrl('https://example.com/blog/article'), '/blog/article');
  });

  it('extractPathFromUrl handles http protocol', () => {
    assert.equal(ga4.extractPathFromUrl('http://example.com/page'), '/page');
  });

  it('extractPathFromUrl handles trailing slash', () => {
    assert.equal(ga4.extractPathFromUrl('https://example.com/'), '/');
  });

  it('extractPathFromUrl handles paths with query strings', () => {
    assert.equal(ga4.extractPathFromUrl('https://example.com/page?q=test'), '/page');
  });

  it('extractPathFromUrl returns already-path input as-is', () => {
    assert.equal(ga4.extractPathFromUrl('/blog/article'), '/blog/article');
  });

  it('buildGSCLookup creates correct keys from full URLs', () => {
    const gscSnapshots = [
      { url: 'https://example.com/blog/article', snapshot_date: '2024-01-15', clicks: 10 },
      { url: 'https://example.com/about', snapshot_date: '2024-01-15', clicks: 5 }
    ];
    const lookup = ga4.buildGSCLookup(gscSnapshots);

    assert.ok(lookup.has('/blog/article|2024-01-15'));
    assert.ok(lookup.has('/about|2024-01-15'));
    assert.equal(lookup.get('/blog/article|2024-01-15').clicks, 10);
  });
});

// ── Merge Logic Tests ───────────────────────────────────────

describe('GA4 — GSC Merge Logic', () => {
  it('creates GA4-only records when no GSC match', () => {
    const parsedRows = [{
      pagePath: '/new-page',
      snapshotDate: '2024-01-15',
      sessions: 50,
      engaged_sessions: 40,
      bounce_rate: 0.2,
      avg_engagement_time: 30,
      scroll_depth: 60,
      scrolled_users: 30,
      total_users: 50
    }];
    const gscLookup = new Map();
    const userId = 'user-123';

    const result = ga4.mergeWithGSC(parsedRows, userId, gscLookup);

    assert.equal(result.ga4Only.length, 1);
    assert.equal(result.gscUpdates.length, 0);
    assert.equal(result.combined.length, 0);
    assert.equal(result.ga4Only[0].source, 'ga4');
    assert.equal(result.ga4Only[0].url, '/new-page');
  });

  it('updates existing GSC snapshot with GA4 fields', () => {
    const parsedRows = [{
      pagePath: '/blog/article',
      snapshotDate: '2024-01-15',
      sessions: 50,
      engaged_sessions: 40,
      bounce_rate: 0.2,
      avg_engagement_time: 30,
      scroll_depth: 60,
      scrolled_users: 30,
      total_users: 50
    }];
    const gscLookup = new Map();
    gscLookup.set('/blog/article|2024-01-15', {
      url: 'https://example.com/blog/article',
      snapshot_date: '2024-01-15',
      clicks: 100,
      impressions: 1000,
      ctr: 0.1,
      avg_position: 5.2,
      health_score: 75,
      decay_signal: false,
      metadata: {}
    });
    const userId = 'user-123';

    const result = ga4.mergeWithGSC(parsedRows, userId, gscLookup);

    assert.equal(result.ga4Only.length, 0);
    assert.equal(result.gscUpdates.length, 1);
    assert.equal(result.combined.length, 1);

    // GSC update preserves GSC fields and adds GA4 fields
    const update = result.gscUpdates[0];
    assert.equal(update.source, 'gsc');
    assert.equal(update.url, 'https://example.com/blog/article');
    assert.equal(update.clicks, 100);
    assert.equal(update.sessions, 50);
    assert.equal(update.bounce_rate, 0.2);
    assert.equal(update.metadata.ga4_merged, true);

    // Combined record has both data sources
    const combo = result.combined[0];
    assert.equal(combo.source, 'combined');
    assert.equal(combo.clicks, 100);
    assert.equal(combo.sessions, 50);
    assert.equal(combo.metadata.gsc_source, true);
    assert.equal(combo.metadata.ga4_source, true);
  });

  it('handles mix of matched and unmatched pages', () => {
    const parsedRows = [
      {
        pagePath: '/blog/article',
        snapshotDate: '2024-01-15',
        sessions: 50,
        engaged_sessions: 40,
        bounce_rate: 0.2,
        avg_engagement_time: 30,
        scroll_depth: 60,
        scrolled_users: 30,
        total_users: 50
      },
      {
        pagePath: '/new-page',
        snapshotDate: '2024-01-15',
        sessions: 10,
        engaged_sessions: 8,
        bounce_rate: 0.3,
        avg_engagement_time: 20,
        scroll_depth: 40,
        scrolled_users: 4,
        total_users: 10
      }
    ];

    const gscLookup = new Map();
    gscLookup.set('/blog/article|2024-01-15', {
      url: 'https://example.com/blog/article',
      snapshot_date: '2024-01-15',
      clicks: 100,
      impressions: 1000,
      ctr: 0.1,
      avg_position: 5.2,
      health_score: 75,
      decay_signal: false,
      metadata: {}
    });

    const result = ga4.mergeWithGSC(parsedRows, 'user-123', gscLookup);

    assert.equal(result.ga4Only.length, 1);
    assert.equal(result.gscUpdates.length, 1);
    assert.equal(result.combined.length, 1);
    assert.equal(result.ga4Only[0].url, '/new-page');
    assert.equal(result.gscUpdates[0].url, 'https://example.com/blog/article');
  });
});

// ── Historical Import Chunks Tests ──────────────────────────

describe('GA4 — Historical Import Chunks', () => {
  it('generateHistoricalChunks returns monthly chunks', () => {
    const chunks = ga4.generateHistoricalChunks();
    assert.ok(chunks.length > 0, 'Should have at least one chunk');
    assert.ok(chunks.length <= 15, 'Should not exceed 15 chunks (14 months + current)');
  });

  it('chunks have valid date format', () => {
    const chunks = ga4.generateHistoricalChunks();
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const chunk of chunks) {
      assert.match(chunk.startDate, dateRegex, `startDate ${chunk.startDate} should be YYYY-MM-DD`);
      assert.match(chunk.endDate, dateRegex, `endDate ${chunk.endDate} should be YYYY-MM-DD`);
    }
  });

  it('chunk start date is before or equal to end date', () => {
    const chunks = ga4.generateHistoricalChunks();
    for (const chunk of chunks) {
      assert.ok(chunk.startDate <= chunk.endDate, `${chunk.startDate} should be <= ${chunk.endDate}`);
    }
  });

  it('last chunk endDate is today or before', () => {
    const chunks = ga4.generateHistoricalChunks();
    const today = ga4.formatDate(new Date());
    const lastChunk = chunks[chunks.length - 1];
    assert.ok(lastChunk.endDate <= today, 'Last chunk should not be in the future');
  });
});

// ── Incremental Range Tests ─────────────────────────────────

describe('GA4 — Incremental Range', () => {
  it('generateIncrementalRange returns valid range', () => {
    const range = ga4.generateIncrementalRange();
    assert.ok(range.startDate);
    assert.ok(range.endDate);
    assert.ok(range.startDate <= range.endDate);
  });

  it('incremental range covers 3 days', () => {
    const range = ga4.generateIncrementalRange();
    const start = new Date(range.startDate);
    const end = new Date(range.endDate);
    const diffDays = (end - start) / (1000 * 60 * 60 * 24);
    assert.equal(diffDays, 3);
  });
});

// ── Date Format Tests ───────────────────────────────────────

describe('GA4 — Date Formatting', () => {
  it('formatDate returns YYYY-MM-DD', () => {
    assert.equal(ga4.formatDate(new Date('2024-01-15T00:00:00Z')), '2024-01-15');
  });

  it('parseGA4Date converts YYYYMMDD to YYYY-MM-DD', () => {
    assert.equal(ga4.parseGA4Date('20240115'), '2024-01-15');
  });

  it('parseGA4Date passes through already-formatted dates', () => {
    assert.equal(ga4.parseGA4Date('2024-01-15'), '2024-01-15');
  });
});

// ── Error Handling Tests ────────────────────────────────────

describe('GA4 — Error Handling', () => {
  afterEach(() => {
    restoreFetch();
  });

  it('GA4Error has correct properties', () => {
    const err = new ga4.GA4Error('test error', 429, false);
    assert.equal(err.name, 'GA4Error');
    assert.equal(err.message, 'test error');
    assert.equal(err.statusCode, 429);
    assert.equal(err.unrecoverable, false);
  });

  it('ga4ApiRequest refreshes token on 401', async () => {
    let requestCount = 0;
    mockFetch(async (url, opts) => {
      // OAuth getValidToken — fetch connection
      if (url.includes('client_connections') && !opts?.method) {
        return mockResponse([{
          id: 'conn-1',
          user_id: 'user-1',
          access_token_encrypted: ENCRYPTED_ACCESS_TOKEN,
          refresh_token_encrypted: ENCRYPTED_REFRESH_TOKEN,
          token_expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'connected'
        }]);
      }
      // Token refresh endpoint
      if (url.includes('oauth2.googleapis.com/token')) {
        return mockResponse({
          access_token: 'new-access-token',
          expires_in: 3600
        });
      }
      // Update connection after refresh
      if (url.includes('client_connections') && opts?.method === 'PATCH') {
        return mockResponse({}, 200);
      }
      // GA4 API requests
      if (url.includes('analyticsdata.googleapis.com')) {
        requestCount++;
        if (requestCount === 1) {
          return mockResponse({ error: { message: 'Token expired' } }, 401);
        }
        return mockResponse({ rows: [], rowCount: 0 });
      }
      return mockResponse({});
    });

    const result = await ga4.ga4ApiRequest('12345', 'conn-1', ga4.buildReportBody('2024-01-01', '2024-01-31'));
    assert.ok(result, 'Should return a result after token refresh');
    assert.equal(requestCount, 2, 'Should have made 2 API requests (1 failed + 1 retry)');
  });

  it('ga4ApiRequest throws unrecoverable on 403', async () => {
    mockFetch(async (url, opts) => {
      if (url.includes('client_connections')) {
        if (opts?.method === 'PATCH') return mockResponse({}, 200);
        return mockResponse([{
          id: 'conn-1',
          access_token_encrypted: ENCRYPTED_ACCESS_TOKEN,
          token_expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'connected'
        }]);
      }
      if (url.includes('analyticsdata.googleapis.com')) {
        return mockResponse({ error: { message: 'Permission denied' } }, 403);
      }
      return mockResponse({});
    });

    await assert.rejects(
      () => ga4.ga4ApiRequest('12345', 'conn-1', ga4.buildReportBody('2024-01-01', '2024-01-31')),
      (err) => {
        assert.ok(err instanceof ga4.GA4Error);
        assert.equal(err.statusCode, 403);
        assert.equal(err.unrecoverable, true);
        return true;
      }
    );
  });

  it('ga4ApiRequest retries on 429 with backoff', async () => {
    let requestCount = 0;
    // Override sleep to avoid actual delays in tests
    const originalSleep = global.setTimeout;

    mockFetch(async (url, opts) => {
      if (url.includes('client_connections')) {
        return mockResponse([{
          id: 'conn-1',
          access_token_encrypted: ENCRYPTED_ACCESS_TOKEN,
          token_expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'connected'
        }]);
      }
      if (url.includes('analyticsdata.googleapis.com')) {
        requestCount++;
        if (requestCount <= 2) {
          return mockResponse({ error: { message: 'Rate limited' } }, 429);
        }
        return mockResponse({ rows: [] });
      }
      return mockResponse({});
    });

    const result = await ga4.ga4ApiRequest('12345', 'conn-1', ga4.buildReportBody('2024-01-01', '2024-01-31'));
    assert.ok(result, 'Should eventually succeed after retries');
    assert.equal(requestCount, 3, 'Should have made 3 requests (2 rate-limited + 1 success)');
  });

  it('ga4ApiRequest throws after all retries exhausted on 429', async () => {
    mockFetch(async (url, opts) => {
      if (url.includes('client_connections')) {
        return mockResponse([{
          id: 'conn-1',
          access_token_encrypted: ENCRYPTED_ACCESS_TOKEN,
          token_expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'connected'
        }]);
      }
      if (url.includes('analyticsdata.googleapis.com')) {
        return mockResponse({ error: { message: 'Rate limited' } }, 429);
      }
      return mockResponse({});
    });

    await assert.rejects(
      () => ga4.ga4ApiRequest('12345', 'conn-1', ga4.buildReportBody('2024-01-01', '2024-01-31')),
      (err) => {
        assert.ok(err instanceof ga4.GA4Error);
        assert.equal(err.statusCode, 429);
        return true;
      }
    );
  });
});

// ── Normalize and Store Tests ───────────────────────────────

describe('GA4 — Normalize and Store', () => {
  afterEach(() => {
    restoreFetch();
  });

  it('normalizeAndStore returns zeros for empty rows', async () => {
    const result = await ga4.normalizeAndStore([], 'user-123', '2024-01-01', '2024-01-31');
    assert.equal(result.inserted, 0);
    assert.equal(result.errors, 0);
    assert.equal(result.merged, 0);
  });

  it('normalizeAndStore handles GA4-only records (no GSC data)', async () => {
    mockFetch(async (url, opts) => {
      // GSC snapshots query returns empty
      if (url.includes('performance_snapshots') && url.includes('source=eq.gsc') && !opts?.method) {
        return mockResponse([]);
      }
      // Upsert returns success
      if (url.includes('performance_snapshots') && opts?.method === 'POST') {
        return mockResponse({}, 201);
      }
      return mockResponse({});
    });

    const rows = [makeGA4Row('/blog/test', '20240115', 50, 40, 0.2, 30, 25, 50)];
    const result = await ga4.normalizeAndStore(rows, 'user-123', '2024-01-01', '2024-01-31');

    assert.ok(result.inserted > 0, 'Should have inserted records');
    assert.equal(result.errors, 0);
    assert.equal(result.merged, 0);
  });

  it('normalizeAndStore merges with existing GSC data', async () => {
    mockFetch(async (url, opts) => {
      // GSC snapshots query returns matching data
      if (url.includes('performance_snapshots') && url.includes('source=eq.gsc') && !opts?.method) {
        return mockResponse([{
          url: 'https://example.com/blog/test',
          snapshot_date: '2024-01-15',
          clicks: 100,
          impressions: 1000,
          ctr: 0.1,
          avg_position: 5.2,
          health_score: 75,
          decay_signal: false,
          metadata: {}
        }]);
      }
      // Upsert returns success
      if (url.includes('performance_snapshots') && opts?.method === 'POST') {
        return mockResponse({}, 201);
      }
      return mockResponse({});
    });

    const rows = [makeGA4Row('/blog/test', '20240115', 50, 40, 0.2, 30, 25, 50)];
    const result = await ga4.normalizeAndStore(rows, 'user-123', '2024-01-01', '2024-01-31');

    assert.ok(result.inserted > 0, 'Should have inserted records');
    assert.equal(result.merged, 1, 'Should have 1 merged record');
  });
});

// ── Quota Tracking Tests ────────────────────────────────────

describe('GA4 — Quota Tracking', () => {
  afterEach(() => {
    restoreFetch();
  });

  it('trackQuotaUsage increments usage and detects warning', async () => {
    mockFetch(async (url, opts) => {
      if (url.includes('client_connections') && url.includes('select=metadata') && !opts?.method) {
        return mockResponse([{ metadata: { ga4_quota: { date: ga4.formatDate(new Date()), used: 7999 } } }]);
      }
      if (url.includes('client_connections') && opts?.method === 'PATCH') {
        return mockResponse({}, 200);
      }
      return mockResponse({});
    });

    const result = await ga4.trackQuotaUsage('conn-1', 1);
    assert.equal(result.quotaUsed, 8000);
    assert.equal(result.quotaLimit, 10000);
    assert.equal(result.warning, true);
  });

  it('trackQuotaUsage resets on new day', async () => {
    mockFetch(async (url, opts) => {
      if (url.includes('client_connections') && url.includes('select=metadata') && !opts?.method) {
        return mockResponse([{ metadata: { ga4_quota: { date: '2020-01-01', used: 5000 } } }]);
      }
      if (url.includes('client_connections') && opts?.method === 'PATCH') {
        return mockResponse({}, 200);
      }
      return mockResponse({});
    });

    const result = await ga4.trackQuotaUsage('conn-1', 5);
    assert.equal(result.quotaUsed, 5);
    assert.equal(result.warning, false);
  });
});

// ── Trigger Handler Tests ───────────────────────────────────

describe('GA4 — Trigger Handler', () => {
  afterEach(() => {
    restoreFetch();
  });

  it('returns 404 when no Google connection exists', async () => {
    mockFetch(async (url) => {
      if (url.includes('client_connections')) {
        return mockResponse([]);
      }
      return mockResponse({});
    });

    const result = await ga4.handleTrigger('user-123');
    assert.equal(result.success, false);
    assert.equal(result.statusCode, 404);
  });

  it('returns 403 when connection is expired', async () => {
    mockFetch(async (url) => {
      if (url.includes('client_connections')) {
        return mockResponse([{
          id: 'conn-1',
          user_id: 'user-123',
          ga4_property_id: '12345',
          status: 'expired',
          sync_count: 0,
          metadata: {}
        }]);
      }
      return mockResponse({});
    });

    const result = await ga4.handleTrigger('user-123');
    assert.equal(result.success, false);
    assert.equal(result.statusCode, 403);
  });

  it('returns 400 when no GA4 property configured', async () => {
    mockFetch(async (url) => {
      if (url.includes('client_connections')) {
        return mockResponse([{
          id: 'conn-1',
          user_id: 'user-123',
          ga4_property_id: null,
          status: 'connected',
          sync_count: 0,
          metadata: {}
        }]);
      }
      return mockResponse({});
    });

    const result = await ga4.handleTrigger('user-123');
    assert.equal(result.success, false);
    assert.equal(result.statusCode, 400);
  });

  it('returns 409 when sync already running', async () => {
    mockFetch(async (url) => {
      if (url.includes('client_connections')) {
        return mockResponse([{
          id: 'conn-1',
          user_id: 'user-123',
          ga4_property_id: '12345',
          status: 'connected',
          sync_count: 1,
          metadata: { ga4_sync: { status: 'running' } }
        }]);
      }
      return mockResponse({});
    });

    const result = await ga4.handleTrigger('user-123');
    assert.equal(result.success, false);
    assert.equal(result.statusCode, 409);
  });

  it('selects full mode for first sync (sync_count=0)', async () => {
    mockFetch(async (url, opts) => {
      if (url.includes('client_connections')) {
        if (opts?.method === 'PATCH') return mockResponse({}, 200);
        return mockResponse([{
          id: 'conn-1',
          user_id: 'user-123',
          ga4_property_id: '12345',
          status: 'connected',
          sync_count: 0,
          metadata: {}
        }]);
      }
      if (url.includes('analyticsdata.googleapis.com')) {
        return mockResponse({ rows: [] });
      }
      if (url.includes('performance_snapshots')) {
        return mockResponse([], 200);
      }
      return mockResponse({});
    });

    const result = await ga4.handleTrigger('user-123');
    assert.equal(result.success, true);
    assert.equal(result.data.mode, 'full');
    assert.equal(result.data.status, 'started');
  });

  it('selects incremental mode for subsequent syncs', async () => {
    mockFetch(async (url, opts) => {
      if (url.includes('client_connections')) {
        if (opts?.method === 'PATCH') return mockResponse({}, 200);
        return mockResponse([{
          id: 'conn-1',
          user_id: 'user-123',
          ga4_property_id: '12345',
          status: 'connected',
          sync_count: 5,
          metadata: {}
        }]);
      }
      if (url.includes('analyticsdata.googleapis.com')) {
        return mockResponse({ rows: [] });
      }
      if (url.includes('performance_snapshots')) {
        return mockResponse([], 200);
      }
      return mockResponse({});
    });

    const result = await ga4.handleTrigger('user-123');
    assert.equal(result.success, true);
    assert.equal(result.data.mode, 'incremental');
  });

  it('allows mode override via body', async () => {
    mockFetch(async (url, opts) => {
      if (url.includes('client_connections')) {
        if (opts?.method === 'PATCH') return mockResponse({}, 200);
        return mockResponse([{
          id: 'conn-1',
          user_id: 'user-123',
          ga4_property_id: '12345',
          status: 'connected',
          sync_count: 5,
          metadata: {}
        }]);
      }
      if (url.includes('analyticsdata.googleapis.com')) {
        return mockResponse({ rows: [] });
      }
      if (url.includes('performance_snapshots')) {
        return mockResponse([], 200);
      }
      return mockResponse({});
    });

    const result = await ga4.handleTrigger('user-123', { mode: 'full' });
    assert.equal(result.success, true);
    assert.equal(result.data.mode, 'full');
  });
});

// ── Status Handler Tests ────────────────────────────────────

describe('GA4 — Status Handler', () => {
  afterEach(() => {
    restoreFetch();
  });

  it('returns not_connected when no connection exists', async () => {
    mockFetch(async (url) => {
      if (url.includes('client_connections')) {
        return mockResponse([]);
      }
      return mockResponse({});
    });

    const result = await ga4.handleStatus('user-123');
    assert.equal(result.success, true);
    assert.equal(result.data.connected, false);
    assert.equal(result.data.status, 'not_connected');
  });

  it('returns full status when connection exists', async () => {
    mockFetch(async (url) => {
      if (url.includes('client_connections') && url.includes('ga4_property_id')) {
        return mockResponse([{
          status: 'connected',
          last_sync_at: '2024-01-15T00:00:00Z',
          sync_count: 5,
          ga4_property_id: '12345',
          metadata: {
            ga4_sync: { status: 'completed', mode: 'incremental' },
            ga4_quota: { date: '2024-01-15', used: 50, limit: 10000 }
          }
        }]);
      }
      if (url.includes('client_connections')) {
        return mockResponse([{
          id: 'conn-1',
          user_id: 'user-123',
          ga4_property_id: '12345',
          status: 'connected',
          sync_count: 5,
          metadata: {
            ga4_sync: { status: 'completed', mode: 'incremental' },
            ga4_quota: { date: '2024-01-15', used: 50, limit: 10000 }
          }
        }]);
      }
      return mockResponse({});
    });

    const result = await ga4.handleStatus('user-123');
    assert.equal(result.success, true);
    assert.equal(result.data.connected, true);
    assert.equal(result.data.ga4PropertyId, '12345');
    assert.equal(result.data.syncCount, 5);
    assert.ok(result.data.currentSync);
  });
});

// ── Paginated Query Tests ───────────────────────────────────

describe('GA4 — Paginated Query', () => {
  afterEach(() => {
    restoreFetch();
  });

  it('queryGA4Report paginates when rows equal PAGE_SIZE', async () => {
    let pageCount = 0;
    mockFetch(async (url, opts) => {
      if (url.includes('client_connections')) {
        return mockResponse([{
          id: 'conn-1',
          access_token_encrypted: ENCRYPTED_ACCESS_TOKEN,
          token_expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'connected'
        }]);
      }
      if (url.includes('analyticsdata.googleapis.com')) {
        pageCount++;
        if (pageCount === 1) {
          // Return exactly PAGE_SIZE rows to trigger pagination
          const rows = Array.from({ length: ga4.PAGE_SIZE }, (_, i) =>
            makeGA4Row(`/page-${i}`, '20240115', 10, 8, 0.2, 30, 5, 10)
          );
          return mockResponse({ rows });
        }
        // Second page: fewer rows (end of data)
        return mockResponse({ rows: [makeGA4Row('/page-last', '20240115', 5, 3, 0.3, 20, 2, 5)] });
      }
      return mockResponse({});
    });

    const result = await ga4.queryGA4Report('12345', 'conn-1', '2024-01-01', '2024-01-31');
    assert.equal(pageCount, 2, 'Should have made 2 paginated requests');
    assert.equal(result.rows.length, ga4.PAGE_SIZE + 1);
    assert.equal(result.quotaUsed, 2);
  });

  it('queryGA4Report handles empty response', async () => {
    mockFetch(async (url) => {
      if (url.includes('client_connections')) {
        return mockResponse([{
          id: 'conn-1',
          access_token_encrypted: ENCRYPTED_ACCESS_TOKEN,
          token_expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'connected'
        }]);
      }
      if (url.includes('analyticsdata.googleapis.com')) {
        return mockResponse({ rows: [] });
      }
      return mockResponse({});
    });

    const result = await ga4.queryGA4Report('12345', 'conn-1', '2024-01-01', '2024-01-31');
    assert.equal(result.rows.length, 0);
    assert.equal(result.rowCount, 0);
    assert.equal(result.quotaUsed, 1);
  });
});

// ── Constants Validation Tests ──────────────────────────────

describe('GA4 — Constants', () => {
  it('PAGE_SIZE is 10000', () => {
    assert.equal(ga4.PAGE_SIZE, 10000);
  });

  it('UPSERT_BATCH_SIZE is 500', () => {
    assert.equal(ga4.UPSERT_BATCH_SIZE, 500);
  });

  it('RETRY_DELAYS has 3 entries with exponential backoff', () => {
    assert.equal(ga4.RETRY_DELAYS.length, 3);
    assert.equal(ga4.RETRY_DELAYS[0], 5000);
    assert.equal(ga4.RETRY_DELAYS[1], 15000);
    assert.equal(ga4.RETRY_DELAYS[2], 45000);
  });

  it('INCREMENTAL_LOOKBACK_DAYS is 3', () => {
    assert.equal(ga4.INCREMENTAL_LOOKBACK_DAYS, 3);
  });

  it('DAILY_QUOTA_LIMIT is 10000', () => {
    assert.equal(ga4.DAILY_QUOTA_LIMIT, 10000);
  });

  it('QUOTA_WARNING_THRESHOLD is 0.8', () => {
    assert.equal(ga4.QUOTA_WARNING_THRESHOLD, 0.8);
  });
});
