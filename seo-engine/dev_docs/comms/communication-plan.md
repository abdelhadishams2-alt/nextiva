# ChainIQ Stakeholder Communication Plan

**Prepared:** 2026-03-28
**Owner:** Development Lead
**Primary Stakeholder:** CEO, Chain Reaction
**Review Cadence:** Bi-weekly
**Channel:** Shared Google Doc + brief video walkthrough (Loom or equivalent)

---

## Stakeholder Profile

### Rami (CEO, Chain Reaction)

**Role:** Approves budget allocation, authorizes client-facing rollout, owns the SRMG relationship, and is the final decision-maker on product positioning and pricing strategy.

**Decision Authority:**
- Green-lights each phase transition (A to B, B to C, etc.)
- Approves SRMG pilot launch timing
- Signs off on new client onboarding
- Authorizes infrastructure spend increases as client count grows

**Primary Concerns:**
1. **Timeline reliability** -- Is the 6-week Phase A on track? Will the SRMG pilot demo be ready by Week 10?
2. **SRMG pilot readiness** -- Can we demonstrate end-to-end value (data flowing, intelligence outputs, content published) to SRMG's editorial team without embarrassment?
3. **Revenue potential** -- When does the first dollar come in? When does MRR hit $50K? What is the break-even point?
4. **Competitive window** -- Is the Arabic-first advantage still intact? Has any competitor moved into this space?
5. **Risk exposure** -- What are the external blockers (Google OAuth, API approvals) and what happens if they slip?

**Communication Preferences:**
- Executive-level summaries, not technical deep dives
- Visual progress indicators (green/yellow/red status)
- Revenue milestones tied to development milestones
- Honest risk reporting -- no surprises, surface problems early
- Brief format: 1-page written summary + 5-minute video walkthrough maximum

---

## Communication Cadence

### Bi-Weekly Update Cycle

Every two weeks (aligned with sprint boundaries), the CEO receives:

1. **Written Summary (shared doc):** 1-page update covering progress, blockers, risks, and next sprint priorities. Uses a consistent template (see below).
2. **Video Walkthrough (5 minutes max):** Screen recording showing what was built, with emphasis on visible progress (dashboards, data flowing, features working). No code reviews. The video should be something the CEO could forward to SRMG if needed.

### Communication Schedule

| Date Range | Communication | Content | Format |
|------------|--------------|---------|--------|
| Week 1 (Kickoff) | Kickoff Summary | Project scope, timeline, Phase A objectives, Day-1 actions taken (OAuth submitted, Hetzner provisioned), first risk register | Shared doc + 5-min video |
| Week 2 (Sprint 1 end) | Sprint 1 Report | Infrastructure complete: server deployed on Hetzner with HTTPS, database tables created, route splitting done, security hardened. Green/yellow/red on all 9 Sprint 1 success criteria | Shared doc + 3-min video |
| Week 4 (Sprint 2 end) | Sprint 2 Report | Data connectors live: Google OAuth working, GSC pulling data, GA4 pulling data, content crawler mapping URLs. First real data visible in database. OAuth verification status update | Shared doc + 5-min video showing real data |
| Week 6 (Phase A end) | Phase A Completion Report | All 14 Phase A checklist items scored. Decay detection producing alerts, gap analysis finding opportunities, scheduler running unattended. Revenue implications: "We can now demo data intelligence to SRMG" | Shared doc + 5-min video demo |
| Week 8 (Sprint 4 end) | Phase B Progress | Topic recommender producing scored recommendations, quality gate scoring articles. First article generated from a data-driven recommendation. WordPress publishing in testing | Shared doc + 5-min video |
| Week 10 (Vertical Slice) | SRMG Pilot Update | End-to-end pipeline working: recommend topic, generate article, score quality, publish to WordPress, track performance. Pilot readiness checklist status. Decision point: schedule SRMG demo? | Shared doc + 5-min demo video suitable for sharing with SRMG |
| Week 14 (Phase B end) | Phase B Completion + Pilot Launch | SRMG pilot fully operational. Semrush/Ahrefs connected. Feedback tracking begun. Revenue: first invoice to SRMG ($5K/month) | Shared doc + 5-min video |
| Monthly (Phase C onward) | Monthly Business Review | MRR, client count, pipeline health, competitive landscape, next milestone. Format shifts from development updates to business metrics | Shared doc + 5-min video |

---

## Update Template

Every bi-weekly update follows this exact structure:

### 1. Traffic Light Summary (30 seconds to read)

| Area | Status | Note |
|------|--------|------|
| Timeline | Green/Yellow/Red | On track / X days behind / blocked by Y |
| SRMG Readiness | Green/Yellow/Red | Ready / needs Z before demo / at risk |
| Technical Health | Green/Yellow/Red | All systems stable / issue with X / critical bug |
| External Dependencies | Green/Yellow/Red | OAuth approved / pending / rejected |
| Budget | Green/Yellow/Red | On budget / overspend on X / needs approval for Y |

### 2. What Shipped This Sprint (3-5 bullet points)

Plain-language description of what was built. No technical jargon. Each bullet answers: "What can we now do that we could not do two weeks ago?"

### 3. What is Blocked or At Risk (0-3 items)

Honest assessment of blockers. For each: what is blocked, why, what is the mitigation, and what decision (if any) is needed from the CEO.

### 4. Next Sprint Priorities (3-5 items)

What the next two weeks will focus on. Tied to the roadmap phase and milestone.

### 5. Revenue Impact Update (1-2 sentences)

Where we stand relative to the revenue milestones. When the next billable milestone arrives.

---

## Escalation Protocol

Not every issue requires a bi-weekly report. Some need immediate attention:

| Trigger | Action | Timeline |
|---------|--------|----------|
| Google OAuth verification rejected | Immediate message to CEO with mitigation plan (Testing mode fallback) | Same day |
| SRMG requests demo earlier than planned | Assess readiness, propose what can be shown, get CEO alignment | Within 24 hours |
| Critical security vulnerability discovered | Immediate notification, pause feature work, fix first | Same hour |
| External dependency delayed > 2 weeks beyond estimate | Update CEO with revised timeline and scope implications | Within 48 hours |
| Infrastructure cost exceeds budget by > 30% | Notification with cost breakdown and optimization plan | Within 1 week |

---

## What This Communication Plan Does NOT Cover

- **Technical team communication:** Developer handoffs, code reviews, and architecture decisions are documented in `dev_docs/` and are not part of the CEO communication stream.
- **SRMG-facing communication:** Direct communication with SRMG's editorial team is managed by Chain Reaction's account team. The CEO decides when and what to share from development updates.
- **Investor communication:** If investors require updates, the CEO adapts the bi-weekly summaries. The development team does not communicate directly with investors.

---

## Success Criteria for This Communication Plan

The communication plan is working if:

1. The CEO is never surprised by a delay or blocker -- all risks are surfaced at least 2 weeks before they become critical
2. The CEO can explain ChainIQ's current capabilities and timeline to SRMG in a 5-minute conversation at any point
3. Decision requests (budget approval, pilot timing, scope changes) are resolved within 1 week of being raised
4. The bi-weekly cadence is maintained without skipped updates -- consistency builds trust
5. Video walkthroughs are referenced by the CEO when discussing ChainIQ with external stakeholders
