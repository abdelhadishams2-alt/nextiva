-- ============================================================
-- Migration 007: Client Connections & OAuth Infrastructure
-- ============================================================
-- Tables for Google OAuth2 connections, PKCE state management,
-- ingestion job tracking, and third-party API response caching.
-- Part of Phase 5: Data Integration Layer.
-- ============================================================

-- 0. Idempotent trigger function for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. client_connections — OAuth provider connections per user
-- ============================================================
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
CREATE INDEX idx_connections_status ON client_connections (status) WHERE status != 'connected';

ALTER TABLE client_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own connections" ON client_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own connections" ON client_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own connections" ON client_connections FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own connections" ON client_connections FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_client_connections_updated_at BEFORE UPDATE ON client_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. oauth_states — PKCE state for OAuth flows (no RLS)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.oauth_states (
  state         TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_verifier TEXT NOT NULL,
  provider      TEXT NOT NULL CHECK (provider IN ('google')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_oauth_states_created ON oauth_states (created_at);

-- ============================================================
-- 3. ingestion_jobs — data ingestion job tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ingestion_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source        TEXT NOT NULL CHECK (source IN ('gsc', 'ga4', 'semrush', 'ahrefs', 'trends', 'crawler', 'purge')),
  status        TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  trigger_type  TEXT NOT NULL DEFAULT 'scheduled' CHECK (trigger_type IN ('scheduled', 'manual', 'retry')),
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

CREATE POLICY "Users read own jobs" ON ingestion_jobs FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- 4. api_cache — third-party API response cache (no RLS)
-- ============================================================
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
