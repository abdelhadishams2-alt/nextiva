# Universal Engine Service

> **Type:** New (gaps #2, #3, #7)
> **Priority:** P1 — Tier 2 (Week 3-6), Stream B (independent of Dashboard)
> **Owner:** Solo developer
> **Dependencies:** Article Pipeline (existing)

---

## 1. Overview

The Universal Engine makes ChainIQ work with any project, any language, and any framework. It consists of three subsystems: multi-language support (including RTL), framework adapters (output to React/Vue/Svelte/WordPress/HTML), and auto-config (detect the target project's entire stack without manual setup).

**Design decision:** The Universal Engine is not a separate server — it's a set of modules that plug into the existing article pipeline agents. The project analyzer agent gets enhanced detection, the draft writer agent gets framework adapters, and a new language module handles i18n/RTL.

---

## 2. Business Context

Universality is ChainIQ's key differentiator. Competitors generate articles for one stack or one language. ChainIQ adapts to whatever the user already has.

**Business rules:**
1. Language detection must work from topic text OR explicit user flag — never assume English
2. RTL support is not optional for Arabic/Hebrew — it's core functionality for MENA market
3. Framework adapters must produce idiomatic code — not "React-flavored HTML"
4. Auto-config must never require user input for standard setups — zero-config is the promise
5. If detection fails, fall back gracefully: unknown framework → HTML, unknown language → English
6. Adaptation mode selection (EXISTING/REGISTRY/FALLBACK) applies per-framework, not globally
7. Output must include all necessary imports/dependencies for the target framework
8. Generated code must pass the target framework's linter with zero errors

---

## 3. Multi-Language Subsystem

### Language Detection
```
Input: topic keyword or phrase
  ↓
Step 1: Detect script (Latin, Arabic, Hebrew, CJK, Cyrillic, Devanagari)
Step 2: Detect language from script + word patterns
Step 3: Set locale for research (Gemini MCP language param)
Step 4: Set text direction (LTR or RTL)
Step 5: Select appropriate fonts (Naskh/Kufi for Arabic, system fonts for others)
  ↓
Output: { language: 'ar', direction: 'rtl', fonts: [...], locale: 'ar-SA' }
```

### Supported Languages (Phase 1)
| Language | Script | Direction | Font Stack |
|----------|--------|-----------|------------|
| English | Latin | LTR | System (default) |
| Arabic | Arabic | RTL | Noto Naskh Arabic (body), Noto Kufi Arabic (headings) |
| Hebrew | Hebrew | RTL | System Hebrew |
| French | Latin | LTR | System (default) |
| Spanish | Latin | LTR | System (default) |
| Turkish | Latin | LTR | System (default) |

### RTL CSS Strategy
```css
/* Use CSS logical properties throughout */
.article-section {
    margin-inline-start: 2rem;    /* Not margin-left */
    padding-inline-end: 1rem;     /* Not padding-right */
    text-align: start;            /* Not text-align: left */
}

/* Container-level direction */
.article-container {
    direction: rtl;               /* Set once at container level */
    unicode-bidi: embed;
}

/* Bidirectional content (e.g., code blocks in RTL article) */
.code-block {
    direction: ltr;               /* Code is always LTR */
    unicode-bidi: isolate;
}
```

---

## 4. Framework Adapter System

### Architecture
```
Intermediate Representation (IR)
├── Section tree (ordered list of sections with content)
├── Component map (section → component blueprint)
├── Design tokens (colors, fonts, spacing)
├── Image assets (paths + alt text)
└── Metadata (title, TOC, trust layer)
    ↓
Framework Adapter (selected based on detection)
    ↓
Target Output (idiomatic code for chosen framework)
```

### Adapters

#### HTML Adapter (default, existing)
- Standalone HTML file with inline `<style>` and `<script>`
- Edit UI overlay embedded
- No build step required
- Current behavior — no changes needed

#### React Adapter (new)
- JSX component file (`.jsx` or `.tsx`)
- CSS Modules for styling (`.module.css`)
- Imports for images via relative paths
- Edit UI as a React component with `useState`/`useEffect`
- Compatible with Next.js, Vite, CRA

#### Vue Adapter (new)
- Single File Component (`.vue`)
- `<template>`, `<script setup>`, `<style scoped>`
- Composition API (not Options API)
- Compatible with Nuxt, Vite

#### Svelte Adapter (new)
- Svelte component (`.svelte`)
- `<script>`, markup, `<style>`
- Reactive declarations with `$:`
- Compatible with SvelteKit, Vite

#### WordPress Adapter (new)
- PHP template file
- `wp_enqueue_style()` for CSS
- `wp_enqueue_script()` for edit UI JS
- Compatible with classic themes and block themes
- Follows WordPress coding standards

---

## 5. Auto-Config Subsystem

### Detection Matrix

| What | How | Fallback |
|------|-----|----------|
| Package manager | Check for `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `bun.lockb` | npm |
| Framework | Parse `package.json` dependencies, check config files (`next.config.*`, `nuxt.config.*`, `svelte.config.*`, `vite.config.*`) | HTML (no framework) |
| Shell | Check `$SHELL` env var, detect PowerShell via `$PSVersionTable` | bash |
| CSS framework | Check for Tailwind config, styled-components, CSS modules usage | Inline CSS |
| CI/CD | Check `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile` | None |
| Deploy target | Check `vercel.json`, `netlify.toml`, `Dockerfile`, `fly.toml` | None |
| TypeScript | Check `tsconfig.json`, `.ts`/`.tsx` files | JavaScript |
| Monorepo | Check for `turbo.json`, `lerna.json`, `pnpm-workspace.yaml` | Single package |

### Detection Flow
```
Target project directory
  ↓
Step 1: Read directory listing (top-level files)
Step 2: Check lock files → package manager
Step 3: Read package.json → framework + TypeScript + dependencies
Step 4: Check config files → framework version + plugins
Step 5: Check CI/CD files → deployment strategy
Step 6: Detect shell environment
  ↓
Output: PROJECT_CONFIG {
    packageManager: 'pnpm',
    framework: 'next',
    frameworkVersion: '16.2',
    language: 'typescript',
    cssFramework: 'tailwind',
    shell: 'zsh',
    cicd: 'github-actions',
    deployTarget: 'vercel',
    monorepo: false
}
```

---

## 6. Error Handling

| Code | Error | Trigger | Recovery |
|------|-------|---------|----------|
| UNI_LANG_001 | Language detection failed | Ambiguous script/text | Fall back to English |
| UNI_LANG_002 | Unsupported language | Language not in Phase 1 list | Fall back to English |
| UNI_FW_001 | Framework detection failed | No recognizable config files | Fall back to HTML adapter |
| UNI_FW_002 | Adapter generation failed | Framework-specific output error | Fall back to HTML adapter |
| UNI_CFG_001 | Auto-config failed | Cannot read project directory | Prompt user for manual config |
| UNI_RTL_001 | RTL rendering issue | Mixed direction content | Isolate with `unicode-bidi` |

---

## 7. Testing Strategy

| Suite | Priority | Scenarios |
|-------|----------|-----------|
| Language detection | P1 | English, Arabic, Hebrew, French, mixed, empty, unknown |
| RTL CSS generation | P1 | Pure RTL, mixed LTR/RTL, code blocks in RTL, nested directions |
| React adapter | P1 | Valid JSX output, CSS modules, image imports, edit UI component |
| Vue adapter | P1 | Valid SFC, Composition API, scoped styles |
| Svelte adapter | P2 | Valid component, reactive declarations |
| WordPress adapter | P2 | Valid PHP, wp_enqueue calls, coding standards |
| Auto-config detection | P1 | npm, yarn, pnpm, Next.js, Vue, Svelte, WordPress, unknown |
| Fallback chain | P1 | Every detection failure triggers correct fallback |

---

## 8. Tasks

| ID | Task | Type | Effort | Tier |
|----|------|------|--------|------|
| T2-11 | Multi-language article generation | new | 2d | 2 |
| T2-12 | RTL layout support | new | 1d | 2 |
| T2-13 | Framework adapter system (5 adapters) | new | 3d | 2 |
| T2-14 | Plugin auto-config detection | new | 1d | 2 |
| T2-15 | Enhanced project analyzer | new | 1d | 2 |
