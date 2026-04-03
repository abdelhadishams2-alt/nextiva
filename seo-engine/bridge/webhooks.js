/**
 * Webhook System — Event notifications for pipeline state changes.
 *
 * Emits events when articles are created, completed, failed, or edited.
 * Supports HMAC-SHA256 signature verification and exponential backoff retry.
 */

const crypto = require('crypto');
const logger = require('./logger');

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000; // 1s, 2s, 4s exponential

class WebhookManager {
  constructor() {
    this.hooks = new Map(); // id → { url, events, secret, active }
    this.pendingRetries = [];
  }

  /** Register a webhook endpoint. */
  register({ id, url, events, secret, active = true }) {
    if (!id || !url || !events || !Array.isArray(events)) {
      throw new Error('Webhook requires id, url, and events array');
    }
    this.hooks.set(id, { id, url, events, secret: secret || '', active });
    logger.info('webhook_registered', { id, url, events });
    return { id, url, events, active };
  }

  /** Remove a webhook. */
  unregister(id) {
    const existed = this.hooks.delete(id);
    if (existed) logger.info('webhook_unregistered', { id });
    return existed;
  }

  /** List all registered webhooks. */
  list() {
    return Array.from(this.hooks.values()).map(h => ({
      id: h.id,
      url: h.url,
      events: h.events,
      active: h.active
    }));
  }

  /** Update a webhook. */
  update(id, updates) {
    const hook = this.hooks.get(id);
    if (!hook) return null;
    Object.assign(hook, updates);
    return { id: hook.id, url: hook.url, events: hook.events, active: hook.active };
  }

  /** Emit an event to all matching webhooks. */
  async emit(event, data) {
    const matching = Array.from(this.hooks.values()).filter(
      h => h.active && h.events.includes(event)
    );

    if (matching.length === 0) return;

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data
    };

    const results = await Promise.allSettled(
      matching.map(hook => this._deliver(hook, payload, 0))
    );

    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed > 0) {
      logger.warn('webhook_delivery_failures', { event, total: matching.length, failed });
    }
  }

  /** Deliver payload to a single webhook with retry. */
  async _deliver(hook, payload, attempt) {
    const body = JSON.stringify(payload);
    const signature = this._sign(body, hook.secret);

    try {
      const response = await fetch(hook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ChainIQ-Signature': signature,
          'X-ChainIQ-Event': payload.event,
          'X-ChainIQ-Delivery': crypto.randomUUID()
        },
        body,
        signal: AbortSignal.timeout(10000) // 10s timeout per delivery
      });

      if (!response.ok && attempt < MAX_RETRIES) {
        const delay = RETRY_BASE_MS * Math.pow(2, attempt);
        logger.warn('webhook_retry', { hookId: hook.id, attempt: attempt + 1, delay, status: response.status });
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._deliver(hook, payload, attempt + 1);
      }

      if (!response.ok) {
        throw new Error(`Webhook delivery failed after ${MAX_RETRIES} retries: HTTP ${response.status}`);
      }

      logger.info('webhook_delivered', { hookId: hook.id, event: payload.event });
    } catch (e) {
      if (attempt < MAX_RETRIES && !e.message.includes('after')) {
        const delay = RETRY_BASE_MS * Math.pow(2, attempt);
        logger.warn('webhook_retry', { hookId: hook.id, attempt: attempt + 1, delay, error: e.message });
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._deliver(hook, payload, attempt + 1);
      }
      logger.error('webhook_delivery_failed', { hookId: hook.id, event: payload.event, error: e.message });
      throw e;
    }
  }

  /** Generate HMAC-SHA256 signature. */
  _sign(body, secret) {
    if (!secret) return 'unsigned';
    return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
  }

  /** Verify a signature (for testing/validation). */
  static verify(body, secret, signature) {
    const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }
}

/** Supported webhook events */
WebhookManager.EVENTS = [
  'article.created',
  'article.updated',
  'article.deleted',
  'pipeline.started',
  'pipeline.completed',
  'pipeline.failed',
  'edit.started',
  'edit.completed',
  'edit.failed'
];

module.exports = { WebhookManager };
