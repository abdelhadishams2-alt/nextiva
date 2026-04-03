# ChainIQ — Environment Configuration Guide

> **Step 18 Artifact**
> **Last Updated:** 2026-03-28
> **Purpose:** Complete environment setup for development, staging, and production

---

## 1. Environment Overview

ChainIQ runs across three environments. Each serves a distinct purpose in the development lifecycle:

| Environment | Purpose | Infrastructure | URL Base |
|-------------|---------|---------------|----------|
| **Development** | Local coding and testing | Your machine | `localhost` |
| **Staging** | Pre-production validation | Hetzner VPS (staging) | `staging.chainiq.io` |
| **Production** | Live customer-facing service | Hetzner VPS + Cloudflare | `chainiq.io` |

### Architecture per Environment

```
Development:
  Bridge Server ─── localhost:19847
  Dashboard    ─── localhost:3000
  Supabase     ─── hosted (supabase.co)
  Database     ─── Supabase PostgreSQL (dev project)

Staging:
  Bridge Server ─── staging-api.chainiq.io (Coolify container)
  Dashboard    ─── staging.chainiq.io (Coolify container)
  Supabase     ─── hosted (supabase.co, staging project)
  Database     ─── Supabase PostgreSQL (staging project)
  Reverse Proxy── Caddy (via Coolify)

Production:
  Bridge Server ─── api.chainiq.io (Coolify container)
  Dashboard    ─── dashboard.chainiq.io (Coolify container)
  Supabase     ─── hosted (supabase.co, production project)
  Database     ─── Supabase PostgreSQL (production project)
  CDN/WAF      ─── Cloudflare (DNS, SSL, caching, WAF rules)
  Reverse Proxy── Caddy (via Coolify)
```

---

## 2. Development Environment

### Setup

```bash
# 1. Clone and enter the project
git clone https://github.com/emrankelany-oss/article-engine.git
cd article-engine

# 2. Copy environment template
cp .env.example .env

# 3. Fill in .env with development values (see table below)

# 4. Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 5. Start the bridge server
npm run bridge

# 6. Start the dashboard (separate terminal)
cd dashboard && npm install && npm run dev

# 7. Verify everything works
curl http://localhost:19847/health
npm test
```

### Development `.env` Values

```env
# Supabase — use your DEV project (separate from staging/prod)
SUPABASE_URL=https://your-dev-project.supabase.co
SUPABASE_ANON_KEY=eyJ...dev-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...dev-service-role-key...

# Bridge server
BRIDGE_PORT=19847

# Encryption
ENCRYPTION_KEY=<your-generated-32-byte-hex-key>

# OAuth (only needed when working on Phase 5)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_REDIRECT_URI=http://localhost:19847/api/connections/google/callback

# Dashboard
DASHBOARD_URL=http://localhost:3000

# Development mode (implicit — NODE_ENV is unset locally)
```

### Development-Specific Behavior

- **CORS:** Wildcard `Access-Control-Allow-Origin: *` is allowed for localhost
- **Rate limiting:** In-memory only, resets on server restart (no Redis needed)
- **Auth caching:** In-memory, short TTL
- **Logging:** Console output, no file rotation
- **Supabase:** Use a dedicated dev project. Never share credentials with staging or production.

---

## 3. Staging Environment

### Infrastructure

- **Host:** Hetzner VPS (CX21 or CX31 — 2-4 vCPU, 4-8 GB RAM)
- **Deployment:** Coolify (self-hosted PaaS)
- **Reverse proxy:** Caddy (auto-TLS via Coolify)
- **DNS:** Cloudflare (staging subdomain)

### Staging `.env` Values

```env
# Supabase — SEPARATE staging project
SUPABASE_URL=https://your-staging-project.supabase.co
SUPABASE_ANON_KEY=eyJ...staging-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...staging-service-role-key...

# Bridge server — bind to all interfaces for container networking
BRIDGE_PORT=19847
BRIDGE_HOST=0.0.0.0
NODE_ENV=staging

# Encryption — DIFFERENT key from dev and prod
ENCRYPTION_KEY=<staging-specific-32-byte-hex-key>

# OAuth — use staging redirect URI
GOOGLE_CLIENT_ID=<same-or-different-google-client-id>
GOOGLE_CLIENT_SECRET=<same-or-different-google-client-secret>
GOOGLE_REDIRECT_URI=https://staging-api.chainiq.io/api/connections/google/callback

# CORS — restrict to staging dashboard only
CORS_ORIGIN=https://staging.chainiq.io

# Dashboard
DASHBOARD_URL=https://staging.chainiq.io
```

### Staging-Specific Behavior

- **CORS:** Restricted to `https://staging.chainiq.io` only
- **Rate limiting:** Same as production (strict limits by tier)
- **Logging:** Structured JSON, written to stdout (Coolify captures it)
- **Database:** Separate Supabase project — seed with test data, never production data
- **TLS:** Auto-provisioned by Caddy via Coolify
- **Purpose:** Validate deployments, test OAuth flows with real Google credentials, verify database migrations before production

---

## 4. Production Environment

### Infrastructure

- **Host:** Hetzner VPS (CX31 or CX41 — 4-8 vCPU, 8-16 GB RAM)
- **Deployment:** Coolify (self-hosted PaaS)
- **CDN/WAF:** Cloudflare (proxy mode, SSL Full Strict, WAF rules)
- **Reverse proxy:** Caddy (auto-TLS via Coolify, behind Cloudflare)
- **DNS:** Cloudflare (authoritative nameservers)
- **Monitoring:** Coolify health checks + Cloudflare analytics

### Production `.env` Values

```env
# Supabase — PRODUCTION project
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_ANON_KEY=eyJ...prod-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...prod-service-role-key...

# Bridge server — production mode
BRIDGE_PORT=19847
BRIDGE_HOST=0.0.0.0
NODE_ENV=production

# Encryption — UNIQUE production key, rotated quarterly
ENCRYPTION_KEY=<production-specific-32-byte-hex-key>

# OAuth — production redirect URI
GOOGLE_CLIENT_ID=<production-google-client-id>
GOOGLE_CLIENT_SECRET=<production-google-client-secret>
GOOGLE_REDIRECT_URI=https://api.chainiq.io/api/connections/google/callback

# CORS — restrict to production dashboard only
CORS_ORIGIN=https://dashboard.chainiq.io

# Dashboard
DASHBOARD_URL=https://dashboard.chainiq.io
```

### Production-Specific Behavior

- **CORS:** Restricted to `https://dashboard.chainiq.io` only
- **Rate limiting:** Strict per-endpoint limits by subscription tier (Starter/Professional/Enterprise)
- **Logging:** Structured JSON, stdout captured by Coolify, retained 90 days
- **Security headers:** Full production set — CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- **Cloudflare WAF:** Active rules for SQL injection, XSS, bot protection
- **SSL:** Cloudflare SSL Full (Strict) — end-to-end encryption
- **Health checks:** Coolify pings `/health` every 30 seconds, restarts container on 3 consecutive failures

---

## 5. Environment Variable Differences Matrix

| Variable | Development | Staging | Production |
|----------|-------------|---------|------------|
| `NODE_ENV` | *(unset)* | `staging` | `production` |
| `BRIDGE_HOST` | *(unset / 127.0.0.1)* | `0.0.0.0` | `0.0.0.0` |
| `CORS_ORIGIN` | *(unset / wildcard)* | `https://staging.chainiq.io` | `https://dashboard.chainiq.io` |
| `SUPABASE_URL` | Dev project | Staging project | Production project |
| `ENCRYPTION_KEY` | Dev key | Staging key (different) | Prod key (different, rotated quarterly) |
| `GOOGLE_REDIRECT_URI` | `http://localhost:19847/...` | `https://staging-api.chainiq.io/...` | `https://api.chainiq.io/...` |
| Security headers | Relaxed | Full | Full |
| Rate limiting | In-memory, lenient | Full, in-memory | Full, Redis-backed (planned) |
| CORS mode | Wildcard | Allowlist | Allowlist |
| TLS | None (localhost) | Caddy auto-TLS | Cloudflare Full Strict + Caddy |

**Critical rule:** Each environment MUST use its own Supabase project and its own encryption key. Never share credentials across environments.

---

## 6. Coolify Deployment Settings

Coolify is the self-hosted PaaS that manages containers on Hetzner VPS instances.

### Bridge Server Container

```yaml
# Coolify Service Configuration
name: chainiq-bridge
type: Docker
source: GitHub (article-engine repo)
branch: main (production) / staging (staging)
dockerfile: Dockerfile

# Build settings
build_command: ""   # No build step — zero deps
start_command: "node bridge/server.js"
health_check_path: /health
health_check_interval: 30

# Resource limits
cpu_limit: 2
memory_limit: 2048   # 2 GB
swap_limit: 512

# Environment variables
# Set ALL .env variables in Coolify's environment section
# NEVER commit .env files to the repository

# Ports
expose: 19847
```

### Dashboard Container

```yaml
# Coolify Service Configuration
name: chainiq-dashboard
type: Docker
source: GitHub (article-engine repo, dashboard/ directory)
branch: main (production) / staging (staging)
dockerfile: dashboard/Dockerfile

# Build settings
build_command: "npm run build"
start_command: "npm start"
health_check_path: /
health_check_interval: 30

# Resource limits
cpu_limit: 2
memory_limit: 2048   # 2 GB

# Environment variables (Next.js public vars)
NEXT_PUBLIC_SUPABASE_URL=<supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_BRIDGE_URL=https://api.chainiq.io

# Ports
expose: 3000
```

### Deployment Flow

```
Developer pushes to GitHub
       |
       v
Coolify detects push (webhook)
       |
       v
Coolify builds Docker image
       |
       v
Coolify runs health check
       |
       v
Coolify swaps container (zero-downtime)
       |
       v
Coolify reports status
```

### Coolify Network Setup

1. **Internal network:** Bridge and dashboard containers communicate via Coolify's Docker network
2. **External access:** Caddy reverse proxy handles TLS and routes `api.chainiq.io` to bridge, `dashboard.chainiq.io` to dashboard
3. **Cloudflare (production only):** DNS A record points to Hetzner VPS IP, proxy mode enabled, SSL Full Strict

---

## 7. Database Management Across Environments

### Separate Supabase Projects

| Environment | Supabase Project | Data |
|-------------|-----------------|------|
| Development | `chainiq-dev` | Test/seed data, can be wiped freely |
| Staging | `chainiq-staging` | Realistic test data, migration testing |
| Production | `chainiq-prod` | Real customer data, backups enabled |

### Migration Strategy

Migrations are versioned SQL files in `bridge/migrations/`:

```bash
# Apply a migration (run in Supabase SQL Editor or via CLI)
# 1. Test on dev first
# 2. Apply to staging, verify
# 3. Apply to production

# Migration file naming
bridge/migrations/
  001_initial_schema.sql
  002_add_job_queue.sql
  003_add_api_keys.sql
  ...
```

**Rule:** Never run a migration in production that hasn't been validated in staging first. Every migration file includes a rollback section at the bottom.

---

## 8. Secrets Management

| Rule | Details |
|------|---------|
| Never commit `.env` | Listed in `.gitignore` |
| Never share keys across environments | Each env has its own Supabase project + encryption key |
| Rotate production encryption key quarterly | Generate new key, re-encrypt all API keys via key-manager |
| Store production secrets in Coolify only | Environment variables section in Coolify dashboard |
| Never log secrets | `prompt-guard.js` and `logger.js` redact sensitive values |
| service_role key = admin access | Treat with same care as a database root password |

---

## 9. Environment Verification Commands

Run these after setting up any environment:

```bash
# Development
npm run bridge                          # Bridge starts on :19847
curl http://localhost:19847/health      # Returns {"status":"ok",...}
npm test                                # 228 tests pass

# Staging (from your machine)
curl https://staging-api.chainiq.io/health
curl https://staging.chainiq.io         # Dashboard loads

# Production (from your machine)
curl https://api.chainiq.io/health
curl https://dashboard.chainiq.io       # Dashboard loads
```
