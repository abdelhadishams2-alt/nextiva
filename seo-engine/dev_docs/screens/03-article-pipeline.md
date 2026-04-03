# Screen Spec: Article Pipeline Manager

> **Route:** `/articles`
> **Service:** Dashboard API, Article Pipeline
> **Task:** T2-06
> **Type:** List + Actions
> **Priority:** P1

---

## 1. Overview

The article pipeline manager is the central content management screen. It displays all generated articles in a searchable, filterable data table with status tracking. Users can generate new articles, view details, manage drafts, and monitor the generation queue.

---

## 2. Screen Type

List / Table with action toolbar and inline status tracking.

---

## 3. ASCII Wireframe

```
┌─────┬───────────────────────────────────────────────────────────┐
│     │  Articles                              [+ New Article]    │
│  S  │───────────────────────────────────────────────────────────│
│  I  │  [Search...        ] [Status ▾] [Language ▾] [Framework ▾]│
│  D  │───────────────────────────────────────────────────────────│
│  E  │  □ Title            Status     Language  Created    Words  │
│  B  │  ──────────────────────────────────────────────────────── │
│  A  │  □ AI in Healthcare [Draft  ]  English   2h ago    2,450  │
│  R  │  □ Cloud Computing  [Publish]  English   1d ago    3,100  │
│     │  □ الذكاء الاصطناعي [Draft  ]  Arabic    2d ago    2,800  │
│     │  □ React Patterns   [Generat]  English   Just now    —    │
│     │  □ Vue.js Guide     [Failed ]  English   3d ago      —    │
│     │                                                           │
│     │  ─────────────────────────────────────────────────────── │
│     │  Showing 1-5 of 127 articles       [← 1 2 3 ... 26 →]  │
│     │                                                           │
│     │  ┌─────────────────────────────────────────────────────┐ │
│     │  │  Pipeline: Running  |  Queue: 2 jobs  |  ETA: ~8min│ │
│     │  └─────────────────────────────────────────────────────┘ │
└─────┴───────────────────────────────────────────────────────────┘
```

---

## 4. Data Fields

| Field | Type | Source | Sortable | Filterable |
|-------|------|--------|----------|------------|
| Checkbox | boolean | local | No | No |
| Title | text | `articles.title` | Yes | Search |
| Status | enum | `articles.status` | Yes | Dropdown |
| Language | string | `articles.language` | Yes | Dropdown |
| Framework | string | `articles.framework` | No | Dropdown |
| Created | datetime | `articles.created_at` | Yes (default desc) | Date range |
| Word Count | integer | `articles.word_count` | Yes | No |
| Images | integer | `articles.image_count` | No | No |

---

## 5. Component Inventory

| Component | Source | Notes |
|-----------|--------|-------|
| DataTable | shadcn/ui | Sortable columns, pagination, row selection |
| Input | shadcn/ui | Search field with debounce (300ms) |
| Select | shadcn/ui | Filter dropdowns (status, language, framework) |
| Badge | shadcn/ui | Status badges with color variants |
| Button | shadcn/ui | "New Article" CTA, bulk actions |
| Dialog | shadcn/ui | New article generation form |
| AlertDialog | shadcn/ui | Delete confirmation |
| Pagination | shadcn/ui | Page navigation |
| Skeleton | shadcn/ui | Table row loading placeholders |
| DropdownMenu | shadcn/ui | Row action menu (view, edit, delete, archive) |

---

## 6. States (9 total)

### Loading State
```
Toolbar visible with disabled filters.
Table shows 5 skeleton rows with pulsing animation.
Pagination hidden.
Pipeline status bar shows skeleton.
```

### Error State — API Failure
```
Alert (destructive) replaces table: "Unable to load articles. Please ensure the bridge server is running."
Retry button centered below.
Toolbar and sidebar remain functional.
```

### Empty State — No Articles
```
Table area replaced by centered illustration + text:
"No articles yet"
"Generate your first article to get started."
[+ Generate First Article] button (large, prominent)
Filters hidden when empty.
```

### Empty State — No Search Results
```
Table area shows: "No articles matching your search."
"Try different keywords or clear your filters."
[Clear Filters] button.
```

### Data-Present State
```
Full table with real data, active sorting indicators,
pagination at bottom, pipeline status bar visible.
Row hover shows muted background highlight.
```

### Generating State
```
Article row with status "Generating" shows animated spinner badge.
Pipeline status bar at bottom: "Running | Queue: N jobs | ETA: ~Xmin"
Row is not clickable until generation completes.
```

### Bulk Selection State
```
Header checkbox checked, selected rows highlighted.
Toolbar changes to show: "3 selected" + [Archive] [Delete] bulk actions.
Individual row checkboxes visible.
```

### Deleting State
```
AlertDialog: "Delete 'Article Title'? This action cannot be undone."
[Cancel] [Delete] buttons. Delete button red with loading spinner on confirm.
```

### New Article Dialog State
```
Modal dialog with form:
- Topic (required text input)
- Language (select: English, Arabic, Hebrew, French, Spanish, Turkish)
- Framework (select: HTML, React, Vue, Svelte, WordPress)
- [Cancel] [Generate] buttons
Generate button shows loading spinner during submission.
```

---

## 7. Interactions

1. **Search** → debounced (300ms) → re-fetch with `?search=` param → update table
2. **Filter by status** → select dropdown → re-fetch with `?status=` param
3. **Sort column** → click header → toggle asc/desc → re-fetch with `?sort=` param
4. **Click row** → navigate to `/articles/[id]`
5. **Click "New Article"** → open generation dialog → submit → create pipeline_job → show toast
6. **Row action menu** → click "..." → dropdown: View, Archive, Delete
7. **Bulk select** → check header checkbox → show bulk action bar → confirm action

---

## 8. Mobile Behavior

- Table converts to card layout below 768px
- Each card: title, status badge, language, created date
- Filters collapse into a "Filter" button that opens a sheet
- Pagination becomes "Load more" infinite scroll
- Pipeline status bar becomes a floating bottom bar

---

## 9. Accessibility (WCAG 2.1 AA)

- Table uses proper `<table>`, `<thead>`, `<tbody>` semantics
- Sortable column headers have `aria-sort` attribute
- Row actions accessible via keyboard (Tab → Enter on "..." menu)
- Bulk selection announced via `aria-live` region
- Status badges have `aria-label` with full text (not just color)

---

## 10. Edge Cases

1. **Thousands of articles** → pagination handles up to 100K rows, server-side
2. **Long article title** → truncate with ellipsis at 60 chars, full title in tooltip
3. **Generation fails mid-way** → status = "Failed", error_message shown in row tooltip
4. **Concurrent users** → last-write-wins for status updates; no real-time sync in Phase 1
5. **RTL article title** → text direction auto-detected, title renders correctly in table

---

## 11. Dependencies

- **Blocks:** Article Detail screen
- **Blocked by:** Login/Signup, Dashboard API (T2-03)
- **Service:** Dashboard API (dashboard-api.md), Article Pipeline (article-pipeline.md)
