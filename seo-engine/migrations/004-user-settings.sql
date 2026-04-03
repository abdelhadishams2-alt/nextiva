-- ============================================================
-- Migration 004: User Settings + Subscription Quotas
-- ============================================================
-- Adds persistent user preferences and plan-based generation quotas.
-- Run AFTER 001-003 migrations.
-- ============================================================

-- 1. User preferences table (persistent, replaces in-memory settings)
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  preferred_language TEXT DEFAULT 'en',
  preferred_framework TEXT DEFAULT 'auto',
  preferred_css TEXT DEFAULT 'auto',
  default_domain TEXT,
  rtl_enabled BOOLEAN DEFAULT false,
  image_style TEXT DEFAULT 'realistic',
  max_images INTEGER DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS for user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Add quota columns to subscriptions table
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS articles_per_month INTEGER DEFAULT 4,
  ADD COLUMN IF NOT EXISTS edits_per_day INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS max_languages INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS allowed_frameworks TEXT[] DEFAULT ARRAY['html'],
  ADD COLUMN IF NOT EXISTS api_keys_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS quota_override JSONB;

-- 4. Set plan defaults for existing subscriptions
UPDATE public.subscriptions SET
  articles_per_month = CASE plan
    WHEN 'free' THEN 4
    WHEN 'starter' THEN 50
    WHEN 'professional' THEN 200
    WHEN 'enterprise' THEN -1  -- unlimited
    ELSE 4
  END,
  edits_per_day = CASE plan
    WHEN 'free' THEN 5
    WHEN 'starter' THEN 30
    WHEN 'professional' THEN -1
    WHEN 'enterprise' THEN -1
    ELSE 5
  END,
  max_languages = CASE plan
    WHEN 'free' THEN 1
    WHEN 'starter' THEN 3
    WHEN 'professional' THEN 11
    WHEN 'enterprise' THEN 11
    ELSE 1
  END,
  allowed_frameworks = CASE plan
    WHEN 'free' THEN ARRAY['html']
    WHEN 'starter' THEN ARRAY['html', 'react', 'vue']
    WHEN 'professional' THEN ARRAY['html', 'react', 'vue', 'next', 'svelte', 'astro', 'wordpress']
    WHEN 'enterprise' THEN ARRAY['html', 'react', 'vue', 'next', 'svelte', 'astro', 'wordpress']
    ELSE ARRAY['html']
  END,
  api_keys_enabled = CASE plan
    WHEN 'professional' THEN true
    WHEN 'enterprise' THEN true
    ELSE false
  END
WHERE articles_per_month IS NULL;

-- 5. Index for settings lookup
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id
  ON public.user_settings (user_id);

-- 6. Count articles this month (for quota checks)
CREATE INDEX IF NOT EXISTS idx_usage_logs_monthly
  ON public.usage_logs (user_id, action, created_at DESC);
