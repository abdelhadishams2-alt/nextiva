/**
 * Scoring Weight Recalibration Engine — FL-002
 *
 * Analyzes article performance data to adjust the 7-signal quality gate weights
 * and 5-component topic recommender weights based on actual outcomes.
 *
 * Algorithm:
 *   1. Fetch articles with both quality scores and performance data
 *   2. Compute Pearson correlation between each signal score and performance metric
 *   3. Adjust weights: increase for high-correlation signals, decrease for low-correlation
 *   4. Enforce constraints: no weight > 0.35, no weight < 0.05, all weights sum to 1.0
 *   5. Store weight history for audit trail
 *
 * Constraints:
 *   - No single weight can exceed 0.35
 *   - No weight below 0.05
 *   - Weights must sum to 1.0
 *
 * Zero npm dependencies — Node.js built-ins only.
 */

'use strict';

const logger = require('../logger');
const supabase = require('../supabase-client');

// ── Default Weights (from seven-signals.js and topic-recommender.js) ────

const DEFAULT_QUALITY_GATE_WEIGHTS = {
  'Content Depth & Structure': 0.20,
  'Keyword Integration': 0.18,
  'E-E-A-T Signals': 0.16,
  'Technical SEO': 0.14,
  'User Experience': 0.12,
  'Internal Linking': 0.10,
  'Internationalization': 0.10
};

const DEFAULT_TOPIC_RECOMMENDER_WEIGHTS = {
  impressions: 0.30,
  decay: 0.25,
  gap: 0.25,
  seasonality: 0.10,
  competition: 0.10
};

// ── Constraints ─────────────────────────────────────────────────

const MAX_WEIGHT = 0.35;
const MIN_WEIGHT = 0.05;
const MIN_SAMPLE_SIZE = 10;
const LEARNING_RATE = 0.15;  // How aggressively to adjust weights per recalibration
const PAGE_SIZE = 1000;

// ── In-Memory Weight Overrides ──────────────────────────────────
// Per-user weight overrides. Falls back to defaults if not set.
const userQualityWeights = new Map();   // userId -> { signalName: weight }
const userRecommenderWeights = new Map(); // userId -> { component: weight }
const runStore = new Map(); // runId -> run status

// ── Helpers ─────────────────────────────────────────────────────

function generateId() {
  const bytes = [];
  for (let i = 0; i < 16; i++) {
    bytes.push(Math.floor(Math.random() * 256).toString(16).padStart(2, '0'));
  }
  return [
    bytes.slice(0, 4).join(''),
    bytes.slice(4, 6).join(''),
    bytes.slice(6, 8).join(''),
    bytes.slice(8, 10).join(''),
    bytes.slice(10, 16).join('')
  ].join('-');
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
 * Compute Pearson correlation coefficient between two arrays.
 * Returns value in [-1, 1]. Returns 0 if insufficient data.
 *
 * @param {number[]} xs
 * @param {number[]} ys
 * @returns {number}
 */
function pearsonCorrelation(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return 0;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += xs[i];
    sumY += ys[i];
    sumXY += xs[i] * ys[i];
    sumX2 += xs[i] * xs[i];
    sumY2 += ys[i] * ys[i];
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  const r = numerator / denominator;
  return Math.max(-1, Math.min(1, r));
}

/**
 * Normalize weights so they sum to 1.0 while respecting min/max constraints.
 * Uses iterative clamping: clamp out-of-bounds weights, redistribute remainder.
 *
 * @param {Object<string, number>} weights - { name: weight }
 * @returns {Object<string, number>} Normalized weights summing to 1.0
 */
function normalizeWeights(weights) {
  const keys = Object.keys(weights);
  const result = { ...weights };

  // Iterative clamping — max 10 iterations to converge
  for (let iter = 0; iter < 10; iter++) {
    let clamped = false;
    let clampedSum = 0;
    let freeSum = 0;
    const freeKeys = [];

    for (const k of keys) {
      if (result[k] > MAX_WEIGHT) {
        result[k] = MAX_WEIGHT;
        clamped = true;
        clampedSum += MAX_WEIGHT;
      } else if (result[k] < MIN_WEIGHT) {
        result[k] = MIN_WEIGHT;
        clamped = true;
        clampedSum += MIN_WEIGHT;
      } else {
        freeKeys.push(k);
        freeSum += result[k];
      }
    }

    if (!clamped) break;

    // Redistribute to make sum = 1.0
    const remaining = 1.0 - clampedSum;
    if (freeKeys.length > 0 && freeSum > 0) {
      const scale = remaining / freeSum;
      for (const k of freeKeys) {
        result[k] *= scale;
      }
    }
  }

  // Final normalization pass to ensure exact sum of 1.0
  const sum = keys.reduce((s, k) => s + result[k], 0);
  if (sum > 0 && Math.abs(sum - 1.0) > 0.0001) {
    for (const k of keys) {
      result[k] = result[k] / sum;
    }
  }

  // Round to 4 decimal places
  for (const k of keys) {
    result[k] = Math.round(result[k] * 10000) / 10000;
  }

  // Fix rounding drift — adjust largest weight
  const roundedSum = keys.reduce((s, k) => s + result[k], 0);
  if (Math.abs(roundedSum - 1.0) > 0.00001) {
    const largestKey = keys.reduce((a, b) => result[a] >= result[b] ? a : b);
    result[largestKey] = Math.round((result[largestKey] + (1.0 - roundedSum)) * 10000) / 10000;
  }

  return result;
}

// ── Data Fetching ───────────────────────────────────────────────

/**
 * Fetch articles with quality scores and performance data for correlation analysis.
 *
 * @param {string} userId
 * @returns {Promise<Array<{ qualitySignals: Object, performance: Object }>>}
 */
async function fetchArticlePerformanceData(userId) {
  const { config, serviceRoleKey } = getSupabaseAdmin();
  const items = [];
  let offset = 0;

  while (true) {
    const url = `${config.url}/rest/v1/articles` +
      `?user_id=eq.${encodeURIComponent(userId)}` +
      `&select=id,quality_scores,performance_data,created_at` +
      `&quality_scores=not.is.null` +
      `&performance_data=not.is.null` +
      `&offset=${offset}&limit=${PAGE_SIZE}` +
      `&order=created_at.desc`;

    const res = await fetch(url, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey
      }
    });

    if (!res.ok) {
      logger.error('recalibration_fetch_articles_failed', { status: res.status, userId });
      break;
    }

    const rows = await res.json();
    if (!rows || rows.length === 0) break;
    items.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return items;
}

/**
 * Fetch topic recommendations with outcome data for recommender recalibration.
 *
 * @param {string} userId
 * @returns {Promise<Array>}
 */
async function fetchRecommendationOutcomes(userId) {
  const { config, serviceRoleKey } = getSupabaseAdmin();
  const items = [];
  let offset = 0;

  while (true) {
    const url = `${config.url}/rest/v1/keyword_opportunities` +
      `?user_id=eq.${encodeURIComponent(userId)}` +
      `&status=in.(completed,in_progress)` +
      `&select=id,keyword,priority_score,impressions,clicks,current_position,analysis_metadata,status` +
      `&offset=${offset}&limit=${PAGE_SIZE}` +
      `&order=created_at.desc`;

    const res = await fetch(url, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey
      }
    });

    if (!res.ok) {
      logger.error('recalibration_fetch_recommendations_failed', { status: res.status, userId });
      break;
    }

    const rows = await res.json();
    if (!rows || rows.length === 0) break;
    items.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return items;
}

// ── Recalibration Logic ─────────────────────────────────────────

/**
 * Recalibrate quality gate weights based on article performance data.
 *
 * @param {string} userId
 * @returns {Promise<Object>} { weightsBefore, weightsAfter, correlations, adjustments, sampleSize, confidence }
 */
async function recalibrateQualityGateWeights(userId) {
  logger.info('recalibration_quality_gate_started', { userId });

  const articles = await fetchArticlePerformanceData(userId);
  const currentWeights = getCurrentQualityGateWeights(userId);

  if (articles.length < MIN_SAMPLE_SIZE) {
    logger.warn('recalibration_quality_gate_insufficient_data', {
      userId, sampleSize: articles.length, required: MIN_SAMPLE_SIZE
    });
    return {
      weightsBefore: { ...currentWeights },
      weightsAfter: { ...currentWeights },
      correlations: {},
      adjustments: {},
      sampleSize: articles.length,
      confidence: 0,
      skipped: true,
      reason: `Insufficient data: ${articles.length} articles, need at least ${MIN_SAMPLE_SIZE}`
    };
  }

  // Extract signal scores and performance metric (composite: clicks + impressions weighted)
  const signalNames = Object.keys(DEFAULT_QUALITY_GATE_WEIGHTS);
  const signalArrays = {};
  for (const name of signalNames) {
    signalArrays[name] = [];
  }
  const performanceScores = [];

  for (const article of articles) {
    const qs = article.quality_scores;
    const perf = article.performance_data;
    if (!qs || !perf) continue;

    // Performance composite: normalize clicks and impressions to 0-100
    const clicks = perf.clicks || 0;
    const impressions = perf.impressions || 0;
    const avgPosition = perf.avg_position || 50;
    // Higher is better: more clicks, more impressions, lower position
    const perfScore = (clicks * 2) + (impressions * 0.01) + Math.max(0, (50 - avgPosition));
    performanceScores.push(perfScore);

    // Extract individual signal scores
    const signals = qs.signals || qs.seven_signals || [];
    for (const name of signalNames) {
      const signal = Array.isArray(signals)
        ? signals.find(s => s.name === name)
        : null;
      signalArrays[name].push(signal ? (signal.score || 0) : 0);
    }
  }

  // Compute correlations
  const correlations = {};
  for (const name of signalNames) {
    correlations[name] = pearsonCorrelation(signalArrays[name], performanceScores);
  }

  // Compute adjustments based on correlation vs current weight proportion
  const adjustments = {};
  const correlationSum = signalNames.reduce((s, name) => s + Math.max(0, correlations[name]), 0);

  if (correlationSum > 0) {
    for (const name of signalNames) {
      const idealWeight = Math.max(0, correlations[name]) / correlationSum;
      const currentWeight = currentWeights[name];
      // Move toward ideal weight at learning rate
      adjustments[name] = Math.round((idealWeight - currentWeight) * LEARNING_RATE * 10000) / 10000;
    }
  } else {
    // All correlations are zero or negative — keep current weights
    for (const name of signalNames) {
      adjustments[name] = 0;
    }
  }

  // Apply adjustments
  const newWeights = {};
  for (const name of signalNames) {
    newWeights[name] = currentWeights[name] + adjustments[name];
  }

  // Normalize to satisfy constraints
  const normalizedWeights = normalizeWeights(newWeights);

  // Confidence based on sample size (sigmoid-like: 50% at 50 samples, 90% at 200)
  const confidence = Math.round(Math.min(1.0, articles.length / (articles.length + 50)) * 100) / 100;

  // Store the new weights
  userQualityWeights.set(userId, normalizedWeights);

  logger.info('recalibration_quality_gate_completed', {
    userId,
    sampleSize: articles.length,
    confidence,
    correlations,
    adjustments
  });

  return {
    weightsBefore: { ...currentWeights },
    weightsAfter: normalizedWeights,
    correlations,
    adjustments,
    sampleSize: articles.length,
    confidence,
    skipped: false
  };
}

/**
 * Recalibrate topic recommender weights based on recommendation outcomes.
 *
 * @param {string} userId
 * @returns {Promise<Object>} { weightsBefore, weightsAfter, correlations, adjustments, sampleSize, confidence }
 */
async function recalibrateRecommenderWeights(userId) {
  logger.info('recalibration_recommender_started', { userId });

  const outcomes = await fetchRecommendationOutcomes(userId);
  const currentWeights = getCurrentRecommenderWeights(userId);

  if (outcomes.length < MIN_SAMPLE_SIZE) {
    logger.warn('recalibration_recommender_insufficient_data', {
      userId, sampleSize: outcomes.length, required: MIN_SAMPLE_SIZE
    });
    return {
      weightsBefore: { ...currentWeights },
      weightsAfter: { ...currentWeights },
      correlations: {},
      adjustments: {},
      sampleSize: outcomes.length,
      confidence: 0,
      skipped: true,
      reason: `Insufficient data: ${outcomes.length} recommendations, need at least ${MIN_SAMPLE_SIZE}`
    };
  }

  // Extract component scores and outcome metric
  const componentNames = Object.keys(DEFAULT_TOPIC_RECOMMENDER_WEIGHTS);
  const componentArrays = {};
  for (const name of componentNames) {
    componentArrays[name] = [];
  }
  const outcomeScores = [];

  for (const rec of outcomes) {
    const meta = rec.analysis_metadata || {};
    const scoring = meta.scoring || meta;
    const components = scoring.components || {};

    // Outcome metric: clicks as primary success indicator
    const clicks = rec.clicks || 0;
    const impressions = rec.impressions || 0;
    const outcomeScore = clicks + (impressions * 0.01);
    outcomeScores.push(outcomeScore);

    for (const name of componentNames) {
      const comp = components[name];
      componentArrays[name].push(comp ? (comp.score || 0) : 0);
    }
  }

  // Compute correlations
  const correlations = {};
  for (const name of componentNames) {
    correlations[name] = pearsonCorrelation(componentArrays[name], outcomeScores);
  }

  // Compute adjustments
  const adjustments = {};
  const correlationSum = componentNames.reduce((s, name) => s + Math.max(0, correlations[name]), 0);

  if (correlationSum > 0) {
    for (const name of componentNames) {
      const idealWeight = Math.max(0, correlations[name]) / correlationSum;
      const currentWeight = currentWeights[name];
      adjustments[name] = Math.round((idealWeight - currentWeight) * LEARNING_RATE * 10000) / 10000;
    }
  } else {
    for (const name of componentNames) {
      adjustments[name] = 0;
    }
  }

  // Apply adjustments and normalize
  const newWeights = {};
  for (const name of componentNames) {
    newWeights[name] = currentWeights[name] + adjustments[name];
  }

  const normalizedWeights = normalizeWeights(newWeights);
  const confidence = Math.round(Math.min(1.0, outcomes.length / (outcomes.length + 50)) * 100) / 100;

  userRecommenderWeights.set(userId, normalizedWeights);

  logger.info('recalibration_recommender_completed', {
    userId,
    sampleSize: outcomes.length,
    confidence,
    correlations,
    adjustments
  });

  return {
    weightsBefore: { ...currentWeights },
    weightsAfter: normalizedWeights,
    correlations,
    adjustments,
    sampleSize: outcomes.length,
    confidence,
    skipped: false
  };
}

// ── Weight Access ───────────────────────────────────────────────

/**
 * Get current quality gate weights for a user (with overrides if recalibrated).
 *
 * @param {string} userId
 * @returns {Object<string, number>}
 */
function getCurrentQualityGateWeights(userId) {
  return userQualityWeights.get(userId) || { ...DEFAULT_QUALITY_GATE_WEIGHTS };
}

/**
 * Get current recommender weights for a user (with overrides if recalibrated).
 *
 * @param {string} userId
 * @returns {Object<string, number>}
 */
function getCurrentRecommenderWeights(userId) {
  return userRecommenderWeights.get(userId) || { ...DEFAULT_TOPIC_RECOMMENDER_WEIGHTS };
}

// ── Persistence (Supabase) ──────────────────────────────────────

/**
 * Save a recalibration run and weight snapshot to Supabase.
 *
 * @param {string} userId
 * @param {string} runId
 * @param {string} runType - 'quality_gate' | 'topic_recommender' | 'both'
 * @param {string} status - 'running' | 'completed' | 'failed'
 * @param {Object} [result] - recalibration result data
 * @returns {Promise<void>}
 */
async function persistRun(userId, runId, runType, status, result = null) {
  try {
    const { config, serviceRoleKey } = getSupabaseAdmin();

    // Upsert run record
    const runPayload = {
      id: runId,
      user_id: userId,
      run_type: runType,
      status,
      sample_size: result ? (result.sampleSize || 0) : 0,
      started_at: new Date().toISOString(),
      completed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : null,
      error_message: result && result.reason ? result.reason : null
    };

    await fetch(`${config.url}/rest/v1/scoring_recalibration_runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(runPayload)
    });

    // Save weight history if we have results
    if (result && !result.skipped) {
      const weightType = runType === 'both' ? 'quality_gate' : runType;
      const historyPayload = {
        run_id: runId,
        user_id: userId,
        weight_type: weightType,
        weights_before: result.weightsBefore,
        weights_after: result.weightsAfter,
        correlations: result.correlations,
        adjustments: result.adjustments,
        sample_size: result.sampleSize,
        confidence: result.confidence
      };

      await fetch(`${config.url}/rest/v1/scoring_weight_history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': 'Bearer ' + serviceRoleKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(historyPayload)
      });
    }

    logger.info('recalibration_persist_success', { userId, runId, status });
  } catch (e) {
    logger.error('recalibration_persist_failed', { userId, runId, error: e.message });
    // Non-fatal — in-memory state is still valid
  }
}

/**
 * Fetch weight history from Supabase.
 *
 * @param {string} userId
 * @param {Object} [options]
 * @param {string} [options.weightType] - 'quality_gate' | 'topic_recommender'
 * @param {number} [options.limit] - max rows (default 50)
 * @returns {Promise<Array>}
 */
async function fetchWeightHistory(userId, options = {}) {
  const { config, serviceRoleKey } = getSupabaseAdmin();
  const limit = Math.min(options.limit || 50, 200);
  let url = `${config.url}/rest/v1/scoring_weight_history` +
    `?user_id=eq.${encodeURIComponent(userId)}` +
    `&select=id,run_id,weight_type,weights_before,weights_after,correlations,adjustments,sample_size,confidence,created_at` +
    `&order=created_at.desc` +
    `&limit=${limit}`;

  if (options.weightType) {
    url += `&weight_type=eq.${encodeURIComponent(options.weightType)}`;
  }

  const res = await fetch(url, {
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey
    }
  });

  if (!res.ok) {
    logger.error('recalibration_fetch_history_failed', { status: res.status, userId });
    return [];
  }

  return await res.json();
}

// ── API Handlers ────────────────────────────────────────────────

/**
 * POST /api/recalibration/run — trigger a full recalibration cycle.
 *
 * @param {string} userId
 * @param {Object} body - { type?: 'quality_gate' | 'topic_recommender' | 'both' }
 * @returns {Promise<Object>}
 */
async function handleRun(userId, body = {}) {
  const runType = ['quality_gate', 'topic_recommender', 'both'].includes(body.type)
    ? body.type
    : 'both';
  const runId = generateId();

  logger.info('recalibration_run_started', { userId, runId, runType });

  const run = {
    run_id: runId,
    user_id: userId,
    run_type: runType,
    status: 'running',
    started_at: new Date().toISOString(),
    completed_at: null,
    results: null,
    error: null
  };

  runStore.set(runId, run);

  // Execute recalibration asynchronously
  (async () => {
    try {
      const results = {};

      if (runType === 'quality_gate' || runType === 'both') {
        results.quality_gate = await recalibrateQualityGateWeights(userId);
        await persistRun(userId, runId, 'quality_gate',
          results.quality_gate.skipped ? 'completed' : 'completed',
          results.quality_gate);
      }

      if (runType === 'topic_recommender' || runType === 'both') {
        results.topic_recommender = await recalibrateRecommenderWeights(userId);
        // Persist recommender result with a separate history entry
        if (runType === 'both') {
          await persistRun(userId, generateId(), 'topic_recommender',
            results.topic_recommender.skipped ? 'completed' : 'completed',
            results.topic_recommender);
        } else {
          await persistRun(userId, runId, 'topic_recommender',
            results.topic_recommender.skipped ? 'completed' : 'completed',
            results.topic_recommender);
        }
      }

      run.status = 'completed';
      run.completed_at = new Date().toISOString();
      run.results = results;

      logger.info('recalibration_run_completed', { userId, runId });
    } catch (e) {
      run.status = 'failed';
      run.completed_at = new Date().toISOString();
      run.error = e.message;

      logger.error('recalibration_run_failed', { userId, runId, error: e.message });
      await persistRun(userId, runId, runType, 'failed', { reason: e.message, sampleSize: 0 });
    }
  })();

  return run;
}

/**
 * GET /api/recalibration/history — fetch weight change history.
 *
 * @param {string} userId
 * @param {Object} query - { type?, limit? }
 * @returns {Promise<Object>}
 */
async function handleHistory(userId, query = {}) {
  logger.info('recalibration_history_requested', { userId, query });

  const history = await fetchWeightHistory(userId, {
    weightType: query.type || null,
    limit: parseInt(query.limit || '50', 10)
  });

  return {
    items: history,
    total: history.length
  };
}

/**
 * GET /api/recalibration/current-weights — get current effective weights.
 *
 * @param {string} userId
 * @returns {Object}
 */
function handleCurrentWeights(userId) {
  logger.info('recalibration_current_weights_requested', { userId });

  const qgWeights = getCurrentQualityGateWeights(userId);
  const recWeights = getCurrentRecommenderWeights(userId);

  const qgIsDefault = !userQualityWeights.has(userId);
  const recIsDefault = !userRecommenderWeights.has(userId);

  return {
    quality_gate: {
      weights: qgWeights,
      is_default: qgIsDefault,
      signal_count: Object.keys(qgWeights).length,
      sum: Math.round(Object.values(qgWeights).reduce((s, w) => s + w, 0) * 10000) / 10000
    },
    topic_recommender: {
      weights: recWeights,
      is_default: recIsDefault,
      component_count: Object.keys(recWeights).length,
      sum: Math.round(Object.values(recWeights).reduce((s, w) => s + w, 0) * 10000) / 10000
    },
    constraints: {
      max_weight: MAX_WEIGHT,
      min_weight: MIN_WEIGHT,
      learning_rate: LEARNING_RATE,
      min_sample_size: MIN_SAMPLE_SIZE
    }
  };
}

// ── Exports ─────────────────────────────────────────────────────

module.exports = {
  // API handlers
  handleRun,
  handleHistory,
  handleCurrentWeights,
  // Weight access (for use by other modules)
  getCurrentQualityGateWeights,
  getCurrentRecommenderWeights,
  // Core logic (exported for testing)
  pearsonCorrelation,
  normalizeWeights,
  recalibrateQualityGateWeights,
  recalibrateRecommenderWeights,
  // Constants (exported for testing)
  DEFAULT_QUALITY_GATE_WEIGHTS,
  DEFAULT_TOPIC_RECOMMENDER_WEIGHTS,
  MAX_WEIGHT,
  MIN_WEIGHT,
  MIN_SAMPLE_SIZE,
  LEARNING_RATE
};
