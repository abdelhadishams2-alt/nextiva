# Frontend Technical Feasibility Assessment

**Assessment Date:** 2026-03-28
**Assessed By:** Senior Engineer (Technical Tribunal)
**Scope:** Dashboard expansion from 7 existing pages to 14 pages

---

## 1. Current Next.js 16 + shadcn/ui Architecture

### Verified Dependencies (from `dashboard/package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.2.1 | Framework |
| react | 19.2.4 | UI library |
| react-dom | 19.2.4 | DOM rendering |
| shadcn | ^4.1.0 | Component system |
| @base-ui/react | ^1.3.0 | Base UI primitives (shadcn v4 backend) |
| class-variance-authority | ^0.7.1 | Variant styling |
| clsx | ^2.1.1 | Classname merging |
| tailwind-merge | ^3.5.0 | Tailwind class deduplication |
| tw-animate-css | ^1.4.0 | Animations |
| lucide-react | ^1.7.0 | Icons |

**Dev dependencies:** Tailwind CSS v4, TypeScript 5, ESLint, babel-plugin-react-compiler (React 19 compiler).

**Key observation:** The dashboard uses shadcn v4 (base-ui variant), not the older radix-ui variant. This is significant because shadcn v4 uses `@base-ui/react` primitives, which have a different API surface than radix. Component reuse must account for this.

**No data visualization library is currently installed.** Charts, score rings, and heat maps will require adding one.

---

## 2. Seven New Pages — Component Reuse Potential

### Proposed New Pages

| # | Page | Primary Components | Data Density |
|---|------|--------------------|-------------|
| 1 | Connections | OAuth buttons, status cards, account list | Low |
| 2 | Content Inventory | Data table, filters, search, status badges | High |
| 3 | Opportunities | Tabs (4), scored cards, action buttons, filters | High |
| 4 | Voice Profiles | Persona cards, radar chart, edit forms | Medium |
| 5 | Publishing | Platform list, publish history table, push button | Medium |
| 6 | Performance | Line charts, comparison tables, accuracy scores | High |
| 7 | Quality Report | Score ring, checklist accordion, suggestion cards | Medium |

### Reuse Matrix

**Existing components that transfer directly:**

- **Data tables** — The existing articles list, admin users list, and usage logs all use table patterns. The Content Inventory and Publishing History pages reuse this pattern with different columns.
- **Status badges** — Active/pending/expired badges exist for subscriptions. Extend to healthy/decaying/cannibalized for content status.
- **Card layouts** — API key cards, article cards. Reuse for connection cards, persona cards, opportunity cards.
- **Tabs** — Admin panel already has 4 tabs. Opportunities page needs 4 tabs (Gaps, Decay, Cannibalization, Trending).
- **Forms** — Settings form pattern. Reuse for persona editing, connection configuration.
- **Sidebar navigation** — Already exists. Add 7 new nav items (per Section 8 of PROJECT-BRIEF).

**New components needed:**

- Score ring (circular progress indicator for quality scores)
- Line chart (performance trends over time)
- Bar chart (keyword volume comparison)
- Heat map (content health grid view)
- Radar chart (voice profile visualization)
- Timeline (content decay progression)
- OAuth button with provider branding (Google, Semrush, Ahrefs)
- Multi-select filter bar (for Content Inventory filtering)
- Drag-and-drop priority list (for opportunity ranking — optional, can start with static list)

**Estimated reuse rate: 40-50%.** The data-heavy pages (Content Inventory, Opportunities, Performance) need significant new UI that does not exist in the current dashboard. The simpler pages (Connections, Publishing, Quality Report) have high reuse potential.

---

## 3. Data Visualization Needs

### What shadcn Provides Natively

shadcn v4 provides: buttons, inputs, selects, dialogs, dropdowns, tabs, accordion, toast, badge, card, table, avatar, separator, tooltip, popover, command palette, checkbox, radio, switch, slider, progress bar.

**shadcn does NOT provide:** charts, graphs, score rings, heat maps, radar charts, or any data visualization. These must come from an additional library.

### Recommended: Recharts

| Criteria | Recharts | Nivo | Victory | Chart.js (react-chartjs-2) |
|----------|----------|------|---------|---------------------------|
| React 19 compat | Yes | Yes | Partial | Yes |
| Bundle size | 145KB | 200KB+ | 120KB | 80KB (but needs canvas) |
| SSR support | Yes (SVG) | Yes (SVG) | Yes (SVG) | No (canvas-based) |
| shadcn theming | Easy (CSS vars) | Moderate | Moderate | Hard |
| Tree-shaking | Yes | Yes | Yes | Partial |
| Actively maintained | Yes | Yes | Slowing | Yes |

**Recharts is the recommended choice.** It renders SVG (good for SSR/Next.js), integrates well with Tailwind CSS variables for theming, supports all needed chart types (line, bar, area, radar, pie), and tree-shakes well.

### Chart Type Mapping

| Visualization Need | Chart Type | Recharts Component |
|--------------------|-----------|-------------------|
| Traffic trend over time | Line chart | `<LineChart>` with `<Line>` |
| Keyword volume comparison | Bar chart | `<BarChart>` with `<Bar>` |
| Quality score ring | Radial bar | `<RadialBarChart>` or custom SVG |
| Voice profile radar | Radar chart | `<RadarChart>` with `<Radar>` |
| Content health grid | Heat map | Custom — Recharts lacks native heat map. Use CSS grid with color-coded cells. |
| Decay timeline | Area chart | `<AreaChart>` with gradient fill |
| Performance prediction vs actual | Dual-line chart | `<LineChart>` with two `<Line>` elements |
| Score distribution | Pie/donut | `<PieChart>` with inner radius |

**Heat map gap:** Recharts does not have a native heat map component. Two options:
1. Build a custom CSS grid component with Tailwind background colors (recommended — simpler, lighter)
2. Use a dedicated heat map library (e.g., `react-calendar-heatmap` — adds another dep)

**Effort for all visualizations: L (1-2 weeks)** including responsive breakpoints and dark mode theming.

---

## 4. Real-Time Data: Server-Sent Events (SSE)

The bridge server already implements SSE for two features:
1. **Edit progress:** 6-stage progress streaming during section editing
2. **Generation progress:** Job queue progress during article generation

Both use raw HTTP response writing:
```javascript
res.writeHead(200, {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive'
});
res.write(`data: ${JSON.stringify(payload)}\n\n`);
```

**New SSE needs:**
- Ingestion progress (data pull status per source per client)
- Quality scoring progress (per-signal scoring as it completes)
- Crawler progress (URLs discovered/analyzed count)

The dashboard currently handles SSE via `EventSource` with token passed as a query parameter (since EventSource cannot set custom headers — verified in server.js line 78-79 where the fallback is implemented).

**Assessment: Fully feasible.** The SSE pattern is proven and reusable. New SSE endpoints follow the exact same pattern. The frontend `EventSource` handling can be extracted into a shared hook:

```typescript
function useSSE<T>(url: string, token: string): { data: T | null; status: string; error: string | null }
```

**Effort: S (1-2 days)** for the shared hook + per-page integration.

---

## 5. State Management for Complex Pages

### Current State Approach

The existing dashboard likely uses React 19's built-in state management (useState, useContext, useReducer). There is no state management library in `package.json` (no Redux, Zustand, Jotai, etc.).

### New Page Complexity

**Opportunities page (highest complexity):**
- 4 tabs (Gaps, Decay, Cannibalization, Trending)
- Each tab has independent filter state (keyword, score range, status)
- Sorting by multiple columns
- Bulk actions (accept, dismiss, mark completed)
- Pagination per tab
- URL-synced filter state (shareable links)

**Content Inventory page (second highest):**
- Search + multi-filter (status, author, date range, word count range)
- Sort by any column
- Bulk selection and actions
- Infinite scroll or pagination
- Column visibility toggles

### Recommendation

React 19 with `useReducer` + `useContext` is sufficient for page-level state. URL search params (via Next.js `useSearchParams()`) should drive filter state for shareability.

**Do NOT add a state management library.** The pages are independent — they do not share state. Each page manages its own filters, pagination, and sorting. This is exactly what React 19's built-in hooks are designed for.

If cross-page state becomes necessary later (e.g., a global "selected client" context for multi-tenant), add a single `ClientContext` provider. This does not require a library.

**Effort: M (3-5 days)** for the Opportunities page state logic (most complex). S for other pages.

---

## 6. Bundle Size Impact

### Current Bundle (estimated)

| Package | Size (gzipped) |
|---------|---------------|
| React 19 + ReactDOM | ~42KB |
| Next.js runtime | ~85KB |
| shadcn components | ~15KB (tree-shaken) |
| Tailwind CSS | ~10KB (purged) |
| lucide-react icons | ~3KB (tree-shaken) |
| **Total** | **~155KB** |

### Additional Bundle from 7 New Pages

| Addition | Size (gzipped) | Notes |
|----------|---------------|-------|
| Recharts (tree-shaken) | ~45KB | Only import used chart types |
| 7 new page components | ~30KB | TypeScript + JSX |
| New shadcn components | ~5KB | Accordion, progress, etc. |
| **Total addition** | **~80KB** |

**Impact: ~50% bundle increase** from ~155KB to ~235KB. This is acceptable for a dashboard application. Next.js 16's automatic code splitting means chart components only load on pages that use them. The Connections page (no charts) stays at the current bundle size.

**Optimization opportunities:**
- Dynamic import Recharts (`next/dynamic` with `ssr: false` for chart components)
- Route-based code splitting (automatic in Next.js App Router)
- Lazy-load heavy pages (Performance, Content Inventory)

---

## 7. Mobile Responsiveness for Data-Heavy Pages

### Challenge

The Content Inventory and Opportunities pages display wide data tables (8-12 columns). On mobile (320-768px), these tables cannot display all columns without horizontal scrolling.

### Strategy

| Viewport | Content Inventory | Opportunities | Performance |
|----------|------------------|---------------|-------------|
| Desktop (1024px+) | Full table, all columns | 4-tab layout, full cards | Side-by-side charts |
| Tablet (768-1024px) | Table with hidden columns, expand row | 4-tab layout, compact cards | Stacked charts |
| Mobile (320-768px) | Card list view (one card per URL) | Card stack with swipe | Single chart, swipe between metrics |

**Key pattern:** Use responsive card layouts on mobile instead of tables. Each table row becomes a card showing the 3-4 most important fields, with a "View details" expand trigger.

shadcn's `<Table>` component does not handle responsive transformation. This needs a custom `<ResponsiveTable>` wrapper component that switches between table and card views based on `useMediaQuery()` (a ~10-line custom hook using `window.matchMedia`).

**Effort: M (3-5 days)** for the responsive table/card component + applying it to 3 data-heavy pages.

---

## 8. RTL Support for Arabic Dashboard Users

### Current RTL Support

The existing engine supports 11 languages including Arabic. The article output handles RTL with CSS logical properties. The dashboard itself needs to be assessed.

### Requirements for Dashboard RTL

1. **Layout mirroring:** Sidebar on the right, content flows right-to-left. Tailwind CSS v4 supports `dir="rtl"` with `rtl:` prefix variants.

2. **Text alignment:** All text left-aligned in LTR, right-aligned in RTL. Tailwind's `text-start` / `text-end` (logical properties) handle this automatically.

3. **Chart mirroring:** Recharts renders SVG which does NOT automatically mirror in RTL. X-axis labels, legends, and tooltips need explicit RTL handling. `<XAxis reversed={isRTL} />` on every chart.

4. **Icons:** Directional icons (arrows, chevrons) must flip in RTL. lucide-react icons can be wrapped with `transform: scaleX(-1)` conditionally.

5. **Numbers:** Arabic numerals vs Western numerals. Enterprise Arabic clients typically prefer Western numerals in data dashboards. Make this configurable.

6. **Fonts:** Cairo or Tajawal for Arabic UI text. Add to `next.config.js` font loading via `next/font/google`.

### Implementation Approach

Add a `dir` attribute to the root `<html>` element based on the user's language setting (already stored in user_settings via the bridge). Use Tailwind's `rtl:` variant for layout overrides. Most spacing/alignment works automatically with CSS logical properties (`ms-4` instead of `ml-4`, `ps-4` instead of `pl-4`).

**The biggest RTL risk is charts.** Every Recharts component needs explicit RTL props. This is tedious but not technically difficult. Wrap all charts in an `<RTLChart>` component that passes `reversed` and alignment props based on locale.

**Effort: L (1-2 weeks)** for full RTL support across all 14 pages including charts. This should be done once as a cross-cutting concern, not per-page.

---

## 9. Summary Feasibility Matrix

| Aspect | Feasible? | Effort | Risk | Blocker? |
|--------|-----------|--------|------|----------|
| 7 new pages | Yes | XL (total) | Low | No |
| Recharts integration | Yes | M | Low | No |
| SSE for real-time progress | Yes (pattern exists) | S | Low | No |
| State management (no new lib) | Yes | M | Low | No |
| Bundle size impact | Acceptable (+80KB) | S | Low | No |
| Mobile responsive tables | Yes (custom component) | M | Medium | No |
| RTL Arabic support | Yes | L | Medium | No — but high effort |
| Score rings (custom SVG) | Yes | S | Low | No |
| Heat map (custom CSS grid) | Yes | S | Low | No |
| OAuth flow UI | Yes | M | Low | No |

**Total frontend effort estimate: 6-8 weeks** for a solo developer building all 7 pages with full responsiveness, RTL, and data visualization. This assumes the backend APIs are ready. Frontend work can begin with mock data while backend is developed.
