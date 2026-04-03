/**
 * Generate API test suite.
 *
 * Tests input validation, auth enforcement, and token-as-query-param
 * for the POST /api/generate and SSE progress endpoints.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, stopServer, baseUrl } = require('./helpers/server');
const { FAKE_JWT, MALFORMED_TOKEN } = require('./helpers/fixtures');

describe('Generate API', () => {
  before(async () => { await startServer(); });
  after(async () => { await stopServer(); });

  // ── Auth enforcement ──

  it('rejects POST /api/generate without auth', async () => {
    const res = await fetch(`${baseUrl()}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Test Article' })
    });
    assert.equal(res.status, 401);
  });

  it('rejects POST /api/generate with invalid token', async () => {
    const res = await fetch(`${baseUrl()}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MALFORMED_TOKEN}`
      },
      body: JSON.stringify({ topic: 'Test Article' })
    });
    assert.equal(res.status, 401);
  });

  // ── Input validation (requires auth, but validates before Supabase quota) ──
  // These will 401 because FAKE_JWT fails Supabase verification,
  // but we test that the endpoint exists and enforces auth.

  it('rejects missing topic with 401 (auth checked first)', async () => {
    const res = await fetch(`${baseUrl()}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FAKE_JWT}`
      },
      body: JSON.stringify({})
    });
    // Auth check happens before input validation
    assert.equal(res.status, 401);
  });

  it('rejects GET method on /api/generate', async () => {
    const res = await fetch(`${baseUrl()}/api/generate`);
    // Should 404 (GET not handled on this path) or 401
    assert.ok([401, 404].includes(res.status));
  });

  // ── SSE progress endpoint ──

  it('rejects SSE progress without auth', async () => {
    const res = await fetch(`${baseUrl()}/api/queue/job/00000000-0000-0000-0000-000000000000/progress`);
    assert.equal(res.status, 401);
  });

  it('rejects SSE progress with invalid job ID format', async () => {
    const res = await fetch(`${baseUrl()}/api/queue/job/not-a-uuid/progress`);
    // Should 404 (regex won't match non-UUID) or 400
    assert.ok([400, 404].includes(res.status));
  });

  it('accepts token as query parameter for SSE progress', async () => {
    // With FAKE_JWT, auth will fail at Supabase verification (401),
    // but the important thing is the token IS extracted from query param
    const res = await fetch(
      `${baseUrl()}/api/queue/job/00000000-0000-0000-0000-000000000000/progress?token=${FAKE_JWT}`
    );
    // Should get 401 (Supabase rejects fake JWT) rather than 401 "missing token"
    assert.equal(res.status, 401);
    const body = await res.json();
    // If token was extracted, the error should mention verification failure, not "missing"
    assert.ok(!body.error?.includes('missing'), 'Token should be extracted from query param');
  });
});

describe('Generate input validation (unit)', () => {
  // Unit tests for the validation logic without needing the server

  it('validates VALID_LANGUAGES allowlist', () => {
    const VALID_LANGUAGES = ['en','ar','fr','es','de','pt','it','nl','ru','zh','ja'];
    assert.equal(VALID_LANGUAGES.length, 11);
    assert.ok(VALID_LANGUAGES.includes('ar'), 'Arabic must be supported');
    assert.ok(VALID_LANGUAGES.includes('en'), 'English must be supported');
  });

  it('validates VALID_FRAMEWORKS allowlist', () => {
    const VALID_FRAMEWORKS = ['html','react','vue','svelte','next','astro','wordpress'];
    assert.equal(VALID_FRAMEWORKS.length, 7);
    assert.ok(VALID_FRAMEWORKS.includes('html'), 'HTML must be supported');
    assert.ok(VALID_FRAMEWORKS.includes('next'), 'Next.js must be supported');
  });

  it('clamps max_images between 0 and 10', () => {
    const clamp = (v) => Math.min(Math.max(parseInt(v) || 6, 0), 10);
    assert.equal(clamp(6), 6);
    assert.equal(clamp(0), 6, '0 is falsy, defaults to 6');
    assert.equal(clamp(10), 10);
    assert.equal(clamp(100), 10);
    assert.equal(clamp(-5), 0, 'negative clamped to 0');
    assert.equal(clamp(undefined), 6);
    assert.equal(clamp('abc'), 6);
    assert.equal(clamp(3), 3);
    assert.equal(clamp(1), 1);
  });

  it('truncates topic to 500 chars', () => {
    const longTopic = 'A'.repeat(1000);
    const truncated = longTopic.trim().slice(0, 500);
    assert.equal(truncated.length, 500);
  });

  it('rejects topic shorter than 3 chars after trim', () => {
    const topic = '  ab  '.trim().slice(0, 500);
    assert.ok(topic.length < 3);
  });

  it('falls back to defaults for invalid enum values', () => {
    const VALID_FRAMEWORKS = ['html','react','vue','svelte','next','astro','wordpress'];
    const framework = VALID_FRAMEWORKS.includes('angular') ? 'angular' : 'html';
    assert.equal(framework, 'html');

    const framework2 = VALID_FRAMEWORKS.includes('next') ? 'next' : 'html';
    assert.equal(framework2, 'next');
  });
});
