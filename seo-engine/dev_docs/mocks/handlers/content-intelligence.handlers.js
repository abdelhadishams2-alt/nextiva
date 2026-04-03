'use strict';

module.exports = [
  { method: 'GET', pattern: /^\/api\/intelligence\/recommendations$/, handle: ({ query, fixtures }) => {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.per_page || query.limit || '10', 10);
    let items = fixtures.recommendations;
    if (query.status) items = items.filter(r => r.status === query.status);
    if (query.type) items = items.filter(r => r.type === query.type);
    if (query.search) items = items.filter(r => r.keyword.toLowerCase().includes(query.search.toLowerCase()));
    const start = (page - 1) * limit;
    return { body: { success: true, data: items.slice(start, start + limit), meta: { total: items.length, page, limit, totalPages: Math.ceil(items.length / limit) } } };
  }},
  { method: 'GET', pattern: /^\/api\/intelligence\/recommendations\/(?<id>[a-z0-9-]+)$/, handle: ({ params, fixtures }) => {
    const rec = fixtures.recommendations.find(r => r.id === params.id);
    return rec ? { body: { success: true, data: rec } } : { status: 404, body: { error: 'Not Found' } };
  }},
  { method: 'PATCH', pattern: /^\/api\/intelligence\/recommendations\/(?<id>[a-z0-9-]+)$/, handle: ({ params, body }) => ({
    body: { success: true, data: { id: params.id, status: body.status, updated_at: new Date().toISOString() } }
  })},
  { method: 'POST', pattern: /^\/api\/intelligence\/recommendations\/(?<id>[a-z0-9-]+)\/execute$/, handle: ({ params }) => ({
    status: 202, body: { success: true, data: { pipeline_job_id: 'job-exec-' + Date.now(), status: 'queued' } }
  })},
  { method: 'GET', pattern: /^\/api\/intelligence\/decay$/, handle: () => ({
    body: { success: true, data: [
      { content_id: 'inv-002', url: 'https://srmg.com/tech/react-hooks-2024', title: 'React Hooks Best Practices 2024', severity: 'high', method: 'trend', decline_pct: -42, peak_clicks: 1200, current_clicks: 690, detected_at: '2026-03-25T00:00:00Z' },
    ], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } }
  })},
  { method: 'GET', pattern: /^\/api\/intelligence\/decay\/(?<contentId>[a-z0-9-]+)$/, handle: () => ({
    body: { success: true, data: { content_id: 'inv-002', methods: ['trend', 'seasonal'], timeline: [{ date: '2026-01-01', clicks: 1200 }, { date: '2026-02-01', clicks: 950 }, { date: '2026-03-01', clicks: 690 }], recommendation: 'Refresh with 2026 React 19 patterns' } }
  })},
  { method: 'GET', pattern: /^\/api\/intelligence\/gaps$/, handle: () => ({
    body: { success: true, data: [
      { keyword: 'bmw n54 turbo upgrade', volume: 8100, difficulty: 35, opportunity_score: 8.7, competitors_ranking: 3 },
      { keyword: 'supabase edge functions tutorial', volume: 4400, difficulty: 22, opportunity_score: 7.9, competitors_ranking: 1 },
    ], meta: { total: 2, page: 1, limit: 20, totalPages: 1 } }
  })},
  { method: 'GET', pattern: /^\/api\/intelligence\/gaps\/competitors$/, handle: () => ({
    body: { success: true, data: [{ domain: 'bimmerpost.com', overlap: 0.34, unique_keywords: 450 }, { domain: 'bmwblog.com', overlap: 0.28, unique_keywords: 320 }] }
  })},
  { method: 'GET', pattern: /^\/api\/intelligence\/cannibalization$/, handle: () => ({
    body: { success: true, data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }
  })},
  { method: 'GET', pattern: /^\/api\/intelligence\/cannibalization\/(?<keyword>[^/]+)$/, handle: () => ({
    body: { success: true, data: { keyword: 'mock keyword', urls: [], resolution: null } }
  })},
  { method: 'POST', pattern: /^\/api\/intelligence\/cannibalization\/(?<id>[a-z0-9-]+)\/resolve$/, handle: ({ body }) => ({
    body: { success: true, data: { id: 'resolve-' + Date.now(), strategy: body.strategy } }
  })},
  { method: 'POST', pattern: /^\/api\/intelligence\/run$/, handle: () => ({
    status: 202, body: { success: true, data: { run_id: 'run-' + Date.now() } }
  })},
  { method: 'GET', pattern: /^\/api\/intelligence\/run\/(?<runId>[a-z0-9-]+)$/, handle: () => ({
    body: { success: true, data: { status: 'completed', analyses: { decay: 'done', gap: 'done', cannibalization: 'done' }, duration_ms: 45000 } }
  })},
  { method: 'GET', pattern: /^\/api\/intelligence\/runs$/, handle: () => ({
    body: { success: true, data: [{ id: 'run-001', status: 'completed', started_at: '2026-03-27T06:00:00Z', duration_ms: 45000 }], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } }
  })},
  { method: 'GET', pattern: /^\/api\/intelligence\/calendar$/, handle: () => ({
    body: { success: true, data: [{ week: '2026-W14', items: [{ keyword: 'bmw n54 turbo upgrade', type: 'gap', priority: 8.7 }] }] }
  })},
];
