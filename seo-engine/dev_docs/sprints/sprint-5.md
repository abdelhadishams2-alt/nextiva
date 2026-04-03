# Sprint 5: Recommender + External Data + Quality Dashboard

> **Weeks:** 9-10 | **Capacity:** ~40h (20h/week) | **Committed:** 36h
> **Theme:** Intelligent topic recommendations, third-party data enrichment, and quality visualization

---

## Sprint Goal

Ship the topic recommender agent with 5-component scoring, wire Mode B into the pipeline, add optional Semrush/Ahrefs enrichment, and deliver the quality report dashboard page.

---

## Task List

| ID | Task | Effort | Phase | Dependencies | Priority |
| --- | --- | --- | --- | --- | --- |
| CI-003 | Topic Recommender Agent + Mode B + 5-component scoring | XL (16h) | P6 - Content Intelligence | CI-001 (decay), CI-002 (gaps) | P0 |
| CI-004 | Semrush + Ahrefs Connectors (optional, 7-day cache) | L (8h) | P6 - Content Intelligence | DI-001 (client_connections for API keys) | P2 |
| QG-003 | Dashboard: Quality Report Page | L (12h) | P7 - Quality Gate | QG-001, QG-002 (quality engine + agent) | P1 |

### Execution Strategy

- CI-003 is the largest and most critical -- start Day 1
- CI-004 is lower priority (P2) and smallest -- slot between CI-003 and QG-003
- QG-003 can start once the quality score data format is finalized
- Recommended order: CI-003 (Days 1-6) -> CI-004 (Days 6-8) || QG-003 (Days 5-10)

---

## Database Migrations

No new migrations in Sprint 5. Uses tables from migrations 010 (Sprint 4) and 012 (Sprint 3).

---

## Key Deliverables

After this sprint, the developer can:

1. **Get ranked topic recommendations** -- 5-component scoring formula (impressions 0.3, decay 0.25, gap 0.25, seasonality 0.1, competition 0.1) produces prioritized list
2. **Use Mode B** -- category input -> AI recommendations -> user picks topics -> pipeline generates articles
3. **Enrich with Semrush/Ahrefs** -- optional keyword volume, difficulty, and trend data with 7-day cache
4. **View Quality Report page** -- score ring, 7-signal bars, 60-item checklist panel, E-E-A-T radar chart
5. **Trigger re-score and auto-fix** from the dashboard with button clicks

---

## Exit Criteria

All must pass before Sprint 5 is marked complete:

- [ ] Scoring formula produces ranked recommendations from real GSC/GA4 data
- [ ] Recommendations include: topic, target keyword, score breakdown, suggested angle
- [ ] Mode B pipeline: category input -> recommendations list -> user selection -> article generation
- [ ] topic-recommender.md agent file created and callable from SKILL.md
- [ ] Semrush connector pulls keyword volume + difficulty (graceful degradation if no API key)
- [ ] Ahrefs connector pulls DR + backlink count (graceful degradation if no API key)
- [ ] 7-day cache prevents redundant Semrush/Ahrefs API calls
- [ ] Quality report page shows: score ring (0-100), 7-signal bar chart, checklist panel
- [ ] E-E-A-T radar chart displays 10 dimensions with A-F grade
- [ ] "Re-score" button triggers fresh quality analysis
- [ ] "Auto-fix" button triggers quality gate agent revision loop

---

## Risk Flags

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Semrush/Ahrefs API costs higher than estimated | Medium | Medium | Run 2-3 day cost modeling spike before committing; set hard monthly cap |
| Scoring formula weights produce poor recommendations | Medium | Medium | Validate with real client test data; Sprint 10 FL-002 recalibrates weights |
| Mode B UX confusing for users | Low | Medium | Keep it simple: list -> checkboxes -> generate; iterate on UX later |
| Quality report page slow with many articles | Low | Low | Paginate article list; render charts client-side with lazy loading |

---

## Handoff Notes for Sprint 6

Sprint 6 (Intelligence Dashboard + Voice Foundation) needs the following from Sprint 5:

- **Recommendation endpoint** returning scored topic list for CI-005 Opportunities page
- **Keyword opportunities** enriched with Semrush/Ahrefs data (if available) in keyword_opportunities table
- **Quality scores** stored in quality_scores table for dashboard visualization patterns
- **Dashboard component patterns** from QG-003 (chart components, score ring, radar chart) reusable for CI-005 and VI-004
- Mode B pipeline documented with entry points for the Opportunities dashboard to use
