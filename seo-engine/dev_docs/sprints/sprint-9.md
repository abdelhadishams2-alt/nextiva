# Sprint 9: CMS Adapters + Publish Dashboard

> **Weeks:** 17-18 | **Capacity:** ~40h (20h/week) | **Committed:** 20h
> **Theme:** Headless CMS support and publish management UI

---

## Sprint Goal

Extend publishing to 5 headless CMS platforms plus a generic webhook adapter, and deliver the Publish Manager dashboard page for managing all publishing operations from one place.

---

## Task List

| ID | Task | Effort | Phase | Dependencies | Priority |
| --- | --- | --- | --- | --- | --- |
| PB-004 | Headless CMS Adapters (5 platforms) + Generic Webhook | L (12h) | P9 - Publishing | PB-001 (payload), PB-002/PB-003 (adapter pattern) | P1 |
| PB-005 | Dashboard: Publish Manager Page | L (8h) | P9 - Publishing | PB-002, PB-003 (publish records data) | P1 |

### Execution Strategy

- PB-004 builds 6 adapters extending the base class from Sprint 8 -- each adapter is small (~2h)
- PB-005 can start once PB-004 has at least 2 adapters working (for testing the platform picker)
- 20h buffer provides catch-up room if Sprint 8 PB-002 spilled over
- Recommended order: PB-004 (Days 1-6) -> PB-005 (Days 5-10)

### PB-004 Adapter Breakdown

| Adapter | Auth Method | Estimated |
| --- | --- | --- |
| Contentful | OAuth2 / Personal Access Token | ~2h |
| Strapi | API Token | ~2h |
| Ghost | JWT from Admin API key | ~2h |
| Webflow | OAuth2 / API Token | ~2h |
| Sanity | API Token | ~2h |
| Generic Webhook | HMAC-SHA256 signed | ~2h |

---

## Database Migrations

No new migrations in Sprint 9. Uses tables from migrations 014 and 015 (Sprint 8).

---

## Key Deliverables

After this sprint, the developer can:

1. **Publish to Contentful** -- create entries via Content Management API with content type mapping
2. **Publish to Strapi** -- create entries via REST API with dynamic zone support
3. **Publish to Ghost** -- create posts via Admin API with JWT authentication (no npm deps)
4. **Publish to Webflow** -- create CMS items via API with collection mapping
5. **Publish to Sanity** -- create documents via Mutations API with schema-aware field mapping
6. **Publish via webhook** -- POST Universal Payload to any URL with HMAC-SHA256 signature verification
7. **Manage all publishing from one page** -- connected platform cards, publish queue, multi-step publish dialog
8. **Configure platforms** -- per-platform settings forms for credentials, default options, field mapping

---

## Exit Criteria

All must pass before Sprint 9 is marked complete:

- [ ] Contentful adapter creates entries via CMA with correct content type and field mapping
- [ ] Strapi adapter creates entries via REST API with proper authentication
- [ ] Ghost adapter authenticates via JWT from Admin API key (zero npm dependencies)
- [ ] Webflow adapter creates CMS collection items with field mapping
- [ ] Sanity adapter creates documents via Mutations API
- [ ] Generic webhook POSTs payload with HMAC-SHA256 signature in X-Signature header
- [ ] Webhook consumer can verify signature using shared secret
- [ ] All adapters extend shared base class with: connect(), publish(), getStatus(), retry(), handleError()
- [ ] Adapter registry routes `/api/publish/:platform/push` to correct adapter
- [ ] Publish Manager page shows connected platforms as cards with status indicators
- [ ] Publish queue DataTable shows all publish_records with filters (platform, status, date)
- [ ] Multi-step publish dialog: select article -> pick platform -> configure options -> confirm -> publish
- [ ] Platform configuration forms store credentials securely (encrypted, never exposed in API responses)

---

## Risk Flags

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| CMS API breaking changes across versions | Medium | Medium | Pin to current stable API versions; document minimum supported versions |
| Ghost JWT implementation complexity | Low | Low | Ghost JWT is well-documented; use native crypto for signing |
| Webflow rate limiting (60 req/min) | Low | Medium | Backoff on 429; batch uploads not needed for single-article publishing |
| Sprint 8 spillover consuming buffer | Medium | Medium | 20h buffer is generous; worst case defer 1-2 adapters to Sprint 10 buffer |
| HMAC-SHA256 webhook signature rejected by consumer | Low | Low | Provide sample verification code in 3 languages (Node, Python, PHP) |

---

## Handoff Notes for Sprint 10

Sprint 10 (Feedback Loop) needs the following from Sprint 9:

- **All publishing adapters functional** -- articles must be published to track their performance
- **publish_records table** populated with real published articles (at least 5-10 for testing)
- **Published article URLs** stored in publish_records for GSC/GA4 performance correlation
- **Platform connection status** queryable for the performance tracker to know which platforms to monitor
- Publishing pipeline end-to-end tested: generate article -> quality gate -> publish -> record stored
