# ChainIQ — OWASP Top 10 Checklist (2021)

> **Step 14 Artifact** — Security Hardening
> **Last Updated:** 2026-03-28
> **Stack:** Node.js (raw http.createServer), Supabase PostgreSQL, Next.js 16 Dashboard
> **Dependencies:** Zero npm deps (bridge server), shadcn/ui + Tailwind (dashboard)

---

## A01: Broken Access Control

**Risk Level for ChainIQ:** HIGH — Multi-tenant SaaS with admin/user separation and tiered subscriptions.

### Current Controls

| Control | Implementation | Status | File |
|---------|---------------|--------|------|
| JWT verification on every request | `verifyAuth()` → Supabase `/auth/v1/user` with 30s cache | ✅ Done | bridge/server.js |
| Admin privilege separation | `requireAdmin()` checks admin flag on Supabase user record | ✅ Done | bridge/server.js |
| Row-Level Security (RLS) | All 9 existing tables enforce `auth.uid() = user_id` | ✅ Done | supabase-setup.sql |
| API key scoping | Plugin API keys validated against api_keys table, scoped endpoints | ✅ Done | bridge/key-manager.js |
| Path traversal prevention | 4-layer: no `..`, no absolute, extension whitelist, startsWith(PROJECT_DIR) | ✅ Done | bridge/server.js |
| Quota enforcement | Server-side quota check before article generation | ✅ Done | bridge/quota-manager.js |

### Required Hardening

| Action | Priority | Effort | Details |
|--------|----------|--------|---------|
| RLS on 6 new tables | P0 | 2h | content_inventory, performance_snapshots, keyword_opportunities, client_connections, writer_personas, performance_predictions — all need `USING (auth.uid() = user_id)` |
| IP allowlisting for API keys | P1 | 4h | Optional CIDR-based allowlist per API key in api_keys table |
| Resource ownership validation | P1 | 2h | Verify article_id belongs to requesting user before edit operations (defense in depth beyond RLS) |
| CORS production allowlist | P0 | 1h | Replace `Access-Control-Allow-Origin: *` with dashboard domain + configured origins |
| Admin action audit trail | P1 | 3h | Log all admin operations to dedicated audit_logs table |

### Verification Queries

```sql
-- Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verify all tables have policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## A02: Cryptographic Failures

**Risk Level for ChainIQ:** MEDIUM — Stores OAuth tokens, API keys, and user credentials.

### Current Controls

| Control | Implementation | Status |
|---------|---------------|--------|
| API key encryption | AES-256-GCM via KeyManager, format: `iv:authTag:ciphertext` (hex) | ✅ Done |
| OAuth token encryption (planned) | Same KeyManager pattern for client_connections table | 🔧 Planned |
| Password hashing | Supabase Auth (bcrypt, managed) | ✅ Done |
| TLS in transit | Cloudflare → Hetzner (TLS 1.3), Supabase connections (TLS enforced) | 🔧 Planned |
| JWT signing | Supabase-managed HMAC-SHA256 | ✅ Done |
| Webhook signatures | HMAC-SHA256 per webhook delivery | ✅ Done |

### Required Hardening

| Action | Priority | Effort | Details |
|--------|----------|--------|---------|
| Enforce HTTPS only | P0 | 1h | Coolify reverse proxy with Let's Encrypt, HSTS header |
| Encryption key rotation | P1 | 4h | 90-day rotation schedule for KeyManager master key, re-encrypt all stored values |
| Disable TLS 1.0/1.1 | P0 | 0.5h | Cloudflare setting: minimum TLS 1.2 |
| Secure cookie attributes | P0 | 1h | Dashboard cookies: `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/` |

### Encryption Configuration

```
Algorithm:        AES-256-GCM (authenticated encryption)
Key Derivation:   SUPABASE_SERVICE_ROLE_KEY → SHA-256 → 32-byte key
IV:               12 bytes, crypto.randomBytes(12) per encryption
Auth Tag:         16 bytes (GCM standard)
Format:           iv:authTag:ciphertext (hex-encoded, colon-separated)
Key Rotation:     Every 90 days (manual, automated pipeline planned)
Stored In:        Environment variable (never disk, never code)
```

---

## A03: Injection

**Risk Level for ChainIQ:** MEDIUM — No direct SQL, but prompt injection surface exists.

### Current Controls

| Control | Implementation | Status |
|---------|---------------|--------|
| SQL injection prevention | No direct SQL — Supabase REST API (PostgREST) parameterizes all queries | ✅ Done |
| Path traversal prevention | 4-layer validation in all file operation endpoints | ✅ Done |
| Prompt injection guard | 13 pattern categories in prompt-guard.js (21 tests) | ✅ Done |
| Input length limits | 64KB body, 2000-char edit prompt, 8000-char max prompt | ✅ Done |
| XSS in generated HTML | Articles are standalone HTML — edit UI scripts are trusted | ⚠️ Review |

### Required Hardening

| Action | Priority | Effort | Details |
|--------|----------|--------|---------|
| Dashboard XSS prevention | P0 | 2h | React auto-escapes by default; audit `dangerouslySetInnerHTML` usage, sanitize article preview rendering |
| Content-Security-Policy header | P0 | 2h | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co` |
| Prompt guard pattern expansion | P2 | 2h | Add patterns for: Unicode homoglyphs, zero-width characters, multi-language injection phrases |
| Input validation schemas | P1 | 4h | JSON schema validation for all POST body shapes |

---

## A04: Insecure Design

**Risk Level for ChainIQ:** LOW — Architecture follows security-first principles with defense in depth.

### Design Principles Applied

| Principle | Implementation |
|-----------|---------------|
| Defense in depth | Auth middleware → RLS → path validation → prompt guard (4 layers) |
| Least privilege | Anon key for clients (RLS-bound), service_role only server-side |
| Fail secure | Unknown routes → 404, auth failures → 401, all errors → generic message |
| Separation of duties | Admin endpoints require separate admin flag, not just authentication |
| Zero-trust file operations | Every file path validated regardless of auth status |

### Required Hardening

| Action | Priority | Effort | Details |
|--------|----------|--------|---------|
| Account lockout policy | P1 | 2h | 5 failed logins → 15-minute lockout per email + IP |
| MFA for admin accounts | P2 | 8h | Supabase MFA (TOTP) required for admin flag users |
| Rate limit dashboard login | P1 | 1h | 5 attempts/min per IP on Supabase Auth endpoints (Cloudflare rule) |

---

## A05: Security Misconfiguration

**Risk Level for ChainIQ:** MEDIUM — Localhost development patterns need production hardening.

### Current Gaps

| Gap | Risk | Fix |
|-----|------|-----|
| CORS `Access-Control-Allow-Origin: *` | Any webpage can call bridge API | Replace with domain allowlist |
| No security headers | Missing CSP, HSTS, X-Frame-Options, X-Content-Type-Options | Add security headers middleware |
| Debug error details in responses | Stack traces may leak in 500 responses | Strip in production (`NODE_ENV=production` check) |
| No `X-Request-ID` correlation | Cannot trace requests across bridge → Supabase | Add UUID request ID header |

### Security Headers Configuration

```javascript
// Production security headers (bridge server)
const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '0', // Deprecated, CSP replaces this
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
};
```

### CORS Production Configuration

```javascript
// Production CORS (bridge server)
const ALLOWED_ORIGINS = [
  process.env.DASHBOARD_URL,           // e.g., https://app.chainiq.io
  process.env.BRIDGE_PUBLIC_URL,       // e.g., https://api.chainiq.io
  // CMS plugin origins added per-deployment
].filter(Boolean);

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  res.setHeader('Access-Control-Max-Age', '86400');
}
```

---

## A06: Vulnerable and Outdated Components

**Risk Level for ChainIQ:** VERY LOW — Zero npm dependencies in bridge server.

### Current State

| Component | Dependencies | Vulnerability Surface |
|-----------|-------------|----------------------|
| Bridge server | 0 npm deps (Node.js built-ins only) | Zero — no supply chain risk |
| Dashboard (Next.js) | ~50 npm deps (Next.js + shadcn/ui + Tailwind) | Standard — managed by `npm audit` |
| Supabase | Managed service | Zero — Supabase handles patching |

### Required Hardening

| Action | Priority | Effort | Details |
|--------|----------|--------|---------|
| `npm audit` in CI pipeline | P0 | 0.5h | GitHub Actions step: `npm audit --audit-level=high` on dashboard |
| Node.js version pinning | P1 | 0.5h | Pin to LTS in Dockerfile, auto-update policy |
| Dependabot alerts | P1 | 0.5h | Enable GitHub Dependabot for dashboard package.json |
| Supabase client library monitoring | P2 | 0.5h | No client library used (raw fetch), but monitor Node.js security advisories |

---

## A07: Identification and Authentication Failures

**Risk Level for ChainIQ:** MEDIUM — SaaS product with subscription tiers.

### Current Controls

| Control | Status |
|---------|--------|
| Strong password policy | ✅ Supabase Auth default (8+ chars) |
| Token expiry | ✅ 1-hour JWT, refresh token rotation |
| Secure token storage (server) | ✅ In-memory cache only, no disk persistence |
| Token verification | ✅ Live Supabase validation with 30s cache |

### Required Hardening

| Action | Priority | Effort |
|--------|----------|--------|
| Brute force protection on login | P1 | 2h |
| Session invalidation on password change | P1 | 1h |
| Concurrent session limits | P2 | 3h |
| API key expiry policy | P2 | 2h |

---

## A08: Software and Data Integrity Failures

**Risk Level for ChainIQ:** LOW — No file uploads, no deserialization beyond JSON.parse.

### Controls

- Webhook payloads signed with HMAC-SHA256 (integrity verified by receivers)
- No user file uploads (articles are server-generated)
- No `eval()`, no `Function()` constructor usage
- `JSON.parse()` only for request body deserialization

### Required Hardening

| Action | Priority | Effort |
|--------|----------|--------|
| Subresource Integrity (SRI) for dashboard CDN assets | P2 | 1h |
| CI artifact signing | P3 | 4h |

---

## A09: Security Logging and Monitoring Failures

**Risk Level for ChainIQ:** MEDIUM — Structured logging exists but needs expansion.

### Current State

| Event | Logged? | Logger |
|-------|---------|--------|
| Failed authentication | ✅ | logger.security() |
| Rate limit triggers | ✅ | logger.security() |
| Admin actions | ✅ | logger.security() |
| Path traversal attempts | ✅ | logger.security() |
| Prompt injection blocks | ✅ | logger.security() |
| Successful logins | ❌ | Not logged |
| API key usage | ✅ | usage_logs table |
| OAuth token refresh | ❌ | Not logged |
| User deletion (GDPR) | ❌ | Not logged |

### Required Hardening

| Action | Priority | Effort | Details |
|--------|----------|--------|---------|
| Log successful logins | P1 | 1h | IP, user_id, timestamp for anomaly detection |
| Log OAuth token lifecycle | P1 | 2h | Creation, refresh, revocation events |
| Log GDPR data deletion | P0 | 1h | What was deleted, when, by whom (audit requirement) |
| External log destination | P2 | 4h | Structured JSON to file, Loki/Grafana in production |
| Alerting rules | P2 | 2h | > 10 failed logins/min, > 5 prompt injection blocks/hour, admin actions from new IP |

---

## A10: Server-Side Request Forgery (SSRF)

**Risk Level for ChainIQ:** LOW — Outbound requests are to hardcoded Supabase URL and configured OAuth endpoints only.

### Current Controls

- Bridge server only connects to: Supabase URL (from env var), Google OAuth endpoints (hardcoded)
- No user-supplied URLs are fetched
- Content crawler (Phase 5) will fetch user-provided sitemaps — SSRF risk introduced

### Required Hardening (Phase 5)

| Action | Priority | Effort | Details |
|--------|----------|--------|---------|
| URL validation for content crawler | P0 | 3h | Reject private IPs (10.x, 172.16-31.x, 192.168.x, 127.x, ::1), reject non-HTTP(S) schemes |
| DNS rebinding protection | P1 | 2h | Resolve DNS before connecting, verify resolved IP is not private |
| Crawler timeout + size limits | P0 | 1h | 10s timeout, 5MB response limit, follow max 3 redirects |
| Crawler URL allowlisting | P2 | 2h | Optional per-user URL pattern allowlist for crawled domains |

---

## Compliance Summary

### GDPR Requirements (MENA publishers with EU exposure)

| Requirement | Status | Implementation |
|-------------|--------|---------------|
| Right to access (Art. 15) | 🔧 Planned | Export endpoint for user's articles, settings, usage logs |
| Right to erasure (Art. 17) | ⚠️ Partial | User deletion exists but does not cascade to usage_logs, performance_snapshots |
| Right to portability (Art. 20) | 🔧 Planned | JSON export of articles + generated content |
| Data minimization (Art. 5(1)(c)) | ✅ Done | Only email + subscription data stored; GSC/GA4 data is user-consented |
| Consent tracking | 🔧 Planned | Consent flags on client_connections for OAuth scopes |
| Privacy notice | 🔧 Planned | Step 14.7 (legal docs) |
| DPA for enterprise clients | 🔧 Planned | Step 14.7 (legal docs) |

### GDPR Deletion Cascade (Required Implementation)

```sql
-- User account deletion must cascade to ALL user data:
-- 1. Supabase Auth deletes user record (managed)
-- 2. Bridge server DELETE /admin/users/:id must also:
DELETE FROM usage_logs WHERE user_id = $1;
DELETE FROM articles WHERE user_id = $1;
DELETE FROM article_versions WHERE article_id IN (SELECT id FROM articles WHERE user_id = $1);
DELETE FROM pipeline_jobs WHERE user_id = $1;
DELETE FROM user_settings WHERE user_id = $1;
DELETE FROM api_keys WHERE user_id = $1;
DELETE FROM subscriptions WHERE user_id = $1;
-- Phase 5+ tables:
DELETE FROM client_connections WHERE user_id = $1;
DELETE FROM content_inventory WHERE user_id = $1;
DELETE FROM performance_snapshots WHERE user_id = $1;
DELETE FROM keyword_opportunities WHERE user_id = $1;
DELETE FROM writer_personas WHERE user_id = $1;
DELETE FROM performance_predictions WHERE user_id = $1;
-- Log the deletion event (audit trail, retain 30 days)
INSERT INTO audit_logs (event, user_id, deleted_at, deleted_by) VALUES ('user_deletion', $1, NOW(), $admin_id);
```
