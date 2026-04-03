# ChainIQ — Alerting Rules & Error Handling Strategy

> **Step 15 Artifact** — Observability & Error Handling
> **Last Updated:** 2026-03-28
> **Applies to:** Bridge Server, Dashboard, Monitoring Infrastructure

---

## 1. Alerting Rules

### Severity Definitions

| Severity | Response Time | Notification | Example |
|----------|-------------|--------------|---------|
| **P0 — Critical** | < 15 min | Email + SMS + Slack | Bridge server down, Supabase unreachable, data breach detected |
| **P1 — High** | < 1 hour | Email + Slack | Error rate > 1%, all edits failing, OAuth tokens not refreshing |
| **P2 — Medium** | < 4 hours | Email | Slow queries, webhook delivery degraded, queue backlog growing |
| **P3 — Low** | Next business day | Email digest | High cache miss rate, approaching storage limits, minor config issue |

### Alert Threshold Table

| Alert | Metric | Threshold | Window | Severity | Auto-Resolve |
|-------|--------|-----------|--------|----------|-------------|
| Bridge server down | Health check failures | 2 consecutive | 2 min | P0 | Yes, on recovery |
| Supabase unreachable | Readiness check failure | 1 failure | 5 min | P0 | Yes, on recovery |
| High error rate | HTTP 5xx / total requests | > 1% | 5 min | P1 | Yes, when < 0.5% |
| Edit service failure | Edit endpoint 5xx | > 3 in 5 min | 5 min | P1 | Yes, when resolved |
| Login brute force | Failed logins from single IP | > 20 in 5 min | 5 min | P1 | Yes, after lockout |
| Prompt injection spike | Prompt guard blocks | > 5 in 1 hour | 1 hour | P1 | Yes, when < 2/hour |
| Slow response times | p95 latency | > 500ms | 5 min | P2 | Yes, when < 200ms |
| Job queue backlog | Pending jobs | > 20 | 5 min | P2 | Yes, when < 5 |
| Webhook delivery failures | Delivery success rate | < 95% | 1 hour | P2 | Yes, when > 99% |
| Memory pressure | RSS memory | > 350MB | 5 min | P2 | Yes, when < 200MB |
| High rate limiting | 429 responses / total | > 5% | 15 min | P2 | Yes, when < 1% |
| Auth cache low hit rate | Cache hits / total verifications | < 50% | 1 hour | P3 | No |
| Storage approaching limit | Supabase storage usage | > 6GB (of 8GB) | Daily | P3 | No |
| SSL certificate expiry | Certificate valid days | < 14 days | Daily | P2 | No |
| Node.js version outdated | LTS version check | Not latest LTS | Weekly | P3 | No |

### Alert Implementation (Coolify + UptimeRobot)

```yaml
# Coolify notification settings
notifications:
  email:
    enabled: true
    recipients:
      - admin@chainreactionseo.com
    on_events:
      - deployment_failed
      - container_restart
      - health_check_failed

  # Webhook to Slack (optional future)
  webhook:
    enabled: false
    url: "${SLACK_WEBHOOK_URL}"
```

```
# UptimeRobot monitors (configured via dashboard)
Monitor 1: Bridge Health
  URL: https://api.chainiq.io/health
  Type: HTTP(S)
  Interval: 60s
  Alert contacts: admin@chainreactionseo.com
  Alert on: Down for 2+ checks

Monitor 2: Dashboard Health
  URL: https://app.chainiq.io/api/health
  Type: HTTP(S)
  Interval: 60s
  Alert contacts: admin@chainreactionseo.com

Monitor 3: Supabase
  URL: https://{project}.supabase.co/rest/v1/
  Type: HTTP(S)
  Interval: 300s
  Custom header: apikey: {anon_key}
```

---

## 2. Error Handling Strategy

### Error Classification

| Error Type | HTTP Status | Retryable | Log Level | User Message |
|-----------|-------------|-----------|-----------|-------------|
| **Validation error** | 400 | No | info | Specific field errors |
| **Authentication failed** | 401 | No | warn | "Invalid credentials" |
| **Authorization denied** | 403 | No | warn | "Insufficient permissions" |
| **Resource not found** | 404 | No | info | "Resource not found" |
| **Rate limited** | 429 | Yes (after delay) | warn | "Too many requests. Retry in {N}s" |
| **Conflict** | 409 | No | info | "Resource already exists" |
| **Request too large** | 413 | No | warn | "Request body too large" |
| **Server error** | 500 | Yes (1 retry) | error | "An internal error occurred" |
| **Dependency down** | 503 | Yes (with backoff) | error | "Service temporarily unavailable" |
| **Timeout** | 504 | Yes (1 retry) | error | "Request timed out" |

### Error Response Format

All error responses follow a consistent JSON structure:

```json
{
  "error": true,
  "message": "Human-readable error description",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "email", "message": "Email is required" },
    { "field": "topic", "message": "Topic must be between 3 and 500 characters" }
  ],
  "requestId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "retryAfter": null
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request body failed validation |
| `INVALID_JSON` | 400 | Request body is not valid JSON |
| `AUTH_REQUIRED` | 401 | No authentication token provided |
| `AUTH_INVALID` | 401 | Token is invalid or expired |
| `AUTH_LOCKED` | 429 | Account temporarily locked |
| `FORBIDDEN` | 403 | User lacks permission for this action |
| `ADMIN_REQUIRED` | 403 | Admin privileges required |
| `NOT_FOUND` | 404 | Requested resource does not exist |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `QUOTA_EXCEEDED` | 429 | Subscription quota exceeded |
| `CONFLICT` | 409 | Resource already exists or concurrent modification |
| `BODY_TOO_LARGE` | 413 | Request body exceeds 64KB limit |
| `PROMPT_BLOCKED` | 422 | Prompt injection pattern detected |
| `PATH_BLOCKED` | 422 | Path traversal attempt detected |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `SUPABASE_ERROR` | 503 | Supabase dependency unavailable |
| `EDIT_TIMEOUT` | 504 | Claude CLI subprocess timed out |
| `EDIT_OUTPUT_EXCEEDED` | 500 | Claude CLI output exceeded 4MB |

---

## 3. Error Handling Middleware

### Bridge Server Error Middleware

```javascript
/**
 * Global error handler — catches unhandled errors in request processing.
 * Logs full error server-side, returns safe message to client.
 */
function handleRequestError(err, req, res) {
  const requestId = req.requestId || 'unknown';

  // Classify the error
  if (err instanceof ValidationError) {
    logger.info('Validation error', {
      reqId: requestId,
      errors: err.errors,
    });
    return json(res, 400, {
      error: true,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: err.errors.map(e => ({ field: e.field, message: e.message })),
      requestId,
    });
  }

  if (err.message?.includes('Request body too large')) {
    logger.warn('Request too large', { reqId: requestId });
    return json(res, 413, {
      error: true,
      code: 'BODY_TOO_LARGE',
      message: 'Request body exceeds maximum size (64KB)',
      requestId,
    });
  }

  if (err.code === 'ENOENT') {
    return json(res, 404, {
      error: true,
      code: 'NOT_FOUND',
      message: 'Requested resource not found',
      requestId,
    });
  }

  // Unhandled error — log full details, return generic message
  logger.error('Unhandled error', {
    reqId: requestId,
    message: err.message,
    code: err.code,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user_id: req.user?.id,
  });

  // Never leak internal details to client in production
  const isProd = process.env.NODE_ENV === 'production';
  json(res, 500, {
    error: true,
    code: 'INTERNAL_ERROR',
    message: isProd ? 'An internal error occurred. Please try again.' : err.message,
    requestId,
  });
}
```

### Unhandled Rejection & Exception Handlers

```javascript
/**
 * Process-level error handlers.
 * Log the error and let the process manager (Coolify/Docker) restart.
 * Do NOT swallow the error — crashing is better than running in unknown state.
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection', {
    reason: reason?.message || String(reason),
    stack: reason?.stack,
  });
  // Let Coolify restart us — do not process.exit() here
  // The health check will detect degradation
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception — shutting down', {
    message: err.message,
    stack: err.stack,
  });
  // Flush logs, close server, then exit
  server.close(() => {
    process.exit(1); // Non-zero exit code triggers Coolify restart
  });
  // Force exit after 5 seconds if graceful close hangs
  setTimeout(() => process.exit(1), 5000);
});
```

---

## 4. Dashboard Error Handling (Next.js)

### Error Boundary Hierarchy

```
App Layout (root error boundary)
├── Auth Error Boundary (login/signup pages)
├── Dashboard Error Boundary (authenticated pages)
│   ├── Page-Level Error (per-route error.tsx)
│   │   ├── Component-Level Try/Catch (individual components)
│   │   └── Suspense Boundary (loading states)
│   └── Not Found (not-found.tsx)
└── Global Error (global-error.tsx — catches layout errors)
```

### Error Boundary Implementation

```typescript
// app/error.tsx — Dashboard-level error boundary
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to monitoring (future: Sentry, LogRocket)
    console.error('Dashboard error:', error.message, error.digest);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-zinc-400">
          {error.digest
            ? `Error reference: ${error.digest}`
            : 'An unexpected error occurred.'}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-amber-500 text-black rounded-md hover:bg-amber-400"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
```

---

## 5. Retry & Circuit Breaker Patterns

### Retry Configuration

| Operation | Max Retries | Backoff | Jitter | Timeout |
|-----------|------------|---------|--------|---------|
| Supabase query | 2 | 500ms, 1500ms | ±200ms | 5s per attempt |
| OAuth token refresh | 3 | 1s, 3s, 9s | ±500ms | 10s per attempt |
| Webhook delivery | 5 | 1s, 5s, 30s, 120s, 600s | ±20% | 10s per attempt |
| Claude CLI subprocess | 0 (no retry) | — | — | 600s (10 min) |
| External API (GSC/GA4) | 3 | 2s, 8s, 30s | ±30% | 15s per attempt |

### Retry Implementation

```javascript
/**
 * Generic retry with exponential backoff and jitter.
 * Used for Supabase queries and external API calls.
 */
async function withRetry(fn, options = {}) {
  const {
    maxRetries = 2,
    baseDelay = 500,
    maxDelay = 30000,
    jitterFactor = 0.2,
    timeout = 5000,
    onRetry = null,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      const result = await fn(controller.signal);
      clearTimeout(timer);
      return result;
    } catch (err) {
      lastError = err;

      if (attempt === maxRetries) break;
      if (!isRetryable(err)) break;

      const delay = Math.min(baseDelay * Math.pow(3, attempt), maxDelay);
      const jitter = delay * jitterFactor * (Math.random() * 2 - 1);
      const waitMs = Math.round(delay + jitter);

      if (onRetry) onRetry(attempt + 1, waitMs, err);
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
  }

  throw lastError;
}

function isRetryable(err) {
  // Network errors are retryable
  if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') return true;
  if (err.name === 'AbortError') return true;
  // 5xx errors are retryable, 4xx are not
  if (err.status >= 500) return true;
  if (err.status === 429) return true; // Rate limited — retry after delay
  return false;
}
```

### Circuit Breaker (Supabase)

```javascript
/**
 * Simple circuit breaker for Supabase dependency.
 * Opens after 5 consecutive failures, half-opens after 30s.
 */
class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5;
    this.cooldownMs = options.cooldownMs || 30000;
    this.state = 'closed'; // closed, open, half-open
    this.failures = 0;
    this.lastFailure = 0;
  }

  async execute(fn) {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.cooldownMs) {
        this.state = 'half-open';
      } else {
        throw new Error(`Circuit breaker ${this.name} is open`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      logger.error(`Circuit breaker ${this.name} opened after ${this.failures} failures`);
    }
  }
}

// Usage
const supabaseBreaker = new CircuitBreaker('supabase', {
  failureThreshold: 5,
  cooldownMs: 30000,
});

async function querySupabase(path, options) {
  return supabaseBreaker.execute(() => supabase.query(path, options));
}
```

---

## 6. Graceful Shutdown

```javascript
/**
 * Graceful shutdown handler.
 * Stops accepting new requests, finishes in-flight requests,
 * flushes logs, then exits.
 */
function setupGracefulShutdown(server) {
  let shuttingDown = false;

  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info(`Received ${signal} — starting graceful shutdown`);

    // 1. Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed — no new connections');
    });

    // 2. Wait for in-flight requests (max 30s)
    const shutdownTimeout = setTimeout(() => {
      logger.warn('Graceful shutdown timeout — forcing exit');
      process.exit(1);
    }, 30000);

    // 3. Drain job queue (finish active, skip pending)
    await jobQueue.drain();
    logger.info('Job queue drained');

    // 4. Flush webhook delivery queue
    await webhookManager.flush();
    logger.info('Webhook queue flushed');

    // 5. Flush audit logs to Supabase
    // (SecurityAuditLogger.flushToSupabase from Step 14)

    // 6. Clean up PID file
    try { await fs.promises.unlink(pidFile); } catch {}

    clearTimeout(shutdownTimeout);
    logger.info('Graceful shutdown complete');
    process.exit(0);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
```
