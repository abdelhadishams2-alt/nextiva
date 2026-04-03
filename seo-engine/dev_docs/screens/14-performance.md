# Screen Spec: Performance

> **Route:** `/performance`
> **Service:** Feedback Loop Service (Service #12, Layer 6)
> **Task:** T2-14
> **Type:** Dashboard + Charts (summary cards, timeline chart, data table)
> **Priority:** P2
> **Depth Target:** >= 8/10

---

## 1. Overview

The Performance screen is ChainIQ's closed-loop intelligence dashboard. It answers the question no competitor can: "Were our content recommendations actually correct?" Every content intelligence tool on the market stops at "generate and publish." BrightEdge makes traffic forecasts but never checks if they were right. MarketMuse tracks content scores but never feeds accuracy data back into its recommendation model. ChainIQ is the only platform that completes the cycle: predict, measure, compare, display accuracy, and recalibrate.

This screen surfaces data from the Feedback Loop Service's three-checkpoint measurement system. When an article is published, the system captures a prediction snapshot (expected clicks, impressions, SERP position at 30/60/90 days). At each checkpoint, it pulls actual performance from Google Search Console and Google Analytics 4, computes a composite accuracy score (0-100), and displays the predicted-vs-actual comparison. Over time, the aggregate accuracy tells the user whether ChainIQ's recommendations are getting smarter -- and the per-signal breakdown tells them which recommendation types (gap, decay, seasonal, trending) perform best for their specific domain.

**The compounding moat:** After 90 days and 20+ published articles, the system has enough data to run its first recalibration -- adjusting scoring weights based on which prediction signals were systematically over- or under-predicting. The Performance screen visualizes this improvement: "Your prediction accuracy improved from 68% to 79% after last quarter's recalibration." This is the data-backed ROI proof that agency clients need for retention meetings and that content strategists need for budget justification.

**Primary user personas and their goals on this screen:**

- **Marcus (Agency Admin):** Opens Performance for each client during monthly reporting. Needs total organic clicks, prediction accuracy percentage, top performers, underperformers with root cause analysis, and estimated traffic value. Uses these data points in client retention meetings. When accuracy drops below 70%, he flags the account for recalibration review.

- **Lina (Content Strategist at SRMG):** Checks Performance weekly. Sorts articles by accuracy score to understand which recommendation types produce the best results. She discovered that gap-based recommendations consistently outperform decay-based recommendations for her domain. This strategic insight, surfaced by per-signal accuracy data, changed her content calendar.

- **CEO / Revenue Stakeholder:** Reviews quarterly portfolio view. Needs total organic clicks across all published articles, estimated traffic value at average CPC, cost of generation (subscription + time), and net ROI. The Performance screen is the only data-backed answer to "Is our content investment paying off?"

---

## 2. Screen Type

Dashboard with summary cards (top), aggregate timeline chart (middle), and performance DataTable (bottom). Optional per-article detail panel opens as a slide-over from the right.

---

## 3. ASCII Wireframe

```
┌─────┬───────────────────────────────────────────────────────────────┐
│     │  Performance                    [Last 90 Days ▾] [Platform ▾] │
│  S  │───────────────────────────────────────────────────────────────│
│  I  │                                                               │
│  D  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────┐│
│  E  │  │ Total        │ │ Avg Accuracy │ │ Total Clicks │ │ Avg  ││
│  B  │  │ Published    │ │              │ │ (90 days)    │ │ CTR  ││
│  A  │  │              │ │              │ │              │ │      ││
│  R  │  │    47        │ │   78.4%      │ │  12,840      │ │ 3.2% ││
│     │  │ +8 this month│ │ ↑ from 72.1% │ │ ↑ 14% vs last│ │      ││
│     │  └──────────────┘ └──────────────┘ └──────────────┘ └──────┘│
│     │                                                               │
│     │  Aggregate Performance                                        │
│     │  ┌───────────────────────────────────────────────────────┐   │
│     │  │  Clicks ─── Predicted ─── Actual                      │   │
│     │  │     ╱─╲                                               │   │
│     │  │   ╱    ╲    ╱──╲                                      │   │
│     │  │  ╱      ╲──╱    ╲───────                              │   │
│     │  │ ╱                        ╲───                         │   │
│     │  │╱                                                      │   │
│     │  │  Jan    Feb    Mar    Apr    May    Jun                │   │
│     │  └───────────────────────────────────────────────────────┘   │
│     │                                                               │
│     │  Article Performance          [Search...    ] [Status ▾]     │
│     │  ────────────────────────────────────────────────────────── │
│     │  Title           Published  Pred.Clicks  Actual   Acc%  Stat │
│     │  ──────────────────────────────────────────────────────────  │
│     │  N54 HPFP Guide  Mar 15     420          387     90.0  ●On  │
│     │  Running Shoes   Feb 28     280          310     87.5  ▲Out │
│     │  Cloud Migration Feb 10     350          190     54.3  ▼Und │
│     │  React Patterns  Jan 25     150          —       —     ◷Wait│
│     │  Arabic SEO      Jan 10     200          212     94.0  ●On  │
│     │                                                               │
│     │  Showing 1-5 of 47          [← 1 2 3 ... 10 →]              │
└─────┴───────────────────────────────────────────────────────────────┘
```

---

## 4. Data Fields

### Summary Cards

| Card | Value | Source | Subtitle | Trend |
|------|-------|--------|----------|-------|
| Total Published | integer | COUNT from `performance_predictions` WHERE `check_status != 'article_removed'` | "+{N} this month" | vs previous period |
| Avg Accuracy | percentage | AVG of `accuracy_score_90d` (or latest available checkpoint) WHERE `accuracy_confidence != 'low'` | "up/down from {previous}%" | vs previous period |
| Total Clicks | integer | SUM of `actual_clicks_90d` (or latest checkpoint) across all articles in date range | "{+/-N}% vs last period" | vs previous period |
| Avg CTR | percentage | AVG of `actual_ctr_30d` across articles with data | -- | -- |

### Timeline Chart Fields

| Series | Type | Source | Color |
|--------|------|--------|-------|
| Predicted Clicks (aggregate) | line, dashed | SUM of `predicted_clicks_30d` per week, cumulative | blue-400 |
| Actual Clicks (aggregate) | line, solid | SUM of `actual_clicks_30d` per week, cumulative | green-400 |
| Predicted Impressions | line, dashed (toggle) | SUM of `predicted_impressions_30d` per week | blue-200 |
| Actual Impressions | line, solid (toggle) | SUM of `actual_impressions_30d` per week | green-200 |

### DataTable Fields

| Field | Type | Source | Sortable | Filterable |
|-------|------|--------|----------|------------|
| Title | text | `articles.title` via `performance_predictions.article_id` | Yes | Search |
| Published Date | date | `performance_predictions.published_at` | Yes (default desc) | Date range |
| Predicted Clicks 30d | integer | `performance_predictions.predicted_clicks_30d` | Yes | No |
| Actual Clicks 30d | integer | `performance_predictions.actual_clicks_30d` | Yes | No |
| Accuracy % | numeric | latest accuracy_score (30d/60d/90d, whichever is most recent) | Yes | Range |
| Accuracy Confidence | enum | `performance_predictions.accuracy_confidence` | No | Dropdown |
| Check Status | enum | `performance_predictions.check_status` | Yes | Dropdown |
| Status Badge | derived | computed from accuracy and check_status (see 4.1) | Yes | Dropdown |
| Opportunity Type | enum | `performance_predictions.opportunity_type` | No | Dropdown |
| Platform | text | derived from `publish_records` | No | Dropdown |

### 4.1 Status Badge Derivation

| Badge | Label | Condition | Color |
|-------|-------|-----------|-------|
| on-track | "On Track" | accuracy >= 75% at latest checkpoint | green |
| outperforming | "Outperforming" | actual_clicks > predicted_clicks by >= 15% | blue |
| underperforming | "Underperforming" | accuracy < 60% at latest checkpoint | red |
| waiting | "Waiting" | check_status = `pending_30d` (no data yet) | gray |
| collecting | "Collecting" | check_status = `checked_30d` or `pending_60d` (partial data) | yellow |
| low-confidence | "Low Confidence" | accuracy_confidence = `low` (impressions < 500) | muted gray |
| measurement-failed | "Measurement Failed" | check_status = `measurement_failed` | red outline |
| removed | "Removed" | check_status = `article_removed` | strikethrough gray |

---

## 5. Component Inventory

| Component | Source | Props / Config | Notes |
|-----------|--------|----------------|-------|
| Card | shadcn/ui | variant: "outline" | 4 summary cards at top. Each shows value, subtitle, trend arrow |
| TimelineChart | Custom (recharts) | responsive, tooltips, toggle series | Aggregate predicted vs actual over time. Dual Y-axis for clicks + impressions |
| DataTable | shadcn/ui | sortable, pagination, row selection | Article performance table. Server-side pagination, 20 rows default |
| Badge | shadcn/ui | variant by status | Status badges: on-track, outperforming, underperforming, waiting, collecting |
| Select | shadcn/ui | -- | Date range filter, platform filter, status filter, opportunity type filter |
| Input | shadcn/ui | -- | Search field (debounce 300ms) |
| Sheet | shadcn/ui | side: "right", width: "520px" | Per-article performance detail slide-over |
| Skeleton | shadcn/ui | -- | Card loading, chart loading, table row loading |
| Tooltip | shadcn/ui | -- | Chart data point tooltips, accuracy calculation explanation |
| Alert | shadcn/ui | variant: "info", "warning" | Insufficient data warnings, low confidence warnings |
| Progress | shadcn/ui | -- | Accuracy bar visualization in detail panel |
| Tabs | shadcn/ui | -- | Detail slide-over tabs: Overview, Checkpoints, Signals |
| Toast | shadcn/ui | -- | Export complete notification |
| Button | shadcn/ui | variant: "outline" | "Export CSV", date range presets |
| DropdownMenu | shadcn/ui | -- | Date range presets: Last 30d, 60d, 90d, 6 months, 1 year, Custom |
| Pagination | shadcn/ui | -- | DataTable pagination |

---

## 6. States (9 total)

### 6.1 Loading State

```
4 summary cards show skeleton rectangles for values.
TimelineChart area shows skeleton with pulsing animation (chart-shaped).
DataTable shows 5 skeleton rows.
Filters visible but disabled.
```

### 6.2 Empty State -- No Published Articles

```
Summary cards show zero/dash values:
  Total Published: 0  |  Avg Accuracy: --  |  Total Clicks: --  |  Avg CTR: --

Chart area replaced by centered empty state:
  "No Published Articles Tracked Yet"
  "Performance data appears automatically after you publish articles
   through the Publish Manager. ChainIQ tracks clicks, impressions,
   and SERP position at 30, 60, and 90 days post-publication."
  [Go to Publish Manager] button

DataTable hidden.
```

### 6.3 Insufficient Data (<30 days)

```
Summary cards show partial data (Total Published: 5, others show "--").
Chart shows "Collecting data..." with a timeline:
  ┌───────────────────────────────────────────────────────┐
  │  Collecting Performance Data                           │
  │                                                        │
  │  ████████░░░░░░░░░░░░░░░░░░░░  Day 12 of 30          │
  │                                                        │
  │  5 articles published · First 30-day checkpoint on     │
  │  Apr 15, 2026                                          │
  │                                                        │
  │  Performance charts will populate after the first      │
  │  checkpoint measurement completes.                     │
  └───────────────────────────────────────────────────────┘

DataTable shows articles with "Waiting" status badges.
Accuracy columns show "--" (no data yet).
```

### 6.4 Populated State -- Full Dashboard

```
Summary cards with real numbers, trend arrows, period comparison.
TimelineChart rendering predicted vs actual lines over selected date range.
Chart interactive: hover shows tooltip with exact values per data point.
Toggle buttons above chart: [Clicks] [Impressions] (switch chart data).
DataTable fully populated with sortable columns, status badges, action buttons.
```

### 6.5 Detail-Open State -- Per-Article Performance

```
Right slide-over (520px) opens when clicking an article row.
Header: Article title + Published date + Status badge

3 tabs: Overview | Checkpoints | Signals

Overview tab:
  Predicted vs Actual comparison card:
    ┌─────────────────────────────────────────────┐
    │  Metric        Predicted   Actual    Delta   │
    │  Clicks 30d    420         387       -33 ↓   │
    │  Impressions   8,500       9,100     +600 ↑  │
    │  Avg Position  12.5        14.2      -1.7 ↓  │
    │  CTR           4.9%        4.3%      -0.6 ↓  │
    └─────────────────────────────────────────────┘

  Accuracy breakdown:
    Clicks accuracy:      92.1% (weight 40%) ████████████████████░░
    Impressions accuracy: 92.9% (weight 35%) ████████████████████░░
    Position accuracy:    86.4% (weight 25%) █████████████████░░░░░
    Composite:            90.0%

  Mini timeline chart: this article's clicks over time (actual data points)

Checkpoints tab:
  3 checkpoint rows:
    30-day: ✓ Measured on Apr 17   Accuracy: 90.0%   [View GSC Data]
    60-day: ○ Scheduled May 17     --
    90-day: ○ Scheduled Jun 16     --

  Each completed checkpoint expandable to show raw GSC/GA4 data:
    GSC: 387 clicks, 9,100 impressions, avg position 14.2, CTR 4.3%
    GA4: 412 sessions, 68% engagement rate

Signals tab:
  Prediction context at generation time:
    Recommendation type: gap
    Keyword difficulty: 28
    Search volume: 4,400
    Competition: 2 competitors avg position 4.0
    Quality Gate score: 8.4
    Voice persona: "The Technical Explainer"
    Scoring weights used: (table of weight values)

  Anomaly flags (if any):
    - "low_confidence" (impressions < 500 in measurement window)
    - "seasonal_content" (peak months: Oct-Dec)
```

### 6.6 Date-Filtered State

```
User selects custom date range from dropdown (e.g., "Last 30 days").
Summary cards recalculate for selected period.
TimelineChart X-axis adjusts to show selected range.
DataTable filters to articles published within range.
Trend comparisons update: "vs previous 30 days" in card subtitles.

Date range presets: Last 30 Days, Last 60 Days, Last 90 Days,
  Last 6 Months, Last Year, Custom (date picker).
```

### 6.7 Platform-Filtered State

```
User selects platform from dropdown (e.g., "WordPress - Main Blog").
All data filters to articles published to that specific platform connection.
Summary cards recalculate. Chart filters. Table filters.
Useful for Marcus managing 12 client WordPress sites -- view per-client.
```

### 6.8 Error State

```
Alert (destructive) replaces chart:
  "Unable to load performance data. Please ensure the bridge server
   is running and your Google Search Console connection is active."
  [Retry] button centered below.

If GSC connection is the issue, link to Connections screen:
  [Check GSC Connection]
```

### 6.9 Low Confidence Warning State

```
When > 50% of articles in the view have accuracy_confidence = "low":
  Alert banner (warning) above chart:
    "Low confidence data: {N} of {total} articles have fewer than 500
     impressions in their measurement window. Accuracy scores for
     low-volume keywords may not be statistically meaningful.
     Low-confidence articles are weighted at 50% in aggregate calculations."
```

---

## 7. Interactions

| # | Trigger | Action | Feedback | API Call |
|---|---------|--------|----------|----------|
| 1 | Page load | Fetch summary stats, chart data, first page of articles | Skeleton loading -> populated | GET `/api/performance/summary?range=90d`, GET `/api/performance/chart?range=90d`, GET `/api/performance/articles?page=1&limit=20` |
| 2 | Change date range | Recalculate all sections for new range | Cards, chart, table update with loading indicators per section | Same endpoints with updated `range` param |
| 3 | Change platform filter | Filter all data to selected platform | Same as date range -- all sections update | Same endpoints with `platform_connection_id` param |
| 4 | Click article row | Open per-article detail slide-over | Slide-over opens from right (300ms) with Overview tab | GET `/api/performance/articles/:predictionId` |
| 5 | Hover chart data point | Show tooltip with exact values | Tooltip: "Week of Mar 15: Predicted 1,240 clicks, Actual 1,180 clicks" | None (client-side) |
| 6 | Toggle Clicks/Impressions | Switch chart between clicks and impressions series | Chart re-renders with new Y-axis. Toggle button highlights active | None (client-side, data already loaded) |
| 7 | Search articles | Debounced (300ms) filter on article title | Table updates with matching results | GET `/api/performance/articles?search=...` |
| 8 | Filter by status | Select status badge from dropdown | Table filters to matching articles | Client-side filter (or server-side for large datasets) |
| 9 | Filter by opportunity type | Select type (gap, decay, trending, etc.) | Table filters. Summary cards update to show type-specific accuracy | GET endpoints with `opportunity_type` param |
| 10 | Sort table column | Click column header to toggle asc/desc | Sort indicator appears. Table reorders | Client-side sort for loaded page; re-fetch for server-side |
| 11 | Click "View GSC Data" in checkpoint detail | Expand to show raw GSC and GA4 measurements | Accordion expands with raw data table | None (data in prediction record) |
| 12 | Click "Export CSV" | Generate CSV of current filtered view | Toast: "Exporting..." then browser download | Client-side CSV generation from loaded data |
| 13 | Click "Go to Publish Manager" (empty state) | Navigate to `/publish` | Standard client-side navigation | None |
| 14 | Click article title in table | Navigate to `/articles/[id]` (Article Detail) | Standard navigation | None |
| 15 | Click anomaly flag badge | Tooltip explaining what the flag means and its impact on accuracy calculation | Tooltip: "low_confidence: Impressions below 500. This article is weighted at 50% in aggregate accuracy." | None |

---

## 8. API Integration

### Endpoints Used

| Method | Path | Purpose | Cache |
|--------|------|---------|-------|
| GET | `/api/performance/summary` | Summary card values (total published, avg accuracy, total clicks, avg CTR) | 5min SWR |
| GET | `/api/performance/chart` | Aggregated time-series data for timeline chart | 5min SWR |
| GET | `/api/performance/articles` | Paginated article performance list with predictions and actuals | 60s SWR |
| GET | `/api/performance/articles/:predictionId` | Full prediction record with all checkpoints, raw data, anomaly flags | 60s SWR |

### Query Parameters (shared across endpoints)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `range` | enum | `90d` | Date range: `30d`, `60d`, `90d`, `6m`, `1y`, `custom` |
| `start_date` | ISO date | -- | Required if range=custom |
| `end_date` | ISO date | -- | Required if range=custom |
| `platform_connection_id` | UUID | all | Filter by publishing platform |
| `opportunity_type` | enum | all | Filter by recommendation type |
| `status` | enum | all | Filter by status badge |
| `search` | string | -- | Full-text search on article title |
| `page` | integer | 1 | Pagination page |
| `limit` | integer | 20 | Items per page |
| `sort` | string | `published_at:desc` | Sort field and direction |

### Data Fetching Strategy

```typescript
// Server component: initial load with defaults (90d range, all platforms)
async function PerformancePage() {
  const [summary, chart, articles] = await Promise.all([
    fetchPerformanceSummary({ range: '90d' }),
    fetchPerformanceChart({ range: '90d' }),
    fetchPerformanceArticles({ range: '90d', page: 1, limit: 20 }),
  ]);
  return (
    <PerformanceClient
      initialSummary={summary}
      initialChart={chart}
      initialArticles={articles}
    />
  );
}

// Client component handles:
// - Date range changes (re-fetch all 3 endpoints)
// - Platform filter changes (re-fetch all 3)
// - Table pagination (re-fetch articles only)
// - Article detail (fetch single prediction on click)
// SWR for background revalidation, 5min for summary/chart, 60s for articles
```

---

## 9. Mobile Behavior

| Breakpoint | Layout Change |
|------------|---------------|
| >= 1024px | 4 summary cards in row. Full-width chart. DataTable with all columns. Slide-over 520px |
| 768-1023px | 4 summary cards in 2x2 grid. Chart full-width. Table hides Opportunity Type and Platform columns |
| < 768px | Summary cards stack vertically (1 column, compact). Chart full-width with touch-scroll for X-axis. Table converts to card layout: title, accuracy %, status badge, published date per card. Slide-over becomes full-screen sheet. Date range selector in bottom sheet |

**Touch interactions:** Chart supports touch-drag for date range selection on mobile. Pinch-to-zoom disabled (confusing on time series). Swipe on chart scrolls the X-axis when date range exceeds viewport width.

---

## 10. Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | Tab through summary cards (read-only), skip to chart (focusable container with aria-label), then into DataTable. Arrow keys navigate chart data points when focused |
| Screen reader | Summary cards: `role="status"` with `aria-label="Total Published: 47, up 8 this month"`. Chart: `role="img"` with `aria-label` describing overall trend. DataTable: standard table semantics with sortable headers |
| Chart alternatives | Below chart: hidden `aria-describedby` paragraph summarizing trend: "Over the last 90 days, actual clicks tracked 8% below predictions on average, with a peak in March." Toggle-able data table view as alternative to visual chart |
| Color independence | Status badges use icon + text + color. On-track = green + circle icon + "On Track". Underperforming = red + down arrow + "Underperforming". Chart lines differ by dash pattern (solid vs dashed) in addition to color |
| Focus management | Slide-over traps focus. Escape closes. Return focus to triggering row |
| Reduced motion | Chart animations disabled under `prefers-reduced-motion`. Instant render |
| RTL support | Chart X-axis reverses for RTL. Summary cards reorder. Table text alignment flips |

---

## 11. Edge Cases

| # | Scenario | Handling |
|---|----------|----------|
| 1 | Accuracy misleading on low-volume keywords | Articles with actual impressions < 500 flagged as `low_confidence`. Weighted at 50% in aggregate accuracy. Badge shows "Low Confidence" with tooltip explaining why. Aggregate accuracy card shows "(excluding low-confidence)" when toggled |
| 2 | No GSC connection | Chart empty state: "Connect Google Search Console to track article performance." Link to Connections screen. Summary cards show "GSC Required" instead of values |
| 3 | GSC data delayed (48-72 hours) | Checkpoints include 3-day buffer. If data still unavailable at buffer, checkpoint retries daily for 7 days. Detail panel shows: "Measurement pending. GSC data typically available within 48-72 hours." |
| 4 | Article URL changes (301 redirect) | System detects redirect via `original_url` vs `article_url` comparison. Anomaly flag: "url_changed". Detail panel: "URL redirect detected. Measurements adjusted to new URL." |
| 5 | Prediction accuracy = 0% (completely wrong) | Underperforming badge. Detail panel highlights which prediction signals were most wrong. Root cause section: "Gap analysis overestimated search volume" or "Keyword difficulty higher than projected" |
| 6 | Article removed from CMS | check_status transitions to `article_removed`. Row shows strikethrough styling and "Removed" badge. Included in historical data but excluded from active accuracy calculations |
| 7 | Hundreds of articles (heavy page) | Server-side pagination (20 per page). Chart aggregates server-side. Summary calculations are pre-computed and cached (5min). No client-side aggregation of full dataset |
| 8 | Two articles target same keyword | Each has its own prediction record. Both tracked independently. Detail panel notes: "Another article targets this keyword: {title}" |
| 9 | Arabic article performance | RTL article URL tracked correctly. GSC returns Arabic query data. Keyword displayed in Arabic script. All metrics computed identically regardless of language |
| 10 | Seasonal content showing temporary spike | Anomaly flag: "seasonal_content". Accuracy calculation uses 90-day window to smooth seasonality. Detail panel shows: "This keyword has seasonal peaks in {months}" |

---

## 12. Frustration Mitigation

| Frustration | Root Cause | Solution |
|-------------|------------|----------|
| Accuracy metric misleading on low-volume keywords | Predicting 50 clicks and getting 48 looks like 96% accuracy but is statistical noise | `accuracy_confidence` field. Articles with impressions < 500 flagged as "low_confidence" with visible badge. Weighted at 50% in aggregate calculations. User can toggle aggregate to "exclude low-confidence" for cleaner numbers |
| No clear ROI visualization | Users can see performance numbers but cannot translate them to business value | Phase 2 planned: ROI card showing estimated traffic value (clicks x avg CPC for targeted keywords), cost of subscription, and net ROI. For now, Total Clicks card provides the core metric for ROI calculation |
| Can't compare two time periods | Users want "this quarter vs last quarter" to show improvement | Date range dropdown includes "Custom" with dual date pickers. Summary card subtitles show trend vs previous equivalent period: "up from 72.1%" or "+14% vs last period". Phase 2: side-by-side period comparison view |
| Predictions shown before enough data collected | New users see prediction numbers but no actuals, creating anxiety about accuracy | "Waiting" status badge with clear explanation. Insufficient data state shows timeline: "Day 12 of 30. First checkpoint on Apr 15." No accuracy scores shown until first checkpoint completes. No aggregate accuracy calculated with fewer than 5 articles with data |

---

## 13. Real-Time & Polling Behavior

| Scenario | Strategy | Interval | Termination |
|----------|----------|----------|-------------|
| Dashboard idle | SWR background revalidation on summary and chart | 5 minutes | Continuous while page visible |
| Article list | SWR background revalidation | 60 seconds | Continuous while page visible |
| Checkpoint just completed | Normal SWR cycle picks up new data within 5 minutes | -- | One-time data appearance |
| Tab hidden | Pause all SWR revalidation | -- | Resume on `visibilitychange` |
| Detail slide-over open | One-time fetch on open. No polling | -- | Data is point-in-time |

Performance data changes slowly (checkpoints at 30/60/90 days), so aggressive polling is unnecessary. SWR revalidation at 5-minute intervals is sufficient.

---

## 14. Dependencies

| Dependency | Type | Impact |
|------------|------|--------|
| Feedback Loop Service (Service #12) | Backend | All prediction data, checkpoint measurements, accuracy calculations |
| Publishing Service (Service #11) | Data | publish_records.published_at anchors checkpoint scheduling. Platform info for filtering |
| Google Search Console (via Data Ingestion) | External | Actual clicks, impressions, position, CTR data at each checkpoint |
| Google Analytics 4 (via Data Ingestion) | External | Sessions, engagement rate data (supplementary, not required) |
| Auth & Bridge Server | Backend | JWT validation, user context for RLS |
| Article Pipeline (Screen 3) | Navigation | Article title links navigate to Article Detail |
| Quality Gate Service | Data | quality_gate_score shown in prediction context (Signals tab) |
| Voice Intelligence Service | Data | voice_persona_id shown in prediction context (Signals tab) |
| Supabase | Infrastructure | performance_predictions table + RLS |

**Blocks:** Client-facing performance reports (future PDF/HTML export)
**Blocked by:** Feedback Loop Service API endpoints, GSC connection, Publishing (articles must be published to track)

---

## 15. Testing Scenarios

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| 1 | Empty state -- no published articles | New user navigates to `/performance` | Summary cards show 0/--. Chart replaced by "No Published Articles Tracked Yet" message. "Go to Publish Manager" CTA |
| 2 | Insufficient data (< 30 days) | User published 5 articles 12 days ago | Summary shows partial data. Chart shows "Collecting data..." with day counter and progress bar. Table shows articles with "Waiting" badges |
| 3 | Full dashboard | User with 47 published articles and 30+ with checkpoints | All 4 summary cards populated with real numbers and trends. TimelineChart shows predicted vs actual lines. DataTable populated with sortable columns and status badges |
| 4 | Per-article detail | Click article row in table | Slide-over opens with Overview tab. Predicted vs Actual table, accuracy breakdown with weighted bars, mini timeline chart. Checkpoints and Signals tabs accessible |
| 5 | Date range change | Select "Last 30 Days" from dropdown | All sections recalculate. Cards show 30-day values. Chart X-axis adjusts. Table filters to articles published in last 30 days |
| 6 | Platform filter | Select "WordPress - Main Blog" | All data filters to that platform. Summary recalculates. Chart shows only those articles' data. Table filters |
| 7 | Low confidence warning | View with 60% of articles having < 500 impressions | Warning banner appears above chart. Low-confidence articles show "Low Confidence" badge. Aggregate accuracy shows "(excluding low-confidence)" toggle |
| 8 | Status filter | Filter to "Underperforming" only | Table shows only articles with accuracy < 60%. Chart not affected (shows all). Summary cards not affected |
| 9 | Opportunity type filter | Filter to "gap" recommendations | Table, chart, and summary filter to gap-type articles only. Allows comparison of gap vs decay performance |
| 10 | Export CSV | Click "Export CSV" with current filters | CSV file downloads with current filtered data. Columns match DataTable. Toast: "Exported 47 articles" |
| 11 | Chart toggle | Click "Impressions" toggle on chart | Chart switches from clicks to impressions Y-axis. Both predicted and actual lines update. Legend updates |
| 12 | Mobile layout | View on 375px viewport | Summary cards stack vertically. Chart scrollable horizontally. Table converts to card layout. Filters in bottom sheet |
| 13 | RTL layout | Switch to Arabic locale | Chart X-axis reversed. Cards reorder. Table text alignment flips. All Arabic keywords display correctly |
| 14 | GSC connection missing | Navigate to Performance with no GSC connected | Chart shows "Connect Google Search Console" with link to Connections. Summary cards show "GSC Required" |
| 15 | Keyboard navigation | Tab through entire page | Focus ring on cards, chart container, table rows. Enter on row opens slide-over. Escape closes. Arrow keys navigate chart data points |
