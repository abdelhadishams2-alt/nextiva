# Phase B Plan — Content Intelligence + Quality Gate + Publishing Core

**Duration:** Weeks 7-14 (8 weeks, 4 sprints of 2 weeks each)
**Theme:** Complete the vertical slice -- from data to intelligence to quality to publishing
**Developer:** Solo (full-time)
**Binding Source:** Tribunal Round 4 MoSCoW Verdict
**Prerequisite:** Phase A complete (OAuth, GSC/GA4 pulling daily, content inventory populated, decay + gap analysis producing scored outputs)

---

## Phase B Feature Set (30 features from tribunal verdict)

Phase B is the densest phase in the roadmap. It transforms ChainIQ from "infrastructure with data flowing" into "a product that recommends content, scores quality, and publishes to WordPress." This is the phase where the SRMG pilot sees real value for the first time.

The Round 3 consensus split this into two halves: Weeks 7-10 complete the vertical slice (intelligence + quality + WordPress), while Weeks 11-14 widen the intelligence layer with additional connectors and UI polish.

### Must Have Features in Phase B (16)
| # | Feature | Effort |
|---|---------|--------|
| 13 | URL cannibalization detection | M |
| 14 | Topic recommender agent | L |
| 25 | 60-point SEO checklist engine | M |
| 26 | 7-signal weighted scoring | L |
| 27 | E-E-A-T 10-dimension rubric | M |
| 28 | Auto-revision loop (max 2 passes) | L |
| 47 | Quality score API endpoint | S |
| 49 | Universal Article Payload format | M |
| 50 | WordPress plugin (wp_insert_post) | L |
| 51 | Yoast/RankMath meta auto-fill | M |
| 52 | Draft-first publishing | S |
| 53 | Image CDN pipeline | L |
| 70 | Featured image auto-set | S |
| 71 | 30/60/90 GSC tracking | L |
| 72 | 30/60/90 GA4 tracking | L |
| 84 | Performance API endpoints | M |

### Should Have Features in Phase B (14)
| # | Feature | Effort |
|---|---------|--------|
| 4 | Semrush API client | L |
| 5 | Ahrefs API client | L |
| 10 | Content inventory dashboard | L |
| 17 | Opportunities dashboard page | L |
| 29 | Readability analysis | S |
| 30 | Heading hierarchy validation | S |
| 31 | Keyword density enforcement | S |
| 32 | Meta tag optimization | S |
| 33 | Internal link analysis | S |
| 34 | Image optimization scoring | S |
| 46 | Actionable fix suggestions | M |
| 48 | Dashboard quality report tab | M |
| 54 | Category/tag mapping | M |
| 57 | Generic webhook publisher | M |
| 79 | Content lifecycle status | M |
| 80 | Keyword position tracking | M |

---

## Sprint 4: Intelligence Completion + Quality Gate Foundation (Weeks 7-8)

### Day-1 Action

**Port the 60-point SEO checklist engine from old-seo-blog-checker.** This is the fastest path to demonstrable quality scoring. The checklist is proven code -- 8 categories, 60 checks, already battle-tested. While porting, simultaneously start the cannibalization detection module (which consumes GSC data already flowing from Phase A). By end of Day 1, you should have the checklist port compiling and the cannibalization query logic scaffolded.

### Features That Ship

**1. Decay Detection Enhancement + Cannibalization Guard (effort M, 3-5 days)**
- URL cannibalization detection (feature #13): analyze GSC query overlap across client URLs. When two or more URLs compete for the same query cluster, flag as cannibalization.
- Four resolution strategies: merge content, add canonical, differentiate targeting, deindex lower performer
- Input: GSC query data from Phase A's daily pulls
- Output: cannibalization alerts in `keyword_opportunities` table with affected URL pairs and recommended strategy

**2. Gap Analysis Module Enhancement (effort included in #12 from Phase A)**
- Enhance Phase A's GSC-only gap analysis with content inventory cross-reference
- Identify topics where competitors have content but the client does not (using crawled content inventory)
- Feed gap analysis output into the Topic Recommender (Sprint 5)

**3. 60-Point SEO Checklist Engine (effort M, 3-5 days)**
- Port from old-seo-blog-checker codebase
- 8 categories: title, meta description, headings, content quality, images, links, technical, readability
- 60 individual checks with pass/fail/warning status
- ContentMetrics extraction module (effort M): word count, heading counts, link counts, image counts, keyword occurrences
- All 6 quick-win quality checks ship in this sprint:
  - Readability scoring / Flesch-Kincaid (feature #29, effort S)
  - Heading hierarchy validation (feature #30, effort S)
  - Keyword density enforcement (feature #31, effort S)
  - Meta tag optimization (feature #32, effort S)
  - Internal link analysis (feature #33, effort S)
  - Image optimization scoring (feature #34, effort S)

**4. E-E-A-T 10-Dimension Rubric (effort M, 3-5 days)**
- LLM-based evaluation across 10 dimensions: expertise demonstration, author authority signals, source citation quality, firsthand experience indicators, factual accuracy, comprehensiveness, originality, user intent alignment, content freshness, trust signals
- 30-point scale (3 points per dimension)
- Uses Claude API for evaluation (prompt engineering to score each dimension)
- Arabic content detection (S effort, from Phase A) triggers Arabic-specific evaluation criteria

**5. Quality Suggestions Engine (effort M, 3-5 days)**
- Port from old-seo-blog-checker
- Actionable fix suggestions (feature #46): for each failed check, provide specific remediation instruction
- Structured output: suggestion text, affected element (heading, paragraph, meta tag), severity (critical, warning, info), auto-fixable (boolean)
- Quality score API endpoint (feature #47, effort S): `/api/quality/score` returns full breakdown -- composite score, per-signal scores, individual check results, suggestions

### Dependencies

- Phase A complete: GSC data flowing (required for cannibalization detection)
- Content inventory populated (required for gap analysis enhancement)
- Route modules from Phase A (new endpoints added to `routes/quality.js`, `routes/intelligence.js`)

### Success Criteria

1. Cannibalization detection identifies at least 3 URL pairs competing for the same queries on the SRMG test domain
2. 60-point SEO checklist scores a sample article with all 60 checks producing pass/fail/warning
3. E-E-A-T rubric returns a 30-point score for a sample article via Claude API
4. Quality score API returns a complete JSON response with composite score, per-signal breakdown, and actionable suggestions
5. All 6 quick-win quality checks pass unit tests with known test content

### Risk Flags

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| E-E-A-T rubric consistency (LLM non-determinism) | Medium | Medium | Use temperature 0.1, structured output format, and 3-run averaging for production scoring |
| Old-seo-blog-checker port incompatibility | Low | Low | The checker is pure JavaScript with no external deps. Port should be straightforward. |
| Claude API rate limits for E-E-A-T scoring | Low | Medium | Batch scoring, not real-time. Queue articles for scoring during off-peak hours. |

---

## Sprint 5: Topic Recommender + Mode B Pipeline + Third-Party Connectors (Weeks 9-10)

### Day-1 Action

**Scaffold the Topic Recommender agent SKILL.md and wire it into the intelligence pipeline.** The Topic Recommender is the "what to write next" engine -- the primary reason 4 personas said they would buy ChainIQ. It consumes all intelligence outputs (decay alerts, gap opportunities, cannibalization warnings) and produces scored, prioritized content recommendations. Start with the agent definition, define the input/output contract, then implement the scoring logic.

### Features That Ship

**1. Topic Recommender Agent (feature #14, effort L, 1-2 weeks)**
- New markdown agent: `agents/topic-recommender.md`
- Consumes: decay detection outputs, gap analysis results, cannibalization data, content inventory
- Produces: scored recommendations with: topic title, target keyword, content type (new/refresh/consolidate), priority score, estimated traffic potential, reasoning
- Priority scoring formula: weighted combination of traffic potential (30%), keyword difficulty (20%), decay urgency (25%), competitive gap size (15%), content freshness need (10%)
- Mode B pipeline activation: when a recommendation is approved, trigger the existing 4-agent pipeline (project-analyzer -> research-engine -> article-architect -> draft-writer) with the recommendation as input
- Dashboard integration: recommendations appear on the Opportunities page

**2. Semrush API Client (feature #4, effort L, 1-2 weeks)**
- 4 endpoints: keyword research, keyword gap, domain analytics, SERP features
- API response caching: 7-day TTL for keyword data, 1-day TTL for SERP data
- Per-client API budget tracking with alerts at 80% threshold (per Backend Developer surprise finding)
- Conditional: only if Semrush API access is approved and API key is available. If not, defer to Phase C.

**3. Ahrefs API Client (feature #5, effort L, 1-2 weeks)**
- 3 endpoints: backlink profile, domain rating, keyword explorer
- API response caching: 30-day TTL for backlink profiles, 7-day TTL for keyword data
- Per-row pricing tracking (Ahrefs charges per row returned)
- Conditional: same as Semrush -- only if API access is approved.

**4. API Cost Modeling Spike (2-3 days)**
- Profile actual API unit consumption for a 1,000-URL test domain against Semrush
- Profile actual row consumption against Ahrefs
- Validate the $80-150/month Semrush and $50-120/month Ahrefs estimates from the effort framework
- Output: cost model spreadsheet with per-client projections at 1K, 5K, 10K, and 50K URLs
- This spike is Risk #6 (score 12/25) and must complete before enterprise pricing is finalized

### Dependencies

- Sprint 4 complete: quality gate scoring functional (the Topic Recommender needs to know the quality threshold for recommendations)
- Phase A data flowing: GSC, GA4, content inventory all populated
- Semrush/Ahrefs API keys obtained (external dependency -- may not be available by Week 9)

### Success Criteria

1. Topic Recommender produces at least 20 scored recommendations for the SRMG test domain
2. At least one recommendation, when approved, triggers the full 4-agent pipeline and produces a draft article
3. Semrush client successfully pulls keyword data for a test domain (if API access available)
4. Ahrefs client successfully pulls backlink data for a test domain (if API access available)
5. API cost model validated with real usage data (if connectors are functional)
6. All API responses are cached with correct TTL values

### Risk Flags

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Semrush/Ahrefs API access not approved by Week 9 | Medium | Medium | These are Should Have, not Must Have. Phase B can ship without them. Gap analysis runs on GSC data alone. |
| API costs exceed projections | Medium | High | Implement hard budget caps from day one. Alert at 80% threshold. Suspend pulls at 100%. |
| Topic Recommender produces low-quality recommendations | Medium | Medium | Manual review gate: all recommendations require human approval before triggering pipeline. No auto-generation. |

---

## Sprint 6: Quality Gate Agent + Auto-Revision Loop (Weeks 11-12)

### Day-1 Action

**Implement the auto-revision loop.** This is the feature that transforms ChainIQ from "generates first drafts" to "generates quality-controlled content." The auto-revision loop takes a draft article, runs it through the quality gate (Sprint 4), identifies failures, and re-invokes the draft-writer agent with specific fix instructions. Maximum 2 passes to prevent infinite loops. This is feature-gap-matrix priority #1.

### Features That Ship

**1. 7-Signal Weighted Scoring Engine (feature #26, effort L, 1-2 weeks)**
- Composite quality score from 7 signals: E-E-A-T (25%), completeness (20%), voice match (15%, placeholder until Phase C), AI detection (10%), freshness (10%), technical SEO (10%), readability (10%)
- Configurable weights per client (some may weight E-E-A-T higher, others technical SEO)
- Score thresholds: pass (>75), warning (50-75), fail (<50)
- Voice match signal uses a placeholder value of 70/100 until Voice Intelligence ships in Phase C

**2. Quality Gate Agent (feature #82 from effort framework, effort M, 3-5 days)**
- New markdown agent: `agents/quality-gate.md`
- Orchestrates the full quality evaluation: 60-point checklist + E-E-A-T rubric + 7-signal composite
- Produces structured quality report: composite score, per-signal breakdown, pass/fail/warning status, ordered list of fix suggestions
- Integrates with the auto-revision loop as the evaluation step

**3. Auto-Revision Loop (feature #28, effort L, 1-2 weeks)**
- After draft-writer produces an article, auto-invoke the Quality Gate agent
- If score < 75 (fail threshold): extract top 5 fix suggestions, re-invoke draft-writer with fix instructions appended to the original prompt
- Maximum 2 revision passes (draft -> revision 1 -> revision 2). If still failing after 2 passes, flag for human review.
- Track revision history: store each draft version with its quality score
- Risk: Medium. The re-invocation of draft-writer consumes additional Claude API credits. Budget for 2x the normal article generation cost per article.

**4. Universal Article Payload Format (feature #49, effort M, 3-5 days)**
- Canonical JSON schema: `{ title, body_html, meta_title, meta_description, focus_keyword, images[], taxonomy[], schema_markup, author, publish_date, status }`
- All CMS adapters consume this format. The payload is CMS-agnostic.
- Validation: required fields, max lengths (meta_title 60 chars, meta_description 154 chars), image array non-empty
- This is the abstraction layer that enables WordPress, Shopify, Ghost, and webhook publishing from a single source

**5. Dashboard Quality Report Tab (feature #48, effort M, 3-5 days)**
- Per-article quality report visualization
- Score ring visualization (SVG circle, S effort)
- Checklist accordion: expanded view of all 60 checks with pass/fail/warning icons
- Suggestion cards: actionable fixes with severity and auto-fixable indicator
- Revision history: show score progression across draft versions (original -> revision 1 -> revision 2)

### Dependencies

- Sprint 4 complete: 60-point checklist, E-E-A-T rubric, quality suggestions engine
- Sprint 5 complete: Topic Recommender producing recommendations that trigger draft-writer
- Existing draft-writer agent functional (from v1 codebase)

### Success Criteria

1. Auto-revision loop improves article quality score by at least 10 points on average across 5 test articles
2. No article enters infinite revision loop (max 2 passes enforced)
3. Quality Gate agent produces consistent scores (variance <5 points) for the same article across 3 runs
4. Universal Article Payload validates correctly for all required fields
5. Quality Report tab displays score ring, checklist accordion, and suggestion cards with real data
6. Revision history shows score improvement trajectory

### Risk Flags

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Auto-revision loop degrades article quality (over-optimization) | Medium | High | Compare human evaluation of original vs revised. If revision scores higher but reads worse, adjust fix instructions to be less aggressive. |
| Claude API costs double per article | High | Medium | Budget for it. At $3/article generation cost, 2x revision = $9/article. Still within SRMG margin at $5K/month for ~100 articles. |
| Quality score inconsistency due to LLM non-determinism | Medium | Medium | Pin Claude model version, use temperature 0.1, run 3 evaluations and average for production scoring |

---

## Sprint 7: WordPress Publishing + Performance Tracking Foundation + Integration Testing (Weeks 13-14)

### Day-1 Action

**Start the WordPress plugin PHP scaffolding.** The WordPress plugin is the single largest individual feature at XL effort (2-4 weeks per effort framework), but we have allocated only L (1-2 weeks) for the core functionality. Day 1: create the plugin file structure (`chainiq-publisher/chainiq-publisher.php`), activation/deactivation hooks, admin settings page skeleton, and the REST API authentication flow. The goal is to have a plugin that can receive a POST request from the ChainIQ bridge and create a WordPress draft post by end of Day 2.

### Features That Ship

**1. WordPress Plugin Core (feature #50, effort L, 1-2 weeks)**
- PHP plugin: `chainiq-publisher.php` with activation/deactivation hooks
- Admin settings page: API key configuration, default post status, default category
- REST API authentication: verify ChainIQ bridge requests via API key + HMAC signature
- Publisher class: accept Universal Article Payload, create WordPress draft post via `wp_insert_post()`
- Gutenberg + Classic Editor support (native HTML content rendering)
- Draft-first publishing (feature #52, effort S): all articles created as drafts, one-click promote to published

**2. WordPress Image Pipeline (feature #53, effort L, 1-2 weeks)**
- Upload images to WordPress media library via REST API
- Set featured image (feature #70, effort S): attach first image as featured image
- Image alt text and title from Universal Article Payload
- Handle image formats: JPEG, PNG, WebP

**3. Yoast/RankMath Meta Auto-Fill (feature #51, effort M, 3-5 days)**
- Detect which SEO plugin is installed (Yoast, RankMath, or neither)
- Set meta title, meta description, focus keyphrase via plugin-specific post_meta keys
- Yoast: `_yoast_wpseo_title`, `_yoast_wpseo_metadesc`, `_yoast_wpseo_focuskw`
- RankMath: `rank_math_title`, `rank_math_description`, `rank_math_focus_keyword`

**4. Category/Tag Mapping (feature #54, effort M, 3-5 days)**
- Map ChainIQ taxonomy to WordPress categories and tags
- Auto-create categories/tags if they do not exist
- Default category fallback if no mapping is configured

**5. Generic Webhook Publisher (feature #57, effort M, 3-5 days)**
- POST Universal Article Payload to any configured URL
- HMAC signature for payload verification
- Covers Zapier, n8n, Make, and custom integrations
- This serves as the interim Shopify integration path (per P09 reservation resolution)

**6. 30/60/90 Day Performance Tracking Foundation (features #71, #72, effort L+L)**
- GSC tracking: pull performance data per article URL after publishing
- GA4 tracking: pull engagement data per article URL after publishing
- Performance API endpoints (feature #84, effort M): `/api/performance/article/:id`, `/api/performance/portfolio`
- Content lifecycle status (feature #79, effort M): growing/stable/declining classification per article
- Keyword position tracking (feature #80, effort M): daily position per target keyword per published article
- Note: actual 30-day data will not be available until 30 days after the first article is published through the platform. This sprint sets up the tracking infrastructure; Phase D is when the data becomes meaningful.

**7. Opportunities Dashboard Page (feature #17, effort L)**
- 4 tabs: Decay Alerts, Gap Opportunities, Cannibalization Warnings, All Recommendations
- Opportunity cards with priority scores, affected URLs, recommended actions
- "Generate Article" button on each recommendation (triggers Mode B pipeline)
- Filter by severity, content type, date range

**8. Integration Testing Sprint**
- End-to-end test: connect GSC -> pull data -> detect opportunities -> generate article -> score quality -> auto-revise -> publish to WordPress
- Cross-module integration: verify data flows correctly from ingestion through intelligence through quality through publishing
- WordPress plugin testing: install on test WordPress instance, push 5 articles, verify rendering
- Performance under load: simulate 10 concurrent article generations

### Dependencies

- Sprint 6 complete: Quality Gate + auto-revision loop functional, Universal Article Payload defined
- WordPress test instance available (local or staging)
- At least 1 article generated through the full pipeline to test publishing

### Success Criteria

1. WordPress plugin installs, activates, and accepts article payloads from the ChainIQ bridge
2. Published articles render correctly in Gutenberg and Classic Editor with all images, categories, and SEO meta
3. Generic webhook publisher successfully delivers payloads to a test endpoint
4. End-to-end flow works: recommendation -> generate -> score -> revise -> publish -> track
5. Performance tracking infrastructure is collecting data for published articles
6. Opportunities page displays all intelligence outputs with functional "Generate Article" button
7. Integration tests pass for the complete pipeline

### Risk Flags

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| WordPress plugin takes longer than 2 weeks | High | High | Focus on core publishing first. Defer Yoast/RankMath and category mapping if needed -- they can ship as a hotfix in Week 15. |
| WordPress REST API authentication issues | Medium | Medium | WordPress Application Passwords (built-in since WP 5.6) simplify auth. Use these instead of custom OAuth. |
| Integration test failures reveal data pipeline bugs | High | Medium | Budget 2-3 days of Sprint 7 for bug fixing. Integration testing ALWAYS reveals issues. |
| Performance tracking has no data (no articles published yet) | High | Low | Expected. Set up the infrastructure; data accumulates starting now. First meaningful 30-day comparison: Week 17-18 at earliest. |

---

## Phase B Completion Checklist

At the end of Week 14, the following must be true for Phase B to be considered complete:

- [ ] Cannibalization detection producing alerts from real GSC data
- [ ] Topic Recommender producing 20+ scored recommendations per domain
- [ ] 60-point SEO checklist scoring articles with all 60 checks
- [ ] E-E-A-T rubric returning 30-point scores via Claude API
- [ ] 7-signal composite quality scoring functional
- [ ] Auto-revision loop improving article scores by 10+ points average
- [ ] WordPress plugin publishing draft articles with images, categories, and SEO meta
- [ ] Yoast/RankMath meta auto-fill working on test WordPress instance
- [ ] Generic webhook publisher delivering payloads
- [ ] Performance tracking infrastructure collecting data for published articles
- [ ] Opportunities dashboard displaying all intelligence outputs
- [ ] Quality Report tab displaying per-article quality analysis
- [ ] Semrush/Ahrefs clients functional (if API access approved; otherwise documented as Phase C)
- [ ] End-to-end pipeline tested: recommend -> generate -> score -> revise -> publish -> track
- [ ] Content inventory dashboard page live with health indicators
- [ ] Google OAuth consent screen verified (or SRMG pilot running under Testing mode)

**What Phase C assumes from Phase B:** Complete vertical slice operational -- from recommendation to publishing. WordPress publishing proven. Quality gate enforcing minimum quality threshold. Performance tracking infrastructure ready (data accumulating). Intelligence layer producing actionable recommendations. The platform is demonstrable to SRMG as a working product.
