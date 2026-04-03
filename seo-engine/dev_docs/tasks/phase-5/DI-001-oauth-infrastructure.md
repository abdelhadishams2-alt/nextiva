# DI-001: Google OAuth2 Infrastructure

> **Phase:** 5 | **Priority:** P0 | **Status:** NOT STARTED
> **Effort:** XL (16h) | **Type:** feature
> **Sprint:** 1 (Weeks 1-2)
> **Depends On:** SEC-001 (KeyManager for AES-256-GCM encryption)
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `dev_docs/specs/database/unified-schema.md` — Section 3.1 (client_connections DDL) + Section 3.2 (oauth_states DDL)
3. `bridge/server.js` — existing endpoint registration pattern, auth middleware, rate limiter
4. `bridge/key-manager.js` — AES-256-GCM encrypt/decrypt used for API key storage
5. `bridge/supabase-client.js` — Supabase client, admin operations, RPC calls
6. `supabase-setup.sql` — existing schema reference (PROTECTED)
7. `dev_docs/tribunal/08-roadmap/phase-a-sprint-plan.md` — Sprint 2 Day-1 Action (OAuth end-to-end)
8. `dev_docs/tribunal/10-deliverables/phase-a-backlog.md` — Story #10 (OAuth acceptance criteria)

## Objective
Build the complete Google OAuth2 flow for connecting client Google accounts (GSC + GA4). Create the `client_connections` and `oauth_states` database tables with RLS policies via migration 007, implement PKCE-based token exchange with CSRF state protection, proactive token refresh with a 24-hour window, and expose four API endpoints for the connection lifecycle. All tokens must be encrypted at rest using the existing KeyManager AES-256-GCM pattern. This is the gateway to all Google data ingestion -- without it, GSC and GA4 connectors cannot authenticate.

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `bridge/oauth.js` | Google OAuth2 module: auth URL generation with PKCE + state, callback handler, token exchange, proactive refresh logic |
| CREATE | `migrations/007-client-connections.sql` | client_connections table, oauth_states table, ingestion_jobs table, api_cache table, RLS policies, indexes — full DDL from unified-schema.md |
| MODIFY | `bridge/server.js` | Register 4 new endpoints under `/api/connections/*` in routes/connections.js |
| MODIFY | `.env.example` | Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI |

## Sub-tasks

### Sub-task 1: Create migration 007 — client_connections + oauth_states (~3h)
- Create `migrations/007-client-connections.sql` with **exact DDL from unified-schema.md Section 3.1-3.2 and 3.7-3.8**:
- **client_connections table:**
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
  - `provider TEXT NOT NULL CHECK (provider IN ('google', 'semrush', 'ahrefs'))`
  - `provider_account_id TEXT`
  - `access_token_encrypted TEXT`
  - `refresh_token_encrypted TEXT`
  - `token_expires_at TIMESTAMPTZ`
  - `scopes TEXT[]`
  - `gsc_property TEXT`
  - `ga4_property_id TEXT`
  - `status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'error', 'revoked', 'expired'))`
  - `last_sync_at TIMESTAMPTZ`
  - `last_error TEXT`
  - `sync_count INTEGER NOT NULL DEFAULT 0 CHECK (sync_count >= 0)`
  - `metadata JSONB NOT NULL DEFAULT '{}'::jsonb`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - `UNIQUE (user_id, provider)`
  - Index: `idx_connections_user_provider ON client_connections (user_id, provider)`
  - Partial index: `idx_connections_status ON client_connections (status) WHERE status != 'connected'`
  - RLS: SELECT, INSERT, UPDATE, DELETE policies all matching `auth.uid() = user_id`
  - Trigger: `trg_client_connections_updated_at` using `update_updated_at()` function
- **oauth_states table** (no RLS -- service_role access only):
  - `state TEXT PRIMARY KEY`
  - `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
  - `code_verifier TEXT NOT NULL` (for PKCE)
  - `provider TEXT NOT NULL CHECK (provider IN ('google'))`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - Index: `idx_oauth_states_created ON oauth_states (created_at)` for cleanup queries
  - Cleanup: document `DELETE FROM oauth_states WHERE created_at < now() - interval '10 minutes'`
- **ingestion_jobs table** (from unified-schema.md Section 3.7):
  - Full DDL with status checks, trigger_type, attempt tracking (1-3), rows_processed
  - RLS: users read own jobs only
- **api_cache table** (from unified-schema.md Section 3.8):
  - cache_key (unique), provider, response_data JSONB, expires_at
  - No RLS -- shared cache via service_role
- Include `update_updated_at()` trigger function if not already created by prior migrations
- Run migration against clean Supabase database and verify all tables, policies, and indexes exist

### Sub-task 2: Build OAuth module — auth URL generation with PKCE (`bridge/oauth.js`) (~4h)
- Read `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` from `process.env` with startup validation
- **`generateAuthUrl(userId)`** — Build Google OAuth2 authorization URL with PKCE:
  - Generate `code_verifier`: 64 random bytes via `crypto.randomBytes(64).toString('base64url')`
  - Compute `code_challenge`: `crypto.createHash('sha256').update(code_verifier).digest('base64url')`
  - Generate `state`: `crypto.randomBytes(32).toString('hex')`
  - Store `{ state, user_id, code_verifier, provider: 'google' }` in `oauth_states` table via Supabase service_role client (NOT in-memory -- persists across server restarts)
  - Build authorization URL:
    ```
    https://accounts.google.com/o/oauth2/v2/auth?
      client_id={GOOGLE_CLIENT_ID}
      &redirect_uri={GOOGLE_REDIRECT_URI}
      &response_type=code
      &scope=https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly
      &access_type=offline
      &prompt=consent
      &state={state}
      &code_challenge={code_challenge}
      &code_challenge_method=S256
    ```
  - Return `{ authUrl, state }` to frontend
- **CSRF protection via state parameter:**
  - State is a cryptographically random value stored in `oauth_states` with 10-minute TTL
  - On callback, validate state exists in `oauth_states` table and has not expired
  - Delete state record immediately after validation (one-time use)
  - Reject callbacks with missing, expired, or already-consumed state values

### Sub-task 3: Build OAuth module — callback handler and token exchange (~3h)
- **`handleCallback(code, state)`** — Process the OAuth callback:
  - Validate `state`: query `oauth_states` for matching state, verify `created_at` within 10 minutes
  - Retrieve `code_verifier` and `user_id` from the state record
  - Delete the state record immediately (prevent replay)
  - Exchange authorization code for tokens via `POST https://oauth2.googleapis.com/token`:
    ```
    client_id={GOOGLE_CLIENT_ID}
    &client_secret={GOOGLE_CLIENT_SECRET}
    &code={code}
    &code_verifier={code_verifier}
    &grant_type=authorization_code
    &redirect_uri={GOOGLE_REDIRECT_URI}
    ```
  - Parse response: `access_token`, `refresh_token`, `expires_in`, `scope`
  - Encrypt both tokens using `KeyManager.encrypt()` (AES-256-GCM)
  - Upsert `client_connections` row via Supabase service_role:
    - `provider: 'google'`
    - `access_token_encrypted`, `refresh_token_encrypted`
    - `token_expires_at: new Date(Date.now() + expires_in * 1000)`
    - `scopes: scope.split(' ')`
    - `status: 'connected'`
  - Return success redirect URL: `${DASHBOARD_URL}/settings/connections?connected=google`
  - On failure: redirect with `?error=oauth_failed&reason={encoded_error}`

### Sub-task 4: Build OAuth module — proactive token refresh (~3h)
- **`refreshToken(connectionId)`** — Refresh an expired access token:
  - Load connection row from Supabase via service_role
  - Decrypt `refresh_token_encrypted` using `KeyManager.decrypt()`
  - POST to `https://oauth2.googleapis.com/token` with `grant_type=refresh_token`
  - Encrypt new access token, update row with new `access_token_encrypted` and `token_expires_at`
  - Increment `sync_count`
  - If refresh fails (400/401): set `status: 'expired'`, store error in `last_error`
  - **Retry logic:** 3 attempts with exponential backoff (5s, 15s, 45s). After 3 failures, mark as expired.
- **`getValidToken(connectionId)`** — Get a usable access token with proactive refresh:
  - Load connection, check `token_expires_at`
  - **24-hour proactive window:** if `token_expires_at` is within 24 hours of now, trigger `refreshToken()` proactively (Google tokens expire in 1 hour, so this ensures we always have a fresh token ready for scheduled pulls)
  - If token is already expired, call `refreshToken()` before returning
  - Decrypt and return access token
  - Token is never cached in memory beyond the request lifecycle (security: minimize exposure window)
- **Cleanup job:** Schedule periodic cleanup of `oauth_states` rows older than 10 minutes:
  - `DELETE FROM oauth_states WHERE created_at < now() - interval '10 minutes'`
  - Run every 5 minutes via the scheduler (DI-005) or on each auth URL generation

### Sub-task 5: Register API endpoints in bridge server (~3h)
- **`GET /api/connections/google/auth`** — Authenticated. Calls `generateAuthUrl(user.id)`. Returns `{ success: true, data: { authUrl: "https://accounts.google.com/..." } }`
- **`GET /api/connections/google/callback`** — Public (state-validated, NOT auth-protected since user is returning from Google). Parses `code` and `state` from query params. Calls `handleCallback()`. On success: redirects to `${DASHBOARD_URL}/settings/connections?connected=google`. On failure: redirects with `?error=oauth_failed`.
- **`GET /api/connections`** — Authenticated. Lists all connections for user. Query Supabase `client_connections` where `user_id = user.id`. Return connection objects WITHOUT token fields (only `id`, `provider`, `status`, `gsc_property`, `ga4_property_id`, `last_sync_at`, `last_error`, `scopes`, `sync_count`, `created_at`). NEVER include `access_token_encrypted` or `refresh_token_encrypted` in any API response.
- **`GET /api/connections/status`** — Authenticated. Returns health summary: `{ google: { status, last_sync_at, last_error, scopes, connected_at } }`. Used by dashboard status indicators and freshness banner.
- Follow existing `bridge/server.js` endpoint patterns: `verifyAuth(req)`, `sendJSON(res, data)`, `sendError(res, code, msg)`
- Add rate limiting to all four endpoints (same bucket as general rate limiter)
- Add structured logging: `oauth.auth_started`, `oauth.callback_received`, `oauth.token_exchanged`, `oauth.token_refreshed`, `oauth.token_refresh_failed`

### Sub-task 6: Environment and security hardening (~1h)
- Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` to `.env.example` with documentation
- Add startup validation in `bridge/oauth.js`: if env vars are missing, log warning but do not crash server (OAuth is optional until user tries to connect)
- Ensure callback endpoint validates `state` to prevent CSRF attacks
- Ensure `/api/connections` response NEVER includes raw or encrypted tokens
- Token decryption happens only at moment of API call, never persisted in plaintext
- Verify `GOOGLE_REDIRECT_URI` matches the registered redirect URI in Google Cloud Console

## Acceptance Criteria
- [ ] `migrations/007-client-connections.sql` creates client_connections table with all columns matching unified-schema.md Section 3.1
- [ ] Migration creates oauth_states table with PKCE code_verifier column matching Section 3.2
- [ ] Migration creates ingestion_jobs and api_cache tables matching Sections 3.7-3.8
- [ ] All four tables have correct RLS policies, indexes, and triggers
- [ ] `GET /api/connections/google/auth` returns a valid Google OAuth authorization URL with PKCE challenge
- [ ] Authorization URL includes `code_challenge` and `code_challenge_method=S256` parameters
- [ ] State parameter stored in `oauth_states` table (not in-memory) with 10-minute TTL
- [ ] `GET /api/connections/google/callback` exchanges code with `code_verifier` for tokens
- [ ] OAuth state validated on callback: missing, expired, or replayed states rejected
- [ ] Tokens are encrypted with AES-256-GCM using existing KeyManager before database storage
- [ ] `refreshToken()` proactively refreshes tokens within 24-hour window before expiry
- [ ] Failed refresh (3 retries with exponential backoff) marks connection as `expired` with descriptive `last_error`
- [ ] `GET /api/connections` returns connection list WITHOUT any token data
- [ ] `GET /api/connections/status` returns per-provider health summary
- [ ] All endpoints follow existing bridge server patterns (auth middleware, JSON responses, rate limiting)
- [ ] Environment variables documented in `.env.example`
- [ ] Zero npm dependencies added -- uses native `fetch` and `node:crypto`
- [ ] Structured logging for all OAuth events

## Test Requirements

### Unit Tests
- `generateAuthUrl()` produces valid URL with correct scopes, PKCE challenge, and access_type=offline
- PKCE: `code_verifier` is 64 bytes base64url, `code_challenge` is SHA-256 of verifier
- `handleCallback()` rejects invalid state (not in oauth_states, expired >10min, already consumed)
- `handleCallback()` exchanges code with correct `code_verifier` parameter
- `handleCallback()` encrypts tokens before storage (verify KeyManager.encrypt called with both access and refresh tokens)
- `refreshToken()` updates access_token_encrypted and token_expires_at on success
- `refreshToken()` retries 3 times with exponential backoff on failure
- `refreshToken()` sets status='expired' after 3 failed retries
- `getValidToken()` refreshes proactively if within 24-hour expiry window
- `getValidToken()` returns cached token if still valid and outside refresh window
- State cleanup removes oauth_states rows older than 10 minutes

### Integration Tests
- Full OAuth flow with mocked Google token endpoint: auth URL -> callback -> token storage -> list connections
- Connection status endpoint returns correct summary after connections are created
- Callback with invalid state returns error redirect (not 500)
- Callback with expired state (>10 min old) returns error redirect
- Token fields are never present in any API response (scan all response bodies)
- Rate limiting active on all four endpoints

## Dependencies
- Blocked by: SEC-001 (KeyManager must be working for token encryption)
- Blocks: DI-002 (GSC connector needs `getValidToken`), DI-003 (GA4 connector needs `getValidToken`), DI-006 (dashboard connections page needs connection list API)
