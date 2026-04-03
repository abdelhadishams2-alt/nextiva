'use strict';

module.exports = [
  { method: 'GET', pattern: /^\/health$/, handle: () => ({ body: { status: 'ok', uptime: 86400, version: '4.6.8', queue: { active: 0, queued: 0 } } }) },
  { method: 'POST', pattern: /^\/auth\/signup$/, handle: () => ({ status: 201, body: { success: true, message: 'Account created, awaiting approval' } }) },
  { method: 'POST', pattern: /^\/auth\/login$/, handle: ({ fixtures }) => ({ body: { success: true, data: { access_token: 'mock-jwt-token-' + Date.now(), user: fixtures.users[0] } } }) },
  { method: 'GET', pattern: /^\/auth\/verify$/, handle: ({ fixtures }) => ({ body: { success: true, data: { user: fixtures.users[0] } } }) },
  { method: 'POST', pattern: /^\/apply-edit$/, handle: () => ({
    sse: true,
    events: [
      { stage: 'queued', progress: 0, message: 'Edit queued' },
      { stage: 'reading', progress: 0.2, message: 'Reading section content' },
      { stage: 'processing', progress: 0.5, message: 'Claude is rewriting the section' },
      { stage: 'writing', progress: 0.8, message: 'Writing updated content' },
      { stage: 'complete', progress: 1.0, result: { version: 3, word_count: 450 } },
    ]
  })},
  { method: 'GET', pattern: /^\/admin\/users$/, handle: ({ fixtures }) => ({ body: { success: true, data: fixtures.users } }) },
  { method: 'POST', pattern: /^\/admin\/approve$/, handle: () => ({ body: { success: true } }) },
  { method: 'POST', pattern: /^\/admin\/revoke$/, handle: () => ({ body: { success: true } }) },
  { method: 'POST', pattern: /^\/admin\/delete$/, handle: () => ({ body: { success: true } }) },
  { method: 'POST', pattern: /^\/admin\/add-user$/, handle: () => ({ status: 201, body: { success: true, data: { id: crypto.randomUUID(), email: 'new@user.com' } } }) },
  { method: 'GET', pattern: /^\/admin\/usage$/, handle: () => ({ body: { success: true, data: [] } }) },
];
