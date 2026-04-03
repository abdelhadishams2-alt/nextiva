# Component Audit -- ChainIQ's 7 New Screens

**Last Updated:** 2026-03-28
**Analyst:** ChainIQ Design Research
**Purpose:** Catalog all components needed for the 7 new screens, map reuse of existing shadcn/ui components, define custom component requirements, and document accessibility and RTL considerations.

---

## New Custom Components Required

### 1. ScoreRing

**Purpose:** Circular progress indicator for quality scores, health scores, recommendation confidence, and content grades. The most reused new component across the platform.

**Used by:** Quality Report, Opportunities, Content Inventory, Dashboard Home, Article Detail

**Specifications:**
- Sizes: `sm` (40px), `md` (64px), `lg` (96px)
- SVG-based circular arc with configurable progress (0-100)
- Color-coded fill: green (70-100), yellow (40-69), red (0-39) with configurable thresholds
- Center label: numeric score or letter grade
- Optional subtitle text below the ring (e.g., "Quality Score")
- Animated fill on mount (300ms ease-out)
- Accepts `aria-label` and `aria-valuenow`/`aria-valuemin`/`aria-valuemax` for screen readers

**Customization beyond shadcn:** Fully custom. shadcn Progress is a linear bar; ScoreRing is a circular SVG component with no shadcn equivalent. Will use Tailwind for color tokens but the SVG arc math is custom.

---

### 2. TimelineChart

**Purpose:** Time-series visualization for performance trends, click/impression history, ranking changes, and decay detection overlays.

**Used by:** Performance, Article Detail (performance tab), Dashboard Home (trend widgets), Content Inventory (aggregate trends)

**Specifications:**
- Built on top of shadcn Chart (recharts) with ChainIQ-specific defaults
- Line chart with area fill at 10% opacity
- Multi-series support (up to 5 overlaid lines)
- Comparison period overlay (current vs. previous period, dashed line for previous)
- Crosshair tooltip showing all values at hovered timestamp
- Responsive: stacks tooltip below chart on narrow viewports
- Time range selector: 7d, 30d, 90d, custom range
- Zoom/pan for custom date exploration
- Annotations: vertical markers for publish dates, update dates, algorithm changes

**Customization beyond shadcn:** Moderate. Uses shadcn Chart as the base but adds comparison period overlay, annotations layer, time range selector, and crosshair tooltip. These are recharts-compatible extensions, not replacements.

---

### 3. StatusDot

**Purpose:** Compact connection health indicator. Shows whether a data source integration is active, degraded, or failed.

**Used by:** Connections, Dashboard Home (connection summary), Settings

**Specifications:**
- Sizes: `sm` (6px), `md` (8px), `lg` (10px)
- States: `connected` (green #22C55E), `degraded` (yellow #EAB308), `error` (red #EF4444), `inactive` (gray #6B7280), `syncing` (blue #3B82F6 with pulse)
- Pulse animation for `syncing` state (CSS keyframe, respects `prefers-reduced-motion`)
- Tooltip on hover showing status detail (e.g., "Last sync: 2h ago" or "API key expired")
- Renders as a `<span>` with `role="status"` and `aria-label` describing the state

**Customization beyond shadcn:** Minimal component, fully custom. 20-30 lines of code. shadcn Badge could theoretically be restyled but a purpose-built dot is cleaner and more semantic.

---

### 4. HeatMap

**Purpose:** Grid visualization for persona priority matrices, keyword coverage density, content topic saturation, and temporal patterns.

**Used by:** Opportunities (keyword saturation), Voice Profiles (persona coverage), Performance (day-of-week/hour heatmap)

**Specifications:**
- Grid of cells with color intensity mapped to value (0-100 scale)
- Configurable color ramp (single-hue gradient, e.g., transparent-to-indigo)
- Row and column headers (text labels)
- Cell tooltip showing exact value and row/column context
- Responsive: horizontal scroll with sticky row headers on narrow viewports
- Minimum cell size: 32x32px for touch targets
- Keyboard navigable: arrow keys move between cells, Enter reads value

**Customization beyond shadcn:** Fully custom. No shadcn equivalent. Will use CSS grid for layout and Tailwind for color generation. SVG or canvas rendering for large grids (50+ cells).

---

### 5. RecommendationCard

**Purpose:** Scored content opportunity card displaying a topic recommendation with confidence score, estimated impact, effort indicator, and action buttons.

**Used by:** Opportunities, Dashboard Home (top recommendations widget)

**Specifications:**
- Card layout: topic title (h3), description snippet (2 lines max), keyword cluster tags
- Score section: ScoreRing (sm) showing recommendation confidence, plus numeric impact estimate
- Metadata row: search volume, keyword difficulty, seasonality indicator, content type tag
- Action buttons: "Create Article", "Dismiss", "Save for Later"
- Expandable detail: shows full keyword cluster, competitor analysis snippet, decay/opportunity reason
- Sortable/filterable within a grid or list view
- Drag-and-drop to reorder priority (optional, Phase 3)

**Customization beyond shadcn:** Built on shadcn Card but with significant custom layout. Embeds ScoreRing, Badge, and Button components. The expand/collapse pattern uses shadcn Collapsible.

---

### 6. PersonaCard

**Purpose:** Writer voice profile card showing detected writing style attributes, AI/human classification, and sample text excerpts.

**Used by:** Voice Profiles, Article Detail (voice assignment), Article generation settings

**Specifications:**
- Card layout: persona name (h3), avatar/icon, brief style description
- Attributes grid: tone (formal/casual), complexity (simple/technical), avg sentence length, vocabulary richness
- AI/Human indicator: percentage bar showing AI probability
- Sample excerpt: 2-3 line text sample in the detected voice style
- Status badge: Active/Inactive/Draft
- Action buttons: "Assign to Article", "Edit", "Clone", "Delete"
- Compact variant for inline selection (list item form, no excerpt)

**Customization beyond shadcn:** Built on shadcn Card with custom attribute grid layout. Uses Badge for status, Progress for AI/human bar, and Button for actions. The attribute grid is custom CSS grid.

---

### 7. PublishStatusBadge

**Purpose:** Rich status indicator for the content publishing pipeline, showing both the current state and the target destination.

**Used by:** Publish Manager, Articles list, Article Detail

**Specifications:**
- States: `draft`, `queued`, `publishing`, `published`, `failed`, `scheduled`, `unpublished`
- Each state has: color, icon, label text
- Destination suffix: "Published to WordPress", "Queued for Shopify", "Scheduled (Mar 30)"
- Compact variant: icon + color dot only (for table cells)
- Full variant: icon + label + destination (for detail views)
- Animated transition between states (color fade, 200ms)

**Customization beyond shadcn:** Extended shadcn Badge with icon support, state machine logic, and destination awareness. The core rendering is Badge; the state/icon mapping and destination logic are custom.

---

## Existing shadcn/ui Components to Reuse

| Component | Screens Using It | Customization Needed |
|-----------|-----------------|---------------------|
| **DataTable** | Inventory, Opportunities, Publish Manager, Articles, Users | Custom column definitions per screen. Add inline editing support. Add multi-view toggle (table/kanban/gallery). Sticky headers for long lists. |
| **Card** | Dashboard Home, Performance, all detail screens | Color token alignment to ChainIQ dark theme. Standardize padding/radius across all cards. Add hover interaction pattern. |
| **Dialog** | Connections (add/edit), Voice Profiles (edit), Publish Manager (confirm publish) | No structural changes needed. Ensure focus trap works for RTL. Add keyboard dismiss (Esc). |
| **Badge** | All screens (status indicators, tags, categories) | Extend color variants: add `decay`, `seasonal`, `ai-generated`, `human` states. Ensure color contrast passes WCAG AA on dark backgrounds. |
| **Tabs** | Article Detail, Voice Profiles, Settings, Performance | No structural changes. Ensure tab order respects RTL direction. Add keyboard arrow-key navigation between tabs. |
| **Chart** | Dashboard Home, Performance, Inventory, Opportunities | Apply ChainIQ color palette to chart series. Add comparison period support. Standardize tooltip format. Add time-range selector as a Chart wrapper. |
| **Progress** | Quality Report (sub-scores), Connections (sync progress) | Minimal. Align color tokens. Add label variant showing percentage text. |
| **Form** | Connections (API key input), Settings, Voice Profiles (edit) | No structural changes. Add RTL text-direction support for Arabic input fields. Ensure validation messages appear correctly in RTL. |
| **Skeleton** | All screens (loading states) | Standardize skeleton patterns per component type (card skeleton, table skeleton, chart skeleton). |
| **Toast** | All screens (success/error notifications) | Position: bottom-right for LTR, bottom-left for RTL. Standardize duration (3s info, 5s error). |
| **Collapsible** | RecommendationCard expand, Settings sections | No changes needed. |
| **Tooltip** | StatusDot hover, ScoreRing hover, table cell overflow | Ensure tooltip positioning adapts to RTL. Test with Arabic text content. |

---

## Component Customization Plan

### Theme Layer (All Components)

All shadcn components need CSS variable overrides to match ChainIQ's dark-mode palette:

```
--background: 0 0% 4%        (dark base)
--foreground: 0 0% 93%       (light text)
--card: 0 0% 7%              (card surface)
--primary: 38 76% 65%        (gold accent)
--secondary: 217 91% 60%     (blue interactive)
--muted: 0 0% 15%            (muted surface)
--accent: 38 76% 65%         (matches primary)
--destructive: 0 84% 60%     (red errors)
--border: 0 0% 15%           (subtle borders)
--ring: 217 91% 60%          (focus ring blue)
```

### Interaction Layer

- Hover states: Background lightens by 4% (`hover:bg-white/4`) rather than darken (inverted for dark mode)
- Focus states: 2px ring in `--ring` color with 2px offset for keyboard visibility
- Active states: Background lightens by 8% with 100ms transition
- Disabled states: 40% opacity, no pointer events

### Animation Defaults

- Transitions: 150ms for color/opacity, 200ms for transforms, 300ms for layout shifts
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (Tailwind default) for most transitions
- Respect `prefers-reduced-motion: reduce` -- disable all non-essential animations
- ScoreRing fill animation: 300ms ease-out on mount
- StatusDot pulse: 2s infinite (disabled when reduced motion)

---

## Accessibility Requirements (WCAG 2.1 AA)

### Global Requirements

- **Color contrast:** All text must meet 4.5:1 contrast ratio against backgrounds. Large text (18px+ or 14px bold) must meet 3:1. All ScoreRing colors tested against `--bg-secondary`.
- **Keyboard navigation:** Every interactive element reachable via Tab. Custom components implement arrow-key navigation where appropriate (HeatMap cells, Tab panels).
- **Focus indicators:** Visible 2px focus ring on all interactive elements. Never `outline: none` without a visible alternative.
- **Screen reader support:** All custom components include appropriate ARIA roles, labels, and live regions.
- **Reduced motion:** All animations gated behind `prefers-reduced-motion` media query.
- **Touch targets:** Minimum 44x44px for all interactive elements (WCAG 2.5.8).

### Per-Component Accessibility

| Component | ARIA Role | Key Attributes | Keyboard Pattern |
|-----------|-----------|----------------|-----------------|
| ScoreRing | `progressbar` | `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label` | Not interactive (display only) |
| TimelineChart | `img` | `aria-label` with summary, `aria-describedby` linking to data table | Provide accessible data table alternative |
| StatusDot | `status` | `aria-label` with full status text | Not interactive (display only, tooltip on parent) |
| HeatMap | `grid` | `aria-rowcount`, `aria-colcount`, cells have `aria-label` | Arrow keys between cells, Enter to read value |
| RecommendationCard | `article` | `aria-label` with topic title | Tab to action buttons, Enter to expand |
| PersonaCard | `article` | `aria-label` with persona name | Tab to action buttons |
| PublishStatusBadge | `status` | `aria-label` with full status text | Not interactive (display only) |

### Data Visualization Accessibility

- Every chart must have an accessible alternative: a visually hidden data table or a text summary
- TimelineChart: provide `<table>` fallback with `sr-only` class, listing date and value pairs
- HeatMap: keyboard-navigable grid with cell values announced on focus
- Chart tooltips: announced via `aria-live="polite"` region when crosshair moves

---

## RTL Considerations for Arabic Dashboard Users

### Layout Mirroring

- **Sidebar:** Moves from left to right. All expand/collapse chevrons mirror. Section order remains top-to-bottom.
- **DataTable:** Column order reverses (rightmost column becomes leftmost). Sort arrows mirror. Pagination controls mirror.
- **Cards:** Content alignment flips. Icons that indicate direction (arrows, chevrons) must mirror.
- **Navigation breadcrumbs:** Reading order reverses. Separator chevrons flip direction.

### Typography for Arabic

- **Primary font:** Cairo (Google Fonts) for Arabic text, falling back to Geist Sans for Latin characters
- **Secondary option:** Tajawal for a more modern feel, or IBM Plex Arabic for monospace-adjacent readability
- **Font sizing:** Arabic text typically needs 1-2px larger base size than Latin equivalents for comparable readability. Set Arabic base to 15-16px when Latin is 14px.
- **Line height:** Arabic script benefits from slightly taller line height (1.7-1.8 vs 1.5-1.6 for Latin)
- **Letter spacing:** Remove all negative letter-spacing for Arabic text (Arabic kerning is handled by the font)

### Bidirectional Text Handling

- **Mixed content:** Articles often contain both Arabic and English text (brand names, technical terms). Use `dir="auto"` on content blocks to let the browser detect direction per paragraph.
- **Numbers:** Arabic numerals (0-9) are used in Arabic content (not Eastern Arabic numerals) in most MENA business contexts. Confirm with SRMG whether to use `0-9` or `٠-٩`.
- **Form inputs:** Text inputs for Arabic content must set `dir="rtl"`. URL/email inputs remain `dir="ltr"`.
- **Tables with mixed data:** Column headers in Arabic, but data may be English (URLs, keywords). Each cell inherits direction from its content.

### Component-Specific RTL Adaptations

| Component | RTL Change |
|-----------|-----------|
| ScoreRing | No change (circular, direction-neutral) |
| TimelineChart | X-axis label alignment flips. Tooltip anchors to right side. |
| StatusDot | No change (circular, direction-neutral) |
| HeatMap | Row headers move to right. Column reading order reverses. Arrow key navigation mirrors. |
| RecommendationCard | Text alignment right. Action buttons align left. Tags flow right-to-left. |
| PersonaCard | Avatar/icon moves to right. Text aligns right. Buttons align left. |
| PublishStatusBadge | Icon position moves to right of label text. |
| DataTable | Full column mirror. Sort icons flip. Pagination flips. |
| Sidebar | Entire sidebar anchors to right edge. |
| Command Palette | Text input aligns right. Result list right-aligned. Shortcut hints (Cmd+K) remain LTR. |

### CSS Strategy

Use CSS logical properties throughout:
- `margin-inline-start` instead of `margin-left`
- `padding-inline-end` instead of `padding-right`
- `inset-inline-start` instead of `left`
- `border-start-start-radius` instead of `border-top-left-radius`

Set `dir="rtl"` on the `<html>` element for Arabic users. Tailwind CSS v4 supports `rtl:` and `ltr:` variants for edge cases where logical properties are insufficient.

---

## Component Inventory Summary

| Category | Count | Source |
|----------|-------|--------|
| New custom components | 7 | ScoreRing, TimelineChart, StatusDot, HeatMap, RecommendationCard, PersonaCard, PublishStatusBadge |
| Reused shadcn components | 12 | DataTable, Card, Dialog, Badge, Tabs, Chart, Progress, Form, Skeleton, Toast, Collapsible, Tooltip |
| Components needing RTL adaptation | 10 | DataTable, Sidebar, CommandPalette, HeatMap, RecommendationCard, PersonaCard, PublishStatusBadge, Breadcrumb, Toast, TimelineChart |
| Total estimated component development | ~8-10 days | Including accessibility testing and RTL variants |
