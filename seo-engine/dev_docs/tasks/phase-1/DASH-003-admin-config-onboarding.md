# DASH-003: Admin Panel + Config + Onboarding

> **Phase:** 1 | **Priority:** P1 | **Status:** NOT STARTED
> **Effort:** XL (16h) | **Type:** new
> **Backlog Items:** T2-04, T2-05, T2-09, T2-10
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `dev_docs/screens/05-user-management.md` — user management screen spec
3. `dev_docs/screens/06-plugin-configuration.md` — settings screen spec
4. `dev_docs/screens/07-onboarding-wizard.md` — onboarding wizard spec
5. `dev_docs/services/admin-users.md` — admin service spec with GDPR cleanup
6. `dev_docs/services/dashboard-api.md` — config endpoints
7. `bridge/server.js` — existing admin endpoints to extend
8. `bridge/supabase-client.js` — admin operations

## Objective
Build the admin user management panel, subscription management, plugin configuration settings, and the onboarding wizard. These complete the dashboard's administrative capabilities.

## File Plan

| Action | Path | What |
|--------|------|------|
| MODIFY | `bridge/server.js` | Extend /admin/* and add /api/users/*, /api/config/* endpoints |
| CREATE | `dashboard/app/(dashboard)/admin/users/page.tsx` | User management table |
| CREATE | `dashboard/app/(dashboard)/settings/page.tsx` | Plugin configuration tabs |
| CREATE | `dashboard/app/(auth)/onboarding/page.tsx` | 4-step setup wizard |
| CREATE | `dashboard/components/user-detail-sheet.tsx` | User detail slide-out |
| CREATE | `dashboard/components/approve-dialog.tsx` | Approve user with plan selection |
| CREATE | `dashboard/components/onboarding-stepper.tsx` | 4-step progress stepper |

## Sub-tasks

### Sub-task 1: Admin API endpoints (~3h)
- Extend /admin/* endpoints: add pagination, search, filter to GET /admin/users
- Add new endpoints: POST /api/users/:id/upgrade, GET /api/users/:id/quota
- Add GET /api/config, PUT /api/config for plugin settings
- GDPR cleanup on DELETE: cascade to articles, versions, analytics, usage_logs

### Sub-task 2: User Management screen (~4h)
- DataTable with users: name, email, plan, status, actions
- Inline approve/reject buttons for pending users
- Action menu for active users: change plan, revoke, delete
- User detail sheet (slide-out) with quota usage bar
- Approve dialog with plan selection
- Delete confirmation with GDPR warning

### Sub-task 3: Plugin Configuration screen (~4h)
- 4 tabbed sections: General, API Keys, Agents, Advanced
- Form validation per `06-plugin-configuration.md` spec
- "Unsaved changes" tracking with navigation guard
- API keys tab: display-only masked values with status indicators
- Save with loading state and success/error toast

### Sub-task 4: Onboarding Wizard (~5h)
- 4-step wizard per `07-onboarding-wizard.md` spec
- Step 1: Connection verification (Supabase URL, keys, bridge server)
- Step 2: Configure defaults (language, framework, images)
- Step 3: Test article generation (optional, skippable)
- Step 4: Completion with quick links
- Resume from last completed step on page refresh
- Set `onboarding_complete` flag in user metadata

## Acceptance Criteria
- [ ] Admin can view, search, filter, and sort all users
- [ ] Admin can approve pending users with plan selection
- [ ] Admin can revoke, upgrade, downgrade, and delete users
- [ ] User deletion cascades to all related data (GDPR)
- [ ] Plugin configuration saves and loads correctly
- [ ] Unsaved changes trigger navigation warning
- [ ] Onboarding wizard completes all 4 steps
- [ ] Onboarding wizard only shows on first admin login
- [ ] Non-admin users cannot access /admin/* routes

## Dependencies
- Blocked by: DASH-002 (API endpoints)
- Blocks: Phase 2 polish tasks
