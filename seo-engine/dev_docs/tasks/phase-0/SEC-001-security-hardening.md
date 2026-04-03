# SEC-001: Security Hardening (P0 Fixes)

> **Phase:** 0 | **Priority:** P0 | **Status:** NOT STARTED
> **Effort:** L (8h) | **Type:** fix
> **Backlog Items:** T1-02, T1-03, T1-13, T1-15, T1-16, T1-18
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `dev_docs/audit/enhance-audit-security.md` — 3 P0 security issues
3. `dev_docs/audit/enhance-audit-performance.md` — caching issues
4. `bridge/server.js` — current auth middleware, rate limiter, health endpoint
5. `bridge/supabase-client.js` — config loading, admin key usage
6. `dev_docs/services/auth-bridge.md` — service spec with fix targets
7. `supabase-setup.sql` — schema reference (PROTECTED)
8. `dev_docs/enhancement-backlog.md` — Tier 1 items

## Objective
Fix all P0 security issues in the bridge server: move secrets to environment variables, stop persisting tokens to disk, add missing rate limiting, implement auth caching, cap subprocess output, and remove sensitive info from health endpoint.

## File Plan

| Action | Path | What |
|--------|------|------|
| MODIFY | `bridge/supabase-client.js` | Read service_role from `process.env.SUPABASE_SERVICE_ROLE_KEY` instead of `.supabase-admin.json` |
| MODIFY | `bridge/server.js` | Remove token persistence to `.auth-session.json`, write status only |
| MODIFY | `bridge/server.js` | Remove `projectDir` from `/health` response body |
| MODIFY | `bridge/server.js` | Add rate limiting to `/auth/verify` and `/apply-edit` endpoints |
| MODIFY | `bridge/server.js` | Add in-memory auth verification cache with 30s TTL |
| MODIFY | `bridge/server.js` | Add 4MB stdout/stderr size limit to Claude CLI subprocess |
| CREATE | `.env.example` | Template with all required environment variables |

## Sub-tasks

### Sub-task 1: Move service_role to env var (~2h)
- In `supabase-client.js`, replace file-based config loading for `service_role` with `process.env.SUPABASE_SERVICE_ROLE_KEY`
- Keep `SUPABASE_URL` and `SUPABASE_ANON_KEY` as env vars too
- Remove the file-mtime cache for `.supabase-admin.json` (no longer needed)
- Add startup validation: if required env vars missing, log error and exit
- Create `.env.example` with all required vars documented

### Sub-task 2: Stop writing tokens to disk (~1h)
- In `server.js`, find where access tokens are written to `.auth-session.json`
- Replace with returning token in HTTP response only
- If session status tracking is needed, write only `{ status: "active" }` — never the token
- Add `.auth-session.json` and `.supabase-admin.json` to `.gitignore`

### Sub-task 3: Harden health endpoint + rate limiting (~2h)
- Remove `projectDir`, internal paths, and version details from `/health` response
- Keep only: `{ status: "ok", uptime: N }`
- Add rate limiting to `/auth/verify` (same bucket as general rate limiter)
- Add rate limiting to `/apply-edit` (separate, stricter: 10 req/min)

### Sub-task 4: Auth cache + subprocess limits (~3h)
- Implement in-memory Map for verified tokens: `Map<token_hash, { user, expires_at }>`
- TTL: 30 seconds. Hash tokens with SHA-256 before storing as keys.
- On `/auth/verify`: check cache first, only call Supabase if miss or expired
- In `/apply-edit`: add stdout/stderr size tracking on subprocess
- If output exceeds 4MB, kill subprocess with SIGTERM and return 413 error

## Testing Strategy

### Unit Tests
- Verify env var loading with valid/missing/empty values
- Verify cache hit returns user without Supabase call
- Verify cache miss calls Supabase and populates cache
- Verify cache expiry after 30s

### Integration Tests
- Start bridge server with env vars set → verify endpoints work
- Start bridge server without service_role → verify admin endpoints return 503
- Submit /apply-edit with large output → verify 4MB cap and subprocess kill
- Verify /health no longer includes projectDir

## Acceptance Criteria
- [ ] Bridge server starts with `SUPABASE_SERVICE_ROLE_KEY` from env var (not file)
- [ ] No access tokens are written to any file on disk
- [ ] `/health` response contains only `{ status, uptime }` — no paths or keys
- [ ] `/auth/verify` and `/apply-edit` have rate limiting enabled
- [ ] Auth verification uses 30s TTL cache (second call within 30s skips Supabase)
- [ ] Claude CLI subprocess killed if stdout exceeds 4MB
- [ ] `.env.example` exists with all required variables documented
- [ ] All existing functionality continues to work after changes

## Dependencies
- Blocked by: T1-01 (git init — should have version control before modifying security code)
- Blocks: T1-04 (test infrastructure), T2-16 (structured logging)
