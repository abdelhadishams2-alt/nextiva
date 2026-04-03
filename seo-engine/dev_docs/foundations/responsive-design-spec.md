# ChainIQ — Responsive Design Specification

> **Last Updated:** 2026-03-28
> **Stack:** Next.js 16 (App Router) + shadcn/ui (base-ui variant) + Tailwind CSS
> **Design:** Dark mode default, Geist Sans/Mono fonts, warm dark palette with gold accents
> **Total Screens:** 15 (8 existing + 7 new platform expansion)
> **Audience:** Engineering (solo developer), design review
> **Purpose:** Define responsive behavior for every component and screen across all breakpoints, including RTL support for MENA publisher clients

---

## 1. Breakpoint Tiers

Four breakpoints derived from real device usage. ChainIQ is a professional dashboard tool — tablet and desktop are the primary contexts, but mobile must remain functional for on-the-go status checks.

| Tier | Min Width | Tailwind Prefix | Target Devices | Usage Context |
|------|-----------|-----------------|----------------|---------------|
| Mobile | 375px | (default) | iPhone SE, Android compact | Quick status checks, notifications, approvals |
| Tablet | 768px | `md:` | iPad, Android tablets, small laptops | Content review, light editing, client demos |
| Desktop | 1024px | `lg:` | Laptops, external monitors | Primary workspace — full editing, analysis |
| Wide | 1440px | `xl:` | Large monitors, ultrawide | Data-dense views, side-by-side comparisons |

### Tailwind Configuration

```typescript
// tailwind.config.ts
export default {
  theme: {
    screens: {
      sm: '375px',   // Mobile — rarely used, default covers this
      md: '768px',   // Tablet
      lg: '1024px',  // Desktop
      xl: '1440px',  // Wide
    },
  },
}
```

**Design decision:** We use `sm` at 375px rather than Tailwind's default 640px. This gives us a meaningful breakpoint for small phones vs. larger phones. Most responsive logic lives at `md:` and `lg:` — `sm:` is a safety net, `xl:` is a luxury upgrade.

### Container Strategy

```
Mobile:  100vw, px-4 (16px gutters)
Tablet:  100vw, px-6 (24px gutters)
Desktop: max-w-7xl (1280px), px-8, mx-auto
Wide:    max-w-[1600px], px-8, mx-auto
```

No fixed-width containers below desktop. Content breathes on small screens.

---

## 2. Component Behavior Matrix

Every shared component with its behavior at each breakpoint. This is the source of truth for implementation — screen-specific overrides are documented in Section 3.

### 2.1 Sidebar (Custom — All Authenticated Pages)

| Behavior | Mobile | Tablet | Desktop | Wide |
|----------|--------|--------|---------|------|
| Visibility | Hidden (hamburger trigger) | Hidden (hamburger trigger) | Visible, collapsible | Visible, expanded |
| Width | Full overlay (280px) | Full overlay (280px) | 64px collapsed / 256px expanded | 256px expanded |
| Interaction | Swipe right to open, tap scrim to close | Tap hamburger, tap scrim to close | Click collapse toggle | Always expanded |
| Content | Full labels + icons | Full labels + icons | Icons only (collapsed) / Full (expanded) | Full labels + icons + section headers |
| Z-index | z-50 (above everything) | z-50 | z-30 (inline) | z-30 (inline) |
| Scrim | Yes, bg-black/50 | Yes, bg-black/50 | No | No |
| RTL | Opens from right edge | Opens from right edge | Docked right side | Docked right side |

**Implementation note:** Use `Sheet` from shadcn/ui on mobile/tablet (slides from left in LTR, right in RTL). On desktop, render as a persistent `aside` element. The collapse state persists in `localStorage`.

### 2.2 DataTable (shadcn/ui — Articles, Users, Inventory, Opportunities)

| Behavior | Mobile | Tablet | Desktop | Wide |
|----------|--------|--------|---------|------|
| Layout | Card list OR horizontal scroll | Table with column hiding | Full table | Full table + extra columns |
| Columns shown | 2-3 essential only | 4-5 columns | All standard columns | All columns + optional extras |
| Column hiding | Title + Status + Action only | Hide low-priority columns | Show all | Show all + metadata |
| Row actions | Tap row to expand, long-press for menu | Inline icon buttons | Inline icon buttons + text labels | Full action bar |
| Pagination | Infinite scroll (load more) | 10 rows, bottom pagination | 20 rows, bottom pagination | 25 rows, bottom pagination |
| Filters | Collapsed behind filter button | Collapsed behind filter button | Inline filter bar above table | Inline filter bar, multi-filter visible |
| Sort | Tap column header (if table mode) | Tap column header | Click column header with indicators | Click column header with indicators |
| Bulk select | Hidden | Checkbox column | Checkbox column + floating toolbar | Checkbox column + floating toolbar |
| Min touch target | 44x44px per action | 44x44px per action | No minimum (pointer) | No minimum (pointer) |

**Column Priority System:** Each DataTable instance defines column priorities (P1-P4). The responsive system shows columns based on available width:

| Priority | Mobile | Tablet | Desktop | Wide |
|----------|--------|--------|---------|------|
| P1 (essential) | Visible | Visible | Visible | Visible |
| P2 (important) | Hidden | Visible | Visible | Visible |
| P3 (useful) | Hidden | Hidden | Visible | Visible |
| P4 (supplementary) | Hidden | Hidden | Hidden | Visible |

**Per-table column priorities:**

- **Article Pipeline:** P1: Title, Status | P2: Author, Created | P3: Word Count, Blueprint | P4: Last Edit, Tags
- **User Management:** P1: Name, Role | P2: Email, Status | P3: Last Active, Created | P4: Articles Count
- **Content Inventory:** P1: URL/Title, Health Score | P2: Last Crawled, Traffic | P3: Decay Rate, Sparkline | P4: Word Count, Schema Type
- **Opportunities:** P1: Title, Score | P2: Type, Effort | P3: Confidence, Impact | P4: Evidence Summary, Created

### 2.3 Card (shadcn/ui — Dashboard, Article Detail, Performance, Connections)

| Behavior | Mobile | Tablet | Desktop | Wide |
|----------|--------|--------|---------|------|
| Layout | Stacked, full width | 2-column grid | 3-4 column grid | 4 column grid |
| KPI cards | 2-col grid, compact | 2-col grid | 4-col row | 4-col row with sparklines |
| Min height | Auto (content-driven) | 120px | 140px | 160px |
| Padding | p-3 | p-4 | p-5 | p-6 |
| Typography | text-sm values, text-xs labels | text-base values, text-sm labels | text-lg values, text-sm labels | text-xl values, text-sm labels |

### 2.4 Dialog / AlertDialog (shadcn/ui)

| Behavior | Mobile | Tablet | Desktop | Wide |
|----------|--------|--------|---------|------|
| Presentation | Full-screen sheet (bottom) | Centered modal, 90% width | Centered modal, max-w-lg | Centered modal, max-w-lg |
| Close method | Swipe down + X button | Click scrim + X | Click scrim + X + Escape | Click scrim + X + Escape |
| Form layout | Single column, stacked | Single column | Two-column for wide forms | Two-column for wide forms |
| Button placement | Sticky bottom bar | Bottom-right | Bottom-right | Bottom-right |
| Min touch target | 44x44px buttons | 44x44px buttons | Standard | Standard |

### 2.5 Badge (shadcn/ui — Status Indicators)

| Behavior | Mobile | Tablet | Desktop | Wide |
|----------|--------|--------|---------|------|
| Size | text-xs, px-2 py-0.5 | text-xs, px-2.5 py-0.5 | text-sm, px-2.5 py-0.5 | text-sm, px-3 py-1 |
| Content | Icon + abbreviated text | Icon + short text | Icon + full text | Icon + full text |
| Example | "●" or "Draft" | "● Draft" | "● Draft" | "● Draft — Updated 2h ago" |

### 2.6 Skeleton (All Loading States)

| Behavior | Mobile | Tablet | Desktop | Wide |
|----------|--------|--------|---------|------|
| Card skeleton | 1-column stack, 3 items | 2-column grid, 4 items | 4-column grid, 4 items | 4-column grid, 4 items |
| Table skeleton | 3 row shimmer cards | 5 row shimmer | 10 row shimmer | 12 row shimmer |
| Chart skeleton | Single rectangle pulse | Chart-shaped pulse | Chart-shaped pulse | Chart-shaped pulse |

### 2.7 Toast (Notifications)

| Behavior | Mobile | Tablet | Desktop | Wide |
|----------|--------|--------|---------|------|
| Position | Bottom center, full width - 32px | Bottom right | Bottom right | Bottom right |
| Width | calc(100% - 32px) | 360px | 400px | 400px |
| Stack | 1 visible, queue rest | 3 visible | 3 visible | 3 visible |
| Dismiss | Swipe right | Swipe right or auto | Auto or click X | Auto or click X |

### 2.8 Tabs (Article Detail, Settings, Voice Profiles)

| Behavior | Mobile | Tablet | Desktop | Wide |
|----------|--------|--------|---------|------|
| Layout | Horizontal scroll, no wrapping | Horizontal, all visible | Horizontal, all visible | Horizontal, all visible |
| Indicator | Bottom border, follows scroll | Bottom border | Bottom border | Bottom border |
| Overflow | Fade edges, scroll hint | No overflow | No overflow | No overflow |
| Tab size | Auto width, min 44px touch | Auto width | Fixed width | Fixed width |
| Content area | Full width, no padding change | Same container padding | Same container padding | Same container padding |

### 2.9 Chart (Recharts via shadcn/ui — Dashboard, Performance, Inventory)

| Behavior | Mobile | Tablet | Desktop | Wide |
|----------|--------|--------|---------|------|
| Height | 200px | 280px | 320px | 400px |
| Data points | Aggregated (weekly) | Aggregated (weekly) | Daily | Daily |
| Legend | Below chart, 2-col | Below chart, inline | Inline with chart header | Inline with chart header |
| Tooltip | Tap-and-hold | Tap or hover | Hover | Hover |
| Axis labels | Every 4th label, rotated 45deg | Every 2nd label | All labels | All labels |
| Grid lines | Y-axis only | Y-axis only | Both axes, subtle | Both axes, subtle |
| Interaction | Pinch to zoom (optional) | Tap data points | Hover crosshair | Hover crosshair |
| Margins | 8px | 16px | 24px | 32px |

### 2.10 ScoreRing (Custom — Quality Scores, Recommendation Confidence)

| Behavior | Mobile | Tablet | Desktop | Wide |
|----------|--------|--------|---------|------|
| Diameter | 48px | 64px | 80px | 96px |
| Stroke width | 4px | 5px | 6px | 6px |
| Center text | Score only (e.g., "78") | Score only | Score + label | Score + label + trend |
| Font size | text-sm | text-base | text-lg | text-xl |

### 2.11 TimelineChart (Custom — Performance Trends)

| Behavior | Mobile | Tablet | Desktop | Wide |
|----------|--------|--------|---------|------|
| Height | 180px | 260px | 320px | 400px |
| Series | 1 (primary metric only) | 2 (predicted + actual) | 2 with confidence band | 2 with confidence band + annotations |
| X-axis | Monthly labels | Bi-weekly labels | Weekly labels | Daily labels |
| Interaction | Tap for tooltip | Tap or hover | Hover with crosshair | Hover with crosshair + detail panel |

### 2.12 StatusDot (Custom — Connection Status)

| Behavior | Mobile | Tablet | Desktop | Wide |
|----------|--------|--------|---------|------|
| Size | 8px | 10px | 10px | 12px |
| Label | Adjacent text | Adjacent text | Adjacent text + timestamp | Adjacent text + timestamp + detail |
| Animation | Pulse for "syncing" | Pulse for "syncing" | Pulse for "syncing" | Pulse for "syncing" |

### 2.13 SyncSparkline (Custom — 30-Day Sync Dots)

| Behavior | Mobile | Tablet | Desktop | Wide |
|----------|--------|--------|---------|------|
| Visible days | 14 (last 2 weeks) | 21 | 30 | 30 |
| Dot size | 4px | 5px | 6px | 6px |
| Dot gap | 2px | 2px | 3px | 3px |
| Tooltip | None (too small) | Tap for date | Hover for date + status | Hover for date + status |

### 2.14 RadarChart (Custom SVG — Voice Persona Style Dimensions)

| Behavior | Mobile | Tablet | Desktop | Wide |
|----------|--------|--------|---------|------|
| Diameter | 160px | 220px | 280px | 320px |
| Axis labels | Abbreviated (3 chars) | Abbreviated (5 chars) | Full labels | Full labels |
| Overlays | 1 persona only | 2 persona comparison | 2 persona comparison | 3 persona comparison |
| Interaction | Tap axis for value | Tap for value | Hover for value | Hover for value + percentile |

---

## 3. Screen-Specific Responsive Breakdowns

The seven most data-dense screens with detailed responsive behavior.

### 3.1 Dashboard Home (`/`)

**Layout progression:**

```
Mobile (375px):
┌──────────────────────┐
│ ☰  Dashboard   [👤]  │
├──────────────────────┤
│ ┌────────┐┌────────┐ │
│ │ Total  ││ Success│ │
│ │ 127    ││ 94.2%  │ │
│ └────────┘└────────┘ │
│ ┌────────┐┌────────┐ │
│ │ Active ││ Errors │ │
│ │  8     ││   3    │ │
│ └────────┘└────────┘ │
│ ┌──────────────────┐ │
│ │ Activity Chart   │ │
│ │ (weekly agg)     │ │
│ └──────────────────┘ │
│ Recent Articles      │
│ ┌──────────────────┐ │
│ │ Title     Status │ │
│ │ Title     Status │ │
│ └──────────────────┘ │
│ Pipeline Status      │
│ ┌──────────────────┐ │
│ │ Idle, 0 queued   │ │
│ │ [New Article]     │ │
│ └──────────────────┘ │
└──────────────────────┘

Tablet (768px):
Same as mobile but KPI cards in a 4-col row,
chart gets more height, Recent Articles and
Pipeline Status sit side-by-side below chart.

Desktop (1024px+):
Sidebar visible. KPI cards 4-col row.
Chart spans full content width.
Recent Articles (60%) + Pipeline Status (40%)
side-by-side below chart.

Wide (1440px+):
Sidebar expanded with labels. KPI cards show
sparkline trends inside each card. Chart shows
daily data points. Recent Articles table shows
more columns.
```

**Key rules:**
- KPI cards: `grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-6`
- Chart: `h-[200px] md:h-[280px] lg:h-[320px] xl:h-[400px]`
- Bottom section: `flex flex-col md:flex-row gap-4 lg:gap-6`
- Recent articles: card list on mobile, mini-table on tablet+

### 3.2 Content Inventory (`/inventory`)

**Layout progression:**

```
Mobile:
- Search bar full width, filter button (opens sheet)
- Card list (not table): each card shows URL, Health score ring, last crawled
- Tap card to expand inline (shows sparkline, decay rate, details)
- Infinite scroll

Tablet:
- Search bar + 2 quick filter chips visible
- Table mode: URL, Health, Last Crawled, Traffic columns
- Sparklines hidden (column priority P3)

Desktop:
- Full filter bar: search + health range + content type + date range
- Full table: URL, Health, Traffic, Decay Rate, Sparkline, Last Crawled, Schema
- Inline row expansion for full detail

Wide:
- Same as desktop + Word Count, Schema Type columns visible
- Health score column includes mini bar chart
```

**Health Score rendering:**
- Mobile: Colored number badge (green/yellow/red)
- Tablet+: ScoreRing component (48px on tablet, 64px on desktop)
- Wide: ScoreRing + trend arrow

### 3.3 Opportunities (`/opportunities`)

**Layout progression:**

```
Mobile:
- Tab bar at top: All | Gap | Decay | Seasonal | Trending (scrollable)
- Card list: each card shows title, score ring (48px), type badge, effort badge
- Tap card → full-screen detail (evidence panel, recommended actions)
- No comparison mode

Tablet:
- Tab bar visible (all tabs fit)
- Two-panel: list (50%) + detail (50%)
- List shows score ring, title, type
- Detail panel shows evidence, recommended actions, confidence

Desktop:
- Tab bar + inline filters (score range, effort, type)
- List (40%) + Detail (60%)
- Detail panel includes evidence panel with expandable sections
- Score rings at 80px with trend indicators

Wide:
- Same as desktop
- Detail panel adds historical score timeline
- Evidence panel shows full source data inline
```

**Score ring thresholds:** 0-40 red, 41-70 amber, 71-100 green. Colors use CSS custom properties for theme consistency.

### 3.4 Voice Profiles (`/voice`)

**Layout progression:**

```
Mobile:
- Stacked persona cards (full width)
- Each card: name, avatar, style summary text
- Radar chart hidden — replaced with style dimension bars (horizontal)
- Tap card → detail sheet (full screen)
- No comparison mode

Tablet:
- 2-column card grid
- Radar chart visible at 160px inside each card
- Tap card → side panel detail
- Comparison mode: select 2, see overlay in modal

Desktop:
- 3-column card grid
- Radar chart at 220px, showing full labels
- Click card → inline expansion below card row
- Comparison mode: 2 personas, radar overlay in expanded section

Wide:
- 4-column card grid
- Radar chart at 280px, full labels
- Comparison mode: up to 3 personas, side-by-side radars
```

**Critical mobile decision:** Radar charts below 160px diameter become illegible. On mobile, replace with a horizontal stacked bar visualization showing each style dimension as a labeled bar. This is a progressive enhancement, not just a resize.

### 3.5 Publish Manager (`/publish`)

**Layout progression:**

```
Mobile:
- Two sections stacked: Queue (top), Platforms (bottom)
- Queue: card list with article title, target platform badge, status badge
- Swipe actions: publish now, reschedule, remove
- Platform cards: 1-column, shows status dot + name
- Batch operations hidden (too dangerous on small screens)

Tablet:
- Queue list (60%) + Platform sidebar (40%)
- Queue shows more detail: scheduled time, word count
- Platform cards: 2-column grid
- Batch select via checkboxes

Desktop:
- Three-column: Queue list (50%) + Preview (30%) + Platforms (20%)
- Preview panel shows rendered article excerpt
- Full batch toolbar: select all, publish batch, reschedule batch
- Drag-and-drop reorder in queue

Wide:
- Same as desktop with wider preview panel
- Platform cards show sync history sparkline
```

### 3.6 Performance (`/performance`)

**Layout progression:**

```
Mobile:
- KPI cards: 2x2 grid (Total Published, Avg Accuracy, Total Clicks, Avg CTR)
- Timeline chart: 180px height, monthly aggregation, single line (actual only)
- Article table: card list mode (title, accuracy badge, clicks)
- Detail drawer: full-screen sheet on article tap

Tablet:
- KPI cards: 4-column row
- Timeline chart: 260px, bi-weekly, predicted + actual lines
- Article table: standard table, 5 columns
- Detail drawer: right slide-over (50% width)

Desktop:
- KPI cards: 4-column with delta indicators
- Timeline chart: 320px, weekly data, predicted + actual + confidence band
- Article table: full columns, sortable
- Detail drawer: right slide-over (40% width)
- Filter bar: date range, platform, recommendation type

Wide:
- KPI cards: add sparkline inside each card
- Timeline chart: 400px, daily data, annotations for recalibration events
- Article table: all columns including signal breakdown
- Detail drawer: 35% width with embedded mini-charts
```

**Chart simplification rule:** On mobile, predicted-vs-actual dual lines collapse to actual-only with a single "accuracy" badge. The cognitive load of comparing two lines on a 375px screen is too high — show the summary instead.

### 3.7 Quality Report (`/articles/[id]/quality`)

**Layout progression:**

```
Mobile:
- Large score gauge top-center (120px diameter)
- Signal summary: 3 horizontal bars (Technical, Content, Authority)
- Checklist: accordion sections (each signal category collapses)
- 60-point list becomes scannable — show pass/fail icon + title only
- Tap item to expand explanation

Tablet:
- Score gauge (160px) + signal bars side-by-side
- Checklist: two-column layout
- Items show pass/fail + title + short description
- Expandable detail on tap

Desktop:
- Score gauge (200px) left + signal bars (stacked) right + summary text
- Checklist: three-column masonry layout
- Items show full detail inline
- Color-coded sections: green (pass), red (fail), amber (warning)

Wide:
- Score gauge (240px) + signal bars + historical score trend chart
- Checklist: three-column with full explanations visible
- Export button for PDF report
```

**60-point checklist strategy:** The checklist is the highest-density element in the entire platform. On mobile, only show failing items by default with a toggle to "Show all 60 checks." This reduces noise dramatically — a user on mobile cares about what is wrong, not what is right.

---

## 4. RTL Considerations

ChainIQ's initial market is MENA Arabic publishers. RTL support is not optional — it is a launch requirement.

### 4.1 Global RTL Strategy

```html
<!-- Root layout applies dir based on locale -->
<html lang={locale} dir={dir}>
```

**Tailwind CSS logical properties:** Use logical properties exclusively for spacing and layout. Never use `left`/`right` — use `start`/`end`.

| Physical (avoid) | Logical (use) | Effect in RTL |
|-------------------|---------------|---------------|
| `ml-4` | `ms-4` | Margin flips to right |
| `mr-4` | `me-4` | Margin flips to left |
| `pl-4` | `ps-4` | Padding flips to right |
| `pr-4` | `pe-4` | Padding flips to left |
| `left-0` | `start-0` | Position flips to right |
| `right-0` | `end-0` | Position flips to left |
| `text-left` | `text-start` | Text aligns right |
| `text-right` | `text-end` | Text aligns left |
| `rounded-l-lg` | `rounded-s-lg` | Border radius flips |
| `border-l` | `border-s` | Border flips |

### 4.2 Per-Breakpoint RTL Rules

**Mobile:**
- Sidebar sheet opens from right (start) instead of left
- Swipe gestures reverse: swipe-left-to-dismiss becomes swipe-right
- Tab scrolling direction reverses
- Toast slides in from left (end) instead of right

**Tablet:**
- Two-panel layouts reverse: list on right, detail on left
- DataTable horizontal scroll starts from right edge
- Filter bar aligns to right

**Desktop/Wide:**
- Sidebar docks on right side
- Chart Y-axis labels on right, data flows right-to-left
- Timeline charts read right-to-left (newest on left)
- DataTable action columns on left (start) side

### 4.3 Component-Specific RTL

| Component | RTL Behavior |
|-----------|-------------|
| Sidebar | Docks right, collapse arrow flips |
| DataTable | Columns mirror, action column on left, sort arrows unchanged |
| Tabs | Tab order reverses visually, scroll direction reverses |
| Badge | Icon position flips (icon on right of text) |
| Toast | Slides from left edge |
| Charts | Y-axis moves to right, X-axis reads right-to-left |
| ScoreRing | No change (circular, direction-agnostic) |
| RadarChart | Axis label positions mirror |
| SyncSparkline | Dot order reverses (newest on left) |
| Breadcrumbs | Separator arrows flip (← instead of →) |

### 4.4 Typography

- **Arabic body text:** Geist Sans has limited Arabic coverage. Use `IBM Plex Arabic` as the Arabic fallback in the font stack.
- **Numerals:** Use `font-variant-numeric: tabular-nums` for all numeric displays. Arabic-Indic numerals (٠١٢٣) are NOT used — MENA publishers use Western Arabic numerals (0123) in professional dashboards.
- **Line height:** Arabic text requires ~1.8 line height vs. 1.5 for Latin. Apply `leading-relaxed` on Arabic locale.
- **Font size:** Arabic characters are visually smaller at the same CSS font-size. Increase base font by 1px for Arabic locale (`text-[15px]` instead of `text-sm`).

---

## 5. Touch Target Specification

All interactive elements must meet minimum touch target sizes on touch devices (mobile and tablet breakpoints).

| Element | Minimum Size | Implementation |
|---------|-------------|----------------|
| Buttons | 44x44px | `min-h-[44px] min-w-[44px]` on mobile/tablet |
| Icon buttons | 44x44px | Padding expands hit area: `p-2.5` on a 24px icon |
| Table row actions | 44x44px | Each action icon gets 44px tap zone |
| Tab items | 44px height | `min-h-[44px]` |
| Checkbox / Radio | 44x44px | Wrapper div, not the input itself |
| Links in body text | 44px height | `py-2` on inline links in tap context |
| Close buttons (X) | 44x44px | Even if icon is 16px, hit area is 44px |
| Dropdown items | 44px height | `min-h-[44px]` per option |
| Toast dismiss | 44x44px | X button area |

**Spacing between touch targets:** Minimum 8px gap between adjacent interactive elements on mobile. This prevents mis-taps.

**Desktop exception:** On `lg:` and above, touch minimums are not enforced. Pointer devices allow smaller targets. Use `@media (pointer: fine)` for precise control when needed.

---

## 6. Responsive Testing Matrix

Every screen tested at every breakpoint. This matrix is the acceptance criteria for responsive implementation.

### 6.1 Full Matrix — All 15 Screens x 4 Breakpoints

| # | Screen | Mobile (375px) | Tablet (768px) | Desktop (1024px) | Wide (1440px) | RTL |
|---|--------|---------------|----------------|------------------|---------------|-----|
| 1 | Login/Signup | [ ] Single-column form, full-width inputs, 44px buttons | [ ] Centered card (480px max), same form | [ ] Centered card with brand panel left | [ ] Same as desktop | [ ] Form mirrored, labels align right |
| 2 | Dashboard Home | [ ] 2x2 KPI grid, stacked sections, weekly chart | [ ] 4-col KPIs, side-by-side bottom panels | [ ] Sidebar visible, full layout per wireframe | [ ] Sparklines in KPI cards, daily chart data | [ ] Full mirror, chart axis flipped |
| 3 | Article Pipeline | [ ] Card list, 2-3 fields, infinite scroll | [ ] Table, 4-5 cols, pagination | [ ] Full table, all columns, filters inline | [ ] Extra columns visible (P4) | [ ] Table mirrors, actions on left |
| 4 | Article Detail | [ ] Stacked tabs (scrollable), full-width content | [ ] Tabbed layout, 2-column metadata | [ ] Sidebar + full tabbed layout | [ ] Wider content area, inline metadata | [ ] Tab order preserved, content RTL |
| 5 | User Management | [ ] Card list, name + role + action | [ ] Table, 4 columns | [ ] Full table + bulk actions | [ ] All columns + activity metrics | [ ] Table mirrors |
| 6 | Plugin Configuration | [ ] Single-column form, stacked sections | [ ] Two-column form where logical | [ ] Sidebar + two-column settings | [ ] Same as desktop, wider fields | [ ] Form fields align right, labels right |
| 7 | Onboarding Wizard | [ ] Full-screen steps, bottom nav buttons | [ ] Centered card (600px), step indicator top | [ ] Centered card, illustration panel left | [ ] Same as desktop | [ ] Step progression right-to-left |
| 8 | Blueprint Gallery | [ ] 1-column card list, search top | [ ] 2-column grid, search + filters | [ ] 3-column grid, sidebar filters | [ ] 4-column grid, preview hover | [ ] Grid mirrors, search aligns right |
| 9 | Connections | [ ] Stacked provider cards, full width | [ ] 2-column provider grid | [ ] 3-column grid with status dots | [ ] 3-column + sync history sparklines | [ ] Cards mirror, status dots same |
| 10 | Content Inventory | [ ] Card list, health badge, infinite scroll | [ ] Table, 4-5 cols, health ring | [ ] Full table + sparklines + filter bar | [ ] All cols + mini health bar chart | [ ] Table mirrors, sparklines flip |
| 11 | Opportunities | [ ] Scrollable tabs, card list, tap for detail | [ ] Tabs + split panel (50/50) | [ ] Tabs + filters + split (40/60) | [ ] Full detail + historical timeline | [ ] Panels swap sides, tabs reverse |
| 12 | Voice Profiles | [ ] Stacked cards, bar chart (no radar), no comparison | [ ] 2-col grid, small radar, 2-persona compare | [ ] 3-col grid, 220px radar, inline expand | [ ] 4-col grid, 280px radar, 3-way compare | [ ] Cards mirror, radar labels flip |
| 13 | Publish Manager | [ ] Queue cards (swipe actions) + platform list | [ ] Queue list + platform sidebar | [ ] 3-panel: queue + preview + platforms | [ ] Wider preview panel | [ ] Queue on right, panels reverse |
| 14 | Performance | [ ] 2x2 KPIs, simple chart, card list | [ ] 4 KPIs, dual-line chart, table | [ ] Full layout + filter bar + drawer | [ ] Daily chart + annotations + sparklines | [ ] Full mirror, chart reads RTL |
| 15 | Quality Report | [ ] Score gauge + failing items only, accordion | [ ] Gauge + bars side-by-side, 2-col checklist | [ ] Gauge + bars + summary, 3-col checklist | [ ] + historical trend, full explanations | [ ] Gauge unchanged, checklist mirrors |

### 6.2 Test Procedure

For each cell in the matrix:

1. **Visual check:** Does the layout match the specification? No horizontal overflow? No content clipping?
2. **Touch targets:** On mobile/tablet, are all interactive elements >= 44x44px?
3. **Readability:** Is all text legible without zooming? Minimum 14px body text on mobile.
4. **Navigation:** Can the user reach every feature available at this breakpoint?
5. **Loading state:** Does the skeleton match the final layout shape?
6. **Error state:** Do error messages display without breaking layout?
7. **RTL check:** For RTL column, toggle `dir="rtl"` and verify full mirror.

### 6.3 Device Lab (Priority Test Devices)

| Device | Resolution | DPR | Priority |
|--------|-----------|-----|----------|
| iPhone SE (3rd gen) | 375x667 | 2x | P0 — minimum mobile |
| iPhone 15 Pro | 393x852 | 3x | P1 — common mobile |
| iPad Air | 820x1180 | 2x | P0 — primary tablet |
| iPad Pro 12.9" | 1024x1366 | 2x | P1 — tablet/desktop edge |
| MacBook Air 13" | 1440x900 | 2x | P0 — primary desktop |
| External 27" monitor | 2560x1440 | 1x | P1 — wide desktop |
| Samsung Galaxy A14 | 384x854 | 1.5x | P1 — budget Android (MENA market) |

---

## 7. Implementation Guidelines

### 7.1 Responsive Utility Pattern

Standardize responsive patterns as reusable Tailwind class groups:

```typescript
// lib/responsive.ts — Reusable responsive class sets

export const responsiveGrid = {
  kpiCards: 'grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-6',
  galleryCards: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6',
  formColumns: 'grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6',
  connectionCards: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
} as const;

export const responsiveText = {
  kpiValue: 'text-lg md:text-xl lg:text-2xl xl:text-3xl font-semibold font-mono',
  kpiLabel: 'text-xs md:text-sm text-muted-foreground',
  sectionTitle: 'text-base md:text-lg lg:text-xl font-semibold',
  bodyText: 'text-sm md:text-base leading-relaxed',
} as const;

export const responsiveSpacing = {
  pageGutter: 'px-4 md:px-6 lg:px-8',
  sectionGap: 'space-y-4 md:space-y-6 lg:space-y-8',
  cardPadding: 'p-3 md:p-4 lg:p-5 xl:p-6',
} as const;
```

### 7.2 Breakpoint-Aware Hooks

```typescript
// hooks/use-breakpoint.ts
import { useMediaQuery } from '@/hooks/use-media-query';

export function useBreakpoint() {
  const isMobile = !useMediaQuery('(min-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 768px)') && !useMediaQuery('(min-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isWide = useMediaQuery('(min-width: 1440px)');
  const isTouch = useMediaQuery('(pointer: coarse)');

  return { isMobile, isTablet, isDesktop, isWide, isTouch };
}
```

Use this hook sparingly — only for structural changes that CSS cannot handle (e.g., swapping a radar chart for a bar chart on mobile). Prefer Tailwind responsive classes for everything else.

### 7.3 Conditional Rendering Pattern

```tsx
// For structural differences (e.g., chart type swap)
const { isMobile } = useBreakpoint();

return isMobile
  ? <StyleDimensionBars persona={persona} />     // Horizontal bars
  : <RadarChart persona={persona} size={radarSize} />;  // Full radar

// For column hiding (DataTable)
const columns = useResponsiveColumns(allColumns, {
  mobile: ['title', 'status'],
  tablet: ['title', 'status', 'author', 'created'],
  desktop: allColumnKeys,
});
```

### 7.4 Container Query Consideration

For components that live in variable-width contexts (e.g., a card in a 2-column layout vs. a 4-column layout), use CSS container queries where supported:

```css
@container (min-width: 300px) {
  .score-ring { width: 80px; height: 80px; }
}
@container (min-width: 200px) {
  .score-ring { width: 48px; height: 48px; }
}
```

This is a progressive enhancement. Tailwind v4 has native `@container` support via `@container` variants.

---

## 8. Responsive Design Checklist

Pass/fail checklist for each screen before it ships. Every item must pass.

### 8.1 Layout

- [ ] **No horizontal overflow** at any breakpoint (375px through 1440px+)
- [ ] **Content is reachable** — no features hidden without an alternate path
- [ ] **Sidebar behavior correct** — overlay on mobile/tablet, persistent on desktop
- [ ] **Grid collapses gracefully** — 4-col → 2-col → 1-col without breaking
- [ ] **Max content width enforced** — lines of text do not exceed 80ch on wide screens
- [ ] **Spacing scales** — padding/margins use responsive tokens, not fixed values
- [ ] **Z-index layering correct** — modals above sidebar, sidebar above content, toasts above all

### 8.2 Typography

- [ ] **Minimum 14px body text** on mobile (no text-xs for body content)
- [ ] **Headings scale** — h1 is meaningfully larger than h2 at every breakpoint
- [ ] **Font loads** — Geist Sans/Mono load correctly, fallback does not cause layout shift
- [ ] **Arabic fallback** — IBM Plex Arabic loads for RTL locale
- [ ] **Truncation** — long text truncates with ellipsis, never breaks layout
- [ ] **Tabular numbers** — all numeric data uses tabular-nums for column alignment

### 8.3 Interaction

- [ ] **Touch targets >= 44x44px** on mobile and tablet
- [ ] **Touch target spacing >= 8px** between adjacent interactive elements
- [ ] **No hover-only interactions** — everything hoverable is also tappable
- [ ] **Swipe gestures have button alternatives** — swipe-to-dismiss also has X button
- [ ] **Focus indicators visible** — keyboard navigation works at every breakpoint
- [ ] **Scroll behavior smooth** — no janky scroll on data tables or long lists

### 8.4 Data Visualization

- [ ] **Charts readable** at mobile height (200px minimum)
- [ ] **Data points reduced** on mobile — weekly aggregation instead of daily
- [ ] **Legends accessible** — below chart on mobile, inline on desktop
- [ ] **Touch-friendly tooltips** — tap-and-hold or tap to reveal, not hover-only
- [ ] **Score rings legible** — minimum 48px diameter, score text readable
- [ ] **Radar chart fallback** — bar visualization on mobile instead of tiny radar

### 8.5 RTL

- [ ] **Logical properties only** — no `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`
- [ ] **Sidebar mirrors** — docks on right in RTL
- [ ] **Charts mirror** — Y-axis on right, time flows right-to-left
- [ ] **Icons flip** — directional icons (arrows, chevrons) flip in RTL
- [ ] **Form alignment** — labels and inputs align to right (start)
- [ ] **Tab order** — visual order matches DOM order in both LTR and RTL
- [ ] **No mixed direction** — English brand names stay LTR within RTL context (use `dir="ltr"` on specific elements)

### 8.6 Performance

- [ ] **No layout shift on load** — skeleton matches final layout dimensions
- [ ] **Images lazy-loaded** below the fold
- [ ] **Charts render after visible** — use intersection observer, not eager render
- [ ] **Mobile payload < 200KB** initial JS (code-split per route)
- [ ] **No unnecessary re-renders** on resize — debounce breakpoint hooks (150ms)

### 8.7 Accessibility

- [ ] **Screen reader announcements** for dynamic content changes (toast, drawer open)
- [ ] **Skip navigation link** visible on focus
- [ ] **Reduced motion** — respect `prefers-reduced-motion` for chart animations, skeleton pulse
- [ ] **Color not sole indicator** — status uses icon + color, never color alone
- [ ] **Contrast ratio >= 4.5:1** for text on dark backgrounds at all breakpoints

---

## 9. Maintenance Notes

**Solo developer considerations:**

1. **Test with Chrome DevTools device mode** as the primary method. Physical device testing is reserved for pre-release milestones.
2. **Use the responsive utility classes** from Section 7.1 — they reduce per-screen decision-making.
3. **Mobile-first CSS** — write default styles for mobile, layer on complexity with `md:`, `lg:`, `xl:`. This keeps the base simple.
4. **When adding a new screen:** Copy the closest existing screen's responsive structure, then adjust. Do not design from scratch.
5. **When in doubt about a breakpoint behavior:** Default to stacking (single column). Horizontal layouts are the exception that must be justified.

**Future considerations (not in scope for MVP):**

- Offline mode / PWA shell for mobile
- Native app wrapper (Capacitor) if mobile usage exceeds 20%
- Print stylesheet for Quality Report export
- Landscape tablet orientation (currently not optimized — works but not tuned)

---

## Appendix A: Breakpoint Decision Log

| Decision | Rationale |
|----------|-----------|
| 375px minimum, not 320px | iPhone SE is our floor. Sub-375px devices are < 2% of MENA market. |
| 768px tablet, not 640px | iPad is the primary tablet. 640px is an awkward no-man's-land. |
| 1024px desktop, not 1280px | Many MENA users on 13" laptops with 1024px effective width. |
| 1440px wide, not 1920px | Wide is a luxury tier. 1440px is achievable on most external monitors. |
| Radar chart → bars on mobile | Tested radar at 120px — completely illegible. Bars convey same info clearly. |
| Card list on mobile DataTables | Horizontal scroll on 375px is hostile UX. Cards with expand are natural on mobile. |
| Single-line chart on mobile Performance | Two overlapping lines at 200px height with 375px width — unreadable. Badge summary is better. |
| Failing-items-only on mobile Quality Report | 60 items in accordion on mobile is overwhelming. Show failures, toggle for all. |

---

## Appendix B: CSS Custom Properties for Responsive Tokens

```css
:root {
  /* Spacing scale — used by responsive utility classes */
  --spacing-page-x: 16px;
  --spacing-section-y: 16px;
  --spacing-card-padding: 12px;
  --chart-height: 200px;
  --score-ring-size: 48px;
  --radar-size: 160px;
  --sidebar-width: 0px;
  --touch-min: 44px;
}

@media (min-width: 768px) {
  :root {
    --spacing-page-x: 24px;
    --spacing-section-y: 24px;
    --spacing-card-padding: 16px;
    --chart-height: 280px;
    --score-ring-size: 64px;
    --radar-size: 220px;
    --sidebar-width: 0px;
    --touch-min: 44px;
  }
}

@media (min-width: 1024px) {
  :root {
    --spacing-page-x: 32px;
    --spacing-section-y: 32px;
    --spacing-card-padding: 20px;
    --chart-height: 320px;
    --score-ring-size: 80px;
    --radar-size: 280px;
    --sidebar-width: 64px; /* collapsed */
    --touch-min: 0px; /* pointer device */
  }
}

@media (min-width: 1440px) {
  :root {
    --spacing-page-x: 32px;
    --spacing-section-y: 32px;
    --spacing-card-padding: 24px;
    --chart-height: 400px;
    --score-ring-size: 96px;
    --radar-size: 320px;
    --sidebar-width: 256px; /* expanded */
  }
}
```

---

*This specification covers all 15 ChainIQ screens across 4 breakpoints with RTL support. It is the source of truth for responsive implementation decisions. When a screen spec and this document conflict on responsive behavior, this document wins.*
