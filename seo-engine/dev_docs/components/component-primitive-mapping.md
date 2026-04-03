# ChainIQ Component-to-Primitive Mapping

> **Purpose:** Deep implementation reference for the 15 most complex components
> **Selection Criteria:** Appears in 3+ screens OR has 8+ props
> **Stack:** Next.js 16 + shadcn/ui (base-ui variant) + Tailwind CSS + Geist fonts
> **Last Updated:** 2026-03-28

---

## Overview Table

| # | Domain Component | Service Layer | Screen(s) | shadcn/ui Primitive | Complexity |
|---|-----------------|---------------|-----------|--------------------|----|
| 1 | DataTable | Dashboard API, All services | 02, 03, 04, 05, 10, 14 | `Table` | High |
| 2 | KPICard | Analytics, Feedback Loop | 02, 14 | `Card` + custom | Medium |
| 3 | ScoreRing | Content Intelligence, Quality Gate | 10, 11, 15 | Custom SVG | Medium |
| 4 | Badge | All services | 02-15 (13 screens) | `Badge` | Low (but most variants) |
| 5 | Sidebar | Dashboard API | All authenticated (14 screens) | Custom | High |
| 6 | PageHeader | All services | 09, 10, 11, 12, 13, 14, 15 | Custom + `Breadcrumb` | Medium |
| 7 | Tabs | Multiple services | 04, 06, 08, 11, 13, 14 | `Tabs` | Medium |
| 8 | Pagination | Dashboard API, All list services | 03, 05, 08, 10, 11, 13, 14 | `Pagination` | Medium |
| 9 | HealthDistributionBar | Data Ingestion + Content Intelligence | 10 | Custom + `Tooltip` | High |
| 10 | RadarChart (StyleRadarChart) | Voice Intelligence | 12 | Custom SVG | High |
| 11 | OverallScoreGauge | Quality Gate | 15 | Custom SVG | High |
| 12 | AlertBanner | All services | 02, 03, 05, 06, 09, 10, 11, 14, 15 | `Alert` | Medium |
| 13 | ApiKeyInput | Data Ingestion, Publishing | 09, 13 | `Input` + custom | Medium |
| 14 | PropertySelector | Data Ingestion | 09 | `Select` / `Combobox` | High |
| 15 | DateRangePicker | Publishing, Feedback Loop | 13, 14 | `Popover` + `Calendar` | High |

---

## 1. DataTable

**Service:** Dashboard API, Analytics, Admin, Data Ingestion, Feedback Loop
**Screens:** 02-Dashboard, 03-Pipeline, 04-Detail (versions), 05-Users, 10-Inventory, 14-Performance

### shadcn/ui Primitive
`Table` + `TableHeader` + `TableBody` + `TableRow` + `TableHead` + `TableCell`

### TypeScript Props Interface

```typescript
interface DataTableProps<TData, TValue> {
  /** Column definitions following TanStack Table API */
  columns: ColumnDef<TData, TValue>[];
  /** Row data array */
  data: TData[];
  /** Current sorting state */
  sorting?: SortingState;
  /** Sorting change handler */
  onSortingChange?: OnChangeFn<SortingState>;
  /** Row click handler -- navigates to detail view */
  onRowClick?: (row: TData) => void;
  /** Enable row selection via checkboxes */
  selectable?: boolean;
  /** Selected row IDs (controlled) */
  selectedIds?: Set<string>;
  /** Selection change handler */
  onSelectionChange?: (ids: Set<string>) => void;
  /** Loading state -- renders skeleton rows */
  loading?: boolean;
  /** Number of skeleton rows to show when loading */
  skeletonRowCount?: number;
  /** Message when data array is empty */
  emptyMessage?: string;
  /** Empty state illustration/CTA */
  emptyState?: ReactNode;
  /** Pagination config */
  pagination?: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
  };
  /** Custom row className based on row data */
  rowClassName?: (row: TData) => string;
  /** ID accessor for selection tracking */
  getRowId?: (row: TData) => string;
}
```

### Internal State
- `sortingState: SortingState` -- column being sorted + direction
- `columnSizingState: ColumnSizingState` -- column width tracking
- `rowSelectionState: Record<string, boolean>` -- selected rows map
- `headerCheckboxState: boolean | 'indeterminate'` -- computed from selection

### Responsive Behavior

| Breakpoint | Behavior |
|-----------|----------|
| **Mobile (<768px)** | Table converts to card-based list layout. Each card shows key fields (title, status badge, primary metric). Checkboxes hidden; selection via long-press or explicit "Select" toggle. Pagination becomes "Load more" infinite scroll pattern. |
| **Tablet (768-1024px)** | Table renders with reduced columns. Non-essential columns (word count, images) collapse into row detail or tooltip. Horizontal scroll enabled if content overflows. Pagination fully visible. |
| **Desktop (>1024px)** | Full table with all columns, sortable headers, row hover effects, checkbox column, inline action menus. Fixed column widths via `<colgroup>`. Pagination with page size selector. |

### Accessibility Requirements
- Full semantic `<table>`, `<thead>`, `<tbody>` structure
- Sortable column headers use `aria-sort="ascending" | "descending" | "none"`
- Row selection announced via `aria-live="polite"` region ("3 rows selected")
- Header checkbox has `aria-label="Select all rows on this page"`
- Each row is keyboard-navigable: Tab enters table, arrow keys move between rows
- Row action menus accessible via keyboard (Tab to "..." trigger, Enter to open)
- Status badges include `aria-label` with descriptive text (not color-only)
- Empty state has `role="status"` for screen reader announcement

---

## 2. KPICard

**Service:** Analytics, Feedback Loop
**Screens:** 02-Dashboard, 14-Performance

### shadcn/ui Primitive
`Card` + custom metric layout

### TypeScript Props Interface

```typescript
interface KPICardProps {
  /** Card heading */
  title: string;
  /** Primary metric value */
  value: string | number;
  /** Optional format hint for display */
  format?: 'number' | 'percentage' | 'currency' | 'score';
  /** Trend direction and delta value */
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: string;
    label?: string; // e.g., "vs last quarter"
  };
  /** Icon component displayed in card header */
  icon?: ReactNode;
  /** Mini sparkline data (6-12 data points) */
  sparkline?: number[];
  /** Secondary metric below primary */
  subMetric?: string;
  /** Click handler -- navigates to detail view */
  onClick?: () => void;
  /** Status badge (e.g., "Ready", "Needs Recalibration") */
  statusBadge?: {
    label: string;
    variant: 'default' | 'warning' | 'success';
  };
  /** Loading state */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
}
```

### Internal State
- `isHovered: boolean` -- tracks hover for interactive glow effect
- `previousValue: number | null` -- for delta animation on refresh

### Responsive Behavior

| Breakpoint | Behavior |
|-----------|----------|
| **Mobile (<768px)** | Cards stack vertically, full width. Sparklines hidden. Trend arrows remain visible. Touch target minimum 44px. |
| **Tablet (768-1024px)** | 2x2 grid layout. Cards show all content but sparklines compress. |
| **Desktop (>1024px)** | 4 cards in a single horizontal row. Full sparklines visible. Hover shows subtle glow effect. Click navigates to relevant detail page. |

### Accessibility Requirements
- Each card has `aria-label` with full context: "Total articles: 127, up 12% from last month"
- Trend direction communicated via text, not just color/icon
- Cards that are clickable have `role="link"` or wrapped in `<a>` with keyboard focus ring
- Sparkline has `aria-hidden="true"` (decorative; data available via aria-label)
- Loading state uses `aria-busy="true"`

---

## 3. ScoreRing

**Service:** Content Intelligence, Quality Gate
**Screens:** 10-Inventory, 11-Opportunities, 15-Quality

### shadcn/ui Primitive
Custom SVG (`<circle>` with `stroke-dasharray` / `stroke-dashoffset`)

### TypeScript Props Interface

```typescript
interface ScoreRingProps {
  /** Score value (0-100 for health, 0-10 for quality) */
  score: number;
  /** Maximum score (100 for health, 10 for quality) */
  max?: number;
  /** Ring size */
  size?: 'sm' | 'md' | 'lg';
  /** Show numeric label inside the ring */
  showLabel?: boolean;
  /** Animate the fill on mount/update */
  animated?: boolean;
  /** Override the automatic color calculation */
  color?: string;
  /** Current state */
  status?: 'idle' | 'scoring' | 'not_scored';
  /** Additional CSS classes */
  className?: string;
  /** Accessible label override */
  ariaLabel?: string;
}
```

### Internal State
- `animatedScore: number` -- interpolated value during mount animation
- `prevScore: number | null` -- previous score for delta display

### Size Variants
- `sm` = 24px diameter (table rows in Inventory)
- `md` = 40px diameter (opportunity cards)
- `lg` = 120px diameter (quality report hero gauge)

### Responsive Behavior

| Breakpoint | Behavior |
|-----------|----------|
| **Mobile (<768px)** | `sm` remains 24px, `md` remains 40px, `lg` scales to 96px. Score number uses smaller font inside ring. |
| **Tablet (768-1024px)** | All sizes render at standard dimensions. |
| **Desktop (>1024px)** | Full size. Animation plays on mount. Hover tooltip shows context (e.g., "Health Score: 72/100"). |

### Accessibility Requirements
- SVG has `role="img"` with `aria-label`: "Health score: 72 out of 100"
- Color is never the sole indicator -- numeric value always visible
- `prefers-reduced-motion`: skip fill animation, render at final state immediately
- In scoring state: `aria-label="Quality score: scoring in progress"`
- In not-scored state: `aria-label="Quality score: not yet evaluated"`

---

## 4. Badge

**Service:** All services
**Screens:** 02-15 (13 screens)

### shadcn/ui Primitive
`Badge` (shadcn)

### TypeScript Props Interface

```typescript
interface BadgeProps {
  /** Visual variant */
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  /** Size override */
  size?: 'sm' | 'default';
  /** Additional CSS classes for semantic coloring */
  className?: string;
  /** Badge content */
  children: ReactNode;
  /** Optional left icon */
  icon?: ReactNode;
  /** Removable (shows close button) */
  removable?: boolean;
  /** Remove handler */
  onRemove?: () => void;
  /** Accessible label (overrides children text) */
  ariaLabel?: string;
}

/** Semantic badge presets */
type BadgePreset =
  | 'status-draft'       // blue
  | 'status-published'   // green
  | 'status-archived'    // gray
  | 'status-generating'  // amber animated
  | 'status-failed'      // red
  | 'status-pending'     // amber
  | 'status-active'      // green
  | 'status-revoked'     // red
  | 'status-expired'     // orange
  | 'type-gap'           // blue
  | 'type-decay'         // red
  | 'type-cannibalization' // purple
  | 'type-trending'      // green
  | 'type-seasonal'      // amber
  | 'confidence-high'    // green
  | 'confidence-medium'  // amber
  | 'confidence-low'     // red
  | 'priority-high'      // red
  | 'priority-medium'    // amber
  | 'priority-low'       // blue
  | 'platform-wordpress' // blue
  | 'platform-shopify'   // green
  | 'pass'               // green
  | 'fail'               // red
  | 'language-en'        // gray
  | 'language-ar'        // gray
  | 'filter-chip';       // outline with close
```

### Internal State
- None (stateless presentational component)

### Responsive Behavior

| Breakpoint | Behavior |
|-----------|----------|
| **Mobile (<768px)** | `sm` size used in compact contexts. Truncate long text with ellipsis at 20 chars. |
| **Tablet (768-1024px)** | Default size. |
| **Desktop (>1024px)** | Default size. Hover tooltips on truncated badges. |

### Accessibility Requirements
- All badges use `aria-label` with descriptive text: "Status: Draft" not just "Draft"
- Color is always paired with text and/or icon (no color-only meaning)
- Animated badges (generating) respect `prefers-reduced-motion`
- Removable badges: close button has `aria-label="Remove filter: Status: Draft"`
- WCAG 2.1 AA contrast: all badge colors meet 4.5:1 against dark background

---

## 5. Sidebar

**Service:** Dashboard API
**Screens:** All authenticated screens (14 screens)

### shadcn/ui Primitive
Custom component

### TypeScript Props Interface

```typescript
interface SidebarProps {
  /** Current collapsed state */
  collapsed: boolean;
  /** Toggle collapse/expand */
  onToggle: () => void;
  /** Currently active route path */
  activeRoute: string;
  /** User role for conditional menu items */
  userRole: 'admin' | 'active' | 'viewer';
  /** User display name */
  userName: string;
  /** Pending user approvals count (admin only) */
  pendingApprovalCount?: number;
  /** Pending connection issues count */
  connectionIssueCount?: number;
  /** User menu dropdown items */
  userMenuItems?: MenuItem[];
  /** Navigation items */
  navItems: NavItem[];
  /** Brand logo/name */
  brand: {
    logo: ReactNode;
    name: string;
  };
}

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: number;
  adminOnly?: boolean;
  children?: NavItem[];
}
```

### Internal State
- `collapsed: boolean` -- synced with localStorage for persistence
- `mobileOpen: boolean` -- controls hamburger menu overlay
- `activeSection: string | null` -- expanded nav group (for nested items)

### Responsive Behavior

| Breakpoint | Behavior |
|-----------|----------|
| **Mobile (<768px)** | Sidebar hidden. Hamburger icon in top-left opens full-screen overlay with nav items. Tap outside or swipe left to close. Active route highlighted. |
| **Tablet (768-1024px)** | Sidebar collapses to icon-only rail (56px wide). Hover expands temporarily. Active item has highlight bar. |
| **Desktop (>1024px)** | Full sidebar (240px) with labels. Collapsible via toggle button. Admin badge shows next to user name. Pending approvals count badge pulses amber. |

### Accessibility Requirements
- `<nav role="navigation" aria-label="Main navigation">`
- Active item: `aria-current="page"`
- Collapsed state: icons have `aria-label` with full page name
- Hamburger toggle: `aria-expanded`, `aria-controls` linking to sidebar
- Badge counts: announced via `aria-label` on parent item (e.g., "Users, 3 pending approvals")
- Keyboard: Tab enters sidebar, arrow keys navigate items, Enter activates
- Focus visible: 2px ring with 3:1 contrast

---

## 6. PageHeader

**Service:** All services
**Screens:** 09-Connections, 10-Inventory, 11-Opportunities, 12-Voice, 13-Publish, 14-Performance, 15-Quality

### shadcn/ui Primitive
Custom flex layout + `Breadcrumb` (shadcn)

### TypeScript Props Interface

```typescript
interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional subtitle / description */
  subtitle?: string;
  /** Breadcrumb trail */
  breadcrumbs?: BreadcrumbItem[];
  /** Right-aligned action buttons */
  actions?: ReactNode;
  /** Optional status badge next to title */
  statusBadge?: ReactNode;
  /** Optional metadata row below title */
  metadata?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

interface BreadcrumbItem {
  label: string;
  href?: string; // last item has no href
}
```

### Internal State
- None (stateless layout component)

### Responsive Behavior

| Breakpoint | Behavior |
|-----------|----------|
| **Mobile (<768px)** | Title and actions stack vertically. Breadcrumbs truncate middle items with "...". Actions wrap below title or become a single "..." menu. |
| **Tablet (768-1024px)** | Title and actions on same row. Breadcrumbs fully visible. |
| **Desktop (>1024px)** | Full row: breadcrumbs top, title left, actions right-aligned. Subtitle below title. |

### Accessibility Requirements
- Breadcrumb uses `<nav aria-label="Breadcrumb">` with `<ol>` structure
- Current page in breadcrumb has `aria-current="page"`
- Action buttons within header are in the tab order
- Title is an `<h1>` element

---

## 7. Tabs

**Service:** Multiple
**Screens:** 04-Detail, 06-Config, 08-Blueprints, 11-Opportunities, 13-Publish, 14-Performance

### shadcn/ui Primitive
`Tabs` + `TabsList` + `TabsTrigger` + `TabsContent`

### TypeScript Props Interface

```typescript
interface TabsProps {
  /** Tab definitions */
  tabs: TabItem[];
  /** Default selected tab value */
  defaultValue?: string;
  /** Controlled value */
  value?: string;
  /** Change handler */
  onValueChange?: (value: string) => void;
  /** Visual style */
  variant?: 'underline' | 'default' | 'pills';
  /** Additional CSS classes for the tab list */
  className?: string;
  /** Whether to render content lazily */
  lazy?: boolean;
}

interface TabItem {
  /** Unique value identifier */
  value: string;
  /** Display label */
  label: string;
  /** Count badge (e.g., "87" for opportunities) */
  count?: number;
  /** Tab content */
  content: ReactNode;
  /** Disabled state */
  disabled?: boolean;
  /** Icon before label */
  icon?: ReactNode;
}
```

### Internal State
- `activeTab: string` -- currently selected tab
- `tabContentCache: Map<string, boolean>` -- tracks which tabs have been rendered (for lazy loading)

### Responsive Behavior

| Breakpoint | Behavior |
|-----------|----------|
| **Mobile (<768px)** | Tab list becomes horizontally scrollable strip. Active tab scrolls into view. Tab content full-width. Count badges use smaller font. |
| **Tablet (768-1024px)** | Tab list wraps if needed. Content adapts to available width. |
| **Desktop (>1024px)** | All tabs visible in single row. Underline animation on active tab. Full content area. |

### Accessibility Requirements
- `<div role="tablist">` wrapping tab triggers
- Each trigger: `role="tab"`, `aria-selected`, `aria-controls` pointing to panel
- Each panel: `role="tabpanel"`, `aria-labelledby` pointing to trigger
- Keyboard: arrow keys move between tabs, Tab moves into panel content
- Disabled tabs: `aria-disabled="true"`, skip in arrow key navigation
- Count badges use `aria-label` on the trigger: "Gaps, 34 items"

---

## 8. Pagination

**Service:** Dashboard API, all list services
**Screens:** 03-Pipeline, 05-Users, 08-Blueprints, 10-Inventory, 11-Opportunities, 13-Publish, 14-Performance

### shadcn/ui Primitive
`Pagination` + `PaginationContent` + `PaginationItem` + `PaginationPrevious` + `PaginationNext` + `PaginationLink`

### TypeScript Props Interface

```typescript
interface PaginationProps {
  /** Current page (1-indexed) */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Total item count for display */
  totalItems?: number;
  /** Items per page */
  pageSize: number;
  /** Page change handler */
  onPageChange: (page: number) => void;
  /** Page size change handler */
  onPageSizeChange?: (size: number) => void;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Display variant */
  variant?: 'full' | 'compact' | 'load-more';
  /** Show page size selector */
  showPageSizeSelector?: boolean;
  /** Additional CSS classes */
  className?: string;
}
```

### Internal State
- None (fully controlled by parent)

### Responsive Behavior

| Breakpoint | Behavior |
|-----------|----------|
| **Mobile (<768px)** | Switches to "Load more" button (variant="load-more") or simplified Prev/Next only. Page numbers hidden. Page size selector hidden. Total count shown as "1-25 of 847". |
| **Tablet (768-1024px)** | Compact: Prev, current page, "of N", Next. Page size selector visible. |
| **Desktop (>1024px)** | Full: Prev, page 1, ..., current-1, current, current+1, ..., last, Next. Page size selector. "Showing 1-25 of 847 items" text. |

### Accessibility Requirements
- `<nav aria-label="Pagination">`
- Current page: `aria-current="page"`
- Disabled prev/next: `aria-disabled="true"`
- Page links: `aria-label="Go to page N"`
- "Load more" button: `aria-label="Load next 25 items"`
- Page size selector: `aria-label="Items per page"`

---

## 9. HealthDistributionBar

**Service:** Data Ingestion + Content Intelligence
**Screens:** 10-Inventory

### shadcn/ui Primitive
Custom component + `Tooltip` (shadcn)

### TypeScript Props Interface

```typescript
interface HealthDistributionBarProps {
  /** Status segments with counts */
  segments: HealthSegment[];
  /** Total URL count */
  total: number;
  /** Click handler to apply status filter */
  onSegmentClick?: (status: string) => void;
  /** Currently active filter (dims other segments) */
  activeFilter?: string | null;
  /** Loading state */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

interface HealthSegment {
  /** Status identifier */
  status: 'ok' | 'thin' | 'old' | 'no_meta' | 'orphan' | 'error' | 'redirect' | 'removed';
  /** Number of URLs with this status */
  count: number;
  /** Display color */
  color: string;
  /** Display label */
  label: string;
}
```

### Internal State
- `hoveredSegment: string | null` -- tracks which segment tooltip is visible
- `segmentWidths: number[]` -- computed percentage widths with minimum visibility threshold

### Responsive Behavior

| Breakpoint | Behavior |
|-----------|----------|
| **Mobile (<768px)** | Bar wraps to 2 rows. Status count labels stack below bar. Click/tap shows tooltip with count. Minimum segment width enforced (2%) for tiny segments. |
| **Tablet (768-1024px)** | Single row bar. Labels below in 2 rows. |
| **Desktop (>1024px)** | Full-width single bar with inline labels. Hover shows tooltip with exact count + percentage. Click applies filter. Active filter dims non-matching segments to 30% opacity with CSS transition. |

### Accessibility Requirements
- `role="img"` on the bar container with `aria-label` summarizing distribution
- Each segment: `role="button"` (if clickable), `aria-label="OK: 612 URLs, 72%"`
- Not color-only: each status has a distinct label below the bar
- Dimmed segments during filtering maintain text readability (contrast check)
- Keyboard: Tab navigates between segments, Enter/Space triggers filter
- `aria-live="polite"` region announces filter result count

---

## 10. RadarChart (StyleRadarChart)

**Service:** Voice Intelligence
**Screens:** 12-Voice

### shadcn/ui Primitive
Custom SVG (inline, no library)

### TypeScript Props Interface

```typescript
interface StyleRadarChartProps {
  /** 6 axes with values */
  axes: RadarAxis[];
  /** Chart diameter in pixels */
  size?: number;
  /** Fill color (CSS color string) */
  color?: string;
  /** Fill opacity */
  fillOpacity?: number;
  /** Show axis labels */
  showLabels?: boolean;
  /** Show axis value labels */
  showValues?: boolean;
  /** Show concentric grid lines */
  showGrid?: boolean;
  /** Number of grid rings */
  gridLevels?: number;
  /** Click handler for drilling into an axis */
  onAxisClick?: (axis: string) => void;
  /** Animation on mount */
  animated?: boolean;
  /** Accessible description */
  ariaLabel?: string;
}

interface RadarAxis {
  /** Axis identifier (e.g., "formality") */
  key: string;
  /** Display label (e.g., "Formality") */
  label: string;
  /** Current value */
  value: number;
  /** Maximum value for this axis */
  max: number;
}
```

### Internal State
- `hoveredAxis: string | null` -- highlights axis and shows value tooltip
- `animationProgress: number` -- 0-1 for mount animation

### Responsive Behavior

| Breakpoint | Behavior |
|-----------|----------|
| **Mobile (<768px)** | Scales to 180px diameter. Labels moved outside chart with leader lines. Values hidden (available on tap). |
| **Tablet (768-1024px)** | 220px diameter. All labels visible. |
| **Desktop (>1024px)** | 260px diameter (in persona card). Labels positioned at axis endpoints. Hover highlights axis with value tooltip. |

### Accessibility Requirements
- SVG has `role="img"` with comprehensive `aria-label`: "Style radar chart: Formality 78%, Sentence Length 65%, Vocabulary Richness 72%, Passive Voice 12%, Paragraph Length 60%, Sentence Variance 55%"
- `prefers-reduced-motion`: skip mount animation
- Not color-only: axis labels and values provide the data independently of the visual
- Focusable axes (Tab into chart, arrow keys between axes) for keyboard users
- Screen reader alternative: hidden data table below chart with same values

---

## 11. OverallScoreGauge

**Service:** Quality Gate
**Screens:** 15-Quality

### shadcn/ui Primitive
Custom SVG (`<circle>` with `stroke-dashoffset`)

### TypeScript Props Interface

```typescript
interface OverallScoreGaugeProps {
  /** Score value (0-10) */
  score: number;
  /** Maximum score */
  maxScore: number;
  /** Animate the fill on mount/update */
  animated?: boolean;
  /** Current scoring status */
  status: 'idle' | 'scoring' | 'scored' | 'not_scored';
  /** Whether article passed quality gate */
  passStatus?: 'passed' | 'failed' | 'pending';
  /** Previous score (for delta display after re-score) */
  previousScore?: number;
  /** Show linear percentage bar below ring */
  showPercentageBar?: boolean;
  /** Additional CSS classes */
  className?: string;
}
```

### Internal State
- `animatedScore: number` -- interpolated during mount animation (0 -> target)
- `showDelta: boolean` -- briefly shows delta after score update, auto-hides after 3s
- `deltaValue: number` -- computed difference from previousScore

### Responsive Behavior

| Breakpoint | Behavior |
|-----------|----------|
| **Mobile (<768px)** | Ring scales to 96px. Score number font size reduced. Percentage bar below remains full-width. Status badge stacks below gauge. |
| **Tablet (768-1024px)** | Ring at 110px. Gauge and status panel side-by-side. |
| **Desktop (>1024px)** | Full 120px ring. Gauge left, status panel right with action buttons. Animated fill on load. Color gradient: red (0-3), amber (3-7), green (7-10). |

### Accessibility Requirements
- SVG `role="img"` with `aria-label`: "Overall quality score: 8.4 out of 10, Passed"
- Status ("scoring in progress") announced via `aria-live="polite"`
- Delta change announced: "Score changed from 6.1 to 8.4, improvement of 2.3"
- `prefers-reduced-motion`: no animation, render at final state
- Geist Mono font for score number ensures legibility at all sizes
- Not color-only: pass/fail badge text accompanies color

---

## 12. AlertBanner

**Service:** All services
**Screens:** 02-Dashboard, 03-Pipeline, 05-Users, 06-Config, 09-Connections, 10-Inventory, 11-Opportunities, 14-Performance, 15-Quality

### shadcn/ui Primitive
`Alert` + `AlertTitle` + `AlertDescription` (shadcn)

### TypeScript Props Interface

```typescript
interface AlertBannerProps {
  /** Visual variant */
  variant: 'default' | 'destructive' | 'warning';
  /** Optional title */
  title?: string;
  /** Alert body content */
  children: ReactNode;
  /** Dismissable (shows close button) */
  dismissable?: boolean;
  /** Dismiss handler */
  onDismiss?: () => void;
  /** Auto-dismiss after N milliseconds */
  autoDismissMs?: number;
  /** Action button/link inside the alert */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'link' | 'button';
  };
  /** Icon override (defaults to variant-appropriate icon) */
  icon?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}
```

### Internal State
- `dismissed: boolean` -- tracks local dismiss (if `dismissable`)
- `autoDismissTimer: number | null` -- timeout ID for auto-dismiss

### Responsive Behavior

| Breakpoint | Behavior |
|-----------|----------|
| **Mobile (<768px)** | Full-width, stacks content vertically. Action button below text. Dismiss button top-right corner. |
| **Tablet (768-1024px)** | Full-width, content inline with action. |
| **Desktop (>1024px)** | Full-width with icon, title, description, and action all in a single flex row. Dismiss button at far right. |

### Accessibility Requirements
- `role="alert"` for destructive variant (announced immediately)
- `role="status"` for warning/default variant (announced at next opportunity)
- Dismiss button: `aria-label="Dismiss alert"`
- If `autoDismissMs` is set, must not auto-dismiss `role="alert"` variant (critical info stays)
- WCAG contrast: destructive (#ef4444 text on dark bg meets 4.5:1), warning (#f59e0b meets 4.5:1)

---

## 13. ApiKeyInput

**Service:** Data Ingestion, Publishing
**Screens:** 09-Connections, 13-Publish

### shadcn/ui Primitive
`Input` (shadcn) + custom masking + `Button`

### TypeScript Props Interface

```typescript
interface ApiKeyInputProps {
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Save/validate handler */
  onSave: (value: string) => Promise<void>;
  /** Current validation state */
  validationStatus: 'idle' | 'checking' | 'valid' | 'invalid';
  /** Validation error message */
  errorMessage?: string;
  /** Input placeholder */
  placeholder?: string;
  /** Minimum key length for client-side validation */
  minLength?: number;
  /** Whether the key is currently saved (shows masked display) */
  saved?: boolean;
  /** Masked preview of saved key (e.g., "...last8chars") */
  maskedPreview?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Label text */
  label?: string;
  /** Help text / link */
  helpText?: ReactNode;
}
```

### Internal State
- `revealed: boolean` -- toggle between masked and revealed input
- `localValue: string` -- input value before save
- `isFocused: boolean` -- tracks focus for reveal-on-focus behavior

### Responsive Behavior

| Breakpoint | Behavior |
|-----------|----------|
| **Mobile (<768px)** | Full-width input. Save button stacks below on very narrow screens. Help text wraps. |
| **Tablet (768-1024px)** | Input and Save button inline. |
| **Desktop (>1024px)** | Input (flex-1) with inline Save button (fixed width). Validation status appears inline right of Save. Help link below input. |

### Accessibility Requirements
- Input: `type="password"` by default, `type="text"` when revealed
- Reveal toggle: `aria-label="Show API key"` / `aria-label="Hide API key"`
- Validation errors: `aria-invalid="true"` + `aria-describedby` pointing to error message
- Status spinner during validation: `aria-label="Validating API key"`
- `aria-live="polite"` on validation status region
- Auto-trim whitespace: no error shown, silently corrected

---

## 14. PropertySelector

**Service:** Data Ingestion
**Screens:** 09-Connections

### shadcn/ui Primitive
`Select` (shadcn) OR `Combobox` (shadcn) -- switches based on item count threshold (20)

### TypeScript Props Interface

```typescript
interface PropertySelectorProps {
  /** Available properties from Google API */
  properties: Property[];
  /** Currently selected value */
  value: string | null;
  /** Change handler */
  onChange: (value: string) => void;
  /** Provider type affects label and validation */
  provider: 'gsc' | 'ga4';
  /** Loading state (fetching properties from Google) */
  loading?: boolean;
  /** Error state (failed to fetch properties) */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Threshold for switching from Select to Combobox */
  comboboxThreshold?: number;
}

interface Property {
  /** Property ID (e.g., "sc-domain:example.com") */
  id: string;
  /** Display name */
  name: string;
  /** Property type for GSC (domain, url_prefix) */
  type?: string;
}
```

### Internal State
- `searchQuery: string` -- for Combobox filtering
- `isComboboxMode: boolean` -- derived from `properties.length > comboboxThreshold`
- `filteredProperties: Property[]` -- computed from searchQuery

### Responsive Behavior

| Breakpoint | Behavior |
|-----------|----------|
| **Mobile (<768px)** | Full-width dropdown. Combobox opens as bottom sheet with search input at top. Supports bidi text for Arabic property names. |
| **Tablet (768-1024px)** | Inline dropdown/combobox, standard width. |
| **Desktop (>1024px)** | Fixed width within connection card. Combobox dropdown with type-ahead. Up to 10 visible items, scrollable beyond. |

### Accessibility Requirements
- Select mode: `role="listbox"` with `aria-selected` states
- Combobox mode: `role="combobox"` with `aria-expanded`, `aria-autocomplete="list"`
- Loading: `aria-busy="true"` with "Loading properties..." label
- Empty: "No properties found" with link to Google Search Console setup
- Error: `aria-invalid="true"` with descriptive error message
- Bidi support: `dir="auto"` on option text for Arabic site names

---

## 15. DateRangePicker

**Service:** Publishing, Feedback Loop
**Screens:** 13-Publish (schedule date), 14-Performance (date range filter)

### shadcn/ui Primitive
`Popover` + `Calendar` (shadcn)

### TypeScript Props Interface

```typescript
interface DateRangePickerProps {
  /** Mode: range selection or single date */
  mode: 'range' | 'single';
  /** Selected date range (for range mode) */
  dateRange?: {
    from: Date;
    to: Date;
  };
  /** Selected date (for single mode) */
  date?: Date;
  /** Change handler for range mode */
  onRangeChange?: (range: { from: Date; to: Date }) => void;
  /** Change handler for single mode */
  onDateChange?: (date: Date) => void;
  /** Preset ranges (e.g., "Last 7 days", "Last 30 days") */
  presets?: DatePreset[];
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Disabled dates */
  disabledDates?: Date[];
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Display format */
  dateFormat?: string;
}

interface DatePreset {
  label: string;
  from: Date;
  to: Date;
}
```

### Internal State
- `isOpen: boolean` -- popover open state
- `selectedRange: { from: Date | null, to: Date | null }` -- during range selection (before confirming)
- `hoveredDate: Date | null` -- for range preview highlighting
- `visibleMonth: Date` -- which month(s) the calendar shows

### Responsive Behavior

| Breakpoint | Behavior |
|-----------|----------|
| **Mobile (<768px)** | Trigger button full-width. Calendar opens as bottom sheet. Single month view. Presets listed above calendar. |
| **Tablet (768-1024px)** | Popover with single month calendar. Presets in sidebar. |
| **Desktop (>1024px)** | Popover with dual calendar view (two months side by side). Presets in left sidebar of popover. Range highlighting across both months. |

### Accessibility Requirements
- Trigger button: `aria-haspopup="dialog"`, `aria-expanded`
- Calendar: `role="grid"` with `aria-label="Choose date range"`
- Date cells: `aria-selected`, `aria-disabled` for out-of-range dates
- Keyboard: arrow keys navigate between days, Page Up/Down between months, Enter selects
- Selected range: announced via `aria-live`: "Selected March 1 to March 28, 2026"
- Preset buttons: `role="listbox"` with `aria-label="Quick date ranges"`
- Min/max constraints: disabled dates have `aria-disabled="true"` with tooltip reason

---

## Shared Patterns

### Color System for Scores

All score-based components (ScoreRing, SignalBar, HealthDistributionBar, KPICard, Badge) use a shared color interpolation function:

```typescript
function getScoreColor(score: number, max: number): string {
  const ratio = score / max;
  if (ratio >= 0.8) return 'var(--score-green)';   // #22c55e
  if (ratio >= 0.6) return 'var(--score-amber)';   // #f59e0b
  if (ratio >= 0.4) return 'var(--score-orange)';  // #f97316
  return 'var(--score-red)';                        // #ef4444
}
```

### Loading Pattern

All components follow the skeleton pattern (no spinners):
1. Skeleton matches the spatial layout of the loaded state
2. Pulsing animation via Tailwind `animate-pulse`
3. Duration target: <500ms for most API calls
4. `aria-busy="true"` on the loading container

### RTL Support Pattern

Components that display user-generated content (titles, URLs, keywords) use `dir="auto"` to detect text direction. API key inputs and code values always remain LTR (`dir="ltr"`). Layout mirroring is handled at the page level via Tailwind's `rtl:` variants.

### Motion Reduction Pattern

All animated components check `prefers-reduced-motion`:
```typescript
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
```
When true: skip fill animations (ScoreRing, OverallScoreGauge), disable pulse on StatusDot, disable sparkline animation, render at final state.
