-- Migration 008: Content Inventory & Crawl Sessions
-- Creates tables for the content crawler (DI-004)
-- crawl_sessions must be created BEFORE content_inventory (FK reference)

-- ── Crawl Sessions ──────────────────────────────────────────

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

-- ── Content Inventory ───────────────────────────────────────

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
