# Nextiva — Project Conventions

## Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**, TypeScript
- **next-intl** — English only, `[locale]` dynamic segment, `localePrefix: 'never'`
- **GSAP 3.14** + **Framer Motion 11** for animations
- **React Compiler** enabled (`reactCompiler: true` — top-level in next.config.ts)

## Hard Rules

1. **No Tailwind, no CSS modules, no styled-components** — plain CSS with BEM only.
2. **BEM naming** for all CSS classes: `.block__element--modifier`.
3. **All visible text lives in `messages/en.json`** — never hardcode strings in JSX.
4. **Server components are `async`** and use `getTranslations()` from `next-intl/server`.
5. **Client components** have `'use client'` and use `useTranslations()` from `next-intl`.
6. **Desktop-first responsive** — only `max-width` breakpoints (1024px, 768px). Never `min-width`.
7. **Import alias** `@/` maps to `src/`.
8. **All images must be `.webp` format** — never PNG, JPG, or SVG for content images. Convert to WebP before saving to `public/assets/`. This applies to hero images, article images, screenshots, logos, and any generated images. WebP is mandatory for performance and file size.

## CSS Strategy

- `src/app/globals.css` contains **only `@import` statements** — no rules.
- `src/styles/tokens.css` — `:root` custom properties (design tokens).
- `src/styles/fonts.css` — Font-related `@font-face` or import rules.
- `src/styles/base.css` — Reset, layout utilities (`.container`), typography defaults.
- **One CSS file per component** in `src/styles/` (e.g., `navbar.css`, `hero.css`, `footer.css`).
- Each component CSS file is imported via `globals.css`.

### CSS Comment Convention

```css
/* ----------------------------------------------------------------
   Section Name
   ---------------------------------------------------------------- */
```

### Breakpoints (Desktop-First)

```css
/* Default — Desktop (no media query) */
@media (max-width: 1024px) { /* Tablets */ }
@media (max-width: 768px)  { /* Phones  */ }
```

## File Structure

```
src/
├── styles/
│   ├── fonts.css        ← Font imports
│   ├── tokens.css       ← :root CSS custom properties
│   └── base.css         ← Reset, layout utils, .container
├── app/
│   ├── globals.css      ← CSS import manifest (only @imports)
│   ├── layout.tsx       ← Root layout (imports globals.css, loads fonts)
│   └── [locale]/
│       ├── layout.tsx   ← NextIntlClientProvider, metadata
│       └── page.tsx     ← Homepage
├── components/
│   ├── sections/        ← Page sections (Hero, Footer, Navbar, etc.)
│   └── ui/              ← Reusable UI elements
├── i18n/
│   ├── routing.ts       ← defineRouting({ locales: ['en'], localePrefix: 'never' })
│   └── request.ts       ← getRequestConfig → loads messages/en.json
└── proxy.ts             ← createMiddleware(routing) — Next.js 16 uses proxy.ts
messages/
└── en.json              ← All i18n strings (nested namespaces)
public/assets/           ← Static assets (images, icons, etc.)
```

## Adding a New Component

1. Create the component in `src/components/sections/` or `src/components/ui/`.
2. Create a matching CSS file in `src/styles/` (e.g., `src/styles/pricing.css`).
3. Add `@import '../styles/pricing.css';` to `src/app/globals.css`.
4. Add all visible strings to `messages/en.json` under a new namespace.
5. Use `getTranslations('Namespace')` (server) or `useTranslations('Namespace')` (client).

## Animations

- **GSAP** — Use for scroll-triggered animations, complex timelines, and SVG morphing.
- **Framer Motion** — Use for component mount/unmount transitions and layout animations in client components.
- Always wrap GSAP usage in `useEffect` or `useLayoutEffect` inside client components.
- Use `gsap.context()` for cleanup.

## Article Generation (SEO Engine)

When asked to generate an article, blog post, or write about a topic, **always use the SEO engine** located at `/home/abdelhadi/Desktop/nextiva/seo-engine`.

The SEO engine is a ChainIQ Article Engine plugin with a 4-agent pipeline:
1. **Project Analyzer** — detects the project's framework, design tokens, and components
2. **Research Engine** — 6-round deep research via Gemini MCP
3. **Article Architect** — builds article architecture with component mapping
4. **Draft Writer** — produces the final article in the project's native format

### How to use

Invoke the `article-engine` skill from the SEO engine. The skill triggers on phrases like "generate an article", "write about", "blog about", "create content about", etc.

Alternatively, use the `/generate` command which collects the topic and language, then runs the full pipeline.

### What it handles automatically

- Detects this project's Next.js stack, design system, and components
- Researches the topic thoroughly before writing
- Generates images (via Gemini MCP)
- Produces publication-ready content with TOC, trust elements, and SEO structure
- Supports section-level editing after generation

### Key rule

**The topic determines the article domain. The website determines the presentation.** Never force a topic into the website's industry — the website is the publisher, not the subject.

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```
