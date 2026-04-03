# ChainIQ Detailed Infrastructure Cost Model

> **Created:** 2026-03-28
> **Scope:** Granular cost breakdown for every infrastructure component at scale
> **Companion to:** `../operations/infrastructure-cost-model.md` (capacity planning focus)
> **This document's focus:** Per-unit costs, scaling triggers, vendor comparisons, optimization levers
> **Pricing source:** Published vendor pricing as of March 2026

---

## Compute: Hetzner Cloud

ChainIQ runs on Hetzner Cloud (Falkenstein, Germany) managed via Coolify. Hetzner was selected for price-performance ratio -- 3-5x cheaper than equivalent AWS/GCP instances -- and Frankfurt proximity to MENA clients (60-80ms latency to Dubai, 40ms to Istanbul).

### Server Tiers

| Plan | vCPU | RAM | Storage | Monthly | When to Upgrade |
|------|------|-----|---------|---------|----------------|
| **CPX21** (current) | 3 | 4 GB | 80 GB NVMe | $9.00 | Baseline through 40 tenants |
| **CPX31** | 4 | 8 GB | 160 GB NVMe | $16.00 | When concurrent generations exceed 5 |
| **CPX41** | 8 | 16 GB | 240 GB NVMe | $30.00 | When concurrent generations exceed 12 |
| **CPX51** | 16 | 32 GB | 360 GB NVMe | $58.00 | When running 3+ worker processes |

### Multi-Node Architecture (50+ Tenants)

| Role | Plan | Count | Monthly | Purpose |
|------|------|-------|---------|---------|
| API server | CPX31-CPX41 | 1-2 | $16-$60 | Dashboard API, auth, admin |
| Generation worker | CPX21-CPX31 | 1-3 | $9-$48 | Article generation (Claude API calls) |
| Standby (cold) | CPX21 | 1 | $2-$9 | Failover, powered off until needed |

**Scaling model:** Article generation is I/O-bound (waiting on Claude API responses), so each worker can handle 3-5 concurrent generations. At 100 tenants generating 20 articles/month each (2,000 articles/month, ~67/day), peak concurrent generation during business hours (8 hours MENA timezone): 67 / 8 * 0.08 hours avg per article = ~4.2 concurrent. One CPX31 worker handles this. Add a second worker at ~150 tenants.

**Annual cost at scale points:**
- 10 tenants: $9/mo = **$108/year**
- 50 tenants: $25/mo = **$300/year**
- 100 tenants: $55/mo = **$660/year**
- 500 tenants: $108/mo = **$1,296/year**

---

## Database: Supabase

Supabase PostgreSQL is ChainIQ's single data store. All user data, articles, analytics, OAuth tokens, and operational state reside here. Supabase was selected for: managed PostgreSQL (zero DBA overhead for a solo dev), built-in Auth, RLS, real-time subscriptions, and predictable pricing.

### Plan Progression

| Plan | Monthly | DB Size | Compute | Bandwidth | When |
|------|---------|---------|---------|-----------|------|
| **Pro** (current) | $25.00 | 8 GB | Shared | 250 GB | Through 50 tenants |
| **Pro + Small compute** | $75.00 | 8 GB | 2-core dedicated | 250 GB | 50-100 tenants (consistent latency) |
| **Pro + Medium compute** | $125.00 | 8 GB | 4-core dedicated | 250 GB | 100-200 tenants |
| **Pro + Large compute** | $225.00 | 8 GB | 8-core dedicated | 250 GB | 200-500 tenants |

### Add-ons

| Add-on | Monthly | When to Enable |
|--------|---------|---------------|
| PITR (Point-in-Time Recovery) | $100.00 | First Enterprise client or 100 tenants |
| Read replica | $100.00+ | When analytics queries impact API latency (200+ tenants) |
| Storage overage (beyond 8GB) | $0.021/GB | Not expected until 300+ tenants |
| Bandwidth overage (beyond 250GB) | $0.09/GB | Unlikely -- API payloads are small |

### Database Size Projections

| Tenants | Tables Data | Indexes | WAL/Overhead | Total | Supabase Limit |
|---------|-------------|---------|-------------|-------|---------------|
| 10 | 500 MB | 200 MB | 300 MB | ~1 GB | 8 GB (12.5%) |
| 50 | 2.5 GB | 800 MB | 700 MB | ~4 GB | 8 GB (50%) |
| 100 | 5 GB | 1.5 GB | 1 GB | ~7.5 GB | 8 GB (94%) -- monitor closely |
| 200 | 8 GB | 2.5 GB | 1.5 GB | ~12 GB | Needs storage upgrade |

**Data lifecycle impact:** The 90-day rollup on `performance_snapshots` (see data-lifecycle.md) reduces storage by ~85% for analytical data. Without lifecycle management, 100 tenants would exceed 8GB by month 8. With lifecycle management, 100 tenants stay under 8GB through month 18.

---

## CDN & Security: Cloudflare

Cloudflare sits in front of both the Hetzner bridge server and the Next.js dashboard, providing DNS, CDN caching, DDoS protection, and (on paid plans) WAF rules.

| Plan | Monthly | Features | When |
|------|---------|----------|------|
| **Free** (current) | $0.00 | DNS, basic CDN, 5 page rules, rate limiting (limited) | Through 20 tenants |
| **Pro** | $20.00 | WAF, 20 page rules, image optimization, analytics | When serving production traffic to enterprise clients |
| **Business** | $200.00 | Advanced WAF, custom rules, 100% SLA | Unlikely needed -- Hetzner + Supabase SLAs suffice |

**Cloudflare value at each tier:**
- Free: DNS management, SSL termination, basic DDoS. Sufficient for ChainIQ's API traffic pattern (low volume, high value per request).
- Pro: The WAF rules become valuable when MENA publishers are routing production traffic through ChainIQ-published content. The $20/mo is justified at 10+ tenants.

---

## AI API Costs: Claude (Article Generation)

Claude API is ChainIQ's largest variable cost and the primary cost driver at scale. The 7-agent pipeline makes 4-6 API calls per article, each with different token profiles.

### Per-Agent Token Usage

| Agent | Input Tokens | Output Tokens | Model | Cost per Call |
|-------|-------------|---------------|-------|--------------|
| Topic Recommender | ~500 | ~1,000 | Sonnet 4 | $0.017 |
| Voice Analyzer | ~800 | ~1,500 | Sonnet 4 | $0.025 |
| Project Analyzer | ~1,000 | ~1,500 | Sonnet 4 | $0.025 |
| Research Engine | ~800 | ~2,000 | Sonnet 4 | $0.033 |
| Article Architect | ~1,000 | ~1,500 | Sonnet 4 | $0.025 |
| Draft Writer | ~1,500 | ~3,000 | Sonnet 4 | $0.050 |
| Quality Gate | ~800 | ~1,000 | Sonnet 4 | $0.017 |
| **Total per article** | **~6,400** | **~11,500** | | **~$0.19** (base) |

**Note:** The above uses Claude Sonnet 4 pricing at $3/M input, $15/M output. Real-world costs are higher due to system prompts (~2,000 tokens per call), retry on failures (~10% rate), and context carryover between agents. Applied multiplier: 4.2x base cost.

**Effective cost per article: $0.80** (includes retries, system prompts, and context overhead).

### Volume Pricing Tiers

| Monthly Volume | Pricing | Per Article | Monthly API Spend |
|---------------|---------|------------|-------------------|
| 0-500 articles | Standard | $0.80 | $0-$400 |
| 500-2,000 articles | Standard (no volume discount) | $0.80 | $400-$1,600 |
| 2,000-5,000 articles | Batch API (~20% discount) | $0.65 | $1,300-$3,250 |
| 5,000+ articles | Negotiated enterprise rate | $0.50-$0.60 | $2,500-$3,000+ |

**Cost optimization levers:**
1. **Batch API:** Queue non-urgent generations (e.g., scheduled overnight runs) through Claude's batch endpoint for 50% input token discount
2. **Model selection:** Use Haiku for Topic Recommender and Quality Gate (simpler tasks), Sonnet for complex agents. Saves ~25% per article
3. **Prompt caching:** Cache static system prompts and blueprint definitions. Saves ~15% on input token costs
4. **Output efficiency:** Tune Article Architect to produce tighter outlines, reducing Draft Writer output tokens

---

## AI API Costs: Gemini (Research + Images)

Gemini serves two roles in the ChainIQ pipeline: web research (grounding for article content) and image generation (article illustrations).

### Research Usage

| Task | Model | Input/Output Tokens | Cost per Article |
|------|-------|-------------------|-----------------|
| Web search grounding | Gemini 2.0 Flash | ~1,000 / ~2,000 | $0.01 |
| Content analysis | Gemini 2.0 Flash | ~2,000 / ~1,500 | $0.01 |
| Competitor page analysis | Gemini 2.0 Flash | ~3,000 / ~2,000 | $0.02 |
| **Research subtotal** | | | **$0.04-$0.05** |

### Image Generation

| Task | Model | Cost per Image | Images per Article | Cost per Article |
|------|-------|---------------|-------------------|-----------------|
| Article illustrations | Gemini Imagen 3 | $0.04 | 5 | $0.20 |
| Thumbnail/hero image | Gemini Imagen 3 | $0.04 | 1 | $0.04 |
| **Image subtotal** | | | | **$0.20-$0.24** |

### Total Gemini Cost per Article: $0.25

### Monthly Gemini Spend at Scale

| Tenants | Articles/Month | Gemini Research | Gemini Images | Total Gemini |
|---------|---------------|----------------|--------------|-------------|
| 10 | 200 | $10.00 | $48.00 | $58.00 |
| 50 | 1,000 | $50.00 | $240.00 | $290.00 |
| 100 | 2,500 | $125.00 | $600.00 | $725.00 |
| 500 | 12,500 | $625.00 | $3,000.00 | $3,625.00 |

---

## External SEO API Costs

ChainIQ's content intelligence layer (Layer 2) requires data from external SEO tools. These are fixed subscription costs, not per-query charges (within plan limits).

### Semrush

| Plan | Monthly | API Calls/Month | Sufficient For |
|------|---------|----------------|---------------|
| **Pro** | $120.00 | 10,000 | 1-20 tenants (500 queries/tenant/month) |
| **Guru** | $230.00 | 30,000 | 20-60 tenants |
| **Business** | $450.00 | 50,000 | 60-100 tenants |
| **Enterprise** | Custom (~$800) | 100,000+ | 100-500 tenants |

API call allocation per tenant: keyword research (~200 calls/mo), domain analytics (~100), position tracking (~150), backlink data (~50) = ~500 calls/tenant/month.

### Ahrefs

| Plan | Monthly | API Credits/Month | Sufficient For |
|------|---------|------------------|---------------|
| **Lite** | $100.00 | 500 | 1-10 tenants |
| **Standard** | $200.00 | 1,500 | 10-30 tenants |
| **Advanced** | $400.00 | 5,000 | 30-100 tenants |
| **Enterprise** | Custom (~$600) | 10,000+ | 100-500 tenants |

API credit allocation per tenant: site explorer (~20 credits/mo), content explorer (~15), keywords explorer (~15) = ~50 credits/tenant/month.

### GSC and GA4 (Google APIs)

| API | Monthly Cost | Quota | Notes |
|-----|-------------|-------|-------|
| Google Search Console API | $0.00 | 2,000 queries/day free | Sufficient for 500+ tenants |
| Google Analytics 4 Data API | $0.00 | Quota-based (generous) | Sufficient for 500+ tenants |
| Google OAuth (consent screen) | $0.00 | Free | Requires Google verification for >100 users |

---

## Total Infrastructure Cost Summary

### At 10 Tenants (~200 articles/month)

| Component | Monthly | % of Total |
|-----------|---------|-----------|
| Hetzner (CPX21) | $11.00 | 2.4% |
| Supabase (Pro) | $25.00 | 5.4% |
| Cloudflare (Free) | $0.00 | 0.0% |
| Claude API | $160.00 | 34.3% |
| Gemini API | $58.00 | 12.4% |
| Semrush (Pro) | $120.00 | 25.7% |
| Ahrefs (Lite) | $100.00 | 21.4% |
| Domain | $1.50 | 0.3% |
| **Total** | **$475.50** | **100%** |

### At 50 Tenants (~1,000 articles/month)

| Component | Monthly | % of Total |
|-----------|---------|-----------|
| Hetzner (CPX31 + standby) | $25.00 | 1.3% |
| Supabase (Pro + Small compute) | $75.00 | 3.8% |
| Cloudflare (Pro) | $20.00 | 1.0% |
| Claude API | $800.00 | 40.8% |
| Gemini API | $290.00 | 14.8% |
| Semrush (Guru) | $230.00 | 11.7% |
| Ahrefs (Standard) | $200.00 | 10.2% |
| Domain | $1.50 | 0.1% |
| **Total** | **$1,641.50** | **100%** |

### At 100 Tenants (~2,500 articles/month)

| Component | Monthly | % of Total |
|-----------|---------|-----------|
| Hetzner (CPX41 + worker + standby) | $55.00 | 1.4% |
| Supabase (Pro + Medium + PITR) | $225.00 | 5.8% |
| Cloudflare (Pro) | $20.00 | 0.5% |
| Claude API | $2,000.00 | 51.5% |
| Gemini API | $725.00 | 18.7% |
| Semrush (Business) | $450.00 | 11.6% |
| Ahrefs (Advanced) | $400.00 | 10.3% |
| Domain | $1.50 | <0.1% |
| **Total** | **$3,876.50** | **100%** |

### At 500 Tenants (~12,500 articles/month)

| Component | Monthly | % of Total |
|-----------|---------|-----------|
| Hetzner (cluster) | $108.00 | 0.8% |
| Supabase (Pro + Large + PITR + replica) | $425.00 | 3.0% |
| Cloudflare (Pro) | $20.00 | 0.1% |
| Claude API | $8,125.00 | 58.0% |
| Gemini API | $3,625.00 | 25.9% |
| Semrush (Enterprise) | $800.00 | 5.7% |
| Ahrefs (Enterprise) | $600.00 | 4.3% |
| Domain | $1.50 | <0.1% |
| **Total** | **$13,704.50** | **100%** |

---

## Cost Optimization Roadmap

| Optimization | Savings | When to Implement | Effort |
|-------------|---------|-------------------|--------|
| Claude Batch API for scheduled generations | 20-30% on Claude costs | 500+ articles/month | 8 hours |
| Haiku for simple agents (Topic, Quality Gate) | 25% on Claude costs | Immediately | 4 hours |
| Prompt caching for system prompts | 15% on input tokens | 1,000+ articles/month | 6 hours |
| Gemini image caching (reuse generic images) | 30% on Gemini image costs | 500+ articles/month | 10 hours |
| Semrush data caching (7-day TTL for keyword data) | Reduces API calls by 60% | Immediately | 4 hours |
| Ahrefs data caching (14-day TTL for backlink data) | Reduces API calls by 50% | Immediately | 4 hours |

**Total potential savings at 100 tenants:** ~$1,200/month (31% reduction from $3,877 to ~$2,677). The dominant lever is Claude API optimization -- prompt caching + Batch API + model mixing can reduce the Claude line item by 40-50%.
