# Spec 04: Topic Recommender Agent + Mode B Pipeline

**Priority:** Must Have (MoSCoW #14)
**Phase:** B (Weeks 7-14)
**Effort:** L (2-4 weeks)
**Dependencies:** Decay Detection (#11), Keyword Gap Analyzer (#12), Content Inventory (#7), GSC Client (#2)
**Blocks:** Content Calendar, Automated Refresh Triggers (#93), Performance Predictions (#73)

---

## 1. Feature Overview

The Topic Recommender is ChainIQ's core differentiator -- the feature that transforms the platform from "generates articles" to "tells you what articles to generate and why." It is the brain behind Mode B, the new data-driven pipeline where the user provides a category and ChainIQ returns a ranked, scored list of article recommendations backed by real performance data.

**Mode A (existing):** User provides a specific keyword. The 4-agent pipeline executes immediately. No intelligence layer involved.

**Mode B (new):** User provides a broad category (e.g., "BMW engine maintenance"). The Topic Recommender agent consumes data from all ingestion and intelligence sources, runs 6 analyses, scores every opportunity, and returns the top 10 recommendations. The user picks one or more, and the existing pipeline takes over from there.

The Topic Recommender is implemented as a new markdown agent (`agents/topic-recommender.md`) following the same agent architecture as the existing project-analyzer, research-engine, article-architect, and draft-writer. It reads structured data from the bridge server (via tool calls to the API) and produces structured JSON output that the SKILL.md orchestrator consumes.

The 6 analyses it performs:

1. **Content Inventory Analysis** -- What topics does the site already cover? Where are the clusters? What are the thin spots?
2. **Decay Analysis** -- Which existing articles are losing traffic and need refreshing? (Consumed from spec-03 output)
3. **Gap Analysis** -- What high-volume keywords do competitors rank for that this site does not? (Consumed from gap analyzer #12)
4. **Seasonality Check** -- Are any opportunities time-sensitive? Should we write now to catch an upcoming peak? (Google Trends data if available, otherwise skipped)
5. **Saturation Scoring** -- How competitive is each opportunity? Are the top SERP results thin/outdated (easy win) or deep/authoritative (hard fight)? (Semrush data if available, otherwise estimated from GSC impressions-to-clicks ratio)
6. **Cannibalization Guard** -- Does the site already rank for this keyword? If yes, recommend REFRESH instead of NEW. Prevents creating competing pages.

**Scoring formula:**

```text
priority = (impressions_norm * 0.3) + (decay_severity * 0.25) + (gap_size * 0.25)
         + (seasonality_bonus * 0.1) + (competition_inverse * 0.1)
```

Each component is normalized to 0-1 before weighting. The formula produces a 0-100 score after multiplying by 100.

**Output:** Top 10 scored recommendations, each with: title suggestion, type (NEW or REFRESH), score, volume estimate, evidence summary, and the raw signal breakdown.

---

## 2. User Stories

**US-01: Get Data-Backed Recommendations**
As a publisher, I want to enter a category like "BMW engine maintenance" and receive a ranked list of specific articles to write, each backed by real data, so that I stop guessing what to write next.

**US-02: Understand Why Each Topic is Recommended**
As a content strategist, I want each recommendation to include a score breakdown (traffic potential, decay urgency, gap size, competition) so that I can evaluate and override the AI's reasoning when needed.

**US-03: See NEW vs REFRESH Distinction**
As an editor, I want recommendations clearly labeled as NEW (write from scratch) or REFRESH (update existing article) so that I know whether to create or revise.

**US-04: Pick and Generate**
As a publisher, I want to select one or more recommendations and have ChainIQ generate the articles using the existing pipeline so that the recommendation-to-draft flow is seamless.

**US-05: Adjust Category Scope**
As a content manager, I want to provide a broad or narrow category and get appropriately scoped recommendations so that I can plan at different levels (whole site vs single topic cluster).

**US-06: Exclude Already-Planned Topics**
As an editor managing a content calendar, I want to exclude topics that are already in my pipeline so that recommendations are always fresh and non-redundant.

**US-07: Save and Revisit Recommendations**
As a publisher, I want recommendation batches saved so that I can revisit them later without re-running the analysis (which consumes API credits).

**US-08: See Recommendations Without All Data Sources**
As a new user who only has GSC connected (no Semrush, no Ahrefs), I want useful recommendations based on available data, with clear indicators of what additional data sources would improve accuracy.

---

## 3. Acceptance Criteria

**AC-01:** Given a category input and a user with GSC data and content inventory, the recommender returns 10 scored recommendations within 60 seconds.

**AC-02:** Each recommendation includes: `title` (string), `type` ("NEW" or "REFRESH"), `score` (0-100), `target_keyword` (string), `estimated_monthly_volume` (number or null), `evidence` (string), `signals` object containing `{ impressions_norm, decay_severity, gap_size, seasonality_bonus, competition_inverse }`, and `refresh_url` (string, only for REFRESH type).

**AC-03:** The scoring formula is applied consistently: `priority = (impressions_norm * 0.3) + (decay_severity * 0.25) + (gap_size * 0.25) + (seasonality_bonus * 0.1) + (competition_inverse * 0.1)`. Each signal is normalized to 0-1 range.

**AC-04:** REFRESH recommendations include the URL of the existing article to refresh and the specific decay evidence from spec-03.

**AC-05:** NEW recommendations exclude any keyword the user's site already ranks for in positions 1-20 (per GSC data). If the site ranks 21+ for a keyword, it is still eligible as a NEW topic with a note: "You have weak existing coverage."

**AC-06:** The cannibalization guard prevents recommending a NEW article for a keyword where an existing page already ranks in positions 1-10. Instead, it recommends REFRESH of the existing page.

**AC-07:** If seasonality data is unavailable (Google Trends not connected), the seasonality_bonus defaults to 0.5 (neutral) for all recommendations. The UI shows "Seasonality data unavailable -- connect Google Trends for better timing."

**AC-08:** If Semrush/Ahrefs data is unavailable, the competition_inverse is estimated from GSC data: `competition_inverse = 1 - (avg_position / 100)` for queries the site already ranks for, or 0.5 (neutral) for gap queries. The UI shows a data quality indicator.

**AC-09:** Recommendation batches are stored in a `recommendation_batches` table with the full result set, input category, and timestamp. Users can view past batches.

**AC-10:** Selected recommendations flow into the existing Mode A pipeline via the SKILL.md orchestrator. The topic recommender output is passed as structured context to the research-engine agent.

**AC-11:** The agent markdown file (`agents/topic-recommender.md`) follows the established agent pattern: frontmatter with name/description/tools, structured prompt with input/output format, and error handling instructions.

**AC-12:** Recommendations are de-duplicated against: (a) existing content inventory URLs, (b) articles currently in the pipeline queue, (c) previously generated recommendations from the last 30 days.

---

## 4. UI/UX Description

Mode B is accessible from the main dashboard "Generate" page as a toggle between Mode A (keyword input) and Mode B (category-based recommendations). The recommendations view is a card-based layout with scoring breakdowns.

### ASCII Wireframe -- Mode B Recommendations View

```text
+------------------------------------------------------------------+
|  ChainIQ Dashboard                        [User] [Settings]      |
+----------+-------------------------------------------------------+
| Sidebar  |  GENERATE CONTENT                                     |
|          |                                                        |
| Overview |  [Mode A: Keyword] [Mode B: Recommendations]          |
| Articles |                                                        |
| Connect  |  Category: [BMW engine maintenance_______] [Analyze]  |
| Inventory|                                                        |
|>Generate |  Scope: [Broad v]  Exclude planned: [x]               |
| Intel    |                                                        |
| Quality  |  ===================== RESULTS =====================  |
| Publish  |                                                        |
| Perform  |  Data quality: [GSC] [GA4] [--Semrush--] [--Ahrefs--] |
|          |                                                        |
|          |  +----------------------------------------------------+|
|          |  | #1  Score: 94                          [x] Select  ||
|          |  | "N54 HPFP Failure Symptoms and Solutions"    [NEW]  ||
|          |  |                                                    ||
|          |  | Est. volume: 4,400/mo | Competition: Low           ||
|          |  | No existing coverage on your site                  ||
|          |  |                                                    ||
|          |  | Signals:                                           ||
|          |  | [======] Traffic potential  (0.92)                  ||
|          |  | [      ] Decay urgency     (0.00) -- N/A, new      ||
|          |  | [=====]  Gap size          (0.88)                  ||
|          |  | [===]    Seasonality       (0.60) -- peaks Oct     ||
|          |  | [======] Low competition   (0.95)                  ||
|          |  +----------------------------------------------------+|
|          |                                                        |
|          |  +----------------------------------------------------+|
|          |  | #2  Score: 87                          [x] Select  ||
|          |  | "Best BMW Tuning Platforms 2026"       [REFRESH]   ||
|          |  |                                                    ||
|          |  | Existing: /blog/best-tuning-platforms               ||
|          |  | Lost 34% traffic in 3 months | Data is 14mo old   ||
|          |  |                                                    ||
|          |  | Signals:                                           ||
|          |  | [====]   Traffic potential  (0.78)                  ||
|          |  | [======] Decay urgency     (0.92) -- DECLINING     ||
|          |  | [===]    Gap size          (0.55)                  ||
|          |  | [==]     Seasonality       (0.40) -- flat          ||
|          |  | [====]   Low competition   (0.80)                  ||
|          |  +----------------------------------------------------+|
|          |                                                        |
|          |  ... (8 more recommendations) ...                     |
|          |                                                        |
|          |  Selected: 2 topics    [Generate Selected Articles]   |
+----------+-------------------------------------------------------+
```

### Interaction Flow

1. User toggles to Mode B
2. User enters a category and clicks "Analyze"
3. Loading state shows progress: "Analyzing inventory... Checking decay... Finding gaps... Scoring opportunities..."
4. Results appear as scored cards, newest/highest first
5. User checks 1-3 recommendations via checkboxes
6. User clicks "Generate Selected Articles"
7. Each selected recommendation enters the existing pipeline queue (Mode A flow from research onward)
8. User is redirected to the pipeline queue page showing progress

### Signal Bars

Each signal in the breakdown is displayed as a horizontal bar chart (0 to 1.0 scale). The bar is color-coded: green > 0.7, yellow 0.4-0.7, red < 0.4. The numeric value is shown at the end. This gives an instant visual sense of which signals are driving the score.

---

## 5. Database Changes

```sql
-- Recommendation batches
CREATE TABLE recommendation_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'broad'
    CHECK (scope IN ('broad', 'narrow', 'cluster')),
  data_sources_used JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendation_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE recommendation_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own batches"
  ON recommendation_batches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own batches"
  ON recommendation_batches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_rec_batches_user_date
  ON recommendation_batches (user_id, created_at DESC);

-- Selected recommendations tracking
CREATE TABLE recommendation_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES recommendation_batches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_index INTEGER NOT NULL,
  target_keyword TEXT NOT NULL,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('NEW', 'REFRESH')),
  refresh_url TEXT,
  pipeline_job_id UUID REFERENCES pipeline_jobs(id),
  status TEXT NOT NULL DEFAULT 'selected'
    CHECK (status IN ('selected', 'queued', 'generating', 'completed', 'skipped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE recommendation_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own selections"
  ON recommendation_selections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own selections"
  ON recommendation_selections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own selections"
  ON recommendation_selections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_rec_selections_batch
  ON recommendation_selections (batch_id);

CREATE INDEX idx_rec_selections_status
  ON recommendation_selections (user_id, status)
  WHERE status != 'completed';

CREATE TRIGGER rec_selections_updated_at
  BEFORE UPDATE ON recommendation_selections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 6. API/Backend Changes

### New Agent: `agents/topic-recommender.md`

Markdown agent file following the established 4-agent pattern. Key sections:

**Frontmatter:**

```yaml
name: topic-recommender
description: Analyzes content inventory, performance data, and competitive gaps to recommend scored article topics
tools: [bridge-api, gemini-mcp]
input: category (string), userId (string), options (object)
output: recommendations (JSON array of scored topic objects)
```

**Agent Prompt Structure:**

1. **Context injection:** The orchestrator passes in pre-fetched data summaries:
   - Content inventory summary (top clusters, thin content list, coverage map)
   - Decay report (DECAYING and DECLINING URLs relevant to the category)
   - Gap analysis results (uncovered keywords in the category space)
   - Available data sources flag (which connectors are active)

2. **Analysis instructions:** The agent runs 6 analyses in sequence, each producing intermediate output that feeds the next.

3. **Scoring instructions:** The agent applies the weighted scoring formula and outputs a ranked JSON array.

4. **Output format enforcement:** Strict JSON schema with validation. The agent must return exactly 10 recommendations (or fewer if insufficient data) in the specified format.

### New Module: `bridge/intelligence/topic-recommender.js`

This module handles the data preparation, scoring computation, and result storage. The AI agent handles the creative analysis (gap identification, title generation, evidence synthesis). The bridge module handles the math.

| Method | Signature | Description |
| ------ | --------- | ----------- |
| `generateRecommendations(userId, category, options)` | `async (...) => RecommendationBatch` | Orchestrator: fetches all data, invokes agent, scores results, stores batch. |
| `prepareContext(userId, category)` | `async (...) => AnalysisContext` | Fetches inventory, decay, gap data filtered by category. Builds the context object passed to the agent. |
| `scoreRecommendation(signals)` | `(signals) => number` | Applies the weighted formula. Pure function. |
| `normalizeSignal(value, min, max)` | `(number, number, number) => number` | Normalizes a raw value to 0-1 range. |
| `deduplicateAgainstExisting(recommendations, inventory, pipelineQueue, recentBatches)` | `(...) => filteredRecommendations` | Removes recommendations for topics already covered, in queue, or recently recommended. |
| `classifyType(keyword, inventoryMap, gscData)` | `(...) => 'NEW' or 'REFRESH'` | Determines if the keyword maps to an existing page (REFRESH) or not (NEW). |
| `estimateVolume(keyword, gscData)` | `(...) => number or null` | Estimates monthly search volume from GSC impressions data. Returns null if insufficient data. |
| `storeBatch(userId, category, recommendations)` | `async (...) => batchId` | Stores the batch in `recommendation_batches`. |

**Scoring normalization strategy:**

Each of the 5 signals is normalized differently:

- `impressions_norm`: `min(impressions / 10000, 1.0)` -- 10K impressions is the ceiling
- `decay_severity`: Directly from spec-03 `decay_score` (already 0-1). 0 for NEW topics (no existing page)
- `gap_size`: `min(competitor_count_ranking / 5, 1.0)` -- if 5+ competitors rank and you do not, max score
- `seasonality_bonus`: `peak_month_within_8_weeks ? 0.8 : 0.5` -- binary boost if peak is imminent, neutral otherwise
- `competition_inverse`: `1.0 - min(avg_top10_word_count / 5000, 1.0)` -- thin SERP results = high opportunity

### SKILL.md Mode B Integration

The SKILL.md orchestrator is extended with a Mode B entry point. The flow:

```text
Mode B Flow:
1. User provides category via dashboard (POST /api/recommendations/generate)
2. Bridge calls topic-recommender.js.generateRecommendations()
3. topic-recommender.js fetches data context
4. topic-recommender.js invokes agents/topic-recommender.md via Claude CLI
5. Agent analyzes context, generates candidate topics
6. topic-recommender.js scores, deduplicates, ranks
7. Results returned to dashboard
8. User selects recommendations
9. Each selection enters the pipeline as a standard Mode A job:
   - keyword = recommendation.target_keyword
   - context = recommendation (passed as additional context to research-engine)
   - type = NEW or REFRESH (REFRESH passes existing URL for content analysis)
10. Pipeline proceeds: research-engine -> article-architect -> draft-writer
```

For REFRESH types, the existing article URL is passed to the research-engine with instructions to analyze the current content and identify what needs updating, new sections to add, and outdated information to replace.

### New Endpoints

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| `POST` | `/api/recommendations/generate` | User | Start recommendation generation. Body: `{ category, scope?, excludePlanned? }`. Returns `{ batchId }`. |
| `GET` | `/api/recommendations/batch/:batchId` | User | Get a specific recommendation batch with all recommendations. |
| `GET` | `/api/recommendations/batches` | User | List all batches for the user with summary (category, count, date). |
| `POST` | `/api/recommendations/select` | User | Select recommendations for generation. Body: `{ batchId, indices: [0, 1, 3] }`. Creates pipeline jobs. |
| `GET` | `/api/recommendations/selections` | User | List all selections with their pipeline status. |
| `DELETE` | `/api/recommendations/batch/:batchId` | User | Delete a recommendation batch. |

---

## 7. Frontend Components

Located in `dashboard/app/generate/`.

| Component | File | Description |
| --------- | ---- | ----------- |
| `GeneratePage` | `page.tsx` | Server component. Renders mode toggle (A/B) and the active mode's content. |
| `ModeToggle` | `components/mode-toggle.tsx` | Tab-style toggle between "Keyword" (Mode A) and "Recommendations" (Mode B). Persists selection in URL search params. |
| `CategoryInput` | `components/category-input.tsx` | Text input for category with scope selector dropdown (Broad/Narrow/Cluster) and "Exclude planned" checkbox. "Analyze" button. |
| `RecommendationList` | `components/recommendation-list.tsx` | Client component. Renders scored recommendation cards. Manages checkbox selection state. Shows "Generate Selected" button when selections exist. |
| `RecommendationCard` | `components/recommendation-card.tsx` | Individual card: rank number, score badge, title, type pill (NEW/REFRESH), volume, evidence, signal bars. Checkbox for selection. |
| `SignalBars` | `components/signal-bars.tsx` | Horizontal bar chart showing 5 normalized signals with labels and values. Color-coded by magnitude. |
| `DataQualityIndicator` | `components/data-quality.tsx` | Shows which data sources are connected (filled icon) vs missing (grayed icon). Tooltip explains impact of missing sources. |
| `AnalysisProgress` | `components/analysis-progress.tsx` | Multi-step progress indicator shown during analysis: "Analyzing inventory... Checking decay... Finding gaps... Scoring..." Each step updates as it completes. |
| `BatchHistory` | `components/batch-history.tsx` | Sidebar or dropdown showing past recommendation batches. Click to load a previous batch. |
| `GenerateSelectedButton` | `components/generate-selected.tsx` | Floating action button (bottom-right or bottom bar) showing selection count and triggering pipeline queue creation. |

---

## 8. Test Plan

All tests use `node:test`. Located in `tests/recommendations/`.

### Unit Tests (`tests/recommendations/scoring.test.js`)

| # | Test | Verifies |
| - | ---- | -------- |
| 1 | Score formula with all signals at 1.0 produces 100 | Maximum score |
| 2 | Score formula with all signals at 0.0 produces 0 | Minimum score |
| 3 | Score formula with known inputs produces expected output | e.g., (0.8, 0.5, 0.7, 0.3, 0.9) = specific value |
| 4 | Weights sum to 1.0 | 0.3 + 0.25 + 0.25 + 0.1 + 0.1 = 1.0 |
| 5 | Impressions normalization: 5000 impressions = 0.5 | Linear scale to 10K ceiling |
| 6 | Impressions normalization: 15000 impressions = 1.0 (capped) | Ceiling enforcement |
| 7 | Competition inverse: avg 1000 words = 0.8 | Low word count = high opportunity |
| 8 | Competition inverse: avg 5000+ words = 0.0 | Saturated SERP |
| 9 | Seasonality bonus: peak in 4 weeks = 0.8 | Imminent peak boost |
| 10 | Seasonality bonus: peak in 20 weeks = 0.5 | Neutral (far away) |

### Classification Tests (`tests/recommendations/classifier.test.js`)

| # | Test | Verifies |
| - | ---- | -------- |
| 11 | Keyword with no existing coverage = NEW | Type classification |
| 12 | Keyword with existing page ranked 5 = REFRESH | Cannibalization guard |
| 13 | Keyword with existing page ranked 25 = NEW with note | Weak coverage |
| 14 | Keyword already in pipeline queue = excluded | De-duplication |
| 15 | Keyword recommended in last 30 days = excluded | Recent batch dedup |

### Integration Tests (`tests/recommendations/pipeline.test.js`)

| # | Test | Verifies |
| - | ---- | -------- |
| 16 | Full generation with mock data produces 10 recommendations | End-to-end flow |
| 17 | Recommendations are sorted by score descending | Ordering |
| 18 | REFRESH recommendations include refresh_url | URL attachment |
| 19 | Batch is stored in database | Persistence |
| 20 | Selection creates pipeline jobs | Queue integration |

### Endpoint Tests (`tests/recommendations/api.test.js`)

| # | Test | Verifies |
| - | ---- | -------- |
| 21 | `POST /api/recommendations/generate` requires auth | 401 without token |
| 22 | `POST /api/recommendations/generate` requires category | 400 without category field |
| 23 | `GET /api/recommendations/batch/:id` returns correct batch | Data retrieval |
| 24 | `POST /api/recommendations/select` with invalid indices returns 400 | Validation |
| 25 | `GET /api/recommendations/batches` returns newest first | Sort order |

### Data Quality Tests (`tests/recommendations/data-quality.test.js`)

| # | Test | Verifies |
| - | ---- | -------- |
| 26 | GSC-only user gets recommendations (no Semrush/Ahrefs) | Graceful degradation |
| 27 | Missing seasonality data defaults to 0.5 | Neutral fallback |
| 28 | Missing competition data defaults to 0.5 | Neutral fallback |
| 29 | Data quality indicator reflects connected sources | UI accuracy |

---

## 9. Rollout Plan

### Phase 1: Scoring Engine (Week 7)

1. Implement `scoreRecommendation()`, `normalizeSignal()`, and all pure scoring functions
2. Write unit tests 1-10 (scoring) and 11-15 (classification)
3. Implement `deduplicateAgainstExisting()` with all three dedup checks
4. Run `migrations` for `recommendation_batches` and `recommendation_selections`

### Phase 2: Agent + Data Pipeline (Week 8-9)

1. Write `agents/topic-recommender.md` following the established agent pattern
2. Implement `prepareContext()` -- data fetching and aggregation from inventory + decay + GSC
3. Implement `generateRecommendations()` orchestrator
4. Test agent with real SRMG data (Arabic category input)
5. Write integration tests 16-20

### Phase 3: API + Dashboard (Week 9-10)

1. Implement 6 API endpoints in `routes/recommendations.js`
2. Build Mode B UI: ModeToggle, CategoryInput, RecommendationList, RecommendationCard
3. Build SignalBars component with color coding
4. Build DataQualityIndicator
5. Write endpoint tests 21-29

### Phase 4: Pipeline Integration (Week 10-11)

1. Extend SKILL.md with Mode B entry point
2. Wire "Generate Selected" to create pipeline jobs with recommendation context
3. Implement REFRESH flow: pass existing URL to research-engine
4. Test full Mode B to generated article flow end-to-end
5. Test with users who have only GSC (no Semrush/Ahrefs) to verify graceful degradation

### Feature Flags

- `ENABLE_MODE_B=true/false` -- Master toggle for Mode B UI
- `RECOMMENDER_MAX_RESULTS=10` -- Number of recommendations per batch
- `RECOMMENDER_DEDUP_WINDOW_DAYS=30` -- How far back to check for duplicate recommendations
- `RECOMMENDER_MIN_IMPRESSIONS=100` -- Minimum GSC impressions for a keyword to be considered

### Rollback Strategy

Mode B is entirely additive to the existing Mode A flow:

1. Set `ENABLE_MODE_B=false` to hide the Mode B toggle in the dashboard
2. Mode A continues to work exactly as before
3. The `recommendation_batches` and `recommendation_selections` tables are independent -- no impact on existing tables
4. The topic-recommender agent file can be removed without affecting the existing 4-agent pipeline

---

## 10. Accessibility and Mobile

### Accessibility (WCAG 2.1 AA)

- **Mode toggle:** Implemented as `role="tablist"` with `role="tab"` children. `aria-selected="true"` on the active mode. Keyboard navigation: left/right arrows switch tabs, Tab moves to the panel content.
- **Category input:** `<label>` associated with input via `for`. Autocomplete suggestions (if implemented) use `role="listbox"` with `role="option"` children. `aria-activedescendant` tracks the highlighted suggestion.
- **Recommendation cards:** Each card is a `<article>` element with `aria-label` summarizing the recommendation: "Recommendation 1: N54 HPFP Failure Symptoms, score 94, new article." The checkbox has a descriptive `aria-label`: "Select recommendation 1 for generation."
- **Signal bars:** Each bar has `role="meter"` with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="1"`, and `aria-label` describing the signal: "Traffic potential: 0.92 out of 1.0." Screen readers announce the value without needing to see the visual bar.
- **Score badge:** Not color-only. The numeric score is always visible. Color provides supplementary information (green > 80, yellow 50-80, red < 50).
- **Data quality indicator:** Each source icon has `aria-label`: "Google Search Console: connected" or "Semrush: not connected." Tooltip content is also accessible via `aria-describedby`.
- **Analysis progress:** Uses `role="status"` with `aria-live="polite"`. Each step update is announced: "Step 3 of 6: Finding keyword gaps."
- **Generate selected button:** `aria-label` includes count: "Generate 2 selected articles." Disabled state uses `aria-disabled="true"` when nothing is selected.

### Mobile Responsiveness

- **Mode toggle:** Full-width tabs on mobile. Each tab takes 50% width. Large touch targets (minimum 44px height).
- **Category input:** Full-width. Scope selector and exclude checkbox stack below the input on mobile (< 768px).
- **Recommendation cards:** Full-width single column. Score badge and type pill are on the same line as the title. Signal bars are collapsed by default -- "Show breakdown" expandable section.
- **Selection flow:** Selected count and "Generate" button appear in a sticky bottom bar (fixed position, 60px height) on mobile. Visible at all scroll positions.
- **Batch history:** Accessible via a "History" button in the page header (not a sidebar) on mobile. Opens as a full-screen modal list.
- **Analysis progress:** Full-width progress indicator below the category input. Steps shown as compact pill badges rather than full-text labels.

### RTL Support

- Mode toggle tabs flow right-to-left. First tab (Mode A) appears on the right.
- Category input text aligns right. Placeholder text is in Arabic when locale is Arabic.
- Recommendation cards: score badge anchored to the start edge (right in RTL). Type pill follows score. Signal bar labels align to start edge, bars fill from right to left.
- "Generate Selected" button text is right-aligned with the count. Button icon (if any) appears on the right side.
- Evidence text and title suggestions support Arabic characters and mixed LTR/RTL content (e.g., English brand names within Arabic sentences) via Unicode Bidirectional Algorithm. No explicit `dir` overrides needed for inline mixed content.
