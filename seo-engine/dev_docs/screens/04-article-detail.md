# Screen Spec: Article Detail

> **Route:** `/articles/[id]`
> **Service:** Dashboard API
> **Task:** T2-06 (part of pipeline manager)
> **Type:** Detail / Show
> **Priority:** P1

---

## 1. Overview

The article detail screen shows a single article's content, metadata, version history, and provides access to the inline edit UI. It's the bridge between the dashboard and the article's edit experience.

---

## 2. Screen Type

Detail / Show with tabbed sections.

---

## 3. ASCII Wireframe

```
┌─────┬───────────────────────────────────────────────────────────┐
│     │  ← Articles / AI in Healthcare          [Edit] [Archive]  │
│  S  │───────────────────────────────────────────────────────────│
│  I  │                                                           │
│  D  │  ┌─────────────────────────────────────────────────────┐ │
│  E  │  │  AI in Healthcare: Transforming Patient Care        │ │
│  B  │  │  Status: [Draft]  Language: English  Framework: HTML│ │
│  A  │  │  Created: Mar 24, 2026  Words: 2,450  Images: 5    │ │
│  R  │  └─────────────────────────────────────────────────────┘ │
│     │                                                           │
│     │  [Preview] [Metadata] [Versions] [Analytics]              │
│     │  ─────────────────────────────────────────────           │
│     │                                                           │
│     │  ┌─────────────────────────────────────────────────────┐ │
│     │  │                                                     │ │
│     │  │  Article HTML preview rendered in iframe             │ │
│     │  │  with section edit buttons visible                   │ │
│     │  │                                                     │ │
│     │  │  (Full article content rendered here)                │ │
│     │  │                                                     │ │
│     │  └─────────────────────────────────────────────────────┘ │
│     │                                                           │
└─────┴───────────────────────────────────────────────────────────┘
```

---

## 4. Data Fields

### Header
| Field | Source | Format |
|-------|--------|--------|
| Title | `articles.title` | Text |
| Status | `articles.status` | Badge |
| Language | `articles.language` | Text with flag icon |
| Framework | `articles.framework` | Badge |
| Created | `articles.created_at` | Formatted date |
| Word Count | `articles.word_count` | Number with separator |
| Image Count | `articles.image_count` | Number |
| Topic | `articles.topic` | Text |

### Metadata Tab
| Field | Source | Format |
|-------|--------|--------|
| File Path | `articles.file_path` | Monospace path |
| Components Used | `articles.metadata.components` | List of component names |
| Domain | `articles.metadata.domain` | Text |
| Research Rounds | `articles.metadata.research_rounds` | Number |
| Generation Duration | `pipeline_jobs.duration_ms` | Formatted duration ("3m 42s") |

### Versions Tab
| Field | Source | Format |
|-------|--------|--------|
| Version # | `article_versions.version_number` | Integer |
| Section | `article_versions.section_edited` | Text |
| Editor | `auth.users.full_name` | Text |
| Date | `article_versions.created_at` | Relative time |
| Word Delta | `article_versions.word_count_delta` | +/- number |

---

## 5. Component Inventory

| Component | Source | Notes |
|-----------|--------|-------|
| Tabs | shadcn/ui | Preview, Metadata, Versions, Analytics |
| Badge | shadcn/ui | Status, language, framework |
| Card | shadcn/ui | Header info card |
| Button | shadcn/ui | Edit, Archive, back navigation |
| Table | shadcn/ui | Version history |
| iframe | HTML | Article preview (sandboxed) |
| Dialog | shadcn/ui | Rollback confirmation |

---

## 6. States (8 total)

### Loading State
```
Header card skeleton: title shimmer, 3 badge skeletons, date skeleton.
Tab bar visible but disabled.
Content area: large skeleton rectangle.
```

### Error State — Article Not Found
```
Full page: "Article not found. It may have been deleted."
[← Back to Articles] button.
```

### Error State — Preview Failed
```
Header and tabs render normally.
Preview tab shows: "Unable to render article preview."
[Open File] button to open HTML file directly.
Other tabs still functional.
```

### Empty State — No Versions
```
Versions tab: "No edit history yet. Edit a section to create the first version."
Other tabs render normally.
```

### Data-Present State — Preview Tab
```
Sandboxed iframe renders the article HTML.
Section edit buttons visible within iframe.
Clicking edit triggers bridge server flow.
```

### Data-Present State — Metadata Tab
```
Metadata table with all article metadata.
File path with "Copy" button.
Component list with blueprint links.
```

### Data-Present State — Versions Tab
```
Version history table sorted by version_number desc.
Each row: version #, section, editor, date, word delta.
[Rollback] button on each row.
```

### Rollback Confirmation State
```
Dialog: "Rollback to version N? This will replace the current article content."
"Section edited: {section_name}"
[Cancel] [Rollback] buttons.
```

---

## 7. Interactions

1. **Switch tabs** → click tab → show corresponding content (client-side, no re-fetch)
2. **Click Edit button** → open article HTML in new tab for section editing via bridge server
3. **Click Rollback** → confirmation dialog → POST /api/articles/:id/rollback → refresh preview
4. **Click Archive** → confirmation dialog → update status → navigate back to /articles
5. **Click "Copy path"** → copy file path to clipboard → toast confirmation
6. **Click component name** → navigate to blueprint detail in /blueprints
7. **iframe section edit** → triggers bridge server /apply-edit → new version created → version tab updates

---

## 8. Mobile Behavior

- Tabs become horizontally scrollable tab bar
- Metadata table becomes key-value card layout
- Version history becomes card list
- iframe preview is full width with pinch-to-zoom

---

## 9. Accessibility

- Tab navigation via arrow keys
- iframe has `title` attribute describing content
- Version history table has proper semantics
- Rollback dialog traps focus and has Escape-to-close

---

## 10. Edge Cases

1. **Very long article** → iframe scrolls independently from page
2. **Article file deleted from disk** → preview shows error, metadata still available
3. **100+ versions** → paginated version history (20 per page)
4. **Concurrent edit** → if another user is editing, show "Edit in progress by {name}" message
5. **RTL article** → iframe renders RTL correctly, metadata tab remains LTR

---

## 11. Dependencies

- **Blocks:** Nothing
- **Blocked by:** Article Pipeline screen, Dashboard API
- **Service:** Dashboard API (dashboard-api.md)
