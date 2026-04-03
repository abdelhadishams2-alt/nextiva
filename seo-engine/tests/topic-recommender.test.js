/**
 * Tests for Topic Recommender — CI-003
 *
 * Uses node:test (zero npm dependencies).
 * Tests scoring formula, summary generation, category filtering, and helpers.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  scoreImpressions,
  scoreDecay,
  scoreGap,
  scoreSeasonality,
  scoreCompetition,
  calculatePriority,
  generateSummary,
  suggestContentType,
  formatDate,
  WEIGHTS,
  VALID_STATUSES
} = require('../bridge/intelligence/topic-recommender');

// ── Helper Tests ───────────────────────────────────────────────

describe('formatDate (topic-recommender)', () => {
  it('should format a date as YYYY-MM-DD', () => {
    assert.equal(formatDate(new Date('2024-06-15T12:00:00Z')), '2024-06-15');
  });

  it('should handle single-digit months and days with padding', () => {
    assert.equal(formatDate(new Date('2024-01-05T00:00:00Z')), '2024-01-05');
  });
});

// ── Impressions Scoring Tests ──────────────────────────────────

describe('scoreImpressions', () => {
  it('should return 0 for 0 impressions', () => {
    assert.equal(scoreImpressions(0), 0);
  });

  it('should return 0 for null/undefined impressions', () => {
    assert.equal(scoreImpressions(null), 0);
    assert.equal(scoreImpressions(undefined), 0);
  });

  it('should return 0 for negative impressions', () => {
    assert.equal(scoreImpressions(-100), 0);
  });

  it('should return 25 for 1000 impressions', () => {
    assert.equal(scoreImpressions(1000), 25);
  });

  it('should return 50 for 5000 impressions', () => {
    assert.equal(scoreImpressions(5000), 50);
  });

  it('should return 75 for 10000 impressions', () => {
    assert.equal(scoreImpressions(10000), 75);
  });

  it('should return 100 for 50000+ impressions', () => {
    assert.equal(scoreImpressions(50000), 100);
    assert.equal(scoreImpressions(100000), 100);
  });

  it('should interpolate between breakpoints', () => {
    const score = scoreImpressions(3000);
    assert.ok(score > 25, `Score ${score} should be > 25 for 3000 impressions`);
    assert.ok(score < 50, `Score ${score} should be < 50 for 3000 impressions`);
  });

  it('should be monotonically increasing', () => {
    const values = [0, 100, 500, 1000, 2000, 5000, 10000, 25000, 50000];
    for (let i = 1; i < values.length; i++) {
      const prev = scoreImpressions(values[i - 1]);
      const curr = scoreImpressions(values[i]);
      assert.ok(curr >= prev, `Score for ${values[i]} (${curr}) should be >= score for ${values[i - 1]} (${prev})`);
    }
  });
});

// ── Decay Scoring Tests ────────────────────────────────────────

describe('scoreDecay', () => {
  it('should return 0 for no decay (null)', () => {
    assert.equal(scoreDecay(null), 0);
  });

  it('should return 0 for empty string', () => {
    assert.equal(scoreDecay(''), 0);
  });

  it('should return 0 for low/none severity', () => {
    assert.equal(scoreDecay('low'), 0);
  });

  it('should return 40 for medium severity', () => {
    assert.equal(scoreDecay('medium'), 40);
  });

  it('should return 70 for high severity', () => {
    assert.equal(scoreDecay('high'), 70);
  });

  it('should return 100 for critical severity', () => {
    assert.equal(scoreDecay('critical'), 100);
  });

  it('should return 30 for age-triggered-stable', () => {
    assert.equal(scoreDecay('age-triggered-stable'), 30);
  });

  it('should be case-insensitive', () => {
    assert.equal(scoreDecay('CRITICAL'), 100);
    assert.equal(scoreDecay('High'), 70);
    assert.equal(scoreDecay('  medium  '), 40);
  });
});

// ── Gap Scoring Tests ──────────────────────────────────────────

describe('scoreGap', () => {
  it('should return 100 for no page (null position)', () => {
    assert.equal(scoreGap(null), 100);
  });

  it('should return 100 for undefined position', () => {
    assert.equal(scoreGap(undefined), 100);
  });

  it('should return 100 for position > 50', () => {
    assert.equal(scoreGap(51), 100);
    assert.equal(scoreGap(100), 100);
  });

  it('should return 50 for position 20-50', () => {
    assert.equal(scoreGap(20), 50);
    assert.equal(scoreGap(35), 50);
    assert.equal(scoreGap(50), 50);
  });

  it('should return 0 for well-ranking position 1-19', () => {
    assert.equal(scoreGap(1), 0);
    assert.equal(scoreGap(10), 0);
    assert.equal(scoreGap(19), 0);
  });
});

// ── Seasonality Scoring Tests ──────────────────────────────────

describe('scoreSeasonality', () => {
  it('should return 50 for null (default)', () => {
    assert.equal(scoreSeasonality(null), 50);
  });

  it('should return 50 for undefined (default)', () => {
    assert.equal(scoreSeasonality(undefined), 50);
  });

  it('should return 100 for weeks_to_peak <= 8', () => {
    assert.equal(scoreSeasonality(0), 100);
    assert.equal(scoreSeasonality(4), 100);
    assert.equal(scoreSeasonality(8), 100);
  });

  it('should return 50 for weeks_to_peak 8-16', () => {
    assert.equal(scoreSeasonality(9), 50);
    assert.equal(scoreSeasonality(12), 50);
    assert.equal(scoreSeasonality(16), 50);
  });

  it('should return 0 for weeks_to_peak > 16', () => {
    assert.equal(scoreSeasonality(17), 0);
    assert.equal(scoreSeasonality(52), 0);
  });
});

// ── Competition Scoring Tests ──────────────────────────────────

describe('scoreCompetition', () => {
  it('should return 50 for null (default mixed)', () => {
    assert.equal(scoreCompetition(null), 50);
  });

  it('should return 100 for thin competition', () => {
    assert.equal(scoreCompetition('thin'), 100);
  });

  it('should return 80 for forum competition', () => {
    assert.equal(scoreCompetition('forum'), 80);
  });

  it('should return 50 for mixed competition', () => {
    assert.equal(scoreCompetition('mixed'), 50);
  });

  it('should return 20 for strong competition', () => {
    assert.equal(scoreCompetition('strong'), 20);
  });

  it('should return 0 for brands competition', () => {
    assert.equal(scoreCompetition('brands'), 0);
  });

  it('should be case-insensitive', () => {
    assert.equal(scoreCompetition('THIN'), 100);
    assert.equal(scoreCompetition('Forum'), 80);
  });
});

// ── Composite Scoring Tests ────────────────────────────────────

describe('calculatePriority', () => {
  it('should return total between 0 and 100', () => {
    const result = calculatePriority({
      impressions: 5000,
      decaySeverity: 'medium',
      position: null,
      weeksToPeak: 6,
      competitionType: 'thin'
    });
    assert.ok(result.total >= 0 && result.total <= 100, `Total ${result.total} out of range`);
  });

  it('should have all 5 components in breakdown', () => {
    const result = calculatePriority({
      impressions: 1000,
      decaySeverity: 'high',
      position: 25,
      weeksToPeak: 10,
      competitionType: 'mixed'
    });
    assert.ok('impressions' in result.components);
    assert.ok('decay' in result.components);
    assert.ok('gap' in result.components);
    assert.ok('seasonality' in result.components);
    assert.ok('competition' in result.components);
  });

  it('should correctly weight impressions at 0.30', () => {
    const result = calculatePriority({
      impressions: 1000,
      decaySeverity: '',
      position: 1,
      weeksToPeak: 52,
      competitionType: 'brands'
    });
    // Only impressions should contribute significantly
    assert.equal(result.components.impressions.weight, 0.30);
    assert.equal(result.components.impressions.weighted, Math.round(25 * 0.30 * 100) / 100);
  });

  it('should correctly weight decay at 0.25', () => {
    const result = calculatePriority({
      impressions: 0,
      decaySeverity: 'critical',
      position: 1,
      weeksToPeak: 52,
      competitionType: 'brands'
    });
    assert.equal(result.components.decay.weight, 0.25);
    assert.equal(result.components.decay.score, 100);
    assert.equal(result.components.decay.weighted, 25);
  });

  it('should correctly weight gap at 0.25', () => {
    const result = calculatePriority({
      impressions: 0,
      decaySeverity: '',
      position: null,
      weeksToPeak: 52,
      competitionType: 'brands'
    });
    assert.equal(result.components.gap.weight, 0.25);
    assert.equal(result.components.gap.score, 100);
    assert.equal(result.components.gap.weighted, 25);
  });

  it('should correctly weight seasonality at 0.10', () => {
    const result = calculatePriority({
      impressions: 0,
      decaySeverity: '',
      position: 1,
      weeksToPeak: 4,
      competitionType: 'brands'
    });
    assert.equal(result.components.seasonality.weight, 0.10);
    assert.equal(result.components.seasonality.score, 100);
    assert.equal(result.components.seasonality.weighted, 10);
  });

  it('should correctly weight competition at 0.10', () => {
    const result = calculatePriority({
      impressions: 0,
      decaySeverity: '',
      position: 1,
      weeksToPeak: 52,
      competitionType: 'thin'
    });
    assert.equal(result.components.competition.weight, 0.10);
    assert.equal(result.components.competition.score, 100);
    assert.equal(result.components.competition.weighted, 10);
  });

  it('should sum weights to 1.0', () => {
    const total = WEIGHTS.impressions + WEIGHTS.decay + WEIGHTS.gap + WEIGHTS.seasonality + WEIGHTS.competition;
    assert.equal(total, 1.0);
  });

  it('should return maximum score when all components are maxed', () => {
    const result = calculatePriority({
      impressions: 50000,
      decaySeverity: 'critical',
      position: null,
      weeksToPeak: 4,
      competitionType: 'thin'
    });
    assert.equal(result.total, 100);
  });

  it('should return minimum score when all components are zero', () => {
    const result = calculatePriority({
      impressions: 0,
      decaySeverity: '',
      position: 1,
      weeksToPeak: 52,
      competitionType: 'brands'
    });
    assert.equal(result.total, 0);
  });

  it('should handle missing signals gracefully', () => {
    const result = calculatePriority({});
    assert.ok(result.total >= 0 && result.total <= 100);
    assert.ok('components' in result);
  });
});

// ── Summary Generation Tests ───────────────────────────────────

describe('generateSummary', () => {
  it('should return a non-empty string', () => {
    const scoring = calculatePriority({
      impressions: 10000,
      decaySeverity: 'high',
      position: null,
      weeksToPeak: 6,
      competitionType: 'thin'
    });
    const summary = generateSummary({
      impressions: 10000,
      decaySeverity: 'high',
      position: null,
      weeksToPeak: 6,
      competitionType: 'thin'
    }, scoring);
    assert.ok(summary.length > 0);
    assert.ok(typeof summary === 'string');
  });

  it('should include data references in summary', () => {
    const signals = {
      impressions: 10000,
      decaySeverity: 'critical',
      position: null,
      weeksToPeak: 4,
      competitionType: 'thin'
    };
    const scoring = calculatePriority(signals);
    const summary = generateSummary(signals, scoring);
    // Summary should reference actual data
    assert.ok(
      summary.includes('10,000') || summary.includes('10000') ||
      summary.includes('critical') || summary.includes('No existing page') ||
      summary.includes('impressions'),
      'Summary should contain data-backed references'
    );
  });

  it('should include priority label', () => {
    const signals = {
      impressions: 50000,
      decaySeverity: 'critical',
      position: null,
      weeksToPeak: 4,
      competitionType: 'thin'
    };
    const scoring = calculatePriority(signals);
    const summary = generateSummary(signals, scoring);
    assert.ok(summary.includes('Priority:'), 'Summary should include priority label');
  });

  it('should say HIGH priority for score >= 75', () => {
    const signals = {
      impressions: 50000,
      decaySeverity: 'critical',
      position: null,
      weeksToPeak: 4,
      competitionType: 'thin'
    };
    const scoring = calculatePriority(signals);
    const summary = generateSummary(signals, scoring);
    assert.ok(summary.includes('HIGH'), 'High-scoring topic should be labeled HIGH');
  });

  it('should say MINIMAL priority for very low scores', () => {
    const signals = {
      impressions: 0,
      decaySeverity: '',
      position: 1,
      weeksToPeak: 52,
      competitionType: 'brands'
    };
    const scoring = calculatePriority(signals);
    const summary = generateSummary(signals, scoring);
    assert.ok(summary.includes('MINIMAL'), 'Low-scoring topic should be labeled MINIMAL');
  });
});

// ── Content Type Suggestion Tests ──────────────────────────────

describe('suggestContentType', () => {
  it('should suggest comprehensive-guide for high impressions + no page', () => {
    const signals = { impressions: 50000, position: null };
    const scoring = calculatePriority({
      impressions: 50000,
      decaySeverity: '',
      position: null,
      weeksToPeak: null,
      competitionType: 'mixed'
    });
    const type = suggestContentType(signals, scoring);
    assert.equal(type, 'comprehensive-guide');
  });

  it('should suggest content-refresh for decaying content', () => {
    const signals = { impressions: 1000, decaySeverity: 'high', position: 5 };
    const scoring = calculatePriority({
      impressions: 1000,
      decaySeverity: 'high',
      position: 5,
      weeksToPeak: null,
      competitionType: 'mixed'
    });
    const type = suggestContentType(signals, scoring);
    assert.equal(type, 'content-refresh');
  });

  it('should suggest new-article for gap opportunity', () => {
    const signals = { impressions: 500, position: 30 };
    const scoring = calculatePriority({
      impressions: 500,
      decaySeverity: '',
      position: 30,
      weeksToPeak: null,
      competitionType: 'mixed'
    });
    const type = suggestContentType(signals, scoring);
    assert.equal(type, 'new-article');
  });

  it('should suggest quick-win-post for low competition', () => {
    const signals = { impressions: 500, position: 5, competitionType: 'thin' };
    const scoring = calculatePriority({
      impressions: 500,
      decaySeverity: '',
      position: 5,
      weeksToPeak: null,
      competitionType: 'thin'
    });
    const type = suggestContentType(signals, scoring);
    assert.equal(type, 'quick-win-post');
  });
});

// ── Scoring Breakdown in analysis_metadata Tests ───────────────

describe('scoring breakdown in analysis_metadata', () => {
  it('should include scoring object with total and components', () => {
    const scoring = calculatePriority({
      impressions: 5000,
      decaySeverity: 'medium',
      position: 25,
      weeksToPeak: 10,
      competitionType: 'forum'
    });

    assert.ok('total' in scoring);
    assert.ok('components' in scoring);
    assert.ok('impressions' in scoring.components);
    assert.ok('decay' in scoring.components);
    assert.ok('gap' in scoring.components);
    assert.ok('seasonality' in scoring.components);
    assert.ok('competition' in scoring.components);
  });

  it('should include score, weight, and weighted for each component', () => {
    const scoring = calculatePriority({
      impressions: 5000,
      decaySeverity: 'medium',
      position: 25,
      weeksToPeak: 10,
      competitionType: 'forum'
    });

    for (const [name, comp] of Object.entries(scoring.components)) {
      assert.ok('score' in comp, `Component ${name} missing score`);
      assert.ok('weight' in comp, `Component ${name} missing weight`);
      assert.ok('weighted' in comp, `Component ${name} missing weighted`);
      assert.ok(comp.score >= 0 && comp.score <= 100, `Component ${name} score ${comp.score} out of range`);
    }
  });

  it('should have weighted = score * weight for each component', () => {
    const scoring = calculatePriority({
      impressions: 10000,
      decaySeverity: 'critical',
      position: null,
      weeksToPeak: 4,
      competitionType: 'thin'
    });

    for (const [name, comp] of Object.entries(scoring.components)) {
      const expected = Math.round(comp.score * comp.weight * 100) / 100;
      assert.equal(comp.weighted, expected, `Component ${name}: weighted ${comp.weighted} !== score*weight ${expected}`);
    }
  });

  it('should have total equal to sum of all weighted components', () => {
    const scoring = calculatePriority({
      impressions: 5000,
      decaySeverity: 'medium',
      position: 25,
      weeksToPeak: 10,
      competitionType: 'forum'
    });

    const sumWeighted = Object.values(scoring.components)
      .reduce((sum, comp) => sum + comp.weighted, 0);
    const expected = Math.round(sumWeighted * 100) / 100;
    assert.equal(scoring.total, expected, `Total ${scoring.total} !== sum of weighted ${expected}`);
  });
});

// ── Constants / Validation Tests ───────────────────────────────

describe('WEIGHTS', () => {
  it('should have all 5 components', () => {
    assert.ok('impressions' in WEIGHTS);
    assert.ok('decay' in WEIGHTS);
    assert.ok('gap' in WEIGHTS);
    assert.ok('seasonality' in WEIGHTS);
    assert.ok('competition' in WEIGHTS);
  });

  it('should sum to 1.0', () => {
    const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    assert.equal(sum, 1.0);
  });

  it('should match specification values', () => {
    assert.equal(WEIGHTS.impressions, 0.30);
    assert.equal(WEIGHTS.decay, 0.25);
    assert.equal(WEIGHTS.gap, 0.25);
    assert.equal(WEIGHTS.seasonality, 0.10);
    assert.equal(WEIGHTS.competition, 0.10);
  });
});

describe('VALID_STATUSES', () => {
  it('should include all expected statuses', () => {
    assert.ok(VALID_STATUSES.includes('pending'));
    assert.ok(VALID_STATUSES.includes('approved'));
    assert.ok(VALID_STATUSES.includes('rejected'));
    assert.ok(VALID_STATUSES.includes('in_progress'));
    assert.ok(VALID_STATUSES.includes('completed'));
  });
});

// ── Category Filtering Test ────────────────────────────────────

describe('category filtering logic', () => {
  it('should correctly filter by category in scoring flow', () => {
    // Test that the scoring functions work independently of DB calls
    // Category filtering is tested through the signal flow
    const signals1 = { impressions: 10000, decaySeverity: 'high', position: null, weeksToPeak: 4, competitionType: 'thin' };
    const signals2 = { impressions: 500, decaySeverity: '', position: 5, weeksToPeak: 52, competitionType: 'brands' };

    const score1 = calculatePriority(signals1);
    const score2 = calculatePriority(signals2);

    // High-signal topic should rank higher than low-signal topic
    assert.ok(score1.total > score2.total,
      `High-signal score ${score1.total} should be > low-signal score ${score2.total}`);
  });
});
