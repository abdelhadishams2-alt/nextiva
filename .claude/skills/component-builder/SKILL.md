---
name: component-builder
description: >
  Use when the user provides a component/section name and a path to reference CSS/HTML files
  from the main website, and wants to build that section as a new component in the Next.js project.
  Trigger when the user says "build this section", "create this component", "add this section",
  or provides a path like "src/css-htmlmain website/SectionName" with intent to recreate it.
  The user gives: skill name + path to reference code. You produce: a fully wired component.
---

# Component Builder

Automated workflow to build a new Next.js component from reference CSS/HTML files extracted from the main Nextiva website.

## Inputs

The user provides:
1. **Section/component name** — e.g. "Scale Without Limits", "FeatureCards"
2. **Path to reference files** — e.g. `/home/abdelhadi/Desktop/nextiva/src/css-htmlmain website/Scale-Without-Limits/`

The reference directory contains:
- An HTML file with the section markup from the main website
- A CSS file with the original styles

## Workflow

Execute these steps strictly in order. Mark each as done before moving on.

### Step 1: Read & Analyze Reference Files

1. List the reference directory to find HTML and CSS files
2. Read the HTML file — identify:
   - Section structure and nesting
   - All visible text (for i18n extraction)
   - Image URLs that need downloading
   - Interactive/animated elements (particles, rings, counters, etc.)
   - Whether the component needs client-side JS (`'use client'`)
3. Read the CSS file — identify:
   - Layout (grid, flexbox, widths)
   - Key visual properties (colors, gradients, borders, border-radius, shadows)
   - Animations (`@keyframes`, transitions, `animation-*` properties)
   - Responsive breakpoints
   - Any `backdrop-filter`, `will-change`, or GPU-heavy properties

### Step 2: Download Assets

1. Extract all image URLs from the HTML (both `src` attributes and `background-image` in inline styles)
2. Download each image to `public/assets/` using `curl`
3. Use descriptive filenames: `feature-card-desert.webp`, `portrait-woman.webp`, etc.
4. Verify downloads succeeded with `ls -la`

### Step 3: Add i18n Strings

1. Read `messages/en.json` to find the insertion point (before `"Footer"`)
2. Create a new namespace matching the component name (PascalCase, e.g. `"FeatureCards"`)
3. Extract ALL visible text from the HTML into nested keys:
   - Labels, titles, descriptions, button text, stats, etc.
   - Use meaningful key names: `card1.title`, `card1.desc`, `stat.callsHandled`
4. Edit `messages/en.json` to add the new namespace

### Step 4: Create the Component

**Decide component type:**
- **Server component** (default) — static content, no JS interactivity
  - Use `async` function, `getTranslations()` from `next-intl/server`
- **Client component** — needs browser APIs, animations, interactivity
  - Add `'use client'`, use `useTranslations()` from `next-intl`
- **Hybrid** — server wrapper with client sub-components
  - Main section is server, interactive parts are separate client components in `src/components/ui/`

**Create files:**

1. Main component in `src/components/sections/ComponentName.tsx`
2. Sub-components (if needed) in `src/components/ui/SubName.tsx`

**Component conventions (from CLAUDE.md):**
- Use `@/` import alias
- Reference images as `/assets/filename.ext`
- All text via translation functions — never hardcoded
- CSS classes use BEM: `.block__element--modifier`

### Step 5: Create the CSS File

1. Create `src/styles/component-name.css` (kebab-case)
2. Convert the reference CSS to BEM naming under the project's conventions:
   - Strip vendor prefixes (`.design-v2 .section-tabbed-trust-showcase` → `.feature-cards`)
   - Use BEM: `.feature-cards__card`, `.feature-cards__title--active`
   - Keep the exact visual values (colors, sizes, spacing, gradients, shadows)
3. Structure the CSS file with section comments:
   ```css
   /* ----------------------------------------------------------------
      Section Name
      ---------------------------------------------------------------- */
   ```
4. Add responsive breakpoints (desktop-first, `max-width` only):
   ```css
   @media (max-width: 1024px) { /* Tablets */ }
   @media (max-width: 768px)  { /* Phones  */ }
   ```
5. For animations, include `@keyframes` in the same CSS file
6. Add performance hints where needed:
   - `contain: strict` on particle/animation containers
   - `will-change` sparingly (only on actively animated elements)

### Step 6: Wire It Up

1. Add `@import '../styles/component-name.css';` to `src/app/globals.css`
   - Insert in logical order (after existing sections, before footer)
2. Import and add the component to `src/app/[locale]/page.tsx`
   - Place it in the correct position in the page flow

### Step 7: Verify with Playwright

**Round 1 — Local screenshot:**
1. Navigate to `http://localhost:3000` (dev server must be running)
2. Scroll to the new section using `browser_evaluate`:
   ```js
   document.querySelector('.component-class')?.scrollIntoView({ behavior: 'instant' });
   ```
3. Take a screenshot of the viewport

**Round 2 — Compare with main website:**
1. Navigate to `https://www.nextiva.com/`
2. Scroll to the same section
3. Take a screenshot
4. Compare the two screenshots visually

**Round 3 — Fix differences:**
If there are visual differences:
1. Identify what's wrong (spacing, colors, sizes, animations)
2. Fix the CSS or component
3. Re-screenshot and compare again
4. Repeat until they match

**Show both screenshots to the user and ask for confirmation.**

## Animation Patterns

Common animations found on the main site and how to recreate them:

| Pattern | Implementation |
|---------|---------------|
| **Dust/ember particles** | Client component with `setInterval` + Web Animations API. IntersectionObserver to start/stop. Random positions, warm color palette, drift animation. |
| **Eye radiate rings** | 5 `<span>` elements with CSS `@keyframes` scaling from 0.5 to 10, staggered `animation-delay` (1.6s apart), 8s infinite cycle. |
| **Number counter** | Client component with `useEffect` + `requestAnimationFrame`. Count from 0 to target over ~2s with easing. IntersectionObserver trigger. |
| **Scroll reveal** | CSS `opacity: 0; transform: translateY(30px)` default state. IntersectionObserver adds class that triggers CSS transition. |
| **Parallax** | GSAP ScrollTrigger with `scrub: true` on background element. |
| **Hover lift** | CSS `transition: transform 0.3s ease; &:hover { transform: translateY(-4px) }` |

## Performance Rules

1. **Particles**: Use `contain: strict` on container, spawn via DOM API (not React state), clean up on unmount and when off-screen
2. **backdrop-filter**: Use sparingly — causes compositing lag during scroll. Pre-promote layers with `will-change: transform`
3. **Infinite animations**: Pause when section is off-screen via IntersectionObserver
4. **Images**: Download as webp, use appropriate sizes (not oversized)
5. **Client components**: Keep `'use client'` boundary as small as possible — wrap only the interactive parts

## Checklist Before Done

- [ ] Reference files read and understood
- [ ] Images downloaded to `public/assets/`
- [ ] i18n strings added to `messages/en.json`
- [ ] Component created in `src/components/sections/`
- [ ] Sub-components (if any) in `src/components/ui/`
- [ ] CSS file created in `src/styles/` with BEM naming
- [ ] CSS imported in `globals.css`
- [ ] Component added to `page.tsx`
- [ ] Playwright screenshot matches main website
- [ ] Responsive breakpoints work (1024px, 768px)
- [ ] Animations play correctly
- [ ] No performance issues (particles pause off-screen, no unnecessary re-renders)
