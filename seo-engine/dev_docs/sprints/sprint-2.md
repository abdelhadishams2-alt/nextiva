# Sprint 2: Data Connectors

> **Weeks:** 3-4 | **Capacity:** ~40h (20h/week) | **Committed:** 36h
> **Theme:** Three parallel data connectors populating the intelligence pipeline

---

## Sprint Goal

Build GSC, GA4, and Content Crawler connectors so that the platform can ingest search performance data, engagement metrics, and a full content inventory from any connected site.

---

## Task List

| ID | Task | Effort | Phase | Dependencies | Priority |
| --- | --- | --- | --- | --- | --- |
| DI-002 | GSC Connector (25K pagination, 16mo history, health score) | L (12h) | P5 - Data Ingestion | DI-001 (OAuth tokens) | P0 |
| DI-003 | GA4 Connector (engagement metrics, GSC merge) | L (12h) | P5 - Data Ingestion | DI-001 (OAuth tokens) | P0 |
| DI-004 | Content Crawler (sitemap, link-follow, body_text extraction) | L (12h) | P5 - Data Ingestion | DI-001 (client_connections table) | P0 |

### Execution Order

DI-002 and DI-004 can run in parallel. DI-003 depends on DI-002 schema for the GSC merge logic but can start concurrently with stub data.

---

## Database Migrations

| Migration | Tables | Source |
| --- | --- | --- |
| 008 | content_inventory, crawl_sessions | unified-schema.md 3.3-3.4 |

---

## Key Deliverables

After this sprint, the developer can:

1. **Pull GSC data** -- clicks, impressions, CTR, position for any connected property with 25K-row pagination
2. **Import 16 months of GSC history** -- backfill historical performance data for decay analysis
3. **Pull GA4 engagement data** -- sessions, bounce rate, scroll depth, avg. engagement time
4. **Merge GSC + GA4** -- unified performance snapshots per URL
5. **Crawl a website** -- discover URLs via sitemap or link-following (max depth 3, max 10K pages)
6. **Extract content metadata** -- title, meta description, H1-H6 structure, word count, body_text, internal/external links

---

## Exit Criteria

All must pass before Sprint 2 is marked complete:

- [ ] GSC connector pulls top 100 URLs with metrics for a connected test account
- [ ] 25K-row pagination works correctly (test with account that has >25K rows)
- [ ] 16-month historical GSC import completes for test account without timeout
- [ ] GA4 connector pulls engagement data for matching URLs
- [ ] GSC + GA4 merge produces unified snapshots (matched on URL)
- [ ] Crawler maps at least one real website (50+ pages) into content_inventory
- [ ] Crawler respects robots.txt directives
- [ ] Crawler extracts: title, meta description, H1-H6, word count, body_text, links
- [ ] Token refresh works: manually expire token, verify auto-refresh on next API call
- [ ] All connectors handle errors correctly: 401 (re-auth), 429 (backoff), 403 (permission denied)
- [ ] Migration 008 creates content_inventory and crawl_sessions with RLS policies

---

## Risk Flags

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| GSC returns no data for test domain | Low | Medium | Ensure test domain has verified GSC property with traffic |
| Crawler blocked by WAF/CDN on target sites | Medium | Low | Respect robots.txt, use standard User-Agent, retry with backoff |
| GA4 quota exceeded during historical import | Low | Medium | Pull in monthly chunks, track quota usage |
| 36h committed against 40h capacity | Medium | Low | DI-003 and DI-004 share patterns; velocity should be high after DI-002 |

---

## Handoff Notes for Sprint 3

Sprint 3 (Scheduler + Dashboard + Quality Engine) needs the following from Sprint 2:

- **GSC connector** with `pullGSCData(clientId, dateRange)` callable
- **GA4 connector** with `pullGA4Data(clientId, dateRange)` callable
- **Crawler** with `crawlSite(clientId, sitemapUrl)` callable
- **content_inventory table** populated with at least one test site
- **performance_snapshots** rows from GSC/GA4 merge (even if just test data)
- Documented error codes and retry behavior for each connector
