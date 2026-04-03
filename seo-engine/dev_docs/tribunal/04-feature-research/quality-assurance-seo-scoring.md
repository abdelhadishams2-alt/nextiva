# Feature Deep Dive #4: Quality Assurance & SEO Scoring Gate

**Analyst:** ChainIQ Product Intelligence
**Date:** 2026-03-28
**Layer:** Cross-cutting (applies post-generation, pre-publish)
**Current State:** 3/10
**Target State:** 9/10

---

## 1. Current State Assessment

ChainIQ's quality assurance capability scores **3/10** today. The raw materials exist but are disconnected:

- **old-seo-blog-checker** contains a 60-point SEO checklist across 8 categories (Content Structure, Keyword Optimization, Metadata, Internal Linking, External Links, Images, Technical Formatting, Internationalization) with a working `seo-analyzer.ts` that computes 40+ metrics and `seo-checklist.ts` that runs 60 checks. However, this code lives in a separate project directory and has never been integrated into the article generation pipeline.
- The PROJECT-BRIEF defines a **7-signal scoring rubric** (E-E-A-T, Topical Completeness, Voice Match, AI Detection, Freshness, Technical SEO, Readability) with weighted percentages and pass/fail thresholds. This is specification only --- zero implementation exists.
- The **auto-revision loop** (max 2 passes, then flag for human review) is specified but not built. The draft-writer agent has no feedback input mechanism today.
- The **E-E-A-T 10-dimension rubric** is ported from Master Kit 36-seo as a design document. No scoring engine runs it.
- No quality data is stored in Supabase. No dashboard page renders quality scores. No API endpoint returns quality results.

The gap is not knowledge --- ChainIQ knows exactly what quality looks like. The gap is **execution and integration**.

---

## 2. Industry Standard

Quality scoring is the most competitive area in the content intelligence space. Every serious content tool has some form of it:

| Tool | Approach | Strengths | Weaknesses |
|------|----------|-----------|------------|
| **SurferSEO Content Score** | Real-time SERP-based scoring. Analyzes top 10-20 results for target keyword. Scores based on NLP terms, word count, heading count, image count, paragraph structure. Updates in real time as you write. | Gold standard for on-page optimization. Scores are SERP-relative, not absolute. Real-time feedback loop. | Only measures on-page factors. No E-E-A-T, no voice quality, no AI detection. Score is keyword-specific, not content-quality-specific. |
| **Clearscope Content Grade** | A-F letter grade based on semantic similarity to top-ranking content. Heavy focus on term frequency and topic coverage. | Simple, actionable. Writers understand letter grades. Strong NLP term suggestions. | No technical SEO checks. No readability scoring. No multi-language support. |
| **MarketMuse Content Score** | Proprietary topic model. Measures topical authority and content comprehensiveness against a knowledge graph. Includes "Personalized Difficulty" score. | Deepest topical analysis. Understands topic clusters, not just keywords. | Slow (minutes per analysis). Expensive. No real-time feedback. |
| **Frase Content Score** | Dual scoring: traditional SEO score + emerging GEO (Generative Engine Optimization) score. Checks content for AI Overview inclusion potential. | Forward-looking (GEO is where the industry is heading). Dual scoring is unique. | GEO scoring is nascent and unproven. Limited validation data. |
| **Semrush Writing Assistant** | Readability, SEO, originality, tone of voice. Integrates with Google Docs and WordPress. | Broad coverage across 4 dimensions. Good integrations. | Shallow on each dimension. SEO checks are basic compared to SurferSEO. |

The industry standard is: **keyword-specific content scoring with NLP term suggestions, real-time feedback, and letter/numeric grades**. Most tools stop at on-page SEO and readability. None combine SEO scoring with voice matching, AI detection, and E-E-A-T in a single rubric.

---

## 3. Competitor Best-in-Class

**SurferSEO** leads on real-time SERP-based optimization. Their Content Editor pulls the actual current SERP for a target keyword, extracts NLP terms from ranking pages, and provides a live score (0-100) that updates as the writer types. This is the benchmark for on-page optimization. Their "Custom Voice" feature adds basic brand voice matching, and their "Humanizer" tool attempts AI detection avoidance, but these are separate tools, not integrated into the content score.

**Frase** is the most forward-looking with dual SEO/GEO scoring. As AI Overviews reshape search, content optimized for traditional SEO may not be optimized for AI citation. Frase's GEO score attempts to measure "will AI engines cite this content?" --- a capability no other tool offers at scale. This is directionally correct even if the methodology is still maturing.

**MarketMuse** has the deepest topical analysis, modeling content against a knowledge graph rather than just comparing to top SERP results. Their "Content Score" measures how comprehensively a piece covers a topic compared to what an authoritative source would cover. This goes beyond keyword matching into genuine topical completeness.

**ChainIQ's opportunity:** No competitor combines all 7 signals. SurferSEO does SERP-based SEO well but ignores E-E-A-T, voice quality, and AI detection. Clearscope and MarketMuse focus on topical completeness but miss technical SEO. Frase is adding GEO but has no voice intelligence. ChainIQ's 7-signal rubric, if implemented, would be the most comprehensive quality scoring system in the market.

---

## 4. Feature Inventory

| # | Feature | Priority | Effort | Phase | Status | Notes |
|---|---------|----------|--------|-------|--------|-------|
| 1 | 60-point SEO checklist engine | P0 | M | 1 | Port from old-seo-blog-checker | `seo-analyzer.ts` + `seo-checklist.ts` logic into `engine/quality-gate.js` |
| 2 | 7-signal weighted scoring | P0 | L | 1 | Not started | Composite score from all 7 signals with configurable weights |
| 3 | E-E-A-T 10-dimension rubric | P0 | M | 1 | Design exists | LLM-based evaluation of Experience, Expertise, Authority, Trust markers |
| 4 | Auto-revision loop (max 2 passes) | P0 | L | 1 | Not started | Re-invoke draft-writer with targeted fix instructions; gate before publish |
| 5 | Readability analysis (Flesch-Kincaid) | P1 | S | 1 | Port available | Compute FK grade, paragraph length, sentence variance |
| 6 | Heading hierarchy validation | P1 | S | 1 | In 60-point checklist | Validate H1 count, H2/H3 counts, logical nesting, keyword inclusion |
| 7 | Keyword density enforcement | P1 | S | 1 | In 60-point checklist | Primary keyword 8-15x, 2.5% max density, LSI 15-25 mentions |
| 8 | Meta tag optimization | P1 | S | 1 | In 60-point checklist | Title 50-60 chars, meta desc 145-154 chars, focus keyphrase |
| 9 | Internal link analysis | P1 | S | 1 | In 60-point checklist | 8-12 links, relevant anchors, early placement, no clustering |
| 10 | Image optimization scoring | P1 | S | 1 | In 60-point checklist | Alt text, file names, featured image dimensions, count >= 4 |
| 11 | Voice match scoring | P1 | M | 2 | Depends on Voice Intelligence layer | Stylometric distance from target persona <= 0.3 |
| 12 | AI detection scoring | P1 | M | 2 | Not started | Sentence variance, vocabulary diversity, cliche density; target >= 85% human |
| 13 | Topical completeness vs competitors | P1 | L | 2 | Not started | Compare subtopic coverage against top 5 SERP competitors |
| 14 | Freshness signals validation | P1 | S | 2 | Not started | All statistics <= 6 months old, working links, current examples |
| 15 | Arabic/RTL validation | P1 | M | 2 | In 60-point checklist (i18n section) | Unicode range check, dir attribute, Arabic font families, RTL alignment |
| 16 | Schema markup validation | P2 | S | 2 | Not started | Article, FAQ, HowTo, BreadcrumbList schema presence and correctness |
| 17 | Featured snippet optimization | P2 | M | 2 | Not started | Quick answer box format, paragraph/list/table snippet targeting |
| 18 | PAA (People Also Ask) targeting | P2 | M | 2 | Not started | FAQ section maps to PAA questions from SERP data |
| 19 | TF-IDF semantic analysis | P2 | L | 3 | Not started | Term frequency-inverse document frequency against SERP corpus |
| 20 | Entity salience scoring | P2 | L | 3 | Not started | Named entity recognition, entity prominence vs competitors |
| 21 | Content freshness signals | P2 | S | 2 | Not started | Date references, "updated" markers, recency of cited sources |
| 22 | Bulk article scoring | P2 | M | 3 | Not started | Score multiple articles in batch; dashboard view of portfolio quality |
| 23 | Quality trend tracking | P2 | M | 3 | Not started | Track quality scores over time per client; regression detection |
| 24 | Actionable fix suggestions | P1 | M | 1 | Port from old-seo-blog-checker | `seo-suggestions.ts` logic generates specific, actionable fix text |
| 25 | Quality score API endpoint | P0 | S | 1 | Not started | `/api/quality/score` returns full breakdown for an article |
| 26 | Dashboard quality report tab | P1 | M | 2 | Not started | Per-article quality score visualization, pass/fail per signal |

---

## 5. Quick Wins (< 1 week each)

1. **Port the 60-point SEO checklist** into `engine/quality-gate.js`. The TypeScript source is already written in `old-seo-blog-checker/lib/seo-analyzer.ts` and `seo-checklist.ts`. This is a translation exercise (TS to JS) plus wiring into the pipeline. Immediate value: every generated article gets an SEO score.

2. **Readability scoring.** Flesch-Kincaid is a well-known formula (0.39 * words/sentences + 11.8 * syllables/words - 15.59). No external dependencies needed. Can be added to the quality gate in under a day.

3. **Quality score API endpoint.** Add `/api/quality/score` to the bridge server. Accepts article HTML, returns JSON with scores per signal. This unblocks the dashboard team immediately.

4. **Heading hierarchy validation.** Parse the HTML, count H1/H2/H3, check nesting rules. Pure DOM parsing, no AI needed. Already specified in the 60-point checklist.

---

## 6. Phased Implementation

### Phase 1: Foundation (Weeks 1-3)
Port 60-point checklist, implement Flesch-Kincaid readability, build E-E-A-T rubric (LLM-evaluated), wire auto-revision loop into SKILL.md pipeline, create `/api/quality/score` endpoint, port actionable suggestions engine. **Exit criteria:** Every generated article receives a composite quality score and either passes or gets auto-revised up to 2 times.

### Phase 2: Intelligence Signals (Weeks 4-6)
Add voice match scoring (depends on Voice Intelligence layer), AI detection scoring, topical completeness analysis (requires SERP data from ingestion layer), featured snippet optimization, PAA targeting, Arabic/RTL validation, schema markup validation, freshness signal checks. **Exit criteria:** All 7 signals from the rubric are actively scored with real data.

### Phase 3: Scale & Insight (Weeks 7-9)
Build TF-IDF semantic analysis, entity salience scoring, bulk article scoring, quality trend tracking dashboard, historical baseline comparisons. **Exit criteria:** Portfolio-level quality visibility with trend detection.

---

## 7. Integration Points

| System | Integration | Direction |
|--------|-------------|-----------|
| Draft Writer Agent | Auto-revision instructions | Quality Gate --> Draft Writer |
| SKILL.md Pipeline | Gate step between generation and publish | Quality Gate <--> Pipeline |
| Bridge Server | `/api/quality/score`, `/api/quality/bulk` | Dashboard --> Quality Gate |
| Supabase | Store quality scores per article in `articles` table (new JSONB column) | Quality Gate --> Database |
| Publishing Layer | Block publish if score < threshold | Quality Gate --> Publisher |
| Dashboard | Quality report tab, trend charts, bulk scores | Quality Gate --> Dashboard |
| Data Ingestion | SERP data for topical completeness, PAA questions | Ingestion --> Quality Gate |
| Voice Intelligence | Voice profile for voice match scoring | Voice --> Quality Gate |

---

## 8. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM-based E-E-A-T scoring is subjective and inconsistent | Medium | Use structured rubric with specific criteria per dimension; average 3 evaluations; cache scores |
| Auto-revision loop could degrade content quality | High | Cap at 2 passes; track which signals improved/degraded per pass; human review escape hatch |
| Topical completeness requires live SERP data (cost, latency) | Medium | Cache SERP analysis per keyword for 7 days; batch SERP pulls during ingestion, not at scoring time |
| AI detection scoring arms race (detectors evolve constantly) | Medium | Use multiple detection heuristics (sentence variance, vocabulary diversity, cliche density) rather than depending on a single detector API |
| Arabic quality scoring has no benchmark data | Low | Build Arabic-specific checklist items (Unicode range, RTL, font families) and validate with MENA publishers |
