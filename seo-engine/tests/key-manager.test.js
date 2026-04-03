const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { encrypt, decrypt, encryptKey, decryptKey, generateHint, KeyManager } = require('../bridge/key-manager');

// Set a fixed encryption key for tests
process.env.BRIDGE_ENCRYPTION_KEY = 'a'.repeat(64);  // 32 bytes hex

describe('Key Manager — Encryption', () => {
  it('encrypts and decrypts a value correctly', () => {
    const plaintext = 'sk-test-api-key-12345';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    assert.equal(decrypted, plaintext);
  });

  it('encrypted format is iv:authTag:ciphertext', () => {
    const encrypted = encrypt('test-key');
    const parts = encrypted.split(':');
    assert.equal(parts.length, 3, 'Should have 3 colon-separated parts');
    // IV is 16 bytes = 32 hex chars
    assert.equal(parts[0].length, 32, 'IV should be 32 hex chars');
    // Auth tag is 16 bytes = 32 hex chars
    assert.equal(parts[1].length, 32, 'Auth tag should be 32 hex chars');
    // Ciphertext is hex-encoded
    assert.ok(parts[2].length > 0, 'Ciphertext should not be empty');
  });

  it('different encryptions of same value produce different ciphertext', () => {
    const plaintext = 'same-key';
    const enc1 = encrypt(plaintext);
    const enc2 = encrypt(plaintext);
    assert.notEqual(enc1, enc2, 'Should use random IV');
    // But both should decrypt to the same value
    assert.equal(decrypt(enc1), plaintext);
    assert.equal(decrypt(enc2), plaintext);
  });

  it('rejects tampered ciphertext', () => {
    const encrypted = encrypt('secret');
    const parts = encrypted.split(':');
    // Tamper with the ciphertext
    parts[2] = '00' + parts[2].slice(2);
    assert.throws(() => decrypt(parts.join(':')));
  });

  it('rejects invalid format', () => {
    assert.throws(() => decrypt('not-a-valid-format'));
    assert.throws(() => decrypt('aa:bb'));  // Only 2 parts
  });

  it('handles empty string', () => {
    const encrypted = encrypt('');
    assert.equal(decrypt(encrypted), '');
  });

  it('handles unicode characters', () => {
    const plaintext = 'key-with-unicode-مفتاح-🔑';
    const encrypted = encrypt(plaintext);
    assert.equal(decrypt(encrypted), plaintext);
  });

  it('handles long keys', () => {
    const plaintext = 'x'.repeat(10000);
    const encrypted = encrypt(plaintext);
    assert.equal(decrypt(encrypted), plaintext);
  });
});

describe('Key Manager — Hint Generation', () => {
  it('generates hint with last 4 chars', () => {
    assert.equal(generateHint('sk-abc123xyz'), '****3xyz');
    assert.equal(generateHint('my-secret-key-abcd'), '****abcd');
  });

  it('handles short keys', () => {
    assert.equal(generateHint('abc'), '****');
    assert.equal(generateHint('ab'), '****');
    assert.equal(generateHint(''), '****');
  });

  it('handles exactly 4 chars', () => {
    assert.equal(generateHint('abcd'), '****');
  });

  it('handles 5 chars', () => {
    assert.equal(generateHint('abcde'), '****bcde');
  });
});

describe('Key Manager — KeyManager class', () => {
  let km;
  let mockStore;

  beforeEach(() => {
    mockStore = [];
    const mockSupabase = {
      loadConfig() {
        return { url: 'https://test.supabase.co', anonKey: 'test-anon' };
      },
      getServiceRoleKey() {
        return 'test-service-role';
      }
    };

    // Mock global fetch for KeyManager
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, opts = {}) => {
      const urlStr = typeof url === 'string' ? url : url.toString();

      // PATCH (deactivate old keys)
      if (opts.method === 'PATCH' && urlStr.includes('api_keys')) {
        const body = JSON.parse(opts.body || '{}');
        for (const item of mockStore) {
          if (body.is_active === false) item.is_active = false;
        }
        return { ok: true, json: async () => [] };
      }

      // POST (insert new key)
      if (opts.method === 'POST' && urlStr.includes('api_keys')) {
        const body = JSON.parse(opts.body);
        const row = {
          id: 'key-' + Math.random().toString(36).slice(2),
          ...body,
          created_at: new Date().toISOString()
        };
        mockStore.push(row);
        return { ok: true, json: async () => [row] };
      }

      // GET (list keys)
      if (opts.method === 'GET' || !opts.method) {
        if (urlStr.includes('is_active=eq.true') && urlStr.includes('key_name=eq.')) {
          const match = urlStr.match(/key_name=eq\.([^&]+)/);
          const keyName = match ? decodeURIComponent(match[1]) : '';
          const active = mockStore.filter(k => k.key_name === keyName && k.is_active);
          return { ok: true, json: async () => active };
        }
        return { ok: true, json: async () => mockStore };
      }

      // DELETE
      if (opts.method === 'DELETE') {
        return { ok: true };
      }

      return originalFetch(url, opts);
    };

    km = new KeyManager({ supabase: mockSupabase });
  });

  it('adds a key and returns metadata without value', async () => {
    const result = await km.addKey('gemini_api_key', 'sk-test-123', 'admin-user-id');
    assert.ok(result.id);
    assert.equal(result.key_name, 'gemini_api_key');
    assert.equal(result.key_hint, '****-123');
    assert.equal(result.is_active, true);
    // Should NOT contain the raw value
    assert.equal(result.key_value, undefined);
  });

  it('lists keys without encrypted values', async () => {
    await km.addKey('gemini_api_key', 'sk-test-123', 'admin-id');
    await km.addKey('custom_llm_key', 'sk-custom-456', 'admin-id');
    const keys = await km.listKeys();
    assert.equal(keys.length, 2);
    assert.ok(keys[0].key_name);
    assert.ok(keys[0].key_hint);
  });

  it('resolves a key by name', async () => {
    await km.addKey('gemini_api_key', 'sk-real-secret-key', 'admin-id');
    const value = await km.resolveKey('gemini_api_key');
    assert.equal(value, 'sk-real-secret-key');
  });

  it('returns null for non-existent key', async () => {
    const value = await km.resolveKey('nonexistent_key');
    assert.equal(value, null);
  });

  it('resolves all keys as env var map', async () => {
    await km.addKey('gemini_api_key', 'sk-gem-123', 'admin-id');
    await km.addKey('custom_llm_key', 'sk-llm-456', 'admin-id');
    const envMap = await km.resolveAllKeys();
    assert.equal(envMap.GEMINI_API_KEY, 'sk-gem-123');
    assert.equal(envMap.CUSTOM_LLM_API_KEY, 'sk-llm-456');
  });
});

describe('Key Manager — encryptKey / decryptKey aliases', () => {
  it('encryptKey is the same function as encrypt', () => {
    assert.equal(encryptKey, encrypt);
  });

  it('decryptKey is the same function as decrypt', () => {
    assert.equal(decryptKey, decrypt);
  });

  it('roundtrips via aliases', () => {
    const plain = 'alias-roundtrip-key';
    const enc = encryptKey(plain);
    assert.equal(decryptKey(enc), plain);
  });
});

describe('Key Manager — rotateKey', () => {
  let km;
  let mockStore;
  let originalFetch;

  beforeEach(() => {
    mockStore = [];
    originalFetch = globalThis.fetch;
    const mockSupabase = {
      loadConfig() { return { url: 'https://test.supabase.co', anonKey: 'test-anon' }; },
      getServiceRoleKey() { return 'test-service-role'; }
    };

    globalThis.fetch = async (url, opts = {}) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (opts.method === 'PATCH' && urlStr.includes('api_keys')) {
        const body = JSON.parse(opts.body || '{}');
        // Parse filters from URL for targeted PATCH
        const idMatch = urlStr.match(/id=eq\.([^&]+)/);
        const nameMatch = urlStr.match(/key_name=eq\.([^&]+)/);
        for (const item of mockStore) {
          if (idMatch && item.id !== decodeURIComponent(idMatch[1])) continue;
          if (nameMatch && item.key_name !== decodeURIComponent(nameMatch[1])) continue;
          Object.assign(item, body);
        }
        return { ok: true, json: async () => [] };
      }
      if (opts.method === 'POST' && urlStr.includes('api_keys')) {
        const body = JSON.parse(opts.body);
        const row = { id: 'key-' + Math.random().toString(36).slice(2), ...body, created_at: new Date().toISOString() };
        mockStore.push(row);
        return { ok: true, json: async () => [row] };
      }
      if (!opts.method || opts.method === 'GET') {
        const idMatch = urlStr.match(/id=eq\.([^&]+)/);
        const nameMatch = urlStr.match(/key_name=eq\.([^&]+)/);
        const activeMatch = urlStr.includes('is_active=eq.true');
        let results = mockStore;
        if (idMatch) results = results.filter(r => r.id === decodeURIComponent(idMatch[1]));
        if (nameMatch) results = results.filter(r => r.key_name === decodeURIComponent(nameMatch[1]));
        if (activeMatch) results = results.filter(r => r.is_active === true);
        return { ok: true, json: async () => results };
      }
      return originalFetch(url, opts);
    };

    km = new KeyManager({ supabase: mockSupabase });
  });

  afterEach(() => { globalThis.fetch = originalFetch; });

  it('creates a new key with same name when rotating', async () => {
    const original = await km.addKey('gemini_api_key', 'old-key', 'admin-1');
    const rotated = await km.rotateKey(original.id, 'new-key', 'admin-1');
    assert.notEqual(rotated.id, original.id);
    assert.equal(rotated.key_name, 'gemini_api_key');
    assert.equal(rotated.key_hint, '****-key');
  });

  it('deactivates old key during rotation', async () => {
    const original = await km.addKey('gemini_api_key', 'old-key', 'admin-1');
    await km.rotateKey(original.id, 'new-key', 'admin-1');
    const oldRow = mockStore.find(r => r.id === original.id);
    assert.equal(oldRow.is_active, false);
  });

  it('throws when rotating a non-existent key', async () => {
    await assert.rejects(
      () => km.rotateKey('nonexistent-id', 'val', 'admin-1'),
      /Key not found/
    );
  });
});

describe('Key Manager — revokeKey (soft delete)', () => {
  let km;
  let mockStore;
  let originalFetch;

  beforeEach(() => {
    mockStore = [];
    originalFetch = globalThis.fetch;
    const mockSupabase = {
      loadConfig() { return { url: 'https://test.supabase.co', anonKey: 'test-anon' }; },
      getServiceRoleKey() { return 'test-service-role'; }
    };

    globalThis.fetch = async (url, opts = {}) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (opts.method === 'PATCH') {
        const body = JSON.parse(opts.body || '{}');
        const idMatch = urlStr.match(/id=eq\.([^&]+)/);
        for (const item of mockStore) {
          if (idMatch && item.id !== decodeURIComponent(idMatch[1])) continue;
          Object.assign(item, body);
        }
        return { ok: true, json: async () => [] };
      }
      if (opts.method === 'POST' && urlStr.includes('api_keys')) {
        const body = JSON.parse(opts.body);
        const row = { id: 'key-' + Math.random().toString(36).slice(2), ...body, created_at: new Date().toISOString() };
        mockStore.push(row);
        return { ok: true, json: async () => [row] };
      }
      if (!opts.method || opts.method === 'GET') {
        const activeMatch = urlStr.includes('is_active=eq.true');
        const nameMatch = urlStr.match(/key_name=eq\.([^&]+)/);
        let results = mockStore;
        if (nameMatch) results = results.filter(r => r.key_name === decodeURIComponent(nameMatch[1]));
        if (activeMatch) results = results.filter(r => r.is_active === true);
        return { ok: true, json: async () => results };
      }
      return originalFetch(url, opts);
    };

    km = new KeyManager({ supabase: mockSupabase });
  });

  afterEach(() => { globalThis.fetch = originalFetch; });

  it('sets is_active to false without deleting the row', async () => {
    const key = await km.addKey('webhook_signing_key', 'whsec-123', 'admin-1');
    await km.revokeKey(key.id);
    const row = mockStore.find(r => r.id === key.id);
    assert.equal(row.is_active, false);
    assert.ok(row, 'Row should still exist (soft delete)');
  });

  it('revoked key is not returned by resolveKey', async () => {
    const key = await km.addKey('gemini_api_key', 'secret', 'admin-1');
    await km.revokeKey(key.id);
    const value = await km.resolveKey('gemini_api_key');
    assert.equal(value, null);
  });
});

describe('Key Manager — testKey', () => {
  let km;
  let mockStore;
  let originalFetch;

  beforeEach(() => {
    mockStore = [];
    originalFetch = globalThis.fetch;
    const mockSupabase = {
      loadConfig() { return { url: 'https://test.supabase.co', anonKey: 'test-anon' }; },
      getServiceRoleKey() { return 'test-service-role'; }
    };

    globalThis.fetch = async (url, opts = {}) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      // Mock Gemini API test endpoint
      if (urlStr.includes('generativelanguage.googleapis.com')) {
        return { ok: true, json: async () => ({ models: [] }) };
      }
      if (opts.method === 'PATCH') {
        const body = JSON.parse(opts.body || '{}');
        for (const item of mockStore) Object.assign(item, body);
        return { ok: true, json: async () => [] };
      }
      if (opts.method === 'POST' && urlStr.includes('api_keys')) {
        const body = JSON.parse(opts.body);
        const row = { id: 'key-' + Math.random().toString(36).slice(2), ...body, created_at: new Date().toISOString() };
        mockStore.push(row);
        return { ok: true, json: async () => [row] };
      }
      if (!opts.method || opts.method === 'GET') {
        const activeMatch = urlStr.includes('is_active=eq.true');
        const nameMatch = urlStr.match(/key_name=eq\.([^&]+)/);
        let results = mockStore;
        if (nameMatch) results = results.filter(r => r.key_name === decodeURIComponent(nameMatch[1]));
        if (activeMatch) results = results.filter(r => r.is_active === true);
        return { ok: true, json: async () => results };
      }
      return originalFetch(url, opts);
    };

    km = new KeyManager({ supabase: mockSupabase });
  });

  afterEach(() => { globalThis.fetch = originalFetch; });

  it('returns valid:true for a gemini key (mocked endpoint)', async () => {
    await km.addKey('gemini_api_key', 'AIzaSyB-test', 'admin-1');
    const result = await km.testKey('gemini_api_key');
    assert.equal(result.valid, true);
  });

  it('returns valid:false for non-existent key', async () => {
    const result = await km.testKey('nonexistent_key');
    assert.equal(result.valid, false);
    assert.ok(result.error);
  });

  it('returns warning for untestable key types', async () => {
    await km.addKey('custom_llm_key', 'custom-val', 'admin-1');
    const result = await km.testKey('custom_llm_key');
    assert.equal(result.valid, true);
    assert.ok(result.warning);
  });
});

describe('Key Manager — admin-only access enforcement', () => {
  it('throws on addKey when service_role key is missing', async () => {
    const noAdmin = {
      loadConfig() { return { url: 'https://test.supabase.co', anonKey: 'anon' }; },
      getServiceRoleKey() { return null; }
    };
    const km = new KeyManager({ supabase: noAdmin });
    await assert.rejects(() => km.addKey('gemini_api_key', 'val', 'user-1'), /Admin config not available/);
  });

  it('throws on listKeys when service_role key is missing', async () => {
    const noAdmin = {
      loadConfig() { return { url: 'https://test.supabase.co', anonKey: 'anon' }; },
      getServiceRoleKey() { return null; }
    };
    const km = new KeyManager({ supabase: noAdmin });
    await assert.rejects(() => km.listKeys(), /Admin config not available/);
  });

  it('throws on rotateKey when service_role key is missing', async () => {
    const noAdmin = {
      loadConfig() { return { url: 'https://test.supabase.co', anonKey: 'anon' }; },
      getServiceRoleKey() { return null; }
    };
    const km = new KeyManager({ supabase: noAdmin });
    await assert.rejects(() => km.rotateKey('some-id', 'val', 'user-1'), /Admin config not available/);
  });

  it('throws on revokeKey when service_role key is missing', async () => {
    const noAdmin = {
      loadConfig() { return { url: 'https://test.supabase.co', anonKey: 'anon' }; },
      getServiceRoleKey() { return null; }
    };
    const km = new KeyManager({ supabase: noAdmin });
    await assert.rejects(() => km.revokeKey('some-id'), /Admin config not available/);
  });

  it('resolveKey returns null when service_role key is missing', async () => {
    const noAdmin = {
      loadConfig() { return { url: 'https://test.supabase.co', anonKey: 'anon' }; },
      getServiceRoleKey() { return null; }
    };
    const km = new KeyManager({ supabase: noAdmin });
    const result = await km.resolveKey('gemini_api_key');
    assert.equal(result, null);
  });

  it('resolveAllKeys returns {} when service_role key is missing', async () => {
    const noAdmin = {
      loadConfig() { return { url: 'https://test.supabase.co', anonKey: 'anon' }; },
      getServiceRoleKey() { return null; }
    };
    const km = new KeyManager({ supabase: noAdmin });
    const result = await km.resolveAllKeys();
    assert.deepEqual(result, {});
  });
});

describe('Key Manager — no disk writes', () => {
  it('key-manager.js does not use fs write operations', async () => {
    const fsPromises = require('fs').promises;
    const source = await fsPromises.readFile(
      require('path').join(__dirname, '..', 'bridge', 'key-manager.js'), 'utf8'
    );
    assert.ok(!source.includes('writeFile'), 'Must not contain writeFile');
    assert.ok(!source.includes('writeFileSync'), 'Must not contain writeFileSync');
    assert.ok(!source.includes('appendFile'), 'Must not contain appendFile');
    assert.ok(!source.includes('mkdirSync'), 'Must not contain mkdirSync');
  });
});

describe('Key Manager — key types', () => {
  it('resolveAllKeys maps all 3 key types to correct env var names', async () => {
    const mockStore = [];
    const originalFetch = globalThis.fetch;
    const mockSupabase = {
      loadConfig() { return { url: 'https://test.supabase.co', anonKey: 'test' }; },
      getServiceRoleKey() { return 'svc'; }
    };

    globalThis.fetch = async (url, opts = {}) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (opts.method === 'PATCH') {
        const body = JSON.parse(opts.body || '{}');
        const nameMatch = urlStr.match(/key_name=eq\.([^&]+)/);
        const scopeMatch = urlStr.match(/scope=eq\.([^&]+)/);
        for (const item of mockStore) {
          if (nameMatch && item.key_name !== decodeURIComponent(nameMatch[1])) continue;
          if (scopeMatch && item.scope !== decodeURIComponent(scopeMatch[1])) continue;
          Object.assign(item, body);
        }
        return { ok: true, json: async () => [] };
      }
      if (opts.method === 'POST' && urlStr.includes('api_keys')) {
        const body = JSON.parse(opts.body);
        const row = { id: 'key-' + Math.random().toString(36).slice(2), ...body, created_at: new Date().toISOString() };
        mockStore.push(row);
        return { ok: true, json: async () => [row] };
      }
      if (!opts.method || opts.method === 'GET') {
        const activeMatch = urlStr.includes('is_active=eq.true');
        let results = mockStore;
        if (activeMatch) results = results.filter(r => r.is_active === true);
        return { ok: true, json: async () => results };
      }
      return originalFetch(url, opts);
    };

    try {
      const km = new KeyManager({ supabase: mockSupabase });
      await km.addKey('gemini_api_key', 'gem-val', 'admin');
      await km.addKey('custom_llm_key', 'llm-val', 'admin');
      await km.addKey('webhook_signing_key', 'whsec-val', 'admin');

      const envMap = await km.resolveAllKeys();
      assert.equal(envMap['GEMINI_API_KEY'], 'gem-val');
      assert.equal(envMap['CUSTOM_LLM_API_KEY'], 'llm-val');
      assert.equal(envMap['WEBHOOK_SIGNING_KEY'], 'whsec-val');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe('Key Manager — Quota Functions', () => {
  it('PLAN_DEFAULTS has all expected plans', () => {
    const { PLAN_DEFAULTS } = require('../bridge/supabase-client');
    assert.ok(PLAN_DEFAULTS.free);
    assert.ok(PLAN_DEFAULTS.starter);
    assert.ok(PLAN_DEFAULTS.professional);
    assert.ok(PLAN_DEFAULTS.enterprise);
  });

  it('free plan has correct defaults', () => {
    const { PLAN_DEFAULTS } = require('../bridge/supabase-client');
    const free = PLAN_DEFAULTS.free;
    assert.equal(free.articles_per_month, 4);
    assert.equal(free.edits_per_day, 5);
    assert.equal(free.max_languages, 1);
    assert.deepEqual(free.allowed_frameworks, ['html']);
    assert.equal(free.api_keys_enabled, false);
  });

  it('enterprise plan has unlimited articles', () => {
    const { PLAN_DEFAULTS } = require('../bridge/supabase-client');
    const ent = PLAN_DEFAULTS.enterprise;
    assert.equal(ent.articles_per_month, -1);
    assert.equal(ent.edits_per_day, -1);
    assert.equal(ent.max_languages, 11);
    assert.equal(ent.api_keys_enabled, true);
  });

  it('professional plan allows all frameworks', () => {
    const { PLAN_DEFAULTS } = require('../bridge/supabase-client');
    const pro = PLAN_DEFAULTS.professional;
    assert.ok(pro.allowed_frameworks.includes('next'));
    assert.ok(pro.allowed_frameworks.includes('vue'));
    assert.ok(pro.allowed_frameworks.includes('svelte'));
    assert.ok(pro.allowed_frameworks.includes('wordpress'));
  });
});
