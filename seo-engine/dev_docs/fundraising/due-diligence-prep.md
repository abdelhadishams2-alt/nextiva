# Step 28.9 — Due Diligence Preparation Checklist

> **Status:** Planning
> **Owner:** Founder
> **Audience:** Angel and seed investors conducting due diligence
> **Preparation timeline:** Begin 30 days before fundraise starts

---

## 1. Due Diligence Overview

Due diligence is the process by which investors verify the claims made in your pitch, assess risks, and determine whether to invest. For early-stage MENA SaaS companies, due diligence is typically lighter than Silicon Valley standards — angel investors may spend 2-4 weeks, seed VCs 4-8 weeks. However, preparation matters enormously: delays or missing documents signal disorganization and erode investor confidence.

ChainIQ's due diligence preparation has a unique advantage: the technical architecture is already extensively documented (ARCH-ANCHOR.md, component registry, service specs). This documentation, unusual for a pre-seed startup, demonstrates engineering discipline and makes technical due diligence straightforward. The areas requiring the most preparation are corporate/legal documents (which may not exist yet) and financial records (which need to be formalized from informal tracking).

This checklist covers every document category an investor might request, organized by priority. Items marked "Critical" must be ready before first investor meeting. Items marked "Important" should be ready within 1 week of request. Items marked "Nice-to-have" can be prepared if specifically requested.

---

## 2. Corporate Documents

### Entity Formation

| Document | Priority | Status | Notes |
|----------|----------|--------|-------|
| Certificate of Incorporation / Commercial Registration | Critical | [ ] | Required before signing any investment documents |
| Articles of Association / Bylaws | Critical | [ ] | Standard template for chosen jurisdiction |
| Operating Agreement (if LLC) or Shareholder Agreement | Critical | [ ] | Defines governance structure |
| Board resolutions (all historical) | Important | [ ] | Even if solo founder — document key decisions |
| Good standing certificate | Important | [ ] | Proves entity is in compliance with jurisdiction |
| Trade license (if MENA-registered) | Critical | [ ] | Required for UAE/Saudi/Bahrain operations |
| Tax registration certificate | Important | [ ] | VAT registration if applicable |

### Jurisdiction Decision

Before due diligence begins, finalize the corporate structure:

| Option | Pros | Cons | Best For |
|--------|------|------|----------|
| UAE (ADGM / DIFC) | 0% corporate tax, strong IP protection, recognized by international investors, close to MENA clients | Setup cost ($5K-15K), annual renewal fees | Raising from both MENA and international investors |
| Saudi Arabia | Largest MENA market, government incentives (MCIT), alignment with Vision 2030 | Stricter regulations, may limit international investors | Primarily Saudi-focused business |
| US (Delaware C-Corp) | Standard for global VC, largest investor pool, well-understood legal framework | US tax complexity, distant from MENA market, potential double taxation | Raising from US investors, planning US expansion |
| Cayman holding + MENA subsidiary | Tax efficiency, accepted by all investor types, flexible | Setup complexity, ongoing compliance costs | Raising $1M+ from mixed investor base |

**Recommendation:** UAE ADGM for angel round (simple, tax-efficient, credible with MENA investors). Evaluate Cayman holding structure at seed round if raising from international VCs.

---

## 3. Financial Records

### Historical Financials

| Document | Priority | Status | Notes |
|----------|----------|--------|-------|
| Profit and loss statement (last 12 months) | Critical | [ ] | Even if pre-revenue — show expenses clearly |
| Balance sheet (current) | Critical | [ ] | Assets, liabilities, equity |
| Cash flow statement (last 6 months) | Important | [ ] | Shows burn rate and runway |
| Bank statements (last 6 months) | Critical | [ ] | Investors will verify cash position |
| Revenue records / invoices | Critical | [ ] | Every customer invoice, subscription record |
| Expense receipts and records | Important | [ ] | Categorized: infrastructure, tools, marketing |
| Tax filings (all years since incorporation) | Important | [ ] | Or proof of filing if no revenue |

### Financial Model

| Document | Priority | Status | Notes |
|----------|----------|--------|-------|
| 3-year financial projection | Critical | [ ] | Revenue, expenses, cash flow, headcount plan |
| Unit economics model | Critical | [ ] | LTV, CAC, gross margin, payback period |
| Scenario analysis (base, optimistic, conservative) | Important | [ ] | Shows founder has thought through risks |
| Cap table model (current and projected) | Critical | [ ] | See `cap-table-model.md` |
| Use of funds breakdown | Critical | [ ] | How the investment will be allocated |

### Subscription and Revenue Data

| Document | Priority | Status | Notes |
|----------|----------|--------|-------|
| Stripe dashboard export | Critical | [ ] | MRR, churn, ARPA, payment history |
| Customer list with plan details | Critical | [ ] | Company name, plan, MRR, start date, status |
| MRR waterfall (monthly) | Important | [ ] | New, expansion, contraction, churn breakdown |
| Revenue by customer concentration | Important | [ ] | No single customer should be >25% of MRR at seed |

---

## 4. Intellectual Property

### Software and Code

| Document | Priority | Status | Notes |
|----------|----------|--------|-------|
| Technical architecture document (ARCH-ANCHOR.md) | Critical | [ ] | Already exists — comprehensive system documentation |
| Component registry | Critical | [ ] | Already documented — 7 agent components with versioning |
| Scoring algorithms documentation | Critical | [ ] | Quality gate scoring methodology, weighting, calibration data |
| Source code access (for technical DD) | Important | [ ] | Provide read-only GitHub access to investor's technical advisor |
| Code audit summary | Nice-to-have | [ ] | If a code audit has been performed |
| Third-party library licenses | Important | [ ] | List all open-source dependencies and their licenses (MIT, Apache, GPL) |
| API documentation | Important | [ ] | Current API endpoints, authentication, rate limits |

### IP Ownership

| Document | Priority | Status | Notes |
|----------|----------|--------|-------|
| IP assignment agreement (founder to company) | Critical | [ ] | All code and IP formally assigned to the corporate entity, not held personally |
| Contractor IP assignment agreements | Critical | [ ] | If any contractors contributed code, ensure IP was assigned |
| No use of employer IP declaration | Important | [ ] | Confirm no code from previous employment was used |
| Open source compliance audit | Important | [ ] | Verify no GPL-licensed code in proprietary components |
| Trademark registration (ChainIQ) | Important | [ ] | File trademark application before fundraise if possible |
| Domain ownership records | Important | [ ] | chainiq.io registered to the corporate entity |

### Proprietary Data and Models

| Asset | Description | Protection Status |
|-------|-------------|-------------------|
| Arabic voice intelligence data | Trained models on publication-specific Arabic writing patterns | Trade secret — no public access, stored in secured Supabase |
| Quality gate scoring weights | Calibrated scoring algorithm for Arabic content quality | Trade secret — documented in ARCH-ANCHOR.md |
| Component registry | Structured content component system for article generation | Trade secret — core product IP |
| Arabic morphological rules | Custom rules for Arabic content generation beyond base LLM | Trade secret — embedded in agent logic |

**IP protection strategy:**
- Phase 1: Trade secret protection (NDAs, access controls, documentation with timestamps)
- Phase 2: Provisional patent filing for Arabic voice intelligence methodology ($2K-5K)
- Phase 3: Full patent prosecution if technology proves defensible ($15K-30K)

---

## 5. Data Privacy and Compliance

### GDPR Compliance

Even though ChainIQ primarily serves MENA clients, GDPR applies if any EU-based users access the platform or if EU resident data is processed.

| Requirement | Priority | Status | Notes |
|-------------|----------|--------|-------|
| Privacy policy (published on chainiq.io) | Critical | [ ] | Covers data collection, processing, storage, rights |
| Terms of service | Critical | [ ] | User agreement, acceptable use, liability |
| Data processing agreement (DPA) template | Important | [ ] | For enterprise customers who require it |
| Cookie consent mechanism | Important | [ ] | GDPR-compliant cookie banner on marketing site |
| Data subject access request (DSAR) process | Important | [ ] | Documented process for handling user data requests |
| Data retention policy | Important | [ ] | How long user data is stored, deletion procedures |
| Sub-processor list | Important | [ ] | Supabase, Hetzner, OpenAI/Anthropic, Stripe — all documented |
| Data breach notification process | Nice-to-have | [ ] | 72-hour notification procedure |

### MENA-Specific Data Regulations

| Regulation | Jurisdiction | Status | Notes |
|------------|-------------|--------|-------|
| Saudi PDPL (Personal Data Protection Law) | Saudi Arabia | [ ] | Applies to Saudi customer data — similar to GDPR |
| UAE Federal Data Protection Law | UAE | [ ] | Applies to UAE customer data |
| DIFC Data Protection Law | Dubai (DIFC) | [ ] | If incorporated in DIFC |
| ADGM Data Protection Regulations | Abu Dhabi (ADGM) | [ ] | If incorporated in ADGM |

### Data Localization

| Consideration | Current State | Investor Impact |
|---|---|---|
| Where is customer content data stored? | Hetzner (EU) + Supabase (US) | Some Saudi clients may require data residency in KSA — plan for regional deployment |
| Where are AI models processed? | OpenAI (US) / Anthropic (US) | Customer content is sent to US-based API providers — document in privacy policy |
| Where are backups stored? | [Document location] | Ensure backups follow same privacy rules as primary data |

---

## 6. Customer Contracts and Agreements

| Document | Priority | Status | Notes |
|----------|----------|--------|-------|
| Standard subscription agreement / Terms of Service | Critical | [ ] | The contract all customers agree to |
| Customer list with contract terms | Critical | [ ] | Start date, term, price, renewal terms |
| Pilot/trial agreements | Important | [ ] | Any non-standard agreements with early customers |
| SLA (Service Level Agreement) | Important | [ ] | Uptime commitments, support response times |
| NDA template (mutual) | Important | [ ] | Used for enterprise sales conversations |
| Partner/reseller agreement template | Nice-to-have | [ ] | For agency partnership program |
| Customer testimonials / permission to reference | Important | [ ] | Written permission to use customer name in sales materials |

### Customer Concentration Risk

Investors will assess whether revenue is concentrated in a small number of customers:

| Risk Level | Criteria | Mitigation |
|------------|----------|------------|
| Low | No customer >15% of MRR | Healthy diversification |
| Medium | One customer 15-30% of MRR | Document expansion plan to diversify |
| High | One customer >30% of MRR | Expected at early stage — show pipeline of new customers |

---

## 7. Technical Architecture and Security

### Architecture Documentation

| Document | Priority | Status | Location |
|----------|----------|--------|----------|
| ARCH-ANCHOR.md | Critical | [x] | `dev_docs/ARCH-ANCHOR.md` |
| System architecture diagram | Critical | [ ] | Include in ARCH-ANCHOR.md or separate |
| Database schema documentation | Important | [ ] | Supabase schema with table descriptions |
| API security model | Important | [ ] | Authentication, authorization, rate limiting |
| Deployment architecture | Important | [ ] | Hetzner setup, CI/CD pipeline, monitoring |
| Disaster recovery plan | Nice-to-have | [ ] | Backup procedures, recovery time objectives |

### Security Audit

| Check | Priority | Status | Notes |
|-------|----------|--------|-------|
| Authentication system review | Critical | [ ] | Supabase Auth — document configuration |
| Authorization and access control | Critical | [ ] | Row-level security, role-based access |
| API security (rate limiting, input validation) | Important | [ ] | Document protections in place |
| Data encryption at rest | Important | [ ] | Supabase encrypts at rest by default |
| Data encryption in transit | Important | [ ] | HTTPS everywhere — verify no mixed content |
| Secret management | Critical | [ ] | No hardcoded secrets, environment variables properly managed |
| Dependency vulnerability scan | Important | [ ] | Run `npm audit` or equivalent, document results |
| Penetration test results | Nice-to-have | [ ] | Consider before seed round ($3K-10K for basic pentest) |
| SOC 2 compliance | Nice-to-have | [ ] | Not required at seed stage; plan for Series A if targeting enterprise |

### Infrastructure Resilience

| Factor | Current State | Investor Concern |
|--------|--------------|-----------------|
| Uptime history | [Document] | Investors want >99.5% uptime |
| Backup frequency | [Document] | Daily minimum, hourly preferred for production data |
| Recovery time objective (RTO) | [Document] | How quickly can the service be restored? |
| Single points of failure | [Identify] | List and document mitigation plans |
| Monitoring and alerting | [Document] | How are outages detected and who is notified? |

---

## 8. Team and Background

### Founder Background

| Document | Priority | Status | Notes |
|----------|----------|--------|-------|
| Founder CV / resume | Critical | [ ] | Highlight relevant experience (SEO, content, MENA market) |
| LinkedIn profile (updated) | Critical | [ ] | Must match pitch deck claims |
| Background check consent | Important | [ ] | Some institutional investors require this |
| Reference contacts | Important | [ ] | 3-5 professional references (clients, colleagues, advisors) |
| Previous venture experience | Nice-to-have | [ ] | If applicable — prior startups, exits, or roles |

### Advisory Board

| Document | Priority | Status | Notes |
|----------|----------|--------|-------|
| Advisor agreements (signed) | Important | [ ] | Standard FAST Agreement with vesting terms |
| Advisor bios and qualifications | Important | [ ] | Why each advisor adds value |
| Advisory board structure | Nice-to-have | [ ] | How often they meet, what they contribute |

### Hiring Plan

| Document | Priority | Status | Notes |
|----------|----------|--------|-------|
| First 5 hires (roles, JDs, timing) | Critical | [ ] | Demonstrates you've thought about team building |
| Compensation benchmarks | Important | [ ] | MENA market salary data for target roles |
| Org chart (current and 12-month target) | Important | [ ] | Visual representation of team growth |

---

## 9. Market and Competitive Data

| Document | Priority | Status | Notes |
|----------|----------|--------|-------|
| Market size analysis (TAM/SAM/SOM) | Critical | [ ] | Cited sources, bottom-up calculation preferred |
| Competitive landscape overview | Critical | [ ] | See `battle-cards.md` — already documented |
| Customer interview transcripts / summaries | Important | [ ] | Demonstrates customer discovery work |
| Market validation data | Important | [ ] | Survey results, waitlist signups, LOIs |
| Industry reports (MENA digital content) | Nice-to-have | [ ] | Third-party validation of market opportunity |

---

## 10. Due Diligence Data Room Setup

### Virtual Data Room Structure

Set up a virtual data room (Google Drive or Notion) with the following folder structure:

```
ChainIQ Due Diligence Data Room/
├── 1-Corporate/
│   ├── Certificate of Incorporation
│   ├── Articles of Association
│   ├── Board Resolutions
│   └── Good Standing Certificate
├── 2-Financial/
│   ├── P&L Statements
│   ├── Balance Sheet
│   ├── Bank Statements
│   ├── Financial Model
│   └── Cap Table
├── 3-Product-Technology/
│   ├── ARCH-ANCHOR.md
│   ├── Architecture Diagram
│   ├── Security Audit Summary
│   └── Technical Roadmap
├── 4-Legal-IP/
│   ├── IP Assignment Agreement
│   ├── Trademark Records
│   ├── Privacy Policy
│   ├── Terms of Service
│   └── Open Source License Audit
├── 5-Customers/
│   ├── Customer List
│   ├── Subscription Agreement Template
│   ├── Case Studies
│   └── Testimonials
├── 6-Market/
│   ├── Market Size Analysis
│   ├── Competitive Analysis
│   └── Industry Reports
├── 7-Team/
│   ├── Founder CV
│   ├── Advisor Agreements
│   └── Hiring Plan
└── 8-Compliance/
    ├── Privacy Policy
    ├── GDPR Compliance Checklist
    ├── Data Processing Agreement
    └── Sub-processor List
```

### Access Controls

- Read-only access for all investors
- Watermarked PDFs for sensitive documents (financial statements, customer lists)
- Access logging to track which documents investors view (available in DocSend, Google Drive activity log)
- NDA signed before data room access granted
- Revoke access within 24 hours if investor passes

### Data Room Tools

| Tool | Cost | Best For |
|------|------|----------|
| Google Drive (organized folders) | Free | Angel round, informal DD |
| DocSend | $45/mo | Tracks document views, good for pitch decks |
| Notion | Free-$10/mo | Clean organization, easy to share |
| Carta | Included in plan | Cap table specific DD |
| Dealroom.co | Varies | Formal seed/Series A DD |

**Recommendation:** Google Drive for angel round (free, sufficient). Upgrade to DocSend for seed round (tracking + watermarking).

---

## 11. Pre-Due Diligence Action Items

### 30 Days Before Fundraise

- [ ] Incorporate entity (if not already done)
- [ ] IP assignment agreement signed (founder to company)
- [ ] Bank account opened in company name
- [ ] Financial records organized (even if minimal)
- [ ] Privacy policy and Terms of Service published on chainiq.io
- [ ] Cap table formalized in spreadsheet
- [ ] Data room created and populated with available documents
- [ ] Pitch deck finalized and reviewed by 2-3 advisors
- [ ] 3 professional references confirmed and briefed

### 14 Days Before First Meeting

- [ ] Financial model stress-tested with 3 scenarios
- [ ] Technical architecture diagram updated
- [ ] Customer list with metrics ready
- [ ] One-page executive summary ready for email
- [ ] Demo environment stable and impressive
- [ ] Competitive analysis current (check for recent competitor moves)

### Ongoing During Fundraise

- [ ] Update data room within 48 hours of any material change
- [ ] Track all investor questions — common questions become FAQ additions
- [ ] Document all verbal commitments in writing
- [ ] Keep backup copies of all DD documents offline

---

*Last updated: 2026-03-28*
