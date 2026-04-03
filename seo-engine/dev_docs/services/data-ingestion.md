# Data Ingestion Service

> **Service #7** | **Layer 1** | **Priority: P0** | **Status: Planning**
> **Last Updated:** 2026-03-28
> **Spec Depth:** DEEP (target >= 9/10)

---

## 1. Overview

The Data Ingestion Service is Layer 1 of ChainIQ's 6-layer intelligence architecture. It is the data foundation upon which every other layer depends -- without live performance data flowing into the system, Content Intelligence (Layer 2) has nothing to analyze, Voice Intelligence (Layer 3) has no article corpus to fingerprint, the Feedback Loop (Layer 6) cannot compare predictions to actuals, and the Dashboard has no health metrics to display. This service is the difference between ChainIQ being a generic AI writer and a data-driven content intelligence platform.

The service performs five core functions: (1) connecting to external data sources via OAuth 2.0 and API key authentication, (2) pulling search performance data from Google Search Console and Google Analytics 4, (3) pulling competitive intelligence data from Semrush and Ahrefs, (4) crawling client websites to build a complete content inventory, and (5) running an autonomous scheduler that keeps all data current without human intervention.

**Primary users and their interactions:** Client admins (Nadia persona) connect their Google accounts during onboarding and periodically check connection health via green/yellow/red status dots on the dashboard. They sort articles by health score, click into decaying articles, and hand off to Content Intelligence for recommendations. Agency admins (Marcus persona) manage 15+ client connections, reconnecting expired tokens and monitoring sync status across accounts. The scheduler (autonomous) runs at 3AM UTC, pulling data from all sources without any user interaction.

**Day-in-the-life simulation:** Nadia opens her dashboard at 9AM. She sees green dots next to GSC and GA4 (synced 6 hours ago), sorts her 847-article inventory by health score ascending, notices three articles have dropped from HEALTHY to DECAYING since last week, clicks into one to see the 3-month trend chart powered by performance_snapshots data, then hands it to Content Intelligence for a refresh recommendation. Meanwhile, Marcus logs into his admin panel, sees 14 of 15 clients showing green connections and one showing an orange EXPIRED badge. He clicks "Reconnect" for the expired client, which triggers the OAuth flow. The scheduler ran at 3AM autonomously -- it pulled GSC data for all 15 clients, encountered a rate limit on one Semrush pull, automatically backed off and retried successfully, and logged zero failures.

Every client connects their OWN Google accounts via OAuth 2.0 with PKCE. Semrush and Ahrefs API keys are shared (ChainIQ's own keys, cost absorbed into subscription pricing at $200-400/month per client). All tokens are encrypted at rest using AES-256-GCM via the existing KeyManager pattern. The service runs autonomously via a setInterval-based scheduler with Supabase state tracking, implemented with zero npm dependencies using only Node.js built-ins and native fetch.

---

## 2. Entities & Data Model

### 2.1 client_connections

Stores OAuth tokens and API key connections between clients and external data sources. One row per provider per user.

| Field | Type | Constraints | Nullable | Default | Description |
|-------|------|-------------|----------|---------|-------------|
| id | UUID | PRIMARY KEY | NOT NULL | `gen_random_uuid()` | Unique connection identifier |
| user_id | UUID | FK `auth.users(id)` ON DELETE CASCADE | NOT NULL | -- | Owning user |
| provider | TEXT | CHECK IN (`google`, `semrush`, `ahrefs`) | NOT NULL | -- | Provider identifier |
| provider_account_id | TEXT | -- | YES | NULL | Google email, API key hint (last 4 chars) |
| access_token_encrypted | TEXT | -- | YES | NULL | AES-256-GCM encrypted via KeyManager. Format: `iv:authTag:ciphertext` (hex) |
| refresh_token_encrypted | TEXT | -- | YES | NULL | AES-256-GCM encrypted via KeyManager. Stored separately from access token |
| token_expires_at | TIMESTAMPTZ | -- | YES | NULL | When access token expires. NULL for API key connections |
| scopes | TEXT[] | -- | YES | NULL | Array of granted OAuth scopes |
| gsc_property | TEXT | -- | YES | NULL | Selected GSC property URL (e.g., `sc-domain:bmwtuning.com`) |
| ga4_property_id | TEXT | -- | YES | NULL | Selected GA4 property ID (e.g., `properties/384291053`) |
| status | TEXT | CHECK IN (`pending`, `connected`, `error`, `revoked`, `expired`) | NOT NULL | `'pending'` | Current connection health |
| last_sync_at | TIMESTAMPTZ | -- | YES | NULL | Timestamp of last successful data pull |
| last_error | TEXT | -- | YES | NULL | Human-readable last error message. NULL when healthy |
| sync_count | INTEGER | CHECK >= 0 | NOT NULL | 0 | Total successful syncs. Used for cost tracking |
| metadata | JSONB | -- | NOT NULL | `'{}'::jsonb` | Provider-specific config: `{ quotas: {}, selectedViews: [], preferences: {} }` |
| created_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | Connection creation time |
| updated_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | Last modification time. Auto-updated by trigger |

**Unique constraint:** `UNIQUE (user_id, provider)` -- one connection per provider per user.

**Indexes:**
- `idx_connections_user_provider` on `(user_id, provider)` -- primary lookup pattern
- `idx_connections_status` on `(status)` WHERE `status != 'connected'` -- partial index for admin health dashboard (find all broken connections fast)

**RLS Policies:**
- `Users read own connections`: SELECT WHERE `auth.uid() = user_id`
- `Users insert own connections`: INSERT WITH CHECK `auth.uid() = user_id`
- `Users update own connections`: UPDATE USING/WITH CHECK `auth.uid() = user_id`
- `Users delete own connections`: DELETE WHERE `auth.uid() = user_id`

**Trigger:** `BEFORE UPDATE` fires `update_updated_at()` to set `updated_at = now()`.

### 2.2 oauth_states

Short-lived table for CSRF protection during OAuth flow. Rows auto-expire after 10 minutes.

| Field | Type | Constraints | Nullable | Default | Description |
|-------|------|-------------|----------|---------|-------------|
| state | TEXT | PRIMARY KEY | NOT NULL | -- | `crypto.randomBytes(32).toString('hex')` |
| user_id | UUID | FK `auth.users(id)` ON DELETE CASCADE | NOT NULL | -- | User initiating the OAuth flow |
| code_verifier | TEXT | -- | NOT NULL | -- | PKCE code_verifier. Server-side only, never exposed to client |
| provider | TEXT | CHECK IN (`google`) | NOT NULL | -- | OAuth provider |
| created_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | Creation time |

**Index:** `idx_oauth_states_created` on `(created_at)` -- for cleanup job to delete rows older than 10 minutes.

**No RLS:** This table is accessed via service_role key during OAuth callback processing.

### 2.3 content_inventory

One row per discovered URL per client. The complete map of all content on the client's website.

| Field | Type | Constraints | Nullable | Default | Description |
|-------|------|-------------|----------|---------|-------------|
| id | UUID | PRIMARY KEY | NOT NULL | `gen_random_uuid()` | Unique inventory item ID |
| user_id | UUID | FK `auth.users(id)` ON DELETE CASCADE | NOT NULL | -- | Owning user |
| url | TEXT | -- | NOT NULL | -- | Full URL path (absolute, canonicalized) |
| canonical_url | TEXT | -- | YES | NULL | Canonical URL from `<link rel="canonical">` |
| title | TEXT | -- | YES | NULL | Page title from `<title>` or first `<h1>` |
| meta_description | TEXT | -- | YES | NULL | Meta description content |
| word_count | INTEGER | CHECK >= 0 | NOT NULL | 0 | Visible text word count (excluding nav/footer/sidebar/header) |
| h1_text | TEXT | -- | YES | NULL | Primary H1 text content |
| h2_count | INTEGER | CHECK >= 0 | NOT NULL | 0 | Number of H2 headings |
| h3_count | INTEGER | CHECK >= 0 | NOT NULL | 0 | Number of H3 headings |
| heading_structure | JSONB | -- | NOT NULL | `'[]'::jsonb` | Array of `{level: N, text: "..."}` objects for all H1-H6 |
| author | TEXT | -- | YES | NULL | Author name from meta tag, JSON-LD, or byline pattern |
| publish_date | DATE | -- | YES | NULL | Publication date from `article:published_time`, JSON-LD, or `<time>` |
| modified_date | DATE | -- | YES | NULL | Last modified date from `article:modified_time` or JSON-LD |
| language | TEXT | -- | NOT NULL | `'en'` | Language from `<html lang>` attribute |
| internal_link_count | INTEGER | CHECK >= 0 | NOT NULL | 0 | Count of same-domain links on the page |
| external_link_count | INTEGER | CHECK >= 0 | NOT NULL | 0 | Count of external domain links on the page |
| image_count | INTEGER | CHECK >= 0 | NOT NULL | 0 | Total `<img>` tags on the page |
| images_with_alt_count | INTEGER | CHECK >= 0 | NOT NULL | 0 | Images with non-empty `alt` attribute |
| schema_types | JSONB | -- | NOT NULL | `'[]'::jsonb` | Array of JSON-LD `@type` values detected (e.g., `["Article", "BreadcrumbList"]`) |
| content_hash | TEXT | -- | YES | NULL | SHA-256 of stripped article body text. Used for change detection between crawls |
| status | TEXT | CHECK IN (`ok`, `thin`, `old`, `no_meta`, `orphan`, `error`, `redirect`, `removed`) | NOT NULL | `'ok'` | Content quality classification |
| http_status | INTEGER | -- | YES | NULL | HTTP response code from last crawl |
| redirect_url | TEXT | -- | YES | NULL | Final URL after redirect chain |
| crawl_session_id | UUID | FK `crawl_sessions(id)` | YES | NULL | Which crawl session discovered/updated this item |
| first_discovered_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | When this URL was first found |
| last_crawled_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | When this URL was last fetched |
| consecutive_missing | INTEGER | CHECK >= 0 | NOT NULL | 0 | How many consecutive crawls have NOT seen this URL. At 3, status becomes `removed` |
| created_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | Row creation time |
| updated_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | Last update time |

**Unique constraint:** `UNIQUE (user_id, url)` -- one entry per URL per client.

**Indexes:**
- `idx_inventory_user_url` UNIQUE on `(user_id, url)` -- primary lookup, upsert target
- `idx_inventory_user_status` on `(user_id, status)` -- filter by content quality
- `idx_inventory_user_date` on `(user_id, publish_date DESC NULLS LAST)` -- sort by recency
- `idx_inventory_crawl_session` on `(crawl_session_id)` -- find all items from a specific crawl
- `idx_inventory_content_hash` on `(user_id, content_hash)` -- detect content changes between crawls

**RLS Policies:** Same pattern as client_connections (SELECT/INSERT/UPDATE/DELETE with `auth.uid() = user_id`).

### 2.4 crawl_sessions

Tracks each crawl execution for progress reporting and auditing.

| Field | Type | Constraints | Nullable | Default | Description |
|-------|------|-------------|----------|---------|-------------|
| id | UUID | PRIMARY KEY | NOT NULL | `gen_random_uuid()` | Session identifier |
| user_id | UUID | FK `auth.users(id)` ON DELETE CASCADE | NOT NULL | -- | Owning user |
| site_url | TEXT | -- | NOT NULL | -- | Root URL being crawled |
| status | TEXT | CHECK IN (`running`, `completed`, `cancelled`, `error`) | NOT NULL | `'running'` | Current session state |
| discovery_method | TEXT | CHECK IN (`sitemap`, `homepage_crawl`) | NOT NULL | `'sitemap'` | How URLs were discovered |
| urls_discovered | INTEGER | CHECK >= 0 | NOT NULL | 0 | Total URLs found in sitemap or via link-following |
| urls_crawled | INTEGER | CHECK >= 0 | NOT NULL | 0 | Pages successfully fetched and extracted |
| urls_errored | INTEGER | CHECK >= 0 | NOT NULL | 0 | Pages that failed (timeout, 4xx, 5xx) |
| max_pages | INTEGER | CHECK > 0 | NOT NULL | 10000 | Page cap for this session |
| started_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | Session start time |
| completed_at | TIMESTAMPTZ | -- | YES | NULL | Session end time |
| error_log | JSONB | -- | NOT NULL | `'[]'::jsonb` | Array of `{url, status, error, timestamp}` objects |

**RLS:** Same user_id pattern.

### 2.5 performance_snapshots

Time-series performance data. One row per URL per day per source. This is the highest-volume table in the system.

| Field | Type | Constraints | Nullable | Default | Description |
|-------|------|-------------|----------|---------|-------------|
| id | UUID | PRIMARY KEY | NOT NULL | `gen_random_uuid()` | Snapshot identifier |
| user_id | UUID | FK `auth.users(id)` ON DELETE CASCADE | NOT NULL | -- | Owning user |
| content_id | UUID | FK `content_inventory(id)` ON DELETE SET NULL | YES | NULL | Linked inventory item (NULL if URL not yet in inventory) |
| url | TEXT | -- | NOT NULL | -- | URL (denormalized for query speed -- avoids JOIN on hot path) |
| snapshot_date | DATE | -- | NOT NULL | -- | Date of this snapshot |
| source | TEXT | CHECK IN (`gsc`, `ga4`, `semrush`, `ahrefs`, `combined`) | NOT NULL | -- | Which connector produced this data |
| clicks | INTEGER | CHECK >= 0 | YES | NULL | GSC clicks |
| impressions | INTEGER | CHECK >= 0 | YES | NULL | GSC impressions |
| ctr | NUMERIC(5,4) | CHECK >= 0 AND CHECK <= 1 | YES | NULL | Click-through rate (0.0000 to 1.0000) |
| avg_position | NUMERIC(6,2) | CHECK > 0 | YES | NULL | Average SERP position (1.00 = top) |
| sessions | INTEGER | CHECK >= 0 | YES | NULL | GA4 sessions |
| engaged_sessions | INTEGER | CHECK >= 0 | YES | NULL | GA4 engaged sessions |
| bounce_rate | NUMERIC(5,4) | CHECK >= 0 AND CHECK <= 1 | YES | NULL | GA4 bounce rate |
| avg_engagement_time | NUMERIC(8,2) | CHECK >= 0 | YES | NULL | GA4 avg engagement time (seconds) |
| scroll_depth | NUMERIC(5,2) | CHECK >= 0 AND CHECK <= 100 | YES | NULL | GA4 average scroll depth percentage |
| organic_traffic | INTEGER | CHECK >= 0 | YES | NULL | Semrush estimated organic traffic |
| keyword_count | INTEGER | CHECK >= 0 | YES | NULL | Semrush ranking keyword count |
| backlinks | INTEGER | CHECK >= 0 | YES | NULL | Ahrefs backlink count |
| referring_domains | INTEGER | CHECK >= 0 | YES | NULL | Ahrefs referring domain count |
| domain_rating | NUMERIC(5,2) | CHECK >= 0 AND CHECK <= 100 | YES | NULL | Ahrefs domain rating |
| health_score | NUMERIC(5,2) | CHECK >= 0 AND CHECK <= 100 | YES | NULL | Computed composite health score (0-100) |
| decay_signal | BOOLEAN | -- | NOT NULL | `false` | True if declining trend detected over 3-month window |
| metadata | JSONB | -- | NOT NULL | `'{}'::jsonb` | `{ topQueries: [...], deviceBreakdown: {}, countryBreakdown: {}, serpFeatures: [] }` |
| created_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | Row creation time |

**Unique constraint:** `UNIQUE (user_id, url, snapshot_date, source)` -- one snapshot per URL per day per source.

**Indexes:**
- `idx_perf_user_date` on `(user_id, snapshot_date DESC)` -- dashboard time-series queries
- `idx_perf_content_date` on `(content_id, snapshot_date DESC)` -- per-URL trend charts
- `idx_perf_user_url_source` on `(user_id, url, source)` -- connector-specific lookups
- `idx_perf_health_score` on `(user_id, health_score)` WHERE `health_score IS NOT NULL` -- sort by health

**Partitioning:** Range partition on `snapshot_date` by month. Each month is a separate physical partition for efficient purge and query performance.

**RLS:** Same user_id pattern. Scheduler writes use service_role key to bypass RLS.

### 2.6 performance_snapshots_monthly

Monthly rollup aggregation table for long-term historical queries.

| Field | Type | Constraints | Nullable | Default | Description |
|-------|------|-------------|----------|---------|-------------|
| id | UUID | PRIMARY KEY | NOT NULL | `gen_random_uuid()` | Row identifier |
| user_id | UUID | FK `auth.users(id)` ON DELETE CASCADE | NOT NULL | -- | Owning user |
| content_id | UUID | FK `content_inventory(id)` ON DELETE SET NULL | YES | NULL | Linked inventory item |
| url | TEXT | -- | NOT NULL | -- | URL (denormalized) |
| month | DATE | -- | NOT NULL | -- | First day of the month (e.g., `2026-03-01`) |
| avg_clicks | NUMERIC(10,2) | -- | YES | NULL | Monthly average daily clicks |
| avg_impressions | NUMERIC(10,2) | -- | YES | NULL | Monthly average daily impressions |
| avg_ctr | NUMERIC(5,4) | -- | YES | NULL | Monthly average CTR |
| avg_position | NUMERIC(6,2) | -- | YES | NULL | Monthly average position |
| total_sessions | INTEGER | -- | YES | NULL | Monthly total sessions |
| avg_health_score | NUMERIC(5,2) | -- | YES | NULL | Monthly average health score |
| created_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | Row creation time |

**Unique constraint:** `UNIQUE (user_id, url, month)`.

**Index:** `idx_monthly_user_month` on `(user_id, month DESC)`.

### 2.7 ingestion_jobs

Tracks each scheduled or manual ingestion run.

| Field | Type | Constraints | Nullable | Default | Description |
|-------|------|-------------|----------|---------|-------------|
| id | UUID | PRIMARY KEY | NOT NULL | `gen_random_uuid()` | Job identifier |
| user_id | UUID | FK `auth.users(id)` ON DELETE CASCADE | NOT NULL | -- | Target user |
| source | TEXT | CHECK IN (`gsc`, `ga4`, `semrush`, `ahrefs`, `trends`, `crawler`, `purge`) | NOT NULL | -- | Which connector or task |
| status | TEXT | CHECK IN (`queued`, `running`, `completed`, `failed`, `cancelled`) | NOT NULL | `'queued'` | Current job state |
| trigger_type | TEXT | CHECK IN (`scheduled`, `manual`, `retry`) | NOT NULL | `'scheduled'` | What initiated this job |
| attempt | INTEGER | CHECK >= 1 AND CHECK <= 3 | NOT NULL | 1 | Current attempt number (max 3) |
| rows_processed | INTEGER | CHECK >= 0 | NOT NULL | 0 | Rows written to database |
| started_at | TIMESTAMPTZ | -- | YES | NULL | Execution start time |
| completed_at | TIMESTAMPTZ | -- | YES | NULL | Execution end time |
| error | TEXT | -- | YES | NULL | Error message if failed |
| metadata | JSONB | -- | NOT NULL | `'{}'::jsonb` | `{ apiCallsMade: N, costEstimate: N, retryAfter: "timestamp" }` |
| created_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | Job creation time |

**Index:** `idx_jobs_user_source_status` on `(user_id, source, status)` -- find active jobs per source.

### 2.8 api_cache

7-day cache for expensive third-party API responses (Semrush, Ahrefs).

| Field | Type | Constraints | Nullable | Default | Description |
|-------|------|-------------|----------|---------|-------------|
| id | UUID | PRIMARY KEY | NOT NULL | `gen_random_uuid()` | Cache entry ID |
| cache_key | TEXT | UNIQUE | NOT NULL | -- | SHA-256 hash of `provider + endpoint + params` |
| provider | TEXT | CHECK IN (`semrush`, `ahrefs`, `trends`) | NOT NULL | -- | Source provider |
| response_data | JSONB | -- | NOT NULL | -- | Cached API response |
| expires_at | TIMESTAMPTZ | -- | NOT NULL | -- | When this cache entry becomes stale |
| created_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | Cache write time |

**Index:** `idx_cache_key` on `(cache_key)` -- fast lookup. `idx_cache_expires` on `(expires_at)` -- purge expired entries.

---

## 3. API Endpoints

### 3.1 OAuth Connection Endpoints

**`GET /api/connections/google/auth`**
- **Auth:** User (Bearer token)
- **Request body:** None
- **Response (302 Redirect):** Redirects browser to Google OAuth consent screen
- **Side effects:** Creates row in `oauth_states` with `state`, `code_verifier`, `user_id`
- **Error codes:** 401 Unauthorized (no token), 409 Conflict (Google connection already exists and is active)

**`GET /api/connections/google/callback`**
- **Auth:** None (validated via `state` parameter against `oauth_states` table)
- **Query params:** `code` (authorization code), `state` (CSRF token), `error` (if user denied)
- **Response (302 Redirect):** Redirects to dashboard `/connections?status=connected` or `/connections?error=...`
- **Side effects:** Exchanges code for tokens, encrypts via KeyManager, upserts `client_connections`, deletes `oauth_states` row
- **Error codes:** 400 Bad Request (missing code/state), 403 Forbidden (invalid/expired state), 502 Bad Gateway (Google token exchange failed)

**`GET /api/connections`**
- **Auth:** User (Bearer token)
- **Request body:** None
- **Response (200):** `{ success: true, data: [{ id, provider, provider_account_id, status, gsc_property, ga4_property_id, last_sync_at, last_error, sync_count, created_at }] }`
- **Note:** NEVER returns `access_token_encrypted` or `refresh_token_encrypted`
- **Error codes:** 401 Unauthorized

**`GET /api/connections/status`**
- **Auth:** User (Bearer token)
- **Response (200):** `{ success: true, data: { google: { status, last_sync_at, last_error, token_expires_in_hours, data_freshness_hours }, semrush: {...}, ahrefs: {...} } }`
- **Error codes:** 401 Unauthorized

**`POST /api/connections/semrush`**
- **Auth:** User (Bearer token)
- **Request body:** `{ api_key: "string" }`
- **Response (201):** `{ success: true, data: { id, provider: "semrush", status: "connected" } }`
- **Side effects:** Validates key by making a test API call, encrypts via KeyManager, stores in `client_connections`
- **Error codes:** 401, 400 Bad Request (missing/invalid key), 422 Unprocessable Entity (key validation failed against Semrush API)

**`POST /api/connections/ahrefs`**
- **Auth:** User (Bearer token)
- **Request body:** `{ api_token: "string" }`
- **Response (201):** Same pattern as Semrush
- **Error codes:** 401, 400, 422

**`DELETE /api/connections/:id`**
- **Auth:** User (Bearer token)
- **Response (200):** `{ success: true, message: "Connection revoked and deleted" }`
- **Side effects:** Calls Google token revocation endpoint (for Google connections), deletes row from `client_connections`
- **Error codes:** 401, 404 Not Found (connection doesn't exist or belongs to another user -- always 404, never 403 to prevent enumeration)

**`POST /api/connections/:id/refresh`**
- **Auth:** User (Bearer token)
- **Response (200):** `{ success: true, data: { status: "connected", token_expires_at: "..." } }`
- **Side effects:** Decrypts refresh token, calls Google token endpoint, re-encrypts new access token, updates `token_expires_at`
- **Error codes:** 401, 404, 502 Bad Gateway (Google refresh failed), 409 Conflict (connection is not a Google provider)

**`POST /api/connections/:id/property`**
- **Auth:** User (Bearer token)
- **Request body:** `{ gsc_property: "sc-domain:example.com", ga4_property_id: "properties/123456" }`
- **Response (200):** `{ success: true, data: { gsc_property, ga4_property_id } }`
- **Error codes:** 401, 404, 400 (missing required fields)

### 3.2 Content Inventory Endpoints

**`GET /api/inventory`**
- **Auth:** User (Bearer token)
- **Query params:** `page` (default 1), `limit` (default 50, max 200), `status` (filter), `search` (title/URL/author match), `sort` (field name), `order` (`asc`/`desc`)
- **Response (200):** `{ success: true, data: { items: [...], total: N, page: N, pages: N } }`
- **Error codes:** 401, 400 (invalid pagination params)

**`GET /api/inventory/:id`**
- **Auth:** User (Bearer token)
- **Response (200):** Full content_inventory row with all metadata fields
- **Error codes:** 401, 404

**`POST /api/inventory/crawl`**
- **Auth:** User (Bearer token)
- **Request body:** `{ site_url: "https://example.com", max_pages?: 10000 }`
- **Response (202 Accepted):** `{ success: true, data: { job_id: "uuid", status: "running" } }`
- **Side effects:** Starts async crawl, creates `crawl_sessions` row
- **Error codes:** 401, 400 (invalid URL), 409 (crawl already running), 429 (rate limited -- max 1 crawl per hour per user)

**`GET /api/inventory/crawl/progress/:jobId`**
- **Auth:** User (Bearer token)
- **Response:** SSE stream with events: `discovered` (new URL found), `crawled` (page processed), `error` (page failed), `complete` (crawl finished)
- **Error codes:** 401, 404

**`POST /api/inventory/crawl/:jobId/cancel`**
- **Auth:** User (Bearer token)
- **Response (200):** `{ success: true, message: "Crawl cancelled" }`
- **Error codes:** 401, 404, 409 (crawl already completed)

**`GET /api/inventory/stats`**
- **Auth:** User (Bearer token)
- **Response (200):** `{ success: true, data: { total_urls: N, by_status: {ok: N, thin: N, ...}, avg_word_count: N, by_language: {en: N, ar: N}, last_crawl: "timestamp" } }`
- **Error codes:** 401

**`GET /api/inventory/:id/history`**
- **Auth:** User (Bearer token)
- **Query params:** `days` (default 90, max 365), `source` (filter by connector)
- **Response (200):** `{ success: true, data: [{ snapshot_date, clicks, impressions, ctr, avg_position, sessions, health_score }] }`
- **Error codes:** 401, 404

### 3.3 Ingestion Management Endpoints

**`GET /api/ingestion/status`**
- **Auth:** User (Bearer token)
- **Response (200):** `{ success: true, data: { sources: { gsc: { last_run, next_scheduled, status }, ga4: {...}, ... }, scheduler_running: true } }`
- **Error codes:** 401

**`POST /api/ingestion/trigger/:source`**
- **Auth:** User (Bearer token)
- **URL params:** `source` -- one of `gsc`, `ga4`, `semrush`, `ahrefs`, `trends`, `crawler`
- **Response (202 Accepted):** `{ success: true, data: { job_id: "uuid" } }`
- **Error codes:** 401, 400 (invalid source), 409 (job already running for this source), 429 (max 5 manual triggers per hour)

**`GET /api/ingestion/cost`**
- **Auth:** Admin only
- **Query params:** `user_id` (optional, filter to specific client)
- **Response (200):** `{ success: true, data: { by_client: [{ user_id, provider, api_calls_this_month, estimated_cost_cents }], total_cost_cents: N } }`
- **Error codes:** 401, 403 Forbidden (non-admin)

**`GET /api/ingestion/health`**
- **Auth:** Admin only
- **Response (200):** `{ success: true, data: { total_connections: N, active: N, expired: N, errored: N, failed_syncs_24h: N, expired_tokens: [{ user_id, provider, expired_since }] } }`
- **Error codes:** 401, 403

---

## 4. Business Rules

**BR-01: Proactive Token Refresh.** Access tokens are refreshed when `token_expires_at` is within 24 hours of the current time. The scheduler checks token expiry on every cycle (not just when a pull is attempted). If the refresh fails on the first attempt, it retries at 1 hour and 6 hours. If all three attempts fail, the connection status changes to `expired` and the user sees an orange banner on the dashboard reading "Your Google connection has expired. Click here to reconnect."

**BR-02: Token Revocation Detection.** When Google returns HTTP 400 with `error: "invalid_grant"` during a refresh attempt, the connection status is immediately set to `revoked` (not `expired`). Revoked connections require full re-authentication -- the refresh token is deleted. The dashboard shows: "Google has revoked access. Please reconnect your account."

**BR-03: One Connection Per Provider Per User.** The `UNIQUE (user_id, provider)` constraint enforces this at the database level. Attempting to create a second Google connection for the same user returns 409 Conflict. The user must disconnect the existing connection first.

**BR-04: Semrush/Ahrefs Cost Management.** All Semrush and Ahrefs API responses are cached for 7 days in the `api_cache` table. Before making any API call, the connector checks the cache first. If a cached response exists and has not expired, it is used without making an API call. Monthly API cost per client must not exceed $400. When 80% of the monthly budget is consumed, the system switches to cache-only mode for Semrush/Ahrefs and logs a warning.

**BR-05: Crawler Politeness.** The crawler never exceeds 3 concurrent requests to the same host. The minimum delay between sequential requests to the same host is 500ms, or the `Crawl-delay` directive from `robots.txt` if it specifies a higher value. The User-Agent is always `ChainIQ-Bot/1.0 (+https://chainiq.io/bot)`. URLs disallowed by `robots.txt` for this user-agent or the `*` wildcard are never fetched.

**BR-06: Content Inventory Upsert.** When a crawl discovers a URL that already exists in `content_inventory` for that user, it performs an UPDATE (not INSERT). The `content_hash` field is compared: if unchanged, only `last_crawled_at` is updated. If changed, all metadata fields are refreshed and `consecutive_missing` is reset to 0. This preserves the `first_discovered_at` timestamp.

**BR-07: Stale Content Removal.** If a URL is not found in 3 consecutive crawl sessions, its status is set to `removed`. Removed items are retained in the database (not deleted) for historical reference but are excluded from active inventory counts and intelligence analysis. They can be manually restored if re-discovered.

**BR-08: Data Freshness SLA.** GSC and GA4 data must be no older than 48 hours for any active client. If the scheduler detects that a client's last successful GSC sync is older than 48 hours, it triggers an immediate retry (outside the normal schedule). If the retry also fails, an alert is logged.

**BR-09: Manual Sync Rate Limiting.** Users can manually trigger data pulls via `POST /api/ingestion/trigger/:source`, but are limited to 5 manual triggers per hour per user across all sources. This prevents accidental API cost spikes and rate limit exhaustion.

**BR-10: Health Score Recalculation.** Health scores are recalculated every time new performance data is ingested. The score uses the weighted formula defined in Section 7. A score change of 10+ points in a single day triggers the `decay_signal` flag to be set to `true` and is surfaced as a notification on the dashboard.

**BR-11: First-Connect Triage.** When a user completes their first Google OAuth connection, the system automatically triggers a full data pull (GSC 90 days + GA4 90 days) and a content crawl. This provides the "state of your content" view within 5 minutes of connecting, demonstrating immediate value.

**BR-12: Property Selection Requirement.** After OAuth callback, the user MUST select a GSC property and GA4 property before any data pulls can begin. The connection status remains `pending` until properties are selected via `POST /api/connections/:id/property`. The scheduler skips connections in `pending` status.

**BR-13: Concurrent Crawl Prevention.** Only one crawl session can be active per user at any time. Attempting to start a second crawl while one is running returns 409 Conflict. The running crawl can be cancelled via `POST /api/inventory/crawl/:jobId/cancel`.

**BR-14: Data Isolation.** No client can ever see, query, or infer the existence of another client's data. RLS policies enforce this at the database level. API responses never include cross-client aggregate data. Even admin endpoints that show aggregate statistics never expose individual client data to other clients.

---

## 5. Connectors

### 5.1 Google Search Console Connector (`bridge/ingestion/gsc.js`)

**Auth method:** OAuth 2.0 with scope `https://www.googleapis.com/auth/webmasters.readonly`. Access token obtained via `GoogleOAuth.getValidAccessToken(connectionId)` which handles automatic refresh.

**Data pulled:**
- Search Analytics: clicks, impressions, CTR, average position per page per query
- Dimensions: `[page, query]` for full matrix (cannibalization detection), `[page]` for per-URL aggregates, `[query, device]` for device breakdown, `[query, country]` for geographic breakdown
- Date range: last 90 days (GSC retains 16 months, but 90 days is sufficient for trend detection; configurable via metadata)
- Index coverage status (optional, via URL Inspection API for technical SEO alerts)

**API calls per sync:** 5-20 per client depending on site size. Each request returns max 25,000 rows. A 10,000-page site with 5 queries/page averages ~2 requests for page-level data and ~4 requests for the page-query matrix. Pagination via `startRow` incrementing by 25,000.

**Refresh cycle:** Daily at 03:00 UTC. GSC data has a 48-72 hour delay; the connector automatically sets `endDate` to 3 days ago to avoid requesting data that does not yet exist.

**Rate limit handling:** Google Search Console API allows 1,200 queries per 100 seconds per project. The connector enforces a 200ms delay between requests. On 429 responses, exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, max 60s. Max 5 retries per request.

**Error recovery:**
- 401 Unauthorized: Attempt token refresh via `GoogleOAuth.refreshToken()`. If refresh succeeds, retry the request. If refresh fails, mark connection as `expired`, log error, notify user via dashboard banner.
- 403 Forbidden: Mark connection as `error`, store message "API access denied -- verify that you have owner or full user access to this Search Console property." Do not retry.
- 429 Too Many Requests: Exponential backoff as described above.
- 5xx Server Error: Retry up to 3 times with 30-second delays. If persistent, mark job as `failed`, retry on next scheduled cycle.
- Network timeout (10s): Retry once immediately, then skip that request and continue with remaining URLs.

### 5.2 Google Analytics 4 Connector (`bridge/ingestion/ga4.js`)

**Auth method:** OAuth 2.0 with scope `https://www.googleapis.com/auth/analytics.readonly`. Same OAuth connection as GSC (bundled Google sign-in).

**Data pulled:**
- Metrics: `sessions`, `engagedSessions`, `engagementRate`, `averageSessionDuration`, `bounceRate`, `screenPageViews`
- Scroll depth: via `percent_scrolled` event data (requires GA4 Enhanced Measurement enabled)
- Dimensions: `pagePath`, `date`, `deviceCategory`
- Date range: last 90 days

**API calls per sync:** 3-10 per client. GA4 Data API returns up to 100,000 rows per request. Most sites fit in 1-2 requests for page-level data plus 1 request for scroll depth events.

**Refresh cycle:** Daily at 03:30 UTC (offset 30 minutes from GSC to avoid parallel Google API load).

**Rate limit handling:** GA4 Data API has a quota of 10,000 tokens per day per property. Each `runReport` call costs 1-10 tokens depending on query complexity. The connector tracks cumulative token usage per property per day. At 80% consumption (8,000 tokens), it pauses and resumes the next day with a log message "GA4 daily quota 80% consumed, pausing until tomorrow."

**Error recovery:** Same pattern as GSC (401 -> refresh, 403 -> error state, 429 -> backoff, 5xx -> retry). Additional: if GA4 returns sampled data (indicated by `metadata.samplingMetadatas` in response), the connector logs a warning "GA4 data is sampled for this property -- metrics may be approximate" and stores `{ sampled: true }` in the snapshot metadata.

### 5.3 Semrush Connector (`bridge/ingestion/semrush.js`)

**Auth method:** API key (ChainIQ-owned, not per-client). Key stored encrypted in environment variable `SEMRUSH_API_KEY`, decrypted at call time.

**Data pulled:**
- Domain Analytics (`/analytics/v1/?type=domain_organic`): organic traffic estimate, ranking keywords, top pages by traffic
- Keyword Gap (`/analytics/v1/?type=domain_vs_domain`): keywords competitors rank for but client does not. Competitors auto-detected from SERP overlap or manually configured
- SERP Features (`/analytics/v1/?type=domain_organic_serp_features`): featured snippets, PAA, knowledge panels per keyword
- Topic Research (`/analytics/v1/?type=topic_research`): related subtopics, question-based queries

**API calls per sync:** 10-30 per client (depends on number of competitors configured). Each API call consumes API units from ChainIQ's plan.

**Refresh cycle:** Weekly, Monday at 04:00 UTC. Weekly is sufficient because competitive intelligence changes slowly.

**Rate limit handling:** Semrush allows 10 requests per second. The connector enforces a 150ms minimum delay between requests (below the limit, with margin). On 429 responses, pause for 60 seconds then resume. If rate limited 3 times in one sync, abort and reschedule for the next day.

**Error recovery:**
- 401/403: API key invalid or expired. Log critical error, pause all Semrush syncs, alert admin. This affects ALL clients (shared key).
- 429: Pause 60 seconds, retry. After 3 pauses, abort sync for this client, continue with next client.
- API unit exhaustion (monthly limit reached): Pause all Semrush syncs for the remainder of the month. Switch to cache-only mode. Alert admin with "Semrush monthly API units exhausted. All clients using cached data until next billing cycle."
- Cache-first strategy: Before every API call, check `api_cache` table. If cached response exists and `expires_at > now()`, return cached data without making an API call.

### 5.4 Ahrefs Connector (`bridge/ingestion/ahrefs.js`)

**Auth method:** API token (ChainIQ-owned). Token stored encrypted in environment variable `AHREFS_API_TOKEN`, decrypted at call time.

**Data pulled:**
- Backlink Profile (`/v3/site-explorer/backlinks`): total backlinks, referring domains, domain rating per client domain
- Top Pages (`/v3/site-explorer/top-pages`): estimated organic traffic per URL, used for authority scoring
- Keyword Explorer (`/v3/keywords-explorer/keyword-ideas`): keyword difficulty, search volume, SERP overview for gap-identified keywords

**API calls per sync:** 5-15 per client. Ahrefs uses row-based pricing (charged per row returned, not per request).

**Refresh cycle:** Weekly, Tuesday at 04:00 UTC (offset from Semrush to spread API load across the week).

**Rate limit handling:** Ahrefs API v3 rate limits vary by plan. The connector reads the `X-RateLimit-Remaining` header from each response. When remaining drops below 10% of the limit, the connector pauses for the `X-RateLimit-Reset` duration.

**Error recovery:**
- 401: Token invalid. Same as Semrush -- affects all clients, alert admin.
- 429: Honor `Retry-After` header. If no header, pause 120 seconds.
- Row limit exceeded: Log which client's sync was truncated, store partial data with `{ partial: true, rows_truncated_at: N }` in metadata.

### 5.5 Google Trends Connector (`bridge/ingestion/trends.js`)

**Auth method:** Public API (no credentials required). Rate-limited by IP.

**Data pulled:**
- Interest over time: 5-year weekly resolution for topic keywords. Used for seasonal pattern detection (e.g., "BMW winter tires" peaks October-December)
- Related queries: rising and top queries for each tracked topic
- Regional interest: demand signals by country (for international content strategy)

**API calls per sync:** 3-10 per client (one per tracked topic keyword, max 10 topics tracked per client).

**Refresh cycle:** Weekly, Wednesday at 04:00 UTC.

**Rate limit handling:** Google Trends has aggressive rate limiting. The connector enforces a minimum 10-second delay between requests. On rate limit detection (HTTP 429 or empty response body which Trends uses instead of 429), pause for 60 seconds. Max 3 retries per keyword.

**Error recovery:**
- Rate limited: Wait 60 seconds, retry. After 3 retries, skip this keyword and continue.
- Empty response: Trends returns empty data for very niche queries. Store `{ no_data: true }` in metadata and do not retry.
- Geographic restriction: Some trend data is unavailable in certain regions. Log and continue.

### 5.6 Content Crawler (`bridge/ingestion/crawler.js`)

**Auth method:** None (HTTP crawl). User-Agent: `ChainIQ-Bot/1.0 (+https://chainiq.io/bot)`.

**Discovery strategy (in order):**
1. Fetch `/sitemap.xml`. If it is a sitemap index (`<sitemapindex>`), fetch all child sitemaps recursively.
2. If no sitemap, fetch `/sitemap_index.xml` as a fallback.
3. If neither exists, fall back to homepage BFS link-following with max depth 5.
4. In all modes, also check common blog paths: `/blog/*`, `/articles/*`, `/news/*`, `/posts/*`, `/magazine/*`.

**Data extracted per URL:** Title (`<title>` or `<h1>`), meta description, word count (visible text only, nav/footer/header/aside stripped), heading structure (H1-H6 with text), author (meta tag -> JSON-LD -> byline pattern), publish date (`article:published_time` -> JSON-LD `datePublished` -> `<time datetime>` -> URL pattern), modified date, language, internal/external link counts, image count, images with alt text, JSON-LD schema types, canonical URL, content hash (SHA-256 of stripped body text).

**API calls per sync:** N/A (HTTP crawl, not an API). 1 HTTP request per page. A 1,000-page site at 500ms delay with 3 concurrency completes in approximately 3 minutes.

**Refresh cycle:** On-demand (user triggers via `POST /api/inventory/crawl`) or weekly (Sunday at 02:00 UTC if auto-crawl is enabled in connection metadata).

**Crawl settings (configurable per client):**
- `maxConcurrency`: 3 (default), max 5
- `delayMs`: 500 (default), minimum 200
- `maxPages`: 10,000 (default), max 50,000
- `maxDepth`: 5 (homepage fallback only)
- `timeoutMs`: 10,000 per request
- `maxRedirects`: 5 hops
- `maxPageSize`: 5MB (skip pages larger than this)

**Error recovery:**
- robots.txt disallowed: Skip URL silently, log in crawl session's `error_log`.
- HTTP 403/401: Skip URL, log "Access denied." Continue crawl.
- HTTP 5xx: Retry once after 5 seconds. If still failing, skip and log.
- Timeout (10s): Skip URL, log "Request timed out." Continue crawl.
- Non-HTML Content-Type: Skip (no extraction). Log count of skipped non-HTML resources.
- Redirect loop (>5 hops): Abort that URL, log "Redirect loop detected."
- Connection refused: Skip URL. If 10 consecutive connection refusals, pause crawl for 30 seconds (server may be overloaded).

---

## 6. Scheduler

### Schedule Table

The scheduler is implemented in `bridge/ingestion/scheduler.js` using `setInterval` with drift correction. Last-run timestamps are stored in Supabase for persistence across restarts.

| Source | Default Interval | Default Time (UTC) | Configurable Per Client | Priority |
|--------|-----------------|-------------------|------------------------|----------|
| Token Refresh Check | Every 6 hours | 00:00, 06:00, 12:00, 18:00 | No | P0 (runs before all pulls) |
| GSC | Daily | 03:00 | Yes (via connection metadata) | P0 |
| GA4 | Daily | 03:30 | Yes | P0 |
| Semrush | Weekly (Monday) | 04:00 | Yes | P1 |
| Ahrefs | Weekly (Tuesday) | 04:00 | Yes | P1 |
| Trends | Weekly (Wednesday) | 04:00 | Yes | P2 |
| Crawler | Weekly (Sunday) | 02:00 | Yes (can be disabled) | P1 |
| Data Purge | Weekly (Saturday) | 01:00 | No | P0 |
| Cache Cleanup | Daily | 05:00 | No | P2 |
| OAuth State Cleanup | Every 30 minutes | -- | No | P0 |

### Job Execution Flow

1. Scheduler timer fires at the scheduled time.
2. Query all active `client_connections` for the relevant provider.
3. For each client, create an `ingestion_jobs` row with `status: 'queued'`.
4. Process clients sequentially (not in parallel) to control API rate limits.
5. Update job `status` to `'running'`, set `started_at`.
6. Execute connector's pull method. Update `rows_processed` incrementally.
7. On success: set `status: 'completed'`, set `completed_at`.
8. On failure: increment `attempt`, set `error` message, apply retry logic.

### Retry Logic

- **Attempt 1 failure:** Retry after 1 minute.
- **Attempt 2 failure:** Retry after 5 minutes.
- **Attempt 3 failure:** Mark job as `failed`. Log structured error. Send alert via webhook (if configured). Do not retry again -- the next scheduled cycle will create a new job.

Backoff formula: `delay_ms = Math.min(baseDelay * Math.pow(5, attempt - 1), 30 * 60 * 1000)` where `baseDelay = 60000` (1 minute). This produces delays of 1 min, 5 min, 25 min (capped at 30 min).

### Restart Recovery

On bridge server startup, the scheduler:
1. Reads last-run timestamps for each source from Supabase.
2. For any source where `last_run + interval < now()`, immediately queues a catch-up run.
3. This ensures that a Coolify container restart at 3:30 AM does not cause GSC data to be skipped for that day.

### Data Purge Policy

The weekly purge job (Saturday 01:00 UTC) performs:

1. **Daily-to-monthly rollup:** For all `performance_snapshots` rows where `snapshot_date < now() - 90 days`, compute monthly averages per URL and insert into `performance_snapshots_monthly`. Then delete the daily rows.
2. **Stale content marking:** For all `content_inventory` rows where `consecutive_missing >= 3`, set `status = 'removed'`.
3. **Orphaned job cleanup:** Delete `ingestion_jobs` rows older than 30 days.
4. **Cache cleanup:** Delete `api_cache` rows where `expires_at < now()`.
5. **OAuth state cleanup:** Delete `oauth_states` rows older than 10 minutes (also runs every 30 minutes as a separate task).

---

## 7. ContentPerformanceRecord

The ContentPerformanceRecord is the unified data model that normalizes output from all connectors into a single structure per URL. It is the contract between Layer 1 (Data Ingestion) and Layer 2 (Content Intelligence).

### Unified Structure

```javascript
{
  url: "/blog/n54-hpfp-symptoms",
  title: "N54 HPFP Failure Symptoms",
  publishDate: "2025-06-14",
  author: "Mike T.",
  wordCount: 2840,
  gsc: {
    clicks: 1420,
    impressions: 28300,
    ctr: 0.0502,
    avgPosition: 8.2,
    topQueries: ["n54 hpfp", "bmw hpfp symptoms", "n54 fuel pump failure"],
    deviceBreakdown: { desktop: 62, mobile: 35, tablet: 3 },
    countryBreakdown: { US: 45, UK: 18, DE: 12 }
  },
  ga4: {
    sessions: 1680,
    engagementRate: 0.72,
    scrollDepth: 64,
    avgSessionDuration: 245,
    bounceRate: 0.28
  },
  semrush: {
    organicTraffic: 1350,
    keywords: 47,
    topKeywordKD: 32,
    serpFeatures: ["featured_snippet", "paa"]
  },
  ahrefs: {
    backlinks: 14,
    referringDomains: 8,
    domainRating: 42
  },
  trend: {
    threeMonthChange: -18,
    sixMonthChange: -34,
    seasonal: "peaks Oct-Dec",
    trendDirection: "declining"
  },
  status: "DECAYING",
  healthScore: 42
}
```

### Health Score Calculation Formula

The health score is a weighted composite of 6 normalized sub-scores, each scaled 0-100:

```
healthScore = (
  (clicks_trend_score    * 0.25) +   // 3-month click trend: growing=100, stable=50, declining by X% = 50-(X/2)
  (position_score        * 0.20) +   // Position: pos 1-3 = 100, pos 4-10 = 80-40, pos 11-20 = 30, pos 20+ = 10, pos 50+ = 0
  (engagement_score      * 0.15) +   // GA4 engagement rate * 100, capped at 100
  (authority_score       * 0.15) +   // (domain_rating / 100 * 50) + (min(referring_domains, 50) / 50 * 50)
  (freshness_score       * 0.15) +   // Days since publish or modify: 0-90 days = 100, 91-180 = 75, 181-365 = 50, 365+ = 25, no date = 40
  (momentum_score        * 0.10)     // Trend direction: growing = 100, stable = 50, declining = 0
)
```

**Sub-score calculations:**
- `clicks_trend_score`: Compare average daily clicks in the last 30 days vs the 30 days before that. If clicks grew: `50 + min(growth_pct / 2, 50)`. If declined: `50 - min(decline_pct / 2, 50)`. If no data: 50 (neutral).
- `position_score`: `max(0, 100 - (avg_position - 1) * 2)`. Position 1 = 100, position 50 = 2, position 51+ = 0.
- `engagement_score`: `min(engagement_rate * 100, 100)`. If no GA4 data: 50 (neutral).
- `authority_score`: `(domain_rating / 100) * 50 + (min(referring_domains, 50) / 50) * 50`. If no Ahrefs data: 25 (conservative).
- `freshness_score`: Based on the more recent of `publish_date` and `modified_date`.
- `momentum_score`: Derived from Google Trends 3-month change. `threeMonthChange >= 10` = 100 (growing), `-10 to 10` = 50 (stable), `<= -10` = `max(0, 50 + threeMonthChange)` (declining). If no Trends data: 50 (neutral).

### Status Classification Thresholds

| Status | Criteria | Dashboard Color |
|--------|----------|----------------|
| HEALTHY | `healthScore >= 70` AND `decay_signal = false` | Green |
| DECAYING | `healthScore 40-69` OR 3-month click decline >= 20% | Yellow |
| DECLINING | `healthScore 20-39` OR 3-month click decline >= 40% | Orange |
| DEAD | `healthScore < 20` OR zero clicks for 60+ consecutive days | Red |
| CANNIBALIZED | Multiple URLs competing for the same top query (detected by Content Intelligence, not Data Ingestion) | Purple |
| NEW | URL discovered but no performance data yet (< 7 days in inventory) | Gray |

---

## 8. Auth & Permissions

### Role x Action Matrix

| Action | Client User | Client Admin | ChainIQ Admin | Scheduler (service_role) |
|--------|-------------|--------------|---------------|--------------------------|
| Connect own Google account | YES | YES | NO (connects for client via impersonation only) | NO |
| Disconnect own connection | YES | YES | NO | NO |
| View own connection status | YES | YES | YES (via admin health endpoint) | NO |
| Trigger manual sync (own) | NO | YES | YES | N/A (runs automatically) |
| View own content inventory | YES | YES | YES | NO |
| Trigger content crawl | NO | YES | YES | YES (scheduled) |
| View ingestion cost data | NO | NO | YES | NO |
| View system-wide health | NO | NO | YES | NO |
| Write performance_snapshots | NO | NO | NO | YES (bypasses RLS) |
| Purge old data | NO | NO | YES (manual) | YES (scheduled) |
| Configure schedule per client | NO | YES | YES | N/A |

### Token Encryption Details

All OAuth tokens and API keys are encrypted using AES-256-GCM via the existing `KeyManager` class (`bridge/key-manager.js`):

- **Encryption algorithm:** AES-256-GCM (authenticated encryption with associated data)
- **Key source:** `BRIDGE_ENCRYPTION_KEY` environment variable (32-byte hex or base64 encoded)
- **IV (Initialization Vector):** 12 bytes, generated fresh for every encryption operation via `crypto.randomBytes(12)`
- **Output format:** `iv:authTag:ciphertext` (colon-separated, hex-encoded)
- **Decryption:** Happens ONLY at the moment of API call. Decrypted tokens are never cached in memory beyond the request lifecycle. After the API call completes or fails, the plaintext token variable is overwritten with `null`.
- **Key rotation:** If `BRIDGE_ENCRYPTION_KEY` changes, all existing encrypted tokens become undecryptable. A migration script must re-encrypt all tokens with the new key. This is a manual admin operation.

### CSRF Protection

OAuth callbacks are protected via the `state` parameter:
- Generated using `crypto.randomBytes(32).toString('hex')` (256 bits of entropy)
- Stored in `oauth_states` table with the user_id and PKCE `code_verifier`
- Validated on callback by querying `oauth_states` WHERE `state = ?`
- Expired states (>10 minutes old) are rejected
- After successful validation, the state row is deleted immediately

---

## 9. Validation Rules

**VR-01: Google OAuth Redirect URI.** The redirect URI in the OAuth request MUST exactly match the URI registered in Google Cloud Console. Mismatch causes `redirect_uri_mismatch` error. Validated before generating auth URL.

**VR-02: GSC Property Format.** Must match pattern `^(sc-domain:|https?://)` followed by a valid domain. Examples: `sc-domain:example.com`, `https://www.example.com/`. Validated on `POST /api/connections/:id/property`.

**VR-03: GA4 Property ID Format.** Must match pattern `^properties/\d+$`. Example: `properties/384291053`. Validated on property selection.

**VR-04: Semrush API Key Format.** Must be a non-empty string of 32-64 alphanumeric characters. Validated before encryption. Additionally, a test API call is made to verify the key works.

**VR-05: Ahrefs API Token Format.** Must be a non-empty string. Validated via test API call to Ahrefs `/v3/subscription-info` endpoint before storing.

**VR-06: Crawl Site URL.** Must be a valid absolute URL starting with `http://` or `https://`. Must not be an IP address (prevent internal network scanning). Must not be a `localhost` or `127.0.0.1` URL. Must not contain port numbers other than 80 or 443. Validated with `new URL()` parsing plus custom checks.

**VR-07: Crawl Max Pages.** Must be an integer between 1 and 50,000. Default 10,000. Values above 50,000 are rejected with "Maximum page limit is 50,000 per crawl session."

**VR-08: Pagination Parameters.** `page` must be a positive integer >= 1. `limit` must be an integer between 1 and 200. `sort` must be a whitelisted column name (prevent SQL injection via column name). `order` must be `asc` or `desc`.

**VR-09: Date Range Parameters.** `startDate` and `endDate` must be valid ISO 8601 date strings. `endDate` must be >= `startDate`. Date range must not exceed 365 days. Dates in the future are rejected.

**VR-10: Connection ID.** Must be a valid UUID v4 format. Non-UUID strings are rejected with 400 Bad Request before any database query.

**VR-11: Source Parameter.** The `source` parameter in `/api/ingestion/trigger/:source` must be one of: `gsc`, `ga4`, `semrush`, `ahrefs`, `trends`, `crawler`. Other values return 400 with "Invalid source. Valid sources: gsc, ga4, semrush, ahrefs, trends, crawler."

**VR-12: Request Body Size.** All POST request bodies are limited to 64KB (existing `readBody()` limit). Payloads exceeding this return 413 Payload Too Large.

---

## 10. Error Handling

### E-01: Silent Token Refresh Failure

**Trigger:** The scheduler attempts to refresh an access token that is expiring within 24 hours. Google returns HTTP 400 with `invalid_grant` or a network timeout occurs.
**Error code:** `TOKEN_REFRESH_FAILED`
**User message:** "Your Google connection needs to be reconnected. Data syncing has paused."
**Automatic recovery:** Retry at 1 hour and 6 hours. If all 3 attempts fail, set connection status to `expired`. Display orange banner on dashboard. Log `{ event: "token_refresh_failed", user_id, attempts: 3, last_error }`.

### E-02: Semrush Rate Limiting

**Trigger:** Semrush returns HTTP 429 during a data pull.
**Error code:** `SEMRUSH_RATE_LIMITED`
**User message:** None (invisible to user -- cached data is served).
**Automatic recovery:** Pause for 60 seconds, retry. After 3 rate limits in one sync, abort current client's sync, move to next client. Log `{ event: "semrush_rate_limited", client_count_affected: N }`. Use cached data for the affected client until next weekly cycle.

### E-03: Crawler Infinite Loop

**Trigger:** The crawler discovers that it is revisiting URLs it has already crawled (redirect loop, or CMS generating infinite URL variations like `/page/1`, `/page/2`, ... `/page/99999`).
**Error code:** `CRAWLER_LOOP_DETECTED`
**User message:** "Crawl stopped: detected URL pattern loop. [N] unique pages were successfully crawled."
**Automatic recovery:** The crawler maintains a `Set` of visited URLs. If the set exceeds `maxPages`, the crawl stops. Additionally, if the crawler detects 50+ URLs matching the same regex pattern (e.g., `/page/\d+`), it stops following that pattern and logs the detection.

### E-04: Database Table Growth Alert

**Trigger:** The `performance_snapshots` table exceeds 1 million rows for a single client (checked during purge job).
**Error code:** `TABLE_GROWTH_WARNING`
**User message:** None (admin-only alert).
**Automatic recovery:** Log `{ event: "table_growth_warning", user_id, row_count: N }`. If row count exceeds 5 million, automatically trigger an emergency purge that reduces retention from 90 days to 60 days for that client and alerts admin.

### E-05: Large Site Crawl Cap

**Trigger:** A client site has 50,000+ discoverable pages, exceeding the default crawl cap.
**Error code:** `CRAWL_CAP_REACHED`
**User message:** "Your site has more than [cap] pages. The crawl covered the first [cap] pages. Contact support to increase the limit."
**Automatic recovery:** Crawl completes with partial results. The crawler prioritizes sitemap URLs (which are usually the important pages) before link-following URLs.

### E-06: Supabase Connection Lost

**Trigger:** The bridge server cannot reach Supabase (network issue, Supabase outage, DNS failure).
**Error code:** `DATABASE_UNAVAILABLE`
**User message:** "Data sync temporarily unavailable. Your existing data is still accessible." (Dashboard reads from cache if available.)
**Automatic recovery:** Retry with exponential backoff: 5s, 15s, 45s. After 3 failures, pause the scheduler entirely. Set a flag `scheduler_paused = true`. Log `{ event: "supabase_connection_lost", retry_count: 3 }`. The `/health` endpoint returns `{ status: "degraded", database: "unreachable" }`. On next successful connection, resume scheduler and run catch-up jobs.

### E-07: API Cost Budget Exceeded

**Trigger:** Monthly Semrush or Ahrefs API usage reaches 80% of budget (configurable, default $400/month).
**Error code:** `COST_BUDGET_WARNING` (at 80%) or `COST_BUDGET_EXCEEDED` (at 100%)
**User message:** None (admin alert only).
**Automatic recovery:** At 80%: switch to cache-only mode for the affected provider. At 100%: pause all pulls for that provider for the remainder of the billing month. GSC and GA4 pulls continue (free APIs). Alert admin with "Semrush/Ahrefs budget [80%/100%] consumed. Using cached data only."

### E-08: OAuth Callback State Mismatch

**Trigger:** The OAuth callback receives a `state` parameter that does not match any row in `oauth_states` (potential CSRF attack or expired state).
**Error code:** `OAUTH_STATE_INVALID`
**User message:** "Connection failed: security validation error. Please try connecting again."
**Automatic recovery:** Redirect to `/connections?error=state_invalid`. No tokens are exchanged. Log `{ event: "oauth_state_mismatch", state_provided: "[first 8 chars]...", ip: req_ip }` for security audit.

### E-09: Google Property Access Revoked

**Trigger:** A GSC or GA4 API call returns 403 because the user removed ChainIQ's access in Google Account settings (not via ChainIQ's disconnect button).
**Error code:** `GOOGLE_ACCESS_REVOKED`
**User message:** "Google has revoked ChainIQ's access to your Search Console/Analytics. Please reconnect."
**Automatic recovery:** Set connection status to `revoked`. Delete encrypted tokens (they are useless). Display red banner on dashboard.

---

## 11. Edge Cases

### EC-01: JavaScript-Rendered Sites (SPAs)

Sites built with React, Vue, or Angular that render content client-side via JavaScript. The crawler fetches raw HTML which contains only a `<div id="root"></div>` and no content. **Handling:** The crawler detects this pattern (empty body or body word count < 50 with JavaScript bundle references present). It logs "JavaScript-rendered site detected -- content extraction will be limited" and stores what it can from meta tags and JSON-LD (which are often server-rendered even in SPAs). A future enhancement (Phase D) would add Puppeteer-based rendering.

### EC-02: Sites Behind Authentication

Client sites that require login to access content (intranets, membership sites). **Handling:** The crawler receives 401/403 on page fetch. After 5 consecutive 401/403 responses, the crawler stops and reports "Site appears to require authentication. ChainIQ cannot crawl password-protected content." The crawl session is marked as `error`.

### EC-03: CDN-Cached Pages

Sites served via Cloudflare, Fastly, or Akamai CDN with stale cached versions. **Handling:** The crawler sends `Cache-Control: no-cache` header on all requests. However, some CDNs ignore this for bot user-agents. The `content_hash` comparison between crawls catches content that the CDN eventually serves fresh. No special handling beyond this -- CDN-induced staleness is typically short-lived (hours, not days).

### EC-04: Multiple Sitemaps

Large sites with sitemap index files containing 50+ child sitemaps. **Handling:** The crawler follows the sitemap index recursively, fetching all child sitemaps. Each child sitemap adds its URLs to the discovery queue. The `maxPages` cap is enforced globally across all sitemaps, not per-sitemap. If the total discovered URLs exceed `maxPages * 2`, the crawler stops discovering and starts crawling what it has.

### EC-05: Non-Standard Blog Paths

Sites that use unusual URL structures for blog content (e.g., `/resources/insights/*`, `/learn/*`, `/knowledge-base/*`, `/en/blog/*` for internationalized sites). **Handling:** The sitemap-first approach catches these regardless of path. For homepage-fallback mode, the crawler follows all internal links regardless of path pattern, not just known blog paths. The `/blog/*`, `/articles/*` etc. patterns are used as prioritization hints (crawled first), not as filters.

### EC-06: Sites With 100K+ Pages

Enterprise publishers (like SRMG) with tens of thousands of pages. **Handling:** The default `maxPages` cap is 10,000. Enterprise clients can request a cap increase up to 50,000 via admin configuration. For sites exceeding the cap, the crawler prioritizes sitemap URLs (which are curated by the site owner), then follows links from those pages. At 50K pages with 500ms delay and 3 concurrency, a full crawl takes approximately 2.3 hours. The SSE progress endpoint keeps the user informed.

### EC-07: International Domains and Subdomains

Sites with multiple language versions (`example.com/en/`, `example.com/ar/`, or `en.example.com`, `ar.example.com`). **Handling:** The crawler stays within the domain/path scope defined by the `site_url` provided at crawl time. If the user provides `https://example.com`, the crawler follows all internal links within `example.com` including all subdirectories. If they provide `https://example.com/en/`, it only follows links within `/en/`. `hreflang` tags are parsed and stored in metadata but do not cause the crawler to cross domain boundaries.

### EC-08: Mixed HTTP/HTTPS

Sites that respond on both `http://` and `https://` with different content or redirect chains. **Handling:** The crawler normalizes all discovered URLs to the scheme of the `site_url` provided. If `site_url` is `https://example.com`, all `http://` links are rewritten to `https://` before fetching. Redirect chains from HTTP to HTTPS are followed (up to 5 hops). The `canonical_url` extraction handles the authoritative version.

### EC-09: Cloudflare Protection (Challenge Pages)

Sites with Cloudflare "Under Attack" mode or bot challenge pages. **Handling:** Cloudflare returns HTTP 403 with a challenge page. The crawler detects this (response body contains "Checking your browser" or "cf-challenge" marker). It logs "Site is protected by Cloudflare bot challenge -- cannot crawl" and marks the crawl session as `error`. The user is advised to whitelist the `ChainIQ-Bot` user-agent in their Cloudflare dashboard.

### EC-10: Stale DNS / Domain Not Resolving

Client provides a `site_url` for a domain that no longer resolves (expired domain, DNS propagation issue). **Handling:** The crawler's first request times out or throws `ENOTFOUND`. The crawl immediately fails with "Domain could not be resolved. Please verify the URL and try again." The crawl session status is set to `error`.

### EC-11: Sites Returning Soft 404s

Pages that return HTTP 200 but display "Page Not Found" content. **Handling:** The crawler checks for common soft-404 indicators: title contains "404" or "not found", word count < 100, body contains "page not found" or "page doesn't exist". Detected soft-404 pages are stored with `status: 'error'` and `http_status: 200` with a metadata flag `{ soft404: true }`.

### EC-12: Rate Limit Interference Between Clients

Multiple clients using ChainIQ simultaneously, all pulling GSC data at 03:00 UTC. **Handling:** The scheduler processes clients sequentially, not in parallel. Each client's GSC pull completes before the next begins. With an average of 10 API calls per client at 200ms delay, a 15-client agency processes all GSC pulls in approximately 30 seconds total. The sequential approach prevents Google API rate limit collisions.

---

## 12. Security

### Token Encryption

All OAuth access tokens, refresh tokens, and third-party API keys are encrypted at rest using AES-256-GCM. The encryption key is derived from the `BRIDGE_ENCRYPTION_KEY` environment variable. Encrypted values are stored as `TEXT` columns in `client_connections` in the format `iv:authTag:ciphertext` (hex-encoded, colon-separated). Tokens are decrypted ONLY at the moment of use (API call) and the plaintext is immediately nullified after use. Tokens are never logged, never included in API responses, never cached in memory beyond a single request's scope.

### CORS Policy

Production deployment restricts `Access-Control-Allow-Origin` to an explicit allowlist: `https://app.chainiq.io`, `https://dashboard.chainiq.io`, and subdomains matching `*.chainiq.io`. The OAuth callback endpoint is an exception -- it accepts GET redirects from `accounts.google.com` and performs server-side validation via the `state` parameter instead of CORS.

### Rate Limiting

- API endpoints: 60 requests per minute per user (existing in-memory Map)
- OAuth flow: 5 auth attempts per hour per user
- Manual sync triggers: 5 per hour per user
- Crawl requests: 1 per hour per user
- Admin endpoints: 120 requests per minute per admin

### robots.txt Compliance

The crawler ALWAYS fetches and parses `/robots.txt` before crawling any pages. Disallowed paths are never fetched. The `Crawl-delay` directive is honored. If `robots.txt` returns 5xx (server error), the crawler waits 60 seconds and retries. If `robots.txt` returns 404, the crawler assumes all paths are allowed. The crawler identifies itself as `ChainIQ-Bot/1.0` and checks directives for both this user-agent and the `*` wildcard.

### No PII in Logs

Structured logs from the ingestion service never contain: OAuth access tokens, refresh tokens, API keys, user email addresses, or Google account identifiers. Log entries use `user_id` (UUID) for identification. Tokens in error messages are replaced with `[REDACTED]`. IP addresses in OAuth callback logs are hashed (SHA-256) before storage.

### SSRF Prevention

The crawl URL validation prevents Server-Side Request Forgery:
- URL must start with `http://` or `https://`
- Hostname must not resolve to private IP ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x, 127.x.x.x, ::1)
- Hostname must not be `localhost`, `0.0.0.0`, or any loopback variant
- Port numbers other than 80 and 443 are rejected
- URL must not contain credentials (`user:pass@host`)

### Google OAuth Security

- PKCE (Proof Key for Code Exchange) is mandatory for all OAuth flows
- `code_verifier` is stored server-side only (in `oauth_states` table), never exposed to browser
- `state` parameter uses 256 bits of cryptographic randomness (`crypto.randomBytes(32)`)
- OAuth states expire after 10 minutes
- `access_type=offline` ensures refresh token is issued
- `prompt=consent` is set on re-authentication to ensure fresh refresh token

---

## 13. Performance

### performance_snapshots Growth Management

This table is the highest-growth table in the system. For a single enterprise client with 10,000 URLs:
- Daily: 10,000 new rows (1 per URL for GSC `combined` source)
- Monthly: ~300,000 rows
- Annual: ~3.6 million rows
- 5 enterprise clients: ~18 million rows/year

**Mitigation (all mandatory, not optional):**
1. **Range partitioning** by month on `snapshot_date`. Each month is a separate physical partition. Dropping a partition (during purge) is O(1) -- no row-by-row deletion.
2. **90-day rolling purge** with monthly rollup before deletion. The purge job computes averages into `performance_snapshots_monthly` before deleting daily rows.
3. **Query discipline:** Every query against `performance_snapshots` MUST include `user_id` AND a date range in the WHERE clause. The composite index `(user_id, snapshot_date DESC)` makes this efficient.
4. **Connection pooling:** Supabase Pro allows 100 concurrent connections. The scheduler uses a single connection (sequential client processing). Dashboard queries use the connection pool. Max concurrent dashboard connections: 50 (reserve 50 for scheduler + admin).

### Query Optimization

- **Dashboard overview query** (most frequent): `SELECT url, health_score, clicks, impressions FROM performance_snapshots WHERE user_id = ? AND snapshot_date = ? AND source = 'combined' ORDER BY health_score ASC LIMIT 50`. Hits the `(user_id, snapshot_date DESC)` index. Expected response time: < 50ms for 10K URLs.
- **Trend chart query** (per-URL): `SELECT snapshot_date, clicks, impressions, health_score FROM performance_snapshots WHERE content_id = ? AND snapshot_date >= ? ORDER BY snapshot_date ASC`. Hits the `(content_id, snapshot_date DESC)` index. Expected response time: < 20ms for 90 data points.
- **Content inventory list**: `SELECT * FROM content_inventory WHERE user_id = ? AND status != 'removed' ORDER BY publish_date DESC LIMIT 50 OFFSET ?`. Hits `(user_id, status)` index. Expected response time: < 30ms for 10K items.

### Caching Strategy

- **API response cache (`api_cache` table):** 7-day TTL for Semrush keyword data, 1-day TTL for SERP data, 30-day TTL for Ahrefs backlink profiles. Cache-aside pattern (check before fetch). Reduces API costs by 60-70%.
- **Auth verification cache (in-memory):** SHA-256 hashed tokens cached for 30 seconds. Prevents hitting Supabase Auth on every request. Already exists in bridge server.
- **Dashboard data caching:** The `/api/connections/status` endpoint result is cached server-side for 60 seconds (connection status does not change frequently). Inventory stats cached for 5 minutes.

### Concurrent Crawl Limits

- Maximum 3 simultaneous HTTP requests per crawl session (per host)
- Maximum 1 active crawl session per user (enforced by `crawl_sessions` status check)
- Maximum 5 total active crawl sessions across all users (prevent bridge server from being overwhelmed). Additional crawls are queued.
- Minimum 500ms delay between requests (or robots.txt `Crawl-delay` if higher)
- Per-request timeout: 10 seconds
- Maximum response body size: 5MB per page

---

## 14. Dependencies

### Upstream (What This Service Needs)

- **Auth & Bridge Server:** JWT validation via `verifyAuth()` middleware for all authenticated endpoints. The bridge server provides the HTTP framework, CORS handling, rate limiting, and request parsing.
- **Supabase (PostgreSQL + Auth):** Database storage for all 8 tables. RLS policies for multi-tenant isolation. Auth token verification. Service_role key for scheduler writes that bypass RLS.
- **KeyManager (`bridge/key-manager.js`):** AES-256-GCM encryption/decryption of OAuth tokens and API keys. This module must not be modified -- it is on the PROTECT LIST.
- **Google Cloud Platform:** OAuth consent screen (requires verification for production -- 2-6 week approval). Search Console API and Analytics Data API enablement.
- **Semrush API:** Business plan ($449/month) for API access. Provides domain analytics, keyword gap, SERP features, and topic research endpoints.
- **Ahrefs API:** Enterprise plan for API access. Provides backlink profile, top pages, and keyword explorer endpoints.
- **Hetzner + Coolify:** Long-running Node.js process required for the scheduler (setInterval-based). Coolify provides auto-restart on crash. Cannot run on serverless platforms.

### Downstream (Who Depends on This Service)

- **Content Intelligence (Layer 2):** Reads `content_inventory` (for URL list and metadata), `performance_snapshots` (for decay detection, trend analysis), and `keyword_opportunities` (for gap analysis). Intelligence CANNOT function without ingestion data.
- **Voice Intelligence (Layer 3):** Reads `content_inventory` URLs to build the article corpus for stylometric analysis. Needs the full text of articles discovered by the crawler.
- **Feedback Loop (Layer 6):** Reads `performance_snapshots` for the 30/60/90-day actual performance data used to compare against predictions. Uses the scheduler for periodic re-checking.
- **Dashboard:** Displays connection status dots (green/yellow/red), content inventory table, health score charts, sync history, and data freshness indicators. All visual status indicators depend on Data Ingestion being current.
- **Publishing (Layer 5):** Indirectly depends -- published articles need performance tracking which is provided by this service's scheduled pulls.

---

## 15. Testing Requirements

All tests use `node:test` runner. Located in `tests/ingestion/`.

### OAuth & Token Management Tests (`tests/ingestion/oauth.test.js`)

| Test Name | What It Verifies |
|-----------|------------------|
| `test_generateAuthUrl_contains_required_params` | Auth URL includes client_id, redirect_uri, scope, code_challenge, state, access_type=offline |
| `test_generateCodeChallenge_matches_known_vector` | SHA-256 of known verifier produces expected base64url challenge |
| `test_state_parameter_is_cryptographically_random` | Two consecutive calls produce different 64-char hex strings |
| `test_handleCallback_rejects_invalid_state` | Invalid state returns 403 and does not exchange tokens |
| `test_handleCallback_rejects_expired_state` | State older than 10 minutes is rejected |
| `test_token_encryption_roundtrip` | `encrypt(token)` then `decrypt(encrypted)` returns original token |
| `test_encrypted_token_format` | Output matches `hex:hex:hex` pattern (iv:authTag:ciphertext) |
| `test_refreshToken_updates_expiry` | After refresh, `token_expires_at` is in the future |
| `test_getValidAccessToken_triggers_refresh_near_expiry` | Token expiring in < 24 hours triggers automatic refresh |
| `test_revokeConnection_deletes_all_token_data` | After revocation, no token data exists in the database |
| `test_connections_endpoint_never_leaks_tokens` | `GET /api/connections` response does not contain token fields |
| `test_delete_connection_returns_404_for_other_users` | User A cannot delete User B's connection (returns 404, not 403) |

### GSC Connector Tests (`tests/ingestion/gsc.test.js`)

| Test Name | What It Verifies |
|-----------|------------------|
| `test_gsc_pagination_25k_rows` | Mock API returning 25K rows triggers second request with `startRow=25000` |
| `test_gsc_date_range_defaults_to_90_days_minus_3` | No dates specified results in 87-day range ending 3 days ago |
| `test_gsc_401_triggers_token_refresh` | 401 response causes refresh attempt before marking connection expired |
| `test_gsc_429_exponential_backoff` | Rate limited responses trigger delays of 1s, 2s, 4s, 8s |
| `test_gsc_data_normalization` | Raw GSC response is correctly mapped to ContentPerformanceRecord.gsc fields |

### GA4 Connector Tests (`tests/ingestion/ga4.test.js`)

| Test Name | What It Verifies |
|-----------|------------------|
| `test_ga4_quota_tracking_pauses_at_80_percent` | After consuming 8000 tokens, client pauses and returns partial data |
| `test_ga4_scroll_depth_extraction` | `percent_scrolled` event data is correctly averaged per page |
| `test_ga4_sampled_data_flagged` | Response with sampling metadata stores `{ sampled: true }` |
| `test_ga4_property_id_validation` | Invalid property ID format is rejected before API call |

### Semrush Connector Tests (`tests/ingestion/semrush.test.js`)

| Test Name | What It Verifies |
|-----------|------------------|
| `test_semrush_cache_hit_skips_api_call` | Cached response within TTL returns without making HTTP request |
| `test_semrush_cache_miss_fetches_and_stores` | Cache miss triggers API call and stores response with 7-day TTL |
| `test_semrush_rate_limit_pauses_60_seconds` | 429 response triggers 60-second pause before retry |
| `test_semrush_shared_key_failure_alerts_admin` | 401 response logs critical error and pauses all Semrush syncs |

### Ahrefs Connector Tests (`tests/ingestion/ahrefs.test.js`)

| Test Name | What It Verifies |
|-----------|------------------|
| `test_ahrefs_ratelimit_header_honored` | Connector pauses when `X-RateLimit-Remaining` drops below 10% |
| `test_ahrefs_partial_data_on_row_limit` | Row limit exceeded stores partial data with truncation flag |

### Crawler Tests (`tests/ingestion/crawler.test.js`)

| Test Name | What It Verifies |
|-----------|------------------|
| `test_sitemap_xml_parsing` | Well-formed sitemap returns correct URL list |
| `test_sitemap_index_following` | Sitemap index with 3 children fetches all child sitemaps |
| `test_robots_txt_disallow_respected` | Disallowed path is never fetched |
| `test_crawl_delay_honored` | Custom delay > 500ms overrides default |
| `test_concurrency_cap_at_3` | No more than 3 requests active simultaneously |
| `test_max_pages_cap_enforced` | Crawl stops after `maxPages` even if more URLs discovered |
| `test_redirect_following_max_5` | 301 chain > 5 hops is aborted |
| `test_non_html_skipped` | PDF and image responses are not stored |
| `test_js_rendered_site_detection` | Empty body with JS bundle references logs appropriate warning |
| `test_soft_404_detection` | Pages with "Page Not Found" title marked with soft404 flag |
| `test_crawl_url_ssrf_prevention` | Private IPs, localhost, and non-standard ports are rejected |
| `test_content_hash_change_detection` | Same URL crawled twice with different content updates metadata |
| `test_upsert_preserves_first_discovered_at` | Re-crawl does not overwrite `first_discovered_at` |

### Scheduler Tests (`tests/ingestion/scheduler.test.js`)

| Test Name | What It Verifies |
|-----------|------------------|
| `test_scheduler_creates_jobs_at_scheduled_time` | GSC job created at 03:00 UTC |
| `test_retry_exponential_backoff` | Failed job retries at 1min, 5min, 25min |
| `test_max_3_attempts_then_failed` | After 3 failures, job marked as `failed` |
| `test_restart_recovery_runs_missed_jobs` | After simulated restart, stale jobs are immediately executed |
| `test_purge_job_rolls_up_and_deletes` | Daily data >90 days is aggregated into monthly table then deleted |
| `test_sequential_client_processing` | Clients are processed one at a time, not in parallel |

### Health Score Tests (`tests/ingestion/health-score.test.js`)

| Test Name | What It Verifies |
|-----------|------------------|
| `test_health_score_healthy_article` | Article with strong metrics scores >= 70 |
| `test_health_score_decaying_article` | Article with 25% click decline over 3 months scores 40-69 |
| `test_health_score_dead_article` | Article with zero clicks for 60 days scores < 20 |
| `test_health_score_missing_data_uses_neutral` | Missing GA4 or Ahrefs data uses neutral defaults (50 or 25), does not crash |
| `test_status_classification_boundaries` | Score of 70 = HEALTHY, 69 = DECAYING, 39 = DECLINING, 19 = DEAD |
| `test_decay_signal_triggered_on_10_point_drop` | Health score dropping 10+ points in one day sets `decay_signal = true` |

---

## Files

| File | Purpose |
|------|---------|
| `bridge/oauth.js` | Google OAuth2 flow (auth URL generation, PKCE, callback, token exchange, refresh, revocation) |
| `bridge/ingestion/gsc.js` | GSC Search Analytics API connector |
| `bridge/ingestion/ga4.js` | GA4 Data API connector |
| `bridge/ingestion/semrush.js` | Semrush API connector with cache-aside pattern |
| `bridge/ingestion/ahrefs.js` | Ahrefs API v3 connector |
| `bridge/ingestion/trends.js` | Google Trends connector |
| `bridge/ingestion/crawler.js` | HTTP content crawler with sitemap-first discovery |
| `bridge/ingestion/scheduler.js` | Automated data pull scheduler with setInterval + Supabase state |
| `bridge/ingestion/health-score.js` | Health score calculation and status classification |
| `bridge/routes/connections.js` | OAuth and connection management endpoints |
| `bridge/routes/inventory.js` | Content inventory CRUD and crawl endpoints |
| `bridge/routes/ingestion.js` | Ingestion management and admin endpoints |
| `migrations/007-client-connections.sql` | client_connections + oauth_states tables + RLS |
| `migrations/008-content-inventory.sql` | content_inventory + crawl_sessions tables + RLS |
| `migrations/009-performance-snapshots.sql` | performance_snapshots + monthly rollup + partitioning + RLS |
| `migrations/010-ingestion-jobs.sql` | ingestion_jobs + api_cache tables |

---

## Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily GSC sync success rate | >= 99% | `completed / (completed + failed)` from ingestion_jobs |
| Token refresh success rate | >= 95% | Successful refreshes / total refresh attempts |
| Content inventory completeness | >= 90% of actual blog posts discovered | Manual audit against sitemap |
| Data freshness (GSC/GA4) | <= 48 hours old | `now() - max(last_sync_at)` per active client |
| Crawl completion rate | >= 95% of crawls complete successfully | `completed / total` from crawl_sessions |
| API cost per client (Semrush+Ahrefs) | <= $400/month | Sum of api_calls * estimated_cost from ingestion_jobs metadata |
| Crawler politeness | <= 3 concurrent requests, >= 500ms delay | Verified in crawler.test.js |
| Health score calculation time | < 100ms per URL | Measured in health-score.test.js |
| Dashboard query response time | < 200ms for overview, < 50ms for single URL | Measured against production data volumes |
