# Phase A Sprint Plan — Foundation + Data Ingestion

**Duration:** Weeks 1-6 (6 weeks, 3 sprints of 2 weeks each)
**Theme:** Build the infrastructure skeleton, establish data pipelines, deliver first intelligence outputs
**Developer:** Solo (full-time, 8 hours/day, 5 days/week)
**Binding Source:** Tribunal Round 4 MoSCoW Verdict (15/15 approval)

---

## Phase A Feature Set (15 features from tribunal verdict)

| # | Feature | MoSCoW | Effort | Sprint |
|---|---------|--------|--------|--------|
| 1 | Google OAuth2 flow | Must Have | L | 2 |
| 2 | GSC Search Analytics API client | Must Have | L | 2 |
| 3 | GA4 Reporting API client | Must Have | L | 2 |
| 7 | HTTP content crawler | Must Have | L | 2 |
| 8 | Ingestion scheduler | Must Have | M | 3 |
| 9 | Connections dashboard page | Must Have | M | 3 |
| 11 | Decay detection engine | Must Have | L | 3 |
| 12 | Keyword gap analyzer | Must Have | L | 3 |
| -- | server.js route splitting refactor | Foundation | L | 1 |
| -- | 6 Supabase DB migrations + RLS + indexes | Foundation | M+6S | 1 |
| -- | Hetzner + Coolify deployment | Foundation | M | 1 |
| -- | Cloudflare DNS + SSL/TLS | Foundation | S+S | 1 |
| -- | CORS allowlist + rate limiting | Foundation | S+S | 1 |
| -- | Test infrastructure for new modules | Foundation | M | 1 |
| -- | Design system tokens + base components | Foundation | M | 1 |

**Also included per tribunal reservations:**
- Arabic font loading (S effort) -- moved from Phase C per P04 (Nadia) reservation
- Basic CSS logical properties for RTL (S effort) -- moved from Phase C per P04 reservation

---

## Sprint 1: Infrastructure Foundation (Weeks 1-2)

### Day-1 Action

**Submit the Google OAuth consent screen application to Google Cloud Console.** This is the single highest-leverage action item in the entire project. The 2-6 week verification timeline runs in parallel with development ONLY if submitted on Day 1. Every day of delay adds a day to the entire intelligence pipeline's availability. The submission requires: privacy policy URL, terms of service URL, homepage URL, application logo (120x120px), and the minimum OAuth scopes (`webmasters.readonly` for GSC, `analytics.readonly` for GA4). If privacy policy and ToS are not ready, draft them first -- this is the true Day 1 blocker (Risk #3, score 15/25).

### Features That Ship

**1. server.js Route Splitting Refactor (effort L, 1-2 weeks)**
- Decompose the 1,471-line monolith into route modules: `routes/auth.js`, `routes/admin.js`, `routes/edit.js`, `routes/health.js`, `routes/connections.js`, `routes/intelligence.js`, `routes/quality.js`, `routes/publishing.js`
- Core server.js reduces to approximately 300 lines of middleware, CORS, rate limiting, and dispatch
- Each route group exports a handler function matching the existing `(req, res)` signature
- Effort estimate: L (1-2 weeks). This is item #1 on the critical path from the effort framework. Risk score 20/25 if not done.

**2. Supabase Migrations -- 6 New Tables (effort 6x S = 3-6 days)**
- `client_connections` -- OAuth tokens, connection status, last refresh timestamp
- `content_inventory` -- crawled URLs, metadata, performance snapshots
- `keyword_opportunities` -- gap analysis results, priority scores
- `writer_personas` -- voice profiles, stylometric features, persona JSON
- `performance_snapshots` -- daily position/traffic/CTR per URL (partitioned by month)
- `performance_predictions` -- predicted vs actual comparison data
- RLS policies for all 6 tables (effort M, 3-5 days) -- multi-tenant isolation via `auth.uid()` matching `client_id`
- Index design + performance_snapshots partitioning spike (effort M, 3-5 days) -- Risk #2 (score 20/25). Must validate PostgreSQL range partitioning with 1M simulated rows before finalizing schema. Monthly rollup aggregation table + 90-day purge job included.

**3. Hetzner + Coolify Deployment (effort M, 3-5 days)**
- Provision Hetzner Cloud VPS (CPX21 recommended: 3 vCPU, 4GB RAM, 80GB SSD, ~EUR 7.50/month)
- Install Coolify for container orchestration and zero-downtime deployments
- Configure Docker container for the bridge server
- Set up environment variables in Coolify (Supabase keys, OAuth credentials)
- Verify bridge server is accessible from the internet (required for OAuth callbacks)

**4. Cloudflare DNS + SSL/TLS (effort S+S, 2-4 days)**
- Point domain to Hetzner IP via Cloudflare DNS
- Enable Cloudflare DDoS protection (free tier)
- SSL/TLS via Coolify reverse proxy (Let's Encrypt auto-renewal)
- Verify HTTPS works end-to-end

**5. Security Hardening (effort S+S, 2-4 days)**
- Replace CORS wildcard (`*`) with explicit allowlist of dashboard domain(s)
- Implement IP-based rate limiting (in-memory for MVP, Redis-backed in Phase B)
- OAuth token encryption using existing KeyManager AES-256-GCM (effort S, reuse)

**6. Test Infrastructure (effort M, 3-5 days)**
- Set up `node:test` runner with consistent patterns for new modules
- Create test utilities: mock Supabase client, mock HTTP server, test fixtures
- Establish minimum coverage requirement: all new route handlers must have tests
- Integration test template for OAuth flow (effort M, used in Sprint 2)

**7. Design System Foundation (effort M, 3-5 days)**
- Design tokens: colors, typography, spacing, shadows (CSS custom properties)
- Base components: Card, DataTable, StatusBadge, LoadingSpinner, EmptyState
- Arabic font loading: Cairo and Tajawal (S effort, per P04 reservation)
- CSS logical properties for RTL: `margin-inline-start`, `padding-inline-end`, `text-align: start` (S effort, per P04 reservation)

### Dependencies

- Google OAuth consent screen submission (Day 1) -- external dependency, no code prerequisite
- Privacy policy URL + Terms of Service URL -- must exist before OAuth submission
- Hetzner account creation -- requires payment method
- Cloudflare account -- free tier sufficient
- Supabase project -- already exists from v1

### Success Criteria

Sprint 1 is "done" when ALL of the following are true:

1. server.js is split into route modules; no single file exceeds 400 lines
2. All 6 new Supabase tables exist with RLS policies and indexes
3. performance_snapshots partitioning is validated with 1M simulated rows (spike complete)
4. Bridge server is running on Hetzner, accessible via HTTPS at the production domain
5. CORS allowlist is active (wildcard removed)
6. Rate limiting is functional (verified with test script)
7. `node:test` runs and passes for all new modules
8. Google OAuth consent screen is submitted to Google (verification pending)
9. Design tokens and base components render correctly in both LTR and RTL

### Risk Flags

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Hetzner provisioning delay | Low | Medium | Hetzner provisions VPS in minutes; Coolify install takes ~30 minutes |
| performance_snapshots partitioning fails spike | Medium | High | Fallback: implement without partitioning, add purge job, revisit in Phase B when data volume justifies it |
| Privacy policy/ToS not ready for OAuth submission | Medium | Critical | Draft minimal acceptable versions Day 1. Use a legal template. Perfection is not required for Google submission -- adequacy is. |
| Route splitting takes longer than 2 weeks | Low | High | If approaching end of Week 2, ship with 80% refactored. Remaining routes can be split during Sprint 2 overlap. |

### Testing Requirements

- **Unit tests:** Route handler dispatch (each route module responds to correct paths)
- **Unit tests:** Supabase migration scripts run without errors on clean database
- **Unit tests:** RLS policies block cross-tenant access (test with two different `auth.uid()` values)
- **Integration tests:** Bridge server boots, responds to `/health`, returns correct CORS headers
- **Integration tests:** Rate limiter blocks after threshold (10 requests/minute for testing)
- **Manual verification:** HTTPS endpoint accessible from external network

---

## Sprint 2: Data Connectors (Weeks 3-4)

### Day-1 Action

**Implement the Google OAuth2 flow end-to-end: auth URL generation, token exchange, encrypted storage, and refresh logic.** This is the gateway to all Google data. Without a working OAuth flow, GSC and GA4 clients cannot authenticate, and the entire intelligence layer is blocked. Start with the backend (`bridge/oauth.js`), then wire up the frontend redirect handler. Use Google's Testing mode (100 users) to bypass the pending consent screen verification.

### Features That Ship

**1. Google OAuth2 Flow (effort L, 1-2 weeks)**
- Backend: `bridge/oauth.js` -- auth URL generation with PKCE, token exchange, encrypted storage in `client_connections` table
- Token refresh logic with proactive renewal (refresh 10 minutes before expiry, not at expiry)
- Retry with exponential backoff on refresh failure (3 attempts over 15 minutes)
- After 3 failed refreshes: mark connection as `expired`, surface alert in dashboard
- Frontend: "Connect Google" button, OAuth redirect handler, success/error state display
- Encrypt tokens at rest using existing KeyManager AES-256-GCM (reuse from v1)
- Minimum scopes: `webmasters.readonly` (GSC), `analytics.readonly` (GA4)
- Risk: Medium. Token refresh reliability is Risk #7 (score 9/25). Mitigated with defensive error handling from day one.

**2. GSC Search Analytics API Client (effort L, 1-2 weeks)**
- `bridge/connectors/gsc.js` -- wrapper around GSC Search Analytics API
- Endpoints: searchAnalytics.query (clicks, impressions, CTR, position by URL and query)
- Daily data pull + normalization into `content_inventory` and `keyword_opportunities` tables
- ContentPerformanceRecord normalization (effort M) -- unified schema across data sources
- Historical data import: pull last 16 months of GSC data on first connection (GSC retains 16 months)
- Rate limit handling: GSC allows 1,200 requests/minute per project (unlikely to hit with single client)

**3. GA4 Reporting API Client (effort L, 1-2 weeks)**
- `bridge/connectors/ga4.js` -- wrapper around GA4 Data API (v1beta)
- Metrics: sessions, engagement rate, average engagement time, conversions, bounce rate
- Dimensions: pagePath, date, source/medium, country
- Daily data pull + normalization into `performance_snapshots`
- Historical data import: pull available GA4 data on first connection

**4. Content Inventory Crawler (effort L, 1-2 weeks)**
- `bridge/connectors/crawler.js` -- HTTP content crawler with regex-based HTML extraction
- Crawl sitemap.xml first (fast path), fall back to link-following for sites without sitemaps
- Extract: URL, title, meta description, H1, word count, publish date, last modified date
- Persist to `content_inventory` table with crawl timestamp
- Respect robots.txt (check before crawling each URL)
- Rate limit crawling: max 2 requests/second to avoid overloading target sites
- Risk: Medium. Regex-based extraction fails on JavaScript-rendered pages (Risk noted in effort framework). Acceptable for 80% of sites; robust HTML parsing deferred to Phase D (feature #35).

### Dependencies

- Sprint 1 MUST be complete: route splitting (new endpoints need route modules), DB migrations (connectors write to new tables), Hetzner deployment (OAuth callbacks require internet-accessible server)
- Google OAuth consent screen: use Testing mode (100 users) while verification is pending. SRMG pilot can proceed under Testing mode.
- GSC and GA4 properties must be configured in the client's Google accounts

### Success Criteria

Sprint 2 is "done" when ALL of the following are true:

1. A user can click "Connect Google" in the dashboard, complete OAuth flow, and see "Connected" status
2. GSC data is pulled for a connected account and visible in the database (at minimum: top 100 URLs with clicks, impressions, CTR, position)
3. GA4 data is pulled for a connected account and visible in the database (at minimum: sessions and engagement by page path for last 30 days)
4. Content inventory crawler has crawled at least one real website (SRMG test domain) and populated the `content_inventory` table
5. Token refresh works: manually expire a token, verify it auto-refreshes on next scheduled pull
6. All connector modules have unit tests for success paths and error handling (token expired, API rate limit, network failure)

### Risk Flags

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Google OAuth verification still pending | High | Medium | Use Testing mode (100 users). SRMG pilot fits within this limit. |
| GSC API returns no data for test domain | Low | Medium | GSC requires the domain to have Search Console property verified. Ensure SRMG has GSC set up. |
| Crawler blocked by target site WAF/CDN | Medium | Low | Respect robots.txt, use standard User-Agent, add retry with exponential backoff |
| GA4 property not using Google Analytics 4 (still on Universal Analytics) | Low | Medium | Universal Analytics sunset July 2024. All active properties should be GA4 by now. |

### Testing Requirements

- **Unit tests:** OAuth token encryption/decryption round-trip
- **Unit tests:** OAuth URL generation with correct scopes and PKCE challenge
- **Unit tests:** Token refresh logic (mock Google's token endpoint)
- **Unit tests:** GSC response parsing and normalization
- **Unit tests:** GA4 response parsing and normalization
- **Unit tests:** Crawler sitemap.xml parsing, robots.txt respect, HTML extraction
- **Integration tests:** Full OAuth flow against Google's sandbox/testing environment
- **Integration tests:** GSC data pull with real test account
- **Integration tests:** Crawler against a known static HTML site

---

## Sprint 3: Scheduler, Intelligence Seed, Dashboard (Weeks 5-6)

### Day-1 Action

**Implement the ingestion scheduler with defensive error handling and staleness detection.** The scheduler is what transforms the one-time data pull (Sprint 2) into continuous data freshness. Without it, data goes stale within 24 hours and all intelligence outputs become unreliable. Start with daily GSC/GA4 pulls, add `last_successful_pull` timestamps per client per source, and implement the freshness banner ("Data last updated X hours ago") on the dashboard. This directly mitigates Risk #8 (silent scheduler failure, score 12/25).

### Features That Ship

**1. Ingestion Scheduler (effort M, 3-5 days)**
- Daily scheduler for GSC and GA4 pulls (runs at 03:00 UTC to capture previous day's finalized data)
- Weekly scheduler placeholder for Semrush/Ahrefs (Phase B connectors)
- Missed-job recovery on process restart: check `last_successful_pull`, execute immediately if >24h stale
- Per-client, per-source `last_successful_pull` timestamps in `client_connections`
- Error handling: try/catch all scheduler tasks, log failures, mark connection as `stale` after 48 hours
- Health endpoint enhancement: `/health` reports scheduler status (last run, next run, error count)
- Dead man's switch: configure Uptime Kuma on Hetzner to ping `/health` every 5 minutes

**2. Data Purge Policy (effort M, 3-5 days)**
- Monthly rollup aggregation for `performance_snapshots`: daily granularity retained for 90 days, then rolled up to monthly averages
- Automated purge job: runs monthly, deletes daily-granularity rows older than 90 days after rollup
- Configurable retention per client (enterprise clients may want longer retention)
- Logging: purge job reports rows deleted, storage freed

**3. Decay Detection Engine (effort L, 1-2 weeks)**
- Port from Master Kit 36-seo module
- 3-month rolling window: compare current month's performance to average of prior 3 months
- Decay severity scoring: flag URLs with >20% single-month drop (effort S, included)
- Input: GSC data from `content_inventory` (clicks, impressions, CTR, position over time)
- Output: scored decay alerts in `keyword_opportunities` table with severity (mild/moderate/severe)
- Priority scoring formula (effort S, included): weighted arithmetic combining decay severity, traffic volume, keyword difficulty, and content age

**4. Keyword Gap Analyzer (effort L, 1-2 weeks)**
- Compare client's ranking keywords (from GSC) against known competitor keywords
- Phase A version: GSC-only gap analysis (what queries does the competitor rank for that the client does not?)
- Phase B enhancement: Semrush cross-reference for deeper gap analysis
- Input: GSC query data for client domain + competitor domains (requires client to have verified GSC access for competitors OR manual competitor URL input)
- Output: scored keyword opportunities in `keyword_opportunities` table with difficulty estimate and traffic potential
- Risk: Medium. Full gap analysis depends on Semrush data (Phase B). Phase A version uses GSC data only, which limits accuracy to queries where the client already has some impressions.

**5. Connections Dashboard Page (effort M, 3-5 days)**
- OAuth flow UI: "Connect Google" button with redirect handler
- Connected accounts status cards: shows connected services, last sync time, connection health
- Data freshness indicators: green (fresh), yellow (>24h stale), red (>48h stale or expired)
- Disconnect button with confirmation dialog
- Auto-refresh status on page load

**6. Content Inventory Dashboard Page (effort L, 1-2 weeks)**
- Note: This is feature #10 from the tribunal verdict, classified as "Should Have" Phase B. However, the tribunal's critical path analysis shows it is needed for the vertical slice demo. We pull the basic version into Sprint 3.
- Data table with filters: URL, title, word count, publish date, last crawl date
- Search by URL or title
- Sort by any column
- Pagination (50 items per page)
- Health indicator per URL: healthy (green), declining (yellow), decaying (red) based on decay detection output
- Empty state: "Connect your Google Search Console to see your content inventory"

### Dependencies

- Sprint 2 MUST be complete: OAuth flow working, GSC/GA4 clients pulling data, crawler populating content_inventory
- At least 1 real client connection with GSC data (SRMG test account) to validate decay detection and gap analysis
- Dashboard framework (React, established in Sprint 1 with design tokens and base components)

### Success Criteria

Sprint 3 is "done" when ALL of the following are true:

1. Scheduler runs daily GSC/GA4 pulls without manual intervention for 48+ hours
2. Staleness detection works: disconnect network, verify "Data last updated X hours ago" banner appears after 24h
3. Decay detection produces scored alerts for at least 5 URLs from the SRMG test domain
4. Gap analysis produces at least 10 keyword opportunities from GSC data
5. Connections page shows connected accounts with accurate status (connected, stale, expired)
6. Content inventory page displays crawled URLs with health indicators
7. Purge job runs successfully in test mode (simulate 90+ day old data, verify rollup + deletion)
8. `/health` endpoint reports scheduler status correctly

### Risk Flags

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Insufficient GSC data for decay detection | Medium | High | SRMG test domain needs 3+ months of GSC history. If historical import (Sprint 2) did not pull enough, decay detection may produce no results. Mitigate: seed with CSV export of historical GSC data. |
| Gap analysis accuracy limited without Semrush | High | Medium | Phase A version is GSC-only. Set expectations: "basic gap analysis" in Phase A, "full gap analysis" in Phase B when Semrush is connected. |
| Dashboard page performance with 10,000+ URLs | Medium | Medium | Implement server-side pagination from day one. Do not load all URLs into the client. |
| Scheduler silently fails on Coolify restart | Medium | High | Test explicitly: restart the Coolify container, verify scheduler resumes and executes missed pulls |

### Testing Requirements

- **Unit tests:** Scheduler task registration, execution timing, missed-job detection
- **Unit tests:** Decay detection algorithm with known test data (synthesize 6-month performance curve with known decay points)
- **Unit tests:** Gap analysis with mock GSC data for two domains
- **Unit tests:** Priority scoring formula with edge cases (zero traffic, no history, single data point)
- **Unit tests:** Purge job: verify rollup accuracy (daily averages match monthly rollup)
- **Integration tests:** Scheduler runs a full cycle (pull -> process -> store) against real GSC/GA4 accounts
- **Integration tests:** Dashboard pages load with real data, pagination works, filters work
- **E2E test (manual):** Complete flow: connect Google account -> wait for first pull -> view content inventory -> see decay alerts

---

## External Dependency Timeline

### Google OAuth Consent Screen Verification

| Milestone | Target Date | Status | Notes |
|-----------|------------|--------|-------|
| Submit consent screen | Day 1 (Week 1, Monday) | Pending | Requires privacy policy, ToS, homepage, logo |
| Google acknowledges receipt | Day 3-5 | Pending | Typically within 1 business week |
| First review round | Week 2-4 | Pending | Google may request additional info |
| Potential rejection + resubmission | Week 4-6 | Risk | Common for first-time apps. Address feedback within 24 hours. |
| Verification approved | Week 4-8 | Target | Best case: Week 4. Worst case: Week 8. |

**Impact of delay:** If verification is not approved by Week 6 (end of Phase A), the SRMG pilot can continue using Testing mode (100 users). Scaling to additional clients is blocked until verification completes. This does not block Phase B development, only client onboarding beyond the first 100 users.

**Fallback plan:** If verification is rejected and resubmission takes >2 weeks, implement manual CSV data import from GSC/GA4 as a bridge. Effort: M (3-5 days). This allows the intelligence layer to function with manually exported data while OAuth verification is resolved.

### Hetzner + Domain Setup

| Milestone | Target Date | Notes |
|-----------|------------|-------|
| Hetzner VPS provisioned | Day 1 | Automated via Hetzner Cloud Console, takes minutes |
| Coolify installed | Day 1-2 | Single command install |
| Domain DNS pointed to Hetzner | Day 1-2 | Cloudflare DNS propagation: typically <5 minutes |
| SSL certificate issued | Day 2-3 | Let's Encrypt via Coolify, automated |
| Bridge server live on production domain | Day 3 | First deploy via Coolify |

---

## API Cost Projections for Phase A

Phase A has minimal API costs because the primary data sources (GSC and GA4) are free Google APIs.

| Service | Usage Pattern | Cost | Notes |
|---------|--------------|------|-------|
| Google Search Console API | 1,200 requests/day max | $0 | Free. No per-request pricing. |
| Google Analytics Data API | ~500 requests/day per client | $0 | Free. Subject to quota (10,000 requests/day per project). |
| Hetzner Cloud VPS (CPX21) | Always-on | ~$9/month (EUR 7.50) | 3 vCPU, 4GB RAM, 80GB SSD |
| Cloudflare (free tier) | DNS + DDoS protection | $0 | Free tier is sufficient for Phase A |
| Supabase (Pro plan) | Database + Auth | $25/month | Already exists from v1 |
| Domain (if new) | Annual | ~$12/year | One-time |

**Phase A total infrastructure cost: approximately $34/month.**

Semrush and Ahrefs API costs begin in Phase B. The 2-3 day cost modeling spike (Risk #6, score 12/25) should be scheduled for the first week of Phase B to profile actual API consumption before committing to enterprise pricing.

---

## Phase A Testing Strategy Summary

| Sprint | Unit Tests | Integration Tests | E2E Tests |
|--------|-----------|-------------------|-----------|
| Sprint 1 | Route dispatch, RLS policies, rate limiter, design tokens | Bridge server boot + health, CORS headers, HTTPS endpoint | Manual: access production URL from external network |
| Sprint 2 | OAuth encryption, token refresh, GSC parsing, GA4 parsing, crawler extraction | OAuth flow against Google sandbox, GSC data pull, crawler against static site | Manual: complete OAuth flow in browser |
| Sprint 3 | Scheduler timing, decay algorithm, gap analysis, priority scoring, purge job | Full scheduler cycle, dashboard page rendering | Manual: connect Google -> first pull -> view inventory -> see decay alerts |

**Test coverage target for Phase A:** 80% of new backend modules, 60% of new frontend components. Security-critical paths (OAuth, token storage, RLS) must have 100% coverage.

---

## Phase A Completion Checklist

At the end of Week 6, the following must be true for Phase A to be considered complete:

- [ ] Bridge server running on Hetzner with HTTPS, rate limiting, CORS allowlist
- [ ] 6 new Supabase tables with RLS policies, indexes, and partitioning (performance_snapshots)
- [ ] Google OAuth flow functional (using Testing mode if verification still pending)
- [ ] GSC data pulling daily for at least 1 connected account
- [ ] GA4 data pulling daily for at least 1 connected account
- [ ] Content inventory crawler has mapped at least 1 real website
- [ ] Scheduler running unattended for 48+ hours with zero silent failures
- [ ] Decay detection producing scored alerts from real GSC data
- [ ] Gap analysis producing keyword opportunities from real GSC data
- [ ] Connections dashboard page functional with real data
- [ ] Content inventory dashboard page functional with health indicators
- [ ] All new modules have test coverage meeting the 80% target
- [ ] Google OAuth consent screen submitted (verification may still be pending)
- [ ] Arabic fonts loaded, RTL CSS logical properties in place

**What Phase B assumes from Phase A:** Working OAuth flow, daily data flowing from GSC and GA4, content inventory populated, decay detection and gap analysis producing scored outputs, production deployment stable. Phase B builds the intelligence layer, quality gate, and WordPress publishing on top of this foundation.
