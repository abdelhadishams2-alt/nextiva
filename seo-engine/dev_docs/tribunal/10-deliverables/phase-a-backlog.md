# Phase A Backlog -- Sprint-Ready User Stories

**Phase:** A (Foundation + Data Core)
**Duration:** Weeks 1-6, 3 sprints of 2 weeks each
**Developer:** Solo (full-time, 40 hours/week)
**Source:** Tribunal Round 4 MoSCoW Verdict (binding), Phase A Sprint Plan
**Total Story Points:** 89

---

## Sprint 1: Infrastructure Foundation (Weeks 1-2)

**Sprint Goal:** Production-ready infrastructure with no new features -- route splitting, database, deployment, security, design system, and test tooling.
**Sprint Points:** 34

---

```
Story #1: Route Splitting Refactor
As a developer, I want the bridge server decomposed into route modules,
so that I can add new endpoints without touching a 1,471-line monolith.
Points: 8
Sprint: 1 (Weeks 1-2)
Dependencies: none
Acceptance Criteria:
  - [ ] server.js is reduced to <400 lines of middleware, CORS, rate limiting, and dispatch
  - [ ] Route modules exist: routes/auth.js, routes/admin.js, routes/edit.js, routes/health.js, routes/connections.js, routes/intelligence.js, routes/quality.js, routes/publishing.js
  - [ ] Each route group exports a handler function matching the existing (req, res) signature
  - [ ] All 228 existing tests still pass after refactor
  - [ ] No single route module exceeds 300 lines
Technical Notes: Extract endpoint handlers from the if/else chain into separate files. Core server retains middleware (CORS, auth, rate limiting, JSON parsing) and dispatches to route handlers. This is Risk #1 (score 20/25) -- highest-priority refactor.
```

---

```
Story #2: Supabase Database Migrations (6 New Tables)
As a platform engineer, I want 6 new database tables with RLS policies and indexes,
so that the data ingestion and intelligence layers have a persistence foundation.
Points: 5
Sprint: 1 (Weeks 1-2)
Dependencies: none
Acceptance Criteria:
  - [ ] client_connections table exists with columns: id, client_id, provider, access_token_encrypted, refresh_token_encrypted, token_expiry, last_successful_pull, status, created_at
  - [ ] content_inventory table exists with columns: id, client_id, url, title, meta_description, h1, word_count, publish_date, last_modified, last_crawl, status, created_at
  - [ ] keyword_opportunities table exists with columns: id, client_id, keyword, type (decay/gap/recommendation), score, severity, source_url, competitor_url, difficulty, traffic_potential, created_at
  - [ ] writer_personas table exists with columns: id, client_id, name, persona_json, articles_analyzed, confidence, created_at
  - [ ] performance_snapshots table exists with columns: id, client_id, url, date, clicks, impressions, ctr, position, sessions, engagement_rate, bounce_rate, created_at (partitioned by month)
  - [ ] performance_predictions table exists with columns: id, client_id, url, predicted_traffic, actual_traffic, predicted_position, actual_position, measurement_date, accuracy_score, created_at
  - [ ] RLS policies on all 6 tables enforce client_id isolation via auth.uid()
  - [ ] Migration scripts run without errors on a clean Supabase database in under 30 seconds
Technical Notes: Use Supabase SQL migrations. RLS policies use auth.uid() matching client_id for multi-tenant isolation. performance_snapshots uses PostgreSQL range partitioning by month.
```

---

```
Story #3: Performance Snapshots Partitioning Spike
As a platform engineer, I want to validate that PostgreSQL range partitioning
handles 1M+ rows with acceptable query performance,
so that I can confidently design the performance_snapshots schema.
Points: 3
Sprint: 1 (Weeks 1-2)
Dependencies: Story #2 must be done first
Acceptance Criteria:
  - [ ] 1M simulated rows inserted into performance_snapshots across 6 monthly partitions
  - [ ] Date-range queries (single month) execute in <500ms
  - [ ] Cross-partition queries (3 months) execute in <2 seconds
  - [ ] Monthly rollup aggregation query produces correct averages
  - [ ] 90-day purge job deletes daily rows older than 90 days after rollup, reports rows deleted
  - [ ] Spike results documented with query plans and timing data
Technical Notes: Generate synthetic data with realistic distribution (10K URLs, 100 days). Test on Supabase Pro plan. If partitioning underperforms, fallback is flat table with purge job and index on (client_id, url, date).
```

---

```
Story #4: Hetzner + Coolify Deployment
As a platform engineer, I want the bridge server running on a production VPS,
so that OAuth callbacks work and enterprise clients can access the platform.
Points: 3
Sprint: 1 (Weeks 1-2)
Dependencies: none
Acceptance Criteria:
  - [ ] Hetzner Cloud VPS provisioned (CPX21: 3 vCPU, 4GB RAM, 80GB SSD)
  - [ ] Coolify installed and operational for container orchestration
  - [ ] Docker container configured for bridge server
  - [ ] Environment variables set in Coolify (Supabase keys, OAuth credentials)
  - [ ] Bridge server accessible from the internet via HTTP (HTTPS handled by Story #5)
  - [ ] Zero-downtime deployment verified: push new container, old one drains, new one starts
Technical Notes: Hetzner provisions in minutes. Coolify install is a single command. The bridge server's zero-dependency design means the Docker image is minimal (Node.js alpine + source code).
```

---

```
Story #5: Cloudflare DNS + SSL/TLS
As a platform engineer, I want HTTPS on the production domain with DDoS protection,
so that OAuth flows are secure and enterprise clients trust the endpoint.
Points: 2
Sprint: 1 (Weeks 1-2)
Dependencies: Story #4 must be done first
Acceptance Criteria:
  - [ ] Domain DNS pointed to Hetzner VPS IP via Cloudflare
  - [ ] Cloudflare DDoS protection active (free tier)
  - [ ] SSL/TLS certificate issued via Let's Encrypt (Coolify auto-renewal)
  - [ ] HTTPS works end-to-end: browser to Cloudflare to Coolify to bridge server
  - [ ] HTTP to HTTPS redirect active
  - [ ] DNS propagation verified from external network
Technical Notes: Cloudflare DNS propagation is typically <5 minutes. Let's Encrypt certificates auto-renew through Coolify's reverse proxy. No manual certificate management required.
```

---

```
Story #6: Security Hardening (CORS + Rate Limiting + Token Encryption)
As a platform engineer, I want production-grade security controls,
so that the bridge server is safe to expose to the internet.
Points: 3
Sprint: 1 (Weeks 1-2)
Dependencies: Story #4 must be done first
Acceptance Criteria:
  - [ ] CORS wildcard (*) replaced with explicit allowlist of dashboard domain(s)
  - [ ] CORS headers verified: only allowlisted origins receive Access-Control-Allow-Origin
  - [ ] IP-based rate limiting active (configurable threshold, in-memory for MVP)
  - [ ] Rate limiter blocks requests after threshold (tested with 10 requests/minute)
  - [ ] Rate limiter returns 429 Too Many Requests with Retry-After header
  - [ ] OAuth token encryption pattern uses existing KeyManager AES-256-GCM
Technical Notes: Reuse the existing key-manager.js AES-256-GCM pattern for OAuth token encryption. Rate limiter is in-memory for Phase A; Redis-backed upgrade planned for Phase B if needed.
```

---

```
Story #7: Test Infrastructure for New Modules
As a developer, I want a consistent test runner setup with utilities,
so that all new modules can be tested from day one.
Points: 3
Sprint: 1 (Weeks 1-2)
Dependencies: none
Acceptance Criteria:
  - [ ] node:test runner configured with consistent patterns for new modules
  - [ ] Test utilities created: mock Supabase client, mock HTTP server, test fixtures
  - [ ] Integration test template exists for OAuth flow (used in Sprint 2)
  - [ ] Running npm test executes all test suites (existing 228 + new)
  - [ ] Minimum coverage requirement documented: all new route handlers must have tests
  - [ ] CI-ready: tests can be run in a Docker container for future automation
Technical Notes: Use Node.js built-in test runner (node:test). No test framework dependencies. Mock Supabase client simulates RLS behavior for unit tests. Integration tests hit the real bridge server on a test port.
```

---

```
Story #8: Design System Foundation + RTL Support
As a frontend developer, I want design tokens, base components, and RTL support,
so that all dashboard pages have consistent styling from day one.
Points: 5
Sprint: 1 (Weeks 1-2)
Dependencies: none
Acceptance Criteria:
  - [ ] CSS custom properties defined: colors (8+ tokens), typography (4 sizes), spacing (6 steps), shadows (3 levels)
  - [ ] Base components built: Card, DataTable, StatusBadge, LoadingSpinner, EmptyState
  - [ ] Arabic font loading configured: Cairo and Tajawal web fonts
  - [ ] CSS logical properties used throughout: margin-inline-start, padding-inline-end, text-align: start (not left/right)
  - [ ] All base components render correctly in both LTR and RTL modes
  - [ ] dir="rtl" attribute toggles layout direction without layout breakage
Technical Notes: Per tribunal reservation P04 (Nadia, Editorial Lead), basic RTL CSS and Arabic font loading are pulled from Phase C into Phase A. This is S+S effort on top of the M-effort design system work. Full Arabic/RTL validation (#38) remains in Phase C.
```

---

```
Story #9: Google OAuth Consent Screen Submission
As a product owner, I want the Google OAuth consent screen submitted on Day 1,
so that the 2-6 week verification timeline runs in parallel with development.
Points: 2
Sprint: 1 (Weeks 1-2)
Dependencies: none (but requires privacy policy URL, ToS URL, logo)
Acceptance Criteria:
  - [ ] Google Cloud project created (or existing project configured)
  - [ ] OAuth consent screen configured with: app name, support email, developer email
  - [ ] Privacy policy URL provided and accessible
  - [ ] Terms of Service URL provided and accessible
  - [ ] Application logo uploaded (120x120px)
  - [ ] Minimum scopes requested: webmasters.readonly (GSC), analytics.readonly (GA4)
  - [ ] Consent screen submitted for verification
  - [ ] Submission confirmation received from Google
Technical Notes: This is NOT a code task -- it is an administrative task that gates all data ingestion. If privacy policy and ToS are not ready, draft minimal acceptable versions using legal templates. Google requires adequacy, not perfection. Testing mode (100 users) is available immediately; full verification takes 2-6 weeks.
```

---

**Sprint 1 Total: 34 points across 9 stories**

---

## Sprint 2: Data Connectors (Weeks 3-4)

**Sprint Goal:** Google OAuth working end-to-end, GSC and GA4 data pulling into the database, content inventory crawled for at least one real website.
**Sprint Points:** 29

---

```
Story #10: Google OAuth2 Flow
As a content manager, I want to click "Connect Google" and authorize ChainIQ
to access my Search Console and Analytics data,
so that the platform can ingest my performance data automatically.
Points: 8
Sprint: 2 (Weeks 3-4)
Dependencies: Story #1 (route splitting), Story #2 (DB migrations), Story #4 (Hetzner deployment)
Acceptance Criteria:
  - [ ] Backend endpoint generates OAuth authorization URL with PKCE challenge
  - [ ] User is redirected to Google consent screen with correct scopes
  - [ ] Callback endpoint exchanges authorization code for access + refresh tokens
  - [ ] Tokens encrypted at rest using AES-256-GCM (KeyManager pattern)
  - [ ] Tokens stored in client_connections table with expiry timestamp
  - [ ] Proactive token refresh: refreshes 10 minutes before expiry, not at expiry
  - [ ] Retry with exponential backoff on refresh failure (3 attempts over 15 minutes)
  - [ ] After 3 failed refreshes: connection marked as expired, dashboard alert shown
  - [ ] Frontend: "Connect Google" button, redirect handler, success/error state display
  - [ ] Full flow works in Google Testing mode (100 users)
Technical Notes: Use Google's OAuth2 endpoints directly via native fetch (no googleapis npm package). PKCE (Proof Key for Code Exchange) is required for server-side flows. Store encrypted tokens in Supabase with RLS isolation per client.
```

---

```
Story #11: GSC Search Analytics API Client
As a content intelligence platform, I want to pull Search Console data daily,
so that the intelligence engine has clicks, impressions, CTR, and position data per URL.
Points: 8
Sprint: 2 (Weeks 3-4)
Dependencies: Story #10 (OAuth flow)
Acceptance Criteria:
  - [ ] GSC connector module (bridge/connectors/gsc.js) wraps searchAnalytics.query endpoint
  - [ ] Pulls data by URL and query: clicks, impressions, CTR, average position
  - [ ] Historical data import: pulls last 16 months of GSC data on first connection
  - [ ] Daily data pull normalizes into content_inventory and keyword_opportunities tables
  - [ ] ContentPerformanceRecord normalization: unified schema across data sources
  - [ ] Rate limit handling: respects GSC's 1,200 requests/minute quota
  - [ ] Error handling: token expired, API error, empty response, network failure
  - [ ] Unit tests for response parsing, normalization, and error cases
  - [ ] Integration test: real GSC data pull against a test account
Technical Notes: GSC retains 16 months of data. First connection triggers historical import (paginated, may take several minutes for large sites). Subsequent pulls are incremental (last 3 days to catch late-arriving data).
```

---

```
Story #12: GA4 Reporting API Client
As a content intelligence platform, I want to pull Google Analytics 4 data daily,
so that I have engagement metrics (sessions, bounce rate, conversions) per URL.
Points: 8
Sprint: 2 (Weeks 3-4)
Dependencies: Story #10 (OAuth flow)
Acceptance Criteria:
  - [ ] GA4 connector module (bridge/connectors/ga4.js) wraps GA4 Data API v1beta
  - [ ] Pulls metrics: sessions, engagement rate, average engagement time, conversions, bounce rate
  - [ ] Pulls dimensions: pagePath, date, source/medium, country
  - [ ] Daily data pull normalizes into performance_snapshots table
  - [ ] Historical data import: pulls available GA4 data on first connection
  - [ ] Quota management: respects GA4 property-level quotas
  - [ ] Error handling: token expired, quota exceeded, property not found, network failure
  - [ ] Unit tests for response parsing, normalization, and error cases
Technical Notes: GA4 Data API uses a different authentication flow than GSC but shares the same OAuth tokens (same Google account). Quota varies by property size. Implement with retry and exponential backoff.
```

---

```
Story #13: HTTP Content Crawler
As a content intelligence platform, I want to crawl a website and extract page metadata,
so that I have a complete inventory of all content URLs with their attributes.
Points: 5
Sprint: 2 (Weeks 3-4)
Dependencies: Story #2 (DB migrations for content_inventory table)
Acceptance Criteria:
  - [ ] Crawler module (bridge/connectors/crawler.js) accepts a domain URL
  - [ ] Crawls sitemap.xml first (fast path) for URL discovery
  - [ ] Falls back to link-following for sites without sitemaps
  - [ ] Respects robots.txt (checks before crawling each URL)
  - [ ] Extracts per URL: title, meta description, H1, word count, publish date, last modified date
  - [ ] Rate-limits crawling: max 2 requests/second to avoid overloading target sites
  - [ ] Persists to content_inventory table with crawl timestamp
  - [ ] Handles: redirects, 404s, timeouts, malformed HTML gracefully
  - [ ] Unit tests for sitemap parsing, robots.txt checking, HTML extraction
  - [ ] Integration test: crawl a known static HTML site, verify extracted data
Technical Notes: Uses regex-based HTML extraction (not full DOM parsing). Acceptable for 80% of sites. JavaScript-rendered pages will fail -- robust HTML parsing is deferred to Phase D (feature #35). Port URL discovery logic from old-seo-blog-checker if applicable.
```

---

**Sprint 2 Total: 29 points across 4 stories**

---

## Sprint 3: Scheduler, Intelligence Seed, Dashboard (Weeks 5-6)

**Sprint Goal:** Data pulls run automatically on a schedule, decay detection and gap analysis produce scored outputs from real data, dashboard pages display connections and content inventory.
**Sprint Points:** 26

---

```
Story #14: Ingestion Scheduler
As a platform operator, I want data pulls to run automatically on a daily schedule,
so that intelligence outputs are always based on fresh data.
Points: 3
Sprint: 3 (Weeks 5-6)
Dependencies: Story #11 (GSC client), Story #12 (GA4 client)
Acceptance Criteria:
  - [ ] Daily scheduler triggers GSC and GA4 pulls at 03:00 UTC
  - [ ] Weekly scheduler placeholder exists for Semrush/Ahrefs (Phase B connectors)
  - [ ] Missed-job recovery: on process restart, checks last_successful_pull, executes immediately if >24h stale
  - [ ] Per-client, per-source last_successful_pull timestamps stored in client_connections
  - [ ] Error handling: try/catch all tasks, log failures, mark connection as stale after 48 hours
  - [ ] /health endpoint enhanced: reports scheduler status (last run, next run, error count)
  - [ ] Scheduler runs unattended for 48+ hours with zero silent failures
  - [ ] Unit tests for task registration, execution timing, missed-job detection
Technical Notes: Use setInterval with a cron-like time check (not a cron library -- zero dependencies). On process restart (Coolify container restart), immediately check for stale data and execute missed pulls. This directly mitigates Risk #8 (silent scheduler failure, score 12/25).
```

---

```
Story #15: Data Purge and Rollup Policy
As a platform engineer, I want automated data aggregation and purging,
so that performance_snapshots does not grow unbounded.
Points: 3
Sprint: 3 (Weeks 5-6)
Dependencies: Story #3 (partitioning spike), Story #14 (scheduler)
Acceptance Criteria:
  - [ ] Monthly rollup aggregation: daily granularity retained for 90 days, then rolled up to monthly averages
  - [ ] Automated purge job: runs monthly, deletes daily-granularity rows older than 90 days after rollup
  - [ ] Configurable retention per client (enterprise clients may request longer retention)
  - [ ] Purge job logs: rows rolled up, rows deleted, storage freed
  - [ ] Purge job tested with simulated 90+ day old data: verify rollup accuracy and deletion
  - [ ] Unit tests: rollup averages match expected values from daily data
Technical Notes: Rollup stores monthly averages per URL (clicks_avg, impressions_avg, ctr_avg, position_avg, sessions_avg). Purge runs after rollup confirms success. This ensures performance_snapshots stays within Supabase storage limits even at enterprise scale.
```

---

```
Story #16: Decay Detection Engine
As a content manager, I want to see which articles are losing traffic,
so that I can prioritize content refreshes before rankings deteriorate further.
Points: 5
Sprint: 3 (Weeks 5-6)
Dependencies: Story #11 (GSC client), Story #13 (content crawler)
Acceptance Criteria:
  - [ ] Decay engine compares current month performance to average of prior 3 months (rolling window)
  - [ ] URLs with >20% single-month drop flagged with severity: mild (20-35%), moderate (35-50%), severe (>50%)
  - [ ] Output: scored decay alerts in keyword_opportunities table with type=decay
  - [ ] Priority scoring: weighted arithmetic combining decay severity, traffic volume, keyword difficulty, content age
  - [ ] Produces at least 5 meaningful decay alerts for the SRMG test domain
  - [ ] Does not produce false positives for URLs with <100 monthly impressions (minimum threshold)
  - [ ] Unit tests with synthetic 6-month performance curves with known decay points
Technical Notes: Port core logic from Master Kit 36-seo module. Input is GSC data from content_inventory. The 3-month rolling window requires at least 4 months of historical data -- the GSC historical import (Story #11) provides up to 16 months.
```

---

```
Story #17: Keyword Gap Analyzer
As a content strategist, I want to see keywords my competitors rank for that I do not,
so that I can identify content opportunities with proven search demand.
Points: 5
Sprint: 3 (Weeks 5-6)
Dependencies: Story #11 (GSC client)
Acceptance Criteria:
  - [ ] Gap analyzer compares client ranking keywords (GSC) against competitor keywords
  - [ ] Phase A version: GSC-only analysis (queries where competitor has impressions but client does not)
  - [ ] Competitor domains configured per client (manual input via dashboard or API)
  - [ ] Output: scored keyword opportunities in keyword_opportunities table with type=gap
  - [ ] Priority scoring: traffic potential, keyword difficulty estimate, content gap size
  - [ ] Produces at least 10 keyword opportunities from GSC data
  - [ ] Unit tests with mock GSC data for two domains
  - [ ] Clear documentation: "Phase A is GSC-only. Full gap analysis with Semrush data available in Phase B."
Technical Notes: Phase A gap analysis is limited to queries where the client already has some GSC impressions. Full competitor keyword discovery requires Semrush/Ahrefs data (Phase B, features #4 and #5). Set expectations accordingly.
```

---

```
Story #18: Connections Dashboard Page
As a content manager, I want to see all my connected data sources and their health,
so that I know my data is flowing and can reconnect expired connections.
Points: 5
Sprint: 3 (Weeks 5-6)
Dependencies: Story #10 (OAuth flow), Story #8 (design system)
Acceptance Criteria:
  - [ ] "Connect Google" button initiates OAuth flow (from Story #10)
  - [ ] Connected accounts display as status cards: service name, account identifier, last sync time, health status
  - [ ] Health indicators: green (fresh, <24h), yellow (stale, >24h), red (expired or >48h stale)
  - [ ] "Disconnect" button with confirmation dialog
  - [ ] Data freshness banner: "Data last updated X hours ago" (yellow/red if stale)
  - [ ] Auto-refresh status on page load (no manual refresh needed)
  - [ ] Empty state: "Connect your Google account to start ingesting data"
  - [ ] Page renders correctly in both LTR and RTL modes
Technical Notes: Uses base components from Story #8 (Card, StatusBadge, LoadingSpinner, EmptyState). Health status derived from last_successful_pull in client_connections table. Freshness banner is a leading indicator -- stale data means bad intelligence.
```

---

```
Story #19: Content Inventory Dashboard Page (Basic Version)
As a content manager, I want to see all my crawled URLs with health indicators,
so that I can understand the state of my content portfolio at a glance.
Points: 5
Sprint: 3 (Weeks 5-6)
Dependencies: Story #13 (crawler), Story #16 (decay detection), Story #8 (design system)
Acceptance Criteria:
  - [ ] Data table displays: URL, title, word count, publish date, last crawl date
  - [ ] Health indicator per URL: healthy (green), declining (yellow), decaying (red) based on decay detection output
  - [ ] Search by URL or title (client-side filter for <1000 URLs, server-side for larger sets)
  - [ ] Sort by any column (click column header)
  - [ ] Pagination: 50 items per page with server-side pagination
  - [ ] Empty state: "Connect your Google Search Console to see your content inventory"
  - [ ] Page renders correctly in both LTR and RTL modes
  - [ ] Performance: page loads in <2 seconds with 1000 URLs
Technical Notes: This is a basic version of feature #10 (classified as Should Have Phase B in the tribunal). The tribunal's critical path analysis shows it is needed for the vertical slice demo at the end of Phase A. Full version with advanced filters, bulk actions, and export is Phase B.
```

---

**Sprint 3 Total: 26 points across 6 stories**

---

## Phase A Summary

### Story Points by Sprint

| Sprint | Weeks | Stories | Points | Theme |
|--------|-------|---------|--------|-------|
| 1 | 1-2 | 9 | 34 | Infrastructure foundation |
| 2 | 3-4 | 4 | 29 | Data connectors |
| 3 | 5-6 | 6 | 26 | Scheduler, intelligence, dashboard |
| **Total** | **1-6** | **19** | **89** | |

### Velocity Assumption

At 40 hours/week for a solo developer, the assumed velocity is approximately 15 story points per week (30 points per 2-week sprint). Sprint 1 is loaded slightly above this (34 points) because it includes several small stories (2-3 points) that parallelize well. Sprints 2 and 3 are within range.

If velocity falls below 12 points/week by the end of Sprint 1, the Sprint 2 scope should be reviewed. The most likely candidate for deferral is the GA4 client (Story #12), which is the least critical of the data connectors -- GSC data alone is sufficient for decay detection and gap analysis.

### Must Have Features Covered

All 8 Must Have features assigned to Phase A by the tribunal verdict are covered:

| Tribunal # | Feature | Story # |
|-----------|---------|---------|
| 1 | Google OAuth2 flow | Story #10 |
| 2 | GSC Search Analytics API client | Story #11 |
| 3 | GA4 Reporting API client | Story #12 |
| 7 | HTTP content crawler | Story #13 |
| 8 | Ingestion scheduler | Story #14 |
| 9 | Connections dashboard page | Story #18 |
| 11 | Decay detection engine | Story #16 |
| 12 | Keyword gap analyzer | Story #17 |

### Foundation Work Covered

All 7 foundation items from the sprint plan are covered:

| Foundation Item | Story # |
|----------------|---------|
| server.js route splitting refactor | Story #1 |
| 6 Supabase DB migrations + RLS + indexes | Story #2 |
| performance_snapshots partitioning spike | Story #3 |
| Hetzner + Coolify deployment | Story #4 |
| Cloudflare DNS + SSL/TLS | Story #5 |
| CORS allowlist + rate limiting + token encryption | Story #6 |
| Test infrastructure for new modules | Story #7 |
| Design system tokens + base components + RTL | Story #8 |
| Google OAuth consent screen submission | Story #9 |

### Dependency Chain

```
Story #1 (Route Split) ──┐
Story #2 (DB Migrations) ─┤
Story #4 (Hetzner) ───────┤──► Story #10 (OAuth) ──► Story #11 (GSC) ──► Story #16 (Decay)
                          │                      ──► Story #12 (GA4)     Story #17 (Gap)
Story #2 ──► Story #3 (Partition Spike)                                  Story #14 (Scheduler)
Story #4 ──► Story #5 (SSL) ──► Story #6 (Security)
Story #8 (Design) ──────────────────────────────────► Story #18 (Connections Page)
Story #13 (Crawler) ────────────────────────────────► Story #19 (Inventory Page)
Story #9 (OAuth Submission) -- external, no code dependency
Story #7 (Test Infra) -- independent, enables all subsequent testing
```

### Exit Criteria

Phase A is complete when all 19 stories are Done and the Phase A Completion Checklist from the sprint plan is satisfied. The checklist is the contract -- individual story completion is necessary but not sufficient. The system must work end-to-end: a user connects Google, data flows daily, decay alerts appear, gap opportunities are scored, and the dashboard displays it all.
