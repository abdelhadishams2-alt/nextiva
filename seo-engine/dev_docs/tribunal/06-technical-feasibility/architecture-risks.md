# Architecture Risks — Top 10

**Assessment Date:** 2026-03-28
**Scope:** ChainIQ v2 platform expansion risks
**Rating Scale:** Likelihood 1-5 (1=unlikely, 5=near-certain), Impact 1-5 (1=minor, 5=critical)

---

## Risk 1: server.js Monolith Growing to 3000+ Lines

**Description:** The bridge server is a single `http.createServer()` callback with a giant if/else chain. Currently 1,471 lines with 48 endpoints. The expansion adds ~30-40 new endpoints. Without refactoring, server.js grows to 2,500-3,000 lines — becoming unmaintainable, untestable, and a merge conflict magnet.

**Likelihood:** 5 (certain if route splitting is not done first)
**Impact:** 4 (slows all development, increases bug surface, makes code review impossible)

**Mitigation:** Refactor into route modules BEFORE adding any new endpoints. Each route group exports a handler function. Core server.js reduces to ~300 lines of middleware and dispatch. This is item #1 on the critical path.

**Spike needed:** No — the pattern is clear and proven in the Node ecosystem. Just execute.

---

## Risk 2: Supabase Row Limits for performance_snapshots

**Description:** A single enterprise client with 10,000 URLs generates ~300,000 rows/month in performance_snapshots. Five clients = 1.5M rows/month = 18M rows/year. Supabase Pro provides 8GB storage. Without aggregation and purging, queries degrade within 6 months, and storage limits are hit within 12 months.

**Likelihood:** 4 (enterprise clients WILL have 10K+ URLs — SRMG has 20M pages)
**Impact:** 5 (database becomes unusable, affects all features)

**Mitigation:**
1. Table partitioning by month (PostgreSQL range partitioning)
2. 90-day rolling purge of daily granularity
3. Monthly aggregate rollup table (reduces storage 30x)
4. Monitoring alert when table exceeds 5M rows
5. Consider Supabase Enterprise or self-hosted PostgreSQL for >10 clients

**Spike needed:** Yes — test partitioning + purge strategy with 1M simulated rows to validate query performance. (2-3 days)

---

## Risk 3: Google OAuth Verification Timeline (2-6 Weeks)

**Description:** Google requires OAuth consent screen verification before an app can be used by more than 100 users. Verification requires: privacy policy URL, terms of service URL, homepage verification, app logo, and a review process that takes 2-6 weeks. Rejection requires resubmission, adding more weeks.

**Likelihood:** 3 (verification is standard, but rejection on first attempt is common for new apps)
**Impact:** 5 (blocks ALL data ingestion from GSC and GA4 — the foundation of the intelligence layer)

**Mitigation:**
1. Submit OAuth consent screen on Day 1 of development — do not wait for code
2. Use Testing mode (100 users) for SRMG pilot while verification is pending
3. Prepare fallback: accept manual CSV data exports from GSC/GA4 if verification is delayed
4. Ensure privacy policy and ToS are ready before submission
5. Request only the minimum scopes: `https://www.googleapis.com/auth/webmasters.readonly` (GSC) and `https://www.googleapis.com/auth/analytics.readonly` (GA4)

**Spike needed:** No — but the submission is a Day 1 action item.

---

## Risk 4: HDBSCAN Clustering Without npm Dependencies

**Description:** Writer clustering (Layer 3 — Voice Intelligence) requires grouping articles by writing style. HDBSCAN is the recommended algorithm because it auto-detects the number of clusters, handles noise, and finds non-spherical cluster shapes. Implementing HDBSCAN from scratch in pure JavaScript requires: minimum spanning tree construction, mutual reachability graph, single-linkage tree extraction, and cluster stability computation. This is 500-1,000 lines of matrix math with high bug risk.

**Likelihood:** 4 (the feature is designed around HDBSCAN specifically)
**Impact:** 3 (voice analysis can launch with simpler clustering or manual personas)

**Mitigation:**
1. MVP: Use simplified k-means clustering (100 lines, zero-dep). User specifies number of writers or system tests k=2 through k=8 with silhouette score.
2. Production: Shell out to Python (`python3 cluster.py --input features.json --output clusters.json`). HDBSCAN is a one-line Python call. This preserves Node's zero-dep constraint.
3. Fallback: Allow manual persona creation (user defines their own writer profiles). Voice analysis becomes optional, not required.

**Spike needed:** Yes — run k-means vs HDBSCAN on a real 100-article corpus to measure persona quality difference. (3-5 days)

---

## Risk 5: CMS Plugin Compatibility Across WordPress Builders

**Description:** The WordPress plugin creates posts via `wp_insert_post()` at the database level. While WordPress stores all content in the `wp_posts` table regardless of builder, visual builders (Elementor, WPBakery, Divi, Beaver Builder) store layout metadata in post_meta that may not render correctly when content is inserted without builder-specific markup. The article may appear as raw HTML in the builder's visual editor.

**Likelihood:** 3 (Gutenberg works natively; builder-specific issues likely for Elementor/WPBakery)
**Impact:** 3 (limits addressable market to Gutenberg-only if unresolved)

**Mitigation:**
1. Launch with Gutenberg support only (WordPress 5.0+ default editor)
2. Test with Elementor, WPBakery, and Divi — document which work out-of-the-box
3. For builders that fail: generate builder-compatible shortcodes or blocks as an adapter layer
4. Accept that Classic Editor (TinyMCE) works natively with raw HTML
5. Deprioritize Oxygen, Bricks, and niche builders until demand justifies effort

**Spike needed:** Yes — install WordPress with Elementor and WPBakery, push content via `wp_insert_post()`, verify rendering. (5-7 days)

---

## Risk 6: API Cost Management (Semrush/Ahrefs Per-Request Pricing)

**Description:** Semrush API charges per API unit (~$0.01-0.05 per request depending on endpoint). Ahrefs charges per row returned. The brief estimates $80-150/mo for Semrush and $50-120/mo for Ahrefs per client. Without caching, a client with 10,000 URLs queried weekly could cost $500-1,000/mo — eating into the $5,000/mo subscription margin.

**Likelihood:** 3 (costs are predictable if caching is implemented correctly)
**Impact:** 4 (margin erosion, potentially unprofitable at lower tiers)

**Mitigation:**
1. 7-day cache layer for all Semrush/Ahrefs responses (reduces API calls ~60-70%)
2. Tiered data freshness: keyword data cached 7 days, SERP data 1 day, backlink profiles 30 days
3. Per-client API budget tracking with alerts at 80% threshold
4. Batch API requests (Semrush supports bulk keyword lookups)
5. Usage-based pricing consideration for Tier 1 clients (pass through API costs above threshold)

**Spike needed:** Yes — profile actual API unit consumption for a test domain (1,000 URLs) to validate cost model. (2-3 days)

---

## Risk 7: Token Refresh Reliability (OAuth Tokens Expire)

**Description:** Google OAuth access tokens expire after 1 hour. Refresh tokens can expire or be revoked if: the user changes their Google password, the user revokes app access, the refresh token is unused for 6 months, or Google revokes the app's consent. A failed refresh means the scheduler cannot pull GSC/GA4 data until the user re-authenticates.

**Likelihood:** 3 (token revocation is uncommon but happens — especially during password changes)
**Impact:** 3 (data ingestion stops for that client until re-auth, but other clients unaffected)

**Mitigation:**
1. Proactive refresh: refresh tokens 10 minutes before expiry, not at expiry
2. Retry with exponential backoff on refresh failure (3 attempts over 15 minutes)
3. After 3 failed refreshes: mark connection status as `expired` in client_connections
4. Dashboard alert: "Your Google connection expired. Please reconnect."
5. Email notification (via Supabase Edge Function) for expired connections
6. Store the last successful refresh timestamp — alert if no refresh in 24 hours

**Spike needed:** No — standard OAuth refresh patterns. Implement with error handling from the start.

---

## Risk 8: Data Staleness (What If Scheduler Fails Silently?)

**Description:** The scheduler runs daily GSC/GA4 pulls and weekly Semrush/Ahrefs pulls. If the Node.js process crashes, the setInterval timer dies with it. Coolify restarts the process, but if the scheduler logic has a bug (e.g., unhandled promise rejection), it may stop scheduling without crashing the server. Clients would see stale data in their dashboards without realizing it.

**Likelihood:** 3 (silent failures in async schedulers are a known pattern)
**Impact:** 4 (stale intelligence data leads to bad recommendations — undermines the product's core value)

**Mitigation:**
1. Store `last_successful_pull` timestamps per client per source in Supabase
2. On every dashboard load, check data freshness — show "Data last updated X days ago" banner
3. Alert (dashboard + email) if any source is >48 hours stale
4. Health endpoint (`/health`) reports scheduler status (last run, next run, error count)
5. Wrap all scheduler tasks in try/catch with error logging
6. On process restart, check for missed pulls and execute immediately
7. Dead man's switch: external uptime monitor (Uptime Kuma on Hetzner) pings /health every 5 minutes

**Spike needed:** No — implement defensive scheduling from the start.

---

## Risk 9: Voice Analysis Accuracy (Stylometrics on Short Articles)

**Description:** Stylometric features (sentence length variance, type-token ratio, passive voice ratio, etc.) require statistical significance to be reliable. The brief requires 50-100 articles for corpus analysis. However: (a) short articles (<500 words) have insufficient text for reliable TTR measurement, (b) translated content has distorted stylometric features (translator's voice, not author's), (c) heavily edited content may reflect editor's style more than writer's.

**Likelihood:** 4 (many content sites have a mix of short and translated articles)
**Impact:** 3 (poor voice matching produces content that sounds "off" — damages client trust but doesn't break the system)

**Mitigation:**
1. Minimum article length threshold: exclude articles under 800 words from corpus
2. Confidence scoring: report persona confidence based on corpus size and variance. <30 articles = "Low confidence, consider manual review"
3. Allow manual persona override — client can edit the generated persona
4. A/B testing: generate sample paragraphs in detected voice, let client approve before pipeline integration
5. Language detection: flag translated articles (statistical signature differs from native content)
6. Graceful degradation: if voice analysis confidence is too low, fall back to a generic "professional editorial" persona

**Spike needed:** Yes — run stylometric analysis on a real 100-article corpus (two known authors) and measure classification accuracy. (3-5 days)

---

## Risk 10: Solo Developer Bus Factor

**Description:** The entire platform expansion is planned for a solo developer. If that developer is unavailable (illness, burnout, departure), all development stops. There is no documentation of the architecture decisions, no pair programming knowledge transfer, and the codebase has no secondary maintainer.

**Likelihood:** 3 (over a 6-month project, some disruption is likely)
**Impact:** 5 (complete project halt — no one else understands the system)

**Mitigation:**
1. Comprehensive code documentation (JSDoc on all new modules, architecture decision records)
2. This dev_docs/tribunal directory serves as architectural documentation
3. Test coverage >80% for all new modules (tests are documentation)
4. Weekly commit summaries in a CHANGELOG.md
5. Architecture diagrams (data flow, module dependency, deployment topology)
6. Modular design: each service layer is independently understandable
7. Onboarding document: "How to contribute to ChainIQ" guide for a second developer
8. Consider hiring a part-time contractor for Phase 2+ to reduce single-point-of-failure

**Spike needed:** No — mitigations are process-based, not technical.

---

## Risk Summary Matrix

| # | Risk | Likelihood | Impact | Score (L*I) | Spike? |
|---|------|-----------|--------|-------------|--------|
| 1 | server.js monolith | 5 | 4 | **20** | No |
| 2 | performance_snapshots row growth | 4 | 5 | **20** | Yes (2-3d) |
| 3 | Google OAuth verification delay | 3 | 5 | **15** | No (submit Day 1) |
| 4 | HDBSCAN without npm deps | 4 | 3 | **12** | Yes (3-5d) |
| 5 | WordPress builder compatibility | 3 | 3 | **9** | Yes (5-7d) |
| 6 | API cost overrun | 3 | 4 | **12** | Yes (2-3d) |
| 7 | OAuth token refresh failure | 3 | 3 | **9** | No |
| 8 | Silent scheduler failure | 3 | 4 | **12** | No |
| 9 | Voice analysis accuracy | 4 | 3 | **12** | Yes (3-5d) |
| 10 | Solo developer bus factor | 3 | 5 | **15** | No |

**Top 3 risks by score:** server.js monolith (20), performance_snapshots growth (20), Google OAuth verification (15). All three have clear mitigation strategies. The monolith risk is fully within our control. The database risk requires a spike. The OAuth risk requires an immediate external action (Day 1 submission).

**Total spike effort for risk mitigation: 16-26 days.** These spikes should be front-loaded in Phase 0 and early Phase 1, not deferred.
