# Step 28 — Technical SEO Checklist

> **Status:** Planning
> **Scope:** chainiq.io marketing site + dashboard
> **Standard:** Google Core Web Vitals compliant, WCAG 2.1 AA
> **Audit frequency:** Monthly automated + quarterly manual

---

## 1. Performance (Core Web Vitals)

### Largest Contentful Paint (LCP) — Target: < 2.5 seconds

| Check | Status | Notes |
|-------|--------|-------|
| Server response time (TTFB) < 800ms | [ ] | Hetzner EU + CDN should achieve <200ms for MENA |
| Hero image optimized (WebP/AVIF, lazy-load below fold) | [ ] | Use Next.js Image component with priority for above-fold |
| Critical CSS inlined | [ ] | Next.js handles automatically with CSS modules |
| Font loading optimized (font-display: swap) | [ ] | Arabic fonts (Noto Sans Arabic, Cairo) preloaded |
| No render-blocking JavaScript in head | [ ] | Defer all non-critical JS |
| CDN configured for static assets | [ ] | Cloudflare or Vercel Edge |
| SSR pages render complete HTML | [ ] | Verify with `curl` — no empty body waiting for JS |
| Third-party scripts loaded asynchronously | [ ] | Analytics, chat widgets load after LCP |

### First Input Delay (FID) / Interaction to Next Paint (INP) — Target: < 200ms

| Check | Status | Notes |
|-------|--------|-------|
| No long JavaScript tasks (>50ms) on page load | [ ] | Profile with Chrome DevTools Performance tab |
| Event handlers are lightweight | [ ] | Debounce scroll/resize handlers |
| Heavy computations moved to Web Workers | [ ] | If any client-side content processing exists |
| Third-party scripts don't block main thread | [ ] | Load via async/defer or after interaction |
| Input handlers respond within 1 frame (16ms) | [ ] | Especially for Arabic text input fields |

### Cumulative Layout Shift (CLS) — Target: < 0.1

| Check | Status | Notes |
|-------|--------|-------|
| All images have explicit width and height | [ ] | Use Next.js Image component (enforces dimensions) |
| Fonts don't cause layout shift on load | [ ] | Use font-display: optional or size-adjust |
| No dynamically injected content above fold | [ ] | Banners, promos use reserved space |
| Ads (if any) have reserved space | [ ] | N/A for SaaS — no display ads |
| Embeds (video, social) have aspect-ratio containers | [ ] | CSS aspect-ratio property |
| No late-loading CSS that repositions elements | [ ] | Critical CSS inline, rest in <link> |

---

## 2. Mobile Responsiveness

| Check | Status | Notes |
|-------|--------|-------|
| Viewport meta tag present | [ ] | `<meta name="viewport" content="width=device-width, initial-scale=1">` |
| Touch targets minimum 48x48px | [ ] | Especially important for Arabic UI (larger text) |
| No horizontal scrolling on any breakpoint | [ ] | Test at 320px, 375px, 414px, 768px, 1024px |
| Text readable without zooming (16px+ base) | [ ] | Arabic text may need 18px+ for readability |
| Forms usable on mobile | [ ] | Input types correct (email, tel, etc.), labels visible |
| Navigation accessible on mobile | [ ] | Hamburger menu or bottom nav, easy to reach with thumb |
| RTL layout tested on mobile | [ ] | Arabic pages must mirror layout correctly on small screens |
| Images scale appropriately | [ ] | srcset with multiple sizes |
| Modals and popovers work on mobile | [ ] | Don't overflow viewport |
| Mobile-first CSS approach | [ ] | Base styles = mobile, media queries add desktop |

---

## 3. Heading Hierarchy

| Check | Status | Notes |
|-------|--------|-------|
| One `<h1>` per page | [ ] | Contains primary keyword for that page |
| Headings follow sequential order (h1 > h2 > h3) | [ ] | No skipping levels (h1 to h3 without h2) |
| Headings are semantic, not just styled | [ ] | Don't use `<h3>` for small text styling |
| Arabic pages have Arabic headings (not translated HTML) | [ ] | Native Arabic copy, not machine translation |
| Blog posts use proper heading hierarchy | [ ] | CMS enforces structure |
| Dashboard pages don't use h1 (they're app, not content) | [ ] | Dashboard uses aria-labels instead |

---

## 4. Canonical URLs

| Check | Status | Notes |
|-------|--------|-------|
| Every page has a `<link rel="canonical">` tag | [ ] | Points to preferred URL |
| Canonical URL uses HTTPS | [ ] | Never http:// |
| Canonical URL uses preferred domain (www vs non-www) | [ ] | Choose one, redirect the other |
| Trailing slash consistency | [ ] | Pick with or without, be consistent |
| Pagination pages use correct canonicals | [ ] | Blog listing: each page canonical to itself |
| Query parameters don't create duplicate canonicals | [ ] | `?ref=`, `?utm_` params excluded from canonical |
| Arabic pages canonical to themselves (not to English) | [ ] | `/ar/features/` canonical is `/ar/features/`, not `/features/` |
| No conflicting canonical and noindex | [ ] | If noindex, remove canonical |

---

## 5. Open Graph + Twitter Card Meta Tags

### Open Graph (Facebook, LinkedIn, WhatsApp)

| Tag | Template | Notes |
|-----|----------|-------|
| `og:title` | Page title (60 chars max) | Different from `<title>` if needed for social |
| `og:description` | 155 chars, compelling summary | Include value prop |
| `og:image` | 1200x630px, branded image | Each page type has template; Arabic pages use Arabic text on image |
| `og:image:alt` | Descriptive alt text | Accessibility requirement |
| `og:url` | Canonical URL | Must match canonical |
| `og:type` | `website` (homepage), `article` (blog) | Correct type per page |
| `og:locale` | `en_US` or `ar_SA` | Match page language |
| `og:site_name` | `ChainIQ` | Consistent across all pages |

### Twitter Card

| Tag | Template | Notes |
|-----|----------|-------|
| `twitter:card` | `summary_large_image` | For all pages |
| `twitter:site` | `@chainiq` | Company account |
| `twitter:title` | Same as og:title | Can differ if needed |
| `twitter:description` | Same as og:description | Can differ if needed |
| `twitter:image` | Same as og:image | Must be absolute URL |

### Implementation Checklist

| Check | Status | Notes |
|-------|--------|-------|
| All public pages have OG tags | [ ] | Verify with Facebook Sharing Debugger |
| All public pages have Twitter Cards | [ ] | Verify with Twitter Card Validator |
| OG images are unique per page (not all using homepage image) | [ ] | Create templates for: homepage, feature, blog, case study |
| Arabic pages have Arabic OG images | [ ] | Arabic text rendered on social share images |
| OG images load fast (<1MB) | [ ] | Compressed PNG or JPEG |
| Dynamic OG images for blog posts | [ ] | Consider `@vercel/og` or custom generation |

---

## 6. Structured Data

| Schema Type | Pages | Status | Notes |
|-------------|-------|--------|-------|
| `Organization` | Homepage, about | [ ] | Company info, logo, social links |
| `SoftwareApplication` | Homepage, features, pricing | [ ] | Product details, pricing, ratings |
| `FAQPage` | Pricing, feature pages | [ ] | Common questions per section |
| `HowTo` | Tutorial blog posts | [ ] | Step-by-step workflow guides |
| `Article` | Blog posts | [ ] | Author, datePublished, dateModified |
| `BreadcrumbList` | All pages except homepage | [ ] | Navigational breadcrumbs |
| `WebSite` | Homepage | [ ] | Site-level search action |
| `Review` / `AggregateRating` | Homepage, pricing | [ ] | Only after real reviews exist |

### Validation

| Check | Status | Notes |
|-------|--------|-------|
| All structured data validates in Google Rich Results Test | [ ] | Test every page template |
| No warnings in Google Search Console structured data report | [ ] | Monitor weekly |
| JSON-LD format used (not Microdata or RDFa) | [ ] | JSON-LD is Google's preference |
| Structured data matches visible page content | [ ] | No hidden or misleading schema |

---

## 7. XML Sitemap

| Check | Status | Notes |
|-------|--------|-------|
| Sitemap exists at `/sitemap.xml` | [ ] | Auto-generated by Next.js |
| Sitemap index links to sub-sitemaps (pages, blog, Arabic) | [ ] | If >1000 URLs, split into sub-sitemaps |
| All indexable pages included | [ ] | No noindex pages in sitemap |
| No non-200 URLs in sitemap | [ ] | Remove 301s, 404s, 410s |
| `<lastmod>` accurate for each URL | [ ] | Based on actual content update date |
| Sitemap submitted to Google Search Console | [ ] | Verify acceptance |
| Sitemap submitted to Bing Webmaster Tools | [ ] | Secondary but free |
| Arabic pages included with hreflang annotations | [ ] | xhtml:link alternates in sitemap |
| Sitemap updates automatically on content publish | [ ] | Next.js build or on-demand revalidation |
| Sitemap size < 50MB and < 50,000 URLs per file | [ ] | Google limits |

---

## 8. robots.txt

| Check | Status | Notes |
|-------|--------|-------|
| `robots.txt` accessible at root | [ ] | `https://chainiq.io/robots.txt` |
| Dashboard/app routes disallowed | [ ] | `/dashboard/`, `/api/`, `/admin/` |
| Auth routes disallowed | [ ] | `/login/`, `/signup/`, `/reset-password/` |
| Sitemap URL referenced | [ ] | `Sitemap: https://chainiq.io/sitemap.xml` |
| No accidental `Disallow: /` blocking entire site | [ ] | Common mistake — verify carefully |
| Crawl-delay not set (unnecessary for modern bots) | [ ] | Googlebot ignores it anyway |
| AI bot directives (optional) | [ ] | Consider `User-agent: GPTBot` rules |

---

## 9. Redirects

| Check | Status | Notes |
|-------|--------|-------|
| 301 redirect plan for any URL changes | [ ] | Document in redirect map spreadsheet |
| Old URLs redirect to new equivalents (not homepage) | [ ] | Preserve link equity |
| No redirect chains (A -> B -> C) | [ ] | Maximum 1 hop |
| No redirect loops | [ ] | Test with curl -L |
| HTTP to HTTPS redirect (301) | [ ] | Server-level redirect |
| Non-www to www redirect (or vice versa) — pick one | [ ] | Consistent with canonical |
| Trailing slash redirect (pick one pattern) | [ ] | Consistent with canonical |
| Old blog URL format redirects (if migrating) | [ ] | Map all old slugs to new |

---

## 10. SSL / Security

| Check | Status | Notes |
|-------|--------|-------|
| SSL certificate valid and not expiring soon | [ ] | Auto-renew via Let's Encrypt or Vercel |
| All pages served over HTTPS | [ ] | No HTTP-only pages |
| No mixed content (HTTP resources on HTTPS page) | [ ] | Check with browser DevTools (Console warnings) |
| HSTS header enabled | [ ] | `Strict-Transport-Security: max-age=31536000` |
| Security headers present | [ ] | X-Content-Type-Options, X-Frame-Options, CSP |
| API endpoints use HTTPS | [ ] | No insecure API calls from marketing site |
| Forms submit over HTTPS | [ ] | Contact form, signup form |
| Third-party scripts loaded over HTTPS | [ ] | Analytics, fonts, CDN assets |

---

## 11. Additional Technical Checks

### Crawlability

| Check | Status | Notes |
|-------|--------|-------|
| No orphan pages (pages with no internal links) | [ ] | Screaming Frog audit |
| No broken internal links (404s) | [ ] | Monthly Screaming Frog crawl |
| No broken external links | [ ] | Quarterly check |
| JavaScript-rendered content accessible to Googlebot | [ ] | Use Google Search Console URL Inspection |
| Pagination implemented correctly (rel=next/prev or load-more) | [ ] | Blog listing pages |
| Infinite scroll has crawlable paginated alternative | [ ] | If applicable |
| Login-gated content not indexed | [ ] | Dashboard behind auth, not in sitemap |

### Internationalization (Arabic-Specific)

| Check | Status | Notes |
|-------|--------|-------|
| hreflang tags on all bilingual pages | [ ] | EN <-> AR bidirectional |
| `x-default` hreflang set | [ ] | Points to English version |
| Arabic pages have `dir="rtl"` and `lang="ar"` | [ ] | On `<html>` element |
| Arabic meta descriptions are native (not translated) | [ ] | Written by Arabic speaker |
| Arabic URLs are clean and readable | [ ] | Transliterated or Arabic script slugs |
| Arabic content renders correctly in search results | [ ] | Test with Google Search Console |
| No language detection auto-redirect (let Google handle it) | [ ] | Users can manually switch; no forced redirect |

### Image Optimization

| Check | Status | Notes |
|-------|--------|-------|
| All images have descriptive alt text | [ ] | Arabic alt text on Arabic pages |
| Images served in modern formats (WebP/AVIF) | [ ] | Next.js Image component handles this |
| Images are appropriately sized (no serving 4000px for 400px slot) | [ ] | Use srcset with multiple sizes |
| Lazy loading for below-fold images | [ ] | `loading="lazy"` or Next.js default |
| Image file names are descriptive | [ ] | `arabic-content-pipeline.webp` not `IMG_001.webp` |

---

## 12. Monitoring and Audit Schedule

| Activity | Frequency | Tool |
|----------|-----------|------|
| Core Web Vitals check | Weekly | Google Search Console |
| Broken link scan | Monthly | Screaming Frog (free) |
| Structured data validation | Monthly | Google Rich Results Test |
| Mobile usability check | Monthly | Google Search Console |
| Full site crawl | Quarterly | Screaming Frog |
| Competitor technical SEO comparison | Quarterly | Ahrefs Site Audit |
| Security header check | Quarterly | SecurityHeaders.com |
| SSL certificate expiry check | Monthly | Automated alert |
| Page speed regression test | On every deploy | Lighthouse CI in build pipeline |
| Accessibility audit | Quarterly | axe DevTools |

---

## 13. Pre-Launch Technical SEO Validation

Before any page goes live, verify:

1. [ ] Page has unique `<title>` tag (50-60 characters, includes primary keyword)
2. [ ] Page has unique `<meta name="description">` (150-160 characters)
3. [ ] Page has `<link rel="canonical">`
4. [ ] Page has OG tags and Twitter Card tags
5. [ ] Page has appropriate structured data (JSON-LD)
6. [ ] Page has hreflang tags (if bilingual equivalent exists)
7. [ ] Page is in sitemap
8. [ ] Page is not blocked by robots.txt
9. [ ] Page passes Lighthouse performance audit (score 90+)
10. [ ] Page passes Lighthouse accessibility audit (score 90+)
11. [ ] Page passes Lighthouse SEO audit (score 100)
12. [ ] Page renders correctly on mobile (3 device sizes tested)
13. [ ] Page renders correctly in RTL mode (if Arabic)
14. [ ] All internal links on page return 200
15. [ ] All images have alt text and load correctly

---

*Last updated: 2026-03-28*
