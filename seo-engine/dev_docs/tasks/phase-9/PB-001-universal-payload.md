# PB-001: Universal Article Payload Format

> **Phase:** 9 | **Priority:** P1 | **Status:** NOT STARTED
> **Effort:** L (8h) | **Type:** feature
> **Sprint:** 7 (Weeks 13-14)
> **Backlog Items:** Universal Publishing — Payload Schema + Image CDN Pipeline
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `PROJECT-BRIEF.md` — Section "Layer 5: Universal Publishing" for platform matrix
3. `bridge/server.js` — endpoint patterns, article storage, auth middleware
4. `supabase-setup.sql` — articles table schema (PROTECTED)
5. `engine/quality-gate.js` — quality scoring output format (from QG-001)
6. `bridge/intelligence/voice-analyzer.js` — voice profile format (from VI-001/002)

## Objective
Define and implement the Universal Article Payload — a standardized JSON schema that represents a complete article with all metadata, SEO fields, taxonomy, images, structured data, and quality scores. Build the image CDN pipeline that uploads generated images to the target CMS media library and replaces local references with CDN URLs. Expose an endpoint to retrieve the payload for any article, ready for publishing to any CMS adapter.

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `bridge/publishing/payload.js` | Universal Article Payload builder — assembles complete payload from article + metadata |
| CREATE | `bridge/publishing/image-pipeline.js` | Image CDN pipeline — upload to CMS media library, get URL, replace in HTML |
| CREATE | `bridge/publishing/payload-schema.json` | JSON Schema definition for the Universal Article Payload |
| MODIFY | `bridge/server.js` | Add `/api/publish/payload/:articleId` endpoint |
| CREATE | `tests/universal-payload.test.js` | Unit and integration tests |

## Sub-tasks

### Sub-task 1: Define Universal Article Payload Schema (~2h)
- Create `bridge/publishing/payload-schema.json` with the following structure:
  ```json
  {
    "version": "1.0",
    "article": {
      "id": "uuid",
      "title": "string",
      "slug": "string (auto-generated from title, URL-safe)",
      "html": "string (full article HTML body)",
      "text": "string (plain text version, stripped HTML)",
      "excerpt": "string (first 160 chars or meta description)",
      "wordCount": "number",
      "language": "string (ISO 639-1: en, ar, es, etc.)",
      "direction": "string (ltr | rtl)",
      "generatedAt": "ISO 8601 timestamp",
      "voiceProfileUsed": "string | null (persona name)"
    },
    "seo": {
      "metaTitle": "string (50-60 chars optimized)",
      "metaDescription": "string (145-154 chars)",
      "focusKeyword": "string",
      "secondaryKeywords": ["string[]"],
      "canonicalUrl": "string | null",
      "robots": "string (index,follow default)",
      "ogTitle": "string",
      "ogDescription": "string",
      "ogImage": "string (URL)",
      "ogType": "article",
      "twitterCard": "summary_large_image",
      "jsonLd": "object (Article schema.org structured data)"
    },
    "taxonomy": {
      "categories": ["string[] (suggested categories)"],
      "tags": ["string[] (10-15 tags)"],
      "author": "string (author name for byline)",
      "publishStatus": "draft"
    },
    "images": {
      "featured": {
        "url": "string (CDN URL after upload)",
        "alt": "string",
        "width": 1200,
        "height": 628,
        "mimeType": "image/webp"
      },
      "content": [
        {
          "url": "string",
          "alt": "string",
          "width": "number",
          "height": "number",
          "mimeType": "string",
          "placement": "string (after which heading/section)"
        }
      ]
    },
    "schema": {
      "article": "object (Article JSON-LD)",
      "faq": "object | null (FAQPage JSON-LD if FAQ section exists)",
      "howTo": "object | null (HowTo JSON-LD if applicable)",
      "breadcrumb": "object (BreadcrumbList JSON-LD)"
    },
    "quality": {
      "overallScore": "number (0-100)",
      "eeatGrade": "string (A-F)",
      "signals": "object (7-signal breakdown)",
      "checklistPassRate": "number (0-100)"
    },
    "metadata": {
      "pipelineJobId": "uuid",
      "generationTimeMs": "number",
      "revisionCount": "number (0-2)",
      "sourceResearchId": "uuid"
    }
  }
  ```
- Validate schema with JSON Schema draft-07 (built-in validation, no npm deps)

### Sub-task 2: Payload Builder (~2.5h)
- Create `bridge/publishing/payload.js` with `buildPayload(articleId)` function
- Fetches article record from `articles` table (HTML, metadata, quality scores)
- Assembles each section of the payload:
  - **article:** Extract title from H1 or stored title, generate slug, detect language and direction
  - **seo:** Extract meta tags from HTML head, generate JSON-LD for Article schema, generate og tags
  - **taxonomy:** Extract suggested categories from article metadata, generate tags from keyword analysis
  - **images:** List all images with alt text, dimensions, placement context
  - **schema:** Build Article, FAQ (if FAQ section detected), BreadcrumbList JSON-LD objects
  - **quality:** Include quality gate scores from QG-001/QG-002 (if available, otherwise null)
  - **metadata:** Pipeline job reference, timing, revision count
- Return validated payload object
- Validation: run payload against schema, log warnings for missing optional fields

### Sub-task 3: Image CDN Pipeline (~2h)
- Create `bridge/publishing/image-pipeline.js`
- `processImages(payload, targetPlatform, credentials)` function
- Pipeline steps:
  1. **Extract images from HTML:** Find all `<img>` tags, collect src attributes
  2. **For each image:**
     - If src is a local/relative path or data URI: needs upload
     - If src is already a remote URL: skip (already hosted)
  3. **Upload strategy per platform:**
     - WordPress: `POST /wp-json/wp/v2/media` with multipart form data
     - Shopify: Shopify Admin API file upload
     - Contentful: Asset upload via Management API
     - Generic: Upload to configured CDN endpoint (S3-compatible presigned URL pattern)
  4. **Replace in HTML:** Swap local src with returned CDN URL
  5. **Update payload:** Set `images.featured.url` and `images.content[].url` to CDN URLs
- Handle upload failures gracefully: log error, keep original src, add warning to payload metadata
- Support image format conversion: if platform prefers WebP, convert PNG/JPEG before upload (optional, skip if no native support)
- Concurrency: upload up to 3 images in parallel with `Promise.all` batching

### Sub-task 4: Payload Endpoint (~1.5h)
- Add `GET /api/publish/payload/:articleId` to `bridge/server.js`
- Auth required (Bearer token)
- Query params:
  - `?platform=wordpress|shopify|contentful|generic` (optional, affects image pipeline)
  - `?processImages=true|false` (default false — only process images when explicitly requested)
  - `?format=full|minimal` (minimal omits quality and metadata sections)
- Response: `{ success: true, payload: { ...universalPayload } }`
- If article not found: 404
- If article generation still in progress: 409 with `{ error: 'Article generation in progress' }`
- Rate limited (general bucket)

## Testing Strategy

### Unit Tests (`tests/universal-payload.test.js`)
- Test payload builder produces valid schema-compliant JSON
- Test slug generation from various titles (English, Arabic, special characters)
- Test language and direction detection (LTR for English, RTL for Arabic)
- Test JSON-LD generation for Article, FAQ, BreadcrumbList schemas
- Test image extraction from HTML (relative paths, data URIs, remote URLs)
- Test payload validation catches missing required fields
- Test minimal format omits quality and metadata

### Integration Tests
- Test `/api/publish/payload/:articleId` returns complete payload for a real article
- Test `?processImages=true` triggers image upload pipeline
- Test 404 for non-existent article
- Test 409 for in-progress article
- Test auth required

## Acceptance Criteria
- [ ] Universal Article Payload JSON schema defined with all required fields
- [ ] Payload builder assembles complete payload from article record and metadata
- [ ] Slug generated from title (URL-safe, handles Arabic transliteration)
- [ ] JSON-LD structured data generated for Article, FAQ (conditional), BreadcrumbList
- [ ] Image CDN pipeline uploads local images and replaces HTML src attributes
- [ ] Platform-specific upload strategies for WordPress, Shopify, Contentful, generic
- [ ] `/api/publish/payload/:articleId` returns validated payload
- [ ] Query params control platform, image processing, and format
- [ ] Zero npm dependencies
- [ ] All tests pass (`npm test`)

## Dependencies
- Blocked by: QG-001 (quality scores in payload), QG-002 (quality signals)
- Blocks: PB-002 (WordPress), PB-003 (Shopify), PB-004 (CMS adapters), PB-005 (dashboard)
