/**
 * Test fixtures for ChainIQ bridge server tests.
 */

// A fake but structurally valid JWT (will fail Supabase verification — that's the point)
const FAKE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QiLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

// Clearly invalid tokens
const MALFORMED_TOKEN = 'not-a-jwt-at-all';
const EMPTY_TOKEN = '';

// Test user objects
const TEST_USER = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  email: 'test@example.com',
};

const TEST_ADMIN = {
  id: 'f9e8d7c6-b5a4-3210-fedc-ba9876543210',
  email: 'admin@example.com',
};

// Path traversal attack vectors
const PATH_TRAVERSAL_ATTACKS = [
  { path: '../../../etc/passwd', desc: 'basic directory traversal' },
  { path: '..\\..\\..\\windows\\system32', desc: 'windows backslash traversal' },
  { path: '/etc/passwd', desc: 'absolute unix path' },
  { path: 'C:\\Windows\\System32\\config', desc: 'absolute windows path' },
  { path: 'test.txt', desc: 'non-html extension' },
  { path: '', desc: 'empty path' },
  { path: 'valid/../../../etc/passwd', desc: 'traversal after valid prefix' },
  { path: '....//....//etc/passwd', desc: 'double-dot slash bypass' },
];

// Valid edit prompt template
function makeEditPrompt(articleFile, sectionId, change) {
  return `SECTION_EDIT:
Article file: ${articleFile}
Section ID: ${sectionId}
User requested change: ${change}`;
}

module.exports = {
  FAKE_JWT,
  MALFORMED_TOKEN,
  EMPTY_TOKEN,
  TEST_USER,
  TEST_ADMIN,
  PATH_TRAVERSAL_ATTACKS,
  makeEditPrompt,
};
