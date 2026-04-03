# Sprint 3: Scheduler + Dashboard + Quality Engine

> **Weeks:** 5-6 | **Capacity:** ~40h (20h/week) | **Committed:** 44h (overcommitted -- see risk flags)
> **Theme:** Automate data pulls, visualize connections/inventory, launch quality scoring

---

## Sprint Goal

Deliver automated daily data pulls via the scheduler, the first two dashboard pages (Connections and Content Inventory), and the 60-point SEO checklist engine that will power quality gating.

---

## Task List

| ID | Task | Effort | Phase | Dependencies | Priority |
| --- | --- | --- | --- | --- | --- |
| DI-005 | Scheduler (tick-based, retry, purge, partitioning) | L (12h) | P5 - Data Ingestion | DI-002, DI-003, DI-004 | P0 |
| DI-006 | Dashboard: Connections + Inventory Pages | XL (16h) | P5 - Data Ingestion | DI-001 endpoints, DI-004 (content_inventory) | P1 |
| QG-001 | 60-Point SEO Checklist + E-E-A-T Rubric | XL (16h) | P7 - Quality Gate | None (independent) | P1 |

### Execution Strategy

- QG-001 is independent of the data pipeline -- start it on Day 1 alongside DI-005
- DI-006 dashboard pages can begin with mock data while DI-005 is being wired
- Recommended order: DI-005 (Days 1-4) || QG-001 (Days 1-5) -> DI-006 (Days 5-10)

---

## Database Migrations

| Migration | Tables | Source |
| --- | --- | --- |
| 009 | performance_snapshots (partitioned), performance_snapshots_monthly | unified-schema.md 3.5-3.6 |
| 012 | quality_scores, quality_revisions | unified-schema.md 3.16-3.17 |

---

## Key Deliverables

After this sprint, the developer can:

1. **Let the scheduler run unattended** -- daily GSC/GA4 pulls fire automatically with retry on failure
2. **Detect stale connections** -- connections marked stale after 48h without a successful sync
3. **Purge old data** -- 90-day purge with monthly rollup preserves trends without bloating the DB
4. **View Connections page** -- OAuth cards with status dots, freshness banner, connect/disconnect buttons
5. **View Content Inventory page** -- DataTable with filters, search, detail slide-over, timeline chart
6. **Score articles against 60-point checklist** -- 8 categories covering title, meta, headings, content, links, images, schema, technical
7. **Grade E-E-A-T** -- A-F grade from 10 dimensions (Experience, Expertise, Authority, Trust x subcategories)

---

## Exit Criteria

All must pass before Sprint 3 is marked complete:

- [ ] Scheduler runs daily pulls unattended for 48+ hours without manual intervention
- [ ] Missed-job recovery: stop scheduler, wait 2 ticks, restart, verify catch-up
- [ ] Staleness detection: connection marked stale after 48h without sync
- [ ] Purge job rolls up data older than 90 days into monthly aggregates, then deletes daily rows
- [ ] Connections page shows OAuth cards with correct status dots (green/yellow/red)
- [ ] Connect button triggers OAuth flow; disconnect button revokes and removes tokens
- [ ] Content Inventory page displays crawled URLs with pagination, column sorting, and filters
- [ ] Detail slide-over shows full metadata for selected URL
- [ ] 60-point checklist scores an article and returns per-category breakdowns
- [ ] E-E-A-T rubric produces A-F grade from 10 dimensions with explanation text
- [ ] Migration 009 creates partitioned performance_snapshots table
- [ ] Migration 012 creates quality_scores and quality_revisions tables

---

## Risk Flags

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| 44h committed against 40h capacity | High | Medium | QG-001 is independent and can spill into Sprint 4 first days if needed |
| Scheduler silently fails on Coolify container restart | Medium | High | Test: restart container, verify missed-job recovery fires |
| performance_snapshots partitioning complexity | Medium | High | Fallback: flat table with purge job; add partitioning later |
| Dashboard pages slow with 10K+ URLs | Medium | Medium | Server-side pagination from day one; lazy-load timeline chart |

---

## Handoff Notes for Sprint 4

Sprint 4 (Decay + Gaps + Quality Agent) needs the following from Sprint 3:

- **Scheduler running** with at least a few days of accumulated GSC/GA4 snapshots
- **performance_snapshots table** populated with daily data (even if only 1-2 weeks)
- **content_inventory** populated from crawler with URL-level metadata
- **60-point checklist engine** callable as `scoreArticle(html)` returning structured results
- **E-E-A-T rubric** callable as `gradeEEAT(html)` returning A-F with dimension scores
- **quality_scores table** ready for QG-002 to write scored results
- Dashboard navigation pattern established for future pages to follow
