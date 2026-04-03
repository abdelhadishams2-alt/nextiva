# Audit: UX & Screen Coverage

> **App:** article-engine (ChainIQ)
> **Dimension:** E1-B
> **Date:** 2026-03-26
> **Rounds completed:** 3/3

---

## Score: 4/10 — Needs Work

The article edit UI has a strong visual foundation and good error messaging, but has a critical blocking UX failure (10-minute black-box wait during edits), standard accessibility gaps, and no onboarding for the approval-gate auth model. The missing admin UI and article management dashboard represent the largest gaps for a production product.

---

## Round 1 Findings (Surface Scan)

### All UI Surfaces in the Application

| # | Surface | Type | Status |
|---|---------|------|--------|
| 1 | CLI interaction (topic input → progress messages → file output) | Terminal | Working |
| 2 | Generated article HTML (reader view) | Browser | Working |
| 3 | Section edit overlay (per-section edit trigger + modal) | Browser (injected) | Working |
| 4 | Edit status toast (success/error) | Browser (injected) | Working |
| 5 | Bridge server API responses | JSON API | Working |
| 6 | Admin dashboard | — | **MISSING** |
| 7 | Article pipeline manager | — | **MISSING** |
| 8 | User registration/login UI | — | **MISSING** (API-only) |
| 9 | Analytics/monitoring dashboard | — | **MISSING** |
| 10 | Plugin configuration UI | — | **MISSING** |

### State Coverage per Surface

| Surface | Loading | Error | Empty | Success |
|---------|---------|-------|-------|---------|
| CLI progress | Yes (progress messages) | Partial (some errors shown) | N/A | Yes |
| Article HTML | N/A (static) | N/A | N/A | Yes |
| Edit overlay | **No** (10-min black box) | Yes (toast) | N/A | Yes (toast) |
| Bridge API | N/A | Yes (JSON errors) | N/A | Yes |

### User Flows Documented?
- Article generation pipeline: Documented in SKILL.md (internal, not user-facing)
- Edit workflow: Partially documented in draft-writer.md
- Auth flow: Not documented for end users
- Admin flow: Not documented at all

### Mobile Responsive?
- Generated articles: **Partially** — the article HTML uses responsive CSS but the sidebar TOC and edit buttons are not optimized for mobile
- Edit overlay: **No** — fixed positioning, no mobile adaptation
- Everything else: N/A (CLI or API)

### Navigation Patterns
- None — there is no multi-page navigation. Each article is a standalone HTML file.

---

## Round 2 Findings (Deep Dive)

### Main User Journey Walkthrough

**Step 1: User invokes `/article-engine Manchester United`**
- CLI shows progress messages (good)
- No estimated time shown (12-20 minutes is a long wait with no ETA)

**Step 2: Project analysis runs**
- Silent — user sees "Analyzing your website's design system..." but no details

**Step 3: Research engine runs (6 rounds)**
- User sees "Researching topic — this may take a few minutes..."
- **Friction:** "A few minutes" undersells the actual 5-10 minute wait

**Step 4: Concept selection**
- User sees 5 concepts and must choose
- **Good:** Clear options with descriptions
- **Friction:** No preview of what each concept would look like

**Step 5: Architecture + images + writing**
- Multiple progress messages
- **Friction:** The writing step is the longest (5-10 min) with no progress indicator

**Step 6: Article delivered**
- File saved, user opens in browser
- **Good:** Clear success message with file path

**Step 7: User clicks "Edit" on a section**
- Edit overlay appears with textarea
- User types changes, clicks "Apply Edit"
- **CRITICAL FRICTION:** Edit prompt copied to clipboard. If bridge server is running, it processes automatically. If not, user must manually run `/apply-edit`. The 10-minute timeout means the user stares at a potentially unresponsive overlay with no progress indication.

### Bridge Server Response Quality
- Error messages are clear and actionable (e.g., "Token expired", "Admin config not available")
- **Gap:** 409 Conflict response for concurrent edits gives no guidance ("An edit is already in progress" but no "try again in X seconds" or queue position)
- **Gap:** `/health` response leaks `projectDir` (filesystem path) — not a UX issue but an information disclosure

### Generated HTML Accessibility
- **No ARIA labels** on edit buttons or overlay modal
- **No focus trap** in edit overlay — tabbing escapes the modal
- **No Escape key handler** to close the edit overlay
- **No `role="dialog"`** on the overlay
- **No `aria-live` region** for status toasts
- **No skip-to-content link** in article layout
- Color contrast in the edit UI: likely adequate (dark overlay) but not verified
- Keyboard navigation: edit buttons are `<button>` elements (good) but overlay textarea has no label

### Edit Overlay Usability
- **No loading state** — after clicking "Apply Edit", user sees nothing happening for up to 10 minutes
- **No cancel-in-progress** — once an edit is submitted, there's no way to cancel
- **No undo** — edited sections cannot be reverted
- **No diff view** — user can't see what changed after an edit completes

### Missing States in Edit Workflow
- Loading/processing state (edit in progress)
- Queue state (another edit is running)
- Timeout state (edit exceeded 10 minutes)
- Offline state (bridge server not running)
- Auth expired state (token no longer valid)

---

## Round 3 Recommendations

### Missing UI Surfaces for a Complete Product

1. **Admin Dashboard** — User management, subscription approvals, usage analytics
2. **Article Pipeline Manager** — View/manage article queue, drafts, published articles
3. **Plugin Configuration UI** — Manage API keys, Supabase config, agent settings, blueprint preferences
4. **User Auth UI** — Login/signup forms (currently API-only)
5. **Analytics Dashboard** — Article performance, generation stats, error rates
6. **Edit Progress Indicator** — Real-time status during the 10-minute edit window
7. **Article Gallery** — Browse all generated articles with thumbnails
8. **Blueprint Browser** — Visual catalog of the 193 component blueprints

### Single Biggest UX Improvement
**Add a real-time progress indicator to the edit workflow.** The 10-minute black-box wait is the #1 UX failure. Options:
- WebSocket connection from the article's edit UI to the bridge server for live status
- Polling endpoint that returns edit progress (started, processing, writing, complete)
- At minimum: a spinner with elapsed time and "Editing section... this may take 1-2 minutes"

### Redesign vs. Polish

| Surface | Verdict | Why |
|---------|---------|-----|
| Edit overlay | **Redesign** | Missing loading state, accessibility, focus management, progress — fundamental gaps |
| CLI progress messages | **Polish** | Add ETAs, more granular progress, elapsed time |
| Generated article HTML | **Polish** | Add ARIA labels, skip-to-content, mobile sidebar collapse |
| Bridge API responses | **Polish** | Add Retry-After headers, remove projectDir from /health |

---

## P0 Issues (Fix Immediately)
- No loading/progress state during edit processing (10-minute black box)
- No ARIA attributes on edit overlay (accessibility failure)

## P1 Issues (Fix Before Scaling)
- No admin dashboard (all admin operations require API calls)
- No user-facing auth UI (login/signup is API-only)
- No mobile optimization for edit overlay
- No undo/revert for edited sections
- Missing 5+ critical UI surfaces for a complete product
