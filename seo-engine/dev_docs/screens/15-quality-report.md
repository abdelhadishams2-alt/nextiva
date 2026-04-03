# Screen Spec: Article Quality Report

> **Route:** `/articles/[id]/quality`
> **Service:** Quality Gate Service (Service #10, Layer 4 -- Post-Generation)
> **Task:** T2-15
> **Type:** Report (score ring, signal bars, tabbed detail sections)
> **Priority:** P1
> **Depth Target:** >= 8/10

---

## 1. Overview

The Quality Report is the single most information-dense screen in ChainIQ. It is the deliverable that ships with every generated article -- the auditable proof that AI-generated content meets a measurable, reproducible quality standard. Without this screen, ChainIQ is indistinguishable from every other AI article generator. With it, enterprise publishers see exactly why an article scored 8.4/10, which of the 60 SEO checks passed or failed, how the article rates on each of the 10 E-E-A-T dimensions, where the voice match deviated from the target persona, and what specific actions would improve the weakest signals.

The screen is structured around a visual hierarchy that mirrors how users actually consume quality data. At the top: a large ScoreRing showing the composite 0-10 score -- the "headline number" that answers "is this article good enough?" Below that: 7 horizontal signal bars showing the individual scores for E-E-A-T, Topical Completeness, Voice Match, AI Detection, Freshness, Technical SEO, and Readability -- each weighted and color-coded so the user can instantly identify which signals are strong and which need work. Below that: three tabs providing the deep detail -- the full 60-point SEO Checklist grouped by 8 categories, the 10-dimension E-E-A-T rubric with 0-3 scoring per dimension and an A-F letter grade, and the prioritized Suggestions list ranked by estimated impact on the overall score.

**Architecture split -- engine vs agent:** The Quality Gate is split between deterministic engine code (60-point checklist, readability, technical SEO -- identical inputs always produce identical outputs) and LLM-powered agent evaluation (E-E-A-T, topical completeness, voice match, AI detection, freshness -- requires semantic judgment). This split is surfaced in the UI: checklist items show exact measured values ("H2 count: 5, expected: 4-8, pass"), while rubric signals show qualitative assessments with supporting evidence ("Expertise: 2/3 -- demonstrates practical knowledge but lacks cited credentials").

**Auto-revision loop:** The Quality Report is not just a display -- it is the trigger for automated improvement. Articles scoring below 7.0 are automatically routed through up to 2 revision passes. The Draft Writer receives targeted fix instructions derived from the Quality Report's failing signals and checklist items. The report shows the revision history: "Revision 1: Score improved from 6.2 to 7.8 (+1.6). Voice match improved. Topical completeness improved. 3 checklist items fixed." This makes the auto-fix process transparent and auditable.

**Primary user personas and their goals on this screen:**

- **James (Editorial Director):** Opens the Quality Report for every article before approving publication. Scans the ScoreRing first -- anything above 7.5 gets a quick review of E-E-A-T and Voice Match. Anything below 7.0, he digs into the checklist to find exactly what failed. His nightmare: an article goes live that Google's helpful content classifier flags as low-quality. The Quality Report gives him auditable evidence that every article met the quality floor.

- **Nadia (Content Operations Manager):** Reviews Quality Reports in batches -- 10-15 per week. Sorts by signal to identify patterns. She noticed that articles targeting competitive keywords consistently score lower on topical completeness because the research phase wasn't deep enough. This pattern, visible across multiple Quality Reports, led to a pipeline configuration change.

- **Yousef (Arabic Content Lead):** Needs the scoring system to understand Arabic-specific quality norms. Arabic sentences average 25+ words (not the 15-20 that English readability formulas expect). Tashkeel presence is a formality signal. The Quality Report must apply Arabic-calibrated readability metrics and display the detected language with its scoring adjustments.

- **Draft Writer Agent (system consumer):** When auto-revision triggers, the agent receives the `revision_instructions` JSONB from the Quality Report. It does not see the full report -- it receives structured fix instructions: "Failing signals: voice_match (0.62, threshold 0.70). Fix: Reduce passive voice from 0.14 to below 0.10. Increase sentence length variance from 4.1 to above 6.0. Checklist failures: FAQ section missing. Add FAQ with 8-12 questions."

---

## 2. Screen Type

Full-page report with hero score section (top), signal bars (middle), and tabbed detail sections (bottom). This screen is accessed from the Article Detail page via a "Quality" tab or direct URL. It belongs to a specific article and always shows the latest revision's score (with revision history accessible).

---

## 3. ASCII Wireframe

```
┌─────┬───────────────────────────────────────────────────────────────┐
│     │  ← Back to Article    "N54 HPFP Failure Symptoms"            │
│  S  │───────────────────────────────────────────────────────────────│
│  I  │                                                               │
│  D  │  ┌──────────────┐   Quality Score                            │
│  E  │  │              │   Revision 1 of 1 · Scored Mar 28, 2026    │
│  B  │  │    ┌────┐    │   Language: English · 1,847 words           │
│  A  │  │    │ 8.4│    │   Scoring: 2.1s engine + 4.3s agent        │
│  R  │  │    │/10 │    │   Status: ✓ Passed                         │
│     │  │    └────┘    │                                             │
│     │  │  ████████░░  │   [Re-score]  [Auto-fix]                   │
│     │  └──────────────┘                                             │
│     │                                                               │
│     │  7 Signals                                                    │
│     │  E-E-A-T              8.7 ████████████████░░░░  (20%)        │
│     │  Topical Completeness 8.2 ███████████████░░░░░  (20%)        │
│     │  Voice Match          7.8 ██████████████░░░░░░  (15%)        │
│     │  AI Detection         8.9 █████████████████░░░  (15%)        │
│     │  Freshness            9.0 █████████████████░░░  (10%)        │
│     │  Technical SEO        9.2 ██████████████████░░  (10%)        │
│     │  Readability          7.5 █████████████░░░░░░░  (10%)        │
│     │                                                               │
│     │  [SEO Checklist]  [E-E-A-T Rubric]  [Suggestions]           │
│     │  ─────────────────────────────────────────────────           │
│     │                                                               │
│     │  SEO Checklist   52/60 passed · 3 failed · 5 warnings       │
│     │                                                               │
│     │  ▼ Content Structure (14/17)                                  │
│     │    ✓ Content length 1,200-2,500 words         1,847 words    │
│     │    ✓ H2 heading count 4-8                     5 headings     │
│     │    ✗ FAQ section present                      Missing        │
│     │    ⚠ H3 subheading count >= 10                9 headings     │
│     │    ...                                                        │
│     │                                                               │
│     │  ▶ Keyword Optimization (5/7)                                 │
│     │  ▶ Metadata (4/4)                                             │
│     │  ▶ Internal Linking (4/5)                                     │
│     │  ▶ External Links (4/5)                                       │
│     │  ▶ Images (5/6)                                               │
│     │  ▶ Technical Formatting (6/6)                                 │
│     │  ▶ Internationalization (4/4)                                 │
│     │                                                               │
└─────┴───────────────────────────────────────────────────────────────┘
```

---

## 4. Data Fields

### Hero Score Section

| Field | Type | Source | Display |
|-------|------|--------|---------|
| Overall Score | numeric(4,2) | `quality_scores.overall_score` | Large ScoreRing, 0-10 scale. Color: green >= 7.0, yellow 5.0-6.9, red < 5.0 |
| Passed | boolean | `quality_scores.passed` | "Passed" (green check) or "Failed" (red x) or "Under Review" (yellow warning) |
| Flagged for Review | boolean | `quality_scores.flagged_for_review` | "Flagged for Human Review" banner if true |
| Revision Number | integer | `quality_scores.revision_number` | "Revision {N} of {max}" |
| Language | text | `quality_scores.language_detected` | Flag icon + language name |
| Word Count | integer | `quality_scores.word_count` | "{N} words" |
| Engine Duration | integer | `quality_scores.engine_duration_ms` | "{N}s engine" |
| Agent Duration | integer | `quality_scores.agent_duration_ms` | "{N}s agent" |
| Scored At | datetime | `quality_scores.created_at` | Relative date |
| Scoring Mode | enum | `quality_scores.scoring_mode` | Badge: "Pipeline" / "Standalone" / "Bulk" |

### Signal Bars Section

| Signal | Weight | Source | Score Range | Bar Color Thresholds |
|--------|--------|--------|-------------|---------------------|
| E-E-A-T | 20% | `quality_scores.eeat_score` | 0-10 | green >= 7.0, yellow 5.0-6.9, red < 5.0 |
| Topical Completeness | 20% | `quality_scores.topical_completeness_score` | 0-10 | same |
| Voice Match | 15% | `quality_scores.voice_match_score` | 0-10 | same |
| AI Detection | 15% | `quality_scores.ai_detection_score` | 0-10 | same |
| Freshness | 10% | `quality_scores.freshness_score` | 0-10 | same |
| Technical SEO | 10% | `quality_scores.technical_seo_score` | 0-10 | same |
| Readability | 10% | `quality_scores.readability_score` | 0-10 | same |

### SEO Checklist Tab Fields

| Field | Type | Source | Display |
|-------|------|--------|---------|
| Item ID | string | `checklist_results[].id` | Hidden (used for linking) |
| Category | string | `checklist_results[].category` | Accordion group header |
| Label | string | `checklist_results[].label` | Check item description |
| Status | enum | `checklist_results[].status` | Icon: pass=green check, fail=red x, warning=yellow triangle, info=blue circle |
| Expected | string | `checklist_results[].expected` | "4-8 headings" |
| Actual | string | `checklist_results[].actual` | "5 headings" |
| Suggestion | text | `checklist_results[].suggestion` | Shown inline below failed/warning items |
| Priority Weight | enum | `checklist_results[].priority_weight` | Badge: CRITICAL (red), HIGH (orange), MEDIUM (yellow), LOW (gray) |

**8 Checklist Categories (60 items total):**

| Category | Item Count | Coverage |
|----------|-----------|----------|
| Content Structure | 17 | Word count, H2/H3 counts, FAQ, TOC, intro length, paragraph length, section count, list presence, table presence, quote presence, key takeaways |
| Keyword Optimization | 7 | Primary keyword frequency, title inclusion, H1 inclusion, first paragraph, meta description, URL slug, keyword density |
| Metadata | 4 | Meta title length, meta description length, OG image, canonical URL |
| Internal Linking | 5 | Internal link count, anchor text variety, no orphan links, contextual relevance, link depth |
| External Links | 5 | External link count, authority domains, no-follow where needed, working links, anchor text descriptive |
| Images | 6 | Image count, alt text present, alt text descriptive, file size optimized, featured image, image relevance |
| Technical Formatting | 6 | Schema markup present, heading hierarchy valid, no duplicate headings, code blocks formatted, table markup valid, mobile-friendly structure |
| Internationalization | 4 | Language tag set, hreflang if multilingual, text direction correct, character encoding UTF-8 |

### E-E-A-T Rubric Tab Fields

| Dimension | Score Range | Source |
|-----------|-------------|--------|
| Primary keyword targeting | 0-3 | `rubric_details.eeat.dimensions[0]` |
| Secondary keyword integration | 0-3 | `rubric_details.eeat.dimensions[1]` |
| Experience signals | 0-3 | `rubric_details.eeat.dimensions[2]` |
| Expertise demonstration | 0-3 | `rubric_details.eeat.dimensions[3]` |
| Authoritativeness indicators | 0-3 | `rubric_details.eeat.dimensions[4]` |
| Trustworthiness elements | 0-3 | `rubric_details.eeat.dimensions[5]` |
| Content depth and originality | 0-3 | `rubric_details.eeat.dimensions[6]` |
| Source citation quality | 0-3 | `rubric_details.eeat.dimensions[7]` |
| User intent alignment | 0-3 | `rubric_details.eeat.dimensions[8]` |
| Competitive differentiation | 0-3 | `rubric_details.eeat.dimensions[9]` |

**E-E-A-T Grading Scale:**

| Grade | Total Score | Range | Description |
|-------|-------------|-------|-------------|
| A | 27-30 | 90-100% | Exceptional -- publishable with no changes |
| B | 22-26 | 73-89% | Strong -- minor improvements possible |
| C | 16-21 | 53-72% | Adequate -- several improvement areas |
| D | 10-15 | 33-52% | Below standard -- significant revision needed |
| F | 0-9 | 0-32% | Unacceptable -- major rewrite required |

### Suggestions Tab Fields

| Field | Type | Source | Display |
|-------|------|--------|---------|
| Category | string | `suggestions[].category` | Grouped header |
| Issue | text | `suggestions[].issue` | What is wrong |
| Fix | text | `suggestions[].fix` | Specific, actionable fix instruction |
| Impact | enum | `suggestions[].impact` | Badge: high (red), medium (yellow), low (gray) |
| Effort | enum | `suggestions[].effort` | Badge: high, medium, low |
| Signal Affected | string | `suggestions[].signal_affected` | Which of the 7 signals this improves |
| Estimated Score Improvement | numeric | `suggestions[].estimated_score_improvement` | "+0.4 estimated" |

---

## 5. Component Inventory

| Component | Source | Props / Config | Notes |
|-----------|--------|----------------|-------|
| ScoreRing | Custom | score: 0-10, size: "lg", color: derived | SVG-based circular progress with score centered. Animated fill on load. Color transitions: green/yellow/red |
| Progress | shadcn/ui | value: 0-100 | 7 horizontal signal bars. Color-coded by threshold |
| Tabs | shadcn/ui | defaultValue: "checklist" | SEO Checklist / E-E-A-T Rubric / Suggestions |
| Accordion | shadcn/ui | type: "multiple", collapsible: true | 8 checklist category groups. Default: first failing category open |
| Badge | shadcn/ui | variant by status | Pass/fail/warning, priority weight, impact, effort, grade letter |
| Button | shadcn/ui | variant: "default", "outline", "ghost" | "Re-score", "Auto-fix", "Back to Article" |
| Alert | shadcn/ui | variant: "warning", "destructive", "info" | Flagged for review, stale score, revision in progress |
| Tooltip | shadcn/ui | -- | Signal weight explanations, priority weight definitions, score calculation breakdown |
| Skeleton | shadcn/ui | -- | Score ring placeholder, signal bar skeletons, checklist row skeletons |
| Card | shadcn/ui | -- | Hero score container, suggestion cards |
| Dialog | shadcn/ui | -- | Re-score confirmation, auto-fix confirmation |
| Toast | shadcn/ui | -- | Re-score complete, auto-fix started/completed |
| Table | shadcn/ui | -- | E-E-A-T dimension rubric table |
| Separator | shadcn/ui | -- | Between signal bars, between checklist items |
| ScrollArea | shadcn/ui | -- | Checklist and suggestions scroll independently of hero section |
| AlertDialog | shadcn/ui | -- | Auto-fix confirmation with warning about potential content changes |

---

## 6. States (8 total)

### 6.1 Loading State

```
Hero section: ScoreRing shows skeleton circle with pulsing animation.
Metadata fields show skeleton text (4 lines).
Signal bars section: 7 skeleton bars with pulsing animation.
Tabs visible but content area shows skeleton rows.
```

### 6.2 Not Scored -- "Run Quality Gate" Button

```
Hero section replaced by centered CTA:
  "This article has not been scored yet."
  "The Quality Gate evaluates your article against 60 SEO checks,
   7 semantic signals, and 10 E-E-A-T dimensions."
  [Run Quality Gate] button (large, primary)
  "Scoring typically takes 15-30 seconds."

Signal bars and tabs hidden.
```

### 6.3 Scoring In Progress

```
Hero section shows animated ScoreRing (indeterminate spinner).
Progress tracker below:
  ┌──────────────────────────────────────────────────┐
  │  Scoring article...                               │
  │  ████████████░░░░░░░░░░░░░░  45%                 │
  │                                                    │
  │  ✓ HTML parsed                     (0.3s)         │
  │  ✓ Content structure analyzed      (0.8s)         │
  │  ✓ Keyword optimization checked    (0.4s)         │
  │  ● E-E-A-T evaluation...          (agent)        │
  │  ○ Topical completeness                           │
  │  ○ Voice match scoring                            │
  │  ○ AI detection analysis                          │
  │  ○ Freshness evaluation                           │
  │  ○ Suggestion generation                          │
  └──────────────────────────────────────────────────┘

Engine checks (deterministic) complete first and fast (< 2s).
Agent checks (LLM) take longer (3-15s each, running in parallel where possible).
Progress updates via polling every 2 seconds.
```

### 6.4 Scored -- Full Report

```
Complete quality report displayed:
  Hero: ScoreRing with animated fill (0 -> final score in 1s).
  Metadata: revision, date, language, word count, timing, status badge.
  Signal bars: all 7 rendered with scores, colors, and weights.
  Tabs: SEO Checklist active by default. All 3 tabs populated.

If article passed (score >= 7.0): green ScoreRing, "Passed" badge.
If article failed but not yet revised: yellow ScoreRing, "Below Threshold" badge.
If article failed and flagged: red "Flagged for Human Review" banner.
```

### 6.5 Revision In Progress (Auto-fix Running)

```
Banner above hero section:
  "Auto-fix in progress. The Draft Writer is revising this article
   based on {N} failing signals and {M} checklist failures."
  Progress: "Revision 1 of 2 · Started 45s ago"
  [Cancel Auto-fix] button

ScoreRing shows current (pre-revision) score with a "Revising..." overlay.
Signal bars show current scores. Failing signals have animated pulse border.
Tabs remain accessible (showing current pre-revision data).
```

### 6.6 Revision Complete -- Improved Score

```
Banner above hero section (success variant):
  "Revision Complete"
  "Score improved from 6.2 to 7.8 (+1.6)"
  Breakdown: "Voice match: 5.8 -> 7.4 (+1.6) · Topical: 6.0 -> 7.9 (+1.9)
   · 3 checklist items fixed"
  [View Previous Version] link

ScoreRing shows new score with a green "improved" animation.
Signal bars update to new values. Improved signals show green up-arrow delta.
Tabs show post-revision data. Previous revision data accessible via
  revision selector dropdown: "Revision 1 ▾" (switches to show old scores).
```

### 6.7 Stale Score -- Article Edited Since Last Score

```
Alert banner (warning) above hero section:
  "This quality score is stale. The article was edited on {date},
   after this score was generated on {score_date}."
  [Re-score Now] button

ScoreRing shows score but with a yellow border indicating staleness.
All data remains visible but with muted styling.
```

### 6.8 Error State -- Scoring Failed

```
Hero section shows error:
  ScoreRing replaced by error icon.
  "Quality scoring failed."
  Error message: "Agent evaluation timed out after 60 seconds."
  or "LLM API unavailable. Engine-only partial score available."

If engine completed but agent failed:
  Partial results shown: checklist results, technical SEO, readability.
  Agent-dependent signals (E-E-A-T, topical, voice, AI detection, freshness)
  show "Unavailable" with gray bars.
  [Retry Scoring] button.
```

---

## 7. Interactions

| # | Trigger | Action | Feedback | API Call |
|---|---------|--------|----------|----------|
| 1 | Page load (article has score) | Fetch latest quality score | Skeleton -> populated report with ScoreRing animation | GET `/api/quality/score/:articleId` |
| 2 | Page load (article not scored) | Show "Run Quality Gate" empty state | CTA with explanation text | GET `/api/quality/score/:articleId` returns 404 |
| 3 | Click "Run Quality Gate" | Start scoring pipeline | Button shows spinner. Progress tracker appears with stage-by-stage updates | POST `/api/quality/score` `{ article_id, mode: "standalone" }`, then poll |
| 4 | Scoring completes | Replace progress with full report | ScoreRing animates from 0 to final score. Signal bars slide in. Toast: "Scoring complete: {score}/10" | Automatic via polling detecting completion |
| 5 | Click "Re-score" | Confirm dialog: "Re-score this article? The previous score will be preserved in history." | On confirm: same as interaction 3. New revision_number created | POST `/api/quality/revise/:articleId` |
| 6 | Click "Auto-fix" | Confirm dialog: "Run auto-fix? The Draft Writer will revise the article to address {N} failing signals. This creates a new article revision." | On confirm: revision banner appears. Progress shown. When complete, new score displayed with delta | POST `/api/quality/revise/:articleId` `{ auto_fix: true }` |
| 7 | Click signal bar | Scroll to and highlight the relevant section in the active tab. If signal is E-E-A-T, switch to E-E-A-T tab and scroll to that dimension | Smooth scroll + brief highlight animation (yellow flash) | None (client-side navigation) |
| 8 | Expand checklist category | Toggle accordion section open/closed | Smooth height animation. Items render with status icons | None (data already loaded) |
| 9 | Click failed checklist item | Expand to show suggestion inline below the item | Suggestion text slides down with fix instruction and estimated impact | None (data in checklist_results) |
| 10 | Click "View Previous Version" | Switch revision selector to show previous revision's score and report | All data updates to show previous revision. Dropdown shows "Revision 0 (Original)" | GET `/api/quality/score/:articleId?revision=0` |
| 11 | Switch tabs (Checklist/E-E-A-T/Suggestions) | Show selected tab content | Content area transitions. No reload needed (data pre-fetched) | None |
| 12 | Click suggestion "Apply Fix" (Phase 2) | Queue that specific fix for the Draft Writer agent to address | Toast: "Fix queued. Auto-fix will address this in the next revision." | POST `/api/quality/revise/:articleId` `{ specific_fixes: [item_id] }` |
| 13 | Hover over signal weight percentage | Tooltip: "E-E-A-T contributes 20% to the overall score. Score: 8.7 x 0.20 = 1.74 contribution." | Tooltip with calculation breakdown | None |
| 14 | Click "Back to Article" | Navigate to `/articles/[id]` | Standard client-side navigation | None |
| 15 | Click E-E-A-T grade badge | Expand to show 10-dimension breakdown table with individual scores, notes, and improvement guidance per dimension | Accordion or inline expansion | None (data in rubric_details.eeat.dimensions) |

---

## 8. API Integration

### Endpoints Used

| Method | Path | Purpose | Cache |
|--------|------|---------|-------|
| GET | `/api/quality/score/:articleId` | Latest quality score with all signals | 60s SWR. Invalidated on re-score or auto-fix |
| GET | `/api/quality/checklist/:articleId` | Full 60-point checklist with per-item results | 60s SWR. Same invalidation |
| GET | `/api/quality/suggestions/:articleId` | Prioritized improvement suggestions | 60s SWR |
| GET | `/api/quality/history/:articleId` | Revision history for this article | 60s SWR |
| POST | `/api/quality/score` | Score article (standalone mode) or re-score | Invalidates all quality caches for this article |
| POST | `/api/quality/revise/:articleId` | Trigger auto-revision loop | Invalidates all quality caches. Returns job_id for polling |

### Data Fetching Strategy

```typescript
// Server component: fetch all quality data for the article
async function QualityReportPage({ params }: { params: { id: string } }) {
  const [score, checklist, suggestions, history] = await Promise.all([
    fetchQualityScore(params.id),
    fetchQualityChecklist(params.id),
    fetchQualitySuggestions(params.id),
    fetchQualityHistory(params.id),
  ]);
  // score is null if not yet scored (triggers empty state)
  return (
    <QualityReportClient
      articleId={params.id}
      initialScore={score}
      initialChecklist={checklist}
      initialSuggestions={suggestions}
      revisionHistory={history}
    />
  );
}

// Client component handles:
// - Scoring progress polling (2s interval during scoring)
// - Revision switching (re-fetch with ?revision=N)
// - Tab switching (all data pre-loaded, no additional fetches)
// - Auto-fix progress polling (2s interval during revision)
// - SWR revalidation for background freshness
```

### Polling During Scoring

```
POST /api/quality/score { article_id } -> returns { job_id }
Poll GET /api/quality/score/:articleId every 2 seconds
Response includes partial results as they complete:
  - engine_complete: true (checklist, readability, technical SEO available)
  - agent_complete: false (E-E-A-T, topical, voice still processing)
UI renders engine results immediately, shows agent progress.
When both complete, full report renders.
```

---

## 9. Mobile Behavior

| Breakpoint | Layout Change |
|------------|---------------|
| >= 1024px | Hero score on left (ScoreRing + metadata), signal bars on right. Full-width tabs below |
| 768-1023px | Hero score full-width centered. Signal bars full-width below. Tabs full-width |
| < 768px | ScoreRing centered (size reduced from 200px to 140px). Metadata below ring. Signal bars as compact list (name + score + thin bar). Tabs stack as full-width panels. Checklist accordion items show only icon + label + status (tap to expand for expected/actual/suggestion) |

**Touch targets:** All checklist items minimum 44px height. Accordion headers enlarged for touch. Tab switcher uses horizontal scroll with snap points on mobile.

---

## 10. Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | Tab from ScoreRing (read-only, announced) through signal bars (read-only) to tab list (arrow keys switch tabs) to tab content (accordion items focusable, Enter to expand) |
| Screen reader | ScoreRing: `role="meter"` with `aria-valuenow="8.4"`, `aria-valuemin="0"`, `aria-valuemax="10"`, `aria-label="Overall quality score: 8.4 out of 10. Passed."` |
| Signal bars | Each bar: `role="meter"` with `aria-label="E-E-A-T score: 8.7 out of 10, weight 20 percent"` |
| Checklist items | Each item: `aria-label="Content length 1200 to 2500 words: passed. Actual: 1847 words"`. Failed items include `aria-describedby` linking to suggestion text |
| Color independence | Pass/fail uses icons (checkmark, x, triangle) alongside color. ScoreRing includes numeric score inside ring (not color-only). Signal bars show numeric score label alongside colored bar |
| Focus management | Tab switching moves focus to first item in new tab panel. Accordion expansion moves focus to expanded content |
| Scoring progress | Uses `aria-live="polite"` region. Stage completions announced: "E-E-A-T evaluation complete. Score: 8.7" |
| Reduced motion | ScoreRing fill animation disabled. Signal bars render instantly. No transition effects |
| RTL support | Layout mirrors for Arabic. ScoreRing stays centered. Signal bars read right-to-left. Checklist text right-aligned. E-E-A-T dimension notes in Arabic when language_detected=ar |

---

## 11. Edge Cases

| # | Scenario | Handling |
|---|----------|----------|
| 1 | Agent unavailable (LLM API down) | Engine-only partial scoring. Checklist, readability, technical SEO scored. Agent signals show "Unavailable" with gray bars. Overall score computed from available signals only with adjusted weights. Banner: "Partial score -- agent evaluation unavailable. Checklist and engine scores are accurate." |
| 2 | Article edited after scoring | Stale score detection via article.updated_at vs quality_scores.created_at comparison. Yellow warning banner with "Re-score Now" CTA. Score remains visible but styled as stale |
| 3 | Auto-fix makes article worse | Post-revision score compared to pre-revision. If score decreased, banner: "Revision decreased score from {old} to {new}. Original version preserved." [Revert to Original] action available. Maximum 2 revision attempts; if both decrease score, article flagged for human review |
| 4 | Arabic article scored with English metrics | Language detection runs first. If language_detected=ar, Arabic-calibrated readability metrics apply: sentence length norms 20-30 words (vs English 15-20), Flesch-Kincaid replaced with Arabic readability index, tashkeel frequency as formality signal. Checklist thresholds adjust for Arabic norms. Report shows "Arabic quality adjustments applied" badge |
| 5 | Very short article (< 500 words) | Several checklist items auto-fail (content length, section count, H2 count). Banner: "This article is significantly below minimum length. Many checklist items cannot be met at this word count." Suggestions prioritize "Expand content to at least 1,200 words" as highest-impact fix |
| 6 | Article with no images | All 6 image checklist items fail. Technical SEO impacted. Suggestions include "Add 4-6 relevant images with descriptive alt text" as high-impact fix |
| 7 | Concurrent re-score requests | API returns 409 if scoring is already in progress for this article. Toast: "Scoring already in progress." Page shows existing progress tracker |
| 8 | Suggestion text too vague | The engine generates specific, actionable suggestions -- never generic ("improve readability"). Every suggestion includes: exact issue ("Paragraph 3 has 8 sentences"), specific fix ("Split into two paragraphs of 4 sentences each"), and estimated impact ("+0.3 readability score"). This specificity is enforced by template-based suggestion generation in quality-suggestions.js |
| 9 | 60-item checklist with all passing | All categories show green. Hero shows 60/60 passed. Suggestions tab shows: "No critical improvements needed. Here are optional enhancements:" followed by low-priority optimizations |
| 10 | Revision history with 3+ entries | Revision selector dropdown shows all revisions chronologically. Each entry shows: "Revision {N} -- Score {score} -- {date}". Delta shown between each revision |

---

## 12. Frustration Mitigation

| Frustration | Root Cause | Solution |
|-------------|------------|----------|
| Scoring takes too long (15-30s) with no feedback | Engine runs fast (< 2s) but agent evaluation requires LLM inference across 5 signals | Stage-by-stage progress tracker showing exactly which signal is being evaluated. Engine results render immediately while agent processes. Determinate progress bar for engine, per-signal progress for agent. Users see partial results within 2 seconds |
| "Auto-fix" makes article worse | LLM revision is not guaranteed to improve all signals. May fix one issue while introducing another | Pre-revision score preserved. Post-revision comparison shown with per-signal deltas. If score decreases, explicit warning with "Revert to Original" option. Maximum 2 attempts with human review fallback. Auto-fix confirmation dialog warns: "The Draft Writer will attempt to improve {N} signals. Results are not guaranteed." |
| Can't see WHAT specifically failed in the checklist | Generic category-level pass/fail hides individual item details | Every checklist item shows: label, expected value, actual measured value, and specific suggestion if failed. Items are expandable. Failed items auto-expand on page load so the user sees failures first without clicking |
| Suggestions too vague ("improve readability") | Generic suggestions provide no actionable guidance | Template-based suggestion engine produces specific, measurable fixes: "Shorten paragraph 3 from 8 sentences to 4 sentences" instead of "improve readability." Each suggestion includes the exact issue, the specific fix action, and the estimated score improvement. Suggestions reference specific locations in the article (paragraph numbers, heading text) |
| Arabic scoring uses English metrics | Default readability formulas assume English sentence structure and word length | Language-aware scoring pipeline. When language_detected=ar: readability formula switches to Arabic-calibrated index, sentence length norms adjust (25-word average is normal, not verbose), tashkeel frequency becomes a formality signal, morphological complexity replaces syllable counting. Report shows "Arabic quality adjustments applied" with tooltip explaining which metrics were recalibrated |

---

## 13. Real-Time & Polling Behavior

| Scenario | Strategy | Interval | Termination |
|----------|----------|----------|-------------|
| Scoring in progress | Poll `GET /api/quality/score/:articleId` | 2 seconds | Scoring complete (all signals evaluated) or failed |
| Auto-fix in progress | Poll `GET /api/quality/history/:articleId` | 3 seconds | Revision status transitions to `completed` or `failed` or `timed_out` |
| Idle viewing | SWR background revalidation | 60 seconds | Continuous while page visible |
| Tab hidden | Pause all polling | -- | Resume on `visibilitychange` |
| Partial results available | Render engine results immediately. Continue polling for agent results | 2 seconds | All agent signals complete |

---

## 14. Dependencies

| Dependency | Type | Impact |
|------------|------|--------|
| Quality Gate Service (Service #10) | Backend | All scoring data, checklist engine, agent evaluation, auto-revision loop |
| Auth & Bridge Server | Backend | JWT validation, user context for RLS |
| Article Detail (Screen 4) | Navigation | Quality Report is a sub-route of Article Detail. "Back to Article" navigates to parent |
| Voice Intelligence Service | Data | Voice match scoring uses writer_personas.voice_profile. Without it, voice match defaults to 5.0/10 |
| Draft Writer Agent | System | Auto-fix sends revision_instructions to Draft Writer for article revision |
| Publishing Service | Downstream | quality_scores.passed is checked before any article can be published |
| Feedback Loop Service | Downstream | Quality scores feed into performance predictions and recalibration data |
| Supabase | Infrastructure | quality_scores, quality_revisions tables + RLS |
| LLM API (Claude) | External | Agent-powered signals require LLM inference. Degraded mode if unavailable |

**Blocks:** Publishing (article must pass quality gate before publish). Performance tracking (quality score is a prediction input).
**Blocked by:** Quality Gate Service API endpoints, Article Pipeline (article must exist), Auth/Bridge Server

---

## 15. Testing Scenarios

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| 1 | Not scored -- empty state | Navigate to `/articles/[id]/quality` for unscored article | "This article has not been scored yet" with "Run Quality Gate" CTA. No signal bars, no tabs |
| 2 | Run Quality Gate | Click "Run Quality Gate" on empty state | Progress tracker appears. Engine stages complete fast (< 2s). Agent stages show individually. After 15-30s: full report renders with ScoreRing animation |
| 3 | Full report -- passing article | View scored article with 8.4/10 | Green ScoreRing. "Passed" badge. All 7 signal bars rendered. SEO Checklist tab shows 52/60 passed. E-E-A-T shows grade B. Suggestions tab shows prioritized fixes |
| 4 | Full report -- failing article | View scored article with 5.8/10 | Yellow ScoreRing. "Below Threshold" badge. Multiple red signal bars. Auto-fix button prominent. Failing checklist categories auto-expanded |
| 5 | SEO Checklist navigation | Open Checklist tab, expand Content Structure | 17 items visible with pass/fail/warning icons. Each shows expected vs actual. Failed items show inline suggestions. Expand/collapse works smoothly |
| 6 | E-E-A-T Rubric review | Switch to E-E-A-T tab | 10-dimension table with 0-3 scores per dimension. Total score and letter grade. Each dimension has notes explaining the score. Grade badge color-coded (A=green, B=blue, C=yellow, D=orange, F=red) |
| 7 | Suggestions tab | Switch to Suggestions tab | Prioritized list sorted by estimated impact. Each suggestion shows: issue, fix, impact badge, effort badge, affected signal, estimated improvement. High-impact items first |
| 8 | Auto-fix | Click "Auto-fix", confirm dialog | Revision banner appears. Progress shown. After revision: score comparison displayed with deltas. Signal improvements highlighted in green |
| 9 | Re-score | Click "Re-score", confirm | New scoring session. Progress tracker. When complete: new revision appears. Revision selector dropdown shows both versions |
| 10 | Stale score | Edit article text after scoring | Warning banner: "Score is stale." with "Re-score Now" button. Score still visible but with yellow border |
| 11 | Click signal bar | Click on the Voice Match signal bar | If Checklist tab active: scrolls to voice-related checklist items. If E-E-A-T tab: no action. Page scrolls to relevant section with highlight animation |
| 12 | Arabic article scoring | Score article with language_detected=ar | "Arabic quality adjustments applied" badge. Readability uses Arabic index (not Flesch-Kincaid). Sentence length norms adjusted. All checklist labels in English (Phase 2: translated). RTL text in actual values |
| 13 | Agent unavailable fallback | Score article when LLM API is down | Engine-only results render (checklist, readability, technical SEO). Agent signals show "Unavailable". Partial score computed. Banner explains degraded mode |
| 14 | Mobile layout | View on 375px viewport | ScoreRing centered and reduced. Signal bars compact. Tabs full-width. Checklist items show condensed view (tap to expand). Touch targets >= 44px |
| 15 | Keyboard-only navigation | Tab through entire report | Focus ring on ScoreRing, signal bars, tab list, accordion headers, checklist items. Arrow keys switch tabs. Enter expands accordion. All interactive elements reachable |
