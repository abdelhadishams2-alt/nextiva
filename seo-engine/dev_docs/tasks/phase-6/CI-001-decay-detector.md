# CI-001: Content Decay Detector

> **Phase:** 6 | **Priority:** P0 | **Status:** NOT STARTED
> **Effort:** L (12h) | **Type:** feature
> **Sprint:** 4 (Weeks 7-8)
> **Depends On:** DI-002 (GSC data in performance_snapshots), DI-004 (content_inventory table), DI-005 (scheduled snapshot history)
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `dev_docs/services/content-intelligence.md` — Decay Detector module spec, detection methods, severity classification
3. `dev_docs/services/data-ingestion.md` — PerformanceSnapshot entity, health score calculation, status classification
4. `PROJECT-BRIEF.md` — Section 4, Layer 2 (Content Decay Detection description), Section "Content Decay Detection (Port from Master Kit 36-seo)"
5. `bridge/supabase-client.js` — database operations pattern
6. Reference (external): Master Kit `36-seo/content-seo/content-decay-refresh.md` — original decay logic to port

## Objective
Build the content decay detection engine that analyzes performance_snapshots data to identify content with declining traffic, rankings, or engagement. Port the decay detection logic from Master Kit 36-seo, implementing three detection methods (click decline, position tracking, content age audit). Classify every content item as HEALTHY, DECAYING, DECLINING, or DEAD, update the `content_inventory` status field, and expose results via an API endpoint.

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `bridge/intelligence/decay-detector.js` | Decay detection engine with 3 detection methods and severity classification |
| MODIFY | `bridge/server.js` | Register endpoints: `GET /api/intelligence/decay`, `GET /api/intelligence/decay/:contentId` |

## Sub-tasks

### Sub-task 1: Implement GSC click/impression decline detection (~3h)
- **`detectClickDecline(userId)`** — Method 1 from content-intelligence.md:
  - Query `performance_snapshots` for the user: compare the last 90-day window against the preceding 90-day window (days 91-180)
  - For each URL, compute: `clickChangePct = (currentClicks - previousClicks) / previousClicks`
  - Similarly compute `impressionChangePct` for impressions
  - Flag URLs where `clickChangePct <= -0.20` (20% or greater decline)
  - Classify severity:
    - `critical`: 50%+ decline
    - `high`: 40-50% decline
    - `medium`: 20-40% decline
    - `low`: <20% decline (not flagged but tracked)
  - Use Supabase query with aggregation — group by `(user_id, url)`, filter by date ranges, compute sums
  - Minimum threshold: only flag URLs with >= 100 clicks in the previous window (avoid noise from low-traffic pages)

### Sub-task 2: Implement ranking position tracking (~2h)
- **`detectPositionDrop(userId)`** — Method 2:
  - Compare average position in last 30 days vs previous 30 days (days 31-60)
  - Detect page boundary crossings: position 1-10 (page 1) → 11-20 (page 2) is critical
  - Flag: `pageBoundaryCrossed: true` when floor(previousPosition/10) < floor(currentPosition/10)
  - Severity based on position change magnitude:
    - `critical`: moved from page 1 to page 3+ (position went from <10 to >20)
    - `high`: moved from page 1 to page 2 (position went from <10 to 11-20)
    - `medium`: position dropped 3+ spots but stayed on same page
    - `low`: position dropped 1-2 spots
  - Track position trend direction: `improving`, `stable`, `declining`, `collapsed`

### Sub-task 3: Implement content age audit (~2h)
- **`detectContentAge(userId)`** — Method 3:
  - Load all content_inventory items for user with their `publish_date`
  - Apply age triggers based on content type detection:
    - "Best of" / "Top X" / listicle patterns: 6-month trigger
    - "How-to" / tutorial / guide patterns: 12-month trigger
    - Evergreen / reference content: 18-24 month trigger
  - Content type detection: analyze title and URL patterns for keywords like "best", "top", "how to", "guide", "tutorial", "review", year numbers (2024, 2025)
  - Flag URLs where `monthsSincePublish >= ageThreshold`
  - Age-triggered content gets a decay signal even if traffic is stable — preemptive refresh indicator
  - Store `content_type`, `age_trigger_months`, and `age_triggered` in analysis metadata

### Sub-task 4: Build classification engine and status updater (~3h)
- **`classifyContent(userId)`** — Combine all three detection methods:
  - Run `detectClickDecline()`, `detectPositionDrop()`, `detectContentAge()` in sequence
  - For each URL, merge results from all methods into a composite assessment
  - Apply classification rules from `data-ingestion.md`:
    - `HEALTHY`: health_score >= 70 AND no decay signals from any method
    - `DECAYING`: health_score 40-69 OR 3-month click decline >= 20%
    - `DECLINING`: health_score 20-39 OR 3-month click decline >= 40%
    - `DEAD`: health_score < 20 OR zero clicks for 60+ days
  - Determine recommended action from PROJECT-BRIEF.md refresh decision matrix:
    - `partial_refresh`: 10-40% decline, still page 1-2
    - `full_rewrite`: 50%+ decline or page 3+
    - `retire_301`: traffic < 10/month AND no backlinks
    - `monitor`: age-triggered only, traffic still stable
  - Update `content_inventory.status` field for each URL
  - Build trend_data arrays: last 3 months of monthly click/impression data per URL for visualization
- **`runDecayAnalysis(userId)`** — Top-level orchestrator:
  - Calls `classifyContent(userId)`
  - Returns full results with per-URL decay details
  - Logs analysis timing and result counts with structured logger

### Sub-task 5: Register API endpoints (~2h)
- **`GET /api/intelligence/decay`** — Authenticated. Returns all content items with active decay signals for the user:
  - Response: `{ decaying_content: [...], total: N }` matching the format in content-intelligence.md
  - Each item includes: `content_id`, `url`, `title`, `severity`, `click_change_3mo`, `impression_change_3mo`, `position_change`, `page_boundary_crossed`, `content_age_months`, `content_type`, `age_trigger`, `recommended_action`, `trend_data` (3 months)
  - Supports query params: `?severity=critical,high&sort=click_change_asc&page=1&per_page=25`
- **`GET /api/intelligence/decay/:contentId`** — Authenticated. Returns detailed decay analysis for a single content item including full trend data, all three detection method results, and recommended action with justification.
- Rate limit both endpoints (standard rate limiter bucket)

## Acceptance Criteria
- [ ] Click decline detection flags URLs with 20%+ drop over 3-month rolling window
- [ ] Severity classification is correct: critical (50%+), high (40-50%), medium (20-40%)
- [ ] Position tracking detects page boundary crossings (page 1→2 is critical)
- [ ] Content age audit applies correct thresholds: listicles 6mo, how-to 12mo, evergreen 18-24mo
- [ ] Status classification correctly assigns HEALTHY/DECAYING/DECLINING/DEAD
- [ ] Recommended action matches the refresh decision matrix (partial, full rewrite, retire, monitor)
- [ ] `content_inventory.status` is updated after each analysis run
- [ ] `GET /api/intelligence/decay` returns decay list with severity, trends, and recommendations
- [ ] `GET /api/intelligence/decay/:contentId` returns full detail for a single item
- [ ] Low-traffic pages (< 100 clicks in baseline) are excluded from click decline flagging
- [ ] Trend data includes 3 months of monthly click/impression data for visualization
- [ ] Zero npm dependencies

## Test Requirements

### Unit Tests
- Click decline: 25% drop correctly classified as `medium`, 45% as `high`, 55% as `critical`
- Click decline: URL with 50 clicks in baseline window is excluded (below 100 threshold)
- Position drop: move from position 8 to 12 flags `pageBoundaryCrossed: true`
- Position drop: move from position 3 to 5 is `medium` (same page, 2+ spot drop)
- Content age: title "Best BMW Tuning Platforms 2024" triggers 6-month threshold
- Content age: title "How to Replace N54 HPFP" triggers 12-month threshold
- Classification: health_score 65 with 22% click decline = DECAYING
- Classification: health_score 15 = DEAD regardless of other signals
- Recommended action: 35% decline on page 1 = `partial_refresh`, 55% decline on page 3 = `full_rewrite`

### Integration Tests
- Full analysis run with sample performance_snapshots data → correct status updates in content_inventory
- API endpoint returns correctly formatted response matching content-intelligence.md spec
- Decay detail endpoint returns full trend data for a specific content item

## Dependencies
- Blocked by: DI-002 (GSC snapshots), DI-004 (content_inventory), DI-005 (historical snapshot accumulation)
- Blocks: CI-003 (topic recommender uses decay signals in scoring formula), CI-005 (dashboard decay alerts tab)
