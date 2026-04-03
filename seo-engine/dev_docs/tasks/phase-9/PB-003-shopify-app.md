# PB-003: Shopify Publishing Adapter

> **Phase:** 9 | **Priority:** P1 | **Status:** NOT STARTED
> **Effort:** L (12h) | **Type:** feature
> **Sprint:** 8 (Weeks 15-16)
> **Backlog Items:** Universal Publishing — Shopify Blog API Integration
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `PROJECT-BRIEF.md` — Section "Layer 5: Universal Publishing", Shopify App details
3. `bridge/publishing/payload.js` — Universal Article Payload builder from PB-001
4. `bridge/publishing/image-pipeline.js` — Image upload pipeline from PB-001
5. `bridge/server.js` — endpoint patterns, auth middleware
6. Shopify Admin API documentation — Blog and Article resources

## Objective
Build a Shopify publishing adapter that connects ChainIQ to any Shopify store's blog. Implement OAuth2 authentication (or custom app token support) for Shopify Admin API access. The adapter is product-aware, capable of referencing the store's product catalog within article content. Add a bridge endpoint to push articles to Shopify blogs.

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `bridge/publishing/shopify.js` | Shopify Admin Blog API client — OAuth2, article creation, media upload, product awareness |
| MODIFY | `bridge/server.js` | Add `/api/publish/shopify/push` endpoint and `/api/publish/shopify/auth` OAuth flow |
| MODIFY | `bridge/publishing/image-pipeline.js` | Add Shopify file upload strategy |
| CREATE | `tests/shopify-publisher.test.js` | Unit and integration tests |

## Sub-tasks

### Sub-task 1: Shopify OAuth2 / Custom App Token (~3h)
- In `bridge/publishing/shopify.js`, create `ShopifyClient` class
- **OAuth2 flow (for public app distribution):**
  1. Generate auth URL: `https://{shop}.myshopify.com/admin/oauth/authorize?client_id={key}&scope=write_content,read_products&redirect_uri={callback}`
  2. Handle callback: exchange authorization code for access token via `POST /admin/oauth/access_token`
  3. Store encrypted access token in `client_connections` table (reuse AES-256-GCM from key-manager.js)
  4. Token refresh: Shopify offline tokens don't expire, but handle revocation gracefully
- **Custom app token (for single-store setup):**
  - Accept `X-Shopify-Access-Token` directly from user settings
  - Store encrypted in `client_connections` table
  - Validate token by calling `GET /admin/api/2024-01/shop.json`
- **API client wrapper:**
  - Base URL: `https://{shop}.myshopify.com/admin/api/2024-01/`
  - All requests include `X-Shopify-Access-Token` header
  - Rate limiting awareness: respect Shopify's 2 requests/second bucket, back off on 429
  - Retry on 5xx with exponential backoff (max 3 retries)

### Sub-task 2: Blog Article Publishing (~3.5h)
- Create `publishArticle(shopDomain, payload, options)` method in `ShopifyClient`
- **Map Universal Article Payload to Shopify Blog Article:**
  ```javascript
  const shopifyArticle = {
    title: payload.article.title,
    body_html: payload.article.html,
    author: payload.taxonomy.author,
    tags: payload.taxonomy.tags.join(', '), // Shopify uses comma-separated string
    summary_html: payload.article.excerpt,
    published: false, // Always create as unpublished draft
    metafields: [
      { namespace: 'seo', key: 'title', value: payload.seo.metaTitle, type: 'single_line_text_field' },
      { namespace: 'seo', key: 'description', value: payload.seo.metaDescription, type: 'single_line_text_field' }
    ]
  };
  ```
- **Blog selection:**
  - Fetch available blogs: `GET /admin/api/2024-01/blogs.json`
  - Default to the first blog, or allow user to specify blog ID in options
  - If no blog exists, create one: `POST /admin/api/2024-01/blogs.json`
- **Create article:** `POST /admin/api/2024-01/blogs/{blog_id}/articles.json`
- **Image handling:**
  - Shopify articles support inline HTML images (no separate media upload needed for content images)
  - Featured image: set `article.image` field with `{ src: imageUrl, alt: altText }`
  - Content images: ensure src URLs in HTML are absolute and publicly accessible
  - If images are local: upload via Shopify Files API (GraphQL) first, get CDN URL
- **Return:** `{ success, articleId, articleUrl, blogId, handle }`

### Sub-task 3: Product Awareness (~3h)
- Create `getProductCatalog(shopDomain, options)` method
- Fetch products: `GET /admin/api/2024-01/products.json?limit=250&fields=id,title,handle,product_type,tags,vendor`
- Build product reference map: `{ title, handle, url, type, tags }`
- **Product injection into articles:**
  - When generating articles for Shopify stores, the payload builder can include product references
  - Create `enrichWithProducts(html, products, keyword)` function:
    1. Find product mentions in the article text (fuzzy match product titles against article content)
    2. Where products are mentioned, wrap in product links: `<a href="/products/{handle}">{title}</a>`
    3. Add "Related Products" section at article end if relevant products found (max 3)
    4. Generate product-aware structured data (Product mentions in Article JSON-LD)
  - This enrichment is OPTIONAL — only runs when products are available and relevant
- **Catalog caching:** Cache product list for 1 hour per store (in-memory Map with TTL)
- Use `read_products` scope to access catalog without modification rights

### Sub-task 4: Bridge Server Endpoints (~2.5h)
- Add `POST /api/publish/shopify/push` to `bridge/server.js`
  - Auth required (Bearer token)
  - Body: `{ articleId, shopDomain, blogId?: string, enrichProducts?: boolean }`
  - Process:
    1. Retrieve Shopify credentials from `client_connections` table for this user + shop
    2. Build Universal Article Payload via `buildPayload(articleId)`
    3. If `enrichProducts: true`: fetch catalog, run product enrichment
    4. Process images (ensure all are publicly accessible URLs)
    5. Push to Shopify via `ShopifyClient.publishArticle()`
    6. Store publish record in database
  - Return: `{ success, remoteArticleId, remoteArticleUrl }`
- Add `GET /api/publish/shopify/auth` — initiate OAuth2 flow
  - Query params: `?shop=mystore.myshopify.com`
  - Returns: `{ authUrl }` for redirect
- Add `GET /api/publish/shopify/auth/callback` — OAuth2 callback
  - Exchanges code for token, stores encrypted
  - Redirects back to dashboard with success message
- Add `GET /api/publish/shopify/blogs` — list available blogs for a connected shop
  - Returns: `{ blogs: [{ id, title, handle }] }`

## Testing Strategy

### Unit Tests (`tests/shopify-publisher.test.js`)
- Test Universal Payload to Shopify article mapping (all fields)
- Test tag conversion (array to comma-separated string)
- Test product catalog fetching and caching
- Test product enrichment: verify links injected, "Related Products" section added
- Test OAuth2 URL generation with correct scopes
- Test rate limiting backoff logic

### Integration Tests
- Test `/api/publish/shopify/push` with mock Shopify API
- Test OAuth2 flow: auth URL → callback → token storage
- Test blog listing endpoint
- Test product enrichment end-to-end
- Test auth required on all endpoints
- Test error handling: invalid shop domain, revoked token, Shopify API errors

## Acceptance Criteria
- [ ] Shopify OAuth2 flow implemented (auth URL, callback, token storage)
- [ ] Custom app token alternative supported for single-store setups
- [ ] Articles created via Shopify Admin Blog API as unpublished drafts
- [ ] Universal Payload correctly mapped to Shopify article format (title, body, tags, SEO meta)
- [ ] Featured image set on Shopify article
- [ ] Product catalog fetched and cached (1-hour TTL)
- [ ] Product enrichment adds relevant product links and "Related Products" section
- [ ] `/api/publish/shopify/push` sends article to specified blog
- [ ] Publish record stored in ChainIQ database
- [ ] Shopify rate limiting respected (2 req/s, backoff on 429)
- [ ] Zero npm dependencies — pure Node.js with native fetch
- [ ] All tests pass (`npm test`)

## Dependencies
- Blocked by: PB-001 (Universal Article Payload)
- Blocks: PB-005 (dashboard publishing page)
