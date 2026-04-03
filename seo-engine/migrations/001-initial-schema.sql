-- Migration 001: Initial Schema
-- Based on supabase-setup.sql — creates core tables for ChainIQ
-- Run this FIRST against a fresh Supabase project.
--
-- Rollback: DROP TABLE IF EXISTS usage_logs, subscriptions CASCADE;

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan TEXT DEFAULT 'free' NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'active', 'expired', 'revoked')),
  role TEXT DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  article_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own usage logs"
  ON usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage logs"
  ON usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
