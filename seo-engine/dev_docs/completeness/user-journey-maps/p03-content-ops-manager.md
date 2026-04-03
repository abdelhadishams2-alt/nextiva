# P03: Content Ops Manager (Nadia) — User Journey Map

**Persona:** Content Ops Manager at a mid-market SaaS company
**Tier:** Professional ($3K/mo)
**Priorities:** CMS publishing (10/10), content workflow (9/10), quality assurance (8/10)
**Deal-breakers:** CMS-native publishing, content workflow management
**Daily workflow:** Check article pipeline, review quality scores, publish approved articles, monitor inventory health

---

## Phase 1: First-Time Setup

**Goal:** Connect CMS (WordPress), import existing content inventory, configure publishing workflow.

### Touchpoints
| Step | Screen | Action |
|------|--------|--------|
| 1 | Login/Signup (`/signup`) | Sign up with work email, select Professional tier |
| 2 | Onboarding Wizard (`/onboarding`) | Select "Content Operations" path; specify CMS as WordPress |
| 3 | Connections (`/settings/connections`) | Connect WordPress via REST API or application password; connect GSC |
| 4 | Content Inventory (`/inventory`) | Import existing blog posts (200-500 URLs) for health analysis |
| 5 | Plugin Configuration (`/settings`) | Configure default publishing settings (author, category, featured image behavior) |

### Emotions
- **Practical** — "I need this to slot into my existing WordPress workflow, not replace it."
- **Cautious** — "Will it actually publish correctly, or will I have to fix formatting every time?"
- **Pleased** when WordPress connection test succeeds and pulls existing posts.

### Pain Points
- WordPress API connection may require installing a plugin or generating application passwords — needs clear documentation.
- Importing 500 URLs takes time; no clear ETA or progress bar creates uncertainty.
- Default publishing settings (categories, tags, author) need to match existing WordPress taxonomy.

### Opportunities
- Provide a WordPress plugin companion that simplifies API connection to one-click.
- Show real-time import progress with estimated completion time.
- Auto-detect existing WordPress categories, tags, and authors during connection setup.

---

## Phase 2: Learning (Week 1)

**Goal:** Generate first article, understand the quality scoring system, publish one article end-to-end.

### Touchpoints
| Step | Screen | Action |
|------|--------|--------|
| 1 | Article Pipeline (`/articles`) | View pipeline columns (Draft, Review, Approved, Published); generate first article |
| 2 | Article Detail (`/articles/[id]`) | Review generated content; make manual edits to introduction |
| 3 | Quality Report (`/articles/[id]/quality`) | Study the 7-signal quality breakdown; understand what each signal measures |
| 4 | Publish Manager (`/publish`) | Add article to publishing queue; set publish date/time |
| 5 | Content Inventory (`/inventory`) | Verify published article appears in inventory with health status |

### Emotions
- **Curious** about quality signals — "What does 'topical authority score' actually mean for my content?"
- **Nervous** hitting "Publish" for the first time — "Is this going to format correctly in WordPress?"
- **Satisfied** when article appears on WordPress exactly as expected.

### Pain Points
- 7-signal quality scoring needs contextual explanations — abbreviations and scores without guidance are confusing.
- First publish may have formatting issues (headings, images, internal links) that require WordPress admin fixes.
- No preview of how article will render in WordPress theme before publishing.

### Opportunities
- Add tooltips and "Learn More" links on each quality signal in the Quality Report.
- Offer a "Preview in CMS" button that shows a rendered preview using the WordPress theme.
- Provide a post-publish verification check that screenshots the live URL and compares to expected layout.

---

## Phase 3: Competency (Weeks 2-4)

**Goal:** Build a repeatable content workflow, train team on quality gates, establish publishing cadence.

### Touchpoints
| Step | Screen | Action |
|------|--------|--------|
| 1 | Article Pipeline (`/articles`) | Set up pipeline filters (by status, author, quality score threshold) |
| 2 | Quality Report (`/articles/[id]/quality`) | Define minimum quality thresholds — reject articles below 7/10 |
| 3 | Voice Profiles (`/voice`) | Create voice profiles for different content types (product updates, thought leadership, tutorials) |
| 4 | Publish Manager (`/publish`) | Schedule a week's worth of articles with staggered publish times |
| 5 | Blueprint Gallery (`/blueprints`) | Browse and save blueprints for recurring content formats |

### Emotions
- **Organized** — "The pipeline view is becoming my daily command center."
- **Empowered** by quality gates — "I can finally enforce standards without manual review of every article."
- **Annoyed** if scheduling does not support timezone-aware publish times.

### Pain Points
- Quality threshold enforcement is manual — Nadia has to check each article. Needs automated gates.
- Publishing schedule lacks a calendar view; hard to visualize the week's cadence.
- Voice profiles need iteration — first attempts may not capture nuance.

### Opportunities
- Add automated quality gates: articles below threshold auto-move to "Needs Revision" status.
- Build a publishing calendar view (week/month) alongside the queue list.
- Offer voice profile "test mode" — generate a sample paragraph and rate its voice match.

---

## Phase 4: Mastery (Month 2+)

**Goal:** Automate content operations, measure publishing velocity, optimize inventory health.

### Touchpoints
| Step | Screen | Action |
|------|--------|--------|
| 1 | Content Inventory (`/inventory`) | Set up automated inventory health scans (weekly); configure decay alerts |
| 2 | Plugin Configuration (`/settings`) | Create automation rules: auto-generate refresh briefs for decaying content |
| 3 | Performance (`/performance`) | Track publishing velocity metrics (articles/week, time-to-publish, quality trends) |
| 4 | Opportunities (`/opportunities`) | Use content gap analysis to feed next month's editorial calendar |
| 5 | Dashboard Home (`/`) | Customize dashboard to show ops-centric KPIs (queue depth, avg quality score, publish rate) |

### Emotions
- **Confident** — "I can run content ops for the whole company from this one screen."
- **Strategic** — using data to justify headcount and budget requests.
- **Frustrated** if reporting does not export cleanly for stakeholder presentations.

### Pain Points
- Automation rules need conditional logic (e.g., "refresh only if traffic dropped > 20% AND published > 6 months ago").
- Content velocity metrics need comparison benchmarks (vs. previous month, vs. industry).
- No Slack/Teams integration for alerting the editorial team about pipeline status.

### Opportunities
- Build visual automation rule builder with AND/OR conditions.
- Show month-over-month trend lines on all velocity metrics.
- Integrate Slack/Teams webhooks for pipeline notifications (new article ready, quality gate failed, published).

---

## Phase 5: Error Recovery

### Publishing Failures
- **Trigger:** WordPress API returns 403 (permissions), 500 (server error), or timeout.
- **Expected behavior:** Article stays in queue with "Failed" badge; error message shown in plain language.
- **Pain point:** Nadia needs to know if the failure is on ChainIQ's side or WordPress's side.
- **Solution:** Categorize errors as "CMS Error" vs. "ChainIQ Error" with different remediation steps. Show "Test Connection" button inline.

### Quality Score Discrepancy
- **Trigger:** Article scored 8/10 but client/stakeholder finds factual errors.
- **Expected behavior:** Ability to flag quality score as inaccurate; triggers re-evaluation.
- **Pain point:** Loss of trust in quality scoring if it misses obvious issues.
- **Solution:** "Report Quality Issue" button on Quality Report; feeds into model improvement loop; show confidence intervals alongside scores.

### Accidental Publish
- **Trigger:** Published article that was not yet approved by stakeholders.
- **Expected behavior:** "Unpublish" action in Publish Manager that sends a delete/draft API call to WordPress.
- **Pain point:** Unpublishing from ChainIQ but article still live on WordPress.
- **Solution:** Bidirectional CMS sync — unpublish in ChainIQ reverts WordPress post to draft status. Confirmation dialog before publish with approval chain status.

### Content Inventory Sync Drift
- **Trigger:** URLs deleted or redirected on WordPress but still showing as "live" in Inventory.
- **Expected behavior:** Inventory re-crawl detects 404s/301s and updates status.
- **Pain point:** Stale inventory data leads to incorrect health reports.
- **Solution:** Show "Last Verified" date per URL; highlight URLs not verified in 7+ days; offer manual "Re-check URL" button.

---

## Onboarding Tour Content

On first login, highlight these 4 features:

1. **Article Pipeline** (`/articles`) — "Your content command center. Track every article from draft to published. Drag articles between stages or use bulk actions."
2. **Quality Report** (`/articles/[id]/quality`) — "Every article is scored on 7 signals before publishing. Set minimum thresholds to enforce quality standards."
3. **Publish Manager** (`/publish`) — "Schedule and push content directly to WordPress. No copy-pasting, no formatting headaches."
4. **Content Inventory** (`/inventory`) — "Monitor the health of your entire content library. Spot decay before it impacts traffic."

---

## Empty State Strategy

### Article Pipeline (`/articles`)
- Show a visual pipeline with 4 empty columns (Draft, Review, Approved, Published) and one example card in Draft.
- Message: "Your content pipeline starts here. Generate your first article or import existing drafts."
- CTA: "Generate First Article" (links to Opportunities for topic selection) | "Import from WordPress" (pulls existing drafts)

### Publish Manager (`/publish`)
- Show an empty calendar grid for the current week.
- Message: "No articles scheduled yet. Approve articles in the pipeline to add them to your publishing queue."
- CTA: "Go to Article Pipeline"

### Content Inventory (`/inventory`)
- Show a loading state with progress bar if crawl is in progress.
- If no crawl started: "Connect your WordPress site to import your content library. We will analyze every URL for health signals."
- CTA: "Connect WordPress" (links to Connections)

---

## "What's New" Preferences

This persona values:
- CMS integration improvements (new CMS platforms, formatting enhancements)
- Quality scoring methodology updates
- Workflow automation features (new triggers, conditions, actions)
- Publishing calendar and scheduling enhancements
- Team collaboration features (comments, approvals, notifications)

**Preferred delivery:** In-app notification dot on relevant screen tabs (e.g., dot on "Publish" tab when new scheduling features ship). Weekly product digest email with tips for content ops workflows.
