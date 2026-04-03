# POLISH-001: Queue System + Webhooks + Galleries + Accessibility

> **Phase:** 2 | **Priority:** P2 | **Status:** NOT STARTED
> **Effort:** XL (40h / 5 days) | **Type:** new
> **Backlog Items:** T3-01 through T3-12
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `dev_docs/enhancement-backlog.md` — Tier 3 items
3. `dev_docs/screens/08-blueprint-gallery.md` — blueprint gallery spec
4. `dev_docs/services/dashboard-api.md` — queue and webhook endpoints
5. `dev_docs/services/article-pipeline.md` — edit progress, SKILL.md decomposition
6. `bridge/server.js` — activeEdit mutex, edit handler
7. `agents/draft-writer.md` — edit UI CSS/JS (to extract)
8. `skills/article-engine/SKILL.md` — god file to decompose

## Objective
Complete the ChainIQ v1.0 feature set: article generation queue, webhook/event system, blueprint gallery UI, article gallery, edit progress indicator, edit overlay accessibility, SKILL.md decomposition, edit UI template extraction, user settings, database migrations, and documentation.

## Sub-tasks

### Sub-task 1: Article Generation Queue (T3-01) (~16h)
- Replace global `activeEdit` mutex with proper job queue
- Queue stored in `pipeline_jobs` table (Supabase)
- Support multiple queued articles, sequential processing
- Job states: queued → running → completed | failed | cancelled
- Dashboard shows queue status and position
- Cancel running job via admin API

### Sub-task 2: Webhook/Event System (T3-02) (~8h)
- Emit events on pipeline state changes (article created, completed, failed, edited)
- Webhook configuration: URL, events to subscribe, secret for HMAC verification
- POST payload: `{ event, timestamp, data, signature }`
- Retry failed webhooks 3 times with exponential backoff
- Dashboard: webhook management UI in settings

### Sub-task 3: Blueprint Gallery UI (T3-03) (~8h)
- Implement per `08-blueprint-gallery.md` screen spec
- Parse 193 blueprints from structural-component-registry.md
- Grid layout with search and category filtering
- Detail sheet with component specification
- Usage count from analytics data

### Sub-task 4: Edit UX Improvements (T3-05, T3-06) (~8h)
- **Progress indicator** (T3-05): Real-time status during section edits
  - Show: "Analyzing... → Rewriting... → Validating..." stages
  - Use SSE or polling against edit status endpoint
  - Estimated time remaining based on historical duration
- **Accessibility** (T3-06): ARIA attributes on edit overlay
  - Focus trap within overlay dialog
  - Escape key closes overlay
  - `aria-live` regions for status updates
  - `role="dialog"` and `aria-modal="true"`

### Sub-task 5: Architecture Cleanup (T3-07, T3-08) (~8h)
- **Decompose SKILL.md** (T3-07): Extract setup, auth, input modules into separate files
  - `skills/article-engine/modules/setup.md` — steps 1-4
  - `skills/article-engine/modules/pipeline.md` — steps 5-10
  - `skills/article-engine/modules/config.md` — configuration handling
  - Main SKILL.md becomes orchestrator that imports modules
- **Extract edit UI template** (T3-08): Move CSS/JS from draft-writer.md to file
  - `templates/edit-ui.css` — edit overlay styles
  - `templates/edit-ui.js` — edit overlay JavaScript
  - draft-writer.md references external files instead of inline

### Sub-task 6: Remaining Items (T3-09 through T3-12) (~8h)
- **User settings page** (T3-09): language preference, theme, default domain
- **Database migration strategy** (T3-10): versioned SQL files, rollback support
- **SECURITY.md** (T3-11): anon key rationale, RLS model, key rotation procedure
- **TROUBLESHOOTING.md** (T3-12): 8 common failure scenarios with resolution

## Acceptance Criteria
- [ ] Multiple articles can be queued and processed sequentially
- [ ] Webhooks fire on pipeline state changes with HMAC signatures
- [ ] Blueprint gallery displays 193 components with search and filter
- [ ] Edit progress shows real-time stage updates during section edits
- [ ] Edit overlay has full keyboard accessibility (focus trap, Escape, ARIA)
- [ ] SKILL.md decomposed into <500 line modules
- [ ] Edit UI CSS/JS extracted to external template files
- [ ] User settings page saves language/theme preferences
- [ ] Database migration files versioned with rollback capability
- [ ] SECURITY.md and TROUBLESHOOTING.md complete

## Dependencies
- Blocked by: All Phase 1 tasks complete
- Blocks: Nothing (this is the final phase)
