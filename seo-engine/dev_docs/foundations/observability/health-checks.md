# ChainIQ — Health Checks & Readiness Probes

> **Step 15 Artifact** — Observability & Error Handling
> **Last Updated:** 2026-03-28
> **Applies to:** Bridge Server, Dashboard, Coolify deployment

---

## 1. Health Check Endpoints

### Bridge Server: `/health`

**Current implementation** returns basic server status. Enhance to include dependency health:

```javascript
/**
 * GET /health — Liveness probe
 * Returns 200 if the process is running and can handle requests.
 * Does NOT check dependencies (fast, for Coolify/Docker health checks).
 */
async function handleHealth(req, res) {
  json(res, 200, {
    status: 'ok',
    service: 'bridge-server',
    version: process.env.npm_package_version || '4.6.8',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}

/**
 * GET /ready — Readiness probe
 * Returns 200 only if all critical dependencies are reachable.
 * Used by Coolify to determine if the instance can receive traffic.
 */
async function handleReady(req, res) {
  const checks = await runReadinessChecks();
  const allHealthy = checks.every(c => c.status === 'ok');

  json(res, allHealthy ? 200 : 503, {
    status: allHealthy ? 'ready' : 'not_ready',
    checks,
    timestamp: new Date().toISOString(),
  });
}

async function runReadinessChecks() {
  const checks = [];

  // 1. Supabase connectivity
  const supabaseStart = Date.now();
  try {
    await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: { 'apikey': process.env.SUPABASE_ANON_KEY },
      signal: AbortSignal.timeout(5000),
    });
    checks.push({
      name: 'supabase',
      status: 'ok',
      latency_ms: Date.now() - supabaseStart,
    });
  } catch (err) {
    checks.push({
      name: 'supabase',
      status: 'error',
      error: err.message,
      latency_ms: Date.now() - supabaseStart,
    });
  }

  // 2. Project directory accessible
  try {
    await fs.promises.access(PROJECT_DIR, fs.constants.R_OK | fs.constants.W_OK);
    checks.push({ name: 'project_dir', status: 'ok' });
  } catch {
    checks.push({ name: 'project_dir', status: 'error', error: 'PROJECT_DIR not accessible' });
  }

  // 3. Job queue operational
  checks.push({
    name: 'job_queue',
    status: 'ok',
    pending_jobs: jobQueue.getPendingCount(),
    active_jobs: jobQueue.getActiveCount(),
  });

  // 4. Encryption key available
  try {
    keyManager.validateKey();
    checks.push({ name: 'encryption', status: 'ok' });
  } catch {
    checks.push({ name: 'encryption', status: 'error', error: 'Encryption key not configured' });
  }

  return checks;
}
```

### Dashboard: `/api/health`

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const checks = [];

  // Check Supabase connection
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      signal: AbortSignal.timeout(3000),
    });
    checks.push({ name: 'supabase', status: res.ok ? 'ok' : 'degraded' });
  } catch {
    checks.push({ name: 'supabase', status: 'error' });
  }

  // Check Bridge server connection
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BRIDGE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    checks.push({ name: 'bridge', status: res.ok ? 'ok' : 'degraded' });
  } catch {
    checks.push({ name: 'bridge', status: 'error' });
  }

  const allOk = checks.every(c => c.status === 'ok');
  return NextResponse.json(
    { status: allOk ? 'healthy' : 'degraded', checks },
    { status: allOk ? 200 : 503 }
  );
}
```

---

## 2. Deployment Health Configuration

### Coolify Health Check

```yaml
# Coolify deployment settings
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:19847/health"]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 10s
```

### Docker Compose Health Check

```yaml
# docker-compose.yml
services:
  bridge:
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:19847/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    restart: unless-stopped
```

---

## 3. Dependency Health Matrix

| Dependency | Check Method | Timeout | Failure Impact | Fallback |
|-----------|-------------|---------|----------------|----------|
| **Supabase PostgreSQL** | HEAD request to REST API | 5s | CRITICAL — all auth + data fails | Return 503, queue requests |
| **Supabase Auth** | Token verification call | 5s | CRITICAL — no new auth, cache still serves | Use 30s SHA-256 cache |
| **PROJECT_DIR filesystem** | `fs.access()` check | 1s | HIGH — no file operations | Return 503 for file endpoints |
| **Claude CLI** | `which claude` on startup | 3s | MEDIUM — no edit operations | Queue edits, alert admin |
| **KeyManager** | Key validation check | 0.1s | HIGH — no encryption/decryption | Return 503 for key endpoints |
| **Job Queue** | Internal state check | 0.01s | LOW — queue metrics unavailable | Serve without queue metrics |
| **Webhook delivery** | Async — no sync check | — | LOW — webhooks delayed | Retry with exponential backoff |

### Graceful Degradation Rules

1. **Supabase down:** Bridge server returns 503 for all authenticated endpoints. Health endpoint still returns 200 (process is alive). Readiness returns 503.
2. **Claude CLI unavailable:** Edit endpoints return 503 with "Edit service temporarily unavailable." All other endpoints continue normally.
3. **Filesystem inaccessible:** File operation endpoints return 503. Auth and data endpoints continue normally.
4. **Encryption key missing:** API key and OAuth endpoints return 503. Auth (Supabase JWT) continues normally.

---

## 4. Uptime Monitoring (External)

### Recommended Setup

| Monitor | Target | Interval | Alert After | Alert Channel |
|---------|--------|----------|-------------|---------------|
| Bridge health | `https://api.chainiq.io/health` | 60s | 2 consecutive failures | Email + Slack |
| Bridge readiness | `https://api.chainiq.io/ready` | 300s | 1 failure | Email |
| Dashboard | `https://app.chainiq.io/api/health` | 60s | 2 consecutive failures | Email + Slack |
| Supabase | `https://{project}.supabase.co/rest/v1/` | 300s | 1 failure | Email |
| SSL certificate | `https://api.chainiq.io` | Daily | 14 days before expiry | Email |

### Free Monitoring Options

| Service | Free Tier | Recommendation |
|---------|-----------|----------------|
| UptimeRobot | 50 monitors, 5-min interval | ✅ Use for MVP |
| Betterstack | 10 monitors, 3-min interval | Alternative |
| Cloudflare Health Checks | Unlimited (with Cloudflare) | ✅ Use if already on Cloudflare |

---

## 5. Process Metrics

### Bridge Server Metrics (Exposed via `/metrics` endpoint, admin-only)

```javascript
/**
 * GET /metrics — Internal metrics for monitoring
 * Admin-only endpoint. Returns process and application metrics.
 */
async function handleMetrics(req, res) {
  const user = await verifyAuth(req);
  if (!user?.is_admin) return sendError(res, 403, 'Admin only');

  const memUsage = process.memoryUsage();

  json(res, 200, {
    process: {
      uptime_seconds: Math.floor(process.uptime()),
      memory_rss_mb: Math.round(memUsage.rss / 1024 / 1024),
      memory_heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
      memory_heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
      cpu_user_ms: process.cpuUsage().user / 1000,
      cpu_system_ms: process.cpuUsage().system / 1000,
      event_loop_lag_ms: 0, // Placeholder — implement with perf_hooks
    },
    application: {
      active_connections: server.connections || 0,
      job_queue_pending: jobQueue.getPendingCount(),
      job_queue_active: jobQueue.getActiveCount(),
      rate_limit_entries: rateLimiter.windows.size,
      auth_cache_size: authCache.size,
      webhook_pending: webhookManager.getPendingCount(),
    },
    generated_at: new Date().toISOString(),
  });
}
```

### Key Performance Indicators

| Metric | Healthy | Warning | Critical | Action |
|--------|---------|---------|----------|--------|
| Response time (p95) | < 200ms | 200-500ms | > 500ms | Check Supabase latency |
| Memory RSS | < 200MB | 200-350MB | > 350MB | Investigate leaks, restart |
| Error rate (5xx/total) | < 0.1% | 0.1-1% | > 1% | Check logs, alert |
| Job queue depth | < 5 | 5-20 | > 20 | Scale or throttle |
| Auth cache hit rate | > 80% | 50-80% | < 50% | Check cache TTL |
| Webhook delivery success | > 99% | 95-99% | < 95% | Check webhook consumers |
