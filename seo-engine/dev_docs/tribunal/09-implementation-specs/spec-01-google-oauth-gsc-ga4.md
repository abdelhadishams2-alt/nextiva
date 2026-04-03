# Spec 01: Google OAuth2 + GSC + GA4 Connectors

**Priority:** Must Have (MoSCoW #1, #2, #3)
**Phase:** A (Weeks 1-6)
**Effort:** L (2-4 weeks combined)
**Dependencies:** None (this IS the critical path -- everything else depends on it)
**Blocks:** Decay Detection (#11), Gap Analyzer (#12), Topic Recommender (#14), Feedback Loop (#71-74), Scheduler (#8)

---

## 1. Feature Overview

This spec covers the complete data pipeline from Google account connection to stored performance metrics. It is the single highest-priority feature in the ChainIQ platform expansion -- without Google data flowing into the system, Layers 2 through 6 have nothing to analyze.

The implementation spans four modules:

1. **`bridge/oauth.js`** -- Google OAuth 2.0 Authorization Code flow with PKCE. Handles auth URL generation, callback processing, token exchange, encrypted storage, and automatic refresh. Reuses the existing `KeyManager` (AES-256-GCM) for token encryption at rest.

2. **`bridge/ingestion/gsc.js`** -- Google Search Console Search Analytics API client. Pulls clicks, impressions, CTR, and average position per page and per query. Supports date ranges, dimension grouping (page, query, country, device), and pagination for sites with 10K+ pages.

3. **`bridge/ingestion/ga4.js`** -- Google Analytics 4 Data API (v1beta) client. Pulls sessions, engaged sessions, engagement rate, average engagement time, scroll depth (percent_scrolled event), and bounce rate per page path. Supports date ranges and dimension filters.

4. **`migrations/007-client-connections.sql`** -- New Supabase table for storing encrypted OAuth tokens, connection metadata, and status tracking. RLS policies enforce user-level isolation. Indexes optimize status queries.

The bridge server exposes four new endpoints under `/api/connections/` for the dashboard to consume. The flow is: user clicks "Connect Google" in the dashboard, is redirected to Google consent screen, returns to the callback URL, tokens are encrypted and stored, and scheduled pulls begin automatically.

**Zero-dependency constraint:** The entire OAuth flow, API clients, and token encryption use only Node.js built-ins (`crypto`, `url`, native `fetch`). No npm packages required.

---

## 2. User Stories

**US-01: Connect Google Account**
As a publisher, I want to connect my Google account via OAuth so that ChainIQ can access my Search Console and Analytics data without me sharing passwords.

**US-02: View Connection Status**
As a publisher, I want to see the status of my Google connection (connected, expired, error) on the connections page so that I know if data is flowing.

**US-03: Revoke Google Connection**
As a publisher, I want to disconnect my Google account at any time so that ChainIQ stops accessing my data and deletes stored tokens.

**US-04: Automatic Token Refresh**
As a system, I need to automatically refresh expired Google access tokens using the stored refresh token so that scheduled data pulls never fail silently due to token expiry.

**US-05: Pull GSC Performance Data**
As a publisher, I want ChainIQ to pull my Search Console data (clicks, impressions, CTR, position) per page and per query so that the intelligence layer can detect decay and gaps.

**US-06: Pull GA4 Engagement Data**
As a publisher, I want ChainIQ to pull my GA4 engagement metrics (sessions, engagement rate, scroll depth) per page so that I can see how users interact with my content beyond just search visibility.

**US-07: Select GSC Property**
As a publisher who owns multiple websites, I want to select which GSC property to connect so that ChainIQ analyzes the correct site.

**US-08: Handle OAuth Errors Gracefully**
As a publisher, I want clear error messages if the Google connection fails (consent denied, invalid scope, network error) so that I know what to fix.

---

## 3. Acceptance Criteria

**AC-01:** Clicking "Connect Google" generates a valid Google OAuth 2.0 authorization URL with PKCE (`code_challenge_method=S256`), `access_type=offline`, and scopes for `webmasters.readonly` and `analytics.readonly`.

**AC-02:** The callback endpoint exchanges the authorization code for access and refresh tokens within 10 seconds.

**AC-03:** Both `access_token` and `refresh_token` are encrypted with AES-256-GCM (via KeyManager) before storage. Plaintext tokens never touch the database or disk.

**AC-04:** The `client_connections` table stores: `user_id`, `provider` ("google"), `provider_account_id` (Google email), `access_token_encrypted`, `refresh_token_encrypted`, `token_expires_at`, `scopes`, `gsc_property`, `status`, `created_at`, `updated_at`.

**AC-05:** RLS policy enforces `auth.uid() = user_id` for all operations. A user cannot read, update, or delete another user's connection.

**AC-06:** Token refresh occurs automatically when `token_expires_at` is within 5 minutes of current time. The refreshed token is re-encrypted and stored.

**AC-07:** If a refresh token is revoked by Google (HTTP 400 with `invalid_grant`), the connection status is set to `REVOKED` and the user is notified on the connections page.

**AC-08:** GSC client pulls Search Analytics data with dimensions `[page, query]` for the last 90 days. Response includes `clicks`, `impressions`, `ctr`, `position` per row. Pagination handles sites with 25K+ row responses (API limit is 25,000 per request).

**AC-09:** GA4 client pulls reporting data with dimensions `[pagePath]` and metrics `[sessions, engagedSessions, engagementRate, averageSessionDuration, screenPageViews]` for the last 90 days.

**AC-10:** `GET /api/connections` returns all connections for the authenticated user with status, provider, connected email, and last sync timestamp. Encrypted tokens are never included in the response.

**AC-11:** `DELETE /api/connections/:id` removes the connection record and all associated encrypted tokens. Google token revocation endpoint is called to invalidate tokens on Google's side.

**AC-12:** `GET /api/connections/status` returns a health check for each active connection: last successful pull, last error, token expiry status, and data freshness (hours since last pull).

**AC-13:** All OAuth state parameters use `crypto.randomBytes(32)` to prevent CSRF attacks. State is validated on callback.

**AC-14:** The PKCE `code_verifier` is stored server-side (in-memory or database) during the OAuth flow and never exposed to the client.

---

## 4. UI/UX Description

The connections page is accessible from the dashboard sidebar under "Data Sources" or "Connections." It is a single page with a card-based layout showing each available data source.

### ASCII Wireframe -- Connections Page

```text
+------------------------------------------------------------------+
|  ChainIQ Dashboard                        [User] [Settings]      |
+----------+-------------------------------------------------------+
| Sidebar  |  DATA CONNECTIONS                                     |
|          |                                                        |
| Overview |  Connect your data sources to power intelligence.     |
| Articles |                                                        |
| >Connect |  +-------------------------+  +---------------------+ |
| Inventory|  | [G] Google              |  | [S] Semrush         | |
| Intel    |  |                         |  |                     | |
| Quality  |  | Status: CONNECTED       |  | Status: NOT SET UP  | |
| Publish  |  | user@gmail.com          |  |                     | |
| Perform  |  | GSC: bmwtuning.com      |  | [Enter API Key]     | |
|          |  | GA4: Property 38291...  |  |                     | |
|          |  | Last sync: 2h ago       |  +---------------------+ |
|          |  |                         |                          |
|          |  | [Sync Now] [Disconnect] |  +---------------------+ |
|          |  +-------------------------+  | [A] Ahrefs          | |
|          |                               |                     | |
|          |  Sync History                 | Status: NOT SET UP  | |
|          |  +-------------------------+  |                     | |
|          |  | 2026-03-28 03:00  OK    |  | [Enter API Key]     | |
|          |  | 2026-03-27 03:00  OK    |  +---------------------+ |
|          |  | 2026-03-26 03:00  WARN  |                          |
|          |  | (GA4 quota exceeded)    |                          |
|          |  +-------------------------+                          |
+----------+-------------------------------------------------------+
```

### OAuth Flow States

1. **NOT_CONNECTED** -- Shows "Connect Google" button with Google branding. Brief description of what data will be accessed.
2. **CONNECTING** -- Spinner while redirect to Google consent screen occurs. User leaves the page.
3. **CALLBACK_PROCESSING** -- After redirect back, brief "Connecting..." state while tokens are exchanged.
4. **PROPERTY_SELECT** -- Modal showing available GSC properties. User picks one. GA4 property auto-detected or selected.
5. **CONNECTED** -- Green status badge. Shows connected email, selected properties, last sync time.
6. **ERROR** -- Red status badge with error message and "Retry" button.
7. **REVOKED** -- Orange status badge. "Your access was revoked. Please reconnect."

### Mobile Considerations

Cards stack vertically on screens below 768px. The property selection modal is full-screen on mobile. The "Connect Google" button is touch-target compliant (minimum 44x44px).

---

## 5. Database Changes

### Migration: `migrations/007-client-connections.sql`

```sql
-- Client OAuth connections (Google, Semrush, Ahrefs)
CREATE TABLE client_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'semrush', 'ahrefs')),
  provider_account_id TEXT,                    -- Google email or API key hint
  access_token_encrypted TEXT,                 -- AES-256-GCM via KeyManager
  refresh_token_encrypted TEXT,                -- AES-256-GCM via KeyManager
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],                               -- Array of granted scopes
  gsc_property TEXT,                           -- Selected GSC property URL
  ga4_property_id TEXT,                        -- Selected GA4 property ID
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'connected', 'error', 'revoked', 'expired')),
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)                   -- One connection per provider per user
);

-- RLS: Users can only access their own connections
ALTER TABLE client_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own connections"
  ON client_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own connections"
  ON client_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own connections"
  ON client_connections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own connections"
  ON client_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_connections_user_provider
  ON client_connections (user_id, provider);
CREATE INDEX idx_connections_status
  ON client_connections (status) WHERE status != 'connected';

-- OAuth state storage (short-lived, for CSRF protection)
CREATE TABLE oauth_states (
  state TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_verifier TEXT NOT NULL,                 -- PKCE verifier (server-side only)
  provider TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-expire OAuth states older than 10 minutes
CREATE INDEX idx_oauth_states_created
  ON oauth_states (created_at);
```

### Cleanup Job

A scheduled function or bridge-side cleanup deletes `oauth_states` rows older than 10 minutes. This prevents table bloat from abandoned OAuth flows.

### Updated `updated_at` Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_connections_updated_at
  BEFORE UPDATE ON client_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 6. API/Backend Changes

### New Module: `bridge/oauth.js`

Exports a class `GoogleOAuth` with the following methods:

| Method | Description |
|--------|-------------|
| `generateAuthUrl(userId)` | Builds Google OAuth URL with PKCE. Stores `state` + `code_verifier` in `oauth_states` table. Returns the redirect URL. |
| `handleCallback(code, state)` | Validates state against `oauth_states`. Exchanges code for tokens via `POST https://oauth2.googleapis.com/token`. Encrypts tokens via `KeyManager.encrypt()`. Stores in `client_connections`. Deletes the `oauth_states` row. |
| `refreshToken(connectionId)` | Reads encrypted refresh token, decrypts, calls Google token endpoint with `grant_type=refresh_token`. Re-encrypts new access token. Updates `token_expires_at`. |
| `getValidAccessToken(connectionId)` | Returns a decrypted access token. If expired or expiring within 5 minutes, calls `refreshToken()` first. This is the method all API clients call. |
| `revokeConnection(connectionId, userId)` | Calls `https://oauth2.googleapis.com/revoke?token=...` to invalidate on Google's side. Deletes the `client_connections` row. |
| `listProperties(accessToken)` | Calls GSC Sites API (`GET https://www.googleapis.com/webmasters/v3/sites`) and GA4 Admin API (`GET https://analyticsadmin.googleapis.com/v1beta/accountSummaries`) to list available properties. |

**Environment variables required:**

- `GOOGLE_CLIENT_ID` -- OAuth client ID from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` -- OAuth client secret
- `GOOGLE_REDIRECT_URI` -- Callback URL (e.g., `https://app.chainiq.io/api/connections/google/callback`)

**PKCE implementation (zero-dep):**

```javascript
const crypto = require('crypto');

function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}
```

### New Module: `bridge/ingestion/gsc.js`

Exports a class `GSCClient` with methods:

| Method | Signature | Description |
|--------|-----------|-------------|
| `fetchSearchAnalytics` | `(accessToken, siteUrl, startDate, endDate, dimensions)` | Calls `POST https://www.googleapis.com/webmasters/v3/sites/{siteUrl}/searchAnalytics/query`. Handles pagination via `startRow` (25K row limit per request). Returns aggregated array of `{ page, query, clicks, impressions, ctr, position }`. |
| `fetchPageMetrics` | `(accessToken, siteUrl, startDate, endDate)` | Convenience wrapper: `dimensions=['page']`. Returns per-page totals. |
| `fetchQueryMetrics` | `(accessToken, siteUrl, startDate, endDate)` | Convenience wrapper: `dimensions=['query']`. Returns per-query totals. |
| `fetchPageQueryMatrix` | `(accessToken, siteUrl, startDate, endDate)` | Dimensions `['page', 'query']`. The full matrix needed for cannibalization detection. |

**Pagination strategy:** GSC limits responses to 25,000 rows. For large sites, the client loops with incrementing `startRow` until `rows.length < rowLimit`. Each request respects a 200ms delay to stay within Google's QPS limits (1,200 queries/100 seconds).

**Date handling:** All dates are `YYYY-MM-DD` strings. The client defaults to the last 90 days if no range is specified. GSC data has a 2-3 day delay; the client automatically adjusts `endDate` to 3 days ago.

### New Module: `bridge/ingestion/ga4.js`

Exports a class `GA4Client` with methods:

| Method | Signature | Description |
|--------|-----------|-------------|
| `runReport` | `(accessToken, propertyId, dateRanges, dimensions, metrics)` | Calls `POST https://analyticsdata.googleapis.com/v1beta/properties/{propertyId}:runReport`. Handles pagination via `offset` (100K row limit per request). |
| `fetchPageEngagement` | `(accessToken, propertyId, startDate, endDate)` | Convenience wrapper returning per-page: sessions, engaged sessions, engagement rate, average session duration, screen page views. |
| `fetchScrollDepth` | `(accessToken, propertyId, startDate, endDate)` | Fetches `percent_scrolled` event data per page. Requires GA4 enhanced measurement to be enabled. Returns average scroll depth percentage. |

**Quota management:** GA4 Data API has a quota of 10,000 tokens per day per property. Each `runReport` costs 1-10 tokens depending on complexity. The client tracks token usage and stops pulling if 80% of the daily quota is consumed, resuming the next day.

### New Endpoints in `bridge/routes/connections.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/connections/google/auth` | User | Generates OAuth URL, redirects browser |
| `GET` | `/api/connections/google/callback` | None (state-validated) | Handles Google redirect, exchanges code, stores tokens, redirects to dashboard |
| `GET` | `/api/connections` | User | Lists all connections for the user (no tokens in response) |
| `GET` | `/api/connections/status` | User | Health check: last sync, errors, token freshness |
| `DELETE` | `/api/connections/:id` | User | Revokes and deletes a connection |
| `POST` | `/api/connections/:id/sync` | User | Triggers an immediate data pull for a connection |
| `POST` | `/api/connections/:id/property` | User | Sets the GSC property and GA4 property for a connection |

---

## 7. Frontend Components

All components use Next.js 16 + shadcn/ui (base-ui variant). Located in `dashboard/app/connections/`.

| Component | File | Description |
|-----------|------|-------------|
| `ConnectionsPage` | `page.tsx` | Main page layout. Fetches connections via `GET /api/connections`. Renders provider cards. |
| `GoogleConnectionCard` | `components/google-card.tsx` | Card showing Google connection status. "Connect" button triggers `GET /api/connections/google/auth`. Shows email, properties, last sync when connected. |
| `SemrushConnectionCard` | `components/semrush-card.tsx` | API key input card. Validates key format before saving. |
| `AhrefsConnectionCard` | `components/ahrefs-card.tsx` | API key input card. Same pattern as Semrush. |
| `PropertySelectDialog` | `components/property-select.tsx` | shadcn Dialog listing GSC properties and GA4 properties. User selects one of each. Called after successful OAuth callback. |
| `SyncHistoryTable` | `components/sync-history.tsx` | Table showing last 20 sync events with timestamp, status, row count, and errors. |
| `ConnectionStatusBadge` | `components/status-badge.tsx` | Reusable badge component: green (connected), red (error), orange (revoked), gray (not connected). |

### State Management

The connections page uses React Server Components for initial data fetch and client components for interactive elements (connect button, property dialog). No global state library -- connections data is fetched per-page and passed as props.

---

## 8. Test Plan

All tests use `node:test` runner. Located in `tests/connections/`.

### Unit Tests (`tests/connections/oauth.test.js`)

| # | Test | What It Verifies |
|---|------|------------------|
| 1 | `generateAuthUrl` returns valid URL | URL contains correct client_id, redirect_uri, scope, code_challenge, state |
| 2 | `generateCodeChallenge` matches known vector | SHA-256 of known verifier produces expected base64url challenge |
| 3 | State parameter is cryptographically random | Two consecutive calls produce different states (32 bytes entropy) |
| 4 | `handleCallback` rejects invalid state | Returns error when state does not match any stored oauth_state |
| 5 | `handleCallback` rejects expired state | States older than 10 minutes are rejected |
| 6 | Token encryption round-trip | `encrypt(token)` then `decrypt(encrypted)` returns original token |
| 7 | Encrypted token format | Output matches `iv:authTag:ciphertext` pattern (hex:hex:hex) |
| 8 | `refreshToken` updates `token_expires_at` | After refresh, expiry is in the future |
| 9 | `getValidAccessToken` triggers refresh when near-expiry | Token expiring in < 5 minutes triggers refresh call |
| 10 | `revokeConnection` deletes all token data | After revoke, no token data exists in the table for that connection |

### Integration Tests (`tests/connections/gsc-integration.test.js`)

| # | Test | What It Verifies |
|---|------|------------------|
| 11 | GSC pagination for large sites | Mock API returning 25K rows triggers second request with `startRow=25000` |
| 12 | GSC date range defaults | No dates specified results in last 90 days minus 3-day delay |
| 13 | GA4 quota tracking | After consuming 80% tokens, client pauses and returns partial data with warning |
| 14 | GA4 scroll depth extraction | `percent_scrolled` event data is correctly averaged per page |

### Endpoint Tests (`tests/connections/api.test.js`)

| # | Test | What It Verifies |
|---|------|------------------|
| 15 | `GET /api/connections` requires auth | Returns 401 without Bearer token |
| 16 | `GET /api/connections` never leaks tokens | Response body does not contain `access_token` or `refresh_token` fields |
| 17 | `DELETE /api/connections/:id` enforces ownership | User A cannot delete User B's connection (returns 404, not 403) |
| 18 | `GET /api/connections/google/callback` rejects missing code | Returns 400 with descriptive error |
| 19 | `POST /api/connections/:id/sync` rate limited | More than 5 syncs per hour returns 429 |

### Security Tests (`tests/connections/security.test.js`)

| # | Test | What It Verifies |
|---|------|------------------|
| 20 | CSRF protection via state parameter | Callback with forged state is rejected |
| 21 | PKCE verifier never in response | No endpoint returns the code_verifier |
| 22 | Token values never in logs | Structured log output from OAuth flow contains no plaintext tokens |

---

## 9. Rollout Plan

### Phase 1: OAuth Foundation (Week 1-2)

1. Submit Google OAuth consent screen verification on Day 1 (2-6 week approval timeline)
2. Implement `bridge/oauth.js` with full PKCE flow
3. Run `migrations/007-client-connections.sql` on Supabase
4. Implement `/api/connections/google/auth` and `/api/connections/google/callback`
5. Implement `ConnectionsPage` with Google card (connect/disconnect only)
6. Test with Google's test user allowlist (100 users during verification)

### Phase 2: GSC Client (Week 2-3)

1. Implement `bridge/ingestion/gsc.js` with pagination
2. Add `fetchPageMetrics` and `fetchQueryMetrics` convenience methods
3. Store raw GSC data in `performance_snapshots` (see spec-03 migration dependency)
4. Add "Sync Now" button to Google card
5. Verify with real GSC data from a test property

### Phase 3: GA4 Client (Week 3-4)

1. Implement `bridge/ingestion/ga4.js` with quota tracking
2. Add scroll depth extraction via enhanced measurement events
3. Store GA4 data alongside GSC data in performance snapshots
4. Add GA4 property selection to PropertySelectDialog

### Phase 4: Polish and Monitoring (Week 4)

1. Implement sync history table
2. Add connection health status endpoint
3. Add automatic token refresh in scheduler (ties into spec for scheduler, feature #8)
4. Error alerting: log structured events for failed syncs
5. Run full test suite, aim for 22/22 passing

### Feature Flags

- `ENABLE_GOOGLE_OAUTH=true/false` -- Master kill switch for the entire OAuth flow
- `GSC_MAX_ROWS_PER_SYNC=100000` -- Safety limit for initial rollout (default 100K, raise per client)
- `GA4_QUOTA_THRESHOLD=0.8` -- Fraction of daily quota before pausing (default 80%)

### Rollback Strategy

If OAuth flow causes issues in production:
1. Set `ENABLE_GOOGLE_OAUTH=false` to disable new connections
2. Existing connections continue to work (refresh tokens remain valid for 6 months)
3. Revert dashboard to hide connections page via feature flag
4. No database rollback needed -- `client_connections` table is additive

---

## 10. Accessibility and Mobile

### Accessibility (WCAG 2.1 AA)

- **Connect button:** `aria-label="Connect your Google account to ChainIQ"`. Uses Google's branding guidelines for the button (Google logo + text).
- **Status badges:** Not color-only. Each badge includes text label ("Connected", "Error", "Not Connected") in addition to color. `role="status"` with `aria-live="polite"` for dynamic status updates.
- **Property selection dialog:** Focus trapped within dialog. `aria-labelledby` points to dialog title. Escape key closes. First focusable element receives focus on open.
- **Sync history table:** Uses semantic `<table>` with `<thead>`, `<tbody>`, proper `<th scope="col">` headers. Screen reader announces "Sync history, 20 rows" via `aria-label` on the table.
- **Error messages:** Associated with form inputs via `aria-describedby`. Error state announced via `aria-invalid="true"`.
- **Keyboard navigation:** All interactive elements reachable via Tab. Connect/Disconnect buttons are `<button>` elements (not `<a>` or `<div>`). Enter and Space activate buttons.

### Mobile Responsiveness

- **Breakpoints:** Cards in 2-column grid above 768px, single column below.
- **Touch targets:** All buttons minimum 44x44px (WCAG 2.5.5 Target Size).
- **OAuth redirect:** Works on mobile browsers. The redirect back from Google consent returns to the same dashboard URL. Deep linking ensures the connections page is shown.
- **Property dialog:** Full-screen modal on mobile (below 640px). Scrollable list of properties with large tap targets.
- **Sync history:** Horizontal scroll on mobile with sticky first column (timestamp). Or collapsed to show only the last 5 syncs with "Show more" button.

### RTL Support

- Card layout uses CSS logical properties (`margin-inline-start`, `padding-inline-end`) instead of directional properties.
- Status badges and icons flip correctly in RTL mode.
- Google branding button remains LTR per Google's guidelines (logo on left regardless of page direction).
