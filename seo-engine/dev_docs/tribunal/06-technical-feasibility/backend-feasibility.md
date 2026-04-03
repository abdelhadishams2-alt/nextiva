# Backend Technical Feasibility Assessment

**Assessment Date:** 2026-03-28
**Assessed By:** Senior Engineer (Technical Tribunal)
**Scope:** ChainIQ v2 platform expansion — 6 new service layers against existing v1 codebase

---

## 1. Current Bridge Server Architecture

### Verified Codebase Facts (Not Assumptions)

The bridge server (`bridge/server.js`) is currently **1,471 lines** of pure Node.js with **zero npm dependencies**. It uses Node's built-in `http`, `crypto`, `child_process`, `fs`, and `path` modules, plus the native `fetch` API (Node 18+).

**Endpoint count (verified by grep):** 48 route handlers across these groups:

| Group | Endpoints | Auth Level |
|-------|-----------|------------|
| Health | 1 (GET /health) | None |
| Auth | 3 (signup, login, verify) | Public / Token |
| Admin | 6 (users, approve, revoke, delete, add-user, usage) | Admin role |
| Articles CRUD | 5 (list, get, create, update, delete + versions) | User / Admin |
| Pipeline | 3 (status, queue, history) | User |
| Analytics | 1 (overview) | User |
| Settings | 2 (get, put) | User |
| Quota | 4 (check, get, admin plans, admin stats) | User / Admin |
| API Keys | 5 (list, create, rotate, revoke, test) | Admin |
| Blueprints | 2 (list, categories) | User |
| Generate | 1 (POST /api/generate) | User |
| Queue | 4 (enqueue, cancel, status, progress SSE) | User |
| Webhooks | 3 (list, create, delete) | User |
| Edit | 1 (POST /apply-edit, SSE streaming) | User |
| Plugin Hub | 5 (heartbeat, config, user analytics, admin instances, admin config) | Mixed |

**Routing pattern:** Giant `if/else` chain inside a single `http.createServer()` callback. No Express, no Koa, no router library. URL matching uses string equality for simple routes and `urlPath.match()` regex for parameterized routes (`/api/articles/:id`). Query parameters are parsed manually.

**Middleware chain (inline, not modular):**
1. CORS headers (permissive `Access-Control-Allow-Origin: *`)
2. OPTIONS preflight handling
3. Request logging via `logger.logRequest()`
4. Per-route auth (`requireAuth()` or `requireAdmin()`)
5. Rate limiting via in-memory `Map` with 60-second windows
6. Auth verification cache (SHA-256 hashed tokens, 30s TTL)
7. Request body parsing (`readBody()` with 64KB limit)
8. Input validation (inline per endpoint)
9. Response logging via patched `json()` helper

**Zero-dep philosophy verification:** `package.json` contains zero `dependencies` or `devDependencies` at the bridge level. The only `require()` calls are to local modules (`./supabase-client`, `./logger`, `./prompt-guard`, `./job-queue`, `./webhooks`, `../engine/blueprint-parser`, `./key-manager`).

### Supabase Client (`bridge/supabase-client.js`)

Currently **1,155 lines**. Implements a full REST API client using native `fetch` against Supabase's PostgREST endpoints. Config loading supports env vars, `.supabase.json` file, and hardcoded defaults. Functions include: `signUp`, `signIn`, `verifyToken`, `getSubscription`, `adminListUsers`, `adminCreateUser`, `checkQuota`, `logUsage`, `listArticles`, `createArticle`, CRUD for all existing tables.

Adding 6 new tables means approximately 60-80 new functions (CRUD + specialized queries per table). This file will grow to approximately 2,000-2,500 lines. This is manageable but should be split into domain-specific modules (e.g., `supabase/ingestion.js`, `supabase/intelligence.js`, `supabase/publishing.js`).

---

## 2. server.js Growth Problem

**Current state:** 1,471 lines with 48 endpoints.
**Projected state:** Adding ~20 new endpoint groups (per Section 8 of PROJECT-BRIEF) means ~30-40 new route handlers. At the current density (~30 lines per endpoint), server.js would grow to **2,400-2,900 lines**.

**Assessment: This is the single biggest technical debt risk in the expansion.**

The PROJECT-BRIEF acknowledges this: "Refactor into route modules when it exceeds ~1500 lines." We are already at 1,471 lines — the threshold is effectively reached.

**Recommended approach (zero-dep compliant):**

```
bridge/
  server.js          (core: createServer, middleware, route dispatch — ~300 lines)
  routes/
    auth.js           (existing: signup, login, verify)
    admin.js          (existing: users, approve, revoke, delete, usage)
    articles.js       (existing: CRUD)
    pipeline.js       (existing: status, queue, history)
    generate.js       (existing: generate, queue ops)
    settings.js       (existing: get/put settings, quota)
    keys.js           (existing: API key CRUD)
    blueprints.js     (existing: list, categories)
    edit.js           (existing: apply-edit SSE)
    webhooks.js       (existing: CRUD)
    plugin.js         (existing: heartbeat, config, analytics)
    connections.js    (NEW: OAuth flows, account management)
    inventory.js      (NEW: content inventory CRUD)
    intelligence.js   (NEW: decay, gaps, cannibalization, recommendations)
    voice.js          (NEW: personas, corpus analysis)
    publish.js        (NEW: CMS push, history)
    performance.js    (NEW: predictions, tracking, recalibration)
```

Each route module exports a function `(req, res, { auth, readBody, json, supabase, ...helpers })` that returns `true` if it handled the request, `false` otherwise. The core server.js iterates through route modules in order. This preserves the zero-dep constraint while achieving separation.

**Effort: M (3-5 days) for the refactor itself, but it MUST happen before any new endpoints are added. Critical path item.**

---

## 3. OAuth2 Feasibility (Zero-Dep)

**Question:** Can we implement Google OAuth 2.0 (for GSC and GA4 consent) without npm dependencies?

**Answer: Yes.** The entire OAuth 2.0 Authorization Code flow requires only:

1. **Auth URL generation:** String concatenation of `https://accounts.google.com/o/oauth2/v2/auth` with query parameters (client_id, redirect_uri, scope, response_type=code, access_type=offline). No library needed.

2. **Token exchange:** `fetch()` POST to `https://oauth2.googleapis.com/token` with form-urlencoded body. Native fetch handles this.

3. **Token refresh:** Same endpoint, `grant_type=refresh_token`. Native fetch.

4. **Token encryption at rest:** Reuse `KeyManager.encrypt()` / `KeyManager.decrypt()` — AES-256-GCM via Node's built-in `crypto`. The pattern is proven (verified in `bridge/key-manager.js`, lines 66-97).

5. **PKCE (optional but recommended):** `crypto.randomBytes(32)` for code_verifier, `crypto.createHash('sha256')` for code_challenge. All built-in.

**What KeyManager already provides that we reuse directly:**
- `encrypt(plaintext)` returns `iv:authTag:ciphertext` (hex-encoded, colon-separated)
- `decrypt(encryptedValue)` reverses it
- `generateHint()` for display purposes
- `getEncryptionKey()` from env var or auto-generated

**The `bridge/oauth.js` module** needs to store two encrypted tokens per connection (access_token + refresh_token) in the `client_connections` table. The KeyManager pattern handles this identically to API key storage. Confirmed feasible.

**Risk: Google OAuth consent screen verification takes 2-6 weeks.** During this period, the app is limited to 100 test users. For enterprise clients (SRMG pilot), 100 users is sufficient. Verification should be submitted on Day 1 of development, not when the code is ready.

---

## 4. Supabase Schema Extension

### Migration Strategy

The current schema has **6 tables** (subscriptions, usage_logs, articles, article_versions, pipeline_jobs, user_settings, api_keys, plugin_instances, plugin_config — actually 9 based on the brief). Six new tables are proposed:

| New Table | Estimated Row Volume (per client/month) | RLS Complexity |
|-----------|----------------------------------------|----------------|
| client_connections | ~10 (static) | Low — user_id match |
| content_inventory | ~10,000 initial, ~500 delta/month | Low — user_id match |
| performance_snapshots | **~300,000** (10K URLs x 30 days) | Medium — user_id match + date range |
| keyword_opportunities | ~500-2,000 | Low — user_id match |
| writer_personas | ~5-20 (static) | Low — user_id match |
| performance_predictions | ~100-500 | Low — user_id match |

### RLS Policies Required

All six tables follow the same pattern as existing tables: `USING (auth.uid() = user_id)` for SELECT, `WITH CHECK (auth.uid() = user_id)` for INSERT/UPDATE. The existing `supabase-setup.sql` shows this exact pattern. No complex cross-table RLS is needed.

**One exception:** `performance_snapshots` needs a service-role bypass for the scheduler (daily data pulls run server-side, not as a user). The scheduler will use the `service_role` key (already available via `supabase.getServiceRoleKey()`), which bypasses RLS entirely. This is the same pattern used for admin operations.

### Index Design

Critical indexes (verified by the brief's own notes):

```sql
-- performance_snapshots: the hot table
CREATE INDEX idx_perf_snap_user_date ON performance_snapshots (user_id, snapshot_date DESC);
CREATE INDEX idx_perf_snap_content_date ON performance_snapshots (content_id, snapshot_date DESC);

-- content_inventory: frequent lookups by URL
CREATE UNIQUE INDEX idx_content_inv_user_url ON content_inventory (user_id, url);

-- keyword_opportunities: filtered by status and score
CREATE INDEX idx_kw_opp_user_status ON keyword_opportunities (user_id, status, priority_score DESC);
```

### Aggregation Strategy for performance_snapshots

The brief calls out the 300K rows/month problem. Strategy:

1. **Daily snapshots:** Retained for 90 days (rolling window)
2. **Weekly aggregates:** Computed from daily, retained for 1 year
3. **Monthly aggregates:** Computed from weekly, retained indefinitely
4. **Purge job:** Supabase cron (pg_cron extension) or scheduler.js deletes daily rows older than 90 days

A `performance_snapshots_monthly` rollup table is needed (not in the brief — add it). Fields: user_id, content_id, month (date), avg_clicks, avg_impressions, avg_ctr, avg_position, total_sessions. This reduces long-term storage by 30x.

**Supabase free tier limit:** 500MB database. At 300K rows/month with ~200 bytes per row (conservative), that is ~60MB/month. Supabase Pro ($25/mo) provides 8GB. A single enterprise client fills this in ~4 months without aggregation. **With the 90-day purge + monthly rollup, storage stays under 2GB indefinitely.** This is manageable on Supabase Pro but must be monitored.

---

## 5. Scheduler Feasibility

**Context:** The bridge server runs as a long-lived Node.js process on Hetzner (via Coolify). It needs to trigger daily GSC/GA4 pulls and weekly Semrush/Ahrefs pulls per client.

**Option A: setInterval-based (zero-dep)**
- `setInterval(() => runDailyPull(), 24 * 60 * 60 * 1000)` with drift correction
- Track last-run timestamps in Supabase (`scheduler_state` table or JSONB field)
- On process restart, check if a pull was missed and run immediately
- Pros: Zero deps, simple, works with existing architecture
- Cons: Timer drift over weeks, single-process failure point, no cron expression support

**Option B: Supabase pg_cron**
- PostgreSQL extension available on Supabase Pro
- `SELECT cron.schedule('daily-gsc-pull', '0 3 * * *', $$SELECT ...$$)` triggers a database function
- The function inserts a row into a `scheduled_tasks` queue table
- The bridge server polls this table every 60 seconds and executes pending tasks
- Pros: Survives Node process restarts, real cron expressions, database-native
- Cons: Requires Supabase Pro, adds polling overhead, more complex

**Recommendation: Hybrid.** Use setInterval for the primary schedule (it works fine for a single Hetzner process managed by Coolify's auto-restart). Store last-run timestamps in Supabase. On startup, run any missed jobs. This is simpler and stays zero-dep. Move to pg_cron only if reliability becomes an issue with multiple clients.

**Effort: S (1-2 days) for basic scheduler, M (3-5 days) with retry logic and per-client scheduling.**

---

## 6. KeyManager Reuse for OAuth Token Encryption

**Confirmed: Direct reuse.** The `KeyManager` class (`bridge/key-manager.js`, 351 lines) provides:

- `encrypt(plaintext)` — AES-256-GCM, returns `iv:authTag:ciphertext`
- `decrypt(encryptedValue)` — reverses encryption
- Key derivation from `BRIDGE_ENCRYPTION_KEY` env var (32-byte hex or base64)
- Auto-generated ephemeral key for development (with warning log)

OAuth tokens (access_token ~2KB, refresh_token ~500 bytes) are well within the encryption function's capacity. The `client_connections` table stores `access_token_encrypted` and `refresh_token_encrypted` as TEXT columns — identical to how `api_keys.key_value_encrypted` works today.

**No modification to key-manager.js needed.** Import and call `encrypt()`/`decrypt()` from the new `bridge/oauth.js` module. The PROJECT-BRIEF's PROTECT LIST explicitly states: "Working AES-256-GCM encryption — reuse pattern, don't modify."

---

## 7. Zero-Dependency Constraint Analysis

**Features achievable with zero npm deps:**

| Feature | How (zero-dep) |
|---------|----------------|
| OAuth 2.0 flow | Native fetch + crypto |
| GSC/GA4 API clients | Native fetch (REST APIs) |
| Semrush/Ahrefs API clients | Native fetch (REST APIs) |
| Google Trends | Native fetch (public API) |
| HTTP crawler | Native http/https.get() |
| HTML parsing (basic) | Regex + string manipulation for article extraction |
| Token encryption | Existing KeyManager (crypto module) |
| Scheduler | setInterval + Date arithmetic |
| SSE streaming | Already implemented in edit endpoint (raw HTTP response writing) |
| JSON processing | Built-in JSON.parse/stringify |
| URL parsing | Built-in URL class |
| Rate limiting | In-memory Map (already implemented) |
| HMAC signatures | crypto.createHmac() (already used in webhooks) |

**Features that CANNOT be done well without npm deps:**

| Feature | Why | Potential Dep | Risk |
|---------|-----|---------------|------|
| HDBSCAN clustering (writer detection) | Density-based clustering algorithm requires matrix operations. Implementing from scratch is 500+ lines of math with high bug risk. | `hdbscan` or custom implementation | HIGH — may need to break zero-dep rule |
| Robust HTML parsing (crawler) | Regex-based HTML parsing breaks on malformed HTML, nested tags, scripts. Real content extraction needs a DOM parser. | `htmlparser2` (zero-dep itself, 40KB) or `cheerio` | MEDIUM — regex works for 80% of sites |
| CSV export (reports) | Trivial to implement manually but edge cases (commas in fields, Unicode) are tricky. | None needed — manual is fine | LOW |
| PDF report generation | Cannot be done without a library. | `pdfkit` or server-side Puppeteer | LOW — not P0 feature |

**HDBSCAN is the critical decision.** Three options:

1. **Implement simplified clustering in pure JS** — Use k-means (simpler) instead of HDBSCAN. K-means is ~100 lines. Downside: requires specifying number of clusters upfront (HDBSCAN auto-detects). Mitigation: run k-means for k=2 through k=8, pick best silhouette score.

2. **Shell out to Python** — Install `hdbscan` via pip on the Hetzner server. Call via `child_process.spawn('python3', ['cluster.py', ...])`. Zero npm deps in Node, but adds a Python runtime dependency. This is arguably within the spirit of the constraint.

3. **Break the zero-dep rule for one package** — Add `ml-hdbscan` or similar to `package.json`. Impact: minimal (one dep), but sets a precedent.

**Recommendation: Option 1 (simplified k-means) for MVP, Option 2 (Python shell-out) for production.** Voice analysis is a Layer 3 feature that can launch with simpler clustering and upgrade later.

---

## 8. Performance Concerns

### performance_snapshots Table Growth

For a single enterprise client with 10,000 URLs:
- **Daily ingestion:** 10,000 rows (one per URL per day for GSC data)
- **Monthly growth:** ~300,000 rows
- **Annual growth:** ~3.6M rows

With 5 enterprise clients: **~18M rows/year.**

**Mitigation strategy (required, not optional):**

1. **Partition by month:** Use Supabase's PostgreSQL table partitioning (`PARTITION BY RANGE (snapshot_date)`). Each month is a separate physical table. Queries on recent data stay fast.

2. **90-day rolling purge:** Delete daily granularity older than 90 days. Keep monthly aggregates forever.

3. **Materialized views for dashboards:** Pre-compute weekly/monthly aggregates. Refresh nightly.

4. **Query optimization:** All dashboard queries MUST include `user_id` and date range in WHERE clause. The composite index `(user_id, snapshot_date DESC)` makes this efficient.

**Without these mitigations, the table will degrade query performance within 6 months of a single enterprise deployment.**

### API Cost Management

Per the brief: Semrush ($80-150/mo/client), Ahrefs ($50-120/mo/client). The 7-day caching layer is essential.

**Caching strategy:**
- Cache Semrush/Ahrefs responses in a `api_cache` table (key: provider+endpoint+params hash, value: JSONB, expires_at)
- TTL: 7 days for keyword data, 1 day for SERP data, 30 days for backlink profiles
- Cache-aside pattern: check cache, if miss fetch from API + store
- Estimated API cost reduction: 60-70% (per brief's own estimate)

---

## 9. Bridge Server as SaaS: localhost to Hetzner

The bridge currently binds to `127.0.0.1:19847`. Moving to a public Hetzner server requires:

### CORS

Current: `Access-Control-Allow-Origin: *` (permissive, fine for localhost). For production: restrict to dashboard domain + plugin origins. Implement allowlist:

```javascript
const ALLOWED_ORIGINS = [
  'https://app.chainiq.io',
  'https://dashboard.chainiq.io',
  /^https:\/\/.*\.chainiq\.io$/  // subdomains
];
```

**Effort: S** — straightforward change in the existing CORS header logic.

### SSL/TLS

Coolify provides automatic SSL via Let's Encrypt for custom domains. The bridge server itself stays HTTP internally; Coolify's reverse proxy (Traefik/Caddy) terminates TLS. **No code changes needed.**

### Rate Limiting

Current implementation: in-memory `Map` with 60-second windows, configurable max attempts. This works for a single process but does not survive restarts and cannot be shared across multiple processes.

**For single-process Hetzner deployment (Phase 1):** Current implementation is sufficient. Add IP-based rate limiting in addition to the existing key-based limiting.

**For multi-process deployment (future):** Move rate limit state to Supabase (a `rate_limits` table with TTL) or Redis. Not needed for MVP.

### DDoS Protection

**Cloudflare (free tier):** Place the bridge domain behind Cloudflare. Provides DDoS mitigation, WAF rules, and geographic filtering. Zero code changes. **This is the recommended approach.**

**Application-level:** The existing `checkRateLimit()` function provides basic protection. Add:
- IP-based request limiting (100 req/min per IP)
- Request body size limit (already 64KB)
- Connection timeout (add `server.timeout = 30000`)
- Max concurrent connections (add `server.maxConnections = 1000`)

**Effort: S (1-2 days)** for application-level hardening. Cloudflare setup is infrastructure, not code.

---

## 10. Feature Feasibility Table — 6 New Service Layers

| Service Layer | Key Module | Feasible (Zero-Dep)? | Effort | Risk | Notes |
|---------------|-----------|----------------------|--------|------|-------|
| **Data Ingestion** | | | | | |
| Google OAuth2 flow | bridge/oauth.js | YES | M | Medium | Verification timeline is the risk, not code |
| GSC API client | bridge/ingestion/gsc.js | YES | M | Low | Well-documented REST API |
| GA4 API client | bridge/ingestion/ga4.js | YES | M | Low | GA4 Data API v1, native fetch |
| Semrush API client | bridge/ingestion/semrush.js | YES | M | Medium | Rate limits, pagination, API key costs |
| Ahrefs API client | bridge/ingestion/ahrefs.js | YES | M | Medium | API v3, token auth, rate limits |
| Google Trends client | bridge/ingestion/trends.js | YES | S | Low | Public API, no auth |
| HTTP crawler | bridge/ingestion/crawler.js | YES (partial) | L | Medium | Regex HTML parsing breaks on edge cases |
| Scheduler | bridge/ingestion/scheduler.js | YES | M | Low | setInterval + Supabase state tracking |
| **Content Intelligence** | | | | | |
| Decay detector | bridge/intelligence/decay-detector.js | YES | M | Low | Math on performance_snapshots data |
| Gap analyzer | bridge/intelligence/gap-analyzer.js | YES | M | Low | Semrush data comparison |
| Cannibalization detector | bridge/intelligence/cannibalization.js | YES | M | Low | GSC query data + content map matching |
| Scoring formula | (inline in intelligence modules) | YES | S | Low | Weighted arithmetic |
| **Voice Intelligence** | | | | | |
| Stylometric analysis | bridge/intelligence/voice-analyzer.js | YES | L | Medium | NLP features (sentence length, TTR, etc.) |
| AI vs human classification | bridge/intelligence/voice-analyzer.js | YES | L | High | Accuracy uncertain without ML library |
| Writer clustering (HDBSCAN) | bridge/intelligence/voice-analyzer.js | PARTIAL | XL | High | Needs simplified clustering or Python shim |
| Persona generation | bridge/intelligence/voice-analyzer.js | YES | M | Low | Structured JSON from analysis output |
| **Quality Gate** | | | | | |
| 60-point SEO checklist | engine/quality-gate.js | YES | L | Low | Port from old-seo-blog-checker |
| 7-signal scoring rubric | engine/quality-gate.js | YES | L | Medium | Voice match scoring needs voice analyzer first |
| Auto-revision loop | (pipeline integration) | YES | M | Medium | Max 2 passes, needs error handling |
| **Publishing** | | | | | |
| WordPress REST API | bridge/publishing/wordpress.js | YES | L | Medium | Builder compatibility testing needed |
| Shopify Blog API | bridge/publishing/shopify.js | YES | M | Low | Simpler than WordPress |
| Generic webhook | bridge/webhooks.js (extend) | YES | S | Low | Already have webhook infrastructure |
| **Feedback Loop** | | | | | |
| Performance tracker | bridge/intelligence/performance-tracker.js | YES | M | Low | Compare predictions to actuals |
| Recalibration engine | (extends scoring formula) | YES | L | Medium | Needs 3+ months of data to calibrate |

**Summary:** 22 of 24 features are fully feasible with zero npm dependencies. HDBSCAN clustering is the only hard blocker requiring a compromise (simplified algorithm or Python shim). Robust HTML parsing is a soft blocker (regex works for most sites, fails on edge cases).
