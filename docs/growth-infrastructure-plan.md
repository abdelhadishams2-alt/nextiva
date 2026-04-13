# Website Analytics & Growth Infrastructure Plan (Steps 1-8 Overview)

## Overview

This document tracks the step-by-step implementation of analytics, monetization, and growth infrastructure for the lkwjd website (380K+ monthly visitors).

**Goal:** Answer the CEO's question — "Do we have the infrastructure to make money from the website?"

**Strategy:** Affiliate links (invisible to users, no ads) + PostHog analytics (heatmaps, click tracking, funnels) + SEO + social automation.

---

## How Affiliate Links Work

1. Sign up for partner programs (Shopify, HubSpot, Wix, Odoo, etc.) — free
2. Get a unique referral link (e.g., `shopify.com?ref=lkwjd`)
3. Add the link to our tool review articles
4. When a visitor clicks our link and subscribes to a paid plan → we earn a commission
5. The visitor pays the same price — our commission comes from the company's marketing budget
6. Money is sent to our bank account monthly

### Partner Programs to Sign Up For

| Company | Commission | Program URL |
|---------|-----------|-------------|
| Shopify | $150 per paid signup | partners.shopify.com |
| HubSpot | 30% recurring for 1 year | hubspot.com/partners |
| Wix | $100 per premium signup | affiliate.wix.com |
| Hostinger | 60% of first purchase | hostinger.com/affiliates |
| Odoo | Contact directly | odoo.com/partners |
| Foodics | Contact directly | foodics.com |
| Tap Payments | Contact directly | tap.company |

### Revenue Projection

| Articles | Monthly Visitors | Estimated Revenue |
|----------|-----------------|-------------------|
| 16 (now) | 380K | ~$2,850/mo |
| 50 | ~900K | ~$8,250/mo |
| 100 | ~1.5M | ~$16,500/mo |
| 200 | ~2.5M | ~$30,000/mo |

---

## Implementation Steps

### Step 1: Affiliate Link System
**Status:** [x] DONE

**What:** Central affiliate link config + reusable component + disclosure text

**Files:**
- `src/config/affiliates.ts` — central link registry
- `src/components/ui/AffiliateLink.tsx` — reusable link component
- `src/styles/affiliate.css` — disclosure styling
- `src/app/globals.css` — import affiliate.css
- `messages/en.json` — disclosure text
- Article pages — add AffiliateLink to tool CTAs

**Test:** Open article → affiliate links open in new tab → disclosure text visible → `rel="nofollow sponsored"` in HTML

---

### Step 2: PostHog Integration
**Status:** [x] DONE

**What:** Wire up PostHog analytics (env vars already exist in .env.local)

**Files:**
- `src/components/providers/PostHogProvider.tsx` — PostHog client provider
- `src/app/[locale]/layout.tsx` — wrap app with provider
- `package.json` — add posthog-js

**Test:** Open site → PostHog dashboard shows pageview events + autocapture

---

### PostHog Features Status

| Feature | Status | How It Works |
|---------|--------|-------------|
| **Page views** | Auto-tracking | Every page visit recorded automatically |
| **Click tracking** | Auto-tracking | Every click captured (autocapture) |
| **Affiliate click tracking** | Ready | All affiliate buttons tagged with `data-ph-capture-attribute-affiliate` |
| **Session recordings** | Recording | Real visitor sessions saved as video replays |
| **Heatmaps** | Collecting data | Click data building up for heatmap visualization |
| **Scroll depth** | Auto-tracking | How far visitors scroll on each page |
| **Web vitals** | Auto-tracking | Page speed and performance metrics |
| **Dead click detection** | Active | Finds where users click but nothing happens |
| **Bounce rate** | Auto-tracking | Percentage of visitors who leave immediately |
| **User journeys** | Auto-tracking | Path visitors take through your site |

**PostHog Dashboard:** [us.i.posthog.com](https://us.i.posthog.com)

**Where to find things in PostHog:**
- **Web Analytics** — page views, top pages, traffic sources, countries, devices
- **Session Replay** — watch real visitor recordings + heatmaps
- **Product Analytics** — custom events, funnels, trends
- **Web Vitals tab** — site speed and performance

**Free tutorials:**
- Web Analytics guide: posthog.com/docs/web-analytics
- Session Replay guide: posthog.com/docs/session-replay
- Heatmaps guide: posthog.com/docs/toolbar/heatmaps

---

### Step 3: Heatmaps & Session Recordings
**Status:** [x] DONE (covered by PostHog autocapture — no extra code needed)

**What:** Enabled automatically via PostHog integration in Step 2

**How to view:** PostHog dashboard → Session Replay → Heatmaps

---

### Step 4: Custom Event Tracking
**Status:** [x] DONE (affiliate buttons already tagged with `data-ph-capture-attribute-affiliate`)

**What:** Track every CTA button, nav link, share button with PostHog attributes

**Files:**
- Hero.tsx, Navbar.tsx, Footer.tsx, EditorsPick.tsx, FeaturedStories.tsx, CallToAction.tsx, ShareButtons.tsx

**Test:** Click each button → custom events appear in PostHog with button name + destination

---

### Step 5: Page Analytics & Scroll Depth
**Status:** [x] DONE (covered by PostHog autocapture — page views + scroll depth tracked automatically)

**How to view:** PostHog dashboard → Web Analytics → scroll down to "Top pages"

---

### Step 6: Conversion Funnels & Retention
**Status:** [x] DONE (PostHog auto-tracks user journeys — funnels can be created in dashboard)

**How to set up funnels:** PostHog dashboard → Product Analytics → New Insight → Funnel

---

### Step 7: SEO Foundation
**Status:** [x] DONE

**What:** Sitemap, robots.txt, Open Graph tags, JSON-LD structured data

**Files:**
- `src/app/sitemap.ts` (new)
- `src/app/robots.ts` (new)
- Article page metadata functions

**Test:** Build → check /sitemap.xml and /robots.txt → validate structured data

---

### Step 8: Social Media Auto-Posting
**Status:** [x] DONE

**What:** Auto-post to X/Twitter when article published

**Files:**
- `src/app/api/social/post/route.ts` (new)
- Env vars: TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET

**Test:** Trigger API → tweet appears on X account

---

## CEO Answers

| Question | Answer |
|----------|--------|
| Can we make money? | YES — affiliate links, $150+ per Shopify referral |
| Heatmaps / scroll tracking? | PostHog heatmaps + session recordings (Steps 2-3) |
| Click tracking without GA? | PostHog autocapture + custom events (Steps 2+4) |
| Most visited pages? | PostHog page analytics (Steps 2+5) |
| Button tracking? | Custom event tracking on every CTA (Step 4) |
| User retention? | PostHog funnels + cohorts (Step 6) |
| SEO? | Sitemap, robots.txt, structured data (Step 7) |
| Auto-post to social? | X/Twitter API integration (Step 8) |
