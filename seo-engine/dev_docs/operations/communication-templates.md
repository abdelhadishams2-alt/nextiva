# Incident Communication Templates

> **Owner:** Solo Developer
> **Last Updated:** 2026-03-28
> **Usage:** Copy the relevant template, fill in the bracketed fields, and post to the appropriate channel.

---

## 1. Status Page Update Templates

These templates follow the standard incident lifecycle: Investigating → Identified → Monitoring → Resolved. Use them for the public-facing status page (e.g., Instatus, Cachet, or a custom status page on the ChainIQ domain).

### 1.1 Investigating

Use this when you have detected an issue but have not yet identified the root cause.

```
Title: [Service Name] — Service Disruption

Status: Investigating

We are currently investigating an issue affecting [service name / specific feature].
Users may experience [specific symptoms: e.g., "inability to log in", "article
generation timeouts", "dashboard loading errors"].

We are working to identify the cause and will provide an update within
[30 minutes / 1 hour].

Posted at: [HH:MM UTC] on [YYYY-MM-DD]
```

### 1.2 Identified

Use this when you have determined the root cause and are actively working on a fix.

```
Title: [Service Name] — Service Disruption (Update)

Status: Identified

We have identified the cause of the [service name] disruption. [One sentence
describing the cause in user-friendly terms, e.g., "A database connectivity
issue is preventing data from being loaded", "A recent deployment introduced
an error in the article generation pipeline"].

We are [implementing a fix / rolling back the change / waiting for our
infrastructure provider to resolve the issue]. We expect service to be
restored within [estimated time].

[If applicable: Workaround — Users can [describe any workaround].]

Posted at: [HH:MM UTC] on [YYYY-MM-DD]
```

### 1.3 Monitoring

Use this when the fix has been applied and you are watching for stability.

```
Title: [Service Name] — Monitoring Recovery

Status: Monitoring

A fix has been implemented for the [service name] issue. Services are
currently being restored and we are monitoring for stability.

[If applicable: Some users may need to [refresh their browser / log in again /
retry their last action].]

We will provide a final update once we have confirmed full recovery.

Posted at: [HH:MM UTC] on [YYYY-MM-DD]
```

### 1.4 Resolved

Use this when the incident is fully resolved and stability is confirmed.

```
Title: [Service Name] — Resolved

Status: Resolved

The [service name] issue has been fully resolved. All services are operating
normally.

Duration: [start time] to [end time] ([X hours Y minutes])
Impact: [Brief description of what users experienced]
Cause: [One sentence root cause in user-friendly terms]

We apologize for the inconvenience. A detailed review is being conducted to
prevent recurrence.

Posted at: [HH:MM UTC] on [YYYY-MM-DD]
```

---

## 2. Stakeholder Notification Email

Use this for direct communication with MENA publisher clients during SEV1/SEV2 incidents. Send via email. Personalize the greeting for each client if time permits, otherwise use a single broadcast.

### 2.1 Initial Notification

```
Subject: [ChainIQ] Service Disruption — [Brief Title]

Hi [Client Name / "Team"],

We want to let you know that we are currently experiencing a service
disruption affecting [specific impact: e.g., "article generation",
"dashboard access", "all ChainIQ services"].

What's happening:
[1-2 sentences describing the issue in plain language]

What we're doing:
[1-2 sentences describing the response actions]

Expected resolution:
We anticipate service will be restored within [estimated time / "the
next few hours"]. We will send you an update as soon as we have more
information.

Your data is safe:
[If applicable: "This issue does not affect your stored data or
published content." / If data may be affected, be transparent about it.]

If you have any urgent questions, please reach out to [support email /
Crisp chat].

— [Your Name]
  Chain Reaction SEO
```

### 2.2 Resolution Notification

```
Subject: [ChainIQ] Service Restored — [Brief Title]

Hi [Client Name / "Team"],

Good news — the service disruption affecting [specific service] has been
fully resolved. All ChainIQ services are back to normal operation.

What happened:
[2-3 sentences explaining the root cause and fix in plain language.
Be honest but avoid unnecessary technical detail.]

Duration: [X hours Y minutes]

What we're doing to prevent this:
[1-2 specific action items, e.g., "We are adding additional monitoring
to detect this type of issue earlier", "We have updated our deployment
process to include additional validation checks".]

If you notice anything unusual, please don't hesitate to reach out.
We appreciate your patience.

— [Your Name]
  Chain Reaction SEO
```

---

## 3. Internal Status Update Template

Use this for your own incident log during an active incident. Post a new entry at each communication cadence interval (SEV1: every 30 min, SEV2: every 1 hour).

```markdown
## Status Update — [HH:MM UTC]

**Severity:** SEV[1-4]
**Current Status:** [Investigating / Identified / Mitigating / Monitoring / Resolved]

### What Changed Since Last Update
- [Action taken or finding since last update]
- [Action taken or finding since last update]

### Current Understanding
- **Root Cause:** [Known / Suspected: description / Unknown]
- **Blast Radius:** [Which services/users are affected]
- **Data Impact:** [No data loss / Potential data loss: description]

### Next Steps
- [ ] [Next action item with expected completion time]
- [ ] [Next action item with expected completion time]

### External Communications
- Status page updated: [Yes/No — last update at HH:MM]
- Customer notification sent: [Yes/No — to whom]

### Escalations
- [Any vendor tickets opened, support contacts made]
```

---

## 4. Post-Incident Review (Postmortem) Template

Write this within 48 hours of incident resolution. The goal is to learn, not to blame. As a solo developer, the "blameless" aspect means not beating yourself up — focus on systemic improvements, not personal failures.

```markdown
# Post-Incident Review: [Incident Title]

**Date:** [YYYY-MM-DD]
**Author:** [Your Name]
**Severity:** SEV[1-4]
**Duration:** [Start time] to [End time] ([total duration])
**Detection Method:** [How was the incident first detected?]

---

## Summary

[2-3 sentences summarizing what happened, the impact, and the resolution.]

---

## Timeline

| Time (UTC) | Event |
|------------|-------|
| HH:MM | [First detection signal] |
| HH:MM | [Incident acknowledged] |
| HH:MM | [Key actions taken...] |
| HH:MM | [Service restored] |
| HH:MM | [Monitoring confirmed stability] |

---

## Root Cause

[Detailed technical explanation of what caused the incident. Include
the full causal chain — not just the trigger, but the underlying
conditions that allowed it to happen.]

---

## Impact

- **Users affected:** [Number or percentage]
- **Services affected:** [List of ChainIQ services]
- **Data impact:** [Any data loss, corruption, or exposure]
- **Financial impact:** [Any costs incurred — LLM API charges, etc.]
- **Duration of user-visible impact:** [Time]

---

## What Went Well

- [Things that worked during the response]
- [e.g., "Auto-restart brought the service back within 2 minutes"]
- [e.g., "Detection was fast — alert fired within 30 seconds"]

---

## What Didn't Go Well

- [Things that could have been better]
- [e.g., "Took 20 minutes to find the right credentials"]
- [e.g., "No automated rollback was available"]
- [e.g., "Status page was not updated for 45 minutes"]

---

## Action Items

| ID | Action | Priority | Due Date | Status |
|----|--------|----------|----------|--------|
| 1 | [Specific action] | [P0/P1/P2] | [Date] | [ ] |
| 2 | [Specific action] | [P0/P1/P2] | [Date] | [ ] |

---

## Lessons Learned

[1-3 key takeaways that should inform future work. These should be
systemic, not personal — "We need better monitoring for X" not
"I should have noticed Y".]
```

---

## 5. Scheduled Maintenance Notification

Use this when planning a maintenance window that will cause user-visible downtime.

### 5.1 Advance Notice (Send 48-72 hours before)

```
Subject: [ChainIQ] Scheduled Maintenance — [Date]

Hi [Client Name / "Team"],

We will be performing scheduled maintenance on [date] from [start time]
to [end time] (UTC). During this window, [specific services] may be
temporarily unavailable.

What we're doing:
[Brief description: e.g., "Upgrading our database infrastructure to
improve performance and reliability"]

What to expect:
- [Service A] will be unavailable for approximately [duration]
- [Service B] may experience brief interruptions
- Your data will not be affected

If this timing is problematic for your publishing schedule, please
let us know and we'll work to accommodate.

— [Your Name]
  Chain Reaction SEO
```

### 5.2 Maintenance Complete

```
Subject: [ChainIQ] Maintenance Complete

Hi [Client Name / "Team"],

The scheduled maintenance has been completed successfully. All services
are back online and operating normally.

[If applicable: You may notice [improvement, e.g., "faster dashboard
loading times" / "improved article generation speed"].]

Thank you for your patience.

— [Your Name]
  Chain Reaction SEO
```

---

## 6. Usage Notes

1. **Tone:** Professional, transparent, empathetic. Never use jargon in customer-facing communications. Avoid phrases like "we apologize for any inconvenience" — be specific about what happened and what you are doing.
2. **Timing:** Speed matters more than perfection. A brief "we're aware and investigating" posted in 5 minutes is better than a detailed update posted in 30 minutes.
3. **Channels:** Status page is the single source of truth. Email is for proactive outreach to key clients. Crisp chat can reference the status page.
4. **Frequency:** During active incidents, over-communicate rather than under-communicate. Silence breeds anxiety.
5. **Post-incident:** Always follow up with a resolution message. Don't let incidents fade without closure.
