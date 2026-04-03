# FL-002: Intelligence Recalibration Engine

> **Phase:** 10 | **Priority:** P1 | **Status:** NOT STARTED
> **Effort:** L (10h) | **Type:** feature
> **Sprint:** 10 (Weeks 19-20)
> **Backlog Items:** Feedback Loop — Scoring Weight Recalibration
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `PROJECT-BRIEF.md` — Section "Layer 6: Feedback Loop" and Section "Layer 2: Content Intelligence" scoring formula
3. `bridge/intelligence/performance-tracker.js` — prediction vs actual data from FL-001
4. `bridge/server.js` — endpoint patterns, auth middleware
5. `supabase-setup.sql` — schema reference (PROTECTED)

## Objective
Build the recalibration engine that adjusts the topic recommender's scoring weights based on prediction accuracy data. When predictions consistently over- or under-estimate for certain factors, the engine shifts weights to improve future accuracy. This is admin-triggered with a dry-run mode for safety. Weight bounds (0.05-0.40) prevent any single factor from dominating or becoming negligible.

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `bridge/intelligence/recalibration.js` | Recalibration engine — weight adjustment, error analysis, dry-run simulation |
| MODIFY | `bridge/server.js` | Add `/api/feedback/recalibrate` admin endpoint |
| CREATE | `tests/recalibration.test.js` | Unit and integration tests |

## Sub-tasks

### Sub-task 1: Current Scoring Model Reference (~1h)
- Document the current topic recommender scoring formula (from PROJECT-BRIEF.md):
  ```
  priority = (impressions * 0.30) + (decay_severity * 0.25) + (gap_size * 0.25) + (seasonality_bonus * 0.10) + (competition_inverse * 0.10)
  ```
- 5 factors with weights summing to 1.0:
  - `impressions_weight`: 0.30 (default)
  - `decay_weight`: 0.25 (default)
  - `gap_weight`: 0.25 (default)
  - `seasonality_weight`: 0.10 (default)
  - `competition_weight`: 0.10 (default)
- Weight bounds: minimum 0.05, maximum 0.40 per factor
- Weights stored in a `scoring_config` row in user_settings or a dedicated config table
- Create a `ScoringConfig` helper in `recalibration.js` to load/save weights

### Sub-task 2: Error Analysis Engine (~3h)
- Create `analyzeErrors(userId)` function in `bridge/intelligence/recalibration.js`
- Collect all completed prediction records (status = 'complete') for the user
- Minimum 10 completed predictions required for recalibration (statistical minimum)
- **Per-prediction error decomposition:**
  - For each completed prediction, determine which factors contributed most to the error:
  - If an article was recommended primarily due to high impressions but underperformed: impressions weight is too high
  - If decay-targeted refreshes consistently outperform: decay weight should increase
  - Map each prediction to its dominant recommendation factor (the factor that contributed most to its priority score)
  - Calculate average accuracy per dominant factor:
    ```javascript
    factorAccuracy = {
      impressions: { avgAccuracy: 72, count: 15, trend: 'stable' },
      decay: { avgAccuracy: 88, count: 8, trend: 'improving' },
      gap: { avgAccuracy: 65, count: 12, trend: 'declining' },
      seasonality: { avgAccuracy: 91, count: 5, trend: 'stable' },
      competition: { avgAccuracy: 58, count: 6, trend: 'declining' }
    }
    ```
- **Trend detection:**
  - Compare accuracy of recent predictions (last 30 days) vs older predictions
  - If recent accuracy is improving: the current weight is working, reduce adjustment magnitude
  - If declining: increase adjustment magnitude

### Sub-task 3: Weight Adjustment Algorithm (~3h)
- Create `calculateNewWeights(currentWeights, factorAccuracy)` function
- **Adjustment logic:**
  1. Calculate accuracy deviation from target (target = 80% accuracy):
     ```
     deviation[factor] = (factorAccuracy[factor].avgAccuracy - 80) / 100
     ```
  2. Adjustment magnitude: `adjustment = deviation * learningRate`
     - Learning rate: 0.05 (conservative — small changes per recalibration)
     - Factors with higher accuracy get a weight boost, lower accuracy get a reduction
  3. Apply adjustments:
     ```
     newWeight[factor] = currentWeight[factor] + adjustment[factor]
     ```
  4. Clamp to bounds: `max(0.05, min(0.40, newWeight[factor]))`
  5. Normalize: ensure all weights sum to 1.0 (proportionally scale after clamping)
- **Confidence gating:**
  - Factors with < 5 completed predictions: skip adjustment (insufficient data)
  - Factors with 5-10 predictions: apply 50% of calculated adjustment
  - Factors with > 10 predictions: apply full adjustment
- **Safety rails:**
  - Maximum change per recalibration: +/- 0.05 per factor
  - If no factor has accuracy < 60%: skip recalibration (system is performing well)
  - Log every weight change with timestamp, old value, new value, reason

### Sub-task 4: Dry-Run Mode (~1.5h)
- `recalibrate(userId, options)` function with `options.dryRun = true|false`
- **Dry-run mode (default):**
  - Run full analysis and weight calculation
  - DO NOT save new weights to database
  - Return comparison report:
    ```javascript
    {
      dryRun: true,
      currentWeights: { impressions: 0.30, decay: 0.25, gap: 0.25, seasonality: 0.10, competition: 0.10 },
      proposedWeights: { impressions: 0.28, decay: 0.27, gap: 0.23, seasonality: 0.12, competition: 0.10 },
      changes: [
        { factor: 'impressions', from: 0.30, to: 0.28, reason: 'Accuracy below target (72% vs 80%)' },
        { factor: 'decay', from: 0.25, to: 0.27, reason: 'Accuracy above target (88% vs 80%)' },
        ...
      ],
      factorAccuracy: { ... },
      predictionsAnalyzed: 46,
      confidenceLevel: 'high', // based on prediction count
      recommendation: 'Apply changes — overall accuracy expected to improve by ~4%'
    }
    ```
- **Live mode (dryRun = false):**
  - Run dry-run first, then save new weights
  - Create a recalibration history record (for rollback)
  - Store in `user_settings` or dedicated `scoring_config` table
  - Return same report with `applied: true`
- **Rollback:** Store previous weights in history, allow admin to revert to any previous configuration

### Sub-task 5: Admin Endpoint (~1.5h)
- Add `POST /api/feedback/recalibrate` to `bridge/server.js`
  - Auth required + admin role verification
  - Body: `{ userId?: string, dryRun?: boolean }` (userId optional — admin can recalibrate any user, defaults to self)
  - Process:
    1. Load current scoring weights for user
    2. Analyze prediction errors
    3. Calculate proposed weight adjustments
    4. If dryRun (default true): return report only
    5. If dryRun = false: save weights, create history record, return report
  - Response: full recalibration report (see dry-run output above)
  - Error cases:
    - 400 if < 10 completed predictions (insufficient data)
    - 400 if no factors need adjustment (system already accurate)
    - 403 if non-admin tries to recalibrate another user
- Add `GET /api/feedback/recalibration-history` — list past recalibrations
  - Auth required
  - Returns: `{ history: [{ date, oldWeights, newWeights, predictionsAnalyzed, accuracyImprovement }] }`
- Rate limited: max 1 recalibration per user per 24 hours

## Testing Strategy

### Unit Tests (`tests/recalibration.test.js`)
- Test error analysis with known accuracy data — verify factor accuracy averages
- Test weight adjustment: high-accuracy factor gets weight boost
- Test weight adjustment: low-accuracy factor gets weight reduction
- Test weight bounds enforced (never below 0.05 or above 0.40)
- Test weights normalized to sum to 1.0 after adjustment
- Test maximum change cap (+/- 0.05 per factor per recalibration)
- Test confidence gating: < 5 predictions = skip, 5-10 = half adjustment
- Test dry-run returns report without saving
- Test minimum 10 predictions requirement
- Test no-change scenario when all factors are accurate

### Integration Tests
- Test `/api/feedback/recalibrate` with dryRun=true returns report
- Test `/api/feedback/recalibrate` with dryRun=false saves new weights
- Test recalibration history endpoint returns past changes
- Test admin-only access enforcement
- Test rate limit: second recalibration within 24h rejected
- Test rollback to previous weights

## Acceptance Criteria
- [ ] Error analysis computes per-factor accuracy from completed predictions
- [ ] Weight adjustment algorithm with 0.05 learning rate and +/- 0.05 max change per factor
- [ ] Weight bounds enforced: 0.05-0.40 per factor, sum normalized to 1.0
- [ ] Confidence gating: insufficient data factors skipped or half-adjusted
- [ ] Dry-run mode returns full report without saving changes
- [ ] Live mode saves weights and creates history record for rollback
- [ ] `/api/feedback/recalibrate` endpoint with admin auth and dry-run default
- [ ] Recalibration history stored and queryable
- [ ] Rate limited to 1 recalibration per user per 24 hours
- [ ] Minimum 10 completed predictions required
- [ ] All tests pass (`npm test`)

## Dependencies
- Blocked by: FL-001 (performance tracker with completed predictions)
- Blocks: FL-003 (dashboard performance page shows recalibration status)
