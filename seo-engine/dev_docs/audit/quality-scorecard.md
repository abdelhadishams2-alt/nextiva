# Quality Scorecard

> **App:** article-engine (ChainIQ)
> **Date:** 2026-03-26
> **Path:** Enhance
> **Composite Score:** 3.6 / 10

---

## Dimension Scores

| # | Dimension | Score | Weight | Weighted |
|---|-----------|-------|--------|----------|
| E1-A | Architecture & Code Quality | 5.0 / 10 | 25% | 1.25 |
| E1-D | Security & Compliance | 4.5 / 10 | 25% | 1.13 |
| E1-E | Testing Coverage | 1.0 / 10 | 20% | 0.20 |
| E1-B | UX & Screen Coverage | 4.0 / 10 | 15% | 0.60 |
| E1-C | Performance & Scalability | 4.0 / 10 | 10% | 0.40 |
| E1-F | Documentation & Ops | 3.0 / 10 | 5% | 0.15 |
| | **COMPOSITE** | | **100%** | **3.73** |

**Classification: NEEDS SIGNIFICANT WORK** (Score < 5.0)

---

## Composite Score Breakdown

```
Architecture  [#####-----]  5.0  — Needs Work (god file, no shared modules)
Security      [####------]  4.5  — Needs Work (3 P0 issues: keys on disk, prompt injection)
Testing       [#---------]  1.0  — CRITICAL (zero tests, zero infrastructure)
UX            [####------]  4.0  — Needs Work (missing 5+ critical UI surfaces)
Performance   [####------]  4.0  — Needs Work (no caching, sync I/O, global mutex)
Docs          [###-------]  3.0  — Critical (no README, no API docs, no onboarding)
```

---

## Top 3 Critical Blockers

### Blocker 1: ZERO TEST COVERAGE (E1-E — Score 1/10)
No test files, no test runner, no CI/CD. Security-critical paths (auth middleware, path traversal validation, prompt handling) have never been tested. This is the single biggest risk to the product.

**Impact:** Any code change could break auth, leak data, or introduce path traversal vulnerabilities with zero automated detection.

**Resolution:** Install `node:test`, write 3 critical test suites (auth, path traversal, rate limiter), add npm test script. ~2 hours.

### Blocker 2: THREE P0 SECURITY ISSUES (E1-D — Score 4.5/10)
1. Supabase `service_role` key stored as plaintext in `.supabase-admin.json` on developer machines
2. Live access tokens persisted to `.auth-session.json` on disk
3. Prompt injection possible via authenticated edit requests → Claude CLI

**Impact:** Machine compromise = full database breach. Token theft = user impersonation. Prompt injection = unauthorized file operations.

**Resolution:** Move service_role to env var, stop writing tokens to disk, add prompt sanitization. ~2 days.

### Blocker 3: NO USER-FACING DOCUMENTATION (E1-F — Score 3/10)
No README, no API reference, no installation guide, no `.env.example`. The `.supabase-admin.json` setup (required for admin operations) is documented nowhere.

**Impact:** No one except the original developer can set up, operate, or debug the system. Team handoff is impossible.

**Resolution:** Write 5 core documents (README, BRIDGE-API, SETUP-ADMIN, SECURITY, TROUBLESHOOTING). ~1 day.

---

## Strengths to Protect

| Strength | Dimension | Evidence |
|----------|-----------|----------|
| Zero npm dependencies | Security | Pure Node.js built-ins — no supply chain risk |
| 193 component blueprints | Architecture | Extensive design registry, well-organized |
| Supabase admin privilege separation | Security | service_role used correctly for admin checks |
| Path traversal prevention | Security | Multi-layer validation (`.includes('..')`, `path.isAbsolute()`, extension check, `startsWith`) |
| Graceful Gemini degradation | Performance | Level 1 fallback when MCP unavailable |
| `supabase-setup.sql` documentation | Docs | Best-documented file — complete schema with comments |
| Agent pipeline architecture | Architecture | Clean 4-agent separation of concerns |

---

## Priority Action Sequence

| Priority | Action | Effort | Blocker # |
|----------|--------|--------|-----------|
| P0 | Move service_role key to env var | 4 hours | #2 |
| P0 | Stop writing access tokens to disk | 1 hour | #2 |
| P0 | Write README.md | 2 hours | #3 |
| P0 | Add path traversal test suite | 2 hours | #1 |
| P0 | Add auth middleware test suite | 2 hours | #1 |
| P1 | Document BRIDGE-API.md | 3 hours | #3 |
| P1 | Add prompt injection guard | 4 hours | #2 |
| P1 | Implement token verification cache | 1 hour | — |
| P1 | Add edit progress indicator | 4 hours | — |
| P2 | Decompose SKILL.md god file | 1 day | — |
| P2 | Add structured logging | 1 day | — |
| P2 | Build admin dashboard | 1-2 weeks | — |
