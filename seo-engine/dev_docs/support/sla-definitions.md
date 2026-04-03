# ChainIQ SLA Definitions

> **Owner:** Solo Developer
> **Last Updated:** 2026-03-28
> **Effective Date:** [Launch date]
> **Review Cadence:** Quarterly or when tiers change

---

## 1. SLA Overview

Service Level Agreements define the committed response and resolution times for customer support across all ChainIQ tiers. These SLAs are designed for a solo developer operation, meaning they must be achievable by one person while also maintaining engineering velocity. SLAs are promises to customers and should be treated as binding commitments — failure to meet them erodes trust faster than any product bug.

### Business Hours Definition

All SLA times are measured in **business hours** unless otherwise noted.

| Parameter | Value |
|-----------|-------|
| **Business days** | Sunday through Thursday (MENA business week) |
| **Business hours** | 9:00 AM - 6:00 PM GST (UTC+4) |
| **Holidays** | UAE public holidays — published annually in the knowledge base |
| **Weekend** | Friday and Saturday |

**Important:** The MENA-aligned schedule differs from Western expectations. Clearly communicate this in the knowledge base and during customer onboarding so clients in other time zones have correct expectations.

---

## 2. Detailed SLA Table

### Response Time SLAs

Response time is measured from when a ticket enters the human support queue (after AI chatbot handoff or direct email receipt) to the first substantive human response. Auto-acknowledgments do not count as a response.

| Severity | Free Tier | Pro Tier | Enterprise Tier |
|----------|-----------|----------|-----------------|
| **SEV1** (Platform down, data breach) | 48 business hours | 4 business hours | 1 business hour |
| **SEV2** (Major feature broken) | 48 business hours | 8 business hours | 2 business hours |
| **SEV3** (Minor issue, workaround exists) | 48 business hours | 24 business hours | 8 business hours |
| **SEV4** (Cosmetic, enhancement request) | Best effort | 48 business hours | 24 business hours |

### Resolution Time SLAs

Resolution time is measured from the first human response to the point where the issue is confirmed resolved by the customer or auto-closed after confirmation request.

| Severity | Free Tier | Pro Tier | Enterprise Tier |
|----------|-----------|----------|-----------------|
| **SEV1** | Best effort (5 business days) | 8 business hours | 4 business hours |
| **SEV2** | Best effort (5 business days) | 3 business days | 1 business day |
| **SEV3** | Best effort (10 business days) | 5 business days | 3 business days |
| **SEV4** | No commitment | 10 business days | 5 business days |

### Channel-Specific SLAs

| Channel | Free Tier | Pro Tier | Enterprise Tier |
|---------|-----------|----------|-----------------|
| **Knowledge Base** | Self-serve 24/7 | Self-serve 24/7 | Self-serve 24/7 |
| **AI Chatbot** | 24/7 automated | 24/7 automated | 24/7 automated |
| **Email** | 48h response | 24h response | 4h response |
| **Live Chat** | Not available | Business hours, 24h response | Business hours, 1h response |
| **Direct Line** | Not available | Not available | Business hours, immediate |

---

## 3. Escalation Triggers

Escalation triggers define when a ticket's handling must change because the current approach is not working. In a solo developer context, "escalation" means shifting mental mode from routine support to focused engineering investigation.

### Automatic Escalation Triggers

| Trigger | Action |
|---------|--------|
| **No response within 2x SLA** | Ticket flagged as breached; next action item on daily checklist |
| **Customer escalation request** | Customer explicitly asks to escalate; immediately reprioritize |
| **Data loss reported** | Auto-escalate to SEV1 regardless of original severity |
| **Security concern raised** | Auto-escalate to SEV1; follow key-compromise playbook if applicable |
| **3+ tickets on same issue from different customers** | Indicates systemic problem; escalate to engineering investigation |
| **Customer threatens churn** | Escalate to personal outreach within 4 business hours |

### Escalation Communication

When a ticket is escalated, the customer should receive an acknowledgment:

> "Thank you for your patience. I'm personally escalating this to ensure it receives the attention it deserves. You'll hear from me within [escalated SLA time] with a detailed update."

---

## 4. SLA Exclusions

The following situations are explicitly excluded from SLA measurement to keep commitments honest and achievable:

| Exclusion | Rationale |
|-----------|-----------|
| **Third-party outages** (Supabase, OpenAI, Anthropic, Cloudflare) | Cannot control vendor availability; communicate status but do not count against SLA |
| **Customer-caused issues** (misconfigured API keys, invalid input, browser extensions interfering) | Resolution requires customer action; clock pauses while waiting for customer response |
| **Feature requests** | Not bugs; tracked separately in the backlog |
| **Issues reported outside supported channels** | Social media posts, forum mentions, etc. are not SLA-tracked |
| **Force majeure** | Natural disasters, regional internet outages, government-mandated shutdowns |
| **Beta/preview features** | Explicitly labeled as "beta" in the UI; best-effort support only |

### Clock Pause Rules

The SLA clock pauses when:
1. Waiting for customer to provide requested information (auto-resume after 48 hours of silence with a follow-up prompt)
2. Issue requires a third-party fix (Supabase, etc.)
3. Issue is in "Monitoring" status (fix applied, waiting to confirm stability)

---

## 5. SLA Measurement and Reporting

### How SLAs Are Measured

1. **Data source:** Crisp analytics dashboard — tracks first response time, resolution time, and conversation metadata.
2. **Measurement period:** Monthly, aligned with billing cycles.
3. **Calculation:**
   - SLA compliance % = (Tickets resolved within SLA / Total tickets in period) x 100
   - Measured separately for each severity level and tier.

### Monthly SLA Report Structure

```markdown
# ChainIQ Support SLA Report — [Month Year]

## Summary
- Total tickets: [N]
- AI-resolved (no human): [N] ([%])
- Human-resolved: [N]
- Overall SLA compliance: [%]

## By Severity
| Severity | Tickets | Within SLA | Breached | Compliance |
|----------|---------|------------|----------|------------|
| SEV1     | [N]     | [N]        | [N]      | [%]        |
| SEV2     | [N]     | [N]        | [N]      | [%]        |
| SEV3     | [N]     | [N]        | [N]      | [%]        |
| SEV4     | [N]     | [N]        | [N]      | [%]        |

## By Tier
| Tier       | Tickets | Within SLA | Compliance |
|------------|---------|------------|------------|
| Free       | [N]     | [N]        | [%]        |
| Pro        | [N]     | [N]        | [%]        |
| Enterprise | [N]     | [N]        | [%]        |

## Trends
- [Observation about trends month-over-month]
- [Any recurring issues driving volume]

## Action Items
- [Actions to improve SLA compliance if below target]
```

### Reporting Cadence

| Audience | Frequency | Content |
|----------|-----------|---------|
| Solo dev (self-review) | Weekly | Quick scan of breached tickets, queue depth |
| Enterprise clients | Monthly | Formal SLA report (redacted to their tickets only) |
| Internal planning | Quarterly | Full report with trends, capacity planning implications |

---

## 6. SLA Targets and Consequences

### Internal Targets

| Metric | Target | Acceptable | Needs Attention |
|--------|--------|-----------|-----------------|
| Overall SLA compliance | > 95% | 90-95% | < 90% |
| SEV1 response compliance | 100% | > 95% | < 95% |
| Average first response time | < 4 hours | < 8 hours | > 8 hours |
| Customer satisfaction (CSAT) | > 4.0/5.0 | 3.5-4.0 | < 3.5 |

### If SLA Targets Are Not Met

1. **Single month below 90%:** Root cause analysis — is it volume, complexity, or availability?
2. **Two consecutive months below 90%:** Adjust SLA commitments to achievable levels OR invest in automation/hiring.
3. **Enterprise SLA breach:** Personal outreach to the affected client with explanation and remediation plan.
4. **Chronic SEV1 SLA breaches:** Indicates reliability problems that should be addressed through engineering, not support.

---

## 7. SLA Communication to Customers

### Where SLAs Are Published

1. **Pricing page** — Summary of response times by tier (simple table)
2. **Terms of Service** — Full SLA definitions with exclusions
3. **Knowledge base** — Detailed article explaining SLA measurement, business hours, and exclusions
4. **Onboarding email** — Summary of what support is included in their tier

### Setting Expectations

The most important SLA communication happens at onboarding. Each new customer should understand:
- What channels are available to their tier
- Expected response times (in their local timezone terms)
- Business hours and the MENA-aligned schedule
- How to check the status page during incidents
- That the AI chatbot is the fastest path to common answers
