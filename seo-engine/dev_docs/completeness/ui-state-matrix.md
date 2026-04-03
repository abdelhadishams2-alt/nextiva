# ChainIQ UI State Matrix

**Step 6.6 -- UI State Completeness Verification**
**Last Updated:** 2026-03-28
**Source:** 15 screen specs (01-15), screen-matrix.md, service-matrix.md
**Stack:** Next.js 16 + shadcn/ui + Tailwind CSS, dark mode default
**Purpose:** Ensure every screen handles all fundamental UI states, define reusable patterns, flag gaps, and codify mandatory rules for implementation agents

---

## Section 1: Standard Pattern Catalog

Every UI state in ChainIQ maps to one of nine reusable patterns. Implementation agents must use these exact patterns -- no ad-hoc state handling.

### 1.1 Loading Patterns

| Pattern ID | Name | Component | When to Use | Implementation |
|------------|------|-----------|-------------|----------------|
| `SKEL` | Skeleton | `shadcn/ui Skeleton` | Initial page load, data fetching on navigation | Pulsing placeholder blocks matching the final layout geometry. Use `Skeleton` with explicit `width`/`height` props mirroring the populated state. Compose multiple Skeleton elements to match table rows, card grids, or stat blocks. |
| `SPIN` | Spinner | Custom `LoadingSpinner` | In-progress actions (button clicks, form submissions, mutations) | 20px animated SVG spinner replacing button text or placed inline beside action labels. Never full-page. Never for initial data loads. Only appears inside interactive elements during their action lifecycle. |
| `PROG` | Progressive | SSE stream handler | Real-time content appearing incrementally (crawl progress, analysis runs, pipeline status) | Content renders line-by-line or chunk-by-chunk via Server-Sent Events. Show a thin progress bar at the top of the content area. Already-loaded content remains visible while new content streams in below. |

### 1.2 Empty State Patterns

| Pattern ID | Name | Component | When to Use | Implementation |
|------------|------|-----------|-------------|----------------|
| `ILLUS` | Illustration + CTA | Custom `EmptyState` | First-time empty (no data exists yet) | Centered layout: 48px muted icon (Lucide), 1-line heading, 1-line description, primary action `Button`. Background uses `muted` token. Never just text -- always include an actionable CTA that creates the first item or connects the first source. |
| `FILT` | Filtered Empty | Custom `FilteredEmpty` | Filters/search return zero results but data exists | Inline message below filter bar: "No results match your filters." with a "Clear filters" ghost button. No illustration -- the filter bar itself provides context. |

### 1.3 Error Patterns

| Pattern ID | Name | Component | When to Use | Implementation |
|------------|------|-----------|-------------|----------------|
| `BANNER` | Inline Banner | `shadcn/ui Alert` | Partial failure within a section (one widget fails, rest of page works) | `Alert` with `variant="destructive"` placed inside the failed section. Includes error summary and a "Retry" ghost button. Does not replace working content in other sections of the page. |
| `TOAST` | Toast | `shadcn/ui Toast` | Transient success/error after user actions (save, delete, connect) | Auto-dismissing after 5s. Success = default variant. Error = destructive variant. Always includes a concise message. Never used for persistent errors -- those use `BANNER` or `FULL`. |
| `FULL` | Full Page Error | Custom `ErrorPage` | Entire page fails to load (API down, auth failure, 500) | Replaces all page content. Centered layout: error icon, heading ("Something went wrong"), description (non-technical), "Try again" primary button, "Go to Dashboard" secondary link. Logs detailed error to console for debugging. |

### 1.4 Interaction Patterns

| Pattern ID | Name | Component | When to Use | Implementation |
|------------|------|-----------|-------------|----------------|
| `DIALOG` | Dialog / Alert Dialog | `shadcn/ui Dialog` or `AlertDialog` | Confirmations (delete, disconnect), forms (create, edit) that need focus isolation | Modal overlay. `Dialog` for forms with cancel/submit. `AlertDialog` for destructive confirmations with cancel/confirm-destructive. Always include explicit cancel action. Trap focus. Close on Escape. |
| `DRAWER` | Drawer Detail | `shadcn/ui Sheet` | Detail views, expanded information, side panels | Right-anchored `Sheet` (LTR) or left-anchored (RTL). Width: 480px on desktop, full-width on mobile. Includes close button and optional footer actions. Used when the user needs detail without losing list context. |

---

## Section 2: Screen x State Matrix

Each cell contains the pattern ID used for that state. `N/A` means the state does not apply to that screen.

### 2.1 Fundamental States (Required for ALL screens)

| # | Screen | Loading | Error (full) | Error (partial) | Empty (first-time) | Empty (filtered) | Populated |
|---|--------|---------|--------------|-----------------|---------------------|-------------------|-----------|
| 01 | Login / Signup | `SKEL` | `FULL` | `BANNER` | N/A | N/A | Form rendered |
| 02 | Dashboard Home | `SKEL` | `FULL` | `BANNER` | `ILLUS` | N/A | Widgets populated |
| 03 | Article Pipeline | `SKEL` | `FULL` | `BANNER` | `ILLUS` | `FILT` | Table populated |
| 04 | Article Detail | `SKEL` | `FULL` | `BANNER` | N/A | N/A | Article rendered |
| 05 | User Management | `SKEL` | `FULL` | `BANNER` | `ILLUS` | `FILT` | Table populated |
| 06 | Plugin Configuration | `SKEL` | `FULL` | `BANNER` | N/A | N/A | Form populated |
| 07 | Onboarding Wizard | `SKEL` | `FULL` | `BANNER` | N/A | N/A | Step rendered |
| 08 | Blueprint Gallery | `SKEL` | `FULL` | `BANNER` | `ILLUS` | `FILT` | Grid populated |
| 09 | Connections | `SKEL` | `FULL` | `BANNER` | `ILLUS` | N/A | Cards populated |
| 10 | Content Inventory | `SKEL` | `FULL` | `BANNER` | `ILLUS` | `FILT` | Table populated |
| 11 | Opportunities | `SKEL` | `FULL` | `BANNER` | `ILLUS` | `FILT` | Table populated |
| 12 | Voice Profiles | `SKEL` | `FULL` | `BANNER` | `ILLUS` | `FILT` | Cards populated |
| 13 | Publish Manager | `SKEL` | `FULL` | `BANNER` | `ILLUS` | `FILT` | Table populated |
| 14 | Performance | `SKEL` | `FULL` | `BANNER` | `ILLUS` | `FILT` | Charts populated |
| 15 | Quality Report | `SKEL` | `FULL` | `BANNER` | N/A | N/A | Report rendered |

### 2.2 Context-Specific States

| # | Screen | Saving / Mutating | Confirming (destructive) | Streaming / Progress | Detail Drawer | Editing Inline | Offline | Session Expired | Bulk Action | Connecting | Scheduling |
|---|--------|-------------------|--------------------------|----------------------|---------------|----------------|---------|-----------------|-------------|------------|------------|
| 01 | Login / Signup | `SPIN` | N/A | N/A | N/A | N/A | `BANNER` | N/A | N/A | N/A | N/A |
| 02 | Dashboard Home | N/A | N/A | `PROG` | N/A | N/A | `BANNER` | `FULL` | N/A | N/A | N/A |
| 03 | Article Pipeline | `SPIN` | `DIALOG` | `PROG` | `DRAWER` | N/A | `BANNER` | `FULL` | `SPIN` | N/A | N/A |
| 04 | Article Detail | `SPIN` | `DIALOG` | `PROG` | N/A | `BANNER` | `BANNER` | `FULL` | N/A | N/A | N/A |
| 05 | User Management | `SPIN` | `DIALOG` | N/A | `DRAWER` | N/A | `BANNER` | `FULL` | N/A | N/A | N/A |
| 06 | Plugin Configuration | `SPIN` | `DIALOG` | N/A | N/A | N/A | `BANNER` | `FULL` | N/A | N/A | N/A |
| 07 | Onboarding Wizard | `SPIN` | N/A | `PROG` | N/A | N/A | `BANNER` | `FULL` | N/A | `SPIN` | N/A |
| 08 | Blueprint Gallery | N/A | N/A | N/A | `DRAWER` | N/A | `BANNER` | `FULL` | N/A | N/A | N/A |
| 09 | Connections | `SPIN` | `DIALOG` | `PROG` | `DRAWER` | N/A | `BANNER` | `FULL` | N/A | `SPIN` | `DIALOG` |
| 10 | Content Inventory | `SPIN` | `DIALOG` | `PROG` | `DRAWER` | N/A | `BANNER` | `FULL` | `SPIN` | N/A | N/A |
| 11 | Opportunities | `SPIN` | `DIALOG` | `PROG` | `DRAWER` | N/A | `BANNER` | `FULL` | `SPIN` | N/A | N/A |
| 12 | Voice Profiles | `SPIN` | `DIALOG` | `PROG` | `DRAWER` | `BANNER` | `BANNER` | `FULL` | N/A | N/A | N/A |
| 13 | Publish Manager | `SPIN` | `DIALOG` | `PROG` | `DRAWER` | N/A | `BANNER` | `FULL` | `SPIN` | `SPIN` | `DIALOG` |
| 14 | Performance | N/A | `DIALOG` | `PROG` | `DRAWER` | N/A | `BANNER` | `FULL` | N/A | N/A | N/A |
| 15 | Quality Report | `SPIN` | N/A | `PROG` | N/A | N/A | `BANNER` | `FULL` | N/A | N/A | N/A |

### 2.3 State Count Per Screen

| # | Screen | Fundamental | Context-Specific | Total | Minimum Met (>=6)? |
|---|--------|-------------|------------------|-------|---------------------|
| 01 | Login / Signup | 4 | 2 | **6** | YES |
| 02 | Dashboard Home | 5 | 3 | **8** | YES |
| 03 | Article Pipeline | 6 | 6 | **12** | YES |
| 04 | Article Detail | 4 | 6 | **10** | YES |
| 05 | User Management | 6 | 4 | **10** | YES |
| 06 | Plugin Configuration | 4 | 4 | **8** | YES |
| 07 | Onboarding Wizard | 4 | 5 | **9** | YES |
| 08 | Blueprint Gallery | 6 | 2 | **8** | YES |
| 09 | Connections | 5 | 8 | **13** | YES |
| 10 | Content Inventory | 6 | 6 | **12** | YES |
| 11 | Opportunities | 6 | 6 | **12** | YES |
| 12 | Voice Profiles | 6 | 6 | **12** | YES |
| 13 | Publish Manager | 6 | 8 | **14** | YES |
| 14 | Performance | 6 | 4 | **10** | YES |
| 15 | Quality Report | 4 | 4 | **8** | YES |

**Result: 15/15 screens meet the >= 6 state minimum. Range: 6-14 states per screen.**

---

## Section 3: Gap Report

### 3.1 Fundamental State Compliance

All 15 screens implement the four mandatory fundamental states (loading, error, empty-or-N/A, populated). No screen is missing a fundamental state.

| Check | Result |
|-------|--------|
| Screens with loading state | 15/15 |
| Screens with full-page error | 15/15 |
| Screens with partial error (inline banner) | 15/15 |
| Screens with empty state or N/A justification | 15/15 |
| Screens with populated state | 15/15 |

### 3.2 Pattern Consistency Audit

| Pattern | Expected Usage | Actual Usage | Consistent? |
|---------|---------------|--------------|-------------|
| `SKEL` for loading | All 15 screens use Skeleton for initial load | 15/15 | YES |
| `SPIN` only for actions | Never used for page loads, only button/form actions | 13 screens (2 read-only screens have no mutations) | YES |
| `FULL` for page-level errors | All screens | 15/15 | YES |
| `BANNER` for partial errors | All screens | 15/15 | YES |
| `ILLUS` for first-time empty | All screens with list/grid views | 11/15 (4 screens are detail/form views where empty is N/A) | YES |
| `FILT` for filtered empty | All screens with filter/search | 9/15 (6 screens lack filter functionality) | YES |
| `TOAST` for transient feedback | All screens with mutations | Used implicitly via global toast provider -- not per-screen | YES |
| `DIALOG` for destructive confirms | All screens with delete/disconnect | 10/15 (5 screens have no destructive actions) | YES |
| `DRAWER` for detail views | All list screens | 8/15 (7 screens are detail/form views, no list context) | YES |

### 3.3 Identified Gaps

| # | Gap | Severity | Screen(s) | Resolution |
|---|-----|----------|-----------|------------|
| G-01 | Login/Signup lacks rate-limit feedback state | LOW | 01 | Add `BANNER` state for "Too many attempts, try again in X seconds" after 5 failed logins. Pattern: `BANNER` with countdown timer. |
| G-02 | Dashboard Home lacks explicit refresh-in-progress state | LOW | 02 | When user manually refreshes widgets, show `SKEL` overlay on individual widget cards rather than replacing entire page. Already covered by partial `SKEL` pattern -- no code gap, just needs documentation. |
| G-03 | Article Detail lacks version comparison state | LOW | 04 | When comparing published vs. generated versions, need a split-pane diff view. Add as a `DRAWER`-based state showing side-by-side content. |
| G-04 | Performance lacks date-range-loading state | LOW | 14 | When user changes date range, charts should show `SKEL` overlays on individual chart components rather than full page reload. Covered by partial Skeleton pattern. |

**Result: 0 critical gaps, 0 medium gaps, 4 low-severity gaps (all cosmetic or documentation-level). No fundamental state violations.**

---

## Section 4: Mandatory Rules for AI Agents

These rules are non-negotiable. Any implementation agent (human or AI) generating `page.tsx`, `layout.tsx`, or component files for ChainIQ must follow every rule. Violations must be caught in code review.

### Rule 1: Loading-Error-Empty Gate

```
RULE: Every page.tsx must handle loading, error, and empty states BEFORE rendering populated data.
```

**Implementation pattern:**
```tsx
// CORRECT -- gate pattern
export default function InventoryPage() {
  const { data, isLoading, error } = useInventory();

  if (isLoading) return <InventorySkeleton />;
  if (error) return <ErrorPage error={error} retry={() => mutate()} />;
  if (!data || data.length === 0) return <EmptyState /* ... */ />;

  return <InventoryTable data={data} />;
}
```

**Violation examples:**
```tsx
// WRONG -- renders table with no data guard
return <InventoryTable data={data ?? []} />;

// WRONG -- loading state is a spinner instead of skeleton
if (isLoading) return <Spinner />;

// WRONG -- no retry on error
if (error) return <p>Error occurred</p>;
```

### Rule 2: Skeleton Over Spinner

```
RULE: Loading states use Skeleton, never Spinner, except for action buttons in their loading state.
```

- Page loads, tab switches, data fetches: always `SKEL`
- Button clicks (save, delete, connect, publish): always `SPIN` inside the button
- Never show a centered full-page spinner for any reason
- Skeleton elements must match the geometry of the populated layout (same heights, widths, grid columns)

### Rule 3: Empty States Always Include a CTA

```
RULE: Empty states always include a primary action CTA. Never render just "No data" or "Nothing here."
```

**Required structure for first-time empty:**
1. Muted icon (48px, from Lucide icon set)
2. Heading (e.g., "No connections yet")
3. Description (e.g., "Connect your Google Search Console to start importing data")
4. Primary action button (e.g., "Connect Google Account")

**Required structure for filtered empty:**
1. Inline text: "No results match your filters."
2. "Clear filters" ghost button

### Rule 4: Error States Always Include Retry

```
RULE: Every error state must include a retry mechanism. No dead-end error screens.
```

- Full-page errors: "Try again" button that re-fetches data + "Go to Dashboard" fallback link
- Inline banner errors: "Retry" ghost button within the `Alert` component
- Toast errors: if the action is retryable, include an "Undo" or "Retry" action in the toast

### Rule 5: Destructive Actions Require Confirmation

```
RULE: All destructive actions (delete, disconnect, remove, revoke) must use AlertDialog confirmation before execution.
```

- Confirmation dialog must name the item being destroyed (e.g., "Delete article 'SEO Guide for MENA'?")
- Confirm button must use `variant="destructive"`
- Confirm button text must be specific (e.g., "Delete Article", not "OK" or "Yes")
- Cancel must be the visually dominant (default focus) option

### Rule 6: Toast for Transient Feedback Only

```
RULE: Toast notifications are for transient success/error messages only. Never use Toast for persistent states.
```

- Success after save, delete, publish, connect: `TOAST` (auto-dismiss 5s)
- Ongoing errors (API down, auth expired): `BANNER` or `FULL`, never Toast
- Validation errors on forms: inline field errors, never Toast

### Rule 7: Offline and Session-Expired Are Mandatory

```
RULE: Every authenticated screen must handle offline and session-expired states.
```

- **Offline:** `BANNER` at the top of the page: "You appear to be offline. Changes will sync when reconnected." No data mutations allowed while offline. Disable all action buttons.
- **Session expired:** `FULL` page replacement with "Your session has expired" message and "Sign in again" button. Triggered by 401 response from any API call. Must redirect to login with return URL preserved.

### Rule 8: Progressive Loading for Long Operations

```
RULE: Operations taking > 3 seconds must show progressive feedback, not a static loader.
```

Applies to:
- Content crawl progress (10-Content Inventory): SSE stream with URL count
- Analysis runs (11-Opportunities): SSE stream with analysis stage
- Voice corpus analysis (12-Voice Profiles): SSE stream with document count
- Article generation pipeline (03-Article Pipeline): SSE stream with step progress
- Quality scoring (15-Quality Report): SSE stream with checklist progress
- Publishing (13-Publish Manager): SSE stream with platform-by-platform status

Pattern: thin progress bar at container top + text status below showing current operation stage.

### Rule 9: Consistent Dark Mode Tokens

```
RULE: All state patterns must use Tailwind CSS semantic tokens, never hardcoded colors.
```

- Skeleton pulse: `bg-muted` (works in both light and dark)
- Error banner: `bg-destructive/10 text-destructive` via shadcn Alert `variant="destructive"`
- Empty state background: `bg-muted/50`
- Toast: shadcn Toast handles dark mode internally
- Never use `bg-red-500`, `text-gray-400`, or any raw Tailwind color in state patterns

### Rule 10: RTL Awareness in State Patterns

```
RULE: All state patterns must render correctly in RTL mode.
```

- Drawer opens from the left in RTL (not right)
- Skeleton text blocks align to the right in RTL
- Empty state illustrations and CTAs center correctly
- Toast notifications appear top-right in LTR, top-left in RTL
- Dialog buttons follow RTL reading order (confirm on left, cancel on right)
- All padding/margin must use logical properties (`ps-4` not `pl-4`, `me-2` not `mr-2`)

### Rule 11: Accessibility Requirements for States

```
RULE: All state transitions must be announced to screen readers and maintain keyboard navigation.
```

- Loading states: `aria-busy="true"` on the loading container, `aria-live="polite"` on the region that will update
- Error states: `role="alert"` on error messages for immediate announcement
- Empty states: descriptive text accessible to screen readers (icon alone is insufficient)
- Dialogs: focus trapped, `role="dialog"`, `aria-modal="true"`, close on Escape
- Toast: `role="status"` with `aria-live="polite"`

### Rule 12: No Flickering State Transitions

```
RULE: Avoid flash-of-loading-state for fast responses. Show skeleton only after a 150ms delay.
```

- If data returns in < 150ms, skip the skeleton entirely and render populated state
- Use a `useDelayedLoading(isLoading, 150)` hook to gate skeleton visibility
- This prevents the annoying flash-of-skeleton on fast connections
- Does NOT apply to initial page load (always show skeleton immediately on navigation)

---

## Section 5: State Transition Map

Key transitions that implementation agents must wire correctly.

### 5.1 Standard Page Lifecycle

```
Navigate to page
  │
  ├─► [SKEL] Loading (skeleton matching layout)
  │     │
  │     ├─► [POPULATED] Data loaded successfully
  │     │     │
  │     │     ├─► [SPIN] User triggers action (save, delete, connect)
  │     │     │     ├─► [TOAST] Action success
  │     │     │     └─► [TOAST] Action error (retryable)
  │     │     │
  │     │     ├─► [FILT] User applies filter, zero results
  │     │     │     └─► [POPULATED] User clears filter
  │     │     │
  │     │     ├─► [DRAWER] User clicks row for detail
  │     │     │     └─► [POPULATED] User closes drawer
  │     │     │
  │     │     └─► [DIALOG] User triggers destructive action
  │     │           ├─► [SPIN] User confirms → action in progress
  │     │           └─► [POPULATED] User cancels
  │     │
  │     ├─► [FULL] Full page error (API down, 500)
  │     │     └─► [SKEL] User clicks "Try again"
  │     │
  │     └─► [ILLUS] Empty state (no data)
  │           └─► [SKEL] User clicks CTA → new data loading
  │
  └─► [FULL] Session expired (401 from middleware)
        └─► Redirect to /login with returnUrl
```

### 5.2 Progressive Operation Lifecycle

```
User triggers long operation (crawl, analyze, score)
  │
  ├─► [SPIN] Button enters loading state
  │
  ├─► [PROG] SSE stream opens
  │     │
  │     ├─► Progress bar + stage text updates
  │     │     └─► Partial results render as they arrive
  │     │
  │     ├─► [TOAST] Stream completes successfully
  │     │     └─► [POPULATED] Final data rendered
  │     │
  │     └─► [BANNER] Stream errors mid-way
  │           └─► Partial results preserved + "Retry" button
  │
  └─► [BANNER] SSE connection fails immediately
        └─► "Retry" button to attempt reconnection
```

---

## Section 6: Implementation Checklist

For each screen, the implementation agent must verify all applicable states exist before marking the screen as complete.

```
[ ] Loading state uses SKEL (Skeleton), not SPIN
[ ] Full-page error uses FULL with retry button
[ ] Partial error uses BANNER (Alert variant="destructive") with retry
[ ] Empty first-time uses ILLUS with icon + heading + description + CTA
[ ] Empty filtered uses FILT with "Clear filters" button
[ ] Populated state renders correctly with real data
[ ] Saving/mutating actions show SPIN inside the triggering button
[ ] Destructive actions use DIALOG (AlertDialog) with specific confirm text
[ ] Toast used for transient success/error only
[ ] Offline state shows BANNER, disables mutations
[ ] Session expired shows FULL, redirects to /login
[ ] Progressive operations use PROG (SSE + progress bar)
[ ] Dark mode renders correctly for all state patterns
[ ] RTL layout verified for all state patterns
[ ] aria attributes set correctly for all state transitions
[ ] No flash-of-skeleton for fast responses (150ms delay hook)
```

---

## Section 7: Summary

```
UI STATE MATRIX VERIFICATION:
  Total screens:                 15
  Screens meeting >= 6 states:   15/15 (100%)
  Total unique state patterns:   9 (SKEL, SPIN, PROG, ILLUS, FILT, BANNER, TOAST, FULL, DIALOG/DRAWER)
  Fundamental state coverage:    15/15 screens have loading + error + empty/N/A + populated
  Pattern consistency:           100% -- no screen deviates from the standard catalog
  Critical gaps:                 0
  Medium gaps:                   0
  Low gaps:                      4 (cosmetic / documentation-level)
  Mandatory agent rules:         12 rules codified
  State count range:             6 (Login) to 14 (Publish Manager)
  Average states per screen:     10.1

VERDICT: ALL 15 SCREENS PASS UI STATE COMPLETENESS. ZERO CRITICAL GAPS.
```
