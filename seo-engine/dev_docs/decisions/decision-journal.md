# ChainIQ Decision Journal

> Lightweight log of non-architectural decisions: pricing, scope, timeline, vendor choices, and process decisions made during Steps 1-8.
> Format: Date | Decision | Rationale

---

## Pricing & Business Model

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-28 | Four pricing tiers: Creator ($149-199/mo), Growth ($500-800/mo), Professional ($3K/mo), Enterprise ($8-12K/mo) | Covers solo creators through enterprise publishers; Growth tier fills the $200-$3K dead zone |
| 2026-03-28 | Semrush/Ahrefs API keys owned by ChainIQ, cost absorbed into subscription pricing | Simplifies onboarding (clients don't need their own API keys); cost is predictable and baked into tier pricing |
| 2026-03-28 | Infrastructure target: ~$34/month (Hetzner $9 + Supabase $25) | Solo-dev-friendly burn rate; proves unit economics before scaling spend |

---

## Scope & Prioritization

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-28 | MoSCoW breakdown: 26 Must / 40 Should / 25 Could / 2 Won't out of 93 features | Hard scope boundaries prevent solo-dev scope creep; 26 Must Haves define a shippable MVP |
| 2026-03-28 | Phase order: A (Foundation) -> B (Core Intelligence) -> C (CMS Integrations) -> D (Analytics) -> E (Enterprise) across 30+ weeks | Dependencies flow left-to-right; each phase builds on the previous one's infrastructure |
| 2026-03-28 | Build order: Foundation first, then Guided Vertical Slice | Shared infra (auth, encryption, bridge) must be solid before features; vertical slice validates the full stack early |
| 2026-03-28 | A/B headline testing: Won't Have (tribunal binding verdict) | High engineering effort (traffic splitting, stat significance), niche demand in MENA market, Google Optimize sunset |

---

## Quality & Content Pipeline

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-28 | Quality Gate: 7-signal scoring formula, maximum 2 revision passes per article | Prevents infinite revision loops; 2 passes catch most issues without burning API credits |
| 2026-03-28 | Content Intelligence: 5-component scoring formula | Balances readability, topical depth, keyword optimization, originality, and structural quality into a single actionable score |
| 2026-03-28 | Voice Intelligence: 6 stylometric signals with HDBSCAN clustering | Captures sentence rhythm, vocabulary density, punctuation patterns, paragraph structure, formality level, and rhetorical devices |
| 2026-03-28 | Draft-first publishing: all CMS publishes create drafts, never auto-publish | Protects MENA publisher reputations; AI content must pass human editorial review before going live |

---

## Performance & Monitoring

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-28 | Performance checkpoints at 30/60/90 days post-publish with 3-day GSC lag buffer | Google Search Console data has a known 3-day reporting delay; checkpoints align with standard SEO measurement windows |

---

## Market & Localization

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-28 | Arabic-first market orientation targeting MENA publishers (SRMG) | Primary paying clients are Arabic publishers; RTL and Arabic NLP built in from day one, not bolted on |
| 2026-03-28 | K-means clustering for MVP, Python shim for production HDBSCAN | Ships faster; production gets battle-tested scikit-learn while MVP validates the feature with simpler clustering |

---

## Process Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-28 | Tribunal process for contentious decisions (binding verdicts) | Prevents bikeshedding on high-stakes choices; structured evaluation with clear accept/reject outcomes |
| 2026-03-28 | UUID primary keys everywhere, no auto-increment | Multi-tenant security: sequential IDs leak record counts between tenants |
| 2026-03-28 | Store money as integer cents, not floats | Eliminates JavaScript floating-point errors in API cost tracking and billing aggregation |
| 2026-03-28 | AES-256-GCM encryption with iv:authTag:ciphertext hex format | Authenticated encryption via native Node.js crypto; no npm dependency needed |
