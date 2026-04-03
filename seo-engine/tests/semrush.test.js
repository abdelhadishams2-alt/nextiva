/**
 * Semrush Connector Tests — CI-004
 *
 * Tests for Semrush API connector:
 * - API key resolution (env var, client key, graceful degradation)
 * - Response parsing (semicolon-delimited format)
 * - 7-day cache layer (hit/miss/stale)
 * - Domain analytics fetch
 * - Keyword gap analysis
 * - Topic research
 * - Error handling (401, 429, quota, 5xx)
 * - Cost tracking
 * - Trigger handler (no key → skip, with key → sync)
 * - Status endpoint
 *
 * Uses node:test with mocked fetch.
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

// Set env vars before requiring modules
process.env.BRIDGE_ENCRYPTION_KEY = 'a'.repeat(64);
process.env.SUPABASE_URL = 'https://test-project.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

const semrush = require('../bridge/ingestion/semrush');

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
  const isString = typeof body === 'string';
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {
      get: (name) => headers[name.toLowerCase()] || null
    },
    json: async () => isString ? JSON.parse(body) : body,
    text: async () => isString ? body : JSON.stringify(body)
  };
}

// ── Response Parser Tests ───────────────────────────────────

describe('Semrush — Response Parser', () => {
  it('parseSemrushResponse parses semicolon-delimited data correctly', () => {
    const text = 'Keyword;Position;Volume\ntest keyword;5;1000\nseo tools;3;5000';
    const rows = semrush.parseSemrushResponse(text);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].Keyword, 'test keyword');
    assert.equal(rows[0].Position, '5');
    assert.equal(rows[0].Volume, '1000');
    assert.equal(rows[1].Keyword, 'seo tools');
  });

  it('parseSemrushResponse returns empty array for empty input', () => {
    assert.deepEqual(semrush.parseSemrushResponse(''), []);
    assert.deepEqual(semrush.parseSemrushResponse(null), []);
    assert.deepEqual(semrush.parseSemrushResponse(undefined), []);
  });

  it('parseSemrushResponse returns empty array for header-only response', () => {
    const text = 'Keyword;Position;Volume';
    const rows = semrush.parseSemrushResponse(text);
    assert.equal(rows.length, 0);
  });

  it('parseSemrushResponse skips rows with insufficient columns', () => {
    const text = 'Keyword;Position;Volume\ntest;5;1000\nincomplete';
    const rows = semrush.parseSemrushResponse(text);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].Keyword, 'test');
  });
});

// ── API Key Resolution Tests ────────────────────────────────

describe('Semrush — API Key Resolution', () => {
  const originalEnvKey = process.env.SEMRUSH_API_KEY;

  afterEach(() => {
    if (originalEnvKey) {
      process.env.SEMRUSH_API_KEY = originalEnvKey;
    } else {
      delete process.env.SEMRUSH_API_KEY;
    }
  });

  it('returns env var key when SEMRUSH_API_KEY is set', async () => {
    process.env.SEMRUSH_API_KEY = 'test-semrush-key';
    const key = await semrush.resolveApiKey('user-123', null);
    assert.equal(key, 'test-semrush-key');
  });

  it('returns null when no key is configured', async () => {
    delete process.env.SEMRUSH_API_KEY;
    const key = await semrush.resolveApiKey('user-123', null);
    assert.equal(key, null);
  });

  it('prefers client key over env var when KeyManager has a key', async () => {
    process.env.SEMRUSH_API_KEY = 'env-key';
    const mockKeyManager = {
      resolveKey: async (keyName, scope) => {
        if (keyName === 'semrush_api_key' && scope === 'user-123') {
          return 'client-key';
        }
        return null;
      }
    };
    const key = await semrush.resolveApiKey('user-123', mockKeyManager);
    assert.equal(key, 'client-key');
  });

  it('falls back to env var when KeyManager has no key', async () => {
    process.env.SEMRUSH_API_KEY = 'env-key';
    const mockKeyManager = {
      resolveKey: async () => null
    };
    const key = await semrush.resolveApiKey('user-123', mockKeyManager);
    assert.equal(key, 'env-key');
  });

  it('handles KeyManager errors gracefully', async () => {
    process.env.SEMRUSH_API_KEY = 'env-key';
    const mockKeyManager = {
      resolveKey: async () => { throw new Error('DB connection failed'); }
    };
    const key = await semrush.resolveApiKey('user-123', mockKeyManager);
    assert.equal(key, 'env-key');
  });
});

// ── Cache Tests ─────────────────────────────────────────────

describe('Semrush — 7-Day Cache', () => {
  afterEach(() => {
    restoreFetch();
  });

  it('checkCache returns null when no cached data exists', async () => {
    mockFetch(async (url) => {
      if (url.includes('data_cache')) {
        return mockResponse([]);
      }
      return mockResponse({}, 404);
    });

    const result = await semrush.checkCache('user-123', 'semrush_domain_analytics', 'example.com');
    assert.equal(result, null);
  });

  it('checkCache returns cached data when within 7-day window', async () => {
    const cachedData = { domain: 'example.com', keywords: [] };
    mockFetch(async (url) => {
      if (url.includes('data_cache')) {
        return mockResponse([{
          data: cachedData,
          updated_at: new Date().toISOString()
        }]);
      }
      return mockResponse({}, 404);
    });

    const result = await semrush.checkCache('user-123', 'semrush_domain_analytics', 'example.com');
    assert.deepEqual(result, cachedData);
  });

  it('updateCache stores data without errors', async () => {
    let storedData = null;
    mockFetch(async (url, opts) => {
      if (url.includes('data_cache') && opts && opts.method === 'POST') {
        storedData = JSON.parse(opts.body);
        return mockResponse({});
      }
      return mockResponse({}, 404);
    });

    await semrush.updateCache('user-123', 'semrush_test', 'key1', { test: true });
    assert.ok(storedData);
    assert.equal(storedData.user_id, 'user-123');
    assert.equal(storedData.cache_type, 'semrush_test');
    assert.equal(storedData.cache_key, 'key1');
    assert.deepEqual(storedData.data, { test: true });
  });
});

// ── API Request Error Handling Tests ────────────────────────

describe('Semrush — API Error Handling', () => {
  afterEach(() => {
    restoreFetch();
  });

  it('throws SemrushError with unrecoverable flag on 401', async () => {
    mockFetch(async () => mockResponse('ERROR 118 :: WRONG API KEY', 200));

    await assert.rejects(
      () => semrush.semrushApiRequest('', { type: 'domain_ranks', domain: 'test.com' }, 'bad-key'),
      (err) => {
        assert.ok(err instanceof semrush.SemrushError);
        assert.ok(err.unrecoverable);
        assert.ok(err.message.includes('WRONG API KEY'));
        return true;
      }
    );
  });

  it('handles NOTHING FOUND response gracefully (returns empty string)', async () => {
    mockFetch(async () => mockResponse('ERROR 50 :: NOTHING FOUND', 200));

    const result = await semrush.semrushApiRequest('', { type: 'domain_ranks', domain: 'nonexistent.com' }, 'valid-key');
    assert.equal(result, '');
  });

  it('throws SemrushError on quota exceeded', async () => {
    mockFetch(async () => mockResponse('ERROR 120 :: API UNITS BALANCE IS ZERO', 200));

    await assert.rejects(
      () => semrush.semrushApiRequest('', { type: 'domain_ranks' }, 'key'),
      (err) => {
        assert.ok(err instanceof semrush.SemrushError);
        assert.ok(err.message.includes('quota'));
        return true;
      }
    );
  });

  it('returns parsed data on successful response', async () => {
    const responseText = 'Domain;Rank\nexample.com;12345';
    mockFetch(async () => mockResponse(responseText, 200));

    const result = await semrush.semrushApiRequest('', { type: 'domain_ranks' }, 'key');
    assert.equal(result, responseText);
  });
});

// ── Trigger Handler Tests ───────────────────────────────────

describe('Semrush — Trigger Handler', () => {
  const originalEnvKey = process.env.SEMRUSH_API_KEY;

  afterEach(() => {
    restoreFetch();
    if (originalEnvKey) {
      process.env.SEMRUSH_API_KEY = originalEnvKey;
    } else {
      delete process.env.SEMRUSH_API_KEY;
    }
  });

  it('returns skipped status when no API key is configured', async () => {
    delete process.env.SEMRUSH_API_KEY;
    mockFetch(async () => mockResponse([]));

    const result = await semrush.handleTrigger('user-123', {});
    assert.equal(result.success, true);
    assert.equal(result.data.status, 'skipped');
    assert.ok(result.data.message.includes('No Semrush API key'));
  });

  it('returns error when no domain is provided', async () => {
    process.env.SEMRUSH_API_KEY = 'test-key';
    mockFetch(async (url) => {
      if (url.includes('client_connections')) {
        return mockResponse([]);
      }
      return mockResponse({}, 404);
    });

    const result = await semrush.handleTrigger('user-123', {});
    assert.equal(result.success, false);
    assert.ok(result.error.includes('No domain'));
  });

  it('completes domain analytics sync successfully', async () => {
    process.env.SEMRUSH_API_KEY = 'test-key';
    const overviewCsv = 'Dn;Rk;Or;Ot;Oc;Ad;At;Ac\nexample.com;1234;500;10000;5000;100;2000;1000';
    const keywordsCsv = 'Ph;Po;Nq;Cp;Ur;Tr;Tc;Co;Nr\nseo;5;1000;1.5;https://example.com/seo;200;300;0.5;10';

    let apiCallCount = 0;

    mockFetch(async (url, opts) => {
      // Connection lookup
      if (url.includes('client_connections')) {
        return mockResponse([]);
      }
      // Cache check — return empty (cache miss)
      if (url.includes('data_cache') && (!opts || !opts.method || opts.method === 'GET')) {
        return mockResponse([]);
      }
      // Cache write
      if (url.includes('data_cache') && opts && opts.method === 'POST') {
        return mockResponse({});
      }
      // Semrush API calls
      if (url.includes('api.semrush.com')) {
        apiCallCount++;
        if (url.includes('domain_ranks')) {
          return mockResponse(overviewCsv, 200);
        }
        if (url.includes('domain_organic')) {
          return mockResponse(keywordsCsv, 200);
        }
      }
      // Keyword opportunities upsert
      if (url.includes('keyword_opportunities')) {
        return mockResponse({});
      }
      // Performance snapshots upsert
      if (url.includes('performance_snapshots')) {
        return mockResponse({});
      }
      return mockResponse({}, 404);
    });

    const result = await semrush.handleTrigger('user-123', { domain: 'example.com' });
    assert.equal(result.success, true);
    assert.equal(result.data.status, 'completed');
    assert.equal(result.data.domain, 'example.com');
    assert.ok(result.data.totalRows > 0);
    assert.ok(result.data.totalUnits > 0);
    assert.ok(apiCallCount >= 2); // overview + keywords
  });
});

// ── Status Handler Tests ────────────────────────────────────

describe('Semrush — Status Handler', () => {
  const originalEnvKey = process.env.SEMRUSH_API_KEY;

  afterEach(() => {
    restoreFetch();
    if (originalEnvKey) {
      process.env.SEMRUSH_API_KEY = originalEnvKey;
    } else {
      delete process.env.SEMRUSH_API_KEY;
    }
  });

  it('returns not_configured when no API key and no connection', async () => {
    delete process.env.SEMRUSH_API_KEY;
    mockFetch(async () => mockResponse([]));

    const result = await semrush.handleStatus('user-123');
    assert.equal(result.success, true);
    assert.equal(result.data.connected, false);
    assert.equal(result.data.status, 'not_configured');
  });

  it('returns key_available when env key is set but no connection', async () => {
    process.env.SEMRUSH_API_KEY = 'test-key';
    mockFetch(async () => mockResponse([]));

    const result = await semrush.handleStatus('user-123');
    assert.equal(result.success, true);
    assert.equal(result.data.hasApiKey, true);
    assert.equal(result.data.status, 'key_available');
  });

  it('returns connection details when connection exists', async () => {
    process.env.SEMRUSH_API_KEY = 'test-key';
    mockFetch(async () => mockResponse([{
      status: 'connected',
      last_sync_at: '2026-03-20T00:00:00Z',
      last_error: null,
      metadata: { domain: 'example.com', last_sync: { totalRows: 50 } }
    }]));

    const result = await semrush.handleStatus('user-123');
    assert.equal(result.success, true);
    assert.equal(result.data.connected, true);
    assert.equal(result.data.domain, 'example.com');
  });
});

// ── Constants Tests ─────────────────────────────────────────

describe('Semrush — Constants', () => {
  it('CACHE_TTL_MS is 7 days', () => {
    assert.equal(semrush.CACHE_TTL_MS, 7 * 24 * 60 * 60 * 1000);
  });

  it('RETRY_DELAYS has 3 entries with increasing delays', () => {
    assert.equal(semrush.RETRY_DELAYS.length, 3);
    assert.ok(semrush.RETRY_DELAYS[0] < semrush.RETRY_DELAYS[1]);
    assert.ok(semrush.RETRY_DELAYS[1] < semrush.RETRY_DELAYS[2]);
  });

  it('SemrushError has correct properties', () => {
    const err = new semrush.SemrushError('test error', 429, false);
    assert.equal(err.name, 'SemrushError');
    assert.equal(err.message, 'test error');
    assert.equal(err.statusCode, 429);
    assert.equal(err.unrecoverable, false);
  });
});
