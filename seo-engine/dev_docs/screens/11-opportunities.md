# Screen Spec: Opportunities

> **Route:** `/opportunities`
> **Service:** Content Intelligence
> **Task:** T5-03
> **Type:** List + Scores
> **Priority:** P0
> **Spec Depth:** DEEP (target >= 8/10)

---

## 1. Overview

The Opportunities screen is the strategic command center of ChainIQ. It answers the question every publisher asks: "What should we write next, and why?" This screen surfaces scored topic recommendations backed by real performance data, identifies keyword gaps competitors exploit, detects content cannibalization between the client's own pages, and alerts on articles suffering traffic decay. Every recommendation includes a data justification so content teams make evidence-based decisions instead of relying on intuition.

This is the manifestation of Layer 2 (Content Intelligence) in the UI. The recommendation engine runs 6 analyses (Content Inventory scan, Decay Detection, Gap Analysis, Seasonality Check, Saturation Index, Cannibalization Guard) and outputs scored recommendations into the `keyword_opportunities` table. Each recommendation carries a priority score (0-100), a confidence level (high/medium/low), a recommended action (create_new, update_existing, merge, redirect, differentiate, deoptimize), and a full evidence payload in `analysis_metadata` that breaks down exactly how the score was computed.

The screen is organized into four tabs representing the four intelligence outputs. The Recommendations tab is the primary view and the most commonly used. Keyword Gaps, Cannibalization, and Decay Alerts provide drill-down into specific intelligence dimensions.

**TTG (Time-to-Goal) Reasoning:**

- **First visit (no data):** Tab bar visible but all tabs show "(0)" counts. A prominent empty state explains that data connections are required. CTA: "Connect Google Search Console to get recommendations." If connections exist but no analysis has run: "Run Analysis" button front and center with category input for Mode B.
- **First visit (data available):** Tab bar shows "Recommendations (23) | Keyword Gaps (156) | Cannibalization (4) | Decay Alerts (7)." Recommendations tab selected by default. Eye goes to the top recommendation card: a ScoreRing showing 94, keyword title "N54 HPFP Failure Symptoms and Solutions," type badge "NEW," volume "4,400/mo," KD "28," and a one-sentence justification. Prominent "Generate Article" CTA on each card. User scans the top 3, clicks "Generate" on the best one.
- **100th visit (established user):** Checks the recommendation count badge in the sidebar. Scans top 3 scores. If a top score is above 80, clicks "Generate." Checks the Cannibalization tab for new conflicts (badge count incremented since last visit). Checks Decay Alerts for any newly flagged articles. Efficient: the entire workflow takes under 60 seconds.
- **Agency admin (Marcus):** Switches between clients. Reviews each client's top 5 recommendations. Exports the recommendation list as a content calendar proposal for the monthly client meeting. Uses the "Run Analysis" button with a specific category for each client's vertical.

---

## 2. Primary Action

Review a scored recommendation and click "Generate Article" to send it directly into the article pipeline with full intelligence context. Secondary: run a new analysis, dismiss irrelevant recommendations, resolve cannibalization conflicts, view decay detail.

---

## 3. Route & Layout

**Route:** `/opportunities`
**Parent Layout:** Main dashboard layout with sidebar. Sits in the "Intelligence" sidebar group.
**Auth:** Authenticated. All roles can view. "Generate Article" requires editor or admin role. "Run Analysis" requires editor or admin role.

### ASCII Wireframe

```
┌─────┬──────────────────────────────────────────────────────────────────┐
│     │  Opportunities                              [Run Analysis ▾]     │
│  S  │────────────────────────────────────────────────────────────────│
│  I  │                                                                  │
│  D  │  ┌─ Analysis Status ─────────────────────────────────────────┐ │
│  E  │  │  Last analysis: 6h ago | 23 open recommendations          │ │
│  B  │  │  Data sources: GSC ✓  Semrush ✓  Ahrefs ✗  Trends ✓      │ │
│  A  │  └───────────────────────────────────────────────────────────┘ │
│  R  │                                                                  │
│     │  [Recommendations (23)] [Keyword Gaps (156)] [Cannibal. (4)]   │
│     │  [Decay Alerts (7)]                                             │
│     │────────────────────────────────────────────────────────────────│
│     │                                                                  │
│     │  [Search...     ] [Type ▾] [Action ▾] [Confidence ▾] [Sort ▾] │
│     │                                                                  │
│     │  ┌─ Recommendation Card ─────────────────────────────────────┐ │
│     │  │  ◉ 94  N54 HPFP Failure Symptoms and Solutions    [NEW]   │ │
│     │  │        Vol: 4,400/mo  KD: 28  Confidence: High            │ │
│     │  │        "High-volume keyword with no existing coverage.     │ │
│     │  │         Top SERP results are thin (avg 830 words)."       │ │
│     │  │        Scoring: Impr 28.3 + Gap 20.6 + Season 3.3 +      │ │
│     │  │                 Comp 7.2 = 94.2                           │ │
│     │  │                            [Dismiss] [Generate Article]   │ │
│     │  └───────────────────────────────────────────────────────────┘ │
│     │                                                                  │
│     │  ┌─ Recommendation Card ─────────────────────────────────────┐ │
│     │  │  ◉ 87  BMW N54 Common Problems (REFRESH)         [REFRESH]│ │
│     │  │        Vol: 6,100/mo  KD: 35  Confidence: High            │ │
│     │  │        "Existing article lost 42% clicks over 3 months.   │ │
│     │  │         Content is 16 months old. 3 fresher guides now    │ │
│     │  │         outranking yours."                                │ │
│     │  │        Target: /blog/n54-common-problems                  │ │
│     │  │                          [Dismiss] [Generate Refresh]     │ │
│     │  └───────────────────────────────────────────────────────────┘ │
│     │                                                                  │
│     │  Showing 1-10 of 23               [← 1 2 3 →]                 │
└─────┴──────────────────────────────────────────────────────────────────┘
```

---

## 4. Navigation

| Origin | Action | Destination |
|--------|--------|-------------|
| Sidebar | Intelligence > Opportunities | `/opportunities` |
| Dashboard Home | Click "Opportunities" widget / count badge | `/opportunities` |
| Content Inventory | "View in Opportunities" from detail panel | `/opportunities?search=[keyword]` |
| This screen | Click "Generate Article" on recommendation | `/articles/new?recommendation=[id]` (pre-filled pipeline) |
| This screen | Click target URL on refresh recommendation | `/inventory?detail=[content_id]` (view in inventory) |
| This screen | Click cannibalization conflict URL | `/inventory?search=[url]` |
| This screen | Click decay alert URL | `/inventory?detail=[content_id]` |
| This screen | Tab switch | `/opportunities?tab=gaps` / `?tab=cannibalization` / `?tab=decay` |

---

## 5. Data Fields

### Recommendations Tab — Card Fields

| Field | Type | Source | Display | Notes |
|-------|------|--------|---------|-------|
| Priority Score | numeric (0-100) | `keyword_opportunities.priority_score` | ScoreRing (custom, circular) | Color: red 0-30, amber 31-60, green 61-80, bright green 81-100 |
| Keyword / Title | text | `keyword_opportunities.keyword` | Bold heading text | Arabic keywords render RTL |
| Type Badge | enum | `keyword_opportunities.recommended_action` | Badge (shadcn/ui) | NEW (create_new) = blue, REFRESH (update_existing) = amber, MERGE = purple, REDIRECT = gray |
| Volume | integer | `keyword_opportunities.estimated_volume` | "4,400/mo" format | NULL shows "—" |
| Keyword Difficulty | numeric (0-100) | `keyword_opportunities.keyword_difficulty` | "KD: 28" with color indicator | Green 0-30, amber 31-60, red 61-100. NULL shows "—" |
| Confidence | enum | `keyword_opportunities.confidence` | Badge: high=green, medium=amber, low=gray | Based on data source availability |
| Justification | text | API response `summary` field | 1-2 sentence explanation | Computed server-side from analysis_metadata |
| Scoring Breakdown | object | `analysis_metadata.scoring` | Horizontal stacked bar | 5 components: impressions, decay, gap, seasonality, competition |
| Recommended Action | enum | `keyword_opportunities.recommended_action` | CTA button text varies | "Generate Article", "Generate Refresh", "Plan Merge", "Set Up Redirect" |
| Target URL | text | `keyword_opportunities.target_url` | Clickable link (for refresh/merge actions) | NULL for new article recommendations |
| Intent Type | enum | `keyword_opportunities.intent_type` | Small muted badge | informational, commercial, transactional, navigational, mixed |
| Content Type | enum | `keyword_opportunities.content_type_suggestion` | Small muted badge | how-to, listicle, comparison, guide, etc. |
| Status | enum | `keyword_opportunities.status` | Hidden in card, visible in filters | open, accepted, dismissed, in_pipeline, completed |
| Created At | datetime | `keyword_opportunities.created_at` | Muted relative time | "6h ago" |

### Keyword Gaps Tab — DataTable Columns

| Column | Type | Source | Sortable | Notes |
|--------|------|--------|----------|-------|
| Keyword | text | `keyword_opportunities.keyword` (type=gap) | Yes | Bold, clickable to expand detail |
| Gap Score | numeric | `analysis_metadata.gap.gap_score` | Yes (default desc) | Color-coded progress bar |
| Volume | integer | `keyword_opportunities.estimated_volume` | Yes | Formatted with comma separator |
| Difficulty | numeric | `keyword_opportunities.keyword_difficulty` | Yes | Color indicator |
| Competitors Ranking | integer | `analysis_metadata.gap.competitor_count` | Yes | "3 competitors" with expand to see URLs |
| Avg Competitor Position | decimal | `analysis_metadata.gap.competitor_avg_position` | Yes | One decimal place |
| SERP Features | badges | `analysis_metadata.gap.serp_features` | No | Tiny badges: "FS" (featured snippet), "PAA" (people also ask) |
| Action | button | -- | No | "Generate Article" CTA |

### Cannibalization Tab — Grouped Display

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| Contested Keyword | text | `cannibalization_conflicts.keyword` | Group header, bold |
| Total Impressions | integer | `cannibalization_conflicts.total_impressions` | Formatted, shown in header |
| URL Count | integer | `cannibalization_conflicts.url_count` | "3 URLs competing" |
| Winner URL | text | `cannibalization_conflicts.winner_url` | Highlighted with crown icon |
| Winner Clicks | integer | `cannibalization_conflicts.winner_clicks` | Shown next to winner URL |
| Loser URLs | text[] | `cannibalization_conflicts.loser_urls` | Listed below winner with their clicks |
| Recommended Resolution | enum | `cannibalization_conflicts.recommended_resolution` | merge, redirect, differentiate, deoptimize |
| Resolution Status | enum | `cannibalization_conflicts.resolution_status` | open, in_progress, resolved, dismissed |
| Resolve Button | button | -- | Opens resolution action dialog |

### Decay Alerts Tab — List with Sparklines

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| URL / Title | text | Via content_inventory join | Two-line: title bold, URL muted |
| Severity | badge | `analysis_metadata.decay.severity` | critical=red, high=orange, medium=amber, low=yellow |
| Click Change | percentage | `analysis_metadata.decay.click_change_3mo_pct` | "-34%" in red with down arrow |
| Position Change | text | `analysis_metadata.decay.position_previous` → `position_current` | "6.1 → 10.3" with red arrow |
| Page Boundary | boolean | `analysis_metadata.decay.page_boundary_crossed` | "Dropped to page 2" alert if true |
| Content Age | text | `analysis_metadata.decay.content_age_months` | "16 months old" |
| Trend Sparkline | chart | `analysis_metadata.decay.trend_data` | 3-month mini chart (clicks line) |
| Detection Methods | badges | `analysis_metadata.decay.method` (+ all triggered) | click_decline, position_drop, content_age, cannibalization_signal |
| Recommended Action | button | `keyword_opportunities.recommended_action` | "Generate Refresh" or "Plan Merge" |

---

## 6. Component Tree

```
OpportunitiesPage
├── PageHeader
│   ├── Heading "Opportunities"
│   └── DropdownMenu "Run Analysis" (shadcn/ui)
│       ├── MenuItem "Run Full Analysis" → triggers all 6 analyses
│       └── MenuItem "Run Category Analysis (Mode B)" → opens category dialog
├── AnalysisStatusBar (custom)
│   ├── Text: "Last analysis: 6h ago"
│   ├── Text: "23 open recommendations"
│   ├── DataSourceIndicators: GSC ✓, Semrush ✓, Ahrefs ✗, Trends ✓
│   └── AlertBanner (custom) — if last analysis > 24h: "Stale — Run Analysis"
├── Tabs (shadcn/ui)
│   ├── TabTrigger "Recommendations" + Badge count (23)
│   ├── TabTrigger "Keyword Gaps" + Badge count (156)
│   ├── TabTrigger "Cannibalization" + Badge count (4)
│   └── TabTrigger "Decay Alerts" + Badge count (7)
├── TabContent: Recommendations
│   ├── FilterBar
│   │   ├── Input (shadcn/ui) — keyword search (debounced 300ms)
│   │   ├── Select (shadcn/ui) — type filter (gap, decay, trending, seasonal)
│   │   ├── Select (shadcn/ui) — action filter (create_new, update_existing, merge, etc.)
│   │   ├── Select (shadcn/ui) — confidence filter (high, medium, low)
│   │   └── Select (shadcn/ui) — sort (score desc, score asc, volume desc, created desc)
│   ├── RecommendationCard (custom) × N
│   │   ├── ScoreRing (custom) — circular progress, 48px, color-coded
│   │   ├── CardHeader
│   │   │   ├── Keyword text (bold, large)
│   │   │   ├── Badge — type (NEW, REFRESH, MERGE, REDIRECT)
│   │   │   ├── Badge — intent type (muted, small)
│   │   │   └── Badge — content type suggestion (muted, small)
│   │   ├── CardMetrics
│   │   │   ├── Text — "Vol: 4,400/mo"
│   │   │   ├── Text — "KD: 28" (color-coded)
│   │   │   └── Badge — confidence level
│   │   ├── Justification — 1-2 sentence summary text (muted)
│   │   ├── ScoringBreakdown (custom) — horizontal stacked bar with 5 labeled segments
│   │   │   ├── Segment: Impressions (blue)
│   │   │   ├── Segment: Decay (red)
│   │   │   ├── Segment: Gap (green)
│   │   │   ├── Segment: Seasonality (purple)
│   │   │   └── Segment: Competition (amber)
│   │   ├── TargetUrlLink — if recommended_action != create_new (clickable)
│   │   └── CardActions
│   │       ├── Button "Dismiss" (shadcn/ui, ghost variant)
│   │       └── Button "Generate Article" / "Generate Refresh" (shadcn/ui, default variant)
│   └── Pagination (shadcn/ui) — "Showing 1-10 of 23"
├── TabContent: Keyword Gaps
│   ├── GapFilterBar
│   │   ├── Input — keyword search
│   │   ├── Slider — min volume (default 100)
│   │   ├── Slider — max difficulty (default 100)
│   │   └── Select — sort (gap_score_desc, volume_desc, difficulty_asc)
│   ├── DataTable (shadcn/ui) — keyword gaps table
│   │   └── TableRow × N
│   │       ├── Keyword (bold, expandable for competitor details)
│   │       ├── GapScoreBar (custom) — horizontal progress bar
│   │       ├── Volume
│   │       ├── Difficulty (color-coded)
│   │       ├── Competitor count (expandable)
│   │       ├── Avg competitor position
│   │       ├── SERP feature badges
│   │       └── Button "Generate Article"
│   └── Pagination
├── TabContent: Cannibalization
│   ├── CannibalizationFilterBar
│   │   ├── Select — resolution status (open, in_progress, resolved, dismissed)
│   │   └── Select — sort (impressions desc, url count desc)
│   ├── ConflictGroup (custom) × N
│   │   ├── GroupHeader
│   │   │   ├── Keyword (bold)
│   │   │   ├── Text — total impressions
│   │   │   ├── Badge — URL count
│   │   │   └── Badge — resolution status
│   │   ├── WinnerRow
│   │   │   ├── Icon — crown
│   │   │   ├── URL (clickable → inventory)
│   │   │   └── Click count
│   │   ├── LoserRow × N
│   │   │   ├── URL (clickable → inventory)
│   │   │   └── Click count
│   │   ├── ResolutionRecommendation
│   │   │   ├── Icon + text — recommended strategy
│   │   │   └── Confidence badge
│   │   └── ActionButtons
│   │       ├── Button "Resolve" → opens resolution dialog
│   │       └── Button "Dismiss" (ghost)
│   └── Pagination
├── TabContent: Decay Alerts
│   ├── DecaySummaryBar (custom)
│   │   ├── StatCard — total decaying
│   │   ├── StatCard — by severity breakdown
│   │   └── StatCard — estimated traffic at risk
│   ├── DecayFilterBar
│   │   ├── Select — severity (critical, high, medium, low)
│   │   ├── Select — detection method
│   │   └── Select — recommended action
│   ├── DecayAlertRow (custom) × N
│   │   ├── UrlTitleCell — two-line URL + title
│   │   ├── Badge — severity
│   │   ├── Text — click change percentage (red, with arrow)
│   │   ├── Text — position change ("6.1 → 10.3")
│   │   ├── Badge — "Dropped to page 2" if page_boundary_crossed
│   │   ├── Text — content age
│   │   ├── SparklineCell (custom, recharts) — 3-month click trend
│   │   ├── DetectionMethodBadges × N
│   │   └── Button — "Generate Refresh" / "Plan Merge"
│   └── Pagination
├── Dialog (shadcn/ui) — Category Analysis (Mode B)
│   ├── Input — category ("BMW engine maintenance")
│   ├── Input — competitors (optional, comma-separated domains)
│   ├── Select — max recommendations (10, 20, 50)
│   ├── Checkbox group — analyses to include (all 6 checked by default)
│   └── [Cancel] [Run Analysis]
├── Dialog (shadcn/ui) — Cannibalization Resolution
│   ├── RadioGroup — strategy (merge, redirect, differentiate, deoptimize)
│   ├── Textarea — notes
│   └── [Cancel] [Apply Resolution]
├── AnalysisProgressBar (custom) — visible when analysis is running
│   ├── Progress (shadcn/ui) — determinate (6 steps)
│   ├── Text — "Running gap analysis (3/6)..."
│   └── Button "Cancel" (ghost)
└── Toast (shadcn/ui) — notifications
```

**Component Inventory:**

| Component | Source | Notes |
|-----------|--------|-------|
| Tabs | shadcn/ui | 4 tab triggers with badge counts. Persistent URL state via query param. |
| DataTable | shadcn/ui | Used in Keyword Gaps tab. Server-side sorting and pagination. |
| Badge | shadcn/ui | Type badges, severity badges, confidence, intent, content type, SERP features |
| Button | shadcn/ui | Generate Article, Dismiss, Resolve, Run Analysis, Cancel |
| Input | shadcn/ui | Search fields with debounce (300ms) |
| Select | shadcn/ui | Filter dropdowns across all tabs |
| Slider | shadcn/ui | Volume and difficulty range filters in Gaps tab |
| Dialog | shadcn/ui | Category analysis form, cannibalization resolution form |
| Pagination | shadcn/ui | Per-tab pagination, server-side |
| Progress | shadcn/ui | Analysis progress bar |
| Skeleton | shadcn/ui | Card skeletons (recommendations), row skeletons (gaps, decay) |
| Toast | shadcn/ui | "Analysis started", "Article queued", "Recommendation dismissed" |
| DropdownMenu | shadcn/ui | "Run Analysis" split button menu |
| RadioGroup | shadcn/ui | Cannibalization resolution strategy selection |
| Textarea | shadcn/ui | Resolution notes |
| Checkbox | shadcn/ui | Analysis selection in Mode B dialog |
| ScoreRing | Custom | 48px circular score display. Used in recommendation cards. |
| ScoringBreakdown | Custom | Horizontal stacked bar showing 5 scoring components with labels |
| RecommendationCard | Custom | Full recommendation card layout with all fields |
| ConflictGroup | Custom | Grouped cannibalization display with winner/loser rows |
| DecayAlertRow | Custom | Horizontal row with sparkline and severity indicators |
| DecaySummaryBar | Custom | Aggregate decay statistics at tab top |
| AnalysisStatusBar | Custom | Page-level analysis recency and data source indicators |
| AnalysisProgressBar | Custom | Visible during active analysis run |
| SparklineCell | Custom (recharts) | Inline 3-month trend chart in decay rows |
| GapScoreBar | Custom | Horizontal progress bar for gap scores |

---

## 7. States (10 states)

### 7.1 Loading State

```
AnalysisStatusBar shows skeleton text.
Tabs render with "(--)" placeholder counts.
Active tab content shows:
  Recommendations: 4 skeleton cards (pulsing, matching card layout shape).
  Gaps: 8 skeleton DataTable rows.
  Cannibalization: 3 skeleton conflict groups.
  Decay: 5 skeleton alert rows.
Filter bars disabled (dropdowns grayed).
Duration: typically < 500ms.
```

### 7.2 No-Data State (Connections Not Set Up)

```
AnalysisStatusBar hidden.
Tabs visible but all show "(0)" counts. All tabs disabled except Recommendations.
Recommendations tab shows centered empty state:
  Illustration: magnifying glass with chart bars (SVG, dark-mode compatible).
  Heading: "Connect your data sources to get recommendations"
  Body: "ChainIQ needs Google Search Console data to analyze your content
         performance and identify opportunities. Semrush and Ahrefs unlock
         competitive intelligence and keyword gap analysis."
  [Connect Google Search Console] — primary button → /settings/connections
  [Learn More] — ghost button → documentation link
No "Run Analysis" button in page header (nothing to analyze).
```

### 7.3 No-Data State (Connections Exist, No Analysis Run)

```
AnalysisStatusBar: "No analysis has been run yet."
Data source indicators show which are connected (green checks).
Tabs show "(0)" counts but are all enabled.
Recommendations tab shows:
  Heading: "Ready to discover opportunities"
  Body: "Run your first analysis to get scored recommendations based on
         your content performance, keyword gaps, and competitive landscape."
  Category input inline: "Enter a topic category (e.g., BMW engine maintenance)"
  [Run First Analysis] — primary button, large
  Below: "Full analysis takes 30-60 seconds depending on inventory size."
```

### 7.4 Recommendations Loaded State

```
AnalysisStatusBar: "Last analysis: 6h ago | 23 open recommendations"
Data source indicators: green/red per source.
Tabs: "Recommendations (23) | Keyword Gaps (156) | Cannibalization (4) | Decay Alerts (7)"
Recommendations tab active.
Filter bar: all filters enabled, default sort = score_desc.
Cards render in a single-column list (not grid — cards are wide with much content).
Each card: ScoreRing + keyword + badges + metrics + justification + scoring breakdown + CTA.
Cards with status "in_pipeline" show a muted "In Pipeline" badge instead of "Generate" button.
Cards with status "completed" show a green "Completed" badge with link to article.
Pagination at bottom: "Showing 1-10 of 23"
```

### 7.5 Keyword Gaps Loaded State

```
Gaps tab active. DataTable with sortable columns.
Default sort: gap_score descending.
Row expansion: clicking a row expands to show:
  - Competitor URLs ranking for this keyword (with position, word count)
  - SERP features detail
  - Full gap analysis evidence
Filter bar: min volume slider, max difficulty slider, keyword search, sort.
Generate Article CTA on each row.
Pagination.
```

### 7.6 Cannibalization Loaded State

```
Cannibalization tab active. Grouped conflict display.
Each group is a collapsible card with:
  Header: keyword + total impressions + URL count + status badge.
  Expanded: winner URL (crown icon) + loser URLs with click data.
  Resolution recommendation with confidence and strategy buttons.
Default: groups sorted by total_impressions descending.
Filter: resolution_status dropdown (default: "open").
Open conflicts highlighted with amber left border.
Resolved conflicts dimmed (gray text, no action buttons).
```

### 7.7 Decay Alerts Loaded State

```
Decay tab active. DecaySummaryBar at top:
  "7 decaying articles | 1 critical, 3 high, 2 medium, 1 low"
  "Estimated traffic at risk: 4,200 clicks/month"
Each DecayAlertRow shows URL, severity, metrics, sparkline, action.
Sorted by severity descending (critical first), then click_change ascending (worst drops first).
Critical severity rows have red left border.
High severity rows have orange left border.
Sparklines show 3-month click trend (declining line in red).
```

### 7.8 Analysis Running State

```
AnalysisProgressBar appears between AnalysisStatusBar and Tabs.
Progress bar: 6 steps (one per analysis type), determinate.
Text cycles: "Scanning inventory (1/6)..." → "Detecting decay (2/6)..." →
  "Analyzing keyword gaps (3/6)..." → "Checking seasonality (4/6)..." →
  "Measuring SERP saturation (5/6)..." → "Guarding against cannibalization (6/6)..."
Cancel button visible.
Existing data remains visible underneath (not replaced during analysis).
On completion:
  Toast (success): "Analysis complete. 23 recommendations generated."
  Progress bar fades out. Tab counts update. Cards/rows refresh.
Duration: 30-60 seconds for full analysis.
```

### 7.9 Stale Analysis State (Last Analysis > 24h)

```
AnalysisStatusBar turns to warning variant (amber border):
  "Last analysis: 26h ago — results may not reflect recent changes."
  [Run Analysis] button appears inline in the status bar (not just in page header).
All data remains visible and functional.
Tab counts may be outdated but are still displayed.
```

### 7.10 Empty Tab State (No Results for Category)

```
When a specific tab has zero results (e.g., no cannibalization conflicts):
  Tab count shows "(0)".
  Tab content shows mini empty state:
    Cannibalization: "No cannibalization conflicts detected. Your content
      targeting appears healthy."
    Gaps: "No keyword gaps found for this category. Try broadening your
      topic or adding competitor domains."
    Decay: "No decaying articles detected. All content is performing
      within healthy thresholds."
  No CTA button — this is a good state, not an error.
```

---

## 8. Interactions (12 interactions)

### 8.1 Generate Article from Recommendation

```
1. User clicks "Generate Article" button on a recommendation card
2. Button enters loading state (spinner, disabled)
3. Frontend calls POST /api/intelligence/recommendations/:id/execute
   Body: { "mode": "generate" }
4. Server creates a pipeline job with full analysis context injected:
   - Keyword, volume, difficulty, competitor data, SERP features
   - Gap evidence, decay signals, seasonality curves, saturation assessment
   - Intent type and content type suggestion
5. Server sets opportunity status to "in_pipeline", writes to recommendation_history
6. Response: { pipeline_job_id, status: "queued" }
7. Toast (success): "Article queued for generation. View in pipeline →"
   Toast action: link to /articles (pipeline manager)
8. Card updates: "Generate Article" button replaced by "In Pipeline" badge with link
9. If opportunity was a refresh (update_existing):
   - The pipeline receives the target URL, existing content context, and decay evidence
   - CTA reads "Generate Refresh" (not "Generate Article")
10. Error (409 — already in pipeline): Toast (warning): "This recommendation is already
    being processed." Card shows "In Pipeline" badge.
```

### 8.2 Dismiss Recommendation

```
1. User clicks "Dismiss" button (ghost variant) on a recommendation card
2. AlertDialog: "Dismiss this recommendation?"
   Body: "You can find dismissed recommendations in the filter under Status > Dismissed."
   [Cancel] [Dismiss]
3. Confirm: frontend calls PATCH /api/intelligence/recommendations/:id
   Body: { "status": "dismissed" }
4. Card fades out (300ms) and is removed from the list
5. Tab count decrements: "(23)" → "(22)"
6. Toast: "Recommendation dismissed. Undo?" — with 5-second undo action
7. Undo: calls PATCH with { "status": "open" }, card fades back in
8. After undo window: recommendation_history records the dismissal
9. Dismissed recommendations excluded from future analysis runs (not re-surfaced)
```

### 8.3 Run Full Analysis

```
1. User clicks "Run Analysis" → "Run Full Analysis" in dropdown
2. Frontend calls POST /api/intelligence/run with:
   { analyses: ["inventory","decay","gap","seasonality","saturation","cannibalization"] }
3. Response: { run_id, status: "running" }
4. AnalysisProgressBar appears (state 7.8)
5. Frontend polls GET /api/intelligence/run/:runId every 3 seconds
6. Progress updates as each analysis completes
7. On completion: all tab data refreshes, counts update
8. Rate limit: max 5 runs per user per day. On 429:
   Dialog warning: "Analysis limit reached. You can run [N] more today."
```

### 8.4 Run Category Analysis (Mode B)

```
1. User clicks "Run Analysis" → "Run Category Analysis"
2. Dialog opens with form:
   - Category input: "BMW engine maintenance" (required)
   - Competitors: "competitor-a.com, competitor-b.com" (optional, comma-separated)
   - Max recommendations: Select (10, 20, 50) — default 20
   - Analyses: 6 checkboxes (all checked by default, user can uncheck)
3. User fills category, clicks "Run Analysis"
4. Frontend calls POST /api/intelligence/run with:
   { category: "BMW engine maintenance", competitors: [...], max_recommendations: 20,
     analyses: [...], include_refresh: true, include_new: true }
5. Same progress flow as 8.3
6. Results are category-scoped: only keywords related to "BMW engine maintenance"
```

### 8.5 Search Recommendations

```
1. User types in search input on Recommendations tab
2. Debounce at 300ms
3. Frontend calls GET /api/intelligence/recommendations?search=hpfp&page=1
4. Server uses trigram index on keyword field for fast matching
5. Cards update to show matching recommendations only
6. Search pill appears above cards: "Search: hpfp" [×]
7. Clear: click × or clear input. Full list restores.
```

### 8.6 Filter by Type, Action, or Confidence

```
1. User clicks a filter Select dropdown
2. Options populate from the data (e.g., Type: gap, decay, trending, seasonal)
3. User selects one or more options
4. Frontend appends query params: ?type=gap,decay&action=create_new
5. API call with filter params. Cards/rows update.
6. Filter pills appear above content. Each removable via ×.
7. Multiple filters combine with AND logic.
8. "Clear Filters" button resets all filters and search.
```

### 8.7 Switch Tabs

```
1. User clicks a tab trigger (e.g., "Keyword Gaps (156)")
2. URL updates: /opportunities?tab=gaps
3. Tab content transitions (fade-in, 200ms)
4. If tab data not yet loaded: skeleton state while fetching
5. If tab data cached from previous load: instant render
6. Each tab has independent filter state (not shared across tabs)
7. Tab counts always visible regardless of active tab
8. Keyboard: Arrow Left/Right to switch between tab triggers
```

### 8.8 Expand Keyword Gap Row

```
1. User clicks a row in the Keyword Gaps DataTable
2. Row expands below with detail panel (accordion-style):
   - Competitor URLs: table of { url, position, word_count }
   - SERP features: featured snippet (holder?), PAA questions, video results
   - Full gap analysis evidence with gap_score breakdown
3. "Generate Article" button prominent in expanded detail
4. Click again to collapse. Only one row expanded at a time (accordion).
```

### 8.9 Resolve Cannibalization Conflict

```
1. User clicks "Resolve" on a cannibalization conflict group
2. Dialog opens with resolution options:
   - RadioGroup: Merge, Redirect, Differentiate, Deoptimize
   - Each option has explanatory help text:
     "Merge: Combine both articles into the winner URL. The loser becomes a redirect."
     "Redirect: Set up a 301 redirect from loser to winner."
     "Differentiate: Adjust keyword targeting so articles rank for different queries."
     "Deoptimize: Remove the loser from competing by reducing keyword density."
   - Textarea: resolution notes (optional)
3. User selects strategy, optionally adds notes, clicks "Apply Resolution"
4. Frontend calls POST /api/intelligence/cannibalization/:id/resolve
   Body: { strategy: "merge", notes: "..." }
5. Conflict status changes to "in_progress" or "resolved"
6. Toast: "Resolution applied. Remember to implement the changes on your site."
7. Note: ChainIQ does NOT modify the user's website. The resolution is a tracking
   record. Actual content changes must be made by the user or via Article Pipeline.
```

### 8.10 View Decay Alert Detail

```
1. User clicks on a decay alert row
2. Row expands to show full decay analysis:
   - 6-month performance chart (clicks and impressions, dual Y-axis)
   - All detection methods that triggered with evidence:
     "Click decline: -34% over 3 months"
     "Position drop: 6.1 → 10.3 (crossed page boundary)"
     "Content age: 16 months (threshold: 12 months for how-to)"
   - Competitor analysis: "3 fresher guides now outranking this article"
   - Content freshness indicators: publish date, modified date, content hash changes
3. "Generate Refresh" button in expanded view
4. "View in Inventory" link to see full article metadata
```

### 8.11 Sort Recommendations

```
1. User clicks Sort dropdown
2. Options: Score (high first), Score (low first), Volume (high first),
   Created (newest first), Impressions (high first)
3. Selection triggers API call with sort param
4. Cards re-render in new order
5. Default: Score (high first) — most actionable recommendations at top
```

### 8.12 Cancel Running Analysis

```
1. User clicks "Cancel" on AnalysisProgressBar
2. AlertDialog: "Cancel the running analysis?"
   Body: "Analyses completed so far will be preserved. Remaining analyses will be skipped."
   [Continue] [Cancel Analysis]
3. Confirm: frontend could call a cancel endpoint (future — currently analysis is atomic)
4. For now: user acknowledges and waits, or navigates away (analysis continues in background)
5. Results from completed analyses are available even if others fail (partial status)
```

---

## 9. Keyboard Navigation

| Key | Context | Action |
|-----|---------|--------|
| `Tab` | Page load | Focus: Run Analysis button → AnalysisStatusBar → Tab triggers → Filter bar → First card/row |
| `Arrow Left/Right` | Tab triggers focused | Switch between tabs |
| `Enter` | Tab trigger focused | Activate tab |
| `Tab` | Inside Recommendations tab | Navigate between cards (each card is a focusable region) |
| `Enter` | Card focused | Focus moves inside card (Dismiss and Generate buttons) |
| `Escape` | Inside card | Focus moves back to card container |
| `Enter` | "Generate Article" button focused | Triggers generation flow |
| `Arrow Up/Down` | Keyword Gaps DataTable | Navigate between rows |
| `Enter` | Gap row focused | Expand/collapse row detail |
| `Space` | Gap row focused | Toggle row expansion |
| `Enter` | Cannibalization "Resolve" button | Opens resolution dialog |
| `Escape` | Dialog open | Closes dialog |
| `/` | Not in input | Focus search input |
| `Ctrl+Shift+R` | Any | Keyboard shortcut for "Run Analysis" |

---

## 10. Mobile Behavior

- **Breakpoint: < 768px** — Tab triggers become a horizontal scrollable strip (swipeable). Active tab underlined. Tab count badges visible.
- **Recommendation cards:** Full-width. ScoreRing moves to the left edge (small, 36px). Metrics wrap to two rows. Scoring breakdown becomes a simple text list instead of stacked bar. Justification shown in full (no truncation on mobile — this is the key decision-making content).
- **"Generate Article" button:** Full-width, prominent, at bottom of each card. Easy thumb reach.
- **Keyword Gaps table:** Converts to card layout. Each card shows keyword, gap score, volume, difficulty, action button. Competitor details available on card tap (expandable).
- **Cannibalization groups:** Vertical stack. Winner/loser URLs wrap to full-width rows. Resolve button full-width at bottom of group.
- **Decay alerts:** Sparklines hidden on mobile (too small to be useful). Replaced by severity badge and percentage text. Full trend available on row tap (expand to show TimelineChart).
- **Filters:** Collapse into a "Filter" button that opens a bottom Sheet with all filter controls stacked vertically.
- **Analysis dialog:** Bottom sheet instead of centered dialog.
- **Run Analysis button:** Floating action button (FAB) at bottom-right if no analysis has been run. Fixed position for easy access.

---

## 11. Accessibility (WCAG 2.1 AA)

- **Tab navigation:** `role="tablist"` on tab container, `role="tab"` on triggers, `role="tabpanel"` on content areas. `aria-selected="true"` on active tab. `aria-controls` linking trigger to panel. Arrow key navigation between tabs per WAI-ARIA Tabs pattern.
- **ScoreRing:** `role="meter"`, `aria-valuenow="94"`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-label="Priority score: 94 out of 100"`. Color is NEVER the sole indicator — the numeric value is always displayed.
- **Recommendation cards:** Each card is an `<article>` element with `aria-labelledby` pointing to the keyword heading. Screen reader reads: "Recommendation: N54 HPFP Failure Symptoms and Solutions, priority score 94, type new, volume 4,400 per month."
- **Badges:** All badges have `aria-label` with full text. "NEW" badge reads "Type: new article." Severity badges: "Severity: critical."
- **Scoring breakdown bar:** `aria-hidden="true"` on the visual bar. Adjacent text provides breakdown: "Scoring: impressions 28.3, gap 20.6, seasonality 3.3, competition 7.2."
- **DataTable (Gaps tab):** Same accessibility pattern as Content Inventory DataTable: proper `<table>` semantics, `aria-sort` on headers, keyboard navigation with Arrow keys.
- **Expandable rows/groups:** `aria-expanded="true/false"` on trigger elements. Expanded content has `role="region"` with `aria-labelledby`.
- **Sparklines:** `aria-hidden="true"` (decorative). Adjacent text provides the data point (e.g., "-34% clicks").
- **Dialog forms:** `role="dialog"`, `aria-labelledby`, focus trapped. RadioGroup uses proper `role="radiogroup"` with `role="radio"` on options.
- **Progress bar (analysis):** `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="6"`. Live region announces each step: "Running gap analysis, step 3 of 6."
- **Toast with undo:** `role="alert"`, `aria-live="assertive"`. Undo button focusable via Tab.
- **Color contrast:** All score colors, severity colors, and badge colors tested at 4.5:1 minimum against zinc-900 background.

---

## 12. Error Handling

| Error Scenario | HTTP Code | User-Facing Message | Recovery Action |
|----------------|-----------|---------------------|-----------------|
| API failure loading recommendations | 500 / timeout | "Unable to load recommendations. Please try again." | Retry button. Tab shows error state. Other tabs remain functional. |
| Generate Article fails — pipeline busy | 503 | "The article pipeline is currently busy. Your request has been queued." | Toast with queue position. Button changes to "Queued." |
| Generate Article fails — already in pipeline | 409 | "This recommendation is already being processed." | Card shows "In Pipeline" badge. |
| Dismiss fails | 500 | "Could not dismiss recommendation. Please try again." | Toast (error). Card remains unchanged. Retry on next click. |
| Run Analysis fails — no connections | 400 | "Connect at least one data source before running analysis." | Link to /settings/connections. |
| Run Analysis fails — rate limited | 429 | "You have reached the analysis limit (5 per day). Try again tomorrow." | Show remaining quota. |
| Run Analysis fails — already running | 409 | "An analysis is already running. Please wait for it to complete." | Show analysis progress bar. |
| Analysis partial failure | 200 (partial) | "Analysis completed with warnings. Gap analysis failed due to Semrush rate limit. Other results are available." | Alert banner on AnalysisStatusBar. Partial results displayed. Failed analyses noted. |
| Cannibalization resolve fails | 500 | "Could not apply resolution. Please try again." | Dialog remains open. Retry button. |
| SSE/polling connection drops during analysis | N/A | "Lost connection to analysis progress. Reconnecting..." | Auto-reconnect. Fall back to polling every 5 seconds. |
| Search returns no results | 200 (empty) | "No recommendations matching '[query]'. Try a different search term." | Clear search button. Suggestions if available. |
| Bridge server unreachable | ECONNREFUSED | "Cannot reach the server. Please ensure the bridge server is running." | Retry button. Troubleshooting link. |

---

## 13. Edge Cases (7 cases)

1. **User generates from a recommendation that becomes stale (re-analysis changes the score):** The pipeline receives the score and evidence at the time of execution, captured in `recommendation_history.priority_score_at_action`. Even if a subsequent analysis run changes the opportunity's priority_score, the pipeline uses the original context. The card shows the updated score but with a note: "Score changed since you last viewed this recommendation."

2. **Identical keyword appears as both a gap and a decay opportunity:** The `keyword_opportunities` table has a unique constraint on `(user_id, keyword, opportunity_type)`, so the same keyword can have both a `gap` entry and a `decay` entry. These appear as separate cards in the Recommendations tab (with different type badges) and in their respective tabs (Gaps and Decay). The scoring formula may produce different priority_scores for each because the decay component dominates one while the gap component dominates the other.

3. **Cannibalization conflict where the "winner" has fewer clicks than a loser:** This can happen when the winner is determined by position rather than clicks (lower position but higher CTR). The UI shows both clicks and position for each URL in the conflict group, and the resolution recommendation accounts for this nuance. The help text explains: "Winner is determined by best average position, not highest clicks."

4. **Arabic keyword recommendations:** Keywords in `keyword_opportunities.keyword` stored in original script. The RecommendationCard applies `dir="rtl"` to the keyword text element when the keyword contains Arabic characters (detected via Unicode range check). Volume and KD numbers remain LTR. The justification text renders in the language matching the keyword.

5. **Analysis run takes longer than 2 minutes (large inventory, 10K+ URLs):** The progress bar continues updating via polling. No timeout on the client side. The server-side analysis has a 5-minute timeout per individual analysis and a 10-minute timeout for the full run. If the server times out, the analysis_run status becomes `partial` and completed analyses' results are available. AnalysisStatusBar shows: "Analysis partially completed (4/6 analyses succeeded)."

6. **User dismisses all recommendations:** Tab count shows "(0)". Empty tab state: "All recommendations have been dismissed. Run a new analysis to get fresh recommendations, or change the Status filter to view dismissed items." Filter includes a "Show Dismissed" option that reveals dismissed cards with a muted appearance and "Re-open" button instead of "Generate."

7. **Recommendations from a previous analysis run superseded by a new run:** Each analysis run creates or upserts `keyword_opportunities` rows (UNIQUE on user_id + keyword + opportunity_type). New scores overwrite old scores. The `analysis_run_id` field tracks which run produced the current data. If a user was viewing a card and the score changes due to a background scheduled analysis, the next API call returns the updated data. The card updates without notification (no disruptive alert). If the score change is dramatic (> 20 points), a subtle "Score updated" indicator appears on the card.

---

## 14. Data Sources (API Endpoints Called)

| Action | Endpoint | Method | When |
|--------|----------|--------|------|
| Load recommendations | `GET /api/intelligence/recommendations` | GET | Page mount (Recommendations tab), filter/search/sort/page change |
| Load single recommendation detail | `GET /api/intelligence/recommendations/:id` | GET | Future: recommendation detail page (not in Phase 1) |
| Dismiss recommendation | `PATCH /api/intelligence/recommendations/:id` | PATCH | Click "Dismiss" button |
| Execute recommendation | `POST /api/intelligence/recommendations/:id/execute` | POST | Click "Generate Article" / "Generate Refresh" |
| Load decay alerts | `GET /api/intelligence/decay` | GET | Decay Alerts tab activation |
| Load single decay detail | `GET /api/intelligence/decay/:contentId` | GET | Expand decay alert row |
| Load keyword gaps | `GET /api/intelligence/gaps` | GET | Keyword Gaps tab activation |
| Load competitors | `GET /api/intelligence/gaps/competitors` | GET | Mode B dialog (pre-fill competitor suggestions) |
| Load cannibalization conflicts | `GET /api/intelligence/cannibalization` | GET | Cannibalization tab activation |
| Load single conflict detail | `GET /api/intelligence/cannibalization/:keyword` | GET | Expand conflict group |
| Resolve conflict | `POST /api/intelligence/cannibalization/:id/resolve` | POST | Submit resolution dialog |
| Run analysis | `POST /api/intelligence/run` | POST | "Run Analysis" button |
| Poll analysis progress | `GET /api/intelligence/run/:runId` | GET | Every 3 seconds during active analysis |
| Check connection status | `GET /api/connections/status` | GET | Page mount (data source indicators in AnalysisStatusBar) |

**Data loading strategy:** Each tab loads its data independently on first activation. Tab data is cached client-side for the duration of the page session (SWR pattern with stale-while-revalidate). Switching tabs after initial load is instant. The Recommendations tab loads on page mount (default tab). Other tabs load on first click. Analysis status is fetched on page mount to determine if data exists.

---

## 15. Performance

- **Initial load:** Two parallel API calls: `GET /api/intelligence/recommendations?page=1&per_page=10` (< 300ms with index on user_id + priority_score) and `GET /api/connections/status` (< 50ms). Tab counts are derived from the first response's `total` field plus separate counts from other endpoints fetched lazily.
- **Tab switching:** First activation of a tab triggers an API call (< 300ms). Subsequent switches use SWR cached data (instant render, background revalidation). Each tab's data is independent — no cross-tab API calls.
- **Recommendation cards:** Max 10 cards per page. Each card renders ScoreRing (SVG, < 1KB), ScoringBreakdown (inline SVG, < 500 bytes), badges (text). Total DOM for 10 cards: < 100 elements. No virtualization needed.
- **Keyword Gaps DataTable:** Server-side pagination (25 rows per page). Expandable rows use lazy loading — competitor detail fetched on expand, not pre-loaded for all rows.
- **Sparklines (Decay tab):** Same lightweight recharts Sparkline as Content Inventory. Max 10 per page. < 10KB total SVG.
- **Analysis polling:** 3-second interval during active analysis. Each poll is < 50ms server-side. Polling stops automatically when analysis completes. No WebSocket needed — analysis runs are infrequent (max 5/day).
- **ScoringBreakdown component:** Pure SVG, no JavaScript animation. Renders in < 1ms. Five colored rectangles with proportional widths.
- **Bundle impact:** RecommendationCard, ConflictGroup, and DecayAlertRow are custom components totaling < 8KB. ScoreRing is shared with Content Inventory (already loaded). SparklineCell shared. recharts lazy-loaded only if Decay tab is activated. Total page JS: < 55KB gzipped (excluding recharts lazy chunk).
- **Search:** Trigram index on `keyword_opportunities.keyword` ensures sub-100ms search even with 10,000+ opportunities across all clients (RLS-filtered to current user).

---

## 16. Dependencies

- **Blocks:** Article Pipeline (screen 3) receives recommendations as generation context. Performance screen (screen 14) compares recommendation predictions to actual results.
- **Blocked by:** Connections (screen 9) — data sources required. Content Inventory (screen 10) — inventory data needed for decay and cannibalization analysis. Content Intelligence Service (service 8) — all recommendation, gap, decay, and cannibalization endpoints.
- **Service:** Content Intelligence (`content-intelligence.md`) — all intelligence endpoints. Data Ingestion (`data-ingestion.md`) — connection status for AnalysisStatusBar.
- **Shared components:** ScoreRing (also in Content Inventory, Performance), SparklineCell (also in Content Inventory), Badge patterns consistent across all screens, AlertBanner pattern from Content Inventory.
