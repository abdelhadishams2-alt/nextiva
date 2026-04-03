# QG-003: Dashboard Quality Report Page

> **Phase:** 7 | **Priority:** P1 | **Status:** NOT STARTED
> **Effort:** L (12h) | **Type:** feature
> **Sprint:** 5 (Weeks 9-10)
> **Backlog Items:** Quality Gate — Dashboard UI
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `PROJECT-BRIEF.md` — Section 5 for quality gate UI requirements
3. `engine/quality-gate.js` — checklist engine API (from QG-001)
4. `engine/quality-suggestions.js` — suggestion generator API (from QG-001)
5. `dashboard/` — existing Next.js 16 dashboard structure, page conventions, shadcn/ui components
6. `bridge/server.js` — `/api/quality/*` endpoints from QG-001 and QG-002

## Objective
Build the Quality Report dashboard page at `/articles/[id]/quality` that displays the overall quality score, 7-signal breakdown, full 60-point checklist grouped by category, E-E-A-T dimension scores, and actionable suggestions. Include "Re-score" and "Auto-fix" action buttons that trigger the quality gate engine and auto-revision loop respectively.

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `dashboard/app/articles/[id]/quality/page.tsx` | Main quality report page — server component, data fetching |
| CREATE | `dashboard/components/quality/score-ring.tsx` | Circular score visualization (0-100) with color coding |
| CREATE | `dashboard/components/quality/signal-bars.tsx` | 7 horizontal signal bars with weighted scores |
| CREATE | `dashboard/components/quality/checklist-panel.tsx` | Grouped checklist with pass/fail/warning badges |
| CREATE | `dashboard/components/quality/eeat-radar.tsx` | 10-dimension E-E-A-T radar/spider chart |
| CREATE | `dashboard/components/quality/suggestions-list.tsx` | Prioritized suggestion cards with severity indicators |
| MODIFY | `dashboard/app/articles/[id]/layout.tsx` | Add "Quality" tab to article detail navigation |
| CREATE | `tests/dashboard-quality.test.js` | Component and integration tests |

## Sub-tasks

### Sub-task 1: Score Ring Component (~2h)
- Create `dashboard/components/quality/score-ring.tsx`
- Circular SVG ring showing overall score 0-100
- Color coding: green (80-100), yellow (60-79), orange (40-59), red (0-39)
- Center text shows score number and letter grade
- Animated fill on load (CSS transition, no JS animation library)
- Props: `{ score: number, grade: string, label?: string }`
- Below ring: pass/fail/warning count summary badges
- Responsive: scales from 120px to 200px diameter based on container

### Sub-task 2: Signal Bars Component (~2h)
- Create `dashboard/components/quality/signal-bars.tsx`
- 7 horizontal bars, one per signal from the quality gate agent
- Each bar shows: signal name, weight percentage, score (0-10), weighted contribution
- Bar fill width proportional to score/10
- Color: green (>= 7), yellow (5-6.9), red (< 5)
- Tooltip on hover: signal details and what was measured
- Props: `{ signals: Array<{ name, score, weight, weightedScore, details }> }`
- Sort by weighted impact (highest first) to surface biggest opportunities

### Sub-task 3: Checklist Panel with Tabs (~3h)
- Create `dashboard/components/quality/checklist-panel.tsx`
- Three tabs: **Checklist**, **E-E-A-T**, **Suggestions**
- **Checklist tab:**
  - 8 collapsible category sections (Content Structure, Keywords, Metadata, Internal Links, External Links, Images, Formatting, i18n)
  - Each category shows: name, category score, item count
  - Each item shows: status badge (green check / red X / yellow warning / blue info), label, current value, expected value
  - Filter buttons: All, Failed, Warnings, Passed
  - Category-level progress bar
- **E-E-A-T tab:**
  - Create `dashboard/components/quality/eeat-radar.tsx`
  - 10-dimension display — either radar/spider chart (SVG) or horizontal bar layout
  - Each dimension: name, score (0-3), description of what was evaluated
  - Overall total (X/30) with letter grade badge
  - Color coding per dimension: 3 = green, 2 = yellow, 1 = orange, 0 = red
- **Suggestions tab:**
  - Create `dashboard/components/quality/suggestions-list.tsx`
  - Ordered list of suggestions from `quality-suggestions.js`
  - Each card: severity badge (critical/important/minor), title, current vs target, instruction text
  - Auto-fixable items have a lightning bolt icon
  - Maximum 15 suggestions displayed

### Sub-task 4: Main Quality Page (~3h)
- Create `dashboard/app/articles/[id]/quality/page.tsx`
- Server component that fetches data from `/api/quality/score/:id` and `/api/quality/checklist/:id`
- Layout (top to bottom):
  1. **Header row:** Article title, last scored timestamp, "Re-score" and "Auto-fix" buttons
  2. **Score section:** ScoreRing (left) + SignalBars (right) side by side
  3. **Detail section:** ChecklistPanel with 3 tabs (Checklist, E-E-A-T, Suggestions)
- **Re-score button:** Calls `/api/quality/score/:id` with `?refresh=true` query param, shows loading spinner, updates all components on completion
- **Auto-fix button:** Calls `/api/quality/suggestions/:id` with `?autofix=true`, triggers the auto-revision loop from QG-002, shows SSE progress (reuse existing SSE pattern from edit panel), refreshes score on completion
- Loading states: skeleton components for each section while data loads
- Error state: friendly message if article not found or quality gate not yet run
- Modify `dashboard/app/articles/[id]/layout.tsx` to add "Quality" navigation tab alongside existing tabs

### Sub-task 5: RTL Support and Responsiveness (~2h)
- All components must render correctly in RTL mode (Arabic articles)
- Signal bars: reverse direction in RTL
- Checklist panel: right-aligned text, mirrored badge positions
- Score ring: unaffected (circular, no directionality)
- Mobile responsive: stack Score Ring and Signal Bars vertically below 768px
- Checklist categories collapse to accordion on mobile
- Test with Arabic article data to verify layout

## Testing Strategy

### Component Tests (`tests/dashboard-quality.test.js`)
- Test ScoreRing renders correct color for each threshold bracket
- Test SignalBars sorts by weighted impact and colors correctly
- Test ChecklistPanel groups items by category and filters work
- Test suggestion cards display all fields correctly
- Test loading and error states render appropriately

### Integration Tests
- Test quality page loads with real article ID and displays score
- Test "Re-score" button triggers API call and updates UI
- Test "Auto-fix" button initiates revision loop
- Test RTL rendering with Arabic article content
- Test 404 handling when article does not exist

## Acceptance Criteria
- [ ] Quality report page accessible at `/articles/[id]/quality`
- [ ] ScoreRing displays 0-100 score with color coding and letter grade
- [ ] 7 signal bars show weighted scores sorted by impact
- [ ] Checklist tab shows all 60 items grouped by 8 categories with pass/fail/warning badges
- [ ] E-E-A-T tab shows 10 dimensions with scores and overall grade
- [ ] Suggestions tab shows up to 15 prioritized fix instructions
- [ ] "Re-score" button refreshes quality score via API
- [ ] "Auto-fix" button triggers auto-revision loop with SSE progress
- [ ] "Quality" tab added to article detail navigation
- [ ] All components render correctly in RTL mode
- [ ] Responsive layout works on mobile (320px+) and desktop
- [ ] All tests pass (`npm test`)

## Dependencies
- Blocked by: QG-001 (quality engine), QG-002 (quality gate agent + endpoints)
- Blocks: None
