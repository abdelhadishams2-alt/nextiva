# ChainIQ Data Lifecycle Management

> **Created:** 2026-03-28
> **Scope:** All data stored in Supabase PostgreSQL and Hetzner filesystem
> **Compliance context:** GDPR (EU clients), UAE PDPL (MENA clients), general data minimization
> **Review cadence:** Quarterly

---

## Data Classification

Every piece of data ChainIQ stores falls into one of four retention classes. The class determines how long data lives, how it ages, and what happens when it expires.

| Class | Description | Examples | Default Retention |
|-------|-------------|----------|-------------------|
| **Ephemeral** | Operational data consumed within minutes | SSE progress streams, active edit mutex state, auth cache entries | In-memory only, no persistence |
| **Transactional** | Records of completed operations | `usage_logs`, `pipeline_jobs` (completed), webhook delivery logs | 12 months |
| **Analytical** | Performance metrics and trend data | `performance_snapshots`, search ranking data, traffic metrics | 90 days raw, then monthly rollup |
| **Permanent** | Core business records | `articles` (latest version), `subscriptions`, `users`, `api_keys` | Until explicit deletion or account closure |

---

## Table-by-Table Lifecycle Rules

### `performance_snapshots` -- 90-Day Purge + Monthly Rollup

This table stores daily SEO performance data per article per tenant: impressions, clicks, CTR, average position, traffic, and ranking changes. At 100 tenants with 50 tracked articles each, this generates ~5,000 rows/day (150,000 rows/month). Without lifecycle management, the table reaches 1.8M rows in 12 months, degrading query performance for the feedback loop analytics.

**Lifecycle policy:**

1. **Days 0-90 (Hot):** Full daily granularity. All columns available for drill-down, trend visualization, and decay detection algorithms. Indexed on `(article_id, snapshot_date)` and `(tenant_id, snapshot_date)`.

2. **Day 91 (Rollup trigger):** A scheduled PostgreSQL function `rollup_performance_snapshots()` runs daily at 03:00 UTC. For each article with snapshots older than 90 days, it calculates monthly aggregates:
   - `avg_impressions`, `avg_clicks`, `avg_ctr`, `avg_position`
   - `total_impressions`, `total_clicks`
   - `min_position`, `max_position` (best/worst ranking)
   - `trend_direction` (improving/stable/declining based on linear regression slope)

3. **Monthly rollup storage:** Aggregates are inserted into `performance_monthly_rollups` with columns `(article_id, tenant_id, month_year, avg_impressions, avg_clicks, avg_ctr, avg_position, total_impressions, total_clicks, min_position, max_position, trend_direction, data_points_count)`. One row per article per month.

4. **Post-rollup purge:** After successful rollup insertion (verified by row count comparison), daily snapshots older than 90 days are deleted in batches of 10,000 rows to avoid long-running transactions that block other queries.

5. **Rollup retention:** Monthly rollups are retained permanently (they represent the historical record of article performance). At 1 row per article per month, even 500 tenants x 100 articles x 24 months = 1.2M rows -- tiny.

**Implementation:**

```sql
-- Scheduled via pg_cron (Supabase supports this on Pro plan)
SELECT cron.schedule('rollup-snapshots', '0 3 * * *', $$
  SELECT rollup_and_purge_snapshots(90, 10000);
$$);
```

**Storage impact:** Reduces `performance_snapshots` from ~1.8M rows/year to a rolling 450K rows (90 days). Monthly rollups add ~60K rows/year at 100 tenants. Net storage reduction: ~85%.

---

### `usage_logs` -- 12-Month Retention

The `usage_logs` table records every API action: article generation, edits, login events, admin operations, quota checks, webhook deliveries. This is the audit trail for billing disputes, usage analytics, and security forensics.

**Lifecycle policy:**

1. **Months 0-12 (Active):** Full row-level detail. Queryable for per-tenant usage dashboards, billing reconciliation, and security audit. Indexed on `(user_id, action, created_at)`.

2. **Month 13 (Purge):** A weekly cron job deletes `usage_logs` rows where `created_at < NOW() - INTERVAL '12 months'`. Runs on Sundays at 04:00 UTC in batches of 50,000 rows.

3. **Pre-purge aggregation:** Before deletion, a monthly aggregation job (runs on the 1st of each month) computes per-tenant monthly summaries and stores them in `usage_monthly_summaries`: `(tenant_id, month_year, articles_generated, edits_performed, api_calls, logins, storage_bytes_used)`. These summaries support historical usage trends on the admin dashboard without retaining granular log data.

4. **Exception -- Security events:** Rows with `action IN ('auth_failure', 'rate_limit_hit', 'admin_action', 'user_deletion')` are copied to `security_audit_log` before deletion. `security_audit_log` has a 7-year retention policy (compliance requirement for MENA financial publishers regulated under DFSA/ADGM).

**Volume estimate:** 10 tenants producing ~500 log entries/day = 5,000/day = 150K/month. At 100 tenants: 1.5M/month. 12-month rolling window caps at 18M rows. With the composite index, query latency remains <100ms for per-tenant filtered queries.

---

### OAuth Token Cleanup

ChainIQ stores OAuth tokens for GSC and GA4 integrations in the `oauth_tokens` table: `(tenant_id, provider, access_token, refresh_token, expires_at, scopes, created_at, last_used_at)`. Tokens are AES-256-GCM encrypted at rest using the KeyManager.

**Lifecycle rules:**

1. **Active tokens:** Tokens with `last_used_at` within the past 30 days are considered active. The data ingestion scheduler refreshes access tokens automatically before expiry using the stored refresh token.

2. **Stale tokens (30-90 days unused):** If a tenant has not used a connected integration in 30 days, the token remains stored but is flagged as `status = 'stale'`. The dashboard shows a warning: "Your GSC connection has been inactive for 30 days. Reconnect to resume data ingestion."

3. **Expired tokens (90+ days unused):** After 90 days of inactivity, the access token is deleted and the refresh token is revoked via the provider's revocation endpoint (Google: `https://oauth2.googleapis.com/revoke`). The `oauth_tokens` row transitions to `status = 'revoked'`. The tenant must re-authenticate to reconnect.

4. **Account deletion cascade:** When a tenant account is deleted (GDPR right to erasure), all OAuth tokens are immediately revoked at the provider and deleted from the database as part of the `delete_user_cascade()` function (see TD-003 in tech debt registry).

5. **Token rotation on refresh:** When an access token is refreshed, the old access token is overwritten (not appended). Only one active access token per provider per tenant exists at any time. The refresh token is updated only if the provider issues a new one (Google rotates refresh tokens periodically).

**Cleanup schedule:** Daily at 05:00 UTC, a cron job runs `cleanup_stale_oauth_tokens()` which: (1) flags tokens unused for 30+ days as stale, (2) revokes and deletes tokens unused for 90+ days, (3) logs all revocations to the security audit log.

---

### Article Version Retention

The `articles` table stores generated articles with full HTML content. The `article_versions` table tracks edit history: each `/apply-edit` operation creates a new version with the previous content stored as a snapshot.

**Lifecycle policy:**

1. **Current version:** Always retained. This is the live article content.

2. **Edit history (versions):** Retain the last 20 versions per article. When a 21st edit is applied, the oldest version is deleted. Rationale: 20 versions provides sufficient rollback depth for editorial review workflows. No MENA publisher client has requested more than 5 rollbacks in user research.

3. **Version age limit:** Regardless of count, versions older than 180 days are eligible for deletion. A monthly cleanup job prunes versions where `created_at < NOW() - INTERVAL '180 days'` AND `version_number` is not in the top 5 most recent for that article. This preserves the 5 most recent versions indefinitely as a safety net.

4. **Deleted articles:** When a tenant deletes an article, all versions are immediately hard-deleted (not soft-deleted). The `articles` row is soft-deleted with `deleted_at` timestamp and retained for 30 days (recovery window). After 30 days, the hard-delete cron job removes the article and all associated `performance_snapshots` and `performance_monthly_rollups` rows.

5. **Storage budget per tenant:** At an average of 150KB per article version, 20 versions x 50 articles = ~150MB per tenant. At 100 tenants: 15GB. Well within Supabase Pro's storage capacity, but monitor monthly.

---

## Filesystem Data (Hetzner)

The bridge server on Hetzner stores minimal filesystem data:

| Path | Content | Retention |
|------|---------|-----------|
| `/var/log/chainiq/` | Structured JSON logs (stdout capture by Coolify) | 30 days (Coolify default) |
| `/tmp/chainiq-generation/` | Temporary files during article generation | Deleted after pipeline completion |
| Environment variables | Supabase keys, API credentials | Permanent (rotated quarterly) |

No article content, user data, or OAuth tokens are stored on the Hetzner filesystem. All persistent state lives in Supabase. This is intentional -- the bridge server is stateless and can be replaced from a fresh Coolify deployment without data loss.

---

## Automation Schedule Summary

| Job | Schedule | Table Affected | Action |
|-----|----------|---------------|--------|
| `rollup_and_purge_snapshots` | Daily 03:00 UTC | `performance_snapshots` | Rollup >90d, delete originals |
| `purge_old_usage_logs` | Weekly Sun 04:00 UTC | `usage_logs` | Delete >12 months |
| `aggregate_monthly_usage` | 1st of month, 02:00 UTC | `usage_logs` -> `usage_monthly_summaries` | Aggregate before purge |
| `cleanup_stale_oauth_tokens` | Daily 05:00 UTC | `oauth_tokens` | Flag stale, revoke expired |
| `prune_article_versions` | Monthly 1st, 06:00 UTC | `article_versions` | Delete >20 versions or >180d |
| `hard_delete_articles` | Daily 07:00 UTC | `articles` | Remove soft-deleted >30d |

All jobs are implemented as PostgreSQL functions scheduled via `pg_cron` (available on Supabase Pro). Jobs log execution results to `cron_job_log` for monitoring. Failed jobs trigger a webhook notification to the admin dashboard.

---

## Monitoring & Alerts

| Metric | Threshold | Action |
|--------|-----------|--------|
| `performance_snapshots` row count | > 500,000 | Verify rollup job is running |
| `usage_logs` row count | > 2,000,000 | Verify purge job is running |
| Database size | > 6GB (75% of 8GB plan) | Evaluate Supabase plan upgrade |
| `article_versions` per article | > 15 | Warn tenant about edit frequency |
| Cron job failure count | > 0 in 24 hours | Alert admin via webhook |
