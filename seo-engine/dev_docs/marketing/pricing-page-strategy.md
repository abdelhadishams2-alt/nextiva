# ChainIQ Pricing Page Strategy

**Document:** Step 22 — Website, Landing Pages & Conversion
**Version:** 1.0
**Last Updated:** 2026-03-28

---

## Overview

The pricing page at `chainiq.io/pricing` is the highest-intent page on the website. Visitors who reach this page are evaluating whether to buy — not whether the product exists. Every design decision optimizes for one outcome: the visitor selects a tier and clicks the CTA. This document defines the page structure, feature comparison matrix, psychological pricing principles, and conversion elements.

---

## 1. Page Structure

### Section Order (Top to Bottom)

1. **Header** — Page title + annual/monthly toggle
2. **Tier Cards** — 4-tier comparison with CTAs
3. **Feature Comparison Matrix** — Full 25-feature breakdown
4. **Money-Back Guarantee** — Risk reversal
5. **FAQ** — 8 pricing-specific questions
6. **Final CTA** — "Still deciding?" with demo booking option
7. **Footer** — Standard site footer

---

## 2. Header Section

### Content

| Element | Text |
|---|---|
| **Title (H1)** | "Choose the Right Plan for Your Publishing Operation" |
| **Subtitle** | "All plans include the full 7-agent pipeline. Upgrade anytime." |
| **Billing Toggle** | Monthly / Annual (Save 20%) |

### Annual Discount Toggle

| Behavior | Details |
|---|---|
| **Default state** | Monthly pricing shown |
| **Toggle label** | "Pay annually" with "Save 20%" badge |
| **Visual feedback** | Prices animate/transition when toggling |
| **Annual prices** | Growth: $400-640/mo, Starter: $2,400/mo, Professional: $4,800/mo, Enterprise: $9,600/mo |
| **Billing display** | Show monthly equivalent with "billed annually at $X/year" underneath |
| **Tracking** | Fire `pricing_toggle_annual` event in GA4 when toggled |

---

## 3. Tier Cards

### Layout
```
┌────────────┐  ┌────────────┐  ┌─────────────────┐  ┌────────────┐
│   GROWTH    │  │   STARTER   │  │  PROFESSIONAL    │  │  ENTERPRISE │
│             │  │             │  │  ★ MOST POPULAR  │  │             │
│  $500-800   │  │   $3,000    │  │     $6,000       │  │   $12,000   │
│   /month    │  │   /month    │  │     /month       │  │    /month   │
│             │  │             │  │                   │  │             │
│ "Perfect    │  │ "For mid-   │  │ "For large       │  │ "For Tier-1 │
│  for small  │  │  size       │  │  publishers &    │  │  media      │
│  teams"     │  │  publishers"│  │  multi-brand     │  │  groups"    │
│             │  │             │  │  agencies"       │  │             │
│ • 25 arts   │  │ • 100 arts  │  │ • 300 articles   │  │ • Unlimited │
│ • 3 langs   │  │ • 7 langs   │  │ • 11 languages   │  │ • 11 + cust│
│ • 1 API key │  │ • 3 API keys│  │ • 10 API keys    │  │ • 20 API   │
│ • Templates │  │ • 3 voices  │  │ • 10 voices      │  │ • Unlimited │
│ • Email     │  │ • Priority  │  │ • Slack channel   │  │ • Dedicated │
│             │  │             │  │                   │  │  manager    │
│ [Start      │  │ [Start      │  │ [Start Free       │  │ [Contact    │
│  Free Trial]│  │  Free Trial]│  │  Trial]           │  │  Us]        │
│             │  │             │  │                   │  │             │
└────────────┘  └────────────┘  └─────────────────┘  └────────────┘
```

### Tier Card Content

#### Growth — $500-800/mo

| Element | Content |
|---|---|
| **Name** | Growth |
| **Price (Monthly)** | $500-800/mo |
| **Price (Annual)** | $400-640/mo (billed annually) |
| **Tagline** | "Perfect for small teams getting started with AI content" |
| **Key Features (5)** | 25 articles/month, 3 languages (AR/EN/FR), 1 API key, Standard voice templates, Email support (48h SLA) |
| **CTA** | "Start Free Trial" (primary button, outlined style) |
| **Note below CTA** | "14-day free trial, no credit card required" |

#### Starter — $3,000/mo

| Element | Content |
|---|---|
| **Name** | Starter |
| **Price (Monthly)** | $3,000/mo |
| **Price (Annual)** | $2,400/mo (billed annually at $28,800/yr) |
| **Tagline** | "For mid-size publishers ready to scale content production" |
| **Key Features (5)** | 100 articles/month, 7 languages, 3 API keys, 3 custom voice profiles, Priority email support (24h SLA) |
| **CTA** | "Start Free Trial" (primary button, outlined style) |
| **Note below CTA** | "14-day free trial, no credit card required" |

#### Professional — $6,000/mo (Most Popular)

| Element | Content |
|---|---|
| **Name** | Professional |
| **Badge** | "Most Popular" (persistent badge on card) |
| **Price (Monthly)** | $6,000/mo |
| **Price (Annual)** | $4,800/mo (billed annually at $57,600/yr) |
| **Tagline** | "For large publishers and multi-brand content agencies" |
| **Key Features (5)** | 300 articles/month, 11 languages, 10 API keys, 10 custom voice profiles + training, Dedicated Slack channel (4h SLA) |
| **CTA** | "Start Free Trial" (primary button, FILLED style — most prominent) |
| **Note below CTA** | "14-day free trial, no credit card required" |
| **Visual Treatment** | Larger card, colored border/shadow, elevated z-index |

#### Enterprise — $12,000/mo

| Element | Content |
|---|---|
| **Name** | Enterprise |
| **Price (Monthly)** | $12,000/mo |
| **Price (Annual)** | $9,600/mo (billed annually at $115,200/yr) |
| **Tagline** | "For Tier-1 media groups and enterprise content operations" |
| **Key Features (5)** | Unlimited articles, 11 languages + custom fine-tuning, 20 API keys, Unlimited voice profiles, Dedicated success manager (1h SLA) |
| **CTA** | "Contact Us" (secondary button style — opens form/Calendly) |
| **Note below CTA** | "Custom onboarding, SLA guarantees, on-premise option" |

---

## 4. Feature Comparison Matrix — 25 Features

### Layout
```
┌────────────────────────────────────────────────────────────────┐
│  [Title: "Compare All Features"]                                │
│                                                                │
│  Feature                  │ Growth │ Starter │ Pro  │ Enterprise│
│  ─────────────────────────┼────────┼─────────┼──────┼──────────│
│  Articles per month       │ 25     │ 100     │ 300  │ Unlimited │
│  ...                      │        │         │      │           │
└────────────────────────────────────────────────────────────────┘
```

### Full Feature Matrix

| # | Category | Feature | Growth | Starter | Professional | Enterprise |
|---|---|---|---|---|---|---|
| | **Content Generation** | | | | | |
| 1 | | Articles per month | 25 | 100 | 300 | Unlimited |
| 2 | | 7-agent pipeline | Yes | Yes | Yes | Yes (priority processing) |
| 3 | | 193-component registry | Basic (50 components) | Full | Full + custom | Full + custom + priority |
| 4 | | Content templates | 5 standard | 15 templates | 30 templates | Unlimited + custom |
| 5 | | Article length limit | 2,000 words | 5,000 words | 10,000 words | No limit |
| | **Language & Voice** | | | | | |
| 6 | | Languages supported | 3 (AR/EN/FR) | 7 | 11 | 11 + custom fine-tuning |
| 7 | | Voice profiles | Standard templates (3) | 3 custom profiles | 10 custom profiles | Unlimited profiles |
| 8 | | Voice training | No | Basic (10 sample articles) | Advanced (50+ samples) | Premium (unlimited samples + tuning) |
| 9 | | Dialect control (Arabic) | MSA only | MSA + Gulf | MSA + Gulf + Egyptian + Levantine | All + custom dialects |
| 10 | | RTL-native output | Yes | Yes | Yes | Yes |
| | **Quality & SEO** | | | | | |
| 11 | | Quality scoring | Pass/fail (70% threshold) | Configurable threshold | Per-section granularity | Per-section + custom dimensions |
| 12 | | Auto-regeneration on fail | 1 retry | 3 retries | 3 retries + section-level regen | Unlimited retries |
| 13 | | SEO optimization | Basic (keywords, meta) | Full (headers, density, linking) | Full + A/B suggestions | Full + automated testing |
| 14 | | GSC integration | No | Read-only analytics | Read + write + reporting | Full + automated strategy |
| 15 | | Competitor content analysis | No | Basic | Advanced | Advanced + monitoring |
| | **Platform & Access** | | | | | |
| 16 | | API keys | 1 | 3 | 10 | 20 |
| 17 | | Team members | 1 | 5 | 15 | Unlimited |
| 18 | | Role-based access control | No | Basic (Admin/Editor) | Full (Admin/Editor/Writer/Viewer) | Full + custom roles |
| 19 | | API access | Basic endpoints | Full API | Full API + webhooks | Full API + webhooks + batch |
| 20 | | CMS integration | WordPress | WordPress | WordPress + Drupal + Ghost | All + custom adapters |
| | **Support & SLA** | | | | | |
| 21 | | Support channel | Email | Priority email | Dedicated Slack channel | Dedicated success manager |
| 22 | | Response time SLA | 48 hours | 24 hours | 4 hours | 1 hour |
| 23 | | Uptime SLA | 99% | 99.5% | 99.9% | 99.9% + penalty clause |
| 24 | | Onboarding | Self-serve docs | Guided onboarding call | Dedicated onboarding program | Custom onboarding + training |
| 25 | | Deployment | Cloud only | Cloud only | Cloud only | Cloud + on-premise option |

### Display Notes
- Use checkmarks, X marks, and text values (not just Yes/No for everything)
- Sticky header row so tier names stay visible while scrolling
- Collapsible categories to reduce visual overwhelm
- Mobile: Convert to individual tier detail pages (one tier at a time with swipe)
- Highlight the Professional column with background color

---

## 5. Money-Back Guarantee Section

### Layout
```
┌──────────────────────────────────────────────────────┐
│  [Shield Icon]                                        │
│                                                      │
│  "30-Day Money-Back Guarantee"                        │
│                                                      │
│  "Try ChainIQ risk-free. If the platform doesn't      │
│   meet your editorial standards within 30 days,       │
│   we'll refund your subscription in full.             │
│   No questions asked."                                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Design Notes
- Centered, single-column layout
- Shield or badge icon for trust signaling
- Background: Light, clean — separate from the comparison matrix
- Text: Concise, direct, no legal jargon on the page (link to full terms)

---

## 6. Pricing FAQ — 8 Questions

| # | Question | Answer |
|---|---|---|
| 1 | **Can I switch plans at any time?** | Yes. Upgrade instantly — your new features activate immediately and billing is prorated. Downgrade takes effect at the next billing cycle. No penalties or lock-in. |
| 2 | **What happens when I exceed my article limit?** | You'll receive a notification at 80% and 100% of your limit. You can purchase additional article packs ($20/article on Growth, $15/article on Starter, $10/article on Professional) or upgrade your plan. |
| 3 | **Is there really no long-term contract?** | Correct. All plans are month-to-month. Annual billing saves 20% but is purely optional — you can cancel annual plans and receive a prorated refund for unused months. |
| 4 | **What's included in the free trial?** | 14 days on the Growth tier with 10 article generations. Full quality scoring, standard voice templates, and email support. No credit card required to start. |
| 5 | **Why is the Growth tier a price range ($500-800)?** | Growth tier pricing varies based on your selected configuration: language count (1-3), article length preferences, and support level. The exact price is determined during signup based on your selections. |
| 6 | **Do you offer discounts for nonprofits or startups?** | Yes. We offer 30% off any tier for registered nonprofits and 20% off for startups less than 2 years old (verification required). Contact us at sales@chainiq.io for details. |
| 7 | **Can Enterprise customers get a pilot program?** | Yes. We offer a 30-day Enterprise pilot at 50% of the standard rate. This includes full Enterprise features, dedicated onboarding, and a success review at the end of the pilot period. |
| 8 | **How does billing work for teams?** | Team members are included in your plan (see limits per tier). There are no per-seat charges. One subscription covers your entire team up to the tier's member limit. |

---

## 7. Final CTA Section

### Layout
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  "Not Sure Which Plan Is Right?"                      │
│                                                      │
│  "Book a 15-minute call with our founder.             │
│   We'll recommend the right tier based on your        │
│   content volume, team size, and goals."              │
│                                                      │
│  [Book a Free Consultation]                           │
│                                                      │
│  "Or start with the free trial — no commitment,       │
│   no credit card."                                    │
│                                                      │
│  [Start Free Trial]                                   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Design Notes
- Two CTAs: consultation (for enterprise prospects who need guidance) and trial (for self-serve prospects)
- "Book a Free Consultation" links to Calendly with 15-minute slot
- This catches visitors who scrolled through everything but couldn't decide

---

## 8. Pricing Psychology Principles Applied

### 8.1 Anchoring

| Principle | Implementation |
|---|---|
| **High anchor** | Enterprise at $12,000/mo makes Professional at $6,000 feel reasonable |
| **Low anchor** | Growth at $500-800/mo provides accessible entry point |
| **Recommended tier** | Professional marked "Most Popular" to anchor the decision toward the $6K tier |

### 8.2 Decoy Effect

| Principle | Implementation |
|---|---|
| **Decoy tier** | Starter at $3,000/mo is positioned so Professional at $6,000 looks like the obvious upgrade (3x articles, 3x API keys, 3x voice profiles for 2x price) |

### 8.3 Loss Aversion

| Principle | Implementation |
|---|---|
| **Money-back guarantee** | Removes financial risk |
| **No credit card for trial** | Removes friction and commitment anxiety |
| **Month-to-month billing** | Reduces lock-in fear |

### 8.4 Social Proof

| Principle | Implementation |
|---|---|
| **"Most Popular" badge** | Signals what peers choose — reduces decision paralysis |
| **Metrics on landing page** | "10,000+ articles generated" shows community adoption |

### 8.5 Urgency & Scarcity (Use Sparingly)

| Principle | Implementation |
|---|---|
| **Annual discount** | "Save 20%" creates a value-based urgency without fake countdown timers |
| **Pilot program** | "Limited spots for Enterprise pilot" — genuine scarcity if capacity-constrained |

### 8.6 Price Presentation

| Principle | Implementation |
|---|---|
| **Per-month framing** | Show monthly price even for annual — "$2,400/mo billed annually" feels smaller than "$28,800/year" |
| **Per-article cost** | Optionally show "as low as $20/article" in tooltips for cost-conscious prospects |
| **No cents** | Round numbers ($3,000 not $2,999) — signals premium positioning, not discount retail |

---

## 9. A/B Testing Priorities for Pricing Page

| Priority | Test | Hypothesis | Metric |
|---|---|---|---|
| 1 | Annual toggle default state (off vs on) | Default to annual may increase ACV | Annual billing selection rate |
| 2 | Professional tier visual treatment (border vs scale vs background) | Larger visual difference increases Pro selection | Tier selection distribution |
| 3 | Feature matrix collapsed vs expanded by default | Collapsed reduces overwhelm, increases CTA clicks | CTA click rate |
| 4 | "Most Popular" vs "Best Value" vs "Recommended" label | Different labels appeal to different buyer types | Pro tier selection rate |
| 5 | Growth tier price display ($500-800 range vs $650 midpoint) | Range may create confusion; fixed price may convert better | Growth tier selection rate |
| 6 | CTA copy ("Start Free Trial" vs "Try Free for 14 Days" vs "Get Started") | Action-oriented copy may outperform | CTA click-through rate |
| 7 | Money-back guarantee placement (above vs below feature matrix) | Earlier placement may reduce pricing page bounce | Bounce rate, time on page |
| 8 | Per-article cost tooltip (show vs hide) | Showing per-article cost reframes value for cost-sensitive prospects | Overall conversion rate |

---

## 10. Technical Implementation Notes

| Requirement | Specification |
|---|---|
| **Framework** | Next.js (static generation for pricing page — fast load) |
| **Billing toggle** | Client-side state — no page reload |
| **Feature matrix** | Responsive table with sticky headers — CSS Grid or custom component |
| **Mobile layout** | Swipeable tier cards (one at a time) + accordion feature matrix |
| **Analytics events** | `pricing_view`, `pricing_tier_click`, `pricing_toggle_annual`, `pricing_faq_expand` |
| **Structured data** | Product schema with pricing (JSON-LD) for Google rich results |
| **Page speed** | No heavy images on pricing page — typography and icons only. Target LCP < 1.5s |
| **RTL support** | Full RTL layout for Arabic version including table direction |
| **Currency** | USD by default. Consider adding AED/SAR display for MENA visitors (future) |
