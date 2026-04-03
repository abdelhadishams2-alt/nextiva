# ChainIQ Analytics-to-Financial Mapping

**Last Updated:** 2026-03-28
**Source:** Analytics event taxonomy, success metrics, project overview (business model), financial projections
**Audience:** Product (strategy), Engineering (implementation validation), Finance (metric definitions)
**Purpose:** Map every conversion event to its corresponding financial model metric, define calculation methods, set targets, and establish review cadence

---

## Why This Mapping Exists

Analytics without financial context is noise. ChainIQ tracks 49 events across 10 categories, but only 8 of those events directly move the financial model. This document defines the exact relationship between each conversion event and the financial metric it drives.

Every metric in the financial model must be traceable to a specific PostHog event. Every PostHog conversion event must map to a specific financial metric. If an event exists without a financial counterpart, it is an engagement metric (useful for product, not for revenue forecasting). If a financial metric exists without an event counterpart, it is unmeasurable (a gap that must be closed).

---

## Mapping Table (Summary)

| # | Event | Financial Metric | Direction | Review |
|---|-------|-----------------|-----------|--------|
| 1 | `signup_completed` | VISITOR_TO_SIGNUP_RATE | Leading | Weekly |
| 2 | `connection_added` | SIGNUP_TO_ACTIVE_RATE | Leading | Weekly |
| 3 | `article_generation_completed` | ARTICLES_PER_CLIENT_PER_MONTH | Usage | Monthly |
| 4 | `subscription_started` | SIGNUP_TO_PAID_RATE | Leading | Monthly |
| 5 | `plan_upgraded` | UPGRADE_RATE | Expansion | Monthly |
| 6 | `subscription_cancelled` | CHURN_RATE | Lagging | Monthly |
| 7 | `recommendation_accepted` | RECOMMENDATION_ACCEPTANCE_RATE | Value | Weekly |
| 8 | `performance_check_completed` | PREDICTION_ACCURACY | North Star | Monthly |

---

## Mapping 1: signup_completed to VISITOR_TO_SIGNUP_RATE

**Event:** `signup_completed`
**Financial Metric:** `VISITOR_TO_SIGNUP_RATE`
**Metric Type:** Leading indicator -- predicts future revenue pipeline volume.

**Calculation:**

```
VISITOR_TO_SIGNUP_RATE = COUNT(signup_completed) / COUNT(DISTINCT sessions with page_view on marketing site)
                        over trailing 30 days
```

The denominator is unique sessions that viewed at least one marketing page (landing page, pricing page, features page). The numerator is completed signups in the same period. This excludes dashboard sessions from existing users.

**Data Sources:**
- Numerator: PostHog event `signup_completed` (count, 30-day rolling window)
- Denominator: PostHog event `page_view` where `path` matches marketing routes (`/`, `/pricing`, `/features`, `/blog/*`) -- count of distinct `session_id`

**Target Values:**

| Phase | Target | Rationale |
|-------|--------|-----------|
| Phase A | Not measured (no marketing site) | Pre-launch |
| Phase B | 2-5% | Industry average for B2B SaaS landing pages |
| Phase C | 5-8% | Optimized with social proof from SRMG pilot |
| Phase D | 8-12% | Mature funnel with case studies and testimonials |

**Review Cadence:** Weekly during active growth, monthly during steady state.

**Financial Impact:** Each 1% increase in VISITOR_TO_SIGNUP_RATE, assuming 1,000 monthly marketing visitors and a 10% signup-to-paid rate at $5,000 ARPC, adds $5,000 monthly pipeline value. At scale (10,000 visitors), each 1% = $50,000 pipeline.

---

## Mapping 2: connection_added to SIGNUP_TO_ACTIVE_RATE

**Event:** `connection_added`
**Financial Metric:** `SIGNUP_TO_ACTIVE_RATE`
**Metric Type:** Leading indicator -- measures activation quality. A user who connects data is "active" because they have committed their credentials and are invested in the platform.

**Calculation:**

```
SIGNUP_TO_ACTIVE_RATE = COUNT(DISTINCT users with at least 1 connection_added within 7 days of signup)
                        / COUNT(signup_completed)
                        over trailing 30 days
```

The 7-day window is critical. Users who do not connect a data source within 7 days of signup have a historically low probability of ever becoming paying customers (industry benchmark: < 5% conversion for B2B SaaS users who do not activate in Week 1).

**Data Sources:**
- Numerator: PostHog event `connection_added` -- count of distinct `user_id_hash` where `connection_added.timestamp - signup_completed.timestamp <= 7 days`
- Denominator: PostHog event `signup_completed` (count, same 30-day window)

**Target Values:**

| Phase | Target | Rationale |
|-------|--------|-----------|
| Phase A | 80%+ | Early users are hand-held through onboarding |
| Phase B | 60-70% | Self-serve onboarding begins; expect drop |
| Phase C | 50-60% | Scaled acquisition brings lower-intent signups |
| Phase D | 55-65% | Onboarding optimization recovers some activation |

**Review Cadence:** Weekly. This is the highest-leverage metric for product-led growth.

**Financial Impact:** A 10% improvement in SIGNUP_TO_ACTIVE_RATE (e.g., 50% to 60%) directly increases the number of users who reach the "first value" moment. Assuming 100 signups/month and a 20% active-to-paid rate at $5,000 ARPC, this improvement adds $100,000 annual pipeline.

**Alert Threshold:** If SIGNUP_TO_ACTIVE_RATE drops below 40%, trigger an emergency product review of the onboarding flow and connection setup UX.

---

## Mapping 3: article_generation_completed to ARTICLES_PER_CLIENT_PER_MONTH

**Event:** `article_generation_completed`
**Financial Metric:** `ARTICLES_PER_CLIENT_PER_MONTH`
**Metric Type:** Usage metric -- measures platform consumption. Higher usage correlates with higher retention and expansion revenue (clients who generate more articles are more likely to upgrade).

**Calculation:**

```
ARTICLES_PER_CLIENT_PER_MONTH = COUNT(article_generation_completed)
                                 / COUNT(DISTINCT user_id_hash with at least 1 article_generation_completed)
                                 over trailing 30 days
```

This is a per-active-client metric, not per-total-client. Clients who generated zero articles in the period are excluded from the denominator to avoid skewing the average downward.

**Data Sources:**
- Numerator: PostHog event `article_generation_completed` (count, 30-day rolling)
- Denominator: PostHog event `article_generation_completed` (count of distinct `user_id_hash`, same window)

**Target Values:**

| Tier | Target Articles/Month | Rationale |
|------|----------------------|-----------|
| Creator | 5-10 | Capped generation; solo operator |
| Growth | 10-20 | Small team, multiple client sites |
| Professional | 15-30 | Active content program |
| Agency | 30-60 | Managing 5-10 client sites |
| Enterprise | 50-100+ | Large-scale publishing operation (SRMG) |

**Cross-Phase Targets (from success-metrics.md):**

| Phase | Target | Source |
|-------|--------|--------|
| Phase B | 5-10 per client | Cross-phase adoption metrics |
| Phase C | 10-20 per client | Cross-phase adoption metrics |
| Phase D | 15-30 per client | Cross-phase adoption metrics |

**Review Cadence:** Monthly, segmented by tier.

**Financial Impact:** Articles per client is the primary usage metric that justifies tier pricing. A client generating 50 articles/month on a Creator plan ($149-199/month) is severely underpriced and is a prime upgrade candidate. This metric feeds the `plan_upgraded` conversion funnel.

**Derived Metric:** `API_COST_PER_ARTICLE` = SUM(`article_generation_completed.api_cost_cents`) / COUNT(`article_generation_completed`). Target: < $15 (1500 cents). This is the primary variable cost driver in the per-client economics model.

---

## Mapping 4: subscription_started to SIGNUP_TO_PAID_RATE

**Event:** `subscription_started`
**Financial Metric:** `SIGNUP_TO_PAID_RATE`
**Metric Type:** Leading indicator -- the critical conversion from free/trial user to paying customer. This is the single most important financial metric for revenue forecasting.

**Calculation:**

```
SIGNUP_TO_PAID_RATE = COUNT(DISTINCT users with subscription_started within 30 days of signup)
                      / COUNT(signup_completed)
                      over trailing 60-day cohort window
```

The 30-day conversion window accounts for trial periods and evaluation cycles. The 60-day cohort window provides enough sample size for statistical significance.

**Data Sources:**
- Numerator: PostHog event `subscription_started` -- count of distinct `user_id_hash` where `subscription_started.timestamp - signup_completed.timestamp <= 30 days`
- Denominator: PostHog event `signup_completed` (count, cohort window)

**Target Values:**

| Phase | Target | Rationale |
|-------|--------|-----------|
| Phase B | 5-10% | First self-serve conversions; SRMG is direct sale |
| Phase C | 10-15% | Product-market fit signals emerging |
| Phase D | 15-25% | Mature product with proven ROI data |

**Review Cadence:** Monthly. Cohort analysis (by signup month) rather than rolling average.

**Financial Impact:** This is the multiplier on the entire revenue model. At 100 signups/month:
- 10% conversion = 10 new clients x $5,000 ARPC = $50,000 new MRR
- 20% conversion = 20 new clients x $5,000 ARPC = $100,000 new MRR

Each percentage point of SIGNUP_TO_PAID_RATE improvement = $5,000 incremental MRR at 100 signups/month scale.

---

## Mapping 5: plan_upgraded to UPGRADE_RATE

**Event:** `plan_upgraded`
**Financial Metric:** `UPGRADE_RATE`
**Metric Type:** Expansion indicator -- measures Net Revenue Retention (NRR) contribution. Upgrades are the primary driver of NRR > 100%, which is the hallmark of a healthy SaaS business.

**Calculation:**

```
UPGRADE_RATE = COUNT(plan_upgraded)
               / COUNT(active subscriptions at start of period)
               over trailing 90 days
```

The 90-day window smooths seasonal variation and provides enough events for tier-level analysis.

**Data Sources:**
- Numerator: PostHog event `plan_upgraded` (count, 90-day rolling)
- Denominator: Active subscriptions at period start (from Stripe via PostHog `subscription_started` minus `subscription_cancelled`)

**Upgrade Paths (with typical triggers):**

| From | To | Typical Trigger | Expected Rate |
|------|----|----------------|---------------|
| Creator | Growth | Exceeds generation cap, needs multi-CMS | 15-20% within 6 months |
| Growth | Professional | Needs voice intelligence, team seats | 10-15% within 6 months |
| Professional | Agency | Adds client workspaces, needs white-label | 5-10% within 12 months |
| Agency | Enterprise | Needs SSO, custom integrations, SLA | 3-5% within 12 months |

**Target Values:**

| Phase | Target (quarterly) | Rationale |
|-------|-------------------|-----------|
| Phase C | 10-15% | Early clients exploring features |
| Phase D | 15-25% | Mature feature set drives natural expansion |

**Review Cadence:** Monthly.

**Financial Impact:** Upgrades contribute to NRR without acquisition cost. A client upgrading from Growth ($500-800/month) to Professional ($3,000/month) adds $2,200-2,500 incremental MRR with zero CAC. The success-metrics.md targets NRR > 110%, which requires upgrade revenue to exceed churn revenue by at least 10%.

---

## Mapping 6: subscription_cancelled to CHURN_RATE

**Event:** `subscription_cancelled`
**Financial Metric:** `CHURN_RATE`
**Metric Type:** Lagging indicator -- confirms whether the product retains value over time. High churn invalidates the entire LTV model.

**Calculation:**

```
CHURN_RATE = COUNT(subscription_cancelled)
             / COUNT(active subscriptions at start of month)
             over calendar month
```

Logo churn (client count), not revenue churn. Revenue churn is calculated separately as `REVENUE_CHURN = SUM(cancelled_subscription_values) / MRR_at_start_of_month`.

**Data Sources:**
- Numerator: PostHog event `subscription_cancelled` (count, calendar month)
- Denominator: Active subscriptions at month start (Stripe)
- Enrichment: `subscription_cancelled.reason` for churn reason analysis

**Target Values (from success-metrics.md):**

| Phase | Target (monthly) | Rationale |
|-------|-----------------|-----------|
| Phase B | 0% | Only 1 client (SRMG direct relationship) |
| Phase C | < 10% | Early scaling; some trial clients will churn |
| Phase D | < 5% | Product-market fit confirmed; retention stabilizes |

**Review Cadence:** Monthly. Reason breakdown reviewed quarterly.

**Financial Impact:** At $50K MRR, each 1% monthly churn = $500/month revenue loss = $6,000/year. At $150K MRR, each 1% = $1,500/month = $18,000/year. Reducing monthly churn from 8% to 4% at $100K MRR saves $48,000/year.

**Churn Reason Analysis:** The `subscription_cancelled.reason` property enables cohort analysis by churn reason. The top 3 reasons guide product investment:

| Reason | Product Response |
|--------|-----------------|
| `too_expensive` | Review pricing vs value delivery per tier |
| `not_enough_value` | Investigate ARTICLES_PER_CLIENT_PER_MONTH and PREDICTION_ACCURACY for churned cohort |
| `switched_competitor` | Competitive analysis -- which competitor, which features |

---

## Mapping 7: recommendation_accepted to RECOMMENDATION_ACCEPTANCE_RATE

**Event:** `recommendation_accepted`
**Financial Metric:** `RECOMMENDATION_ACCEPTANCE_RATE`
**Metric Type:** Value metric -- measures the intelligence layer's usefulness. This is the "what to write" metric that differentiates ChainIQ from article generators. If clients ignore recommendations, the intelligence layer (Layers 1-2) is failing.

**Calculation:**

```
RECOMMENDATION_ACCEPTANCE_RATE = COUNT(recommendation_accepted)
                                  / COUNT(recommendations_generated.count SUM)
                                  over trailing 30 days, per client
```

Denominator is the total number of individual recommendations generated (the `count` property summed across all `recommendations_generated` events), not the number of generation events.

**Data Sources:**
- Numerator: PostHog event `recommendation_accepted` (count, 30-day rolling)
- Denominator: PostHog event `recommendations_generated` (SUM of `count` property, same window)
- Segmentation: By `recommendation_accepted.type` (decay_refresh, keyword_gap, new_topic, etc.)

**Target Values:**

| Phase | Target | Rationale |
|-------|--------|-----------|
| Phase B | 20-30% | First recommendations; clients learning to trust |
| Phase C | 30-45% | Improved scoring from initial feedback data |
| Phase D | 45-60% | Recalibrated scoring produces highly relevant recommendations |

**Review Cadence:** Weekly.

**Financial Impact:** RECOMMENDATION_ACCEPTANCE_RATE is a proxy for perceived intelligence value. Clients who accept > 40% of recommendations are:
- 2x more likely to upgrade (hypothesis, validate with PostHog correlation)
- 3x less likely to churn (hypothesis, validate with PostHog cohort analysis)
- The strongest signal of product-market fit for the intelligence layer

If this metric stagnates below 25%, the intelligence layer is failing its core promise and the product must invest in scoring algorithm improvement before growth investment.

**Type Breakdown Target:** Track acceptance rate per recommendation type to identify which intelligence features produce the most actionable output:

| Type | Expected Acceptance Rate |
|------|------------------------|
| `decay_refresh` | 50-70% (urgent, data-obvious) |
| `keyword_gap` | 30-50% (requires trust in opportunity scoring) |
| `seasonal_opportunity` | 40-60% (time-sensitive, clear ROI) |
| `new_topic` | 20-35% (requires most trust in intelligence) |
| `cannibalization_fix` | 35-50% (technical, but data-backed) |

---

## Mapping 8: performance_check_completed to PREDICTION_ACCURACY

**Event:** `performance_check_completed`
**Financial Metric:** `PREDICTION_ACCURACY`
**Metric Type:** North Star quality metric -- the single most important metric for long-term platform value. This is the Recommendation Accuracy Rate (RAR) defined in success-metrics.md.

**Calculation:**

```
PREDICTION_ACCURACY = COUNT(performance_check_completed WHERE outcome IN ('exceeded_prediction', 'met_prediction'))
                      / COUNT(performance_check_completed WHERE check_day = '90')
                      over all-time per client (rolling)
```

Only 90-day checks count for the official PREDICTION_ACCURACY metric. 30-day and 60-day checks are leading indicators but are not included in the North Star calculation because content often takes 60-90 days to reach steady-state performance.

A "positive outcome" (met or exceeded prediction) is defined as achieving >= 60% of the predicted traffic target within 90 days (per success-metrics.md).

**Data Sources:**
- Numerator: PostHog event `performance_check_completed` where `check_day = '90'` AND `outcome` IN (`exceeded_prediction`, `met_prediction`)
- Denominator: PostHog event `performance_check_completed` where `check_day = '90'` (all outcomes)
- Enrichment: `accuracy_score` (0-100) for continuous accuracy measurement beyond binary pass/fail

**Target Values (from success-metrics.md):**

| Phase | Target | Rationale |
|-------|--------|-----------|
| Phase B | Baseline measurement | First articles published, no 90-day data yet |
| Phase C | >= 50% | At least half of recommendations produce positive outcomes |
| Phase D | >= 65% | Recalibration engine actively improving predictions |
| Phase E | >= 75% | 12+ months of feedback data driving accuracy |

**Review Cadence:** Monthly (limited by 90-day lag before data is available).

**Financial Impact:** PREDICTION_ACCURACY is the data moat. It has three financial effects:

1. **Retention:** Clients who see their predictions confirmed are dramatically less likely to churn. Each 10% improvement in accuracy correlates with an estimated 15-20% reduction in churn (hypothesis, validate at Phase D).

2. **Pricing power:** A platform that proves its recommendations work commands premium pricing. If ChainIQ can demonstrate >= 65% accuracy, it justifies the $3,000-$12,000/month pricing against competitors who offer no prediction accountability.

3. **Competitive moat:** After 12 months of prediction-outcome data, ChainIQ's per-client calibration is unreplicable by a competitor launching later. This accumulated data is worth more than the code itself.

**Derived Metrics:**

| Derived Metric | Calculation | Use |
|---------------|-------------|-----|
| `PREDICTION_DEVIATION` | MEAN(ABS(predicted_traffic - actual_traffic) / predicted_traffic) | Continuous accuracy (lower is better) |
| `RECALIBRATION_IMPACT` | POST_accuracy - PRE_accuracy per cycle | Measures whether recalibration actually helps |
| `TIME_TO_ACCURATE` | Number of recalibration cycles before accuracy > 65% | Measures how fast the system learns per client |

---

## Cross-Metric Dependencies

The financial metrics form a dependency chain. Improving an upstream metric cascades to downstream metrics:

```
VISITOR_TO_SIGNUP_RATE
  |
  v
SIGNUP_TO_ACTIVE_RATE (connection_added within 7 days)
  |
  v
RECOMMENDATION_ACCEPTANCE_RATE (intelligence value)
  |
  v
ARTICLES_PER_CLIENT_PER_MONTH (usage volume)
  |
  v
SIGNUP_TO_PAID_RATE (conversion to paid)
  |
  v
UPGRADE_RATE (expansion revenue)        CHURN_RATE (retention)
  |                                       |
  +------- PREDICTION_ACCURACY -----------+
           (the moat that drives both
            expansion and retention)
```

PREDICTION_ACCURACY sits at the bottom of the chain because it takes the longest to measure (90-day minimum) but has the largest compounding impact. It is both the hardest metric to improve and the most valuable.

---

## Review Schedule Summary

| Cadence | Metrics Reviewed | Owner |
|---------|-----------------|-------|
| Weekly | VISITOR_TO_SIGNUP_RATE, SIGNUP_TO_ACTIVE_RATE, RECOMMENDATION_ACCEPTANCE_RATE | Product |
| Monthly | SIGNUP_TO_PAID_RATE, UPGRADE_RATE, CHURN_RATE, ARTICLES_PER_CLIENT_PER_MONTH, PREDICTION_ACCURACY | Product + Finance |
| Quarterly | All metrics + LTV:CAC ratio + NRR + cohort analysis | Executive |

---

## Alert Thresholds

| Metric | Red Alert (Immediate Action) | Yellow Alert (Investigate) |
|--------|------------------------------|---------------------------|
| SIGNUP_TO_ACTIVE_RATE | < 30% | < 45% |
| SIGNUP_TO_PAID_RATE | < 5% | < 10% |
| CHURN_RATE (monthly) | > 10% | > 6% |
| RECOMMENDATION_ACCEPTANCE_RATE | < 15% | < 25% |
| PREDICTION_ACCURACY | < 40% (Phase D+) | < 55% (Phase D+) |
| ARTICLES_PER_CLIENT_PER_MONTH | < 3 (any tier) | < 5 (Professional+) |

Alerts are configured in PostHog as saved insights with threshold-based notifications. Alert delivery: Slack webhook to `#chainiq-metrics` channel.
