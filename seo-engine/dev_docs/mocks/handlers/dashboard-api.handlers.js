'use strict';

module.exports = [
  // Articles
  { method: 'GET', pattern: /^\/api\/articles$/, handle: ({ query, fixtures }) => {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    const start = (page - 1) * limit;
    const data = fixtures.articles.slice(start, start + limit);
    return { body: { success: true, data, meta: { total: fixtures.articles.length, page, limit, totalPages: Math.ceil(fixtures.articles.length / limit) } } };
  }},
  { method: 'GET', pattern: /^\/api\/articles\/(?<id>[0-9a-f-]+)$/, handle: ({ params, fixtures }) => {
    const article = fixtures.articles.find(a => a.id === params.id);
    return article ? { body: { success: true, data: article } } : { status: 404, body: { error: 'Not Found' } };
  }},
  { method: 'GET', pattern: /^\/api\/articles\/(?<id>[0-9a-f-]+)\/versions$/, handle: () => ({
    body: { success: true, data: [{ version: 1, word_count: 4200, created_at: '2026-03-25T09:00:00Z' }, { version: 2, word_count: 4350, created_at: '2026-03-25T15:00:00Z' }] }
  })},
  { method: 'POST', pattern: /^\/api\/articles$/, handle: ({ body }) => ({
    status: 201, body: { success: true, data: { id: 'a1000001-new-' + Date.now(), ...body, status: 'draft', created_at: new Date().toISOString() } }
  })},
  { method: 'PUT', pattern: /^\/api\/articles\/(?<id>[0-9a-f-]+)$/, handle: ({ params, body }) => ({
    body: { success: true, data: { id: params.id, ...body, updated_at: new Date().toISOString() } }
  })},
  { method: 'DELETE', pattern: /^\/api\/articles\/(?<id>[0-9a-f-]+)$/, handle: () => ({ body: { success: true } }) },

  // Pipeline
  { method: 'GET', pattern: /^\/api\/pipeline\/status$/, handle: () => ({
    body: { success: true, data: { status: 'idle', queue_count: 0, current_job: null, last_completed_at: '2026-03-28T08:00:00Z' } }
  })},
  { method: 'GET', pattern: /^\/api\/pipeline\/queue$/, handle: () => ({ body: { success: true, data: [] } }) },
  { method: 'GET', pattern: /^\/api\/pipeline\/history$/, handle: () => ({
    body: { success: true, data: [{ id: 'job-001', article_id: 'a1000001-0000-0000-0000-000000000001', status: 'completed', duration_ms: 145000, created_at: '2026-03-25T09:00:00Z' }], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } }
  })},

  // Blueprints
  { method: 'GET', pattern: /^\/api\/blueprints$/, handle: ({ query }) => ({
    body: { success: true, data: [{ id: 'bp-001', name: 'Hero Section', category: 'headers', description: 'Full-width hero with gradient overlay' }, { id: 'bp-002', name: 'FAQ Accordion', category: 'content', description: 'Expandable Q&A section with Schema.org markup' }] }
  })},
  { method: 'GET', pattern: /^\/api\/blueprints\/categories$/, handle: () => ({
    body: { success: true, data: [{ name: 'headers', count: 24 }, { name: 'content', count: 45 }, { name: 'media', count: 31 }, { name: 'navigation', count: 18 }, { name: 'forms', count: 22 }, { name: 'footers', count: 15 }] }
  })},

  // Generate
  { method: 'POST', pattern: /^\/api\/generate$/, handle: () => ({
    status: 202, body: { success: true, data: { article_id: 'a1000001-gen-' + Date.now(), job_id: 'job-gen-' + Date.now(), progress_url: '/api/queue/job/job-gen/progress' } }
  })},

  // Settings
  { method: 'GET', pattern: /^\/api\/settings$/, handle: () => ({
    body: { success: true, data: { research_rounds: 6, research_provider: 'gemini_mcp', max_edit_duration: 600, default_language: 'en', default_framework: 'html' } }
  })},
  { method: 'PUT', pattern: /^\/api\/settings$/, handle: ({ body }) => ({ body: { success: true, data: body } }) },

  // Quota
  { method: 'GET', pattern: /^\/api\/quota$/, handle: () => ({
    body: { success: true, data: { plan: 'professional', usage: { articles_generated: 12, articles_limit: 50, edits_used: 34, edits_limit: 200 }, limits: { articles_per_month: 50, edits_per_month: 200, api_keys: 5 } } }
  })},
  { method: 'GET', pattern: /^\/api\/quota\/check\/(?<action>[a-z_]+)$/, handle: () => ({
    body: { success: true, data: { allowed: true, remaining: 38 } }
  })},

  // Queue & Webhooks
  { method: 'POST', pattern: /^\/api\/queue\/enqueue$/, handle: () => ({ status: 202, body: { success: true, data: { id: 'job-' + Date.now(), status: 'queued' } } }) },
  { method: 'POST', pattern: /^\/api\/queue\/cancel\/(?<id>[0-9a-f-]+)$/, handle: () => ({ body: { success: true } }) },
  { method: 'GET', pattern: /^\/api\/queue\/status$/, handle: () => ({ body: { success: true, data: { active: 0, queued: 0, completed: 47 } } }) },
  { method: 'GET', pattern: /^\/api\/queue\/job\/(?<id>[0-9a-f-]+)\/progress$/, handle: () => ({
    sse: true,
    events: [
      { stage: 'analyzing', progress: 0.1, message: 'Analyzing project...' },
      { stage: 'researching', progress: 0.3, message: 'Researching topic (round 2/6)...' },
      { stage: 'architecting', progress: 0.6, message: 'Building article architecture...' },
      { stage: 'generating', progress: 0.8, message: 'Generating images...' },
      { stage: 'writing', progress: 0.9, message: 'Assembling final article...' },
      { stage: 'complete', progress: 1.0, result: { article_id: 'a1000001-0000-0000-0000-000000000004', word_count: 4500 } },
    ]
  })},
  { method: 'GET', pattern: /^\/api\/webhooks$/, handle: () => ({ body: { success: true, data: [] } }) },
  { method: 'POST', pattern: /^\/api\/webhooks$/, handle: ({ body }) => ({ status: 201, body: { success: true, data: { id: 'wh-' + Date.now(), ...body, secret: 'whsec_mock_' + Date.now() } } }) },
  { method: 'DELETE', pattern: /^\/api\/webhooks\/(?<id>[0-9a-f-]+)$/, handle: () => ({ body: { success: true } }) },

  // Analytics
  { method: 'GET', pattern: /^\/api\/analytics\/overview$/, handle: ({ fixtures }) => ({ body: { success: true, data: fixtures.analyticsOverview } }) },
  { method: 'GET', pattern: /^\/api\/analytics\/generation$/, handle: () => ({
    body: { success: true, data: Array.from({ length: 30 }, (_, i) => ({ date: `2026-03-${String(i + 1).padStart(2, '0')}`, count: Math.floor(Math.random() * 5) + 1, success: Math.floor(Math.random() * 4) + 1, failure: Math.random() > 0.8 ? 1 : 0 })) }
  })},
  { method: 'GET', pattern: /^\/api\/analytics\/errors$/, handle: () => ({ body: { success: true, data: [{ type: 'timeout', stage: 'research', count: 2 }, { type: 'rate_limit', stage: 'image_gen', count: 1 }] } }) },
  { method: 'GET', pattern: /^\/api\/analytics\/usage$/, handle: () => ({ body: { success: true, data: [] } }) },
  { method: 'GET', pattern: /^\/api\/analytics\/trends$/, handle: () => ({ body: { success: true, data: { topics: ['bmw', 'react', 'supabase'], languages: { en: 35, ar: 12 }, frameworks: { html: 30, react: 10, vue: 7 } } } }) },

  // Admin
  { method: 'PUT', pattern: /^\/api\/admin\/plans\/(?<userId>[0-9a-f-]+)$/, handle: ({ body }) => ({ body: { success: true, data: { ...body, updated_at: new Date().toISOString() } } }) },
  { method: 'GET', pattern: /^\/api\/admin\/quota-stats$/, handle: () => ({ body: { success: true, data: { by_plan: { starter: 1, professional: 2, enterprise: 1 }, total: { articles: 47, edits: 234 } } } }) },
  { method: 'GET', pattern: /^\/api\/admin\/api-keys$/, handle: () => ({ body: { success: true, data: [{ id: 'key-001', name: 'Production', prefix: 'ck_live_', scopes: ['read', 'write'], created_at: '2026-03-01T09:00:00Z' }] } }) },
  { method: 'POST', pattern: /^\/api\/admin\/api-keys$/, handle: ({ body }) => ({ status: 201, body: { success: true, data: { key_id: 'key-' + Date.now(), raw_key: 'ck_live_mock_' + Date.now(), ...body } } }) },
  { method: 'PUT', pattern: /^\/api\/admin\/api-keys\/(?<id>[0-9a-f-]+)$/, handle: () => ({ body: { success: true, data: { key_id: 'key-rotated', raw_key: 'ck_live_rotated_' + Date.now() } } }) },
  { method: 'DELETE', pattern: /^\/api\/admin\/api-keys\/(?<id>[0-9a-f-]+)$/, handle: () => ({ body: { success: true } }) },
  { method: 'POST', pattern: /^\/api\/admin\/api-keys\/(?<id>[0-9a-f-]+)\/test$/, handle: () => ({ body: { success: true, data: { valid: true, scopes: ['read', 'write'] } } }) },

  // Plugin
  { method: 'POST', pattern: /^\/api\/plugin\/heartbeat$/, handle: () => ({ body: { success: true } }) },
  { method: 'GET', pattern: /^\/api\/plugin\/config$/, handle: () => ({ body: { success: true, data: { max_articles_per_run: 3, research_provider: 'gemini_mcp' } } }) },
  { method: 'GET', pattern: /^\/api\/analytics\/user\/(?<userId>[0-9a-f-]+)$/, handle: () => ({ body: { success: true, data: { articles: 12, edits: 34, last_active: '2026-03-28T08:00:00Z' } } }) },
  { method: 'GET', pattern: /^\/api\/admin\/plugin-instances$/, handle: () => ({ body: { success: true, data: [] } }) },
  { method: 'GET', pattern: /^\/api\/admin\/plugin-config$/, handle: () => ({ body: { success: true, data: [] } }) },

  // Users V2
  { method: 'GET', pattern: /^\/api\/users$/, handle: ({ query, fixtures }) => {
    const page = parseInt(query.page || '1', 10);
    return { body: { success: true, data: fixtures.users, meta: { total: fixtures.users.length, page, limit: 20, totalPages: 1 } } };
  }},
  { method: 'GET', pattern: /^\/api\/users\/(?<id>[0-9a-f-]+)$/, handle: ({ params, fixtures }) => {
    const user = fixtures.users.find(u => u.id === params.id);
    return user ? { body: { success: true, data: user } } : { status: 404, body: { error: 'Not Found' } };
  }},
  { method: 'POST', pattern: /^\/api\/users\/(?<id>[0-9a-f-]+)\/approve$/, handle: () => ({ body: { success: true } }) },
  { method: 'POST', pattern: /^\/api\/users\/(?<id>[0-9a-f-]+)\/upgrade$/, handle: () => ({ body: { success: true } }) },
  { method: 'POST', pattern: /^\/api\/users\/(?<id>[0-9a-f-]+)\/revoke$/, handle: () => ({ body: { success: true } }) },
  { method: 'DELETE', pattern: /^\/api\/users\/(?<id>[0-9a-f-]+)$/, handle: () => ({ body: { success: true } }) },
];
