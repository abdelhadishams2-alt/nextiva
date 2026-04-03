# ChainIQ — Design Direction

> **Status:** Established (dashboard already built with this design)
> **Review Method:** Existing design documented (review portal skipped per user decision)
> **Last Updated:** 2026-03-28

---

## Design Identity

**Theme:** Warm dark mode with gold accents — professional but approachable. Designed for enterprise publishers spending hours daily in the dashboard.

**Personality:** Confident, data-rich, minimal chrome. Surfaces content intelligence without visual clutter.

---

## Core Decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| **Color mode** | Dark (default), no light mode | Publishers work long sessions; dark reduces eye strain. Consistent with premium SaaS feel. |
| **Base palette** | Zinc (gray scale) | Neutral, professional. `zinc-900` backgrounds, `zinc-800` cards, `zinc-700` borders. |
| **Accent color** | Gold / Amber | `amber-500` for primary actions, `amber-400` for hover. Conveys premium, stands out on dark. |
| **Status colors** | Green (success), Red (error), Yellow (warning), Blue (info) | Standard semantic colors. Muted variants for badges (`green-900/50` bg + `green-400` text). |
| **Typography** | Geist Sans (UI), Geist Mono (code/data) | Next.js default, excellent readability, variable weight. |
| **Font sizes** | Tailwind defaults (sm=14px, base=16px, lg=18px) | No custom scale needed. |
| **Border radius** | `rounded-lg` (8px) for cards, `rounded-md` (6px) for inputs/buttons | Slightly rounded, not pill-shaped. Matches shadcn/ui defaults. |
| **Spacing** | Tailwind 4px scale (p-4=16px, p-6=24px, gap-4=16px) | Consistent rhythm. |
| **Layout density** | Medium — comfortable padding, not cramped | Data-heavy screens (Inventory, Opportunities) use tighter rows; overview screens breathe more. |
| **Component library** | shadcn/ui (base-ui variant) | Copy-paste components, full control, dark mode native. |
| **Icons** | Lucide React | Consistent, well-maintained, tree-shakeable. |
| **Charts** | Recharts (via shadcn/ui Chart component) | Built into shadcn, responsive, dark-mode compatible. |

---

## Layout Patterns

| Pattern | Usage |
|---------|-------|
| **Sidebar + Content** | All authenticated pages. Sidebar is collapsible, 240px expanded, 64px collapsed. |
| **DataTable** | List screens (Articles, Users, Inventory, Opportunities). Sortable columns, pagination, row actions. |
| **Card Grid** | Dashboard Home (KPI cards), Connections page. 1-4 columns responsive. |
| **Slide-over Panel** | Detail views within list screens (Inventory detail, User detail). Right-aligned, 480px width. |
| **Tabs** | Multi-section content (Article Detail, Settings, Voice Profiles). Horizontal tabs. |
| **Dialog** | Confirmations, small forms. Centered modal, max 520px width. |

---

## Responsive Breakpoints

| Breakpoint | Width | Changes |
|------------|-------|---------|
| Mobile | < 768px | Sidebar hidden (hamburger menu), single column, DataTable → card layout |
| Tablet | 768-1023px | Sidebar collapsed by default, 2-column grids, DataTable hides secondary columns |
| Desktop | >= 1024px | Full layout, sidebar expanded, all columns visible |

---

## Token Inputs for Step 13

These values feed directly into the design token system:

```
colors.background.primary: zinc-950 (#09090b)
colors.background.card: zinc-900 (#18181b)
colors.background.elevated: zinc-800 (#27272a)
colors.border.default: zinc-700 (#3f3f46)
colors.border.subtle: zinc-800 (#27272a)
colors.text.primary: zinc-100 (#f4f4f5)
colors.text.secondary: zinc-400 (#a1a1aa)
colors.text.muted: zinc-500 (#71717a)
colors.accent.primary: amber-500 (#f59e0b)
colors.accent.hover: amber-400 (#fbbf24)
colors.accent.muted: amber-500/10
colors.success: emerald-500 (#10b981)
colors.error: red-500 (#ef4444)
colors.warning: yellow-500 (#eab308)
colors.info: blue-500 (#3b82f6)
fonts.sans: "Geist Sans", system-ui, sans-serif
fonts.mono: "Geist Mono", monospace
radius.card: 0.5rem (8px)
radius.button: 0.375rem (6px)
radius.input: 0.375rem (6px)
sidebar.width.expanded: 240px
sidebar.width.collapsed: 64px
```
