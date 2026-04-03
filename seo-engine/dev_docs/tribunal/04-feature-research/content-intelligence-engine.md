# Content Intelligence Engine — Deep Dive Feature Research

**Layer:** 2 (Content Intelligence — The Recommendation Brain)
**Current State:** 1/10 — Basic keyword research exists via Gemini MCP in the research-engine agent. No data-driven intelligence, no decay detection, no gap analysis, no cannibalization guard. Mode A only (user provides keyword). Mode B (agent-recommended topics) is entirely unbuilt.
**Last Updated:** 2026-03-28
**Analyst:** ChainIQ Product Analysis

---

## 1. Why This Layer Is Critical

Content Intelligence is the strategic brain of ChainIQ. It transforms raw performance data (Layer 1) into actionable recommendations — telling publishers exactly what to write, what to refresh, and what to retire. Without it, ChainIQ is an article generator. With it, ChainIQ is a content strategist.

The competition matrix shows that topic recommendations (8/9) and gap analysis (8/9) are table stakes. But the intelligence depth varies dramatically. Most competitors surface keyword opportunities; few diagnose content health systematically. Seasonality (0/9 full) and saturation scoring (0/9 full) are white space. Predictive decay modeling with multiple detection methods is a differentiator only MarketMuse and SurferSEO approach partially.

The PROJECT-BRIEF defines Mode B as the new intelligence mode: user provides a category, the agent returns ranked article recommendations scored and justified with data. This requires 6 analyses running in sequence (inventory, decay, gap, seasonality, saturation, cannibalization). None of these analyses exist today.

---

## 2. Industry Standard

The baseline for content intelligence in 2026:

- **Topic recommendations** — Keyword-driven suggestions with volume, difficulty, and intent data. Every platform from Semrush to Frase offers this. Not a differentiator.
- **Content gap analysis** — Identify keywords competitors rank for that you do not. Semrush, Ahrefs, BrightEdge, and Conductor all offer this. The standard is domain-vs-domain comparison.
- **Content scoring** — Real-time scoring of draft content against SERP competitors. Clearscope, MarketMuse, and SurferSEO pioneered this. Scores are based on term frequency, topic coverage, and semantic completeness.
- **Basic decay detection** — Flag pages with declining traffic via GSC data. Most platforms offer this as a reporting feature, not an analytical engine.

What is NOT standard but emerging:
- Predictive decay modeling (forecasting which pages WILL decay before they do)
- Personalized difficulty scoring (how hard is it for YOUR site, not generically)
- GEO/AEO optimization (scoring content for AI engine citation probability)
- Cannibalization detection with automated resolution strategies

---

## 3. Competitor Best Practices

### MarketMuse — Personalized Difficulty + Topic Modeling
MarketMuse calculates a "Personalized Difficulty" score that accounts for your site's existing topical authority. A keyword with KD 60 might be PD 25 for a site that already has 30 articles in that topic cluster. This is the gold standard for site-specific intelligence. Their Topic Model maps semantic relationships between topics, showing which subtopics you need to cover to establish authority. The lesson: generic keyword difficulty is useless for content strategy — site-specific scoring creates dramatically better recommendations.

### Clearscope — Content Grading
Clearscope's real-time content grading scores drafts against the top 30 SERP results for a target keyword. It extracts terms, entities, and topics from ranking pages, then scores how well your content covers them. Grades range from F to A++. The lesson: content scoring must be comparative (your content vs what currently ranks), not absolute.

### Conductor — AI Topic Map
Conductor's Topic Map uses AI to identify topic clusters, map semantic relationships, and recommend content pillars. It connects to GSC data to show which topics you already own and where gaps exist. The lesson: topic-level intelligence (clusters and pillars) is more strategic than keyword-level intelligence alone.

### SurferSEO — Content Editor + SERP Analyzer
Surfer's content editor provides real-time term suggestions, NLP entity targets, and structure recommendations based on SERP analysis. Their SERP Analyzer breaks down ranking factors across top results. The lesson: intelligence must be actionable in the editor, not a separate report that gets ignored.

### Frase — Dual SEO/GEO Scoring
Frase is the only platform scoring content for both traditional search AND AI engine citation probability. Their Citation Lab tracks brand mentions in ChatGPT, Perplexity, and Gemini responses. The lesson: the next frontier of content intelligence includes optimizing for AI-generated answers, not just traditional SERPs.

---

## 4. Feature Inventory

| # | Feature | Priority | Complexity | Phase | Description |
|---|---------|----------|------------|-------|-------------|
| 1 | **Decay Detection — Impression Decline** | CRITICAL | MEDIUM | 1 | Flag articles with 3+ consecutive months of declining GSC impressions. Severity tiers: mild (10-20% decline), moderate (20-40%), severe (40%+). Directly from PROJECT-BRIEF spec. |
| 2 | **Decay Detection — Traffic Cliff** | CRITICAL | MEDIUM | 1 | Detect sudden drops: 20%+ single-month decline in clicks or sessions. Distinguish from seasonality (compare same month prior year). Alert mechanism for urgent intervention. |
| 3 | **Decay Detection — Position Erosion** | HIGH | MEDIUM | 1 | Track average position degradation for primary keywords over 3/6/12 month windows. Differentiate between losing to new competitors vs SERP feature displacement. |
| 4 | **Decay Detection — Predictive Modeling** | HIGH | HIGH | 2 | Use historical decay patterns to predict which currently-healthy pages will decay in the next 3-6 months. Regression model trained on site-specific data. This is white space — 0/9 competitors offer predictive decay. |
| 5 | **Gap Analysis — Keyword Level** | CRITICAL | HIGH | 1 | Cross-reference client's ranking keywords (GSC) against competitor keyword profiles (Semrush/Ahrefs). Identify high-volume, low-competition keywords with no client coverage. Table stakes feature (8/9 competitors). |
| 6 | **Gap Analysis — Topic Level** | HIGH | HIGH | 2 | Extend beyond keywords to topic clusters. Identify entire topic areas where competitors have authority and client has zero coverage. Uses keyword clustering + topical authority mapping. |
| 7 | **Cannibalization Detection — GSC Method** | CRITICAL | MEDIUM | 1 | Identify cases where multiple client URLs rank for the same keyword in GSC. Flag when 2+ pages compete, neither ranking well. Directly from keyword-content-mapping.template.md port. |
| 8 | **Cannibalization Detection — Site Search** | MEDIUM | MEDIUM | 2 | Analyze internal site search logs (if available via GA4) to detect when users search for terms that map to multiple similar pages. Secondary signal for cannibalization. |
| 9 | **Cannibalization Detection — Rank Tracker** | MEDIUM | MEDIUM | 2 | Monitor position fluctuations where two client pages alternate for the same SERP position (flip-flopping). Strong cannibalization signal. |
| 10 | **Cannibalization Resolution — 4 Strategies** | HIGH | MEDIUM | 2 | Per keyword-content-mapping port: (1) Merge — combine two weak pages into one authoritative page. (2) Redirect — 301 the weaker page to the stronger. (3) Differentiate — sharpen intent targeting so pages serve different intents. (4) Deoptimize — remove target keyword from secondary page. Automated recommendation based on page strength delta. |
| 11 | **Seasonality Modeling** | HIGH | MEDIUM | 2 | Use Google Trends 5-year data to build seasonal demand curves per topic. Adjust recommendation scores: boost topics 6-8 weeks before their seasonal peak, penalize topics at or past peak. White space — 0/9 competitors offer this fully. |
| 12 | **Saturation Index** | HIGH | HIGH | 2 | Score SERP difficulty by analyzing top 10-20 results: content depth (word count, heading structure), freshness (publish/update dates), authority (domain rating, backlinks). High saturation = top results are deep, fresh, and authoritative. Low saturation = opportunity. White space — 0/9 competitors. |
| 13 | **Topic Recommendation Agent** | CRITICAL | HIGH | 1 | The Mode B entry point. Takes category + client site URL, runs all 6 analyses, returns ranked list of article recommendations with scores and justifications. Implements the scoring formula from PROJECT-BRIEF: `priority = (impressions * 0.3) + (decay_severity * 0.25) + (gap_size * 0.25) + (seasonality_bonus * 0.1) + (competition_inverse * 0.1)`. |
| 14 | **Mode B Pipeline Orchestration** | CRITICAL | HIGH | 1 | Sequencing of the 6 analyses: inventory -> decay -> gap -> seasonality -> saturation -> cannibalization. Each analysis depends on prior outputs. Error handling for partial data (e.g., run gap analysis even if Trends data is unavailable). |
| 15 | **Keyword-Content Mapping** | HIGH | MEDIUM | 1 | One-keyword-per-page enforcement. Map each client URL to its primary target keyword. Detect violations. Feed into cannibalization detection and gap analysis. Port from keyword-content-mapping.template.md. |
| 16 | **Content Calendar** | MEDIUM | MEDIUM | 2 | Transform recommendation list into a time-phased calendar. Factor in: seasonality peaks, content production capacity, competitive urgency, decay intervention deadlines. Dashboard visualization with drag-drop reprioritization. |
| 17 | **Trending Topic Discovery** | MEDIUM | MEDIUM | 2 | Monitor Google Trends, social signals, and news APIs for emerging topics in client's category. Alert when trending topics align with existing content gaps. Time-sensitive — value decays if not acted on quickly. |
| 18 | **Competitive Velocity Tracking** | MEDIUM | HIGH | 3 | Track how fast competitors publish new content in client's topic areas. Measure: articles/month, topic expansion rate, freshness cadence. Alert when competitor publishing velocity exceeds client's. |
| 19 | **SERP Feature Targeting** | HIGH | MEDIUM | 2 | Identify SERP features present for target keywords: featured snippets, PAA, image packs, video carousels. Recommend content formats optimized for specific features. Port featured snippet targeting logic from content-optimization-scoring.template.md. |
| 20 | **Content Refresh Prioritization** | HIGH | MEDIUM | 1 | Rank decaying content by refresh ROI: (current traffic * decay rate * refresh difficulty inverse). Decision matrix from content-decay-refresh.md: partial refresh, full rewrite, or retire. |
| 21 | **Keyword Clustering** | HIGH | HIGH | 2 | Group semantically related keywords into clusters using embedding similarity. One cluster = one content piece. Prevents over-fragmentation where 10 similar keywords get 10 thin articles instead of 1 comprehensive one. |
| 22 | **Intent Classification** | HIGH | MEDIUM | 1 | Classify each keyword as informational, navigational, commercial, or transactional. Map intent to content format recommendations (guide, comparison, product page, tool). Feeds into article architect for structure decisions. |
| 23 | **GEO/AEO Optimization** | HIGH | HIGH | 2 | Score content for AI engine citation probability. Analyze: entity clarity, factual density, structured data, source attribution, concise answer formatting. Frase is the only competitor with this — first-mover opportunity especially for Arabic where no competitor is attempting it. |
| 24 | **Content Scoring Engine** | HIGH | HIGH | 2 | Real-time content grading against SERP competitors. TF-IDF semantic optimization, entity salience, topic coverage completeness. Score: 0-100 with A/B/C/D/F grades. Port from content-seo-scoring.md (10-dimension E-E-A-T rubric) and content-optimization-scoring.template.md. |
| 25 | **Topical Authority Mapping** | HIGH | HIGH | 2 | Map client's content portfolio into topic clusters. Score authority per cluster (number of articles, average ranking, backlinks, interlinking density). Identify clusters where authority is strong (defend) vs weak (invest). Enables MarketMuse-style personalized difficulty. |
| 26 | **Entity Extraction** | MEDIUM | HIGH | 2 | Extract named entities (people, places, products, concepts) from client content and SERP competitors. Map entity coverage gaps. Particularly important for Arabic content where entity extraction tooling is scarce. |
| 27 | **Personalized Difficulty Scoring** | MEDIUM | HIGH | 3 | MarketMuse-style site-specific difficulty. Factor in: existing topical authority, internal link support, domain rating relative to SERP competitors, existing keyword positions in same cluster. A keyword with KD 60 might be PD 20 for an authoritative site. |

---

## 5. Quick Wins

1. **Decay Detection (Impression Decline + Traffic Cliff)** — Requires only GSC data (the first connector built in Layer 1). Two SQL queries against performance_records table. Immediate, visible intelligence value.
2. **Cannibalization Detection (GSC Method)** — Single GSC query: find keywords where 2+ client URLs appear. Group by keyword, flag conflicts. Simple, high-impact, and the logic is already documented in the keyword-content-mapping port source.
3. **Intent Classification** — Can run at keyword research time using LLM classification (Gemini/Claude). No new data source required. Immediately improves recommendation quality.
4. **Keyword-Content Mapping** — Map existing content to primary keywords using GSC "top query per page" data. Foundation for cannibalization detection and gap analysis.
5. **Content Refresh Prioritization** — Combine decay severity + current traffic to rank refresh urgency. Simple scoring formula, high business impact for publishers with large content libraries.

---

## 6. Recommended Phases

### Phase 1: Core Intelligence (Weeks 1-4, parallel with Layer 1 Phase 1)
- Decay Detection — 3 methods (impression decline, traffic cliff, position erosion)
- Gap Analysis — keyword level (Semrush/Ahrefs cross-reference)
- Cannibalization Detection — GSC method
- Keyword-Content Mapping (one-keyword-per-page enforcement)
- Intent Classification
- Content Refresh Prioritization (partial/full/retire decision matrix)
- Topic Recommendation Agent (Mode B entry point)
- Mode B Pipeline Orchestration (6-analysis sequence)

### Phase 2: Advanced Intelligence (Weeks 5-8)
- Predictive Decay Modeling
- Gap Analysis — topic level (cluster-based)
- Cannibalization Resolution — 4 strategies with automated recommendations
- Cannibalization Detection — site search and rank tracker methods
- Seasonality Modeling (Google Trends integration)
- Saturation Index (SERP quality analysis)
- Content Scoring Engine (TF-IDF + E-E-A-T rubric)
- GEO/AEO Optimization scoring
- SERP Feature Targeting
- Keyword Clustering
- Topical Authority Mapping
- Entity Extraction
- Content Calendar
- Trending Topic Discovery

### Phase 3: Category Leadership (Weeks 9-12)
- Personalized Difficulty Scoring (site-specific KD)
- Competitive Velocity Tracking
- Arabic-specific entity extraction and semantic analysis
- Arabic GEO optimization (total white space)
- Self-improving recommendation model (feeds into Layer 6 recalibration)

---

## 7. Integration Requirements

### Upstream Dependencies (Layer 1)
- **ContentPerformanceRecord** — The primary data contract. Decay detection, gap analysis, and all scoring read from this normalized record.
- **Content Inventory** — URL-to-metadata mapping. Required for cannibalization detection and keyword-content mapping.
- **Performance Snapshots** — Historical time-series data. Required for trend analysis, decay detection, and predictive modeling.
- **GSC Query API data** — Keywords + pages + positions + clicks + impressions. The single most critical data source for Layer 2.
- **Semrush/Ahrefs data** — Competitor keyword profiles, backlink data. Required for gap analysis and saturation index.

### Downstream Consumers
- **Layer 3 (Voice Intelligence)** — Receives recommended topics to match against appropriate writer personas.
- **Layer 4 (Generation Pipeline)** — Topic Recommender agent output feeds directly into the research-engine and article-architect agents. Recommendation metadata (intent, target SERP features, competitor weaknesses) shapes the generated article.
- **Layer 6 (Feedback Loop)** — Recommendation scores become predictions. Feedback loop compares predicted score vs actual performance at 30/60/90 days. Recalibration adjusts scoring weights.

### Existing Code to Extend/Port
- `agents/topic-recommender.md` — New agent prompt (defined in PROJECT-BRIEF as Agent #1 in 7-agent pipeline).
- `old-seo-blog-checker/api/ai-keyword-research` — Port keyword research with difficulty scoring, intent classification, semantic keywords, competitor keywords, content gaps.
- `master-kit/content-decay-refresh.md` — Port 4 decay detection methods, refresh decision matrix, re-indexing sequence.
- `master-kit/keyword-content-mapping.template.md` — Port cannibalization detection (3 methods) and 4 resolution strategies.
- `master-kit/content-seo-scoring.md` — Port 10-dimension E-E-A-T rubric for content scoring.
- `master-kit/content-optimization-scoring.template.md` — Port TF-IDF, entity salience, featured snippet targeting.

### New Supabase Tables
- `recommendations` — Scored topic recommendations per client with justification data.
- `decay_alerts` — Flagged decaying content with severity, method, and recommended action.
- `cannibalization_conflicts` — Detected keyword conflicts between client URLs.
- `keyword_content_map` — Primary keyword assignment per URL.
- `topic_clusters` — Keyword cluster definitions with authority scores.
- `content_scores` — Per-article quality scores (SEO + GEO + E-E-A-T).

---

## 8. The Mode B Pipeline in Detail

The complete execution flow when a user provides a category:

```
INPUT: Category ("BMW maintenance") + Client Site URL

Step 1: Content Inventory
  └─ Crawl site (or read cached inventory)
  └─ OUTPUT: Map of all client URLs with metadata

Step 2: Decay Detection
  └─ Read performance_records for all client URLs in category
  └─ Run 3-4 detection methods
  └─ OUTPUT: List of decaying articles with severity scores

Step 3: Gap Analysis
  └─ Pull Semrush/Ahrefs competitor keywords for category
  └─ Cross-reference against client's GSC keyword coverage
  └─ OUTPUT: High-opportunity keywords with no client coverage

Step 4: Seasonality Check
  └─ Pull Google Trends data for top opportunity keywords
  └─ Calculate seasonal adjustment factors
  └─ OUTPUT: Time-adjusted opportunity scores

Step 5: Saturation Index
  └─ Analyze top SERP results for each opportunity keyword
  └─ Score content depth, freshness, authority of competitors
  └─ OUTPUT: Saturation score per keyword (high = hard, low = opportunity)

Step 6: Cannibalization Guard
  └─ Check if client already ranks for opportunity keywords
  └─ Flag overlaps: recommend REFRESH instead of NEW ARTICLE
  └─ OUTPUT: Final recommendation type per topic

FINAL OUTPUT: Ranked recommendations with scores, justifications, and action types
```

Each step is implemented as a discrete function in `bridge/intelligence/` so individual analyses can be run independently or in sequence.

---

## 9. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Insufficient historical data for new clients | Weak decay/trend analysis | HIGH | Require 3+ months of GSC data before Mode B. Offer Mode A + manual CSV import as bridge. |
| Scoring formula needs tuning per vertical | Generic scores feel wrong | MEDIUM | Per-client weight overrides. Learn from Layer 6 feedback loop. |
| Arabic NLP quality for entity extraction | Poor clustering/scoring for Arabic content | HIGH | Invest in Arabic-specific NLP pipeline. Test with SRMG corpus. |
| Analysis latency (6 sequential steps) | Slow recommendation generation | MEDIUM | Cache intermediate results. Run in background job (existing job queue). |
| False positive cannibalization flags | Confusing recommendations | MEDIUM | Require minimum overlap threshold (3+ shared keywords). Human review gate. |
