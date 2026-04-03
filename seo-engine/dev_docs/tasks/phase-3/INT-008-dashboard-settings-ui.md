# INT-008: Dashboard Settings & Admin Quota UI

**Type:** UI_COMPONENT
**Effort:** L (12h)
**Priority:** P1
**Dependencies:** INT-002, INT-003
**Sprint:** S12

## Description

Enhance dashboard settings page with persistent user preferences and quota display. Add admin quota management panel with per-user overrides and usage analytics.

## Context Header

- `dashboard/src/app/(dashboard)/settings/page.tsx` — existing settings page
- `dashboard/src/app/(dashboard)/admin/page.tsx` — existing admin page
- `dashboard/src/lib/api.ts` — API client functions
- `dev_docs/phase-3-plan.md` — Streams A4 + A5 + B4

## Acceptance Criteria

### Settings UI Enhancement
- [ ] New "Generation Preferences" section: preferred language dropdown, framework selector, CSS strategy, image count slider (1-6), image style
- [ ] New "Quota Usage" section: visual progress bars for articles used/limit and edits used/limit
- [ ] "Project Detection Override" toggle: "Always use [framework]" vs auto-detect
- [ ] Settings persist to Supabase via `PUT /api/settings` (not localStorage)
- [ ] Loading/error/empty states implemented

### Admin Quota Management
- [ ] Per-user quota override panel: admin can set custom limits for specific users
- [ ] Plan editor: modify default limits for each plan tier (starter/professional/enterprise)
- [ ] Usage analytics table: which users are hitting limits, generation trends
- [ ] New admin endpoints consumed: `PUT /api/admin/plans/:userId`, `GET /api/admin/quota-stats`

### API Key Management UI
- [ ] "API Keys" tab in admin panel
- [ ] Key list with masked values (`gemini_api_key: ****a1b2`)
- [ ] "Add Key" dialog: key name, value, scope selector
- [ ] "Rotate" action: enter new value, confirmation dialog
- [ ] "Test" button: pings service to verify key works, shows result
- [ ] Status indicator: active/inactive badges

### Shared
- [ ] New `QuotaCard` component: shows plan limits with progress bars, "Upgrade" CTA for free/starter
- [ ] New `ApiKeyManager` component: CRUD UI for keys
- [ ] All new API functions added to `dashboard/src/lib/api.ts`
- [ ] Responsive layout (sm/md/lg breakpoints)
- [ ] Dark theme consistent with existing dashboard
