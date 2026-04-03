# ChainIQ — Enhance Intake

**Date:** 2026-03-26
**Path:** Enhance
**Maturity:** MID_BUILD (45/100)
**Current State Rating:** 3-4/10 (Prototype level)

---

## Existing Application Summary

**Article Engine v4.6.6** — A Claude Code plugin that generates full HTML articles through a 4-agent pipeline (project-analyzer → research-engine → article-architect → draft-writer) with a bridge server for browser-based section editing and Supabase authentication.

### Auto-Scan Pre-Fill

| Field | Detected Value | Confidence |
|-------|---------------|------------|
| Application name | article-engine (→ ChainIQ) | High |
| Primary language | JavaScript / Markdown | High |
| Framework(s) | Claude Code Plugin framework | High |
| Database | Supabase (PostgreSQL) | High |
| ORM / Query layer | Supabase JS client (HTTP API) | High |
| Auth approach | Supabase Auth + Bearer tokens + admin endpoints | High |
| Frontend framework | None (generates standalone HTML) | High |
| CSS approach | Inline CSS + design token injection | High |
| Deployment target | Claude Code plugin registry | High |
| CI/CD | None | High |
| Test frameworks | None | High |
| External services | Supabase, Gemini MCP, WebSearch/WebFetch, Context7 MCP | High |
| Monorepo structure | No | High |
| Existing docs quality | Partial (internal only) | High |
| Estimated codebase size | ~15 files, ~5000 LOC | High |
| Test coverage | None | High |

### Existing Architecture

```
Input (topic keyword)
    ↓
[Main Orchestrator / SKILL.md — 1421 lines, 20-step pipeline]
    ├→ Project Analyzer Agent (detect shell, tokens, style)
    ├→ Research Engine Agent (6-round research + image prompts)
    ├→ Article Architect Agent (concepts → architecture)
    ├→ Gemini Image Generator (4-6 images)
    └→ Draft Writer Agent (HTML assembly + edit UI)
    ↓
Output (standalone HTML file)
    ↓
[Bridge Server — localhost:19847] ← browser edits → [Claude CLI section rewrite]
```

### Key Files

| File | Lines | Role |
|------|-------|------|
| `skills/article-engine/SKILL.md` | 1421 | Main orchestrator |
| `config/structural-component-registry.md` | ~2000 | 193 component blueprints |
| `bridge/server.js` | 519 | Edit server, auth, admin |
| `bridge/supabase-client.js` | 393 | Supabase SDK wrapper |
| `agents/article-architect.md` | ~300 | Concept + architecture |
| `agents/draft-writer.md` | ~1000 | HTML generation + edit UI |
| `agents/research-engine.md` | ~200 | 6-round research |
| `agents/project-analyzer.md` | ~350 | Project detection |

---

## Enhancement Motivation

**All of the above:**
- Missing key features (dashboard, multi-language, universal adaptability)
- Scale for commercialization (transform into ChainIQ product)
- Full documentation & planning before scaling

## Top Pain Points (All 4 Selected)

1. **No dashboard/UI control** — everything CLI-only, no visual management
2. **Not truly universal** — limited tech stack detection, no multi-language, no framework adapters
3. **No analytics/monitoring** — can't track article performance, generation stats, errors
4. **Manual setup required** — users must configure Supabase, API keys manually

## North-Star Goal

**Build the platform first** — get dashboard + universal adaptability + analytics working before commercializing.

## Enhancement Focus Areas

All areas: architecture, features, testing, documentation, security, performance, UX, infrastructure.

## Constraints

- **Timeline:** Immediately (this week)
- **Team:** Solo developer
- **Out of scope:** Marketing/legal docs
- **Dashboard stack:** To be determined during architecture phase

## Product Vision (from ChainIQ Proposal)

ChainIQ is an AI Content Intelligence Platform with 4 layers:
1. **Data Ingestion** — GSC API, CMS feeds, crawlers, analytics
2. **AI Intelligence Engine** — Arabic NLP, entity extraction, topical mapping, EEAT scoring
3. **Automation & Optimization** — Prioritized recommendations, content briefs, CTR improvements
4. **Human Intelligence Layer** — Editorial validation, SEO consulting (premium tier)

3 service tiers: $3K/mo (platform only), $5K/mo (managed), $8-12K/mo (full intelligence).

The enhanced article-engine plugin IS ChainIQ's core — the dashboard controls everything.
