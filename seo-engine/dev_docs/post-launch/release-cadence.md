# ChainIQ Release Cadence & Strategy

> Defines how, when, and with what safeguards ChainIQ ships code to production across all deployment targets.

---

## Release Philosophy

ChainIQ operates two distinct deployment pipelines reflecting the different risk profiles and update frequencies of its components:

1. **Bridge Server (API)** — Continuous delivery via Coolify, auto-deploys on merge to `main`
2. **Dashboard (Frontend)** — Bi-weekly releases via Vercel with preview environments and staged rollouts

This split acknowledges that API changes require careful backward-compatibility management while frontend changes can be previewed visually before promotion.

---

## 1. Bridge Server — Continuous Delivery

### Deployment Pipeline

```
Feature branch --> PR created
    |
    v
CI checks run (lint, type-check, unit tests, integration tests)
    |
    v
PR review (self-review checklist for solo dev phase)
    |
    v
Merge to main
    |
    v
Coolify auto-deploys to production (webhook trigger)
    |
    v
Post-deploy health check (automated /health ping, error rate monitor for 15 min)
    |
    v
Rollback if error rate > 0.5% in first 15 minutes
```

### Branch Strategy
- `main` — Production branch, always deployable, protected with required CI checks
- `feature/*` — Feature branches, named `feature/short-description`
- `fix/*` — Bug fix branches, named `fix/short-description`
- `hotfix/*` — Emergency fixes that bypass the normal PR review cycle

### CI Requirements (Must Pass Before Merge)
- ESLint — zero errors (warnings allowed but tracked)
- TypeScript type checking — strict mode, zero errors
- Unit tests — all passing, coverage not decreasing
- Integration tests — critical path tests passing
- Build — production build succeeds without errors
- Bundle size check — alert if bundle grows > 5% from previous release

### Coolify Configuration
- **Auto-deploy trigger:** GitHub webhook on push to `main`
- **Build command:** `npm run build`
- **Health check endpoint:** `GET /health` must return 200 within 30 seconds of deploy
- **Rollback:** Previous deployment preserved, one-click rollback in Coolify dashboard
- **Environment:** Production env vars managed in Coolify secrets, never committed to repo

### Hotfix Protocol
For P0/P1 issues requiring immediate production fix:
1. Create `hotfix/*` branch from `main`
2. Implement fix with minimal change footprint
3. Run CI locally (`npm run check`) — do not wait for full CI pipeline
4. Merge directly to `main` with `[HOTFIX]` prefix in commit message
5. Monitor error rate for 30 minutes post-deploy
6. Create follow-up ticket for proper test coverage of the fixed scenario

---

## 2. Dashboard — Bi-Weekly Releases

### Release Schedule
- **Release day:** Every other Wednesday
- **Code freeze:** Monday before release day (no new features merged after Monday EOD)
- **Preview deployment:** Tuesday (Vercel preview URL shared for final review)
- **Production promotion:** Wednesday morning
- **Release notes published:** Wednesday afternoon

### Deployment Pipeline

```
Feature branch --> PR created
    |
    v
Vercel preview deployment auto-generated (unique URL per PR)
    |
    v
Visual review on preview URL (responsive, RTL, dark mode)
    |
    v
CI checks pass (lint, type-check, tests, Lighthouse score)
    |
    v
Merge to main
    |
    v
Staging auto-deploy (Vercel preview for main branch)
    |
    v
Release day: Promote staging to production
    |
    v
Post-deploy Lighthouse audit + smoke test
```

### Vercel Configuration
- **Framework preset:** Next.js
- **Preview deployments:** Enabled for all branches and PRs
- **Production branch:** `main` (manual promotion from preview)
- **Edge functions:** Enabled for API routes requiring low latency
- **Analytics:** Vercel Analytics enabled for Core Web Vitals tracking
- **Environment variables:** Managed per environment (preview, production)

### Pre-Release Checklist
Before promoting to production on release day:
- [ ] All CI checks green on main branch
- [ ] Preview URL manually tested for critical flows (login, article generation, settings)
- [ ] Arabic RTL layout verified on preview
- [ ] Mobile responsive checked on preview (375px, 768px, 1024px)
- [ ] Lighthouse score: Performance > 80, Accessibility > 90, SEO > 90
- [ ] No console errors or warnings in browser dev tools
- [ ] API compatibility confirmed — dashboard works with current production API version

---

## 3. Semantic Versioning

### Version Format: `MAJOR.MINOR.PATCH`

| Component | Increment | When |
|-----------|-----------|------|
| **MAJOR** (X.0.0) | Breaking changes | API contract changes that require client updates, database migrations that alter existing data, removal of deprecated features |
| **MINOR** (0.X.0) | New features | New API endpoints, new dashboard features, new agent pipeline capabilities, new language support |
| **PATCH** (0.0.X) | Bug fixes & improvements | Bug fixes, performance improvements, copy changes, styling fixes, dependency updates |

### Version Tracking
- Bridge server version: Tracked in `package.json` and exposed via `GET /version` endpoint
- Dashboard version: Tracked in `package.json` and displayed in dashboard footer
- Version tags: Git tags created for each minor and major release (`v1.2.0`)
- Patch versions: Tracked in commits but not individually tagged unless noteworthy

### Pre-1.0 Rules (Current Phase)
During the 0.x phase:
- MINOR bumps may include breaking changes (with changelog documentation)
- API stability is not guaranteed — clients should expect evolution
- Version 1.0.0 will be declared when: 3+ enterprise customers are live, API surface is stable for 3+ months, and core 6-layer architecture is complete

---

## 4. Changelog Format

### Location
- **File:** `CHANGELOG.md` in repository root
- **Public:** Summarized version on ChainIQ website `/changelog` page
- **Email:** Key highlights included in bi-weekly release email to active users

### Format (Keep a Changelog Standard)

```markdown
## [0.3.0] - 2026-04-15

### Added
- Arabic morphological analysis in content quality scoring (#142)
- Bulk article generation for up to 10 articles per batch (#138)
- Export generated articles as DOCX format (#145)

### Changed
- Improved article generation speed by 40% through pipeline parallelization (#140)
- Updated content brief template with competitor analysis section (#143)

### Fixed
- Arabic RTL alignment issue in content editor (#139)
- Timeout error when generating articles with 20+ target keywords (#141)
- Dashboard chart rendering on Safari mobile (#144)

### Deprecated
- Legacy `/api/v1/generate` endpoint — use `/api/v2/generate` instead (removal in 0.5.0)

### Security
- Updated jsonwebtoken dependency to patch CVE-2026-XXXX (#146)
```

### Changelog Rules
- Every PR must include a changelog entry (enforced by PR template checklist)
- Entries reference the PR/issue number for traceability
- Use plain language understandable by non-technical users (these are published externally)
- Security fixes are always documented (without exposing vulnerability details before patch)
- Deprecated features include a removal timeline (at least 2 minor versions of advance notice)

---

## 5. Release Communication

### Internal (Solo Dev Phase)
- Update `STATUS.md` with release version and key changes
- Update `DEVLOG.md` with technical notes on implementation decisions
- Tag release in git with version number

### External (User-Facing)
| Channel | Content | Timing |
|---------|---------|--------|
| Changelog page | Full changelog entry | Release day |
| Email to active users | Highlights (top 3 changes) | Release day + 1 |
| In-app notification | Banner for major features | Release day |
| Social (LinkedIn) | Key feature announcement | Release day + 2 |

### Major Release Communication (MAJOR version bumps)
- Pre-announcement email 2 weeks before release
- Migration guide if breaking changes affect API consumers
- Office hours / Q&A session for enterprise customers
- Updated documentation and help articles before release day

---

## 6. Rollback Procedures

### Bridge Server Rollback
- **Automated:** If post-deploy health check fails, Coolify auto-rolls back to previous deployment
- **Manual:** One-click rollback in Coolify dashboard to any previous deployment
- **Database:** If a migration was involved, run the down migration before rolling back code
- **Recovery time target:** < 5 minutes for code rollback, < 15 minutes with database rollback

### Dashboard Rollback
- **Vercel instant rollback:** Promote any previous deployment to production via Vercel dashboard
- **Recovery time target:** < 2 minutes (Vercel repoint, no rebuild needed)

### Post-Rollback Protocol
1. Communicate to affected users via status page
2. Create incident report documenting what went wrong
3. Fix the issue on a new branch (do not re-deploy the broken code)
4. Add regression test covering the failure scenario
5. Re-deploy through normal pipeline once fixed

---

*Last updated: 2026-03-28*
*Review cadence: Quarterly*
*Owner: Chain Reaction SEO — ChainIQ Engineering*
