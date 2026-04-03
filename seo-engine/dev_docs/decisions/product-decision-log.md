# ChainIQ — Product Decision Log

> **Step 18.5 Artifact**
> **Last Updated:** 2026-03-28
> **Source:** Tribunal deliberations (62 files, 150K words), Gate approvals, user decisions
> **Purpose:** Record of key product decisions with rationale, so future sessions never re-litigate settled questions
> **See also:** `decision-log.md` for architectural decisions (ADR-001 through ADR-019)

---

## How to Use This Log

- Before proposing a change that contradicts a logged decision, read the rationale first.
- If circumstances have changed enough to warrant revisiting, create a new entry with status `REVISITED` and link to the original.
- Never delete entries. Append only.

---

## Decisions

### DEC-001: Content Intelligence IS the Product

| Field | Value |
|-------|-------|
| **Date** | 2026-03-26 |
| **Status** | ACCEPTED |
| **Score** | 9.0/10 (tribunal average) |
| **Context** | The original article-engine is a Claude Code plugin that generates articles. The question was whether to keep it as a plugin or build a full platform around it. |
| **Decision** | Content Intelligence is the product. The article-engine plugin is one component of a 6-layer platform: Data Ingestion, Content Intelligence, Quality Gate, Voice Intelligence, Article Generation, Universal Publishing. |
| **Rationale** | The plugin alone is a tool. The platform (with GSC/GA4 data, decay detection, gap analysis, quality scoring, voice matching, and one-click publishing) is a business. Enterprise publishers will pay $3K-$12K/month for a platform, not for a CLI plugin. |
| **Alternatives Rejected** | (1) Keep as plugin only -- no recurring revenue. (2) Build dashboard without intelligence layers -- commodity product. |
| **Implications** | All development from Phase 5 onward builds platform layers. The plugin remains the article generation engine but is orchestrated by the platform. |

---

### DEC-002: Voice Intelligence = Premium Tier Differentiator

| Field | Value |
|-------|-------|
| **Date** | 2026-03-26 |
| **Status** | ACCEPTED |
| **Score** | 8.5/10 (tribunal average) |
| **Context** | Voice Intelligence (corpus analysis, writer clustering, persona generation) is technically complex and high-value. Should it be in all tiers or reserved for premium? |
| **Decision** | Voice Intelligence is a premium-tier feature, available in Professional ($6K/mo) and Enterprise ($12K/mo) tiers only. Starter tier ($3K/mo) gets content intelligence and basic article generation without voice matching. |
| **Rationale** | Voice matching is the strongest differentiator. Giving it to all tiers removes upsell incentive. The technical investment (corpus analysis, k-means clustering, stylometrics) justifies premium pricing. Competitors (Jasper, Copy.ai) do not offer this. |
| **Alternatives Rejected** | (1) All tiers get voice -- loses upsell. (2) Enterprise only -- too restrictive, Professional clients need it. |
| **Implications** | Phase 8 (Voice Intelligence) is built but gated by subscription tier. API endpoints check tier before returning voice data. |

---

### DEC-003: Foundation First, Then Guided Vertical Slice

| Field | Value |
|-------|-------|
| **Date** | 2026-03-26 |
| **Status** | ACCEPTED |
| **Score** | 9.2/10 (tribunal average) |
| **Context** | Two build strategies were proposed: (A) Build all foundations across all layers first, then add features top-to-bottom. (B) Build one vertical slice (one connector + one intelligence feature + one publishing target) end-to-end, then expand horizontally. |
| **Decision** | Foundation first (security, tests, dashboard scaffold, universal engine), then a guided vertical slice starting with GSC data through to Content Intelligence. Build order: Phase 5 (bottom) through Phase 10 (top). |
| **Rationale** | Foundations (auth, encryption, job queue, framework adapters) are prerequisites for every feature. Building them first avoids rework. The vertical slice validates the full pipeline early. Bottom-up order ensures each layer has its dependencies ready. |
| **Alternatives Rejected** | (1) Pure horizontal (all of Phase 5, then all of Phase 6, etc.) -- delays user-visible value. The guided vertical slice within bottom-up order balances both. |
| **Implications** | Phase order is fixed: 5 -> 6 -> 7 -> 8 -> 9 -> 10. Within each phase, build foundation tasks before UI tasks. |

---

### DEC-004: Arabic Has ZERO Competition

| Field | Value |
|-------|-------|
| **Date** | 2026-03-26 |
| **Status** | ACCEPTED |
| **Score** | 9.5/10 (tribunal average) |
| **Context** | Competitive analysis of 9 platforms (Jasper, Copy.ai, Writesonic, Frase, MarketMuse, Clearscope, SurferSEO, SE Ranking, ContentShake) for Arabic content intelligence capabilities. |
| **Decision** | Arabic/RTL content intelligence is ChainIQ's initial market wedge. No analyzed competitor offers Arabic-native content intelligence with GSC data integration, decay detection, or voice matching. This is a blue ocean opportunity. |
| **Rationale** | MENA publishers (initial target: SRMG) need content intelligence but have zero options. Building Arabic-first (with universal architecture) captures an uncontested market before competitors notice. The universal engine already supports RTL layouts, Arabic typography, and multi-language detection. |
| **Alternatives Rejected** | (1) English-first, Arabic later -- loses first-mover advantage in uncontested market. (2) Arabic-only -- too narrow, universal architecture costs little extra. |
| **Implications** | All features must work with Arabic content from day one. RTL CSS, Arabic tokenization, right-to-left UI layouts are not optional. Test with Arabic content in every phase. |

---

### DEC-005: Google OAuth Submission Is Day 1 Action

| Field | Value |
|-------|-------|
| **Date** | 2026-03-26 |
| **Status** | ACCEPTED |
| **Score** | 8.8/10 (tribunal average) |
| **Context** | Google OAuth consent screen verification can take 4-6 weeks. GSC and GA4 connectors (Phase 5, Sprint S2) require verified OAuth. |
| **Decision** | Submit Google OAuth consent screen for verification on the first day of Phase 5 development, before writing any OAuth code. Use "Testing" mode (100 test users) for development while verification is pending. |
| **Rationale** | The 4-6 week verification timeline is the longest lead-time item in the entire roadmap. Starting it on day 1 parallelizes the wait with development work. If delayed, it blocks all data ingestion features. |
| **Alternatives Rejected** | (1) Wait until OAuth code is complete -- wastes 4-6 weeks. (2) Skip verification and stay in testing mode -- limits to 100 users, not viable for production. |
| **Implications** | Day 1 of Sprint S1: submit OAuth consent screen. Requires: privacy policy URL, terms of service URL, app homepage URL, app logo, scope justification document. Prepare these assets before Sprint S1 starts. |

---

### DEC-006: Zero npm Dependencies Philosophy

| Field | Value |
|-------|-------|
| **Date** | 2026-03-26 |
| **Status** | ACCEPTED |
| **Score** | 8.0/10 |
| **Context** | The bridge server has zero npm dependencies. All functionality uses Node.js built-ins (http, crypto, fs, path) and native fetch. Should this be maintained as the codebase grows? |
| **Decision** | Maintain zero-dependency philosophy for the bridge server. The dashboard (Next.js) has its own dependency tree and is exempt. Any proposed bridge dependency must justify itself against a pure Node.js alternative. |
| **Rationale** | Zero deps means: no supply chain attacks, no version conflicts, no node_modules bloat, no breaking changes from upstream. The bridge server handles auth, encryption, and file operations -- all well-served by Node.js built-ins. |
| **Alternatives Rejected** | (1) Add Express -- unnecessary for 48 endpoints with a simple router. (2) Add a crypto library -- Node.js crypto module handles AES-256-GCM natively. |
| **Implications** | Every new bridge feature must use Node.js built-ins. If a library is truly needed (e.g., Redis client for production rate limiting), it requires a decision log entry justifying the exception. |

---

### DEC-007: Three-Tier Pricing Model

| Field | Value |
|-------|-------|
| **Date** | 2026-03-26 |
| **Status** | ACCEPTED |
| **Score** | 7.5/10 |
| **Context** | Pricing structure for ChainIQ platform subscriptions. |
| **Decision** | Three tiers: Starter ($3K/mo), Professional ($6K/mo), Enterprise ($12K/mo). A Growth tier ($500-800/mo) was flagged as needed for mid-market but deferred to post-launch validation. |
| **Rationale** | Enterprise MENA publishers are the initial target and can justify $3K-$12K/mo for content intelligence. The Growth tier addresses mid-market demand but requires usage-based pricing model validation first. |
| **Alternatives Rejected** | (1) Single tier -- no upsell path. (2) Usage-based only -- unpredictable revenue for a startup. |
| **Implications** | API endpoints enforce tier-based feature gating. Quotas (articles/month, API calls, connected sites) differ by tier. Admin dashboard shows tier-specific UI. |

---

### DEC-008: MoSCoW Feature Classification

| Field | Value |
|-------|-------|
| **Date** | 2026-03-26 |
| **Status** | ACCEPTED |
| **Score** | N/A (classification exercise, not scored) |
| **Context** | 93 features were classified using MoSCoW prioritization across the 6-layer platform. |
| **Decision** | 26 Must-Have, 40 Should-Have, 25 Could-Have, 2 Won't-Have. All Must-Have features are in Phases 5-7 (Data Ingestion, Content Intelligence, Quality Gate). Voice Intelligence and Publishing are Should/Could. |
| **Rationale** | Must-Have features define the minimum viable platform. A content intelligence platform without data connectors (GSC/GA4), decay detection, or quality scoring is not viable. Voice and publishing add value but are not table-stakes. |
| **Alternatives Rejected** | N/A -- this was a prioritization exercise, not a binary decision. |
| **Implications** | Sprint planning pulls from Must-Have first. Should-Have features are scheduled after all Must-Have items ship. Could-Have items are backlog only. |

---

## Decision Index

| ID | Title | Date | Status |
|----|-------|------|--------|
| DEC-001 | Content Intelligence IS the Product | 2026-03-26 | ACCEPTED |
| DEC-002 | Voice Intelligence = Premium Tier | 2026-03-26 | ACCEPTED |
| DEC-003 | Foundation First, Then Vertical Slice | 2026-03-26 | ACCEPTED |
| DEC-004 | Arabic ZERO Competition | 2026-03-26 | ACCEPTED |
| DEC-005 | Google OAuth Day 1 Submission | 2026-03-26 | ACCEPTED |
| DEC-006 | Zero npm Dependencies | 2026-03-26 | ACCEPTED |
| DEC-007 | Three-Tier Pricing ($3K/$6K/$12K) | 2026-03-26 | ACCEPTED |
| DEC-008 | MoSCoW: 26 Must, 40 Should, 25 Could, 2 Won't | 2026-03-26 | ACCEPTED |
