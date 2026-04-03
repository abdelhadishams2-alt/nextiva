/**
 * WordPress REST API Publishing Adapter
 *
 * Creates/updates WordPress posts via wp-json REST API using Application Passwords.
 * Handles Yoast/RankMath SEO meta, featured image upload, categories/tags creation,
 * and custom fields. Consumes the Universal Payload from payload.js.
 *
 * Zero npm dependencies — uses native fetch only.
 */

'use strict';

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const logger = require('../logger');
const { KeyManager } = require('../key-manager');

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = 1000; // doubles each retry
const REQUEST_TIMEOUT_MS = 30000;
const UPLOAD_TIMEOUT_MS = 120000;
const MAX_BODY_SIZE = 50 * 1024 * 1024; // 50MB for media uploads

// ── Encryption helpers (reuse key-manager pattern) ──────────────────────────

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

let _encryptionKey = null;

function getEncryptionKey() {
  if (_encryptionKey) return _encryptionKey;
  const envKey = process.env.BRIDGE_ENCRYPTION_KEY;
  if (envKey) {
    if (/^[0-9a-f]{64}$/i.test(envKey)) {
      _encryptionKey = Buffer.from(envKey, 'hex');
    } else {
      _encryptionKey = Buffer.from(envKey, 'base64');
    }
    if (_encryptionKey.length !== 32) {
      throw new Error('BRIDGE_ENCRYPTION_KEY must be exactly 32 bytes');
    }
  } else {
    _encryptionKey = crypto.randomBytes(32);
  }
  return _encryptionKey;
}

function encryptCredentials(plainObj) {
  const plaintext = JSON.stringify(plainObj);
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decryptCredentials(encryptedStr) {
  const parts = encryptedStr.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted credential format');
  const [ivHex, authTagHex, ciphertext] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

// ── HTTP helpers ─────────────────────────────────────────────────────────────

/**
 * Build Basic auth header from WordPress Application Password credentials.
 * @param {object} credentials - { username, applicationPassword }
 * @returns {string}
 */
function buildAuthHeader(credentials) {
  const { username, applicationPassword } = credentials;
  if (!username || !applicationPassword) {
    throw new Error('WordPress credentials require username and applicationPassword');
  }
  const encoded = Buffer.from(`${username}:${applicationPassword}`).toString('base64');
  return `Basic ${encoded}`;
}

/**
 * Make an authenticated request to WordPress REST API with retry logic.
 * Retries on 5xx errors with exponential backoff.
 *
 * @param {string} siteUrl - WordPress site URL (e.g., https://example.com)
 * @param {string} endpoint - REST API endpoint path (e.g., /wp-json/wp/v2/posts)
 * @param {object} options
 * @param {string} options.method - HTTP method
 * @param {object} [options.body] - JSON body
 * @param {Buffer} [options.binaryBody] - Binary body for uploads
 * @param {object} [options.headers] - Additional headers
 * @param {object} credentials - { username, applicationPassword }
 * @param {number} [timeoutMs] - Request timeout
 * @returns {Promise<{status: number, data: any, headers: object}>}
 */
async function wpFetch(siteUrl, endpoint, options, credentials, timeoutMs = REQUEST_TIMEOUT_MS) {
  const url = siteUrl.replace(/\/+$/, '') + endpoint;
  const authHeader = buildAuthHeader(credentials);

  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_BACKOFF_MS * Math.pow(2, attempt - 1);
      logger.info('wp_retry', { attempt, delay, endpoint });
      await sleep(delay);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers = {
        'Authorization': authHeader,
        'User-Agent': 'ChainIQ-Publisher/1.0',
        ...(options.headers || {})
      };

      if (options.body && !options.binaryBody) {
        headers['Content-Type'] = 'application/json';
      }

      const fetchOpts = {
        method: options.method || 'GET',
        headers,
        signal: controller.signal
      };

      if (options.body && !options.binaryBody) {
        fetchOpts.body = JSON.stringify(options.body);
      } else if (options.binaryBody) {
        fetchOpts.body = options.binaryBody;
      }

      const response = await fetch(url, fetchOpts);
      clearTimeout(timer);

      const responseData = await response.json().catch(() => null);

      // 401/403 — don't retry, auth issue
      if (response.status === 401) {
        return {
          status: 401,
          data: responseData,
          headers: Object.fromEntries(response.headers.entries()),
          error: 'Authentication failed. Check your WordPress username and application password.'
        };
      }
      if (response.status === 403) {
        return {
          status: 403,
          data: responseData,
          headers: Object.fromEntries(response.headers.entries()),
          error: 'Forbidden. The user does not have permission for this action.'
        };
      }

      // 5xx — retry
      if (response.status >= 500 && attempt < MAX_RETRIES) {
        lastError = new Error(`WordPress returned ${response.status}: ${JSON.stringify(responseData)}`);
        logger.warn('wp_server_error', { status: response.status, attempt, endpoint });
        continue;
      }

      return {
        status: response.status,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (err) {
      clearTimeout(timer);

      if (err.name === 'AbortError') {
        lastError = new Error(`Request timeout after ${timeoutMs}ms: ${endpoint}`);
      } else {
        lastError = err;
      }

      // Network errors — retry
      if (attempt < MAX_RETRIES) {
        logger.warn('wp_network_error', { error: lastError.message, attempt, endpoint });
        continue;
      }
    }
  }

  throw lastError || new Error(`WordPress API request failed after ${MAX_RETRIES + 1} attempts`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Connection management ────────────────────────────────────────────────────

/**
 * Save a WordPress connection (credentials encrypted at rest).
 * @param {object} supabase - Supabase client instance
 * @param {string} token - User auth token
 * @param {string} userId - User ID
 * @param {object} connectionData - { siteUrl, username, applicationPassword, label }
 * @returns {Promise<object>}
 */
async function saveConnection(supabase, token, userId, connectionData) {
  const { siteUrl, username, applicationPassword, label } = connectionData;

  if (!siteUrl || !username || !applicationPassword) {
    throw new Error('siteUrl, username, and applicationPassword are required');
  }

  // Validate site URL format
  let normalizedUrl;
  try {
    const parsed = new URL(siteUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Site URL must use http or https');
    }
    normalizedUrl = `${parsed.protocol}//${parsed.host}`;
  } catch (e) {
    throw new Error(`Invalid site URL: ${e.message}`);
  }

  // Encrypt credentials
  const encryptedCreds = encryptCredentials({ username, applicationPassword });

  const record = {
    user_id: userId,
    platform: 'wordpress',
    site_url: normalizedUrl,
    credentials_encrypted: encryptedCreds,
    status: 'pending_validation',
    label: label || normalizedUrl,
    metadata: {},
    last_sync: null
  };

  // Upsert — if user already has a connection for this site, update it
  const config = supabase.loadConfig();
  const serviceRoleKey = supabase.getServiceRoleKey();
  if (!config || !serviceRoleKey) throw new Error('Supabase config not available');

  // Check if connection exists
  const existingRes = await fetch(
    `${config.url}/rest/v1/platform_connections?user_id=eq.${userId}&platform=eq.wordpress&site_url=eq.${encodeURIComponent(normalizedUrl)}&select=id`,
    {
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    }
  );
  const existing = await existingRes.json();

  let result;
  if (existing && existing.length > 0) {
    // Update
    const updateRes = await fetch(
      `${config.url}/rest/v1/platform_connections?id=eq.${existing[0].id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          credentials_encrypted: encryptedCreds,
          status: 'pending_validation',
          label: label || normalizedUrl,
          updated_at: new Date().toISOString()
        })
      }
    );
    result = await updateRes.json();
    result = Array.isArray(result) ? result[0] : result;
  } else {
    // Insert
    const insertRes = await fetch(
      `${config.url}/rest/v1/platform_connections`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(record)
      }
    );
    result = await insertRes.json();
    result = Array.isArray(result) ? result[0] : result;
  }

  return sanitizeConnection(result);
}

/**
 * Get a WordPress connection by ID (decrypts credentials internally).
 * @returns {Promise<{connection: object, credentials: object}>}
 */
async function getConnection(supabase, userId, connectionId) {
  const config = supabase.loadConfig();
  const serviceRoleKey = supabase.getServiceRoleKey();
  if (!config || !serviceRoleKey) throw new Error('Supabase config not available');

  const res = await fetch(
    `${config.url}/rest/v1/platform_connections?id=eq.${connectionId}&user_id=eq.${userId}&platform=eq.wordpress&select=*`,
    {
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    }
  );
  const rows = await res.json();
  if (!rows || rows.length === 0) return null;

  const conn = rows[0];
  const credentials = decryptCredentials(conn.credentials_encrypted);
  return { connection: sanitizeConnection(conn), credentials };
}

/**
 * List WordPress connections for a user (credentials stripped).
 */
async function listConnections(supabase, userId) {
  const config = supabase.loadConfig();
  const serviceRoleKey = supabase.getServiceRoleKey();
  if (!config || !serviceRoleKey) throw new Error('Supabase config not available');

  const res = await fetch(
    `${config.url}/rest/v1/platform_connections?user_id=eq.${userId}&platform=eq.wordpress&select=id,user_id,platform,site_url,status,label,last_sync,metadata,created_at,updated_at&order=created_at.desc`,
    {
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    }
  );
  const rows = await res.json();
  return Array.isArray(rows) ? rows : [];
}

/**
 * Delete a WordPress connection.
 */
async function deleteConnection(supabase, userId, connectionId) {
  const config = supabase.loadConfig();
  const serviceRoleKey = supabase.getServiceRoleKey();
  if (!config || !serviceRoleKey) throw new Error('Supabase config not available');

  const res = await fetch(
    `${config.url}/rest/v1/platform_connections?id=eq.${connectionId}&user_id=eq.${userId}&platform=eq.wordpress`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    }
  );
  return res.ok;
}

/**
 * Strip encrypted credentials from connection object for API responses.
 */
function sanitizeConnection(conn) {
  if (!conn) return null;
  const { credentials_encrypted, ...safe } = conn;
  return safe;
}

// ── Validate connection ──────────────────────────────────────────────────────

/**
 * Test a WordPress connection by making an authenticated request.
 * Updates connection status in the database.
 */
async function validateConnection(supabase, userId, connectionId) {
  const connData = await getConnection(supabase, userId, connectionId);
  if (!connData) throw new Error('Connection not found');

  const { connection, credentials } = connData;
  const siteUrl = connection.site_url;

  try {
    // Test: fetch the authenticated user profile
    const result = await wpFetch(siteUrl, '/wp-json/wp/v2/users/me?context=edit', {
      method: 'GET'
    }, credentials);

    if (result.status === 200 && result.data && result.data.id) {
      // Update status to active
      await updateConnectionStatus(supabase, userId, connectionId, 'active', {
        wp_user_id: result.data.id,
        wp_user_name: result.data.name || result.data.slug,
        wp_capabilities: result.data.capabilities ? Object.keys(result.data.capabilities) : [],
        validated_at: new Date().toISOString()
      });
      return { valid: true, wpUser: result.data.name || result.data.slug };
    }

    await updateConnectionStatus(supabase, userId, connectionId, 'invalid', {
      error: result.error || `Unexpected status: ${result.status}`,
      validated_at: new Date().toISOString()
    });
    return { valid: false, error: result.error || `HTTP ${result.status}` };
  } catch (e) {
    await updateConnectionStatus(supabase, userId, connectionId, 'error', {
      error: e.message,
      validated_at: new Date().toISOString()
    });
    return { valid: false, error: e.message };
  }
}

async function updateConnectionStatus(supabase, userId, connectionId, status, metadata) {
  const config = supabase.loadConfig();
  const serviceRoleKey = supabase.getServiceRoleKey();
  if (!config || !serviceRoleKey) return;

  await fetch(
    `${config.url}/rest/v1/platform_connections?id=eq.${connectionId}&user_id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({
        status,
        metadata,
        updated_at: new Date().toISOString()
      })
    }
  );
}

// ── Categories & Tags ────────────────────────────────────────────────────────

/**
 * Resolve category names to WordPress IDs, creating any that don't exist.
 * @param {string} siteUrl
 * @param {string[]} categoryNames
 * @param {object} credentials
 * @returns {Promise<number[]>} Array of category IDs
 */
async function resolveCategories(siteUrl, categoryNames, credentials) {
  if (!categoryNames || categoryNames.length === 0) return [];

  const ids = [];

  for (const name of categoryNames) {
    const trimmed = name.trim();
    if (!trimmed) continue;

    // Search for existing category
    const searchResult = await wpFetch(
      siteUrl,
      `/wp-json/wp/v2/categories?search=${encodeURIComponent(trimmed)}&per_page=100`,
      { method: 'GET' },
      credentials
    );

    if (searchResult.status === 200 && Array.isArray(searchResult.data)) {
      const exact = searchResult.data.find(
        c => c.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (exact) {
        ids.push(exact.id);
        continue;
      }
    }

    // Create new category
    const createResult = await wpFetch(
      siteUrl,
      '/wp-json/wp/v2/categories',
      { method: 'POST', body: { name: trimmed } },
      credentials
    );

    if (createResult.status === 201 && createResult.data && createResult.data.id) {
      ids.push(createResult.data.id);
    } else {
      logger.warn('wp_category_create_failed', { name: trimmed, status: createResult.status });
    }
  }

  return ids;
}

/**
 * Resolve tag names to WordPress IDs, creating any that don't exist.
 * @param {string} siteUrl
 * @param {string[]} tagNames
 * @param {object} credentials
 * @returns {Promise<number[]>} Array of tag IDs
 */
async function resolveTags(siteUrl, tagNames, credentials) {
  if (!tagNames || tagNames.length === 0) return [];

  const ids = [];

  for (const name of tagNames) {
    const trimmed = name.trim();
    if (!trimmed) continue;

    // Search for existing tag
    const searchResult = await wpFetch(
      siteUrl,
      `/wp-json/wp/v2/tags?search=${encodeURIComponent(trimmed)}&per_page=100`,
      { method: 'GET' },
      credentials
    );

    if (searchResult.status === 200 && Array.isArray(searchResult.data)) {
      const exact = searchResult.data.find(
        t => t.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (exact) {
        ids.push(exact.id);
        continue;
      }
    }

    // Create new tag
    const createResult = await wpFetch(
      siteUrl,
      '/wp-json/wp/v2/tags',
      { method: 'POST', body: { name: trimmed } },
      credentials
    );

    if (createResult.status === 201 && createResult.data && createResult.data.id) {
      ids.push(createResult.data.id);
    } else {
      logger.warn('wp_tag_create_failed', { name: trimmed, status: createResult.status });
    }
  }

  return ids;
}

// ── Media upload ─────────────────────────────────────────────────────────────

/**
 * Upload an image to WordPress media library from a URL.
 * @param {string} siteUrl
 * @param {string} imageUrl - Source image URL
 * @param {object} credentials
 * @param {object} [meta] - { alt, caption, title }
 * @returns {Promise<{id: number, source_url: string}|null>}
 */
async function uploadMediaFromUrl(siteUrl, imageUrl, credentials, meta = {}) {
  if (!imageUrl) return null;

  try {
    // Fetch the image
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

    const imgResponse = await fetch(imageUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'ChainIQ-Publisher/1.0' }
    });
    clearTimeout(timer);

    if (!imgResponse.ok) {
      logger.warn('wp_image_fetch_failed', { imageUrl, status: imgResponse.status });
      return null;
    }

    const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await imgResponse.arrayBuffer());

    if (buffer.length > MAX_BODY_SIZE) {
      logger.warn('wp_image_too_large', { imageUrl, size: buffer.length });
      return null;
    }

    // Determine filename
    const urlPath = new URL(imageUrl).pathname;
    const ext = path.extname(urlPath) || mimeToExt(contentType);
    const filename = (meta.title ? slugifyFilename(meta.title) : 'image-' + Date.now()) + ext;

    // Upload to WordPress
    const result = await wpFetch(
      siteUrl,
      '/wp-json/wp/v2/media',
      {
        method: 'POST',
        binaryBody: buffer,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      },
      credentials,
      UPLOAD_TIMEOUT_MS
    );

    if (result.status === 201 && result.data && result.data.id) {
      // Set alt text and caption if provided
      if (meta.alt || meta.caption) {
        await wpFetch(
          siteUrl,
          `/wp-json/wp/v2/media/${result.data.id}`,
          {
            method: 'POST',
            body: {
              alt_text: meta.alt || '',
              caption: meta.caption ? { raw: meta.caption } : undefined,
              description: meta.alt || ''
            }
          },
          credentials
        );
      }

      return {
        id: result.data.id,
        source_url: result.data.source_url || result.data.guid?.rendered
      };
    }

    logger.warn('wp_media_upload_failed', { status: result.status, data: result.data });
    return null;
  } catch (e) {
    logger.error('wp_media_upload_error', { imageUrl, error: e.message });
    return null;
  }
}

function mimeToExt(mime) {
  const map = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg'
  };
  return map[mime] || '.jpg';
}

function slugifyFilename(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'image';
}

// ── SEO meta helpers ─────────────────────────────────────────────────────────

/**
 * Build Yoast SEO meta fields from the universal payload.
 * @param {object} payload - Universal article payload
 * @returns {object}
 */
function buildYoastMeta(payload) {
  const seo = payload.seo || {};
  const wpMeta = payload.platformMeta?.wordpress?.yoastMeta || {};

  return {
    yoast_wpseo_title: wpMeta.title || seo.title || payload.title || '',
    yoast_wpseo_metadesc: wpMeta.metadesc || seo.description || '',
    yoast_wpseo_focuskw: wpMeta.focuskw || payload.keyword || '',
    yoast_wpseo_canonical: wpMeta.canonical || seo.canonical || '',
    yoast_wpseo_opengraph_title: seo.og?.title || '',
    yoast_wpseo_opengraph_description: seo.og?.description || '',
    yoast_wpseo_twitter_title: seo.twitter?.title || '',
    yoast_wpseo_twitter_description: seo.twitter?.description || ''
  };
}

/**
 * Build RankMath SEO meta fields from the universal payload.
 * @param {object} payload - Universal article payload
 * @returns {object}
 */
function buildRankMathMeta(payload) {
  const seo = payload.seo || {};

  return {
    rank_math_title: seo.title || payload.title || '',
    rank_math_description: seo.description || '',
    rank_math_focus_keyword: payload.keyword || '',
    rank_math_canonical_url: seo.canonical || '',
    rank_math_og_title: seo.og?.title || '',
    rank_math_og_description: seo.og?.description || '',
    rank_math_twitter_title: seo.twitter?.title || '',
    rank_math_twitter_description: seo.twitter?.description || ''
  };
}

// ── Main publish function ────────────────────────────────────────────────────

/**
 * Publish an article to WordPress using the universal payload.
 *
 * @param {object} params
 * @param {object} params.payload - Universal article payload (from assemblePayload)
 * @param {string} params.siteUrl - WordPress site URL
 * @param {object} params.credentials - { username, applicationPassword }
 * @param {object} [params.options] - Publishing options
 * @param {string} [params.options.status='draft'] - WordPress post status: draft, publish, pending, private
 * @param {string} [params.options.seoPlugin='yoast'] - SEO plugin: yoast, rankmath, none
 * @param {boolean} [params.options.uploadFeaturedImage=true] - Whether to upload featured image
 * @param {object} [params.options.customFields] - Additional custom fields to set
 * @param {number} [params.options.existingPostId] - If set, update instead of create
 * @returns {Promise<object>} - { success, postId, postUrl, status, errors, warnings }
 */
async function publishToWordPress(params) {
  const { payload, siteUrl, credentials, options = {} } = params;
  const {
    status = 'draft',
    seoPlugin = 'yoast',
    uploadFeaturedImage = true,
    customFields = {},
    existingPostId = null
  } = options;

  const startTime = Date.now();
  const warnings = [];
  const errors = [];

  logger.info('wp_publish_start', {
    siteUrl,
    existingPostId,
    status,
    seoPlugin,
    title: payload.title?.slice(0, 80)
  });

  try {
    // 1. Resolve categories
    let categoryIds = [];
    if (payload.categories && payload.categories.length > 0) {
      try {
        categoryIds = await resolveCategories(siteUrl, payload.categories, credentials);
      } catch (e) {
        warnings.push(`Category resolution failed: ${e.message}`);
        logger.warn('wp_categories_failed', { error: e.message });
      }
    }

    // 2. Resolve tags
    let tagIds = [];
    if (payload.tags && payload.tags.length > 0) {
      try {
        tagIds = await resolveTags(siteUrl, payload.tags, credentials);
      } catch (e) {
        warnings.push(`Tag resolution failed: ${e.message}`);
        logger.warn('wp_tags_failed', { error: e.message });
      }
    }

    // 3. Upload featured image
    let featuredMediaId = null;
    if (uploadFeaturedImage) {
      const featuredImage = payload.images?.find(i => i.isFeatured);
      if (featuredImage) {
        const imageUrl = featuredImage.cdnSrc || featuredImage.src;
        if (imageUrl) {
          try {
            const media = await uploadMediaFromUrl(siteUrl, imageUrl, credentials, {
              alt: featuredImage.alt || payload.title,
              caption: featuredImage.caption,
              title: payload.title
            });
            if (media) {
              featuredMediaId = media.id;
            } else {
              warnings.push('Featured image upload returned null');
            }
          } catch (e) {
            warnings.push(`Featured image upload failed: ${e.message}`);
            logger.warn('wp_featured_image_failed', { error: e.message });
          }
        }
      }
    }

    // 4. Build SEO meta
    let seoMeta = {};
    if (seoPlugin === 'yoast') {
      seoMeta = buildYoastMeta(payload);
    } else if (seoPlugin === 'rankmath') {
      seoMeta = buildRankMathMeta(payload);
    }

    // 5. Build post body
    const postBody = {
      title: payload.title || '',
      content: payload.html || '',
      excerpt: payload.excerpt || '',
      slug: payload.slug || '',
      status: status,
      categories: categoryIds.length > 0 ? categoryIds : undefined,
      tags: tagIds.length > 0 ? tagIds : undefined,
      featured_media: featuredMediaId || undefined,
      meta: {
        ...seoMeta,
        ...customFields
      }
    };

    // Add structured data as a custom field
    if (payload.structuredData) {
      const jsonLdParts = [];
      if (payload.structuredData.article) jsonLdParts.push(payload.structuredData.article);
      if (payload.structuredData.faq) jsonLdParts.push(payload.structuredData.faq);
      if (jsonLdParts.length > 0) {
        postBody.meta._chainiq_structured_data = JSON.stringify(jsonLdParts);
      }
    }

    // Remove undefined values
    Object.keys(postBody).forEach(k => {
      if (postBody[k] === undefined) delete postBody[k];
    });

    // 6. Create or update post
    let result;
    if (existingPostId) {
      result = await wpFetch(
        siteUrl,
        `/wp-json/wp/v2/posts/${existingPostId}`,
        { method: 'POST', body: postBody },
        credentials
      );
    } else {
      result = await wpFetch(
        siteUrl,
        '/wp-json/wp/v2/posts',
        { method: 'POST', body: postBody },
        credentials
      );
    }

    // Handle auth errors
    if (result.status === 401 || result.status === 403) {
      return {
        success: false,
        postId: null,
        postUrl: null,
        status: 'auth_error',
        errors: [result.error],
        warnings,
        durationMs: Date.now() - startTime
      };
    }

    // Handle other errors
    if (result.status >= 400) {
      const errMsg = result.data?.message || result.data?.code || `HTTP ${result.status}`;
      return {
        success: false,
        postId: existingPostId || null,
        postUrl: null,
        status: 'error',
        errors: [`WordPress API error: ${errMsg}`],
        warnings,
        durationMs: Date.now() - startTime
      };
    }

    const postId = result.data?.id;
    const postUrl = result.data?.link || result.data?.guid?.rendered;

    logger.info('wp_publish_complete', {
      postId,
      postUrl,
      status: result.data?.status,
      categoryCount: categoryIds.length,
      tagCount: tagIds.length,
      hasFeaturedImage: !!featuredMediaId,
      durationMs: Date.now() - startTime
    });

    return {
      success: true,
      postId,
      postUrl,
      wpStatus: result.data?.status,
      status: 'published',
      featuredMediaId,
      categoryIds,
      tagIds,
      errors,
      warnings,
      durationMs: Date.now() - startTime
    };
  } catch (e) {
    logger.error('wp_publish_error', { error: e.message, stack: e.stack });
    return {
      success: false,
      postId: existingPostId || null,
      postUrl: null,
      status: 'error',
      errors: [e.message],
      warnings,
      durationMs: Date.now() - startTime
    };
  }
}

// ── Get publish status ───────────────────────────────────────────────────────

/**
 * Check the status of a published post on WordPress.
 * @param {string} siteUrl
 * @param {number} postId - WordPress post ID
 * @param {object} credentials
 * @returns {Promise<object>}
 */
async function getPostStatus(siteUrl, postId, credentials) {
  if (!postId) throw new Error('postId is required');

  const result = await wpFetch(
    siteUrl,
    `/wp-json/wp/v2/posts/${postId}?context=edit`,
    { method: 'GET' },
    credentials
  );

  if (result.status === 404) {
    return { found: false, postId, status: 'not_found' };
  }

  if (result.status === 401 || result.status === 403) {
    return { found: false, postId, status: 'auth_error', error: result.error };
  }

  if (result.status !== 200 || !result.data) {
    return { found: false, postId, status: 'error', error: `HTTP ${result.status}` };
  }

  return {
    found: true,
    postId: result.data.id,
    status: result.data.status,
    title: result.data.title?.rendered || result.data.title?.raw,
    link: result.data.link,
    modified: result.data.modified,
    featuredMedia: result.data.featured_media,
    categories: result.data.categories,
    tags: result.data.tags
  };
}

// ── Module exports ───────────────────────────────────────────────────────────

module.exports = {
  // Publishing
  publishToWordPress,
  getPostStatus,

  // Media
  uploadMediaFromUrl,

  // Taxonomy
  resolveCategories,
  resolveTags,

  // SEO meta
  buildYoastMeta,
  buildRankMathMeta,

  // Connection management
  saveConnection,
  getConnection,
  listConnections,
  deleteConnection,
  validateConnection,

  // Encryption (exposed for testing)
  encryptCredentials,
  decryptCredentials,

  // HTTP helper (exposed for testing)
  wpFetch,
  buildAuthHeader
};
