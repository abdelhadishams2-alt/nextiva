# ChainIQ — Threat Model & Authentication Architecture

> **Step 14 Artifact** — Security Hardening
> **Last Updated:** 2026-03-28
> **Methodology:** STRIDE analysis + project-specific attack surface mapping

---

## 1. System Boundary & Attack Surface

ChainIQ operates across four trust boundaries:

```
[Internet]
    ↓
[Cloudflare CDN] ← DDoS protection, TLS termination
    ↓
[Hetzner VPS: Bridge Server] ← Node.js http.createServer(), 48 endpoints
    ↓
[Supabase PostgreSQL] ← RLS-enforced, 15 tables (9 existing + 6 planned)
    ↓
[External APIs] ← GSC, GA4, Semrush, Ahrefs (OAuth + API key auth)
```

**Attack surface by component:**

| Component | Exposure | Entry Points | Trust Level |
|-----------|----------|-------------|-------------|
| Bridge Server (port 19847) | Internet (via Cloudflare) | 48 HTTP endpoints + SSE | Semi-trusted (authenticated users) |
| Dashboard (Next.js) | Internet (Vercel/Coolify) | 15 pages, client-side JS | Untrusted (browser) |
| Supabase Auth | Internet (Supabase-managed) | GoTrue endpoints | Trusted (managed service) |
| Claude CLI subprocess | Server-local only | stdin (user edit content) | Semi-trusted (prompt-guarded) |
| CMS Plugins (WordPress/Shopify) | Internet (client sites) | API key-authenticated calls | Semi-trusted (API key validated) |
| OAuth token storage | Database (AES-256-GCM encrypted) | client_connections table | Trusted (encrypted at rest) |

---

## 2. STRIDE Analysis

### 2.1 Spoofing

| Threat | Target | Current Mitigation | Residual Risk | Action |
|--------|--------|-------------------|---------------|--------|
| S1: Stolen JWT impersonation | Bridge Server auth | Supabase JWT validation, 30s SHA-256 cache, 1-hour token expiry | Low — tokens expire, cache limits window | Monitor for token reuse from multiple IPs |
| S2: API key theft from CMS plugin | Plugin → Bridge API | AES-256-GCM encrypted keys in Supabase, key rotation endpoint | Medium — if client server compromised, key is exposed until rotated | Add IP allowlisting per API key |
| S3: OAuth token theft from DB | client_connections table | AES-256-GCM encryption via KeyManager (351 lines), key derived from SUPABASE_SERVICE_ROLE_KEY | Low — encryption key never leaves server process | Implement key rotation schedule (90-day) |
| S4: Admin privilege escalation | /admin/* endpoints | requireAdmin() checks admin flag on user record | Medium — admin flag stored in Supabase, no MFA | Add MFA requirement for admin operations |

### 2.2 Tampering

| Threat | Target | Current Mitigation | Residual Risk | Action |
|--------|--------|-------------------|---------------|--------|
| T1: Prompt injection via edit UI | Claude CLI subprocess | 13-pattern prompt guard (prompt-guard.js), 2000-char limit | Low — guard covers known patterns, new patterns may bypass | Quarterly prompt guard pattern review |
| T2: Request body manipulation | Bridge Server endpoints | JSON.parse + schema validation, 64KB body limit | Low — validated before processing | Add JSON schema validation library (or manual checks) |
| T3: Path traversal in file operations | /apply-edit, file read endpoints | 4-layer validation (no `..`, no absolute, extension whitelist, startsWith(PROJECT_DIR)) | Very Low — defense in depth | No additional action needed |
| T4: Webhook payload forgery | Webhook delivery system | HMAC-SHA256 signature on every delivery | Low — signature verified by receivers | Document signature verification for webhook consumers |

### 2.3 Repudiation

| Threat | Target | Current Mitigation | Residual Risk | Action |
|--------|--------|-------------------|---------------|--------|
| R1: Unattributed admin actions | Admin panel | Structured logging (logger.js) captures user_id, action | Low — all admin actions logged | Add audit trail table in Supabase |
| R2: Denial of article modifications | Edit history | article_versions table tracks all versions | Low — versions are immutable | No additional action needed |
| R3: API key usage without attribution | Plugin API calls | usage_logs table records all generations | Low — logs capture key_id + user_id | No additional action needed |

### 2.4 Information Disclosure

| Threat | Target | Current Mitigation | Residual Risk | Action |
|--------|--------|-------------------|---------------|--------|
| I1: Service role key exposure | Server environment | Env var only, never in code or disk files | Very Low — addressed in SEC-001 | Ensure Coolify secrets management |
| I2: Error details in HTTP responses | Bridge Server error handlers | Generic error messages in production | Medium — some endpoints still return stack traces | Audit all error responses, strip in production |
| I3: Health endpoint information leak | /health | Returns server version and uptime only (projectDir removed in SEC-001) | Very Low | No additional action needed |
| I4: API key exposure in browser | Dashboard key management UI | Keys shown only once at creation, masked in UI | Low — standard practice | No additional action needed |
| I5: GSC/GA4 data cross-tenant leak | performance_snapshots, content_inventory | RLS `auth.uid() = user_id` on all tables | Very Low — Supabase RLS enforced | Verify RLS on all 6 new tables before deployment |

### 2.5 Denial of Service

| Threat | Target | Current Mitigation | Residual Risk | Action |
|--------|--------|-------------------|---------------|--------|
| D1: Bridge server request flood | All endpoints | In-memory rate limiter (100 req/min per IP) | Medium — resets on restart, no persistent state | Add Cloudflare rate limiting rules as outer layer |
| D2: Claude CLI subprocess exhaustion | /apply-edit | Job queue serialization, 600s timeout, 4MB output cap | Low — queue prevents concurrent spawns | Monitor queue depth, alert if > 10 pending |
| D3: Supabase connection exhaustion | Database queries | 100 connection limit on Pro plan | Medium — no connection pooling in bridge server | Use Supabase connection pooler (PgBouncer built-in) |
| D4: Large article generation | Pipeline execution | No explicit memory limit on article generation | Medium — 193-component articles can be large | Cap article component count at 30 per article |

### 2.6 Elevation of Privilege

| Threat | Target | Current Mitigation | Residual Risk | Action |
|--------|--------|-------------------|---------------|--------|
| E1: Regular user → admin | Admin endpoints | requireAdmin() middleware, admin flag server-side only | Low — flag cannot be set by non-admins | Audit all admin flag checks quarterly |
| E2: Free tier → paid features | Quota enforcement | Server-side quota validation via quota-manager.js | Low — quotas enforced before generation | No additional action needed |
| E3: Plugin user → full API access | CMS plugin endpoints | API key scoped to specific endpoints, no admin access via plugin auth | Low — separate auth paths | Document API key scope limitations |

---

## 3. Authentication Flows

### 3.1 Dashboard Login (Supabase Auth)

```
Browser                    Dashboard (Next.js)         Supabase Auth          Bridge Server
  │                              │                          │                       │
  │──── Email + Password ───────►│                          │                       │
  │                              │──── signInWithPassword ─►│                       │
  │                              │◄──── JWT + refresh ──────│                       │
  │◄──── Set session cookie ─────│                          │                       │
  │                              │                          │                       │
  │──── API request + JWT ──────►│                          │                       │
  │                              │──── Bearer ${jwt} ──────►│──── verifyAuth() ────►│
  │                              │                          │◄── user object ───────│
  │                              │                          │                       │
  │                              │                    [SHA-256 cache: 30s TTL,     │
  │                              │                     200 entry max, LRU eviction] │
```

### 3.2 CMS Plugin Authentication (API Key)

```
WordPress/Shopify Plugin          Bridge Server                Supabase
       │                              │                          │
       │──── X-API-Key: key-xxx ─────►│                          │
       │                              │──── validateApiKey() ───►│
       │                              │     (api_keys table,     │
       │                              │      AES-256-GCM decrypt)│
       │                              │◄──── key record ─────────│
       │                              │                          │
       │                              │──── Check: is_active,    │
       │                              │     rate limits,          │
       │                              │     allowed endpoints     │
       │◄──── API response ───────────│                          │
```

### 3.3 OAuth Flow (GSC/GA4 — Phase 5)

```
Dashboard                    Bridge Server              Google OAuth 2.0
  │                              │                          │
  │──── POST /connections/       │                          │
  │     initiate {provider} ────►│                          │
  │                              │──── Generate PKCE        │
  │                              │     code_verifier +      │
  │                              │     code_challenge       │
  │                              │──── Store state in DB ──►│
  │◄──── Redirect URL ───────────│                          │
  │                              │                          │
  │──── User authorizes ─────────────────────────────────►│
  │◄──── Redirect with code ─────────────────────────────│
  │                              │                          │
  │──── POST /connections/       │                          │
  │     callback {code, state} ─►│                          │
  │                              │──── Verify state ────────│
  │                              │──── Exchange code ──────►│
  │                              │◄──── access + refresh ───│
  │                              │──── AES-256-GCM encrypt  │
  │                              │──── Store in             │
  │                              │     client_connections ──│
  │◄──── Connection confirmed ───│                          │
```

### 3.4 Session Refresh

```
Browser                    Bridge Server              Supabase Auth
  │                              │                          │
  │──── Request with             │                          │
  │     expired JWT ────────────►│                          │
  │                              │──── verifyAuth() fails   │
  │◄──── 401 Unauthorized ───────│                          │
  │                              │                          │
  │──── Supabase client-side     │                          │
  │     refreshSession() ───────────────────────────────►│
  │◄──── New JWT + refresh ──────────────────────────────│
  │                              │                          │
  │──── Retry with new JWT ─────►│                          │
  │                              │──── verifyAuth() OK ─────│
  │◄──── Success response ───────│                          │
```

### 3.5 Logout

```
Browser                    Dashboard                  Supabase Auth
  │                              │                          │
  │──── Click "Sign Out" ───────►│                          │
  │                              │──── signOut() ──────────►│
  │                              │     (invalidates         │
  │                              │      refresh token)      │
  │                              │◄──── Confirmed ──────────│
  │◄──── Clear session,          │                          │
  │      redirect to /login ─────│                          │
```

---

## 4. Authorization Matrix

### 4.1 Role × Resource × Operation

| Resource | Anonymous | Authenticated (Free) | Authenticated (Pro) | Authenticated (Enterprise) | Admin |
|----------|-----------|---------------------|--------------------|-----------------------------|-------|
| **Articles** | — | CRUD own (5/mo) | CRUD own (25/mo) | CRUD own (unlimited) | CRUD all |
| **Pipeline Jobs** | — | Read own, Create (5/mo) | Read own, Create (25/mo) | Read own, Create (unlimited) | Read all, Cancel any |
| **API Keys** | — | CRUD own (2 max) | CRUD own (5 max) | CRUD own (20 max) | CRUD all |
| **Settings** | — | Read/Update own | Read/Update own | Read/Update own | Read/Update all |
| **Blueprints** | — | Read all | Read all | Read all | Read all, Manage |
| **Webhooks** | — | — | CRUD own (5 max) | CRUD own (20 max) | CRUD all |
| **Admin Panel** | — | — | — | — | Full access |
| **User Management** | — | — | — | — | CRUD all users |
| **Subscriptions** | — | Read own | Read own | Read own | Read/Update all |
| **Usage Logs** | — | Read own | Read own | Read own | Read all |
| **GSC/GA4 Data** | — | — | Read own | Read own | Read all |
| **Intelligence** | — | — | Read own | Read own | Read all |
| **Voice Personas** | — | — | — | CRUD own | CRUD all |
| **Publishing** | — | — | Publish own (draft) | Publish own (draft) | Publish all |

### 4.2 Endpoint-Level Auth Requirements

| Endpoint Pattern | Auth Method | Rate Limit | Additional Checks |
|-----------------|-------------|-----------|-------------------|
| `POST /auth/signup` | None | 10/min per IP | Email validation |
| `POST /auth/login` | None | 10/min per email + IP | Account lockout after 5 failures |
| `GET /auth/verify` | Bearer JWT | 100/min per IP | SHA-256 cache, 30s TTL |
| `POST /apply-edit` | Bearer JWT | 10/min per user | Prompt guard, job queue |
| `GET /admin/*` | Bearer JWT + admin flag | 100/min per IP | requireAdmin() |
| `POST /generate/*` | Bearer JWT | 5/min per user | Quota check, prompt guard |
| `GET /articles/*` | Bearer JWT | 100/min per IP | RLS (own articles only) |
| `* /keys/*` | Bearer JWT | 30/min per user | Key ownership validation |
| `* /webhooks/*` | Bearer JWT | 30/min per user | Webhook ownership validation |
| `POST /plugin/*` | API Key (X-API-Key) | 100/min per key | Key validation, scope check |
| `GET /health` | None | 10/min per IP | No sensitive data returned |

---

## 5. Data Classification

| Category | Examples | Storage | Encryption | Retention | GDPR Basis |
|----------|----------|---------|-----------|-----------|------------|
| **Authentication Credentials** | Passwords, refresh tokens | Supabase Auth (managed) | bcrypt (passwords), encrypted (tokens) | Until account deletion | Contract performance |
| **API Keys** | User-generated API keys | api_keys table | AES-256-GCM (KeyManager) | Until revoked + 30 days | Contract performance |
| **OAuth Tokens** | GSC/GA4 access + refresh | client_connections table | AES-256-GCM (KeyManager) | Until disconnected + 7 days | Consent |
| **Personal Data** | Email, name | Supabase Auth | Supabase-managed encryption | Until account deletion | Contract performance |
| **Content Data** | Articles, versions, blueprints | articles, article_versions | Supabase at-rest encryption | User-controlled | Contract performance |
| **Analytics Data** | GSC clicks, GA4 engagement | performance_snapshots | Supabase at-rest encryption | 90-day raw + monthly rollups | Legitimate interest |
| **Usage Metrics** | Generation counts, API calls | usage_logs | Supabase at-rest encryption | 12 months rolling | Legitimate interest |
| **Intelligence Data** | Decay scores, recommendations | keyword_opportunities | Supabase at-rest encryption | Recalculated monthly | Legitimate interest |
| **Voice Profiles** | Writing style DNA, personas | writer_personas | Supabase at-rest encryption | Until persona deleted | Consent |

---

## 6. Incident Response Outline

| Severity | Example | Detection | Response Time | Actions |
|----------|---------|-----------|---------------|---------|
| **P0 — Critical** | Service role key exposed, database breach | Supabase alerts, log monitoring | < 1 hour | Rotate all keys, revoke all sessions, notify affected users |
| **P1 — High** | OAuth token leak, admin account compromise | Structured logging alerts | < 4 hours | Rotate affected tokens, force re-auth, audit access logs |
| **P2 — Medium** | Rate limiter bypass, prompt guard evasion | Weekly log review | < 24 hours | Update rules, deploy fix, review affected content |
| **P3 — Low** | Non-sensitive info disclosure, minor config issue | Quarterly audit | < 1 week | Fix in next sprint, document in SECURITY.md |
