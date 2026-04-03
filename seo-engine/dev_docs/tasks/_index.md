# ChainIQ -- Task Index

> **Last Updated:** 2026-03-28
> **Total Phases:** 10 (Phase 0-4 complete, Phase 5-10 planned)
> **Path:** Enhance -> Platform Expansion
> **Sprint Plan:** [dev_docs/sprints/sprint-plan.md](../sprints/sprint-plan.md)

---

## Phase Overview

### Completed (v1 Article Generation Plugin)

| Phase | Name | Tasks | Status |
| --- | --- | --- | --- |
| 0 | Foundation | 4 tasks (INFRA-001, SEC-001, TEST-001, DOC-001) | Done |
| 1 | Core Features | 5 tasks (DASH-001/002/003, INFRA-002, UNI-001) | Done |
| 2 | Polish | 1 task (POLISH-001: 12 items) | Done |
| 3 | Dashboard-Plugin Integration | 12 streams (A1-A5, B1-B4, C1-C8, D1-D3) | Done |
| 4 | Enhancement Sprint | 4 streams (Edit SSE, Publisher Hub, /generate, Pipeline Audit) | Done |

### Planned (v2 Platform Expansion -- 6 Layers, 10 Sprints)

| Phase | Name | Layer | Tasks | Effort | Sprints |
| --- | --- | --- | --- | --- | --- |
| 5 | Data Ingestion Foundation | L1 | 6 tasks | ~80h | S1-S3 |
| 6 | Content Intelligence | L2 | 5 tasks | ~60h | S4-S6 |
| 7 | Quality Gate | L4 | 3 tasks | ~40h | S3-S5 |
| 8 | Voice Intelligence | L3 | 4 tasks | ~50h | S6-S7 |
| 9 | Universal Publishing | L5 | 5 tasks | ~60h | S7-S9 |
| 10 | Feedback Loop | L6 | 3 tasks | ~30h | S10 |
| | **Total Expansion** | | **26 tasks** | **~320h** | **10 sprints (20 weeks)** |

---

## Execution Order (Platform Expansion)

```
Sprint 1 (Weeks 1-2): DI-001 (OAuth)
    |
Sprint 2 (Weeks 3-4): DI-002 (GSC) + DI-003 (GA4) + DI-004 (Crawler)
    |
Sprint 3 (Weeks 5-6): DI-005 (Scheduler) + DI-006 (Dashboard) + QG-001 (Checklist)
    |                                                                   |
Sprint 4 (Weeks 7-8): CI-001 (Decay) + CI-002 (Gaps) .............. QG-002 (Agent)
    |                                                                   |
Sprint 5 (Weeks 9-10): CI-003 (Recommender) + CI-004 (Semrush) ... QG-003 (Dashboard)
    |
Sprint 6 (Weeks 11-12): CI-005 (Dashboard) + VI-001 (Corpus) + VI-002 (Clustering)
    |
Sprint 7 (Weeks 13-14): VI-003 (Agent) + VI-004 (Dashboard) + PB-001 (Payload)
    |
Sprint 8 (Weeks 15-16): PB-002 (WordPress) + PB-003 (Shopify)
    |
Sprint 9 (Weeks 17-18): PB-004 (CMS Adapters) + PB-005 (Dashboard)

Sprint 10 (Weeks 19-20): FL-001 (Tracker) + FL-002 (Recalibration) + FL-003 (Dashboard)
```

---

## Task Files

### Phase 5: Data Ingestion Foundation (~80h)

| ID | Task | Effort | Sprint | Status |
| --- | --- | --- | --- | --- |
| [DI-001](phase-5/DI-001-oauth-infrastructure.md) | OAuth2 Infrastructure (PKCE + state + proactive refresh) | XL (16h) | S1 | **DONE** |
| [DI-002](phase-5/DI-002-gsc-connector.md) | GSC Connector (25K pagination, 16mo history, health score) | L (12h) | S2 | **DONE** |
| [DI-003](phase-5/DI-003-ga4-connector.md) | GA4 Connector (engagement metrics, GSC merge) | L (12h) | S2 | **DONE** |
| [DI-004](phase-5/DI-004-content-crawler.md) | Content Crawler (sitemap, link-follow, body_text extraction) | L (12h) | S2 | **DONE** |
| [DI-005](phase-5/DI-005-scheduler.md) | Scheduler (tick-based, retry, purge, partitioning) | L (12h) | S3 | **DONE** |
| [DI-006](phase-5/DI-006-dashboard-connections.md) | Dashboard: Connections + Inventory Pages | XL (16h) | S3 | **DONE** |

### Phase 6: Content Intelligence (~60h)

| ID | Task | Effort | Sprint | Status |
| --- | --- | --- | --- | --- |
| [CI-001](phase-6/CI-001-decay-detector.md) | Decay Detection (3 methods, 4-tier classification) | L (12h) | S4 | **DONE** |
| [CI-002](phase-6/CI-002-gap-analyzer.md) | Gap Analysis + Cannibalization (4 resolution strategies) | L (12h) | S4 | **DONE** |
| [CI-003](phase-6/CI-003-topic-recommender.md) | Topic Recommender Agent + Mode B + 5-component scoring | XL (16h) | S5 | **DONE** |
| [CI-004](phase-6/CI-004-semrush-ahrefs.md) | Semrush + Ahrefs Connectors (optional, 7-day cache) | L (8h) | S5 | **DONE** |
| [CI-005](phase-6/CI-005-dashboard-intelligence.md) | Dashboard: Opportunities Page (4 tabs) | L (12h) | S6 | **DONE** |

### Phase 7: Quality Gate (~40h)

| ID | Task | Effort | Sprint | Status |
| --- | --- | --- | --- | --- |
| [QG-001](phase-7/QG-001-seo-checklist-engine.md) | 60-Point SEO Checklist + E-E-A-T Rubric | XL (16h) | S3 | **DONE** |
| [QG-002](phase-7/QG-002-quality-gate-agent.md) | Quality Gate Agent + 7-Signal Scoring + Auto-Revision | L (12h) | S4 | **DONE** |
| [QG-003](phase-7/QG-003-dashboard-quality.md) | Dashboard: Quality Report Page | L (12h) | S5 | **DONE** |

### Phase 8: Voice Intelligence (~50h)

| ID | Task | Effort | Sprint | Status |
| --- | --- | --- | --- | --- |
| [VI-001](phase-8/VI-001-corpus-analyzer.md) | Corpus Crawler + AI/Human Classifier (6 stylometric signals) | XL (16h) | S6 | **DONE** |
| [VI-002](phase-8/VI-002-writer-clustering.md) | HDBSCAN Clustering + Persona Generation (12-dim features) | L (12h) | S6 | **DONE** |
| [VI-003](phase-8/VI-003-voice-analyzer-agent.md) | Voice Analyzer Agent + Pipeline Integration | L (12h) | S7 | **DONE** |
| [VI-004](phase-8/VI-004-dashboard-voice.md) | Dashboard: Voice Profiles Page | L (10h) | S7 | **DONE** |

### Phase 9: Universal Publishing (~60h)

| ID | Task | Effort | Sprint | Status |
| --- | --- | --- | --- | --- |
| [PB-001](phase-9/PB-001-universal-payload.md) | Universal Article Payload + Image CDN Pipeline | L (8h) | S7 | **DONE** |
| [PB-002](phase-9/PB-002-wordpress-plugin.md) | WordPress Plugin (PHP, wp_insert_post, Yoast/RankMath) | XL (20h) | S8 | **DONE** |
| [PB-003](phase-9/PB-003-shopify-app.md) | Shopify Adapter (Blog API, product awareness) | L (12h) | S8 | **DONE** |
| [PB-004](phase-9/PB-004-cms-adapters.md) | Headless CMS Adapters (5 platforms) + Generic Webhook | L (12h) | S9 | **DONE** |
| [PB-005](phase-9/PB-005-dashboard-publishing.md) | Dashboard: Publish Manager Page | L (8h) | S9 | **DONE** |

### Phase 10: Feedback Loop (~30h)

| ID | Task | Effort | Sprint | Status |
| --- | --- | --- | --- | --- |
| [FL-001](phase-10/FL-001-performance-tracker.md) | 30/60/90 Day Performance Tracker | L (12h) | S10 | **DONE** |
| [FL-002](phase-10/FL-002-recalibration.md) | Scoring Weight Recalibration Engine | L (10h) | S10 | **DONE** |
| [FL-003](phase-10/FL-003-dashboard-performance.md) | Dashboard: Performance Page + Reports | L (8h) | S10 | **DONE** |

---

## Database Migrations

| Migration | Sprint | Tables | Source Spec |
| --- | --- | --- | --- |
| 007 | S1 | client_connections, oauth_states, ingestion_jobs, api_cache | unified-schema.md 3.1-3.2, 3.7-3.8 |
| 008 | S2 | content_inventory, crawl_sessions | unified-schema.md 3.3-3.4 |
| 009 | S3 | performance_snapshots (partitioned), performance_snapshots_monthly | unified-schema.md 3.5-3.6 |
| 010 | S4 | keyword_opportunities, analysis_runs, recommendation_history, cannibalization_conflicts | unified-schema.md 3.9-3.12 |
| 011 | S6 | writer_personas, analysis_sessions, voice_match_scores | unified-schema.md 3.13-3.15 |
| 012 | S3 | quality_scores, quality_revisions | unified-schema.md 3.16-3.17 |
| 014 | S8 | platform_connections | unified-schema.md 3.18 |
| 015 | S8 | publish_records, image_upload_log | unified-schema.md 3.19-3.20 |
| 016 | S10 | performance_predictions, scoring_weight_history | unified-schema.md 3.21-3.22 |
| 017 | S10 | performance_reports | unified-schema.md 3.23 |

**Total new tables:** 23 (bringing total from 9 to 32)
