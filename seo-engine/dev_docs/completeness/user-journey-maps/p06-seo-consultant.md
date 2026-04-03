# P06: SEO Consultant (Freelance) — User Journey Map

**Persona:** Freelance SEO Consultant
**Tier:** Creator/Growth ($149-500/mo)
**Priorities:** Data ingestion (10/10), content intelligence (9/10), affordability
**Deal-breakers:** GSC/GA4 integration, affordable pricing
**Daily workflow:** Connect client GSC, run opportunity analysis, generate articles, check quality, publish to WordPress

---

## Phase 1: First-Time Setup

**Goal:** Sign up on the cheapest viable plan, connect a client's GSC, and prove value within the free trial or first billing cycle.

### Touchpoints
| Step | Screen | Action |
|------|--------|--------|
| 1 | Login/Signup (`/signup`) | Sign up with personal email; select Creator tier ($149/mo); enter credit card |
| 2 | Onboarding Wizard (`/onboarding`) | Select "SEO Professional" path; skip branding/team steps |
| 3 | Connections (`/settings/connections`) | Connect first client's GSC property via OAuth; connect GA4 |
| 4 | Content Inventory (`/inventory`) | Trigger crawl of client's site (50-200 URLs) |
| 5 | Opportunities (`/opportunities`) | View first scored recommendations while inventory loads |

### Emotions
- **Price-sensitive** — "Is this worth $149/mo? I need to prove ROI to myself in week 1."
- **Impatient** — wants actionable data immediately, not a 24-hour wait.
- **Relieved** when GSC connects smoothly — "At least the integration works."

### Pain Points
- $149/mo is significant for a freelancer; needs to see value before the first invoice.
- Onboarding wizard has enterprise-focused steps (team, branding) that are irrelevant — feels like a product not built for solo users.
- Small site crawl (50 URLs) should be fast, but if it takes the same time as 5,000 URLs, feels wasteful.

### Opportunities
- Offer a 14-day free trial or "first 5 articles free" to reduce activation friction.
- Detect solo/freelancer signup and skip team-related onboarding steps.
- Prioritize small-site crawls — 50 URLs should complete in under 5 minutes.

---

## Phase 2: Learning (Week 1)

**Goal:** Generate first client deliverable — one article published to WordPress — and understand quality scoring.

### Touchpoints
| Step | Screen | Action |
|------|--------|--------|
| 1 | Opportunities (`/opportunities`) | Sort by traffic potential; pick top 3 opportunities |
| 2 | Article Pipeline (`/articles`) | Generate 3 articles from selected opportunities |
| 3 | Article Detail (`/articles/[id]`) | Review and lightly edit each article |
| 4 | Quality Report (`/articles/[id]/quality`) | Check quality scores; understand which signals matter most |
| 5 | Publish Manager (`/publish`) | Connect WordPress and publish best article directly |

### Emotions
- **Excited** when opportunity scores reveal gaps the client did not know about — "This is my value-add."
- **Skeptical** about article quality — "Can I really send this to a client without heavy editing?"
- **Thrilled** when first article publishes cleanly to WordPress — "This just saved me 3 hours."

### Pain Points
- Article generation uses credits/quota — unclear how many articles the Creator tier includes.
- Quality report is overwhelming on first view — too many signals without guidance on which matter most.
- WordPress publishing assumes admin-level access; freelancers may only have editor credentials.

### Opportunities
- Show remaining credits/quota prominently on Article Pipeline screen.
- Offer a "Quick Quality Summary" — one overall score with expandable detail — instead of all 7 signals at once.
- Support WordPress editor-level permissions for publishing, not just admin.

---

## Phase 3: Competency (Weeks 2-4)

**Goal:** Manage 3-5 client sites, develop a repeatable workflow, justify the monthly cost.

### Touchpoints
| Step | Screen | Action |
|------|--------|--------|
| 1 | Connections (`/settings/connections`) | Add 2 more client GSC properties |
| 2 | Content Inventory (`/inventory`) | Run inventory health checks across all 3 client sites |
| 3 | Opportunities (`/opportunities`) | Compare opportunity scores across clients; prioritize highest-impact work |
| 4 | Article Pipeline (`/articles`) | Batch-generate articles; use filters to view per-client |
| 5 | Performance (`/performance`) | Check if first published articles are gaining traction |

### Emotions
- **Efficient** — "Three client audits in one morning. This used to take me a full week."
- **Anxious** about tier limits — "Am I going to hit a paywall mid-client-project?"
- **Validated** when first published article shows impressions in GSC — "Proof that this works."

### Pain Points
- Creator tier may limit number of connected GSC properties — unclear ceiling.
- No client-level separation on lower tiers — all data mixes in one view.
- Performance tracking requires enough time for articles to index — early results may look empty.

### Opportunities
- Show clear tier limits on Connections screen: "3 of 5 GSC properties connected (Creator tier)."
- Offer lightweight client tagging/filtering even on lower tiers (not full workspace isolation).
- Set expectations for Performance tracking: "Articles typically need 2-4 weeks to show search performance data."

---

## Phase 4: Mastery (Month 2+)

**Goal:** Scale to 8-10 clients, decide whether to upgrade to Growth tier, use ChainIQ as competitive differentiator.

### Touchpoints
| Step | Screen | Action |
|------|--------|--------|
| 1 | Plugin Configuration (`/settings`) | Optimize generation settings based on accumulated quality feedback |
| 2 | Blueprint Gallery (`/blueprints`) | Create reusable blueprints for common client niches (local SEO, SaaS, e-commerce) |
| 3 | Performance (`/performance`) | Build simple before/after reports showing traffic lift from ChainIQ-generated content |
| 4 | Opportunities (`/opportunities`) | Use opportunity data in client pitches to sell content retainers |
| 5 | Dashboard Home (`/`) | Quick daily check — which clients need attention? |

### Emotions
- **Entrepreneurial** — "ChainIQ is now part of my service offering."
- **Frustrated** hitting Creator tier limits — "I need more properties but Growth tier is a big jump."
- **Proud** showing clients performance data — "Look what I delivered."

### Pain Points
- Tier pricing jump from Creator ($149) to Growth ($500) is steep; no intermediate option.
- Simple before/after reports need manual data compilation — no built-in "client report" export.
- Blueprints from one niche may clutter the gallery when working across many niches.

### Opportunities
- Offer a "Creator Plus" tier at $299/mo for freelancers scaling to 8-10 clients.
- Add a one-click "Client Performance Summary" export (PDF or link) showing before/after metrics.
- Support blueprint folders or tags for organizing by niche.

---

## Phase 5: Error Recovery

### GSC Connection Expiry
- **Trigger:** Client revokes Google access or OAuth token expires after 6 months.
- **Expected behavior:** Banner on Dashboard: "[Client Site] GSC disconnected. Reconnect to resume data sync."
- **Pain point:** Freelancer may not notice stale data for days if banner is not prominent enough.
- **Solution:** Email notification when any GSC connection fails, in addition to in-app banner. Show "data freshness" indicator on all screens using GSC data.

### Credit/Quota Exhaustion
- **Trigger:** Article generation fails because monthly quota is used up.
- **Expected behavior:** Clear message: "You have used 25/25 articles this month. Upgrade or wait until [date]."
- **Pain point:** Running out mid-client-project is embarrassing and deadline-breaking.
- **Solution:** Show quota usage on Dashboard and Article Pipeline. Warn at 80% usage. Offer one-time credit top-up ($10 for 5 articles) without requiring tier upgrade.

### WordPress Publish Failure
- **Trigger:** Client changed WordPress password, site is down, or plugin conflict.
- **Expected behavior:** Article stays in queue with specific error. "Authentication failed — verify your WordPress credentials."
- **Pain point:** Freelancer needs to troubleshoot client's WordPress issues while looking professional.
- **Solution:** Provide plain-language error explanations suitable for forwarding to client. "Send to client" button generates a polite email explaining what access is needed.

### Accidental Data Deletion
- **Trigger:** Deleted a client's articles or disconnected their GSC property accidentally.
- **Expected behavior:** 30-day soft delete with "Restore" option in a recycle bin.
- **Pain point:** On lower tiers, losing generated articles means losing billable work.
- **Solution:** Soft delete with recovery for all tiers. Disconnecting GSC requires typing the property domain to confirm.

---

## Onboarding Tour Content

On first login, highlight these 4 features:

1. **Connections** (`/settings/connections`) — "Connect your client's Google Search Console in 30 seconds. This powers everything — opportunity scoring, performance tracking, and content intelligence."
2. **Opportunities** (`/opportunities`) — "AI-scored content recommendations ranked by traffic potential. Use these to show clients exactly where they are leaving traffic on the table."
3. **Article Pipeline** (`/articles`) — "Generate SEO-optimized articles in minutes. Each one is quality-scored before you send it to a client."
4. **Publish Manager** (`/publish`) — "Push articles directly to WordPress. No copy-paste, no formatting cleanup."

---

## Empty State Strategy

### Dashboard Home (`/`)
- Show a single-focus card: "Connect your first client's Search Console to get started."
- Below: "ChainIQ freelancers generate an average of 15 articles/month and save 20+ hours of manual work."
- CTA: "Connect Google Search Console"

### Opportunities (`/opportunities`)
- If no GSC connected: "Connect Search Console to unlock AI-powered content opportunities."
- If GSC connected but data syncing: "Analyzing [domain.com]. Your first opportunities will appear in 1-2 hours."
- Show a sample opportunity card (watermarked "Example") so the freelancer understands the format.

### Article Pipeline (`/articles`)
- Show one example article card with quality score badge.
- Message: "Generate your first article from an opportunity, or enter a custom topic."
- CTA: "Browse Opportunities" | "Generate from Custom Topic"

### Performance (`/performance`)
- Message: "Performance tracking begins after your first article is published and indexed. Typically 2-4 weeks."
- Show a sample performance chart (watermarked) so the freelancer knows what to expect.
- CTA: "Publish your first article to start tracking."

---

## "What's New" Preferences

This persona values:
- New data source integrations (especially free tools — GSC, GA4, Bing Webmaster)
- Pricing and quota changes (especially lower-tier improvements)
- Article quality improvements that reduce editing time
- WordPress integration enhancements
- Time-saving features (bulk operations, keyboard shortcuts, templates)

**Preferred delivery:** In-app banner on login (small, dismissible). Monthly email with "Freelancer Tips" framing — show how new features save time and money, not enterprise feature announcements. Include usage stats: "You generated 18 articles this month, saving an estimated 36 hours."
