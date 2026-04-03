-- ============================================================
-- Migration 005: Encrypted API Key Storage
-- ============================================================
-- Stores API keys (Gemini, custom LLM) encrypted at rest.
-- Only admins can access via service_role key.
-- ============================================================

-- 1. API keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_name TEXT NOT NULL,
  key_value_encrypted TEXT NOT NULL,
  key_hint TEXT,
  scope TEXT DEFAULT 'global',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS — admins only via service_role
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin access only"
  ON public.api_keys FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Unique constraint — one active key per name+scope
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_active
  ON public.api_keys (key_name, scope)
  WHERE is_active = true;

-- 4. Index for key lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_name_active
  ON public.api_keys (key_name, is_active);
