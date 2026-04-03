# ChainIQ Infrastructure Cost Model

> **Created:** 2026-03-28
> **Pricing basis:** March 2026 published rates
> **Currency:** USD unless noted
> **Review cadence:** Monthly (costs shift with usage patterns)

---

## Current Baseline (Pre-Launch)

| Service | Plan | Monthly Cost | Notes |
|---------|------|-------------|-------|
| Hetzner CPX21 | 3 vCPU, 4GB RAM, 80GB NVMe | $9.00 | Falkenstein DC, Coolify-managed |
| Supabase | Pro | $25.00 | 8GB DB, 250GB bandwidth, 1M auth events |
| Cloudflare | Free | $0.00 | DNS, CDN, basic WAF |
| Domain | chainiq.io | $1.50 | ~$18/year amortized |
| **Total** | | **$35.50** | |

No external API costs yet -- GSC, GA4, Semrush, Ahrefs connectors are not built. Claude API costs are zero because article generation currently runs via Claude CLI (included in Claude Max subscription).

---

## Tier 1: 10 Tenants (Months 1-4)

Expected profile: 8 Starter ($3K), 2 Professional ($6K) = $36K MRR.

### Compute (Hetzner)

| Resource | Spec | Cost |
|----------|------|------|
| Primary server | CPX21 (3 vCPU, 4GB RAM) | $9.00 |
| Standby failover | CPX21 (cold standby, powered off 95% of time) | ~$2.00 |
| **Subtotal** | | **$11.00** |

At 10 tenants generating an average of 20 articles/month each, the bridge server handles ~200 article generation jobs/month. Each job runs 3-5 minutes of CPU-intensive Claude API calls. Peak concurrent load: 2-3 simultaneous generations. CPX21's 3 vCPU handles this comfortably -- Node.js article generation is I/O-bound (waiting on Claude API responses), not CPU-bound.

### Database (Supabase)

| Resource | Spec | Cost |
|----------|------|------|
| Supabase Pro | 8GB database, PITR | $25.00 |
| Compute add-on | Not needed at 10 tenants | $0.00 |
| Storage overage | ~2GB estimated (well within 8GB) | $0.00 |
| **Subtotal** | | **$25.00** |

Database size estimate: 10 tenants x (subscriptions, usage_logs, pipeline_jobs, articles, api_keys, performance_snapshots) = ~500MB after 6 months. Well within 8GB. Query volume: ~5,000 queries/day (auth checks, CRUD, analytics). Supabase Pro handles 1M+ queries/day.

### External APIs

| API | Usage | Unit Cost | Monthly Cost |
|-----|-------|-----------|-------------|
| Claude API (Sonnet 4) | 200 articles x ~4,000 input tokens + ~8,000 output tokens | ~$0.80/article | $160.00 |
| Gemini API (image gen) | 200 articles x 5 images | ~$0.04/image | $40.00 |
| Gemini API (research) | 200 articles x research queries | ~$0.05/article | $10.00 |
| Google Search Console API | 10 tenants, daily pulls | Free (quota-based) | $0.00 |
| Google Analytics 4 API | 10 tenants, daily pulls | Free (quota-based) | $0.00 |
| Semrush API | Business plan (API access) | $120.00 | $120.00 |
| Ahrefs API | Standard plan | $100.00 | $100.00 |
| **Subtotal** | | | **$430.00** |

Claude API cost breakdown per article: The 7-agent pipeline makes 4-6 API calls per article. Topic Recommender (~500 input/1,000 output tokens), Project Analyzer (~1,000/1,500), Research Engine (~800/2,000), Article Architect (~1,000/1,500), Draft Writer (~1,500/3,000), Quality Gate (~800/1,000). Using Claude Sonnet 4 at $3/M input, $15/M output = approximately $0.60-$1.00 per article. Budget at $0.80 average.

### CDN & Security

| Service | Plan | Cost |
|---------|------|------|
| Cloudflare | Free (upgrade to Pro if WAF needed) | $0.00 |
| **Subtotal** | | **$0.00** |

### Tier 1 Total

| Category | Monthly Cost | % of MRR |
|----------|-------------|----------|
| Compute | $11.00 | 0.03% |
| Database | $25.00 | 0.07% |
| External APIs | $430.00 | 1.19% |
| CDN | $0.00 | 0.00% |
| Domain | $1.50 | <0.01% |
| **Total** | **$467.50** | **1.30%** |

Infrastructure cost per tenant: **$46.75/month** (well within margin for $3K+ plans).

---

## Tier 2: 50 Tenants (Months 5-8)

Expected profile: 30 Starter, 15 Professional, 5 Enterprise = $195K MRR.

### Compute

| Resource | Spec | Cost |
|----------|------|------|
| Primary server | CPX31 (4 vCPU, 8GB RAM) | $16.00 |
| Standby failover | CPX21 (warm standby) | $9.00 |
| **Subtotal** | | **$25.00** |

Upgrade trigger: when average concurrent article generations exceed 5 (expected at ~40 tenants). The CPX31's 8GB RAM accommodates 8-10 concurrent Node.js child processes for Claude API calls.

### Database

| Resource | Spec | Cost |
|----------|------|------|
| Supabase Pro | Base plan | $25.00 |
| Compute add-on (Small) | 2-core, dedicated compute | $50.00 |
| **Subtotal** | | **$75.00** |

Database size: ~4GB after 6 months. Query volume: ~25,000/day. The compute add-on ensures consistent query latency as concurrent connections scale from 10 to 50 tenants.

### External APIs

| API | Usage | Monthly Cost |
|-----|-------|-------------|
| Claude API | 1,000 articles/mo @ $0.80 | $800.00 |
| Gemini API (images + research) | 1,000 articles | $250.00 |
| GSC / GA4 | 50 tenants, daily | $0.00 |
| Semrush API | May need enterprise tier at 50 tenants | $450.00 |
| Ahrefs API | May need higher tier | $200.00 |
| **Subtotal** | | **$1,700.00** |

### Tier 2 Total

| Category | Monthly Cost | % of MRR |
|----------|-------------|----------|
| Compute | $25.00 | 0.01% |
| Database | $75.00 | 0.04% |
| External APIs | $1,700.00 | 0.87% |
| CDN (Cloudflare Pro) | $20.00 | 0.01% |
| Domain | $1.50 | <0.01% |
| **Total** | **$1,821.50** | **0.93%** |

Infrastructure cost per tenant: **$36.43/month**.

---

## Tier 3: 100 Tenants (Months 9-14)

Expected profile: 55 Starter, 30 Professional, 15 Enterprise = $525K MRR.

### Compute

| Resource | Spec | Cost |
|----------|------|------|
| Primary server | CPX41 (8 vCPU, 16GB RAM) | $30.00 |
| Hot standby | CPX31 (auto-failover) | $16.00 |
| Job worker (article gen) | CPX21 (dedicated generation queue) | $9.00 |
| **Subtotal** | | **$55.00** |

At 100 tenants, separate the article generation workload onto a dedicated worker node to prevent generation CPU spikes from impacting dashboard API latency. Communication between API server and worker via Supabase job queue (no additional messaging infrastructure needed).

### Database

| Resource | Spec | Cost |
|----------|------|------|
| Supabase Pro | Base plan | $25.00 |
| Compute add-on (Medium) | 4-core dedicated | $100.00 |
| PITR add-on | Point-in-time recovery (sub-hour RPO) | $100.00 |
| **Subtotal** | | **$225.00** |

### External APIs

| API | Usage | Monthly Cost |
|-----|-------|-------------|
| Claude API | 2,500 articles/mo @ $0.75 (volume discount) | $1,875.00 |
| Gemini API | 2,500 articles | $625.00 |
| Semrush Enterprise API | Needed for query volume | $450.00 |
| Ahrefs Enterprise | Higher rate limits | $400.00 |
| **Subtotal** | | **$3,350.00** |

### Tier 3 Total: **$3,670.00/month** (0.70% of MRR). Per tenant: **$36.70**.

---

## Tier 4: 500 Tenants (Months 15-24)

Expected profile: 250 Starter, 175 Professional, 75 Enterprise = $2.7M MRR.

### Compute

| Resource | Spec | Cost |
|----------|------|------|
| API cluster (2x) | CPX41 behind Cloudflare LB | $60.00 |
| Worker cluster (3x) | CPX31 for generation queue | $48.00 |
| **Subtotal** | | **$108.00** |

### Database

| Resource | Spec | Cost |
|----------|------|------|
| Supabase Pro | Base | $25.00 |
| Compute add-on (Large) | 8-core dedicated | $200.00 |
| PITR | Sub-hour recovery | $100.00 |
| Read replica | For analytics queries | $100.00 |
| **Subtotal** | | **$425.00** |

### External APIs

| API | Usage | Monthly Cost |
|-----|-------|-------------|
| Claude API | 12,500 articles/mo @ $0.65 (batch API pricing) | $8,125.00 |
| Gemini API | 12,500 articles | $3,125.00 |
| Semrush Enterprise | Custom agreement | $800.00 |
| Ahrefs Enterprise | Custom agreement | $600.00 |
| **Subtotal** | | **$12,650.00** |

### Tier 4 Total: **$13,223.00/month** (0.49% of MRR). Per tenant: **$26.45**.

---

## Cost Scaling Summary

| Metric | 10 Tenants | 50 Tenants | 100 Tenants | 500 Tenants |
|--------|-----------|-----------|------------|------------|
| Monthly infra cost | $467.50 | $1,821.50 | $3,670.00 | $13,223.00 |
| Cost per tenant | $46.75 | $36.43 | $36.70 | $26.45 |
| % of MRR | 1.30% | 0.93% | 0.70% | 0.49% |
| Gross margin | 98.70% | 99.07% | 99.30% | 99.51% |

The dominant cost driver at every scale is Claude API spend (~60-70% of total infrastructure). Hetzner compute and Supabase database remain under 5% of total costs through 500 tenants. This validates the "cheap infrastructure, expensive AI" cost structure inherent to AI-native SaaS.

**Key inflection points:**
- **40 tenants:** Upgrade from CPX21 to CPX31 ($7/mo increase)
- **80 tenants:** Add dedicated generation worker node ($9/mo)
- **100 tenants:** Add Supabase PITR ($100/mo, justified by enterprise SLAs)
- **200 tenants:** Add Supabase read replica for analytics ($100/mo)
- **300 tenants:** Second API server node + Cloudflare load balancing ($30/mo + $5/mo)
