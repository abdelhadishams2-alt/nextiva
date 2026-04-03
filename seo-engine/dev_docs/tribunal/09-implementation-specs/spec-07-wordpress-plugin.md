# Spec 07: WordPress Plugin — ChainIQ Connector (PHP)

**Status:** Implementation-Ready
**Priority:** Must Have (MoSCoW #50, #51, #52, #53, #70)
**Phase:** B-C (Weeks 10-16)
**Effort:** Backend XL (4+ weeks, PHP), Frontend integration M
**Dependencies:** #49 Universal Article Payload format
**Owner:** ChainIQ Platform Engineer
**High-Risk:** Builder compatibility testing (#93), Yoast/RankMath detection (#51)

---

## 1. Feature Overview

### What

A WordPress plugin (`chainiq-connector`) that connects any WordPress site to the ChainIQ backend, enabling direct article publishing from the ChainIQ dashboard. The plugin operates at the `wp_posts` database level via `wp_insert_post()`, making it compatible with every page builder (Gutenberg, Elementor, WPBakery, Divi, Classic Editor). It auto-sets categories, tags, featured images, and Yoast/RankMath SEO metadata. All articles are created as drafts (never auto-published). The plugin provides a ChainIQ menu in wp-admin for configuration, connection status, and publish history.

### Why

WordPress powers 43% of the web. Seven of 9 competitors offer WordPress integration. SRMG's editorial workflow requires direct CMS publishing. Without this plugin, content teams must copy-paste generated articles, losing SEO metadata, featured images, and taxonomy mappings. The plugin is the primary delivery mechanism for ChainIQ's value chain.

### Where

- **Plugin directory:** `plugins/wordpress/chainiq-connector/`
- **Main file:** `chainiq-connector.php`
- **Classes:** `includes/class-chainiq-api.php`, `class-chainiq-admin.php`, `class-chainiq-publisher.php`, `class-chainiq-webhook-handler.php`
- **Bridge server:** `bridge/publishing/wordpress.js` (server-side push)
- **Bridge route:** `bridge/routes/publish.js`

### Architecture

```
ChainIQ Dashboard ──► Bridge Server ──► WordPress REST API ──► wp_insert_post()
                                               │
                                    WordPress Plugin (receiver)
                                    ├── Validates API key
                                    ├── Creates draft post
                                    ├── Uploads featured image
                                    ├── Sets categories/tags
                                    ├── Sets Yoast/RankMath meta
                                    └── Returns post ID + edit URL
```

The plugin exposes custom REST API endpoints under `/wp-json/chainiq/v1/` that the bridge server calls. Authentication uses a plugin-generated API key stored in `wp_options`, matched against the `X-ChainIQ-API-Key` header.

### Effort Breakdown

| Component | Effort | Language |
|-----------|--------|----------|
| Plugin scaffold (main file, activation, deactivation) | S | PHP |
| ChainIQ API client class | M | PHP |
| Admin menu + settings page | M | PHP |
| Publisher class (wp_insert_post + media) | L | PHP |
| Yoast/RankMath SEO meta integration | M | PHP |
| Webhook handler (receive push from ChainIQ) | M | PHP |
| Bridge-side WordPress client | L | Node.js |
| Bridge-side publish endpoints | M | Node.js |
| Builder compatibility testing | L | Manual |
| **Total** | **XL** | **PHP + Node.js** |

---

## 2. User Stories

**US-7.1** — Given a WordPress site, when I install and activate the ChainIQ Connector plugin, then a "ChainIQ" menu appears in wp-admin with settings, connection status, and publish history tabs.

**US-7.2** — Given the plugin settings page, when I enter my ChainIQ API key and click "Connect," then the plugin validates the key against the ChainIQ backend and displays a green "Connected" status badge.

**US-7.3** — Given a generated article in ChainIQ, when I click "Publish to WordPress," then the article is created as a draft post with title, content, excerpt, categories, tags, and featured image — all set automatically.

**US-7.4** — Given a WordPress site with Yoast SEO installed, when a ChainIQ article is published, then the Yoast meta title, meta description, and focus keyphrase are auto-filled from the article's SEO metadata.

**US-7.5** — Given a WordPress site with RankMath installed, when a ChainIQ article is published, then the RankMath focus keyword, meta title, and meta description are auto-filled correctly.

**US-7.6** — Given a published draft, when I view it in the WordPress editor (Gutenberg or Classic), then the content renders correctly with all headings, images, tables, and formatting intact.

**US-7.7** — Given a published draft in Elementor, when I open it in the Elementor editor, then the content is editable within a text widget without layout corruption.

**US-7.8** — Given the ChainIQ admin page, when I view publish history, then I see a table of all articles pushed from ChainIQ with date, title, status (draft/published/trashed), and a link to the WordPress editor.

---

## 3. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| AC-1 | Plugin activates without errors on WordPress 6.0+ with PHP 8.0+ | Manual test on WP 6.0, 6.4, 6.7 |
| AC-2 | Plugin creates a top-level "ChainIQ" menu in wp-admin sidebar | Manual: verify menu appears after activation |
| AC-3 | API key validation: valid key returns 200, invalid returns 401 | Integration test against bridge server |
| AC-4 | `wp_insert_post()` creates a draft post with correct title, content, excerpt | Unit test: verify post data in database |
| AC-5 | Featured image uploaded to media library and set via `set_post_thumbnail()` | Integration test: verify attachment + thumbnail |
| AC-6 | Categories created if not existing, mapped by name | Unit test: new category creation + assignment |
| AC-7 | Tags created if not existing, mapped by name | Unit test: new tag creation + assignment |
| AC-8 | Yoast meta set when Yoast is active: `_yoast_wpseo_title`, `_yoast_wpseo_metadesc`, `_yoast_wpseo_focuskw` | Unit test: verify post_meta values |
| AC-9 | RankMath meta set when RankMath is active: `rank_math_focus_keyword`, `rank_math_title`, `rank_math_description` | Unit test: verify post_meta values |
| AC-10 | Plugin detects Yoast vs RankMath vs neither and sets appropriate meta | Unit test: mock active_plugins check |
| AC-11 | Content renders correctly in Gutenberg (block editor) | Manual test: open draft, verify formatting |
| AC-12 | Content renders correctly in Classic Editor | Manual test: open draft, verify formatting |
| AC-13 | Content displays in Elementor without layout corruption | Manual test: open in Elementor, verify text widget |
| AC-14 | API key stored encrypted in `wp_options` (not plaintext) | Code review: verify `wp_hash()` or openssl usage |
| AC-15 | Plugin handles network errors gracefully (ChainIQ backend unreachable) | Test: block outbound, verify error message |
| AC-16 | Publish history table shows all pushed articles with correct status | Manual: push 3 articles, verify table |
| AC-17 | Plugin deactivation does NOT delete published posts or settings | Manual: deactivate, verify posts persist |

---

## 4. UI/UX Description

### ChainIQ Admin Menu (wp-admin)

```
+------------------------------------------------------------------+
| ★ ChainIQ Connector                              v1.0.0          |
+------------------------------------------------------------------+
|  [Settings]  [Connection]  [Publish History]                      |
+------------------------------------------------------------------+
|                                                                    |
|  CONNECTION STATUS                                                 |
|  +--------------------------------------------------------------+ |
|  | ChainIQ Backend: ● Connected                                 | |
|  | API Key: ****-****-****-7f3a                                  | |
|  | Last Sync: 2026-03-28 14:22 UTC                              | |
|  | WordPress Version: 6.7.1                                      | |
|  | SEO Plugin: Yoast SEO (detected)                              | |
|  | [Test Connection]                        [Disconnect]          | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  SETTINGS                                                          |
|  +--------------------------------------------------------------+ |
|  | API Key:    [********************************]  [Save]        | |
|  | Default Status: [Draft ▼]                                     | |
|  | Default Author: [Admin ▼]                                     | |
|  | Default Category: [Uncategorized ▼]                           | |
|  | Auto-set Featured Image: [✓]                                  | |
|  | Auto-set SEO Meta: [✓]                                        | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  PUBLISH HISTORY                                                   |
|  +--------------------------------------------------------------+ |
|  | Date       | Title                    | Status | Actions      | |
|  |------------|--------------------------|--------|------------- | |
|  | 2026-03-28 | N54 HPFP Failure Guide   | Draft  | [Edit] [View]| |
|  | 2026-03-27 | B58 Tuning Platforms     | Pub    | [Edit] [View]| |
|  | 2026-03-25 | M340i Long Term Review   | Draft  | [Edit] [View]| |
|  +--------------------------------------------------------------+ |
|  Showing 3 of 3 articles                   [← Previous] [Next →] | |
|                                                                    |
+------------------------------------------------------------------+
```

### Design

- Uses WordPress admin styles (`wp-admin` CSS classes) for native look
- No external CSS frameworks
- Settings page uses WordPress Settings API (`register_setting`, `add_settings_section`, `add_settings_field`)
- Admin notices for success/error messages (`add_action('admin_notices', ...)`)
- Publish history uses `WP_List_Table` class for consistent table styling with pagination and sorting

---

## 5. Database Changes

### WordPress Side (wp_options)

| Option Key | Value | Purpose |
|------------|-------|---------|
| `chainiq_api_key` | Encrypted string | API key for ChainIQ backend |
| `chainiq_backend_url` | URL string | ChainIQ backend URL (default: `https://api.chainiq.io`) |
| `chainiq_default_status` | `draft` | Default post status |
| `chainiq_default_author` | User ID | Default post author |
| `chainiq_default_category` | Term ID | Default category |
| `chainiq_auto_featured_image` | `yes`/`no` | Auto-set featured image |
| `chainiq_auto_seo_meta` | `yes`/`no` | Auto-set SEO meta |
| `chainiq_publish_history` | JSON array | Last 100 publish events |
| `chainiq_connected_at` | Timestamp | When connection was established |

### WordPress Side (post_meta per article)

| Meta Key | Value | Purpose |
|----------|-------|---------|
| `_chainiq_article_id` | UUID | Links back to ChainIQ article record |
| `_chainiq_quality_score` | Float | Quality gate score at publish time |
| `_chainiq_published_at` | ISO datetime | When pushed from ChainIQ |
| `_chainiq_version` | Integer | Article version number |

### ChainIQ Side (Supabase)

New columns on existing `articles` table:

```sql
ALTER TABLE articles ADD COLUMN IF NOT EXISTS cms_platform TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS cms_post_id TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS cms_post_url TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS cms_published_at TIMESTAMPTZ;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS cms_status TEXT CHECK (cms_status IN ('pending', 'pushed', 'published', 'failed'));
```

### Migration: `migrations/015-articles-cms-columns.sql`

---

## 6. API / Backend Changes

### WordPress Plugin REST Endpoints (PHP)

**`POST /wp-json/chainiq/v1/publish`** — Receive article from ChainIQ

```
Request:
  Headers: X-ChainIQ-API-Key: <key>
  Body: {
    title: string,
    content: string,              // HTML content
    excerpt: string,
    categories: string[],         // Category names (created if missing)
    tags: string[],               // Tag names (created if missing)
    featuredImage: {
      url: string,                // CDN URL to download
      alt: string,
      filename: string
    },
    seo: {
      metaTitle: string,
      metaDescription: string,
      focusKeyword: string
    },
    articleId: string,            // ChainIQ article UUID
    qualityScore: number,
    version: number
  }

Response (201):
  {
    success: true,
    postId: 1234,
    editUrl: "https://example.com/wp-admin/post.php?post=1234&action=edit",
    viewUrl: "https://example.com/?p=1234&preview=true"
  }

Response (401): { success: false, error: "Invalid API key" }
Response (400): { success: false, error: "Missing required field: title" }
```

**`GET /wp-json/chainiq/v1/status`** — Health check + capability detection

```
Response (200):
  {
    success: true,
    wordpress: "6.7.1",
    php: "8.2.0",
    seoPlugin: "yoast",         // "yoast" | "rankmath" | "aioseo" | null
    chainiqVersion: "1.0.0",
    connected: true
  }
```

**`GET /wp-json/chainiq/v1/history`** — Publish history

```
Response (200): { success: true, data: [{ postId, title, status, publishedAt, editUrl }] }
```

### Bridge Server — `bridge/publishing/wordpress.js`

```javascript
module.exports = {
  async publishToWordPress(connectionConfig, articlePayload),
  // connectionConfig: { siteUrl, apiKey }
  // articlePayload: Universal Article Payload format
  // Returns: { postId, editUrl, viewUrl }

  async checkWordPressStatus(connectionConfig),
  // Returns: { wordpress, php, seoPlugin, connected }

  async uploadImage(connectionConfig, imageUrl, filename, alt),
  // Downloads image, uploads to WP media library
  // Returns: { attachmentId, url }
};
```

### Bridge Server — `bridge/routes/publish.js`

**`POST /api/publish/wordpress`** — Push article to WordPress

```
Request:
  Headers: Authorization: Bearer <token>
  Body: {
    articleId: string,            // ChainIQ article UUID
    connectionId: string,         // client_connections UUID
    categories?: string[],
    tags?: string[]
  }

Response (200):
  {
    success: true,
    data: { postId: 1234, editUrl: "...", viewUrl: "..." }
  }
```

**`GET /api/publish/wordpress/status/:connectionId`** — Check WP site status

```
Response (200): { success: true, data: { wordpress, php, seoPlugin, connected } }
```

### Edge Cases

- **Image download fails:** Create post without featured image, log warning, return partial success
- **Category name contains special characters:** WordPress handles via `wp_insert_term()` sanitization
- **Yoast/RankMath not installed:** Skip SEO meta silently, log info
- **WordPress site unreachable:** Return 502 with retry-after header
- **API key rotation:** Old key immediately invalid, new key generated in wp-admin
- **Post already exists (duplicate articleId):** Update existing post instead of creating new one (upsert behavior via `_chainiq_article_id` meta query)
- **Large content (>64KB):** WordPress handles via longtext MySQL column, no limit
- **HTML sanitization:** WordPress runs `wp_kses_post()` on content, which strips some tags. The plugin uses `'post_content_filtered'` or disables kses for the insert operation.

### Publisher Class — Core Logic

```php
class ChainIQ_Publisher {
    public function publish_article($payload) {
        // 1. Prepare post data
        $post_data = [
            'post_title'   => sanitize_text_field($payload['title']),
            'post_content' => $payload['content'],  // Raw HTML preserved
            'post_excerpt' => sanitize_text_field($payload['excerpt'] ?? ''),
            'post_status'  => get_option('chainiq_default_status', 'draft'),
            'post_author'  => get_option('chainiq_default_author', 1),
            'post_type'    => 'post',
        ];

        // 2. Check for existing post (upsert)
        $existing = $this->find_by_chainiq_id($payload['articleId']);
        if ($existing) {
            $post_data['ID'] = $existing->ID;
        }

        // 3. Insert/update post
        // Temporarily disable kses for raw HTML
        kses_remove_filters();
        $post_id = wp_insert_post($post_data, true);
        kses_init_filters();

        if (is_wp_error($post_id)) {
            return ['success' => false, 'error' => $post_id->get_error_message()];
        }

        // 4. Set categories and tags
        $this->set_taxonomy($post_id, $payload['categories'] ?? [], 'category');
        $this->set_taxonomy($post_id, $payload['tags'] ?? [], 'post_tag');

        // 5. Upload and set featured image
        if (!empty($payload['featuredImage'])) {
            $this->set_featured_image($post_id, $payload['featuredImage']);
        }

        // 6. Set SEO meta (Yoast or RankMath)
        if (get_option('chainiq_auto_seo_meta', 'yes') === 'yes') {
            $this->set_seo_meta($post_id, $payload['seo'] ?? []);
        }

        // 7. Store ChainIQ metadata
        update_post_meta($post_id, '_chainiq_article_id', $payload['articleId']);
        update_post_meta($post_id, '_chainiq_quality_score', $payload['qualityScore'] ?? 0);
        update_post_meta($post_id, '_chainiq_published_at', current_time('mysql'));
        update_post_meta($post_id, '_chainiq_version', $payload['version'] ?? 1);

        return [
            'success' => true,
            'postId'  => $post_id,
            'editUrl' => admin_url("post.php?post={$post_id}&action=edit"),
            'viewUrl' => get_permalink($post_id),
        ];
    }

    private function set_seo_meta($post_id, $seo) {
        if ($this->is_plugin_active('yoast')) {
            update_post_meta($post_id, '_yoast_wpseo_title', $seo['metaTitle'] ?? '');
            update_post_meta($post_id, '_yoast_wpseo_metadesc', $seo['metaDescription'] ?? '');
            update_post_meta($post_id, '_yoast_wpseo_focuskw', $seo['focusKeyword'] ?? '');
        } elseif ($this->is_plugin_active('rankmath')) {
            update_post_meta($post_id, 'rank_math_focus_keyword', $seo['focusKeyword'] ?? '');
            update_post_meta($post_id, 'rank_math_title', $seo['metaTitle'] ?? '');
            update_post_meta($post_id, 'rank_math_description', $seo['metaDescription'] ?? '');
        }
        // AIOSEO, SEOPress: Phase C extension (#69)
    }

    private function is_plugin_active($plugin) {
        $active = get_option('active_plugins', []);
        $map = [
            'yoast'    => 'wordpress-seo/wp-seo.php',
            'rankmath' => 'seo-by-rank-math/rank-math.php',
        ];
        return in_array($map[$plugin] ?? '', $active, true);
    }
}
```

---

## 7. Frontend Components

### WordPress Admin (PHP-rendered, no React)

| Component | File | Purpose |
|-----------|------|---------|
| Settings page | `includes/class-chainiq-admin.php` | API key, defaults, connection test |
| Publish history table | `includes/class-chainiq-admin.php` | `WP_List_Table` subclass |
| Connection status widget | `includes/class-chainiq-admin.php` | Dashboard widget |
| Admin notices | `includes/class-chainiq-admin.php` | Success/error messages |

### ChainIQ Dashboard (Next.js)

| Component | Path | Props |
|-----------|------|-------|
| `PublishButton` | `components/publish/publish-button.tsx` | `articleId: string, connections: Connection[]` |
| `PublishModal` | `components/publish/publish-modal.tsx` | `articleId: string, onPublish, onCancel` |
| `PublishProgress` | `components/publish/publish-progress.tsx` | `jobId: string` (SSE) |
| `PublishHistory` | `components/publish/publish-history.tsx` | `articleId?: string` |
| `WordPressConnectionCard` | `components/connections/wordpress-card.tsx` | `connection: Connection` |

### Modified Components

| Component | Change |
|-----------|--------|
| Article detail page | Add "Publish" button in header |
| Connections page | Add WordPress connection card with setup wizard |
| Dashboard sidebar | Add "Publishing" nav item |

### State

- Publish button disabled until quality gate passes
- Publish modal shows category/tag selectors (fetched from WP site)
- SSE progress: "Uploading images... Setting metadata... Creating draft..."
- Success state: shows WordPress edit link

---

## 8. Test Plan

### PHP Unit Tests (PHPUnit or WP_Mock)

| Test | Description |
|------|-------------|
| `test_publish_creates_draft_post` | Insert post, assert status = draft |
| `test_publish_sets_title_and_content` | Assert post_title and post_content |
| `test_publish_sets_categories` | New + existing categories |
| `test_publish_sets_tags` | New + existing tags |
| `test_publish_sets_featured_image` | Mock image download, assert thumbnail |
| `test_publish_sets_yoast_meta` | Yoast active, assert meta values |
| `test_publish_sets_rankmath_meta` | RankMath active, assert meta values |
| `test_publish_skips_seo_when_no_plugin` | Neither active, assert no meta |
| `test_publish_upserts_existing_post` | Same articleId, assert update not insert |
| `test_api_key_validation_rejects_invalid` | Wrong key, assert 401 |
| `test_api_key_validation_accepts_valid` | Correct key, assert pass |
| `test_publish_handles_image_download_failure` | Mock 404, assert post created without image |

### Node.js Integration Tests — `test/wordpress-publisher.test.js`

| Test | Description |
|------|-------------|
| `publishToWordPress creates draft on WP site` | Mock WP REST API, assert correct payload |
| `publishToWordPress handles 401 from WP` | Invalid key, assert error |
| `publishToWordPress handles timeout` | WP unreachable, assert timeout error |
| `POST /api/publish/wordpress returns 200` | Full bridge-to-WP flow |
| `POST /api/publish/wordpress returns 400 without articleId` | Validation |
| `POST /api/publish/wordpress requires auth` | No token = 401 |
| `checkWordPressStatus detects Yoast` | Mock status endpoint |
| `checkWordPressStatus detects RankMath` | Mock status endpoint |

### Manual Builder Compatibility Tests

| Builder | Test | Expected |
|---------|------|----------|
| Gutenberg | Open draft in block editor | Content in single Classic block, formatting intact |
| Classic Editor | Open draft in TinyMCE | HTML visible in Text tab, formatting in Visual tab |
| Elementor | Import to Elementor | Content in text widget, no corruption |
| WPBakery | Open in backend editor | Content visible, no shortcode conflicts |
| Divi | Open in Divi builder | Content in text module |

---

## 9. Rollout Plan

### Feature Flag

Bridge server: `FEATURE_WORDPRESS_PUBLISHING=true`. Plugin: always active once installed (no server-side flag needed).

### Phases

1. **Week 1:** Plugin scaffold + API key auth + REST endpoints. Bridge-side WordPress client.
2. **Week 2:** Publisher class: `wp_insert_post`, categories, tags, featured image upload.
3. **Week 3:** Yoast/RankMath meta integration. Admin page with settings + history.
4. **Week 4:** Dashboard publish button + modal. SSE progress. Builder compatibility testing.
5. **Week 5:** Bug fixes from compatibility testing. wp.org plugin submission preparation (optional, not blocking).

### Monitoring

- Bridge server: log publish success/failure per WordPress site
- Plugin: log publish events to `chainiq_publish_history` option
- Alert on 3+ consecutive publish failures to same site (connection likely broken)

### User Communications

- Plugin activation: admin notice with setup instructions
- ChainIQ dashboard: "WordPress connected" badge on connections page
- First successful publish: celebration confetti (optional, low priority)

---

## 10. Accessibility & Mobile

### WordPress Admin (Plugin Pages)

- Uses WordPress native admin styles, inherits WP accessibility features
- Form labels associated with inputs via `for` attribute
- API key field: `type="password"` with show/hide toggle
- Admin notices: `role="alert"` for screen readers
- History table: sortable columns with `aria-sort` attributes
- All actions have visible focus indicators (WP default)

### Keyboard Navigation (wp-admin)

- Tab through settings fields, save button, test connection button
- History table: Tab to rows, Enter to follow edit/view links
- All interactive elements reachable without mouse

### RTL / Arabic (wp-admin)

- WordPress admin auto-detects RTL from site language setting
- Plugin uses WordPress translation functions (`__()`, `_e()`) for all UI strings
- Text domain: `chainiq-connector`
- RTL stylesheet: `chainiq-admin-rtl.css` loaded when `is_rtl()` returns true

### ChainIQ Dashboard (Publish Components)

- Publish button: accessible label "Publish to WordPress"
- Publish modal: focus trap, Escape to close
- Progress: `role="progressbar"` with `aria-valuenow`
- Mobile: publish button full-width on < 768px, modal becomes bottom sheet
- All status badges: color + icon (never color-only)
