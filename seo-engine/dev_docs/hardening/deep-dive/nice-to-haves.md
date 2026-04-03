# Nice-to-Have Features -- Organized by Service

> **Generated:** 2026-03-28
> **Source:** service-matrix.md (93 features), round-4-prioritization.md (MoSCoW verdicts)
> **Scope:** All Should Have (40), Could Have (25), and Won't Have (2) features
> **Purpose:** Effort estimates and priority classification for backlog grooming

---

## Priority Classification Key

| Category | Definition | Criteria |
|----------|-----------|----------|
| **Quick Win** | Low effort, high value | <= 8h, directly improves user experience or retention |
| **Easy Add** | Low effort, moderate value | <= 8h, enhances existing capability without major architecture changes |
| **Strategic Bet** | High effort, high value | > 8h, creates competitive differentiation or unlocks new revenue |
| **Moonshot** | High effort, uncertain value | > 16h, requires research/experimentation, ROI unproven |

---

## Service 2: Article Pipeline

| # | Feature | MoSCoW | Effort | Priority | Rationale |
|---|---------|--------|--------|----------|-----------|
| 24 | Style cloning for draft-writer | Should Have | 8h | **Strategic Bet** | Requires VI-003 (Voice Analyzer agent) to produce voice profiles. The draft-writer modification to consume voice_profile JSONB is ~3h, but the end-to-end integration with pipeline testing adds complexity. HIGH value -- this is the bridge between voice intelligence and generation. Without it, voice analysis is observational only. |

**Service 2 Total: 1 feature, ~8h**

---

## Service 3: Dashboard API

| # | Feature | MoSCoW | Effort | Priority | Rationale |
|---|---------|--------|--------|----------|-----------|
| 10 | Content inventory dashboard page | Should Have | 5h | **Quick Win** | DataTable component with server-side pagination, filtering, and search. Standard dashboard work. Pulled forward to Phase A/Sprint 3 per vertical slice strategy. HIGH value -- users need to see their crawled content. |
| 17 | Opportunities dashboard page | Should Have | 12h | **Strategic Bet** | 4-tab layout (Recommendations, Gaps, Cannibalization, Decay). Complex but uses established dashboard patterns. HIGH value -- primary surface for Content Intelligence output. |
| 23 | Voice profiles dashboard page | Should Have | 10h | **Strategic Bet** | Persona cards, detail panel, analyze dialog with SSE progress. Moderate complexity. MEDIUM value -- premium feature for voice-aware clients. |
| 48 | Dashboard quality report tab | Should Have | 12h | **Strategic Bet** | Score ring, signal bars, checklist panel, E-E-A-T radar, suggestions list. Most complex dashboard page. HIGH value -- quality visibility is a key differentiator. |
| 77 | Client-facing performance reports | Should Have | 6h | **Quick Win** | HTML/JSON report generator with date range filters and section selection. Leverages existing performance data. HIGH value for agency clients (Marcus persona needs reports for client meetings). |
| 85 | Performance dashboard page | Should Have | 8h | **Quick Win** | Summary cards, timeline chart, predictions DataTable. Standard dashboard pattern. MEDIUM value -- needed for feedback loop observability. |

**Service 3 Total: 6 features, ~53h**

---

## Service 5: Analytics

| # | Feature | MoSCoW | Effort | Priority | Rationale |
|---|---------|--------|--------|----------|-----------|
| 81 | Portfolio-level analytics | Should Have | 12h | **Strategic Bet** | Aggregate performance across all articles per client. Requires new queries and dashboard widgets. HIGH value for enterprise clients managing 100+ articles. |
| 89 | Conversion attribution | Could Have | 20h | **Moonshot** | Link GA4 conversions to specific articles. Requires GA4 enhanced e-commerce integration and attribution modeling. UNCERTAIN value -- only relevant for e-commerce clients with conversion tracking configured. |
| 91 | Content calendar ROI | Could Have | 12h | **Strategic Bet** | Calculate ROI per content calendar period. Requires timeline normalization and cost allocation. MEDIUM value -- useful for agencies proving content investment returns. |

**Service 5 Total: 3 features, ~44h**

---

## Service 7: Data Ingestion

| # | Feature | MoSCoW | Effort | Priority | Rationale |
|---|---------|--------|--------|----------|-----------|
| 4 | Semrush API client | Should Have | 3h | **Easy Add** | API client with keyword research, gap analysis, SERP features. Pattern follows GSC/GA4 connectors. Enriches Content Intelligence scoring (competition weight 0.10). Monthly cost ($80-150) is the main consideration, not effort. |
| 5 | Ahrefs API client | Should Have | 3h | **Easy Add** | API client with backlinks, DR, keyword explorer. Mirrors Semrush pattern. Enriches gap analysis with backlink data. Same monthly cost consideration. |
| 6 | Google Trends seasonal curves | Could Have | 8h | **Easy Add** | Google Trends does not have an official API -- requires scraping or pytrends integration. Enriches seasonality score (weight 0.10 in CI-003 formula). MEDIUM value -- improves recommendation timing. |

**Service 7 Total: 3 features, ~14h**

---

## Service 8: Content Intelligence

| # | Feature | MoSCoW | Effort | Priority | Rationale |
|---|---------|--------|--------|----------|-----------|
| 15 | Seasonality planning | Could Have | 16h | **Strategic Bet** | Model demand curves per keyword/topic using Google Trends + historical GSC patterns. Adjusts recommendation priority based on upcoming seasonal peaks (e.g., "publish ski content in September to rank by November"). Requires trend data integration and calendar mapping. HIGH value for publishers in seasonal verticals (travel, retail, sports). |
| 16 | Saturation scoring | Could Have | 12h | **Strategic Bet** | Analyze SERP competition density and content freshness to determine how saturated a keyword space is. Low saturation = easier to rank. Enriches the competition component (weight 0.10) of the scoring formula. MEDIUM value -- refines recommendation quality. |

**Service 8 Total: 2 features, ~28h**

---

## Service 9: Voice Intelligence

| # | Feature | MoSCoW | Effort | Priority | Rationale |
|---|---------|--------|--------|----------|-----------|
| 18 | Stylometric corpus analysis | Should Have | 16h | **Strategic Bet** | The core voice intelligence capability. 6 stylometric signals (sentence length variance, TTR, hedging frequency, cliche density, em-dash frequency, paragraph rhythm). Without this, the entire Voice Intelligence layer is inactive. Already planned in VI-001. |
| 19 | AI vs human classification | Should Have | 4h | **Easy Add** | Classification engine using the 6 stylometric signals with thresholds (HUMAN < 0.35, HYBRID 0.35-0.65, AI > 0.65). Included in VI-001. MEDIUM value -- helps filter corpus for persona generation. |
| 20 | Writer clustering | Could Have | 12h | **Strategic Bet** | HDBSCAN clustering on 12-dimension feature vectors to discover distinct writer voices. Technical risk (pure JS implementation). HIGH value -- enables multi-persona support without manual voice definition. Already planned in VI-002. |
| 21 | Voice profile generation | Should Have | 3h | **Quick Win** | Transform cluster centroids into structured persona profiles (voice DNA). Straightforward data transformation. Included in VI-002. HIGH value -- produces the artifact that the draft-writer consumes. |
| 22 | Voice analyzer agent (markdown) | Should Have | 4h | **Easy Add** | Markdown agent that refines raw cluster data into polished voice profiles. Already planned in VI-003. MEDIUM value -- improves profile quality over pure algorithmic output. |

**Service 9 Total: 5 features, ~39h**

---

## Service 10: Quality Gate

| # | Feature | MoSCoW | Effort | Priority | Rationale |
|---|---------|--------|--------|----------|-----------|
| 29 | Readability analysis (Flesch-Kincaid) | Should Have | 2h | **Quick Win** | Standard readability formula. Port from old-seo-blog-checker. Already included in QG-001 as part of the 60-point checklist (one of the 60 items). LOW effort, HIGH value for content quality visibility. |
| 30 | Heading hierarchy validation | Should Have | 1h | **Quick Win** | H1 -> H2 -> H3 enforcement. Simple tree-walk algorithm. Already included in QG-001. LOW effort. |
| 31 | Keyword density enforcement | Should Have | 1h | **Quick Win** | Target keyword density range (1-3%). Simple word frequency calculation. Already included in QG-001. LOW effort. |
| 32 | Meta tag optimization | Should Have | 1h | **Quick Win** | Title length (50-60 chars), description length (120-160 chars), og:image presence. Simple string checks. Already included in QG-001. LOW effort. |
| 33 | Internal link analysis | Should Have | 2h | **Quick Win** | Count internal links, check for orphan pages, validate link targets. Already included in QG-001. LOW effort. |
| 34 | Image optimization scoring | Should Have | 2h | **Quick Win** | Alt text presence/quality, image count, image-to-text ratio, file format checks. Already included in QG-001. LOW effort. |
| 35 | Voice match scoring | Should Have | 4h | **Easy Add** | Compute stylometric distance between generated article and target persona. Requires VI-003 voice profile data. Contributes 15% to 7-signal scoring rubric. MEDIUM effort, HIGH value for voice-aware quality enforcement. |
| 36 | AI detection scoring | Should Have | 4h | **Easy Add** | Run the same 6-signal classifier (VI-001) against generated articles to produce an AI detection risk score. Contributes 15% to 7-signal scoring rubric. MEDIUM effort, HIGH value for anti-slop enforcement. |
| 37 | Topical completeness vs competitors | Should Have | 8h | **Strategic Bet** | Compare article's topic coverage against top-ranking competitor articles. Requires SERP scraping or Semrush SERP features data. Contributes 20% to 7-signal scoring rubric. HIGH effort, HIGH value. |
| 38 | Arabic/RTL validation | Should Have | 4h | **Quick Win** | Validate Arabic-specific quality rules: RTL heading direction, Arabic typography, mixed-direction text handling, morphological keyword matching. MEDIUM effort, HIGH value for MENA clients (core market). |
| 39 | Schema markup validation | Could Have | 4h | **Easy Add** | Validate JSON-LD structured data (Article, FAQ, HowTo, Breadcrumb). Check against schema.org vocabulary. MEDIUM effort, MEDIUM value -- improves rich snippet eligibility. |
| 40 | Featured snippet optimization | Could Have | 6h | **Easy Add** | Analyze article structure for featured snippet eligibility (definition paragraphs, list formatting, table formatting, concise answers). MEDIUM effort, HIGH value for SERP visibility. |
| 41 | PAA targeting | Could Have | 6h | **Easy Add** | Identify "People Also Ask" questions for the target keyword and verify the article addresses them. Requires SERP data (from Semrush or scraping). MEDIUM effort, MEDIUM value. |
| 42 | TF-IDF semantic analysis | Could Have | 12h | **Strategic Bet** | Compute TF-IDF vectors for topic relevance scoring. Compare against corpus average. Requires document corpus and vector math. HIGH effort, MEDIUM value -- mostly valuable for enterprise clients with large corpora. |
| 43 | Entity salience scoring | Could Have | 12h | **Moonshot** | Score entity prominence using NLP entity extraction. Requires NLP pipeline (either cloud API or local model). HIGH effort, UNCERTAIN value -- Google's entity-first indexing makes this potentially valuable but hard to calibrate. |
| 44 | Bulk article scoring | Could Have | 4h | **Easy Add** | Score multiple articles in batch. Queue-based processing with progress tracking. LOW effort, HIGH value for agencies scoring entire content portfolios. |
| 45 | Quality trend tracking | Could Have | 6h | **Easy Add** | Track quality scores over time per article and per client. Line charts showing score evolution after edits/revisions. MEDIUM effort, MEDIUM value for quality improvement visibility. |
| 46 | Actionable fix suggestions | Should Have | 2h | **Quick Win** | Generate specific, actionable improvement instructions for each failed checklist item. Already included in QG-001.4 (suggestion generator). LOW effort, HIGH value. |

**Service 10 Total: 18 features, ~79h**

---

## Service 11: Publishing

| # | Feature | MoSCoW | Effort | Priority | Rationale |
|---|---------|--------|--------|----------|-----------|
| 54 | Category/tag mapping | Should Have | 2h | **Quick Win** | Map ChainIQ taxonomy to CMS taxonomy. wp_set_post_categories() + wp_set_post_tags(). Already included in PB-002.4. LOW effort. |
| 55 | Shopify app (Blog API) | Should Have | 12h | **Strategic Bet** | Shopify Blog Article API publishing with product awareness. Already planned in PB-003. HIGH value -- Shopify is the second-largest CMS market after WordPress. |
| 56 | Ghost adapter | Should Have | 2h | **Easy Add** | Ghost Admin API with JWT auth (HMAC-SHA256). Follows adapter base class pattern from PB-004. LOW effort after base class is built. |
| 57 | Generic webhook publisher | Should Have | 1.5h | **Quick Win** | POST full payload to user-configured URL with HMAC-SHA256 signature. Already included in PB-004.7. LOW effort, HIGH value as escape valve for unsupported CMS. |
| 58 | Publish scheduling | Should Have | 4h | **Easy Add** | Schedule future publish date. Map to WP post_date / Shopify published_at / Ghost published_at. MEDIUM effort, HIGH value for editorial calendar workflow. |
| 59 | Bulk publishing | Should Have | 8h | **Easy Add** | Queue-based multi-article publishing with progress tracking. Requires job queue and rate limiting per CMS. MEDIUM effort, HIGH value for agencies publishing 10+ articles at once. |
| 60 | Version control (generated vs published) | Should Have | 6h | **Easy Add** | Track generated version vs CMS-published version. Diff view on article detail page. MEDIUM effort, MEDIUM value for editorial auditability. |
| 61 | CMS connection health monitoring | Should Have | 4h | **Quick Win** | Periodic health check for connected CMS platforms. Test API connectivity, check authentication validity. Already partially included in publish dashboard platform cards. |
| 62 | Contentful adapter | Could Have | 2h | **Easy Add** | Contentful Management API with Rich Text mapping. Follows adapter pattern. LOW effort after base class. |
| 63 | Strapi adapter | Could Have | 2h | **Easy Add** | Strapi REST API with configurable field mapping. Follows adapter pattern. LOW effort after base class. |
| 64 | Webflow adapter | Could Have | 2h | **Easy Add** | Webflow CMS Collection Item API. Follows adapter pattern. LOW effort after base class. |
| 65 | Sanity adapter | Could Have | 1.5h | **Easy Add** | Sanity Mutations API with Portable Text conversion. Follows adapter pattern. Portable Text conversion is the hardest part. |
| 66 | Edit-after-publish sync | Could Have | 12h | **Strategic Bet** | Sync edits made in ChainIQ back to the CMS (and optionally vice versa). Requires bidirectional change detection and conflict resolution. HIGH effort, MEDIUM value. |
| 67 | Multi-site syndication | Could Have | 16h | **Moonshot** | Publish same article to multiple CMS platforms simultaneously. Requires cross-platform deduplication strategy and canonical URL management. HIGH effort, UNCERTAIN value -- risk of duplicate content penalties if not handled correctly. |
| 68 | A/B headline testing via CMS | Won't Have | 24h | **Moonshot** | Requires CMS-level A/B testing infrastructure. Most CMS platforms do not natively support headline variants. Would need custom plugin/app for each platform. VERY HIGH effort, LOW value at current scale. CORRECTLY DEFERRED. |
| 69 | SEO plugin compatibility layer | Should Have | 4h | **Easy Add** | Abstraction layer for Yoast, RankMath, All-in-One SEO, SEOPress. Currently hardcoded to Yoast + RankMath in PB-002.5. Extending to other SEO plugins is straightforward (different meta key prefixes). |
| 70 | Featured image auto-set | Must Have | -- | N/A | Already classified as Must Have and included in PB-002.4. Not a nice-to-have. |

**Service 11 Total: 15 features (excluding #70 Must Have), ~103h**

---

## Service 12: Feedback Loop

| # | Feature | MoSCoW | Effort | Priority | Rationale |
|---|---------|--------|--------|----------|-----------|
| 75 | Scoring weight recalibration | Should Have | 10h | **Strategic Bet** | The compounding moat. Adjusts recommendation scoring weights based on measured outcomes. Already planned in FL-002. HIGH value -- this is what makes the "gets smarter over time" claim true. |
| 76 | Content ROI calculation | Should Have | 6h | **Quick Win** | Calculate (traffic value - generation cost) / generation cost per article. Requires CPC data (from Semrush or estimated). HIGH value for agency ROI reporting. |
| 78 | Automated performance alerts | Should Have | 4h | **Quick Win** | Trigger alerts when article performance drops below prediction threshold. Email/webhook notification. Uses existing decay detection patterns. LOW effort, HIGH value. |
| 79 | Content lifecycle status | Should Have | -- | N/A | Already classified as Must Have (#79 in MoSCoW) and included in CI-001 (decay detector). Status mapping is HEALTHY/DECAYING/DECLINING/DEAD. |
| 80 | Keyword position tracking | Should Have | -- | N/A | Already classified as Must Have (#80 in MoSCoW) and included in DI-002 (GSC connector) and CI-001 (position trend). |
| 82 | Churn prediction | Should Have | 12h | **Strategic Bet** | Predict which articles will lose traffic based on historical patterns, competitive movement, and content age. Requires ML-like scoring model. HIGH effort, HIGH value for proactive content management. |
| 83 | Historical baseline comparison | Should Have | 4h | **Easy Add** | Compare current performance against historical baselines (pre-optimization vs post-optimization). Requires snapshot storage and diff calculations. MEDIUM effort, HIGH value for proving optimization impact. |
| 86 | Seasonal adjustment | Could Have | 8h | **Easy Add** | Adjust accuracy scoring to account for seasonal traffic patterns. A ski equipment article should not be penalized for low 30-day performance when measured in July. Requires Google Trends integration or historical pattern detection. |
| 87 | Competitor movement tracking | Could Have | 16h | **Strategic Bet** | Track competitor content changes and ranking shifts. Requires competitor site crawling or Semrush/Ahrefs competitor data. HIGH effort, HIGH value for competitive intelligence. |
| 88 | Backlink acquisition tracking | Could Have | 12h | **Strategic Bet** | Track new backlinks to published articles over time. Requires Ahrefs API integration (backlink index). MEDIUM effort, MEDIUM value -- backlinks are a ranking factor but tracking them is secondary to content quality. |
| 90 | A/B headline performance | Won't Have | -- | N/A | Depends on #68 (A/B headline testing) which is Won't Have. CORRECTLY DEFERRED. |
| 91 | Content calendar ROI | Could Have | 12h | **Strategic Bet** | Already listed under Service 5 (Analytics). Duplicate -- resolve at backlog level. |
| 92 | Recommendation accuracy leaderboard | Could Have | 6h | **Easy Add** | Rank which types of recommendations (gap, decay, seasonal, etc.) produce the most accurate predictions. Aggregation query on performance_predictions grouped by opportunity_type. LOW effort, HIGH value for strategic insight. |
| 93 | Auto-refresh triggers | Could Have | 8h | **Easy Add** | Automatically recommend content refreshes when performance drops below threshold. Combines decay detection (CI-001) with feedback loop data (FL-001). Creates a closed loop: detect decay -> recommend refresh -> generate updated content -> track improvement. MEDIUM effort, HIGH value for automation. |

**Service 12 Total: 11 features (excluding Must Haves and Won't Haves), ~98h**

---

## Summary by Priority Classification

### Quick Wins (Low effort, High value) -- DO FIRST

| # | Feature | Service | Effort | Phase |
|---|---------|---------|--------|-------|
| 10 | Content inventory page | Dashboard API | 5h | A/S3 |
| 29 | Readability analysis | Quality Gate | 2h | A/S3 (included in QG-001) |
| 30 | Heading hierarchy | Quality Gate | 1h | A/S3 (included in QG-001) |
| 31 | Keyword density | Quality Gate | 1h | A/S3 (included in QG-001) |
| 32 | Meta tag optimization | Quality Gate | 1h | A/S3 (included in QG-001) |
| 33 | Internal link analysis | Quality Gate | 2h | A/S3 (included in QG-001) |
| 34 | Image optimization | Quality Gate | 2h | A/S3 (included in QG-001) |
| 38 | Arabic/RTL validation | Quality Gate | 4h | C |
| 46 | Actionable fix suggestions | Quality Gate | 2h | A/S3 (included in QG-001) |
| 54 | Category/tag mapping | Publishing | 2h | B/S8 (included in PB-002) |
| 57 | Generic webhook | Publishing | 1.5h | B/S9 (included in PB-004) |
| 61 | CMS health monitoring | Publishing | 4h | B/S9 |
| 76 | Content ROI calculation | Feedback Loop | 6h | D |
| 77 | Client-facing reports | Dashboard API | 6h | D |
| 78 | Automated alerts | Feedback Loop | 4h | D |
| 85 | Performance dashboard | Dashboard API | 8h | D/S10 |

**Quick Win Total: 16 features, ~52h**
**Note:** Many Quick Wins are already included in the current sprint plan as sub-tasks of larger tasks.

---

### Easy Adds (Low effort, Moderate value) -- DO AFTER QUICK WINS

| # | Feature | Service | Effort | Phase |
|---|---------|---------|--------|-------|
| 4 | Semrush API client | Data Ingestion | 3h | B/S5 |
| 5 | Ahrefs API client | Data Ingestion | 3h | B/S5 |
| 6 | Google Trends curves | Data Ingestion | 8h | D/E |
| 19 | AI vs human classification | Voice Intelligence | 4h | C/S6 (included in VI-001) |
| 22 | Voice analyzer agent | Voice Intelligence | 4h | C/S7 (included in VI-003) |
| 35 | Voice match scoring | Quality Gate | 4h | C |
| 36 | AI detection scoring | Quality Gate | 4h | C |
| 39 | Schema markup validation | Quality Gate | 4h | D |
| 40 | Featured snippet optimization | Quality Gate | 6h | D |
| 41 | PAA targeting | Quality Gate | 6h | D |
| 44 | Bulk article scoring | Quality Gate | 4h | D |
| 45 | Quality trend tracking | Quality Gate | 6h | D |
| 56 | Ghost adapter | Publishing | 2h | C/S9 (included in PB-004) |
| 58 | Publish scheduling | Publishing | 4h | C |
| 59 | Bulk publishing | Publishing | 8h | C |
| 60 | Version control | Publishing | 6h | C |
| 62 | Contentful adapter | Publishing | 2h | E/S9 (included in PB-004) |
| 63 | Strapi adapter | Publishing | 2h | E/S9 (included in PB-004) |
| 64 | Webflow adapter | Publishing | 2h | E/S9 (included in PB-004) |
| 65 | Sanity adapter | Publishing | 1.5h | E/S9 (included in PB-004) |
| 69 | SEO plugin compat layer | Publishing | 4h | C |
| 83 | Historical baseline | Feedback Loop | 4h | D |
| 86 | Seasonal adjustment | Feedback Loop | 8h | D |
| 92 | Accuracy leaderboard | Feedback Loop | 6h | D |
| 93 | Auto-refresh triggers | Feedback Loop | 8h | D |

**Easy Add Total: 25 features, ~113h**
**Note:** Many Easy Adds are already planned in the sprint timeline as part of existing tasks.

---

### Strategic Bets (High effort, High value) -- PLAN CAREFULLY

| # | Feature | Service | Effort | Phase |
|---|---------|---------|--------|-------|
| 15 | Seasonality planning | Content Intelligence | 16h | D |
| 16 | Saturation scoring | Content Intelligence | 12h | D |
| 17 | Opportunities page | Dashboard API | 12h | B/S6 |
| 18 | Stylometric corpus | Voice Intelligence | 16h | C/S6 |
| 20 | Writer clustering | Voice Intelligence | 12h | C/S6 |
| 23 | Voice profiles page | Dashboard API | 10h | C/S7 |
| 24 | Style cloning | Article Pipeline | 8h | C/S7 |
| 37 | Topical completeness | Quality Gate | 8h | C |
| 48 | Quality report page | Dashboard API | 12h | B/S5 |
| 55 | Shopify app | Publishing | 12h | C/S8 |
| 66 | Edit-after-publish sync | Publishing | 12h | D |
| 75 | Weight recalibration | Feedback Loop | 10h | D/S10 |
| 81 | Portfolio analytics | Analytics | 12h | D |
| 82 | Churn prediction | Feedback Loop | 12h | D |
| 87 | Competitor movement | Feedback Loop | 16h | E |
| 88 | Backlink tracking | Feedback Loop | 12h | E |
| 91 | Content calendar ROI | Analytics | 12h | D |

**Strategic Bet Total: 17 features, ~204h**

---

### Moonshots (High effort, Uncertain value) -- RESEARCH FIRST

| # | Feature | Service | Effort | Phase |
|---|---------|---------|--------|-------|
| 42 | TF-IDF semantic analysis | Quality Gate | 12h | E |
| 43 | Entity salience scoring | Quality Gate | 12h | E |
| 67 | Multi-site syndication | Publishing | 16h | E |
| 68 | A/B headline testing | Publishing | 24h | Won't Have |
| 89 | Conversion attribution | Analytics | 20h | E |

**Moonshot Total: 5 features, ~84h**

---

## Effort Summary

| Category | Features | Total Effort | Recommendation |
|----------|----------|-------------|----------------|
| Quick Wins | 16 | ~52h | Most already in sprint plan. Execute within current phases. |
| Easy Adds | 25 | ~113h | Many already in sprint plan. Remainder fits in Phase C/D. |
| Strategic Bets | 17 | ~204h | Core of Phases C and D. Schedule after SRMG pilot validates core. |
| Moonshots | 5 | ~84h | Phase E candidates. Research feasibility before committing. |
| **Total** | **63** | **~453h** | Full backlog exceeds 20-week timeline by ~133h. Prioritize Quick Wins + Easy Adds first. |

---

## Implementation Priority Order (Top 10 Nice-to-Haves)

If choosing which nice-to-haves to pursue first after the 26 Must-Haves are complete:

| Rank | # | Feature | Effort | Why First |
|------|---|---------|--------|-----------|
| 1 | 18 | Stylometric corpus analysis | 16h | Unlocks entire Voice Intelligence layer. No voice without this. |
| 2 | 75 | Scoring weight recalibration | 10h | Creates the compounding data moat. Sales differentiator. |
| 3 | 55 | Shopify app | 12h | Second-largest CMS market. Doubles addressable market. |
| 4 | 24 | Style cloning for draft-writer | 8h | Connects voice analysis to generation. The "anti-slop" thesis. |
| 5 | 17 | Opportunities dashboard page | 12h | Primary surface for intelligence output. No UI = no value visible. |
| 6 | 48 | Quality report page | 12h | Quality visibility is a key selling point. |
| 7 | 76 | Content ROI calculation | 6h | Agency clients need ROI proof for retention meetings. |
| 8 | 77 | Client-facing reports | 6h | Marcus persona's top need: reports for client meetings. |
| 9 | 82 | Churn prediction | 12h | Proactive content management. Differentiator from reactive tools. |
| 10 | 37 | Topical completeness vs competitors | 8h | Direct competitor to Clearscope/MarketMuse core feature. |

**Top 10 Total: ~102h (approximately 5 additional sprints at solo-dev pace)**
