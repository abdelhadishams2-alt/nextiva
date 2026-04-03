# Auth & Bridge Server Service

> **Type:** Existing (improve)
> **Audit Score:** Security 4.5/10, Architecture 5/10
> **Priority:** P0 — security fixes required before all other work
> **Owner:** Solo developer
> **Files:** `bridge/server.js`, `bridge/supabase-client.js`

---

## 1. Overview

The Auth & Bridge service is the HTTP gateway for all authenticated operations in ChainIQ. It runs a Node.js HTTP server on localhost:19847 with zero npm dependencies, handling authentication via Supabase Auth, section editing via Claude CLI subprocess, and admin operations via Supabase service_role.

**Current State:** Working but has 3 P0 security issues that must be fixed before any feature development.

**Target State:** Secure, well-tested bridge server with environment-based secrets, cached auth verification, structured logging, and async I/O throughout.

---

## 2. Business Context

The bridge server is the security boundary between the browser-based edit UI and the filesystem. Every file write, every user verification, and every admin operation flows through it. A security breach here = full database access + arbitrary file writes.

**Business rules:**
1. Only authenticated users can edit article sections
2. Only admin users (verified via service_role) can manage other users
3. File operations are sandboxed to PROJECT_DIR — no path traversal allowed
4. Only one edit can run at a time (global mutex) — prevents race conditions
5. Rate limiting prevents brute-force auth attacks (100 requests/minute/IP)
6. CORS allows all origins (localhost-only design; must restrict for production)
7. Health endpoint is public — no auth required
8. Admin operations require service_role key — anon key is insufficient

---

## 3. Patterns in Use (Existing)

```
- HTTP server: raw Node.js http.createServer (no Express)
- Auth: Bearer token → Supabase /auth/v1/user verification
- Error handling: try/catch in route handlers, JSON {error, message} response
- Config loading: file-mtime cache for .supabase-admin.json
- Subprocess: child_process.spawn('claude') for section edits
- Rate limiting: in-memory token bucket per IP
- Path validation: 4-layer (no '..', no absolute, extension whitelist, startsWith)
```

---

## 4. API Endpoints (12 existing)

| Method | Path | Auth | Purpose | Status |
|--------|------|------|---------|--------|
| GET | `/health` | None | Server status check | Working |
| POST | `/auth/verify` | Bearer | Verify user token | Working (needs caching) |
| POST | `/auth/signup` | None | Create new user | Working |
| POST | `/auth/login` | None | User login | Working |
| POST | `/auth/logout` | Bearer | User logout | Working |
| POST | `/apply-edit` | Bearer | Section edit via Claude CLI | Working (needs stdout limit) |
| GET | `/admin/users` | Bearer + Admin | List all users | Working |
| POST | `/admin/approve` | Bearer + Admin | Approve user subscription | Working |
| POST | `/admin/revoke` | Bearer + Admin | Revoke user access | Working |
| DELETE | `/admin/delete` | Bearer + Admin | Delete user | Working |
| GET | `/admin/usage` | Bearer + Admin | Get usage logs | Working |
| OPTIONS | `*` | None | CORS preflight | Working |

---

## 5. Data Model

**Supabase tables used:**
- `auth.users` — Supabase managed, user credentials and metadata
- `subscriptions` — user_id, plan, status, approved_by, created_at
- `usage_logs` — user_id, action, metadata, created_at

**Local state (in-memory):**
- `rateLimitMap` — Map<IP, {tokens, lastRefill}>
- `activeEdit` — boolean mutex for concurrent edit prevention

---

## 6. Security Fixes Required (from audit)

### P0-1: Move service_role key to environment variable
- **Current:** Reads from `.supabase-admin.json` file on disk
- **Target:** `process.env.SUPABASE_SERVICE_ROLE_KEY`
- **Task:** T1-02 (4 hours)

### P0-2: Stop writing access tokens to disk
- **Current:** Writes tokens to `.auth-session.json`
- **Target:** Return token in response only; never persist
- **Task:** T1-03 (1 hour)

### P0-3: Add prompt injection guard
- **Current:** User edit content passed directly to Claude CLI
- **Target:** Sanitize Claude instruction patterns before subprocess spawn
- **Task:** T2-19 (1 day)

---

## 7. Improvement Targets

| Area | Current | Target | Task |
|------|---------|--------|------|
| Auth verification | 2 sequential HTTP calls, no caching | 30s TTL cache | T1-16 |
| File I/O | Sync fs calls in handlers | Async fs.promises | T1-17 |
| Subprocess output | Unbounded stdout/stderr | 4MB cap with kill | T1-18 |
| Rate limiting | Missing on /auth/verify, /apply-edit | Full coverage | T1-15 |
| 409 responses | No Retry-After header | Include header | T1-14 |
| /health response | Includes projectDir (info leak) | Remove sensitive fields | T1-13 |
| Logging | console.log | Structured JSON with request IDs | T2-16 |
| Security events | None | Log failed auth, admin actions, traversal attempts | T2-17 |

---

## 8. Testing Strategy

**Test suites required (currently zero):**

| Suite | Priority | Task | Scenarios |
|-------|----------|------|-----------|
| Path traversal | P0 | T1-05 | `..` traversal, absolute paths, symlinks, null bytes, encoded traversal |
| Auth middleware | P0 | T1-06 | Valid token, expired token, malformed token, missing token, admin verification |
| Rate limiter | P1 | T1-07 | Under limit, at limit, over limit, IP reset after window |

**Framework:** `node:test` (built-in, zero dependencies)
**Pattern:** Integration tests hitting real bridge server endpoints

---

## 9. Role Access Matrix

| Action | Anonymous | Authenticated | Admin |
|--------|-----------|---------------|-------|
| Health check | Y | Y | Y |
| Signup | Y | N/A | N/A |
| Login | Y | N/A | N/A |
| Verify token | N | Y | Y |
| Edit section | N | Y | Y |
| List users | N | N | Y |
| Approve user | N | N | Y |
| Revoke user | N | N | Y |
| Delete user | N | N | Y |
| View usage | N | N | Y |

---

## 10. Tasks (Enhance Path)

| ID | Task | Type | Effort | Tier |
|----|------|------|--------|------|
| T1-02 | Move service_role to env var | fix | 4h | 1 |
| T1-03 | Stop writing tokens to disk | fix | 1h | 1 |
| T1-05 | Path traversal test suite | fix | 2h | 1 |
| T1-06 | Auth middleware test suite | fix | 2h | 1 |
| T1-07 | Rate limiter test suite | fix | 1h | 1 |
| T1-13 | Remove projectDir from /health | fix | 15m | 1 |
| T1-14 | Add Retry-After to 409 | fix | 15m | 1 |
| T1-15 | Rate limit /auth/verify + /apply-edit | fix | 2h | 1 |
| T1-16 | Token verification cache (30s TTL) | fix | 1h | 1 |
| T1-17 | Replace sync fs with async | fix | 30m | 1 |
| T1-18 | Stdout size limit (4MB) | fix | 1h | 1 |
| T2-16 | Structured JSON logging | gap | 1d | 2 |
| T2-17 | Security event logging | gap | 4h | 2 |
| T2-19 | Prompt injection guard | gap | 1d | 2 |
