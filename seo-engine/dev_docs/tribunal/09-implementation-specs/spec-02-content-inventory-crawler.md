# Spec 02: Content Inventory HTTP Crawler

**Priority:** Must Have (MoSCoW #7)
**Phase:** A (Weeks 1-6)
**Effort:** L (2-4 weeks)
**Dependencies:** None (runs independently of OAuth)
**Blocks:** Decay Detection (#11), Gap Analyzer (#12), Cannibalization (#13), Topic Recommender (#14), Voice Intelligence (#18)

---

## 1. Feature Overview

The content inventory crawler discovers and catalogs every article on a client's website. It is the foundational data structure that all intelligence layers depend on -- decay detection needs a URL list, gap analysis needs existing topic coverage, cannibalization detection needs page-to-keyword mappings, and voice analysis needs article text.

The crawler operates in two modes:

1. **Sitemap-first (preferred):** Fetches `/sitemap.xml` and `/sitemap_index.xml`, parses all `<loc>` entries, then fetches each page to extract metadata. This is fast, polite, and covers 90%+ of sites with proper sitemaps.

2. **Homepage fallback:** If no sitemap exists, the crawler starts at the homepage and follows internal links breadth-first up to a configurable depth (default 5 levels). This is slower and noisier but catches sites without sitemaps.

The implementation lives in a single module `bridge/ingestion/crawler.js` that exports a `ContentCrawler` class. It ports HTML extraction logic from the existing `old-seo-blog-checker/lib/metadata-extractor.ts` (TypeScript to pure JS conversion). The crawler uses Node's native `https`/`http` modules for fetching and regex-based extraction for HTML parsing (no DOM parser dependency, per the zero-dep constraint).

**Polite crawling constraints:** Maximum 3 concurrent requests, 500ms minimum delay between requests to the same host, robots.txt respect, 10-second per-request timeout, and a hard cap of 10,000 pages per crawl session. These defaults are configurable per client.

The crawled data is stored in a new `content_inventory` table with a unique constraint on `(user_id, url)`. Subsequent crawls update existing rows rather than creating duplicates, enabling delta tracking over time.

---

## 2. User Stories

**US-01: Discover All Articles**
As a publisher, I want ChainIQ to automatically discover all articles on my site so that the intelligence layer has a complete picture of my content.

**US-02: See Crawl Progress**
As a publisher, I want to see real-time crawl progress (pages found, pages crawled, errors) so that I know the crawler is working and how long it will take.

**US-03: Review Content Inventory**
As a publisher, I want to browse my complete content inventory with title, word count, publish date, and URL so that I can verify the crawler found everything.

**US-04: Trigger Re-crawl**
As a publisher, I want to re-crawl my site on demand to pick up newly published articles without waiting for the next scheduled crawl.

**US-05: Respect My Server**
As a site owner, I want the crawler to respect robots.txt and not overload my server so that my site performance is not impacted by ChainIQ.

**US-06: Handle Large Sites**
As an enterprise publisher with 20,000+ pages, I want the crawler to handle my site efficiently with pagination and a sensible page cap so that crawls complete within a reasonable time.

**US-07: Extract Rich Metadata**
As a content strategist, I want the crawler to extract not just titles but also word count, headings structure, author, publish date, images, internal links, and schema markup so that I have a complete content audit without manual work.

---

## 3. Acceptance Criteria

**AC-01:** Given a site with `/sitemap.xml`, the crawler discovers all `<loc>` URLs from the sitemap (including nested sitemap index files) before fetching any pages.

**AC-02:** Given a site without a sitemap, the crawler falls back to homepage link-following (BFS, max depth 5) and discovers at least 80% of internally-linked pages.

**AC-03:** The crawler respects `robots.txt` directives. URLs disallowed for the `ChainIQ-Bot` user-agent (or `*` wildcard) are skipped. The `Crawl-delay` directive is honored if present and greater than the default 500ms.

**AC-04:** Maximum concurrency is 3 simultaneous HTTP requests. Minimum delay between sequential requests to the same host is 500ms.

**AC-05:** Each crawled page extracts: `title`, `meta_description`, `word_count` (visible text only, excluding nav/footer/sidebar), `h1` (text), `h2_count`, `h3_count`, `heading_structure` (JSON array of `{level, text}`), `author`, `publish_date`, `modified_date`, `language` (from `<html lang>`), `internal_link_count`, `external_link_count`, `image_count`, `images_with_alt_count`, `schema_types` (JSON array of detected JSON-LD @type values), and `canonical_url`.

**AC-06:** The `content_inventory` table enforces `UNIQUE(user_id, url)`. Re-crawls perform `INSERT ... ON CONFLICT ... DO UPDATE` to preserve history while updating metadata.

**AC-07:** Crawl sessions are capped at 10,000 pages by default. The cap is configurable via the `/api/inventory/crawl` request body.

**AC-08:** The crawler sets `User-Agent: ChainIQ-Bot/1.0 (+https://chainiq.io/bot)` on all requests.

**AC-09:** Pages returning non-200 status codes are logged but not stored in the inventory. 301/302 redirects are followed (max 5 hops) and the final URL is stored.

**AC-10:** Crawl progress is reported via SSE on `/api/inventory/crawl/progress/:jobId` with events: `discovered` (new URL found), `crawled` (page processed), `error` (page failed), `complete` (crawl finished).

**AC-11:** Pages with `Content-Type` other than `text/html` are skipped (no PDFs, images, or JSON endpoints).

**AC-12:** The crawler completes a 1,000-page site in under 15 minutes (at 500ms delay with 3 concurrency, theoretical minimum is ~167 seconds; budget for extraction overhead).

---

## 4. UI/UX Description

The content inventory page is accessible from the dashboard sidebar under "Content Inventory." It has two views: the crawl trigger/status view and the inventory table view.

### ASCII Wireframe -- Content Inventory Page

```text
+------------------------------------------------------------------+
|  ChainIQ Dashboard                        [User] [Settings]      |
+----------+-------------------------------------------------------+
| Sidebar  |  CONTENT INVENTORY                                    |
|          |                                                        |
| Overview |  Site: bmwtuning.com          [Re-crawl] [Export CSV]  |
| Articles |                                                        |
| Connect  |  Last crawl: 2026-03-27 03:00 | 847 pages | 12 errors|
|>Inventory|                                                        |
| Intel    |  +----------------------------------------------------+|
| Quality  |  | Search: [_______________]  Filter: [All types v]   ||
| Publish  |  +----------------------------------------------------+|
| Perform  |  | Title              |Words|Date      |Status|Author ||
|          |  |--------------------|-----|----------|------|-------||
|          |  | N54 HPFP Failure   |2840 |2025-06-14|  OK  |Mike T.||
|          |  | B58 Tuning Guide   |3210 |2025-04-02| THIN |Sarah K||
|          |  | BMW Oil Change DIY |1120 |2024-11-30| OLD  |Mike T.||
|          |  | M3 vs M4 Compare   | 890 |2025-08-20| THIN |--     ||
|          |  | E90 Suspension Mod |4500 |2025-01-15|  OK  |Jake R.||
|          |  |         ... (847 rows, paginated 50/page) ...      ||
|          |  +----------------------------------------------------+|
|          |  [< Prev]  Page 1 of 17  [Next >]                     |
+----------+-------------------------------------------------------+
```

### Crawl Progress Modal

When "Re-crawl" is clicked, a modal appears showing live progress:

```text
+----------------------------------------+
|  Crawling bmwtuning.com                |
|                                        |
|  [==============>          ] 62%       |
|                                        |
|  Discovered: 847 URLs                  |
|  Crawled:    524 / 847                 |
|  Errors:     3                         |
|  Elapsed:    4m 22s                    |
|  Est. remaining: 2m 40s               |
|                                        |
|  Latest: /blog/e90-coilover-guide      |
|                                        |
|  [Cancel Crawl]                        |
+----------------------------------------+
```

### Status Labels

- **OK** -- word count >= 1500, has author, has date, has images
- **THIN** -- word count < 800
- **OLD** -- publish date > 12 months ago and no modified date within 6 months
- **NO META** -- missing title or meta description
- **ORPHAN** -- zero internal links pointing to this page (detected in re-crawl)

---

## 5. Database Changes

### Migration: `migrations/008-content-inventory.sql`

```sql
CREATE TABLE content_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  canonical_url TEXT,
  title TEXT,
  meta_description TEXT,
  word_count INTEGER DEFAULT 0,
  h1_text TEXT,
  h2_count INTEGER DEFAULT 0,
  h3_count INTEGER DEFAULT 0,
  heading_structure JSONB DEFAULT '[]'::jsonb,
  author TEXT,
  publish_date DATE,
  modified_date DATE,
  language TEXT DEFAULT 'en',
  internal_link_count INTEGER DEFAULT 0,
  external_link_count INTEGER DEFAULT 0,
  image_count INTEGER DEFAULT 0,
  images_with_alt_count INTEGER DEFAULT 0,
  schema_types JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'ok'
    CHECK (status IN ('ok', 'thin', 'old', 'no_meta', 'orphan', 'error', 'redirect')),
  http_status INTEGER,
  redirect_url TEXT,
  crawl_session_id UUID,
  first_discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_crawled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, url)
);

-- RLS
ALTER TABLE content_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own inventory"
  ON content_inventory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own inventory"
  ON content_inventory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own inventory"
  ON content_inventory FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own inventory"
  ON content_inventory FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE UNIQUE INDEX idx_inventory_user_url
  ON content_inventory (user_id, url);

CREATE INDEX idx_inventory_user_status
  ON content_inventory (user_id, status);

CREATE INDEX idx_inventory_user_date
  ON content_inventory (user_id, publish_date DESC NULLS LAST);

CREATE INDEX idx_inventory_crawl_session
  ON content_inventory (crawl_session_id);

-- Crawl sessions tracking
CREATE TABLE crawl_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'cancelled', 'error')),
  discovery_method TEXT NOT NULL DEFAULT 'sitemap'
    CHECK (discovery_method IN ('sitemap', 'homepage_crawl')),
  urls_discovered INTEGER DEFAULT 0,
  urls_crawled INTEGER DEFAULT 0,
  urls_errored INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_log JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE crawl_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own crawl sessions"
  ON crawl_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own crawl sessions"
  ON crawl_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own crawl sessions"
  ON crawl_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger (reuse from migration 007)
CREATE TRIGGER content_inventory_updated_at
  BEFORE UPDATE ON content_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 6. API/Backend Changes

### New Module: `bridge/ingestion/crawler.js`

Exports a class `ContentCrawler` with the following architecture:

**Constructor:** `new ContentCrawler(siteUrl, userId, options)`

Options with defaults:

- `maxConcurrency: 3`
- `delayMs: 500`
- `maxPages: 10000`
- `maxDepth: 5` (homepage fallback only)
- `timeoutMs: 10000` (per request)
- `maxRedirects: 5`
- `userAgent: 'ChainIQ-Bot/1.0 (+https://chainiq.io/bot)'`

**Core Methods:**

| Method | Description |
| ------ | ----------- |
| `crawl()` | Main entry point. Returns a crawl session ID. Tries sitemap first, falls back to homepage. Emits progress events. Stores results via upsert. |
| `discoverFromSitemap(siteUrl)` | Fetches `/sitemap.xml`. If it is a sitemap index, fetches all child sitemaps. Parses `<loc>` entries. Returns URL array. |
| `discoverFromHomepage(siteUrl, maxDepth)` | BFS link-following from homepage. Filters to same-domain links. Returns URL array. |
| `fetchRobotsTxt(siteUrl)` | Fetches and parses `/robots.txt`. Returns an object with `isAllowed(url, userAgent)` method and `crawlDelay` value. |
| `fetchAndExtract(url)` | Fetches a single page, extracts all metadata fields using regex. Returns a `ContentRecord` object. |
| `extractMetadata(html, url)` | Pure function: HTML string in, metadata object out. Ported from `old-seo-blog-checker/lib/metadata-extractor.ts`. |
| `upsertInventory(records)` | Batch upserts records into `content_inventory` via Supabase PostgREST. Uses `ON CONFLICT (user_id, url) DO UPDATE`. |

**Concurrency control:** Uses a simple semaphore pattern -- an array of promises, `Promise.race()` to wait for the first slot to free, then push a new fetch. No external library needed.

```javascript
async function crawlWithConcurrency(urls, maxConcurrency, delayMs, fetchFn) {
  const active = [];
  const results = [];
  let lastRequestTime = 0;

  for (const url of urls) {
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < delayMs) {
      await new Promise(r => setTimeout(r, delayMs - elapsed));
    }

    const promise = fetchFn(url).then(result => {
      active.splice(active.indexOf(promise), 1);
      return result;
    });
    active.push(promise);
    lastRequestTime = Date.now();

    if (active.length >= maxConcurrency) {
      results.push(await Promise.race(active));
    }
  }

  results.push(...await Promise.all(active));
  return results;
}
```

**HTML extraction strategy (regex-based, zero-dep):**

The `extractMetadata` function uses targeted regex patterns rather than full DOM parsing. This works for well-formed HTML (95%+ of published sites) and gracefully degrades on malformed markup:

- `<title>`: `/<title[^>]*>([\s\S]*?)<\/title>/i`
- `<meta name="description">`: `/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i`
- `<h1>` through `<h6>`: `/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi` (strip inner tags)
- Author: Check `<meta name="author">`, then JSON-LD `author.name`, then `<span class="author">`
- Publish date: Check `<meta property="article:published_time">`, then JSON-LD `datePublished`, then `<time datetime>`
- Word count: Strip all HTML tags, collapse whitespace, split on spaces. Exclude content inside `<nav>`, `<footer>`, `<header>`, `<aside>` by removing those blocks first.
- Schema types: Parse all `<script type="application/ld+json">` blocks, extract `@type` values
- Canonical: `<link rel="canonical" href="...">`

### New Endpoints in `bridge/routes/inventory.js`

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| `POST` | `/api/inventory/crawl` | User | Start a new crawl. Body: `{ siteUrl, maxPages? }`. Returns `{ jobId }`. |
| `GET` | `/api/inventory/crawl/progress/:jobId` | User | SSE stream of crawl progress events. |
| `POST` | `/api/inventory/crawl/:jobId/cancel` | User | Cancel a running crawl. |
| `GET` | `/api/inventory` | User | List inventory with pagination, search, filters. Query: `?page=1&limit=50&status=thin&search=bmw`. |
| `GET` | `/api/inventory/:id` | User | Single inventory item with full metadata. |
| `GET` | `/api/inventory/stats` | User | Summary: total pages, avg word count, status distribution, last crawl date. |
| `DELETE` | `/api/inventory` | User | Clear all inventory for the user (dangerous, requires confirmation token). |

---

## 7. Frontend Components

All components use Next.js 16 + shadcn/ui (base-ui). Located in `dashboard/app/inventory/`.

| Component | File | Description |
| --------- | ---- | ----------- |
| `InventoryPage` | `page.tsx` | Server component. Fetches initial inventory data and stats. Renders layout. |
| `InventoryTable` | `components/inventory-table.tsx` | Client component. Sortable, filterable table with pagination. Columns: title (linked), word count, date, status badge, author. |
| `CrawlButton` | `components/crawl-button.tsx` | Triggers `POST /api/inventory/crawl`. Opens progress modal on click. |
| `CrawlProgressModal` | `components/crawl-progress.tsx` | Client component. Connects to SSE endpoint. Shows progress bar, counters, latest URL, elapsed time, cancel button. |
| `InventoryStatusBadge` | `components/status-badge.tsx` | Colored badge: green (ok), yellow (thin/old), red (no_meta/error), gray (orphan). Includes text label. |
| `InventoryStats` | `components/inventory-stats.tsx` | Summary cards: total pages, avg word count, content freshness distribution, status breakdown pie/bar chart. |
| `InventorySearch` | `components/inventory-search.tsx` | Search input with debounce (300ms). Filters table client-side for small datasets, server-side for large. |
| `ExportButton` | `components/export-button.tsx` | Exports current filtered view as CSV. Client-side generation for datasets under 5,000 rows. |

---

## 8. Test Plan

All tests use `node:test`. Located in `tests/inventory/`.

### Unit Tests (`tests/inventory/extractor.test.js`)

| # | Test | Verifies |
| - | ---- | -------- |
| 1 | Extract title from well-formed HTML | `<title>` tag content is captured |
| 2 | Extract title with nested tags | `<title><span>Text</span></title>` returns "Text" |
| 3 | Extract meta description | `<meta name="description" content="...">` parsed correctly |
| 4 | Word count excludes nav/footer | HTML with 500 words in main + 200 in nav returns ~500 |
| 5 | Heading structure extraction | H1, H2, H3 tags produce correct JSON array with levels and text |
| 6 | JSON-LD schema type extraction | `<script type="application/ld+json">{"@type":"Article"}` returns `["Article"]` |
| 7 | Author from meta tag | `<meta name="author" content="Mike T.">` extracted |
| 8 | Author fallback to JSON-LD | No meta author, JSON-LD `author.name` used |
| 9 | Publish date from article:published_time | ISO date string parsed correctly |
| 10 | Canonical URL extraction | `<link rel="canonical">` href captured |
| 11 | Malformed HTML degrades gracefully | Unclosed tags return partial data, not crash |
| 12 | Empty HTML returns zero-value defaults | No title = null, word_count = 0, etc. |

### Integration Tests (`tests/inventory/crawler.test.js`)

| # | Test | Verifies |
| - | ---- | -------- |
| 13 | Sitemap XML parsing | Well-formed sitemap returns correct URL list |
| 14 | Sitemap index following | Sitemap index with 3 child sitemaps fetches all children |
| 15 | robots.txt disallow respected | Disallowed path is skipped |
| 16 | Crawl-delay honored | Custom delay > 500ms is used instead of default |
| 17 | Concurrency cap at 3 | No more than 3 requests active simultaneously (verify via timing) |
| 18 | Max pages cap enforced | Crawl stops after `maxPages` pages even if more URLs discovered |
| 19 | Redirect following | 301 -> final URL stored; redirect chain > 5 hops aborted |
| 20 | Non-HTML skipped | PDF, image, JSON responses not stored in inventory |

### Endpoint Tests (`tests/inventory/api.test.js`)

| # | Test | Verifies |
| - | ---- | -------- |
| 21 | `POST /api/inventory/crawl` requires auth | 401 without token |
| 22 | `GET /api/inventory` pagination | `?page=2&limit=50` returns correct offset |
| 23 | `GET /api/inventory` search filter | `?search=hpfp` returns matching titles |
| 24 | `DELETE /api/inventory` requires confirmation | Missing confirmation token returns 400 |
| 25 | Upsert on re-crawl | Same URL crawled twice updates rather than duplicates |

---

## 9. Rollout Plan

### Phase 1: Core Crawler (Week 1-2)

1. Port `extractMetadata` from `old-seo-blog-checker/lib/metadata-extractor.ts` to pure JS
2. Implement `ContentCrawler` class with sitemap discovery
3. Run `migrations/008-content-inventory.sql`
4. Implement `/api/inventory/crawl` endpoint (no SSE yet, synchronous response with job ID)
5. Test against 3 real sites: small (< 100 pages), medium (500-1000), large (5000+)

### Phase 2: Homepage Fallback + Polish (Week 2-3)

1. Implement BFS homepage crawl fallback
2. Implement robots.txt parser and respect
3. Add SSE progress endpoint
4. Implement CrawlProgressModal in dashboard
5. Add status classification logic (thin/old/no_meta/orphan)

### Phase 3: Inventory UI + Search (Week 3)

1. Build InventoryTable with sorting, filtering, pagination
2. Build InventoryStats summary cards
3. Add CSV export
4. Integration test with SRMG pilot site (Arabic content, RTL)

### Feature Flags

- `CRAWLER_MAX_PAGES=10000` -- Global page cap
- `CRAWLER_CONCURRENCY=3` -- Max simultaneous requests
- `CRAWLER_DELAY_MS=500` -- Minimum delay between requests
- `ENABLE_HOMEPAGE_FALLBACK=true` -- Toggle BFS fallback

### Rollback Strategy

The crawler is a write-only system that populates `content_inventory`. Rollback means:

1. Stop any running crawl sessions
2. Optionally `DELETE FROM content_inventory WHERE user_id = ?` to clear bad data
3. The table itself is additive -- no other features are broken by its presence

---

## 10. Accessibility and Mobile

### Accessibility (WCAG 2.1 AA)

- **Inventory table:** Semantic `<table>` with proper `<thead>`, `<th scope="col">`, and `<tbody>`. Table caption or `aria-label` describes the content ("Content inventory for bmwtuning.com, 847 pages"). Sortable column headers announce sort direction via `aria-sort="ascending"` or `"descending"`.
- **Status badges:** Never color-only. Each badge has a text label visible at all times. Additional `aria-label` for screen readers: "Status: thin content, 890 words."
- **Pagination:** Uses `<nav aria-label="Inventory pagination">` with current page announced via `aria-current="page"`. Previous/Next buttons are disabled (not hidden) when at bounds.
- **Search input:** `<label>` associated via `for` attribute. `aria-describedby` links to helper text ("Search by title, URL, or author"). Live region announces result count changes.
- **Crawl progress modal:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to title. Focus trapped. Progress bar uses `role="progressbar"` with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`. Percentage announced to screen readers via `aria-live="polite"` region.
- **Export button:** `aria-label="Export content inventory as CSV"`. Disabled state communicated via `aria-disabled="true"` with tooltip explaining why (e.g., "No data to export").

### Mobile Responsiveness

- **Table on mobile:** Below 768px, the table transforms to a card-based layout. Each card shows title (linked), word count, status badge, and date. Author and link counts hidden behind "More details" expandable section.
- **Crawl button:** Full-width on mobile, sticky at bottom of viewport during scroll.
- **Progress modal:** Full-screen on mobile (below 640px). Cancel button at bottom with large touch target.
- **Search:** Full-width input. Filter dropdown stacks below search on mobile.
- **Pagination:** Simplified on mobile: [Prev] [1...5...17] [Next] with current page highlighted.

### RTL Support

- Table layout uses CSS logical properties. Column order does not flip (numbers/dates are always left-aligned in both LTR and RTL per typographic convention), but text alignment within cells follows document direction.
- Status badges, search input placeholder, and filter labels are all translatable. Arabic labels use `dir="rtl"` on the container.
- Crawl progress modal text aligns to the start edge (right in RTL). Progress bar fills from right to left in RTL mode via `direction: rtl` on the progress container.
