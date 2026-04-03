# Spec 09: Feedback Loop — 30/60/90 Day Performance Tracking, Prediction vs Actual, Recalibration Engine

**Status:** Implementation-Ready
**Priority:** Must Have (MoSCoW #71-74, #84), Should Have (#75-76)
**Phase:** B (tracking foundation) + D (comparison + recalibration, Weeks 23-30)
**Effort:** Backend L (2-4 weeks), Frontend L (2-4 weeks)
**Dependencies:** #2 GSC client, #3 GA4 client, #50 WordPress plugin (articles must be published to track), #14 Topic recommender (predictions to compare)
**Owner:** ChainIQ Platform Engineer

---

## 1. Feature Overview

### What

A closed-loop performance tracking system that monitors every published article at 30, 60, and 90 days post-publish via GSC and GA4 data. The system stores predictions made at generation time (expected clicks, impressions, position), compares them against actual performance snapshots, computes an accuracy score per article, and feeds deviations back into the intelligence engine's scoring weights to improve future recommendations. This is the feature that makes ChainIQ smarter over time.

### Why

Zero of 9 competitors close the feedback loop. Every existing tool stops at "generate and publish." ChainIQ's compounding moat is that prediction accuracy improves with every article tracked. Enterprise publishers (SRMG) need measurable ROI to justify $12K/month subscriptions. The feedback loop provides auditable proof: "We predicted X, you got Y, our accuracy is Z%." Recalibration turns ChainIQ from a static tool into a learning system.

### Where

- **Backend:** `bridge/intelligence/performance-tracker.js` (tracking + comparison + recalibration)
- **API:** `bridge/routes/performance.js` (endpoints)
- **Frontend:** Performance dashboard page with charts, accuracy table, ROI metrics
- **Database:** `performance_predictions` table (migration #012), `performance_snapshots` table (migration #009)
- **Scheduler:** Extends `bridge/ingestion/scheduler.js` with 30/60/90 day check jobs

### The Feedback Loop

```
Generate Article ──► Store Prediction ──► Publish to CMS
                                              │
                                        30 days later
                                              │
                                  Pull GSC + GA4 Snapshots
                                              │
                                  Compare Prediction vs Actual
                                              │
                               Compute Accuracy Score (0-100)
                                              │
                              ┌────────────────┼────────────────┐
                              ▼                ▼                ▼
                          60 days          90 days         Recalibrate
                         (repeat)         (repeat)      Scoring Weights
                                                              │
                                                    Intelligence Engine
                                                    (better predictions)
```

---

## 2. User Stories

**US-9.1** — Given a published article, when 30 days have passed, then ChainIQ automatically pulls GSC and GA4 performance data for the article's URL and stores a snapshot in the database.

**US-9.2** — Given a stored prediction and a 30-day snapshot, when I view the Performance page, then I see predicted vs actual metrics side by side with a deviation percentage for clicks, impressions, and position.

**US-9.3** — Given multiple tracked articles, when I view the Performance dashboard, then I see an overall prediction accuracy score (average across all articles) and a trend line showing accuracy improvement over time.

**US-9.4** — Given an article with 90-day tracking complete, when the recalibration engine runs, then the intelligence engine's opportunity scoring weights are adjusted based on aggregate prediction errors across all articles.

**US-9.5** — Given the Performance dashboard, when I select a specific article, then I see a line chart with predicted vs actual performance at 30, 60, and 90 days.

**US-9.6** — Given the Performance API, when I call `GET /api/performance/portfolio`, then I receive aggregate metrics: total articles tracked, average accuracy, total predicted traffic, total actual traffic, and ROI calculation.

**US-9.7** — Given a newly recalibrated scoring model, when the next topic recommendation runs, then it uses the updated weights, and the recommendation quality reflects the learning.

**US-9.8** — Given an article performing significantly better than predicted (>150% of prediction), when the system detects this, then it flags the article as a "winner" for pattern analysis.

---

## 3. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| AC-1 | Scheduler triggers 30-day check exactly 30 days after `cms_published_at` timestamp | Unit test: mock date, assert job fires |
| AC-2 | Scheduler triggers 60-day and 90-day checks at correct intervals | Unit test: 3 checkpoint dates verified |
| AC-3 | GSC data fetched for article URL at each checkpoint and stored in `performance_snapshots` | Integration test: mock GSC API, verify snapshot row |
| AC-4 | GA4 data fetched for article URL at each checkpoint and stored in `performance_snapshots` | Integration test: mock GA4 API, verify snapshot row |
| AC-5 | Prediction stored at generation time includes: predicted_clicks_30d, predicted_impressions_30d, predicted_position | Unit test: verify prediction record after article generation |
| AC-6 | Accuracy score computed as `100 - abs((actual - predicted) / predicted) * 100`, clamped to 0-100 | Unit test: known values, assert exact score |
| AC-7 | Accuracy score handles edge cases: prediction = 0 (return 0), actual = 0 (return based on predicted) | Unit test: boundary values |
| AC-8 | `GET /api/performance/article/:id` returns predicted vs actual for all checkpoints | Integration test |
| AC-9 | `GET /api/performance/portfolio` returns aggregate metrics | Integration test |
| AC-10 | `GET /api/performance/predictions` returns accuracy trend data | Integration test |
| AC-11 | Recalibration engine adjusts scoring weights within bounds (no weight < 0.05 or > 0.50) | Unit test: extreme inputs, verify clamping |
| AC-12 | Recalibration only runs with >= 20 articles with 90-day data (statistical significance) | Unit test: 19 articles = no recalibration |
| AC-13 | Performance dashboard renders line chart with predicted vs actual lines | E2E: navigate to page, assert chart visible |
| AC-14 | Articles performing >150% of prediction flagged as "winner" | Unit test: 151% triggers flag |
| AC-15 | Articles performing <50% of prediction flagged as "underperformer" | Unit test: 49% triggers flag |

---

## 4. UI/UX Description

### Performance Dashboard Page

```
+------------------------------------------------------------------+
|  Performance Tracking                           [Date Range ▼]    |
+------------------------------------------------------------------+
|                                                                    |
|  PORTFOLIO OVERVIEW                                                |
|  +-------------+  +-------------+  +-------------+  +-----------+ |
|  | Articles    |  | Avg Accuracy|  | Predicted   |  | Actual    | |
|  | Tracked     |  |             |  | Traffic     |  | Traffic   | |
|  |    47       |  |   72.4%     |  |  28,400     |  |  31,200   | |
|  | (+5 this mo)|  |  (↑ 3.2%)  |  |  clicks/mo  |  | clicks/mo | |
|  +-------------+  +-------------+  +-------------+  +-----------+ |
|                                                                    |
|  PREDICTION ACCURACY TREND                                         |
|  +--------------------------------------------------------------+ |
|  | 100% ┤                                                       | |
|  |  80% ┤          ╭──────╮   ╭───────────────────              | |
|  |  60% ┤    ╭─────╯      ╰───╯                                | |
|  |  40% ┤────╯                                                  | |
|  |  20% ┤                                                       | |
|  |   0% ┼────┬────┬────┬────┬────┬────┬────┬────               | |
|  |      Jan  Feb  Mar  Apr  May  Jun  Jul  Aug                  | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  ARTICLE PERFORMANCE TABLE                                         |
|  +--------------------------------------------------------------+ |
|  | Article              | Predicted | Actual | Accuracy | Status | |
|  |----------------------|-----------|--------|----------|--------| |
|  | N54 HPFP Guide       |    1,420  |  1,680 |   82%    | Winner | |
|  | B58 Tuning Platforms |      890  |    720 |   81%    | On Track| |
|  | M340i Review         |      650  |    210 |   32%    | Under  | |
|  | E46 Maintenance      |      340  |    380 |   88%    | On Track| |
|  +--------------------------------------------------------------+ |
|  [← Previous]  Page 1 of 4  [Next →]                             |
|                                                                    |
|  ARTICLE DETAIL (expandable)                                       |
|  +--------------------------------------------------------------+ |
|  | N54 HPFP Failure Guide                                       | |
|  |                                                              | |
|  |  Clicks:  Predicted ──── Actual ════                         | |
|  |  1800 ┤                      ╔════                           | |
|  |  1400 ┤        ────────╱═══╗╝                                | |
|  |  1000 ┤   ────╱═══════╝                                      | |
|  |   600 ┤──╱═══╝                                                | |
|  |   200 ┤╱═╝                                                    | |
|  |       ┼─────┬──────┬──────┬                                  | |
|  |      Pub   30d    60d    90d                                 | |
|  |                                                              | |
|  |  Impressions: Predicted 28,300 → Actual 31,200 (+10.2%)     | |
|  |  Position:    Predicted 8.2 → Actual 6.4 (better!)          | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

### Components

- **PortfolioOverviewCards:** 4 stat cards (articles tracked, avg accuracy, predicted traffic, actual traffic) with delta indicators
- **AccuracyTrendChart:** Line chart (Recharts) showing monthly average accuracy score
- **ArticlePerformanceTable:** Sortable table with predicted, actual, accuracy, status columns. Expandable rows.
- **ArticleDetailChart:** Dual-line chart (predicted vs actual) at 30/60/90 day checkpoints
- **StatusBadge:** "Winner" (green, >120%), "On Track" (blue, 80-120%), "Under" (orange, 50-80%), "Failed" (red, <50%)
- **Mobile:** Portfolio cards stack 2x2. Table becomes card list on < 768px. Charts full-width with horizontal scroll.

---

## 5. Database Changes

### Uses Existing Table: `performance_predictions` (Migration #012)

Fields already defined in PROJECT-BRIEF Section 6. Ensure these columns exist:

```sql
-- performance_predictions (migration 012 should have these)
-- id, user_id, article_id, keyword, predicted_clicks_30d, predicted_impressions_30d,
-- predicted_position, actual_clicks_30d, actual_impressions_30d, actual_position,
-- accuracy_score, check_interval, checked_at, created_at
```

### Additional columns needed:

```sql
ALTER TABLE performance_predictions ADD COLUMN IF NOT EXISTS actual_clicks_60d INTEGER;
ALTER TABLE performance_predictions ADD COLUMN IF NOT EXISTS actual_impressions_60d INTEGER;
ALTER TABLE performance_predictions ADD COLUMN IF NOT EXISTS actual_position_60d NUMERIC(5,2);
ALTER TABLE performance_predictions ADD COLUMN IF NOT EXISTS actual_clicks_90d INTEGER;
ALTER TABLE performance_predictions ADD COLUMN IF NOT EXISTS actual_impressions_90d INTEGER;
ALTER TABLE performance_predictions ADD COLUMN IF NOT EXISTS actual_position_90d NUMERIC(5,2);
ALTER TABLE performance_predictions ADD COLUMN IF NOT EXISTS accuracy_score_60d NUMERIC(5,2);
ALTER TABLE performance_predictions ADD COLUMN IF NOT EXISTS accuracy_score_90d NUMERIC(5,2);
ALTER TABLE performance_predictions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'tracking'
  CHECK (status IN ('tracking', 'complete', 'winner', 'underperformer', 'insufficient_data'));
ALTER TABLE performance_predictions ADD COLUMN IF NOT EXISTS checked_30d_at TIMESTAMPTZ;
ALTER TABLE performance_predictions ADD COLUMN IF NOT EXISTS checked_60d_at TIMESTAMPTZ;
ALTER TABLE performance_predictions ADD COLUMN IF NOT EXISTS checked_90d_at TIMESTAMPTZ;
```

### New Table: `scoring_weight_history`

Tracks recalibration changes over time for audit trail and rollback.

```sql
CREATE TABLE scoring_weight_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  weights_before JSONB NOT NULL,
  -- { impressions: 0.3, decay_severity: 0.25, gap_size: 0.25, seasonality: 0.1, competition: 0.1 }
  weights_after JSONB NOT NULL,
  articles_analyzed INTEGER NOT NULL,
  avg_accuracy_before NUMERIC(5,2),
  avg_accuracy_after NUMERIC(5,2),
  recalibration_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_swh_user ON scoring_weight_history (user_id, created_at DESC);

ALTER TABLE scoring_weight_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own history" ON scoring_weight_history
  FOR ALL USING (auth.uid() = user_id);
```

### Migration: `migrations/017-feedback-loop-extensions.sql`

Contains the ALTER TABLE statements for `performance_predictions` and CREATE TABLE for `scoring_weight_history`.

---

## 6. API / Backend Changes

### Endpoints

**`GET /api/performance/article/:articleId`** — Per-article performance data

```
Response (200):
  {
    success: true,
    data: {
      articleId: "...",
      title: "N54 HPFP Guide",
      publishedAt: "2026-01-15",
      keyword: "n54 hpfp symptoms",
      predicted: { clicks30d: 1420, impressions30d: 28300, position: 8.2 },
      actual: {
        day30: { clicks: 980, impressions: 21000, position: 9.1, checkedAt: "2026-02-14" },
        day60: { clicks: 1540, impressions: 29800, position: 6.8, checkedAt: "2026-03-16" },
        day90: null
      },
      accuracy: { day30: 69, day60: 82, day90: null },
      status: "tracking"
    }
  }
```

**`GET /api/performance/portfolio`** — Aggregate portfolio metrics

```
Response (200):
  {
    success: true,
    data: {
      totalArticles: 47,
      articlesWithData: 34,
      avgAccuracy30d: 68.4,
      avgAccuracy60d: 72.1,
      avgAccuracy90d: 74.8,
      totalPredictedClicks: 28400,
      totalActualClicks: 31200,
      winners: 8,
      underperformers: 3,
      tracking: 36
    }
  }
```

**`GET /api/performance/predictions`** — Accuracy trend over time

```
Response (200):
  {
    success: true,
    data: [
      { month: "2026-01", avgAccuracy: 62.3, articlesChecked: 5 },
      { month: "2026-02", avgAccuracy: 68.7, articlesChecked: 12 },
      { month: "2026-03", avgAccuracy: 72.4, articlesChecked: 18 }
    ]
  }
```

**`POST /api/performance/recalibrate`** — Trigger manual recalibration (admin only)

```
Response (200):
  {
    success: true,
    data: {
      weightsBefore: { impressions: 0.30, decay_severity: 0.25, ... },
      weightsAfter: { impressions: 0.28, decay_severity: 0.27, ... },
      articlesAnalyzed: 34,
      avgAccuracyBefore: 72.4,
      expectedAccuracyAfter: 75.1
    }
  }
```

### Core Logic — `bridge/intelligence/performance-tracker.js`

```javascript
module.exports = {
  // Scheduling
  async getArticlesDueForCheck(checkInterval),
  // Returns articles where cms_published_at + interval <= now AND not yet checked
  // checkInterval: '30d' | '60d' | '90d'

  // Data collection
  async pullPerformanceSnapshot(articleUrl, userId),
  // Fetches GSC + GA4 data for URL, stores in performance_snapshots
  // Returns: { clicks, impressions, position, sessions, engagementRate }

  // Comparison
  computeAccuracy(predicted, actual),
  // Returns: 0-100 score per metric, plus composite
  // Formula: 100 - min(100, abs((actual - predicted) / max(predicted, 1)) * 100)

  classifyPerformance(predicted, actual),
  // Returns: 'winner' (>150%) | 'on_track' (80-120%) | 'underperformer' (<50%)

  // Recalibration
  async recalibrateWeights(userId),
  // Analyzes prediction errors across all 90-day-complete articles
  // Adjusts scoring formula weights to minimize error
  // Returns: { weightsBefore, weightsAfter, improvement }

  // Helpers
  computeWeightAdjustment(errors, currentWeights),
  // Simple gradient descent: increase weight on signals that correlate with accurate predictions
  // Decrease weight on signals that correlate with inaccurate predictions
  // Clamped to [0.05, 0.50] per weight, sum must equal 1.0
};
```

### Recalibration Algorithm

The recalibration engine uses a simplified error-correction approach (not full ML):

1. For each article with 90-day data, compute the prediction error per scoring factor
2. Correlate: which scoring factors were most accurate predictors?
3. Increase weight for accurate predictors, decrease for inaccurate
4. Apply learning rate of 0.1 (small adjustments per cycle)
5. Clamp all weights to [0.05, 0.50] and normalize to sum = 1.0
6. Store before/after in `scoring_weight_history` for audit trail

**Default weights** (from PROJECT-BRIEF):
```
impressions: 0.30, decay_severity: 0.25, gap_size: 0.25,
seasonality_bonus: 0.10, competition_inverse: 0.10
```

### Scheduler Integration

Add to `bridge/ingestion/scheduler.js`:

```javascript
// New scheduled job: performance tracking
scheduleJob('performance-check-30d', '0 4 * * *', async () => {
  const articles = await performanceTracker.getArticlesDueForCheck('30d');
  for (const article of articles) {
    await performanceTracker.pullPerformanceSnapshot(article.url, article.userId);
    await performanceTracker.compareAndStore(article, '30d');
  }
});

// Same for 60d and 90d (run daily, check filters to correct interval)
```

### Edge Cases

- **Article URL changed after publish:** Track original URL, warn user if 301 detected
- **Article deleted from CMS:** Mark prediction as `insufficient_data`, stop tracking
- **GSC data not yet available:** GSC has 2-3 day lag. Retry next day if no data.
- **Zero predicted traffic:** Accuracy formula uses `max(predicted, 1)` to avoid division by zero
- **Prediction not stored (legacy articles):** Skip comparison, log info
- **Recalibration with skewed data:** Require minimum 20 articles for statistical validity
- **Weight oscillation:** Learning rate 0.1 prevents large swings between recalibrations

---

## 7. Frontend Components

### New Components

| Component | Path | Props |
|-----------|------|-------|
| `PerformancePage` | `app/performance/page.tsx` | None (route page) |
| `PortfolioOverviewCards` | `components/performance/portfolio-cards.tsx` | `stats: PortfolioStats` |
| `AccuracyTrendChart` | `components/performance/accuracy-trend.tsx` | `data: MonthlyAccuracy[]` |
| `ArticlePerformanceTable` | `components/performance/article-table.tsx` | `articles: ArticlePerfRecord[], onSelect` |
| `ArticleDetailChart` | `components/performance/article-detail-chart.tsx` | `articleId: string` |
| `StatusBadge` | `components/performance/status-badge.tsx` | `status: 'winner' | 'on_track' | 'underperformer' | 'tracking'` |
| `RecalibrationPanel` | `components/performance/recalibration-panel.tsx` | `history: WeightChange[], onRecalibrate` (admin only) |

### Modified Components

| Component | Change |
|-----------|--------|
| Dashboard sidebar | Add "Performance" nav item |
| Article detail page | Add "Performance" tab with mini chart |
| Article generation pipeline | Store prediction record after topic recommendation |

### State Management

- Portfolio data fetched on page mount, refreshed every 5 minutes
- Article table: paginated, sortable by accuracy/status/date
- Detail chart: lazy-loaded on row expansion
- Recalibration: admin-only button with confirmation modal

### Data Fetching

```typescript
export async function getArticlePerformance(articleId: string): Promise<ArticlePerformance>
export async function getPortfolioStats(): Promise<PortfolioStats>
export async function getPredictionTrend(): Promise<MonthlyAccuracy[]>
export async function triggerRecalibration(): Promise<RecalibrationResult>
```

---

## 8. Test Plan

### Unit Tests — `test/performance-tracker.test.js`

| Test | Description |
|------|-------------|
| `computeAccuracy returns 100 for perfect prediction` | predicted=100, actual=100 |
| `computeAccuracy returns 80 for 20% deviation` | predicted=100, actual=80 |
| `computeAccuracy returns 0 for 100%+ deviation` | predicted=100, actual=0 |
| `computeAccuracy handles zero prediction` | predicted=0, actual=50, assert 0 |
| `computeAccuracy handles negative deviation` | predicted=100, actual=150, assert 50 |
| `classifyPerformance returns winner for 160%` | >150% threshold |
| `classifyPerformance returns on_track for 95%` | 80-120% range |
| `classifyPerformance returns underperformer for 40%` | <50% threshold |
| `getArticlesDueForCheck returns correct articles at 30d` | Mock dates, assert filter |
| `getArticlesDueForCheck excludes already-checked articles` | checked_30d_at not null |
| `computeWeightAdjustment increases accurate signal weight` | Mock errors, verify increase |
| `computeWeightAdjustment clamps to bounds` | Extreme input, assert [0.05, 0.50] |
| `computeWeightAdjustment normalizes to sum 1.0` | Any input, assert sum = 1.0 |
| `recalibrateWeights requires 20+ articles` | 19 articles, assert rejection |

### Integration Tests — `test/performance-api.test.js`

| Test | Description |
|------|-------------|
| `GET /api/performance/article/:id returns data` | Article with predictions |
| `GET /api/performance/article/:id returns 404 for unknown` | Missing article |
| `GET /api/performance/portfolio returns aggregate stats` | Multiple tracked articles |
| `GET /api/performance/predictions returns monthly trend` | 3+ months of data |
| `POST /api/performance/recalibrate requires admin` | Non-admin = 403 |
| `POST /api/performance/recalibrate returns weight changes` | Admin, 20+ articles |
| `All endpoints require authentication` | No token = 401 |

### Scheduler Tests — `test/performance-scheduler.test.js`

| Test | Description |
|------|-------------|
| `30d check fires for article published 30 days ago` | Mock clock, assert trigger |
| `30d check does not fire for article published 29 days ago` | Assert no trigger |
| `Check retries next day if GSC data unavailable` | Mock empty response |
| `90d check marks article as complete` | Assert status = 'complete' |

---

## 9. Rollout Plan

### Feature Flag

`FEATURE_FEEDBACK_LOOP=true`. When false, Performance page shows "Coming Soon" and scheduler skips performance checks.

### Phases

1. **Phase B (Week 12):** Store predictions at article generation time. Schema ready. No tracking yet.
2. **Phase D, Week 1:** Ship 30-day tracking scheduler. Pull GSC+GA4 snapshots. Basic accuracy computation.
3. **Phase D, Week 2:** Ship 60/90 day tracking. Performance API endpoints. Article detail chart.
4. **Phase D, Week 3:** Ship Performance dashboard page: portfolio cards, accuracy trend, article table.
5. **Phase D, Week 4:** Ship recalibration engine. Weight history audit trail. Admin recalibration button.

### Monitoring

- Log check completions: "30d check completed for article {id}: accuracy {score}%"
- Alert if scheduler misses checks for > 48 hours
- Track average accuracy across all clients (target: >65% at 30d, >70% at 90d)
- Monitor recalibration frequency (expected: monthly per client)
- Dashboard metric: prediction accuracy as a platform KPI

### User Communications

- After first 30d check: "Your first article performance report is ready"
- Monthly email digest: "Your content portfolio: X articles tracked, Y% prediction accuracy"
- Recalibration: "ChainIQ's recommendations have been improved based on your performance data"

---

## 10. Accessibility & Mobile

### WCAG 2.1 AA Compliance

- Charts: all Recharts components include `<title>` and `<desc>` SVG elements for screen readers
- Chart data also available as accessible table (toggle button: "View as table")
- Portfolio cards: `role="region"` with `aria-label` for each stat
- Status badges: `aria-label` includes full text (e.g., "Winner: performing above prediction")
- Color coding: green/blue/orange/red always paired with text label and icon

### Keyboard Navigation

- Tab through: portfolio cards > trend chart > table rows > detail expansion
- Arrow keys navigate table rows
- Enter expands/collapses article detail
- Table sortable via Enter on column headers
- Recalibration button: confirmation modal with focus trap

### RTL / Arabic

- Charts render correctly in RTL (Recharts supports `reversed` x-axis)
- Table columns order reversed in RTL
- Status badges: icon position flips in RTL
- All text uses CSS logical properties
- Date formatting respects locale (Gregorian in Arabic context)

### Mobile (< 768px)

- Portfolio cards: 2x2 grid, reduced padding
- Accuracy trend chart: full width, horizontal scroll for x-axis labels
- Article table: collapses to card view (one card per article)
- Detail chart: full width within expanded card
- Recalibration panel: hidden on mobile (admin desktop action only)
- Touch targets: all interactive elements >= 44px
