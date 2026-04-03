# ChainIQ Analytics & Tracking Plan

**Document:** Step 21 — Marketing Strategy & Channel Plan
**Version:** 1.0
**Last Updated:** 2026-03-28

---

## Overview

ChainIQ's analytics architecture spans two distinct domains: **website analytics** (marketing site at chainiq.io) and **product analytics** (the ChainIQ platform itself). Each requires different tools, event schemas, and reporting cadences. This document defines the complete tracking plan for both domains, including event taxonomies, UTM strategies, dashboards, and KPI definitions.

---

## 1. Website Analytics — Google Analytics 4

### 1.1 GA4 Configuration

| Setting | Value |
|---|---|
| **Property Name** | ChainIQ - Website |
| **Data Stream** | Web — chainiq.io |
| **Measurement ID** | G-XXXXXXXXXX (to be generated) |
| **Data Retention** | 14 months |
| **Cross-Domain Tracking** | chainiq.io, app.chainiq.io, docs.chainiq.io |
| **Enhanced Measurement** | Page views, scrolls, outbound clicks, site search, form interactions |
| **Google Signals** | Enabled (for demographic data) |
| **Consent Mode** | Enabled — GDPR/CCPA compliant with cookie banner |

### 1.2 Custom Events — Website

| Event Name | Trigger | Parameters | Priority |
|---|---|---|---|
| `signup_start` | User clicks "Start Free Trial" CTA | `cta_location`, `page_path`, `tier_selected` | Critical |
| `signup_complete` | Registration form submitted successfully | `method` (email/google), `tier`, `language_preference` | Critical |
| `demo_request` | Demo request form submitted | `company_size`, `role`, `source` | Critical |
| `pricing_view` | User views pricing page | `scroll_depth`, `time_on_page` | High |
| `pricing_tier_click` | User clicks a specific tier CTA | `tier_name`, `annual_toggle_state` | High |
| `case_study_download` | Case study PDF downloaded | `case_study_name`, `format` | Medium |
| `blog_read` | Blog post scroll depth > 75% | `post_title`, `language`, `category` | Medium |
| `faq_expand` | FAQ item clicked/expanded | `question_text`, `page_path` | Low |
| `language_switch` | User switches site language (EN/AR) | `from_language`, `to_language` | Medium |
| `contact_form_submit` | Enterprise contact form submitted | `company_name`, `employee_count` | Critical |

### 1.3 Custom Dimensions

| Dimension | Scope | Values | Purpose |
|---|---|---|---|
| `user_language` | User | en, ar, fr | Segment Arabic vs English visitors |
| `visitor_type` | Session | new, returning, trial_user, customer | Lifecycle stage tracking |
| `traffic_source_detail` | Session | product_hunt, linkedin_organic, linkedin_ad, email_outreach, event, referral | Granular channel attribution |
| `content_language` | Event | en, ar | Which language content is consumed |
| `pricing_tier_interest` | User | growth, starter, professional, enterprise | Which tier the user engaged with most |

### 1.4 Conversion Goals

| Goal | Type | Value |
|---|---|---|
| Trial Signup | Primary | $150 (estimated 10% conversion to paid at $3K, amortized over 2 months) |
| Demo Request | Primary | $300 (estimated 20% close rate at $6K avg) |
| Enterprise Contact | Primary | $600 (estimated 20% close rate at $12K) |
| Email List Signup | Secondary | $5 |
| Case Study Download | Secondary | $10 |
| Blog Engagement (75%+ scroll) | Secondary | $1 |

### 1.5 GA4 Audiences (for Remarketing)

| Audience | Definition | Use Case |
|---|---|---|
| Pricing Page Visitors | Viewed `/pricing` in last 30 days, did not signup | LinkedIn retargeting |
| Blog Readers (Arabic) | Read 2+ Arabic blog posts in last 60 days | Arabic-language ad campaigns |
| Trial Dropoffs | Completed `signup_start` but not `signup_complete` | Abandoned signup recovery |
| High-Intent Visitors | 3+ sessions, viewed pricing + case study | Priority outreach list |
| Existing Customers | User property `visitor_type` = customer | Exclude from acquisition campaigns |

---

## 2. Product Analytics — PostHog (Recommended)

### 2.1 Why PostHog Over Mixpanel

| Criteria | PostHog | Mixpanel |
|---|---|---|
| **Free Tier** | 1M events/month | 20M events/month |
| **Self-Hosting** | Yes (data sovereignty for MENA clients) | No |
| **Session Recording** | Included | Separate tool needed |
| **Feature Flags** | Included | Not included |
| **Open Source** | Yes | No |
| **Pricing at Scale** | More predictable | Usage spikes can surprise |
| **EU/MENA Data Residency** | Self-host anywhere | US-only on free tier |

**Recommendation:** Start with PostHog Cloud (free tier), migrate to self-hosted when data sovereignty becomes a sales requirement for enterprise customers.

### 2.2 Product Event Taxonomy

#### 2.2.1 Article Generation Events

| Event Name | Trigger | Properties |
|---|---|---|
| `article_generation_started` | User initiates article generation | `topic`, `language`, `target_length`, `voice_profile_id`, `tier` |
| `article_generation_completed` | Pipeline completes successfully | `article_id`, `duration_seconds`, `quality_score`, `word_count`, `language` |
| `article_generation_failed` | Pipeline fails at any stage | `failure_stage`, `error_type`, `language` |
| `article_quality_gate_passed` | Article meets quality threshold | `article_id`, `score`, `threshold`, `attempt_number` |
| `article_quality_gate_failed` | Article below quality threshold | `article_id`, `score`, `threshold`, `sections_failed` |
| `article_regenerated` | User triggers manual regeneration | `article_id`, `reason`, `previous_score` |
| `article_exported` | Article downloaded or pushed to CMS | `article_id`, `format`, `destination` |
| `article_edited` | User edits generated article | `article_id`, `edit_type`, `section_edited`, `characters_changed` |

#### 2.2.2 Feature Adoption Events

| Event Name | Trigger | Properties |
|---|---|---|
| `voice_profile_created` | User creates new voice profile | `profile_name`, `language`, `training_corpus_size` |
| `voice_profile_training_completed` | Voice training finishes | `profile_id`, `training_duration`, `sample_count` |
| `gsc_connected` | User connects Google Search Console | `property_count`, `domain` |
| `gsc_data_viewed` | User views GSC analytics | `date_range`, `metrics_viewed` |
| `api_key_created` | User generates API key | `key_count_total`, `tier` |
| `quality_threshold_changed` | User modifies quality threshold | `old_threshold`, `new_threshold` |
| `component_registry_customized` | User modifies component settings | `component_name`, `action` |
| `team_member_invited` | User invites team member | `role`, `team_size_after` |

#### 2.2.3 Onboarding Events

| Event Name | Trigger | Properties |
|---|---|---|
| `onboarding_started` | User begins onboarding flow | `signup_method`, `tier`, `language_preference` |
| `onboarding_step_completed` | Each onboarding step finished | `step_number`, `step_name`, `duration_seconds` |
| `onboarding_completed` | All onboarding steps done | `total_duration`, `steps_skipped` |
| `onboarding_abandoned` | User exits onboarding without completing | `last_step_completed`, `time_spent` |
| `first_article_generated` | User generates their first article | `time_since_signup_hours`, `topic`, `language` |

#### 2.2.4 Subscription & Billing Events

| Event Name | Trigger | Properties |
|---|---|---|
| `trial_started` | Trial period begins | `tier`, `trial_duration_days` |
| `trial_ending_soon` | 3 days before trial expiration | `articles_generated`, `features_used_count` |
| `trial_expired` | Trial period ends without conversion | `articles_generated`, `quality_avg`, `features_used` |
| `subscription_started` | Paid subscription begins | `tier`, `billing_cycle`, `mrr_value` |
| `subscription_upgraded` | Tier upgrade | `from_tier`, `to_tier`, `mrr_delta` |
| `subscription_downgraded` | Tier downgrade | `from_tier`, `to_tier`, `mrr_delta` |
| `subscription_cancelled` | Cancellation initiated | `tier`, `tenure_months`, `reason`, `articles_total` |
| `subscription_reactivated` | Previously cancelled user returns | `previous_tier`, `new_tier`, `churn_duration_days` |

### 2.3 User Properties (Product)

| Property | Type | Description |
|---|---|---|
| `tier` | String | Current subscription tier |
| `signup_date` | Date | Account creation date |
| `articles_generated_total` | Integer | Lifetime article count |
| `articles_generated_30d` | Integer | Articles in last 30 days |
| `avg_quality_score` | Float | Average quality score across all articles |
| `languages_used` | Array | Languages the user has generated articles in |
| `voice_profiles_count` | Integer | Number of active voice profiles |
| `gsc_connected` | Boolean | Whether GSC is connected |
| `team_size` | Integer | Number of team members |
| `primary_language` | String | Most-used generation language |

---

## 3. Conversion Funnel Tracking

### 3.1 Full Funnel Definition

```
Stage 1: VISITOR
  └─ Website visit (GA4: page_view)

Stage 2: ENGAGED
  └─ Viewed pricing OR read blog post OR downloaded case study

Stage 3: LEAD
  └─ Signed up for trial OR requested demo

Stage 4: ACTIVATED
  └─ Generated first article (PostHog: first_article_generated)

Stage 5: ENGAGED USER
  └─ Generated 3+ articles in first 14 days

Stage 6: CONVERTED
  └─ Started paid subscription (PostHog: subscription_started)

Stage 7: RETAINED
  └─ Active in Month 2+ (generated articles in consecutive months)

Stage 8: EXPANDED
  └─ Upgraded tier OR added team members
```

### 3.2 Funnel Benchmarks (Targets)

| Transition | Target Rate | Industry Benchmark |
|---|---|---|
| Visitor → Engaged | 40% | 30-50% |
| Engaged → Lead | 5% | 2-5% |
| Lead → Activated | 60% | 40-60% |
| Activated → Engaged User (3+ articles) | 50% | 30-50% |
| Engaged User → Converted (paid) | 25% | 15-25% |
| Converted → Retained (Month 2) | 85% | 75-90% |
| Retained → Expanded | 15% | 10-20% |

### 3.3 Critical Drop-Off Alerts

| Drop-Off Point | Alert Trigger | Action |
|---|---|---|
| Signup started but not completed | > 50% abandonment rate | Review form UX, check for technical errors |
| Signed up but no article generated in 48 hours | User hasn't hit `first_article_generated` | Trigger onboarding email sequence |
| Generated 1 article but stopped | No activity for 7 days after first article | Personal outreach email from founder |
| Trial ending with low usage | < 3 articles generated, 3 days before expiry | Offer trial extension + onboarding call |
| Paid customer with declining usage | 50%+ drop in monthly article count | Customer success check-in |

---

## 4. UTM Parameter Strategy

### 4.1 UTM Convention

```
utm_source    = platform name (linkedin, google, email, producthunt, arabnet, direct)
utm_medium    = channel type (organic, paid, email, referral, event)
utm_campaign  = campaign identifier (launch-q2-2026, case-study-srmg, webinar-arabic-ai)
utm_content   = content variant (cta-hero, cta-pricing, ad-carousel-v1, email-wave2)
utm_term      = keyword or audience (arabic-publishers, content-agencies, seo-managers)
```

### 4.2 UTM Templates by Channel

| Channel | UTM Example |
|---|---|
| **LinkedIn organic post** | `?utm_source=linkedin&utm_medium=organic&utm_campaign=thought-leadership&utm_content=post-arabic-ai-challenges` |
| **LinkedIn paid ad** | `?utm_source=linkedin&utm_medium=paid&utm_campaign=launch-q2-2026&utm_content=carousel-features-v1&utm_term=content-directors-mena` |
| **Email outreach Wave 1** | `?utm_source=email&utm_medium=email&utm_campaign=outreach-wave1&utm_content=intro-email` |
| **Email outreach Wave 2** | `?utm_source=email&utm_medium=email&utm_campaign=outreach-wave2&utm_content=case-study-followup` |
| **Product Hunt** | `?utm_source=producthunt&utm_medium=referral&utm_campaign=launch-q2-2026&utm_content=maker-comment` |
| **ArabNet event** | `?utm_source=arabnet&utm_medium=event&utm_campaign=arabnet-2026&utm_content=qr-code-handout` |
| **Blog post CTA** | `?utm_source=blog&utm_medium=organic&utm_campaign=content-marketing&utm_content=inline-cta-trial` |
| **Partner referral** | `?utm_source=partner-[name]&utm_medium=referral&utm_campaign=partner-program&utm_content=referral-link` |

### 4.3 UTM Governance

- All external links MUST include UTM parameters — no exceptions
- UTM values are lowercase, hyphen-separated (no spaces, no underscores)
- Campaign names follow format: `[type]-[quarter]-[year]` (e.g., `launch-q2-2026`)
- Document all active UTM links in a shared spreadsheet for deduplication
- GA4 channel grouping rules configured to map UTM combinations to custom channels

---

## 5. Dashboard Definitions

### 5.1 Marketing Dashboard (GA4 + Looker Studio)

| Widget | Metric | Visualization | Update Frequency |
|---|---|---|---|
| Traffic overview | Sessions, users, new users by day | Line chart | Real-time |
| Traffic by channel | Sessions grouped by utm_source/medium | Stacked bar | Daily |
| Top pages | Page views, avg. engagement time, bounce rate | Table | Daily |
| Language split | Arabic vs English content consumption | Pie chart | Weekly |
| Conversion funnel | Visitor → Engaged → Lead → Signup | Funnel chart | Weekly |
| Goal completions | Trial signups, demo requests, enterprise contacts | Scorecard | Daily |
| Campaign performance | Sessions + conversions by utm_campaign | Table | Weekly |
| Geographic distribution | Sessions by country (focus: MENA) | Map | Weekly |

### 5.2 Product Dashboard (PostHog)

| Widget | Metric | Visualization | Update Frequency |
|---|---|---|---|
| Daily active users | Unique users with any event | Line chart | Daily |
| Article generation volume | `article_generation_completed` count by day | Bar chart | Daily |
| Quality score distribution | Average quality score + histogram | Histogram | Daily |
| Feature adoption | % of users who have used each key feature | Bar chart | Weekly |
| Onboarding completion rate | % completing all onboarding steps | Funnel | Weekly |
| Time to first article | Hours from signup to `first_article_generated` | Histogram | Weekly |
| Retention cohorts | Monthly cohort retention (returning users) | Retention matrix | Monthly |
| Churn indicators | Users with declining activity (50%+ drop) | Table | Weekly |
| Language distribution | Articles generated by language | Pie chart | Weekly |
| Revenue metrics | MRR, new MRR, churned MRR, net MRR | Scorecard + line | Monthly |

### 5.3 Executive Dashboard (Combined)

| Metric | Source | Target (Month 3) |
|---|---|---|
| **MRR** | Billing system | $2,500-5,000 |
| **Paying Customers** | Billing system | 5 |
| **Trial Signups (Monthly)** | GA4 | 15 |
| **Trial-to-Paid Conversion** | PostHog | 25% |
| **Articles Generated (Monthly)** | PostHog | 500+ |
| **Avg Quality Score** | PostHog | 82+ |
| **Customer Retention (Month 2)** | PostHog | 85%+ |
| **CAC (Customer Acquisition Cost)** | GA4 + Billing | < $500 |
| **Website Visitors (Monthly)** | GA4 | 1,000+ |
| **Demo-to-Close Rate** | CRM | 20%+ |

---

## 6. Implementation Checklist

| # | Task | Tool | Priority | Status |
|---|---|---|---|---|
| 1 | Create GA4 property and data stream | Google Analytics | Critical | Pending |
| 2 | Install GA4 tag via Google Tag Manager | GTM | Critical | Pending |
| 3 | Configure custom events (10 website events) | GTM + GA4 | Critical | Pending |
| 4 | Set up custom dimensions (5 dimensions) | GA4 | High | Pending |
| 5 | Create conversion goals (6 goals) | GA4 | Critical | Pending |
| 6 | Build GA4 audiences for remarketing | GA4 | High | Pending |
| 7 | Create PostHog project | PostHog | Critical | Pending |
| 8 | Implement PostHog JS SDK on app.chainiq.io | PostHog SDK | Critical | Pending |
| 9 | Instrument article generation events (8 events) | PostHog | Critical | Pending |
| 10 | Instrument feature adoption events (8 events) | PostHog | High | Pending |
| 11 | Instrument onboarding events (4 events) | PostHog | High | Pending |
| 12 | Instrument subscription events (8 events) | PostHog | Critical | Pending |
| 13 | Set up user properties (10 properties) | PostHog | High | Pending |
| 14 | Build marketing dashboard in Looker Studio | Looker Studio | High | Pending |
| 15 | Build product dashboard in PostHog | PostHog | High | Pending |
| 16 | Create UTM tracking spreadsheet | Google Sheets | Medium | Pending |
| 17 | Configure drop-off alerts | PostHog | Medium | Pending |
| 18 | Set up weekly reporting email | Automated | Medium | Pending |
| 19 | Cookie consent banner implementation | Website | Critical | Pending |
| 20 | Data processing agreement (DPA) template | Legal | High | Pending |
