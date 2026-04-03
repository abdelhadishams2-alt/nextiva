/**
 * Google OAuth2 Module for ChainIQ Bridge Server
 *
 * Implements PKCE-based OAuth2 flow with CSRF state protection,
 * AES-256-GCM token encryption at rest, and proactive token refresh.
 *
 * Zero npm dependencies — uses Node.js built-in crypto + native fetch.
 */

const crypto = require('crypto');
const { encrypt, decrypt } = require('./key-manager');
const supabase = require('./supabase-client');
const logger = require('./logger');

// ── Google OAuth2 Configuration ──────────────────────────────
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/analytics.readonly',
  'openid',
  'email',
  'profile'
];

// State TTL: 10 minutes
const STATE_TTL_MS = 10 * 60 * 1000;

// Proactive refresh window: 24 hours before expiry
const REFRESH_WINDOW_MS = 24 * 60 * 60 * 1000;

// Retry backoff delays for token refresh (5s, 15s, 45s)
const RETRY_DELAYS = [5000, 15000, 45000];

/**
 * Read and validate Google OAuth environment variables.
 * Warns but does not crash if missing — allows server to start without OAuth.
 */
function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return null;
  }

  return { clientId, clientSecret, redirectUri };
}

/**
 * Validate Google OAuth config at startup (warn, don't crash).
 */
function validateConfigOnStartup() {
  const config = getGoogleConfig();
  if (!config) {
    logger.warn('Google OAuth not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI in environment.');
    return false;
  }
  logger.info('oauth_config_valid', { redirectUri: config.redirectUri });
  return true;
}

/**
 * Get Supabase config and service role key for admin operations.
 */
function getSupabaseAdmin() {
  const config = supabase.loadConfig();
  const serviceRoleKey = supabase.getServiceRoleKey();
  if (!config || !serviceRoleKey) {
    throw new Error('Supabase admin config not available. Set SUPABASE_SERVICE_ROLE_KEY env var.');
  }
  return { config, serviceRoleKey };
}

/**
 * Base64url encode a buffer (RFC 7636 compliant).
 */
function base64url(buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate a PKCE code_verifier (64 random bytes, base64url encoded).
 */
function generateCodeVerifier() {
  return base64url(crypto.randomBytes(64));
}

/**
 * Generate a PKCE code_challenge from a code_verifier (SHA-256, base64url).
 */
function generateCodeChallenge(codeVerifier) {
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  return base64url(hash);
}

/**
 * Generate a CSRF state token (32 random bytes, hex encoded).
 */
function generateState() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate an OAuth2 authorization URL with PKCE and CSRF state.
 *
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<{ authUrl: string, state: string }>}
 */
async function generateAuthUrl(userId) {
  const googleConfig = getGoogleConfig();
  if (!googleConfig) {
    throw new Error('Google OAuth not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI.');
  }

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateState();

  // Store state + code_verifier in oauth_states via Supabase service_role
  const { config, serviceRoleKey } = getSupabaseAdmin();

  const storeRes = await fetch(`${config.url}/rest/v1/oauth_states`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      state,
      user_id: userId,
      code_verifier: codeVerifier,
      provider: 'google'
    })
  });

  if (!storeRes.ok) {
    const err = await storeRes.json().catch(() => ({}));
    logger.error('oauth_state_store_failed', { userId, error: err.message || storeRes.statusText });
    throw new Error('Failed to initialize OAuth flow. Please try again.');
  }

  logger.info('oauth_auth_url_generated', { userId, provider: 'google' });

  // Build authorization URL
  const params = new URLSearchParams({
    client_id: googleConfig.clientId,
    redirect_uri: googleConfig.redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });

  const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;

  return { authUrl, state };
}

/**
 * Handle the OAuth2 callback — validate state, exchange code, store tokens.
 *
 * @param {string} code - Authorization code from Google
 * @param {string} state - CSRF state token
 * @returns {Promise<{ userId: string, provider: string, status: string }>}
 */
async function handleCallback(code, state) {
  if (!code || !state) {
    throw new Error('Missing authorization code or state parameter.');
  }

  const googleConfig = getGoogleConfig();
  if (!googleConfig) {
    throw new Error('Google OAuth not configured.');
  }

  const { config, serviceRoleKey } = getSupabaseAdmin();

  // 1. Validate state — fetch from oauth_states
  const stateRes = await fetch(
    `${config.url}/rest/v1/oauth_states?state=eq.${encodeURIComponent(state)}&select=*`,
    {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey
      }
    }
  );

  if (!stateRes.ok) {
    logger.logSecurity('oauth_state_lookup_failed', { state: state.slice(0, 8) + '...' });
    throw new Error('OAuth state validation failed.');
  }

  const stateRows = await stateRes.json();
  if (!stateRows || stateRows.length === 0) {
    logger.logSecurity('oauth_invalid_state', { state: state.slice(0, 8) + '...' });
    throw new Error('Invalid or expired OAuth state. Please try connecting again.');
  }

  const stateRecord = stateRows[0];

  // 2. Check TTL (10-minute window)
  const stateAge = Date.now() - new Date(stateRecord.created_at).getTime();
  if (stateAge > STATE_TTL_MS) {
    // Delete expired state
    await deleteState(config, serviceRoleKey, state);
    logger.logSecurity('oauth_state_expired', { userId: stateRecord.user_id, ageMs: stateAge });
    throw new Error('OAuth state expired. Please try connecting again.');
  }

  // 3. Delete state immediately (one-time use — prevents replay)
  await deleteState(config, serviceRoleKey, state);

  // 4. Exchange authorization code for tokens with PKCE code_verifier
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: googleConfig.clientId,
      client_secret: googleConfig.clientSecret,
      redirect_uri: googleConfig.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: stateRecord.code_verifier
    }).toString()
  });

  if (!tokenRes.ok) {
    const tokenErr = await tokenRes.json().catch(() => ({}));
    logger.error('oauth_token_exchange_failed', {
      userId: stateRecord.user_id,
      error: tokenErr.error || tokenRes.statusText,
      description: tokenErr.error_description
    });
    throw new Error('Failed to exchange authorization code. ' + (tokenErr.error_description || 'Please try again.'));
  }

  const tokenData = await tokenRes.json();

  // 5. Encrypt tokens using AES-256-GCM
  const accessTokenEncrypted = encrypt(tokenData.access_token);
  const refreshTokenEncrypted = tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null;

  // Calculate token expiration
  const tokenExpiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null;

  // 6. Upsert client_connections (one connection per user+provider)
  const connectionData = {
    user_id: stateRecord.user_id,
    provider: 'google',
    access_token_encrypted: accessTokenEncrypted,
    refresh_token_encrypted: refreshTokenEncrypted,
    token_expires_at: tokenExpiresAt,
    scopes: GOOGLE_SCOPES,
    status: 'connected',
    last_error: null,
    updated_at: new Date().toISOString()
  };

  const upsertRes = await fetch(
    `${config.url}/rest/v1/client_connections?on_conflict=user_id,provider`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey,
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify(connectionData)
    }
  );

  if (!upsertRes.ok) {
    const upsertErr = await upsertRes.json().catch(() => ({}));
    logger.error('oauth_connection_upsert_failed', {
      userId: stateRecord.user_id,
      error: upsertErr.message || upsertRes.statusText
    });
    throw new Error('Failed to save connection. Please try again.');
  }

  logger.info('oauth_connection_established', {
    userId: stateRecord.user_id,
    provider: 'google',
    hasRefreshToken: !!tokenData.refresh_token
  });

  return {
    userId: stateRecord.user_id,
    provider: 'google',
    status: 'connected'
  };
}

/**
 * Refresh an access token using the stored refresh token.
 * Retries up to 3 times with exponential backoff (5s, 15s, 45s).
 * Marks connection as expired after all retries fail.
 *
 * @param {string} connectionId - UUID of the client_connections row
 * @returns {Promise<{ accessToken: string, expiresAt: string }>}
 */
async function refreshToken(connectionId) {
  const googleConfig = getGoogleConfig();
  if (!googleConfig) {
    throw new Error('Google OAuth not configured.');
  }

  const { config, serviceRoleKey } = getSupabaseAdmin();

  // Fetch the connection
  const connRes = await fetch(
    `${config.url}/rest/v1/client_connections?id=eq.${encodeURIComponent(connectionId)}&select=*`,
    {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey
      }
    }
  );

  if (!connRes.ok) throw new Error('Failed to fetch connection.');
  const connRows = await connRes.json();
  if (!connRows || connRows.length === 0) throw new Error('Connection not found.');

  const connection = connRows[0];

  if (!connection.refresh_token_encrypted) {
    throw new Error('No refresh token available. User must re-authorize.');
  }

  // Decrypt refresh token
  const refreshTokenValue = decrypt(connection.refresh_token_encrypted);

  // Retry loop with exponential backoff
  let lastError = null;
  for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
    try {
      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: googleConfig.clientId,
          client_secret: googleConfig.clientSecret,
          refresh_token: refreshTokenValue,
          grant_type: 'refresh_token'
        }).toString()
      });

      if (!tokenRes.ok) {
        const errData = await tokenRes.json().catch(() => ({}));
        lastError = new Error(errData.error_description || errData.error || `HTTP ${tokenRes.status}`);

        // If the refresh token is revoked/invalid, don't retry
        if (errData.error === 'invalid_grant') {
          logger.error('oauth_refresh_token_revoked', {
            connectionId,
            userId: connection.user_id
          });
          break;
        }

        logger.warn('oauth_refresh_attempt_failed', {
          connectionId,
          attempt: attempt + 1,
          error: lastError.message
        });

        // Wait before retrying (unless it's the last attempt)
        if (attempt < RETRY_DELAYS.length - 1) {
          await sleep(RETRY_DELAYS[attempt]);
        }
        continue;
      }

      const tokenData = await tokenRes.json();
      const newAccessTokenEncrypted = encrypt(tokenData.access_token);
      const newExpiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;

      // Update connection with new access token
      const updateRes = await fetch(
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
            access_token_encrypted: newAccessTokenEncrypted,
            token_expires_at: newExpiresAt,
            status: 'connected',
            last_error: null,
            updated_at: new Date().toISOString()
          })
        }
      );

      if (!updateRes.ok) {
        logger.error('oauth_refresh_update_failed', { connectionId });
        throw new Error('Failed to update refreshed token.');
      }

      logger.info('oauth_token_refreshed', {
        connectionId,
        userId: connection.user_id,
        attempt: attempt + 1
      });

      return {
        accessToken: tokenData.access_token,
        expiresAt: newExpiresAt
      };
    } catch (e) {
      if (e.message === 'Failed to update refreshed token.') throw e;
      lastError = e;
      logger.warn('oauth_refresh_attempt_error', {
        connectionId,
        attempt: attempt + 1,
        error: e.message
      });
      if (attempt < RETRY_DELAYS.length - 1) {
        await sleep(RETRY_DELAYS[attempt]);
      }
    }
  }

  // All retries failed — mark connection as expired
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
        status: 'expired',
        last_error: lastError ? lastError.message : 'Token refresh failed after 3 attempts',
        updated_at: new Date().toISOString()
      })
    }
  );

  logger.error('oauth_refresh_exhausted', {
    connectionId,
    userId: connection.user_id,
    error: lastError?.message
  });

  throw new Error('Token refresh failed after 3 attempts. Connection marked as expired.');
}

/**
 * Get a valid access token for a connection.
 * Proactively refreshes if token expires within 24 hours.
 *
 * @param {string} connectionId - UUID of the client_connections row
 * @returns {Promise<string>} Decrypted access token
 */
async function getValidToken(connectionId) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  // Fetch the connection
  const connRes = await fetch(
    `${config.url}/rest/v1/client_connections?id=eq.${encodeURIComponent(connectionId)}&select=*`,
    {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey
      }
    }
  );

  if (!connRes.ok) throw new Error('Failed to fetch connection.');
  const connRows = await connRes.json();
  if (!connRows || connRows.length === 0) throw new Error('Connection not found.');

  const connection = connRows[0];

  if (connection.status === 'expired' || connection.status === 'revoked') {
    throw new Error(`Connection is ${connection.status}. User must re-authorize.`);
  }

  if (!connection.access_token_encrypted) {
    throw new Error('No access token available.');
  }

  // Check if token needs proactive refresh (within 24-hour window)
  if (connection.token_expires_at) {
    const expiresAt = new Date(connection.token_expires_at).getTime();
    const now = Date.now();

    if (now >= expiresAt) {
      // Token already expired — must refresh
      logger.info('oauth_token_expired_refreshing', { connectionId });
      const refreshed = await refreshToken(connectionId);
      return refreshed.accessToken;
    }

    if (expiresAt - now < REFRESH_WINDOW_MS) {
      // Token expires within 24 hours — proactive refresh
      logger.info('oauth_proactive_refresh', {
        connectionId,
        expiresInMs: expiresAt - now
      });
      try {
        const refreshed = await refreshToken(connectionId);
        return refreshed.accessToken;
      } catch (e) {
        // Proactive refresh failed — return current token if still valid
        logger.warn('oauth_proactive_refresh_failed', {
          connectionId,
          error: e.message
        });
        if (now < expiresAt) {
          return decrypt(connection.access_token_encrypted);
        }
        throw e;
      }
    }
  }

  // Token is still valid — decrypt and return
  return decrypt(connection.access_token_encrypted);
}

/**
 * Clean up expired OAuth states (older than 10 minutes).
 *
 * @returns {Promise<number>} Number of deleted states
 */
async function cleanupExpiredStates() {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  const cutoff = new Date(Date.now() - STATE_TTL_MS).toISOString();

  const res = await fetch(
    `${config.url}/rest/v1/oauth_states?created_at=lt.${cutoff}`,
    {
      method: 'DELETE',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey,
        'Prefer': 'return=representation'
      }
    }
  );

  if (!res.ok) {
    logger.warn('oauth_cleanup_failed', { error: res.statusText });
    return 0;
  }

  const deleted = await res.json().catch(() => []);
  const count = Array.isArray(deleted) ? deleted.length : 0;

  if (count > 0) {
    logger.info('oauth_states_cleaned', { count });
  }

  return count;
}

/**
 * List connections for a user (without token fields).
 *
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of connection objects (no tokens)
 */
async function listConnections(userId) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  const res = await fetch(
    `${config.url}/rest/v1/client_connections?user_id=eq.${encodeURIComponent(userId)}&select=id,user_id,provider,provider_account_id,token_expires_at,scopes,gsc_property,ga4_property_id,status,last_sync_at,last_error,sync_count,metadata,created_at,updated_at`,
    {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey
      }
    }
  );

  if (!res.ok) return [];
  return res.json();
}

/**
 * Get per-provider health/status summary for a user.
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Provider health map
 */
async function getConnectionsStatus(userId) {
  const connections = await listConnections(userId);

  const providers = ['google', 'semrush', 'ahrefs'];
  const status = {};

  for (const provider of providers) {
    const conn = connections.find(c => c.provider === provider);
    if (!conn) {
      status[provider] = {
        connected: false,
        status: 'not_connected'
      };
    } else {
      const isTokenExpired = conn.token_expires_at
        ? new Date(conn.token_expires_at).getTime() < Date.now()
        : false;

      status[provider] = {
        connected: conn.status === 'connected',
        status: conn.status,
        token_expires_at: conn.token_expires_at,
        token_expired: isTokenExpired,
        needs_refresh: conn.token_expires_at
          ? (new Date(conn.token_expires_at).getTime() - Date.now()) < REFRESH_WINDOW_MS
          : false,
        last_sync_at: conn.last_sync_at,
        last_error: conn.last_error,
        sync_count: conn.sync_count,
        gsc_property: conn.gsc_property,
        ga4_property_id: conn.ga4_property_id,
        connected_at: conn.created_at
      };
    }
  }

  return status;
}

// ── Helper Functions ──────────────────────────────────────────

/**
 * Delete an OAuth state record.
 */
async function deleteState(config, serviceRoleKey, state) {
  await fetch(
    `${config.url}/rest/v1/oauth_states?state=eq.${encodeURIComponent(state)}`,
    {
      method: 'DELETE',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey,
        'Prefer': 'return=minimal'
      }
    }
  );
}

/**
 * Async sleep utility.
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Exports ──────────────────────────────────────────────────

module.exports = {
  validateConfigOnStartup,
  generateAuthUrl,
  handleCallback,
  refreshToken,
  getValidToken,
  cleanupExpiredStates,
  listConnections,
  getConnectionsStatus,
  // Exported for testing
  getGoogleConfig,
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  base64url,
  GOOGLE_SCOPES,
  STATE_TTL_MS,
  REFRESH_WINDOW_MS,
  RETRY_DELAYS
};
