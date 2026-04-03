# ChainIQ — Structured Logging Strategy

> **Step 15 Artifact** — Observability & Error Handling
> **Last Updated:** 2026-03-28
> **Applies to:** Bridge Server (logger.js), Dashboard (Next.js), Scheduler

---

## 1. Current State

ChainIQ's bridge server already has a structured JSON logger (`bridge/logger.js`, 97 lines) with:
- 4 log levels: debug, info, warn, error
- JSON line output (stdout for info+, stderr for warn+)
- Request/response logging with request IDs
- Security event logging (`logSecurity`)
- Admin action logging (`logAdmin`)
- Environment-controlled log level (`LOG_LEVEL` env var)
- Zero dependencies (Node.js built-ins only)

**What's missing:** Correlation IDs across services, log rotation/destination, structured context propagation, log aggregation strategy for production.

---

## 2. Log Level Strategy

### When to Use Each Level

| Level | When | Examples | Volume (est.) |
|-------|------|----------|---------------|
| `debug` | Detailed internal state, only in development | Query parameters, cache hits/misses, adapter selection, prompt content | High (100+ req/min in dev) |
| `info` | Normal operations worth recording | Request/response pairs, article generated, webhook delivered, OAuth connected | Medium (10-50/min in prod) |
| `warn` | Recoverable problems, degraded state | Rate limit hit, cache miss fallback, slow query (>1s), retry triggered, prompt guard near-miss | Low (1-10/hour) |
| `error` | Failures requiring investigation | Supabase unreachable, subprocess crash, unhandled rejection, encryption failure, GDPR deletion incomplete | Very Low (<5/day) |

### Log Level by Environment

| Environment | Default Level | Rationale |
|-------------|--------------|-----------|
| Development | `debug` | Full visibility during development |
| Staging | `info` | Mirror production behavior, visible operations |
| Production | `info` | Sufficient for monitoring, `debug` only enabled per-request via header |

### Dynamic Log Level Override

For production debugging without redeploying, support a per-request debug header:

```javascript
// In request handler, before processing
function getEffectiveLogLevel(req) {
  // Admin-only debug override via header
  if (req.headers['x-debug-log'] === process.env.DEBUG_LOG_SECRET) {
    return 'debug';
  }
  return process.env.LOG_LEVEL || 'info';
}
```

---

## 3. Correlation ID Strategy

All ChainIQ services must propagate a correlation ID through the request lifecycle:

```
Browser → Dashboard → Bridge Server → Supabase → External APIs
                                                      ↓
                                               Claude CLI subprocess
```

### Implementation

```javascript
/**
 * Correlation ID middleware.
 * Reads X-Request-ID from incoming request (set by Cloudflare/dashboard)
 * or generates a new one. Propagates to all downstream calls.
 */
function correlationMiddleware(req) {
  // Use incoming ID if present (from dashboard or Cloudflare)
  const incomingId = req.headers['x-request-id'];
  const requestId = incomingId || crypto.randomUUID();

  // Attach to request for downstream use
  req.requestId = requestId;

  return requestId;
}

// All Supabase calls include the correlation ID
async function supabaseQuery(method, path, body, requestId) {
  const headers = {
    'apikey': process.env.SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${token}`,
    'X-Request-ID': requestId,
  };
  // ... fetch call
}
```

### Correlation ID Flow

| Hop | Header | Set By | Read By |
|-----|--------|--------|---------|
| Browser → Dashboard | (implicit — Next.js generates) | Next.js middleware | Next.js API routes |
| Dashboard → Bridge | `X-Request-ID` | Dashboard API client | Bridge server |
| Bridge → Supabase | `X-Request-ID` | Bridge server | Supabase (logged, not processed) |
| Bridge → Claude CLI | `--request-id` (env var) | Bridge server | Not consumed (future use) |
| Bridge → Webhook delivery | `X-Request-ID` in payload | Bridge server | Webhook consumer |

---

## 4. Log Output Destinations

### Development

```
Bridge Server → stdout/stderr → terminal (human reads JSON lines)
Dashboard    → Next.js console → terminal
```

### Production (Hetzner + Coolify)

```
Bridge Server → stdout/stderr → Docker log driver → log files → Loki (optional)
                                                  ↓
                                            /var/log/chainiq/bridge-YYYY-MM-DD.jsonl
                                            (logrotate: 7 days, compress, 100MB max)

Dashboard    → Vercel logs (if Vercel) or Docker logs (if Coolify)
```

### Log Rotation Configuration

```
# /etc/logrotate.d/chainiq
/var/log/chainiq/*.jsonl {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    maxsize 100M
    copytruncate
}
```

### Future: Grafana Loki Integration

When the team grows beyond solo developer, add Loki for centralized log querying:

```yaml
# docker-compose.monitoring.yml (future, not for MVP)
services:
  loki:
    image: grafana/loki:2.9.0
    ports:
      - "3100:3100"
    volumes:
      - loki-data:/loki

  grafana:
    image: grafana/grafana:10.0.0
    ports:
      - "3001:3000"
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
```

---

## 5. Service-Specific Logging

### Bridge Server (48 endpoints)

| Log Point | Level | Fields | Purpose |
|-----------|-------|--------|---------|
| Request received | info | reqId, method, url, ip, user_agent | Traffic analysis |
| Response sent | info | reqId, status, duration_ms | Latency monitoring |
| Auth verified (cache hit) | debug | reqId, user_id, cache_ttl_remaining | Cache effectiveness |
| Auth verified (cache miss) | info | reqId, user_id, supabase_latency_ms | Supabase dependency health |
| Rate limit checked | debug | reqId, key, remaining, limit | Rate limit monitoring |
| Rate limit exceeded | warn | reqId, key, limit, retry_after | Attack detection |
| Article generated | info | reqId, user_id, topic, language, framework, duration_ms, component_count | Usage analytics |
| Edit applied | info | reqId, user_id, section, duration_ms | Edit latency tracking |
| Prompt guard triggered | warn | reqId, user_id, pattern_matched, input_preview | Security monitoring |
| Webhook delivered | info | reqId, webhook_id, event, status, duration_ms | Webhook health |
| Webhook delivery failed | error | reqId, webhook_id, event, error, retry_count | Webhook debugging |
| Job queued | info | reqId, job_id, type, queue_depth | Queue monitoring |
| Job completed | info | reqId, job_id, type, duration_ms | Job performance |
| Job failed | error | reqId, job_id, type, error, attempts | Job debugging |

### Dashboard (Next.js)

| Log Point | Level | Fields | Purpose |
|-----------|-------|--------|---------|
| Page navigation | info | path, user_id, load_time_ms | UX monitoring |
| API call to bridge | info | endpoint, method, duration_ms, status | Bridge dependency health |
| Client-side error | error | message, stack, url, user_id | Error tracking |
| Auth state change | info | event (login/logout/refresh), user_id | Session monitoring |

### Scheduler (Phase 5)

| Log Point | Level | Fields | Purpose |
|-----------|-------|--------|---------|
| Tick started | info | tick_id, tasks_pending | Scheduler health |
| Connector run | info | tick_id, provider, records_fetched, duration_ms | Data freshness |
| Connector failure | error | tick_id, provider, error, retry_count | Data pipeline debugging |
| Purge executed | info | table, rows_deleted, retention_days | Storage management |

---

## 6. Error Context Enrichment

Every error log entry must include enough context to reproduce the issue without accessing the database:

```javascript
/**
 * Error context builder — enriches error objects with request context.
 * Used in all catch blocks before logging.
 */
function enrichError(error, req, additionalContext = {}) {
  return {
    message: error.message,
    code: error.code || 'UNKNOWN',
    stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    reqId: req?.requestId,
    method: req?.method,
    url: req?.url,
    ip: req?.socket?.remoteAddress,
    user_id: req?.user?.id,
    ...additionalContext,
  };
}

// Usage in catch block:
try {
  await processEditRequest(req);
} catch (err) {
  logger.error('Edit request failed', enrichError(err, req, {
    section: body.section,
    file_path: body.filePath,
    job_id: jobId,
  }));
  sendError(res, 500, 'Edit failed');
}
```
