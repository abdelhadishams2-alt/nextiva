# Audit: Security & Compliance

> **App:** article-engine (ChainIQ)
> **Dimension:** E1-D
> **Date:** 2026-03-26
> **Rounds completed:** 3/3

---

## Score: 4.5/10 — Needs Work

Authentication architecture is sound: Supabase Auth with live token validation, server-side subscription checks, proper admin privilege separation, UUID validation, path traversal prevention. Score held down by three P0 issues: service_role key on disk, access tokens persisted to disk, and prompt injection surface.

---

## Round 1 Findings (Surface Scan)

### Authentication
Supabase Auth with JWT Bearer tokens. Flow: Client sends `Authorization: Bearer <jwt>` → `verifyToken()` validates against Supabase `/auth/v1/user` (live validation) → `getSubscription()` checks status. Admin paths use `service_role` key for privilege separation. Correct design.

### Secrets in Source — CRITICAL
- `supabase-client.js` lines 17-19: Supabase anon key hardcoded as `DEFAULT_CONFIG`. Comment says "public anon key — safe to embed, RLS-protected." Partially correct but cannot be rotated without code update.
- `config/.auth-session.json`: **Live user access token** + user email in plaintext. In `.gitignore` but present on disk.
- `config/.supabase-admin.json`: **Supabase service_role key** (bypasses all RLS). In `.gitignore` but present on disk.

### HTTPS
Bridge server listens on `http://127.0.0.1:19847` — plain HTTP, loopback only. Acceptable for local dev tool but tokens transmitted in plaintext.

### Rate Limiting
In-memory rate limiter: 10 attempts/min per email/IP. Applied to `/auth/signup` and `/auth/login` only. **Not applied** to `/auth/verify`, `/apply-edit`, or admin endpoints. Resets on server restart.

### Input Parameterization
Supabase queries via PostgREST REST API. `userId` comes from verified JWT (Supabase-controlled). UUID validated via `UUID_RE` in admin endpoints. Acceptable pattern.

---

## Round 2 Findings (OWASP Top 10)

### A01 — Broken Access Control: Partially Addressed
- All business endpoints require auth. No accidentally open endpoints.
- `/health` returns `projectDir` (filesystem path) unauthenticated — information disclosure.
- No per-user resource isolation. User A can edit User B's articles if file exists in project dir.
- Global `activeEdit` mutex = User A can DoS User B's edit capability.

### A02 — Cryptographic Failures: Concerns
- Bearer tokens over HTTP (loopback). Acceptable local risk.
- Access token in `.auth-session.json` is plaintext. Any process can read it.
- **service_role key in `.supabase-admin.json` is plaintext — bypasses all RLS. Highest severity.**
- JWT verification delegated to Supabase server (correct).

### A03 — Injection: Mostly Mitigated, One Residual Risk
- No direct SQL (Supabase REST only).
- Path traversal: Well-blocked (`..` detection, `path.isAbsolute()`, `.html` extension, `path.resolve().startsWith(PROJECT_DIR)`).
- **Prompt injection via `User requested change:` field** — content passed verbatim to Claude CLI via stdin. Authenticated users can inject adversarial instructions.

### A04 — Insecure Design: Gaps
- Rate limiter resets on restart. No account lockout. No CAPTCHA.
- No brute force protection on `/auth/verify`.

### A05 — Security Misconfiguration: Notable Issues
- **CORS `*` for all origins.** Necessary for `file://` but means any webpage can call `127.0.0.1:19847`.
- No `Content-Security-Policy`, `X-Frame-Options`, or security headers.
- Debug error details in HTTP 400/500 responses.

### A06 — Vulnerable Components: Low Risk
- **Zero npm dependencies.** Pure Node.js built-ins. No vulnerable packages to audit. This is a security strength.

### A07 — Authentication Failures: Partially Addressed
- Token persisted to `.auth-session.json` with no auto-invalidation or rotation.
- `last_verified` timestamp never re-checked for expiry.
- No logout endpoint. Tokens cannot be invalidated server-side.

### A08 — Integrity Failures: N/A
No file uploads. No deserialization beyond `JSON.parse`.

### A09 — Logging Failures: Significant Gap
- Security events NOT logged: failed auth, rate limit triggers, admin actions, path traversal attempts.
- Console.error only. No structured logging, no log levels, no external destination.

### A10 — SSRF: Low Risk
Outbound requests only to hardcoded Supabase URL. No user-supplied URLs fetched.

---

## Round 3 Recommendations

### P0 Security Issues (Exploitable Now)

**P0-1: service_role key on disk**
`.supabase-admin.json` stores the key that bypasses all RLS. Any process on the developer's machine can read it. If machine is compromised, entire Supabase project is compromised.
*Mitigation: Store in environment variable `SUPABASE_SERVICE_ROLE_KEY`. Never write to disk.*

**P0-2: Access token persisted to disk**
`.auth-session.json` stores live Supabase JWT. Attacker with file read access can impersonate the user.
*Mitigation: Write only a derived status flag (`{ "authenticated": true, "checked_at": "..." }`) — not the token.*

**P0-3: Prompt injection via edit requests**
Authenticated users can craft adversarial `User requested change:` content that influences Claude CLI behavior. Claude has filesystem access in project context.
*Mitigation: Sanitize Claude-specific instruction patterns. Consider sandboxing Claude subprocess.*

### Minimum Hardening Before Real Users
1. Move service_role key to env var (1 day)
2. Stop writing access tokens to disk (1 hour)
3. Rate limit `/auth/verify` and `/apply-edit` (2 hours)
4. Log all security events (1 day)
5. Remove `projectDir` from unauthenticated `/health` (15 min)
6. Add prompt injection guard (1 day)

### Compliance (GDPR)
- User email stored in Supabase Auth (standard) and `.auth-session.json` (not standard)
- User deletion endpoint exists but **does not delete `usage_logs` rows** — GDPR gap
- No Privacy Notice, no DPA documentation, no retention policy for `usage_logs`

---

## P0 Issues (Fix Immediately)
- Plaintext service_role key on developer machines
- Live access token persisted to disk
- Prompt injection via authenticated edit requests

## P1 Issues (Fix Before Scaling)
- No security event logging
- CORS wildcard on bridge server
- No logout/token invalidation endpoint
- `usage_logs` not deleted on user account deletion (GDPR)
- Debug error details in HTTP responses
