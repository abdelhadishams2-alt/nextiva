# INT-009: Generation Trigger API & SSE Progress

**Type:** API
**Effort:** L (7h)
**Priority:** P1
**Dependencies:** INT-002, INT-003, INT-004
**Sprint:** S12

## Description

Build the article generation trigger endpoint and real-time progress streaming via Server-Sent Events. The dashboard's "New Article" button will use this to launch the full pipeline and show live progress.

## Context Header

- `bridge/server.js` — add generation endpoint
- `bridge/supabase-client.js` — quota check before generation
- `bridge/key-manager.js` — key resolution before subprocess
- `dev_docs/phase-3-plan.md` — Streams D1 + D2

## Acceptance Criteria

- [ ] `POST /api/generate` endpoint: accepts topic, language, framework, image_count, domain_hint, project_dir
- [ ] Validates quota via `checkQuota(userId, 'generate')` before queuing
- [ ] Resolves API keys via key-manager before subprocess spawn
- [ ] Merges user settings + auto-config + request overrides into unified config
- [ ] Enqueues job via existing JobQueue system
- [ ] Returns immediate response: `{ job_id, status: "queued", estimated_time }`
- [ ] Enhanced `GET /api/queue/job/:id/progress` SSE endpoint with structured events
- [ ] SSE events: `progress` (step, total, phase description, percent), `complete` (article_id, file_path, word_count), `error` (message, step)
- [ ] Job spawns Claude CLI with full config as environment variables
- [ ] Quota decremented only on successful completion (not on failure)
- [ ] Tests: generation trigger with quota check, SSE event format, quota enforcement at limit, key resolution
- [ ] Rate limiting: max 2 concurrent generations per user
