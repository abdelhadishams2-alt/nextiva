# DI-005: Automated Data Pull Scheduler

> **Phase:** 5 | **Priority:** P0 | **Status:** NOT STARTED
> **Effort:** L (12h) | **Type:** feature
> **Sprint:** 3 (Weeks 5-6)
> **Depends On:** DI-002 (GSC connector), DI-003 (GA4 connector), DI-004 (content crawler)
> **Assigned:** Unassigned

## Context Header

Before starting, read:

1. `CLAUDE.md` (auto-loaded)
2. `dev_docs/specs/database/unified-schema.md` — Section 3.5-3.6 (performance_snapshots partitioning + monthly rollup table)
3. `bridge/ingestion/gsc.js` — GSC connector from DI-002
4. `bridge/ingestion/ga4.js` — GA4 connector from DI-003
5. `bridge/ingestion/crawler.js` — Content crawler from DI-004
6. `dev_docs/tribunal/08-roadmap/phase-a-sprint-plan.md` — Sprint 3 scheduler details, Risk #8 (silent failure)
7. `dev_docs/tribunal/10-deliverables/phase-a-backlog.md` — Story #14 (scheduler) + Story #15 (purge)

## Objective

Build the automated scheduler that triggers daily GSC/GA4 pulls and weekly Semrush/Ahrefs syncs on a tick-based `setInterval` architecture (no cron library -- zero deps). Implement job tracking in Supabase via the `ingestion_jobs` table, retry logic (3 attempts with exponential backoff), missed-job recovery on process restart, and a data purge policy (90-day daily granularity retained, then monthly rollup). Create migration 009 for performance_snapshots with monthly partitioning.

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `bridge/ingestion/scheduler.js` | Tick-based scheduler: daily GSC/GA4, weekly Semrush/Ahrefs, missed-job recovery, purge job |
| CREATE | `migrations/009-performance-snapshots.sql` | performance_snapshots (partitioned by month), performance_snapshots_monthly rollup table |
| MODIFY | `bridge/server.js` | Initialize scheduler on server start, add `/api/ingestion/schedule` status endpoint |

## Sub-tasks

### Sub-task 1: Create migration 009 — performance_snapshots with partitioning (~2h)

- Create `migrations/009-performance-snapshots.sql` with **exact DDL from unified-schema.md Sections 3.5-3.6**:
- **performance_snapshots** (highest volume table, partitioned):
  - Full column set: `id`, `user_id`, `content_id`, `url`, `snapshot_date`, `source`, `clicks`, `impressions`, `ctr`, `avg_position`, `sessions`, `engaged_sessions`, `bounce_rate`, `avg_engagement_time`, `scroll_depth`, `organic_traffic`, `keyword_count`, `backlinks`, `referring_domains`, `domain_rating`, `health_score`, `decay_signal`, `metadata`, `created_at`
  - `PARTITION BY RANGE (snapshot_date)`
  - Create initial 6 monthly partitions (2026-01 through 2026-06)
  - Unique constraint: `(user_id, url, snapshot_date, source)`
  - Indexes: `idx_perf_user_date`, `idx_perf_content_date`, `idx_perf_user_url_source`, `idx_perf_health_score` (partial)
  - RLS: users SELECT own snapshots; writes via service_role only (scheduler)
- **performance_snapshots_monthly** (rollup table):
  - `id`, `user_id`, `content_id`, `url`, `month DATE`, `avg_clicks`, `avg_impressions`, `avg_ctr`, `avg_position`, `total_sessions`, `avg_health_score`
  - Unique: `(user_id, url, month)`
  - RLS: users SELECT own monthly data
- Include auto-partition creation function for future months

### Sub-task 2: Tick-based scheduler engine (~3h)

- Create `bridge/ingestion/scheduler.js` exporting a `Scheduler` class
- **Architecture:** `setInterval` with 60-second tick (no cron library, no npm deps)
- On each tick, check the current UTC time and determine which jobs should run:
  - **Daily GSC pull:** 03:00 UTC (captures previous day's finalized data)
  - **Daily GA4 pull:** 03:30 UTC (offset from GSC to avoid concurrent load)
  - **Weekly Semrush:** Monday 04:00 UTC (placeholder for CI-004)
  - **Weekly Ahrefs:** Tuesday 04:00 UTC (placeholder for CI-004)
  - **Monthly purge:** 1st of month, 02:00 UTC
  - **Partition creation:** 1st of month, 01:00 UTC (create next month's partition)
- **Per-client scheduling:** For each active client_connection, create individual pull jobs
- **Job creation:** Insert `ingestion_jobs` record with `status: 'queued'`, `trigger_type: 'scheduled'`
- **Concurrency control:** Maximum 3 concurrent ingestion jobs across all clients to avoid DB connection exhaustion
- **Missed-job recovery on process restart:**
  - On scheduler start, query `client_connections` for all connected users
  - For each user+source, check `last_sync_at` timestamp
  - If `last_sync_at > 24 hours ago` for daily sources: immediately queue a catch-up pull
  - If `last_sync_at > 7 days ago` for weekly sources: queue catch-up
  - Log: `scheduler.missed_job_recovery: { user_id, source, hours_stale }`

### Sub-task 3: Retry logic with exponential backoff (~2h)

- **3-attempt retry strategy:**
  - Attempt 1: immediate execution
  - Attempt 2: retry after 5 minutes (300,000ms)
  - Attempt 3: retry after 30 minutes (1,800,000ms)
  - Track attempts in `ingestion_jobs.attempt` column (1, 2, or 3)
- **On failure:** Update job: `status: 'failed'`, `error: <message>`, `completed_at: now()`
- **On retry:** Create new job with `trigger_type: 'retry'`, `attempt: prev + 1`
- **After 3 failures:** Mark connection as `stale` in `client_connections`, set `last_error`, do NOT retry again until next scheduled window
- **Staleness detection:** If any source for a user hasn't synced in 48 hours, update connection status to `error` and surface alert in dashboard via `/api/connections/status`

### Sub-task 4: Data purge and monthly rollup (~3h)

- **Monthly rollup job** (runs on 1st of month):
  - Query `performance_snapshots` for data older than 90 days
  - For each (user_id, url, month): compute averages
    ```sql
    INSERT INTO performance_snapshots_monthly (user_id, content_id, url, month, avg_clicks, avg_impressions, avg_ctr, avg_position, total_sessions, avg_health_score)
    SELECT user_id, content_id, url,
           date_trunc('month', snapshot_date)::date,
           AVG(clicks), AVG(impressions), AVG(ctr), AVG(avg_position),
           SUM(sessions), AVG(health_score)
    FROM performance_snapshots
    WHERE snapshot_date < now() - interval '90 days'
    GROUP BY user_id, content_id, url, date_trunc('month', snapshot_date)
    ON CONFLICT (user_id, url, month) DO UPDATE SET ...
    ```
  - After rollup verified (row counts match): delete daily rows older than 90 days
  - **Safety:** Always rollup BEFORE delete. Verify rollup row count > 0 before deleting source rows.
  - Log: `scheduler.purge: { rows_rolled_up, rows_deleted, storage_freed_estimate }`
- **Partition management:** On 1st of month, create partition for 2 months ahead:
  ```sql
  CREATE TABLE IF NOT EXISTS performance_snapshots_YYYY_MM
    PARTITION OF performance_snapshots
    FOR VALUES FROM ('YYYY-MM-01') TO ('YYYY-MM+1-01');
  ```
- **OAuth state cleanup:** Every 5 minutes, delete expired oauth_states: `DELETE FROM oauth_states WHERE created_at < now() - interval '10 minutes'`

### Sub-task 5: Health endpoint enhancement and API (~2h)

- **Enhance `/health` endpoint** to include scheduler status:
  ```json
  {
    "status": "ok",
    "uptime": 86400,
    "scheduler": {
      "running": true,
      "lastTick": "2026-03-28T03:01:00Z",
      "jobsInQueue": 2,
      "jobsRunning": 1,
      "nextScheduled": { "gsc": "2026-03-29T03:00Z", "ga4": "2026-03-29T03:30Z" }
    }
  }
  ```
- **`GET /api/ingestion/schedule`** — Authenticated. Returns schedule overview:
  - Per-source last successful pull, next scheduled pull, error count
  - Active jobs list with progress
  - Returns: `{ sources: { gsc: { lastSync, nextSync, status }, ga4: {...} }, activeJobs: [...] }`
- Initialize scheduler on bridge server startup: `scheduler.start()` in `bridge/server.js`
- Graceful shutdown: `scheduler.stop()` on SIGTERM/SIGINT to complete running jobs

## Acceptance Criteria

- [ ] Migration 009 creates performance_snapshots with monthly partitioning and 6 initial partitions
- [ ] Migration 009 creates performance_snapshots_monthly rollup table
- [ ] Scheduler ticks every 60 seconds, triggers jobs at correct UTC times
- [ ] Daily GSC pull at 03:00 UTC, GA4 at 03:30 UTC for all connected clients
- [ ] Weekly Semrush (Monday 04:00) and Ahrefs (Tuesday 04:00) placeholders registered
- [ ] Missed-job recovery on restart: stale sources (>24h) immediately re-queued
- [ ] Retry logic: 3 attempts with exponential backoff (0, 5min, 30min)
- [ ] Connection marked `stale` after 48h without successful sync
- [ ] Monthly rollup aggregates daily snapshots older than 90 days into monthly averages
- [ ] Purge deletes daily rows only AFTER rollup verified
- [ ] New partition auto-created monthly for 2 months ahead
- [ ] `/health` includes scheduler status (running, lastTick, queue depth)
- [ ] `/api/ingestion/schedule` returns per-source sync status
- [ ] Maximum 3 concurrent ingestion jobs enforced
- [ ] Zero npm dependencies -- setInterval-based, no cron library

## Test Requirements

### Unit Tests

- Tick check: 03:00 UTC triggers GSC job, 03:30 triggers GA4
- Missed-job recovery: connection with last_sync_at 36 hours ago triggers immediate pull
- Retry: failed job creates retry with attempt+1 and correct delay
- After 3 failures: connection marked stale, no further retries
- Purge: rollup SQL produces correct averages from daily data
- Purge: delete only runs after rollup row count verified > 0
- Partition naming: April 2026 creates `performance_snapshots_2026_04`

### Integration Tests

- Scheduler runs for 2 minutes, produces expected tick count and job creations
- Full cycle: scheduled job -> GSC pull -> store -> job marked completed
- Restart recovery: kill scheduler, restart, verify stale jobs re-queued
- Purge job with simulated 90+ day data: verify rollup accuracy and deletion
- Health endpoint reports scheduler status correctly
- Graceful shutdown: SIGTERM waits for running job to complete

## Dependencies

- Blocked by: DI-002 (GSC connector), DI-003 (GA4 connector), DI-004 (crawler)
- Blocks: CI-001 (needs historical snapshots), CI-002 (needs accumulated data), DI-006 (schedule status UI)
