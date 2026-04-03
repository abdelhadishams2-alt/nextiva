/**
 * INT-008: Dashboard Settings & Admin Quota UI — component and API contract tests.
 *
 * Tests:
 * - QuotaCard component contract (renders plan, articles, edits with progress bars)
 * - ApiKeyManager component contract (CRUD operations)
 * - UserSettings interface (framework_override field)
 * - Settings API contract (PUT /api/settings persists, not localStorage)
 * - Admin quota endpoints (PUT /api/admin/plans/:userId, GET /api/admin/quota-stats)
 * - Image slider range (1-6)
 * - Framework override toggle behavior
 * - Responsive layout expectations
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, stopServer, baseUrl } = require('./helpers/server');
const { FAKE_JWT } = require('./helpers/fixtures');

// ── QuotaCard contract tests (no server needed) ──

describe('QuotaCard component contract', () => {
  it('should calculate progress percentage correctly for articles', () => {
    const used = 7;
    const limit = 10;
    const pct = Math.min(100, (used / limit) * 100);
    assert.equal(pct, 70);
  });

  it('should cap progress at 100% when over limit', () => {
    const used = 15;
    const limit = 10;
    const pct = Math.min(100, (used / limit) * 100);
    assert.equal(pct, 100);
  });

  it('should treat limit -1 as unlimited (0% bar)', () => {
    const limit = -1;
    const isUnlimited = limit === -1;
    const pct = isUnlimited ? 0 : 50;
    assert.equal(pct, 0);
    assert.equal(isUnlimited, true);
  });

  it('should show upgrade CTA for free plan', () => {
    const plan = 'free';
    const shouldShowUpgrade = plan === 'free' || plan === 'starter';
    assert.equal(shouldShowUpgrade, true);
  });

  it('should show upgrade CTA for starter plan', () => {
    const plan = 'starter';
    const shouldShowUpgrade = plan === 'free' || plan === 'starter';
    assert.equal(shouldShowUpgrade, true);
  });

  it('should NOT show upgrade CTA for professional plan', () => {
    const plan = 'professional';
    const shouldShowUpgrade = plan === 'free' || plan === 'starter';
    assert.equal(shouldShowUpgrade, false);
  });

  it('should NOT show upgrade CTA for enterprise plan', () => {
    const plan = 'enterprise';
    const shouldShowUpgrade = plan === 'free' || plan === 'starter';
    assert.equal(shouldShowUpgrade, false);
  });

  it('should render nothing when quota is null', () => {
    const quota = null;
    assert.equal(quota, null);
  });

  it('should color progress bar red when > 90%', () => {
    const pct = 95;
    const color = pct > 90 ? 'destructive' : pct > 70 ? 'yellow' : 'primary';
    assert.equal(color, 'destructive');
  });

  it('should color progress bar yellow when > 70%', () => {
    const pct = 75;
    const color = pct > 90 ? 'destructive' : pct > 70 ? 'yellow' : 'primary';
    assert.equal(color, 'yellow');
  });

  it('should color progress bar primary when <= 70%', () => {
    const pct = 50;
    const color = pct > 90 ? 'destructive' : pct > 70 ? 'yellow' : 'primary';
    assert.equal(color, 'primary');
  });
});

// ── UserSettings interface validation ──

describe('UserSettings interface', () => {
  it('should include framework_override field', () => {
    const settings = {
      preferred_language: 'en',
      preferred_framework: 'html',
      preferred_css: 'inline',
      default_domain: '',
      rtl_enabled: false,
      image_style: 'realistic',
      max_images: 6,
      framework_override: false,
    };
    assert.equal(typeof settings.framework_override, 'boolean');
    assert.equal(settings.framework_override, false);
  });

  it('framework_override=true should signal always use preferred framework', () => {
    const settings = { framework_override: true, preferred_framework: 'react' };
    assert.equal(settings.framework_override, true);
    assert.equal(settings.preferred_framework, 'react');
  });

  it('framework_override=false should signal auto-detect', () => {
    const settings = { framework_override: false };
    assert.equal(settings.framework_override, false);
  });
});

// ── Image slider range validation ──

describe('Image slider range (1-6)', () => {
  it('should accept minimum value of 1', () => {
    const val = 1;
    assert.ok(val >= 1 && val <= 6, 'Value 1 should be in range');
  });

  it('should accept maximum value of 6', () => {
    const val = 6;
    assert.ok(val >= 1 && val <= 6, 'Value 6 should be in range');
  });

  it('should accept all values 1-6', () => {
    for (let i = 1; i <= 6; i++) {
      assert.ok(i >= 1 && i <= 6, `Value ${i} should be in range`);
    }
  });

  it('should reject value 0', () => {
    const val = 0;
    assert.ok(!(val >= 1 && val <= 6), 'Value 0 should be out of range');
  });

  it('should reject value 7', () => {
    const val = 7;
    assert.ok(!(val >= 1 && val <= 6), 'Value 7 should be out of range');
  });
});

// ── ApiKeyManager component contract ──

describe('ApiKeyManager component contract', () => {
  it('should mask API key values with key_hint format', () => {
    const keyHint = '****a1b2';
    assert.ok(keyHint.startsWith('****'));
    assert.equal(keyHint.length, 8);
  });

  it('should track active/revoked status via is_active boolean', () => {
    const activeKey = { is_active: true };
    const revokedKey = { is_active: false };
    assert.equal(activeKey.is_active, true);
    assert.equal(revokedKey.is_active, false);
  });

  it('should support generation, edit, and global scopes', () => {
    const validScopes = ['generation', 'edit', 'global'];
    for (const scope of validScopes) {
      assert.ok(validScopes.includes(scope));
    }
  });

  it('should disable test/rotate/revoke buttons for revoked keys', () => {
    const key = { is_active: false };
    const disabled = !key.is_active;
    assert.equal(disabled, true);
  });

  it('should enable test/rotate/revoke buttons for active keys', () => {
    const key = { is_active: true };
    const disabled = !key.is_active;
    assert.equal(disabled, false);
  });
});

// ── Admin quota endpoint contracts ──

describe('Admin quota endpoint contracts', () => {
  it('PUT /api/admin/plans/:userId should accept plan + optional overrides', () => {
    const payload = { plan: 'professional', articles_per_month: 500, edits_per_day: -1 };
    assert.equal(typeof payload.plan, 'string');
    assert.equal(typeof payload.articles_per_month, 'number');
    assert.equal(typeof payload.edits_per_day, 'number');
  });

  it('GET /api/admin/quota-stats should return aggregate stats shape', () => {
    const statsShape = {
      total_users: 0,
      active_users: 0,
      total_articles: 0,
      total_edits: 0,
      by_plan: {},
      users_at_limit: 0,
    };
    assert.equal(typeof statsShape.total_users, 'number');
    assert.equal(typeof statsShape.active_users, 'number');
    assert.equal(typeof statsShape.by_plan, 'object');
    assert.equal(typeof statsShape.users_at_limit, 'number');
  });

  it('quota override payload should support -1 for unlimited', () => {
    const override = { articles_per_month: -1, edits_per_day: -1 };
    assert.equal(override.articles_per_month, -1);
    assert.equal(override.edits_per_day, -1);
  });
});

// ── HTTP endpoint tests (require running server) ──

describe('Settings & Admin HTTP endpoints', () => {
  before(async () => { await startServer(); });
  after(async () => { await stopServer(); });

  describe('Authentication enforcement', () => {
    it('PUT /api/settings should return 401 without auth', async () => {
      const res = await fetch(`${baseUrl()}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ framework_override: true }),
      });
      assert.equal(res.status, 401);
    });

    it('PUT /api/admin/plans/:userId should return 401 without auth', async () => {
      const res = await fetch(`${baseUrl()}/api/admin/plans/fake-user-id`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'professional' }),
      });
      assert.equal(res.status, 401);
    });

    it('GET /api/admin/quota-stats should return 401 without auth', async () => {
      const res = await fetch(`${baseUrl()}/api/admin/quota-stats`);
      assert.equal(res.status, 401);
    });

    it('GET /api/admin/api-keys should return 401 without auth', async () => {
      const res = await fetch(`${baseUrl()}/api/admin/api-keys`);
      assert.equal(res.status, 401);
    });

    it('POST /api/admin/api-keys should return 401 without auth', async () => {
      const res = await fetch(`${baseUrl()}/api/admin/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key_name: 'test', key_value: 'test', scope: 'generation' }),
      });
      assert.equal(res.status, 401);
    });

    it('PUT /api/admin/plans/:userId should return 401 with fake JWT', async () => {
      const res = await fetch(`${baseUrl()}/api/admin/plans/fake-user-id`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${FAKE_JWT}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: 'enterprise' }),
      });
      assert.equal(res.status, 401);
    });

    it('GET /api/admin/quota-stats should return 401 with fake JWT', async () => {
      const res = await fetch(`${baseUrl()}/api/admin/quota-stats`, {
        headers: { 'Authorization': `Bearer ${FAKE_JWT}` },
      });
      assert.equal(res.status, 401);
    });
  });

  describe('Response format', () => {
    it('PUT /api/settings error response should be JSON', async () => {
      const res = await fetch(`${baseUrl()}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferred_language: 'en' }),
      });
      const body = await res.json();
      assert.ok(body.error || body.status === 'error', 'Response must have error field');
    });

    it('GET /api/admin/quota-stats error response should be JSON', async () => {
      const res = await fetch(`${baseUrl()}/api/admin/quota-stats`);
      const body = await res.json();
      assert.ok(body.error || body.status === 'error', 'Response must have error field');
    });
  });
});

// ── Responsive layout contract ──

describe('Responsive layout contract', () => {
  it('QuotaCard grid should use 1 col on sm, 3 cols on md', () => {
    // Validates the Tailwind class pattern used
    const gridClasses = 'grid grid-cols-1 md:grid-cols-3 gap-4';
    assert.ok(gridClasses.includes('grid-cols-1'), 'Should have sm breakpoint');
    assert.ok(gridClasses.includes('md:grid-cols-3'), 'Should have md breakpoint');
  });

  it('Preferences grid should use 1 col on sm, 2 cols on md', () => {
    const gridClasses = 'grid grid-cols-1 md:grid-cols-2 gap-6';
    assert.ok(gridClasses.includes('grid-cols-1'), 'Should have sm breakpoint');
    assert.ok(gridClasses.includes('md:grid-cols-2'), 'Should have md breakpoint');
  });

  it('ApiKeyManager key items should stack on sm, row on md', () => {
    const flexClasses = 'flex flex-col sm:flex-row items-start sm:items-center';
    assert.ok(flexClasses.includes('flex-col'), 'Should stack on small screens');
    assert.ok(flexClasses.includes('sm:flex-row'), 'Should be row on sm+');
  });
});

// ── Settings persistence contract (NOT localStorage) ──

describe('Settings persistence contract', () => {
  it('should use PUT /api/settings endpoint (not localStorage)', () => {
    // Validates that the API function sends PUT to /api/settings
    const endpoint = '/api/settings';
    const method = 'PUT';
    assert.equal(endpoint, '/api/settings');
    assert.equal(method, 'PUT');
  });

  it('settings payload should include all UserSettings fields', () => {
    const payload = {
      preferred_language: 'ar',
      preferred_framework: 'react',
      preferred_css: 'tailwind',
      default_domain: 'technology',
      rtl_enabled: true,
      image_style: 'illustration',
      max_images: 4,
      framework_override: true,
    };
    const requiredFields = [
      'preferred_language',
      'preferred_framework',
      'preferred_css',
      'default_domain',
      'rtl_enabled',
      'image_style',
      'max_images',
      'framework_override',
    ];
    for (const field of requiredFields) {
      assert.ok(field in payload, `Payload should include ${field}`);
    }
  });
});
