# Screen Spec: Plugin Configuration

> **Route:** `/settings`
> **Service:** Dashboard API
> **Task:** T2-09
> **Type:** Form / Settings
> **Priority:** P1
> **Access:** Admin only

---

## 1. Overview

Admin settings page for configuring ChainIQ's plugin behavior. Organized into tabbed sections: General, API Keys, Agent Settings, and Advanced. Changes apply immediately after save.

---

## 2. Screen Type

Form / Settings with tabbed sections.

---

## 3. ASCII Wireframe

```
┌─────┬───────────────────────────────────────────────────────────┐
│     │  Settings                                    [Save]       │
│  S  │───────────────────────────────────────────────────────────│
│  I  │  [General] [API Keys] [Agents] [Advanced]                 │
│  D  │  ─────────────────────────────────────────────           │
│  E  │                                                           │
│  B  │  General Settings                                         │
│  A  │  ┌─────────────────────────────────────────────────────┐ │
│  R  │  │  Default Language                                   │ │
│     │  │  [English           ▾]                              │ │
│     │  │                                                     │ │
│     │  │  Default Framework                                  │ │
│     │  │  [HTML (Standalone)  ▾]                              │ │
│     │  │                                                     │ │
│     │  │  Images Per Article                                 │ │
│     │  │  [4-6 ▾]                                            │ │
│     │  │                                                     │ │
│     │  │  Bridge Server Port                                 │ │
│     │  │  [19847          ]                                  │ │
│     │  └─────────────────────────────────────────────────────┘ │
│     │                                                           │
│     │  [Unsaved changes]                          [Save]       │
└─────┴───────────────────────────────────────────────────────────┘
```

---

## 4. Data Fields

### General Tab
| Field | Type | Default | Validation |
|-------|------|---------|------------|
| Default Language | select | English | One of supported languages |
| Default Framework | select | HTML | One of: html, react, vue, svelte, wordpress |
| Images Per Article | select | 4-6 | Range: 2-8 |
| Bridge Server Port | number | 19847 | 1024-65535 |

### API Keys Tab
| Field | Type | Display | Notes |
|-------|------|---------|-------|
| Supabase URL | url | Full URL visible | Read from env, display only |
| Supabase Anon Key | text | Masked (last 8 chars visible) | Read from env, display only |
| Service Role Key | text | Masked ("••••••••") | Status indicator (configured/missing) |

### Agents Tab
| Field | Type | Default | Validation |
|-------|------|---------|------------|
| Research Rounds | number | 6 | 3-10 |
| Research Provider | select | Gemini MCP | gemini_mcp, websearch |
| Max Edit Duration | number | 600 | 60-1800 seconds |
| Edit Stdout Limit | number | 4 | 1-16 MB |

### Advanced Tab
| Field | Type | Default | Validation |
|-------|------|---------|------------|
| Rate Limit | number | 100 | 10-1000 requests/minute |
| Auth Cache TTL | number | 30 | 0-300 seconds |
| Log Level | select | info | debug, info, warn, error |
| CORS Origins | text | * | Comma-separated URLs or * |

---

## 5. Component Inventory

| Component | Source | Notes |
|-----------|--------|-------|
| Tabs | shadcn/ui | 4 setting tabs |
| Form | react-hook-form + zod | Validation per tab |
| Input | shadcn/ui | Text and number fields |
| Select | shadcn/ui | Dropdowns |
| Switch | shadcn/ui | Toggle settings |
| Button | shadcn/ui | Save button with loading state |
| Alert | shadcn/ui | Unsaved changes warning |
| Badge | shadcn/ui | Key status (configured/missing) |
| Separator | shadcn/ui | Section dividers |

---

## 6. States (8 total)

### Loading State
```
Tabs visible but disabled. Form area shows skeleton inputs.
Save button disabled.
```

### Error State — Load Failed
```
Alert: "Unable to load configuration. Check bridge server."
Retry button.
```

### Error State — Save Failed
```
Toast (destructive): "Failed to save settings. {error_message}"
Form retains changed values for retry.
```

### Data-Present State — Clean
```
All fields populated with current values.
Save button disabled (no changes).
No "unsaved changes" indicator.
```

### Data-Present State — Dirty (Unsaved)
```
Modified fields highlighted with subtle border change.
"Unsaved changes" badge appears near Save button.
Save button enabled.
Navigating away triggers confirmation dialog.
```

### Saving State
```
Save button shows spinner + "Saving..."
All fields disabled during save.
```

### Success State
```
Toast: "Settings saved successfully."
"Unsaved changes" badge removed.
Save button returns to disabled state.
```

### API Keys — Missing Key State
```
Service Role Key shows red "Not configured" badge.
Warning Alert: "Service role key is required for admin operations."
Link to setup documentation.
```

---

## 7. Interactions

1. **Modify any field** → mark form as dirty → show "unsaved changes" → enable Save
2. **Click Save** → validate all fields → PUT /api/config → success toast
3. **Switch tabs** → preserve unsaved changes across tabs
4. **Navigate away with unsaved changes** → confirmation dialog "You have unsaved changes"
5. **Reset changes** → "Reset" link returns all fields to last-saved values
6. **Click masked API key** → no action (display only, cannot copy secret from dashboard)

---

## 8. Mobile Behavior

- Tabs become horizontally scrollable
- Form fields stack vertically (full width)
- Save button becomes fixed bottom bar
- API key display truncates further on small screens

---

## 9. Accessibility

- Tab navigation via arrow keys
- Form fields have associated labels and help text
- "Unsaved changes" announced via `aria-live`
- Save confirmation via toast with `role="status"`
- Disabled fields have `aria-disabled` with explanation

---

## 10. Edge Cases

1. **Invalid port number** → inline validation error, prevent save
2. **Environment variables missing** → API Keys tab shows clear "Not configured" state
3. **Settings file not writable** → save error with specific message
4. **Concurrent admin changes** → last-write-wins (no real-time sync in Phase 1)
5. **Reset to defaults** → "Reset to Defaults" button in Advanced tab with confirmation

---

## 11. Dependencies

- **Blocks:** Nothing
- **Blocked by:** Login/Signup, Dashboard API config endpoints
- **Service:** Dashboard API (dashboard-api.md)
