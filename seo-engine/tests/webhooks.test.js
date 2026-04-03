const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { WebhookManager } = require('../bridge/webhooks');

describe('WebhookManager', () => {
  describe('registration', () => {
    it('registers a webhook', () => {
      const wm = new WebhookManager();
      const hook = wm.register({
        id: 'test-1',
        url: 'https://example.com/webhook',
        events: ['article.created'],
        secret: 'mysecret'
      });
      assert.equal(hook.id, 'test-1');
      assert.equal(hook.url, 'https://example.com/webhook');
      assert.deepEqual(hook.events, ['article.created']);
    });

    it('requires id, url, and events', () => {
      const wm = new WebhookManager();
      assert.throws(() => wm.register({ url: 'https://x.com' }), /events/);
      assert.throws(() => wm.register({ id: '1', events: ['x'] }), /url/);
    });

    it('lists registered webhooks', () => {
      const wm = new WebhookManager();
      wm.register({ id: '1', url: 'https://a.com', events: ['article.created'] });
      wm.register({ id: '2', url: 'https://b.com', events: ['pipeline.completed'] });
      const list = wm.list();
      assert.equal(list.length, 2);
      assert.ok(list.find(h => h.id === '1'));
    });

    it('does not expose secret in list', () => {
      const wm = new WebhookManager();
      wm.register({ id: '1', url: 'https://a.com', events: ['article.created'], secret: 'hidden' });
      const list = wm.list();
      assert.equal(list[0].secret, undefined);
    });

    it('unregisters a webhook', () => {
      const wm = new WebhookManager();
      wm.register({ id: '1', url: 'https://a.com', events: ['article.created'] });
      assert.equal(wm.unregister('1'), true);
      assert.equal(wm.list().length, 0);
    });

    it('returns false for non-existent unregister', () => {
      const wm = new WebhookManager();
      assert.equal(wm.unregister('nope'), false);
    });

    it('updates a webhook', () => {
      const wm = new WebhookManager();
      wm.register({ id: '1', url: 'https://a.com', events: ['article.created'] });
      const updated = wm.update('1', { active: false });
      assert.equal(updated.active, false);
    });

    it('returns null for updating non-existent webhook', () => {
      const wm = new WebhookManager();
      assert.equal(wm.update('nope', {}), null);
    });
  });

  describe('signature verification', () => {
    it('generates valid HMAC-SHA256 signatures', () => {
      const secret = 'test-secret-key';
      const body = JSON.stringify({ event: 'test', data: {} });
      const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
      assert.ok(WebhookManager.verify(body, secret, expected));
    });

    it('rejects invalid signatures', () => {
      const body = '{"test":true}';
      assert.throws(() => {
        WebhookManager.verify(body, 'real-secret', 'sha256=0000000000');
      });
    });

    it('returns unsigned when no secret', () => {
      const wm = new WebhookManager();
      // Access the private _sign method via prototype
      const sig = wm._sign('body', '');
      assert.equal(sig, 'unsigned');
    });
  });

  describe('event filtering', () => {
    it('only delivers to matching event subscriptions', async () => {
      const wm = new WebhookManager();
      wm.register({ id: '1', url: 'https://a.com', events: ['article.created'] });
      wm.register({ id: '2', url: 'https://b.com', events: ['pipeline.completed'] });

      // Override _deliver to track calls
      const delivered = [];
      wm._deliver = async (hook, payload) => { delivered.push(hook.id); };

      await wm.emit('article.created', { title: 'Test' });
      assert.equal(delivered.length, 1);
      assert.equal(delivered[0], '1');
    });

    it('skips inactive webhooks', async () => {
      const wm = new WebhookManager();
      wm.register({ id: '1', url: 'https://a.com', events: ['article.created'], active: false });

      const delivered = [];
      wm._deliver = async (hook) => { delivered.push(hook.id); };

      await wm.emit('article.created', { title: 'Test' });
      assert.equal(delivered.length, 0);
    });

    it('delivers to multiple matching hooks', async () => {
      const wm = new WebhookManager();
      wm.register({ id: '1', url: 'https://a.com', events: ['article.created'] });
      wm.register({ id: '2', url: 'https://b.com', events: ['article.created', 'pipeline.completed'] });

      const delivered = [];
      wm._deliver = async (hook) => { delivered.push(hook.id); };

      await wm.emit('article.created', {});
      assert.equal(delivered.length, 2);
    });
  });

  describe('EVENTS constant', () => {
    it('contains expected event types', () => {
      assert.ok(WebhookManager.EVENTS.includes('article.created'));
      assert.ok(WebhookManager.EVENTS.includes('pipeline.completed'));
      assert.ok(WebhookManager.EVENTS.includes('edit.started'));
      assert.ok(WebhookManager.EVENTS.length >= 9);
    });
  });
});
