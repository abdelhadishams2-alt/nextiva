# ChainIQ — Security Headers & CORS Configuration

> **Step 14 Artifact** — Security Hardening
> **Last Updated:** 2026-03-28
> **Applies to:** Bridge Server (Node.js), Dashboard (Next.js 16), Cloudflare CDN

---

## 1. Security Headers Middleware

### Bridge Server Headers

All responses from the bridge server must include these security headers. Implementation is a `setSecurityHeaders(res)` function called before every `res.writeHead()`.

```javascript
/**
 * Security headers for bridge server responses.
 * Called in the main request handler before any response is sent.
 *
 * Production mode: full headers including HSTS.
 * Development mode: relaxed CSP for localhost debugging.
 */
function setSecurityHeaders(res) {
  const isProd = process.env.NODE_ENV === 'production';

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking — bridge API should never be framed
  res.setHeader('X-Frame-Options', 'DENY');

  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Disable browser features not needed by API server
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  // Request correlation ID for tracing
  const requestId = crypto.randomUUID();
  res.setHeader('X-Request-ID', requestId);

  if (isProd) {
    // HSTS: enforce HTTPS for 1 year, include subdomains, allow preload list
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    // CSP for API responses (JSON only, no scripts/styles needed)
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  }

  return requestId; // Return for logging correlation
}
```

### Dashboard Headers (Next.js)

Next.js 16 security headers configured in `next.config.ts`:

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval in dev
      "style-src 'self' 'unsafe-inline'", // Tailwind/shadcn requires inline styles
      "img-src 'self' data: https: blob:",
      `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL} ${process.env.NEXT_PUBLIC_BRIDGE_URL}`,
      "font-src 'self' https://fonts.gstatic.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; '),
  },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
```

### Cloudflare Headers (Additional Layer)

Cloudflare Page Rules / Transform Rules add these headers on top of application headers:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Belt-and-suspenders with app header |
| `X-Frame-Options` | `DENY` | Prevent framing at CDN level |
| `Expect-CT` | `max-age=86400, enforce` | Certificate Transparency enforcement |

---

## 2. CORS Configuration

### Current State (Development)

The bridge server currently uses `Access-Control-Allow-Origin: *` for all responses. This is necessary during local development where the generated article HTML opens from `file://` protocol and needs to call `http://127.0.0.1:19847`.

### Production CORS Policy

In production, CORS must restrict to known origins:

```javascript
/**
 * CORS configuration for the bridge server.
 *
 * Development: Allow all origins (needed for file:// protocol articles)
 * Production: Strict allowlist of dashboard + configured CMS origins
 */
const CORS_CONFIG = {
  // Static origins (always allowed in production)
  staticOrigins: [
    process.env.DASHBOARD_URL,        // https://app.chainiq.io
  ].filter(Boolean),

  // Dynamic origins (loaded from Supabase on startup, per-tenant)
  // These are CMS plugin origins registered by enterprise clients
  dynamicOrigins: new Set(), // Populated from plugin_instances table

  // Refresh dynamic origins every 5 minutes
  refreshInterval: 5 * 60 * 1000,
};

function isOriginAllowed(origin) {
  if (!origin) return false; // No origin = same-origin or non-browser request
  if (process.env.NODE_ENV !== 'production') return true;
  if (CORS_CONFIG.staticOrigins.includes(origin)) return true;
  if (CORS_CONFIG.dynamicOrigins.has(origin)) return true;
  return false;
}

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;

  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  // Always set these regardless of origin match
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Request-ID');
  res.setHeader('Access-Control-Expose-Headers', 'X-Request-ID, X-RateLimit-Remaining');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// Preflight handler
function handlePreflight(req, res) {
  setCorsHeaders(req, res);
  if (isOriginAllowed(req.headers.origin)) {
    res.writeHead(204);
  } else {
    res.writeHead(403);
  }
  res.end();
}
```

### Dynamic Origin Refresh

Enterprise clients register CMS plugin origins when connecting. These are stored in the `plugin_instances` table and loaded into the CORS dynamic allowlist:

```javascript
async function refreshDynamicOrigins() {
  try {
    const instances = await supabase.getPluginInstances();
    CORS_CONFIG.dynamicOrigins = new Set(
      instances
        .filter(i => i.status === 'active' && i.origin_url)
        .map(i => i.origin_url)
    );
    logger.info(`CORS: refreshed ${CORS_CONFIG.dynamicOrigins.size} dynamic origins`);
  } catch (err) {
    logger.error('CORS: failed to refresh dynamic origins', { error: err.message });
    // Keep existing origins on refresh failure — fail open for availability
  }
}

// Refresh on startup and every 5 minutes
refreshDynamicOrigins();
setInterval(refreshDynamicOrigins, CORS_CONFIG.refreshInterval);
```

---

## 3. Rate Limiting Configuration

### Current Implementation

In-memory rate limiter with 60-second sliding windows. Per-IP tracking, 100 requests/minute default.

### Production Rate Limiting (Tiered)

| Endpoint Pattern | Free Tier | Pro Tier | Enterprise | Admin | Burst |
|-----------------|-----------|----------|-----------|-------|-------|
| `POST /auth/signup` | 5/min | 5/min | 5/min | 5/min | 2 |
| `POST /auth/login` | 10/min | 10/min | 10/min | 10/min | 3 |
| `GET /auth/verify` | 60/min | 120/min | 200/min | 200/min | 10 |
| `POST /apply-edit` | 5/min | 15/min | 30/min | 30/min | 2 |
| `POST /generate/*` | 2/min | 5/min | 15/min | 30/min | 1 |
| `GET /articles/*` | 60/min | 120/min | 200/min | 200/min | 10 |
| `* /keys/*` | 20/min | 30/min | 50/min | 100/min | 5 |
| `* /webhooks/*` | 20/min | 30/min | 50/min | 100/min | 5 |
| `POST /plugin/*` | 60/min | 120/min | 200/min | 200/min | 10 |
| `GET /health` | 30/min | 30/min | 30/min | 30/min | 5 |
| `GET /admin/*` | — | — | — | 100/min | 10 |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 73
X-RateLimit-Reset: 1711641600
Retry-After: 42  (only on 429 responses)
```

### Implementation Notes

- **Two-layer rate limiting:** Cloudflare (outer, per-IP, coarse) + bridge server (inner, per-user/key, fine-grained)
- **Cloudflare rules:** 1000 req/10min per IP on `/api/*`, stricter on `/auth/*`
- **Bridge server:** In-memory Map with 60s sliding window, cleared on restart
- **Production upgrade path:** Redis-backed rate limiter when multiple bridge instances needed
- **Account lockout:** 5 failed logins per email → 15-minute lockout (stored in-memory, surviving server restart via Supabase `login_failures` column)

---

## 4. Input Sanitization Patterns

### Request Body Validation

All POST/PUT/PATCH endpoints validate input shape before processing:

```javascript
/**
 * Validates request body against expected shape.
 * Returns sanitized body or throws with specific field errors.
 */
function validateBody(body, schema) {
  const errors = [];
  const sanitized = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = body[field];

    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    // Type check
    if (value !== undefined && typeof value !== rules.type) {
      errors.push(`${field} must be type ${rules.type}`);
      continue;
    }

    // String constraints
    if (rules.type === 'string' && value) {
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} exceeds max length ${rules.maxLength}`);
        continue;
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${field} format is invalid`);
        continue;
      }
      // HTML entity encoding for text fields displayed in UI
      sanitized[field] = rules.allowHtml ? value : escapeHtml(value);
    } else {
      sanitized[field] = value;
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return sanitized;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

### Endpoint Validation Schemas

| Endpoint | Field | Type | Max Length | Pattern | Required |
|----------|-------|------|-----------|---------|----------|
| POST /auth/signup | email | string | 254 | RFC 5322 | Yes |
| POST /auth/signup | password | string | 128 | Min 8 chars | Yes |
| POST /apply-edit | section | string | 200 | Alphanumeric + hyphens | Yes |
| POST /apply-edit | instruction | string | 2000 | Prompt guard validated | Yes |
| POST /apply-edit | filePath | string | 500 | Path validation (4-layer) | Yes |
| POST /generate | topic | string | 500 | — | Yes |
| POST /generate | language | string | 10 | ISO 639-1 | No |
| POST /keys | name | string | 100 | Alphanumeric + hyphens | Yes |
| POST /webhooks | url | string | 2000 | HTTPS URL | Yes |
| POST /webhooks | events | array | 20 items | Known event names | Yes |
| PUT /settings | key | string | 100 | Settings key whitelist | Yes |
| PUT /settings | value | string | 10000 | — | Yes |

---

## 5. Dependency Vulnerability Scanning

### CI Pipeline Integration

```yaml
# .github/workflows/ci.yml — Security scanning job
security-scan:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    # Dashboard dependency audit
    - name: Audit dashboard dependencies
      working-directory: dashboard
      run: npm audit --audit-level=high --omit=dev
      continue-on-error: false  # Fail CI on high/critical vulnerabilities

    # Bridge server has zero npm deps — skip npm audit
    - name: Verify bridge has no dependencies
      run: |
        DEPS=$(node -e "const p=require('./article-engine-plugin/package.json'); console.log(Object.keys(p.dependencies || {}).length)")
        if [ "$DEPS" != "0" ]; then
          echo "ERROR: Bridge server must have zero npm dependencies"
          exit 1
        fi

    # Secret scanning
    - name: Scan for secrets
      uses: gitleaks/gitleaks-action@v2
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

    # Node.js version check
    - name: Verify Node.js LTS
      run: |
        NODE_VERSION=$(node -v)
        echo "Node.js version: $NODE_VERSION"
        # Ensure LTS version (even major number)
        MAJOR=$(echo $NODE_VERSION | cut -d. -f1 | tr -d v)
        if [ $((MAJOR % 2)) -ne 0 ]; then
          echo "WARNING: Non-LTS Node.js version detected"
        fi
```

### Pre-Commit Hook (Gitleaks)

```bash
#!/usr/bin/env bash
# .git/hooks/pre-commit — Secret scanning
# Requires: gitleaks installed (brew install gitleaks / go install)

if command -v gitleaks &> /dev/null; then
  gitleaks protect --staged --verbose
  if [ $? -ne 0 ]; then
    echo "ERROR: gitleaks detected potential secrets in staged files."
    echo "If this is a false positive, use: git commit --no-verify"
    exit 1
  fi
else
  echo "WARNING: gitleaks not installed, skipping secret scan"
fi
```

### Gitleaks Configuration

```toml
# .gitleaks.toml
title = "ChainIQ Secret Scanning"

[allowlist]
  paths = [
    '''\.env\.example''',
    '''dev_docs/''',
    '''docs/SECURITY\.md''',
  ]

[[rules]]
  id = "supabase-service-role"
  description = "Supabase Service Role Key"
  regex = '''eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}'''
  tags = ["key", "supabase"]

[[rules]]
  id = "generic-api-key"
  description = "Generic API Key"
  regex = '''(?i)(api[_-]?key|apikey|secret[_-]?key)\s*[:=]\s*['\"][A-Za-z0-9_-]{20,}['\"]'''
  tags = ["key", "generic"]
```

---

## 6. Error Response Sanitization

### Production Error Responses

```javascript
/**
 * Send error response with appropriate detail level.
 * Production: generic messages only.
 * Development: includes stack trace and internal details.
 */
function sendError(res, status, message, internalError = null) {
  const isProd = process.env.NODE_ENV === 'production';
  const requestId = res.getHeader('X-Request-ID');

  const response = {
    error: true,
    message: isProd ? sanitizeErrorMessage(message) : message,
    requestId,
  };

  if (!isProd && internalError) {
    response.internal = {
      message: internalError.message,
      stack: internalError.stack,
    };
  }

  // Log full error server-side regardless of what we send to client
  if (status >= 500) {
    logger.error('Server error', {
      status,
      message,
      requestId,
      error: internalError?.stack,
    });
  }

  json(res, status, response);
}

// Map internal errors to safe external messages
const SAFE_MESSAGES = {
  'Database error': 'An internal error occurred. Please try again.',
  'Supabase error': 'An internal error occurred. Please try again.',
  'Subprocess failed': 'The operation could not be completed. Please try again.',
};

function sanitizeErrorMessage(message) {
  for (const [pattern, safe] of Object.entries(SAFE_MESSAGES)) {
    if (message.includes(pattern)) return safe;
  }
  return message; // Return as-is if no sensitive pattern detected
}
```
