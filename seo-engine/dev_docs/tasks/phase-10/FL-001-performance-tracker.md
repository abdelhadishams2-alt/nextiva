# FL-001: Performance Tracker (Prediction vs Actual)

> **Phase:** 10 | **Priority:** P1 | **Status:** NOT STARTED
> **Effort:** L (12h) | **Type:** feature
> **Sprint:** 10 (Weeks 19-20)
> **Backlog Items:** Feedback Loop — Performance Tracking + Prediction Comparison
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `PROJECT-BRIEF.md` — Section "Layer 6: Feedback Loop" for tracking spec
3. `bridge/ingestion/gsc.js` — GSC API client (from Phase 5/6 data ingestion)
4. `bridge/ingestion/ga4.js` — GA4 API client (from Phase 5/6 data ingestion)
5. `bridge/server.js` — endpoint patterns, auth middleware
6. `supabase-setup.sql` — schema reference (PROTECTED), articles and performance_snapshots tables

## Objective
Build the performance tracker that monitors every published article at 30/60/90 day intervals via GSC and GA4 snapshots. Compare predicted metrics (clicks, impressions, position) against actual performance. Calculate an accuracy score for each prediction. This data feeds back into the intelligence engine (FL-002) to improve future topic recommendations.

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `bridge/intelligence/performance-tracker.js` | Performance snapshot collection, prediction comparison, accuracy scoring |
| CREATE | `migrations/012-performance-predictions.sql` | performance_predictions table for tracking predicted vs actual |
| MODIFY | `bridge/server.js` | Add `/api/feedback/predictions/:articleId` endpoint and `/api/feedback/check` scheduled trigger |
| CREATE | `tests/performance-tracker.test.js` | Unit and integration tests |

## Sub-tasks

### Sub-task 1: Database Migration (~1.5h)
- Create `migrations/012-performance-predictions.sql`:
  ```sql
  CREATE TABLE performance_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,

    -- Predictions (set at publish time)
    predicted_clicks_30d INTEGER,
    predicted_impressions_30d INTEGER,
    predicted_position NUMERIC(5,2),

    -- Actuals (filled at check time)
    actual_clicks_30d INTEGER,
    actual_impressions_30d INTEGER,
    actual_position NUMERIC(5,2),

    -- 60-day tracking
    predicted_clicks_60d INTEGER,
    actual_clicks_60d INTEGER,
    predicted_impressions_60d INTEGER,
    actual_impressions_60d INTEGER,
    predicted_position_60d NUMERIC(5,2),
    actual_position_60d NUMERIC(5,2),

    -- 90-day tracking
    predicted_clicks_90d INTEGER,
    actual_clicks_90d INTEGER,
    predicted_impressions_90d INTEGER,
    actual_impressions_90d INTEGER,
    predicted_position_90d NUMERIC(5,2),
    actual_position_90d NUMERIC(5,2),

    -- Computed scores
    accuracy_score_30d NUMERIC(5,2),  -- 0-100
    accuracy_score_60d NUMERIC(5,2),
    accuracy_score_90d NUMERIC(5,2),
    overall_accuracy NUMERIC(5,2),

    -- Tracking state
    published_at TIMESTAMPTZ NOT NULL,
    published_url TEXT,
    published_platform TEXT,
    check_30d_at TIMESTAMPTZ,
    check_60d_at TIMESTAMPTZ,
    check_90d_at TIMESTAMPTZ,
    next_check_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','tracking','complete','error')),

    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );

  -- RLS policies
  ALTER TABLE performance_predictions ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users see own predictions" ON performance_predictions FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users create own predictions" ON performance_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users update own predictions" ON performance_predictions FOR UPDATE USING (auth.uid() = user_id);

  -- Indexes for scheduled check queries
  CREATE INDEX idx_predictions_next_check ON performance_predictions (next_check_at) WHERE status IN ('pending', 'tracking');
  CREATE INDEX idx_predictions_user_article ON performance_predictions (user_id, article_id);
  ```

### Sub-task 2: Prediction Recording (~2h)
- In `bridge/intelligence/performance-tracker.js`, create `PerformanceTracker` class
- `recordPrediction(articleId, userId, prediction)` — called when article is published
  - Prediction data comes from the intelligence engine's recommendation score:
    ```javascript
    {
      keyword: "n54 hpfp symptoms",
      predicted_clicks_30d: 450,
      predicted_impressions_30d: 8500,
      predicted_position: 12.5,
      predicted_clicks_60d: 920,
      predicted_impressions_60d: 18000,
      predicted_position_60d: 8.3,
      predicted_clicks_90d: 1400,
      predicted_impressions_90d: 28000,
      predicted_position_90d: 6.1,
      published_url: "https://example.com/blog/n54-hpfp-symptoms",
      published_platform: "wordpress"
    }
    ```
  - Calculate `next_check_at`: publish date + 30 days
  - Insert into `performance_predictions` table
  - Set status to `pending`

### Sub-task 3: Performance Snapshot Collection (~3.5h)
- `collectSnapshot(predictionRecord)` — fetches actual performance data
- **GSC data collection:**
  - Query GSC Search Analytics API for the specific URL
  - Date range: last 30 days from check date
  - Metrics: clicks, impressions, CTR, average position
  - Dimension: query (to find the primary keyword's performance)
  - Filter by the predicted keyword AND the published URL
- **GA4 data collection:**
  - Query GA4 Data API for the specific page path
  - Date range: last 30 days
  - Metrics: sessions, engagement rate, average engagement time
  - Store in metadata for enrichment (not used in accuracy score directly)
- **Snapshot logic per interval:**
  - At 30 days: fill `actual_clicks_30d`, `actual_impressions_30d`, `actual_position`. Set `next_check_at` = +30 days. Set `check_30d_at` = now.
  - At 60 days: fill `actual_clicks_60d`, etc. Set `next_check_at` = +30 days. Set `check_60d_at` = now.
  - At 90 days: fill `actual_clicks_90d`, etc. Set `check_90d_at` = now. Set status = `complete`.
- **Error handling:** If GSC/GA4 unavailable (token expired, API error), set `status = 'error'`, log details in metadata, retry on next check cycle

### Sub-task 4: Accuracy Score Calculation (~2.5h)
- `calculateAccuracy(predicted, actual)` — computes accuracy for a single metric
- **Accuracy formula per metric:**
  ```
  metric_accuracy = max(0, 100 - abs(predicted - actual) / max(predicted, 1) * 100)
  ```
  - Perfect prediction = 100. 50% off = 50. More than 100% off = 0.
- **Interval accuracy score (weighted across 3 metrics):**
  ```
  interval_accuracy = (
    clicks_accuracy * 0.40 +
    impressions_accuracy * 0.35 +
    position_accuracy * 0.25
  )
  ```
  - Position accuracy inverted: lower position is better, so accuracy = `max(0, 100 - abs(predicted_pos - actual_pos) / predicted_pos * 100)`
- **Overall accuracy (weighted across intervals):**
  ```
  overall = (
    accuracy_30d * 0.20 +
    accuracy_60d * 0.35 +
    accuracy_90d * 0.45
  )
  ```
  - 90-day weighted highest because it's the most reliable (SEO takes time)
  - Only computed when all 3 intervals have data
- Store all accuracy scores in the prediction record
- Classify accuracy: Excellent (85-100), Good (70-84), Fair (50-69), Poor (0-49)

### Sub-task 5: Scheduled Check + Endpoints (~2.5h)
- **Scheduled check mechanism:**
  - `runScheduledChecks()` — finds all predictions where `next_check_at <= now()` and status is `pending` or `tracking`
  - Process in batches of 20 (avoid overwhelming GSC/GA4 APIs)
  - Respect API rate limits: max 5 GSC queries per second
  - Called via `setInterval` in the bridge server (every 6 hours) or via explicit trigger
- Add `POST /api/feedback/check` — manual trigger for scheduled checks (admin only)
  - Auth required + admin verification
  - Returns: `{ checked: N, updated: N, errors: N }`
- Add `GET /api/feedback/predictions/:articleId` — get prediction vs actual data
  - Auth required
  - Returns:
    ```json
    {
      "prediction": {
        "keyword": "n54 hpfp symptoms",
        "predicted": { "clicks_30d": 450, "impressions_30d": 8500, "position": 12.5 },
        "actual": { "clicks_30d": 380, "impressions_30d": 7200, "position": 14.1 },
        "accuracy": { "score_30d": 82.4, "score_60d": null, "score_90d": null, "overall": null },
        "status": "tracking",
        "nextCheck": "2026-05-15T00:00:00Z",
        "intervals": [
          { "days": 30, "checked": true, "accuracy": 82.4 },
          { "days": 60, "checked": false, "accuracy": null },
          { "days": 90, "checked": false, "accuracy": null }
        ]
      }
    }
    ```
- Rate limited (general bucket)

## Testing Strategy

### Unit Tests (`tests/performance-tracker.test.js`)
- Test accuracy calculation with exact prediction (expect 100)
- Test accuracy calculation with 50% overprediction (expect ~50)
- Test accuracy calculation with 100%+ overprediction (expect 0)
- Test position accuracy (lower actual than predicted = over-accurate, still good)
- Test interval accuracy weighting (40% clicks, 35% impressions, 25% position)
- Test overall accuracy weighting (20/35/45 for 30/60/90 day)
- Test next_check_at calculation for each interval
- Test batch processing respects rate limits

### Integration Tests
- Test prediction recording on article publish
- Test `/api/feedback/predictions/:articleId` returns correct data
- Test scheduled check processes due predictions
- Test GSC/GA4 data collection (with mock API responses)
- Test error handling when API unavailable
- Test auth required on all endpoints

## Acceptance Criteria
- [ ] `migrations/012-performance-predictions.sql` creates table with RLS policies
- [ ] Predictions recorded at article publish time with 30/60/90 day targets
- [ ] GSC snapshots collected at 30/60/90 day intervals for published URLs
- [ ] GA4 data collected as enrichment metadata
- [ ] Accuracy score calculated per metric (clicks 40%, impressions 35%, position 25%)
- [ ] Overall accuracy computed when all 3 intervals complete (20/35/45 weighting)
- [ ] Scheduled check runs every 6 hours, processes due predictions in batches
- [ ] `/api/feedback/predictions/:articleId` returns predicted vs actual with accuracy
- [ ] `/api/feedback/check` triggers manual check (admin only)
- [ ] API rate limits respected for GSC/GA4 queries
- [ ] Error handling: token expiry retried on next cycle
- [ ] All tests pass (`npm test`)

## Dependencies
- Blocked by: Data ingestion (Phase 5/6 GSC/GA4 clients), publishing (Phase 9 for published URLs)
- Blocks: FL-002 (recalibration), FL-003 (dashboard performance page)
