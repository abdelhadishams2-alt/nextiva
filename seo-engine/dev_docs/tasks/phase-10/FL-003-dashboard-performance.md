# FL-003: Dashboard Performance & Feedback Page

> **Phase:** 10 | **Priority:** P1 | **Status:** NOT STARTED
> **Effort:** L (8h) | **Type:** feature
> **Sprint:** 10 (Weeks 19-20)
> **Backlog Items:** Feedback Loop — Dashboard UI + Client Reports
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `PROJECT-BRIEF.md` — Section "Layer 6: Feedback Loop" for tracking and reporting spec
3. `bridge/intelligence/performance-tracker.js` — prediction vs actual data from FL-001
4. `bridge/intelligence/recalibration.js` — recalibration engine from FL-002
5. `bridge/server.js` — `/api/feedback/*` endpoints from FL-001 and FL-002
6. `dashboard/` — existing Next.js 16 dashboard structure, shadcn/ui components

## Objective
Build the Performance dashboard page at `/performance` that displays summary cards (total articles tracked, average accuracy, articles above/below target), a timeline chart showing prediction accuracy over time, a DataTable of all published articles with predicted vs actual metrics, and date/platform filters. Include a client-facing report generator that produces JSON and HTML reports for sharing with clients.

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `dashboard/app/performance/page.tsx` | Main performance page — server component, data fetching |
| CREATE | `dashboard/components/performance/summary-cards.tsx` | 4 summary metric cards (tracked, accuracy, above target, below target) |
| CREATE | `dashboard/components/performance/timeline-chart.tsx` | Line chart showing accuracy score over time |
| CREATE | `dashboard/components/performance/predictions-table.tsx` | DataTable with predicted vs actual metrics per article |
| CREATE | `dashboard/components/performance/report-generator.tsx` | Client report generation dialog (JSON + HTML export) |
| MODIFY | `bridge/server.js` | Add `/api/feedback/report/:userId` endpoint for report generation |
| MODIFY | `dashboard/app/layout.tsx` | Add "Performance" item to main navigation sidebar |
| CREATE | `tests/dashboard-performance.test.js` | Component and integration tests |

## Sub-tasks

### Sub-task 1: Summary Cards Component (~1.5h)
- Create `dashboard/components/performance/summary-cards.tsx`
- 4 metric cards in a responsive row (2x2 on mobile, 4x1 on desktop):

| Card | Metric | Calculation | Icon |
|------|--------|-------------|------|
| Articles Tracked | Total published articles with predictions | Count of performance_predictions rows | chart-bar |
| Avg Accuracy | Mean overall accuracy across completed predictions | avg(overall_accuracy) where status='complete' | target |
| Above Target | Articles performing better than predicted | Count where actual_clicks > predicted_clicks | trending-up (green) |
| Below Target | Articles underperforming predictions | Count where actual_clicks < predicted_clicks * 0.7 | trending-down (red) |

- Each card: large number, label, trend indicator (vs previous period), sparkline if data available
- Color coding: accuracy card green (>= 80), yellow (60-79), red (< 60)
- Props: `{ tracked, accuracy, aboveTarget, belowTarget, trends }`
- Skeleton loading state while data fetches

### Sub-task 2: Timeline Chart (~2h)
- Create `dashboard/components/performance/timeline-chart.tsx`
- Line chart (SVG-based, no chart library — keep zero-dep philosophy, or use lightweight approach):
  - X axis: time (monthly buckets)
  - Y axis: accuracy score (0-100)
  - Lines: 30-day accuracy (blue), 60-day accuracy (green), 90-day accuracy (orange)
  - Data points clickable: show tooltip with article count and accuracy for that month
- Alternative: if SVG from scratch is too complex, use a simple bar chart per month with stacked accuracy segments
- Chart responsive: full width, height 300px desktop / 200px mobile
- Date range selector above chart: Last 3 months, 6 months, 12 months, All time
- Empty state: "Publish articles and wait 30 days to see performance data"
- Props: `{ dataPoints: Array<{ month, accuracy30d, accuracy60d, accuracy90d, articleCount }>, dateRange }`

### Sub-task 3: Predictions DataTable (~2h)
- Create `dashboard/components/performance/predictions-table.tsx`
- DataTable columns:

| Column | Content | Sortable |
|--------|---------|----------|
| Article | Title with link to article detail | Yes |
| Keyword | Primary target keyword | Yes |
| Platform | Published platform icon + name | Yes |
| Published | Date published | Yes (default: newest first) |
| Predicted Clicks | 30d predicted clicks | Yes |
| Actual Clicks | 30d actual clicks (blank if not yet checked) | Yes |
| Accuracy | Accuracy score badge: Excellent/Good/Fair/Poor | Yes |
| Status | Tracking status: Pending/Tracking/Complete | Yes |

- **Predicted vs Actual inline comparison:** Show both numbers with delta arrow (green up / red down)
- **Expandable row:** Click to expand and show 60d and 90d data, detailed accuracy breakdown, GSC/GA4 raw metrics
- **Filters:**
  - Date range picker (published date range)
  - Platform dropdown: All, WordPress, Shopify, etc.
  - Status: All, Pending, Tracking, Complete
  - Accuracy: All, Excellent, Good, Fair, Poor
- **Pagination:** 25 items per page
- **Bulk actions:** "Export CSV" for selected rows
- Empty state: "No published articles yet. Publish an article to start tracking performance."

### Sub-task 4: Report Generator (~1.5h)
- Create `dashboard/components/performance/report-generator.tsx`
- Dialog triggered by "Generate Report" button in page header
- **Report options:**
  - Date range: custom picker or preset (Last 30/60/90 days, This quarter, This year)
  - Platform filter: All or specific
  - Format: JSON, HTML
  - Include: checkboxes for sections (Summary, Article Details, Accuracy Trends, Recommendations)
- **Report content (both formats):**
  1. **Summary section:** Total articles, avg accuracy, best/worst performing article, overall trend
  2. **Article details:** Table of all articles with predicted vs actual metrics
  3. **Accuracy trends:** Monthly accuracy averages with direction
  4. **Recommendations:** Auto-generated suggestions based on data (e.g., "Decay-targeted articles outperform gap-based by 23% — consider increasing decay weight")
- **JSON format:** Structured JSON matching the report schema, downloadable as `.json` file
- **HTML format:** Branded, printable HTML report with inline CSS:
  - ChainIQ header with logo placeholder and generation date
  - Clean typography, tables with zebra striping
  - Chart rendered as inline SVG
  - Footer with "Generated by ChainIQ" and timestamp
  - Downloadable as `.html` file
- "Generate" button calls `GET /api/feedback/report/:userId?format=json|html&dateFrom=...&dateTo=...`

### Sub-task 5: Report Endpoint + Main Page (~1h)
- Add `GET /api/feedback/report/:userId` to `bridge/server.js`
  - Auth required (user can generate own reports, admin can generate for any user)
  - Query params: `format` (json|html), `dateFrom`, `dateTo`, `platform`, `sections`
  - Process:
    1. Fetch all prediction records for user within date range
    2. Compute summary statistics
    3. Generate accuracy trends by month
    4. Generate recommendations based on factor accuracy
    5. Format as JSON or render as HTML string
  - Response:
    - JSON format: `{ report: { summary, articles, trends, recommendations } }`
    - HTML format: `{ html: "<html>...</html>" }` (or direct HTML response with Content-Type: text/html)
- Create `dashboard/app/performance/page.tsx`
  - Server component fetching from `/api/feedback/predictions` (list) and summary endpoint
  - Layout:
    1. **Header:** "Performance" title, date range selector, "Generate Report" button, "Recalibrate" button (admin only)
    2. **Summary cards row**
    3. **Timeline chart**
    4. **Predictions DataTable**
  - "Recalibrate" button: opens confirmation dialog, calls `/api/feedback/recalibrate` with dryRun=true first, shows proposed changes, "Apply" confirms with dryRun=false
  - Add "Performance" to main navigation sidebar in `dashboard/app/layout.tsx` with activity/chart icon

## Testing Strategy

### Component Tests (`tests/dashboard-performance.test.js`)
- Test summary cards render correct values and color coding
- Test timeline chart renders data points for each month
- Test predictions table sorts by all sortable columns
- Test predictions table filters by date, platform, status, accuracy
- Test expandable row shows 60d/90d detail data
- Test report generator dialog validates date range and format selection
- Test empty states render when no data available

### Integration Tests
- Test performance page loads data from API endpoints
- Test date range filter updates all components (cards, chart, table)
- Test "Generate Report" produces downloadable JSON
- Test "Generate Report" produces downloadable HTML
- Test "Recalibrate" button shows dry-run results before applying
- Test pagination on predictions table
- Test CSV export for selected rows
- Test RTL layout

## Acceptance Criteria
- [ ] Performance page accessible at `/performance` with navigation link in sidebar
- [ ] 4 summary cards show tracked articles, avg accuracy, above/below target counts
- [ ] Timeline chart displays accuracy scores over time with 30/60/90 day lines
- [ ] Predictions DataTable shows all articles with predicted vs actual and accuracy badges
- [ ] Table sortable by all key columns and filterable by date, platform, status, accuracy
- [ ] Expandable rows show 60d and 90d detail data
- [ ] Date range selector updates all components
- [ ] "Generate Report" produces JSON and HTML format reports
- [ ] HTML report is branded, printable, with inline CSS and SVG charts
- [ ] `/api/feedback/report/:userId` generates report data with date/platform/format params
- [ ] "Recalibrate" button (admin) shows dry-run before applying
- [ ] Responsive layout works on mobile and desktop
- [ ] All tests pass (`npm test`)

## Dependencies
- Blocked by: FL-001 (performance tracker), FL-002 (recalibration engine)
- Blocks: None (final phase)
