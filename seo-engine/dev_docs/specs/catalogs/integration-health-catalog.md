# ChainIQ Integration Health Catalog

> Health check definitions, fallback behavior, and retry strategies for every external integration.
> Total: 13 integrations across 3 categories.

## Health Status Definitions

| Status | Code | Description |
|--------|------|-------------|
| Healthy | `GREEN` | Responding within expected time, no errors |
| Degraded | `YELLOW` | Responding but slower than baseline or partial errors |
| Unhealthy | `RED` | Not responding or consistent errors |
| Unknown | `GRAY` | Not yet checked or check inconclusive |

## Alert Severity Levels

| Level | Response |
|-------|----------|
| `P1` | Immediate: page on-call, block dependent operations |
| `P2` | Urgent: notify team, activate fallback, queue retries |
| `P3` | Warning: log event, continue with degraded mode |
| `P4` | Info: log for monitoring, no action required |

---

## 1. Data Source Integrations

### 1.1 Google OAuth (GSC + GA4)

| Attribute | Value |
|-----------|-------|
| **Integration ID** | `google-oauth` |
| **Endpoints** | GSC: `https://www.googleapis.com/webmasters/v3/` | GA4: `https://analyticsdata.googleapis.com/v1beta/` |
| **Auth Method** | OAuth 2.0 with refresh tokens |
| **Health Check** | `GET /webmasters/v3/sites` with valid token — expect 200 within timeout |
| **Check Frequency** | Every 5 minutes |
| **Expected Response Time** | < 2,000 ms |
| **Degraded Threshold** | > 4,000 ms or > 10% error rate in 5-min window |
| **Unhealthy Threshold** | > 10,000 ms or > 50% error rate or 3 consecutive failures |
| **Alert Severity** | RED = P1 (blocks all data ingestion for Google properties) |
| **Fallback Behavior** | Serve cached data (up to 24h stale); queue sync jobs for retry; show "Data may be outdated" badge |
| **Retry Strategy** | Exponential backoff: 5s, 10s, 20s, 40s, 80s — max 5 retries per request |
| **Token Refresh** | Auto-refresh 5 minutes before expiry; on 401, immediate refresh + retry once |
| **Rate Limits** | GSC: 1,200 req/min per project; GA4: 10 concurrent requests per property |
| **Circuit Breaker** | Opens after 5 failures in 60s; half-open test every 30s; closes after 3 successes |

### 1.2 Semrush API

| Attribute | Value |
|-----------|-------|
| **Integration ID** | `semrush-api` |
| **Endpoint** | `https://api.semrush.com/` |
| **Auth Method** | API key (query parameter) |
| **Health Check** | `GET /analytics/v1/?type=domain_ranks&key={key}&domain=semrush.com&database=us` — expect 200 with CSV body |
| **Check Frequency** | Every 10 minutes |
| **Expected Response Time** | < 5,000 ms |
| **Degraded Threshold** | > 10,000 ms or > 15% error rate |
| **Unhealthy Threshold** | > 20,000 ms or > 50% error rate or 3 consecutive failures |
| **Alert Severity** | RED = P2 (degrades keyword analysis but doesn't block publishing) |
| **Fallback Behavior** | Use last cached keyword data; mark keyword metrics as "stale" in UI; continue with GSC-only data |
| **Retry Strategy** | Exponential backoff: 10s, 20s, 40s — max 3 retries |
| **Rate Limits** | Varies by plan; default 10 req/s; track remaining via response headers |
| **Circuit Breaker** | Opens after 3 failures in 120s; half-open test every 60s |
| **Quota Tracking** | Track API unit consumption; alert at 80% of monthly quota |

### 1.3 Ahrefs API

| Attribute | Value |
|-----------|-------|
| **Integration ID** | `ahrefs-api` |
| **Endpoint** | `https://api.ahrefs.com/v3/` |
| **Auth Method** | Bearer token (Authorization header) |
| **Health Check** | `GET /v3/subscription-info` — expect 200 with valid JSON |
| **Check Frequency** | Every 10 minutes |
| **Expected Response Time** | < 5,000 ms |
| **Degraded Threshold** | > 10,000 ms or > 15% error rate |
| **Unhealthy Threshold** | > 20,000 ms or > 50% error rate or 3 consecutive failures |
| **Alert Severity** | RED = P2 (same priority as Semrush — alternative data source) |
| **Fallback Behavior** | Use last cached backlink/keyword data; fall back to Semrush if available; mark metrics as "stale" |
| **Retry Strategy** | Exponential backoff: 10s, 20s, 40s — max 3 retries |
| **Rate Limits** | 500 rows per request; track monthly row consumption |
| **Circuit Breaker** | Opens after 3 failures in 120s; half-open test every 60s |
| **Quota Tracking** | Track monthly row usage; alert at 80% of plan limit |

### 1.4 Google Trends

| Attribute | Value |
|-----------|-------|
| **Integration ID** | `google-trends` |
| **Endpoint** | Internal scraping adapter / SerpApi Trends endpoint |
| **Auth Method** | API key (SerpApi) or no auth (direct) |
| **Health Check** | Request trend data for "google" — expect 200 with timeline data |
| **Check Frequency** | Every 15 minutes |
| **Expected Response Time** | < 8,000 ms |
| **Degraded Threshold** | > 15,000 ms or > 20% error rate |
| **Unhealthy Threshold** | > 30,000 ms or > 60% error rate |
| **Alert Severity** | RED = P3 (supplementary data; does not block core flows) |
| **Fallback Behavior** | Omit trend data from briefs; show "Trend data unavailable" in UI; use historical cache (up to 7 days) |
| **Retry Strategy** | Linear backoff: 15s, 30s, 45s — max 3 retries |
| **Rate Limits** | SerpApi: per-plan limits; direct: aggressive throttling to avoid blocking |
| **Circuit Breaker** | Opens after 5 failures in 300s; half-open test every 120s |

---

## 2. CMS / Publishing Integrations

### 2.1 WordPress REST API

| Attribute | Value |
|-----------|-------|
| **Integration ID** | `wordpress-rest` |
| **Endpoint** | `{site_url}/wp-json/wp/v2/` |
| **Auth Method** | Application Password (Basic Auth) or JWT plugin |
| **Health Check** | `GET /wp-json/wp/v2/posts?per_page=1` — expect 200 |
| **Check Frequency** | Every 5 minutes per connected site |
| **Expected Response Time** | < 3,000 ms |
| **Degraded Threshold** | > 6,000 ms or > 10% error rate |
| **Unhealthy Threshold** | > 15,000 ms or 3 consecutive failures |
| **Alert Severity** | RED = P1 (blocks publishing pipeline) |
| **Fallback Behavior** | Queue articles for retry; save as local draft; notify user of publish delay |
| **Retry Strategy** | Exponential backoff: 5s, 10s, 20s, 40s — max 4 retries |
| **Special Considerations** | Wide variance in response times across hosting providers; per-site baseline tracking |

### 2.2 Shopify Admin API

| Attribute | Value |
|-----------|-------|
| **Integration ID** | `shopify-admin` |
| **Endpoint** | `https://{shop}.myshopify.com/admin/api/2024-01/` |
| **Auth Method** | OAuth 2.0 (access token in header) |
| **Health Check** | `GET /admin/api/2024-01/shop.json` — expect 200 |
| **Check Frequency** | Every 5 minutes per connected store |
| **Expected Response Time** | < 2,000 ms |
| **Degraded Threshold** | > 4,000 ms or > 10% error rate |
| **Unhealthy Threshold** | > 10,000 ms or 3 consecutive failures |
| **Alert Severity** | RED = P1 (blocks Shopify publishing) |
| **Fallback Behavior** | Queue for retry; save draft locally; notify user |
| **Retry Strategy** | Respect `Retry-After` header; exponential backoff: 2s, 4s, 8s — max 3 retries |
| **Rate Limits** | Leaky bucket: 2 req/s standard; track `X-Shopify-Shop-Api-Call-Limit` header |

### 2.3 Ghost API

| Attribute | Value |
|-----------|-------|
| **Integration ID** | `ghost-api` |
| **Endpoint** | `{site_url}/ghost/api/admin/` |
| **Auth Method** | Admin API key (JWT signed with key) |
| **Health Check** | `GET /ghost/api/admin/site/` — expect 200 |
| **Check Frequency** | Every 5 minutes per connected site |
| **Expected Response Time** | < 2,000 ms |
| **Degraded Threshold** | > 4,000 ms or > 10% error rate |
| **Unhealthy Threshold** | > 10,000 ms or 3 consecutive failures |
| **Alert Severity** | RED = P1 |
| **Fallback Behavior** | Queue for retry; save draft locally; notify user |
| **Retry Strategy** | Exponential backoff: 3s, 6s, 12s — max 3 retries |
| **Special Considerations** | JWT token must be regenerated for each request (short-lived) |

### 2.4 Contentful Management API

| Attribute | Value |
|-----------|-------|
| **Integration ID** | `contentful-mgmt` |
| **Endpoint** | `https://api.contentful.com/spaces/{space_id}/` |
| **Auth Method** | Personal access token or OAuth (Bearer header) |
| **Health Check** | `GET /spaces/{space_id}` — expect 200 |
| **Check Frequency** | Every 5 minutes per connected space |
| **Expected Response Time** | < 2,000 ms |
| **Degraded Threshold** | > 5,000 ms or > 10% error rate |
| **Unhealthy Threshold** | > 12,000 ms or 3 consecutive failures |
| **Alert Severity** | RED = P1 |
| **Fallback Behavior** | Queue for retry; save draft locally; notify user |
| **Retry Strategy** | Exponential backoff: 3s, 6s, 12s, 24s — max 4 retries |
| **Rate Limits** | 10 req/s for CMA; track `X-Contentful-RateLimit-*` headers |

### 2.5 Strapi REST API

| Attribute | Value |
|-----------|-------|
| **Integration ID** | `strapi-rest` |
| **Endpoint** | `{site_url}/api/` |
| **Auth Method** | JWT Bearer token or API token |
| **Health Check** | `GET /api/content-types` — expect 200 (admin) or `GET /api/{collection}?pagination[limit]=1` |
| **Check Frequency** | Every 5 minutes per connected instance |
| **Expected Response Time** | < 2,000 ms |
| **Degraded Threshold** | > 5,000 ms or > 10% error rate |
| **Unhealthy Threshold** | > 12,000 ms or 3 consecutive failures |
| **Alert Severity** | RED = P1 |
| **Fallback Behavior** | Queue for retry; save draft locally; notify user |
| **Retry Strategy** | Exponential backoff: 3s, 6s, 12s — max 3 retries |
| **Special Considerations** | Self-hosted; response times vary widely; per-instance baseline tracking |

### 2.6 Webflow CMS API

| Attribute | Value |
|-----------|-------|
| **Integration ID** | `webflow-cms` |
| **Endpoint** | `https://api.webflow.com/v2/` |
| **Auth Method** | OAuth 2.0 Bearer token |
| **Health Check** | `GET /v2/sites` — expect 200 |
| **Check Frequency** | Every 5 minutes per connected site |
| **Expected Response Time** | < 3,000 ms |
| **Degraded Threshold** | > 6,000 ms or > 10% error rate |
| **Unhealthy Threshold** | > 15,000 ms or 3 consecutive failures |
| **Alert Severity** | RED = P1 |
| **Fallback Behavior** | Queue for retry; save draft locally; notify user |
| **Retry Strategy** | Exponential backoff: 5s, 10s, 20s — max 3 retries |
| **Rate Limits** | 60 req/min; track via `X-RateLimit-*` headers |
| **Special Considerations** | Requires separate `publish` call after creating CMS item to make it live |

### 2.7 Sanity.io API

| Attribute | Value |
|-----------|-------|
| **Integration ID** | `sanity-api` |
| **Endpoint** | `https://{project_id}.api.sanity.io/v2024-01-01/` |
| **Auth Method** | Bearer token (API token with write access) |
| **Health Check** | `GET /v2024-01-01/data/query/{dataset}?query=*[_type == "post"][0]` — expect 200 |
| **Check Frequency** | Every 5 minutes per connected project |
| **Expected Response Time** | < 2,000 ms |
| **Degraded Threshold** | > 5,000 ms or > 10% error rate |
| **Unhealthy Threshold** | > 12,000 ms or 3 consecutive failures |
| **Alert Severity** | RED = P1 |
| **Fallback Behavior** | Queue for retry; save draft locally; notify user |
| **Retry Strategy** | Exponential backoff: 3s, 6s, 12s — max 3 retries |
| **Rate Limits** | 25 req/s for mutations; 100 req/s for queries |
| **Special Considerations** | Uses GROQ query language; mutations use transaction-based API |

---

## 3. Outbound Integrations

### 3.1 Webhook Endpoints (Customer-Configured)

| Attribute | Value |
|-----------|-------|
| **Integration ID** | `webhook-custom` |
| **Endpoint** | Customer-provided URL (validated on save) |
| **Auth Method** | HMAC-SHA256 signature in `X-ChainIQ-Signature` header; optional Basic Auth or Bearer token |
| **Health Check** | `POST {url}` with `{ "event": "health_check", "timestamp": "..." }` — expect 2xx within timeout |
| **Check Frequency** | Every 15 minutes per configured endpoint |
| **Expected Response Time** | < 5,000 ms |
| **Degraded Threshold** | > 10,000 ms or > 20% failure rate |
| **Unhealthy Threshold** | > 15,000 ms or > 50% failure rate or 5 consecutive failures |
| **Alert Severity** | RED = P3 (does not block core platform; user-side issue) |
| **Fallback Behavior** | Queue failed deliveries for retry; store in dead-letter queue after max retries; show delivery status in UI |
| **Retry Strategy** | Exponential backoff: 30s, 60s, 120s, 300s, 600s — max 5 retries over ~18 minutes |
| **Dead Letter** | After 5 failed retries, move to DLQ; retain for 7 days; user can manually re-trigger |
| **Validation** | On webhook creation: test POST with challenge; reject if not 2xx within 10s |
| **Payload** | JSON envelope with event type, timestamp, payload, and HMAC signature for verification |

---

## Health Dashboard Widget

```
┌─────────────────────────────────────────────────┐
│  Integration Health                    [Refresh] │
├──────────────┬────────┬──────────┬──────────────┤
│ Integration  │ Status │ Latency  │ Last Check   │
├──────────────┼────────┼──────────┼──────────────┤
│ Google GSC   │ 🟢     │ 1,204ms  │ 2 min ago    │
│ Google GA4   │ 🟢     │ 987ms    │ 2 min ago    │
│ Semrush      │ 🟡     │ 8,432ms  │ 5 min ago    │
│ Ahrefs       │ 🟢     │ 2,100ms  │ 5 min ago    │
│ Google Trends│ 🔴     │ timeout  │ 1 min ago    │
│ WordPress    │ 🟢     │ 1,540ms  │ 3 min ago    │
│ Shopify      │ 🟢     │ 890ms    │ 3 min ago    │
│ Webhooks (3) │ 🟢     │ 320ms    │ 10 min ago   │
└──────────────┴────────┴──────────┴──────────────┘
```

## Aggregate Health Rules

| Condition | Platform Status | Action |
|-----------|----------------|--------|
| All GREEN | Operational | None |
| Any YELLOW, no RED | Degraded Performance | Log + P3 alert |
| 1 RED (non-critical path) | Partial Outage | P2 alert + activate fallback |
| 1+ RED (critical path: Google, CMS) | Major Outage | P1 alert + block affected pipelines + user notification |
| All RED | Full Outage | P1 + maintenance mode + email all users |

## Health Check Implementation

```typescript
interface HealthCheckResult {
  integration_id: string;
  status: 'GREEN' | 'YELLOW' | 'RED' | 'GRAY';
  response_time_ms: number | null;
  last_check: string;            // ISO 8601
  last_success: string | null;
  consecutive_failures: number;
  error_rate_5m: number;         // percentage
  circuit_state: 'closed' | 'open' | 'half-open';
  details?: string;              // error message if unhealthy
}

// Health checks stored in:
// Table: integration_health (no RLS — service_role only)
// Cache: SHA-256 key `health:{integration_id}`, TTL 60s
```
