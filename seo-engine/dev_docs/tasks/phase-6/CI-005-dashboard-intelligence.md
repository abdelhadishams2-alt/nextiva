# CI-005: Dashboard — Intelligence & Opportunities Pages

> **Phase:** 6 | **Priority:** P1 | **Status:** NOT STARTED
> **Effort:** L (12h) | **Type:** feature
> **Sprint:** 6 (Weeks 11-12)
> **Depends On:** CI-001 (decay endpoint), CI-002 (gaps/cannibalization endpoints), CI-003 (recommendations endpoint), DI-006 (dashboard navigation pattern)
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `dev_docs/services/content-intelligence.md` — API endpoint response formats, recommendation structure, decay detail format
3. `dashboard/` — existing Next.js 16 dashboard structure, page patterns, component conventions
4. `dashboard/src/lib/api.ts` — existing API client methods (and new methods added in DI-006)
5. `dashboard/src/components/ui/` — existing shadcn/ui (base-ui) components
6. `dashboard/src/app/inventory/page.tsx` — Content Inventory page (built in DI-006) for pattern reference

## Objective
Build the Opportunities dashboard page at `/opportunities` with four tabs: Recommendations, Keyword Gaps, Cannibalization, and Decay Alerts. Display recommendation cards with scores, types, and call-to-action buttons. Show cannibalization conflict groups with resolution actions. Add sidebar navigation and all required API client methods.

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `dashboard/src/app/opportunities/page.tsx` | Opportunities page with 4-tab layout |
| CREATE | `dashboard/src/components/opportunities/recommendation-card.tsx` | Scored recommendation card with CTA |
| CREATE | `dashboard/src/components/opportunities/gap-table.tsx` | Keyword gaps data table |
| CREATE | `dashboard/src/components/opportunities/cannibalization-group.tsx` | Cannibalization conflict group with resolution UI |
| CREATE | `dashboard/src/components/opportunities/decay-alert.tsx` | Decay alert card with trend sparkline |
| CREATE | `dashboard/src/components/opportunities/opportunity-filters.tsx` | Shared filter bar for all tabs |
| CREATE | `dashboard/src/components/opportunities/score-badge.tsx` | Priority score visual badge (0-100, color-coded) |
| CREATE | `dashboard/src/components/opportunities/run-analysis-dialog.tsx` | Dialog to trigger full intelligence analysis |
| MODIFY | `dashboard/src/lib/api.ts` | Add API client methods for intelligence endpoints |
| MODIFY | `dashboard/src/components/layout/sidebar.tsx` | Add Opportunities nav item |

## Sub-tasks

### Sub-task 1: API client methods (~2h)
- Add methods to `dashboard/src/lib/api.ts`:
  - `getRecommendations(params)` — `GET /api/intelligence/recommendations?type=&status=&min_score=&sort=&page=&per_page=`
  - `getRecommendation(id)` — `GET /api/intelligence/recommendations/:id`
  - `updateRecommendation(id, data)` — `PATCH /api/intelligence/recommendations/:id`
  - `executeRecommendation(id)` — `POST /api/intelligence/recommendations/:id/execute`
  - `getDecayAlerts(params)` — `GET /api/intelligence/decay?severity=&sort=&page=&per_page=`
  - `getDecayDetail(contentId)` — `GET /api/intelligence/decay/:contentId`
  - `getKeywordGaps(params)` — `GET /api/intelligence/gaps?min_impressions=&sort=&page=&per_page=`
  - `getCompetitors()` — `GET /api/intelligence/gaps/competitors`
  - `getCannibalization(params)` — `GET /api/intelligence/cannibalization?sort=&page=&per_page=`
  - `resolveCannibalization(id, strategy)` — `POST /api/intelligence/cannibalization/:id/resolve`
  - `runAnalysis(data)` — `POST /api/intelligence/run`
  - `getAnalysisRun(runId)` — `GET /api/intelligence/run/:runId`
- All methods typed with TypeScript interfaces matching API response shapes

### Sub-task 2: Opportunities page with tab layout (~2h)
- Create page at `dashboard/src/app/opportunities/page.tsx`
- **Layout:** Header with "Content Opportunities" title, "Run Analysis" button (opens dialog), summary stats bar, tab navigation, tab content area
- **Summary stats bar:** Total open opportunities, average score, top opportunity type breakdown (e.g., "12 gaps, 7 decay, 3 cannibalization")
- **Tab navigation** — 4 tabs using existing shadcn Tabs component:
  1. **Recommendations** (default) — shows scored recommendation cards
  2. **Keyword Gaps** — shows gap opportunities table
  3. **Cannibalization** — shows conflict groups
  4. **Decay Alerts** — shows decay alert cards
- Each tab maintains its own pagination and filter state
- URL-synced tab: `/opportunities?tab=gaps` allows direct linking to specific tabs

### Sub-task 3: Recommendations tab (~3h)
- **Recommendation card** (`recommendation-card.tsx`):
  - **Header:** Keyword text (large), opportunity type badge (gap/decay/cannibalization/trending/seasonal), score badge
  - **Score badge** (`score-badge.tsx`): Circular or pill badge showing 0-100 score. Color: green (80+), yellow (60-79), orange (40-59), red (<40). Used across all tabs.
  - **Body:** Summary text (1-2 sentences from API), key metrics row (impressions, clicks, current position)
  - **Recommended action badge:** create_new (blue), update_existing (yellow), merge (purple), redirect (orange)
  - **Target URL:** If `target_url` is set, show as a clickable link
  - **Footer:** Two action buttons:
    - "Accept & Generate" — calls `executeRecommendation(id)`, shows loading state, navigates to pipeline page on success
    - "Dismiss" — calls `updateRecommendation(id, { status: 'dismissed' })`, removes card from view with animation
  - **Expand:** Clicking card body expands to show full `analysis_metadata` evidence (scoring breakdown, competitor data, trend data)
- **Filter bar** (`opportunity-filters.tsx`):
  - Type dropdown: All, Gap, Decay, Cannibalization, Trending, Seasonal
  - Status dropdown: Open, Accepted, Dismissed, Completed
  - Minimum score slider: 0-100 (default 0)
  - Sort: Score (high-low), Score (low-high), Newest, Most Impressions
- Cards displayed in a responsive grid (2 columns on desktop, 1 on mobile)
- Pagination at bottom

### Sub-task 4: Keyword Gaps tab (~2h)
- **Gap table** (`gap-table.tsx`):
  - Columns: Keyword, Monthly Impressions, Current Position (or "Not ranking"), Score, Competitors, Recommended Action, Status
  - "Not ranking" shown in italic gray for keywords with no current position
  - Competitors column: shows count with tooltip listing competitor URLs
  - Score column: uses `score-badge.tsx` component
  - Row action: "Create Article" button → calls `executeRecommendation(id)` for gap opportunities
  - Sortable by impressions, score, and position
  - Paginated with 25 rows per page
- **Competitor overview panel:** Above the table, collapsible panel showing detected competitors with overlap percentage. Uses `getCompetitors()` API.

### Sub-task 5: Cannibalization tab (~2h)
- **Cannibalization group** (`cannibalization-group.tsx`):
  - **Header:** Target keyword, total impressions across competing URLs, severity indicator
  - **Competing URLs list:** For each URL:
    - URL (clickable), position, clicks, impressions, impression share percentage bar
    - Primary URL tagged with "Primary" badge (highest traffic)
    - Secondary URLs shown below primary
  - **Recommended resolution:** Badge showing strategy (merge/redirect/differentiate/deoptimize) with confidence percentage
  - **Resolution action:** "Apply Resolution" button opens confirmation dialog with specific action steps (from API). On confirm, calls `resolveCannibalization(id, strategy)`.
  - **Override:** Dropdown to select alternative strategy if user disagrees with recommendation
- Groups displayed as expandable accordion items sorted by total impressions
- Each group shows quick summary in collapsed state: keyword, URL count, recommended strategy

### Sub-task 6: Decay Alerts tab and analysis dialog (~1h)
- **Decay alert card** (`decay-alert.tsx`):
  - Shows: URL, title, severity badge (critical/high/medium), click change percentage, position change, content age
  - **Trend sparkline:** Mini line chart showing 3-month click trend using inline SVG (no chart library dependency)
  - Recommended action badge: partial_refresh, full_rewrite, retire_301, monitor
  - "Refresh Article" button → calls `executeRecommendation()` for the corresponding decay opportunity
  - Cards sorted by severity (critical first) then click decline magnitude
- **Run Analysis dialog** (`run-analysis-dialog.tsx`):
  - Input: Category text field (required for Mode B)
  - Optional: Competitor domains (comma-separated)
  - Optional: Max recommendations slider (5-50, default 20)
  - Checkboxes: Include new article recommendations, Include refresh recommendations
  - "Run Analysis" button → calls `runAnalysis()`, shows progress, polls `getAnalysisRun(runId)` until complete
  - On completion: refresh recommendations tab with new results, show success toast with count

### Sub-task 7: Sidebar navigation (~1h)
- Add "Opportunities" to main nav section in `dashboard/src/components/layout/sidebar.tsx`
  - Icon: `SparklesIcon` or `LightbulbIcon`
  - Route: `/opportunities`
  - Badge: show count of open opportunities (fetched from API summary)
- Active state highlighting for the route
- Position in nav: after "Content Inventory" (added in DI-006), before existing items
- Ensure RTL layout compatibility (CSS logical properties)

## Acceptance Criteria
- [ ] `/opportunities` page renders with 4 tabs: Recommendations, Keyword Gaps, Cannibalization, Decay Alerts
- [ ] Recommendation cards display score, type, summary, metrics, and action buttons
- [ ] "Accept & Generate" button creates pipeline job and navigates to pipeline tracking
- [ ] "Dismiss" removes recommendation from view with status update
- [ ] Score badges are color-coded: green (80+), yellow (60-79), orange (40-59), red (<40)
- [ ] Keyword Gaps table shows all gaps with impressions, positions, and competitor data
- [ ] Cannibalization groups show competing URLs with impression share bars and resolution strategies
- [ ] Resolution action provides specific steps and updates status on confirmation
- [ ] Decay alerts show trend sparklines (inline SVG, no chart library)
- [ ] "Run Analysis" dialog triggers full intelligence cycle and refreshes results on completion
- [ ] Sidebar shows "Opportunities" nav item with open opportunity count badge
- [ ] All tabs support pagination, filtering, and sorting
- [ ] URL-synced tabs allow direct linking (e.g., `/opportunities?tab=decay`)
- [ ] All components support RTL layout (CSS logical properties, mirrored layouts)
- [ ] Loading and empty states are handled for each tab

## Test Requirements

### Unit Tests
- Score badge renders correct color for each threshold range (0-39, 40-59, 60-79, 80-100)
- Recommendation card renders correct action buttons based on status (open vs accepted)
- Cannibalization group renders impression share bars with correct percentages summing to 100
- Decay sparkline renders correct SVG path from trend data array
- Filter state correctly combines type + status + min_score

### Integration Tests
- Recommendations tab loads and displays data from API with correct formatting
- Accept recommendation → pipeline job created → navigation to pipeline page
- Dismiss recommendation → API called → card removed from view
- Run Analysis dialog → submit → poll → completion → tab refreshes with new data
- Cannibalization resolve → confirmation → API called → group status updated
- Tab switching preserves filter/pagination state per tab

## Dependencies
- Blocked by: CI-001 (decay endpoints), CI-002 (gaps/cannibalization endpoints), CI-003 (recommendations endpoints), DI-006 (dashboard nav pattern)
- Blocks: None (this is the final UI layer for the intelligence feature set)
