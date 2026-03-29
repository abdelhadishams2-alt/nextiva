# Article Engine → Mansati Bridge (Step 8)

## Overview

The article engine generates articles, but they don't match the Mansati site's architecture. This bridge transforms engine output into Mansati-compatible pages with all monetization, analytics, and SEO features built in.

**Engine output:** Generic Next.js page with Tailwind CSS
**Bridge output:** Mansati-ready page with BEM CSS, affiliate CTAs, PostHog tracking, JSON-LD, OG tags

---

## How To Use

### Step 1: Generate an article with the engine
```bash
# In Claude Code, use the article engine skill
"generate article about cloud ERP comparison for Saudi businesses"
```

The engine outputs a file like `src/app/articles/cloud-erp-comparison/page.tsx`

### Step 2: Run the transform script
```bash
node scripts/transform-article.js cloud-erp-comparison --partner odoo --title "Cloud ERP Comparison" --description "Compare cloud ERP solutions for Saudi businesses"
```

### Step 3: Add translations
Add the required translation keys to `messages/en.json` under the generated namespace.

### Step 4: Copy images
Copy the hero image to `public/assets/articles/`

### Step 5: Build and verify
```bash
npm run build
npm run dev
# Open the new article page
```

---

## Script Options

```
node scripts/transform-article.js <slug> [options]

Arguments:
  slug                  URL slug for the article (required)

Options:
  --partner <key>       Affiliate partner key (default: "shopify")
                        Options: shopify, odoo, foodics, tap, hubspot, wix, classera,
                        hostinger, square, clover, toast, sumup, woocommerce
  --title "Title"       Article title (default: generated from slug)
  --description "Desc"  Article description (default: generated from title)
  --image "file.webp"   Hero image filename (default: article-{slug}-1.webp)
```

### Examples

```bash
# Shopify article
node scripts/transform-article.js shopify-pricing-2026 --partner shopify --title "Shopify Pricing in 2026"

# Foodics article
node scripts/transform-article.js foodics-vs-toast --partner foodics --title "Foodics vs Toast Comparison"

# Odoo article
node scripts/transform-article.js odoo-manufacturing --partner odoo --title "Odoo for Saudi Manufacturing"
```

---

## What The Script Does Automatically

| Action | Details |
|--------|---------|
| **Creates page file** | `src/app/[locale]/<slug>/page.tsx` with full Mansati structure |
| **Adds imports** | All affiliate, tracking, SEO, and layout components |
| **Adds OG tags** | Open Graph + Twitter cards via `generateMetadata()` |
| **Adds JSON-LD** | Schema.org Article structured data |
| **Adds affiliate disclosure** | "This article may contain affiliate links..." banner |
| **Adds sidebar CTA** | Sticky affiliate button in TOC sidebar |
| **Adds mid-article CTA** | Affiliate box halfway through the article |
| **Adds bottom CTA** | Affiliate button at end of article |
| **Adds mobile bar** | Sticky bottom bar on mobile |
| **Adds PostHog tracking** | `data-ph-capture-attribute` on all affiliate buttons |
| **Updates sitemap** | Adds new slug to `src/app/sitemap.ts` |
| **Updates articles config** | Adds entry to `src/config/articles.ts` |
| **Uses SITE_CONFIG** | All URLs reference `src/config/site.ts` (change domain in one place) |

---

## What You Still Need To Do Manually

### 1. Add translations to `messages/en.json`

Add a new namespace under `Articles`:

```json
{
  "Articles": {
    "cloudErpComparison": {
      "metaTitle": "Cloud ERP Comparison for Saudi Businesses 2026",
      "metaDescription": "Compare cloud ERP solutions...",
      "heroImageAlt": "Cloud ERP comparison dashboard",
      "heroBadge": "Enterprise Technology",
      "heroTitle": "Cloud ERP Comparison for Saudi Businesses",
      "heroReadTime": "12 min read",
      "heroDate": "March 2026",
      "authorInitials": "ME",
      "authorName": "Mansati Editorial Team",
      "authorMeta": "March 2026 · 12 min read",
      "shareText": "Cloud ERP Comparison for Saudi Businesses",
      "s2Title": "Section 2 Title",
      "s2Intro": "Section 2 intro text...",
      ...
    }
  }
}
```

### 2. Copy hero image
```bash
cp /path/to/generated/image.webp public/assets/articles/article-cloud-erp-comparison-1.webp
```

### 3. Customize affiliate partner
If the article reviews multiple tools, you may want different affiliate partners for the sidebar vs mid-article vs bottom CTA. Edit the generated `page.tsx` to change individual `partner` props.

---

## Files Reference

| File | Purpose |
|------|---------|
| `scripts/transform-article.js` | Post-generation transform script |
| `src/templates/article-template.tsx` | Reference template (not imported, just documentation) |
| `src/templates/engine-to-bem.json` | CSS class mapping (Tailwind → BEM) |
| `src/config/articles.ts` | Auto-updated with new article entries |
| `src/app/sitemap.ts` | Auto-updated with new article slugs |
| `src/config/site.ts` | Change your domain name here — all articles update automatically |

---

## What Each Generated Article Includes

Every article generated through this bridge has **5 affiliate touchpoints**:

| # | Touchpoint | Desktop | Mobile |
|---|-----------|---------|--------|
| 1 | Disclosure banner | Top of article | Top of article |
| 2 | Sticky sidebar CTA | Follows reader in TOC | Hidden |
| 3 | Mid-article CTA | Halfway through article | Halfway through article |
| 4 | Bottom CTA button | End of article | End of article |
| 5 | Sticky bottom bar | Hidden | Fixed at bottom of screen |

Plus:
- Full SEO (OG tags, Twitter cards, canonical URL, JSON-LD structured data)
- PostHog tracking on all affiliate buttons
- Reading progress bar
- Table of contents (sidebar + inline)
- Share buttons (Twitter, LinkedIn, Copy link)
- Consistent BEM CSS styling
