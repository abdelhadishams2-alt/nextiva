# Step 28.9 — Cap Table Model & Dilution Scenarios

> **Status:** Planning
> **Owner:** Founder
> **Legal disclaimer:** This is a planning model, not legal advice. Engage a startup attorney before executing any equity transactions.
> **Cap table tool:** Google Sheets initially, migrate to Carta or Pulley at seed round

---

## 1. Cap Table Philosophy

For a solo founder building in the MENA market, cap table management is about one principle: maintain control through the seed round while building a coalition of aligned investors. The Arabic AI content market is early enough that ChainIQ's founder needs decision-making authority to move fast — navigating partnerships with MENA publishers, making product bets on Arabic NLP, and choosing when to expand beyond Arabic. Diluting below 50% before Series A would be premature and limit strategic flexibility.

The cap table models below are designed to keep founder ownership above 70% through the seed round. This is achievable because ChainIQ's capital needs are modest — $34/month infrastructure, no hardware dependencies, no inventory. The company doesn't need $10M to find product-market fit. It needs $300K for an angel round and $2M for a seed round, both of which can be raised with minimal dilution if timed against strong traction milestones.

---

## 2. Starting Position: Pre-Seed

| Shareholder | Shares | Ownership | Notes |
|---|---|---|---|
| Founder | 10,000,000 | 100.00% | Full ownership, common shares |
| **Total** | **10,000,000** | **100.00%** | |

**Share structure:**
- Authorized shares: 10,000,000 common shares
- Par value: $0.0001 per share (standard Delaware C-Corp) or equivalent for MENA jurisdiction
- Founder shares fully vested (no vesting on founder shares at this stage — vesting is introduced at seed round if required by institutional investors)

**Entity considerations:**
- If raising from US/international investors: consider US Delaware C-Corp or Cayman holding company with MENA operating subsidiary
- If raising primarily from MENA investors: local jurisdiction may be preferred (Saudi, UAE ADGM/DIFC, Bahrain)
- Consult with startup attorney before incorporation — entity structure affects taxation, IP ownership, and future fundraising

---

## 3. Scenario A: Conservative Raise

This scenario assumes smaller rounds at higher valuations, minimizing dilution. It requires stronger traction milestones before each raise but preserves maximum founder ownership.

### Angel Round: $200K at $2.5M Pre-Money

| Shareholder | Shares | Ownership | Notes |
|---|---|---|---|
| Founder | 10,000,000 | 92.59% | |
| Angel Investors | 800,000 | 7.41% | $200K at $2.5M pre-money ($2.7M post-money) |
| **Total** | **10,800,000** | **100.00%** | |

**Calculation:**
- Pre-money valuation: $2,500,000
- Investment: $200,000
- Post-money valuation: $2,700,000
- Angel ownership: $200K / $2.7M = 7.41%
- New shares issued: 10,000,000 x (7.41% / 92.59%) = 800,000
- Price per share: $200,000 / 800,000 = $0.25

**Angel investor distribution (example):**

| Investor | Check Size | Shares | Ownership |
|----------|-----------|--------|-----------|
| Angel A (Saudi tech founder) | $75,000 | 300,000 | 2.78% |
| Angel B (UAE media executive) | $50,000 | 200,000 | 1.85% |
| Angel C (MENA diaspora investor) | $50,000 | 200,000 | 1.85% |
| Angel D (industry advisor) | $25,000 | 100,000 | 0.93% |
| **Total Angels** | **$200,000** | **800,000** | **7.41%** |

### Seed Round: $1.5M at $10M Pre-Money

| Shareholder | Shares | Ownership | Notes |
|---|---|---|---|
| Founder | 10,000,000 | 76.92% | Diluted from 92.59% |
| Angel Investors | 800,000 | 6.15% | Diluted from 7.41% |
| Employee Option Pool | 1,000,000 | 7.69% | Created at seed round (10% of pre-money) |
| Seed Investors | 1,200,000 | 9.23% | $1.5M at $10M pre-money |
| **Total** | **13,000,000** | **100.00%** | |

**Calculation:**
- Pre-money valuation: $10,000,000 (includes option pool)
- Option pool: 10% of pre-money = $1,000,000 / 1,000,000 shares
- Investment: $1,500,000
- Post-money valuation: $11,500,000
- Seed ownership: $1.5M / $11.5M = 13.04%... but option pool is carved from pre-money
- Adjusted: Seed gets 9.23% of fully diluted cap table
- Price per share: $1,500,000 / 1,200,000 = $1.25

### Scenario A Summary

| Stage | Founder | Angels | Options | Seed | Total Raised | Valuation |
|-------|---------|--------|---------|------|-------------|-----------|
| Pre-seed | 100% | — | — | — | $0 | — |
| Post-angel | 92.59% | 7.41% | — | — | $200K | $2.7M post |
| Post-seed | 76.92% | 6.15% | 7.69% | 9.23% | $1.7M | $11.5M post |

**Founder retains 76.92% — strong control position.**

---

## 4. Scenario B: Aggressive Growth Raise

This scenario assumes larger rounds to accelerate growth, accepting more dilution in exchange for faster scaling. Appropriate if a competitor enters the Arabic market and speed-to-market becomes critical.

### Angel Round: $500K at $3M Pre-Money

| Shareholder | Shares | Ownership | Notes |
|---|---|---|---|
| Founder | 10,000,000 | 85.71% | |
| Angel Investors | 1,666,667 | 14.29% | $500K at $3M pre-money ($3.5M post-money) |
| **Total** | **11,666,667** | **100.00%** | |

**Calculation:**
- Pre-money valuation: $3,000,000
- Investment: $500,000
- Post-money valuation: $3,500,000
- Angel ownership: $500K / $3.5M = 14.29%
- Price per share: $500,000 / 1,666,667 = $0.30

**Angel investor distribution (example):**

| Investor | Check Size | Shares | Ownership |
|----------|-----------|--------|-----------|
| 500 Global MENA | $150,000 | 500,000 | 4.29% |
| Angel Syndicate (Oqal) | $150,000 | 500,000 | 4.29% |
| Angel A (Saudi) | $100,000 | 333,333 | 2.86% |
| Angel B (UAE) | $50,000 | 166,667 | 1.43% |
| Angel C (Strategic advisor) | $50,000 | 166,667 | 1.43% |
| **Total Angels** | **$500,000** | **1,666,667** | **14.29%** |

### Seed Round: $3M at $12M Pre-Money

| Shareholder | Shares | Ownership | Notes |
|---|---|---|---|
| Founder | 10,000,000 | 60.00% | Diluted from 85.71% |
| Angel Investors | 1,666,667 | 10.00% | Diluted from 14.29% |
| Employee Option Pool | 1,666,667 | 10.00% | Created at seed (10% of pre-money) |
| Seed Investors | 3,333,333 | 20.00% | $3M at $12M pre-money |
| **Total** | **16,666,667** | **100.00%** | |

**Calculation:**
- Pre-money valuation: $12,000,000 (includes option pool)
- Option pool: 10% = 1,666,667 shares
- Investment: $3,000,000
- Post-money valuation: $15,000,000
- Seed ownership: $3M / $15M = 20.00%
- Price per share: $3,000,000 / 3,333,333 = $0.90

### Scenario B Summary

| Stage | Founder | Angels | Options | Seed | Total Raised | Valuation |
|-------|---------|--------|---------|------|-------------|-----------|
| Pre-seed | 100% | — | — | — | $0 | — |
| Post-angel | 85.71% | 14.29% | — | — | $500K | $3.5M post |
| Post-seed | 60.00% | 10.00% | 10.00% | 20.00% | $3.5M | $15M post |

**Founder retains 60.00% — still majority control, but approaching the threshold where institutional investors at Series A could push below 50%.**

---

## 5. Employee Option Pool Design

### Pool Size Rationale

The 10% option pool is carved out at the seed round (from pre-money valuation, which dilutes existing shareholders equally). This is standard practice — seed investors insist on it to ensure the company can attract talent without further immediate dilution.

### Pool Allocation Plan

| Role | Options (% of pool) | Vesting | Rationale |
|------|---------------------|---------|-----------|
| Arabic NLP Engineer (#1 hire) | 20% of pool (2% of company) | 4-year vest, 1-year cliff | Critical technical hire, Arabic-specific expertise is rare |
| Full-Stack Engineer | 15% (1.5%) | 4-year vest, 1-year cliff | Core product development |
| Growth / Sales Lead | 15% (1.5%) | 4-year vest, 1-year cliff | Revenue-critical hire |
| Customer Success Lead | 10% (1%) | 4-year vest, 1-year cliff | Retention-critical hire |
| Future engineering hires (2-3) | 25% (2.5%) | 4-year vest, 1-year cliff | Reserved for scaling |
| Advisors | 10% (1%) | 2-year vest, no cliff, monthly | Strategic advisors (2-3 people) |
| Unallocated reserve | 5% (0.5%) | — | Buffer for exceptional hires or additional advisors |

### Vesting Terms

**Standard employee vesting:**
- 4-year vesting period
- 1-year cliff (0% vesting in first 12 months, 25% vests at month 12)
- Monthly vesting after cliff (1/48th per month)
- Acceleration: single-trigger acceleration on change of control (optional, negotiate per hire)

**Advisor vesting:**
- 2-year vesting period
- No cliff (monthly vesting from day 1)
- 1/24th per month
- Standard advisor agreement (FAST Agreement template)

### Option Exercise Price

Set at Fair Market Value (FMV) at time of grant, determined by 409A valuation (if US entity) or board-determined FMV (if non-US). Early grants will have low exercise prices, making them more valuable to early employees.

---

## 6. Dilution Impact Analysis

### Founder Ownership Through Rounds

```
100% ─────┐
           │ Pre-seed (100%)
92.6% ────┤
           │ Angel - Scenario A ($200K)
85.7% ────┤
           │ Angel - Scenario B ($500K)
76.9% ────┤
           │ Seed - Scenario A ($1.5M)
60.0% ────┤
           │ Seed - Scenario B ($3M)
           │
           │ [Future: Series A would further dilute to ~45-55%]
```

### Value of Founder Shares Over Time

Even as percentage ownership decreases, the value of the founder's shares increases with each round (assuming up-rounds):

**Scenario A (Conservative):**

| Stage | Founder % | Post-Money Valuation | Founder Share Value |
|-------|-----------|---------------------|-------------------|
| Pre-seed | 100% | N/A (bootstrapped) | Sweat equity |
| Post-angel | 92.59% | $2,700,000 | $2,500,000 |
| Post-seed | 76.92% | $11,500,000 | $8,846,000 |

**Scenario B (Aggressive):**

| Stage | Founder % | Post-Money Valuation | Founder Share Value |
|-------|-----------|---------------------|-------------------|
| Pre-seed | 100% | N/A (bootstrapped) | Sweat equity |
| Post-angel | 85.71% | $3,500,000 | $3,000,000 |
| Post-seed | 60.00% | $15,000,000 | $9,000,000 |

**Key insight:** In Scenario B, the founder owns less percentage but the shares are worth more ($9M vs $8.85M). This is the fundamental trade-off of dilution: a smaller slice of a bigger pie can be worth more than a bigger slice of a smaller pie. The question is whether the additional capital truly accelerates growth enough to justify the higher valuation.

---

## 7. SAFE Note Considerations (Angel Round)

For the angel round, we recommend using a standard YC Post-Money SAFE:

### Why SAFE over Convertible Note

| Factor | SAFE | Convertible Note |
|--------|------|-----------------|
| Simplicity | Single document, no negotiation on interest/maturity | More terms to negotiate |
| Cost | $0-500 in legal fees | $2,000-5,000 in legal fees |
| Maturity date | None (converts at next priced round) | Typically 18-24 months (creates pressure) |
| Interest | None | Typically 4-8% (adds complexity) |
| Valuation cap | Yes (set at $2.5-3M for our round) | Yes (with interest accrual) |
| MENA investor familiarity | Increasing (500 Global, many MENA VCs use SAFEs) | More traditional, some MENA investors prefer |

### Post-Money SAFE Mechanics

A Post-Money SAFE with a $3M cap means:
- The investor's ownership is calculated based on the cap ($3M), not the next round's valuation
- If we raise a seed at $10M pre-money, the SAFE converts at the $3M cap (investor gets more shares)
- Post-money SAFE: the cap represents the post-money, so $500K on a $3M post-money cap = 16.67% exactly
- This is simpler for both parties — ownership is known at signing

### Pro-Rata Rights

Angel investors typically request pro-rata rights (the right to invest their proportional share in future rounds to maintain ownership percentage). Grant this — it aligns incentives and costs nothing if they don't exercise. Set a minimum threshold ($25K minimum follow-on investment) to prevent administrative burden from very small checks.

---

## 8. Protective Provisions

At the seed round, institutional investors will request protective provisions. Be prepared to negotiate:

### Standard Provisions (Accept)

| Provision | Description | Founder Impact |
|-----------|-------------|---------------|
| Board approval for new share issuance | Prevents unauthorized dilution | Minimal — you'd want board input anyway |
| Consent for debt above threshold | Prevents overleveraging | Reasonable at >$100K threshold |
| Annual budget approval | Board reviews annual budget | Normal governance |
| Information rights | Quarterly financials, annual audit | Standard — you should be tracking this anyway |

### Negotiable Provisions (Push Back)

| Provision | Investor Ask | Founder Counter |
|-----------|-------------|----------------|
| Board seat | Seed lead wants a board seat | Accept 1 investor board seat, maintain 2 founder + 1 independent = 3-seat board with founder majority |
| Veto on key hires | Investor approval for C-suite hires | Accept for CEO replacement only; founder hires all others independently |
| Drag-along threshold | Investors want 50% vote to force sale | Push to 67% or 75% — protects founder from being forced into an exit |
| Liquidation preference | 1x non-participating preferred | Standard and fair. Reject anything >1x or participating preferred at seed stage |

---

## 9. Cap Table Management

### Phase 1 (Pre-Seed to Angel): Google Sheets

Maintain a simple spreadsheet with:
- Shareholder name, share count, percentage
- SAFE holders (convert at next priced round)
- Vested vs unvested shares
- Dilution modeling for potential scenarios

### Phase 2 (Post-Seed): Carta or Pulley

Migrate to a cap table management platform:
- Carta: industry standard, expensive ($3,000-5,000/year), handles 409A valuations
- Pulley: newer, cheaper ($50-200/month), designed for startups
- Either platform handles: cap table, equity grants, vesting schedules, tax filings, 409A

### Documentation Checklist

Maintain these documents from day one:
- [ ] Certificate of incorporation / formation documents
- [ ] Shareholder agreement (if applicable)
- [ ] Board resolutions for all share issuances
- [ ] SAFE agreements (executed copies)
- [ ] Stock option plan (when created)
- [ ] Individual option grant agreements
- [ ] 409A valuation report (if US entity, before first option grant)
- [ ] Capitalization table (current, updated within 48 hours of any change)

---

*Last updated: 2026-03-28*
