# Step 28.9 — Investor Metrics Dashboard

> **Status:** Planning
> **Owner:** Founder / Finance
> **Reporting cadence:** Monthly internal, quarterly investor update
> **Data sources:** Supabase (product), Stripe (revenue), Google Analytics (marketing)

---

## 1. Why These Metrics Matter

Investors in early-stage SaaS companies evaluate opportunity through a specific lens: is this company growing efficiently, retaining customers, and building a defensible business? The metrics below are not vanity numbers — they are the language investors use to assess whether ChainIQ is worth betting on. Each metric tells a specific part of the story, and together they paint a picture of product-market fit, capital efficiency, and growth trajectory.

For ChainIQ specifically, two metric categories are uniquely important: Arabic-specific usage metrics (proving that the Arabic-first thesis is validated by actual customer behavior) and quality gate metrics (proving that our differentiation — automated quality control — actually works and customers rely on it). No competitor can report these metrics because they don't have these capabilities.

---

## 2. Revenue Metrics

### Monthly Recurring Revenue (MRR)

**Definition:** Total monthly subscription revenue from all active customers. Excludes one-time fees, setup charges, or consulting revenue from Chain Reaction agency.

**Calculation:**
```
MRR = Sum of all active subscription monthly values
```

**Breakdown required:**
- New MRR: Revenue from customers who signed up this month
- Expansion MRR: Revenue increase from existing customers upgrading tiers
- Contraction MRR: Revenue decrease from existing customers downgrading
- Churned MRR: Revenue lost from customers who cancelled
- Net New MRR: New + Expansion - Contraction - Churned

**Targets:**

| Milestone | MRR Target | Timeline |
|-----------|-----------|----------|
| First revenue | $500 | Month 2-3 |
| Product-market fit signal | $3,000 | Month 5-6 |
| Angel round milestone | $10,000 | Month 9-12 |
| Seed round milestone | $50,000 | Month 18-24 |

**Why investors care:** MRR is the single most important SaaS metric. It demonstrates that customers are willing to pay recurring fees for the product. Growth rate matters more than absolute number at early stage — 20%+ month-over-month growth signals strong product-market fit.

### Annual Recurring Revenue (ARR)

**Definition:** MRR x 12. Represents the annualized run rate of current subscription revenue.

**Calculation:**
```
ARR = MRR x 12
```

**Why investors care:** ARR is the standard valuation benchmark for SaaS companies. Early-stage MENA SaaS companies typically raise seed rounds at 10-20x ARR. At $50K MRR ($600K ARR), a 15x multiple implies a $9M valuation — aligning with our seed round target.

### MRR Growth Rate

**Definition:** Month-over-month percentage increase in MRR.

**Calculation:**
```
MRR Growth Rate = (MRR this month - MRR last month) / MRR last month x 100
```

**Targets:**

| Stage | Target Growth Rate | Context |
|-------|-------------------|---------|
| Months 1-6 | >30% MoM | High growth from small base |
| Months 6-12 | >20% MoM | Sustained strong growth |
| Months 12-18 | >15% MoM | Still impressive at scale |
| Months 18-24 | >10% MoM | Mature growth trajectory |

**Why investors care:** Growth rate is the strongest indicator of product-market fit. A company growing at 20% MoM doubles revenue every ~4 months. At seed stage, investors want to see consistent 15-25% MoM growth — it suggests the company can reach $1M ARR within 12-18 months.

---

## 3. Customer Economics

### Customer Lifetime Value (LTV)

**Definition:** Total revenue expected from a customer over their entire relationship with ChainIQ.

**Calculation:**
```
LTV = ARPA / Monthly Churn Rate
```
Where ARPA = Average Revenue Per Account (monthly).

**Example at different churn rates:**

| ARPA | Monthly Churn | LTV | LTV:CAC at $1,500 CAC |
|------|--------------|-----|----------------------|
| $800 | 5% | $16,000 | 10.7:1 |
| $800 | 3% | $26,667 | 17.8:1 |
| $1,200 | 5% | $24,000 | 16:1 |
| $1,200 | 3% | $40,000 | 26.7:1 |

**Why investors care:** LTV determines how much you can afford to spend acquiring customers while remaining profitable. High LTV relative to CAC indicates a healthy, sustainable business.

### Customer Acquisition Cost (CAC)

**Definition:** Total cost to acquire one new paying customer, including all sales and marketing expenses.

**Calculation:**
```
CAC = Total Sales & Marketing Spend in Period / Number of New Customers Acquired in Period
```

**Include in calculation:**
- LinkedIn Sales Navigator subscription
- Any paid advertising spend
- Conference/event costs (amortized per customer acquired)
- Sales tooling costs
- Content creation costs (if outsourced)
- Founder's time on sales (imputed at market rate — optional for internal tracking, include for investor reporting)

**Do NOT include:**
- Product development costs
- Infrastructure costs
- Customer success costs (post-sale)

**Targets:**

| Stage | CAC Target | Context |
|-------|-----------|---------|
| Months 1-6 (bootstrap) | <$500 | Low-cost outreach, founder-led sales |
| Months 6-12 (angel) | <$1,500 | Scaled outreach, events, some paid marketing |
| Months 12-24 (seed) | <$2,500 | Sales team, paid channels, conferences |

### LTV:CAC Ratio

**Definition:** The ratio of customer lifetime value to customer acquisition cost.

**Target:** >3:1 (minimum healthy ratio), >5:1 (excellent), >10:1 (indicates under-investing in growth)

**Calculation:**
```
LTV:CAC = LTV / CAC
```

**Why investors care:** LTV:CAC >3:1 means every dollar spent on acquisition returns three or more dollars over the customer's lifetime. Below 3:1 is unsustainable. Above 10:1 may indicate the company should be spending more aggressively on growth.

### CAC Payback Period

**Definition:** Number of months before a customer's cumulative revenue exceeds the cost to acquire them.

**Calculation:**
```
CAC Payback = CAC / (ARPA x Gross Margin)
```

**Target:** <12 months (good), <6 months (excellent)

**Example:** CAC $1,500, ARPA $800/mo, Gross Margin 92% = 1,500 / (800 x 0.92) = **2.0 months payback** (excellent)

---

## 4. Retention Metrics

### Net Revenue Retention (NRR)

**Definition:** Revenue retained from existing customers after accounting for expansion, contraction, and churn. Measures whether the existing customer base is growing or shrinking in value.

**Calculation:**
```
NRR = (Starting MRR + Expansion - Contraction - Churn) / Starting MRR x 100
```

**Target:** >110% (existing customers generate more revenue over time even without new customers)

**Why this is critical:** NRR >100% means the company grows even without acquiring new customers. This is the single metric that most cleanly demonstrates product-market fit and pricing power. SaaS companies with NRR >120% are valued at significant premiums.

**How ChainIQ achieves >110% NRR:**
- Tier upgrades: Growth ($500) -> Starter ($3,000) -> Professional ($6,000) as customer content volume grows
- Usage-based expansion: Additional sites, higher API limits, premium features
- Price increases: Annual price adjustments (5-10%) as product value increases

### Monthly Customer Churn Rate

**Definition:** Percentage of customers who cancel their subscription in a given month.

**Calculation:**
```
Monthly Churn Rate = Customers Lost This Month / Customers at Start of Month x 100
```

**Targets:**

| Stage | Target Churn | Context |
|-------|-------------|---------|
| Months 1-6 | <8% | Some early churn expected as product-market fit refines |
| Months 6-12 | <5% | Product improvements and CS should reduce churn |
| Months 12-24 | <3% | Mature product, strong retention mechanics |

### Monthly Revenue Churn Rate (Gross)

**Definition:** Percentage of MRR lost to cancellations and downgrades.

**Calculation:**
```
Gross Revenue Churn = (Churned MRR + Contraction MRR) / Starting MRR x 100
```

**Target:** <5% monthly (equivalent to <60% annual — improves significantly at scale)

---

## 5. Customer Metrics

### Customer Count by Tier

Track total active customers and breakdown by tier:

| Tier | Price | Month 6 Target | Month 12 Target | Month 18 Target |
|------|-------|----------------|-----------------|-----------------|
| Growth | $500-800/mo | 6 | 15 | 25 |
| Starter | $3,000/mo | 3 | 7 | 15 |
| Professional | $6,000/mo | 1 | 3 | 7 |
| Enterprise | $12,000/mo | 0 | 1 | 3 |
| **Total** | | **10** | **26** | **50** |

**Why tier breakdown matters:** Investors want to see tier distribution shifting upward over time. If most customers are on Growth forever, the ARPA stays low. If customers upgrade from Growth to Starter to Professional, it proves the product delivers increasing value and customers are willing to pay more.

### Average Revenue Per Account (ARPA)

**Definition:** Average monthly revenue per active customer.

**Calculation:**
```
ARPA = MRR / Number of Active Customers
```

**Targets:**

| Stage | ARPA Target | Implication |
|-------|-----------|-------------|
| Month 6 | $800-1,000 | Mostly Growth tier customers |
| Month 12 | $1,200-1,500 | Mix shifting toward Starter |
| Month 18 | $1,800-2,500 | Healthy Starter + Professional mix |

---

## 6. Product Usage Metrics

### Article Generation Volume

**Definition:** Total number of articles generated through the ChainIQ pipeline per month.

**Tracking:** `usage_logs` table, `event_type = 'article_generated'`

**Targets:**

| Stage | Articles/Month | Avg per Customer |
|-------|---------------|-----------------|
| Month 6 | 500 | 50 |
| Month 12 | 3,000 | 115 |
| Month 18 | 10,000 | 200 |

**Why investors care:** Article volume is the product engagement metric. It proves customers are actively using the pipeline, not just paying and ignoring. High volume + high retention = strong product-market fit. Also demonstrates the data flywheel: more articles = more Arabic voice data = better quality = more articles.

### Quality Gate Pass Rate

**Definition:** Percentage of generated articles that pass the quality gate on first attempt (score above customer-configured threshold).

**Calculation:**
```
Pass Rate = Articles Passing Quality Gate / Total Articles Generated x 100
```

**Target:** 75-85% (first pass). Below 70% indicates the generation pipeline needs improvement. Above 90% might indicate thresholds are too low.

**Why this is unique to ChainIQ:** No competitor has this metric because no competitor has automated quality gates. This is a category-defining metric that proves our differentiation works. Investors in AI companies are increasingly skeptical of "AI-generated content" claims — quality gate pass rates provide empirical evidence of content quality at scale.

### Arabic vs English Usage Split

**Definition:** Percentage of articles generated in Arabic vs English (and other languages as added).

**Tracking:** `usage_logs` table, `language` field in `event_data`

**Target:** >70% Arabic in Year 1 (validates Arabic-first thesis)

**Why investors care:** This metric validates ChainIQ's core thesis. If 90% of usage is Arabic, it proves the market gap is real and customers came specifically for Arabic capabilities. If usage shifts to 50/50, it might indicate the Arabic positioning is less defensible than claimed. High Arabic usage percentage is a moat indicator.

---

## 7. Infrastructure and Efficiency Metrics

### Infrastructure Cost Per Client

**Definition:** Total infrastructure cost divided by number of active clients.

**Calculation:**
```
Cost Per Client = (Hetzner + Supabase + API Costs + CDN + Other Infra) / Active Clients
```

**Current:** ~$34/month total (at 1-2 clients)

**Targets at scale:**

| Clients | Total Infra Cost | Cost Per Client | Gross Margin |
|---------|-----------------|----------------|-------------|
| 5 | $100 | $20 | 97% |
| 10 | $200 | $20 | 98% |
| 25 | $500 | $20 | 98% |
| 50 | $1,500 | $30 | 97% |
| 100 | $4,000 | $40 | 96% |

**Why investors care:** Declining (or stable) infrastructure cost per client as the customer base grows demonstrates economies of scale. SaaS investors expect gross margins above 80% — ChainIQ's expected 90%+ is exceptional and reflects the capital-efficient architecture.

### API Cost Per Article

**Definition:** Average cost of AI model API calls per generated article.

**Tracking:** Sum of OpenAI/Anthropic API charges attributed to article generation, divided by article count.

**Target:** <$0.50 per article (at current model pricing)

**Why it matters:** This is the variable cost that scales with usage. If API cost per article is $0.50 and the customer pays $10-60 per article (based on plan and volume), the per-article margin is 92-99%. Investors want assurance that AI model costs don't erode margins as volume grows.

---

## 8. Investor Reporting Format

### Monthly Investor Update (5-Point Format)

```
Subject: ChainIQ Monthly Update — [Month Year]

1. WINS
   - [Key achievement 1]
   - [Key achievement 2]
   - [Key achievement 3]

2. CHALLENGES
   - [Key challenge and how we're addressing it]

3. METRICS
   - MRR: $X,XXX (+XX% MoM)
   - Customers: XX (net +X)
   - Articles generated: X,XXX
   - Quality gate pass rate: XX%
   - Arabic usage: XX%
   - NRR: XXX%

4. CASH
   - Cash on hand: $XX,XXX
   - Monthly burn: $X,XXX
   - Runway: XX months

5. ASKS
   - [Specific request: intro to [person], advice on [topic], etc.]
```

### Quarterly Investor Dashboard

More detailed dashboard shared quarterly, including:
- All metrics from this document with trends
- Customer tier breakdown
- Cohort analysis (retention by signup month)
- Pipeline and sales funnel metrics
- Product roadmap progress
- Competitive landscape update
- Next quarter priorities

---

## 9. Metric Collection and Tooling

| Metric Category | Data Source | Collection Method | Dashboard |
|---|---|---|---|
| Revenue (MRR, ARR, churn) | Stripe | Stripe Dashboard + API | Stripe Revenue Dashboard |
| Customer count and tier | Supabase `subscriptions` table | SQL query | Custom admin dashboard |
| Article volume | Supabase `usage_logs` | SQL aggregation | Custom admin dashboard |
| Quality gate scores | Supabase `quality_scores` | SQL aggregation | Custom admin dashboard |
| Arabic/English split | Supabase `usage_logs` | SQL aggregation | Custom admin dashboard |
| Infrastructure costs | Hetzner + Supabase billing | Manual monthly entry | Google Sheets |
| API costs | OpenAI/Anthropic billing | Manual monthly entry | Google Sheets |
| CAC | Marketing spend + customer count | Manual calculation | Google Sheets |
| Website traffic | Google Analytics 4 | GA4 reports | GA4 Dashboard |
| SEO metrics | Google Search Console + Ahrefs | Platform dashboards | Ahrefs Dashboard |

**Phase 1 tooling:** Google Sheets for financial metrics, Supabase SQL for product metrics, Stripe dashboard for revenue.

**Phase 2 tooling (post-angel):** Consider ChartMogul or Baremetrics for automated SaaS metrics dashboard ($50-100/mo).

---

*Last updated: 2026-03-28*
