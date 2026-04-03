# ChainIQ Architecture Anchor

> **Last Updated:** 2026-03-28
> **Version:** 1.0
> **Purpose:** Primary recovery document. Load this FIRST in every new session.
> **Word Budget:** ~2800 words (hard cap 3000)

---

## 1. System Shape

ChainIQ is a **6-layer AI Content Intelligence Platform** with **12 services** (6 existing, 6 new) and **7 agents** in the generation pipeline. It follows a **SaaS-connected model** where all intelligence runs server-side; CMS plugins are thin API clients.

**Layers:**

| Layer | Name | Role | Status |
|-------|------|------|--------|
| 0 | Auth & Bridge | Central backend, auth, section editing | Built |
| 1 | Data Ingestion | GSC/GA4/Semrush/Ahrefs connectors, crawler, scheduler | Planning |
| 2 | Content Intelligence | Decay detection, gap analysis, topic recommender | Planning |
| 3 | Voice Intelligence | Corpus analysis, AI/human classifier, writer personas | Planning |
| 4 | Generation Pipeline | 7-agent article factory with quality gate | Built (extend) |
| 5 | Universal Publishing | WordPress, Shopify, Ghost, webhook, CMS adapters | Planning |
| 6 | Feedback Loop | 30/60/90 day tracking, prediction vs actual, recalibration | Planning |

**Data flow direction:** L1 -> L2 -> L3 -> L4 -> L5 -> L6 -> (recalibrates L2). Each layer reads from Supabase tables written by the layer above it.

**Two operating modes:**
- **Mode A (User-Driven):** User provides keyword -> pipeline executes. No intelligence layer. Current v1 behavior.
- **Mode B (Agent-Recommended):** User provides category -> intelligence returns scored recommendations -> user picks -> voice-matched generation -> quality gate -> publish -> feedback. This is the product's core value.

---

## 2. Tech Stack

| Component | Choice | Constraint |
|-----------|--------|-----------|
| Bridge Server | Node.js (zero npm deps), raw `http.createServer()` | LOCKED. Built-in modules only: http, crypto, child_process, fs, path, native fetch |
| Database | Supabase PostgreSQL (Pro $25/mo) | LOCKED. 8GB storage, 100 connections, RLS everywhere |
| Dashboard | Next.js 16 + shadcn/ui (base-ui variant) + Tailwind CSS | LOCKED. App Router, warm dark mode, gold accents |
| Auth | Supabase Auth (JWT) + Bearer token validation + SHA-256 cache (30s TTL) | LOCKED |
| Encryption | AES-256-GCM via KeyManager (bridge/key-manager.js, 351 lines) | LOCKED. Format: `iv:authTag:ciphertext` hex-encoded |
| Hosting (bridge) | Hetzner CPX21 (3 vCPU, 4GB RAM, EUR 7.50/mo) + Coolify | Planned |
| Hosting (dashboard) | Vercel or Hetzner/Coolify | TBD |
| CDN / DDoS | Cloudflare free tier | Planned |
| Testing | node:test (built-in) | LOCKED. 228 existing tests, 13 suites |
| Plugins | SaaS-connected thin clients (PHP for WP, embedded app for Shopify) | LOCKED |
| Scheduler | setInterval + Supabase state tracking (drift correction) | Zero deps |
| ORM | None. Supabase REST client (supabase-client.js, 1155 lines, native fetch) | Zero deps |

**Total infrastructure cost:** ~$34/month (Hetzner $9 + Supabase $25).

---

## 3. Services

| # | Service | Slug | One-Line Responsibility |
|---|---------|------|------------------------|
| 1 | Auth & Bridge Server | `auth-bridge` | Central HTTP server (48 endpoints), auth middleware, SSE edit handler, Claude CLI subprocess spawner |
| 2 | Article Pipeline | `article-pipeline` | 4-agent pipeline (project-analyzer -> research-engine -> article-architect -> draft-writer) with 7 framework adapters |
| 3 | Dashboard API | `dashboard-api` | Full CRUD REST API for dashboard operations and admin panel |
| 4 | Universal Engine | `universal-engine` | 11-language support, RTL, 7 framework adapters, 3 adaptation modes, 193 component blueprints |
| 5 | Analytics | `analytics` | Generation statistics, error tracking, usage metrics |
| 6 | Admin & User Management | `admin-users` | User CRUD, subscription management, quotas, plan enforcement |
| 7 | Data Ingestion | `data-ingestion` | GSC/GA4/Semrush/Ahrefs API clients, HTTP crawler, ingestion scheduler, unified ContentPerformanceRecord |
| 8 | Content Intelligence | `content-intelligence` | Decay detection, keyword gap analysis, cannibalization guard, topic recommender, opportunity scoring |
| 9 | Voice Intelligence | `voice-intelligence` | Corpus crawler, stylometric analysis, AI/human classifier, writer clustering, persona generation |
| 10 | Quality Gate | `quality-gate` | 60-point SEO checklist, 7-signal scoring (E-E-A-T, completeness, voice, AI detection, freshness, tech SEO, readability), auto-revision loop (max 2 passes) |
| 11 | Publishing | `publishing` | WordPress plugin (wp_insert_post), Shopify app, Ghost adapter, webhook publisher, draft-first, Yoast/RankMath meta |
| 12 | Feedback Loop | `feedback-loop` | 30/60/90 day GSC+GA4 tracking, prediction vs actual comparison, scoring weight recalibration |

---

## 4. Data Model

### Existing Tables (9)

subscriptions, usage_logs, articles, article_versions, pipeline_jobs, user_settings, api_keys, plugin_instances, plugin_config

### New Tables (6)

| Table | Est. Rows/Client/Mo | Key Indexes | Purpose |
|-------|---------------------|-------------|---------|
| client_connections | ~10 (static) | user_id | OAuth tokens (AES-256-GCM encrypted), provider, status, scopes |
| content_inventory | ~10K initial + 500/mo | (user_id, url) UNIQUE | Every URL on client's site with metadata |
| performance_snapshots | ~300K | (user_id, snapshot_date DESC), (content_id, snapshot_date DESC) | Daily GSC+GA4 metrics per URL. GROWTH RISK: requires monthly partitioning, 90-day purge, monthly rollup |
| keyword_opportunities | 500-2000 | (user_id, status, priority_score DESC) | Scored topic recommendations from intelligence layer |
| writer_personas | 5-20 (static) | user_id | Detected voice profiles with style DNA |
| performance_predictions | 100-500 | user_id, article_id | Predicted vs actual performance comparison |

### Critical Relationships

- All tables: UUID PKs, created_at/updated_at, RLS `auth.uid() = user_id`
- performance_snapshots -> content_inventory (content_id FK, MUST have explicit index)
- performance_predictions -> articles (article_id FK)
- keyword_opportunities recalibrated by feedback_loop after 3+ months

### Storage Math

Single enterprise client (10K URLs): ~60MB/month in performance_snapshots. Without 90-day purge + monthly rollup, fills 8GB Supabase Pro in ~4 months.

---

## 5. Active Constraints

1. **Zero npm dependencies** -- bridge server uses ONLY Node.js built-ins + native fetch. No Express, no Koa, no router library. 22 of 24 planned capabilities work under this constraint. Exceptions: HDBSCAN (k-means for MVP, Python shim for production) and robust HTML parsing (regex for 80%, defer upgrade).

2. **RLS everywhere** -- every table enforces `USING (auth.uid() = user_id)` for SELECT and `WITH CHECK (auth.uid() = user_id)` for INSERT/UPDATE. The scheduler uses service_role key to bypass RLS (server-side only, never exposed to clients).

3. **Draft-first publishing** -- all CMS publishing creates drafts. Never auto-publish to production. One-click promote is a deliberate editorial workflow choice.

4. **Arabic-first** -- initial market is MENA publishers (SRMG). RTL support, Arabic typography, CSS logical properties are not afterthoughts. Basic RTL CSS + Arabic font loading in Phase A design system work.

5. **SaaS-connected plugins** -- CMS plugins are thin clients making API calls to the bridge server. All intelligence, scoring, and generation logic runs server-side. Protects the 193-component blueprint registry and scoring algorithms as IP.

6. **Store money as integer cents** -- API cost tracking and ROI calculations use integer cents, not floating point.

7. **UUID primary keys everywhere** -- no auto-increment (leaks record counts in multi-tenant SaaS).

8. **Explicit FK indexes** -- PostgreSQL does NOT auto-index foreign key columns. Every FK needs a manual index.

---

## 6. Rejected Alternatives

| Rejected | Why | Chosen Instead |
|----------|-----|---------------|
| Vercel/Railway/Netlify for bridge | Execution time limits (10-60s) cannot support SSE, subprocess spawning, or scheduler | Hetzner + Coolify |
| Express/Koa/Hono | Breaks zero-dep constraint, existing codebase proven with 228 tests | Raw Node.js http.createServer() |
| npm packages for clustering | Sets precedent, supply chain risk | K-means in pure JS (MVP), Python child_process shim (production) |
| Serverless functions | Cannot support long-running SSE connections, Claude CLI subprocesses, or ingestion scheduler | Persistent VPS with Coolify auto-restart |
| Self-contained plugins | Exposes scoring algorithms, 193 blueprints, voice analysis engine in plugin code | SaaS-connected thin clients |
| Prisma/Drizzle/Knex ORM | Adds npm dependency, existing Supabase REST client works (1155 lines) | supabase-client.js with PostgREST |
| Firebase/PlanetScale/Neon | Supabase already exists with working schema, RLS, Auth integration | Supabase PostgreSQL |
| Jest/Vitest/Mocha | Adds npm dependency | node:test (built-in since Node 18) |
| Radix/MUI/Chakra UI | shadcn/ui (base-ui variant) already exists, customizable, no runtime deps | shadcn/ui (base-ui) |
| Self-hosted PostgreSQL | Managed service reduces ops burden for solo developer | Supabase Pro ($25/mo) |
| A/B headline testing | High effort, niche demand, better served by dedicated tools | Won't Have (tribunal binding verdict) |

---

## 7. API Contract Summary

### Bridge Server Route Modules (after Sprint 1 split)

| Module | Endpoint Count | Auth Pattern | Notes |
|--------|---------------|-------------|-------|
| auth.js | 3 | Public (signup, login) + Bearer (verify) | Existing |
| admin.js | 5+ | requireAdmin() | Existing |
| articles.js | 4+ | requireAuth() | Existing CRUD |
| pipeline.js | 3+ | requireAuth() | Existing |
| generate.js | 3+ | requireAuth() | Existing |
| settings.js | 3+ | requireAuth() | Existing |
| keys.js | 4+ | requireAuth() | Existing CRUD |
| blueprints.js | 2+ | requireAuth() | Existing |
| edit.js | 1 | requireAuth() | SSE, existing |
| webhooks.js | 4+ | requireAuth() | Existing CRUD |
| plugin.js | 3+ | API key | Existing |
| connections.js | 4+ | requireAuth() | NEW: OAuth flows |
| inventory.js | 3+ | requireAuth() | NEW: content CRUD |
| intelligence.js | 5+ | requireAuth() | NEW: decay, gaps, recommendations |
| voice.js | 3+ | requireAuth() | NEW: personas, corpus |
| publish.js | 3+ | requireAuth() | NEW: CMS push |
| performance.js | 4+ | requireAuth() | NEW: tracking, predictions |

**Total:** ~48 existing + ~22 new = ~70 endpoints post-expansion.

### Auth Patterns

- **Dashboard users:** Supabase Auth JWT -> Bearer token -> verifyAuth() middleware -> SHA-256 cache (30s TTL)
- **CMS plugins:** API key header -> key validation against api_keys table
- **Admin ops:** requireAdmin() -> checks admin flag on user record
- **Scheduler/server-side:** service_role key (bypasses RLS entirely)

### Rate Limiting

In-memory Map, 60-second windows, 100 req/min per IP + key-based limiting. Resets on server restart (acceptable for MVP, Redis upgrade deferred).

### External API Costs

| API | Auth | Phase | Cache TTL |
|-----|------|-------|-----------|
| GSC | OAuth 2.0 | A | 1 day |
| GA4 | OAuth 2.0 | A | 1 day |
| Semrush | API key | B | 7 days (keywords), 1 day (SERP) |
| Ahrefs | API token | B | 7 days (keywords), 30 days (backlinks) |
| Google Trends | Public | D | 7 days |

7-day caching reduces Semrush/Ahrefs costs by 60-70%.

---

## 8. Anti-Hallucination Anchors

These facts are verified and MUST NOT be contradicted in any session:

| Fact | Wrong Version to Avoid |
|------|----------------------|
| Bridge server is **raw Node.js http.createServer()** | NOT Express, NOT Koa, NOT Hono |
| Dashboard uses **shadcn/ui (base-ui variant)** | NOT Radix directly, NOT MUI, NOT Chakra |
| Database is **Supabase PostgreSQL** | NOT Firebase, NOT PlanetScale, NOT Neon |
| Pipeline has **7 agents** (Topic Recommender, Voice Analyzer, Project Analyzer, Research Engine, Article Architect, Draft Writer, Quality Gate) | NOT 4 agents (that was v1 count) |
| Platform has **12 services** (6 existing + 6 new) | NOT 6 services (that is existing-only count) |
| Architecture has **6 layers** | NOT 4 layers, NOT 3 tiers |
| Bridge server has **zero npm dependencies** | NOT "minimal dependencies" |
| Component blueprints: **193 components** | NOT "hundreds" or "~200" |
| Existing tests: **228 tests across 13 suites** | NOT "no tests" (that was pre-hardening) |
| Existing tables: **9 tables** | NOT "6 tables" |
| New tables: **6 tables** | NOT "4 tables" |
| Bridge server: **1,471 lines, 48 endpoints** | NOT "12 endpoints" (12 was early count) |
| Supabase REST client: **1,155 lines** | NOT "using an ORM" |
| KeyManager: **351 lines, AES-256-GCM** | NOT "AES-256-CBC" |
| Encryption format: **iv:authTag:ciphertext (hex, colon-separated)** | NOT base64, NOT JSON |
| Hosting: **Hetzner + Coolify** | NOT Vercel (for bridge), NOT AWS, NOT Railway |
| Infrastructure cost: **~$34/month** (Hetzner $9 + Supabase $25) | NOT "$100+/month" |
| Quality Gate: **7-signal scoring, max 2 revision passes** | NOT "unlimited revisions" |
| Phases: **A through E** (5 phases, 30+ weeks) | NOT "3 phases" |
| Must Have features: **26 of 93** | NOT "all features are MVP" |
| Won't Have features: **2** (#68 A/B headline testing, #90 A/B headline tracking) | NOT "everything is planned" |
| Initial market: **MENA Arabic publishers (SRMG)** | NOT "US-first" |
| HDBSCAN approach: **K-means for MVP, Python shim for production** | NOT "npm package" |
| Scheduler: **setInterval with Supabase state tracking** | NOT node-cron, NOT pg_cron |

---

## Update Protocol

This document is updated:
1. After every architectural decision that changes services, layers, or tech stack
2. After every tribunal verdict that creates binding constraints
3. At the start of each new phase (A, B, C, D, E)
4. When any anti-hallucination anchor is discovered to be stale

Update process: modify the relevant section, bump the date, and increment version.
