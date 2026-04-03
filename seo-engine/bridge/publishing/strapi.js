/**
 * Strapi REST API Publishing Adapter
 *
 * Creates/updates Strapi content entries via the REST API.
 * Supports Strapi v4 REST API with JWT or API token authentication.
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
 * Make an authenticated request to Strapi REST API with retry logic.
 *
 * @param {string} baseUrl - Strapi base URL (e.g., https://cms.example.com)
 * @param {string} endpoint - API endpoint path (e.g., /api/articles)
 * @param {object} options - { method, body, headers }
 * @param {string} apiToken - Strapi API token (Bearer token)
 * @param {number} [timeoutMs]
 * @returns {Promise<{status: number, data: any, headers: object}>}
 */
async function strapiFetch(baseUrl, endpoint, options, apiToken, timeoutMs = REQUEST_TIMEOUT_MS) {
  const url = baseUrl.replace(/\/+$/, '') + endpoint;
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_BACKOFF_MS * Math.pow(2, attempt - 1);
      logger.info('strapi_retry', { attempt, delay, endpoint });
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
          error: 'Authentication failed. Check your Strapi API token.'
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

      if (response.status >= 500 && attempt < MAX_RETRIES) {
        lastError = new Error(`Strapi returned ${response.status}: ${JSON.stringify(responseData)}`);
        logger.warn('strapi_server_error', { status: response.status, attempt, endpoint });
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
        logger.warn('strapi_network_error', { error: lastError.message, attempt, endpoint });
        continue;
      }
    }
  }

  throw lastError || new Error(`Strapi API request failed after ${MAX_RETRIES + 1} attempts`);
}

// ── Credential resolver ──────────────────────────────────────────────────────

/**
 * Resolve Strapi credentials from key-manager.
 *
 * @param {object} keyManager - KeyManager instance
 * @param {string} userId - User ID
 * @returns {Promise<{baseUrl: string, apiToken: string}>}
 */
async function resolveCredentials(keyManager, userId) {
  let baseUrl = null;
  let apiToken = null;

  try { baseUrl = await keyManager.getKey('strapi_url', userId); } catch { /* ignore */ }
  if (!baseUrl) {
    try { baseUrl = await keyManager.getKey('strapi_url', 'global'); } catch { /* ignore */ }
  }

  try { apiToken = await keyManager.getKey('strapi_api_token', userId); } catch { /* ignore */ }
  if (!apiToken) {
    try { apiToken = await keyManager.getKey('strapi_api_token', 'global'); } catch { /* ignore */ }
  }

  if (!baseUrl || !apiToken) {
    throw new Error(
      'Strapi credentials not configured. Store strapi_url and strapi_api_token via the API Keys endpoint.'
    );
  }

  baseUrl = baseUrl.replace(/\/+$/, '');
  return { baseUrl, apiToken };
}

// ── Main publish function ────────────────────────────────────────────────────

/**
 * Publish an article to Strapi using the Universal Payload.
 *
 * Strapi v4 REST format: POST /api/{collection} with { data: { ... } }
 *
 * @param {object} params
 * @param {object} params.payload - Universal article payload
 * @param {string} params.baseUrl - Strapi base URL
 * @param {string} params.apiToken - Strapi API token
 * @param {object} [params.options]
 * @param {string} [params.options.collection='articles'] - Collection type (plural API name)
 * @param {boolean} [params.options.publish=false] - Whether to publish immediately
 * @param {string} [params.options.existingEntryId] - If set, update instead of create
 * @param {object} [params.options.fieldMapping] - Custom field name mapping
 * @returns {Promise<object>}
 */
async function publishToStrapi(params) {
  const { payload, baseUrl, apiToken, options = {} } = params;
  const {
    collection = 'articles',
    publish = false,
    existingEntryId = null,
    fieldMapping = {}
  } = options;

  const startTime = Date.now();
  const warnings = [];
  const errors = [];

  logger.info('strapi_publish_start', {
    baseUrl,
    collection,
    existingEntryId,
    title: payload.title?.slice(0, 80)
  });

  try {
    // Build field mapping
    const fm = {
      title: fieldMapping.title || 'title',
      slug: fieldMapping.slug || 'slug',
      content: fieldMapping.content || 'content',
      excerpt: fieldMapping.excerpt || 'excerpt',
      metaTitle: fieldMapping.metaTitle || 'metaTitle',
      metaDescription: fieldMapping.metaDescription || 'metaDescription',
      featuredImage: fieldMapping.featuredImage || 'featuredImage',
      tags: fieldMapping.tags || 'tags',
      categories: fieldMapping.categories || 'categories',
      author: fieldMapping.author || 'author',
      keyword: fieldMapping.keyword || 'keyword'
    };

    // Build Strapi data object
    const data = {};

    if (payload.title) data[fm.title] = payload.title;
    if (payload.slug) data[fm.slug] = payload.slug;
    if (payload.html) data[fm.content] = payload.html;
    if (payload.excerpt) data[fm.excerpt] = payload.excerpt;
    if (payload.seo?.title) data[fm.metaTitle] = payload.seo.title;
    if (payload.seo?.description) data[fm.metaDescription] = payload.seo.description;
    if (payload.tags && payload.tags.length > 0) data[fm.tags] = payload.tags;
    if (payload.categories && payload.categories.length > 0) data[fm.categories] = payload.categories;
    if (payload.author?.name) data[fm.author] = payload.author.name;
    if (payload.keyword) data[fm.keyword] = payload.keyword;

    // Strapi v4 uses publishedAt for publish control
    if (publish) {
      data.publishedAt = new Date().toISOString();
    } else {
      data.publishedAt = null;
    }

    // Create or update
    let result;
    if (existingEntryId) {
      result = await strapiFetch(
        baseUrl,
        `/api/${collection}/${existingEntryId}`,
        { method: 'PUT', body: { data } },
        apiToken
      );
    } else {
      result = await strapiFetch(
        baseUrl,
        `/api/${collection}`,
        { method: 'POST', body: { data } },
        apiToken
      );
    }

    // Handle auth errors
    if (result.status === 401 || result.status === 403) {
      return {
        success: false,
        entryId: null,
        status: 'auth_error',
        errors: [result.error],
        warnings,
        durationMs: Date.now() - startTime
      };
    }

    // Handle other errors
    if (result.status >= 400) {
      const errMsg = result.data?.error?.message
        || result.data?.message
        || `HTTP ${result.status}`;
      return {
        success: false,
        entryId: existingEntryId || null,
        status: 'error',
        errors: [`Strapi API error: ${errMsg}`],
        warnings,
        durationMs: Date.now() - startTime
      };
    }

    const entryId = result.data?.data?.id || result.data?.id;

    logger.info('strapi_publish_complete', {
      entryId,
      collection,
      published: publish,
      durationMs: Date.now() - startTime
    });

    return {
      success: true,
      entryId,
      collection,
      status: publish ? 'published' : 'draft',
      errors,
      warnings,
      durationMs: Date.now() - startTime
    };
  } catch (e) {
    logger.error('strapi_publish_error', { error: e.message, stack: e.stack });
    return {
      success: false,
      entryId: existingEntryId || null,
      status: 'error',
      errors: [e.message],
      warnings,
      durationMs: Date.now() - startTime
    };
  }
}

// ── Status check ─────────────────────────────────────────────────────────────

/**
 * Check Strapi connection by listing content types.
 *
 * @param {string} baseUrl
 * @param {string} apiToken
 * @returns {Promise<object>}
 */
async function checkStatus(baseUrl, apiToken) {
  try {
    // Strapi v4: /api/content-type-builder/content-types requires admin token
    // Simpler: just check if the API responds with a basic request
    const result = await strapiFetch(
      baseUrl,
      '/api',
      { method: 'GET' },
      apiToken
    );

    if (result.status === 401 || result.status === 403) {
      return {
        connected: false,
        error: result.error
      };
    }

    return {
      connected: true,
      baseUrl,
      error: null
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message
    };
  }
}

// ── Module exports ───────────────────────────────────────────────────────────

module.exports = {
  publishToStrapi,
  checkStatus,
  resolveCredentials,
  strapiFetch,
  encryptCredentials,
  decryptCredentials
};
