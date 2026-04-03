/**
 * @module Smoke Tests
 * @description Quick verification that critical endpoints respond correctly.
 * Run after every deployment to confirm the bridge server is operational.
 *
 * Usage: BRIDGE_URL=http://localhost:19847 node --test tests/smoke/smoke.test.js
 */

'use strict';

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');

const BRIDGE_URL = process.env.BRIDGE_URL || 'http://localhost:19847';

async function api(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BRIDGE_URL}${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

describe('Smoke Tests', () => {

  it('GET /health returns 200 with status ok', async () => {
    const { status, data } = await api('GET', '/health');
    assert.equal(status, 200);
    assert.equal(data.status, 'ok');
    assert.ok(data.uptime >= 0);
    assert.ok(data.version);
  });

  it('POST /auth/login with invalid credentials returns 400', async () => {
    const { status } = await api('POST', '/auth/login', {
      body: { email: 'nonexistent@test.com', password: 'wrong' }
    });
    assert.ok([400, 401].includes(status), `Expected 400 or 401, got ${status}`);
  });

  it('GET /api/articles without auth returns 401', async () => {
    const { status } = await api('GET', '/api/articles');
    assert.equal(status, 401);
  });

  it('GET /api/pipeline/status without auth returns 401', async () => {
    const { status } = await api('GET', '/api/pipeline/status');
    assert.equal(status, 401);
  });

  it('GET /api/analytics/overview without auth returns 401', async () => {
    const { status } = await api('GET', '/api/analytics/overview');
    assert.equal(status, 401);
  });

  it('OPTIONS request returns CORS headers', async () => {
    const res = await fetch(`${BRIDGE_URL}/api/articles`, { method: 'OPTIONS' });
    assert.ok(res.headers.get('access-control-allow-origin'));
  });

  it('Unknown route returns 404', async () => {
    const { status } = await api('GET', '/api/nonexistent-endpoint');
    assert.ok([404, 401].includes(status), `Expected 404 or 401, got ${status}`);
  });
});
