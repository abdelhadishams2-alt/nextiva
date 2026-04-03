/**
 * Generic Webhook Publishing Adapter
 *
 * POSTs the Universal Payload to a user-configured webhook URL with
 * HMAC-SHA256 signature for verification. Supports any CMS or endpoint
 * that accepts HTTP POST with JSON body.
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
const SIGNATURE_HEADER = 'X-ChainIQ-Signature';
const TIMESTAMP_HEADER = 'X-ChainIQ-Timestamp';
const DELIVERY_ID_HEADER = 'X-ChainIQ-Delivery';

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

// ── HMAC Signature ───────────────────────────────────────────────────────────

/**
 * Generate an HMAC-SHA256 signature for a payload.
 *
 * The signature is computed over: timestamp.body
 * This prevents replay attacks when combined with timestamp validation.
 *
 * @param {string} body - JSON body string
 * @param {string} secret - Webhook secret for HMAC
 * @param {string} timestamp - ISO 8601 timestamp
 * @returns {string} Hex-encoded HMAC signature
 */
function generateSignature(body, secret, timestamp) {
  if (!secret) throw new Error('Webhook secret is required for signature generation');
  const signingPayload = `${timestamp}.${body}`;
  return crypto.createHmac('sha256', secret)
    .update(signingPayload)
    .digest('hex');
}

/**
 * Verify an HMAC-SHA256 signature (for webhook receivers to use).
 *
 * @param {string} body - JSON body string
 * @param {string} secret - Webhook secret
 * @param {string} timestamp - Received timestamp
 * @param {string} signature - Received signature
 * @param {number} [maxAgeSec=300] - Maximum age of timestamp in seconds
 * @returns {boolean}
 */
function verifySignature(body, secret, timestamp, signature, maxAgeSec = 300) {
  // Check timestamp freshness
  const tsDate = new Date(timestamp);
  if (isNaN(tsDate.getTime())) return false;
  const ageMs = Date.now() - tsDate.getTime();
  if (ageMs > maxAgeSec * 1000 || ageMs < -30000) return false;

  const expected = generateSignature(body, secret, timestamp);
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

// ── HTTP helper ──────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Send a webhook POST request with HMAC signature and retry logic.
 *
 * @param {string} webhookUrl - Target URL to POST to
 * @param {object} body - JSON body
 * @param {string} secret - HMAC secret for signing
 * @param {object} [extraHeaders] - Additional headers to include
 * @param {number} [timeoutMs]
 * @returns {Promise<{status: number, data: any, headers: object, deliveryId: string}>}
 */
async function webhookSend(webhookUrl, body, secret, extraHeaders = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  // Validate URL
  let parsedUrl;
  try {
    parsedUrl = new URL(webhookUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Webhook URL must use http or https');
    }
  } catch (e) {
    throw new Error(`Invalid webhook URL: ${e.message}`);
  }

  const deliveryId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const bodyStr = JSON.stringify(body);
  const signature = secret ? generateSignature(bodyStr, secret, timestamp) : null;

  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_BACKOFF_MS * Math.pow(2, attempt - 1);
      logger.info('webhook_retry', { attempt, delay, url: webhookUrl });
      await sleep(delay);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'ChainIQ-Publisher/1.0',
        [DELIVERY_ID_HEADER]: deliveryId,
        [TIMESTAMP_HEADER]: timestamp,
        ...(extraHeaders || {})
      };

      if (signature) {
        headers[SIGNATURE_HEADER] = `sha256=${signature}`;
      }

      const fetchOpts = {
        method: 'POST',
        headers,
        body: bodyStr,
        signal: controller.signal
      };

      const response = await fetch(webhookUrl, fetchOpts);
      clearTimeout(timer);

      let responseData;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        responseData = await response.json().catch(() => null);
      } else {
        responseData = await response.text().catch(() => null);
      }

      // Don't retry client errors (4xx) except 429
      if (response.status === 429 && attempt < MAX_RETRIES) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10);
        logger.warn('webhook_rate_limited', { url: webhookUrl, attempt, retryAfterSec: retryAfter });
        await sleep(retryAfter * 1000);
        continue;
      }

      if (response.status >= 500 && attempt < MAX_RETRIES) {
        lastError = new Error(`Webhook returned ${response.status}`);
        logger.warn('webhook_server_error', { status: response.status, attempt, url: webhookUrl });
        continue;
      }

      return {
        status: response.status,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries()),
        deliveryId
      };
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        lastError = new Error(`Webhook timeout after ${timeoutMs}ms: ${webhookUrl}`);
      } else {
        lastError = err;
      }
      if (attempt < MAX_RETRIES) {
        logger.warn('webhook_network_error', { error: lastError.message, attempt, url: webhookUrl });
        continue;
      }
    }
  }

  throw lastError || new Error(`Webhook delivery failed after ${MAX_RETRIES + 1} attempts`);
}

// ── Credential resolver ──────────────────────────────────────────────────────

/**
 * Resolve webhook credentials from key-manager.
 *
 * @param {object} keyManager - KeyManager instance
 * @param {string} userId - User ID
 * @returns {Promise<{webhookUrl: string, webhookSecret: string|null}>}
 */
async function resolveCredentials(keyManager, userId) {
  let webhookUrl = null;
  let webhookSecret = null;

  try { webhookUrl = await keyManager.getKey('webhook_url', userId); } catch { /* ignore */ }
  if (!webhookUrl) {
    try { webhookUrl = await keyManager.getKey('webhook_url', 'global'); } catch { /* ignore */ }
  }

  try { webhookSecret = await keyManager.getKey('webhook_secret', userId); } catch { /* ignore */ }
  if (!webhookSecret) {
    try { webhookSecret = await keyManager.getKey('webhook_secret', 'global'); } catch { /* ignore */ }
  }

  if (!webhookUrl) {
    throw new Error(
      'Webhook URL not configured. Store webhook_url via the API Keys endpoint.'
    );
  }

  return { webhookUrl, webhookSecret };
}

// ── Main publish function ────────────────────────────────────────────────────

/**
 * Publish an article via generic webhook using the Universal Payload.
 *
 * @param {object} params
 * @param {object} params.payload - Universal article payload
 * @param {string} params.webhookUrl - Target webhook URL
 * @param {string|null} params.webhookSecret - HMAC secret for signing
 * @param {object} [params.options]
 * @param {object} [params.options.extraHeaders] - Additional headers to include
 * @param {object} [params.options.extraData] - Additional data to merge into webhook body
 * @param {string} [params.options.event='article.published'] - Event type for the webhook
 * @returns {Promise<object>}
 */
async function publishViaWebhook(params) {
  const { payload, webhookUrl, webhookSecret, options = {} } = params;
  const {
    extraHeaders = {},
    extraData = {},
    event = 'article.published'
  } = options;

  const startTime = Date.now();
  const warnings = [];
  const errors = [];

  logger.info('webhook_publish_start', {
    webhookUrl,
    event,
    title: payload.title?.slice(0, 80)
  });

  try {
    // Build webhook body: wrap payload in an event envelope
    const webhookBody = {
      event,
      timestamp: new Date().toISOString(),
      payload,
      ...extraData
    };

    const result = await webhookSend(webhookUrl, webhookBody, webhookSecret, extraHeaders);

    // Treat 2xx as success
    const success = result.status >= 200 && result.status < 300;

    if (!success) {
      const errMsg = typeof result.data === 'string'
        ? result.data.slice(0, 500)
        : (result.data?.message || result.data?.error || `HTTP ${result.status}`);
      errors.push(`Webhook returned ${result.status}: ${errMsg}`);
    }

    logger.info('webhook_publish_complete', {
      success,
      status: result.status,
      deliveryId: result.deliveryId,
      durationMs: Date.now() - startTime
    });

    return {
      success,
      deliveryId: result.deliveryId,
      responseStatus: result.status,
      status: success ? 'delivered' : 'error',
      errors,
      warnings,
      durationMs: Date.now() - startTime
    };
  } catch (e) {
    logger.error('webhook_publish_error', { error: e.message, stack: e.stack });
    return {
      success: false,
      deliveryId: null,
      responseStatus: null,
      status: 'error',
      errors: [e.message],
      warnings,
      durationMs: Date.now() - startTime
    };
  }
}

// ── Module exports ───────────────────────────────────────────────────────────

module.exports = {
  publishViaWebhook,
  resolveCredentials,
  webhookSend,
  generateSignature,
  verifySignature,
  encryptCredentials,
  decryptCredentials
};
