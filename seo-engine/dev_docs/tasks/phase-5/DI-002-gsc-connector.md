# DI-002: Google Search Console Connector

> **Phase:** 5 | **Priority:** P0 | **Status:** NOT STARTED
> **Effort:** L (12h) | **Type:** feature
> **Sprint:** 2 (Weeks 3-4)
> **Depends On:** DI-001 (OAuth infrastructure, `getValidToken()`)
> **Assigned:** Unassigned

## Context Header

Before starting, read:

1. `CLAUDE.md` (auto-loaded)
2. `dev_docs/specs/database/unified-schema.md` — Section 3.5 (performance_snapshots DDL with partitioning)
3. `bridge/oauth.js` — `getValidToken(connectionId)` from DI-001
4. `bridge/supabase-client.js` — database operations pattern
5. `dev_docs/tribunal/10-deliverables/phase-a-backlog.md` — Story #11 (GSC client acceptance criteria)
6. `dev_docs/tribunal/08-roadmap/phase-a-sprint-plan.md` — Sprint 2 GSC details

## Objective

Build the GSC Search Analytics API connector that pulls clicks, impressions, CTR, and average position data per URL and query. Implement 90-day date range queries with 25,000-row pagination, a 16-month historical import on first connection, and daily incremental pulls. Normalize data into `performance_snapshots` table. Calculate health scores per URL. Handle all Google API error codes with appropriate recovery strategies (401 token refresh, 429 exponential backoff, 403 error state).

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `bridge/ingestion/gsc.js` | GSC Search Analytics API client with query, pagination, normalization, health score |
| MODIFY | `bridge/server.js` | Register endpoints: `POST /api/ingestion/trigger/gsc`, `GET /api/ingestion/gsc/status` |

## Sub-tasks

### Sub-task 1: GSC API client core (~3h)

- Create `bridge/ingestion/gsc.js` exporting a `GSCConnector` class
- Constructor accepts `{ supabaseClient, oauthModule }` for DB and token access
- **`querySearchAnalytics(accessToken, siteUrl, options)`** — Core API wrapper:
  - Endpoint: `POST https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`
  - Headers: `Authorization: Bearer ${accessToken}`, `Content-Type: application/json`
  - Request body:
    ```json
    {
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "dimensions": ["page", "query", "date"],
      "rowLimit": 25000,
      "startRow": 0,
      "type": "web"
    }
    ```
  - Parse response rows: `{ keys: [page, query, date], clicks, impressions, ctr, position }`
  - **25K row pagination:** GSC returns max 25,000 rows per request. If response has exactly 25,000 rows, increment `startRow` by 25,000 and fetch next page. Continue until fewer than 25,000 rows returned.
  - Use native `fetch()` -- zero npm dependencies

### Sub-task 2: Date range management and historical import (~2h)

- **90-day default window:** Primary data range for analysis and decay detection
- **Daily incremental pull:** Query last 3 days to catch late-arriving GSC data (GSC data finalizes with 2-3 day lag)
- **16-month historical import** on first connection (when no snapshots exist for this user+source):
  - GSC retains 16 months of data
  - Pull in monthly chunks to avoid timeout: iterate from 16 months ago to today, one month per API call
  - Track progress in `ingestion_jobs` table: `{ source: 'gsc', status: 'running', metadata: { monthsProcessed, totalMonths } }`
  - Rate limit: respect GSC's 1,200 requests/minute per project
- **Date overlap handling:** Use `UPSERT` via Supabase on unique constraint `(user_id, url, snapshot_date, source)` to prevent duplicates

### Sub-task 3: Data normalization and storage (~3h)

- **`normalizeAndStore(userId, rawRows)`** — Transform GSC response into performance_snapshots:
  - For each row, map to snapshot record:
    - `user_id`: from connection
    - `url`: from `keys[0]` (page dimension)
    - `snapshot_date`: from `keys[2]` (date dimension)
    - `source`: `'gsc'`
    - `clicks`, `impressions`, `ctr`, `avg_position`: directly from row
    - `metadata`: `{ topQueries: [top 50 queries per URL per day] }`
  - Batch upsert with 500-row batches for performance
  - Link to `content_inventory` by matching URL: set `content_id` FK where URL exists
- **Health score calculation** after snapshot insertion:
  - `health_score = (click_trend * 0.3) + (impression_trend * 0.25) + (position_score * 0.25) + (ctr_score * 0.2)`
  - `click_trend`: last 30d clicks vs previous 30d, normalize 0-100
  - `position_score`: pos 1-3=100, 4-10=75, 11-20=50, 21-50=25, 50+=0
  - `ctr_score`: normalize CTR relative to expected CTR for position
  - Update `health_score` and `decay_signal` (true if health_score < 40)

### Sub-task 4: Error handling (~2h)

- **401 Unauthorized:** Call `oauthModule.refreshToken(connectionId)`, retry once. If refresh fails: mark connection `expired`, skip cycle.
- **429 Too Many Requests:** Parse `Retry-After` header. Exponential backoff: 5s, 15s, 45s. After 3 retries: mark job `failed`.
- **403 Forbidden:** Set connection `status: 'error'`, `last_error: 'GSC property not verified'`. No auto-retry.
- **5xx Server Error:** Retry 3 times with backoff, then mark job `failed`.
- Structured logging: `gsc.pull_started`, `gsc.pull_completed`, `gsc.pull_failed`, `gsc.rows_stored`

### Sub-task 5: API endpoints (~2h)

- **`POST /api/ingestion/trigger/gsc`** — Authenticated. Creates `ingestion_jobs` record, runs pull async. Returns `{ jobId, status: 'queued' }`.
- **`GET /api/ingestion/gsc/status`** — Authenticated. Returns `{ lastSync, totalRows, status, lastError }`.
- Rate limiting on both endpoints

## Acceptance Criteria

- [ ] GSC connector wraps searchAnalytics.query with correct request format
- [ ] 25,000-row pagination fetches all available data across multiple pages
- [ ] 16-month historical import pulls in monthly chunks on first connection
- [ ] Daily incremental pull fetches last 3 days for late-arriving data
- [ ] Data normalized into performance_snapshots matching unified-schema.md Section 3.5
- [ ] Health score calculated per URL with 4-component weighted formula
- [ ] `decay_signal` set to true when health_score drops below 40
- [ ] Upsert prevents duplicate snapshots for same (user_id, url, date, source)
- [ ] 401 triggers automatic token refresh and single retry
- [ ] 429 triggers exponential backoff (5s, 15s, 45s)
- [ ] 403 sets connection to error state with actionable user message
- [ ] Ingestion jobs tracked in `ingestion_jobs` table with progress metadata
- [ ] Zero npm dependencies -- native `fetch` only

## Test Requirements

### Unit Tests

- Query builder produces correct request body with dimensions and date range
- Pagination: 25,000-row response triggers next page; <25K stops
- Historical import: 16-month range split into correct monthly chunks
- Normalization: GSC row correctly mapped to performance_snapshot fields
- Health score: position 5 + stable clicks = high (>70); position 35 + declining = low (<40)
- Error handlers: 401->refresh, 429->backoff, 403->error state

### Integration Tests

- Full pull with mocked GSC API: query -> paginate -> normalize -> store -> verify DB
- Manual trigger endpoint creates job and returns ID
- Status endpoint returns accurate sync info after pull
- Connection marked expired after failed refresh chain

## Dependencies

- Blocked by: DI-001 (OAuth `getValidToken` and client_connections table)
- Blocks: CI-001 (decay detection), CI-002 (gap analysis), DI-005 (scheduler)
