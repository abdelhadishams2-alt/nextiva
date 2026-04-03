# INFRA-002: Logging + CI/CD + Prompt Guard + Versioning

> **Phase:** 1 | **Priority:** P1 | **Status:** NOT STARTED
> **Effort:** XL (12h) | **Type:** gap
> **Backlog Items:** T2-16, T2-17, T2-18, T2-19, T2-20, T2-21, T2-22
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `dev_docs/audit/enhance-audit-security.md` — prompt injection risk
3. `dev_docs/audit/enhance-audit-performance.md` — image optimization
4. `dev_docs/services/auth-bridge.md` — security event requirements
5. `dev_docs/services/analytics.md` — analytics event model
6. `bridge/server.js` — current console.log usage, edit handler
7. `agents/draft-writer.md` — image generation output
8. `package.json` — scripts to add

## Objective
Add structured logging, security event logging, CI/CD pipeline, prompt injection guard, content versioning, and image optimization. These are the infrastructure items that make ChainIQ production-ready.

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `bridge/logger.js` | Structured JSON logger with levels and request IDs |
| CREATE | `bridge/prompt-guard.js` | Sanitize Claude CLI instruction patterns |
| CREATE | `.github/workflows/ci.yml` | GitHub Actions for lint, test, build |
| MODIFY | `bridge/server.js` | Replace console.log with structured logger, add security events |
| MODIFY | `bridge/server.js` | Add prompt guard before Claude CLI subprocess spawn |
| MODIFY | `agents/draft-writer.md` | Add loading="lazy" to images, WebP conversion notes |

## Sub-tasks

### Sub-task 1: Structured logging (~3h)
- Create `bridge/logger.js`: JSON-formatted output with timestamp, level, request_id, message, data
- Log levels: debug, info, warn, error
- Request ID: generate UUID per request, propagate through all log entries
- Replace all `console.log` in server.js with logger calls
- Security event logging: failed_auth, admin_action, traversal_attempt, prompt_injection_attempt

### Sub-task 2: CI/CD pipeline (~2h)
- Create `.github/workflows/ci.yml`
- Steps: checkout → setup Node 24 → npm install → npm test → npm run lint (if exists)
- Run on: push to main, pull requests
- Add status badge to README

### Sub-task 3: Prompt injection guard (~3h)
- Create `bridge/prompt-guard.js`
- Patterns to detect and sanitize:
  - `You are now...`, `Ignore previous instructions`, `System prompt:`
  - Claude-specific: `<system>`, `<human>`, `<assistant>` tags
  - Instruction overrides: `IMPORTANT:`, `CRITICAL:`, `OVERRIDE:`
- Sanitize by escaping or removing detected patterns
- Log injection attempts as security events
- Integrate into /apply-edit before subprocess spawn

### Sub-task 4: Content versioning (~2h)
- On each successful edit via /apply-edit:
  - Read current article content
  - Calculate word count delta
  - Insert into article_versions table
  - Increment version_number
- Add GET /api/articles/:id/versions endpoint
- Add POST /api/articles/:id/rollback endpoint

### Sub-task 5: Image optimization (~2h)
- Add `loading="lazy"` attribute to all `<img>` tags in draft-writer output
- Add `decoding="async"` attribute
- Document WebP conversion strategy (Phase 2 — requires sharp or similar)
- Add `width` and `height` attributes where possible

## Acceptance Criteria
- [ ] All log output is structured JSON with request IDs
- [ ] Security events logged for failed auth, admin actions, traversal attempts
- [ ] GitHub Actions CI runs tests on push and PR
- [ ] Prompt injection patterns detected and sanitized before Claude CLI
- [ ] Injection attempts logged as security events
- [ ] Article edits create version records in Supabase
- [ ] Version rollback restores article to previous state
- [ ] Images have `loading="lazy"` and `decoding="async"` attributes
- [ ] No `console.log` statements remain in bridge server code

## Dependencies
- Blocked by: SEC-001, TEST-001 (security + tests must exist first)
- Blocks: Phase 2 polish
