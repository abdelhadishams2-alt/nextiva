# ChainIQ — Disaster Recovery Plan (Draft)

> **Status:** Draft — will be expanded into full playbooks at Step 18.6
> **Last Updated:** 2026-03-28
> **Architecture:** Hetzner CPX21 (bridge) + Supabase Pro (DB) + Vercel/Coolify (dashboard)
> **RPO Target:** 24 hours (Supabase daily backups) | **RTO Target:** 2 hours

---

## Scenario 1: Database Corruption / Data Loss

**Risk:** Supabase PostgreSQL data becomes corrupt due to a bad migration, accidental mass DELETE, or Supabase-side infrastructure failure. Affects all users simultaneously since ChainIQ is single-tenant-per-database.

**Response:** Supabase Pro includes daily automated backups with 7-day retention. For accidental data loss: (1) identify the affected tables and time window, (2) open Supabase dashboard → Backups → restore to a point-in-time if within the retention window, (3) if Supabase PITR is not available on Pro, download the daily backup and restore selectively using `pg_restore` to a staging instance, then copy the clean data back. For schema corruption from a bad migration: run the DOWN migration (rollback SQL at the bottom of each migration file), verify data integrity, fix the migration, and re-apply. **Prevention:** All migrations include explicit rollback SQL. The `migrations/` directory enforces sequential numbering. Never run migrations directly in production — always test on a Supabase branch database first.

**Infrastructure decision needed:** Evaluate Supabase PITR (Point-in-Time Recovery) addon for sub-hour RPO. Current daily backup RPO of 24 hours may be insufficient once enterprise clients are onboarded.

---

## Scenario 2: Hosting Provider Outage (Hetzner)

**Risk:** Hetzner CPX21 instance becomes unreachable due to datacenter outage, network issue, or hardware failure. The bridge server (all 135 API endpoints) becomes unavailable. Dashboard shows connection errors. Article generation and editing halt.

**Response:** (1) Check Hetzner status page (status.hetzner.com) to confirm provider-side outage vs. application crash. (2) If provider outage with ETA > 30 minutes: spin up a replacement CPX21 in a different Hetzner datacenter (Falkenstein ↔ Nuremberg ↔ Helsinki) using the Coolify deployment pipeline. The bridge server is stateless — all state is in Supabase — so a fresh deploy with the same environment variables restores full service. (3) Update Cloudflare DNS to point to the new instance (TTL is 5 minutes). (4) Verify health endpoint responds, run smoke test against 5 critical endpoints. **Total RTO: ~15-30 minutes** if prepared.

**Infrastructure decision needed:** Consider Coolify multi-node setup with automatic failover. Monthly cost increase: ~EUR 7.50 for a standby node. Evaluate whether the $34/month budget allows this.

---

## Scenario 3: Internet Outage at Client Site

**Risk:** A MENA publisher client loses internet connectivity at their editorial office. They cannot access the ChainIQ dashboard, generate articles, or publish content. This is especially relevant for clients in regions with less reliable infrastructure.

**Response:** ChainIQ is a cloud-only SaaS — there is no offline mode. During an outage: (1) any in-progress article generation continues server-side (the pipeline runs on the bridge server, not the client's browser), (2) completed articles remain in Supabase and are available when connectivity returns, (3) SSE progress streams will disconnect but the underlying job continues. The client can reconnect to see the result. **No data loss occurs** from client-side connectivity issues because all state is server-side.

**Infrastructure decision needed:** Consider a "generation queue with email notification" feature — when a pipeline job completes, send an email with a direct link to the article. This lets clients start generation, lose connectivity, and still get notified of completion. Low effort, high value for MENA market. Add to expansion backlog.

---

## Scenario 4: Application Crash During Critical Workflow

**Risk:** The bridge server crashes mid-way through an article generation pipeline (e.g., Node.js unhandled exception, OOM kill, or Claude CLI subprocess hang). The user sees a stalled progress bar. The pipeline_job record is stuck in "running" status.

**Response:** (1) The job queue already handles this — jobs have a `max_duration` timeout (10 minutes for generation, 10 minutes for edits). If the bridge server restarts, the scheduler picks up stale "running" jobs and marks them as "failed" with a retry flag. (2) Coolify monitors the Node.js process and auto-restarts on crash (systemd-style). Typical restart time: < 5 seconds. (3) The user sees the SSE stream disconnect, reconnects automatically (exponential backoff in the frontend), and either sees the completed result or a "generation failed, retry?" message. **Prevention:** The 4MB stdout limit on Claude CLI subprocesses prevents OOM. The global edit mutex prevents concurrent subprocess spawning. Structured logging captures crash context for post-mortem.

**Infrastructure decision needed:** None immediately. Current architecture handles this well. Monitor crash frequency after launch — if > 1/week, add a process manager (PM2 or systemd watchdog with memory limit alerts).

---

## Scenario 5: Security Breach / Unauthorized Access

**Risk:** An attacker gains access to the system through: (a) stolen JWT token, (b) compromised Supabase service_role key, (c) prompt injection via the Claude CLI edit endpoint, or (d) brute-force attack on the login endpoint.

**Response:** (a) **Stolen JWT:** Supabase JWT tokens expire after 1 hour by default. The auth cache (30s TTL) limits the window. Immediate response: revoke the user's session via Supabase Admin API (`auth.admin.signOut(userId)`), rotate the JWT secret in Supabase dashboard. (b) **Compromised service_role key:** This is the highest-severity scenario — service_role bypasses all RLS. Immediate response: rotate the key in Supabase dashboard (Settings → API), update the environment variable on Hetzner, restart bridge server. Audit all admin operations in the past 24 hours via usage_logs table. (c) **Prompt injection:** The prompt-guard module (21 tests) sanitizes all edit instructions before passing to Claude CLI. If bypassed: the damage is limited to the user's own articles (RLS prevents cross-user access). Disable the `/apply-edit` endpoint temporarily, audit the attack vector, patch the prompt guard. (d) **Brute force:** Rate limiter caps login attempts at 5/minute per IP. After 10 failed attempts: temporary IP block (in-memory, resets on restart — sufficient for localhost-only bridge, needs Redis for production).

**Infrastructure decision needed:** Add Cloudflare WAF rules for production deployment. Configure Supabase's built-in brute-force protection (auto-lockout after N failed attempts). Consider adding audit log immutability (append-only table with no DELETE policy, even for service_role).

---

## Scenario 6: Third-Party API / Vendor Outage

**Risk:** A critical external service becomes unavailable: (a) Supabase (database + auth), (b) Google APIs (GSC/GA4 OAuth + data), (c) Semrush/Ahrefs APIs (competitive data), (d) Claude/Anthropic (article generation), (e) Gemini (research + image generation).

**Response:** (a) **Supabase down:** Everything stops — auth, data, articles. Check status.supabase.com. No local fallback is possible for auth. Wait for recovery. RTO depends on Supabase. **Mitigation:** Supabase Pro has 99.9% SLA. (b) **Google APIs down:** Data ingestion pauses. The scheduler marks the pull as "failed" and retries at the next interval. Existing content inventory data remains available. No user-facing impact unless the outage lasts > 24 hours (data freshness degrades). (c) **Semrush/Ahrefs down:** Competitive intelligence features show stale data. Recommendations still work from cached keyword_opportunities table. Non-critical. (d) **Claude/Anthropic down:** Article generation and section editing fail. The queue marks jobs as "failed" with a retry flag. Users see "Generation service temporarily unavailable." All other dashboard features continue working. (e) **Gemini down:** Research rounds fall back to WebSearch/WebFetch (already configured as secondary provider). Image generation fails gracefully — articles generate without images, user can regenerate images later.

**Infrastructure decision needed:** Add a "service health" dashboard widget showing the status of all external dependencies. Implement circuit breaker pattern for data ingestion connectors — after 3 consecutive failures, pause the connector and alert the user instead of burning API quota on retries.

---

## Scenario 7: Data Migration Failure (New Customer Onboarding)

**Risk:** A new enterprise client onboards with 10,000+ existing URLs. The initial content crawl or GSC/GA4 data import fails partway through — due to timeout, rate limiting, malformed data, or hitting the Supabase 8GB storage limit.

**Response:** (1) Content crawl is resumable — the crawler tracks progress per-URL in the content_inventory table. A failed crawl can be restarted from where it left off (the POST /api/inventory/crawl endpoint detects existing inventory and does incremental crawl). (2) GSC/GA4 imports are paginated (25K rows per request for GSC) with automatic retry on rate limit (429 responses trigger exponential backoff). A partial import leaves valid data in performance_snapshots — subsequent scheduler runs fill in the gaps. (3) If the 8GB storage limit is approached: the 90-day purge + monthly rollup strategy kicks in automatically (DI-005 scheduler task). For the initial import of a large client, temporarily increase the purge to 60 days during onboarding, then relax to 90 days once historical data is rolled up. (4) Malformed data: the crawler validates each URL response (status code, content-type, body_text extraction) and skips invalid entries, logging them to an error table for manual review.

**Infrastructure decision needed:** Calculate exact storage usage per enterprise client (currently estimated at 60MB/month for 10K URLs). If 3+ enterprise clients onboard simultaneously, the 8GB limit may be reached in 4 months. Plan for Supabase Pro upgrade ($75/month for 50GB) or implement aggressive archival (move data older than 6 months to cold storage / CSV export). Add storage monitoring alert at 70% capacity.

---

## Summary: Infrastructure Decisions Required

| # | Decision | Relevant Steps | Priority |
|---|----------|----------------|----------|
| 1 | Evaluate Supabase PITR addon for sub-hour RPO | Step 11, 17 | P1 |
| 2 | Coolify multi-node failover (standby bridge server) | Step 11 | P2 |
| 3 | Email notification on pipeline completion | Expansion backlog | P2 |
| 4 | Cloudflare WAF rules for production | Step 11 | P1 |
| 5 | Service health dashboard widget | Step 17 | P2 |
| 6 | Circuit breaker for data ingestion connectors | DI-005 task | P1 |
| 7 | Storage monitoring alert at 70% capacity | Step 11 | P1 |
| 8 | Supabase upgrade plan for 50GB+ | Step 17 | P2 |
