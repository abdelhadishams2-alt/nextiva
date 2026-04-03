# ChainIQ Analytics Event Taxonomy

**Last Updated:** 2026-03-28
**Source:** System architecture spec, success metrics, financial model, product overview
**Audience:** Engineering (implementation), Product (validation), Data (dashboards)
**Event Count:** 62 canonical events across 10 categories

---

## Taxonomy Principles

1. **Snake_case everywhere.** Event names use `snake_case`. Property names use `snake_case`. No camelCase, no kebab-case, no mixed conventions.
2. **Category prefix is implicit.** Events belong to a category but the category is NOT part of the event name. `article_generated` not `generation_article_generated`. Category is a metadata property sent with every event.
3. **Properties are typed.** Every property has an explicit type: `string`, `number`, `boolean`, `enum`, `timestamp`. No untyped bags of JSON.
4. **No PII in events.** User identifiers are hashed (`sha256(user_id)`). No email, no name, no IP address in event properties. See `analytics-setup-spec.md` for privacy implementation.
5. **Every event fires exactly once per user action.** No double-firing. No conditional firing based on A/B variants. Deduplication is the caller's responsibility.
6. **Timestamps are ISO 8601 UTC.** `2026-03-28T14:22:00.000Z`. No local time, no Unix epoch, no ambiguous formats.

---

## Global Properties (Sent With Every Event)

These properties are automatically attached to every event by the tracking middleware. Individual event definitions below list only their **additional** properties.

| Property | Type | Description |
|----------|------|-------------|
| `event_id` | `string (uuid)` | Unique event identifier for deduplication |
| `user_id_hash` | `string (sha256)` | Hashed Supabase auth user ID -- never raw UUID |
| `session_id` | `string (uuid)` | Browser session or API session identifier |
| `timestamp` | `timestamp (ISO 8601)` | UTC time the event fired |
| `category` | `enum` | One of: `core`, `onboarding`, `ingestion`, `intelligence`, `generation`, `publishing`, `voice`, `feedback`, `subscription`, `dashboard` |
| `source` | `enum` | `dashboard` (client-side posthog-js), `bridge` (server-side posthog-node), `plugin` (CMS plugin heartbeat) |
| `tier` | `enum` | User's current subscription tier: `creator`, `growth`, `professional`, `agency`, `enterprise`, `trial`, `none` |
| `platform_version` | `string` | ChainIQ platform version (e.g., `1.0.0-alpha`) |

---

## Category 1: Core Events (Always Tracked)

These events form the foundation of all analytics. They fire regardless of feature usage and provide baseline traffic/error data.

### `page_view`

| Property | Type | Description |
|----------|------|-------------|
| `path` | `string` | Dashboard route path (e.g., `/dashboard/intelligence`) |
| `referrer` | `string` | Previous page path (internal navigation) or external referrer |
| `query_params` | `string` | Sanitized query string (utm_* parameters only, no sensitive data) |

**When it fires:** On every Next.js App Router page navigation (client-side router change or full page load).
**Implementation:** `app/layout.tsx` -- PostHog `pageview` autocapture via `PostHogPageView` component in the root layout. Fires on `pathname` change via `usePathname()` hook.

### `session_start`

| Property | Type | Description |
|----------|------|-------------|
| `device_type` | `enum` | `desktop`, `tablet`, `mobile` |
| `browser` | `string` | Browser name and major version (e.g., `Chrome 124`) |
| `locale` | `string` | Browser locale (e.g., `en-US`, `ar-SA`) |

**When it fires:** On first page load when no active session exists (PostHog handles session windowing with 30-minute inactivity timeout).
**Implementation:** `app/providers.tsx` -- PostHog SDK auto-detects session start. Custom properties enriched via `posthog.register()` on initialization.

### `session_end`

| Property | Type | Description |
|----------|------|-------------|
| `duration_seconds` | `number` | Total session duration in seconds |
| `pages_viewed` | `number` | Count of distinct pages viewed during session |
| `events_fired` | `number` | Total event count during session |

**When it fires:** On browser `beforeunload` event or after 30-minute inactivity (PostHog session timeout).
**Implementation:** `app/providers.tsx` -- PostHog `$session_end` event. Custom properties calculated from session accumulator.

### `error_occurred`

| Property | Type | Description |
|----------|------|-------------|
| `error_type` | `enum` | `api_error`, `auth_error`, `network_error`, `validation_error`, `server_error`, `unknown` |
| `error_code` | `number` | HTTP status code or internal error code |
| `error_message` | `string` | Sanitized error message (no stack traces, no PII) |
| `endpoint` | `string` | API endpoint that errored (e.g., `/api/generate`) |
| `component` | `string` | React component or server module where error was caught |

**When it fires:** On any caught error in the dashboard (React Error Boundary) or bridge server (error middleware).
**Implementation:** Dashboard: `app/error.tsx` global error boundary + per-route error handlers. Bridge: error handler in `server.js` dispatch loop after route matching.

### `api_call`

| Property | Type | Description |
|----------|------|-------------|
| `endpoint` | `string` | Bridge server endpoint path (e.g., `/api/intelligence/recommendations`) |
| `method` | `enum` | `GET`, `POST`, `PUT`, `DELETE`, `PATCH` |
| `status_code` | `number` | HTTP response status code |
| `duration_ms` | `number` | Request-to-response time in milliseconds |
| `request_size_bytes` | `number` | Request body size |
| `response_size_bytes` | `number` | Response body size |

**When it fires:** On every completed HTTP request to the bridge server (success or failure).
**Implementation:** `bridge/server.js` -- response logging middleware. Fires after `res.end()` via monkey-patched response writer (existing pattern in codebase).

---

## Category 2: Onboarding Events

Track the new-user activation funnel. These events map directly to the conversion funnel: signup to first value moment.

### `signup_started`

| Property | Type | Description |
|----------|------|-------------|
| `method` | `enum` | `email`, `google_oauth`, `github_oauth` |
| `utm_source` | `string` | Marketing attribution source |
| `utm_medium` | `string` | Marketing attribution medium |
| `utm_campaign` | `string` | Marketing attribution campaign |

**When it fires:** When user clicks "Sign Up" button or initiates OAuth flow.
**Implementation:** `app/(auth)/signup/page.tsx` -- fires on form submission or OAuth button click.

### `signup_completed`

**CONVERSION EVENT** -- maps to `VISITOR_TO_SIGNUP_RATE`

| Property | Type | Description |
|----------|------|-------------|
| `method` | `enum` | `email`, `google_oauth`, `github_oauth` |
| `time_to_complete_seconds` | `number` | Duration from `signup_started` to completion |

**When it fires:** When Supabase Auth confirms successful account creation (email verified or OAuth token received).
**Implementation:** `app/(auth)/signup/page.tsx` -- fires on Supabase `onAuthStateChange` callback with `SIGNED_IN` event after signup flow.

### `onboarding_step_completed`

| Property | Type | Description |
|----------|------|-------------|
| `step_number` | `number` | Step index (1-based): 1=welcome, 2=connect_data, 3=first_crawl, 4=review_recommendations, 5=generate_first |
| `step_name` | `string` | Human-readable step name |
| `time_on_step_seconds` | `number` | Duration spent on this step |
| `skipped` | `boolean` | Whether user skipped this step |

**When it fires:** When user completes (or explicitly skips) an onboarding wizard step.
**Implementation:** `app/(onboarding)/page.tsx` -- fires on step transition via onboarding state machine.

### `first_connection_added`

| Property | Type | Description |
|----------|------|-------------|
| `provider` | `enum` | `gsc`, `ga4`, `semrush`, `ahrefs`, `google_trends` |
| `time_since_signup_seconds` | `number` | Duration from signup to first connection |

**When it fires:** When user successfully connects their first data source (OAuth verified or API key validated). Only fires once per user -- subsequent connections fire `connection_added`.
**Implementation:** `bridge/routes/connections.js` -- fires when `client_connections` INSERT succeeds AND user has zero prior connections.

### `first_crawl_triggered`

| Property | Type | Description |
|----------|------|-------------|
| `domain` | `string` | Connected domain (e.g., `example.com` -- domain only, no paths) |
| `time_since_connection_seconds` | `number` | Duration from first connection to first crawl |

**When it fires:** When the first content crawl begins for a new user. Only fires once per user.
**Implementation:** `bridge/ingestion/crawler.js` -- fires when crawl starts AND user's `content_inventory` table is empty.

### `first_recommendation_viewed`

**CONVERSION EVENT** -- first value moment

| Property | Type | Description |
|----------|------|-------------|
| `recommendations_available` | `number` | Total recommendations generated for viewing |
| `time_since_signup_seconds` | `number` | Duration from signup to first recommendation view |

**When it fires:** When user opens the Intelligence dashboard and sees recommendations for the first time. Only fires once per user.
**Implementation:** `app/(dashboard)/intelligence/page.tsx` -- fires on page mount if user has never viewed recommendations (tracked via user metadata flag in Supabase).

---

## Category 3: Data Ingestion Events

Track data source management and pipeline reliability. Critical for monitoring the Phase A scheduler health metrics.

### `connection_added`

**CONVERSION EVENT** -- maps to `SIGNUP_TO_ACTIVE_RATE`

| Property | Type | Description |
|----------|------|-------------|
| `provider` | `enum` | `gsc`, `ga4`, `semrush`, `ahrefs`, `google_trends` |
| `auth_method` | `enum` | `oauth`, `api_key` |
| `domains_count` | `number` | Total connections the user now has after this addition |

**When it fires:** When a new data source connection is successfully established and verified.
**Implementation:** `bridge/routes/connections.js` -- fires after successful OAuth token exchange or API key validation, after INSERT into `client_connections`.

### `connection_removed`

| Property | Type | Description |
|----------|------|-------------|
| `provider` | `enum` | `gsc`, `ga4`, `semrush`, `ahrefs`, `google_trends` |
| `reason` | `enum` | `user_initiated`, `token_expired`, `admin_removed` |
| `connection_age_days` | `number` | Days since connection was originally created |

**When it fires:** When a data source connection is deleted or deactivated.
**Implementation:** `bridge/routes/connections.js` -- fires on DELETE endpoint handler.

### `connection_error`

| Property | Type | Description |
|----------|------|-------------|
| `provider` | `enum` | `gsc`, `ga4`, `semrush`, `ahrefs`, `google_trends` |
| `error_type` | `enum` | `oauth_expired`, `rate_limited`, `invalid_credentials`, `api_unavailable`, `permission_denied` |
| `retry_count` | `number` | Number of retries attempted before this error event |
| `will_retry` | `boolean` | Whether the system will automatically retry |

**When it fires:** When a data pull or token refresh fails after exhausting retries.
**Implementation:** `bridge/ingestion/scheduler.js` -- fires after final retry failure in the exponential backoff loop.

### `crawl_started`

| Property | Type | Description |
|----------|------|-------------|
| `domain` | `string` | Target domain being crawled |
| `crawl_type` | `enum` | `full`, `delta`, `sitemap_only` |
| `trigger` | `enum` | `scheduled`, `manual`, `onboarding` |

**When it fires:** When the content crawler begins processing a domain.
**Implementation:** `bridge/ingestion/crawler.js` -- fires at the start of the crawl loop.

### `crawl_completed`

| Property | Type | Description |
|----------|------|-------------|
| `domain` | `string` | Target domain that was crawled |
| `pages_found` | `number` | Total unique URLs discovered |
| `pages_new` | `number` | URLs not previously in content_inventory |
| `pages_updated` | `number` | URLs with changed content since last crawl |
| `duration_seconds` | `number` | Total crawl duration |
| `errors_count` | `number` | Number of URLs that failed to fetch |

**When it fires:** When the content crawler finishes processing all URLs for a domain.
**Implementation:** `bridge/ingestion/crawler.js` -- fires after the crawl loop exits and inventory updates are committed to Supabase.

### `data_sync_completed`

| Property | Type | Description |
|----------|------|-------------|
| `source` | `enum` | `gsc`, `ga4`, `semrush`, `ahrefs`, `google_trends` |
| `rows_synced` | `number` | Number of performance records upserted |
| `date_range_days` | `number` | How many days of data were pulled |
| `duration_seconds` | `number` | Total sync duration |
| `cache_hit_rate` | `number` | Percentage of requests served from api_cache (0-100) |

**When it fires:** When a scheduled or manual data pull completes successfully.
**Implementation:** `bridge/ingestion/scheduler.js` -- fires after each provider's data pull and Supabase upsert completes.

### `data_sync_failed`

| Property | Type | Description |
|----------|------|-------------|
| `source` | `enum` | `gsc`, `ga4`, `semrush`, `ahrefs`, `google_trends` |
| `error_type` | `enum` | `auth_failure`, `rate_limit`, `timeout`, `data_format_error`, `quota_exceeded` |
| `error_message` | `string` | Sanitized error description |
| `rows_before_failure` | `number` | Number of rows successfully synced before failure |

**When it fires:** When a data pull fails and cannot be recovered by retry logic.
**Implementation:** `bridge/ingestion/scheduler.js` -- fires after final retry exhaustion.

---

## Category 4: Intelligence Events

Track the Content Intelligence layer (Layer 2) outputs. These events measure the "brain" of the platform -- whether it produces useful, actionable recommendations.

### `recommendations_generated`

| Property | Type | Description |
|----------|------|-------------|
| `count` | `number` | Number of recommendations produced in this batch |
| `category` | `enum` | `decay_refresh`, `keyword_gap`, `new_topic`, `cannibalization_fix`, `seasonal_opportunity` |
| `domain` | `string` | Domain the recommendations are for |
| `avg_priority_score` | `number` | Average priority score across generated recommendations (0-100) |

**When it fires:** When the intelligence engine completes a recommendation cycle for a domain.
**Implementation:** `bridge/intelligence/gap-analyzer.js` and `bridge/routes/intelligence.js` -- fires after recommendations are written to `keyword_opportunities`.

### `recommendation_accepted`

| Property | Type | Description |
|----------|------|-------------|
| `keyword` | `string` | Target keyword of the accepted recommendation |
| `type` | `enum` | `decay_refresh`, `keyword_gap`, `new_topic`, `cannibalization_fix`, `seasonal_opportunity` |
| `priority_score` | `number` | Priority score at time of acceptance (0-100) |
| `time_to_accept_seconds` | `number` | Duration from recommendation generation to user acceptance |

**When it fires:** When user explicitly accepts a recommendation (clicks "Generate Article" or "Accept" in the Intelligence dashboard).
**Implementation:** `app/(dashboard)/intelligence/page.tsx` -- fires on accept button click, before triggering article generation.

### `recommendation_dismissed`

| Property | Type | Description |
|----------|------|-------------|
| `keyword` | `string` | Target keyword of the dismissed recommendation |
| `type` | `enum` | `decay_refresh`, `keyword_gap`, `new_topic`, `cannibalization_fix`, `seasonal_opportunity` |
| `reason` | `enum` | `not_relevant`, `already_planned`, `too_competitive`, `other`, `no_reason` |

**When it fires:** When user explicitly dismisses a recommendation.
**Implementation:** `app/(dashboard)/intelligence/page.tsx` -- fires on dismiss button click with optional reason selection.

### `decay_alert_triggered`

| Property | Type | Description |
|----------|------|-------------|
| `url` | `string` | URL path of the decaying content (no domain, e.g., `/blog/post-slug`) |
| `severity` | `enum` | `low` (3-month gradual), `medium` (single-month 20%+ drop), `high` (50%+ drop or deindexed) |
| `impressions_change_pct` | `number` | Percentage change in impressions over detection window |
| `position_change` | `number` | Average position change (positive = worse) |

**When it fires:** When the decay detection engine flags a URL as decaying.
**Implementation:** `bridge/intelligence/decay-detector.js` -- fires for each URL that crosses a decay severity threshold.

### `gap_identified`

| Property | Type | Description |
|----------|------|-------------|
| `keyword` | `string` | Keyword opportunity identified |
| `volume` | `number` | Monthly search volume |
| `difficulty` | `number` | Keyword difficulty score (0-100) |
| `competing_urls` | `number` | Number of competitor URLs ranking for this keyword |
| `opportunity_score` | `number` | Calculated opportunity score (0-100) |

**When it fires:** When the gap analyzer identifies a keyword the client does not rank for but competitors do.
**Implementation:** `bridge/intelligence/gap-analyzer.js` -- fires for each gap keyword that scores above the minimum opportunity threshold.

### `cannibalization_detected`

| Property | Type | Description |
|----------|------|-------------|
| `keyword` | `string` | Keyword being cannibalized |
| `urls` | `string[]` | Array of competing URL paths (max 5) |
| `overlap_score` | `number` | Degree of content overlap (0-100) |

**When it fires:** When the cannibalization detector identifies two or more URLs competing for the same keyword.
**Implementation:** `bridge/intelligence/cannibalization.js` -- fires for each cannibalization cluster found.

---

## Category 5: Generation Events

Track the 7-agent article factory (Layer 4). These events are critical for monitoring pipeline health, quality gate effectiveness, and generation costs.

### `article_generation_started`

| Property | Type | Description |
|----------|------|-------------|
| `mode` | `enum` | `mode_a` (user-driven keyword), `mode_b` (agent-recommended) |
| `language` | `string` | Target language code (e.g., `en`, `ar`, `de`) |
| `framework` | `enum` | `html`, `react`, `vue`, `nextjs`, `svelte`, `astro`, `wordpress` |
| `keyword` | `string` | Target keyword or topic |
| `recommendation_id` | `string (uuid) | null` | If Mode B, the recommendation that triggered this generation |
| `persona_id` | `string (uuid) | null` | Voice persona applied, if any |

**When it fires:** When the generation pipeline begins (job enters the queue).
**Implementation:** `bridge/routes/generate.js` -- fires when generation job is created in the job queue.

### `article_generation_completed`

**CONVERSION EVENT** -- maps to `ARTICLES_PER_CLIENT_PER_MONTH`

| Property | Type | Description |
|----------|------|-------------|
| `word_count` | `number` | Final article word count |
| `quality_score` | `number` | Final composite quality score (0-100) |
| `duration_seconds` | `number` | Total pipeline duration (queue entry to completion) |
| `revision_count` | `number` | Number of quality gate revisions (0, 1, or 2) |
| `mode` | `enum` | `mode_a`, `mode_b` |
| `language` | `string` | Target language code |
| `framework` | `enum` | `html`, `react`, `vue`, `nextjs`, `svelte`, `astro`, `wordpress` |
| `api_cost_cents` | `number` | Total API cost in cents (Claude + research APIs) |
| `agents_used` | `number` | Number of pipeline agents that executed (4-7) |

**When it fires:** When the full generation pipeline completes and the article is saved.
**Implementation:** `bridge/routes/generate.js` -- fires after final article is stored and job status is updated to `completed`.

### `article_generation_failed`

| Property | Type | Description |
|----------|------|-------------|
| `error_type` | `enum` | `agent_timeout`, `api_quota_exceeded`, `quality_gate_max_revisions`, `claude_error`, `network_error`, `validation_error` |
| `error_message` | `string` | Sanitized error description |
| `failed_at_agent` | `enum` | `topic_recommender`, `voice_analyzer`, `project_analyzer`, `research_engine`, `article_architect`, `draft_writer`, `quality_gate` |
| `duration_seconds` | `number` | Time elapsed before failure |
| `partial_output` | `boolean` | Whether partial article content was saved |

**When it fires:** When the generation pipeline fails at any stage and cannot recover.
**Implementation:** `bridge/routes/generate.js` -- fires in the job error handler.

### `quality_gate_scored`

| Property | Type | Description |
|----------|------|-------------|
| `score` | `number` | Composite quality score (0-100) |
| `passed` | `boolean` | Whether the article passed the quality gate (score >= 70) |
| `eeat_score` | `number` | E-E-A-T signal score (0-30) |
| `topical_completeness` | `number` | Topic coverage percentage (0-100) |
| `voice_match` | `number` | Stylometric distance from target persona (0-1, lower is better) |
| `ai_detection_score` | `number` | Human-likeness score (0-100, higher is more human) |
| `freshness_score` | `number` | Data freshness score (0-10) |
| `technical_seo_score` | `number` | Technical SEO checklist score (0-10) |
| `readability_score` | `number` | Flesch-Kincaid grade level |
| `attempt_number` | `number` | Which scoring pass this is (1 = first draft, 2 = first revision, 3 = second revision) |

**When it fires:** Every time the quality gate scores an article (initial and after each revision).
**Implementation:** `bridge/intelligence/quality-gate.js` (future) -- fires after scoring completes.

### `quality_gate_revision_triggered`

| Property | Type | Description |
|----------|------|-------------|
| `attempt_number` | `number` | Revision attempt number (1 or 2; max 2 revisions) |
| `previous_score` | `number` | Score before this revision |
| `failing_signals` | `string[]` | Array of signal names that failed (e.g., `["voice_match", "ai_detection"]`) |
| `revision_instructions` | `string` | Summary of what the revision should fix (first 200 chars) |

**When it fires:** When the quality gate determines an article needs revision and re-invokes the draft writer.
**Implementation:** `bridge/intelligence/quality-gate.js` (future) -- fires before sending revision instructions to draft-writer agent.

### `voice_profile_applied`

| Property | Type | Description |
|----------|------|-------------|
| `persona_id` | `string (uuid)` | Voice persona ID applied to generation |
| `persona_name` | `string` | Human-readable persona label |
| `articles_in_corpus` | `number` | Number of articles used to train this persona |
| `confidence` | `enum` | `low` (< 15 articles), `medium` (15-30), `high` (> 30) |

**When it fires:** When the voice analyzer agent applies a persona to the draft writer.
**Implementation:** `bridge/routes/generate.js` -- fires after voice persona is selected and injected into the pipeline context.

---

## Category 6: Publishing Events

Track the Universal Publishing layer (Layer 5). Monitor CMS adapter reliability and publishing success rates.

### `article_published`

**CONVERSION EVENT** -- end of the primary funnel

| Property | Type | Description |
|----------|------|-------------|
| `platform` | `enum` | `wordpress`, `shopify`, `ghost`, `contentful`, `strapi`, `webflow`, `sanity`, `webhook` |
| `cms_type` | `enum` | `self_hosted`, `saas`, `headless`, `webhook` |
| `status` | `enum` | `published`, `draft`, `scheduled` |
| `article_id` | `string (uuid)` | ChainIQ article ID |
| `word_count` | `number` | Published article word count |
| `has_featured_image` | `boolean` | Whether a featured image was included |
| `has_seo_meta` | `boolean` | Whether meta title/description were set |
| `time_since_generation_seconds` | `number` | Duration from generation completion to publish |

**When it fires:** When an article is successfully pushed to a CMS.
**Implementation:** `bridge/routes/publish.js` -- fires after CMS API confirms successful creation.

### `publish_failed`

| Property | Type | Description |
|----------|------|-------------|
| `platform` | `enum` | `wordpress`, `shopify`, `ghost`, `contentful`, `strapi`, `webflow`, `sanity`, `webhook` |
| `error_type` | `enum` | `auth_failure`, `rate_limited`, `validation_error`, `cms_unavailable`, `content_rejected`, `timeout` |
| `error_message` | `string` | Sanitized error description |
| `retry_count` | `number` | Number of retries attempted |

**When it fires:** When a publish attempt fails after exhausting retries.
**Implementation:** `bridge/routes/publish.js` -- fires after final retry failure.

### `publish_as_draft`

| Property | Type | Description |
|----------|------|-------------|
| `platform` | `enum` | `wordpress`, `shopify`, `ghost`, `contentful`, `strapi`, `webflow`, `sanity`, `webhook` |
| `article_id` | `string (uuid)` | ChainIQ article ID |

**When it fires:** When user explicitly publishes an article as a draft (not live).
**Implementation:** `bridge/routes/publish.js` -- fires when publish request specifies `status: 'draft'`.

### `publish_scheduled`

| Property | Type | Description |
|----------|------|-------------|
| `platform` | `enum` | `wordpress`, `shopify`, `ghost`, `contentful`, `strapi`, `webflow`, `sanity`, `webhook` |
| `article_id` | `string (uuid)` | ChainIQ article ID |
| `scheduled_for` | `timestamp (ISO 8601)` | When the article is scheduled to go live |
| `days_until_publish` | `number` | Days between now and scheduled date |

**When it fires:** When user schedules an article for future publication.
**Implementation:** `bridge/routes/publish.js` -- fires when publish request specifies `status: 'scheduled'` with a future date.

---

## Category 7: Voice Events

Track the Voice Intelligence layer (Layer 3). Monitor corpus analysis quality and persona adoption.

### `voice_analysis_started`

| Property | Type | Description |
|----------|------|-------------|
| `domain` | `string` | Domain whose content is being analyzed |
| `articles_queued` | `number` | Number of articles queued for analysis |
| `trigger` | `enum` | `onboarding`, `manual`, `scheduled`, `connection_added` |

**When it fires:** When the stylometric analysis pipeline begins processing a domain's content corpus.
**Implementation:** `bridge/intelligence/voice-analyzer.js` -- fires at the start of the analysis pipeline.

### `voice_analysis_completed`

| Property | Type | Description |
|----------|------|-------------|
| `personas_found` | `number` | Number of distinct writer personas detected |
| `articles_analyzed` | `number` | Number of articles successfully analyzed |
| `articles_classified_human` | `number` | Articles classified as human-written |
| `articles_classified_ai` | `number` | Articles classified as AI-generated |
| `articles_classified_hybrid` | `number` | Articles classified as hybrid |
| `duration_seconds` | `number` | Total analysis duration |
| `clustering_method` | `enum` | `kmeans`, `hdbscan` |
| `silhouette_score` | `number` | Clustering quality score (-1 to 1) |

**When it fires:** When the full voice analysis pipeline completes (classification + clustering + persona generation).
**Implementation:** `bridge/intelligence/voice-analyzer.js` -- fires after all personas are written to `writer_personas`.

### `persona_created`

| Property | Type | Description |
|----------|------|-------------|
| `persona_id` | `string (uuid)` | New persona identifier |
| `articles_in_corpus` | `number` | Number of articles attributed to this persona |
| `confidence` | `enum` | `low`, `medium`, `high` |
| `is_default` | `boolean` | Whether this persona was set as default |
| `source` | `enum` | `auto_detected`, `manual_created` |

**When it fires:** When a new writer persona is created (either by automatic detection or manual user creation).
**Implementation:** `bridge/routes/voice.js` -- fires after INSERT into `writer_personas`.

### `persona_edited`

| Property | Type | Description |
|----------|------|-------------|
| `persona_id` | `string (uuid)` | Edited persona identifier |
| `fields_changed` | `string[]` | Array of field names that were modified |

**When it fires:** When user edits a persona's properties (name, style overrides, tone adjustments).
**Implementation:** `bridge/routes/voice.js` -- fires after UPDATE on `writer_personas`.

### `persona_set_default`

| Property | Type | Description |
|----------|------|-------------|
| `persona_id` | `string (uuid)` | Persona set as default |
| `previous_default_id` | `string (uuid) | null` | Previous default persona, if any |

**When it fires:** When user designates a persona as the default voice for future article generation.
**Implementation:** `bridge/routes/voice.js` -- fires after default flag update on `writer_personas`.

---

## Category 8: Feedback Events

Track the Feedback Loop (Layer 6) -- the core data moat. These events measure prediction accuracy and the recalibration engine's effectiveness.

### `performance_check_completed`

**CONVERSION EVENT** -- maps to `PREDICTION_ACCURACY` (North Star quality metric)

| Property | Type | Description |
|----------|------|-------------|
| `article_id` | `string (uuid)` | Article being tracked |
| `check_day` | `enum` | `30`, `60`, `90` |
| `predicted_traffic` | `number` | Traffic predicted at generation time |
| `actual_traffic` | `number` | Actual traffic at check time |
| `predicted_position` | `number` | Predicted average search position |
| `actual_position` | `number` | Actual average search position |
| `accuracy_score` | `number` | Normalized accuracy score (0-100) |
| `outcome` | `enum` | `exceeded_prediction`, `met_prediction`, `below_prediction`, `significantly_below` |

**When it fires:** At 30, 60, and 90 days post-publication when the performance tracker pulls actuals and compares to predictions.
**Implementation:** `bridge/intelligence/performance-tracker.js` -- fires after each prediction-vs-actual comparison is stored in `performance_predictions`.

### `recalibration_triggered`

| Property | Type | Description |
|----------|------|-------------|
| `domain` | `string` | Domain whose scoring weights are being recalibrated |
| `articles_in_sample` | `number` | Number of articles with 90-day performance data |
| `pre_calibration_accuracy` | `number` | Average accuracy score before recalibration |
| `weight_changes` | `object` | JSON object of weight adjustments (e.g., `{"impressions": 0.28, "decay_severity": 0.27}`) |

**When it fires:** When the recalibration engine runs (triggered after accumulating 3+ months of prediction-vs-actual data for a domain).
**Implementation:** `bridge/intelligence/performance-tracker.js` -- fires when recalibration completes and new weights are stored.

### `prediction_accuracy_improved`

| Property | Type | Description |
|----------|------|-------------|
| `domain` | `string` | Domain showing improvement |
| `previous_accuracy` | `number` | Average accuracy before recalibration (0-100) |
| `new_accuracy` | `number` | Average accuracy after recalibration (0-100) |
| `improvement_pct` | `number` | Percentage point improvement |
| `recalibration_cycle` | `number` | Which recalibration cycle produced this improvement (1, 2, 3...) |

**When it fires:** When post-recalibration accuracy measurement confirms improvement over the previous cycle.
**Implementation:** `bridge/intelligence/performance-tracker.js` -- fires during the next performance check cycle after recalibration, when improvement is confirmed.

---

## Category 9: Subscription Events

Track billing lifecycle events. These map directly to financial model metrics.

### `subscription_started`

**CONVERSION EVENT** -- maps to `SIGNUP_TO_PAID_RATE`

| Property | Type | Description |
|----------|------|-------------|
| `tier` | `enum` | `creator`, `growth`, `professional`, `agency`, `enterprise` |
| `billing_cycle` | `enum` | `monthly`, `annual` |
| `price_cents` | `number` | Subscription price in cents |
| `trial_days_used` | `number` | Days of trial consumed before subscribing (0 if no trial) |
| `time_since_signup_days` | `number` | Days between account creation and first subscription |

**When it fires:** When Stripe confirms a new subscription is active (webhook: `customer.subscription.created`).
**Implementation:** `bridge/routes/subscriptions.js` (future) -- fires on Stripe webhook handler.

### `subscription_cancelled`

| Property | Type | Description |
|----------|------|-------------|
| `tier` | `enum` | `creator`, `growth`, `professional`, `agency`, `enterprise` |
| `reason` | `enum` | `too_expensive`, `not_enough_value`, `switched_competitor`, `project_ended`, `other` |
| `subscription_age_days` | `number` | Days between subscription start and cancellation |
| `articles_generated_total` | `number` | Total articles generated during subscription |
| `last_active_days_ago` | `number` | Days since last meaningful platform action |

**When it fires:** When a subscription is cancelled (Stripe webhook: `customer.subscription.deleted`).
**Implementation:** `bridge/routes/subscriptions.js` (future) -- fires on Stripe webhook handler.

### `plan_upgraded`

**CONVERSION EVENT** -- maps to `UPGRADE_RATE`

| Property | Type | Description |
|----------|------|-------------|
| `from_tier` | `enum` | `creator`, `growth`, `professional`, `agency` |
| `to_tier` | `enum` | `growth`, `professional`, `agency`, `enterprise` |
| `price_delta_cents` | `number` | Monthly price increase in cents |
| `trigger` | `enum` | `self_serve`, `sales_assisted`, `auto_upgrade_limit` |

**When it fires:** When a subscription is upgraded to a higher tier (Stripe webhook: `customer.subscription.updated` with higher plan).
**Implementation:** `bridge/routes/subscriptions.js` (future) -- fires on Stripe webhook handler.

### `plan_downgraded`

| Property | Type | Description |
|----------|------|-------------|
| `from_tier` | `enum` | `growth`, `professional`, `agency`, `enterprise` |
| `to_tier` | `enum` | `creator`, `growth`, `professional`, `agency` |
| `price_delta_cents` | `number` | Monthly price decrease in cents |
| `reason` | `enum` | `reduce_cost`, `fewer_features_needed`, `team_size_reduced`, `other` |

**When it fires:** When a subscription is downgraded to a lower tier.
**Implementation:** `bridge/routes/subscriptions.js` (future) -- fires on Stripe webhook handler.

---

## Category 10: Dashboard Events

Track feature adoption and dashboard interaction patterns. These inform product decisions about which features drive retention.

### `dashboard_section_viewed`

| Property | Type | Description |
|----------|------|-------------|
| `section` | `enum` | `overview`, `intelligence`, `generation`, `publishing`, `voice`, `performance`, `settings`, `connections`, `billing` |
| `time_on_section_seconds` | `number` | Duration spent on this section before navigating away |

**When it fires:** When user navigates to a major dashboard section (debounced -- does not fire for sub-second visits).
**Implementation:** `app/(dashboard)/layout.tsx` -- fires on route change with minimum 2-second dwell time.

### `report_exported`

| Property | Type | Description |
|----------|------|-------------|
| `report_type` | `enum` | `performance_summary`, `content_inventory`, `recommendations`, `voice_profiles`, `prediction_accuracy` |
| `format` | `enum` | `pdf`, `csv`, `json` |
| `rows_exported` | `number` | Number of data rows in the export |

**When it fires:** When user exports a report or dataset from the dashboard.
**Implementation:** `app/(dashboard)/*/export.tsx` -- fires on export button click after file generation.

### `filter_applied`

| Property | Type | Description |
|----------|------|-------------|
| `page` | `string` | Dashboard page where filter was applied |
| `filter_type` | `enum` | `date_range`, `status`, `category`, `priority`, `language`, `cms_platform` |
| `filter_value` | `string` | Selected filter value (sanitized -- no PII) |

**When it fires:** When user applies a filter or sort on any dashboard data table.
**Implementation:** Dashboard data table components -- fires on filter state change.

---

## Event Summary Table

| Category | Event Count | Key Conversion Events |
|----------|-------------|----------------------|
| Core | 5 | -- |
| Onboarding | 6 | `signup_completed`, `first_recommendation_viewed` |
| Data Ingestion | 7 | `connection_added` |
| Intelligence | 6 | `recommendation_accepted` |
| Generation | 6 | `article_generation_completed` |
| Publishing | 4 | `article_published` |
| Voice | 5 | -- |
| Feedback | 3 | `performance_check_completed` |
| Subscription | 4 | `subscription_started`, `plan_upgraded` |
| Dashboard | 3 | -- |
| **Total** | **49 unique events** | **8 conversion events** |

Plus 13 global properties attached to every event = **62 tracked data points**.

---

## Conversion Funnel (Primary)

```
signup_completed
  └─ connection_added
       └─ crawl_completed
            └─ first_recommendation_viewed
                 └─ recommendation_accepted
                      └─ article_generation_completed
                           └─ article_published
                                └─ performance_check_completed (30-day)
                                     └─ performance_check_completed (90-day)
```

Each step in this funnel is a conversion event tracked in PostHog. The funnel visualization in PostHog dashboards shows drop-off rates at each stage, enabling targeted product improvements.

---

## Implementation Priority

**Phase A (implement immediately):**
- All Core events (5)
- All Onboarding events (6)
- All Data Ingestion events (7)
- `error_occurred` with full bridge server coverage

**Phase B (implement with intelligence + generation features):**
- All Intelligence events (6)
- All Generation events (6)
- All Publishing events (4)

**Phase C (implement with voice + subscriptions):**
- All Voice events (5)
- All Subscription events (4)

**Phase D (implement with feedback loop):**
- All Feedback events (3)
- All Dashboard events (3)
