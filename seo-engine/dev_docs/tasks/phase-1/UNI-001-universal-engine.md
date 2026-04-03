# UNI-001: Universal Engine (Multi-Lang + Adapters + Auto-Config)

> **Phase:** 1 | **Priority:** P1 | **Status:** NOT STARTED
> **Effort:** XL (64h / 8 days) | **Type:** new
> **Backlog Items:** T2-11, T2-12, T2-13, T2-14, T2-15
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `dev_docs/services/universal-engine.md` — full universal engine spec
3. `dev_docs/services/article-pipeline.md` — pipeline extension points
4. `agents/project-analyzer.md` — current detection capabilities
5. `agents/draft-writer.md` — current HTML output generation
6. `config/engine-config.md` — adaptation modes
7. `config/structural-component-registry.md` — 193 blueprints (PROTECTED)
8. `skills/article-engine/SKILL.md` — pipeline orchestration (PROTECTED sequence)

## Objective
Make ChainIQ truly universal: detect any project's tech stack automatically, generate articles in any language (including RTL), and output through framework-specific adapters for React, Vue, Svelte, WordPress, and HTML.

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `bridge/language-detector.js` | Language detection from topic text |
| CREATE | `bridge/framework-adapter.js` | Adapter factory + 5 adapter implementations |
| CREATE | `bridge/auto-config.js` | Project stack auto-detection module |
| MODIFY | `agents/project-analyzer.md` | Enhanced detection for more frameworks |
| MODIFY | `agents/draft-writer.md` | Output through selected adapter instead of hardcoded HTML |
| MODIFY | `config/engine-config.md` | Add language and adapter configuration |
| CREATE | `tests/language-detector.test.js` | Language detection test suite |
| CREATE | `tests/framework-adapter.test.js` | Adapter output validation tests |
| CREATE | `tests/auto-config.test.js` | Auto-config detection tests |

## Sub-tasks

### Sub-task 1: Language detection module (~8h)
- Create `bridge/language-detector.js`
- Detect script type (Latin, Arabic, Hebrew, CJK, Cyrillic, Devanagari)
- Map script + word patterns to language
- Return: `{ language, direction, fonts, locale }`
- Phase 1 languages: English, Arabic, Hebrew, French, Spanish, Turkish
- Fallback: English if detection fails
- Test suite with ≥10 test cases

### Sub-task 2: RTL CSS support (~8h)
- Define RTL CSS strategy: logical properties throughout
- Create CSS template variants for RTL: `margin-inline-start`, `padding-inline-end`, etc.
- Handle bidirectional content: code blocks stay LTR inside RTL articles
- Arabic typography: appropriate font stacks (Noto Naskh, Noto Kufi)
- Modify draft-writer to apply direction and fonts based on language
- Test with Arabic and Hebrew content

### Sub-task 3: Framework adapters (~24h, 5 adapters)
- Create `bridge/framework-adapter.js` with adapter factory pattern
- Define Intermediate Representation (IR): section tree + component map + design tokens
- **HTML adapter** (existing, extract as adapter): standalone HTML, inline CSS/JS
- **React adapter**: JSX component, CSS modules, proper imports
- **Vue adapter**: Single File Component (.vue), Composition API, scoped styles
- **Svelte adapter**: .svelte component, reactive declarations, style block
- **WordPress adapter**: PHP template, wp_enqueue, WordPress coding standards
- Each adapter must produce valid, lintable output
- Test each adapter with ≥3 test cases

### Sub-task 4: Auto-config enhancement (~8h)
- Create `bridge/auto-config.js`
- Detect: package manager, framework, shell, CSS framework, CI/CD, deploy target, TypeScript, monorepo
- Use detection matrix from universal-engine.md service spec
- Return `PROJECT_CONFIG` object
- Modify project-analyzer agent to use auto-config output
- Fallback chain: unknown → HTML + npm + bash
- Test with ≥8 project configurations

### Sub-task 5: Pipeline integration (~16h)
- Modify `agents/draft-writer.md` to accept adapter parameter
- Modify `config/engine-config.md` to include language + adapter settings
- Ensure SKILL.md orchestration passes language and adapter through pipeline
- Modify research-engine to use detected language for Gemini MCP queries
- End-to-end test: generate article in Arabic using React adapter

## Acceptance Criteria
- [ ] Language detection correctly identifies English, Arabic, Hebrew, French, Spanish, Turkish
- [ ] Arabic articles render with correct RTL layout and typography
- [ ] React adapter produces valid JSX with CSS modules
- [ ] Vue adapter produces valid SFC with Composition API
- [ ] Svelte adapter produces valid .svelte component
- [ ] WordPress adapter produces valid PHP template
- [ ] HTML adapter (existing) continues to work as before
- [ ] Auto-config detects npm/yarn/pnpm, Next.js/Vue/Svelte, bash/PowerShell
- [ ] Detection failures fall back gracefully (never crash)
- [ ] All adapter outputs pass their respective framework linters
- [ ] Test suites: ≥10 language, ≥15 adapter, ≥8 auto-config tests

## Dependencies
- Blocked by: Phase 0 complete (security + tests + docs)
- Blocks: Phase 2 polish, content versioning
