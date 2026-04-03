-- ============================================================
-- Migration 017: User Settings & Subscription Quota Columns
-- ============================================================
-- Part of Phase 3 Integration (Stream A1)
-- Creates user_settings table for persistent preferences
-- Adds quota columns to subscriptions table
-- ============================================================

-- 1. User preferences table (persisted, not in-memory)
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  preferred_language TEXT DEFAULT 'en',
  preferred_framework TEXT DEFAULT 'auto',     -- 'auto', 'next', 'react', 'vue', 'svelte', 'html'
  preferred_css TEXT DEFAULT 'auto',            -- 'auto', 'tailwind', 'inline', 'css-modules'
  default_domain TEXT,                          -- e.g., 'technology', 'sports'
  rtl_enabled BOOLEAN DEFAULT false,
  image_style TEXT DEFAULT 'realistic',
  max_images INTEGER DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies — user_settings (users can only access their own settings)
CREATE POLICY "Users can read own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Auto-update updated_at timestamp on user_settings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Add quota columns to subscriptions table
-- Plan defaults:
--   free:         4 articles/mo, 5 edits/day, 1 language, html only, no API keys
--   starter:      50 articles/mo, 30 edits/day, 3 languages, html+react+vue, no API keys
--   professional: 200 articles/mo, unlimited edits/day, all languages, all frameworks, API keys enabled
--   enterprise:   unlimited articles/mo, unlimited edits/day, all languages, all frameworks + custom, API keys enabled
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS articles_per_month INTEGER DEFAULT 4,
  ADD COLUMN IF NOT EXISTS edits_per_day INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS max_languages INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS allowed_frameworks TEXT[] DEFAULT ARRAY['html'],
  ADD COLUMN IF NOT EXISTS api_keys_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS quota_override JSONB;

-- 6. Index for fast settings lookup by user_id
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id
  ON public.user_settings (user_id);

-- ============================================================
-- Plan Defaults Reference (applied via application logic):
--
-- | Plan         | articles_per_month | edits_per_day | max_languages | allowed_frameworks              | api_keys_enabled |
-- |--------------|-------------------|---------------|---------------|----------------------------------|------------------|
-- | free         | 4                 | 5             | 1             | {html}                          | false            |
-- | starter      | 50                | 30            | 3             | {html,react,vue}                | false            |
-- | professional | 200               | -1 (unlimited)| 11            | {html,react,vue,next,svelte,astro,wordpress} | true  |
-- | enterprise   | -1 (unlimited)    | -1 (unlimited)| 11            | {html,react,vue,next,svelte,astro,wordpress,custom} | true  |
--
-- Note: -1 represents unlimited. Application logic should treat
-- articles_per_month = -1 or edits_per_day = -1 as no limit.
-- quota_override (JSONB) allows per-user overrides set by admin.
-- ============================================================
