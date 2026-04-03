'use strict';

module.exports = [
  { method: 'GET', pattern: /^\/api\/connections$/, handle: ({ fixtures }) => ({ body: { success: true, data: fixtures.connections } }) },
  { method: 'GET', pattern: /^\/api\/connections\/status$/, handle: () => ({
    body: { success: true, data: { gsc: { connected: true, last_pull: '2026-03-28T06:00:00Z', rows: 12400 }, ga4: { connected: true, last_pull: '2026-03-28T06:00:00Z', rows: 8900 }, semrush: { connected: true, last_pull: '2026-03-27T22:00:00Z', rows: 3200 }, ahrefs: { connected: false } } }
  })},
  { method: 'GET', pattern: /^\/api\/connections\/google\/auth$/, handle: () => ({ status: 302, body: { redirect: 'https://accounts.google.com/o/oauth2/auth?mock=true' } }) },
  { method: 'GET', pattern: /^\/api\/connections\/google\/callback$/, handle: () => ({ status: 302, body: { redirect: '/settings/connections?status=connected' } }) },
  { method: 'POST', pattern: /^\/api\/connections\/semrush$/, handle: () => ({ status: 201, body: { success: true, data: { id: 'conn-sem-' + Date.now(), provider: 'semrush', status: 'connected' } } }) },
  { method: 'POST', pattern: /^\/api\/connections\/ahrefs$/, handle: () => ({ status: 201, body: { success: true, data: { id: 'conn-ahr-' + Date.now(), provider: 'ahrefs', status: 'connected' } } }) },
  { method: 'DELETE', pattern: /^\/api\/connections\/(?<id>[0-9a-f-]+)$/, handle: () => ({ body: { success: true } }) },
  { method: 'POST', pattern: /^\/api\/connections\/(?<id>[0-9a-f-]+)\/refresh$/, handle: () => ({ body: { success: true, data: { status: 'connected', expires_at: '2026-04-28T10:00:00Z' } } }) },
  { method: 'POST', pattern: /^\/api\/connections\/(?<id>[0-9a-f-]+)\/property$/, handle: ({ body }) => ({ body: { success: true, data: { property: body.gsc_property || body.ga4_property_id } } }) },

  // Inventory
  { method: 'GET', pattern: /^\/api\/inventory$/, handle: ({ query, fixtures }) => {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    let items = fixtures.contentInventory;
    if (query.status) items = items.filter(i => query.status.split(',').includes(i.status));
    if (query.search) items = items.filter(i => i.title.toLowerCase().includes(query.search.toLowerCase()));
    const start = (page - 1) * limit;
    return { body: { success: true, data: items.slice(start, start + limit), meta: { total: items.length, page, limit, totalPages: Math.ceil(items.length / limit) } } };
  }},
  { method: 'GET', pattern: /^\/api\/inventory\/(?<id>[a-z0-9-]+)$/, handle: ({ params, fixtures }) => {
    const item = fixtures.contentInventory.find(i => i.id === params.id);
    return item ? { body: { success: true, data: item } } : { status: 404, body: { error: 'Not Found' } };
  }},
  { method: 'GET', pattern: /^\/api\/inventory\/(?<id>[a-z0-9-]+)\/history$/, handle: () => ({
    body: { success: true, data: Array.from({ length: 90 }, (_, i) => ({ date: `2026-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`, clicks: Math.floor(Math.random() * 100) + 10, impressions: Math.floor(Math.random() * 2000) + 500, ctr: +(Math.random() * 0.08 + 0.01).toFixed(4), position: +(Math.random() * 20 + 3).toFixed(1) })) }
  })},
  { method: 'GET', pattern: /^\/api\/inventory\/stats$/, handle: () => ({
    body: { success: true, data: { total: 2847, avg_health: 72, decaying: 7, thin: 3, last_crawl: '2026-03-27T00:00:00Z' } }
  })},
  { method: 'POST', pattern: /^\/api\/inventory\/crawl$/, handle: () => ({ status: 202, body: { success: true, data: { job_id: 'crawl-' + Date.now() } } }) },
  { method: 'GET', pattern: /^\/api\/inventory\/crawl\/progress\/(?<jobId>[a-z0-9-]+)$/, handle: () => ({
    sse: true,
    events: [
      { stage: 'discovering', progress: 0.1, count: 50, message: 'Discovering URLs from sitemap...' },
      { stage: 'crawling', progress: 0.4, count: 200, message: 'Crawling pages (200/500)...' },
      { stage: 'crawling', progress: 0.7, count: 350, message: 'Crawling pages (350/500)...' },
      { stage: 'indexing', progress: 0.9, count: 480, message: 'Indexing content...' },
      { stage: 'complete', progress: 1.0, count: 500, message: 'Crawl complete' },
    ]
  })},
  { method: 'POST', pattern: /^\/api\/inventory\/crawl\/(?<jobId>[a-z0-9-]+)\/cancel$/, handle: () => ({ body: { success: true } }) },

  // Ingestion
  { method: 'GET', pattern: /^\/api\/ingestion\/status$/, handle: () => ({
    body: { success: true, data: { sources: { gsc: 'idle', ga4: 'idle', semrush: 'idle', crawler: 'idle' }, last_runs: { gsc: '2026-03-28T06:00:00Z', ga4: '2026-03-28T06:00:00Z' }, active_jobs: [] } }
  })},
  { method: 'POST', pattern: /^\/api\/ingestion\/trigger\/(?<source>[a-z0-9]+)$/, handle: ({ params }) => ({
    status: 202, body: { success: true, data: { job_id: `ingest-${params.source}-` + Date.now() } }
  })},
  { method: 'GET', pattern: /^\/api\/ingestion\/cost$/, handle: () => ({
    body: { success: true, data: { by_provider: { gsc: 0, ga4: 0, semrush: 12.50, ahrefs: 0 }, total: 12.50, currency: 'USD', period: '2026-03' } }
  })},
  { method: 'GET', pattern: /^\/api\/ingestion\/health$/, handle: () => ({
    body: { success: true, data: { connections: 3, error_rates: { gsc: 0, ga4: 0.01, semrush: 0, crawler: 0 } } }
  })},
];
