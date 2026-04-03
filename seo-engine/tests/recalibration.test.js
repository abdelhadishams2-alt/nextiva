/**
 * Tests for Scoring Weight Recalibration Engine — FL-002
 *
 * Uses node:test (zero npm dependencies).
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const {
  pearsonCorrelation,
  normalizeWeights,
  getCurrentQualityGateWeights,
  getCurrentRecommenderWeights,
  handleCurrentWeights,
  DEFAULT_QUALITY_GATE_WEIGHTS,
  DEFAULT_TOPIC_RECOMMENDER_WEIGHTS,
  MAX_WEIGHT,
  MIN_WEIGHT,
  MIN_SAMPLE_SIZE,
  LEARNING_RATE
} = require('../bridge/intelligence/recalibration');

// ── pearsonCorrelation Tests ────────────────────────────────────

describe('pearsonCorrelation', () => {
  it('returns 1.0 for perfectly correlated arrays', () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = [2, 4, 6, 8, 10];
    const r = pearsonCorrelation(xs, ys);
    assert.ok(Math.abs(r - 1.0) < 0.0001, `Expected ~1.0, got ${r}`);
  });

  it('returns -1.0 for perfectly inversely correlated arrays', () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = [10, 8, 6, 4, 2];
    const r = pearsonCorrelation(xs, ys);
    assert.ok(Math.abs(r - (-1.0)) < 0.0001, `Expected ~-1.0, got ${r}`);
  });

  it('returns 0 for uncorrelated arrays', () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = [5, 5, 5, 5, 5]; // constant — zero variance
    const r = pearsonCorrelation(xs, ys);
    assert.equal(r, 0);
  });

  it('returns 0 for insufficient data (fewer than 3 points)', () => {
    assert.equal(pearsonCorrelation([1, 2], [3, 4]), 0);
    assert.equal(pearsonCorrelation([1], [2]), 0);
    assert.equal(pearsonCorrelation([], []), 0);
  });

  it('handles mismatched array lengths by using the shorter length', () => {
    const xs = [1, 2, 3, 4, 5, 6, 7];
    const ys = [2, 4, 6];
    const r = pearsonCorrelation(xs, ys);
    assert.ok(Math.abs(r - 1.0) < 0.0001, `Expected ~1.0, got ${r}`);
  });

  it('returns a value between -1 and 1 for realistic data', () => {
    const xs = [7.5, 8.2, 6.1, 9.0, 5.5, 7.8, 8.5, 6.9, 7.2, 8.1];
    const ys = [120, 150, 80, 200, 60, 130, 160, 100, 110, 145];
    const r = pearsonCorrelation(xs, ys);
    assert.ok(r >= -1 && r <= 1, `Correlation out of range: ${r}`);
    assert.ok(r > 0.9, `Expected strong positive correlation, got ${r}`);
  });
});

// ── normalizeWeights Tests ──────────────────────────────────────

describe('normalizeWeights', () => {
  it('returns weights that sum to 1.0', () => {
    const input = { a: 0.3, b: 0.2, c: 0.15, d: 0.1, e: 0.1, f: 0.08, g: 0.07 };
    const result = normalizeWeights(input);
    const sum = Object.values(result).reduce((s, w) => s + w, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.001, `Sum should be 1.0, got ${sum}`);
  });

  it('clamps weights above MAX_WEIGHT (0.35)', () => {
    const input = { a: 0.50, b: 0.20, c: 0.15, d: 0.15 };
    const result = normalizeWeights(input);
    for (const [key, val] of Object.entries(result)) {
      assert.ok(val <= MAX_WEIGHT + 0.0001, `Weight ${key}=${val} exceeds MAX_WEIGHT ${MAX_WEIGHT}`);
    }
  });

  it('clamps weights below MIN_WEIGHT (0.05)', () => {
    const input = { a: 0.30, b: 0.30, c: 0.30, d: 0.09, e: 0.01 };
    const result = normalizeWeights(input);
    for (const [key, val] of Object.entries(result)) {
      assert.ok(val >= MIN_WEIGHT - 0.0001, `Weight ${key}=${val} below MIN_WEIGHT ${MIN_WEIGHT}`);
    }
  });

  it('preserves original weights when they already satisfy constraints', () => {
    const input = { a: 0.30, b: 0.25, c: 0.20, d: 0.15, e: 0.10 };
    const result = normalizeWeights(input);
    const sum = Object.values(result).reduce((s, w) => s + w, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.001);
    // Weights should be close to input since they already satisfy constraints
    for (const key of Object.keys(input)) {
      assert.ok(Math.abs(result[key] - input[key]) < 0.02, `Weight ${key} changed too much`);
    }
  });

  it('handles all equal weights', () => {
    const input = { a: 1, b: 1, c: 1, d: 1, e: 1 };
    const result = normalizeWeights(input);
    const sum = Object.values(result).reduce((s, w) => s + w, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.001);
    for (const val of Object.values(result)) {
      assert.ok(Math.abs(val - 0.2) < 0.001);
    }
  });

  it('handles the exact 7-signal weight structure', () => {
    const result = normalizeWeights({ ...DEFAULT_QUALITY_GATE_WEIGHTS });
    const sum = Object.values(result).reduce((s, w) => s + w, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.001);
    assert.equal(Object.keys(result).length, 7);
  });

  it('handles the exact 5-component weight structure', () => {
    const result = normalizeWeights({ ...DEFAULT_TOPIC_RECOMMENDER_WEIGHTS });
    const sum = Object.values(result).reduce((s, w) => s + w, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.001);
    assert.equal(Object.keys(result).length, 5);
  });

  it('handles extreme skew by redistributing and always summing to 1.0', () => {
    const input = { a: 0.90, b: 0.02, c: 0.02, d: 0.03, e: 0.03 };
    const result = normalizeWeights(input);
    const sum = Object.values(result).reduce((s, w) => s + w, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.001, `Sum must be 1.0, got ${sum}`);
    // With extreme skew the largest weight is reduced significantly
    assert.ok(result.a < input.a, `Weight a should be reduced from ${input.a}`);
    assert.ok(result.b >= MIN_WEIGHT - 0.0001);
  });
});

// ── Default Weights Tests ───────────────────────────────────────

describe('DEFAULT_QUALITY_GATE_WEIGHTS', () => {
  it('has exactly 7 signals', () => {
    assert.equal(Object.keys(DEFAULT_QUALITY_GATE_WEIGHTS).length, 7);
  });

  it('sums to 1.0', () => {
    const sum = Object.values(DEFAULT_QUALITY_GATE_WEIGHTS).reduce((s, w) => s + w, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.001, `Sum should be 1.0, got ${sum}`);
  });

  it('all weights are within constraints', () => {
    for (const [name, weight] of Object.entries(DEFAULT_QUALITY_GATE_WEIGHTS)) {
      assert.ok(weight >= MIN_WEIGHT, `${name} weight ${weight} below min ${MIN_WEIGHT}`);
      assert.ok(weight <= MAX_WEIGHT, `${name} weight ${weight} above max ${MAX_WEIGHT}`);
    }
  });
});

describe('DEFAULT_TOPIC_RECOMMENDER_WEIGHTS', () => {
  it('has exactly 5 components', () => {
    assert.equal(Object.keys(DEFAULT_TOPIC_RECOMMENDER_WEIGHTS).length, 5);
  });

  it('sums to 1.0', () => {
    const sum = Object.values(DEFAULT_TOPIC_RECOMMENDER_WEIGHTS).reduce((s, w) => s + w, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.001, `Sum should be 1.0, got ${sum}`);
  });

  it('all weights are within constraints', () => {
    for (const [name, weight] of Object.entries(DEFAULT_TOPIC_RECOMMENDER_WEIGHTS)) {
      assert.ok(weight >= MIN_WEIGHT, `${name} weight ${weight} below min ${MIN_WEIGHT}`);
      assert.ok(weight <= MAX_WEIGHT, `${name} weight ${weight} above max ${MAX_WEIGHT}`);
    }
  });
});

// ── Constants Tests ─────────────────────────────────────────────

describe('constraints', () => {
  it('MAX_WEIGHT is 0.35', () => {
    assert.equal(MAX_WEIGHT, 0.35);
  });

  it('MIN_WEIGHT is 0.05', () => {
    assert.equal(MIN_WEIGHT, 0.05);
  });

  it('MIN_SAMPLE_SIZE is at least 5', () => {
    assert.ok(MIN_SAMPLE_SIZE >= 5);
  });

  it('LEARNING_RATE is between 0 and 1', () => {
    assert.ok(LEARNING_RATE > 0 && LEARNING_RATE < 1);
  });
});

// ── getCurrentWeights Tests ─────────────────────────────────────

describe('getCurrentQualityGateWeights', () => {
  it('returns default weights for unknown user', () => {
    const weights = getCurrentQualityGateWeights('unknown-user-id');
    assert.deepStrictEqual(weights, DEFAULT_QUALITY_GATE_WEIGHTS);
  });

  it('returns a copy, not a reference to defaults', () => {
    const w1 = getCurrentQualityGateWeights('test-user-copy');
    const w2 = getCurrentQualityGateWeights('test-user-copy');
    assert.notEqual(w1, w2); // different objects
    assert.deepStrictEqual(w1, w2); // same content
  });
});

describe('getCurrentRecommenderWeights', () => {
  it('returns default weights for unknown user', () => {
    const weights = getCurrentRecommenderWeights('unknown-user-id');
    assert.deepStrictEqual(weights, DEFAULT_TOPIC_RECOMMENDER_WEIGHTS);
  });
});

// ── handleCurrentWeights Tests ──────────────────────────────────

describe('handleCurrentWeights', () => {
  it('returns both weight sets with metadata', () => {
    const result = handleCurrentWeights('test-user-current');
    assert.ok(result.quality_gate);
    assert.ok(result.topic_recommender);
    assert.ok(result.constraints);

    assert.equal(result.quality_gate.signal_count, 7);
    assert.equal(result.topic_recommender.component_count, 5);
    assert.ok(Math.abs(result.quality_gate.sum - 1.0) < 0.001);
    assert.ok(Math.abs(result.topic_recommender.sum - 1.0) < 0.001);
  });

  it('marks weights as default when no recalibration has occurred', () => {
    const result = handleCurrentWeights('never-calibrated-user');
    assert.equal(result.quality_gate.is_default, true);
    assert.equal(result.topic_recommender.is_default, true);
  });

  it('includes constraint values', () => {
    const result = handleCurrentWeights('test-constraints');
    assert.equal(result.constraints.max_weight, MAX_WEIGHT);
    assert.equal(result.constraints.min_weight, MIN_WEIGHT);
    assert.equal(result.constraints.learning_rate, LEARNING_RATE);
    assert.equal(result.constraints.min_sample_size, MIN_SAMPLE_SIZE);
  });
});

// ── Edge Cases for normalizeWeights ─────────────────────────────

describe('normalizeWeights edge cases', () => {
  it('handles two weights — sum to 1.0 even if individual constraints are impossible', () => {
    const result = normalizeWeights({ a: 0.7, b: 0.3 });
    const sum = Object.values(result).reduce((s, w) => s + w, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.001, `Sum must be 1.0, got ${sum}`);
    // With only 2 weights, both must exceed MAX_WEIGHT to sum to 1.0
    // The algorithm prioritizes sum=1.0 over individual clamping
    assert.ok(result.a > 0 && result.b > 0, 'Both weights must be positive');
  });

  it('handles many weights (10)', () => {
    const input = {};
    for (let i = 0; i < 10; i++) {
      input[`s${i}`] = 0.1;
    }
    const result = normalizeWeights(input);
    const sum = Object.values(result).reduce((s, w) => s + w, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.001);
  });

  it('handles all weights at max — redistributes evenly', () => {
    const input = { a: 0.35, b: 0.35, c: 0.35, d: 0.35 };
    const result = normalizeWeights(input);
    const sum = Object.values(result).reduce((s, w) => s + w, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.001);
    for (const val of Object.values(result)) {
      assert.ok(val >= MIN_WEIGHT - 0.0001);
      assert.ok(val <= MAX_WEIGHT + 0.0001);
    }
  });

  it('handles negative weights by clamping to MIN_WEIGHT', () => {
    const input = { a: 0.6, b: -0.1, c: 0.3, d: 0.2 };
    const result = normalizeWeights(input);
    assert.ok(result.b >= MIN_WEIGHT - 0.0001, `Negative weight should be clamped: ${result.b}`);
    const sum = Object.values(result).reduce((s, w) => s + w, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.001);
  });
});
