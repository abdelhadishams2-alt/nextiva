# ChainIQ Backup & Recovery Strategy

> **Created:** 2026-03-28
> **Architecture:** Hetzner CPX21 (stateless bridge) + Supabase Pro (all state)
> **RPO Target:** 24 hours (daily backups), upgradeable to <1 hour (PITR)
> **RTO Target:** 2 hours (full restore), 15 minutes (failover to standby)
> **Review cadence:** Quarterly, or after any data-loss incident

---

## Architecture Principle: Supabase Is the Single Source of Truth

ChainIQ's backup strategy is simplified by one critical architectural decision: **all persistent state lives in Supabase PostgreSQL**. The Hetzner bridge server is stateless -- it stores no user data, no articles, no tokens, no configuration on disk. This means backup and recovery is fundamentally a database problem, not a distributed systems problem.

What this eliminates:
- No filesystem backup required for user data (Hetzner snapshots are unnecessary for data recovery)
- No cross-system consistency issues (no "database says X, filesystem says Y" bugs)
- No need for backup coordination between multiple data stores
- Bridge server recovery = fresh deploy from Git + environment variables

What this requires:
- Supabase backup integrity is mission-critical -- there is no secondary copy
- Environment variables (Supabase keys, API credentials) must be backed up separately
- The Supabase project itself (schema, RLS policies, functions, cron jobs) must be version-controlled

---

## Layer 1: Supabase Automatic Backups

Supabase Pro includes automatic daily backups with 7-day retention. These are full PostgreSQL dumps managed by Supabase infrastructure.

**What is backed up:**
- All table data (users, subscriptions, articles, article_versions, pipeline_jobs, usage_logs, performance_snapshots, api_keys, oauth_tokens, plugin_instances, and all future tables)
- All indexes, constraints, and foreign key relationships
- All RLS policies
- All PostgreSQL functions and triggers
- All pg_cron job definitions
- Supabase Auth data (user accounts, sessions, factors)
- Supabase Storage buckets (if used for image storage)

**What is NOT backed up by Supabase:**
- Edge Functions (version-controlled in Git -- not applicable to ChainIQ)
- Supabase dashboard configuration (project settings, API key configuration)
- Realtime subscriptions configuration

**Backup schedule:** Daily at ~02:00 UTC (Supabase-managed, not configurable on Pro). Backups are stored in Supabase's infrastructure (AWS S3, encrypted at rest with AES-256).

**Retention:** 7 days on Pro plan. This means the oldest available backup is 7 days ago. For a scenario where data corruption is not detected for 8+ days, the backup is gone. This is the primary risk in the current setup.

**Restore process:**
1. Open Supabase Dashboard -> Settings -> Backups
2. Select the desired backup date
3. Click "Restore" -- this overwrites the current database with the backup
4. **WARNING:** Restore is destructive. All data written after the backup timestamp is lost
5. Estimated restore time: 5-15 minutes for databases under 10GB

**Limitations of daily backups:**
- RPO is 24 hours. If a destructive operation happens at 23:59 UTC, up to 24 hours of data is lost
- Cannot restore individual tables -- it is all-or-nothing
- Cannot restore to a specific point in time (only to the daily snapshot)
- Suitable for: catastrophic failures, corrupted migrations, Supabase-side outages
- Not suitable for: "undo that DELETE query from 2 hours ago"

---

## Layer 2: Point-in-Time Recovery (PITR)

Supabase offers PITR as an add-on ($100/month) on the Pro plan. PITR uses PostgreSQL's Write-Ahead Log (WAL) to enable recovery to any second within the retention window.

**Current status:** Not enabled. Planned for activation at the 100-tenant milestone (see infrastructure-cost-model.md Tier 3).

**When to enable PITR:**
- When any Enterprise-tier client ($12K/mo) is onboarded (their SLA will demand sub-hour RPO)
- When the database contains irreplaceable data that cannot be regenerated (performance_snapshots history, voice corpus analysis results)
- When monthly revenue exceeds $50K (the $100/mo PITR cost becomes negligible)

**PITR restore process:**
1. Open Supabase Dashboard -> Settings -> Backups -> Point in Time
2. Select the exact timestamp to restore to (date + time, UTC)
3. Supabase creates a new database branch at that point in time
4. Verify the restored data in the branch
5. If correct, promote the branch to production (or selectively copy data)

**PITR advantages over daily backups:**
- RPO drops from 24 hours to seconds
- Can target a specific moment (e.g., "restore to 14:32:17 UTC, just before the bad migration ran")
- Non-destructive: creates a branch rather than overwriting production
- Can restore individual tables by connecting to the branch and copying with `INSERT INTO ... SELECT FROM`

---

## Layer 3: Manual Export Procedures

For belt-and-suspenders data protection beyond Supabase's managed backups, ChainIQ maintains a manual export procedure that creates portable, vendor-independent database dumps.

### Weekly Full Export (Automated)

A GitHub Actions workflow runs every Sunday at 01:00 UTC:

```yaml
# .github/workflows/db-export.yml
name: Weekly DB Export
on:
  schedule:
    - cron: '0 1 * * 0'  # Sunday 01:00 UTC
jobs:
  export:
    runs-on: ubuntu-latest
    steps:
      - name: Export database
        run: |
          pg_dump "$SUPABASE_DB_URL" \
            --format=custom \
            --no-owner \
            --no-privileges \
            --exclude-table='auth.*' \
            --exclude-table='storage.*' \
            > chainiq-backup-$(date +%Y%m%d).dump
      - name: Encrypt backup
        run: |
          gpg --symmetric --cipher-algo AES256 \
            --batch --passphrase "$BACKUP_ENCRYPTION_KEY" \
            chainiq-backup-$(date +%Y%m%d).dump
      - name: Upload to backup storage
        run: |
          # Upload to Hetzner Storage Box (20GB, EUR 3.29/mo)
          scp chainiq-backup-*.dump.gpg \
            backup@backup-server:/backups/chainiq/
```

**Retention:** 4 weekly exports retained on Hetzner Storage Box. Monthly exports (first Sunday of each month) retained for 12 months. Total storage: <5GB for the first year.

**Cost:** Hetzner Storage Box BX11 (1TB): EUR 3.29/month (~$3.60). Alternatively, use the existing Hetzner CPX21's 80GB NVMe (plenty of spare space at current data volumes).

### On-Demand Export (Manual)

For pre-migration safety, pre-deployment safety, or ad-hoc backup needs:

1. Connect to Supabase via the connection string (Settings -> Database -> Connection String)
2. Run: `pg_dump "$SUPABASE_DB_URL" --format=custom --no-owner > chainiq-manual-$(date +%Y%m%d-%H%M).dump`
3. Verify: `pg_restore --list chainiq-manual-*.dump | head -20` (should show table list)
4. Encrypt and store as per the automated workflow

**When to run manual exports:**
- Before any migration that alters table structure (ALTER TABLE, DROP COLUMN)
- Before running the `delete_user_cascade()` function on any user
- Before any Supabase plan change or region migration
- Before rotating the Supabase service_role key

---

## Layer 4: Schema Version Control

The database schema, migrations, RLS policies, and PostgreSQL functions are version-controlled in Git, separate from the data backups. This enables rebuilding the database structure from scratch on a new Supabase project.

**Repository structure:**
```
article-engine-plugin/
  migrations/
    001_initial_schema.sql
    002_add_dashboard_tables.sql
    003_add_indexes.sql
    004_add_data_lifecycle.sql
    ...
  policies/
    rls_policies.sql
  functions/
    rollup_and_purge_snapshots.sql
    delete_user_cascade.sql
    check_rate_limit.sql
    cleanup_stale_oauth_tokens.sql
```

**Recovery scenario -- new Supabase project from scratch:**
1. Create new Supabase project (same region: Frankfurt for MENA latency)
2. Run migrations in order: `psql "$NEW_DB_URL" -f migrations/001_initial_schema.sql` (and so on)
3. Apply RLS policies: `psql "$NEW_DB_URL" -f policies/rls_policies.sql`
4. Install functions: `psql "$NEW_DB_URL" -f functions/*.sql`
5. Restore data from backup: `pg_restore -d "$NEW_DB_URL" --data-only chainiq-backup-*.dump`
6. Update environment variables on Hetzner (new Supabase URL, new anon key, new service_role key)
7. Restart bridge server via Coolify
8. Verify: hit `/health` endpoint, run smoke tests

**Estimated time:** 30-60 minutes for full reconstruction.

---

## Layer 5: Key Rotation Recovery

ChainIQ uses several secrets that, if lost or compromised, require a specific recovery procedure:

### Supabase Service Role Key

**Storage:** Environment variable on Hetzner (Coolify environment config). Backed up in 1Password vault (offline).

**Rotation procedure:**
1. Generate new service_role key in Supabase Dashboard -> Settings -> API
2. Update environment variable in Coolify
3. Restart bridge server (Coolify -> Redeploy)
4. Verify: hit `/health`, attempt an auth-protected endpoint
5. Old key is immediately invalidated by Supabase

**Impact of loss:** Cannot perform admin operations (user management, subscription CRUD, usage log queries). Dashboard and article generation halt. RLS-protected data is inaccessible to the bridge server.

**Recovery if key is unknown:** Supabase Dashboard always shows the current service_role key. If dashboard access is lost, contact Supabase support with project ID.

### Supabase Anon Key

**Storage:** Hardcoded in `supabase-client.js` as `DEFAULT_CONFIG` (see TD-001 -- planned migration to env var). Also visible in Supabase Dashboard.

**Rotation:** Same as service_role key. Additionally requires updating the Next.js dashboard's client-side Supabase initialization.

### API Key Encryption Master Key (AES-256-GCM)

**Storage:** Environment variable `ENCRYPTION_KEY` on Hetzner.

**Critical risk:** If this key is lost, all tenant API keys stored in the `api_keys` table become permanently undecryptable. Tenants must regenerate all API keys.

**Rotation procedure:**
1. Generate new 256-bit key: `openssl rand -hex 32`
2. Run a migration script that: decrypts all API keys with old master key, re-encrypts with new master key, updates all rows in `api_keys` table
3. Update `ENCRYPTION_KEY` environment variable
4. Restart bridge server

**Recovery if master key is lost:** API keys cannot be recovered. Send notification to all affected tenants with instructions to regenerate keys via the dashboard. Log the incident.

### OAuth Client Secrets (GSC, GA4)

**Storage:** Environment variables on Hetzner. Backed up in 1Password.

**Rotation:** Generate new client secret in Google Cloud Console. Update environment variable. Existing refresh tokens may continue to work (Google does not always invalidate on secret rotation), but new OAuth flows will use the new secret.

---

## Recovery Runbook Summary

| Scenario | RPO | RTO | Procedure |
|----------|-----|-----|-----------|
| Accidental row deletion | 24h (daily backup) or seconds (PITR) | 15-30 min | Restore from backup, selectively copy rows |
| Bad migration (schema corruption) | 0 (schema in Git) | 15 min | Run DOWN migration, fix, re-apply |
| Full database loss | 24h or last manual export | 30-60 min | New Supabase project, apply migrations, restore data |
| Hetzner server loss | 0 (stateless) | 15 min | Fresh Coolify deploy, same env vars |
| Supabase project deletion | Last manual export | 60 min | New project, apply migrations, restore from pg_dump |
| Master encryption key loss | N/A (key, not data) | 1-2 hours | Tenants regenerate API keys |
| Compromised service_role key | 0 | 5 min | Rotate in Supabase Dashboard, update env var, restart |

---

## Backup Testing Schedule

Backups that are never tested are not backups -- they are hopes. ChainIQ tests recovery quarterly:

| Test | Frequency | Procedure | Pass Criteria |
|------|-----------|-----------|---------------|
| Full restore from daily backup | Quarterly | Restore to a Supabase branch DB, verify row counts match | All tables present, row counts within 24h drift |
| Manual export restore | Quarterly | `pg_restore` to local PostgreSQL, run application smoke tests | All 228 tests pass against restored DB |
| Schema rebuild from Git | Bi-annually | New Supabase project, apply all migrations, verify structure | All tables, indexes, RLS policies, functions present |
| Key rotation drill | Bi-annually | Rotate service_role key on staging environment | Bridge server reconnects, no auth failures |
| Hetzner failover drill | Quarterly | Deploy to standby CPX21, point DNS, verify health | `/health` returns 200 within 5 minutes |
