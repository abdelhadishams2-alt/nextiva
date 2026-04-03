# ChainIQ Platform Expansion -- Sprint Plan

> **Last Updated:** 2026-03-28
> **Duration:** 20 weeks (10 sprints of 2 weeks each)
> **Developer:** Solo (full-time, 8 hours/day, 5 days/week = 80h per sprint)
> **Total Tasks:** 26 across 6 phases (Phase 5-10)
> **Total Effort:** ~320 hours estimated
> **Source:** Tribunal Round 4 MoSCoW Verdict, Phase A Sprint Plan, Effort Estimation Framework

---

## Sprint Summary

| Sprint | Weeks | Theme | Tasks | Total Effort | Story Points |
| --- | --- | --- | --- | --- | --- |
| 1 | 1-2 | OAuth + DB Migrations | DI-001 | 16h | 8 |
| 2 | 3-4 | Data Connectors + Crawler | DI-002, DI-003, DI-004 | 36h | 21 |
| 3 | 5-6 | Scheduler + Dashboard + Quality Engine | DI-005, DI-006, QG-001 | 44h | 24 |
| 4 | 7-8 | Decay + Gaps + Quality Agent | CI-001, CI-002, QG-002 | 36h | 21 |
| 5 | 9-10 | Recommender + Semrush + Quality Dashboard | CI-003, CI-004, QG-003 | 36h | 20 |
| 6 | 11-12 | Intelligence Dashboard + Voice Corpus + Clustering | CI-005, VI-001, VI-002 | 40h | 24 |
| 7 | 13-14 | Voice Agent + Voice Dashboard + Payload | VI-003, VI-004, PB-001 | 30h | 18 |
| 8 | 15-16 | WordPress + Shopify | PB-002, PB-003 | 32h | 18 |
| 9 | 17-18 | CMS Adapters + Publish Dashboard | PB-004, PB-005 | 20h | 12 |
| 10 | 19-20 | Feedback Loop (Tracker + Recalibration + Dashboard) | FL-001, FL-002, FL-003 | 30h | 18 |
| **Total** | **1-20** | | **26 tasks** | **~320h** | **~184** |

---

## Sprint 1: OAuth Infrastructure (Weeks 1-2)

### Tasks

| ID | Task | Effort | Priority |
| --- | --- | --- | --- |
| DI-001 | Google OAuth2 Infrastructure | XL (16h) | P0 |

### Scope

This sprint establishes the authentication foundation for all data ingestion. DI-001 is the single largest task and the hardest blocker -- every data connector depends on `getValidToken()`. The sprint creates migration 007 (client_connections, oauth_states, ingestion_jobs, api_cache tables), builds the full PKCE OAuth flow with state-based CSRF protection, implements proactive token refresh with 24-hour window, and registers 4 bridge server endpoints.

### Dependencies

- SEC-001 must be complete (KeyManager for AES-256-GCM token encryption)
- Google OAuth consent screen should be submitted on Day 1 (use Testing mode for 100 users while verification pending)
- Hetzner deployment must be live for OAuth callback URL

### Success Criteria

- [ ] Migration 007 creates 4 tables with RLS policies and indexes
- [ ] OAuth flow works end-to-end: auth URL -> Google consent -> callback -> token storage
- [ ] PKCE code_challenge verified during token exchange
- [ ] State-based CSRF protection prevents replay attacks
- [ ] Token refresh works proactively within 24-hour window
- [ ] `/api/connections` returns connection list without token data

### Risk Flags

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Google OAuth verification still pending | High | Medium | Use Testing mode (100 users) |
| PKCE implementation complexity | Low | Medium | Google's well-documented, follow their guide exactly |
| Migration conflicts with existing schema | Low | High | Test on clean Supabase instance first |

---

## Sprint 2: Data Connectors (Weeks 3-4)

### Tasks

| ID | Task | Effort | Priority |
| --- | --- | --- | --- |
| DI-002 | GSC Search Analytics Connector | L (12h) | P0 |
| DI-003 | GA4 Reporting API Connector | L (12h) | P0 |
| DI-004 | Content Inventory Crawler | L (12h) | P0 |

### Scope

Three parallel data connectors that populate the intelligence pipeline. GSC provides clicks/impressions/position data with 25K-row pagination and 16-month historical import. GA4 adds engagement metrics (sessions, bounce rate, scroll depth) and merges with GSC snapshots. The crawler discovers URLs via sitemap or link-following (max depth 3, max 10K pages), extracts metadata from HTML, and creates migration 008 (content_inventory, crawl_sessions).

### Dependencies

- DI-001 must be complete (OAuth tokens for GSC/GA4, client_connections table for crawler)
- At least 1 Google account connected in Testing mode
- Target site with verified GSC property for testing

### Success Criteria

- [ ] GSC pulls data for a connected account (top 100 URLs with metrics)
- [ ] GA4 pulls engagement data and merges with GSC snapshots
- [ ] Crawler maps at least one real website into content_inventory
- [ ] 16-month historical GSC import completes for test account
- [ ] Token refresh works: manually expire token, verify auto-refresh on next pull
- [ ] All connectors handle 401/429/403 errors correctly

### Risk Flags

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| GSC returns no data for test domain | Low | Medium | Ensure SRMG has verified GSC property |
| Crawler blocked by WAF/CDN | Medium | Low | Respect robots.txt, standard User-Agent, retry with backoff |
| GA4 quota exceeded during historical import | Low | Medium | Pull in monthly chunks, track quota usage |

---

## Sprint 3: Scheduler + Dashboard + Quality Engine (Weeks 5-6)

### Tasks

| ID | Task | Effort | Priority |
| --- | --- | --- | --- |
| DI-005 | Automated Data Pull Scheduler | L (12h) | P0 |
| DI-006 | Dashboard: Connections + Inventory Pages | XL (16h) | P1 |
| QG-001 | 60-Point SEO Checklist Engine | XL (16h) | P1 |

### Scope

Three parallel workstreams. The scheduler creates migration 009 (performance_snapshots with monthly partitioning), runs tick-based daily GSC/GA4 pulls, implements missed-job recovery and 90-day purge with monthly rollup. The dashboard delivers two pages: Connections (OAuth cards with status dots, freshness banner) and Content Inventory (DataTable with filters, search, detail slide-over, timeline chart). QG-001 can run independently -- it ports the 60-point checklist and E-E-A-T rubric from old-seo-blog-checker.

### Dependencies

- DI-002, DI-003, DI-004 must be complete for scheduler
- DI-001 endpoints for connections page
- No blockers for QG-001 (independent of data ingestion)

### Success Criteria

- [ ] Scheduler runs daily pulls unattended for 48+ hours
- [ ] Staleness detection: connection marked stale after 48h without sync
- [ ] Purge job rolls up and deletes data older than 90 days correctly
- [ ] Connections page shows OAuth cards with correct status dots
- [ ] Content Inventory page displays crawled URLs with pagination and filters
- [ ] 60-point checklist scores an article across 8 categories
- [ ] E-E-A-T rubric produces A-F grade from 10 dimensions

### Risk Flags

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Scheduler silently fails on Coolify restart | Medium | High | Test: restart container, verify missed-job recovery |
| Performance_snapshots partitioning underperforms | Medium | High | Fallback: flat table with purge job |
| Dashboard page slow with 10K+ URLs | Medium | Medium | Server-side pagination from day one |

---

## Sprint 4: Intelligence Core (Weeks 7-8)

### Tasks

| ID | Task | Effort | Priority |
| --- | --- | --- | --- |
| CI-001 | Content Decay Detection Engine | L (12h) | P0 |
| CI-002 | Gap Analyzer + Cannibalization Detector | L (12h) | P0 |
| QG-002 | Quality Gate Agent + Auto-Revision Loop | L (12h) | P1 |

### Scope

The intelligence engine comes alive. CI-001 implements 3 decay detection methods (click decline, position tracking, content age audit) with HEALTHY/DECAYING/DECLINING/DEAD classification. CI-002 builds keyword gap analysis (keywords with impressions but no dedicated content) and cannibalization detection (multiple URLs competing for same query) with 4 resolution strategies (merge, redirect, differentiate, deoptimize). QG-002 creates the quality gate agent with 7-signal weighted scoring and max-2-pass auto-revision loop.

### Dependencies

- DI-002 (GSC snapshots for decay detection and gap analysis)
- DI-004 (content_inventory for matching)
- DI-005 (historical snapshot accumulation -- minimum 3 months for decay)
- QG-001 (quality engine for QG-002 agent)

### Success Criteria

- [ ] Decay detection produces alerts for URLs with 20%+ traffic decline
- [ ] Gap analysis identifies keywords with 500+ impressions and no dedicated page
- [ ] Cannibalization detects 2+ URLs competing for same query
- [ ] Resolution strategies recommended with confidence scores
- [ ] Quality gate agent scores articles against 7 weighted signals
- [ ] Auto-revision loop sends fix instructions and re-scores (max 2 passes)

### Risk Flags

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Insufficient historical data for decay detection | Medium | High | GSC 16-month import should provide enough; seed with CSV if needed |
| Gap analysis accuracy limited without Semrush | High | Medium | Phase A is GSC-only; Semrush enrichment in Sprint 5 |
| Auto-revision loop degrades article quality | Low | Medium | Conservative: only fix failing signals, preserve passing sections |

---

## Sprint 5: Recommender + External Data + Quality Dashboard (Weeks 9-10)

### Tasks

| ID | Task | Effort | Priority |
| --- | --- | --- | --- |
| CI-003 | Topic Recommender Agent + Mode B | XL (16h) | P0 |
| CI-004 | Semrush + Ahrefs Connectors | L (8h) | P2 |
| QG-003 | Dashboard: Quality Report Page | L (12h) | P1 |

### Scope

CI-003 builds the 5-component scoring formula (impressions 0.3, decay 0.25, gap 0.25, seasonality 0.1, competition 0.1), creates the topic-recommender.md agent, and wires Mode B into SKILL.md. CI-004 adds optional Semrush/Ahrefs enrichment with 7-day caching. QG-003 builds the quality report page with score ring, 7-signal bars, checklist panel, E-E-A-T radar, and suggestions list.

### Dependencies

- CI-001, CI-002 (decay and gap scores for recommender)
- DI-001 (client_connections for Semrush/Ahrefs API keys)
- QG-001, QG-002 (quality engine and agent for dashboard)

### Success Criteria

- [ ] Scoring formula produces ranked recommendations from real data
- [ ] Mode B: category input -> recommendations -> user picks -> pipeline
- [ ] Semrush/Ahrefs connectors enrich keyword data (optional, graceful degradation)
- [ ] 7-day cache prevents redundant API calls
- [ ] Quality report page shows score ring, signal bars, and 60-item checklist
- [ ] "Re-score" and "Auto-fix" buttons functional

### Risk Flags

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Semrush/Ahrefs API costs higher than estimated | Medium | Medium | 2-3 day cost modeling spike before committing |
| Scoring formula weights produce poor recommendations | Medium | Medium | Validate with SRMG test data, adjust weights in Sprint 10 via FL-002 |

---

## Sprint 6: Intelligence Dashboard + Voice Foundation (Weeks 11-12)

### Tasks

| ID | Task | Effort | Priority |
| --- | --- | --- | --- |
| CI-005 | Dashboard: Opportunities Page (4 tabs) | L (12h) | P1 |
| VI-001 | Corpus Crawler + AI/Human Classifier | XL (16h) | P1 |
| VI-002 | Writer Clustering + Persona Generation | L (12h) | P1 |

### Scope

CI-005 builds the 4-tab Opportunities page (Recommendations, Keyword Gaps, Cannibalization, Decay Alerts) with action buttons for accepting/dismissing recommendations and resolving cannibalization. VI-001 crawls a client's site for 50-100 articles, extracts stylometric features (6 signals), classifies each as HUMAN/HYBRID/AI-GENERATED. VI-002 implements HDBSCAN clustering on 12-dimension feature vectors to discover natural writer groups and generates structured personas.

### Dependencies

- CI-001 through CI-003 (intelligence endpoints for dashboard)
- DI-006 (dashboard navigation pattern for CI-005)
- No blockers for VI-001/VI-002 (independent of intelligence pipeline)

### Success Criteria

- [ ] Opportunities page renders 4 tabs with real intelligence data
- [ ] "Accept & Generate" creates pipeline job from recommendation
- [ ] Corpus analyzer classifies articles as HUMAN/HYBRID/AI-GENERATED
- [ ] Corpus sufficiency check: >= 30 human articles required
- [ ] HDBSCAN discovers writer clusters from stylometric features
- [ ] Structured personas generated with name, voice, cadence, avoids list

### Risk Flags

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| HDBSCAN in pure JS produces inferior clustering | Medium | Medium | Fallback: simplified k-means; HDBSCAN via Python shim in Phase D |
| Insufficient human articles for clustering | Medium | High | Fallback to manual persona creation if < 30 human articles |

---

## Sprint 7: Voice Completion + Publishing Foundation (Weeks 13-14)

### Tasks

| ID | Task | Effort | Priority |
| --- | --- | --- | --- |
| VI-003 | Voice Analyzer Agent + Pipeline Integration | L (12h) | P1 |
| VI-004 | Dashboard: Voice Profiles Page | L (10h) | P1 |
| PB-001 | Universal Article Payload + Image CDN | L (8h) | P1 |

### Scope

VI-003 creates the voice-analyzer.md agent that produces refined voice profiles and modifies draft-writer.md to accept voice constraints. VI-004 builds the Voice Profiles page with persona cards, detail panel, and "Analyze Site" dialog. PB-001 defines the Universal Article Payload JSON schema and builds the image CDN pipeline for cross-platform publishing.

### Dependencies

- VI-001, VI-002 (corpus analysis and clustering for voice agent)
- QG-001, QG-002 (quality scores for payload)

### Success Criteria

- [ ] Voice analyzer agent produces structured voice profiles from cluster data
- [ ] Draft writer enforces cadence, vocabulary, and tone constraints
- [ ] Pipeline is backward compatible (works without voice profile)
- [ ] Voice Profiles page displays persona grid with detail panel
- [ ] Universal Payload schema defined with all required fields
- [ ] Image pipeline uploads local images and replaces HTML src attributes

---

## Sprint 8: WordPress + Shopify (Weeks 15-16)

### Tasks

| ID | Task | Effort | Priority |
| --- | --- | --- | --- |
| PB-002 | WordPress Connector Plugin (PHP) | XL (20h) | P1 |
| PB-003 | Shopify Publishing Adapter | L (12h) | P1 |

### Scope

PB-002 creates the chainiq-connector WordPress plugin with wp-admin settings page, REST API receive endpoint, wp_insert_post() publishing (universal builder compatibility), category/tag mapping, featured image upload, and Yoast/RankMath SEO meta. PB-003 builds the Shopify adapter with OAuth2/custom token auth, Blog Article API publishing, and product-aware content enrichment.

### Dependencies

- PB-001 (Universal Article Payload)

### Success Criteria

- [ ] WordPress plugin activates on WordPress 5.8+ / PHP 7.4+
- [ ] Articles published via wp_insert_post() work with Gutenberg, Elementor, Classic
- [ ] Yoast and RankMath SEO meta fields populated correctly
- [ ] Shopify articles created via Admin Blog API as drafts
- [ ] Product enrichment adds relevant product links to articles
- [ ] Both adapters store publish records in ChainIQ database

### Risk Flags

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| WordPress builder compatibility issues | Medium | High | Test with Gutenberg first; wp_insert_post is universal at DB level |
| Shopify API rate limiting (2 req/s) | Low | Medium | Backoff on 429, batch operations |

---

## Sprint 9: CMS Adapters + Publish Dashboard (Weeks 17-18)

### Tasks

| ID | Task | Effort | Priority |
| --- | --- | --- | --- |
| PB-004 | Headless CMS Adapters + Generic Webhook | L (12h) | P1 |
| PB-005 | Dashboard: Publish Manager Page | L (8h) | P1 |

### Scope

PB-004 builds adapters for 5 headless CMS platforms (Contentful, Strapi, Ghost, Webflow, Sanity) plus a generic webhook publisher with HMAC-SHA256 signing. All adapters extend a shared base class with retry, rate limiting, and error normalization. PB-005 builds the Publish Manager page with connected platform cards, publish queue DataTable, multi-step publish dialog, and platform configuration forms.

### Dependencies

- PB-001 (payload), PB-002 (WordPress pattern), PB-003 (Shopify pattern)

### Success Criteria

- [ ] All 5 CMS adapters create content via their respective APIs
- [ ] Ghost adapter authenticates via JWT from Admin API key (no npm deps)
- [ ] Generic webhook POSTs payload with HMAC-SHA256 signature
- [ ] Adapter registry routes `/api/publish/:platform/push` to correct adapter
- [ ] Publish Manager page shows connected platforms with status
- [ ] Multi-step publish dialog walks through article -> platform -> options -> confirm

---

## Sprint 10: Feedback Loop (Weeks 19-20)

### Tasks

| ID | Task | Effort | Priority |
| --- | --- | --- | --- |
| FL-001 | 30/60/90 Day Performance Tracker | L (12h) | P1 |
| FL-002 | Scoring Weight Recalibration Engine | L (10h) | P1 |
| FL-003 | Dashboard: Performance Page + Reports | L (8h) | P1 |

### Scope

FL-001 monitors published articles at 30/60/90 day intervals via GSC/GA4, compares predicted metrics against actual performance, and calculates accuracy scores. FL-002 builds the recalibration engine that adjusts the topic recommender's scoring weights based on prediction accuracy (0.05 learning rate, 0.05-0.40 weight bounds, dry-run mode). FL-003 builds the Performance page with summary cards, timeline chart, predictions DataTable, and HTML/JSON report generator.

### Dependencies

- DI-002, DI-003 (GSC/GA4 for actual performance data)
- Phase 9 (published articles to track)
- CI-003 (scoring formula weights to recalibrate)

### Success Criteria

- [ ] Predictions recorded at article publish time with 30/60/90d targets
- [ ] GSC snapshots collected at each interval
- [ ] Accuracy scores calculated per metric (clicks 40%, impressions 35%, position 25%)
- [ ] Recalibration dry-run shows proposed weight changes without saving
- [ ] Weight bounds enforced (0.05-0.40), sum normalized to 1.0
- [ ] Performance page shows predicted vs actual with accuracy badges
- [ ] HTML report generated with inline CSS, branded, printable

### Risk Flags

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Insufficient completed predictions for recalibration | High | Medium | Minimum 10 required; may not have 10 by Week 20 |
| Accuracy data arrives slowly (30-day minimum) | Certain | Low | First 30d data available at Week 24 earliest; dashboard shows "pending" |

---

## Dependency Graph

```
Sprint 1: DI-001 (OAuth)
    |
    v
Sprint 2: DI-002 (GSC) + DI-003 (GA4) + DI-004 (Crawler)
    |
    v
Sprint 3: DI-005 (Scheduler) + DI-006 (Dashboard)  |  QG-001 (independent)
    |                                                    |
    v                                                    v
Sprint 4: CI-001 (Decay) + CI-002 (Gaps)             QG-002 (Quality Agent)
    |                                                    |
    v                                                    v
Sprint 5: CI-003 (Recommender) + CI-004 (Semrush)    QG-003 (Quality Dashboard)
    |
    v
Sprint 6: CI-005 (Intelligence Dashboard)  |  VI-001 + VI-002 (Voice, independent)
                                               |
                                               v
Sprint 7: VI-003 (Voice Agent) + VI-004 (Voice Dashboard) + PB-001 (Payload)
                                                               |
                                                               v
Sprint 8: PB-002 (WordPress) + PB-003 (Shopify)
    |
    v
Sprint 9: PB-004 (CMS Adapters) + PB-005 (Publish Dashboard)

Sprint 10: FL-001 (Tracker) + FL-002 (Recalibration) + FL-003 (Performance Dashboard)
           (depends on Sprint 2 GSC/GA4 + Sprint 9 published articles)
```

---

## Velocity Assumptions

- **Solo developer:** 8 hours/day, 5 days/week = 80 hours per sprint
- **Effective coding time:** ~60% of total (48h/sprint) after meetings, research, debugging
- **Sprint capacity:** 30-35 story points per sprint (based on Phase A velocity data)
- **Buffer:** 20% built into effort estimates for unexpected complexity
- **Testing overhead:** Included in task effort estimates (not separate)

### Velocity Adjustment Triggers

- If Sprint 1 takes >3 weeks: reduce Sprint 2 scope (defer DI-003 GA4 to Sprint 3)
- If Sprint 4 intelligence quality is poor: add 1-week hardening sprint before Sprint 5
- If WordPress plugin (Sprint 8) exceeds 20h: split into 2 sprints, defer Shopify to Sprint 9

---

## Migration Sequence

| Migration | Sprint | Tables Created |
| --- | --- | --- |
| 007 | Sprint 1 | client_connections, oauth_states, ingestion_jobs, api_cache |
| 008 | Sprint 2 | content_inventory, crawl_sessions |
| 009 | Sprint 3 | performance_snapshots (partitioned), performance_snapshots_monthly |
| 010 | Sprint 4 | keyword_opportunities, analysis_runs, recommendation_history, cannibalization_conflicts |
| 011 | Sprint 6 | writer_personas, analysis_sessions, voice_match_scores |
| 012 | Sprint 3 | quality_scores, quality_revisions |
| 013 | Sprint 7 | (reserved for voice tables if needed) |
| 014 | Sprint 8 | platform_connections |
| 015 | Sprint 8 | publish_records, image_upload_log |
| 016 | Sprint 10 | performance_predictions, scoring_weight_history |
| 017 | Sprint 10 | performance_reports |

---

## API Cost Projections

| Sprint | New API Costs | Cumulative Monthly |
| --- | --- | --- |
| 1-3 | GSC ($0), GA4 ($0) | ~$34/mo (Hetzner + Supabase) |
| 4-5 | Semrush ($80-150), Ahrefs ($80-150) | ~$194-334/mo |
| 6-7 | No new costs | Same |
| 8-9 | No new costs (CMS APIs are free) | Same |
| 10 | No new costs | Same |

---

## Completion Checklist

At Week 20, the following must be true for the platform expansion to be considered complete:

- [ ] 23 new database tables created with RLS policies and indexes
- [ ] Google OAuth flow functional with PKCE and proactive refresh
- [ ] GSC + GA4 data pulling daily for connected accounts
- [ ] Content inventory crawler mapping real websites
- [ ] Scheduler running unattended with missed-job recovery
- [ ] Decay detection producing scored alerts from real data
- [ ] Gap analysis and cannibalization detection operational
- [ ] Topic recommender scoring and ranking opportunities
- [ ] Mode B pipeline: category -> recommendations -> generation
- [ ] 60-point SEO checklist scoring articles across 8 categories
- [ ] Quality gate agent with auto-revision loop (max 2 passes)
- [ ] Voice analysis: corpus crawl -> classification -> clustering -> persona generation
- [ ] Draft writer accepting voice profile constraints
- [ ] Universal Article Payload defined and validated
- [ ] WordPress plugin publishing articles via wp_insert_post()
- [ ] Shopify adapter publishing to Blog API
- [ ] 5 headless CMS adapters + generic webhook publisher
- [ ] Performance tracker monitoring published articles at 30/60/90 day intervals
- [ ] Recalibration engine with dry-run mode
- [ ] 7 new dashboard pages: Connections, Inventory, Opportunities, Quality, Voice, Publish, Performance
- [ ] All pages support RTL layout for Arabic interface
- [ ] Zero npm dependencies maintained across all new modules
