-- Migration 003: Webhook Configuration Table
-- Stores webhook endpoint configurations for event notifications.
--
-- Rollback: DROP TABLE IF EXISTS webhook_configs CASCADE;

CREATE TABLE IF NOT EXISTS webhook_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret TEXT NOT NULL,
  active BOOLEAN DEFAULT true NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Only admins can manage webhooks (service_role access)
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_webhook_configs_active ON webhook_configs(active) WHERE active = true;
