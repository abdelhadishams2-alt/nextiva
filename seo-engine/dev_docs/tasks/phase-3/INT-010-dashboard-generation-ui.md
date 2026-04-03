# INT-010: Dashboard Generation UI

**Type:** UI_COMPONENT
**Effort:** M (6h)
**Priority:** P1
**Dependencies:** INT-009
**Sprint:** S12

## Description

Build the "Generate Article" page/modal in the dashboard that triggers the full pipeline and shows real-time progress via SSE.

## Context Header

- `dashboard/src/app/(dashboard)/articles/page.tsx` — existing articles page
- `dashboard/src/lib/api.ts` — API client
- `dashboard/src/components/sidebar.tsx` — navigation
- `dev_docs/phase-3-plan.md` — Stream D3

## Acceptance Criteria

- [ ] New page or modal accessible from articles page and sidebar: "Generate Article"
- [ ] Form fields: topic input (text), language selector (11 languages dropdown), framework selector (auto/next/vue/svelte/astro/wordpress/html), image count slider (1-6), domain hint (optional)
- [ ] Form validation: topic required (min 3 chars), all other fields have sensible defaults from user settings
- [ ] "Generate" button triggers `POST /api/generate`, transitions to progress view
- [ ] `GenerationProgress` component: step-by-step progress with animated phase descriptions, progress bar, estimated time
- [ ] SSE connection to `/api/queue/job/:id/progress` for real-time updates
- [ ] On complete: shows success state with link to generated article, "View Article" and "Generate Another" buttons
- [ ] On error: shows error message with "Retry" button
- [ ] Quota indicator visible: shows remaining articles before generating
- [ ] Loading/error states for initial form load
- [ ] Responsive layout (mobile-friendly form)
- [ ] Dark theme consistent with dashboard
- [ ] Sidebar updated with "Generate" nav item
