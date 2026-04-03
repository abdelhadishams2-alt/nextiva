# Effort Estimation Framework

**Assessment Date:** 2026-03-28
**Basis:** Verified codebase analysis of ChainIQ v1 (1,471-line server.js, 1,155-line supabase-client.js, 13 test suites, 228 passing tests, zero npm deps)
**Sizing:** S=1-2 days, M=3-5 days, L=1-2 weeks, XL=2-4 weeks, XXL=1+ month

---

## 1. Complete Feature Effort Table

### Layer 0 — Foundation (Must-Do Before Any New Feature)

| # | Feature | Backend | Frontend | Total | Risk | Phase |
|---|---------|---------|----------|-------|------|-------|
| 1 | server.js route splitting refactor | L | - | L | Low | P0 |
| 2 | supabase-client.js modular split | M | - | M | Low | P0 |
| 3 | Supabase migration: client_connections table | S | - | S | Low | P0 |
| 4 | Supabase migration: content_inventory table | S | - | S | Low | P0 |
| 5 | Supabase migration: performance_snapshots table | M | - | M | Medium | P0 |
| 6 | Supabase migration: keyword_opportunities table | S | - | S | Low | P0 |
| 7 | Supabase migration: writer_personas table | S | - | S | Low | P0 |
| 8 | Supabase migration: performance_predictions table | S | - | S | Low | P0 |
| 9 | RLS policies for all 6 new tables | M | - | M | Low | P0 |
| 10 | Index design + performance_snapshots partitioning | M | - | M | Medium | P0 |
| 11 | Monthly rollup aggregation table + purge job | M | - | M | Medium | P0 |
| 12 | Hetzner + Coolify deployment setup | M | - | M | Low | P0 |
| 13 | Cloudflare DNS + DDoS protection setup | S | - | S | Low | P0 |
| 14 | SSL/TLS via Coolify reverse proxy | S | - | S | Low | P0 |
| 15 | CORS allowlist (replace wildcard) | S | - | S | Low | P0 |
| 16 | IP-based rate limiting | S | - | S | Low | P0 |
| 17 | Test infrastructure for new modules | M | - | M | Low | P0 |

### Layer 1 — Data Ingestion (Connectors & Crawlers)

| # | Feature | Backend | Frontend | Total | Risk | Phase |
|---|---------|---------|----------|-------|------|-------|
| 18 | Google OAuth2 flow (bridge/oauth.js) | M | S | L | Medium | P0 |
| 19 | Google Cloud project + consent screen setup | S | - | S | High | P0 |
| 20 | OAuth token encryption (KeyManager reuse) | S | - | S | Low | P0 |
| 21 | OAuth token refresh logic | M | - | M | Medium | P0 |
| 22 | GSC Search Analytics API client | M | - | M | Low | P1 |
| 23 | GSC daily data pull + normalization | M | - | M | Low | P1 |
| 24 | GA4 Reporting API client | M | - | M | Low | P1 |
| 25 | GA4 daily data pull + normalization | M | - | M | Low | P1 |
| 26 | Semrush API client (keyword research) | M | - | M | Medium | P1 |
| 27 | Semrush API client (keyword gap) | M | - | M | Medium | P1 |
| 28 | Semrush API client (domain analytics) | M | - | M | Medium | P1 |
| 29 | Semrush API client (SERP features) | S | - | S | Medium | P1 |
| 30 | Ahrefs API client (backlink profile) | M | - | M | Medium | P1 |
| 31 | Ahrefs API client (domain rating) | S | - | S | Low | P1 |
| 32 | Ahrefs API client (keyword explorer) | M | - | M | Medium | P1 |
| 33 | Google Trends seasonal curves client | S | - | S | Low | P2 |
| 34 | HTTP content crawler (basic, regex parsing) | L | - | L | Medium | P1 |
| 35 | HTTP crawler — robust HTML extraction | L | - | L | High | P2 |
| 36 | API response caching layer (7-day TTL) | M | - | M | Low | P1 |
| 37 | Scheduler: daily GSC/GA4 pulls | M | - | M | Low | P1 |
| 38 | Scheduler: weekly Semrush/Ahrefs pulls | S | - | S | Low | P1 |
| 39 | Scheduler: missed-job recovery on restart | S | - | S | Low | P1 |
| 40 | ContentPerformanceRecord normalization | M | - | M | Low | P1 |
| 41 | Connections dashboard page | - | L | L | Low | P1 |
| 42 | OAuth flow UI (Google button, redirect handler) | S | M | M | Medium | P1 |
| 43 | Connected accounts status cards | - | M | M | Low | P1 |

### Layer 2 — Content Intelligence (Recommendation Brain)

| # | Feature | Backend | Frontend | Total | Risk | Phase |
|---|---------|---------|----------|-------|------|-------|
| 44 | Content inventory crawler + DB persistence | L | - | L | Medium | P1 |
| 45 | Decay detection algorithm (3-month rolling window) | M | - | M | Low | P1 |
| 46 | Decay severity scoring (20%+ single-month drop) | S | - | S | Low | P1 |
| 47 | Keyword gap analysis (Semrush cross-reference) | L | - | L | Medium | P1 |
| 48 | Saturation index (SERP difficulty scoring) | M | - | M | Medium | P2 |
| 49 | Cannibalization detection (GSC query overlap) | M | - | M | Medium | P1 |
| 50 | Cannibalization resolution recommendations | M | - | M | Low | P2 |
| 51 | Seasonality adjustment (Google Trends curves) | M | - | M | Low | P2 |
| 52 | Priority scoring formula implementation | S | - | S | Low | P1 |
| 53 | Scored recommendation generation | M | - | M | Low | P1 |
| 54 | Content Inventory dashboard page | - | L | L | Low | P1 |
| 55 | Inventory data table with filters + search | - | L | L | Medium | P1 |
| 56 | Opportunities dashboard page (4 tabs) | - | XL | XL | Medium | P1 |
| 57 | Opportunity cards with scores + actions | - | M | M | Low | P1 |
| 58 | Content health heat map | - | M | M | Low | P2 |
| 59 | Topic Recommender agent (SKILL.md) | M | - | M | Low | P1 |

### Layer 3 — Voice Intelligence

| # | Feature | Backend | Frontend | Total | Risk | Phase |
|---|---------|---------|----------|-------|------|-------|
| 60 | Corpus collection (50-100 articles scraping) | L | - | L | Medium | P2 |
| 61 | Stylometric feature extraction (sentence length, TTR, etc.) | L | - | L | Medium | P2 |
| 62 | AI vs human classification (pattern matching) | L | - | L | High | P2 |
| 63 | Writer clustering (simplified k-means, zero-dep) | L | - | L | High | P2 |
| 64 | Writer clustering (HDBSCAN via Python shim) | XL | - | XL | High | P3 |
| 65 | Persona JSON profile generation | M | - | M | Low | P2 |
| 66 | Voice Analyzer agent (SKILL.md) | M | - | M | Low | P2 |
| 67 | Draft-writer persona injection (modify existing agent) | M | - | M | Low | P2 |
| 68 | Voice Profiles dashboard page | - | L | L | Medium | P2 |
| 69 | Persona cards with radar chart | - | M | M | Low | P2 |
| 70 | Persona editing form | - | M | M | Low | P2 |
| 71 | Default persona selection | - | S | S | Low | P2 |

### Layer 4 — Quality Gate

| # | Feature | Backend | Frontend | Total | Risk | Phase |
|---|---------|---------|----------|-------|------|-------|
| 72 | 60-point SEO checklist engine (port from old-seo-blog-checker) | L | - | L | Low | P1 |
| 73 | ContentMetrics extraction (word count, headings, links, etc.) | M | - | M | Low | P1 |
| 74 | Arabic content detection (Unicode range check) | S | - | S | Low | P1 |
| 75 | E-E-A-T scoring rubric (10 dimensions) | L | - | L | Medium | P1 |
| 76 | Voice match scoring (stylometric distance) | M | - | M | High | P2 |
| 77 | AI detection score (sentence variance, cliche density) | M | - | M | Medium | P2 |
| 78 | Freshness signals check | S | - | S | Low | P1 |
| 79 | Technical SEO scoring (heading hierarchy, schema, alt text) | M | - | M | Low | P1 |
| 80 | Readability scoring (Flesch-Kincaid) | S | - | S | Low | P1 |
| 81 | Auto-revision loop (max 2 passes) | M | - | M | Medium | P2 |
| 82 | Quality Gate agent (SKILL.md) | M | - | M | Low | P1 |
| 83 | Quality Report dashboard tab | - | L | L | Low | P1 |
| 84 | Score ring visualization | - | S | S | Low | P1 |
| 85 | Checklist accordion (passed/failed items) | - | M | M | Low | P1 |
| 86 | Suggestion cards (actionable fixes) | - | S | S | Low | P1 |
| 87 | Quality suggestions engine (port from old-seo-blog-checker) | M | - | M | Low | P1 |

### Layer 5 — Universal Publishing

| # | Feature | Backend | Frontend | Total | Risk | Phase |
|---|---------|---------|----------|-------|------|-------|
| 88 | WordPress REST API client (create posts) | L | - | L | Medium | P2 |
| 89 | WordPress categories/tags management | M | - | M | Low | P2 |
| 90 | WordPress featured image upload | M | - | M | Medium | P2 |
| 91 | WordPress Yoast/RankMath SEO meta | M | - | M | Medium | P2 |
| 92 | WordPress plugin (PHP, wp-admin UI) | XL | - | XL | High | P2 |
| 93 | WordPress builder compatibility testing | L | - | L | High | P2 |
| 94 | Shopify Blog API client | M | - | M | Low | P3 |
| 95 | Shopify product-aware content references | M | - | M | Medium | P3 |
| 96 | Shopify embedded admin app | XL | - | XL | Medium | P3 |
| 97 | Generic webhook adapter (extend existing) | S | - | S | Low | P2 |
| 98 | Publish event webhooks (requested/completed/failed) | S | - | S | Low | P2 |
| 99 | Publishing dashboard page | - | L | L | Low | P2 |
| 100 | Connected platforms list | - | M | M | Low | P2 |
| 101 | Publish history table | - | M | M | Low | P2 |
| 102 | Push-to-CMS button with SSE progress | - | M | M | Medium | P2 |

### Layer 6 — Feedback Loop

| # | Feature | Backend | Frontend | Total | Risk | Phase |
|---|---------|---------|----------|-------|------|-------|
| 103 | 30/60/90-day performance check scheduler | M | - | M | Low | P3 |
| 104 | Prediction vs actual comparison logic | M | - | M | Low | P3 |
| 105 | Accuracy scoring (prediction deviation) | S | - | S | Low | P3 |
| 106 | Intelligence engine recalibration (scoring weight adjustment) | L | - | L | Medium | P3 |
| 107 | Performance dashboard page | - | L | L | Low | P3 |
| 108 | Prediction accuracy line chart | - | M | M | Low | P3 |
| 109 | Content ROI metrics | - | M | M | Low | P3 |
| 110 | Trend charts (30/60/90 day) | - | M | M | Low | P3 |

### Cross-Cutting

| # | Feature | Backend | Frontend | Total | Risk | Phase |
|---|---------|---------|----------|-------|------|-------|
| 111 | Recharts integration + chart theming | - | M | M | Low | P1 |
| 112 | Responsive table/card component | - | M | M | Low | P1 |
| 113 | SSE shared hook (useSSE) | - | S | S | Low | P1 |
| 114 | RTL Arabic support (all pages) | - | L | L | Medium | P2 |
| 115 | Arabic font loading (Cairo/Tajawal) | - | S | S | Low | P2 |
| 116 | Dashboard sidebar update (7 new nav items) | - | S | S | Low | P1 |
| 117 | API client library (30+ new functions in api.ts) | - | L | L | Low | P1 |
| 118 | Error boundary + loading states for new pages | - | M | M | Low | P1 |
| 119 | Test coverage for new backend modules | L | - | L | Low | P1 |
| 120 | Integration tests for OAuth flow | M | - | M | Medium | P1 |

---

## 2. Quick Wins — S Effort + P0/P1 Priority

Features that deliver immediate value with minimal effort:

| # | Feature | Effort | Priority | Impact |
|---|---------|--------|----------|--------|
| 15 | CORS allowlist | S | P0 | Security hardening for production |
| 16 | IP-based rate limiting | S | P0 | DDoS protection baseline |
| 13 | Cloudflare DNS setup | S | P0 | Free DDoS protection |
| 14 | SSL/TLS via Coolify | S | P0 | Required for production |
| 20 | OAuth token encryption | S | P0 | Reuse existing KeyManager — near-zero effort |
| 3 | client_connections migration | S | P0 | SQL script, 10 minutes |
| 4 | content_inventory migration | S | P0 | SQL script, 10 minutes |
| 6 | keyword_opportunities migration | S | P0 | SQL script, 10 minutes |
| 7 | writer_personas migration | S | P0 | SQL script, 10 minutes |
| 8 | performance_predictions migration | S | P0 | SQL script, 10 minutes |
| 74 | Arabic content detection | S | P1 | Unicode range check, 20 lines |
| 78 | Freshness signals check | S | P1 | Date comparison, trivial logic |
| 80 | Readability scoring | S | P1 | Flesch-Kincaid formula, 30 lines |
| 52 | Priority scoring formula | S | P1 | Weighted arithmetic, 20 lines |
| 116 | Sidebar nav update | S | P1 | Add 7 links to existing component |
| 113 | SSE shared hook | S | P1 | Extract existing pattern, 30 lines |
| 84 | Score ring visualization | S | P1 | SVG circle, 50 lines |
| 97 | Generic webhook adapter | S | P2 | Extend existing webhook system |
| 98 | Publish event webhooks | S | P2 | Add 3 event types to existing |

**Total quick wins: 19 features, ~25-35 days of work**, delivering security hardening, database schema, scoring foundations, and dashboard scaffolding.

---

## 3. High-Risk Features Requiring Spike/POC

| Feature | Risk Description | Spike Duration | Blocking? |
|---------|-----------------|----------------|-----------|
| HDBSCAN writer clustering (#63/#64) | Density-based clustering without npm deps. K-means fallback may produce inferior persona grouping. Need to evaluate quality with real corpus data. | 3-5 days | No — voice analysis can launch with manual personas |
| Google OAuth verification (#19) | Google's verification process takes 2-6 weeks and may require privacy policy, terms of service, homepage verification. Rejection delays the entire ingestion layer. | 1 day (submit) + 2-6 weeks (wait) | YES — submit Day 1 |
| WordPress builder compatibility (#93) | Plugin operates at wp_posts level (universal), but visual builders (Elementor, WPBakery) may override content rendering. Need to test with each builder. | 5-7 days | No — WordPress publishing can launch for Gutenberg-only first |
| AI vs human classification accuracy (#62) | Stylometric pattern matching may not reliably distinguish AI from human content on short articles (<500 words) or translated content. False positive rate unknown. | 3-5 days | No — can launch without this signal |
| Semrush/Ahrefs API cost modeling (#26-32) | Per-request pricing varies by endpoint. Need to profile actual API usage per client to validate the $80-150/mo estimate. Overuse could blow margins. | 2-3 days | No — but must happen before enterprise pricing is locked |
| Robust HTML parsing without npm deps (#35) | Regex-based content extraction fails on JavaScript-rendered pages, malformed HTML, and complex layouts. Determines crawler reliability. | 2-3 days | No — basic regex works for 80% of sites |

---

## 4. Zero-Dep Blockers

Features that may require breaking the zero npm dependency philosophy:

| Feature | Why Zero-Dep Fails | Candidate Package | Package Size | Decision |
|---------|--------------------|--------------------|-------------|----------|
| HDBSCAN clustering | 500+ lines of matrix math, high bug risk | `ml-hdbscan` or Python shim | N/A | **Defer to Python shim (preserves Node zero-dep)** |
| Robust HTML parsing | Regex fails on real-world HTML edge cases | `htmlparser2` (32KB, zero deps itself) | 32KB | **Accept for crawler module only** |
| PDF report generation | Cannot render PDF from Node without a library | `pdfkit` (200KB) | 200KB | **Defer — HTML reports first, PDF in P3** |
| CSV export | Edge cases (commas, Unicode, newlines in fields) | None needed — manual implementation is 50 lines | N/A | **Keep zero-dep** |
| Email sending (transactional) | SMTP protocol implementation from scratch is unreasonable | Supabase Edge Functions or external service | N/A | **Use Supabase or external API (not npm)** |

**Recommendation:** The zero-dep philosophy applies to the bridge server's Node.js process. Using Python for clustering (via child_process.spawn) and external services for email does not violate this constraint. The only potential npm addition is `htmlparser2` for the crawler, and this should be a conscious team decision.

---

## 5. Calendar Estimate — Solo Developer (Realistic)

**Assumptions:**
- Single developer, full-time (8 hours/day, 5 days/week)
- Includes testing, documentation, and debugging (1.5x multiplier on raw coding)
- Does NOT include external approval wait times (Google OAuth verification, WordPress plugin review)
- Allows for 20% buffer for unexpected complexity

### Phase 0 — Foundation (Weeks 1-3)

| Week | Focus | Features |
|------|-------|----------|
| 1 | Server refactor + DB migrations | #1-11 (route splitting, all 6 migrations, RLS, indexes, aggregation table) |
| 2 | Infrastructure + deployment | #12-17 (Hetzner, Cloudflare, SSL, CORS, rate limiting, test infra) |
| 3 | OAuth foundation + connections UI | #18-21, #41-43 (OAuth flow, token encryption, connections page) |

**Deliverable: Production-ready infrastructure with OAuth login flow.**

### Phase 1 — Data Ingestion + Intelligence Core (Weeks 4-10)

| Week | Focus | Features |
|------|-------|----------|
| 4 | GSC + GA4 clients | #22-25 (API clients + daily pull) |
| 5 | Semrush + Ahrefs clients | #26-32 (API clients, keyword + backlink data) |
| 6 | Crawler + scheduler | #34, #36-40 (HTTP crawler, caching, scheduler, normalization) |
| 7 | Intelligence: decay + gaps | #44-47, #52-53 (inventory, decay, gaps, scoring) |
| 8 | Intelligence: cannibalization + recommendations | #49, #59 (cannibalization, topic recommender agent) |
| 9 | Frontend: inventory + opportunities pages | #54-57, #111-113, #116-118 (Recharts, tables, SSE hook, nav, api.ts) |
| 10 | Quality Gate engine | #72-75, #78-80, #82, #87 (60-point checklist, E-E-A-T, readability, suggestions) |

**Deliverable: Working intelligence pipeline — connect site, pull data, get scored recommendations.**

### Phase 2 — Voice + Quality + Publishing (Weeks 11-17)

| Week | Focus | Features |
|------|-------|----------|
| 11 | Quality gate frontend | #83-86 (quality report tab, score ring, checklist, suggestions) |
| 12 | Voice analysis backend | #60-62, #65-66 (corpus collection, stylometrics, AI classification) |
| 13 | Voice clustering + personas | #63, #67-71 (k-means clustering, persona generation, voice profiles page) |
| 14 | WordPress publishing backend | #88-91, #97-98 (REST API client, categories, images, SEO meta, webhooks) |
| 15 | WordPress plugin (PHP) | #92 (plugin file, admin settings, publisher class, webhook handler) |
| 16 | Publishing frontend + RTL | #99-102, #114-115 (publishing page, RTL support, Arabic fonts) |
| 17 | Integration testing + hardening | #93, #119-120 (builder compat testing, test coverage, OAuth integration tests) |

**Deliverable: Full content pipeline — recommend, generate with voice, score quality, publish to WordPress.**

### Phase 3 — Feedback Loop + Shopify + Polish (Weeks 18-22)

| Week | Focus | Features |
|------|-------|----------|
| 18 | Feedback loop backend | #103-106 (30/60/90d checks, prediction comparison, recalibration) |
| 19 | Feedback loop frontend | #107-110 (performance page, accuracy charts, ROI metrics) |
| 20 | Advanced intelligence | #48, #50-51, #58, #76-77, #81 (saturation index, seasonality, heat map, voice scoring, auto-revision) |
| 21 | Shopify integration | #94-96 (Blog API client, product references, embedded app) |
| 22 | HDBSCAN upgrade + final polish | #64, #35, #33 (Python shim clustering, robust HTML parsing, Google Trends) |

**Deliverable: Complete 6-layer platform with feedback loop and multi-CMS publishing.**

### Total Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 0 (Foundation) | 3 weeks | Week 3 |
| Phase 1 (Ingestion + Intelligence) | 7 weeks | Week 10 |
| Phase 2 (Voice + Quality + Publishing) | 7 weeks | Week 17 |
| Phase 3 (Feedback + Shopify + Polish) | 5 weeks | Week 22 |

**Total: ~22 weeks (5.5 months) for a solo developer.**

**With 20% buffer: ~26 weeks (6.5 months).**

This is aggressive but realistic. The biggest time sinks are: WordPress plugin development (PHP + compatibility testing), voice analysis (novel NLP work), and the 7 new dashboard pages (each needs responsive + RTL). Infrastructure and API client work is mostly mechanical.

---

## 6. Critical Path

What MUST be built first for anything else to work, in strict dependency order:

```
1. server.js route splitting (#1)
   └── Everything else depends on being able to add endpoints without a 3000-line monolith

2. Supabase migrations (#3-8) + RLS (#9) + indexes (#10)
   └── Every new feature writes to these tables

3. Hetzner deployment (#12-14)
   └── Bridge must be accessible from the internet for OAuth callbacks and CMS webhooks

4. Google OAuth2 flow (#18-21)
   └── GSC and GA4 ingestion requires user-authorized OAuth tokens

5. GSC API client (#22-23)
   └── Decay detection, gap analysis, and cannibalization all consume GSC data

6. Content inventory crawler (#34, #44)
   └── Intelligence layer needs a map of what content exists

7. Decay detection + gap analysis (#45-47)
   └── These produce the scored recommendations that drive article generation

8. Priority scoring (#52-53)
   └── Recommendations need scores for the Opportunities dashboard

9. Recharts + responsive table (#111-112)
   └── Every data-heavy dashboard page depends on these shared components

10. API client library (api.ts) (#117)
    └── Every dashboard page depends on this for data fetching
```

**Items 1-4 are hard blockers.** No new feature can ship without route splitting, database tables, deployment, and OAuth. These must be completed in the first 3 weeks.

**Items 5-8 form the intelligence critical path.** Without GSC data and content inventory, the recommendation engine has nothing to analyze.

**Items 9-10 are the frontend critical path.** Without shared chart/table components and the API client, individual pages cannot be built.
