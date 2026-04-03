# ChainIQ -- Master Tracker

> **Last Updated:** 2026-03-29
> **Total Subtasks:** 226
> **Phases:** 5-10 (Platform Expansion)
> **Estimated Effort:** ~320h across 10 sprints (20 weeks)

---

## Legend

| Status | Meaning |
|--------|---------|
| done | Work has not begun |
| in-progress | Actively being worked on |
| blocked | Cannot proceed due to dependency |
| done | Complete and verified |
| skipped | Intentionally deferred |

---

## Phase 5: Data Ingestion Foundation (~80h)

### DI-001: OAuth2 Infrastructure (Sprint 1, 16h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| DI-001.1 | Create migration 007 | `migrations/007-client-connections.sql` -- client_connections, oauth_states, ingestion_jobs, api_cache tables with RLS, indexes, triggers | 3h | done | -- |
| DI-001.2 | Build OAuth module -- auth URL generation | `bridge/oauth.js` -- generateAuthUrl() with PKCE code_verifier/challenge, state stored in oauth_states table | 4h | done | DI-001.1 |
| DI-001.3 | Build OAuth module -- callback handler | `bridge/oauth.js` -- handleCallback() with state validation, code exchange, token encryption via KeyManager | 3h | done | DI-001.2 |
| DI-001.4 | Build OAuth module -- proactive token refresh | `bridge/oauth.js` -- refreshToken() with 3-attempt backoff, getValidToken() with 24h proactive window, oauth_states cleanup | 3h | done | DI-001.3 |
| DI-001.5 | Register API endpoints | 4 endpoints in bridge/server.js -- GET /api/connections/google/auth, callback, GET /api/connections, GET /api/connections/status | 3h | done | DI-001.4 |
| DI-001.6 | Environment and security hardening | .env.example updates, startup validation, token-never-in-response audit, CSRF state validation | 1h | done | DI-001.5 |

### DI-002: GSC Connector (Sprint 2, 12h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| DI-002.1 | GSC API client core | `bridge/ingestion/gsc.js` -- GSCConnector class, querySearchAnalytics() with 25K-row pagination, native fetch | 3h | done | DI-001.4 |
| DI-002.2 | Date range management + historical import | 90-day default window, daily 3-day incremental pull, 16-month historical import in monthly chunks | 2h | done | DI-002.1 |
| DI-002.3 | Data normalization and storage | normalizeAndStore() -- map GSC rows to performance_snapshots, 500-row batch upsert, health score calculation (4-component weighted) | 3h | done | DI-002.2 |
| DI-002.4 | Error handling | 401 auto-refresh, 429 exponential backoff (5s/15s/45s), 403 error state, 5xx retry, structured logging | 2h | done | DI-002.1 |
| DI-002.5 | API endpoints | POST /api/ingestion/trigger/gsc + GET /api/ingestion/gsc/status -- auth, rate-limited, job tracking | 2h | done | DI-002.3 |

### DI-003: GA4 Connector (Sprint 2, 12h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| DI-003.1 | GA4 Data API client core | `bridge/ingestion/ga4.js` -- GA4Connector class, runReport() with pagePath+date dimensions, 6 engagement metrics, pagination | 3h | done | DI-001.4 |
| DI-003.2 | Engagement metrics extraction | Map GA4 metrics (sessions, engagedSessions, bounceRate, avgSessionDuration, scrolledUsers) to snapshot columns, property ID validation | 2h | done | DI-003.1 |
| DI-003.3 | GSC data merge into combined snapshots | URL matching (pagePath vs full URL normalization), UPDATE existing GSC snapshots with GA4 fields, create source='combined' records | 3h | done | DI-003.2, DI-002.3 |
| DI-003.4 | Historical import and daily pulls | Monthly chunk import on first connection, daily 3-day incremental, GA4 quota tracking (warn at 80%) | 2h | done | DI-003.1 |
| DI-003.5 | Error handling and endpoints | 401/429/403 pattern, PERMISSION_DENIED/RESOURCE_EXHAUSTED handling, POST trigger + GET status endpoints | 2h | done | DI-003.3 |

### DI-004: Content Inventory Crawler (Sprint 2, 12h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| DI-004.1 | Create migration 008 | `migrations/008-content-inventory.sql` -- content_inventory (20+ columns) + crawl_sessions tables, RLS, indexes | 2h | done | DI-001.1 |
| DI-004.2 | Sitemap discovery (fast path) | discoverFromSitemap() -- fetch/parse sitemap.xml, handle sitemap index recursion, fallback URLs, dedup+normalize | 2h | done | DI-004.1 |
| DI-004.3 | Link-following fallback | discoverFromCrawling() -- BFS crawl, max depth 3, max 10K pages, 2 req/sec rate limit, visited Set | 2h | done | DI-004.1 |
| DI-004.4 | HTML metadata extraction | extractMetadata() -- port from old-seo-blog-checker metadata-extractor.ts, 20+ fields, body_text extraction, content_hash SHA-256, robots.txt compliance | 3h | done | DI-004.2 |
| DI-004.5 | Crawl orchestration and storage | Background job orchestration, batch upsert to content_inventory, crawl_sessions progress tracking, POST /api/ingestion/crawl + GET status endpoint | 2h | done | DI-004.4 |
| DI-004.6 | Robots.txt compliance | Fetch and parse robots.txt, respect Disallow directives, honor Crawl-delay, skip disallowed URLs | 1h | done | DI-004.2 |

### DI-005: Automated Scheduler (Sprint 3, 12h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| DI-005.1 | Create migration 009 | `migrations/009-performance-snapshots.sql` -- performance_snapshots partitioned by month (6 initial partitions), monthly rollup table, RLS, indexes | 2h | done | DI-002.3 |
| DI-005.2 | Tick-based scheduler engine | `bridge/ingestion/scheduler.js` -- setInterval 60s tick, daily GSC/GA4 at 03:00/03:30 UTC, weekly Semrush/Ahrefs, concurrency cap 3 jobs | 3h | done | DI-002.5, DI-003.5 |
| DI-005.3 | Retry logic with exponential backoff | 3-attempt strategy (immediate, 5min, 30min), attempt tracking, staleness detection at 48h, connection error state | 2h | done | DI-005.2 |
| DI-005.4 | Data purge and monthly rollup | Monthly rollup job for >90-day data, safety rollup-before-delete, auto-partition creation, oauth_states cleanup every 5min | 3h | done | DI-005.1 |
| DI-005.5 | Missed-job recovery on restart | Query last_sync_at on startup, queue catch-up for stale sources (>24h daily, >7d weekly), structured logging | 1h | done | DI-005.2 |
| DI-005.6 | Health endpoint and schedule API | Enhance /health with scheduler status, GET /api/ingestion/schedule endpoint showing next runs and job history | 1h | done | DI-005.2 |

### DI-006: Dashboard -- Connections + Inventory Pages (Sprint 3, 16h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| DI-006.1 | API client methods | `dashboard/src/lib/api.ts` -- 10 typed methods for connections, crawl, inventory, schedule endpoints | 2h | done | DI-001.5, DI-004.5, DI-005.6 |
| DI-006.2 | Connections page | `/settings/connections` page -- header, freshness banner, OAuth card grid, schedule overview | 4h | done | DI-006.1 |
| DI-006.3 | OAuth card component | `oauth-card.tsx` -- provider icon, status dot (green/yellow/red/gray), sync info, Connect/Disconnect/Sync Now actions | 1.5h | done | DI-006.1 |
| DI-006.4 | Freshness banner component | `freshness-banner.tsx` -- yellow >24h stale, red >48h expired, dismissable but re-appears on reload | 0.5h | done | DI-006.1 |
| DI-006.5 | Content Inventory page | `/inventory` page -- header with crawl status, filter bar, DataTable, detail slide-over | 5h | done | DI-006.1 |
| DI-006.6 | Inventory DataTable | `inventory-table.tsx` -- 9 columns (URL, title, status badge, word count, H2s, links, images, health bar, last crawled), server-side pagination, column sort, search | 2h | done | DI-006.5 |
| DI-006.7 | Detail slide-over panel | `detail-slideover.tsx` -- overview, metadata, heading structure, links, SVG performance timeline, status classification | 2h | done | DI-006.6 |
| DI-006.8 | Sidebar navigation update | Add Connections and Inventory items to dashboard sidebar | 0.5h | done | DI-006.2 |

---

## Phase 6: Content Intelligence (~60h)

### CI-001: Decay Detector (Sprint 4, 12h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| CI-001.1 | GSC click/impression decline detection | `bridge/intelligence/decay-detector.js` -- detectClickDecline() comparing 90-day rolling windows, severity tiers (critical/high/medium/low), 100-click minimum threshold | 3h | done | DI-002.3 |
| CI-001.2 | Ranking position tracking | detectPositionDrop() -- 30-day vs prev 30-day comparison, page boundary crossing detection, position trend direction (improving/stable/declining/collapsed) | 2h | done | DI-002.3 |
| CI-001.3 | Content age audit | detectContentAge() -- content type detection from title/URL patterns, age triggers (listicle 6mo, how-to 12mo, evergreen 18-24mo), preemptive refresh signals | 2h | done | DI-004.5 |
| CI-001.4 | Classification engine and status updater | classifyContent() -- merge 3 methods, apply HEALTHY/DECAYING/DECLINING/DEAD rules, determine recommended action (partial_refresh/full_rewrite/retire_301/monitor), update content_inventory.status | 3h | done | CI-001.1, CI-001.2, CI-001.3 |
| CI-001.5 | API endpoints | GET /api/intelligence/decay (paginated list with severity/sort filters) + GET /api/intelligence/decay/:contentId (full detail with trend data) | 2h | done | CI-001.4 |

### CI-002: Gap Analyzer + Cannibalization (Sprint 4, 12h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| CI-002.1 | Create keyword_opportunities migration | `migrations/010-keyword-opportunities.sql` -- keyword_opportunities table with priority_score, competing_urls, recommended_action, unique constraint, indexes, RLS | 2h | done | DI-005.1 |
| CI-002.2 | Build gap analyzer | `bridge/intelligence/gap-analyzer.js` -- findKeywordGaps() querying topQueries from snapshots, fuzzy match against content_inventory, 3-component scoring (impressions/position/competition), detectCompetitors() | 4h | done | CI-002.1, DI-002.3, DI-004.5 |
| CI-002.3 | Build cannibalization detector | `bridge/intelligence/cannibalization.js` -- detectCannibalization() finding 2+ URLs for same query within top 50, impression split analysis, 4 resolution strategies (merge/redirect/differentiate/deoptimize) with confidence scores | 4h | done | CI-002.1, DI-002.3 |
| CI-002.4 | Register API endpoints | GET /api/intelligence/gaps (pagination+filters), GET gaps/competitors, GET /api/intelligence/cannibalization, GET cannibalization/:keyword, POST cannibalization/:id/resolve | 2h | done | CI-002.2, CI-002.3 |

### CI-003: Topic Recommender Agent (Sprint 5, 16h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| CI-003.1 | Build scoring engine | `bridge/intelligence/topic-recommender.js` -- TopicRecommender class, 5-component formula (impressions 0.3, decay 0.25, gap 0.25, seasonality 0.1, competition 0.1), each normalized 0-100, scoreOpportunities() | 5h | done | CI-001.4, CI-002.2 |
| CI-003.2 | Recommendation assembly | assembleRecommendation() -- rich objects with keyword, type, score, action, human-readable summary, evidence; generateRecommendations() full pipeline with analysis_run tracking | 3h | done | CI-003.1 |
| CI-003.3 | Create Topic Recommender agent | `agents/topic-recommender.md` -- markdown agent receiving category + data context, outputs refined angles, content type suggestions, word count estimates, subtopics, internal linking opportunities | 3h | done | CI-003.2 |
| CI-003.4 | Wire into SKILL.md as Mode B | Mode detection (category vs keyword), Mode B flow: generate recommendations -> present to user -> user selects -> feeds pipeline with full context, Mode A unchanged | 3h | done | CI-003.3 |
| CI-003.5 | Register API endpoints | GET /api/intelligence/recommendations (pagination+type+score filters), GET recommendations/:id, PATCH update, POST execute, POST /api/intelligence/run (trigger analysis) | 2h | done | CI-003.2 |

### CI-004: Semrush + Ahrefs Connectors (Sprint 5, 8h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| CI-004.1 | Build Semrush connector | `bridge/ingestion/semrush.js` -- SemrushConnector class, fetchDomainAnalytics(), fetchKeywordGap(), fetchTopicResearch(), API cost tracking per call | 3h | done | DI-001.1 |
| CI-004.2 | Build Ahrefs connector | `bridge/ingestion/ahrefs.js` -- AhrefsConnector class, fetchBacklinkProfile(), fetchDomainRating(), fetchKeywordExplorer(), row-based cost tracking | 3h | done | DI-001.1 |
| CI-004.3 | Implement 7-day caching layer | Cache key = provider:endpoint:params_hash, check updated_at before API call, skip fresh keywords, log cache hit/miss rates | 1h | done | CI-004.1, CI-004.2 |
| CI-004.4 | Register endpoints + scheduler integration | POST /api/connections/semrush + ahrefs (encrypted key storage), trigger endpoints, update scheduler.js with Monday/Tuesday weekly runs, graceful degradation if no keys | 1h | done | CI-004.3, DI-005.2 |

### CI-005: Dashboard -- Intelligence + Opportunities (Sprint 6, 12h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| CI-005.1 | API client methods | `dashboard/src/lib/api.ts` -- 12 typed methods for recommendations, decay, gaps, competitors, cannibalization, analysis runs | 2h | done | CI-003.5, CI-001.5, CI-002.4 |
| CI-005.2 | Opportunities page with tab layout | `/opportunities` page -- header, "Run Analysis" button, summary stats bar, 4-tab navigation (Recommendations/Gaps/Cannibalization/Decay), URL-synced tabs | 2h | done | CI-005.1 |
| CI-005.3 | Recommendations tab | `recommendation-card.tsx` -- keyword, type badge, score-badge (0-100 color-coded), summary, metrics, "Accept & Generate" / "Dismiss" actions, expandable evidence panel; filter bar + grid | 3h | done | CI-005.2 |
| CI-005.4 | Keyword Gaps tab | `gap-table.tsx` -- DataTable with keyword, impressions, position, score, competitors tooltip, "Create Article" action; competitor overview panel | 2h | done | CI-005.2 |
| CI-005.5 | Cannibalization tab | `cannibalization-group.tsx` -- keyword header with severity, competing URLs list with impression share bars, resolution strategy selector (merge/redirect/differentiate/deoptimize), "Apply Resolution" action | 2h | done | CI-005.2 |
| CI-005.6 | Decay Alerts tab | `decay-alert.tsx` -- card with URL, severity badge, click/impression change percentages, trend sparkline, recommended action badge, "View Detail" link | 1h | done | CI-005.2 |

---

## Phase 7: Quality Gate (~40h)

### QG-001: SEO Checklist Engine (Sprint 3, 16h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| QG-001.1 | Port ContentMetrics from seo-analyzer.ts | `engine/quality-gate.js` -- ContentMetrics class with 40+ metric extraction functions (wordCount, headings, links, images, TOC/FAQ detection, keyword density), regex-based HTML parsing, Unicode-aware for Arabic | 4h | done | -- |
| QG-001.2 | Implement 60-point checklist | runChecklist(html, keyword, options) -- 8 categories: Content Structure (17), Keywords (7), Metadata (4), Internal Links (5), External Links (5), Images (6), Formatting (6), i18n (4); each returns pass/fail/warning/info | 5h | done | QG-001.1 |
| QG-001.3 | E-E-A-T 10-dimension rubric | runEEATScoring(html, keyword) -- 10 dimensions scored 0-3 each (keyword targeting, secondary keywords, content depth, readability, internal links, external link quality, structured data, mobile rendering, page speed signals, media optimization); grades A-F | 3h | done | QG-001.1 |
| QG-001.4 | Suggestion generator | `engine/quality-suggestions.js` -- generateSuggestions() ported from old-seo-blog-checker, structured suggestions with severity/title/current/target/instruction/autoFixable, prioritized by impact, max 15 | 2h | done | QG-001.2, QG-001.3 |
| QG-001.5 | Bridge server endpoints | GET /api/quality/score/:articleId (overall + category scores + E-E-A-T grade) + GET /api/quality/checklist/:articleId (full 60 items grouped), auth + rate limit | 2h | done | QG-001.4 |

### QG-002: Quality Gate Agent (Sprint 4, 12h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| QG-002.1 | Create Quality Gate Agent | `agents/quality-gate.md` -- 7-signal weighted scoring (E-E-A-T 20%, Topical Completeness 20%, Voice Match 15%, AI Detection Risk 15%, Freshness 10%, Technical SEO 10%, Readability 10%), structured JSON output, pass threshold 7.0/10 | 4h | done | QG-001.5 |
| QG-002.2 | Implement auto-revision loop | Structured fix instructions generation when score <7.0, route back to draft-writer, max 2 passes, needs_human_review fallback, revision logging | 3h | done | QG-002.1 |
| QG-002.3 | Modify draft writer for revision mode | `agents/draft-writer.md` -- new Revision Mode section, parse priority fixes, targeted section changes only, preserve "Do NOT change" sections, return changelog | 2h | done | QG-002.2 |
| QG-002.4 | Integrate into SKILL.md pipeline | Add Step 11: Quality Gate after draft-writer, revision loop logic (score check -> revise -> recheck), quality_score in article metadata, pipeline status updates | 1.5h | done | QG-002.3 |
| QG-002.5 | Suggestions endpoint | GET /api/quality/suggestions/:articleId -- latest quality gate results, suggestions list, signal scores, revision history | 1.5h | done | QG-002.4 |

### QG-003: Dashboard Quality Report (Sprint 5, 12h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| QG-003.1 | Score Ring component | `dashboard/components/quality/score-ring.tsx` -- circular SVG 0-100 score with color coding (green/yellow/orange/red), animated fill, center grade text, responsive 120-200px | 2h | done | QG-001.5 |
| QG-003.2 | Signal Bars component | `dashboard/components/quality/signal-bars.tsx` -- 7 horizontal bars with name, weight %, score 0-10, weighted contribution, color fill, hover tooltips, sorted by impact | 2h | done | QG-002.1 |
| QG-003.3 | Checklist Panel with tabs | `checklist-panel.tsx` -- 3 tabs (Checklist: 8 collapsible categories with pass/fail badges + filter; E-E-A-T: radar chart + 10 dimensions; Suggestions: prioritized cards with severity + autofix lightning bolt) | 3h | done | QG-001.5, QG-002.5 |
| QG-003.4 | Main Quality page | `/articles/[id]/quality/page.tsx` -- server component, header with Re-score + Auto-fix buttons, ScoreRing + SignalBars side-by-side, ChecklistPanel below, loading skeletons, error states | 3h | done | QG-003.1, QG-003.2, QG-003.3 |
| QG-003.5 | RTL support and responsiveness | Mirror signal bars for RTL, right-aligned checklist text, responsive stacking below 768px, accordion categories on mobile, Arabic article data testing | 2h | done | QG-003.4 |

---

## Phase 8: Voice Intelligence (~50h)

### VI-001: Corpus Analyzer (Sprint 6, 16h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| VI-001.1 | Corpus crawler | `bridge/intelligence/voice-analyzer.js` -- CorpusAnalyzer class, sitemap-first with link-follow fallback, 2 req/sec rate limit, 10s timeout, max 500 pages, regex-based main content extraction, metadata extraction | 4h | done | DI-004.4 |
| VI-001.2 | Stylometric feature extraction | 6 signals per article: sentence length variance, TTR (first 500 words), hedging frequency, cliche density, em-dash frequency, paragraph rhythm variance; composite AI probability score (weighted formula 0-1) | 4h | done | VI-001.1 |
| VI-001.3 | Classification engine | classifyCorpus() -- process each article through stylometric extraction, classify HUMAN(<0.35)/HYBRID(0.35-0.65)/AI-GENERATED(>0.65), corpus summary with sufficiency check (>=50 total, >=30 human), store in content_inventory.metadata | 3h | done | VI-001.2 |
| VI-001.4 | Database migration 011 | `migrations/011-writer-personas.sql` -- writer_personas table with voice_profile JSONB, formality_score, tone, heading_style, RLS policies, unique default-per-user index | 1.5h | done | -- |
| VI-001.5 | Bridge server endpoints | POST /api/voice/analyze (trigger crawl job, validate URL, reject localhost), GET /api/voice/corpus/:userId (status + summary), GET /api/voice/analyze/progress/:jobId (SSE stream), 1 concurrent analysis per user | 3.5h | done | VI-001.3, VI-001.4 |

### VI-002: Writer Clustering (Sprint 6, 12h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| VI-002.1 | 12-dimension feature vector extraction | extractFullFeatureVector() -- avg sentence length, variance, TTR, vocab sophistication, passive voice ratio, paragraph length/rhythm, question/exclamation frequency, formality, first-person ratio, analogy density; all normalized 0-1 | 3h | done | VI-001.3 |
| VI-002.2 | HDBSCAN clustering implementation | Pure JS HDBSCAN -- core distance, mutual reachability distance, Prim's MST, dendrogram, stability-based extraction; params minClusterSize=5, minSamples=3; handle noise points, single-cluster, no-cluster fallbacks | 4h | done | VI-002.1 |
| VI-002.3 | Persona generation | For each cluster: generate descriptive name from dominant features (8-10 name templates), compute avg features, produce voice/cadence/structure/avoids profile, select 5 representative sentences, set largest cluster as default, store in writer_personas | 3h | done | VI-002.2 |
| VI-002.4 | CRUD endpoints | GET /api/voice/personas (list), GET /api/voice/personas/:id, POST create, PUT update, DELETE -- all auth-protected, user-scoped | 2h | done | VI-002.3, VI-001.4 |

### VI-003: Voice Analyzer Agent (Sprint 7, 12h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| VI-003.1 | Create Voice Analyzer agent | `agents/voice-analyzer.md` -- receives corpus summary + cluster data + user preferences, produces refined structured voice profile (voice, cadence, vocabulary, tone, formatting, must-avoid list, source articles) | 4h | done | VI-002.3 |
| VI-003.2 | Modify draft writer for voice constraints | `agents/draft-writer.md` -- Voice Profile Constraints section, enforce sentence cadence/vocabulary/tone/formatting per profile, self-check prompt per section, voice_profile_used in metadata | 3h | done | VI-003.1 |
| VI-003.3 | Pipeline integration in SKILL.md | Add Step 4.5: Voice Analyzer (optional), decision logic (default persona -> inject, no persona -> skip, user preference -> run agent), pass profile to research + draft-writer steps | 2.5h | done | VI-003.2 |
| VI-003.4 | Voice analysis trigger endpoint | POST /api/voice/analyze agent-based (distinct from corpus crawl), auth required, returns refined voice profile with SSE progress | 1.5h | done | VI-003.1 |
| VI-003.5 | Unit and integration tests | `tests/voice-analyzer-agent.test.js` -- test profile structure validation, draft-writer constraint enforcement, pipeline mode selection | 1h | done | VI-003.3 |

### VI-004: Dashboard -- Voice Profiles (Sprint 7, 10h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| VI-004.1 | Persona Card component | `dashboard/components/voice/persona-card.tsx` -- name + default badge, tone/TTR/corpus/formality metrics row, voice description preview, Set Default / View / Edit / Delete actions, RTL support | 2h | done | VI-002.4 |
| VI-004.2 | Persona Detail panel | `dashboard/components/voice/persona-detail.tsx` -- slide-over with 3 tabs (Profile: full voice/cadence/vocab/tone/formatting; Samples: 5 quote blocks with source URLs; Sources: DataTable of articles with AI probability), inline edit mode | 3h | done | VI-004.1 |
| VI-004.3 | Main Voice page | `/voice/page.tsx` -- header with "Analyze Site" button, corpus status indicator, empty state with CTA, persona grid (2-3 cols responsive), detail area, sidebar nav update | 2.5h | done | VI-004.1, VI-004.2 |
| VI-004.4 | Analyze Site dialog | `analyze-dialog.tsx` -- URL input + max pages slider + preferences textarea, SSE progress view (Crawling -> Classifying -> Clustering -> Profiling), live stats, cancel support, completion summary | 2.5h | done | VI-001.5, VI-004.3 |

---

## Phase 9: Universal Publishing (~60h)

### PB-001: Universal Article Payload (Sprint 7, 8h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| PB-001.1 | Define Universal Article Payload schema | `bridge/publishing/payload-schema.json` -- JSON Schema with article (title/slug/html/text/language/direction), seo (meta/og/jsonLd), taxonomy, images (featured + content array), schema (Article/FAQ/HowTo/Breadcrumb JSON-LD), quality, metadata sections | 2h | done | -- |
| PB-001.2 | Payload builder | `bridge/publishing/payload.js` -- buildPayload(articleId) fetching article record, assembling each section (title extraction, slug generation, language detection, meta tags, JSON-LD, taxonomy, image listing, quality scores), validation against schema | 2.5h | done | PB-001.1 |
| PB-001.3 | Image CDN pipeline | `bridge/publishing/image-pipeline.js` -- processImages() extracting img tags, upload strategy per platform (WordPress media API, Shopify Files, Contentful Assets, S3 presigned), HTML src replacement, 3 parallel uploads, graceful failure handling | 2h | done | PB-001.1 |
| PB-001.4 | Payload endpoint | GET /api/publish/payload/:articleId -- auth, query params (?platform, ?processImages, ?format=full|minimal), 404/409 error handling, rate limited | 1.5h | done | PB-001.2, PB-001.3 |

### PB-002: WordPress Connector Plugin (Sprint 8, 20h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| PB-002.1 | Main plugin file | `plugins/wordpress/chainiq-connector/chainiq-connector.php` -- plugin header (WP 5.8+, PHP 7.4+), activation/deactivation/uninstall hooks, includes loading, text domain i18n | 2h | done | PB-001.4 |
| PB-002.2 | Admin settings page | `class-chainiq-admin.php` -- Settings API registration, 8 fields (API URL, key, post status, author, category, featured image toggle, SEO plugin dropdown, connection status), "Test Connection" button, nonce + sanitization | 3h | done | PB-002.1 |
| PB-002.3 | Publisher class -- post creation | `class-chainiq-publisher.php` -- publish_article($payload) via wp_insert_post(), universal compatibility with all page builders (Gutenberg/Elementor/WPBakery/Classic) | 2h | done | PB-002.1 |
| PB-002.4 | Publisher class -- taxonomy + media | wp_set_post_categories() with auto-create, wp_set_post_tags(), media_handle_sideload() for featured image, set_post_thumbnail(), alt text meta | 2h | done | PB-002.3 |
| PB-002.5 | Publisher class -- SEO meta integration | Yoast SEO meta fields (_yoast_wpseo_title, _yoast_wpseo_metadesc, _yoast_wpseo_focuskw, canonical), RankMath meta fields (rank_math_title, description, focus_keyword, canonical), JSON-LD injection | 2h | done | PB-002.3 |
| PB-002.6 | Webhook handler | `class-chainiq-webhook-handler.php` -- register_rest_route('chainiq/v1', '/receive'), X-ChainIQ-Key auth validation, payload validation, error responses | 4h | done | PB-002.3 |
| PB-002.7 | Bridge server push endpoint | POST /api/publish/wordpress/push in bridge/server.js -- fetch credentials, build payload, POST to WP site /wp-json/chainiq/v1/receive, handle response/errors | 2h | done | PB-002.6, PB-001.4 |
| PB-002.8 | Publishing status tracking | Create migrations/014-platform-connections.sql + 015-publish-records.sql, track publish_records (article_id, platform, remote_id, remote_url, status), image_upload_log | 2h | done | PB-002.7 |
| PB-002.9 | WordPress plugin readme | readme.txt in WordPress.org format -- description, installation, FAQ, screenshots, changelog | 1h | done | PB-002.6 |

### PB-003: Shopify Adapter (Sprint 8, 12h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| PB-003.1 | Shopify OAuth2 / custom app token | `bridge/publishing/shopify.js` -- ShopifyClient class, OAuth2 flow (auth URL, callback, token exchange), custom app token support, encrypted storage in client_connections, API client wrapper with 2 req/sec rate limiting | 3h | done | DI-001.4, PB-001.4 |
| PB-003.2 | Blog article publishing | publishArticle() -- map Universal Payload to Shopify Blog Article (title, body_html, tags, summary_html, metafields for SEO), blog selection/creation, featured image via article.image field | 3.5h | done | PB-003.1 |
| PB-003.3 | Product awareness | getProductCatalog() -- fetch products API with pagination, build reference map; enrichWithProducts() -- fuzzy match product titles in article text, wrap in product links, add "Related Products" section, product-aware JSON-LD; 1h catalog cache | 3h | done | PB-003.2 |
| PB-003.4 | Bridge server endpoints | POST /api/publish/shopify/push (with optional enrichProducts flag), POST /api/publish/shopify/auth (OAuth flow), image pipeline Shopify strategy in image-pipeline.js | 2.5h | done | PB-003.2, PB-003.3 |

### PB-004: Headless CMS Adapters (Sprint 9, 12h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| PB-004.1 | Adapter base class | `bridge/publishing/adapter-base.js` -- PublishAdapter base with validatePayload(), makeRequest() with 3-retry backoff, handleRateLimit(), logPublish(), abstract transformPayload()/publish(), normalized error response | 1.5h | done | PB-001.4 |
| PB-004.2 | Contentful adapter | `bridge/publishing/contentful.js` -- Management API token auth, HTML-to-Rich-Text mapping, asset upload + publish, entry creation + publish, locale system support | 2h | done | PB-004.1 |
| PB-004.3 | Strapi adapter | `bridge/publishing/strapi.js` -- API token auth, configurable field mapping, multipart media upload, REST entry creation (with optional GraphQL mutation path) | 2h | done | PB-004.1 |
| PB-004.4 | Ghost adapter | `bridge/publishing/ghost.js` -- Admin API JWT generation (HMAC-SHA256 with crypto, no deps), HTML body via ?source=html, multipart image upload, draft/published status | 2h | done | PB-004.1 |
| PB-004.5 | Webflow adapter | `bridge/publishing/webflow.js` -- Bearer token auth, CMS Collection Item field mapping (name/slug/post-body/seo-title), collection identification, draft creation with optional publish | 2h | done | PB-004.1 |
| PB-004.6 | Sanity adapter | `bridge/publishing/sanity.js` -- Bearer token auth, HTML-to-Portable-Text (simplified html block), image asset upload, mutations API createOrReplace | 1.5h | done | PB-004.1 |
| PB-004.7 | Generic webhook publisher | `bridge/publishing/generic-webhook.js` -- POST full payload to user URL, HMAC-SHA256 signature (reuse WebhookManager), 30s timeout, 3-retry, publish.* events (started/success/failed), sample receiver docs | 1.5h | done | PB-004.1 |
| PB-004.8 | Adapter registry + generic route | Adapter registry object in bridge/server.js (8 platforms), POST /api/publish/:platform/push generic route with validation, backward compat for WP/Shopify specific routes | 1.5h | done | PB-004.2, PB-004.3, PB-004.4, PB-004.5, PB-004.6, PB-004.7 |

### PB-005: Dashboard -- Publish Manager (Sprint 9, 8h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| PB-005.1 | Platform Cards component | `dashboard/components/publish/platform-cards.tsx` -- grid of 7 platform icons with status badges (Connected/Disconnected/Error), article count, last publish date, Configure/Connect/Disconnect actions | 2h | done | PB-004.8 |
| PB-005.2 | Publish Queue DataTable | `dashboard/components/publish/publish-queue.tsx` -- columns: Article, Platform icon, Status badge (Queued/Publishing/Published/Failed), Published URL, Date, Actions (Retry/View); sortable, filterable, paginated 20/page | 2h | done | PB-002.8 |
| PB-005.3 | Publish Dialog | `dashboard/components/publish/publish-dialog.tsx` -- 4-step wizard (Select Article -> Select Platform -> Configure Options (dynamic per platform) -> Confirm & Publish with SSE progress), success/failure handling | 2h | done | PB-005.1 |
| PB-005.4 | Platform Configuration form | `dashboard/components/publish/platform-config.tsx` -- dynamic fields per platform (WP: URL+key+status+author+SEO; Shopify: domain+token; Contentful: space+env+token; etc.), Test Connection button, encrypted credential save | 1h | done | PB-005.1 |
| PB-005.5 | Main Publish page + navigation | `/publish/page.tsx` -- header, platform cards grid, publish queue table, sidebar nav update with "Publish" item | 1h | done | PB-005.1, PB-005.2, PB-005.3 |

---

## Phase 10: Feedback Loop (~30h)

### FL-001: Performance Tracker (Sprint 10, 12h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| FL-001.1 | Database migration 012 | `migrations/012-performance-predictions.sql` -- performance_predictions table with predicted/actual columns for 30d/60d/90d intervals (clicks, impressions, position), accuracy scores, tracking state, RLS, indexes | 1.5h | done | -- |
| FL-001.2 | Prediction recording | `bridge/intelligence/performance-tracker.js` -- PerformanceTracker class, recordPrediction() called at publish time with predicted metrics, set next_check_at to publish + 30d | 2h | done | FL-001.1 |
| FL-001.3 | Performance snapshot collection | collectSnapshot() -- GSC query for specific URL + keyword (30-day window), GA4 page path metrics, interval-specific logic (30d fill + set next 30d, 60d fill + set next 30d, 90d fill + set complete) | 3.5h | done | FL-001.2, DI-002.1, DI-003.1 |
| FL-001.4 | Accuracy score calculation | calculateAccuracy() per metric (max(0, 100 - abs(pred-actual)/pred * 100)), interval accuracy (clicks 40% + impressions 35% + position 25%), overall accuracy (30d 20% + 60d 35% + 90d 45%), Excellent/Good/Fair/Poor classification | 2.5h | done | FL-001.3 |
| FL-001.5 | Scheduled check + endpoints | runScheduledChecks() processing due predictions in batches of 20 with GSC rate limiting, POST /api/feedback/check (admin trigger), GET /api/feedback/predictions/:articleId (full prediction vs actual data) | 2.5h | done | FL-001.4 |

### FL-002: Recalibration Engine (Sprint 10, 10h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| FL-002.1 | Current scoring model reference | `bridge/intelligence/recalibration.js` -- document 5-factor formula, ScoringConfig helper to load/save weights, weight bounds (0.05-0.40), initial defaults | 1h | done | CI-003.1 |
| FL-002.2 | Error analysis engine | analyzeErrors(userId) -- collect completed predictions (min 10), per-prediction error decomposition by dominant factor, average accuracy per factor, trend detection (recent vs older predictions) | 3h | done | FL-001.4, FL-002.1 |
| FL-002.3 | Weight adjustment algorithm | calculateNewWeights() -- deviation from 80% target, learning rate 0.05, apply adjustments with clamping (0.05-0.40), normalize to sum=1.0, confidence gating (<5 skip, 5-10 half, >10 full), max +/-0.05 per recalibration | 3h | done | FL-002.2 |
| FL-002.4 | Dry-run mode | recalibrate(userId, options) -- dry-run returns comparison report (current vs proposed weights, changes with reasons, factor accuracy, confidence level, recommendation) without saving; live mode saves + creates history record for rollback | 1.5h | done | FL-002.3 |
| FL-002.5 | Admin endpoint + history | POST /api/feedback/recalibrate (admin auth, body: userId + dryRun flag, 400 if <10 predictions, 403 for non-admin cross-user), GET /api/feedback/recalibration-history, rate limit 1 per user per 24h | 1.5h | done | FL-002.4 |

### FL-003: Dashboard -- Performance + Reports (Sprint 10, 8h)

| # | Subtask | Description | Effort | Status | Blocked By |
|---|---------|-------------|--------|--------|------------|
| FL-003.1 | Summary Cards component | `dashboard/components/performance/summary-cards.tsx` -- 4 metric cards: Articles Tracked (count), Avg Accuracy (color-coded), Above Target (green trending-up), Below Target (red trending-down); sparklines + trend indicators | 1.5h | done | FL-001.5 |
| FL-003.2 | Timeline Chart | `dashboard/components/performance/timeline-chart.tsx` -- SVG line chart, 3 lines (30d blue, 60d green, 90d orange accuracy), monthly buckets, clickable data points with tooltips, date range selector (3mo/6mo/12mo/all), responsive | 2h | done | FL-001.5 |
| FL-003.3 | Predictions DataTable | `dashboard/components/performance/predictions-table.tsx` -- 8 columns (Article, Keyword, Platform, Published, Predicted Clicks, Actual Clicks, Accuracy badge, Status), expandable rows for 60d/90d detail, filters (date/platform/status/accuracy), CSV export, 25/page | 2h | done | FL-001.5 |
| FL-003.4 | Report generator | `dashboard/components/performance/report-generator.tsx` -- dialog with date range + platform filter + format (JSON/HTML) + section checkboxes, report content: summary + article details + accuracy trends + recommendations; POST /api/feedback/report/:userId endpoint | 1.5h | done | FL-003.3 |
| FL-003.5 | Main Performance page + navigation | `/performance/page.tsx` -- server component, header with "Generate Report" button, summary cards row, timeline chart, predictions DataTable, sidebar nav update with "Performance" item, empty state messaging | 1h | done | FL-003.1, FL-003.2, FL-003.3 |

---

## Summary Statistics

| Phase | Tasks | Subtasks | Effort |
|-------|-------|----------|--------|
| 5 -- Data Ingestion | 6 | 41 | ~80h |
| 6 -- Content Intelligence | 5 | 28 | ~60h |
| 7 -- Quality Gate | 3 | 15 | ~40h |
| 8 -- Voice Intelligence | 4 | 19 | ~50h |
| 9 -- Universal Publishing | 5 | 25 | ~60h |
| 10 -- Feedback Loop | 3 | 15 | ~30h |
| **Total** | **26** | **143 (core) + 83 (sub-components) = 226** | **~320h** |

---

## Cross-Phase Dependencies

```
Phase 5 (Data Ingestion) ──────────────────────────────────────────────────────
  DI-001 (OAuth) ──► DI-002 (GSC) ──► DI-003 (GA4) ──► DI-005 (Scheduler)
                 ──► DI-004 (Crawler) ──► DI-005 (Scheduler)
                 ──► DI-006 (Dashboard)

Phase 6 (Intelligence) ────────────────────────────────────────────────────────
  DI-002 + DI-004 ──► CI-001 (Decay) ──► CI-003 (Recommender)
  DI-002 + DI-004 ──► CI-002 (Gaps) ──► CI-003 (Recommender)
  DI-001 ──► CI-004 (Semrush/Ahrefs)
  CI-001 + CI-002 + CI-003 ──► CI-005 (Dashboard)

Phase 7 (Quality Gate) ────────────────────────────────────────────────────────
  (standalone) ──► QG-001 (Checklist)
  QG-001 ──► QG-002 (Agent) ──► QG-003 (Dashboard)

Phase 8 (Voice) ───────────────────────────────────────────────────────────────
  DI-004 ──► VI-001 (Corpus) ──► VI-002 (Clustering) ──► VI-003 (Agent)
  VI-002 ──► VI-004 (Dashboard)

Phase 9 (Publishing) ──────────────────────────────────────────────────────────
  (standalone) ──► PB-001 (Payload)
  PB-001 ──► PB-002 (WordPress) + PB-003 (Shopify) ──► PB-004 (CMS Adapters)
  PB-004 ──► PB-005 (Dashboard)

Phase 10 (Feedback) ───────────────────────────────────────────────────────────
  DI-002 + DI-003 ──► FL-001 (Tracker) ──► FL-002 (Recalibration)
  FL-001 ──► FL-003 (Dashboard)
  CI-003 ──► FL-002 (scoring weights reference)
```

---

## Sprint-to-Subtask Mapping

| Sprint | Weeks | Tasks | Subtask Count |
|--------|-------|-------|---------------|
| S1 | 1-2 | DI-001 | 6 |
| S2 | 3-4 | DI-002, DI-003, DI-004 | 16 |
| S3 | 5-6 | DI-005, DI-006, QG-001 | 19 |
| S4 | 7-8 | CI-001, CI-002, QG-002 | 14 |
| S5 | 9-10 | CI-003, CI-004, QG-003 | 14 |
| S6 | 11-12 | CI-005, VI-001, VI-002 | 15 |
| S7 | 13-14 | VI-003, VI-004, PB-001 | 13 |
| S8 | 15-16 | PB-002, PB-003 | 13 |
| S9 | 17-18 | PB-004, PB-005 | 13 |
| S10 | 19-20 | FL-001, FL-002, FL-003 | 15 |
| **Total** | | **26 tasks** | **138 primary + 88 implicit = 226** |

---

## Progress Dashboard

```
Phase 5:  [..........] 0/41   0%
Phase 6:  [..........] 0/28   0%
Phase 7:  [..........] 0/15   0%
Phase 8:  [..........] 0/19   0%
Phase 9:  [..........] 0/25   0%
Phase 10: [..........] 0/15   0%
──────────────────────────────
Overall:  [..........] 0/226  0%
```
