/**
 * Path traversal prevention tests.
 *
 * Tests the path validation logic in the /apply-edit endpoint.
 * Since /apply-edit requires auth (which needs real Supabase),
 * we test validation both via HTTP (expecting 401 before path checks)
 * and by unit-testing the validation rules directly.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { startServer, stopServer, baseUrl } = require('./helpers/server');
const { FAKE_JWT, makeEditPrompt } = require('./helpers/fixtures');

// Unit-testable path validation logic (mirrors server.js checks)
function validateArticlePath(articleFile, projectDir) {
  const errors = [];

  if (!articleFile || articleFile.trim() === '') {
    errors.push('empty path');
    return errors;
  }

  if (articleFile.includes('..')) {
    errors.push('path traversal');
  }

  if (path.isAbsolute(articleFile)) {
    errors.push('absolute path');
  }

  if (!articleFile.endsWith('.html')) {
    errors.push('non-html extension');
  }

  if (errors.length === 0) {
    const resolvedPath = path.resolve(projectDir, articleFile);
    if (!resolvedPath.startsWith(path.resolve(projectDir))) {
      errors.push('outside project boundary');
    }
  }

  return errors;
}

describe('Path validation logic (unit)', () => {
  const PROJECT_DIR = '/test/project';

  it('should accept a valid relative .html path', () => {
    const errors = validateArticlePath('articles/my-article.html', PROJECT_DIR);
    assert.equal(errors.length, 0);
  });

  it('should accept a simple filename.html', () => {
    const errors = validateArticlePath('test.html', PROJECT_DIR);
    assert.equal(errors.length, 0);
  });

  it('should reject path with ".." traversal', () => {
    const errors = validateArticlePath('../../../etc/passwd.html', PROJECT_DIR);
    assert.ok(errors.includes('path traversal'));
  });

  it('should reject path with embedded ".." traversal', () => {
    const errors = validateArticlePath('valid/../../../etc/passwd.html', PROJECT_DIR);
    assert.ok(errors.includes('path traversal'));
  });

  it('should reject absolute Unix path', () => {
    const errors = validateArticlePath('/etc/passwd.html', PROJECT_DIR);
    assert.ok(errors.includes('absolute path'));
  });

  it('should reject absolute Windows path', () => {
    const errors = validateArticlePath('C:\\Windows\\System32\\file.html', PROJECT_DIR);
    // On Windows this is absolute; on Unix it's not but has backslash
    // Either way it should fail some check
    assert.ok(errors.length > 0);
  });

  it('should reject non-.html extension', () => {
    const errors = validateArticlePath('script.js', PROJECT_DIR);
    assert.ok(errors.includes('non-html extension'));
  });

  it('should reject .txt extension', () => {
    const errors = validateArticlePath('readme.txt', PROJECT_DIR);
    assert.ok(errors.includes('non-html extension'));
  });

  it('should reject empty path', () => {
    const errors = validateArticlePath('', PROJECT_DIR);
    assert.ok(errors.includes('empty path'));
  });

  it('should reject null path', () => {
    const errors = validateArticlePath(null, PROJECT_DIR);
    assert.ok(errors.includes('empty path'));
  });

  it('should reject path that is only whitespace', () => {
    const errors = validateArticlePath('   ', PROJECT_DIR);
    assert.ok(errors.includes('empty path'));
  });

  it('should reject path ending in .html but with traversal', () => {
    const errors = validateArticlePath('../../malicious.html', PROJECT_DIR);
    assert.ok(errors.includes('path traversal'));
  });
});

describe('Path traversal via HTTP /apply-edit', () => {
  before(async () => { await startServer(); });
  after(async () => { await stopServer(); });

  it('should require auth before path validation (returns 401 for all)', async () => {
    const attacks = [
      makeEditPrompt('../../../etc/passwd', 'sec-1', 'hack'),
      makeEditPrompt('/etc/shadow', 'sec-1', 'hack'),
      makeEditPrompt('script.js', 'sec-1', 'hack'),
    ];

    for (const prompt of attacks) {
      const res = await fetch(`${baseUrl()}/apply-edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FAKE_JWT}`,
        },
        body: JSON.stringify({ prompt }),
      });
      // Auth fails first (401), which is correct — path validation is defense-in-depth
      assert.equal(res.status, 401, 'Expected 401 for invalid token');
    }
  });

  it('should reject requests with no auth header', async () => {
    const res = await fetch(`${baseUrl()}/apply-edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: makeEditPrompt('test.html', 'sec-1', 'test') }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.status, 'error');
  });
});
