# Success Metrics — ChainIQ KPIs by Phase

**Purpose:** Define measurable success criteria for each phase of ChainIQ development
**Review cadence:** Weekly during active development, monthly after phase completion
**Data sources:** Supabase analytics, Google Cloud Console, Hetzner monitoring, Stripe billing, client feedback

---

## North Star Metric

**Recommendation Accuracy Rate (RAR):** The percentage of ChainIQ content recommendations that produce measurable positive outcomes (traffic increase, ranking improvement, or engagement lift) within 90 days of article publication.

This single metric captures the full pipeline's effectiveness: data ingestion quality, intelligence engine accuracy, content generation quality, and publishing success. When RAR is high, clients see value, retention increases, and revenue grows. When RAR is low, the entire product promise fails.

**Target trajectory:**
- Phase A: Not measurable (no articles published yet)
- Phase B: Baseline measurement begins (first published articles)
- Phase C: RAR >= 50% (at least half of recommendations produce positive outcomes)
- Phase D: RAR >= 65% (recalibration engine improving predictions)
- Phase E: RAR >= 75% (12+ months of feedback data driving accuracy)

**Measurement method:** For each recommendation that results in a published article, compare the article's 90-day performance (traffic, ranking, engagement) against the prediction made at recommendation time. A "positive outcome" is defined as achieving >= 60% of the predicted traffic target within 90 days.

---

## Leading vs Lagging Indicators

### Leading Indicators (Predict Future Success)

These metrics change before business outcomes change. Watch them weekly to catch problems early.

| Indicator | What It Predicts | Warning Threshold |
|-----------|-----------------|-------------------|
| Daily data freshness (hours since last GSC/GA4 pull) | Pipeline reliability; stale data = bad recommendations | > 48 hours |
| Quality gate pass rate (% of articles scoring > 75 on first draft) | Content generation quality; low pass rate = excessive revision costs | < 40% |
| Auto-revision improvement delta (average score increase per revision) | Revision loop effectiveness; low delta = wasted API credits | < 5 points |
| OAuth token refresh success rate | Data pipeline continuity; failures = data gaps | < 95% |
| Time-to-first-recommendation (hours from connection to first scored recommendation) | Onboarding speed; slow = client frustration | > 72 hours |
| API cost per article (Claude + Semrush + Ahrefs) | Margin health; rising costs = profitability risk | > $15 per article |

### Lagging Indicators (Confirm Past Success)

These metrics confirm whether the platform delivered value. Review monthly.

| Indicator | What It Confirms | Target |
|-----------|-----------------|--------|
| Client retention rate (monthly) | Platform delivers sustained value | > 90% |
| Net Revenue Retention (NRR) | Clients expand usage over time | > 110% |
| Recommendation Accuracy Rate (North Star) | Intelligence engine is correct | > 65% by Phase D |
| Average client quality score improvement (Month 1 vs Month 6) | Quality gate raises content standards over time | > 15 points |
| Published articles per client per month | Platform is actively used, not shelved | > 10 |
| Client NPS score | Overall satisfaction | > 40 |

---

## Phase A Metrics (Weeks 1-6): Foundation + Data Ingestion

### KPIs

| # | KPI | Baseline | Target | Measurement Method | Review Cadence |
|---|-----|----------|--------|-------------------|----------------|
| A1 | Infrastructure uptime | 0% (not deployed) | 99.5% | Uptime Kuma monitoring on Hetzner, /health endpoint pings every 5 minutes | Daily |
| A2 | Google OAuth consent screen submission | Not submitted | Submitted Day 1, verified by Week 8 | Google Cloud Console status | Weekly |
| A3 | Data freshness (hours since last successful GSC/GA4 pull) | N/A | < 24 hours for all connected accounts | `last_successful_pull` timestamp in `client_connections` table | Daily |
| A4 | Content inventory coverage (% of client URLs crawled) | 0% | > 90% of sitemap URLs crawled within 48 hours of connection | `content_inventory` row count vs sitemap URL count | Weekly |
| A5 | Decay detection alert count | 0 | > 5 meaningful decay alerts per connected domain | `keyword_opportunities` table where type = 'decay' | Weekly |
| A6 | Test coverage for new backend modules | 0% | > 80% line coverage | `node:test` coverage report | Per sprint |
| A7 | Security hardening checklist completion | 0/5 | 5/5 (CORS, rate limiting, token encryption, RLS, HTTPS) | Manual checklist verification | End of Sprint 1 |
| A8 | Scheduler reliability (% of scheduled pulls that succeed) | N/A | > 95% over 7 consecutive days | Success/failure logging in scheduler module | Daily after Sprint 3 |

### Phase A Technical Health Metrics

| Metric | Target | Why It Matters |
|--------|--------|---------------|
| server.js line count after refactor | < 400 lines | Confirms route splitting was effective |
| Largest single route module | < 300 lines | Prevents new monolith formation |
| Database migration execution time | < 30 seconds total | Validates schema design efficiency |
| performance_snapshots query time (1M rows) | < 500ms for date-range queries | Validates partitioning strategy |
| Bridge server cold start time | < 3 seconds | Ensures fast recovery after Coolify restart |

---

## Phase B Metrics (Weeks 7-14): Intelligence + Quality Gate + Publishing

### KPIs

| # | KPI | Baseline (end of Phase A) | Target | Measurement Method | Review Cadence |
|---|-----|--------------------------|--------|-------------------|----------------|
| B1 | Quality gate pass rate (% of articles scoring > 75 on first draft) | N/A | > 40% | Quality score API logs: count(score > 75) / count(total) | Weekly |
| B2 | Auto-revision improvement (average score delta) | N/A | > 10 points average improvement | Compare pre-revision and post-revision quality scores | Weekly |
| B3 | WordPress publishing success rate | 0% | > 95% (articles successfully created as drafts in WordPress) | Publishing module success/failure logs | Weekly |
| B4 | Topic Recommender output volume | 0 | > 20 scored recommendations per connected domain | `keyword_opportunities` table count by type | Weekly |
| B5 | End-to-end pipeline completion rate | 0% | > 80% (recommendations that complete the full pipeline without manual intervention) | Pipeline execution logs: started vs completed | Weekly |
| B6 | Cannibalization detection accuracy | Unknown | > 70% confirmed by human review (sample 20 alerts) | Manual audit of 20 cannibalization alerts against actual SERP data | End of Phase B |
| B7 | Time from recommendation to published draft | N/A | < 30 minutes (automated pipeline) | Timestamp delta: recommendation.approved_at to article.published_at | Weekly |
| B8 | SRMG pilot satisfaction score | N/A | > 7/10 on structured feedback survey | Client feedback survey (5 questions, 1-10 scale) | End of Phase B |

### Phase B Content Quality Metrics

| Metric | Target | Why It Matters |
|--------|--------|---------------|
| Average quality score (all generated articles) | > 70/100 | Platform produces consistently good content |
| E-E-A-T score average | > 22/30 | Content meets Google quality guidelines |
| SEO checklist pass rate (60 checks) | > 50/60 checks passing | Technical SEO fundamentals are covered |
| Articles requiring 0 revisions | > 30% | First-draft quality is improving |
| Articles requiring 2 revisions (max) | < 15% | Most articles need at most 1 revision |

---

## Phase C Metrics (Weeks 15-22): Voice Intelligence + Universal Publishing

### KPIs

| # | KPI | Baseline (end of Phase B) | Target | Measurement Method | Review Cadence |
|---|-----|--------------------------|--------|-------------------|----------------|
| C1 | Voice analysis spike accuracy | Unknown | > 75% classification accuracy on 100-article test corpus | Spike test results: blind article author prediction accuracy | Sprint 8 (one-time gate) |
| C2 | Voice profile confidence (% of personas with > 30 articles) | 0% | > 60% of generated personas have high confidence rating | `writer_personas` table: count(articles_analyzed >= 30) / count(total) | Bi-weekly |
| C3 | Voice match score average (generated articles) | 70/100 (placeholder) | > 75/100 (real stylometric scoring) | Quality gate voice signal average | Weekly |
| C4 | CMS publishing success rate (all platforms combined) | WordPress only | > 95% across WordPress + Shopify + Ghost | Publishing module logs per CMS platform | Weekly |
| C5 | Client count | 1 (SRMG) | 5-10 active clients | Billing system (Stripe) active subscriptions | Monthly |
| C6 | Monthly Recurring Revenue (MRR) | ~$5K (SRMG pilot) | $25K-$50K | Stripe MRR dashboard | Monthly |
| C7 | Arabic content quality score parity | Unknown | Arabic articles score within 5 points of English articles on average | Quality score comparison: Arabic vs English articles | Monthly |
| C8 | Bulk publishing throughput | 1 article at a time | 10 articles per batch without failures | Bulk publishing job completion logs | Weekly |

### Phase C Voice Intelligence Metrics

| Metric | Target | Why It Matters |
|--------|--------|---------------|
| Writer clustering silhouette score | > 0.5 | Clusters are meaningful, not random |
| AI detection score average (ChainIQ articles) | > 60/100 (pass as human-sounding) | Generated content does not trigger AI detection |
| Client persona approval rate (% accepted without edits) | > 50% | Automated persona generation is useful, not just noise |
| Voice profile generation time | < 5 minutes per corpus | Acceptable wait time for editorial teams |

---

## Phase D Metrics (Weeks 23-30): Feedback Loop + Polish

### KPIs

| # | KPI | Baseline (end of Phase C) | Target | Measurement Method | Review Cadence |
|---|-----|--------------------------|--------|-------------------|----------------|
| D1 | Recommendation Accuracy Rate (North Star) | First measurement | > 65% | Prediction vs actual comparison at 90-day mark | Monthly |
| D2 | Prediction deviation (average % difference from actual) | Unknown | < 35% deviation | Accuracy scoring module: mean(abs(predicted - actual) / predicted) | Monthly |
| D3 | Recalibration impact (accuracy improvement after first recalibration cycle) | Pre-recalibration baseline | > 5 percentage points accuracy improvement | Compare RAR before and after first recalibration | After each recalibration cycle |
| D4 | Client retention rate (monthly) | Unknown | > 90% | Stripe: (clients at end of month - new clients) / clients at start of month | Monthly |
| D5 | Net Revenue Retention (NRR) | 100% (no expansion yet) | > 110% (clients upgrading tiers) | Stripe: current MRR from cohort / MRR at cohort start | Monthly |
| D6 | Content ROI (average across all clients) | Unknown | > 200% (content value exceeds 2x generation cost) | ROI calculation module: mean(traffic_value / generation_cost) | Monthly |
| D7 | Performance alert accuracy (% of alerts that identify real issues) | Unknown | > 80% | Manual audit of 20 performance alerts against actual performance data | Monthly |
| D8 | Monthly Recurring Revenue (MRR) | $25K-$50K | $75K-$150K | Stripe MRR dashboard | Monthly |

### Phase D Feedback Loop Health Metrics

| Metric | Target | Why It Matters |
|--------|--------|---------------|
| Articles with 90-day performance data | > 100 | Sufficient sample for recalibration statistical significance |
| Recalibration weight stability (max weight change per cycle) | < 10% | Prevents overcorrection; weights converge over time |
| Churn prediction accuracy (% of flagged articles that actually decline) | > 60% | Proactive intelligence is trustworthy |
| Time from publish to first performance snapshot | < 31 days | Feedback loop latency is minimal |
| Client-facing report generation time | < 30 seconds | Reports are usable in client meetings |

---

## Cross-Phase Platform Adoption Metrics

These metrics track overall platform health across all phases.

| Metric | Phase A Target | Phase B Target | Phase C Target | Phase D Target |
|--------|---------------|---------------|---------------|---------------|
| Active connected domains | 1 | 2-3 | 5-10 | 15-25 |
| Total articles generated | 0 | 20-50 | 100-300 | 500-1,000 |
| Total articles published via ChainIQ | 0 | 10-30 | 50-200 | 300-700 |
| Average articles per client per month | 0 | 5-10 | 10-20 | 15-30 |
| Dashboard daily active users | 1 (developer) | 3-5 | 10-25 | 30-75 |
| API requests per day | < 100 | 500-2,000 | 2,000-10,000 | 10,000-50,000 |
| Database size (Supabase) | < 100MB | 500MB-1GB | 1-3GB | 3-8GB |
| Monthly infrastructure cost | $34 | $60-$100 | $150-$300 | $300-$600 |

---

## Revenue Metrics Tracking

| Metric | Phase A | Phase B | Phase C | Phase D |
|--------|---------|---------|---------|---------|
| MRR | $0 (pre-revenue) | $5K (SRMG pilot) | $25K-$50K | $75K-$150K |
| Active paying clients | 0 | 1 | 5-10 | 15-25 |
| Average Revenue Per Client (ARPC) | N/A | $5,000 | $4,000-$5,000 | $5,000-$6,000 |
| Gross margin | N/A | ~60% | 55-62% | 58-65% |
| Client Acquisition Cost (CAC) | N/A | $0 (direct) | < $5,000 | < $5,000 |
| Lifetime Value (LTV) estimate | N/A | Unknown | $36K-$60K (12-month) | $60K-$120K (24-month) |
| LTV:CAC ratio | N/A | Infinite (no CAC) | > 7:1 | > 12:1 |
| Monthly churn rate | N/A | 0% | < 10% | < 5% |

---

## Metric Review Protocol

### Weekly Review (During Active Development)
- Check all leading indicators against warning thresholds
- Review infrastructure uptime and data freshness
- Check scheduler reliability
- Flag any metric that crossed a warning threshold

### Monthly Review (Ongoing)
- Full KPI dashboard review for current phase
- Compare actuals against targets
- Update revenue metrics
- Client feedback synthesis
- Adjust targets if baseline data reveals original targets were unrealistic

### Phase Gate Review (At Each Phase Completion)
- All phase KPIs scored green/yellow/red
- Decision: proceed to next phase, extend current phase, or pivot
- Gate criteria: 80% of KPIs must be green (meeting target) or yellow (within 20% of target) to proceed
- Any red KPI (> 20% below target) requires a documented remediation plan before proceeding

### Quarterly Business Review
- Full metric stack review across all phases
- Revenue trajectory vs projection
- Client retention and expansion analysis
- Competitive positioning assessment
- Roadmap adjustment based on metric trends
