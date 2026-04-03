# Spec 08: Shopify App — Blog API Integration with Product-Aware Content

**Status:** Implementation-Ready
**Priority:** Should Have (MoSCoW #55)
**Phase:** C (Weeks 15-22)
**Effort:** Backend XL (4+ weeks), Frontend M (1-2 weeks)
**Dependencies:** #49 Universal Article Payload format, WordPress plugin (for pattern reuse)
**Owner:** ChainIQ Platform Engineer
**White Space:** 0/9 competitors offer Shopify blog integration

---

## 1. Feature Overview

### What

A Shopify embedded admin app that enables direct blog publishing from ChainIQ to any Shopify store. The app uses Shopify's Blog API (REST Admin API) to create blog articles, upload images, and set SEO metadata. Uniquely, ChainIQ's Shopify integration is product-aware: it can reference products from the store's catalog within generated content, linking blog posts to product pages to drive organic traffic to commerce.

### Why

Shopify powers 4.6 million active stores globally, and e-commerce content marketing is a growing segment. No current competitor integrates with Shopify's Blog API for AI content publishing. The persona P09 (E-Commerce Marketing Head) identified this as a critical gap. Product-aware content is the differentiator: blog posts that naturally reference the store's catalog create internal links from informational content to transactional pages, which is the highest-value SEO strategy for e-commerce.

### Where

- **Shopify App:** `plugins/shopify/chainiq-shopify/` (Node.js, Shopify App Bridge)
- **Bridge Server:** `bridge/publishing/shopify.js` (API client)
- **Bridge Route:** `bridge/routes/publish.js` (shared with WordPress, new Shopify handler)
- **Frontend:** Shopify embedded admin panel, ChainIQ dashboard publish modal

### Architecture

```
ChainIQ Dashboard ──► Bridge Server ──► Shopify Admin API ──► Blog Article
                            │                    │
                            │              Product References
                            │              (catalog lookup)
                            │
                    Shopify App (embedded)
                    ├── OAuth install flow
                    ├── App Bridge UI
                    ├── Webhook receivers
                    └── Product catalog cache
```

Shopify apps use OAuth 2.0 for installation. The app runs as an embedded iframe within Shopify admin using App Bridge. The bridge server calls Shopify's Admin REST API directly with the shop's access token (stored encrypted in `client_connections`).

---

## 2. User Stories

**US-8.1** — Given a Shopify store, when the store owner installs the ChainIQ app from the Shopify App Store (or custom URL), then the OAuth flow completes and the store appears as a connected platform in ChainIQ's Connections page.

**US-8.2** — Given a connected Shopify store, when I generate an article with product awareness enabled, then ChainIQ fetches the store's product catalog and the draft-writer naturally references relevant products with links to product pages.

**US-8.3** — Given a generated article, when I click "Publish to Shopify," then a blog article is created on the store's default blog (or a selected blog) with title, HTML content, author, tags, and SEO metadata — all as an unpublished draft.

**US-8.4** — Given the Shopify embedded admin app, when the store owner opens ChainIQ from the Shopify admin sidebar, then they see their connection status, recent articles, and a link to the full ChainIQ dashboard.

**US-8.5** — Given a published blog article on Shopify, when I view it on the storefront, then all product references link correctly to the product pages and images are hosted on Shopify's CDN.

**US-8.6** — Given the ChainIQ publish modal for Shopify, when I select a blog and click publish, then I see SSE progress (uploading images, creating article, setting metadata) and receive a success confirmation with a link to the Shopify editor.

---

## 3. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| AC-1 | Shopify OAuth 2.0 install flow completes and stores access token encrypted in `client_connections` | Integration test: mock Shopify OAuth, verify token storage |
| AC-2 | `POST /admin/api/2024-01/blogs/{blog_id}/articles.json` creates a draft article | Integration test with mock Shopify API |
| AC-3 | Article HTML content preserved without Shopify sanitization stripping critical elements | Manual test: verify headings, tables, images in storefront |
| AC-4 | Article tags mapped from ChainIQ taxonomy to Shopify tags (comma-separated string) | Unit test: tag mapping |
| AC-5 | SEO title and description set via `metafields_global_title_tag` and `metafields_global_description_tag` | Unit test: verify metafield values in API payload |
| AC-6 | Featured image uploaded to Shopify CDN and attached to article | Integration test: image upload flow |
| AC-7 | Product catalog fetched via `GET /admin/api/2024-01/products.json` with pagination | Unit test: paginated fetch handles 250+ products |
| AC-8 | Product references in content use correct Shopify product URLs (`/products/{handle}`) | Unit test: URL construction from product handle |
| AC-9 | Embedded admin app loads within Shopify admin iframe using App Bridge | Manual test: install app, verify iframe renders |
| AC-10 | App handles token refresh when access token expires | Unit test: 401 response triggers refresh |
| AC-11 | Publish to Shopify respects rate limits (2 requests/second for REST API) | Unit test: verify throttling logic |

---

## 4. UI/UX Description

### Shopify Embedded Admin App

```
+------------------------------------------------------------------+
|  Shopify Admin  >  Apps  >  ChainIQ Connector                    |
+------------------------------------------------------------------+
|                                                                    |
|  CONNECTION STATUS                                                 |
|  +--------------------------------------------------------------+ |
|  | ● Connected to ChainIQ                                       | |
|  | Store: my-awesome-store.myshopify.com                        | |
|  | Products in catalog: 347                                      | |
|  | Blog articles published: 12                                   | |
|  | [Open ChainIQ Dashboard →]                                    | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  RECENT ARTICLES                                                   |
|  +--------------------------------------------------------------+ |
|  | Title                        | Blog    | Status | Date       | |
|  |------------------------------|---------|--------|----------- | |
|  | Best Running Shoes Guide     | News    | Draft  | 2026-03-28 | |
|  | How to Choose Trail Shoes    | Tips    | Pub    | 2026-03-25 | |
|  | Summer Collection Preview    | News    | Draft  | 2026-03-22 | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  SETTINGS                                                          |
|  +--------------------------------------------------------------+ |
|  | Default Blog: [News ▼]                                        | |
|  | Default Author: [Store Admin ▼]                                | |
|  | Product-aware content: [✓ Enabled]                             | |
|  | Max product references per article: [3 ▼]                      | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

### ChainIQ Dashboard — Shopify Publish Modal

```
+------------------------------------------+
|  Publish to Shopify                       |
+------------------------------------------+
|  Store: my-awesome-store.myshopify.com   |
|                                           |
|  Blog: [News ▼]                          |
|  Tags: [running, shoes, guide]           |
|  Author: [Store Admin ▼]                 |
|                                           |
|  SEO Meta:                                |
|  Title: [Best Running Shoes 2026 ...]    |
|  Description: [A comprehensive guid...]  |
|                                           |
|  Product References (auto-detected):      |
|  ☑ Nike Air Zoom Pegasus (/products/...)  |
|  ☑ ASICS Gel-Kayano (/products/...)       |
|  ☐ Brooks Ghost 15 (/products/...)        |
|                                           |
|  [Cancel]              [Publish as Draft] |
+------------------------------------------+
```

### Components

- **ShopifyConnectionCard:** Connection status, store URL, product count. Uses same card pattern as WordPress.
- **ShopifyPublishModal:** Blog selector, tag input, SEO fields, product reference checkboxes.
- **ShopifyEmbeddedApp:** React app using Shopify App Bridge for iframe embedding. Polaris components for native Shopify look.
- **Mobile:** Shopify admin is already mobile-responsive. Embedded app inherits Polaris mobile patterns.

---

## 5. Database Changes

### Reuses Existing Tables

- **`client_connections`:** New row with `provider = 'shopify'`, stores encrypted access token, `account_id` = `shop.myshopify.com`
- **`articles`:** Same `cms_platform`, `cms_post_id`, `cms_post_url`, `cms_status` columns added in migration #015

### New Table: `product_catalog_cache`

```sql
CREATE TABLE product_catalog_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  connection_id UUID NOT NULL REFERENCES client_connections(id),
  shopify_product_id TEXT NOT NULL,
  title TEXT NOT NULL,
  handle TEXT NOT NULL,
  product_type TEXT,
  tags TEXT[],
  description_excerpt TEXT,
  image_url TEXT,
  price NUMERIC(10,2),
  status TEXT,
  cached_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, shopify_product_id)
);

CREATE INDEX idx_product_cache_user ON product_catalog_cache (user_id);
CREATE INDEX idx_product_cache_search ON product_catalog_cache (user_id, product_type, title);

ALTER TABLE product_catalog_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own products" ON product_catalog_cache
  FOR ALL USING (auth.uid() = user_id);
```

Cache TTL: 24 hours. Refreshed on demand or via daily scheduler.

### Migration: `migrations/016-product-catalog-cache.sql`

---

## 6. API / Backend Changes

### Bridge Server — `bridge/publishing/shopify.js`

```javascript
module.exports = {
  // OAuth
  async getInstallUrl(shop, redirectUri),
  async exchangeToken(shop, code),

  // Publishing
  async publishToShopify(connectionConfig, articlePayload),
  // Creates blog article via POST /admin/api/2024-01/blogs/{id}/articles.json
  // Returns: { articleId, editUrl, viewUrl }

  async listBlogs(connectionConfig),
  // GET /admin/api/2024-01/blogs.json
  // Returns: [{ id, title, handle }]

  // Product awareness
  async fetchProductCatalog(connectionConfig, cursor),
  // Paginated fetch of all products
  // Returns: [{ id, title, handle, type, tags, imageUrl, price }]

  async findRelevantProducts(catalog, articleContent, maxRefs),
  // Keyword matching between article content and product titles/tags/descriptions
  // Returns: top N most relevant products

  async injectProductReferences(html, products),
  // Inserts natural product links into article HTML
  // Returns: modified HTML with <a href="/products/{handle}">...</a>

  // Rate limiting
  _throttle(fn, delayMs),
  // Ensures max 2 requests/second to Shopify API
};
```

### Bridge Server — `bridge/routes/publish.js` (additions)

**`POST /api/publish/shopify`** — Push article to Shopify

```
Request:
  Headers: Authorization: Bearer <token>
  Body: {
    articleId: string,
    connectionId: string,
    blogId: string,
    tags?: string[],
    author?: string,
    productReferences?: string[],   // Product IDs to include
    seo?: { metaTitle, metaDescription }
  }

Response (200):
  {
    success: true,
    data: {
      shopifyArticleId: "1234567890",
      editUrl: "https://admin.shopify.com/store/mystore/articles/1234567890",
      viewUrl: "https://mystore.myshopify.com/blogs/news/article-handle"
    }
  }
```

**`GET /api/publish/shopify/blogs/:connectionId`** — List available blogs

```
Response (200): { success: true, data: [{ id, title, handle }] }
```

**`GET /api/publish/shopify/products/:connectionId`** — Get cached product catalog

```
Response (200): { success: true, data: [ProductRecord, ...] }
```

### Shopify App — `plugins/shopify/chainiq-shopify/`

The Shopify app is a lightweight Node.js Express application (separate from the bridge server, deployed independently) that handles:

1. **OAuth install flow:** `/auth/callback` receives Shopify OAuth code, exchanges for token, stores in ChainIQ via bridge API
2. **App Bridge integration:** Serves the embedded admin React app
3. **Webhook receivers:** `APP_UNINSTALLED`, `SHOP_UPDATE` webhooks from Shopify

The app uses Shopify's official `@shopify/shopify-api` library (this is a separate deployment, not the zero-dep bridge server). The bridge server communicates with Shopify's REST API directly using native `fetch`.

### Edge Cases

- **Store has no blogs:** Create a default "News" blog via API before publishing
- **Product catalog > 10,000 products:** Paginate with `since_id`, cache in batches
- **Shopify rate limit (2/s):** Queue requests with 500ms delay, retry on 429
- **Image format not supported:** Shopify accepts JPEG, PNG, GIF, WebP. Convert if needed (log warning for unsupported).
- **HTML content stripping:** Shopify's Blog API accepts raw HTML. Unlike WordPress, no kses filtering. Tables and custom classes are preserved.
- **App uninstalled:** Webhook handler marks connection as `revoked` in `client_connections`
- **Multiple Shopify stores:** Each store is a separate connection in `client_connections`

---

## 7. Frontend Components

### Shopify Embedded App (React + Polaris)

| Component | File | Purpose |
|-----------|------|---------|
| `App` | `pages/index.tsx` | Main embedded app shell with App Bridge |
| `ConnectionStatus` | `components/ConnectionStatus.tsx` | Store status card |
| `RecentArticles` | `components/RecentArticles.tsx` | Article history table (Polaris DataTable) |
| `Settings` | `components/Settings.tsx` | Default blog, author, product-awareness toggle |

### ChainIQ Dashboard (Next.js)

| Component | Path | Props |
|-----------|------|-------|
| `ShopifyConnectionCard` | `components/connections/shopify-card.tsx` | `connection: Connection` |
| `ShopifyPublishModal` | `components/publish/shopify-publish-modal.tsx` | `articleId, connectionId, onPublish, onCancel` |
| `ProductReferenceSelector` | `components/publish/product-reference-selector.tsx` | `products: Product[], selected: string[], onChange` |
| `BlogSelector` | `components/publish/blog-selector.tsx` | `blogs: Blog[], selected: string, onChange` |

### Modified Components

| Component | Change |
|-----------|--------|
| Publish modal | Add Shopify tab alongside WordPress |
| Connections page | Add Shopify connection card with install link |

### State Management

- Product catalog cached client-side after first fetch (24h TTL)
- Blog list fetched on modal open
- Product references auto-detected from article content, user can toggle
- Publish progress via SSE (same pattern as WordPress)

---

## 8. Test Plan

### Unit Tests — `test/shopify-publisher.test.js`

| Test | Description |
|------|-------------|
| `publishToShopify creates article with correct payload` | Mock Shopify API, assert request body |
| `publishToShopify sets metafields for SEO` | Verify metafield values |
| `publishToShopify handles rate limiting (429)` | Mock 429, assert retry |
| `listBlogs returns parsed blog array` | Mock API response |
| `fetchProductCatalog paginates correctly` | Mock 3 pages, assert all products collected |
| `findRelevantProducts matches by title keywords` | Article about "running shoes", product titled "Running Shoes Pro" |
| `findRelevantProducts respects maxRefs limit` | 10 matches, maxRefs=3, assert 3 returned |
| `injectProductReferences inserts links correctly` | HTML input, assert product links in output |
| `injectProductReferences does not duplicate existing links` | HTML already has product link, assert no duplicate |
| `_throttle enforces 500ms delay` | Call 5 times, assert timing |

### Integration Tests — `test/shopify-api.test.js`

| Test | Description |
|------|-------------|
| `POST /api/publish/shopify returns 200` | Full flow with mock Shopify |
| `POST /api/publish/shopify returns 400 without articleId` | Validation |
| `GET /api/publish/shopify/blogs returns blog list` | Mock Shopify blogs endpoint |
| `GET /api/publish/shopify/products returns cached products` | After catalog fetch |
| `POST /api/publish/shopify requires auth` | No token = 401 |

### Manual Tests

| Test | Expected |
|------|----------|
| Install app on development store | OAuth completes, connection appears in ChainIQ |
| Publish article to blog | Draft created with all metadata |
| View article on storefront | Formatting intact, product links work |
| Uninstall app | Webhook fires, connection marked revoked |

---

## 9. Rollout Plan

### Feature Flag

`FEATURE_SHOPIFY_PUBLISHING=true`. When false, Shopify option hidden in publish modal and connections page.

### Phases

1. **Week 1:** Shopify API client (`bridge/publishing/shopify.js`): auth, blog listing, article creation. Unit tests.
2. **Week 2:** Product catalog fetching + caching. Product reference detection + injection. Unit tests.
3. **Week 3:** Embedded admin app scaffold. OAuth install flow. Webhook handlers.
4. **Week 4:** ChainIQ dashboard integration: publish modal, connection card, SSE progress.
5. **Week 5:** Manual testing on Shopify development store. Bug fixes. Shopify App Store submission preparation.

### Monitoring

- Log publish success/failure per Shopify store
- Track API rate limit headroom (Shopify provides `X-Shopify-Shop-Api-Call-Limit` header)
- Alert on 3+ consecutive publish failures
- Monitor product catalog cache freshness (warn if > 48h stale)

### User Communications

- Connections page: "Install ChainIQ on your Shopify store" card with install link
- Post-install: "Shopify store connected. 347 products indexed for content references."
- First publish: success notification with link to Shopify article editor

---

## 10. Accessibility & Mobile

### Shopify Embedded App (Polaris)

- Uses Shopify Polaris design system, which is WCAG 2.1 AA compliant by default
- All Polaris components include proper ARIA attributes, focus management, and keyboard support
- DataTable: sortable headers with `aria-sort`, row selection via keyboard
- Form inputs: labels via Polaris `TextField` component (inherently accessible)

### ChainIQ Dashboard (Publish Components)

- Product reference checkboxes: `aria-label` with product title
- Blog selector: `aria-label="Select blog for publishing"`
- Publish progress: `role="progressbar"` with aria values
- All status indicators: color + icon + text (triple redundancy)

### Keyboard Navigation

- Tab through modal fields: blog selector, tags, SEO fields, product checkboxes, publish button
- Escape closes modal
- Enter on publish button initiates publish
- Space toggles product reference checkboxes

### RTL / Arabic

- Shopify admin does not natively support RTL, but content within blog articles renders RTL when `dir="rtl"` is set on the article wrapper
- ChainIQ publish modal supports RTL via CSS logical properties
- Product reference list: LTR product titles, RTL article content

### Mobile

- Shopify embedded app: inherits Polaris mobile-first responsive design
- ChainIQ publish modal: full-screen sheet on mobile (< 768px)
- Product references: scrollable list with touch-friendly checkboxes (44px targets)
