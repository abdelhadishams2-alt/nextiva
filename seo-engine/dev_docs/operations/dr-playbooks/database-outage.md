# DR Playbook: Supabase Database Outage

> **Severity:** SEV1
> **RTO (Recovery Time Objective):** 1 hour
> **RPO (Recovery Point Objective):** 24 hours (Supabase Pro automatic daily backups)
> **Last Tested:** [Update after each drill]
> **Owner:** Solo Developer

---

## 1. Overview

Supabase is the central data layer for ChainIQ. It handles PostgreSQL storage, Row-Level Security (RLS) policies, authentication (Supabase Auth), and real-time subscriptions. A Supabase outage is a SEV1 event because it blocks virtually every platform operation: user login, article storage, analytics reads, dashboard data, and publishing workflows.

### Services Affected

| Service | Impact Level | Description |
|---------|-------------|-------------|
| Auth & Bridge | **Complete Block** | Cannot authenticate users, cannot validate tokens, all 48 bridge endpoints return 401/500 |
| Article Pipeline | **Complete Block** | Cannot store generated articles, cannot retrieve prompts or templates |
| Dashboard API | **Complete Block** | No data to render, all API calls fail |
| Analytics | **Complete Block** | Cannot read or write analytics events |
| Content Intelligence | **Complete Block** | Cannot access scoring data or content profiles |
| Publishing | **Complete Block** | Cannot retrieve articles for publishing, cannot update publish status |
| Quality Gate | **Partial Block** | Can still run LLM-based checks but cannot persist results |
| Data Ingestion | **Complete Block** | Cannot write ingested data |
| Feedback Loop | **Partial Block** | Can queue feedback locally but cannot persist |
| Admin & Users | **Complete Block** | No user management possible |
| Voice Intelligence | **Partial Block** | Processing may continue in memory but results cannot be stored |
| Universal Engine | **Partial Block** | Can process requests but cannot retrieve or store state |

---

## 2. Detection

### Automated Detection

1. **Health check failure** — The bridge server's `/health` endpoint includes a Supabase readiness check (`SELECT 1` query). If this fails 3 consecutive times (30-second interval), an alert fires.
2. **Error rate spike** — Application logs show `PGRST` errors, connection timeouts, or `ECONNREFUSED` from Supabase client.
3. **Uptime monitor** — External uptime monitor detects bridge server `/health` returning non-200.

### Manual Detection

1. **Supabase Dashboard** — Navigate to the project dashboard. If the dashboard itself is unreachable, it confirms a Supabase-side outage.
2. **Supabase Status Page** — Check https://status.supabase.com for ongoing incidents.
3. **Customer reports** — Users report inability to log in or "something went wrong" errors.

### Distinguishing Supabase Outage from Network Issues

```bash
# Test 1: Can you reach Supabase from the server?
curl -s -o /dev/null -w "%{http_code}" https://[PROJECT_REF].supabase.co/rest/v1/ -H "apikey: [ANON_KEY]"

# Test 2: Can you reach Supabase from your local machine?
curl -s -o /dev/null -w "%{http_code}" https://[PROJECT_REF].supabase.co/rest/v1/ -H "apikey: [ANON_KEY]"

# Test 3: DNS resolution check
nslookup [PROJECT_REF].supabase.co

# Test 4: Direct PostgreSQL connection test (if direct connection enabled)
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" -c "SELECT 1"
```

If Test 1 fails but Test 2 succeeds, the issue is network between Hetzner and Supabase (not a Supabase outage). If both fail, confirm via status page.

---

## 3. Immediate Response (0-15 minutes)

### Step 1: Confirm the Outage

1. Run the detection tests above.
2. Check https://status.supabase.com.
3. Verify from at least two different networks/locations.

### Step 2: Open Incident Log

Create `dev_docs/operations/incidents/YYYY-MM-DD-supabase-outage.md` with initial timeline entry.

### Step 3: Activate Read-Only / Graceful Degradation Mode

The bridge server should be configured to detect Supabase unavailability and switch to degraded mode automatically. If this is not yet implemented, apply manually:

```bash
# SSH into the Hetzner server
ssh root@[HETZNER_IP]

# Set environment variable to trigger read-only mode
docker exec [CONTAINER_ID] sh -c "echo 'SUPABASE_READONLY=true' >> /app/.env"

# Restart the bridge container to pick up the change
docker restart [CONTAINER_ID]
```

In degraded mode, the bridge server should:
- Return a `503 Service Unavailable` with a clear message for write operations
- Serve cached data where possible (if a Redis or in-memory cache layer exists)
- Continue to accept and queue article generation requests locally (write to disk)
- Display a maintenance banner on the Dashboard

### Step 4: Communicate

1. Update the status page: **"Investigating — We are aware of a database connectivity issue affecting all services. We are investigating."**
2. If SEV1 during business hours for MENA clients, send a direct notification via email or Crisp.

---

## 4. Mitigation (15-60 minutes)

### If Supabase-Side Outage (Confirmed on Status Page)

1. **Wait and monitor.** You cannot fix a Supabase infrastructure issue.
2. Open a Supabase support ticket (Pro plan entitles you to support).
3. Update the status page every 30 minutes: **"Identified — The issue has been identified as a Supabase infrastructure incident. We are monitoring their recovery progress."**
4. Monitor https://status.supabase.com for updates.
5. Prepare to replay failed jobs once service recovers (see Recovery section).

### If Network Issue Between Hetzner and Supabase

1. Check Hetzner network status at https://status.hetzner.com.
2. Try switching to Supabase direct PostgreSQL connection (bypasses the REST API).
3. If persistent, consider temporarily migrating the bridge container to a different Hetzner datacenter or cloud provider.

### If Self-Inflicted (Bad Migration, RLS Policy, Connection Pool Exhaustion)

1. **Connection pool exhaustion:** Check active connections in Supabase dashboard > Database > Connections. Kill idle connections if at limit.
2. **Bad migration:** Roll back the last migration via Supabase dashboard or `supabase db reset` (CAUTION: only in dev).
3. **RLS policy locking out access:** Connect via the Supabase SQL editor with the `service_role` key (bypasses RLS) and fix the policy.

---

## 5. Recovery

### Step 1: Verify Service Restoration

```bash
# Confirm Supabase is responding
curl -s https://[PROJECT_REF].supabase.co/rest/v1/ -H "apikey: [ANON_KEY]" -H "Authorization: Bearer [ANON_KEY]"

# Confirm from the bridge server
ssh root@[HETZNER_IP]
docker exec [CONTAINER_ID] curl -s http://localhost:3000/health
```

### Step 2: Disable Read-Only Mode

```bash
# Remove the SUPABASE_READONLY flag
docker exec [CONTAINER_ID] sh -c "sed -i '/SUPABASE_READONLY/d' /app/.env"
docker restart [CONTAINER_ID]
```

### Step 3: Verify Data Integrity

1. Run a count check on critical tables to ensure no data loss:
   ```sql
   SELECT 'articles' as table_name, count(*) FROM articles
   UNION ALL SELECT 'users', count(*) FROM users
   UNION ALL SELECT 'analytics_events', count(*) FROM analytics_events;
   ```
2. Compare counts against the last known good values (keep a daily snapshot in monitoring).
3. Check for orphaned records or broken foreign key relationships.

### Step 4: Replay Failed Jobs

1. If the bridge server queued article generation requests locally during the outage, replay them:
   ```bash
   # Check for queued jobs
   docker exec [CONTAINER_ID] ls /app/queued-jobs/

   # Replay each job
   docker exec [CONTAINER_ID] node scripts/replay-queued-jobs.js
   ```
2. Check the article pipeline for any jobs stuck in `processing` state and reset them to `pending`.
3. Verify analytics events were not lost by checking for gaps in the event timeline.

### Step 5: Update Status Page

**"Resolved — Database connectivity has been restored. All services are operating normally. We are monitoring for any residual issues."**

---

## 6. Post-Incident

1. Write postmortem within 48 hours using the template in `communication-templates.md`.
2. Review whether automatic failover/degradation worked as expected.
3. If Supabase backup was needed, verify RPO was met (data loss < 24 hours).
4. Add action items to `STATUS.md` backlog for any gaps discovered.
5. Consider implementing: local SQLite read-cache for critical dashboard data, job queue persistence to disk, automatic degradation mode toggle.
