/**
 * Tests for Keyword Gap Analyzer — CI-002
 *
 * Uses node:test (zero npm dependencies).
 * Tests gap detection logic, scoring, fuzzy matching, and helpers.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  fuzzyTitleMatch,
  scoreGap,
  formatDate
} = require('../bridge/intelligence/gap-analyzer');

// ── Helper Tests ───────────────────────────────────────────────

describe('formatDate (gap-analyzer)', () => {
  it('should format a date as YYYY-MM-DD', () => {
    assert.equal(formatDate(new Date('2024-06-15T12:00:00Z')), '2024-06-15');
  });

  it('should handle single-digit months and days with padding', () => {
    assert.equal(formatDate(new Date('2024-01-05T00:00:00Z')), '2024-01-05');
  });
});

// ── Fuzzy Title Match Tests ────────────────────────────────────

describe('fuzzyTitleMatch', () => {
  it('should match exact keyword in title', () => {
    assert.equal(fuzzyTitleMatch('bmw tuning guide', 'BMW Tuning Guide 2024'), true);
  });

  it('should match when title contains keyword', () => {
    assert.equal(fuzzyTitleMatch('n54 hpfp', 'How to Replace N54 HPFP — Complete Guide'), true);
  });

  it('should match with 80%+ word overlap', () => {
    // 4 of 5 words match = 80%
    assert.equal(fuzzyTitleMatch('best bmw performance mods 2024', 'Best BMW Performance Mods Review'), true);
  });

  it('should NOT match when keyword is unrelated to title', () => {
    assert.equal(fuzzyTitleMatch('toyota camry review', 'BMW Tuning Guide 2024'), false);
  });

  it('should return false for empty keyword', () => {
    assert.equal(fuzzyTitleMatch('', 'Some Title'), false);
  });

  it('should return false for empty title', () => {
    assert.equal(fuzzyTitleMatch('some keyword', ''), false);
  });

  it('should handle special characters', () => {
    assert.equal(fuzzyTitleMatch("what's the best oil", "What's the Best Oil for Your BMW"), true);
  });
});

// ── Gap Scoring Tests ──────────────────────────────────────────

describe('scoreGap', () => {
  it('should return score between 0 and 100', () => {
    const result = scoreGap(1000, 15, 2);
    assert.ok(result.total >= 0 && result.total <= 100, `Score ${result.total} out of range`);
  });

  it('should have three components: impressions, position, competition', () => {
    const result = scoreGap(1000, 15, 2);
    assert.ok('impressions_component' in result);
    assert.ok('position_component' in result);
    assert.ok('competition_component' in result);
  });

  it('should score page 2 position (11-20) highest for position component', () => {
    const page2 = scoreGap(1000, 15, 2);
    const page1 = scoreGap(1000, 5, 2);
    const page5 = scoreGap(1000, 45, 2);
    assert.ok(page2.position_component > page1.position_component, 'Page 2 should score higher than page 1');
    assert.ok(page2.position_component > page5.position_component, 'Page 2 should score higher than page 5');
  });

  it('should give higher impressions score for more impressions', () => {
    const high = scoreGap(10000, 15, 2);
    const low = scoreGap(500, 15, 2);
    assert.ok(high.impressions_component > low.impressions_component);
  });

  it('should give higher competition score for fewer competing URLs', () => {
    const fewer = scoreGap(1000, 15, 1);
    const more = scoreGap(1000, 15, 5);
    assert.ok(fewer.competition_component > more.competition_component);
  });

  it('should handle null position', () => {
    const result = scoreGap(1000, null, 2);
    assert.ok(result.total > 0);
    assert.equal(result.position_component, 25); // Default moderate score
  });

  it('should handle zero competing URLs', () => {
    const result = scoreGap(1000, 15, 0);
    assert.equal(result.competition_component, 30); // Max competition score
  });
});

// ── Acceptance Criteria Tests ──────────────────────────────────

describe('Gap Analyzer Acceptance Criteria', () => {
  it('1000 impressions + no matching title = gap (detected by scoring)', () => {
    // Keyword with 1000 impressions should produce a valid score
    const score = scoreGap(1000, 20, 1);
    assert.ok(score.total > 0, 'Should produce positive score for high-impression gap');
  });

  it('exact title match = not a gap (fuzzyTitleMatch returns true)', () => {
    const match = fuzzyTitleMatch('best bmw tuning platforms', 'Best BMW Tuning Platforms 2024');
    assert.equal(match, true, 'Exact title match should be detected');
  });

  it('gap scoring correctly weighs impressions component (0-30)', () => {
    const result = scoreGap(50000, 15, 2);
    assert.ok(result.impressions_component <= 30, 'Impressions component should max at 30');
    assert.ok(result.impressions_component >= 0, 'Impressions component should be >= 0');
  });

  it('gap scoring correctly weighs position component (0-40)', () => {
    const result = scoreGap(1000, 15, 2);
    assert.ok(result.position_component <= 40, 'Position component should max at 40');
    assert.ok(result.position_component >= 0, 'Position component should be >= 0');
  });

  it('gap scoring correctly weighs competition component (0-30)', () => {
    const result = scoreGap(1000, 15, 0);
    assert.ok(result.competition_component <= 30, 'Competition component should max at 30');
    assert.ok(result.competition_component >= 0, 'Competition component should be >= 0');
  });
});
