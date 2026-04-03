# ChainIQ — Component Primitive Mapping

> **Source of truth** for "what UI primitive implements this domain component?"
> **Library:** shadcn/ui (base-ui variant) + custom components
> **Last Updated:** 2026-03-28

---

## Data Display

| Domain Component | Primitive(s) | Screen(s) | Notes |
|------------------|-------------|-----------|-------|
| Article list | `DataTable` + `Badge` + `DropdownMenu` | Articles, Publish Manager | Sortable, paginated, row actions |
| User list | `DataTable` + `Badge` + `Sheet` | User Management | Click row → detail sheet |
| Content inventory | `DataTable` + `Badge` + `Sheet` | Content Inventory | Health score colors, slide-over detail |
| Opportunity list | `Card` + `Badge` + `Button` | Opportunities | Card-based layout, not table |
| Recommendation card | `Card` + `Badge` + `Button` + `Progress` | Opportunities | Priority score, type badge, action buttons |
| KPI card | Custom `KPICard` (Card + sparkline) | Dashboard Home | 4-card grid, trend arrows |
| Pipeline status | `Card` + `Badge` + `Progress` | Dashboard Home, Articles | Queue count, running indicator |
| Quality score display | Custom `ScoreRing` + `Card` | Quality Report | Composite + 7 signal scores |
| Checklist display | `Accordion` + checkmark icons | Quality Report | 60-point checklist grouped by category |
| Performance chart | `AreaChart` (Recharts via shadcn) | Dashboard Home, Performance | Time series, tooltips |
| Timeline chart | Custom `TimelineChart` | Content Inventory (detail) | 90-day click/impression sparkline |
| Persona card | `Card` + `Badge` + `Button` | Voice Profiles | Voice DNA visualization |
| Platform card | `Card` + Custom `StatusDot` + `Button` | Connections, Publish Manager | Connection status indicator |
| Blueprint card | `Card` + `Badge` | Blueprint Gallery | Category badge, preview |

## Forms & Input

| Domain Component | Primitive(s) | Screen(s) | Notes |
|------------------|-------------|-----------|-------|
| Login form | `Card` + `Input` + `Button` + `Label` | Login/Signup | Centered card layout |
| Settings form | `Tabs` + `Input` + `Select` + `Switch` + `Button` | Plugin Configuration | Multi-tab form with save |
| Connection form | `Card` + `Button` + `Input` + `Dialog` | Connections | OAuth popup trigger, API key input |
| Generate form | `Input` + `Select` + `Button` | Generate page | Topic + language + framework |
| Search input | `Input` with search icon | Inventory, Opportunities, Articles | Debounced, with clear button |
| Filter controls | `Select` + `Popover` + `Checkbox` | Inventory, Opportunities | Multi-select filter dropdowns |
| Property selector | `Dialog` + `RadioGroup` + `Button` | Connections | GSC/GA4 property selection after OAuth |

## Navigation & Layout

| Domain Component | Primitive(s) | Screen(s) | Notes |
|------------------|-------------|-----------|-------|
| Sidebar | Custom (div + nav + links) | All authenticated | Collapsible, icon + text |
| Tab navigation | `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent` | Article Detail, Settings, Voice | Horizontal tabs |
| Breadcrumb | `Breadcrumb` (shadcn) | Article Detail, Quality Report | Nested page context |
| Pagination | Custom (`Button` group + text) | All list pages | Page N of M, prev/next |

## Feedback & Status

| Domain Component | Primitive(s) | Screen(s) | Notes |
|------------------|-------------|-----------|-------|
| Toast notification | `Sonner` (shadcn toast) | Global | Success/error/warning toasts |
| Alert banner | Custom `AlertBanner` | Connections, Inventory | Dismissible, full-width |
| Loading skeleton | `Skeleton` (shadcn) | All pages | Matches content layout shape |
| Empty state | Custom (div + icon + text + Button) | All list pages | Descriptive + CTA |
| Confirmation dialog | `AlertDialog` | Delete, disconnect, revoke | Destructive action confirmation |
| Progress bar | `Progress` (shadcn) | Pipeline, Crawl | Determinate progress |
| SSE progress display | Custom (Card + Progress + stage text) | Generate, Crawl, Voice Analysis | Multi-stage with stage labels |
| Status badge | `Badge` with status color | All list pages | Semantic colors from design system |
| Status dot | Custom `StatusDot` (8px circle) | Connections | Green/yellow/red + pulse animation |
| Score ring | Custom `ScoreRing` (SVG circle) | Quality Report, Inventory | 0-100 with color grading |

## Overlays & Panels

| Domain Component | Primitive(s) | Screen(s) | Notes |
|------------------|-------------|-----------|-------|
| Detail slide-over | `Sheet` (shadcn) | Inventory, Users | Right-side panel, 480px |
| Create/edit dialog | `Dialog` (shadcn) | Voice Personas, Webhooks | Centered, max 520px |
| OAuth popup | `window.open` | Connections | 600x700 popup for Google OAuth |
| Action dropdown | `DropdownMenu` (shadcn) | DataTable row actions | Edit, delete, more actions |
| Tooltip | `Tooltip` (shadcn) | Icon buttons, truncated text | Hover delay 200ms |

---

## Custom Component Registry

| Component | File | Props | Dependencies |
|-----------|------|-------|-------------|
| `KPICard` | `components/kpi-card.tsx` | `title, value, trend, icon, sparklineData` | Card, recharts |
| `ScoreRing` | `components/score-ring.tsx` | `score, size, label` | SVG only |
| `TimelineChart` | `components/timeline-chart.tsx` | `data, xKey, yKeys, height` | Recharts AreaChart |
| `StatusDot` | `components/status-dot.tsx` | `status: 'connected'│'disconnected'│'connecting'` | CSS only |
| `AlertBanner` | `components/alert-banner.tsx` | `variant, message, onDismiss` | lucide-react icons |
| `CrawlProgressBar` | `components/crawl-progress.tsx` | `stages, currentStage, count, total` | Progress |
