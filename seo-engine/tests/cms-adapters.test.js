/**
 * Tests for CMS Publishing Adapters: Ghost, Contentful, Strapi, Webflow, Webhook
 *
 * Uses node:test — zero npm dependencies.
 * Tests encryption, credential handling, JWT generation, HMAC signing,
 * and module structure for all five adapters.
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// ── Ghost Adapter Tests ──────────────────────────────────────────────────────

const ghost = require('../bridge/publishing/ghost');

describe('Ghost Adapter', () => {

  describe('encryptCredentials / decryptCredentials', () => {
    it('round-trips an object through encrypt/decrypt', () => {
      const original = { apiUrl: 'https://blog.example.com', adminApiKey: 'abc123:deadbeef' };
      const encrypted = ghost.encryptCredentials(original);
      assert.ok(typeof encrypted === 'string');
      assert.ok(encrypted.includes(':'));
      const decrypted = ghost.decryptCredentials(encrypted);
      assert.deepEqual(decrypted, original);
    });

    it('throws on invalid encrypted format', () => {
      assert.throws(() => ghost.decryptCredentials('invalid'), /Invalid encrypted credential format/);
    });
  });

  describe('generateGhostJwt', () => {
    it('generates a valid JWT string with 3 parts', () => {
      // Use a hex secret (64 hex chars = 32 bytes)
      const apiKey = 'abcdef1234567890:' + 'aa'.repeat(32);
      const jwt = ghost.generateGhostJwt(apiKey);
      assert.ok(typeof jwt === 'string');
      const parts = jwt.split('.');
      assert.equal(parts.length, 3, 'JWT should have 3 parts');

      // Decode header
      const header = JSON.parse(Buffer.from(parts[0].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
      assert.equal(header.alg, 'HS256');
      assert.equal(header.typ, 'JWT');
      assert.equal(header.kid, 'abcdef1234567890');

      // Decode payload
      const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
      assert.ok(payload.iat > 0);
      assert.ok(payload.exp > payload.iat);
      assert.equal(payload.aud, '/admin/');
    });

    it('throws if API key format is invalid', () => {
      assert.throws(() => ghost.generateGhostJwt('no-colon'), /format id:secret/);
      assert.throws(() => ghost.generateGhostJwt(''), /format id:secret/);
      assert.throws(() => ghost.generateGhostJwt(null), /format id:secret/);
    });
  });

  describe('base64url', () => {
    it('encodes without padding or unsafe chars', () => {
      const result = ghost.base64url('test string with special chars!!!');
      assert.ok(!result.includes('+'));
      assert.ok(!result.includes('/'));
      assert.ok(!result.includes('='));
    });
  });

  describe('buildTags', () => {
    it('converts string array to Ghost tag objects', () => {
      const tags = ghost.buildTags(['SEO', 'Marketing', 'AI']);
      assert.equal(tags.length, 3);
      assert.deepEqual(tags[0], { name: 'SEO' });
      assert.deepEqual(tags[1], { name: 'Marketing' });
    });

    it('filters empty and falsy values', () => {
      const tags = ghost.buildTags(['SEO', '', null, '  ', 'AI']);
      assert.equal(tags.length, 2);
      assert.deepEqual(tags[0], { name: 'SEO' });
      assert.deepEqual(tags[1], { name: 'AI' });
    });

    it('returns empty array for null/undefined input', () => {
      assert.deepEqual(ghost.buildTags(null), []);
      assert.deepEqual(ghost.buildTags(undefined), []);
      assert.deepEqual(ghost.buildTags([]), []);
    });
  });

  describe('module exports', () => {
    it('exports all expected functions', () => {
      assert.equal(typeof ghost.publishToGhost, 'function');
      assert.equal(typeof ghost.checkStatus, 'function');
      assert.equal(typeof ghost.getPostStatus, 'function');
      assert.equal(typeof ghost.resolveCredentials, 'function');
      assert.equal(typeof ghost.generateGhostJwt, 'function');
      assert.equal(typeof ghost.ghostFetch, 'function');
      assert.equal(typeof ghost.encryptCredentials, 'function');
      assert.equal(typeof ghost.decryptCredentials, 'function');
    });
  });
});

// ── Contentful Adapter Tests ─────────────────────────────────────────────────

const contentful = require('../bridge/publishing/contentful');

describe('Contentful Adapter', () => {

  describe('encryptCredentials / decryptCredentials', () => {
    it('round-trips an object through encrypt/decrypt', () => {
      const original = { spaceId: 'space123', token: 'CFPAT-xxxxx' };
      const encrypted = contentful.encryptCredentials(original);
      assert.ok(typeof encrypted === 'string');
      const decrypted = contentful.decryptCredentials(encrypted);
      assert.deepEqual(decrypted, original);
    });
  });

  describe('module exports', () => {
    it('exports all expected functions', () => {
      assert.equal(typeof contentful.publishToContentful, 'function');
      assert.equal(typeof contentful.checkStatus, 'function');
      assert.equal(typeof contentful.resolveCredentials, 'function');
      assert.equal(typeof contentful.contentfulFetch, 'function');
      assert.equal(typeof contentful.encryptCredentials, 'function');
      assert.equal(typeof contentful.decryptCredentials, 'function');
    });
  });
});

// ── Strapi Adapter Tests ─────────────────────────────────────────────────────

const strapi = require('../bridge/publishing/strapi');

describe('Strapi Adapter', () => {

  describe('encryptCredentials / decryptCredentials', () => {
    it('round-trips an object through encrypt/decrypt', () => {
      const original = { baseUrl: 'https://cms.example.com', apiToken: 'tok_abc123' };
      const encrypted = strapi.encryptCredentials(original);
      assert.ok(typeof encrypted === 'string');
      const decrypted = strapi.decryptCredentials(encrypted);
      assert.deepEqual(decrypted, original);
    });
  });

  describe('module exports', () => {
    it('exports all expected functions', () => {
      assert.equal(typeof strapi.publishToStrapi, 'function');
      assert.equal(typeof strapi.checkStatus, 'function');
      assert.equal(typeof strapi.resolveCredentials, 'function');
      assert.equal(typeof strapi.strapiFetch, 'function');
      assert.equal(typeof strapi.encryptCredentials, 'function');
      assert.equal(typeof strapi.decryptCredentials, 'function');
    });
  });
});

// ── Webflow Adapter Tests ────────────────────────────────────────────────────

const webflow = require('../bridge/publishing/webflow');

describe('Webflow Adapter', () => {

  describe('encryptCredentials / decryptCredentials', () => {
    it('round-trips an object through encrypt/decrypt', () => {
      const original = { siteId: 'site_abc', apiToken: 'wf_token_123' };
      const encrypted = webflow.encryptCredentials(original);
      assert.ok(typeof encrypted === 'string');
      const decrypted = webflow.decryptCredentials(encrypted);
      assert.deepEqual(decrypted, original);
    });
  });

  describe('module exports', () => {
    it('exports all expected functions', () => {
      assert.equal(typeof webflow.publishToWebflow, 'function');
      assert.equal(typeof webflow.checkStatus, 'function');
      assert.equal(typeof webflow.listCollections, 'function');
      assert.equal(typeof webflow.resolveCredentials, 'function');
      assert.equal(typeof webflow.webflowFetch, 'function');
      assert.equal(typeof webflow.encryptCredentials, 'function');
      assert.equal(typeof webflow.decryptCredentials, 'function');
    });
  });
});

// ── Webhook Adapter Tests ────────────────────────────────────────────────────

const webhook = require('../bridge/publishing/webhook');

describe('Webhook Adapter', () => {

  describe('encryptCredentials / decryptCredentials', () => {
    it('round-trips an object through encrypt/decrypt', () => {
      const original = { webhookUrl: 'https://hooks.example.com/ingest', secret: 's3cret' };
      const encrypted = webhook.encryptCredentials(original);
      assert.ok(typeof encrypted === 'string');
      const decrypted = webhook.decryptCredentials(encrypted);
      assert.deepEqual(decrypted, original);
    });
  });

  describe('generateSignature', () => {
    it('generates a hex HMAC-SHA256 signature', () => {
      const body = '{"event":"test"}';
      const secret = 'my_webhook_secret';
      const timestamp = '2026-01-01T00:00:00.000Z';
      const sig = webhook.generateSignature(body, secret, timestamp);
      assert.ok(typeof sig === 'string');
      assert.ok(/^[0-9a-f]{64}$/.test(sig), 'Should be 64 hex chars (SHA-256)');
    });

    it('generates consistent signatures for same input', () => {
      const body = '{"data":"test"}';
      const secret = 'secret123';
      const ts = '2026-03-28T12:00:00.000Z';
      const sig1 = webhook.generateSignature(body, secret, ts);
      const sig2 = webhook.generateSignature(body, secret, ts);
      assert.equal(sig1, sig2);
    });

    it('generates different signatures for different bodies', () => {
      const secret = 'secret123';
      const ts = '2026-03-28T12:00:00.000Z';
      const sig1 = webhook.generateSignature('{"a":1}', secret, ts);
      const sig2 = webhook.generateSignature('{"a":2}', secret, ts);
      assert.notEqual(sig1, sig2);
    });

    it('generates different signatures for different secrets', () => {
      const body = '{"data":"test"}';
      const ts = '2026-03-28T12:00:00.000Z';
      const sig1 = webhook.generateSignature(body, 'secret1', ts);
      const sig2 = webhook.generateSignature(body, 'secret2', ts);
      assert.notEqual(sig1, sig2);
    });

    it('throws if secret is missing', () => {
      assert.throws(() => webhook.generateSignature('body', null, 'ts'), /secret is required/);
      assert.throws(() => webhook.generateSignature('body', '', 'ts'), /secret is required/);
    });
  });

  describe('verifySignature', () => {
    it('verifies a valid signature', () => {
      const body = '{"event":"article.published"}';
      const secret = 'whsec_test_key';
      const timestamp = new Date().toISOString();
      const sig = webhook.generateSignature(body, secret, timestamp);
      assert.ok(webhook.verifySignature(body, secret, timestamp, sig));
    });

    it('rejects a tampered body', () => {
      const secret = 'whsec_test_key';
      const timestamp = new Date().toISOString();
      const sig = webhook.generateSignature('{"original":true}', secret, timestamp);
      assert.ok(!webhook.verifySignature('{"tampered":true}', secret, timestamp, sig));
    });

    it('rejects a wrong secret', () => {
      const body = '{"event":"test"}';
      const timestamp = new Date().toISOString();
      const sig = webhook.generateSignature(body, 'correct_secret', timestamp);
      assert.ok(!webhook.verifySignature(body, 'wrong_secret', timestamp, sig));
    });

    it('rejects an expired timestamp', () => {
      const body = '{"event":"test"}';
      const secret = 'whsec_test';
      const oldTimestamp = new Date(Date.now() - 600000).toISOString(); // 10 minutes ago
      const sig = webhook.generateSignature(body, secret, oldTimestamp);
      assert.ok(!webhook.verifySignature(body, secret, oldTimestamp, sig, 300));
    });

    it('rejects an invalid timestamp', () => {
      const body = '{"event":"test"}';
      const secret = 'whsec_test';
      const sig = webhook.generateSignature(body, secret, 'invalid-date');
      assert.ok(!webhook.verifySignature(body, secret, 'invalid-date', sig));
    });
  });

  describe('module exports', () => {
    it('exports all expected functions', () => {
      assert.equal(typeof webhook.publishViaWebhook, 'function');
      assert.equal(typeof webhook.resolveCredentials, 'function');
      assert.equal(typeof webhook.webhookSend, 'function');
      assert.equal(typeof webhook.generateSignature, 'function');
      assert.equal(typeof webhook.verifySignature, 'function');
      assert.equal(typeof webhook.encryptCredentials, 'function');
      assert.equal(typeof webhook.decryptCredentials, 'function');
    });
  });
});

// ── Cross-adapter consistency tests ──────────────────────────────────────────

describe('Cross-Adapter Consistency', () => {
  const adapters = [
    { name: 'ghost', mod: ghost },
    { name: 'contentful', mod: contentful },
    { name: 'strapi', mod: strapi },
    { name: 'webflow', mod: webflow },
    { name: 'webhook', mod: webhook }
  ];

  for (const { name, mod } of adapters) {
    it(`${name} exports encryptCredentials and decryptCredentials`, () => {
      assert.equal(typeof mod.encryptCredentials, 'function');
      assert.equal(typeof mod.decryptCredentials, 'function');
    });

    it(`${name} exports resolveCredentials`, () => {
      assert.equal(typeof mod.resolveCredentials, 'function');
    });

    it(`${name} encryption is interoperable with itself`, () => {
      const data = { key: `test_${name}`, value: 'secret_value_123' };
      const enc = mod.encryptCredentials(data);
      const dec = mod.decryptCredentials(enc);
      assert.deepEqual(dec, data);
    });
  }
});
