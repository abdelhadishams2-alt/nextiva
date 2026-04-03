# ChainIQ Bug Report Pipeline

> **Owner:** Solo Developer
> **Last Updated:** 2026-03-28
> **Tools:** Crisp (intake), STATUS.md (backlog), GitHub Issues (optional tracking)

---

## 1. Overview

The bug report pipeline defines how issues are received, validated, prioritized, and resolved. For a solo developer, the pipeline must minimize overhead while ensuring no report is lost and critical issues surface immediately. The pipeline flows through four stages: **Intake → Triage → Resolution → Closure**.

---

## 2. Bug Report Template

All bug reports — whether submitted by customers via Crisp, discovered internally, or reported via email — should be captured in a standardized format. The Crisp chatbot should prompt for this information when a user reports an issue.

### Customer-Facing Template (In-App / Crisp)

The chatbot should walk users through these fields conversationally:

```
**What happened?**
[Describe what you experienced]

**What did you expect to happen?**
[Describe what you expected instead]

**Steps to reproduce:**
1. [First step]
2. [Second step]
3. [Continue as needed]

**How often does this happen?**
[ ] Every time
[ ] Sometimes (about X out of Y attempts)
[ ] Happened once

**Browser and device:**
- Browser: [Chrome / Firefox / Safari / Edge + version]
- OS: [Windows / macOS / iOS / Android + version]
- Device: [Desktop / Mobile / Tablet]

**Screenshots or screen recording:**
[Attach if available — this significantly speeds up diagnosis]

**Your account email:**
[For looking up your account details]
```

### Internal Bug Report Template

For bugs discovered during development, testing, or monitoring, use this format in the incident log or STATUS.md:

```markdown
## Bug: [Brief descriptive title]

**Reported:** [Date] by [Source: monitoring / self-discovered / customer: name]
**Priority:** P[0-3]
**Status:** [New / Triaged / In Progress / Testing / Resolved / Won't Fix]
**Affected Service:** [Bridge / Dashboard / Article Pipeline / etc.]

### Description
[What is broken, including error messages or log excerpts]

### Steps to Reproduce
1. [Step]
2. [Step]

### Expected Behavior
[What should happen]

### Actual Behavior
[What happens instead, including any error codes]

### Environment
- Endpoint: [URL or API route]
- User role: [Admin / Publisher / Free]
- Data conditions: [Specific data that triggers the bug, if relevant]

### Screenshots / Logs
[Paste or link]

### Root Cause (filled during resolution)
[Technical explanation]

### Fix Applied (filled during resolution)
[What was changed, commit SHA if applicable]
```

---

## 3. Triage Rubric

Every incoming bug report must be assigned a priority level within 4 business hours of receipt. The priority determines the response timeline, resolution approach, and whether it interrupts current work.

### Priority Definitions

| Priority | Label | Definition | Examples | Response |
|----------|-------|-----------|----------|----------|
| **P0** | Critical — Data Loss / Security | Data is being lost, corrupted, or exposed. Security vulnerability actively exploited. | User data deleted unexpectedly; API key visible in client-side code; SQL injection discovered; articles published to wrong customer's site | **Drop everything.** Respond within 1 hour. Follow incident runbook. |
| **P1** | High — Feature Broken | A core feature is completely non-functional for one or more users with no workaround. | Article generation returns 500 for all prompts; Dashboard login fails; Publishing endpoint rejects all requests; Analytics not recording any events | Respond within 4 business hours. Fix within current sprint. |
| **P2** | Medium — Degraded | A feature works but is significantly degraded, slow, or requires a workaround. | Article generation takes 5x longer than normal; Dashboard charts show stale data; Some Prompt Guard rules produce false positives on common content; Export feature generates malformed CSV | Respond within 24 business hours. Schedule for next sprint. |
| **P3** | Low — Cosmetic / Minor | Visual glitch, minor UX friction, or edge case that affects very few users. | Tooltip text cut off at certain screen widths; Chart legend overlaps on mobile; Date format inconsistent between pages; Hover state missing on secondary buttons | Respond within 48 business hours. Add to backlog. |

### Triage Decision Tree

```
Is user data being lost, corrupted, or exposed?
├── YES → P0 (follow incident runbook immediately)
└── NO
    Is a core feature completely broken with no workaround?
    ├── YES → P1
    └── NO
        Is functionality degraded or does it require a workaround?
        ├── YES → P2
        └── NO → P3
```

### Escalation Override Rules

Certain conditions automatically bump priority regardless of the triage outcome:

| Condition | Override |
|-----------|----------|
| Enterprise customer reports the issue | Bump by 1 level (P2 → P1) |
| Same bug reported by 3+ different users | Bump to at least P1 |
| Bug blocks a customer's publishing deadline | Bump to at least P1 |
| Bug involves financial data (billing, usage metering) | Bump to at least P1 |
| Security researcher reports via responsible disclosure | Treat as P0 |

---

## 4. Assignment and Workflow

### Workflow Stages

Since there is one developer, "assignment" is really about prioritization in the work queue:

```
[New] → [Triaged] → [In Progress] → [Testing] → [Resolved] → [Closed]
                         ↓
                    [Won't Fix] (with explanation to reporter)
```

| Stage | Description | Actions |
|-------|-------------|---------|
| **New** | Just received, not yet reviewed | Auto-acknowledge via Crisp chatbot |
| **Triaged** | Priority assigned, root cause hypothesized | Update reporter with priority and expected timeline |
| **In Progress** | Actively being fixed | No customer communication needed unless timeline changes |
| **Testing** | Fix applied, verifying in staging | If customer can verify, invite them to confirm |
| **Resolved** | Fix deployed to production | Notify reporter with brief explanation of the fix |
| **Closed** | Reporter confirmed or 7 days passed without objection | Auto-close with follow-up prompt |
| **Won't Fix** | Intentional behavior, out of scope, or insufficient information | Explain reasoning to reporter with empathy |

### Daily Bug Triage Routine

As a solo developer, dedicate **15 minutes each morning** to bug triage:

1. **Review new reports** from Crisp inbox and monitoring alerts (2 min)
2. **Assign priorities** using the triage rubric above (3 min)
3. **Send acknowledgments** for any unanswered reports (3 min)
4. **Review in-progress bugs** — any blocked? Any timeline changes? (3 min)
5. **Check for SLA-approaching tickets** — respond before breach (4 min)

### Integration with STATUS.md Backlog

All triaged bugs are added to `dev_docs/STATUS.md` under the appropriate section:

```markdown
## Active Bugs

### P0 — Critical
- [ ] [BUG-001] [Title] — Reported [date], Status: [status]

### P1 — High
- [ ] [BUG-002] [Title] — Reported [date], Status: [status]

### P2 — Medium
- [ ] [BUG-003] [Title] — Reported [date], Status: [status]

### P3 — Low
- [ ] [BUG-004] [Title] — Reported [date], Status: [status]
```

---

## 5. Bug Report Quality Scoring

Not all bug reports are actionable. To avoid wasting time on unclear reports, score them on receipt:

| Score | Quality | Action |
|-------|---------|--------|
| **5/5** | Steps to reproduce, expected vs actual, screenshot, environment info | Proceed directly to investigation |
| **4/5** | Most fields filled, missing screenshot or minor detail | Proceed, fill gaps during investigation |
| **3/5** | Description present but no reproduction steps | Reply asking for steps to reproduce before triaging |
| **2/5** | Vague description, no details | Reply with template, ask customer to fill in details |
| **1/5** | "It's broken" with no context | Reply with empathetic request for more information, link to bug report guide |

### Quality Improvement Actions

- If average report quality drops below 3/5, update the Crisp chatbot prompts to be more specific.
- Add a "How to report a bug" article to the knowledge base.
- Consider adding an in-app bug report form with required fields.

---

## 6. Metrics and Continuous Improvement

### Bug Pipeline Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Mean time to triage | < 4 business hours | Crisp ticket timestamps |
| Mean time to resolve (P0) | < 4 hours | Ticket lifecycle tracking |
| Mean time to resolve (P1) | < 3 business days | Ticket lifecycle tracking |
| Bug reopen rate | < 10% | Tickets reopened after "Resolved" |
| Report quality score (avg) | > 3.5/5 | Manual scoring during triage |
| Duplicate report rate | < 15% | Linked tickets in Crisp |

### Monthly Review

At the end of each month, review:
1. Total bugs by priority — are P0/P1 counts trending down? (Good sign)
2. Most common bug categories — recurring patterns indicate systemic issues.
3. Average resolution time by priority — are SLAs being met?
4. Duplicate rate — high duplicates mean the issue is customer-visible and urgent.
5. Reporter satisfaction — follow up on any low CSAT scores from bug resolutions.
