# ChainIQ Project Phases

**Last Updated:** 2026-03-28
**Source:** Tribunal Round 4 MoSCoW Verdict (15/15 approval), Phase A Sprint Plan
**Audience:** Engineering, project management, stakeholders
**Timeline:** 30+ weeks across 5 phases

---

## Phase Overview

| Phase | Weeks | Theme | Features | Effort |
|-------|-------|-------|----------|--------|
| **A** | 1-6 | Foundation + Data Core | 15 | ~6 weeks |
| **B** | 7-14 | Intelligence + Quality + Publishing | 30 | ~8 weeks |
| **C** | 15-22 | Voice & Publishing Expansion | 16 | ~8 weeks |
| **D** | 23-30 | Feedback & Polish | 18 | ~8 weeks |
| **E** | 31+ | Enterprise | 12 | ~10+ weeks |

**Strategy: Vertical Slice, Not Horizontal Layers.** The roadmap does not build Layer 1 completely, then Layer 2, then Layer 3. It builds a thin vertical slice through all critical layers by Week 10: data flowing (Layer 1), intelligence producing recommendations (Layer 2), articles scored and auto-revised (Layer 4), published to WordPress (Layer 5), performance tracking started (Layer 6). Each subsequent week widens capabilities within each layer.

---

## Phase A: Foundation + Data Core (Weeks 1-6)

### Theme

Build the infrastructure skeleton, establish data pipelines, deliver first intelligence outputs. Nothing visible to end users until Week 5-6 -- this phase is foundational.

### Day-1 Actions (Execute Immediately)

1. **Submit Google OAuth consent screen** -- 2-6 week verification runs in parallel. Every day of delay adds a day to the intelligence pipeline.
2. **Apply for Semrush API access** -- 1-2 week approval.
3. **Apply for Ahrefs API access** -- 1-2 week approval.
4. **Set up Hetzner + Coolify** -- bridge server must be internet-accessible for OAuth callbacks.

### Sprint Breakdown

**Sprint 1 (Weeks 1-2): Infrastructure Foundation**

| Feature | Effort | Type |
|---------|--------|------|
| server.js route splitting refactor | L | Foundation |
| 6 Supabase DB migrations + RLS + indexes | M+6S | Foundation |
| Hetzner + Coolify deployment | M | Foundation |
| Cloudflare DNS + SSL/TLS | S+S | Foundation |
| CORS allowlist + rate limiting | S+S | Foundation |
| Test infrastructure for new modules | M | Foundation |
| Design system tokens + base components | M | Foundation |
| Arabic font loading + RTL CSS logical properties | S+S | Foundation (per P04 reservation) |

Success criteria: server.js split into route modules (no file >400 lines), 6 new tables with RLS, bridge server live on Hetzner with HTTPS, CORS allowlist active, Google OAuth consent screen submitted.

**Sprint 2 (Weeks 3-4): Data Connectors**

| Feature | Effort | MoSCoW |
|---------|--------|--------|
| Google OAuth2 flow (PKCE, token exchange, encrypted storage, refresh) | L | Must Have |
| GSC Search Analytics API client | L | Must Have |
| GA4 Reporting API client | L | Must Have |
| HTTP content crawler (sitemap-first, link-following fallback) | L | Must Have |

Success criteria: OAuth flow works end-to-end ("Connect Google" button through to "Connected" status), GSC data pulling for at least one account, GA4 data pulling, content inventory crawled for SRMG test domain, token refresh verified.

**Sprint 3 (Weeks 5-6): Scheduler, Intelligence Seed, Dashboard**

| Feature | Effort | MoSCoW |
|---------|--------|--------|
| Ingestion scheduler (daily GSC/GA4 pulls) | M | Must Have |
| Decay detection engine | L | Must Have |
| Keyword gap analyzer | L | Must Have |
| Connections dashboard page | M | Must Have |
| Content inventory dashboard page | L | Should Have (pulled forward for vertical slice demo) |
| Data purge policy (90-day rolling, monthly rollup) | M | Foundation |

Success criteria: scheduler runs unattended 48+ hours, decay detection produces scored alerts for 5+ URLs, gap analysis produces 10+ keyword opportunities, connections page shows real data with health indicators, content inventory displays crawled URLs.

### Phase A Dependencies

- Google OAuth consent screen submission (Day 1 -- external, 2-6 weeks)
- Hetzner account + payment method
- Privacy policy and ToS URLs (required for OAuth submission)
- SRMG test domain with GSC/GA4 configured

### Phase A Success Criteria

All 10 items must be true:

1. Bridge server running on Hetzner with HTTPS
2. Route splitting complete (no single file >400 lines)
3. 6 new Supabase tables deployed with RLS, indexes, and partitioning
4. Google OAuth flow functional (Testing mode if verification pending)
5. GSC data pulling daily for at least one connected account
6. GA4 data pulling daily for at least one connected account
7. Content inventory crawled for at least one real website
8. Decay detection producing alerts from real GSC data
9. Gap analysis producing scored opportunities from real GSC data
10. All new modules tested at 80%+ coverage (security-critical paths at 100%)

### SRMG Pilot Readiness

Phase A alone does not produce a billable product. It produces a demoable foundation: "data is flowing, first intelligence outputs are visible, SRMG can connect their accounts."

### Phase A Cost

~$34/month total (Hetzner CPX21 ~$9, Supabase Pro $25, Cloudflare free). GSC and GA4 APIs are free.

### Gotchas Relevant to Phase A

- **GOTCHA (database):** PostgreSQL does NOT auto-index foreign key columns. All 6 new tables must have explicit indexes on every FK column. Failure to index `user_id` on `performance_snapshots` will cause full table scans as data grows.
- **GOTCHA (database):** Always add `created_at` and `updated_at` timestamps to every table. Adding retroactively requires migrations on every table. The 6 new tables must include these from Day 1.
- **GOTCHA (database):** Use UUID primary keys, not auto-increment. Auto-increment leaks record counts and creation rates -- unacceptable for a multi-tenant SaaS.
- **GOTCHA (database):** SQL date vs JavaScript date timezone issues. GSC data uses UTC dates. Dashboard must display in the client's timezone. Use consistent UTC handling throughout and convert only at the display layer.
- **GOTCHA (deployment):** Environment variables with trailing newlines (Windows issue) break auth silently. On Windows, use `node -e "process.stdout.write('value')"` when setting env vars, never `echo`.
- **GOTCHA (design):** Design BEFORE code. Do not build Phase A dashboard pages with default shadcn and plan to "make it pretty later." Establish design tokens in Sprint 1 and use them from the start.
- **GOTCHA (design):** Empty states are not optional. The connections dashboard and content inventory pages MUST show proper empty states ("Connect your Google Search Console to see your content inventory"), not blank tables.
- **GOTCHA (testing):** Mock only at boundaries (database, external API), not internal functions. OAuth tests must use real HTTP calls against the bridge server, not mocked auth middleware.
- **GOTCHA (testing):** Each test must be independent -- no test should depend on another test's side effects. Scheduler tests especially must not depend on prior data pull tests having run.

---

## Phase B: Intelligence + Quality + Publishing (Weeks 7-14)

### Theme

Complete the vertical slice: recommend a topic, generate an article, score its quality, publish to WordPress, track performance. SRMG pilot goes live.

### Features (30 total -- densest phase)

**Intelligence Layer:**
- Semrush API client (#4), Ahrefs API client (#5)
- URL cannibalization detection (#13)
- Topic recommender agent (#14) -- the "what to write next" engine
- Opportunities dashboard page (#17)
- Content inventory dashboard (#10)

**Quality Gate:**
- 60-point SEO checklist engine (#25)
- 7-signal weighted scoring (#26)
- E-E-A-T 10-dimension rubric (#27)
- Auto-revision loop, max 2 passes (#28)
- Readability analysis (#29), heading hierarchy (#30), keyword density (#31), meta tags (#32), internal links (#33), image scoring (#34)
- Actionable fix suggestions (#46)
- Quality score API endpoint (#47)
- Dashboard quality report tab (#48)

**Publishing:**
- Universal Article Payload format (#49)
- WordPress plugin via wp_insert_post (#50)
- Yoast/RankMath meta auto-fill (#51)
- Draft-first publishing (#52)
- Image CDN pipeline (#53)
- Category/tag mapping (#54)
- Generic webhook publisher (#57)
- Featured image auto-set (#70)

**Feedback (seed):**
- 30/60/90 GSC tracking (#71)
- 30/60/90 GA4 tracking (#72)
- Content lifecycle status (#79)
- Keyword position tracking (#80)
- Performance API endpoints (#84)

### Phase B Success Criteria

1. Topic recommender produces scored recommendations from real data
2. Quality gate scores articles with the 7-signal rubric
3. Auto-revision loop improves article scores by 10+ points on average
4. WordPress plugin publishes articles as drafts with Yoast/RankMath meta
5. Featured images upload to WordPress media library
6. Connections dashboard shows all connected services with health status
7. SRMG editorial team can log in and navigate without developer help
8. 48+ hours of unattended scheduler operation with zero silent failures
9. Weekly action brief: top 10 priority recommendations, delivered automatically

### SRMG Pilot Goes Live

Phase B completion = SRMG pilot fully operational. First paying client at Tier 2 ($5,000/month managed service).

### Gotchas Relevant to Phase B

- **GOTCHA (deployment):** The WordPress plugin operates at the `wp_posts` database level via `wp_insert_post()`, not at the builder level. This ensures compatibility with Gutenberg, Elementor, WPBakery, and Classic Editor. Do NOT build builder-specific integrations.
- **GOTCHA (testing):** High coverage does not mean good tests. Quality gate tests must assert meaningful outcomes (score improves after revision), not just that code executes. Coverage measures which code runs, not whether assertions are meaningful.
- **GOTCHA (design):** Loading states must use skeletons matching the final layout shape, not generic spinners. The opportunities dashboard and content inventory will load large datasets -- skeleton previews prevent layout shift and reduce perceived load time.
- **GOTCHA (design):** Never use color as the only indicator of state (WCAG 1.4.1 failure). Decay severity, connection health, and quality scores must use color + icon + text.

---

## Phase C: Voice & Publishing Expansion (Weeks 15-22)

### Theme

Ship the premium differentiator (voice intelligence) and expand CMS support. Unlock the premium pricing tier.

### Features (16 total)

**Voice Intelligence:**
- Stylometric corpus analysis (#18, XL effort -- front-load)
- AI vs human classification (#19)
- Writer clustering (#20, k-means MVP, HDBSCAN later)
- Voice profile generation (#21)
- Voice analyzer agent (#22)
- Voice profiles dashboard page (#23)
- Style cloning for draft-writer (#24)
- Voice match scoring (#35)
- AI detection scoring (#36)

**Quality Expansion:**
- Topical completeness vs competitors (#37)
- Arabic/RTL validation (#38)

**Publishing Expansion:**
- Shopify app (#55)
- Ghost adapter (#56)
- Publish scheduling (#58)
- Bulk publishing (#59)
- Version control (#60)
- CMS connection health monitoring (#61)
- SEO plugin compatibility layer (#69)

### Phase C Success Criteria

1. Voice analyzer detects distinct writer personas from a real content corpus
2. Generated articles match target writer voice (stylometric distance <= 0.3)
3. Shopify app publishes blog posts via Blog API
4. Ghost adapter publishes via Admin API
5. Bulk publishing handles 10+ articles with progress tracking
6. Arabic/RTL validation passes for Arabic content

### Special Notes

- **Week 15 is a design hardening sprint** (per T02 reservation) -- consistency pass across all Phase A-B screens before starting voice work.
- **HDBSCAN clustering decision:** Use simplified k-means (pure JS, ~100 lines) for MVP. If accuracy is insufficient, shell out to Python (`child_process.spawn('python3', ['cluster.py'])`) for HDBSCAN. This preserves zero npm deps while accessing advanced clustering.
- The generic webhook publisher (#57, Phase B) serves as Shopify bridge until the native app ships (per P09 reservation).

### Gotchas Relevant to Phase C

- **GOTCHA (design):** The "default shadcn trap" -- every other Next.js app uses the same defaults. Voice profiles dashboard and Shopify admin screens must use customized components with ChainIQ design tokens, not stock shadcn.
- **GOTCHA (design):** Dark mode is all or nothing. If Phase A-B shipped dark mode, every Phase C screen must support it. A single light-mode hardcoded color breaks the experience.
- **GOTCHA (design):** Touch targets must be 44x44px minimum for mobile. Bulk publishing checkboxes and voice profile action buttons must meet this threshold.

---

## Phase D: Feedback & Polish (Weeks 23-30)

### Theme

Activate the data moat. Close the prediction-to-outcome loop. Executive-level reporting.

### Features (18 total)

**Feedback Loop Core:**
- Prediction vs actual comparison (#73, Must Have)
- Accuracy scoring per article (#74, Must Have)
- Scoring weight recalibration (#75, XL effort, Should Have -- the compounding moat)
- Content ROI calculation (#76)
- Client-facing performance reports (#77)
- Automated performance alerts (#78)
- Portfolio-level analytics (#81)
- Churn prediction (#82)
- Historical baseline comparison (#83)
- Performance dashboard page (#85)
- Content calendar ROI (#91)

**Intelligence Expansion:**
- Google Trends seasonal curves (#6)
- Seasonality planning (#15)
- Saturation scoring (#16)

**Quality Expansion:**
- Schema markup validation (#39)
- Featured snippet optimization (#40)
- PAA targeting (#41)
- Bulk article scoring (#44)
- Quality trend tracking (#45)

**Publishing Expansion:**
- Edit-after-publish sync (#66)
- Multi-site syndication (#67)

### Phase D Success Criteria

1. Prediction vs actual comparison works for articles published 30+ days ago
2. Accuracy scoring produces normalized 0-100 scores per article
3. Recalibration engine adjusts scoring weights based on accumulated data
4. ROI calculation shows (traffic value - generation cost) / generation cost
5. Client-facing reports exportable as PDF/HTML
6. Portfolio analytics aggregate performance across all articles
7. Performance dashboard visualizes trends with charts

### Why Phase D Matters Strategically

Phase D is when ChainIQ transitions from "a tool that makes recommendations" to "a tool that proves its recommendations work." This proof is what justifies the $5K-$12K/month pricing. Without the feedback loop, ChainIQ is making claims. With it, ChainIQ is providing evidence.

---

## Phase E: Enterprise (Weeks 31+)

### Theme

Enterprise feature depth. Market expansion beyond initial verticals.

### Features (12 total)

- TF-IDF semantic analysis (#42)
- Entity salience scoring (#43)
- Contentful adapter (#62)
- Strapi adapter (#63)
- Webflow adapter (#64)
- Sanity adapter (#65)
- Seasonal adjustment (#86)
- Competitor movement tracking (#87)
- Backlink acquisition tracking (#88)
- Conversion attribution (#89)
- Recommendation accuracy leaderboard (#92)
- Auto-refresh triggers (#93)

### Phase E Success Criteria

1. At least 2 headless CMS adapters (Contentful + Strapi) functional
2. Conversion attribution links GA4 conversions to specific articles
3. Competitor movement tracking detects ranking changes in competitor content
4. Auto-refresh triggers automatically recommend content updates for declining articles

### Phase E Considerations

Phase E features are all "Could Have" classification. They expand the platform's appeal to developer-focused markets (headless CMS), advanced analytics users (TF-IDF, entity salience), and enterprise accounts requiring deep attribution. Timing and scope should be driven by client demand and revenue traction from Phases A-D.

---

## Critical Path Visualization

```
WEEK  1    2    3    4    5    6    7    8    9   10   11   12   13   14
      |-------- PHASE A ---------|-------------- PHASE B --------------|

DAY 1: Submit Google OAuth consent screen (2-6 week verification in background)
DAY 1: Apply for Semrush/Ahrefs API access
DAY 1: Set up Hetzner + Coolify

      [Route Split + DB + Security]        <-- Sprint 1 (Weeks 1-2)
      [Design Tokens + Test Infra + HTTPS]

                   [OAuth + GSC + GA4]      <-- Sprint 2 (Weeks 3-4)
                   [Content Crawler]

                                [Scheduler]  <-- Sprint 3 (Weeks 5-6)
                                [Decay + Gap + Dashboard]

                                        [Recommender + Quality Gate]  <-- Sprint 4-5
                                        [WordPress Plugin + Publishing]
                                                    [Feedback Tracking] <-- Sprint 6-7
                                                    [Semrush/Ahrefs]

MILESTONE: Week 6  -- Data flowing, first intelligence outputs
MILESTONE: Week 10 -- Vertical slice: recommend -> generate -> score -> publish -> track
MILESTONE: Week 14 -- SRMG pilot fully operational
MILESTONE: Week 22 -- Voice intelligence + multi-CMS
MILESTONE: Week 30 -- Feedback loop + data moat activated
```

---

## Dependency Chain

```
Phase A: OAuth (#1) --> GSC (#2) --> Decay (#11) + Gap (#12)
         OAuth (#1) --> GA4 (#3)
         Crawler (#7) --> Content Inventory
         [Foundation: route split, DB, Hetzner, design tokens]

Phase B: Decay (#11) + Gap (#12) --> Recommender (#14) --> Opportunities page (#17)
         SEO checklist (#25) --> Scoring (#26) --> Auto-revision (#28)
         Payload format (#49) --> WordPress (#50) --> Yoast (#51) + Images (#53)
         GSC (#2) + Published articles --> GSC tracking (#71)
         GA4 (#3) + Published articles --> GA4 tracking (#72)

Phase C: Crawler (#7) --> Stylometrics (#18) --> Profiles (#21) --> Cloning (#24)
         Payload (#49) --> Shopify (#55), Ghost (#56)

Phase D: GSC tracking (#71) + GA4 tracking (#72) --> Prediction comparison (#73)
         Prediction (#73) --> Accuracy (#74) --> Recalibration (#75)

Phase E: Semrush/Ahrefs (#4, #5) --> Competitor tracking (#87)
         GA4 tracking (#72) --> Conversion attribution (#89)
```
