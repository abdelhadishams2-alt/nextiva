# Screen Spec: Connections

> **Route:** `/settings/connections`
> **Service:** Data Ingestion
> **Task:** T5-01
> **Type:** Form + Status
> **Priority:** P0
> **Spec Depth:** DEEP (target >= 8/10)

---

## 1. Overview

The Connections screen is the data foundation for the entire ChainIQ platform. Before any intelligence, recommendations, or performance tracking can happen, the user must connect their data sources. This screen manages OAuth 2.0 flows (with PKCE) for Google Search Console and Google Analytics 4, and API key entry for Semrush and Ahrefs. Each connection is represented as a platform card showing real-time health via colored StatusDot indicators, last sync timestamp, account identifiers, and quick actions.

The screen lives under Settings because connections are configured once and maintained infrequently, but their health is critical to every downstream feature. Without at least one connected data source, Content Inventory, Opportunities, and Performance screens have no data to display. This screen is therefore the first stop after onboarding for any new user, and the first troubleshooting destination when downstream screens appear empty or stale.

**TTG (Time-to-Goal) Reasoning:**

- **First visit (new user):** Eye goes to the three platform cards -- Google, Semrush, Ahrefs. All show gray StatusDot (disconnected) with prominent "Connect" button. The Google card is visually emphasized as the primary data source. The user clicks "Connect Google" which opens an OAuth consent popup. After granting access, they return to this screen and see a green StatusDot with property selection prompts for GSC and GA4.
- **100th visit (established user):** Glance at the three StatusDots -- all green. Last synced timestamps show "2h ago" or "6h ago." Efficient: nothing to do. The user leaves within 3 seconds unless a dot is yellow (expired token) or red (error), in which case they click "Reconnect" or expand the error detail.
- **Agency admin visit (Marcus persona):** Sees a client selector dropdown at the top (admin-only). Switches between clients, scanning for yellow/red dots. The health summary bar shows "14 of 15 clients healthy" and highlights the one that needs attention.

---

## 2. Primary Action

Connect a new data source. For Google: trigger OAuth 2.0 popup. For Semrush/Ahrefs: enter API key in an inline form. Secondary action: reconnect an expired or revoked connection.

---

## 3. Route & Layout

**Route:** `/settings/connections`
**Parent Layout:** Settings layout with sidebar navigation. Breadcrumb: Settings > Connections.
**Auth:** Authenticated. Any role can view and manage their own connections. Admin can view all team connections via client switcher.

### ASCII Wireframe

```
┌─────┬────────────────────────────────────────────────────────────────┐
│     │  Settings > Connections                                        │
│  S  │────────────────────────────────────────────────────────────────│
│  I  │                                                                │
│  D  │  ┌──── Health Summary Bar ─────────────────────────────────┐  │
│  E  │  │  ● 2 of 3 connected  |  Last sync: 2h ago  |  ⚠ 1 needs │
│  B  │  │  attention                                               │  │
│  A  │  └─────────────────────────────────────────────────────────┘  │
│  R  │                                                                │
│     │  ┌─ Google ──────────────────────────────────────────────┐    │
│     │  │  ● Connected                      [Test] [Disconnect] │    │
│     │  │  Account: nadia@bmwtuning.com                          │    │
│     │  │  GSC Property: sc-domain:bmwtuning.com  [Change]       │    │
│     │  │  GA4 Property: properties/384291053      [Change]      │    │
│     │  │  Last sync: 2h ago  |  Syncs: 847  |  Token: 22h left │    │
│     │  │  ┌ Sync History ──────────────────────────────────┐    │    │
│     │  │  │ GSC: ✓ 3h ago (2,847 rows)                    │    │    │
│     │  │  │ GA4: ✓ 3h ago (1,923 rows)                    │    │    │
│     │  │  └────────────────────────────────────────────────┘    │    │
│     │  └────────────────────────────────────────────────────────┘    │
│     │                                                                │
│     │  ┌─ Semrush ─────────────────────────────────────────────┐    │
│     │  │  ○ Disconnected                         [Connect]      │    │
│     │  │  Enter your Semrush API key to enable competitive      │    │
│     │  │  intelligence and keyword gap analysis.                │    │
│     │  │  [API Key...                    ] [Save]               │    │
│     │  └────────────────────────────────────────────────────────┘    │
│     │                                                                │
│     │  ┌─ Ahrefs ──────────────────────────────────────────────┐    │
│     │  │  ● Connected                      [Test] [Disconnect] │    │
│     │  │  Key: ****a7f2                                         │    │
│     │  │  Last sync: 6h ago  |  Syncs: 312                     │    │
│     │  └────────────────────────────────────────────────────────┘    │
│     │                                                                │
│     │  ┌─ Data Freshness ──────────────────────────────────────┐    │
│     │  │  GSC: 2h ago ████████████░░ (48h SLA)                  │    │
│     │  │  GA4: 3h ago ████████████░░ (48h SLA)                  │    │
│     │  │  Semrush: — (not connected)                            │    │
│     │  │  Ahrefs: 6h ago ███████████░░░ (48h SLA)               │    │
│     │  └────────────────────────────────────────────────────────┘    │
└─────┴────────────────────────────────────────────────────────────────┘
```

---

## 4. Navigation

| Origin | Action | Destination |
|--------|--------|-------------|
| Onboarding Wizard (step 3) | "Set up connections" | `/settings/connections` |
| Dashboard Home | Click stale-data banner | `/settings/connections` |
| Content Inventory (empty state) | "Connect GSC to get started" | `/settings/connections` |
| Opportunities (no-data state) | "Connect data sources" | `/settings/connections` |
| Sidebar | Settings > Connections | `/settings/connections` |
| This screen | OAuth callback redirect | `/settings/connections?status=connected` or `?error=...` |
| This screen | "View Sync Jobs" link | `/settings/connections#sync-history` (anchor scroll) |

---

## 5. Data Fields

| Field | Type | Source | Display | Notes |
|-------|------|--------|---------|-------|
| Provider | enum | `client_connections.provider` | Platform logo + name | google, semrush, ahrefs |
| Status | enum | `client_connections.status` | StatusDot + label | pending, connected, error, revoked, expired |
| Account ID | text | `client_connections.provider_account_id` | Google email, or key hint `****a7f2` | NEVER show full API key |
| GSC Property | text | `client_connections.gsc_property` | Inline editable Select | Only for Google connections |
| GA4 Property | text | `client_connections.ga4_property_id` | Inline editable Select | Only for Google connections |
| Last Sync | datetime | `client_connections.last_sync_at` | Relative time ("2h ago") | Tooltip shows absolute ISO |
| Last Error | text | `client_connections.last_error` | Red text below card | Only shown when status is error/revoked |
| Sync Count | integer | `client_connections.sync_count` | Subtle stat | Total successful syncs |
| Token Expiry | datetime | `client_connections.token_expires_at` | "22h left" countdown | Yellow when < 6h, red when < 1h |
| Data Freshness | computed | `client_connections.last_sync_at` vs now | Progress bar | Green < 24h, yellow 24-48h, red > 48h |
| Scopes | text[] | `client_connections.scopes` | Collapsible list | Show granted vs required scopes |

---

## 6. Component Tree

```
ConnectionsPage
├── Breadcrumb (shadcn/ui)
│   └── "Settings > Connections"
├── HealthSummaryBar (custom)
│   ├── StatusDot (custom) × connected count
│   ├── Text: "N of 3 connected"
│   ├── Text: "Last sync: Xh ago"
│   └── Badge (shadcn/ui): warning count if any
├── ConnectionCard (custom) × 3
│   ├── CardHeader
│   │   ├── ProviderLogo (custom) — SVG icon (Google, Semrush, Ahrefs)
│   │   ├── ProviderName — Text
│   │   ├── StatusDot (custom) — green/gray/yellow/red/orange
│   │   ├── StatusLabel — Badge (shadcn/ui)
│   │   └── ActionButtons
│   │       ├── Button "Test" (shadcn/ui) — connected state only
│   │       ├── Button "Disconnect" (shadcn/ui, destructive variant) — connected state only
│   │       ├── Button "Connect" (shadcn/ui, default variant) — disconnected state only
│   │       └── Button "Reconnect" (shadcn/ui, warning variant) — expired/revoked state only
│   ├── CardContent
│   │   ├── AccountInfo — provider_account_id display
│   │   ├── PropertySelector (Google only)
│   │   │   ├── Select (shadcn/ui) — GSC property dropdown
│   │   │   └── Select (shadcn/ui) — GA4 property dropdown
│   │   ├── ApiKeyForm (Semrush/Ahrefs only, disconnected state)
│   │   │   ├── Input (shadcn/ui, type="password") — API key entry
│   │   │   └── Button "Save" (shadcn/ui)
│   │   ├── SyncStats — last sync, sync count, token expiry countdown
│   │   └── ErrorDisplay — Alert (shadcn/ui, destructive) when status is error/revoked
│   └── CardFooter (collapsible)
│       └── SyncHistory — last 5 sync jobs with status, timestamp, row count
├── DataFreshnessPanel (custom)
│   └── FreshnessBar (custom) × 4 sources
│       ├── Label — source name
│       ├── Progress (shadcn/ui) — time since last sync vs 48h SLA
│       └── Text — relative time
├── AlertDialog (shadcn/ui) — disconnect confirmation
├── Dialog (shadcn/ui) — property selection for Google after first connect
└── Toast (shadcn/ui) — success/error notifications
```

**Component Inventory:**

| Component | Source | Notes |
|-----------|--------|-------|
| Card | shadcn/ui | Connection platform cards |
| Button | shadcn/ui | Connect, Disconnect, Test, Reconnect, Save |
| Badge | shadcn/ui | Status labels, warning counts |
| Input | shadcn/ui | API key entry (password type, masked) |
| Select | shadcn/ui | GSC/GA4 property selection dropdowns |
| AlertDialog | shadcn/ui | Disconnect confirmation ("This will stop all data syncs...") |
| Dialog | shadcn/ui | Post-OAuth property selection modal |
| Alert | shadcn/ui | Error messages, expired token warnings |
| Progress | shadcn/ui | Data freshness SLA bars |
| Skeleton | shadcn/ui | Card loading placeholders (3 skeleton cards) |
| Toast | shadcn/ui | "Connected successfully", "Connection failed" |
| Collapsible | shadcn/ui | Sync history expansion in card footer |
| StatusDot | Custom | 8px colored circle — green/gray/yellow/red/orange/blue |
| HealthSummaryBar | Custom | Aggregate connection health at page top |
| ProviderLogo | Custom | Google/Semrush/Ahrefs SVG icons, 32x32 |

---

## 7. States (8 states)

### 7.1 Loading State
```
Three skeleton cards with pulsing animation.
Each skeleton: rectangular card shape, gray shimmer for logo area, two text lines, one button.
HealthSummaryBar shows skeleton text.
DataFreshnessPanel hidden.
Duration: typically < 500ms (single API call to GET /api/connections).
```

### 7.2 Empty State (No Connections)
```
HealthSummaryBar: "0 of 3 connected — connect your first data source to get started"
Three cards, all showing gray StatusDot with "Disconnected" badge.
Google card visually promoted: larger, primary-colored border, pulsing "Connect Google" button.
Semrush and Ahrefs cards show muted description text:
  "Connect Semrush for competitive intelligence and keyword gap analysis"
  "Connect Ahrefs for backlink data and domain authority tracking"
DataFreshnessPanel hidden (no data to show).
Bottom CTA: "Need help? View our connection setup guide →"
```

### 7.3 Connecting State (OAuth Popup Open)
```
Google card shows "Connecting..." label with animated spinner replacing StatusDot.
"Connect Google" button becomes disabled with spinner.
Other cards remain interactive.
Overlay text below button: "Complete the sign-in in the popup window."
If popup is detected as blocked (window.open returns null):
  Alert (warning): "Popup blocked. Please allow popups for this site and try again."
  Button reverts to "Connect Google" (enabled).
Timeout: if no callback received within 5 minutes, revert to disconnected state with:
  Toast (warning): "Connection timed out. Please try again."
```

### 7.4 Connected State (All Healthy)
```
All applicable cards show green StatusDot with "Connected" badge (variant: success).
Account info visible: email for Google, key hint for Semrush/Ahrefs.
Google card shows selected GSC and GA4 properties with "Change" links.
Sync stats visible: "Last sync: 2h ago | Syncs: 847 | Token: 22h left"
Action buttons: "Test" and "Disconnect" visible, "Connect" hidden.
DataFreshnessPanel shows green progress bars for all connected sources.
HealthSummaryBar: "3 of 3 connected | Last sync: 2h ago | All healthy ✓"
```

### 7.5 Expired State (Token Expired)
```
Google card StatusDot turns yellow. Badge: "Expired" (variant: warning).
Alert (warning) inside card: "Your Google token has expired. Click Reconnect to re-authorize."
"Reconnect" button replaces "Test" button, styled with warning variant (amber).
Token expiry countdown: "Expired 3h ago" in red text.
HealthSummaryBar updates: "2 of 3 healthy | ⚠ 1 needs attention"
DataFreshnessPanel: Google row turns yellow, text: "Stale (last sync 26h ago)"
Other cards remain unaffected.
```

### 7.6 Error State (Connection Failed)
```
Affected card StatusDot turns red. Badge: "Error" (variant: destructive).
Alert (destructive) inside card with specific error message from last_error:
  "API access denied — verify that you have owner or full user access to this
   Search Console property."
"Reconnect" button visible. "Disconnect" button also visible (to remove broken connection).
HealthSummaryBar: "1 of 3 healthy | ❌ 1 error | ⚠ 1 expired"
Collapsible sync history in footer shows last 5 attempts with failure timestamps.
```

### 7.7 Revoked State
```
Google card StatusDot turns red. Badge: "Revoked" (variant: destructive).
Alert (destructive): "Google has revoked access to your account. This can happen when you
  change your Google password or remove ChainIQ from your Google security settings.
  Please reconnect to re-authorize."
"Reconnect" button triggers full OAuth flow (refresh token is deleted).
Emphasized: reconnecting will NOT lose historical data (performance_snapshots preserved).
```

### 7.8 Rate-Limited State
```
Affected card StatusDot turns orange. Badge: "Rate Limited" (variant: warning).
Alert (warning): "API rate limit reached. Data syncs are paused and will automatically
  resume in approximately 2h 15m."
"Test" button disabled with tooltip: "Unavailable during rate limiting"
Countdown timer shows estimated resume time (from metadata.retryAfter).
DataFreshnessPanel: affected source row turns orange with "Rate limited" label.
Sync history shows the rate-limited request with 429 status code.
```

---

## 8. Interactions (10 interactions)

### 8.1 Connect Google (OAuth Flow)
```
1. User clicks "Connect Google" button
2. Frontend calls GET /api/connections/google/auth
3. Server creates oauth_states row (state + code_verifier for PKCE)
4. Server returns 302 redirect to Google OAuth consent URL
5. Frontend opens OAuth URL in popup (window.open, 600x700)
6. User authenticates with Google, grants scopes
7. Google redirects popup to /api/connections/google/callback?code=...&state=...
8. Server validates state, exchanges code for tokens, encrypts, upserts client_connections
9. Server redirects popup to /settings/connections?status=connected
10. Frontend detects popup redirect via postMessage or polling, closes popup
11. Frontend refetches GET /api/connections, card updates to connected state
12. Property Selection Dialog opens automatically (BR-12: must select GSC/GA4 properties)
```

### 8.2 Connect Semrush/Ahrefs (API Key)
```
1. User clicks into API Key input on disconnected Semrush/Ahrefs card
2. User pastes API key (input type="password", masked with dots)
3. User clicks "Save" button
4. Frontend calls POST /api/connections/semrush (or /ahrefs) with { api_key }
5. Server validates key by making test API call to provider
6. If valid: server encrypts key, stores in client_connections, returns 201
7. Frontend shows Toast (success): "Semrush connected successfully"
8. Card updates: gray → green StatusDot, key hint shown (****a7f2)
9. If invalid: server returns 422, frontend shows Alert (destructive):
   "Invalid API key. Please check your key and try again."
10. Input field is highlighted with red border, key NOT cleared (user can edit and retry)
```

### 8.3 Select GSC/GA4 Properties
```
1. After Google OAuth, Property Selection Dialog opens automatically
2. Dialog fetches available GSC properties from Google API via server proxy
3. User selects GSC property from dropdown (e.g., "sc-domain:bmwtuning.com")
4. Dialog fetches available GA4 properties for the same Google account
5. User selects GA4 property from dropdown (e.g., "properties/384291053")
6. User clicks "Save Properties"
7. Frontend calls POST /api/connections/:id/property with { gsc_property, ga4_property_id }
8. Server updates client_connections, status changes from pending to connected
9. Toast (success): "Properties configured. Starting initial data pull..."
10. Server auto-triggers first-connect triage (BR-11): GSC 90d + GA4 90d + crawl
```

### 8.4 Test Connection
```
1. User clicks "Test" button on a connected card
2. Button enters loading state (spinner, disabled)
3. Frontend calls POST /api/connections/:id/refresh (verifies token validity)
4. Server attempts token refresh (Google) or test API call (Semrush/Ahrefs)
5. Success: Toast (success): "Connection verified. Token refreshed."
   Button reverts to idle. Last sync timestamp updates if data was pulled.
6. Failure: Toast (destructive): "Connection test failed: [error message]"
   Card status may change to expired/error depending on failure type.
   Button reverts to idle.
7. Duration: typically 1-3 seconds. Timeout at 10 seconds with error Toast.
```

### 8.5 Disconnect
```
1. User clicks "Disconnect" on a connected card
2. AlertDialog opens: "Disconnect [Provider]?"
   Body: "This will stop all data syncs from [Provider]. Your existing data
   (performance history, inventory) will be preserved but will become stale.
   You can reconnect at any time."
   [Cancel] [Disconnect] — Disconnect button is destructive variant
3. User confirms by clicking "Disconnect"
4. Frontend calls DELETE /api/connections/:id
5. Server revokes tokens (Google revocation endpoint), deletes row
6. Toast (success): "Google disconnected. Historical data preserved."
7. Card reverts to disconnected state (gray StatusDot, "Connect" button)
8. HealthSummaryBar updates count
```

### 8.6 Reconnect Expired/Revoked
```
1. User clicks "Reconnect" on an expired or revoked card
2. For Google: triggers full OAuth flow (same as 8.1, but upserts existing row)
3. For Semrush/Ahrefs: reveals API key input (card expands to show form)
4. After successful reconnection:
   - Token expiry reset, status → connected, last_error → null
   - Toast: "Reconnected successfully. Triggering data sync..."
   - Auto-triggers an immediate data pull for the reconnected source
5. Historical data (performance_snapshots) is NOT lost during reconnection
```

### 8.7 Change GSC/GA4 Property
```
1. User clicks "Change" link next to GSC or GA4 property
2. Select dropdown opens with available properties (fetched from Google API)
3. User selects new property
4. Frontend calls POST /api/connections/:id/property with updated values
5. Toast: "Property updated. Re-syncing data for new property..."
6. Warning: changing property clears performance_snapshots for the old property
   AlertDialog confirms: "This will clear historical data for the previous property."
```

### 8.8 Expand Sync History
```
1. User clicks the collapsible trigger in card footer (chevron icon)
2. CardFooter expands with slide-down animation (200ms ease-out)
3. Shows last 5 ingestion_jobs for this connection:
   Row: [status icon] [source] [timestamp] [rows processed] [duration]
   Example: ✓ GSC  3h ago  2,847 rows  12s
            ✓ GA4  3h ago  1,923 rows  8s
            ✗ GSC  27h ago  0 rows  — (Token expired)
4. Click again to collapse. State is NOT persisted across page loads.
```

### 8.9 View Data Freshness Detail
```
1. DataFreshnessPanel shows Progress bars for each connected source
2. Hover over a progress bar to see tooltip with exact timestamps:
   "Last sync: March 28, 2026 07:15 UTC — Next scheduled: March 29, 2026 03:00 UTC"
3. Click on a yellow/red bar to scroll to the corresponding connection card
4. SLA thresholds: green < 24h, yellow 24-48h, red > 48h (matches BR-08)
```

### 8.10 Manual Sync Trigger
```
1. User clicks "Sync Now" link in sync stats area (visible only for connected sources)
2. Frontend calls POST /api/ingestion/trigger/:source
3. Toast: "Sync triggered for GSC. This may take a few minutes."
4. Card shows syncing state: spinner on last-sync timestamp, "Syncing..." text
5. Frontend polls GET /api/ingestion/status every 5 seconds until complete
6. On complete: last_sync_at updates, spinner stops, rows_processed shown in toast
7. Rate limited (429): Toast (warning): "Sync limit reached (5/hour). Try again later."
```

---

## 9. Keyboard Navigation

| Key | Context | Action |
|-----|---------|--------|
| `Tab` | Page load | Focus moves: HealthSummaryBar → Google card → Google actions → Semrush card → Semrush actions → Ahrefs card → Ahrefs actions → DataFreshnessPanel |
| `Enter` | Focused on "Connect" button | Triggers OAuth flow or reveals API key form |
| `Enter` | Focused on "Disconnect" button | Opens AlertDialog confirmation |
| `Escape` | AlertDialog open | Closes dialog, returns focus to trigger button |
| `Escape` | Property Selection Dialog open | Closes dialog (with confirmation if changes unsaved) |
| `Space` | Focused on collapsible trigger | Toggles sync history expansion |
| `Tab` | Inside API key form | Moves focus: input → Save button |
| `Enter` | Focused on Save button | Submits API key form |
| `Arrow Up/Down` | Inside Select dropdown | Navigate property options |

---

## 10. Mobile Behavior

- **Breakpoint: < 768px** — Cards stack vertically in single column (already vertical on desktop, but remove horizontal padding)
- **Card layout:** Full-width cards with all content preserved. No content truncation.
- **Action buttons:** Stack vertically inside card header on < 480px screens. "Connect" button becomes full-width.
- **Property Selection Dialog:** Becomes a bottom sheet (Sheet component) instead of centered dialog. Easier to reach with thumb.
- **API key input:** Full-width with larger touch target (min 44px height per WCAG).
- **DataFreshnessPanel:** Horizontal progress bars become vertical layout with stacked labels.
- **Sync history:** Collapsible remains functional; table rows wrap to two lines on narrow screens.
- **OAuth popup:** On mobile browsers that block popups, fallback to redirect flow (same tab). Detect via `window.open` returning null, then use `window.location.href` for OAuth URL. Return URL includes `/settings/connections` with query params.

---

## 11. Accessibility (WCAG 2.1 AA)

- **StatusDot:** NEVER conveys meaning through color alone. Every dot has an adjacent text label ("Connected", "Expired", "Error"). `aria-label` on the dot itself: `aria-label="Connection status: connected"`.
- **Card structure:** Each ConnectionCard is a `<section>` with `aria-labelledby` pointing to the provider name heading (h2).
- **Progress bars:** DataFreshnessPanel progress bars have `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="48"`, `aria-label="GSC data freshness: 2 hours since last sync"`.
- **AlertDialog:** Uses `role="alertdialog"`, `aria-describedby` pointing to the confirmation text. Focus trapped inside dialog. Returns focus to trigger on close.
- **Toast notifications:** Use `role="status"` with `aria-live="polite"` for success messages, `role="alert"` with `aria-live="assertive"` for errors.
- **API key input:** `type="password"` for masking. Associated `<label>` element. `aria-describedby` pointing to helper text ("Enter your Semrush API key from Settings > API > Access").
- **Loading states:** Skeleton cards have `aria-busy="true"` on the parent container. Screen reader announcement: "Loading connections..."
- **Color contrast:** All text meets 4.5:1 minimum contrast ratio against dark background. StatusDot colors are WCAG AA compliant on dark theme (green #22c55e, yellow #eab308, red #ef4444, orange #f97316 against zinc-900 background).
- **Focus indicators:** Visible focus ring (2px solid ring-offset-2) on all interactive elements. High contrast against dark background.
- **Keyboard operability:** All actions achievable via keyboard only. No mouse-only interactions. OAuth popup keyboard-accessible via Enter on Connect button.

---

## 12. Error Handling

| Error Scenario | HTTP Code | User-Facing Message | Recovery Action |
|----------------|-----------|---------------------|-----------------|
| OAuth popup blocked | N/A (client) | "Popup blocked by your browser. Please allow popups for this site in your browser settings and try again." | Show browser-specific instructions link. Fallback to redirect flow. |
| OAuth user denied | callback `?error=access_denied` | "You chose not to grant access. You can try again whenever you're ready." | "Connect Google" button re-enabled. No error badge on card. |
| OAuth state mismatch (CSRF) | 403 | "Security validation failed. Please try connecting again." | Clear stale oauth_states. Re-enable Connect button. |
| Google token exchange failed | 502 | "Google's servers didn't respond. Please try again in a few minutes." | Retry button. Auto-retry after 30 seconds (once). |
| Invalid API key (Semrush/Ahrefs) | 422 | "This API key is invalid. Please check the key in your [Provider] account settings." | Input highlighted red. Key not cleared. Link to provider's API settings page. |
| Connection already exists | 409 | "You already have a Google connection. Disconnect the existing one first to connect a different account." | Link to existing connection card. |
| Token refresh failed | 502 | "Could not refresh your Google token. This may be temporary." | "Retry" and "Reconnect" buttons. Auto-retry in 1h, 6h per BR-01. |
| Token revoked by Google | 400 `invalid_grant` | "Google has revoked access. This happens when you change your password or remove app access in Google settings." | "Reconnect" button (full re-auth required). Refresh token deleted. |
| Network timeout | N/A (client) | "Connection timed out. Check your internet connection and try again." | Retry button. Client-side retry after 5 seconds (once). |
| Rate limit on manual sync | 429 | "You've reached the sync limit (5 per hour). Syncs will resume automatically at [time]." | Show countdown to next available sync. |
| Crawl already running | 409 | "A crawl is already in progress. Wait for it to finish or cancel it first." | Link to active crawl progress. |
| Server unreachable (bridge down) | 0 / ECONNREFUSED | "Cannot reach the server. Please ensure the bridge server is running on port 19847." | Retry button. Link to troubleshooting docs. |

---

## 13. Edge Cases (7 cases)

1. **OAuth popup opened but user closes browser tab before completing:** The `oauth_states` row remains in the database. Cleanup job purges states older than 10 minutes (index on `created_at`). User can retry immediately — a new state row is created. No dangling data.

2. **Google connection in "pending" status (OAuth complete, but no property selected):** StatusDot is blue (pending-verification). Card shows Property Selection Dialog prompt with animated border. Scheduler skips this connection (BR-12). HealthSummaryBar counts it as "needs setup" not "connected." The user cannot trigger manual syncs until properties are selected.

3. **User connects Google with insufficient scopes (only GSC, not GA4):** Scopes field shows granted scopes. If `analytics.readonly` is missing, GA4 property dropdown is disabled with message: "GA4 access was not granted. Reconnect and approve all permissions to enable analytics data." GSC works independently.

4. **Multiple browser tabs open during OAuth flow:** The `state` parameter in `oauth_states` is unique per flow. Only the tab whose popup successfully completes the callback will update the connection. Other tabs detect the change on their next `GET /api/connections` poll (5-second interval during connecting state) and update their UI.

5. **API key pasted with leading/trailing whitespace:** Frontend trims whitespace before submission. Server also trims on receipt. No validation error for accidental spaces.

6. **User disconnects Google while a crawl is actively running:** The crawl uses already-fetched sitemap data (no ongoing API calls to Google). Crawl completes normally. However, subsequent sync jobs for GSC/GA4 will fail because the connection no longer exists. The crawl_session's inventory data is preserved.

7. **Token expires during an active data sync:** The connector detects 401, calls `GoogleOAuth.refreshToken()` mid-sync. If refresh succeeds, the request is retried transparently. If refresh fails, the job is marked `failed`, connection status changes to `expired`, and the user sees the yellow expired state on next page visit. Partial data from the sync is preserved (atomic per-URL, not per-job).

---

## 14. Data Sources (API Endpoints Called)

| Action | Endpoint | Method | When |
|--------|----------|--------|------|
| Load connections | `GET /api/connections` | GET | Page mount, after OAuth callback, after disconnect |
| Get connection status | `GET /api/connections/status` | GET | Page mount (parallel with connections), poll every 60s |
| Start Google OAuth | `GET /api/connections/google/auth` | GET | Click "Connect Google" |
| OAuth callback | `GET /api/connections/google/callback` | GET | Popup redirect from Google |
| Connect Semrush | `POST /api/connections/semrush` | POST | Click "Save" on Semrush API key form |
| Connect Ahrefs | `POST /api/connections/ahrefs` | POST | Click "Save" on Ahrefs API key form |
| Disconnect | `DELETE /api/connections/:id` | DELETE | Confirm disconnect dialog |
| Test / Refresh token | `POST /api/connections/:id/refresh` | POST | Click "Test Connection" |
| Set properties | `POST /api/connections/:id/property` | POST | Save in property selection dialog |
| Get ingestion status | `GET /api/ingestion/status` | GET | DataFreshnessPanel, poll every 60s |
| Manual sync trigger | `POST /api/ingestion/trigger/:source` | POST | Click "Sync Now" |

**Polling strategy:** On page mount, fetch connections + status in parallel. After that, poll `GET /api/connections/status` every 60 seconds for freshness updates. During connecting state (OAuth popup open), poll `GET /api/connections` every 5 seconds to detect completion. During syncing state (manual trigger), poll `GET /api/ingestion/status` every 5 seconds until job completes.

---

## 15. Performance

- **Initial load:** Single API call to `GET /api/connections` (< 100ms server-side, returns max 3 rows). Parallel call to `GET /api/connections/status` for freshness data. Total: < 300ms perceived load time.
- **Polling:** 60-second interval for status checks. Each poll is < 50ms server-side. No WebSocket needed — connection status changes are infrequent (hours, not seconds).
- **OAuth flow:** Popup opens within 100ms of click. Google consent screen load time depends on Google's servers (typically 1-2s). Callback processing: < 500ms (token exchange + encryption + DB write).
- **API key validation:** Semrush/Ahrefs test calls take 1-3 seconds. Show spinner during validation. Timeout at 10 seconds.
- **Property list fetch:** Google Sites API returns property list in < 1 second. Cache for 5 minutes client-side (properties don't change frequently).
- **No heavy renders:** Page has max 3 cards + 1 summary bar + 1 freshness panel. No virtualization needed. No DataTable. No pagination.
- **Bundle impact:** Custom components (StatusDot, HealthSummaryBar, ProviderLogo) are < 5KB combined. shadcn/ui components are tree-shaken. Total page JS: < 40KB gzipped.

---

## 16. Dependencies

- **Blocks:** Content Inventory (screen 10), Opportunities (screen 11), Performance (screen 14) — all require at least one connection
- **Blocked by:** Login/Signup (screen 1), Onboarding Wizard (screen 7), Data Ingestion Service (service 7)
- **Service:** Data Ingestion (`data-ingestion.md`) — all OAuth, connection, and ingestion endpoints
- **Shared components:** StatusDot (also used in Dashboard Home, Content Inventory sidebar badge)
