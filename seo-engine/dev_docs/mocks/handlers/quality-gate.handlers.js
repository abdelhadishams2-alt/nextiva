'use strict';

module.exports = [
  { method: 'GET', pattern: /^\/api\/quality\/score\/(?<articleId>[a-z0-9-]+)$/, handle: ({ params, fixtures }) => {
    const score = fixtures.qualityScores[params.articleId];
    return score
      ? { body: { success: true, data: score } }
      : { body: { success: true, data: null } }; // Not yet scored
  }},
  { method: 'GET', pattern: /^\/api\/quality\/checklist\/(?<articleId>[a-z0-9-]+)$/, handle: () => ({
    body: { success: true, data: { categories: [
      { name: 'Technical SEO', items: [{ check: 'Title tag present and 50-60 chars', pass: true }, { check: 'Meta description 150-160 chars', pass: true }, { check: 'H1 tag unique', pass: true }, { check: 'Image alt text on all images', pass: false, detail: '2 of 6 images missing alt text' }] },
      { name: 'E-E-A-T', items: [{ check: 'Author byline present', pass: true }, { check: 'First-hand experience signals', pass: true }, { check: 'External authoritative sources cited', pass: false, detail: 'Only 1 citation, recommend 3+' }] },
      { name: 'Content Quality', items: [{ check: 'Word count >= 2000', pass: true }, { check: 'Readability Flesch-Kincaid 60-70', pass: true }, { check: 'No duplicate content detected', pass: true }] },
    ] } }
  })},
  { method: 'GET', pattern: /^\/api\/quality\/suggestions\/(?<articleId>[a-z0-9-]+)$/, handle: () => ({
    body: { success: true, data: {
      critical: [{ id: 's-001', suggestion: 'Add alt text to 2 remaining images', impact: 'high', category: 'Technical SEO' }],
      recommended: [{ id: 's-002', suggestion: 'Add 2 more authoritative citations', impact: 'medium', category: 'E-E-A-T' }],
      optional: [{ id: 's-003', suggestion: 'Add FAQ section with Schema.org markup', impact: 'low', category: 'Rich Results' }],
    } }
  })},
  { method: 'GET', pattern: /^\/api\/quality\/history\/(?<articleId>[a-z0-9-]+)$/, handle: () => ({
    body: { success: true, data: [
      { revision: 1, composite: 68, timestamp: '2026-03-25T09:30:00Z' },
      { revision: 2, composite: 82, timestamp: '2026-03-25T15:00:00Z' },
    ] }
  })},
  { method: 'POST', pattern: /^\/api\/quality\/score$/, handle: () => ({
    body: { success: true, data: { composite: 76, signals: { eeat: 72, completeness: 80, voice: 70, ai_detection: 85, freshness: 90, tech_seo: 68, readability: 72 } } }
  })},
  { method: 'POST', pattern: /^\/api\/quality\/revise\/(?<articleId>[a-z0-9-]+)$/, handle: () => ({
    status: 202, body: { success: true, data: { job_id: 'revise-' + Date.now() } }
  })},
  { method: 'POST', pattern: /^\/api\/quality\/bulk$/, handle: ({ body }) => ({
    body: { success: true, data: (body.article_ids || []).map(id => ({ article_id: id, composite: Math.floor(Math.random() * 30) + 60 })) }
  })},
];
