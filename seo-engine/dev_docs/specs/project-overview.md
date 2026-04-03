# ChainIQ Project Overview

**Last Updated:** 2026-03-28
**Source:** Product Tribunal (41 research files, 4 structured debates, 15/15 binding vote)
**Audience:** Engineering team, new contributors, stakeholders

---

## What Is ChainIQ?

ChainIQ is a 6-layer AI Content Intelligence Platform that transforms raw SEO performance data into actionable content recommendations, generates articles in a client's existing writer voice, publishes directly to any CMS, and tracks whether its predictions were accurate -- improving with every cycle.

The core thesis: **the science of knowing WHAT to write is harder than the act of writing it.** Semrush tells you what keywords exist. ChainIQ tells you which ones are worth writing about for YOUR specific site, in YOUR specific voice, and then proves it worked.

ChainIQ is not an article generator. It is an intelligence platform where article generation is one capability among six integrated layers. The distinction matters because it defines the product's value proposition, pricing, competitive positioning, and development priority order.

### The 6 Layers

| Layer | Name | Function |
|-------|------|----------|
| 1 | Data Ingestion | Connectors to GSC, GA4, Semrush, Ahrefs, Google Trends. HTTP content crawler. Daily/weekly scheduled pulls. Unified ContentPerformanceRecord per URL. |
| 2 | Content Intelligence | Decay detection, keyword gap analysis, cannibalization detection, topic recommendations, seasonality planning, saturation scoring. The "what to write" brain. |
| 3 | Voice Intelligence | Stylometric corpus analysis, AI vs human classification, writer clustering, persona generation, style cloning. The "who it should sound like" engine. |
| 4 | Generation Pipeline | 7-agent article factory: Topic Recommender, Voice Analyzer, Project Analyzer, Research Engine, Article Architect, Draft Writer, Quality Gate. |
| 5 | Universal Publishing | CMS adapters for WordPress, Shopify, Ghost, Contentful, Strapi, Webflow, Sanity. Generic webhook for any endpoint. Thin SaaS-connected plugins protecting IP. |
| 6 | Feedback Loop | 30/60/90-day performance tracking, prediction vs actual comparison, accuracy scoring, scoring weight recalibration. The compounding data moat. |

### The End-to-End Flow

```
Client Site --> Data Ingestion --> Intelligence --> Voice Match --> Generate --> Publish --> Track --> Recalibrate
```

Each client connects their own accounts (GSC, GA4 via OAuth; Semrush, Ahrefs via API keys). Data flows through the intelligence layer, which produces scored recommendations. The generation pipeline creates articles matched to a detected writer persona. Articles publish directly to the client's CMS as drafts. Performance is tracked at 30/60/90 days and fed back into the intelligence engine, making predictions more accurate over time.

---

## Current State: v1.0.0-alpha

ChainIQ v1 is a working article generation plugin with substantial infrastructure already in place. It is not a greenfield build -- it is an Enhance path building on proven foundations.

### What Exists and Works

| Component | Status | Details |
|-----------|--------|---------|
| 4-Agent Pipeline | Working | project-analyzer, research-engine, article-architect, draft-writer |
| Bridge Server | Working | Node.js, zero npm deps, 36+ endpoints, localhost:19847 |
| Authentication | Working | Supabase Auth + Bearer tokens, RLS policies |
| Dashboard | Working | Next.js 16 + shadcn/ui (base-ui), 7 pages, 4 admin tabs |
| Framework Adapters | Working | 7 adapters: HTML, React, Vue, Next.js, Svelte, Astro, WordPress |
| Job Queue | Working | Supabase-backed, SSE progress streaming |
| Webhook System | Working | HMAC-SHA256 signatures, exponential backoff |
| API Key Management | Working | AES-256-GCM encrypted storage, dashboard CRUD |
| Quota Enforcement | Working | Server-side primary (Supabase-backed), local fallback |
| Blueprint Registry | Working | 193 structural component blueprints |
| Tests | 228 passing | 13 suites covering auth, path validation, rate limiter, prompt guard, universal engine, job queue, webhooks, blueprints, key manager, pipeline integration, generate API, edit SSE, publisher hub |
| Multi-language | Working | 11 languages, RTL CSS with logical properties |
| Section Editing | Working | Inline edit UI, SSE progress, version control, server-side snapshots |
| Publisher Hub | Working | Plugin instances tracking, remote config, user analytics |

### Verified Codebase Metrics

- **36+ bridge server endpoints** across auth, admin, dashboard API, edit, settings, quota, keys, generate, plugin heartbeat, plugin config, analytics
- **228 tests** passing across 13 suites
- **7 engine adapters** (HTML, React, Vue, Next.js, Svelte, Astro, WordPress)
- **193 component blueprints** in the structural component registry (protected IP)
- **Zero npm dependencies** for the bridge server (pure Node.js built-ins + native fetch)
- **1,471-line server.js monolith** (at refactor threshold -- Sprint 1 priority)
- **1,155-line supabase-client.js** (will grow to ~2,500 lines with 6 new tables)
- **Composite quality score: 7.5/10** (improved from 3.73/10 across five enhancement phases)

### What Does NOT Exist

The gap between v1 and the platform vision is not a feature gap -- it is a category gap. Zero lines of code exist for any of the following:

- Data ingestion (no OAuth, no API clients, no scheduler, no crawler)
- Content intelligence (no decay detection, no gap analysis, no recommendations)
- Voice intelligence (no corpus analysis, no writer clustering, no persona generation)
- Quality assurance (specs only, no scoring engine, no auto-revision)
- CMS publishing (no WordPress plugin, no Shopify app, no CMS adapters)
- Feedback loop (no performance tracking, no prediction comparison, no recalibration)
- Production deployment (localhost only, no Hetzner, no HTTPS, CORS wildcard)

The current v1 generates articles. The platform vision generates intelligence. The distance between these is approximately 320+ hours of development across 93 classified features.

---

## Target State: Full Intelligence Platform

After full roadmap execution (30+ weeks across 5 phases), ChainIQ transforms from a $0/month article generator into a platform capable of:

- Ingesting real-time performance data from GSC, GA4, Semrush, and Ahrefs
- Detecting content decay, keyword gaps, and cannibalization automatically
- Recommending specific articles to write, scored and justified with data
- Cloning writer voice from corpus analysis (not 200-word samples)
- Generating articles that pass a 7-signal quality gate with auto-revision
- Publishing directly to WordPress, Shopify, Ghost, and headless CMS platforms
- Tracking performance at 30/60/90 days and comparing predictions to actuals
- Recalibrating its scoring model based on accumulated outcome data

### Current vs Target Scores

| Dimension | Current | Target (Post-Roadmap) |
|-----------|---------|----------------------|
| Data Ingestion | 0/10 | 8/10 (Phase A) |
| Content Intelligence | 0/10 | 8/10 (Phase B) |
| Voice Intelligence | 0/10 | 7/10 (Phase C) |
| Quality Assurance | 2/10 | 8/10 (Phase B) |
| CMS Publishing | 0/10 | 8/10 (Phase B-C) |
| Feedback Loop | 0/10 | 7/10 (Phase D) |
| Infrastructure & Security | 7.5/10 | 9/10 (Phase A) |
| Article Generation | 8/10 | 9/10 (Phase B) |

---

## Target Market

### Primary: Enterprise Publishers (MENA)

SRMG, Asharg, and media groups producing 2,000+ articles/week. Manual SEO workflows cannot scale across 20M+ pages. Arabic content receives no meaningful intelligence layer from any existing enterprise tool -- after analyzing 9 competitors (Botify, BrightEdge, Conductor, Clearscope, MarketMuse, SurferSEO, Semrush, Ahrefs, Frase), not a single one generates Arabic content, optimizes for Arabic SERPs, or supports RTL publishing. Zero competition.

SRMG is the planned first client through the existing Chain Reaction agency relationship. The pilot is positioned as "we are upgrading our service delivery" rather than "please try our unproven product." This solves the cold-start problem that kills most B2B SaaS launches.

### Secondary: SEO Agencies

Content teams managing 10+ client blogs. ChainIQ replaces the spreadsheet-and-gut-instinct approach with data-driven topic selection per client. Multi-workspace management, white-label reporting, and bulk operations serve this segment.

### Tertiary: E-Commerce / Shopify Stores

Product-aware content generation. ChainIQ writes blog posts that reference the store's catalog, driving organic traffic to product pages. Shopify app integration in Phase C addresses this segment directly.

### Universal: Any Website With a Blog

WordPress, Ghost, Webflow, Contentful, Strapi, custom CMS, or plain HTML. If it publishes content, ChainIQ works with it. The universal publishing layer (Layer 5) ensures zero platform lock-in.

---

## Business Model

### Pricing Tiers (Tribunal-Recommended)

| Tier | Price | Target Persona | What They Get |
|------|-------|---------------|---------------|
| Creator | $149-199/month | Solo bloggers, freelance SEO consultants | GSC ingestion, content intelligence, article generation (capped), WordPress publishing, basic performance tracking |
| Growth | $500-800/month | Small agencies, consultants with clients, smaller e-commerce | Everything in Creator + limited multi-CMS, basic voice intelligence. Bridges the gap between $200 and $3K. Tribunal specifically recommended this tier. |
| Professional | $3,000/month | Mid-market SaaS, e-commerce heads, startup VPs | Everything in Growth + multi-CMS publishing, full voice intelligence, team seats, advanced performance tracking |
| Agency | $5,000/month | Agency owners, agency strategists | Everything in Professional + multi-workspace (20+), white-label, client-facing reporting, bulk operations |
| Enterprise | $8,000-12,000/month | Enterprise SEO directors, editorial leads, CTOs | Everything in Agency + full API access, SSO/SAML, custom integrations, SLA, dedicated CSM, unlimited generation |

### Per-Client Economics (at Scale)

- Revenue per Tier 2 client: $5,000/month
- Variable cost per client: $235-520/month (API costs $80-300, infrastructure share $5-25, support $150-200)
- Gross margin per client: 89.6%-95.3%
- Break-even: 1 Tier 2 client paying for 5 months covers the entire platform build cost

---

## Competitive Landscape

### Zero Arabic Content Intelligence Competition

After analyzing 9 major competitors, the finding is definitive: not a single one generates Arabic content, optimizes for Arabic SERPs, or supports RTL publishing. This is not a narrow advantage -- it is total white space in the fastest-growing digital content market in the Middle East.

### Voice Intelligence Is Market First

0/9 competitors offer true writer fingerprinting. SurferSEO has basic "Custom Voice" using a 200-word sample. Conductor has Content Profiles. ChainIQ's approach -- analyzing entire writer portfolios to clone vocabulary, sentence structure, and argumentation patterns -- is architecturally different and produces categorically better results.

### No Competitor Spans All 6 Layers

Competitors are either data tools (Ahrefs, Semrush), optimization tools (Clearscope, SurferSEO, Frase), strategy tools (MarketMuse), or enterprise platforms (BrightEdge, Conductor, Botify). None integrate data ingestion, intelligence, voice, quality, publishing, and feedback into a single pipeline. ChainIQ is creating a new category: the AI Content Intelligence Platform.

### Self-Recalibrating Predictions Are Unique

0/9 competitors offer prediction accountability -- the ability to compare what the system predicted an article would achieve versus what it actually achieved, and then recalibrate the model. This creates a compounding data advantage that grows with each prediction cycle.

---

## Key Metrics from Tribunal

| Metric | Value |
|--------|-------|
| Total features classified | 93 |
| Must Have features | 26 (28%) |
| Should Have features | 40 (43%) |
| Could Have features | 25 (26.9%) |
| Won't Have features | 2 (2.2%) |
| Development phases | 5 (A through E) |
| Phase A duration | 6 weeks (3 sprints) |
| Full roadmap duration (Phases A-D) | 22-26 weeks |
| Extended roadmap (Phase E) | 31+ weeks |
| Phase A infrastructure cost | ~$34/month |
| Competitors analyzed | 9 |
| Competitors with Arabic content intelligence | 0 |
| Competitors with writer fingerprinting | 0 |
| Competitors with prediction-vs-actual loop | 0 |
| Buyer personas researched | 10 |
| Tribunal vote result | 15/15 approved (10 Yes, 5 Yes-with-reservations, 0 No) |
| Revenue target (12 months) | $50K-$90K MRR |

---

## The Structural Window

ChainIQ has a 12-18 month window of opportunity created by a rare convergence:

1. **Arabic NLP is total white space** -- zero competitors serve this market
2. **SRMG distribution solves the cold-start problem** -- first client is an existing agency account
3. **Voice Intelligence is category-defining** -- 0/9 competitors have true writer fingerprinting
4. **The prediction-vs-actual loop is the data moat** -- competitors cannot copy 12 months of accumulated prediction-outcome data
5. **No competitor spans all 6 layers** -- ChainIQ is the only integrated pipeline

This window closes when a global competitor invests in Arabic NLP (estimated 2-3 years), when SRMG's patience expires (6-12 months), or when AI writing tools further commoditize the generation layer (already happening). Speed of execution is the primary strategic lever.
