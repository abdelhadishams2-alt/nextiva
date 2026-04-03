# ChainIQ — Documentation Coverage Tracker

> **Last Updated:** 2026-03-28
> **Total Documents:** 12 skeleton docs + 1 changelog
> **Coverage:** All 12 services mapped, 15 screens referenced

---

## Documentation Status

### Getting Started (Role-Based Onboarding)

| Guide | Target Role | Status | Screens Referenced |
|-------|------------|--------|-------------------|
| [Admin Onboarding](getting-started/admin-onboarding.md) | Agency owner / admin | Skeleton | Login, Admin Panel, Settings, Connections |
| [Publisher Onboarding](getting-started/publisher-onboarding.md) | Content manager / publisher | Skeleton | Login, Dashboard, Generate, Articles, Pipeline |
| [Developer Setup](getting-started/developer-setup.md) | Developer integrating CMS plugin | Skeleton | API Keys, Plugin Setup |

### Feature Guides

| Guide | Feature Area | Status | Service |
|-------|-------------|--------|---------|
| [Article Generation](guides/article-generation.md) | Creating articles via dashboard | Skeleton | Article Pipeline |
| [Content Intelligence](guides/content-intelligence.md) | Decay detection, gap analysis, recommendations | Skeleton | Content Intelligence |
| [API Key Management](guides/api-key-management.md) | Creating/rotating/revoking API keys | Skeleton | Auth & Bridge |
| [Data Connections](guides/data-connections.md) | Connecting GSC, GA4, Semrush, Ahrefs | Skeleton | Data Ingestion |
| [Voice Profiles](guides/voice-profiles.md) | Brand voice analysis and persona matching | Skeleton | Voice Intelligence |
| [Publishing](guides/publishing.md) | Publishing to WordPress, Shopify, Ghost | Skeleton | Publishing |
| [Quality Reports](guides/quality-reports.md) | Understanding quality gate scores | Skeleton | Quality Gate |

### Tutorials (Multi-Feature Workflows)

| Tutorial | Steps | Status |
|----------|-------|--------|
| [First Article in 5 Minutes](tutorials/first-article.md) | Login → Generate → Review → Edit → Publish | Skeleton |
| [Setting Up Your Content Pipeline](tutorials/content-pipeline.md) | Connect data → Review intelligence → Generate → Quality check → Publish | Skeleton |

### FAQ

| Category | Questions | Status |
|----------|-----------|--------|
| [Account & Billing](faq/account-billing.md) | 8 FAQs | Skeleton |
| [Article Generation](faq/article-generation.md) | 10 FAQs | Skeleton |
| [Troubleshooting](faq/troubleshooting.md) | 8 FAQs | Skeleton |

### Troubleshooting

| Article | Problem Category | Status |
|---------|-----------------|--------|
| [Common Issues](troubleshooting/common-issues.md) | 10 problem/solution pairs | Skeleton |

### Changelog

| File | Status |
|------|--------|
| [changelog.md](changelog.md) | Initialized (v4.6.8 entry) |

---

## Screenshot Manifest

### Web Screenshots Required

| Screen | Breakpoints | States | Priority |
|--------|------------|--------|----------|
| Login page | Desktop, Tablet | Default, Error, Loading | P0 |
| Dashboard overview | Desktop | Default, Empty, Loading | P0 |
| Generate article | Desktop | Form, Progress (SSE), Complete | P0 |
| Article list | Desktop | Default, Empty, Filtered | P1 |
| Pipeline view | Desktop | Active, Completed, Error | P1 |
| Admin panel | Desktop | User list, User detail | P1 |
| Settings | Desktop | General, API Keys, Connections | P1 |
| Quality report | Desktop | Pass, Fail, Partial | P2 |
| Intelligence dashboard | Desktop | Recommendations, Decay alerts | P2 |
| Voice profiles | Desktop | Profile list, Profile detail | P2 |
| Publishing | Desktop | Draft list, Publish confirmation | P2 |
| Blueprint gallery | Desktop | Grid view, Detail panel | P3 |

**Screenshot capture protocol:** Use Playwright to capture screenshots at each milestone. Store in `user_docs/screenshots/web/{screen}-{state}-{breakpoint}.png`.

---

## Coverage Gap Analysis

| Service | Guide | FAQ | Tutorial | Screenshot |
|---------|-------|-----|----------|-----------|
| Auth & Bridge | ✅ | ✅ | ✅ | Planned |
| Article Pipeline | ✅ | ✅ | ✅ | Planned |
| Dashboard API | ✅ (via guides) | ✅ | ✅ | Planned |
| Universal Engine | ✅ (via generation) | ✅ | ✅ | Planned |
| Analytics | ❌ Not yet | ❌ | ❌ | — |
| Admin & Users | ✅ | ✅ | ❌ | Planned |
| Data Ingestion | ✅ | ❌ | ✅ | — |
| Content Intelligence | ✅ | ❌ | ✅ | — |
| Voice Intelligence | ✅ | ❌ | ❌ | — |
| Quality Gate | ✅ | ❌ | ✅ | — |
| Publishing | ✅ | ❌ | ✅ | — |
| Feedback Loop | ❌ Not yet | ❌ | ❌ | — |
