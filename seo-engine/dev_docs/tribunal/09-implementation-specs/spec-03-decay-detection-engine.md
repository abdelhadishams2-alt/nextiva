# Spec 03: Content Decay Detection Engine

**Priority:** Must Have (MoSCoW #11)
**Phase:** A (Weeks 1-6)
**Effort:** L (2-4 weeks)
**Dependencies:** GSC Client (#2), Content Inventory (#7)
**Blocks:** Topic Recommender (#14), Content Lifecycle Status (#79), Churn Prediction (#82), Auto-refresh Triggers (#93)

---

## 1. Feature Overview

The decay detection engine is the first intelligence output a user sees after connecting their data. It answers the question every publisher asks: "Which of my articles are losing traffic, and what should I do about each one?"

The engine analyzes performance data from GSC (clicks, impressions, position) and content inventory metadata (age, word count) to classify every URL into one of four health statuses: HEALTHY, DECAYING, DECLINING, or DEAD. It then generates a refresh decision for each non-healthy URL: partial refresh, full rewrite, or retire with 301 redirect.

The implementation lives in `bridge/intelligence/decay-detector.js` and uses four detection methods in sequence:

1. **GSC Click Decline** -- Compares the last 30 days of clicks against the previous 60 days (3-month window). A 20%+ drop triggers DECAYING status. A 50%+ drop triggers DECLINING.

2. **Position Drift** -- Tracks average position over 3 months. A page that moved from page 1 (positions 1-10) to page 2+ (positions 11+) is flagged as DECLINING. Position improvements override click declines (the page may have lost featured snippet but gained regular position).

3. **Content Age Triggers** -- Articles older than 18 months with no modification date within the last 6 months are flagged as at-risk. Articles older than 24 months with declining impressions are flagged DECAYING regardless of click volume.

4. **Cannibalization Signal** -- If two or more pages from the same site compete for the same query (both appearing in GSC data for the same keyword), the lower-performing page is flagged with a `cannibalization_risk` flag. This is a preliminary signal -- full cannibalization analysis is a separate feature (#13) but the decay detector surfaces the early warning.

The engine is ported from concepts in `Master Kit 36-seo/content-seo/content-decay-refresh.md` and adapted to ChainIQ's data model. It runs automatically after each GSC data pull and can be triggered manually via the dashboard.

---

## 2. User Stories

**US-01: See Decaying Content**
As a publisher, I want to see which articles are losing traffic so that I can prioritize content refreshes before rankings drop further.

**US-02: Understand Decay Severity**
As a content strategist, I want articles classified by severity (healthy/decaying/declining/dead) so that I can triage my refresh queue by urgency.

**US-03: Get Refresh Recommendations**
As an editor, I want each decaying article to include a specific recommendation (partial refresh, full rewrite, or retire) so that I know how much effort each fix requires.

**US-04: See Decay Evidence**
As a data-driven publisher, I want to see the specific metrics behind each decay classification (e.g., "clicks dropped 34% from 1,420 to 938 over 3 months") so that I trust the recommendation.

**US-05: Filter by Decay Status**
As a content manager with 5,000+ articles, I want to filter my inventory by decay status and sort by severity so that I focus on the most impactful refreshes first.

**US-06: Track Decay Over Time**
As a publisher, I want to see how my overall content health changes month over month (% healthy, % decaying) so that I can measure whether my refresh efforts are working.

**US-07: Detect Cannibalization Early**
As an SEO specialist, I want the decay detector to flag articles that might be cannibalizing each other so that I can investigate and consolidate before both pages lose rankings.

---

## 3. Acceptance Criteria

**AC-01:** The engine processes all URLs in `content_inventory` that have corresponding GSC data in `performance_snapshots`. URLs without GSC data are classified as UNKNOWN (not enough data).

**AC-02:** A URL with 20-49% click decline over 3 months (comparing last 30 days to the preceding 60-day average) is classified DECAYING.

**AC-03:** A URL with 50%+ click decline over 3 months is classified DECLINING.

**AC-04:** A URL with fewer than 10 clicks in the last 90 days and fewer than 100 impressions is classified DEAD (regardless of trend direction -- the content has no meaningful traffic).

**AC-05:** A URL with stable or growing clicks (less than 20% decline) is classified HEALTHY.

**AC-06:** Position drift overrides click classification: if a page moved from average position <= 10 to average position > 15 over 3 months, it is upgraded to at least DECLINING, even if click decline is < 50%.

**AC-07:** Content age flag: articles with `publish_date` > 18 months ago AND no `modified_date` within the last 6 months receive an `age_risk: true` flag, which adds 0.2 to the decay score (used by the topic recommender for prioritization).

**AC-08:** Cannibalization signal: if two or more URLs share 3+ identical GSC queries where each URL receives at least 10 impressions for that query, the lower-performing URL receives a `cannibalization_risk: true` flag.

**AC-09:** Each non-HEALTHY URL receives a refresh decision:

- **PARTIAL_REFRESH** -- DECAYING status, word count >= 1500, position still on page 1-2. Action: update stats, add new sections, refresh intro/conclusion.
- **FULL_REWRITE** -- DECLINING status or word count < 1000 or position dropped below page 3. Action: complete rewrite with new research.
- **RETIRE_301** -- DEAD status for 90+ days or cannibalization_risk with a clearly superior competing page. Action: 301 redirect to best alternative URL.

**AC-10:** The engine returns a JSON array of `DecayReport` objects, each containing: `url`, `title`, `status` (HEALTHY/DECAYING/DECLINING/DEAD), `click_change_pct`, `position_change`, `current_clicks_30d`, `previous_clicks_60d_avg`, `age_risk`, `cannibalization_risk`, `cannibalization_urls` (array), `refresh_decision`, `evidence` (human-readable string explaining the classification), `decay_score` (0-1 float used for sorting).

**AC-11:** The engine completes analysis for 10,000 URLs in under 30 seconds (pure computation on already-fetched data, no HTTP calls).

**AC-12:** Results are stored in a `decay_reports` JSONB column on the `content_inventory` table (or a separate `decay_analysis` table if preferred for query performance). Results include a `analyzed_at` timestamp.

---

## 4. UI/UX Description

Decay detection results are displayed on the Intelligence page (or as a tab within the Content Inventory page). The primary view is a filtered table with summary statistics at the top.

### ASCII Wireframe -- Decay Detection View

```text
+------------------------------------------------------------------+
|  ChainIQ Dashboard                        [User] [Settings]      |
+----------+-------------------------------------------------------+
| Sidebar  |  CONTENT HEALTH                    [Run Analysis]     |
|          |                                                        |
| Overview |  Last analysis: 2026-03-28 03:15                      |
| Articles |                                                        |
| Connect  |  +----------+ +----------+ +----------+ +----------+  |
| Inventory|  | HEALTHY  | | DECAYING | | DECLINING| |   DEAD   |  |
|>Intel    |  |   612    | |   147    | |    68    | |    20    |  |
| Quality  |  |  72.3%   | |  17.3%   | |   8.0%   | |   2.4%   |  |
| Publish  |  +----------+ +----------+ +----------+ +----------+  |
| Perform  |                                                        |
|          |  Filter: [DECAYING v]  Sort: [Severity v]             |
|          |                                                        |
|          |  +----------------------------------------------------+|
|          |  | URL / Title         | Clicks | Change | Decision   ||
|          |  |---------------------|--------|--------|------------||
|          |  | /blog/n54-hpfp...   |   938  | -34%   | PARTIAL    ||
|          |  |  "N54 HPFP Failure" |        |  v     | REFRESH    ||
|          |  |  Evidence: Clicks dropped from 1,420 avg to 938    ||
|          |  |  in the last 30 days. Position stable at 8.2.      ||
|          |  |---------------------|--------|--------|------------||
|          |  | /blog/best-tuning.. |   420  | -52%   | FULL       ||
|          |  |  "Best BMW Tuning"  |        |  vv    | REWRITE    ||
|          |  |  Evidence: 52% click decline + position dropped    ||
|          |  |  from 6.1 to 14.3 (page 1 -> page 2).             ||
|          |  +----------------------------------------------------+|
+----------+-------------------------------------------------------+
```

### Summary Cards Behavior

The four summary cards at the top are clickable filters. Clicking "DECAYING" filters the table to show only decaying content. Clicking the already-active filter clears it (shows all). The active card has a highlighted border.

### Evidence Expandable Row

Each table row is expandable. The collapsed view shows URL, title, clicks, change percentage, and decision. Expanding reveals the full evidence string, position history sparkline (last 90 days), cannibalization warnings, and a "Start Refresh" action button that pre-fills the article generation pipeline with the URL and refresh type.

---

## 5. Database Changes

The decay analysis results are stored as a JSONB column on the existing `content_inventory` table (added via ALTER TABLE) plus a dedicated analysis tracking table:

```sql
-- Add decay analysis columns to content_inventory
ALTER TABLE content_inventory
  ADD COLUMN IF NOT EXISTS decay_status TEXT DEFAULT 'unknown'
    CHECK (decay_status IN ('healthy', 'decaying', 'declining', 'dead', 'unknown')),
  ADD COLUMN IF NOT EXISTS decay_score REAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS decay_report JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS decay_analyzed_at TIMESTAMPTZ;

-- Index for filtering by decay status
CREATE INDEX idx_inventory_decay_status
  ON content_inventory (user_id, decay_status)
  WHERE decay_status != 'healthy';

-- Index for sorting by decay severity
CREATE INDEX idx_inventory_decay_score
  ON content_inventory (user_id, decay_score DESC)
  WHERE decay_status != 'healthy';

-- Decay analysis history (one row per analysis run)
CREATE TABLE decay_analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_urls INTEGER NOT NULL,
  healthy_count INTEGER NOT NULL DEFAULT 0,
  decaying_count INTEGER NOT NULL DEFAULT 0,
  declining_count INTEGER NOT NULL DEFAULT 0,
  dead_count INTEGER NOT NULL DEFAULT 0,
  unknown_count INTEGER NOT NULL DEFAULT 0,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE decay_analysis_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own decay runs"
  ON decay_analysis_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own decay runs"
  ON decay_analysis_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_decay_runs_user_date
  ON decay_analysis_runs (user_id, analyzed_at DESC);
```

---

## 6. API/Backend Changes

### New Module: `bridge/intelligence/decay-detector.js`

Exports a class `DecayDetector` with the following methods:

| Method | Signature | Description |
| ------ | --------- | ----------- |
| `analyze(userId)` | `async (userId) => DecayReport[]` | Main entry point. Fetches inventory + performance data, runs all 4 detection methods, classifies each URL, generates refresh decisions, stores results, returns report array. |
| `classifyClickDecline(current30d, previous60dAvg)` | `(number, number) => { status, changePct }` | Pure function. Computes percentage change. Returns status and magnitude. |
| `classifyPositionDrift(positions90d)` | `(number[]) => { drifted, fromAvg, toAvg }` | Pure function. Compares first-30-day avg position to last-30-day avg. Flags page 1 to page 2+ drift. |
| `detectContentAge(publishDate, modifiedDate)` | `(Date, Date?) => { ageRisk, ageMonths }` | Pure function. Checks 18-month and 24-month thresholds. |
| `detectCannibalization(userQueryData)` | `(Map<query, url[]>) => Map<url, cannibalizationInfo>` | Identifies queries where multiple user URLs compete. Groups by query, flags lower performers. |
| `generateRefreshDecision(status, wordCount, avgPosition, ageRisk, cannibalizationRisk)` | `(...) => 'PARTIAL_REFRESH' or 'FULL_REWRITE' or 'RETIRE_301' or null` | Decision matrix function. Null for HEALTHY URLs. |
| `buildEvidence(url, metrics)` | `(string, object) => string` | Generates human-readable evidence string for the UI. |
| `computeDecayScore(changePct, positionDrift, ageRisk, cannibalizationRisk)` | `(...) => number (0-1)` | Composite score for sorting. Higher = more urgent. |

**Decay Score Formula:**

```javascript
function computeDecayScore(clickChangePct, positionDrift, ageRisk, cannibalizationRisk) {
  // clickChangePct is negative for declines, e.g., -0.34 for 34% decline
  const clickComponent = Math.min(Math.abs(clickChangePct), 1.0) * 0.4;

  // positionDrift: positive means positions got worse (higher number)
  const positionComponent = Math.min(Math.max(positionDrift / 20, 0), 1.0) * 0.3;

  // Binary flags
  const ageComponent = ageRisk ? 0.15 : 0;
  const cannibComponent = cannibalizationRisk ? 0.15 : 0;

  return Math.min(clickComponent + positionComponent + ageComponent + cannibComponent, 1.0);
}
```

**Data flow:**

1. Fetch all `content_inventory` rows for the user
2. Fetch `performance_snapshots` for the last 90 days for all user URLs
3. Group snapshots by URL, compute 30-day and 60-day aggregates
4. Run `classifyClickDecline` on each URL
5. Run `classifyPositionDrift` on each URL
6. Run `detectContentAge` using inventory metadata
7. Run `detectCannibalization` across all URLs
8. Combine signals, compute final status and decay score
9. Generate refresh decisions
10. Batch update `content_inventory` with decay columns
11. Insert a row into `decay_analysis_runs` with summary counts
12. Return full report array

### New Endpoints in `bridge/routes/intelligence.js`

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| `POST` | `/api/intelligence/decay/analyze` | User | Trigger a decay analysis. Returns `{ jobId }`. Runs async. |
| `GET` | `/api/intelligence/decay/report` | User | Latest decay report. Query: `?status=decaying&sort=score&page=1&limit=50`. |
| `GET` | `/api/intelligence/decay/summary` | User | Summary counts: healthy, decaying, declining, dead, unknown. Plus trend vs last analysis. |
| `GET` | `/api/intelligence/decay/history` | User | Historical analysis runs with counts over time (for trend chart). |
| `GET` | `/api/intelligence/decay/url/:urlId` | User | Full decay detail for a single URL including evidence, position history, and cannibalization info. |

---

## 7. Frontend Components

Located in `dashboard/app/intelligence/`.

| Component | File | Description |
| --------- | ---- | ----------- |
| `DecayDashboard` | `decay/page.tsx` | Server component. Fetches summary and latest report. Renders layout with summary cards and table. |
| `DecaySummaryCards` | `components/decay-summary.tsx` | Four clickable cards (Healthy/Decaying/Declining/Dead) with counts and percentages. Active card has accent border. |
| `DecayTable` | `components/decay-table.tsx` | Client component. Filterable, sortable table with expandable rows. Columns: title/URL, clicks, change%, decision. |
| `DecayDetailRow` | `components/decay-detail.tsx` | Expandable row content: evidence text, position sparkline, cannibalization warning, "Start Refresh" button. |
| `DecayTrendChart` | `components/decay-trend.tsx` | Line chart (or stacked area) showing health distribution over time from `decay_analysis_runs`. Uses CSS-based chart (no charting library per zero-dep frontend spirit) or shadcn/recharts. |
| `PositionSparkline` | `components/position-sparkline.tsx` | Inline SVG sparkline showing 90-day position trend. Red if worsening, green if improving, gray if stable. |
| `RefreshActionButton` | `components/refresh-action.tsx` | Button that navigates to the article generation page with pre-filled URL and refresh type (partial/full/retire). |

---

## 8. Test Plan

All tests use `node:test`. Located in `tests/intelligence/`.

### Unit Tests (`tests/intelligence/decay-detector.test.js`)

| # | Test | Verifies |
| - | ---- | -------- |
| 1 | 25% click decline classifies as DECAYING | Boundary: exactly 20% is threshold |
| 2 | 19% click decline classifies as HEALTHY | Just below threshold |
| 3 | 55% click decline classifies as DECLINING | Above 50% threshold |
| 4 | Zero clicks in 90 days with < 100 impressions = DEAD | Dead content detection |
| 5 | Position 8 to 14 flags as position drift | Page 1 to page 2 transition |
| 6 | Position 8 to 9 does NOT flag as drift | Still on page 1 |
| 7 | 20-month-old article without modification = age_risk true | Age trigger works |
| 8 | 20-month-old article modified 2 months ago = age_risk false | Recent modification clears risk |
| 9 | Two URLs sharing 3+ queries flags cannibalization | Cannibalization detection |
| 10 | Two URLs sharing only 2 queries does NOT flag | Below threshold |
| 11 | DECAYING + 2000 words + page 1 = PARTIAL_REFRESH | Decision matrix: partial |
| 12 | DECLINING + 600 words = FULL_REWRITE | Decision matrix: rewrite due to thin content |
| 13 | DEAD for 90+ days = RETIRE_301 | Decision matrix: retire |
| 14 | Decay score formula produces 0 for healthy content | Score boundary |
| 15 | Decay score formula produces ~1.0 for worst case | Max score boundary |
| 16 | Position improvement overrides mild click decline | Growing page not flagged as decaying |

### Integration Tests (`tests/intelligence/decay-integration.test.js`)

| # | Test | Verifies |
| - | ---- | -------- |
| 17 | Full analysis on 100 URLs completes < 5s | Performance requirement |
| 18 | Results stored in content_inventory.decay_report | Database write works |
| 19 | Summary counts match individual classifications | Consistency check |
| 20 | Re-running analysis updates (not duplicates) results | Idempotent behavior |

### Endpoint Tests (`tests/intelligence/decay-api.test.js`)

| # | Test | Verifies |
| - | ---- | -------- |
| 21 | `GET /api/intelligence/decay/report` requires auth | 401 without token |
| 22 | `GET /api/intelligence/decay/report?status=decaying` filters correctly | Only DECAYING results returned |
| 23 | `GET /api/intelligence/decay/summary` returns correct shape | All four counts present |
| 24 | `GET /api/intelligence/decay/url/:urlId` returns evidence | Full detail for single URL |

---

## 9. Rollout Plan

### Phase 1: Core Detection (Week 1)

1. Implement `classifyClickDecline` and `classifyPositionDrift` pure functions
2. Implement `generateRefreshDecision` decision matrix
3. Write unit tests 1-16 (all pure function tests)
4. Add decay columns to content_inventory via ALTER TABLE migration

### Phase 2: Full Pipeline (Week 2)

1. Implement `analyze()` orchestrator that fetches data and runs all detectors
2. Implement `detectContentAge` and `detectCannibalization`
3. Implement database write (batch update inventory + insert analysis run)
4. Write integration tests 17-20

### Phase 3: API + Dashboard (Week 2-3)

1. Implement 5 API endpoints in `routes/intelligence.js`
2. Build DecayDashboard page with summary cards and table
3. Build expandable detail rows with evidence text
4. Build decay trend chart from historical runs

### Phase 4: Integration (Week 3)

1. Wire "Run Analysis" button to trigger analysis after GSC sync completes
2. Add automatic analysis after each scheduled GSC pull (via scheduler integration)
3. Wire "Start Refresh" button to pre-fill article generation pipeline
4. Test with SRMG pilot data (Arabic content)

### Feature Flags

- `DECAY_CLICK_THRESHOLD=0.20` -- Minimum click decline to trigger DECAYING (default 20%)
- `DECAY_SEVERE_THRESHOLD=0.50` -- Click decline for DECLINING (default 50%)
- `DECAY_AGE_MONTHS=18` -- Content age risk threshold (default 18 months)
- `DECAY_DEAD_CLICKS=10` -- Max clicks to classify as DEAD (default 10 in 90 days)

### Rollback Strategy

Decay detection writes to `content_inventory.decay_*` columns which are nullable and additive. Rollback:

1. Set all `decay_status` to `'unknown'` and `decay_report` to `'{}'`
2. Remove the intelligence endpoints from the route module
3. Hide the Intelligence tab in the dashboard via feature flag

---

## 10. Accessibility and Mobile

### Accessibility (WCAG 2.1 AA)

- **Summary cards:** Each card is a `<button>` with `aria-pressed="true/false"` to indicate active filter state. The count and label are within the button for screen reader announcement: "Decaying, 147 articles, 17.3 percent. Toggle filter."
- **Decay table:** Semantic `<table>` with row expansion via `aria-expanded="true/false"` on the toggle button. Expanded content is in a `<tr>` immediately following the summary row, associated via `aria-controls`.
- **Evidence text:** Marked up as a `<blockquote>` or `<p>` within the expanded row. Not truncated -- full text always available.
- **Position sparkline:** Decorative for sighted users but includes an `aria-label` describing the trend: "Position trend: worsening from 8.2 to 14.3 over 90 days." The SVG has `role="img"`.
- **Decision badges:** Text labels (not icons alone). Color is supplementary: PARTIAL REFRESH (blue), FULL REWRITE (orange), RETIRE 301 (red). Each has sufficient contrast (4.5:1 minimum).
- **Trend chart:** Includes a data table alternative accessible via "View as table" link below the chart. Chart itself has `role="img"` with descriptive `aria-label`.

### Mobile Responsiveness

- **Summary cards:** 2x2 grid on tablets (768px+), single column stack on mobile (< 768px). Numbers remain large and legible.
- **Decay table on mobile:** Transforms to card layout. Each card shows: title, click change badge (color-coded), decision pill. Tap to expand shows evidence and action button.
- **Trend chart:** Respects container width. On mobile (< 640px), chart shows 3-month window instead of 12-month. Touch-friendly: tap on data points shows tooltip.
- **Refresh action button:** Full-width on mobile within the expanded card. Minimum 44x44px touch target.

### RTL Support

- Summary cards flow right-to-left. CSS logical properties handle layout.
- Table/card text aligns to start edge (right in RTL).
- Sparkline direction flips: most recent data on the left in RTL (reading direction).
- Evidence text and decision labels are translatable. Arabic evidence strings are pre-formatted by the `buildEvidence` function which checks the user's locale setting.
- Percentage numbers use Western Arabic numerals by default but support Eastern Arabic numerals via a locale flag.