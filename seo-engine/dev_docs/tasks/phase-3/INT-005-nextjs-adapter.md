# INT-005: Next.js Native Adapter

**Type:** CONFIG
**Effort:** L (8h)
**Priority:** P0
**Dependencies:** INT-004
**Sprint:** S12

## Description

Build a native Next.js App Router adapter that generates actual `.tsx` pages with `next/image`, `next/link`, metadata exports, and server/client component separation — not HTML wrapped in JSX.

## Context Header

- `engine/framework-router.js` — output strategy for Next.js
- `agents/draft-writer.md` — framework-aware draft writer
- `engine/auto-config.js` — Next.js detection
- `dev_docs/phase-3-plan.md` — Stream C2

## Acceptance Criteria

- [ ] New module `engine/adapters/next-adapter.js` created
- [ ] Generates App Router page structure: `app/articles/[slug]/page.tsx` + optional `layout.tsx`
- [ ] Uses `next/image` with width/height/alt (not raw `<img>`)
- [ ] Uses `next/link` for internal links (not `<a>`)
- [ ] Exports `metadata` object for SEO (title, description, openGraph)
- [ ] Content rendered as server component (no `'use client'` on main page)
- [ ] Edit overlay loaded as separate client component with `'use client'` directive
- [ ] CSS via Tailwind classes (if detected in project) or CSS Modules fallback
- [ ] Table of contents component uses project's existing design system (shadcn/ui if present)
- [ ] `generateStaticParams` export for static generation support
- [ ] Template handles: hero image, sections with headings, code blocks, lists, tables, embedded images, FAQ schema
- [ ] Tests: output structure validation, correct imports, metadata generation, image component usage
