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

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```
