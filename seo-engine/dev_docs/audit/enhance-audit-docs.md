# Audit: Documentation & Ops

> **App:** article-engine (ChainIQ)
> **Dimension:** E1-F
> **Date:** 2026-03-26
> **Rounds completed:** 3/3

---

## Score: 3/10 — Critical

Internally documented at the AI-agent level (agents know what to do) but zero human-facing operational documentation. A new developer cannot deploy, operate, or debug without reading all source code.

---

## Round 1 Findings (Surface Scan)

### README
**No README exists** at the plugin root. A developer who receives this directory sees `package.json`, `bridge/`, `agents/`, `skills/`, `config/` with no entry point document.

### API Reference
**None.** The bridge server exposes 12 HTTP endpoints:
- `GET /health`, `POST /auth/signup`, `POST /auth/login`, `GET /auth/verify`
- `GET /admin/users`, `POST /admin/approve`, `POST /admin/revoke`, `POST /admin/delete`, `POST /admin/add-user`, `GET /admin/usage`
- `POST /apply-edit`
- _(404 catch-all)_

No Markdown, OpenAPI/Swagger, or JSDoc documentation for any of these.

### Deployment/Installation Guide
`setup.sh` handles Gemini MCP config only. Full installation requires 6 steps, but only step 2 is documented:
1. Copy plugin to `.claude/plugins/article-engine/`
2. Run `setup.sh` (documented in setup.sh comments)
3. Run `supabase-setup.sql` in Supabase dashboard
4. Promote first user to admin via SQL
5. Configure `.supabase-admin.json` with service-role key — **NOT DOCUMENTED ANYWHERE**
6. Start bridge via `/start-bridge`

### Environment Variables
**No `.env.example`** file. Undocumented env vars:
- `BRIDGE_PORT` — overrides default 19847
- `GEMINI_API_KEY` — Gemini MCP
- `HOME`/`USERPROFILE` — locates `~/.claude.json`
- `CLAUDECODE` — deleted on bridge startup

### CHANGELOG
**None.** Version numbers in 4 places with discrepancies: `package.json` (4.6.6), `plugin.json` (4.6.8), `.claude-plugin/plugin.json` (4.6.8), `engine-config.md` (v4.5). No explanation of changes between versions.

---

## Round 2 Findings (Deep Dive)

### Monitoring/Observability
None. Bridge uses `console.log`/`console.error` to stdout/stderr. No structured logging, no log levels, no external aggregation, no metrics, no alerting, no health monitoring.

### Error Logging Context
Minimal and inconsistent:
- `[bridge] Failed to log usage: {err.message}` — no user ID, request ID, timestamp
- `[supabase] Config file missing` — no path, no calling context
- `[supabase] Failed to parse .supabase.json: {e.message}` — no stack trace

No request IDs assigned. Cannot correlate user error reports with server-side logs.

### Incident Response
None. No runbook, on-call guide, or escalation path. Undocumented scenarios:
- Supabase project deleted/rate-limited?
- Bridge crash mid-edit (activeEdit mutex stuck)?
- Claude CLI not in PATH?
- How to revoke compromised token?
- Where are database backups?

Positive: SIGTERM/SIGINT handled gracefully. EADDRINUSE shows human-readable message.

### Database Schema
**`supabase-setup.sql` is the best-documented file in the project.** Documents both tables, columns, types, defaults, RLS policies, trigger function, index rationale, and admin promotion SQL. No schema migration strategy documented.

### Developer Onboarding
No dedicated document. New developer must:
1. Read file tree to discover structure
2. Read SKILL.md (1421 lines) to understand architecture
3. Read server.js directly for bridge behavior
4. Read supabase-client.js for auth model
5. Discover `.supabase-admin.json` by inference from `.gitignore`

**Estimated time to productive: 4-8 hours reading source.** A 30-minute onboarding doc could cut this to <1 hour.

### Architecture Decisions
No ADRs. Undocumented design decisions:
- Why local bridge server vs. Claude tool call or MCP server?
- Why anon key hardcoded? (comment says "safe" but no formal rationale)
- Why global `activeEdit` mutex vs. queue?
- Why `CLAUDECODE` env var deleted on startup vs. detected and refused?
- Why service-role key is separate file? (good decision, undocumented)

---

## Round 3 Recommendations

### Most Dangerous Documentation Gap
**Missing `.supabase-admin.json` documentation.** This file enables all admin operations. Its absence is unexplained anywhere. Developer who skips it gets silent `"Admin config not available"` errors. Also: this file contains the service_role key (full database bypass) and deserves explicit security documentation.

### Auto-Generated vs. Hand-Written
**Auto-generateable:**
- Bridge API reference from JSDoc annotations
- Environment variable reference from `process.env.` grep
- Database schema docs from SQL file

**Must be hand-written:**
- README with architecture overview and quick-start
- Security model document
- Incident response runbook
- Developer onboarding guide
- Architecture decision records

### Minimum Docs for Team Handoff (5 Documents)
1. **README.md** — What it is, directory structure, prerequisites, quick-start, links
2. **BRIDGE-API.md** — 12 endpoints: method, path, auth, request/response, errors
3. **SETUP-ADMIN.md** — Supabase project creation, SQL, `.supabase-admin.json`, admin promotion
4. **SECURITY.md** — Anon key rationale, RLS, service-role risk, rate limiter limits, path traversal guards
5. **TROUBLESHOOTING.md** — 8 common failures: EADDRINUSE, CLI not found, admin config missing, auth session, Gemini MCP, edit timeout, activeEdit stuck, version mismatch

---

## P0 Issues (Fix Immediately)
- No README (developers cannot understand or set up the project)
- `.supabase-admin.json` setup undocumented (admin operations silently fail)

## P1 Issues (Fix Before Scaling)
- No API reference for 12 bridge endpoints
- No `.env.example` file
- No structured logging (can't debug production issues)
- Version number inconsistency across 4 files
- No architecture decision records
