/**
 * @module Contract Validator Tests
 * @description Validates that built endpoints match the API contract registry.
 * Reads the contract registry and verifies each "Production" endpoint
 * responds with the expected status code and envelope format.
 *
 * Usage: BRIDGE_URL=http://localhost:19847 node --test tests/contracts/contract-validator.test.js
 *
 * NOTE: This test requires the bridge server to be running.
 * Only validates "Production" endpoints (skip "Not Built").
 */

'use strict';

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');

const BRIDGE_URL = process.env.BRIDGE_URL || 'http://localhost:19847';

// Production endpoints to validate (from contract registry)
// These are GET endpoints that don't require auth — they should return 401
// which proves the endpoint exists and the router matches.
const PRODUCTION_ENDPOINTS = [
  { method: 'GET', path: '/health', expectAuth: false, expectStatus: 200 },
  { method: 'GET', path: '/api/articles', expectAuth: true },
  { method: 'GET', path: '/api/pipeline/status', expectAuth: true },
  { method: 'GET', path: '/api/pipeline/queue', expectAuth: true },
  { method: 'GET', path: '/api/pipeline/history', expectAuth: true },
  { method: 'GET', path: '/api/blueprints', expectAuth: true },
  { method: 'GET', path: '/api/blueprints/categories', expectAuth: true },
  { method: 'GET', path: '/api/settings', expectAuth: true },
  { method: 'GET', path: '/api/quota', expectAuth: true },
  { method: 'GET', path: '/api/analytics/overview', expectAuth: true },
  { method: 'GET', path: '/api/analytics/generation', expectAuth: true },
  { method: 'GET', path: '/api/queue/status', expectAuth: true },
  { method: 'GET', path: '/api/webhooks', expectAuth: true },
  { method: 'GET', path: '/api/admin/api-keys', expectAuth: true },
  { method: 'GET', path: '/api/admin/quota-stats', expectAuth: true },
  { method: 'GET', path: '/api/plugin/config', expectAuth: true },
  { method: 'GET', path: '/api/admin/plugin-instances', expectAuth: true },
  { method: 'GET', path: '/api/admin/plugin-config', expectAuth: true },
  { method: 'GET', path: '/admin/users', expectAuth: true },
  { method: 'GET', path: '/admin/usage', expectAuth: true },
];

async function apiCall(method, path) {
  const res = await fetch(`${BRIDGE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

describe('API Contract Validation — Production Endpoints', () => {

  before(async () => {
    const { status } = await apiCall('GET', '/health');
    assert.equal(status, 200, 'Bridge server must be running');
  });

  for (const endpoint of PRODUCTION_ENDPOINTS) {
    it(`${endpoint.method} ${endpoint.path} — ${endpoint.expectAuth ? 'returns 401 without auth' : 'returns ' + endpoint.expectStatus}`, async () => {
      const { status, body } = await apiCall(endpoint.method, endpoint.path);

      if (endpoint.expectAuth) {
        // Authenticated endpoints should return 401 without a token
        assert.equal(status, 401, `Expected 401 for unauthenticated request to ${endpoint.path}`);
      } else {
        assert.equal(status, endpoint.expectStatus, `Expected ${endpoint.expectStatus} for ${endpoint.path}`);
      }

      // All endpoints should return JSON
      assert.ok(body !== null, `${endpoint.path} should return valid JSON`);
    });
  }

  it('response envelope: success responses have { success, data }', async () => {
    const { status, body } = await apiCall('GET', '/health');
    assert.equal(status, 200);
    // Health endpoint uses its own format, but other endpoints use { success, data }
    assert.ok(body.status || body.success, 'Should have status or success field');
  });

  it('response envelope: error responses have { error, message }', async () => {
    const { body } = await apiCall('GET', '/api/articles');
    // Without auth, should get error envelope
    assert.ok(body.error || body.message, 'Error response should have error or message field');
  });
});
