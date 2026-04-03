/**
 * 30/60/90 Day Performance Tracker — FL-001
 *
 * Monitors published articles' GSC performance over time at 30, 60, and 90
 * day milestones. Computes velocity metrics (click velocity, impression
 * growth rate, position improvement, CTR trend). Compares actual GSC
 * performance against predictions. Tracks ROI.
 *
 * Tables: performance_predictions, performance_reports
 * API: GET /api/performance/articles
 *      GET /api/performance/articles/:id
 *      GET /api/performance/summary
 *
 * Zero npm dependencies — Node.js built-ins only.
 */

const logger = require('../logger');
const supabase = require('../supabase-client');

// ── Constants ──────────────────────────────────────────────────

const MILESTONES = [30, 60, 90];
const FETCH_PAGE_SIZE = 1000;
const DEFAULT_CPC = 0.50; // default cost-per-click for ROI estimation

// Prediction accuracy thresholds
const PREDICTION_STATUS = {
  exceeded: 1.20,  // >= 120% of predicted = exceeded
  met: 0.80        // >= 80% of predicted = met; below = missed
};

// ── Helpers ────────────────────────────────────────────────────

function formatDate(date) {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysBetween(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function getSupabaseAdmin() {
  const config = supabase.loadConfig();
  const serviceRoleKey = supabase.getServiceRoleKey();
  if (!config || !serviceRoleKey) {
    throw new Error('Supabase admin config not available. Set SUPABASE_SERVICE_ROLE_KEY env var.');
  }
  return { config, serviceRoleKey };
}

/**
 * Generic paginated fetch from Supabase REST API.
 */
async function fetchAllRows(config, serviceRoleKey, tablePath, params) {
  const rows = [];
  let offset = 0;

  while (true) {
    const qs = new URLSearchParams(params);
    qs.set('offset', String(offset));
    qs.set('limit', String(FETCH_PAGE_SIZE));

    const url = `${config.url}/rest/v1/${tablePath}?${qs.toString()}`;
    const res = await fetch(url, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey
      }
    });

    if (!res.ok) {
      logger.error('perf_tracker_fetch_failed', { table: tablePath, status: res.status });
      break;
    }

    const batch = await res.json();
    if (!batch || batch.length === 0) break;
    rows.push(...batch);
    if (batch.length < FETCH_PAGE_SIZE) break;
    offset += FETCH_PAGE_SIZE;
  }

  return rows;
}

/**
 * Upsert rows into a table via POST with Prefer: resolution=merge-duplicates.
 */
async function upsertRows(config, serviceRoleKey, tablePath, rows, onConflict) {
  if (!rows || rows.length === 0) return 0;

  let upserted = 0;
  // Batch in groups of 500
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const url = `${config.url}/rest/v1/${tablePath}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey,
        'Prefer': `resolution=merge-duplicates,return=minimal`
      },
      body: JSON.stringify(batch)
    });

    if (res.ok) {
      upserted += batch.length;
    } else {
      logger.error('perf_tracker_upsert_failed', { table: tablePath, status: res.status, batch: i });
    }
  }

  return upserted;
}

// ── Core: Fetch published articles and their snapshots ─────────

/**
 * Fetch published articles from content_inventory.
 */
async function fetchPublishedArticles(config, serviceRoleKey, userId) {
  return fetchAllRows(config, serviceRoleKey, 'content_inventory', {
    'user_id': `eq.${userId}`,
    'select': 'id,url,title,publish_date,created_at,status',
    'order': 'publish_date.desc'
  });
}

/**
 * Fetch GSC performance snapshots for a URL in a date range.
 */
async function fetchSnapshotsForUrl(config, serviceRoleKey, userId, url, startDate, endDate) {
  return fetchAllRows(config, serviceRoleKey, 'performance_snapshots', {
    'user_id': `eq.${userId}`,
    'url': `eq.${url}`,
    'source': 'eq.gsc',
    'snapshot_date': `gte.${startDate}`,
    'snapshot_date': `lte.${endDate}`,
    'select': 'clicks,impressions,ctr,avg_position,snapshot_date',
    'order': 'snapshot_date.asc'
  });
}

/**
 * Fetch aggregated snapshot data for a URL over a date range.
 */
async function aggregateSnapshots(config, serviceRoleKey, userId, url, startDate, endDate) {
  const snapshots = await fetchSnapshotsForUrl(config, serviceRoleKey, userId, url, startDate, endDate);

  if (!snapshots || snapshots.length === 0) {
    return null;
  }

  let totalClicks = 0;
  let totalImpressions = 0;
  let ctrSum = 0;
  let posSum = 0;

  for (const s of snapshots) {
    totalClicks += s.clicks || 0;
    totalImpressions += s.impressions || 0;
    ctrSum += parseFloat(s.ctr || 0);
    posSum += parseFloat(s.avg_position || 0);
  }

  return {
    clicks: totalClicks,
    impressions: totalImpressions,
    avgCtr: snapshots.length > 0 ? ctrSum / snapshots.length : 0,
    avgPosition: snapshots.length > 0 ? posSum / snapshots.length : 0,
    dataPoints: snapshots.length,
    snapshots
  };
}

// ── Core: Velocity Metrics Computation ─────────────────────────

/**
 * Compute velocity metrics for an article at a given milestone.
 *
 * @param {object} actuals - { clicks, impressions, avgCtr, avgPosition, dataPoints }
 * @param {number} milestoneDays - 30, 60, or 90
 * @param {object|null} previousMilestone - actuals from a prior milestone (for trend)
 * @returns {object} velocity metrics
 */
function computeVelocityMetrics(actuals, milestoneDays, previousMilestone) {
  const clickVelocity = milestoneDays > 0
    ? Math.round((actuals.clicks / milestoneDays) * 10000) / 10000
    : 0;

  // Impression growth rate: compare current milestone to previous (or baseline of 0)
  let impressionGrowthRate = 0;
  if (previousMilestone && previousMilestone.impressions > 0) {
    impressionGrowthRate = Math.round(
      ((actuals.impressions - previousMilestone.impressions) / previousMilestone.impressions) * 10000
    ) / 10000;
  }

  // Position improvement: positive = better (lower number = better ranking)
  let positionImprovement = 0;
  if (previousMilestone && previousMilestone.avgPosition > 0) {
    positionImprovement = Math.round(
      (previousMilestone.avgPosition - actuals.avgPosition) * 100
    ) / 100;
  }

  // CTR trend: % change from previous milestone
  let ctrTrend = 0;
  if (previousMilestone && previousMilestone.avgCtr > 0) {
    ctrTrend = Math.round(
      ((actuals.avgCtr - previousMilestone.avgCtr) / previousMilestone.avgCtr) * 10000
    ) / 10000;
  }

  return {
    clickVelocity,
    impressionGrowthRate,
    positionImprovement,
    ctrTrend
  };
}

/**
 * Determine prediction status by comparing actual clicks to predicted.
 */
function determinePredictionStatus(actualClicks, predictedClicks) {
  if (!predictedClicks || predictedClicks === 0) return 'met';

  const ratio = actualClicks / predictedClicks;
  if (ratio >= PREDICTION_STATUS.exceeded) return 'exceeded';
  if (ratio >= PREDICTION_STATUS.met) return 'met';
  return 'missed';
}

/**
 * Generate a simple prediction for an article based on early performance.
 * Uses the first 7 days of data to extrapolate milestones.
 */
function generatePrediction(earlyData, milestoneDays) {
  if (!earlyData || earlyData.dataPoints === 0) {
    return { clicks: 0, impressions: 0, position: 50, ctr: 0 };
  }

  // Extrapolate linearly from early data period
  const daysOfData = earlyData.dataPoints;
  const dailyClicks = earlyData.clicks / Math.max(daysOfData, 1);
  const dailyImpressions = earlyData.impressions / Math.max(daysOfData, 1);

  // Apply a growth factor: articles typically grow as they age
  const growthFactor = milestoneDays <= 30 ? 1.0 : milestoneDays <= 60 ? 1.3 : 1.5;

  return {
    clicks: Math.round(dailyClicks * milestoneDays * growthFactor),
    impressions: Math.round(dailyImpressions * milestoneDays * growthFactor),
    position: Math.max(1, Math.round((earlyData.avgPosition * 0.9) * 100) / 100),
    ctr: Math.min(1, Math.round((earlyData.avgCtr * growthFactor) * 10000) / 10000)
  };
}

/**
 * Estimate traffic value based on clicks and an average CPC.
 */
function estimateValue(clicks, cpcOverride) {
  const cpc = cpcOverride || DEFAULT_CPC;
  return Math.round(clicks * cpc * 100) / 100;
}

// ── Core: Track Article Performance ────────────────────────────

/**
 * Track a single article's performance across all milestones.
 * Creates/updates performance_predictions records.
 *
 * @param {string} userId
 * @param {object} article - content_inventory row
 * @returns {Promise<Array>} Array of prediction records created/updated
 */
async function trackArticle(userId, article) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  const publishDate = article.publish_date || article.created_at;
  if (!publishDate) return [];

  const pubDate = new Date(publishDate);
  const now = new Date();
  const daysSincePublish = daysBetween(pubDate, now);

  logger.info('perf_track_article_started', {
    userId, url: article.url, daysSincePublish
  });

  // Fetch early data (first 7 days) for prediction generation
  const earlyEnd = formatDate(new Date(pubDate.getTime() + 7 * 86400000));
  const earlyData = await aggregateSnapshots(
    config, serviceRoleKey, userId, article.url,
    formatDate(pubDate), earlyEnd
  );

  const predictions = [];
  let previousMilestone = null;

  for (const milestone of MILESTONES) {
    const milestoneDate = new Date(pubDate.getTime() + milestone * 86400000);
    const milestonePassed = daysSincePublish >= milestone;

    // Generate prediction
    const predicted = generatePrediction(earlyData, milestone);

    const record = {
      user_id: userId,
      content_id: article.id,
      url: article.url,
      milestone_days: milestone,
      milestone_date: formatDate(milestoneDate),
      publish_date: formatDate(pubDate),
      predicted_clicks: predicted.clicks,
      predicted_impressions: predicted.impressions,
      predicted_position: predicted.position,
      predicted_ctr: predicted.ctr,
      updated_at: new Date().toISOString()
    };

    if (milestonePassed) {
      // Fetch actual data for this milestone window
      const milestoneStart = formatDate(pubDate);
      const milestoneEnd = formatDate(milestoneDate);
      const actuals = await aggregateSnapshots(
        config, serviceRoleKey, userId, article.url,
        milestoneStart, milestoneEnd
      );

      if (actuals) {
        record.actual_clicks = actuals.clicks;
        record.actual_impressions = actuals.impressions;
        record.actual_position = Math.round(actuals.avgPosition * 100) / 100;
        record.actual_ctr = Math.round(actuals.avgCtr * 10000) / 10000;

        const velocity = computeVelocityMetrics(actuals, milestone, previousMilestone);
        record.click_velocity = velocity.clickVelocity;
        record.impression_growth_rate = velocity.impressionGrowthRate;
        record.position_improvement = velocity.positionImprovement;
        record.ctr_trend = velocity.ctrTrend;

        record.estimated_value = estimateValue(actuals.clicks);
        record.status = determinePredictionStatus(actuals.clicks, predicted.clicks);

        previousMilestone = actuals;
      } else {
        record.actual_clicks = 0;
        record.actual_impressions = 0;
        record.status = 'missed';
        record.estimated_value = 0;
      }
    } else {
      record.status = 'pending';
    }

    predictions.push(record);
  }

  // Upsert all predictions
  await upsertRows(config, serviceRoleKey, 'performance_predictions', predictions);

  logger.info('perf_track_article_completed', {
    userId, url: article.url, predictions: predictions.length
  });

  return predictions;
}

/**
 * Track all published articles for a user.
 *
 * @param {string} userId
 * @returns {Promise<object>} Summary of tracking run
 */
async function trackAllArticles(userId) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  logger.info('perf_track_all_started', { userId });

  const articles = await fetchPublishedArticles(config, serviceRoleKey, userId);
  let tracked = 0;
  let errors = 0;

  for (const article of articles) {
    try {
      await trackArticle(userId, article);
      tracked++;
    } catch (e) {
      errors++;
      logger.error('perf_track_article_error', { userId, url: article.url, error: e.message });
    }
  }

  logger.info('perf_track_all_completed', { userId, tracked, errors, total: articles.length });

  return { tracked, errors, total: articles.length };
}

// ── Core: Generate Performance Report ──────────────────────────

/**
 * Generate a performance report for a user.
 *
 * @param {string} userId
 * @returns {Promise<object>} Report data
 */
async function generateReport(userId) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  logger.info('perf_report_started', { userId });

  // Fetch all predictions for this user
  const predictions = await fetchAllRows(config, serviceRoleKey, 'performance_predictions', {
    'user_id': `eq.${userId}`,
    'select': '*',
    'order': 'publish_date.desc'
  });

  const articles = await fetchPublishedArticles(config, serviceRoleKey, userId);

  // Compute aggregate metrics
  const completedPredictions = predictions.filter(p => p.status !== 'pending');
  const met = completedPredictions.filter(p => p.status === 'met').length;
  const exceeded = completedPredictions.filter(p => p.status === 'exceeded').length;
  const missed = completedPredictions.filter(p => p.status === 'missed').length;

  let totalClickVelocity = 0;
  let totalImpressionGrowth = 0;
  let totalPositionChange = 0;
  let totalCtrTrend = 0;
  let velocityCount = 0;
  let totalValue = 0;

  for (const p of completedPredictions) {
    if (p.click_velocity != null) {
      totalClickVelocity += parseFloat(p.click_velocity);
      velocityCount++;
    }
    if (p.impression_growth_rate != null) {
      totalImpressionGrowth += parseFloat(p.impression_growth_rate);
    }
    if (p.position_improvement != null) {
      totalPositionChange += parseFloat(p.position_improvement);
    }
    if (p.ctr_trend != null) {
      totalCtrTrend += parseFloat(p.ctr_trend);
    }
    if (p.estimated_value != null) {
      totalValue += parseFloat(p.estimated_value);
    }
  }

  const count = completedPredictions.length || 1;

  // Identify top performers and underperformers (by 90-day milestone)
  const milestone90 = predictions
    .filter(p => p.milestone_days === 90 && p.status !== 'pending')
    .sort((a, b) => (b.actual_clicks || 0) - (a.actual_clicks || 0));

  const topPerformers = milestone90.slice(0, 5).map(p => ({
    url: p.url,
    clicks: p.actual_clicks,
    status: p.status,
    click_velocity: p.click_velocity
  }));

  const underperformers = milestone90
    .filter(p => p.status === 'missed')
    .slice(0, 5)
    .map(p => ({
      url: p.url,
      predicted_clicks: p.predicted_clicks,
      actual_clicks: p.actual_clicks,
      status: p.status
    }));

  // Build unique tracked URLs
  const trackedUrls = new Set(predictions.map(p => p.url));

  const report = {
    user_id: userId,
    report_date: formatDate(new Date()),
    report_type: 'daily',
    total_articles: articles.length,
    articles_tracked: trackedUrls.size,
    predictions_met: met,
    predictions_exceeded: exceeded,
    predictions_missed: missed,
    avg_click_velocity: Math.round((totalClickVelocity / count) * 10000) / 10000,
    avg_impression_growth: Math.round((totalImpressionGrowth / count) * 10000) / 10000,
    avg_position_change: Math.round((totalPositionChange / count) * 100) / 100,
    avg_ctr_trend: Math.round((totalCtrTrend / count) * 10000) / 10000,
    total_estimated_value: Math.round(totalValue * 100) / 100,
    top_performers: topPerformers,
    underperformers: underperformers
  };

  // Upsert report
  await upsertRows(config, serviceRoleKey, 'performance_reports', [report]);

  logger.info('perf_report_completed', { userId, articlesTracked: trackedUrls.size });

  return report;
}

// ── API Handlers ───────────────────────────────────────────────

/**
 * Handle GET /api/performance/articles — list tracked articles with predictions.
 * Supports ?milestone=30|60|90&status=&sort=&page=&per_page=
 *
 * @param {string} userId
 * @param {object} query - URL query parameters
 * @returns {Promise<object>} API response data
 */
async function handleArticleList(userId, query) {
  logger.info('perf_article_list_started', { userId, query });

  const { config, serviceRoleKey } = getSupabaseAdmin();

  // Fetch predictions for this user
  const params = {
    'user_id': `eq.${userId}`,
    'select': '*',
    'order': 'publish_date.desc'
  };

  if (query.milestone) {
    params['milestone_days'] = `eq.${query.milestone}`;
  }
  if (query.status) {
    params['status'] = `eq.${query.status}`;
  }

  const predictions = await fetchAllRows(config, serviceRoleKey, 'performance_predictions', params);

  // Sort
  const sortField = query.sort || 'publish_date';
  predictions.sort((a, b) => {
    if (sortField === 'publish_date') {
      return new Date(b.publish_date) - new Date(a.publish_date);
    }
    if (sortField === 'click_velocity') {
      return (parseFloat(b.click_velocity) || 0) - (parseFloat(a.click_velocity) || 0);
    }
    if (sortField === 'actual_clicks') {
      return (b.actual_clicks || 0) - (a.actual_clicks || 0);
    }
    if (sortField === 'estimated_value') {
      return (parseFloat(b.estimated_value) || 0) - (parseFloat(a.estimated_value) || 0);
    }
    return 0;
  });

  // Pagination
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(query.per_page || '20', 10)));
  const start = (page - 1) * perPage;
  const paginated = predictions.slice(start, start + perPage);

  return {
    items: paginated,
    pagination: {
      page,
      per_page: perPage,
      total: predictions.length,
      total_pages: Math.ceil(predictions.length / perPage)
    }
  };
}

/**
 * Handle GET /api/performance/articles/:id — single article detail.
 * Returns all milestone predictions for a content ID.
 *
 * @param {string} userId
 * @param {string} contentId - Content inventory UUID
 * @returns {Promise<object|null>} Article performance detail or null
 */
async function handleArticleDetail(userId, contentId) {
  logger.info('perf_article_detail_started', { userId, contentId });

  const { config, serviceRoleKey } = getSupabaseAdmin();

  // Fetch the content inventory item
  const invRows = await fetchAllRows(config, serviceRoleKey, 'content_inventory', {
    'id': `eq.${contentId}`,
    'user_id': `eq.${userId}`,
    'select': '*'
  });

  if (!invRows || invRows.length === 0) return null;
  const article = invRows[0];

  // Fetch all predictions for this content
  const predictions = await fetchAllRows(config, serviceRoleKey, 'performance_predictions', {
    'content_id': `eq.${contentId}`,
    'user_id': `eq.${userId}`,
    'select': '*',
    'order': 'milestone_days.asc'
  });

  // Build milestone map
  const milestones = {};
  for (const p of predictions) {
    milestones[p.milestone_days] = {
      milestone_days: p.milestone_days,
      milestone_date: p.milestone_date,
      status: p.status,
      predicted: {
        clicks: p.predicted_clicks,
        impressions: p.predicted_impressions,
        position: p.predicted_position ? parseFloat(p.predicted_position) : null,
        ctr: p.predicted_ctr ? parseFloat(p.predicted_ctr) : null
      },
      actual: p.status !== 'pending' ? {
        clicks: p.actual_clicks,
        impressions: p.actual_impressions,
        position: p.actual_position ? parseFloat(p.actual_position) : null,
        ctr: p.actual_ctr ? parseFloat(p.actual_ctr) : null
      } : null,
      velocity: {
        click_velocity: p.click_velocity ? parseFloat(p.click_velocity) : null,
        impression_growth_rate: p.impression_growth_rate ? parseFloat(p.impression_growth_rate) : null,
        position_improvement: p.position_improvement ? parseFloat(p.position_improvement) : null,
        ctr_trend: p.ctr_trend ? parseFloat(p.ctr_trend) : null
      },
      estimated_value: p.estimated_value ? parseFloat(p.estimated_value) : null
    };
  }

  return {
    contentId,
    url: article.url,
    title: article.title,
    publish_date: article.publish_date,
    milestones,
    days_since_publish: daysBetween(
      new Date(article.publish_date || article.created_at),
      new Date()
    )
  };
}

/**
 * Handle GET /api/performance/summary — portfolio performance summary.
 *
 * @param {string} userId
 * @returns {Promise<object>} Summary data
 */
async function handleSummary(userId) {
  logger.info('perf_summary_started', { userId });

  // Generate a fresh report
  const report = await generateReport(userId);

  // Compute milestone breakdowns
  const { config, serviceRoleKey } = getSupabaseAdmin();
  const predictions = await fetchAllRows(config, serviceRoleKey, 'performance_predictions', {
    'user_id': `eq.${userId}`,
    'select': 'milestone_days,status,click_velocity,actual_clicks,predicted_clicks',
    'order': 'milestone_days.asc'
  });

  const milestoneBreakdown = {};
  for (const m of MILESTONES) {
    const group = predictions.filter(p => p.milestone_days === m);
    const completed = group.filter(p => p.status !== 'pending');
    milestoneBreakdown[m] = {
      total: group.length,
      pending: group.filter(p => p.status === 'pending').length,
      met: completed.filter(p => p.status === 'met').length,
      exceeded: completed.filter(p => p.status === 'exceeded').length,
      missed: completed.filter(p => p.status === 'missed').length,
      avg_click_velocity: completed.length > 0
        ? Math.round(
            (completed.reduce((s, p) => s + (parseFloat(p.click_velocity) || 0), 0) / completed.length) * 10000
          ) / 10000
        : 0
    };
  }

  // Prediction accuracy rate
  const totalCompleted = predictions.filter(p => p.status !== 'pending').length;
  const totalMetOrExceeded = predictions.filter(p => p.status === 'met' || p.status === 'exceeded').length;
  const accuracyRate = totalCompleted > 0
    ? Math.round((totalMetOrExceeded / totalCompleted) * 10000) / 10000
    : 0;

  return {
    ...report,
    milestone_breakdown: milestoneBreakdown,
    prediction_accuracy_rate: accuracyRate
  };
}

// ── Exports ────────────────────────────────────────────────────

module.exports = {
  // Core tracking
  trackArticle,
  trackAllArticles,
  generateReport,
  // API handlers
  handleArticleList,
  handleArticleDetail,
  handleSummary,
  // Pure functions (exported for testing)
  computeVelocityMetrics,
  determinePredictionStatus,
  generatePrediction,
  estimateValue,
  formatDate,
  daysBetween
};
