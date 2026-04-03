# ChainIQ Component Catalog

> **Stack:** Next.js 16 + shadcn/ui (base-ui variant) + Tailwind CSS
> **Theme:** Warm dark mode, gold accents, Geist fonts
> **Total Screens:** 15
> **Total Unique Components:** 87
> **Last Updated:** 2026-03-28

---

## Category Index

| Category | Count | Components |
|----------|-------|------------|
| Layout | 6 | Sidebar, PageHeader, Breadcrumb, Container, StatsRow, StickyMiniHeader |
| Navigation | 4 | Tabs, Pagination, PipelineStepper, CheckpointTimeline |
| Forms | 10 | Input, Select, Combobox, ApiKeyInput, PropertySelector, DateRangePicker, Slider, Switch, Checkbox, Form |
| Data Display | 24 | DataTable, Card, Badge, ScoreRing, StatusDot, SyncSparkline, TrendSparkline, TimelineChart, RadarChart, OverlaidRadarChart, KPICard, ProgressBar, RelativeTimestamp, HealthDistributionBar, HorizontalBarChart, AccuracyTrendChart, CheckpointIcons, MetricComparisonCard, SignalBar, ChecklistCategory, ChecklistItem, SuggestionItem, RevisionRow, OverallScoreGauge |
| Feedback | 8 | Toast, Skeleton, AlertBanner, ValidationStatus, CrawlProgressOverlay, AnalysisRunningOverlay, PushStatusToast, ScoringProgressBar |
| Overlays | 8 | Dialog, AlertDialog, Sheet, Tooltip, Popover, ComparisonDrawer, ArticleDetailDrawer, RevisionComparisonModal |
| Actions | 7 | Button, ActionButtons, DropdownMenu, BatchActionsDropdown, ExpandToggle, FilterChips, ToggleGroup |

---

## 1. Layout Components

### Sidebar

| Field | Value |
|-------|-------|
| **Category** | Layout |
| **Source Screens** | 02-Dashboard, 03-Pipeline, 04-Detail, 05-Users, 06-Config, 07-Onboarding, 08-Blueprints, 09-Connections, 10-Inventory, 11-Opportunities, 12-Voice, 13-Publish, 14-Performance, 15-Quality |
| **Status** | Planned |
| **shadcn/ui Primitive** | Custom |
| **Props** | `collapsed: boolean`, `onToggle: () => void`, `activeRoute: string`, `userRole: Role`, `pendingCount?: number` |
| **Variants** | 2 (expanded, collapsed/hamburger on mobile) |
| **Notes** | Persistent navigation across all authenticated screens. Shows admin badge, pending approvals count. Collapses to hamburger on mobile. |

### PageHeader

| Field | Value |
|-------|-------|
| **Category** | Layout |
| **Source Screens** | 09-Connections, 10-Inventory, 11-Opportunities, 12-Voice, 13-Publish, 14-Performance, 15-Quality |
| **Status** | Planned |
| **shadcn/ui Primitive** | Custom flex layout + `Breadcrumb` |
| **Props** | `title: string`, `breadcrumbs?: BreadcrumbItem[]`, `actions?: ReactNode`, `subtitle?: string` |
| **Variants** | 2 (with breadcrumbs, without breadcrumbs) |
| **Notes** | Standard top section with heading, breadcrumb trail, and right-aligned action buttons. |

### Breadcrumb

| Field | Value |
|-------|-------|
| **Category** | Layout |
| **Source Screens** | 04-Detail, 09-Connections, 11-Opportunities, 15-Quality |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Breadcrumb` (shadcn) |
| **Props** | `items: { label: string, href?: string }[]` |
| **Variants** | 1 |
| **Notes** | Nested within PageHeader. Truncates long titles with tooltip. |

### Container

| Field | Value |
|-------|-------|
| **Category** | Layout |
| **Source Screens** | All 15 screens |
| **Status** | Planned |
| **shadcn/ui Primitive** | Custom (`<div>` with max-width) |
| **Props** | `maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'`, `className?: string` |
| **Variants** | 5 (by max-width) |
| **Notes** | Page-level content wrapper with responsive padding. |

### StatsRow

| Field | Value |
|-------|-------|
| **Category** | Layout |
| **Source Screens** | 10-Inventory, 11-Opportunities |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Card` (x N, compact variant) |
| **Props** | `stats: StatItem[]` |
| **Variants** | 1 |
| **Notes** | Horizontal row of mini stat cards using CSS grid with auto-fill for responsive wrapping. |

### StickyMiniHeader

| Field | Value |
|-------|-------|
| **Category** | Layout |
| **Source Screens** | 15-Quality |
| **Status** | Planned |
| **shadcn/ui Primitive** | Custom (`position: sticky`) |
| **Props** | `score: number`, `status: PassFailStatus`, `actions: ReactNode` |
| **Variants** | 1 |
| **Notes** | Contains miniature score ring (32px), pass/fail badge, and action buttons. CSS-only show/hide on scroll. |

---

## 2. Navigation Components

### Tabs

| Field | Value |
|-------|-------|
| **Category** | Navigation |
| **Source Screens** | 04-Detail, 06-Config, 08-Blueprints, 11-Opportunities, 13-Publish, 14-Performance |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent` |
| **Props** | `tabs: TabItem[]`, `defaultValue?: string`, `onValueChange?: (value: string) => void`, `variant?: 'underline' | 'default'` |
| **Variants** | 2 (underline style, default style) |
| **Notes** | Some tabs include count badges (Opportunities, Publish). Horizontally scrollable on mobile. Arrow key navigation. |

### Pagination

| Field | Value |
|-------|-------|
| **Category** | Navigation |
| **Source Screens** | 03-Pipeline, 05-Users, 08-Blueprints, 10-Inventory, 11-Opportunities, 13-Publish, 14-Performance |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Pagination` (shadcn) |
| **Props** | `page: number`, `totalPages: number`, `pageSize: number`, `onPageChange: (page: number) => void`, `onPageSizeChange?: (size: number) => void`, `pageSizeOptions?: number[]` |
| **Variants** | 2 (full pagination, "Load more" button on mobile) |
| **Notes** | Prev/Next buttons + page indicator + optional page size selector. Disabled states at boundaries. |

### PipelineStepper

| Field | Value |
|-------|-------|
| **Category** | Navigation |
| **Source Screens** | 07-Onboarding, 12-Voice |
| **Status** | Planned |
| **shadcn/ui Primitive** | Custom (`<ol>` with CSS steps) |
| **Props** | `steps: StepItem[]`, `currentStep: number`, `orientation?: 'horizontal' | 'vertical'` |
| **Variants** | 2 (horizontal on desktop, vertical on mobile) |
| **Notes** | 4-5 stage progress indicator. `aria-current="step"` on active. Used in onboarding wizard and voice analysis. |

### CheckpointTimeline

| Field | Value |
|-------|-------|
| **Category** | Navigation |
| **Source Screens** | 14-Performance |
| **Status** | Planned |
| **shadcn/ui Primitive** | Custom horizontal stepper |
| **Props** | `checkpoints: { day: number, status: 'complete' | 'pending' | 'not_reached', accuracy?: number }[]` |
| **Variants** | 1 |
| **Notes** | 3 nodes (30d/60d/90d) connected by lines. Filled/empty states based on data availability. |

---

## 3. Form Components

### Input

| Field | Value |
|-------|-------|
| **Category** | Forms |
| **Source Screens** | 01-Login, 03-Pipeline, 06-Config, 07-Onboarding, 08-Blueprints, 09-Connections, 10-Inventory, 11-Opportunities, 12-Voice, 14-Performance |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Input` (shadcn) |
| **Props** | `type: string`, `placeholder?: string`, `value: string`, `onChange: handler`, `disabled?: boolean`, `error?: string` |
| **Variants** | 4 (text, password, search with icon/clear, number) |
| **Notes** | Search variant includes debounce (300ms), clear button, and search icon. Password variant includes show/hide toggle. |

### Select

| Field | Value |
|-------|-------|
| **Category** | Forms |
| **Source Screens** | 03-Pipeline, 05-Users, 06-Config, 07-Onboarding, 09-Connections, 10-Inventory, 11-Opportunities, 13-Publish, 14-Performance |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Select` (shadcn) |
| **Props** | `options: Option[]`, `value: string`, `onChange: handler`, `placeholder?: string`, `disabled?: boolean` |
| **Variants** | 2 (single-select, multi-select with checkboxes) |
| **Notes** | Multi-select variant uses `DropdownMenuCheckboxItem` internally. Some show count badges per option. |

### Combobox

| Field | Value |
|-------|-------|
| **Category** | Forms |
| **Source Screens** | 09-Connections |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Combobox` (shadcn) |
| **Props** | `options: Option[]`, `value: string`, `onChange: handler`, `searchable: boolean`, `placeholder?: string` |
| **Variants** | 1 |
| **Notes** | Used when PropertySelector has >20 items. Type-ahead filtering for GSC properties with 50+ entries. |

### ApiKeyInput

| Field | Value |
|-------|-------|
| **Category** | Forms |
| **Source Screens** | 09-Connections, 13-Publish |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Input` (shadcn) + password masking |
| **Props** | `value: string`, `onChange: handler`, `onSave: handler`, `isValidating: boolean`, `validationStatus: 'idle' | 'checking' | 'valid' | 'invalid'`, `placeholder?: string` |
| **Variants** | 1 |
| **Notes** | `type="password"` with toggle reveal button. Auto-trims whitespace on paste and submit. |

### PropertySelector

| Field | Value |
|-------|-------|
| **Category** | Forms |
| **Source Screens** | 09-Connections |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Select` (shadcn) or `Combobox` if >20 items |
| **Props** | `properties: Property[]`, `value: string`, `onChange: handler`, `provider: 'gsc' | 'ga4'`, `loading?: boolean` |
| **Variants** | 2 (dropdown for <20 items, searchable combobox for 20+) |
| **Notes** | Populated from Google API post-connect. Supports bidi text rendering for Arabic site names. |

### DateRangePicker

| Field | Value |
|-------|-------|
| **Category** | Forms |
| **Source Screens** | 13-Publish, 14-Performance |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Popover` + `Calendar` (shadcn) |
| **Props** | `from: Date`, `to: Date`, `onChange: (range: DateRange) => void`, `presets?: Preset[]`, `minDate?: Date`, `maxDate?: Date` |
| **Variants** | 2 (date range, single date for scheduling) |
| **Notes** | Dual calendar view for range selection. Schedule variant used in Publish Manager for future publish dates. |

### Slider

| Field | Value |
|-------|-------|
| **Category** | Forms |
| **Source Screens** | 12-Voice |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Slider` (shadcn) |
| **Props** | `min: number`, `max: number`, `step: number`, `value: number`, `onChange: handler`, `label?: string` |
| **Variants** | 2 (0-100 integer for formality, 0-1 with 0.01 step for vocab richness) |
| **Notes** | Used in Manual Persona Creation dialog for style parameters. Labeled thresholds visible. |

### Switch

| Field | Value |
|-------|-------|
| **Category** | Forms |
| **Source Screens** | 06-Config, 14-Performance |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Switch` (shadcn) |
| **Props** | `checked: boolean`, `onCheckedChange: handler`, `label?: string`, `disabled?: boolean` |
| **Variants** | 1 |
| **Notes** | Toggle settings in Config. Report section toggles in Performance client report dialog. |

### Checkbox

| Field | Value |
|-------|-------|
| **Category** | Forms |
| **Source Screens** | 03-Pipeline, 05-Users, 10-Inventory, 11-Opportunities, 13-Publish |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Checkbox` (shadcn) |
| **Props** | `checked: boolean | 'indeterminate'`, `onCheckedChange: handler`, `disabled?: boolean` |
| **Variants** | 2 (standard, indeterminate/select-all) |
| **Notes** | Three states: unchecked, checked, indeterminate. Used for row selection and "Select all on page." |

### Form

| Field | Value |
|-------|-------|
| **Category** | Forms |
| **Source Screens** | 01-Login, 06-Config, 07-Onboarding, 12-Voice, 13-Publish |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Form` (shadcn + react-hook-form + zod) |
| **Props** | `onSubmit: handler`, `defaultValues?: object`, `schema: ZodSchema` |
| **Variants** | 1 |
| **Notes** | Validation wrapper using react-hook-form and zod schema. Handles dirty tracking, inline errors, and submit states. |

---

## 4. Data Display Components

### DataTable

| Field | Value |
|-------|-------|
| **Category** | Data Display |
| **Source Screens** | 02-Dashboard, 03-Pipeline, 04-Detail (versions), 05-Users, 10-Inventory, 14-Performance |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Table` (shadcn) |
| **Props** | `columns: ColumnDef[]`, `data: T[]`, `sorting?: SortingState`, `onSortingChange?: handler`, `onRowClick?: handler`, `selectable?: boolean`, `loading?: boolean`, `emptyMessage?: string` |
| **Variants** | 3 (full with pagination, compact/inline, card layout on mobile) |
| **Notes** | Full semantic `<table>` with sortable headers. Column widths via colgroup. Converts to card layout below 768px. Supports row selection via checkboxes. |

### Card

| Field | Value |
|-------|-------|
| **Category** | Data Display |
| **Source Screens** | 01-Login, 02-Dashboard, 04-Detail, 05-Users, 06-Config, 07-Onboarding, 08-Blueprints, 09-Connections, 10-Inventory, 11-Opportunities, 12-Voice, 13-Publish, 14-Performance, 15-Quality |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Card` + `CardHeader` + `CardContent` + `CardFooter` (shadcn) |
| **Props** | `className?: string`, `variant?: 'default' | 'outline' | 'dashed'`, `collapsible?: boolean`, `onClick?: handler` |
| **Variants** | 4 (default, outline, dashed/create, collapsible) |
| **Notes** | Most heavily reused component. Appears in every screen. Dashed variant for "Create manual persona" CTA. Collapsible variant in Connections (all-connected state). |

### Badge

| Field | Value |
|-------|-------|
| **Category** | Data Display |
| **Source Screens** | 02-Dashboard, 03-Pipeline, 04-Detail, 05-Users, 06-Config, 08-Blueprints, 09-Connections, 10-Inventory, 11-Opportunities, 12-Voice, 13-Publish, 14-Performance, 15-Quality |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Badge` (shadcn) |
| **Props** | `variant: 'default' | 'secondary' | 'destructive' | 'outline'`, `className?: string`, `children: ReactNode` |
| **Variants** | 15+ (status badges, type badges, confidence badges, priority badges, language badges, platform badges, anomaly badges, filter chips, pass/fail badges, count badges) |
| **Notes** | The most variant-rich component. Color-coded by context: draft=blue, published=green, archived=gray, error=red, pending=amber, etc. Always paired with text (not color-only). |

### ScoreRing

| Field | Value |
|-------|-------|
| **Category** | Data Display |
| **Source Screens** | 10-Inventory, 11-Opportunities, 15-Quality |
| **Status** | Planned |
| **shadcn/ui Primitive** | Custom SVG (`<circle>` with `stroke-dasharray`) |
| **Props** | `score: number`, `max?: number`, `size?: 'sm' | 'md' | 'lg'`, `showLabel?: boolean`, `animated?: boolean` |
| **Variants** | 3 (sm=24px for table rows, md=40px for opportunity cards, lg=120px for quality report gauge) |
| **Notes** | Color interpolated from red (0) through amber (50) to green (100). Number centered inside. Respects `prefers-reduced-motion`. |

### StatusDot

| Field | Value |
|-------|-------|
| **Category** | Data Display |
| **Source Screens** | 09-Connections, 13-Publish |
| **Status** | Planned |
| **shadcn/ui Primitive** | Custom (`<span>` + CSS animation) |
| **Props** | `status: 'connected' | 'error' | 'expired' | 'disconnected'`, `pulse?: boolean`, `label?: string` |
| **Variants** | 4 (green with pulse, orange static, red static, gray static) |
| **Notes** | 3 color variants matching connection state. Green includes subtle pulse animation. Always paired with text label and icon for accessibility. |

### SyncSparkline

| Field | Value |
|-------|-------|
| **Category** | Data Display |
| **Source Screens** | 09-Connections |
| **Status** | Planned |
| **shadcn/ui Primitive** | Custom SVG (30 circles) |
| **Props** | `data: SyncDay[]`, `ariaLabel?: string` |
| **Variants** | 1 |
| **Notes** | 30-day mini chart with colored circles by status. Lightweight, no chart library. Tooltip on hover shows day detail. Hidden on mobile <375px. Disabled when `prefers-reduced-motion`. |

### TrendSparkline

| Field | Value |
|-------|-------|
| **Category** | Data Display |
| **Source Screens** | 10-Inventory, 11-Opportunities |
| **Status** | Planned |
| **shadcn/ui Primitive** | Custom inline SVG |
| **Props** | `data: number[]`, `width?: number`, `height?: number`, `trendDirection?: 'up' | 'down' | 'flat'` |
| **Variants** | 1 |
| **Notes** | 80px wide, 20px tall. Polyline path from 90-day data. Stroke color: green (trending up), red (down), gray (flat). Hidden on tablet. |

### AccuracyTrendChart

| Field | Value |
|-------|-------|
| **Category** | Data Display |
| **Source Screens** | 14-Performance |
| **Status** | Planned |
| **shadcn/ui Primitive** | Recharts `LineChart` or Custom SVG |
| **Props** | `data: MonthlyAccuracy[]`, `series: string[]`, `timeRange: '3M' | '6M' | '12M' | 'All'` |
| **Variants** | 1 |
| **Notes** | 3 line series with distinct dash patterns for accessibility. Responsive container. Custom tooltip shows month + values. |

### RadarChart (StyleRadarChart)

| Field | Value |
|-------|-------|
| **Category** | Data Display |
| **Source Screens** | 12-Voice |
| **Status** | Planned |
| **shadcn/ui Primitive** | Custom SVG (inline, no library) |
| **Props** | `axes: { label: string, value: number, max: number }[]`, `size?: number`, `color?: string` |
| **Variants** | 1 |
| **Notes** | 6-axis spider chart for voice persona DNA. ~2KB SVG per card. Scales to 180px on mobile. |

### OverlaidRadarChart

| Field | Value |
|-------|-------|
| **Category** | Data Display |
| **Source Screens** | 12-Voice |
| **Status** | Planned |
| **shadcn/ui Primitive** | Custom SVG (dual dataset) |
| **Props** | `personaA: RadarData`, `personaB: RadarData`, `colorA?: string`, `colorB?: string` |
| **Variants** | 1 |
| **Notes** | Solid + dashed line patterns for color-blind accessibility. Used in ComparisonDrawer. |

### KPICard

| Field | Value |
|-------|-------|
| **Category** | Data Display |
| **Source Screens** | 02-Dashboard, 14-Performance |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Card` + custom metric layout |
| **Props** | `title: string`, `value: string | number`, `trend?: { direction: 'up' | 'down' | 'stable', value: string }`, `icon?: ReactNode`, `sparkline?: number[]`, `subMetric?: string`, `onClick?: handler` |
| **Variants** | 4 (basic with trend arrow, with sparkline, with sub-metric, with status badge) |
| **Notes** | Grid of 4 in both Dashboard and Performance. `aria-label` with full context. 2x2 grid on tablet, stacked on mobile. |

### ProgressBar

| Field | Value |
|-------|-------|
| **Category** | Data Display |
| **Source Screens** | 05-Users, 07-Onboarding, 10-Inventory, 12-Voice, 13-Publish, 15-Quality |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Progress` (shadcn) |
| **Props** | `value: number`, `max?: number`, `variant?: 'default' | 'success' | 'warning' | 'error'`, `label?: string`, `indeterminate?: boolean` |
| **Variants** | 3 (determinate, indeterminate, colored by score range) |
| **Notes** | Used for quota bars, crawl progress, pipeline progress, scoring progress, and signal bars. Color override based on context. |

### RelativeTimestamp

| Field | Value |
|-------|-------|
| **Category** | Data Display |
| **Source Screens** | 02-Dashboard, 03-Pipeline, 09-Connections, 10-Inventory, 11-Opportunities, 13-Publish, 14-Performance, 15-Quality |
| **Status** | Planned |
| **shadcn/ui Primitive** | Custom (uses `Intl.RelativeTimeFormat`) |
| **Props** | `date: string | Date`, `updateInterval?: number` |
| **Variants** | 1 |
| **Notes** | Renders "2h ago", "3 days ago", etc. Auto-updates on timer. Tooltip shows full formatted date. |

### HealthDistributionBar

| Field | Value |
|-------|-------|
| **Category** | Data Display |
| **Source Screens** | 10-Inventory |
| **Status** | Planned |
| **shadcn/ui Primitive** | Custom component + `Tooltip` |
| **Props** | `segments: { status: string, count: number, color: string }[]`, `total: number`, `onSegmentClick?: (status: string) => void` |
| **Variants** | 2 (full color, dimmed segments when filtered) |
| **Notes** | Proportional colored `<div>` segments. Each segment clickable to apply filter. Tooltip shows count + percentage. Wraps to 2 rows on mobile. |

### HorizontalBarChart

| Field | Value |
|-------|-------|
| **Category** | Data Display |
| **Source Screens** | 14-Performance |
| **Status** | Planned |
| **shadcn/ui Primitive** | Custom div-based bars |
| **Props** | `bars: { label: string, value: number, count: number }[]`, `maxValue?: number` |
| **Variants** | 1 |
| **Notes** | No chart library needed -- CSS width percentages with transitions. Used for strategy breakdown by opportunity type, content format, or voice persona. |

### CheckpointIcons

| Field | Value |
|-------|-------|
| **Category** | Data Display |
| **Source Screens** | 14-Performance |
| **Status** | Planned |
| **shadcn/ui Primitive** | Custom icon set |
| **Props** | `checkpoints: { day: 30 | 60 | 90, status: 'checked' | 'pending' | 'not_reached' }[]` |
| **Variants** | 3 icons (checkmark, hourglass, dash) |
| **Notes** | Inline display in prediction table rows. |

### MetricComparisonCard

| Field | Value |
|-------|-------|
| **Category** | Data Display |
| **Source Screens** | 12-Voice, 14-Performance |
| **Status** | Planned |
| **shadcn/ui Primitive** | Custom layout |
| **Props** | `label: string`, `predicted: number`, `actual: number`, `delta: number`, `unit?: string` |
| **Variants** | 2 (predicted vs actual in Performance, persona A vs B in Voice) |
| **Notes** | Grouped bar or side-by-side display with delta percentage. Green for positive delta, red for negative. |

### SignalBar

| Field | Value |
|-------|-------|
| **Category** | Data Display |
| **Source Screens** | 15-Quality |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Progress` (shadcn) + custom label layout |
| **Props** | `label: string`, `weight: number`, `score: number`, `maxScore: number`, `showWeight?: boolean`, `onClick?: handler` |
| **Variants** | 2 (standard 7-signal, compact E-E-A-T 10-dimension) |
| **Notes** | Extended with score value, weight label, and status color override. Hover reveals tooltip. |

### ChecklistCategory

| Field | Value |
|-------|-------|
| **Category** | Data Display |
| **Source Screens** | 15-Quality |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Collapsible` or `Accordion` (shadcn) |
| **Props** | `name: string`, `passCount: number`, `totalCount: number`, `items: ChecklistItem[]`, `defaultOpen?: boolean` |
| **Variants** | 1 |
| **Notes** | 10 categories, independent open/close. Custom header with pass count badge. Full-width accordion items on mobile. |

### ChecklistItem

| Field | Value |
|-------|-------|
| **Category** | Data Display |
| **Source Screens** | 15-Quality |
| **Status** | Planned |
| **shadcn/ui Primitive** | Custom flex row |
| **Props** | `description: string`, `passed: boolean`, `detail?: string`, `fixLink?: string` |
| **Variants** | 2 (passed with checkmark, failed with X and optional "Fix" button) |
| **Notes** | `CheckCircle2` / `XCircle` icons from Lucide. Conditional "Fix" button links to corresponding suggestion. |

### SuggestionItem

| Field | Value |
|-------|-------|
| **Category** | Data Display |
| **Source Screens** | 15-Quality |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Card` (shadcn) variant |
| **Props** | `priority: 'high' | 'medium' | 'low'`, `text: string`, `signal: string`, `impactEstimate: number`, `index: number` |
| **Variants** | 3 (by priority: red/amber/blue) |
| **Notes** | Ordered list with priority badge, monospace impact estimate, signal tag. |

### RevisionRow

| Field | Value |
|-------|-------|
| **Category** | Data Display |
| **Source Screens** | 15-Quality |
| **Status** | Planned |
| **shadcn/ui Primitive** | Custom flex row inside `Card` |
| **Props** | `revisionNumber: number`, `label: string`, `score: number`, `status: PassFailStatus`, `timestamp: string`, `delta?: number` |
| **Variants** | 2 (original without delta, revision with delta) |
| **Notes** | Score + badge + timestamp + delta. Delta green for positive, red for negative. Max 3 rows (original + 2 revisions). |

### OverallScoreGauge

| Field | Value |
|-------|-------|
| **Category** | Data Display |
| **Source Screens** | 15-Quality |
| **Status** | Planned |
| **shadcn/ui Primitive** | Custom SVG (`<circle>` with `stroke-dashoffset`) |
| **Props** | `score: number`, `maxScore: number`, `animated?: boolean`, `status?: 'scoring' | 'scored' | 'not_scored'` |
| **Variants** | 3 (scoring in-progress with spinner, scored with color gradient, not-scored with dashed outline) |
| **Notes** | Animated fill, color interpolated between red/amber/green. Geist Mono for the score number. Linear percentage bar fallback below ring. |

---

## 5. Feedback Components

### Toast

| Field | Value |
|-------|-------|
| **Category** | Feedback |
| **Source Screens** | 03-Pipeline, 05-Users, 06-Config, 09-Connections, 10-Inventory, 11-Opportunities, 13-Publish, 14-Performance |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Toast` (sonner) |
| **Props** | `title: string`, `description?: string`, `variant?: 'default' | 'destructive' | 'success'`, `action?: ToastAction`, `duration?: number` |
| **Variants** | 3 (success, destructive, default/info) |
| **Notes** | Auto-dismiss after 5s. Some include action links (e.g., "Edit in CMS", "Undo"). Uses `role="status"`. |

### Skeleton

| Field | Value |
|-------|-------|
| **Category** | Feedback |
| **Source Screens** | 01-Login, 02-Dashboard, 03-Pipeline, 05-Users, 06-Config, 08-Blueprints, 09-Connections, 10-Inventory, 11-Opportunities, 12-Voice, 13-Publish, 14-Performance, 15-Quality |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Skeleton` (shadcn) |
| **Props** | `className?: string`, `variant?: 'text' | 'circular' | 'rectangular'` |
| **Variants** | 3 (text line, circular for avatars/score rings, rectangular for cards/charts) |
| **Notes** | Used in every screen's loading state. Maintains spatial layout to prevent CLS. Pulsing animation. No spinners used anywhere in the platform. |

### AlertBanner

| Field | Value |
|-------|-------|
| **Category** | Feedback |
| **Source Screens** | 02-Dashboard, 03-Pipeline, 05-Users, 06-Config, 09-Connections, 10-Inventory, 11-Opportunities, 14-Performance, 15-Quality |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Alert` (shadcn) |
| **Props** | `variant: 'default' | 'destructive' | 'warning'`, `title?: string`, `children: ReactNode`, `dismissable?: boolean`, `action?: ReactNode` |
| **Variants** | 3 (warning/amber, error/red, info/blue) |
| **Notes** | Used for connection errors, stale data warnings, auth failures, low confidence notices, revision needed notices. |

### ValidationStatus

| Field | Value |
|-------|-------|
| **Category** | Feedback |
| **Source Screens** | 09-Connections, 13-Publish |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Badge` or inline text |
| **Props** | `status: 'idle' | 'checking' | 'valid' | 'invalid'`, `message?: string` |
| **Variants** | 4 (idle, checking with spinner, valid with green check, invalid with red X) |
| **Notes** | Shown inline next to API key inputs and connection test results. |

### CrawlProgressOverlay

| Field | Value |
|-------|-------|
| **Category** | Feedback |
| **Source Screens** | 10-Inventory |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Card` + `Progress` (shadcn) |
| **Props** | `progress: number`, `total: number`, `stage: string`, `events: CrawlEvent[]`, `isFirstCrawl: boolean`, `onCancel: handler` |
| **Variants** | 2 (full overlay for first crawl, slim banner for re-crawl) |
| **Notes** | For first crawl: centered overlay with progress bar. For re-crawl: slim banner above table. Table progressively populates below. |

### AnalysisRunningOverlay

| Field | Value |
|-------|-------|
| **Category** | Feedback |
| **Source Screens** | 11-Opportunities |
| **Status** | Planned |
| **shadcn/ui Primitive** | Custom `div` + `Progress` (indeterminate) |
| **Props** | `stageLabel: string`, `estimatedTime?: string`, `onCancel: handler` |
| **Variants** | 1 |
| **Notes** | Pushes content down (does not overlay). Includes cancel button. Stage labels rotate. |

### PushStatusToast

| Field | Value |
|-------|-------|
| **Category** | Feedback |
| **Source Screens** | 13-Publish |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Toast` (sonner) |
| **Props** | `articleTitle: string`, `platform: string`, `status: 'success' | 'failed'`, `editUrl?: string`, `viewUrl?: string` |
| **Variants** | 2 (success with CMS links, failed with retry) |
| **Notes** | Auto-dismiss after 5s. Includes "Edit in CMS" action link that opens in new tab. |

### ScoringProgressBar

| Field | Value |
|-------|-------|
| **Category** | Feedback |
| **Source Screens** | 15-Quality |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Progress` (shadcn) |
| **Props** | `completed: number`, `total: number`, `label?: string` |
| **Variants** | 1 |
| **Notes** | Shown during scoring-in-progress state. Labeled "34/60 checks complete". Polls every 3 seconds. |

---

## 6. Overlay Components

### Dialog

| Field | Value |
|-------|-------|
| **Category** | Overlays |
| **Source Screens** | 03-Pipeline, 05-Users, 11-Opportunities, 12-Voice, 13-Publish, 14-Performance, 15-Quality |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Dialog` + `DialogContent` + `DialogHeader` + `DialogFooter` (shadcn) |
| **Props** | `open: boolean`, `onOpenChange: handler`, `title: string`, `description?: string`, `children: ReactNode` |
| **Variants** | 1 |
| **Notes** | Used for: new article creation, approve user, analyze category, manual persona creation, batch publish, client report, revision request, recalibration result. Focus trap and Escape-to-close. |

### AlertDialog

| Field | Value |
|-------|-------|
| **Category** | Overlays |
| **Source Screens** | 03-Pipeline, 05-Users, 09-Connections, 12-Voice, 13-Publish, 15-Quality |
| **Status** | Planned |
| **shadcn/ui Primitive** | `AlertDialog` (shadcn) |
| **Props** | `open: boolean`, `onOpenChange: handler`, `title: string`, `description: string`, `confirmLabel?: string`, `onConfirm: handler`, `destructive?: boolean` |
| **Variants** | 1 |
| **Notes** | `role="alertdialog"`. Used for: delete confirmation, disconnect confirmation, cancel publish, re-score confirmation. Destructive confirm button (red). Focus trap, Escape to close. |

### Sheet (Drawer)

| Field | Value |
|-------|-------|
| **Category** | Overlays |
| **Source Screens** | 05-Users, 08-Blueprints, 12-Voice, 14-Performance |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Sheet` (shadcn) |
| **Props** | `open: boolean`, `onOpenChange: handler`, `side: 'right' | 'bottom'`, `title: string`, `children: ReactNode` |
| **Variants** | 2 (right side panel, bottom drawer) |
| **Notes** | Used for: user detail, blueprint detail, corpus article list, article performance detail. Full-screen on mobile. Focus trap. |

### Tooltip

| Field | Value |
|-------|-------|
| **Category** | Overlays |
| **Source Screens** | All screens with interactive elements |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Tooltip` (shadcn) |
| **Props** | `content: string`, `side?: 'top' | 'right' | 'bottom' | 'left'`, `children: ReactNode` |
| **Variants** | 1 |
| **Notes** | Used for: truncated text, disabled button explanations, score ring details, sparkline data points, health distribution segments. |

### Popover

| Field | Value |
|-------|-------|
| **Category** | Overlays |
| **Source Screens** | 11-Opportunities, 13-Publish, 14-Performance |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Popover` (shadcn) |
| **Props** | `open: boolean`, `onOpenChange: handler`, `trigger: ReactNode`, `children: ReactNode` |
| **Variants** | 1 |
| **Notes** | Used for dismiss reason dialog (anchored to button, not full modal), advanced publish options, calendar date picker. |

### ComparisonDrawer

| Field | Value |
|-------|-------|
| **Category** | Overlays |
| **Source Screens** | 12-Voice |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Sheet` (shadcn, bottom anchor) |
| **Props** | `personaA: Persona`, `personaB: Persona`, `open: boolean`, `onClose: handler` |
| **Variants** | 2 (bottom drawer on desktop, full-screen modal on mobile) |
| **Notes** | Contains overlaid radar charts and metric comparison table. Slides up from bottom. |

### ArticleDetailDrawer

| Field | Value |
|-------|-------|
| **Category** | Overlays |
| **Source Screens** | 14-Performance |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Sheet` (shadcn, side="right") |
| **Props** | `article: PredictionArticle`, `open: boolean`, `onClose: handler` |
| **Variants** | 1 |
| **Notes** | 480px wide, full-screen on mobile. Contains predicted vs actual chart, checkpoint timeline, anomaly flags, scoring weights. |

### RevisionComparisonModal

| Field | Value |
|-------|-------|
| **Category** | Overlays |
| **Source Screens** | 15-Quality |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Dialog` (shadcn) |
| **Props** | `revisionA: RevisionData`, `revisionB: RevisionData`, `open: boolean`, `onClose: handler` |
| **Variants** | 1 |
| **Notes** | Side-by-side signal bars and checklist diff (items that changed status highlighted in green). |

---

## 7. Action Components

### Button

| Field | Value |
|-------|-------|
| **Category** | Actions |
| **Source Screens** | All 15 screens |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Button` (shadcn) |
| **Props** | `variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'`, `size: 'default' | 'sm' | 'lg' | 'icon'`, `disabled?: boolean`, `loading?: boolean`, `onClick?: handler`, `asChild?: boolean` |
| **Variants** | 6 variants x 4 sizes = 24 combinations |
| **Notes** | Loading state shows spinner + text (e.g., "Saving...", "Logging in..."). Ghost variant for inline actions. Destructive for delete/revoke/disconnect. |

### ActionButtons

| Field | Value |
|-------|-------|
| **Category** | Actions |
| **Source Screens** | 09-Connections, 11-Opportunities, 13-Publish, 15-Quality |
| **Status** | Planned |
| **shadcn/ui Primitive** | Custom layout of `Button` components |
| **Props** | `actions: ActionItem[]`, `orientation?: 'horizontal' | 'vertical'` |
| **Variants** | 1 |
| **Notes** | Grouped action buttons (e.g., Refresh Token / Change Account / Disconnect, Accept / Dismiss / Expand, Re-Score / Export PDF / Request Revision). |

### DropdownMenu

| Field | Value |
|-------|-------|
| **Category** | Actions |
| **Source Screens** | 03-Pipeline, 05-Users, 12-Voice, 13-Publish, 14-Performance |
| **Status** | Planned |
| **shadcn/ui Primitive** | `DropdownMenu` + `DropdownMenuTrigger` + `DropdownMenuContent` + `DropdownMenuItem` (shadcn) |
| **Props** | `trigger: ReactNode`, `items: MenuItem[]`, `align?: 'start' | 'end'` |
| **Variants** | 2 (standard menu, with checkbox items for multi-select filters) |
| **Notes** | Used for row actions (view/edit/delete/archive), edit persona actions, export options, batch actions. Last item can be destructive (red). |

### BatchActionsDropdown

| Field | Value |
|-------|-------|
| **Category** | Actions |
| **Source Screens** | 10-Inventory, 11-Opportunities, 13-Publish |
| **Status** | Planned |
| **shadcn/ui Primitive** | `DropdownMenu` (shadcn) |
| **Props** | `selectedCount: number`, `actions: BatchAction[]`, `disabled?: boolean` |
| **Variants** | 1 |
| **Notes** | Disabled when 0 selected. Shows count when active. Sticky bottom bar variant in Inventory. |

### ExpandToggle

| Field | Value |
|-------|-------|
| **Category** | Actions |
| **Source Screens** | 11-Opportunities, 15-Quality |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Button` (ghost, icon-only) |
| **Props** | `expanded: boolean`, `onToggle: handler`, `ariaLabel?: string` |
| **Variants** | 1 |
| **Notes** | Chevron icon rotates 180deg when expanded. Used on opportunity cards and checklist categories. |

### FilterChips

| Field | Value |
|-------|-------|
| **Category** | Actions |
| **Source Screens** | 10-Inventory, 11-Opportunities, 14-Performance |
| **Status** | Planned |
| **shadcn/ui Primitive** | `Badge` (shadcn, outline variant) + close button |
| **Props** | `filters: ActiveFilter[]`, `onRemove: (filterKey: string) => void`, `onClearAll: handler` |
| **Variants** | 1 |
| **Notes** | Row of removable filter indicators. Each shows filter name:value and (x) to remove. "Clear all" link when 2+ active. |

### ToggleGroup

| Field | Value |
|-------|-------|
| **Category** | Actions |
| **Source Screens** | 08-Blueprints, 14-Performance |
| **Status** | Planned |
| **shadcn/ui Primitive** | `ToggleGroup` (shadcn) |
| **Props** | `options: ToggleOption[]`, `value: string`, `onValueChange: handler`, `type: 'single' | 'multiple'` |
| **Variants** | 1 |
| **Notes** | Used for category filter tabs in Blueprints and time range toggle (3M/6M/12M/All) in Performance. |

---

## Component Cross-Reference Matrix

Components appearing in 5+ screens (highest reuse priority):

| Component | Screen Count | Screens |
|-----------|-------------|---------|
| Button | 15 | All |
| Card | 14 | All except 01-Login (uses Card too but minimal) |
| Skeleton | 13 | All except 01-Login, 04-Detail |
| Badge | 13 | 02-15 |
| Sidebar | 14 | All authenticated |
| Input | 10 | 01, 03, 06, 07, 08, 09, 10, 11, 12, 14 |
| AlertBanner | 9 | 02, 03, 05, 06, 09, 10, 11, 14, 15 |
| Select | 9 | 03, 05, 06, 07, 09, 10, 11, 13, 14 |
| Toast | 8 | 03, 05, 06, 09, 10, 11, 13, 14 |
| Pagination | 7 | 03, 05, 08, 10, 11, 13, 14 |
| RelativeTimestamp | 8 | 02, 03, 09, 10, 11, 13, 14, 15 |
| DataTable | 6 | 02, 03, 04, 05, 10, 14 |
| Tabs | 6 | 04, 06, 08, 11, 13, 14 |
| Dialog | 7 | 03, 05, 11, 12, 13, 14, 15 |
| AlertDialog | 6 | 03, 05, 09, 12, 13, 15 |
| ProgressBar | 6 | 05, 07, 10, 12, 13, 15 |
| DropdownMenu | 5 | 03, 05, 12, 13, 14 |
| Checkbox | 5 | 03, 05, 10, 11, 13 |

---

## Build Priority Recommendation

**Phase 1 (Core Primitives):** Components appearing in 5+ screens
- Button, Card, Badge, Input, Select, Skeleton, AlertBanner, Toast, Pagination, Tabs, Dialog, AlertDialog, Checkbox, DropdownMenu, ProgressBar, RelativeTimestamp

**Phase 2 (Layout + Navigation):**
- Sidebar, PageHeader, Breadcrumb, Container, PipelineStepper

**Phase 3 (Data Visualization):**
- DataTable, KPICard, ScoreRing, StatusDot, TrendSparkline, SyncSparkline, HealthDistributionBar, HorizontalBarChart, AccuracyTrendChart, RadarChart, OverlaidRadarChart

**Phase 4 (Domain-Specific):**
- ApiKeyInput, PropertySelector, DateRangePicker, ValidationStatus, FilterChips, ActionButtons, BatchActionsDropdown, ExpandToggle
- ChecklistCategory, ChecklistItem, SuggestionItem, SignalBar, RevisionRow, OverallScoreGauge
- CrawlProgressOverlay, AnalysisRunningOverlay, ComparisonDrawer, ArticleDetailDrawer, RevisionComparisonModal

**Phase 5 (Screen-Specific):**
- StickyMiniHeader, CheckpointTimeline, CheckpointIcons, MetricComparisonCard, PushStatusToast, ScoringProgressBar, SeasonalityCurve, CannibalizationMapCard
