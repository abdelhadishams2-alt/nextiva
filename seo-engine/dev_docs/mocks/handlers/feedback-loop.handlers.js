'use strict';

module.exports = [
  { method: 'GET', pattern: /^\/api\/performance\/summary$/, handle: ({ fixtures }) => ({
    body: { success: true, data: fixtures.performanceSummary }
  })},
  { method: 'GET', pattern: /^\/api\/performance\/chart$/, handle: ({ fixtures }) => ({
    body: { success: true, data: fixtures.performanceChart }
  })},
  { method: 'GET', pattern: /^\/api\/performance\/articles$/, handle: () => ({
    body: { success: true, data: [
      { article_id: 'a1000001-0000-0000-0000-000000000001', title: 'BMW N54 HPFP Failure Guide', predicted_clicks_30d: 1200, actual_clicks_30d: 1450, accuracy: 0.83, status: 'outperforming', published_at: '2026-03-25T09:00:00Z' },
      { article_id: 'a1000001-0000-0000-0000-000000000003', title: 'React Server Components Guide', predicted_clicks_30d: 800, actual_clicks_30d: 620, accuracy: 0.78, status: 'underperforming', published_at: '2026-03-27T08:00:00Z' },
    ], meta: { total: 2, page: 1, limit: 20, totalPages: 1 } }
  })},
  { method: 'GET', pattern: /^\/api\/performance\/articles\/(?<predictionId>[a-z0-9-]+)$/, handle: () => ({
    body: { success: true, data: { checkpoints: [
      { day: 30, predicted: 800, actual: 750, accuracy: 0.94 },
      { day: 60, predicted: 1200, actual: 1100, accuracy: 0.92 },
      { day: 90, predicted: 1500, actual: null, accuracy: null },
    ] } }
  })},
  { method: 'GET', pattern: /^\/api\/feedback\/accuracy$/, handle: () => ({
    body: { success: true, data: { mean: 0.73, median: 0.76, std_dev: 0.14, best: { article_id: 'a1', accuracy: 0.95 }, worst: { article_id: 'a2', accuracy: 0.42 } } }
  })},
  { method: 'GET', pattern: /^\/api\/feedback\/portfolio$/, handle: () => ({
    body: { success: true, data: { total_articles: 47, total_clicks: 128400, avg_accuracy: 0.73, best_performers: [] } }
  })},
  { method: 'POST', pattern: /^\/api\/feedback\/recalibrate$/, handle: ({ body }) => ({
    body: { success: true, data: { dry_run: body?.dry_run ?? true, changes: { eeat_weight: { before: 0.20, after: 0.22 }, freshness_weight: { before: 0.10, after: 0.12 } } } }
  })},
  { method: 'GET', pattern: /^\/api\/feedback\/recalibration-history$/, handle: () => ({
    body: { success: true, data: [{ id: 'recal-001', applied_at: '2026-03-15T00:00:00Z', changes: 3, triggered_by: 'auto' }] }
  })},
  { method: 'POST', pattern: /^\/api\/feedback\/rollback\/(?<recalibrationId>[a-z0-9-]+)$/, handle: () => ({ body: { success: true } }) },
];
