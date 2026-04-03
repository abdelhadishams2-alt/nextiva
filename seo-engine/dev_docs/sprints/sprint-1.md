# Sprint 1: OAuth Infrastructure

> **Weeks:** 1-2 | **Capacity:** ~40h (20h/week) | **Committed:** 16h
> **Theme:** Authentication foundation for all data ingestion

---

## Sprint Goal

Establish the Google OAuth2 infrastructure with PKCE, encrypted token storage, and proactive refresh so that every downstream data connector has a working `getValidToken()` to call.

---

## Task List

| ID | Task | Effort | Phase | Dependencies | Priority |
| --- | --- | --- | --- | --- | --- |
| DI-001 | OAuth2 Infrastructure (PKCE + state + proactive refresh) | XL (16h) | P5 - Data Ingestion | SEC-001 (KeyManager) | P0 |

### DI-001 Breakdown

- Google OAuth2 PKCE flow with state-based CSRF protection
- AES-256-GCM token encryption via existing KeyManager
- Proactive token refresh (24-hour window before expiry)
- 4 bridge server endpoints (`/api/connections/*`)
- Connection status tracking (ACTIVE / EXPIRED / REVOKED)

---

## Database Migrations

| Migration | Tables | Source |
| --- | --- | --- |
| 007 | client_connections, oauth_states, ingestion_jobs, api_cache | unified-schema.md 3.1-3.2, 3.7-3.8 |

---

## Key Deliverables

After this sprint, the developer can:

1. **Connect a Google account** -- full OAuth flow from auth URL through consent screen to token storage
2. **Verify token encryption** -- tokens stored as AES-256-GCM ciphertext, never plaintext
3. **Call `getValidToken()`** -- any service can request a valid access token; refresh happens transparently
4. **List connections** -- `/api/connections` returns connection metadata without exposing tokens
5. **Run migration 007** -- 4 new tables with RLS policies and indexes

---

## Exit Criteria

All must pass before Sprint 1 is marked complete:

- [ ] Migration 007 creates 4 tables with RLS policies and indexes on a clean Supabase instance
- [ ] OAuth flow works end-to-end: auth URL -> Google consent -> callback -> encrypted token storage
- [ ] PKCE code_challenge verified during token exchange
- [ ] State-based CSRF protection prevents replay attacks (test: reuse state param, expect rejection)
- [ ] Token refresh works proactively within 24-hour window (test: set expiry to now+23h, trigger refresh)
- [ ] `/api/connections` returns connection list without token data
- [ ] Connection status transitions work: ACTIVE -> EXPIRED (on failed refresh) -> ACTIVE (on re-auth)
- [ ] Error handling: invalid state, expired code, revoked token all produce clear error responses

---

## Risk Flags

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Google OAuth verification still pending | High | Medium | Use Testing mode (100 users), sufficient for dev + early clients |
| PKCE implementation complexity | Low | Medium | Google's PKCE docs are well-documented; follow their guide exactly |
| Migration conflicts with existing schema | Low | High | Test on clean Supabase instance first; keep migration idempotent |
| OAuth callback URL requires live Hetzner deployment | Medium | Medium | Ensure Coolify deployment is stable before starting Sprint 1 |

---

## Handoff Notes for Sprint 2

Sprint 2 (Data Connectors) needs the following from Sprint 1:

- **`getValidToken(clientId)`** must be callable and return a fresh Google access token
- **`client_connections` table** must have at least 1 test row with ACTIVE status
- **`ingestion_jobs` table** must be ready for GSC/GA4/Crawler job tracking
- **`api_cache` table** must be ready for response caching
- At least 1 Google account connected in Testing mode with GSC and GA4 access
- OAuth callback URL functional on Hetzner deployment
