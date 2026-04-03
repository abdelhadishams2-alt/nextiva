-- Migration 009: performance_snapshots (partitioned by month) + performance_snapshots_monthly rollup
-- Part of DI-005: Automated Data Pull Scheduler
-- DDL copied verbatim from unified-schema.md Sections 3.5-3.6

-- ── 3.5 performance_snapshots (Data Ingestion) — HIGHEST VOLUME TABLE ──

CREATE TABLE IF NOT EXISTS public.performance_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id      UUID REFERENCES content_inventory(id) ON DELETE SET NULL,
  url             TEXT NOT NULL,
  snapshot_date   DATE NOT NULL,
  source          TEXT NOT NULL
                  CHECK (source IN ('gsc', 'ga4', 'semrush', 'ahrefs', 'combined')),
  clicks          INTEGER CHECK (clicks >= 0),
  impressions     INTEGER CHECK (impressions >= 0),
  ctr             NUMERIC(5,4) CHECK (ctr >= 0 AND ctr <= 1),
  avg_position    NUMERIC(6,2) CHECK (avg_position > 0),
  sessions        INTEGER CHECK (sessions >= 0),
  engaged_sessions INTEGER CHECK (engaged_sessions >= 0),
  bounce_rate     NUMERIC(5,4) CHECK (bounce_rate >= 0 AND bounce_rate <= 1),
  avg_engagement_time NUMERIC(8,2) CHECK (avg_engagement_time >= 0),
  scroll_depth    NUMERIC(5,2) CHECK (scroll_depth >= 0 AND scroll_depth <= 100),
  organic_traffic INTEGER CHECK (organic_traffic >= 0),
  keyword_count   INTEGER CHECK (keyword_count >= 0),
  backlinks       INTEGER CHECK (backlinks >= 0),
  referring_domains INTEGER CHECK (referring_domains >= 0),
  domain_rating   NUMERIC(5,2) CHECK (domain_rating >= 0 AND domain_rating <= 100),
  health_score    NUMERIC(5,2) CHECK (health_score >= 0 AND health_score <= 100),
  decay_signal    BOOLEAN NOT NULL DEFAULT false,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, url, snapshot_date, source)
) PARTITION BY RANGE (snapshot_date);

-- Create monthly partitions (initial set + auto-create in scheduler)
CREATE TABLE performance_snapshots_2026_01 PARTITION OF performance_snapshots
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE performance_snapshots_2026_02 PARTITION OF performance_snapshots
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE performance_snapshots_2026_03 PARTITION OF performance_snapshots
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE performance_snapshots_2026_04 PARTITION OF performance_snapshots
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE performance_snapshots_2026_05 PARTITION OF performance_snapshots
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE performance_snapshots_2026_06 PARTITION OF performance_snapshots
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE INDEX idx_perf_user_date ON performance_snapshots (user_id, snapshot_date DESC);
CREATE INDEX idx_perf_content_date ON performance_snapshots (content_id, snapshot_date DESC);
CREATE INDEX idx_perf_user_url_source ON performance_snapshots (user_id, url, source);
CREATE INDEX idx_perf_health_score ON performance_snapshots (user_id, health_score)
  WHERE health_score IS NOT NULL;

ALTER TABLE performance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own snapshots" ON performance_snapshots
  FOR SELECT USING (auth.uid() = user_id);
-- Writes performed by service_role (scheduler). No user INSERT/UPDATE policy.

-- ── 3.6 performance_snapshots_monthly (Data Ingestion) — Rollup Table ──

CREATE TABLE IF NOT EXISTS public.performance_snapshots_monthly (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id      UUID REFERENCES content_inventory(id) ON DELETE SET NULL,
  url             TEXT NOT NULL,
  month           DATE NOT NULL,
  avg_clicks      NUMERIC(10,2),
  avg_impressions NUMERIC(10,2),
  avg_ctr         NUMERIC(5,4),
  avg_position    NUMERIC(6,2),
  total_sessions  INTEGER,
  avg_health_score NUMERIC(5,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, url, month)
);

CREATE INDEX idx_monthly_user_month ON performance_snapshots_monthly (user_id, month DESC);

ALTER TABLE performance_snapshots_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own monthly" ON performance_snapshots_monthly
  FOR SELECT USING (auth.uid() = user_id);

-- ── Auto-partition creation function ──

CREATE OR REPLACE FUNCTION create_performance_partition(target_date DATE)
RETURNS void AS $$
DECLARE
  partition_name TEXT;
  start_date DATE;
  end_date DATE;
BEGIN
  start_date := date_trunc('month', target_date)::date;
  end_date := (start_date + interval '1 month')::date;
  partition_name := 'performance_snapshots_' || to_char(start_date, 'YYYY_MM');

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF performance_snapshots FOR VALUES FROM (%L) TO (%L)',
    partition_name, start_date, end_date
  );
END;
$$ LANGUAGE plpgsql;
