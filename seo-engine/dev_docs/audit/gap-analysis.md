# Gap Analysis

> **App:** article-engine (ChainIQ)
> **Date:** 2026-03-26
> **Path:** Enhance
> **Total Gaps:** 38 — 12 Critical, 14 High, 12 Medium

---

## Gap Dimension 1: Services & Backend

*What backend services/capabilities are entirely absent?*

| # | Gap | Severity | ChainIQ Need |
|---|-----|----------|-------------|
| 1 | **Dashboard API** — No REST/GraphQL API for dashboard operations (article listing, pipeline status, config management) | Critical | Dashboard must control all plugin operations |
| 2 | **Multi-language engine** — No language detection, no RTL layout support, no Arabic NLP integration | Critical | ChainIQ's core value is Arabic content intelligence |
| 3 | **Framework adapter system** — No adapters for React/Vue/Svelte/WordPress output (only raw HTML) | Critical | Universal plugin must output to any framework |
| 4 | **Analytics service** — No article performance tracking, no generation statistics, no error rate monitoring | Critical | Dashboard analytics requirement |
| 5 | **Queue/job system** — No article generation queue; only one article at a time | High | Multiple concurrent article requests |
| 6 | **Webhook/event system** — No events emitted on article creation, edit completion, or pipeline state changes | High | Dashboard real-time updates |
| 7 | **Plugin auto-config service** — No automatic detection of package manager, CI/CD, deployment target | High | Zero-config universal requirement |
| 8 | **Content versioning** — No article version history, no rollback capability | High | Enterprise publishers need audit trails |
| 9 | **Template management API** — No CRUD for component blueprints via API (only file-based) | Medium | Dashboard blueprint browser |
| 10 | **Search/filter API** — No search across generated articles, no filtering by topic/date/status | Medium | Article pipeline manager |

---

## Gap Dimension 2: Screens & User Flows

*What UI surfaces are entirely absent?*

| # | Gap | Severity | ChainIQ Need |
|---|-----|----------|-------------|
| 11 | **Admin dashboard** — No web UI for user management, subscription approvals, usage monitoring | Critical | Dashboard controls all 4 areas |
| 12 | **Article pipeline manager** — No UI for viewing/managing article queue, drafts, published articles | Critical | Pipeline control requirement |
| 13 | **Login/signup UI** — No web forms for authentication (API-only) | Critical | Users need a visual auth flow |
| 14 | **Analytics dashboard** — No charts, metrics, or monitoring visualizations | Critical | Analytics requirement |
| 15 | **Plugin configuration panel** — No UI for managing API keys, Supabase settings, agent preferences | High | Plugin config requirement |
| 16 | **Blueprint gallery** — No visual browser for the 193 component blueprints | High | Users should see available components |
| 17 | **Article gallery** — No thumbnail grid of all generated articles | High | Content management |
| 18 | **Onboarding wizard** — No guided setup flow for new plugin installations | High | Zero-config universal requirement |
| 19 | **Edit progress screen** — No real-time feedback during 10-minute section edits | Medium | Critical UX fix |
| 20 | **Settings page** — No user preferences (language, theme, default topic domain) | Medium | User personalization |

---

## Gap Dimension 3: Task & Backlog Coverage

*What development infrastructure is missing?*

| # | Gap | Severity | ChainIQ Need |
|---|-----|----------|-------------|
| 21 | **Git repository** — Project has no version control | Critical | Basic development hygiene |
| 22 | **CI/CD pipeline** — No automated build, test, or deploy | High | Cannot ship reliably without CI |
| 23 | **Issue tracking** — No GitHub Issues, Linear, or equivalent | Medium | Track bugs and features |
| 24 | **Release process** — No versioning strategy, no CHANGELOG | Medium | Plugin marketplace publishing |

---

## Gap Dimension 4: Infrastructure & DevOps

*What operational infrastructure is missing?*

| # | Gap | Severity | ChainIQ Need |
|---|-----|----------|-------------|
| 25 | **Structured logging** — No JSON logging, no log levels, no external aggregation | High | Debug production issues |
| 26 | **Error tracking** — No Sentry, Datadog, or equivalent | High | Know when things break |
| 27 | **Health monitoring** — `/health` exists but nothing polls it | Medium | Uptime awareness |
| 28 | **Database migrations** — One-time SQL setup, no migration strategy for schema evolution | Medium | Safe schema updates |
| 29 | **Environment management** — No `.env.example`, no env validation | Medium | Multiple deploy environments |

---

## Gap Dimension 5: Testing Gaps

*What testing infrastructure is missing?*

| # | Gap | Severity | ChainIQ Need |
|---|-----|----------|-------------|
| 30 | **All tests** — Zero tests of any kind (unit, integration, e2e) | Critical | Cannot ship a product with zero tests |
| 31 | **Test runner** — No test framework installed | High | Foundation for all testing |
| 32 | **Security tests** — No automated path traversal, auth bypass, or injection testing | High | Security-critical codebase |
| 33 | **API contract tests** — Bridge server endpoints have no contract verification | Medium | Prevent API regressions |

---

## Gap Dimension 6: Documentation Gaps

*What documentation is entirely absent?*

| # | Gap | Severity | ChainIQ Need |
|---|-----|----------|-------------|
| 34 | **README** — No project overview or getting-started guide | Critical | Anyone picking up the project |
| 35 | **API documentation** — 12 bridge endpoints undocumented | High | Dashboard integration, third-party use |
| 36 | **Setup guide** — `.supabase-admin.json` configuration undocumented | High | Admin operations silently fail without it |
| 37 | **Architecture overview** — No diagram or description of the 4-agent pipeline, bridge server, auth model | Medium | Developer onboarding |
| 38 | **Contribution guide** — No standards for code style, PR process, or testing requirements | Medium | Team collaboration |

---

## Gap Summary

```
CRITICAL (12):  Dashboard API, Multi-language, Framework adapters, Analytics service,
                Admin dashboard, Pipeline manager, Login UI, Analytics dashboard,
                Git repo, All tests, README, Zero test coverage

HIGH (14):      Queue system, Webhooks, Auto-config, Content versioning,
                Plugin config panel, Blueprint gallery, Article gallery, Onboarding wizard,
                CI/CD, Structured logging, Error tracking, Test runner,
                Security tests, API docs, Setup guide

MEDIUM (12):    Template API, Search/filter, Edit progress, Settings page,
                Issue tracking, Release process, Health monitoring, DB migrations,
                Env management, API contract tests, Architecture overview, Contribution guide
```

---

## Critical Path

The minimum viable enhancement path to transform article-engine into ChainIQ:

```
Phase 1: Foundation (Week 1-2)
├── Git init + CI/CD pipeline
├── Security fixes (P0: keys, tokens, prompts)
├── Test infrastructure + 3 critical test suites
├── README + API docs + setup guide
└── Structured logging

Phase 2: Universal Engine (Week 3-4)
├── Multi-language support + RTL
├── Framework adapter system (React, Vue, HTML, WordPress)
├── Plugin auto-config service
└── Content versioning

Phase 3: Dashboard (Week 5-7)
├── Dashboard API (REST)
├── Admin dashboard (users, subscriptions)
├── Article pipeline manager
├── Analytics dashboard
├── Login/signup UI
├── Plugin configuration panel
└── Onboarding wizard

Phase 4: Polish (Week 8)
├── Queue/job system for concurrent articles
├── Webhook/event system
├── Blueprint gallery
├── Article gallery
├── Edit progress indicator
└── Settings page
```
