# Article Pipeline Service

> **Type:** Existing (extend)
> **Audit Score:** Architecture 5/10, UX 4/10
> **Priority:** P1 — extend with universality after Tier 1 fixes
> **Owner:** Solo developer
> **Files:** `skills/article-engine/SKILL.md`, `agents/*.md`, `config/*`

---

## 1. Overview

The Article Pipeline is ChainIQ's core — a 4-agent orchestration system that transforms a topic keyword into a publication-ready HTML article. The pipeline detects the target project's design system, researches the topic, architects the article structure, generates images, and assembles the final HTML with an inline edit UI.

**Current State:** Working end-to-end for English/HTML output. Single-language, single-format, requires manual project detection refinement.

**Target State:** Universal pipeline that generates articles in any language (including RTL), outputs to any framework (React, Vue, Svelte, WordPress, HTML), and auto-detects any tech stack without manual configuration.

---

## 2. Business Context

The article pipeline is ChainIQ's core IP and primary value proposition. It's the reason publishers pay $3K-$12K/month.

**Business rules:**
1. Articles must be domain-accurate — topic determines content domain, not the website's industry
2. Every article uses 4-6 images generated via Gemini MCP
3. Component selection follows 3 adaptation modes: EXISTING → REGISTRY → FALLBACK
4. Project detection must complete before any content generation begins
5. Research uses 6 rounds via Gemini MCP with domain integrity enforcement
6. Draft writer produces standalone HTML — no external dependencies in output
7. Edit UI is embedded inline — no separate app needed for section editing
8. Each article generation is a single-session operation (no persistence between runs)

---

## 3. Patterns in Use (Existing)

```
- Orchestration: SKILL.md 20-step pipeline (markdown-based, Claude Code native)
- Agents: 4 markdown agent definitions dispatched via Agent tool
- Research: Gemini MCP (primary) + WebSearch/WebFetch (fallback)
- Image gen: Gemini MCP with strategically varied prompts
- Component system: 193 blueprints in structural-component-registry.md
- Adaptation: 3 modes (EXISTING/REGISTRY/FALLBACK) based on project analysis
- Output: Standalone HTML with inline CSS + edit overlay JavaScript
- Config: engine-config.md (Gemini settings, design token defaults, adaptation rules)
```

---

## 4. Pipeline Steps

| Step | Agent/Action | Input | Output |
|------|-------------|-------|--------|
| 1-4 | Setup, auth, topic parsing | User command | Parsed topic + config |
| 5 | Project Analyzer | Target project directory | PROJECT INTELLIGENCE REPORT |
| 6 | Research Engine (round 1-3) | Topic + domain lock | Research findings |
| 7 | Research Engine (round 4-6) | Prior findings | Deep research + image prompts |
| 8 | Article Architect | Research + project intel | 5 concepts → 1 architecture |
| 9 | Image Generation | Image prompts from research | 4-6 images |
| 10 | Draft Writer | Architecture + research + images + project intel | Final HTML file |

---

## 5. Data Model

**No persistent data model** — the pipeline operates within a single Claude Code session.

**In-session state:**
- `PROJECT INTELLIGENCE REPORT` — shell type, components, design tokens, writing style
- `RESEARCH FINDINGS` — 6 rounds of domain research
- `ARTICLE ARCHITECTURE` — section map, component assignments, TOC, trust layer
- `IMAGE ASSETS` — 4-6 generated images (file paths)
- `FINAL HTML` — assembled article with edit UI

---

## 6. Universal Engine Extensions (New)

### 6a. Multi-Language Support (T2-11)
- Language detection from user topic or explicit flag
- Locale-aware research via Gemini MCP
- RTL text direction for Arabic/Hebrew content
- Font loading for non-Latin scripts

### 6b. RTL Layout Support (T2-12)
- CSS logical properties (`margin-inline-start` vs `margin-left`)
- `dir="rtl"` attribute on HTML container
- Bidirectional text handling for mixed LTR/RTL content
- Arabic typography (Naskh for body, Kufi for headings)

### 6c. Framework Adapter System (T2-13)
- **React adapter:** JSX components with CSS modules
- **Vue adapter:** Single File Components (.vue)
- **Svelte adapter:** Svelte components
- **WordPress adapter:** PHP template with wp_enqueue_style
- **HTML adapter:** Current standalone HTML (default)

Each adapter takes the same intermediate representation (section tree + component map + design tokens) and outputs idiomatic code for the target framework.

### 6d. Plugin Auto-Config (T2-14)
- Detect package manager (npm/yarn/pnpm/bun)
- Detect shell (bash/zsh/fish/PowerShell/cmd)
- Detect framework from package.json, config files, directory structure
- Detect CI/CD (GitHub Actions, GitLab CI, etc.)
- Detect deployment target (Vercel, Netlify, AWS, etc.)

### 6e. Enhanced Project Analyzer (T2-15)
- Extend detection beyond web projects (docs sites, mobile, desktop)
- Detect design system from actual component usage patterns
- Infer coding conventions from existing files

---

## 7. Content Versioning (T2-20)

- Store article version history in Supabase
- Each edit creates a new version with diff
- Rollback to any previous version
- Version metadata: timestamp, user, section edited, word count delta

---

## 8. Testing Strategy

| Suite | Priority | Scenarios |
|-------|----------|-----------|
| Project analyzer detection | P1 | React, Vue, Svelte, WordPress, plain HTML, unknown framework |
| Framework adapter output | P1 | JSX validity, SFC validity, HTML validity |
| Language detection | P1 | English, Arabic, Hebrew, mixed, unspecified |
| Component selection | P2 | EXISTING mode, REGISTRY mode, FALLBACK mode |
| Image prompt generation | P2 | 4-6 images, varied compositions, domain-appropriate |

---

## 9. Tasks (Enhance Path)

| ID | Task | Type | Effort | Tier |
|----|------|------|--------|------|
| T2-11 | Multi-language article generation | new | 2d | 2 |
| T2-12 | RTL layout support | new | 1d | 2 |
| T2-13 | Framework adapter system | new | 3d | 2 |
| T2-14 | Plugin auto-config | new | 1d | 2 |
| T2-15 | Enhanced project analyzer | new | 1d | 2 |
| T2-20 | Content versioning | new | 1d | 2 |
| T2-21 | Image lazy loading | fix | 1h | 2 |
| T2-22 | WebP image conversion | new | 3h | 2 |
| T3-05 | Edit progress indicator | gap | 4h | 3 |
| T3-06 | Edit overlay accessibility | gap | 4h | 3 |
| T3-07 | Decompose SKILL.md god file | fix | 1d | 3 |
| T3-08 | Extract edit UI template | fix | 4h | 3 |

---

## 10. Known Issues

1. **SKILL.md is 1421 lines** — god file that orchestrates everything; should be decomposed into modules (T3-07)
2. **10-minute edit black box** — no progress indicator during section edits (T3-05)
3. **No ARIA on edit overlay** — accessibility missing: no focus trap, no Escape handler, no live regions (T3-06)
4. **PNG-only images** — no WebP conversion, no lazy loading (T2-21, T2-22)
5. **English-only** — no multi-language support yet (T2-11)
