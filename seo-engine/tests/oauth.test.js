/**
 * OAuth Module Tests — DI-001
 *
 * Tests for Google OAuth2 infrastructure:
 * - PKCE code_verifier/code_challenge generation
 * - Auth URL construction
 * - Token encryption roundtrip
 * - State validation (missing, expired, replayed)
 * - Token refresh retry logic
 * - Proactive refresh window
 *
 * Uses node:test with mocked Supabase + Google endpoints.
 */

const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

// Set a fixed encryption key for tests
process.env.BRIDGE_ENCRYPTION_KEY = 'a'.repeat(64);

// Set Google OAuth config for tests
process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:19847/api/connections/google/callback';

// Set Supabase config for tests
process.env.SUPABASE_URL = 'https://test-project.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

const { encrypt, decrypt } = require('../bridge/key-manager');

// We need to require oauth after env vars are set
const oauth = require('../bridge/oauth');

// ── Helper: Mock fetch ──────────────────────────────────────

let fetchMock;
const originalFetch = globalThis.fetch;

function mockFetch(handler) {
  fetchMock = handler;
  globalThis.fetch = async (url, opts) => {
    return fetchMock(url, opts);
  };
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

// ── PKCE Tests ──────────────────────────────────────────────

describe('OAuth — PKCE', () => {
  it('generateCodeVerifier produces base64url-encoded 64 random bytes', () => {
    const verifier = oauth.generateCodeVerifier();
    assert.ok(typeof verifier === 'string');
    // 64 bytes base64url = ~86 chars (no padding)
    assert.ok(verifier.length >= 43, `Verifier should be at least 43 chars, got ${verifier.length}`);
    // Should be valid base64url (no +, /, =)
    assert.ok(!/[+/=]/.test(verifier), 'Should be base64url encoded (no +, /, =)');
  });

  it('generateCodeChallenge produces SHA-256 base64url hash of verifier', () => {
    const verifier = 'test-verifier-value';
    const challenge = oauth.generateCodeChallenge(verifier);

    // Manually compute expected SHA-256 base64url
    const hash = crypto.createHash('sha256').update(verifier).digest();
    const expected = hash.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    assert.equal(challenge, expected);
  });

  it('code_verifier and code_challenge are consistent', () => {
    const verifier = oauth.generateCodeVerifier();
    const challenge = oauth.generateCodeChallenge(verifier);

    // Re-derive to verify consistency
    const hash = crypto.createHash('sha256').update(verifier).digest();
    const expectedChallenge = oauth.base64url(hash);

    assert.equal(challenge, expectedChallenge);
  });

  it('different verifiers produce different challenges', () => {
    const v1 = oauth.generateCodeVerifier();
    const v2 = oauth.generateCodeVerifier();

    assert.notEqual(v1, v2, 'Verifiers should be random');
    assert.notEqual(
      oauth.generateCodeChallenge(v1),
      oauth.generateCodeChallenge(v2),
      'Challenges should differ for different verifiers'
    );
  });
});

// ── State Generation Tests ──────────────────────────────────

describe('OAuth — State Generation', () => {
  it('generateState produces 64-char hex string (32 bytes)', () => {
    const state = oauth.generateState();
    assert.equal(state.length, 64, 'State should be 64 hex chars');
    assert.ok(/^[0-9a-f]{64}$/.test(state), 'State should be hex-encoded');
  });

  it('generates unique states', () => {
    const s1 = oauth.generateState();
    const s2 = oauth.generateState();
    assert.notEqual(s1, s2);
  });
});

// ── Token Encryption Tests ──────────────────────────────────

describe('OAuth — Token Encryption', () => {
  it('encrypt/decrypt roundtrip for access token', () => {
    const token = 'ya29.a0AfH6SMBx_FAKE_ACCESS_TOKEN_VALUE_HERE';
    const encrypted = encrypt(token);
    const decrypted = decrypt(encrypted);
    assert.equal(decrypted, token);
  });

  it('encrypt/decrypt roundtrip for refresh token', () => {
    const token = '1//0dNifGECgYIARAAGAwSNwF-L9IrGoog_FAKE_REFRESH';
    const encrypted = encrypt(token);
    const decrypted = decrypt(encrypted);
    assert.equal(decrypted, token);
  });

  it('encrypted tokens are not readable', () => {
    const token = 'ya29.secret-token';
    const encrypted = encrypt(token);
    assert.ok(!encrypted.includes(token), 'Encrypted value should not contain plaintext');
  });

  it('each encryption produces unique ciphertext (random IV)', () => {
    const token = 'ya29.test-token';
    const enc1 = encrypt(token);
    const enc2 = encrypt(token);
    assert.notEqual(enc1, enc2);
    assert.equal(decrypt(enc1), token);
    assert.equal(decrypt(enc2), token);
  });
});

// ── Auth URL Generation Tests ──────────────────────────────

describe('OAuth — generateAuthUrl', () => {
  afterEach(() => {
    restoreFetch();
  });

  it('produces valid Google OAuth URL with correct params', async () => {
    const userId = crypto.randomUUID();

    mockFetch(async (url, opts) => {
      // Mock the oauth_states insert
      if (url.includes('/rest/v1/oauth_states')) {
        return { ok: true, status: 201, json: async () => ({}) };
      }
      return { ok: false, status: 404, json: async () => ({ error: 'not found' }) };
    });

    const { authUrl, state } = await oauth.generateAuthUrl(userId);

    // Verify URL structure
    assert.ok(authUrl.startsWith('https://accounts.google.com/o/oauth2/v2/auth?'));

    const url = new URL(authUrl);
    assert.equal(url.searchParams.get('client_id'), 'test-client-id.apps.googleusercontent.com');
    assert.equal(url.searchParams.get('redirect_uri'), 'http://localhost:19847/api/connections/google/callback');
    assert.equal(url.searchParams.get('response_type'), 'code');
    assert.equal(url.searchParams.get('access_type'), 'offline');
    assert.equal(url.searchParams.get('prompt'), 'consent');
    assert.equal(url.searchParams.get('code_challenge_method'), 'S256');

    // Verify PKCE code_challenge is present
    const codeChallenge = url.searchParams.get('code_challenge');
    assert.ok(codeChallenge, 'code_challenge must be present');
    assert.ok(codeChallenge.length > 20, 'code_challenge should be a substantial string');

    // Verify scopes include GSC and GA4
    const scopes = url.searchParams.get('scope');
    assert.ok(scopes.includes('webmasters.readonly'), 'Should include GSC scope');
    assert.ok(scopes.includes('analytics.readonly'), 'Should include GA4 scope');

    // Verify state
    assert.equal(url.searchParams.get('state'), state);
    assert.equal(state.length, 64, 'State should be 64 hex chars');
  });

  it('stores state in oauth_states via Supabase', async () => {
    const userId = crypto.randomUUID();
    let storedState = null;

    mockFetch(async (url, opts) => {
      if (url.includes('/rest/v1/oauth_states') && opts.method === 'POST') {
        const body = JSON.parse(opts.body);
        storedState = body;
        assert.equal(body.user_id, userId);
        assert.equal(body.provider, 'google');
        assert.ok(body.state, 'State should be present');
        assert.ok(body.code_verifier, 'Code verifier should be present');
        return { ok: true, status: 201, json: async () => ({}) };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });

    await oauth.generateAuthUrl(userId);
    assert.ok(storedState, 'State should have been stored');
  });

  it('throws if state storage fails', async () => {
    const userId = crypto.randomUUID();

    mockFetch(async (url, opts) => {
      if (url.includes('/rest/v1/oauth_states')) {
        return { ok: false, status: 500, json: async () => ({ message: 'DB error' }) };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });

    await assert.rejects(
      () => oauth.generateAuthUrl(userId),
      { message: /Failed to initialize OAuth flow/ }
    );
  });
});

// ── handleCallback Tests ──────────────────────────────────

describe('OAuth — handleCallback', () => {
  afterEach(() => {
    restoreFetch();
  });

  it('rejects missing code', async () => {
    await assert.rejects(
      () => oauth.handleCallback(null, 'some-state'),
      { message: /Missing authorization code or state/ }
    );
  });

  it('rejects missing state', async () => {
    await assert.rejects(
      () => oauth.handleCallback('some-code', null),
      { message: /Missing authorization code or state/ }
    );
  });

  it('rejects invalid state (not found in database)', async () => {
    mockFetch(async (url, opts) => {
      if (url.includes('/rest/v1/oauth_states') && !opts.method) {
        return { ok: true, json: async () => [] }; // empty — not found
      }
      return { ok: true, json: async () => ({}) };
    });

    await assert.rejects(
      () => oauth.handleCallback('code123', 'invalid-state'),
      { message: /Invalid or expired OAuth state/ }
    );
  });

  it('rejects expired state (older than 10 minutes)', async () => {
    const expiredDate = new Date(Date.now() - 11 * 60 * 1000).toISOString(); // 11 min ago

    mockFetch(async (url, opts) => {
      if (url.includes('/rest/v1/oauth_states') && (!opts || !opts.method || opts.method === 'GET')) {
        return {
          ok: true,
          json: async () => [{
            state: 'expired-state',
            user_id: crypto.randomUUID(),
            code_verifier: 'test-verifier',
            provider: 'google',
            created_at: expiredDate
          }]
        };
      }
      // DELETE for state cleanup
      if (url.includes('/rest/v1/oauth_states') && opts && opts.method === 'DELETE') {
        return { ok: true, json: async () => ({}) };
      }
      return { ok: true, json: async () => ({}) };
    });

    await assert.rejects(
      () => oauth.handleCallback('code123', 'expired-state'),
      { message: /OAuth state expired/ }
    );
  });

  it('exchanges code and stores encrypted tokens on valid callback', async () => {
    const userId = crypto.randomUUID();
    const validState = 'a'.repeat(64);
    const codeVerifier = oauth.generateCodeVerifier();
    let upsertedConnection = null;

    mockFetch(async (url, opts) => {
      // State lookup
      if (url.includes('/rest/v1/oauth_states') && (!opts || !opts.method || opts.method === 'GET')) {
        return {
          ok: true,
          json: async () => [{
            state: validState,
            user_id: userId,
            code_verifier: codeVerifier,
            provider: 'google',
            created_at: new Date().toISOString()
          }]
        };
      }

      // State deletion
      if (url.includes('/rest/v1/oauth_states') && opts && opts.method === 'DELETE') {
        return { ok: true, json: async () => ({}) };
      }

      // Google token exchange
      if (url.includes('oauth2.googleapis.com/token')) {
        return {
          ok: true,
          json: async () => ({
            access_token: 'ya29.test-access-token',
            refresh_token: '1//test-refresh-token',
            expires_in: 3600,
            token_type: 'Bearer',
            scope: 'openid email profile'
          })
        };
      }

      // client_connections upsert
      if (url.includes('/rest/v1/client_connections')) {
        const body = JSON.parse(opts.body);
        upsertedConnection = body;
        return {
          ok: true,
          json: async () => [body]
        };
      }

      return { ok: true, json: async () => ({}) };
    });

    const result = await oauth.handleCallback('auth-code-123', validState);

    assert.equal(result.userId, userId);
    assert.equal(result.provider, 'google');
    assert.equal(result.status, 'connected');

    // Verify tokens were encrypted
    assert.ok(upsertedConnection, 'Connection should have been upserted');
    assert.equal(upsertedConnection.status, 'connected');
    assert.ok(upsertedConnection.access_token_encrypted, 'Access token should be encrypted');
    assert.ok(upsertedConnection.refresh_token_encrypted, 'Refresh token should be encrypted');

    // Verify encrypted tokens can be decrypted
    const decryptedAccess = decrypt(upsertedConnection.access_token_encrypted);
    assert.equal(decryptedAccess, 'ya29.test-access-token');

    const decryptedRefresh = decrypt(upsertedConnection.refresh_token_encrypted);
    assert.equal(decryptedRefresh, '1//test-refresh-token');
  });
});

// ── refreshToken Tests ──────────────────────────────────────

describe('OAuth — refreshToken', () => {
  afterEach(() => {
    restoreFetch();
  });

  it('refreshes token successfully on first attempt', async () => {
    const connectionId = crypto.randomUUID();
    const refreshTokenValue = '1//test-refresh';
    const encryptedRefresh = encrypt(refreshTokenValue);

    mockFetch(async (url, opts) => {
      // Connection lookup
      if (url.includes('/rest/v1/client_connections') && (!opts || !opts.method || opts.method === 'GET')) {
        return {
          ok: true,
          json: async () => [{
            id: connectionId,
            user_id: crypto.randomUUID(),
            refresh_token_encrypted: encryptedRefresh,
            status: 'connected'
          }]
        };
      }

      // Google token refresh
      if (url.includes('oauth2.googleapis.com/token')) {
        return {
          ok: true,
          json: async () => ({
            access_token: 'ya29.new-access-token',
            expires_in: 3600
          })
        };
      }

      // Connection update
      if (url.includes('/rest/v1/client_connections') && opts && opts.method === 'PATCH') {
        const body = JSON.parse(opts.body);
        assert.equal(body.status, 'connected');
        assert.ok(body.access_token_encrypted);
        const decrypted = decrypt(body.access_token_encrypted);
        assert.equal(decrypted, 'ya29.new-access-token');
        return { ok: true, json: async () => ({}) };
      }

      return { ok: true, json: async () => ({}) };
    });

    const result = await oauth.refreshToken(connectionId);
    assert.equal(result.accessToken, 'ya29.new-access-token');
    assert.ok(result.expiresAt);
  });

  it('marks connection as expired after 3 failed attempts', async () => {
    const connectionId = crypto.randomUUID();
    const encryptedRefresh = encrypt('1//test-refresh');
    let attemptCount = 0;
    let markedExpired = false;

    mockFetch(async (url, opts) => {
      // Connection lookup
      if (url.includes('/rest/v1/client_connections') && (!opts || !opts.method || opts.method === 'GET')) {
        return {
          ok: true,
          json: async () => [{
            id: connectionId,
            user_id: crypto.randomUUID(),
            refresh_token_encrypted: encryptedRefresh,
            status: 'connected'
          }]
        };
      }

      // Google token refresh — always fail
      if (url.includes('oauth2.googleapis.com/token')) {
        attemptCount++;
        return {
          ok: false,
          status: 401,
          json: async () => ({ error: 'invalid_grant', error_description: 'Token has been revoked.' })
        };
      }

      // Connection update to expired
      if (url.includes('/rest/v1/client_connections') && opts && opts.method === 'PATCH') {
        const body = JSON.parse(opts.body);
        if (body.status === 'expired') {
          markedExpired = true;
        }
        return { ok: true, json: async () => ({}) };
      }

      return { ok: true, json: async () => ({}) };
    });

    await assert.rejects(
      () => oauth.refreshToken(connectionId),
      { message: /Token refresh failed after 3 attempts/ }
    );

    assert.ok(markedExpired, 'Connection should be marked as expired');
    // invalid_grant breaks immediately without retrying
    assert.equal(attemptCount, 1, 'Should stop on invalid_grant without retrying');
  });

  it('throws if no refresh token available', async () => {
    const connectionId = crypto.randomUUID();

    mockFetch(async (url, opts) => {
      if (url.includes('/rest/v1/client_connections') && (!opts || !opts.method || opts.method === 'GET')) {
        return {
          ok: true,
          json: async () => [{
            id: connectionId,
            user_id: crypto.randomUUID(),
            refresh_token_encrypted: null,
            status: 'connected'
          }]
        };
      }
      return { ok: true, json: async () => ({}) };
    });

    await assert.rejects(
      () => oauth.refreshToken(connectionId),
      { message: /No refresh token available/ }
    );
  });
});

// ── getValidToken Tests ──────────────────────────────────────

describe('OAuth — getValidToken', () => {
  afterEach(() => {
    restoreFetch();
  });

  it('returns decrypted token when not expired', async () => {
    const connectionId = crypto.randomUUID();
    const accessToken = 'ya29.valid-token';
    const encryptedAccess = encrypt(accessToken);
    // Token expires in 48 hours (outside 24h refresh window)
    const futureExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    mockFetch(async (url, opts) => {
      if (url.includes('/rest/v1/client_connections')) {
        return {
          ok: true,
          json: async () => [{
            id: connectionId,
            user_id: crypto.randomUUID(),
            access_token_encrypted: encryptedAccess,
            refresh_token_encrypted: encrypt('1//refresh'),
            token_expires_at: futureExpiry,
            status: 'connected'
          }]
        };
      }
      return { ok: true, json: async () => ({}) };
    });

    const token = await oauth.getValidToken(connectionId);
    assert.equal(token, accessToken);
  });

  it('proactively refreshes when token expires within 24 hours', async () => {
    const connectionId = crypto.randomUUID();
    const encryptedAccess = encrypt('ya29.old-token');
    const encryptedRefresh = encrypt('1//refresh-token');
    // Token expires in 12 hours (within 24h window)
    const soonExpiry = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
    let refreshCalled = false;

    mockFetch(async (url, opts) => {
      // Connection lookup (called twice: once by getValidToken, once by refreshToken)
      if (url.includes('/rest/v1/client_connections') && (!opts || !opts.method || opts.method === 'GET')) {
        return {
          ok: true,
          json: async () => [{
            id: connectionId,
            user_id: crypto.randomUUID(),
            access_token_encrypted: encryptedAccess,
            refresh_token_encrypted: encryptedRefresh,
            token_expires_at: soonExpiry,
            status: 'connected'
          }]
        };
      }

      // Google token refresh
      if (url.includes('oauth2.googleapis.com/token')) {
        refreshCalled = true;
        return {
          ok: true,
          json: async () => ({
            access_token: 'ya29.refreshed-token',
            expires_in: 3600
          })
        };
      }

      // Connection update
      if (url.includes('/rest/v1/client_connections') && opts && opts.method === 'PATCH') {
        return { ok: true, json: async () => ({}) };
      }

      return { ok: true, json: async () => ({}) };
    });

    const token = await oauth.getValidToken(connectionId);
    assert.equal(token, 'ya29.refreshed-token');
    assert.ok(refreshCalled, 'Should have called Google token refresh');
  });

  it('throws for expired/revoked connections', async () => {
    const connectionId = crypto.randomUUID();

    mockFetch(async (url, opts) => {
      if (url.includes('/rest/v1/client_connections')) {
        return {
          ok: true,
          json: async () => [{
            id: connectionId,
            user_id: crypto.randomUUID(),
            access_token_encrypted: encrypt('ya29.test'),
            status: 'expired'
          }]
        };
      }
      return { ok: true, json: async () => ({}) };
    });

    await assert.rejects(
      () => oauth.getValidToken(connectionId),
      { message: /Connection is expired/ }
    );
  });
});

// ── Config Validation Tests ──────────────────────────────────

describe('OAuth — Configuration', () => {
  it('getGoogleConfig returns config when env vars are set', () => {
    const config = oauth.getGoogleConfig();
    assert.ok(config);
    assert.equal(config.clientId, 'test-client-id.apps.googleusercontent.com');
    assert.equal(config.clientSecret, 'test-client-secret');
    assert.equal(config.redirectUri, 'http://localhost:19847/api/connections/google/callback');
  });

  it('GOOGLE_SCOPES includes GSC and GA4 scopes', () => {
    const scopes = oauth.GOOGLE_SCOPES;
    assert.ok(scopes.some(s => s.includes('webmasters')), 'Should include GSC scope');
    assert.ok(scopes.some(s => s.includes('analytics')), 'Should include GA4 scope');
  });

  it('STATE_TTL_MS is 10 minutes', () => {
    assert.equal(oauth.STATE_TTL_MS, 10 * 60 * 1000);
  });

  it('REFRESH_WINDOW_MS is 24 hours', () => {
    assert.equal(oauth.REFRESH_WINDOW_MS, 24 * 60 * 60 * 1000);
  });

  it('RETRY_DELAYS has 3 entries with exponential backoff', () => {
    assert.equal(oauth.RETRY_DELAYS.length, 3);
    assert.equal(oauth.RETRY_DELAYS[0], 5000);
    assert.equal(oauth.RETRY_DELAYS[1], 15000);
    assert.equal(oauth.RETRY_DELAYS[2], 45000);
  });
});

// ── listConnections Tests ──────────────────────────────────

describe('OAuth — listConnections', () => {
  afterEach(() => {
    restoreFetch();
  });

  it('returns connections without token fields', async () => {
    const userId = crypto.randomUUID();

    mockFetch(async (url, opts) => {
      if (url.includes('/rest/v1/client_connections')) {
        // Verify the select parameter does NOT include token fields
        assert.ok(!url.includes('access_token_encrypted'), 'Should not select access_token_encrypted');
        assert.ok(!url.includes('refresh_token_encrypted'), 'Should not select refresh_token_encrypted');
        assert.ok(url.includes('select='), 'Should have select parameter');
        return {
          ok: true,
          json: async () => [{
            id: crypto.randomUUID(),
            user_id: userId,
            provider: 'google',
            status: 'connected',
            created_at: new Date().toISOString()
          }]
        };
      }
      return { ok: true, json: async () => [] };
    });

    const connections = await oauth.listConnections(userId);
    assert.equal(connections.length, 1);
    assert.equal(connections[0].provider, 'google');
    assert.ok(!connections[0].access_token_encrypted, 'Should not include encrypted access token');
    assert.ok(!connections[0].refresh_token_encrypted, 'Should not include encrypted refresh token');
  });
});

// ── getConnectionsStatus Tests ──────────────────────────────

describe('OAuth — getConnectionsStatus', () => {
  afterEach(() => {
    restoreFetch();
  });

  it('returns status for all providers', async () => {
    const userId = crypto.randomUUID();

    mockFetch(async (url, opts) => {
      if (url.includes('/rest/v1/client_connections')) {
        return {
          ok: true,
          json: async () => [{
            id: crypto.randomUUID(),
            user_id: userId,
            provider: 'google',
            status: 'connected',
            token_expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            last_sync_at: null,
            last_error: null,
            sync_count: 5,
            gsc_property: 'sc-domain:example.com',
            ga4_property_id: '123456789',
            created_at: new Date().toISOString()
          }]
        };
      }
      return { ok: true, json: async () => [] };
    });

    const status = await oauth.getConnectionsStatus(userId);

    // Google should be connected
    assert.ok(status.google);
    assert.equal(status.google.connected, true);
    assert.equal(status.google.status, 'connected');
    assert.equal(status.google.sync_count, 5);
    assert.equal(status.google.gsc_property, 'sc-domain:example.com');
    assert.equal(status.google.ga4_property_id, '123456789');

    // Semrush and Ahrefs should be not connected
    assert.ok(status.semrush);
    assert.equal(status.semrush.connected, false);
    assert.equal(status.semrush.status, 'not_connected');

    assert.ok(status.ahrefs);
    assert.equal(status.ahrefs.connected, false);
    assert.equal(status.ahrefs.status, 'not_connected');
  });

  it('identifies tokens needing refresh (within 24h window)', async () => {
    const userId = crypto.randomUUID();
    // Token expires in 12 hours
    const soonExpiry = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();

    mockFetch(async (url, opts) => {
      if (url.includes('/rest/v1/client_connections')) {
        return {
          ok: true,
          json: async () => [{
            id: crypto.randomUUID(),
            user_id: userId,
            provider: 'google',
            status: 'connected',
            token_expires_at: soonExpiry,
            last_sync_at: null,
            last_error: null,
            sync_count: 0,
            created_at: new Date().toISOString()
          }]
        };
      }
      return { ok: true, json: async () => [] };
    });

    const status = await oauth.getConnectionsStatus(userId);
    assert.equal(status.google.needs_refresh, true, 'Should identify token needing refresh');
  });
});

// ── cleanupExpiredStates Tests ──────────────────────────────

describe('OAuth — cleanupExpiredStates', () => {
  afterEach(() => {
    restoreFetch();
  });

  it('deletes states older than 10 minutes', async () => {
    let deleteCalled = false;
    let deleteUrl = '';

    mockFetch(async (url, opts) => {
      if (url.includes('/rest/v1/oauth_states') && opts && opts.method === 'DELETE') {
        deleteCalled = true;
        deleteUrl = url;
        return {
          ok: true,
          json: async () => [{ state: 'old-state' }]
        };
      }
      return { ok: true, json: async () => [] };
    });

    const count = await oauth.cleanupExpiredStates();
    assert.ok(deleteCalled, 'Should call DELETE on oauth_states');
    assert.ok(deleteUrl.includes('created_at=lt.'), 'Should filter by created_at');
    assert.equal(count, 1);
  });
});

// ── base64url Tests ──────────────────────────────────────────

describe('OAuth — base64url', () => {
  it('encodes without +, /, or = characters', () => {
    // Create a buffer that would produce +, /, = in standard base64
    const buf = Buffer.from([0xfb, 0xff, 0xfe, 0x3e, 0x3f]);
    const encoded = oauth.base64url(buf);
    assert.ok(!encoded.includes('+'), 'Should not contain +');
    assert.ok(!encoded.includes('/'), 'Should not contain /');
    assert.ok(!encoded.includes('='), 'Should not contain =');
  });

  it('correctly replaces base64 special characters', () => {
    const buf = Buffer.from([0xfb, 0xef]);
    const standard = buf.toString('base64'); // may contain +/=
    const urlSafe = oauth.base64url(buf);
    // Verify it's different from standard if standard had special chars
    if (standard.includes('+') || standard.includes('/')) {
      assert.notEqual(urlSafe, standard);
    }
  });
});
