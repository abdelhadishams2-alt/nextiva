# Screen Spec: Content Inventory

> **Route:** `/inventory`
> **Service:** Data Ingestion, Content Intelligence
> **Task:** T5-02
> **Type:** List + Filters
> **Priority:** P0
> **Spec Depth:** DEEP (target >= 8/10)

---

## 1. Overview

The Content Inventory is the complete map of a client's existing content. It displays every discovered URL from the site crawl alongside performance metrics from GSC, GA4, Semrush, and Ahrefs, unified into a single health-scored DataTable. This is the foundation of ChainIQ's intelligence layer: before the platform can recommend what to write, it must know what already exists and how it is performing.

Each URL is assigned a health score (0-100) and a content status classification (healthy, decaying, thin, old, no_meta, orphan, error, redirect, removed) based on automated analysis of traffic trends, ranking changes, content freshness, and on-page quality signals. The screen enables content teams to instantly identify which articles need attention, which are performing well, and which are cannibalizing each other. A slide-over detail panel provides deep-dive performance charts without losing the user's scroll position in the main table.

**TTG (Time-to-Goal) Reasoning:**

- **First visit (new user, no crawl):** Empty state with a prominent "Trigger Crawl" CTA. The user enters their site URL, clicks the button, and watches a real-time progress bar showing pages discovered and crawled. After 2-5 minutes, the table populates with their full content inventory. Eye immediately goes to the Health Score column (color-coded gradient from red to green).
- **First visit (after crawl completes):** DataTable with 2,847 URLs. Eye goes to Health Score column (color-coded). User clicks the column header to sort ascending -- decaying articles surface to the top. Clicks into the worst performer to see the 3-month trend chart in the slide-over panel.
- **100th visit (established user):** Checks the decay count badge in the sidebar ("Intelligence > Content Inventory (7)"). Clicks through. The table remembers last filter state (status = decaying). Scans the top 5 articles, clicks one to see trend, decides to send it to the Article Pipeline for refresh. Efficient: search by URL, filter by status, bulk export.
- **Agency admin (Marcus):** Switches between clients using the global client selector. Scans inventory stats banner (total URLs, decay count, average health score). Exports filtered results to CSV for the monthly client report.

---

## 2. Primary Action

Identify content health issues. Secondary: trigger a site crawl, open article detail panel, export data, navigate to Opportunities for action.

---

## 3. Route & Layout

**Route:** `/inventory`
**Parent Layout:** Main dashboard layout with sidebar. Sits in the "Intelligence" sidebar group.
**Auth:** Authenticated. All roles can view. Bulk actions require editor or admin role. Crawl trigger requires admin role.

### ASCII Wireframe

```
┌─────┬────────────────────────────────────────────────────────────────────┐
│     │  Content Inventory                    [Trigger Crawl] [Export ▾]  │
│  S  │──────────────────────────────────────────────────────────────────│
│  I  │                                                                    │
│  D  │  ┌─ Stats Bar ──────────────────────────────────────────────┐    │
│  E  │  │  2,847 URLs | Avg Health: 72 | 7 Decaying | 3 Thin |    │    │
│  B  │  │  Last Crawl: 2d ago                          [Stale ⚠]  │    │
│  A  │  └──────────────────────────────────────────────────────────┘    │
│  R  │                                                                    │
│     │  [Search URLs/titles...  ] [Status ▾] [Health ▾] [Language ▾]    │
│     │  [Author ▾] [Date Range ▾] [Clear Filters]                       │
│     │──────────────────────────────────────────────────────────────────│
│     │  □ URL/Title        Status  Health  Clicks  Impr.  Pos.  Author │
│     │  ────────────────────────────────────────────────────────────── │
│     │  □ /blog/n54-hpfp   [Decay] ██░░ 34 1,340  18.2K  6.1  Nadia  │
│     │  □ /blog/oil-change  [OK  ] ████ 78 2,100  24.1K  3.4  Ahmed  │
│     │  □ /blog/turbo-kit   [Thin] █░░░ 22   410   8.3K  14.2 Nadia  │
│     │  □ /guides/m3-comp   [OK  ] ████ 85 3,450  31.0K  2.1  Lina   │
│     │  □ /blog/e90-maint   [Old ] ██░░ 41   890  12.7K  8.9  Ahmed  │
│     │  ...                                                              │
│     │  ────────────────────────────────────────────────────────────── │
│     │  Showing 1-50 of 2,847          [← 1 2 3 ... 57 →]             │
│     │                                                                    │
│     │  ┌─────────────────────────────┬──────────────────────────────┐ │
│     │  │  (slide-over detail panel   │                              │ │
│     │  │   opens from right when     │       Table continues        │ │
│     │  │   a row is clicked)         │       underneath, dimmed     │ │
│     │  └─────────────────────────────┴──────────────────────────────┘ │
└─────┴────────────────────────────────────────────────────────────────────┘
```

---

## 4. Navigation

| Origin | Action | Destination |
|--------|--------|-------------|
| Sidebar | Intelligence > Content Inventory | `/inventory` |
| Dashboard Home | Click "Decaying Articles" widget | `/inventory?status=decaying` |
| Opportunities | "View in Inventory" link on decay alert | `/inventory?search=[url]` |
| Connections | After first crawl completes | `/inventory` (redirect) |
| This screen | Click row | Slide-over detail panel (no route change, URL param `?detail=[id]`) |
| This screen | Click "View in Opportunities" in detail panel | `/opportunities?search=[keyword]` |
| This screen | Click "Generate Refresh" in detail panel | `/articles/new?source=inventory&url=[url]` |
| This screen | Click "Trigger Crawl" | Stays on page, progress bar appears in Stats Bar |

---

## 5. Data Fields

### DataTable Columns

| Column | Type | Source | Sortable | Filterable | Width | Notes |
|--------|------|--------|----------|------------|-------|-------|
| Checkbox | boolean | local | No | No | 40px | Row selection for bulk actions |
| URL / Title | text (two-line) | `content_inventory.url`, `.title` | Yes (by title) | Search (debounced) | flex | URL truncated, title bold on second line. Tooltip: full URL |
| Status | badge | `content_inventory.status` | Yes | Dropdown (multi-select) | 90px | Color-coded: ok=green, thin=yellow, old=amber, decaying=orange, error=red, removed=gray |
| Health Score | progress bar + number | `performance_snapshots.health_score` (latest) | Yes (default desc) | Range slider (0-100) | 100px | Progress bar color gradient: 0-30 red, 31-60 amber, 61-80 green, 81-100 bright green |
| Clicks 30d | integer | `performance_snapshots` aggregated last 30 days | Yes | No | 80px | Sparkline inline (last 30 days). Right-aligned. Formatted with comma separator |
| Impressions 30d | integer | `performance_snapshots` aggregated last 30 days | Yes | No | 80px | Right-aligned. Abbreviated: 18.2K, 1.3M |
| Position | decimal | `performance_snapshots.avg_position` (latest) | Yes | No | 70px | One decimal. Color: green <= 3, amber 4-10, red > 10. Arrow indicator for trend |
| Author | text | `content_inventory.author` | Yes | Dropdown | 100px | Truncated at 15 chars |
| Published | date | `content_inventory.publish_date` | Yes | Date range picker | 90px | Relative: "2d ago", "3mo ago". Tooltip: absolute date |
| Last Crawled | date | `content_inventory.last_crawled_at` | Yes | No | 90px | Relative timestamp |

### Slide-Over Detail Panel Fields

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| Full URL | link | `content_inventory.url` | Clickable, opens in new tab |
| Title | text | `content_inventory.title` | Full, untruncated |
| Meta Description | text | `content_inventory.meta_description` | Shown with character count (target: 150-160) |
| H1 Text | text | `content_inventory.h1_text` | With match indicator vs title |
| Heading Structure | tree | `content_inventory.heading_structure` | Nested H1-H6 hierarchy visualization |
| Word Count | integer | `content_inventory.word_count` | With competitor average comparison |
| Internal Links | integer | `content_inventory.internal_link_count` | Low count warning (< 3) |
| External Links | integer | `content_inventory.external_link_count` | -- |
| Images | text | `content_inventory.image_count` / `images_with_alt_count` | "12 images, 8 with alt text" format |
| Schema Types | badges | `content_inventory.schema_types` | JSON-LD types as badge chips |
| Language | text | `content_inventory.language` | With RTL indicator if applicable |
| Content Hash | text | `content_inventory.content_hash` | Truncated. "Changed since last crawl" indicator |
| First Discovered | date | `content_inventory.first_discovered_at` | Absolute date |
| Performance Chart | TimelineChart | `performance_snapshots` (90 days) | Clicks, impressions, position overlaid. Dual Y-axis |
| Health Trend | TimelineChart | `performance_snapshots.health_score` (90 days) | Single line with threshold markers |
| Top Queries | table | `performance_snapshots.metadata.topQueries` | Top 10 queries driving traffic to this URL |
| Decay Signals | alert | Content Intelligence decay analysis | If decaying: shows detection methods, severity, recommended action |
| Cannibalization | alert | Content Intelligence cannibalization data | If cannibalized: shows conflicting URLs and keyword |

---

## 6. Component Tree

```
ContentInventoryPage
├── PageHeader
│   ├── Heading "Content Inventory"
│   ├── Button "Trigger Crawl" (shadcn/ui) — admin only
│   └── DropdownMenu "Export" (shadcn/ui)
│       ├── MenuItem "Export CSV (current filter)"
│       ├── MenuItem "Export CSV (all)"
│       └── MenuItem "Export JSON"
├── StatsBar (custom)
│   ├── StatCard × 5 — total URLs, avg health, decaying count, thin count, last crawl
│   └── AlertBanner (custom) — stale data warning (last crawl > 7 days)
├── FilterToolbar
│   ├── Input (shadcn/ui) — search with debounce (300ms)
│   ├── Select (shadcn/ui) — status filter (multi-select)
│   ├── Slider (shadcn/ui) — health score range (0-100)
│   ├── Select (shadcn/ui) — language filter
│   ├── Select (shadcn/ui) — author filter
│   ├── DatePicker (shadcn/ui) — published date range
│   └── Button "Clear Filters" (shadcn/ui, ghost variant)
├── DataTable (shadcn/ui)
│   ├── TableHeader — sortable column headers with aria-sort
│   ├── TableBody
│   │   └── TableRow × N
│   │       ├── Checkbox (shadcn/ui)
│   │       ├── UrlTitleCell (custom) — two-line: URL + title
│   │       ├── Badge (shadcn/ui) — status with color variant
│   │       ├── HealthScoreBar (custom) — Progress + number
│   │       ├── SparklineCell (custom) — inline 30-day click sparkline
│   │       ├── Text — impressions (abbreviated)
│   │       ├── PositionCell (custom) — number + trend arrow
│   │       ├── Text — author (truncated)
│   │       └── Text — published date (relative)
│   └── TableFooter
│       ├── BulkActionBar (custom) — visible when rows selected
│       │   ├── Text "N selected"
│       │   ├── Button "Export Selected"
│       │   └── Button "Re-crawl Selected"
│       └── Pagination (shadcn/ui)
├── CrawlProgressBar (custom) — visible during active crawl
│   ├── Progress (shadcn/ui) — determinate when total known
│   ├── Text — "Crawling: 1,247 / 2,847 pages"
│   ├── Text — "Estimated: 2m 15s remaining"
│   └── Button "Cancel Crawl" (shadcn/ui, ghost)
├── SlideOverPanel (custom, Sheet from shadcn/ui)
│   ├── PanelHeader
│   │   ├── Heading — article title
│   │   ├── Badge — status
│   │   ├── ScoreRing (custom) — health score
│   │   ├── Button "Open URL" (external link)
│   │   ├── Button "View in Opportunities" (link)
│   │   ├── Button "Generate Refresh" (primary CTA)
│   │   └── Button "Close" (X icon)
│   ├── ContentMetadata
│   │   ├── Meta description with char count
│   │   ├── H1 text with title-match indicator
│   │   ├── HeadingTree (custom) — nested heading visualization
│   │   ├── Word count with competitor comparison
│   │   ├── Link counts (internal / external)
│   │   ├── Image stats
│   │   └── Schema type badges
│   ├── PerformanceSection
│   │   ├── TimelineChart (custom, recharts) — clicks/impressions/position, 90 days
│   │   ├── TimelineChart (custom, recharts) — health score trend, 90 days
│   │   └── TopQueriesTable — top 10 queries for this URL
│   └── IntelligenceSection
│       ├── DecayAlert (custom) — if decay detected
│       │   ├── Severity badge
│       │   ├── Detection methods list
│       │   └── Recommended action button
│       └── CannibalizationAlert (custom) — if conflicts detected
│           ├── Conflicting URLs list
│           └── Resolution action button
├── Dialog (shadcn/ui) — "Trigger Crawl" form
│   ├── Input — site URL (pre-filled from GSC property)
│   ├── Input — max pages (default 10,000)
│   └── [Cancel] [Start Crawl]
├── AlertDialog (shadcn/ui) — crawl cancellation confirmation
└── Toast (shadcn/ui) — notifications
```

**Component Inventory:**

| Component | Source | Notes |
|-----------|--------|-------|
| DataTable | shadcn/ui | Server-side sorting, pagination. Column resizing via drag. |
| Input | shadcn/ui | Search field with debounce (300ms), magnifying glass icon |
| Select | shadcn/ui | Filter dropdowns. Multi-select for status filter. |
| Slider | shadcn/ui | Health score range filter (two-thumb slider) |
| Badge | shadcn/ui | Status badges with 8 color variants matching status enum |
| Button | shadcn/ui | Trigger Crawl, Export, Clear Filters, bulk actions |
| Pagination | shadcn/ui | Server-side. Shows page numbers + "Showing X-Y of Z" |
| Sheet | shadcn/ui | Slide-over detail panel from right edge |
| Dialog | shadcn/ui | Crawl trigger form |
| AlertDialog | shadcn/ui | Crawl cancellation, bulk action confirmations |
| Skeleton | shadcn/ui | Table row loading (10 skeleton rows on initial load) |
| Progress | shadcn/ui | Crawl progress bar, health score bars |
| DropdownMenu | shadcn/ui | Export options menu |
| DatePicker | shadcn/ui | Published date range filter |
| Toast | shadcn/ui | "Crawl started", "Export complete", error messages |
| Checkbox | shadcn/ui | Row selection + header "select all" |
| StatsBar | Custom | Aggregate inventory statistics at page top |
| AlertBanner | Custom | Stale data warning (last crawl > 7 days) |
| HealthScoreBar | Custom | Color-gradient progress bar + numeric score |
| SparklineCell | Custom | Tiny 30-day trend chart inline in table cell (recharts Sparkline) |
| PositionCell | Custom | Position number + colored trend arrow (up=green, down=red) |
| UrlTitleCell | Custom | Two-line cell: truncated URL (muted) + bold title |
| TimelineChart | Custom (recharts) | Dual Y-axis line chart for performance trends |
| HeadingTree | Custom | Nested tree visualization of H1-H6 structure |
| ScoreRing | Custom | Circular progress indicator for health score in panel header |
| DecayAlert | Custom | Decay detection summary with action button |
| CannibalizationAlert | Custom | Conflict summary with resolution link |

---

## 7. States (10 states)

### 7.1 Loading State

```
StatsBar shows 5 skeleton stat cards.
FilterToolbar disabled (inputs grayed out).
DataTable shows 10 skeleton rows with pulsing animation:
  Each row: checkbox placeholder, two-line text placeholder, badge placeholder,
  progress bar placeholder, 4 text placeholders.
Pagination hidden.
Duration: typically < 500ms (server-side paginated, returns 50 rows).
```

### 7.2 Empty State (No Crawl Yet)

```
StatsBar hidden.
FilterToolbar hidden.
DataTable area replaced by centered empty state:
  Illustration: stylized website with magnifying glass (SVG, dark-mode compatible).
  Heading: "No content discovered yet"
  Body: "Trigger a site crawl to build your content inventory.
         ChainIQ will discover all your pages, extract metadata,
         and calculate health scores."
  [Trigger First Crawl] button — large, primary variant, pulsing border.
  Below: "This typically takes 2-5 minutes for sites under 5,000 pages."
Prerequisite check: if no Google connection exists, show alternative:
  "Connect Google Search Console first to enable crawling."
  [Connect GSC →] link to /settings/connections
```

### 7.3 Crawling State (In Progress)

```
CrawlProgressBar appears between StatsBar and FilterToolbar.
Progress bar: determinate when total URLs known (from sitemap), indeterminate if homepage crawl.
Text: "Crawling: 1,247 / 2,847 pages discovered"
Sub-text: "Estimated time remaining: 2m 15s"
Cancel button (ghost variant) visible to the right.
If table was previously populated (re-crawl):
  Existing data remains visible underneath.
  StatsBar shows previous stats with "(updating...)" suffix.
If first crawl:
  Table shows rows appearing in real-time as pages are crawled.
  New rows animate in with a subtle fade+slide (200ms).
SSE connection to GET /api/inventory/crawl/progress/:jobId for real-time updates.
Events received: "discovered" (increment discovery count), "crawled" (add/update row),
  "error" (increment error count), "complete" (finalize UI).
```

### 7.4 Populated State (Data Present)

```
StatsBar: 5 stat cards with real numbers.
  Total URLs: 2,847 (with trend arrow vs last crawl)
  Avg Health: 72 (ScoreRing)
  Decaying: 7 (red text if > 0, with badge matching sidebar count)
  Thin: 3 (yellow text if > 0)
  Last Crawl: "2d ago" (green if < 7d, yellow if 7-14d, red if > 14d)
FilterToolbar: all filters enabled with current values.
DataTable: rows with real data. Default sort: health_score DESC.
Row hover: muted background highlight (zinc-800 on dark theme).
Row click: opens slide-over detail panel.
Pagination at bottom: "Showing 1-50 of 2,847 | ← 1 2 3 ... 57 →"
```

### 7.5 Filtered State (Subset Showing)

```
Active filters shown as pills above the DataTable:
  "Status: decaying" [×]  "Health: 0-50" [×]  "Author: Nadia" [×]
Each pill is removable by clicking the × icon.
"Clear Filters" button becomes primary variant (visible call to action).
StatsBar updates to show filtered totals: "Showing 7 of 2,847 URLs"
Pagination reflects filtered count.
Export respects active filters ("Export CSV (7 filtered URLs)").
```

### 7.6 Filtered Empty State (No Matches)

```
DataTable area replaced by:
  Icon: filter funnel with X mark.
  Heading: "No articles match your filters"
  Body: "Try broadening your search or removing some filters."
  [Clear Filters] button.
StatsBar remains visible (shows total inventory count for context).
FilterToolbar remains interactive (user can adjust filters).
```

### 7.7 Detail Panel Open State

```
Sheet component slides in from the right (480px wide on desktop, full-width on mobile).
Table remains visible but dimmed (overlay with 50% opacity dark backdrop).
Panel contents load with skeleton placeholders, then populate:
  Header: title, status badge, ScoreRing, action buttons
  Content metadata: meta description, headings, word count, links, images, schema
  Performance charts: 90-day TimelineCharts for clicks/impressions and health
  Top queries table: 10 rows of keyword, clicks, impressions, position
  Intelligence alerts: decay and cannibalization if applicable
URL updates to include detail parameter: /inventory?detail=a1b2c3d4
Back button or clicking outside the panel closes it.
Scroll position in main table is PRESERVED when panel closes.
```

### 7.8 Loading More State (Pagination)

```
When user clicks next page or scrolls to trigger pagination:
  Current table rows fade slightly (opacity 0.6).
  Skeleton rows appear briefly (typically < 300ms for server response).
  New rows fade in, replacing skeletons.
  Scroll position resets to top of table.
URL updates query params: /inventory?page=2&sort=health_score&order=asc
```

### 7.9 Stale Data State (Last Crawl > 7 Days)

```
AlertBanner appears below StatsBar:
  Warning variant (amber left border, amber text on dark background).
  Text: "Your content inventory was last crawled 12 days ago. Data may be outdated."
  [Trigger Re-crawl] button inline.
  [Dismiss] button (stores dismissal in localStorage, re-shows after 7 more days).
StatsBar "Last Crawl" stat shows red text: "12d ago"
Data remains fully functional — stale warning is informational only.
```

### 7.10 Error State (Crawl Failed)

```
If crawl fails mid-way:
  CrawlProgressBar turns red. Progress bar stops.
  Text: "Crawl failed: [error message from crawl_sessions.error_log]"
  Sub-text: "1,247 of 2,847 pages were successfully crawled before the error."
  [Retry Crawl] button. [View Error Log] button (expands error_log JSONB).
If API fails on page load:
  Alert (destructive) replaces table:
  "Unable to load content inventory. Please ensure the bridge server is running."
  [Retry] button centered below.
  StatsBar shows skeleton (does not show stale cached data — no client-side cache for inventory).
```

---

## 8. Interactions (10 interactions)

### 8.1 Search by URL or Title

```
1. User types in search input (placeholder: "Search URLs, titles, or authors...")
2. Input debounces at 300ms
3. After debounce: frontend calls GET /api/inventory?search=n54+hpfp&page=1&limit=50
4. Server performs trigram match against url, title, and author fields
5. Results update in DataTable. Active search term shown as filter pill.
6. Minimum query length: 2 characters. Below 2: no search executed.
7. Empty results: filtered empty state (7.6)
8. Clear search: click × in input or remove search pill
```

### 8.2 Filter by Status

```
1. User clicks Status dropdown
2. Multi-select popover opens with checkboxes:
   □ OK (2,831)  □ Thin (3)  □ Old (4)  □ Decaying (7)
   □ No Meta (12)  □ Orphan (0)  □ Error (2)  □ Redirect (8)  □ Removed (0)
3. Counts shown next to each option (fetched from GET /api/inventory/stats)
4. User checks "Decaying" and "Thin" → popover closes on blur
5. Frontend calls GET /api/inventory?status=thin,decaying&page=1
6. Filter pill appears: "Status: decaying, thin" [×]
7. Table updates with filtered results
```

### 8.3 Sort by Column

```
1. User clicks column header (e.g., "Health Score")
2. First click: sort ascending (lowest health first — decaying articles surface)
3. Second click: sort descending (healthiest first)
4. Third click: remove sort (return to default)
5. Sort indicator arrow appears in column header
6. Frontend calls GET /api/inventory?sort=health_score&order=asc&page=1
7. Server-side sort (never client-side — dataset too large)
8. aria-sort attribute updates on the header cell
```

### 8.4 Click Row to Open Detail Panel

```
1. User clicks anywhere on a table row (except checkbox)
2. Sheet slides in from right (300ms ease-out animation)
3. URL updates: /inventory?detail=a1b2c3d4-uuid
4. Panel header loads immediately (title + status from table row data)
5. Panel body shows skeleton while fetching:
   - GET /api/inventory/:id (full content_inventory row)
   - GET /api/inventory/:id/history?days=90 (performance timeseries)
6. Charts render after data arrives (recharts, < 200ms render)
7. User can scroll within the panel independently of the main table
8. Click outside panel or press Escape: panel closes, URL reverts
9. Scroll position in main table is PRESERVED (no re-render)
10. Deep link support: navigating directly to /inventory?detail=uuid opens panel on load
```

### 8.5 Trigger Site Crawl

```
1. User clicks "Trigger Crawl" button in page header
2. Dialog opens with crawl configuration:
   - Site URL (pre-filled from GSC property: "https://bmwtuning.com")
   - Max pages (default 10,000, min 100, max 50,000)
   - Discovery method: Sitemap (default) or Homepage Crawl
3. User clicks "Start Crawl"
4. Frontend calls POST /api/inventory/crawl { site_url, max_pages }
5. Server returns 202 Accepted with { job_id, status: "running" }
6. Dialog closes. CrawlProgressBar appears (state 7.3)
7. Frontend opens SSE connection for real-time progress
8. On complete: Toast (success): "Crawl complete. 2,847 pages discovered."
   StatsBar and table refresh. Progress bar fades out.
9. Rate limit: max 1 crawl per hour per user. If exceeded:
   Dialog shows warning: "Please wait [N minutes] before triggering another crawl."
```

### 8.6 Cancel Active Crawl

```
1. User clicks "Cancel Crawl" in CrawlProgressBar
2. AlertDialog: "Cancel the active crawl?"
   Body: "1,247 pages have been crawled so far. This data will be preserved.
   You can re-crawl later to complete the inventory."
   [Continue Crawling] [Cancel Crawl]
3. Confirm: frontend calls POST /api/inventory/crawl/:jobId/cancel
4. Server marks crawl_session as "cancelled"
5. CrawlProgressBar shows "Crawl cancelled. 1,247 pages processed."
6. Partial inventory data is preserved and visible in the table
```

### 8.7 Bulk Select and Export

```
1. User checks header checkbox → all visible rows selected
2. Or: user checks individual row checkboxes (shift+click for range select)
3. BulkActionBar appears above pagination: "12 selected"
4. User clicks "Export Selected" dropdown:
   - "Export as CSV" → downloads file with selected rows
   - "Export as JSON" → downloads file with selected rows
5. Export includes ALL columns (not just visible ones):
   url, title, status, health_score, clicks_30d, impressions_30d, avg_position,
   author, publish_date, word_count, meta_description, h1_text, internal_links,
   external_links, image_count, schema_types, language, last_crawled_at
6. Filename: chainiq-inventory-[date]-[filter-description].csv
7. Large exports (> 5,000 rows): async export with Toast progress notification
```

### 8.8 Bulk Re-crawl Selected URLs

```
1. User selects specific rows (e.g., 5 articles suspected of having stale data)
2. BulkActionBar shows "5 selected" + [Re-crawl Selected] button
3. Click: AlertDialog confirms "Re-crawl 5 URLs? This will update their metadata
   and performance data."
4. Frontend calls POST /api/inventory/crawl with { urls: [...], mode: "selective" }
5. Selective crawl runs only the specified URLs (faster than full crawl)
6. Toast: "Re-crawling 5 URLs..."
7. Rows update individually as each URL is re-crawled (SSE events)
```

### 8.9 Navigate to Action from Detail Panel

```
1. In slide-over panel, user sees decay alert:
   "This article has lost 34% of clicks over 3 months."
   Severity: High. Detection: click_decline, position_drop, content_age.
   Recommended action: update_existing.
2. User clicks "Generate Refresh" button in panel header
3. Frontend navigates to /articles/new?source=inventory&url=[encoded-url]&action=refresh
4. Article Pipeline pre-fills: topic from existing title, context from decay evidence
5. Alternatively: "View in Opportunities" navigates to /opportunities?search=[keyword]
   to see the full recommendation with scoring breakdown
```

### 8.10 Health Score Range Filter

```
1. User clicks "Health" filter dropdown
2. Two-thumb slider appears: min 0, max 100
3. User drags left thumb to 0, right thumb to 40
4. Live preview: count updates as thumbs move ("showing ~23 results")
5. On release: frontend calls GET /api/inventory?health_min=0&health_max=40&page=1
6. Filter pill: "Health: 0-40" [×]
7. Results show only low-health articles (decaying, thin, problematic)
```

---

## 9. Keyboard Navigation

| Key | Context | Action |
|-----|---------|--------|
| `Tab` | Page load | Focus: Header buttons → StatsBar → Search input → Filters → DataTable → Pagination |
| `Enter` | Row focused | Opens slide-over detail panel for that row |
| `Space` | Row focused | Toggles checkbox selection for that row |
| `Escape` | Detail panel open | Closes panel, returns focus to the row that opened it |
| `Escape` | Dialog open | Closes dialog, returns focus to trigger button |
| `Arrow Up/Down` | DataTable body | Navigate between rows |
| `Arrow Left/Right` | Pagination | Navigate between pages |
| `Shift+Click` | Row checkbox | Range select (all rows between last selected and current) |
| `Ctrl+A` / `Cmd+A` | DataTable focused | Select all rows on current page |
| `Ctrl+Shift+E` | Any | Keyboard shortcut for export (current filter) |
| `/` | Any (not in input) | Focus search input (vim-style quick search) |
| `Tab` | Inside detail panel | Navigate panel sections: metadata → charts → queries → alerts |

---

## 10. Mobile Behavior

- **Breakpoint: < 768px** — DataTable converts to card layout. Each card shows:
  - Title (bold, full width)
  - URL (muted, truncated with ellipsis)
  - Status badge + Health score (ScoreRing, side by side)
  - Clicks and Impressions (two columns)
  - Position (with trend arrow)
- **Card tap:** Opens slide-over as full-screen bottom sheet (Sheet component, height: 90vh).
- **Search:** Full-width search bar pinned at top. Filters collapse into a "Filter" button that opens a filter Sheet from bottom.
- **StatsBar:** Horizontal scroll with snap points for stat cards.
- **Pagination:** Replaced by "Load more" button at bottom (infinite scroll). Loads 25 items per batch.
- **Bulk selection:** Long-press on a card enters selection mode. Selection checkboxes appear on all cards. Bottom action bar slides up with bulk actions.
- **Export:** Generates file and triggers native share sheet (Web Share API) on mobile.
- **Crawl progress:** Sticky bottom bar with progress text and cancel button.
- **Detail panel charts:** Simplified to single-metric view with swipe-to-switch (clicks → impressions → position). Full dual-axis chart too complex for narrow screens.

---

## 11. Accessibility (WCAG 2.1 AA)

- **DataTable semantics:** Proper `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>` elements. Never div-based table layouts.
- **Sortable headers:** `<th>` elements have `role="columnheader"` with `aria-sort="ascending"`, `"descending"`, or `"none"`. Click handlers also on Enter/Space.
- **Health score bars:** `role="meter"`, `aria-valuenow="72"`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-label="Health score: 72 out of 100"`. Color NEVER sole indicator — number always visible.
- **Status badges:** Text label always present. Not color-only. `aria-label` on badge: "Status: decaying".
- **Sparkline charts:** Decorative only (aria-hidden="true"). Adjacent text provides the data: "1,340 clicks". Screen readers skip the sparkline and read the number.
- **Slide-over panel:** `role="dialog"`, `aria-labelledby` pointing to article title. Focus trapped inside panel. Tab order: close button → metadata → charts → actions. Escape closes.
- **Row selection:** `aria-selected="true"` on selected rows. Bulk action bar announced via `aria-live="polite"`: "12 rows selected. Export and re-crawl actions available."
- **Search input:** `aria-label="Search content inventory by URL, title, or author"`. `aria-describedby` for result count: "Showing 7 results for 'n54'".
- **Loading announcements:** `aria-busy="true"` on table during load. `aria-live="polite"` region announces: "Loading content inventory..." and "2,847 articles loaded."
- **Crawl progress:** `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`. Status text announced via `aria-live="polite"` every 10% increment.
- **Focus management:** After pagination, focus moves to first row of new page. After filter change, focus stays on the filter control. After panel close, focus returns to the row that opened it.
- **Color contrast:** All text meets 4.5:1. Health score gradient colors tested against dark background. Status badge text tested against badge background.

---

## 12. Error Handling

| Error Scenario | HTTP Code | User-Facing Message | Recovery Action |
|----------------|-----------|---------------------|-----------------|
| API failure on page load | 500 / timeout | "Unable to load content inventory. Please check your connection and try again." | Retry button. Does not show cached stale data. |
| Search returns error | 500 | "Search failed. Try again or clear your search." | Clear search button. Retry after 3 seconds. |
| Crawl trigger fails — no GSC connection | 400 | "Connect Google Search Console first to enable crawling." | Link to /settings/connections. |
| Crawl trigger fails — already running | 409 | "A crawl is already in progress. Wait for it to complete or cancel it." | Show crawl progress bar. Link to cancel. |
| Crawl trigger fails — rate limited | 429 | "Crawl rate limit reached. You can trigger another crawl in [N] minutes." | Show countdown timer. |
| Crawl fails mid-execution | varies | "Crawl encountered errors on [N] pages. [M] pages were successfully crawled." | Show error log. Offer "Retry Failed Pages" button. |
| SSE connection drops during crawl | N/A | "Lost connection to crawl progress. Reconnecting..." | Auto-reconnect SSE (exponential backoff: 1s, 2s, 4s). Fall back to polling GET /api/inventory/crawl/progress/:jobId every 5 seconds. |
| Detail panel fails to load | 404 / 500 | "Unable to load article details. The article may have been removed." | Close panel button. Refresh table. |
| Performance history unavailable | 404 | "No performance data available for this article yet. Data appears after the first sync." | Show placeholder message in chart area. |
| Export fails (large dataset) | 500 / timeout | "Export failed. Try exporting a smaller set of articles using filters." | Suggest filtering first. Retry button. |
| Bridge server unreachable | ECONNREFUSED | "Cannot reach the server. Please ensure the bridge server is running." | Retry button. Troubleshooting link. |

---

## 13. Edge Cases (7 cases)

1. **10,000+ URL inventory:** Server-side pagination ensures the client never loads more than 200 rows per request (configurable, default 50). DataTable does NOT use virtualization — pagination is sufficient. Search uses the trigram GIN index for sub-100ms response times even on large inventories. Export of 10,000+ rows uses async streaming (server generates CSV in chunks, sends download link via Toast when ready).

2. **URL with extremely long path (500+ chars):** The UrlTitleCell component truncates the URL at 80 characters with ellipsis. Full URL shown in tooltip on hover and in the slide-over detail panel. Table column width does not expand — `text-overflow: ellipsis` with `max-width` constraint.

3. **Article with no title (title extraction failed):** Title falls back to H1 text. If H1 is also null, shows the URL path as title (e.g., "/blog/n54-hpfp-guide" becomes "n54 hpfp guide"). Status badge shows "no_meta" if meta_description is also missing.

4. **Performance data not yet available (just crawled, no GSC sync yet):** Health Score column shows "—" (em dash) with tooltip: "Performance data not yet available. Health scores appear after the first GSC sync." Sparkline is empty (flat gray line). Position shows "—". The row is still sortable — null values sort to the end.

5. **User navigates directly to /inventory?detail=invalid-uuid:** API returns 404 for the detail endpoint. Panel shows error state: "This article was not found. It may have been removed during a recent crawl." Panel auto-closes after 3 seconds with fade-out. URL reverts to /inventory.

6. **Concurrent crawl from another browser tab:** The 409 conflict response from POST /api/inventory/crawl tells the user a crawl is already running. The frontend can detect this and show the CrawlProgressBar by calling GET /api/inventory/crawl/progress/:jobId for the active crawl session (fetched from GET /api/ingestion/status which reports active jobs).

7. **Arabic/RTL article titles in the table:** Content with `language: "ar"` renders with `dir="rtl"` on the title cell only. The table layout remains LTR (standard data table direction). The UrlTitleCell component detects `content_inventory.language` and applies the `dir` attribute. The slide-over panel also applies `dir="rtl"` to the heading structure visualization and meta description if the content is Arabic.

---

## 14. Data Sources (API Endpoints Called)

| Action | Endpoint | Method | When |
|--------|----------|--------|------|
| Load inventory page | `GET /api/inventory` | GET | Page mount, filter change, sort change, pagination |
| Load inventory stats | `GET /api/inventory/stats` | GET | Page mount (parallel with inventory), after crawl complete |
| Search inventory | `GET /api/inventory?search=...` | GET | Search input debounce (300ms) |
| Load detail panel | `GET /api/inventory/:id` | GET | Row click (slide-over panel) |
| Load performance history | `GET /api/inventory/:id/history?days=90` | GET | Detail panel mount (parallel with inventory/:id) |
| Trigger crawl | `POST /api/inventory/crawl` | POST | "Start Crawl" in dialog |
| Crawl progress stream | `GET /api/inventory/crawl/progress/:jobId` | SSE | During active crawl |
| Cancel crawl | `POST /api/inventory/crawl/:jobId/cancel` | POST | "Cancel Crawl" button |
| Check connection status | `GET /api/connections/status` | GET | Empty state (check if GSC connected) |
| Get ingestion status | `GET /api/ingestion/status` | GET | Check for active crawl on page mount |
| Load decay data | `GET /api/intelligence/decay` | GET | Detail panel (if decay signals present) |
| Load cannibalization | `GET /api/intelligence/cannibalization` | GET | Detail panel (if conflicts detected) |

**Data freshness strategy:** No automatic polling on the inventory page (unlike Connections). Data refreshes on user-initiated actions: filter change, sort change, manual page refresh. The StatsBar "Last Crawl" timestamp is the primary staleness indicator. The sidebar badge count for decaying articles updates on every sidebar render (fetched from GET /api/inventory/stats, cached for 5 minutes client-side).

---

## 15. Performance

- **Initial load:** Two parallel API calls: `GET /api/inventory?page=1&limit=50` (< 200ms server-side with indexes) and `GET /api/inventory/stats` (< 100ms, aggregate query). Total perceived load: < 500ms.
- **Server-side pagination:** All filtering, sorting, and pagination happens on the server. Client never receives more than 200 rows. This makes the page performant even for inventories with 50,000+ URLs.
- **Search performance:** Trigram GIN index on `url` and `title` fields enables sub-100ms search responses even on large inventories. The 300ms debounce prevents excessive API calls during typing.
- **Detail panel load:** Two parallel calls: inventory/:id (< 50ms) and inventory/:id/history (< 200ms for 90 days of daily snapshots). Charts render via recharts in < 200ms after data arrives. Total panel load: < 500ms perceived.
- **Sparkline cells:** Inline sparklines use a lightweight recharts Sparkline component (< 1KB per cell). With 50 rows visible, this adds < 50KB of SVG to the DOM. No canvas rendering needed at this scale.
- **SSE for crawl progress:** Single persistent connection during crawl. Events fire per-page (not per-batch), enabling smooth real-time updates. Connection drops handled by automatic reconnection with exponential backoff.
- **Export:** CSV generation for < 1,000 rows is synchronous (< 500ms). For 1,000-10,000 rows, async with progress Toast. For > 10,000 rows, server-side streaming with download link notification.
- **Bundle impact:** SparklineCell and HealthScoreBar are custom components < 3KB each. TimelineChart (recharts) is the heaviest dependency but is lazy-loaded only when the detail panel opens (code-split via Next.js dynamic import). Total page JS: < 60KB gzipped (excluding recharts lazy chunk).
- **No client-side caching for inventory data:** Inventory data changes with every crawl and sync. Caching would show stale data. Instead, rely on fast server queries with proper indexes.

---

## 16. Dependencies

- **Blocks:** Opportunities screen (screen 11) uses inventory data for decay alerts and cannibalization view
- **Blocked by:** Connections (screen 9) — at least one GSC connection required for crawling. Data Ingestion Service (service 7) — crawl and inventory endpoints.
- **Service:** Data Ingestion (`data-ingestion.md`) — inventory, crawl, stats endpoints. Content Intelligence (`content-intelligence.md`) — decay and cannibalization data for detail panel.
- **Shared components:** StatusDot (from Connections), ScoreRing (also used in Opportunities, Performance), TimelineChart (also used in Performance), AlertBanner (also used in Dashboard Home)
