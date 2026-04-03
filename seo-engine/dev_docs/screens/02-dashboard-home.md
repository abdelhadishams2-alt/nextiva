# Screen Spec: Dashboard Home

> **Route:** `/`
> **Service:** Analytics, Dashboard API
> **Task:** T2-08
> **Type:** Dashboard / Summary
> **Priority:** P1

---

## 1. Overview

The main dashboard screen — the first thing users see after login. Shows KPI cards, generation activity chart, recent articles, and system health. Provides a quick overview of the entire ChainIQ platform status.

---

## 2. Screen Type

Dashboard / Summary — read-only metrics with drill-down links. Refreshes data on 60-second interval.

---

## 3. ASCII Wireframe

```
┌─────┬──────────────────────────────────────────────────────┐
│     │  Dashboard                              [User Menu]  │
│  S  │──────────────────────────────────────────────────────│
│  I  │                                                      │
│  D  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  E  │  │ Total    │ │ Success  │ │ Active   │ │ Errors │ │
│  B  │  │ Articles │ │ Rate     │ │ Users    │ │ (24h)  │ │
│  A  │  │   127    │ │  94.2%   │ │    8     │ │   3    │ │
│  R  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│     │                                                      │
│     │  ┌─────────────────────────────────────────────────┐ │
│     │  │  Generation Activity (30 days)                  │ │
│     │  │  ████                                           │ │
│     │  │  ████ ██                                        │ │
│     │  │  ████ ████ ██                                   │ │
│     │  │  ████ ████ ████ ██ ████                         │ │
│     │  │  Mar 1 ─────────────────────── Mar 26           │ │
│     │  └─────────────────────────────────────────────────┘ │
│     │                                                      │
│     │  Recent Articles              Pipeline Status        │
│     │  ┌───────────────────────┐   ┌──────────────────┐   │
│     │  │ Article Title    Draft│   │ Status: Idle     │   │
│     │  │ Article Title  Publis│   │ Queue:  0 jobs   │   │
│     │  │ Article Title    Draft│   │ Last:   2h ago   │   │
│     │  │ Article Title  Publis│   │                  │   │
│     │  │ Article Title    Draft│   │ [New Article]    │   │
│     │  │ View all →           │   └──────────────────┘   │
│     │  └───────────────────────┘                          │
└─────┴──────────────────────────────────────────────────────┘
```

---

## 4. Data Fields

### KPI Cards
| Field | Source | Format | Refresh |
|-------|--------|--------|---------|
| Total Articles | `GET /api/analytics/overview` → `total_articles` | Integer | 60s |
| Success Rate | `GET /api/analytics/overview` → `success_rate` | Percentage (1 decimal) | 60s |
| Active Users (7d) | `GET /api/analytics/overview` → `active_users_7d` | Integer | 60s |
| Errors (24h) | `GET /api/analytics/overview` → `errors_24h` | Integer, red if > 0 | 60s |

### Generation Activity Chart
| Field | Source | Format |
|-------|--------|--------|
| Daily generation count | `GET /api/analytics/generation?period=30d&group_by=day` | Bar chart |
| Success vs failure | Same endpoint, split by outcome | Stacked bars (green/red) |

### Recent Articles
| Field | Source | Format |
|-------|--------|--------|
| Title | `GET /api/articles?limit=5&sort=created_at:desc` → `title` | Text, truncate 40 chars |
| Status | Same → `status` | Badge (draft=blue, published=green, archived=gray) |
| Created | Same → `created_at` | Relative time ("2h ago") |

### Pipeline Status
| Field | Source | Format |
|-------|--------|--------|
| Status | `GET /api/pipeline/status` → `status` | Badge (idle=gray, running=green, error=red) |
| Queue count | Same → `queue_count` | Integer |
| Last generation | Same → `last_completed_at` | Relative time |

---

## 5. Component Inventory

| Component | Source | Props | Notes |
|-----------|--------|-------|-------|
| Sidebar | Custom | collapsed, onToggle | Persistent navigation |
| KPICard | Custom | title, value, trend, icon | 4 metric cards in grid |
| AreaChart | shadcn/ui (recharts) | data, xKey, yKey | 30-day generation activity |
| DataTable | shadcn/ui | columns, data, onRowClick | Recent articles list |
| Badge | shadcn/ui | variant | Status indicators |
| Card | shadcn/ui | — | Pipeline status container |
| Button | shadcn/ui | onClick | "New Article" CTA |
| Skeleton | shadcn/ui | className | Loading placeholders |

---

## 6. States (8 total)

### Loading State
```
4 KPI card skeletons (pulsing rectangles).
Chart area: skeleton with faint grid lines.
Recent articles: 5 skeleton rows with shimmer.
Pipeline status: skeleton card.
Sidebar visible with active item highlighted.
```

### Error State — API Failure
```
Full-width Alert (destructive): "Unable to load dashboard data. The bridge server may not be running."
Retry button centered below.
Sidebar remains functional for navigation.
```

### Error State — Partial Data
```
Failed sections show inline error card: "Analytics unavailable" with retry link.
Other sections render normally with available data.
```

### Empty State — No Articles Yet
```
KPI cards show zeros: "0 articles", "N/A" success rate, "1 user", "0 errors".
Chart area: empty state illustration + "Generate your first article to see activity data."
Recent articles: "No articles yet. Click 'New Article' to get started." with prominent CTA.
Pipeline status: "Idle — Ready to generate."
```

### Empty State — New User (post-onboarding)
```
Welcome banner at top: "Welcome to ChainIQ! Here's your dashboard overview."
Dismissible — saves preference to localStorage.
Otherwise same as No Articles empty state.
```

### Data-Present State
```
All 4 KPI cards populated with real data and trend arrows (↑ green, ↓ red, → neutral).
Chart shows 30-day generation activity with hover tooltips.
5 most recent articles with status badges and relative timestamps.
Pipeline shows current status and queue depth.
```

### Refreshing State
```
Subtle loading indicator in header (not full skeleton refresh).
Data continues to show stale values until new data arrives.
No visual disruption — silent background refresh.
```

### Admin View State
```
Same layout but KPI cards show platform-wide metrics (all users).
Additional "Pending Approvals" card if there are pending users.
"Admin" badge next to user name in sidebar.
```

---

## 7. Interactions

1. **Click KPI card** → navigate to relevant detail page (articles for Total Articles, settings for Errors)
2. **Hover chart bar** → tooltip shows exact count + date
3. **Click chart period selector** → toggle between 7d / 30d / 90d
4. **Click article row** → navigate to `/articles/[id]`
5. **Click "View all"** → navigate to `/articles`
6. **Click "New Article"** → open article generation dialog
7. **Auto-refresh** → every 60 seconds, fetch updated metrics silently

---

## 8. Mobile Behavior

- KPI cards: 2x2 grid on tablet, stacked vertically on mobile
- Chart: full width, horizontally scrollable on mobile
- Recent articles: simplified list (title + status badge only)
- Sidebar: collapses to hamburger menu
- Pipeline status: moves below recent articles

---

## 9. Accessibility (WCAG 2.1 AA)

- KPI cards have `aria-label` with full context ("Total articles: 127, up 12% from last month")
- Chart has `aria-label` describing overall trend; data table alternative available
- "New Article" button is keyboard-accessible and has focus ring
- Auto-refresh does not disrupt screen reader flow (uses `aria-live="polite"` for updates)

---

## 10. Edge Cases

1. **Bridge server not running** → show connection error with "Start bridge server" instructions
2. **Supabase unreachable** → show partial data from cache if available, error for live data
3. **User has 10,000+ articles** → KPI shows count, recent list shows only 5 most recent
4. **Timezone differences** → all "relative time" calculations use user's local timezone
5. **First-ever login** → trigger onboarding wizard redirect before showing dashboard

---

## 11. Dependencies

- **Blocks:** Nothing
- **Blocked by:** Login/Signup (must authenticate first), Analytics API (T2-08), Dashboard API (T2-03)
- **Service:** Analytics (analytics.md), Dashboard API (dashboard-api.md)
