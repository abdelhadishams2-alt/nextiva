-- Migration 006: Publisher Hub — Plugin Instances + Remote Config
-- Date: 2026-03-27
-- Purpose: Track plugin installations that phone home, and store admin-pushed config for plugins to poll

-- ── Plugin Instances ─────────────────────────────────────────
-- Each plugin installation registers itself on startup via heartbeat.
-- Tracks which users run the plugin, from which projects, with what framework.

CREATE TABLE IF NOT EXISTS public.plugin_instances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  instance_id TEXT NOT NULL UNIQUE,
  project_name TEXT,
  framework TEXT,
  plugin_version TEXT,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plugin_instances_user_id ON public.plugin_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_plugin_instances_last_seen ON public.plugin_instances(last_seen_at);

-- RLS: users can read/upsert their own instances
ALTER TABLE public.plugin_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own plugin instances"
  ON public.plugin_instances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plugin instances"
  ON public.plugin_instances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plugin instances"
  ON public.plugin_instances FOR UPDATE
  USING (auth.uid() = user_id);

-- ── Plugin Config (Remote Configuration) ─────────────────────
-- Admin pushes config key-value pairs. Plugins poll on startup.
-- Examples: feature_flags, max_concurrent_edits, announcement_banner, etc.

CREATE TABLE IF NOT EXISTS public.plugin_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plugin_config_key ON public.plugin_config(config_key);

-- RLS: anyone authenticated can read config, only admins write (via service_role)
ALTER TABLE public.plugin_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read plugin config"
  ON public.plugin_config FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admins write via service_role key (bypasses RLS), no INSERT/UPDATE policy needed for regular users.

-- ── Rollback ─────────────────────────────────────────────────
-- DROP TABLE IF EXISTS public.plugin_config;
-- DROP TABLE IF EXISTS public.plugin_instances;
