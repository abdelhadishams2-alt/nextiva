# ChainIQ Lead Scoring Framework

**Document:** Step 21 — Marketing Strategy & Channel Plan
**Version:** 1.0
**Last Updated:** 2026-03-28

---

## Overview

This framework defines how ChainIQ scores and prioritizes leads from initial website visit through to sales-qualified opportunity. The model combines demographic fit (who they are) with behavioral signals (what they do) to produce a composite score that determines routing, outreach priority, and nurture sequencing. The framework is designed for a solo developer operating without a dedicated sales team — scoring must automate prioritization so the founder's limited selling time goes to the highest-probability prospects.

---

## 1. Scoring Model Architecture

### 1.1 Score Composition

```
Total Lead Score = Demographic Score (max 100) + Behavioral Score (max 100)
                 = Max 200 points

Qualification Thresholds:
  - Cold Lead:        0-29 points
  - Warm Lead:       30-49 points
  - MQL:             50-79 points  (Marketing Qualified Lead)
  - SQL:             80-119 points (Sales Qualified Lead)
  - Hot Opportunity: 120+ points   (Immediate founder outreach)
```

### 1.2 Score Decay

| Rule | Details |
|---|---|
| **Behavioral decay** | Behavioral points decay by 20% every 30 days of inactivity |
| **Demographic persistence** | Demographic scores do not decay (company size doesn't change) |
| **Re-engagement reset** | Any new behavioral event stops the decay clock for 30 days |
| **Maximum decay** | Behavioral score cannot decay below 0 |
| **Decay calculation** | Run weekly (every Monday at 00:00 UTC) |

---

## 2. Demographic Scoring (Who They Are)

### 2.1 Company & Organization Attributes

| Attribute | Criteria | Points | Rationale |
|---|---|---|---|
| **Company Size** | 1-10 employees | +3 | Small agency — Growth tier prospect |
| | 11-50 employees | +5 | Mid-size agency — Starter tier prospect |
| | 51-200 employees | +8 | Large agency or small publisher — Professional tier |
| | 201-1,000 employees | +10 | Enterprise publisher — Enterprise tier prospect |
| | 1,000+ employees | +12 | Tier-1 media group (SRMG-scale) |
| **Industry Vertical** | Publishing / Media | +15 | Primary target vertical |
| | Digital Marketing / SEO Agency | +12 | Secondary target — agency reseller |
| | Content Marketing | +10 | Aligned use case |
| | E-commerce | +5 | Content needs but not primary target |
| | Other | +0 | Low fit |
| **Geographic Region** | Saudi Arabia | +15 | Highest-priority market (SRMG home market) |
| | UAE | +15 | Second-priority market (agency hub) |
| | Egypt | +12 | Largest Arabic content market by volume |
| | Jordan, Lebanon | +10 | Active digital content markets |
| | Kuwait, Qatar, Bahrain, Oman | +10 | GCC markets with high purchasing power |
| | Other MENA (Morocco, Tunisia, Iraq) | +8 | Broader MENA |
| | Non-MENA (English-speaking markets) | +3 | Secondary market |
| | Non-target regions | +0 | Low priority |

### 2.2 Contact-Level Attributes

| Attribute | Criteria | Points | Rationale |
|---|---|---|---|
| **Job Title / Role** | C-Suite (CEO, CTO, CMO) | +10 | Decision maker |
| | VP / Director (Content, Digital, Editorial) | +10 | Decision maker or strong influencer |
| | Head of Content / Editorial Manager | +8 | Primary user + influencer |
| | SEO Manager / Content Strategist | +7 | Primary user, may not have budget authority |
| | Content Writer / Editor | +3 | End user but not decision maker |
| | Developer / Technical role | +5 | Integration champion |
| | Other / Unknown | +0 | Cannot assess fit |
| **Language Indicator** | Interacts in Arabic | +5 | Signals Arabic content need |
| | Bilingual interaction (Arabic + English) | +3 | Likely managing multilingual content |
| | English only | +0 | May not have Arabic content need |

### 2.3 Demographic Score Ranges

| Score Range | Interpretation | Example Profile |
|---|---|---|
| 0-15 | Poor fit | Small non-MENA company, non-target industry |
| 16-30 | Moderate fit | Right region but wrong industry, or right industry but wrong region |
| 31-50 | Good fit | MENA publisher or agency, relevant role |
| 51-70 | Strong fit | Large MENA publisher, decision-maker role, Arabic-focused |
| 71-100 | Ideal fit | Enterprise MENA publisher, C-suite contact, publishing vertical |

---

## 3. Behavioral Scoring (What They Do)

### 3.1 Website Engagement

| Behavior | Points | Decay? | Notes |
|---|---|---|---|
| First website visit | +2 | Yes | One-time |
| Return website visit | +3 | Yes | Per visit, max 3x/week |
| Viewed pricing page | +20 | Yes | Strong buying signal |
| Viewed pricing page 2+ times | +10 (additional) | Yes | Repeated pricing view = very high intent |
| Spent 2+ minutes on pricing page | +5 | Yes | Deep consideration |
| Read blog post (75%+ scroll) | +3 | Yes | Per post, max 5 points/week |
| Read Arabic blog post | +5 | Yes | Signals Arabic content need |
| Downloaded case study | +10 | Yes | High-intent content consumption |
| Visited API documentation | +8 | Yes | Technical evaluation in progress |
| Viewed comparison page (vs Jasper/Surfer) | +8 | Yes | Active competitive evaluation |
| Clicked annual pricing toggle | +5 | Yes | Considering commitment level |

### 3.2 Conversion Events

| Behavior | Points | Decay? | Notes |
|---|---|---|---|
| Signed up for email list | +10 | Yes | Opted into communication |
| Requested a demo | +25 | Yes | Explicit sales intent |
| Started free trial | +30 | Yes | Strongest self-serve signal |
| Completed trial signup (form submitted) | +5 (additional) | Yes | Passed the friction point |
| Submitted enterprise contact form | +25 | Yes | Enterprise-tier interest |

### 3.3 Product Usage (Trial/Paid)

| Behavior | Points | Decay? | Notes |
|---|---|---|---|
| Generated first article | +15 | Yes | Activation milestone |
| Generated 3+ articles | +25 | Yes | Meaningful engagement — sees value |
| Generated 10+ articles | +10 (additional) | Yes | Power user signal |
| Connected Google Search Console | +15 | Yes | Deep integration = stickiness |
| Created voice profile | +10 | Yes | Customization = investment |
| Completed voice training | +10 (additional) | Yes | Significant time investment |
| Invited team member | +15 | Yes | Organizational adoption signal |
| Used API key | +10 | Yes | Technical integration |
| Changed quality threshold | +5 | Yes | Customizing pipeline = understands product |
| Generated article in Arabic | +10 | Yes | Core value proposition alignment |

### 3.4 Email Engagement

| Behavior | Points | Decay? | Notes |
|---|---|---|---|
| Opened outreach email | +3 | Yes | Per email, max 3x/week |
| Clicked link in email | +5 | Yes | Per email |
| Replied to outreach email | +15 | Yes | Direct engagement |
| Forwarded email to colleague | +10 | Yes | Internal champion building |

### 3.5 Social & Event Engagement

| Behavior | Points | Decay? | Notes |
|---|---|---|---|
| Engaged with LinkedIn post (like/comment) | +3 | Yes | Per interaction, max 5/week |
| Connected on LinkedIn | +5 | Yes | One-time |
| Attended webinar/event | +15 | Yes | Significant time commitment |
| Met at in-person event | +20 | Yes | Highest-quality interaction |

### 3.6 Behavioral Score Ranges

| Score Range | Interpretation | Example Behavior Pattern |
|---|---|---|
| 0-10 | Passive | Single website visit, no engagement |
| 11-25 | Curious | Read a blog post, visited pricing page |
| 26-45 | Interested | Multiple visits, downloaded case study, email engagement |
| 46-65 | Engaged | Started trial, generated articles, demo request |
| 66-100 | Highly Active | Trial user with 3+ articles, GSC connected, voice profile created |

---

## 4. Lead Qualification Thresholds

### 4.1 Threshold Definitions

| Stage | Score Range | Definition | Action |
|---|---|---|---|
| **Cold Lead** | 0-29 | Low fit and/or low engagement | Automated nurture only — monthly newsletter |
| **Warm Lead** | 30-49 | Moderate fit OR moderate engagement but not both | Automated nurture — weekly educational content |
| **MQL** | 50-79 | Good fit + meaningful engagement | Priority nurture — case studies, demo invitations, personalized email |
| **SQL** | 80-119 | Strong fit + high engagement OR trial user with good demographics | Founder outreach within 24 hours — personalized demo offer |
| **Hot Opportunity** | 120+ | Ideal fit + deep product engagement | Founder outreach within 4 hours — direct call or meeting |

### 4.2 Routing Rules

| Condition | Route | Response Time |
|---|---|---|
| Score reaches 50 (MQL) | Add to MQL list, trigger personalized email sequence | Within 24 hours |
| Score reaches 80 (SQL) | Founder notification (email + Slack/mobile) | Within 24 hours |
| Score reaches 120 (Hot) | Founder notification (urgent) + auto-schedule outreach | Within 4 hours |
| Demo request submitted (any score) | Founder notification immediately | Within 4 hours |
| Enterprise contact form (any score) | Founder notification immediately | Within 2 hours |
| Trial signup + demographic score > 40 | Founder notification + priority onboarding | Within 24 hours |

### 4.3 Score Override Rules

| Scenario | Override |
|---|---|
| Contact explicitly requests "not interested" / unsubscribe | Set score to 0, flag as disqualified |
| Contact is a competitor (Surfer, Clearscope, Jasper employee) | Set score to 0, flag as competitor |
| Contact is an investor or partner prospect | Flag separately — do not score as customer lead |
| Contact is SRMG or existing pilot participant | Flag as existing relationship — bypass scoring |
| Contact has invalid email (role-based, disposable) | Reduce score by 20 points |

---

## 5. Scoring Examples

### 5.1 Example A: Ideal Enterprise Lead

| Factor | Points |
|---|---|
| Company: 500 employees | +10 |
| Industry: Publishing | +15 |
| Region: Saudi Arabia | +15 |
| Role: Head of Digital Content | +8 |
| Language: Arabic interaction | +5 |
| **Demographic Subtotal** | **53** |
| Visited website 3 times | +8 |
| Viewed pricing page | +20 |
| Downloaded case study | +10 |
| Requested demo | +25 |
| **Behavioral Subtotal** | **63** |
| **Total Score** | **116 (SQL)** |

**Action:** Founder outreach within 24 hours with personalized demo focusing on Enterprise tier and Arabic capabilities.

### 5.2 Example B: Small Agency on Trial

| Factor | Points |
|---|---|
| Company: 15 employees | +5 |
| Industry: Digital Marketing/SEO | +12 |
| Region: UAE | +15 |
| Role: Agency Founder | +10 |
| Language: Bilingual | +3 |
| **Demographic Subtotal** | **45** |
| Started free trial | +30 |
| Generated first article | +15 |
| Generated 3+ articles | +25 |
| Generated article in Arabic | +10 |
| **Behavioral Subtotal** | **80** |
| **Total Score** | **125 (Hot Opportunity)** |

**Action:** Founder outreach within 4 hours — this agency is deeply engaged and could become a reseller partner.

### 5.3 Example C: Casual Browser

| Factor | Points |
|---|---|
| Company: Unknown | +0 |
| Industry: Unknown | +0 |
| Region: Egypt (based on IP) | +12 |
| Role: Unknown | +0 |
| Language: Arabic site version | +5 |
| **Demographic Subtotal** | **17** |
| Single website visit | +2 |
| Read one blog post | +3 |
| **Behavioral Subtotal** | **5** |
| **Total Score** | **22 (Cold)** |

**Action:** Automated nurture only. Add to monthly newsletter. No manual outreach.

### 5.4 Example D: Competitor Research

| Factor | Points |
|---|---|
| Company: Surfer SEO (identified) | Override → 0 |
| **Total Score** | **0 (Disqualified)** |

**Action:** Flag as competitor. Track for competitive intelligence. No outreach.

---

## 6. Implementation Plan

### 6.1 Phase 1: Manual Scoring (Month 1-2)

During bootstrap phase with < 50 leads, scoring runs manually:

| Tool | Purpose |
|---|---|
| Google Sheets | Lead tracking spreadsheet with scoring formula columns |
| GA4 audiences | Identify high-intent website visitors |
| Email tracking (Streak/HubSpot free) | Track email opens, clicks, replies |
| Manual review | Founder reviews leads weekly, applies scores |

**Spreadsheet Columns:**
`Name | Email | Company | Size | Industry | Region | Role | Demo Score | Behavioral Score | Total | Stage | Last Activity | Next Action | Notes`

### 6.2 Phase 2: Semi-Automated (Month 3-6)

| Tool | Purpose |
|---|---|
| HubSpot Free CRM | Lead management with basic scoring |
| PostHog | Product usage events feed into scoring |
| Zapier/n8n | Connect PostHog events → CRM score updates |
| Email sequences | Automated nurture based on score thresholds |

### 6.3 Phase 3: Fully Automated (Month 6+)

| Tool | Purpose |
|---|---|
| HubSpot Marketing Hub (or equivalent) | Full lead scoring automation |
| PostHog → HubSpot integration | Real-time product usage scoring |
| GA4 → HubSpot integration | Website behavior scoring |
| Automated routing | Score-based notifications and assignment |
| Predictive scoring | ML-based scoring using conversion patterns |

---

## 7. Scoring Model Maintenance

| Activity | Frequency | Owner |
|---|---|---|
| Review score-to-conversion correlation | Monthly | Founder |
| Adjust point values based on actual conversion data | Quarterly | Founder |
| Review decay rates | Quarterly | Founder |
| Add new behavioral events as product evolves | As needed | Dev |
| Audit disqualified leads for false negatives | Monthly | Founder |
| Compare MQL → SQL → Customer conversion rates by score band | Monthly | Founder |

### 7.1 Calibration Criteria

After 20+ conversions, validate the model:

| Check | Action If Failing |
|---|---|
| > 30% of paying customers had SQL scores < 80 | Lower SQL threshold or add missing behavioral signals |
| > 50% of SQLs never convert | Raise SQL threshold or add demographic disqualifiers |
| Hot opportunities (120+) convert at < 40% | Review what inflates scores without indicating true intent |
| Demographic-heavy scores (high demo, low behavioral) convert poorly | Increase behavioral weight or add minimum behavioral threshold |
| Certain channels produce high-scoring leads that don't convert | Add channel-specific score adjustments |
