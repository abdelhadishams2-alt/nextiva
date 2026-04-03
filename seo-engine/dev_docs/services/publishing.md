# Publishing Service

> **Service #11** | **Layer 5** | **Priority: P1** | **Status: Planning**
> **Last Updated:** 2026-03-28
> **Depth:** DEEP spec (15 sections, implementation-ready)

---

## 1. Overview

The Publishing Service is ChainIQ's universal CMS delivery layer. It takes a generated, quality-gate-approved article and pushes it to any connected content management system — WordPress, Shopify, Contentful, Strapi, Ghost, Webflow, Sanity, or any custom endpoint via webhook. The core principle is **generate once, publish anywhere**: the article is produced once by the generation pipeline, scored once by the Quality Gate, and then transformed into the target platform's native format by platform-specific adapters.

### Architecture Philosophy: SaaS-Connected Thin Clients

All CMS plugins and apps are **thin SaaS-connected clients**. The intelligence, generation, scoring, and decision logic runs exclusively on the ChainIQ backend (Hetzner + Coolify). Plugins only handle three things: authentication handshake, content reception, and local CMS write operations. This architecture provides two critical benefits:

1. **IP Protection.** No proprietary algorithms ship in client-installable packages. The WordPress plugin contains zero generation logic, zero scoring logic, zero research logic. A competitor who decompiles the plugin learns nothing about ChainIQ's pipeline. The plugin is a receiver — like a mailbox, not a post office.

2. **Update Independence.** When ChainIQ improves its generation pipeline, scoring rubric, or SEO analysis, every connected CMS benefits immediately — no plugin update required. The Universal Article Payload contract is the only interface between the backend and all clients. As long as the payload schema is stable, backend improvements propagate automatically.

### The Publishing Contract

The Publishing Service sits between two hard boundaries:

- **Upstream boundary:** The Quality Gate. No article can be published unless `quality_scores.passed = true`. The Publishing Service checks this on every push request and rejects articles that have not cleared the gate. This is non-negotiable — it is the quality floor that separates ChainIQ from commodity AI writers.

- **Downstream boundary:** The CMS API. Each platform has its own API quirks, rate limits, authentication models, content sanitization rules, and media handling. The Publishing Service absorbs all of this complexity behind a uniform interface. The user clicks "Publish to WordPress" and gets a draft post with SEO meta, featured image, categories, and tags. They do not need to understand `wp_kses_post`, Application Passwords, or Yoast meta keys.

### Draft-First Philosophy

Every publish operation creates content as a **draft** by default. This is a deliberate product decision driven by three user research findings:

1. **Elena (WordPress agency dev)** needs to review content in the CMS editor before it goes live. Her clients require editorial approval in WordPress, not in an external tool.
2. **Sarah (Shopify store owner)** wants to add product-specific details and verify product links before publishing blog posts.
3. **Rachel (e-commerce)** needs to check that product references are correct and images display properly on the storefront theme.

The user can override draft status to `scheduled` or `published` in the publish modal, but the default is always draft. ChainIQ generates content — humans decide when it goes live.

### Multi-Platform Publishing Flow

```
Article Approved (Quality Gate passed)
    │
    ├──► User clicks "Publish to WordPress"
    │     │
    │     ├── ChainIQ backend builds Universal Article Payload
    │     ├── Backend calls WordPress plugin endpoint (/wp-json/chainiq/v1/receive)
    │     ├── Plugin creates draft via wp_insert_post()
    │     ├── Plugin uploads featured image to Media Library
    │     ├── Plugin sets Yoast/RankMath SEO meta
    │     ├── Plugin creates/assigns categories and tags
    │     └── Returns post ID + edit URL to ChainIQ
    │
    ├──► User clicks "Publish to Shopify"
    │     │
    │     ├── Backend calls Shopify Blog API directly (REST Admin API)
    │     ├── Creates unpublished blog article with HTML content
    │     ├── Uploads images via Shopify Files API
    │     ├── Injects product references as linked mentions
    │     ├── Sets SEO metafields (title_tag, description_tag)
    │     └── Returns article ID + edit URL to ChainIQ
    │
    ├──► User clicks "Publish to [Headless CMS]"
    │     │
    │     ├── Backend calls CMS Management API (Contentful/Strapi/Ghost/Webflow/Sanity)
    │     ├── Creates entry/document in draft state
    │     ├── Uploads media assets to CMS media library
    │     ├── Maps taxonomy to CMS-native fields
    │     └── Returns entry ID + edit URL
    │
    └──► User clicks "Send to Webhook"
          │
          ├── Backend POSTs full Universal Article Payload as JSON
          ├── Signs payload with HMAC-SHA256 (X-ChainIQ-Signature header)
          ├── Retries on 5xx with exponential backoff
          └── Returns webhook response to ChainIQ
```

### What This Service Does NOT Do

- **Does not generate content.** That is the Article Pipeline (Service #3).
- **Does not score content.** That is the Quality Gate (Service #10).
- **Does not track post-publish performance.** That is the Feedback Loop (Service #12).
- **Does not manage CMS user accounts.** It manages ChainIQ-to-CMS connections, not CMS internal users.
- **Does not auto-publish.** It creates drafts. The user promotes to published status in their CMS.

---

## 2. Entities & Data Model

### platform_connections

Represents a connected CMS platform for a specific ChainIQ user. One user can have multiple connections (e.g., two WordPress sites and one Shopify store).

| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, default gen_random_uuid() | Primary key |
| user_id | UUID | FK auth.users, NOT NULL | Owning user |
| platform | text | NOT NULL, CHECK IN ('wordpress', 'shopify', 'contentful', 'strapi', 'ghost', 'webflow', 'sanity', 'webhook') | Platform type |
| site_url | text | NOT NULL | Target site URL (e.g., `https://example.com`) |
| display_name | text | | Human-friendly name (e.g., "Main Blog", "Store Blog") |
| api_key_hash | text | | SHA-256 hash of the ChainIQ-issued API key (for lookup, not decryption) |
| api_key_encrypted | text | | AES-256-GCM encrypted API key (ChainIQ-issued key for WP plugin; CMS API credentials for other platforms) |
| oauth_token_encrypted | text | | AES-256-GCM encrypted OAuth access token (Shopify, Contentful, Webflow) |
| oauth_refresh_token_encrypted | text | | AES-256-GCM encrypted refresh token where applicable |
| oauth_expires_at | timestamptz | | Token expiration timestamp |
| webhook_secret | text | | HMAC-SHA256 secret for webhook signature verification (generated per connection) |
| status | text | NOT NULL, DEFAULT 'pending_verification', CHECK IN ('active', 'disconnected', 'error', 'pending_verification', 'auth_expired') | Connection health status |
| capabilities | JSONB | NOT NULL, DEFAULT '{}' | What the platform supports. Structure: `{ categories: bool, tags: bool, featuredImage: bool, seoMeta: bool, schema: bool, customFields: bool, scheduling: bool, productReferences: bool }` |
| platform_version | text | | Detected CMS version (e.g., "6.7.1" for WP, "2024-01" for Shopify API) |
| seo_plugin | text | | Detected SEO plugin for WordPress: 'yoast', 'rankmath', 'aioseo', 'seopress', null |
| last_health_check_at | timestamptz | | Last successful connectivity ping |
| last_push_at | timestamptz | | Last successful article publish |
| last_error | text | | Last error message (null if healthy) |
| error_count | integer | DEFAULT 0 | Consecutive error count (resets on success) |
| metadata | JSONB | DEFAULT '{}' | Platform-specific config: WP admin URL, Shopify shop ID, Contentful space_id, Strapi URL, Ghost admin URL, Webflow site_id, Sanity project_id + dataset |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

**RLS Policies:**
```sql
-- Users see only their own connections
CREATE POLICY "users_own_connections" ON platform_connections
  FOR ALL USING (auth.uid() = user_id);

-- Admin can view all connections (for support/debugging)
CREATE POLICY "admin_all_connections" ON platform_connections
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );
```

**Indexes:**
```sql
CREATE INDEX idx_platform_connections_user ON platform_connections (user_id);
CREATE INDEX idx_platform_connections_status ON platform_connections (status) WHERE status != 'disconnected';
CREATE INDEX idx_platform_connections_api_key_hash ON platform_connections (api_key_hash) WHERE api_key_hash IS NOT NULL;
CREATE UNIQUE INDEX idx_platform_connections_unique_site ON platform_connections (user_id, platform, site_url);
```

The unique index on `(user_id, platform, site_url)` prevents duplicate connections. A user cannot connect the same WordPress site twice — they must disconnect and reconnect.

### publish_records

Tracks every publish attempt — successful or failed. This table is the audit trail for all publishing activity. It is append-only for attempts (status transitions update in place).

| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK, default gen_random_uuid() | Primary key |
| user_id | UUID | FK auth.users, NOT NULL | Owning user |
| article_id | UUID | FK articles, NOT NULL | Source article |
| platform_connection_id | UUID | FK platform_connections, NOT NULL | Target platform connection |
| platform | text | NOT NULL | Denormalized from connection: `wordpress`, `shopify`, etc. |
| status | text | NOT NULL, DEFAULT 'queued', CHECK IN ('queued', 'uploading_images', 'pushing', 'published', 'failed', 'retrying', 'cancelled') | Current publish state |
| remote_id | text | | ID of the created post/entry on the target CMS (e.g., WP post ID "4821", Shopify article GID) |
| remote_url | text | | Public URL of the published content on the target CMS |
| remote_edit_url | text | | Admin/editor URL for the created content (e.g., WP admin edit link) |
| payload_version | integer | NOT NULL, DEFAULT 1 | Version of the Universal Article Payload schema used |
| payload_hash | text | NOT NULL | SHA-256 of the Universal Article Payload JSON (for deduplication and audit) |
| content_hash | text | NOT NULL | SHA-256 of just the content_html (for drift detection post-publish) |
| push_attempts | integer | NOT NULL, DEFAULT 0 | Number of push attempts (max 3 for auto-retry) |
| images_uploaded | integer | DEFAULT 0 | Number of images successfully uploaded to CMS media library |
| images_failed | integer | DEFAULT 0 | Number of images that failed to upload |
| seo_meta_set | boolean | DEFAULT false | Whether SEO metadata was successfully set |
| categories_set | text[] | | Categories that were assigned on the CMS |
| tags_set | text[] | | Tags that were assigned on the CMS |
| error_log | JSONB | DEFAULT '[]' | Array of error objects: `[{ attempt: 1, error: "timeout", code: "ETIMEDOUT", timestamp: "...", recoverable: true }]` |
| published_at | timestamptz | | When the draft was created on the CMS (not when it went live — that is CMS-side) |
| duration_ms | integer | | Total time from queued to published (or failed), in milliseconds |
| metadata | JSONB | DEFAULT '{}' | Response data from CMS API, image upload results, platform-specific data |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

**RLS Policies:**
```sql
CREATE POLICY "users_own_records" ON publish_records
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "admin_all_records" ON publish_records
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );
```

**Indexes:**
```sql
CREATE INDEX idx_publish_records_user_created ON publish_records (user_id, created_at DESC);
CREATE INDEX idx_publish_records_article ON publish_records (article_id);
CREATE INDEX idx_publish_records_connection_status ON publish_records (platform_connection_id, status);
CREATE INDEX idx_publish_records_payload_hash ON publish_records (payload_hash);
CREATE INDEX idx_publish_records_status ON publish_records (status) WHERE status IN ('queued', 'pushing', 'retrying');
```

The `payload_hash` index enables fast duplicate detection. Before pushing, the service checks whether an identical payload was already pushed to the same connection. If found, it warns the user and requires `force: true` to proceed.

### image_upload_log

Tracks individual image uploads during the publish process. Separated from publish_records because a single publish can involve 1-20+ images, and each can succeed or fail independently.

| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | UUID | PK | Primary key |
| publish_record_id | UUID | FK publish_records, NOT NULL | Parent publish record |
| source_url | text | NOT NULL | ChainIQ CDN URL of the original image |
| target_url | text | | URL after upload to CMS media library (null if failed) |
| cms_media_id | text | | CMS-native media ID (WP attachment ID, Shopify file GID, etc.) |
| image_type | text | NOT NULL, CHECK IN ('featured', 'content', 'og_image') | Role of this image |
| file_size_bytes | integer | | Size of the uploaded file |
| mime_type | text | | MIME type (image/jpeg, image/png, image/webp) |
| status | text | NOT NULL, CHECK IN ('pending', 'uploading', 'uploaded', 'failed', 'skipped') | Upload status |
| error | text | | Error message if failed |
| duration_ms | integer | | Upload duration |
| created_at | timestamptz | DEFAULT now() | |

**Index:** `(publish_record_id)` for fetching all images for a publish record.

### Migration Files

```
migrations/014-platform-connections.sql    — platform_connections table + RLS + indexes
migrations/015-publish-records.sql         — publish_records table + image_upload_log + RLS + indexes
```

### Entity Relationships

```
auth.users (1) ──── (N) platform_connections
auth.users (1) ──── (N) publish_records
articles   (1) ──── (N) publish_records
platform_connections (1) ──── (N) publish_records
publish_records (1) ──── (N) image_upload_log
quality_scores (1) ──── (1) articles  ← checked before publish is allowed
```

---

## 3. API Endpoints

### Endpoint Summary

| Method | Path | Auth | Rate Limit | Description |
| --- | --- | --- | --- | --- |
| POST | `/api/publish/wordpress/push` | User | 10/min | Push article to WordPress |
| POST | `/api/publish/shopify/push` | User | 10/min | Push article to Shopify blog |
| POST | `/api/publish/contentful/push` | User | 10/min | Push article to Contentful |
| POST | `/api/publish/strapi/push` | User | 10/min | Push article to Strapi |
| POST | `/api/publish/ghost/push` | User | 10/min | Push article to Ghost |
| POST | `/api/publish/webflow/push` | User | 10/min | Push article to Webflow |
| POST | `/api/publish/sanity/push` | User | 10/min | Push article to Sanity |
| POST | `/api/publish/webhook` | User | 10/min | Send payload to custom webhook |
| GET | `/api/publish/status/:articleId` | User | 60/min | Get publish history for article |
| GET | `/api/publish/platforms` | User | 60/min | List connected platforms |
| POST | `/api/publish/platforms/connect` | User | 5/min | Register new platform connection |
| DELETE | `/api/publish/platforms/:id` | User | 5/min | Disconnect a platform |
| POST | `/api/publish/platforms/:id/test` | User | 10/min | Test platform connectivity |
| POST | `/api/publish/platforms/:id/refresh` | User | 5/min | Refresh OAuth token |
| GET | `/api/publish/platforms/:id/capabilities` | User | 30/min | Detect platform capabilities |

### POST `/api/publish/wordpress/push`

Pushes a quality-gate-approved article to a connected WordPress site. The ChainIQ backend assembles the Universal Article Payload, then calls the WordPress site's ChainIQ Connector plugin endpoint (`/wp-json/chainiq/v1/receive`). The plugin handles all local CMS operations.

**Pre-conditions checked server-side (in order):**
1. User is authenticated (Bearer token valid)
2. `platform_connection_id` belongs to the authenticated user
3. Connection status is `active` (not `error`, `disconnected`, or `auth_expired`)
4. Article exists and belongs to the authenticated user
5. Quality Gate has been passed (`quality_scores.passed = true` for this article)
6. Duplicate check: no existing `publish_records` entry with same `payload_hash` and same `platform_connection_id` (unless `force: true`)
7. Platform health check: ping the WordPress site's `/wp-json/chainiq/v1/status` endpoint

**Request body:**
```json
{
  "article_id": "550e8400-e29b-41d4-a716-446655440000",
  "platform_connection_id": "660e8400-e29b-41d4-a716-446655440001",
  "post_status": "draft",
  "post_type": "post",
  "categories": ["BMW Maintenance", "Engine"],
  "tags": ["N54", "HPFP", "fuel pump"],
  "set_featured_image": true,
  "set_seo_meta": true,
  "author_id": null,
  "force": false
}
```

| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| article_id | UUID | Yes | | ChainIQ article to publish |
| platform_connection_id | UUID | Yes | | Target WordPress connection |
| post_status | string | No | "draft" | "draft", "pending", "scheduled" |
| post_type | string | No | "post" | "post" or any registered custom post type |
| categories | string[] | No | [] | Category names (created if not existing) |
| tags | string[] | No | [] | Tag names (created if not existing) |
| set_featured_image | boolean | No | true | Upload and set featured image |
| set_seo_meta | boolean | No | true | Auto-fill Yoast/RankMath/AIOSEO meta |
| author_id | integer | No | null | WP user ID for post author (null = default from plugin settings) |
| scheduled_at | ISO 8601 | No | null | If post_status is "scheduled", the publish date |
| force | boolean | No | false | Override duplicate detection |

**Response (200) — Successful push:**
```json
{
  "success": true,
  "data": {
    "publish_record_id": "770e8400-e29b-41d4-a716-446655440002",
    "status": "published",
    "remote_id": "4821",
    "remote_url": "https://example.com/?p=4821",
    "remote_edit_url": "https://example.com/wp-admin/post.php?post=4821&action=edit",
    "images_uploaded": 5,
    "images_failed": 0,
    "seo_meta_set": true,
    "seo_plugin_detected": "yoast",
    "categories_set": ["BMW Maintenance", "Engine"],
    "tags_set": ["N54", "HPFP", "fuel pump"],
    "duration_ms": 8432,
    "published_at": "2026-03-28T14:30:00Z"
  }
}
```

**Error responses:**

| Status | Code | Condition |
| --- | --- | --- |
| 400 | `MISSING_FIELD` | Required field missing from request body |
| 401 | `UNAUTHORIZED` | Bearer token invalid or expired |
| 403 | `NOT_OWNER` | Connection or article does not belong to user |
| 409 | `DUPLICATE_PAYLOAD` | Same payload_hash already pushed to this connection (use `force: true`) |
| 422 | `QUALITY_GATE_NOT_PASSED` | Article has not passed Quality Gate. Includes current score. |
| 422 | `CONNECTION_NOT_ACTIVE` | Platform connection is in error or disconnected state |
| 502 | `CMS_UNREACHABLE` | WordPress site did not respond within timeout |
| 502 | `CMS_ERROR` | WordPress plugin returned an error (includes plugin error message) |
| 503 | `PUBLISH_QUEUE_FULL` | Publish queue has too many pending jobs (backpressure) |

### POST `/api/publish/shopify/push`

Pushes an article to a connected Shopify store's blog via the Admin REST API.

**Request body:**
```json
{
  "article_id": "550e8400-e29b-41d4-a716-446655440000",
  "platform_connection_id": "660e8400-e29b-41d4-a716-446655440001",
  "blog_id": "gid://shopify/Blog/123456",
  "published": false,
  "tags": ["running shoes", "gear guide"],
  "product_references": ["gid://shopify/Product/789", "gid://shopify/Product/012"],
  "author": "Store Admin",
  "set_seo_meta": true,
  "force": false
}
```

| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| article_id | UUID | Yes | | ChainIQ article |
| platform_connection_id | UUID | Yes | | Target Shopify connection |
| blog_id | string | No | null | Shopify blog GID (null = default/first blog) |
| published | boolean | No | false | false = hidden draft, true = live |
| tags | string[] | No | [] | Shopify article tags (comma-joined internally) |
| product_references | string[] | No | [] | Shopify product GIDs to reference in content |
| author | string | No | null | Author name (null = default from app settings) |
| set_seo_meta | boolean | No | true | Set metafields_global_title_tag and description_tag |
| force | boolean | No | false | Override duplicate detection |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "publish_record_id": "770e8400-e29b-41d4-a716-446655440003",
    "status": "published",
    "remote_id": "gid://shopify/Article/345678",
    "remote_url": "https://store.myshopify.com/blogs/news/n54-hpfp-failure-symptoms",
    "remote_edit_url": "https://admin.shopify.com/store/mystore/articles/345678",
    "images_uploaded": 3,
    "images_failed": 0,
    "seo_meta_set": true,
    "products_referenced": 2,
    "duration_ms": 5210,
    "published_at": "2026-03-28T14:32:00Z"
  }
}
```

### POST `/api/publish/webhook`

Sends the full Universal Article Payload to any custom HTTP endpoint. The payload is signed with HMAC-SHA256 so the receiver can verify authenticity.

**Request body:**
```json
{
  "article_id": "550e8400-e29b-41d4-a716-446655440000",
  "platform_connection_id": "660e8400-e29b-41d4-a716-446655440001",
  "include_images_base64": false,
  "custom_headers": {
    "X-Custom-Auth": "token123",
    "X-Environment": "production"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "publish_record_id": "770e8400-e29b-41d4-a716-446655440004",
    "status": "published",
    "webhook_response_status": 201,
    "webhook_response_body": { "id": "custom-123", "url": "/articles/n54-hpfp" },
    "duration_ms": 1240,
    "published_at": "2026-03-28T14:35:00Z"
  }
}
```

### GET `/api/publish/status/:articleId`

Returns the full publish history for an article across all platforms. Ordered by created_at descending.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "article_id": "550e8400-e29b-41d4-a716-446655440000",
    "article_title": "N54 HPFP Failure Symptoms and Solutions",
    "quality_gate_passed": true,
    "quality_score": 8.4,
    "publishes": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "platform": "wordpress",
        "site_url": "https://example.com",
        "display_name": "Main Blog",
        "status": "published",
        "remote_url": "https://example.com/n54-hpfp-failure-symptoms/",
        "remote_edit_url": "https://example.com/wp-admin/post.php?post=4821&action=edit",
        "images_uploaded": 5,
        "seo_meta_set": true,
        "duration_ms": 8432,
        "published_at": "2026-03-28T14:30:00Z"
      },
      {
        "id": "770e8400-e29b-41d4-a716-446655440003",
        "platform": "shopify",
        "site_url": "https://store.myshopify.com",
        "display_name": "Store Blog",
        "status": "failed",
        "error": "Blog ID not found — the specified blog may have been deleted",
        "push_attempts": 3,
        "error_log": [
          { "attempt": 1, "error": "Blog ID not found", "timestamp": "2026-03-28T14:32:00Z" },
          { "attempt": 2, "error": "Blog ID not found", "timestamp": "2026-03-28T14:32:35Z" },
          { "attempt": 3, "error": "Blog ID not found", "timestamp": "2026-03-28T14:33:40Z" }
        ],
        "last_attempt_at": "2026-03-28T14:33:40Z"
      }
    ],
    "total_publishes": 2,
    "successful_platforms": ["wordpress"],
    "failed_platforms": ["shopify"]
  }
}
```

### GET `/api/publish/platforms`

Lists all connected platforms for the authenticated user with health status and publish stats.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "platforms": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "platform": "wordpress",
        "site_url": "https://example.com",
        "display_name": "Main Blog",
        "status": "active",
        "platform_version": "6.7.1",
        "seo_plugin": "yoast",
        "capabilities": {
          "categories": true, "tags": true, "featuredImage": true,
          "seoMeta": true, "schema": true, "customFields": true,
          "scheduling": true, "productReferences": false
        },
        "last_push_at": "2026-03-28T14:30:00Z",
        "last_health_check_at": "2026-03-28T14:25:00Z",
        "articles_published": 47,
        "error_count": 0
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440002",
        "platform": "shopify",
        "site_url": "https://store.myshopify.com",
        "display_name": "Store Blog",
        "status": "active",
        "platform_version": "2024-01",
        "capabilities": {
          "categories": false, "tags": true, "featuredImage": true,
          "seoMeta": true, "schema": false, "customFields": false,
          "scheduling": false, "productReferences": true
        },
        "last_push_at": "2026-03-25T10:00:00Z",
        "articles_published": 12,
        "error_count": 0
      }
    ],
    "total": 2
  }
}
```

### POST `/api/publish/platforms/connect`

Registers a new platform connection. For WordPress, this validates the API key against the plugin. For Shopify, this initiates OAuth. For headless CMS platforms, this validates API credentials.

**Request body (WordPress):**
```json
{
  "platform": "wordpress",
  "site_url": "https://example.com",
  "display_name": "Main Blog",
  "api_key": "ciq_wp_a1b2c3d4e5f6..."
}
```

**Request body (Shopify — initiates OAuth):**
```json
{
  "platform": "shopify",
  "site_url": "https://store.myshopify.com",
  "display_name": "Store Blog"
}
```

**Response (200 for WordPress):**
```json
{
  "success": true,
  "data": {
    "connection_id": "660e8400-e29b-41d4-a716-446655440001",
    "status": "active",
    "platform_version": "6.7.1",
    "seo_plugin": "yoast",
    "capabilities": { "categories": true, "tags": true, "featuredImage": true, "seoMeta": true }
  }
}
```

**Response (200 for Shopify — returns OAuth URL):**
```json
{
  "success": true,
  "data": {
    "connection_id": "660e8400-e29b-41d4-a716-446655440002",
    "status": "pending_verification",
    "oauth_url": "https://store.myshopify.com/admin/oauth/authorize?client_id=...&scope=...&redirect_uri=..."
  }
}
```

### DELETE `/api/publish/platforms/:id`

Disconnects a platform. Does NOT delete publish records — they are historical audit data. Marks the connection as `disconnected`. The CMS-side plugin/app remains installed but loses the ability to receive pushes.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "connection_id": "660e8400-e29b-41d4-a716-446655440001",
    "status": "disconnected",
    "articles_published": 47,
    "message": "WordPress connection disconnected. Published articles remain on the CMS. Re-connect any time from the Connections page."
  }
}
```

### POST `/api/publish/platforms/:id/test`

Tests connectivity to a connected platform. Does NOT transmit any article data. Only pings the CMS endpoint and verifies authentication.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reachable": true,
    "auth_valid": true,
    "latency_ms": 342,
    "platform_version": "6.7.1",
    "seo_plugin": "yoast",
    "php_version": "8.2.0",
    "plugin_version": "1.0.0"
  }
}
```

**Response (200 — reachable but auth failed):**
```json
{
  "success": true,
  "data": {
    "reachable": true,
    "auth_valid": false,
    "latency_ms": 289,
    "error": "API key rejected — key may have been regenerated in WordPress admin"
  }
}
```

---

## 4. Business Rules

### BR-1: Draft-First Publishing (Non-Negotiable)

All articles are published as **draft** by default. The user can override to `pending` (WordPress pending review), `scheduled` (with a future date), or in exceptional cases `published` (live immediately). The default cannot be changed at the system level — it is hardcoded as the safe default in every adapter.

**Rationale:** User research with Elena, Sarah, and Rachel unanimously confirmed that human review before going live is mandatory for their workflows. Auto-publishing AI content is a reputational risk for enterprise publishers.

### BR-2: Quality Gate Enforcement

No article can be published unless `quality_scores.passed = true` for the most recent revision. The Publishing Service queries the quality_scores table before every push. If the article has not been scored, or has been scored but failed, the publish request is rejected with HTTP 422 and a message including the current score.

**Enforcement point:** Server-side only. The dashboard disables the Publish button client-side for UX, but the hard enforcement is in the bridge endpoint. A direct API call without passing the Quality Gate is still blocked.

### BR-3: Image Upload Before Article

Images are uploaded to the CMS media library **before** the article is created. This ensures that:
1. The featured image attachment ID is available for `wp_insert_post()` in WordPress
2. Content HTML can be rewritten with CMS-hosted image URLs before the article body is submitted
3. If image upload fails, the article can still be created without images (degraded but functional)

**Sequence:** Upload featured image first (it blocks the article creation), then upload content images in parallel (up to 5 concurrent), then create the article with all URLs rewritten.

### BR-4: Automatic SEO Meta Detection and Fill

When pushing to WordPress, the Publishing Service detects which SEO plugin is active (Yoast, RankMath, All-in-One SEO, SEOPress, or none) and fills the appropriate meta fields. Detection happens during the connection health check, not during publish — the detected plugin is cached in `platform_connections.seo_plugin`.

| SEO Plugin | Meta Title Key | Meta Description Key | Focus Keyword Key |
| --- | --- | --- | --- |
| Yoast SEO | `_yoast_wpseo_title` | `_yoast_wpseo_metadesc` | `_yoast_wpseo_focuskw` |
| RankMath | `rank_math_title` | `rank_math_description` | `rank_math_focus_keyword` |
| All-in-One SEO | `_aioseo_title` | `_aioseo_description` | `_aioseo_keyphrases` (JSON) |
| SEOPress | `_seopress_titles_title` | `_seopress_titles_desc` | N/A (no focus keyword field) |
| None | Skip | Skip | Skip |

If no SEO plugin is detected, the adapter skips SEO meta silently and logs an info-level message. It does NOT set raw `<meta>` tags in post_content — that would conflict if the user later installs an SEO plugin.

### BR-5: Retry on Transient Failure

Transient failures (network timeout, 5xx from CMS, rate limit) trigger automatic retry with exponential backoff:

| Attempt | Delay | Total elapsed |
| --- | --- | --- |
| 1 (initial) | 0s | 0s |
| 2 (first retry) | 5s | 5s |
| 3 (second retry) | 30s | 35s |
| 4 (final retry) | 120s | 155s |

After 4 attempts (1 initial + 3 retries), the publish record is marked as `failed` and the user is notified via dashboard notification and optionally via webhook (`publish.failed` event).

**Non-retriable errors** (4xx from CMS, validation failures, auth errors) are NOT retried. They fail immediately.

### BR-6: Platform Health Check Before Publish

Before initiating a publish, the service pings the target platform to verify:
1. The endpoint is reachable (HTTP 200 within 10 seconds)
2. Authentication credentials are valid
3. The platform version is still compatible

If the health check fails, the publish is rejected immediately with a descriptive error rather than queuing a job that will inevitably fail.

### BR-7: Duplicate Publish Detection

Before pushing, the service computes the SHA-256 hash of the Universal Article Payload and checks for an existing `publish_records` entry with the same `payload_hash` targeting the same `platform_connection_id`. If found:
- Return HTTP 409 with the existing publish record details
- The user can override with `force: true` to push anyway (use case: article was deleted on CMS and needs re-push)

### BR-8: Category and Tag Auto-Creation

When publishing to platforms that support taxonomy (WordPress, Ghost), the adapter checks if the specified categories and tags exist on the CMS. If they do not exist, the adapter creates them automatically using the CMS API. Categories are created as top-level (no parent hierarchy) unless the user specifies a parent in the publish request. Tags are always flat.

### BR-9: Canonical URL Management

When the same article is published to multiple platforms, the Publishing Service sets the canonical URL on all non-primary platforms to point to the first platform where the article was published. This prevents duplicate content SEO issues from syndication.

**Example:** Article published to WordPress first (canonical = WordPress URL), then to Shopify. The Shopify article's SEO metafield includes `canonical_url` pointing to the WordPress version.

### BR-10: Connection Health Degradation

When a platform connection accumulates 3 consecutive failed publish attempts (across any articles), the connection status is automatically downgraded to `error`. The user sees a warning banner on the Connections page. The connection remains usable (not blocked), but the dashboard shows the error state prominently.

When a successful publish occurs, `error_count` resets to 0 and status returns to `active`.

### BR-11: Rate Limiting Per Platform

Each platform has its own API rate limits that the Publishing Service respects:

| Platform | Rate Limit | ChainIQ Throttle | Implementation |
| --- | --- | --- | --- |
| WordPress (plugin) | No hard limit (self-hosted) | 5 req/s max | Throttle via delay queue |
| Shopify REST API | 2 req/s per store | 1.5 req/s | Token bucket per connection |
| Contentful Management API | 10 req/s | 7 req/s | Token bucket |
| Strapi | No hard limit (self-hosted) | 5 req/s | Throttle via delay queue |
| Ghost Admin API | No hard limit | 5 req/s | Throttle via delay queue |
| Webflow CMS API | 60 req/min | 40 req/min | Sliding window |
| Sanity | 25 req/s | 15 req/s | Token bucket |

ChainIQ always stays below the platform's limit with a safety margin to avoid triggering rate limit responses.

### BR-12: Content Sanitization Awareness

Each CMS sanitizes HTML differently. The Publishing Service is aware of these differences and pre-processes content accordingly:

- **WordPress:** `wp_kses_post()` strips `style` attributes, `data-*` attributes, `class` on some elements, `<script>` tags, and inline event handlers. The WordPress plugin temporarily disables kses via `kses_remove_filters()` during insert, then re-enables it. This preserves ChainIQ's structured HTML.
- **Shopify:** Blog API accepts raw HTML with minimal sanitization. Tables, custom classes, and inline styles are preserved.
- **Ghost:** Accepts HTML format directly. No kses-style stripping.
- **Webflow:** Converts HTML to Webflow rich text format. Many HTML features (tables, custom classes, data attributes) are lost. The adapter simplifies HTML before sending.
- **Contentful:** Stores structured content, not raw HTML. The adapter converts HTML to Contentful rich text JSON.
- **Sanity:** Stores portable text. The adapter converts HTML to Sanity's block content format.

### BR-13: Publish Window Restrictions

Enterprise users can configure publish windows (e.g., "only publish on weekdays between 9am-5pm Gulf Standard Time"). If a publish request falls outside the configured window, it is queued and will execute at the next window opening. This prevents accidental off-hours publishing for organizations with editorial calendars.

### BR-14: Single Article, Multiple Destinations

A single article can be published to multiple platforms simultaneously. The dashboard "Publish" modal allows selecting multiple connections. Each publish is tracked as a separate `publish_records` entry. Failures on one platform do not affect other platforms — each push is independent.

---

## 5. Universal Article Payload

The Universal Article Payload is the canonical JSON format produced by the generation pipeline and consumed by all platform adapters. It is the contract between the Quality Gate output and the Publishing Service input. Every adapter — WordPress, Shopify, Contentful, Ghost, Webflow, Sanity, webhook — receives this exact same structure and transforms it into the target platform's native format.

### Full Schema Definition

```javascript
{
  // === IDENTIFICATION ===
  article_id: "550e8400-e29b-41d4-a716-446655440000",   // UUID, required
  version: 1,                                             // Integer, auto-incremented on re-generation
  payload_schema_version: "1.0.0",                        // Semver, for future schema migrations

  // === CONTENT ===
  title: "N54 HPFP Failure Symptoms and Solutions",       // Plain text, required, max 200 chars
  slug: "n54-hpfp-failure-symptoms-solutions",            // URL-safe, required, auto-generated from title
  content_html: "<article>...</article>",                  // Full HTML article body, required
  content_text: "Plain text version of the article...",    // Stripped HTML, for platforms that need plain text
  excerpt: "Learn to identify the 7 key symptoms...",      // 1-2 sentence summary, max 300 chars
  word_count: 2847,                                        // Computed from content_text
  reading_time_minutes: 12,                                // Computed at 238 words/minute

  // === AUTHOR ===
  author: {
    name: "Mike T.",                                       // Display name
    bio: "BMW specialist with 15 years of experience",     // Optional author bio
    avatar_url: null,                                      // Optional avatar image URL
    url: null                                              // Optional author page URL
  },

  // === SEO METADATA ===
  seo: {
    title: "N54 HPFP Failure Symptoms — 7 Signs Your Fuel Pump Is Dying",   // SEO title, max 60 chars
    meta_description: "Diagnose N54 high-pressure fuel pump failure with these 7 symptoms. Covers limp mode, long cranks, misfires, and replacement costs.",  // Max 160 chars
    focus_keyphrase: "N54 HPFP failure symptoms",          // Primary target keyword
    secondary_keyphrases: ["N54 fuel pump problems", "BMW HPFP replacement"],  // Supporting keywords
    canonical_url: null,                                    // Null = self-referencing, or URL string for syndication
    robots: "index, follow",                                // Robots directive
    og_title: "N54 HPFP Failure Symptoms — 7 Signs Your Fuel Pump Is Dying",
    og_description: "Diagnose N54 high-pressure fuel pump failure with these 7 symptoms.",
    og_image: "https://cdn.chainiq.io/images/550e8400/featured.jpg",
    og_type: "article",
    twitter_card: "summary_large_image",
    twitter_title: null,                                    // Null = use og_title
    twitter_description: null                               // Null = use og_description
  },

  // === TAXONOMY ===
  taxonomy: {
    categories: [
      { name: "BMW Maintenance", slug: "bmw-maintenance", parent: null },
      { name: "Engine", slug: "engine", parent: "BMW Maintenance" }
    ],
    tags: ["N54", "HPFP", "fuel pump", "BMW", "engine problems", "high pressure fuel pump"],
    content_type: "article",                                // "article", "guide", "review", "comparison", "listicle"
    topic_cluster: "BMW N54 Engine Problems",               // Parent topic cluster for internal linking
    pillar_article_id: null                                 // UUID of pillar article if this is a cluster article
  },

  // === IMAGES ===
  images: {
    featured: {
      url: "https://cdn.chainiq.io/images/550e8400/featured.jpg",
      alt: "N54 high-pressure fuel pump showing visible signs of failure and corrosion",
      title: "N54 HPFP Failure",                            // Image title attribute
      width: 1200,
      height: 628,
      file_size_bytes: 187432,
      mime_type: "image/jpeg",
      filename: "n54-hpfp-failure-symptoms-featured.jpg",
      credit: null,                                          // Image credit/attribution if applicable
      caption: null                                          // Image caption
    },
    content: [
      {
        url: "https://cdn.chainiq.io/images/550e8400/img-1.jpg",
        alt: "N54 HPFP location in engine bay — view from above with intake manifold removed",
        title: "HPFP Engine Bay Location",
        width: 800,
        height: 600,
        file_size_bytes: 142890,
        mime_type: "image/jpeg",
        filename: "n54-hpfp-engine-bay-location.jpg",
        placement_hint: "after_h2_1",                        // Hint for adapters: place after 1st H2
        credit: null,
        caption: "The HPFP is located on the rear of the engine, accessible after removing the intake manifold."
      },
      {
        url: "https://cdn.chainiq.io/images/550e8400/img-2.jpg",
        alt: "OBD2 scanner showing P0087 fuel rail pressure too low code",
        title: "P0087 Fuel Rail Code",
        width: 800,
        height: 600,
        file_size_bytes: 98210,
        mime_type: "image/jpeg",
        filename: "n54-p0087-obd2-code.jpg",
        placement_hint: "after_h2_3",
        credit: null,
        caption: "Code P0087 is the most common diagnostic trouble code associated with HPFP failure."
      }
    ],
    og_image: {
      url: "https://cdn.chainiq.io/images/550e8400/og.jpg",
      width: 1200,
      height: 630,
      mime_type: "image/jpeg"
    }
  },

  // === SCHEMA MARKUP ===
  schema: {
    article_schema: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "N54 HPFP Failure Symptoms and Solutions",
      "description": "Diagnose N54 high-pressure fuel pump failure with these 7 symptoms.",
      "author": { "@type": "Person", "name": "Mike T." },
      "datePublished": "2026-03-28T14:22:00Z",
      "image": "https://cdn.chainiq.io/images/550e8400/featured.jpg",
      "publisher": {
        "@type": "Organization",
        "name": "Example Auto Blog",
        "logo": { "@type": "ImageObject", "url": "https://example.com/logo.png" }
      }
    },
    faq_schema: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What are the symptoms of N54 HPFP failure?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The 7 key symptoms include long cranking on startup, intermittent misfires, limp mode activation, fuel rail pressure dropping below 5 bar at idle, rough idle, loss of power under boost, and check engine light with codes P0087 or P0088."
          }
        }
      ]
    },
    breadcrumb_schema: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://example.com/" },
        { "@type": "ListItem", "position": 2, "name": "BMW Maintenance", "item": "https://example.com/bmw-maintenance/" },
        { "@type": "ListItem", "position": 3, "name": "N54 HPFP Failure Symptoms" }
      ]
    },
    howto_schema: null,                                      // Populated for how-to articles
    product_schema: null                                     // Populated for product review articles
  },

  // === PLATFORM OVERRIDES ===
  // Per-platform configuration that overrides default adapter behavior.
  // Only include keys for platforms where the user has explicitly set overrides.
  platform_overrides: {
    wordpress: {
      post_status: "draft",
      post_type: "post",
      post_format: "standard",                               // standard, aside, gallery, link, image, quote, status, video, audio, chat
      custom_fields: {},                                      // Additional post_meta key/value pairs
      gutenberg_blocks: false                                 // If true, wrap content in wp:html block markup
    },
    shopify: {
      blog_id: null,                                          // Null = use default blog
      published: false,
      product_references: [
        {
          product_id: "gid://shopify/Product/789",
          title: "Replacement N54 HPFP",
          handle: "replacement-n54-hpfp",
          url: "/products/replacement-n54-hpfp",
          price: "549.99",
          image_url: "https://cdn.shopify.com/..."
        }
      ],
      template_suffix: null                                   // Custom Liquid template
    }
  },

  // === CONTENT METADATA ===
  language: "en",                                             // ISO 639-1 language code
  direction: "ltr",                                           // "ltr" or "rtl"
  locale: "en-US",                                            // Full locale for date/number formatting
  quality_score: 8.4,                                         // Overall Quality Gate score (0-10)
  quality_gate_passed: true,                                  // Boolean: did the article pass?
  generated_at: "2026-03-28T14:22:00Z",                      // ISO 8601 generation timestamp
  generation_model: "claude-opus-4-6",                   // Model used for generation
  research_sources: [                                         // Sources used during research phase
    { url: "https://bimmerpost.com/forums/...", title: "N54 HPFP Failure Thread", domain: "bimmerpost.com" },
    { url: "https://www.bimmertech.com/...", title: "HPFP Replacement Guide", domain: "bimmertech.com" }
  ]
}
```

### Schema Validation Rules

The Universal Article Payload is validated before being passed to any adapter. Validation failures prevent the publish entirely — a malformed payload must never reach a CMS.

| Field | Validation | Error Message |
| --- | --- | --- |
| article_id | UUID v4 format | "article_id must be a valid UUID" |
| title | Non-empty, max 200 chars | "title is required and must be <= 200 characters" |
| slug | Lowercase alphanumeric + hyphens only | "slug must be URL-safe (lowercase letters, numbers, hyphens)" |
| content_html | Non-empty, starts with `<` | "content_html is required and must be valid HTML" |
| seo.title | Max 70 chars (warn at 60) | "seo.title exceeds 70 characters — may be truncated in SERPs" |
| seo.meta_description | Max 170 chars (warn at 160) | "seo.meta_description exceeds 170 characters" |
| images.featured.url | Valid HTTPS URL | "featured image must be a valid HTTPS URL" |
| images.featured.width | >= 1200 | "featured image width must be >= 1200px for social sharing" |
| images.content[].alt | Non-empty for each image | "all content images must have alt text" |
| quality_score | 0-10 range | "quality_score must be between 0 and 10" |
| quality_gate_passed | Must be true | "article must pass Quality Gate before publishing" |
| language | ISO 639-1 code | "language must be a valid ISO 639-1 code" |
| direction | "ltr" or "rtl" | "direction must be 'ltr' or 'rtl'" |

### Payload Size Limits

- Maximum payload size: 5 MB (including all metadata, excluding image binary data)
- Maximum content_html size: 2 MB
- Maximum number of content images: 30
- Maximum schema markup total size: 100 KB

---

## 6. WordPress Plugin

### Architecture: 5 PHP Classes

The WordPress plugin (`plugins/wordpress/chainiq-connector/`) is a thin SaaS-connected client. It contains zero generation logic, zero scoring logic, zero research logic. It is a secure bridge between the ChainIQ backend and the WordPress database.

```
plugins/wordpress/chainiq-connector/
├── chainiq-connector.php                          # Main plugin file (plugin header, bootstrap)
├── includes/
│   ├── class-chainiq-api.php                      # HTTP client for outbound calls to ChainIQ
│   ├── class-chainiq-admin.php                    # WP admin settings page + publish history
│   ├── class-chainiq-publisher.php                # Core: wp_insert_post, media, taxonomy, SEO
│   ├── class-chainiq-webhook-handler.php          # REST route registration + signature validation
│   └── class-chainiq-image-handler.php            # Image download + media library upload
├── assets/
│   ├── css/chainiq-admin.css                      # Admin page styles (WP native + minimal custom)
│   └── js/chainiq-admin.js                        # Connection test, AJAX history refresh
├── languages/
│   └── chainiq-connector.pot                      # Translation template
├── readme.txt                                      # WordPress.org plugin directory readme
└── uninstall.php                                   # Clean removal (delete options, NOT posts)
```

### Class 1: ChainIQ_Connector (Main Plugin File)

```php
// chainiq-connector.php
/**
 * Plugin Name: ChainIQ Connector
 * Plugin URI: https://chainiq.io/wordpress
 * Description: Connect your WordPress site to ChainIQ for AI-powered content publishing.
 * Version: 1.0.0
 * Requires at least: 6.0
 * Requires PHP: 8.0
 * Author: ChainIQ
 * License: GPL v2 or later
 * Text Domain: chainiq-connector
 * Domain Path: /languages
 */

// Activation hook: create custom DB table for publish history,
// generate default API key (user must save it to ChainIQ dashboard),
// register scheduled event for health pings.

// Deactivation hook: clear scheduled events. Do NOT delete options
// or published posts.

// Uninstall: delete all wp_options entries prefixed with chainiq_.
// Delete custom publish_history table. Do NOT touch published posts.
```

### Class 2: ChainIQ_API (HTTP Client)

Handles all outbound HTTP calls from the WordPress plugin to the ChainIQ backend. Uses `wp_remote_post()` and `wp_remote_get()` exclusively (not cURL directly) for WordPress compatibility.

**Key methods:**
- `verify_connection()` — Sends site URL + API key to ChainIQ backend for verification. Returns webhook secret.
- `report_publish_status($article_id, $status, $post_id, $edit_url)` — Reports back to ChainIQ that a push succeeded or failed.
- `heartbeat()` — Periodic ping (every 6 hours via WP-Cron) to keep connection alive and report site health.

**Timeout:** All outbound calls use a 15-second timeout. If ChainIQ backend is unreachable, the plugin logs the error and does not block WordPress admin functionality.

### Class 3: ChainIQ_Admin (Settings Page)

Registers a top-level "ChainIQ" menu item in wp-admin. Provides three tabs:

**Settings Tab:**
- API Key input (password field with show/hide toggle)
- Default post status (dropdown: Draft, Pending Review)
- Default author (dropdown: all WP users with `edit_posts` capability)
- Default category (dropdown: all categories)
- Auto-set featured image (checkbox, default: checked)
- Auto-set SEO meta (checkbox, default: checked)
- Backend URL override (hidden by default, for self-hosted ChainIQ instances)

**Connection Tab:**
- Connection status badge (green/red/yellow)
- API key masked display (last 4 characters visible)
- Last sync timestamp
- WordPress version
- PHP version
- Detected SEO plugin (Yoast/RankMath/AIOSEO/SEOPress/None)
- ChainIQ plugin version
- "Test Connection" button (AJAX call to `/wp-json/chainiq/v1/status`)
- "Disconnect" button (clears API key, marks connection as disconnected)

**Publish History Tab:**
- `WP_List_Table` subclass showing all articles pushed from ChainIQ
- Columns: Date, Title, Status (Draft/Published/Trashed), Quality Score, Actions (Edit | View)
- Sortable by date
- Paginated (20 per page)
- Data stored in `chainiq_publish_history` custom table (not wp_options — scales better)

### Class 4: ChainIQ_Publisher (Core Publishing Logic)

The heart of the plugin. Receives a validated Universal Article Payload and creates a WordPress post.

**Publishing sequence (in order):**

```
1. Receive payload from Webhook Handler (already validated)
2. Check for existing post with same _chainiq_article_id (upsert logic)
3. Disable wp_kses filters (kses_remove_filters())
4. Call wp_insert_post() with:
   - post_title (sanitize_text_field)
   - post_content (raw HTML preserved — kses disabled)
   - post_excerpt (sanitize_text_field)
   - post_status from payload or plugin default
   - post_author from payload or plugin default
   - post_type from payload or 'post'
5. Re-enable wp_kses filters (kses_init_filters())
6. If wp_insert_post returns WP_Error, log and return error
7. Set categories via set_taxonomy() — create missing ones with wp_insert_term()
8. Set tags via set_taxonomy() — create missing ones with wp_insert_term()
9. Upload and set featured image (delegate to Image Handler)
10. Upload content images (delegate to Image Handler, parallel where possible)
11. Rewrite content HTML with WordPress media URLs (str_replace CDN → WP URLs)
12. Update post_content with rewritten HTML (wp_update_post)
13. Set SEO meta based on detected plugin (Yoast/RankMath/AIOSEO/SEOPress)
14. Store ChainIQ metadata as post_meta:
    - _chainiq_article_id (UUID)
    - _chainiq_quality_score (float)
    - _chainiq_published_at (ISO datetime)
    - _chainiq_version (integer)
    - _chainiq_payload_hash (SHA-256 for drift detection)
15. Insert record into chainiq_publish_history custom table
16. Return success with post_id, edit_url, view_url
```

**Why kses_remove_filters() is necessary and safe:**

WordPress's `wp_kses_post()` is designed to sanitize user-submitted content to prevent XSS. However, ChainIQ's content is generated by the platform (not user-submitted) and has already passed the Quality Gate's HTML validation. The kses filter would strip:
- `style` attributes (breaks inline styling for tables, callout boxes)
- `data-*` attributes (breaks interactive components)
- `class` attributes on some elements (breaks CSS targeting)
- SVG elements (breaks inline icons)

The plugin disables kses only for the duration of the `wp_insert_post()` call, then immediately re-enables it. This is the same pattern used by WooCommerce, Elementor, and other major plugins that insert trusted HTML.

**SEO meta auto-fill implementation:**

```php
private function set_seo_meta($post_id, $seo) {
    $plugin = $this->detect_seo_plugin();

    switch ($plugin) {
        case 'yoast':
            update_post_meta($post_id, '_yoast_wpseo_title', $seo['title'] ?? '');
            update_post_meta($post_id, '_yoast_wpseo_metadesc', $seo['meta_description'] ?? '');
            update_post_meta($post_id, '_yoast_wpseo_focuskw', $seo['focus_keyphrase'] ?? '');
            update_post_meta($post_id, '_yoast_wpseo_opengraph-title', $seo['og_title'] ?? '');
            update_post_meta($post_id, '_yoast_wpseo_opengraph-description', $seo['og_description'] ?? '');
            update_post_meta($post_id, '_yoast_wpseo_opengraph-image', $seo['og_image'] ?? '');
            update_post_meta($post_id, '_yoast_wpseo_twitter-title', $seo['twitter_title'] ?? '');
            update_post_meta($post_id, '_yoast_wpseo_twitter-description', $seo['twitter_description'] ?? '');
            if (!empty($seo['canonical_url'])) {
                update_post_meta($post_id, '_yoast_wpseo_canonical', $seo['canonical_url']);
            }
            if (!empty($seo['robots'])) {
                update_post_meta($post_id, '_yoast_wpseo_meta-robots-noindex', strpos($seo['robots'], 'noindex') !== false ? '1' : '0');
                update_post_meta($post_id, '_yoast_wpseo_meta-robots-nofollow', strpos($seo['robots'], 'nofollow') !== false ? '1' : '0');
            }
            break;

        case 'rankmath':
            update_post_meta($post_id, 'rank_math_title', $seo['title'] ?? '');
            update_post_meta($post_id, 'rank_math_description', $seo['meta_description'] ?? '');
            update_post_meta($post_id, 'rank_math_focus_keyword', $seo['focus_keyphrase'] ?? '');
            update_post_meta($post_id, 'rank_math_facebook_title', $seo['og_title'] ?? '');
            update_post_meta($post_id, 'rank_math_facebook_description', $seo['og_description'] ?? '');
            update_post_meta($post_id, 'rank_math_facebook_image', $seo['og_image'] ?? '');
            update_post_meta($post_id, 'rank_math_twitter_title', $seo['twitter_title'] ?? '');
            update_post_meta($post_id, 'rank_math_twitter_description', $seo['twitter_description'] ?? '');
            if (!empty($seo['canonical_url'])) {
                update_post_meta($post_id, 'rank_math_canonical_url', $seo['canonical_url']);
            }
            update_post_meta($post_id, 'rank_math_robots', $this->parse_robots_array($seo['robots'] ?? 'index, follow'));
            break;

        case 'aioseo':
            update_post_meta($post_id, '_aioseo_title', $seo['title'] ?? '');
            update_post_meta($post_id, '_aioseo_description', $seo['meta_description'] ?? '');
            // AIOSEO stores keyphrases as JSON
            $keyphrases = json_encode([
                ['keyphrase' => $seo['focus_keyphrase'] ?? '', 'score' => 0]
            ]);
            update_post_meta($post_id, '_aioseo_keyphrases', $keyphrases);
            update_post_meta($post_id, '_aioseo_og_title', $seo['og_title'] ?? '');
            update_post_meta($post_id, '_aioseo_og_description', $seo['og_description'] ?? '');
            break;

        case 'seopress':
            update_post_meta($post_id, '_seopress_titles_title', $seo['title'] ?? '');
            update_post_meta($post_id, '_seopress_titles_desc', $seo['meta_description'] ?? '');
            update_post_meta($post_id, '_seopress_social_fb_title', $seo['og_title'] ?? '');
            update_post_meta($post_id, '_seopress_social_fb_desc', $seo['og_description'] ?? '');
            update_post_meta($post_id, '_seopress_social_fb_img', $seo['og_image'] ?? '');
            break;

        default:
            // No SEO plugin detected — skip silently, log info
            error_log('[ChainIQ] No SEO plugin detected — skipping SEO meta for post ' . $post_id);
            return false;
    }
    return true;
}

private function detect_seo_plugin() {
    $active = get_option('active_plugins', []);
    if (is_multisite()) {
        $active = array_merge($active, array_keys(get_site_option('active_sitewide_plugins', [])));
    }

    $map = [
        'yoast'    => ['wordpress-seo/wp-seo.php', 'wordpress-seo-premium/wp-seo-premium.php'],
        'rankmath' => ['seo-by-rank-math/rank-math.php', 'seo-by-rank-math-pro/rank-math-pro.php'],
        'aioseo'   => ['all-in-one-seo-pack/all_in_one_seo_pack.php', 'all-in-one-seo-pack-pro/all_in_one_seo_pack.php'],
        'seopress' => ['wp-seopress/seopress.php', 'wp-seopress-pro/seopress-pro.php'],
    ];

    foreach ($map as $name => $slugs) {
        foreach ($slugs as $slug) {
            if (in_array($slug, $active, true)) {
                return $name;
            }
        }
    }
    return null;
}
```

**Universal builder compatibility:**

The plugin writes to `post_content` via `wp_insert_post()` at the database level. This means the content is stored identically regardless of which page builder the site uses:

| Builder | How it reads post_content | ChainIQ content display |
| --- | --- | --- |
| **Gutenberg** | Renders post_content. ChainIQ HTML appears as a Classic block. | Content renders correctly. User can convert to blocks if desired. |
| **Classic Editor** | Renders post_content directly as HTML in TinyMCE. | Content renders correctly in both Visual and Text tabs. |
| **Elementor** | Ignores post_content in favor of `_elementor_data` meta. Falls back to post_content if no Elementor data exists. | Content visible in Elementor as plain text widget. User can design around it. |
| **WPBakery** | Uses shortcodes stored in post_content. Raw HTML renders without WPBakery styling. | Content renders as raw HTML. User wraps in WPBakery text block. |
| **Divi** | Uses shortcodes. Raw HTML renders without Divi styling. | Content renders as raw HTML. User wraps in Divi text module. |
| **Beaver Builder** | Ignores post_content in favor of `_fl_builder_data` meta. | Content visible in standard editor. User can import to Beaver. |

The key insight: all builders fall back to `post_content` for display. ChainIQ writes clean HTML to `post_content`, and the user can then edit within their preferred builder. The content is never broken — it just may not have builder-specific styling until the user applies it.

### Class 5: ChainIQ_Webhook_Handler (REST Route + Signature Validation)

Registers the custom REST API route that receives push requests from the ChainIQ backend.

**Endpoint:** `POST /wp-json/chainiq/v1/receive`

**Authentication flow:**

```
1. Extract X-ChainIQ-Key header → compare against stored API key hash
2. Extract X-ChainIQ-Signature header → HMAC-SHA256(webhook_secret, request_body)
3. Extract X-ChainIQ-Timestamp header → reject if > 5 minutes old (replay protection)
4. If all three pass → delegate to Publisher class
5. If any fails → return 401 with generic "Authentication failed" (no detail leakage)
```

**HMAC signature verification:**

```php
public function verify_signature($request) {
    $signature = $request->get_header('X-ChainIQ-Signature');
    $timestamp = $request->get_header('X-ChainIQ-Timestamp');
    $api_key   = $request->get_header('X-ChainIQ-Key');

    if (!$signature || !$timestamp || !$api_key) {
        return new WP_Error('missing_auth', 'Authentication headers required', ['status' => 401]);
    }

    // Replay protection: reject requests older than 5 minutes
    if (abs(time() - intval($timestamp)) > 300) {
        return new WP_Error('expired', 'Request timestamp expired', ['status' => 401]);
    }

    // Verify API key
    $stored_hash = get_option('chainiq_api_key_hash');
    if (hash('sha256', $api_key) !== $stored_hash) {
        return new WP_Error('invalid_key', 'Authentication failed', ['status' => 401]);
    }

    // Verify HMAC signature
    $webhook_secret = get_option('chainiq_webhook_secret');
    $body = $request->get_body();
    $expected = hash_hmac('sha256', $timestamp . '.' . $body, $webhook_secret);

    if (!hash_equals($expected, $signature)) {
        return new WP_Error('invalid_signature', 'Authentication failed', ['status' => 401]);
    }

    return true;
}
```

**Additional REST endpoints registered by the plugin:**

| Endpoint | Method | Auth | Purpose |
| --- | --- | --- | --- |
| `/wp-json/chainiq/v1/receive` | POST | API Key + HMAC | Receive article push |
| `/wp-json/chainiq/v1/status` | GET | API Key | Health check + capability detection |
| `/wp-json/chainiq/v1/history` | GET | API Key | Return publish history |
| `/wp-json/chainiq/v1/categories` | GET | API Key | List all categories (for publish modal) |
| `/wp-json/chainiq/v1/tags` | GET | API Key | List all tags (for publish modal) |
| `/wp-json/chainiq/v1/authors` | GET | API Key | List all authors (for publish modal) |

### WordPress Plugin Directory Compliance

The plugin is designed for submission to the WordPress.org plugin directory. Compliance requirements:

- **No external resource loading** without user consent (all scripts/styles bundled)
- **No tracking or analytics** without opt-in
- **GPL v2 or later** license
- **Sanitize all input**, escape all output (`sanitize_text_field`, `esc_html`, `esc_url`, `esc_attr`)
- **Use WordPress APIs** exclusively (Settings API, REST API, Options API, WP_List_Table)
- **No direct database queries** without `$wpdb->prepare()`
- **Proper prefix** on all functions, classes, hooks, and options (`chainiq_`)
- **No obfuscated code** — all PHP is readable
- **readme.txt** follows WordPress.org format with description, FAQ, changelog, screenshots

---

## 7. Shopify App

### Architecture

The Shopify integration has two components:

1. **Bridge-side adapter** (`bridge/publishing/shopify.js`): Called by the ChainIQ backend to push articles via Shopify Admin REST API. Uses the shop's access token stored in `platform_connections`.

2. **Embedded admin app** (`plugins/shopify/chainiq-shopify/`): A lightweight Node.js app deployed separately that handles OAuth install flow, App Bridge UI within Shopify admin, and Shopify webhook receivers.

### OAuth 2.0 Install Flow

```
1. Store owner clicks "Install ChainIQ" in ChainIQ dashboard or Shopify App Store
2. Redirect to: https://{shop}.myshopify.com/admin/oauth/authorize
   ?client_id=CHAINIQ_SHOPIFY_CLIENT_ID
   &scope=read_products,write_content,read_content
   &redirect_uri=https://api.chainiq.io/shopify/callback
   &state={nonce}
3. Store owner approves permissions
4. Shopify redirects to callback with ?code=xxx&shop=xxx&state=xxx
5. ChainIQ exchanges code for permanent access token via POST /admin/oauth/access_token
6. Token encrypted and stored in platform_connections.oauth_token_encrypted
7. Connection status set to 'active'
8. ChainIQ registers mandatory webhooks: APP_UNINSTALLED, SHOP_UPDATE
```

**Required OAuth scopes:**
- `read_products` — Fetch product catalog for product-aware content
- `write_content` — Create blog articles
- `read_content` — List blogs, read existing articles

### Blog API Integration

Shopify's Blog API (`/admin/api/2024-01/blogs/{blog_id}/articles.json`) creates blog articles.

**Article creation payload (what ChainIQ sends to Shopify):**

```json
{
  "article": {
    "title": "N54 HPFP Failure Symptoms and Solutions",
    "author": "Store Admin",
    "tags": "N54, HPFP, fuel pump, BMW",
    "body_html": "<article>...product references injected...schema JSON-LD injected...</article>",
    "published": false,
    "image": {
      "src": "https://cdn.chainiq.io/images/550e8400/featured.jpg",
      "alt": "N54 HPFP Failure"
    },
    "metafields": [
      {
        "namespace": "global",
        "key": "title_tag",
        "value": "N54 HPFP Failure Symptoms — 7 Signs Your Fuel Pump Is Dying",
        "type": "single_line_text_field"
      },
      {
        "namespace": "global",
        "key": "description_tag",
        "value": "Diagnose N54 high-pressure fuel pump failure with these 7 symptoms.",
        "type": "single_line_text_field"
      }
    ]
  }
}
```

### Product-Aware Content

ChainIQ's Shopify integration is uniquely product-aware. When publishing to a Shopify store, the adapter can inject natural product references into the article content. This creates internal links from informational content (blog) to transactional pages (products), which is the highest-value SEO strategy for e-commerce.

**Product reference injection flow:**

```
1. During article generation, the pipeline knows the user has a Shopify connection
2. ChainIQ fetches the store's product catalog (cached, refreshed every 24h)
3. The draft writer receives relevant products as context
4. Generated content naturally mentions products where appropriate
5. During publish, the adapter verifies product handles are still valid
6. Product mentions become linked references: <a href="/products/{handle}">{title}</a>
7. Optionally, a "Shop This Item" card is appended with product image, price, and CTA
```

**Product catalog caching:**

Products are fetched via `GET /admin/api/2024-01/products.json` with pagination (250 per page). Cached in `product_catalog_cache` table with 24-hour TTL. The cache stores: product ID, title, handle, product_type, tags, description excerpt (first 200 chars), image URL, price, and status.

For stores with 10,000+ products, the initial fetch is paginated using `since_id` and runs as a background job. Subsequent refreshes use `updated_at_min` to fetch only changed products.

### Embedded Admin Panel

The Shopify embedded admin app uses App Bridge 4.x and Polaris components for native Shopify look and feel.

**Screens:**
- **Connection Status:** Shows ChainIQ connection health, store name, product count, articles published
- **Recent Articles:** DataTable of articles pushed from ChainIQ with status, date, and edit links
- **Settings:** Default blog selector, default author, product-awareness toggle, max product references per article

The embedded app is a React SPA served from `https://shopify-app.chainiq.io`. It communicates with the ChainIQ backend via authenticated API calls (the Shopify session token is exchanged for a ChainIQ auth token during app load).

### Shopify-Specific Limitations

| Limitation | Impact | Workaround |
| --- | --- | --- |
| No categories (tags only) | Cannot replicate WordPress category hierarchy | Use tags liberally. Shopify tags serve dual purpose. |
| No custom fields on articles | Cannot store _chainiq_article_id as meta | Store mapping in ChainIQ's publish_records table (remote_id field) |
| No native schema markup support | JSON-LD not natively managed | Inject schema as `<script type="application/ld+json">` in article body_html |
| Blog is secondary to commerce | Limited formatting options in some themes | Test with popular themes. Use clean HTML that themes handle well. |
| 2 req/s REST API rate limit | Bulk publish is slow | Queue articles with 500ms delay between API calls |
| Image must be URL (no binary upload) | Cannot upload from ChainIQ CDN directly | Provide CDN URL in image.src — Shopify downloads and hosts it |
| No draft preview URL | Cannot provide "preview" link like WordPress | Provide admin edit URL instead |

---

## 8. Headless CMS Adapters

Each headless CMS adapter implements the `CMSAdapter` interface:

```javascript
class CMSAdapter {
  constructor(connection) {}               // Initialize with platform_connections record
  async testConnection() {}                // Verify credentials, return capabilities
  async publish(payload) {}                // Create content entry from Universal Article Payload
  async update(remoteId, payload) {}       // Update existing content entry
  async uploadMedia(image) {}              // Upload single image to CMS media library
  async getStatus(remoteId) {}             // Check publication status of existing entry
  async delete(remoteId) {}                // Delete content entry (for cleanup)
}
```

### Contentful (Management API)

**File:** `bridge/publishing/contentful.js`

**Auth method:** Personal Access Token (PAT) or OAuth 2.0. PAT stored in `platform_connections.api_key_encrypted`. Space ID and environment ID stored in `metadata`.

**Create flow:**
1. Upload all images as Assets via `PUT /spaces/{space}/environments/{env}/assets/{id}`
2. Process each Asset (triggers Contentful's image pipeline)
3. Wait for Asset processing completion (poll `GET /assets/{id}` until `fields.file.url` is populated)
4. Create Entry via `PUT /spaces/{space}/environments/{env}/entries/{id}` with content type mapping
5. Entry is created in draft state by default (Contentful's default)
6. Return entry ID and web app URL

**Content type mapping challenge:** Every Contentful space has a custom content model. There is no universal "article" content type. The adapter requires a one-time configuration step where the user maps ChainIQ fields to their Contentful content type fields:

```json
{
  "content_type_id": "blogPost",
  "field_mapping": {
    "title": "title",
    "body": "content",
    "excerpt": "summary",
    "featured_image": "heroImage",
    "slug": "slug",
    "author": "author",
    "categories": "categories",
    "tags": "tags",
    "seo_title": "seoTitle",
    "seo_description": "seoDescription"
  }
}
```

**Content format:** Contentful uses its own rich text JSON format, not HTML. The adapter converts `content_html` to Contentful rich text using a parser that handles:
- Headings (h1-h6) → heading nodes
- Paragraphs → paragraph nodes
- Lists (ul/ol) → list nodes
- Images → embedded-asset-block nodes (referencing uploaded Assets)
- Tables → table nodes
- Links → hyperlink inline nodes
- Bold/italic/underline → marks on text nodes

**Limitations:**
- Asset processing is asynchronous — images are not immediately available after upload (typically 5-30 seconds)
- Rich text format cannot represent all HTML features (no custom classes, no data attributes, no inline styles)
- Rate limit: 10 requests/second per access token
- Content model must exist before publishing — the adapter cannot create content types

### Strapi (REST API v4)

**File:** `bridge/publishing/strapi.js`

**Auth method:** API Token (stored in `api_key_encrypted`) or JWT. Strapi URL stored in `metadata.strapi_url`.

**Create flow:**
1. Upload images via `POST /api/upload` (multipart form data)
2. Each upload returns a file object with `id` and `url`
3. Create entry via `POST /api/{content_type_plural}` with JSON body
4. Content HTML is stored directly in a rich text field (Strapi accepts HTML in rich text fields)
5. Images linked via relation fields or embedded in rich text

**Content type detection:** On connection, the adapter calls `GET /api/content-types` to discover available content types and their fields. The user selects which content type to publish to and maps fields.

**Advantages over Contentful:**
- Strapi is self-hosted — no rate limits (user controls)
- Accepts HTML directly in rich text fields
- Simpler content model

**Limitations:**
- Self-hosted means variable configurations — some Strapi instances may have custom plugins that affect API behavior
- No standardized slug generation (depends on Strapi configuration)
- Media upload size limited by Strapi server configuration

### Ghost (Admin API)

**File:** `bridge/publishing/ghost.js`

**Auth method:** Admin API Key. Ghost uses JWT signed with the secret half of the Admin API key. The key format is `{id}:{secret}` — the adapter generates a short-lived JWT on each request.

```javascript
const jwt = require('jsonwebtoken'); // One of the few cases where a dependency is justified
// Actually: Ghost JWT is simple enough to generate manually with crypto
function generateGhostToken(key) {
  const [id, secret] = key.split(':');
  const token = jwt.sign({}, Buffer.from(secret, 'hex'), {
    keyid: id,
    algorithm: 'HS256',
    expiresIn: '5m',
    audience: '/admin/'
  });
  return token;
}
```

**Create flow:**
1. Upload image via `POST /ghost/api/admin/images/upload/` (multipart)
2. Create post via `POST /ghost/api/admin/posts/` with:
   - `title`, `html` (content), `feature_image`, `tags`, `meta_title`, `meta_description`
   - `status: "draft"` (Ghost's draft state)
   - `authors` (by slug or ID)
3. Return post ID, slug, and admin URL

**Ghost advantages:**
- Clean API design with excellent documentation
- Accepts HTML directly (no format conversion needed)
- Native support for meta title, meta description, and OG/Twitter cards
- Tags with visibility (public/internal) for content organization
- Scheduled publishing support (`published_at` in the future with `status: "scheduled"`)

**Limitations:**
- Smaller market share than WordPress — fewer users will need this adapter
- No categories (only tags, similar to Shopify)
- No custom fields
- Image upload limited to 5MB per file by default

### Webflow (CMS API v2)

**File:** `bridge/publishing/webflow.js`

**Auth method:** OAuth 2.0 or Site API Token. Token stored in `oauth_token_encrypted` or `api_key_encrypted`.

**Create flow:**
1. Upload images via Webflow is complex — Webflow does not have a direct media upload API for CMS items. Images must be hosted externally (CDN URL) and referenced by URL.
2. Create CMS item via `POST /v2/collections/{collection_id}/items` with field data
3. The item is created in draft (staged) state
4. Publishing requires a separate `POST /v2/collections/{collection_id}/items/publish` call
5. ChainIQ creates items as staged (draft) — the user publishes from Webflow

**Content format challenge:** Webflow CMS has a "Rich Text" field type that accepts a subset of HTML. The adapter must simplify content:
- Strip custom classes and data attributes
- Convert complex tables to simple tables (no colspan/rowspan)
- Remove inline styles
- Ensure images use absolute URLs (Webflow does not process relative URLs)

**Limitations:**
- Rate limit: 60 requests/minute (very restrictive for bulk operations)
- CMS item limit: 10,000 items per collection (hard limit on some plans)
- Rich text field cannot represent all HTML features
- No native SEO meta fields — must be custom fields defined in the collection
- Publishing is a separate API call from creation
- Image handling requires external hosting — no Webflow media upload API for CMS items

### Sanity (HTTP API + GROQ)

**File:** `bridge/publishing/sanity.js`

**Auth method:** API Token with write permissions. Project ID and dataset stored in `metadata`.

**Create flow:**
1. Upload images via `POST /v1/assets/images/{dataset}` (binary upload)
2. Each upload returns an asset document with `_id` (format: `image-{hash}-{dimensions}-{format}`)
3. Create document via mutation: `POST /v1/data/mutate/{dataset}` with `createOrReplace` mutation
4. Content converted from HTML to Sanity's Portable Text (block content) format
5. Images referenced as `image` blocks with asset references

**Portable Text conversion:** Sanity uses Portable Text, a JSON-based rich text format. The adapter converts HTML:
- Headings → blocks with `style: "h1"` through `style: "h6"`
- Paragraphs → blocks with `style: "normal"`
- Lists → blocks with `listItem: "bullet"` or `listItem: "number"` and `level: 1-N`
- Bold/italic → marks with `_type: "strong"` or `_type: "em"`
- Links → marks with `_type: "link"` and `href`
- Images → blocks with `_type: "image"` and asset reference

**Advantages:**
- Real-time collaboration — draft changes are immediately visible to all editors
- Structured content model with validation
- No rate limits on mutations (but large payloads may timeout)
- CDN-hosted images with automatic transforms (crop, resize, format conversion)

**Limitations:**
- Portable Text format requires careful HTML-to-block conversion
- Custom schema must exist before publishing (adapter cannot create schemas)
- Requires understanding of Sanity's reference system for linked content
- Dataset size limits depend on plan

---

## 9. Generic Webhook

The Generic Webhook adapter (`bridge/publishing/webhook.js`) enables publishing to any system with an HTTP endpoint. This covers CMS platforms without dedicated adapters, custom internal systems, Zapier/n8n/Make automations, and any future platform without requiring a new adapter.

### Webhook Payload Format

The webhook POSTs the full Universal Article Payload as the JSON request body. No transformation is applied — the receiver gets the canonical format and is responsible for mapping it to their system.

**Request:**
```
POST {webhook_url}
Content-Type: application/json
X-ChainIQ-Signature: sha256={hmac_hex}
X-ChainIQ-Timestamp: 1711641300
X-ChainIQ-Delivery: 770e8400-e29b-41d4-a716-446655440004
X-ChainIQ-Event: article.published
User-Agent: ChainIQ-Webhook/1.0

{
  ... full Universal Article Payload ...
}
```

### HMAC-SHA256 Signature

Every webhook request is signed with HMAC-SHA256 for authenticity verification:

```javascript
const crypto = require('crypto');

function signWebhookPayload(secret, timestamp, body) {
  const signatureBase = `${timestamp}.${body}`;
  return 'sha256=' + crypto.createHmac('sha256', secret)
    .update(signatureBase)
    .digest('hex');
}
```

The receiver verifies by:
1. Extracting `X-ChainIQ-Timestamp` and `X-ChainIQ-Signature` headers
2. Computing `HMAC-SHA256(webhook_secret, timestamp + "." + raw_body)`
3. Comparing using constant-time comparison (prevent timing attacks)
4. Rejecting if timestamp is more than 5 minutes old (replay protection)

### Reference Receiver Implementation

ChainIQ provides a reference receiver implementation for users building custom webhook handlers:

```javascript
// Reference: Node.js webhook receiver
const http = require('http');
const crypto = require('crypto');

const WEBHOOK_SECRET = process.env.CHAINIQ_WEBHOOK_SECRET;

function verifySignature(req, body) {
  const signature = req.headers['x-chainiq-signature'];
  const timestamp = req.headers['x-chainiq-timestamp'];

  if (!signature || !timestamp) return false;
  if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > 300) return false;

  const expected = 'sha256=' + crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(`${timestamp}.${body}`)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

http.createServer((req, res) => {
  if (req.method !== 'POST') return res.writeHead(405).end();

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    if (!verifySignature(req, body)) {
      return res.writeHead(401, { 'Content-Type': 'application/json' })
        .end(JSON.stringify({ error: 'Invalid signature' }));
    }

    const payload = JSON.parse(body);
    console.log(`Received article: ${payload.title}`);
    console.log(`Quality score: ${payload.quality_score}`);
    console.log(`Images: ${payload.images.content.length} content images`);

    // Your CMS integration logic here
    // createArticle(payload.title, payload.content_html, payload.seo);

    res.writeHead(201, { 'Content-Type': 'application/json' })
      .end(JSON.stringify({ id: 'custom-123', url: `/articles/${payload.slug}` }));
  });
}).listen(3000);
```

### Retry Policy

| Attempt | Delay | Triggered by |
| --- | --- | --- |
| 1 | Immediate | Initial delivery |
| 2 | 5 seconds | 5xx, timeout, connection error |
| 3 | 30 seconds | 5xx, timeout, connection error |
| 4 | 120 seconds | 5xx, timeout, connection error |

**No retry on:** 2xx (success), 4xx (client error — receiver rejected payload). 4xx errors are logged and the publish record is marked `failed` immediately with the receiver's error response.

**Timeout:** 30 seconds per attempt. If the receiver does not respond within 30 seconds, the attempt is treated as a timeout (retriable).

### Custom Headers

Users can configure custom headers per webhook connection. Common use cases:
- `Authorization: Bearer <token>` for authenticated receivers
- `X-Environment: production` for routing
- `X-Tenant-ID: <id>` for multi-tenant systems

Custom headers are stored in `platform_connections.metadata.custom_headers` (encrypted at rest as part of the connection record).

### Webhook Events

The webhook adapter supports multiple event types (future expansion):

| Event | Trigger | Payload |
| --- | --- | --- |
| `article.published` | Article pushed via publish flow | Full Universal Article Payload |
| `article.updated` | Article re-pushed after edit | Full payload with updated content |
| `article.deleted` | Article unpublished from ChainIQ | Article ID + platform reference |
| `connection.test` | User clicks "Test Connection" | Minimal ping payload (no article data) |

---

## 10. Image CDN Pipeline

Images are the most operationally complex part of publishing. Each CMS has a different media upload API, different size limits, different format support, and different CDN behavior. The Image CDN Pipeline abstracts all of this behind a uniform process.

### Pipeline Flow

```
1. GENERATE
   └── During article generation, Gemini produces 4-6 images
   └── Images saved to ChainIQ CDN (cdn.chainiq.io/images/{article_id}/)
   └── CDN URLs stored in Universal Article Payload

2. VALIDATE
   └── Before publish, validate all images are accessible (HEAD request to CDN URLs)
   └── Check file sizes (reject images > 10MB, warn > 5MB)
   └── Verify MIME types (image/jpeg, image/png, image/webp, image/gif)

3. UPLOAD TO CMS
   └── Featured image uploaded first (blocks article creation)
   └── Content images uploaded in parallel (max 5 concurrent)
   └── Each upload returns CMS-native media ID and URL

4. REWRITE HTML
   └── Replace CDN URLs in content_html with CMS-hosted URLs
   └── Update featured image reference
   └── Update OG image reference

5. CREATE ARTICLE
   └── Article created with all image URLs pointing to CMS media library
   └── CDN images remain as backup (not deleted until confirmed)

6. CLEANUP (async, after confirmation)
   └── After successful publish, CDN images can be garbage-collected
   └── Retention: 30 days after last publish (in case of re-publish needed)
```

### Platform-Specific Image Upload

#### WordPress Media API

```
POST /wp-json/wp/v2/media
Content-Type: multipart/form-data
Content-Disposition: form-data; name="file"; filename="n54-hpfp-featured.jpg"

Binary image data

Additional form fields:
  alt_text: "N54 high-pressure fuel pump failure"
  title: "N54 HPFP Failure"
  caption: "The HPFP showing visible signs of corrosion"
```

Returns:
```json
{
  "id": 1234,
  "source_url": "https://example.com/wp-content/uploads/2026/03/n54-hpfp-featured.jpg",
  "media_details": { "width": 1200, "height": 628, "file": "2026/03/n54-hpfp-featured.jpg" }
}
```

The WordPress plugin downloads the image from ChainIQ CDN server-side (not from the user's browser) and uploads it to the media library via `media_sideload_image()` or direct `wp_insert_attachment()` + `wp_generate_attachment_metadata()`.

**Featured image linking:** After upload, the attachment ID is used with `set_post_thumbnail($post_id, $attachment_id)`.

**Content image URL rewriting:** The plugin replaces `https://cdn.chainiq.io/images/...` URLs in the HTML with the WordPress media URLs. This ensures images are served from the site's own domain/CDN, not from ChainIQ.

#### Shopify Files API

Shopify handles image upload differently — the Blog Article API accepts an image URL directly:

```json
{
  "article": {
    "image": {
      "src": "https://cdn.chainiq.io/images/550e8400/featured.jpg",
      "alt": "N54 HPFP Failure"
    }
  }
}
```

Shopify downloads the image from the provided URL and hosts it on Shopify's CDN. The returned article includes the Shopify-hosted image URL. For content images embedded in `body_html`, Shopify does not process them — they remain as whatever URL is in the HTML. To ensure images are Shopify-hosted:

1. Upload via `POST /admin/api/2024-01/files.json` (Files API) with `original_source` URL
2. Wait for processing (poll until `status: "READY"`)
3. Get Shopify CDN URL from processed file
4. Replace CDN URLs in body_html before creating the article

**Note:** The Files API has a 20MB limit per file and processes asynchronously. For articles with many images, this adds latency.

#### Contentful Asset API

```
1. Create Asset metadata: PUT /spaces/{space}/environments/{env}/assets/{id}
   Body: { fields: { title: { "en-US": "..." }, file: { "en-US": { contentType: "image/jpeg", fileName: "...", upload: "https://cdn.chainiq.io/..." } } } }

2. Process Asset: PUT /spaces/{space}/environments/{env}/assets/{id}/files/en-US/process
   (Contentful downloads from the URL and processes)

3. Poll until processed: GET /spaces/{space}/environments/{env}/assets/{id}
   (Check for fields.file["en-US"].url being populated)

4. Publish Asset: PUT /spaces/{space}/environments/{env}/assets/{id}/published
```

Contentful assets are locale-specific. For multi-language articles, each locale needs its own file upload.

### Image Format Handling

| Format | WordPress | Shopify | Contentful | Strapi | Ghost | Webflow | Sanity |
| --- | --- | --- | --- | --- | --- | --- | --- |
| JPEG | Yes | Yes | Yes | Yes | Yes | Yes (via URL) | Yes |
| PNG | Yes | Yes | Yes | Yes | Yes | Yes (via URL) | Yes |
| WebP | WP 5.8+ | Yes | Yes | Yes | Yes | Yes (via URL) | Yes |
| GIF | Yes | Yes | Yes | Yes | Yes (static) | Yes (via URL) | Yes |
| AVIF | WP 6.5+ | No | Yes | Yes | No | No | Yes |
| SVG | Requires plugin | No | Yes | Config-dependent | No | No | Yes |

The pipeline checks the target platform's format support and converts images if needed. Primary conversion path: AVIF/WebP source → JPEG fallback for platforms that do not support modern formats.

### Parallel Upload with Concurrency Control

```javascript
async function uploadContentImages(images, adapter, maxConcurrent = 5) {
  const results = [];
  const queue = [...images];

  async function processNext() {
    if (queue.length === 0) return;
    const image = queue.shift();
    try {
      const result = await adapter.uploadMedia(image);
      results.push({ ...image, cms_url: result.url, cms_id: result.id, status: 'uploaded' });
    } catch (err) {
      results.push({ ...image, status: 'failed', error: err.message });
    }
    return processNext(); // Process next in queue
  }

  // Start maxConcurrent workers
  const workers = Array(Math.min(maxConcurrent, images.length))
    .fill(null)
    .map(() => processNext());

  await Promise.all(workers);
  return results;
}
```

Featured image is always uploaded first (serially, before content images) because its attachment ID or URL is needed for the article creation API call on most platforms.

---

## 11. Auth & Permissions

### Role Matrix

| Action | Anonymous | Authenticated User | Admin |
| --- | --- | --- | --- |
| View connected platforms | No | Own only | All |
| Connect new platform | No | Yes | Yes |
| Disconnect platform | No | Own only | Any |
| Publish article | No | Own articles to own connections | Any to any |
| View publish history | No | Own only | All |
| Test connection | No | Own only | Any |
| View publish metrics | No | Own only | All |
| Force duplicate override | No | Yes | Yes |
| Bulk publish | No | Yes (with rate limit) | Yes (higher limit) |

### API Key Lifecycle (WordPress Plugin)

```
1. USER generates API key in ChainIQ dashboard
   └── Key format: ciq_wp_{32_random_hex_chars}
   └── Key stored encrypted in platform_connections.api_key_encrypted
   └── SHA-256 hash stored in platform_connections.api_key_hash

2. USER copies key to WordPress plugin settings page
   └── Plugin stores key encrypted using WordPress salts (wp_hash + openssl_encrypt)
   └── Plugin sends verification request to ChainIQ backend
   └── Backend validates key, returns webhook_secret
   └── Plugin stores webhook_secret encrypted in wp_options

3. EACH PUSH: ChainIQ backend sends request with X-ChainIQ-Key header
   └── Plugin computes hash of received key
   └── Compares against stored hash (constant-time comparison)
   └── Verifies HMAC signature using webhook_secret
   └── If valid: process push. If invalid: 401.

4. KEY ROTATION: User generates new key in dashboard
   └── Old key immediately invalidated
   └── New key must be entered in WordPress plugin settings
   └── Until new key is entered, pushes fail with 401
   └── Connection status changes to 'auth_expired' after 3 failed pushes
```

### Platform OAuth (Shopify, Webflow, Contentful)

For platforms using OAuth 2.0:

```
1. Connection initiation → redirect to platform OAuth screen
2. User approves → platform redirects with authorization code
3. Code exchanged for access token (+ refresh token if supported)
4. Access token encrypted with AES-256-GCM, stored in platform_connections.oauth_token_encrypted
5. Refresh token (if available) encrypted separately in oauth_refresh_token_encrypted
6. Token expiration tracked in oauth_expires_at

Token refresh:
- Before each publish, check oauth_expires_at
- If expired or expiring within 5 minutes, attempt refresh
- If refresh succeeds, update encrypted token
- If refresh fails (revoked), mark connection as 'auth_expired'
```

### Credential Storage Security

| Platform | Credential Type | Storage Location | Encryption |
| --- | --- | --- | --- |
| WordPress | ChainIQ API Key | WP plugin: wp_options (encrypted with WP salts). ChainIQ: platform_connections.api_key_encrypted | AES-256-GCM via bridge/key-manager.js |
| Shopify | OAuth access token | platform_connections.oauth_token_encrypted | AES-256-GCM |
| Ghost | Admin API Key | platform_connections.api_key_encrypted | AES-256-GCM |
| Contentful | Personal Access Token or OAuth token | api_key_encrypted or oauth_token_encrypted | AES-256-GCM |
| Strapi | API Token | platform_connections.api_key_encrypted | AES-256-GCM |
| Webflow | OAuth access token | platform_connections.oauth_token_encrypted | AES-256-GCM |
| Sanity | API Token | platform_connections.api_key_encrypted | AES-256-GCM |
| Webhook | Webhook secret (for signing) | platform_connections.webhook_secret | AES-256-GCM |

**Critical rule:** CMS credentials are NEVER sent back to the client. The dashboard shows only:
- Platform type and site URL
- Connection status
- Last successful push timestamp
- Credential masked display (last 4 characters)

The actual credential value is never included in any API response.

---

## 12. Error Handling

### Error Taxonomy

Every error in the publishing pipeline is classified into one of three categories:

| Category | Behavior | Example |
| --- | --- | --- |
| **Retriable** | Auto-retry with exponential backoff (max 3 retries) | Network timeout, 5xx from CMS, rate limit (429) |
| **Non-retriable** | Fail immediately, notify user | 4xx from CMS, auth failure, validation error, Quality Gate not passed |
| **Degraded** | Proceed with reduced functionality, notify user | Image upload failed (publish article without images) |

### Scenario Catalog (12 Scenarios)

#### E-1: wp_kses_post Strips HTML Attributes

**Trigger:** Plugin fails to disable kses before `wp_insert_post()`, or a third-party plugin re-enables kses during the insert.

**Symptoms:** Published article missing inline styles, data attributes, custom classes. Tables lose styling. Callout boxes lose formatting.

**Detection:** After insert, the plugin re-reads `post_content` and computes SHA-256 hash. If hash differs from the pre-insert content hash, kses stripping occurred.

**Recovery:**
1. Log the difference (what was stripped)
2. Attempt to re-insert with kses explicitly disabled using `remove_filter('content_save_pre', 'wp_filter_post_kses')` as additional safety
3. If still stripped, update post with raw SQL via `$wpdb->update()` as last resort
4. Report to user: "Some HTML attributes were modified by WordPress sanitization. Review the post in the editor."

#### E-2: Shopify REST API Rate Limit (429)

**Trigger:** ChainIQ exceeds 2 requests/second to a Shopify store's API.

**Symptoms:** `429 Too Many Requests` response with `Retry-After` header.

**Detection:** HTTP response status code 429.

**Recovery:**
1. Read `Retry-After` header (seconds) or `X-Shopify-Shop-Api-Call-Limit` header
2. Queue the request with the specified delay
3. Resume after delay
4. If 5 consecutive 429s, pause all requests to this store for 60 seconds
5. Log rate limit events for monitoring

#### E-3: Image Upload Failure (Any Platform)

**Trigger:** CDN image URL unreachable, CMS media API returns error, image too large, unsupported format.

**Symptoms:** Article created without some or all images.

**Detection:** Image upload function returns error for individual images.

**Recovery (graduated):**
1. Retry the individual image upload once (transient network issue)
2. If retry fails, check if image is accessible from ChainIQ CDN (HEAD request)
3. If CDN image is gone, skip this image and continue
4. If CDN image exists but CMS rejects it: check format compatibility, attempt format conversion (WebP → JPEG)
5. Create the article with whatever images succeeded
6. Set `publish_records.images_failed` count
7. Notify user: "Article published with {N} of {M} images. {X} images failed to upload. You can manually upload them in the CMS editor."

#### E-4: CMS API Timeout

**Trigger:** Target CMS does not respond within the configured timeout (WordPress: 30s, Shopify: 15s, headless: 15s).

**Symptoms:** Publish hangs, then fails with ETIMEDOUT or ESOCKETTIMEDOUT.

**Detection:** HTTP client timeout event.

**Recovery:**
1. Mark attempt as failed with error code `CMS_TIMEOUT`
2. Before retrying, check if the article was partially created (race condition: CMS processed the request but response was lost)
3. For WordPress: call `/wp-json/chainiq/v1/history` to check if a post with this `_chainiq_article_id` exists
4. For Shopify: search articles by title
5. If article exists: mark as success, update remote_id and remote_url
6. If article does not exist: retry with backoff

#### E-5: Authentication Expired/Revoked

**Trigger:** OAuth token expired and refresh failed, or user revoked access from the CMS side.

**Symptoms:** 401 Unauthorized from CMS API on every request.

**Detection:** HTTP 401 response.

**Recovery:**
1. If OAuth platform: attempt token refresh using refresh_token
2. If refresh succeeds: update stored token, retry original request
3. If refresh fails or no refresh token: mark connection as `auth_expired`
4. Set `platform_connections.status = 'auth_expired'`
5. Dashboard shows warning banner: "Shopify connection expired. Re-authenticate to continue publishing."
6. Block all future publishes to this connection until re-authenticated

#### E-6: Duplicate Publish Detection

**Trigger:** User clicks "Publish to WordPress" for an article that was already published to the same WordPress site with identical content.

**Symptoms:** 409 Conflict response from ChainIQ API.

**Detection:** `payload_hash` match in `publish_records` for same `platform_connection_id`.

**Recovery:**
1. Return 409 with details of the existing publish record (when it was pushed, remote URL)
2. User can override with `force: true` if they intentionally want to re-push (e.g., post was deleted on CMS)
3. Force push creates a new post (does not update the old one — the old remote_id may be invalid)

#### E-7: WordPress Plugin Not Installed

**Trigger:** User attempts to publish to a WordPress site where the ChainIQ Connector plugin is not installed or is deactivated.

**Symptoms:** 404 from `/wp-json/chainiq/v1/status` or `/wp-json/chainiq/v1/receive`.

**Detection:** HTTP 404 or connection refused to plugin endpoints.

**Recovery:**
1. Check if standard WP REST API is available (`/wp-json/wp/v2/posts`)
2. If WP REST API available but plugin is not: suggest installing the plugin for full functionality
3. Do NOT fall back to standard WP REST API silently — it lacks Yoast/RankMath meta, HMAC verification, and kses bypass
4. Return clear error: "ChainIQ Connector plugin not detected on {site_url}. Install the plugin from Settings > Plugins to enable publishing."

#### E-8: Content Too Large for CMS

**Trigger:** Article HTML exceeds CMS field size limits (Webflow rich text: ~1MB, some Shopify themes: 64KB body_html).

**Symptoms:** CMS API returns 413 or validation error about field size.

**Detection:** HTTP 413 or CMS-specific field length error.

**Recovery:**
1. Log the content size and the CMS limit
2. For Webflow: truncate content at the nearest paragraph boundary and append "Read the full article at {canonical_url}"
3. For Shopify: Shopify's body_html has no hard limit in the API, but some themes break on very long content. Warn but proceed.
4. For all platforms: if truncation is needed, notify user that content was shortened

#### E-9: Network Issues — Site Behind Cloudflare/WAF

**Trigger:** WordPress site is behind Cloudflare, Sucuri, or another WAF/CDN that blocks API requests.

**Symptoms:** 403 Forbidden with Cloudflare challenge page HTML instead of JSON, or connection timeout.

**Detection:** Response body contains "cloudflare" or "challenge" HTML, or Content-Type is text/html when JSON was expected.

**Recovery:**
1. Detect Cloudflare/WAF challenge page
2. Return clear error: "Your WordPress site's firewall is blocking ChainIQ. Whitelist the following IP addresses: {chainiq_egress_ips}. Instructions: {link_to_docs}"
3. Provide specific Cloudflare WAF rule instructions
4. Alternative: if user cannot whitelist IPs, they can switch to "pull mode" where the WP plugin periodically checks ChainIQ for pending articles (Phase 3 feature)

#### E-10: CMS API Version Change / Breaking Change

**Trigger:** Shopify deprecates an API version, WordPress plugin updates change REST API behavior, headless CMS upgrades break field types.

**Symptoms:** Unexpected response format, missing fields in response, 400 errors on previously valid requests.

**Detection:** Response parsing fails, or CMS returns error about deprecated endpoint.

**Recovery:**
1. Log the full request and response for debugging
2. Check if the adapter has a newer API version handler
3. For Shopify: API version is in the URL path. Store last-known-good version in connection metadata. Fall back to it if new version fails.
4. For all platforms: mark connection with a warning flag. Alert user: "Publishing to {platform} encountered an API compatibility issue. Our team has been notified."
5. Platform adapters specify minimum and maximum supported API versions

#### E-11: Schema Markup Injection Failure

**Trigger:** CMS strips or corrupts `<script type="application/ld+json">` tags in article content.

**Symptoms:** Schema markup missing from published page. Google Search Console reports missing structured data.

**Detection:** After publish, if the adapter supports content verification, check for schema presence.

**Recovery:**
1. For WordPress: Schema is injected via `wp_head` action hook, not in post_content. The plugin adds `add_action('wp_head', ...)` for posts with `_chainiq_article_id` meta.
2. For Shopify: Schema must be in body_html (no alternative). If stripped, warn user to add schema via theme liquid template.
3. For Ghost: Ghost supports `codeinjection_head` field for per-post scripts. Use this for schema.
4. For headless CMS: Schema is a separate field in the payload — the frontend must render it.

#### E-12: Concurrent Publish Race Condition

**Trigger:** User clicks "Publish to WordPress" twice rapidly, or publishes the same article from two browser tabs.

**Symptoms:** Two draft posts created on WordPress for the same ChainIQ article.

**Detection:** The WordPress plugin checks for existing posts with the same `_chainiq_article_id` before inserting (upsert logic).

**Recovery:**
1. ChainIQ backend: before queuing a publish job, check for existing in-progress (`queued`, `pushing`, `uploading_images`) records for the same article + connection
2. If found: return 409 "A publish is already in progress for this article on this platform"
3. WordPress plugin: `find_by_chainiq_id()` check catches backend-side race conditions
4. If duplicate post created despite checks: the second publish updates the first post (upsert) rather than creating a new one

---

## 13. Edge Cases

### EC-1: WordPress Site Behind Cloudflare with "Under Attack" Mode

When Cloudflare's "I'm Under Attack" mode is enabled, every request gets a JavaScript challenge. The ChainIQ backend (making server-to-server calls) cannot execute JavaScript. The publish will fail with a 403 containing Cloudflare's challenge HTML.

**Handling:** Detect the Cloudflare challenge page (check for `cf-mitigated` header or HTML body containing "checking your browser"). Return a specific error code `CLOUDFLARE_CHALLENGE` with instructions to either whitelist ChainIQ's egress IPs or temporarily disable "Under Attack" mode.

### EC-2: WordPress Custom Post Types

Some WordPress sites use custom post types (CPTs) for blog content instead of the default `post` type. For example, a WooCommerce site might have a `product_review` CPT, or an LMS site might have a `lesson` CPT.

**Handling:** The publish request accepts an optional `post_type` parameter. The plugin's `/wp-json/chainiq/v1/status` endpoint reports all registered public post types. The dashboard fetches this list and presents it in the publish modal. If no `post_type` is specified, default to `post`.

### EC-3: Shopify Multi-Language Blogs

Shopify stores can have multiple blogs (not just one). Multi-language stores often create separate blogs for each language (e.g., "Blog (EN)", "Blog (AR)"). Shopify does not have native multi-language article support — each language variant is a separate article on a separate blog.

**Handling:** The publish modal fetches all blogs via the Shopify adapter and lets the user select the target blog. For multi-language publishing, the user publishes separately to each language's blog with the appropriate language version of the article.

### EC-4: Webflow CMS Collection Item Limits

Webflow CMS has hard limits on the number of items per collection (10,000 on Business plan, 1,000 on CMS plan). When the limit is approached or reached, new article creation fails.

**Handling:** Before publishing to Webflow, check current collection item count via the CMS API. If within 10% of the limit, warn the user. If at the limit, reject the publish with a clear message about the Webflow plan limitation.

### EC-5: Article with 20+ Images

Long-form guides can have 20-30 images. Uploading all of them serially would take minutes.

**Handling:** Parallel upload with concurrency limit of 5 (see Image CDN Pipeline section). Featured image uploads first (serially), then content images in parallel. Progress is reported via SSE events: "Uploading image 7 of 23..." Total upload time for 20 images at 200KB average: ~15 seconds with 5 concurrent uploads.

### EC-6: Very Long Articles (10,000+ Words)

Enterprise content can exceed 10,000 words. This creates a large `content_html` payload that may hit CMS field limits or cause timeout issues.

**Handling:**
- WordPress: `post_content` is MySQL `longtext` (4GB limit). No issue.
- Shopify: `body_html` has no documented hard limit but performance degrades on very long articles. Warn if > 15,000 words.
- Webflow: Rich text field has a practical limit of ~1MB HTML. Truncate with "continue reading" if exceeded.
- Ghost: No hard limit on HTML content.
- Contentful: Rich text document size limit varies by plan. Check before insert.

### EC-7: RTL Content in LTR CMS

Arabic/Hebrew articles (RTL direction) published to a CMS with an LTR default theme.

**Handling:**
- The adapter wraps the article body in `<div dir="rtl" lang="ar">` (or appropriate language code)
- Sets the `direction` field in the Universal Article Payload
- For WordPress: the `_chainiq_direction` post meta is set; the plugin adds a `dir="rtl"` attribute to the post content wrapper
- For Shopify: RTL wrapper div is included in `body_html`
- For headless CMS: the `direction` field is included as a separate content field for frontend rendering

### EC-8: WordPress Plugin Auto-Update Breaks

WordPress plugins can auto-update via the WP update system. A bad update could break the ChainIQ Connector plugin.

**Handling:**
- Plugin uses WordPress transient-based version checking
- Plugin reports its version to ChainIQ backend during health check
- If ChainIQ detects a known-bad plugin version, it blocks publishes with a clear message: "ChainIQ Connector plugin version 1.2.0 has a known issue. Please update to 1.2.1 or roll back to 1.1.0."
- Plugin includes a self-test function that runs on activation and after updates — creates a test post (immediately deleted) to verify core functionality

### EC-9: CMS Admin Deletes Published Article

User publishes an article to WordPress via ChainIQ, then deletes the WordPress post from WP admin. ChainIQ's publish record still shows "published" with a remote_url that now 404s.

**Handling:**
- The Feedback Loop (Service #12) will detect 404s during performance monitoring
- The publish record is updated with `status: 'removed_from_cms'` when a 404 is detected
- User can re-push the same article (duplicate detection allows re-push when the original is gone)

### EC-10: Multiple SEO Plugins Active Simultaneously

Some WordPress sites have both Yoast and RankMath active (usually during migration from one to the other). Setting meta for both would create conflicts.

**Handling:** The detection function uses priority order: Yoast > RankMath > AIOSEO > SEOPress. Only the highest-priority detected plugin gets its meta set. The plugin logs which SEO plugin was chosen and why. The `/wp-json/chainiq/v1/status` endpoint reports the detected SEO plugin so the user can verify.

### EC-11: Shopify App Uninstalled While Publish In Progress

The store owner uninstalls the ChainIQ app from Shopify while an article publish is in progress.

**Handling:**
- Shopify sends `APP_UNINSTALLED` webhook to ChainIQ
- ChainIQ receives webhook, marks connection as `disconnected`
- Any in-progress publish will fail with 401 on the next API call
- The publish record is marked `failed` with error "App uninstalled during publish"
- User sees the connection as disconnected in the dashboard

### EC-12: Unicode and Special Characters in Taxonomy

Article categories/tags contain special characters, emoji, or non-Latin scripts (Arabic, Chinese, etc.).

**Handling:**
- WordPress: `wp_insert_term()` handles Unicode. Slugs are transliterated via `sanitize_title()`.
- Shopify: Tags are plain strings — Unicode preserved.
- Ghost: Tags support Unicode. Slugs are auto-generated.
- All platforms: the adapter passes taxonomy strings as-is (UTF-8). The CMS handles slug generation.

---

## 14. Performance

### Publish Latency Targets

| Operation | Target (p50) | Target (p95) | Hard Limit |
| --- | --- | --- | --- |
| WordPress publish (text only, no images) | < 3s | < 5s | 30s |
| WordPress publish (with 5 images) | < 10s | < 15s | 60s |
| WordPress publish (with 20 images) | < 20s | < 35s | 120s |
| Shopify publish (text + featured image) | < 5s | < 8s | 30s |
| Shopify publish (with product references) | < 8s | < 12s | 45s |
| Ghost publish (text + images) | < 5s | < 8s | 30s |
| Contentful publish (with asset processing) | < 15s | < 30s | 120s |
| Webflow publish | < 5s | < 8s | 30s |
| Webhook delivery | < 2s | < 5s | 30s |
| Platform connection test (ping) | < 2s | < 5s | 10s |

### Image Upload Parallelization Strategy

```
SERIAL (blocking):
  1. Featured image → must complete before article creation
     └── Upload to CMS media library → get attachment ID/URL

PARALLEL (max 5 concurrent):
  2-N. Content images → can upload concurrently
     └── Each: download from CDN → upload to CMS → collect URL
     └── Semaphore with 5 permits prevents overwhelming CMS API

POST-CREATION (non-blocking):
  N+1. OG image → uploaded after article exists (not needed for creation)
     └── If OG image differs from featured image
```

### Bulk Publish Queue

When a user publishes multiple articles to the same platform (bulk publish), requests are queued to respect platform rate limits:

```
Bulk publish: 10 articles to WordPress
├── Article 1: queued → pushing → published (0s)
├── Article 2: queued → pushing → published (~12s)
├── Article 3: queued → pushing → published (~24s)
├── ...
└── Article 10: queued → pushing → published (~108s)

Total time: ~2 minutes for 10 articles with images
Progress reported via SSE: "Publishing 4 of 10 articles... 3 complete, 0 failed"
```

Articles within a bulk publish are independent — a failure on article 3 does not block article 4. The user sees per-article status in the progress UI.

### Connection Pool Management

For headless CMS platforms that support persistent connections (HTTP/2), the adapter maintains a connection pool per platform connection:
- Max connections per host: 3
- Connection idle timeout: 30 seconds
- Connection max lifetime: 5 minutes

For WordPress (HTTP/1.1 typically), each request is independent (no connection pooling from ChainIQ side — the WP plugin is stateless).

### Payload Caching

The Universal Article Payload is computed once per publish request and cached in memory for the duration of the publish operation. If publishing to multiple platforms simultaneously, the payload is computed once and passed to all adapters. This avoids repeated database queries for article content, images, and SEO metadata.

### Database Query Optimization

The publish flow requires these queries (optimized order):
1. `SELECT * FROM articles WHERE id = $1 AND user_id = $2` — single indexed lookup
2. `SELECT * FROM quality_scores WHERE article_id = $1 ORDER BY created_at DESC LIMIT 1` — indexed
3. `SELECT * FROM platform_connections WHERE id = $1 AND user_id = $2` — single indexed lookup
4. `SELECT * FROM publish_records WHERE payload_hash = $1 AND platform_connection_id = $2 LIMIT 1` — indexed duplicate check
5. `INSERT INTO publish_records (...)` — single insert
6. `UPDATE publish_records SET ... WHERE id = $1` — indexed update (on completion)

Total database round trips: 5-6. All queries use indexed columns. No joins required.

---

## 15. Testing Requirements

### Unit Tests — Universal Article Payload Validation

| Test ID | Test | Expected |
| --- | --- | --- |
| UAP-1 | Valid payload passes all validation rules | No errors |
| UAP-2 | Missing title returns validation error | Error: "title is required" |
| UAP-3 | Empty content_html returns validation error | Error: "content_html is required" |
| UAP-4 | SEO title > 70 chars returns warning | Warning (not error) — publish allowed |
| UAP-5 | Meta description > 170 chars returns warning | Warning |
| UAP-6 | Invalid image URL (HTTP, not HTTPS) returns error | Error: "must be HTTPS" |
| UAP-7 | Featured image width < 1200 returns warning | Warning |
| UAP-8 | Missing alt text on content image returns error | Error: "alt text required" |
| UAP-9 | quality_gate_passed = false blocks publish | Error: "Quality Gate not passed" |
| UAP-10 | Payload > 5MB returns error | Error: "payload exceeds 5MB limit" |
| UAP-11 | Invalid language code returns error | Error: "invalid ISO 639-1 code" |
| UAP-12 | direction not "ltr" or "rtl" returns error | Error |
| UAP-13 | 30 content images (max) passes validation | No errors |
| UAP-14 | 31 content images exceeds limit | Error: "max 30 content images" |

### Unit Tests — WordPress Adapter (Node.js side)

| Test ID | Test | Expected |
| --- | --- | --- |
| WPA-1 | publishToWordPress sends correct payload to plugin endpoint | Mock /wp-json/chainiq/v1/receive — verify request body |
| WPA-2 | publishToWordPress includes HMAC signature header | Verify X-ChainIQ-Signature present and valid |
| WPA-3 | publishToWordPress includes timestamp header | Verify X-ChainIQ-Timestamp within 5 seconds |
| WPA-4 | publishToWordPress retries on 502 from WordPress | Mock 502 first, 200 second — verify 2 attempts |
| WPA-5 | publishToWordPress does NOT retry on 401 | Mock 401 — verify exactly 1 attempt |
| WPA-6 | publishToWordPress respects 30s timeout | Mock slow response — verify timeout error |
| WPA-7 | checkWordPressStatus detects Yoast | Mock status endpoint returning seoPlugin: "yoast" |
| WPA-8 | checkWordPressStatus detects RankMath | Mock status endpoint returning seoPlugin: "rankmath" |
| WPA-9 | checkWordPressStatus handles plugin not installed (404) | Verify clear error message |

### Unit Tests — WordPress Plugin (PHP, PHPUnit)

| Test ID | Test | Expected |
| --- | --- | --- |
| WPP-1 | publish_article creates draft post | wp_insert_post called with post_status = "draft" |
| WPP-2 | publish_article sets title and content | Assert post_title and post_content match payload |
| WPP-3 | publish_article creates missing categories | wp_insert_term called for new category |
| WPP-4 | publish_article assigns existing categories | wp_set_object_terms called with correct term IDs |
| WPP-5 | publish_article creates missing tags | wp_insert_term called for new tag |
| WPP-6 | publish_article sets Yoast meta when Yoast active | Assert _yoast_wpseo_title, _metadesc, _focuskw set |
| WPP-7 | publish_article sets RankMath meta when RankMath active | Assert rank_math_title, description, focus_keyword |
| WPP-8 | publish_article sets AIOSEO meta when AIOSEO active | Assert _aioseo_title, _aioseo_description, _aioseo_keyphrases (JSON) |
| WPP-9 | publish_article skips SEO meta when no plugin active | Assert no SEO meta keys set |
| WPP-10 | publish_article sets featured image | set_post_thumbnail called with correct attachment ID |
| WPP-11 | publish_article handles image download failure | Post created without featured image, partial success returned |
| WPP-12 | publish_article upserts existing post | Existing post with same _chainiq_article_id updated, not duplicated |
| WPP-13 | publish_article disables kses during insert | kses_remove_filters called before, kses_init_filters after |
| WPP-14 | publish_article stores ChainIQ metadata | Assert _chainiq_article_id, _quality_score, _published_at meta |
| WPP-15 | verify_signature rejects invalid API key | 401 returned |
| WPP-16 | verify_signature rejects expired timestamp | 401 returned (> 5 minutes old) |
| WPP-17 | verify_signature rejects tampered HMAC | 401 returned |
| WPP-18 | verify_signature accepts valid request | true returned |
| WPP-19 | plugin activation creates custom table | chainiq_publish_history table exists after activation |
| WPP-20 | plugin deactivation does NOT delete posts | Published posts remain after deactivation |

### Unit Tests — Shopify Adapter

| Test ID | Test | Expected |
| --- | --- | --- |
| SHA-1 | publishToShopify creates article with correct body | Mock Shopify API — verify body_html in request |
| SHA-2 | publishToShopify sets SEO metafields | Verify metafields_global_title_tag and description_tag |
| SHA-3 | publishToShopify handles 429 rate limit | Mock 429 with Retry-After — verify retry after delay |
| SHA-4 | publishToShopify creates default blog if none exists | Mock empty blogs list — verify POST to create blog |
| SHA-5 | listBlogs returns parsed blog array | Mock Shopify blogs endpoint |
| SHA-6 | fetchProductCatalog paginates correctly | Mock 3 pages (250 each) — verify 750 products collected |
| SHA-7 | findRelevantProducts matches by title keywords | Article about "running shoes" matches product "Running Shoes Pro" |
| SHA-8 | findRelevantProducts respects maxRefs limit | 10 matches, maxRefs=3, assert 3 returned |
| SHA-9 | injectProductReferences inserts links | HTML input, assert `<a href="/products/...">` in output |
| SHA-10 | injectProductReferences avoids duplicate links | Existing link to same product — no duplicate added |
| SHA-11 | OAuth token exchange stores encrypted token | Mock Shopify OAuth callback — verify token encryption |
| SHA-12 | publishToShopify sets published=false for draft | Verify `"published": false` in API request |

### Unit Tests — Webhook Adapter

| Test ID | Test | Expected |
| --- | --- | --- |
| WHA-1 | Webhook sends full payload as JSON body | Mock endpoint — verify body is Universal Article Payload |
| WHA-2 | Webhook includes HMAC-SHA256 signature | Verify X-ChainIQ-Signature header is valid |
| WHA-3 | Webhook includes timestamp header | Verify X-ChainIQ-Timestamp present |
| WHA-4 | Webhook includes delivery ID header | Verify X-ChainIQ-Delivery is UUID |
| WHA-5 | Webhook retries on 500 with backoff | Mock 500 three times — verify delays: 5s, 30s, 120s |
| WHA-6 | Webhook does NOT retry on 400 | Mock 400 — verify exactly 1 attempt |
| WHA-7 | Webhook respects 30s timeout | Mock hanging endpoint — verify timeout |
| WHA-8 | Webhook includes custom headers | Configure X-Custom-Auth — verify present in request |
| WHA-9 | Webhook handles non-JSON response gracefully | Mock HTML response — verify error logged |

### Unit Tests — Headless CMS Adapters

| Test ID | Test | Platform | Expected |
| --- | --- | --- | --- |
| HCA-1 | testConnection verifies credentials | Contentful | Mock Management API GET /spaces — 200 = valid |
| HCA-2 | publish creates entry with mapped fields | Contentful | Verify field mapping applied correctly |
| HCA-3 | uploadMedia creates and processes Asset | Contentful | Asset created, processed, URL returned |
| HCA-4 | HTML converted to rich text JSON | Contentful | Headings, paragraphs, lists, images mapped |
| HCA-5 | testConnection verifies API token | Strapi | Mock GET /api/content-types — 200 = valid |
| HCA-6 | publish creates entry via REST | Strapi | POST /api/{type} with correct body |
| HCA-7 | uploadMedia via /api/upload | Strapi | File uploaded, ID returned |
| HCA-8 | Ghost JWT generated correctly | Ghost | Token valid for 5 minutes, correct audience |
| HCA-9 | Ghost publish creates post with HTML | Ghost | POST /ghost/api/admin/posts with html format |
| HCA-10 | Webflow publish creates collection item | Webflow | POST /v2/collections/{id}/items |
| HCA-11 | Webflow HTML simplified for rich text | Webflow | Custom classes stripped, tables simplified |
| HCA-12 | Sanity publish creates document via mutation | Sanity | createOrReplace mutation with correct _type |
| HCA-13 | HTML converted to Portable Text | Sanity | Blocks, marks, and references correct |
| HCA-14 | Sanity image uploaded as asset | Sanity | Binary upload returns asset reference |

### Integration Tests — API Endpoints

| Test ID | Test | Expected |
| --- | --- | --- |
| INT-1 | POST /api/publish/wordpress/push requires auth | 401 without Bearer token |
| INT-2 | POST /api/publish/wordpress/push rejects non-owner connection | 403 when connection belongs to different user |
| INT-3 | POST /api/publish/wordpress/push blocks unpassed Quality Gate | 422 with current score |
| INT-4 | POST /api/publish/wordpress/push detects duplicate | 409 with existing record details |
| INT-5 | POST /api/publish/wordpress/push allows force override | 200 with force=true on duplicate |
| INT-6 | GET /api/publish/status/:articleId returns history | 200 with array of publish records |
| INT-7 | GET /api/publish/platforms returns user's connections | 200 with connections array |
| INT-8 | POST /api/publish/platforms/connect validates WordPress key | 200 with active status on valid key |
| INT-9 | DELETE /api/publish/platforms/:id marks disconnected | Connection status = disconnected |
| INT-10 | POST /api/publish/platforms/:id/test returns health | Reachable, auth_valid, latency returned |
| INT-11 | Rate limit: 11th publish in 60s returns 429 | 429 Too Many Requests |

### Image Pipeline Tests

| Test ID | Test | Expected |
| --- | --- | --- |
| IMG-1 | Featured image uploaded before article creation | Verify sequence: upload → get ID → insert post |
| IMG-2 | Content images upload in parallel (max 5) | 10 images: verify max 5 concurrent uploads |
| IMG-3 | CDN URL replaced with CMS URL in HTML | content_html contains CMS media URLs, not CDN |
| IMG-4 | Failed image upload does not block article creation | Article created with remaining images |
| IMG-5 | WebP image converted to JPEG for incompatible CMS | Verify format conversion when target doesn't support WebP |
| IMG-6 | Image > 10MB rejected before upload attempt | Error: "image exceeds 10MB limit" |

### Error Recovery Tests

| Test ID | Test | Expected |
| --- | --- | --- |
| ERR-1 | Publish retries on 502 from WordPress | 3 retries with exponential backoff, then marked failed |
| ERR-2 | Publish fails immediately on 401 | No retry, marked failed, connection flagged |
| ERR-3 | Image failure degrades gracefully | Article published, images_failed count > 0 |
| ERR-4 | 3 consecutive failures trigger connection error state | platform_connections.status = 'error' |
| ERR-5 | Successful publish after errors resets error count | error_count = 0, status = 'active' |
| ERR-6 | Expired OAuth triggers re-auth prompt | Connection status = 'auth_expired' |
| ERR-7 | Concurrent duplicate publish prevented | Second attempt returns 409 |
| ERR-8 | Cloudflare challenge detected and reported | Error code CLOUDFLARE_CHALLENGE with instructions |

### Manual / Builder Compatibility Tests (WordPress)

| Test ID | Builder | Test | Expected |
| --- | --- | --- | --- |
| BLD-1 | Gutenberg | Open ChainIQ draft in block editor | Content in Classic block, headings/images/tables intact |
| BLD-2 | Classic Editor | Open ChainIQ draft in TinyMCE | HTML visible in Text tab, formatting in Visual tab |
| BLD-3 | Elementor | Open ChainIQ draft in Elementor | Content accessible, no layout corruption |
| BLD-4 | WPBakery | Open ChainIQ draft in backend editor | Content visible, no shortcode conflicts |
| BLD-5 | Divi | Open ChainIQ draft in Divi builder | Content in text module |
| BLD-6 | Beaver Builder | Open ChainIQ draft in Beaver Builder | Content accessible |
| BLD-7 | GeneratePress | View ChainIQ draft on frontend | Clean rendering, responsive |
| BLD-8 | Astra + Elementor | Full flow: publish + view | Builder styles applied, content intact |

---

## Dependencies

### Depends On
- **Auth & Bridge Server** (authentication, user context, rate limiting)
- **Supabase** (database, RLS policies, article storage, quality_scores table)
- **Quality Gate Service** (publish blocked until article passes — queries quality_scores)
- **KeyManager** (`bridge/key-manager.js` — AES-256-GCM encryption for API keys and OAuth tokens)
- **Image CDN** (temporary image hosting on cdn.chainiq.io before CMS upload)
- **Webhook System** (HMAC-SHA256 signing, existing `bridge/webhooks.js` patterns)
- **Article Pipeline** (produces the Universal Article Payload)

### Depended On By
- **Generation Pipeline** (final step after Quality Gate — delivery to CMS)
- **Feedback Loop** (uses `publish_records.remote_url` and `published_at` to track 30/60/90 day performance via GSC)
- **Dashboard** (Publishing page: connected platforms, publish history, push controls, SSE progress)
- **WordPress Plugin** (thin client — receives payloads from this service)
- **Shopify App** (thin client — receives payloads from this service)

---

## Files

| File | Purpose |
| --- | --- |
| `bridge/publishing/wordpress.js` | WordPress REST API + ChainIQ Connector push logic, image upload, SEO meta |
| `bridge/publishing/shopify.js` | Shopify Admin Blog API client, product-aware publishing, OAuth exchange |
| `bridge/publishing/contentful.js` | Contentful Management API adapter, rich text conversion |
| `bridge/publishing/strapi.js` | Strapi REST API adapter |
| `bridge/publishing/ghost.js` | Ghost Admin API adapter, JWT generation |
| `bridge/publishing/webflow.js` | Webflow CMS API adapter, HTML simplification |
| `bridge/publishing/sanity.js` | Sanity HTTP API adapter, Portable Text conversion |
| `bridge/publishing/webhook.js` | Generic webhook publisher with HMAC signing + retry |
| `bridge/publishing/image-pipeline.js` | Image CDN upload, CMS media library transfer, URL rewriting |
| `bridge/publishing/payload-validator.js` | Universal Article Payload schema validation |
| `bridge/publishing/adapter-interface.js` | Base CMSAdapter class (interface contract) |
| `bridge/routes/publish.js` | Express-style route handlers for /api/publish/* endpoints |
| `plugins/wordpress/chainiq-connector/chainiq-connector.php` | Main WordPress plugin file |
| `plugins/wordpress/chainiq-connector/includes/class-chainiq-api.php` | HTTP client for ChainIQ API |
| `plugins/wordpress/chainiq-connector/includes/class-chainiq-admin.php` | WP admin settings page + history |
| `plugins/wordpress/chainiq-connector/includes/class-chainiq-publisher.php` | Creates/updates WP posts via wp_insert_post |
| `plugins/wordpress/chainiq-connector/includes/class-chainiq-webhook-handler.php` | Receives push from ChainIQ, validates signature |
| `plugins/wordpress/chainiq-connector/includes/class-chainiq-image-handler.php` | Image download + media library upload |
| `plugins/shopify/chainiq-shopify/` | Shopify embedded admin app (Node.js + React) |
| `migrations/014-platform-connections.sql` | platform_connections table + RLS policies |
| `migrations/015-publish-records.sql` | publish_records + image_upload_log tables + indexes + RLS |

---

## Metrics

| Metric | Target | Alert Threshold |
| --- | --- | --- |
| Publish success rate (WordPress) | >= 98% | < 95% |
| Publish success rate (Shopify) | >= 97% | < 93% |
| Publish success rate (Webhook) | >= 95% | < 90% |
| Publish success rate (Headless CMS) | >= 95% | < 90% |
| Image upload success rate | >= 99% | < 95% |
| Average publish time — WordPress (with 5 images) | < 10s | > 20s |
| Average publish time — Shopify | < 8s | > 15s |
| Average publish time — Webhook | < 3s | > 10s |
| API key validation latency | < 50ms | > 200ms |
| Platform connection uptime | >= 99% active | < 95% |
| Retry resolution rate | >= 80% recovered in 3 retries | < 60% |
| Duplicate detection accuracy | 100% (no false negatives) | Any miss |
| Quality Gate enforcement | 100% (never bypassed) | Any bypass |
