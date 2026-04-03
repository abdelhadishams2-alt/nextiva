# INT-002: Settings Sync & Quota Engine

**Type:** API
**Effort:** L (7h)
**Priority:** P0
**Dependencies:** INT-001
**Sprint:** S12

## Description

Replace in-memory bridge server settings with Supabase-backed persistence. Add server-side quota enforcement that replaces the plugin's local `.usage.json` approach.

## Context Header

- `bridge/server.js` — existing endpoints to modify
- `bridge/supabase-client.js` — add new query functions
- `skills/article-engine/SKILL.md` — Step 0.5 quota check to modify
- `dev_docs/phase-3-plan.md` — Streams A2 + A3

## Acceptance Criteria

- [ ] `GET /api/settings` reads from `user_settings` table (creates default row if missing via upsert)
- [ ] `PUT /api/settings` writes to `user_settings` table with plan-limit validation
- [ ] `GET /api/quota` returns current usage vs plan limits: articles (used/limit/remaining), edits_today, languages allowed, frameworks allowed
- [ ] New `supabase-client.js` functions: `getUserSettings(userId)`, `upsertUserSettings(userId, settings)`, `getUserQuota(userId)`, `checkQuota(userId, action)`
- [ ] `checkQuota` returns `{ allowed: bool, reason: string }` — uses `SELECT ... FOR UPDATE` to prevent race conditions
- [ ] SKILL.md Step 0.5 updated: calls `GET /api/quota` instead of local `.usage.json`; falls back to local file if bridge unavailable (offline mode)
- [ ] SKILL.md Step 5 updated: merges auto-config detection with user_settings from bridge; user preference overrides auto-detection when not set to 'auto'
- [ ] Tests: quota enforcement (at limit, over limit, offline fallback), settings CRUD, plan validation
- [ ] All new endpoints authenticated (verifyAuth middleware)
- [ ] Rate limiting applied to quota-check endpoint
