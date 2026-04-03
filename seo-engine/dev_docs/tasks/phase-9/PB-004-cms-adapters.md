# PB-004: Headless CMS Adapters + Generic Webhook Publisher

> **Phase:** 9 | **Priority:** P1 | **Status:** NOT STARTED
> **Effort:** L (12h) | **Type:** feature
> **Sprint:** 9 (Weeks 17-18)
> **Backlog Items:** Universal Publishing — Headless CMS Adapters + Webhook
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `PROJECT-BRIEF.md` — Section "Layer 5: Universal Publishing", platform matrix
3. `bridge/publishing/payload.js` — Universal Article Payload from PB-001
4. `bridge/publishing/image-pipeline.js` — Image upload pipeline from PB-001
5. `bridge/server.js` — endpoint patterns, webhook system (existing HMAC-SHA256 implementation)
6. `bridge/publishing/wordpress.js` — WordPress adapter pattern reference (from PB-002)

## Objective
Build publishing adapters for 5 headless CMS platforms (Contentful, Strapi, Ghost, Webflow, Sanity) and a generic webhook adapter that POSTs the full article payload to any endpoint. Each adapter transforms the Universal Article Payload into the target platform's API format. Extend the existing WebhookManager with `publish.*` events for integration with custom systems.

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `bridge/publishing/contentful.js` | Contentful Management API adapter — entry creation, asset upload, publishing |
| CREATE | `bridge/publishing/strapi.js` | Strapi REST API adapter — content creation, media upload |
| CREATE | `bridge/publishing/ghost.js` | Ghost Admin API adapter — post creation, card-based content |
| CREATE | `bridge/publishing/webflow.js` | Webflow CMS API adapter — collection item creation |
| CREATE | `bridge/publishing/sanity.js` | Sanity GROQ mutation adapter — document creation, asset upload |
| CREATE | `bridge/publishing/generic-webhook.js` | Generic webhook publisher — POST payload to any URL |
| CREATE | `bridge/publishing/adapter-base.js` | Shared base class with common validation, error handling, retry logic |
| MODIFY | `bridge/server.js` | Add `/api/publish/:platform/push` generic route and adapter registry |
| CREATE | `tests/cms-adapters.test.js` | Unit and integration tests for all adapters |

## Sub-tasks

### Sub-task 1: Adapter Base Class (~1.5h)
- Create `bridge/publishing/adapter-base.js` with `PublishAdapter` base class
- Common functionality shared by all adapters:
  - `validatePayload(payload)` — verify required fields present
  - `makeRequest(url, options)` — HTTP wrapper with retry logic (3 attempts, exponential backoff)
  - `handleRateLimit(response)` — parse rate limit headers, wait and retry
  - `logPublish(articleId, platform, result)` — store publish record in database
  - `transformPayload(payload)` — abstract method, each adapter overrides
  - `publish(payload, credentials)` — abstract method, each adapter implements
  - Error normalization: all adapters return `{ success, remoteId, remoteUrl, error? }`
- Credential validation: verify required credentials present before attempting API calls

### Sub-task 2: Contentful Adapter (~2h)
- Create `bridge/publishing/contentful.js` extending `PublishAdapter`
- **Auth:** Management API token (personal access token or OAuth)
- **Payload transformation:**
  - Map `article.html` to Contentful Rich Text format (simplified: use HTML-in-rich-text embedding)
  - Map `seo.*` fields to SEO content type fields
  - Map `taxonomy.categories` and `taxonomy.tags` to tag entries
- **Publish flow:**
  1. Upload images as Contentful Assets: `PUT /spaces/{spaceId}/environments/{envId}/assets`
  2. Process and publish each asset: `PUT .../assets/{id}/files/{locale}` → `PUT .../published`
  3. Create entry: `PUT /spaces/{spaceId}/environments/{envId}/entries` with content type mapping
  4. Publish entry: `PUT .../entries/{id}/published` (or leave as draft)
- **Configuration:** User provides: space ID, environment ID, management token, content type ID, field mappings
- Handle Contentful's locale system: default to `en-US`, support custom locale from payload language

### Sub-task 3: Strapi Adapter (~2h)
- Create `bridge/publishing/strapi.js` extending `PublishAdapter`
- **Auth:** API token (full access or custom) via `Authorization: Bearer {token}`
- **Payload transformation:**
  - Map to Strapi content type structure (user configures field names)
  - Default mapping: `title`, `content` (HTML body), `slug`, `excerpt`, `seo` (component)
- **Publish flow (REST):**
  1. Upload images: `POST /api/upload` with multipart form data
  2. Get media IDs from upload response
  3. Create entry: `POST /api/{contentType}` with article data and media references
  4. Entry created as draft by default (publishedAt: null)
- **GraphQL alternative:** If user prefers GraphQL, use mutation:
  ```graphql
  mutation { createArticle(data: { title, content, slug, ... }) { data { id attributes { ... } } } }
  ```
- **Configuration:** User provides: Strapi URL, API token, content type name, field mapping object

### Sub-task 4: Ghost Adapter (~2h)
- Create `bridge/publishing/ghost.js` extending `PublishAdapter`
- **Auth:** Ghost Admin API key (generate JWT from `{id}:{secret}`)
  ```javascript
  // Ghost Admin API JWT generation
  const [id, secret] = apiKey.split(':');
  const token = jwt_sign({ iat: now, exp: now + 300, aud: '/admin/' }, secret, { keyid: id, algorithm: 'HS256' });
  ```
  - Implement JWT signing with Node.js `crypto` module (no npm deps: HMAC-SHA256 + base64url encoding)
- **Payload transformation:**
  - Ghost uses Mobiledoc or Lexical format internally, but Admin API accepts HTML via `html` field
  - Map: `title`, `html` (article body), `slug`, `custom_excerpt`, `meta_title`, `meta_description`, `tags` (array of tag objects), `feature_image`
- **Publish flow:**
  1. Upload feature image: `POST /ghost/api/admin/images/upload/` with multipart form
  2. Create post: `POST /ghost/api/admin/posts/` with `?source=html`
  3. Set status: `draft` (default) or `published`
- **Configuration:** User provides: Ghost URL, Admin API key

### Sub-task 5: Webflow Adapter (~2h)
- Create `bridge/publishing/webflow.js` extending `PublishAdapter`
- **Auth:** Webflow API token via `Authorization: Bearer {token}`
- **Payload transformation:**
  - Map to Webflow CMS Collection Item fields
  - Standard fields: `name` (title), `slug`, `post-body` (Rich Text HTML), `post-summary` (excerpt), `main-image` (image URL)
  - SEO fields: `seo-title`, `seo-description`, `og-image`
- **Publish flow:**
  1. Identify collection: `GET /v2/sites/{siteId}/collections` — find blog/articles collection
  2. Create item: `POST /v2/collections/{collectionId}/items` with field data
  3. Item created as draft (not staged for publishing)
  4. Optionally publish: `POST /v2/collections/{collectionId}/items/publish` with item IDs
- **Configuration:** User provides: Webflow site ID, API token, collection ID

### Sub-task 6: Sanity Adapter (~1.5h)
- Create `bridge/publishing/sanity.js` extending `PublishAdapter`
- **Auth:** Sanity token via `Authorization: Bearer {token}`
- **Payload transformation:**
  - Convert HTML to Sanity Portable Text blocks (simplified: use `html` custom block type)
  - Map metadata to document fields
- **Publish flow:**
  1. Upload images: `POST https://{projectId}.api.sanity.io/v2024-01-01/assets/images/{dataset}`
  2. Create document via mutations API:
     ```json
     { "mutations": [{ "createOrReplace": { "_type": "article", "title": "...", "slug": { "current": "..." }, "body": [...portableText], "seo": {...} } }] }
     ```
  3. Document created as draft (no `_id` prefix with `drafts.`)
- **Configuration:** User provides: project ID, dataset, API token, document type

### Sub-task 7: Generic Webhook Publisher (~1.5h)
- Create `bridge/publishing/generic-webhook.js` extending `PublishAdapter`
- Extend existing `WebhookManager` with `publish.*` events:
  - `publish.started` — fired when publish initiated
  - `publish.success` — fired on successful publish (includes remote URL)
  - `publish.failed` — fired on publish failure (includes error details)
- **Webhook publish:** POST the full Universal Article Payload to a user-configured URL
  - Headers: `Content-Type: application/json`, `X-ChainIQ-Signature` (HMAC-SHA256, reuse existing webhook signing)
  - Body: full payload JSON
  - Timeout: 30 seconds
  - Retry: 3 attempts with exponential backoff (reuse existing webhook retry logic)
- **Reference receiver implementation:** Document expected endpoint behavior:
  - Accept POST with JSON body
  - Verify `X-ChainIQ-Signature` header
  - Return 200 with `{ received: true, id: "..." }`
  - Include sample receiver code (Node.js, Python, PHP) in task docs
- **Configuration:** User provides: webhook URL, signing secret

### Sub-task 8: Adapter Registry + Generic Route (~1.5h)
- In `bridge/server.js`, create adapter registry:
  ```javascript
  const adapters = {
    wordpress: require('./publishing/wordpress'),
    shopify: require('./publishing/shopify'),
    contentful: require('./publishing/contentful'),
    strapi: require('./publishing/strapi'),
    ghost: require('./publishing/ghost'),
    webflow: require('./publishing/webflow'),
    sanity: require('./publishing/sanity'),
    webhook: require('./publishing/generic-webhook'),
  };
  ```
- Add generic route: `POST /api/publish/:platform/push`
  - Auth required
  - Validate platform exists in registry
  - Body: `{ articleId, credentials: { ...platform-specific }, options?: { ... } }`
  - Delegate to adapter: `adapters[platform].publish(payload, credentials, options)`
  - Return normalized response: `{ success, platform, remoteId, remoteUrl }`
- This replaces per-platform routes (keep WordPress and Shopify specific routes for backward compat)

## Testing Strategy

### Unit Tests (`tests/cms-adapters.test.js`)
- Test adapter base class: validation, retry logic, error normalization
- Test each adapter's payload transformation independently
- Test Contentful Rich Text mapping
- Test Ghost JWT generation from Admin API key
- Test Webflow field mapping
- Test Sanity Portable Text conversion
- Test generic webhook HMAC signature generation
- Test adapter registry resolves correct adapter for each platform

### Integration Tests
- Test `/api/publish/:platform/push` with mock API for each platform
- Test error handling: invalid credentials, API rate limits, network failures
- Test webhook publish with mock receiver
- Test publish record stored for each platform
- Test unknown platform returns 400 error

## Acceptance Criteria
- [ ] Adapter base class provides common retry, rate limiting, and error handling
- [ ] Contentful adapter creates entries and uploads assets via Management API
- [ ] Strapi adapter creates content via REST API with media upload
- [ ] Ghost adapter authenticates via JWT from Admin API key, creates posts via HTML source
- [ ] Webflow adapter creates CMS collection items with SEO fields
- [ ] Sanity adapter creates documents via GROQ mutations with asset upload
- [ ] Generic webhook POSTs full payload with HMAC-SHA256 signature
- [ ] `publish.*` webhook events fire on start, success, and failure
- [ ] Generic `/api/publish/:platform/push` route delegates to correct adapter
- [ ] All adapters return normalized `{ success, remoteId, remoteUrl }` response
- [ ] Publish records stored in database for all platforms
- [ ] Zero npm dependencies — all HTTP via native fetch, JWT via crypto
- [ ] All tests pass (`npm test`)

## Dependencies
- Blocked by: PB-001 (Universal Article Payload)
- Blocks: PB-005 (dashboard publishing page)
