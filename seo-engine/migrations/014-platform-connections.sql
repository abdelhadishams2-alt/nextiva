-- Migration 014: Platform Connections
-- Task: PB-002
-- Stores encrypted credentials for WordPress, Shopify, Ghost, and other CMS platforms.
-- Credentials are encrypted at the application layer using AES-256-GCM before storage.

-- ── platform_connections ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('wordpress', 'shopify', 'ghost', 'custom')),
  site_url TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  credentials_encrypted TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_validation'
    CHECK (status IN ('pending_validation', 'active', 'invalid', 'error', 'disabled')),
  last_sync TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_platform_connections_user_id
  ON platform_connections(user_id);

CREATE INDEX IF NOT EXISTS idx_platform_connections_user_platform
  ON platform_connections(user_id, platform);

CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_connections_user_site
  ON platform_connections(user_id, platform, site_url);

-- RLS policies
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections"
  ON platform_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections"
  ON platform_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections"
  ON platform_connections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections"
  ON platform_connections FOR DELETE
  USING (auth.uid() = user_id);

-- ── publish_log ───────────────────────────────────────────────────────
-- Tracks every publish/update action for audit and status checking.
CREATE TABLE IF NOT EXISTS publish_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL,
  connection_id UUID NOT NULL REFERENCES platform_connections(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'success', 'error', 'auth_error')),
  remote_post_id TEXT,
  remote_post_url TEXT,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_publish_log_user_id
  ON publish_log(user_id);

CREATE INDEX IF NOT EXISTS idx_publish_log_article_id
  ON publish_log(article_id);

CREATE INDEX IF NOT EXISTS idx_publish_log_connection_id
  ON publish_log(connection_id);

-- RLS policies for publish_log
ALTER TABLE publish_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own publish logs"
  ON publish_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own publish logs"
  ON publish_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── updated_at trigger ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_platform_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_platform_connections_updated_at
  BEFORE UPDATE ON platform_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_connections_updated_at();
