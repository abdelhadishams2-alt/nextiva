# ChainIQ — Performance Targets & SLOs

> **Step 16.3 Artifact** — Performance Budget
> **Last Updated:** 2026-03-28
> **App Type:** SaaS Dashboard + API Server

---

## Performance Targets

### Bridge Server API (48 endpoints)

| Metric | Target | Warning | Critical | Measurement |
|--------|--------|---------|----------|-------------|
| Response time (p50) | < 50ms | 50-100ms | > 100ms | Per-request timer in logger |
| Response time (p95) | < 200ms | 200-500ms | > 500ms | Percentile over 5-min window |
| Response time (p99) | < 500ms | 500ms-1s | > 1s | Percentile over 5-min window |
| Error rate (5xx/total) | < 0.1% | 0.1-1% | > 1% | Rolling 5-min window |
| Throughput | > 100 req/s | 50-100 req/s | < 50 req/s | Sustained load |
| Memory RSS | < 200MB | 200-350MB | > 350MB | Process metrics |
| Event loop lag | < 10ms | 10-50ms | > 50ms | perf_hooks |

### Dashboard (Next.js)

| Metric | Target | Warning | Critical | Tool |
|--------|--------|---------|----------|------|
| LCP (Largest Contentful Paint) | < 1.5s | 1.5-2.5s | > 2.5s | Lighthouse |
| FCP (First Contentful Paint) | < 1.0s | 1.0-1.8s | > 1.8s | Lighthouse |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.1-0.25 | > 0.25 | Lighthouse |
| INP (Interaction to Next Paint) | < 200ms | 200-500ms | > 500ms | Lighthouse |
| TTI (Time to Interactive) | < 2.0s | 2.0-3.5s | > 3.5s | Lighthouse |
| Bundle size (JS) | < 200KB gzip | 200-400KB | > 400KB | next build |
| Bundle size (CSS) | < 50KB gzip | 50-100KB | > 100KB | next build |

### Article Generation Pipeline

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Total generation time | < 5 min | 5-8 min | > 8 min |
| Research phase | < 2 min | 2-3 min | > 3 min |
| Draft writing phase | < 2 min | 2-3 min | > 3 min |
| Image generation | < 1 min | 1-2 min | > 2 min |
| Edit operation | < 60s | 60-120s | > 120s |

### Database (Supabase PostgreSQL)

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Query time (p95) | < 50ms | 50-100ms | > 100ms |
| Connection count | < 50 | 50-80 | > 80 (of 100 max) |
| Storage usage | < 4GB | 4-6GB | > 6GB (of 8GB) |
| Row count (performance_snapshots) | < 1M | 1M-5M | > 5M |

---

## Service Level Objectives (SLOs)

### Availability

| Service | SLO | Monthly Budget | Allowed Downtime |
|---------|-----|---------------|-----------------|
| Bridge Server | 99.5% | 0.5% | 3.6 hours/month |
| Dashboard | 99.5% | 0.5% | 3.6 hours/month |
| Supabase | 99.9% (managed) | 0.1% | 43 min/month |

### Latency

| Endpoint Group | p95 SLO | Error Budget |
|---------------|---------|-------------|
| Auth endpoints | 200ms | 5% of requests can exceed |
| CRUD endpoints | 300ms | 5% can exceed |
| Generate endpoint | 8 min | 10% can exceed |
| Edit endpoint | 120s | 10% can exceed |
| Health check | 50ms | 1% can exceed |

### Data Freshness (Phase 5+)

| Data Source | Freshness SLO | Check Interval |
|------------|--------------|---------------|
| GSC data | < 24 hours old | Daily ingestion |
| GA4 data | < 24 hours old | Daily ingestion |
| Content inventory | < 7 days old | Weekly crawl |
| Keyword opportunities | < 7 days old | Weekly recalculation |

---

## Performance Budget Enforcement

### CI Pipeline Checks

```yaml
performance-budget:
  runs-on: ubuntu-latest
  steps:
    - name: Check bundle size
      run: |
        npx next build
        JS_SIZE=$(du -sb .next/static/chunks/ | cut -f1)
        if [ $JS_SIZE -gt 400000 ]; then
          echo "ERROR: JS bundle exceeds 400KB budget"
          exit 1
        fi

    - name: Run Lighthouse CI
      uses: treosh/lighthouse-ci-action@v10
      with:
        budgetPath: .lighthouserc.json
```

### Lighthouse Budget Configuration

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.8}],
        "first-contentful-paint": ["warn", {"maxNumericValue": 1800}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.25}],
        "total-blocking-time": ["warn", {"maxNumericValue": 300}]
      }
    }
  }
}
```
