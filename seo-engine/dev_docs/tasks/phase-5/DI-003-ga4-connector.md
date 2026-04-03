# DI-003: Google Analytics 4 Connector

> **Phase:** 5 | **Priority:** P0 | **Status:** NOT STARTED
> **Effort:** L (12h) | **Type:** feature
> **Sprint:** 2 (Weeks 3-4)
> **Depends On:** DI-001 (OAuth infrastructure), DI-002 (GSC connector for merge pattern)
> **Assigned:** Unassigned

## Context Header

Before starting, read:

1. `CLAUDE.md` (auto-loaded)
2. `dev_docs/specs/database/unified-schema.md` — Section 3.5 (performance_snapshots columns: sessions, engaged_sessions, bounce_rate, avg_engagement_time, scroll_depth)
3. `bridge/oauth.js` — `getValidToken(connectionId)` from DI-001
4. `bridge/ingestion/gsc.js` — GSC connector pattern reference (error handling, normalization)
5. `dev_docs/tribunal/10-deliverables/phase-a-backlog.md` — Story #12 (GA4 client)
6. `dev_docs/tribunal/08-roadmap/phase-a-sprint-plan.md` — Sprint 2 GA4 details

## Objective

Build the GA4 Reporting API connector that pulls engagement metrics (sessions, engagement rate, bounce rate, average engagement time, scroll depth) per page path per day. Merge GA4 data with GSC snapshots into combined performance records. Implement historical import and daily incremental pulls. Handle GA4 property-level quotas and token sharing with GSC (same Google OAuth tokens).

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `bridge/ingestion/ga4.js` | GA4 Data API v1beta client: runReport, pagination, normalization, GSC merge |
| MODIFY | `bridge/server.js` | Register endpoints: `POST /api/ingestion/trigger/ga4`, `GET /api/ingestion/ga4/status` |

## Sub-tasks

### Sub-task 1: GA4 Data API client core (~3h)

- Create `bridge/ingestion/ga4.js` exporting a `GA4Connector` class
- Constructor accepts `{ supabaseClient, oauthModule }`
- **`runReport(accessToken, propertyId, options)`** — Core API wrapper:
  - Endpoint: `POST https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`
  - Headers: `Authorization: Bearer ${accessToken}`, `Content-Type: application/json`
  - Request body:
    ```json
    {
      "dateRanges": [{ "startDate": "90daysAgo", "endDate": "today" }],
      "dimensions": [
        { "name": "pagePath" },
        { "name": "date" }
      ],
      "metrics": [
        { "name": "sessions" },
        { "name": "engagedSessions" },
        { "name": "bounceRate" },
        { "name": "averageSessionDuration" },
        { "name": "scrolledUsers" },
        { "name": "totalUsers" }
      ],
      "limit": 10000,
      "offset": 0
    }
    ```
  - Parse dimension/metric headers and row values from GA4 response format
  - **Pagination:** GA4 uses `limit`/`offset`. If `rowCount > offset + limit`, fetch next page.
  - Use native `fetch()` -- zero dependencies

### Sub-task 2: Engagement metrics extraction (~2h)

- **Metrics mapping from GA4 response to performance_snapshots columns:**
  - `sessions`: direct from GA4 `sessions` metric
  - `engaged_sessions`: from `engagedSessions` metric
  - `bounce_rate`: from `bounceRate` (already 0-1 decimal in GA4)
  - `avg_engagement_time`: from `averageSessionDuration` (seconds)
  - `scroll_depth`: calculated as `scrolledUsers / totalUsers * 100` (percentage)
  - `organic_traffic`: if source/medium dimension available, filter to `google / organic`
- **Property ID resolution:** User provides GA4 property ID during connection setup (stored in `client_connections.ga4_property_id`). Validate by calling `GET /v1beta/properties/${id}` (returns property name on success, 403 on invalid).

### Sub-task 3: GSC data merge into combined snapshots (~3h)

- **Merge strategy:** After GA4 pull, update existing `performance_snapshots` records (source='gsc') for matching URLs and dates with GA4 engagement data
- **URL matching:** GA4 returns `pagePath` (e.g., `/blog/article`), GSC returns full URL (e.g., `https://example.com/blog/article`). Strip protocol+domain from GSC URLs for matching.
- **Combined snapshot creation:**
  - If GSC snapshot exists for URL+date: UPDATE with GA4 fields (sessions, bounce_rate, etc.)
  - If no GSC snapshot: INSERT new snapshot with `source: 'ga4'` and engagement fields only
  - Create `source: 'combined'` snapshots that merge both sources for dashboard queries
- **Batch processing:** Process in 500-row batches using Supabase upsert

### Sub-task 4: Historical import and daily pulls (~2h)

- **Historical import on first connection:**
  - GA4 Data API has limited historical range (depends on property creation date)
  - Pull all available data in monthly chunks
  - Track in `ingestion_jobs` table with progress metadata
- **Daily incremental:** Pull last 3 days (same lag-catch strategy as GSC)
- **Quota management:** GA4 has property-level quotas (varies, typically 10,000 requests/day)
  - Track quota usage in `ingestion_jobs.metadata.quota_used`
  - If approaching quota (>80% consumed): warn in logs, reduce query scope
  - Implement retry with exponential backoff on 429 responses

### Sub-task 5: Error handling and endpoints (~2h)

- Same error pattern as DI-002: 401->refresh, 429->backoff, 403->error state
- **GA4-specific errors:**
  - `PERMISSION_DENIED`: user hasn't granted analytics.readonly scope or property doesn't exist
  - `RESOURCE_EXHAUSTED`: quota exceeded, pause and use cached data
  - `INVALID_ARGUMENT`: bad property ID or malformed request
- **Endpoints:**
  - `POST /api/ingestion/trigger/ga4` — Manual trigger, returns job ID
  - `GET /api/ingestion/ga4/status` — Returns last sync, total rows, status
- Both authenticated and rate limited

## Acceptance Criteria

- [ ] GA4 connector wraps Data API v1beta runReport with correct dimensions and metrics
- [ ] Sessions, engagement rate, bounce rate, avg engagement time, scroll depth extracted
- [ ] GA4 data merged with GSC snapshots by URL+date matching (pagePath to full URL normalization)
- [ ] Combined snapshots created with data from both sources
- [ ] Historical import pulls all available GA4 data on first connection
- [ ] Daily incremental pull fetches last 3 days
- [ ] Property-level quota tracked and managed (warning at 80% usage)
- [ ] Shared OAuth tokens with GSC (same Google account, same connection)
- [ ] 401 triggers token refresh, 429 triggers backoff, 403 sets error state
- [ ] `POST /api/ingestion/trigger/ga4` creates job and runs async
- [ ] Zero npm dependencies

## Test Requirements

### Unit Tests

- Report request body contains correct dimensions and metrics
- GA4 response parsing extracts all engagement metrics correctly
- URL matching: `/blog/article` matches `https://example.com/blog/article`
- Scroll depth calculated correctly: 50 scrolled / 100 total = 50%
- Merge logic: existing GSC snapshot updated with GA4 fields
- Merge logic: new GA4-only snapshot created when no GSC match

### Integration Tests

- Full pull with mocked GA4 API: query -> normalize -> merge with GSC -> store
- Combined snapshots have both GSC (clicks, impressions) and GA4 (sessions, bounce_rate) fields
- Quota tracking logged correctly in ingestion_jobs metadata
- Status endpoint returns accurate data after pull

## Dependencies

- Blocked by: DI-001 (OAuth tokens), DI-002 (GSC data for merging)
- Blocks: CI-001 (decay detection uses engagement data), DI-005 (scheduler triggers GA4 pulls)
