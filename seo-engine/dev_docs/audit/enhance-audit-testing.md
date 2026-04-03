# Audit: Testing Coverage

> **App:** article-engine (ChainIQ)
> **Dimension:** E1-E
> **Date:** 2026-03-26
> **Rounds completed:** 3/3

---

## Score: 1/10 — Critical

Zero tests exist. No test infrastructure. No CI/CD. The codebase ships to users with no automated verification of any kind.

---

## Round 1 Findings (Surface Scan)

### Test Files
Glob search for `*.test.*`, `*.spec.*`, `__tests__/`, `tests/`, `test/` returned **zero results**. No test files of any kind.

### Test Frameworks Installed
`package.json` has no `devDependencies` key. No test runner installed (no Jest, Vitest, Mocha, node:test config). The `scripts` block has only `"bridge": "node bridge/server.js"`. No `test`, `lint`, or `check` script.

### `npm test`
Would produce: `Error: Missing script: "test"`. Exits non-zero.

### CI Pipeline
No `.github/`, `.gitlab-ci.yml`, `.circleci/`, `Jenkinsfile`, or any CI config. No git history — project has never been connected to a remote repository.

### Test Coverage
Zero percent. No coverage badges, reports, or tooling.

---

## Round 2 Findings (Deep Dive)

### Types of Tests
None. Unit, integration, and e2e are all empty.

### Critical Flows Needing Tests

**Flow A: Bridge Server Auth Pipeline** (`server.js:68-112`)
Two auth paths: `requireAuth` (user) and `requireAdmin` (admin with service-role). A bug here = privilege escalation. Highest-severity untested path.

**Flow B: `/apply-edit` Handler** (`server.js:344-478`)
Parses user prompt, validates file path (security control), spawns Claude CLI, manages mutex, handles 10-min timeout. Path traversal validation is the primary security gate — never tested.

**Flow C: `loadConfig()` Auto-Restore** (`supabase-client.js:26-54`)
When `.supabase.json` is missing, auto-restores from `DEFAULT_CONFIG` with hardcoded key. Multiple branching code paths, none tested.

**Flow D: Rate Limiter** (`server.js:115-132`)
In-memory Map with sliding window. Cleanup threshold and 60-second window logic untested.

**Flow E: Admin User Creation Retry** (`supabase-client.js:340-358`)
Retries subscription activation 3 times with 500ms delays. Complex retry-with-verify pattern, untested.

### Testable Seams

**High testability (direct unit testing):**
- `readBody(req)` — pure promise, mockable req stream
- `json(res, status, data)` — pure, mockable
- `getToken(req)` — pure function, no side effects
- `checkRateLimit(key)` — pure logic against module-level Map
- `loadConfig()` — file I/O, injectable via temp files
- All `supabase-client.js` exports — HTTP calls interceptable with nock/msw

**Low testability (requires process isolation):**
- `spawn('claude', ['-p'])` — coupled to external binary
- Full SKILL.md pipeline — Claude agent behavior, not conventional code

**Medium testability (integration tests):**
- Full HTTP routes against live `http.createServer()` on ephemeral port

### Mocking Needed
| Dependency | Mock Approach |
|-----------|---------------|
| Supabase REST API | `nock` or `msw` interceptors |
| Claude CLI | Replace `spawn` with test double |
| File system | `tmp` directory fixtures |
| `process.argv`, `process.env` | Direct assignment |

### Most Dangerous Untested Path
**`/apply-edit` file path validation + prompt injection guard** (`server.js:360-410`). Validates structural fields but content of `User requested change:` passes to Claude CLI verbatim. Path traversal uses simple `includes('..')` — no URL-encoded or Unicode-normalized variant testing.

---

## Round 3 Recommendations

### Minimum Test Coverage for Production Safety
Three test suites:
1. **Path traversal tests** — Verify `/apply-edit` blocks `../`, `..%2F`, `..%5C`, absolute paths, symlinks, paths outside PROJECT_DIR
2. **Auth middleware tests** — 401 with no token, 401 with invalid token, 403 with pending subscription, 200 with active subscription. Same for `requireAdmin`.
3. **Rate limiter tests** — 11th request in 60s returns false, counter resets after 60s, cleanup runs at >100 entries

### Highest-Value Test to Write
Parameterized test suite for `/apply-edit` prompt validation and path traversal guards, running against live server instance on ephemeral port with mocked Supabase and mocked `spawn`.

### Test Infrastructure from Scratch
**Recommended stack (matches Node 18+ constraint):**
- **Test runner:** `node:test` (built-in, zero install)
- **Assertions:** `node:assert/strict` (built-in)
- **HTTP mocking:** `nock` (npm install --save-dev)
- **Test command:** `"test": "node --test"` in package.json
- **Setup time:** ~2 hours for infrastructure + first 3 critical tests

```
bridge/
  __tests__/
    server.test.js
    supabase-client.test.js
```

---

## P0 Issues (Fix Immediately)
- Zero test coverage on security-critical paths (auth, path traversal, prompt validation)
- No test infrastructure exists at all

## P1 Issues (Fix Before Scaling)
- No CI/CD pipeline
- No automated regression prevention
- No test script in package.json
