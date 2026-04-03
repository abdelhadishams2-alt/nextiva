# ChainIQ — CI/CD Pipeline Design

> **CI Provider:** GitHub Actions
> **Deployment:** Coolify (Hetzner CPX21) for bridge, Vercel or Coolify for dashboard
> **Container:** Docker (bridge only — dashboard uses Vercel's build system)
> **Last Updated:** 2026-03-28

---

## Pipeline Architecture

```
                    ┌─────────────────────────────────────────────────┐
  PR / Push ──────▶ │                  CI PIPELINE                    │
                    │                                                 │
                    │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
                    │  │  Bridge   │  │Dashboard │  │  Security    │  │
                    │  │  Tests    │  │Build+Lint│  │  Scan        │  │
                    │  │          │  │          │  │              │  │
                    │  │ unit     │  │ lint     │  │ secret scan  │  │
                    │  │ integr.  │  │ typecheck│  │ npm audit    │  │
                    │  │          │  │ build    │  │              │  │
                    │  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
                    │       │             │               │          │
                    │       └─────────────┴───────────────┘          │
                    │                     │                          │
                    │              All pass? ──── No ──── Block PR   │
                    │                     │                          │
                    │                    Yes                         │
                    │                     │                          │
                    └─────────────────────┼──────────────────────────┘
                                          │
                                   Merge to main
                                          │
                    ┌─────────────────────┼──────────────────────────┐
                    │            DEPLOY PIPELINE                     │
                    │                     │                          │
                    │         ┌───────────┴───────────┐              │
                    │         │                       │              │
                    │  ┌──────▼──────┐         ┌──────▼──────┐       │
                    │  │ Bridge      │         │ Dashboard   │       │
                    │  │ Coolify     │         │ Vercel      │       │
                    │  │ (Hetzner)   │         │ (auto-deploy│       │
                    │  │             │         │  on push)   │       │
                    │  └──────┬──────┘         └──────┬──────┘       │
                    │         │                       │              │
                    │    Health check            Preview URL         │
                    │         │                       │              │
                    │         └───────────────────────┘              │
                    │                     │                          │
                    │              Production live                   │
                    └─────────────────────────────────────────────────┘
```

---

## Pipeline Stages

| Stage | Bridge Server | Dashboard | Runs On |
|-------|---------------|-----------|---------|
| **Lint** | N/A (no linter for plain JS) | `next lint` + ESLint | PR + push |
| **Type Check** | N/A (plain JS) | `tsc --noEmit` | PR + push |
| **Unit Test** | `node --test test/` (228 tests) | Future: Vitest | PR + push |
| **Build** | Docker build (verify) | `next build` | PR + push |
| **Integration Test** | Against running bridge | Future: Playwright | PR + push |
| **Security** | Secret scan + audit | `npm audit` | PR + push |
| **Deploy** | Coolify webhook | Vercel auto-deploy | Push to main only |

---

## Triggers

| Event | CI Runs | Deploy Runs |
|-------|---------|-------------|
| PR opened/updated | Yes (all 3 jobs) | No |
| Push to `main` | Yes (all 3 jobs) | Yes (if CI passes) |
| Push to feature branch | No | No |
| Schedule (weekly) | Future: dependency audit | No |

---

## Environment Promotion

| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| **Development** | Any | `localhost:19847` (bridge), `localhost:3000` (dashboard) | Local development |
| **Preview** | PR branches | Vercel preview URL (auto) | PR review |
| **Production** | `main` | `bridge.chainiq.io:19847`, `dashboard.chainiq.io` | Live |

**Promotion rules:**
- Dev → Preview: automatic on PR creation (Vercel)
- Preview → Production: merge PR to `main` (requires CI pass)
- No staging environment initially (solo developer, cost savings)
- Add staging when team grows beyond 1 developer

---

## Deployment Pattern

**Bridge Server:** Docker-based deployment via Coolify on Hetzner.
- Coolify watches the GitHub repo and rebuilds on push to `main`
- Zero-downtime deploy: Coolify starts new container, health check passes, old container stops
- Rollback: Coolify keeps previous 3 images, one-click rollback in UI

**Dashboard:** Vercel automatic deployment.
- Connected to GitHub repo, auto-deploys on push to `main`
- Preview deployments on every PR
- Rollback: Vercel instant rollback to any previous deployment

---

## Secrets Management

| Secret | Stored In | Used By |
|--------|-----------|---------|
| `SUPABASE_URL` | GitHub Secrets + Coolify env | CI + Bridge |
| `SUPABASE_ANON_KEY` | GitHub Secrets + Coolify env + Vercel env | CI + Bridge + Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | GitHub Secrets + Coolify env | CI + Bridge (NEVER in dashboard) |
| `ENCRYPTION_KEY` | Coolify env only | Bridge (not in CI) |
| `GOOGLE_CLIENT_ID` | Coolify env only | Bridge |
| `GOOGLE_CLIENT_SECRET` | Coolify env only | Bridge |
| `COOLIFY_WEBHOOK_URL` | GitHub Secrets | Deploy workflow |
| `COOLIFY_TOKEN` | GitHub Secrets | Deploy workflow |

**Rules:**
- No secrets in code, ever (CI secret scan enforces this)
- `service_role` key never in Vercel/dashboard env vars
- Rotation: Supabase keys rotated quarterly, encryption key on breach only

---

## Caching Strategy

| Cache | Key | Path | TTL |
|-------|-----|------|-----|
| Dashboard node_modules | `dashboard-deps-{hash(package-lock.json)}` | `dashboard/node_modules` | Until lockfile changes |
| Next.js build cache | `dashboard-next-{hash(src/**)}` | `dashboard/.next/cache` | Until source changes |
| Bridge (none needed) | — | — | Zero deps, no install step |

---

## Future Additions

- [ ] E2E tests with Playwright (after dashboard screens are built)
- [ ] Dependency vulnerability alerts (Dependabot or Renovate)
- [ ] Performance budget checks (Lighthouse CI for dashboard)
- [ ] Weekly scheduled audit run
- [ ] Staging environment (when team grows)
