# Design System Roadmap -- ChainIQ Platform Expansion

**Last Updated:** 2026-03-28
**Analyst:** ChainIQ Design Research
**Purpose:** Phase-by-phase plan to build the design system supporting ChainIQ's expansion from 8 to 15 screens, with full dark mode, accessibility, and RTL/Arabic support.

**Total Timeline:** 6 weeks (Phases 1-4)
**Dependencies:** Next.js 16 app shell must exist. shadcn/ui must be initialized. Tailwind CSS configured.

---

## Phase 1: Foundation (1 Week)

**Goal:** Establish the design token layer and visual foundation so all subsequent component work has a consistent base. No custom components yet -- just the system that components will consume.

### Deliverables

**1.1 Color Token System**
Define all color tokens as CSS custom properties in `globals.css` and map them to Tailwind config. Tokens organized in three tiers:
- **Primitive tokens:** Raw color values (e.g., `--gray-900: #171717`)
- **Semantic tokens:** Purpose-mapped values (e.g., `--bg-primary: var(--gray-950)`, `--text-danger: var(--red-500)`)
- **Component tokens:** Component-specific overrides (e.g., `--card-bg: var(--bg-secondary)`)

Include the full chart color palette (5 series minimum) and score color ramp (red-yellow-green gradient stops).

Effort: 1 day
Dependencies: Tailwind CSS configured, design direction chosen (see `design-language-options.md`)

**1.2 Spacing Scale**
Define a consistent spacing scale on a 4px base grid:
- `--space-1: 4px` through `--space-16: 64px`
- Map to Tailwind spacing utilities
- Document card padding standards (20-24px), table row heights (44px default), section gaps (24-32px)
- Define responsive adjustments (tighter on mobile, default on desktop)

Effort: 0.5 day
Dependencies: None

**1.3 Shadow System**
Define elevation layers for dark mode (shadows are less visible on dark backgrounds, so use border + subtle light overlay instead):
- `--elevation-0`: No elevation (flat)
- `--elevation-1`: 1px border + 2% white overlay (cards on background)
- `--elevation-2`: 1px border + 4% white overlay (dropdowns, tooltips)
- `--elevation-3`: 1px border + 6% white overlay (modals, command palette)

Effort: 0.5 day
Dependencies: Color tokens (1.1)

**1.4 Icon Set Selection**
Evaluate and select a single icon library for consistency:
- **Recommended:** Lucide Icons (already common in shadcn/ui ecosystem, MIT license, tree-shakeable, 1400+ icons)
- **Alternative:** Heroicons or Phosphor if Lucide lacks specific SEO/content icons
- Define custom icon requirements: content score, voice profile, connection status, publish pipeline
- If needed, commission 5-10 custom icons for ChainIQ-specific concepts

Effort: 0.5 day
Dependencies: None

**1.5 Typography Scale**
Formalize the Geist Sans/Mono type system:
- Define font size scale: 11px (xs), 13px (sm), 14px (base), 16px (lg), 20px (xl), 24px (2xl), 32px (3xl)
- Define font weight usage: 400 (body), 500 (emphasis/headings), 600 (strong headings)
- Define Geist Mono usage rules: all numbers in data contexts, code snippets, IDs
- Document Arabic font pairing: Cairo at corresponding sizes (+1px)
- Set up `@font-face` declarations and Tailwind font-family config

Effort: 0.5 day
Dependencies: None

### Phase 1 Total Effort: 3 days (1 designer-developer)
### Phase 1 Gate: All tokens documented, Tailwind config updated, Storybook or preview page showing token swatches

---

## Phase 2: Core Components (2 Weeks)

**Goal:** Build the 7 new custom components and establish data visualization patterns, loading/empty/error states. At the end of Phase 2, every screen in the expanded platform has the components it needs.

### Deliverables

**2.1 ScoreRing Component**
Build the circular score indicator in three sizes with color-coded fill, animated mount, and full accessibility.
- Props: `value`, `max`, `size`, `label`, `showLabel`, `colorScheme`
- Tests: Render at 0, 50, 100. Test `aria-valuenow`. Test reduced-motion behavior.

Effort: 1.5 days
Dependencies: Color tokens (1.1)

**2.2 TimelineChart Component**
Extend shadcn Chart with ChainIQ defaults: comparison period overlay, annotation markers, time range selector, crosshair tooltip.
- Props: `data`, `series`, `comparisonData`, `annotations`, `timeRange`, `onTimeRangeChange`
- Tests: Render with single/multi-series data. Test time range switching. Test accessible data table fallback.

Effort: 3 days
Dependencies: Chart shadcn component, color tokens (1.1)

**2.3 StatusDot Component**
Build the compact connection health indicator with pulse animation.
- Props: `status`, `size`, `label`
- Tests: Render all 5 states. Test pulse animation respects `prefers-reduced-motion`. Test `aria-label`.

Effort: 0.5 day
Dependencies: Color tokens (1.1)

**2.4 HeatMap Component**
Build the grid visualization for persona priorities and keyword density.
- Props: `data`, `rowLabels`, `colLabels`, `colorScale`, `onCellClick`
- Tests: Render 5x5 grid. Test keyboard navigation (arrow keys). Test screen reader cell announcements.

Effort: 2 days
Dependencies: Color tokens (1.1)

**2.5 RecommendationCard, PersonaCard, PublishStatusBadge**
Build the three card/badge components as compositions of existing shadcn primitives (Card, Badge, Button, Collapsible).
- RecommendationCard embeds ScoreRing, Badge, Button, Collapsible
- PersonaCard embeds Card, Badge, Progress, Button
- PublishStatusBadge extends Badge with icon and state logic

Effort: 2 days (combined)
Dependencies: ScoreRing (2.1), shadcn Card/Badge/Button

**2.6 Data Visualization Patterns**
Standardize chart defaults across the platform:
- Default chart color palette (5 series)
- Tooltip format standard (value, label, comparison)
- Axis label formatting (abbreviated numbers: 1.2K, 45.3K)
- Responsive chart behavior (hide legend on mobile, stack tooltip below)
- Empty chart state: "No data for this period" with illustration

Effort: 1 day
Dependencies: TimelineChart (2.2), color tokens (1.1)

**2.7 Loading / Empty / Error State Patterns**
Define reusable state patterns for every screen type:
- **Loading:** Skeleton patterns for cards (pulsing rectangles), tables (row skeletons), charts (axis + area skeleton)
- **Empty:** Illustration + heading + description + CTA button (e.g., "No articles yet. Create your first article.")
- **Error:** Red banner with error message + retry button + support link
- Each pattern built as a reusable wrapper component: `<StateWrapper loading={isLoading} empty={isEmpty} error={error}>`

Effort: 1.5 days
Dependencies: Skeleton shadcn component, icon set (1.4)

### Phase 2 Total Effort: 11.5 days (1-2 developer-designers)
### Phase 2 Gate: All 7 custom components built, tested, and documented. Data viz defaults applied. State patterns usable across all screens.

---

## Phase 3: Polish and Power Features (2 Weeks)

**Goal:** Add the interaction layer that makes ChainIQ feel premium: animations, micro-interactions, keyboard shortcuts, and the command palette. This is what separates "functional" from "delightful."

### Deliverables

**3.1 Animation System**
Define and implement the motion language:
- **Enter animations:** Fade-in + slight upward slide (8px) for cards and panels, 200ms
- **Exit animations:** Fade-out, 150ms
- **Layout transitions:** Smooth height/width transitions for collapsible sections, 250ms
- **Score animations:** ScoreRing fill-in on mount, number count-up for KPI cards
- **Status transitions:** Color fade between states (e.g., StatusDot green -> yellow), 300ms
- **Page transitions:** Subtle crossfade between routes using Next.js View Transitions API
- All animations respect `prefers-reduced-motion: reduce`

Effort: 2 days
Dependencies: All Phase 2 components

**3.2 Micro-Interactions**
Add tactile feedback to common actions:
- Button press: subtle scale-down (0.98) on active state
- Card hover: border brightens, subtle background lift
- Table row hover: full-row highlight with smooth transition
- Checkbox/toggle: spring animation on state change
- Toast: slide-in from edge with spring easing
- Score change: number morphs between old and new value (300ms)

Effort: 2 days
Dependencies: Animation system (3.1)

**3.3 Keyboard Shortcut System**
Implement global and contextual keyboard shortcuts:
- Global: `Cmd+K` (command palette), `Cmd+/` (shortcut reference), `G then D` (go to dashboard), `G then A` (go to articles), `G then I` (go to inventory), `G then O` (go to opportunities)
- List screens: `J/K` (navigate rows), `Enter` (open item), `F` (focus filter), `N` (new item)
- Detail screens: `E` (edit), `Esc` (back to list), `Tab` (next tab)
- Shortcut reference panel: toggled by `Cmd+/` or `?`, shows all available shortcuts for current context
- Implementation: Custom React hook `useKeyboardShortcuts` with context-aware binding

Effort: 3 days
Dependencies: Navigation structure finalized

**3.4 Command Palette**
Build a Linear-style command palette as the power-user navigation hub:
- Triggered by `Cmd+K` (or `Ctrl+K` on Windows)
- Fuzzy search across: all 15 screens (by name), recent articles (by title), opportunities (by keyword), voice profiles (by name), actions (create, publish, connect)
- Recent items section (last 5 accessed)
- Keyboard navigation: arrow keys to select, Enter to execute, Esc to close
- Results grouped by category: Pages, Articles, Actions, Settings
- Responsive: full-width on mobile, centered modal (640px max) on desktop
- Implementation: Built on shadcn Dialog with custom search logic (no external dependency)

Effort: 4 days
Dependencies: Keyboard shortcut system (3.3), all screen routes defined

**3.5 Notification System**
Build the notification layer for background events:
- Toast notifications for immediate feedback (publish success, connection error)
- Notification bell with unread count in the shell header
- Notification dropdown: list of recent events with timestamps and action links
- Notification types: success, error, warning, info, system
- Sound: optional (off by default), subtle chime for publish complete

Effort: 2 days
Dependencies: Toast shadcn component, shell layout

### Phase 3 Total Effort: 13 days (1-2 developers)
### Phase 3 Gate: Command palette functional with fuzzy search. Keyboard shortcuts documented and working. Animations smooth and motion-safe. Notification system delivering real events.

---

## Phase 4: Arabic / RTL Support (1 Week)

**Goal:** Full RTL layout support for Arabic-speaking users. This is ChainIQ's competitive moat -- zero competitors offer an RTL content intelligence dashboard. It must be flawless.

### Deliverables

**4.1 RTL Layout Mirror**
Apply CSS logical properties throughout the codebase:
- Audit every `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-` Tailwind class and replace with logical equivalents (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`)
- Mirror the sidebar to the right edge when `dir="rtl"`
- Reverse DataTable column order
- Flip all directional icons (chevrons, arrows) using `rtl:rotate-180`
- Test all 15 screens in RTL mode

Effort: 2 days
Dependencies: All Phase 2-3 components built

**4.2 Arabic Typography**
Integrate Arabic font and adjust typography for Arabic text:
- Add Cairo font (Google Fonts) as the Arabic font family
- Add Tajawal as an alternative for lighter-weight contexts
- Configure `font-family` cascade: `Cairo, Geist Sans, sans-serif` for Arabic locale
- Adjust base font size to 15px for Arabic (vs 14px for Latin)
- Increase line-height to 1.7 for Arabic body text
- Remove negative letter-spacing for Arabic text
- Test all typography scale levels with Arabic content

Effort: 1 day
Dependencies: Typography scale (1.5)

**4.3 Bidirectional Text Handling**
Handle mixed Arabic/English content:
- Set `dir="auto"` on all user-generated content blocks (article titles, descriptions)
- Ensure URL and email fields remain `dir="ltr"` regardless of locale
- Handle number formatting: confirm SRMG preference for Western (0-9) vs Eastern Arabic numerals
- Test mixed-direction text in: DataTable cells, RecommendationCard titles, PersonaCard descriptions, CommandPalette search results
- Add `lang="ar"` attribute to Arabic text elements for correct screen reader pronunciation

Effort: 1 day
Dependencies: RTL layout mirror (4.1)

**4.4 RTL Component Testing**
Systematic testing of every component in RTL mode:
- Visual regression testing for all 15 screens in RTL
- Keyboard navigation testing (Tab order should reverse for RTL)
- Screen reader testing with Arabic voice (NVDA or VoiceOver with Arabic)
- Touch target verification in RTL layout
- Fix any issues discovered

Effort: 1.5 days
Dependencies: All previous Phase 4 deliverables

### Phase 4 Total Effort: 5.5 days (1 developer + RTL/Arabic reviewer)
### Phase 4 Gate: All 15 screens pass visual inspection in RTL. Arabic typography renders correctly. Mixed-direction content handles gracefully. Accessibility maintained in RTL mode.

---

## Timeline Summary

| Phase | Duration | Effort | Key Deliverables |
|-------|----------|--------|-----------------|
| Phase 1: Foundation | Week 1 | 3 days | Color tokens, spacing, shadows, icons, typography |
| Phase 2: Core | Weeks 2-3 | 11.5 days | 7 custom components, data viz patterns, state patterns |
| Phase 3: Polish | Weeks 4-5 | 13 days | Animations, keyboard shortcuts, command palette, notifications |
| Phase 4: Arabic/RTL | Week 6 | 5.5 days | RTL layout, Arabic typography, bidirectional text, RTL testing |
| **Total** | **6 weeks** | **33 days** | **Complete design system for 15-screen platform** |

---

## Dependency Graph

```
Phase 1 (Foundation)
├── 1.1 Color Tokens ──────┬──► 2.1 ScoreRing
│                          ├──► 2.2 TimelineChart
│                          ├──► 2.3 StatusDot
│                          ├──► 2.4 HeatMap
│                          └──► 2.6 Data Viz Patterns
├── 1.2 Spacing Scale ─────────► All Phase 2 components
├── 1.3 Shadow System ─────────► Phase 2 card components
├── 1.4 Icon Set ───────────┬──► 2.5 Cards & Badges
│                           └──► 2.7 Empty States
└── 1.5 Typography ─────────────► 4.2 Arabic Typography

Phase 2 (Core)
├── 2.1 ScoreRing ──────────────► 2.5 RecommendationCard
├── 2.2 TimelineChart ──────────► 2.6 Data Viz Patterns
├── 2.5 Cards & Badges ─────────► 3.2 Micro-interactions
└── 2.7 State Patterns ─────────► All screens

Phase 3 (Polish)
├── 3.1 Animation System ──────► 3.2 Micro-interactions
├── 3.3 Keyboard Shortcuts ────► 3.4 Command Palette
└── All Phase 3 ────────────────► Phase 4 (RTL must test final components)

Phase 4 (Arabic/RTL)
├── 4.1 RTL Layout ────────────► 4.3 Bidirectional Text
├── 4.2 Arabic Typography ─────► 4.3 Bidirectional Text
└── 4.1 + 4.2 + 4.3 ──────────► 4.4 RTL Testing
```

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Arabic typography renders differently across browsers | High | Test on Chrome, Firefox, Safari, Edge with real Arabic content from SRMG |
| RTL logical properties not supported by older Tailwind plugins | Medium | Verify Tailwind v4 RTL support; fallback to manual `[dir="rtl"]` selectors |
| Recharts (shadcn Chart base) has limited RTL support | High | Test early in Phase 2; prepare to fork tooltip/axis rendering if needed |
| Command palette search performance on large content inventories | Medium | Implement client-side fuzzy search with Fuse.js or custom scoring; limit to 50 results |
| Custom HeatMap component complexity exceeds estimate | Medium | Start with simple CSS grid implementation; defer canvas rendering to Phase 3 if needed |
| Animation system conflicts with Next.js View Transitions | Low | Test early; fall back to CSS transitions if View Transitions API is unstable |
