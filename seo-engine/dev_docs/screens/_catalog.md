# ChainIQ — Screen Catalog

> **Last Updated:** 2026-03-28
> **Total Screens:** 15 (8 existing + 7 new platform expansion)
> **Dashboard Stack:** Next.js 16 (App Router) + shadcn/ui + Tailwind CSS
> **Design:** Dark mode default, Geist Sans/Mono fonts

---

## Screen Index

### Existing Screens (Built in Phases 0-4)

| # | Screen | Route | Service | Type | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Login / Signup | `/login`, `/signup` | Auth & Bridge | Form | Built |
| 2 | Dashboard Home | `/` | Analytics, Dashboard API | Dashboard | Built |
| 3 | Article Pipeline | `/articles` | Dashboard API, Article Pipeline | List + Actions | Built |
| 4 | Article Detail | `/articles/[id]` | Dashboard API | Detail | Built |
| 5 | User Management | `/admin/users` | Admin & Users | List + CRUD | Built |
| 6 | Plugin Configuration | `/settings` | Dashboard API | Form | Built |
| 7 | Onboarding Wizard | `/onboarding` | Admin & Users | Wizard | Built |
| 8 | Blueprint Gallery | `/blueprints` | Dashboard API | Gallery | Built |

### New Screens (Platform Expansion)

| # | Screen | Route | Service | Type | Priority |
| --- | --- | --- | --- | --- | --- |
| 9 | Connections | `/settings/connections` | Data Ingestion | Form + Status | P0 |
| 10 | Content Inventory | `/inventory` | Data Ingestion, Content Intelligence | List + Filters | P0 |
| 11 | Opportunities | `/opportunities` | Content Intelligence | List + Scores | P0 |
| 12 | Voice Profiles | `/voice` | Voice Intelligence | List + Detail | P1 |
| 13 | Publish Manager | `/publish` | Publishing | List + Actions | P1 |
| 14 | Performance | `/performance` | Feedback Loop | Dashboard + Charts | P2 |
| 15 | Article Quality Report | `/articles/[id]/quality` | Quality Gate | Report | P1 |

---

## Navigation Structure (Updated)

```
Sidebar (persistent, collapsible)
├── Dashboard Home (/)
├── Intelligence
│   ├── Content Inventory (/inventory)
│   ├── Opportunities (/opportunities)
│   └── Performance (/performance)
├── Content
│   ├── Articles (/articles)
│   │   └── [Article Detail] (/articles/[id])
│   │       └── [Quality Report] (/articles/[id]/quality)
│   ├── Generate (/generate)
│   └── Blueprints (/blueprints)
├── Voice Profiles (/voice)
├── Publishing (/publish)
├── Admin (admin-only)
│   └── Users (/admin/users)
├── Settings (/settings)
│   └── Connections (/settings/connections)
└── User Menu (bottom)
    ├── Profile
    └── Logout

Auth Pages (no sidebar):
├── /login
├── /signup
└── /onboarding
```

---

## Shared Components

| Component | Source | Used By |
| --- | --- | --- |
| Sidebar | Custom | All authenticated pages |
| DataTable | shadcn/ui | Articles, Users, Inventory, Opportunities |
| Card | shadcn/ui | Dashboard, Article Detail, Performance |
| Dialog | shadcn/ui | Confirmations, forms, persona editing |
| Badge | shadcn/ui | Status indicators (healthy/decaying/etc) |
| Skeleton | shadcn/ui | All loading states |
| Toast | shadcn/ui | Success/error notifications |
| Form | shadcn/ui + react-hook-form | Login, Signup, Settings, Connections |
| Tabs | shadcn/ui | Article Detail, Settings, Voice Profiles |
| Chart | shadcn/ui (recharts) | Dashboard, Performance, Inventory trends |
| Progress | shadcn/ui | Quality scores, health scores |
| AlertBanner | Custom | Connection warnings, data staleness alerts |
| ScoreRing | Custom (new) | Quality scores, health scores, recommendation confidence |
| TimelineChart | Custom (new) | Performance trends, click/impression history |
| StatusDot | Custom (new) | Connection status (green/yellow/red) |
