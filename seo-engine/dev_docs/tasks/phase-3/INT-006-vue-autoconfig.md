# INT-006: Vue SFC Adapter & Auto-Config Enhancement

**Type:** CONFIG
**Effort:** L (11h)
**Priority:** P1
**Dependencies:** INT-004
**Sprint:** S12

## Description

Build native Vue 3 SFC adapter and enhance auto-config.js to detect more project context (router type, component library, blog patterns, TypeScript strictness, image strategy).

## Context Header

- `engine/framework-router.js` — output strategy for Vue
- `engine/auto-config.js` — existing detection to enhance
- `dev_docs/phase-3-plan.md` — Streams C3 + C8

## Acceptance Criteria

### Vue SFC Adapter
- [ ] New module `engine/adapters/vue-adapter.js` created
- [ ] Generates Vue 3 SFC with `<script setup lang="ts">`, `<template>`, `<style scoped>`
- [ ] Uses `defineProps` for article data
- [ ] Scoped CSS for component styles
- [ ] Table of contents as child component reference
- [ ] Image handling: standard `<img>` with lazy loading
- [ ] Supports both Nuxt 3 (`pages/`) and plain Vue Router (`views/`) output paths

### Auto-Config Enhancement
- [ ] Detects Next.js App Router vs Pages Router (`app/` dir vs `pages/` dir)
- [ ] Detects Nuxt 3 vs Nuxt 2 (`nuxt.config.ts` vs `nuxt.config.js`)
- [ ] Detects component library: shadcn/ui, Vuetify, Material UI, Chakra
- [ ] Detects existing blog/article patterns (scans for `blog/`, `articles/`, `posts/` directories)
- [ ] Detects TypeScript strictness from `tsconfig.json`
- [ ] Detects image strategy: next/image, lazy-img, standard
- [ ] New config output fields: `routerType`, `componentLibrary`, `existingBlogPattern`, `typescript`, `imageStrategy`
- [ ] Tests: Vue SFC output validation, auto-config detection for each new field
