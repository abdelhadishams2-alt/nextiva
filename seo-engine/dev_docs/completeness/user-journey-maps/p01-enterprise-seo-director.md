# P01: Enterprise SEO Director — User Journey Map

**Persona:** Enterprise SEO Director (SRMG archetype)
**Tier:** Enterprise ($8-12K/mo)
**Priorities:** Data ingestion (10/10), performance tracking (10/10), content intelligence (9/10)
**Deal-breakers:** Accurate content, data source integration
**Daily workflow:** Check performance dashboard, review decay alerts, assign content tasks, generate monthly reports

---

## Phase 1: First-Time Setup

**Goal:** Connect data sources, configure organization, prove platform ingests their data correctly.

### Touchpoints
| Step | Screen | Action |
|------|--------|--------|
| 1 | Login/Signup (`/signup`) | SSO/enterprise signup via invite link from sales handoff |
| 2 | Onboarding Wizard (`/onboarding`) | Select "Enterprise Publisher" path, set language (Arabic), set timezone (AST) |
| 3 | Connections (`/settings/connections`) | Connect GSC, GA4, and internal CMS API via OAuth |
| 4 | Content Inventory (`/inventory`) | Trigger initial crawl of existing content library (5,000+ URLs) |
| 5 | Dashboard Home (`/`) | View first KPI cards populating with ingested data |

### Emotions
- **Hopeful** during signup — "This could replace our fragmented stack."
- **Anxious** during data connection — "Will it handle Arabic content and RTL correctly?"
- **Relieved** when first data appears on dashboard — "It actually pulled our GSC data."

### Pain Points
- OAuth flow for GSC may require IT department approval; multi-day delay possible.
- Large content inventory (5,000+ URLs) may take time to crawl; no progress indicator = anxiety.
- Arabic/RTL rendering issues in any screen will immediately erode trust.

### Opportunities
- Provide a "connection health" status bar showing real-time ingestion progress.
- Pre-populate dashboard with sample data while real data loads, clearly labeled as demo.
- Offer a "Request IT Access" email template for OAuth permissions.

---

## Phase 2: Learning (Week 1)

**Goal:** Run first performance audit, understand decay alerts, generate first article.

### Touchpoints
| Step | Screen | Action |
|------|--------|--------|
| 1 | Performance (`/performance`) | Review initial performance predictions and historical trend lines |
| 2 | Opportunities (`/opportunities`) | Browse scored recommendations; filter by "content decay" |
| 3 | Article Pipeline (`/articles`) | Generate first article from a decay-flagged opportunity |
| 4 | Article Detail (`/articles/[id]`) | Review generated article for factual accuracy |
| 5 | Quality Report (`/articles/[id]/quality`) | Check 7-signal quality score before approving |

### Emotions
- **Curious** exploring performance data — "How does this compare to our internal reports?"
- **Skeptical** reviewing first generated article — "Is this accurate enough for our editorial standards?"
- **Frustrated** if quality score is low on first attempt — "We need this to work out of the box."

### Pain Points
- First article may not match their editorial voice — no Voice Profile configured yet.
- Performance predictions without enough historical data may feel unreliable.
- Mapping opportunities to their internal editorial calendar requires manual work.

### Opportunities
- Prompt user to create a Voice Profile after first article generation.
- Show confidence intervals on performance predictions, not just point estimates.
- Offer CSV/API export of opportunities to sync with external editorial tools.

---

## Phase 3: Competency (Weeks 2-4)

**Goal:** Operationalize the platform — bulk workflows, team onboarding, recurring reports.

### Touchpoints
| Step | Screen | Action |
|------|--------|--------|
| 1 | User Management (`/admin/users`) | Invite editorial team members with role-based permissions |
| 2 | Voice Profiles (`/voice`) | Configure Arabic editorial voice profiles for different content verticals |
| 3 | Article Pipeline (`/articles`) | Bulk-generate articles from top-20 opportunities |
| 4 | Publish Manager (`/publish`) | Queue approved articles for CMS publishing |
| 5 | Performance (`/performance`) | Set up weekly performance digest email |

### Emotions
- **Confident** — platform is becoming part of daily workflow.
- **Impatient** with bulk operations — "Why can't I select all and generate?"
- **Satisfied** when first published articles show traffic lift.

### Pain Points
- Bulk generation without progress tracking causes uncertainty.
- Role-based permissions may not map cleanly to their org structure (editor vs. writer vs. reviewer).
- Publishing queue needs clear status indicators (draft, scheduled, live, failed).

### Opportunities
- Add bulk-select and batch-action toolbar on Article Pipeline.
- Allow custom role definitions beyond default presets.
- Show real-time publishing status with retry capability on failures.

---

## Phase 4: Mastery (Month 2+)

**Goal:** Automate recurring workflows, build executive reporting, champion platform internally.

### Touchpoints
| Step | Screen | Action |
|------|--------|--------|
| 1 | Performance (`/performance`) | Generate monthly ROI reports for C-suite |
| 2 | Dashboard Home (`/`) | Customize KPI cards to show org-specific metrics |
| 3 | Opportunities (`/opportunities`) | Set up automated opportunity alerts for content decay |
| 4 | Plugin Configuration (`/settings`) | Configure automation rules (auto-generate briefs for decaying content) |
| 5 | Blueprint Gallery (`/blueprints`) | Build custom article blueprints for recurring content types |

### Emotions
- **Empowered** — "This platform runs our content intelligence now."
- **Proud** presenting ROI data to leadership.
- **Frustrated** if automation rules lack flexibility for edge cases.

### Pain Points
- Monthly reports need PDF export with branded templates for executive distribution.
- Automation rules need conditional logic (e.g., "only alert if decay > 15% AND traffic > 1,000").
- Custom blueprints need versioning to track changes over time.

### Opportunities
- Offer white-labeled PDF report generation with custom branding.
- Build a visual rule builder for automation conditions.
- Add blueprint version history with diff view.

---

## Phase 5: Error Recovery

### Session Expiry
- **Trigger:** Enterprise users often have long sessions; token expiry mid-report is disruptive.
- **Expected behavior:** Silent token refresh; if session truly expired, redirect to login with return URL preserved.
- **Pain point:** Losing unsaved report configuration on session expiry.
- **Solution:** Auto-save all configuration state to server; restore on re-login.

### Connection Failures
- **Trigger:** GSC/GA4 OAuth token expires or API rate limit hit.
- **Expected behavior:** Banner notification on Dashboard with "Reconnect" action button.
- **Pain point:** Stale data displayed without clear indication of data freshness.
- **Solution:** Show "last synced" timestamp on all data cards; amber warning when data is > 24 hours stale.

### Failed Publish
- **Trigger:** CMS API rejects article (validation error, auth failure, network timeout).
- **Expected behavior:** Article returns to "failed" state in Publish Manager with error detail.
- **Pain point:** No way to retry without re-queuing manually.
- **Solution:** One-click retry with error log; bulk retry for multiple failures.

### Undo/Rollback
- **Trigger:** Accidentally bulk-archived articles or published wrong version.
- **Expected behavior:** Undo toast notification (5-second window); full action history in audit log.
- **Pain point:** Enterprise compliance requires audit trail of all content changes.
- **Solution:** Immutable audit log with rollback capability for all destructive actions.

---

## Onboarding Tour Content

On first login after completing the Onboarding Wizard, highlight these 5 features in sequence:

1. **Performance Dashboard** (`/performance`) — "Track content performance predictions and ROI across your entire portfolio. Your GSC data is syncing now."
2. **Content Inventory** (`/inventory`) — "Your 5,000+ URLs are being analyzed for health signals. Decay alerts will appear here within 24 hours."
3. **Opportunities** (`/opportunities`) — "AI-scored recommendations ranked by traffic impact. Start with the top 10 to see immediate results."
4. **Article Pipeline** (`/articles`) — "Generate, review, and approve content here. Every article gets a 7-signal quality check."
5. **Connections Status** (`/settings/connections`) — "Monitor your data source health. Green means syncing; amber means attention needed."

---

## Empty State Strategy

### Dashboard Home (`/`)
- Show skeleton KPI cards with animated shimmer indicating data is loading.
- Display: "Your data sources are syncing. First insights will appear within 2-4 hours for GSC, 12-24 hours for full inventory analysis."
- CTA: "While you wait, configure your Voice Profiles to match your editorial standards."

### Performance (`/performance`)
- Show sample performance chart with watermark "Sample Data" and message: "Performance predictions require 7 days of ingested data. Check back after [date]."
- CTA: "Explore the Opportunities tab for immediate actionable recommendations."

### Article Pipeline (`/articles`)
- Show a single "Generate Your First Article" card with a guided flow linking to the top-ranked opportunity.
- Message: "Start with a high-impact opportunity to see ChainIQ's content intelligence in action."

---

## "What's New" Preferences

This persona values:
- New data source integrations (e.g., "Adobe Analytics now supported")
- Performance prediction accuracy improvements
- Bulk operation enhancements
- API/export capabilities for enterprise workflows
- Compliance and audit features

**Preferred delivery:** In-app notification badge on Dashboard + weekly email digest. No modal popups — enterprise users find them disruptive.
