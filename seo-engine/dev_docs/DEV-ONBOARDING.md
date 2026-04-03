# ChainIQ — Developer Onboarding Guide

> **Step 18 Artifact**
> **Last Updated:** 2026-03-28
> **Audience:** Solo developer (or future team member) setting up ChainIQ for the first time

---

## 1. Prerequisites

Before you begin, ensure these are installed on your machine:

| Tool | Minimum Version | Check Command |
|------|----------------|---------------|
| Node.js | 18.0.0+ | `node --version` |
| Git | 2.30+ | `git --version` |
| Claude Code CLI | Latest | `claude --version` |
| Supabase Account | Free tier OK | https://supabase.com/dashboard |

Optional but recommended:

| Tool | Purpose |
|------|---------|
| VS Code | Primary editor |
| Coolify | Self-hosted deployment (production) |
| Hetzner VPS | Production hosting |

---

## 2. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/emrankelany-oss/article-engine.git
cd article-engine

# Verify Node.js version
node --version   # Must be >= 18.0.0

# Copy the environment template
cp .env.example .env

# Open .env in your editor and fill in values (see Section 3)
```

There are zero npm dependencies. No `npm install` step is needed. The entire project runs on Node.js built-ins and native `fetch`.

---

## 3. Environment Variable Configuration

Open `.env` and fill in each variable. Here is the complete list from `.env.example`:

### Required Variables

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard > Settings > API |
| `SUPABASE_ANON_KEY` | Public anon key (safe for client-side, RLS-protected) | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key (bypasses RLS, NEVER expose to client) | Supabase Dashboard > Settings > API |
| `BRIDGE_PORT` | Bridge server port (default: `19847`) | Set to `19847` unless port is in use |
| `ENCRYPTION_KEY` | 32-byte hex key for AES-256-GCM | Generate with command below |

Generate your encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### OAuth Variables (Phase 5 — not required yet)

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 |
| `GOOGLE_CLIENT_SECRET` | Same location as above |
| `GOOGLE_REDIRECT_URI` | Default: `http://localhost:19847/api/connections/google/callback` |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `SEMRUSH_API_KEY` | Semrush API key (Phase 6) |
| `AHREFS_API_TOKEN` | Ahrefs API token (Phase 6) |
| `DASHBOARD_URL` | Next.js dashboard URL (default: `http://localhost:3000`) |

### Production-Only Variables (set in Coolify, never locally)

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `BRIDGE_HOST` | `0.0.0.0` |
| `CORS_ORIGIN` | `https://dashboard.chainiq.io` |

---

## 4. Database Setup (Supabase)

### Create a Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **New Project**
3. Choose organization, name it `chainiq` (or similar)
4. Set a strong database password (store it securely)
5. Select the region closest to your users (for MENA: `eu-central-1` or `me-south-1`)
6. Click **Create new project** and wait for provisioning

### Run the Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Open the file `supabase-setup.sql` from the project root
3. Paste the entire contents into the SQL Editor
4. Click **Run** to create all tables, RLS policies, and functions

The schema creates tables for users, articles, jobs, webhooks, API keys, settings, audit logs, and more. RLS policies are included and will be active immediately.

### Grab Your Keys

1. Go to **Settings > API** in your Supabase Dashboard
2. Copy the **URL**, **anon key**, and **service_role key**
3. Paste them into your `.env` file

**Security warning:** The `service_role` key bypasses all RLS policies. Never expose it to the client, never commit it to git, never write it to a file. Environment variables only.

---

## 5. Key File Map

These are the files you must understand before writing any code:

| File | Purpose | Read When |
|------|---------|-----------|
| `CLAUDE.md` | AI agent instruction file — identity, rules, architecture, conventions | Every session start |
| `dev_docs/STATUS.md` | Current task dashboard — what's done, what's next, test counts | Every session start |
| `dev_docs/handoff.md` | Session context — what happened last session, blockers, next steps | Every session start |
| `dev_docs/PROTECTION-LIST.md` | Files that must NOT be modified without explicit approval | Before editing any core file |
| `dev_docs/orchestrator-state.json` | Master Kit state machine — tracks step progress | Orchestrator operations |
| `dev_docs/enhancement-backlog.md` | 52-item prioritized work plan across 3 tiers | When picking next task |
| `dev_docs/ARCH-ANCHOR.md` | Architecture snapshot — primary recovery document | When context is lost |
| `package.json` | Project metadata — scripts, version, zero deps | Reference |

### Architecture Overview

```
article-engine-plugin/
  skills/article-engine/SKILL.md    -- 20-step pipeline orchestrator
  agents/                           -- 4-agent pipeline (core IP)
    project-analyzer.md
    research-engine.md
    article-architect.md
    draft-writer.md
  bridge/                           -- HTTP server + auth
    server.js                       -- localhost:19847, 48 endpoints
    supabase-client.js              -- Supabase Auth + Admin SDK
    key-manager.js                  -- AES-256-GCM key encryption
    prompt-guard.js                 -- Prompt injection defense
  config/                           -- Engine configuration
    structural-component-registry.md  -- 193 blueprints (PROTECTED)
    engine-config.md
  dashboard/                        -- Next.js 16 + shadcn/ui
  dev_docs/                         -- All planning & documentation
  tests/                            -- 228 tests via node:test
```

---

## 6. First-Task Walkthrough

Follow this exact sequence for your first contribution:

### Step 1: Read the Status

```bash
# Read current project status
cat dev_docs/STATUS.md
```

Look at the **Sprint Calendar** section. Find the first task with status `NOT STARTED` in the current sprint.

### Step 2: Read the Task File

Task files live in `dev_docs/tasks/`. Each task file contains:
- Acceptance criteria
- Estimated hours
- Dependencies
- Named tests to write

### Step 3: Read Related Specs

Check `dev_docs/services/` and `dev_docs/screens/` for the relevant service and screen specs. These contain detailed API contracts, data flows, and UI requirements.

### Step 4: Code

Follow these conventions:
- Zero npm dependencies — use Node.js built-ins only
- Async I/O only (`await fs.promises.*`, never `fs.*Sync`)
- All endpoints return `{ success: true, data }` or `{ error, message }`
- Auth check first: `const user = await verifyAuth(req)`
- Path validation: multi-layer, no `..`, no absolute, extension whitelist

### Step 5: Test

```bash
# Run all 228 tests
npm test

# Run a specific test file
node --test tests/your-new-test.test.js
```

Write tests using `node:test` (built-in, zero dependencies):

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Your Feature', () => {
  it('should do the expected thing', () => {
    assert.strictEqual(actual, expected);
  });
});
```

### Step 6: Update State Files

After completing work, update these three files:
1. `dev_docs/STATUS.md` — mark task as done, update test count
2. `dev_docs/handoff.md` — describe what was done, what's next
3. `dev_docs/orchestrator-state.json` — advance step if applicable

---

## 7. AI Agent Workflow

ChainIQ is built with Claude Code as the primary development tool. Here is the session protocol:

### Starting a Session (`/kickoff`)

The `/kickoff` command reads project state and presents a ready-to-code briefing. It reads:
1. `dev_docs/orchestrator-state.json` — state machine position
2. `dev_docs/handoff.md` — last session context
3. `dev_docs/STATUS.md` — current progress
4. `dev_docs/enhancement-backlog.md` — prioritized work

**Rule: Read a maximum of 6 files before you start coding** (anti-context-rot).

### During a Session

- Work on one task at a time
- Write tests for every new feature
- Run `npm test` before considering work complete
- Follow the PROTECT LIST — do not modify protected files without approval
- Check perspective checklist before finalizing user-facing changes (publisher, security, universality, RTL, solo-dev)

### Ending a Session (`/session-end`)

Before ending any session, update these files:
1. **`dev_docs/STATUS.md`** — mark completed items, update test counts, note blockers
2. **`dev_docs/handoff.md`** — write what was done, what's next, any decisions made
3. **`dev_docs/orchestrator-state.json`** — advance step counters if gates were passed

This ensures the next session (whether same day or weeks later) can pick up exactly where you left off with full context.

### Session Protocol Enforcement

- Max 6 files read before coding starts
- Every feature must include `node:test` tests
- Security-critical paths require test coverage before any other work
- Protected files require explicit approval before modification
- Tier 1 (security/tests/docs) before Tier 2 (dashboard/universal) before Tier 3 (polish)

---

## 8. Verification Checklist

After completing setup, verify everything works:

```bash
# 1. Bridge server starts without errors
npm run bridge
# Expected: "ChainIQ bridge server listening on http://localhost:19847"

# 2. Health endpoint responds
curl http://localhost:19847/health
# Expected: {"status":"ok","version":"1.0.0-alpha",...}

# 3. All tests pass
npm test
# Expected: 228 tests passing

# 4. Dashboard starts (if working on dashboard)
cd dashboard && npm run dev
# Expected: Next.js dev server on http://localhost:3000
```

If any of these fail, check `dev_docs/TROUBLESHOOTING.md` for the 10 most common issues and their solutions.
