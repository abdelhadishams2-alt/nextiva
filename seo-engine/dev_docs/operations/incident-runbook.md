# ChainIQ Incident Response Runbook

> **Owner:** Solo Developer (all roles)
> **Last Updated:** 2026-03-28
> **Review Cadence:** Quarterly or after every SEV1/SEV2 incident

---

## 1. Severity Definitions

All incidents are classified into four severity levels. Each maps to specific ChainIQ scenarios, expected response times, and communication obligations.

### SEV1 — Critical / Platform Down

| Attribute | Detail |
|-----------|--------|
| **Definition** | Complete service outage affecting all customers, data breach, or security compromise |
| **ChainIQ Scenarios** | Supabase outage (all auth + data blocked), service_role key compromise, bridge server unrecoverable crash, data breach with PII exposure, Coolify host unreachable |
| **Response Time** | Acknowledge within 15 minutes, begin mitigation immediately |
| **Communication** | Status page update within 30 minutes, customer notification within 1 hour |
| **Resolution Target** | 4 hours |

### SEV2 — Major / Degraded Service

| Attribute | Detail |
|-----------|--------|
| **Definition** | Significant feature unavailable or severely degraded for a majority of users |
| **ChainIQ Scenarios** | Article generation pipeline failures (>50% fail rate), Dashboard API returning 500s, OpenAI/Anthropic API key exhausted or rate-limited, Content Intelligence scoring offline, Publishing endpoint failures |
| **Response Time** | Acknowledge within 30 minutes |
| **Communication** | Status page update within 1 hour |
| **Resolution Target** | 8 hours |

### SEV3 — Minor / Partial Degradation

| Attribute | Detail |
|-----------|--------|
| **Definition** | Non-critical feature impaired, workaround available, limited user impact |
| **ChainIQ Scenarios** | Analytics dashboard slow or stale data, Voice Intelligence processing delays, single-tenant article generation failure, Feedback Loop not recording, CDN cache invalidation delays |
| **Response Time** | Acknowledge within 4 hours |
| **Communication** | Status page update if customer-visible |
| **Resolution Target** | 24 hours |

### SEV4 — Low / Cosmetic or Monitoring

| Attribute | Detail |
|-----------|--------|
| **Definition** | Cosmetic issue, non-urgent improvement, or monitoring alert that does not affect functionality |
| **ChainIQ Scenarios** | Dashboard UI rendering glitch, log noise from non-critical endpoint, minor Prompt Guard false positive rate increase, documentation out of date |
| **Response Time** | Next business day |
| **Communication** | No external communication required |
| **Resolution Target** | 1 week (or next sprint) |

---

## 2. Solo Developer Role Mapping

Since ChainIQ is operated by a single developer, all traditional incident roles collapse into one person. The following mental "hats" help structure the response and ensure no step is skipped:

| Traditional Role | Solo Dev Equivalent | Responsibility |
|-----------------|---------------------|----------------|
| Incident Commander | You | Own the timeline, make severity calls, decide when to escalate to vendor support |
| Communications Lead | You | Update status page, notify stakeholders, draft postmortem |
| Operations Lead | You | Execute mitigation, restart services, rotate keys |
| Subject Matter Expert | You | Debug root cause, review logs, write fixes |

**Key rule:** When wearing the Communications hat, stop debugging. Write the status update, then go back to debugging. Customers waiting in silence is worse than a slow fix.

---

## 3. Incident Response Flow

### Phase 1: Detect (0-5 minutes)

1. **Alert source identification** — Where did the alert come from?
   - Coolify health check notification (bridge server)
   - Uptime monitor (e.g., Better Uptime, UptimeRobot)
   - Supabase dashboard alert or email
   - Customer report via Crisp chat or email
   - Manual discovery during development
   - Gitleaks CI alert (security)
2. **Verify the alert is real** — Check from a second source (browser, curl, Supabase dashboard) before declaring an incident.
3. **Open an incident log** — Create a timestamped entry in `dev_docs/operations/incidents/YYYY-MM-DD-brief-title.md` immediately.

### Phase 2: Triage (5-15 minutes)

1. **Assign severity** using the definitions above.
2. **Assess blast radius** — Which of the 12 services are affected? Which customer tiers?
3. **Check for cascading failures** — Bridge down may block Dashboard, which blocks article generation.
4. **Document initial assessment** in the incident log.

### Phase 3: Communicate (15-30 minutes)

1. **Update status page** using the appropriate template from `communication-templates.md`.
2. **For SEV1/SEV2:** Send stakeholder notification email to affected MENA publisher clients.
3. **Set a communication cadence:** SEV1 = every 30 min, SEV2 = every 1 hour, SEV3 = upon resolution.

### Phase 4: Mitigate (ongoing)

1. **Apply the relevant DR playbook** from `dr-playbooks/`.
2. **Focus on restoring service first, not finding root cause.** A restart or rollback is acceptable.
3. **If mitigation takes longer than the resolution target**, re-evaluate severity and communicate the revised timeline.
4. **Document every action taken** with timestamps in the incident log.

### Phase 5: Resolve

1. **Confirm service is restored** — Run health checks, verify from customer perspective.
2. **Update status page to "Resolved"** with summary.
3. **Monitor for regression** for at least 1 hour after resolution.
4. **Close the incident log entry** with final timestamps.

### Phase 6: Postmortem (within 48 hours)

1. **Write a blameless postmortem** using the template in `communication-templates.md`.
2. **Identify:** Timeline, root cause, contributing factors, what went well, what didn't.
3. **Generate action items** with owners (you) and due dates.
4. **Add follow-up tasks to `STATUS.md` backlog.**
5. **Update this runbook** if any process gap was discovered.

---

## 4. Escalation Triggers

Even as a solo developer, certain conditions require external escalation:

| Trigger | Action |
|---------|--------|
| Supabase outage lasting > 30 minutes | Open Supabase support ticket (Pro plan), check status.supabase.com |
| Coolify host unreachable > 15 minutes | Contact Hetzner support, check Hetzner status page |
| Cloudflare CDN issues | Check cloudflarestatus.com, open Cloudflare support ticket |
| Suspected data breach | Engage legal counsel, prepare regulatory notification if PII involved |
| OpenAI/Anthropic API outage | Check vendor status pages, switch to fallback model if configured |
| Unable to resolve SEV1 within 4 hours | Consider engaging freelance DevOps contractor from pre-vetted list |

---

## 5. Incident Log Template

```markdown
# Incident: [Brief Title]
**Date:** YYYY-MM-DD
**Severity:** SEV[1-4]
**Status:** Investigating | Identified | Monitoring | Resolved
**Duration:** [start time] - [end time]

## Timeline
- HH:MM — [Event/Action]

## Root Cause
[To be filled post-resolution]

## Action Items
- [ ] [Action] — Due: [Date]
```

---

## 6. Tools and Access Checklist

Ensure the following are accessible before an incident occurs:

- [ ] Coolify dashboard credentials bookmarked
- [ ] Supabase dashboard access verified
- [ ] Hetzner Cloud Console access verified
- [ ] Cloudflare dashboard access verified
- [ ] Status page admin access (e.g., Instatus, Cachet)
- [ ] SSH key for Hetzner CPX21 server tested
- [ ] Docker CLI access to Coolify host verified
- [ ] Backup of all API keys stored in password manager
- [ ] Uptime monitor configured for bridge server `/health` endpoint
- [ ] Gitleaks running in CI pipeline
