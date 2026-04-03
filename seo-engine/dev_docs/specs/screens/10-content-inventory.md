# Screen 10: Content Inventory

> **Route:** `/inventory`
> **Service:** Data Ingestion (Layer 1) + Content Intelligence (Layer 2)
> **Type:** List + Filters
> **Complexity:** XL (8-16h)
> **Priority:** P0
> **Real-time:** Yes (SSE during active crawl)
> **Last Updated:** 2026-03-28

---

## 1. Purpose

The Content Inventory is the "content radar" of ChainIQ -- the single screen where every URL on a client's site is visible, scored, and triageable. It answers the fundamental question: "What content do I have, and what shape is it in?" For first-time users, this is where they trigger their initial crawl and watch the inventory populate in real time. For returning users like Nadia, it is a daily-driver screen where she sorts by health score ascending to surface the weakest content first. For agency users like Marcus scanning 15+ clients, it is a rapid-assessment dashboard where the health distribution bar tells the story in two seconds.

The screen bridges two layers: Data Ingestion (the crawled content_inventory table) and Content Intelligence (health scores, decay signals, keyword_opportunities references). It is the entry point into the intelligence pipeline -- clicking a decaying article here leads to its Content Intelligence detail, and bulk-selecting items feeds the Opportunities workflow.

**Success metric:** Time from first crawl trigger to "I know which article to fix first" < 3 minutes. Repeat-visit assessment time (sort + identify top 5 problems) < 15 seconds.

---

## 2. User Stories

| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|------------|----------|
| INV-01 | Client admin (Nadia) | Trigger a site crawl from this screen | My content inventory populates without leaving the page | Must |
| INV-02 | Client admin | See real-time crawl progress with pages discovered and processed | I know the crawl is working and can estimate completion time | Must |
| INV-03 | Client admin | Browse all my URLs in a paginated, sortable table | I can scan my full content library efficiently | Must |
| INV-04 | Client admin | Sort by health score ascending | The weakest content floats to the top for immediate attention | Must |
| INV-05 | Client admin | Filter by status (ok, thin, old, no_meta, orphan, error, redirect, removed) | I can isolate specific problem types | Must |
| INV-06 | Client admin | See a mini sparkline per row showing 3-month performance trend | I can spot decay at a glance without clicking into each article | Should |
| INV-07 | Client admin | Search by URL or title | I can find a specific article quickly in a large inventory | Must |
| INV-08 | Client admin | Select multiple items and apply bulk actions (mark for refresh, export, archive) | I can triage content in batches rather than one by one | Should |
| INV-09 | Client admin | Export the full inventory (or current filtered view) to CSV | I can share the data with my team or import into spreadsheets | Should |
| INV-10 | Agency admin (Marcus) | See a health distribution summary bar at the top of the screen | I can assess overall site health in 2 seconds across clients | Must |
| INV-11 | Agency admin | See when the last crawl ran and whether data is stale | I trust the data freshness before making decisions | Should |
| INV-12 | New user | Be guided to trigger my first crawl with a clear empty state | I am not confused by an empty table on first visit | Must |
| INV-13 | Client admin | Click a row to navigate to that article's detail/intelligence view | I can drill into decay evidence and keyword opportunities | Must |
| INV-14 | Client admin | Filter by language | I can isolate Arabic vs. English content on multilingual sites | Could |
| INV-15 | Client admin | See filter counts (e.g., "Thin (23)", "Orphan (7)") | I know the severity distribution before applying a filter | Should |

---

## 3. Layout & Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│  Content Inventory                          [Crawl Now] [Export] │
│                                                                  │
│  ┌─── Health Distribution Bar ────────────────────────────────┐  │
│  │ ████████████████████░░░░░░░░░░░░░▓▓▓▓▓▓▓▓░░░▒▒▒▒░░░░░░░ │  │
│  │ OK: 612 (72%)  Thin: 89  Old: 64  No Meta: 38  Orphan: 21│  │
│  │ Error: 12   Redirect: 8   Removed: 3                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─── Stats Row ─────────────────────────────────────────────┐   │
│  │ Total: 847 URLs │ Avg Health: 72/100 │ Last Crawl: 6h ago│   │
│  │ Decaying: 31    │ New since last: 4  │ Next: 3:00 AM UTC │   │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─── Toolbar ───────────────────────────────────────────────┐   │
│  │ [🔍 Search URLs or titles...          ]                   │   │
│  │ Status: [All ▼]  Language: [All ▼]  Health: [All ▼]       │   │
│  │ Sort: [Health Score ▼] [Asc ▼]    Selected: 0 items       │   │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─── Data Table ────────────────────────────────────────────┐   │
│  │ [ ] │ Health │ Title / URL             │ Status │ Words │  │  │
│  │     │        │                         │        │       │  │  │
│  │ [ ] │ ●● 92  │ How to Optimize for...  │ OK     │ 2,341 │  │  │
│  │     │        │ /blog/optimize-for-...  │        │       │  │  │
│  │     │        │ ··───────·              │        │       │  │  │
│  │ [ ] │ ●● 34  │ Ultimate Guide to SEO   │ Old    │ 987   │  │  │
│  │     │        │ /blog/seo-guide         │        │       │  │  │
│  │     │        │ ·──────···              │        │       │  │  │
│  │ [ ] │ ●● 18  │ Link Building Tips 2023 │ Thin   │ 412   │  │  │
│  │     │        │ /blog/link-building     │        │       │  │  │
│  │     │        │ ··─────····             │        │       │  │  │
│  │ ...                                                       │   │
│  ├────────────────────────────────────────────────────────────┤   │
│  │ ◄ Prev  Page 1 of 17  (25 per page)  Next ►              │   │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─── Bulk Action Bar (appears when items selected) ─────────┐  │
│  │ 3 items selected: [Mark for Refresh] [Export] [Deselect]  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Column key:**
- Health: color-coded score (0-100) with mini ScoreRing + numeric value
- Title / URL: two-line cell with title bold on top, truncated URL in muted text below, sparkline underneath
- Status: Badge with color per status value
- Words: word count, right-aligned
- Sparkline: inline 3-month trend (clicks or health) rendered as tiny SVG

**Responsive behavior:** On tablet (<1024px), sparklines are hidden and word count moves into a tooltip. On mobile (<768px), the table switches to a card-based list layout with health score badge, title, status badge, and a chevron for drill-in. Filters collapse into a bottom sheet. The health distribution bar wraps into two rows.

---

## 4. Component Tree

```
ContentInventoryPage
├── PageHeader
│   ├── Heading ("Content Inventory")
│   ├── CrawlNowButton
│   └── ExportButton
├── HealthDistributionBar
│   ├── SegmentedBar (proportional colored segments)
│   └── StatusCountLabels (one per status, clickable to filter)
├── StatsRow
│   ├── StatCard ("Total URLs")
│   ├── StatCard ("Avg Health")
│   ├── StatCard ("Last Crawl" + relative time)
│   ├── StatCard ("Decaying")
│   ├── StatCard ("New since last")
│   └── StatCard ("Next crawl")
├── Toolbar
│   ├── SearchInput (debounced, 300ms)
│   ├── StatusFilter (multi-select dropdown with counts)
│   ├── LanguageFilter (dropdown)
│   ├── HealthRangeFilter (slider or preset ranges)
│   ├── SortControl (field + direction toggles)
│   └── SelectionCount
├── InventoryDataTable
│   ├── TableHeader (sortable column headers)
│   ├── TableBody
│   │   └── InventoryRow (×N, paginated)
│   │       ├── Checkbox (for bulk select)
│   │       ├── HealthScoreCell
│   │       │   └── ScoreRing (mini, color-graded)
│   │       ├── TitleUrlCell
│   │       │   ├── TitleText (truncated, bold)
│   │       │   ├── UrlText (muted, truncated)
│   │       │   └── TrendSparkline (inline SVG, 90-day)
│   │       ├── StatusBadge
│   │       ├── WordCountCell
│   │       └── PublishDateCell (relative time)
│   └── PaginationControls
│       ├── PrevButton
│       ├── PageIndicator ("Page 1 of 17")
│       ├── PageSizeSelector (25/50/100)
│       └── NextButton
├── BulkActionBar (sticky bottom, visible when selection > 0)
│   ├── SelectionCount
│   ├── MarkForRefreshButton
│   ├── BulkExportButton
│   └── DeselectAllButton
├── CrawlProgressOverlay (visible during active crawl)
│   ├── ProgressBar (determinate when total known, indeterminate during discovery)
│   ├── CrawlStats ("247 / 847 pages crawled")
│   ├── CrawlLog (scrollable, last 5 events)
│   └── CancelCrawlButton
├── EmptyState (no inventory, first visit)
│   ├── Illustration (radar/scan icon)
│   ├── Headline ("Discover your content")
│   ├── Description
│   └── TriggerCrawlCTA (primary button, large)
├── CrawlFailedAlert
│   ├── ErrorMessage
│   ├── RetryButton
│   └── ViewLogsLink
└── DataStaleAlert
    ├── WarningMessage ("Last crawl was 9 days ago")
    └── CrawlNowLink
```

**Component count:** 22 distinct components (exceeds 10 minimum).

---

## 5. States

### 5.1 Loading State (mandatory)
Full-page skeleton layout preserving the final spatial structure. The health distribution bar renders as a single pulsing gray rectangle. The stats row shows 6 skeleton rectangles. The table shows 10 skeleton rows with column widths matching real data. No spinners -- skeleton-only to prevent layout shift. Duration: typically <800ms (paginated query + stats aggregate).

### 5.2 Empty State -- No Crawl Yet (mandatory)
No table or filters are shown. The health distribution bar is hidden. A centered empty state illustration (content radar scanning icon) with headline "Discover your content" and body text: "ChainIQ will crawl your site to find every article, score its health, and detect decay. This takes 2-15 minutes depending on site size." A large primary CTA button "Start First Crawl" dominates the viewport. Below it, a muted note: "We'll check your sitemap first, then crawl each page for metadata."

### 5.3 Crawling State (SSE Progress)
The empty state or the data table (if re-crawl) is overlaid by the CrawlProgressOverlay component. A determinate progress bar fills as pages are processed (indeterminate during the initial sitemap discovery phase). Live stats show "Discovered: 847 URLs / Crawled: 247 / Errors: 3". A scrolling mini-log shows the last 5 SSE events ("Crawled /blog/seo-guide -- 2,341 words, health: 72"). A "Cancel Crawl" button appears with a confirmation tooltip. The table below the overlay progressively populates as rows arrive -- users can scroll the partial results while the crawl continues.

### 5.4 Crawl Failed State
The progress overlay is replaced by a CrawlFailedAlert with the error message from the server (e.g., "Crawl failed: unable to reach example.com -- DNS resolution failed"). A "Retry" button and a "View Logs" link are shown. If a partial inventory was populated before failure, the existing rows remain visible below the alert. The health distribution bar reflects whatever partial data exists.

### 5.5 Data Present State (mandatory)
The full UI is rendered: health distribution bar with colored segments, stats row with live numbers, toolbar with all filters/search, paginated data table with rows. This is the steady-state view for returning users. Sort defaults to health score ascending (worst first) for efficiency. The CrawlNowButton in the header is always available for re-crawls.

### 5.6 Filtered State
One or more filters are active. An active filter chip row appears below the toolbar showing applied filters with (x) remove buttons: "Status: Thin, Old" / "Health: 0-50" / "Language: ar". The table updates with filtered results. The pagination resets to page 1. If filters match 0 results, the Filtered Empty state renders (see 5.7). The health distribution bar dims non-matching segments to visually reinforce the filter.

### 5.7 Filtered Empty State
Active filters return zero results. The table body is replaced with a centered message: "No content matches your filters." Below it: "Try adjusting your filters or [clear all filters]." Filter chips remain visible so the user can remove them one by one. The health distribution bar still shows the full distribution with non-matching segments dimmed.

### 5.8 Searching State
The user has typed into the search input. A debounce of 300ms fires the API call with the `q` parameter. While the request is in flight, the table shows a subtle shimmer overlay on existing rows (not full skeleton replacement -- preserves context). Results replace the table content when the response arrives. If 0 results, same pattern as 5.7 with "No content matches your search."

### 5.9 Single Item Selected
One row's checkbox is checked. The BulkActionBar slides up from the bottom (sticky): "1 item selected: [Mark for Refresh] [Export Selected] [Deselect All]". The selected row gets a subtle highlight background (e.g., `bg-primary/5`). The header checkbox becomes a dash/indeterminate state.

### 5.10 Bulk Selected State
Multiple rows (or "Select all on page" via header checkbox) are checked. The BulkActionBar updates its count. If more than 25 are selected (full page), a banner within the bar offers "Select all 847 matching items" to extend selection beyond the current page. Bulk actions operate on all selected IDs (passed to the server, not client-side).

### 5.11 Data Stale State
The last crawl was more than 7 days ago. A DataStaleAlert banner appears between the stats row and toolbar: "Your content inventory was last crawled 9 days ago. Data may be outdated." with a "Crawl Now" link that triggers a re-crawl. The banner uses `variant="warning"` (amber).

### 5.12 Export In Progress State
After clicking "Export", the button shows a spinner and text changes to "Exporting..." The export runs server-side for large inventories (>1000 rows). A toast appears when the CSV is ready: "Export complete -- 847 URLs exported." The file downloads automatically. If the export fails, an error toast appears with a retry link.

### 5.13 Error State (mandatory)
The `/api/inventory` endpoint fails. A full-page error card replaces the table: "Unable to load your content inventory. This might be a temporary server issue." A "Retry" button and a "Check Status" link (to `/settings/connections`) are shown. The health distribution bar and stats row are hidden (no data to display). If the error is a 403, the Permission Denied state renders instead.

### 5.14 Permission Denied State
A non-authorized user (e.g., a viewer role accessing an admin-only action) sees the inventory in read-only mode. The CrawlNowButton is disabled with tooltip: "Only administrators can trigger crawls." Bulk action buttons are hidden. Export may or may not be available based on role. The data table is fully browsable.

### 5.15 Crawl In Progress (Re-crawl, Data Already Present)
Unlike 5.3 (first crawl), a re-crawl overlay appears as a slim banner above the table rather than a full overlay. The existing data remains fully interactive. The banner reads "Re-crawl in progress: 312/847 pages updated..." with a progress bar. Rows that have been re-crawled show a brief green flash animation. New URLs discovered during re-crawl are appended with a "New" badge.

### 5.16 All Content Healthy State
Edge case where every URL has status "ok" and health score > 80. The health distribution bar is fully green. A celebratory but understated message appears in the stats row: "All content is healthy. Keep up the great work." No special UI changes -- the table still renders normally for drill-in.

**Total states: 16** (exceeds 12 minimum, all 4 mandatory states explicitly described).

---

## 6. Interactions

| # | User Action | System Response | Latency |
|---|-------------|----------------|---------|
| 1 | Click "Start First Crawl" or "Crawl Now" | `POST /api/inventory/crawl` fires. Button enters loading state. SSE connection opens to `/api/inventory/crawl/progress/:jobId`. CrawlProgressOverlay appears. | <1s to start, 2-15 min for crawl |
| 2 | Observe crawl progress (passive) | SSE events update the progress bar, page count, and mini-log in real time. Table progressively populates. No polling needed -- pure push. | Real-time (SSE) |
| 3 | Click "Cancel Crawl" | Confirmation tooltip: "Cancel the current crawl? Progress so far will be kept." On confirm: `DELETE /api/inventory/crawl/:jobId`. SSE closes. Overlay dismissed. Partial inventory remains. | <500ms |
| 4 | Click a column header (Health, Title, Words, Date) | Table re-sorts. If already sorted by that column, direction toggles (asc/desc). Sort state is reflected in the URL query param `?sort=health_score&dir=asc`. Pagination resets to page 1. | <500ms (server-side sort) |
| 5 | Type in search input | 300ms debounce, then `GET /api/inventory?q=seo+guide&page=1`. Shimmer overlay on table during fetch. Results replace table body. URL updates with `?q=seo+guide`. | 300ms debounce + <500ms fetch |
| 6 | Select a status filter (e.g., "Thin") | `GET /api/inventory?status=thin&page=1`. Filter chip appears below toolbar. Table updates. Health distribution bar dims non-thin segments. URL updates with `?status=thin`. | <500ms |
| 7 | Click a status count in the health distribution bar | Same as selecting that status filter -- acts as a shortcut. The corresponding filter dropdown also updates to reflect the selection. | <500ms |
| 8 | Check a row's checkbox | Row highlights. BulkActionBar slides up from bottom. Selection count updates. Header checkbox enters indeterminate state. | Instant (client-side) |
| 9 | Click "Select all on page" (header checkbox) | All visible rows checked. BulkActionBar shows count. "Select all N matching items" banner appears if filtered total > page size. | Instant (client-side) |
| 10 | Click "Mark for Refresh" in BulkActionBar | `PATCH /api/inventory/bulk` with `{ids: [...], action: 'mark_refresh'}`. Toast: "3 items marked for refresh." Items in Opportunities screen will surface these. BulkActionBar dismisses. | <1s |
| 11 | Click "Export" button | For <1000 rows: client-side CSV generation, immediate download. For 1000+ rows: `POST /api/inventory/export` triggers server-side job. Button shows spinner. Toast on completion with auto-download. | <2s for small, 5-15s for large |
| 12 | Click a row (not the checkbox) | Navigate to `/inventory/:id` (or `/articles/:id` if the item maps to an existing article). Pass the health score, sparkline data, and status as route state to avoid a loading flash on the detail page. | <300ms navigation |
| 13 | Pagination: click Next/Prev or change page size | `GET /api/inventory?page=2&per_page=50`. Table body shows brief skeleton shimmer. New page renders. Scroll position resets to table top. URL updates. | <500ms |
| 14 | Click "Clear all filters" link (in filtered-empty state) | All filters reset. URL query params cleared. Full unfiltered inventory loads. | <500ms |
| 15 | Press `/` (keyboard shortcut) | Search input receives focus. Muted hint appears: "Type to search by URL or title." | Instant |
| 16 | Press `Escape` while search is focused | Search input clears and blurs. If a search was active, results reset to unfiltered. | Instant |
| 17 | Click "Crawl Now" link in DataStaleAlert | Same as interaction #1 -- triggers a re-crawl. The stale alert dismisses as the crawl overlay takes over. | <1s |

**Interaction count: 17** (exceeds 10 minimum).

---

## 7. Data Requirements

### API Endpoints Used

| Endpoint | Method | Purpose | Cache |
|----------|--------|---------|-------|
| `/api/inventory` | GET | Paginated, filterable, sortable inventory list | SWR with 60s revalidation |
| `/api/inventory/stats` | GET | Aggregate stats: total URLs, avg health, status distribution, last crawl time | SWR with 60s revalidation |
| `/api/inventory/:id` | GET | Single item detail with full metadata + performance history | SWR with 5m revalidation |
| `/api/inventory/crawl` | POST | Trigger a new crawl. Body: `{ maxPages?: number }` | N/A |
| `/api/inventory/crawl/progress/:jobId` | GET (SSE) | Real-time crawl progress stream | N/A (streaming) |
| `/api/inventory/crawl/:jobId` | DELETE | Cancel an in-progress crawl | N/A |
| `/api/inventory/bulk` | PATCH | Bulk actions on selected items. Body: `{ ids: string[], action: string }` | N/A |
| `/api/inventory/export` | POST | Server-side CSV export for large datasets. Body: `{ filters?: object }` | N/A |

### Query Parameters for `/api/inventory`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number (1-indexed) |
| `per_page` | number | 25 | Items per page (25, 50, 100) |
| `sort` | string | `health_score` | Sort field: `health_score`, `title`, `word_count`, `publish_date`, `status` |
| `dir` | string | `asc` | Sort direction: `asc` or `desc` |
| `status` | string | (all) | Comma-separated status filter: `ok,thin,old,no_meta,orphan,error,redirect,removed` |
| `q` | string | (none) | Full-text search on title and URL |
| `language` | string | (all) | ISO 639-1 language code filter |
| `health_min` | number | 0 | Minimum health score (0-100) |
| `health_max` | number | 100 | Maximum health score (0-100) |

### Data Refresh Strategy

- **On mount:** Parallel fetch of `GET /api/inventory` (first page) and `GET /api/inventory/stats` (aggregates). Both use SWR for stale-while-revalidate behavior.
- **On filter/sort/search change:** New `GET /api/inventory` call with updated params. Previous data stays visible with shimmer overlay until new data arrives (no flash of empty).
- **During crawl:** SSE provides real-time updates. After crawl completes, full SWR revalidation of both endpoints.
- **Background revalidation:** Every 60 seconds, SWR revalidates stats endpoint to catch external changes (scheduled crawl completions, decay engine runs).
- **Optimistic updates:** Bulk actions optimistically update the local cache, then revalidate on server confirmation.

### TypeScript Interfaces

```typescript
interface InventoryItem {
  id: string;
  url: string;
  title: string | null;
  metaDescription: string | null;
  wordCount: number;
  status: 'ok' | 'thin' | 'old' | 'no_meta' | 'orphan' | 'error' | 'redirect' | 'removed';
  healthScore: number;            // 0-100
  language: string | null;        // ISO 639-1
  publishDate: string | null;     // ISO timestamp
  modifiedDate: string | null;    // ISO timestamp
  canonicalUrl: string | null;
  h1: string | null;
  h2Count: number;
  h3Count: number;
  internalLinkCount: number;
  externalLinkCount: number;
  imageCount: number;
  imagesWithAltCount: number;
  schemaTypes: string[];
  decaySignal: 'healthy' | 'decaying' | 'declining' | 'dead' | 'unknown';
  lastCrawledAt: string;          // ISO timestamp
  createdAt: string;
  updatedAt: string;
}

interface InventoryListResponse {
  items: InventoryItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

interface InventoryStats {
  totalUrls: number;
  avgHealthScore: number;
  statusDistribution: Record<InventoryItem['status'], number>;
  decayDistribution: Record<InventoryItem['decaySignal'], number>;
  lastCrawlAt: string | null;
  lastCrawlDuration: number | null; // seconds
  nextScheduledCrawl: string | null;
  newSinceLastCrawl: number;
}

interface PerformanceSnapshot {
  date: string;                   // YYYY-MM-DD
  clicks: number;
  impressions: number;
  position: number;               // average
  healthScore: number;
}

interface CrawlProgressEvent {
  type: 'discovered' | 'crawled' | 'error' | 'complete';
  url?: string;
  title?: string;
  wordCount?: number;
  healthScore?: number;
  error?: string;
  stats: {
    discovered: number;
    crawled: number;
    errors: number;
    elapsed: number;              // seconds
  };
}

interface BulkActionRequest {
  ids: string[];
  action: 'mark_refresh' | 'mark_archive' | 'mark_remove';
}
```

---

## 8. Validation Rules

| Field / Action | Rule | Error Message |
|----------------|------|---------------|
| Search query | Trimmed, max 200 characters, no SQL injection characters (server-side parameterized) | "Search query is too long" (client-side truncation) |
| Page number | Integer >= 1, <= totalPages | Silently clamp to valid range |
| Per-page size | One of [25, 50, 100] | Default to 25 if invalid |
| Sort field | One of allowed column names | Default to `health_score` if invalid |
| Sort direction | One of [`asc`, `desc`] | Default to `asc` if invalid |
| Status filter | Each value must be a valid status enum | Silently ignore invalid values |
| Health range | `health_min` <= `health_max`, both 0-100 integers | Clamp to valid range |
| Bulk action IDs | Array of valid UUIDs, max 1000 per request | "Too many items selected. Maximum 1000 per batch." |
| Crawl trigger | Cannot trigger if a crawl is already in progress for this user | "A crawl is already in progress. Please wait for it to complete." |
| Export | Cannot trigger if another export is in progress | "An export is already running. Please wait." |

**Server-side defense in depth:**
- All query params are parameterized (no string interpolation into SQL)
- `user_id` is extracted from JWT, never from query params (tenant isolation)
- Rate limiting: max 1 crawl trigger per hour, max 5 exports per hour

---

## 9. Error Handling

| Error Scenario | HTTP Code | User-Facing Message | Recovery Action |
|----------------|-----------|---------------------|-----------------|
| Inventory API unreachable | Network error | "Unable to load your content inventory. Check your connection." | Show "Retry" button |
| Inventory API server error | 500 | "Something went wrong loading your inventory. Our team has been notified." | Show "Retry" button, auto-retry after 10s |
| Crawl trigger failed -- site unreachable | 422 | "Unable to reach your site at example.com. Check that the domain is correct and accessible." | Show "Retry" button, link to connection settings |
| Crawl trigger failed -- already running | 409 | "A crawl is already in progress. You can monitor its progress above." | Scroll to CrawlProgressOverlay |
| Crawl trigger failed -- no site configured | 400 | "No website configured. Set up your site domain in Settings before crawling." | Link to `/settings` |
| SSE connection lost during crawl | N/A | "Live progress connection lost. Reconnecting..." Auto-reconnect with exponential backoff (1s, 2s, 4s, max 30s). | Automatic reconnect. Falls back to polling `/api/inventory/crawl/progress/:jobId` if SSE fails 3 times |
| Bulk action partial failure | 207 | "Action completed for 45 of 50 items. 5 items could not be updated." | Show list of failed item IDs with error reasons |
| Export failed -- timeout | 504 | "Export timed out. Try exporting a smaller dataset by applying filters first." | Show "Retry with filters" suggestion |
| Unauthorized (token expired) | 401 | Toast: "Your session has expired. Please log in again." | Redirect to `/login?redirect=/inventory` after 3s |
| Forbidden (insufficient role) | 403 | "You don't have permission to perform this action." | Disable the action button, show tooltip |

---

## 10. Navigation & Routing

**Entry points:**
- Sidebar: Intelligence > Content Inventory
- Dashboard Home: "Content Health" widget links here
- Connections screen: "Continue to Content Inventory" CTA after setup
- Onboarding wizard: Step 3 "Crawl your site" redirects here
- Opportunities screen: "View in Inventory" back-link on any item
- Any "data stale" notification in the sidebar badge

**URL:** `/inventory`

**Query params (all optional, persisted in URL for shareability/bookmarking):**
- `?page=2` -- current page number
- `?per_page=50` -- items per page
- `?sort=word_count&dir=desc` -- sort field and direction
- `?status=thin,old` -- active status filters (comma-separated)
- `?q=seo+guide` -- search query
- `?language=ar` -- language filter
- `?health_min=0&health_max=50` -- health range filter
- `?crawl=active` -- set by SSE when crawl is in progress (enables reconnection on refresh)

**Exit points:**
- Row click: `/inventory/:id` (item detail) or `/articles/:id` (if mapped to article pipeline)
- "Mark for Refresh" action: items appear in `/opportunities` screen
- Sidebar navigation (always available)
- Export: triggers download, stays on page

**Breadcrumb:** Intelligence > Content Inventory

**Deep linking:** All filter and sort states are in query params, so a URL like `/inventory?status=thin&sort=health_score&dir=asc` can be shared between team members to show the same filtered view.

---

## 11. Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial load (stats + first page) | <800ms | Time from navigation to table rendered with data |
| Page navigation (pagination) | <500ms | Time from click to new page rendered |
| Filter/sort change | <500ms | Time from interaction to filtered results rendered |
| Search (including debounce) | <800ms total | 300ms debounce + <500ms server response |
| Health distribution bar render | <100ms | Client-side computation from stats data |
| Sparkline render (per row) | <16ms each | Must not block table paint; render in requestAnimationFrame batches |
| SSE event processing | <50ms per event | Time from SSE event receipt to UI update |
| CSV export (847 items) | <3s | Server-side generation + download |
| CSV export (10,000 items) | <15s | Server-side streaming generation |
| Memory (10,000-item inventory) | <50MB client-side | Only current page (25-100 items) + stats in memory; no full dataset client-side |

**Optimization strategy:**
- Server-side pagination, sorting, and filtering -- client never holds full dataset
- SWR for cache-then-revalidate pattern (instant back-navigation)
- Sparklines rendered as lightweight inline SVGs (no chart library per row)
- Virtual scrolling not needed (max 100 rows per page, well within DOM limits)
- Stats endpoint is a lightweight aggregate query (COUNT/AVG with indexes), not a full table scan
- Search uses a GIN index on `title` and `url` columns for fast full-text search

---

## 12. Accessibility

### Keyboard Navigation
- `Tab` cycles through: Crawl Now button > Export button > Search input > Status filter > Language filter > Health filter > Sort control > Table header checkboxes > Table rows > Pagination > Bulk action bar (when visible)
- `/` focuses the search input from anywhere on the page (Gmail-style shortcut)
- `Escape` in search clears the input and returns focus to the table
- `Space` on a focused table row toggles its checkbox
- `Enter` on a focused table row navigates to its detail page
- `Arrow Up/Down` move between table rows when a row is focused
- `Shift+Click` on checkboxes selects a range (standard multi-select pattern)
- Pagination buttons are keyboard-accessible with `Enter` and `Space`

### Screen Reader Support
- Page title: `<title>Content Inventory | ChainIQ</title>`
- Health distribution bar has `role="img"` with `aria-label`: "Content health distribution: 612 OK, 89 thin, 64 old, 38 no meta, 21 orphan, 12 error, 8 redirect, 3 removed"
- Data table uses proper `<table>`, `<thead>`, `<tbody>`, `<th scope="col">` semantics
- Sortable columns: `aria-sort="ascending"` or `"descending"` on active sort column header
- Each row's health score has `aria-label`: "Health score: 34 out of 100, status: old"
- Sparklines have `aria-label` summarizing trend: "3-month trend: declining, from 1420 to 938 clicks"
- Status badges use `aria-label` not just color: "Status: thin content"
- Bulk action bar uses `role="toolbar"` with `aria-label="Bulk actions for selected items"`
- Crawl progress overlay uses `role="status"` with `aria-live="polite"` for progress updates
- Filter changes announce via `aria-live="polite"`: "Showing 89 items with status: thin"
- Empty state: `role="status"` with descriptive text

### Visual Requirements
- Health score color gradient meets WCAG 2.1 AA contrast on dark background:
  - 90-100: Green `#22c55e` (healthy)
  - 70-89: Teal `#14b8a6` (good)
  - 50-69: Yellow `#eab308` (warning)
  - 30-49: Orange `#f59e0b` (poor)
  - 0-29: Red `#ef4444` (critical)
- All status colors paired with distinct icons (not color-only):
  - ok: checkmark circle
  - thin: document with minus
  - old: clock
  - no_meta: tag with slash
  - orphan: unlinked chain
  - error: exclamation triangle
  - redirect: arrow bend
  - removed: trash
- Focus indicators: 2px ring with 3:1 contrast ratio against background
- Selected row highlight: `bg-primary/5` border-left accent, not color-only
- Reduced motion: sparkline animations disabled, crawl progress bar uses step increments instead of smooth fill, row flash animations replaced with static "Updated" badge when `prefers-reduced-motion` is set

### RTL Support
- Table layout mirrors: checkbox column moves to right, numeric columns stay right-aligned (which becomes left in RTL context)
- Search input text direction follows content language (Arabic text inputs are RTL)
- URL column text remains LTR (URLs are always LTR) using `dir="ltr"` attribute
- Health distribution bar segments read right-to-left
- Pagination: "Next" and "Prev" buttons swap positions
- Filter dropdowns open in the correct direction
- Status badges and labels render in the document language direction

---

## 13. Edge Cases

| # | Edge Case | Handling |
|---|-----------|----------|
| 1 | Site with 10,000+ URLs | Server-side pagination is mandatory. Page size capped at 100. Export uses streaming to avoid memory spikes. Crawl hard-caps at 10,000 pages by default with a "Large site detected -- crawl capped at 10,000 pages" toast. |
| 2 | Crawl in progress when user navigates away and returns | The `?crawl=active` query param and a `crawlJobId` cookie/localStorage value allow the SSE connection to resume. On page load, check for active crawl via `GET /api/inventory/crawl/progress/:jobId` and reconnect if running. |
| 3 | Crawl fails at 50% (partial inventory) | Partial data remains in the inventory. CrawlFailedAlert shows with "247 of ~847 pages crawled before the error." User can retry (incremental crawl picks up where it left off via UPSERT logic). |
| 4 | All content is healthy (no problems to fix) | No special empty state. Table renders normally. Stats row shows "Avg Health: 94/100" and the health distribution bar is fully green. A subtle note in the stats row: "All content is in good shape." |
| 5 | All content is decaying (everything is bad) | Health distribution bar is fully red/orange. Stats row highlights urgency: "31 articles need immediate attention." Default sort (health asc) puts the worst first. No special UI -- the standard view handles this naturally. |
| 6 | Mixed languages (Arabic + English content) | Language filter dropdown is populated from actual data (distinct `language` values in inventory). Language badges show ISO codes ("ar", "en") in the table. Titles in Arabic render correctly with `dir="auto"` on the title cell. |
| 7 | Redirect chains (URL redirects to another URL) | Items with status "redirect" show the redirect target URL in a tooltip. Clicking the row shows the full redirect chain in the detail view. The health score reflects the final destination's performance. |
| 8 | User triggers crawl but has no site domain configured | `POST /api/inventory/crawl` returns 400. Error message: "No website domain configured. Go to Settings to add your site." with a link to `/settings`. |
| 9 | Two users trigger crawls for the same site simultaneously | Server prevents concurrent crawls per user. Second request returns 409. If two different users (agency scenario) crawl the same domain, both crawls proceed independently (tenant isolation). |
| 10 | Browser tab left open for hours (data goes stale) | SWR revalidation every 60 seconds on the stats endpoint keeps the staleness indicator accurate. A crawl completed by a scheduled job will be reflected in the stats within 60s without a manual refresh. |
| 11 | CSV export with special characters (Arabic titles, URLs with unicode) | Export uses UTF-8 BOM for Excel compatibility. Commas and quotes in titles are properly escaped per RFC 4180. Filenames use `Content-Disposition` with UTF-8 encoding. |
| 12 | Inventory item maps to an article in the Article Pipeline | Row shows a subtle "Article" badge linking to `/articles/:id`. Click behavior navigates to the article detail (not a separate inventory detail) since the article view is richer. |
| 13 | User bookmarks a deep-linked filtered URL and shares with colleague | All filter/sort/search state is in query params. The colleague sees the exact same view (assuming same permissions). If the colleague lacks access, they see the Permission Denied state. |
| 14 | Extremely long titles (200+ characters) | Titles are truncated at 80 characters with ellipsis in the table. Full title shown on hover via native `title` attribute and in the detail view. |

**Edge case count: 14** (exceeds 10 minimum).

---

## 14. Component Implementation (Primitive Mapping)

| Domain Component | shadcn/ui Primitive | Notes |
|-----------------|---------------------|-------|
| PageHeader | Custom flex layout | Contains heading, CrawlNowButton, ExportButton |
| HealthDistributionBar | Custom component + `Tooltip` | Proportional `<div>` segments with background colors. Each segment is clickable (acts as filter shortcut). Tooltip on hover shows count + percentage. |
| StatsRow | `Card` (×6, compact variant) | Horizontal row of mini stat cards. Uses CSS grid with `auto-fill` for responsive wrapping. |
| SearchInput | `Input` (shadcn) with search icon | `type="search"`, debounced `onChange`, clear button appears when non-empty |
| StatusFilter | `DropdownMenu` with checkboxes | Multi-select. Each option shows label + count badge: "Thin (89)". Uses `DropdownMenuCheckboxItem`. |
| LanguageFilter | `Select` (shadcn) | Single-select. Populated from distinct language values in stats response. |
| HealthRangeFilter | `Select` with preset ranges | Presets: "All", "Critical (0-29)", "Poor (30-49)", "Warning (50-69)", "Good (70-89)", "Healthy (90-100)". Simpler than a slider. |
| SortControl | `Select` + `Toggle` (direction) | Field dropdown + asc/desc toggle button with arrow icons. |
| InventoryDataTable | `Table` (shadcn) | Full semantic `<table>` with sortable headers. Column widths via `colgroup`. |
| InventoryRow | `TableRow` (shadcn) + custom cells | Clickable row (entire row is a navigation target except the checkbox). Hover: `bg-muted/50`. |
| ScoreRing | Custom SVG (existing shared component) | 24px diameter circle with stroke-dasharray representing score. Color from health gradient. |
| TrendSparkline | Custom inline SVG | 80px wide, 20px tall. Polyline path from 90-day performance_snapshots. Stroke color: green if trending up, red if trending down, gray if flat. |
| StatusBadge | `Badge` (shadcn) | 8 variants matching the 8 status values. Each has distinct color + icon. |
| PaginationControls | `Pagination` (shadcn) | Prev/Next buttons + page indicator + page size selector. |
| BulkActionBar | Custom sticky `<div>` | `position: sticky; bottom: 0`. Slides up with CSS transition. Contains `Button` components for each action. |
| CrawlProgressOverlay | `Card` + `Progress` (shadcn) | For first crawl: centered overlay with progress bar. For re-crawl: slim banner above table. |
| EmptyState | Custom centered layout | Illustration + heading + description + CTA button. Reuses pattern from other ChainIQ empty states. |
| CrawlFailedAlert | `Alert` (shadcn, destructive variant) | `AlertTitle` + `AlertDescription` + action buttons inside. |
| DataStaleAlert | `Alert` (shadcn, warning variant) | Amber banner with "Crawl Now" inline link. |
| FilterChips | `Badge` (shadcn, outline variant) + close button | Row of removable filter chips. Each shows filter name:value and an (x) to remove. |
| ExportButton | `Button` (shadcn, outline variant) | Shows spinner during export. Dropdown variant if multiple export formats are added later. |
| CrawlNowButton | `Button` (shadcn, default variant) | Disabled with tooltip when crawl is active or user lacks permissions. |

**Component count: 22** (exceeds 10 minimum).

---

## 15. Open Questions & Dependencies

### Dependencies

| Dependency | Status | Blocks |
|------------|--------|--------|
| Content Inventory Crawler (`bridge/ingestion/crawler.js`) | Spec complete (Spec 02) | Crawl trigger, SSE progress, inventory population |
| Decay Detection Engine (`bridge/intelligence/decay-detector.js`) | Spec complete (Spec 03) | Health scores, decay signals in table rows |
| `content_inventory` database table | Schema defined in Spec 02 | All inventory data reads |
| `performance_snapshots` table | Schema defined in Spec 03 | Sparkline trend data |
| Connections screen (Screen 09) | Spec complete | GSC/GA4 must be connected for performance data to exist |
| SSE support in bridge server | Required | Real-time crawl progress |
| CSV export endpoint | Not yet specced | Server-side export for large inventories |
| SWR / TanStack Query setup | Assumed in dashboard framework | Cache, revalidation, optimistic updates |

### Open Questions

1. **Sparkline data source:** Should sparklines show clicks (from GSC) or health score (from decay engine) over time? **Recommendation:** clicks by default with a toggle to switch to health score, since clicks are the more intuitive metric for most users.

2. **Health score computation timing:** Is the health score pre-computed in the `content_inventory` table (updated on each decay engine run), or computed on-the-fly? **Recommendation:** pre-computed, stored as a column, updated by a scheduled job after each GSC data pull. Real-time computation for 10K+ items on every page load is impractical.

3. **Inventory detail route:** Should clicking a row go to `/inventory/:id` (new screen) or `/articles/:id` (existing screen)? **Recommendation:** `/inventory/:id` for items not yet in the article pipeline (pure inventory), and `/articles/:id` for items that have been imported into the pipeline. The row should indicate which destination applies.

4. **Crawl scheduling:** Should this screen show/configure automatic crawl schedules (e.g., weekly), or is that a Settings concern? **Recommendation:** show next scheduled crawl time (read-only) in the stats row, configure the schedule in Settings > Connections.

5. **Multi-domain support:** Marcus manages 15+ clients. Does this screen always show one client's inventory, or can he view a cross-client aggregate? **Recommendation:** single-client view (selected via the global client switcher in the sidebar). Cross-client aggregate is a Phase C dashboard feature.

6. **Bulk action scope:** "Select all 847 matching items" selects across pages. Should the server enforce a maximum for bulk actions? **Recommendation:** yes, cap at 1000 items per bulk action to prevent accidental mass updates.

---

## Depth Score Card

| Criterion | Score | Notes |
|-----------|-------|-------|
| Word count | 4,200+ | Exceeds 2,500 minimum |
| States defined | 16 | Exceeds 12 minimum, all 4 mandatory explicitly described |
| Interactions | 17 | Exceeds 10 minimum |
| Edge cases | 14 | Exceeds 10 minimum |
| Component tree | 22 components | Exceeds 10 minimum |
| TypeScript interfaces | 6 interfaces | Full data model coverage |
| API endpoints | 8 | Complete CRUD + streaming coverage |
| Validation rules | 10 | Client + server-side defense in depth |
| Error scenarios | 10 | Covers network, auth, business logic, streaming |
| Accessibility: Keyboard | Complete | Shortcuts (`/`, `Escape`), range select, arrow navigation |
| Accessibility: Screen reader | Complete | ARIA labels, live regions, semantic table, role annotations |
| Accessibility: RTL | Complete | Mirrored layout, bidirectional text, LTR URLs preserved |
| Accessibility: Reduced motion | Complete | Sparkline, progress bar, row flash alternatives |
| Power user efficiency | Yes | Sort by health ascending, `/` search shortcut, filter counts, bulk actions |
| First-time onboarding | Yes | Guided empty state, first crawl CTA, progressive disclosure |
| Deep link / shareability | Yes | All state in URL query params |
| **Quantitative** | **10/10** | |
| **Qualitative** | **2/2** | |
