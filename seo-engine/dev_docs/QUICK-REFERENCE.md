# ChainIQ — Quick Reference Card

> **Step 18 Artifact**
> **Last Updated:** 2026-03-28
> **Purpose:** One-page cheat sheet for daily development

---

## Commands

### Development

| Command | Description |
|---------|-------------|
| `npm run bridge` | Start the bridge server on localhost:19847 |
| `npm test` | Run all 228 tests via `node:test` |
| `node --test tests/auth.test.js` | Run a specific test file |
| `node --test tests/**/*.test.js` | Run all tests (same as `npm test`) |
| `cd dashboard && npm run dev` | Start Next.js 16 dashboard on localhost:3000 |
| `cd dashboard && npm run build` | Production build of the dashboard |
| `cd dashboard && npm run lint` | Lint dashboard code |

### Git

| Command | Description |
|---------|-------------|
| `git status` | Check working tree status |
| `git log --oneline -10` | Recent commit history |
| `git diff` | Unstaged changes |
| `git diff --cached` | Staged changes |

### Utilities

| Command | Description |
|---------|-------------|
| `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | Generate ENCRYPTION_KEY |
| `curl http://localhost:19847/health` | Health check bridge server |
| `curl http://localhost:19847/api/articles` | List articles (requires auth) |

---

## Key URLs

| Service | URL | Notes |
|---------|-----|-------|
| Bridge Server | http://localhost:19847 | 48 endpoints, auth gateway |
| Bridge Health | http://localhost:19847/health | No auth required |
| Dashboard (dev) | http://localhost:3000 | Next.js 16 + shadcn/ui |
| Supabase Dashboard | https://supabase.com/dashboard | Database, auth, RLS |
| Supabase API | `$SUPABASE_URL` from `.env` | REST + Auth endpoints |
| GitHub Repo | https://github.com/emrankelany-oss/article-engine | Source code |

### Production URLs (once deployed)

| Service | URL |
|---------|-----|
| Dashboard | https://dashboard.chainiq.io |
| Bridge API | https://api.chainiq.io |
| Hetzner Console | https://console.hetzner.cloud |
| Coolify Panel | https://coolify.chainiq.io |
| Cloudflare DNS | https://dash.cloudflare.com |

---

## File Naming Conventions

### Source Code

| Pattern | Location | Example |
|---------|----------|---------|
| `kebab-case.js` | Bridge modules | `key-manager.js`, `prompt-guard.js` |
| `kebab-case.md` | Agent files | `project-analyzer.md`, `draft-writer.md` |
| `kebab-case.md` | Command files | `start-bridge.md`, `apply-edit.md` |
| `kebab-case.test.js` | Test files | `auth.test.js`, `path-validation.test.js` |
| `kebab-case.sql` | Database files | `supabase-setup.sql` |

### Dashboard (Next.js 16)

| Pattern | Location | Example |
|---------|----------|---------|
| `page.tsx` | Route pages | `app/articles/page.tsx` |
| `layout.tsx` | Route layouts | `app/layout.tsx` |
| `kebab-case.tsx` | Components | `components/article-card.tsx` |
| `use-kebab-case.ts` | Hooks | `hooks/use-auth.ts` |
| `kebab-case.ts` | Utilities | `lib/supabase.ts` |

### Documentation

| Pattern | Location | Example |
|---------|----------|---------|
| `UPPER-CASE.md` | Top-level docs | `STATUS.md`, `CLAUDE.md`, `PROTECTION-LIST.md` |
| `kebab-case.md` | Dev docs | `handoff.md`, `enhancement-backlog.md` |
| `sprint-XX.md` | Sprint plans | `sprint-01.md`, `sprint-next.md` |
| `DI-001-*.md` | Task files | `DI-001-oauth2-infrastructure.md` |

---

## Import Patterns

### Bridge Server (CommonJS-compatible ESM)

```javascript
// Node.js built-ins — always use these, never npm packages
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Internal modules
import { verifyAuth } from './supabase-client.js';
import { validatePath } from './path-validator.js';
import { KeyManager } from './key-manager.js';
import { PromptGuard } from './prompt-guard.js';
```

### Dashboard (Next.js 16)

```typescript
// React + Next.js
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Image from 'next/image';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Supabase client
import { createClient } from '@/lib/supabase/server';

// Internal components
import { ArticleCard } from '@/components/article-card';
```

---

## API Response Format

All bridge server endpoints follow this exact format:

```javascript
// Success
{ "success": true, "data": { /* payload */ } }

// Error
{ "error": "ErrorType", "message": "Human-readable description" }
```

HTTP status codes used:

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET/POST |
| 201 | Created | Successful resource creation |
| 400 | Bad Request | Invalid input, missing fields |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unhandled server error |

---

## Auth Flow (Quick Reminder)

```
Client → POST /auth/login { email, password }
       ← { success: true, data: { access_token, refresh_token, user } }

Client → GET /api/articles (Authorization: Bearer <access_token>)
       ← { success: true, data: [ ... ] }

Client → POST /auth/refresh { refresh_token }
       ← { success: true, data: { access_token, refresh_token } }
```

---

## Test Structure

```
tests/
  auth.test.js              -- 14 tests (auth middleware)
  path-validation.test.js   -- 14 tests (path traversal prevention)
  rate-limiter.test.js      -- 7 tests (rate limiting)
  prompt-guard.test.js      -- 21 tests (prompt injection defense)
  universal-engine.test.js  -- 59 tests (multi-lang, RTL, adapters)
  job-queue.test.js         -- 7 tests (Supabase-backed queue)
  webhooks.test.js          -- 15 tests (HMAC-SHA256, backoff)
  blueprint-parser.test.js  -- 12 tests (component registry parsing)
  key-manager.test.js       -- 21 tests (AES-256-GCM encryption)
  pipeline.test.js          -- 16 tests (pipeline integration)
  generate-api.test.js      -- 13 tests (generation endpoint)
  edit-sse.test.js          -- 9 tests (SSE progress streaming)
  publisher-hub.test.js     -- 20 tests (publisher analytics)
  Total: 228 tests
```

---

## Quick Debugging

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Bridge won't start | Missing `.env` or wrong port | Check `.env` exists, check port 19847 is free |
| 401 on all requests | Expired or missing token | Re-login, check `SUPABASE_ANON_KEY` |
| Tests fail with "fetch not defined" | Node.js < 18 | Upgrade Node.js to 18+ |
| Dashboard build fails | Missing dependencies | Run `cd dashboard && npm install` |
| "service_role key not found" | Missing env var | Set `SUPABASE_SERVICE_ROLE_KEY` in `.env` |
| CORS errors in browser | Bridge CORS config | Check `CORS_ORIGIN` env var in production |
| Path traversal rejected | `..` in file path | Use relative paths without `..` components |

For more, see `dev_docs/TROUBLESHOOTING.md` (10 common issues with full solutions).

---

## State Files (Update Before Session End)

| File | What to Update |
|------|---------------|
| `dev_docs/STATUS.md` | Mark tasks done, update test count, note blockers |
| `dev_docs/handoff.md` | What was done, what's next, decisions made |
| `dev_docs/orchestrator-state.json` | Advance step counters if gates passed |
