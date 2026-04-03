/**
 * Contentful Management API Publishing Adapter
 *
 * Creates/updates Contentful entries via the Content Management API.
 * Handles asset uploading, entry publishing, and locale support.
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
const CMA_BASE_URL = 'https://api.contentful.com';

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
 * Make an authenticated request to Contentful Management API with retry logic.
 *
 * @param {string} endpoint - Full API URL or path
 * @param {object} options - { method, body, headers }
 * @param {string} accessToken - Contentful Management API access token
 * @param {number} [timeoutMs]
 * @returns {Promise<{status: number, data: any, headers: object}>}
 */
async function contentfulFetch(endpoint, options, accessToken, timeoutMs = REQUEST_TIMEOUT_MS) {
  const url = endpoint.startsWith('http') ? endpoint : `${CMA_BASE_URL}${endpoint}`;
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_BACKOFF_MS * Math.pow(2, attempt - 1);
      logger.info('contentful_retry', { attempt, delay, endpoint });
      await sleep(delay);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.contentful.management.v1+json',
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
          error: 'Authentication failed. Check your Contentful Management API token.'
        };
      }
      if (response.status === 403) {
        return {
          status: 403,
          data: responseData,
          headers: Object.fromEntries(response.headers.entries()),
          error: 'Forbidden. The token does not have permission for this action.'
        };
      }

      // Rate limiting (429)
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('x-contentful-ratelimit-reset') || '2', 10);
        if (attempt < MAX_RETRIES) {
          logger.warn('contentful_rate_limited', { endpoint, attempt, retryAfterSec: retryAfter });
          await sleep(retryAfter * 1000);
          continue;
        }
      }

      if (response.status >= 500 && attempt < MAX_RETRIES) {
        lastError = new Error(`Contentful returned ${response.status}: ${JSON.stringify(responseData)}`);
        logger.warn('contentful_server_error', { status: response.status, attempt, endpoint });
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
        logger.warn('contentful_network_error', { error: lastError.message, attempt, endpoint });
        continue;
      }
    }
  }

  throw lastError || new Error(`Contentful API request failed after ${MAX_RETRIES + 1} attempts`);
}

// ── Credential resolver ──────────────────────────────────────────────────────

/**
 * Resolve Contentful credentials from key-manager.
 *
 * @param {object} keyManager - KeyManager instance
 * @param {string} userId - User ID
 * @returns {Promise<{spaceId: string, environmentId: string, accessToken: string}>}
 */
async function resolveCredentials(keyManager, userId) {
  let spaceId = null;
  let environmentId = null;
  let accessToken = null;

  try { spaceId = await keyManager.getKey('contentful_space_id', userId); } catch { /* ignore */ }
  if (!spaceId) {
    try { spaceId = await keyManager.getKey('contentful_space_id', 'global'); } catch { /* ignore */ }
  }

  try { environmentId = await keyManager.getKey('contentful_environment_id', userId); } catch { /* ignore */ }
  if (!environmentId) {
    try { environmentId = await keyManager.getKey('contentful_environment_id', 'global'); } catch { /* ignore */ }
  }
  if (!environmentId) environmentId = 'master';

  try { accessToken = await keyManager.getKey('contentful_management_token', userId); } catch { /* ignore */ }
  if (!accessToken) {
    try { accessToken = await keyManager.getKey('contentful_management_token', 'global'); } catch { /* ignore */ }
  }

  if (!spaceId || !accessToken) {
    throw new Error(
      'Contentful credentials not configured. Store contentful_space_id and contentful_management_token via the API Keys endpoint.'
    );
  }

  return { spaceId, environmentId, accessToken };
}

// ── Main publish function ────────────────────────────────────────────────────

/**
 * Publish an article to Contentful using the Universal Payload.
 *
 * @param {object} params
 * @param {object} params.payload - Universal article payload
 * @param {string} params.spaceId - Contentful space ID
 * @param {string} params.environmentId - Contentful environment ID
 * @param {string} params.accessToken - Contentful Management API token
 * @param {object} [params.options]
 * @param {string} [params.options.contentTypeId='blogPost'] - Content type ID
 * @param {string} [params.options.locale='en-US'] - Content locale
 * @param {boolean} [params.options.publish=false] - Whether to publish immediately
 * @param {string} [params.options.existingEntryId] - If set, update instead of create
 * @param {object} [params.options.fieldMapping] - Custom field name mapping
 * @returns {Promise<object>}
 */
async function publishToContentful(params) {
  const { payload, spaceId, environmentId, accessToken, options = {} } = params;
  const {
    contentTypeId = 'blogPost',
    locale = 'en-US',
    publish = false,
    existingEntryId = null,
    fieldMapping = {}
  } = options;

  const startTime = Date.now();
  const warnings = [];
  const errors = [];

  const basePath = `/spaces/${spaceId}/environments/${environmentId}`;

  logger.info('contentful_publish_start', {
    spaceId,
    environmentId,
    contentTypeId,
    existingEntryId,
    title: payload.title?.slice(0, 80)
  });

  try {
    // Build entry fields with locale wrapper
    const fm = {
      title: fieldMapping.title || 'title',
      slug: fieldMapping.slug || 'slug',
      body: fieldMapping.body || 'body',
      excerpt: fieldMapping.excerpt || 'excerpt',
      metaTitle: fieldMapping.metaTitle || 'metaTitle',
      metaDescription: fieldMapping.metaDescription || 'metaDescription',
      featuredImage: fieldMapping.featuredImage || 'featuredImage',
      tags: fieldMapping.tags || 'tags',
      categories: fieldMapping.categories || 'categories',
      author: fieldMapping.author || 'author',
      keyword: fieldMapping.keyword || 'keyword'
    };

    const fields = {};

    // Title
    if (payload.title) {
      fields[fm.title] = { [locale]: payload.title };
    }

    // Slug
    if (payload.slug) {
      fields[fm.slug] = { [locale]: payload.slug };
    }

    // Body (HTML)
    if (payload.html) {
      fields[fm.body] = { [locale]: payload.html };
    }

    // Excerpt
    if (payload.excerpt) {
      fields[fm.excerpt] = { [locale]: payload.excerpt };
    }

    // SEO meta
    if (payload.seo?.title) {
      fields[fm.metaTitle] = { [locale]: payload.seo.title };
    }
    if (payload.seo?.description) {
      fields[fm.metaDescription] = { [locale]: payload.seo.description };
    }

    // Tags
    if (payload.tags && payload.tags.length > 0) {
      fields[fm.tags] = { [locale]: payload.tags };
    }

    // Categories
    if (payload.categories && payload.categories.length > 0) {
      fields[fm.categories] = { [locale]: payload.categories };
    }

    // Author
    if (payload.author?.name) {
      fields[fm.author] = { [locale]: payload.author.name };
    }

    // Keyword
    if (payload.keyword) {
      fields[fm.keyword] = { [locale]: payload.keyword };
    }

    // Create or update entry
    let result;
    if (existingEntryId) {
      // Fetch current version for optimistic locking
      const currentResult = await contentfulFetch(
        `${basePath}/entries/${existingEntryId}`,
        { method: 'GET' },
        accessToken
      );

      if (currentResult.status !== 200) {
        return {
          success: false,
          entryId: existingEntryId,
          status: 'error',
          errors: [`Entry ${existingEntryId} not found: HTTP ${currentResult.status}`],
          warnings,
          durationMs: Date.now() - startTime
        };
      }

      const version = currentResult.data?.sys?.version;
      result = await contentfulFetch(
        `${basePath}/entries/${existingEntryId}`,
        {
          method: 'PUT',
          body: { fields },
          headers: {
            'X-Contentful-Content-Type': contentTypeId,
            'X-Contentful-Version': String(version)
          }
        },
        accessToken
      );
    } else {
      result = await contentfulFetch(
        `${basePath}/entries`,
        {
          method: 'POST',
          body: { fields },
          headers: {
            'X-Contentful-Content-Type': contentTypeId
          }
        },
        accessToken
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
      const errMsg = result.data?.message || result.data?.sys?.id || `HTTP ${result.status}`;
      return {
        success: false,
        entryId: existingEntryId || null,
        status: 'error',
        errors: [`Contentful API error: ${errMsg}`],
        warnings,
        durationMs: Date.now() - startTime
      };
    }

    const entryId = result.data?.sys?.id;
    const entryVersion = result.data?.sys?.version;

    // Optionally publish the entry
    if (publish && entryId && entryVersion) {
      const pubResult = await contentfulFetch(
        `${basePath}/entries/${entryId}/published`,
        {
          method: 'PUT',
          headers: {
            'X-Contentful-Version': String(entryVersion)
          }
        },
        accessToken
      );

      if (pubResult.status >= 400) {
        warnings.push(`Entry created but publishing failed: HTTP ${pubResult.status}`);
      }
    }

    logger.info('contentful_publish_complete', {
      entryId,
      published: publish,
      durationMs: Date.now() - startTime
    });

    return {
      success: true,
      entryId,
      spaceId,
      environmentId,
      contentTypeId,
      status: publish ? 'published' : 'draft',
      version: entryVersion,
      errors,
      warnings,
      durationMs: Date.now() - startTime
    };
  } catch (e) {
    logger.error('contentful_publish_error', { error: e.message, stack: e.stack });
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
 * Check Contentful connection by fetching space info.
 *
 * @param {string} spaceId
 * @param {string} accessToken
 * @returns {Promise<object>}
 */
async function checkStatus(spaceId, accessToken) {
  try {
    const result = await contentfulFetch(
      `/spaces/${spaceId}`,
      { method: 'GET' },
      accessToken
    );

    if (result.status !== 200) {
      return {
        connected: false,
        spaceName: null,
        error: `API returned ${result.status}: ${JSON.stringify(result.data?.message || result.data)}`
      };
    }

    return {
      connected: true,
      spaceName: result.data?.name || null,
      spaceId,
      error: null
    };
  } catch (err) {
    return {
      connected: false,
      spaceName: null,
      error: err.message
    };
  }
}

// ── Module exports ───────────────────────────────────────────────────────────

module.exports = {
  publishToContentful,
  checkStatus,
  resolveCredentials,
  contentfulFetch,
  encryptCredentials,
  decryptCredentials
};
