# DI-004: Content Inventory Crawler

> **Phase:** 5 | **Priority:** P0 | **Status:** NOT STARTED
> **Effort:** L (12h) | **Type:** feature
> **Sprint:** 2 (Weeks 3-4)
> **Depends On:** DI-001 (client_connections table for user association)
> **Assigned:** Unassigned

## Context Header

Before starting, read:

1. `CLAUDE.md` (auto-loaded)
2. `dev_docs/specs/database/unified-schema.md` — Section 3.3 (content_inventory DDL with 20+ columns) + Section 3.4 (crawl_sessions DDL)
3. `bridge/supabase-client.js` — database operations pattern
4. `dev_docs/tribunal/10-deliverables/phase-a-backlog.md` — Story #13 (crawler acceptance criteria)
5. Reference (external): `../old-seo-blog-checker/lib/metadata-extractor.ts` — HTML extraction logic to port
6. `dev_docs/tribunal/08-roadmap/phase-a-sprint-plan.md` — Sprint 2 crawler details

## Objective

Build the HTTP content crawler that discovers all URLs on a client's site, extracts page metadata (title, meta description, H1, word count, heading structure, internal/external links, images, schema types), and populates the `content_inventory` table. Port HTML extraction logic from the old-seo-blog-checker's metadata-extractor.ts. Implement sitemap.xml discovery as the fast path, link-following as fallback (max depth 3, max 10K pages), robots.txt compliance, and body_text extraction (fixing broken chain #1 from the tribunal where content_inventory lacked actual page content for intelligence analysis).

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `bridge/ingestion/crawler.js` | HTTP content crawler: sitemap discovery, link following, HTML extraction, body_text extraction |
| CREATE | `migrations/008-content-inventory.sql` | content_inventory table, crawl_sessions table -- full DDL from unified-schema.md |
| MODIFY | `bridge/server.js` | Register endpoints: `POST /api/ingestion/crawl`, `GET /api/ingestion/crawl/status/:sessionId` |

## Sub-tasks

### Sub-task 1: Create migration 008 — content_inventory + crawl_sessions (~2h)

- Create `migrations/008-content-inventory.sql` with **exact DDL from unified-schema.md Sections 3.3-3.4**:
- **content_inventory table** (20+ columns):
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
  - `url TEXT NOT NULL`, `canonical_url TEXT`, `title TEXT`, `meta_description TEXT`
  - `word_count INTEGER NOT NULL DEFAULT 0`, `h1_text TEXT`
  - `h2_count INTEGER`, `h3_count INTEGER`, `heading_structure JSONB DEFAULT '[]'`
  - `author TEXT`, `publish_date DATE`, `modified_date DATE`, `language TEXT DEFAULT 'en'`
  - `internal_link_count INTEGER`, `external_link_count INTEGER`
  - `image_count INTEGER`, `images_with_alt_count INTEGER`
  - `schema_types JSONB DEFAULT '[]'`
  - `content_hash TEXT` (SHA-256 of body text for change detection)
  - `status TEXT CHECK (status IN ('ok','thin','old','no_meta','orphan','error','redirect','removed'))`
  - `http_status INTEGER`, `redirect_url TEXT`
  - `crawl_session_id UUID REFERENCES crawl_sessions(id)`
  - `first_discovered_at`, `last_crawled_at`, `consecutive_missing INTEGER`
  - `UNIQUE (user_id, url)`
  - Indexes: `idx_inventory_user_url`, `idx_inventory_user_status`, `idx_inventory_user_date`, `idx_inventory_crawl_session`, `idx_inventory_content_hash`
  - Full RLS: SELECT, INSERT, UPDATE, DELETE matching `auth.uid() = user_id`
- **crawl_sessions table:**
  - `id UUID PRIMARY KEY`, `user_id UUID FK`, `site_url TEXT`, `status TEXT`
  - `discovery_method TEXT CHECK (IN ('sitemap','homepage_crawl'))`
  - `urls_discovered`, `urls_crawled`, `urls_errored`, `max_pages INTEGER DEFAULT 10000`
  - `started_at`, `completed_at`, `error_log JSONB DEFAULT '[]'`
  - RLS: users read/insert/update own sessions

### Sub-task 2: Sitemap discovery (fast path) (~2h)

- **`discoverFromSitemap(siteUrl)`** — Primary URL discovery method:
  - Fetch `${siteUrl}/sitemap.xml` with native `fetch()`
  - Parse XML using regex (no XML library): extract `<loc>` elements
  - Handle sitemap index files: if response contains `<sitemapindex>`, recursively fetch child sitemaps
  - Filter for content URLs: exclude image sitemaps, video sitemaps, PDF links
  - Deduplicate URLs and normalize (strip trailing slashes, query params, fragments)
  - If sitemap returns 404 or empty: try common alternatives (`/sitemap_index.xml`, `/post-sitemap.xml`, `/page-sitemap.xml`)
  - If all sitemap attempts fail: fall back to link-following (Sub-task 3)
  - Return `{ urls: string[], discoveryMethod: 'sitemap' }`

### Sub-task 3: Link-following fallback (~2h)

- **`discoverFromCrawling(siteUrl, maxDepth, maxPages)`** — Fallback when no sitemap:
  - Start from site root URL
  - BFS (breadth-first search) crawl following internal links
  - Max depth: 3 levels from root (configurable)
  - Max pages: 10,000 (configurable via `crawl_sessions.max_pages`)
  - Rate limit: max 2 requests/second to avoid overloading target sites
  - Link extraction: find all `<a href="...">` elements, resolve relative URLs, filter to same domain
  - Track visited URLs in a Set to avoid cycles
  - Skip non-HTML resources: check Content-Type header, skip PDFs, images, CSS, JS
  - Timeout: 10 seconds per page request, skip on timeout
  - Return `{ urls: string[], discoveryMethod: 'homepage_crawl' }`

### Sub-task 4: HTML metadata extraction — port from old-seo-blog-checker (~3h)

- **`extractMetadata(html, url)`** — Port logic from `../old-seo-blog-checker/lib/metadata-extractor.ts`:
  - `title`: content of `<title>` tag, or `og:title` meta tag
  - `meta_description`: content of `<meta name="description">` tag
  - `h1_text`: text content of first `<h1>` element
  - `h2_count`, `h3_count`: count of H2/H3 elements
  - `heading_structure`: JSON array of `[{ level, text }]` for all headings
  - `word_count`: count words in body text (Unicode-aware for Arabic content)
  - `author`: from `<meta name="author">`, schema.org Person, or byline patterns
  - `publish_date`: from `<meta property="article:published_time">`, `<time datetime>`, schema.org datePublished
  - `modified_date`: from `article:modified_time`, schema.org dateModified
  - `language`: from `<html lang="...">` attribute
  - `internal_link_count`: `<a>` with same-domain href
  - `external_link_count`: `<a>` with different-domain href
  - `image_count`: total `<img>` elements
  - `images_with_alt_count`: images with non-empty `alt` attribute
  - `schema_types`: extract types from `<script type="application/ld+json">` blocks
  - `canonical_url`: from `<link rel="canonical">` tag
- **Body text extraction** (fixes broken chain #1):
  - Strip all HTML tags to get plain text content
  - Focus on main content area: prefer `<article>`, `<main>`, `[role="main"]`
  - Strip navigation, sidebar, footer elements
  - Compute `content_hash`: SHA-256 of body text for change detection between crawls
  - Store body text in `content_inventory.metadata.body_text` (JSONB field) for voice analysis and intelligence
- **Robots.txt compliance:**
  - Fetch and parse `${siteUrl}/robots.txt` before crawling
  - Respect `Disallow` directives for the crawler's user-agent
  - Respect `Crawl-delay` if specified (minimum 0.5s between requests regardless)
  - Skip URLs that are disallowed by robots.txt

### Sub-task 5: Crawl orchestration and storage (~2h)

- **`runCrawl(userId, siteUrl, options)`** — Main orchestrator:
  1. Create `crawl_sessions` record with status `running`
  2. Attempt sitemap discovery; fall back to link-following
  3. For each discovered URL, fetch and extract metadata
  4. Upsert into `content_inventory` with `ON CONFLICT (user_id, url)` update
  5. Track: `urls_discovered`, `urls_crawled`, `urls_errored` in crawl_sessions
  6. On completion: set `crawl_sessions.status = 'completed'`, set `completed_at`
  7. On error: set `crawl_sessions.status = 'error'`, log to `error_log` JSONB
- **Status classification:** After crawl, classify each URL:
  - `ok`: word_count >= 300, has title and meta_description
  - `thin`: word_count < 300
  - `no_meta`: missing title or meta_description
  - `old`: publish_date > 18 months ago and no modified_date within 6 months
  - `redirect`: HTTP 301/302 response
  - `removed`: HTTP 404/410 response
  - `error`: HTTP 5xx or timeout
- **Change detection:** Compare `content_hash` with previous crawl. If changed: update metadata, reset `consecutive_missing`. If same: only update `last_crawled_at`.

### Sub-task 6: API endpoints (~1h)

- **`POST /api/ingestion/crawl`** — Authenticated. Body: `{ siteUrl, maxPages? }`. Creates crawl session, runs async. Returns `{ sessionId, status: 'running' }`.
- **`GET /api/ingestion/crawl/status/:sessionId`** — Authenticated. Returns crawl progress: `{ status, urlsDiscovered, urlsCrawled, urlsErrored, discoveryMethod }`.
- Rate limit: max 1 concurrent crawl per user
- URL validation: reject localhost, private IPs, non-HTTP(S) URLs

## Acceptance Criteria

- [ ] Migration 008 creates content_inventory with all 20+ columns from unified-schema.md Section 3.3
- [ ] Migration 008 creates crawl_sessions matching Section 3.4
- [ ] Sitemap.xml discovery parses standard sitemaps and sitemap index files
- [ ] Link-following fallback respects max depth (3) and max pages (10K)
- [ ] Rate limiting: max 2 requests/second to target site
- [ ] Robots.txt fetched and respected for all crawl URLs
- [ ] HTML metadata extraction covers all content_inventory columns (title through schema_types)
- [ ] Body text extraction strips HTML and stores in metadata.body_text (broken chain #1 fix)
- [ ] Content hash (SHA-256) enables change detection between crawls
- [ ] Status classification assigns ok/thin/old/no_meta/redirect/removed/error correctly
- [ ] Upsert prevents duplicate inventory entries for same (user_id, url)
- [ ] Crawl sessions tracked with progress counts and error logs
- [ ] Max 1 concurrent crawl per user enforced
- [ ] Zero npm dependencies -- regex-based HTML parsing, native fetch

## Test Requirements

### Unit Tests

- Sitemap parsing extracts URLs from standard sitemap XML
- Sitemap index parsing recursively fetches child sitemaps
- Link extraction finds all internal `<a href>` elements, resolves relative URLs
- Robots.txt parsing: disallowed URL correctly skipped
- Metadata extraction: title, meta_description, H1, word count from sample HTML
- Arabic content: word count handles Unicode correctly (RTL text)
- Content hash: same HTML produces same hash, different HTML produces different hash
- Status classification: 250-word page = `thin`, missing title = `no_meta`

### Integration Tests

- Full crawl of mock site with sitemap: discover -> crawl -> extract -> store -> verify DB
- Fallback crawl when sitemap returns 404
- Change detection: second crawl detects content changes via hash comparison
- Concurrent crawl rejection: second crawl attempt returns 409
- Crawl session status endpoint returns accurate progress

## Dependencies

- Blocked by: DI-001 (client_connections table for user association)
- Blocks: CI-001 (decay detection needs content_inventory), CI-002 (gap analysis needs content matching), DI-006 (inventory dashboard page), VI-001 (corpus analyzer reuses crawled content)
