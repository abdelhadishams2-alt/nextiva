# ChainIQ Post-Launch Metrics Dashboard

> Defines the key performance indicators (KPIs), targets, measurement methods, and alerting thresholds for monitoring ChainIQ platform health and growth post-launch.

---

## Metrics Philosophy

Every metric tracked must satisfy at least one of these criteria:
1. **Actionable** — A change in the metric triggers a specific response
2. **Revenue-correlated** — The metric is a leading or lagging indicator of revenue
3. **Quality-indicative** — The metric reflects content output quality or platform reliability

Vanity metrics (page views without context, total signups without activation) are tracked but not displayed on the primary dashboard.

---

## 1. User Engagement Metrics

### 1.1 Daily Active Users (DAU)

| Period | Target | Stretch Goal |
|--------|--------|-------------|
| Month 1 | 10 DAU | 15 DAU |
| Month 3 | 25 DAU | 40 DAU |
| Month 6 | 50 DAU | 80 DAU |
| Month 12 | 150 DAU | 250 DAU |

**Definition:** A unique user who performs at least one meaningful action (article generation, content edit, brief creation, analytics review) in a 24-hour period. Login alone does not count.

**Measurement:** Supabase query on `user_actions` table, deduplicated by `user_id` per UTC day.

**Alert threshold:** DAU drops below 50% of trailing 7-day average for 3 consecutive days.

### 1.2 Monthly Active Users (MAU)

| Period | Target | Stretch Goal |
|--------|--------|-------------|
| Month 1 | 15 MAU | 25 MAU |
| Month 3 | 40 MAU | 60 MAU |
| Month 6 | 80 MAU | 120 MAU |
| Month 12 | 250 MAU | 400 MAU |

**Definition:** Unique users with at least one meaningful action in a 30-day rolling window.

**DAU/MAU ratio target:** 0.3+ (indicates strong daily engagement, not just monthly check-ins).

### 1.3 Retention Rate

| Metric | Target | Measurement |
|--------|--------|-------------|
| Week 1 retention | 70% | % of new users who return in days 2-7 |
| Month 1 retention | 60% | % of users active in month N who are active in month N+1 |
| Month 3 retention | 80% | Stabilized monthly retention for users past the 90-day mark |
| 12-month retention | 85% | Annual retention for established users |

**Cohort analysis:** Track retention by signup cohort (monthly cohorts) to identify if onboarding improvements are working.

**Churn alert:** If any monthly cohort shows retention < 50% at 30 days, trigger an immediate investigation (survey churned users, review onboarding funnel).

---

## 2. Product Usage Metrics

### 2.1 Article Generation Volume

| Period | Target | Stretch Goal |
|--------|--------|-------------|
| Month 1 | 100 articles | 200 articles |
| Month 3 | 500 articles | 1,000 articles |
| Month 6 | 2,000 articles | 5,000 articles |
| Month 12 | 10,000 articles | 25,000 articles |

**Breakdown tracked:**
- Articles per user per month (engagement depth)
- Articles by language (Arabic vs English vs other — validates Arabic-first thesis)
- Articles by tier (Starter vs Professional vs Enterprise — informs tier feature allocation)
- Articles by generation method (full auto vs brief-to-article vs edit-assist)

**Alert:** If daily article volume drops > 30% from trailing 7-day average (may indicate pipeline failure).

### 2.2 Time-to-First-Article (TTFA)

**Definition:** Elapsed time from user signup completion to their first successfully generated article.

| Target | Stretch Goal |
|--------|-------------|
| < 30 minutes | < 15 minutes |

**Why this matters:** TTFA is the strongest predictor of long-term retention. Users who generate their first article within 30 minutes of signup retain at 3x the rate of those who take longer than 24 hours.

**Measurement:** Timestamp delta between `users.created_at` and first entry in `articles.created_at` for each user.

**Improvement levers:**
- Onboarding wizard that guides to first article generation
- Pre-populated templates and example briefs
- "Generate your first article" CTA on empty dashboard state
- Reduce pipeline execution time (target < 90 seconds for standard article)

### 2.3 Edit Usage Rate

**Definition:** Percentage of generated articles that are edited by the user before finalizing.

| Metric | Target | Interpretation |
|--------|--------|---------------|
| Edit rate | 40-60% | Healthy — users refine AI output to match their needs |
| Edit rate < 20% | Investigate | Either articles are perfect (unlikely) or users aren't engaging deeply |
| Edit rate > 80% | Investigate | Articles may be low quality, requiring too much manual editing |

**Edit depth tracking:**
- Light edits (< 10% of content changed): Suggests high quality baseline
- Medium edits (10-30%): Healthy refinement
- Heavy edits (> 30%): Quality issue — trigger content quality review

### 2.4 Feature Adoption Rates

Track percentage of MAU who use each major feature:

| Feature | Month 1 Target | Month 6 Target |
|---------|---------------|---------------|
| Article generation | 90% | 95% |
| Content briefs | 50% | 70% |
| Keyword research | 40% | 60% |
| Content editor | 60% | 75% |
| Analytics/reporting | 20% | 50% |
| Voice matching | 10% | 40% |
| Bulk generation | 5% | 25% |

Features with < 10% adoption after 3 months are candidates for UX redesign or deprecation.

---

## 3. Platform Reliability Metrics

### 3.1 Error Rate Budget

**Budget:** < 0.1% of all API requests result in 5xx errors.

| Metric | Target | Alert Threshold | Critical Threshold |
|--------|--------|----------------|-------------------|
| 5xx error rate | < 0.1% | > 0.5% (15-min window) | > 2% (5-min window) |
| 4xx error rate | < 5% | > 10% (may indicate breaking client changes) | > 20% |
| Timeout rate | < 0.05% | > 0.2% | > 1% |

**Error budget consumption:** If the monthly error budget (0.1%) is consumed before month-end, freeze all non-critical deployments and focus on stability.

**Error categorization:**
- Pipeline errors (agent failures during article generation)
- Infrastructure errors (database connection, Redis timeouts)
- Integration errors (Stripe webhook failures, external API timeouts)
- Client errors (invalid input, auth failures — tracked but don't consume error budget)

### 3.2 Uptime

| Metric | Target |
|--------|--------|
| Monthly uptime | 99.9% (allows ~43 minutes downtime/month) |
| Annual uptime | 99.95% |

**UptimeRobot monitors:**
- Bridge server `/health` — 1-minute intervals
- Dashboard root page — 1-minute intervals
- API article generation endpoint — 5-minute synthetic test
- Supabase database connectivity — 5-minute intervals

### 3.3 Response Time (Latency)

| Endpoint | P50 Target | P95 Target | P99 Target |
|----------|-----------|-----------|-----------|
| Dashboard page load | < 1.5s | < 3s | < 5s |
| API health check | < 50ms | < 100ms | < 200ms |
| Article generation | < 60s | < 120s | < 180s |
| Content brief creation | < 5s | < 10s | < 15s |
| Keyword research query | < 3s | < 8s | < 12s |
| User authentication | < 500ms | < 1s | < 2s |

**Alert:** Any endpoint P95 exceeding 2x its target for 15+ minutes.

---

## 4. Business Metrics

### 4.1 Revenue KPIs

| Metric | Month 1 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| MRR | $3K | $20K | $60K |
| Paying customers | 1 | 5-8 | 15-20 |
| ARPU (avg revenue per user) | $3,000 | $3,500 | $4,000 |
| Annual contract value (ACV) | $36K | $42K | $48K |
| Churn rate (monthly) | < 5% | < 3% | < 2% |

### 4.2 Conversion Funnel

| Stage | Target Conversion |
|-------|------------------|
| Website visit to signup | 5% |
| Signup to first article (activation) | 60% |
| Activation to paid (within 14-day trial) | 30% |
| Trial to paid conversion | 25% |
| Monthly to annual upgrade | 40% (by month 6) |

### 4.3 Customer Health Score

Composite score per customer (0-100) based on:
- **Usage frequency** (25%): DAU ratio, login frequency
- **Feature breadth** (25%): Number of distinct features used
- **Article volume** (25%): Articles generated relative to tier allowance
- **Support sentiment** (25%): NPS score, support ticket frequency and tone

| Score Range | Health | Action |
|-------------|--------|--------|
| 80-100 | Healthy | Upsell opportunities, case study candidate |
| 60-79 | At risk | Proactive check-in, feature training offer |
| 40-59 | Unhealthy | Urgent outreach, executive sponsor engagement |
| 0-39 | Churning | Emergency intervention, exit interview if churning |

---

## 5. Dashboard Implementation

### Primary Dashboard (Daily View)
Display on a single screen:
- DAU (today vs 7-day average)
- Articles generated today
- Error rate (current 1-hour window)
- Active alerts count
- TTFA for today's signups

### Weekly Dashboard
- DAU/MAU trend chart (4-week rolling)
- Article volume by language (stacked bar)
- Retention cohort heatmap
- Top errors by category
- Feature adoption rates

### Monthly Dashboard
- MRR trend
- Customer health score distribution
- Conversion funnel with week-over-week comparison
- NPS score (if survey was conducted)
- Error budget consumption gauge

### Tooling
- **Metrics collection:** Custom events logged to Supabase `analytics_events` table
- **Dashboard rendering:** Built into ChainIQ admin dashboard (Next.js + Recharts)
- **Alerting:** UptimeRobot for uptime, Sentry for errors, custom webhook alerts for business metrics
- **Reporting:** Automated weekly email digest with key metrics to founder

---

## 6. Metric Review Cadence

| Cadence | Metrics Reviewed | Action |
|---------|-----------------|--------|
| Daily | DAU, error rate, article volume, active alerts | Quick scan, respond to alerts |
| Weekly | Retention, TTFA, feature adoption, conversion funnel | Triage feedback, prioritize fixes |
| Monthly | MRR, churn, NPS, customer health, error budget | Strategic decisions, roadmap adjustments |
| Quarterly | TAM penetration, competitive positioning, annual targets | Business review, pricing review |

---

*Last updated: 2026-03-28*
*Review cadence: Monthly*
*Owner: Chain Reaction SEO — ChainIQ Platform*
