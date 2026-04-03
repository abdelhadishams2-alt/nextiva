# INFRA-001: Git Init + Quick Wins

> **Phase:** 0 | **Priority:** P0 | **Status:** NOT STARTED
> **Effort:** S (2h) | **Type:** fix
> **Backlog Items:** T1-01, T1-12, T1-14, T1-17
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `dev_docs/audit/enhance-audit-architecture.md` — version inconsistency
3. `package.json` — version 4.6.6
4. `plugin.json` or `.claude-plugin/plugin.json` — version 4.6.8
5. `skills/article-engine/SKILL.md` — references v4.5
6. `bridge/server.js` — sync fs calls, 409 response handling
7. `dev_docs/enhancement-backlog.md` — quick win items
8. `.env.example` — if created by SEC-001

## Objective
Initialize git repository with proper .gitignore, fix version inconsistency across 3 files, add Retry-After header to 409 responses, and replace sync fs calls with async equivalents.

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `.gitignore` | Ignore node_modules, .env, .auth-session.json, .supabase-admin.json |
| MODIFY | `package.json` | Set version to 1.0.0-alpha (ChainIQ rebrand) |
| MODIFY | `.claude-plugin/plugin.json` | Set version to 1.0.0-alpha |
| MODIFY | `skills/article-engine/SKILL.md` | Update version references |
| MODIFY | `bridge/server.js` | Add Retry-After header to 409 responses |
| MODIFY | `bridge/server.js` | Replace fs.readFileSync/writeFileSync with fs.promises |

## Sub-tasks

### Sub-task 1: Git init + .gitignore (~30m)
- `git init`
- Create `.gitignore` with: `node_modules/`, `.env`, `.env.local`, `.auth-session.json`, `.supabase-admin.json`, `*.log`, `.DS_Store`, `Thumbs.db`
- Initial commit with all existing files

### Sub-task 2: Fix version inconsistency (~15m)
- Set all version references to `1.0.0-alpha`
- package.json, plugin.json, and any version strings in SKILL.md

### Sub-task 3: Add Retry-After header (~15m)
- In server.js, when returning 409 (edit in progress), add `Retry-After: 30` header
- Return in response body: `{ error: "Edit in progress", retryAfter: 30 }`

### Sub-task 4: Replace sync fs calls (~1h)
- Find all `fs.readFileSync`, `fs.writeFileSync`, `fs.existsSync` in request handlers
- Replace with `await fs.promises.readFile`, `await fs.promises.writeFile`, `await fs.promises.access`
- Ensure handler functions are `async`
- Keep sync calls in startup code only (acceptable there)

## Acceptance Criteria
- [ ] Git repository initialized with clean .gitignore
- [ ] Initial commit contains all project files
- [ ] All 3 version references are consistent (1.0.0-alpha)
- [ ] 409 responses include Retry-After header
- [ ] No synchronous fs calls in HTTP request handlers
- [ ] Bridge server starts and functions correctly after changes
