# INT-001: Supabase Schema Extensions

**Type:** DATABASE
**Effort:** M (3h)
**Priority:** P0
**Dependencies:** None
**Sprint:** S12

## Description

Add Supabase schema for user settings persistence and API key management. This creates the database foundation for Phase 3 integration work.

## Context Header

- `supabase-setup.sql` — existing schema (PROTECTED — append only)
- `dev_docs/phase-3-plan.md` — full integration plan (Streams A1 + B1)
- `bridge/supabase-client.js` — existing Supabase client

## Acceptance Criteria

- [ ] `user_settings` table created with columns: user_id (FK), preferred_language, preferred_framework, preferred_css, default_domain, rtl_enabled, image_style, max_images, created_at, updated_at
- [ ] `subscriptions` table altered with quota columns: articles_per_month, edits_per_day, max_languages, allowed_frameworks (TEXT[]), api_keys_enabled, quota_override (JSONB)
- [ ] `api_keys` table created with columns: id, key_name, key_value_encrypted, key_hint, scope, created_by (FK), is_active, created_at, updated_at
- [ ] RLS policies on `user_settings`: users read/update/insert own settings only
- [ ] RLS policies on `api_keys`: admin-only access (via subscriptions role check)
- [ ] All tables use `IF NOT EXISTS` for idempotent migrations
- [ ] Migration files created: `migrations/017-user-settings.sql` and `migrations/018-api-keys.sql`
- [ ] `supabase-setup.sql` updated with new tables appended (PROTECTED file — append only, do not modify existing content)
- [ ] Plan defaults documented: free (4 articles/mo), starter (50), professional (200), enterprise (unlimited)
