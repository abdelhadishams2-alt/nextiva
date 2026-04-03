# ChainIQ Enhancement Backlog

> **Date:** 2026-03-26
> **Composite Score:** 3.73/10
> **Total Items:** 52
> **Tier 1:** 18 items (Blockers + Quick Wins)
> **Tier 2:** 22 items (Core Enhancements)
> **Tier 3:** 12 items (Depth & Polish)
> **Estimated Effort:** 8 weeks (solo developer)

---

## Tier 1: Blockers & Quick Wins (Week 1-2)

*Must be resolved before any feature development. Mix of security fixes, dev infrastructure, and documentation that unblock everything else.*

| ID | Item | Source | Impact | Risk | Effort | Score |
|----|------|--------|--------|------|--------|-------|
| T1-01 | **Git init + .gitignore audit** | E3-Gap21 | High | High | 1h | 10 |
| T1-02 | **Move service_role key to env var, delete .supabase-admin.json pattern** | E1-D P0-1 | Critical | Critical | 4h | 10 |
| T1-03 | **Stop writing access tokens to .auth-session.json** | E1-D P0-2 | Critical | Critical | 1h | 10 |
| T1-04 | **Add npm test script + node:test infrastructure** | E1-E P0 | Critical | High | 2h | 10 |
| T1-05 | **Write path traversal test suite** | E1-E | Critical | Critical | 2h | 10 |
| T1-06 | **Write auth middleware test suite** | E1-E | Critical | Critical | 2h | 10 |
| T1-07 | **Write rate limiter test suite** | E1-E | High | Medium | 1h | 8 |
| T1-08 | **Write README.md** | E1-F P0 | Critical | Low | 2h | 9 |
| T1-09 | **Write BRIDGE-API.md (12 endpoints)** | E1-F P1 | High | Low | 3h | 8 |
| T1-10 | **Write SETUP-ADMIN.md** | E1-F P0 | High | Medium | 2h | 9 |
| T1-11 | **Create .env.example** | E1-F P1 | Medium | Low | 30m | 7 |
| T1-12 | **Fix version inconsistency (4.6.6/4.6.8/v4.5)** | E1-A P0 | Medium | Low | 30m | 7 |
| T1-13 | **Remove projectDir from /health response** | E1-D A01 | Medium | Low | 15m | 7 |
| T1-14 | **Add Retry-After header to 409 responses** | E1-C | Low | Low | 15m | 5 |
| T1-15 | **Add rate limiting to /auth/verify and /apply-edit** | E1-D A04 | High | Medium | 2h | 8 |
| T1-16 | **Implement token verification cache (30s TTL)** | E1-C | High | Low | 1h | 8 |
| T1-17 | **Replace sync fs calls with async equivalents** | E1-C | Medium | Low | 30m | 6 |
| T1-18 | **Add stdout size limit (4MB) to /apply-edit subprocess** | E1-C P0 | High | Medium | 1h | 8 |

**Tier 1 Total Effort: ~25 hours (3-4 days)**

---

## Tier 2: Core Enhancements (Week 3-6)

*The features that transform article-engine into ChainIQ. Dashboard, universality, and multi-language.*

### 2A: Dashboard Foundation

| ID | Item | Source | Impact | Effort |
|----|------|--------|--------|--------|
| T2-01 | **Choose dashboard tech stack** (Next.js + shadcn/ui recommended) | E3-Gap11 | Critical | 2h |
| T2-02 | **Scaffold dashboard app** with auth integration | E3-Gap13 | Critical | 4h |
| T2-03 | **Build Dashboard API** — RESTful endpoints for all plugin operations | E3-Gap1 | Critical | 2d |
| T2-04 | **Admin panel: User management** — list, approve, revoke, delete | E3-Gap11 | Critical | 1d |
| T2-05 | **Admin panel: Subscription management** — plans, quotas, usage | E3-Gap11 | High | 1d |
| T2-06 | **Article pipeline manager** — list articles, view status, queue management | E3-Gap12 | Critical | 2d |
| T2-07 | **Login/signup page** with Supabase Auth integration | E3-Gap13 | Critical | 4h |
| T2-08 | **Analytics dashboard** — generation stats, error rates, usage charts | E3-Gap14 | Critical | 2d |
| T2-09 | **Plugin configuration panel** — API keys, agent settings, blueprints | E3-Gap15 | High | 1d |
| T2-10 | **Onboarding wizard** — guided first-time setup flow | E3-Gap18 | High | 1d |

### 2B: Universal Engine

| ID | Item | Source | Impact | Effort |
|----|------|--------|--------|--------|
| T2-11 | **Multi-language article generation** — language detection, locale-aware research | E3-Gap2 | Critical | 2d |
| T2-12 | **RTL layout support** — Arabic/Hebrew article generation with proper CSS | E3-Gap2 | Critical | 1d |
| T2-13 | **Framework adapter system** — output adapters for React/Vue/Svelte/WordPress/HTML | E3-Gap3 | Critical | 3d |
| T2-14 | **Plugin auto-config** — detect package manager, framework, shell, CI/CD, deploy target | E3-Gap7 | High | 1d |
| T2-15 | **Enhanced project analyzer** — detect any tech stack, not just web projects | E3-Gap7 | High | 1d |

### 2C: Infrastructure

| ID | Item | Source | Impact | Effort |
|----|------|--------|--------|--------|
| T2-16 | **Structured logging** — JSON format, log levels, request IDs | E1-F, E1-D A09 | High | 1d |
| T2-17 | **Security event logging** — failed auth, admin actions, traversal attempts | E1-D A09 | High | 4h |
| T2-18 | **CI/CD pipeline** — GitHub Actions for lint, test, build | E3-Gap22 | High | 4h |
| T2-19 | **Prompt injection guard** — sanitize Claude instruction patterns in edit requests | E1-D P0-3 | High | 1d |
| T2-20 | **Content versioning** — article version history with rollback | E3-Gap8 | High | 1d |
| T2-21 | **Add loading="lazy" to generated images** | E1-C | Medium | 1h |
| T2-22 | **Add WebP conversion to image pipeline** | E1-C | Medium | 3h |

**Tier 2 Total Effort: ~25 days (5 weeks)**

---

## Tier 3: Depth & Polish (Week 7-8)

*Features that make ChainIQ feel like a complete, polished product.*

| ID | Item | Source | Impact | Effort |
|----|------|--------|--------|--------|
| T3-01 | **Article generation queue** — multiple concurrent articles, job tracking | E3-Gap5 | High | 2d |
| T3-02 | **Webhook/event system** — emit events on pipeline state changes | E3-Gap6 | Medium | 1d |
| T3-03 | **Blueprint gallery UI** — visual browser for 193 component blueprints | E3-Gap16 | Medium | 1d |
| T3-04 | **Article gallery UI** — thumbnail grid with search/filter | E3-Gap17 | Medium | 1d |
| T3-05 | **Edit progress indicator** — real-time status during section edits | E1-B P0 | High | 4h |
| T3-06 | **Edit overlay accessibility** — ARIA, focus trap, Escape key, live regions | E1-B P0 | High | 4h |
| T3-07 | **Decompose SKILL.md** — extract setup, auth, input modules | E1-A P1 | Medium | 1d |
| T3-08 | **Extract edit UI template** — move CSS/JS from draft-writer.md to file | E1-A P1 | Medium | 4h |
| T3-09 | **User settings page** — language preference, theme, default domain | E3-Gap20 | Low | 4h |
| T3-10 | **Database migration strategy** — versioned migrations with rollback | E3-Gap28 | Medium | 4h |
| T3-11 | **SECURITY.md** — document anon key rationale, RLS model, key rotation | E1-F P1 | Medium | 2h |
| T3-12 | **TROUBLESHOOTING.md** — 8 common failure scenarios with resolution | E1-F P1 | Medium | 2h |

**Tier 3 Total Effort: ~10 days (2 weeks)**

---

## Dependency Map

```
T1-01 (git init) ─────────────────────────────┐
T1-02 (env var keys) ───┐                     │
T1-03 (stop token disk) ├─→ T2-16 (logging)   │
T1-04 (test infra) ─────┤                     │
T1-05 (path tests) ─────┤   T2-18 (CI/CD) ←───┘
T1-06 (auth tests) ─────┤
T1-07 (rate tests) ─────┘
                              │
T1-08 (README) ──────────┐   │
T1-09 (API docs) ────────┤   │
T1-10 (setup guide) ─────┘   │
                              ▼
              T2-01 (choose stack) ──→ T2-02 (scaffold)
                                          │
                    ┌─────────────────────┤
                    ▼                     ▼
              T2-03 (dashboard API)  T2-07 (login UI)
                    │                     │
          ┌────────┤                     │
          ▼        ▼                     ▼
    T2-04 (admin) T2-06 (pipeline)  T2-08 (analytics)
          │        │                     │
          ▼        ▼                     ▼
    T2-05 (subs)  T2-09 (config)   T3-03 (blueprints)
                   │                T3-04 (gallery)
                   ▼
             T2-10 (onboarding)

T2-11 (multi-lang) ──→ T2-12 (RTL) ──→ T2-13 (adapters)
                                              │
T2-14 (auto-config) ──→ T2-15 (analyzer) ────┘

T2-20 (versioning) ──→ T3-01 (queue) ──→ T3-02 (webhooks)
T2-19 (prompt guard) ──→ T3-05 (edit progress)
                         T3-06 (edit a11y)
```

---

## Parallel Work Streams

Three independent streams can progress simultaneously:

**Stream A: Security & Foundation** (T1-01 through T1-18)
No dependencies on other streams. Can start immediately.

**Stream B: Universal Engine** (T2-11 through T2-15)
Independent of dashboard. Can start after Tier 1 security fixes.

**Stream C: Dashboard** (T2-01 through T2-10)
Independent of universal engine. Can start after Tier 1 documentation + API docs.

---

## Timeline

```
Week 1-2:  Tier 1 (Security + Tests + Docs + Quick Wins)
           Stream A complete

Week 3-4:  Tier 2A (Dashboard Foundation) + Tier 2B (Universal Engine)
           Streams B and C run in parallel

Week 5-6:  Tier 2A continued + Tier 2C (Infrastructure)
           Dashboard reaches MVP

Week 7-8:  Tier 3 (Polish + Queue + Galleries + Accessibility)
           ChainIQ v1.0 ready

Total: 8 weeks — aligns with ChainIQ pilot sprint timeline
```
