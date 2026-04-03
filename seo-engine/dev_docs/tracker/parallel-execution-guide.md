# ChainIQ — Parallel Execution Guide

> **Last Updated:** 2026-03-28

## Work Streams

| Stream | Tasks | Shared Resources |
|--------|-------|-----------------|
| Data Pipeline | DI-001 through DI-006 | bridge/server.js, migrations/ |
| Intelligence | CI-001 through CI-005 | bridge/intelligence/, content_inventory table |
| Quality | QG-001 through QG-003 | bridge/quality/, agents/ |
| Voice | VI-001 through VI-004 | bridge/voice/, writer_personas table |
| Publishing | PB-001 through PB-005 | bridge/publishing/, CMS plugins |
| Feedback | FL-001 through FL-003 | bridge/feedback/, performance tables |

---

## Parallel Opportunities (within sprints)

### Sprint 1 (Weeks 1-2)
- **DI-001** only — foundation task, no parallelism available
- Sets up bridge/server.js, database schema, project scaffolding

### Sprint 2 (Weeks 3-4)
- **DI-002 || DI-004** — GSC connector and content crawler are independent; different APIs, different tables
- DI-002 touches `bridge/connectors/gsc.js` + `migrations/002_gsc_data.sql`
- DI-004 touches `bridge/crawlers/sitemap.js` + `migrations/004_content_inventory.sql`
- Merge point: both register routes in server.js (sequential registration)

### Sprint 3 (Weeks 5-6)
- **DI-003 || DI-005** — GA4 connector and scheduler are independent modules
- DI-003 touches `bridge/connectors/ga4.js` + `migrations/003_ga4_data.sql`
- DI-005 touches `bridge/scheduler/` + cron configuration
- **DI-006** depends on DI-002 + DI-003 (needs both connectors for encryption layer)

### Sprint 4 (Weeks 7-8)
- **CI-001 || CI-002** — decay detection and topic gap analysis use different algorithms on same input table
- CI-001 touches `bridge/intelligence/decay.js`
- CI-002 touches `bridge/intelligence/topic-gaps.js`
- Both read from content_inventory (read-only, no conflict)

### Sprint 5 (Weeks 9-10)
- **CI-003 || CI-004 || QG-001** — three independent modules
- CI-003: `bridge/intelligence/recommender.js` (topic recommendations)
- CI-004: `bridge/intelligence/cannibalization.js` (cannibalization detection)
- QG-001: `bridge/quality/checklist.js` (60-point SEO checklist)
- All read from content_inventory, none modify shared state

### Sprint 6 (Weeks 11-12)
- **QG-002 || QG-003 || CI-005** — scoring, dashboard, and alerts
- QG-002: `bridge/quality/scoring.js` (7-signal scoring engine)
- QG-003: `bridge/quality/dashboard.js` (quality dashboard UI)
- CI-005: `bridge/intelligence/alerts.js` (alert/notification system)
- QG-003 is UI-only, always safe to parallelize

### Sprint 7 (Weeks 13-14)
- **VI-001 || VI-002** — voice analyzer and persona builder
- VI-001: `bridge/voice/analyzer.js` (style fingerprint extraction)
- VI-002: `bridge/voice/personas.js` + `migrations/007_writer_personas.sql`
- VI-001 must complete before VI-003 (voice matching depends on analyzer output)

### Sprint 8 (Weeks 15-16)
- **VI-003 || VI-004 || PB-001** — voice matching, persona editor, and WP connector
- VI-003: `bridge/voice/matcher.js` (voice-matched generation)
- VI-004: `bridge/voice/editor.js` (persona tuning UI)
- PB-001: `bridge/publishing/wordpress.js` (WordPress REST API integration)
- All touch different directories, fully independent

### Sprint 9 (Weeks 17-18)
- **PB-002 || PB-003 || PB-004** — Shopify connector, image handling, taxonomy mapping
- PB-002: `bridge/publishing/shopify.js`
- PB-003: `bridge/publishing/images.js`
- PB-004: `bridge/publishing/taxonomy.js`
- All independent CMS integration modules

### Sprint 10 (Weeks 19-20)
- **PB-005 || FL-001 || FL-002** — publish preview + feedback trackers
- PB-005: `bridge/publishing/preview.js` (publish preview UI)
- FL-001: `bridge/feedback/tracker.js` (30/60/90 day tracking)
- FL-002: `bridge/feedback/recalibration.js` (auto-recalibration engine)
- **FL-003** depends on FL-001 + FL-002 (feedback dashboard needs both)

---

## Conflict Prevention Rules

1. **Only one task modifies `bridge/server.js` at a time** — route registration is sequential. When two tasks finish in parallel, merge routes one at a time.
2. **Migration files are numbered** — never create concurrent migrations with the same number. Use the convention `NNN_description.sql` and assign numbers before sprint starts.
3. **Dashboard pages are independent** — UI components in `pages/` or `components/` can always be built in parallel as long as shared layout components are not modified simultaneously.
4. **Database reads are safe** — multiple tasks can read from the same table concurrently. Only flag conflicts when two tasks write to the same table.
5. **Test files mirror source files** — `bridge/intelligence/decay.js` tests go in `tests/intelligence/decay.test.js`. No test file collisions if source files don't collide.
6. **Package.json modifications are sequential** — if two tasks add dependencies, one installs first, the other rebases.
7. **Environment variables** — new env vars are added to `.env.example` sequentially. Document in the task which vars are needed.

---

## Agent-Based Parallel Execution

When using Claude Code agents for parallel work:

### Setup
- Each agent gets **one task** with its own file set
- Provide each agent with: task ID, file list, migration number, route registration snippet
- Shared files (`server.js`, `migrations/`) are **sequential only** — never assign to parallel agents

### File Ownership Per Task
```
Agent A (DI-002):
  OWNS:  bridge/connectors/gsc.js, tests/connectors/gsc.test.js
  READS: bridge/server.js (does not modify)
  NEEDS: migration number 002

Agent B (DI-004):
  OWNS:  bridge/crawlers/sitemap.js, tests/crawlers/sitemap.test.js
  READS: bridge/server.js (does not modify)
  NEEDS: migration number 004
```

### Merge Protocol
1. Both agents complete their work in separate branches
2. Merge Agent A's branch first (includes server.js route)
3. Rebase Agent B's branch, add its route to server.js
4. Run full test suite after both merges
5. If conflicts: the task with the lower ID takes priority

### Safe to Parallelize (Always)
- Dashboard UI pages (different routes, different components)
- Independent algorithm modules (decay vs. topic gaps)
- Different CMS connectors (WordPress vs. Shopify)
- Test file creation (mirrors source file ownership)

### Never Parallelize
- Two tasks that both add database migrations
- Two tasks that both modify server.js route table
- A task and its direct dependency (e.g., analyzer before matcher)
- Package.json dependency additions

---

## Sprint Parallelism Summary

| Sprint | Max Parallel Tasks | Bottleneck |
|--------|--------------------|------------|
| S1 | 1 | Foundation — everything depends on this |
| S2 | 2 | server.js route merge after both complete |
| S3 | 2 (+1 sequential) | DI-006 waits for DI-002 + DI-003 |
| S4 | 2 | Both read-only on content_inventory |
| S5 | 3 | Best sprint for parallelism |
| S6 | 3 | QG-003 UI is fully independent |
| S7 | 2 | VI-001 must finish before VI-003 next sprint |
| S8 | 3 | Cross-stream parallelism (voice + publishing) |
| S9 | 3 | All independent CMS modules |
| S10 | 3 (+1 sequential) | FL-003 waits for FL-001 + FL-002 |

**Theoretical max speedup:** ~1.8x over pure sequential (26 tasks, ~14-15 critical path tasks).
