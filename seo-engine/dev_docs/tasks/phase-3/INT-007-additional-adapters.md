# INT-007: Svelte, Astro & WordPress Adapters

**Type:** CONFIG
**Effort:** XL (18h)
**Priority:** P2
**Dependencies:** INT-004
**Sprint:** S12

## Description

Build native adapters for Svelte (SvelteKit), Astro, and WordPress. Each generates framework-native output rather than wrapped HTML.

## Context Header

- `engine/framework-router.js` — output strategies
- `engine/adapters/next-adapter.js` — reference adapter pattern
- `dev_docs/phase-3-plan.md` — Streams C4, C5, C6

## Acceptance Criteria

### Svelte Adapter
- [ ] New module `engine/adapters/svelte-adapter.js` created
- [ ] Generates SvelteKit pages: `+page.svelte` + `+page.ts` load function
- [ ] Uses Svelte scoped CSS
- [ ] Proper slot-based layout integration

### Astro Adapter
- [ ] New module `engine/adapters/astro-adapter.js` created
- [ ] Generates `.astro` pages with frontmatter metadata
- [ ] Island architecture for interactive components (edit overlay)
- [ ] Scoped CSS in `<style>` block

### WordPress Adapter
- [ ] New module `engine/adapters/wordpress-adapter.js` created
- [ ] Generates PHP template with `get_header()`, `the_content()`, custom fields
- [ ] Uses WordPress functions for images, links, metadata
- [ ] Compatible with Yoast/RankMath SEO meta

### Shared
- [ ] All adapters follow the same interface as next-adapter: `generatePage(articleData, strategy)`
- [ ] Each adapter handles: hero image, sections, code blocks, lists, tables, FAQ schema
- [ ] Tests for each adapter: output structure, correct syntax, template substitution
