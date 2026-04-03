/**
 * Migration SQL Validation Tests
 *
 * Validates that migration files and supabase-setup.sql contain
 * the correct schema definitions, follow conventions, and satisfy
 * all acceptance criteria for INT-001.
 *
 * Uses node:test (zero dependencies).
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SETUP_SQL = path.join(ROOT, 'supabase-setup.sql');
const MIGRATION_017 = path.join(ROOT, 'migrations', '017-user-settings.sql');
const MIGRATION_018 = path.join(ROOT, 'migrations', '018-api-keys.sql');

// Helper: read file contents
function readSQL(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

describe('Migration files exist', () => {
  it('017-user-settings.sql exists', () => {
    assert.ok(fs.existsSync(MIGRATION_017), 'migrations/017-user-settings.sql should exist');
  });

  it('018-api-keys.sql exists', () => {
    assert.ok(fs.existsSync(MIGRATION_018), 'migrations/018-api-keys.sql should exist');
  });
});

describe('017-user-settings.sql — user_settings table', () => {
  const sql = readSQL(MIGRATION_017);

  it('uses CREATE TABLE IF NOT EXISTS for idempotent migration', () => {
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.user_settings/i);
  });

  it('has user_id column as FK to auth.users', () => {
    assert.match(sql, /user_id\s+UUID\s+REFERENCES\s+auth\.users\(id\)/i);
  });

  it('has preferred_language column', () => {
    assert.match(sql, /preferred_language\s+TEXT/i);
  });

  it('has preferred_framework column', () => {
    assert.match(sql, /preferred_framework\s+TEXT/i);
  });

  it('has preferred_css column', () => {
    assert.match(sql, /preferred_css\s+TEXT/i);
  });

  it('has default_domain column', () => {
    assert.match(sql, /default_domain\s+TEXT/i);
  });

  it('has rtl_enabled column', () => {
    assert.match(sql, /rtl_enabled\s+BOOLEAN/i);
  });

  it('has image_style column', () => {
    assert.match(sql, /image_style\s+TEXT/i);
  });

  it('has max_images column', () => {
    assert.match(sql, /max_images\s+INTEGER/i);
  });

  it('has created_at column', () => {
    assert.match(sql, /created_at\s+TIMESTAMPTZ/i);
  });

  it('has updated_at column', () => {
    assert.match(sql, /updated_at\s+TIMESTAMPTZ/i);
  });

  it('enables RLS on user_settings', () => {
    assert.match(sql, /ALTER TABLE public\.user_settings ENABLE ROW LEVEL SECURITY/i);
  });

  it('has SELECT RLS policy for own settings', () => {
    assert.match(sql, /CREATE POLICY.*read own settings.*ON public\.user_settings\s+FOR SELECT/is);
  });

  it('has UPDATE RLS policy for own settings', () => {
    assert.match(sql, /CREATE POLICY.*update own settings.*ON public\.user_settings\s+FOR UPDATE/is);
  });

  it('has INSERT RLS policy for own settings', () => {
    assert.match(sql, /CREATE POLICY.*insert own settings.*ON public\.user_settings\s+FOR INSERT/is);
  });

  it('all RLS policies use auth.uid() = user_id', () => {
    // Match USING/WITH CHECK clauses that contain auth.uid() = user_id
    assert.match(sql, /FOR SELECT\s+USING\s*\(\s*auth\.uid\(\)\s*=\s*user_id\s*\)/is);
    assert.match(sql, /FOR UPDATE\s+USING\s*\(\s*auth\.uid\(\)\s*=\s*user_id\s*\)/is);
    assert.match(sql, /WITH CHECK\s*\(\s*auth\.uid\(\)\s*=\s*user_id\s*\)/is);
  });
});

describe('017-user-settings.sql — subscription quota columns', () => {
  const sql = readSQL(MIGRATION_017);

  it('alters subscriptions table (not creates)', () => {
    assert.match(sql, /ALTER TABLE public\.subscriptions/i);
  });

  it('adds articles_per_month column', () => {
    assert.match(sql, /articles_per_month\s+INTEGER/i);
  });

  it('adds edits_per_day column', () => {
    assert.match(sql, /edits_per_day\s+INTEGER/i);
  });

  it('adds max_languages column', () => {
    assert.match(sql, /max_languages\s+INTEGER/i);
  });

  it('adds allowed_frameworks column as TEXT[]', () => {
    assert.match(sql, /allowed_frameworks\s+TEXT\[\]/i);
  });

  it('adds api_keys_enabled column', () => {
    assert.match(sql, /api_keys_enabled\s+BOOLEAN/i);
  });

  it('adds quota_override column as JSONB', () => {
    assert.match(sql, /quota_override\s+JSONB/i);
  });

  it('uses ADD COLUMN IF NOT EXISTS for idempotent migration', () => {
    assert.match(sql, /ADD COLUMN IF NOT EXISTS articles_per_month/i);
    assert.match(sql, /ADD COLUMN IF NOT EXISTS edits_per_day/i);
    assert.match(sql, /ADD COLUMN IF NOT EXISTS max_languages/i);
    assert.match(sql, /ADD COLUMN IF NOT EXISTS allowed_frameworks/i);
    assert.match(sql, /ADD COLUMN IF NOT EXISTS api_keys_enabled/i);
    assert.match(sql, /ADD COLUMN IF NOT EXISTS quota_override/i);
  });
});

describe('017-user-settings.sql — plan defaults documented', () => {
  const sql = readSQL(MIGRATION_017);

  it('documents free plan (4 articles/mo)', () => {
    assert.match(sql, /free.*4/i);
  });

  it('documents starter plan (50 articles/mo)', () => {
    assert.match(sql, /starter.*50/i);
  });

  it('documents professional plan (200 articles/mo)', () => {
    assert.match(sql, /professional.*200/i);
  });

  it('documents enterprise plan (unlimited)', () => {
    assert.match(sql, /enterprise.*unlimited/i);
  });
});

describe('018-api-keys.sql — api_keys table', () => {
  const sql = readSQL(MIGRATION_018);

  it('uses CREATE TABLE IF NOT EXISTS for idempotent migration', () => {
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.api_keys/i);
  });

  it('has id column as UUID primary key', () => {
    assert.match(sql, /id\s+UUID\s+DEFAULT\s+gen_random_uuid\(\)\s+PRIMARY KEY/i);
  });

  it('has key_name column', () => {
    assert.match(sql, /key_name\s+TEXT\s+NOT NULL/i);
  });

  it('has key_value_encrypted column', () => {
    assert.match(sql, /key_value_encrypted\s+TEXT\s+NOT NULL/i);
  });

  it('has key_hint column', () => {
    assert.match(sql, /key_hint\s+TEXT/i);
  });

  it('has scope column', () => {
    assert.match(sql, /scope\s+TEXT\s+DEFAULT\s+'global'/i);
  });

  it('has created_by column as FK to auth.users', () => {
    assert.match(sql, /created_by\s+UUID\s+REFERENCES\s+auth\.users\(id\)/i);
  });

  it('has is_active column', () => {
    assert.match(sql, /is_active\s+BOOLEAN\s+DEFAULT\s+true/i);
  });

  it('has created_at column', () => {
    assert.match(sql, /created_at\s+TIMESTAMPTZ/i);
  });

  it('has updated_at column', () => {
    assert.match(sql, /updated_at\s+TIMESTAMPTZ/i);
  });

  it('enables RLS on api_keys', () => {
    assert.match(sql, /ALTER TABLE public\.api_keys ENABLE ROW LEVEL SECURITY/i);
  });

  it('has admin-only RLS policy', () => {
    assert.match(sql, /CREATE POLICY.*ON public\.api_keys\s+FOR ALL/is);
  });

  it('admin policy checks subscriptions role', () => {
    assert.match(sql, /SELECT 1 FROM public\.subscriptions.*role\s*=\s*'admin'/is);
  });
});

describe('supabase-setup.sql — append-only integrity', () => {
  const sql = readSQL(SETUP_SQL);

  it('still contains original subscriptions table', () => {
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.subscriptions/i);
  });

  it('still contains original usage_logs table', () => {
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.usage_logs/i);
  });

  it('still contains original handle_new_user function', () => {
    assert.match(sql, /CREATE OR REPLACE FUNCTION public\.handle_new_user\(\)/i);
  });

  it('still contains original RLS policies', () => {
    assert.match(sql, /Users can read own subscription/i);
    assert.match(sql, /Users can insert own usage/i);
    assert.match(sql, /Users can read own usage/i);
  });

  it('now contains user_settings table', () => {
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.user_settings/i);
  });

  it('now contains api_keys table', () => {
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.api_keys/i);
  });

  it('now contains subscription quota ALTER TABLE', () => {
    assert.match(sql, /ALTER TABLE public\.subscriptions\s+ADD COLUMN IF NOT EXISTS articles_per_month/i);
  });

  it('now contains user_settings RLS policies', () => {
    assert.match(sql, /Users can read own settings/i);
    assert.match(sql, /Users can update own settings/i);
    assert.match(sql, /Users can insert own settings/i);
  });

  it('now contains api_keys admin RLS policy', () => {
    assert.match(sql, /Admins can manage api_keys/i);
  });

  it('original content appears before new content (append-only)', () => {
    const origIdx = sql.indexOf('CREATE TABLE IF NOT EXISTS public.subscriptions');
    const newIdx = sql.indexOf('CREATE TABLE IF NOT EXISTS public.user_settings');
    assert.ok(origIdx < newIdx, 'New tables should be appended after original content');
  });
});
