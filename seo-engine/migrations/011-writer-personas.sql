-- Migration 011: Writer Personas & Voice Analysis
-- Task: VI-001
-- Creates tables for corpus analysis, voice profiling, and AI/Human classification.

-- ── writer_personas ─────────────────────────────────────────────
-- Stores detected writing voice profiles built from corpus analysis.
CREATE TABLE IF NOT EXISTS writer_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Primary Voice',
  voice_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_articles TEXT[] NOT NULL DEFAULT '{}',
  feature_vector JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_writer_personas_user_id ON writer_personas(user_id);

-- RLS policies
ALTER TABLE writer_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own personas"
  ON writer_personas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personas"
  ON writer_personas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personas"
  ON writer_personas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own personas"
  ON writer_personas FOR DELETE
  USING (auth.uid() = user_id);

-- ── analysis_sessions ───────────────────────────────────────────
-- Tracks each corpus analysis run (crawl + analyze cycle).
CREATE TABLE IF NOT EXISTS analysis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'crawling', 'analyzing', 'complete', 'failed')),
  total_pages INT NOT NULL DEFAULT 0,
  articles_found INT NOT NULL DEFAULT 0,
  articles_analyzed INT NOT NULL DEFAULT 0,
  classification_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  aggregate_signals JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analysis_sessions_user_id ON analysis_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_status ON analysis_sessions(status);

ALTER TABLE analysis_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON analysis_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON analysis_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON analysis_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- ── voice_match_scores ──────────────────────────────────────────
-- Per-article analysis results with 6 stylometric signal scores.
CREATE TABLE IF NOT EXISTS voice_match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES analysis_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  word_count INT NOT NULL DEFAULT 0,
  article_text TEXT,
  signal_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_probability REAL NOT NULL DEFAULT 0,
  classification TEXT NOT NULL DEFAULT 'UNKNOWN'
    CHECK (classification IN ('HUMAN', 'HYBRID', 'AI', 'UNKNOWN')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voice_match_scores_session_id ON voice_match_scores(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_match_scores_user_id ON voice_match_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_match_scores_classification ON voice_match_scores(classification);

ALTER TABLE voice_match_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scores"
  ON voice_match_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scores"
  ON voice_match_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── Updated_at trigger for writer_personas ──────────────────────
CREATE OR REPLACE FUNCTION update_writer_personas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_writer_personas_updated_at
  BEFORE UPDATE ON writer_personas
  FOR EACH ROW
  EXECUTE FUNCTION update_writer_personas_updated_at();
