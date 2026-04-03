/**
 * Auth middleware test suite.
 *
 * Tests authentication enforcement across bridge server endpoints.
 * Uses real HTTP requests against the running server.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, stopServer, baseUrl } = require('./helpers/server');
const { FAKE_JWT, MALFORMED_TOKEN, EMPTY_TOKEN } = require('./helpers/fixtures');

describe('Auth middleware', () => {
  before(async () => { await startServer(); });
  after(async () => { await stopServer(); });

  // ── Health endpoint (no auth) ──

  it('should return 200 on /health without auth', async () => {
    const res = await fetch(`${baseUrl()}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
  });

  it('should return only status and uptime on /health (no internal paths)', async () => {
    const res = await fetch(`${baseUrl()}/health`);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(typeof body.uptime, 'number');
    // Must NOT contain internal info
    assert.equal(body.projectDir, undefined, 'health must not expose projectDir');
    assert.equal(body.authEnabled, undefined, 'health must not expose authEnabled');
    assert.equal(body.busy, undefined, 'health must not expose busy state');
  });

  // ── /auth/verify ──

  it('should return 401 when no Authorization header on /auth/verify', async () => {
    const res = await fetch(`${baseUrl()}/auth/verify`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.match(body.error, /no token/i);
  });

  it('should return 401 for malformed token on /auth/verify', async () => {
    const res = await fetch(`${baseUrl()}/auth/verify`, {
      headers: { 'Authorization': `Bearer ${MALFORMED_TOKEN}` },
    });
    assert.equal(res.status, 401);
  });

  it('should return 401 for fake JWT on /auth/verify', async () => {
    const res = await fetch(`${baseUrl()}/auth/verify`, {
      headers: { 'Authorization': `Bearer ${FAKE_JWT}` },
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.match(body.error, /invalid|expired/i);
  });

  it('should return 401 for Basic auth scheme (not Bearer)', async () => {
    const res = await fetch(`${baseUrl()}/auth/verify`, {
      headers: { 'Authorization': `Basic ${FAKE_JWT}` },
    });
    assert.equal(res.status, 401);
  });

  it('should return 401 for empty Bearer value', async () => {
    const res = await fetch(`${baseUrl()}/auth/verify`, {
      headers: { 'Authorization': 'Bearer ' },
    });
    assert.equal(res.status, 401);
  });

  // ── /apply-edit ──

  it('should return 401 on /apply-edit without auth', async () => {
    const res = await fetch(`${baseUrl()}/apply-edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'test' }),
    });
    assert.equal(res.status, 401);
  });

  it('should return 401 on /apply-edit with invalid token', async () => {
    const res = await fetch(`${baseUrl()}/apply-edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FAKE_JWT}`,
      },
      body: JSON.stringify({ prompt: 'test' }),
    });
    assert.equal(res.status, 401);
  });

  // ── Admin endpoints ──

  it('should return 401 on /admin/users without auth', async () => {
    const res = await fetch(`${baseUrl()}/admin/users`);
    assert.equal(res.status, 401);
  });

  it('should return 401 on /admin/approve without auth', async () => {
    const res = await fetch(`${baseUrl()}/admin/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'test' }),
    });
    assert.equal(res.status, 401);
  });

  it('should return 401 on /admin/delete without auth', async () => {
    const res = await fetch(`${baseUrl()}/admin/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'test' }),
    });
    assert.equal(res.status, 401);
  });

  // ── CORS ──

  it('should respond to OPTIONS with 204 and CORS headers', async () => {
    const res = await fetch(`${baseUrl()}/apply-edit`, { method: 'OPTIONS' });
    assert.equal(res.status, 204);
    assert.ok(res.headers.get('access-control-allow-origin'));
    assert.ok(res.headers.get('access-control-allow-methods'));
  });

  // ── 404 ──

  it('should return 404 for unknown endpoints', async () => {
    const res = await fetch(`${baseUrl()}/unknown-endpoint`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error, 'Not found');
  });
});
