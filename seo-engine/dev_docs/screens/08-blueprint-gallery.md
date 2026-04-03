# Screen Spec: Blueprint Gallery

> **Route:** `/blueprints`
> **Service:** Dashboard API
> **Task:** T3-03
> **Type:** Gallery / Browse
> **Priority:** P2

---

## 1. Overview

Visual browser for the 193 structural component blueprints that ChainIQ uses to build articles. Users can search, filter by category, and preview blueprint specifications. Primarily informational — helps users understand what components are available for article generation.

---

## 2. Screen Type

Gallery / Grid with search and category filtering.

---

## 3. ASCII Wireframe

```
┌─────┬───────────────────────────────────────────────────────────┐
│     │  Component Blueprints (193)              [Search...    ]  │
│  S  │───────────────────────────────────────────────────────────│
│  I  │  [All] [Hero] [Content] [Media] [Navigation] [Data] ...  │
│  D  │───────────────────────────────────────────────────────────│
│  E  │                                                           │
│  B  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  A  │  │ ░░░░░░░░ │ │ ░░░░░░░░ │ │ ░░░░░░░░ │ │ ░░░░░░░░ │   │
│  R  │  │ ░░░░░░░░ │ │ ░░░░░░░░ │ │ ░░░░░░░░ │ │ ░░░░░░░░ │   │
│     │  │ Hero     │ │ Feature  │ │ Stats    │ │ Timeline │   │
│     │  │ Banner   │ │ Grid     │ │ Counter  │ │ Vertical │   │
│     │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│     │                                                           │
│     │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│     │  │ ░░░░░░░░ │ │ ░░░░░░░░ │ │ ░░░░░░░░ │ │ ░░░░░░░░ │   │
│     │  │ ░░░░░░░░ │ │ ░░░░░░░░ │ │ ░░░░░░░░ │ │ ░░░░░░░░ │   │
│     │  │ Card     │ │ Quote    │ │ CTA      │ │ Gallery  │   │
│     │  │ Stack    │ │ Block    │ │ Banner   │ │ Masonry  │   │
│     │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│     │                                                           │
│     │  Showing 1-12 of 193              [← 1 2 3 ... 17 →]   │
└─────┴───────────────────────────────────────────────────────────┘
```

---

## 4. Data Fields

| Field | Source | Display |
|-------|--------|---------|
| Name | Component registry | Card title |
| Category | Component registry | Filter tag |
| Description | Component registry | Card subtitle (truncated) |
| Preview | ASCII/structural mockup | Card thumbnail area |
| Usage Count | Analytics | "Used in N articles" |

---

## 5. Component Inventory

| Component | Source | Notes |
|-----------|--------|-------|
| Card | shadcn/ui | Blueprint card with preview area |
| Input | shadcn/ui | Search with debounce |
| ToggleGroup | shadcn/ui | Category filter tabs |
| Pagination | shadcn/ui | Page navigation |
| Sheet | shadcn/ui | Blueprint detail slide-out |
| Badge | shadcn/ui | Category tags |
| ScrollArea | shadcn/ui | Category filter horizontal scroll |

---

## 6. States (8 total)

### Loading State
```
Category tabs visible. Grid shows 12 skeleton cards with pulse animation.
Search disabled.
```

### Error State
```
Alert: "Unable to load component blueprints."
Retry button. This should rarely fail since data is from local config file.
```

### Empty State — No Search Results
```
Grid area: "No blueprints matching '{query}'. Try different keywords."
[Clear Search] button. Category filter remains visible.
```

### Data-Present State
```
Grid of blueprint cards (4 columns desktop, 2 tablet, 1 mobile).
Each card: structural preview, name, category badge, usage count.
Active category tab highlighted.
```

### Filtered State
```
Category tab active (e.g., "Hero"). Grid shows only matching blueprints.
Count updates: "Showing 1-8 of 15 Hero components"
```

### Detail Sheet State
```
Slide-out from right showing full blueprint spec:
- Name, category, description
- Structural HTML/CSS pattern
- Recommended usage contexts
- Articles that use this blueprint
- Adaptation notes per framework
```

### Search Active State
```
Search input has value, results update live.
Match highlighting in card titles.
Category filter resets to "All" during search.
```

### No Blueprints State (edge case — shouldn't happen)
```
"No component blueprints found. The structural-component-registry.md file may be missing."
Link to documentation for restoring the file.
```

---

## 7. Interactions

1. **Search** → debounced (300ms) → filter blueprints by name/description
2. **Click category tab** → filter grid to category → update count
3. **Click blueprint card** → open detail sheet from right
4. **Paginate** → load next/previous page of blueprints
5. **Close detail sheet** → return to grid view

---

## 8. Mobile Behavior

- Grid: 1 column on mobile, 2 on tablet, 4 on desktop
- Category tabs: horizontally scrollable
- Detail sheet: full screen on mobile
- Search: full width, always visible

---

## 9. Accessibility

- Card grid uses `role="list"` with `role="listitem"` per card
- Search results count announced via `aria-live`
- Category tabs use `role="tablist"` semantics
- Detail sheet has focus trap and Escape-to-close
- Cards are keyboard-navigable with Enter to open

---

## 10. Edge Cases

1. **193 blueprints on slow connection** → paginate, don't load all at once
2. **Blueprint with no description** → show "No description available"
3. **Category with 0 blueprints** → hide category tab (don't show empty category)
4. **Very long blueprint name** → truncate at 30 chars with tooltip
5. **Component registry file missing** → graceful error with recovery instructions

---

## 11. Dependencies

- **Blocks:** Nothing
- **Blocked by:** Dashboard API config/blueprints endpoints
- **Service:** Dashboard API (dashboard-api.md)
- **Data source:** `config/structural-component-registry.md` (PROTECTED)
