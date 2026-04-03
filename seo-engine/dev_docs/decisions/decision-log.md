# ChainIQ Architecture Decision Log

> Canonical record of all architectural decisions made during Steps 1-8 of the Master Starter Kit.
> Each ADR is immutable once accepted. Superseded decisions are marked accordingly.

---

## Index

| ADR | Title | Status |
|-----|-------|--------|
| ADR-001 | Bridge Server Runtime | Accepted |
| ADR-002 | Primary Database | Accepted |
| ADR-003 | Dashboard Framework | Accepted |
| ADR-004 | Authentication Strategy | Accepted |
| ADR-005 | Hosting and Deployment | Accepted |
| ADR-006 | ORM / Data Access Layer | Accepted |
| ADR-007 | Test Framework | Accepted |
| ADR-008 | CMS Plugin Architecture | Accepted |
| ADR-009 | Clustering Algorithm | Accepted |
| ADR-010 | Task Scheduling | Accepted |
| ADR-011 | Encryption Standard | Accepted |
| ADR-012 | CMS Publishing Strategy | Accepted |
| ADR-013 | Primary Key Strategy | Accepted |
| ADR-014 | Monetary Value Storage | Accepted |
| ADR-015 | A/B Headline Testing | Accepted (Won't Have) |
| ADR-016 | Build Order Strategy | Accepted |
| ADR-017 | Feature Scope (MoSCoW) | Accepted |
| ADR-018 | Arabic-First Market Orientation | Accepted |
| ADR-019 | Pricing Tier Structure | Accepted |

---

### ADR-001: Bridge Server Runtime

- **Date:** 2026-03-28
- **Status:** Accepted
- **Context:** The ChainIQ bridge server sits between CMS plugins and Supabase/AI services. It needs to handle HTTP requests, route them, and proxy to backend services. A framework choice here locks in a dependency for the entire server layer. The project has a strict zero-npm-dependency policy for the bridge to minimize supply chain risk, reduce attack surface, and eliminate version churn in a multi-tenant SaaS product.
- **Decision:** Use raw Node.js `http.createServer()` with no framework.
- **Alternatives Considered:**
  - **Express:** Most popular, huge ecosystem. Rejected because it pulls in 30+ transitive dependencies, contradicting the zero-dep mandate. Also carries historical CVE baggage.
  - **Koa:** Cleaner middleware model than Express. Rejected for the same dependency concern; Koa still brings in several transitive packages.
  - **Hono:** Ultra-lightweight, modern API. Rejected because even a minimal framework adds a dependency that must be tracked, audited, and updated. The bridge's routing needs are simple enough that raw Node covers them.
- **Consequences:**
  - Positive: Zero supply chain risk on the server layer. Full control over request handling. No framework-specific abstractions to learn or debug. Trivially auditable.
  - Negative: Must implement routing, body parsing, CORS, and error handling manually. No middleware ecosystem to lean on. New contributors need to understand the custom patterns.

---

### ADR-002: Primary Database

- **Date:** 2026-03-28
- **Status:** Accepted
- **Context:** ChainIQ needs a relational database with multi-tenant row-level security (RLS), real-time subscriptions for dashboard updates, built-in auth, and a REST/GraphQL API layer. The project already had a working Supabase schema with RLS policies and auth configured from the article-engine-plugin phase.
- **Decision:** Supabase PostgreSQL Pro plan ($25/month).
- **Alternatives Considered:**
  - **Firebase (Firestore):** NoSQL, poor fit for relational content intelligence data (articles, clusters, scoring formulas). No native SQL. Vendor lock-in to Google.
  - **PlanetScale:** MySQL-compatible, good scaling story. Rejected because it lacks built-in auth, RLS, and real-time subscriptions. Would require additional services to replicate what Supabase provides out of the box. Also, PlanetScale dropped its free tier.
  - **Neon:** Serverless Postgres, excellent tech. Rejected because it lacks the integrated auth, storage, and real-time features. Would need to bolt on separate services for auth and real-time, increasing architectural complexity.
- **Consequences:**
  - Positive: Single service provides database, auth, real-time, storage, and edge functions. RLS enforces multi-tenancy at the database level. Existing schema and policies carry forward. $25/month is predictable and affordable.
  - Negative: Vendor coupling to Supabase. If Supabase has an outage, the entire platform is affected. Migration away would require rebuilding auth, RLS, and real-time layers.

---

### ADR-003: Dashboard Framework

- **Date:** 2026-03-28
- **Status:** Accepted
- **Context:** The ChainIQ dashboard is a multi-page SPA for content strategists to manage articles, view analytics, configure voice profiles, and monitor quality scores. It needs server-side rendering for SEO of marketing pages, API routes for server-side operations, and a rich component library for data-dense UIs.
- **Decision:** Next.js 16 + shadcn/ui (base-ui variant) + Tailwind CSS.
- **Alternatives Considered:**
  - **MUI (Material UI):** Comprehensive, well-documented. Rejected because it imposes Material Design aesthetics that are difficult to customize for a brand-specific SaaS product. Heavy runtime CSS-in-JS adds bundle weight and complicates SSR.
  - **Chakra UI:** Good DX, accessible by default. Rejected because it has runtime style injection similar to MUI, and the component set is less complete for data-dense dashboard patterns (tables, command palettes, sheet drawers).
- **Consequences:**
  - Positive: shadcn/ui components are copy-pasted into the project (not installed as a dependency), giving full ownership and customization. Tailwind eliminates runtime CSS overhead. Next.js 16 provides App Router, Server Components, and built-in API routes.
  - Negative: shadcn/ui components must be maintained manually after copying. Tailwind has a learning curve for developers accustomed to traditional CSS. Next.js upgrades can introduce breaking changes in the App Router.

---

### ADR-004: Authentication Strategy

- **Date:** 2026-03-28
- **Status:** Accepted
- **Context:** ChainIQ needs authentication for dashboard users (content strategists), API authentication for CMS plugins calling the bridge server, and multi-tenant isolation ensuring users only see their own organization's data. The system already uses Supabase Auth from the plugin phase.
- **Decision:** Supabase Auth JWT + Bearer tokens for API calls + SHA-256 token cache with 30-second TTL on the bridge server.
- **Alternatives Considered:**
  - **Custom JWT auth (self-signed):** Full control over token format and claims. Rejected because it duplicates what Supabase Auth already provides, introduces key management complexity, and breaks the integrated RLS flow (Supabase RLS policies read claims from Supabase-issued JWTs).
  - **Auth0 / Clerk:** Mature, feature-rich auth providers. Rejected because adding an external auth provider alongside Supabase creates two sources of truth for user identity. Also adds cost and another vendor dependency.
- **Consequences:**
  - Positive: Single auth provider for both dashboard and API. JWTs flow through to Supabase RLS for automatic tenant isolation. SHA-256 cache reduces token validation overhead on the bridge (avoids hitting Supabase on every request). 30s TTL balances performance with security.
  - Negative: Tied to Supabase's auth implementation. SHA-256 cache means a revoked token could remain valid for up to 30 seconds. Token refresh logic must be handled client-side.

---

### ADR-005: Hosting and Deployment

- **Date:** 2026-03-28
- **Status:** Accepted
- **Context:** ChainIQ runs a Node.js bridge server, a Next.js dashboard, and periodic background jobs (content scoring, voice analysis, SERP checks). Some operations are long-running (60+ seconds for full article generation pipelines). The platform needs predictable pricing, no execution time limits, and SSH access for debugging.
- **Decision:** Hetzner CPX21 VPS ($9/month) + Coolify for deployment orchestration. Total infrastructure cost approximately $34/month (Hetzner $9 + Supabase $25).
- **Alternatives Considered:**
  - **Vercel:** Native Next.js hosting, excellent DX. Rejected because serverless function execution limits (10s on free, 60s on Pro) cannot accommodate long-running article generation pipelines. Also, the bridge server is a persistent Node process, not a serverless function.
  - **Railway:** Simple container hosting, good DX. Rejected because of execution time limits on background jobs and unpredictable pricing under load.
  - **AWS (EC2/ECS/Lambda):** Maximum flexibility and scale. Rejected because the operational complexity and cost are disproportionate for a solo developer. EC2 instances with equivalent specs cost 3-4x more than Hetzner. AWS billing is unpredictable.
- **Consequences:**
  - Positive: No execution time limits. Full SSH access. Predictable $9/month cost. Coolify provides git-push deploys, SSL, and container management without vendor lock-in. European data center aligns with MENA client proximity.
  - Negative: Single server is a SPOF (no auto-scaling). Requires manual server maintenance (OS updates, security patches). Coolify is less mature than Vercel/Railway for deployment automation.

---

### ADR-006: ORM / Data Access Layer

- **Date:** 2026-03-28
- **Status:** Accepted
- **Context:** The bridge server needs to interact with Supabase PostgreSQL for CRUD operations, complex queries (content scoring aggregations, voice cluster lookups), and real-time subscriptions. The zero-dependency policy extends to the data layer.
- **Decision:** No ORM. Use Supabase REST client directly. Current implementation is 1155 lines of purpose-built data access code.
- **Alternatives Considered:**
  - **Prisma:** Type-safe, excellent DX with auto-generated types. Rejected because it installs a Rust-based query engine binary (~15MB), pulls in numerous npm dependencies, and generates a client that abstracts away Supabase's native features (RLS pass-through, real-time).
  - **Drizzle:** Lightweight, SQL-like syntax. Rejected because it still introduces npm dependencies and an abstraction layer over what the Supabase client already handles natively.
  - **Knex:** Query builder, not a full ORM. Rejected for the same dependency concerns and because it does not integrate with Supabase's auth-aware REST API.
- **Consequences:**
  - Positive: Zero additional dependencies. Direct use of Supabase's REST API preserves RLS enforcement and auth token pass-through. Full control over query construction. No ORM migration files to manage.
  - Negative: No auto-generated TypeScript types from schema. Manual query construction is more error-prone. 1155 lines of data access code must be maintained by hand. No built-in migration tooling.

---

### ADR-007: Test Framework

- **Date:** 2026-03-28
- **Status:** Accepted
- **Context:** The bridge server and shared utilities need unit and integration tests. The zero-dependency policy applies to dev dependencies as well, to keep the project lean and avoid configuration complexity from test framework plugins.
- **Decision:** Use `node:test` (Node.js built-in test runner) with `node:assert`.
- **Alternatives Considered:**
  - **Jest:** Industry standard, rich ecosystem of matchers and mocks. Rejected because it installs 50+ transitive dependencies, has complex configuration (especially with ESM), and adds significant overhead to CI runs.
  - **Vitest:** Modern, fast, Vite-native. Rejected because it still requires npm installation and introduces a Vite dependency chain. Better suited for frontend projects.
  - **Mocha:** Minimal, flexible. Rejected because it still requires npm installation and needs additional packages for assertions (chai) and mocking (sinon).
- **Consequences:**
  - Positive: Zero installation required (ships with Node.js 18+). Native ESM support. Built-in test runner, assertions, and mocking. No configuration files needed. Fast CI execution.
  - Negative: Smaller ecosystem of plugins and extensions. Less mature reporting options. Some developers are unfamiliar with the `node:test` API. Watch mode is less polished than Jest/Vitest.

---

### ADR-008: CMS Plugin Architecture

- **Date:** 2026-03-28
- **Status:** Accepted
- **Context:** ChainIQ must integrate with multiple CMS platforms (WordPress, Ghost, Contentful, Strapi, etc.). Each CMS has different APIs, auth mechanisms, and content models. The business model depends on protecting the AI intelligence layer from being reverse-engineered or self-hosted by clients.
- **Decision:** SaaS-connected thin clients. CMS plugins are lightweight connectors that authenticate with the ChainIQ bridge server and relay content operations. All intelligence (scoring, clustering, voice analysis) runs server-side.
- **Alternatives Considered:**
  - **Self-contained plugins:** Bundle all intelligence logic into each CMS plugin. Rejected because it exposes proprietary algorithms in client-downloadable code, makes updates require per-CMS releases, and duplicates logic across N plugin codebases.
- **Consequences:**
  - Positive: IP protection -- scoring algorithms, voice models, and clustering logic never leave the server. Single codebase for intelligence logic. Plugin updates are minimal (UI/UX changes only). New CMS integrations only need a thin connector.
  - Negative: Plugins require internet connectivity to function. Added latency for every operation (CMS -> bridge -> Supabase -> bridge -> CMS). If the bridge server is down, all CMS plugins are non-functional.

---

### ADR-009: Clustering Algorithm (Voice Intelligence)

- **Date:** 2026-03-28
- **Status:** Accepted
- **Context:** Voice Intelligence requires clustering writing samples to identify stylometric patterns (sentence rhythm, vocabulary density, punctuation habits, etc.). HDBSCAN is the ideal algorithm (density-based, no predefined K, handles noise), but no production-quality JavaScript implementation exists.
- **Decision:** K-means for MVP, Python shim (calling scikit-learn HDBSCAN) for production.
- **Alternatives Considered:**
  - **npm HDBSCAN packages:** Several exist (hdbscanjs, density-clustering). Rejected because they are unmaintained, have incorrect implementations, or lack the parameter tuning needed for production use.
  - **Pure JS HDBSCAN implementation:** Building from scratch. Rejected because the algorithm is complex (mutual reachability graphs, minimum spanning trees, cluster extraction) and would take weeks to implement and validate correctly.
- **Consequences:**
  - Positive: MVP ships quickly with K-means (simple, well-understood). Production gets battle-tested scikit-learn HDBSCAN. Python shim is a single subprocess call, keeping the bridge server clean.
  - Negative: K-means requires predefined K (number of voice clusters), which may not match reality. Two clustering implementations to maintain during transition. Python shim adds a runtime dependency (Python 3.x + scikit-learn) to the production server.

---

### ADR-010: Task Scheduling

- **Date:** 2026-03-28
- **Status:** Accepted
- **Context:** ChainIQ runs periodic background tasks: content performance checks (30/60/90 day), voice profile recalculation, SERP position tracking, and API usage aggregation. These tasks need reliable scheduling with state tracking to handle server restarts and prevent duplicate execution.
- **Decision:** `setInterval` in Node.js + Supabase state tracking table for job status, last run time, and lock acquisition.
- **Alternatives Considered:**
  - **node-cron:** Cron-syntax scheduling for Node.js. Rejected because it adds an npm dependency and does not provide state persistence or distributed locking.
  - **pg_cron:** PostgreSQL extension for in-database scheduling. Rejected because Supabase does not support custom PostgreSQL extensions on the Pro plan. Would require a dedicated PostgreSQL instance.
- **Consequences:**
  - Positive: Zero dependencies. Supabase state table provides persistence across restarts. Lock acquisition prevents duplicate execution if multiple bridge instances run (future scaling). Simple to reason about and debug.
  - Negative: `setInterval` drift over time (not cron-precise). No built-in retry logic for failed jobs. State tracking adds database queries to every schedule tick. Manual implementation of backoff and dead-letter patterns.

---

### ADR-011: Encryption Standard

- **Date:** 2026-03-28
- **Status:** Accepted
- **Context:** ChainIQ stores sensitive data including API keys (OpenAI, Anthropic, Semrush, Ahrefs), CMS credentials, and potentially PII from MENA publisher clients. Data at rest must be encrypted with a standard that satisfies enterprise security requirements.
- **Decision:** AES-256-GCM via a centralized `KeyManager` class. Ciphertext format: `iv:authTag:ciphertext` (hex-encoded, colon-delimited).
- **Alternatives Considered:**
  - **AES-256-CBC:** Widely used but lacks authenticated encryption. GCM provides both confidentiality and integrity verification, preventing ciphertext tampering.
  - **libsodium (NaCl):** Excellent cryptographic library. Rejected because it requires a native binding (npm dependency), contradicting the zero-dep policy. Node.js `crypto` module provides AES-256-GCM natively.
- **Consequences:**
  - Positive: Authenticated encryption prevents tampering. Native Node.js implementation (no dependencies). Centralized KeyManager ensures consistent encryption across the codebase. Hex encoding is safe for database storage and JSON serialization.
  - Negative: Key management is the developer's responsibility (KeyManager must securely source the master key). IV must never be reused with the same key. No built-in key rotation mechanism (must be added later).

---

### ADR-012: CMS Publishing Strategy

- **Date:** 2026-03-28
- **Status:** Accepted
- **Context:** ChainIQ generates AI content and publishes it to client CMS platforms. Auto-publishing AI-generated content without human review poses reputational risk to MENA publishers (SRMG and similar organizations) and could violate editorial policies.
- **Decision:** Draft-first publishing. All CMS publishes create drafts, never auto-publish. Human review is required before any content goes live.
- **Alternatives Considered:**
  - **Auto-publish with quality gate:** If content passes the 7-signal quality score above a threshold, publish immediately. Rejected because even high-scoring content may contain cultural insensitivity, factual errors in Arabic context, or brand voice mismatches that only a human editor can catch.
  - **Configurable per-client:** Let each client choose auto-publish or draft. Rejected for MVP because it increases complexity and creates liability if a client enables auto-publish and problematic content goes live.
- **Consequences:**
  - Positive: Zero risk of unreviewed AI content going live. Builds trust with enterprise publishers. Aligns with editorial workflows at SRMG and similar organizations. Reduces liability.
  - Negative: Adds friction to the content pipeline (human bottleneck). May reduce perceived value for small clients who want full automation. Requires dashboard UI for draft review workflow.

---

### ADR-013: Primary Key Strategy

- **Date:** 2026-03-28
- **Status:** Accepted
- **Context:** ChainIQ is a multi-tenant SaaS platform. Primary key choice affects security (information leakage), performance (index efficiency), and data portability (cross-environment merges).
- **Decision:** UUID v4 primary keys on all tables. No auto-increment integers anywhere.
- **Alternatives Considered:**
  - **Auto-increment integers:** Simpler, smaller index footprint. Rejected because sequential IDs leak record counts to tenants (a client could infer total articles, users, or organizations by observing their own IDs). This is a known multi-tenant security anti-pattern.
  - **ULID / nanoid:** Sortable, shorter than UUID. Rejected because Supabase and PostgreSQL have native UUID support (`gen_random_uuid()`), and ULIDs require custom generation logic.
- **Consequences:**
  - Positive: No information leakage between tenants. Safe for use in URLs and API responses. Native PostgreSQL support with efficient indexing. Records can be merged across environments without collision.
  - Negative: UUIDs are larger than integers (16 bytes vs 4-8 bytes), increasing index size. Not naturally sortable (use `created_at` for ordering). Harder to reference in conversation ("article abc123..." vs "article 47").

---

### ADR-014: Monetary Value Storage

- **Date:** 2026-03-28
- **Status:** Accepted
- **Context:** ChainIQ tracks API costs per article (OpenAI, Anthropic, Semrush API calls) and aggregates them for billing and usage dashboards. Floating-point arithmetic in JavaScript is notoriously imprecise for currency calculations (0.1 + 0.2 !== 0.3).
- **Decision:** Store all monetary values as integer cents. $1.50 is stored as `150`. All arithmetic is integer-based. Conversion to dollars happens only at the display layer.
- **Alternatives Considered:**
  - **Floating-point (NUMERIC/DECIMAL in DB, float in JS):** Simpler code. Rejected because JavaScript floating-point errors accumulate across thousands of API cost records, leading to billing discrepancies. Even PostgreSQL NUMERIC requires careful handling in JS after query results are parsed.
  - **Decimal.js library:** Arbitrary-precision decimals in JS. Rejected because it adds an npm dependency and is overkill when integer cents solve the problem with zero overhead.
- **Consequences:**
  - Positive: Zero floating-point errors. Integer arithmetic is fast and deterministic. Simple to aggregate (SUM of integers). No dependency needed.
  - Negative: Every display of monetary values requires division by 100. API consumers must know the convention (cents, not dollars). Sub-cent precision is lost (acceptable for API cost tracking but not for cryptocurrency).

---

### ADR-015: A/B Headline Testing (Won't Have)

- **Date:** 2026-03-28
- **Status:** Accepted (Won't Have -- Binding Tribunal Verdict)
- **Context:** During feature scoping, A/B headline testing was proposed: generate multiple headline variants per article, serve them to different user segments, and measure CTR to select the winner. This was evaluated by the tribunal process.
- **Decision:** Will not build A/B headline testing. Removed from all scope tiers.
- **Alternatives Considered:**
  - **Build for Professional/Enterprise tiers only:** Limits blast radius. Rejected by tribunal because the feature requires client-side JavaScript injection on publisher sites, real-time traffic splitting infrastructure, and statistical significance calculation -- high engineering effort for a feature with niche demand among the target MENA publisher market.
  - **Integrate third-party A/B tool (Google Optimize, VWO):** Offload complexity. Rejected because Google Optimize was sunset, and VWO/similar tools add per-site cost that erodes margins.
- **Consequences:**
  - Positive: Significant scope reduction. Engineering effort redirected to core intelligence features (voice analysis, content scoring). No need to build traffic splitting or statistical analysis infrastructure.
  - Negative: Cannot compete with platforms that offer headline optimization. May need to revisit if market demand emerges post-launch.

---

### ADR-016: Build Order Strategy

- **Date:** 2026-03-28
- **Status:** Accepted
- **Context:** With 93 features across 5 phases, the build order determines what gets validated first and where risk concentrates. Two strategies were evaluated: horizontal (build all foundations first) vs. vertical (build one complete user journey end-to-end).
- **Decision:** Foundation layer first, then a Guided Vertical Slice. Build shared infrastructure (auth, database, bridge, encryption) in Phase A, then implement one complete feature journey (article generation end-to-end) as the first vertical slice in Phase B.
- **Alternatives Considered:**
  - **Pure vertical slice from day one:** Skip foundation, build one feature top-to-bottom. Rejected because shared infrastructure (auth, multi-tenancy, encryption) would be hacked together and need rewriting.
  - **Full horizontal build:** Complete all infrastructure before any features. Rejected because it delays user-facing value and risks building infrastructure that no feature actually needs.
- **Consequences:**
  - Positive: Foundation is solid before features build on it. Vertical slice validates the entire stack early. Risk is front-loaded. First deployable product emerges quickly after foundation.
  - Negative: Foundation phase produces nothing user-visible (morale risk for solo dev). If foundation assumptions are wrong, the vertical slice exposes it late.

---

### ADR-017: Feature Scope (MoSCoW Prioritization)

- **Date:** 2026-03-28
- **Status:** Accepted
- **Context:** 93 features were identified across all platform layers. Without prioritization, scope creep would make the project unshippable for a solo developer. MoSCoW (Must/Should/Could/Won't) was applied to create hard boundaries.
- **Decision:** 26 Must Have, 40 Should Have, 25 Could Have, 2 Won't Have. Must Haves define the minimum viable product. Should Haves are targeted for v1.0. Could Haves are post-launch. Won't Haves are permanently excluded.
- **Alternatives Considered:**
  - **RICE scoring only:** Quantitative prioritization. Used as input but rejected as the sole method because it does not create hard scope boundaries (everything gets a score, nothing gets cut).
  - **Time-boxed phases without prioritization:** Build as much as possible in each phase. Rejected because it leads to partially-built features across the board instead of fully-built critical features.
- **Consequences:**
  - Positive: Clear scope boundaries. Solo developer knows exactly what to build and what to skip. Stakeholder alignment on what "done" means for MVP. 26 Must Haves is achievable in the projected timeline.
  - Negative: 40 Should Haves create pressure to expand scope. Could Haves may never get built if post-launch priorities shift. The 2 Won't Haves (including A/B testing) are permanently excluded, closing those market opportunities.

---

### ADR-018: Arabic-First Market Orientation

- **Date:** 2026-03-28
- **Status:** Accepted
- **Context:** ChainIQ's primary clients are MENA publishers (SRMG and similar organizations). Arabic is a right-to-left (RTL) language with unique NLP challenges: morphological complexity, diacritics, dialect variation, and limited training data for AI models compared to English.
- **Decision:** Arabic-first design. RTL layout is the default, not an afterthought. Arabic NLP considerations (tokenization, voice analysis for Arabic text, quality scoring calibrated for Arabic content) are built into the core from day one.
- **Alternatives Considered:**
  - **English-first, Arabic as localization:** Build everything in English, add Arabic support later. Rejected because retroffiting RTL layout is notoriously painful (CSS direction flips, icon mirroring, number formatting). Arabic NLP bolted on after English-optimized algorithms produces poor results.
- **Consequences:**
  - Positive: Product-market fit for MENA publishers from day one. RTL layout done correctly. Voice analysis and quality scoring calibrated for Arabic text. Competitive advantage in an underserved market.
  - Negative: English-market features may need adjustment later. Some AI models have weaker Arabic performance (must account for this in quality scoring). Smaller developer talent pool familiar with Arabic NLP.

---

### ADR-019: Growth Pricing Tier

- **Date:** 2026-03-28
- **Status:** Accepted
- **Context:** Initial pricing had three tiers: Creator ($149-199/mo), Professional ($3K/mo), and Enterprise ($8-12K/mo). The gap between Creator and Professional ($200 to $3,000) was identified as a dead zone that would lose mid-market agencies and growing publishers.
- **Decision:** Add a Growth tier at $500-800/month, positioned between Creator and Professional. Includes higher article limits, team seats, and priority support.
- **Alternatives Considered:**
  - **Keep three tiers, add usage-based pricing to Creator:** Let Creator clients scale up via per-article charges. Rejected because usage-based pricing is unpredictable for clients and complicates billing infrastructure.
  - **Lower Professional to $1,500/mo:** Compress the gap from above. Rejected because it undervalues the Professional tier's enterprise features and reduces revenue per client.
- **Consequences:**
  - Positive: Captures mid-market segment. Smoother upgrade path from Creator. Revenue diversification across four tiers. Reduces churn from clients who outgrow Creator but cannot justify Professional.
  - Negative: Four tiers are more complex to maintain (feature gates, billing logic, support tiers). Growth tier pricing ($500-800) must be validated against willingness-to-pay.
