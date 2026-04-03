# Feature Gap Matrix --- Master Priority List

**Analyst:** ChainIQ Product Intelligence
**Date:** 2026-03-28
**Scope:** All 6 layers of the ChainIQ platform expansion
**Source:** Deep dives #1-3 (Data Ingestion, Content Intelligence, Voice Intelligence --- estimated), Deep dives #4-6 (Quality Assurance, Universal Publishing, Feedback Loop --- researched)

---

## Methodology

Features are prioritized using a 4-tier system:

- **P0 (Must Have):** Blocks the core value proposition. Without this, ChainIQ cannot deliver its end-to-end promise. Ship in Phase 1.
- **P1 (Should Have):** Significantly enhances value. Users expect this. Missing it reduces competitiveness. Ship in Phase 1-2.
- **P2 (Nice to Have):** Differentiator or enhancement. Users want it but can work without it. Ship in Phase 2-3.
- **P3 (Future):** Long-term vision. Not needed for launch. Ship in Phase 3+.

Effort estimates: **S** (< 1 week), **M** (1-2 weeks), **L** (2-4 weeks), **XL** (4+ weeks).

---

## Layer 1: Data Ingestion (Estimated from PROJECT-BRIEF)

| # | Feature | Priority | Effort | Phase | Layer | Notes |
|---|---------|----------|--------|-------|-------|-------|
| 1 | Google OAuth2 flow (auth URL, token exchange, refresh) | P0 | L | 1 | Ingestion | Gates all Google data. Reuse KeyManager AES-256-GCM. |
| 2 | GSC Search Analytics API client | P0 | L | 1 | Ingestion | Clicks, impressions, CTR, position. Table stakes (9/9 competitors). |
| 3 | GA4 Reporting API client | P0 | L | 1 | Ingestion | Sessions, engagement, conversions. 4/9 competitors have this. |
| 4 | Semrush API client (keyword research, gap, SERP features) | P1 | L | 2 | Ingestion | Unique: only Semrush itself offers Semrush data. |
| 5 | Ahrefs API client (backlinks, DR, keyword explorer) | P1 | L | 2 | Ingestion | Unique: only Ahrefs itself offers Ahrefs data. |
| 6 | Google Trends seasonal curves | P2 | M | 2 | Ingestion | White space: 0/9 competitors have full seasonality. |
| 7 | HTTP content crawler (content inventory) | P0 | L | 1 | Ingestion | Port from old-seo-blog-checker metadata-extractor. |
| 8 | Ingestion scheduler (daily/weekly pulls) | P0 | M | 1 | Ingestion | Zero npm deps, setInterval + Supabase job tracking. |
| 9 | Connections dashboard page (OAuth flow, status) | P0 | M | 1 | Ingestion | Users must connect their accounts. |
| 10 | Content inventory dashboard page | P1 | L | 2 | Ingestion | All discovered URLs with metrics, decay alerts. |

## Layer 2: Content Intelligence (Estimated from PROJECT-BRIEF)

| # | Feature | Priority | Effort | Phase | Layer | Notes |
|---|---------|----------|--------|-------|-------|-------|
| 11 | Decay detection engine | P0 | L | 1 | Intelligence | Port from Master Kit 36-seo. 3 detection methods + refresh decision matrix. |
| 12 | Keyword gap analyzer | P0 | L | 1 | Intelligence | Find keywords competitors rank for but client doesn't. |
| 13 | URL cannibalization detection | P0 | M | 1 | Intelligence | Port from Master Kit 36-seo. 4 resolution strategies. |
| 14 | Topic recommender agent | P0 | L | 1 | Intelligence | Consumes ingestion data, produces scored recommendations. |
| 15 | Seasonality planning | P2 | L | 2 | Intelligence | White space: 0/9 competitors. Google Trends integration. |
| 16 | Saturation scoring | P2 | L | 2 | Intelligence | White space: 0/9 competitors. Topic competitive density. |
| 17 | Opportunities dashboard page | P1 | L | 2 | Intelligence | Gap analysis, cannibalization warnings, scored recommendations. |

## Layer 3: Voice Intelligence (Estimated from PROJECT-BRIEF)

| # | Feature | Priority | Effort | Phase | Layer | Notes |
|---|---------|----------|--------|-------|-------|-------|
| 18 | Stylometric corpus analysis | P1 | XL | 2 | Voice | Sentence length, TTR, formality, passive voice, paragraph style. |
| 19 | AI vs human classification | P1 | L | 2 | Voice | Detect AI-generated content in existing corpus. |
| 20 | Writer clustering | P2 | L | 2 | Voice | Group articles by author style when bylines are missing. |
| 21 | Voice profile generation | P1 | L | 2 | Voice | Structured profile JSON for draft-writer agent consumption. |
| 22 | Voice analyzer agent (markdown) | P1 | M | 2 | Voice | Takes corpus analysis output, generates profile. |
| 23 | Voice profiles dashboard page | P1 | M | 2 | Voice | Detected writers, persona editing, default selection. |
| 24 | Style cloning for draft-writer | P1 | L | 2 | Voice | Draft-writer accepts voice profile as style constraint. |

## Layer 4: Quality Assurance & SEO Scoring (Researched --- Deep Dive #4)

| # | Feature | Priority | Effort | Phase | Layer | Notes |
|---|---------|----------|--------|-------|-------|-------|
| 25 | 60-point SEO checklist engine | P0 | M | 1 | Quality | Port from old-seo-blog-checker. 8 categories, 60 checks. |
| 26 | 7-signal weighted scoring | P0 | L | 1 | Quality | Composite score: E-E-A-T, completeness, voice, AI detection, freshness, technical, readability. |
| 27 | E-E-A-T 10-dimension rubric | P0 | M | 1 | Quality | LLM-based evaluation. 30-point scale with A-F grades. |
| 28 | Auto-revision loop (max 2 passes) | P0 | L | 1 | Quality | Re-invoke draft-writer with fix instructions. Gate before publish. |
| 29 | Readability analysis (Flesch-Kincaid) | P1 | S | 1 | Quality | FK grade, paragraph length, sentence variance. |
| 30 | Heading hierarchy validation | P1 | S | 1 | Quality | H1 count, H2/H3 counts, nesting, keyword inclusion. |
| 31 | Keyword density enforcement | P1 | S | 1 | Quality | Primary 8-15x, 2.5% max, LSI 15-25. |
| 32 | Meta tag optimization | P1 | S | 1 | Quality | Title 50-60 chars, meta desc 145-154 chars. |
| 33 | Internal link analysis | P1 | S | 1 | Quality | 8-12 links, relevant anchors, early placement. |
| 34 | Image optimization scoring | P1 | S | 1 | Quality | Alt text, file names, featured image, count >= 4. |
| 35 | Voice match scoring | P1 | M | 2 | Quality | Stylometric distance from target persona. Depends on Layer 3. |
| 36 | AI detection scoring | P1 | M | 2 | Quality | Sentence variance, vocabulary diversity, cliche density. |
| 37 | Topical completeness vs competitors | P1 | L | 2 | Quality | Coverage vs top 5 SERP competitors. Depends on Layer 1. |
| 38 | Arabic/RTL validation | P1 | M | 2 | Quality | Unicode range, dir attribute, Arabic fonts, RTL alignment. |
| 39 | Schema markup validation | P2 | S | 2 | Quality | Article, FAQ, HowTo, BreadcrumbList schema. |
| 40 | Featured snippet optimization | P2 | M | 2 | Quality | Quick answer box format, snippet targeting. |
| 41 | PAA targeting | P2 | M | 2 | Quality | FAQ section maps to SERP PAA questions. |
| 42 | TF-IDF semantic analysis | P2 | L | 3 | Quality | Term frequency against SERP corpus. |
| 43 | Entity salience scoring | P2 | L | 3 | Quality | Named entity recognition and prominence. |
| 44 | Bulk article scoring | P2 | M | 3 | Quality | Score multiple articles in batch. |
| 45 | Quality trend tracking | P2 | M | 3 | Quality | Scores over time, regression detection. |
| 46 | Actionable fix suggestions | P1 | M | 1 | Quality | Port from old-seo-blog-checker seo-suggestions.ts. |
| 47 | Quality score API endpoint | P0 | S | 1 | Quality | `/api/quality/score` returns full breakdown. |
| 48 | Dashboard quality report tab | P1 | M | 2 | Quality | Per-article score visualization, pass/fail per signal. |

## Layer 5: Universal Publishing (Researched --- Deep Dive #5)

| # | Feature | Priority | Effort | Phase | Layer | Notes |
|---|---------|----------|--------|-------|-------|-------|
| 49 | Universal Article Payload format | P0 | M | 1 | Publishing | Canonical JSON: title, body, meta, images, taxonomy, schema. |
| 50 | WordPress plugin (wp_insert_post) | P0 | L | 1 | Publishing | PHP plugin for all WP builders. Creates/updates posts. |
| 51 | Yoast/RankMath meta auto-fill | P0 | M | 1 | Publishing | Detect SEO plugin, set meta title/desc/focus keyphrase. |
| 52 | Draft-first publishing | P0 | S | 1 | Publishing | All articles as drafts. One-click promote. |
| 53 | Image CDN pipeline (CMS media upload) | P0 | L | 1 | Publishing | Upload images to CMS media library. Set featured image. |
| 54 | Category/tag mapping | P1 | M | 1 | Publishing | Map ChainIQ categories to CMS taxonomy. |
| 55 | Shopify app (Blog API) | P1 | L | 2 | Publishing | Embedded admin app. Blog Article API. Files API for images. |
| 56 | Ghost adapter | P1 | M | 2 | Publishing | Ghost Admin API. JWT auth. HTML + tags + meta. |
| 57 | Generic webhook publisher | P1 | M | 1 | Publishing | POST payload to any URL with HMAC. Covers Zapier/n8n/Make. |
| 58 | Publish scheduling | P1 | S | 2 | Publishing | Future publish date. CMS-native scheduling. |
| 59 | Bulk publishing | P1 | M | 2 | Publishing | Multiple articles, progress tracking. |
| 60 | Version control (generated vs published) | P1 | M | 2 | Publishing | Track which version is live. Detect CMS-side drift. |
| 61 | CMS connection health monitoring | P1 | S | 2 | Publishing | Periodic ping, auth failure alerts. |
| 62 | Contentful adapter | P2 | L | 3 | Publishing | Management API. Content model mapping. |
| 63 | Strapi adapter | P2 | M | 3 | Publishing | REST/GraphQL API. Content type mapping. |
| 64 | Webflow adapter | P2 | M | 3 | Publishing | CMS API. Collection field mapping. |
| 65 | Sanity adapter | P2 | M | 3 | Publishing | Client API. GROQ mutations. |
| 66 | Edit-after-publish sync | P2 | L | 3 | Publishing | Re-push updated content. Merge conflict detection. |
| 67 | Multi-site publishing (syndication) | P2 | M | 3 | Publishing | Same article to multiple CMS instances. |
| 68 | A/B headline testing via CMS | P3 | L | 3 | Publishing | Two variants, track CTR, auto-select winner. |
| 69 | SEO plugin compatibility layer | P1 | M | 2 | Publishing | Abstract across Yoast, RankMath, AIOSEO, SEOPress. |
| 70 | Featured image auto-set | P0 | S | 1 | Publishing | Upload + attach as featured image. |

## Layer 6: Feedback Loop & Performance (Researched --- Deep Dive #6)

| # | Feature | Priority | Effort | Phase | Layer | Notes |
|---|---------|----------|--------|-------|-------|-------|
| 71 | 30/60/90 day GSC tracking | P0 | L | 1 | Feedback | Pull performance data per article URL post-publish. |
| 72 | 30/60/90 day GA4 tracking | P0 | L | 1 | Feedback | Pull engagement data per article URL post-publish. |
| 73 | Prediction vs actual comparison | P0 | L | 1 | Feedback | Compare predictions to snapshots. Core innovation. |
| 74 | Accuracy scoring per article | P0 | M | 1 | Feedback | Normalized 0-100 accuracy score. |
| 75 | Scoring weight recalibration | P0 | XL | 2 | Feedback | Statistical model adjusts opportunity weights per client. Core moat. |
| 76 | Content ROI calculation | P1 | L | 2 | Feedback | (Traffic value - generation cost) / generation cost. |
| 77 | Client-facing performance reports | P1 | L | 2 | Feedback | PDF/HTML reports. Agency white-label. |
| 78 | Automated performance alerts | P1 | M | 2 | Feedback | Threshold-based alerts via webhook. |
| 79 | Content lifecycle status | P1 | M | 1 | Feedback | Growing/stable/declining classification. |
| 80 | Keyword position tracking | P1 | M | 1 | Feedback | Daily position per target keyword per article. |
| 81 | Portfolio-level analytics | P1 | L | 2 | Feedback | Aggregate performance across all articles. |
| 82 | Churn prediction (articles losing traffic) | P1 | L | 2 | Feedback | Predict 30-day traffic loss based on decay velocity. |
| 83 | Historical baseline comparison | P1 | M | 2 | Feedback | Compare to site average for similar content age. |
| 84 | Performance API endpoints | P0 | M | 1 | Feedback | `/api/performance/article/:id`, `/portfolio`, `/predictions`. |
| 85 | Performance dashboard page | P1 | L | 2 | Feedback | Charts, reports, alerts, lifecycle view. |
| 86 | Seasonal adjustment | P2 | L | 3 | Feedback | Normalize for seasonal trends. |
| 87 | Competitor movement tracking | P2 | L | 3 | Feedback | Track competitor content/ranking changes. |
| 88 | Backlink acquisition tracking | P2 | M | 3 | Feedback | New backlinks via Ahrefs/Semrush API. |
| 89 | Conversion attribution | P2 | L | 3 | Feedback | GA4 conversion tracking per article. |
| 90 | A/B headline performance | P2 | M | 3 | Feedback | CTR tracking for headline variants. |
| 91 | Content calendar ROI | P2 | M | 2 | Feedback | Monthly/quarterly articles vs traffic vs ROI. |
| 92 | Recommendation accuracy leaderboard | P2 | M | 3 | Feedback | Which recommendation types produce best ROI. |
| 93 | Auto-refresh triggers | P2 | M | 3 | Feedback | Auto-generate refresh recommendation for declining articles. |

---

## Priority Summary

| Priority | Count | Total Effort | Phase |
|----------|-------|-------------|-------|
| **P0** | 26 | ~7 S, 8 M, 10 L, 1 XL | Phase 1 (primarily) |
| **P1** | 40 | ~6 S, 16 M, 16 L, 1 XL | Phase 1-2 |
| **P2** | 25 | ~2 S, 12 M, 9 L, 0 XL | Phase 2-3 |
| **P3** | 2 | 0 S, 1 M, 1 L, 0 XL | Phase 3+ |
| **Total** | **93** | | |

---

## Top 5 Highest-Priority Gaps

These are the features with the greatest combination of urgency, competitive differentiation, and dependency-unblocking:

### 1. Auto-Revision Loop (Quality Gate, P0, Effort L)
**Why #1:** This is the feature that turns ChainIQ from "a tool that generates content" into "a tool that generates GOOD content." Without the auto-revision loop, every article ships at first-draft quality. The 7-signal scoring rubric is useless without a mechanism to act on low scores. This feature blocks the entire quality narrative.

### 2. Prediction vs Actual Comparison (Feedback Loop, P0, Effort L)
**Why #2:** This is ChainIQ's single most differentiated capability. Zero competitors (0/9) have it. BrightEdge has one-time forecasting; nobody compares predictions to actuals. This is the feature that makes ChainIQ's sales pitch provable: "We told you this article would get X clicks. It got Y. Our accuracy is Z%." Without this, ChainIQ is just another content tool with a prediction gimmick.

### 3. Google OAuth2 Flow + GSC/GA4 Clients (Data Ingestion, P0, Effort L+L+L)
**Why #3:** This is the data foundation that gates Layers 2, 4, 5, and 6. Without GSC data, there is no decay detection, no performance tracking, no prediction comparison, no recalibration. Without GA4, there is no ROI calculation. Three separate build items (OAuth, GSC client, GA4 client) but they form a single critical path. Every other data-dependent feature is blocked until this ships.

### 4. WordPress Plugin with SEO Meta Auto-Fill (Publishing, P0, Effort L+M)
**Why #4:** WordPress powers 43% of the web. The competition matrix shows 7/9 competitors have some WordPress integration. ChainIQ's framework adapters produce local files --- the jump to remote CMS publishing is the difference between a developer tool and a publisher tool. WordPress publishing with Yoast/RankMath auto-fill is the single most demanded publishing feature for the target market (MENA publishers and SEO agencies).

### 5. Scoring Weight Recalibration Engine (Feedback Loop, P0, Effort XL)
**Why #5:** This is the feature that creates a compounding competitive moat. It is the only XL-effort P0 and the hardest engineering challenge in the entire expansion. But it is what makes ChainIQ's recommendations get better over time for each specific client. Without recalibration, predictions are static guesses. With recalibration, they are a learning system. This is the "AI" in "AI Content Intelligence Platform."

---

## Phase Allocation Summary

### Phase 1 (Weeks 1-4): Foundation
All P0 features across all 6 layers. Core data flow: ingest data --> detect opportunities --> generate content --> score quality --> publish to CMS --> track performance --> compare predictions. **26 features, emphasis on S and M effort items.**

### Phase 2 (Weeks 5-8): Intelligence & Workflow
P1 features plus some P0 carryover (recalibration engine). Voice intelligence, advanced quality signals, publishing workflow (scheduling, bulk, versioning), performance reporting, ROI calculation. **~35 features.**

### Phase 3 (Weeks 9-12): Scale & Differentiation
P2 features. Headless CMS adapters, advanced analytics, seasonal adjustment, entity salience, TF-IDF, competitor tracking, syndication. **~25 features.**

### Phase 3+ (Beyond Week 12): Future
P3 features. A/B headline testing, social metrics, and any features that emerge from recalibration insights.

---

## Cross-Layer Dependencies

```
Layer 1 (Ingestion) -----> Layer 2 (Intelligence) -----> Layer 4 (Quality: topical completeness)
       |                          |                              |
       |                          v                              v
       |                   Layer 3 (Voice) --------> Layer 4 (Quality: voice match)
       |                                                         |
       v                                                         v
Layer 6 (Feedback) <------- Layer 5 (Publishing) <------- Layer 4 (Quality: gate)
       |
       v
Layer 2 (Intelligence: recalibration)
```

The critical path is: **Ingestion --> Intelligence --> Quality Gate --> Publishing --> Feedback --> Recalibration**. This is the end-to-end loop that no competitor completes. Every phase should advance all layers in parallel rather than completing one layer fully before starting the next.
