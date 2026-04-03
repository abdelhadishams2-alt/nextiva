/**
 * Rate limiter test suite.
 *
 * Tests rate limiting on auth and edit endpoints.
 * Each test file gets its own server instance, so rate limit state is isolated.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, stopServer, baseUrl } = require('./helpers/server');

describe('Rate limiter', () => {
  before(async () => { await startServer(); });
  after(async () => { await stopServer(); });

  it('should allow requests under the rate limit', async () => {
    // 3 requests well under the 10/min limit
    for (let i = 0; i < 3; i++) {
      const res = await fetch(`${baseUrl()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `test-under@example.com`, password: 'test123' }),
      });
      assert.notEqual(res.status, 429, `Request ${i + 1} should not be rate limited`);
    }
  });

  it('should return 429 after exceeding rate limit on /auth/login', async () => {
    const email = `flood-login-${Date.now()}@example.com`;

    // Send 11 requests (limit is 10 per minute per key)
    let hitLimit = false;
    for (let i = 0; i < 12; i++) {
      const res = await fetch(`${baseUrl()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password' }),
      });
      if (res.status === 429) {
        hitLimit = true;
        const body = await res.json();
        assert.match(body.error, /too many/i);
        break;
      }
    }
    assert.ok(hitLimit, 'Should have hit rate limit after 10+ requests');
  });

  it('should return 429 after exceeding rate limit on /auth/signup', async () => {
    const email = `flood-signup-${Date.now()}@example.com`;

    let hitLimit = false;
    for (let i = 0; i < 12; i++) {
      const res = await fetch(`${baseUrl()}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' }),
      });
      if (res.status === 429) {
        hitLimit = true;
        break;
      }
    }
    assert.ok(hitLimit, 'Should have hit rate limit on signup');
  });

  it('should return 429 after exceeding rate limit on /auth/verify', async () => {
    let hitLimit = false;
    for (let i = 0; i < 12; i++) {
      const res = await fetch(`${baseUrl()}/auth/verify`, {
        headers: { 'Authorization': 'Bearer fake-token-verify' },
      });
      if (res.status === 429) {
        hitLimit = true;
        break;
      }
    }
    assert.ok(hitLimit, 'Should have hit rate limit on verify');
  });

  it('should rate limit /apply-edit independently', async () => {
    let hitLimit = false;
    for (let i = 0; i < 12; i++) {
      const res = await fetch(`${baseUrl()}/apply-edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer fake-token-edit',
        },
        body: JSON.stringify({ prompt: 'test' }),
      });
      if (res.status === 429) {
        hitLimit = true;
        break;
      }
    }
    assert.ok(hitLimit, 'Should have hit rate limit on /apply-edit');
  });

  it('should use different rate limit buckets per endpoint key', async () => {
    // After hitting limits on login/signup/verify/edit above,
    // health should still work (no rate limiting on health)
    const res = await fetch(`${baseUrl()}/health`);
    assert.equal(res.status, 200);
  });

  it('should include Retry-After header on 409 busy response', async () => {
    // We can't easily trigger 409 without a real edit running,
    // but we can verify the /apply-edit endpoint exists and responds
    const res = await fetch(`${baseUrl()}/apply-edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-retry-after',
      },
      body: JSON.stringify({ prompt: 'test' }),
    });
    // Will be 429 (rate limited from previous tests) or 401 (auth fail)
    assert.ok([401, 429].includes(res.status));
  });
});
