# ChainIQ — Design System

> **Stack:** Next.js 16 + shadcn/ui + Tailwind CSS
> **Theme:** Warm dark mode, zinc + gold accents
> **Input:** `dev_docs/foundations/design-direction.md`
> **Last Updated:** 2026-03-28

---

## 1. Token Architecture (3 Layers)

### Layer 1: Brand Tokens (CSS Custom Properties)

These are the raw values. Defined in `dashboard/src/app/globals.css` within the `.dark` / `:root` scope.

```css
:root {
  /* Brand tokens — ChainIQ dark theme */
  --brand-gold: 43 96% 56%;          /* amber-500: #f59e0b */
  --brand-gold-hover: 43 96% 65%;    /* amber-400: #fbbf24 */
  --brand-gold-muted: 43 96% 56% / 0.1;

  /* Zinc scale (dark mode base) */
  --zinc-950: 240 6% 3%;             /* #09090b — deepest bg */
  --zinc-900: 240 6% 10%;            /* #18181b — card bg */
  --zinc-800: 240 4% 16%;            /* #27272a — elevated surfaces */
  --zinc-700: 240 4% 26%;            /* #3f3f46 — borders */
  --zinc-600: 240 3% 34%;            /* #52525b */
  --zinc-500: 240 4% 46%;            /* #71717a — muted text */
  --zinc-400: 240 5% 65%;            /* #a1a1aa — secondary text */
  --zinc-300: 240 5% 84%;            /* #d4d4d8 */
  --zinc-200: 240 6% 90%;            /* #e4e4e7 */
  --zinc-100: 240 5% 96%;            /* #f4f4f5 — primary text */
  --zinc-50: 240 5% 98%;             /* #fafafa */
}
```

### Layer 2: Semantic Tokens (Tailwind + shadcn/ui)

Mapped via `tailwind.config.ts` and shadcn's CSS variable system:

| Semantic Token | Maps To | Usage |
|----------------|---------|-------|
| `--background` | zinc-950 | Page background |
| `--foreground` | zinc-100 | Primary text |
| `--card` | zinc-900 | Card background |
| `--card-foreground` | zinc-100 | Card text |
| `--popover` | zinc-900 | Dropdown/popover bg |
| `--primary` | amber-500 | Primary buttons, links |
| `--primary-foreground` | zinc-950 | Text on primary buttons |
| `--secondary` | zinc-800 | Secondary buttons |
| `--secondary-foreground` | zinc-100 | Text on secondary |
| `--muted` | zinc-800 | Muted backgrounds |
| `--muted-foreground` | zinc-400 | Muted text |
| `--accent` | zinc-800 | Hover/active states |
| `--accent-foreground` | zinc-100 | Text on accent |
| `--destructive` | red-500 | Delete/danger actions |
| `--border` | zinc-700 | Default borders |
| `--input` | zinc-700 | Input borders |
| `--ring` | amber-500 | Focus ring |
| `--sidebar-background` | zinc-950 | Sidebar bg |
| `--sidebar-foreground` | zinc-400 | Sidebar text |
| `--sidebar-accent` | zinc-800 | Sidebar hover |

### Layer 3: Component Usage (Tailwind Classes)

| Pattern | Classes | When |
|---------|---------|------|
| Page background | `bg-background` | Root layout, page containers |
| Card | `bg-card border border-border rounded-lg` | All card surfaces |
| Primary button | `bg-primary text-primary-foreground hover:bg-primary/90` | Main CTAs |
| Ghost button | `hover:bg-accent hover:text-accent-foreground` | Secondary actions |
| Text primary | `text-foreground` | Headings, body text |
| Text secondary | `text-muted-foreground` | Labels, descriptions |
| Badge (success) | `bg-emerald-500/10 text-emerald-400 border-emerald-500/20` | Status: healthy, active |
| Badge (warning) | `bg-yellow-500/10 text-yellow-400 border-yellow-500/20` | Status: decaying, pending |
| Badge (error) | `bg-red-500/10 text-red-400 border-red-500/20` | Status: failed, critical |
| Badge (info) | `bg-blue-500/10 text-blue-400 border-blue-500/20` | Status: in progress, draft |
| Input | `bg-transparent border border-input rounded-md` | All form inputs |
| Focus ring | `focus-visible:ring-2 focus-visible:ring-ring` | All interactive elements |

---

## 2. Typography

| Element | Font | Size | Weight | Class |
|---------|------|------|--------|-------|
| Page title | Geist Sans | 24px (2xl) | 600 (semibold) | `text-2xl font-semibold` |
| Section title | Geist Sans | 18px (lg) | 600 | `text-lg font-semibold` |
| Body text | Geist Sans | 16px (base) | 400 | `text-base` |
| Small text | Geist Sans | 14px (sm) | 400 | `text-sm` |
| Caption | Geist Sans | 12px (xs) | 400 | `text-xs` |
| Data/code | Geist Mono | 14px (sm) | 400 | `font-mono text-sm` |
| KPI value | Geist Sans | 30px (3xl) | 700 (bold) | `text-3xl font-bold` |

---

## 3. Spacing & Layout

| Token | Value | Usage |
|-------|-------|-------|
| Page padding | `p-6` (24px) | Content area padding |
| Card padding | `p-4` to `p-6` | Internal card padding |
| Section gap | `gap-6` (24px) | Between major sections |
| Component gap | `gap-4` (16px) | Between related items |
| Inline gap | `gap-2` (8px) | Between badge + text, icon + label |
| Sidebar width (expanded) | 240px | `w-60` |
| Sidebar width (collapsed) | 64px | `w-16` |
| Max content width | 1280px | `max-w-screen-xl` |

---

## 4. Status Color System

| Status | Background | Text | Border | Usage |
|--------|------------|------|--------|-------|
| Healthy / Active / Published | `emerald-500/10` | `emerald-400` | `emerald-500/20` | Content OK, user active, article live |
| Decaying / Warning / Pending | `yellow-500/10` | `yellow-400` | `yellow-500/20` | Content health declining, awaiting action |
| Failed / Critical / Error | `red-500/10` | `red-400` | `red-500/20` | Pipeline failure, security alert |
| In Progress / Draft / Queued | `blue-500/10` | `blue-400` | `blue-500/20` | Generating, crawling, analyzing |
| Thin / Low Priority | `zinc-500/10` | `zinc-400` | `zinc-500/20` | Low-value content, deferred items |
| Connected | `emerald-500` | — | — | StatusDot (solid circle) |
| Disconnected | `zinc-500` | — | — | StatusDot (solid circle) |

---

## 5. Custom Components

| Component | Description | Not in shadcn |
|-----------|-------------|---------------|
| **ScoreRing** | Circular progress indicator for quality/health scores (0-100). Color grades: red < 40, yellow 40-70, green > 70. | Custom SVG |
| **TimelineChart** | Sparkline-style time series for click/impression trends. Uses Recharts area chart with gradient fill. | Custom wrapper |
| **StatusDot** | 8px circle with color indicating connection status. Pulses when connecting. | Custom CSS |
| **AlertBanner** | Full-width banner for connection warnings, data staleness. Dismissible. | Custom |
| **KPICard** | Dashboard stat card: icon + title + value + trend arrow + sparkline. | Custom layout |
| **CrawlProgressBar** | Multi-segment progress bar showing crawl stages with URL count. | Custom |

---

## 6. Animation & Motion

| Pattern | Duration | Easing | Usage |
|---------|----------|--------|-------|
| Hover transitions | 150ms | `ease-in-out` | Button hover, card hover |
| Page transitions | None | — | No page transition animations (SPA navigation is instant) |
| Modal enter | 200ms | `ease-out` | Dialog/sheet open |
| Modal exit | 150ms | `ease-in` | Dialog/sheet close |
| Skeleton pulse | 2s | `ease-in-out infinite` | Loading skeleton animation |
| StatusDot pulse | 1.5s | `ease-in-out infinite` | Connecting state |
| Toast enter | 300ms | slide up + fade in | Notification appearance |
| Progress bar | continuous | `linear` | Crawl/pipeline progress |

---

## 7. Accessibility Baseline

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | All text meets WCAG 2.1 AA (4.5:1 for body, 3:1 for large text) |
| Focus visible | `ring-2 ring-ring ring-offset-2 ring-offset-background` on all interactive elements |
| Keyboard navigation | Tab order follows visual order. Escape closes modals. Arrow keys navigate lists. |
| Screen reader | Semantic HTML. ARIA labels on icon-only buttons. `role="alert"` for toasts. |
| Reduced motion | `prefers-reduced-motion: reduce` disables all animations except essential progress indicators |
| Touch targets | Minimum 44x44px on mobile (Tailwind: `min-h-11 min-w-11`) |
