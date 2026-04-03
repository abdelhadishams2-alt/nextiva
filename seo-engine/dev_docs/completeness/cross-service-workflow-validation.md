# Cross-Service Workflow Validation

> **Last Updated:** 2026-03-28
> **Services Validated:** 12 (6 existing + 6 new)
> **Purpose:** Trace every workflow spanning 2+ services, verify handoff contracts, flag broken chains
> **Status:** Full validation against service specs and system architecture (v2 -- expanded for platform)

---

## Validation Method

For each workflow:
1. List every service boundary crossing in order
2. Identify the data passed at each boundary (output of Service A -> input of Service B)
3. Verify both source and destination specs define compatible contracts
4. Flag broken chains, missing contracts, or ambiguous handoffs

---

## Existing Workflows (v1 -- re-validated)

### Workflow A: Article Generation -- Mode A (User-Driven, existing)

**Services:** Auth & Bridge -> Article Pipeline -> Universal Engine -> Analytics

```
1. User authenticates via Dashboard login (Auth & Bridge)
2. User submits topic + language + framework (Dashboard API)
3. Dashboard API creates pipeline_job record (Dashboard API -> Supabase)
4. Pipeline starts: project analyzer detects target stack (Article Pipeline -> Universal Engine auto-config)
5. Research engine runs 6 rounds in detected language (Article Pipeline -> Universal Engine multi-lang)
6. Article architect builds component map (Article Pipeline)
7. Image generator produces 4-6 images (Article Pipeline)
8. Draft writer outputs through framework adapter (Article Pipeline -> Universal Engine adapter)
9. Article record created in Supabase (Dashboard API)
10. Analytics event: generation_completed (Analytics)
```

**Validation:** All services connected. No gaps. If framework detection fails (step 4), Universal Engine falls back to HTML adapter.
**Status:** VALID (unchanged from v1)

### Workflow B: Section Edit (existing)

**Services:** Auth & Bridge -> Claude CLI -> Analytics

```
1. User clicks "Edit" on article section in browser (Client)
2. Browser sends POST /apply-edit with Bearer token (Auth & Bridge)
3. Bridge server verifies token via verifyAuth() (Auth & Bridge -> Supabase)
4. Bridge server checks global mutex (Auth & Bridge)
5. Bridge server spawns Claude CLI with edit instructions (Auth & Bridge -> child_process)
6. Claude CLI rewrites section, streams via SSE (child_process -> Auth & Bridge -> Client)
7. Bridge server returns updated content (Auth & Bridge -> Client)
8. Analytics event: edit_completed (Analytics)
```

**Validation:** Complete. Prompt injection guard must intercept at step 5.
**Status:** VALID (unchanged from v1)

### Workflow C: User Onboarding (existing, v1)

**Services:** Auth & Bridge -> Admin & Users -> Analytics -> Dashboard API

```
1. New user signs up (Auth & Bridge -> Supabase Auth)
2. User status set to 'pending' (Admin & Users)
3. Analytics event: signup (Analytics)
4. Admin receives notification (Dashboard API -> Admin panel)
5. Admin approves user with plan selection (Admin & Users)
6. Subscription record created (Admin & Users -> Supabase)
7. User can access article generation (Auth & Bridge -> Dashboard API)
```

**Validation:** Complete. Notification mechanism TBD (email or dashboard badge).
**Status:** VALID (unchanged from v1)

### Workflow D: GDPR User Deletion (existing)

**Services:** Admin & Users -> Auth & Bridge -> Analytics -> Dashboard API

**Validation:** Complete. Must be transactional or have compensating actions (CASCADE or Supabase function).
**Status:** VALID (unchanged from v1)

---

## New Platform Workflows (v2)

### Workflow 1: Mode B Article Generation (End-to-End)

**Services:** Data Ingestion -> Content Intelligence -> Voice Intelligence -> Article Pipeline -> Quality Gate -> Publishing -> Feedback Loop

**This is the critical path through all 6 new layers.**

#### Boundary 1: Data Ingestion -> Content Intelligence

| Aspect | Detail |
|--------|--------|
| Source output | `ContentPerformanceRecord` per URL per client, written to `content_inventory` + `performance_snapshots` + `keyword_opportunities` tables |
| Destination input | Content Intelligence reads from `content_inventory`, `performance_snapshots`, `keyword_opportunities` |
| Contract match | YES. Both specs reference the same Supabase tables. ContentPerformanceRecord schema is defined in system-architecture.md with fields: url, title, publishDate, author, wordCount, gsc{}, ga4{}, semrush{}, ahrefs{}, trend{}, status |
| Auth context | Data Ingestion writes via service_role (scheduler). Content Intelligence reads via user context (RLS enforced) |
| **Status** | VALID |

#### Boundary 2: Content Intelligence -> Article Pipeline (Topic Recommender Agent)

| Aspect | Detail |
|--------|--------|
| Source output | Scored topic recommendations in `keyword_opportunities` table (priority_score, decay_severity, gap_size, seasonality_bonus, competition_inverse) |
| Destination input | Topic Recommender Agent (#1) takes "Category + client site URL" and produces "Ranked article recommendations with scores" |
| Contract match | PARTIAL. Content Intelligence writes scored opportunities to the database. The Topic Recommender Agent reads these and re-ranks for a specific category. Handoff is database-mediated, not API-to-API. |
| Gap | Topic Recommender Agent spec says input is "Category + client site URL" but does not explicitly reference `keyword_opportunities` as its data source. Connection is implied but not formally declared. |
| **Status** | VALID with documentation gap |

#### Boundary 3: Voice Intelligence -> Article Pipeline (Voice Analyzer Agent)

| Aspect | Detail |
|--------|--------|
| Source output | `writer_personas` table with structured JSON profiles per detected writer |
| Destination input | Voice Analyzer Agent (#2) takes "Client site URL", produces "Writer personas (DNA profiles)". Draft Writer Agent (#6) consumes voice persona as style constraint. |
| Contract match | YES. Voice Intelligence writes to `writer_personas`. Pipeline reads from same table. |
| **Status** | VALID |

#### Boundary 4: Article Pipeline -> Quality Gate

| Aspect | Detail |
|--------|--------|
| Source output | Draft Writer Agent (#6) produces generated article (HTML + metadata) |
| Destination input | Quality Gate Agent (#7) takes "Generated article + target persona", returns 7-signal quality score |
| Contract match | YES. In-pipeline handoff. Below 7/10 on any signal triggers re-invocation of Draft Writer (max 2 passes). |
| **Status** | VALID |

#### Boundary 5: Quality Gate -> Publishing

| Aspect | Detail |
|--------|--------|
| Source output | Quality-approved article written to `articles` table |
| Destination input | Publishing reads from `articles`, transforms to Universal Article Payload (canonical JSON: title, body, meta title, meta desc, focus keyphrase, featured image URL, categories, tags, schema markup, author, publish date) |
| Contract match | YES. Payload format defined in system-architecture.md. All CMS adapters consume this format. Draft-first constraint enforced. |
| **Status** | VALID |

#### Boundary 6: Publishing -> Feedback Loop

| Aspect | Detail |
|--------|--------|
| Source output | `articles` table updated with published_url, cms_post_id, publish_date |
| Destination input | Feedback Loop pulls actual GSC+GA4 data for the published URL at 30/60/90 day checkpoints |
| Contract match | YES. Published URL is the join key. |
| **Status** | VALID |

#### Boundary 7: Feedback Loop -> Content Intelligence (Recalibration)

| Aspect | Detail |
|--------|--------|
| Source output | Accuracy scores in `performance_predictions`. Recalibration engine adjusts scoring formula weights per client. |
| Destination input | Content Intelligence scoring formula uses weights (impressions 0.3, decay_severity 0.25, gap_size 0.25, seasonality_bonus 0.1, competition_inverse 0.1) |
| Contract match | BROKEN. No defined storage for per-client calibrated weights. The scoring formula weights are hardcoded defaults. Recalibration writes to `performance_predictions` but has no target column/table for updated weights. |
| **Status** | BROKEN CHAIN |

**Workflow 1 Summary:** 6 of 7 boundaries valid. 1 broken chain (recalibration weight storage). 1 documentation gap.

---

### Workflow 2: Client Onboarding (Platform v2)

**Services:** Auth -> Data Ingestion (OAuth) -> Content Inventory (Crawler) -> Voice Intelligence (auto-analyze) -> Dashboard

#### Boundary 1: Auth -> Data Ingestion (OAuth)

| Aspect | Detail |
|--------|--------|
| Source output | Authenticated user triggers OAuth flow from Connections dashboard page |
| Destination input | Data Ingestion OAuth: auth URL generation, token exchange via native fetch, PKCE via crypto module, encrypted storage in `client_connections` |
| Contract match | YES. Bridge server handles OAuth callback. KeyManager encrypts tokens. Proactive refresh 10 min before expiry. |
| **Status** | VALID |

#### Boundary 2: Data Ingestion -> Voice Intelligence (Crawler -> Corpus)

| Aspect | Detail |
|--------|--------|
| Source output | HTTP crawler writes to `content_inventory`: URL, title, meta description, H1, word count, publish date, last modified |
| Destination input | Voice Intelligence needs article body text (prose) for stylometric analysis, AI/human classification, and writer clustering (50-100 articles minimum) |
| Contract match | BROKEN. Crawler stores metadata but NOT article body text. Voice Intelligence requires the actual prose content for stylometric features (sentence length variance, vocabulary richness, hedging frequency, cliche density, paragraph rhythm). |
| **Status** | BROKEN CHAIN |

#### Boundary 3: Voice Intelligence -> Dashboard

| Aspect | Detail |
|--------|--------|
| Source output | `writer_personas` table with detected profiles |
| Destination input | Dashboard Voice Profiles page reads writer_personas, displays detected writers |
| Contract match | YES |
| **Status** | VALID |

**Workflow 2 Summary:** 2 of 3 boundaries valid. 1 broken chain (article body text not stored by crawler).

---

### Workflow 3: Content Health Monitoring

**Services:** Data Ingestion (scheduler) -> Content Intelligence (decay detection) -> Dashboard (alerts)

#### Boundary 1: Data Ingestion -> Content Intelligence

| Aspect | Detail |
|--------|--------|
| Source output | Scheduler pulls GSC+GA4 daily at 03:00 UTC, writes to `performance_snapshots` |
| Destination input | Decay Detection reads `performance_snapshots` for 3+ months declining impressions or 20%+ single-month drop |
| Contract match | YES. Same tables, same metrics (clicks, impressions, CTR, position from GSC; sessions, engagement, scroll depth from GA4) |
| **Status** | VALID |

#### Boundary 2: Content Intelligence -> Dashboard

| Aspect | Detail |
|--------|--------|
| Source output | Decay detection flags articles as "DECAYING" in content_inventory/keyword_opportunities. Cannibalization detector identifies URL conflicts. |
| Destination input | Dashboard Opportunities page reads keyword_opportunities, displays alerts and scored recommendations |
| Contract match | YES. Dashboard polls on page load (no push notifications in current architecture). |
| **Status** | VALID |

**Workflow 3 Summary:** All 2 boundaries valid. 0 broken chains.

---

### Workflow 4: Performance Feedback

**Services:** Publishing (article published) -> Feedback Loop (30-day checkpoint) -> Content Intelligence (recalibrated weights)

#### Boundary 1: Publishing -> Feedback Loop

| Aspect | Detail |
|--------|--------|
| Source output | `articles` table with published_url, cms_post_id, predicted performance |
| Destination input | Feedback Loop pulls GSC+GA4 data at 30/60/90 days for published URL |
| Contract match | YES. Published URL is join key. |
| **Status** | VALID |

#### Boundary 2: Feedback Loop -> Content Intelligence

| Aspect | Detail |
|--------|--------|
| Source output | Accuracy scores (0-100) in `performance_predictions`. Recalibration engine adjusts scoring weights. |
| Destination input | Scoring formula needs per-client calibrated weights |
| Contract match | BROKEN. Same issue as Workflow 1 Boundary 7. No storage for recalibrated per-client weights. |
| **Status** | BROKEN CHAIN (same root cause as Workflow 1) |

**Workflow 4 Summary:** 1 of 2 valid. 1 broken chain (weight storage).

---

### Workflow 5: Section Edit (Extended with Quality Gate)

**Services:** Dashboard -> Auth -> Bridge Server -> Claude CLI -> Quality Gate (re-score)

#### Boundary 1-2: Dashboard -> Auth -> Bridge -> Claude CLI

Same as existing Workflow B above. VALID.

#### Boundary 3: Claude CLI -> Quality Gate (re-score)

| Aspect | Detail |
|--------|--------|
| Source output | Edited section replaces original in article |
| Destination input | Quality Gate should re-score article to verify quality maintained |
| Contract match | UNDEFINED. Current section edit flow does not trigger quality gate re-score. Edit completes and article is updated, but 7-signal score is not recalculated. |
| **Status** | BROKEN CHAIN (no post-edit re-score mechanism) |

**Workflow 5 Summary:** 2 of 3 valid. 1 broken chain (post-edit quality re-scoring not wired).

---

## Broken Chain Summary

| # | Workflow | Boundary | Issue | Severity | Fix |
|---|----------|----------|-------|----------|-----|
| 1 | Mode B Generation (WF1) | Feedback -> Intelligence | Per-client recalibration weights have no defined storage | Medium | Add `scoring_weights JSONB` column to `client_connections` or create `client_scoring_config` table |
| 2 | Client Onboarding (WF2) | Crawler -> Voice Intelligence | `content_inventory` stores metadata but not article body text needed for stylometric analysis | **High** | Add `body_text TEXT` column to `content_inventory`. Crawler already fetches HTML -- extract and store prose. |
| 3 | Performance Feedback (WF4) | Feedback -> Intelligence | Same root cause as #1 | Medium | Same fix as #1 |
| 4 | Section Edit (WF5) | Claude CLI -> Quality Gate | Post-edit quality re-scoring not triggered | Low | Add manual "Re-score" button to dashboard. Auto-trigger may be too expensive for minor edits. |

### Priority Order

1. **Fix #2 first (High).** Without article body text, the entire Voice Intelligence pipeline cannot function during onboarding. The crawler already fetches HTML -- it should extract and store prose. This is a schema change + crawler modification.

2. **Fix #1/#3 together (Medium).** Add `scoring_weights JSONB` to `client_connections` with default values matching the hardcoded formula. Recalibration engine updates this column; scoring formula reads per-client.

3. **Fix #4 later (Low).** Post-edit re-scoring is quality-of-life, not a pipeline blocker. Ship a "Re-score" button in Phase B when Quality Gate is built.

---

## Contract Compatibility Matrix

| Source Service | Destination Service | Shared Contract | Status |
|---------------|--------------------|-----------------------|--------|
| Data Ingestion | Content Intelligence | content_inventory, performance_snapshots, keyword_opportunities | VALID |
| Data Ingestion | Voice Intelligence | content_inventory (metadata only -- missing body text) | **PARTIAL** |
| Content Intelligence | Article Pipeline | keyword_opportunities -> Topic Recommender Agent | VALID (implicit) |
| Voice Intelligence | Article Pipeline | writer_personas -> Voice Analyzer Agent -> Draft Writer | VALID |
| Article Pipeline | Quality Gate | In-pipeline article object handoff | VALID |
| Quality Gate | Publishing | articles table | VALID |
| Publishing | Feedback Loop | articles (published_url, cms_post_id) | VALID |
| Feedback Loop | Content Intelligence | performance_predictions + weights (UNDEFINED) | **PARTIAL** |
| Dashboard | Bridge Server | HTTP API + Bearer token | VALID |
| Bridge Server | Claude CLI | child_process spawn + stdout/SSE | VALID |
| Auth & Bridge | Supabase Auth | JWT validation + SHA-256 cache | VALID |
| CMS Plugins | Bridge Server | API key header authentication | VALID |

---

## Summary

| Workflow | Boundaries | Valid | Broken | Status |
|----------|-----------|-------|--------|--------|
| A: Mode A Generation (v1) | 4 | 4 | 0 | CLEAN |
| B: Section Edit (v1) | 3 | 3 | 0 | CLEAN |
| C: User Onboarding (v1) | 3 | 3 | 0 | CLEAN |
| D: GDPR Deletion (v1) | 4 | 4 | 0 | CLEAN |
| 1: Mode B Generation | 7 | 6 | 1 | 1 BROKEN |
| 2: Client Onboarding (v2) | 3 | 2 | 1 | 1 BROKEN |
| 3: Content Health Monitoring | 2 | 2 | 0 | CLEAN |
| 4: Performance Feedback | 2 | 1 | 1 | 1 BROKEN |
| 5: Section Edit (extended) | 3 | 2 | 1 | 1 BROKEN |
| **Totals** | **31** | **27** | **4** | **3 unique root causes** |

**4 broken chains from 3 unique root causes. All fixable with schema additions and one wiring change. No architectural redesign required.**
