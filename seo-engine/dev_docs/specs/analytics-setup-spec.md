# ChainIQ Analytics Setup Specification

**Last Updated:** 2026-03-28
**Source:** Analytics event taxonomy, system architecture, project overview
**Audience:** Engineering (implementation guide)
**Providers:** PostHog (primary product analytics) + Supabase built-in (usage tracking)

---

## Architecture Overview

ChainIQ analytics operates on two tracks with clear separation of concerns:

1. **PostHog** -- all product analytics, funnels, retention, feature adoption, conversion tracking. Both client-side (posthog-js in dashboard) and server-side (posthog-node in bridge server).
2. **Supabase built-in** -- database-level usage tracking (row counts, storage consumption, API call volume, connection health). No additional setup; Supabase Pro provides this out of the box via the Supabase Dashboard.

No Google Analytics. No Mixpanel. No Segment. Two providers, clear ownership, no overlap.

---

## PostHog Setup for Next.js 16 App Router

### Installation

```bash
npm install posthog-js posthog-node
```

These are the only two analytics dependencies. `posthog-js` runs in the browser (dashboard). `posthog-node` runs on the bridge server (Node.js).

### Environment Variables

```env
# Dashboard (.env.local)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Bridge server (.env)
POSTHOG_API_KEY=phc_xxxxxxxxxxxxxxxxxxxx
POSTHOG_HOST=https://us.i.posthog.com
```

The PostHog project key is the same for both client and server. It is a write-only key (cannot read data), so exposing it in `NEXT_PUBLIC_` is safe by design. PostHog recommends US cloud (`us.i.posthog.com`) for GDPR-compliant hosting. EU cloud (`eu.i.posthog.com`) is available if needed for MENA clients with EU data residency requirements.

### Client-Side: PostHog Provider (Dashboard)

Create `app/providers.tsx`:

```typescript
'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: false,        // Manual pageview tracking (App Router)
      capture_pageleave: true,         // Automatic session_end on tab close
      persistence: 'localStorage',     // No cookies by default
      autocapture: false,              // Manual event tracking only (taxonomy control)
      disable_session_recording: true, // Enable selectively per tier later
    })
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}

// Separate component for pageview tracking (App Router pattern)
export function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname
      const utmParams = extractUtmParams(searchParams)
      posthog.capture('page_view', {
        path: pathname,
        ...utmParams,
      })
    }
  }, [pathname, searchParams])

  return null
}

function extractUtmParams(searchParams: ReturnType<typeof useSearchParams>) {
  const params: Record<string, string> = {}
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
    const val = searchParams.get(key)
    if (val) params[key] = val
  }
  return params
}
```

Wire into `app/layout.tsx`:

```typescript
import { PostHogProvider, PostHogPageView } from './providers'
import { Suspense } from 'react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider>
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          {children}
        </PostHogProvider>
      </body>
    </html>
  )
}
```

Key design decisions:
- `capture_pageview: false` because Next.js App Router uses client-side navigation. The automatic PostHog pageview fires on full page loads only, missing route transitions. The `PostHogPageView` component handles this manually via `usePathname()`.
- `autocapture: false` because we maintain a canonical event taxonomy. Autocapture generates noisy, unstructured events that pollute funnels. Every event in ChainIQ is explicitly defined in `analytics-event-taxonomy.md`.
- `persistence: 'localStorage'` avoids setting cookies by default. Cookie consent is handled separately for EU users (see Privacy section below).

### Server-Side: PostHog Node SDK (Bridge Server)

Create `bridge/analytics.js`:

```javascript
// bridge/analytics.js
// Zero-dep wrapper around posthog-node for bridge server event tracking.
// This is the ONE exception to the zero-npm-deps rule for the bridge server --
// posthog-node is installed at the project level (package.json), not in bridge/.

const { PostHog } = require('posthog-node')

let client = null

function getClient() {
  if (!client) {
    client = new PostHog(process.env.POSTHOG_API_KEY, {
      host: process.env.POSTHOG_HOST || 'https://us.i.posthog.com',
      flushAt: 20,         // Batch 20 events before sending
      flushInterval: 10000 // Or flush every 10 seconds, whichever comes first
    })
  }
  return client
}

/**
 * Track a server-side event.
 * @param {string} userId - Raw Supabase user UUID (will be hashed internally)
 * @param {string} event - Event name from taxonomy
 * @param {object} properties - Event properties
 */
function trackEvent(userId, event, properties = {}) {
  const crypto = require('crypto')
  const userIdHash = crypto.createHash('sha256').update(userId).digest('hex')

  getClient().capture({
    distinctId: userIdHash,
    event,
    properties: {
      ...properties,
      source: 'bridge',
      timestamp: new Date().toISOString(),
    }
  })
}

/**
 * Identify a user with properties (called on signup/login).
 * No PII -- only hashed ID and tier.
 */
function identifyUser(userId, properties = {}) {
  const crypto = require('crypto')
  const userIdHash = crypto.createHash('sha256').update(userId).digest('hex')

  getClient().identify({
    distinctId: userIdHash,
    properties: {
      tier: properties.tier || 'none',
      signup_date: properties.signupDate,
      // No email, no name, no IP
    }
  })
}

/**
 * Flush pending events. Call on server shutdown.
 */
async function flush() {
  if (client) {
    await client.flush()
  }
}

module.exports = { trackEvent, identifyUser, flush }
```

### Bridge Server Middleware Pattern

Add analytics tracking to the bridge server request/response cycle in `server.js`:

```javascript
// In server.js dispatch loop, after route handling:
const { trackEvent } = require('./analytics')

// Track every API call (fires after response is sent)
const originalEnd = res.end
res.end = function(...args) {
  const duration = Date.now() - req._startTime
  if (req._userId) {
    trackEvent(req._userId, 'api_call', {
      endpoint: req.url.split('?')[0],
      method: req.method,
      status_code: res.statusCode,
      duration_ms: duration,
      category: 'core',
    })
  }
  originalEnd.apply(res, args)
}
req._startTime = Date.now()
```

This pattern monkey-patches `res.end` to fire the `api_call` event after every response, without modifying individual route handlers. The existing `logger.logRequest()` middleware already sets `req._startTime` -- reuse it.

### Dashboard Event Tracking Hook

Create a reusable React hook for dashboard-side event tracking:

```typescript
// lib/hooks/use-analytics.ts
'use client'

import posthog from 'posthog-js'
import { useCallback } from 'react'
import { useAuth } from './use-auth' // existing auth hook

type EventCategory =
  | 'core' | 'onboarding' | 'ingestion' | 'intelligence'
  | 'generation' | 'publishing' | 'voice' | 'feedback'
  | 'subscription' | 'dashboard'

export function useAnalytics() {
  const { user } = useAuth()

  const track = useCallback((
    event: string,
    properties: Record<string, unknown> = {},
    category: EventCategory = 'dashboard'
  ) => {
    posthog.capture(event, {
      ...properties,
      category,
      source: 'dashboard',
      tier: user?.tier || 'none',
    })
  }, [user?.tier])

  return { track }
}

// Usage in any component:
// const { track } = useAnalytics()
// track('recommendation_accepted', { keyword: 'n54 hpfp', type: 'keyword_gap' }, 'intelligence')
```

---

## Supabase Built-In Analytics

Supabase Pro plan provides the following analytics out of the box with zero configuration:

| Metric | Where to Find | Use Case |
|--------|--------------|----------|
| API request volume | Supabase Dashboard > API > Usage | Monitor bridge server load, detect abuse |
| Database size | Supabase Dashboard > Database > Size | Track storage against 8GB Pro limit |
| Active connections | Supabase Dashboard > Database > Connections | Monitor against 100-connection limit |
| Auth events | Supabase Dashboard > Authentication > Logs | Signup/login/logout tracking (backup to PostHog) |
| RLS policy hits | Supabase Dashboard > Database > Query Performance | Detect slow queries from missing indexes |
| Realtime connections | Supabase Dashboard > Realtime > Usage | Monitor SSE/WebSocket usage |

No additional setup is required. Supabase analytics serve as a cross-check against PostHog numbers and provide infrastructure-level visibility that PostHog does not cover.

For custom usage queries (e.g., articles generated per client per month), query Supabase directly:

```sql
-- Articles per client per month (usage metric for billing)
SELECT
  user_id,
  date_trunc('month', created_at) AS month,
  COUNT(*) AS articles_generated
FROM articles
WHERE created_at >= NOW() - INTERVAL '6 months'
GROUP BY user_id, month
ORDER BY month DESC, articles_generated DESC;
```

These queries run on the existing Supabase database. No separate analytics warehouse is needed until the platform exceeds 25+ clients.

---

## Privacy Implementation

### No PII in Events

All PostHog events follow strict PII rules:

| Data Point | Treatment |
|-----------|-----------|
| User ID (Supabase UUID) | SHA-256 hashed before sending to PostHog |
| Email | Never sent to PostHog |
| Name | Never sent to PostHog |
| IP Address | PostHog `ip: false` flag on server-side events; PostHog project setting to discard IP |
| Domain name | Sent as-is (not PII -- it is the client's public website) |
| Keywords | Sent as-is (not PII -- these are public search terms) |
| Article content | Never sent to PostHog (only metadata: word count, quality score, language) |

### Cookie Consent for EU Users

PostHog is configured with `persistence: 'localStorage'` by default, which avoids cookie consent requirements under ePrivacy Directive. However, for full GDPR compliance:

1. **Detect EU users** via browser `Intl.DateTimeFormat().resolvedOptions().timeZone` (timezone-based, not IP-based).
2. **Show consent banner** for EU-timezone users before initializing PostHog.
3. **If consent denied:** PostHog initializes with `opt_out_capturing: true`. No events are sent. Core product functionality is unaffected.
4. **If consent granted:** PostHog initializes normally. Consent state is stored in `localStorage` under `chainiq_analytics_consent`.

```typescript
// Consent check before PostHog init
const isEU = Intl.DateTimeFormat().resolvedOptions().timeZone.startsWith('Europe/')
  || ['Africa/Ceuta', 'Atlantic/Canary', 'Atlantic/Madeira'].includes(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  )

if (isEU && !hasConsent()) {
  posthog.init(key, { ...config, opt_out_capturing: true })
  showConsentBanner()
} else {
  posthog.init(key, config)
}
```

MENA users (primary market) are not subject to GDPR. The consent mechanism is primarily for European agency clients in the secondary market.

### Server-Side Events and IP

Bridge server events use the PostHog Node SDK which does not capture IP by default. Explicitly disable IP capture in the PostHog project settings (Project Settings > Privacy > Discard client IP data).

---

## Server-Side vs Client-Side Event Routing

| Event Category | Primary Source | SDK | Why |
|---------------|---------------|-----|-----|
| Core (page_view, session_*) | Dashboard | posthog-js | Browser-native events |
| Core (api_call, error_occurred) | Bridge server | posthog-node | Server-side request tracking |
| Onboarding | Dashboard | posthog-js | UI interaction events |
| Data Ingestion | Bridge server | posthog-node | Background processes, no UI |
| Intelligence | Bridge server (generation) + Dashboard (acceptance) | Both | Split: generation is server-side, user actions are client-side |
| Generation | Bridge server | posthog-node | Pipeline runs entirely server-side |
| Publishing | Bridge server | posthog-node | CMS API calls are server-side |
| Voice | Bridge server | posthog-node | Analysis runs server-side |
| Feedback | Bridge server | posthog-node | Scheduled background jobs |
| Subscription | Bridge server | posthog-node | Stripe webhooks are server-side |
| Dashboard | Dashboard | posthog-js | UI interaction events |

The split is clean: if it happens in the browser, use posthog-js. If it happens on the bridge server or in background jobs, use posthog-node. Both write to the same PostHog project and use the same hashed `distinctId`, so events from both sources merge into a single user timeline.

---

## PostHog Custom Dashboards

### Dashboard 1: Activation Funnel

**Purpose:** Track the primary conversion funnel from signup to value delivery.

```
Funnel steps (sequential, 14-day conversion window):
1. signup_completed
2. connection_added
3. crawl_completed
4. first_recommendation_viewed
5. article_generation_completed
6. article_published
7. performance_check_completed (30-day)
```

**Filters:** Tier, signup date range, first connection provider.
**Review cadence:** Weekly.
**Key metric:** Overall funnel conversion rate (signup to published article).
**Alert:** If step 2 to step 3 drop-off exceeds 50%, investigate crawler failures.

### Dashboard 2: Retention by Tier

**Purpose:** Track weekly active users segmented by subscription tier.

**Definition of "active":** User triggered at least one event in categories: `intelligence`, `generation`, `publishing`, or `feedback` during the week. `page_view` alone does not count as active.

```
Cohort retention matrix:
- Rows: Signup week cohort
- Columns: Week 1, Week 2, ... Week 12
- Cells: % of cohort still active
- Breakdown: Creator, Growth, Professional, Agency, Enterprise
```

**Review cadence:** Monthly.
**Target:** Week 4 retention > 60% for Professional+ tiers.
**Alert:** If any tier's Week 2 retention drops below 40%, trigger product review.

### Dashboard 3: Feature Adoption

**Purpose:** Track which features drive engagement and retention.

| Feature | Adoption Event | Target Adoption (30-day) |
|---------|---------------|-------------------------|
| Data connections | `connection_added` | 90% of active users |
| Intelligence recommendations | `recommendation_accepted` | 60% of active users |
| Article generation | `article_generation_completed` | 80% of active users |
| CMS publishing | `article_published` | 50% of active users |
| Voice personas | `voice_analysis_completed` | 30% of active users |
| Performance tracking | `performance_check_completed` | 20% of active users (requires 30+ days) |
| Report export | `report_exported` | 15% of active users |

**Review cadence:** Monthly.
**Key insight:** Features with low adoption but high retention correlation should be promoted in onboarding.

### Dashboard 4: Pipeline Health

**Purpose:** Monitor the generation pipeline's reliability and quality.

| Metric | Event Source | Calculation | Target |
|--------|-------------|-------------|--------|
| Pipeline success rate | `article_generation_completed` / (`completed` + `failed`) | Percentage | > 85% |
| Average quality score | `quality_gate_scored` where `attempt_number = 1` | Mean of `score` | > 70 |
| First-draft pass rate | `quality_gate_scored` where `attempt_number = 1 AND passed = true` | Percentage | > 40% |
| Average generation time | `article_generation_completed.duration_seconds` | Mean | < 600 seconds |
| Revision rate | `quality_gate_revision_triggered` count / `quality_gate_scored` count | Percentage | < 60% |
| API cost per article | `article_generation_completed.api_cost_cents` | Mean | < 1500 ($15) |

**Review cadence:** Weekly during active development, bi-weekly after stabilization.
**Alert:** If pipeline success rate drops below 70%, halt new feature development and investigate.

### Dashboard 5: Revenue Intelligence

**Purpose:** Connect product usage to financial outcomes.

| Metric | Events Used | Calculation |
|--------|-------------|-------------|
| MRR by tier | `subscription_started`, `plan_upgraded`, `plan_downgraded`, `subscription_cancelled` | Sum of active subscription values |
| Expansion revenue | `plan_upgraded.price_delta_cents` | Sum of upgrade deltas per month |
| Churn rate | `subscription_cancelled` count / active subscriptions | Monthly percentage |
| Time to first paid | `signup_completed` to `subscription_started` | Median duration |
| Usage-to-revenue correlation | `article_generation_completed` count vs tier | Scatter plot per tier |

**Review cadence:** Monthly.
**Key insight:** Clients who generate 10+ articles in Month 1 have 3x higher retention (hypothesis to validate with data).

---

## Implementation Checklist

### Phase A (Weeks 1-6)

- [ ] Install `posthog-js` and `posthog-node`
- [ ] Create `app/providers.tsx` with PostHog initialization
- [ ] Create `PostHogPageView` component in root layout
- [ ] Create `bridge/analytics.js` with `trackEvent`, `identifyUser`, `flush`
- [ ] Add `res.end` monkey-patch to `server.js` for `api_call` tracking
- [ ] Create `useAnalytics` React hook
- [ ] Implement all Core events (5)
- [ ] Implement all Onboarding events (6)
- [ ] Implement all Data Ingestion events (7)
- [ ] Set up Activation Funnel dashboard in PostHog
- [ ] Configure PostHog project: discard IP, set session timeout to 30 minutes
- [ ] Add `flush()` call to bridge server graceful shutdown handler

### Phase B (Weeks 7-14)

- [ ] Implement all Intelligence events (6)
- [ ] Implement all Generation events (6)
- [ ] Implement all Publishing events (4)
- [ ] Set up Pipeline Health dashboard
- [ ] Set up Feature Adoption dashboard

### Phase C (Weeks 15-22)

- [ ] Implement all Voice events (5)
- [ ] Implement all Subscription events (4)
- [ ] Set up Retention by Tier dashboard
- [ ] Set up Revenue Intelligence dashboard
- [ ] Implement EU cookie consent banner

### Phase D (Weeks 23-30)

- [ ] Implement all Feedback events (3)
- [ ] Implement all Dashboard events (3)
- [ ] Set up cross-dashboard alerts (Slack webhook integration)
- [ ] Validate event taxonomy completeness against financial model
- [ ] First full-funnel analysis report
