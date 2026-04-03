# ChainIQ — Next Sprint Plan

> **Step 18.5 Artifact**
> **Last Updated:** 2026-03-28
> **Sprint:** S1 (Phase 5: Data Ingestion Foundation)
> **Duration:** 1 week (target: 16 hours)
> **Developer:** Solo

---

## Sprint Goal

Establish the OAuth2 infrastructure that all Phase 5 connectors (GSC, GA4, Semrush, Ahrefs) depend on. By the end of this sprint, ChainIQ can initiate a Google OAuth flow, exchange an authorization code for tokens, store tokens encrypted in Supabase, and proactively refresh tokens before expiry.

---

## Items

### DI-001: OAuth2 Infrastructure

**Source:** `dev_docs/tasks/phase-5/DI-001-oauth2-infrastructure.md`
**Effort:** XL (16 hours)
**Priority:** P0 -- all Phase 5 connectors depend on this
**Dependencies:** None (all prerequisites complete)

#### Acceptance Criteria

| # | Criterion | How to Verify |
|---|-----------|---------------|
| 1 | PKCE flow generates `code_verifier` (43-128 chars) and `code_challenge` (S256) | Unit test: verify challenge = SHA256(verifier), base64url encoded |
| 2 | OAuth state parameter is cryptographically random, bound to user session, and expires after 10 minutes | Unit test: state generation, validation, expiry |
| 3 | Authorization URL includes correct scopes for GSC + GA4 | Unit test: URL construction with `webmasters.readonly` and `analytics.readonly` |
| 4 | Callback endpoint exchanges code for tokens using PKCE verifier | Integration test: mock Google token endpoint, verify code exchange |
| 5 | Access + refresh tokens stored encrypted (AES-256-GCM via key-manager.js) in `connections` table | Unit test: encrypt/decrypt round-trip, verify ciphertext differs from plaintext |
| 6 | Proactive token refresh fires when access_token is within 5 minutes of expiry | Unit test: mock clock, verify refresh triggers at T-5min |
| 7 | Refresh failure after 3 retries marks connection as `needs_reauth` | Unit test: mock 3 consecutive 401s, verify status change |
| 8 | All OAuth endpoints require authenticated user (Supabase JWT) | Integration test: unauthenticated requests get 401 |
| 9 | Rate limiting applied to OAuth endpoints (10 req/min per user) | Unit test: 11th request within 60s returns 429 |
| 10 | Dashboard "Connect Google" button initiates the flow | Manual test: click button, verify redirect to Google consent |

#### Estimated Hour Breakdown

| Task | Hours |
|------|-------|
| Database schema: `connections` table + migration | 2h |
| OAuth state manager (generate, validate, expire) | 2h |
| PKCE implementation (verifier, challenge, S256) | 1h |
| Bridge endpoints: `/api/connections/google/authorize`, `/api/connections/google/callback` | 3h |
| Token storage: encrypt + store in Supabase via key-manager | 2h |
| Proactive refresh: timer-based, retry with backoff | 2h |
| Tests: unit + integration (target: 15-20 new tests) | 3h |
| Dashboard: Connect button + connection status display | 1h |

#### Files to Create or Modify

| File | Action | Description |
|------|--------|-------------|
| `bridge/oauth-manager.js` | Create | PKCE, state, token exchange, refresh logic |
| `bridge/server.js` | Modify | Register 3 new OAuth endpoints |
| `bridge/migrations/XXX_add_connections.sql` | Create | `connections` table with encrypted token columns |
| `tests/oauth.test.js` | Create | 15-20 tests covering all acceptance criteria |
| `dashboard/app/connections/page.tsx` | Create | Connections management page |
| `dashboard/components/connect-google-button.tsx` | Create | OAuth initiation button |

---

## Definition of Done

All of the following must be true before this sprint is marked complete:

- [ ] All 10 acceptance criteria verified (tests passing or manually confirmed)
- [ ] `npm test` passes with zero failures (228 existing + new OAuth tests)
- [ ] No P0 security findings in OAuth flow (no tokens on disk, no state reuse)
- [ ] `dev_docs/STATUS.md` updated with DI-001 marked as done
- [ ] `dev_docs/handoff.md` updated with sprint summary
- [ ] Migration tested on dev Supabase project before staging

---

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Google OAuth consent screen approval delays | Medium | Use "Testing" mode (limited to 100 test users) for dev/staging |
| PKCE implementation edge cases | Low | Use Node.js `crypto` module (proven primitives), test with Google's token endpoint |
| Token refresh race condition | Medium | Serialize refresh per connection (one refresh at a time per user-provider pair) |
| Scope exceeds 16 hours | Low | Dashboard UI is minimal (button + status). Full connections page deferred to DI-006 |

---

## Carry-Over from Last Sprint

No carry-over. This is the first sprint of Phase 5. All prior phases (0-4) are complete.

---

## Next Sprint Preview (S2)

Sprint S2 targets DI-002 (GSC Connector) and DI-003 (GA4 Connector), both of which depend on the OAuth infrastructure built in this sprint. Estimated: 24 hours across 2 weeks.
