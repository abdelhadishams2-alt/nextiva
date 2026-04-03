-- Migration 010: keyword_opportunities table
-- Part of CI-002: Gap Analyzer & Cannibalization Detector

CREATE TABLE IF NOT EXISTS public.keyword_opportunities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword             TEXT NOT NULL,
  opportunity_type    TEXT NOT NULL,
  priority_score      NUMERIC(5,2),
  impressions         INTEGER,
  clicks              INTEGER,
  current_position    NUMERIC(6,2),
  competing_urls      TEXT[],
  recommended_action  TEXT,
  target_url          TEXT,
  status              TEXT NOT NULL DEFAULT 'open',
  analysis_metadata   JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, keyword, opportunity_type)
);

-- Indexes
CREATE INDEX idx_kw_opp_user_priority ON keyword_opportunities (user_id, priority_score DESC);
CREATE INDEX idx_kw_opp_user_type_status ON keyword_opportunities (user_id, opportunity_type, status);
CREATE INDEX idx_kw_opp_user_status ON keyword_opportunities (user_id, status);

-- Row Level Security
ALTER TABLE keyword_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own keyword opportunities" ON keyword_opportunities
  FOR SELECT USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_keyword_opportunities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_keyword_opportunities_updated_at
  BEFORE UPDATE ON keyword_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_keyword_opportunities_updated_at();
