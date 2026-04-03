# Tribunal Round 4 -- Final Prioritization & MoSCoW Verdict

**Date:** 2026-03-28
**Moderator:** ChainIQ Product Tribunal
**Status:** BINDING VERDICT
**Input:** feature-gap-matrix.md (93 features), Round 3 consensus (Foundation -> Vertical Slice -> Widen)
**Output:** Complete MoSCoW classification, phase assignment, and roadmap vote

---

## Preamble

This round classifies every feature from the feature-gap-matrix.md into MoSCoW categories and assigns Must Have and Should Have features to development phases. The phase structure from Round 3 is refined into five phases:

| Phase | Weeks | Theme | Round 3 Alignment |
|-------|-------|-------|-------------------|
| **A** | 1-6 | Foundation + Data Core | Weeks 1-6: Foundation, GSC/GA4, intelligence core |
| **B** | 7-14 | Intelligence + Quality Gate | Weeks 7-10: Vertical slice completion + early widening |
| **C** | 15-22 | Voice & Publishing | Weeks 11-17: Voice pipeline, WordPress plugin, CMS adapters |
| **D** | 23-30 | Feedback & Polish | Weeks 18-22+: Feedback loop, recalibration, performance dashboard |
| **E** | 31+ | Enterprise | Advanced analytics, multi-tenant polish, white-label, API marketplace |

---

## MoSCoW Classification -- All 93 Features

### Legend

- **Effort:** S (<1 week), M (1-2 weeks), L (2-4 weeks), XL (4+ weeks)
- **Persona Votes:** Number of personas (out of 10) who scored the parent feature area 7+
- **Dependencies:** Feature numbers that must be complete before this feature can start

---

### Layer 1: Data Ingestion

| # | Feature | Layer | MoSCoW | Phase | Effort | Dependencies | Persona Votes | Rationale |
|---|---------|-------|--------|-------|--------|-------------|---------------|-----------|
| 1 | Google OAuth2 flow (auth URL, token exchange, refresh) | Ingestion | **Must Have** | A | L | None | 8/10 | Gates all Google data. Critical path item #4. Without this, Layers 2, 4, 5, 6 are blocked. |
| 2 | GSC Search Analytics API client | Ingestion | **Must Have** | A | L | 1 | 8/10 | Table stakes (9/9 competitors have it). Core data source for decay detection, gap analysis, and performance tracking. |
| 3 | GA4 Reporting API client | Ingestion | **Must Have** | A | L | 1 | 8/10 | Required for ROI calculation, engagement metrics, and conversion attribution. 4/9 competitors have it. |
| 4 | Semrush API client (keyword research, gap, SERP features) | Ingestion | **Should Have** | B | L | None | 8/10 | Unique differentiator: only Semrush itself offers Semrush data. Enhances gap analysis significantly. |
| 5 | Ahrefs API client (backlinks, DR, keyword explorer) | Ingestion | **Should Have** | B | L | None | 8/10 | Unique differentiator: only Ahrefs itself offers Ahrefs data. Backlink intelligence is a competitive advantage. |
| 6 | Google Trends seasonal curves | Ingestion | **Could Have** | D | M | None | 8/10 | White space (0/9 competitors). Enhances seasonality planning but not required for core intelligence. |
| 7 | HTTP content crawler (content inventory) | Ingestion | **Must Have** | A | L | None | 8/10 | Intelligence layer needs a map of existing content. Port from old-seo-blog-checker. |
| 8 | Ingestion scheduler (daily/weekly pulls) | Ingestion | **Must Have** | A | M | 1, 2, 3 | 8/10 | Without scheduled pulls, data goes stale. Architecture risk #8 (silent scheduler failure). |
| 9 | Connections dashboard page (OAuth flow, status) | Ingestion | **Must Have** | A | M | 1 | 8/10 | Users must connect their accounts. Client-facing entry point for SRMG demo. |
| 10 | Content inventory dashboard page | Ingestion | **Should Have** | B | L | 7 | 8/10 | Shows all discovered URLs with metrics. Required for the SRMG demo vertical slice. |

### Layer 2: Content Intelligence

| # | Feature | Layer | MoSCoW | Phase | Effort | Dependencies | Persona Votes | Rationale |
|---|---------|-------|--------|-------|--------|-------------|---------------|-----------|
| 11 | Decay detection engine | Intelligence | **Must Have** | A | L | 2, 7 | 9/10 | Most tangible intelligence output. Port from Master Kit 36-seo. Shows immediate value to SRMG. |
| 12 | Keyword gap analyzer | Intelligence | **Must Have** | A | L | 2 | 9/10 | Second most tangible intelligence output. "Your competitors rank for X and you do not." |
| 13 | URL cannibalization detection | Intelligence | **Must Have** | B | M | 2 | 9/10 | Port from Master Kit 36-seo. 4 resolution strategies. Common pain point for large publishers. |
| 14 | Topic recommender agent | Intelligence | **Must Have** | B | L | 11, 12 | 9/10 | The "what to write next" engine. Primary reason 4 personas would buy. Core value proposition. |
| 15 | Seasonality planning | Intelligence | **Could Have** | D | L | 6 | 9/10 | White space (0/9 competitors). Depends on Google Trends integration. Enhances but does not gate recommendations. |
| 16 | Saturation scoring | Intelligence | **Could Have** | D | L | 4, 5 | 9/10 | White space (0/9 competitors). Topic competitive density. Requires Semrush/Ahrefs data for accuracy. |
| 17 | Opportunities dashboard page | Intelligence | **Should Have** | B | L | 11, 12, 13, 14 | 9/10 | Gap analysis, cannibalization warnings, scored recommendations. The intelligence layer's face. |

### Layer 3: Voice Intelligence

| # | Feature | Layer | MoSCoW | Phase | Effort | Dependencies | Persona Votes | Rationale |
|---|---------|-------|--------|-------|--------|-------------|---------------|-----------|
| 18 | Stylometric corpus analysis | Voice | **Should Have** | C | XL | 7 | 7/10 | ChainIQ's strongest differentiator. 0/9 competitors have true writer fingerprinting. High effort but high moat value. |
| 19 | AI vs human classification | Voice | **Should Have** | C | L | 18 | 7/10 | Separates AI-generated content from human-written in existing corpus. Architecture risk #9 (accuracy on short articles). |
| 20 | Writer clustering | Voice | **Could Have** | C | L | 18 | 7/10 | Groups articles by author style. k-means MVP first, HDBSCAN upgrade later. |
| 21 | Voice profile generation | Voice | **Should Have** | C | L | 18 | 7/10 | Structured profile JSON for draft-writer consumption. Required for voice-matched generation. |
| 22 | Voice analyzer agent (markdown) | Voice | **Should Have** | C | M | 18, 21 | 7/10 | Takes corpus analysis output, generates readable profile. Agent-based architecture consistent with pipeline. |
| 23 | Voice profiles dashboard page | Voice | **Should Have** | C | M | 21 | 7/10 | Detected writers, persona editing, default selection. Required for editorial teams to review and approve voices. |
| 24 | Style cloning for draft-writer | Voice | **Should Have** | C | L | 21 | 7/10 | Draft-writer accepts voice profile as style constraint. The feature that turns detection into generation. |

### Layer 4: Quality Assurance & SEO Scoring

| # | Feature | Layer | MoSCoW | Phase | Effort | Dependencies | Persona Votes | Rationale |
|---|---------|-------|--------|-------|--------|-------------|---------------|-----------|
| 25 | 60-point SEO checklist engine | Quality | **Must Have** | B | M | None | 9/10 | Port from old-seo-blog-checker. 8 categories, 60 checks. Foundation for quality scoring. |
| 26 | 7-signal weighted scoring | Quality | **Must Have** | B | L | 25 | 9/10 | Composite score: E-E-A-T, completeness, voice, AI detection, freshness, technical, readability. The quality gate's brain. |
| 27 | E-E-A-T 10-dimension rubric | Quality | **Must Have** | B | M | None | 9/10 | LLM-based evaluation. 30-point scale. Google's quality guidelines made measurable. |
| 28 | Auto-revision loop (max 2 passes) | Quality | **Must Have** | B | L | 25, 26 | 9/10 | Re-invoke draft-writer with fix instructions. The feature that turns ChainIQ from "generates content" to "generates GOOD content." Feature-gap-matrix #1 priority gap. |
| 29 | Readability analysis (Flesch-Kincaid) | Quality | **Should Have** | B | S | None | 9/10 | FK grade, paragraph length, sentence variance. Quick win -- 30 lines of code. |
| 30 | Heading hierarchy validation | Quality | **Should Have** | B | S | None | 9/10 | H1 count, H2/H3 counts, nesting, keyword inclusion. Quick win. |
| 31 | Keyword density enforcement | Quality | **Should Have** | B | S | None | 9/10 | Primary 8-15x, 2.5% max, LSI 15-25. Quick win. |
| 32 | Meta tag optimization | Quality | **Should Have** | B | S | None | 9/10 | Title 50-60 chars, meta desc 145-154 chars. Quick win. |
| 33 | Internal link analysis | Quality | **Should Have** | B | S | None | 9/10 | 8-12 links, relevant anchors, early placement. Quick win. |
| 34 | Image optimization scoring | Quality | **Should Have** | B | S | None | 9/10 | Alt text, file names, featured image, count >= 4. Quick win. |
| 35 | Voice match scoring | Quality | **Should Have** | C | M | 18, 21 | 7/10 | Stylometric distance from target persona. Depends on Voice Intelligence layer. |
| 36 | AI detection scoring | Quality | **Should Have** | C | M | None | 7/10 | Sentence variance, vocabulary diversity, cliche density. Increasingly important as AI content detection tightens. |
| 37 | Topical completeness vs competitors | Quality | **Should Have** | C | L | 2, 7 | 9/10 | Coverage vs top 5 SERP competitors. Requires GSC data and content inventory. |
| 38 | Arabic/RTL validation | Quality | **Should Have** | C | M | None | 7/10 | Unicode range, dir attribute, Arabic fonts, RTL alignment. Critical for MENA market. |
| 39 | Schema markup validation | Quality | **Could Have** | D | S | None | 9/10 | Article, FAQ, HowTo, BreadcrumbList schema. Nice enhancement, not core quality gate. |
| 40 | Featured snippet optimization | Quality | **Could Have** | D | M | None | 9/10 | Quick answer box format, snippet targeting. Enhances SERP visibility guidance. |
| 41 | PAA targeting | Quality | **Could Have** | D | M | None | 9/10 | FAQ section maps to SERP PAA questions. Useful but not blocking. |
| 42 | TF-IDF semantic analysis | Quality | **Could Have** | E | L | None | 9/10 | Term frequency against SERP corpus. Advanced NLP, high effort for marginal gain over keyword density. |
| 43 | Entity salience scoring | Quality | **Could Have** | E | L | None | 9/10 | Named entity recognition and prominence. Research-grade feature. |
| 44 | Bulk article scoring | Quality | **Could Have** | D | M | 25, 26 | 9/10 | Score multiple articles in batch. Agency use case. |
| 45 | Quality trend tracking | Quality | **Could Have** | D | M | 25, 26 | 9/10 | Scores over time, regression detection. Valuable but not launch-critical. |
| 46 | Actionable fix suggestions | Quality | **Should Have** | B | M | 25 | 9/10 | Port from old-seo-blog-checker. Tells the user (and auto-revision loop) exactly what to fix. |
| 47 | Quality score API endpoint | Quality | **Must Have** | B | S | 25, 26 | 9/10 | `/api/quality/score` returns full breakdown. Required for auto-revision loop and publishing gate. |
| 48 | Dashboard quality report tab | Quality | **Should Have** | B | M | 25, 26, 47 | 9/10 | Per-article score visualization, pass/fail per signal. The quality gate's user interface. |

### Layer 5: Universal Publishing

| # | Feature | Layer | MoSCoW | Phase | Effort | Dependencies | Persona Votes | Rationale |
|---|---------|-------|--------|-------|--------|-------------|---------------|-----------|
| 49 | Universal Article Payload format | Publishing | **Must Have** | B | M | None | 8/10 | Canonical JSON: title, body, meta, images, taxonomy, schema. Abstraction layer that all CMS adapters consume. |
| 50 | WordPress plugin (wp_insert_post) | Publishing | **Must Have** | B | L | 49 | 8/10 | WordPress powers 43% of the web. 7/9 competitors have WordPress integration. SRMG demo requirement. |
| 51 | Yoast/RankMath meta auto-fill | Publishing | **Must Have** | B | M | 50 | 8/10 | Detect SEO plugin, set meta title/desc/focus keyphrase. Without this, published articles lack SEO metadata. |
| 52 | Draft-first publishing | Publishing | **Must Have** | B | S | 50 | 8/10 | All articles as drafts. One-click promote. Safety mechanism -- never auto-publish to production. |
| 53 | Image CDN pipeline (CMS media upload) | Publishing | **Must Have** | B | L | 50 | 8/10 | Upload images to CMS media library. Set featured image. Without this, articles publish without images. |
| 54 | Category/tag mapping | Publishing | **Should Have** | B | M | 50 | 8/10 | Map ChainIQ categories to CMS taxonomy. Important for editorial workflow but not blocking. |
| 55 | Shopify app (Blog API) | Publishing | **Should Have** | C | L | 49 | 8/10 | White space (0/9 competitors). Embedded admin app. Critical for P09 (E-Com Marketing Head). |
| 56 | Ghost adapter | Publishing | **Should Have** | C | M | 49 | 8/10 | Ghost Admin API. JWT auth. Serves independent publishers and tech blogs. |
| 57 | Generic webhook publisher | Publishing | **Should Have** | B | M | 49 | 8/10 | POST payload to any URL with HMAC. Covers Zapier/n8n/Make. Cheap to build, high flexibility. |
| 58 | Publish scheduling | Publishing | **Should Have** | C | S | 50 | 8/10 | Future publish date. CMS-native scheduling. Enables editorial calendar workflow. |
| 59 | Bulk publishing | Publishing | **Should Have** | C | M | 50, 52 | 8/10 | Multiple articles, progress tracking. Agency use case (Marcus). |
| 60 | Version control (generated vs published) | Publishing | **Should Have** | C | M | 50 | 8/10 | Track which version is live. Detect CMS-side drift. Important for audit trail. |
| 61 | CMS connection health monitoring | Publishing | **Should Have** | C | S | 50 | 8/10 | Periodic ping, auth failure alerts. Prevents silent publishing failures. |
| 62 | Contentful adapter | Publishing | **Could Have** | E | L | 49 | 6/10 | Management API. Content model mapping. Headless CMS market. |
| 63 | Strapi adapter | Publishing | **Could Have** | E | M | 49 | 6/10 | REST/GraphQL API. Content type mapping. Open-source headless CMS. |
| 64 | Webflow adapter | Publishing | **Could Have** | E | M | 49 | 6/10 | CMS API. Collection field mapping. Designer-focused market. |
| 65 | Sanity adapter | Publishing | **Could Have** | E | M | 49 | 6/10 | Client API. GROQ mutations. Developer-focused headless CMS. |
| 66 | Edit-after-publish sync | Publishing | **Could Have** | D | L | 50, 60 | 8/10 | Re-push updated content. Merge conflict detection. Complex but valuable for content refresh workflows. |
| 67 | Multi-site publishing (syndication) | Publishing | **Could Have** | D | M | 50, 49 | 8/10 | Same article to multiple CMS instances. Agency and enterprise use case. |
| 68 | A/B headline testing via CMS | Publishing | **Won't Have** | -- | L | 50, 71 | 8/10 | Two variants, track CTR, auto-select winner. Requires deep CMS integration and 30+ days of data. Deferred: high effort, niche demand, and the feedback loop must exist first. Better served by dedicated A/B testing tools. |
| 69 | SEO plugin compatibility layer | Publishing | **Should Have** | C | M | 51 | 8/10 | Abstract across Yoast, RankMath, AIOSEO, SEOPress. Phase C because Yoast/RankMath cover 80% of market; broader compat is enhancement. |
| 70 | Featured image auto-set | Publishing | **Must Have** | B | S | 50, 53 | 8/10 | Upload + attach as featured image. Quick win. Articles without featured images look broken in WordPress. |

### Layer 6: Feedback Loop & Performance

| # | Feature | Layer | MoSCoW | Phase | Effort | Dependencies | Persona Votes | Rationale |
|---|---------|-------|--------|-------|--------|-------------|---------------|-----------|
| 71 | 30/60/90 day GSC tracking | Feedback | **Must Have** | B | L | 2, 50 | 9/10 | Pull performance data per article URL post-publish. Starts the feedback loop. Needs 30 days of published articles. |
| 72 | 30/60/90 day GA4 tracking | Feedback | **Must Have** | B | L | 3, 50 | 9/10 | Pull engagement data per article URL post-publish. Complements GSC with behavioral metrics. |
| 73 | Prediction vs actual comparison | Feedback | **Must Have** | D | L | 71, 72, 14 | 9/10 | Compare predictions to snapshots. ChainIQ's most differentiated capability (0/9 competitors). Phase D because it needs 30+ days of data. |
| 74 | Accuracy scoring per article | Feedback | **Must Have** | D | M | 73 | 9/10 | Normalized 0-100 accuracy score. Makes predictions auditable and trustworthy. |
| 75 | Scoring weight recalibration | Feedback | **Should Have** | D | XL | 73, 74 | 9/10 | Statistical model adjusts opportunity weights per client. The compounding moat. Feature-gap-matrix #5 priority. XL effort justified by strategic value. |
| 76 | Content ROI calculation | Feedback | **Should Have** | D | L | 72 | 9/10 | (Traffic value - generation cost) / generation cost. Every persona above $200/month needs to prove ROI. |
| 77 | Client-facing performance reports | Feedback | **Should Have** | D | L | 71, 72, 76 | 9/10 | PDF/HTML reports. Agency white-label. Marcus's clients need to see results. |
| 78 | Automated performance alerts | Feedback | **Should Have** | D | M | 71 | 9/10 | Threshold-based alerts via webhook. "Your article X lost 30% traffic this week." |
| 79 | Content lifecycle status | Feedback | **Should Have** | B | M | 71 | 9/10 | Growing/stable/declining classification. Simple status label with high information value. |
| 80 | Keyword position tracking | Feedback | **Should Have** | B | M | 2 | 9/10 | Daily position per target keyword per article. Foundation for decay detection accuracy. |
| 81 | Portfolio-level analytics | Feedback | **Should Have** | D | L | 71, 72 | 9/10 | Aggregate performance across all articles. Executive dashboard view. |
| 82 | Churn prediction (articles losing traffic) | Feedback | **Should Have** | D | L | 71, 80 | 9/10 | Predict 30-day traffic loss based on decay velocity. Proactive intelligence, not reactive. |
| 83 | Historical baseline comparison | Feedback | **Should Have** | D | M | 71 | 9/10 | Compare to site average for similar content age. Context for interpreting individual article performance. |
| 84 | Performance API endpoints | Feedback | **Must Have** | B | M | 71 | 9/10 | `/api/performance/article/:id`, `/portfolio`, `/predictions`. API layer for all performance features. |
| 85 | Performance dashboard page | Feedback | **Should Have** | D | L | 84, 71, 72 | 9/10 | Charts, reports, alerts, lifecycle view. The feedback loop's user interface. |
| 86 | Seasonal adjustment | Feedback | **Could Have** | E | L | 6, 71 | 9/10 | Normalize for seasonal trends. Depends on Google Trends integration. Prevents false decay alerts during seasonal dips. |
| 87 | Competitor movement tracking | Feedback | **Could Have** | E | L | 4, 5 | 9/10 | Track competitor content/ranking changes. Requires Semrush/Ahrefs data. |
| 88 | Backlink acquisition tracking | Feedback | **Could Have** | E | M | 5 | 9/10 | New backlinks via Ahrefs/Semrush API. Link-building ROI measurement. |
| 89 | Conversion attribution | Feedback | **Could Have** | E | L | 3, 72 | 9/10 | GA4 conversion tracking per article. True revenue attribution. High value but complex GA4 integration. |
| 90 | A/B headline performance | Feedback | **Won't Have** | -- | M | 68, 71 | 9/10 | CTR tracking for headline variants. Depends on A/B headline testing (feature #68, also Won't Have). Same reasoning: better served by dedicated tools. |
| 91 | Content calendar ROI | Feedback | **Could Have** | D | M | 76 | 9/10 | Monthly/quarterly articles vs traffic vs ROI. Executive reporting enhancement. |
| 92 | Recommendation accuracy leaderboard | Feedback | **Could Have** | E | M | 73, 74 | 9/10 | Which recommendation types produce best ROI. Meta-intelligence about the intelligence engine. |
| 93 | Auto-refresh triggers | Feedback | **Could Have** | E | M | 11, 71 | 9/10 | Auto-generate refresh recommendation for declining articles. Closes the decay-to-action loop automatically. |

---

## MoSCoW Summary

| Category | Count | Percentage |
|----------|-------|-----------|
| **Must Have** | 26 | 28.0% |
| **Should Have** | 40 | 43.0% |
| **Could Have** | 25 | 26.9% |
| **Won't Have (for now)** | 2 | 2.2% |
| **Total** | **93** | 100% |

### Must Have Features (26) -- Product is broken without these

**Layer 1 (Ingestion):** #1 OAuth, #2 GSC client, #3 GA4 client, #7 Content crawler, #8 Scheduler, #9 Connections page
**Layer 2 (Intelligence):** #11 Decay detection, #12 Gap analyzer, #14 Topic recommender
**Layer 4 (Quality):** #25 SEO checklist, #26 7-signal scoring, #27 E-E-A-T rubric, #28 Auto-revision loop, #47 Quality API
**Layer 5 (Publishing):** #49 Payload format, #50 WordPress plugin, #51 Yoast/RankMath, #52 Draft-first, #53 Image pipeline, #70 Featured image
**Layer 6 (Feedback):** #71 GSC tracking, #72 GA4 tracking, #73 Prediction vs actual, #74 Accuracy scoring, #84 Performance API

### Won't Have (2) -- Deliberately excluded

**#68 A/B headline testing via CMS:** Requires deep CMS integration for variant switching, client-side tracking infrastructure, and 30+ days minimum test duration per headline. The effort-to-value ratio is poor when dedicated A/B testing tools (Google Optimize successor, VWO, Optimizely) already solve this problem. ChainIQ should generate great headlines, not test mediocre ones.

**#90 A/B headline performance tracking:** Depends on #68. Without the testing mechanism, there is nothing to track. Same reasoning applies.

---

## Phase Allocation Detail

### Phase A (Weeks 1-6): Foundation + Data Core -- 15 features

| # | Feature | Effort | MoSCoW |
|---|---------|--------|--------|
| 1 | Google OAuth2 flow | L | Must Have |
| 2 | GSC Search Analytics API client | L | Must Have |
| 3 | GA4 Reporting API client | L | Must Have |
| 7 | HTTP content crawler | L | Must Have |
| 8 | Ingestion scheduler | M | Must Have |
| 9 | Connections dashboard page | M | Must Have |
| 11 | Decay detection engine | L | Must Have |
| 12 | Keyword gap analyzer | L | Must Have |

**Also in Phase A (foundation work not in feature-gap-matrix):**
- server.js route splitting refactor
- All 6 Supabase DB migrations with multi-tenant RLS
- Hetzner + Coolify deployment
- Cloudflare DNS + SSL
- CORS allowlist + rate limiting
- Design system tokens + base components (card, table)
- Test infrastructure for new modules

**Phase A total effort estimate:** ~6 weeks (solo developer)

### Phase B (Weeks 7-14): Intelligence + Quality Gate + Publishing Core -- 30 features

| # | Feature | Effort | MoSCoW |
|---|---------|--------|--------|
| 4 | Semrush API client | L | Should Have |
| 5 | Ahrefs API client | L | Should Have |
| 10 | Content inventory dashboard | L | Should Have |
| 13 | URL cannibalization detection | M | Must Have |
| 14 | Topic recommender agent | L | Must Have |
| 17 | Opportunities dashboard page | L | Should Have |
| 25 | 60-point SEO checklist | M | Must Have |
| 26 | 7-signal weighted scoring | L | Must Have |
| 27 | E-E-A-T 10-dimension rubric | M | Must Have |
| 28 | Auto-revision loop | L | Must Have |
| 29 | Readability analysis | S | Should Have |
| 30 | Heading hierarchy validation | S | Should Have |
| 31 | Keyword density enforcement | S | Should Have |
| 32 | Meta tag optimization | S | Should Have |
| 33 | Internal link analysis | S | Should Have |
| 34 | Image optimization scoring | S | Should Have |
| 46 | Actionable fix suggestions | M | Should Have |
| 47 | Quality score API endpoint | S | Must Have |
| 48 | Dashboard quality report tab | M | Should Have |
| 49 | Universal Article Payload format | M | Must Have |
| 50 | WordPress plugin | L | Must Have |
| 51 | Yoast/RankMath meta auto-fill | M | Must Have |
| 52 | Draft-first publishing | S | Must Have |
| 53 | Image CDN pipeline | L | Must Have |
| 54 | Category/tag mapping | M | Should Have |
| 57 | Generic webhook publisher | M | Should Have |
| 70 | Featured image auto-set | S | Must Have |
| 71 | 30/60/90 GSC tracking | L | Must Have |
| 72 | 30/60/90 GA4 tracking | L | Must Have |
| 79 | Content lifecycle status | M | Should Have |
| 80 | Keyword position tracking | M | Should Have |
| 84 | Performance API endpoints | M | Must Have |

**Phase B total effort estimate:** ~8 weeks (solo developer). This is the densest phase. The Round 3 consensus acknowledged that Weeks 7-10 complete the vertical slice (quality gate + WordPress + basic feedback tracking) while Weeks 11-14 widen the intelligence layer.

### Phase C (Weeks 15-22): Voice & Publishing Expansion -- 16 features

| # | Feature | Effort | MoSCoW |
|---|---------|--------|--------|
| 18 | Stylometric corpus analysis | XL | Should Have |
| 19 | AI vs human classification | L | Should Have |
| 20 | Writer clustering | L | Could Have |
| 21 | Voice profile generation | L | Should Have |
| 22 | Voice analyzer agent | M | Should Have |
| 23 | Voice profiles dashboard | M | Should Have |
| 24 | Style cloning for draft-writer | L | Should Have |
| 35 | Voice match scoring | M | Should Have |
| 36 | AI detection scoring | M | Should Have |
| 37 | Topical completeness vs competitors | L | Should Have |
| 38 | Arabic/RTL validation | M | Should Have |
| 55 | Shopify app | L | Should Have |
| 56 | Ghost adapter | M | Should Have |
| 58 | Publish scheduling | S | Should Have |
| 59 | Bulk publishing | M | Should Have |
| 60 | Version control | M | Should Have |
| 61 | CMS connection health | S | Should Have |
| 69 | SEO plugin compatibility layer | M | Should Have |

**Phase C total effort estimate:** ~8 weeks (solo developer). Voice Intelligence is the most technically uncertain work -- the stylometric analysis spike should be front-loaded.

### Phase D (Weeks 23-30): Feedback & Polish -- 18 features

| # | Feature | Effort | MoSCoW |
|---|---------|--------|--------|
| 6 | Google Trends seasonal curves | M | Could Have |
| 15 | Seasonality planning | L | Could Have |
| 16 | Saturation scoring | L | Could Have |
| 39 | Schema markup validation | S | Could Have |
| 40 | Featured snippet optimization | M | Could Have |
| 41 | PAA targeting | M | Could Have |
| 44 | Bulk article scoring | M | Could Have |
| 45 | Quality trend tracking | M | Could Have |
| 66 | Edit-after-publish sync | L | Could Have |
| 67 | Multi-site syndication | M | Could Have |
| 73 | Prediction vs actual comparison | L | Must Have |
| 74 | Accuracy scoring per article | M | Must Have |
| 75 | Scoring weight recalibration | XL | Should Have |
| 76 | Content ROI calculation | L | Should Have |
| 77 | Client-facing performance reports | L | Should Have |
| 78 | Automated performance alerts | M | Should Have |
| 81 | Portfolio-level analytics | L | Should Have |
| 82 | Churn prediction | L | Should Have |
| 83 | Historical baseline comparison | M | Should Have |
| 85 | Performance dashboard page | L | Should Have |
| 91 | Content calendar ROI | M | Could Have |

**Phase D total effort estimate:** ~8 weeks (solo developer). This phase benefits from 4+ months of published article data enabling the feedback loop.

### Phase E (Weeks 31+): Enterprise -- 12 features

| # | Feature | Effort | MoSCoW |
|---|---------|--------|--------|
| 42 | TF-IDF semantic analysis | L | Could Have |
| 43 | Entity salience scoring | L | Could Have |
| 62 | Contentful adapter | L | Could Have |
| 63 | Strapi adapter | M | Could Have |
| 64 | Webflow adapter | M | Could Have |
| 65 | Sanity adapter | M | Could Have |
| 86 | Seasonal adjustment | L | Could Have |
| 87 | Competitor movement tracking | L | Could Have |
| 88 | Backlink acquisition tracking | M | Could Have |
| 89 | Conversion attribution | L | Could Have |
| 92 | Recommendation accuracy leaderboard | M | Could Have |
| 93 | Auto-refresh triggers | M | Could Have |

**Phase E total effort estimate:** ~10+ weeks. These are expansion features that build on the mature platform.

---

## Dependency Chain -- Critical Path

```
Phase A: OAuth (#1) --> GSC (#2) --> Decay (#11) + Gap (#12)
         OAuth (#1) --> GA4 (#3)
         Crawler (#7) --> Inventory
         [Foundation: route split, DB, Hetzner, design tokens]

Phase B: Decay (#11) + Gap (#12) --> Recommender (#14) --> Opportunities page (#17)
         SEO checklist (#25) --> Scoring (#26) --> Auto-revision (#28)
         Payload format (#49) --> WordPress (#50) --> Yoast (#51) + Images (#53)
         GSC (#2) + Published articles --> GSC tracking (#71)
         GA4 (#3) + Published articles --> GA4 tracking (#72)

Phase C: Crawler (#7) --> Stylometrics (#18) --> Profiles (#21) --> Cloning (#24)
         Payload (#49) --> Shopify (#55), Ghost (#56)

Phase D: GSC tracking (#71) + GA4 tracking (#72) --> Prediction comparison (#73)
         Prediction (#73) --> Accuracy (#74) --> Recalibration (#75)

Phase E: Semrush/Ahrefs (#4, #5) --> Competitor tracking (#87)
         GA4 tracking (#72) --> Conversion attribution (#89)
```

---

## Roadmap Vote

### Voting Panel

**10 Personas:**
| ID | Persona | Vote | Notes |
|----|---------|------|-------|
| P01 | Enterprise SEO Director | **Yes** | "Phase A-B cover my critical needs: GSC integration, decay detection, gap analysis. Recalibration in Phase D is later than I would like but I understand the data dependency." |
| P02 | Agency Owner (Marcus) | **Yes, with reservations** | "Multi-workspace support is not explicitly a feature in the 93-item list. The multi-tenant RLS is architectural, not user-facing. I need a workspace switcher UI by Phase B at the latest." |
| P03 | Content Ops Manager | **Yes** | "WordPress plugin in Phase B and Shopify in Phase C covers my CMS needs. Content lifecycle status in Phase B is exactly what I need for editorial workflow." |
| P04 | Editorial Lead (Nadia) | **Yes, with reservations** | "Arabic/RTL validation is Phase C (Week 15+). My Arabic writers need this sooner. Can the basic RTL CSS and Arabic font loading be pulled into Phase A with the design system?" |
| P05 | VP Marketing | **Yes** | "Content ROI calculation in Phase D gives me the business case I need. I wish it were sooner but I understand it needs published article data first." |
| P06 | SEO Consultant | **Yes** | "GSC integration and decay detection in Phase A are my top two needs. The Creator tier features are well-served by Phases A-B." |
| P07 | CTO/Tech Lead | **Yes** | "The architecture-first approach (route splitting, RLS, deployment before features) is correct. Performance API in Phase B gives me what I need for integration." |
| P08 | Agency Strategist | **Yes** | "Voice intelligence in Phase C is appropriate. I can use manual voice profiles for the first 14 weeks. The full stylometric pipeline is worth waiting for." |
| P09 | E-Com Marketing Head | **Yes, with reservations** | "Shopify app in Phase C means I wait 15+ weeks. My Shopify Plus store needs content now. Can the generic webhook publisher (#57, Phase B) serve as a bridge until the native app ships?" |
| P10 | Solo Blogger | **Yes** | "WordPress plugin + quality gate in Phase B is exactly what I need. Performance tracking starts in Phase B too. This covers the Creator tier well." |

**5 Technical Experts:**
| ID | Expert | Vote | Notes |
|----|--------|------|-------|
| T01 | UX Researcher | **Yes** | "Workflow-first sequencing is maintained. Data infrastructure precedes UI. The design system compromise from Round 3 is reflected in the phase structure." |
| T02 | UI Designer | **Yes, with reservations** | "I still want a design hardening sprint after Phase B. The roadmap does not explicitly allocate time for it. Phase C should start with a 1-week design pass across all Phase A-B screens." |
| T03 | Frontend Developer | **Yes** | "The quick wins in Phase B (6 S-effort quality checks, featured image auto-set, draft-first publishing) are smart. They deliver visible progress while the heavy backend work continues." |
| T04 | Backend Developer | **Yes** | "The critical path is correctly sequenced. OAuth before GSC, GSC before decay detection, payload format before WordPress plugin. No dependency violations." |
| T05 | Feature Researcher | **Yes** | "The MoSCoW classification aligns with competitive analysis. Must Haves cover table stakes (GSC, quality scoring, WordPress). Should Haves cover differentiation (voice, Shopify, recalibration). Won't Haves are correctly scoped out." |

### Vote Tally

| Vote | Count | Voters |
|------|-------|--------|
| **Yes** | 10 | P01, P03, P05, P06, P07, P08, P10, T01, T03, T04 |
| **Yes, with reservations** | 5 | P02, P04, P09, T02, T05 |
| **No** | 0 | -- |
| **Total** | **15/15** | |

### Reservation Detail

**P02 (Marcus, Agency Owner):** Wants an explicit workspace switcher UI feature added to Phase B. The multi-tenant RLS policies provide backend isolation, but there is no user-facing mechanism to switch between client workspaces. This is an oversight in the 93-feature list. **Resolution:** Add "Multi-workspace switcher UI" as a Phase B Should Have feature in the backlog (not counted in the 93 since it was not in the original feature-gap-matrix).

**P04 (Nadia, Editorial Lead):** Wants basic RTL CSS support and Arabic font loading moved from Phase C to Phase A, integrated with the design system token work. Arabic is not an afterthought -- it is the initial market. **Resolution:** Move Arabic font loading (S effort) and basic CSS logical properties for RTL (S effort) into Phase A design system work. Full Arabic/RTL validation (#38) remains in Phase C.

**P09 (E-Com Marketing Head):** Concerned about 15+ week wait for Shopify app. **Resolution:** Confirm that the generic webhook publisher (#57, Phase B) can serve as an interim integration path. Document a Shopify webhook recipe for P09's team.

**T02 (UI Designer):** Wants explicit design hardening sprint scheduled. **Resolution:** Allocate the first week of Phase C (Week 15) as a design consistency pass across all Phase A-B screens before starting Voice Intelligence work.

**T05 (Feature Researcher):** Reservation is minor -- notes that the Won't Have list is short (2 items) and suggests reviewing additional features for deferral if timeline pressure increases. No specific feature recommended for deferral.

---

### ROADMAP STATUS: APPROVED

**15 votes Yes (10 unconditional, 5 with reservations), 0 votes No.**

The roadmap is binding. Reservations have been documented with specific resolutions. Phase assignments are final unless a blocking risk from architecture-risks.md materializes (specifically: Google OAuth verification delay, which could shift Phase A by 2-6 weeks).

---

## Surprise Findings

> Before closing, each expert answers: "What feature is NOT in the current plan that this category always rewards? What would users expect and not find?"

### UX Researcher -- Missing: Onboarding Wizard / Setup Checklist

"Every SaaS product in this price range has a guided onboarding flow. Connect your GSC. Connect your GA4. Run your first content audit. See your first recommendation. ChainIQ has a Connections page but no guided setup experience. First-time users will land on an empty dashboard with no idea what to do next. Enterprise products at $5K/month cannot afford a 'figure it out yourself' first impression. The persona research found that P09 and P10 both listed 'no developer required for setup' as a deal-breaker. A setup wizard directly addresses this. Estimated effort: M (1-2 weeks). Should be Phase A."

### UI Designer -- Missing: Dark/Light Mode Toggle

"Every design direction in design-language-options.md is dark mode only. The three directions all start with near-black backgrounds. But content editors -- Nadia's team -- work 8-10 hour shifts reviewing articles. Many editorial teams prefer light mode during daytime work. The design research never evaluated a light mode option because the aesthetic brief assumed dark. A light mode variant of the Editorial Intelligence palette (warm whites, cream backgrounds, dark text) would serve the editorial persona significantly better during long work sessions. ChainIQ should ship dark mode first but architect the token system to support a light mode toggle. Estimated effort: M (1-2 weeks) for the token architecture, S (additional) per screen for dual-mode testing."

### Frontend Developer -- Missing: Real-Time Collaboration / Activity Feed

"The feature list is entirely single-user. There is no indication of what other team members are doing. In an agency with 20+ clients and multiple strategists (Marcus's scenario), two people could be generating articles for the same client on the same topic simultaneously. At minimum, ChainIQ needs an activity feed showing recent actions across the workspace: 'Sarah generated an article about X for Client Y 5 minutes ago.' This is not full real-time collaboration (that is Google Docs territory and out of scope), but it is basic team awareness. Supabase Realtime makes this straightforward. Estimated effort: M."

### Backend Developer -- Missing: Rate Limiting Per Client / API Usage Dashboard

"The architecture risks document discusses API cost management for Semrush and Ahrefs, but the feature list has no per-client usage tracking or budget enforcement. An enterprise client with 50,000 URLs could exhaust the monthly Semrush API budget in a single crawl cycle. ChainIQ needs: (1) per-client API usage metering, (2) configurable API budget caps, (3) a usage dashboard showing API calls consumed vs. allocated. Without this, the margin analysis in the failure analysis (estimated 55-62% gross margin) is fiction. Estimated effort: L (2-4 weeks) for metering + dashboard."

### Feature Researcher -- Missing: GEO (Generative Engine Optimization) Features

"The CEO pitch document mentions GEO optimization as a Tier 3 feature, and the competitive landscape is moving fast in this direction. Google's AI Overviews, Bing's Copilot answers, and Perplexity citations are changing what 'ranking' means. ChainIQ's current feature set optimizes for traditional SERP rankings but has no features for: (1) citation optimization (making content citable by AI engines), (2) AI Overview eligibility scoring, (3) structured data specifically targeting LLM consumption, (4) monitoring whether content appears in AI-generated answers. This is not a nice-to-have -- it is the direction the entire SEO industry is moving. Competitors like BrightEdge already have 'AI Search' features. ChainIQ should add GEO scoring as a quality signal (extends #26, the 7-signal scoring) and GEO tracking as a feedback metric (extends #71/72). Estimated effort: L for scoring signal, L for tracking integration."

### UX Researcher (supplementary) -- Missing: Undo / Rollback for Published Content

"The publish flow is one-directional. Once an article is pushed to WordPress, there is no 'unpublish' or 'rollback to previous version' button in ChainIQ. If a quality gate failure is discovered post-publish (perhaps the auto-revision loop missed a factual error), the editorial team must manually go into WordPress to revert. ChainIQ should store the pre-publish state and offer a one-click rollback that restores the previous version in the CMS. This is especially critical for enterprise publishers where a factually incorrect article can cause reputational damage. Estimated effort: M."

### Power User (Marcus) -- Missing: Client Intake / Brief Template System

"When I onboard a new client, I need to capture: their target audience, competitors, content goals, brand voice guidelines, SEO priorities, existing content assets, and publishing workflows. Right now this would be done in a Google Doc or Notion page outside of ChainIQ. The platform should have a structured client intake form that feeds directly into the intelligence engine configuration. When I fill out 'Client X competes with Y and Z,' the gap analyzer should automatically configure itself to analyze Y and Z. This is a workflow feature that no competitor offers because they all assume one client per account. Estimated effort: M."

---

## Surprise Findings Summary

| Expert | Missing Feature | Est. Effort | Recommended Phase | Impact |
|--------|----------------|-------------|-------------------|--------|
| UX Researcher | Onboarding wizard / setup checklist | M | A | High -- first impression for all users |
| UI Designer | Dark/light mode toggle architecture | M + S/screen | A (architecture), C (implementation) | Medium -- editorial team comfort |
| Frontend Dev | Activity feed / team awareness | M | B | Medium -- agency teams need this |
| Backend Dev | Per-client API usage metering + budget caps | L | B | High -- margin protection |
| Feature Researcher | GEO optimization scoring + tracking | L + L | C (scoring), D (tracking) | High -- industry direction |
| UX Researcher | Undo/rollback for published content | M | C | Medium -- safety net for enterprise |
| Power User (Marcus) | Client intake / brief template system | M | B | Medium -- agency workflow |

**Total surprise findings: 7 features not in the current 93-feature plan.** The highest-priority additions are the onboarding wizard (Phase A), API usage metering (Phase B), and GEO optimization features (Phase C-D). These should be added to the backlog and evaluated for inclusion in the next planning cycle.

---

## Closing Statement

This tribunal has classified 93 features into MoSCoW categories, assigned them to five development phases, and secured unanimous approval (with documented reservations) from 15 voters. The roadmap is binding.

The 26 Must Have features form the product's skeleton. The 40 Should Have features build its muscles. The 25 Could Have features add refinement. The 2 Won't Have features are consciously excluded.

Seven surprise findings reveal gaps the original feature list missed -- onboarding, light mode, team awareness, cost metering, GEO optimization, content rollback, and client intake. These should be triaged into the existing phase structure before development begins.

The tribunal is adjourned.
