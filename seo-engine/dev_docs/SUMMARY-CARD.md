# ChainIQ — Project Summary Card

> **Generated:** 2026-03-28 | **Path:** Enhance | **Maturity:** 45/100 (MID_BUILD)

---

## Identity

| Key | Value |
|-----|-------|
| **Product** | ChainIQ — AI Content Intelligence Platform |
| **Market** | MENA Arabic publishers (initial), universal expansion |
| **Model** | SaaS subscription: Starter $3K/mo, Professional $6K/mo, Enterprise $12K/mo |
| **Infrastructure** | ~$34/month (Hetzner $9 + Supabase $25) |

## Tech Stack

| Component | Choice |
|-----------|--------|
| Backend | Node.js (zero npm deps), raw http.createServer() |
| Database | Supabase PostgreSQL (Pro $25/mo) |
| Dashboard | Next.js 16 + shadcn/ui (base-ui) + Tailwind CSS |
| Auth | Supabase Auth (JWT) + SHA-256 cache (30s TTL) |
| Encryption | AES-256-GCM via KeyManager |
| Hosting | Hetzner CPX21 + Coolify |
| Testing | node:test (228 tests, 13 suites) |

## Architecture

- **6 layers**, **12 services** (6 built, 6 planned)
- **7 agents** in generation pipeline
- **48 endpoints** on bridge server (1,471 lines)
- **193 component blueprints** in registry
- **15 database tables** (9 existing + 6 planned)

## Generated Artifacts

| Category | Count |
|----------|-------|
| Tribunal files | 62 (~150K words) |
| Service specs | 6 (90K+ words, 443 named tests) |
| Screen specs | 15 (100K+ words) |
| Task files | 26 across phases 5-10 |
| Sprint plans | 10 (~320h total effort) |
| ADRs | 19 |
| Cross-cutting catalogs | 5 (386 entries total) |
| Foundation docs | 15 (design system, testing, security, observability) |
| User docs | 6 (guides, FAQ, troubleshooting, changelog) |
| Completeness matrices | 10 |
| Templates | 9 code templates |

## Coverage

| Dimension | Coverage |
|-----------|----------|
| Services planned vs specified | 12/12 (100%) |
| Features classified (MoSCoW) | 93/93 (100%) |
| Screens specified | 15/15 (100%) |
| Consistency checks | 15/15 pass |
| P0 planning audit findings | 0 |
| Tests passing | 228/228 |

## Phase Breakdown

| Phase | Tasks | Est. Hours | Status |
|-------|-------|-----------|--------|
| 0: Foundation | 4 | 8h | Complete |
| 1: Core Features | 5 | 40h | Complete |
| 2: Polish | 12 | 24h | Complete |
| 3: Dashboard-Plugin Integration | 16 | 60h | Complete |
| 4: Enhancement Sprint | 4 | 16h | Complete |
| 5: Data Ingestion | 6 | 80h | Not Started |
| 6: Content Intelligence | 5 | 60h | Not Started |
| 7: Quality Gate | 3 | 40h | Not Started |
| 8: Voice Intelligence | 4 | 50h | Not Started |
| 9: Universal Publishing | 5 | 60h | Not Started |
| 10: Feedback Loop | 3 | 30h | Not Started |

## Start Coding

```
Run /kickoff to start your first coding session.
Read CLAUDE.md → STATUS.md → find first task → code.
```
