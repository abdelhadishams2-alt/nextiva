# ChainIQ Gap Traceability Matrix

**Step 8.5 -- Companion to phase-coverage.md**
**Last Updated:** 2026-03-28
**Source:** All completeness verification steps (3, 4.5, 6.5, 6.6, 8)
**Purpose:** Trace every gap from every step to its resolution -- task file, deferral decision, or merge into existing task
**Status:** COMPLETE -- ALL GAPS ADDRESSED

---

## Methodology

Every gap identified in the completeness verification pipeline is logged here with:
1. **Gap ID** -- unique identifier
2. **Source** -- which verification step discovered it
3. **Description** -- what is missing or broken
4. **Severity** -- Critical / High / Medium / Low
5. **Resolution** -- how it was addressed (task, deferral, or merge)
6. **Task/File** -- specific task file or document that implements the fix
7. **Verified** -- confirmation that the resolution is traceable to a concrete deliverable

---

## Section 1: Cross-Service Workflow Gaps (Step 4.5)

These gaps were discovered during cross-service workflow validation in `cross-service-workflow-validation.md`.

| Gap ID | Source | Description | Severity | Resolution | Task/File | Verified |
|--------|--------|-------------|----------|------------|-----------|----------|
| WF-001 | Step 4.5 -- Workflow 2 (Client Onboarding), Boundary 2 | **body_text column missing from content_inventory.** The HTTP content crawler stores metadata (title, URL, word count, headings) but NOT the actual article body text. Voice Intelligence requires prose content for stylometric analysis (sentence length variance, TTR, hedging frequency, cliche density, paragraph rhythm). Without body_text, the entire Voice Intelligence pipeline cannot function during onboarding. | **HIGH** | RESOLVED in DI-004. The content crawler task explicitly includes body_text extraction. Task objective states: "body_text extraction (fixing broken chain #1 from the tribunal where content_inventory lacked actual page content for intelligence analysis)." The crawler fetches HTML, extracts main content area via regex selectors (`<article>`, `<main>`, `.post-content`, `.entry-content`), strips navigation/sidebar/footer, and stores prose in the `body_text TEXT` column. Migration 008 (content_inventory DDL) includes the body_text column. | `dev_docs/tasks/phase-5/DI-004-content-crawler.md` -- Sub-task 1 (text extraction) + migration 008 | YES -- DI-004 objective explicitly references this broken chain. Migration 008 includes body_text column. |
| WF-002 | Step 4.5 -- Workflow 1 (Mode B Generation), Boundary 7 + Workflow 4 (Performance Feedback), Boundary 2 | **scoring_weights storage undefined for per-client recalibration.** The Feedback Loop recalibration engine adjusts the Content Intelligence scoring formula weights per client, but no column or table exists to store per-client calibrated weights. The scoring formula weights (impressions 0.30, decay_severity 0.25, gap_size 0.25, seasonality_bonus 0.10, competition_inverse 0.10) are hardcoded defaults with no override mechanism. Affects 2 workflows (same root cause). | **MEDIUM** | RESOLVED in FL-002. The recalibration engine task creates weight storage and override logic. Sub-task 1 documents the current scoring model with default weights. The engine writes adjusted weights per client. Weight bounds enforced: 0.05-0.40 per factor, sum must equal 1.0. Dry-run mode allows previewing changes before applying. Admin-triggered with history tracking. The Content Intelligence scoring formula (CI-003) reads per-client weights when available, falling back to defaults. | `dev_docs/tasks/phase-10/FL-002-recalibration.md` -- Sub-tasks 1-3 (model reference, error analysis, weight adjustment) | YES -- FL-002 explicitly addresses weight storage with bounds validation and dry-run safety. |
| WF-003 | Step 4.5 -- Workflow 5 (Section Edit Extended), Boundary 3 | **Auto-re-scoring after section edit not wired.** When a user edits a section via the bridge server's Claude CLI subprocess, the article is updated but the 7-signal quality score is NOT recalculated. The edit completes and the article is saved, but the quality gate does not re-evaluate. If a high-quality article (8/10) has a section rewritten that introduces keyword stuffing or breaks heading hierarchy, the stale score remains. | **LOW** | DEFERRED to hardening phase. Manual "Re-score" button is included in QG-003 dashboard quality report page. The button triggers `POST /api/quality/score` for the article, which runs the full 60-point checklist + 7-signal scoring. Auto-trigger after every edit was deemed too expensive -- a section edit may take 1-5 minutes, and a quality re-score adds another 30-60 seconds. For minor edits (fixing a typo, rephrasing a sentence), automatic re-scoring would create unnecessary latency. Deferral rationale: manual re-score provides same coverage with user control. Auto-trigger can be added as a toggle in Plugin Configuration during hardening. | `dev_docs/tasks/phase-7/QG-003-dashboard-quality.md` -- "Re-score" button in Sub-task 3 | YES -- QG-003 includes explicit "Re-score" action. Auto-trigger documented as hardening candidate. |

---

## Section 2: Service Matrix Gaps (Step 3)

| Gap ID | Source | Description | Severity | Resolution | Task/File | Verified |
|--------|--------|-------------|----------|------------|-----------|----------|
| SM-000 | Step 3 -- Service Matrix | **No gaps found.** All 93 features mapped to services. 0 unmapped features. 0 phantom services. All 10 personas have deal-breaker features covered. | N/A | N/A -- no action required | `dev_docs/completeness/service-matrix.md` -- Section 4 (Gap Check) | YES -- service-matrix.md Section 4 confirms 0 gaps. |

---

## Section 3: Screen Matrix Gaps (Step 6.5)

| Gap ID | Source | Description | Severity | Resolution | Task/File | Verified |
|--------|--------|-------------|----------|------------|-----------|----------|
| SC-000 | Step 6.5 -- Screen Matrix | **No gaps found.** 26/26 Must Have features have screens. 40/40 Should Have features have screens. 0 phantom screens. All 15 screens call at least 2 API endpoints. 2 Won't Have features correctly excluded. | N/A | N/A -- no action required | `dev_docs/completeness/screen-matrix.md` -- Section 3 (Validation Results) | YES -- screen-matrix.md Section 3.5 confirms 0 gaps. |

---

## Section 4: UI State Matrix Gaps (Step 6.6)

These gaps were discovered during UI state completeness verification in `ui-state-matrix.md`. All are LOW severity -- cosmetic or documentation-level refinements, not functional gaps.

| Gap ID | Source | Description | Severity | Resolution | Task/File | Verified |
|--------|--------|-------------|----------|------------|-----------|----------|
| UI-001 | Step 6.6 -- UI State Matrix, Section 3.3, G-01 | **Login/Signup lacks rate-limit feedback state.** After 5 failed login attempts, the rate limiter blocks further attempts but the UI shows no specific feedback. User sees a generic error instead of "Too many attempts, try again in X seconds." | LOW | RESOLVED via pattern specification. The ui-state-matrix.md prescribes a `BANNER` pattern with countdown timer for rate-limit feedback on the Login/Signup screen. The bridge server's existing rate limiter returns a 429 status code with `Retry-After` header -- the dashboard Login page must surface this as a descriptive inline banner. No task file needed -- this is a sub-requirement within the existing DASH-001 (scaffold dashboard) login page implementation. | `dev_docs/completeness/ui-state-matrix.md` -- Section 3.3, G-01 resolution + `dev_docs/tasks/phase-1/DASH-001-scaffold-dashboard.md` (login page) | YES -- Pattern documented. Login page implementation will follow ui-state-matrix rules. |
| UI-002 | Step 6.6 -- UI State Matrix, Section 3.3, G-02 | **Dashboard Home lacks explicit refresh-in-progress state.** When a user manually refreshes dashboard widgets, there is no visual indicator that a refresh is occurring vs. the data being stale. | LOW | RESOLVED via documentation. The ui-state-matrix.md confirms this is already covered by the partial `SKEL` pattern -- individual widget cards show Skeleton overlays during refresh while other widgets remain populated. No code gap exists; the pattern is already specified in the Standard Pattern Catalog (Section 1.1, `SKEL` pattern). | `dev_docs/completeness/ui-state-matrix.md` -- Section 3.3, G-02 resolution | YES -- Covered by existing SKEL pattern. Documentation-level only. |
| UI-003 | Step 6.6 -- UI State Matrix, Section 3.3, G-03 | **Article Detail lacks version comparison state.** When comparing published vs. generated versions of an article, no split-pane diff view exists. | LOW | RESOLVED via pattern specification. The ui-state-matrix.md prescribes a `DRAWER`-based split-pane diff view showing side-by-side content. This aligns with feature #60 (version control: generated vs published) which is already mapped to the Article Detail screen (04) in the screen-matrix. Implementation will occur in the DASH-002 article detail page with version tab, extended by PB-005 publish manager integration. | `dev_docs/completeness/ui-state-matrix.md` -- Section 3.3, G-03 resolution + `dev_docs/tasks/phase-1/DASH-002-dashboard-api-articles.md` | YES -- Pattern documented. Version tab implementation will include diff view. |
| UI-004 | Step 6.6 -- UI State Matrix, Section 3.3, G-04 | **Performance page lacks date-range-loading state.** When the user changes the date range filter on the Performance dashboard, charts reload without per-chart loading indicators. | LOW | RESOLVED via pattern specification. The ui-state-matrix.md prescribes `SKEL` overlays on individual chart components rather than full page reload. The FL-003 dashboard performance task creates the timeline-chart and predictions-table components which will implement this pattern per the mandatory agent rules (Rule 12: no flickering, show skeleton after 150ms delay). | `dev_docs/completeness/ui-state-matrix.md` -- Section 3.3, G-04 resolution + `dev_docs/tasks/phase-10/FL-003-dashboard-performance.md` | YES -- Pattern documented. FL-003 components will follow ui-state-matrix Rule 12. |

---

## Section 5: Task Generation Gaps (Step 8)

| Gap ID | Source | Description | Severity | Resolution | Task/File | Verified |
|--------|--------|-------------|----------|------------|-----------|----------|
| TG-000 | Step 8 -- Task Generation | **No gaps found.** All 26 Phase 5-10 tasks generated. Every service has at least one task. Every P0 feature has an early-sprint task. No orphan tasks exist. | N/A | N/A -- no action required | All 26 task files in `dev_docs/tasks/phase-5/` through `dev_docs/tasks/phase-10/` | YES -- All task files verified in phase-coverage.md Section 3. |

---

## Section 6: Cross-Reference Verification

### 6.1 Gap-to-Task Traceability Chain

Each resolved gap must trace through this chain: **Gap -> Resolution Description -> Task File -> Sub-task -> Deliverable**

| Gap ID | Task File | Sub-task | Deliverable |
|--------|-----------|----------|-------------|
| WF-001 | DI-004 | Sub-task 1 (Corpus Crawler, text extraction) | `bridge/ingestion/crawler.js` with body_text extraction + `migrations/008-content-inventory.sql` with body_text TEXT column |
| WF-002 | FL-002 | Sub-tasks 1-3 (scoring model, error analysis, weight adjustment) | `bridge/intelligence/recalibration.js` with per-client weight storage + admin endpoint |
| WF-003 | QG-003 | Sub-task 3 (Re-score button) | "Re-score" button in `dashboard/components/quality/` triggering `POST /api/quality/score` |
| UI-001 | DASH-001 | Login page implementation | Rate-limit BANNER pattern with 429 status + Retry-After header surfacing |
| UI-002 | N/A | Documentation only | Partial SKEL pattern already specified in ui-state-matrix.md |
| UI-003 | DASH-002 | Version tab in article detail | DRAWER-based split-pane diff view for version comparison |
| UI-004 | FL-003 | Sub-tasks 2-3 (timeline chart, predictions table) | Per-component SKEL overlay with 150ms delay hook |

### 6.2 Deferred Items Tracking

| Gap ID | Deferral Reason | Workaround Available | Hardening Phase Target | Risk if Not Addressed |
|--------|-----------------|---------------------|----------------------|----------------------|
| WF-003 | Auto-trigger too expensive for minor edits (30-60s overhead). Manual control preferred. | Manual "Re-score" button in QG-003. User clicks to re-evaluate after significant edits. | Post-launch hardening sprint. Candidate for Plugin Configuration toggle. | LOW -- Stale quality scores visible until manual re-score. No data integrity risk. Score is informational, not a publishing gate breaker. |

---

## Section 7: Summary

```
GAP TRACEABILITY:
  Total gaps across all steps:    7
  Resolved in task files:         5  (WF-001, WF-002, UI-001, UI-003, UI-004)
  Resolved via documentation:     1  (UI-002)
  Deferred to hardening:          1  (WF-003)
  Open / unaddressed:             0

  Steps with zero gaps:           3  (Step 3 Service Matrix, Step 6.5 Screen Matrix, Step 8 Task Gen)
  Steps with gaps found:          2  (Step 4.5 Workflow Validation: 3 gaps, Step 6.6 UI State: 4 gaps)

  Critical gaps:                  0
  High gaps:                      1  (WF-001 -- RESOLVED)
  Medium gaps:                    1  (WF-002 -- RESOLVED)
  Low gaps:                       5  (WF-003 deferred, UI-001 through UI-004 resolved)

  Broken chains identified:       3 unique root causes (4 boundary breaks across 5 workflows)
  Broken chains fixed in tasks:   2 (body_text in DI-004, scoring_weights in FL-002)
  Broken chains deferred:         1 (auto-re-scoring, manual workaround exists)
```

---

**ALL GAPS TRACED. ZERO OPEN ITEMS. TRACEABILITY CHAIN VERIFIED FROM GAP TO TASK TO DELIVERABLE.**
