# DOC-001: Core Documentation

> **Phase:** 0 | **Priority:** P0 | **Status:** NOT STARTED
> **Effort:** M (4h) | **Type:** document
> **Backlog Items:** T1-08, T1-09, T1-10, T1-11
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `dev_docs/audit/enhance-audit-docs.md` — documentation gaps
3. `bridge/server.js` — all 12 endpoints for API docs
4. `bridge/supabase-client.js` — admin config requirements
5. `supabase-setup.sql` — database schema
6. `dev_docs/services/auth-bridge.md` — endpoint reference
7. `package.json` — project metadata
8. `chainiq.md` — product overview

## Objective
Write the 4 essential documents that unblock team handoff and developer onboarding: README.md, BRIDGE-API.md (12 endpoints), SETUP-ADMIN.md (admin configuration), and .env.example.

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `README.md` | Project overview, quick start, architecture diagram |
| CREATE | `docs/BRIDGE-API.md` | API reference for all 12 bridge endpoints |
| CREATE | `docs/SETUP-ADMIN.md` | Admin configuration guide |
| CREATE | `.env.example` | Environment variable template (if not created by SEC-001) |

## Sub-tasks

### Sub-task 1: README.md (~1.5h)
- Project name, one-line description, status badges
- Quick Start: prerequisites, install, configure, run
- Architecture overview (text + ASCII diagram of 4-agent pipeline)
- Link to BRIDGE-API.md, SETUP-ADMIN.md
- Development section: how to run bridge server, run tests
- License placeholder

### Sub-task 2: BRIDGE-API.md (~1.5h)
- Document all 12 endpoints from `bridge/server.js`
- For each endpoint: method, path, auth required, request body, response format, error codes
- Include curl examples for common operations
- Note rate limiting behavior

### Sub-task 3: SETUP-ADMIN.md (~0.5h)
- How to configure Supabase (URL, keys)
- How to set up environment variables
- How to run the SQL setup script
- How to create the first admin user
- Troubleshooting common setup issues

### Sub-task 4: .env.example (~0.5h)
- All required environment variables with descriptions
- Example values (not real keys)
- Comments explaining each variable's purpose

## Acceptance Criteria
- [ ] README.md exists with working quick start instructions
- [ ] BRIDGE-API.md documents all 12 endpoints with examples
- [ ] SETUP-ADMIN.md covers end-to-end admin setup
- [ ] .env.example lists all required variables
- [ ] A new developer can set up and run the project from docs alone
