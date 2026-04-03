# CI-003: Topic Recommender Agent

> **Phase:** 6 | **Priority:** P0 | **Status:** NOT STARTED
> **Effort:** XL (16h) | **Type:** feature
> **Sprint:** 5 (Weeks 9-10)
> **Depends On:** CI-001 (decay scores), CI-002 (gap scores), DI-002 (GSC impressions data)
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `dev_docs/services/content-intelligence.md` — Full intelligence pipeline, scoring formula, Mode B flow, API endpoints
3. `PROJECT-BRIEF.md` — Section 4, Layer 2 (scoring formula), Layer 4 (7-agent pipeline, Topic Recommender as Agent #1)
4. `skills/article-engine/SKILL.md` — Current Mode A flow (user provides keyword → pipeline)
5. `agents/research-engine.md` — Research agent pattern (agent markdown format)
6. `bridge/intelligence/decay-detector.js` — Decay detection output format
7. `bridge/intelligence/gap-analyzer.js` — Gap analysis output format

## Objective
Build the Topic Recommender as a new AI agent in the ChainIQ agent pipeline. Implement the five-component scoring formula that ranks keyword opportunities by combining impression weight, decay severity, gap size, seasonality bonus, and competition inverse. Wire the recommender into SKILL.md as Mode B (category-driven) and create the `/api/intelligence/recommendations` endpoint that returns scored, actionable topic recommendations.

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `agents/topic-recommender.md` | New AI agent: topic recommendation with scoring and justification |
| CREATE | `bridge/intelligence/topic-recommender.js` | Scoring engine, recommendation assembly, pipeline bridge |
| MODIFY | `skills/article-engine/SKILL.md` | Add Mode B: category → recommendations → user picks → pipeline |
| MODIFY | `bridge/server.js` | Register recommendation endpoints |

## Sub-tasks

### Sub-task 1: Build scoring engine (`bridge/intelligence/topic-recommender.js`) (~5h)
- Create `bridge/intelligence/topic-recommender.js` exporting a `TopicRecommender` class
- **Constructor:** accepts `{ supabaseClient, decayDetector, gapAnalyzer, cannibalizationDetector }`
- **Scoring formula** from PROJECT-BRIEF.md:
  ```
  priority = (impressions * 0.3) + (decay * 0.25) + (gap * 0.25) + (seasonality * 0.1) + (competition * 0.1)
  ```
- **Component calculations** — each normalized to 0-100 scale:
  - **Impressions (0.3 weight):** Normalize monthly impressions: 0 = 0, 1000 = 25, 5000 = 50, 10000 = 75, 50000+ = 100. Logarithmic scale.
  - **Decay (0.25 weight):** From CI-001 results. No decay = 0. Medium decay = 40. High decay = 70. Critical decay = 100. Age-triggered but stable traffic = 30.
  - **Gap (0.25 weight):** From CI-002 results. No gap (page exists and ranks well) = 0. Page exists but ranks poorly (pos 20-50) = 50. No page exists for keyword = 100.
  - **Seasonality (0.1 weight):** If trend data available: `weeks_to_peak <= 8` = 100, `weeks_to_peak 8-16` = 50, `weeks_to_peak > 16` or `past_peak` = 0. Without trend data: default 50 (neutral).
  - **Competition (0.1 weight):** Inverse of SERP difficulty. Thin/outdated top results = 100. Forum/UGC dominance = 80. Mixed quality = 50. Strong authoritative results = 20. Top brands dominate = 0.
- **`scoreOpportunities(userId, category)`** — Main scoring method:
  - Collect all keyword_opportunities for user (from gap and cannibalization analyses)
  - Collect all decay signals from decay detector
  - If category is provided, filter opportunities to those matching the category (fuzzy match on keyword against category terms)
  - Calculate composite priority score for each opportunity
  - Sort by priority_score descending
  - Store detailed scoring breakdown in `analysis_metadata.scoring`
  - Return top N recommendations (default 20, configurable)

### Sub-task 2: Build recommendation assembly (~3h)
- **`assembleRecommendation(opportunity, scoringDetails)`** — Create a rich recommendation object:
  - `keyword`: the target keyword or topic
  - `opportunity_type`: gap, decay, cannibalization, trending, seasonal
  - `priority_score`: computed score (0-100)
  - `recommended_action`: create_new, update_existing, merge, redirect, differentiate, deoptimize
  - `target_url`: existing URL to refresh (null for new articles)
  - `summary`: human-readable 1-2 sentence justification generated from data:
    - For gaps: "High-volume keyword ({impressions}/mo) with no existing coverage. Top SERP results are {quality}. {seasonality note}."
    - For decay: "Existing article lost {decline}% traffic in 3 months. {age note}. Competitors published fresher guides."
    - For cannibalization: "{N} pages competing for this keyword. Recommend {action} to consolidate ranking power."
  - `evidence`: structured data backing the recommendation (impressions, position, trend, competitors)
- **`generateRecommendations(userId, category, options)`** — Full pipeline:
  - Run `scoreOpportunities(userId, category)`
  - For each scored opportunity, call `assembleRecommendation()`
  - Upsert all recommendations to `keyword_opportunities` table
  - Create an `analysis_run` record tracking: category, analyses completed, opportunities found, timing
  - Return the recommendation list

### Sub-task 3: Create Topic Recommender agent (`agents/topic-recommender.md`) (~3h)
- Follow the same markdown agent format as existing agents (`research-engine.md`, `article-architect.md`)
- Agent receives: category, client site URL, data context (top recommendations from scoring engine)
- Agent outputs: enhanced recommendations with:
  - Refined topic angles (not just keywords, but specific article approaches)
  - Content type suggestions (how-to, comparison, listicle, guide, case study)
  - Estimated word count range based on competitor analysis
  - Key subtopics to cover (from research context)
  - Internal linking opportunities to existing content
- Agent uses Gemini MCP for supplementary research if available
- Agent validates recommendations against content_inventory to avoid suggesting topics already well-covered

### Sub-task 4: Wire into SKILL.md as Mode B (~3h)
- Modify `skills/article-engine/SKILL.md` to add Mode B flow:
  - **Mode detection:** If user provides a category (not a specific keyword), enter Mode B
  - **Mode B Step 1:** Call `topicRecommender.generateRecommendations(userId, category)`
  - **Mode B Step 2:** Present recommendations to user with scores, types, and summaries
  - **Mode B Step 3:** User selects which recommendation(s) to execute
  - **Mode B Step 4:** Selected recommendation feeds into existing pipeline at the research-engine step, with full context:
    - The selected keyword becomes the pipeline input
    - Decay data informs whether this is a refresh or new article
    - Gap data provides competitor context for the research engine
    - Cannibalization warnings are passed to the article-architect to avoid overlap
  - Mode A (user provides keyword directly) remains unchanged — bypasses intelligence entirely
- Add a `mode` field to pipeline job metadata: `'A'` (keyword-driven) or `'B'` (recommendation-driven)

### Sub-task 5: Register API endpoints (~2h)
- **`GET /api/intelligence/recommendations`** — Authenticated. Returns scored recommendations:
  - Query params: `type`, `status`, `min_score`, `sort`, `page`, `per_page` (matching content-intelligence.md spec)
  - Response format matches the example in content-intelligence.md (keyword, type, score, impressions, clicks, position, action, target_url, status, summary)
- **`GET /api/intelligence/recommendations/:id`** — Authenticated. Returns single recommendation with full `analysis_metadata`.
- **`PATCH /api/intelligence/recommendations/:id`** — Authenticated. Update status: `{ status: 'accepted'|'dismissed' }`.
- **`POST /api/intelligence/recommendations/:id/execute`** — Authenticated. Sends accepted recommendation to generation pipeline. Creates a pipeline job with Mode B context. Returns job ID for tracking.
- **`POST /api/intelligence/run`** — Authenticated. Triggers full analysis cycle for a category. Accepts `{ category, competitors?, max_recommendations? }`. Returns run ID for polling.
- **`GET /api/intelligence/run/:runId`** — Authenticated. Returns analysis run status and results.

## Acceptance Criteria
- [ ] Scoring formula correctly weights: impressions (0.3), decay (0.25), gap (0.25), seasonality (0.1), competition (0.1)
- [ ] Each scoring component is normalized to 0-100 scale before weighting
- [ ] Recommendations include human-readable summaries with data-backed justifications
- [ ] `agents/topic-recommender.md` follows existing agent markdown format
- [ ] Agent enhances recommendations with topic angles, content types, and subtopics
- [ ] SKILL.md Mode B flow: category → recommendations → user picks → pipeline with context
- [ ] Mode A (direct keyword) remains unchanged and unaffected
- [ ] `GET /api/intelligence/recommendations` returns paginated, filterable scored list
- [ ] `PATCH /api/intelligence/recommendations/:id` updates status (accept/dismiss)
- [ ] `POST /api/intelligence/recommendations/:id/execute` creates pipeline job with Mode B context
- [ ] `POST /api/intelligence/run` triggers full 6-analysis cycle and returns run ID
- [ ] Category filter correctly narrows recommendations to relevant topics
- [ ] Scoring breakdown stored in `analysis_metadata.scoring` for transparency

## Test Requirements

### Unit Tests
- Scoring: impressions 5000 → component value 50 (logarithmic scale)
- Scoring: critical decay → component value 100, no decay → 0
- Scoring: no existing page → gap component 100, well-ranking page → 0
- Scoring: weeks_to_peak=4 → seasonality component 100
- Combined score with known inputs produces expected output
- Summary generation: gap keyword produces "no existing coverage" text
- Summary generation: decay keyword produces "lost X% traffic" text
- Category filter: "BMW engine" matches "N54 HPFP symptoms" but not "Honda Civic guide"

### Integration Tests
- Full recommendation pipeline: run analysis → score → assemble → store → retrieve via API
- Mode B flow: category input → recommendations → accept one → pipeline job created with context
- Execute endpoint creates pipeline job with correct Mode B metadata
- Analysis run tracking: create → running → completed with opportunity count

## Dependencies
- Blocked by: CI-001 (decay scores), CI-002 (gap scores and keyword_opportunities table)
- Blocks: CI-005 (dashboard recommendations tab), SKILL.md Mode B pipeline flow
