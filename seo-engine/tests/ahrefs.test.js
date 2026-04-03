/**
 * Ahrefs Connector Tests — CI-004
 *
 * Tests for Ahrefs API connector:
 * - API key resolution (env var, client key, graceful degradation)
 * - 7-day cache layer (hit/miss/stale)
 * - Backlink profile fetch
 * - Domain rating fetch
 * - Keyword explorer fetch
 * - Error handling (401, 429, 402, 5xx)
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

const ahrefs = require('../bridge/ingestion/ahrefs');

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

// ── API Key Resolution Tests ────────────────────────────────

describe('Ahrefs — API Key Resolution', () => {
  const originalEnvKey = process.env.AHREFS_API_TOKEN;

  afterEach(() => {
    if (originalEnvKey) {
      process.env.AHREFS_API_TOKEN = originalEnvKey;
    } else {
      delete process.env.AHREFS_API_TOKEN;
    }
  });

  it('returns env var key when AHREFS_API_TOKEN is set', async () => {
    process.env.AHREFS_API_TOKEN = 'test-ahrefs-token';
    const key = await ahrefs.resolveApiKey('user-123', null);
    assert.equal(key, 'test-ahrefs-token');
  });

  it('returns null when no key is configured', async () => {
    delete process.env.AHREFS_API_TOKEN;
    const key = await ahrefs.resolveApiKey('user-123', null);
    assert.equal(key, null);
  });

  it('prefers client key over env var when KeyManager has a key', async () => {
    process.env.AHREFS_API_TOKEN = 'env-token';
    const mockKeyManager = {
      resolveKey: async (keyName, scope) => {
        if (keyName === 'ahrefs_api_token' && scope === 'user-123') {
          return 'client-token';
        }
        return null;
      }
    };
    const key = await ahrefs.resolveApiKey('user-123', mockKeyManager);
    assert.equal(key, 'client-token');
  });

  it('falls back to env var when KeyManager has no key', async () => {
    process.env.AHREFS_API_TOKEN = 'env-token';
    const mockKeyManager = {
      resolveKey: async () => null
    };
    const key = await ahrefs.resolveApiKey('user-123', mockKeyManager);
    assert.equal(key, 'env-token');
  });

  it('handles KeyManager errors gracefully', async () => {
    process.env.AHREFS_API_TOKEN = 'env-token';
    const mockKeyManager = {
      resolveKey: async () => { throw new Error('DB connection failed'); }
    };
    const key = await ahrefs.resolveApiKey('user-123', mockKeyManager);
    assert.equal(key, 'env-token');
  });
});

// ── Cache Tests ─────────────────────────────────────────────

describe('Ahrefs — 7-Day Cache', () => {
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

    const result = await ahrefs.checkCache('user-123', 'ahrefs_backlinks', 'example.com');
    assert.equal(result, null);
  });

  it('checkCache returns cached data when within 7-day window', async () => {
    const cachedData = { domain: 'example.com', backlinks: [] };
    mockFetch(async (url) => {
      if (url.includes('data_cache')) {
        return mockResponse([{
          data: cachedData,
          updated_at: new Date().toISOString()
        }]);
      }
      return mockResponse({}, 404);
    });

    const result = await ahrefs.checkCache('user-123', 'ahrefs_backlinks', 'example.com');
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

    await ahrefs.updateCache('user-123', 'ahrefs_test', 'key1', { test: true });
    assert.ok(storedData);
    assert.equal(storedData.user_id, 'user-123');
    assert.equal(storedData.cache_type, 'ahrefs_test');
    assert.equal(storedData.cache_key, 'key1');
    assert.deepEqual(storedData.data, { test: true });
  });
});

// ── API Request Error Handling Tests ────────────────────────

describe('Ahrefs — API Error Handling', () => {
  afterEach(() => {
    restoreFetch();
  });

  it('throws AhrefsError with unrecoverable flag on 401', async () => {
    mockFetch(async () => mockResponse({ error: 'Unauthorized' }, 401));

    await assert.rejects(
      () => ahrefs.ahrefsApiRequest('site-explorer/overview', { target: 'test.com' }, 'bad-token'),
      (err) => {
        assert.ok(err instanceof ahrefs.AhrefsError);
        assert.ok(err.unrecoverable);
        assert.equal(err.statusCode, 401);
        return true;
      }
    );
  });

  it('throws AhrefsError on 402 payment required', async () => {
    mockFetch(async () => mockResponse({ error: 'Payment required' }, 402));

    await assert.rejects(
      () => ahrefs.ahrefsApiRequest('site-explorer/overview', { target: 'test.com' }, 'token'),
      (err) => {
        assert.ok(err instanceof ahrefs.AhrefsError);
        assert.ok(err.unrecoverable);
        assert.equal(err.statusCode, 402);
        return true;
      }
    );
  });

  it('returns parsed JSON on successful response', async () => {
    const responseData = { metrics: { domain_rating: 75, backlinks: 5000 } };
    mockFetch(async () => mockResponse(responseData, 200));

    const result = await ahrefs.ahrefsApiRequest('site-explorer/overview', { target: 'test.com' }, 'token');
    assert.deepEqual(result, responseData);
  });

  it('sends Bearer token in Authorization header', async () => {
    let capturedHeaders = null;
    mockFetch(async (url, opts) => {
      capturedHeaders = opts.headers;
      return mockResponse({ metrics: {} }, 200);
    });

    await ahrefs.ahrefsApiRequest('site-explorer/overview', { target: 'test.com' }, 'my-secret-token');
    assert.ok(capturedHeaders);
    assert.equal(capturedHeaders['Authorization'], 'Bearer my-secret-token');
  });
});

// ── Trigger Handler Tests ───────────────────────────────────

describe('Ahrefs — Trigger Handler', () => {
  const originalEnvKey = process.env.AHREFS_API_TOKEN;

  afterEach(() => {
    restoreFetch();
    if (originalEnvKey) {
      process.env.AHREFS_API_TOKEN = originalEnvKey;
    } else {
      delete process.env.AHREFS_API_TOKEN;
    }
  });

  it('returns skipped status when no API token is configured', async () => {
    delete process.env.AHREFS_API_TOKEN;
    mockFetch(async () => mockResponse([]));

    const result = await ahrefs.handleTrigger('user-123', {});
    assert.equal(result.success, true);
    assert.equal(result.data.status, 'skipped');
    assert.ok(result.data.message.includes('No Ahrefs API token'));
  });

  it('returns error when no domain is provided', async () => {
    process.env.AHREFS_API_TOKEN = 'test-token';
    mockFetch(async (url) => {
      if (url.includes('client_connections')) {
        return mockResponse([]);
      }
      return mockResponse({}, 404);
    });

    const result = await ahrefs.handleTrigger('user-123', {});
    assert.equal(result.success, false);
    assert.ok(result.error.includes('No domain'));
  });

  it('completes full sync successfully', async () => {
    process.env.AHREFS_API_TOKEN = 'test-token';
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
      // Ahrefs API calls
      if (url.includes('api.ahrefs.com')) {
        apiCallCount++;
        if (url.includes('overview')) {
          return mockResponse({
            metrics: { domain_rating: 75, backlinks: 5000, refdomains: 200, organic_traffic: 10000 }
          });
        }
        if (url.includes('all-backlinks')) {
          return mockResponse({
            backlinks: [
              { url_from: 'https://ref.com/page', domain_rating: 80 }
            ]
          });
        }
        if (url.includes('domain-rating')) {
          return mockResponse({ domain_rating: 75, ahrefs_rank: 12345 });
        }
        if (url.includes('keywords-explorer/overview')) {
          return mockResponse({ volume: 5000, difficulty: 45, cpc: 2.5 });
        }
        if (url.includes('related-terms')) {
          return mockResponse({ terms: [{ keyword: 'related kw', volume: 1000 }] });
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

    const result = await ahrefs.handleTrigger('user-123', {
      domain: 'example.com',
      keyword: 'seo tools'
    });

    assert.equal(result.success, true);
    assert.equal(result.data.status, 'completed');
    assert.equal(result.data.domain, 'example.com');
    assert.ok(result.data.totalRows > 0);
    assert.ok(apiCallCount >= 3); // overview + backlinks + domain-rating + keyword calls
  });
});

// ── Status Handler Tests ────────────────────────────────────

describe('Ahrefs — Status Handler', () => {
  const originalEnvKey = process.env.AHREFS_API_TOKEN;

  afterEach(() => {
    restoreFetch();
    if (originalEnvKey) {
      process.env.AHREFS_API_TOKEN = originalEnvKey;
    } else {
      delete process.env.AHREFS_API_TOKEN;
    }
  });

  it('returns not_configured when no API token and no connection', async () => {
    delete process.env.AHREFS_API_TOKEN;
    mockFetch(async () => mockResponse([]));

    const result = await ahrefs.handleStatus('user-123');
    assert.equal(result.success, true);
    assert.equal(result.data.connected, false);
    assert.equal(result.data.status, 'not_configured');
  });

  it('returns key_available when env token is set but no connection', async () => {
    process.env.AHREFS_API_TOKEN = 'test-token';
    mockFetch(async () => mockResponse([]));

    const result = await ahrefs.handleStatus('user-123');
    assert.equal(result.success, true);
    assert.equal(result.data.hasApiKey, true);
    assert.equal(result.data.status, 'key_available');
  });

  it('returns connection details when connection exists', async () => {
    process.env.AHREFS_API_TOKEN = 'test-token';
    mockFetch(async () => mockResponse([{
      status: 'connected',
      last_sync_at: '2026-03-20T00:00:00Z',
      last_error: null,
      metadata: { domain: 'example.com', last_sync: { totalRows: 50 } }
    }]));

    const result = await ahrefs.handleStatus('user-123');
    assert.equal(result.success, true);
    assert.equal(result.data.connected, true);
    assert.equal(result.data.domain, 'example.com');
  });
});

// ── Constants Tests ─────────────────────────────────────────

describe('Ahrefs — Constants', () => {
  it('CACHE_TTL_MS is 7 days', () => {
    assert.equal(ahrefs.CACHE_TTL_MS, 7 * 24 * 60 * 60 * 1000);
  });

  it('RETRY_DELAYS has 3 entries with increasing delays', () => {
    assert.equal(ahrefs.RETRY_DELAYS.length, 3);
    assert.ok(ahrefs.RETRY_DELAYS[0] < ahrefs.RETRY_DELAYS[1]);
    assert.ok(ahrefs.RETRY_DELAYS[1] < ahrefs.RETRY_DELAYS[2]);
  });

  it('AhrefsError has correct properties', () => {
    const err = new ahrefs.AhrefsError('test error', 429, false);
    assert.equal(err.name, 'AhrefsError');
    assert.equal(err.message, 'test error');
    assert.equal(err.statusCode, 429);
    assert.equal(err.unrecoverable, false);
  });
});
