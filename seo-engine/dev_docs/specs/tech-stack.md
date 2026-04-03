# ChainIQ Tech Stack

**Last Updated:** 2026-03-28
**Source:** PROJECT-BRIEF (locked tech stack), backend feasibility assessment, tribunal technical consensus
**Audience:** Engineering, new contributors, DevOps
**Purpose:** Every technology choice with rationale and relevant gotchas

---

## Stack Summary

| Component | Technology | Status |
|-----------|-----------|--------|
| Bridge Server | Node.js (zero npm deps) | Locked |
| Database | Supabase PostgreSQL | Locked |
| Dashboard | Next.js 16 + shadcn/ui (base-ui) + Tailwind CSS | Locked |
| Auth | Supabase Auth + Bearer tokens | Locked |
| Encryption | AES-256-GCM via KeyManager | Locked |
| Hosting (bridge) | Hetzner + Coolify | Planned (Phase A Sprint 1) |
| Hosting (dashboard) | Vercel or Hetzner/Coolify | TBD |
| CDN / DDoS | Cloudflare (free tier) | Planned (Phase A Sprint 1) |
| Testing | node:test (built-in) | Locked |
| Plugins | SaaS-connected thin clients | Locked |
| WordPress | PHP plugin via wp_insert_post | Planned (Phase B) |

---

## Bridge Server: Node.js (Zero npm Dependencies)

**What:** Pure Node.js HTTP server using only built-in modules (`http`, `crypto`, `child_process`, `fs`, `path`) and native `fetch` (Node 18+). Currently 1,471 lines, 48 endpoints.

**Rationale:**
- Existing codebase with 228 passing tests across 13 suites -- proven and battle-tested
- Zero-dep philosophy eliminates supply chain attack surface entirely
- No `node_modules` means instant deploys, tiny container images, and zero dependency conflicts
- Native `fetch` (Node 18+) handles all HTTP client needs
- Built-in `crypto` handles AES-256-GCM encryption, HMAC, SHA-256, and PKCE

**What this enables without npm packages:**
- OAuth 2.0: auth URL generation (string concatenation), token exchange (native fetch), PKCE (crypto.randomBytes + createHash)
- All API clients: GSC, GA4, Semrush, Ahrefs, Google Trends (native fetch against REST APIs)
- HTTP crawling: native `http.get()` / `https.get()`
- HTML parsing: regex + string manipulation (works for ~80% of sites)
- Scheduling: `setInterval` with Supabase state tracking
- SSE streaming: raw HTTP response writing (already implemented)
- Rate limiting: in-memory Map (already implemented)
- HMAC webhook signatures: `crypto.createHmac()` (already implemented)

**What challenges the zero-dep constraint:**
- HDBSCAN clustering for writer detection: k-means (pure JS) for MVP, Python shim for production
- Robust HTML parsing: regex works for most sites but fails on malformed HTML. Consider `htmlparser2` (40KB, zero deps itself) if accuracy becomes critical.

**GOTCHA (testing):** The bridge server uses `async` I/O throughout. Never use `fs.readFileSync`, `fs.writeFileSync`, or `fs.existsSync` in request handlers -- these block the event loop and degrade all concurrent requests. Use `await fs.promises.readFile()` and `await fs.promises.access()` exclusively.

---

## Database: Supabase PostgreSQL

**What:** Managed PostgreSQL database with built-in Auth, RLS (Row-Level Security), real-time subscriptions, and REST API (PostgREST).

**Rationale:**
- Already exists from v1 with working schema, RLS policies, and auth integration
- RLS provides multi-tenant isolation at the database level (`auth.uid() = user_id`)
- PostgREST API eliminates the need for an ORM -- the existing `supabase-client.js` (1,155 lines) implements a full REST client using native fetch
- Supabase Pro ($25/month) provides 8GB storage, 100 concurrent connections, pg_cron for scheduled database tasks
- Real-time subscriptions available for future live dashboard updates

**Current schema:** 9 tables (subscriptions, usage_logs, articles, article_versions, pipeline_jobs, user_settings, api_keys, plugin_instances, plugin_config).

**New tables (6):** client_connections, content_inventory, performance_snapshots, keyword_opportunities, writer_personas, performance_predictions. All with RLS policies, explicit indexes on every FK column, and UUID primary keys.

**GOTCHA (database):** PostgreSQL does NOT auto-index foreign key columns. Every FK column needs an explicit index. Missing the index on `user_id` in `performance_snapshots` will cause full table scans as data grows to 300K+ rows/month.

**GOTCHA (database):** Always use UUID primary keys (`defaultRandom()`), not auto-increment serial. Auto-increment leaks record counts and creation rates -- unacceptable for multi-tenant SaaS.

**GOTCHA (database):** Always add `created_at` (defaultNow, notNull) and `updated_at` (defaultNow, $onUpdate) timestamps to every table. Adding them retroactively requires a migration on every table.

**GOTCHA (database):** Supabase Pro has a 100 concurrent connection limit. The scheduler, dashboard API, and data ingestion clients all share this pool. Configure connection limits to stay well under the cap, especially when running daily pulls for multiple clients simultaneously.

**GOTCHA (database):** SQL dates vs JavaScript dates. GSC data uses UTC dates. PostgreSQL `::date` casts strip time and timezone. JavaScript `new Date()` uses the local timezone, which can shift the date by one day. Use consistent UTC handling throughout; convert only at the display layer.

---

## Dashboard: Next.js 16 + shadcn/ui (base-ui) + Tailwind CSS

**What:** React-based dashboard using Next.js 16 App Router, shadcn/ui components (base-ui variant), and Tailwind CSS for styling.

**Rationale:**
- Already exists from v1 with 7 pages and 4 admin tabs
- Next.js App Router provides file-based routing, server components, and streaming
- shadcn/ui (base-ui variant) provides accessible, customizable components without runtime dependencies
- Tailwind CSS enables design token injection through CSS custom properties

**Design direction:** Hybrid of "Editorial Intelligence" and "Modern SaaS" per tribunal recommendation. Warm dark mode with gold accents, generous typography, command palette (Cmd+K), keyboard-first navigation. Content-focused card layouts for publisher audience.

**GOTCHA (design):** Default shadcn components look "template-y" in production. Customize the top 5 most-used components (Button, Card, Input, Badge, Table) BEFORE building any feature UI. The rest inherit the "feel" from these.

**GOTCHA (design):** Design BEFORE code. Do not build pages with default shadcn and plan to "make it pretty later." Establish design tokens (colors, typography, spacing, shadows, border-radius) in Sprint 1 and use them from the start. Retrofitting design takes 3x longer.

**GOTCHA (design):** Dark mode is all or nothing. If the dashboard ships with dark mode, every component and every page must support it. A single `bg-white` or `text-black` breaks the experience.

**GOTCHA (design):** Empty states are not optional. Every data-driven page must show an empty state with icon, title, description, and CTA when there is no data. An empty table with headers and zero rows looks broken.

**GOTCHA (design):** Loading states must use skeleton components matching the final layout shape, not generic spinners. Skeletons prevent content layout shift (CLS) and reduce perceived load time.

**GOTCHA (design):** Never use color as the only indicator of state (WCAG 1.4.1). Decay severity, connection health, and quality scores must use color + icon + text. 8% of men have color vision deficiency.

**GOTCHA (design):** Touch targets must be 44x44px minimum for mobile. Inline action buttons (edit, delete, expand) in tables and cards must meet this threshold.

**GOTCHA (design):** Mobile first with Tailwind. Use `grid grid-cols-1 md:grid-cols-4` (mobile default, desktop enhancement), not `grid grid-cols-4 md:grid-cols-1` (desktop default, mobile override).

---

## Auth: Supabase Auth + Bearer Tokens

**What:** Supabase Auth handles user registration, login, and JWT token issuance. The bridge server validates Bearer tokens via `verifyAuth()` middleware with a SHA-256 hashed token cache (30-second TTL).

**Rationale:**
- Already working in v1 with full auth flow (signup, login, verify)
- JWT validation is server-side with no external dependency
- RLS policies enforce per-user data isolation at the database level
- Admin operations use `service_role` key (bypasses RLS)

**Security notes:**
- The `service_role` key is the most sensitive credential. It bypasses ALL RLS policies. It must NEVER be exposed to clients, stored on disk, or included in client-side code.
- Auth verification cache prevents hitting Supabase on every request (SHA-256 hash of token as cache key, 30-second TTL).

---

## Encryption: AES-256-GCM via KeyManager

**What:** `bridge/key-manager.js` (351 lines) provides `encrypt(plaintext)` and `decrypt(encryptedValue)` using AES-256-GCM with the Node.js built-in `crypto` module. Output format: `iv:authTag:ciphertext` (hex-encoded, colon-separated).

**Rationale:**
- Already proven in v1 for API key storage
- Direct reuse for OAuth token encryption (access_token + refresh_token in `client_connections` table)
- Key derivation from `BRIDGE_ENCRYPTION_KEY` environment variable (32-byte hex or base64)
- Auto-generated ephemeral key for development (with warning log)
- The PROJECT-BRIEF PROTECT LIST explicitly states: "Working AES-256-GCM encryption -- reuse pattern, don't modify"

**GOTCHA (deployment):** On Windows, `echo` adds a trailing newline to environment variables. This silently corrupts the encryption key, causing all encrypt/decrypt operations to fail with cryptic errors. Use `node -e "process.stdout.write('key-value')"` when setting `BRIDGE_ENCRYPTION_KEY`.

---

## Hosting: Hetzner + Coolify

**What:** Hetzner Cloud VPS (CPX21: 3 vCPU, 4GB RAM, 80GB SSD, ~EUR 7.50/month) running Coolify for container orchestration.

**Rationale:**
- The bridge server requires a long-running Node.js process for: SSE connections (edit progress, generation progress), subprocess spawning (Claude CLI for section editing), and the ingestion scheduler (daily/weekly data pulls)
- Serverless platforms (Vercel, Netlify, Railway) have execution time limits (10-60 seconds) that cannot support these workloads
- Hetzner provides the cheapest VPS that meets requirements (3 vCPU, 4GB RAM)
- Coolify provides zero-downtime deployments, auto-restart, Let's Encrypt SSL, and environment variable management -- replacing the need for manual Docker/nginx/certbot setup
- Total infrastructure cost: ~$34/month (Hetzner $9 + Supabase $25)

**GOTCHA (deployment):** The bridge server stays HTTP internally. Coolify's reverse proxy (Traefik or Caddy) terminates TLS. No SSL code changes needed in the bridge server.

**GOTCHA (testing):** After Coolify restarts the container, the scheduler must detect missed jobs and execute immediately. Test this explicitly: restart the container, verify the scheduler resumes and executes missed pulls within 60 seconds.

---

## Testing: node:test

**What:** Node.js built-in test runner (`node:test` module), available since Node 18.

**Rationale:**
- Zero dependencies -- consistent with the bridge server's zero-dep philosophy
- Already used for 228 existing tests across 13 suites
- Provides `describe`, `it`, `beforeEach`, `afterEach`, `mock` natively
- No configuration files needed

**Coverage target:** 80% for new backend modules, 60% for new frontend components. Security-critical paths (OAuth, token storage, RLS) must have 100% coverage.

**GOTCHA (testing):** Mock only at boundaries (database, external API, file system), not internal functions. Auth tests must use real HTTP calls against the bridge server. Mocking internal implementation details makes tests brittle -- they break on refactor even when behavior is unchanged.

**GOTCHA (testing):** Each test must be independent. No test should depend on another test's side effects. Tests run in parallel (or random order in CI). Scheduler and ingestion tests are especially prone to implicit dependencies.

**GOTCHA (testing):** High coverage does not mean good tests. Quality gate tests must assert meaningful outcomes (score improves after revision), not just that the scoring function executes without errors. Coverage measures which code runs, not whether assertions are meaningful.

---

## Plugins: SaaS-Connected Thin Clients

**What:** CMS plugins (WordPress, Shopify, Ghost) are thin clients that make API calls to the ChainIQ bridge server. All intelligence, generation, and scoring logic runs on the backend.

**Rationale:**
- Protects intellectual property -- the 193 component blueprints, scoring algorithms, and voice analysis engine never leave the server
- Plugin updates do not require re-deploying intelligence logic
- Plugins are small, auditable, and easy to maintain
- Single codebase for intelligence, regardless of how many CMS platforms are supported

---

## WordPress: PHP Plugin via wp_insert_post

**What:** WordPress plugin that creates posts via `wp_insert_post()`, the WordPress core function for programmatic post creation.

**Rationale:**
- `wp_insert_post()` operates at the `wp_posts` database level, not at the builder level
- WordPress stores all content in the same table regardless of which page builder is used
- This ensures universal compatibility: Gutenberg, Elementor, WPBakery, Classic Editor, Divi, Beaver Builder
- The plugin does not compete with builders -- it inserts content below them
- Features: ChainIQ menu in wp-admin, draft-first publishing, Yoast/RankMath meta auto-fill, featured image upload, category/tag mapping

---

## External APIs

| API | Auth Method | Phase | Cost | Cache TTL |
|-----|-----------|-------|------|-----------|
| Google Search Console | OAuth 2.0 (webmasters.readonly) | A | Free | 1 day |
| Google Analytics 4 | OAuth 2.0 (analytics.readonly) | A | Free | 1 day |
| Semrush | API key | B | $80-150/mo/client | 7 days (keywords), 1 day (SERP) |
| Ahrefs | API token | B | $50-120/mo/client | 7 days (keywords), 30 days (backlinks) |
| Google Trends | Public (no auth) | D | Free | 7 days |

**External dependency timelines (submit Day 1):**
- Google OAuth consent screen verification: 2-6 weeks (use Testing mode for SRMG pilot in the interim)
- Semrush API approval: 1-2 weeks
- Ahrefs API approval: 1-2 weeks
- WordPress plugin repository submission: 1-4 weeks (distribute directly for pilot)

**Cost management:** 7-day caching layer for Semrush/Ahrefs reduces API costs by 60-70%. Cache in `api_cache` table with provider+endpoint+params hash as key, JSONB response as value, `expires_at` for TTL enforcement.

---

## Technology Decisions Log

| Decision | Options Considered | Choice | Rationale |
|----------|-------------------|--------|-----------|
| Server framework | Express, Koa, Hono, raw Node.js | Raw Node.js | Zero deps, existing codebase, proven pattern |
| Database | Supabase, PlanetScale, Neon, self-hosted PG | Supabase | Existing, RLS, Auth, real-time, managed |
| Dashboard framework | Next.js, Remix, SvelteKit | Next.js 16 | Existing, App Router, shadcn ecosystem |
| Component library | shadcn/ui, Radix, MUI, Chakra | shadcn/ui (base-ui) | Existing, customizable, no runtime deps |
| ORM | Prisma, Drizzle, Knex, raw SQL | Supabase REST client | Existing (1,155 lines), zero deps, PostgREST |
| Hosting | Vercel, Railway, Fly.io, Hetzner | Hetzner + Coolify | Long-running process needed, cost-effective |
| SSL | Certbot, Cloudflare, custom | Coolify (Let's Encrypt) | Auto-renewal, zero config |
| DDoS protection | Cloudflare, AWS Shield, none | Cloudflare free | Zero cost, zero code changes |
| Clustering algorithm | HDBSCAN, k-means, DBSCAN | K-means (MVP) then Python HDBSCAN | Zero-dep constraint, accuracy upgrade path |
| Test framework | Jest, Vitest, Mocha, node:test | node:test | Zero deps, built into Node.js |
| Scheduler | node-cron, Agenda, pg_cron, setInterval | setInterval + Supabase state | Zero deps, missed-job recovery on restart |
| HTML parsing | cheerio, htmlparser2, JSDOM, regex | Regex (MVP) | Zero deps, 80% accuracy, upgrade path exists |
