# CI-002: Gap Analyzer & Cannibalization Detector

> **Phase:** 6 | **Priority:** P0 | **Status:** NOT STARTED
> **Effort:** L (12h) | **Type:** feature
> **Sprint:** 4 (Weeks 7-8)
> **Depends On:** DI-002 (GSC data), DI-004 (content_inventory), CI-001 (decay detector for status data)
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `dev_docs/services/content-intelligence.md` — Gap Analysis and Cannibalization Detection specs, API endpoints, resolution strategies
3. `dev_docs/services/data-ingestion.md` — KeywordOpportunity entity definition, PerformanceSnapshot structure
4. `PROJECT-BRIEF.md` — Section 4, Layer 2 (Gap Analysis and Cannibalization Guard descriptions)
5. `bridge/supabase-client.js` — database operations pattern

## Objective
Build the keyword gap analyzer that identifies high-impression keywords without dedicated pages, and the cannibalization detector that finds multiple URLs competing for the same query. Create the `keyword_opportunities` database table, implement four cannibalization resolution strategies (merge, redirect, differentiate, deoptimize), and expose results via API endpoints.

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `bridge/intelligence/gap-analyzer.js` | Keyword gap analysis engine |
| CREATE | `bridge/intelligence/cannibalization.js` | Cannibalization detection and resolution engine |
| CREATE | `migrations/010-keyword-opportunities.sql` | keyword_opportunities table, RLS, indexes |
| MODIFY | `bridge/server.js` | Register endpoints: `/api/intelligence/gaps`, `/api/intelligence/cannibalization` |

## Sub-tasks

### Sub-task 1: Create keyword_opportunities migration (~2h)
- Create `migrations/010-keyword-opportunities.sql` with the `keyword_opportunities` table matching the entity spec in `content-intelligence.md`:
  - Columns: `id` (UUID), `user_id` (UUID FK), `keyword` (text), `opportunity_type` (text), `priority_score` (numeric(5,2)), `impressions` (integer), `clicks` (integer), `current_position` (numeric(6,2) nullable), `competing_urls` (text[]), `recommended_action` (text), `target_url` (text nullable), `status` (text, default 'open'), `analysis_metadata` (JSONB, default '{}'), `created_at` (timestamptz), `updated_at` (timestamptz)
  - Unique constraint: `(user_id, keyword, opportunity_type)` — upsert on each analysis run
  - Indexes: `(user_id, priority_score DESC)` for ranked lists, `(user_id, opportunity_type, status)` for filtered views, `(user_id, status)` for open opportunity counts
  - RLS: users see only their own opportunities
  - `updated_at` trigger function

### Sub-task 2: Build gap analyzer (~4h)
- Create `bridge/intelligence/gap-analyzer.js` exporting a `GapAnalyzer` class
- **`findKeywordGaps(userId)`** — Identify keywords with impressions but no dedicated content:
  - Query `performance_snapshots` (source='gsc') for user: extract all unique queries from `metadata.topQueries`
  - For each query with significant impressions (>= 500/month threshold), check if a dedicated page exists in `content_inventory`:
    - "Dedicated" means the URL's title or H1 closely matches the query (fuzzy match with normalized comparison)
    - A page that ranks incidentally for a query (appears in topQueries but query is not the primary topic) is a gap
  - Score each gap opportunity:
    - `impressions_component`: normalize monthly impressions to 0-30 scale (30 = 10K+ impressions)
    - `position_component`: if currently ranking at position 15-50, score higher (improvable); not ranking at all = highest score
    - `competition_component`: if query appears in metadata with many results having thin content, score higher
  - Write gaps as `keyword_opportunities` with `opportunity_type: 'gap'` and `recommended_action: 'create_new'`
- **`detectCompetitors(userId)`** — Auto-detect competitors:
  - From GSC data metadata, identify domains that repeatedly appear in SERP results for the user's top queries
  - If Semrush/Ahrefs data is available (via CI-004 later), use their domain analytics
  - Return top 5 competitors by keyword overlap count
  - Store competitor data in `analysis_metadata.gap.competitor_urls` and `competitor_avg_position`

### Sub-task 3: Build cannibalization detector (~4h)
- Create `bridge/intelligence/cannibalization.js` exporting a `CannibalizationDetector` class
- **`detectCannibalization(userId)`** — Find multiple URLs competing for same queries:
  - Query `performance_snapshots` (source='gsc') metadata: for each query, collect all URLs that rank for it
  - Flag cannibalization when: 2+ URLs rank for the same query AND both are within positions 1-50 AND the query has >= 100 impressions/month
  - For each cannibalized keyword group, determine:
    - `primary_url`: the URL with highest clicks for this query
    - `secondary_urls`: other competing URLs
    - `impression_split`: how impressions are divided between competing URLs
    - `position_variance`: spread of positions across competing URLs
  - Write cannibalization conflicts as `keyword_opportunities` with `opportunity_type: 'cannibalization'`
- **Four resolution strategies** — stored in `recommended_action`:
  1. **`merge`**: Combine content from secondary URLs into primary. Recommended when secondary URLs have unique content that would strengthen the primary page. Criteria: both pages on same subtopic, secondary has <30% of primary's traffic.
  2. **`redirect`**: 301 redirect secondary URLs to primary. Recommended when secondary is thin or duplicate. Criteria: secondary has <100 clicks/month AND content overlap >80%.
  3. **`differentiate`**: Rewrite secondary URL to target a distinct but related keyword. Recommended when both pages are substantial. Criteria: both have >200 clicks/month, content is genuinely different but titles/H1s overlap.
  4. **`deoptimize`**: Remove target keyword optimization from secondary URL (update title, H1, internal links). Recommended when secondary is valuable for other keywords. Criteria: secondary ranks for other high-value keywords, cannibalization is incidental.
- **Strategy selection logic:** Automated recommendation based on traffic split, content overlap, and secondary URL value. Each strategy includes a confidence score (0-100).
- **`resolveConflict(opportunityId, strategy)`** — Apply a resolution:
  - Update the `keyword_opportunities` record with chosen strategy
  - Set `status: 'accepted'`
  - Generate specific action items (e.g., "Merge /blog/post-a into /blog/post-b, then 301 redirect")
  - Does NOT auto-execute — provides instructions for the user to implement

### Sub-task 4: Register API endpoints (~2h)
- **`GET /api/intelligence/gaps`** — Authenticated. Returns keyword gaps:
  - Response: `{ gaps: [...], total: N }` with each gap including keyword, impressions, position, score, recommended_action
  - Query params: `?min_impressions=500&sort=score_desc&page=1&per_page=25`
- **`GET /api/intelligence/gaps/competitors`** — Authenticated. Returns detected competitors with overlap metrics.
- **`GET /api/intelligence/cannibalization`** — Authenticated. Returns all cannibalization conflicts:
  - Response: `{ conflicts: [...], total: N }` with each conflict including keyword, competing_urls, impression_split, recommended_strategy, confidence
  - Query params: `?sort=impressions_desc&page=1&per_page=25`
- **`GET /api/intelligence/cannibalization/:keyword`** — Authenticated. Returns detail for a specific keyword conflict including all competing URLs with individual metrics.
- **`POST /api/intelligence/cannibalization/:id/resolve`** — Authenticated. Accepts `{ strategy: 'merge'|'redirect'|'differentiate'|'deoptimize' }`. Calls `resolveConflict()` and returns action items.

## Acceptance Criteria
- [ ] `migrations/010-keyword-opportunities.sql` creates table with all fields, unique constraint, indexes, RLS
- [ ] Gap analyzer identifies keywords with >= 500 impressions/month without dedicated content
- [ ] Gap scoring correctly weighs impressions, current position, and competition
- [ ] Cannibalization detector finds 2+ URLs ranking for the same query
- [ ] Four resolution strategies are correctly recommended based on traffic split and content overlap
- [ ] Strategy selection includes confidence scores
- [ ] `GET /api/intelligence/gaps` returns scored gap opportunities with pagination
- [ ] `GET /api/intelligence/cannibalization` returns conflict groups with resolution recommendations
- [ ] `POST /api/intelligence/cannibalization/:id/resolve` accepts strategy and returns actionable steps
- [ ] Results are written to `keyword_opportunities` with correct upsert behavior
- [ ] Competitor auto-detection identifies top 5 competing domains
- [ ] Zero npm dependencies

## Test Requirements

### Unit Tests
- Gap detection: query with 1000 impressions and no matching content_inventory title = gap
- Gap detection: query matching a content title exactly = not a gap
- Cannibalization: 2 URLs ranking for same query within top 50 = conflict
- Cannibalization: 2 URLs but one is position 80 = not a conflict (outside top 50)
- Strategy selection: secondary URL with 50 clicks, 85% content overlap = `redirect`
- Strategy selection: both URLs with 500+ clicks, different content = `differentiate`
- Strategy selection: secondary ranks for other valuable keywords = `deoptimize`
- Impression split calculation is correct (percentages sum to 100)

### Integration Tests
- Full gap analysis with sample GSC data → correct opportunities written to keyword_opportunities
- Full cannibalization scan → correct conflicts detected with strategy recommendations
- Resolve endpoint updates status and returns actionable steps
- Competitor detection returns top domains by overlap count

## Dependencies
- Blocked by: DI-002 (GSC query data), DI-004 (content_inventory for matching)
- Blocks: CI-003 (topic recommender uses gap scores), CI-005 (dashboard gap and cannibalization tabs)
