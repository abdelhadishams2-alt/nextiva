# Data Ingestion Connectors — Deep Dive Feature Research

**Layer:** 1 (Data Ingestion)
**Current State:** 0/10 — No external data connectors exist. The platform currently operates in Mode A only (user provides keyword, pipeline executes). Zero integration with GSC, GA4, Semrush, Ahrefs, or any external performance data source.
**Last Updated:** 2026-03-28
**Analyst:** ChainIQ Product Analysis

---

## 1. Why This Layer Is Critical

Data Ingestion is the foundation of the entire ChainIQ 6-layer thesis. Without it, Layers 2-6 collapse into a generic AI writer. The core promise — "ChainIQ tells you WHAT to write for YOUR specific site" — requires real performance data flowing in from the client's own properties.

The competition matrix confirms that GSC integration is 9/9 table stakes. GA4 integration is held by 4/9 competitors (Semrush, Ahrefs, BrightEdge, Conductor). No single competitor ingests data from both Semrush AND Ahrefs alongside GSC and GA4. This creates ChainIQ's unique "comprehensive data foundation" positioning — but only if the connectors actually exist.

Today they do not. This is the single largest gap between ChainIQ's stated architecture and its implemented reality.

---

## 2. Industry Standard

Enterprise SEO platforms treat data connectors as infrastructure, not features. The standard pattern is:

- **OAuth 2.0 for Google properties** (GSC, GA4, Google Ads) — users authenticate via Google sign-in, tokens stored server-side, refreshed automatically.
- **API key authentication for third-party tools** (Semrush, Ahrefs) — either the platform's own keys (cost absorbed) or client-provided keys.
- **Scheduled data pulls** — daily for search/analytics data, weekly for competitive intelligence, on-demand for crawls.
- **Unified data model** — all sources normalized into a single performance record per URL. This is what powers intelligence downstream.

Platforms that lack connectors (Clearscope, Frase) are limited to point-in-time analysis. They cannot detect trends, decay, or seasonality because they have no historical data pipeline.

---

## 3. Competitor Best Practices

### Botify — LogAnalyzer + SpeedWorkers
Botify's strength is crawl-side data ingestion. Their LogAnalyzer processes server logs to understand Googlebot behavior, while SpeedWorkers monitor Core Web Vitals at scale. The lesson: ingestion is not just API data — crawl behavior and performance metrics matter for enterprise publishers with 20M+ pages. ChainIQ should consider log-based insights for SRMG-scale clients.

### BrightEdge — DataCube
BrightEdge's DataCube is a proprietary index of 3.5B+ keywords with weekly rank tracking. The platform pulls GSC/GA4 data, merges it with DataCube intelligence, and produces a unified view. The lesson: first-party data (GSC/GA4) combined with third-party competitive data (their own index, equivalent to Semrush/Ahrefs for ChainIQ) creates unique insights neither source provides alone.

### Conductor — Organic Traffic Insights
Conductor merges GSC keyword data with GA4 session data to attribute organic traffic to specific keywords at the page level — something GA4 alone cannot do (keyword data is hidden behind "(not provided)"). The lesson: the value is in the JOIN, not the raw data. ChainIQ's ContentPerformanceRecord schema already encodes this principle.

### Semrush — Position Tracking + Content Audit
Semrush's content audit tool crawls a site, pulls GSC data, and overlays competitive metrics from their own database. It auto-categorizes pages by performance (strong, weak, opportunity). The lesson: automated triage upon first connection saves user onboarding time and immediately demonstrates value.

---

## 4. Feature Inventory

| # | Feature | Priority | Complexity | Phase | Description |
|---|---------|----------|------------|-------|-------------|
| 1 | **OAuth 2.0 Flow — GSC** | CRITICAL | HIGH | 1 | Google OAuth consent screen, token exchange, encrypted storage via KeyManager (AES-256-GCM already exists), automatic refresh. Scopes: `webmasters.readonly`. Must support multi-property (site owner may have 10+ properties). |
| 2 | **OAuth 2.0 Flow — GA4** | CRITICAL | HIGH | 1 | Same OAuth consent screen as GSC (bundled Google sign-in). Scopes: `analytics.readonly`. Must map GA4 property ID to GSC property. Support for multiple data streams. |
| 3 | **GSC Query API Integration** | CRITICAL | HIGH | 1 | Pull search analytics (clicks, impressions, CTR, position) by query and page. Daily pulls, 16-month lookback window. Batch requests (25K rows per call). Dimension combinations: query+page, query+device, query+country. |
| 4 | **GA4 Reporting API Integration** | CRITICAL | HIGH | 1 | Pull page-level metrics: sessions, engagement rate, scroll depth, conversions. GA4 Data API v1 (runReport). Handle sampling for high-traffic properties (request unsampled where possible). |
| 5 | **Semrush Keyword Gap API** | HIGH | MEDIUM | 1 | Domain vs domain keyword comparison. Identify high-volume keywords competitors rank for but client does not. Feeds directly into Layer 2 gap analysis. API: `/analytics/v1/`. Respect 10-requests/second rate limit. |
| 6 | **Ahrefs Backlink Profile API** | HIGH | MEDIUM | 1 | Pull referring domains, backlink count, domain rating for client URLs. Ahrefs API v3. Used for authority scoring in recommendation engine. Feeds topical authority mapping. |
| 7 | **Google Trends Integration** | MEDIUM | LOW | 2 | Interest-over-time data for topic seasonality. Public API (unofficial) or SerpApi proxy. 5-year lookback for seasonal pattern detection. Weekly resolution. |
| 8 | **CMS Crawler** | CRITICAL | HIGH | 1 | Crawl client site via CMS API (WordPress REST, Shopify Storefront) or HTTP fallback. Build content inventory: URL, title, author, publish date, word count, headings, internal links. Incremental crawl via content_hash change detection. |
| 9 | **Content Inventory Builder** | CRITICAL | MEDIUM | 1 | Process crawler output into structured inventory. Deduplicate by canonical URL. Extract metadata from HTML (reuse metadata-extractor.ts logic from old-seo-blog-checker). Store in Supabase with RLS per client. |
| 10 | **Performance Snapshots** | HIGH | MEDIUM | 2 | Daily snapshot of ContentPerformanceRecord per URL. Monthly rollup aggregation. Enable trend detection (3mo, 6mo, 12mo change calculations). Purge daily data >90 days per PROJECT-BRIEF NFRs. |
| 11 | **Health Scoring** | MEDIUM | MEDIUM | 2 | Composite health score per URL combining: traffic trend, engagement metrics, backlink profile, content freshness, keyword coverage. Feeds decay detection in Layer 2. Score: 0-100 scale with grade thresholds. |
| 12 | **Data Caching Layer** | HIGH | MEDIUM | 1 | 7-day cache for Semrush/Ahrefs API responses (per PROJECT-BRIEF: $200-400/mo per client cost management). Cache key: endpoint + params + date bucket. Supabase table with TTL-based cleanup. |
| 13 | **Cost Tracking** | MEDIUM | LOW | 2 | Track API calls per client per provider per day. Dashboard widget showing: calls made, estimated cost, quota remaining. Alert when approaching Semrush/Ahrefs monthly limits. Critical for subscription profitability. |
| 14 | **Refresh Scheduling** | HIGH | MEDIUM | 2 | Configurable pull schedule per connector: GSC/GA4 daily (overnight), Semrush/Ahrefs weekly (weekend batch), Trends weekly. Cron-style scheduling stored in Supabase. Bridge server runs scheduler on heartbeat. |
| 15 | **Token Management** | CRITICAL | HIGH | 1 | Encrypted storage of OAuth refresh tokens and API keys using existing AES-256-GCM KeyManager. Auto-refresh for expired Google tokens. Revocation handling (detect 401, prompt re-auth). Never persist tokens to disk (per NFR). |
| 16 | **Error Recovery** | HIGH | MEDIUM | 2 | Retry with exponential backoff (reuse webhook system pattern). Handle: token expiry, rate limits (429), quota exhaustion, partial failures (some pages succeed, some fail). Dead letter queue for permanently failed pulls. |
| 17 | **Manual CSV Import Fallback** | LOW | LOW | 3 | Upload GSC export CSV, GA4 export CSV, Semrush keyword export CSV. Parse and normalize into ContentPerformanceRecord. Enables usage without OAuth for privacy-conscious clients or agencies managing client data. |
| 18 | **Data Export** | LOW | LOW | 3 | Export ContentPerformanceRecords as CSV/JSON. Export performance snapshots for client reporting. Useful for agencies that need to present data in their own tools or slide decks. |
| 19 | **API Rate Limit Handling** | HIGH | MEDIUM | 1 | Per-provider rate limit tracking: GSC (2000 queries/100 seconds), GA4 (10 concurrent requests), Semrush (10 requests/second), Ahrefs (varies by plan). Queue requests, respect limits, log throttle events. |
| 20 | **Multi-Property Support** | HIGH | MEDIUM | 2 | Single client may have multiple GSC properties (www, non-www, subdomains, apps) and multiple GA4 properties. UI for property selection, data merge strategy (union vs separate tracking). |
| 21 | **Data Retention & Purge** | MEDIUM | LOW | 2 | Configurable retention: daily granularity for 90 days, monthly rollups for 2 years. GDPR-friendly: client can request full data deletion. Automated purge cron. Per PROJECT-BRIEF: purge daily data >90 days. |
| 22 | **Connection Health Dashboard** | MEDIUM | MEDIUM | 2 | Dashboard page showing: connector status (connected/disconnected/error), last successful pull timestamp, data freshness, error log. One-click reconnect for expired tokens. |
| 23 | **Unified ContentPerformanceRecord** | CRITICAL | HIGH | 1 | The normalized data model defined in PROJECT-BRIEF Section 4. All connectors write to this schema. This is the contract between Layer 1 and Layer 2. Supabase table with RLS, indexed by URL + client + date. |
| 24 | **First-Connect Triage** | MEDIUM | MEDIUM | 2 | On initial OAuth connection, run a full data pull + content inventory + health scoring. Present the client with an immediate "state of your content" report. Demonstrates value in under 5 minutes. Mirrors Semrush's content audit auto-run pattern. |

---

## 5. Quick Wins

1. **GSC + GA4 OAuth flow** — The Google Cloud project and OAuth consent screen are shared infrastructure. Building one gets you both. KeyManager already handles AES-256-GCM encryption. This unlocks the entire Mode B pipeline.
2. **Content Inventory via CMS Crawler** — The metadata-extractor.ts logic from old-seo-blog-checker is ready to port. WordPress REST API is well-documented. This provides immediate value even before full data pulls are running.
3. **7-day Caching Layer** — Simple Supabase table with TTL. Dramatically reduces API costs from day one and prevents accidental quota exhaustion during development.
4. **Manual CSV Import** — Zero external API dependency. Lets early adopters and agencies start using Layer 2 intelligence while OAuth flows are being polished.

---

## 6. Recommended Phases

### Phase 1: MVP Connectors (Weeks 1-4)
- GSC OAuth 2.0 flow + Query API integration
- GA4 OAuth 2.0 flow + Reporting API integration
- Token management (KeyManager extension)
- CMS Crawler (WordPress REST API first)
- Content Inventory Builder
- Unified ContentPerformanceRecord schema + Supabase migration
- Data caching layer (7-day TTL)
- API rate limit handling

### Phase 2: Competitive Intelligence (Weeks 5-8)
- Semrush Keyword Gap API
- Ahrefs Backlink Profile API
- Google Trends integration
- Performance snapshots (daily + monthly rollup)
- Health scoring per URL
- Refresh scheduling (cron-style)
- Error recovery (exponential backoff)
- Multi-property support
- Connection health dashboard
- Cost tracking
- Data retention and purge automation
- First-connect triage report

### Phase 3: Polish & Fallbacks (Weeks 9-10)
- Manual CSV import/export
- Data export (CSV/JSON)
- Advanced: log-based ingestion for enterprise (Botify-style)

---

## 7. Integration Requirements

### Upstream Dependencies
- **Google Cloud Project** — OAuth consent screen, API enablement (Search Console API, Analytics Data API). Requires Google verification for production (sensitive scopes).
- **Semrush API Plan** — Business plan ($449/mo) for API access. Or allow clients to provide their own keys.
- **Ahrefs API Plan** — Enterprise plan for API access. Same client-key fallback option.
- **Supabase Schema** — New tables: `connections` (OAuth tokens), `content_inventory`, `performance_records`, `performance_snapshots`, `api_cost_log`, `ingestion_schedule`.

### Downstream Consumers
- **Layer 2 (Content Intelligence)** — Reads ContentPerformanceRecord for decay detection, gap analysis, seasonality, saturation, cannibalization.
- **Layer 3 (Voice Intelligence)** — Reads content_inventory for corpus collection (URLs + author attribution).
- **Layer 6 (Feedback Loop)** — Reads performance_snapshots for 30/60/90 day tracking and prediction vs actual comparison.

### Existing Code to Extend
- `bridge/key-manager.js` — Extend for OAuth token encryption/decryption (same AES-256-GCM pattern).
- `bridge/webhooks.js` — Reuse exponential backoff pattern for API retry logic.
- `bridge/server.js` — Add connector endpoints: `/api/connect/gsc`, `/api/connect/ga4`, `/api/connect/semrush`, `/api/connect/ahrefs`, `/api/ingestion/status`, `/api/ingestion/trigger`.
- `old-seo-blog-checker/lib/metadata-extractor.ts` — Port HTML extraction logic for CMS crawler.

### Security Considerations
- OAuth tokens encrypted at rest (AES-256-GCM) per NFR. Never persisted to disk files.
- Client-provided Semrush/Ahrefs keys encrypted same as API keys (KeyManager CRUD already exists).
- All connector endpoints require Supabase auth (Bearer token, existing `requireAuth` middleware).
- RLS on all ingestion tables — clients see only their own data.
- Google OAuth verification required for production deployment (sensitive scopes trigger Google review).

---

## 8. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Google OAuth verification delay | Blocks GSC/GA4 for production | HIGH | Start verification process immediately. Use test mode for development. |
| Semrush/Ahrefs API cost overruns | Eats into per-client margins | MEDIUM | 7-day cache, cost tracking dashboard, per-client cost caps. |
| GSC data delay (48-72 hours) | Stale data in intelligence layer | LOW | Document expected latency. Use GA4 real-time as complement. |
| Multi-property complexity | Confusing onboarding UX | MEDIUM | Smart property detection (suggest the most relevant property based on domain). |
| Rate limit exhaustion at scale | Failed ingestion for high-volume clients | MEDIUM | Queue-based rate limiting, priority tiers, graceful degradation. |

---

## 9. Success Metrics

- **Connection rate:** >80% of trial users complete GSC OAuth within first session.
- **Data freshness:** GSC/GA4 data no older than 48 hours for any active client.
- **API cost per client:** Under $50/month for Semrush+Ahrefs with caching.
- **Crawl coverage:** Content inventory captures >95% of indexable URLs within first crawl.
- **Error recovery:** <1% permanently failed ingestion jobs per month.
