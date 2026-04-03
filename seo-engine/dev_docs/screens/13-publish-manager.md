# Screen Spec: Publish Manager

> **Route:** `/publish`
> **Service:** Publishing Service (Service #11, Layer 5)
> **Task:** T2-13
> **Type:** List + Actions (platform cards + publish queue DataTable)
> **Priority:** P1
> **Depth Target:** >= 8/10

---

## 1. Overview

The Publish Manager is the bridge between ChainIQ's content intelligence pipeline and the outside world. It is the screen where a quality-gate-approved article becomes a real post on a real CMS -- a WordPress draft, a Shopify blog entry, a Contentful document, or a webhook payload. The screen has two distinct zones: **Connected Platforms** (top section -- cards showing each connected CMS with status indicators and capabilities) and **Publish Queue** (bottom section -- a DataTable of articles ready to publish, currently publishing, and recently published).

The Publishing Service enforces a hard upstream boundary: no article can be published unless `quality_scores.passed = true`. The Publish Manager surfaces this constraint visually -- articles that have not passed the Quality Gate appear in the queue with a locked status and a "Score Required" badge. This is non-negotiable. It is the quality floor that separates ChainIQ from commodity AI writers that dump unreviewed content into production CMSes.

**Draft-first philosophy:** Every publish operation creates content as a draft by default. ChainIQ generates content -- humans decide when it goes live. The user can override to "scheduled" or "pending review" in the publish modal, but the default is always draft. This is a deliberate product decision validated by user research with Elena (WordPress agency dev), Sarah (Shopify store owner), and Rachel (e-commerce manager).

**SaaS-connected thin clients:** All CMS plugins are thin receivers. The WordPress plugin contains zero generation logic, zero scoring logic. It receives the Universal Article Payload and writes it to `wp_posts`. This architecture protects ChainIQ's IP and ensures backend improvements propagate to all connected platforms without plugin updates.

**Primary user personas and their goals on this screen:**

- **Elena (WordPress Agency Developer):** Connects 3-4 WordPress sites for different clients. Publishes 10-15 articles per week across sites. Needs to see which articles are ready, which platform they're going to, and confirm publish with one click. Her frustration: publish failures with opaque error messages. She needs the exact error code, the HTTP response, and a "Retry" button.

- **Sarah (Shopify Store Owner):** Connected one Shopify store. Publishes 2-3 blog articles per week. Needs to select the blog (she has "News" and "Guides"), add product references, and verify that images will upload correctly. Her frustration: images missing after publish because Shopify's Files API has size limits she didn't know about.

- **Marcus (Agency Admin):** Manages publishing across 12 client WordPress sites. Uses bulk publish to push 5-10 approved articles at once. Needs platform health visibility (are all 12 sites responsive?) and publish history for client reporting. His frustration: can't tell if an article is already published to a platform, leading to duplicate posts.

---

## 2. Screen Type

Split layout: status cards (top) + DataTable with action toolbar (bottom). The screen is divided into two visual zones by a horizontal separator. The top zone shows connected platforms as compact status cards. The bottom zone is a full-featured DataTable of articles in the publish pipeline.

---

## 3. ASCII Wireframe

```
┌─────┬───────────────────────────────────────────────────────────────┐
│     │  Publishing                              [+ Connect Platform] │
│  S  │───────────────────────────────────────────────────────────────│
│  I  │                                                               │
│  D  │  Connected Platforms                                          │
│  E  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  B  │  │ ● WordPress │ │ ● Shopify   │ │ ○ Ghost     │            │
│  A  │  │ Main Blog   │ │ Store Blog  │ │ Auth Expired│            │
│  R  │  │ 47 published│ │ 12 published│ │ Reconnect → │            │
│     │  │ Last: 2h ago│ │ Last: 1d ago│ │             │            │
│     │  │ [Test] [...] │ │ [Test] [...] │ │ [Fix] [...] │            │
│     │  └─────────────┘ └─────────────┘ └─────────────┘            │
│     │                                                               │
│     │  ─────────────────────────────────────────────────────────── │
│     │                                                               │
│     │  Publish Queue            [Search...    ] [Status ▾] [Plat ▾]│
│     │  ───────────────────────────────────────────────────────────  │
│     │  □ Title              Status      Platform    Quality  Action │
│     │  ────────────────────────────────────────────────────────── │
│     │  □ N54 HPFP Symptoms  [Ready    ] WordPress   8.4/10  [Pub]  │
│     │  □ Running Shoes Guide[Ready    ] Shopify     7.9/10  [Pub]  │
│     │  □ Cloud Migration    [Published] WordPress   8.1/10  [View] │
│     │  □ React Performance  [Failed   ] WordPress   7.6/10  [Retry]│
│     │  □ Arabic SEO Guide   [Scoring  ] —           —       [Wait] │
│     │                                                               │
│     │  Showing 1-5 of 23 articles          [← 1 2 3 ... 5 →]     │
└─────┴───────────────────────────────────────────────────────────────┘

── Publish Modal ─────────────────────────────────────────────────────
│  Publish "N54 HPFP Failure Symptoms"                               │
│────────────────────────────────────────────────────────────────────│
│                                                                    │
│  Platform:    [WordPress - Main Blog     ▾]                        │
│  Post Status: [Draft                     ▾]   (draft / scheduled)  │
│  Schedule:    [Mar 30, 2026  09:00 AM    ]   (if scheduled)       │
│                                                                    │
│  Categories:  [BMW Maintenance] [Engine] [+ Add]                   │
│  Tags:        [N54] [HPFP] [fuel pump] [+ Add]                    │
│                                                                    │
│  ☑ Upload featured image                                          │
│  ☑ Set SEO meta (Yoast detected)                                  │
│  ☐ Set as published (skip draft)                                   │
│                                                                    │
│  ┌──────────────────────────────────────────────────┐             │
│  │  Preview: 5 images will be uploaded (2.3 MB)     │             │
│  │  SEO: Title tag, meta description, OG image      │             │
│  │  Quality Score: 8.4/10 ✓ Passed                  │             │
│  └──────────────────────────────────────────────────┘             │
│                                                                    │
│  [Cancel]                                   [Publish to WordPress] │
└────────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Fields

### Connected Platforms Card Fields

| Field | Type | Source | Display |
|-------|------|--------|---------|
| Platform Type | enum | `platform_connections.platform` | Icon + name (WordPress, Shopify, Ghost, etc.) |
| Display Name | text | `platform_connections.display_name` | Card subtitle |
| Status | enum | `platform_connections.status` | StatusDot: green=active, yellow=pending_verification, red=error/auth_expired, gray=disconnected |
| Published Count | integer | COUNT from `publish_records` WHERE status='published' | "{N} published" |
| Last Push | datetime | `platform_connections.last_push_at` | Relative time ("2h ago") |
| SEO Plugin | text | `platform_connections.seo_plugin` | Badge: "Yoast", "RankMath", etc. (WordPress only) |
| Platform Version | text | `platform_connections.platform_version` | Tooltip on hover |
| Capabilities | JSONB | `platform_connections.capabilities` | Icons: categories, tags, featured image, SEO meta, schema, scheduling |
| Error State | text | `platform_connections.last_error` | Red text below status when in error state |
| Error Count | integer | `platform_connections.error_count` | Shown in tooltip: "3 consecutive errors" |

### Publish Queue DataTable Fields

| Field | Type | Source | Sortable | Filterable |
|-------|------|--------|----------|------------|
| Checkbox | boolean | local | No | No |
| Title | text | `articles.title` | Yes | Search |
| Status | enum | derived (see Section 4.1) | Yes | Dropdown |
| Platform | text | `publish_records.platform` or target | Yes | Dropdown |
| Quality Score | numeric | `quality_scores.overall_score` | Yes | No |
| Quality Passed | boolean | `quality_scores.passed` | No | Yes |
| Published At | datetime | `publish_records.published_at` | Yes (default desc) | Date range |
| Remote URL | text | `publish_records.remote_url` | No | No |
| Images | string | `"{uploaded}/{total}"` from publish_records | No | No |
| Duration | integer | `publish_records.duration_ms` | Yes | No |
| Action | button | derived | No | No |

### 4.1 Derived Publish Status

The queue status is a composite derived from multiple sources:

| Status | Condition | Badge Color | Action |
|--------|-----------|-------------|--------|
| `scoring` | Article exists but `quality_scores` is NULL or scoring in progress | gray | Wait (disabled) |
| `score_failed` | `quality_scores.passed = false` and not flagged for review | red | "View Score" |
| `ready` | `quality_scores.passed = true` AND no `publish_records` entry for selected platform | green | "Publish" |
| `queued` | `publish_records.status = 'queued'` | blue | Cancel |
| `uploading_images` | `publish_records.status = 'uploading_images'` | blue (animated) | -- |
| `pushing` | `publish_records.status = 'pushing'` | blue (animated) | -- |
| `published` | `publish_records.status = 'published'` | green (solid) | "View" (opens remote URL) |
| `failed` | `publish_records.status = 'failed'` | red | "Retry" |
| `retrying` | `publish_records.status = 'retrying'` | yellow (animated) | -- |
| `already_published` | Article has a `publish_records` entry for THIS platform with status='published' | muted green | "View" + "Republish" |

---

## 5. Component Inventory

| Component | Source | Props / Config | Notes |
|-----------|--------|----------------|-------|
| Card | shadcn/ui | variant: "outline" | Platform connection cards. Border-left color coded by status |
| StatusDot | Custom | color: green/yellow/red/gray | Inline dot before platform name on cards |
| DataTable | shadcn/ui | sortable, pagination, row selection | Publish queue. Server-side pagination, 20 rows default |
| Badge | shadcn/ui | variant by status color | Publish status badges, quality score badges, SEO plugin badges |
| Button | shadcn/ui | variant: "default", "outline", "ghost", "destructive" | "Publish", "Retry", "View", "Connect Platform", "Test" |
| Dialog | shadcn/ui | -- | Publish modal, connect platform modal, disconnect confirmation |
| Select | shadcn/ui | -- | Platform selector in publish modal, status/platform filters |
| Input | shadcn/ui | -- | Search field (debounce 300ms), API key input, category/tag input |
| DatePicker | shadcn/ui | -- | Schedule date/time selector in publish modal |
| Checkbox | shadcn/ui | -- | Bulk selection, publish options (featured image, SEO meta) |
| Progress | shadcn/ui | -- | Image upload progress, publish progress |
| Skeleton | shadcn/ui | -- | Card loading, table row loading |
| Toast | shadcn/ui | -- | Success/error notifications for publish, connect, disconnect |
| AlertDialog | shadcn/ui | -- | Disconnect platform confirmation, bulk publish confirmation |
| DropdownMenu | shadcn/ui | -- | Platform card overflow: Edit, Test Connection, View Capabilities, Disconnect |
| Tabs | shadcn/ui | -- | Platform connection form tabs (WordPress / Shopify / etc.) |
| Alert | shadcn/ui | variant: "warning", "destructive", "info" | Connection errors, duplicate publish warnings, quality gate blocks |
| Pagination | shadcn/ui | -- | Publish queue table pagination |
| TagInput | Custom (shadcn/ui-based) | -- | Category and tag input with autocomplete in publish modal |

---

## 6. States (10 total)

### 6.1 Loading State

```
Platform cards section: 3 skeleton cards with pulsing animation.
Publish queue: toolbar visible with disabled filters. 5 skeleton rows.
Pagination hidden.
```

### 6.2 No Platforms Connected (Empty State)

```
Platform cards section replaced by centered onboarding guide:
  "Connect Your First Platform"
  "ChainIQ publishes articles as drafts to your CMS. Connect a platform to start."

  Platform option cards (selectable):
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │  WordPress   │  │  Shopify     │  │  Ghost       │  │  Webhook     │
  │  Plugin-based│  │  OAuth       │  │  Admin API   │  │  HTTP POST   │
  │  [Connect]   │  │  [Connect]   │  │  [Connect]   │  │  [Connect]   │
  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘

  "More platforms: Contentful, Strapi, Webflow, Sanity (coming soon)"

Publish queue section shows:
  "No platforms connected. Connect a platform above to see publishable articles."
```

### 6.3 Platforms Connected -- Active

```
Platform cards show green StatusDot, display name, published count,
last push time. Each card has [Test] button and overflow menu [...].

Cards are horizontally scrollable if > 4 platforms connected.
Active cards have green left border. Error cards have red left border.
```

### 6.4 Platform Connection Error

```
Platform card shows red StatusDot. Error message in red text below name:
  "Connection failed: 401 Unauthorized"
  or "Auth expired: OAuth token needs refresh"
  or "Unreachable: site did not respond within 10s"

Actions change based on error type:
  - Auth expired: [Refresh Token] primary button
  - Unreachable: [Test Again] button
  - Unauthorized: [Reconnect] button (re-enter credentials)

Error count badge on card: "3 consecutive errors"
```

### 6.5 Publish Queue -- Articles Ready

```
DataTable populated with articles. Columns: checkbox, title, status badge,
platform (icon + name), quality score, published date, action button.

Bulk selection enabled. Select 3+ articles: toolbar shows
  "3 selected" + [Publish All] + [Cancel] bulk actions.

Filter bar: [Search] [Status: All ▾] [Platform: All ▾]
```

### 6.6 Publishing In Progress

```
Article row status transitions:
  "Ready" -> "Queued" (blue, static) -> "Uploading Images" (blue, animated)
  -> "Pushing" (blue, animated) -> "Published" (green, solid)

Progress detail in expanded row (click to expand):
  ┌──────────────────────────────────────────────────────┐
  │  Publishing to WordPress - Main Blog                  │
  │  ████████████████████░░░░░░░░  65%                   │
  │  ✓ Payload assembled           (0.2s)                │
  │  ✓ Images uploaded (4/5)       (3.1s)                │
  │  ● Pushing to CMS...          (...)                  │
  │  ○ Verifying post created                            │
  └──────────────────────────────────────────────────────┘

Row is not clickable during publish (only expandable for progress).
Other rows remain interactive.
```

### 6.7 Published Successfully

```
Article row shows:
  Status: "Published" (green badge with checkmark)
  Action: [View] button (opens remote_url in new tab)
  Expanded detail (click row):
    Remote URL: https://example.com/blog/n54-hpfp-symptoms
    Edit URL: https://example.com/wp-admin/post.php?post=4821&action=edit
    Images: 5/5 uploaded
    SEO Meta: Set (Yoast)
    Categories: BMW Maintenance, Engine
    Tags: N54, HPFP, fuel pump
    Duration: 8.4s
    Published at: Mar 28, 2026 14:30

Toast on publish complete: "Article published to WordPress as draft.
  [Open in WordPress]"
```

### 6.8 Publish Failed

```
Article row shows:
  Status: "Failed" (red badge with x icon)
  Action: [Retry] button

Expanded detail shows error information:
  ┌──────────────────────────────────────────────────────┐
  │  Publish Failed                                       │
  │                                                       │
  │  Error: CMS_UNREACHABLE                               │
  │  Message: WordPress site did not respond within 10s   │
  │  HTTP Status: -- (connection timeout)                 │
  │  Attempt: 3 of 3 (auto-retry exhausted)              │
  │                                                       │
  │  Suggestions:                                         │
  │  - Check that your WordPress site is online           │
  │  - Verify the ChainIQ Connector plugin is active      │
  │  - Test your connection from the platform card above  │
  │                                                       │
  │  [Retry Now]  [View Error Log]                        │
  └──────────────────────────────────────────────────────┘

Error log dialog shows full JSON error_log array from publish_records.
```

### 6.9 Scheduling State

```
In the publish modal, user selects "Scheduled" from Post Status dropdown.
DatePicker appears below with date and time fields.
Date must be in the future. Past dates show validation error.

Scheduled articles appear in queue with status "Scheduled" (purple badge)
and scheduled date shown in the Published At column.
Note: scheduling sets the WordPress post_date; ChainIQ pushes
immediately as a scheduled draft. WordPress handles the timed publish.
```

### 6.10 Bulk Publishing

```
User selects 3+ articles via checkboxes. Toolbar transforms:
  "3 articles selected" + [Publish All to...] dropdown + [Deselect]

Click "Publish All to WordPress":
  Confirmation dialog:
    "Publish 3 articles to WordPress - Main Blog?"
    Articles: (list of titles)
    All as: Draft
    ☑ Upload featured images
    ☑ Set SEO meta

    [Cancel]  [Publish 3 Articles]

After confirm: all 3 rows transition to "Queued" simultaneously.
Each publishes sequentially (one at a time to respect CMS rate limits).
Progress shown per-row. Failures don't block remaining articles.
Summary toast on completion: "Published 2 of 3 articles. 1 failed. [View Details]"
```

---

## 7. Interactions

| # | Trigger | Action | Feedback | API Call |
|---|---------|--------|----------|----------|
| 1 | Click "Connect Platform" | Open platform selection dialog | Dialog with platform cards | None until selection |
| 2 | Select WordPress in connection dialog | Show WordPress connection form: site URL, API key (generated by ChainIQ WP plugin), display name | Form with validation. "Test Connection" button appears after URL + key entered | POST `/api/publish/platforms/connect` `{ platform: "wordpress", site_url, api_key, display_name }` |
| 3 | Click "Test Connection" on platform card | Ping the CMS endpoint | Button shows spinner. Result: green check + "Connected" or red x + error message | POST `/api/publish/platforms/:id/test` |
| 4 | Click "Publish" on article row | Open publish modal pre-filled with article info | Modal with platform selector, options, preview summary | None until submit |
| 5 | Click "Publish to WordPress" in modal | Validate inputs, submit publish request | Modal closes. Row transitions to "Queued". Progress appears | POST `/api/publish/wordpress/push` `{ article_id, platform_connection_id, post_status, categories, tags, ... }` |
| 6 | Click "Retry" on failed row | Re-attempt publish with same parameters | Row transitions from "Failed" to "Retrying" (yellow animated) | POST `/api/publish/wordpress/push` `{ article_id, platform_connection_id, force: true }` |
| 7 | Click "View" on published row | Open remote URL in new tab | Standard link behavior | None |
| 8 | Click article row (expand) | Toggle row expansion showing publish details | Smooth height animation. Detail section slides down | GET `/api/publish/status/:articleId` (if not cached) |
| 9 | Bulk select + "Publish All" | Confirm dialog, then sequential publish | Per-row progress. Summary toast on completion | Sequential POST calls, one per article |
| 10 | Click "Disconnect" in platform overflow menu | AlertDialog: "Disconnect {platform name}? Published articles will remain on the CMS. You can reconnect later." | Card removed with fade animation. Toast: "Platform disconnected." | DELETE `/api/publish/platforms/:id` |
| 11 | Search publish queue | Debounced (300ms) filter on article title | Table updates with filtered results | GET `/api/articles?search=...&has_quality_score=true` |
| 12 | Filter by status | Select status from dropdown | Table filters to matching status | Client-side filter on loaded data (paginated server-side for large sets) |
| 13 | Filter by platform | Select platform from dropdown | Table filters to articles published to or ready for that platform | Client-side filter |
| 14 | Click "Refresh Token" on auth-expired platform | Initiate OAuth re-authorization flow | Redirect to OAuth provider, return with new token | POST `/api/publish/platforms/:id/refresh` |
| 15 | Publish attempted on article without quality gate pass | Publish button disabled, tooltip: "Quality Gate not passed. Score: {N}/10" | Red quality badge, locked icon on row | None (client-side enforcement) |

---

## 8. API Integration

### Endpoints Used

| Method | Path | Purpose | Cache |
|--------|------|---------|-------|
| GET | `/api/publish/platforms` | List connected platforms with status | 30s SWR |
| POST | `/api/publish/platforms/connect` | Register new platform connection | Invalidates platforms cache |
| DELETE | `/api/publish/platforms/:id` | Disconnect platform | Invalidates platforms cache |
| POST | `/api/publish/platforms/:id/test` | Test platform connectivity | No cache |
| POST | `/api/publish/platforms/:id/refresh` | Refresh OAuth token | Invalidates platforms cache |
| GET | `/api/publish/platforms/:id/capabilities` | Detect platform capabilities | 5min SWR |
| POST | `/api/publish/wordpress/push` | Push article to WordPress | Invalidates publish queue |
| POST | `/api/publish/shopify/push` | Push article to Shopify | Invalidates publish queue |
| POST | `/api/publish/webhook` | Send to custom webhook | Invalidates publish queue |
| GET | `/api/publish/status/:articleId` | Get publish history for article | 10s SWR |
| GET | `/api/articles` | List articles with quality scores | 30s SWR |

### Connection Flow by Platform

**WordPress:** User installs ChainIQ Connector WP plugin on their site. Plugin generates an API key. User enters site URL + API key in ChainIQ. ChainIQ calls `/wp-json/chainiq/v1/status` to verify. On success, ChainIQ auto-detects SEO plugin (Yoast/RankMath/AIOSEO), WP version, and capabilities (custom post types, categories, tags).

**Shopify:** OAuth flow. User clicks "Connect Shopify" and is redirected to Shopify's OAuth consent screen. After approval, ChainIQ receives access token. Auto-detects available blogs, product catalog access, metafield permissions.

**Webhook:** User enters endpoint URL. ChainIQ generates a shared HMAC-SHA256 secret displayed once. User copies secret to their receiving server. Test ping sent to verify endpoint responds with 200.

---

## 9. Mobile Behavior

| Breakpoint | Layout Change |
|------------|---------------|
| >= 1024px | Platform cards in horizontal row (3-4 visible). DataTable with all columns |
| 768-1023px | Platform cards scroll horizontally. DataTable hides Duration and Images columns |
| < 768px | Platform cards stack vertically (1 column). DataTable converts to card layout: title, status badge, platform icon, action button per card. Filters collapse into "Filter" sheet |

**Touch targets:** Publish button minimum 44x44px. Card overflow menus enlarged for touch. Swipe-left on mobile card rows reveals quick actions (Publish, View).

---

## 10. Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | Tab through platform cards, then into DataTable. Enter on row to expand detail. Shift+Enter on Publish button to open modal |
| Screen reader | Platform cards: `role="article"` with `aria-label="WordPress Main Blog, status active, 47 articles published"`. Status dots have `aria-label` with full status text |
| Focus management | Opening publish modal traps focus. Closing returns focus to triggering Publish button. Expanded row detail is focusable |
| Live regions | Publishing progress uses `aria-live="polite"`. Status transitions announced: "Article N54 HPFP Symptoms published to WordPress" |
| Color independence | Status uses icon + text + color (never color alone). Failed = red + x icon + "Failed" text. Published = green + check icon + "Published" text |
| Error identification | Publish errors include `aria-describedby` linking to full error message. Suggestions list uses `role="list"` |
| RTL support | Full layout mirroring. Platform cards reorder right-to-left. DataTable text alignment flips. Publish modal fields right-aligned |

---

## 11. Edge Cases

| # | Scenario | Handling |
|---|----------|----------|
| 1 | Duplicate publish attempt | API returns 409 DUPLICATE_PAYLOAD. Dialog: "This article was already published to {platform} on {date}. Republish anyway?" with [Cancel] [Republish] (sets force: true) |
| 2 | Quality Gate not passed | Publish button disabled with tooltip. Row shows orange "Score Required" badge. Clicking badge navigates to `/articles/[id]/quality` |
| 3 | Platform connection expires during publish | Publish fails with AUTH_EXPIRED. Error detail includes [Refresh Token] action. Article returns to "Ready" status |
| 4 | Image upload partial failure | Publish completes but with warning: "3 of 5 images uploaded. 2 failed (size exceeded 10MB limit)." Published row shows "3/5 images" in orange. Expanded detail lists failed images with URLs for manual upload |
| 5 | Article already published to Platform A, user wants Platform B | Publish modal shows "Also published to: WordPress (Mar 25)". User can select Shopify independently. No conflict |
| 6 | CMS unreachable during bulk publish | Failed article logged. Remaining articles continue. Summary: "Published 4 of 5. 1 failed (Ghost unreachable)." Individual retry available on failed row |
| 7 | Very long article title (100+ chars) | Truncated at 60 chars with ellipsis in DataTable. Full title in tooltip and publish modal |
| 8 | Arabic article published to WordPress | Content direction set to `dir="rtl"` in wp_insert_post. Featured image alt text preserved in Arabic. SEO meta in Arabic. Categories/tags in Arabic with proper encoding |
| 9 | User disconnects platform while articles are queued | Queued articles for that platform transition to "Cancelled" with message: "Platform disconnected. Reconnect to retry." |
| 10 | Webhook endpoint returns non-200 | 3 retries with exponential backoff (1s, 4s, 16s). After 3 failures, status = "Failed" with full HTTP response body in error log |

---

## 12. Frustration Mitigation

| Frustration | Root Cause | Solution |
|-------------|------------|----------|
| Publish fails with no useful error message | CMS APIs return varied error formats. Generic "publish failed" is useless | Error detail panel shows: error code (e.g., CMS_UNREACHABLE, AUTH_EXPIRED), HTTP status, raw error message from CMS, timestamp, attempt number. Actionable suggestions below each error type. Full error_log JSON accessible via "View Error Log" |
| Can't tell if article is already published to a platform | No visibility into cross-platform publish history | DataTable status column shows "Published" with platform icon for already-published articles. Publish modal header shows "Also published to: [platforms]". Duplicate detection via payload_hash prevents accidental re-publish without explicit force |
| No way to preview how article looks on CMS before publishing | ChainIQ generates HTML; CMS themes transform it | Post-publish, the "View" action opens the CMS edit URL (not public URL) so the user can preview in their theme. Pre-publish preview of raw HTML available in Article Detail screen. Phase 2 planned: CMS-specific preview rendering |
| Images missing after publish | CMS image upload fails silently or has size limits | Publish modal shows "Preview: {N} images will be uploaded ({size})" before publish. Per-image upload status tracked in image_upload_log. Failed images listed individually with file size and error reason. Suggestion: "Resize images > 10MB before publishing to Shopify" |

---

## 13. Real-Time & Polling Behavior

| Scenario | Strategy | Interval | Termination |
|----------|----------|----------|-------------|
| Publish in progress | Poll `GET /api/publish/status/:articleId` | 2 seconds | Status transitions to `published` or `failed` |
| Bulk publish | Poll each article independently | 2 seconds per article, staggered | All articles reach terminal state |
| Platform health | SWR revalidation on platforms list | 30 seconds | Continuous while page visible |
| Tab hidden | Pause all polling | -- | Resume on `visibilitychange` |
| Publish complete | Stop polling for that article, show toast | -- | One-time event |

---

## 14. Dependencies

| Dependency | Type | Impact |
|------------|------|--------|
| Publishing Service (Service #11) | Backend | All publish operations, platform connections, publish records |
| Quality Gate Service (Service #10) | Backend | quality_scores.passed must be true before publishing is allowed |
| Auth & Bridge Server | Backend | JWT validation, user context for RLS |
| Article Pipeline (Screen 3) | Data | Articles must exist and have content before publishing |
| Article Detail (Screen 4) | Navigation | "View Score" on quality-blocked articles links to Article Detail quality tab |
| Connections (Screen 9) | Navigation | Platform connection URLs may be shared with or pre-filled from Connections screen |
| Supabase | Infrastructure | platform_connections, publish_records, image_upload_log tables + RLS |

**Blocks:** Feedback Loop (Performance screen) -- publish_records.published_at is the anchor for checkpoint scheduling
**Blocked by:** Publishing Service API endpoints, Quality Gate Service, Auth/Bridge Server

---

## 15. Testing Scenarios

| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| 1 | Empty state -- no platforms | New user navigates to `/publish` | "Connect Your First Platform" with WordPress, Shopify, Ghost, Webhook cards. Publish queue shows "No platforms connected" |
| 2 | Connect WordPress | Click WordPress, enter site URL + API key, click Test | Connection test runs. Green check on success. Card appears with status "Active". Capabilities auto-detected |
| 3 | Publish single article | Select article with quality passed, click Publish, fill modal, confirm | Modal shows preview summary. After submit: row transitions queued -> uploading -> pushing -> published. Toast with "Open in WordPress" link |
| 4 | Publish to Shopify with products | Select article, choose Shopify platform, add product references, confirm | Product GIDs included in payload. Shopify blog article created with product mentions. Response includes Shopify article URL |
| 5 | Publish failure and retry | Publish to disconnected WordPress site | Row shows "Failed" with error detail. Click Retry. If site now reachable, publishes successfully. If still down, fails again with updated attempt count |
| 6 | Duplicate prevention | Attempt to publish same article to same platform twice | Second attempt shows 409 dialog: "Already published on {date}. Republish?" Force option available |
| 7 | Quality gate block | Attempt to publish article that has not passed quality gate | Publish button disabled. Tooltip: "Quality Gate not passed." Orange "Score Required" badge. Click badge navigates to quality report |
| 8 | Bulk publish | Select 3 articles, click "Publish All to WordPress" | Confirmation dialog with article list. After confirm: sequential publish. Progress per row. Summary toast on completion |
| 9 | Platform disconnect | Click Disconnect on platform card | AlertDialog confirmation. On confirm: card removed, queued articles cancelled, published articles remain on CMS |
| 10 | Connection error recovery | Platform shows auth_expired | Red StatusDot, "Auth Expired" text, [Refresh Token] button. Click refreshes OAuth. On success: green status restored |
| 11 | Image upload partial failure | Publish article with 1 oversized image | Publish completes with warning. "4/5 images" in orange. Expanded detail lists failed image with size and error |
| 12 | Scheduled publish | Select "Scheduled" status, set future date/time | DatePicker validates future date. Published to CMS as scheduled draft. Row shows "Scheduled" purple badge with date |
| 13 | Mobile layout | View on 375px viewport | Platform cards stack vertically. Queue shows card layout. Filters in bottom sheet. Touch targets >= 44px |
| 14 | RTL article publish | Publish Arabic article to WordPress | Content `dir="rtl"` set. Arabic title, meta, categories preserved. Published draft renders correctly in RTL WordPress theme |
| 15 | Webhook publish | Connect webhook endpoint, publish article | HMAC-SHA256 signed payload sent. Response shown. Retry on 5xx with backoff |
