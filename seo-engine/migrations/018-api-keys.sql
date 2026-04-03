-- ============================================================
-- Migration 018: API Keys Table
-- ============================================================
-- Part of Phase 3 Integration (Stream B1)
-- Creates api_keys table for encrypted API key storage
-- Admin-only access via RLS policy
-- ============================================================

-- 1. Encrypted API key storage
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

-- 2. Enable Row Level Security on api_keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policy — admin-only access (checks role in subscriptions table)
CREATE POLICY "Admins can manage api_keys"
  ON public.api_keys FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Auto-update updated_at timestamp on api_keys
-- Reuses the update_updated_at_column() function from migration 017
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Index for fast lookups by key_name and active status
CREATE INDEX IF NOT EXISTS idx_api_keys_name_active
  ON public.api_keys (key_name, is_active)
  WHERE is_active = true;

-- 6. Index for lookups by creator
CREATE INDEX IF NOT EXISTS idx_api_keys_created_by
  ON public.api_keys (created_by);

-- ============================================================
-- Supported Key Types:
--
-- | key_name             | Used By             | Purpose                |
-- |----------------------|---------------------|------------------------|
-- | gemini_api_key       | Research + image gen | Gemini MCP access      |
-- | custom_llm_key       | Future alternative  | Non-Claude LLM access  |
-- | webhook_signing_key  | Webhook system      | HMAC signing           |
--
-- Security Notes:
-- - key_value_encrypted stores AES-256-GCM encrypted data
-- - Encryption key derived from BRIDGE_ENCRYPTION_KEY env var
-- - key_hint shows only last 4 chars for identification
-- - Full key values are NEVER returned via API
-- - Only users with role = 'admin' in subscriptions can access
-- ============================================================
