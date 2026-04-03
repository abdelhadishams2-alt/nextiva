# ChainIQ Unit Economics

> **Created:** 2026-03-28
> **Model:** Per-client economics across three subscription tiers
> **Basis:** ChainIQ infrastructure costs, MENA market acquisition channels, and SaaS retention benchmarks
> **Review cadence:** Monthly for first 6 months, then quarterly

---

## Customer Acquisition Cost (CAC)

CAC for ChainIQ is unusually low because the solo developer operates Chain Reaction SEO, an existing agency with established MENA publisher relationships. The initial client pipeline is warm leads, not paid acquisition.

### CAC by Channel

| Channel | Cost Components | CAC Estimate | Expected Volume |
|---------|----------------|-------------|-----------------|
| **Warm network** (existing clients) | Time investment: 4-8 hours of demos/calls per close. No paid marketing. Opportunity cost of consulting hours (~$150/hr) | $600-$1,200 | First 5-8 clients |
| **Referrals** | $0 paid referral fee (initial policy). Time: 2-4 hours per referred lead | $300-$600 | 3-5 clients/year |
| **Cold outreach** (LinkedIn, email) | Time: 15-20 hours per close (research, personalization, follow-ups, demos). LinkedIn Sales Navigator: $100/mo amortized | $2,250-$3,100 | 5-10 clients/year |
| **Inbound** (content marketing, SEO) | Content creation time: 8 hours/month. Domain/hosting: amortized $5/mo. Time per inbound close: 4-6 hours | $1,500-$2,000 | 3-8 clients/year after month 6 |
| **Conferences** (MENA media events) | ArabNet, STEP, Dubai Lynx: $2,000-5,000/event (travel + ticket). 1-2 closes per event | $1,500-$3,000 | 2-4 clients/year |

### Blended CAC by Phase

| Phase | Months | Primary Channel | Blended CAC |
|-------|--------|----------------|-------------|
| Launch | 1-3 | Warm network | $800 |
| Growth | 4-8 | Warm + referrals + cold outreach | $1,500 |
| Scale | 9-12 | Cold outreach + inbound + referrals | $2,000 |
| Mature | 13+ | Inbound-heavy mix | $1,800 |

**Weighted average CAC (12-month): $1,400** (heavily weighted toward low-cost warm leads in early months).

---

## Lifetime Value (LTV)

LTV is calculated as: **Average Monthly Revenue x Gross Margin x Average Customer Lifetime (months)**.

### Average Customer Lifetime

| Tier | Monthly Churn | Avg Lifetime (1/churn) | Notes |
|------|-------------|----------------------|-------|
| Starter | 5% | 20 months | Lower switching cost, budget-sensitive |
| Professional | 3% | 33 months | Multi-site integration increases stickiness |
| Enterprise | 1% | 100 months (capped at 36 for modeling) | Contractual, deeply integrated, custom voice models |

Enterprise lifetime is theoretically 100 months at 1% churn, but capping at 36 months (3 years) is conservative and accounts for platform risk, market changes, and potential competitor disruption.

### Gross Margin per Tier

Gross margin = Revenue minus direct variable costs (Claude API, Gemini API, per-client infrastructure allocation). Excludes fixed costs (Hetzner base server, Semrush/Ahrefs subscriptions, developer salary).

| Tier | Monthly Revenue | Claude API Cost | Gemini API Cost | Infra Allocation | Gross Margin | Margin % |
|------|----------------|-----------------|-----------------|-------------------|-------------|----------|
| **Starter** | $3,000 | $24.00 (30 articles x $0.80) | $7.50 (30 articles x 5 images x $0.05) | $5.00 | $2,963.50 | 98.8% |
| **Professional** | $6,000 | $80.00 (100 articles x $0.80) | $25.00 | $8.00 | $5,887.00 | 98.1% |
| **Enterprise** | $12,000 | $200.00 (250 articles x $0.80) | $62.50 | $15.00 | $11,722.50 | 97.7% |

These margins are extraordinarily high because ChainIQ is a software platform with near-zero marginal cost per user. The AI API costs per article ($0.80-$1.00) are tiny relative to the value delivered ($3K-$12K/month subscriptions). This is the core thesis: publishers pay for the intelligence layer, not the compute.

### LTV Calculation

| Tier | Monthly Revenue | Gross Margin % | Avg Lifetime | LTV |
|------|----------------|----------------|-------------|-----|
| **Starter** | $3,000 | 98.8% | 20 months | **$59,280** |
| **Professional** | $6,000 | 98.1% | 33 months | **$194,238** |
| **Enterprise** | $12,000 | 97.7% | 36 months (capped) | **$422,064** |

**Weighted average LTV** (assuming moderate scenario mix of 60% Starter, 33% Professional, 7% Enterprise): **$107,414**.

---

## LTV:CAC Ratio

The LTV:CAC ratio is the single most important SaaS health metric. A ratio above 3:1 is considered healthy. Above 5:1 suggests underinvestment in growth.

| Tier | LTV | Blended CAC | LTV:CAC | Assessment |
|------|-----|------------|---------|------------|
| **Starter** | $59,280 | $1,400 | **42:1** | Extremely efficient |
| **Professional** | $194,238 | $1,400 | **139:1** | Exceptional |
| **Enterprise** | $422,064 | $2,500 (higher CAC for enterprise sales) | **169:1** | Exceptional |
| **Weighted Avg** | $107,414 | $1,400 | **77:1** | Far above benchmark |

These ratios are unusually high for three reasons:
1. **Near-zero CAC** in the early phase (warm network acquisition)
2. **Extremely high gross margins** (98%+ due to minimal variable costs)
3. **High price points** ($3K-$12K/mo) relative to infrastructure costs

**Caveat:** These ratios will normalize as the business scales and relies more on paid acquisition channels. At mature-phase CAC of $2,000 with market-rate churn, the Starter LTV:CAC drops to ~30:1 -- still excellent.

---

## Infrastructure Cost per Client

The per-client infrastructure cost determines how much of the subscription fee goes to serving that client versus contributing to margin.

### At 10 Tenants (Tier 1)

| Cost Component | Total Monthly | Per Client |
|----------------|-------------|------------|
| Hetzner compute | $11.00 | $1.10 |
| Supabase database | $25.00 | $2.50 |
| Cloudflare CDN | $0.00 | $0.00 |
| Semrush API (shared) | $120.00 | $12.00 |
| Ahrefs API (shared) | $100.00 | $10.00 |
| Domain | $1.50 | $0.15 |
| **Total fixed infra** | **$257.50** | **$25.75** |

Plus variable costs per client (depends on article volume):
| Cost Component | Starter (30 art/mo) | Professional (100 art/mo) | Enterprise (250 art/mo) |
|----------------|---------------------|--------------------------|------------------------|
| Claude API | $24.00 | $80.00 | $200.00 |
| Gemini API | $7.50 | $25.00 | $62.50 |
| **Total variable** | **$31.50** | **$105.00** | **$262.50** |

**Total cost to serve one client:**
- Starter: $25.75 (fixed share) + $31.50 (variable) = **$57.25/mo** (1.9% of $3K revenue)
- Professional: $25.75 + $105.00 = **$130.75/mo** (2.2% of $6K revenue)
- Enterprise: $25.75 + $262.50 = **$288.25/mo** (2.4% of $12K revenue)

### At 50 Tenants (Tier 2)

Fixed infrastructure per client drops as costs are amortized: $1,821.50 total / 50 = **$36.43/client** for fixed, plus variable API costs. Total cost per Starter client: ~$68/mo (2.3% of revenue).

### At 100 Tenants (Tier 3)

Fixed infrastructure per client: $3,670 / 100 = **$36.70/client**. The fixed cost per client plateaus because Semrush/Ahrefs subscriptions and compute scaling follow step-function pricing. Total cost per Starter client: ~$68/mo (2.3% of revenue).

---

## Contribution Margin by Tier

Contribution margin = Revenue - (variable costs + allocated fixed infrastructure costs). This is what each client contributes to covering fixed costs (developer salary, office, tools) and generating profit.

### At 10 Tenants

| Tier | Revenue | Total Cost to Serve | Contribution Margin | CM % |
|------|---------|--------------------|--------------------|------|
| **Starter** | $3,000 | $57.25 | **$2,942.75** | 98.1% |
| **Professional** | $6,000 | $130.75 | **$5,869.25** | 97.8% |
| **Enterprise** | $12,000 | $288.25 | **$11,711.75** | 97.6% |

### At 50 Tenants

| Tier | Revenue | Total Cost to Serve | Contribution Margin | CM % |
|------|---------|--------------------|--------------------|------|
| **Starter** | $3,000 | $68.00 | **$2,932.00** | 97.7% |
| **Professional** | $6,000 | $141.50 | **$5,858.50** | 97.6% |
| **Enterprise** | $12,000 | $299.00 | **$11,701.00** | 97.5% |

Contribution margins remain remarkably stable across scale because the dominant cost (AI API calls) scales linearly with articles, and articles are capped per tier. The fixed infrastructure cost per client actually decreases with scale, but it is such a small fraction of revenue that the effect is negligible.

---

## CAC Payback Period

CAC payback = CAC / (Monthly Revenue x Gross Margin %). This tells us how many months of subscription revenue are needed to recover the cost of acquiring the client.

| Tier | CAC | Monthly CM | Payback Period |
|------|-----|-----------|---------------|
| **Starter** (warm lead) | $800 | $2,942.75 | **0.27 months (8 days)** |
| **Starter** (cold outreach) | $2,500 | $2,942.75 | **0.85 months (25 days)** |
| **Professional** (warm lead) | $1,200 | $5,869.25 | **0.20 months (6 days)** |
| **Professional** (cold outreach) | $2,500 | $5,869.25 | **0.43 months (13 days)** |
| **Enterprise** (conference + outreach) | $3,000 | $11,711.75 | **0.26 months (8 days)** |

All payback periods are under 1 month. This is exceptional and reflects ChainIQ's high-price, low-infrastructure-cost positioning. The implication: invest aggressively in acquisition because the payback is nearly instant.

---

## Key Metrics Dashboard

| Metric | Current | Target (12-month) | Benchmark (B2B SaaS) |
|--------|---------|-------------------|---------------------|
| Blended CAC | $800 (warm leads) | $1,400 (blended) | $5,000-$15,000 |
| Weighted LTV | -- | $107,414 | $25,000-$100,000 |
| LTV:CAC ratio | -- | 77:1 | 3:1 minimum, 5:1 healthy |
| Gross margin | -- | 98% | 70-85% typical SaaS |
| CAC payback | -- | <1 month | 12-18 months typical |
| Logo churn | -- | 3-4% monthly blended | 3-7% for SMB SaaS |
| Net revenue retention | -- | 105-110% (upsells) | 100-130% for B2B |

**Bottom line:** ChainIQ's unit economics are among the strongest possible for a SaaS business. High price points ($3K-$12K), near-zero variable costs (AI APIs), minimal infrastructure overhead ($35-$68/client), and low-cost warm-lead acquisition create a flywheel where every new client generates almost pure contribution margin from day one.
