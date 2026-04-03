# ChainIQ — Testing Gates

> **Last Updated:** 2026-03-28
> **Applies to:** Phase boundaries and pre-release checkpoints

---

## Gate 1: Pre-Phase Start

Before starting any new phase, verify:

| Check | Command | Pass Criteria |
|-------|---------|--------------|
| All existing tests pass | `npm test` | 0 failures |
| No regressions from previous phase | `npm test 2>&1 \| grep "fail"` | Empty output |
| STATUS.md up to date | Manual check | Current phase and task visible |
| handoff.md up to date | Manual check | Previous phase summarized |

## Gate 2: Pre-Task Completion

Before marking any task as Done:

| Check | Command | Pass Criteria |
|-------|---------|--------------|
| New tests added for new code | Manual review | At least 1 test file per new module |
| All tests pass | `npm test` | 0 failures |
| No TODO/FIXME in new code | `grep -r "TODO\|FIXME" bridge/ engine/` | Only known items |
| Auth middleware on new endpoints | Manual review | Every endpoint has `verifyAuth()` or `requireAdmin()` |

## Gate 3: Pre-Phase Transition

Before advancing from Phase N to Phase N+1:

| Check | Pass Criteria |
|-------|--------------|
| All phase tasks in STATUS.md checked | 100% checkbox completion |
| Test count increased | More tests than phase start |
| No new P0 security findings | `grep -c "P0" dev_docs/security/findings.md` = 0 |
| Completeness dashboard updated | `dev_docs/completeness/dashboard.md` reflects current state |
| Performance within SLO | API p95 < 500ms, page load < 3s |

## Gate 4: Pre-Release

Before deploying to production:

| Check | Pass Criteria |
|-------|--------------|
| All tests pass | 228+ tests, 0 failures |
| Security audit clean | 0 P0, 0 P1 unresolved |
| RLS verified on all tables | SQL query confirms all tables have policies |
| Environment variables configured | All required vars in Coolify/deployment |
| Health check responds | `/health` returns 200 |
| Readiness check passes | `/ready` returns 200 with all deps green |
| HTTPS enforced | HSTS header present |
| CORS restrictive | No wildcard origins in production |
| Secret scanning clean | `gitleaks detect` returns 0 findings |
| User docs cover all features | DOC-INDEX.md shows no critical gaps |

---

## Test Suite Summary

| Suite | File | Tests | Covers |
|-------|------|-------|--------|
| Auth middleware | tests/auth.test.js | 14 | JWT validation, cache, admin check |
| Path validation | tests/path-validation.test.js | 14 | Traversal prevention, extension whitelist |
| Rate limiter | tests/rate-limiter.test.js | 7 | Per-IP limiting, window reset |
| Prompt guard | tests/prompt-guard.test.js | 21 | 13 injection patterns |
| Universal engine | tests/universal-engine.test.js | 59 | Language detection, RTL, framework adapters |
| Job queue | tests/job-queue.test.js | 7 | Enqueue, dequeue, serialization |
| Webhooks | tests/webhooks.test.js | 15 | HMAC signing, delivery, retry |
| Blueprint parser | tests/blueprint-parser.test.js | 12 | Component parsing, search |
| Key manager | tests/key-manager.test.js | 21 | AES-256-GCM encrypt/decrypt, rotation |
| Pipeline integration | tests/pipeline.test.js | 16 | End-to-end pipeline flow |
| Generate API | tests/generate.test.js | 13 | Generation endpoints, quota |
| Edit SSE | tests/edit-sse.test.js | 9 | SSE streaming, progress |
| Publisher hub | tests/publisher-hub.test.js | 20 | Publishing endpoints, analytics |
| **Total** | | **228** | |
