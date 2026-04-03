# PB-005: Dashboard Publish Manager Page

> **Phase:** 9 | **Priority:** P1 | **Status:** NOT STARTED
> **Effort:** L (8h) | **Type:** feature
> **Sprint:** 9 (Weeks 17-18)
> **Backlog Items:** Universal Publishing — Dashboard UI
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `PROJECT-BRIEF.md` — Section "Layer 5: Universal Publishing" for platform list
3. `bridge/server.js` — `/api/publish/:platform/push` generic route, adapter registry from PB-004
4. `bridge/publishing/payload.js` — Universal Article Payload from PB-001
5. `dashboard/` — existing Next.js 16 dashboard structure, shadcn/ui component patterns
6. `dashboard/app/` — existing page layout and navigation patterns

## Objective
Build the Publish Manager dashboard page at `/publish` that displays connected publishing platforms, a publish queue showing article-platform-status mappings, and a "Publish to..." action flow. Users should see at a glance which platforms are connected, what has been published where, and be able to push articles to any configured platform with a single action.

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `dashboard/app/publish/page.tsx` | Main publish manager page — server component |
| CREATE | `dashboard/components/publish/platform-cards.tsx` | Connected platform cards with status indicators |
| CREATE | `dashboard/components/publish/publish-queue.tsx` | DataTable showing publish history and pending items |
| CREATE | `dashboard/components/publish/publish-dialog.tsx` | "Publish to..." action dialog with platform selection |
| CREATE | `dashboard/components/publish/platform-config.tsx` | Platform configuration form (credentials, settings) |
| MODIFY | `dashboard/app/layout.tsx` | Add "Publish" item to main navigation sidebar |
| CREATE | `tests/dashboard-publishing.test.js` | Component and integration tests |

## Sub-tasks

### Sub-task 1: Platform Cards Component (~2h)
- Create `dashboard/components/publish/platform-cards.tsx`
- Grid of platform cards (2-4 columns, responsive)
- Each card shows:
  - **Platform icon:** WordPress (blue W), Shopify (green bag), Contentful (yellow), Ghost (white ghost), Webflow (blue), Sanity (red), Webhook (gray link icon)
  - **Platform name** and connection status badge: Connected (green), Disconnected (gray), Error (red)
  - **Stats:** Articles published count, last publish date
  - **Actions:** "Configure" button (opens config form), "Disconnect" button (with confirmation)
- Disconnected platforms show "Connect" button that opens `PlatformConfig` form
- Visual distinction: connected cards have colored left border, disconnected are muted/outlined
- Props: `{ platforms: Array<{ name, slug, status, articleCount, lastPublish, config }> }`
- Fetch platform data from `GET /api/publish/platforms` (bridge endpoint listing user's connections)

### Sub-task 2: Publish Queue DataTable (~2h)
- Create `dashboard/components/publish/publish-queue.tsx`
- DataTable (reuse existing DataTable pattern from dashboard) with columns:
  - **Article:** Title with link to article detail page
  - **Platform:** Icon + name
  - **Status:** Badge — Queued (blue), Publishing (yellow spinner), Published (green check), Failed (red X)
  - **Published URL:** Clickable link to the published article on the remote platform (shown when Published)
  - **Date:** Relative timestamp ("2 hours ago", "Mar 15, 2026")
  - **Actions:** "Retry" button (for Failed), "View" link (for Published)
- Sortable by date, platform, status
- Filterable: "All", "Published", "Failed", "Queued" filter pills
- Pagination: 20 items per page with page navigation
- Empty state: "No articles published yet. Generate an article and publish it to any platform."
- Fetch data from `GET /api/publish/history` with query params for filtering and pagination

### Sub-task 3: Publish Dialog (~2h)
- Create `dashboard/components/publish/publish-dialog.tsx`
- Triggered by "Publish to..." button (available on article detail pages and in article list)
- **Step 1 — Select article:** If not pre-selected, show article dropdown/search
- **Step 2 — Select platform:** Grid of connected platform cards (only connected platforms, disabled for disconnected)
- **Step 3 — Configure options:**
  - Platform-specific options rendered dynamically:
    - WordPress: post status (Draft/Pending/Published), category, author
    - Shopify: blog selection dropdown, enrich with products checkbox
    - Contentful: environment, locale
    - Ghost: status (draft/published), tags
    - Webflow: collection, publish immediately checkbox
    - Sanity: dataset
    - Webhook: no additional options
  - Common options: process images checkbox (default: yes)
- **Step 4 — Confirm and publish:**
  - Summary: article title, target platform, selected options
  - "Publish" button triggers `POST /api/publish/:platform/push`
  - Progress: show SSE progress if available, or polling status
  - Success: show published URL with "Open" link and "Publish to Another" button
  - Failure: show error message with "Retry" button
- Multi-step wizard using shadcn/ui Dialog with step indicators

### Sub-task 4: Platform Configuration Form (~1h)
- Create `dashboard/components/publish/platform-config.tsx`
- Dynamic form that renders fields based on platform type:
  - **WordPress:** Site URL, API Key, default post status, default author, SEO plugin selection
  - **Shopify:** Shop domain, access token (or "Connect with Shopify" OAuth button)
  - **Contentful:** Space ID, environment, management token, content type ID
  - **Strapi:** API URL, API token, content type name
  - **Ghost:** Ghost URL, Admin API key
  - **Webflow:** Site ID, API token, collection ID
  - **Sanity:** Project ID, dataset, API token, document type
  - **Webhook:** Webhook URL, signing secret
- "Test Connection" button that validates credentials against the target platform
- "Save" stores credentials in `client_connections` table (encrypted)
- "Disconnect" removes credentials with confirmation dialog
- Input validation: required fields, URL format, token format

### Sub-task 5: Main Publish Page + Navigation (~1h)
- Create `dashboard/app/publish/page.tsx`
- Server component that fetches connected platforms and recent publish history
- Layout:
  1. **Header:** "Publish Manager" title + "Publish Article" primary CTA button
  2. **Connected Platforms:** PlatformCards grid
  3. **Recent Activity:** PublishQueue DataTable
- "Publish Article" button opens PublishDialog
- Add "Publish" to main navigation sidebar in `dashboard/app/layout.tsx` with send/upload icon
- Loading states: skeleton for cards and table
- Mobile responsive: cards stack to 1 column, table becomes card list on small screens

## Testing Strategy

### Component Tests (`tests/dashboard-publishing.test.js`)
- Test PlatformCards renders connected/disconnected states correctly
- Test PublishQueue sorts and filters work
- Test PublishDialog multi-step wizard: steps advance, back button works, form validates
- Test PlatformConfig renders correct fields per platform type
- Test "Test Connection" button calls validation endpoint
- Test empty states for no platforms and no publish history

### Integration Tests
- Test publish page loads platforms from API
- Test publish dialog end-to-end: select article → select platform → configure → publish
- Test publish queue updates after successful publish
- Test retry action on failed publish
- Test platform configuration save and disconnect flows
- Test RTL layout

## Acceptance Criteria
- [ ] Publish Manager page accessible at `/publish` with navigation link in sidebar
- [ ] Platform cards show connection status, article count, and last publish date
- [ ] Publish queue DataTable shows all publish history with status badges
- [ ] Queue filterable by status (All, Published, Failed, Queued) and sortable
- [ ] "Publish to..." dialog walks through article → platform → options → confirm flow
- [ ] Platform-specific options rendered dynamically per platform type
- [ ] Published articles show clickable URL to remote platform
- [ ] Failed publishes offer "Retry" action
- [ ] Platform configuration form with "Test Connection" and credential storage
- [ ] "Disconnect" with confirmation removes platform credentials
- [ ] Responsive layout works on mobile and desktop
- [ ] All tests pass (`npm test`)

## Dependencies
- Blocked by: PB-001 (payload), PB-002 (WordPress), PB-003 (Shopify), PB-004 (CMS adapters)
- Blocks: None
