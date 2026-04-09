# Mansati Project Status

**Last Updated:** 2026-04-09
**Current Branch:** main
**Build Status:** Passing

---

## Project Overview

Mansati is a tool review site targeting the MENA region. Built with Next.js 16 (App Router), React 19, plain CSS (BEM), and next-intl. The site publishes in-depth software reviews and comparison articles with affiliate monetization, social sharing, and SEO optimization via a custom 4-agent article generation engine.

---

## Current State

### Site Stats
| Metric | Count |
|--------|-------|
| Published articles | 9 |
| Total components | 50 (23 sections + 27 UI) |
| CSS files / lines | 43 / ~20,600 |
| TypeScript files / lines | 85 / ~11,000 |
| API routes | 4 (social posting, admin auth, affiliate redirects) |
| i18n namespaces | 82 |
| Affiliate partners | 10+ |
| Git commits | 94 |

### Published Articles
1. Best CRM Software (Saudi Arabia)
2. Best HR Software (Saudi Arabia)
3. Best POS Systems (Saudi Arabia)
4. Best Project Management Tools
5. Best Website Builders (Saudi Arabia)
6. Foodics Review (deep-dive)
7. Odoo ZATCA Compliance (deep-dive)
8. How to Build a Shopify Store (guide)
9. Shopify vs Salla (comparison)

### Key Integrations
- **PostHog** analytics (lazy-loaded via requestIdleCallback)
- **Twitter/X** and **LinkedIn** social posting APIs
- **Affiliate redirect system** with UTM tracking (`/out/[slug]`)
- **SEO engine** (seo-engine/) for article generation pipeline

---

## Recent Work

### 2026-04-09 — SEO & Performance Audit (5 Rounds)
- **R1 — Critical SEO:** Added og:image to Homepage and Blogs page. Added security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). Converted EditorsPick raw `<img>` to `next/image`.
- **R2 — Heading Hierarchy:** Fixed FeaturedStories h3→h2. Fixed all article h4→h3 for Pros/Cons/Key Takeaways (9 articles + CSS).
- **R3 — Internal Linking:** Fixed mismatched navbar mega menu links (items were pointing to wrong articles).
- **R4 — Performance:** Added CSS containment to hero. Added dns-prefetch for PostHog. Reduced hero backdrop-filter blur 12px→8px.
- **R5 — Cleanup:** Removed empty best-payment-gateways-saudi directory.

### 2026-04-09 — Vercel Deployment Performance Fix
- Added `generateStaticParams` + `setRequestLocale` to all 12 pages for static generation.
- Dynamic imports for HeroParticles, HeroAnimation, EditorsPick (code-split heavy JS).
- Compressed hero image 212KB→57KB (resized 4800px→1920px + recompressed).
- Deleted 2.5MB of unused hero background images (11 files).
- Added `sizes` prop to FeaturedStories images. Added `deviceSizes`/`imageSizes` to next.config.ts.
- Switched i18n request.ts to static import of en.json.

### 2026-04-09 — Rating Scale Standardization
- **Problem:** Articles had inconsistent rating scales — CRM, HR, PM used /10 while POS, Foodics, Odoo, Website Builders used /5. POS had a bar width bug (dividing by 10 with /5 scores).
- **Fix:** Converted all ratings to /5 scale across messages/en.json. Fixed bar width calculations in all 4 comparison article pages (/ 10 -> / 5). Updated s3Row table ratings for CRM (7 tools) and PM (10 tools).
- **Engine update:** Added RATING SCALE enforcement rule to draft-writer.md and article-architect.md so future generated articles always use /5.

### 2026-04-08/09 — Polish & Performance
- FAQ fixes
- Navigation fixes
- Image size adjustments
- Performance optimizations
- Color corrections
- Blog page improvements

### 2026-04-07 — Site Completion
- Marked "website done" — core pages, components, and styling complete

### 2026-04-06 — Article Pipeline
- CRM article completed
- ZATCA article added
- Plugin images and blog page fixes
- SEO engine updates

### 2026-04-05 — Bulk Content
- Three articles completed in one session

### 2026-04-03 — SEO Engine Integration
- Full pipeline integrated: article types, /out/ redirects, CTA placement, internal linking, image orchestration

---

## Active Tasks
- None currently assigned

## Known Issues
- No automated tests
- i18n supports English only (Arabic planned)
- Some commit messages have typos (cosmetic)

## Blocked
- Nothing currently blocked
