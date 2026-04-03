/**
 * @module {{ModuleName}} Integration Tests
 * @description Integration tests that hit the real bridge server endpoints
 * @see dev_docs/specs/contracts/screen-api-contract-registry.md
 *
 * Copy this template when testing endpoint behavior end-to-end.
 * Place at: test/integration/{{module-name}}.integration.test.js
 * Run with: node --test test/integration/{{module-name}}.integration.test.js
 *
 * IMPORTANT: These tests require the bridge server to be running on BRIDGE_PORT.
 * Start it with: npm run bridge (or node bridge/server.js)
 */

'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

// ── Config ──────────────────────────────────────────────────────────────────

const BRIDGE_URL = process.env.BRIDGE_URL || 'http://localhost:19847';
const TEST_TOKEN = process.env.TEST_AUTH_TOKEN; // Pre-authenticated JWT for test user

// ── Helpers ─────────────────────────────────────────────────────────────────

async function apiCall(method, path, { body, token = TEST_TOKEN } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BRIDGE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);
  return { status: response.status, data, headers: response.headers };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('{{ModuleName}} API Integration', () => {

  before(async () => {
    // Verify server is running
    const { status } = await apiCall('GET', '/health', { token: null });
    assert.equal(status, 200, 'Bridge server must be running for integration tests');
  });

  describe('GET {{PATH}}', () => {
    it('should return 401 without auth token', async () => {
      const { status } = await apiCall('GET', '{{PATH}}', { token: null });
      assert.equal(status, 401);
    });

    it('should return 200 with valid data', async () => {
      const { status, data } = await apiCall('GET', '{{PATH}}');
      assert.equal(status, 200);
      assert.equal(data.success, true);
      assert.ok(data.data);
    });

    it('should support pagination', async () => {
      const { status, data } = await apiCall('GET', '{{PATH}}?page=1&limit=5');
      assert.equal(status, 200);
      assert.ok(data.meta);
      assert.ok(data.meta.total >= 0);
      assert.equal(data.meta.page, 1);
      assert.equal(data.meta.limit, 5);
    });
  });

  describe('POST {{PATH}}', () => {
    it('should return 401 without auth token', async () => {
      const { status } = await apiCall('POST', '{{PATH}}', {
        body: { /* valid payload */ },
        token: null,
      });
      assert.equal(status, 401);
    });

    it('should create resource with valid payload', async () => {
      const { status, data } = await apiCall('POST', '{{PATH}}', {
        body: { /* valid payload */ },
      });
      assert.equal(status, 200);
      assert.equal(data.success, true);
      assert.ok(data.data.id);
    });

    it('should return 400 for invalid payload', async () => {
      const { status } = await apiCall('POST', '{{PATH}}', {
        body: { /* invalid payload — missing required fields */ },
      });
      assert.equal(status, 400);
    });
  });

  describe('response envelope', () => {
    it('should follow standard success envelope', async () => {
      const { data } = await apiCall('GET', '{{PATH}}');
      assert.ok('success' in data, 'Response must have "success" field');
      assert.ok('data' in data, 'Response must have "data" field');
    });

    it('should follow standard error envelope', async () => {
      const { data } = await apiCall('GET', '{{PATH}}', { token: 'invalid' });
      assert.ok('error' in data, 'Error response must have "error" field');
    });
  });
});
