# ChainIQ — Anti-Pattern Registry

> **Step 16.1 Artifact** — Anti-Pattern Baseline
> **Last Updated:** 2026-03-28
> **Stack:** Node.js (zero deps), Supabase PostgreSQL, Next.js 16

---

## Active Anti-Patterns

### AP-001: Synchronous I/O in Request Handlers

**Severity:** HIGH | **Detection:** `grep -rn "readFileSync\|writeFileSync\|existsSync" bridge/`

**Pattern:** Using `fs.readFileSync()`, `fs.writeFileSync()`, or `fs.existsSync()` in any code path triggered by an HTTP request.

**Why it matters:** Blocks the Node.js event loop. A single slow disk operation degrades all concurrent requests. ChainIQ handles SSE connections that can last 10 minutes — one sync call blocks everything.

**Correct pattern:** `await fs.promises.readFile()`, `await fs.promises.access()`.

**Current status:** Resolved in SEC-001. No sync I/O in bridge server request paths.

---

### AP-002: Secrets on Disk

**Severity:** CRITICAL | **Detection:** `grep -rn "writeFileSync.*key\|writeFileSync.*token\|writeFileSync.*secret" --include="*.js"`

**Pattern:** Writing API keys, tokens, or service role keys to JSON/text files on disk.

**Why it matters:** Any process on the machine can read the file. Machine compromise = full Supabase breach via service_role key.

**Correct pattern:** Environment variables only (`process.env.SUPABASE_SERVICE_ROLE_KEY`).

**Current status:** Resolved in SEC-001. All secrets in env vars.

---

### AP-003: CORS Wildcard in Production

**Severity:** HIGH | **Detection:** `grep -rn "Access-Control-Allow-Origin.*\\*" bridge/`

**Pattern:** Setting `Access-Control-Allow-Origin: *` in production deployment.

**Why it matters:** Any webpage can call the bridge API. Combined with user cookies/tokens, enables CSRF-like attacks.

**Correct pattern:** Dynamic allowlist from `DASHBOARD_URL` env var + registered plugin origins. See `dev_docs/foundations/security/security-headers-cors.md`.

**Current status:** Currently wildcard (acceptable for localhost dev). Production config documented, implementation pending.

---

### AP-004: Unbounded Subprocess Output

**Severity:** MEDIUM | **Detection:** Manual review of `spawn()` calls

**Pattern:** Spawning Claude CLI without stdout/stderr size limits.

**Why it matters:** A runaway or adversarial response can OOM the bridge server (4GB RAM on Hetzner CPX21).

**Correct pattern:** Cap at 4MB, kill subprocess if exceeded. Already implemented in bridge server.

**Current status:** Resolved. 4MB cap with process kill implemented.

---

### AP-005: Framework Assumptions in Output

**Severity:** MEDIUM | **Detection:** `grep -rn "React\|jsx\|tsx" agents/ --include="*.md" | grep -v "auto-detect\|adapter"`

**Pattern:** Generating React JSX and calling it "universal." Assuming npm, bash, or any specific tool.

**Why it matters:** Breaks for Vue, Svelte, WordPress, pnpm, yarn, PowerShell, zsh users. ChainIQ's value proposition is zero-config universality.

**Correct pattern:** Detect via project-analyzer, output through framework adapter.

**Current status:** Resolved. Universal engine with 7 framework adapters.

---

### AP-006: Missing RLS on New Tables

**Severity:** CRITICAL | **Detection:** SQL query `SELECT tablename FROM pg_tables WHERE schemaname='public' AND NOT rowsecurity`

**Pattern:** Creating new Supabase tables without Row-Level Security policies.

**Why it matters:** Without RLS, any authenticated user can read/modify all records. Multi-tenant data leak.

**Correct pattern:** Every table: `ALTER TABLE x ENABLE ROW LEVEL SECURITY; CREATE POLICY ... USING (auth.uid() = user_id)`.

**Current status:** All 9 existing tables have RLS. 6 new tables need RLS at creation time.

---

### AP-007: Token Persistence to Disk

**Severity:** HIGH | **Detection:** `grep -rn "writeFile.*token\|writeFile.*session\|writeFile.*jwt" bridge/`

**Pattern:** Writing JWTs, refresh tokens, or session data to files.

**Why it matters:** Disk-based tokens can be stolen by any process. Tokens should be in-memory only (server-side) or browser localStorage (client-side).

**Correct pattern:** In-memory SHA-256 cache with 30s TTL for server-side. Browser localStorage for client-side (Supabase default).

**Current status:** Resolved in SEC-001. No token persistence.

---

### AP-008: Error Details in Production Responses

**Severity:** MEDIUM | **Detection:** `grep -rn "stack\|stackTrace\|err\.message" bridge/ | grep -v "NODE_ENV"`

**Pattern:** Including stack traces, internal error messages, or debug details in HTTP error responses in production.

**Why it matters:** Leaks internal structure, file paths, library versions to attackers.

**Correct pattern:** Generic messages in production, detailed only when `NODE_ENV !== 'production'`. See `dev_docs/foundations/security/security-headers-cors.md` Section 6.

**Current status:** Partially resolved. Some endpoints need audit.

---

### AP-009: N+1 Queries via Supabase REST

**Severity:** MEDIUM | **Detection:** Manual review of loops containing `supabase.query()` calls

**Pattern:** Fetching a list of items, then making individual Supabase REST calls for each item's related data.

**Why it matters:** 100 articles × 1 version query each = 101 HTTP requests instead of 2.

**Correct pattern:** Use Supabase's `select` with embedded relations: `articles?select=*,article_versions(*)`.

**Current status:** Most queries are flat. Watch for this pattern in Phase 5-10 development.

---

### AP-010: Floating Point for Money

**Severity:** HIGH | **Detection:** `grep -rn "\.toFixed\|parseFloat.*cost\|parseFloat.*price" --include="*.js"`

**Pattern:** Using floating point numbers for API cost tracking, ROI calculations, or billing amounts.

**Why it matters:** `0.1 + 0.2 !== 0.3` in JavaScript. Accumulation errors lead to incorrect billing.

**Correct pattern:** Store as integer cents. `$12.50 → 1250`. Divide by 100 only for display.

**Current status:** Architecture constraint in ARCH-ANCHOR.md. Not yet implemented (no billing code yet).

---

## Prevention Checklist

Before merging any PR, verify:

- [ ] No sync I/O in request handlers (AP-001)
- [ ] No secrets written to files (AP-002)
- [ ] CORS uses allowlist, not wildcard (AP-003)
- [ ] Subprocess output is bounded (AP-004)
- [ ] Output adapts to detected framework (AP-005)
- [ ] New tables have RLS policies (AP-006)
- [ ] No tokens persisted to disk (AP-007)
- [ ] Error responses sanitized for production (AP-008)
- [ ] No N+1 query patterns (AP-009)
- [ ] Money stored as integer cents (AP-010)
