-- ============================================================
-- Article Engine — Supabase Setup (Complete)
-- ============================================================
-- Run this SQL in your Supabase dashboard:
--   Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- 1. Subscriptions table (includes role column for admin access)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'pending',
  role TEXT NOT NULL DEFAULT 'user',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Usage logs table
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  article_file TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies — Subscriptions
CREATE POLICY "Users can read own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- 5. RLS Policies — Usage logs
CREATE POLICY "Users can insert own usage"
  ON public.usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own usage"
  ON public.usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- 6. Auto-create subscription when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status, role)
  VALUES (NEW.id, 'free', 'pending', 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Index for fast quota checks (count today's usage)
CREATE INDEX idx_usage_logs_user_date
  ON public.usage_logs (user_id, created_at DESC);

-- ============================================================
-- IMPORTANT: After running this SQL, set yourself as admin:
--
--   1. Go to Authentication → Users → find your user → copy your user ID
--   2. Go to SQL Editor and run:
--
--      UPDATE public.subscriptions
--      SET role = 'admin', status = 'active'
--      WHERE user_id = 'YOUR_USER_ID_HERE';
--
--   Replace YOUR_USER_ID_HERE with your actual user ID.
-- ============================================================

-- ============================================================
-- Phase 3: User Settings & Quota Management (Migration 017)
-- ============================================================

-- 8. User preferences table (persisted settings)
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

-- 9. Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies — user_settings
CREATE POLICY "Users can read own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 11. Auto-update updated_at trigger function
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

-- 12. Add quota columns to subscriptions table
-- Plan defaults:
--   free:         4 articles/mo, 5 edits/day, 1 language, html only, no API keys
--   starter:      50 articles/mo, 30 edits/day, 3 languages, html+react+vue, no API keys
--   professional: 200 articles/mo, unlimited edits, all languages, all frameworks, API keys
--   enterprise:   unlimited articles/mo, unlimited edits, all languages, all + custom, API keys
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS articles_per_month INTEGER DEFAULT 4,
  ADD COLUMN IF NOT EXISTS edits_per_day INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS max_languages INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS allowed_frameworks TEXT[] DEFAULT ARRAY['html'],
  ADD COLUMN IF NOT EXISTS api_keys_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS quota_override JSONB;

-- 13. Index for fast settings lookup
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id
  ON public.user_settings (user_id);

-- ============================================================
-- Phase 3: API Key Management (Migration 018)
-- ============================================================

-- 14. Encrypted API key storage
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_name TEXT NOT NULL,                    -- 'gemini', 'custom_llm', 'webhook_signing', etc.
  key_value_encrypted TEXT NOT NULL,          -- AES-256-GCM encrypted value
  key_hint TEXT,                              -- last 4 chars for display (e.g., '****a1b2')
  scope TEXT DEFAULT 'global',               -- 'global' or specific user_id
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Enable RLS on api_keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- 16. RLS Policy — admin-only access
CREATE POLICY "Admins can manage api_keys"
  ON public.api_keys FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 17. Auto-update updated_at on api_keys
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 18. Indexes for api_keys
CREATE INDEX IF NOT EXISTS idx_api_keys_name_active
  ON public.api_keys (key_name, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_api_keys_created_by
  ON public.api_keys (created_by);
