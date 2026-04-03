# DASH-002: Dashboard API + Article Pipeline UI

> **Phase:** 1 | **Priority:** P1 | **Status:** NOT STARTED
> **Effort:** XL (16h) | **Type:** new
> **Backlog Items:** T2-03, T2-06, T2-08
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `dev_docs/services/dashboard-api.md` — full API spec with endpoints
3. `dev_docs/services/analytics.md` — analytics events and KPIs
4. `dev_docs/screens/02-dashboard-home.md` — dashboard home screen spec
5. `dev_docs/screens/03-article-pipeline.md` — article pipeline screen spec
6. `dev_docs/screens/04-article-detail.md` — article detail screen spec
7. `bridge/server.js` — existing server to extend
8. `supabase-setup.sql` — schema for new tables

## Objective
Build the Dashboard API endpoints in the bridge server and implement the Dashboard Home, Article Pipeline, and Article Detail screens. This is the core dashboard experience.

## File Plan

| Action | Path | What |
|--------|------|------|
| MODIFY | `bridge/server.js` | Add /api/* routes for articles, pipeline, analytics |
| MODIFY | `supabase-setup.sql` | Add articles, article_versions, pipeline_jobs, analytics_events tables |
| CREATE | `dashboard/app/(dashboard)/page.tsx` | Dashboard home with KPIs + chart |
| CREATE | `dashboard/app/(dashboard)/articles/page.tsx` | Article pipeline manager |
| CREATE | `dashboard/app/(dashboard)/articles/[id]/page.tsx` | Article detail |
| CREATE | `dashboard/components/kpi-card.tsx` | KPI metric card component |
| CREATE | `dashboard/components/article-table.tsx` | Article data table |
| CREATE | `dashboard/components/new-article-dialog.tsx` | New article generation dialog |
| CREATE | `dashboard/components/article-preview.tsx` | Article HTML preview iframe |

## Sub-tasks

### Sub-task 1: Database schema (~2h)
- Create migration SQL for new tables: articles, article_versions, pipeline_jobs, analytics_events
- Add RLS policies per dashboard-api.md spec
- Add indexes for performance
- Run against Supabase

### Sub-task 2: Dashboard API endpoints (~4h)
- Add article CRUD endpoints to bridge server: GET /api/articles, GET /api/articles/:id, POST /api/articles, etc.
- Add pipeline status endpoints: GET /api/pipeline/status, GET /api/pipeline/queue
- Add analytics endpoints: GET /api/analytics/overview, GET /api/analytics/generation
- All endpoints use existing auth middleware
- Response format: `{ success, data, meta? }`

### Sub-task 3: Dashboard Home screen (~4h)
- Implement per `02-dashboard-home.md` spec
- 4 KPI cards with real data from /api/analytics/overview
- Generation activity chart (recharts area chart)
- Recent articles list (5 most recent)
- Pipeline status card with "New Article" CTA
- 60-second auto-refresh

### Sub-task 4: Article Pipeline screen (~3h)
- Implement per `03-article-pipeline.md` spec
- Searchable, filterable, sortable DataTable
- Status badges, row actions (view, archive, delete)
- "New Article" dialog with topic, language, framework selection
- Pagination (server-side)

### Sub-task 5: Article Detail screen (~3h)
- Implement per `04-article-detail.md` spec
- Tabbed view: Preview, Metadata, Versions, Analytics
- Preview tab: sandboxed iframe rendering article HTML
- Versions tab: version history table with rollback
- Header card with article metadata

## Acceptance Criteria
- [ ] All /api/* endpoints return correct data with auth
- [ ] Dashboard home shows real KPIs, chart, and recent articles
- [ ] Article pipeline shows searchable, filterable article table
- [ ] Article detail shows preview, metadata, and version history
- [ ] "New Article" dialog creates pipeline_job in Supabase
- [ ] All screens handle loading, error, and empty states
- [ ] Analytics events recorded for article operations
- [ ] Pagination works with 100+ articles

## Dependencies
- Blocked by: DASH-001 (scaffold)
- Blocks: DASH-003 (admin panel)
