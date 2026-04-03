# ChainIQ Break-Even Analysis

> **Created:** 2026-03-28
> **Objective:** Determine the minimum monthly recurring revenue (MRR), client count, and timeline to reach profitability
> **Assumptions:** Solo developer, no external funding, bootstrapped from consulting revenue
> **Review cadence:** Monthly for first 6 months

---

## Fixed Cost Structure

Fixed costs are expenses incurred regardless of client count. For ChainIQ, these break into infrastructure fixed costs (always-on services) and business fixed costs (tools, overhead).

### Infrastructure Fixed Costs

| Item | Monthly Cost | Notes |
|------|-------------|-------|
| Hetzner CPX21 (primary server) | $9.00 | Bridge server, always-on |
| Supabase Pro (database) | $25.00 | Mandatory for RLS, auth, backups |
| Cloudflare (DNS/CDN) | $0.00 | Free tier sufficient initially |
| Domain (chainiq.io) | $1.50 | ~$18/year amortized |
| **Infrastructure subtotal** | **$35.50** | |

### External API Fixed Costs

These are subscription APIs needed to deliver the content intelligence layer, regardless of how many clients use them:

| Item | Monthly Cost | Notes |
|------|-------------|-------|
| Semrush Business API | $120.00 | Required for keyword data, gap analysis |
| Ahrefs Standard API | $100.00 | Required for backlink data, content explorer |
| Claude Max (development) | $100.00 | Developer's own Claude subscription for building/testing |
| **API subtotal** | **$320.00** | |

### Business Overhead

| Item | Monthly Cost | Notes |
|------|-------------|-------|
| GitHub (Pro) | $4.00 | Code hosting, Actions CI/CD |
| 1Password (individual) | $3.00 | Secret management |
| Google Workspace | $7.20 | Business email, Drive |
| Accounting software | $15.00 | Invoicing, expense tracking |
| Legal/compliance reserve | $50.00 | Amortized annual legal costs |
| **Overhead subtotal** | **$79.20** | |

### Developer Salary (Opportunity Cost)

The solo developer's time has an opportunity cost. Currently earning consulting revenue from Chain Reaction SEO. The salary equivalent is what must be replaced by ChainIQ revenue for the transition from agency to SaaS to be financially rational.

| Scenario | Monthly Salary Target | Notes |
|----------|----------------------|-------|
| **Minimum viable** | $3,000 | Covers basic living expenses in developer's location |
| **Replacement** | $8,000 | Replaces current consulting income |
| **Growth** | $15,000 | Allows reinvestment in growth (hiring, marketing) |

---

## Total Fixed Costs by Scenario

| Scenario | Infra | APIs | Overhead | Salary | Total Monthly Fixed |
|----------|-------|------|----------|--------|-------------------|
| **Bare minimum** (no salary) | $35.50 | $320.00 | $79.20 | $0 | **$434.70** |
| **Minimum viable** (subsistence) | $35.50 | $320.00 | $79.20 | $3,000 | **$3,434.70** |
| **Replacement** (full transition) | $35.50 | $320.00 | $79.20 | $8,000 | **$8,434.70** |
| **Growth** (reinvestment mode) | $35.50 | $320.00 | $79.20 | $15,000 | **$15,434.70** |

---

## Variable Costs per Article

Every article generated incurs direct API costs. These are the only meaningful variable costs in ChainIQ's model.

| Cost Component | Per Article | Calculation |
|----------------|-----------|-------------|
| Claude API (Sonnet 4) | $0.80 | 7-agent pipeline: ~4,000 input tokens ($0.012) + ~8,000 output tokens ($0.12) x 4-6 calls |
| Gemini API (image generation) | $0.20 | 5 images per article x $0.04/image |
| Gemini API (research) | $0.05 | Web search + content analysis |
| **Total variable per article** | **$1.05** | |

At scale (1,000+ articles/month), Claude batch API pricing and negotiated rates could reduce this to ~$0.70/article. For break-even modeling, we use $1.05 (current pricing, no discounts).

### Variable Cost per Client by Tier

| Tier | Articles/Month | Variable Cost/Month |
|------|---------------|-------------------|
| Starter | 30 | $31.50 |
| Professional | 100 | $105.00 |
| Enterprise | 250 | $262.50 |

---

## Break-Even Calculation

Break-even MRR = Fixed Costs / (1 - Variable Cost Ratio)

Since variable costs per client are negligible relative to revenue (1.0-2.2%), the break-even point is essentially: **MRR = Fixed Costs**.

### Break-Even by Scenario

| Scenario | Monthly Fixed Costs | Required MRR | Starter Clients Needed | Pro Clients Needed | Mix (2S + 1P) |
|----------|-------------------|-------------|----------------------|-------------------|---------------|
| **Bare minimum** | $434.70 | $435 | 1 (0.15 clients) | 1 (0.07 clients) | 1 Starter covers it |
| **Minimum viable** | $3,434.70 | $3,435 | 2 (1.15 clients) | 1 (0.57 clients) | 1 Starter + rounding |
| **Replacement** | $8,434.70 | $8,435 | 3 (2.81 clients) | 2 (1.41 clients) | 2 Starter + 1 Pro |
| **Growth** | $15,434.70 | $15,435 | 6 (5.14 clients) | 3 (2.57 clients) | 3 Starter + 1 Pro + partial |

**Key insight:** ChainIQ breaks even on infrastructure costs with a single Starter client ($3K > $435 fixed infra + API costs). The real break-even question is salary replacement -- and that requires just 2-3 clients.

---

## Time to Break-Even by Growth Rate

Using the three revenue projection scenarios (from revenue-projection.md):

### Bare Minimum (Infrastructure Only, $435/mo)

| Scenario | Month Break-Even Reached | Cumulative Spend to Break-Even |
|----------|-------------------------|-------------------------------|
| Conservative | Month 1 | $435 (first client covers it) |
| Moderate | Month 1 | $435 |
| Optimistic | Month 1 | $435 |

ChainIQ covers its own infrastructure costs from the very first client. There is no "runway" problem for keeping the platform alive.

### Minimum Viable ($3,435/mo)

| Scenario | Month Break-Even Reached | Cumulative Loss Before Break-Even |
|----------|-------------------------|----------------------------------|
| Conservative | Month 1 | $0 (first Starter client = $3K, close to break-even) |
| Moderate | Month 1 | $0 ($9K MRR in month 1) |
| Optimistic | Month 1 | $0 ($12K MRR in month 1) |

Even the conservative scenario nearly breaks even on subsistence salary in month 1 with a single $3K Starter client. By month 2 (2 clients, $6K MRR), all scenarios are comfortably above minimum viable.

### Salary Replacement ($8,435/mo)

| Scenario | Month Break-Even Reached | Cumulative Loss Before Break-Even |
|----------|-------------------------|----------------------------------|
| Conservative | Month 4 | ~$10,700 |
| Moderate | Month 2 | ~$3,435 |
| Optimistic | Month 1 | $0 |

**Conservative path:** Months 1-3 generate $3K, $6K, $6K MRR against $8,435 fixed costs. The cumulative shortfall peaks at ~$10,700 before month 4 adds a Professional client ($12K MRR). This shortfall is covered by continuing part-time consulting during the transition.

**Moderate path:** Month 1 MRR of $9K exceeds the $8,435 target. Break-even from month 2 onward.

### Growth Mode ($15,435/mo)

| Scenario | Month Break-Even Reached | Cumulative Loss Before Break-Even |
|----------|-------------------------|----------------------------------|
| Conservative | Month 10 | ~$50,000 |
| Moderate | Month 4 | ~$7,300 |
| Optimistic | Month 2 | ~$3,400 |

Growth mode requires either 5-6 clients (mix of tiers) or aggressive consulting revenue to bridge the gap. The moderate scenario hits $15K+ MRR by month 4, making growth-mode break-even realistic within the first quarter.

---

## Sensitivity Analysis

### What if Claude API costs double?

| Current cost per article | $1.05 |
|---|---|
| Doubled cost per article | $2.10 |
| Impact on Starter variable cost | $31.50 -> $63.00 (+$31.50/mo) |
| Impact on Starter contribution margin | 98.1% -> 97.0% |
| Impact on break-even | Negligible (fixed costs dominate) |

Even a 2x increase in Claude API pricing has virtually no impact on break-even because variable costs are <3% of revenue. ChainIQ's pricing headroom is enormous.

### What if churn is 2x expected?

| Tier | Expected Churn | 2x Churn | LTV Impact |
|------|---------------|----------|------------|
| Starter | 5% | 10% | LTV drops from $59K to $29.6K |
| Professional | 3% | 6% | LTV drops from $194K to $97K |

Higher churn does not affect break-even (which is a cash flow metric), but it dramatically impacts LTV and the growth trajectory. At 10% Starter churn, you need to acquire 1.2 clients/month just to maintain client count -- feasible but tighter.

### What if average deal size is lower?

If the market only supports $2K/mo Starter pricing (33% discount to compete with Western tools offering Arabic as a secondary language):

| Metric | $3K Pricing | $2K Pricing |
|--------|-----------|-----------|
| Replacement break-even (clients needed) | 3 | 5 |
| Month to replacement break-even (moderate) | Month 2 | Month 4 |
| 12-month revenue (moderate, 15 clients) | $495K | $330K |

A $1K price reduction delays break-even by ~2 months and reduces 12-month revenue by ~33%. Still viable, but reduces the margin for error.

---

## Cash Reserve Requirement

Based on the analysis above, the recommended cash reserve before launching ChainIQ as primary income:

| Scenario | Months of Runway Needed | Reserve Amount |
|----------|------------------------|----------------|
| Conservative (salary replacement) | 4 months @ $8,435 shortfall avg | $15,000 |
| Moderate (salary replacement) | 2 months @ $3,435 shortfall avg | $7,000 |
| Aggressive (growth mode) | 6 months @ $15,435 avg shortfall | $50,000 |

**Recommendation:** Maintain $15,000 cash reserve before transitioning from consulting to full-time ChainIQ development. Continue part-time consulting during months 1-3 to reduce burn. Transition to full-time ChainIQ when MRR consistently exceeds $10K for 2 consecutive months.

---

## Break-Even Summary

| Question | Answer |
|----------|--------|
| Minimum clients to cover infrastructure | **1 Starter** ($3K > $435 infra) |
| Minimum clients for subsistence salary | **2 Starter** ($6K > $3,435) |
| Minimum clients for salary replacement | **3 clients** (2 Starter + 1 Professional = $12K > $8,435) |
| Minimum clients for growth mode | **6 clients** (mixed tiers, ~$18K MRR > $15,435) |
| Fastest path to break-even | Land 1 Professional client in month 1 (single $6K client covers minimum viable + infra) |
| Maximum pre-revenue burn | ~$435/mo (infrastructure only, if building with no clients) |
