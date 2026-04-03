# Audit: Architecture & Code Quality

> **App:** article-engine (ChainIQ)
> **Dimension:** E1-A
> **Date:** 2026-03-26
> **Rounds completed:** 3/3

---

## Score: 5/10 — Needs Work

The JavaScript bridge layer is reasonably well-built. The markdown orchestration layer has a severe god-file problem, hardcoded credentials, and no shared-logic management. Fixable through extraction and deduplication without a full rewrite.

---

## Round 1 Findings (Surface Scan)

### Directory Structure
```
article-engine-plugin/
├── agents/          (4 agent definition files — markdown)
├── bridge/          (2 JS files — server + supabase client)
├── commands/        (3 command definitions — markdown)
├── config/          (10 config files — mixed JSON/markdown/HTML)
├── skills/          (1 skill — SKILL.md orchestrator)
├── .claude-plugin/  (plugin metadata)
├── package.json, plugin.json, setup.sh, supabase-setup.sql
```
Pattern: **flat feature-based** — each directory holds one concern. Recognizable but shallow (no nesting, no shared modules).

### Files Exceeding 500 LOC
| File | Lines | Concern |
|------|-------|---------|
| `skills/article-engine/SKILL.md` | 1421 | Main orchestrator — GOD FILE |
| `agents/draft-writer.md` | ~1000 | HTML generation + edit UI CSS/JS + 13 validation checks |
| `config/structural-component-registry.md` | ~2000 | 193 component blueprints (data, not logic) |
| `bridge/server.js` | 519 | HTTP server + auth + admin + edit handler |

### Separation of Concerns
- **Good:** Bridge server (runtime JS) is cleanly separated from agent definitions (markdown prompts).
- **Problem:** `SKILL.md` mixes orchestration logic, configuration policy, setup scripts, error handling, and progress messaging in a single 1421-line file. It is the monolith of the system.
- **Problem:** `draft-writer.md` contains the full edit UI (CSS, JS, HTML) inline within the agent prompt. This couples UI implementation to agent definition.

### Type Safety
- Pure JavaScript (no TypeScript). No type annotations.
- No JSDoc types on bridge server functions.
- No `@ts-check` or similar.

### Average File Size
- Bridge JS files: ~450 LOC average (reasonable)
- Agent markdown files: ~460 LOC average (draft-writer skews this)
- Config files: highly variable (50-2000 LOC)

### Coupling
- No circular imports (only 2 JS files; server.js requires supabase-client.js one-way).
- Tight coupling between SKILL.md and all agent definitions (SKILL.md dictates exact agent dispatch patterns, output formats, and error handling — changes to any agent require SKILL.md updates).
- Bridge server is independent of the agent pipeline — good decoupling.

---

## Round 2 Findings (Deep Dive)

### 5 Most Complex Files

**1. `skills/article-engine/SKILL.md` (1421 lines)**
- Responsibility: Everything. 20-step pipeline orchestration, setup gate, auth check, topic parsing, domain classification, agent dispatch, image generation, error handling, progress messaging.
- Doing too much? **Yes — severely.** This is a god file. It should be decomposed into: setup module, auth module, input normalizer, pipeline orchestrator, and error handler.
- Refactors needed: Extract setup gate into separate command/script. Extract auth check into reusable module. Extract input normalization. Keep orchestration as the core.

**2. `agents/draft-writer.md` (~1000 lines)**
- Responsibility: HTML generation, shell integration, component mapping, edit UI injection (full CSS + JS), consistency validation.
- Doing too much? **Yes.** The edit UI (CSS, JS, HTML template) should be a separate file that the agent references, not inline in the prompt.
- Refactors needed: Extract edit UI template to `config/edit-ui-template.html`.

**3. `bridge/server.js` (519 lines)**
- Responsibility: HTTP server, routing, auth middleware, rate limiter, edit handler with subprocess spawn, admin endpoints.
- Doing too much? **Borderline.** For a single-file server it's reasonable, but the admin endpoints could be extracted.
- Refactors needed: Extract admin routes to `bridge/admin.js`. Extract auth middleware to `bridge/auth.js`.

**4. `bridge/supabase-client.js` (393 lines)**
- Responsibility: Supabase config loading, token verification, subscription checks, admin operations, user CRUD.
- Doing too much? **No.** Well-scoped to Supabase operations.
- Refactors needed: Minor — extract `loadConfig()` caching logic.

**5. `config/structural-component-registry.md` (~2000 lines)**
- Responsibility: 193 component blueprints (structure-only definitions).
- Doing too much? **No.** This is data, not logic. Large but appropriate.
- Refactors needed: None — this is a reference file.

### Consistent Architectural Pattern?
**No.** The codebase uses two fundamentally different paradigms:
- **Bridge layer:** Conventional Node.js (functions, modules, HTTP handlers)
- **Agent layer:** Markdown prompt engineering (instructions, rules, examples)

These paradigms don't share patterns, conventions, or abstractions. The bridge layer is well-structured. The agent layer is monolithic.

### Duplicated Patterns
- Auth token extraction appears in both `server.js` (`getToken`) and `SKILL.md` (reads `.auth-session.json`). Two separate auth check implementations.
- Supabase URL and anon key appear in 3 places: `supabase-client.js` DEFAULT_CONFIG, `config/.supabase.json`, and referenced in `SKILL.md`.
- The "check if Gemini MCP is available" logic appears in both `SKILL.md` setup gate and `config/engine-config.md`.

### Dead Code / Commented-Out Code
- `config/.blueprint-history.json` exists but is empty (`{}`). Unused.
- Version numbers are inconsistent: `package.json` says 4.6.6, `plugin.json` says 4.6.8, `engine-config.md` header says v4.5. Dead version references.

### Shared Logic Management
- **No shared module exists.** There is no `utils/`, `shared/`, `lib/`, or `common/` directory.
- The Supabase client is the closest thing to shared logic, but it's only consumed by `server.js`.

---

## Round 3 Recommendations

### Top 3 Architecture Improvements

1. **Decompose SKILL.md** — Extract setup gate, auth check, and input normalization into separate files. Keep the 20-step pipeline as the core but reference extracted modules. Target: SKILL.md under 800 lines.

2. **Extract edit UI template** — Move the inline CSS, JS, and HTML for the section edit overlay from `draft-writer.md` into `config/edit-ui-template.html`. The agent references the file instead of containing it.

3. **Create a shared config module** — Centralize Supabase URL, anon key, version number, and Gemini MCP detection into a single `config/runtime-config.js` that both the bridge server and setup scripts consume.

### Protect List (High Quality, Do Not Touch Without Review)
- `bridge/supabase-client.js` — Well-structured, correct privilege separation
- `config/structural-component-registry.md` — 193 blueprints, extensive work
- `supabase-setup.sql` — Best-documented file in the project
- `agents/project-analyzer.md` — Clean, focused agent definition
- `agents/research-engine.md` — Clean, focused agent definition

### Realistic Refactor Plan
- **Now (before adding features):** Extract edit UI template, centralize config, fix version inconsistency
- **During dashboard build:** Decompose SKILL.md as new features require touching it
- **Later:** Add TypeScript to bridge layer, extract admin routes

---

## P0 Issues (Fix Immediately)
- Version inconsistency across 4 files (4.6.6 vs 4.6.8 vs v4.5)
- Hardcoded Supabase credentials in `supabase-client.js` DEFAULT_CONFIG

## P1 Issues (Fix Before Scaling)
- SKILL.md god file (1421 lines, single point of failure for all pipeline logic)
- No shared config module (3 sources of truth for Supabase config)
- No TypeScript (bridge server handles auth and file operations without type safety)
- Edit UI template embedded in agent prompt (couples UI to agent definition)
