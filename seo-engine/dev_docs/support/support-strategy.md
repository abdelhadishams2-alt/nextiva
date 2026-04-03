# ChainIQ Support Strategy

> **Owner:** Solo Developer
> **Last Updated:** 2026-03-28
> **Review Cadence:** Quarterly

---

## 1. Support Philosophy

ChainIQ serves MENA-region publishers through Chain Reaction SEO. The support strategy must balance high-quality, personalized service with the reality of a solo developer operation. The guiding principles are:

1. **Self-serve first** — 80% of support inquiries should be resolved without human involvement through documentation, knowledge base articles, and AI chatbot.
2. **Speed over perfection** — A fast acknowledgment with a realistic timeline beats a slow, perfect answer.
3. **Proactive communication** — Notify customers about issues before they discover them. Status page and proactive emails reduce inbound support volume.
4. **Context preservation** — Every interaction carries full history. Customers should never have to repeat themselves.

---

## 2. Platform Selection: Crisp (Recommended)

After evaluating support platforms for a solo developer context, **Crisp** is the recommended choice for ChainIQ.

### Why Crisp

| Criterion | Crisp | Alternatives Considered |
|-----------|-------|------------------------|
| **Free tier** | Yes — 2 seats, live chat, basic chatbot | Intercom: No free tier; Zendesk: Limited free; Freshdesk: Free but dated UI |
| **AI chatbot** | Built-in AI bot that can be trained on knowledge base | Most competitors charge extra for AI |
| **Live chat widget** | Lightweight, customizable, fast-loading | Comparable to Intercom but free |
| **Knowledge base** | Integrated help center with article management | Included in Pro tier |
| **Email integration** | Shared inbox for support@chainiq.io | Standard across platforms |
| **Pro tier price** | $25/month per workspace | Intercom: $74+/mo; Zendesk: $55+/mo; Freshdesk: $15+/mo |
| **CRM features** | Contact management, user data enrichment | Sufficient for tracking publisher clients |
| **Integrations** | Slack, webhooks, API, Zapier | Can connect to monitoring and alerting |
| **Multi-language** | Supports Arabic and other MENA region languages | Important for publisher clients |

### Crisp Tier Recommendation

| Phase | Tier | Cost | Features Used |
|-------|------|------|---------------|
| **Launch (Month 1-3)** | Free (Basic) | $0/mo | Live chat, 2 operator seats, contact form |
| **Growth (Month 4-6)** | Pro | $25/mo | AI chatbot, knowledge base, canned responses, triggers |
| **Scale (Month 7+)** | Unlimited | $95/mo | Automated campaigns, advanced analytics, dedicated chatbot training |

### Implementation Plan

1. **Week 1:** Create Crisp workspace, install chat widget on Dashboard, configure basic welcome message.
2. **Week 2:** Set up shared inbox for support@chainiq.io, configure email routing.
3. **Week 3:** Build initial knowledge base with top 10 FAQ articles.
4. **Week 4:** Train AI chatbot on knowledge base content, configure auto-responses for off-hours.

---

## 3. Support Channels

### Channel Matrix

| Channel | Availability | Response Method | SLA Applies |
|---------|-------------|-----------------|-------------|
| **Knowledge Base** | 24/7 self-serve | Automated | N/A |
| **AI Chatbot** | 24/7 automated | AI-generated from knowledge base | N/A |
| **In-App Live Chat** (Crisp) | Business hours: 9 AM - 6 PM GST (UTC+4) | Direct response from solo dev | Yes |
| **Email** (support@chainiq.io) | Async, checked 2x daily | Reply via Crisp shared inbox | Yes |
| **Status Page** | 24/7 read-only | Automated + manual updates during incidents | N/A |

### Channel Routing Rules

1. **First contact** always goes through the AI chatbot. If the chatbot cannot resolve, it offers to connect to a human.
2. **During business hours:** Human responses via live chat or email.
3. **Outside business hours:** AI chatbot handles first response, queues unresolved issues for next business day with auto-acknowledgment: "Thanks for reaching out! We've received your message and will respond by [next business day, time]."
4. **Incident-related inquiries:** Auto-detect keywords (e.g., "down", "not working", "error") and direct to the status page before opening a ticket.

---

## 4. SLA Definitions by Tier

ChainIQ offers three customer tiers, each with different support commitments. SLAs are detailed fully in `sla-definitions.md` but summarized here:

| Tier | Monthly Price | First Response | Resolution Target | Channels |
|------|--------------|----------------|-------------------|----------|
| **Free** | $0 | 48 hours | Best effort (5 business days) | Knowledge base, AI chatbot, email |
| **Pro** | $XX/mo | 24 hours | 3 business days | All Free + live chat priority |
| **Enterprise** | Custom | 4 hours | 1 business day | All Pro + direct line, custom SLA |

### SLA Measurement

- **First Response Time** is measured from the moment the ticket enters the human queue (after AI chatbot handoff or direct email) to the first human reply.
- **Resolution Time** is measured from first human response to ticket closure or confirmed resolution.
- SLA hours are counted during **business hours only** (9 AM - 6 PM GST, Sunday through Thursday — aligned with MENA business week).
- SLA reporting is generated monthly and shared with Enterprise clients.

---

## 5. Support Volume Projections

Based on industry benchmarks for SaaS platforms serving publishers:

| Metric | Launch (0-50 users) | Growth (50-200 users) | Scale (200+ users) |
|--------|--------------------|-----------------------|---------------------|
| Tickets/week | 5-10 | 15-30 | 40-80 |
| AI chatbot resolution rate | 40% | 60% (after training) | 70% |
| Human tickets/week | 3-6 | 6-12 | 12-24 |
| Avg. handling time | 15 min | 10 min (with canned responses) | 8 min |
| Weekly support hours | 1-2 hrs | 1.5-3 hrs | 2-4 hrs |

### Solo Developer Capacity

At current projections, support remains manageable for a solo developer through the Growth phase. Key capacity thresholds:

- **> 4 hours/week on support:** Consider hiring a part-time support agent or upgrading to Crisp Unlimited for better automation.
- **> 30 human tickets/week:** Evaluate knowledge base gaps — each new article should deflect 5-10 similar tickets.
- **> 2 SEV1/SEV2 incidents/month:** Focus engineering effort on reliability before scaling support.

---

## 6. Knowledge Base Strategy

The knowledge base is the highest-leverage support investment. Every article written saves dozens of future human responses.

### Launch Content (Top 10 Articles)

1. Getting started with ChainIQ
2. How to generate your first article
3. Understanding Prompt Guard and content safety
4. Connecting your publishing destinations
5. Reading your analytics dashboard
6. Managing your API keys
7. Billing and subscription FAQ
8. Troubleshooting article generation timeouts
9. Data export and portability
10. Account security best practices

### Content Maintenance

- **Monthly:** Review top 10 search queries with no results — these are content gaps.
- **After each feature release:** Update or create relevant knowledge base articles before the feature goes live.
- **After each incident:** If the incident generated customer questions, write a knowledge base article explaining the issue and resolution.

---

## 7. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| First response SLA compliance | > 95% | Crisp analytics |
| Customer satisfaction (CSAT) | > 4.0 / 5.0 | Post-conversation survey |
| AI chatbot resolution rate | > 60% | Crisp bot analytics |
| Knowledge base helpfulness | > 70% "helpful" votes | Article feedback |
| Support-driven churn | < 2% | Correlate churn with support interactions |
| Time to first resolution | < 24 hours (Pro) | Crisp ticket metrics |
