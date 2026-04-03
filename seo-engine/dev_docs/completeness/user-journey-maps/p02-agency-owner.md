# P02: Agency Owner (Marcus) — User Journey Map

**Persona:** Agency Owner managing 20+ clients
**Tier:** Agency ($5K/mo)
**Priorities:** Content intelligence (10/10), data ingestion (9/10), dashboard/admin (9/10)
**Deal-breakers:** Multi-client support, strategic recommendations
**Daily workflow:** Switch between client dashboards, review recommendations, build content calendars, generate client reports

---

## Phase 1: First-Time Setup

**Goal:** Create agency workspace, onboard first 3 clients, prove multi-tenant workflow.

### Touchpoints
| Step | Screen | Action |
|------|--------|--------|
| 1 | Login/Signup (`/signup`) | Create agency account, select Agency tier |
| 2 | Onboarding Wizard (`/onboarding`) | Select "Agency" path, configure agency branding, set default currency |
| 3 | User Management (`/admin/users`) | Create first client workspace; invite client stakeholder with view-only role |
| 4 | Connections (`/settings/connections`) | Connect GSC + GA4 for first client property |
| 5 | Dashboard Home (`/`) | Verify client-specific KPIs appear in the correct workspace |

### Emotions
- **Excited** — "Finally a platform built for agencies, not just single sites."
- **Nervous** — "Can I really manage 20 clients here without it becoming chaos?"
- **Frustrated** if client workspace switching is slow or confusing.

### Pain Points
- Creating 20+ client workspaces one-by-one is tedious; needs bulk import.
- Each client requires separate GSC/GA4 OAuth — that is 40+ authorization flows.
- Unclear how to structure team permissions (account manager sees their clients only).

### Opportunities
- Offer CSV-based bulk client import (domain, name, GSC property ID).
- Provide a delegated OAuth flow where agency authorizes once per Google account.
- Build hierarchical permissions: agency owner > account manager > client viewer.

---

## Phase 2: Learning (Week 1)

**Goal:** Generate first client deliverable, test the recommendation-to-report workflow.

### Touchpoints
| Step | Screen | Action |
|------|--------|--------|
| 1 | Dashboard Home (`/`) | Switch to "Client A" workspace |
| 2 | Opportunities (`/opportunities`) | Review scored recommendations for Client A |
| 3 | Article Pipeline (`/articles`) | Generate 3 articles from top opportunities |
| 4 | Quality Report (`/articles/[id]/quality`) | Check quality scores before sharing with client |
| 5 | Performance (`/performance`) | Screenshot performance predictions for client pitch deck |

### Emotions
- **Hopeful** reviewing opportunity scores — "This is exactly what I'd present in a strategy call."
- **Disappointed** if recommendations feel generic — "My client could get this from any tool."
- **Relieved** when quality scores are high — "I can trust this enough to show the client."

### Pain Points
- No way to export opportunities as a branded client-facing report.
- First article generation does not reflect client's brand voice (no Voice Profile yet).
- Switching between clients resets filters and view state — lost context.

### Opportunities
- Add "Export as Client Report" with agency branding on Opportunities and Performance screens.
- Prompt Voice Profile setup per client after first article generation.
- Persist filter state per client workspace so switching back restores previous view.

---

## Phase 3: Competency (Weeks 2-4)

**Goal:** Onboard remaining clients, establish repeatable monthly workflow, delegate to team.

### Touchpoints
| Step | Screen | Action |
|------|--------|--------|
| 1 | User Management (`/admin/users`) | Onboard remaining 17 clients; invite 3 account managers |
| 2 | Voice Profiles (`/voice`) | Create voice profiles for each client's brand |
| 3 | Content Inventory (`/inventory`) | Run inventory audits across all client properties |
| 4 | Publish Manager (`/publish`) | Queue articles across multiple client CMS instances |
| 5 | Plugin Configuration (`/settings`) | Set up per-client preferences (language, tone, CMS target) |

### Emotions
- **Efficient** — "The multi-client workflow is saving me hours per week."
- **Overwhelmed** if notifications from 20 clients all appear in one stream.
- **Proud** when first client sees published article driving traffic.

### Pain Points
- Notification overload — 20 clients generating alerts simultaneously.
- No cross-client dashboard showing aggregate portfolio health.
- Publishing to different CMS platforms (WordPress, Shopify, custom) per client needs per-client connection setup.

### Opportunities
- Build notification filtering by client, severity, and type.
- Create an "Agency Overview" dashboard showing all clients' KPIs in one view.
- Support per-client CMS connection profiles in Connections.

---

## Phase 4: Mastery (Month 2+)

**Goal:** Automate monthly reporting, upsell clients using platform data, scale to 30+ clients.

### Touchpoints
| Step | Screen | Action |
|------|--------|--------|
| 1 | Performance (`/performance`) | Generate automated monthly performance reports per client |
| 2 | Opportunities (`/opportunities`) | Use opportunity scores to justify new content budgets to clients |
| 3 | Blueprint Gallery (`/blueprints`) | Create reusable article blueprints for common client verticals (real estate, finance, etc.) |
| 4 | Dashboard Home (`/`) | Review agency-wide KPIs; identify underperforming clients |
| 5 | User Management (`/admin/users`) | Manage team growth — add junior content strategists |

### Emotions
- **Strategic** — "ChainIQ is now my competitive advantage."
- **Ambitious** — wants API access to build custom client portals.
- **Frustrated** if platform cannot scale beyond 25 workspaces without performance degradation.

### Pain Points
- Monthly report generation for 20+ clients is still manual — needs scheduling.
- No API for embedding ChainIQ data in agency's own client portal.
- Blueprint sharing across clients could leak proprietary strategy between competing clients.

### Opportunities
- Offer scheduled auto-generated monthly reports with email delivery per client.
- Provide a read-only API for embedding performance widgets in external portals.
- Add blueprint isolation — blueprints scoped to client or shared at agency level with explicit opt-in.

---

## Phase 5: Error Recovery

### Client Workspace Switching
- **Trigger:** Accidentally editing content in wrong client workspace.
- **Expected behavior:** Prominent client name/color badge in header at all times; confirmation dialog when performing destructive actions.
- **Pain point:** Publishing an article to the wrong client's CMS is catastrophic for an agency.
- **Solution:** Color-coded workspace indicator; "You are publishing to [Client A]" confirmation with client logo.

### Connection Failures
- **Trigger:** One client's GSC token expires among 20 active connections.
- **Expected behavior:** Connection health dashboard showing all clients' status; degraded client flagged but others unaffected.
- **Pain point:** Unclear which client's data is stale; reports generated with stale data without warning.
- **Solution:** Per-client connection status on Agency Overview; block report generation if data is stale with override option.

### Session Expiry
- **Trigger:** Long session managing multiple clients; token expires mid-workflow.
- **Expected behavior:** Silent refresh; if hard expiry, return to exact client workspace and screen after re-login.
- **Pain point:** Losing client context on re-login (defaults to first workspace).
- **Solution:** Store last-active workspace and screen in session; restore on re-auth.

### Bulk Operation Failures
- **Trigger:** Bulk article generation fails for 3 of 15 articles.
- **Expected behavior:** Partial success state — 12 completed, 3 failed with individual error reasons.
- **Pain point:** All-or-nothing failure forces re-running entire batch.
- **Solution:** Show per-item status in bulk operations; allow retry of only failed items.

---

## Onboarding Tour Content

On first login, highlight these 5 features:

1. **Client Workspace Switcher** (header) — "Switch between clients instantly. Each client has isolated data, connections, and content."
2. **Opportunities** (`/opportunities`) — "AI-scored content recommendations per client. Use these to build data-driven content calendars."
3. **Voice Profiles** (`/voice`) — "Create distinct brand voices for each client. Every generated article will match their tone."
4. **Performance** (`/performance`) — "Track ROI predictions and actual results. Export branded reports for client presentations."
5. **User Management** (`/admin/users`) — "Invite your team and clients. Control who sees what with role-based permissions."

---

## Empty State Strategy

### Dashboard Home (`/`)
- Show "Create Your First Client Workspace" card with a 3-step mini-wizard (client name, domain, connect GSC).
- Message: "Agencies using ChainIQ manage an average of 22 clients. Start with your highest-value client to see the platform in action."

### Agency Overview (cross-client view)
- Show placeholder grid of 6 client cards, 1 active and 5 grayed out with "+" icons.
- Message: "Add clients to see portfolio-wide performance. Bulk import available for 5+ clients."
- CTA: "Import Clients from CSV"

### Opportunities (`/opportunities`)
- If no client workspace selected: "Select a client workspace to view their opportunities."
- If client selected but data not yet synced: "Data syncing for [Client Name]. Opportunities will appear within 4-8 hours."

---

## "What's New" Preferences

This persona values:
- Multi-client management improvements (bulk operations, cross-client views)
- New report templates and export formats
- API and integration announcements
- Pricing/tier changes affecting agency economics
- New CMS integrations (expands addressable client base)

**Preferred delivery:** In-app changelog accessible from header; monthly "Agency Partner" email with feature highlights and tips. No per-feature modals — too disruptive when switching between clients rapidly.
