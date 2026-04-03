# Sprint 6: Intelligence Dashboard + Voice Foundation

> **Weeks:** 11-12 | **Capacity:** ~40h (20h/week) | **Committed:** 40h
> **Theme:** Content intelligence visualization and voice analysis foundation

---

## Sprint Goal

Deliver the 4-tab Opportunities dashboard page for content intelligence, and build the voice analysis foundation with corpus crawling, AI/human classification, and writer clustering into personas.

---

## Task List

| ID | Task | Effort | Phase | Dependencies | Priority |
| --- | --- | --- | --- | --- | --- |
| CI-005 | Dashboard: Opportunities Page (4 tabs) | L (12h) | P6 - Content Intelligence | CI-001, CI-002, CI-003, DI-006 (nav pattern) | P1 |
| VI-001 | Corpus Crawler + AI/Human Classifier (6 stylometric signals) | XL (16h) | P8 - Voice Intelligence | None (independent of intelligence pipeline) | P1 |
| VI-002 | Writer Clustering + Persona Generation (12-dim features) | L (12h) | P8 - Voice Intelligence | VI-001 (corpus data) | P1 |

### Execution Strategy

- VI-001 is independent of the intelligence pipeline -- start Day 1 in parallel with CI-005
- VI-002 depends on VI-001 output -- start after VI-001 corpus analysis is functional
- Recommended order: CI-005 (Days 1-5) || VI-001 (Days 1-6) -> VI-002 (Days 7-10)

---

## Database Migrations

| Migration | Tables | Source |
| --- | --- | --- |
| 011 | writer_personas, analysis_sessions, voice_match_scores | unified-schema.md 3.13-3.15 |

---

## Key Deliverables

After this sprint, the developer can:

1. **View Opportunities page** with 4 tabs: Recommendations, Keyword Gaps, Cannibalization, Decay Alerts
2. **Accept recommendations** -- "Accept & Generate" creates a pipeline job from a recommendation
3. **Dismiss recommendations** -- mark as dismissed with reason, excluded from future scoring
4. **Resolve cannibalization** -- pick a resolution strategy (merge, redirect, differentiate, deoptimize)
5. **Crawl a corpus** -- fetch 50-100 articles from a client site for voice analysis
6. **Classify content** -- each article tagged as HUMAN / HYBRID / AI-GENERATED using 6 stylometric signals
7. **Discover writer clusters** -- HDBSCAN clustering on 12-dimension feature vectors
8. **Generate personas** -- structured personas with name, voice description, cadence, vocabulary, avoids list

---

## Exit Criteria

All must pass before Sprint 6 is marked complete:

- [ ] Opportunities page renders 4 tabs with real intelligence data from Sprint 4-5
- [ ] Recommendations tab shows scored topics with "Accept & Generate" and "Dismiss" buttons
- [ ] Keyword Gaps tab lists gaps with impressions, clicks, and suggested actions
- [ ] Cannibalization tab shows conflicting URL pairs with resolution strategy picker
- [ ] Decay Alerts tab shows DECAYING/DECLINING/DEAD URLs with trend sparklines
- [ ] "Accept & Generate" creates a pipeline job and navigates to generation view
- [ ] Migration 011 creates writer_personas, analysis_sessions, voice_match_scores tables
- [ ] Corpus analyzer crawls 50-100 articles and extracts 6 stylometric signals per article
- [ ] Classifier produces HUMAN/HYBRID/AI-GENERATED labels with confidence scores
- [ ] Corpus sufficiency check enforced: minimum 30 human articles required for clustering
- [ ] HDBSCAN discovers writer clusters from 12-dimension feature vectors
- [ ] Structured personas generated with: name, voice, cadence, vocabulary, avoids, sentence patterns

---

## Risk Flags

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| HDBSCAN in pure JS produces inferior clustering | Medium | Medium | Fallback: simplified k-means; consider Python shim for production |
| Insufficient human articles for clustering (<30) | Medium | High | Graceful fallback to manual persona creation; show warning in UI |
| 40h committed equals full capacity | Medium | Medium | CI-005 reuses dashboard patterns from Sprint 3/5; VI-001 and VI-002 are sequential |
| Stylometric signals unreliable for short articles (<500 words) | Low | Medium | Set minimum word count threshold; exclude short articles from analysis |

---

## Handoff Notes for Sprint 7

Sprint 7 (Voice Agent + Voice Dashboard + Payload) needs the following from Sprint 6:

- **writer_personas table** populated with at least 2-3 generated personas from test corpus
- **analysis_sessions** with completed corpus crawl and classification results
- **Persona data format** documented: name, voice, cadence, vocabulary, avoids, sentence patterns
- **voice_match_scores** schema ready for the voice analyzer agent to write match results
- **Dashboard component library** now includes: DataTable, score ring, radar chart, sparkline, tab navigation, detail slide-over -- all reusable for VI-004
