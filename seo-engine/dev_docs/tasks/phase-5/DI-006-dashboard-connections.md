# DI-006: Dashboard — Connections & Content Inventory Pages

> **Phase:** 5 | **Priority:** P1 | **Status:** NOT STARTED
> **Effort:** XL (16h) | **Type:** feature
> **Sprint:** 3 (Weeks 5-6)
> **Depends On:** DI-001 (OAuth endpoints), DI-004 (content inventory endpoints), DI-005 (scheduler status endpoints)
> **Assigned:** Unassigned

## Context Header

Before starting, read:

1. `CLAUDE.md` (auto-loaded)
2. `dev_docs/specs/database/unified-schema.md` — content_inventory columns for table display
3. `bridge/server.js` — `/api/connections/*` endpoints from DI-001, `/api/ingestion/*` from DI-004/005
4. `dashboard/` — existing Next.js 16 dashboard structure, shadcn/ui components
5. `dev_docs/tribunal/10-deliverables/phase-a-backlog.md` — Stories #18 and #19 (Connections and Inventory pages)
6. `dev_docs/tribunal/08-roadmap/phase-a-sprint-plan.md` — Sprint 3 dashboard details

## Objective

Build two dashboard pages: (1) Connections page at `/settings/connections` with OAuth cards showing connection status dots, "Connect Google" button with OAuth redirect, and freshness indicators; (2) Content Inventory page at `/inventory` with a DataTable displaying all crawled URLs with filters, search, column sorting, pagination, a detail slide-over panel with URL metadata and performance timeline, and sidebar navigation items for both pages. Add all required API client methods to `api.ts`.

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `dashboard/src/app/settings/connections/page.tsx` | Connections page with OAuth cards, status dots, freshness banner |
| CREATE | `dashboard/src/app/inventory/page.tsx` | Content Inventory page with DataTable, filters, search, detail slide-over |
| CREATE | `dashboard/src/components/connections/oauth-card.tsx` | OAuth connection card with status dot, sync info, connect/disconnect actions |
| CREATE | `dashboard/src/components/connections/freshness-banner.tsx` | Data freshness warning banner (yellow >24h, red >48h) |
| CREATE | `dashboard/src/components/inventory/inventory-table.tsx` | DataTable with sortable columns, pagination, search |
| CREATE | `dashboard/src/components/inventory/inventory-filters.tsx` | Filter bar: status, date range, word count range |
| CREATE | `dashboard/src/components/inventory/detail-slideover.tsx` | Slide-over panel with URL metadata, heading structure, performance timeline |
| CREATE | `dashboard/src/components/inventory/timeline-chart.tsx` | SVG-based sparkline chart showing clicks/impressions over time |
| MODIFY | `dashboard/src/lib/api.ts` | Add API client methods for connections and inventory endpoints |
| MODIFY | `dashboard/src/components/layout/sidebar.tsx` | Add Connections and Inventory nav items |

## Sub-tasks

### Sub-task 1: API client methods (~2h)

- Add to `dashboard/src/lib/api.ts`:
  - `getGoogleAuthUrl()` — `GET /api/connections/google/auth` -> returns `{ authUrl }`
  - `getConnections()` — `GET /api/connections` -> returns connection list
  - `getConnectionStatus()` — `GET /api/connections/status` -> returns health summary
  - `triggerCrawl(siteUrl, maxPages?)` — `POST /api/ingestion/crawl`
  - `getCrawlStatus(sessionId)` — `GET /api/ingestion/crawl/status/:sessionId`
  - `getInventory(params)` — `GET /api/inventory?status=&search=&sort=&page=&per_page=`
  - `getInventoryItem(id)` — `GET /api/inventory/:id` with performance history
  - `getScheduleStatus()` — `GET /api/ingestion/schedule`
  - `triggerGSCPull()` — `POST /api/ingestion/trigger/gsc`
  - `triggerGA4Pull()` — `POST /api/ingestion/trigger/ga4`
- All methods typed with TypeScript interfaces matching API response shapes

### Sub-task 2: Connections page (~4h)

- Create page at `dashboard/src/app/settings/connections/page.tsx`
- **Layout:**
  - Header: "Data Connections" title + schedule status summary
  - Freshness banner (if any source stale)
  - Grid of OAuth cards (responsive: 1-3 columns)
  - Schedule overview section
- **OAuth card** (`oauth-card.tsx`):
  - Provider icon (Google logo for GSC/GA4)
  - Connection name ("Google Search Console", "Google Analytics 4")
  - **Status dot:** Green circle (connected, <24h), yellow (connected, >24h stale), red (>48h or expired), gray (not connected)
  - Last sync timestamp (relative: "2 hours ago", "3 days ago")
  - Sync count and error info (if any)
  - **Actions:**
    - "Connect Google" button -> calls `getGoogleAuthUrl()`, redirects to Google OAuth
    - "Disconnect" button with confirmation dialog
    - "Sync Now" button -> triggers manual pull
  - Handle `?connected=google` URL param on page load: show success toast
- **Freshness banner** (`freshness-banner.tsx`):
  - Yellow: "Data last updated X hours ago" when >24h
  - Red: "Data connection expired — reconnect your Google account" when status='expired'
  - Dismissable but re-appears on page reload if still stale
- **Schedule overview:** Card showing next scheduled pulls for each source

### Sub-task 3: Content Inventory page (~5h)

- Create page at `dashboard/src/app/inventory/page.tsx`
- **Layout:**
  - Header: "Content Inventory" title + crawl status indicator + "Crawl Site" button
  - Filter bar
  - DataTable (main content)
  - Detail slide-over (opens on row click)
- **DataTable** (`inventory-table.tsx`):
  - Columns:
    - URL (truncated, full on hover tooltip)
    - Title (truncated)
    - Status badge (ok=green, thin=yellow, old=orange, no_meta=red, error=gray)
    - Word Count
    - H2 Count
    - Internal Links
    - Images
    - Health Score (color bar: green >70, yellow 40-70, red <40)
    - Last Crawled (relative date)
  - **Server-side pagination:** 50 items per page (content_inventory may have 10K+ rows)
  - **Column sorting:** Click column header to sort ASC/DESC
  - **Search:** Text search on URL and title (server-side for >1000 rows, client-side for smaller sets)
  - **Row click:** Opens detail slide-over panel
- **Filters** (`inventory-filters.tsx`):
  - Status dropdown: All, OK, Thin, Old, No Meta, Error
  - Date range: Published after / before
  - Word count: Min / Max slider
  - "Clear filters" button
- **Detail slide-over** (`detail-slideover.tsx`):
  - Slide-over panel from right (40% width on desktop, full width on mobile)
  - Sections:
    - **Overview:** Full URL (clickable), title, meta description, H1
    - **Metadata:** Author, publish date, modified date, language, word count
    - **Structure:** Heading hierarchy visualization (indented list), schema types badges
    - **Links:** Internal link count, external link count, image count (with alt coverage %)
    - **Performance:** Timeline chart showing clicks/impressions over last 90 days
    - **Status:** Current status badge with classification reason
  - Close button and Esc key to dismiss
- **Timeline chart** (`timeline-chart.tsx`):
  - Pure SVG sparkline (no chart library)
  - Dual line: clicks (blue) and impressions (gray)
  - X axis: dates (last 90 days, showing monthly labels)
  - Y axis: auto-scaled
  - Hover: show exact value tooltip
  - Props: `{ data: Array<{ date, clicks, impressions }> }`

### Sub-task 4: Sidebar navigation (~1h)

- Add two nav items to `dashboard/src/components/layout/sidebar.tsx`:
  - **"Connections"** under Settings section: route `/settings/connections`, icon: LinkIcon
  - **"Content Inventory"** in main nav: route `/inventory`, icon: FileTextIcon or ListIcon
- Active state highlighting for current route
- Content Inventory shows badge with total URL count (fetched from API)
- Ensure RTL layout compatibility (CSS logical properties: `margin-inline-start`, `padding-inline-end`)

### Sub-task 5: RTL support and empty states (~2h)

- All components render correctly in RTL mode:
  - DataTable: right-aligned text columns, mirrored sort icons
  - Slide-over: opens from left in RTL
  - Status dots: position relative to text direction
  - Timeline chart: X axis direction unaffected (time always left-to-right)
- **Empty states:**
  - Connections: "Connect your Google account to start ingesting performance data" with CTA button
  - Inventory (no crawl): "Run your first crawl to discover your content" with CTA button
  - Inventory (crawl in progress): progress indicator with URL count
- Loading states: skeleton rows for DataTable, skeleton cards for OAuth cards

## Acceptance Criteria

- [ ] Connections page at `/settings/connections` with Google OAuth cards
- [ ] "Connect Google" button initiates OAuth flow via `getGoogleAuthUrl()` redirect
- [ ] Status dots: green (<24h fresh), yellow (>24h stale), red (>48h or expired), gray (disconnected)
- [ ] Freshness banner appears when data >24h stale
- [ ] "Disconnect" button with confirmation dialog
- [ ] "Sync Now" triggers manual pull with loading state
- [ ] Content Inventory page at `/inventory` with DataTable
- [ ] Server-side pagination (50/page) handles 10K+ URLs
- [ ] Column sorting (click header) for all sortable columns
- [ ] Text search on URL and title
- [ ] Filter by status, date range, word count
- [ ] Row click opens detail slide-over with full metadata and performance timeline
- [ ] SVG timeline chart shows clicks/impressions over 90 days
- [ ] Sidebar nav items added for both pages
- [ ] Empty states guide users to connect or crawl
- [ ] All components render correctly in RTL mode
- [ ] Loading and error states handled for all async operations

## Test Requirements

### Unit Tests

- OAuth card renders correct status dot color for each state
- Freshness banner appears when last_sync > 24 hours ago
- DataTable renders correct number of rows per page
- Filter state correctly combines status + date range + word count
- Detail slide-over displays all metadata fields
- Timeline SVG renders correct path from data points

### Integration Tests

- Connections page loads connections from API, displays cards
- "Connect Google" generates auth URL and initiates redirect
- Inventory page loads with server-side pagination (mock 500 URLs)
- Search narrows results correctly
- Sort toggles between ASC/DESC
- Slide-over loads detail data for specific inventory item
- RTL mode: all components render without layout breakage

## Dependencies

- Blocked by: DI-001 (OAuth endpoints), DI-004 (content_inventory data), DI-005 (scheduler status)
- Blocks: CI-005 (intelligence dashboard follows same patterns)
