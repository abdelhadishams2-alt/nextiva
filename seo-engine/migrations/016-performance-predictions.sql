-- Migration 016: performance_predictions + performance_reports
-- Part of FL-001: 30/60/90 Day Performance Tracker
-- Stores predictions and actuals for published articles at milestone intervals.

-- ── performance_predictions ──

CREATE TABLE IF NOT EXISTS public.performance_predictions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id      UUID REFERENCES content_inventory(id) ON DELETE SET NULL,
  url             TEXT NOT NULL,
  milestone_days  INTEGER NOT NULL CHECK (milestone_days IN (30, 60, 90)),
  milestone_date  DATE NOT NULL,
  publish_date    DATE NOT NULL,

  -- Predicted values (set when article is published or prediction is created)
  predicted_clicks      INTEGER CHECK (predicted_clicks >= 0),
  predicted_impressions INTEGER CHECK (predicted_impressions >= 0),
  predicted_position    NUMERIC(6,2) CHECK (predicted_position > 0),
  predicted_ctr         NUMERIC(5,4) CHECK (predicted_ctr >= 0 AND predicted_ctr <= 1),

  -- Actual values (filled in when milestone is reached)
  actual_clicks         INTEGER CHECK (actual_clicks >= 0),
  actual_impressions    INTEGER CHECK (actual_impressions >= 0),
  actual_position       NUMERIC(6,2) CHECK (actual_position > 0),
  actual_ctr            NUMERIC(5,4) CHECK (actual_ctr >= 0 AND actual_ctr <= 1),

  -- Velocity metrics (computed when actuals are recorded)
  click_velocity        NUMERIC(10,4),   -- clicks per day
  impression_growth_rate NUMERIC(10,4),  -- % growth since publish
  position_improvement  NUMERIC(6,2),    -- positive = improved (lower position)
  ctr_trend             NUMERIC(10,4),   -- % change in CTR

  -- ROI tracking
  estimated_value       NUMERIC(12,2),   -- estimated traffic value in USD
  status                TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'met', 'exceeded', 'missed')),

  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, url, milestone_days)
);

CREATE INDEX idx_pred_user_milestone ON performance_predictions (user_id, milestone_days, status);
CREATE INDEX idx_pred_content ON performance_predictions (content_id, milestone_days);
CREATE INDEX idx_pred_milestone_date ON performance_predictions (milestone_date)
  WHERE status = 'pending';
CREATE INDEX idx_pred_user_publish ON performance_predictions (user_id, publish_date DESC);

ALTER TABLE performance_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own predictions" ON performance_predictions
  FOR SELECT USING (auth.uid() = user_id);
-- Writes performed by service_role (tracker). No user INSERT/UPDATE policy.

-- ── performance_reports ──

CREATE TABLE IF NOT EXISTS public.performance_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  report_type     TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'milestone')),

  -- Aggregate metrics
  total_articles        INTEGER NOT NULL DEFAULT 0,
  articles_tracked      INTEGER NOT NULL DEFAULT 0,
  predictions_met       INTEGER NOT NULL DEFAULT 0,
  predictions_exceeded  INTEGER NOT NULL DEFAULT 0,
  predictions_missed    INTEGER NOT NULL DEFAULT 0,

  -- Portfolio velocity
  avg_click_velocity    NUMERIC(10,4),
  avg_impression_growth NUMERIC(10,4),
  avg_position_change   NUMERIC(6,2),
  avg_ctr_trend         NUMERIC(10,4),

  -- ROI summary
  total_estimated_value NUMERIC(12,2),
  top_performers        JSONB NOT NULL DEFAULT '[]'::jsonb,
  underperformers       JSONB NOT NULL DEFAULT '[]'::jsonb,

  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, report_date, report_type)
);

CREATE INDEX idx_reports_user_date ON performance_reports (user_id, report_date DESC);
CREATE INDEX idx_reports_type ON performance_reports (report_type, report_date DESC);

ALTER TABLE performance_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own reports" ON performance_reports
  FOR SELECT USING (auth.uid() = user_id);
-- Writes performed by service_role (tracker). No user INSERT/UPDATE policy.
