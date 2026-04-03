# ChainIQ Escalation Workflow

> **Owner:** Solo Developer
> **Last Updated:** 2026-03-28
> **Review Cadence:** Quarterly

---

## 1. Overview

The escalation workflow defines three levels of support, each with increasing depth of investigation. In a traditional support organization, these levels would be staffed by different teams. At ChainIQ, all three levels are handled by the same solo developer, but the mental framing is different at each level. The key distinction is not who handles it, but how it is handled — self-serve automation, standard support response, or deep engineering investigation.

This separation prevents every support ticket from becoming an engineering deep-dive. Most issues should resolve at L1 (self-serve) or L2 (standard response). Only genuinely complex or systemic issues should reach L3.

---

## 2. Level Definitions

### L1: Self-Serve (Knowledge Base + AI Chatbot)

**Handler:** Crisp AI chatbot + knowledge base (automated, no human involvement)

**Purpose:** Resolve common, well-documented issues instantly, 24/7, without consuming developer time.

| Attribute | Detail |
|-----------|--------|
| **Availability** | 24/7/365 |
| **Response time** | Instant (< 5 seconds) |
| **Resolution target** | Immediate |
| **Tools** | Crisp AI chatbot, knowledge base articles, in-app tooltips, status page |
| **Success metric** | 60%+ of inquiries resolved without human involvement |

**What L1 handles:**

- Frequently asked questions (account setup, billing, feature usage)
- Password reset and account recovery instructions
- API key generation and management guidance
- Step-by-step guides for common tasks (generate article, configure publishing, read analytics)
- Status page redirection during known incidents
- Feature availability questions ("Does ChainIQ support X?")
- Pricing and plan comparison queries
- Known issues and documented workarounds

**L1 implementation:**

1. **AI chatbot training:** Feed all knowledge base articles into Crisp's AI chatbot. The chatbot should attempt to answer any question by referencing these articles.
2. **Contextual help:** In-app tooltips and help links on the Dashboard that open relevant knowledge base articles without leaving the app.
3. **Proactive suggestions:** When the chatbot detects a question pattern it cannot answer, it logs the topic for future knowledge base article creation.
4. **Graceful handoff:** When the chatbot cannot resolve an issue, it should say: "I wasn't able to find an answer to your question. Let me connect you with our support team — they typically respond within [SLA time for tier]." It then creates a ticket with the full conversation context.

---

### L2: Email Support (Solo Dev — Standard Support Mode)

**Handler:** Solo developer via Crisp shared inbox

**Purpose:** Handle issues that require human judgment, account-specific investigation, or personalized guidance. The developer operates in "support mode" — focused on quick resolution using existing knowledge and canned responses, not on debugging code.

| Attribute | Detail |
|-----------|--------|
| **Availability** | Business hours (9 AM - 6 PM GST, Sun-Thu) |
| **Response time** | Per SLA (Free: 48h, Pro: 24h, Enterprise: 4h) |
| **Resolution target** | Per SLA (see sla-definitions.md) |
| **Tools** | Crisp inbox, canned responses, Supabase dashboard, application logs |
| **Success metric** | 90%+ of L2 tickets resolved without escalation to L3 |

**What L2 handles:**

- Bug reports that match known issues (apply documented workaround or canned response)
- Account-specific problems (incorrect plan assignment, missing permissions, data discrepancies)
- Configuration assistance beyond what the knowledge base covers
- Billing inquiries and adjustments
- Feature requests (acknowledge, log, and route to backlog)
- Complaint handling and customer retention outreach
- Prompt Guard false positive reports (adjust rules if straightforward)
- Article generation failures (retry, check inputs, verify API key status)

**L2 standard procedures:**

1. **Read the full conversation** from L1 chatbot handoff. Never ask the customer to repeat information.
2. **Check the customer's tier** to apply the correct SLA.
3. **Use canned responses** from `canned-responses.md` where applicable, personalized with the customer's name and specific details.
4. **Investigate account state** in Supabase dashboard (user record, subscription status, recent activity).
5. **Check recent incidents** — is this issue already known? Reference the status page if so.
6. **Attempt resolution** using standard tools (restart a job, reset a flag, adjust a configuration).
7. **If resolution requires code changes or deep investigation**, escalate to L3.

**L2 time-boxing rule:** Spend a maximum of 15 minutes investigating an L2 ticket. If you haven't identified the cause or solution in 15 minutes, escalate to L3. This prevents support work from consuming your entire day.

---

### L3: Engineering Investigation (Solo Dev — Debugging Mode)

**Handler:** Solo developer in dedicated engineering investigation mode

**Purpose:** Deep-dive into issues that require reading code, analyzing logs, reproducing bugs, writing fixes, or investigating systemic problems. This is the same person as L2, but the working mode is fundamentally different — L3 work is scheduled, time-blocked, and focused.

| Attribute | Detail |
|-----------|--------|
| **Availability** | Scheduled blocks (not interrupt-driven) |
| **Response time** | Acknowledgment within L2 SLA, investigation scheduled within 1 business day |
| **Resolution target** | P0: same day, P1: 3 business days, P2: next sprint, P3: backlog |
| **Tools** | IDE, Docker logs, Supabase SQL editor, browser DevTools, monitoring dashboards, git blame |
| **Success metric** | Bugs fixed don't recur (< 10% reopen rate) |

**What L3 handles:**

- Bugs that cannot be resolved with standard procedures
- Issues requiring code changes or configuration updates
- Performance investigations (slow queries, memory leaks, timeout issues)
- Systemic problems (same issue affecting multiple customers)
- Security vulnerability investigation and patching
- Root cause analysis for recurring issues
- Integration failures between services (bridge-to-Supabase, bridge-to-LLM-API, etc.)

**L3 workflow:**

1. **Acknowledge the escalation** to the customer: "I've identified that this requires a deeper investigation. I'm scheduling dedicated time to look into this and will update you by [date]."
2. **Schedule a time block** — Do not investigate L3 issues during support hours. Block 1-2 hours in the morning or afternoon specifically for L3 work.
3. **Reproduce the issue** locally or in a staging environment.
4. **Document the investigation** in the bug report (what you tried, what you found).
5. **Fix and test** — Apply the fix, write a regression test if applicable.
6. **Deploy and verify** — Push the fix through CI/CD, verify in production.
7. **Notify the customer** — Close the loop with a brief explanation of what was wrong and how it was fixed.
8. **Update the knowledge base** if the issue could recur or if customers can self-serve in the future.

---

## 3. Escalation Criteria

### L1 → L2 Escalation (Automatic)

The AI chatbot escalates to L2 when:

| Trigger | Action |
|---------|--------|
| Chatbot confidence score below threshold | Hand off to human with full context |
| Customer explicitly requests human support | Immediate handoff: "Connecting you now..." |
| Issue involves account-specific data | Cannot be resolved without database access |
| Conversation exceeds 5 chatbot exchanges without resolution | Auto-escalate: "Let me bring in a human to help" |
| Sentiment analysis detects frustration | Proactive handoff before customer asks |
| Keywords detected: "cancel", "refund", "angry", "urgent", "broken" | Priority handoff with flag |

### L2 → L3 Escalation (Manual)

The solo developer escalates from L2 to L3 when:

| Trigger | Action |
|---------|--------|
| Issue cannot be resolved in 15 minutes of investigation | Log findings so far, schedule L3 time block |
| Issue requires reading application source code | Schedule L3 time block |
| Issue requires a code change or deployment | Schedule L3 time block |
| Same issue reported by 3+ customers | Systemic issue — prioritize L3 investigation |
| Issue involves data integrity concerns | Immediately schedule L3, elevate priority |
| Unable to reproduce with available information | Ask customer for more details via L2, then schedule L3 |

---

## 4. Context Preservation Requirements

The single biggest frustration for customers is repeating themselves. Context must flow seamlessly between levels.

### Required Context at Each Handoff

| Field | L1 → L2 | L2 → L3 |
|-------|---------|---------|
| Full conversation history | Required (Crisp maintains this automatically) | Required |
| Customer tier and SLA | Auto-populated from Crisp contact data | Carried forward |
| Issue category (bug / question / feature request) | Chatbot classifies | Confirmed by L2 |
| Priority assignment | N/A (L1 doesn't prioritize) | Assigned by L2 |
| Reproduction steps | From customer input | Refined by L2 investigation |
| What has already been tried | Chatbot's suggested solutions | L2 investigation notes |
| Customer sentiment | Chatbot sentiment analysis | L2 personal assessment |
| Time spent at previous level | Automatic timestamps | L2 time log |
| Related tickets (duplicates, prior issues) | Auto-linked if detected | Manually linked by L2 |

### Context Preservation in Crisp

1. **Conversation notes:** Add internal notes to the Crisp conversation at each level transition.
2. **Tags:** Tag conversations with level (L1, L2, L3), priority (P0-P3), and category (bug, question, feature, billing).
3. **Custom attributes:** Set customer tier, last incident date, and ticket count on the contact record.
4. **No channel switching:** Keep the conversation in the same Crisp thread. Do not ask the customer to email if they started in chat, or vice versa.

---

## 5. Capacity Management

### Time Allocation Guidelines

| Level | Daily Time Budget | Notes |
|-------|------------------|-------|
| L1 | 0 minutes (automated) | Monitor chatbot effectiveness weekly |
| L2 | 30-60 minutes | Process queue during a dedicated support block |
| L3 | 1-2 hours (as needed) | Schedule in advance, protect from interruptions |

### When to Adjust

- **L2 queue exceeds 10 open tickets:** Increase daily L2 time or review knowledge base for deflection opportunities.
- **L3 backlog exceeds 5 items:** Pause feature development, dedicate full days to clearing the L3 queue.
- **L1 resolution rate drops below 50%:** Audit chatbot training data, add missing knowledge base articles.
- **Support consistently exceeds 3 hours/day:** Evaluate hiring a part-time support agent or virtual assistant for L2.

---

## 6. Escalation Anti-Patterns

Avoid these common mistakes in escalation handling:

| Anti-Pattern | Problem | Correct Approach |
|-------------|---------|-----------------|
| Immediate escalation to L3 for every bug | L3 time consumed by trivial issues | Enforce 15-minute L2 investigation first |
| Skipping L1 by providing direct email | Bypasses automation, increases volume | Always route through chatbot first |
| Keeping a ticket at L2 for days hoping it resolves | SLA breach, customer frustration | Escalate to L3 after 15 min, or respond with "needs investigation" |
| Asking the customer to repeat info after escalation | Trust erosion | Read the full conversation history before responding |
| Investigating L3 issues during support hours | Context-switching kills productivity | Time-block L3 work separately |
| Closing tickets without confirming resolution | Reopens and customer frustration | Always ask: "Does this resolve your issue?" |
