-- Migration: {{MIGRATION_NUMBER}}_{{migration_name}}
-- Description: {{MIGRATION_DESCRIPTION}}
-- See: dev_docs/specs/database/ for schema context
--
-- Copy this template when creating a new database migration.
-- Place at: migrations/{{MIGRATION_NUMBER}}_{{migration_name}}.sql
-- Apply with: psql or Supabase SQL editor
-- Rollback: See bottom of this file

-- ── Up Migration ────────────────────────────────────────────────────────────

BEGIN;

-- 1. Create table
CREATE TABLE IF NOT EXISTS {{table_name}} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Business columns
  -- name TEXT NOT NULL,
  -- status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
  -- metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes (always index user_id for RLS performance)
CREATE INDEX IF NOT EXISTS idx_{{table_name}}_user_id
  ON {{table_name}} (user_id);

-- Additional indexes for common query patterns:
-- CREATE INDEX IF NOT EXISTS idx_{{table_name}}_status
--   ON {{table_name}} (user_id, status);
-- CREATE INDEX IF NOT EXISTS idx_{{table_name}}_created
--   ON {{table_name}} (user_id, created_at DESC);

-- 3. RLS (Row Level Security) — MANDATORY for all ChainIQ tables
ALTER TABLE {{table_name}} ENABLE ROW LEVEL SECURITY;

-- Users can only see their own rows
CREATE POLICY "Users read own {{table_name}}"
  ON {{table_name}} FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own rows
CREATE POLICY "Users insert own {{table_name}}"
  ON {{table_name}} FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own rows
CREATE POLICY "Users update own {{table_name}}"
  ON {{table_name}} FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own rows
CREATE POLICY "Users delete own {{table_name}}"
  ON {{table_name}} FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Updated_at trigger (auto-set on UPDATE)
CREATE OR REPLACE FUNCTION update_{{table_name}}_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_{{table_name}}_updated_at
  BEFORE UPDATE ON {{table_name}}
  FOR EACH ROW
  EXECUTE FUNCTION update_{{table_name}}_updated_at();

COMMIT;

-- ── Down Migration (Rollback) ───────────────────────────────────────────────
-- Run this to undo the migration. CAUTION: destroys data.
--
-- DROP TRIGGER IF EXISTS trg_{{table_name}}_updated_at ON {{table_name}};
-- DROP FUNCTION IF EXISTS update_{{table_name}}_updated_at();
-- DROP TABLE IF EXISTS {{table_name}} CASCADE;
