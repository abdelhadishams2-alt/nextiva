# ChainIQ Unified Database Schema

**Step 7 -- Database Design**
**Last Updated:** 2026-03-28
**Database:** Supabase PostgreSQL (Pro plan, 8GB storage, 100 connections)
**Total Tables:** 32 (9 existing + 23 new)
**Auth:** Supabase Auth (auth.users), RLS on every table
**Naming:** snake_case tables, snake_case columns, UUID PKs everywhere

---

## 1. Entity Relationship Diagram (Text)

```
auth.users (Supabase Auth)
 |
 |-- (1:1) subscriptions
 |-- (1:N) usage_logs
 |-- (1:N) articles
 |       |-- (1:N) article_versions
 |       |-- (1:N) pipeline_jobs
 |       |-- (1:N) quality_scores
 |       |       |-- (1:N) quality_revisions
 |       |-- (1:N) publish_records
 |       |       |-- (1:N) image_upload_log
 |       |-- (1:1) performance_predictions
 |       |       |-- FK keyword_opportunities
 |       |       |-- FK writer_personas (voice_persona_id)
 |
 |-- (1:N) user_settings
 |-- (1:N) api_keys
 |-- (1:N) plugin_instances
 |-- (1:1) plugin_config
 |
 |-- (1:N) client_connections
 |-- (1:N) content_inventory
 |       |-- (1:N) performance_snapshots
 |       |-- (1:N) performance_snapshots_monthly
 |
 |-- (1:N) crawl_sessions
 |       |-- (1:N) content_inventory (crawl_session_id FK)
 |
 |-- (1:N) ingestion_jobs
 |-- (N/A) oauth_states (short-lived, service_role only)
 |-- (N/A) api_cache (shared cache, no user_id)
 |
 |-- (1:N) keyword_opportunities
 |       |-- FK analysis_runs
 |       |-- (1:N) recommendation_history
 |       |-- (1:N) cannibalization_conflicts (via keyword)
 |
 |-- (1:N) analysis_runs
 |
 |-- (1:N) writer_personas
 |-- (1:N) analysis_sessions (voice)
 |-- (1:N) voice_match_scores
 |       |-- FK writer_personas
 |
 |-- (1:N) platform_connections
 |       |-- (1:N) publish_records
 |
 |-- (1:N) scoring_weight_history
 |       |-- FK scoring_weight_history (rollback_of, superseded_by)
 |
 |-- (1:N) performance_reports
```

Key relationship patterns:
- All user-scoped tables have `user_id UUID FK auth.users(id) ON DELETE CASCADE`
- `articles` is the central node connecting quality, publishing, performance, and versions
- `content_inventory` bridges Data Ingestion to performance snapshots and intelligence
- `keyword_opportunities` bridges Content Intelligence to Feedback Loop via `recommendation_history`
- `writer_personas` bridges Voice Intelligence to Quality Gate via `voice_match_scores`

---

## 2. Table Index (32 Tables by Service)

### Existing Tables (9) -- Built in Phases 0-4

| # | Table | Service | Migration | Est. Rows |
|---|-------|---------|-----------|-----------|
| 1 | subscriptions | Admin & Users | 001 (supabase-setup.sql) | 1 per user |
| 2 | usage_logs | Analytics | 001 | 50-500/user/day |
| 3 | articles | Article Pipeline | 002 | 10-100/user |
| 4 | article_versions | Article Pipeline | 002 | 2-5 per article |
| 5 | pipeline_jobs | Article Pipeline | 003 | 1 per generation |
| 6 | user_settings | Dashboard API | 004 | 1 per user |
| 7 | api_keys | Auth & Bridge | 005 | 1-5 per user |
| 8 | plugin_instances | Dashboard API | 005 | 1-3 per user |
| 9 | plugin_config | Dashboard API | 006 | 1 per user |

### New Tables -- Data Ingestion (8)

| # | Table | Migration | Est. Rows/Client/Mo |
|---|-------|-----------|---------------------|
| 10 | client_connections | 007 | ~10 (static) |
| 11 | oauth_states | 007 | ~0 (transient, 10-min TTL) |
| 12 | content_inventory | 008 | 10K initial + 500/mo |
| 13 | crawl_sessions | 008 | 2-4/mo |
| 14 | performance_snapshots | 009 | ~300K (GROWTH RISK) |
| 15 | performance_snapshots_monthly | 009 | ~10K |
| 16 | ingestion_jobs | 007 | 60-120/mo |
| 17 | api_cache | 007 | ~500 (shared, TTL-purged) |

### New Tables -- Content Intelligence (4)

| # | Table | Migration | Est. Rows/Client/Mo |
|---|-------|-----------|---------------------|
| 18 | keyword_opportunities | 010 | 500-2000 |
| 19 | analysis_runs | 010 | 5-30/mo |
| 20 | recommendation_history | 010 | 50-200/mo |
| 21 | cannibalization_conflicts | 010 | 10-50 |

### New Tables -- Voice Intelligence (3)

| # | Table | Migration | Est. Rows/Client/Mo |
|---|-------|-----------|---------------------|
| 22 | writer_personas | 011 | 5-20 (static) |
| 23 | analysis_sessions | 011 | 1-4/mo |
| 24 | voice_match_scores | 011 | 5-50/mo |

### New Tables -- Quality Gate (2)

| # | Table | Migration | Est. Rows/Client/Mo |
|---|-------|-----------|---------------------|
| 25 | quality_scores | 012 | 10-100/mo |
| 26 | quality_revisions | 012 | 5-50/mo |

### New Tables -- Publishing (3)

| # | Table | Migration | Est. Rows/Client/Mo |
|---|-------|-----------|---------------------|
| 27 | platform_connections | 014 | 1-5 (static) |
| 28 | publish_records | 015 | 10-100/mo |
| 29 | image_upload_log | 015 | 40-600/mo |

### New Tables -- Feedback Loop (3)

| # | Table | Migration | Est. Rows/Client/Mo |
|---|-------|-----------|---------------------|
| 30 | performance_predictions | 016 | 10-100/mo |
| 31 | scoring_weight_history | 016 | 0-2/mo |
| 32 | performance_reports | 017 | 1-4/mo |

---

## 3. New Tables Detail

### Shared Infrastructure

Every new table follows these conventions unless explicitly noted otherwise:

```sql
-- Standard trigger for updated_at (create once, reuse)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 3.1 client_connections (Data Ingestion)

```sql
CREATE TABLE IF NOT EXISTS public.client_connections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL CHECK (provider IN ('google', 'semrush', 'ahrefs')),
  provider_account_id TEXT,
  access_token_encrypted  TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at   TIMESTAMPTZ,
  scopes        TEXT[],
  gsc_property  TEXT,
  ga4_property_id TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'connected', 'error', 'revoked', 'expired')),
  last_sync_at  TIMESTAMPTZ,
  last_error    TEXT,
  sync_count    INTEGER NOT NULL DEFAULT 0 CHECK (sync_count >= 0),
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

CREATE INDEX idx_connections_user_provider ON client_connections (user_id, provider);
CREATE INDEX idx_connections_status ON client_connections (status)
  WHERE status != 'connected';

ALTER TABLE client_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own connections" ON client_connections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own connections" ON client_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own connections" ON client_connections
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own connections" ON client_connections
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_client_connections_updated_at
  BEFORE UPDATE ON client_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Index rationale:**
- `idx_connections_user_provider`: Primary lookup -- "get this user's Google connection"
- `idx_connections_status` (partial): Admin health dashboard -- find all broken connections without scanning connected ones

---

### 3.2 oauth_states (Data Ingestion)

```sql
CREATE TABLE IF NOT EXISTS public.oauth_states (
  state         TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_verifier TEXT NOT NULL,
  provider      TEXT NOT NULL CHECK (provider IN ('google')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_oauth_states_created ON oauth_states (created_at);
```

**No RLS.** Accessed via service_role key during OAuth callback processing. Rows auto-expire -- cleanup job deletes rows older than 10 minutes via `DELETE FROM oauth_states WHERE created_at < now() - interval '10 minutes'`.

---

### 3.3 content_inventory (Data Ingestion)

```sql
CREATE TABLE IF NOT EXISTS public.content_inventory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  canonical_url   TEXT,
  title           TEXT,
  meta_description TEXT,
  word_count      INTEGER NOT NULL DEFAULT 0 CHECK (word_count >= 0),
  h1_text         TEXT,
  h2_count        INTEGER NOT NULL DEFAULT 0 CHECK (h2_count >= 0),
  h3_count        INTEGER NOT NULL DEFAULT 0 CHECK (h3_count >= 0),
  heading_structure JSONB NOT NULL DEFAULT '[]'::jsonb,
  author          TEXT,
  publish_date    DATE,
  modified_date   DATE,
  language        TEXT NOT NULL DEFAULT 'en',
  internal_link_count  INTEGER NOT NULL DEFAULT 0 CHECK (internal_link_count >= 0),
  external_link_count  INTEGER NOT NULL DEFAULT 0 CHECK (external_link_count >= 0),
  image_count     INTEGER NOT NULL DEFAULT 0 CHECK (image_count >= 0),
  images_with_alt_count INTEGER NOT NULL DEFAULT 0 CHECK (images_with_alt_count >= 0),
  schema_types    JSONB NOT NULL DEFAULT '[]'::jsonb,
  content_hash    TEXT,
  status          TEXT NOT NULL DEFAULT 'ok'
                  CHECK (status IN ('ok', 'thin', 'old', 'no_meta', 'orphan', 'error', 'redirect', 'removed')),
  http_status     INTEGER,
  redirect_url    TEXT,
  crawl_session_id UUID REFERENCES crawl_sessions(id),
  first_discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_crawled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  consecutive_missing INTEGER NOT NULL DEFAULT 0 CHECK (consecutive_missing >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, url)
);

CREATE UNIQUE INDEX idx_inventory_user_url ON content_inventory (user_id, url);
CREATE INDEX idx_inventory_user_status ON content_inventory (user_id, status);
CREATE INDEX idx_inventory_user_date ON content_inventory (user_id, publish_date DESC NULLS LAST);
CREATE INDEX idx_inventory_crawl_session ON content_inventory (crawl_session_id);
CREATE INDEX idx_inventory_content_hash ON content_inventory (user_id, content_hash);

ALTER TABLE content_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own inventory" ON content_inventory
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own inventory" ON content_inventory
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own inventory" ON content_inventory
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own inventory" ON content_inventory
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_content_inventory_updated_at
  BEFORE UPDATE ON content_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Index rationale:**
- `idx_inventory_user_url` (unique): Primary lookup and upsert target during crawl
- `idx_inventory_user_status`: Filter "show me all thin content" on dashboard
- `idx_inventory_user_date`: Sort by publication recency for content calendar views
- `idx_inventory_crawl_session`: Find all URLs from a specific crawl run
- `idx_inventory_content_hash`: Detect content changes between crawls (SHA-256 comparison)

---

### 3.4 crawl_sessions (Data Ingestion)

```sql
CREATE TABLE IF NOT EXISTS public.crawl_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_url         TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'running'
                   CHECK (status IN ('running', 'completed', 'cancelled', 'error')),
  discovery_method TEXT NOT NULL DEFAULT 'sitemap'
                   CHECK (discovery_method IN ('sitemap', 'homepage_crawl')),
  urls_discovered  INTEGER NOT NULL DEFAULT 0 CHECK (urls_discovered >= 0),
  urls_crawled     INTEGER NOT NULL DEFAULT 0 CHECK (urls_crawled >= 0),
  urls_errored     INTEGER NOT NULL DEFAULT 0 CHECK (urls_errored >= 0),
  max_pages        INTEGER NOT NULL DEFAULT 10000 CHECK (max_pages > 0),
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at     TIMESTAMPTZ,
  error_log        JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX idx_crawl_sessions_user_status ON crawl_sessions (user_id, status);

ALTER TABLE crawl_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own crawls" ON crawl_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own crawls" ON crawl_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own crawls" ON crawl_sessions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

### 3.5 performance_snapshots (Data Ingestion) -- HIGHEST VOLUME TABLE

```sql
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
```

**Index rationale:**
- `idx_perf_user_date`: Dashboard time-series -- "show me my performance over last 90 days"
- `idx_perf_content_date`: Per-URL trend charts -- "show clicks for this article over time"
- `idx_perf_user_url_source`: Connector-specific lookups -- "get GSC data for this URL"
- `idx_perf_health_score` (partial): Sort by health on inventory page, excludes NULLs

**GROWTH RISK:** Single enterprise client (10K URLs) produces ~60MB/month. Without purge, fills 8GB in ~4 months. See Section 5 for retention policy.

---

### 3.6 performance_snapshots_monthly (Data Ingestion)

```sql
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
```

---

### 3.7 ingestion_jobs (Data Ingestion)

```sql
CREATE TABLE IF NOT EXISTS public.ingestion_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source        TEXT NOT NULL
                CHECK (source IN ('gsc', 'ga4', 'semrush', 'ahrefs', 'trends', 'crawler', 'purge')),
  status        TEXT NOT NULL DEFAULT 'queued'
                CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  trigger_type  TEXT NOT NULL DEFAULT 'scheduled'
                CHECK (trigger_type IN ('scheduled', 'manual', 'retry')),
  attempt       INTEGER NOT NULL DEFAULT 1 CHECK (attempt >= 1 AND attempt <= 3),
  rows_processed INTEGER NOT NULL DEFAULT 0 CHECK (rows_processed >= 0),
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  error         TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_user_source_status ON ingestion_jobs (user_id, source, status);

ALTER TABLE ingestion_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own jobs" ON ingestion_jobs
  FOR SELECT USING (auth.uid() = user_id);
```

---

### 3.8 api_cache (Data Ingestion)

```sql
CREATE TABLE IF NOT EXISTS public.api_cache (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key     TEXT NOT NULL UNIQUE,
  provider      TEXT NOT NULL CHECK (provider IN ('semrush', 'ahrefs', 'trends')),
  response_data JSONB NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cache_key ON api_cache (cache_key);
CREATE INDEX idx_cache_expires ON api_cache (expires_at);
```

**No RLS.** This is a shared cache accessed via service_role key. TTL-based purge: `DELETE FROM api_cache WHERE expires_at < now()`.

---

### 3.9 keyword_opportunities (Content Intelligence)

```sql
CREATE TABLE IF NOT EXISTS public.keyword_opportunities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword           TEXT NOT NULL,
  opportunity_type  TEXT NOT NULL
                    CHECK (opportunity_type IN ('gap', 'decay', 'cannibalization', 'trending', 'seasonal')),
  priority_score    NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (priority_score >= 0 AND priority_score <= 100),
  impressions       INTEGER CHECK (impressions >= 0),
  clicks            INTEGER CHECK (clicks >= 0),
  estimated_volume  INTEGER CHECK (estimated_volume >= 0),
  current_position  NUMERIC(6,2) CHECK (current_position > 0),
  keyword_difficulty NUMERIC(5,2) CHECK (keyword_difficulty >= 0 AND keyword_difficulty <= 100),
  competing_urls    TEXT[] NOT NULL DEFAULT '{}',
  recommended_action TEXT NOT NULL DEFAULT 'create_new'
                    CHECK (recommended_action IN ('create_new', 'update_existing', 'merge', 'redirect', 'differentiate', 'deoptimize')),
  target_url        TEXT,
  intent_type       TEXT NOT NULL DEFAULT 'informational'
                    CHECK (intent_type IN ('informational', 'navigational', 'commercial', 'transactional', 'mixed')),
  content_type_suggestion TEXT
                    CHECK (content_type_suggestion IN ('how-to', 'listicle', 'comparison', 'review', 'guide', 'news', 'reference', 'tutorial')),
  status            TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'accepted', 'dismissed', 'in_pipeline', 'completed')),
  confidence        TEXT NOT NULL DEFAULT 'medium'
                    CHECK (confidence IN ('high', 'medium', 'low')),
  analysis_run_id   UUID REFERENCES analysis_runs(id) ON DELETE SET NULL,
  analysis_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  accepted_at       TIMESTAMPTZ,
  dismissed_at      TIMESTAMPTZ,
  pipeline_job_id   UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, keyword, opportunity_type)
);

CREATE INDEX idx_opportunities_user_score ON keyword_opportunities (user_id, priority_score DESC);
CREATE INDEX idx_opportunities_user_type_status ON keyword_opportunities (user_id, opportunity_type, status);
CREATE INDEX idx_opportunities_user_status ON keyword_opportunities (user_id, status)
  WHERE status = 'open';
CREATE INDEX idx_opportunities_run ON keyword_opportunities (analysis_run_id);
-- Trigram index for keyword search (requires pg_trgm extension)
-- CREATE INDEX idx_opportunities_keyword_trgm ON keyword_opportunities
--   USING GIN (keyword gin_trgm_ops);

ALTER TABLE keyword_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own opportunities" ON keyword_opportunities
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own opportunities" ON keyword_opportunities
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_keyword_opportunities_updated_at
  BEFORE UPDATE ON keyword_opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Index rationale:**
- `idx_opportunities_user_score`: Primary dashboard query -- ranked recommendation list sorted by score
- `idx_opportunities_user_type_status`: Filtered views -- "show all open decay opportunities"
- `idx_opportunities_user_status` (partial): Badge count -- "how many open opportunities?" without scanning dismissed/completed
- `idx_opportunities_run`: Find all opportunities from a specific analysis run for display
- Trigram index (commented): Enable keyword autocomplete search. Requires `CREATE EXTENSION IF NOT EXISTS pg_trgm` first.

---

### 3.10 analysis_runs (Content Intelligence)

```sql
CREATE TABLE IF NOT EXISTS public.analysis_runs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_type         TEXT NOT NULL CHECK (trigger_type IN ('manual', 'scheduled', 'mode_b')),
  category             TEXT,
  competitors          TEXT[] NOT NULL DEFAULT '{}',
  status               TEXT NOT NULL DEFAULT 'running'
                       CHECK (status IN ('running', 'completed', 'failed', 'partial', 'cancelled')),
  analyses_requested   TEXT[] NOT NULL DEFAULT '{inventory,decay,gap,seasonality,saturation,cannibalization}',
  analyses_completed   TEXT[] NOT NULL DEFAULT '{}',
  analyses_failed      TEXT[] NOT NULL DEFAULT '{}',
  opportunities_created INTEGER NOT NULL DEFAULT 0 CHECK (opportunities_created >= 0),
  opportunities_updated INTEGER NOT NULL DEFAULT 0 CHECK (opportunities_updated >= 0),
  max_recommendations  INTEGER NOT NULL DEFAULT 20 CHECK (max_recommendations > 0),
  started_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at         TIMESTAMPTZ,
  duration_ms          INTEGER CHECK (duration_ms >= 0),
  error                TEXT,
  metadata             JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_runs_user_date ON analysis_runs (user_id, started_at DESC);
CREATE INDEX idx_runs_status ON analysis_runs (status) WHERE status = 'running';

ALTER TABLE analysis_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own runs" ON analysis_runs
  FOR SELECT USING (auth.uid() = user_id);
```

---

### 3.11 recommendation_history (Content Intelligence)

```sql
CREATE TABLE IF NOT EXISTS public.recommendation_history (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id          UUID NOT NULL REFERENCES keyword_opportunities(id) ON DELETE CASCADE,
  action                  TEXT NOT NULL
                          CHECK (action IN ('accepted', 'dismissed', 'executed', 'completed', 'performance_check')),
  priority_score_at_action NUMERIC(5,2) NOT NULL,
  performance_30d         JSONB,
  performance_60d         JSONB,
  performance_90d         JSONB,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_history_user_opportunity ON recommendation_history (user_id, opportunity_id, action);

ALTER TABLE recommendation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own history" ON recommendation_history
  FOR SELECT USING (auth.uid() = user_id);
```

---

### 3.12 cannibalization_conflicts (Content Intelligence)

```sql
CREATE TABLE IF NOT EXISTS public.cannibalization_conflicts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword                 TEXT NOT NULL,
  total_impressions       INTEGER NOT NULL CHECK (total_impressions >= 0),
  url_count               INTEGER NOT NULL CHECK (url_count >= 2),
  winner_url              TEXT NOT NULL,
  winner_clicks           INTEGER NOT NULL CHECK (winner_clicks >= 0),
  winner_position         NUMERIC(6,2) NOT NULL,
  loser_urls              JSONB NOT NULL,
  intent_type             TEXT NOT NULL
                          CHECK (intent_type IN ('informational', 'navigational', 'commercial', 'transactional', 'mixed')),
  recommended_resolution  TEXT NOT NULL
                          CHECK (recommended_resolution IN ('merge', 'redirect', 'differentiate', 'deoptimize')),
  resolution_confidence   TEXT NOT NULL CHECK (resolution_confidence IN ('high', 'medium', 'low')),
  resolution_status       TEXT NOT NULL DEFAULT 'open'
                          CHECK (resolution_status IN ('open', 'in_progress', 'resolved', 'dismissed')),
  resolved_at             TIMESTAMPTZ,
  analysis_run_id         UUID REFERENCES analysis_runs(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, keyword)
);

CREATE INDEX idx_cannibalization_user_status ON cannibalization_conflicts (user_id, resolution_status)
  WHERE resolution_status != 'resolved';
CREATE INDEX idx_cannibalization_impressions ON cannibalization_conflicts (user_id, total_impressions DESC);

ALTER TABLE cannibalization_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own conflicts" ON cannibalization_conflicts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own conflicts" ON cannibalization_conflicts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_cannibalization_updated_at
  BEFORE UPDATE ON cannibalization_conflicts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

### 3.13 writer_personas (Voice Intelligence)

```sql
CREATE TABLE IF NOT EXISTS public.writer_personas (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                     TEXT NOT NULL,
  is_default               BOOLEAN NOT NULL DEFAULT false,
  language                 TEXT NOT NULL DEFAULT 'en',
  source                   TEXT NOT NULL DEFAULT 'auto'
                           CHECK (source IN ('auto', 'manual', 'reference')),
  avg_sentence_length      NUMERIC(5,1) NOT NULL CHECK (avg_sentence_length > 0),
  sentence_length_variance NUMERIC(5,1) NOT NULL CHECK (sentence_length_variance >= 0),
  vocabulary_richness      NUMERIC(4,3) NOT NULL CHECK (vocabulary_richness >= 0 AND vocabulary_richness <= 1),
  formality_score          NUMERIC(5,2) NOT NULL CHECK (formality_score >= 0 AND formality_score <= 100),
  passive_voice_ratio      NUMERIC(4,3) NOT NULL CHECK (passive_voice_ratio >= 0 AND passive_voice_ratio <= 1),
  avg_paragraph_length     NUMERIC(5,1) NOT NULL CHECK (avg_paragraph_length > 0),
  paragraph_length_variance NUMERIC(5,2) NOT NULL CHECK (paragraph_length_variance >= 0),
  heading_style            TEXT NOT NULL DEFAULT 'mixed'
                           CHECK (heading_style IN ('question', 'declarative', 'how-to', 'mixed')),
  tone                     TEXT NOT NULL DEFAULT 'conversational'
                           CHECK (tone IN ('formal', 'conversational', 'technical', 'casual', 'authoritative', 'educational')),
  corpus_urls              TEXT[] NOT NULL DEFAULT '{}',
  corpus_size              INTEGER NOT NULL DEFAULT 0 CHECK (corpus_size >= 0),
  confidence               TEXT NOT NULL DEFAULT 'medium'
                           CHECK (confidence IN ('high', 'medium', 'low', 'very_low')),
  voice_profile            JSONB NOT NULL,
  metadata                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

CREATE INDEX idx_personas_user_default ON writer_personas (user_id, is_default)
  WHERE is_default = true;
CREATE INDEX idx_personas_user_created ON writer_personas (user_id, created_at DESC);
CREATE INDEX idx_personas_user_language ON writer_personas (user_id, language);

ALTER TABLE writer_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own personas" ON writer_personas
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own personas" ON writer_personas
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own personas" ON writer_personas
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own personas" ON writer_personas
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_writer_personas_updated_at
  BEFORE UPDATE ON writer_personas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Index rationale:**
- `idx_personas_user_default` (partial): Fast lookup of default persona during generation -- only indexes the single `is_default = true` row per user
- `idx_personas_user_created`: Chronological listing on Voice Profiles screen
- `idx_personas_user_language`: Filter personas by language for multi-language sites

---

### 3.14 analysis_sessions (Voice Intelligence)

```sql
CREATE TABLE IF NOT EXISTS public.analysis_sessions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_url             TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'queued'
                       CHECK (status IN ('queued', 'crawling', 'classifying', 'clustering', 'generating', 'completed', 'failed', 'cancelled')),
  trigger_type         TEXT NOT NULL DEFAULT 'manual'
                       CHECK (trigger_type IN ('auto_connect', 'manual', 'scheduled')),
  articles_discovered  INTEGER NOT NULL DEFAULT 0 CHECK (articles_discovered >= 0),
  articles_classified  INTEGER NOT NULL DEFAULT 0 CHECK (articles_classified >= 0),
  articles_human       INTEGER NOT NULL DEFAULT 0 CHECK (articles_human >= 0),
  articles_hybrid      INTEGER NOT NULL DEFAULT 0 CHECK (articles_hybrid >= 0),
  articles_ai          INTEGER NOT NULL DEFAULT 0 CHECK (articles_ai >= 0),
  clusters_found       INTEGER NOT NULL DEFAULT 0 CHECK (clusters_found >= 0),
  personas_generated   INTEGER NOT NULL DEFAULT 0 CHECK (personas_generated >= 0),
  corpus_data          JSONB NOT NULL DEFAULT '[]'::jsonb,
  error                TEXT,
  started_at           TIMESTAMPTZ,
  completed_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analysis_user_status ON analysis_sessions (user_id, status);
CREATE INDEX idx_analysis_user_created ON analysis_sessions (user_id, created_at DESC);

ALTER TABLE analysis_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own sessions" ON analysis_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sessions" ON analysis_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sessions" ON analysis_sessions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

### 3.15 voice_match_scores (Voice Intelligence)

```sql
CREATE TABLE IF NOT EXISTS public.voice_match_scores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id        UUID NOT NULL,
  persona_id        UUID REFERENCES writer_personas(id) ON DELETE SET NULL,
  overall_score     NUMERIC(4,3) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 1),
  passed            BOOLEAN NOT NULL,
  signal_scores     JSONB NOT NULL,
  revision_guidance TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_match_user_article ON voice_match_scores (user_id, article_id);
CREATE INDEX idx_match_persona_score ON voice_match_scores (persona_id, overall_score);
CREATE INDEX idx_match_user_created ON voice_match_scores (user_id, created_at DESC);

ALTER TABLE voice_match_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own scores" ON voice_match_scores
  FOR SELECT USING (auth.uid() = user_id);
```

---

### 3.16 quality_scores (Quality Gate)

```sql
CREATE TABLE IF NOT EXISTS public.quality_scores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id        UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  revision_number   INTEGER NOT NULL DEFAULT 0,

  overall_score     NUMERIC(4,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 10),
  passed            BOOLEAN NOT NULL DEFAULT false,
  flagged_for_review BOOLEAN NOT NULL DEFAULT false,

  eeat_score                 NUMERIC(4,2) CHECK (eeat_score >= 0 AND eeat_score <= 10),
  topical_completeness_score NUMERIC(4,2) CHECK (topical_completeness_score >= 0 AND topical_completeness_score <= 10),
  voice_match_score          NUMERIC(4,2) CHECK (voice_match_score >= 0 AND voice_match_score <= 10),
  ai_detection_score         NUMERIC(4,2) CHECK (ai_detection_score >= 0 AND ai_detection_score <= 10),
  freshness_score            NUMERIC(4,2) CHECK (freshness_score >= 0 AND freshness_score <= 10),
  technical_seo_score        NUMERIC(4,2) CHECK (technical_seo_score >= 0 AND technical_seo_score <= 10),
  readability_score          NUMERIC(4,2) CHECK (readability_score >= 0 AND readability_score <= 10),

  checklist_passed     INTEGER NOT NULL DEFAULT 0,
  checklist_failed     INTEGER NOT NULL DEFAULT 0,
  checklist_warnings   INTEGER NOT NULL DEFAULT 0,
  checklist_total      INTEGER NOT NULL DEFAULT 60,
  checklist_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,

  checklist_results    JSONB NOT NULL DEFAULT '[]'::jsonb,
  rubric_details       JSONB NOT NULL DEFAULT '{}'::jsonb,
  suggestions          JSONB NOT NULL DEFAULT '[]'::jsonb,
  revision_instructions JSONB,

  scoring_mode       TEXT NOT NULL DEFAULT 'pipeline'
                     CHECK (scoring_mode IN ('pipeline', 'standalone', 'bulk')),
  engine_duration_ms INTEGER,
  agent_duration_ms  INTEGER,
  total_duration_ms  INTEGER,
  agent_model        TEXT,
  language_detected  TEXT DEFAULT 'en',
  word_count         INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_qs_article_revision ON quality_scores (article_id, revision_number);
CREATE INDEX idx_qs_user_id ON quality_scores (user_id);
CREATE INDEX idx_qs_user_article ON quality_scores (user_id, article_id);
CREATE INDEX idx_qs_flagged ON quality_scores (user_id, flagged_for_review)
  WHERE flagged_for_review = true;
CREATE INDEX idx_qs_created ON quality_scores (user_id, created_at DESC);
CREATE INDEX idx_qs_overall ON quality_scores (user_id, overall_score);

ALTER TABLE quality_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own scores" ON quality_scores
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own scores" ON quality_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own scores" ON quality_scores
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins read all scores" ON quality_scores
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM subscriptions WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE TRIGGER trg_quality_scores_updated_at
  BEFORE UPDATE ON quality_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Index rationale:**
- `idx_qs_article_revision` (unique): One score per article per revision pass -- prevents duplicate scoring
- `idx_qs_user_article`: "Show me all scores for this article" on Quality Report screen
- `idx_qs_flagged` (partial): Admin review queue -- only indexes flagged articles
- `idx_qs_created`: Recent scores on dashboard
- `idx_qs_overall`: Sort articles by quality score

---

### 3.17 quality_revisions (Quality Gate)

```sql
CREATE TABLE IF NOT EXISTS public.quality_revisions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id        UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  quality_score_id  UUID NOT NULL REFERENCES quality_scores(id) ON DELETE CASCADE,

  revision_number          INTEGER NOT NULL CHECK (revision_number IN (1, 2)),
  status                   TEXT NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'timed_out')),

  triggering_signals       JSONB NOT NULL,
  triggering_checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  revision_instructions    JSONB NOT NULL,

  pre_revision_score       NUMERIC(4,2) NOT NULL,
  post_revision_score      NUMERIC(4,2),
  score_delta              NUMERIC(4,2),
  signals_improved         JSONB,
  signals_degraded         JSONB,

  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  duration_ms   INTEGER,
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_qr_user_article ON quality_revisions (user_id, article_id);
CREATE INDEX idx_qr_status ON quality_revisions (user_id, status);
CREATE UNIQUE INDEX idx_qr_article_revision ON quality_revisions (article_id, revision_number);

ALTER TABLE quality_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own revisions" ON quality_revisions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own revisions" ON quality_revisions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own revisions" ON quality_revisions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins read all revisions" ON quality_revisions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM subscriptions WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE TRIGGER trg_quality_revisions_updated_at
  BEFORE UPDATE ON quality_revisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

### 3.18 platform_connections (Publishing)

```sql
CREATE TABLE IF NOT EXISTS public.platform_connections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform          TEXT NOT NULL
                    CHECK (platform IN ('wordpress', 'shopify', 'contentful', 'strapi', 'ghost', 'webflow', 'sanity', 'webhook')),
  site_url          TEXT NOT NULL,
  display_name      TEXT,
  api_key_hash      TEXT,
  api_key_encrypted TEXT,
  oauth_token_encrypted TEXT,
  oauth_refresh_token_encrypted TEXT,
  oauth_expires_at  TIMESTAMPTZ,
  webhook_secret    TEXT,
  status            TEXT NOT NULL DEFAULT 'pending_verification'
                    CHECK (status IN ('active', 'disconnected', 'error', 'pending_verification', 'auth_expired')),
  capabilities      JSONB NOT NULL DEFAULT '{}'::jsonb,
  platform_version  TEXT,
  seo_plugin        TEXT,
  last_health_check_at TIMESTAMPTZ,
  last_push_at      TIMESTAMPTZ,
  last_error        TEXT,
  error_count       INTEGER DEFAULT 0,
  metadata          JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_platform_connections_user ON platform_connections (user_id);
CREATE INDEX idx_platform_connections_status ON platform_connections (status)
  WHERE status != 'disconnected';
CREATE INDEX idx_platform_connections_api_key_hash ON platform_connections (api_key_hash)
  WHERE api_key_hash IS NOT NULL;
CREATE UNIQUE INDEX idx_platform_connections_unique_site ON platform_connections (user_id, platform, site_url);

ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own connections" ON platform_connections
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin all connections" ON platform_connections
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM subscriptions WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE TRIGGER trg_platform_connections_updated_at
  BEFORE UPDATE ON platform_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Index rationale:**
- `idx_platform_connections_user`: List all connected platforms for a user
- `idx_platform_connections_status` (partial): Find unhealthy connections without scanning disconnected
- `idx_platform_connections_api_key_hash` (partial): WP plugin auth -- lookup connection by API key hash
- `idx_platform_connections_unique_site` (unique): Prevent duplicate site connections

---

### 3.19 publish_records (Publishing)

```sql
CREATE TABLE IF NOT EXISTS public.publish_records (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id             UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  platform_connection_id UUID NOT NULL REFERENCES platform_connections(id) ON DELETE CASCADE,
  platform               TEXT NOT NULL,
  status                 TEXT NOT NULL DEFAULT 'queued'
                         CHECK (status IN ('queued', 'uploading_images', 'pushing', 'published', 'failed', 'retrying', 'cancelled')),
  remote_id              TEXT,
  remote_url             TEXT,
  remote_edit_url        TEXT,
  payload_version        INTEGER NOT NULL DEFAULT 1,
  payload_hash           TEXT NOT NULL,
  content_hash           TEXT NOT NULL,
  push_attempts          INTEGER NOT NULL DEFAULT 0,
  images_uploaded        INTEGER DEFAULT 0,
  images_failed          INTEGER DEFAULT 0,
  seo_meta_set           BOOLEAN DEFAULT false,
  categories_set         TEXT[],
  tags_set               TEXT[],
  error_log              JSONB DEFAULT '[]'::jsonb,
  published_at           TIMESTAMPTZ,
  duration_ms            INTEGER,
  metadata               JSONB DEFAULT '{}'::jsonb,
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_publish_records_user_created ON publish_records (user_id, created_at DESC);
CREATE INDEX idx_publish_records_article ON publish_records (article_id);
CREATE INDEX idx_publish_records_connection_status ON publish_records (platform_connection_id, status);
CREATE INDEX idx_publish_records_payload_hash ON publish_records (payload_hash);
CREATE INDEX idx_publish_records_status ON publish_records (status)
  WHERE status IN ('queued', 'pushing', 'retrying');

ALTER TABLE publish_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own records" ON publish_records
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin all records" ON publish_records
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM subscriptions WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE TRIGGER trg_publish_records_updated_at
  BEFORE UPDATE ON publish_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

### 3.20 image_upload_log (Publishing)

```sql
CREATE TABLE IF NOT EXISTS public.image_upload_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publish_record_id UUID NOT NULL REFERENCES publish_records(id) ON DELETE CASCADE,
  source_url        TEXT NOT NULL,
  target_url        TEXT,
  cms_media_id      TEXT,
  image_type        TEXT NOT NULL CHECK (image_type IN ('featured', 'content', 'og_image')),
  file_size_bytes   INTEGER,
  mime_type         TEXT,
  status            TEXT NOT NULL CHECK (status IN ('pending', 'uploading', 'uploaded', 'failed', 'skipped')),
  error             TEXT,
  duration_ms       INTEGER,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_image_upload_publish ON image_upload_log (publish_record_id);

ALTER TABLE image_upload_log ENABLE ROW LEVEL SECURITY;

-- RLS via join to publish_records (user_id is on parent)
CREATE POLICY "Users read own images" ON image_upload_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM publish_records WHERE id = publish_record_id AND user_id = auth.uid())
  );
```

---

### 3.21 performance_predictions (Feedback Loop)

```sql
CREATE TABLE IF NOT EXISTS public.performance_predictions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id            UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  opportunity_id        UUID REFERENCES keyword_opportunities(id) ON DELETE SET NULL,
  keyword               TEXT NOT NULL,
  article_url           TEXT NOT NULL,
  original_url          TEXT NOT NULL,

  predicted_clicks_30d       INTEGER NOT NULL CHECK (predicted_clicks_30d >= 0),
  predicted_impressions_30d  INTEGER NOT NULL CHECK (predicted_impressions_30d >= 0),
  predicted_position         NUMERIC(6,2) NOT NULL CHECK (predicted_position > 0),
  predicted_clicks_60d       INTEGER NOT NULL CHECK (predicted_clicks_60d >= 0),
  predicted_impressions_60d  INTEGER NOT NULL CHECK (predicted_impressions_60d >= 0),
  predicted_clicks_90d       INTEGER NOT NULL CHECK (predicted_clicks_90d >= 0),
  predicted_impressions_90d  INTEGER NOT NULL CHECK (predicted_impressions_90d >= 0),
  predicted_ctr              NUMERIC(5,4) CHECK (predicted_ctr >= 0 AND predicted_ctr <= 1),

  actual_clicks_30d          INTEGER CHECK (actual_clicks_30d >= 0),
  actual_impressions_30d     INTEGER CHECK (actual_impressions_30d >= 0),
  actual_position_30d        NUMERIC(6,2) CHECK (actual_position_30d > 0),
  actual_ctr_30d             NUMERIC(5,4) CHECK (actual_ctr_30d >= 0 AND actual_ctr_30d <= 1),
  actual_sessions_30d        INTEGER CHECK (actual_sessions_30d >= 0),
  actual_engagement_rate_30d NUMERIC(5,4) CHECK (actual_engagement_rate_30d >= 0 AND actual_engagement_rate_30d <= 1),

  actual_clicks_60d          INTEGER CHECK (actual_clicks_60d >= 0),
  actual_impressions_60d     INTEGER CHECK (actual_impressions_60d >= 0),
  actual_position_60d        NUMERIC(6,2) CHECK (actual_position_60d > 0),
  actual_ctr_60d             NUMERIC(5,4) CHECK (actual_ctr_60d >= 0 AND actual_ctr_60d <= 1),
  actual_sessions_60d        INTEGER CHECK (actual_sessions_60d >= 0),
  actual_engagement_rate_60d NUMERIC(5,4) CHECK (actual_engagement_rate_60d >= 0 AND actual_engagement_rate_60d <= 1),

  actual_clicks_90d          INTEGER CHECK (actual_clicks_90d >= 0),
  actual_impressions_90d     INTEGER CHECK (actual_impressions_90d >= 0),
  actual_position_90d        NUMERIC(6,2) CHECK (actual_position_90d > 0),
  actual_ctr_90d             NUMERIC(5,4) CHECK (actual_ctr_90d >= 0 AND actual_ctr_90d <= 1),
  actual_sessions_90d        INTEGER CHECK (actual_sessions_90d >= 0),
  actual_engagement_rate_90d NUMERIC(5,4) CHECK (actual_engagement_rate_90d >= 0 AND actual_engagement_rate_90d <= 1),

  accuracy_score_30d   NUMERIC(5,2) CHECK (accuracy_score_30d >= 0 AND accuracy_score_30d <= 100),
  accuracy_score_60d   NUMERIC(5,2) CHECK (accuracy_score_60d >= 0 AND accuracy_score_60d <= 100),
  accuracy_score_90d   NUMERIC(5,2) CHECK (accuracy_score_90d >= 0 AND accuracy_score_90d <= 100),
  accuracy_confidence  TEXT NOT NULL DEFAULT 'medium'
                       CHECK (accuracy_confidence IN ('high', 'medium', 'low')),

  check_status         TEXT NOT NULL DEFAULT 'pending_30d'
                       CHECK (check_status IN ('pending_30d', 'checked_30d', 'pending_60d', 'checked_60d', 'pending_90d', 'checked_90d', 'complete', 'measurement_failed', 'article_removed')),
  next_check_at        TIMESTAMPTZ,
  published_at         TIMESTAMPTZ NOT NULL,
  checked_30d_at       TIMESTAMPTZ,
  checked_60d_at       TIMESTAMPTZ,
  checked_90d_at       TIMESTAMPTZ,

  opportunity_type     TEXT NOT NULL DEFAULT 'mode_a'
                       CHECK (opportunity_type IN ('gap', 'decay', 'cannibalization', 'trending', 'seasonal', 'mode_a')),
  content_format       TEXT CHECK (content_format IN ('how-to', 'listicle', 'comparison', 'review', 'guide', 'news', 'reference', 'tutorial', 'other')),
  voice_persona_id     UUID,
  prediction_metadata  JSONB NOT NULL DEFAULT '{}'::jsonb,
  measurement_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  anomaly_flags        TEXT[] NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (article_id)
);

CREATE INDEX idx_predictions_user_status ON performance_predictions (user_id, check_status);
CREATE INDEX idx_predictions_next_check ON performance_predictions (next_check_at)
  WHERE next_check_at IS NOT NULL;
CREATE INDEX idx_predictions_user_accuracy90 ON performance_predictions (user_id, accuracy_score_90d DESC NULLS LAST);
CREATE INDEX idx_predictions_user_published ON performance_predictions (user_id, published_at DESC);
CREATE INDEX idx_predictions_user_type ON performance_predictions (user_id, opportunity_type);
CREATE INDEX idx_predictions_user_format ON performance_predictions (user_id, content_format)
  WHERE content_format IS NOT NULL;
CREATE INDEX idx_predictions_confidence ON performance_predictions (user_id, accuracy_confidence);

ALTER TABLE performance_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own predictions" ON performance_predictions
  FOR SELECT USING (auth.uid() = user_id);
-- All writes via service_role (bridge server). No user INSERT/UPDATE policy.

CREATE TRIGGER trg_performance_predictions_updated_at
  BEFORE UPDATE ON performance_predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Index rationale:**
- `idx_predictions_user_status`: Dashboard -- find articles at each checkpoint stage
- `idx_predictions_next_check` (partial): Scheduler picks up due checkpoints efficiently, excludes completed
- `idx_predictions_user_accuracy90`: Reporting -- rank articles by final accuracy
- `idx_predictions_user_published`: Portfolio view -- chronological article list
- `idx_predictions_user_type`: Per-type performance breakdowns (gap vs decay vs Mode A)
- `idx_predictions_user_format` (partial): Format effectiveness analysis, excludes NULLs
- `idx_predictions_confidence`: Filter out low-confidence for recalibration input

---

### 3.22 scoring_weight_history (Feedback Loop)

```sql
CREATE TABLE IF NOT EXISTS public.scoring_weight_history (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  triggered_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type           TEXT NOT NULL
                       CHECK (event_type IN ('dry_run', 'applied', 'rolled_back', 'auto_reverted')),
  weights_before       JSONB NOT NULL,
  weights_after        JSONB NOT NULL,
  weight_deltas        JSONB NOT NULL,
  sample_size          INTEGER NOT NULL CHECK (sample_size >= 0),
  outliers_excluded    INTEGER NOT NULL DEFAULT 0 CHECK (outliers_excluded >= 0),
  outlier_threshold_std NUMERIC(3,1) NOT NULL DEFAULT 2.0 CHECK (outlier_threshold_std > 0),
  mean_accuracy_before NUMERIC(5,2) NOT NULL CHECK (mean_accuracy_before >= 0 AND mean_accuracy_before <= 100),
  mean_accuracy_after  NUMERIC(5,2) NOT NULL CHECK (mean_accuracy_after >= 0 AND mean_accuracy_after <= 100),
  accuracy_improvement NUMERIC(5,2) NOT NULL,
  per_signal_analysis  JSONB NOT NULL DEFAULT '{}'::jsonb,
  backtest_results     JSONB NOT NULL DEFAULT '{}'::jsonb,
  learning_rate_used   NUMERIC(4,3) NOT NULL DEFAULT 0.05 CHECK (learning_rate_used > 0 AND learning_rate_used <= 1),
  changes_summary      TEXT NOT NULL,
  rollback_of          UUID REFERENCES scoring_weight_history(id),
  superseded_by        UUID REFERENCES scoring_weight_history(id),
  metadata             JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_swh_user_date ON scoring_weight_history (user_id, created_at DESC);
CREATE INDEX idx_swh_user_type ON scoring_weight_history (user_id, event_type);
CREATE INDEX idx_swh_rollback ON scoring_weight_history (rollback_of)
  WHERE rollback_of IS NOT NULL;

ALTER TABLE scoring_weight_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all history" ON scoring_weight_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM subscriptions WHERE user_id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Users read own history" ON scoring_weight_history
  FOR SELECT USING (auth.uid() = user_id);
-- All writes via service_role. No user INSERT/UPDATE/DELETE.
```

---

### 3.23 performance_reports (Feedback Loop)

```sql
CREATE TABLE IF NOT EXISTS public.performance_reports (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_by             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  report_type              TEXT NOT NULL
                           CHECK (report_type IN ('monthly', 'quarterly', 'custom', 'on_demand')),
  period_start             DATE NOT NULL,
  period_end               DATE NOT NULL,
  articles_tracked         INTEGER NOT NULL CHECK (articles_tracked >= 0),
  articles_with_checkpoints INTEGER NOT NULL CHECK (articles_with_checkpoints >= 0),
  total_clicks             INTEGER NOT NULL CHECK (total_clicks >= 0),
  total_impressions        INTEGER NOT NULL CHECK (total_impressions >= 0),
  avg_accuracy_score       NUMERIC(5,2) CHECK (avg_accuracy_score >= 0 AND avg_accuracy_score <= 100),
  top_performers           JSONB NOT NULL DEFAULT '[]'::jsonb,
  underperformers          JSONB NOT NULL DEFAULT '[]'::jsonb,
  roi_metrics              JSONB NOT NULL DEFAULT '{}'::jsonb,
  recommendations          JSONB NOT NULL DEFAULT '[]'::jsonb,
  portfolio_breakdown      JSONB NOT NULL DEFAULT '{}'::jsonb,
  accuracy_trend           JSONB NOT NULL DEFAULT '[]'::jsonb,
  report_json              JSONB NOT NULL,
  report_html              TEXT,
  cached_until             TIMESTAMPTZ,
  metadata                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_user_period ON performance_reports (user_id, period_start DESC, period_end DESC);
CREATE INDEX idx_reports_user_type ON performance_reports (user_id, report_type, created_at DESC);
CREATE INDEX idx_reports_cache ON performance_reports (cached_until)
  WHERE cached_until IS NOT NULL;

ALTER TABLE performance_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own reports" ON performance_reports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins read all reports" ON performance_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM subscriptions WHERE user_id = auth.uid() AND role = 'admin')
  );
-- Writes by service_role only.
```

---

## 4. Migration Plan

Migrations are numbered sequentially starting from 007 (existing migrations 001-006 are in supabase-setup.sql and subsequent schema changes).

| Migration | File | Tables | Service | Phase |
|-----------|------|--------|---------|-------|
| 007 | `007-data-ingestion-connections.sql` | client_connections, oauth_states, ingestion_jobs, api_cache | Data Ingestion | A |
| 008 | `008-content-inventory.sql` | crawl_sessions, content_inventory | Data Ingestion | A |
| 009 | `009-performance-snapshots.sql` | performance_snapshots (partitioned), performance_snapshots_monthly | Data Ingestion | A |
| 010 | `010-content-intelligence.sql` | keyword_opportunities, analysis_runs, recommendation_history, cannibalization_conflicts | Content Intelligence | B |
| 011 | `011-voice-intelligence.sql` | writer_personas, analysis_sessions, voice_match_scores | Voice Intelligence | C |
| 012 | `012-quality-gate.sql` | quality_scores, quality_revisions | Quality Gate | B |
| 013 | `013-extensions.sql` | Enable pg_trgm extension for keyword search | Content Intelligence | B |
| 014 | `014-platform-connections.sql` | platform_connections | Publishing | C |
| 015 | `015-publish-records.sql` | publish_records, image_upload_log | Publishing | C |
| 016 | `016-feedback-predictions.sql` | performance_predictions, scoring_weight_history | Feedback Loop | D |
| 017 | `017-performance-reports.sql` | performance_reports | Feedback Loop | D |

### Migration Execution Order

Each migration is idempotent (`CREATE TABLE IF NOT EXISTS`). Run in Supabase SQL Editor in order.

**Phase A (Weeks 1-6):** Migrations 007, 008, 009
**Phase B (Weeks 7-12):** Migrations 010, 012, 013
**Phase C (Weeks 13-18):** Migrations 011, 014, 015
**Phase D (Weeks 19-24):** Migrations 016, 017

### Migration Dependencies

```
007 (connections)     -- no dependencies
008 (inventory)       -- depends on 007 (crawl_sessions referenced by content_inventory)
009 (snapshots)       -- depends on 008 (content_id FK to content_inventory)
010 (intelligence)    -- depends on 009 (reads performance_snapshots)
011 (voice)           -- depends on 008 (reads content_inventory for corpus URLs)
012 (quality)         -- depends on existing articles table
013 (extensions)      -- no dependencies (run early if possible)
014 (publishing)      -- no dependencies
015 (publish records) -- depends on 014 (FK to platform_connections)
016 (predictions)     -- depends on existing articles, 010 (keyword_opportunities FK)
017 (reports)         -- no new FKs, but logically depends on 016
```

---

## 5. Data Lifecycle

### Retention Policies

| Table | Retention | Purge Method | Rationale |
|-------|-----------|-------------|-----------|
| performance_snapshots | 90 days (daily granularity) | Monthly cron: `DROP PARTITION` for months older than 90 days. Runs as part of scheduler's purge job | Highest volume table. 60MB/client/month. Without purge, fills 8GB in ~4 months for single enterprise client |
| performance_snapshots_monthly | Indefinite | No purge (aggregated, compact) | Long-term trend data. ~120 bytes/row. Grows at ~10K rows/client/year |
| oauth_states | 10 minutes | Scheduler cleanup: `DELETE FROM oauth_states WHERE created_at < now() - interval '10 minutes'` | Transient CSRF tokens. Should never accumulate |
| api_cache | 7-30 days (per provider) | TTL-based: `DELETE FROM api_cache WHERE expires_at < now()` | Reduces Semrush/Ahrefs API costs by 60-70% |
| analysis_sessions.corpus_data | 30 days post-completion | Scheduler: `UPDATE analysis_sessions SET corpus_data = '[]' WHERE status = 'completed' AND completed_at < now() - interval '30 days'` | Raw corpus data is large (50-100 articles). Only computed features survive in writer_personas |
| ingestion_jobs | 90 days | `DELETE FROM ingestion_jobs WHERE created_at < now() - interval '90 days'` | Job history useful for debugging but not indefinitely |
| image_upload_log | 180 days | `DELETE FROM image_upload_log WHERE created_at < now() - interval '180 days'` | Upload logs useful for debugging publish issues |
| recommendation_history | Indefinite | No purge | Critical for Feedback Loop recalibration. Compact rows |

### Aggregation Strategy (performance_snapshots)

The aggregation pipeline runs monthly on the 1st of each month:

1. **Compute monthly averages** for the previous month:
   ```sql
   INSERT INTO performance_snapshots_monthly (user_id, content_id, url, month, avg_clicks, avg_impressions, avg_ctr, avg_position, total_sessions, avg_health_score)
   SELECT user_id, content_id, url, date_trunc('month', snapshot_date)::date,
          AVG(clicks), AVG(impressions), AVG(ctr), AVG(avg_position),
          SUM(sessions), AVG(health_score)
   FROM performance_snapshots
   WHERE snapshot_date >= date_trunc('month', now() - interval '1 month')
     AND snapshot_date < date_trunc('month', now())
   GROUP BY user_id, content_id, url, date_trunc('month', snapshot_date);
   ```

2. **Drop the old partition** (for months older than 90 days):
   ```sql
   DROP TABLE IF EXISTS performance_snapshots_2025_12;
   ```

3. **Create the next month's partition** (pre-create 2 months ahead):
   ```sql
   CREATE TABLE IF NOT EXISTS performance_snapshots_2026_07 PARTITION OF performance_snapshots
     FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
   ```

### Storage Budget

| Table | Est. Size/Client/Month | 10 Clients/Year | 100 Clients/Year |
|-------|------------------------|------------------|-------------------|
| performance_snapshots (with 90-day purge) | 180MB (3 months retained) | 1.8GB | 18GB (exceeds 8GB -- needs plan upgrade) |
| performance_snapshots_monthly | 1.2MB | 12MB | 120MB |
| content_inventory | 5-50MB | 50-500MB | 0.5-5GB |
| All other tables combined | 2-10MB | 20-100MB | 200MB-1GB |

**Conclusion:** The 8GB Supabase Pro plan supports ~40 active enterprise clients with 90-day purge. Beyond that, upgrade to Team ($599/mo, 100GB) or self-hosted PostgreSQL.

---

## 6. Cross-Table Queries (Top 10)

### Q1: Dashboard Recommendation List (Opportunities screen)

```sql
SELECT ko.id, ko.keyword, ko.opportunity_type, ko.priority_score,
       ko.impressions, ko.estimated_volume, ko.current_position,
       ko.recommended_action, ko.intent_type, ko.confidence, ko.status,
       ko.analysis_metadata
FROM keyword_opportunities ko
WHERE ko.user_id = $1
  AND ko.status = 'open'
ORDER BY ko.priority_score DESC
LIMIT 25 OFFSET $2;
```
**Uses:** `idx_opportunities_user_status` (partial) + `idx_opportunities_user_score`
**Expected:** <10ms for 2000 rows

### Q2: Content Inventory with Health Scores (Content Inventory screen)

```sql
SELECT ci.id, ci.url, ci.title, ci.word_count, ci.status, ci.publish_date,
       ci.last_crawled_at,
       ps.health_score, ps.clicks, ps.impressions, ps.avg_position
FROM content_inventory ci
LEFT JOIN LATERAL (
  SELECT health_score, clicks, impressions, avg_position
  FROM performance_snapshots
  WHERE content_id = ci.id AND source = 'combined'
  ORDER BY snapshot_date DESC LIMIT 1
) ps ON true
WHERE ci.user_id = $1
ORDER BY ci.publish_date DESC NULLS LAST
LIMIT 50 OFFSET $2;
```
**Uses:** `idx_inventory_user_date`, `idx_perf_content_date`
**Expected:** <50ms for 10K inventory rows (LATERAL limits snapshot scan to 1 row per URL)

### Q3: Article Quality Report (Quality Report screen)

```sql
SELECT qs.*, qr.revision_number AS rev_num, qr.pre_revision_score,
       qr.post_revision_score, qr.score_delta
FROM quality_scores qs
LEFT JOIN quality_revisions qr ON qs.article_id = qr.article_id
WHERE qs.article_id = $1
  AND qs.user_id = $2
ORDER BY qs.revision_number DESC;
```
**Uses:** `idx_qs_user_article`, `idx_qr_user_article`
**Expected:** <5ms (typically 1-3 rows)

### Q4: Prediction vs Actual (Performance screen -- single article)

```sql
SELECT pp.*, a.title AS article_title
FROM performance_predictions pp
JOIN articles a ON pp.article_id = a.id
WHERE pp.article_id = $1
  AND pp.user_id = $2;
```
**Uses:** `UNIQUE (article_id)` on performance_predictions
**Expected:** <5ms (single row lookup)

### Q5: Portfolio Accuracy Summary (Performance screen -- portfolio view)

```sql
SELECT
  opportunity_type,
  COUNT(*) AS article_count,
  AVG(accuracy_score_90d) AS avg_accuracy,
  AVG(actual_clicks_90d) AS avg_clicks,
  COUNT(*) FILTER (WHERE accuracy_score_90d >= 70) AS accurate_count
FROM performance_predictions
WHERE user_id = $1
  AND check_status = 'complete'
GROUP BY opportunity_type;
```
**Uses:** `idx_predictions_user_type`
**Expected:** <20ms for 500 articles

### Q6: Due Checkpoints (Scheduler -- admin)

```sql
SELECT pp.id, pp.user_id, pp.article_id, pp.article_url, pp.check_status,
       pp.next_check_at, pp.keyword
FROM performance_predictions pp
WHERE pp.next_check_at <= now()
  AND pp.next_check_at IS NOT NULL
ORDER BY pp.next_check_at ASC
LIMIT 100;
```
**Uses:** `idx_predictions_next_check` (partial)
**Expected:** <10ms

### Q7: Connection Health Dashboard (Connections screen)

```sql
SELECT cc.id, cc.provider, cc.status, cc.last_sync_at, cc.last_error,
       cc.sync_count, cc.token_expires_at,
       EXTRACT(EPOCH FROM (cc.token_expires_at - now())) / 3600 AS expires_in_hours
FROM client_connections cc
WHERE cc.user_id = $1
ORDER BY cc.provider;
```
**Uses:** `idx_connections_user_provider`
**Expected:** <5ms (3-5 rows per user)

### Q8: Publish History for Article (Article Detail screen)

```sql
SELECT pr.id, pr.platform, pr.status, pr.remote_url, pr.remote_edit_url,
       pr.published_at, pr.images_uploaded, pr.images_failed, pr.seo_meta_set,
       pc.display_name AS connection_name, pc.site_url
FROM publish_records pr
JOIN platform_connections pc ON pr.platform_connection_id = pc.id
WHERE pr.article_id = $1
  AND pr.user_id = $2
ORDER BY pr.created_at DESC;
```
**Uses:** `idx_publish_records_article`
**Expected:** <5ms

### Q9: Voice Persona Listing (Voice Profiles screen)

```sql
SELECT wp.id, wp.name, wp.is_default, wp.language, wp.tone, wp.corpus_size,
       wp.confidence, wp.avg_sentence_length, wp.vocabulary_richness,
       wp.formality_score, wp.created_at,
       COUNT(vms.id) AS articles_scored,
       AVG(vms.overall_score) AS avg_match_score
FROM writer_personas wp
LEFT JOIN voice_match_scores vms ON wp.id = vms.persona_id
WHERE wp.user_id = $1
GROUP BY wp.id
ORDER BY wp.is_default DESC, wp.created_at DESC;
```
**Uses:** `idx_personas_user_created`, `idx_match_persona_score`
**Expected:** <10ms (5-20 personas per user)

### Q10: Cannibalization Dashboard (Opportunities screen -- cannibalization tab)

```sql
SELECT cc.id, cc.keyword, cc.total_impressions, cc.url_count,
       cc.winner_url, cc.winner_clicks, cc.winner_position,
       cc.loser_urls, cc.recommended_resolution, cc.resolution_confidence,
       cc.resolution_status
FROM cannibalization_conflicts cc
WHERE cc.user_id = $1
  AND cc.resolution_status != 'resolved'
ORDER BY cc.total_impressions DESC
LIMIT 50;
```
**Uses:** `idx_cannibalization_user_status` (partial), `idx_cannibalization_impressions`
**Expected:** <10ms

---

## 7. Index Strategy

Every index listed below is justified by a specific query pattern. No speculative indexes.

### Data Ingestion Indexes

| Index | Table | Columns | Type | Query Pattern |
|-------|-------|---------|------|---------------|
| idx_connections_user_provider | client_connections | (user_id, provider) | B-tree | "Get this user's Google connection" |
| idx_connections_status | client_connections | (status) WHERE status != 'connected' | Partial B-tree | Admin: find broken connections |
| idx_oauth_states_created | oauth_states | (created_at) | B-tree | Cleanup: delete expired states |
| idx_inventory_user_url | content_inventory | (user_id, url) UNIQUE | B-tree | Primary lookup + upsert |
| idx_inventory_user_status | content_inventory | (user_id, status) | B-tree | Filter by content quality |
| idx_inventory_user_date | content_inventory | (user_id, publish_date DESC NULLS LAST) | B-tree | Sort by publication recency |
| idx_inventory_crawl_session | content_inventory | (crawl_session_id) | B-tree | FK index: find items per crawl |
| idx_inventory_content_hash | content_inventory | (user_id, content_hash) | B-tree | Detect content changes |
| idx_crawl_sessions_user_status | crawl_sessions | (user_id, status) | B-tree | Find active crawls |
| idx_perf_user_date | performance_snapshots | (user_id, snapshot_date DESC) | B-tree | Dashboard time-series |
| idx_perf_content_date | performance_snapshots | (content_id, snapshot_date DESC) | B-tree | Per-URL trend charts |
| idx_perf_user_url_source | performance_snapshots | (user_id, url, source) | B-tree | Connector-specific lookups |
| idx_perf_health_score | performance_snapshots | (user_id, health_score) WHERE NOT NULL | Partial B-tree | Sort by health |
| idx_monthly_user_month | performance_snapshots_monthly | (user_id, month DESC) | B-tree | Long-term trends |
| idx_jobs_user_source_status | ingestion_jobs | (user_id, source, status) | B-tree | Active jobs per source |
| idx_cache_key | api_cache | (cache_key) | B-tree | Cache lookup |
| idx_cache_expires | api_cache | (expires_at) | B-tree | Purge expired |

### Content Intelligence Indexes

| Index | Table | Columns | Type | Query Pattern |
|-------|-------|---------|------|---------------|
| idx_opportunities_user_score | keyword_opportunities | (user_id, priority_score DESC) | B-tree | Ranked recommendation list |
| idx_opportunities_user_type_status | keyword_opportunities | (user_id, opportunity_type, status) | B-tree | Filtered views |
| idx_opportunities_user_status | keyword_opportunities | (user_id, status) WHERE status = 'open' | Partial B-tree | Open opportunity count |
| idx_opportunities_run | keyword_opportunities | (analysis_run_id) | B-tree | FK: find all from a run |
| idx_runs_user_date | analysis_runs | (user_id, started_at DESC) | B-tree | Run history |
| idx_runs_status | analysis_runs | (status) WHERE status = 'running' | Partial B-tree | Active runs |
| idx_history_user_opportunity | recommendation_history | (user_id, opportunity_id, action) | B-tree | Action trail per recommendation |
| idx_cannibalization_user_status | cannibalization_conflicts | (user_id, resolution_status) WHERE != 'resolved' | Partial B-tree | Unresolved conflicts |
| idx_cannibalization_impressions | cannibalization_conflicts | (user_id, total_impressions DESC) | B-tree | Sort by impact |

### Voice Intelligence Indexes

| Index | Table | Columns | Type | Query Pattern |
|-------|-------|---------|------|---------------|
| idx_personas_user_default | writer_personas | (user_id, is_default) WHERE is_default = true | Partial B-tree | Default persona for generation |
| idx_personas_user_created | writer_personas | (user_id, created_at DESC) | B-tree | Chronological listing |
| idx_personas_user_language | writer_personas | (user_id, language) | B-tree | Filter by language |
| idx_analysis_user_status | analysis_sessions | (user_id, status) | B-tree | Active sessions |
| idx_analysis_user_created | analysis_sessions | (user_id, created_at DESC) | B-tree | Session history |
| idx_match_user_article | voice_match_scores | (user_id, article_id) | B-tree | Score per article |
| idx_match_persona_score | voice_match_scores | (persona_id, overall_score) | B-tree | Persona quality tracking |
| idx_match_user_created | voice_match_scores | (user_id, created_at DESC) | B-tree | Recent scores |

### Quality Gate Indexes

| Index | Table | Columns | Type | Query Pattern |
|-------|-------|---------|------|---------------|
| idx_qs_article_revision | quality_scores | (article_id, revision_number) UNIQUE | B-tree | One score per revision |
| idx_qs_user_id | quality_scores | (user_id) | B-tree | User's scores |
| idx_qs_user_article | quality_scores | (user_id, article_id) | B-tree | Scores for one article |
| idx_qs_flagged | quality_scores | (user_id, flagged_for_review) WHERE flagged = true | Partial B-tree | Admin review queue |
| idx_qs_created | quality_scores | (user_id, created_at DESC) | B-tree | Recent scores |
| idx_qs_overall | quality_scores | (user_id, overall_score) | B-tree | Sort by quality |
| idx_qr_user_article | quality_revisions | (user_id, article_id) | B-tree | Revision history |
| idx_qr_status | quality_revisions | (user_id, status) | B-tree | Active revisions |
| idx_qr_article_revision | quality_revisions | (article_id, revision_number) UNIQUE | B-tree | One revision per pass |

### Publishing Indexes

| Index | Table | Columns | Type | Query Pattern |
|-------|-------|---------|------|---------------|
| idx_platform_connections_user | platform_connections | (user_id) | B-tree | User's connections |
| idx_platform_connections_status | platform_connections | (status) WHERE status != 'disconnected' | Partial B-tree | Find active/broken |
| idx_platform_connections_api_key_hash | platform_connections | (api_key_hash) WHERE NOT NULL | Partial B-tree | WP plugin auth |
| idx_platform_connections_unique_site | platform_connections | (user_id, platform, site_url) UNIQUE | B-tree | Prevent duplicates |
| idx_publish_records_user_created | publish_records | (user_id, created_at DESC) | B-tree | Publish history |
| idx_publish_records_article | publish_records | (article_id) | B-tree | FK: article's publishes |
| idx_publish_records_connection_status | publish_records | (platform_connection_id, status) | B-tree | Connection's publishes |
| idx_publish_records_payload_hash | publish_records | (payload_hash) | B-tree | Duplicate detection |
| idx_publish_records_status | publish_records | (status) WHERE status IN ('queued','pushing','retrying') | Partial B-tree | Active publishes |
| idx_image_upload_publish | image_upload_log | (publish_record_id) | B-tree | FK: images per publish |

### Feedback Loop Indexes

| Index | Table | Columns | Type | Query Pattern |
|-------|-------|---------|------|---------------|
| idx_predictions_user_status | performance_predictions | (user_id, check_status) | B-tree | Dashboard checkpoint stages |
| idx_predictions_next_check | performance_predictions | (next_check_at) WHERE NOT NULL | Partial B-tree | Scheduler: due checkpoints |
| idx_predictions_user_accuracy90 | performance_predictions | (user_id, accuracy_score_90d DESC NULLS LAST) | B-tree | Rank by accuracy |
| idx_predictions_user_published | performance_predictions | (user_id, published_at DESC) | B-tree | Chronological portfolio |
| idx_predictions_user_type | performance_predictions | (user_id, opportunity_type) | B-tree | Per-type breakdowns |
| idx_predictions_user_format | performance_predictions | (user_id, content_format) WHERE NOT NULL | Partial B-tree | Format analysis |
| idx_predictions_confidence | performance_predictions | (user_id, accuracy_confidence) | B-tree | Filter for recalibration |
| idx_swh_user_date | scoring_weight_history | (user_id, created_at DESC) | B-tree | Recalibration timeline |
| idx_swh_user_type | scoring_weight_history | (user_id, event_type) | B-tree | Find latest applied |
| idx_swh_rollback | scoring_weight_history | (rollback_of) WHERE NOT NULL | Partial B-tree | Rollback chain |
| idx_reports_user_period | performance_reports | (user_id, period_start DESC, period_end DESC) | B-tree | Find by period |
| idx_reports_user_type | performance_reports | (user_id, report_type, created_at DESC) | B-tree | List by type |
| idx_reports_cache | performance_reports | (cached_until) WHERE NOT NULL | Partial B-tree | Cache invalidation |

**Total indexes: 62** (17 Data Ingestion + 9 Content Intelligence + 8 Voice Intelligence + 9 Quality Gate + 10 Publishing + 13 Feedback Loop minus existing table indexes).

---

## 8. RLS Policy Summary

Every table uses Row-Level Security. The pattern is consistent: users see only their own data, admin sees all, service_role bypasses RLS.

| Table | SELECT | INSERT | UPDATE | DELETE | Admin Override | Notes |
|-------|--------|--------|--------|--------|----------------|-------|
| subscriptions | Own | -- | -- | -- | -- | Existing, read-only for users |
| usage_logs | Own | Own | -- | -- | -- | Existing |
| articles | Own | Own | Own | Own | -- | Existing |
| article_versions | Own | Own | -- | -- | -- | Existing |
| pipeline_jobs | Own | Own | Own | -- | -- | Existing |
| user_settings | Own | Own | Own | -- | -- | Existing |
| api_keys | Own | Own | Own | Own | -- | Existing |
| plugin_instances | Own | Own | Own | Own | -- | Existing |
| plugin_config | Own | Own | Own | -- | -- | Existing |
| client_connections | Own | Own | Own | Own | -- | New |
| oauth_states | -- | -- | -- | -- | -- | No RLS (service_role only) |
| content_inventory | Own | Own | Own | Own | -- | New |
| crawl_sessions | Own | Own | Own | -- | -- | New |
| performance_snapshots | Own | -- | -- | -- | -- | Scheduler writes via service_role |
| performance_snapshots_monthly | Own | -- | -- | -- | -- | Aggregation writes via service_role |
| ingestion_jobs | Own | -- | -- | -- | -- | Scheduler writes via service_role |
| api_cache | -- | -- | -- | -- | -- | No RLS (shared cache, service_role) |
| keyword_opportunities | Own | -- | Own (status) | -- | -- | Service_role writes, users update status |
| analysis_runs | Own | -- | -- | -- | -- | Service_role writes |
| recommendation_history | Own | -- | -- | -- | -- | Service_role writes |
| cannibalization_conflicts | Own | -- | Own | -- | -- | Service_role writes, users update status |
| writer_personas | Own | Own | Own | Own | -- | New |
| analysis_sessions | Own | Own | Own | -- | -- | New |
| voice_match_scores | Own | -- | -- | -- | -- | Service_role writes |
| quality_scores | Own | Own | Own | -- | Admin SELECT | New |
| quality_revisions | Own | Own | Own | -- | Admin SELECT | New |
| platform_connections | Own (ALL) | Own (ALL) | Own (ALL) | Own (ALL) | Admin SELECT | New |
| publish_records | Own (ALL) | Own (ALL) | Own (ALL) | Own (ALL) | Admin SELECT | New |
| image_upload_log | Own (via JOIN) | -- | -- | -- | -- | RLS via parent FK join |
| performance_predictions | Own | -- | -- | -- | -- | Service_role writes |
| scoring_weight_history | Own | -- | -- | -- | Admin SELECT | Service_role writes |
| performance_reports | Own | -- | -- | -- | Admin SELECT | Service_role writes |

### RLS Implementation Pattern

Standard user-scoped policy (used by most tables):
```sql
CREATE POLICY "Users read own [table]" ON [table]
  FOR SELECT USING (auth.uid() = user_id);
```

Admin override policy (used by quality_scores, publish_records, scoring_weight_history, performance_reports):
```sql
CREATE POLICY "Admins read all [table]" ON [table]
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM subscriptions WHERE user_id = auth.uid() AND role = 'admin')
  );
```

Service_role bypass: The bridge server uses the `SUPABASE_SERVICE_ROLE_KEY` for scheduler writes, ingestion results, and analysis outputs. This key bypasses RLS entirely. It is never exposed to clients.

---

## Summary

```
UNIFIED SCHEMA:
  Total tables:              32 (9 existing + 23 new)
  Total indexes:             62+ (across all new tables)
  Total RLS policies:        80+ (across all tables)
  Migrations planned:        11 (007 through 017)
  Partitioned tables:        1 (performance_snapshots by month)
  Tables with no RLS:        2 (oauth_states, api_cache -- service_role only)
  Tables with admin override: 6 (quality_scores, quality_revisions, platform_connections,
                                  publish_records, scoring_weight_history, performance_reports)
  Highest volume table:      performance_snapshots (~300K rows/client/month)
  Storage budget at 40 clients: ~4GB (within 8GB Supabase Pro limit)
  Cross-table queries:       10 documented with index coverage
```
