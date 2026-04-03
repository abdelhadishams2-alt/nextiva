# TEST-001: Test Infrastructure + Critical Test Suites

> **Phase:** 0 | **Priority:** P0 | **Status:** NOT STARTED
> **Effort:** L (8h) | **Type:** fix
> **Backlog Items:** T1-04, T1-05, T1-06, T1-07
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `dev_docs/audit/enhance-audit-testing.md` — zero test coverage analysis
3. `bridge/server.js` — auth middleware (lines ~50-100), path validation, rate limiter
4. `bridge/supabase-client.js` — token verification flow
5. `dev_docs/services/auth-bridge.md` — testing strategy section
6. `package.json` — current scripts (no test script)
7. `supabase-setup.sql` — schema reference for auth tests
8. `dev_docs/enhancement-backlog.md` — T1-04 through T1-07

## Objective
Set up `node:test` infrastructure and write the 3 most critical test suites: path traversal prevention, auth middleware, and rate limiter. These cover the security-critical code paths that have never been tested.

## File Plan

| Action | Path | What |
|--------|------|------|
| MODIFY | `package.json` | Add `"test": "node --test tests/**/*.test.js"` script |
| CREATE | `tests/path-traversal.test.js` | Path traversal prevention test suite |
| CREATE | `tests/auth-middleware.test.js` | Auth middleware test suite |
| CREATE | `tests/rate-limiter.test.js` | Rate limiter test suite |
| CREATE | `tests/helpers/server.js` | Test helper to start/stop bridge server |
| CREATE | `tests/helpers/fixtures.js` | Test fixtures (mock tokens, users, paths) |

## Sub-tasks

### Sub-task 1: Test infrastructure setup (~1h)
- Add `"test"` script to package.json: `"node --test tests/**/*.test.js"`
- Create `tests/` directory with `helpers/` subdirectory
- Create `tests/helpers/server.js`: start bridge server on random port, return base URL, cleanup on test end
- Create `tests/helpers/fixtures.js`: mock user objects, valid/invalid tokens, test file paths
- Verify `npm test` runs and exits cleanly with 0 tests

### Sub-task 2: Path traversal test suite (~2h)
```javascript
// tests/path-traversal.test.js
// Test scenarios:
// 1. Normal relative path → should succeed
// 2. Path with '..' → should reject with 400
// 3. Absolute path → should reject with 400
// 4. Path with null bytes → should reject with 400
// 5. URL-encoded traversal (%2e%2e) → should reject with 400
// 6. Path outside PROJECT_DIR after resolution → should reject with 400
// 7. Valid path with unusual but safe characters → should succeed
// 8. Empty path → should reject with 400
// 9. Path to non-allowed extension → should reject with 400
// 10. Symlink traversal (if applicable) → should reject
```

### Sub-task 3: Auth middleware test suite (~2.5h)
```javascript
// tests/auth-middleware.test.js
// Test scenarios:
// 1. Valid Bearer token → should return user object
// 2. Expired token → should return 401
// 3. Malformed token (not JWT format) → should return 401
// 4. Missing Authorization header → should return 401
// 5. Wrong auth scheme (Basic instead of Bearer) → should return 401
// 6. Empty Bearer value → should return 401
// 7. Admin verification with service_role → should return admin user
// 8. Admin verification without service_role → should return 403
// 9. Rate limited request → should return 429
// 10. Token from different Supabase project → should return 401
```

### Sub-task 4: Rate limiter test suite (~1.5h)
```javascript
// tests/rate-limiter.test.js
// Test scenarios:
// 1. Under rate limit → should succeed
// 2. At rate limit → should succeed (boundary)
// 3. Over rate limit → should return 429
// 4. Different IPs → independent rate limits
// 5. Rate limit window reset → should succeed after cooldown
// 6. Rate limit response includes Retry-After header
// 7. Rate limit applies per-IP, not globally
```

## Testing Strategy

### Running Tests
```bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- tests/path-traversal.test.js  # Single suite
```

### Test Pattern
- Use `node:test` with `describe()` and `it()` blocks
- Use `node:assert` for assertions
- Start real bridge server per test file using helper
- Use `fetch()` for HTTP requests (no mocking HTTP layer)
- Clean up server after each test file

## Acceptance Criteria
- [ ] `npm test` script exists and runs successfully
- [ ] Path traversal test suite: ≥8 test cases, all passing
- [ ] Auth middleware test suite: ≥8 test cases, all passing
- [ ] Rate limiter test suite: ≥5 test cases, all passing
- [ ] Tests run in < 30 seconds total
- [ ] Tests are deterministic (no flaky tests from timing issues)
- [ ] Test helpers properly start/stop bridge server without port conflicts
- [ ] Zero external test dependencies (only node:test, node:assert)

## Dependencies
- Blocked by: SEC-001 (security fixes should be in place before testing)
- Blocks: All Phase 1 tasks (no feature work without test infrastructure)
