# ChainIQ — Service Index

> **Last Updated:** 2026-03-28
> **Total Services:** 12 (6 existing/built + 6 new platform expansion)
> **Path:** Enhance → Platform Expansion
> **Architecture:** 6-Layer AI Content Intelligence Platform

---

## Service Map

### Existing Services (Built in Phases 0-4)

| # | Service | Slug | Type | Priority | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Auth & Bridge Server | `auth-bridge` | Existing (built) | P0 | Done — 36+ endpoints, security hardened |
| 2 | Article Pipeline | `article-pipeline` | Existing (extend) | P1 | Done — 4-agent pipeline, 7 adapters |
| 3 | Dashboard API | `dashboard-api` | Existing (built) | P1 | Done — full CRUD, admin panel |
| 4 | Universal Engine | `universal-engine` | Existing (built) | P1 | Done — 11 langs, RTL, 7 adapters |
| 5 | Analytics | `analytics` | Existing (built) | P1 | Done — generation stats, usage metrics |
| 6 | Admin & User Management | `admin-users` | Existing (built) | P1 | Done — user CRUD, quotas, plans |

### New Services (Platform Expansion)

| # | Service | Slug | Layer | Priority | Status |
| --- | --- | --- | --- | --- | --- |
| 7 | Data Ingestion | `data-ingestion` | Layer 1 | P0 | Planning |
| 8 | Content Intelligence | `content-intelligence` | Layer 2 | P0 | Planning |
| 9 | Voice Intelligence | `voice-intelligence` | Layer 3 | P1 | Planning |
| 10 | Quality Gate | `quality-gate` | Layer 4 | P1 | Planning |
| 11 | Publishing | `publishing` | Layer 5 | P1 | Planning |
| 12 | Feedback Loop | `feedback-loop` | Layer 6 | P2 | Planning |

---

## 6-Layer Architecture

```
Layer 1: DATA INGESTION ──────────────────────────────────────────────
         GSC OAuth2 | GA4 OAuth2 | Semrush API | Ahrefs API | Trends | CMS Crawler
         → Unified ContentPerformanceRecord per URL per client
                    │
                    ▼
Layer 2: CONTENT INTELLIGENCE ────────────────────────────────────────
         Decay Detection | Gap Analysis | Seasonality | Saturation Index | Cannibalization Guard
         → Scored topic recommendations (Mode B)
                    │
                    ▼
Layer 3: VOICE INTELLIGENCE ──────────────────────────────────────────
         Corpus Crawler | AI vs Human Classifier | Writer Clustering | Persona Generation
         → Writer personas with style DNA profiles
                    │
                    ▼
Layer 4: GENERATION PIPELINE (existing + Quality Gate) ───────────────
         [Topic Recommender] → [Voice Analyzer] → Project Analyzer → Research Engine
         → Article Architect → Draft Writer → Quality Gate (7-signal scoring)
                    │
                    ▼
Layer 5: UNIVERSAL PUBLISHING ────────────────────────────────────────
         WordPress Plugin | Shopify App | Contentful | Strapi | Ghost | Webflow | Webhook
         → Publish to any CMS as draft
                    │
                    ▼
Layer 6: FEEDBACK LOOP ───────────────────────────────────────────────
         30/60/90 day GSC+GA4 tracking | Prediction vs Actual | Recalibration
         → Engine gets smarter over time
```

---

## Dependency Graph

```
Auth & Bridge (L0 — built)
    ↑ depends on
    ├── Data Ingestion (L1 — new)
    │       ↑ depends on
    │       ├── Content Intelligence (L2 — new)
    │       └── Feedback Loop (L6 — new)
    │
    ├── Voice Intelligence (L3 — new) ──→ depends on Content Inventory from L1
    │
    ├── Article Pipeline (L4 — built, extend)
    │       ↑ extends with
    │       ├── Topic Recommender agent (from L2)
    │       ├── Voice Analyzer agent (from L3)
    │       └── Quality Gate agent (new)
    │
    ├── Universal Engine (L4 — built)
    │       ↑ extends with
    │       └── Publishing Service (L5 — new)
    │
    ├── Dashboard API (built) ──→ Admin & Users (built)
    └── Analytics (built)
```

---

## Service Files

### Existing (Built)

- [auth-bridge.md](auth-bridge.md) — Authentication, bridge server, section editing
- [article-pipeline.md](article-pipeline.md) — 4-agent article generation pipeline
- [dashboard-api.md](dashboard-api.md) — REST API for dashboard operations
- [universal-engine.md](universal-engine.md) — Multi-language, framework adapters, auto-config
- [analytics.md](analytics.md) — Generation stats, error tracking, usage metrics
- [admin-users.md](admin-users.md) — User management, subscriptions, approvals

### New (Platform Expansion)

- [data-ingestion.md](data-ingestion.md) — GSC/GA4/Semrush/Ahrefs connectors, content crawler, scheduler
- [content-intelligence.md](content-intelligence.md) — Decay detection, gap analysis, topic recommender
- [voice-intelligence.md](voice-intelligence.md) — Corpus analysis, AI/human classifier, writer personas
- [quality-gate.md](quality-gate.md) — 60-point SEO checklist, 7-signal scoring, auto-revision
- [publishing.md](publishing.md) — WordPress plugin, Shopify app, CMS adapters, webhook publishing
- [feedback-loop.md](feedback-loop.md) — Performance tracking, prediction vs actual, recalibration

---

## Cross-Service Workflows

### 1. Article Generation — Mode A (User-Driven, existing)

```
User provides keyword → Dashboard API → Auth & Bridge → Article Pipeline → Universal Engine → Output
```

### 2. Article Generation — Mode B (Agent-Recommended, new)

```
User provides category → Content Intelligence (Topic Recommender)
    → Ranked recommendations → User picks one
    → Voice Intelligence (Writer Persona) → Article Pipeline (with voice + data context)
    → Quality Gate (7-signal score, auto-revision loop)
    → Publishing Service → WordPress/Shopify/CMS as draft
    → Feedback Loop (track at 30/60/90 days)
```

### 3. Client Onboarding (new)

```
Sign up → Connect GSC/GA4 via OAuth → Data Ingestion crawls site
    → Voice Intelligence analyzes existing content (auto)
    → Content Intelligence builds content map + decay alerts
    → Dashboard shows recommendations
```

### 4. Content Health Monitoring (new)

```
Scheduler (daily) → Data Ingestion pulls GSC/GA4 → Performance Snapshots
    → Content Intelligence runs decay detection + cannibalization check
    → Dashboard shows alerts → User takes action (refresh/new/merge)
```

### 5. Feedback & Recalibration (new)

```
Published article → Feedback Loop tracks at 30/60/90 days
    → Compare predicted vs actual performance
    → Recalibrate Topic Recommender scoring weights
    → Better recommendations next time
```
