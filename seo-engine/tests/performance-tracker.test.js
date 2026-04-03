/**
 * Tests for 30/60/90 Day Performance Tracker — FL-001
 *
 * Uses node:test (zero npm dependencies).
 * Tests all pure/exported helper functions and velocity metrics computation.
 * API handlers require Supabase and are tested via integration tests.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  computeVelocityMetrics,
  determinePredictionStatus,
  generatePrediction,
  estimateValue,
  formatDate,
  daysBetween
} = require('../bridge/intelligence/performance-tracker');

// ── formatDate ─────────────────────────────────────────────────

describe('formatDate', () => {
  it('should format a date as YYYY-MM-DD', () => {
    assert.equal(formatDate(new Date('2026-03-15T12:00:00Z')), '2026-03-15');
  });

  it('should pad single-digit months and days', () => {
    assert.equal(formatDate(new Date('2026-01-05T00:00:00Z')), '2026-01-05');
  });

  it('should handle end of year', () => {
    assert.equal(formatDate(new Date('2025-12-31T23:59:59Z')), '2025-12-31');
  });

  it('should handle start of year', () => {
    assert.equal(formatDate(new Date('2026-01-01T00:00:00Z')), '2026-01-01');
  });
});

// ── daysBetween ────────────────────────────────────────────────

describe('daysBetween', () => {
  it('should return 0 for the same date', () => {
    assert.equal(daysBetween('2026-03-15', '2026-03-15'), 0);
  });

  it('should return 30 for dates 30 days apart', () => {
    assert.equal(daysBetween('2026-01-01', '2026-01-31'), 30);
  });

  it('should return 90 for dates 90 days apart', () => {
    assert.equal(daysBetween('2026-01-01', '2026-04-01'), 90);
  });

  it('should return negative for reversed dates', () => {
    assert.equal(daysBetween('2026-03-15', '2026-03-10'), -5);
  });
});

// ── computeVelocityMetrics ─────────────────────────────────────

describe('computeVelocityMetrics', () => {
  it('should compute click velocity as clicks per day', () => {
    const actuals = { clicks: 300, impressions: 10000, avgCtr: 0.03, avgPosition: 5.5, dataPoints: 30 };
    const result = computeVelocityMetrics(actuals, 30, null);
    assert.equal(result.clickVelocity, 10);
  });

  it('should compute impression growth rate with previous milestone', () => {
    const actuals = { clicks: 600, impressions: 20000, avgCtr: 0.03, avgPosition: 4.0, dataPoints: 60 };
    const previous = { clicks: 300, impressions: 10000, avgCtr: 0.03, avgPosition: 5.5, dataPoints: 30 };
    const result = computeVelocityMetrics(actuals, 60, previous);
    assert.equal(result.impressionGrowthRate, 1.0); // 100% growth
  });

  it('should compute position improvement (positive = improved)', () => {
    const actuals = { clicks: 900, impressions: 30000, avgCtr: 0.03, avgPosition: 3.0, dataPoints: 90 };
    const previous = { clicks: 600, impressions: 20000, avgCtr: 0.03, avgPosition: 5.0, dataPoints: 60 };
    const result = computeVelocityMetrics(actuals, 90, previous);
    assert.equal(result.positionImprovement, 2.0); // improved by 2 positions
  });

  it('should compute CTR trend as percentage change', () => {
    const actuals = { clicks: 600, impressions: 15000, avgCtr: 0.04, avgPosition: 4.0, dataPoints: 60 };
    const previous = { clicks: 300, impressions: 10000, avgCtr: 0.03, avgPosition: 5.0, dataPoints: 30 };
    const result = computeVelocityMetrics(actuals, 60, previous);
    // CTR went from 0.03 to 0.04 = 33.33% increase
    assert.ok(Math.abs(result.ctrTrend - 0.3333) < 0.001);
  });

  it('should return zeros when no previous milestone', () => {
    const actuals = { clicks: 100, impressions: 5000, avgCtr: 0.02, avgPosition: 8.0, dataPoints: 30 };
    const result = computeVelocityMetrics(actuals, 30, null);
    assert.equal(result.impressionGrowthRate, 0);
    assert.equal(result.positionImprovement, 0);
    assert.equal(result.ctrTrend, 0);
  });

  it('should handle zero milestone days gracefully', () => {
    const actuals = { clicks: 100, impressions: 5000, avgCtr: 0.02, avgPosition: 8.0, dataPoints: 0 };
    const result = computeVelocityMetrics(actuals, 0, null);
    assert.equal(result.clickVelocity, 0);
  });
});

// ── determinePredictionStatus ──────────────────────────────────

describe('determinePredictionStatus', () => {
  it('should return "exceeded" when actual >= 120% of predicted', () => {
    assert.equal(determinePredictionStatus(120, 100), 'exceeded');
    assert.equal(determinePredictionStatus(200, 100), 'exceeded');
  });

  it('should return "met" when actual >= 80% and < 120% of predicted', () => {
    assert.equal(determinePredictionStatus(100, 100), 'met');
    assert.equal(determinePredictionStatus(80, 100), 'met');
    assert.equal(determinePredictionStatus(119, 100), 'met');
  });

  it('should return "missed" when actual < 80% of predicted', () => {
    assert.equal(determinePredictionStatus(50, 100), 'missed');
    assert.equal(determinePredictionStatus(79, 100), 'missed');
    assert.equal(determinePredictionStatus(0, 100), 'missed');
  });

  it('should return "met" when predicted is 0 (no divide by zero)', () => {
    assert.equal(determinePredictionStatus(50, 0), 'met');
    assert.equal(determinePredictionStatus(0, 0), 'met');
  });

  it('should return "met" when predicted is null', () => {
    assert.equal(determinePredictionStatus(50, null), 'met');
  });
});

// ── generatePrediction ─────────────────────────────────────────

describe('generatePrediction', () => {
  it('should generate predictions for 30-day milestone', () => {
    const earlyData = { clicks: 70, impressions: 3500, avgCtr: 0.02, avgPosition: 8.0, dataPoints: 7 };
    const result = generatePrediction(earlyData, 30);
    // 70 clicks / 7 days = 10/day * 30 days * 1.0 growth = 300
    assert.equal(result.clicks, 300);
    assert.equal(result.impressions, 15000);
  });

  it('should apply growth factor for 60-day milestone', () => {
    const earlyData = { clicks: 70, impressions: 3500, avgCtr: 0.02, avgPosition: 8.0, dataPoints: 7 };
    const result = generatePrediction(earlyData, 60);
    // 10/day * 60 * 1.3 = 780
    assert.equal(result.clicks, 780);
  });

  it('should apply larger growth factor for 90-day milestone', () => {
    const earlyData = { clicks: 70, impressions: 3500, avgCtr: 0.02, avgPosition: 8.0, dataPoints: 7 };
    const result = generatePrediction(earlyData, 90);
    // 10/day * 90 * 1.5 = 1350
    assert.equal(result.clicks, 1350);
  });

  it('should return zeros for null early data', () => {
    const result = generatePrediction(null, 30);
    assert.equal(result.clicks, 0);
    assert.equal(result.impressions, 0);
    assert.equal(result.position, 50);
    assert.equal(result.ctr, 0);
  });

  it('should return zeros for zero data points', () => {
    const earlyData = { clicks: 0, impressions: 0, avgCtr: 0, avgPosition: 0, dataPoints: 0 };
    const result = generatePrediction(earlyData, 30);
    assert.equal(result.clicks, 0);
    assert.equal(result.impressions, 0);
  });

  it('should predict improved position (10% better)', () => {
    const earlyData = { clicks: 70, impressions: 3500, avgCtr: 0.02, avgPosition: 10.0, dataPoints: 7 };
    const result = generatePrediction(earlyData, 30);
    assert.equal(result.position, 9); // 10 * 0.9 = 9
  });

  it('should clamp position to minimum 1', () => {
    const earlyData = { clicks: 70, impressions: 3500, avgCtr: 0.02, avgPosition: 0.5, dataPoints: 7 };
    const result = generatePrediction(earlyData, 30);
    assert.ok(result.position >= 1);
  });

  it('should clamp CTR to maximum 1', () => {
    const earlyData = { clicks: 70, impressions: 3500, avgCtr: 0.9, avgPosition: 5.0, dataPoints: 7 };
    const result = generatePrediction(earlyData, 90);
    // 0.9 * 1.5 = 1.35, should clamp to 1
    assert.ok(result.ctr <= 1);
  });
});

// ── estimateValue ──────────────────────────────────────────────

describe('estimateValue', () => {
  it('should estimate value using default CPC ($0.50)', () => {
    assert.equal(estimateValue(100), 50.00);
    assert.equal(estimateValue(1000), 500.00);
  });

  it('should estimate value with custom CPC', () => {
    assert.equal(estimateValue(100, 1.25), 125.00);
    assert.equal(estimateValue(200, 0.75), 150.00);
  });

  it('should return 0 for zero clicks', () => {
    assert.equal(estimateValue(0), 0);
  });

  it('should round to 2 decimal places', () => {
    const value = estimateValue(3, 0.33);
    assert.equal(value, 0.99);
  });
});

// ── Edge Cases ─────────────────────────────────────────────────

describe('Edge cases', () => {
  it('computeVelocityMetrics with very large numbers', () => {
    const actuals = { clicks: 1000000, impressions: 50000000, avgCtr: 0.02, avgPosition: 1.5, dataPoints: 90 };
    const result = computeVelocityMetrics(actuals, 90, null);
    assert.ok(result.clickVelocity > 0);
    assert.ok(isFinite(result.clickVelocity));
  });

  it('computeVelocityMetrics with declining performance', () => {
    const actuals = { clicks: 100, impressions: 5000, avgCtr: 0.02, avgPosition: 15.0, dataPoints: 60 };
    const previous = { clicks: 300, impressions: 10000, avgCtr: 0.03, avgPosition: 5.0, dataPoints: 30 };
    const result = computeVelocityMetrics(actuals, 60, previous);
    assert.ok(result.impressionGrowthRate < 0); // declining impressions
    assert.ok(result.positionImprovement < 0);  // worsening position
    assert.ok(result.ctrTrend < 0);             // declining CTR
  });

  it('determinePredictionStatus boundary at exactly 80%', () => {
    assert.equal(determinePredictionStatus(80, 100), 'met');
  });

  it('determinePredictionStatus boundary at exactly 120%', () => {
    assert.equal(determinePredictionStatus(120, 100), 'exceeded');
  });
});
