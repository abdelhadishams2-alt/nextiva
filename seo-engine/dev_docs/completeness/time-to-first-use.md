# ChainIQ — Time-to-First-Use Timeline

> **Created:** 2026-03-28
> **Step:** 8.55
> **Approved Order:** Original bottom-up (5→6→7→8→9→10)

---

## Approved Phase Execution Order

| Order | Phase | Layer | Usability Milestone | Replaces | Standalone | Effort |
|-------|-------|-------|---------------------|----------|------------|--------|
| 1 | Phase 5: Data Ingestion | L1 | Connect GSC/GA4, see full content inventory with metrics | Manual GSC checks, spreadsheet URL tracking | YES | ~80h |
| 2 | Phase 6: Content Intelligence | L2 | Decay alerts, gap analysis, scored topic recommendations | Manual Semrush/Ahrefs analysis, gut-feel topic picks | YES | ~60h |
| 3 | Phase 7: Quality Gate | L4 | Auto-score articles (7-signal, 60-point SEO checklist) | Manual SEO review, subjective quality judgment | YES | ~40h |
| 4 | Phase 8: Voice Intelligence | L3 | Brand voice analysis, writer persona matching | Manual style guides, inconsistent tone | YES | ~50h |
| 5 | Phase 9: Universal Publishing | L5 | One-click publish to WordPress/Shopify/Ghost as draft | Copy-paste HTML into CMS admin | YES | ~60h |
| 6 | Phase 10: Feedback Loop | L6 | 30/60/90 day tracking, prediction vs actual, recalibration | Manual GSC tracking months later | NO | ~30h |

---

## Timeline

```
APPROVED TIME-TO-FIRST-USE TIMELINE
=====================================
After Phase 0-4 (done):       Auth + dashboard + article generation working
After Phase 5 (~weeks 1-6):   Data Ingestion → GSC/GA4 connected, content inventory visible
After Phase 6 (~weeks 7-12):  Intelligence → decay alerts, topic recommendations ← DAILY WORKFLOW
After Phase 7 (~weeks 13-15): Quality Gate → articles auto-scored before publish
After Phase 8 (~weeks 15-17): Voice → brand voice matching, writer personas
After Phase 9 (~weeks 17-19): Publishing → one-click WordPress/Shopify publish
After Phase 10 (~weeks 19-20): Feedback → performance tracking, recalibration ← FULL LOOP CLOSES
```

---

## Rationale

User approved bottom-up layer order. Data Ingestion (L1) is the foundation — Content Intelligence (L2) and Voice Intelligence (L3) both depend on content inventory data from L1. Building layers sequentially ensures each layer has its data dependencies satisfied before development begins.

Trade-off acknowledged: Quality Gate (L4) and Publishing (L5) are independent of L1-L3 and could have been built earlier for faster usable value. User chose architectural coherence over speed-to-first-use.

---

## Dependency Validation

```
Phase 5 (Data Ingestion)     → depends on: Phase 0-4 (done) ✓
Phase 6 (Content Intelligence) → depends on: Phase 5 ✓
Phase 7 (Quality Gate)        → depends on: Phase 0-4 (done) ✓ — independent of 5/6
Phase 8 (Voice Intelligence)  → depends on: Phase 5 ✓
Phase 9 (Universal Publishing) → depends on: Phase 0-4 (done) ✓ — independent of 5/6
Phase 10 (Feedback Loop)      → depends on: Phase 5 + Phase 6 ✓
```

No dependency violations in the approved order.
