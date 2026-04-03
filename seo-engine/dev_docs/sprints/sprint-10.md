# Sprint 10: Feedback Loop

> **Weeks:** 19-20 | **Capacity:** ~40h (20h/week) | **Committed:** 30h
> **Theme:** Close the loop -- track published article performance and recalibrate scoring

---

## Sprint Goal

Complete the platform with the feedback loop: track published articles at 30/60/90 day intervals, compare predicted vs. actual performance, recalibrate the topic recommender's scoring weights, and deliver the Performance dashboard with exportable reports.

---

## Task List

| ID | Task | Effort | Phase | Dependencies | Priority |
| --- | --- | --- | --- | --- | --- |
| FL-001 | 30/60/90 Day Performance Tracker | L (12h) | P10 - Feedback Loop | DI-002 (GSC), DI-003 (GA4), PB-002+ (published articles) | P1 |
| FL-002 | Scoring Weight Recalibration Engine | L (10h) | P10 - Feedback Loop | FL-001 (accuracy data), CI-003 (scoring formula) | P1 |
| FL-003 | Dashboard: Performance Page + Reports | L (8h) | P10 - Feedback Loop | FL-001, FL-002 (performance + recalibration data) | P1 |

### Execution Strategy

- FL-001 builds the tracking infrastructure first -- FL-002 and FL-003 depend on it
- FL-002 can start once FL-001 has the prediction/actual comparison logic working
- FL-003 can start once FL-001 data format is finalized
- Recommended order: FL-001 (Days 1-5) -> FL-002 (Days 4-7) -> FL-003 (Days 7-10)

---

## Database Migrations

| Migration | Tables | Source |
| --- | --- | --- |
| 016 | performance_predictions, scoring_weight_history | unified-schema.md 3.21-3.22 |
| 017 | performance_reports | unified-schema.md 3.23 |

---

## Key Deliverables

After this sprint, the developer can:

1. **Record predictions at publish time** -- expected clicks, impressions, position at 30/60/90 day marks
2. **Track actual performance** -- GSC/GA4 snapshots collected at each interval automatically
3. **Compare predicted vs. actual** -- accuracy scores calculated per metric (clicks 40%, impressions 35%, position 25%)
4. **View pending predictions** -- articles awaiting their 30/60/90 day milestones shown with countdown
5. **Run recalibration (dry-run)** -- see proposed weight changes without saving to production
6. **Apply recalibration** -- adjust scoring weights with learning rate 0.05, bounds 0.05-0.40, sum normalized to 1.0
7. **View Performance page** -- summary cards, timeline chart, predictions DataTable with accuracy badges
8. **Export reports** -- HTML report with inline CSS (branded, printable) and JSON export

---

## Exit Criteria

All must pass before Sprint 10 is marked complete:

- [ ] Predictions recorded automatically at article publish time with 30/60/90d targets
- [ ] GSC snapshots collected at each interval (cron job or scheduler integration)
- [ ] Accuracy scores calculated: per-metric (clicks, impressions, position) and composite
- [ ] Accuracy badge logic: GREEN (>80%), YELLOW (60-80%), RED (<60%)
- [ ] Migration 016 creates performance_predictions and scoring_weight_history tables
- [ ] Migration 017 creates performance_reports table
- [ ] Recalibration dry-run shows proposed weight changes without saving
- [ ] Recalibration apply enforces weight bounds (0.05-0.40) and normalizes sum to 1.0
- [ ] Learning rate capped at 0.05 per recalibration cycle
- [ ] Minimum 10 completed predictions required before recalibration is allowed
- [ ] Performance page shows predicted vs actual with accuracy badges and trend lines
- [ ] Timeline chart shows article performance over 90 days with milestone markers
- [ ] HTML report generated with inline CSS, ChainIQ branding, print-friendly layout
- [ ] JSON export includes all prediction, actual, and accuracy data

---

## Risk Flags

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Insufficient completed predictions for recalibration | High | Medium | Minimum 10 required; unlikely to have 10 by Week 20; show "insufficient data" state |
| 30-day accuracy data not available until Week 24+ | Certain | Low | Dashboard shows "pending" status for predictions not yet due; test with synthetic data |
| Recalibration produces worse scoring weights | Low | High | Dry-run mode mandatory before apply; weight history allows rollback |
| Performance tracker GSC data mismatch with published URLs | Medium | Medium | Normalize URLs (strip trailing slash, www/non-www) before matching |

---

## Handoff Notes (Post-Expansion)

Sprint 10 is the final sprint of the platform expansion. After completion:

- **All 26 tasks across Phases 5-10 are complete**
- **23 new database tables** created (32 total including Phase 0-4)
- **7 new dashboard pages** delivered
- **Platform is ready for production use** with the following caveats:
  - Recalibration will be meaningful only after 10+ articles have passed their 30-day milestone
  - First real accuracy data arrives at Week 24 (4 weeks after first article published in Week 20)
  - Semrush/Ahrefs enrichment is optional and depends on client API subscriptions
  - Google OAuth verification should be submitted for production approval (>100 users)

### Recommended Post-Expansion Activities

1. **Week 21-22:** Hardening sprint -- fix bugs found during Weeks 19-20, performance optimization
2. **Week 23-24:** First client onboarding with full platform
3. **Week 25-26:** First recalibration cycle with real 30-day data
4. **Week 27+:** Feature iteration based on client feedback
