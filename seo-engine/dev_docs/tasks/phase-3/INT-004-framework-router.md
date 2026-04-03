# INT-004: Framework Router & Draft Writer Integration

**Type:** CONFIG
**Effort:** L (6h)
**Priority:** P0
**Dependencies:** None
**Sprint:** S12

## Description

Build the framework router that maps detected project frameworks to native output strategies. Integrate with the draft-writer agent so articles are generated in the correct format for the target project.

## Context Header

- `engine/auto-config.js` — existing framework detection
- `agents/draft-writer.md` — agent to modify for framework-aware output
- `skills/article-engine/SKILL.md` — Step 17 dispatch logic
- `dev_docs/phase-3-plan.md` — Streams C1 + C7

## Acceptance Criteria

- [ ] New module `engine/framework-router.js` created
- [ ] `OUTPUT_STRATEGIES` object maps 6 frameworks: next, vue, svelte, astro, wordpress, html (default)
- [ ] Each strategy defines: fileExtension, outputPath, wrapper, imports, cssStrategy, imageComponent, features
- [ ] `getOutputStrategy(framework)` returns the strategy object for a given framework
- [ ] `resolveOutputPath(strategy, slug)` returns concrete file path with slug substituted
- [ ] `draft-writer.md` updated: accepts `PROJECT_CONFIG.framework` input, calls framework router, generates content using framework-specific templates
- [ ] SKILL.md Step 17 updated: reads `PROJECT_CONFIG.adapterFramework` (from auto-config + user prefs), dispatches draft-writer with correct framework adapter instructions
- [ ] HTML adapter remains the default — existing behavior unchanged when no framework detected
- [ ] Edit overlay: client component for Next.js (`'use client'`), vanilla JS for HTML
- [ ] Tests: strategy resolution for each framework, output path generation, fallback to HTML
