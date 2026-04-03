/**
 * Ghost Admin API Publishing Adapter
 *
 * Creates/updates Ghost posts via the Admin API using JWT authentication.
 * Handles feature images, tags, SEO metadata, and code injection.
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
const JWT_EXPIRY_SEC = 300; // 5 minutes

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

// ── JWT for Ghost Admin API ──────────────────────────────────────────────────

/**
 * Base64url encode a buffer or string.
 */
function base64url(input) {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generate a Ghost Admin API JWT from an API key.
 * Ghost Admin API keys have the format: {id}:{secret}
 * The JWT is signed with HMAC-SHA256 using the secret (hex-decoded).
 *
 * @param {string} adminApiKey - Ghost Admin API key (format: id:secret)
 * @returns {string} JWT token
 */
function generateGhostJwt(adminApiKey) {
  if (!adminApiKey || !adminApiKey.includes(':')) {
    throw new Error('Ghost Admin API key must be in format id:secret');
  }

  const [id, secret] = adminApiKey.split(':');
  if (!id || !secret) {
    throw new Error('Ghost Admin API key must be in format id:secret');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT', kid: id };
  const payload = {
    iat: now,
    exp: now + JWT_EXPIRY_SEC,
    aud: '/admin/'
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const secretBytes = Buffer.from(secret, 'hex');
  const signature = crypto.createHmac('sha256', secretBytes)
    .update(signingInput)
    .digest();

  return `${signingInput}.${base64url(signature)}`;
}

// ── HTTP helper ──────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make an authenticated request to Ghost Admin API with retry logic.
 *
 * @param {string} apiUrl - Ghost site API URL (e.g., https://myblog.ghost.io)
 * @param {string} endpoint - API endpoint path (e.g., /ghost/api/admin/posts/)
 * @param {object} options - { method, body, headers }
 * @param {string} adminApiKey - Ghost Admin API key (id:secret)
 * @param {number} [timeoutMs]
 * @returns {Promise<{status: number, data: any, headers: object}>}
 */
async function ghostFetch(apiUrl, endpoint, options, adminApiKey, timeoutMs = REQUEST_TIMEOUT_MS) {
  const url = apiUrl.replace(/\/+$/, '') + endpoint;
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_BACKOFF_MS * Math.pow(2, attempt - 1);
      logger.info('ghost_retry', { attempt, delay, endpoint });
      await sleep(delay);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Generate a fresh JWT for each attempt (short-lived)
      const token = generateGhostJwt(adminApiKey);

      const headers = {
        'Authorization': `Ghost ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Version': 'v5.0',
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
          error: 'Authentication failed. Check your Ghost Admin API key.'
        };
      }
      if (response.status === 403) {
        return {
          status: 403,
          data: responseData,
          headers: Object.fromEntries(response.headers.entries()),
          error: 'Forbidden. The API key does not have permission for this action.'
        };
      }

      if (response.status >= 500 && attempt < MAX_RETRIES) {
        lastError = new Error(`Ghost returned ${response.status}: ${JSON.stringify(responseData)}`);
        logger.warn('ghost_server_error', { status: response.status, attempt, endpoint });
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
        logger.warn('ghost_network_error', { error: lastError.message, attempt, endpoint });
        continue;
      }
    }
  }

  throw lastError || new Error(`Ghost API request failed after ${MAX_RETRIES + 1} attempts`);
}

// ── Credential resolver ──────────────────────────────────────────────────────

/**
 * Resolve Ghost credentials from key-manager.
 *
 * @param {object} keyManager - KeyManager instance
 * @param {string} userId - User ID
 * @returns {Promise<{apiUrl: string, adminApiKey: string}>}
 */
async function resolveCredentials(keyManager, userId) {
  let apiUrl = null;
  let adminApiKey = null;

  try { apiUrl = await keyManager.getKey('ghost_url', userId); } catch { /* ignore */ }
  if (!apiUrl) {
    try { apiUrl = await keyManager.getKey('ghost_url', 'global'); } catch { /* ignore */ }
  }

  try { adminApiKey = await keyManager.getKey('ghost_admin_key', userId); } catch { /* ignore */ }
  if (!adminApiKey) {
    try { adminApiKey = await keyManager.getKey('ghost_admin_key', 'global'); } catch { /* ignore */ }
  }

  if (!apiUrl || !adminApiKey) {
    throw new Error(
      'Ghost credentials not configured. Store ghost_url and ghost_admin_key via the API Keys endpoint.'
    );
  }

  apiUrl = apiUrl.replace(/\/+$/, '');
  return { apiUrl, adminApiKey };
}

// ── Tags management ──────────────────────────────────────────────────────────

/**
 * Resolve tag names to Ghost tag objects.
 * Ghost creates tags on-the-fly when included in a post, so we just format them.
 *
 * @param {string[]} tagNames
 * @returns {Array<{name: string}>}
 */
function buildTags(tagNames) {
  if (!tagNames || tagNames.length === 0) return [];
  return tagNames
    .filter(t => t && typeof t === 'string' && t.trim())
    .map(t => ({ name: t.trim() }));
}

// ── Main publish function ────────────────────────────────────────────────────

/**
 * Publish an article to Ghost using the Universal Payload.
 *
 * @param {object} params
 * @param {object} params.payload - Universal article payload
 * @param {string} params.apiUrl - Ghost site URL
 * @param {string} params.adminApiKey - Ghost Admin API key (id:secret)
 * @param {object} [params.options]
 * @param {string} [params.options.status='draft'] - Post status: draft, published, scheduled
 * @param {boolean} [params.options.featured=false] - Whether this is a featured post
 * @param {string} [params.options.existingPostId] - If set, update instead of create
 * @param {string} [params.options.visibility='public'] - Post visibility
 * @returns {Promise<object>}
 */
async function publishToGhost(params) {
  const { payload, apiUrl, adminApiKey, options = {} } = params;
  const {
    status = 'draft',
    featured = false,
    existingPostId = null,
    visibility = 'public'
  } = options;

  const startTime = Date.now();
  const warnings = [];
  const errors = [];

  logger.info('ghost_publish_start', {
    apiUrl,
    existingPostId,
    status,
    title: payload.title?.slice(0, 80)
  });

  try {
    // Build tags
    const tags = buildTags(payload.tags);

    // Feature image
    const featuredImage = payload.images?.find(i => i.isFeatured);
    const featureImageUrl = featuredImage?.cdnSrc || featuredImage?.src || null;

    // Ghost platform meta
    const ghostMeta = payload.platformMeta?.ghost || {};

    // Build code injection for structured data
    let codeinjectionHead = ghostMeta.codeinjectionHead || null;
    if (!codeinjectionHead && payload.structuredData) {
      const jsonLdParts = [];
      if (payload.structuredData.article) {
        jsonLdParts.push(JSON.stringify(payload.structuredData.article));
      }
      if (payload.structuredData.faq) {
        jsonLdParts.push(JSON.stringify(payload.structuredData.faq));
      }
      if (jsonLdParts.length > 0) {
        codeinjectionHead = jsonLdParts
          .map(j => `<script type="application/ld+json">${j}</script>`)
          .join('\n');
      }
    }

    // Build post body
    const postBody = {
      posts: [{
        title: payload.title || '',
        html: payload.html || '',
        slug: payload.slug || undefined,
        status: status === 'published' ? 'published' : 'draft',
        excerpt: payload.excerpt || undefined,
        feature_image: featureImageUrl || undefined,
        feature_image_alt: featuredImage?.alt || undefined,
        featured: featured,
        visibility: visibility,
        tags: tags.length > 0 ? tags : undefined,
        meta_title: payload.seo?.title || payload.title || undefined,
        meta_description: payload.seo?.description || undefined,
        og_title: payload.seo?.og?.title || undefined,
        og_description: payload.seo?.og?.description || undefined,
        twitter_title: payload.seo?.twitter?.title || undefined,
        twitter_description: payload.seo?.twitter?.description || undefined,
        canonical_url: payload.seo?.canonical || undefined,
        codeinjection_head: codeinjectionHead || undefined,
        authors: payload.author?.name ? [{ name: payload.author.name }] : undefined
      }]
    };

    // Remove undefined values from post object
    const post = postBody.posts[0];
    Object.keys(post).forEach(k => {
      if (post[k] === undefined) delete post[k];
    });

    // Create or update
    let result;
    if (existingPostId) {
      // Ghost requires updated_at for PUT requests, fetch current post first
      const currentResult = await ghostFetch(
        apiUrl,
        `/ghost/api/admin/posts/${existingPostId}/`,
        { method: 'GET' },
        adminApiKey
      );

      if (currentResult.status !== 200 || !currentResult.data?.posts?.[0]) {
        return {
          success: false,
          postId: existingPostId,
          postUrl: null,
          status: 'error',
          errors: [`Post ${existingPostId} not found: HTTP ${currentResult.status}`],
          warnings,
          durationMs: Date.now() - startTime
        };
      }

      post.updated_at = currentResult.data.posts[0].updated_at;

      result = await ghostFetch(
        apiUrl,
        `/ghost/api/admin/posts/${existingPostId}/`,
        { method: 'PUT', body: postBody },
        adminApiKey
      );
    } else {
      result = await ghostFetch(
        apiUrl,
        '/ghost/api/admin/posts/',
        { method: 'POST', body: postBody },
        adminApiKey
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
      const errMsg = result.data?.errors?.[0]?.message || `HTTP ${result.status}`;
      return {
        success: false,
        postId: existingPostId || null,
        postUrl: null,
        status: 'error',
        errors: [`Ghost API error: ${errMsg}`],
        warnings,
        durationMs: Date.now() - startTime
      };
    }

    const createdPost = result.data?.posts?.[0];
    if (!createdPost || !createdPost.id) {
      return {
        success: false,
        postId: null,
        postUrl: null,
        status: 'error',
        errors: ['Ghost API returned success but no post data'],
        warnings,
        durationMs: Date.now() - startTime
      };
    }

    logger.info('ghost_publish_complete', {
      postId: createdPost.id,
      postUrl: createdPost.url,
      status: createdPost.status,
      durationMs: Date.now() - startTime
    });

    return {
      success: true,
      postId: createdPost.id,
      postUrl: createdPost.url,
      ghostStatus: createdPost.status,
      status: 'published',
      slug: createdPost.slug,
      errors,
      warnings,
      durationMs: Date.now() - startTime
    };
  } catch (e) {
    logger.error('ghost_publish_error', { error: e.message, stack: e.stack });
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

// ── Status check ─────────────────────────────────────────────────────────────

/**
 * Check Ghost connection by fetching site info.
 *
 * @param {string} apiUrl
 * @param {string} adminApiKey
 * @returns {Promise<object>}
 */
async function checkStatus(apiUrl, adminApiKey) {
  try {
    const result = await ghostFetch(
      apiUrl,
      '/ghost/api/admin/site/',
      { method: 'GET' },
      adminApiKey
    );

    if (result.status !== 200) {
      return {
        connected: false,
        siteName: null,
        error: `API returned ${result.status}: ${JSON.stringify(result.data?.errors || result.data)}`
      };
    }

    return {
      connected: true,
      siteName: result.data?.site?.title || null,
      siteUrl: result.data?.site?.url || apiUrl,
      version: result.data?.site?.version || null,
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
 * Get post status from Ghost.
 *
 * @param {string} apiUrl
 * @param {string} postId
 * @param {string} adminApiKey
 * @returns {Promise<object>}
 */
async function getPostStatus(apiUrl, postId, adminApiKey) {
  if (!postId) throw new Error('postId is required');

  const result = await ghostFetch(
    apiUrl,
    `/ghost/api/admin/posts/${postId}/`,
    { method: 'GET' },
    adminApiKey
  );

  if (result.status === 404) {
    return { found: false, postId, status: 'not_found' };
  }
  if (result.status === 401 || result.status === 403) {
    return { found: false, postId, status: 'auth_error', error: result.error };
  }
  if (result.status !== 200 || !result.data?.posts?.[0]) {
    return { found: false, postId, status: 'error', error: `HTTP ${result.status}` };
  }

  const post = result.data.posts[0];
  return {
    found: true,
    postId: post.id,
    status: post.status,
    title: post.title,
    url: post.url,
    slug: post.slug,
    updatedAt: post.updated_at,
    publishedAt: post.published_at
  };
}

// ── Module exports ───────────────────────────────────────────────────────────

module.exports = {
  publishToGhost,
  checkStatus,
  getPostStatus,
  resolveCredentials,
  generateGhostJwt,
  buildTags,
  ghostFetch,
  encryptCredentials,
  decryptCredentials,
  base64url
};
