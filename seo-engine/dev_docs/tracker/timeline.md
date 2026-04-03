# ChainIQ -- Implementation Timeline

> **Last Updated:** 2026-03-28
> **Duration:** 20 weeks (10 sprints x 2 weeks)
> **Capacity:** 80h/sprint gross, ~48h/sprint effective (60% coding after research/debug)
> **Total Effort:** ~320h estimated across 26 tasks
> **Developer:** Solo (full-time)

---

## Milestone Summary

| Sprint | Weeks | Theme | Effort | Milestone |
|--------|-------|-------|--------|-----------|
| S1 | 1-2 | OAuth Foundation | 16h | OAuth flow end-to-end |
| S2 | 3-4 | Data Connectors | 36h | GSC + GA4 + Crawler operational |
| S3 | 5-6 | Scheduler + Dashboard + Quality | 44h | Automated daily pulls + first dashboard pages |
| S4 | 7-8 | Intelligence Core | 36h | Decay + gaps detected from real data |
| S5 | 9-10 | Recommender + Quality Dashboard | 36h | Mode B pipeline working |
| S6 | 11-12 | Intelligence Dashboard + Voice | 40h | Opportunities page + voice corpus analyzed |
| S7 | 13-14 | Voice + Publishing Foundation | 30h | Voice profiles + Universal Payload |
| S8 | 15-16 | WordPress + Shopify | 32h | Two CMS platforms publishing |
| S9 | 17-18 | CMS Adapters + Publish Manager | 20h | 7 total publishing targets |
| S10 | 19-20 | Feedback Loop | 30h | Performance tracking + recalibration |

---

## Week-by-Week Schedule

### Week 1-2 (Sprint 1): OAuth Foundation

- **Active:** DI-001 (OAuth2 Infrastructure)
- **Hours:** 16h / 48h effective capacity
- **Buffer:** 32h available for research, Google OAuth setup, testing
- **Milestone:** OAuth PKCE flow working end-to-end, tokens AES-256-GCM encrypted in Supabase
- **Deliverables:**
  - Migration 007: `client_connections`, `oauth_states`, `ingestion_jobs`, `api_cache`
  - 4 bridge server endpoints (`/api/connections/*`)
  - Proactive token refresh with 24h window
  - PKCE + state-based CSRF protection
- **External actions:**
  - Register Google OAuth consent screen (Day 1 -- use Testing mode for 100 users)
  - Obtain Google OAuth client_id and client_secret
  - Confirm Hetzner deployment is live for callback URL
- **Risk:** Google OAuth verification can take 2-6 weeks; Testing mode bypasses this for up to 100 users
- **Risk-adjusted dates:**
  - Optimistic: Week 1 (8 days) -- straightforward OAuth, no blockers
  - Expected: Week 2 (14 days) -- standard complexity, some Google console friction
  - Pessimistic: Week 3 (+1 week slip) -- migration conflicts or PKCE edge cases

---

### Week 3-4 (Sprint 2): Data Connectors

- **Active:** DI-002 (GSC, 12h) + DI-003 (GA4, 12h) + DI-004 (Crawler, 12h)
- **Hours:** 36h / 48h effective capacity
- **Buffer:** 12h for API quirks and edge cases
- **Milestone:** All three connectors pulling real data from at least one test account
- **Deliverables:**
  - GSC: 25K-row pagination, 16-month historical import, health score
  - GA4: Engagement metrics (sessions, bounce rate, scroll depth), GSC merge
  - Crawler: Sitemap + link-follow (depth 3, max 10K pages), body_text extraction
  - Migration 008: `content_inventory`, `crawl_sessions`
- **External actions:**
  - Need at least 1 Google account connected via OAuth (from Sprint 1)
  - Need a target site with verified GSC property for testing
- **Risk:** GSC may return no data for test domain; GA4 quota limits during historical import
- **Parallel strategy:** All three connectors are independent -- can work on them in any order
- **Risk-adjusted dates:**
  - Optimistic: Week 3.5 (10 days) -- APIs behave, no pagination bugs
  - Expected: Week 4 (14 days) -- some API quirks, retry logic needed
  - Pessimistic: Week 5 (+1 week slip) -- GA4 quota issues or crawler WAF blocks

---

### Week 5-6 (Sprint 3): Scheduler + Dashboard + Quality Engine

- **Active:** DI-005 (Scheduler, 12h) + DI-006 (Dashboard, 16h) + QG-001 (Checklist, 16h)
- **Hours:** 44h / 48h effective capacity
- **Buffer:** 4h -- tight sprint, highest effort load in the project
- **Milestone:** Automated daily pulls running unattended; first two dashboard pages live; 60-point checklist scoring articles
- **Deliverables:**
  - Scheduler: Tick-based daily GSC/GA4 pulls, missed-job recovery, 90-day purge with monthly rollup
  - Migration 009: `performance_snapshots` (partitioned), `performance_snapshots_monthly`
  - Migration 012: `quality_scores`, `quality_revisions`
  - Dashboard: Connections page (OAuth cards, status dots, freshness banner)
  - Dashboard: Content Inventory page (DataTable, filters, search, detail slide-over, timeline chart)
  - QG-001: 60-point checklist (8 categories), E-E-A-T rubric (A-F grade, 10 dimensions)
- **External actions:** None -- all dependencies are internal
- **Risk:** Highest-effort sprint (44h). Partition performance may underperform. Dashboard with 10K+ URLs needs server-side pagination from day one.
- **Parallel strategy:** QG-001 is fully independent -- can be done first or last. DI-005 and DI-006 share data but not code.
- **Risk-adjusted dates:**
  - Optimistic: Week 5.5 (11 days) -- partitioning works first try, dashboard components reusable
  - Expected: Week 6 (14 days) -- some partition debugging, dashboard iteration
  - Pessimistic: Week 7 (+1 week slip) -- scope too large, defer QG-001 to Sprint 4

---

### Week 7-8 (Sprint 4): Intelligence Core

- **Active:** CI-001 (Decay, 12h) + CI-002 (Gaps, 12h) + QG-002 (Quality Agent, 12h)
- **Hours:** 36h / 48h effective capacity
- **Buffer:** 12h for algorithm tuning and threshold calibration
- **Milestone:** Decay alerts and gap opportunities generated from real GSC data; quality gate agent scoring articles
- **Deliverables:**
  - CI-001: 3 decay methods (click decline, position tracking, content age), 4-tier classification (HEALTHY/DECAYING/DECLINING/DEAD)
  - CI-002: Keyword gap analysis (impressions without dedicated pages), cannibalization detection (4 resolution strategies: merge, redirect, differentiate, deoptimize)
  - QG-002: 7-signal weighted scoring, auto-revision loop (max 2 passes)
  - Migration 010: `keyword_opportunities`, `analysis_runs`, `recommendation_history`, `cannibalization_conflicts`
- **External actions:** None
- **Risk:** Insufficient historical data for meaningful decay detection (need 3+ months of snapshots). Gap analysis accuracy limited without Semrush data (GSC-only in this sprint).
- **Parallel strategy:** CI-001 and CI-002 analyze different aspects of the same data -- fully parallel. QG-002 is on the independent quality track.
- **Risk-adjusted dates:**
  - Optimistic: Week 7 (10 days) -- algorithms straightforward with good data
  - Expected: Week 8 (14 days) -- threshold tuning takes iteration
  - Pessimistic: Week 9 (+1 week slip) -- decay data insufficient, need CSV seeding

---

### Week 9-10 (Sprint 5): Recommender + External Data + Quality Dashboard

- **Active:** CI-003 (Recommender, 16h) + CI-004 (Semrush/Ahrefs, 8h) + QG-003 (Quality Dashboard, 12h)
- **Hours:** 36h / 48h effective capacity
- **Buffer:** 12h for scoring formula validation and Semrush cost modeling
- **Milestone:** Mode B pipeline operational (category -> recommendations -> generation); quality report page live
- **Deliverables:**
  - CI-003: 5-component scoring formula (impressions 0.30, decay 0.25, gap 0.25, seasonality 0.10, competition 0.10), topic-recommender agent, Mode B wired into SKILL.md
  - CI-004: Semrush + Ahrefs connectors (optional, 7-day cache, graceful degradation)
  - QG-003: Quality report page (score ring, 7-signal bars, 60-item checklist panel, E-E-A-T radar, suggestions list, Re-score + Auto-fix buttons)
- **External actions:**
  - Semrush API key ($80-150/mo) -- need 2-3 day cost modeling spike before committing
  - Ahrefs API key ($80-150/mo) -- optional, can defer
- **Risk:** Scoring formula weights may produce poor recommendations with limited data; Semrush/Ahrefs costs may exceed budget
- **Risk-adjusted dates:**
  - Optimistic: Week 9 (10 days) -- formula works well with GSC-only data
  - Expected: Week 10 (14 days) -- formula needs weight adjustments, Semrush setup takes time
  - Pessimistic: Week 11 (+1 week slip) -- Semrush integration issues, defer CI-004 entirely

---

### Week 11-12 (Sprint 6): Intelligence Dashboard + Voice Foundation

- **Active:** CI-005 (Dashboard: Opportunities, 12h) + VI-001 (Corpus Analyzer, 16h) + VI-002 (Writer Clustering, 12h)
- **Hours:** 40h / 48h effective capacity
- **Buffer:** 8h for HDBSCAN implementation and corpus sufficiency edge cases
- **Milestone:** 4-tab Opportunities page live with real data; voice corpus analyzed and writers clustered
- **Deliverables:**
  - CI-005: Opportunities page (4 tabs: Recommendations, Keyword Gaps, Cannibalization, Decay Alerts), action buttons (Accept & Generate, Dismiss, Resolve)
  - VI-001: Corpus crawler (50-100 articles), 6 stylometric signals, AI/Human/Hybrid classification, corpus sufficiency check (>= 30 human articles)
  - VI-002: HDBSCAN on 12-dimension feature vectors, natural writer group discovery, structured persona generation (name, voice, cadence, avoids list)
  - Migration 011: `writer_personas`, `analysis_sessions`, `voice_match_scores`
- **External actions:** Need a client site with 50+ articles for corpus analysis testing
- **Risk:** HDBSCAN in pure JS may underperform -- fallback to simplified k-means. Client may have < 30 human articles.
- **Parallel strategy:** CI-005 is pure frontend; VI-001/VI-002 are backend analysis -- completely independent tracks
- **Risk-adjusted dates:**
  - Optimistic: Week 11 (10 days) -- HDBSCAN works in JS, corpus is sufficient
  - Expected: Week 12 (14 days) -- some clustering tuning, corpus edge cases
  - Pessimistic: Week 13 (+1 week slip) -- HDBSCAN fails, need k-means fallback implementation

---

### Week 13-14 (Sprint 7): Voice Completion + Publishing Foundation

- **Active:** VI-003 (Voice Agent, 12h) + VI-004 (Dashboard: Voice, 10h) + PB-001 (Universal Payload, 8h)
- **Hours:** 30h / 48h effective capacity
- **Buffer:** 18h -- lightest sprint, good for catching up on any prior slippage
- **Milestone:** Voice profiles integrated into generation pipeline; Universal Article Payload schema defined
- **Deliverables:**
  - VI-003: voice-analyzer.md agent, draft-writer.md modified to accept voice constraints, backward compatible (works without voice profile)
  - VI-004: Voice Profiles page (persona cards grid, detail panel, "Analyze Site" dialog)
  - PB-001: Universal Article Payload JSON schema, image CDN pipeline (upload + src replacement)
- **External actions:** None
- **Risk:** Low-risk sprint. Voice integration into draft-writer must not break existing pipeline.
- **Catch-up opportunity:** If any prior sprint slipped, this sprint's 18h buffer absorbs it
- **Risk-adjusted dates:**
  - Optimistic: Week 13 (9 days) -- straightforward integration work
  - Expected: Week 14 (14 days) -- some pipeline compatibility testing
  - Pessimistic: Week 14.5 (3 days slip) -- voice constraints cause draft quality regression

---

### Week 15-16 (Sprint 8): WordPress + Shopify

- **Active:** PB-002 (WordPress Plugin, 20h) + PB-003 (Shopify Adapter, 12h)
- **Hours:** 32h / 48h effective capacity
- **Buffer:** 16h for builder compatibility testing and CMS quirks
- **Milestone:** Articles publishing to WordPress and Shopify from ChainIQ
- **Deliverables:**
  - PB-002: chainiq-connector WordPress plugin (PHP), wp-admin settings page, REST API receive endpoint, wp_insert_post() publishing, category/tag mapping, featured image upload, Yoast/RankMath SEO meta population
  - PB-003: Shopify adapter (OAuth2 or custom token auth), Blog Article API publishing, product-aware content enrichment
  - Migration 014: `platform_connections`
  - Migration 015: `publish_records`, `image_upload_log`
- **External actions:**
  - WordPress test site (local or staging) with Gutenberg, Elementor, or Classic editor
  - Shopify Partner account for development store
- **Risk:** WordPress builder compatibility (Gutenberg vs Elementor vs Classic); Shopify 2 req/s rate limit
- **Parallel strategy:** WordPress and Shopify are completely independent platforms
- **Risk-adjusted dates:**
  - Optimistic: Week 15 (10 days) -- wp_insert_post is universal, Shopify API is clean
  - Expected: Week 16 (14 days) -- some Yoast/RankMath edge cases
  - Pessimistic: Week 17 (+1 week slip) -- WordPress plugin exceeds 20h, defer Shopify to Sprint 9

---

### Week 17-18 (Sprint 9): CMS Adapters + Publish Manager

- **Active:** PB-004 (Headless CMS Adapters, 12h) + PB-005 (Dashboard: Publish Manager, 8h)
- **Hours:** 20h / 48h effective capacity
- **Buffer:** 28h -- second lightest sprint, another catch-up opportunity
- **Milestone:** 7 total publishing targets operational; Publish Manager dashboard live
- **Deliverables:**
  - PB-004: 5 headless CMS adapters (Contentful, Strapi, Ghost, Webflow, Sanity) + generic webhook with HMAC-SHA256 signing, shared base class with retry/rate-limit/error normalization, adapter registry routing
  - PB-005: Publish Manager page (connected platform cards, publish queue DataTable, multi-step publish dialog, platform configuration forms)
- **External actions:**
  - Test accounts for at least 2-3 headless CMS platforms (Ghost and Strapi are free/self-hosted)
  - Webhook test endpoint (e.g., webhook.site) for generic adapter
- **Risk:** Low risk -- adapters follow established pattern from PB-002/PB-003. Ghost JWT auth from Admin API key is the trickiest integration.
- **Catch-up opportunity:** If WordPress slipped from Sprint 8, Shopify can be completed here with 28h buffer
- **Risk-adjusted dates:**
  - Optimistic: Week 17 (9 days) -- adapter pattern well-established by now
  - Expected: Week 18 (14 days) -- some CMS API quirks to handle
  - Pessimistic: Week 18.5 (3 days slip) -- one CMS adapter more complex than estimated

---

### Week 19-20 (Sprint 10): Feedback Loop

- **Active:** FL-001 (Performance Tracker, 12h) + FL-002 (Recalibration, 10h) + FL-003 (Dashboard: Performance, 8h)
- **Hours:** 30h / 48h effective capacity
- **Buffer:** 18h for edge cases and final polish
- **Milestone:** Platform expansion complete -- all 26 tasks delivered, 7 new dashboard pages, 23 new tables
- **Deliverables:**
  - FL-001: 30/60/90 day tracking via GSC/GA4, predicted vs actual comparison, accuracy scoring (clicks 40%, impressions 35%, position 25%)
  - FL-002: Scoring weight recalibration (0.05 learning rate, 0.05-0.40 bounds, sum normalized to 1.0, dry-run mode)
  - FL-003: Performance page (summary cards, timeline chart, predictions DataTable, HTML/JSON report generator)
  - Migration 016: `performance_predictions`, `scoring_weight_history`
  - Migration 017: `performance_reports`
- **External actions:** None
- **Risk:** Insufficient completed predictions for recalibration (minimum 10 required, may not have 10 by Week 20). First 30-day accuracy data arrives at Week 24 earliest -- dashboard shows "pending" state.
- **Risk-adjusted dates:**
  - Optimistic: Week 19 (10 days) -- tracker is straightforward data collection
  - Expected: Week 20 (14 days) -- recalibration needs careful testing with dry-run
  - Pessimistic: Week 21 (+1 week slip) -- edge cases in accuracy calculation

---

## Risk-Adjusted Project Timeline

| Scenario | End Date | Total Duration | Assumption |
|----------|----------|----------------|------------|
| Optimistic | Week 18 | 18 weeks | No sprint slips, all buffers unused |
| Expected | Week 20 | 20 weeks | 1-2 minor slips absorbed by light sprints (S7, S9) |
| Pessimistic | Week 24 | 24 weeks | 3-4 sprint slips of ~1 week each, one hardening sprint added |

---

## Capacity Utilization

| Sprint | Effort | Effective Capacity | Utilization | Buffer |
|--------|--------|--------------------|-------------|--------|
| S1 | 16h | 48h | 33% | 32h (research/setup heavy) |
| S2 | 36h | 48h | 75% | 12h |
| S3 | 44h | 48h | 92% | 4h (danger zone) |
| S4 | 36h | 48h | 75% | 12h |
| S5 | 36h | 48h | 75% | 12h |
| S6 | 40h | 48h | 83% | 8h |
| S7 | 30h | 48h | 63% | 18h (catch-up) |
| S8 | 32h | 48h | 67% | 16h |
| S9 | 20h | 48h | 42% | 28h (catch-up) |
| S10 | 30h | 48h | 63% | 18h |
| **Total** | **320h** | **480h** | **67%** | **160h total buffer** |

---

## Velocity Adjustment Triggers

| Trigger | Threshold | Action |
|---------|-----------|--------|
| Sprint 1 overruns | > 3 weeks | Defer DI-003 (GA4) from Sprint 2 to Sprint 3 |
| Sprint 3 overruns | > 3 weeks | Defer QG-001 to Sprint 4; reduce DI-006 scope to Connections page only |
| Sprint 4 intelligence quality poor | Decay accuracy < 60% | Add 1-week hardening sprint before Sprint 5 |
| Sprint 8 WordPress overruns | PB-002 > 20h | Split Sprint 8; defer PB-003 (Shopify) to Sprint 9 |
| Any sprint ships < 70% planned scope | 2 consecutive sprints | Reduce next sprint scope by 25%; add hardening tasks |

---

## Key External Dependencies

| Dependency | When Needed | Lead Time | Status |
|------------|-------------|-----------|--------|
| Google OAuth consent screen | Sprint 1, Day 1 | 2-6 weeks (Testing mode: instant) | NOT STARTED |
| Google OAuth client_id/secret | Sprint 1, Day 1 | Minutes (after consent screen) | NOT STARTED |
| Verified GSC property for testing | Sprint 2 | Already exists (SRMG) | AVAILABLE |
| Semrush API key | Sprint 5 (optional) | 1-2 days signup | NOT STARTED |
| Ahrefs API key | Sprint 5 (optional) | 1-2 days signup | NOT STARTED |
| WordPress staging site | Sprint 8 | 1 hour (local Docker) | NOT STARTED |
| Shopify Partner dev store | Sprint 8 | 1 day signup | NOT STARTED |
| Client site with 50+ articles | Sprint 6 | Already exists (SRMG clients) | AVAILABLE |

---

## Migration Timeline

| Week | Migration | Tables Created |
|------|-----------|----------------|
| 1-2 | 007 | client_connections, oauth_states, ingestion_jobs, api_cache |
| 3-4 | 008 | content_inventory, crawl_sessions |
| 5-6 | 009 | performance_snapshots (partitioned), performance_snapshots_monthly |
| 5-6 | 012 | quality_scores, quality_revisions |
| 7-8 | 010 | keyword_opportunities, analysis_runs, recommendation_history, cannibalization_conflicts |
| 11-12 | 011 | writer_personas, analysis_sessions, voice_match_scores |
| 15-16 | 014 | platform_connections |
| 15-16 | 015 | publish_records, image_upload_log |
| 19-20 | 016 | performance_predictions, scoring_weight_history |
| 19-20 | 017 | performance_reports |

**Total:** 11 migrations, 23 new tables (bringing total from 9 to 32)

---

## Dashboard Page Delivery Schedule

| Sprint | Page | Route |
|--------|------|-------|
| S3 | Connections | `/dashboard/connections` |
| S3 | Content Inventory | `/dashboard/inventory` |
| S5 | Quality Report | `/dashboard/quality` |
| S6 | Opportunities (4 tabs) | `/dashboard/opportunities` |
| S7 | Voice Profiles | `/dashboard/voice` |
| S9 | Publish Manager | `/dashboard/publish` |
| S10 | Performance | `/dashboard/performance` |

**Total:** 7 new dashboard pages, all supporting RTL layout for Arabic interface
