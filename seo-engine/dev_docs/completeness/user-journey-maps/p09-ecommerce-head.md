# P09: E-Commerce Marketing Head (Sarah) — User Journey Map

**Persona:** E-Commerce Marketing Head at a DTC Shopify brand
**Tier:** Professional ($3K/mo)
**Priorities:** Shopify integration (10/10), product-aware content (8/10)
**Deal-breakers:** CMS-native publishing (Shopify), no developer needed
**Daily workflow:** Review product-related content suggestions, generate blog posts, publish to Shopify, track performance

---

## Phase 1: First-Time Setup

**Goal:** Connect Shopify store, import product catalog context, publish first blog post without touching code.

### Touchpoints
| Step | Screen | Action |
|------|--------|--------|
| 1 | Login/Signup (`/signup`) | Sign up with work email; select Professional tier |
| 2 | Onboarding Wizard (`/onboarding`) | Select "E-Commerce" path; specify Shopify as CMS; enter store URL |
| 3 | Connections (`/settings/connections`) | Install ChainIQ Shopify app via OAuth; grant blog + product read permissions |
| 4 | Content Inventory (`/inventory`) | Import existing Shopify blog posts; ingest product catalog for content context |
| 5 | Dashboard Home (`/`) | View first KPIs; confirm Shopify connection shows "Active" |

### Emotions
- **Optimistic** — "If this can write product-aware blog posts and publish to Shopify, it is a game-changer."
- **Wary** — "I am not technical. If this requires API keys or code, I am out."
- **Delighted** when Shopify OAuth is a simple "Install App" click.

### Pain Points
- Shopify blog API is limited compared to WordPress — publishing may lack features Sarah expects (custom meta fields, blog categories).
- Product catalog ingestion needs to be clear about what data is used and how (privacy concern for DTC brands).
- Shopify stores often have minimal existing blog content — inventory import may show very little.

### Opportunities
- Build the Shopify connection as a native app install (one-click from Shopify admin) rather than manual API setup.
- Show exactly which product data is ingested and how it is used in content generation — transparency builds trust.
- If inventory is sparse, frame it positively: "Your blog has growth potential. Here are your first 10 content opportunities."

---

## Phase 2: Learning (Week 1)

**Goal:** Generate first product-aware blog post, verify it looks correct on Shopify storefront, understand content suggestions.

### Touchpoints
| Step | Screen | Action |
|------|--------|--------|
| 1 | Opportunities (`/opportunities`) | Browse content suggestions; notice product-linked opportunities (e.g., "Best [product category] for [use case]") |
| 2 | Article Pipeline (`/articles`) | Generate first blog post from a product-related opportunity |
| 3 | Article Detail (`/articles/[id]`) | Review generated post; check that product mentions are accurate and links are correct |
| 4 | Quality Report (`/articles/[id]/quality`) | Review quality score; focus on product accuracy signal |
| 5 | Publish Manager (`/publish`) | Publish to Shopify blog; check live storefront to verify |

### Emotions
- **Impressed** when article naturally references her products with correct names and pricing.
- **Nervous** before publishing — "Is this going to break my Shopify theme layout?"
- **Thrilled** when post appears on storefront with proper formatting and product links.

### Pain Points
- Product mentions may reference out-of-stock items or discontinued products.
- Shopify blog formatting is limited — rich content (tables, comparison charts) may not render well.
- Internal product links need to use the correct Shopify URL structure (`/products/handle`).

### Opportunities
- Filter product references to only in-stock, active products during generation.
- Offer a Shopify theme preview before publishing — show how the post will render in their actual theme.
- Auto-generate correct Shopify internal links based on product catalog data.

---

## Phase 3: Competency (Weeks 2-4)

**Goal:** Build a content calendar tied to product launches and seasonal campaigns, establish publishing rhythm.

### Touchpoints
| Step | Screen | Action |
|------|--------|--------|
| 1 | Opportunities (`/opportunities`) | Filter opportunities by product category; align with upcoming product launches |
| 2 | Voice Profiles (`/voice`) | Create brand voice profile matching DTC brand tone (casual, aspirational, benefit-focused) |
| 3 | Article Pipeline (`/articles`) | Generate a batch of 8-10 posts for the month; organize by product line |
| 4 | Publish Manager (`/publish`) | Schedule posts across the month; align with email campaign calendar |
| 5 | Blueprint Gallery (`/blueprints`) | Save blueprints for recurring content types (product roundups, how-to guides, buying guides) |

### Emotions
- **Organized** — "I finally have a content engine that understands my products."
- **Creative** — using opportunity data to plan campaigns she would not have thought of.
- **Annoyed** if scheduling does not support exact publish times (Shopify blog posts are time-sensitive for campaigns).

### Pain Points
- No way to tag articles by product collection or campaign — hard to organize for DTC workflows.
- Publishing schedule needs to coordinate with email marketing and social — no external calendar sync.
- Bulk generation for 10 posts may exhaust monthly quota on Professional tier.

### Opportunities
- Add custom tags/labels on articles (e.g., "Summer Campaign", "Product Launch: SKU-123").
- Offer calendar export (iCal/Google Calendar) for publishing schedule to sync with marketing tools.
- Show quota impact before bulk generation: "This will use 10 of your 50 remaining articles."

---

## Phase 4: Mastery (Month 2+)

**Goal:** Measure content-driven revenue, automate seasonal content, make the case for increased content investment.

### Touchpoints
| Step | Screen | Action |
|------|--------|--------|
| 1 | Performance (`/performance`) | Track which blog posts drive the most product page visits and conversions |
| 2 | Content Inventory (`/inventory`) | Identify top-performing evergreen content; refresh seasonal content before it decays |
| 3 | Plugin Configuration (`/settings`) | Set up automation: auto-generate content briefs when new products are added to Shopify |
| 4 | Dashboard Home (`/`) | Customize KPIs to show e-commerce metrics (blog-to-product click-through, assisted revenue) |
| 5 | Opportunities (`/opportunities`) | Use competitive content gaps to inform product marketing strategy |

### Emotions
- **Data-driven** — "I can finally show the CEO that content drives revenue."
- **Strategic** — content insights informing product and marketing decisions beyond SEO.
- **Frustrated** if performance tracking cannot attribute revenue to specific blog posts.

### Pain Points
- Revenue attribution requires Shopify analytics integration beyond basic blog publishing.
- Automation based on new product additions needs real-time webhook from Shopify — potential latency.
- E-commerce KPIs (click-through to product, add-to-cart from blog) are not standard SEO metrics.

### Opportunities
- Integrate Shopify analytics to show blog-to-purchase attribution (assisted conversions, last-click revenue).
- Implement Shopify webhook listener for real-time product catalog updates.
- Build e-commerce-specific KPI cards: blog-to-PDP click rate, content-assisted revenue, product mention coverage.

---

## Phase 5: Error Recovery

### Shopify Publish Failure
- **Trigger:** Shopify API rate limit, app permission revoked, or blog post validation error.
- **Expected behavior:** Article returns to "Failed" in Publish Manager with Shopify-specific error message.
- **Pain point:** Sarah is not technical — error messages like "422 Unprocessable Entity" are meaningless.
- **Solution:** Translate Shopify errors to plain language: "Your post title is too long for Shopify (max 255 characters). Shorten it and retry." One-click retry after fix.

### Product Reference Errors
- **Trigger:** Article references a product that has been deleted, renamed, or gone out of stock since generation.
- **Expected behavior:** Warning badge on Article Detail: "2 product references may be outdated."
- **Pain point:** Publishing content with broken product links damages brand credibility.
- **Solution:** Pre-publish product reference validation that checks all mentioned products against live Shopify catalog. Flag stale references with suggested replacements.

### Shopify App Disconnection
- **Trigger:** Someone uninstalls the ChainIQ app from Shopify admin, or store changes Shopify plan.
- **Expected behavior:** Immediate banner on Dashboard: "Shopify connection lost. Reinstall to resume publishing."
- **Pain point:** Sarah may not realize the app was uninstalled (another team member did it).
- **Solution:** Email notification to account owner on disconnection. Provide a direct reinstall link. Preserve all generated content — nothing is lost, only publishing is paused.

### Theme Rendering Issues
- **Trigger:** Published post has formatting issues on the live Shopify storefront (broken images, unsupported HTML).
- **Expected behavior:** Post-publish visual check (automated screenshot comparison) flags rendering anomalies.
- **Pain point:** Sarah discovers broken formatting only when a customer or team member reports it.
- **Solution:** Automated post-publish screenshot of live URL compared against expected rendering. Alert if significant visual deviation detected. Offer "Unpublish and Revise" one-click action.

### Accidental Bulk Publish
- **Trigger:** Published all 10 scheduled posts at once instead of staggered.
- **Expected behavior:** "Undo Publish" toast within 60 seconds that reverts posts to draft on Shopify.
- **Pain point:** 10 blog posts appearing simultaneously looks spammy and floods RSS/email subscribers.
- **Solution:** Bulk publish requires explicit confirmation showing the count and schedule. Undo window of 60 seconds. After that, individual unpublish from Publish Manager.

---

## Onboarding Tour Content

On first login, highlight these 4 features:

1. **Shopify Connection** (`/settings/connections`) — "Connect your Shopify store in one click. We will import your product catalog and existing blog posts automatically."
2. **Opportunities** (`/opportunities`) — "See content ideas powered by your actual products and search data. Every suggestion links back to products your customers are searching for."
3. **Publish Manager** (`/publish`) — "Publish blog posts directly to your Shopify storefront. No copying, no code, no theme editing."
4. **Performance** (`/performance`) — "Track which blog posts drive traffic to your product pages. See the revenue impact of your content."

---

## Empty State Strategy

### Dashboard Home (`/`)
- Show a Shopify-branded welcome card: "Your store [store-name.myshopify.com] is connected. Let us set up your content engine."
- 3-step progress tracker: (1) Connect Shopify (done), (2) Generate first post, (3) Publish to store.
- CTA: "Generate Your First Product Blog Post"

### Opportunities (`/opportunities`)
- If product catalog ingested: Show opportunities tagged with product names — "Blog ideas for [Product Name]."
- If no GSC connected: "Connect Google Search Console to unlock search-driven opportunities. Without it, we will suggest content based on your product catalog alone."
- Sample opportunity card showing a product-aware content suggestion.

### Content Inventory (`/inventory`)
- If Shopify blog has existing posts: Show them with health scores immediately.
- If blog is empty: "Your Shopify blog is a blank canvas. That is a good thing — we will help you build it strategically from day one."
- CTA: "See your top 5 content opportunities" (link to Opportunities)

### Article Pipeline (`/articles`)
- Show a single example card: "Best [product category] for [season] — How your products solve [customer pain point]."
- Message: "Every article is product-aware — it knows your catalog, your pricing, and your brand voice."
- CTA: "Generate Your First Post"

---

## "What's New" Preferences

This persona values:
- Shopify integration improvements (new features, Shopify API updates, theme compatibility)
- E-commerce content templates (product roundups, buying guides, seasonal campaigns)
- Performance attribution features (blog-to-purchase tracking)
- Product catalog sync improvements
- Visual/formatting enhancements for Shopify blog rendering

**Preferred delivery:** In-app tooltip on Publish Manager when Shopify-specific features ship. Bi-weekly email with "E-Commerce Content Tips" framing — position features as revenue-driving tactics, not technical updates. Include benchmarks: "Brands using product-aware content see 3x more blog-to-PDP clicks."
