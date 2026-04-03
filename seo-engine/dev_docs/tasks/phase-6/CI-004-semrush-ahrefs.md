# CI-004: Semrush & Ahrefs Connectors

> **Phase:** 6 | **Priority:** P2 | **Status:** NOT STARTED
> **Effort:** L (8h) | **Type:** feature
> **Sprint:** 5 (Weeks 9-10)
> **Depends On:** DI-001 (client_connections infrastructure), DI-005 (scheduler for weekly runs)
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `dev_docs/services/data-ingestion.md` — Semrush and Ahrefs connector specs, API details, cost management, 7-day cache
3. `bridge/ingestion/gsc.js` — reference connector pattern (error handling, data normalization, storage)
4. `bridge/key-manager.js` — AES-256-GCM encryption for API key storage
5. `bridge/supabase-client.js` — database operations pattern
6. `PROJECT-BRIEF.md` — Section 4, Layer 1 (Semrush/Ahrefs data pulled, cost management)

## Objective
Build the Semrush and Ahrefs API connectors as additive data sources that enrich the intelligence engine with keyword research, competitor gap analysis, backlink profiles, and domain authority scores. Implement a 7-day caching layer to manage API costs. These connectors are optional — the system works fully without them using GSC data only. Semrush and Ahrefs API keys are ChainIQ-owned (shared across clients), not per-client OAuth.

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `bridge/ingestion/semrush.js` | Semrush API connector: keyword research, keyword gap, domain analytics |
| CREATE | `bridge/ingestion/ahrefs.js` | Ahrefs API connector: backlink profile, domain rating, keyword explorer |
| MODIFY | `bridge/server.js` | Register endpoints: `POST /api/connections/semrush`, `POST /api/connections/ahrefs`, trigger endpoints |
| MODIFY | `bridge/ingestion/scheduler.js` | Add Semrush (Monday) and Ahrefs (Tuesday) to schedule |

## Sub-tasks

### Sub-task 1: Build Semrush connector (`bridge/ingestion/semrush.js`) (~3h)
- Create `bridge/ingestion/semrush.js` exporting a `SemrushConnector` class
- **Constructor:** accepts `{ supabaseClient, keyManager }`. API key loaded from env var `SEMRUSH_API_KEY` (ChainIQ's key, never exposed to clients).
- **`fetchDomainAnalytics(domain)`** — Domain overview:
  - Endpoint: `https://api.semrush.com/analytics/v1/?type=domain_organic&key={key}&domain={domain}&database=us`
  - Parse: organic traffic estimate, total keywords ranking, top pages list
  - Store results in `keyword_opportunities` metadata as supplementary data
- **`fetchKeywordGap(domain, competitors)`** — Keyword gap analysis:
  - Endpoint: `https://api.semrush.com/analytics/v1/?type=domain_domain&key={key}&domains={domains}`
  - Find keywords competitors rank for but the client does not
  - Enrich `keyword_opportunities` records of type `gap` with Semrush keyword difficulty (KD), search volume, and SERP features
- **`fetchTopicResearch(keyword)`** — Related subtopics and questions:
  - Endpoint: `https://api.semrush.com/analytics/v1/?type=phrase_related&key={key}&phrase={keyword}`
  - Return related subtopics, question-based queries, and estimated volumes
  - Used by topic recommender to enhance recommendation quality
- **Error handling:** Follow GSC connector pattern — 401 (invalid key → alert admin), 429 (exponential backoff), 403 (quota exceeded → pause, use cached data)
- **API cost tracking:** Log API units consumed per call. Store running total in `ingestion_jobs.metadata.api_units`. Target: <= 10-30 API calls per client per sync.

### Sub-task 2: Build Ahrefs connector (`bridge/ingestion/ahrefs.js`) (~3h)
- Create `bridge/ingestion/ahrefs.js` exporting an `AhrefsConnector` class
- **Constructor:** accepts `{ supabaseClient, keyManager }`. API token loaded from env var `AHREFS_API_TOKEN`.
- **`fetchBacklinkProfile(domain)`** — Backlink overview:
  - Endpoint: `https://api.ahrefs.com/v3/site-explorer/backlinks?target={domain}&mode=domain`
  - Parse: total backlinks, referring domains, domain rating (DR)
  - Store per-URL backlink counts in `performance_snapshots.metadata.ahrefs`
- **`fetchDomainRating(domain)`** — Domain authority:
  - Endpoint: `https://api.ahrefs.com/v3/site-explorer/domain-rating?target={domain}`
  - Return domain rating (0-100) and historical trend
  - Used in health_score calculation (authority_score component)
- **`fetchKeywordExplorer(keyword)`** — Keyword research:
  - Endpoint: `https://api.ahrefs.com/v3/keywords-explorer/overview?keyword={keyword}`
  - Return: keyword difficulty, search volume, SERP overview, CPC
  - Enrich `keyword_opportunities` with Ahrefs-specific difficulty scores
- **Error handling:** 401 (invalid token → alert admin), 429 (backoff), row-limit errors (pause and use partial data)
- **API cost tracking:** Ahrefs uses row-based pricing. Track rows consumed per call. Target: <= 5-15 API calls per client per sync.

### Sub-task 3: Implement 7-day caching layer (~1h)
- Before any API call, check if cached data exists and is < 7 days old:
  - Cache key: `{provider}:{endpoint}:{normalized_params_hash}`
  - Cache storage: `keyword_opportunities.analysis_metadata` for keyword data, `performance_snapshots.metadata` for domain/backlink data
  - Check `updated_at` field: if within 7 days, return cached data without API call
- Only query APIs for new or changed keywords:
  - Compare current keyword list (from GSC) against keywords already in `keyword_opportunities` with fresh Semrush/Ahrefs data
  - Skip keywords that have been enriched within the last 7 days
- Log cache hit/miss rates for cost monitoring

### Sub-task 4: Register endpoints and scheduler integration (~1h)
- **`POST /api/connections/semrush`** — Authenticated. Accepts `{ apiKey }` (for clients who want to use their own key). Encrypts with KeyManager. Creates `client_connections` row with `provider: 'semrush'`. This endpoint is optional — system uses ChainIQ's key by default.
- **`POST /api/connections/ahrefs`** — Authenticated. Same pattern for Ahrefs API token.
- **`POST /api/ingestion/trigger/semrush`** and **`POST /api/ingestion/trigger/ahrefs`** — Manual trigger endpoints.
- Update `bridge/ingestion/scheduler.js` to include Semrush (Monday 04:00 UTC) and Ahrefs (Tuesday 04:00 UTC) in the schedule.
- Both connectors check if API keys are configured before running — if no key, skip silently (graceful degradation).

## Acceptance Criteria
- [ ] `bridge/ingestion/semrush.js` fetches domain analytics, keyword gaps, and topic research
- [ ] `bridge/ingestion/ahrefs.js` fetches backlink profiles, domain rating, and keyword explorer data
- [ ] 7-day caching prevents redundant API calls for unchanged keywords
- [ ] API keys are loaded from environment variables, never exposed to clients
- [ ] Optional client-provided API keys are encrypted with AES-256-GCM via KeyManager
- [ ] Data enriches existing `keyword_opportunities` and `performance_snapshots` records
- [ ] System works fully without Semrush/Ahrefs keys (graceful degradation)
- [ ] Scheduler runs Semrush weekly Monday, Ahrefs weekly Tuesday
- [ ] API cost tracking logs units/rows consumed per sync
- [ ] Error handling follows established connector pattern (401, 429, quota exceeded)
- [ ] Zero npm dependencies — uses native `fetch`

## Test Requirements

### Unit Tests
- Semrush domain analytics response parsing extracts correct fields
- Ahrefs backlink profile response parsing extracts correct fields
- Cache hit: data < 7 days old returns cached result without API call
- Cache miss: data > 7 days old triggers fresh API call
- Missing API key: connector skips silently, returns empty result
- API cost tracking correctly sums units/rows per sync

### Integration Tests
- Semrush full sync with mocked API: fetch → enrich keyword_opportunities → verify metadata
- Ahrefs full sync with mocked API: fetch → store backlink data in snapshots → verify
- Scheduler integration: confirm Semrush runs on Monday, Ahrefs on Tuesday
- Graceful degradation: system intelligence endpoints work without Semrush/Ahrefs data

## Dependencies
- Blocked by: DI-001 (client_connections table), DI-005 (scheduler)
- Blocks: CI-003 (topic recommender can use enriched keyword data for better scoring)
- Note: This is ADDITIVE — all other Phase 5/6 tasks work without this. Can be deprioritized.
