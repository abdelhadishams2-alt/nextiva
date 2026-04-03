# ChainIQ — Rate Limiting & DoS Protection Configuration

> **Step 14 Artifact** — Security Hardening
> **Last Updated:** 2026-03-28
> **Applies to:** Bridge Server, Cloudflare, Dashboard

---

## 1. Rate Limiting Architecture

ChainIQ uses a two-layer rate limiting strategy:

```
[Client Request]
      ↓
[Layer 1: Cloudflare] ← Coarse per-IP limits, DDoS protection, WAF rules
      ↓
[Layer 2: Bridge Server] ← Fine-grained per-user/key limits, tier-aware
      ↓
[Layer 3: Supabase] ← Connection limits (100 max on Pro plan)
```

### Layer 1: Cloudflare (Outer Perimeter)

Cloudflare free tier provides basic DDoS protection. For ChainIQ, configure these rules:

| Rule | Scope | Threshold | Action | Rationale |
|------|-------|-----------|--------|-----------|
| Global rate limit | All requests | 1000 req/10min per IP | Challenge | Prevents basic flooding |
| Auth endpoint protection | `/auth/*` | 30 req/min per IP | Block (1 hour) | Prevents credential stuffing |
| API endpoint protection | `/api/*` | 500 req/10min per IP | Challenge | Protects compute-heavy endpoints |
| SSE connection limit | `/apply-edit` (SSE) | 5 concurrent per IP | Block | Prevents connection exhaustion |
| Bot detection | All requests | Cloudflare Bot Score < 20 | Challenge | Blocks automated scanners |

**Configuration method:** Cloudflare Dashboard → Security → WAF → Rate Limiting Rules.

### Layer 2: Bridge Server (Application Level)

The bridge server's in-memory rate limiter provides per-user and per-key granularity with subscription-tier awareness.

#### Current Implementation (server.js)

```javascript
// Existing: Simple per-IP rate limiter
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds
const RATE_LIMIT_MAX = 100;          // 100 requests per window
```

#### Production Implementation (Enhanced)

```javascript
/**
 * Enhanced rate limiter with:
 * - Per-user limits (authenticated requests)
 * - Per-IP limits (unauthenticated requests)
 * - Per-API-key limits (plugin requests)
 * - Subscription-tier awareness
 * - Endpoint-specific limits
 * - Burst allowance (token bucket)
 * - Rate limit headers in responses
 */
class RateLimiter {
  constructor() {
    this.windows = new Map(); // key -> { count, resetAt, burst }
    this.lockouts = new Map(); // email/IP -> lockoutUntil

    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if request should be rate limited.
   * Returns { allowed, remaining, resetAt, retryAfter }
   */
  check(key, limit, windowMs = 60000, burstLimit = 0) {
    const now = Date.now();
    const entry = this.windows.get(key);

    if (!entry || now > entry.resetAt) {
      // New window
      this.windows.set(key, {
        count: 1,
        resetAt: now + windowMs,
        burstUsed: 0,
      });
      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: now + windowMs,
      };
    }

    entry.count++;

    // Check burst allowance
    const effectiveLimit = limit + burstLimit;
    if (entry.count > effectiveLimit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, limit - entry.count),
      resetAt: entry.resetAt,
    };
  }

  /**
   * Account lockout after repeated failures.
   * Used for login brute force protection.
   */
  recordFailure(key, maxFailures = 5, lockoutMs = 15 * 60 * 1000) {
    const entry = this.windows.get(`lockout:${key}`) || { count: 0, resetAt: Date.now() + 60000 };
    entry.count++;
    this.windows.set(`lockout:${key}`, entry);

    if (entry.count >= maxFailures) {
      this.lockouts.set(key, Date.now() + lockoutMs);
      return { lockedOut: true, lockoutUntil: Date.now() + lockoutMs };
    }

    return { lockedOut: false, failuresRemaining: maxFailures - entry.count };
  }

  isLockedOut(key) {
    const until = this.lockouts.get(key);
    if (!until) return false;
    if (Date.now() > until) {
      this.lockouts.delete(key);
      return false;
    }
    return true;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.windows) {
      if (now > entry.resetAt) this.windows.delete(key);
    }
    for (const [key, until] of this.lockouts) {
      if (now > until) this.lockouts.delete(key);
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
  }
}
```

---

## 2. Per-Endpoint Rate Limits

### Endpoint Configuration Table

| Endpoint | Key Type | Free | Pro | Enterprise | Admin | Window | Burst | Notes |
|----------|----------|------|-----|-----------|-------|--------|-------|-------|
| `POST /auth/signup` | IP | 5 | 5 | 5 | 5 | 60s | 2 | + CAPTCHA on > 3/min |
| `POST /auth/login` | IP + email | 10 | 10 | 10 | 10 | 60s | 3 | Lockout after 5 failures |
| `GET /auth/verify` | IP | 60 | 120 | 200 | 200 | 60s | 10 | High due to SSE reconnects |
| `POST /apply-edit` | user_id | 5 | 15 | 30 | 30 | 60s | 2 | CPU-intensive (Claude CLI) |
| `POST /generate` | user_id | 2 | 5 | 15 | 30 | 60s | 1 | Most expensive operation |
| `GET /articles` | user_id | 60 | 120 | 200 | 200 | 60s | 10 | Read-heavy, cheap |
| `POST /articles` | user_id | 10 | 20 | 50 | 100 | 60s | 3 | Write, moderate cost |
| `* /keys/*` | user_id | 20 | 30 | 50 | 100 | 60s | 5 | Admin-like operations |
| `* /webhooks/*` | user_id | 20 | 30 | 50 | 100 | 60s | 5 | Admin-like operations |
| `* /settings/*` | user_id | 30 | 30 | 30 | 100 | 60s | 5 | Low volume expected |
| `POST /plugin/*` | api_key | 60 | 120 | 200 | — | 60s | 10 | CMS plugin traffic |
| `GET /health` | IP | 30 | 30 | 30 | 30 | 60s | 5 | Monitoring probes |
| `GET /admin/*` | user_id | — | — | — | 100 | 60s | 10 | Admin only |
| `GET /intelligence/*` | user_id | — | 30 | 60 | 100 | 60s | 5 | Phase 6 |
| `POST /publish/*` | user_id | — | 10 | 30 | 50 | 60s | 2 | Phase 9 |

### Rate Limit Key Construction

```javascript
function getRateLimitKey(req, user, apiKey) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket.remoteAddress;

  // Plugin requests: key by API key ID
  if (apiKey) return `key:${apiKey.id}`;

  // Authenticated requests: key by user ID + endpoint group
  if (user) return `user:${user.id}:${getEndpointGroup(req)}`;

  // Unauthenticated requests: key by IP + endpoint
  return `ip:${ip}:${req.url}`;
}

function getEndpointGroup(req) {
  const url = req.url.split('?')[0];
  if (url.startsWith('/auth/')) return 'auth';
  if (url.startsWith('/admin/')) return 'admin';
  if (url.startsWith('/generate')) return 'generate';
  if (url.startsWith('/apply-edit')) return 'edit';
  if (url.startsWith('/plugin/')) return 'plugin';
  return 'default';
}
```

---

## 3. Rate Limit Response Format

When a request is rate limited, the bridge server returns:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1711641660
Retry-After: 42
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000

{
  "error": true,
  "message": "Rate limit exceeded. Try again in 42 seconds.",
  "retryAfter": 42,
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

All successful responses include rate limit headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 73
X-RateLimit-Reset: 1711641660
```

---

## 4. Account Lockout Policy

### Login Brute Force Protection

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Max failures before lockout | 5 | Balances security with UX (fat-finger tolerance) |
| Lockout duration | 15 minutes | Long enough to deter, short enough to not lock out legitimate users |
| Lockout scope | Per email + per IP | Both must be tracked to prevent distributed attacks |
| Lockout reset | On successful login after lockout expires | Counter resets fully |
| Lockout notification | Email to account owner | Alert user of potential compromise |
| Permanent lockout | After 3 lockout cycles in 24 hours | Require email verification to unlock |

### Implementation

```javascript
// In auth login handler
async function handleLogin(req, res) {
  const { email, password } = await readBody(req);
  const ip = getClientIP(req);

  // Check lockout by email
  if (rateLimiter.isLockedOut(`login:${email}`)) {
    logger.security('Login attempt on locked account', { email, ip });
    return sendError(res, 429, 'Account temporarily locked. Try again later.');
  }

  // Check lockout by IP
  if (rateLimiter.isLockedOut(`login:ip:${ip}`)) {
    logger.security('Login attempt from locked IP', { email, ip });
    return sendError(res, 429, 'Too many login attempts. Try again later.');
  }

  const result = await supabase.signIn(email, password);

  if (!result.success) {
    const emailLock = rateLimiter.recordFailure(`login:${email}`);
    const ipLock = rateLimiter.recordFailure(`login:ip:${ip}`, 20); // Higher threshold for IP

    logger.security('Login failed', {
      email,
      ip,
      emailFailuresRemaining: emailLock.failuresRemaining,
      lockedOut: emailLock.lockedOut,
    });

    if (emailLock.lockedOut) {
      // TODO: Send lockout notification email
      return sendError(res, 429, 'Account locked due to repeated failed attempts. Try again in 15 minutes.');
    }

    return sendError(res, 401, 'Invalid email or password.');
  }

  // Success — clear failure counters
  rateLimiter.windows.delete(`lockout:login:${email}`);

  logger.security('Login successful', { email, ip });
  json(res, 200, { token: result.token, user: result.user });
}
```

---

## 5. DoS Protection Checklist

| Protection | Layer | Status | Configuration |
|------------|-------|--------|---------------|
| Cloudflare DDoS mitigation | CDN | 🔧 Planned | Free tier, always-on |
| IP-based rate limiting | CDN + App | ✅ Done (app), 🔧 (CDN) | 100 req/min default |
| Request body size limit | App | ✅ Done | 64KB max |
| Subprocess timeout | App | ✅ Done | 600s (10 min) |
| Subprocess output cap | App | ✅ Done | 4MB max |
| Connection timeout | App | 🔧 Planned | 30s idle timeout |
| Job queue depth limit | App | ✅ Done | Max 100 pending jobs |
| SSE connection limit | App | 🔧 Planned | Max 5 concurrent per user |
| Database connection pooling | Database | 🔧 Planned | Supabase PgBouncer |
| Slowloris protection | CDN | 🔧 Planned | Cloudflare handles |
| Request header size limit | App | 🔧 Planned | 8KB max |

---

## 6. Monitoring & Alerting

### Rate Limit Metrics to Track

| Metric | Alert Threshold | Window | Action |
|--------|----------------|--------|--------|
| Total 429 responses/min | > 50 | 5 min | Check for attack, review rate limits |
| Unique IPs hitting rate limits | > 20 | 5 min | Possible distributed attack |
| Login failures/min | > 30 | 5 min | Credential stuffing attempt |
| Account lockouts/hour | > 10 | 1 hour | Review lockout policy, check for attack |
| Prompt injection blocks/hour | > 5 | 1 hour | Review blocked patterns, check for probing |
| Generate endpoint usage/hour | > 100 | 1 hour | Potential abuse, check top users |
| SSE connections active | > 50 | Real-time | Connection exhaustion risk |

### Log Format for Rate Limit Events

```json
{
  "level": "warn",
  "event": "rate_limit_exceeded",
  "timestamp": "2026-03-28T14:30:00.000Z",
  "ip": "203.0.113.42",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "endpoint": "/generate",
  "method": "POST",
  "limit": 5,
  "window_ms": 60000,
  "request_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
}
```
