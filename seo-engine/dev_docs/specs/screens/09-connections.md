# Screen 09: Connections

> **Route:** `/settings/connections`
> **Service:** Data Ingestion
> **Type:** Settings + Status
> **Complexity:** L (4-8h)
> **Priority:** P0
> **Real-time:** No (polling on 60s interval for status refresh)
> **Last Updated:** 2026-03-28

---

## 1. Purpose

The Connections screen is the data pipeline control center — the single place where users manage all external data source integrations that feed ChainIQ's intelligence layers. It provides OAuth flows for Google (GSC + GA4), API key entry for Semrush and Ahrefs, connection health monitoring, property selection, and sync status visibility. Without functional connections, the entire Content Intelligence, Voice Intelligence, and Feedback Loop layers receive no data.

**Success metric:** Time-to-first-data < 5 minutes from clicking "Connect Google Account" to first successful GSC data pull appearing in the Content Inventory.

---

## 2. User Stories

| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|------------|----------|
| C-01 | Client admin (Nadia) | Connect my Google account with one click | GSC and GA4 data flows into ChainIQ automatically | Must |
| C-02 | Client admin | Select which GSC property and GA4 property to use | ChainIQ pulls data for the correct website | Must |
| C-03 | Client admin | See connection health at a glance (green/yellow/red) | I know if my data pipeline is working without digging | Must |
| C-04 | Client admin | Reconnect an expired token with one click | I don't have to disconnect and re-authorize from scratch | Must |
| C-05 | Agency admin (Marcus) | Add Semrush/Ahrefs API keys | Competitive intelligence data enriches my content analysis | Should |
| C-06 | Client admin | See when each source last synced and how many rows pulled | I trust the data is fresh and complete | Should |
| C-07 | Client admin | Disconnect a provider with confirmation | I can revoke access without accidental data loss | Must |
| C-08 | Client admin | See next scheduled sync time | I know when fresh data will arrive | Could |
| C-09 | New user | Get guided setup for my first connection | I don't feel lost on first visit | Must |

---

## 3. Layout & Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│ Settings > Connections                                       │
│                                                             │
│ ┌─── Connection Overview Bar ───────────────────────────┐   │
│ │ ● Google (Connected)  ● Semrush (Not Set Up)          │   │
│ │ ● GA4 (Connected)     ● Ahrefs (Not Set Up)           │   │
│ │ Next sync: 3:00 AM UTC (in 6 hours)                   │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─── Google Search Console ─────────────────────────────┐   │
│ │ ● Connected          user@example.com                  │   │
│ │                                                       │   │
│ │ GSC Property: [sc-domain:example.com        ▼]        │   │
│ │ GA4 Property: [example.com - GA4 (384291053) ▼]       │   │
│ │                                                       │   │
│ │ Last sync: 6 hours ago  │  348 rows  │  ··●●●●●●●●·  │   │
│ │                                                       │   │
│ │ [Refresh Token]  [Change Account]  [Disconnect]       │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─── Semrush ───────────────────────────────────────────┐   │
│ │ ○ Not connected                                       │   │
│ │                                                       │   │
│ │ Semrush enriches your content analysis with           │   │
│ │ competitive keyword data and traffic estimates.       │   │
│ │                                                       │   │
│ │ API Key: [Enter your Semrush API key...    ] [Save]   │   │
│ │                                                       │   │
│ │ ℹ Find your API key at semrush.com/api                │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─── Ahrefs ────────────────────────────────────────────┐   │
│ │ (same pattern as Semrush)                             │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─── Sync History ──────────────────────────────────────┐   │
│ │ Today 3:00 AM  │ GSC   │ ● Success │ 1,247 rows      │   │
│ │ Today 3:01 AM  │ GA4   │ ● Success │ 892 rows        │   │
│ │ Yesterday      │ GSC   │ ● Success │ 1,198 rows      │   │
│ │ Yesterday      │ Ahrefs│ ● Failed  │ Rate limited    │   │
│ │ [Show more...]                                        │   │
│ └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Responsive behavior:** On mobile (<768px), connection cards stack vertically. The overview bar wraps to 2 rows. Property dropdowns become full-width. Sync history becomes a scrollable list with condensed rows.

---

## 4. Component Tree

```
ConnectionsPage
├── PageHeader (breadcrumb: Settings > Connections)
├── ConnectionOverviewBar
│   ├── StatusDot (×4, one per provider)
│   ├── NextSyncCountdown
│   └── AlertBanner (if any connection has issues)
├── GoogleConnectionCard
│   ├── CardHeader (status dot + provider name + email)
│   ├── PropertySelector (GSC dropdown)
│   ├── PropertySelector (GA4 dropdown)
│   ├── SyncStatusRow
│   │   ├── RelativeTimestamp ("6 hours ago")
│   │   ├── RowCount ("348 rows")
│   │   └── SyncSparkline (30-day mini chart)
│   └── ActionButtons
│       ├── Button ("Refresh Token")
│       ├── Button ("Change Account")
│       └── Button ("Disconnect", destructive variant)
├── ApiKeyConnectionCard (Semrush)
│   ├── CardHeader (status dot + provider name)
│   ├── ValueProposition (when not connected)
│   ├── ApiKeyInput (masked, trim whitespace)
│   ├── ValidationStatus (checking/valid/invalid)
│   └── ActionButtons
│       ├── Button ("Save" / "Update Key")
│       └── Button ("Disconnect", destructive variant)
├── ApiKeyConnectionCard (Ahrefs)
│   └── (same structure as Semrush)
├── SyncHistorySection
│   ├── SyncHistoryRow (×N, last 20 jobs)
│   │   ├── Timestamp
│   │   ├── ProviderBadge
│   │   ├── StatusBadge (success/failed/running)
│   │   └── RowCount / ErrorMessage
│   └── ShowMoreButton
└── DisconnectConfirmDialog
    ├── WarningIcon
    ├── ConsequencesList
    ├── ConfirmButton (destructive)
    └── CancelButton
```

**Component count:** 15 distinct components (exceeds 5 minimum).

---

## 5. States

### 5.1 Loading State
Skeleton layout matching the final structure: 4 rectangular card skeletons with pulsing animation. The overview bar shows 4 gray dots. No spinners — skeleton cards maintain spatial layout so the page doesn't shift when data arrives. Duration: typically <500ms (single API call to `/api/connections`).

### 5.2 Empty State (No Connections)
All four provider cards show "Not connected" with gray status dots. The Google card is visually emphasized (larger, top position, subtle border glow) with a prominent "Connect Google Account" CTA button. A banner at the top reads: "Connect your data sources to unlock content intelligence. Start with Google — it's the foundation for everything else." The Semrush/Ahrefs cards show brief value propositions explaining what each integration adds. No sync history section is shown (hidden when empty).

### 5.3 Partial State (Some Connected)
Connected providers show green dots with sync info. Unconnected providers show setup UIs. The overview bar reflects the mixed state. A progress indicator shows "2 of 4 connected — add Semrush for competitive insights."

### 5.4 All Connected State
All four dots green. Cards are collapsed by default (show only status line + last sync). Click to expand for property selection, action buttons, and sync details. Overview bar shows "All systems operational" with next sync countdown. This is the 100th-visit efficiency mode — scan in 2 seconds, leave.

### 5.5 Error State (API Failure)
If the `/api/connections` endpoint itself fails: full-page error card with "Unable to load connections" message, a retry button, and a link to check bridge server status. If a specific provider has an error: that card shows orange/red status with the `last_error` message inline, while other cards remain functional.

### 5.6 Token Expired State
Google card shows orange "Expired" badge replacing the green dot. The email and property selections remain visible (user context preserved). A prominent "Reconnect" button appears. Text explains: "Your Google access token has expired. Click Reconnect to re-authorize — your property selections will be preserved."

### 5.7 OAuth In-Progress State
After clicking "Connect Google Account," the card dims slightly, shows a loading spinner in the button, and text reads "Waiting for Google authorization..." A "Cancel" link appears below. If the user returns without completing OAuth (closes Google's tab), the state reverts after 10 minutes when the oauth_states row expires.

### 5.8 Property Selection Required State
Google shows green "Connected" but with an amber warning: "Select your GSC and GA4 properties to start syncing data." Property dropdowns are populated from Google API. Until both are selected, no data syncs. A "Confirm Properties" button saves the selection.

### 5.9 API Key Validation In-Progress
Semrush/Ahrefs card shows the input field disabled with a spinner inside the "Save" button. Text reads "Validating your API key..." Takes 2-5 seconds (real API call to verify the key works).

### 5.10 API Key Invalid
Input field shows red border. Inline error below: "This API key is invalid or has insufficient permissions. Check your Semrush dashboard for the correct key." The key remains in the input for the user to edit (not cleared).

### 5.11 Disconnecting (Confirmation)
Modal dialog: "Disconnect Google Account? This will: (1) Stop all GSC and GA4 data syncing, (2) Remove stored tokens, (3) NOT delete previously imported data. You can reconnect anytime." Two buttons: "Cancel" (default focus) and "Disconnect" (red, destructive).

### 5.12 Data Stale Warning
If `last_sync_at` for any provider is >48 hours ago, that card shows a yellow warning badge: "Last synced 3 days ago — data may be outdated." If the reason is known (rate limit, API outage), the error is shown. A "Sync Now" manual trigger button appears.

### 5.13 Rate Limited
Sync history shows a failed row with "Rate limited by [provider] — automatic retry in 4 hours." No user action needed. Status dot stays green (transient error, not a connection problem).

### 5.14 Permission Denied (Read-Only)
Non-admin users see all connection statuses but action buttons are disabled with tooltip: "Only account administrators can manage connections." Cards are read-only with a "Request Access" link that opens a mailto/support dialog.

### 5.15 Session Expired
If the bearer token expires mid-session, any API call fails with 401. The page shows a toast: "Your session has expired. Please log in again." and redirects to `/login?redirect=/settings/connections` after 3 seconds.

**Total states: 15** (exceeds 6 minimum, all 4 mandatory states explicitly described).

---

## 6. Interactions

| # | User Action | System Response | Latency |
|---|-------------|----------------|---------|
| 1 | Click "Connect Google Account" | Generate PKCE code_verifier + state, create oauth_states row, redirect to Google OAuth consent screen | <1s redirect |
| 2 | Complete Google consent | Callback exchanges code for tokens, encrypts, stores, redirects to `/settings/connections?status=connected` with success toast | 1-3s |
| 3 | Deny Google consent | Redirects to `/settings/connections?error=access_denied` with inline error message | <1s |
| 4 | Select GSC property from dropdown | Dropdown populated from Google API (fetched post-connect). Selection saved via `POST /api/connections/:id/property` | <500ms |
| 5 | Select GA4 property from dropdown | Same as GSC. Both must be selected before sync can start | <500ms |
| 6 | Click "Reconnect" (expired token) | Calls `POST /api/connections/:id/refresh`. If refresh token works, new access token obtained silently. If not, falls back to full OAuth flow | 1-2s |
| 7 | Paste Semrush API key + click "Save" | Client-side trim + format validation. Then `POST /api/connections/semrush` with real API validation call. Success: card turns green. Failure: inline error | 2-5s |
| 8 | Click "Disconnect" on any provider | Confirmation dialog opens. On confirm: `DELETE /api/connections/:id`. Card reverts to empty/setup state | <500ms |
| 9 | Click "Show more" in sync history | Loads next 20 ingestion_jobs from API (paginated). Appends to list | <500ms |
| 10 | Hover sync sparkline dot | Tooltip shows that day's sync result: "Mar 25: 1,247 rows, success" | Instant |
| 11 | Click manual "Sync Now" button | Triggers `POST /api/inventory/crawl` or manual ingestion job. Button shows loading state. Status updates via polling | 5-60s |
| 12 | Press Escape while disconnect dialog is open | Dialog closes, no action taken | Instant |
| 13 | Press Tab through the page | Focus moves: overview bar → Google card actions → property selectors → Semrush input → Ahrefs input → sync history | Instant |

**Interaction count: 13** (exceeds 5 minimum).

---

## 7. Data Requirements

### API Endpoints Used

| Endpoint | Method | Purpose | Cache |
|----------|--------|---------|-------|
| `/api/connections` | GET | List all connections for current user | No cache (always fresh) |
| `/api/connections/status` | GET | Aggregated health summary with token expiry | 60s polling |
| `/api/connections/google/auth` | GET | Initiate OAuth flow (redirect) | N/A |
| `/api/connections/google/callback` | GET | Handle OAuth callback (server-side) | N/A |
| `/api/connections/semrush` | POST | Save + validate Semrush API key | N/A |
| `/api/connections/ahrefs` | POST | Save + validate Ahrefs API token | N/A |
| `/api/connections/:id` | DELETE | Disconnect provider | N/A |
| `/api/connections/:id/refresh` | POST | Refresh expired Google token | N/A |
| `/api/connections/:id/property` | POST | Save GSC/GA4 property selection | N/A |

### Data Refresh Strategy

- **On mount:** Single `GET /api/connections` call to populate all cards
- **Polling:** Every 60 seconds, call `GET /api/connections/status` for health update (lightweight endpoint)
- **After mutation:** Optimistic UI update + refetch connections to confirm server state
- **Sync history:** Lazy-loaded, fetched only when user scrolls to that section

### Data Shape (Frontend)

```typescript
interface Connection {
  id: string;
  provider: 'google' | 'semrush' | 'ahrefs';
  providerAccountId: string | null;  // email or key hint
  status: 'pending' | 'connected' | 'error' | 'revoked' | 'expired';
  gscProperty: string | null;
  ga4PropertyId: string | null;
  lastSyncAt: string | null;        // ISO timestamp
  lastError: string | null;
  syncCount: number;
  createdAt: string;
}

interface ConnectionStatus {
  provider: string;
  status: string;
  lastSyncAt: string | null;
  lastError: string | null;
  tokenExpiresInHours: number | null;
  dataFreshnessHours: number | null;
}

interface SyncHistoryEntry {
  id: string;
  source: string;
  status: 'completed' | 'failed' | 'running';
  rowsProcessed: number;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
}
```

---

## 8. Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Semrush API key | Non-empty, trimmed, 32+ characters | "API key must be at least 32 characters" |
| Ahrefs API token | Non-empty, trimmed, 40+ characters | "API token must be at least 40 characters" |
| GSC property | Must be selected from dropdown (not freetext) | "Please select a GSC property from the list" |
| GA4 property | Must be selected from dropdown (not freetext) | "Please select a GA4 property from the list" |
| API key format | No leading/trailing whitespace (auto-trimmed) | N/A (auto-corrected) |
| Disconnect confirmation | Must click confirm in dialog (not just button) | N/A (dialog enforces) |

**Server-side validation (defense in depth):**
- Semrush key: validated by making a test API call to `semrush.com/api`
- Ahrefs token: validated by making a test API call to Ahrefs API
- Google OAuth: PKCE + state parameter prevent CSRF

---

## 9. Error Handling

| Error Scenario | User-Facing Message | Recovery Action |
|----------------|--------------------|-----------------|
| Google OAuth denied | "You declined the Google authorization. ChainIQ needs Search Console and Analytics access to analyze your content performance." | Show "Try Again" button |
| OAuth state expired | "The authorization link has expired. Please try connecting again." | Auto-redirect to fresh OAuth flow |
| Google token exchange failed | "Unable to complete the Google connection. This is usually temporary — please try again in a few minutes." | Show "Retry" button |
| Token refresh failed | "Your Google refresh token has been revoked. You'll need to reconnect your Google account." | Show "Reconnect" button (full OAuth) |
| Semrush key invalid | "This API key couldn't be verified with Semrush. Please check that you've copied the full key from your Semrush account." | Keep key in input for editing |
| Ahrefs token invalid | Same pattern as Semrush | Keep token in input |
| Network error (fetch failed) | "Unable to reach ChainIQ server. Check your internet connection." | Show "Retry" button |
| 409 Conflict (already connected) | "You already have a Google account connected. Disconnect the current one first." | Scroll to Google card |
| 429 Rate limited | "Too many requests. Please wait a moment before trying again." | Auto-retry after delay |

---

## 10. Navigation & Routing

**Entry points:**
- Sidebar: Settings → Connections
- Onboarding wizard: Step 2 "Connect your data" links here
- Dashboard home: "No data sources connected" banner links here
- Any "connection expired" notification badge in sidebar

**URL:** `/settings/connections`

**Query params:**
- `?status=connected` — shown after successful OAuth callback (triggers success toast)
- `?error=access_denied` — shown after denied OAuth callback (triggers error inline)
- `?highlight=google` — scroll to and pulse the Google card (from onboarding)

**Exit points:**
- Back to Settings (`/settings`)
- After all connections established: "Continue to Content Inventory" CTA button appears
- Sidebar navigation (always available)

**Breadcrumb:** Settings > Connections

---

## 11. Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial load (connections list) | <500ms | Time from navigation to all cards rendered |
| OAuth redirect | <1s | Time from button click to Google consent screen visible |
| Property dropdown population | <2s | Time from connection to properties loaded in dropdown |
| API key validation | <5s | Time from submit to success/error response |
| Status polling overhead | <1KB per poll | Payload size of `/api/connections/status` |
| Sync history lazy load | <300ms | Time from scroll trigger to rows visible |

**Optimization strategy:**
- Connections list is small (max 4 rows) — no pagination needed
- Property lists fetched once and cached in component state
- Status polling uses lightweight summary endpoint, not full connection details
- Sync history uses cursor-based pagination (not offset)

---

## 12. Accessibility

### Keyboard Navigation
- `Tab` cycles through: overview bar → Google card (Connect/actions) → GSC dropdown → GA4 dropdown → Semrush card (input/save) → Ahrefs card → sync history
- `Enter` on status dots opens corresponding card detail
- `Escape` closes disconnect confirmation dialog, returns focus to the button that triggered it
- `Space` toggles card expand/collapse when focused on card header
- API key input fields support `Ctrl+V` paste (standard, but explicitly tested)

### Screen Reader Support
- Status dots have `aria-label`: "Google Search Console: Connected, last synced 6 hours ago"
- Connection cards use `role="region"` with `aria-labelledby` pointing to card header
- Disconnect dialog uses `role="alertdialog"` with `aria-describedby` for consequences list
- Sync sparkline has `aria-label` summarizing trend: "30-day sync history: 28 successful, 2 failed"
- Property dropdowns use `role="listbox"` with proper `aria-selected` states
- Form validation errors use `aria-live="polite"` + `aria-invalid="true"` on input fields

### Visual Requirements
- Status colors meet WCAG 2.1 AA contrast: green (#22c55e on dark bg), orange (#f59e0b), red (#ef4444)
- All status colors paired with icons (not color-only): checkmark (connected), warning triangle (expired), X circle (error), circle outline (not connected)
- Text labels accompany every status dot (no color-only communication)
- Focus indicators: 2px ring with 3:1 contrast against background
- Reduced motion: disable sparkline animation and pulse effects when `prefers-reduced-motion` is set

### RTL Support
- Layout mirrors: cards remain vertical stacked, but internal alignment flips
- API key input direction remains LTR (key values are always LTR)
- Status dots and badges flip to right-to-left reading order
- Property dropdown text can be Arabic site names — ensure bidi text rendering

---

## 13. Edge Cases

| # | Edge Case | Handling |
|---|-----------|----------|
| 1 | User has multiple Google accounts | OAuth shows Google's account picker. The selected email is stored in `provider_account_id` and displayed on the card |
| 2 | User's GSC has 50+ properties | Property dropdown becomes a searchable combobox with type-ahead filtering |
| 3 | OAuth callback arrives after user navigated away | Callback still processes server-side. When user returns to Connections, they see the connected state |
| 4 | User pastes API key with newlines/spaces | Auto-trim on paste event and on submit. No error shown for whitespace |
| 5 | Semrush key works but has 0 API credits | Connection shows as "connected" with a warning: "Your Semrush account has 0 API credits remaining" |
| 6 | Two browser tabs open, disconnect in one | Polling in the other tab picks up the change within 60 seconds. Optimistic: show stale state until next poll |
| 7 | Google revokes ChainIQ's OAuth app | All Google connections fail. Admin alert triggered. User sees "Google has revoked app access — contact support" |
| 8 | User is on mobile browser (< 375px) | Cards stack, property dropdowns go full-width, sparkline hidden, sync history condensed to status + time only |
| 9 | Bridge server is down | All API calls fail. Full-page error with "ChainIQ server is unreachable" and retry button |
| 10 | User tries to connect Google while another OAuth flow is pending | Block with "You already have a pending Google connection. Complete or cancel it first" |
| 11 | Network drops during OAuth flow | Google shows its own error. When user returns to ChainIQ, oauth_states expires after 10 min, clean slate |
| 12 | User's Google account doesn't have GSC access | Property dropdown shows empty with message: "No Search Console properties found. Set up GSC at search.google.com/search-console" |

**Edge case count: 12** (exceeds 5 minimum).

---

## 14. Component Implementation (Primitive Mapping)

| Domain Component | shadcn/ui Primitive | Notes |
|-----------------|--------------------|---------|
| ConnectionOverviewBar | `Card` + `Badge` + custom layout | Fixed top position within page |
| StatusDot | Custom (`<span>` + CSS animation) | 3 variants: green (pulse), orange (static), gray (static) |
| GoogleConnectionCard | `Card` + `CardHeader` + `CardContent` | Collapsible via state toggle |
| ApiKeyConnectionCard | `Card` + `Input` + `Button` | Input masked by default, reveal on focus |
| PropertySelector | `Select` (shadcn) or `Combobox` if >20 items | Searchable when item count > 20 |
| SyncSparkline | Custom SVG (30 circles, colored by status) | Lightweight, no chart library needed |
| SyncStatusRow | Custom flex layout | `RelativeTimestamp` uses `Intl.RelativeTimeFormat` |
| SyncHistorySection | `Table` (shadcn) | Lazy-loaded, cursor-paginated |
| SyncHistoryRow | `TableRow` + `Badge` | Color-coded by status |
| DisconnectConfirmDialog | `AlertDialog` (shadcn) | `role="alertdialog"`, focus trap, Escape to close |
| AlertBanner | `Alert` (shadcn) | Variants: warning (orange), error (red), info (blue) |
| NextSyncCountdown | Custom text with `useEffect` timer | Updates every minute, shows relative time |
| ApiKeyInput | `Input` (shadcn) + password masking | `type="password"` with toggle reveal button |
| ValidationStatus | `Badge` or inline text | 3 states: checking (spinner), valid (green check), invalid (red X) |
| PageHeader | `Breadcrumb` (shadcn) | Settings > Connections |

---

## 15. Open Questions & Dependencies

### Dependencies
- **KeyManager (bridge/key-manager.js):** Must be operational for token encryption/decryption
- **Google OAuth app credentials:** Must be registered in Google Cloud Console with correct redirect URI pointing to `/api/connections/google/callback`
- **Semrush API subscription:** ChainIQ's own API key with sufficient credits
- **Ahrefs API access:** ChainIQ's own API token

### Open Questions
1. **Property selection UX:** Should we auto-select the first GSC/GA4 property if there's only one? (Recommendation: yes, with a "Change" button)
2. **Sync Now button:** Should manual sync be available to all users or admin-only? (Recommendation: all users, rate-limited to 1/hour)
3. **Webhook notifications:** Should we add webhook/email alerts for connection failures? (Deferred to Phase D)
4. **Multi-account support:** One Google account per user now. Multi-account support (multiple GSC properties from different Google accounts) deferred to Phase C.

---

## Depth Score Card

| Criterion | Score | Notes |
|-----------|-------|-------|
| Word count | 2,600+ | Exceeds 800 minimum |
| States defined | 15 | Exceeds 6 minimum, all 4 mandatory explicitly described |
| Interactions | 13 | Exceeds 5 minimum |
| Form validation rules | 6 | All fields covered |
| Accessibility section | Complete | Keyboard, screen reader, visual, RTL |
| Edge cases | 12 | Exceeds 5 minimum |
| Component tree | 15 components | Exceeds 5 minimum |
| Power user efficiency | Yes | Collapsed cards on repeat visits, keyboard nav, one-click reconnect |
| First-time onboarding | Yes | Guided empty state, value propositions, "Start with Google" emphasis |
| **Quantitative** | **9/10** | |
| **Qualitative** | **2/2** | |
