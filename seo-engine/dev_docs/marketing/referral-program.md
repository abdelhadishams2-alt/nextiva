# Step 26 — Referral Program Design

> **Status:** Planning
> **Owner:** Founder / Growth
> **Implementation:** Phase 1 via referral codes in user settings
> **Tracking:** usage_logs table in Supabase

---

## 1. Program Overview

The ChainIQ referral program turns satisfied customers into a scalable acquisition channel. In a niche market like MENA Arabic publishing, word-of-mouth carries exceptional weight — publishers talk to publishers, agency owners share tools at industry events, and editorial teams recommend solutions within their professional networks. A structured referral program harnesses this organic behavior and incentivizes it.

The program has two tiers: a standard referral program open to all customers, and an ambassador program for power users who demonstrate high engagement and advocacy potential.

---

## 2. Standard Referral Program

### Incentive Structure

| Party | Incentive | Conditions |
|-------|-----------|------------|
| **Referrer** (existing customer) | 1 month free on their current plan | Referred customer must complete first paid month |
| **Referred** (new customer) | 20% off first 3 months | Must sign up using referral code |

### Economic Analysis

Worst-case cost per referral (Professional tier referrer, Growth tier referred):

| Component | Value |
|-----------|-------|
| Referrer reward: 1 month Professional free | -$6,000 |
| Referred discount: 20% off Growth for 3 months | -$480 (3 x $160) |
| Total acquisition cost | $6,480 |
| Referred customer LTV (12 months Growth) | $9,600 |
| Net positive after | Month 9 |

Best-case (Growth referrer, Professional referred):

| Component | Value |
|-----------|-------|
| Referrer reward: 1 month Growth free | -$800 |
| Referred discount: 20% off Professional for 3 months | -$3,600 (3 x $1,200) |
| Total acquisition cost | $4,400 |
| Referred customer LTV (12 months Professional) | $72,000 |
| Net positive after | Month 1 |

**Average expected CAC via referral: $2,500-4,000** — significantly lower than cold outreach or paid advertising in the MENA market, where digital ad CPCs for B2B SaaS run $15-40.

### Referral Caps and Guardrails

| Rule | Rationale |
|------|-----------|
| Maximum 3 free months accrued per referrer per quarter | Prevents abuse and caps liability |
| Referral code expires 90 days after generation | Creates urgency |
| Self-referral prohibited (same billing email/org domain) | Obvious fraud prevention |
| Referred customer must remain active for 30 days | Prevents sign-up-and-cancel gaming |
| Referrer must be on an active paid plan to earn rewards | No free-tier referral farming |
| One referral code per referred customer | No stacking |

---

## 3. Referral Code System

### Code Format

Referral codes follow the pattern: `CIQ-[USERNAME]-[4-RANDOM]`

Examples:
- `CIQ-SRMG-A7K2`
- `CIQ-AHMED-M9X1`
- `CIQ-DUBAIMEDIA-P3Q8`

The username portion is derived from the referrer's account (first 12 characters, alphanumeric only). The 4-character random suffix prevents guessing.

### Implementation: User Settings Integration

**Location in UI:** Dashboard > Settings > Referral Program

**User-facing elements:**

1. **Your Referral Code** — displayed prominently with one-click copy button
2. **Share Link** — `https://chainiq.io/signup?ref=CIQ-USERNAME-XXXX` with copy and share buttons (LinkedIn, WhatsApp, Email)
3. **Referral Stats** — number of referrals made, pending (awaiting 30-day activation), successful, rewards earned
4. **Reward History** — table showing each referral, status, reward applied date

### Database Schema (Supabase)

**Table: referral_codes**

```sql
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID REFERENCES auth.users(id),
  code VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),
  is_active BOOLEAN DEFAULT true,
  total_uses INT DEFAULT 0,
  successful_conversions INT DEFAULT 0
);
```

**Table: referral_events**

```sql
CREATE TABLE referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID REFERENCES referral_codes(id),
  referred_user_id UUID REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'pending', -- pending, activated, expired, cancelled
  signed_up_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ, -- when 30-day threshold met
  referrer_reward_applied BOOLEAN DEFAULT false,
  referred_discount_applied BOOLEAN DEFAULT false,
  notes TEXT
);
```

**Tracking via usage_logs:**

All referral events are also logged in the existing `usage_logs` table with `event_type = 'referral'` for unified analytics:

```sql
INSERT INTO usage_logs (user_id, event_type, event_data, created_at)
VALUES (
  referrer_user_id,
  'referral',
  jsonb_build_object(
    'action', 'code_shared', -- or 'signup', 'activated', 'reward_applied'
    'referral_code', code,
    'referred_user_id', referred_user_id,
    'referred_plan', plan_name
  ),
  NOW()
);
```

### Automation Flow

1. **Code generation:** Automatic when user first visits Settings > Referral. Code stored in `referral_codes`.
2. **Signup tracking:** When new user signs up with `?ref=` parameter, create `referral_events` entry with status `pending`.
3. **30-day check:** Supabase Edge Function runs daily, checks all `pending` referral events older than 30 days where the referred user is still on an active paid plan. Updates status to `activated`.
4. **Reward application:** On activation, apply 1 free month credit to referrer's next invoice (Stripe credit note or coupon). Apply 20% discount coupon to referred user's subscription for months 1-3.
5. **Notifications:** Email both parties on activation. Email referrer when referred user signs up (immediate positive feedback loop).

---

## 4. Ambassador Program

### Overview

The ambassador program is an invitation-only tier for power users who demonstrate high engagement, produce quality content using ChainIQ, and actively promote the platform within their professional network.

### Qualification Criteria

To be considered for the ambassador program, a user must meet at least 4 of the following 6 criteria:

| Criterion | Threshold | Measurement |
|-----------|-----------|-------------|
| Account age | 3+ months active | Subscription history |
| Content volume | 50+ articles generated | Article count in usage_logs |
| Quality scores | Average quality gate score > 80% | Scoring system data |
| Referrals | 2+ successful referrals | referral_events table |
| Community engagement | Active in Discord/LinkedIn group | Manual assessment |
| Public advocacy | Published testimonial, case study, or social mention | Manual tracking |

### Ambassador Benefits

| Benefit | Details |
|---------|---------|
| **Free tier upgrade** | Upgraded one tier above their current plan at no cost (e.g., Growth -> Starter, Starter -> Professional). If already on Enterprise, receive 50% discount. |
| **Co-marketing** | Featured in ChainIQ case studies, blog posts, and social media. Logo placement on partner page. |
| **Early access** | Beta access to all new features 30 days before general release. Direct Slack channel with founder. |
| **Speaking opportunities** | Invited to co-present at ChainIQ webinars and events. Positioned as Arabic content expert. |
| **Revenue share** | 25% revenue share on referrals (vs. standard free-month model). Paid monthly via wire transfer. |
| **Product influence** | Quarterly product roadmap review. Priority feature requests. Vote on upcoming feature priorities. |

### Ambassador Expectations

Ambassadors are expected to:

- Make at least 1 successful referral per quarter
- Participate in at least 2 community events per quarter (Discord, webinar, LinkedIn)
- Provide a written testimonial or case study within first 60 days
- Share at least 1 social media post about ChainIQ per month
- Provide product feedback through dedicated feedback channel
- Maintain active use of ChainIQ (minimum 10 articles/month)

### Ambassador Onboarding

1. **Invitation email** with ambassador program details and acceptance form
2. **Welcome call** (30 min) with founder — relationship building, expectations alignment, co-marketing planning
3. **Ambassador kit delivery:** branded assets (logo, social templates, email signature badge), talking points document, FAQ for their referrals
4. **Slack channel access** — private `#ambassadors` channel
5. **First co-marketing activity** scheduled within 30 days (usually a joint LinkedIn post or case study interview)

### Ambassador Review Cadence

Quarterly review of all ambassadors:
- Are they meeting minimum activity thresholds?
- What is their referral and revenue contribution?
- Are they representing the brand positively?
- Do they need additional support or resources?

Ambassadors who fall below expectations for 2 consecutive quarters receive a friendly check-in. After 3 quarters of inactivity, they are moved back to standard referral program with gratitude and option to re-qualify.

---

## 5. Referral Program Launch Plan

### Phase 1: Soft Launch (Month 1-2)

- Implement referral code system in user settings
- Enable code generation and tracking
- Manual reward application (founder applies Stripe credits)
- Announce to first 10 customers via personal email
- Collect feedback on UX and incentive structure

### Phase 2: Public Launch (Month 3-4)

- Automate reward application via Stripe webhooks
- Add referral program page to marketing site
- In-app referral prompts (after quality gate pass, after 10th article, monthly engagement milestone)
- Email campaign to all active users announcing the program
- Social media announcement on LinkedIn and Twitter

### Phase 3: Ambassador Program (Month 5-6)

- Identify top 3-5 referrers and high-engagement users
- Send ambassador invitations
- Set up ambassador Slack channel
- Produce first co-marketing content (case study)
- Establish quarterly review cadence

### Phase 4: Optimization (Month 6+)

- A/B test referral incentives (1 month free vs. account credit vs. cash)
- Test referred customer discounts (20% off vs. free month vs. extended trial)
- Analyze referral channel performance (which segment refers most?)
- Consider increasing ambassador revenue share based on program ROI
- Evaluate migration from Google Sheets tracking to dedicated referral platform (e.g., Rewardful, FirstPromoter) if volume exceeds 100 referrals/quarter

---

## 6. Communication Templates

### Referral Invitation Email (to existing customers)

**Subject:** Help a fellow publisher discover Arabic AI content — earn a free month

> Hi [Name],
>
> You've been using ChainIQ to [specific achievement: "generate X articles" / "achieve Y% quality scores"]. We'd love your help spreading the word to other MENA publishers and content teams.
>
> **Here's how it works:**
> - Share your unique referral code: **[CODE]**
> - When someone signs up and stays for 30 days, you get 1 month free on your current plan
> - They get 20% off their first 3 months
>
> You can find your referral link and stats in Settings > Referral Program.
>
> Know someone who'd benefit? [Share Link Button]

### Ambassador Invitation Email

**Subject:** Invitation: ChainIQ Ambassador Program

> Hi [Name],
>
> Your engagement with ChainIQ has been outstanding — [specific metrics: articles generated, referrals made, community contributions]. We'd like to invite you to join our Ambassador Program.
>
> **As an Ambassador, you'll receive:**
> - Free upgrade to [next tier] ($X/mo value)
> - 25% revenue share on all referrals
> - Early access to new features
> - Co-marketing opportunities (case studies, webinars, social)
> - Direct line to the product team
>
> This is an exclusive program for our most engaged users. Interested? Reply to this email and we'll schedule a welcome call.

---

## 7. Fraud Prevention

| Risk | Mitigation |
|------|------------|
| Self-referral (multiple accounts) | Block same billing email domain, same IP within 24 hours, same payment method |
| Referral farming (sign up and cancel) | 30-day activation threshold before reward |
| Code sharing on coupon sites | Monitor referral code appearance on discount aggregators; disable codes found on public sites |
| Fake signups | Require valid payment method at signup (even for discounted plans) |
| Ambassador gaming | Quarterly review of ambassador activity; automated alerts for unusual referral patterns |

---

## 8. Metrics and Reporting

| Metric | Target | Frequency |
|--------|--------|-----------|
| Referral codes generated | Track total | Weekly |
| Codes shared (link clicks) | >50% of generated codes | Weekly |
| Signups from referrals | 5-10/month by Month 6 | Weekly |
| 30-day activation rate | >60% | Monthly |
| Referral CAC | <$3,000 | Monthly |
| Referral revenue as % of total MRR | >20% by Month 12 | Monthly |
| Ambassador count | 5-10 by Month 12 | Quarterly |
| Ambassador referral rate | 2+ per quarter per ambassador | Quarterly |
| NPS of referred customers | >50 | Quarterly |

---

*Last updated: 2026-03-28*
