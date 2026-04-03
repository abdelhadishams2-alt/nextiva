# PB-002: WordPress Connector Plugin

> **Phase:** 9 | **Priority:** P1 | **Status:** NOT STARTED
> **Effort:** XL (20h) | **Type:** feature
> **Sprint:** 8 (Weeks 15-16)
> **Backlog Items:** Universal Publishing — WordPress Plugin + Bridge Endpoint
> **Assigned:** Unassigned

## Context Header
Before starting, read:
1. `CLAUDE.md` (auto-loaded)
2. `PROJECT-BRIEF.md` — Section "Layer 5: Universal Publishing", WordPress Plugin details
3. `bridge/publishing/payload.js` — Universal Article Payload builder from PB-001
4. `bridge/publishing/image-pipeline.js` — Image upload pipeline from PB-001
5. `bridge/server.js` — endpoint patterns, auth middleware
6. WordPress REST API Handbook (reference for wp_insert_post, media endpoints)

## Objective
Create a WordPress plugin (`chainiq-connector`) that connects any WordPress site to ChainIQ. The plugin registers a REST API endpoint at `/wp-json/chainiq/v1/receive` to accept published articles, and provides a wp-admin settings page for configuration. On the bridge server side, add a push endpoint that sends the Universal Article Payload to the WordPress site. The plugin uses `wp_insert_post()` at the database level, making it compatible with ALL page builders (Gutenberg, Elementor, WPBakery, Classic Editor).

## File Plan

| Action | Path | What |
|--------|------|------|
| CREATE | `plugins/wordpress/chainiq-connector/chainiq-connector.php` | Main plugin file — WordPress hooks, plugin header, activation/deactivation |
| CREATE | `plugins/wordpress/chainiq-connector/includes/class-chainiq-api.php` | HTTP client for ChainIQ bridge server communication |
| CREATE | `plugins/wordpress/chainiq-connector/includes/class-chainiq-admin.php` | WordPress admin settings page, menu registration |
| CREATE | `plugins/wordpress/chainiq-connector/includes/class-chainiq-publisher.php` | Article publishing logic: wp_insert_post, categories, tags, featured image, SEO meta |
| CREATE | `plugins/wordpress/chainiq-connector/includes/class-chainiq-webhook-handler.php` | REST API endpoint: /wp-json/chainiq/v1/receive |
| CREATE | `plugins/wordpress/chainiq-connector/readme.txt` | WordPress.org plugin readme format |
| MODIFY | `bridge/server.js` | Add `/api/publish/wordpress/push` endpoint |
| CREATE | `tests/wordpress-publisher.test.js` | Integration tests for bridge-side push logic |

## Sub-tasks

### Sub-task 1: Main Plugin File (~2h)
- Create `plugins/wordpress/chainiq-connector/chainiq-connector.php`
- WordPress plugin header: Plugin Name, Description, Version (1.0.0), Author (Chain Reaction), License (GPL-2.0+)
- Minimum requirements: WordPress 5.8+, PHP 7.4+
- Activation hook: create `chainiq_options` in wp_options with defaults
- Deactivation hook: clean up scheduled events (if any)
- Uninstall hook: remove `chainiq_options` from wp_options
- Load includes: require all class files from `includes/` directory
- Initialize: instantiate admin, webhook handler on `init` hook
- Text domain: `chainiq-connector` for i18n

### Sub-task 2: Admin Settings Page (~3h)
- Create `plugins/wordpress/chainiq-connector/includes/class-chainiq-admin.php`
- Register menu item under WordPress Settings: "ChainIQ" with dashicons-admin-links icon
- Settings page fields:
  - **ChainIQ API URL:** Text input for bridge server URL (e.g., `https://api.chainiq.io`)
  - **API Key:** Password input for X-ChainIQ-Key authentication header
  - **Default Post Status:** Dropdown: Draft (default), Pending Review, Published
  - **Default Author:** Dropdown of WordPress users (for article byline)
  - **Default Category:** Dropdown of existing categories
  - **Auto-set Featured Image:** Checkbox (default: checked)
  - **SEO Plugin:** Dropdown: None, Yoast SEO, RankMath, All-in-One SEO
  - **Connection Status:** Read-only indicator showing last successful connection
- Use WordPress Settings API (`register_setting`, `add_settings_section`, `add_settings_field`)
- "Test Connection" button that pings the bridge server and shows success/failure
- Sanitize all inputs: `sanitize_text_field()`, `sanitize_url()`, `absint()`
- Nonce verification on all form submissions

### Sub-task 3: Publisher Class (~6h)
- Create `plugins/wordpress/chainiq-connector/includes/class-chainiq-publisher.php`
- Main method: `publish_article($payload)` — accepts Universal Article Payload JSON
- **Post creation via wp_insert_post():**
  ```php
  $post_data = [
    'post_title'   => $payload['article']['title'],
    'post_content' => $payload['article']['html'],
    'post_status'  => get_option('chainiq_default_status', 'draft'),
    'post_type'    => 'post',
    'post_author'  => get_option('chainiq_default_author', 1),
    'post_excerpt' => $payload['article']['excerpt'],
    'post_name'    => $payload['article']['slug'],
  ];
  $post_id = wp_insert_post($post_data, true);
  ```
- **Why wp_insert_post() is universal:** WordPress stores all content in `wp_posts` table regardless of which builder is used. Gutenberg stores blocks as HTML comments in post_content, Elementor stores metadata separately but still uses the same post. By inserting at this level, ChainIQ works with every builder without needing builder-specific code.
- **Taxonomy (categories + tags):**
  - Map payload `taxonomy.categories` to WordPress categories: `wp_set_post_categories($post_id, $cat_ids)`
  - Create categories that don't exist: `wp_create_category($name)`
  - Map payload `taxonomy.tags` to WordPress tags: `wp_set_post_tags($post_id, $tags)`
- **Featured image:**
  - Download featured image from payload `images.featured.url`
  - Upload to WordPress media library: `media_handle_sideload()`
  - Set as post thumbnail: `set_post_thumbnail($post_id, $attachment_id)`
  - Set alt text: `update_post_meta($attachment_id, '_wp_attachment_image_alt', $alt)`
- **SEO meta (Yoast SEO):**
  ```php
  if ($seo_plugin === 'yoast') {
    update_post_meta($post_id, '_yoast_wpseo_title', $payload['seo']['metaTitle']);
    update_post_meta($post_id, '_yoast_wpseo_metadesc', $payload['seo']['metaDescription']);
    update_post_meta($post_id, '_yoast_wpseo_focuskw', $payload['seo']['focusKeyword']);
    update_post_meta($post_id, '_yoast_wpseo_canonical', $payload['seo']['canonicalUrl']);
  }
  ```
- **SEO meta (RankMath):**
  ```php
  if ($seo_plugin === 'rankmath') {
    update_post_meta($post_id, 'rank_math_title', $payload['seo']['metaTitle']);
    update_post_meta($post_id, 'rank_math_description', $payload['seo']['metaDescription']);
    update_post_meta($post_id, 'rank_math_focus_keyword', $payload['seo']['focusKeyword']);
    update_post_meta($post_id, 'rank_math_canonical_url', $payload['seo']['canonicalUrl']);
  }
  ```
- **Structured data:** Insert JSON-LD script from payload `schema` into post content footer or via `wp_head` hook
- **Return:** `{ success: true, postId, postUrl, editUrl }`
- **Error handling:** Return detailed errors for: duplicate slug, invalid category, media upload failure, permission denied

### Sub-task 4: Webhook Handler (~4h)
- Create `plugins/wordpress/chainiq-connector/includes/class-chainiq-webhook-handler.php`
- Register REST route: `register_rest_route('chainiq/v1', '/receive', [...])`
- HTTP method: POST
- **Authentication:** Validate `X-ChainIQ-Key` header against stored API key
  ```php
  public function authenticate($request) {
    $key = $request->get_header('X-ChainIQ-Key');
    $stored_key = get_option('chainiq_api_key');
    return hash_equals($stored_key, $key);
  }
  ```
- **Permission callback:** `authenticate()` method
- **Request processing:**
  1. Validate payload structure (required fields: article.title, article.html)
  2. Sanitize HTML content: `wp_kses_post()` for safe HTML filtering
  3. Call `ChainIQ_Publisher::publish_article($payload)`
  4. Return response with post ID and URL
- **Response format:**
  ```json
  { "success": true, "post_id": 123, "post_url": "https://...", "edit_url": "https://...wp-admin/post.php?post=123&action=edit" }
  ```
- **Error responses:** 401 (invalid key), 400 (invalid payload), 500 (publish failed)
- Rate limiting: maximum 10 publishes per minute (WordPress-side transient-based limiter)

### Sub-task 5: Bridge Server Push Endpoint (~3h)
- Add `POST /api/publish/wordpress/push` to `bridge/server.js`
- Auth required (Bearer token)
- Request body: `{ articleId: string, wordpressSiteUrl: string, apiKey: string }`
- Process:
  1. Build Universal Article Payload via `buildPayload(articleId)` from PB-001
  2. Run image pipeline: upload images to WordPress media library first
  3. POST payload to `${wordpressSiteUrl}/wp-json/chainiq/v1/receive` with `X-ChainIQ-Key` header
  4. Validate response: check for `success: true` and `post_id`
  5. Store publish record: article ID, platform "wordpress", remote post ID, URL, timestamp
- **Retry logic:** If push fails with 5xx, retry once after 5 seconds
- **Validation:** Verify WordPress site URL format, reject localhost/private IPs in production
- Return: `{ success: true, remotePostId, remotePostUrl }`
- Update article status in database: `published_to: [{ platform: 'wordpress', url, postId, publishedAt }]`

### Sub-task 6: Plugin readme.txt (~2h)
- Create `plugins/wordpress/chainiq-connector/readme.txt` in WordPress.org format
- Sections: Description, Installation, FAQ, Changelog, Screenshots
- Tested up to: WordPress 6.7
- Requires PHP: 7.4
- Tags: seo, content, ai, publishing, blog

## Testing Strategy

### Unit Tests (`tests/wordpress-publisher.test.js`)
- Test payload transformation: Universal Payload → WordPress post data mapping
- Test slug generation and sanitization
- Test category creation logic (existing vs new categories)
- Test SEO meta field mapping for Yoast and RankMath
- Test image pipeline: verify media upload request format
- Test authentication: X-ChainIQ-Key validation

### Integration Tests
- Test `/api/publish/wordpress/push` with mock WordPress endpoint
- Test full flow: build payload → process images → push to WordPress → verify response
- Test retry on 5xx error
- Test auth required on bridge endpoint
- Test publish record stored in database

## Acceptance Criteria
- [ ] WordPress plugin activates without errors on WordPress 5.8+ / PHP 7.4+
- [ ] Admin settings page with API URL, key, defaults, SEO plugin selection
- [ ] "Test Connection" verifies bridge server connectivity
- [ ] `wp_insert_post()` creates posts compatible with ALL builders (Gutenberg, Elementor, WPBakery, Classic)
- [ ] Categories created/mapped from payload taxonomy
- [ ] Tags set from payload taxonomy
- [ ] Featured image downloaded and set as post thumbnail
- [ ] Yoast SEO meta fields populated when Yoast selected
- [ ] RankMath meta fields populated when RankMath selected
- [ ] `/wp-json/chainiq/v1/receive` endpoint accepts payload with X-ChainIQ-Key auth
- [ ] Bridge `/api/publish/wordpress/push` sends payload and handles response
- [ ] Posts created as Draft by default (configurable)
- [ ] Publish record stored in ChainIQ database
- [ ] All tests pass (`npm test`)

## Dependencies
- Blocked by: PB-001 (Universal Article Payload)
- Blocks: PB-005 (dashboard publishing page)
