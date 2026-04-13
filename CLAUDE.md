# lkwjd — Project Conventions

## Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**, TypeScript
- **next-intl** — English only, `[locale]` dynamic segment, `localePrefix: 'never'`
- **GSAP 3.14** for animations (imported via shared module `src/lib/gsap.ts`)
- **React Compiler** enabled (`reactCompiler: true` — top-level in next.config.ts)
- **PostHog** — analytics (lazy-loaded via `requestIdleCallback`)
- **@next/bundle-analyzer** — run `ANALYZE=true npm run build` to inspect bundles

## Hard Rules

1. **No Tailwind, no CSS modules, no styled-components** — plain CSS with BEM only.
2. **BEM naming** for all CSS classes: `.block__element--modifier`.
3. **All visible text lives in `messages/en.json`** — never hardcode strings in JSX.
4. **Server components are `async`** and use `getTranslations()` from `next-intl/server`.
5. **Client components** have `'use client'` and use `useTranslations()` from `next-intl`.
6. **Desktop-first responsive** — only `max-width` breakpoints (1024px, 768px). Never `min-width`.
7. **Import alias** `@/` maps to `src/`.
8. **All images must be `.webp` format** — never PNG, JPG, or SVG for content images. Convert to WebP before saving to `public/assets/`. This applies to hero images, article images, screenshots, logos, and any generated images. WebP is mandatory for performance and file size.
9. **Use `next/image`** for all images — never use raw `<img>` tags. Use `fill` + `objectFit` for background-style images instead of CSS `backgroundImage`.
10. **No `hasRun` ref guards in GSAP effects** — they break under React StrictMode. Use `gsap.context()` for cleanup only; let effects re-run naturally on remount.

## Performance Architecture

### i18n Client Payload Filtering
- `NextIntlClientProvider` receives only client-component namespaces (~8KB), not the full `messages/en.json` (264KB).
- Client namespaces: `Navbar`, `HeroShowcase`, `LogoTrustBar`, `SplitShowcase`, `MoreImpact`, `NextPlatform`, `ProvenResults`, `EditorsPick`, `HowWeReview`, `Pricing`, `Footer`, `CookieConsent`, `Blogs`, `Error`.
- Server components use `getTranslations()` which loads what it needs server-side.
- **When adding a new client component** that uses `useTranslations('NewNamespace')`, add `'NewNamespace'` to the `CLIENT_NAMESPACES` array in `src/app/[locale]/layout.tsx`.

### CSS Code Splitting
- `globals.css` contains only **global CSS** (fonts, tokens, base, navbar, footer, call-to-action, cookie-consent, not-found, error, affiliate).
- **Page-specific CSS is imported in each page file** — Next.js App Router auto-splits CSS by route.
- Article pages import `article.css` + their specific article CSS file.
- Homepage imports all section CSS files (hero, featured-stories, split-showcase, etc.).

### Fonts & Icons
- **Space Grotesk**, **Geist Mono**, **Lora** — all loaded via `next/font/google` in root layout. No external CSS `@import`.
- **Remixicon** — self-hosted in `public/fonts/` (woff2 only). No CDN dependency.

### Static Assets Caching
- `/assets/*` and `/fonts/*` serve with `Cache-Control: public, max-age=31536000, immutable` (configured in `next.config.ts`).

## CSS Strategy

- `src/app/globals.css` contains **only `@import` statements** for global styles — no rules, no page-specific CSS.
- `src/styles/tokens.css` — `:root` custom properties (design tokens).
- `src/styles/fonts.css` — Reserved for additional `@font-face` rules (Lora is loaded via `next/font`).
- `src/styles/base.css` — Reset, layout utilities (`.container`), typography defaults.
- **One CSS file per component** in `src/styles/` (e.g., `navbar.css`, `hero.css`, `footer.css`).

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
├── lib/
│   └── gsap.ts            ← Shared GSAP + plugin registration (ScrollTrigger, ScrollToPlugin)
├── styles/
│   ├── fonts.css           ← Reserved for @font-face rules
│   ├── tokens.css          ← :root CSS custom properties
│   └── base.css            ← Reset, layout utils, .container
├── app/
│   ├── globals.css         ← Global CSS imports only (navbar, footer, etc.)
│   ├── layout.tsx          ← Root layout (next/font, self-hosted Remixicon)
│   └── [locale]/
│       ├── layout.tsx      ← NextIntlClientProvider (filtered), PostHog, CookieConsent
│       └── page.tsx        ← Homepage (imports page-specific CSS)
├── components/
│   ├── sections/           ← Page sections (Hero, Footer, Navbar, etc.)
│   ├── ui/                 ← Reusable UI elements
│   └── providers/          ← PostHogProvider (lazy-loaded)
├── config/
│   ├── site.ts             ← SITE_CONFIG (name, url, description)
│   └── affiliates.ts       ← Affiliate partner URLs
├── i18n/
│   ├── routing.ts          ← defineRouting({ locales: ['en'], localePrefix: 'never' })
│   └── request.ts          ← getRequestConfig → loads messages/en.json
└── proxy.ts                ← createMiddleware(routing) — Next.js 16 uses proxy.ts
messages/
└── en.json                 ← All i18n strings (nested namespaces, ~264KB)
public/
├── assets/                 ← Static images (all WebP)
└── fonts/                  ← Self-hosted Remixicon (woff2 + css)
```

## Adding a New Component

1. Create the component in `src/components/sections/` or `src/components/ui/`.
2. Create a matching CSS file in `src/styles/` (e.g., `src/styles/pricing.css`).
3. Import the CSS in the **page file** that uses it (e.g., `import "@/styles/pricing.css"` in `page.tsx`). Only add to `globals.css` if the component appears on every page.
4. Add all visible strings to `messages/en.json` under a new namespace.
5. Use `getTranslations('Namespace')` (server) or `useTranslations('Namespace')` (client).
6. If the component is a **client component** using `useTranslations()`, add the namespace to `CLIENT_NAMESPACES` in `src/app/[locale]/layout.tsx`.
7. Use `next/image` for all images with appropriate `sizes`, `loading`, and `quality` props.

## GSAP Animations

- **Import from `@/lib/gsap`** — never import `gsap` directly or register plugins in components.
- Always wrap GSAP usage in `useEffect` inside client components.
- Use `gsap.context()` for cleanup: `return () => ctx.revert()`.
- **Never use `hasRun` ref guards** — they break under React StrictMode because `ctx.revert()` undoes animations but the guard prevents re-running them on remount.
- For count-up animations that modify `textContent`, preserve original values in `data-original` attributes so they survive StrictMode cleanup.
- Use `ScrollTrigger` with `once: true` for scroll-triggered entrance animations.

## Particle Animations

- Both `HeroParticles` and `DustParticles` respect `prefers-reduced-motion` — they skip entirely if set.
- Max concurrent particles capped at 25.
- Spawn intervals: HeroParticles 800ms, DustParticles 700ms.
- Visibility controlled by `IntersectionObserver` — particles stop when off-screen.

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
ANALYZE=true npm run build  # Bundle analysis
```
