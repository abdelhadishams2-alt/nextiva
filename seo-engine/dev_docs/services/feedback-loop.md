# Feedback Loop Service

> **Service #12** | **Layer 6** | **Priority: P2** | **Status: Planning**
> **Last Updated:** 2026-03-28
> **Spec Depth:** DEEP (target >= 9/10)

---

## 1. Overview

The Feedback Loop Service is ChainIQ's compounding moat -- the closed-loop learning system that transforms a static content recommendation tool into a self-improving intelligence engine. Every competitor in the content intelligence space stops at "generate and publish." BrightEdge makes traffic forecasts but never checks if they were right. MarketMuse tracks content scores but never feeds accuracy data back into its recommendation model. SurferSEO shows ranking changes but draws no connection between its optimization suggestions and the outcomes they produced. ChainIQ is the only platform that completes the cycle: predict, measure, compare, recalibrate, predict better.

This is the service that makes the sales pitch "ChainIQ gets smarter the longer you use it" literally true. After 90 days and 20+ published articles, the system has enough data to run its first recalibration. After 6 months, a client's scoring model has been tuned specifically to their domain, their competitive landscape, their content strengths and weaknesses. The recommendations a client receives in month 8 are measurably more accurate than the recommendations they received in month 1. No competitor can make this claim with data to back it up.

**How the loop works, end to end:**

1. **Prediction capture (at generation time).** When the Content Intelligence Service (Layer 2) scores a keyword opportunity and the user accepts it into the generation pipeline, the Feedback Loop stores a snapshot of the prediction: expected clicks at 30/60/90 days, expected impressions, expected average SERP position, the scoring weights that produced the priority score, and the individual signal component values (gap score, decay severity, seasonality bonus, competition inverse). This snapshot is immutable -- it records what the system believed at the time of recommendation, before reality intervened.

2. **Checkpoint measurement (at 30/60/90 days).** The service monitors every published article on a three-checkpoint schedule. At each checkpoint, it pulls actual performance data from Google Search Console (clicks, impressions, average position, CTR per query) and Google Analytics 4 (sessions, engagement rate, conversions if tracked). GSC data has a known 48-72 hour lag, so checkpoints include a 3-day buffer: the "30-day check" actually fires on day 33, measuring the full 0-30 day window using data available by day 33.

3. **Accuracy scoring (per article, per checkpoint).** The system computes a composite accuracy score (0-100) comparing predicted vs actual performance across three metrics: clicks (weighted 40%), impressions (weighted 35%), and SERP position (weighted 25%, with page-1 deviations penalized more heavily than page-5 deviations). This score is stored on the prediction record and displayed on the Performance dashboard.

4. **Recalibration (admin-triggered, after 20+ articles with 90-day data).** The recalibration engine analyzes prediction errors across the client's full article corpus, identifies which scoring signals (impressions weight, decay severity, gap size, seasonality bonus, competition inverse) are systematically over- or under-predicting, and proposes weight adjustments. An admin reviews the proposed changes in dry-run mode, approves them, and the new weights take effect for all future recommendations. The old weights are archived in `scoring_weight_history` with full audit trail.

5. **Compounding improvement (ongoing).** Each recalibration cycle produces measurably better predictions for the specific client. The Feedback Loop also generates client-facing performance reports that quantify this improvement: "Your prediction accuracy improved from 68% to 79% after last quarter's recalibration." These reports serve double duty as ROI proof for agency clients (Marcus needs to show his clients measurable results) and strategic intelligence for content teams (Lina needs to know which content types and topics perform best for her site).

**Primary users and their interactions:**

- **Marcus (agency admin, managing 12 clients):** Opens the Performance page for each client during monthly reporting. Generates a client-facing PDF/HTML report showing articles published, total organic clicks generated, prediction accuracy percentage, top performers, underperformers with root cause analysis, and ROI estimates (traffic value based on CPC equivalents). Marcus uses these reports in client retention meetings -- they prove ChainIQ's recommendations were correct. When accuracy drops below 70% for a client, Marcus flags it for recalibration review.

- **Lina (content strategist at SRMG):** Checks the Performance dashboard weekly. She sorts articles by accuracy score to understand which recommendation types produce the best results. She noticed that gap-based recommendations (keywords her site does not cover but competitors do) consistently outperform decay-based recommendations (refreshing old content). This insight, surfaced by the Feedback Loop's signal-level accuracy breakdown, changed her content strategy: she now prioritizes 3 gap articles for every 1 refresh. The Feedback Loop's per-signal accuracy data made this strategic shift possible.

- **CEO / revenue stakeholder:** Reviews the quarterly portfolio analytics view. Sees total organic clicks across all published articles, estimated traffic value at $0.70/click average CPC, cost of generation (subscription + time), and net ROI. The Feedback Loop provides the only data-backed answer to "Is our content investment paying off?"

**Day-in-the-life simulation:** It is April 15, 2026. Lina published an article about "N54 HPFP Failure Symptoms" on March 15. Today is 31 days after publication. The Feedback Loop's scheduler, running at 05:00 UTC, identifies this article as due for its 30-day checkpoint. The system pulls GSC data for the article's URL covering March 15 through April 14. GSC returns: 387 clicks, 9,100 impressions, average position 14.2. The system pulls GA4 data: 412 sessions, 68% engagement rate. The prediction record shows: predicted 420 clicks, 8,500 impressions, position 12.5. The system computes per-metric accuracy: clicks accuracy = `max(0, 100 - |420 - 387| / max(420, 1) * 100)` = 92.1%, impressions accuracy = `max(0, 100 - |8500 - 9100| / max(8500, 1) * 100)` = 92.9%, position accuracy (with page-1 sensitivity weighting) = 86.4%. Composite accuracy: `(92.1 * 0.40) + (92.9 * 0.35) + (86.4 * 0.25)` = 90.0. The system writes `actual_clicks_30d = 387`, `actual_impressions_30d = 9100`, `actual_position_30d = 14.2`, `accuracy_score_30d = 90.0`, sets `check_status = 'checked_30d'`, and schedules the 60-day checkpoint for May 15 (+ 3-day buffer = May 18). The next morning, Lina opens her Performance dashboard and sees the article's 30-day accuracy of 90.0% -- a strong early signal. She clicks into the article detail and sees a predicted-vs-actual line chart showing the prediction was slightly optimistic on clicks but slightly conservative on impressions, with position landing 1.7 spots lower than predicted.

**Frustrations this service must address:**

1. **GSC data lag (48-72 hours).** The checkpoint scheduler cannot assume GSC data is available in real time. Every checkpoint fires with a 3-day buffer. If data is still unavailable (rare but possible during GSC outages), the checkpoint retries daily for up to 7 days before marking as `measurement_failed`.

2. **Insufficient articles for recalibration.** New clients with fewer than 20 articles with 90-day data cannot run recalibration. The system must communicate this clearly: "You have 14 of 20 articles needed for recalibration. At your current publishing rate, recalibration will be available in approximately 6 weeks." This prevents the frustrating experience of seeing a "Recalibrate" button that always returns an error.

3. **Accuracy misleading on low-volume keywords.** An article targeting a keyword with 50 monthly searches that gets 48 clicks looks like 96% accuracy. But predicting 50 and getting 48 is meaningless noise -- the margin of error exceeds the variance. The system applies a confidence adjustment: articles with actual impressions below 500 in the measurement window are flagged as `low_confidence` and weighted at 50% in aggregate accuracy calculations and recalibration inputs.

4. **No visibility into which recommendation types perform best.** Users want to know: "Do gap recommendations outperform decay recommendations?" The Feedback Loop tracks the `opportunity_type` from the original recommendation and computes per-type accuracy aggregates. The portfolio analytics view breaks down performance by recommendation type, content format, and even voice persona (when Voice Intelligence data is available).

**Ambitious future capabilities:**

- **Auto-refresh triggers.** When the 60-day or 90-day checkpoint shows an article is declining (actual clicks at 60d are lower than actual clicks at 30d), the system automatically generates a refresh recommendation in Content Intelligence with the performance evidence attached. This closes a second loop: not just "was the recommendation good?" but "is the content still performing?"

- **Content portfolio analytics.** Cross-article analysis showing which topics, content types (how-to vs listicle vs comparison), and publication timing produce the best results. Seasonal pattern detection at the portfolio level (e.g., "Your automotive maintenance content performs 40% better when published in March-April, ahead of summer driving season").

- **Churn prediction.** Using decay velocity, competitive movement, and content age, predict which currently-performing articles will lose traffic in the next 30-60 days. Surface these as preemptive refresh opportunities before the decline materializes on the dashboard.

- **ROI calculator.** Quantify the return on ChainIQ investment: cost of subscription + estimated production time per article vs aggregate traffic value of all published articles (clicks x average CPC for the targeted keywords). Show cumulative ROI curve over time.

- **Cross-client pattern detection.** If 5+ clients in the same vertical all see strong performance from a specific content type or topic cluster, surface this as a high-confidence "industry trend" recommendation for other clients in the vertical.

---

## 2. Entities & Data Model

### 2.1 performance_predictions

The central table of the Feedback Loop Service. One row per published article, capturing the prediction snapshot at generation time and the actual measurements at each checkpoint. This table is the source of truth for every accuracy calculation, every recalibration input, and every client-facing report.

| Field | Type | Constraints | Nullable | Default | Description |
|-------|------|-------------|----------|---------|-------------|
| id | UUID | PRIMARY KEY | NOT NULL | `gen_random_uuid()` | Unique prediction record identifier |
| user_id | UUID | FK `auth.users(id)` ON DELETE CASCADE | NOT NULL | -- | Owning user (client whose article this tracks) |
| article_id | UUID | FK `articles(id)` ON DELETE CASCADE | NOT NULL | -- | The published article being tracked. One prediction per article |
| opportunity_id | UUID | FK `keyword_opportunities(id)` ON DELETE SET NULL | YES | NULL | The recommendation that produced this article (NULL for Mode A articles with no intelligence backing) |
| keyword | TEXT | -- | NOT NULL | -- | Primary keyword the article targets. Stored lowercase, trimmed. Arabic keywords in original script |
| article_url | TEXT | -- | NOT NULL | -- | Published URL of the article. Updated if 301 redirect is detected |
| original_url | TEXT | -- | NOT NULL | -- | Original URL at publish time. Never modified. Used for redirect detection |
| predicted_clicks_30d | INTEGER | CHECK >= 0 | NOT NULL | -- | Predicted organic clicks in the first 30 days post-publication |
| predicted_impressions_30d | INTEGER | CHECK >= 0 | NOT NULL | -- | Predicted impressions in the first 30 days |
| predicted_position | NUMERIC(6,2) | CHECK > 0 | NOT NULL | -- | Predicted average SERP position at 30 days |
| predicted_clicks_60d | INTEGER | CHECK >= 0 | NOT NULL | -- | Predicted cumulative organic clicks at 60 days |
| predicted_impressions_60d | INTEGER | CHECK >= 0 | NOT NULL | -- | Predicted cumulative impressions at 60 days |
| predicted_clicks_90d | INTEGER | CHECK >= 0 | NOT NULL | -- | Predicted cumulative organic clicks at 90 days |
| predicted_impressions_90d | INTEGER | CHECK >= 0 | NOT NULL | -- | Predicted cumulative impressions at 90 days |
| predicted_ctr | NUMERIC(5,4) | CHECK >= 0 AND CHECK <= 1 | YES | NULL | Predicted click-through rate based on predicted position. Used for ROI calculations |
| actual_clicks_30d | INTEGER | CHECK >= 0 | YES | NULL | Actual clicks measured at 30-day checkpoint. NULL until checkpoint completes |
| actual_impressions_30d | INTEGER | CHECK >= 0 | YES | NULL | Actual impressions at 30-day checkpoint |
| actual_position_30d | NUMERIC(6,2) | CHECK > 0 | YES | NULL | Actual average SERP position at 30-day checkpoint |
| actual_ctr_30d | NUMERIC(5,4) | CHECK >= 0 AND CHECK <= 1 | YES | NULL | Actual CTR from GSC at 30 days |
| actual_sessions_30d | INTEGER | CHECK >= 0 | YES | NULL | GA4 sessions at 30-day checkpoint. NULL if GA4 unavailable |
| actual_engagement_rate_30d | NUMERIC(5,4) | CHECK >= 0 AND CHECK <= 1 | YES | NULL | GA4 engagement rate. NULL if GA4 unavailable |
| actual_clicks_60d | INTEGER | CHECK >= 0 | YES | NULL | Actual cumulative clicks at 60-day checkpoint |
| actual_impressions_60d | INTEGER | CHECK >= 0 | YES | NULL | Actual cumulative impressions at 60 days |
| actual_position_60d | NUMERIC(6,2) | CHECK > 0 | YES | NULL | Actual average position at 60 days |
| actual_ctr_60d | NUMERIC(5,4) | CHECK >= 0 AND CHECK <= 1 | YES | NULL | Actual CTR at 60 days |
| actual_sessions_60d | INTEGER | CHECK >= 0 | YES | NULL | GA4 sessions at 60 days |
| actual_engagement_rate_60d | NUMERIC(5,4) | CHECK >= 0 AND CHECK <= 1 | YES | NULL | GA4 engagement rate at 60 days |
| actual_clicks_90d | INTEGER | CHECK >= 0 | YES | NULL | Actual cumulative clicks at 90-day checkpoint |
| actual_impressions_90d | INTEGER | CHECK >= 0 | YES | NULL | Actual cumulative impressions at 90 days |
| actual_position_90d | NUMERIC(6,2) | CHECK > 0 | YES | NULL | Actual average position at 90 days |
| actual_ctr_90d | NUMERIC(5,4) | CHECK >= 0 AND CHECK <= 1 | YES | NULL | Actual CTR at 90 days |
| actual_sessions_90d | INTEGER | CHECK >= 0 | YES | NULL | GA4 sessions at 90 days |
| actual_engagement_rate_90d | NUMERIC(5,4) | CHECK >= 0 AND CHECK <= 1 | YES | NULL | GA4 engagement rate at 90 days |
| accuracy_score_30d | NUMERIC(5,2) | CHECK >= 0 AND CHECK <= 100 | YES | NULL | Composite prediction accuracy at 30 days (0-100). NULL until checkpoint |
| accuracy_score_60d | NUMERIC(5,2) | CHECK >= 0 AND CHECK <= 100 | YES | NULL | Composite accuracy at 60 days |
| accuracy_score_90d | NUMERIC(5,2) | CHECK >= 0 AND CHECK <= 100 | YES | NULL | Composite accuracy at 90 days. This is the definitive accuracy for recalibration |
| accuracy_confidence | TEXT | CHECK IN (`high`, `medium`, `low`) | NOT NULL | `'medium'` | Data confidence level. `low` when actual_impressions < 500 at any checkpoint. `high` when all 3 checkpoints complete with > 2000 impressions. `medium` otherwise |
| check_status | TEXT | CHECK IN (`pending_30d`, `checked_30d`, `pending_60d`, `checked_60d`, `pending_90d`, `checked_90d`, `complete`, `measurement_failed`, `article_removed`) | NOT NULL | `'pending_30d'` | Current position in the checkpoint lifecycle |
| next_check_at | TIMESTAMPTZ | -- | YES | NULL | When the next checkpoint measurement is scheduled. NULL when `complete` or `article_removed` |
| published_at | TIMESTAMPTZ | -- | NOT NULL | -- | When the article was published (copied from `publish_records`). Anchor for all checkpoint scheduling |
| checked_30d_at | TIMESTAMPTZ | -- | YES | NULL | Actual timestamp when 30-day measurement was performed |
| checked_60d_at | TIMESTAMPTZ | -- | YES | NULL | Actual timestamp when 60-day measurement was performed |
| checked_90d_at | TIMESTAMPTZ | -- | YES | NULL | Actual timestamp when 90-day measurement was performed |
| opportunity_type | TEXT | CHECK IN (`gap`, `decay`, `cannibalization`, `trending`, `seasonal`, `mode_a`) | NOT NULL | `'mode_a'` | The recommendation type that produced this article. `mode_a` for direct-keyword articles without intelligence backing |
| content_format | TEXT | CHECK IN (`how-to`, `listicle`, `comparison`, `review`, `guide`, `news`, `reference`, `tutorial`, `other`) | YES | NULL | Article format. Used for portfolio analytics |
| voice_persona_id | UUID | -- | YES | NULL | Voice persona used for generation. Used for persona performance analytics |
| prediction_metadata | JSONB | -- | NOT NULL | `'{}'::jsonb` | Immutable snapshot of the intelligence context at prediction time |
| measurement_metadata | JSONB | -- | NOT NULL | `'{}'::jsonb` | Accumulated measurement context: GSC raw data, GA4 raw data, redirect detections, retry counts, error logs |
| anomaly_flags | TEXT[] | -- | NOT NULL | `'{}'` | Array of anomaly flags: `viral_spike`, `url_changed`, `low_confidence`, `seasonal_content`, `google_algo_update`, `competitor_surge` |
| created_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | Row creation time (when prediction was stored) |
| updated_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | Last modification. Auto-updated by trigger |

**`prediction_metadata` JSONB structure (immutable, written once at prediction time):**

```json
{
  "recommendation_score": 94.2,
  "scoring_weights_used": {
    "impressions": 0.30,
    "decay_severity": 0.25,
    "gap_size": 0.25,
    "seasonality_bonus": 0.10,
    "competition_inverse": 0.10
  },
  "scoring_components": {
    "impressions_component": 28.3,
    "decay_component": 0,
    "gap_component": 20.6,
    "seasonality_component": 3.3,
    "competition_component": 7.2
  },
  "keyword_difficulty": 28,
  "search_volume": 4400,
  "quality_gate_score": 8.4,
  "competitor_count": 2,
  "competitor_avg_position": 4.0,
  "competitor_avg_word_count": 830,
  "serp_saturation_score": 28,
  "seasonal_peak_months": [10, 11, 12],
  "data_sources_used": ["gsc", "semrush", "trends"],
  "analysis_run_id": "uuid"
}
```

**`measurement_metadata` JSONB structure (accumulated across checkpoints):**

```json
{
  "checkpoint_30d": {
    "measured_at": "2026-04-18T05:12:00Z",
    "measurement_window": { "start": "2026-03-15", "end": "2026-04-14" },
    "gsc_raw": {
      "queries": [
        { "query": "n54 hpfp symptoms", "clicks": 210, "impressions": 4800, "ctr": 0.0437, "position": 12.1 },
        { "query": "n54 fuel pump failure", "clicks": 98, "impressions": 2200, "ctr": 0.0445, "position": 14.8 },
        { "query": "n54 hpfp problems", "clicks": 79, "impressions": 2100, "ctr": 0.0376, "position": 16.2 }
      ],
      "total_queries": 18,
      "data_freshness": "2026-04-16T00:00:00Z"
    },
    "ga4_raw": {
      "sessions": 412,
      "engagement_rate": 0.68,
      "avg_session_duration_seconds": 184,
      "conversions": 0,
      "data_available": true
    },
    "retry_count": 0,
    "data_lag_days": 2
  },
  "checkpoint_60d": null,
  "checkpoint_90d": null,
  "redirect_detections": [],
  "errors": []
}
```

**Unique constraint:** `UNIQUE (article_id)` -- one prediction record per published article.

**Indexes:**
- `idx_predictions_user_status` on `(user_id, check_status)` -- dashboard: find articles at each checkpoint stage
- `idx_predictions_next_check` on `(next_check_at)` WHERE `next_check_at IS NOT NULL` -- scheduler: pick up due checkpoints. Partial index excludes completed articles
- `idx_predictions_user_accuracy90` on `(user_id, accuracy_score_90d DESC NULLS LAST)` -- reporting: rank articles by final accuracy
- `idx_predictions_user_published` on `(user_id, published_at DESC)` -- portfolio view: chronological article list
- `idx_predictions_user_type` on `(user_id, opportunity_type)` -- portfolio analytics: per-type performance breakdowns
- `idx_predictions_user_format` on `(user_id, content_format)` WHERE `content_format IS NOT NULL` -- format effectiveness analysis
- `idx_predictions_confidence` on `(user_id, accuracy_confidence)` -- filter out low-confidence articles for recalibration

**RLS Policies:**
- `Users read own predictions`: SELECT WHERE `auth.uid() = user_id`
- `Users cannot modify predictions`: No INSERT/UPDATE/DELETE policy for users. All writes performed by service_role (the bridge server).
- Admin (service_role) bypasses RLS for all operations.

**Trigger:** `BEFORE UPDATE` fires `update_updated_at()` to set `updated_at = now()`.

---

### 2.2 scoring_weight_history

Tracks every recalibration of the scoring model over time. Each row represents a single recalibration event -- either applied or dry-run. This table is the audit trail that enables rollback, the evidence base for recalibration decisions, and the data source for the "accuracy improvement over time" chart on the dashboard.

| Field | Type | Constraints | Nullable | Default | Description |
|-------|------|-------------|----------|---------|-------------|
| id | UUID | PRIMARY KEY | NOT NULL | `gen_random_uuid()` | Recalibration event identifier |
| user_id | UUID | FK `auth.users(id)` ON DELETE CASCADE | NOT NULL | -- | Client whose scoring model was recalibrated |
| triggered_by | UUID | FK `auth.users(id)` ON DELETE SET NULL | YES | NULL | Admin user who triggered the recalibration. NULL for system-initiated dry runs |
| event_type | TEXT | CHECK IN (`dry_run`, `applied`, `rolled_back`, `auto_reverted`) | NOT NULL | -- | What happened. `dry_run` = computed but not applied. `applied` = weights changed. `rolled_back` = manually reverted to previous. `auto_reverted` = system detected worse outcomes and reverted |
| weights_before | JSONB | -- | NOT NULL | -- | Complete scoring weights before this event |
| weights_after | JSONB | -- | NOT NULL | -- | Proposed or applied weights after this event |
| weight_deltas | JSONB | -- | NOT NULL | -- | Per-signal change: `{ "impressions": -0.05, "gap_size": +0.05, ... }`. Convenience field for dashboard display |
| sample_size | INTEGER | CHECK >= 0 | NOT NULL | -- | Number of articles with 90-day accuracy data used as input |
| outliers_excluded | INTEGER | CHECK >= 0 | NOT NULL | 0 | Articles excluded as statistical outliers |
| outlier_threshold_std | NUMERIC(3,1) | CHECK > 0 | NOT NULL | 2.0 | Standard deviations threshold used for outlier detection |
| mean_accuracy_before | NUMERIC(5,2) | CHECK >= 0 AND CHECK <= 100 | NOT NULL | -- | Average prediction accuracy across the sample using old weights |
| mean_accuracy_after | NUMERIC(5,2) | CHECK >= 0 AND CHECK <= 100 | NOT NULL | -- | Projected (or actual, post-backtest) accuracy with new weights |
| accuracy_improvement | NUMERIC(5,2) | -- | NOT NULL | -- | `mean_accuracy_after - mean_accuracy_before`. Positive = improvement |
| per_signal_analysis | JSONB | -- | NOT NULL | `'{}'::jsonb` | Detailed per-signal accuracy: correlation coefficients, error direction (over/under-predict), signal reliability |
| backtest_results | JSONB | -- | NOT NULL | `'{}'::jsonb` | Full backtest: re-scored all historical articles with new weights, accuracy per article, improvement distribution |
| learning_rate_used | NUMERIC(4,3) | CHECK > 0 AND CHECK <= 1 | NOT NULL | 0.05 | Learning rate applied for this recalibration. Default 0.05 |
| changes_summary | TEXT | -- | NOT NULL | -- | Human-readable summary of what changed and why, suitable for audit review |
| rollback_of | UUID | FK `scoring_weight_history(id)` | YES | NULL | If this is a rollback, references the event being rolled back |
| superseded_by | UUID | FK `scoring_weight_history(id)` | YES | NULL | If this event was rolled back, references the rollback event |
| metadata | JSONB | -- | NOT NULL | `'{}'::jsonb` | Confidence intervals, statistical test results, computation time, any warnings |
| created_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | When this recalibration event occurred |

**`per_signal_analysis` JSONB structure:**

```json
{
  "impressions": {
    "current_weight": 0.30,
    "proposed_weight": 0.25,
    "correlation_with_accuracy": 0.42,
    "mean_error_direction": "overestimate",
    "mean_error_pct": 18.2,
    "signal_reliability": "medium",
    "recommendation": "Decrease: high-volume keywords consistently overestimate click-through for this site"
  },
  "decay_severity": {
    "current_weight": 0.25,
    "proposed_weight": 0.22,
    "correlation_with_accuracy": 0.38,
    "mean_error_direction": "neutral",
    "mean_error_pct": 12.1,
    "signal_reliability": "high",
    "recommendation": "Minor decrease: decay predictions are reasonably accurate"
  },
  "gap_size": {
    "current_weight": 0.25,
    "proposed_weight": 0.30,
    "correlation_with_accuracy": 0.71,
    "mean_error_direction": "underestimate",
    "mean_error_pct": -22.4,
    "signal_reliability": "high",
    "recommendation": "Increase: low-competition gaps consistently outperform predictions by 22%"
  },
  "seasonality_bonus": {
    "current_weight": 0.10,
    "proposed_weight": 0.11,
    "correlation_with_accuracy": 0.55,
    "mean_error_direction": "neutral",
    "mean_error_pct": 8.7,
    "signal_reliability": "medium",
    "recommendation": "Slight increase: seasonal timing adds meaningful predictive value"
  },
  "competition_inverse": {
    "current_weight": 0.10,
    "proposed_weight": 0.12,
    "correlation_with_accuracy": 0.63,
    "mean_error_direction": "underestimate",
    "mean_error_pct": -15.3,
    "signal_reliability": "high",
    "recommendation": "Increase: low-competition keywords outperform across all checkpoints"
  }
}
```

**`backtest_results` JSONB structure:**

```json
{
  "articles_rescored": 32,
  "accuracy_distribution": {
    "0-20": 0,
    "20-40": 1,
    "40-60": 4,
    "60-80": 14,
    "80-100": 13
  },
  "improvement_by_article": [
    { "article_id": "uuid", "accuracy_old": 62.3, "accuracy_new": 71.8, "delta": 9.5 },
    { "article_id": "uuid", "accuracy_old": 88.1, "accuracy_new": 89.4, "delta": 1.3 }
  ],
  "articles_improved": 24,
  "articles_unchanged": 5,
  "articles_worsened": 3,
  "worst_case_regression": -4.2,
  "computation_time_ms": 1240
}
```

**Indexes:**
- `idx_swh_user_date` on `(user_id, created_at DESC)` -- recalibration history timeline
- `idx_swh_user_type` on `(user_id, event_type)` -- find latest applied recalibration
- `idx_swh_rollback` on `(rollback_of)` WHERE `rollback_of IS NOT NULL` -- find rollback chain

**RLS Policies:**
- `Admins read all history`: SELECT WHERE role = 'admin' (via custom RLS function)
- `Users read own history`: SELECT WHERE `auth.uid() = user_id` -- users can see their recalibration timeline but cannot trigger recalibrations
- No INSERT/UPDATE/DELETE for non-admin users.

---

### 2.3 performance_reports

Stores generated performance reports -- both the metadata and the rendered output. Reports are generated on demand or on schedule and cached to avoid regeneration.

| Field | Type | Constraints | Nullable | Default | Description |
|-------|------|-------------|----------|---------|-------------|
| id | UUID | PRIMARY KEY | NOT NULL | `gen_random_uuid()` | Report identifier |
| user_id | UUID | FK `auth.users(id)` ON DELETE CASCADE | NOT NULL | -- | Report owner (the client whose data is summarized) |
| generated_by | UUID | FK `auth.users(id)` ON DELETE SET NULL | YES | NULL | Who triggered report generation. NULL for scheduled reports |
| report_type | TEXT | CHECK IN (`monthly`, `quarterly`, `custom`, `on_demand`) | NOT NULL | -- | Report cadence type |
| period_start | DATE | -- | NOT NULL | -- | Report period start (inclusive) |
| period_end | DATE | -- | NOT NULL | -- | Report period end (inclusive) |
| articles_tracked | INTEGER | CHECK >= 0 | NOT NULL | -- | Number of articles with data in this period |
| articles_with_checkpoints | INTEGER | CHECK >= 0 | NOT NULL | -- | Articles that completed at least one checkpoint in this period |
| total_clicks | INTEGER | CHECK >= 0 | NOT NULL | -- | Aggregate clicks across all tracked articles for the period |
| total_impressions | INTEGER | CHECK >= 0 | NOT NULL | -- | Aggregate impressions |
| avg_accuracy_score | NUMERIC(5,2) | CHECK >= 0 AND CHECK <= 100 | YES | NULL | Average prediction accuracy across articles with completed checkpoints |
| top_performers | JSONB | -- | NOT NULL | `'[]'::jsonb` | Top 5 articles by clicks with full prediction-vs-actual breakdown |
| underperformers | JSONB | -- | NOT NULL | `'[]'::jsonb` | Bottom 5 articles with root cause analysis |
| roi_metrics | JSONB | -- | NOT NULL | `'{}'::jsonb` | Cost per article vs traffic value, estimated revenue impact |
| recommendations | JSONB | -- | NOT NULL | `'[]'::jsonb` | Data-driven recommendations for next period |
| portfolio_breakdown | JSONB | -- | NOT NULL | `'{}'::jsonb` | Performance by recommendation type, content format, topic cluster |
| accuracy_trend | JSONB | -- | NOT NULL | `'[]'::jsonb` | Monthly accuracy scores showing improvement over time |
| report_json | JSONB | -- | NOT NULL | -- | Complete structured report data for dashboard rendering |
| report_html | TEXT | -- | YES | NULL | Pre-rendered HTML for email delivery and PDF export. NULL if not yet rendered |
| cached_until | TIMESTAMPTZ | -- | YES | NULL | Cache expiry. Report regenerated if data changes after this timestamp |
| metadata | JSONB | -- | NOT NULL | `'{}'::jsonb` | Generation timing, data completeness notes, warnings |
| created_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | Report generation timestamp |

**`roi_metrics` JSONB structure:**

```json
{
  "total_articles_published": 12,
  "total_organic_clicks": 8400,
  "avg_cpc_equivalent": 0.72,
  "estimated_traffic_value_usd": 6048.00,
  "subscription_cost_usd": 6000.00,
  "estimated_production_hours": 24,
  "production_cost_estimate_usd": 1200.00,
  "total_cost_usd": 7200.00,
  "net_roi_pct": -16.0,
  "cumulative_traffic_value_usd": 18200.00,
  "cumulative_cost_usd": 21600.00,
  "breakeven_projected_month": "2026-07",
  "note": "ROI calculations use CPC equivalents as traffic value proxy. Actual revenue impact depends on conversion rates not tracked here."
}
```

**Indexes:**
- `idx_reports_user_period` on `(user_id, period_start DESC, period_end DESC)` -- find reports by period
- `idx_reports_user_type` on `(user_id, report_type, created_at DESC)` -- list reports by type
- `idx_reports_cache` on `(cached_until)` WHERE `cached_until IS NOT NULL` -- cache invalidation

**RLS Policies:**
- `Users read own reports`: SELECT WHERE `auth.uid() = user_id`
- `Admins read all reports`: SELECT WHERE role = 'admin'
- Writes by service_role only.

---

## 3. API Endpoints

### 3.1 Endpoint Summary

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| GET | `/api/feedback/predictions/:articleId` | User | 60/min | Get prediction vs actual for a specific article |
| GET | `/api/feedback/accuracy` | User | 30/min | Get aggregate prediction accuracy stats |
| POST | `/api/feedback/recalibrate` | Admin | 5/hour | Trigger scoring model recalibration |
| GET | `/api/feedback/report/:userId` | User/Admin | 10/min | Get or generate a performance report |
| GET | `/api/feedback/portfolio` | User | 20/min | Get portfolio-level analytics |
| GET | `/api/feedback/due` | Admin | 30/min | List articles with pending checkpoints |
| POST | `/api/feedback/measure/:articleId` | Admin | 30/min | Manually trigger a checkpoint measurement |
| GET | `/api/feedback/recalibration-history` | User/Admin | 20/min | View recalibration audit trail |
| POST | `/api/feedback/rollback/:recalibrationId` | Admin | 2/hour | Rollback a recalibration to previous weights |

### 3.2 GET `/api/feedback/predictions/:articleId`

Returns the full prediction-vs-actual dataset for a single article, including all checkpoint measurements completed so far, the scoring context at prediction time, and any anomaly flags.

**Path parameters:**
- `articleId` (UUID, required) -- The article to retrieve prediction data for

**Response (200):**

```json
{
  "success": true,
  "data": {
    "article_id": "a1b2c3d4-...",
    "keyword": "n54 hpfp failure symptoms",
    "article_url": "https://client-site.com/blog/n54-hpfp-failure-symptoms",
    "published_at": "2026-01-15T10:00:00Z",
    "check_status": "checked_60d",
    "next_check_at": "2026-04-18T05:00:00Z",
    "opportunity_type": "gap",
    "content_format": "guide",
    "predictions": {
      "clicks_30d": 420,
      "impressions_30d": 8500,
      "position": 12.5,
      "clicks_60d": 980,
      "impressions_60d": 19200,
      "clicks_90d": 1650,
      "impressions_90d": 32000,
      "ctr": 0.049
    },
    "actuals": {
      "day_30": {
        "clicks": 387,
        "impressions": 9100,
        "position": 14.2,
        "ctr": 0.0425,
        "sessions": 412,
        "engagement_rate": 0.68,
        "measured_at": "2026-02-18T05:12:00Z"
      },
      "day_60": {
        "clicks": 1120,
        "impressions": 21400,
        "position": 10.8,
        "ctr": 0.0523,
        "sessions": 1180,
        "engagement_rate": 0.71,
        "measured_at": "2026-03-20T05:08:00Z"
      },
      "day_90": null
    },
    "accuracy": {
      "score_30d": 82.4,
      "score_60d": 88.1,
      "score_90d": null,
      "confidence": "high",
      "trending": "improving",
      "per_metric": {
        "clicks": { "accuracy_30d": 92.1, "accuracy_60d": 85.7, "bias": "slight_overestimate" },
        "impressions": { "accuracy_30d": 92.9, "accuracy_60d": 88.5, "bias": "slight_underestimate" },
        "position": { "accuracy_30d": 86.4, "accuracy_60d": 82.6, "bias": "optimistic" }
      }
    },
    "context": {
      "recommendation_score": 94.2,
      "keyword_difficulty": 28,
      "search_volume": 4400,
      "quality_gate_score": 8.4,
      "scoring_weights_used": {
        "impressions": 0.30,
        "decay_severity": 0.25,
        "gap_size": 0.25,
        "seasonality_bonus": 0.10,
        "competition_inverse": 0.10
      }
    },
    "anomaly_flags": []
  }
}
```

**Error responses:**
- `401 Unauthorized` -- Missing or invalid authentication token
- `403 Forbidden` -- Article belongs to another user
- `404 Not Found` -- Article does not exist or has no prediction record

### 3.3 GET `/api/feedback/accuracy`

Returns aggregate prediction accuracy statistics for the authenticated user. Shows how well ChainIQ's recommendations have performed overall, broken down by checkpoint, by signal, and by trend.

**Query parameters:**
- `period` -- `30d`, `60d`, `90d`, or `all` (default: `90d`). Which checkpoint's accuracy to aggregate
- `min_articles` -- Minimum articles required for statistical significance (default: 10). Returns `insufficient_data` if below threshold
- `opportunity_type` -- Filter by recommendation type: `gap`, `decay`, `seasonal`, `trending`, `cannibalization`, `mode_a` (optional)
- `content_format` -- Filter by format: `how-to`, `listicle`, `comparison`, `guide`, etc. (optional)
- `date_from` / `date_to` -- Restrict to articles published within a date range (optional)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "period": "90d",
    "total_articles_tracked": 47,
    "articles_with_data": {
      "30d": 42,
      "60d": 36,
      "90d": 32
    },
    "accuracy": {
      "mean_score": 76.8,
      "median_score": 79.2,
      "std_deviation": 14.3,
      "p25": 68.4,
      "p75": 86.1,
      "best_prediction": {
        "article_id": "uuid",
        "keyword": "n54 oil change interval",
        "score": 97.1,
        "predicted_clicks_90d": 800,
        "actual_clicks_90d": 812
      },
      "worst_prediction": {
        "article_id": "uuid",
        "keyword": "bmw m3 vs audi rs4",
        "score": 34.2,
        "predicted_clicks_90d": 800,
        "actual_clicks_90d": 120
      }
    },
    "signal_accuracy": {
      "impressions": { "mean_error_pct": 18.2, "bias": "slight_overestimate", "reliability": "medium" },
      "clicks": { "mean_error_pct": 22.7, "bias": "slight_underestimate", "reliability": "medium" },
      "position": { "mean_error_pct": 15.4, "bias": "neutral", "reliability": "high" }
    },
    "by_recommendation_type": {
      "gap": { "count": 18, "mean_accuracy": 81.2, "total_clicks": 14200 },
      "decay": { "count": 8, "mean_accuracy": 72.4, "total_clicks": 6800 },
      "seasonal": { "count": 4, "mean_accuracy": 68.9, "total_clicks": 3200 },
      "mode_a": { "count": 2, "mean_accuracy": 65.1, "total_clicks": 1400 }
    },
    "by_content_format": {
      "guide": { "count": 12, "mean_accuracy": 79.8 },
      "how-to": { "count": 10, "mean_accuracy": 77.2 },
      "listicle": { "count": 6, "mean_accuracy": 74.1 },
      "comparison": { "count": 4, "mean_accuracy": 62.3 }
    },
    "trend": {
      "last_10_articles_accuracy": 81.2,
      "previous_10_articles_accuracy": 73.4,
      "direction": "improving",
      "improvement_pct": 10.6,
      "last_recalibration": "2026-02-15T08:00:00Z",
      "months_since_recalibration": 1.4
    },
    "portfolio_performance": {
      "total_clicks_generated": 28400,
      "total_impressions_generated": 542000,
      "avg_position_achieved": 14.8,
      "articles_on_page_1": 12,
      "articles_on_page_2": 14,
      "articles_beyond_page_2": 6,
      "estimated_traffic_value_usd": 20440.00
    },
    "recalibration_status": {
      "eligible": true,
      "articles_with_90d_data": 32,
      "minimum_required": 20,
      "last_recalibration": "2026-02-15T08:00:00Z",
      "recommended": true,
      "reason": "32 articles available, last recalibration 6 weeks ago"
    }
  }
}
```

**Error responses:**
- `401 Unauthorized`
- `200` with `"insufficient_data": true` when article count is below `min_articles`

### 3.4 POST `/api/feedback/recalibrate`

Admin-only endpoint. Triggers a recalibration of the topic recommendation scoring weights for a specific client, using all articles with completed 90-day measurements. Always runs in dry-run mode first; a second call with `dry_run: false` applies the changes.

**Request body:**

```json
{
  "user_id": "uuid",
  "dry_run": true,
  "min_sample_size": 20,
  "exclude_outliers": true,
  "outlier_threshold_std": 2.0,
  "learning_rate": 0.05,
  "force": false
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| user_id | UUID | YES | -- | Client whose model to recalibrate |
| dry_run | boolean | NO | `true` | When true, compute and return proposed changes without applying |
| min_sample_size | integer | NO | 20 | Minimum articles with 90-day data required |
| exclude_outliers | boolean | NO | `true` | Exclude articles >N standard deviations from mean accuracy |
| outlier_threshold_std | number | NO | 2.0 | Standard deviations for outlier boundary |
| learning_rate | number | NO | 0.05 | Step size for weight adjustment. Range [0.01, 0.20] |
| force | boolean | NO | `false` | When true, apply even if projected improvement < 3%. Admin override for backtest-negative recalibrations |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "recalibration_id": "uuid",
    "user_id": "uuid",
    "dry_run": true,
    "sample_size": 32,
    "outliers_excluded": 3,
    "outlier_articles": [
      { "article_id": "uuid", "keyword": "bmw m3 viral review", "accuracy": 12.4, "reason": "viral_spike" }
    ],
    "previous_weights": {
      "impressions": 0.30,
      "decay_severity": 0.25,
      "gap_size": 0.25,
      "seasonality_bonus": 0.10,
      "competition_inverse": 0.10
    },
    "proposed_weights": {
      "impressions": 0.25,
      "decay_severity": 0.22,
      "gap_size": 0.30,
      "seasonality_bonus": 0.11,
      "competition_inverse": 0.12
    },
    "weight_deltas": {
      "impressions": -0.05,
      "decay_severity": -0.03,
      "gap_size": 0.05,
      "seasonality_bonus": 0.01,
      "competition_inverse": 0.02
    },
    "changes_summary": [
      "Decreased impressions 0.30 -> 0.25: high-volume keywords consistently overestimate CTR for this site (avg 18% overestimate)",
      "Increased gap_size 0.25 -> 0.30: low-competition gaps outperformed predictions by 22% on average",
      "Increased competition_inverse 0.10 -> 0.12: low-competition keywords outperformed across all checkpoints"
    ],
    "mean_accuracy_before": 76.8,
    "mean_accuracy_after": 83.0,
    "projected_improvement": 6.2,
    "backtest": {
      "articles_improved": 24,
      "articles_unchanged": 5,
      "articles_worsened": 3,
      "worst_regression": -4.2,
      "confidence_interval_95": [4.1, 8.3]
    },
    "recommendation": "APPLY: 6.2% projected improvement exceeds 3% threshold. 24 of 32 articles would improve.",
    "applied_at": null
  }
}
```

**Response when `dry_run: false` (applies the recalibration):**
Same structure with `"dry_run": false` and `"applied_at": "2026-03-28T16:00:00Z"`. The `recalibration_id` can be used for rollback.

**Error responses:**
- `401 Unauthorized`
- `403 Forbidden` -- Non-admin user
- `422 Unprocessable Entity` -- Insufficient data:
```json
{
  "success": false,
  "error": "INSUFFICIENT_SAMPLE_SIZE",
  "message": "Need at least 20 articles with 90-day data. Currently have 14. At current publishing rate (3 articles/month), recalibration available in approximately 6 weeks.",
  "data": {
    "required": 20,
    "available": 14,
    "deficit": 6,
    "estimated_weeks_to_threshold": 6
  }
}
```
- `409 Conflict` -- Recalibration rejected (projected improvement < 3% and `force: false`):
```json
{
  "success": false,
  "error": "RECALIBRATION_REJECTED",
  "message": "Projected improvement of 1.4% is below the 3% threshold. Current weights remain optimal. Use force: true to override.",
  "data": {
    "projected_improvement": 1.4,
    "threshold": 3.0,
    "recommendation": "SKIP: Current weights are performing well. Recalibrate again after 10+ new articles."
  }
}
```

### 3.5 GET `/api/feedback/report/:userId`

Generates or retrieves a performance report for the specified user. Users can access their own reports; admins can access any user's reports. If a cached report exists for the requested period, returns it. Otherwise, generates a new one (which may take 2-8 seconds for large portfolios).

**Path parameters:**
- `userId` (UUID, required) -- User to generate report for

**Query parameters:**
- `type` -- `monthly`, `quarterly`, `custom`, or `on_demand` (default: `monthly`)
- `start` -- Period start date, ISO 8601 date (required for `custom`)
- `end` -- Period end date, ISO 8601 date (required for `custom`)
- `format` -- `json` or `html` (default: `json`). `html` returns pre-rendered report suitable for email or PDF conversion
- `force_regenerate` -- `true` to bypass cache and regenerate (default: `false`)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "report_id": "uuid",
    "user_id": "uuid",
    "report_type": "monthly",
    "period": { "start": "2026-03-01", "end": "2026-03-31" },
    "generated_at": "2026-03-28T16:00:00Z",
    "cached": true,
    "summary": {
      "articles_published": 8,
      "articles_tracked": 8,
      "articles_with_checkpoints": 6,
      "total_clicks": 4200,
      "total_impressions": 89000,
      "avg_prediction_accuracy": 79.4,
      "accuracy_trend_direction": "improving",
      "estimated_traffic_value_usd": 2940.00
    },
    "top_performers": [
      {
        "article_id": "uuid",
        "title": "N54 HPFP Failure Symptoms and Solutions",
        "keyword": "n54 hpfp failure symptoms",
        "article_url": "https://client-site.com/blog/n54-hpfp-failure-symptoms",
        "clicks": 1420,
        "impressions": 28300,
        "position": 8.2,
        "predicted_clicks": 1200,
        "accuracy": 94.2,
        "opportunity_type": "gap",
        "content_format": "guide",
        "insight": "Outperformed prediction by 18% -- low-competition gap strategy validated"
      }
    ],
    "underperformers": [
      {
        "article_id": "uuid",
        "title": "BMW M3 vs Audi RS4 Comparison",
        "keyword": "bmw m3 vs audi rs4",
        "article_url": "https://client-site.com/blog/bmw-m3-vs-audi-rs4",
        "clicks": 120,
        "impressions": 3400,
        "position": 28.4,
        "predicted_clicks": 800,
        "accuracy": 34.2,
        "opportunity_type": "gap",
        "content_format": "comparison",
        "analysis": "High-authority competitors (Car and Driver, MotorTrend) dominate this SERP. Domain authority gap (42 vs 80+) was underweighted. Saturation index was accurate (high competition), but the scoring formula gave insufficient penalty.",
        "recommendation": "Avoid comparison-intent keywords competing with DA 70+ sites until domain authority improves. Current DR: 42."
      }
    ],
    "portfolio_breakdown": {
      "by_recommendation_type": {
        "gap": { "articles": 5, "clicks": 3100, "avg_accuracy": 82.1 },
        "decay": { "articles": 2, "clicks": 800, "avg_accuracy": 71.4 },
        "seasonal": { "articles": 1, "clicks": 300, "avg_accuracy": 68.0 }
      },
      "by_content_format": {
        "guide": { "articles": 3, "clicks": 2400, "avg_accuracy": 85.2 },
        "how-to": { "articles": 3, "clicks": 1200, "avg_accuracy": 76.8 },
        "comparison": { "articles": 2, "clicks": 600, "avg_accuracy": 58.4 }
      }
    },
    "accuracy_trend": [
      { "month": "2025-12", "avg_accuracy": 62.3, "articles": 5 },
      { "month": "2026-01", "avg_accuracy": 68.7, "articles": 8 },
      { "month": "2026-02", "avg_accuracy": 74.2, "articles": 7 },
      { "month": "2026-03", "avg_accuracy": 79.4, "articles": 6 }
    ],
    "roi": {
      "total_traffic_value_usd": 2940.00,
      "subscription_cost_usd": 6000.00,
      "net_this_period": -3060.00,
      "cumulative_traffic_value_usd": 18200.00,
      "cumulative_cost_usd": 24000.00,
      "roi_trending": "improving",
      "breakeven_projected": "2026-07"
    },
    "recommendations": [
      "Increase focus on long-tail technical keywords (KD < 30) -- these outperformed by 34% on average this period",
      "Reduce investment in comparison-intent keywords until domain authority improves (current DR: 42, competitors avg DR: 76)",
      "3 articles from January are showing early decay signals (10-15% click decline) -- consider refresh recommendations",
      "Seasonal opportunity: 'BMW summer maintenance' topic cluster peaks in May-June. Generate 2-3 articles in April for indexing lead time",
      "Gap recommendations consistently outperform decay recommendations (82% vs 71% accuracy). Prioritize gap-based content creation"
    ]
  }
}
```

**Error responses:**
- `401 Unauthorized`
- `403 Forbidden` -- Non-admin user requesting another user's report
- `404 Not Found` -- User not found
- `422 Unprocessable Entity` -- Invalid date range for custom reports (end before start, future dates, range > 366 days)

### 3.6 GET `/api/feedback/portfolio`

Returns portfolio-level analytics across all published articles for the authenticated user. This is the high-level view for content strategists and executives -- aggregate performance, topic-level breakdowns, format effectiveness, and seasonal patterns.

**Query parameters:**
- `date_from` / `date_to` -- Filter articles by publication date (optional)
- `group_by` -- `recommendation_type`, `content_format`, `month`, `keyword_cluster` (default: `recommendation_type`)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "total_articles": 47,
    "total_clicks": 28400,
    "total_impressions": 542000,
    "avg_position": 14.8,
    "avg_accuracy": 76.8,
    "estimated_traffic_value_usd": 20440.00,
    "articles_on_page_1": 12,
    "articles_on_page_2": 14,
    "articles_beyond_page_2": 6,
    "articles_not_ranking": 15,
    "by_recommendation_type": [
      {
        "type": "gap",
        "articles": 22,
        "total_clicks": 16200,
        "avg_accuracy": 81.2,
        "avg_position": 12.4,
        "best_performer": { "article_id": "uuid", "keyword": "n54 hpfp symptoms", "clicks": 1420 },
        "insight": "Gap recommendations are your strongest category. 14 of 22 articles reached page 1."
      },
      {
        "type": "decay",
        "articles": 12,
        "total_clicks": 7200,
        "avg_accuracy": 72.4,
        "avg_position": 16.8,
        "best_performer": { "article_id": "uuid", "keyword": "bmw oil change interval", "clicks": 980 },
        "insight": "Refresh content recovers an average of 65% of lost traffic within 60 days."
      }
    ],
    "by_content_format": [
      { "format": "guide", "articles": 15, "total_clicks": 12400, "avg_accuracy": 79.8, "avg_position": 11.2 },
      { "format": "how-to", "articles": 12, "total_clicks": 8600, "avg_accuracy": 77.2, "avg_position": 13.8 },
      { "format": "listicle", "articles": 8, "total_clicks": 4200, "avg_accuracy": 74.1, "avg_position": 16.4 },
      { "format": "comparison", "articles": 7, "total_clicks": 2100, "avg_accuracy": 62.3, "avg_position": 22.1 }
    ],
    "seasonal_patterns": [
      {
        "pattern": "Automotive maintenance content peaks March-May and September-October",
        "evidence": "Articles published in March average 1.4x more clicks than articles published in July-August",
        "recommendation": "Frontload maintenance content production to February-March for peak season"
      }
    ],
    "monthly_trend": [
      { "month": "2025-10", "articles_published": 4, "clicks": 1200, "avg_accuracy": 58.2 },
      { "month": "2025-11", "articles_published": 5, "clicks": 2400, "avg_accuracy": 62.8 },
      { "month": "2025-12", "articles_published": 6, "clicks": 3800, "avg_accuracy": 68.4 },
      { "month": "2026-01", "articles_published": 8, "clicks": 5200, "avg_accuracy": 72.1 },
      { "month": "2026-02", "articles_published": 7, "clicks": 6400, "avg_accuracy": 74.8 },
      { "month": "2026-03", "articles_published": 8, "clicks": 7200, "avg_accuracy": 76.8 }
    ]
  }
}
```

### 3.7 GET `/api/feedback/due` (Admin)

Lists articles with pending checkpoint measurements, sorted by due date. Used by admins to monitor the measurement pipeline health.

**Query parameters:**
- `status` -- `overdue`, `due_today`, `upcoming` (optional, default: all)
- `user_id` -- Filter to a specific client (optional)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "due_measurements": [
      {
        "prediction_id": "uuid",
        "article_id": "uuid",
        "user_id": "uuid",
        "keyword": "n54 oil change interval",
        "article_url": "https://client-site.com/blog/n54-oil-change",
        "checkpoint": "30d",
        "published_at": "2026-02-26T10:00:00Z",
        "due_at": "2026-03-31T05:00:00Z",
        "overdue_days": 0,
        "retry_count": 0
      }
    ],
    "summary": {
      "total_due": 14,
      "overdue": 3,
      "due_today": 4,
      "upcoming_7d": 7,
      "measurement_failed": 1
    }
  }
}
```

### 3.8 POST `/api/feedback/measure/:articleId` (Admin)

Manually triggers a checkpoint measurement for a specific article. Useful when the scheduler missed a checkpoint or when an admin wants to force a re-measurement.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "article_id": "uuid",
    "checkpoint": "30d",
    "measurements": {
      "clicks": 387,
      "impressions": 9100,
      "position": 14.2,
      "ctr": 0.0425,
      "sessions": 412,
      "engagement_rate": 0.68
    },
    "accuracy_score": 82.4,
    "accuracy_breakdown": {
      "clicks_accuracy": 92.1,
      "impressions_accuracy": 92.9,
      "position_accuracy": 86.4
    },
    "status": "checked_30d",
    "next_check_at": "2026-04-18T05:00:00Z",
    "data_sources": {
      "gsc": "available",
      "ga4": "available"
    }
  }
}
```

### 3.9 POST `/api/feedback/rollback/:recalibrationId` (Admin)

Rolls back a previously applied recalibration, restoring the weights to their state before the recalibration was applied.

**Request body:**

```json
{
  "reason": "Accuracy declined 4% over the past 2 weeks since recalibration was applied"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "rollback_id": "uuid",
    "rolled_back_event": "uuid",
    "weights_restored": {
      "impressions": 0.30,
      "decay_severity": 0.25,
      "gap_size": 0.25,
      "seasonality_bonus": 0.10,
      "competition_inverse": 0.10
    },
    "reason": "Accuracy declined 4% over the past 2 weeks since recalibration was applied",
    "applied_at": "2026-03-28T16:00:00Z"
  }
}
```

**Error responses:**
- `404 Not Found` -- Recalibration event not found
- `409 Conflict` -- Event has already been rolled back
- `422 Unprocessable Entity` -- Event was a dry_run (nothing to roll back)

---

## 4. Business Rules

### BR-01: Checkpoint Timing with Data Lag Buffer

Checkpoints fire at `published_at + N days + 3 days buffer`, where N is 30, 60, or 90. The 3-day buffer accounts for GSC's known 48-72 hour data lag. The measurement window always covers the full 0-N day period (not the buffered period). Example: article published January 1, 30-day checkpoint fires February 3, measures GSC data from January 1 through January 31.

### BR-02: Minimum Sample Size for Recalibration

Recalibration requires a minimum of 20 articles with completed 90-day accuracy data for the target client. This threshold ensures statistical reliability -- with fewer articles, random variance dominates and weight adjustments would be noise rather than signal. The system computes and displays the estimated time to threshold based on current publishing rate.

### BR-03: Learning Rate Constraint

The recalibration learning rate defaults to 0.05 and is bounded between 0.01 and 0.20. This prevents overfitting to recent data. A learning rate of 0.05 means each signal weight can change by at most 5% of its current value per recalibration cycle. Example: if the impressions weight is 0.30, a single recalibration can move it to at most 0.285 or 0.315 (0.30 +/- 0.05 * 0.30). Combined with the weight bounds (BR-04), this ensures slow, stable convergence.

### BR-04: Weight Bounds Enforcement

No single scoring signal weight can exceed 0.40 or drop below 0.05. This prevents the model from collapsing to a single-signal predictor (which would be brittle and domain-specific in the wrong way). After adjustment, all weights are normalized to sum to 1.0. If normalization pushes a weight beyond bounds, it is clamped and the remaining weights are re-normalized iteratively until all constraints are satisfied.

### BR-05: Dry-Run Requirement

Recalibration must run in dry-run mode (`dry_run: true`) before it can be applied. The system tracks whether a dry-run has been performed for the proposed recalibration within the last 24 hours. Attempting to apply without a prior dry-run returns a `422` with message: "Dry-run required before applying recalibration. Run with dry_run: true first to review proposed changes." This prevents accidental model changes from hasty API calls.

### BR-06: Projected Improvement Threshold

Recalibration is automatically rejected if the backtested projected accuracy improvement is less than 3%. This filters out recalibrations that are within noise range. Admin can override with `force: true`, but the override is logged with the reason field and appears in the audit trail.

### BR-07: Outlier Exclusion

Articles with accuracy scores more than N standard deviations (default 2.0) from the mean are excluded from recalibration inputs. The excluded articles and the reason for exclusion are included in the recalibration response. Common reasons: viral spike (>500% of predicted performance), Google algorithm update during measurement window, URL redirect during measurement. Outlier exclusion is optional (`exclude_outliers: false` to include all articles).

### BR-08: Accuracy Score Calculation Formula

Per-metric accuracy is: `metric_accuracy = max(0, 100 - abs(predicted - actual) / max(predicted, 1) * 100)`.

Composite accuracy per checkpoint: `accuracy = (clicks_accuracy * 0.40) + (impressions_accuracy * 0.35) + (position_accuracy * 0.25)`.

Position accuracy uses sensitivity weighting: `position_accuracy = max(0, 100 - abs(predicted_pos - actual_pos) / max(predicted_pos, 1) * 100 * position_weight)` where `position_weight` = 2.0 if actual position <= 10 (page 1), 1.5 if <= 20 (page 2), 1.0 if <= 30, 0.5 if > 30. Page 1 deviations are penalized more heavily because a 2-position change on page 1 has far more traffic impact than a 2-position change on page 5.

### BR-09: Low-Volume Confidence Adjustment

Articles with actual impressions below 500 at any completed checkpoint are flagged as `low_confidence`. In aggregate accuracy calculations, these articles are weighted at 50% (they contribute but do not dominate). In recalibration inputs, they are weighted at 50% of a normal article. The 500-impression threshold is configurable but should not drop below 200.

### BR-10: Anomaly Detection Thresholds

Articles are automatically flagged when: (a) actual performance exceeds 500% of predicted (`viral_spike`), (b) actual performance is below 10% of predicted AND position > 50 (`no_index` -- article likely not indexed), (c) URL returns HTTP 301 (`url_changed`), (d) URL returns HTTP 404/410 (`article_removed`). Flagged articles are excluded from recalibration by default.

### BR-11: Recalibration Frequency Guard

The system prevents recalibration more frequently than every 30 days per client. If an admin attempts to recalibrate within 30 days of the last applied recalibration, the system warns: "Last recalibration was applied N days ago. Recommended minimum interval is 30 days to allow new predictions to mature. Proceed with force: true to override." Recommended cadence is quarterly (every 90 days).

### BR-12: One Active Prediction Per Article

Each article has exactly one `performance_predictions` row. The unique constraint on `article_id` enforces this. If an article is refreshed/regenerated, a new article_id is created, and the old prediction record remains as historical data. The old and new articles are linked via the `opportunity_id` (the same keyword opportunity can produce multiple article versions over time).

### BR-13: Report Caching

Performance reports are cached for 24 hours (configurable). The cache key is `(user_id, report_type, period_start, period_end)`. If a checkpoint completes or recalibration is applied during the cache window, the cache is invalidated and the next report request regenerates. Users can force regeneration via `force_regenerate: true`.

### BR-14: GSC Token Expiry Handling

If a client's GSC OAuth token is expired at checkpoint time, the measurement is retried daily for up to 7 days. After 7 failed days, the prediction record is marked `measurement_failed` with a note in `measurement_metadata` explaining the failure. The user is notified (via the Performance dashboard and optionally webhook) to reconnect their GSC account. Failed measurements are excluded from accuracy aggregates and recalibration.

### BR-15: Weight Normalization Constraint

After every recalibration weight adjustment, all weights must sum to exactly 1.0 (within floating-point tolerance of 0.001). Normalization is applied after bounds clamping. The normalization algorithm:
1. Apply learning-rate-scaled deltas to each weight
2. Clamp each weight to [0.05, 0.40]
3. Compute sum of clamped weights
4. If sum != 1.0, distribute the difference proportionally across unclamped weights
5. Repeat steps 2-4 until convergence (max 10 iterations)
6. Final rounding to 2 decimal places with residual applied to the largest weight

---

## 5. Performance Tracking

### 5.1 The Three-Checkpoint System

The Feedback Loop monitors every published article at three fixed intervals post-publication. Each checkpoint answers a different question about the article's performance trajectory:

**30-Day Checkpoint (Early Signal):**
- **Question:** Did Google index the article? Is it appearing in search results?
- **Expected behavior:** Article is indexed, starting to accumulate impressions. Position is volatile (Google is testing placement). Clicks may be low if position is still settling beyond page 1.
- **Typical accuracy:** 60-70% (early volatility makes precise prediction difficult)
- **Actionable insight:** If zero impressions at 30 days, investigate indexing issues. If impressions are 3x+ prediction, the keyword may be broader than estimated.

**60-Day Checkpoint (Stabilization):**
- **Question:** Has the article found its natural ranking position? Are clicks materializing?
- **Expected behavior:** Position has stabilized within 3-5 spots of its long-term position. Click patterns are more consistent. CTR is measurable.
- **Typical accuracy:** 70-80% (position stabilization improves prediction reliability)
- **Actionable insight:** If position improved significantly from 30d to 60d, the article is gaining authority. If position declined, competitors may have published fresher content.

**90-Day Checkpoint (Definitive):**
- **Question:** What is the article's true performance level? Was the prediction accurate?
- **Expected behavior:** Full performance picture. Position, clicks, and impressions have reached steady state. This is the checkpoint used for recalibration.
- **Typical accuracy:** 75-85% (target: 78%+ mean across portfolio)
- **Actionable insight:** This is the definitive comparison. Articles significantly underperforming predictions here indicate a systematic scoring error that recalibration should address.

### 5.2 Checkpoint Scheduling

When an article is published (detected via the `publish_records` table insert), the Feedback Loop creates a prediction record and sets `next_check_at = published_at + 33 days` (30 days + 3-day buffer). The scheduler runs daily at 05:00 UTC and processes all prediction records where `next_check_at <= now()`.

**Scheduling distribution:** To avoid all checkpoints landing at midnight and creating a burst of GSC/GA4 API calls, the scheduler distributes checks across the day. Each article's checkpoint time is deterministically assigned based on a hash of the article_id: `check_hour = hashCode(article_id) % 20 + 2` (distributing between 02:00 and 21:00 UTC). This prevents API rate limit issues for clients with large portfolios.

**Checkpoint transition schedule:**

| Event | `check_status` | `next_check_at` |
|-------|----------------|-----------------|
| Article published | `pending_30d` | `published_at + 33 days` |
| 30-day measurement complete | `checked_30d` -> `pending_60d` | `published_at + 63 days` |
| 60-day measurement complete | `checked_60d` -> `pending_90d` | `published_at + 93 days` |
| 90-day measurement complete | `checked_90d` -> `complete` | NULL |
| Measurement failed (7 retries) | `measurement_failed` | NULL |
| Article deleted (404 detected) | `article_removed` | NULL |

### 5.3 GSC + GA4 Data Collection

**GSC data pulled per checkpoint:**
- Clicks, impressions, CTR, average position for the article URL
- Per-query breakdown (all queries the article ranks for)
- Date range: `published_at` to `published_at + N days` (where N = 30, 60, or 90)
- Uses the client's GSC OAuth token via Data Ingestion Service
- If the article ranks for queries not in the prediction (bonus queries), these are stored in `measurement_metadata` for analysis

**GA4 data pulled per checkpoint:**
- Sessions for the article URL
- Engagement rate (engaged sessions / total sessions)
- Average session duration
- Conversions (if configured by the client)
- GA4 is supplementary -- if GA4 is unavailable (no connection or token expired), the checkpoint proceeds with GSC data only. A `ga4_unavailable` flag is added to `measurement_metadata`.

### 5.4 Accuracy Aggregation

Accuracy is aggregated at multiple levels:

1. **Per-article:** The `accuracy_score_30d`, `accuracy_score_60d`, `accuracy_score_90d` fields on each prediction record.

2. **Per-user (portfolio):** Mean and median accuracy across all articles for the user, optionally filtered by checkpoint period, recommendation type, or content format. Low-confidence articles weighted at 50%.

3. **Per-signal:** How accurate each scoring signal is. Example: "The impressions signal overestimates by an average of 18% for this client." Computed by analyzing the correlation between signal component values (from `prediction_metadata.scoring_components`) and actual outcomes.

4. **Per-recommendation-type:** Do gap recommendations outperform decay recommendations? The `opportunity_type` field enables this breakdown.

5. **Temporal trend:** Monthly average accuracy showing improvement over time, plotted as the "accuracy improvement curve" on the dashboard. This is the chart that proves "ChainIQ gets smarter."

---

## 6. Prediction vs Actual Comparison

### 6.1 How Predictions Are Stored

Predictions are captured at the moment a keyword opportunity transitions from "recommended" to "in pipeline." The Content Intelligence Service (Layer 2) provides the prediction values based on its scoring formula and historical data analysis. The Feedback Loop stores:

- **Predicted clicks** at 30d, 60d, 90d -- extrapolated from the scoring formula's traffic estimation model. The model uses search volume, estimated CTR at the predicted position, and a time-to-rank curve.
- **Predicted impressions** at 30d, 60d, 90d -- based on search volume and estimated ranking position. Accounts for the typical indexing ramp (impressions start low and build over the first 2-3 weeks).
- **Predicted position** -- the initial SERP position the article is expected to achieve, based on keyword difficulty, client domain authority, and content quality score from the Quality Gate.
- **Scoring weights used** -- the exact weights active at prediction time. This allows retrospective analysis: "This article was scored with old weights that overvalued impressions."
- **Scoring component values** -- the individual contributions of each signal to the priority score. Used for per-signal accuracy analysis.

All prediction data is immutable once stored. If the Intelligence engine is later recalibrated and would produce different predictions for the same keyword, the original predictions remain unchanged -- they represent what the system believed at the time.

### 6.2 What "Actual" Data Is Collected

At each checkpoint, the system collects:

- **Actual clicks** -- total organic clicks from GSC for the article URL over the measurement window
- **Actual impressions** -- total GSC impressions
- **Actual average position** -- average SERP position weighted by impressions (GSC's standard calculation)
- **Actual CTR** -- click-through rate from GSC
- **Actual sessions** -- GA4 sessions (supplements GSC clicks with on-site behavior data)
- **Actual engagement rate** -- GA4 engaged sessions / total sessions

The system also captures metadata not used in accuracy scoring but valuable for analysis: query breakdown (which queries drove traffic), referral sources (organic vs other), and content engagement signals.

### 6.3 Comparison Visualization

The primary comparison visualization is a dual-axis line chart showing predicted vs actual at each completed checkpoint:

```
  Clicks
  1800 |                           ╔════ Actual
  1400 |              ────────╱═══╗╝
  1000 |         ────╱═══════╝        ──── Predicted
   600 |     ───╱═══╝
   200 |  ──╱═╝
       +────────┬──────────┬──────────┬
           Publish     30d         60d        90d
```

Each checkpoint shows:
- Predicted value (dashed line, from the original prediction)
- Actual value (solid line, from checkpoint measurements)
- Delta band (shaded area between the two lines, colored green when actual >= predicted, red when actual < predicted)
- Accuracy score badge at each checkpoint

For impressions and position, separate mini-charts or a tabbed view show the same comparison.

### 6.4 Statistical Significance Thresholds

Not all prediction-vs-actual differences are meaningful. The system applies significance thresholds before drawing conclusions:

- **Clicks:** Difference must exceed 20% OR 50 absolute clicks (whichever is larger) to be classified as a meaningful over/under-prediction. Below this threshold, the prediction is rated "accurate within noise."
- **Impressions:** Difference must exceed 15% OR 200 absolute impressions.
- **Position:** Difference must exceed 3 positions for page 1 (positions 1-10), 5 positions for page 2 (positions 11-20), 10 positions for page 3+ (positions 21+). The variable threshold reflects that position changes matter less as you move deeper into results.

Articles where all metrics fall within noise thresholds receive a minimum accuracy score of 85 (not 100, because "within noise" is not the same as "perfectly predicted").

---

## 7. Recalibration Engine

### 7.1 Algorithm Overview

The recalibration engine uses gradient-based weight adjustment with a bounded learning rate. It is not machine learning in the traditional sense -- there is no training loop, no neural network, no feature engineering. It is a structured error-correction process that adjusts five weights based on empirical performance data.

**Step 1: Data collection.** Gather all articles for the target client with completed 90-day accuracy data (minimum 20).

**Step 2: Outlier exclusion.** Compute mean and standard deviation of accuracy scores. Exclude articles with accuracy more than N standard deviations from the mean (default N=2.0). Record excluded articles with reasons.

**Step 3: Per-signal error analysis.** For each of the five scoring signals (impressions, decay_severity, gap_size, seasonality_bonus, competition_inverse):
- Compute the Pearson correlation between the signal's component contribution (from `prediction_metadata.scoring_components`) and the article's 90-day accuracy score.
- Compute the mean prediction error direction: does this signal tend to overestimate or underestimate actual performance?
- Compute the mean absolute error percentage attributed to this signal.

**Step 4: Weight adjustment (gradient step).** For each signal:
```
error_direction = mean(predicted_component - actual_equivalent) / mean(predicted_component)
adjustment = -error_direction * learning_rate * current_weight
new_weight = current_weight + adjustment
```
A positive `error_direction` (overestimation) produces a negative adjustment (weight decreases). A negative `error_direction` (underestimation) produces a positive adjustment (weight increases).

**Step 5: Bounds enforcement.** Clamp each weight to [0.05, 0.40]. This prevents the model from collapsing to a single signal or becoming degenerate.

**Step 6: Normalization.** Normalize weights to sum to 1.0 using the iterative algorithm described in BR-15.

**Step 7: Backtesting.** Re-score all historical articles with the proposed new weights. For each article, recompute the priority score using new weights and compare against actual performance. Calculate the projected mean accuracy with new weights vs old weights.

**Step 8: Decision.** If projected improvement >= 3% (or `force: true`), recommend application. Otherwise, recommend keeping current weights.

### 7.2 Dry-Run Mode

Dry-run mode executes steps 1-8 without modifying any database state. It returns the full proposed recalibration including:
- Current weights and proposed weights
- Per-signal analysis with recommendations
- Backtest results showing how many articles would improve/worsen
- Projected accuracy improvement with 95% confidence interval
- Human-readable changes summary

The admin reviews the dry-run output, verifies the proposed changes make domain sense (e.g., "decreasing impressions weight makes sense because this client targets niche keywords where volume is not the primary value driver"), and then calls the endpoint again with `dry_run: false` to apply.

### 7.3 Admin Approval Gate

Recalibration is never automatic. The rationale:

1. **Weight changes affect all future recommendations.** A bad recalibration degrades every recommendation until the next recalibration corrects it.
2. **Transient anomalies can corrupt the model.** A Google algorithm update, a viral spike, a seasonal outlier -- all produce accuracy deviations that look like systematic errors but are actually transient.
3. **Domain expertise matters.** An admin can recognize that a weight change does not make sense for a specific client's vertical. The algorithm might suggest decreasing seasonality weight because seasonal predictions were inaccurate, but the admin knows the client is in a highly seasonal industry and the inaccuracy was due to a one-time event, not a systematic flaw.

The admin approval gate is implemented as: (a) dry-run required before apply (BR-05), (b) the apply endpoint requires admin role, (c) the response includes a `recommendation` field with a human-readable assessment.

### 7.4 Audit Trail

Every recalibration event (dry-run, applied, rolled back, auto-reverted) is recorded in `scoring_weight_history` with:
- Complete before/after weights
- The data that drove the decision (sample size, per-signal analysis, backtest results)
- Who triggered it (admin user ID)
- Why it was applied/rejected (changes summary, projected improvement)
- Rollback linkage (if this event was rolled back, which event superseded it)

The audit trail enables:
- **Temporal analysis:** How have weights evolved over 6 months? Is the model converging?
- **Accountability:** Who changed the weights, when, and based on what evidence?
- **Rollback:** If a recalibration produces worse outcomes, the admin can rollback to the exact previous state.

### 7.5 Rollback Capability

The rollback endpoint (`POST /api/feedback/rollback/:recalibrationId`) restores the weights from before the specified recalibration event. Rollback creates a new `scoring_weight_history` entry with `event_type: 'rolled_back'` that references the original event via `rollback_of`. The original event's `superseded_by` field is set to the rollback event's ID.

Rollbacks are immediate (no dry-run required) because they restore known-good weights rather than computing new ones. The admin must provide a `reason` field explaining why the rollback is needed.

### 7.6 Auto-Revert Safety

As a safety mechanism, the system monitors accuracy after a recalibration is applied. If the mean accuracy of articles predicted AFTER the recalibration is consistently 5+ percentage points lower than the mean accuracy of articles predicted BEFORE the recalibration (measured over a minimum of 5 new articles), the system automatically reverts to the pre-recalibration weights and creates an `auto_reverted` event in the history. The admin is notified. This prevents a bad recalibration from degrading recommendations indefinitely.

---

## 8. Performance Reports

### 8.1 Report Types

| Type | Cadence | Period | Trigger |
|------|---------|--------|---------|
| Monthly | 1st of each month | Previous calendar month | Scheduled or on-demand |
| Quarterly | 1st of Jan/Apr/Jul/Oct | Previous 3 calendar months | Scheduled or on-demand |
| Custom | On demand | User-specified date range | User request via API |
| On demand | On demand | Most recent 30 days | Dashboard "Generate Report" button |

### 8.2 Report Contents

Every report includes these sections:

**1. Executive Summary:**
- Articles published in the period
- Total organic clicks generated
- Total impressions
- Average prediction accuracy (with trend arrow vs previous period)
- Estimated traffic value (clicks x avg CPC for targeted keywords)
- One-sentence performance highlight (generated from data, e.g., "Gap recommendations drove 72% of total clicks this month")

**2. Top Performers (Top 5 by clicks):**
- Article title, keyword, URL
- Clicks, impressions, average position
- Predicted vs actual clicks with accuracy score
- Opportunity type and content format
- Insight: why this article succeeded (e.g., "Low-competition keyword with thin SERP results allowed rapid page-1 ranking")

**3. Underperformers (Bottom 5 by accuracy):**
- Same fields as top performers
- Root cause analysis: why the prediction missed (e.g., "SERP was dominated by DA 70+ competitors; the saturation index correctly identified high competition but the scoring formula gave insufficient penalty relative to the client's DA of 42")
- Recommendation for future avoidance (e.g., "Avoid comparison keywords against DA 70+ competitors until DR exceeds 60")

**4. Accuracy Trending:**
- Line chart data showing monthly average accuracy
- Improvement percentage vs previous period
- Recalibration events annotated on the timeline
- Signal showing whether the system is learning (accuracy should trend upward after recalibrations)

**5. Portfolio Health:**
- Distribution: articles on page 1, page 2, page 3+, not ranking
- Lifecycle status: growing (traffic increasing), stable, declining
- Decay alerts: articles showing early signs of traffic decline
- Content age distribution

**6. ROI Metrics:**
- Total traffic value (clicks x CPC equivalent)
- Subscription cost for the period
- Estimated production cost (articles x average production time)
- Net ROI percentage
- Cumulative ROI (total value since subscription start vs total cost)
- Breakeven projection (if not yet breakeven)

**7. Recommendations for Next Period:**
- Data-driven suggestions generated from portfolio analytics
- Example: "Gap recommendations outperformed decay by 10% accuracy. Allocate 70% of content budget to new-topic gaps."
- Seasonal opportunities for the upcoming period
- Refresh candidates (articles showing early decay)

### 8.3 Output Formats

**JSON:** Complete structured data as shown in the API response. Used for dashboard rendering. Includes all chart data points, all article details, all recommendations.

**HTML:** Pre-rendered report suitable for email delivery or PDF conversion. Uses inline CSS (no external stylesheets) for email compatibility. Includes:
- Header with ChainIQ branding (or white-label branding for agency clients)
- Table layouts for article performance
- Inline chart images (generated server-side as SVG, converted to base64 PNG for email)
- Print-friendly CSS media query
- RTL support via `dir="rtl"` attribute and CSS logical properties for Arabic reports

### 8.4 Report Generation Pipeline

1. Query `performance_predictions` for all articles in the date range
2. Compute aggregate statistics (total clicks, impressions, accuracy)
3. Rank articles by clicks (top performers) and accuracy ascending (underperformers)
4. Generate per-article insights using rule-based templates (no AI generation needed)
5. Compute ROI metrics using CPC data from `keyword_opportunities`
6. Generate recommendations using rule engine (pattern matching on portfolio data)
7. Assemble JSON structure
8. If HTML requested, render via HTML template engine (server-side)
9. Store in `performance_reports` table with cache expiry set to 24 hours
10. Return to caller

**Performance target:** Report generation should complete within 10 seconds for monthly reports (up to 30 articles) and 30 seconds for quarterly reports (up to 100 articles).

---

## 9. Content Portfolio Analytics

### 9.1 Purpose

Portfolio analytics provides the aggregate, cross-article view that individual prediction tracking cannot. While the predictions endpoint shows "how did this article perform?", portfolio analytics answers strategic questions:

- **Which recommendation types work best for my site?** Gap vs decay vs seasonal vs trending -- broken down by accuracy, clicks, and ROI.
- **Which content formats perform best?** Guide vs how-to vs listicle vs comparison -- which formats drive the most traffic for this domain?
- **What seasonal patterns exist in my portfolio?** Does my content perform better when published at certain times of year? Are there seasonal categories I should invest in?
- **How does voice persona affect performance?** (When Voice Intelligence data is available.) Does the "Technical Expert" persona drive more engagement than the "Beginner-Friendly Explainer"?
- **What is my overall content ROI trajectory?** Is the cumulative traffic value growing faster than cumulative cost?

### 9.2 Topic Performance

Articles are grouped by their primary keyword cluster (derived from the `keyword` field using shared-prefix analysis and semantic grouping). Each cluster shows:

- Number of articles in the cluster
- Total clicks across the cluster
- Average accuracy for the cluster
- Best-performing article in the cluster
- Trend: is the cluster growing, stable, or declining?

Example: A BMW maintenance publisher might see clusters like:
- "N54 engine problems" (8 articles, 12,400 clicks, 82% accuracy, growing)
- "BMW oil change" (4 articles, 4,200 clicks, 76% accuracy, stable)
- "BMW vs competitors" (5 articles, 2,100 clicks, 58% accuracy, declining)

This surfaces the insight that N54-specific content dramatically outperforms comparison content, informing content strategy.

### 9.3 Seasonal Patterns

The portfolio analytics engine detects seasonal patterns by analyzing monthly click distribution across all articles:

1. Group articles by publication month
2. For each month, compute average clicks-per-article at 90 days
3. Normalize by removing the growth trend (a site that is gaining authority will see later articles perform better regardless of season)
4. Identify months with statistically significant over/under-performance (>1 standard deviation from the detrended mean)
5. Surface as actionable patterns: "Your content performs 40% better when published in March-April vs July-August"

### 9.4 Format Effectiveness

Tracks performance by `content_format` field:

| Format | Articles | Avg Clicks | Avg Accuracy | Avg Position | Insight |
|--------|----------|------------|--------------|--------------|---------|
| Guide | 15 | 827 | 79.8% | 11.2 | Best overall performer |
| How-to | 12 | 717 | 77.2% | 13.8 | Reliable mid-tier |
| Listicle | 8 | 525 | 74.1% | 16.4 | Lower accuracy, still viable |
| Comparison | 7 | 300 | 62.3% | 22.1 | Underperforming -- high competition |

This analysis directly informs the `content_type_suggestion` field in future recommendations (BR-04 in Content Intelligence). If the Feedback Loop consistently shows that comparison articles underperform for a specific client, the Intelligence engine should reduce its frequency of comparison recommendations.

### 9.5 Voice Persona Performance

When Voice Intelligence data is available (Layer 3), portfolio analytics tracks which voice personas produce the best-performing content:

- Persona A ("Technical Expert"): 12 articles, avg accuracy 81%, avg engagement rate 0.72
- Persona B ("Beginner Friendly"): 8 articles, avg accuracy 74%, avg engagement rate 0.65
- Persona C ("Conversational"): 5 articles, avg accuracy 69%, avg engagement rate 0.71

This data feeds back to Voice Intelligence to inform persona selection for future articles.

---

## 10. Auth & Permissions

### Role Matrix

| Action | Anonymous | User (owner) | User (other) | Admin | Service Role |
|--------|-----------|-------------|--------------|-------|-------------|
| View own predictions | NO | YES | NO | YES | YES |
| View own accuracy stats | NO | YES | NO | YES | YES |
| View own reports | NO | YES | NO | YES | YES |
| View own portfolio analytics | NO | YES | NO | YES | YES |
| View recalibration history (own) | NO | YES | NO | YES | YES |
| View other user's predictions | NO | NO | NO | YES | YES |
| View other user's reports | NO | NO | NO | YES | YES |
| Trigger checkpoint measurement | NO | NO | NO | YES | YES |
| View due measurements | NO | NO | NO | YES | YES |
| Trigger recalibration (dry run) | NO | NO | NO | YES | YES |
| Apply recalibration | NO | NO | NO | YES | YES |
| Rollback recalibration | NO | NO | NO | YES | YES |
| Write prediction records | NO | NO | NO | NO | YES |
| Write measurement data | NO | NO | NO | NO | YES |
| Generate reports | NO | YES (own) | NO | YES | YES |

### Implementation Notes

- All user-facing endpoints verify authentication via the Auth & Bridge Server middleware (`verifyAuth(req)`)
- User-scoped endpoints apply Supabase RLS: `auth.uid() = user_id`
- Admin endpoints check the user's role from the Supabase JWT claims
- Service role (bridge server internal operations) uses the `service_role` key to bypass RLS for scheduled operations (checkpoint measurements, report generation)
- Recalibration endpoints (POST recalibrate, POST rollback) verify admin role at the API layer AND the `triggered_by` field in the database records the admin's user ID for audit

---

## 11. Validation Rules

### VR-01: Prediction Record Creation
- `article_id` must reference an existing article in the `articles` table
- `keyword` must be non-empty, trimmed, max 500 characters
- `published_at` must not be in the future (articles must be published to track)
- All `predicted_*` values must be non-negative integers (clicks, impressions) or positive decimals (position)
- `predicted_clicks_30d <= predicted_clicks_60d <= predicted_clicks_90d` (cumulative values must be monotonically increasing)
- `predicted_impressions_30d <= predicted_impressions_60d <= predicted_impressions_90d` (same)
- `prediction_metadata` must contain at minimum: `recommendation_score`, `scoring_weights_used`, `scoring_components`

### VR-02: Checkpoint Measurement
- `actual_*` values must be non-negative when set
- Checkpoint measurements must proceed in order: 30d before 60d before 90d
- Cannot measure a checkpoint if the previous checkpoint has not been completed (except with admin force-measure)
- `accuracy_score_*` values must be in range [0, 100]
- `checked_*_at` timestamps must be after `published_at + N days` (cannot measure a checkpoint before the window has elapsed)

### VR-03: Recalibration Request
- `user_id` must be a valid user with at least 1 article tracked
- `learning_rate` must be in range [0.01, 0.20]
- `min_sample_size` must be >= 5 (absolute minimum) and <= 1000
- `outlier_threshold_std` must be in range [1.0, 4.0]
- Cannot recalibrate for a user with zero completed 90-day checkpoints

### VR-04: Weight Values
- Every weight in `weights_before` and `weights_after` must be in range [0.05, 0.40]
- Weights must sum to 1.0 (within tolerance of 0.001)
- Weight keys must match the expected set: `impressions`, `decay_severity`, `gap_size`, `seasonality_bonus`, `competition_inverse`
- No additional weight keys allowed (future signals require a schema migration)

### VR-05: Report Parameters
- `period_start` must be before `period_end`
- `period_end` must not be in the future (can report on today but not tomorrow)
- Date range must not exceed 366 days (maximum 1 year per report)
- `report_type` of `custom` requires both `start` and `end` parameters

### VR-06: Rollback Validation
- Target recalibration event must exist and be of type `applied`
- Cannot rollback a `dry_run`, `rolled_back`, or `auto_reverted` event
- Cannot rollback an event that has already been superseded (check `superseded_by IS NULL`)
- `reason` field is required and must be non-empty (max 2000 characters)

### VR-07: Article URL Validation
- `article_url` must be a valid HTTP/HTTPS URL
- `original_url` is set once at prediction creation and never modified
- URL changes detected via 301 redirects update `article_url` only (not `original_url`)

### VR-08: Anomaly Flag Validation
- Only allowed values: `viral_spike`, `url_changed`, `low_confidence`, `seasonal_content`, `google_algo_update`, `competitor_surge`, `no_index`, `article_removed`
- Flags are append-only (removing a flag requires admin intervention)

### VR-09: Portfolio Query Validation
- `date_from` must be before `date_to` when both provided
- `group_by` must be one of: `recommendation_type`, `content_format`, `month`, `keyword_cluster`
- Pagination: `page >= 1`, `per_page` in range [1, 100]

### VR-10: Accuracy Computation Validation
- If `predicted = 0` and `actual = 0`, accuracy = 100 (both correct)
- If `predicted = 0` and `actual > 0`, accuracy = 0 (complete miss)
- If `predicted > 0` and `actual = 0`, accuracy = 0 (complete miss)
- Accuracy is always clamped to [0, 100] after computation

---

## 12. Error Handling

### E-01: GSC Data Unavailable at Checkpoint

**Trigger:** GSC API returns no data for the article URL, or OAuth token is expired.
**Impact:** Cannot complete checkpoint measurement.
**Automatic response:**
1. Log the failure with error details in `measurement_metadata.errors[]`
2. Increment `retry_count` in measurement metadata
3. If retry_count < 7: reschedule checkpoint for tomorrow (same time)
4. If retry_count >= 7: set `check_status = 'measurement_failed'`, set `next_check_at = NULL`
5. Add error note: distinguish between "no data yet" (GSC lag) and "token expired" (user action required)
6. If token expired: fire webhook event `feedback.token_expired` for user notification
**User message:** "GSC data unavailable for [article]. Retrying tomorrow. If this persists, please reconnect your Google Search Console account."

### E-02: Article Deleted Before Checkpoint

**Trigger:** When pulling GSC data, the article URL returns HTTP 404 or 410.
**Impact:** No page to measure; prediction becomes unmeasurable.
**Automatic response:**
1. Set `check_status = 'article_removed'`, `next_check_at = NULL`
2. Add `article_removed` to `anomaly_flags`
3. Exclude from accuracy aggregates and recalibration inputs
4. Store HTTP status code in `measurement_metadata`
**User message:** None (article deletion is a user action; display "Article removed" status on dashboard).

### E-03: Insufficient Data for Recalibration

**Trigger:** Admin triggers recalibration but fewer than `min_sample_size` articles have 90-day data.
**Impact:** Cannot reliably compute weight adjustments.
**Automatic response:**
1. Return HTTP 422 with detailed message
2. Compute estimated weeks to threshold based on current publishing rate and articles currently in 30d/60d tracking
3. Suggest specific actions: "Publish 6 more articles to reach the 20-article threshold"
**User message:** "Recalibration requires 20+ articles with 90-day data. You have 14. At your current rate, you'll reach the threshold in approximately 6 weeks."

### E-04: Weight Oscillation Detected

**Trigger:** Recalibration proposes a weight change that would reverse the direction of the previous recalibration's change for the same signal (e.g., impressions went 0.30 -> 0.25 last time, now proposed 0.25 -> 0.30).
**Impact:** Oscillating weights indicate the recalibration is chasing noise rather than signal.
**Automatic response:**
1. Flag the oscillation in the recalibration response: `"warning": "Weight oscillation detected for impressions (0.30 -> 0.25 -> 0.30). This may indicate insufficient data or transient effects."`
2. Reduce the learning rate by 50% for the oscillating signal (dampen the oscillation)
3. Log the oscillation in `metadata.warnings`
4. Do not block the recalibration, but include the warning prominently
**Admin guidance:** "Consider waiting 30+ additional days before recalibrating this signal, or increasing the outlier exclusion threshold to filter transient effects."

### E-05: Report Generation Timeout

**Trigger:** Report generation exceeds 30 seconds (for quarterly reports with 100+ articles).
**Impact:** User request times out.
**Automatic response:**
1. Return HTTP 202 Accepted with a `report_id` and `status: 'generating'`
2. Continue generation in background
3. When complete, store report and mark as ready
4. Subsequent GET requests with the same parameters return the completed report
5. Fire webhook event `feedback.report_ready` when generation completes
**User message:** "Your report is being generated. This may take up to 60 seconds for large portfolios. Refresh the page to check status."

### E-06: Recalibration Produces Negative Improvement

**Trigger:** Backtest shows the proposed weights would produce LOWER accuracy than current weights.
**Impact:** Applying the recalibration would degrade recommendation quality.
**Automatic response:**
1. Set recommendation to "REJECT: Proposed weights produce -X% accuracy regression."
2. Return the full analysis anyway (admin may have context the algorithm does not)
3. Block application unless `force: true`
4. If `force: true`, log the override with the admin's reason
**User message:** "Recalibration analysis complete. Current weights are performing better than proposed adjustments. No changes recommended."

### E-07: GSC Data Anomaly (Zero Impressions for Indexed Article)

**Trigger:** GSC returns zero impressions for an article URL that was previously returning data.
**Impact:** May indicate URL change, deindexing, or GSC data delay.
**Automatic response:**
1. Check HTTP status of article URL (is it still live?)
2. If 301: update `article_url`, add `url_changed` flag, retry measurement with new URL
3. If 200 (page exists but no GSC data): add `possible_deindex` note to measurement metadata, retry next day
4. If 404: handle per E-02
**User message:** "No search data found for [article]. We're investigating and will retry tomorrow."

### E-08: Concurrent Recalibration Conflict

**Trigger:** Two admin users attempt recalibration for the same client simultaneously.
**Impact:** Race condition could produce inconsistent weight state.
**Automatic response:**
1. Use database advisory lock on the user_id during recalibration
2. Second request receives HTTP 409 Conflict: "Recalibration already in progress for this client. Please wait for the current operation to complete."
3. Lock released when the first recalibration completes (or times out after 120 seconds)
**User message:** "Another recalibration is in progress for this client. Please try again in a moment."

---

## 13. Edge Cases

### EC-01: Article URL Changed After Publication

An article published at `/blog/n54-hpfp-guide` is later moved to `/guides/bmw/n54-hpfp-symptoms`. **Handling:** At each checkpoint, before pulling GSC data, the system performs an HTTP HEAD request to the stored `article_url`. If it returns 301/302, the system follows the redirect chain (max 5 hops), updates `article_url` to the final destination, adds `url_changed` flag to `anomaly_flags`, and logs the redirect chain in `measurement_metadata`. GSC data is then pulled for BOTH the original URL (which may still have historical data) and the new URL, and the results are merged. The `original_url` field is never modified.

### EC-02: Viral Spike Skewing Accuracy

An article predicted to get 500 clicks at 30 days goes viral on social media and gets 25,000 clicks. The accuracy score would be wildly inflated (5000% of prediction). **Handling:** Articles where actual performance exceeds 500% of prediction are flagged as `viral_spike`. The accuracy score is still computed and stored (it is factual), but the article is excluded from aggregate accuracy calculations and recalibration inputs by default. In the dashboard, viral articles are displayed with a special badge: "Viral: excluded from accuracy metrics." The rationale: viral performance is not predictable and not repeatable -- including it would artificially inflate accuracy metrics and corrupt recalibration.

### EC-03: Seasonal Content Measured Out of Season

An article about "BMW winter tire recommendations" published in September is measured at 30 days (October, approaching peak) and 90 days (December, during peak). The 90-day accuracy might be artificially high because the article happened to be measured during its seasonal peak. **Handling:** The `prediction_metadata` includes `seasonal_peak_months` from the Intelligence engine. If the 90-day measurement window overlaps with the peak season AND the prediction was made before the peak, the system adds a `seasonal_content` flag. These articles are included in accuracy calculations but noted in reports: "Performance may be inflated by seasonal peak alignment." For recalibration, articles with seasonal flag have their seasonal_bonus component excluded from the per-signal accuracy analysis (to prevent the model from over-crediting the seasonality signal).

### EC-04: Very Low Volume Keywords (< 100 Impressions)

A keyword with 80 monthly searches generates an article that gets 72 clicks at 90 days. The absolute numbers are correct, but the statistical margin is too wide for meaningful prediction. **Handling:** Per BR-09, articles with actual impressions below 500 at any checkpoint are flagged as `low_confidence`. They contribute at 50% weight to aggregates. In reports, they are displayed normally but with a note: "Low-volume keyword -- accuracy metric has wider confidence interval." The 500-impression threshold filters out approximately 15-20% of articles for a typical client, leaving enough data for meaningful analysis.

### EC-05: Article Published to Multiple Platforms

A client publishes the same article to their WordPress blog AND to Medium. GSC may show data for both URLs. **Handling:** The prediction record tracks the primary URL (from `publish_records`). If the system detects the same content on multiple URLs (via canonical tag or content similarity detection during measurement), it pulls GSC data for the primary URL only. Duplicate URLs are logged in `measurement_metadata.duplicate_urls`. Traffic from non-primary URLs is NOT included in accuracy calculations, as the prediction was for the primary URL's performance only.

### EC-06: Recalibration with Only 5 Articles (Below Threshold)

A new client has published 5 articles, all with 90-day data. They want recalibration but are well below the 20-article minimum. **Handling:** The system returns a 422 with a detailed response (see E-03). However, the admin CAN run a dry-run to see what the recalibration WOULD propose if the threshold were lower. This is useful for diagnostics: "Even with limited data, gap_size appears to be the strongest signal for this client." The dry-run output includes a warning: "Sample size of 5 is below the 20-article minimum. Results are directionally indicative but not statistically reliable."

### EC-07: New Client with No Historical Data

A client just subscribed and has zero published articles. **Handling:** The Performance dashboard shows an onboarding state: "Publish your first article to start tracking predictions. After 20 articles reach 90-day maturity, ChainIQ will automatically tune its recommendations for your site." All API endpoints return valid but empty responses. The accuracy endpoint returns `"insufficient_data": true` with `"articles_needed": 1` for basic tracking and `"articles_needed": 20` for recalibration.

### EC-08: Google Algorithm Update During Measurement Window

Google releases a major algorithm update (e.g., core update) during the 30-60 day window for multiple articles. Rankings shift dramatically across the board. **Handling:** The system does not automatically detect Google algorithm updates (this would require an external signal). However, if multiple articles for the same client show >30% accuracy deviation at the same checkpoint within a 7-day window, the system adds a `possible_algo_update` note to `measurement_metadata`. Admin can manually add the `google_algo_update` flag to affected articles, which excludes them from recalibration. Future enhancement: integrate with Google algorithm update tracking APIs.

### EC-09: Prediction Record Missing (Legacy Article)

An article was published before the Feedback Loop was implemented, so no prediction record exists. **Handling:** The system detects articles in `publish_records` without corresponding `performance_predictions` rows. These articles are tracked for GSC/GA4 data in `performance_snapshots` (via Data Ingestion) but are excluded from the Feedback Loop's prediction-vs-actual comparison. The dashboard shows them as "No prediction available" with actual performance data only.

### EC-10: Client Switches GSC Property

A client verifies a new GSC property (e.g., migrates from `http://` to `https://` or changes domain). Historical GSC data is in the old property. **Handling:** The Data Ingestion layer detects GSC property changes and surfaces them to the Feedback Loop. Checkpoint measurements for articles published before the migration attempt to pull data from BOTH the old and new properties (if both are still verified). If the old property is removed, historical measurements already stored are preserved. Future measurements use the new property. A note is added to `measurement_metadata`: "GSC property changed during tracking period."

### EC-11: Accuracy Score of Exactly Zero

An article predicted to get 500 clicks gets 0 clicks at 90 days (complete miss). **Handling:** This is a valid accuracy score of 0. The article is included in aggregates (this is signal, not noise -- the prediction was fundamentally wrong). However, the system checks if the article is indexed at all (via GSC impressions). If impressions are also 0, the article may not be indexed, and the flag `no_index` is added. If impressions > 0 but clicks = 0, the article is indexed but not getting clicks -- this is a legitimate prediction failure that should influence recalibration (the scoring model overestimated the keyword's click potential).

### EC-12: Overlapping Report Periods

An admin generates a quarterly report (Jan-Mar) and then a custom report (Feb-Apr) for the same client. The February and March data appear in both. **Handling:** This is allowed and expected. Each report is independent. The cache key includes the exact date range, so both reports are cached separately. The system does not attempt to deduplicate or cross-reference reports.

---

## 14. Performance

### 14.1 Checkpoint Scheduling Optimization

**Problem:** A client with 200 tracked articles would have all 30/60/90 day checkpoints firing at 05:00 UTC, creating a burst of GSC API calls.

**Solution:** Distributed scheduling. Each article's checkpoint is assigned a time slot based on a deterministic hash of the article_id:

```
check_hour = hashCode(article_id) % 20 + 2  // 02:00 - 21:00 UTC
check_minute = hashCode(article_id + checkpoint) % 60  // 0-59 minutes
```

This distributes 200 checkpoints across approximately 20 hours, with an average of 10 checkpoints per hour. GSC API rate limits are per-property (1,200 requests per minute), so 10 checkpoints per hour is well within limits.

**Batch processing:** The scheduler runs every 15 minutes (not once daily) and processes up to 50 due checkpoints per batch. This further smooths the load and reduces peak latency.

### 14.2 Report Generation Caching

**Problem:** Generating a quarterly report for a client with 100+ articles requires aggregating large volumes of data.

**Solution:** Multi-layer caching:

1. **Report-level cache:** Completed reports are stored in `performance_reports` with a `cached_until` timestamp (24 hours by default). Subsequent requests for the same `(user_id, type, period)` return the cached report.
2. **Aggregate cache:** Per-user aggregate statistics (total clicks, impressions, accuracy) are cached in a `performance_aggregates` materialized view, refreshed every 6 hours or on checkpoint completion.
3. **Cache invalidation:** Cache is invalidated when a checkpoint completes or a recalibration is applied for the user. The invalidation is lazy (cache entry is not deleted; it is regenerated on next request if stale).

### 14.3 Query Optimization

**Large portfolio queries:** The portfolio analytics endpoint can scan thousands of prediction records for high-volume clients. Optimizations:

1. All aggregate queries use the indexed columns (`user_id`, `opportunity_type`, `content_format`, `published_at`)
2. The `accuracy_score_90d` column is indexed for sort-by-accuracy queries
3. Heavy aggregations (monthly trends, format breakdowns) are pre-computed in background and stored in the report JSON, not computed on every API call
4. Pagination is enforced on all list endpoints (max 100 per page)

**Recalibration computation:** The recalibration algorithm processes up to 200 articles but performs only lightweight mathematical operations (correlations, weight adjustments). Computation time is bounded at 5 seconds; if exceeded, the operation is logged as slow but still completes.

### 14.4 GSC API Efficiency

**Problem:** Each checkpoint requires at least one GSC API call (potentially more for per-query breakdowns).

**Solution:**
1. Batch GSC requests where possible: pull data for multiple URLs in a single Search Analytics request (GSC supports up to 25,000 rows per request)
2. For the same client, if multiple articles are due on the same day, consolidate into a single GSC API session
3. Cache GSC OAuth tokens in memory (not disk) with TTL matching token expiry
4. GA4 calls are optional -- if the client has no GA4 connection, skip entirely (do not fail)

### 14.5 Database Efficiency

- `performance_predictions` table is expected to grow to 1,000-10,000 rows per client over years. At this scale, all queries are well-served by the B-tree indexes defined above.
- `scoring_weight_history` grows slowly (1-4 rows per client per quarter). No special optimization needed.
- `performance_reports` grows slowly (12 monthly + 4 quarterly per client per year). Older reports can be archived after 2 years.
- JSONB columns (`prediction_metadata`, `measurement_metadata`) are not indexed internally. Queries that need to filter by JSONB fields should use materialized views or denormalized columns.

---

## 15. Testing Requirements

### Unit Tests -- `test/feedback-loop/accuracy.test.js`

| Test | Input | Expected Output | Purpose |
|------|-------|-----------------|---------|
| `accuracy returns 100 for exact match` | predicted=100, actual=100 | 100 | Baseline |
| `accuracy returns 0 for complete miss (actual=0)` | predicted=500, actual=0 | 0 | Lower bound |
| `accuracy returns 0 for complete miss (predicted=0)` | predicted=0, actual=500 | 0 | Zero-prediction edge |
| `accuracy returns 100 for both zero` | predicted=0, actual=0 | 100 | Both-zero edge |
| `accuracy handles 20% underperformance` | predicted=100, actual=80 | 80 | Standard deviation |
| `accuracy handles 20% overperformance` | predicted=100, actual=120 | 80 | Symmetric error |
| `accuracy handles extreme overperformance` | predicted=100, actual=600 | 0 (clamped) | >500% clamp |
| `accuracy caps at 0 not negative` | predicted=10, actual=200 | 0 | Negative-guard |
| `composite accuracy weights correctly` | clicks=90, impressions=80, position=70 | `90*0.40 + 80*0.35 + 70*0.25 = 81.5` | Weight formula |
| `position accuracy applies page-1 penalty` | predicted_pos=8, actual_pos=12, actual<=10=false | Applies weight 1.5 | Sensitivity weighting |
| `position accuracy applies page-1 weight for top-10` | predicted_pos=5, actual_pos=8 | Applies weight 2.0 | Page 1 multiplier |
| `low-volume confidence flag at 499 impressions` | actual_impressions=499 | confidence=`low` | Threshold boundary |
| `normal confidence at 500 impressions` | actual_impressions=500 | confidence=`medium` | Threshold boundary |

### Unit Tests -- `test/feedback-loop/recalibration.test.js`

| Test | Input | Expected Output | Purpose |
|------|-------|-----------------|---------|
| `rejects when sample size < 20` | 19 articles | 422 error | Sample size guard |
| `accepts when sample size = 20` | 20 articles | Proceeds with recalibration | Threshold boundary |
| `learning rate 0.05 limits weight change` | current=0.30, error_direction=1.0 | new_weight between 0.285 and 0.315 | Learning rate bound |
| `weight clamped to 0.05 minimum` | adjusted_weight=0.03 | clamped to 0.05 | Lower bound |
| `weight clamped to 0.40 maximum` | adjusted_weight=0.45 | clamped to 0.40 | Upper bound |
| `weights sum to 1.0 after normalization` | any input weights | sum = 1.0 (within 0.001) | Normalization |
| `normalization converges within 10 iterations` | extreme skew | converged | Iteration limit |
| `outlier exclusion at 2 std dev` | articles with scores [80,82,78,85,20] | score=20 excluded | Outlier detection |
| `dry-run does not modify database` | dry_run=true | No weight changes in DB | Side-effect guard |
| `oscillation warning triggered` | prev: 0.30->0.25, now: 0.25->0.30 | warning present | Oscillation detection |
| `projected improvement < 3% rejects` | improvement=2.8% | 409 error | Improvement threshold |
| `force=true overrides improvement threshold` | improvement=1.4%, force=true | Proceeds | Admin override |
| `backtest accuracy computed correctly` | known articles, known weights | exact backtest scores | Math verification |
| `recalibration frequency guard (< 30 days)` | last recal 15 days ago | warning returned | Frequency guard |

### Unit Tests -- `test/feedback-loop/checkpoint.test.js`

| Test | Input | Expected Output | Purpose |
|------|-------|-----------------|---------|
| `30d checkpoint fires on day 33` | published 33 days ago | checkpoint triggered | Buffer timing |
| `30d checkpoint does not fire on day 32` | published 32 days ago | no trigger | Buffer boundary |
| `60d checkpoint fires on day 63` | published 63 days ago, 30d complete | checkpoint triggered | 60d timing |
| `90d checkpoint fires on day 93` | published 93 days ago, 60d complete | checkpoint triggered | 90d timing |
| `checkpoint does not fire if previous incomplete` | 60d due, 30d not done | no trigger (30d only) | Order enforcement |
| `next_check_at transitions correctly` | after 30d complete | next_check_at = published + 63d | State machine |
| `status transitions through full lifecycle` | 30d -> 60d -> 90d | pending_30d -> checked_30d -> ... -> complete | Full lifecycle |
| `check_hour distributes across day` | 100 different article_ids | hours in range [2, 21] | Distribution |
| `retry increments on GSC failure` | GSC returns empty | retry_count++ | Retry mechanism |
| `measurement_failed after 7 retries` | 7 consecutive failures | status='measurement_failed' | Failure threshold |

### Unit Tests -- `test/feedback-loop/reports.test.js`

| Test | Input | Expected Output | Purpose |
|------|-------|-----------------|---------|
| `monthly report contains correct period` | type=monthly, March 2026 | period 2026-03-01 to 2026-03-31 | Date range |
| `quarterly report spans 3 months` | type=quarterly, Q1 2026 | period 2026-01-01 to 2026-03-31 | Quarter boundaries |
| `top performers ranked by clicks` | 10 articles | top 5 by clicks returned | Ranking logic |
| `underperformers ranked by accuracy asc` | 10 articles | bottom 5 by accuracy returned | Ranking logic |
| `ROI calculation is correct` | clicks=1000, avg_cpc=0.70 | traffic_value=700 | Math |
| `report cached for 24 hours` | generate, then re-request | second request returns cached=true | Caching |
| `cache invalidated on checkpoint complete` | generate, complete checkpoint, re-request | cached=false | Invalidation |
| `HTML output includes inline CSS` | format=html | no external stylesheet references | Email compat |
| `empty portfolio returns valid empty report` | 0 articles | all fields present, counts=0 | Empty state |
| `recommendations generated from data patterns` | gap outperforms decay | recommendation mentions gap focus | Pattern detection |

### Integration Tests -- `test/feedback-loop/api.test.js`

| Test | Description |
|------|-------------|
| `GET /predictions/:id returns full data for owned article` | Auth user, existing prediction |
| `GET /predictions/:id returns 403 for other user's article` | Auth user, other user's article |
| `GET /predictions/:id returns 404 for missing article` | Auth user, non-existent article |
| `GET /accuracy returns aggregate stats` | Auth user with 10+ tracked articles |
| `GET /accuracy returns insufficient_data for new user` | Auth user with 0 articles |
| `GET /accuracy filters by opportunity_type` | Filter gap vs decay |
| `POST /recalibrate requires admin role` | Non-admin user receives 403 |
| `POST /recalibrate dry-run returns proposed changes` | Admin, 20+ articles |
| `POST /recalibrate apply requires prior dry-run` | Admin, no prior dry-run |
| `POST /recalibrate returns 422 for insufficient data` | Admin, 14 articles |
| `GET /report/:userId generates monthly report` | Auth user, own report |
| `GET /report/:userId admin can access any user` | Admin, other user's report |
| `GET /portfolio returns portfolio analytics` | Auth user with articles |
| `POST /measure/:id requires admin` | Non-admin receives 403 |
| `POST /rollback/:id restores previous weights` | Admin, applied recalibration |
| `POST /rollback/:id returns 409 for already-rolled-back` | Admin, rolled-back event |
| `All endpoints reject unauthenticated requests` | No Bearer token, 401 |

### Edge Case Tests -- `test/feedback-loop/edge-cases.test.js`

| Test | Description |
|------|-------------|
| `URL redirect detected and followed` | Article URL returns 301, new URL has GSC data |
| `Viral spike flagged and excluded from recalibration` | Article at 600% of prediction |
| `Low-volume article weighted at 50% in aggregates` | Article with 300 impressions |
| `Seasonal content flag applied when checkpoint overlaps peak` | Seasonal peak months match checkpoint |
| `Article deleted sets status to article_removed` | URL returns 404 |
| `Concurrent recalibration blocked by advisory lock` | Two simultaneous recalibrate calls |
| `Report generation timeout returns 202` | Mock slow query, verify async behavior |
| `Auto-revert triggers when post-recal accuracy drops 5%+` | 5 new articles with lower accuracy |

---

## Dependencies

### Depends On
- **Auth & Bridge Server** -- authentication, user context, admin role verification for recalibration endpoints
- **Supabase** -- database, RLS policies, `performance_predictions` / `scoring_weight_history` / `performance_reports` table storage
- **Data Ingestion Service (Layer 1)** -- GSC and GA4 data access via client OAuth tokens, scheduler infrastructure for checkpoint jobs
- **Publishing Service (Layer 5)** -- `publish_records` table triggers prediction record creation (knows when and where each article was published)
- **Content Intelligence Service (Layer 2)** -- provides prediction values and scoring weights at recommendation time, consumes recalibrated weights for future scoring

### Depended On By
- **Content Intelligence / Topic Recommender (Layer 2)** -- consumes recalibrated scoring weights for all future recommendations via BR-14
- **Dashboard** -- Performance page displays prediction accuracy, portfolio analytics, reports, and recalibration history
- **Data Ingestion Scheduler** -- feedback measurements run as scheduled jobs within the existing ingestion scheduler infrastructure
- **Voice Intelligence (Layer 3)** -- consumes persona performance data to inform future voice selection

---

## Files

| File | Purpose |
|------|---------|
| `bridge/intelligence/performance-tracker.js` | Core measurement engine. Pulls GSC/GA4 data for published articles at checkpoints, computes actuals, calculates accuracy scores, manages checkpoint state machine |
| `bridge/intelligence/recalibrator.js` | Scoring weight recalibration engine. Per-signal error analysis, gradient-based weight adjustment, backtesting, dry-run support, rollback logic |
| `bridge/intelligence/report-generator.js` | Client-facing performance report generator. JSON assembly, HTML rendering, ROI computation, recommendation generation |
| `bridge/intelligence/portfolio-analytics.js` | Portfolio-level cross-article analysis. Topic clustering, format effectiveness, seasonal pattern detection, voice persona performance |
| `bridge/routes/feedback.js` | API route handlers for `/api/feedback/*` endpoints. Request validation, auth checks, response formatting |
| `bridge/intelligence/accuracy.js` | Pure accuracy calculation functions. Per-metric accuracy, composite scoring, confidence classification, anomaly detection |
| `migrations/012-performance-predictions.sql` | `performance_predictions` table + RLS policies + indexes + update trigger |
| `migrations/016-scoring-weight-history.sql` | `scoring_weight_history` table + RLS policies + indexes |
| `migrations/017-performance-reports.sql` | `performance_reports` table + RLS policies + indexes |

---

## Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| 30-day measurement completion rate | >= 95% of due checkpoints measured on schedule | `checked_30d` within 48h of `next_check_at` |
| 60-day measurement completion rate | >= 95% | Same as above for 60d |
| 90-day measurement completion rate | >= 95% | Same as above for 90d |
| Mean prediction accuracy (30d) | >= 65% | Average `accuracy_score_30d` across all clients |
| Mean prediction accuracy (60d) | >= 72% | Average `accuracy_score_60d` |
| Mean prediction accuracy (90d) | >= 78% | Average `accuracy_score_90d` |
| Accuracy improvement per recalibration | >= 3% projected (otherwise rejected) | `mean_accuracy_after - mean_accuracy_before` |
| Recalibration frequency | Quarterly per active client | `scoring_weight_history` event count |
| Report generation time (monthly) | < 10 seconds | Server-side timing |
| Report generation time (quarterly) | < 30 seconds | Server-side timing |
| Measurement pipeline latency | < 60 seconds per article | GSC pull + GA4 pull + computation |
| Articles tracked vs published | >= 98% of published articles have prediction records | `performance_predictions` count vs `publish_records` count |
| Checkpoint scheduler uptime | 99.5% | Scheduler heartbeat monitoring |
| API response time (GET endpoints) | < 500ms p95 | Server-side timing |
| API response time (POST recalibrate) | < 10 seconds | Server-side timing for full computation |
