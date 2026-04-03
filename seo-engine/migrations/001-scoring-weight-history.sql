-- Migration 001: Scoring Weight History
-- Tracks recalibration runs and weight changes for the 7-signal quality gate
-- and 5-component topic recommender scoring systems.
--
-- FL-002: Scoring Weight Recalibration Engine

-- ── Recalibration Runs ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scoring_recalibration_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_type      TEXT NOT NULL CHECK (run_type IN ('quality_gate', 'topic_recommender', 'both')),
  status        TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  sample_size   INTEGER NOT NULL DEFAULT 0,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recal_runs_user ON scoring_recalibration_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_recal_runs_created ON scoring_recalibration_runs(created_at DESC);

-- ── Weight Snapshots ────────────────────────────────────────────
-- Each row captures the full weight vector at a point in time.
CREATE TABLE IF NOT EXISTS scoring_weight_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          UUID NOT NULL REFERENCES scoring_recalibration_runs(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_type     TEXT NOT NULL CHECK (weight_type IN ('quality_gate', 'topic_recommender')),
  weights_before  JSONB NOT NULL,
  weights_after   JSONB NOT NULL,
  correlations    JSONB NOT NULL,       -- per-signal correlation with performance
  adjustments     JSONB NOT NULL,       -- delta applied to each weight
  sample_size     INTEGER NOT NULL DEFAULT 0,
  confidence      REAL NOT NULL DEFAULT 0.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weight_history_user ON scoring_weight_history(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_history_run ON scoring_weight_history(run_id);
CREATE INDEX IF NOT EXISTS idx_weight_history_type ON scoring_weight_history(weight_type);
CREATE INDEX IF NOT EXISTS idx_weight_history_created ON scoring_weight_history(created_at DESC);

-- ── RLS Policies ────────────────────────────────────────────────
ALTER TABLE scoring_recalibration_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_weight_history ENABLE ROW LEVEL SECURITY;

-- Users can read their own recalibration runs
CREATE POLICY recal_runs_select ON scoring_recalibration_runs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own recalibration runs
CREATE POLICY recal_runs_insert ON scoring_recalibration_runs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own recalibration runs
CREATE POLICY recal_runs_update ON scoring_recalibration_runs
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can read their own weight history
CREATE POLICY weight_history_select ON scoring_weight_history
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own weight history
CREATE POLICY weight_history_insert ON scoring_weight_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role bypasses RLS for admin operations
