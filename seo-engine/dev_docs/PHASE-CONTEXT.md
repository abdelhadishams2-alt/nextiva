# ChainIQ Phase Context Profile

> **Last Updated:** 2026-03-28
> **Current Phase:** Design/Architecture, transitioning to Planning
> **Purpose:** Define what to load (and what NOT to load) per session based on current phase
> **Rule:** Load Tier 1 always. Load Tier 2 per task. Load Tier 3 on demand. Never load Tier 4.

---

## Current Phase: Design/Architecture -> Planning Transition

The project has completed deep service specification, system architecture, tech stack decisions, and tribunal proceedings (4 rounds of binding verdicts). The 12-service, 6-layer architecture is defined. The 93-feature MoSCoW classification and 5-phase roadmap are locked.

The next phase is Planning -- translating architecture into sprint plans, task breakdowns, and implementation sequencing for Phase A (Weeks 1-6: Foundation + Data Core).

**Phase characteristics:**
- Architecture decisions are made and binding (tribunal verdicts)
- Service specs exist for all 12 services
- No implementation code has been written for the 6 new services
- Existing codebase (bridge server, pipeline, dashboard) is stable and tested (228 tests)
- The primary risk is now execution speed, not design uncertainty

---

## Tier 1: Always Load (Every Session)

These files establish identity, current state, and architectural truth. Load all 4 before doing anything.

| File | Path | Why |
|------|------|-----|
| ARCH-ANCHOR.md | `dev_docs/ARCH-ANCHOR.md` | Primary recovery document. System shape, tech stack, services, constraints, anti-hallucination anchors. Prevents contradictions across sessions. |
| handoff.md | `dev_docs/handoff.md` | Session continuity. What was done last session, what is next, blockers, decisions made. |
| STATUS.md | `dev_docs/STATUS.md` | Current task dashboard. Active work, completion state, immediate next steps. |
| services/_index.md | `dev_docs/services/_index.md` | Service map, 6-layer architecture diagram, dependency graph, cross-service workflows. The structural backbone. |

**Total Tier 1 budget:** 4 files. These are compact by design (ARCH-ANCHOR is capped at 3000 words). Combined context cost is manageable.

---

## Tier 2: Load Per Task

Load the specific file(s) relevant to the current task. Never load more than 2 Tier 2 files per session (enforces the max-6-files-before-coding rule together with Tier 1).

### If working on a specific service:

| Task Area | Load |
|-----------|------|
| Data Ingestion work | `dev_docs/services/data-ingestion.md` |
| Content Intelligence work | `dev_docs/services/content-intelligence.md` |
| Voice Intelligence work | `dev_docs/services/voice-intelligence.md` |
| Quality Gate work | `dev_docs/services/quality-gate.md` |
| Publishing work | `dev_docs/services/publishing.md` |
| Feedback Loop work | `dev_docs/services/feedback-loop.md` |
| Auth/Bridge work | `dev_docs/services/auth-bridge.md` |
| Article Pipeline work | `dev_docs/services/article-pipeline.md` |
| Dashboard API work | `dev_docs/services/dashboard-api.md` |
| Universal Engine work | `dev_docs/services/universal-engine.md` |

### If working on a specific screen/UI:

| Task Area | Load |
|-----------|------|
| Connections page | `dev_docs/screens/connections.md` (if exists) |
| Content inventory page | `dev_docs/screens/content-inventory.md` (if exists) |
| Opportunities page | `dev_docs/screens/opportunities.md` (if exists) |
| Voice profiles page | `dev_docs/screens/voice-profiles.md` (if exists) |
| Quality report page | `dev_docs/screens/quality-report.md` (if exists) |
| Performance page | `dev_docs/screens/performance.md` (if exists) |

### If working on cross-cutting concerns:

| Task Area | Load |
|-----------|------|
| Database schema changes | `dev_docs/specs/system-architecture.md` (schema section) |
| Tech stack questions | `dev_docs/specs/tech-stack.md` |
| Sprint planning | `dev_docs/specs/system-architecture.md` + relevant service spec |
| Workflow validation | `dev_docs/completeness/cross-service-workflow-validation.md` |
| Feature prioritization | Tribunal round-4 (see Tier 3) |

---

## Tier 3: Load on Demand

These files contain deep reference material. Load only when you hit a specific question that Tier 1 and Tier 2 cannot answer.

| File | When to Load |
|------|-------------|
| `dev_docs/tribunal/07-tribunal-proceedings/round-4-prioritization.md` | When questioning feature priority, MoSCoW classification, or phase assignment |
| `dev_docs/tribunal/07-tribunal-proceedings/round-3-*.md` | When questioning build sequencing or phase structure rationale |
| `dev_docs/tribunal/07-tribunal-proceedings/round-2-*.md` | When questioning competitive positioning or feature gap analysis |
| `dev_docs/tribunal/07-tribunal-proceedings/round-1-*.md` | When questioning persona needs or market fit |
| `dev_docs/specs/system-architecture.md` (full) | When questioning deployment, security, or infrastructure decisions |
| `dev_docs/specs/tech-stack.md` (full) | When questioning technology choices or gotchas |
| `dev_docs/completeness/service-matrix.md` | When auditing service completeness or coverage gaps |
| `dev_docs/completeness/cross-service-workflow-validation.md` | When debugging a broken workflow or adding a new cross-service flow |
| `dev_docs/enhancement-backlog.md` | When prioritizing work within a sprint |
| `dev_docs/audit/quality-scorecard.md` | When assessing current quality baseline |
| `CLAUDE.md` | When questioning project identity, prime directives, or anti-patterns (usually already internalized from Tier 1 ARCH-ANCHOR) |
| `dev_docs/tasks/*.md` | When executing a specific implementation task |

---

## Tier 4: Never Load for This Phase

These files are irrelevant to the Design/Architecture -> Planning transition. Loading them wastes context window and risks distraction.

| Category | Examples | Why Excluded |
|----------|----------|-------------|
| Marketing materials | Product briefs, pitch decks, competitor screenshots | Not relevant to technical planning |
| Legal documents | Terms of service, privacy policy, DPA | Not relevant until pre-launch |
| Financial models | Revenue projections, cost models, pricing analysis | Business decisions are made; engineering executes |
| User research raw data | Interview transcripts, survey responses | Already synthesized into personas and tribunal verdicts |
| Old audit files | Pre-enhancement audit snapshots | Superseded by current specs |
| Plugin marketplace files | `.claude-plugin/marketplace.json` | Not relevant until plugin is built |
| Config files (code) | `package.json`, `engine-config.md`, `banned-patterns.md` | Implementation details, not architecture |

---

## Phase Transition Triggers

This context profile should be updated when the phase changes:

| Trigger | New Phase | Changes to Context Profile |
|---------|-----------|---------------------------|
| Phase A Sprint 1 starts | Planning -> Implementation | Tier 2 adds task files. Tier 3 adds implementation specs. Service specs become Tier 2 default. |
| Phase A complete | Implementation (foundation) -> Implementation (vertical slice) | Tier 2 shifts to Phase B service specs. Cross-service validation becomes Tier 2. |
| Phase B complete | Vertical slice -> Voice/Publishing | Voice Intelligence and Publishing specs become Tier 2 default. |
| Major architecture change | Any | ARCH-ANCHOR.md updated first. All tiers re-evaluated. |

---

## Session Startup Checklist

```
1. Load Tier 1 (4 files):
   [ ] ARCH-ANCHOR.md
   [ ] handoff.md
   [ ] STATUS.md
   [ ] services/_index.md

2. Identify today's task from STATUS.md

3. Load Tier 2 (max 2 files based on task)

4. Start coding (max 6 files read before first code change)

5. Before session end:
   [ ] Update STATUS.md
   [ ] Update handoff.md
   [ ] Update ARCH-ANCHOR.md (if architecture changed)
```
