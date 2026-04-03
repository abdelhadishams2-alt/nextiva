# Content Intelligence Service

> **Service #8** | **Layer 2** | **Priority: P0** | **Status: Planning**
> **Last Updated:** 2026-03-28
> **Spec Depth:** DEEP (target >= 9/10)

---

## 1. Overview

The Content Intelligence Service is Layer 2 of ChainIQ's 6-layer intelligence architecture. It is the recommendation brain -- the service that transforms raw performance data (produced by Data Ingestion, Layer 1) into scored, actionable recommendations telling clients exactly what to write, what to refresh, what to merge, and why. Without this service, ChainIQ is a capable article generator. With it, ChainIQ becomes a data-driven content strategist that competes with MarketMuse, Clearscope, and Conductor on intelligence depth while exceeding all of them on Arabic/RTL support and AI-native integration.

The service performs six core analyses: (1) detecting content decay across four independent methods, (2) identifying keyword gaps between a client's coverage and their competitors, (3) guarding against internal keyword cannibalization with four resolution strategies, (4) modeling seasonal demand curves to time content publication, (5) scoring SERP saturation to identify thin/outdated competition, and (6) orchestrating all analyses into a scored recommendation list via the Topic Recommender Agent.

**Primary users and their interactions:** Nadia (client admin, BMW publisher) opens the Opportunities page daily and sees a prioritized list of scored recommendations. She reviews the top recommendation -- "N54 HPFP Failure Symptoms and Solutions" with a score of 94 -- clicks into the detail view to see the signal breakdown (high gap score, low SERP saturation, seasonal peak approaching in 6 weeks), clicks "Generate Article," and the recommendation flows into the Article Pipeline with full intelligence context injected. Marcus (agency admin managing 15 clients) uses Content Intelligence per-client: he switches between client dashboards, reviews each client's top 5 recommendations, and builds monthly content calendars from the scored lists. Lina (content editor at SRMG) replaces her manual keyword research spreadsheets entirely -- she enters a category like "Saudi automotive maintenance" in Mode B, waits 30-45 seconds for the 6-analysis pipeline to complete, reviews the 20 scored recommendations with Arabic keyword data, and selects 5 for this week's content queue.

**Day-in-the-life simulation:** Lina opens her ChainIQ dashboard at 8AM Riyadh time. The Opportunities page shows 23 open recommendations from last night's scheduled analysis run (triggered automatically after Data Ingestion's 3AM sync). She sorts by priority score descending. The top item is a decay alert: an existing article about "BMW N54 common problems" has lost 42% of its clicks over 3 months -- the Decay Detector flagged it with severity `high` because it crossed from page 1 to page 2 AND the content is 16 months old (triggering the 12-month how-to refresh threshold). The recommended action is `update_existing`. Lina clicks "Generate Refresh" and the Article Pipeline receives the existing URL, the decay evidence, and the competitor analysis showing 3 fresher guides now outranking hers. She then checks the cannibalization tab and finds 2 articles competing for "BMW oil change interval" -- the guard recommends merging them since both have similar traffic. She notes this for next week. Finally, she runs a new Mode B analysis for "BMW electric vehicles" (an emerging topic), waits 35 seconds, and gets 15 new-article recommendations scored between 45 and 88. She selects the top 3 for generation.

**Failure modes this service must handle:** (1) Counterintuitive scores -- a high-traffic keyword getting a low priority score because saturation is extreme; the UI must show the signal breakdown so users understand WHY. (2) Seasonal false positives -- flagging a ski equipment article as "decaying" in July when it peaks November-February; the seasonality model must cross-reference Trends data before decay classification. (3) Broad-topic cannibalization false positives -- two articles about "BMW maintenance" sharing queries like "BMW" and "maintenance" but targeting completely different subtopics; the minimum shared-query threshold (3+ queries with 50+ impressions each) prevents this. (4) Irrelevant gap suggestions -- recommending keywords outside the client's topical domain because a competitor happens to rank for them; the category filter constrains gap analysis to the user-specified topic area. (5) Agent timeout on large inventories -- a site with 10,000+ URLs taking too long for the 6-analysis pipeline; incremental analysis and result caching prevent full re-computation on every run.

**Ambitious future capabilities:** Auto-learning from recommendation acceptance (Layer 6 tracks which recommendations users accept vs dismiss, and the scoring weights adjust per-client over time). Cross-client pattern detection (if 5 clients in the automotive vertical all see the same keyword gap, surface it as a "trending opportunity" with higher confidence). Competitive velocity alerts (notify when a competitor's publishing rate in your topic area increases significantly). Content calendar generation (transform the scored recommendation list into a time-phased calendar that accounts for seasonality peaks, production capacity, and competitive urgency). Confidence bands on scores (instead of a point estimate of 87, show 82-92 with the band width reflecting data completeness).

### Two Genesis Modes

- **Mode A (Current -- User-Driven):** User provides a specific keyword. The 4-agent pipeline (project-analyzer -> research-engine -> article-architect -> draft-writer) executes immediately. No intelligence analysis. The keyword is accepted as-is. Content Intelligence is bypassed entirely.
- **Mode B (New -- Agent-Recommended):** User provides a broad category (e.g., "BMW engine maintenance"). The Topic Recommender Agent runs all six analyses, scores every opportunity, and returns the top N recommendations (default 20). The user picks one or more, and each selected recommendation feeds into the generation pipeline with full context: gap data, competitor analysis, decay signals, seasonal timing, SERP saturation assessment. This context shapes the research-engine's focus and the article-architect's structure decisions.

### Six-Layer Architectural Fit

| Layer | Service | Relationship to Content Intelligence |
|-------|---------|--------------------------------------|
| 1 | Data Ingestion | **Upstream producer.** Provides `content_inventory`, `performance_snapshots`, Semrush/Ahrefs gap data, Google Trends curves. Intelligence reads from these tables; never writes to them (except `keyword_opportunities` which is shared). |
| 2 | **Content Intelligence** | **This service.** Consumes Layer 1 data, produces scored recommendations. |
| 3 | Voice Intelligence | **Downstream consumer.** Receives recommended topics to match against appropriate writer personas and stylistic fingerprints. |
| 4 | Generation Pipeline | **Downstream consumer.** When a recommendation is accepted and executed, the pipeline receives the full analysis context (gap evidence, competitor weaknesses, decay data) which shapes the generated article. |
| 5 | Publishing | **Indirect dependency.** Published articles flow back to Layer 1 for performance tracking, which feeds back into Intelligence for future scoring. |
| 6 | Feedback Loop | **Bidirectional.** Intelligence scores are predictions. The Feedback Loop compares predicted value vs actual performance at 30/60/90 days. Accuracy data feeds back to recalibrate scoring weights per-client. |

---

## 2. Entities & Data Model

### 2.1 keyword_opportunities

The primary output table of the Content Intelligence Service. One row per keyword opportunity per type per client. Defined in migration `010-keyword-opportunities.sql` (shared with Data Ingestion which writes gap data directly during Semrush sync).

| Field | Type | Constraints | Nullable | Default | Description |
|-------|------|-------------|----------|---------|-------------|
| id | UUID | PRIMARY KEY | NOT NULL | `gen_random_uuid()` | Unique opportunity identifier |
| user_id | UUID | FK `auth.users(id)` ON DELETE CASCADE | NOT NULL | -- | Owning user |
| keyword | TEXT | -- | NOT NULL | -- | Target keyword or phrase. Stored lowercase, trimmed. Arabic keywords stored in original script |
| opportunity_type | TEXT | CHECK IN (`gap`, `decay`, `cannibalization`, `trending`, `seasonal`) | NOT NULL | -- | How this opportunity was discovered |
| priority_score | NUMERIC(5,2) | CHECK >= 0 AND CHECK <= 100 | NOT NULL | 0 | Computed 0-100 score from the 5-component scoring formula |
| impressions | INTEGER | CHECK >= 0 | YES | NULL | Current monthly impressions from GSC. NULL if keyword has no existing coverage |
| clicks | INTEGER | CHECK >= 0 | YES | NULL | Current monthly clicks from GSC. NULL if no existing coverage |
| estimated_volume | INTEGER | CHECK >= 0 | YES | NULL | Estimated monthly search volume from Semrush/Ahrefs. NULL if not available |
| current_position | NUMERIC(6,2) | CHECK > 0 | YES | NULL | Current average SERP position from GSC. NULL if not ranking |
| keyword_difficulty | NUMERIC(5,2) | CHECK >= 0 AND CHECK <= 100 | YES | NULL | Keyword difficulty from Semrush (0-100). NULL if data unavailable |
| competing_urls | TEXT[] | -- | NOT NULL | `'{}'` | Client URLs currently ranking for this keyword (from GSC). Empty array for pure gap keywords |
| recommended_action | TEXT | CHECK IN (`create_new`, `update_existing`, `merge`, `redirect`, `differentiate`, `deoptimize`) | NOT NULL | `'create_new'` | The intelligence engine's recommended next step |
| target_url | TEXT | -- | YES | NULL | Existing URL to refresh/merge/redirect. NULL for new article recommendations |
| intent_type | TEXT | CHECK IN (`informational`, `navigational`, `commercial`, `transactional`, `mixed`) | NOT NULL | `'informational'` | Search intent classification for this keyword |
| content_type_suggestion | TEXT | CHECK IN (`how-to`, `listicle`, `comparison`, `review`, `guide`, `news`, `reference`, `tutorial`) | YES | NULL | Suggested article format based on intent and SERP analysis |
| status | TEXT | CHECK IN (`open`, `accepted`, `dismissed`, `in_pipeline`, `completed`) | NOT NULL | `'open'` | User interaction state |
| confidence | TEXT | CHECK IN (`high`, `medium`, `low`) | NOT NULL | `'medium'` | Data confidence level. `high` = all 5 data sources available. `medium` = 3-4 sources. `low` = 1-2 sources |
| analysis_run_id | UUID | FK `analysis_runs(id)` ON DELETE SET NULL | YES | NULL | Which analysis run produced this opportunity |
| analysis_metadata | JSONB | -- | NOT NULL | `'{}'::jsonb` | Full evidence payload (decay signals, gap data, seasonality curves, saturation scores, cannibalization conflicts, scoring component breakdown) |
| accepted_at | TIMESTAMPTZ | -- | YES | NULL | When the user accepted this recommendation |
| dismissed_at | TIMESTAMPTZ | -- | YES | NULL | When the user dismissed this recommendation |
| pipeline_job_id | UUID | -- | YES | NULL | Reference to the pipeline job if recommendation was sent to generation |
| created_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | Row creation time |
| updated_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | Last modification time. Auto-updated by trigger |

**Unique constraint:** `UNIQUE (user_id, keyword, opportunity_type)` -- one opportunity per keyword per type per client. Upserted on each analysis run.

**Indexes:**
- `idx_opportunities_user_score` on `(user_id, priority_score DESC)` -- primary dashboard query (ranked recommendation list)
- `idx_opportunities_user_type_status` on `(user_id, opportunity_type, status)` -- filtered dashboard views (e.g., "show me all open decay opportunities")
- `idx_opportunities_user_status` on `(user_id, status)` WHERE `status = 'open'` -- partial index for open opportunity counts on dashboard badge
- `idx_opportunities_run` on `(analysis_run_id)` -- find all opportunities from a specific run
- `idx_opportunities_keyword_trgm` using GIN on `keyword gin_trgm_ops` -- trigram index for keyword search/autocomplete

**RLS Policies:**
- `Users read own opportunities`: SELECT WHERE `auth.uid() = user_id`
- `Users update own opportunities`: UPDATE USING/WITH CHECK `auth.uid() = user_id` (for status changes: accept, dismiss)
- Service_role writes bypass RLS (analysis runner writes results)

**Trigger:** `BEFORE UPDATE` fires `update_updated_at()` to set `updated_at = now()`.

### analysis_metadata JSONB Structure

The `analysis_metadata` column stores the complete evidence trail for every recommendation. This payload is what makes recommendations explainable -- every score component links back to specific data points:

```json
{
  "decay": {
    "detected": true,
    "method": "click_decline",
    "click_change_3mo_pct": -34,
    "impression_change_3mo_pct": -28,
    "position_previous": 6.1,
    "position_current": 10.3,
    "position_delta": 4.2,
    "page_boundary_crossed": true,
    "content_age_months": 14,
    "content_type": "how-to",
    "age_trigger_months": 12,
    "age_triggered": true,
    "severity": "high",
    "trend_data": [
      { "month": "2026-01", "clicks": 1340, "impressions": 18200 },
      { "month": "2026-02", "clicks": 1020, "impressions": 14800 },
      { "month": "2026-03", "clicks": 890, "impressions": 12400 }
    ]
  },
  "gap": {
    "is_gap": true,
    "competitor_urls": [
      { "url": "https://competitor-a.com/n54-hpfp-guide", "position": 3, "word_count": 920 },
      { "url": "https://competitor-b.com/bmw-hpfp-problems", "position": 5, "word_count": 740 }
    ],
    "competitor_count": 2,
    "competitor_avg_position": 4.0,
    "competitor_avg_word_count": 830,
    "estimated_volume": 4400,
    "keyword_difficulty": 28,
    "serp_features": ["featured_snippet", "paa"],
    "gap_score": 82.5
  },
  "seasonality": {
    "data_available": true,
    "peak_months": [10, 11, 12],
    "current_month": 3,
    "current_trend": "rising",
    "weeks_to_peak": 28,
    "seasonal_type": "early",
    "seasonal_bonus_raw": 5,
    "seasonal_bonus_normalized": 33.3,
    "trend_curve": [45, 38, 42, 55, 62, 68, 72, 78, 88, 95, 100, 85]
  },
  "saturation": {
    "data_available": true,
    "top_10_avg_word_count": 830,
    "top_10_avg_age_months": 22,
    "thin_results_count": 4,
    "outdated_results_count": 6,
    "forum_count": 3,
    "avg_domain_authority": 38,
    "featured_snippet_held": false,
    "paa_count": 4,
    "saturation_score": 28,
    "opportunity_level": "high"
  },
  "cannibalization": {
    "detected": false,
    "conflicting_urls": [],
    "resolution": null
  },
  "scoring": {
    "impressions_raw": 28300,
    "impressions_normalized": 94.3,
    "impressions_component": 28.3,
    "decay_severity_raw": "none",
    "decay_normalized": 0,
    "decay_component": 0,
    "gap_score_raw": 82.5,
    "gap_normalized": 82.5,
    "gap_component": 20.6,
    "seasonality_bonus_raw": 5,
    "seasonality_normalized": 33.3,
    "seasonality_component": 3.3,
    "saturation_score_raw": 28,
    "competition_inverse": 72,
    "competition_component": 7.2,
    "total_before_reweight": 59.4,
    "components_available": 4,
    "reweight_applied": true,
    "total_final": 94.2
  },
  "data_sources_used": ["gsc", "semrush", "trends"],
  "data_sources_missing": ["ahrefs"],
  "analysis_timestamp": "2026-03-28T04:15:00Z"
}
```

### 2.2 analysis_runs

Tracks each full intelligence analysis execution. One row per Mode B invocation or scheduled analysis run.

| Field | Type | Constraints | Nullable | Default | Description |
|-------|------|-------------|----------|---------|-------------|
| id | UUID | PRIMARY KEY | NOT NULL | `gen_random_uuid()` | Run identifier |
| user_id | UUID | FK `auth.users(id)` ON DELETE CASCADE | NOT NULL | -- | Owning user |
| trigger_type | TEXT | CHECK IN (`manual`, `scheduled`, `mode_b`) | NOT NULL | -- | What initiated the run |
| category | TEXT | -- | YES | NULL | Input category for Mode B runs. NULL for full-site scheduled runs |
| competitors | TEXT[] | -- | NOT NULL | `'{}'` | Competitor domains used for gap analysis. Auto-detected or user-specified |
| status | TEXT | CHECK IN (`running`, `completed`, `failed`, `partial`, `cancelled`) | NOT NULL | `'running'` | Current run state |
| analyses_requested | TEXT[] | -- | NOT NULL | `'{inventory,decay,gap,seasonality,saturation,cannibalization}'` | Which analyses were requested |
| analyses_completed | TEXT[] | -- | NOT NULL | `'{}'` | Which analyses finished successfully |
| analyses_failed | TEXT[] | -- | NOT NULL | `'{}'` | Which analyses failed (with reasons in metadata) |
| opportunities_created | INTEGER | CHECK >= 0 | NOT NULL | 0 | New keyword_opportunities rows inserted |
| opportunities_updated | INTEGER | CHECK >= 0 | NOT NULL | 0 | Existing keyword_opportunities rows updated |
| max_recommendations | INTEGER | CHECK > 0 | NOT NULL | 20 | Maximum recommendations requested |
| started_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | Run start time |
| completed_at | TIMESTAMPTZ | -- | YES | NULL | Run end time |
| duration_ms | INTEGER | CHECK >= 0 | YES | NULL | Total wall-clock duration in milliseconds |
| error | TEXT | -- | YES | NULL | Error message if failed |
| metadata | JSONB | -- | NOT NULL | `'{}'::jsonb` | Per-analysis timing, data sources used, cache hit rates, URLs analyzed count |
| created_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | Row creation time |

**Indexes:**
- `idx_runs_user_date` on `(user_id, started_at DESC)` -- list past runs
- `idx_runs_status` on `(status)` WHERE `status = 'running'` -- find active runs

**RLS:** Users read own runs. Service_role writes.

### 2.3 recommendation_history

Tracks user interactions with recommendations over time. Used by Layer 6 (Feedback Loop) to measure recommendation quality and recalibrate scoring weights.

| Field | Type | Constraints | Nullable | Default | Description |
|-------|------|-------------|----------|---------|-------------|
| id | UUID | PRIMARY KEY | NOT NULL | `gen_random_uuid()` | History entry ID |
| user_id | UUID | FK `auth.users(id)` ON DELETE CASCADE | NOT NULL | -- | Owning user |
| opportunity_id | UUID | FK `keyword_opportunities(id)` ON DELETE CASCADE | NOT NULL | -- | The recommendation that was acted on |
| action | TEXT | CHECK IN (`accepted`, `dismissed`, `executed`, `completed`, `performance_check`) | NOT NULL | -- | What happened |
| priority_score_at_action | NUMERIC(5,2) | -- | NOT NULL | -- | The score at the time of action (scores change on re-analysis) |
| performance_30d | JSONB | -- | YES | NULL | Performance data 30 days after article publication (populated by Layer 6) |
| performance_60d | JSONB | -- | YES | NULL | 60-day performance data |
| performance_90d | JSONB | -- | YES | NULL | 90-day performance data |
| created_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | When this history entry was created |

**Index:** `idx_history_user_opportunity` on `(user_id, opportunity_id, action)`.

**RLS:** Users read own history. Service_role writes.

### 2.4 cannibalization_conflicts

Dedicated table for cannibalization conflicts. While basic conflict data lives in `analysis_metadata`, this table enables the cannibalization dashboard view and tracks resolution progress.

| Field | Type | Constraints | Nullable | Default | Description |
|-------|------|-------------|----------|---------|-------------|
| id | UUID | PRIMARY KEY | NOT NULL | `gen_random_uuid()` | Conflict ID |
| user_id | UUID | FK `auth.users(id)` ON DELETE CASCADE | NOT NULL | -- | Owning user |
| keyword | TEXT | -- | NOT NULL | -- | The contested keyword |
| total_impressions | INTEGER | CHECK >= 0 | NOT NULL | -- | Combined impressions across all competing URLs |
| url_count | INTEGER | CHECK >= 2 | NOT NULL | -- | Number of competing URLs |
| winner_url | TEXT | -- | NOT NULL | -- | URL with highest clicks for this keyword |
| winner_clicks | INTEGER | CHECK >= 0 | NOT NULL | -- | Winner's click count |
| winner_position | NUMERIC(6,2) | -- | NOT NULL | -- | Winner's average position |
| loser_urls | JSONB | -- | NOT NULL | -- | Array of `{url, clicks, position}` for all non-winner URLs |
| intent_type | TEXT | CHECK IN (`informational`, `navigational`, `commercial`, `transactional`, `mixed`) | NOT NULL | -- | Classified search intent |
| recommended_resolution | TEXT | CHECK IN (`merge`, `redirect`, `differentiate`, `deoptimize`) | NOT NULL | -- | Suggested resolution strategy |
| resolution_confidence | TEXT | CHECK IN (`high`, `medium`, `low`) | NOT NULL | -- | Confidence in the recommendation |
| resolution_status | TEXT | CHECK IN (`open`, `in_progress`, `resolved`, `dismissed`) | NOT NULL | `'open'` | Resolution tracking |
| resolved_at | TIMESTAMPTZ | -- | YES | NULL | When the conflict was resolved |
| analysis_run_id | UUID | FK `analysis_runs(id)` ON DELETE SET NULL | YES | NULL | Which run detected this conflict |
| created_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | Detection time |
| updated_at | TIMESTAMPTZ | -- | NOT NULL | `now()` | Last update time |

**Unique constraint:** `UNIQUE (user_id, keyword)` -- one conflict record per keyword per client.

**Indexes:**
- `idx_cannibalization_user_status` on `(user_id, resolution_status)` WHERE `resolution_status != 'resolved'`
- `idx_cannibalization_impressions` on `(user_id, total_impressions DESC)` -- sort by impact

**RLS:** Users read/update own conflicts.

---

## 3. API Endpoints

### 3.1 Recommendations

**`GET /api/intelligence/recommendations`**
- **Auth:** User (Bearer token)
- **Query params:**
  - `type` -- filter by opportunity_type: `gap`, `decay`, `cannibalization`, `trending`, `seasonal` (comma-separated for multiple)
  - `status` -- filter: `open`, `accepted`, `dismissed`, `in_pipeline`, `completed`
  - `action` -- filter by recommended_action: `create_new`, `update_existing`, `merge`, `redirect`, `differentiate`, `deoptimize`
  - `min_score` -- minimum priority_score (default: 0)
  - `confidence` -- filter by confidence level: `high`, `medium`, `low`
  - `search` -- keyword text search (uses trigram index)
  - `sort` -- `score_desc` (default), `score_asc`, `created_desc`, `impressions_desc`, `volume_desc`
  - `page` / `per_page` -- pagination (default: 1 / 25, max per_page: 100)
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "a1b2c3d4-...",
        "keyword": "N54 HPFP Failure Symptoms and Solutions",
        "opportunity_type": "gap",
        "priority_score": 94.2,
        "impressions": 28300,
        "estimated_volume": 4400,
        "current_position": null,
        "keyword_difficulty": 28,
        "recommended_action": "create_new",
        "target_url": null,
        "intent_type": "informational",
        "content_type_suggestion": "guide",
        "status": "open",
        "confidence": "high",
        "summary": "High-volume keyword (4,400/mo) with no existing coverage. Top SERP results are thin (avg 830 words, 4 forum results). Seasonal peak in 28 weeks -- write early for indexing lead time.",
        "scoring_breakdown": {
          "impressions": 28.3,
          "decay": 0,
          "gap": 20.6,
          "seasonality": 3.3,
          "competition": 7.2
        },
        "created_at": "2026-03-28T04:15:00Z"
      }
    ],
    "total": 23,
    "page": 1,
    "per_page": 25
  }
}
```
- **Error codes:** 401, 400 (invalid filter values)

**`GET /api/intelligence/recommendations/:id`**
- **Auth:** User (Bearer token)
- **Response (200):** Full opportunity row including complete `analysis_metadata` JSONB
- **Error codes:** 401, 404

**`PATCH /api/intelligence/recommendations/:id`**
- **Auth:** User (Bearer token)
- **Request body:** `{ "status": "accepted" }` or `{ "status": "dismissed" }`
- **Response (200):** Updated opportunity
- **Side effects:** Writes to `recommendation_history` table. Sets `accepted_at` or `dismissed_at` timestamp.
- **Error codes:** 401, 404, 400 (invalid status transition -- cannot accept an already-dismissed recommendation without first re-opening it)

**`POST /api/intelligence/recommendations/:id/execute`**
- **Auth:** User (Bearer token)
- **Request body:** `{ "mode": "generate" }` (optional -- future modes may include `calendar_add`)
- **Response (202 Accepted):** `{ "success": true, "data": { "pipeline_job_id": "uuid", "status": "queued" } }`
- **Side effects:** Creates a pipeline job with the recommendation's full analysis context. Sets opportunity status to `in_pipeline`. Writes to `recommendation_history`.
- **Error codes:** 401, 404, 409 (already in pipeline or completed)

### 3.2 Decay Analysis

**`GET /api/intelligence/decay`**
- **Auth:** User (Bearer token)
- **Query params:** `severity` (critical/high/medium/low), `method` (click_decline/position_drop/content_age/cannibalization_signal), `action` (update_existing/merge/redirect), `page`/`per_page`
- **Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_decaying": 7,
      "by_severity": { "critical": 1, "high": 3, "medium": 2, "low": 1 },
      "by_method": { "click_decline": 5, "position_drop": 4, "content_age": 3, "cannibalization_signal": 1 },
      "estimated_traffic_at_risk": 4200
    },
    "items": [
      {
        "content_id": "uuid-...",
        "url": "/blog/best-bmw-tuning-platforms",
        "title": "Best BMW Tuning Platforms 2025",
        "severity": "high",
        "detection_methods": ["click_decline", "position_drop", "content_age"],
        "click_change_3mo_pct": -34,
        "impression_change_3mo_pct": -28,
        "position_change": { "from": 6.1, "to": 10.3, "page_boundary_crossed": true },
        "content_age_months": 14,
        "content_type": "best-of",
        "age_trigger": { "threshold_months": 6, "triggered": true },
        "recommended_action": "update_existing",
        "trend_data": [
          { "month": "2026-01", "clicks": 1340, "impressions": 18200 },
          { "month": "2026-02", "clicks": 1020, "impressions": 14800 },
          { "month": "2026-03", "clicks": 890, "impressions": 12400 }
        ]
      }
    ],
    "total": 7,
    "page": 1,
    "per_page": 25
  }
}
```
- **Error codes:** 401, 400

**`GET /api/intelligence/decay/:contentId`**
- **Auth:** User (Bearer token)
- **Response (200):** Full decay detail for a single content item including all detection method results, 6-month trend data, and recommended refresh action
- **Error codes:** 401, 404

### 3.3 Gap Analysis

**`GET /api/intelligence/gaps`**
- **Auth:** User (Bearer token)
- **Query params:** `min_volume` (default 100), `max_difficulty` (default 100), `sort` (gap_score_desc, volume_desc, difficulty_asc), `page`/`per_page`
- **Response (200):** Paginated list of gap keywords with volume, difficulty, competitor data, gap score
- **Error codes:** 401, 400

**`GET /api/intelligence/gaps/competitors`**
- **Auth:** User (Bearer token)
- **Response (200):** `{ "competitors": [{ "domain": "competitor-a.com", "keyword_overlap": 342, "unique_keywords": 156, "avg_position": 12.4 }] }`
- **Error codes:** 401

### 3.4 Cannibalization

**`GET /api/intelligence/cannibalization`**
- **Auth:** User (Bearer token)
- **Query params:** `resolution_status` (open/in_progress/resolved/dismissed), `sort` (impressions_desc, url_count_desc), `page`/`per_page`
- **Response (200):** Paginated list of `cannibalization_conflicts` rows
- **Error codes:** 401

**`GET /api/intelligence/cannibalization/:keyword`**
- **Auth:** User (Bearer token)
- **Response (200):** Full conflict detail including all competing URLs, traffic data, intent analysis, and resolution recommendation with confidence
- **Error codes:** 401, 404

**`POST /api/intelligence/cannibalization/:id/resolve`**
- **Auth:** User (Bearer token)
- **Request body:** `{ "strategy": "merge", "notes": "Combining into the higher-traffic URL" }`
- **Response (200):** Updated conflict with `resolution_status: "in_progress"` or `"resolved"`
- **Side effects:** Writes to conflict record. Does NOT modify the client's website. Actual content changes (redirects, merges) must be performed by the user or via the Article Pipeline for rewrites.
- **Error codes:** 401, 404, 400 (invalid strategy)

### 3.5 Analysis Runs

**`POST /api/intelligence/run`**
- **Auth:** User (Bearer token)
- **Request body:**
```json
{
  "category": "BMW engine maintenance",
  "competitors": ["competitor-a.com", "competitor-b.com"],
  "max_recommendations": 20,
  "include_refresh": true,
  "include_new": true,
  "analyses": ["inventory", "decay", "gap", "seasonality", "saturation", "cannibalization"]
}
```
- **Response (202 Accepted):** `{ "success": true, "data": { "run_id": "uuid", "status": "running" } }`
- **Side effects:** Creates `analysis_runs` row. Starts async analysis via bridge job queue. All 6 analyses execute in sequence.
- **Error codes:** 401, 400 (missing category for Mode B), 429 (max 5 runs per user per day), 409 (analysis already running for this user)
- **Notes:** The `competitors` field is optional. If omitted, the gap analyzer auto-detects competitors from Semrush domain analytics (top 5 domains by keyword overlap). The `analyses` field is optional -- defaults to all 6. Users can exclude analyses they do not need (e.g., skip seasonality if Trends is not connected).

**`GET /api/intelligence/run/:runId`**
- **Auth:** User (Bearer token)
- **Response (200):** Analysis run details including status, per-analysis timing, completion state
- **Error codes:** 401, 404

**`GET /api/intelligence/runs`**
- **Auth:** User (Bearer token)
- **Query params:** `status`, `page`/`per_page`
- **Response (200):** Paginated list of past runs with summary (category, status, opportunities found, duration)
- **Error codes:** 401

### 3.6 Content Calendar

**`GET /api/intelligence/calendar`**
- **Auth:** User (Bearer token)
- **Query params:** `months` (default 3, max 12), `capacity` (articles per week, default 2)
- **Response (200):** Time-phased content calendar generated from open recommendations, sorted by optimal publication timing (seasonality peaks minus indexing lead time, decay urgency, competitive windows)
```json
{
  "success": true,
  "data": {
    "calendar": [
      {
        "week": "2026-W14",
        "items": [
          {
            "opportunity_id": "uuid",
            "keyword": "N54 HPFP Failure Symptoms",
            "reason": "Gap opportunity, seasonal peak in 6 weeks, low competition",
            "priority_score": 94.2,
            "urgency": "high"
          }
        ]
      }
    ],
    "unscheduled": [],
    "capacity_weeks": 13,
    "total_opportunities": 23
  }
}
```
- **Error codes:** 401, 400

---

## 4. Business Rules

**BR-01: Minimum Data Threshold for Analysis.** A full 6-analysis run requires at least 30 days of GSC performance data in `performance_snapshots` for the requesting user. If fewer than 30 days exist, the decay analysis is skipped (returns empty), gap analysis runs with reduced confidence, and the overall run is flagged `{ low_data: true }`. The UI displays: "Connect GSC and wait 30 days for full intelligence. Current analysis is based on limited data."

**BR-02: Decay Detection Seasonal Override.** Before classifying a content item as decaying, the Decay Detector cross-references the Google Trends seasonal curve for that item's primary keyword (if Trends data is available). If the keyword's current month falls in the bottom 25% of its annual demand curve AND the decline aligns with the expected seasonal trough, the item is reclassified from `decaying` to `seasonal_trough` and excluded from decay recommendations. Example: a "winter tires" article losing 40% traffic in July is NOT flagged as decaying if Trends data shows July is the annual low point. If Trends data is unavailable, the seasonal override does not apply and the decay stands.

**BR-03: Cannibalization Minimum Threshold.** Two URLs are only flagged as cannibalizing if they share 3 or more GSC queries where EACH URL receives at least 50 impressions for that query in the last 90 days. This prevents false positives from incidental keyword overlap (e.g., two articles that both contain the word "BMW" but target entirely different topics). The threshold is configurable per-client via connection metadata.

**BR-04: Priority Score Re-weighting for Missing Components.** When a scoring component is unavailable (e.g., no Semrush data means gap_size = unknown, not 0), the missing component's weight is redistributed proportionally to the available components. Example: if gap analysis is unavailable (weight 0.25), the remaining components are re-weighted: impressions 0.30/0.75 = 0.40, decay 0.25/0.75 = 0.33, seasonality 0.10/0.75 = 0.13, competition 0.10/0.75 = 0.13. Missing components are NEVER set to 0 (which would penalize the score) or 50 (which would inject false certainty).

**BR-05: One-Keyword-Per-Page Enforcement.** Each content inventory URL has at most one primary keyword assignment. When the Cannibalization Guard detects a URL ranking for multiple keywords, the keyword with the highest impressions is designated as the primary keyword. Other keywords targeting the same URL are flagged for review. This mapping is used across gap analysis (do not recommend keywords already assigned to existing pages) and recommendation deduplication.

**BR-06: Recommendation Deduplication.** Before writing new recommendations to `keyword_opportunities`, the runner checks three deduplication sources: (a) existing content inventory URLs -- if the keyword's primary URL already exists and is HEALTHY, do not recommend it, (b) articles currently in the pipeline queue -- do not recommend a keyword that is already being generated, (c) previously accepted recommendations from the last 30 days -- do not re-recommend keywords the user has already acted on. Dismissed recommendations ARE eligible for re-recommendation after 14 days.

**BR-07: Confidence Level Assignment.** Every recommendation receives a confidence level based on data completeness:
- `high` -- all 5 data sources contributed (GSC + GA4 + Semrush + Ahrefs + Trends). All 5 scoring components have real data.
- `medium` -- 3-4 data sources. 1-2 scoring components used fallback values.
- `low` -- 1-2 data sources. 3+ scoring components used fallback values. The UI shows: "Limited data -- score may change significantly when more sources are connected."

**BR-08: Content Type Refresh Thresholds.** Different content types decay at different rates. The Decay Detector uses content-type-specific thresholds (detected from `content_inventory.title` via regex):

| Content Type | Title Pattern | Refresh Trigger Age | Examples |
|-------------|---------------|---------------------|----------|
| Best-of / Top-N | "best", "top N", year in title | 6 months | "Best BMW Tuning Platforms 2025" |
| How-to / Guide | "how to", "guide", "tutorial" | 12 months | "How to Replace N54 HPFP" |
| Comparison | "vs", "versus", "compared" | 9 months | "B58 vs N55 Engine Comparison" |
| News / Current | year in title, "update", "new" | 3 months | "2026 BMW M3 Update" |
| Evergreen / Reference | No pattern match | 18 months | "BMW Engine Codes Explained" |

**BR-09: Gap Analysis Category Scoping.** Gap keywords are filtered for relevance to the user-specified category before scoring. The filter uses semantic matching: the category string is tokenized, and gap keywords must share at least 1 significant token with the category OR appear in the same Semrush topic cluster. This prevents recommending "best hiking boots" to a BMW publisher just because a competitor site also covers hiking.

**BR-10: Maximum Recommendations Per Run.** Each analysis run produces at most `max_recommendations` opportunities (default 20, max 50). The runner generates all candidate opportunities internally, scores them all, then truncates to the top N by priority score. This ensures the user always sees the best opportunities, not just the first N found.

**BR-11: Stale Data Warning.** If the most recent `performance_snapshots` data for a user is older than 7 days, all intelligence endpoints return a `data_freshness_warning` in the response: `{ "data_freshness_warning": "Performance data is 9 days old. Scores may not reflect recent changes. Trigger a manual sync or check your data connections." }`. If data is older than 30 days, recommendations are suppressed entirely: "Data too old for reliable analysis. Please reconnect your data sources."

**BR-12: Analysis Run Rate Limiting.** Maximum 5 full analysis runs per user per 24-hour rolling window. This prevents API cost spikes (each run may trigger Semrush/Ahrefs lookups via Data Ingestion's cache) and compute overload. The rate limit is enforced at the API layer before any analysis begins. Rate-limited requests return 429 with `{ "error": "Rate limited", "message": "Maximum 5 analysis runs per day. Next run available in N minutes." }`.

**BR-13: Automatic Nightly Analysis.** For users with all data sources connected (GSC at minimum), a scheduled analysis run triggers automatically at 04:00 UTC (1 hour after Data Ingestion's nightly sync). This ensures the Opportunities page is always current without requiring manual Mode B invocations. Scheduled runs use category = NULL (full-site analysis) and produce decay + cannibalization recommendations. Gap analysis requires an explicit category and is only run in manual Mode B invocations.

**BR-14: Scoring Formula Recalibration Hooks.** The 5-component scoring weights (0.30, 0.25, 0.25, 0.10, 0.10) are stored as configurable constants in `bridge/intelligence/scoring.js`, not hardcoded in the formula function. Layer 6 (Feedback Loop) can adjust these weights per-client based on recommendation accuracy data (predicted score vs actual article performance at 90 days). Default weights are restored if the recalibrated weights produce worse outcomes over a 30-day evaluation window.

---

## 5. Modules

### 5.1 Decay Detector (`bridge/intelligence/decay-detector.js`)

Ported from Master Kit `36-seo/content-seo/content-decay-refresh.md`. Implements four independent detection methods that are combined into a composite decay assessment per URL.

**Method 1 -- GSC Click/Impression Decline:**
Compares the most recent 3-month window (last 90 days) against the preceding 3-month window (90-180 days ago) using `performance_snapshots` data. A Supabase RPC function `detect_click_decline(p_user_id, p_decline_threshold, p_window_days)` performs the aggregation server-side for performance.

```javascript
function classifySeverity(clickChangePct) {
  if (clickChangePct <= -0.50) return 'critical';   // 50%+ decline
  if (clickChangePct <= -0.40) return 'high';        // 40-50% decline
  if (clickChangePct <= -0.20) return 'medium';      // 20-40% decline
  return 'low';                                       // <20% decline (still flagged if other methods trigger)
}
```

**Method 2 -- Ranking Position Drift:**
Detects position drops that cross page boundaries (page 1 to page 2). A drop from positions 1-10 to 11+ is classified as `critical` because CTR drops exponentially at the page boundary. Position is tracked as a 30-day moving average to smooth out daily SERP volatility.

```javascript
function detectPositionDrop(snapshots) {
  const current30d = snapshots.filter(s => withinDays(s.snapshot_date, 30));
  const previous30d = snapshots.filter(s => withinDays(s.snapshot_date, 60) && !withinDays(s.snapshot_date, 30));

  const currentAvg = average(current30d.map(s => s.avg_position));
  const previousAvg = average(previous30d.map(s => s.avg_position));
  const pageBoundaryCrossed = previousAvg <= 10 && currentAvg > 10;
  const positionDelta = currentAvg - previousAvg;

  return {
    previousPosition: round(previousAvg, 1),
    currentPosition: round(currentAvg, 1),
    positionDelta: round(positionDelta, 1),
    pageBoundaryCrossed,
    severity: pageBoundaryCrossed ? 'critical' : (positionDelta > 5 ? 'high' : 'medium')
  };
}
```

**Method 3 -- Content Age Audit:**
Uses content-type-specific freshness thresholds (BR-08). Content type is detected from the `title` field via regex. The `publish_date` and `modified_date` from `content_inventory` determine age. If `modified_date` is recent (within 80% of the trigger threshold), the age trigger is suppressed -- the content was recently refreshed.

```javascript
function detectContentAge(item) {
  const ageMonths = monthsSince(item.publish_date);
  const modifiedRecently = item.modified_date &&
    monthsSince(item.modified_date) < (getTriggerMonths(item.title) * 0.8);

  if (modifiedRecently) return { triggered: false, reason: 'recently_modified' };

  const triggerMonths = getTriggerMonths(item.title);
  return {
    contentType: detectContentType(item.title),
    ageMonths,
    triggerMonths,
    triggered: ageMonths >= triggerMonths,
    severity: ageMonths >= (triggerMonths * 1.5) ? 'high' : 'medium'
  };
}
```

**Method 4 -- Cannibalization as Decay Accelerator:**
When a URL is losing traffic AND another URL on the same site is gaining traffic for the same query, cannibalization is a contributing factor. This method does not create standalone decay alerts -- it amplifies the severity of existing decay signals by 1 level (medium -> high, high -> critical).

**Refresh Decision Matrix:**

| Condition | Recommended Action | Rationale |
|-----------|-------------------|-----------|
| 20-40% click decline, position still page 1-2, word count >= 1500 | `update_existing` (partial refresh) | Content foundation is solid, needs freshening: update stats, add new sections, refresh intro/conclusion |
| 40-50% click decline OR word count < 1000 OR position page 2-3 | `update_existing` (full rewrite) | Content needs significant overhaul but URL has value (backlinks, age authority) |
| 50%+ click decline AND position page 3+ AND clicks < 10/month AND no backlinks | `redirect` (301 to best alternative) | Content is effectively dead with no recovery value. Redirect equity to a stronger page |
| Any decline + active cannibalization conflict | Resolve cannibalization first | Refreshing content while it is cannibalizing another page wastes effort. Resolve the conflict, then reassess decay |
| Two weak pages cannibalizing, combined traffic > 100/month | `merge` | Neither page is strong alone. Combine into a comprehensive article on the stronger URL |

### 5.2 Gap Analyzer (`bridge/intelligence/gap-analyzer.js`)

Identifies keywords that competitors rank for but the client does not. Cross-references Semrush Keyword Gap data (pulled by Data Ingestion) with the client's GSC query coverage.

**Competitor Auto-Detection:** When no competitors are specified, queries Semrush domain analytics data for the top 5 domains by keyword overlap with the client's domain. Overlap is measured as the count of shared ranking keywords. Competitors are cached per-client in `analysis_metadata` and reused for 7 days.

**Gap Detection Logic:**

```javascript
async function analyzeGaps(userId, category, competitors) {
  // Step 1: Build client's keyword set from GSC (positions 1-100)
  const clientKeywords = await getClientKeywords(userId);
  const clientKeywordSet = new Set(clientKeywords.map(k => k.query.toLowerCase()));

  // Step 2: Get competitor keywords from Semrush gap data
  const competitorKeywords = await getCompetitorKeywords(userId, competitors);

  // Step 3: Find gaps with category scoping (BR-09)
  const categoryTokens = tokenize(category);
  const gaps = competitorKeywords.filter(ck => {
    const normalized = ck.keyword.toLowerCase();
    const isGap = !clientKeywordSet.has(normalized);
    const meetsVolume = ck.volume >= 100;
    const matchesCategory = categoryTokens.some(t => normalized.includes(t))
                          || ck.topic_cluster === category;
    return isGap && meetsVolume && matchesCategory;
  });

  // Step 4: Score and rank
  return gaps.map(gap => ({
    keyword: gap.keyword,
    volume: gap.volume,
    difficulty: gap.keyword_difficulty,
    competitorCount: gap.competitor_count,
    competitorAvgPosition: gap.avg_position,
    competitorAvgWordCount: gap.avg_word_count,
    serpFeatures: gap.serp_features,
    gapScore: calculateGapScore(gap)
  })).sort((a, b) => b.gapScore - a.gapScore);
}

function calculateGapScore(gap) {
  const volumeScore = Math.min(gap.volume / 100, 100);        // 0-100, ceiling at 10K volume
  const difficultyInverse = 100 - gap.keyword_difficulty;       // Lower KD = higher score
  const competitorWeakness = gap.avg_position > 10 ? 20 : 0;   // Bonus if competitors outside top 10
  const serpOpportunity = gap.serp_features.includes('featured_snippet') ? 10 : 0;

  return (volumeScore * 0.35) + (difficultyInverse * 0.35) + (competitorWeakness * 0.15) + (serpOpportunity * 0.15);
}
```

### 5.3 Cannibalization Guard (`bridge/intelligence/cannibalization.js`)

Ported from Master Kit `36-seo/content-seo/keyword-content-mapping.template.md`. Enforces the one-keyword-per-page rule and detects conflicts.

**Three Detection Methods:**

1. **GSC Query Overlap (Primary):** Queries `performance_snapshots` for all GSC queries where 2+ client URLs each receive >= 50 impressions. Groups by query, ranks URLs by clicks. This is the highest-confidence method -- GSC data directly shows which pages Google associates with which queries.

2. **Position Flip-Flop (Secondary):** Analyzes position history for queries where two client URLs alternate in the SERPs. If URL A and URL B swap ranking positions for the same query 3+ times in 30 days, this is a strong cannibalization signal -- Google cannot decide which page to rank. Detected by computing position variance per URL-query pair.

3. **Semantic Title Overlap (Tertiary, Lower Confidence):** Uses trigram similarity on `content_inventory.title` to detect pages with very similar titles that may target the same topic. Similarity threshold: 0.6 (trigram). Flagged as `low` confidence -- requires human review. This catches cases where two pages exist that WILL cannibalize once both gain rankings, even if GSC has not yet surfaced the conflict.

**Four Resolution Strategies:**

```javascript
function suggestResolution(winner, losers, query) {
  const strategies = [];

  for (const loser of losers) {
    const trafficRatio = winner.clicks / Math.max(loser.clicks, 1);
    const winnerIntent = classifyUrlIntent(winner.url, winner.title);
    const loserIntent = classifyUrlIntent(loser.url, loser.title);
    const sameIntent = winnerIntent === loserIntent;
    const loserHasBacklinks = (loser.backlinks || 0) > 5;

    if (trafficRatio < 1.5 && sameIntent) {
      // Similar traffic, same intent: merge into one comprehensive article
      strategies.push({
        url: loser.url,
        strategy: 'merge',
        confidence: 'high',
        reason: `Both pages have similar traffic (ratio ${trafficRatio.toFixed(1)}x) and target the same intent. Merge into ${winner.url} for a comprehensive article.`
      });
    } else if (trafficRatio >= 3 && !loserHasBacklinks) {
      // Winner clearly dominant, loser has no link equity: redirect
      strategies.push({
        url: loser.url,
        strategy: 'redirect',
        confidence: 'high',
        reason: `Winner has ${trafficRatio.toFixed(0)}x more traffic. Loser has no significant backlinks. 301 redirect to preserve equity.`
      });
    } else if (!sameIntent) {
      // Different intents: sharpen targeting so each page serves its intent
      strategies.push({
        url: loser.url,
        strategy: 'differentiate',
        confidence: 'medium',
        reason: `Winner serves ${winnerIntent} intent, loser serves ${loserIntent} intent. Sharpen keyword targeting so each page ranks for its correct intent.`
      });
    } else {
      // Same intent but loser has backlinks or moderate traffic: deoptimize
      strategies.push({
        url: loser.url,
        strategy: 'deoptimize',
        confidence: 'medium',
        reason: `Remove target keyword from loser's title, H1, and meta description. Loser has backlinks worth preserving but should not compete for this query.`
      });
    }
  }

  return strategies;
}
```

### 5.4 Seasonality Model (`bridge/intelligence/seasonality.js`)

Integrates Google Trends data (pulled by Data Ingestion weekly) to model seasonal demand curves and optimize publication timing.

**Key Insight:** Write BEFORE the peak, not during it. Content needs 4-8 weeks to get indexed, build ranking signals, and stabilize in SERPs. Publishing during peak season means the article misses the window. The optimal publication window is 6-8 weeks before the seasonal peak.

```javascript
function calculateSeasonalityBonus(trendData, currentMonth) {
  if (!trendData || trendData.length === 0) {
    return { bonus: 0, type: 'no_data', normalized: 50 }; // Neutral fallback
  }

  const peakMonths = trendData
    .map((interest, idx) => ({ month: idx + 1, interest }))
    .filter(m => m.interest >= 80)
    .map(m => m.month);

  if (peakMonths.length === 0) {
    return { bonus: 0, type: 'evergreen', normalized: 50 }; // No seasonal pattern
  }

  const nextPeak = findNextPeakMonth(peakMonths, currentMonth);
  const weeksToPeak = weeksUntilMonth(nextPeak, currentMonth);

  // Sweet spot: 4-8 weeks before peak (write, index, rank before demand arrives)
  if (weeksToPeak >= 4 && weeksToPeak <= 8) {
    return { bonus: 15, type: 'approaching_peak', weeksToPeak, normalized: 100 };
  } else if (weeksToPeak >= 2 && weeksToPeak < 4) {
    return { bonus: 10, type: 'near_peak', weeksToPeak, normalized: 66.7 };
  } else if (weeksToPeak > 8 && weeksToPeak <= 16) {
    return { bonus: 5, type: 'early', weeksToPeak, normalized: 33.3 };
  } else {
    return { bonus: 0, type: 'off_season', weeksToPeak, normalized: 0 };
  }
}
```

The seasonal curve is also used defensively by the Decay Detector (BR-02) to suppress false positive decay alerts during expected seasonal troughs.

### 5.5 Saturation Index (`bridge/intelligence/saturation.js`)

Scores SERP competitiveness for each keyword by analyzing the quality, freshness, and authority of existing top-10 results. Uses Semrush SERP data pulled by Data Ingestion.

**Scoring Signals:**

| Signal | Low Saturation (Opportunity) | High Saturation (Hard) | Weight |
|--------|-------------------------------|----------------------|--------|
| Avg word count of top 10 | < 1000 (thin content) | > 2500 (deep, authoritative) | 20 pts |
| Avg content age of top 10 | > 18 months (outdated) | < 6 months (freshly updated) | 20 pts |
| Forum/Reddit/UGC count in top 10 | 3+ forum results (Google has no quality options) | 0 forum results | 15 pts |
| Avg domain authority | < 40 (weak sites ranking) | > 60 (all strong domains) | 10 pts |
| Featured snippet claimed | No snippet or snippet from weak domain | Snippet held by DR 60+ domain | 10 pts |
| PAA boxes present | Many PAA = fragmented intent, room to provide comprehensive answer | No PAA = intent satisfied by single result | 5 pts |

```javascript
function calculateSaturationScore(serpData) {
  let score = 50; // Start neutral

  // Word count assessment
  const avgWordCount = average(serpData.map(r => r.word_count));
  if (avgWordCount < 800) score -= 20;
  else if (avgWordCount < 1200) score -= 10;
  else if (avgWordCount > 2500) score += 15;
  else if (avgWordCount > 3500) score += 20;

  // Content freshness
  const avgAgeMonths = average(serpData.map(r => monthsSince(r.publish_date)));
  if (avgAgeMonths > 24) score -= 20;
  else if (avgAgeMonths > 18) score -= 10;
  else if (avgAgeMonths < 6) score += 15;

  // Forum dominance -- forums ranking means Google lacks quality content options
  const forumCount = serpData.filter(r => isForumDomain(r.domain)).length;
  if (forumCount >= 3) score -= 15;
  else if (forumCount >= 1) score -= 5;

  // Domain authority spread
  const avgDA = average(serpData.map(r => r.domain_authority));
  if (avgDA < 30) score -= 15;
  else if (avgDA < 40) score -= 10;
  else if (avgDA > 60) score += 10;

  // Featured snippet
  const snippetHolder = serpData.find(r => r.has_featured_snippet);
  if (!snippetHolder) score -= 5;
  else if (snippetHolder.domain_authority < 40) score -= 5;

  return Math.max(0, Math.min(100, score));
}
```

Lower saturation score = higher opportunity. The `competition_inverse` component in the priority formula uses `100 - saturationScore`.

---

## 6. Topic Recommender Agent

### Agent Specification

The Topic Recommender is a new markdown agent (`agents/topic-recommender.md`) following the established agent pattern used by project-analyzer, research-engine, article-architect, and draft-writer. It is the AI brain that orchestrates Mode B.

**Agent Frontmatter:**

```yaml
name: topic-recommender
description: Analyzes content inventory, performance data, and competitive gaps to recommend scored article topics
tools: [bridge-api, gemini-mcp]
input: category (string), userId (string), analysisContext (object)
output: recommendations (JSON array of scored topic objects)
```

**Agent Input Format (context injected by the orchestrator):**

```json
{
  "category": "BMW engine maintenance",
  "site_url": "https://bimmertech.com",
  "site_language": "en",
  "inventory_summary": {
    "total_articles": 847,
    "category_articles": 42,
    "thin_content_count": 8,
    "avg_word_count": 1840,
    "topic_clusters": ["N54 engine", "B58 engine", "oil changes", "tuning", "maintenance schedules"]
  },
  "decay_results": [
    { "url": "/blog/best-tuning-platforms", "severity": "high", "click_change": -34, "age_months": 14 }
  ],
  "gap_results": [
    { "keyword": "N54 HPFP failure symptoms", "volume": 4400, "difficulty": 28, "competitor_count": 2 }
  ],
  "seasonality_data": {
    "N54 HPFP failure symptoms": { "peak_months": [10, 11, 12], "weeks_to_peak": 28 }
  },
  "saturation_data": {
    "N54 HPFP failure symptoms": { "score": 28, "thin_results": 4, "forum_count": 3 }
  },
  "cannibalization_conflicts": [],
  "data_sources_available": ["gsc", "semrush", "trends"],
  "data_sources_missing": ["ahrefs", "ga4"]
}
```

**Agent Output Format (strict JSON, validated before storage):**

```json
{
  "recommendations": [
    {
      "rank": 1,
      "title": "N54 HPFP Failure Symptoms and Solutions",
      "target_keyword": "N54 HPFP failure symptoms",
      "type": "NEW",
      "intent": "informational",
      "content_type": "guide",
      "evidence": "High-volume keyword (4,400/mo) with no existing coverage on your site. 2 competitors rank (avg position 4.0) but their content is thin (avg 830 words) and outdated (22 months avg age). 3 forum results in top 10 indicate a quality gap. Seasonal peak in October-December.",
      "signals": {
        "impressions_normalized": 94.3,
        "decay_severity": 0,
        "gap_size": 82.5,
        "seasonality_bonus": 33.3,
        "competition_inverse": 72
      }
    }
  ]
}
```

### Scoring Formula with All 5 Components

```
priority = (impressions_normalized * W_imp)
         + (decay_severity       * W_dec)
         + (gap_size             * W_gap)
         + (seasonality_bonus    * W_sea)
         + (competition_inverse  * W_com)
```

Default weights: `W_imp = 0.30, W_dec = 0.25, W_gap = 0.25, W_sea = 0.10, W_com = 0.10`. Sum = 1.00.

**Component Normalization Details:**

| Component | Raw Input | Normalization to 0-100 | Notes |
|-----------|-----------|----------------------|-------|
| `impressions_normalized` | Monthly GSC impressions | `min(impressions / 300, 100)` -- 30K+ = max | For gap keywords without GSC data, uses Semrush estimated volume: `min(volume / 50, 100)` |
| `decay_severity` | Decay detector severity string | `critical = 100, high = 75, medium = 50, low = 25, none = 0` | 0 for NEW recommendations (no existing content to decay) |
| `gap_size` | Gap analyzer score | Already 0-100 from `calculateGapScore()` | 0 for REFRESH recommendations (keyword already covered) |
| `seasonality_bonus` | Seasonality model output | `approaching_peak = 100, near_peak = 66.7, early = 33.3, off_season/no_data = 0` | When Trends unavailable, defaults to 50 (neutral), NOT 0 |
| `competition_inverse` | Saturation index score | `100 - saturationScore` | When Semrush SERP data unavailable, estimated from GSC: `100 - min(avg_position * 2, 100)` |

**Re-weighting Example:** If both gap and saturation data are unavailable (Semrush not connected):
- Available components: impressions (0.30), decay (0.25), seasonality (0.10) -- total weight 0.65
- Re-weighted: impressions = 0.30/0.65 = 0.462, decay = 0.25/0.65 = 0.385, seasonality = 0.10/0.65 = 0.154
- The UI shows `confidence: "low"` and a banner: "Connect Semrush for gap analysis and competition scoring."

### Minimum Data Requirements

| Requirement | Minimum | Fallback Behavior |
|-------------|---------|-------------------|
| GSC data | 30 days of snapshots | Without: skip decay detection, impressions component uses Semrush volume estimate, agent still runs but confidence = `low` |
| Content inventory | 1 completed crawl | Without: skip cannibalization check, skip inventory analysis. Warn: "Run a content crawl first for full analysis." |
| Semrush data | 1 weekly pull cached | Without: skip gap analysis and saturation index. These are the two highest-weight components after re-weighting. Agent runs with reduced value. |
| Google Trends | 1 weekly pull cached | Without: skip seasonality. Seasonal bonus defaults to 50 (neutral). |
| Ahrefs data | 1 weekly pull cached | Without: domain authority unavailable for saturation scoring. Saturation uses word count and freshness only. |

### Confidence Calculation

```javascript
function calculateConfidence(sourcesAvailable, sourcesTotal) {
  const ratio = sourcesAvailable.length / sourcesTotal;
  if (ratio >= 0.8) return 'high';      // 4-5 of 5 sources
  if (ratio >= 0.5) return 'medium';    // 3 of 5 sources
  return 'low';                          // 1-2 of 5 sources
}
```

---

## 7. Mode B Pipeline

### Full Execution Flow

```
INPUT: Category ("BMW engine maintenance") + User Auth Token
       Optional: competitors[], max_recommendations, analyses[]

Step 0: Pre-flight Checks
  ├─ Verify user has at least 1 active data connection (GSC minimum)
  ├─ Check rate limit (max 5 runs/day)
  ├─ Check no other analysis running for this user
  └─ Create analysis_runs row with status 'running'

Step 1: Content Inventory Scan [~2s]
  ├─ Query content_inventory for all user URLs
  ├─ Filter to category-relevant articles (title/URL pattern match)
  ├─ Build topic cluster map from titles and keyword assignments
  └─ OUTPUT: inventory_summary {total, category_articles, clusters, thin_content}

Step 2: Decay Detection [~5s]
  ├─ Query performance_snapshots for last 180 days
  ├─ Run Method 1: Click/impression decline (3-month rolling window)
  ├─ Run Method 2: Position drift (page boundary crossings)
  ├─ Run Method 3: Content age audit (type-specific thresholds)
  ├─ Run Method 4: Cannibalization-as-decay amplifier
  ├─ Apply seasonal override (BR-02) for false positive suppression
  └─ OUTPUT: decay_results[] with severity, method, evidence

Step 3: Gap Analysis [~3s]
  ├─ Auto-detect or use provided competitors
  ├─ Pull Semrush keyword gap data (from api_cache, no live API call)
  ├─ Cross-reference against client's GSC keyword set
  ├─ Apply category scoping filter (BR-09)
  ├─ Score each gap keyword
  └─ OUTPUT: gap_results[] with volume, difficulty, gap_score

Step 4: Seasonality Check [~1s]
  ├─ Pull Google Trends data for top candidate keywords (from api_cache)
  ├─ Identify peak months per keyword
  ├─ Calculate weeks to next peak
  ├─ Assign seasonal bonus tier
  └─ OUTPUT: seasonality_data{} keyed by keyword

Step 5: Saturation Index [~2s]
  ├─ Pull Semrush SERP data for top candidate keywords (from api_cache)
  ├─ Analyze top-10 results: word count, age, forum presence, DA
  ├─ Calculate saturation score per keyword
  └─ OUTPUT: saturation_data{} keyed by keyword

Step 6: Cannibalization Guard [~3s]
  ├─ Detect multi-URL conflicts for candidate keywords
  ├─ For each conflict: classify intent, suggest resolution
  ├─ Reclassify: if candidate keyword has existing page in positions 1-10,
  │   change recommendation type from NEW to REFRESH
  └─ OUTPUT: cannibalization_conflicts[] with resolution strategies

Step 7: Agent Invocation [~15-20s]
  ├─ Assemble context object from Steps 1-6
  ├─ Invoke agents/topic-recommender.md via Claude CLI
  ├─ Agent synthesizes data, generates title suggestions, writes evidence narratives
  └─ OUTPUT: raw_recommendations[] from agent

Step 8: Scoring & Deduplication [~1s]
  ├─ Apply priority scoring formula to each recommendation
  ├─ Apply re-weighting for missing components (BR-04)
  ├─ Deduplicate against inventory, pipeline, recent recommendations (BR-06)
  ├─ Calculate confidence level per recommendation (BR-07)
  ├─ Sort by priority_score descending
  ├─ Truncate to max_recommendations
  └─ OUTPUT: scored_recommendations[]

Step 9: Storage & Response [~1s]
  ├─ Upsert scored_recommendations into keyword_opportunities
  ├─ Upsert cannibalization_conflicts into cannibalization_conflicts table
  ├─ Update analysis_runs with completion status and timing metadata
  └─ OUTPUT: run_id returned to client

TOTAL: ~30-40 seconds for a site with 1,000 URLs
```

### Pipeline Handoff to Article Generation

When a user selects a recommendation and clicks "Generate Article":

1. The `/api/intelligence/recommendations/:id/execute` endpoint is called
2. A pipeline job is created with the recommendation's full context:
   ```json
   {
     "keyword": "N54 HPFP Failure Symptoms and Solutions",
     "mode": "B",
     "recommendation_id": "uuid",
     "type": "NEW",
     "intelligence_context": {
       "gap_evidence": { "competitor_urls": [...], "their_weaknesses": [...] },
       "seasonal_timing": "peak in October, publish now for indexing lead time",
       "serp_opportunity": "thin results (avg 830 words), 3 forum results, no featured snippet",
       "suggested_word_count": 2500,
       "suggested_format": "guide",
       "target_serp_features": ["featured_snippet", "paa"]
     }
   }
   ```
3. This context is injected into the research-engine agent, shaping its research focus
4. The article-architect receives the SERP analysis and competitor weaknesses, informing structure decisions
5. The pipeline proceeds: research-engine -> article-architect -> draft-writer

For REFRESH type recommendations, the pipeline additionally receives:
- The existing article URL
- The specific decay signals (what went wrong)
- Instructions to analyze the current content and identify what to update, add, and remove

---

## 8. Auth & Permissions

### Role x Action Matrix

| Action | Client User | Client Admin | ChainIQ Admin | Scheduler (service_role) |
|--------|-------------|--------------|---------------|--------------------------|
| View own recommendations | YES | YES | YES (via admin tools) | NO |
| Accept/dismiss recommendation | YES | YES | NO | NO |
| Execute recommendation (send to pipeline) | NO | YES | YES | NO |
| Trigger Mode B analysis run | NO | YES | YES | N/A |
| View decay analysis | YES | YES | YES | NO |
| View cannibalization conflicts | YES | YES | YES | NO |
| Resolve cannibalization conflict | NO | YES | YES | NO |
| View analysis run history | YES | YES | YES | NO |
| View content calendar | YES | YES | YES | NO |
| Write keyword_opportunities | NO | NO | NO | YES (analysis runner) |
| Write analysis_runs | NO | NO | NO | YES |
| Write cannibalization_conflicts | NO | NO | NO | YES |
| Adjust scoring weights (recalibration) | NO | NO | YES | YES (Layer 6 automated) |
| View cross-client analytics | NO | NO | YES | NO |

### API Authentication

All intelligence endpoints require a valid Bearer token in the `Authorization` header, verified via the existing `verifyAuth()` middleware in `bridge/server.js`. The user_id extracted from the JWT is used in all database queries (WHERE user_id = ?) to enforce data isolation. No endpoint accepts a user_id parameter -- the authenticated user IS the user.

---

## 9. Validation Rules

**VR-01: Category Input.** The `category` field in `POST /api/intelligence/run` must be a non-empty string, 3-200 characters, containing only alphanumeric characters, spaces, hyphens, and Arabic/Unicode characters. HTML tags are stripped. SQL injection attempts are blocked by parameterized queries.

**VR-02: Competitor Domain Format.** Each entry in the `competitors[]` array must be a valid domain (no protocol, no path). Pattern: `^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$`. Examples: `competitor-a.com`, `bmw-forum.de`. Invalid entries are silently removed from the array, not rejected.

**VR-03: Max Recommendations Range.** `max_recommendations` must be an integer between 1 and 50. Values above 50 are capped to 50. Values below 1 default to 20.

**VR-04: Priority Score Bounds.** The scoring formula must always produce a value in the range 0.00 to 100.00. Values outside this range indicate a normalization bug. The scorer function clamps output: `Math.max(0, Math.min(100, score))`.

**VR-05: Status Transitions.** Only valid status transitions are permitted on PATCH:
- `open` -> `accepted` or `dismissed`
- `accepted` -> `in_pipeline` (only via execute endpoint)
- `in_pipeline` -> `completed` (only via pipeline callback)
- `dismissed` -> `open` (re-open a dismissed recommendation)
- All other transitions return 400 Bad Request.

**VR-06: Opportunity Type Enum.** The `opportunity_type` field must be one of: `gap`, `decay`, `cannibalization`, `trending`, `seasonal`. Invalid values in filter queries are rejected with 400.

**VR-07: Analysis Selection.** The `analyses[]` field in run requests must contain only valid analysis names: `inventory`, `decay`, `gap`, `seasonality`, `saturation`, `cannibalization`. Unknown analysis names are rejected.

**VR-08: Pagination Bounds.** `page` must be >= 1. `per_page` must be 1-100 (stricter than Data Ingestion's 200 limit because recommendation payloads are larger). `sort` must be a whitelisted value.

**VR-09: Keyword Format.** Keywords stored in `keyword_opportunities` are trimmed, lowercased (for English), and limited to 500 characters. Arabic keywords preserve original case/diacritics but are trimmed.

**VR-10: UUID Parameters.** All `:id` and `:contentId` URL parameters must be valid UUID v4 format. Non-UUIDs return 400 before any database query.

**VR-11: Resolution Strategy.** The `strategy` field in `POST /api/intelligence/cannibalization/:id/resolve` must be one of: `merge`, `redirect`, `differentiate`, `deoptimize`.

**VR-12: Date Range in Calendar.** The `months` parameter in `GET /api/intelligence/calendar` must be 1-12.

---

## 10. Error Handling

### E-01: Insufficient Data for Analysis

**Trigger:** User triggers Mode B analysis but has < 30 days of GSC data.
**Error code:** `INSUFFICIENT_DATA`
**User message:** "Not enough data for full analysis. Connect GSC and accumulate 30+ days of data. Running partial analysis with available data."
**Automatic recovery:** Run analyses that do not require historical data (gap analysis if Semrush connected, seasonality if Trends connected). Skip decay detection. Mark run as `partial`. Return partial results with `confidence: "low"`.

### E-02: Agent Timeout

**Trigger:** The Topic Recommender agent does not produce output within 120 seconds (Claude CLI subprocess timeout).
**Error code:** `AGENT_TIMEOUT`
**User message:** "Analysis timed out. This can happen with very large content inventories. Try narrowing the category or reducing max_recommendations."
**Automatic recovery:** Kill the subprocess. Check if intermediate results from Steps 1-6 are available. If Steps 1-6 completed, apply scoring formula without agent-generated titles/evidence (use keyword as title, auto-generate evidence from analysis data). Mark run as `partial`. Log `{ event: "agent_timeout", user_id, category, inventory_size }`.

### E-03: Stale Data Warning

**Trigger:** Most recent performance_snapshots data is 7-30 days old.
**Error code:** `STALE_DATA` (not an error -- a warning attached to the response)
**User message:** "Performance data is [N] days old. Scores may not reflect recent changes."
**Automatic recovery:** Analysis runs normally but all responses include `data_freshness_warning` field. Recommendation confidence is capped at `medium` regardless of source count.

### E-04: Scoring Anomaly Detection

**Trigger:** The scoring formula produces a result that is suspiciously high (>95) or suspiciously low (<5) for a recommendation that has moderate-looking signals.
**Error code:** `SCORING_ANOMALY`
**User message:** None (internal logging only).
**Automatic recovery:** Log the full scoring breakdown for manual review. Add a `scoring_review_flag: true` to the recommendation's analysis_metadata. This data feeds into Layer 6 recalibration.

### E-05: Semrush/Ahrefs Cache Miss During Analysis

**Trigger:** Gap analysis or saturation index needs Semrush data but the api_cache has expired entries.
**Error code:** `CACHE_MISS_THIRD_PARTY`
**User message:** "Competitive intelligence data is being refreshed. Using the most recent cached data (from [date])."
**Automatic recovery:** Use expired cache data (better than nothing) but flag it: `{ stale_cache: true, cache_date: "2026-03-21" }`. The next scheduled Data Ingestion run will refresh the cache. Do NOT trigger a live Semrush API call during analysis (that is Data Ingestion's responsibility).

### E-06: Zero Opportunities Found

**Trigger:** After all 6 analyses and scoring, no recommendations meet the minimum threshold (priority_score >= 10).
**Error code:** `NO_OPPORTUNITIES`
**User message:** "No opportunities found for this category. Possible reasons: (1) Your site already covers this topic comprehensively. (2) The category is too narrow -- try broadening it. (3) Competitor data is unavailable -- connect Semrush for gap analysis."
**Automatic recovery:** Return empty result set. Mark run as `completed` (not `failed` -- zero results is a valid outcome).

### E-07: Database Write Failure During Results Storage

**Trigger:** Supabase returns an error when upserting keyword_opportunities.
**Error code:** `STORAGE_FAILED`
**User message:** "Analysis completed but results could not be saved. Please try again."
**Automatic recovery:** Retry write once after 2 seconds. If still failing, return the recommendations in the API response body (so the user sees them even if not persisted) and mark run as `failed` with the error detail.

### E-08: Concurrent Analysis Collision

**Trigger:** User triggers a second analysis while one is already running.
**Error code:** `ANALYSIS_IN_PROGRESS`
**User message:** "An analysis is already running (started [N] seconds ago). Please wait for it to complete."
**Automatic recovery:** Return 409 Conflict with the existing run_id so the user can poll for its status.

---

## 11. Edge Cases

### EC-01: New Site With No History

A client who just connected GSC yesterday. Zero performance_snapshots data, zero content_inventory. **Handling:** Analysis run completes immediately with zero recommendations. The UI shows an onboarding state: "Your data is being collected. Full intelligence analysis will be available after 30 days of GSC data. In the meantime, use Mode A to generate articles with keywords you already have in mind." Gap analysis CAN run if Semrush is connected (does not require GSC), providing some immediate value.

### EC-02: Site With Only 1 Article

A brand-new blog with a single published article. **Handling:** Cannibalization check is skipped (< 2 URLs). Decay detection runs but has limited statistical significance. Gap analysis provides the most value here: showing what the competitors cover that this site does not. The UI emphasizes gap opportunities: "Your site has 1 article. Here are the topics your competitors cover that you could expand into."

### EC-03: Seasonal-Only Content

A site that publishes exclusively seasonal content (e.g., holiday gift guides, tax preparation). Most articles show dramatic traffic swings that look like decay but are seasonal. **Handling:** The seasonal override (BR-02) catches this -- if the Trends curve explains the traffic pattern, decay is suppressed. If Trends data is unavailable, the system WILL produce false positive decay alerts. The UI indicates: "Connect Google Trends for better seasonal accuracy" on every decay alert where Trends data is missing.

### EC-04: Competitor Data Unavailable

No Semrush connection means no competitor keyword data. **Handling:** Gap analysis and saturation index are skipped. The remaining analyses (decay, cannibalization, seasonality) still run. Priority scoring re-weights (BR-04) to exclude gap and competition components. Confidence = `low`. The gap component returns empty results with a note: "Connect Semrush to identify keyword gaps versus competitors."

### EC-05: Multilingual Site (Arabic + English)

A site like SRMG with content in both Arabic and English. **Handling:** The `content_inventory.language` field separates articles by language. Analysis runs are language-aware: decay detection compares articles within the same language group (Arabic articles compared to Arabic articles, not to English). Gap analysis uses language-appropriate keyword data from Semrush (Arabic keyword database). The agent prompt includes the site language so title suggestions match.

### EC-06: Arabic Morphological Clustering Needs

Arabic keywords have complex morphology -- the same concept can be expressed with multiple word forms (root patterns, prefixes, suffixes). "صيانة BMW" and "صيانه بي ام دبليو" are the same query in different transliterations. **Handling:** Phase 1 uses exact-match keyword comparison (standard behavior). Phase 2 adds Arabic-specific normalization: strip diacritics (tashkeel), normalize alef variants (أ, إ, آ -> ا), normalize taa marbuta (ة -> ه for matching), and normalize Arabic-Latin brand transliterations. The cannibalization guard must use this normalization to avoid missing conflicts between Arabic spelling variants.

### EC-07: Massive Inventory (10,000+ URLs)

Enterprise publishers with huge content libraries. The 6-analysis pipeline must complete within 60 seconds. **Handling:** Incremental analysis. The analysis runner only re-analyzes URLs where: (a) performance data has changed since the last analysis (checked via `performance_snapshots.created_at` > last run timestamp), or (b) the URL was not included in the previous run. Cached decay results for unchanged URLs are reused. The gap analysis and saturation index operate on keywords (not URLs) and are not affected by inventory size.

### EC-08: Saturated Category Where Everything Is Hard

A category like "credit cards" where every SERP is dominated by DR 90+ sites with 5000+ word articles. Every recommendation would have a very low competition_inverse score. **Handling:** The scoring formula still works -- impressions and gap size carry 55% of the weight. The saturation index produces high scores (= hard), which lowers the competition component, but a high-volume gap keyword still scores well overall. The UI shows the saturation data transparently: "Competition is very strong for all keywords in this category. These are the LEAST saturated opportunities available."

### EC-09: All Data Sources Connected But No Category Relevance

User enters a category that has zero overlap with their site's existing content (e.g., a BMW site entering "vegan recipes"). **Handling:** Decay detection finds nothing category-relevant. Gap analysis may find keywords (competitors might rank for random things). Cannibalization finds nothing. The result is a list of gap-only recommendations with low confidence and a note: "This category appears unrelated to your site's existing content. Consider whether you have the topical authority to rank for these keywords."

### EC-10: Rate Limit Exhaustion Mid-Analysis

The analysis run hits the Supabase connection limit or internal rate limits during Step 3 (gap analysis query is expensive). **Handling:** Each analysis step has its own timeout (step-level, not run-level). If a step fails, the runner records it in `analyses_failed`, continues with the remaining steps, and marks the run as `partial`. Results from completed steps are still stored and returned. The user sees: "Partial results -- gap analysis failed due to temporary load. Retry in 5 minutes."

### EC-11: Cannibalization Between Different Content Types

Two pages targeting "BMW oil change" -- one is a how-to guide, the other is a product comparison. They share the keyword but serve different intents. **Handling:** The cannibalization guard's intent classification (VR section of detection method 1) identifies the different intents. The resolution strategy is `differentiate` with `medium` confidence: "These pages serve different intents (informational vs commercial). Ensure each page's title and meta description clearly signal its intent to search engines."

### EC-12: Analysis Results From Multiple Runs Overlap

User runs analysis for "BMW engine" on Monday and "BMW maintenance" on Thursday. Many keywords appear in both categories. **Handling:** The `UNIQUE (user_id, keyword, opportunity_type)` constraint on `keyword_opportunities` means the second run UPSERTs over the first. The newer score replaces the older one. The `analysis_run_id` tracks which run last updated each opportunity. Both runs are preserved in `analysis_runs` for history.

---

## 12. Security

### Client Data Isolation (RLS)

Row Level Security on all intelligence tables ensures absolute data isolation between clients. Every table has `auth.uid() = user_id` policies for SELECT, INSERT, UPDATE, and DELETE. The analysis runner uses `service_role` key (bypasses RLS) to write results, but always includes the correct `user_id` in every row.

**No cross-client data leakage:** The gap analysis shows what COMPETITORS rank for, but competitor data comes from Semrush's public API (which anyone could query). It does NOT expose other ChainIQ clients' data. If Client A and Client B are both on ChainIQ, neither can see the other's recommendations, decay alerts, or cannibalization conflicts.

**Admin visibility:** ChainIQ Admin role can view aggregate statistics across clients (total recommendations generated, acceptance rates) but cannot see individual keyword_opportunities rows for specific clients without explicitly logging in as that client's admin.

### Competitor Domain Validation

User-provided competitor domains are validated (VR-02) and used only as parameters to Semrush API queries. They are never used to make direct HTTP requests (no SSRF risk). The domains are stored in `analysis_runs.competitors` for audit purposes.

### Analysis Run Rate Limiting

The 5 runs/day limit (BR-12) prevents abuse scenarios: a malicious user running thousands of analyses to exhaust ChainIQ's Semrush API quota. Rate limit state is tracked in-memory (Map of user_id -> run timestamps in the last 24 hours). State resets on bridge server restart, which is acceptable since restarts are rare and the daily limit is generous.

### No Sensitive Data in Recommendations

Recommendation evidence strings are designed for display in the dashboard. They never contain: competitor site passwords, internal competitor analytics, or any data that could not be obtained from public SEO tools. All competitive intelligence is sourced from Semrush/Ahrefs public APIs.

---

## 13. Performance

### Recommendation Generation Latency

| Site Size | Target Latency | Bottleneck |
|-----------|---------------|------------|
| < 100 URLs | < 15 seconds | Agent invocation (Step 7) |
| 100-1,000 URLs | < 30 seconds | Decay detection queries (Step 2) |
| 1,000-5,000 URLs | < 45 seconds | Decay detection + inventory scan |
| 5,000-10,000 URLs | < 60 seconds | Must use incremental analysis |
| 10,000+ URLs | < 90 seconds | Incremental analysis mandatory. Full re-analysis on first run only. |

### Caching Strategy

**Scored results caching:** After each analysis run, the full set of scored recommendations is stored in `keyword_opportunities`. Subsequent `GET /api/intelligence/recommendations` queries read from this table directly (a simple SELECT with filters and pagination). There is NO re-computation on read. Scores are computed once during the analysis run and stored.

**Analysis step caching:** Each analysis step (decay, gap, seasonality, saturation, cannibalization) stores its results in the `analysis_metadata` of each `keyword_opportunity` row. The next run can check if underlying data has changed before re-running a step. If `performance_snapshots` has no new rows since the last decay analysis, decay results are reused from the previous run.

**Third-party data caching:** All Semrush, Ahrefs, and Trends data is read from Data Ingestion's `api_cache` table (7-day TTL). Intelligence never makes direct API calls to third-party services. This ensures predictable latency (no waiting for external APIs during analysis) and prevents cost overruns.

### Incremental Analysis

For sites with 1,000+ URLs, full re-computation on every run is wasteful. The analysis runner implements incremental analysis:

1. **Changed URLs only:** Query `performance_snapshots` for URLs with new data since the last analysis run timestamp. Only re-run decay detection on these URLs.
2. **Stable decay results reuse:** URLs whose performance data has not changed reuse their decay classification from the previous run.
3. **Gap analysis is keyword-level:** Gap analysis operates on keywords, not URLs, so it is not affected by inventory size. It runs in full every time (Semrush data changes weekly).
4. **Saturation index is keyword-level:** Same as gap analysis -- runs on the candidate keyword list, not the full URL inventory.

### Database Query Optimization

- **Recommendations list (most frequent):** `SELECT * FROM keyword_opportunities WHERE user_id = ? AND status = 'open' ORDER BY priority_score DESC LIMIT 25`. Hits `idx_opportunities_user_score`. Expected: < 50ms.
- **Decay list:** `SELECT * FROM keyword_opportunities WHERE user_id = ? AND opportunity_type = 'decay' AND status = 'open' ORDER BY priority_score DESC`. Hits `idx_opportunities_user_type_status`. Expected: < 30ms.
- **Cannibalization list:** `SELECT * FROM cannibalization_conflicts WHERE user_id = ? AND resolution_status != 'resolved' ORDER BY total_impressions DESC`. Hits `idx_cannibalization_user_status`. Expected: < 20ms.
- **Heavy query (analysis run -- decay detection):** Aggregation across `performance_snapshots` for 180-day window. Uses Supabase RPC function to run server-side. Expected: < 5s for 10,000 URLs.

---

## 14. Dependencies

### Upstream (What This Service Needs)

- **Data Ingestion Service (Service #7):** The single most critical dependency. Intelligence reads from `content_inventory` (URL metadata, titles, publish dates, word counts), `performance_snapshots` (clicks, impressions, positions over time), and `api_cache` (Semrush gap data, Ahrefs authority data, Trends seasonal curves). Intelligence CANNOT function without Data Ingestion data. If Data Ingestion fails, Intelligence serves stale cached results with freshness warnings.
- **Auth & Bridge Server:** JWT authentication via `verifyAuth()` middleware. HTTP framework, CORS, rate limiting, request parsing. Intelligence endpoints are registered in `bridge/routes/intelligence.js` within the existing bridge server.
- **Supabase (PostgreSQL + Auth):** Database storage for `keyword_opportunities`, `analysis_runs`, `recommendation_history`, `cannibalization_conflicts`. RLS for multi-tenant isolation. Stored procedures for heavy aggregation queries (decay detection, cannibalization detection). Service_role key for analysis runner writes.
- **Claude CLI:** The Topic Recommender agent (`agents/topic-recommender.md`) is invoked via Claude CLI subprocess during Mode B analysis. Without Claude CLI, Mode B cannot generate title suggestions or evidence narratives. Fallback: use keywords as titles and auto-generate evidence from raw analysis data (mechanical but functional).
- **Gemini MCP:** Used by the Topic Recommender agent for supplementary research when gap data is thin. Optional -- the agent functions without it but produces less creative recommendations.

### Downstream (Who Depends on This Service)

- **Article Generation Pipeline (Layer 4):** When a recommendation is executed via `/api/intelligence/recommendations/:id/execute`, the pipeline receives the full intelligence context (gap evidence, competitor weaknesses, seasonal timing, SERP opportunity assessment). This context shapes the research-engine agent's focus and the article-architect's structure decisions. Without Intelligence, Mode B does not exist and the pipeline only operates in Mode A (user-provided keyword, no data-driven context).
- **Dashboard -- Opportunities Page:** Displays the scored recommendation list, decay alerts, cannibalization conflicts, and content calendar. The Opportunities page IS the primary visual representation of this service. Without Intelligence, the Opportunities page is empty.
- **Dashboard -- Content Health View:** Displays decay status per URL, health score trends, and refresh recommendations. Powered by Intelligence's decay detection results.
- **Feedback Loop (Layer 6):** Reads `recommendation_history` to compare predicted priority scores against actual article performance at 30/60/90 days post-publication. Uses accuracy data to recalibrate scoring weights per-client (BR-14). Without Intelligence producing scored predictions, the Feedback Loop has nothing to evaluate.
- **Voice Intelligence (Layer 3):** Receives recommended topics from Intelligence to match against appropriate writer personas. The topic's intent type and content format suggestion inform voice selection.

---

## 15. Testing Requirements

All tests use `node:test` runner. Located in `tests/intelligence/`.

### Decay Detection Tests (`tests/intelligence/decay-detector.test.js`)

| Test Name | What It Verifies |
|-----------|------------------|
| `test_click_decline_20pct_threshold_boundary` | Exactly 20% decline = `medium` severity. 19% = not flagged. 21% = `medium`. |
| `test_click_decline_50pct_is_critical` | 50%+ click decline classifies as `critical` severity |
| `test_click_decline_40pct_is_high` | 40-49% decline = `high` severity |
| `test_position_page1_to_page2_is_critical` | Position moving from 8 to 14 flags `critical` (page boundary crossed) |
| `test_position_page1_stable_not_flagged` | Position moving from 5 to 8 is NOT flagged (still page 1) |
| `test_position_page2_to_page3_is_high` | Position 15 to 25 = `high` (not critical, no page 1 boundary involved) |
| `test_content_age_bestof_6month_trigger` | "Best BMW Tuning 2025" article older than 6 months triggers age alert |
| `test_content_age_howto_12month_trigger` | "How to Replace HPFP" article older than 12 months triggers age alert |
| `test_content_age_evergreen_18month_trigger` | Untitled evergreen article triggers at 18 months |
| `test_content_age_recently_modified_suppresses` | 14-month-old how-to modified 2 months ago does NOT trigger age alert |
| `test_seasonal_override_suppresses_false_positive` | July traffic decline for "winter tires" article NOT flagged when Trends shows July is annual low |
| `test_seasonal_override_does_not_apply_without_trends` | Same scenario without Trends data: decay IS flagged (conservative) |
| `test_cannibalization_amplifies_severity` | URL losing traffic + another URL gaining for same query: severity bumped by 1 level |
| `test_refresh_decision_partial_for_mild_decay` | 25% decline + page 1 + 2000 words = `update_existing` (partial refresh) |
| `test_refresh_decision_full_rewrite_for_severe` | 45% decline + page 2 = `update_existing` (full rewrite) |
| `test_refresh_decision_redirect_for_dead` | 60% decline + page 3+ + <10 clicks + no backlinks = `redirect` |
| `test_refresh_decision_cannibalization_first` | Active cannibalization conflict overrides other refresh decisions |

### Gap Analysis Tests (`tests/intelligence/gap-analyzer.test.js`)

| Test Name | What It Verifies |
|-----------|------------------|
| `test_gap_detection_excludes_client_keywords` | Keywords client already ranks for (positions 1-100) are excluded from gaps |
| `test_gap_volume_filter_100_minimum` | Keywords with < 100 monthly volume are excluded |
| `test_gap_category_scoping` | Gap keywords outside the user-specified category are excluded (BR-09) |
| `test_gap_score_calculation` | Known inputs produce expected gap score (volume 5000, KD 30, 3 competitors) |
| `test_competitor_auto_detection` | With no user-specified competitors, top 5 by keyword overlap are selected from Semrush data |
| `test_gap_with_serp_features_bonus` | Keywords with featured_snippet opportunity receive bonus in gap score |

### Cannibalization Tests (`tests/intelligence/cannibalization.test.js`)

| Test Name | What It Verifies |
|-----------|------------------|
| `test_2_urls_3_shared_queries_flags_conflict` | Two URLs sharing 3+ queries with 50+ impressions each = conflict |
| `test_2_urls_2_shared_queries_no_flag` | Two URLs sharing only 2 queries = NOT flagged (below threshold) |
| `test_winner_is_highest_clicks` | URL with most clicks is classified as winner |
| `test_resolution_merge_for_similar_traffic` | Traffic ratio < 1.5x + same intent = merge recommendation |
| `test_resolution_redirect_for_dominant_winner` | Traffic ratio >= 3x + no backlinks on loser = redirect recommendation |
| `test_resolution_differentiate_for_different_intents` | Different intent types = differentiate recommendation |
| `test_resolution_deoptimize_for_same_intent_with_backlinks` | Same intent + loser has backlinks = deoptimize |
| `test_minimum_impressions_threshold_configurable` | Setting threshold to 100 filters out low-volume conflicts |
| `test_position_flipflop_detection` | Two URLs swapping positions 3+ times in 30 days = cannibalization signal |

### Seasonality Tests (`tests/intelligence/seasonality.test.js`)

| Test Name | What It Verifies |
|-----------|------------------|
| `test_approaching_peak_bonus_15` | Peak in 6 weeks = bonus 15 (approaching_peak tier) |
| `test_near_peak_bonus_10` | Peak in 3 weeks = bonus 10 (near_peak tier) |
| `test_early_bonus_5` | Peak in 12 weeks = bonus 5 (early tier) |
| `test_off_season_bonus_0` | Peak in 30 weeks = bonus 0 (off_season tier) |
| `test_evergreen_keyword_no_peak` | Flat Trends curve (no month >= 80%) = evergreen, bonus 0 |
| `test_no_trends_data_returns_neutral` | Missing Trends data returns normalized 50 (neutral), not 0 |
| `test_peak_month_identification_wraps_year` | If current month is November and peak is January, correctly calculates 8 weeks ahead (not -10 months) |

### Saturation Index Tests (`tests/intelligence/saturation.test.js`)

| Test Name | What It Verifies |
|-----------|------------------|
| `test_thin_results_low_saturation` | Top 10 avg word count 600 = low saturation score (high opportunity) |
| `test_deep_results_high_saturation` | Top 10 avg word count 3500 = high saturation score (hard) |
| `test_outdated_results_low_saturation` | Top 10 avg age 24 months = low saturation |
| `test_fresh_results_high_saturation` | Top 10 avg age 3 months = high saturation |
| `test_forum_dominance_reduces_saturation` | 4 forum results in top 10 significantly reduces saturation score |
| `test_high_da_increases_saturation` | Avg DA 70 = harder SERP |
| `test_score_clamped_0_to_100` | Extreme inputs do not produce scores outside 0-100 |

### Scoring Formula Tests (`tests/intelligence/scoring.test.js`)

| Test Name | What It Verifies |
|-----------|------------------|
| `test_all_components_max_produces_100` | All signals at 100 with default weights = 100 |
| `test_all_components_zero_produces_0` | All signals at 0 = 0 |
| `test_weights_sum_to_1` | 0.30 + 0.25 + 0.25 + 0.10 + 0.10 = 1.00 |
| `test_known_input_produces_expected_output` | Specific signal values produce a predictable score |
| `test_reweight_with_missing_gap` | Gap unavailable: impressions re-weighted to 0.40, decay to 0.33, etc. |
| `test_reweight_with_two_missing_components` | Only 3 components available: weights redistribute correctly |
| `test_reweight_never_sets_missing_to_zero` | Missing components do not penalize the score |
| `test_confidence_high_with_5_sources` | All 5 data sources = `high` confidence |
| `test_confidence_low_with_1_source` | Only GSC connected = `low` confidence |
| `test_new_article_decay_is_zero_not_missing` | NEW recommendations have decay = 0 (not reweighted -- 0 is a real value) |
| `test_refresh_article_gap_is_zero_not_missing` | REFRESH recommendations have gap = 0 (not reweighted) |

### Integration Tests (`tests/intelligence/pipeline.test.js`)

| Test Name | What It Verifies |
|-----------|------------------|
| `test_full_mode_b_run_produces_recommendations` | End-to-end: category input -> analysis run -> scored recommendations in database |
| `test_partial_run_on_missing_semrush` | Without Semrush data, run completes with partial analyses and reduced confidence |
| `test_deduplication_against_existing_inventory` | Recommendations do not include keywords already covered by healthy existing content |
| `test_deduplication_against_pipeline_queue` | Keywords currently being generated are excluded |
| `test_deduplication_against_recent_acceptances` | Keywords accepted in last 30 days are excluded |
| `test_dismissed_keywords_reappear_after_14_days` | Dismissed recommendations are eligible for re-recommendation after 14 days |
| `test_upsert_updates_existing_opportunities` | Second run for overlapping category updates scores, does not duplicate rows |
| `test_execute_creates_pipeline_job_with_context` | Executing a recommendation creates a pipeline job with full intelligence context |

### API Endpoint Tests (`tests/intelligence/api.test.js`)

| Test Name | What It Verifies |
|-----------|------------------|
| `test_recommendations_requires_auth` | GET /api/intelligence/recommendations returns 401 without Bearer token |
| `test_recommendations_pagination` | `page=2&per_page=10` returns correct offset |
| `test_recommendations_filter_by_type` | `type=decay` returns only decay opportunities |
| `test_recommendations_filter_by_status` | `status=open` returns only open opportunities |
| `test_recommendations_sort_by_score` | Default sort is priority_score DESC |
| `test_patch_valid_status_transition` | `open` -> `accepted` succeeds |
| `test_patch_invalid_status_transition` | `completed` -> `accepted` returns 400 |
| `test_run_rate_limit_5_per_day` | 6th run in 24 hours returns 429 |
| `test_run_concurrent_prevention` | Second run while first is active returns 409 |
| `test_rls_prevents_cross_user_access` | User A cannot see User B's recommendations (404, not 403) |
| `test_cannibalization_resolve_updates_status` | POST resolve with valid strategy updates conflict record |
| `test_calendar_respects_capacity` | Calendar with capacity=2 schedules at most 2 items per week |

---

## Files

| File | Purpose |
|------|---------|
| `bridge/intelligence/decay-detector.js` | Content decay detection -- 4 methods (click decline, position drop, content age, cannibalization amplifier) |
| `bridge/intelligence/gap-analyzer.js` | Keyword gap analysis -- competitor detection, category scoping, gap scoring |
| `bridge/intelligence/cannibalization.js` | URL cannibalization detection -- 3 detection methods, 4 resolution strategies, intent classification |
| `bridge/intelligence/seasonality.js` | Seasonality model -- Trends integration, peak timing, seasonal bonus, decay false-positive suppression |
| `bridge/intelligence/saturation.js` | Saturation index -- SERP quality/freshness/authority scoring, competition assessment |
| `bridge/intelligence/scoring.js` | Priority scoring formula -- 5-component normalization, re-weighting, confidence calculation |
| `bridge/intelligence/runner.js` | Analysis run orchestrator -- 9-step pipeline, incremental analysis, partial failure handling, result storage |
| `bridge/intelligence/calendar.js` | Content calendar generator -- time-phased scheduling from scored recommendations |
| `bridge/routes/intelligence.js` | API endpoints -- recommendations CRUD, decay, gaps, cannibalization, runs, calendar |
| `agents/topic-recommender.md` | AI agent prompt -- Mode B orchestration, title generation, evidence narrative synthesis |
| `migrations/010-keyword-opportunities.sql` | keyword_opportunities table + RLS + indexes (shared with Data Ingestion) |
| `migrations/011-analysis-runs.sql` | analysis_runs table + RLS |
| `migrations/012-recommendation-history.sql` | recommendation_history table + RLS |
| `migrations/013-cannibalization-conflicts.sql` | cannibalization_conflicts table + RLS |

---

## Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Full analysis run completion rate | >= 95% (partial or complete) | `(completed + partial) / total` from analysis_runs |
| Analysis run duration (< 1K URLs) | <= 30 seconds | `duration_ms` from analysis_runs |
| Analysis run duration (1K-10K URLs) | <= 60 seconds | `duration_ms` from analysis_runs |
| Recommendation acceptance rate | >= 30% of open recommendations | `accepted / open` from keyword_opportunities per 30-day window |
| Recommendation-to-article conversion | >= 50% of accepted | `in_pipeline / accepted` from keyword_opportunities |
| Decay detection precision | >= 80% true positives | Manual review audit against GSC data |
| Cannibalization detection precision | >= 75% true positives | Manual review of flagged conflicts |
| Scoring recalibration frequency | Quarterly | Layer 6 feedback loop triggers weight adjustment |
| API response time (GET /recommendations) | <= 200ms | Measured against 10K+ recommendation sets |
| API response time (POST /run) | Immediate (< 500ms) | Returns run_id immediately; analysis runs async |
| Data freshness for scoring | <= 48 hours (GSC/GA4), <= 7 days (Semrush/Ahrefs/Trends) | `now() - max(snapshot_date)` per source |
| Nightly scheduled run completion | >= 99% | Scheduled runs at 04:00 UTC complete without manual intervention |
