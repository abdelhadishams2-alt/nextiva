# ChainIQ Landing Page Blueprint — chainiq.io

**Document:** Step 22 — Website, Landing Pages & Conversion
**Version:** 1.0
**Last Updated:** 2026-03-28

---

## Overview

This blueprint defines every section of the chainiq.io landing page from top to bottom. The page serves as the primary conversion asset — every marketing channel drives traffic here. The design must communicate three things within 5 seconds: (1) what ChainIQ does, (2) who it's for, and (3) why it's different. The page supports both English and Arabic (with full RTL layout), and the language toggle should be prominently accessible.

**Target conversion rate:** 3-5% visitor-to-trial signup
**Primary CTA:** "Start Free Trial"
**Secondary CTA:** "Book a Demo"

---

## Section 1: Navigation Bar (Sticky)

### Layout
```
[ChainIQ Logo]  [Product]  [Pricing]  [Blog]  [Docs]  [AR/EN Toggle]  [Sign In]  [Start Free Trial ←CTA Button]
```

### Specifications

| Element | Details |
|---|---|
| **Logo** | ChainIQ wordmark — left-aligned (English), right-aligned (Arabic) |
| **Navigation links** | Product, Pricing, Blog, Documentation |
| **Language toggle** | AR/EN switch — prominent, not hidden in footer |
| **Sign In** | Text link, secondary styling |
| **CTA Button** | "Start Free Trial" — primary brand color, always visible |
| **Behavior** | Sticky on scroll, with subtle shadow on scroll. Collapses to hamburger on mobile. |
| **Mobile** | Logo + hamburger + CTA button visible. Language toggle inside hamburger menu. |

---

## Section 2: Hero Section

### Layout
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  [Headline - H1]                                     │
│  [Subheadline - supporting text]                     │
│                                                      │
│  [Start Free Trial]  [Book a Demo →]                 │
│                                                      │
│  "No credit card required · 14-day free trial"       │
│                                                      │
│  [Hero Visual: Platform screenshot or animated GIF   │
│   showing article generation pipeline in action]     │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Content

| Element | English | Arabic |
|---|---|---|
| **Headline (H1)** | "Publisher-Grade AI Content. Arabic-First." | "محتوى ذكاء اصطناعي بمستوى النشر. العربية أولاً." |
| **Subheadline** | "The AI content intelligence platform that produces quality-scored, voice-matched articles in native Arabic — not translations. Built for publishers who need scale without sacrificing editorial standards." | "منصة ذكاء المحتوى التي تنتج مقالات مسجلة الجودة ومطابقة للصوت بالعربية الأصلية — وليس الترجمة. مصممة للناشرين الذين يحتاجون للتوسع دون التضحية بالمعايير التحريرية." |
| **Primary CTA** | "Start Free Trial" | "ابدأ تجربتك المجانية" |
| **Secondary CTA** | "Book a Demo" | "احجز عرضاً توضيحياً" |
| **Trust line** | "No credit card required · 14-day free trial · Generate your first article in 5 minutes" | "بدون بطاقة ائتمان · تجربة مجانية لـ 14 يوماً · أنتج مقالك الأول في 5 دقائق" |

### Hero Visual Options (Ranked by Impact)

1. **Animated GIF/video:** 15-second loop showing the 7-agent pipeline processing an Arabic article — from topic input to quality-scored output
2. **Interactive demo:** Live text input field where visitors type a topic and see a sample quality score (mock, not real generation)
3. **Static screenshot:** Platform dashboard showing an article with quality score, voice match percentage, and Arabic text

### Design Notes
- Hero takes up 85-100% of viewport height on desktop
- Background: Clean, white/light with subtle geometric patterns (no stock photos of AI/robots)
- Typography: Large headline (48-56px desktop, 28-32px mobile), comfortable line height
- CTA buttons: Primary (filled, brand color) + Secondary (outlined, dark text)
- Mobile: Stack vertically — headline, subheadline, CTAs, then visual below

---

## Section 3: Problem Statement — "The Content Challenge"

### Layout
```
┌──────────────────────────────────────────────────────┐
│  [Section Title: "The Content Challenge"]             │
│                                                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│  │ Pain 1   │  │ Pain 2   │  │ Pain 3   │             │
│  │ [Icon]   │  │ [Icon]   │  │ [Icon]   │             │
│  │ [Stat]   │  │ [Stat]   │  │ [Stat]   │             │
│  │ [Text]   │  │ [Text]   │  │ [Text]   │             │
│  └─────────┘  └─────────┘  └─────────┘             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Content — Three Pain Points

| # | Pain Point | Statistic | Description |
|---|---|---|---|
| 1 | **Generic AI output wastes editorial time** | "60% of editorial hours go to rewriting AI content" | Current AI tools generate English-first content that reads like a translation. Your editors spend more time fixing AI output than writing from scratch. |
| 2 | **No Arabic-native AI content tools exist** | "0 enterprise content platforms support Arabic natively" | Surfer SEO, Clearscope, MarketMuse, Frase — none support Arabic. Publishers in the largest Arabic-speaking markets have zero purpose-built options. |
| 3 | **Scale breaks quality** | "Quality drops 40% when publishers 3x their output" | More articles with current tools means lower quality. You're forced to choose between volume and editorial standards. |

### Design Notes
- Three-column grid on desktop, single column on mobile
- Each card has: icon (line icon style), bold statistic, heading, 2-3 sentence description
- Background: Light gray or subtle gradient to differentiate from hero
- Animation: Cards fade in on scroll (subtle, not distracting)

---

## Section 4: Solution — "How ChainIQ Works"

### Layout
```
┌──────────────────────────────────────────────────────┐
│  [Section Title: "How ChainIQ Works"]                 │
│  [Subtitle: "A 7-agent pipeline that handles         │
│   everything from research to quality assurance"]     │
│                                                      │
│  [Visual: Horizontal pipeline diagram]                │
│                                                      │
│  [Research] → [Outline] → [Draft] → [Edit]           │
│      → [Quality Gate] → [Optimize] → [Publish]       │
│                                                      │
│  [Each agent node is clickable/hoverable with         │
│   a tooltip showing what that agent does]             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Pipeline Agent Descriptions

| Agent | Name | Description |
|---|---|---|
| 1 | **Research Agent** | Analyzes your topic, identifies target keywords from GSC data, researches competitive content, and defines the article's knowledge foundation. |
| 2 | **Outline Agent** | Structures the article using your brand's preferred format — selecting from 193 content components to build the optimal article architecture. |
| 3 | **Draft Agent** | Generates the initial article using your trained voice profile — matching vocabulary, tone, sentence rhythm, and cultural conventions of your publication. |
| 4 | **Edit Agent** | Reviews and refines the draft for coherence, readability, factual accuracy, and stylistic consistency. Handles Arabic morphological correctness. |
| 5 | **Quality Gate** | Scores the article across 6 dimensions (structural, SEO, readability, voice match, factual, language). Must pass your configured threshold (default 85%). |
| 6 | **Optimize Agent** | Applies final SEO optimizations — meta descriptions, header hierarchy, keyword density, internal linking suggestions. |
| 7 | **Publish Agent** | Exports the final article in your preferred format (HTML, Markdown, WordPress XML) or pushes directly to your CMS via API. |

### Design Notes
- Pipeline visualization should be animated — show flow from left to right (English) or right to left (Arabic)
- Each agent node is interactive: hover or click reveals description
- Use brand colors to differentiate agent types (research = blue, creative = green, quality = gold, etc.)
- Mobile: Vertical pipeline (top to bottom) instead of horizontal
- Include a small "See it in action" link that scrolls to the Arabic showcase section

---

## Section 5: Features Grid — "What You Get"

### Layout
```
┌──────────────────────────────────────────────────────┐
│  [Section Title: "Built for Publishers"]              │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Feature 1 │  │ Feature 2 │  │ Feature 3 │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Feature 4 │  │ Feature 5 │  │ Feature 6 │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Six Key Features

| # | Feature | Icon Concept | Description |
|---|---|---|---|
| 1 | **Arabic-Native Generation** | Arabic letter ع (Ain) | Content generated natively in Arabic — not translated from English. RTL-native output with morphological awareness and dialect control (MSA, Gulf, Egyptian, Levantine). |
| 2 | **Quality Scoring Pipeline** | Shield with checkmark | Every article scored across 6 quality dimensions. Configurable pass/fail thresholds. Per-section granularity so you know exactly where quality drops. |
| 3 | **Voice Intelligence** | Waveform / soundwave | Train custom voice profiles from your published content. ChainIQ learns your vocabulary, tone, sentence structure, and cultural references — then reproduces them at scale. |
| 4 | **193-Component Registry** | Building blocks / grid | Choose from 193 content structure components — from introductions to expert quotes to data tables. Every article is architecturally optimized, not just well-written. |
| 5 | **GSC Integration** | Chart trending up | Connect Google Search Console to inform topic selection with real performance data. See which generated articles drive rankings, traffic, and clicks. |
| 6 | **11-Language Support** | Globe with text | Generate content in Arabic, English, French, Spanish, German, Turkish, Urdu, Hindi, Portuguese, Indonesian, and Malay. Same quality pipeline, every language. |

### Design Notes
- 3x2 grid on desktop, 2x3 on tablet, 1x6 on mobile
- Each feature card: icon (40-48px), heading, 2-3 sentence description
- Subtle hover effect (lift + shadow)
- Background: White, clean, generous whitespace

---

## Section 6: Arabic Showcase — "See Arabic Content Done Right"

### Layout
```
┌──────────────────────────────────────────────────────┐
│  [Section Title: "Arabic Content That Reads           │
│   Like It Was Written by Your Best Editor"]           │
│                                                      │
│  ┌─────────────────┐  ┌─────────────────┐           │
│  │ BEFORE           │  │ AFTER            │           │
│  │ Generic AI       │  │ ChainIQ Output   │           │
│  │ Arabic content   │  │ Voice-matched    │           │
│  │ (highlighted     │  │ Arabic content   │           │
│  │ problems)        │  │ (highlighted     │           │
│  │                  │  │ improvements)    │           │
│  └─────────────────┘  └─────────────────┘           │
│                                                      │
│  [Quality Score Badge: 92/100]                        │
│  [Voice Match: 94%]                                   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Content

**Before (Generic AI):**
- Show a paragraph of Arabic content generated by a generic AI tool
- Highlight problems: unnatural phrasing (yellow), translation artifacts (red), wrong register (orange)
- Label: "Generic AI output — requires 45+ minutes of editorial revision"

**After (ChainIQ):**
- Show the same topic generated by ChainIQ
- Highlight strengths: natural phrasing (green), correct morphology (blue), brand-appropriate tone (purple)
- Label: "ChainIQ output — publication-ready in under 5 minutes"

**Quality Indicators (displayed between/below the two panels):**
- Quality Score: 92/100 (with breakdown tooltip)
- Voice Match: 94% (compared to publication's trained profile)
- Readability: Grade 8 (appropriate for general audience)
- SEO Score: 88/100

### Design Notes
- Side-by-side layout on desktop, stacked on mobile
- Arabic text must render properly in RTL
- Use actual Arabic text, not lorem ipsum — even if sample, make it realistic
- The "Before" panel should feel subtly less polished (slightly muted styling)
- The "After" panel should feel premium (cleaner typography, subtle quality badge)
- This section is critical for Arabic-speaking visitors — it must demonstrate genuine Arabic fluency

---

## Section 7: Social Proof — "Trusted by Publishers"

### Layout
```
┌──────────────────────────────────────────────────────┐
│  [Section Title: "What Publishers Say"]               │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ [SRMG Logo]                                   │    │
│  │ "Quote from SRMG stakeholder about ChainIQ    │    │
│  │  quality and Arabic content generation"        │    │
│  │  — Name, Title, SRMG                          │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │ Metric 1    │  │ Metric 2    │  │ Metric 3    │    │
│  │ "X articles │  │ "Y% quality │  │ "Z% time    │    │
│  │  generated" │  │  score avg" │  │  saved"     │    │
│  └────────────┘  └────────────┘  └────────────┘    │
│                                                      │
│  [Live Quality Score Demo]                            │
│  "See a real article quality breakdown"               │
│  [Interactive quality score widget showing             │
│   6-dimension radar chart for a sample article]       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Content

**Testimonial (Primary):**
- Source: SRMG pilot participant (or equivalent early customer)
- Quote: Focus on Arabic quality, editorial time savings, and scale achieved
- If no testimonial available yet: Replace with "Platform Statistics" showing aggregate generation metrics

**Metrics Bar:**

| Metric | Value (target) | Label |
|---|---|---|
| Articles Generated | "10,000+" | "Articles generated on the platform" |
| Average Quality Score | "87/100" | "Average quality score across all articles" |
| Editorial Time Saved | "75%" | "Reduction in editorial review time" |

**Live Quality Score Demo:**
- Interactive radar chart showing a sample article's scores across 6 dimensions
- Visitors can click through 3-4 sample articles to see different score profiles
- Each dimension is labeled and hoverable for explanation
- Demonstrates the transparency and depth of ChainIQ's quality system

### Design Notes
- Testimonial section: Large quote marks, professional photo (if available), company logo
- Metrics: Bold numbers, smaller labels, counter animation on scroll
- Quality demo: Interactive element increases time on page and demonstrates product depth
- Background: Subtle brand color wash or gradient to create visual break

---

## Section 8: Pricing Table

### Layout
```
┌──────────────────────────────────────────────────────┐
│  [Section Title: "Simple, Transparent Pricing"]       │
│  [Annual/Monthly Toggle — "Save 20% with annual"]    │
│                                                      │
│  ┌─────┐  ┌─────┐  ┌──────────┐  ┌─────┐          │
│  │Growth│  │Start│  │ Pro       │  │Enterp│          │
│  │$500- │  │$3K  │  │ $6K      │  │$12K  │          │
│  │ 800  │  │/mo  │  │ /mo      │  │/mo   │          │
│  │      │  │     │  │ POPULAR  │  │      │          │
│  │[CTA] │  │[CTA]│  │ [CTA]    │  │[CTA] │          │
│  └─────┘  └─────┘  └──────────┘  └─────┘          │
│                                                      │
│  [Link: "Compare all features →"]                    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Tier Summary (Landing Page — Abbreviated)

| | Growth | Starter | Professional | Enterprise |
|---|---|---|---|---|
| **Price** | $500-800/mo | $3,000/mo | $6,000/mo | $12,000/mo |
| **Articles/mo** | 25 | 100 | 300 | Unlimited |
| **Languages** | 3 | 7 | 11 | 11 + custom |
| **Voice profiles** | Templates | 3 custom | 10 custom | Unlimited |
| **API keys** | 1 | 3 | 10 | 20 |
| **Support** | Email | Priority email | Slack channel | Dedicated manager |
| **CTA** | Start Trial | Start Trial | Start Trial | Contact Us |

- "Professional" tier highlighted as "Most Popular" with visual emphasis (border, badge, or scale)
- Annual pricing toggle shows 20% discount
- "Compare all features" links to full `/pricing` page

### Design Notes
- 4-column grid on desktop, 2x2 on tablet, stacked on mobile
- Professional tier visually elevated (larger card, colored border, "Most Popular" badge)
- Prices should be large and bold — no ambiguity
- Each card shows 5-6 key differentiators, not the full feature list (that's on `/pricing`)

---

## Section 9: FAQ Section

### Eight Questions

| # | Question | Answer |
|---|---|---|
| 1 | **How does ChainIQ differ from ChatGPT or Jasper?** | ChainIQ is a complete publisher pipeline — 7 specialized agents handle research, writing, editing, and quality assurance. ChatGPT is a single-step prompt tool. Jasper focuses on marketing copy. ChainIQ focuses on editorial-grade articles with quality scoring, voice matching, and SEO optimization built in. |
| 2 | **Is ChainIQ's Arabic content really native, not translated?** | Yes. ChainIQ generates directly in Arabic using models trained on Arabic-language corpora. The output includes proper morphological structure, culturally appropriate phrasing, and RTL formatting. We don't generate in English first — there's no translation step. |
| 3 | **What's included in the free trial?** | 14 days on the Growth tier: 10 article generations, full quality scoring, access to standard voice templates, and email support. No credit card required. Generate your first article in under 5 minutes. |
| 4 | **Can ChainIQ match my publication's specific voice?** | Yes. On Starter tier and above, you can create custom voice profiles trained on your published content. Upload 10-20 representative articles, and ChainIQ learns your vocabulary, tone, sentence structure, and stylistic preferences. |
| 5 | **How does the quality scoring work?** | Every article is scored across 6 dimensions: structural completeness, SEO optimization, readability, voice match, factual grounding, and language quality. You set the pass threshold (default 85%). Articles below threshold are automatically regenerated up to 3 times before flagging for human review. |
| 6 | **Does ChainIQ integrate with our CMS?** | ChainIQ includes a native WordPress plugin. Professional and Enterprise tiers add Drupal and Ghost adapters. Enterprise tier includes custom CMS integration development. All tiers support API-based export in HTML, Markdown, and structured JSON. |
| 7 | **Is there a long-term contract?** | No. All tiers are month-to-month with no commitment. Annual billing saves 20% but is optional. 30-day money-back guarantee on all plans. |
| 8 | **How secure is our content?** | Tenant-isolated storage, AES-256 encryption at rest, TLS 1.3 in transit. Your content is never used to train AI models — contractual guarantee. Enterprise tier offers on-premise deployment for full data sovereignty. |

### Design Notes
- Accordion-style FAQ (click to expand)
- Track which FAQ items are clicked (analytics event `faq_expand`)
- Expandable answers should be concise — 2-3 sentences max
- Include a "Still have questions? Contact us" link below the FAQ

---

## Section 10: Final CTA Section

### Layout
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  [Headline: "Ready to Transform Your                  │
│   Content Operation?"]                                │
│                                                      │
│  [Subtext: "Start your free trial today.              │
│   Generate your first article in 5 minutes.           │
│   No credit card required."]                          │
│                                                      │
│  [Start Free Trial]  [Book a Demo →]                 │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Design Notes
- Full-width section with brand-colored background (dark or gradient)
- White text for contrast
- Large CTA buttons — same as hero section
- This is the last conversion opportunity — make it visually striking
- Mobile: Centered text, stacked CTAs

---

## Section 11: Footer

### Layout
```
┌──────────────────────────────────────────────────────┐
│  [ChainIQ Logo]                                       │
│                                                      │
│  Product        Resources      Company      Legal    │
│  ─────────      ─────────      ───────      ─────    │
│  Features       Blog           About        Privacy  │
│  Pricing        Documentation  Contact      Terms    │
│  API            Case Studies   Careers      Cookies  │
│  Changelog      Help Center    Partners     DPA      │
│                                                      │
│  [LinkedIn Icon]  [Twitter/X Icon]                    │
│                                                      │
│  © 2026 ChainIQ by Chain Reaction SEO.               │
│  [AR/EN Language Toggle]                              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Design Notes
- 4-column grid on desktop, 2x2 on tablet, single column on mobile
- Subtle styling — dark background, muted text colors
- Language toggle repeated in footer for accessibility
- Social links: LinkedIn (primary), Twitter/X (secondary)
- Copyright includes "Chain Reaction SEO" for brand association

---

## Technical Requirements

### Performance

| Metric | Target |
|---|---|
| Lighthouse Performance Score | 90+ |
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Cumulative Layout Shift | < 0.1 |
| Total page weight | < 1.5MB |
| Time to Interactive | < 3.5s |

### SEO

| Element | Specification |
|---|---|
| Title tag | "ChainIQ — AI Content Intelligence for Publishers | Arabic-First" |
| Meta description | "Publisher-grade AI content platform with 7-agent pipeline, quality scoring, and voice matching. Built for Arabic publishers. Start your free trial." |
| H1 | One per page (hero headline) |
| Canonical URL | https://chainiq.io/ |
| Hreflang tags | `en` and `ar` alternates |
| Structured data | Organization, Product, FAQ (JSON-LD) |
| Open Graph | Title, description, image for social sharing |
| Sitemap | Auto-generated, submitted to Google Search Console |

### Accessibility

| Requirement | Standard |
|---|---|
| WCAG compliance | 2.1 AA |
| Color contrast | 4.5:1 minimum for text |
| Keyboard navigation | Full tab support for all interactive elements |
| Screen reader | ARIA labels on all interactive elements, alt text on images |
| RTL support | Complete RTL layout for Arabic version — not just text direction |
| Focus indicators | Visible focus rings on all focusable elements |

### Internationalization

| Requirement | Details |
|---|---|
| Language toggle | Instant switch between EN and AR without page reload |
| RTL layout | Full layout mirroring — not just `dir="rtl"` on text |
| Font support | Arabic: Noto Sans Arabic or Cairo. English: Inter or equivalent. |
| Number formatting | Arabic-Indic numerals option for Arabic version |
| Date formatting | Gregorian with Arabic month names for Arabic version |
