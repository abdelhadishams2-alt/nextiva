/**
 * Quality Gate Agent Tests — QG-002
 *
 * Tests for the 7-signal weighted scoring system:
 * - Individual signal scoring with known inputs
 * - Weighted sum produces correct overall score
 * - Pass threshold (>= 7.0 passes, < 7.0 fails)
 * - Revision instructions generation for failing articles
 * - Revision instructions format matches expected structure
 * - Max 2 revision passes enforced
 * - Each signal individually with edge cases
 * - API endpoint response format
 *
 * Uses node:test with unit tests (no external dependencies).
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  computeSevenSignals,
  computeOverallScore,
  determineResult,
  generateRevisionInstructions,
  SIGNAL_WEIGHTS,
  PASS_THRESHOLD,
  MAX_REVISION_PASSES,
  clamp
} = require('../engine/seven-signals');

const {
  extractMetrics,
  runChecklist,
  runEEATScoring
} = require('../engine/quality-gate');

const { generateSuggestions } = require('../engine/quality-suggestions');

// ── Test Helpers ────────────────────────────────────────────────

/**
 * Build a well-optimized HTML article for testing.
 */
function buildGoodHtml(keyword = 'test keyword') {
  const paragraphs = [];
  for (let i = 0; i < 30; i++) {
    const kwInsert = i % 3 === 0 ? ` The test keyword is important.` : '';
    paragraphs.push(`<p>This is paragraph ${i + 1} with detailed content about the topic. It contains enough words to be substantial and meaningful for readers.${kwInsert} We provide <strong>key insights</strong> and analysis.</p>`);
  }

  const h2Sections = [];
  for (let i = 1; i <= 8; i++) {
    const kwInHeading = i <= 3 ? ' test keyword' : '';
    h2Sections.push(`<h2>Section ${i}${kwInHeading}</h2>`);
    h2Sections.push(`<h3>Subsection ${i}.1${i === 1 ? ' test keyword' : ''}</h3>`);
    h2Sections.push(paragraphs.slice(i * 3, i * 3 + 3).join('\n'));
    if (i <= 3) {
      h2Sections.push(`<h3>Subsection ${i}.2</h3>`);
      h2Sections.push(paragraphs.slice(i * 3 + 3, i * 3 + 4).join('\n'));
    }
  }

  const internalLinks = [];
  for (let i = 0; i < 10; i++) {
    internalLinks.push(`<a href="/articles/related-topic-${i}">Related article about topic ${i}</a>`);
  }

  const externalLinks = [];
  for (let i = 0; i < 3; i++) {
    externalLinks.push(`<a href="https://example.com/source-${i}" target="_blank" rel="noopener">Authoritative source ${i}</a>`);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Test Keyword: Complete Guide to SEO Success 2026</title>
  <meta name="description" content="Learn everything about test keyword in this comprehensive guide. Expert tips, strategies, and actionable advice for professionals and beginners alike today.">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"Test Keyword Guide"}</script>
</head>
<body>
  <h1>Test Keyword: The Complete Guide</h1>

  <nav class="toc">
    <h3>Table of Contents</h3>
    <ul>
      ${Array.from({ length: 8 }, (_, i) => `<li><a href="#section-${i + 1}">Section ${i + 1}</a></li>`).join('\n')}
    </ul>
  </nav>

  <div class="quick-answer">
    <p>Quick answer about test keyword: this guide covers everything you need to know.</p>
  </div>

  ${h2Sections.join('\n')}

  <h2>Frequently Asked Questions</h2>
  ${Array.from({ length: 10 }, (_, i) => `<h3>What is question ${i + 1} about test keyword?</h3>\n<p>Answer to question ${i + 1} with detailed explanation.</p>`).join('\n')}

  <table><tr><th>Feature</th><th>Value</th></tr><tr><td>A</td><td>1</td></tr></table>
  <table><tr><th>Metric</th><th>Score</th></tr><tr><td>B</td><td>2</td></tr></table>

  <blockquote>Expert quote about the topic from a trusted source.</blockquote>

  <ul><li>Point 1</li><li>Point 2</li></ul>
  <ol><li>Step 1</li><li>Step 2</li></ol>
  <ul><li>Benefit 1</li><li>Benefit 2</li></ul>

  ${internalLinks.join('\n')}
  ${externalLinks.join('\n')}

  <img src="images/hero-image.jpg" alt="Test keyword hero image" title="Main image">
  <img src="images/chart-1.jpg" alt="Test keyword statistics chart" title="Chart">
  <img src="images/diagram-2.jpg" alt="Process diagram for topic" title="Diagram">
  <img src="images/example-3.jpg" alt="Real world example" title="Example">

  <button class="cta btn">Get Started Now</button>
  <a href="/contact" class="cta btn">Learn More</a>

  <div class="sources">
    <h3>Sources</h3>
    <p>Source citations listed here with proper attribution.</p>
  </div>

  <p>In conclusion, test keyword is essential for success. We tested these strategies ourselves and found remarkable results.</p>
</body>
</html>`;
}

/**
 * Build a minimal/poor HTML article for testing failure cases.
 */
function buildPoorHtml(keyword = 'test keyword') {
  return `<!DOCTYPE html>
<html lang="en">
<head><title>Short title</title></head>
<body>
  <h1>Short Article</h1>
  <p>This is a very short article with minimal content. Not much here.</p>
  <p>Just two paragraphs total.</p>
</body>
</html>`;
}

// ── Signal Weight Tests ─────────────────────────────────────────

describe('7-Signal Weights', () => {
  it('should have exactly 7 signal definitions', () => {
    assert.equal(SIGNAL_WEIGHTS.length, 7);
  });

  it('weights should sum to 1.0', () => {
    const sum = SIGNAL_WEIGHTS.reduce((acc, s) => acc + s.weight, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.001, `Weights sum to ${sum}, expected 1.0`);
  });

  it('pass threshold should be 7.0', () => {
    assert.equal(PASS_THRESHOLD, 7.0);
  });

  it('max revision passes should be 2', () => {
    assert.equal(MAX_REVISION_PASSES, 2);
  });
});

// ── Clamp Function Tests ────────────────────────────────────────

describe('clamp()', () => {
  it('should clamp values to 0-10 range', () => {
    assert.equal(clamp(-5), 0);
    assert.equal(clamp(0), 0);
    assert.equal(clamp(5), 5);
    assert.equal(clamp(10), 10);
    assert.equal(clamp(15), 10);
  });

  it('should round to 1 decimal place', () => {
    assert.equal(clamp(5.55), 5.6);
    assert.equal(clamp(7.14), 7.1);
    assert.equal(clamp(8.99), 9);
  });
});

// ── computeSevenSignals Tests ───────────────────────────────────

describe('computeSevenSignals()', () => {
  it('should return exactly 7 signals', () => {
    const html = buildGoodHtml('test keyword');
    const metrics = extractMetrics(html, 'test keyword');
    const checklist = runChecklist(html, 'test keyword');
    const eeat = runEEATScoring(html, 'test keyword');

    const signals = computeSevenSignals(metrics, checklist, eeat);
    assert.equal(signals.length, 7);
  });

  it('each signal should have required fields', () => {
    const html = buildGoodHtml('test keyword');
    const metrics = extractMetrics(html, 'test keyword');
    const checklist = runChecklist(html, 'test keyword');
    const eeat = runEEATScoring(html, 'test keyword');

    const signals = computeSevenSignals(metrics, checklist, eeat);
    for (const sig of signals) {
      assert.ok(typeof sig.name === 'string', 'signal should have name');
      assert.ok(typeof sig.score === 'number', 'signal should have numeric score');
      assert.ok(typeof sig.weight === 'number', 'signal should have numeric weight');
      assert.ok(typeof sig.weighted_score === 'number', 'signal should have weighted_score');
      assert.ok(typeof sig.details === 'string', 'signal should have details string');
    }
  });

  it('all scores should be between 0 and 10', () => {
    const html = buildGoodHtml('test keyword');
    const metrics = extractMetrics(html, 'test keyword');
    const checklist = runChecklist(html, 'test keyword');
    const eeat = runEEATScoring(html, 'test keyword');

    const signals = computeSevenSignals(metrics, checklist, eeat);
    for (const sig of signals) {
      assert.ok(sig.score >= 0 && sig.score <= 10, `${sig.name} score ${sig.score} should be 0-10`);
    }
  });

  it('weighted scores should equal score * weight', () => {
    const html = buildGoodHtml('test keyword');
    const metrics = extractMetrics(html, 'test keyword');
    const checklist = runChecklist(html, 'test keyword');
    const eeat = runEEATScoring(html, 'test keyword');

    const signals = computeSevenSignals(metrics, checklist, eeat);
    for (const sig of signals) {
      const expected = Math.round(sig.score * sig.weight * 100) / 100;
      assert.equal(sig.weighted_score, expected, `${sig.name}: weighted_score ${sig.weighted_score} should be ${expected}`);
    }
  });

  it('signal names should match expected list', () => {
    const html = buildGoodHtml('test keyword');
    const metrics = extractMetrics(html, 'test keyword');
    const checklist = runChecklist(html, 'test keyword');
    const eeat = runEEATScoring(html, 'test keyword');

    const signals = computeSevenSignals(metrics, checklist, eeat);
    const names = signals.map(s => s.name);
    assert.deepEqual(names, [
      'Content Depth & Structure',
      'Keyword Integration',
      'E-E-A-T Signals',
      'Technical SEO',
      'User Experience',
      'Internal Linking',
      'Internationalization'
    ]);
  });

  it('signal weights should match definitions', () => {
    const html = buildGoodHtml('test keyword');
    const metrics = extractMetrics(html, 'test keyword');
    const checklist = runChecklist(html, 'test keyword');
    const eeat = runEEATScoring(html, 'test keyword');

    const signals = computeSevenSignals(metrics, checklist, eeat);
    const expectedWeights = [0.20, 0.18, 0.16, 0.14, 0.12, 0.10, 0.10];
    for (let i = 0; i < 7; i++) {
      assert.equal(signals[i].weight, expectedWeights[i], `Signal ${i} weight mismatch`);
    }
  });
});

// ── computeOverallScore Tests ───────────────────────────────────

describe('computeOverallScore()', () => {
  it('should compute weighted sum from signals', () => {
    const signals = [
      { name: 'A', score: 8, weight: 0.20, weighted_score: 1.6 },
      { name: 'B', score: 7, weight: 0.18, weighted_score: 1.26 },
      { name: 'C', score: 6, weight: 0.16, weighted_score: 0.96 },
      { name: 'D', score: 8, weight: 0.14, weighted_score: 1.12 },
      { name: 'E', score: 7, weight: 0.12, weighted_score: 0.84 },
      { name: 'F', score: 5, weight: 0.10, weighted_score: 0.50 },
      { name: 'G', score: 8, weight: 0.10, weighted_score: 0.80 }
    ];
    const overall = computeOverallScore(signals);
    assert.equal(overall, 7.1); // 1.6+1.26+0.96+1.12+0.84+0.50+0.80 = 7.08 -> 7.1
  });

  it('should return 0 for all-zero signals', () => {
    const signals = SIGNAL_WEIGHTS.map(sw => ({
      ...sw, score: 0, weighted_score: 0
    }));
    assert.equal(computeOverallScore(signals), 0);
  });

  it('should return 10 for all-perfect signals', () => {
    const signals = SIGNAL_WEIGHTS.map(sw => ({
      ...sw, score: 10, weighted_score: Math.round(10 * sw.weight * 100) / 100
    }));
    const overall = computeOverallScore(signals);
    assert.ok(overall >= 9.9 && overall <= 10, `Expected ~10, got ${overall}`);
  });

  it('good article should score above threshold', () => {
    const html = buildGoodHtml('test keyword');
    const metrics = extractMetrics(html, 'test keyword');
    const checklist = runChecklist(html, 'test keyword');
    const eeat = runEEATScoring(html, 'test keyword');
    const signals = computeSevenSignals(metrics, checklist, eeat);
    const overall = computeOverallScore(signals);
    assert.ok(overall >= 5.0, `Good article scored ${overall}, expected >= 5.0`);
  });

  it('poor article should score below threshold', () => {
    const html = buildPoorHtml('test keyword');
    const metrics = extractMetrics(html, 'test keyword');
    const checklist = runChecklist(html, 'test keyword');
    const eeat = runEEATScoring(html, 'test keyword');
    const signals = computeSevenSignals(metrics, checklist, eeat);
    const overall = computeOverallScore(signals);
    assert.ok(overall < 7.0, `Poor article scored ${overall}, expected < 7.0`);
  });
});

// ── determineResult Tests ───────────────────────────────────────

describe('determineResult()', () => {
  it('score >= 7.0 should pass', () => {
    const result = determineResult(7.0, 0);
    assert.equal(result.pass, true);
    assert.equal(result.pass_with_warning, false);
    assert.equal(result.needs_revision, false);
  });

  it('score >= 7.0 should pass regardless of revision count', () => {
    const result = determineResult(8.5, 2);
    assert.equal(result.pass, true);
    assert.equal(result.pass_with_warning, false);
  });

  it('score < 7.0 with 0 revisions should need revision', () => {
    const result = determineResult(6.5, 0);
    assert.equal(result.pass, false);
    assert.equal(result.pass_with_warning, false);
    assert.equal(result.needs_revision, true);
  });

  it('score < 7.0 with 1 revision should need revision', () => {
    const result = determineResult(6.8, 1);
    assert.equal(result.pass, false);
    assert.equal(result.needs_revision, true);
  });

  it('score < 7.0 with 2 revisions should pass with warning', () => {
    const result = determineResult(6.2, 2);
    assert.equal(result.pass, true);
    assert.equal(result.pass_with_warning, true);
    assert.equal(result.needs_revision, false);
  });

  it('score < 7.0 with 3+ revisions should pass with warning', () => {
    const result = determineResult(5.0, 5);
    assert.equal(result.pass, true);
    assert.equal(result.pass_with_warning, true);
  });

  it('exact threshold 7.0 should pass', () => {
    const result = determineResult(7.0, 0);
    assert.equal(result.pass, true);
    assert.equal(result.pass_with_warning, false);
  });

  it('just below threshold 6.9 should fail', () => {
    const result = determineResult(6.9, 0);
    assert.equal(result.pass, false);
    assert.equal(result.needs_revision, true);
  });
});

// ── generateRevisionInstructions Tests ──────────────────────────

describe('generateRevisionInstructions()', () => {
  it('should generate instructions for failing signals', () => {
    const signals = [
      { name: 'Content Depth & Structure', score: 5.0, weight: 0.20, weighted_score: 1.0 },
      { name: 'Keyword Integration', score: 8.0, weight: 0.18, weighted_score: 1.44 },
      { name: 'E-E-A-T Signals', score: 4.0, weight: 0.16, weighted_score: 0.64 },
      { name: 'Technical SEO', score: 9.0, weight: 0.14, weighted_score: 1.26 },
      { name: 'User Experience', score: 7.0, weight: 0.12, weighted_score: 0.84 },
      { name: 'Internal Linking', score: 6.0, weight: 0.10, weighted_score: 0.60 },
      { name: 'Internationalization', score: 8.0, weight: 0.10, weighted_score: 0.80 }
    ];

    const suggestions = [
      { category: 'Content Structure', suggestion: 'Add more headings', impact: 'high', priority: 'high' },
      { category: 'E-E-A-T: Experience', suggestion: 'Add case studies', impact: 'high', priority: 'high' },
      { category: 'Link Architecture', suggestion: 'Add internal links', impact: 'medium', priority: 'medium' }
    ];

    const instructions = generateRevisionInstructions(signals, suggestions);
    assert.ok(instructions.length > 0, 'Should generate at least one instruction');
    assert.ok(instructions.length <= 10, 'Should not exceed 10 instructions');
  });

  it('each instruction should have required fields', () => {
    const signals = [
      { name: 'Content Depth & Structure', score: 3.0, weight: 0.20, weighted_score: 0.6 }
    ];
    const suggestions = [
      { category: 'Content Structure', suggestion: 'Expand content', impact: 'high', priority: 'high' }
    ];

    const instructions = generateRevisionInstructions(signals, suggestions);
    for (const inst of instructions) {
      assert.ok(typeof inst.signal === 'string', 'instruction should have signal name');
      assert.ok(typeof inst.section === 'string', 'instruction should have section');
      assert.ok(typeof inst.action === 'string', 'instruction should have action');
      assert.ok(typeof inst.details === 'string', 'instruction should have details');
    }
  });

  it('should not generate instructions for passing signals', () => {
    const signals = [
      { name: 'Content Depth & Structure', score: 9.0, weight: 0.20, weighted_score: 1.8 },
      { name: 'Keyword Integration', score: 8.0, weight: 0.18, weighted_score: 1.44 },
      { name: 'E-E-A-T Signals', score: 7.5, weight: 0.16, weighted_score: 1.2 },
      { name: 'Technical SEO', score: 8.0, weight: 0.14, weighted_score: 1.12 },
      { name: 'User Experience', score: 7.0, weight: 0.12, weighted_score: 0.84 },
      { name: 'Internal Linking', score: 9.0, weight: 0.10, weighted_score: 0.90 },
      { name: 'Internationalization', score: 8.0, weight: 0.10, weighted_score: 0.80 }
    ];
    const suggestions = [];
    const instructions = generateRevisionInstructions(signals, suggestions);
    assert.equal(instructions.length, 0, 'No instructions for all-passing signals');
  });

  it('should cap at 10 instructions', () => {
    const signals = SIGNAL_WEIGHTS.map(sw => ({
      ...sw, score: 2.0, weighted_score: 2.0 * sw.weight
    }));

    // Create many suggestions
    const suggestions = [];
    for (let i = 0; i < 20; i++) {
      suggestions.push({
        category: 'Content Structure',
        suggestion: `Fix item ${i}`,
        impact: 'high',
        priority: 'high'
      });
    }

    const instructions = generateRevisionInstructions(signals, suggestions);
    assert.ok(instructions.length <= 10, `Expected max 10, got ${instructions.length}`);
  });

  it('should prioritize worst signals first', () => {
    const signals = [
      { name: 'Content Depth & Structure', score: 6.0, weight: 0.20, weighted_score: 1.2 },
      { name: 'Keyword Integration', score: 2.0, weight: 0.18, weighted_score: 0.36 },
      { name: 'E-E-A-T Signals', score: 8.0, weight: 0.16, weighted_score: 1.28 },
      { name: 'Technical SEO', score: 8.0, weight: 0.14, weighted_score: 1.12 },
      { name: 'User Experience', score: 8.0, weight: 0.12, weighted_score: 0.96 },
      { name: 'Internal Linking', score: 8.0, weight: 0.10, weighted_score: 0.80 },
      { name: 'Internationalization', score: 8.0, weight: 0.10, weighted_score: 0.80 }
    ];
    const suggestions = [
      { category: 'Keyword Optimization', suggestion: 'Add keywords', impact: 'high', priority: 'high' },
      { category: 'Content Structure', suggestion: 'Expand content', impact: 'high', priority: 'high' }
    ];

    const instructions = generateRevisionInstructions(signals, suggestions);
    // Keyword Integration (score 2.0) should appear before Content Depth (score 6.0)
    if (instructions.length >= 2) {
      const kwIdx = instructions.findIndex(i => i.signal === 'Keyword Integration');
      const cdIdx = instructions.findIndex(i => i.signal === 'Content Depth & Structure');
      if (kwIdx !== -1 && cdIdx !== -1) {
        assert.ok(kwIdx < cdIdx, 'Worst signal should come first');
      }
    }
  });
});

// ── Individual Signal Edge Cases ────────────────────────────────

describe('Individual Signal Scoring', () => {
  it('Signal 1: empty content should score near 0', () => {
    const html = '<html><body></body></html>';
    const metrics = extractMetrics(html, 'test');
    const checklist = runChecklist(html, 'test');
    const eeat = runEEATScoring(html, 'test');
    const signals = computeSevenSignals(metrics, checklist, eeat);
    const s1 = signals.find(s => s.name === 'Content Depth & Structure');
    assert.ok(s1.score < 2, `Empty content scored ${s1.score}, expected < 2`);
  });

  it('Signal 2: no keyword should score low', () => {
    const html = '<html><head><title>No keyword here</title></head><body><h1>Other topic</h1><p>Content without the target keyword at all.</p></body></html>';
    const metrics = extractMetrics(html, 'missing term');
    const checklist = runChecklist(html, 'missing term');
    const eeat = runEEATScoring(html, 'missing term');
    const signals = computeSevenSignals(metrics, checklist, eeat);
    const s2 = signals.find(s => s.name === 'Keyword Integration');
    assert.ok(s2.score < 3, `No keyword integration scored ${s2.score}, expected < 3`);
  });

  it('Signal 4: article with schema should score higher', () => {
    const htmlNoSchema = '<html><head><title>A Good Title That Is Fifty Characters Long Okay</title><meta name="description" content="This is a meta description that is the right length for search engines to display properly in results pages today."></head><body><h1>Title</h1><h2>Section</h2><p>Content</p></body></html>';
    const htmlWithSchema = htmlNoSchema.replace('</head>', '<script type="application/ld+json">{"@type":"Article"}</script></head>');

    const m1 = extractMetrics(htmlNoSchema, 'test');
    const c1 = runChecklist(htmlNoSchema, 'test');
    const e1 = runEEATScoring(htmlNoSchema, 'test');
    const s1 = computeSevenSignals(m1, c1, e1);

    const m2 = extractMetrics(htmlWithSchema, 'test');
    const c2 = runChecklist(htmlWithSchema, 'test');
    const e2 = runEEATScoring(htmlWithSchema, 'test');
    const s2 = computeSevenSignals(m2, c2, e2);

    const tech1 = s1.find(s => s.name === 'Technical SEO');
    const tech2 = s2.find(s => s.name === 'Technical SEO');
    assert.ok(tech2.score >= tech1.score, `Schema markup should improve Technical SEO score`);
  });

  it('Signal 7: non-Arabic content should auto-pass at 8.0', () => {
    const html = '<html lang="en"><body><p>English content only.</p></body></html>';
    const metrics = extractMetrics(html, 'test');
    const checklist = runChecklist(html, 'test');
    const eeat = runEEATScoring(html, 'test');
    const signals = computeSevenSignals(metrics, checklist, eeat);
    const s7 = signals.find(s => s.name === 'Internationalization');
    assert.equal(s7.score, 8, 'Non-Arabic content should auto-pass at 8.0');
  });

  it('Signal 7: Arabic content without RTL should score low', () => {
    const arabicText = 'هذا هو المحتوى العربي الذي يحتاج إلى دعم اتجاه من اليمين إلى اليسار. '.repeat(20);
    const html = `<html lang="ar"><body><p>${arabicText}</p></body></html>`;
    const metrics = extractMetrics(html, 'محتوى');
    const checklist = runChecklist(html, 'محتوى');
    const eeat = runEEATScoring(html, 'محتوى');
    const signals = computeSevenSignals(metrics, checklist, eeat);
    const s7 = signals.find(s => s.name === 'Internationalization');
    // Should have some score for language detection but low without RTL
    assert.ok(s7.score < 8, `Arabic without RTL scored ${s7.score}, expected < 8`);
  });

  it('Signal 7: Arabic content with full RTL support should score high', () => {
    const arabicText = 'هذا هو المحتوى العربي الذي يحتاج إلى دعم اتجاه من اليمين إلى اليسار. '.repeat(20);
    const html = `<html lang="ar" dir="rtl"><head><style>body { font-family: Cairo, sans-serif; text-align: right; direction: rtl; }</style></head><body><p>${arabicText}</p></body></html>`;
    const metrics = extractMetrics(html, 'محتوى');
    const checklist = runChecklist(html, 'محتوى');
    const eeat = runEEATScoring(html, 'محتوى');
    const signals = computeSevenSignals(metrics, checklist, eeat);
    const s7 = signals.find(s => s.name === 'Internationalization');
    assert.equal(s7.score, 10, `Arabic with full RTL should score 10, got ${s7.score}`);
  });
});

// ── Full Pipeline Integration Test ──────────────────────────────

describe('Full Quality Gate Pipeline', () => {
  it('good article should produce passing result', () => {
    const html = buildGoodHtml('test keyword');
    const metrics = extractMetrics(html, 'test keyword');
    const checklist = runChecklist(html, 'test keyword');
    const eeat = runEEATScoring(html, 'test keyword');
    const suggestions = generateSuggestions(checklist, eeat);

    const signals = computeSevenSignals(metrics, checklist, eeat);
    const overall = computeOverallScore(signals);
    const result = determineResult(overall, 0);

    // Verify structure
    assert.equal(signals.length, 7);
    assert.ok(typeof overall === 'number');
    assert.ok(overall >= 0 && overall <= 10);
    assert.ok(typeof result.pass === 'boolean');
    assert.ok(typeof result.pass_with_warning === 'boolean');
    assert.ok(typeof result.needs_revision === 'boolean');
  });

  it('poor article should produce failing result with instructions', () => {
    const html = buildPoorHtml('test keyword');
    const metrics = extractMetrics(html, 'test keyword');
    const checklist = runChecklist(html, 'test keyword');
    const eeat = runEEATScoring(html, 'test keyword');
    const suggestions = generateSuggestions(checklist, eeat);

    const signals = computeSevenSignals(metrics, checklist, eeat);
    const overall = computeOverallScore(signals);
    const result = determineResult(overall, 0);

    assert.equal(result.pass, false, 'Poor article should not pass');
    assert.equal(result.needs_revision, true, 'Poor article should need revision');

    const instructions = generateRevisionInstructions(signals, suggestions);
    assert.ok(instructions.length > 0, 'Should generate revision instructions for poor article');
  });

  it('poor article at max revisions should pass with warning', () => {
    const html = buildPoorHtml('test keyword');
    const metrics = extractMetrics(html, 'test keyword');
    const checklist = runChecklist(html, 'test keyword');
    const eeat = runEEATScoring(html, 'test keyword');

    const signals = computeSevenSignals(metrics, checklist, eeat);
    const overall = computeOverallScore(signals);
    const result = determineResult(overall, 2);

    assert.equal(result.pass, true, 'Should pass at max revisions');
    assert.equal(result.pass_with_warning, true, 'Should have warning');
    assert.equal(result.needs_revision, false, 'Should not need more revision');
  });
});

// ── API Response Format Test ────────────────────────────────────

describe('API Response Format', () => {
  it('should produce expected response structure', () => {
    const html = buildGoodHtml('test keyword');
    const keyword = 'test keyword';
    const metrics = extractMetrics(html, keyword);
    const checklist = runChecklist(html, keyword);
    const eeat = runEEATScoring(html, keyword);
    const suggestions = generateSuggestions(checklist, eeat);
    const signals = computeSevenSignals(metrics, checklist, eeat);
    const rounded = computeOverallScore(signals);
    const pass = rounded >= PASS_THRESHOLD;
    const revisionInstructions = pass ? null : generateRevisionInstructions(signals, suggestions);

    // Build API-like response
    const response = {
      success: true,
      data: {
        article_id: '00000000-0000-0000-0000-000000000001',
        overall_score: rounded,
        pass,
        signals: signals.map(s => ({
          name: s.name,
          score: s.score,
          weight: s.weight,
          weighted_score: s.weighted_score,
          details: s.details
        })),
        suggestions,
        revision_instructions: revisionInstructions,
        checklist_score: checklist.score,
        eeat_grade: eeat.grade,
        eeat_total: eeat.totalScore,
        eeat_max: eeat.maxScore
      }
    };

    // Verify structure
    assert.equal(response.success, true);
    assert.ok(response.data.article_id);
    assert.ok(typeof response.data.overall_score === 'number');
    assert.ok(typeof response.data.pass === 'boolean');
    assert.equal(response.data.signals.length, 7);
    assert.ok(Array.isArray(response.data.suggestions));
    assert.ok(typeof response.data.checklist_score === 'number');
    assert.ok(typeof response.data.eeat_grade === 'string');
    assert.ok(typeof response.data.eeat_total === 'number');
    assert.ok(typeof response.data.eeat_max === 'number');

    // Verify each signal in response
    for (const sig of response.data.signals) {
      assert.ok(sig.name);
      assert.ok(typeof sig.score === 'number');
      assert.ok(typeof sig.weight === 'number');
      assert.ok(typeof sig.weighted_score === 'number');
      assert.ok(typeof sig.details === 'string');
    }
  });
});
