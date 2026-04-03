'use strict';

module.exports = [
  { method: 'GET', pattern: /^\/api\/voice\/personas$/, handle: ({ fixtures }) => ({ body: { success: true, data: fixtures.personas } }) },
  { method: 'GET', pattern: /^\/api\/voice\/personas\/(?<id>[a-z0-9-]+)$/, handle: ({ params, fixtures }) => {
    const persona = fixtures.personas.find(p => p.id === params.id);
    return persona ? { body: { success: true, data: persona } } : { status: 404, body: { error: 'Not Found' } };
  }},
  { method: 'POST', pattern: /^\/api\/voice\/personas$/, handle: ({ body }) => ({
    status: 201, body: { success: true, data: { id: 'per-' + Date.now(), ...body, is_default: false, created_at: new Date().toISOString() } }
  })},
  { method: 'PUT', pattern: /^\/api\/voice\/personas\/(?<id>[a-z0-9-]+)$/, handle: ({ params, body }) => ({
    body: { success: true, data: { id: params.id, ...body, updated_at: new Date().toISOString() } }
  })},
  { method: 'DELETE', pattern: /^\/api\/voice\/personas\/(?<id>[a-z0-9-]+)$/, handle: () => ({ body: { success: true } }) },
  { method: 'POST', pattern: /^\/api\/voice\/personas\/(?<id>[a-z0-9-]+)\/set-default$/, handle: () => ({ body: { success: true } }) },
  { method: 'POST', pattern: /^\/api\/voice\/analyze$/, handle: () => ({
    status: 202, body: { success: true, data: { session_id: 'va-' + Date.now() } }
  })},
  { method: 'GET', pattern: /^\/api\/voice\/analyze\/progress\/(?<sessionId>[a-z0-9-]+)$/, handle: () => ({
    sse: true,
    events: [
      { stage: 'crawling', progress: 0.2, message: 'Crawling 50 pages for voice samples...' },
      { stage: 'classifying', progress: 0.4, message: 'Classifying human vs AI content...' },
      { stage: 'clustering', progress: 0.7, message: 'Clustering writing styles...' },
      { stage: 'generating', progress: 0.9, message: 'Generating voice personas...' },
      { stage: 'complete', progress: 1.0, result: { personas_generated: 2, samples_analyzed: 48 } },
    ]
  })},
  { method: 'GET', pattern: /^\/api\/voice\/analyze\/status$/, handle: () => ({
    body: { success: true, data: { status: 'completed', last_run: '2026-03-15T10:00:00Z', personas_generated: 2, samples_analyzed: 48 } }
  })},
  { method: 'POST', pattern: /^\/api\/voice\/classify$/, handle: () => ({
    body: { success: true, data: { classification: 'HUMAN', confidence: 0.87, signals: { perplexity: 42.3, burstiness: 0.71, vocabulary_richness: 0.68 } } }
  })},
  { method: 'POST', pattern: /^\/api\/voice\/match-score$/, handle: () => ({
    body: { success: true, data: { score: 0.79, breakdown: { tone: 0.82, cadence: 0.75, vocabulary: 0.80 } } }
  })},
];
