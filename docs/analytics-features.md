# Analytics Features — What We Built & How You Benefit

## Overview

We installed PostHog analytics and built custom tracking across the entire Mansati website. Every visitor action is now tracked — page views, button clicks, scroll depth, affiliate link clicks, and exit behavior. All data flows to your PostHog dashboard at [us.i.posthog.com](https://us.i.posthog.com).

**Cost: Free** (PostHog free tier = 1 million events/month)

---

## Step 3: Heatmaps & Session Recordings

### What It Does
- **Heatmaps** show a visual overlay of where visitors click on each page
- **Session recordings** capture real visitor sessions as replayable videos
- **Dead click detection** finds where visitors click but nothing happens (broken UX)

### How You Benefit
- See if visitors notice your affiliate buttons or scroll past them
- Watch a visitor read your Shopify article and see exactly where they stop reading
- Find confusing areas where visitors click but nothing responds
- Understand mobile vs desktop behavior differences

### How To Use It
1. Go to PostHog dashboard → **Session Replay** in left sidebar
2. Click any recording to watch it
3. For heatmaps: click the **toolbar icon** (rocket) → visit your site → click the fire icon

### What It Tracks Automatically
- Every click on every page
- Mouse movement patterns
- Scroll behavior
- Form interactions
- Page navigation

---

## Step 4: Custom Event Tracking (Named Button Tracking)

### What It Does
Every important button on the website now has a **named tracking label**. When someone clicks a button, PostHog records not just "a click happened" but specifically WHICH button was clicked.

### Tracked Buttons

| Button | Tracking Name | Where |
|--------|--------------|-------|
| "Read Our Reviews" | `hero-read-reviews` | Homepage hero section |
| "How We Review" | `hero-how-we-review` | Homepage hero section |
| "Browse Reviews" (desktop) | `navbar-browse-reviews` | Navbar CTA |
| "Browse Reviews" (mobile) | `navbar-mobile-browse-reviews` | Mobile navbar |
| "Browse All Reviews" | `cta-browse-reviews` | Bottom call-to-action section |
| "Share on Twitter" | `share-twitter` | Article share buttons |
| "Share on LinkedIn" | `share-linkedin` | Article share buttons |
| "Copy link" | `share-copy-link` | Article share buttons |
| Twitter/X social | `footer-social-x` | Footer |
| LinkedIn social | `footer-social-linkedin` | Footer |
| YouTube social | `footer-social-youtube` | Footer |
| All affiliate buttons | `affiliate-{partner}` | Sidebar, mid-article, bottom, mobile bar |
| Sidebar affiliate | `sidebar-{partner}` | Sticky sidebar CTA |
| Mid-article affiliate | `mid-{partner}` | Mid-article CTA box |
| Mobile bar affiliate | `mobile-{partner}` | Mobile sticky bottom bar |

### How You Benefit
- Know which CTA buttons get the most clicks
- Compare: "Does the hero button or the navbar button drive more blog visits?"
- See which affiliate button position converts best (sidebar vs mid-article vs bottom vs mobile bar)
- Identify buttons that nobody clicks — remove or redesign them

### How To Use It
1. PostHog dashboard → **Product Analytics** → **New Insight**
2. Select event: `$autocapture`
3. Filter by property: `button` equals `hero-read-reviews`
4. See how many times that specific button was clicked over any time period

### Example Insight You Can Build
**"Which affiliate button position gets the most clicks?"**
1. New Insight → Trends
2. Add event: `$autocapture` where `affiliate` contains `shopify`
3. Breakdown by: `affiliate` property
4. Result: Bar chart showing `sidebar-shopify` vs `mid-shopify` vs `mobile-shopify`

---

## Step 5: Scroll Depth Tracking

### What It Does
Tracks how far visitors scroll on every article page. Fires events at **25%, 50%, 75%, and 100%** scroll milestones.

### How You Benefit

**Example data you'll see:**

| Article | Reached 25% | Reached 50% | Reached 75% | Reached 100% |
|---------|------------|------------|------------|-------------|
| Shopify Saudi | 85% | 62% | 41% | 18% |
| Tap Payments | 90% | 75% | 58% | 35% |
| Foodics | 78% | 55% | 38% | 15% |

**What this tells you:**
- **Tap Payments** keeps readers engaged much longer — write more articles like it
- **Foodics** loses people early — the intro might be too long or boring
- **Only 18% finish the Shopify article** — the article might be too long, or the middle sections need improvement
- **Place affiliate buttons where most readers are** — if 62% reach 50%, put the mid-article CTA at 45% (before they leave)

### How To Use It
1. PostHog dashboard → **Product Analytics** → **New Insight**
2. Select event: `scroll_depth`
3. Filter by property: `depth` equals `50`
4. Breakdown by: `page`
5. Result: Which articles keep readers past the halfway point

### Custom Event Details
- **Event name:** `scroll_depth`
- **Properties:**
  - `depth` — the milestone percentage (25, 50, 75, or 100)
  - `page` — the URL path (e.g., `/article-shopify-saudi`)
- Each milestone fires only once per page visit (no duplicates)

---

## Step 6: Exit Intent Detection

### What It Does
When a visitor moves their mouse toward the browser's close/back button (about to leave), a popup appears with a message: **"Before you go... We have 16+ in-depth tool reviews for the Middle East market."** with a "Browse All Reviews" button.

### How It Works
- **Desktop only** — triggers when the mouse leaves the page viewport (moves toward the top)
- **One-time per session** — shows once, then stops even if the visitor moves the mouse out again
- **Dismissible** — visitor can close it with X or by clicking outside
- **Tracked** — PostHog records 3 events:
  - `exit_intent_shown` — the popup appeared
  - `exit_intent_clicked` — visitor clicked "Browse All Reviews"
  - `exit_intent_dismissed` — visitor closed the popup

### How You Benefit
- **Reduce bounce rate** — catch visitors who are about to leave
- **Drive more page views** — redirect leaving visitors to the blog
- **Measure effectiveness** — compare shown vs clicked rate

**Example data:**

| Metric | Count | Rate |
|--------|-------|------|
| Exit intent shown | 5,000/month | — |
| Clicked "Browse All Reviews" | 750 | 15% |
| Dismissed | 4,250 | 85% |

**15% of leaving visitors now go to the blog instead.** That's 750 extra article views per month that would have been lost. Some of those will click affiliate links.

### How To Use It
1. PostHog → Product Analytics → New Insight
2. Select event: `exit_intent_shown`
3. Compare with: `exit_intent_clicked`
4. Calculate conversion rate: clicked / shown = effectiveness

---

## Summary: What's Tracked Now

### Automatic (no code needed)
- Page views on every page
- Every click on the website
- Session recordings
- Heatmaps
- Bounce rate
- Session duration
- Web vitals (page speed)
- Device type (mobile/desktop)
- Country/location
- Traffic source (Google, direct, social)

### Custom Events We Built

| Event | What It Tracks | When It Fires |
|-------|---------------|---------------|
| `$autocapture` with `button` property | Named CTA button clicks | Any tracked button is clicked |
| `$autocapture` with `affiliate` property | Affiliate link clicks with partner name | Any affiliate button is clicked |
| `scroll_depth` | How far readers scroll (25/50/75/100%) | Reader scrolls past each milestone |
| `exit_intent_shown` | Popup appeared to leaving visitor | Mouse moves toward browser close |
| `exit_intent_clicked` | Visitor clicked "Browse All Reviews" | CTA button in popup clicked |
| `exit_intent_dismissed` | Visitor closed the popup | X button or overlay clicked |

---

## PostHog Dashboard Guide

### Where To Find Things

| What You Want | Where To Find It |
|---------------|-----------------|
| Total visitors, top pages, traffic sources | Web Analytics |
| Watch real visitor recordings | Session Replay → Recordings |
| See click heatmaps | Session Replay → Heatmaps (or use toolbar) |
| Button click counts | Product Analytics → New Insight → filter by button name |
| Affiliate click data | Product Analytics → filter `affiliate` property |
| Scroll depth analysis | Product Analytics → event `scroll_depth` |
| Exit intent effectiveness | Product Analytics → event `exit_intent_shown` vs `exit_intent_clicked` |
| User flow visualization | Product Analytics → New Insight → User Paths |
| Build a funnel | Product Analytics → New Insight → Funnel |
| Page speed | Web Analytics → Web Vitals tab |

### Useful Funnels To Create

**Funnel 1: Homepage to Affiliate Click**
1. Step 1: Pageview on `/`
2. Step 2: Pageview on any article
3. Step 3: Click with `affiliate` property
→ Shows what % of homepage visitors end up clicking an affiliate link

**Funnel 2: Article Reading to Conversion**
1. Step 1: Pageview on article
2. Step 2: Scroll depth 50%
3. Step 3: Click with `affiliate` property
→ Shows whether readers who scroll past 50% are more likely to click affiliate links

**Funnel 3: Exit Intent Recovery**
1. Step 1: `exit_intent_shown`
2. Step 2: `exit_intent_clicked`
3. Step 3: Pageview on article
→ Shows how many "saved" visitors actually read an article

---

## Files Created/Modified

| File | What |
|------|------|
| `src/components/providers/PostHogProvider.tsx` | PostHog initialization |
| `src/components/ui/ReadingProgress.tsx` | Scroll depth milestones (25/50/75/100%) |
| `src/components/ui/ExitIntent.tsx` | Exit-intent popup for leaving visitors |
| `src/styles/exit-intent.css` | Exit-intent popup styling |
| `src/components/sections/Hero.tsx` | Named tracking on CTA buttons |
| `src/components/sections/Navbar.tsx` | Named tracking on nav CTA |
| `src/components/sections/CallToAction.tsx` | Named tracking on bottom CTA |
| `src/components/sections/Footer.tsx` | Named tracking on social links |
| `src/components/ui/ShareButtons.tsx` | Named tracking on share buttons |
| `src/app/[locale]/layout.tsx` | PostHog provider + ExitIntent wrapper |
