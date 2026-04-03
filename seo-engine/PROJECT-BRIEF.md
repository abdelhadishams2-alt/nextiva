# ChainIQ — AI Content Intelligence Platform

## Product Blueprint for Kit Intake

**Version:** 2.0 (Platform Expansion)
**Date:** 2026-03-28
**Path:** Enhance (building on existing v1.0.0-alpha codebase)
**Author:** Chain Reaction

---

## 1. What Is ChainIQ?

An end-to-end AI content intelligence platform that knows **what to write, when to write it, who it should sound like, and where to publish it.**

ChainIQ is not an article generator. It is a **6-layer platform** that combines real-time performance data (GSC, GA4, Semrush, Ahrefs), competitive intelligence, voice cloning, multi-agent article generation, and universal CMS publishing into a single pipeline. The user provides a category. ChainIQ returns data-backed article recommendations, generates content in the voice of the client's existing writers, and publishes it directly to any CMS.

### The End-to-End Flow

```
Client Site → Data Ingestion → Intelligence → Voice Match → Generate → Publish → Track → Recalibrate
```

### The Core Thesis

The science of knowing WHAT to write is harder than the act of writing it. Semrush tells you what keywords exist. ChainIQ tells you which ones are worth writing about for YOUR specific site, in YOUR specific voice, and then proves it worked.

---

## 2. What Already Exists (v1.0.0-alpha)

This is NOT a greenfield build. ChainIQ v1 is a working article generation plugin with substantial infrastructure:

### Current Architecture

| Component | Status | Details |
| --- | --- | --- |
| 4-Agent Pipeline | Working | project-analyzer → research-engine → article-architect → draft-writer |
| Bridge Server | Working | Node.js, zero npm deps, 36+ endpoints, localhost:19847 |
| Authentication | Working | Supabase Auth + Bearer tokens, RLS policies |
| Dashboard | Working | Next.js 16, shadcn/ui (base-ui), 7 pages, 4 admin tabs |
| Framework Adapters | Working | 7 adapters: HTML, React, Vue, Next.js, Svelte, Astro, WordPress |
| Job Queue | Working | Supabase-backed, replaces global mutex, SSE progress streaming |
| Webhook System | Working | HMAC-SHA256 signatures, exponential backoff |
| API Key Management | Working | AES-256-GCM encrypted storage, dashboard CRUD |
| Quota Enforcement | Working | Server-side primary (Supabase-backed), local fallback |
| Blueprint Registry | Working | 193 structural component blueprints |
| Tests | 228 passing | 13 suites (auth, path validation, rate limiter, prompt guard, universal engine, job queue, webhooks, blueprints, key manager, pipeline integration, generate API, edit SSE, publisher hub) |
| Multi-language | Working | 11 languages, RTL CSS with logical properties |
| Universal Engine | Working | Language detection, RTL, framework adapters, auto-config detection |
| Structured Logging | Working | JSON logger, prompt guard (13 patterns), security event logging |
| Section Editing | Working | Inline edit UI, SSE progress, version control, server-side snapshots |
| Publisher Hub | Working | Plugin instances tracking, remote config, user analytics |

### Current Codebase Stats

- **36+ bridge server endpoints** (auth, admin, dashboard API, edit, settings, quota, keys, generate, plugin heartbeat, plugin config, analytics)
- **228 tests** passing across 13 suites
- **7 engine adapters** (HTML, React, Vue, Next.js, Svelte, Astro, WordPress)
- **Dashboard** at `dashboard/` (Next.js 16, 7 pages, 4 admin tabs)
- **6 SQL migrations** (subscriptions, usage logs, pipeline jobs, user settings, API keys, publisher hub)
- **Zero npm dependencies** for bridge server (pure Node.js built-ins + native fetch)

### Completed Enhancement Phases

| Phase | What Was Built |
| --- | --- |
| Phase 0: Foundation | Git init, security hardening (env vars, async I/O, auth cache), 35 initial tests, documentation (README, BRIDGE-API, SETUP-ADMIN) |
| Phase 1: Core Features | Dashboard scaffold, 11 dashboard API endpoints, admin panel, structured logging, prompt guard, universal engine (language detection, RTL, adapters, auto-config) |
| Phase 2: Polish | Job queue, webhook system, blueprint gallery, edit UX (progress indicator, focus trap, ARIA), edit UI extraction, user settings API, migration strategy, SECURITY.md, TROUBLESHOOTING.md |
| Phase 3: Integration | Settings sync (Supabase-backed user preferences), quota enforcement (server-side, 4 plan tiers), API key management (AES-256-GCM), framework-aware output (Next.js native adapter, Svelte adapter), dashboard generation UI with SSE progress |
| Phase 4: Enhancement Sprint | Edit panel SSE progress (6 stages), /generate slash command, publisher hub (plugin instances, remote config, user analytics), pipeline audit (WordPress adapter, auto-config fixes) |

### Tech Stack (Locked)

| Component | Technology |
| --- | --- |
| Bridge Server | Node.js (zero npm deps) |
| Database | Supabase (PostgreSQL + Auth) |
| Dashboard | Next.js 16 + shadcn/ui (base-ui variant) |
| ORM | Supabase client SDK (HTTP-based) |
| Package Manager | npm |
| Auth Strategy | Supabase Auth + Bearer tokens |
| Encryption | AES-256-GCM (via bridge/key-manager.js) |
| Hosting (planned) | Hetzner + Coolify |
| Plugin Model | SaaS-connected thin clients (protects IP) |

---

## 3. Who Is This For?

### Primary: Enterprise Publishers (MENA)

SRMG, Asharg, and media groups producing 2,000+ articles/week. Manual SEO workflows can't scale across 20M+ pages. ChainIQ automates the intelligence layer. Arabic content receives no meaningful intelligence layer from any existing enterprise tool — this is the structural moat.

### Secondary: SEO Agencies

Content teams managing 10+ client blogs. ChainIQ replaces the spreadsheet-and-gut-instinct approach with data-driven topic selection per client.

### Tertiary: E-Commerce / Shopify Stores

Product-aware content generation. ChainIQ writes blog posts that reference the store's catalog, driving organic traffic to product pages.

### Universal: Any Website With a Blog

WordPress, Ghost, Webflow, Contentful, Strapi, custom CMS, or plain HTML. If it publishes content, ChainIQ works with it. Zero lock-in.

---

## 4. Platform Architecture — 6 Layers

Each layer feeds the next. Data flows top to bottom. Every article is backed by real performance data, matched to a human voice, and published directly to the client's CMS.

### Layer 1 — Data Ingestion (Connectors & Crawlers)

Google Search Console (OAuth 2.0, daily) + GA4 (OAuth 2.0, daily) + Semrush API (API key, weekly) + Ahrefs API (API token, weekly) + Google Trends (public, weekly) + CMS Crawler (CMS API/HTTP, on-demand).

All data normalized into a unified **Content Performance Record** per URL per client:

```
ContentPerformanceRecord {
  url:         "/blog/n54-hpfp-symptoms"
  title:       "N54 HPFP Failure Symptoms"
  publishDate: "2025-06-14"
  author:      "Mike T."
  wordCount:   2840
  gsc:         { clicks: 1420, impressions: 28300, ctr: 5.02, avgPosition: 8.2 }
  ga4:         { sessions: 1680, engagementRate: 72, scrollDepth: 64 }
  semrush:     { organicTraffic: 1350, keywords: 47, topKeywordKD: 32 }
  ahrefs:      { backlinks: 14, referringDomains: 8, domainRating: 42 }
  trend:       { 3moChange: -18, 6moChange: -34, seasonal: "peaks Oct-Dec" }
  status:      "DECAYING"
}
```

**Each client connects their OWN GSC/GA4 accounts via OAuth 2.0.** Semrush and Ahrefs API keys can be shared (ChainIQ's own keys, cost absorbed into subscription). 7-day caching layer to manage API costs ($200-400/mo per client).

### Layer 2 — Content Intelligence (The Recommendation Brain)

The brain. Analyzes performance data to recommend exactly what to write, when, and why.

**Two Genesis Modes:**

- **Mode A — User-Driven (Current):** User provides a keyword. Pipeline executes. No data science involved.
- **Mode B — Agent-Recommended (New):** User provides a category. The agent returns a ranked list of specific articles to write, each scored and justified with data.

**Mode B runs 6 analyses in sequence:**

1. **Content Inventory** — Crawls the site, builds a map of every article with metadata (CMS API + HTTP)
2. **Decay Detection** — Flags articles with 3+ months of declining impressions or 20%+ single-month drop (GSC + GA4)
3. **Gap Analysis** — Finds high-volume keywords the client doesn't rank for but competitors do (Semrush + Ahrefs)
4. **Seasonality Check** — Adjusts opportunity scores based on seasonal demand curves — write before the peak, not during (Google Trends)
5. **Saturation Index** — Scores SERP difficulty: are top results thin/outdated (high opportunity) or deep/authoritative (low)? (Semrush SERP)
6. **Cannibalization Guard** — Checks if client already ranks for a keyword — recommends refresh instead of new article (GSC + Content Map)

**Output: Scored Recommendations**

```
1. "N54 HPFP Failure Symptoms and Solutions"           Score: 94
   Volume: 4,400/mo | KD: 28 | No existing coverage
   Competitors: thin (avg 800 words) | Seasonal peak in 6 weeks
   Recommendation: NEW ARTICLE

2. "Best BMW Tuning Platforms 2025"                    Score: 87
   Existing article lost 34% traffic in 3 months
   Competitors published fresher guides | Data is 14 months old
   Recommendation: REFRESH

3. "B58 vs N55: Which Engine is Better?"               Score: 81
   Volume: 2,100/mo | KD: 35 | Comparison intent
   Top SERP results: outdated (pre-2024) | Forums dominate
   Recommendation: NEW ARTICLE
```

**Scoring Formula:**
`priority = (impressions * 0.3) + (decay_severity * 0.25) + (gap_size * 0.25) + (seasonality_bonus * 0.1) + (competition_inverse * 0.1)`

### Layer 3 — Voice Intelligence (Writer Detection & Persona Cloning)

Detect existing writers, clone their style, produce content indistinguishable from their own work.

**4-Step Process:**

**Step 1 — Corpus Collection:** Crawl the client's site and collect 50-100 articles minimum (statistical significance threshold). Extract raw text, strip HTML, preserve paragraph structure. Associate each with author name where available.

**Step 2 — AI vs Human Classification:** Run stylometric analysis on each article to classify as HUMAN, HYBRID, or AI-GENERATED.

| Signal | Human Pattern | AI Pattern |
| --- | --- | --- |
| Sentence length variance | High (mix of short punchy + long complex) | Low (uniform 15-20 word sentences) |
| Vocabulary richness (TTR) | Higher — uses unexpected words | Lower — defaults to common synonyms |
| Hedging frequency | Occasional, deliberate | Excessive ("it's worth noting", "it's important to") |
| Cliche density | Low — personal expressions | High — "delve", "landscape", "leverage") |
| Em-dash frequency | Varies by author | Unusually high (AI signature) |
| Paragraph rhythm | Irregular, driven by thought flow | Uniform 3-4 sentence blocks |

**Step 3 — Writer Clustering:** Using only the HUMAN articles, cluster by writing style fingerprint using NLP features: sentence structure, tone, formality, vocabulary, use of analogies, humor, technical depth. HDBSCAN clustering finds natural writer groups — no need to predefine the number of writers.

**Step 4 — Persona Generation:**

```
Writer Persona: "The Technical Storyteller"
// Detected from 34 of 87 human-written articles

voice:    Conversational-authoritative. Teaches through analogy.
cadence:  Short-medium sentences (avg 14.2 words). Punchy openers.
structure: Opens with a real-world scenario. Uses "here's the thing."
numbers:  Always contextualized ("145 bar — barely enough")
avoids:   Passive voice, em-dashes, "it's worth noting", hedging
TTR:      0.72 (rich vocabulary, avoids repetition)
humor:    Dry, occasional. Never forced.
refs:     [url1], [url2], [url3]
```

This persona is injected into the draft-writer agent as a style constraint. Auto-runs on site connect (analyze all content), manual override available.

### Layer 4 — Generation Pipeline (7-Agent Article Factory)

Expands the current 4-agent pipeline to 7 agents:

| # | Agent | Status | Input | Output |
| --- | --- | --- | --- | --- |
| 1 | Topic Recommender | NEW | Category + client site URL | Ranked list of article recommendations with scores |
| 2 | Voice Analyzer | NEW | Client site URL | Writer personas (DNA profiles) for style matching |
| 3 | Project Analyzer | EXISTS | Target project directory or URL | Shell detection, design tokens, component inventory |
| 4 | Research Engine | EXISTS | Topic + domain lock | 6-round research report + 4-6 image prompts |
| 5 | Article Architect | EXISTS | Research report + component inventory | 5 concepts → architecture → TOC → image plan |
| 6 | Draft Writer | MODIFY | Architecture + research + writer persona + tokens | Framework-native article with inline edit UI |
| 7 | Quality Gate | NEW | Generated article + target persona | 7-signal quality score. Below 7/10 = auto-revision |

**3 Adaptation Modes (existing):**

1. **Existing Components** — Project has its own component library. ChainIQ detects and uses them.
2. **Registry Blueprints** — Project has no components. ChainIQ uses 193 structural blueprints with project's design tokens.
3. **Fallback Generation** — No project detected. Self-contained HTML with inline CSS and edit UI.

### Layer 5 — Universal Publishing (CMS Adapters & Platform Plugins)

Generate once, publish anywhere. All plugins are thin SaaS-connected clients — intelligence runs on ChainIQ backend (Hetzner + Coolify) to protect IP.

| Platform | Integration | Capabilities | Builder Compat |
| --- | --- | --- | --- |
| WordPress | REST API + Plugin | Create posts, categories, featured image, Yoast/RankMath meta | All (Gutenberg, Elementor, WPBakery, Classic) |
| Shopify | Admin API + App | Create blog posts, SEO meta, product references | All themes (Liquid-native) |
| Contentful | Management API | Create entries, publish, media upload | N/A (headless) |
| Strapi | REST / GraphQL | Create content, upload media | N/A (headless) |
| Ghost | Admin API | Create posts, set cards, metadata | Native editor |
| Webflow | CMS API | Create collection items, SEO fields | Webflow Designer |
| Sanity | GROQ mutations | Create/update documents, asset upload | N/A (headless) |
| Custom | Webhook / REST | POST article payload to any endpoint | Any |

**WordPress Plugin — Universal Compatibility:** The plugin operates at the `wp_posts` database level via `wp_insert_post()`, not at the builder level. WordPress stores content in the same table regardless of builder. This is why it works with every builder — it doesn't compete with them. Features: ChainIQ menu in wp-admin, Generate Article (Mode A/B), Content Health dashboard, auto-sets categories/tags/featured image/Yoast/RankMath SEO meta, creates as Draft.

**Shopify App:** Embedded admin app using Blog API. Product-aware — can reference the store's catalog. Simpler than WordPress (one content path).

### Layer 6 — Feedback Loop (Performance Tracking & Recalibration)

Track every published article at 30/60/90 days via GSC + GA4. Compare prediction vs actual. Recalibrate intelligence engine.

**Recommend Topic → Generate Article → Publish → Track Performance → Feed Back to Layer 2**

ChainIQ gets smarter the longer a client uses it. The data makes the engine more accurate over time. This is the moat.

---

## 5. Quality & SEO Scoring Gate

Every article passes through a scoring rubric BEFORE delivery. Below 7/10 on any signal triggers auto-revision.

### 7-Signal Scoring Rubric

| Signal | Weight | What It Measures | Threshold |
| --- | --- | --- | --- |
| E-E-A-T Signals | 20% | Experience markers, expertise depth, authority signals, trust elements | >= 7/10 |
| Topical Completeness | 20% | Coverage vs top 5 competitors' subtopics (completeness matrix) | >= 80% coverage |
| Voice Match | 15% | Stylometric distance from target writer persona (sentence length, TTR, cadence) | <= 0.3 distance |
| AI Detection Score | 15% | Probability of passing AI detection (sentence variance, vocabulary, cliche density) | >= 85% human |
| Freshness Signals | 10% | Current statistics, recent examples, working links | All data <= 6mo old |
| Technical SEO | 10% | Heading hierarchy, schema markup, meta description, image alt text, internal links | >= 9/10 |
| Readability | 10% | Flesch-Kincaid grade, paragraph length, section structure, scanability | Grade 8-12 |

**Auto-revision loop:** Below 7/10 → draft-writer re-invoked with targeted instructions. Max 2 revision passes. Still below threshold after 2 passes = flag for human review.

### 60-Point SEO Checklist (Port from old-seo-blog-checker)

Logic to be ported from `../old-seo-blog-checker/lib/`:

**Content Structure (17 items):** Content length 1200-2500 words, exactly 1 H1, 6-10 H2, 10-15 H3, 30-40% of H2/H3 include keyword, TOC with anchor links, quick answer box, 2-4 metric highlight boxes, 2-3 tables (one comparison), quote boxes, FAQ section (8-12 questions), 2-3 CTAs, intro 200-250 words, conclusion 150-200 words, sources section.

**Keyword Optimization (7 items):** Primary keyword 8-15 times naturally, 2.5% max density, LSI keywords 15-25 mentions, keyword in title/first paragraph/H2s/H3s/conclusion, no keyword stuffing.

**Metadata (4 items):** Title tag 50-60 chars, meta description 145-154 chars, focus keyphrase, SEO title optimized.

**Internal Linking (5 items):** 8-12 internal links, naturally integrated, relevant anchor text, early placement (first 200 words), no clustering.

**External Links (5 items):** 2-3 authority links, mixed dofollow/nofollow, authoritative sources, proper attribution.

**Images (6 items):** Featured image 1200x628px, minimum 4 content images, descriptive alt text with keyword, keyword-descriptive file names, title attributes.

**Technical Formatting (6 items):** Proper heading hierarchy, short paragraphs (2-4 sentences), bullet/numbered lists, bold key facts, clear headers, white space optimization.

**Internationalization (4 items):** Arabic content detection (Unicode U+0600-U+06FF), RTL attribute, Arabic fonts (Cairo, Tajawal, Amiri), proper RTL text alignment.

### E-E-A-T Scoring (Port from Master Kit 36-seo)

10-dimension rubric scored 0-3 per dimension (30 total): Primary keyword targeting, secondary keyword integration, content depth vs SERP competitors, readability & formatting, internal linking, external link quality, structured data, mobile rendering, page speed (Core Web Vitals), media optimization.

Grade thresholds: A (27-30) excellent, B (22-26) good, C (16-21) below average, D (10-15) poor, F (0-9) failing.

### Content Decay Detection (Port from Master Kit 36-seo)

4 detection methods:

1. **GSC Impression/Click Decline** — 20%+ click decline over 3-month rolling windows
2. **Ranking Position Tracking** — Position drops from page 1 → page 2 = critical
3. **Content Age Audit** — "Best of" lists: 6mo trigger. How-to guides: 12mo. Evergreen: 18-24mo.
4. **URL Cannibalization During Decay** — Secondary signal

Refresh decision matrix: Partial refresh (10-40% decline, still page 1-2), full rewrite (50%+ decline, page 3+), retire with 301 (traffic <10/month, no backlinks).

### Keyword-Content Mapping & Cannibalization (Port from Master Kit 36-seo)

Core rules: One primary keyword per page. Intent alignment matrix (informational → blog posts, navigational → landing pages, commercial → comparison pages, transactional → product pages). No orphan keywords or pages.

4 cannibalization resolution strategies: Merge (both similar quality), 301 redirect (one clearly superior), differentiate (reassign keywords), deoptimize (remove keyword from wrong page).

---

## 6. Database Schema — New Tables Required

Building on existing Supabase schema (subscriptions, usage_logs, articles, article_versions, pipeline_jobs, user_settings, api_keys, plugin_instances, plugin_config).

### client_connections

OAuth token storage (encrypted, per-client). Each client connects their own GSC/GA4/Semrush/Ahrefs accounts.

Fields: id (UUID PK), user_id (FK auth.users), provider (text: google_gsc, google_ga4, semrush, ahrefs), status (pending/active/expired/revoked), access_token_encrypted (AES-256-GCM), refresh_token_encrypted (AES-256-GCM), token_expires_at, scope, account_id (e.g. GSC site URL, GA4 property ID), metadata (JSONB), created_at, updated_at.

### content_inventory

Every URL on the client's site.

Fields: id (UUID PK), user_id (FK), url (text, unique per user), title, status (discovered/analyzed/decaying/healthy/cannibalized), word_count, heading_count, author, publish_date, content_hash (detect changes between crawls), last_crawled_at, metadata (JSONB: headings array, image count, internal links), created_at, updated_at.

### performance_snapshots

Time-series performance data. One row per URL per day per source.

Fields: id (UUID PK), user_id (FK), content_id (FK content_inventory), url, snapshot_date (date), source (gsc/ga4/combined), clicks, impressions, ctr, avg_position, sessions, bounce_rate, avg_engagement_time, health_score (0-100), decay_signal (boolean), metadata (JSONB: top queries, device breakdown), created_at.

Indexes: (user_id, snapshot_date DESC), (content_id, snapshot_date DESC).

Note: For clients with 10,000+ URLs, this table grows ~300K rows/month. Monthly rollup aggregation table needed. Purge daily snapshots older than 90 days.

### keyword_opportunities

Keyword opportunities and gaps identified by intelligence engine.

Fields: id (UUID PK), user_id (FK), keyword, opportunity_type (gap/decay/cannibalization/trending/seasonal), priority_score (0-100), impressions, clicks, current_position, competing_urls (text[]), recommended_action (create_new/update_existing/merge/redirect), target_url, status (open/accepted/dismissed/completed), metadata (JSONB), created_at, updated_at.

### writer_personas

Detected writer personas from voice analysis.

Fields: id (UUID PK), user_id (FK), name, is_default (boolean), avg_sentence_length, vocabulary_richness (type-token ratio), formality_score (0-100), passive_voice_ratio, avg_paragraph_length, heading_style (question/declarative/how-to/mixed), tone (formal/conversational/technical/casual), corpus_urls (text[]), corpus_size (integer), voice_profile (JSONB: complete structured profile for agent consumption), metadata (JSONB), created_at, updated_at.

### performance_predictions

Prediction vs actual tracking for feedback loop.

Fields: id (UUID PK), user_id (FK), article_id (FK articles), keyword, predicted_clicks_30d, predicted_impressions_30d, predicted_position, actual_clicks_30d, actual_impressions_30d, actual_position, accuracy_score (computed after 30 days), check_interval (30d/60d/90d), checked_at, created_at.

---

## 7. New Files to Create

### Bridge Server — Data Ingestion

- `bridge/oauth.js` — Google OAuth2 flow (auth URL generation, token exchange, refresh). Reuse KeyManager AES-256-GCM pattern for token encryption.
- `bridge/ingestion/gsc.js` — Google Search Console Search Analytics API client
- `bridge/ingestion/ga4.js` — Google Analytics 4 Reporting API client
- `bridge/ingestion/semrush.js` — Semrush API client (keyword research, keyword gap, domain analytics, SERP features)
- `bridge/ingestion/ahrefs.js` — Ahrefs API client (backlink profile, domain rating, referring domains, keyword explorer)
- `bridge/ingestion/trends.js` — Google Trends seasonal curves (public API)
- `bridge/ingestion/crawler.js` — HTTP content crawler for content inventory. Port HTML extraction logic from `old-seo-blog-checker/lib/metadata-extractor.ts` (strip nav/footer/ads, find article/main element).
- `bridge/ingestion/scheduler.js` — Daily/weekly data pull scheduler (setInterval + Supabase job tracking, zero npm deps)

### Bridge Server — Intelligence

- `bridge/intelligence/decay-detector.js` — Content decay detection. Port logic from Master Kit `36-seo/content-seo/content-decay-refresh.md`.
- `bridge/intelligence/gap-analyzer.js` — Keyword gap analysis (find keywords competitors rank for but client doesn't)
- `bridge/intelligence/cannibalization.js` — URL cannibalization detection. Port logic from Master Kit `36-seo/content-seo/keyword-content-mapping.template.md`.
- `bridge/intelligence/voice-analyzer.js` — Stylometric corpus analysis, AI vs human classification, writer clustering
- `bridge/intelligence/performance-tracker.js` — Prediction vs actual GSC/GA4 comparison, recalibration engine

### Bridge Server — Publishing

- `bridge/publishing/wordpress.js` — WordPress REST API client (server-side push to WP sites)
- `bridge/publishing/shopify.js` — Shopify Admin Blog API client

### Engine

- `engine/quality-gate.js` — 60-point SEO checklist engine. Port from `old-seo-blog-checker/lib/seo-analyzer.ts` (ContentMetrics, 40+ metrics) + `seo-checklist.ts` (60 checks) + Arabic detection.
- `engine/quality-suggestions.js` — Actionable fix suggestion generator. Port from `old-seo-blog-checker/lib/seo-suggestions.ts`.

### Agents (Markdown)

- `agents/topic-recommender.md` — Consumes ingestion data, runs 6 analyses, produces scored recommendations
- `agents/voice-analyzer.md` — Takes corpus analysis output, generates structured voice profile for draft-writer
- `agents/quality-gate.md` — Validates generated article HTML against 7-signal rubric, approves or sends back for revision

### Plugins

- `plugins/wordpress/chainiq-connector/chainiq-connector.php` — Main WordPress plugin file
- `plugins/wordpress/chainiq-connector/includes/class-chainiq-api.php` — HTTP client for ChainIQ API
- `plugins/wordpress/chainiq-connector/includes/class-chainiq-admin.php` — WP admin settings page
- `plugins/wordpress/chainiq-connector/includes/class-chainiq-publisher.php` — Creates/updates WP posts
- `plugins/wordpress/chainiq-connector/includes/class-chainiq-webhook-handler.php` — Receives push from ChainIQ
- `plugins/shopify/` — Shopify embedded admin app

### Dashboard Pages (New)

- Connections page — OAuth flow, connected accounts status
- Content Inventory page — All discovered URLs with metrics, decay alerts
- Opportunities page — Gap analysis, cannibalization warnings, scored recommendations
- Voice Profiles page — Detected writers, persona editing, default selection
- Publishing page — Connected platforms, publish history, push to CMS
- Performance page — Prediction accuracy, content ROI, trend charts
- Quality Report tab — Per-article quality score, passed/failed checks, suggestions

### Migrations

- `migrations/007-client-connections.sql`
- `migrations/008-content-inventory.sql`
- `migrations/009-performance-snapshots.sql`
- `migrations/010-keyword-opportunities.sql`
- `migrations/011-writer-personas.sql`
- `migrations/012-performance-predictions.sql`

---

## 8. Files to Modify (Extend Existing)

| File | What Changes |
| --- | --- |
| `bridge/server.js` | Add ~20 new endpoint groups: /api/connections/*, /api/inventory/*, /api/intelligence/*, /api/publish/*, /api/performance/*, /api/voice/*. Refactor into route modules when it exceeds ~1500 lines. |
| `bridge/supabase-client.js` | Add CRUD functions for 6 new tables |
| `supabase-setup.sql` | Add 6 new table definitions + RLS policies + indexes |
| `skills/article-engine/SKILL.md` | Add Mode B (category → recommendations → pick → generate). Add optional Voice Analyzer step. Add Quality Gate step at end of pipeline. |
| `agents/draft-writer.md` | Accept optional voice profile input as style constraint |
| `bridge/webhooks.js` | Add publish.requested, publish.completed, publish.failed event types |
| `dashboard/src/components/sidebar.tsx` | Add nav items: Connections, Content Inventory, Opportunities, Voice Profiles, Publishing, Performance |
| `dashboard/src/lib/api.ts` | Add API client methods for all new endpoints (~30+ new functions) |
| `engine/adapters/index.js` | No changes needed — existing adapters handle CMS output format |

---

## 9. Files NOT to Touch (PROTECT LIST)

| File | Reason |
| --- | --- |
| `config/structural-component-registry.md` | 193 component blueprints — core IP, battle-tested |
| `agents/project-analyzer.md` | Working, proven — extend via new substeps only |
| `agents/research-engine.md` | Working, proven 6-round research |
| `agents/article-architect.md` | Working, proven concept/architecture flow |
| `bridge/key-manager.js` | Working AES-256-GCM encryption — reuse pattern, don't modify |
| `bridge/server.js` auth middleware | Multi-layer security validation — only extend with new routes |
| `bridge/server.js` path validation | 4-layer path traversal prevention — security-critical |
| `engine/adapters/*` | All 8 adapters work — do not modify |
| `supabase-setup.sql` existing tables | Only ADD new tables, never modify existing schema |

---

## 10. Contingencies & Edge Cases

| Scenario | What Happens | Fallback |
| --- | --- | --- |
| Site is not WordPress or Shopify | CMS adapter system handles this | Generic webhook adapter POSTs to any endpoint. No API at all: standalone HTML download. |
| Client doesn't have GSC or GA4 | Intelligence uses Semrush + Ahrefs only | No decay detection (NEW articles only). Prompt client to connect GSC. |
| Client doesn't have Semrush/Ahrefs | ChainIQ uses own API keys (cost in subscription) | Fall back to free sources (Google Keyword Planner, SERP scraping). |
| Site has fewer than 50 articles | Voice analysis needs 50+ for clustering | Fall back to single "brand voice" persona defined manually. Or use 20-30 with reduced confidence. |
| All existing content is AI-generated | Voice Analyzer detects this and flags it | Client provides 5-10 reference articles to emulate, or use curated "professional editorial" persona. |
| Site is in uncommon language | Research engine works in any language (LLM-native) | Arabic/RTL is first-class. Low-resource languages may produce shallower research. |
| Google OAuth verification takes >3 weeks | Use Testing mode (100 users) | Accept manual GSC/GA4 CSV data exports. Push verification as background task. |
| Semrush/Ahrefs API changes pricing | All SEO data sources behind adapter layer | Swap providers (Moz, SpyFu, SimilarWeb) with new adapter. Intelligence consumes normalized data. |
| WordPress plugin rejected from directory | Self-hosted distribution | Most enterprise clients don't use wp.org directory anyway. |
| Custom CMS with no standard API | Generic webhook adapter sends structured JSON | Client implements small webhook receiver. Reference implementation provided. ~2-4 hours effort. |

**Design principle:** Every external dependency has a degradation path. ChainIQ never hard-fails because one data source is unavailable — it operates at reduced confidence and tells the user exactly what's missing.

---

## 11. Revenue Model

### Pricing Tiers

| Tier | Monthly | Annual | Description |
| --- | --- | --- | --- |
| Tier 1 — Intelligence Platform | $3,000/mo | $36K ARR | AI platform access, weekly scans, dashboards, action queues |
| Tier 2 — Platform + Managed Service | $5,000/mo | $60K ARR | Full platform + Chain Reaction editorial validation, strategy consulting |
| Tier 3 — Full Editorial Intelligence | $8,000-12,000/mo | $96-144K ARR | Complete managed intelligence including automated generation, GEO optimization, dedicated team |

Setup fee: $20,000 one-time per client. One Tier 2 deployment recovers the entire pilot build cost.

### Per-Client Monthly API Costs

| Service | Est. Cost | Notes |
| --- | --- | --- |
| Semrush API | $80-150 | Caching reduces by ~60% |
| Ahrefs API | $50-120 | Backlink data is largest driver |
| Google APIs (GSC + GA4) | $0 | Free within standard quotas (25K req/day GSC) |
| Google Trends | $0 | Public API, rate-limited |
| LLM Tokens | $80-200 | Depends on articles/month |
| Supabase | $25-50 | Pro plan, scales with data |
| **Total** | **$235-520/mo** | **At Tier 2 ($5K/mo) = 90-95% gross margin** |

---

## 12. Competitive Advantage

No global vendor, regional agency, or new entrant holds all four advantages simultaneously:

1. **Distribution Across Major MENA Publishers** — Chain Reaction already manages SEO for SRMG. Zero cold outreach required.
2. **Architecture Validated Through SRMG Analysis** — 20M+ pages, 7 modules. Build is not speculative.
3. **10+ Years of Encoded SEO Methodology** — Cannibalization rules, authority scoring, topical prioritization built directly into intelligence layer.
4. **Arabic NLP Specialization** — Purpose-built for Arabic content at scale. Global platforms perform poorly on Arabic. Cannot be replicated quickly.

---

## 13. External Dependencies (Day 1 Actions)

These have 1-6 week approval windows. Submit before any code:

1. **Google Cloud Project** — OAuth consent screen with Search Console API + Analytics Data API enabled. Starts in Testing mode (100 users). Verification takes 2-6 weeks.
2. **Semrush API Access** — Guru+ plan ($249/mo) or API units purchase. Approval: 1-2 weeks.
3. **Ahrefs API Access** — Enterprise plan or separate API subscription. Approval: 1-2 weeks.
4. **WordPress.org Plugin Submission** — Submit shell plugin. Review: 1-4 weeks.
5. **Shopify Partner Account** — Free. App listing submission review: 1-3 weeks.
6. **Hetzner Server + Coolify** — Set up for bridge server deployment. No approval needed.

---

## 14. Logic to Port from Existing Codebases

### From old-seo-blog-checker (logic only, not UI)

| Source | What to Port | Target |
| --- | --- | --- |
| `lib/seo-analyzer.ts` | ContentMetrics interface (40+ metrics), word count, heading hierarchy, keyword density, link analysis, Arabic detection | `engine/quality-gate.js` |
| `lib/seo-checklist.ts` | 60-point SEO checklist definitions, priority weights (CRITICAL/HIGH/MEDIUM/LOW), pass/fail/warning/info logic | `engine/quality-gate.js` |
| `lib/seo-suggestions.ts` | Smart suggestion generation: priority + specific issue + actionable fix + impact statement | `engine/quality-suggestions.js` |
| `lib/metadata-extractor.ts` | HTML content extraction: strip scripts/styles/nav/sidebar/ads, find article/main element, extract from .post-content/.entry-content | `bridge/ingestion/crawler.js` |
| `api/ai-keyword-research` | Keyword research with difficulty scoring, search intent classification, semantic/LSI keywords, question-based keywords, competitor keywords, content gaps (Zod schema output) | `agents/topic-recommender.md` |

### From Master Kit 36-seo

| Source | What to Port | Target |
| --- | --- | --- |
| `content-decay-refresh.md` | 4 decay detection methods, content freshness signal weights, refresh decision matrix (partial/full/retire), re-indexing sequence, re-promotion channels | `bridge/intelligence/decay-detector.js` |
| `keyword-content-mapping.template.md` | One-keyword-per-page enforcement, intent alignment matrix, cannibalization detection (3 methods: GSC, site search, rank tracker), 4 resolution strategies (merge/redirect/differentiate/deoptimize), optimization status definitions, monthly review process | `bridge/intelligence/cannibalization.js` |
| `content-seo-scoring.md` | 10-dimension E-E-A-T rubric (0-3 per dimension, 30 total), grade thresholds (A/B/C/D/F), E-E-A-T signal implementation (experience/expertise/authoritativeness/trustworthiness markers) | `agents/quality-gate.md` |
| `content-optimization-scoring.template.md` | TF-IDF semantic optimization, entity salience scoring, featured snippet targeting (paragraph/list/table/video), PAA optimization, content uniqueness signals, helpful content framework | `engine/quality-gate.js` |

---

## 15. Non-Functional Requirements

### Security

- All OAuth tokens encrypted at rest (AES-256-GCM, reuse KeyManager pattern)
- Never persist tokens to disk files
- All API keys validated per request
- Path traversal prevention on all file operations
- Prompt injection guard on all Claude CLI subprocess inputs
- CORS restricted in production (not wildcard)
- Rate limiting on all public endpoints

### Performance

- GSC/GA4 data pull: batch API calls, respect quotas
- Semrush/Ahrefs: 7-day cache to reduce API costs
- Performance snapshots: monthly rollup aggregation, purge daily data >90 days
- Content inventory: incremental crawling (content_hash change detection)
- Dashboard: paginated APIs, client-side caching

### Scalability

- Multi-tenant by design (RLS on every table)
- Horizontal: bridge server is stateless (can run multiple instances behind load balancer)
- Job queue already supports concurrent processing
- Webhook system handles retry/backoff

### Observability

- Structured JSON logging (already implemented)
- Security event logging (already implemented)
- Add: API cost tracking per client, ingestion pipeline health dashboard, error rate monitoring

---

## 16. Interaction Preferences

- Gate mode: manual (ask for approval at each checkpoint)
- Use AskUserQuestion for all user input (never plain text questions)
- Provide selectable options with free-form "Other"
- Solo developer — value depth over speed, but keep ceremony minimal
- Extend existing code, don't replace working systems
- Zero npm dependencies philosophy for bridge server
- Test everything with `node:test` before moving on
