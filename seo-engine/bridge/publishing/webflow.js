/**
 * Webflow CMS API Publishing Adapter
 *
 * Creates/updates Webflow CMS collection items via the Webflow Data API v2.
 * Handles field mapping, SEO metadata, and publishing control.
 * Consumes the Universal Payload from payload.js.
 *
 * Zero npm dependencies — uses native fetch + Node.js built-in crypto.
 */

'use strict';

const crypto = require('crypto');
const logger = require('../logger');

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = 1000;
const REQUEST_TIMEOUT_MS = 30000;
const WEBFLOW_API_BASE = 'https://api.webflow.com/v2';

// ── Encryption helpers ───────────────────────────────────────────────────────

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

// ── HTTP helper ──────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make an authenticated request to Webflow API with retry logic.
 *
 * @param {string} endpoint - API endpoint path (e.g., /collections/{id}/items)
 * @param {object} options - { method, body, headers }
 * @param {string} apiToken - Webflow API token
 * @param {number} [timeoutMs]
 * @returns {Promise<{status: number, data: any, headers: object}>}
 */
async function webflowFetch(endpoint, options, apiToken, timeoutMs = REQUEST_TIMEOUT_MS) {
  const url = endpoint.startsWith('http') ? endpoint : `${WEBFLOW_API_BASE}${endpoint}`;
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_BACKOFF_MS * Math.pow(2, attempt - 1);
      logger.info('webflow_retry', { attempt, delay, endpoint });
      await sleep(delay);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers = {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'ChainIQ-Publisher/1.0',
        ...(options.headers || {})
      };

      const fetchOpts = {
        method: options.method || 'GET',
        headers,
        signal: controller.signal
      };

      if (options.body) {
        fetchOpts.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, fetchOpts);
      clearTimeout(timer);

      const responseData = await response.json().catch(() => null);

      if (response.status === 401) {
        return {
          status: 401,
          data: responseData,
          headers: Object.fromEntries(response.headers.entries()),
          error: 'Authentication failed. Check your Webflow API token.'
        };
      }
      if (response.status === 403) {
        return {
          status: 403,
          data: responseData,
          headers: Object.fromEntries(response.headers.entries()),
          error: 'Forbidden. The API token does not have permission for this action.'
        };
      }

      // Rate limiting (429)
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10);
        if (attempt < MAX_RETRIES) {
          logger.warn('webflow_rate_limited', { endpoint, attempt, retryAfterSec: retryAfter });
          await sleep(retryAfter * 1000);
          continue;
        }
      }

      if (response.status >= 500 && attempt < MAX_RETRIES) {
        lastError = new Error(`Webflow returned ${response.status}: ${JSON.stringify(responseData)}`);
        logger.warn('webflow_server_error', { status: response.status, attempt, endpoint });
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
      if (attempt < MAX_RETRIES) {
        logger.warn('webflow_network_error', { error: lastError.message, attempt, endpoint });
        continue;
      }
    }
  }

  throw lastError || new Error(`Webflow API request failed after ${MAX_RETRIES + 1} attempts`);
}

// ── Credential resolver ──────────────────────────────────────────────────────

/**
 * Resolve Webflow credentials from key-manager.
 *
 * @param {object} keyManager - KeyManager instance
 * @param {string} userId - User ID
 * @returns {Promise<{siteId: string, collectionId: string, apiToken: string}>}
 */
async function resolveCredentials(keyManager, userId) {
  let siteId = null;
  let collectionId = null;
  let apiToken = null;

  try { siteId = await keyManager.getKey('webflow_site_id', userId); } catch { /* ignore */ }
  if (!siteId) {
    try { siteId = await keyManager.getKey('webflow_site_id', 'global'); } catch { /* ignore */ }
  }

  try { collectionId = await keyManager.getKey('webflow_collection_id', userId); } catch { /* ignore */ }
  if (!collectionId) {
    try { collectionId = await keyManager.getKey('webflow_collection_id', 'global'); } catch { /* ignore */ }
  }

  try { apiToken = await keyManager.getKey('webflow_api_token', userId); } catch { /* ignore */ }
  if (!apiToken) {
    try { apiToken = await keyManager.getKey('webflow_api_token', 'global'); } catch { /* ignore */ }
  }

  if (!apiToken) {
    throw new Error(
      'Webflow credentials not configured. Store webflow_api_token via the API Keys endpoint.'
    );
  }

  return { siteId, collectionId, apiToken };
}

// ── Main publish function ────────────────────────────────────────────────────

/**
 * Publish an article to Webflow CMS using the Universal Payload.
 *
 * @param {object} params
 * @param {object} params.payload - Universal article payload
 * @param {string} params.collectionId - Webflow CMS collection ID
 * @param {string} params.apiToken - Webflow API token
 * @param {object} [params.options]
 * @param {boolean} [params.options.publish=false] - Whether to publish (stage) live
 * @param {string} [params.options.existingItemId] - If set, update instead of create
 * @param {object} [params.options.fieldMapping] - Custom field slug mapping
 * @returns {Promise<object>}
 */
async function publishToWebflow(params) {
  const { payload, collectionId, apiToken, options = {} } = params;
  const {
    publish = false,
    existingItemId = null,
    fieldMapping = {}
  } = options;

  if (!collectionId) {
    throw new Error('collectionId is required for Webflow publishing');
  }

  const startTime = Date.now();
  const warnings = [];
  const errors = [];

  logger.info('webflow_publish_start', {
    collectionId,
    existingItemId,
    title: payload.title?.slice(0, 80)
  });

  try {
    // Build field mapping (Webflow uses slug-based field names)
    const fm = {
      name: fieldMapping.name || 'name',
      slug: fieldMapping.slug || 'slug',
      content: fieldMapping.content || 'post-body',
      excerpt: fieldMapping.excerpt || 'post-summary',
      metaTitle: fieldMapping.metaTitle || 'meta-title',
      metaDescription: fieldMapping.metaDescription || 'meta-description',
      featuredImage: fieldMapping.featuredImage || 'main-image',
      tags: fieldMapping.tags || 'tags',
      categories: fieldMapping.categories || 'category',
      author: fieldMapping.author || 'author',
    };

    // Build Webflow item field data
    const fieldData = {};

    if (payload.title) fieldData[fm.name] = payload.title;
    if (payload.slug) fieldData[fm.slug] = payload.slug;
    if (payload.html) fieldData[fm.content] = payload.html;
    if (payload.excerpt) fieldData[fm.excerpt] = payload.excerpt;
    if (payload.seo?.title) fieldData[fm.metaTitle] = payload.seo.title;
    if (payload.seo?.description) fieldData[fm.metaDescription] = payload.seo.description;
    if (payload.author?.name) fieldData[fm.author] = payload.author.name;

    // Featured image URL (Webflow accepts URL for image fields)
    const featuredImage = payload.images?.find(i => i.isFeatured);
    const imageUrl = featuredImage?.cdnSrc || featuredImage?.src;
    if (imageUrl) {
      fieldData[fm.featuredImage] = { url: imageUrl, alt: featuredImage?.alt || payload.title || '' };
    }

    // Tags as comma-separated string if Webflow uses a plain text field
    if (payload.tags && payload.tags.length > 0) {
      fieldData[fm.tags] = payload.tags;
    }

    // Categories
    if (payload.categories && payload.categories.length > 0) {
      fieldData[fm.categories] = payload.categories;
    }

    // Webflow v2 API item body
    const itemBody = {
      isArchived: false,
      isDraft: !publish,
      fieldData
    };

    // Create or update
    let result;
    if (existingItemId) {
      result = await webflowFetch(
        `/collections/${collectionId}/items/${existingItemId}`,
        { method: 'PATCH', body: itemBody },
        apiToken
      );
    } else {
      result = await webflowFetch(
        `/collections/${collectionId}/items`,
        { method: 'POST', body: itemBody },
        apiToken
      );
    }

    // Handle auth errors
    if (result.status === 401 || result.status === 403) {
      return {
        success: false,
        itemId: null,
        status: 'auth_error',
        errors: [result.error],
        warnings,
        durationMs: Date.now() - startTime
      };
    }

    // Handle other errors
    if (result.status >= 400) {
      const errMsg = result.data?.message || result.data?.err || `HTTP ${result.status}`;
      return {
        success: false,
        itemId: existingItemId || null,
        status: 'error',
        errors: [`Webflow API error: ${errMsg}`],
        warnings,
        durationMs: Date.now() - startTime
      };
    }

    const itemId = result.data?.id || result.data?._id;

    // If publishing, publish the item live
    if (publish && itemId) {
      const pubResult = await webflowFetch(
        `/collections/${collectionId}/items/publish`,
        {
          method: 'POST',
          body: { itemIds: [itemId] }
        },
        apiToken
      );

      if (pubResult.status >= 400) {
        warnings.push(`Item created but publish failed: HTTP ${pubResult.status}`);
      }
    }

    logger.info('webflow_publish_complete', {
      itemId,
      collectionId,
      published: publish,
      durationMs: Date.now() - startTime
    });

    return {
      success: true,
      itemId,
      collectionId,
      status: publish ? 'published' : 'draft',
      errors,
      warnings,
      durationMs: Date.now() - startTime
    };
  } catch (e) {
    logger.error('webflow_publish_error', { error: e.message, stack: e.stack });
    return {
      success: false,
      itemId: existingItemId || null,
      status: 'error',
      errors: [e.message],
      warnings,
      durationMs: Date.now() - startTime
    };
  }
}

// ── Status check ─────────────────────────────────────────────────────────────

/**
 * Check Webflow connection by fetching site info.
 *
 * @param {string} siteId
 * @param {string} apiToken
 * @returns {Promise<object>}
 */
async function checkStatus(siteId, apiToken) {
  try {
    if (!siteId) {
      // If no siteId, check auth by listing sites
      const result = await webflowFetch(
        '/sites',
        { method: 'GET' },
        apiToken
      );

      if (result.status !== 200) {
        return {
          connected: false,
          siteName: null,
          error: `API returned ${result.status}`
        };
      }

      const sites = result.data?.sites || [];
      return {
        connected: true,
        siteName: sites[0]?.displayName || null,
        siteCount: sites.length,
        error: null
      };
    }

    const result = await webflowFetch(
      `/sites/${siteId}`,
      { method: 'GET' },
      apiToken
    );

    if (result.status !== 200) {
      return {
        connected: false,
        siteName: null,
        error: `API returned ${result.status}: ${JSON.stringify(result.data?.message || result.data)}`
      };
    }

    return {
      connected: true,
      siteName: result.data?.displayName || result.data?.name || null,
      siteId,
      error: null
    };
  } catch (err) {
    return {
      connected: false,
      siteName: null,
      error: err.message
    };
  }
}

/**
 * List collections for a Webflow site.
 *
 * @param {string} siteId
 * @param {string} apiToken
 * @returns {Promise<Array<{id: string, displayName: string, slug: string}>>}
 */
async function listCollections(siteId, apiToken) {
  if (!siteId) throw new Error('siteId is required to list collections');

  const { status, data } = await webflowFetch(
    `/sites/${siteId}/collections`,
    { method: 'GET' },
    apiToken
  );

  if (status !== 200) {
    throw new Error(`Failed to list collections: ${status} - ${JSON.stringify(data?.message || data)}`);
  }

  return (data?.collections || []).map(c => ({
    id: c.id || c._id,
    displayName: c.displayName || c.name,
    slug: c.slug,
    singularName: c.singularName
  }));
}

// ── Module exports ───────────────────────────────────────────────────────────

module.exports = {
  publishToWebflow,
  checkStatus,
  listCollections,
  resolveCredentials,
  webflowFetch,
  encryptCredentials,
  decryptCredentials
};
