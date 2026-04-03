# Sprint 4: Intelligence Core

> **Weeks:** 7-8 | **Capacity:** ~40h (20h/week) | **Committed:** 36h
> **Theme:** Content decay detection, gap analysis, and the quality gate agent

---

## Sprint Goal

Bring the content intelligence layer to life with decay detection, keyword gap analysis, cannibalization detection, and an AI quality gate agent that can auto-revise articles that fail scoring thresholds.

---

## Task List

| ID | Task | Effort | Phase | Dependencies | Priority |
| --- | --- | --- | --- | --- | --- |
| CI-001 | Decay Detection (3 methods, 4-tier classification) | L (12h) | P6 - Content Intelligence | DI-002 (GSC snapshots), DI-005 (historical data) | P0 |
| CI-002 | Gap Analysis + Cannibalization (4 resolution strategies) | L (12h) | P6 - Content Intelligence | DI-002 (GSC data), DI-004 (content_inventory) | P0 |
| QG-002 | Quality Gate Agent (7-signal scoring, auto-revision) | L (12h) | P7 - Quality Gate | QG-001 (checklist engine) | P1 |

### Execution Strategy

- CI-001 and CI-002 share GSC data patterns -- build CI-001 first, then CI-002 reuses query logic
- QG-002 is independent of the intelligence pipeline -- can run in parallel
- Recommended order: CI-001 (Days 1-4) -> CI-002 (Days 4-7) || QG-002 (Days 1-5)

---

## Database Migrations

| Migration | Tables | Source |
| --- | --- | --- |
| 010 | keyword_opportunities, analysis_runs, recommendation_history, cannibalization_conflicts | unified-schema.md 3.9-3.12 |

---

## Key Deliverables

After this sprint, the developer can:

1. **Detect decaying content** -- 3 methods (click decline, position slip, content age) classify URLs as HEALTHY / DECAYING / DECLINING / DEAD
2. **Find keyword gaps** -- keywords with impressions but no dedicated content page
3. **Detect cannibalization** -- multiple URLs competing for the same query cluster
4. **Get resolution recommendations** -- merge, redirect, differentiate, or deoptimize with confidence scores
5. **Score articles with quality gate** -- 7 weighted signals producing a composite quality score
6. **Auto-revise failing articles** -- agent sends fix instructions and re-scores (max 2 passes)

---

## Exit Criteria

All must pass before Sprint 4 is marked complete:

- [ ] Decay detection produces alerts for URLs with 20%+ traffic decline over 30 days
- [ ] 4-tier classification (HEALTHY/DECAYING/DECLINING/DEAD) applied to all tracked URLs
- [ ] Gap analysis identifies keywords with 500+ impressions and no dedicated page
- [ ] Cannibalization detects 2+ URLs competing for same query (cosine similarity > 0.7)
- [ ] 4 resolution strategies recommended with confidence scores
- [ ] Migration 010 creates 4 tables with RLS policies and indexes
- [ ] Quality gate agent scores articles against 7 weighted signals
- [ ] Composite score produces PASS / NEEDS_REVISION / FAIL verdict
- [ ] Auto-revision loop sends fix instructions to draft-writer and re-scores (max 2 passes)
- [ ] Auto-revision preserves passing sections -- only fixes failing signals
- [ ] All analysis results stored in analysis_runs with timestamps

---

## Risk Flags

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Insufficient historical data for decay detection | Medium | High | 16-month GSC import from Sprint 2 should provide enough; seed with CSV if needed |
| Gap analysis accuracy limited without Semrush/Ahrefs data | High | Medium | Sprint 4 is GSC-only; Semrush enrichment arrives in Sprint 5 (CI-004) |
| Auto-revision loop degrades article quality on 2nd pass | Low | Medium | Conservative approach: only fix failing signals, preserve passing sections |
| Cannibalization false positives on branded queries | Medium | Low | Exclude branded keywords from cannibalization analysis |

---

## Handoff Notes for Sprint 5

Sprint 5 (Recommender + Semrush + Quality Dashboard) needs the following from Sprint 4:

- **Decay scores** per URL callable via `getDecayStatus(url)` or from analysis_runs table
- **Gap analysis results** with keyword opportunities stored in keyword_opportunities table
- **Cannibalization conflicts** stored in cannibalization_conflicts table
- **Quality gate agent** callable as part of the article generation pipeline
- **7-signal scoring** accessible for the Quality Dashboard (QG-003) to visualize
- CI-001 and CI-002 output formats documented for CI-003 scoring formula inputs
