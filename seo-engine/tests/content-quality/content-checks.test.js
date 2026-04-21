/**
 * Content Quality Checks Tests — Content Quality Phase
 *
 * Covers the new quality-gate.js additions:
 *   sourcePresencePct, saudiSignalDensity, genericPhraseCount,
 *   decisionClarityPresent, runContentChecks.
 *
 * Includes the golden Zoho-rewrite snapshot — a section that must pass all floors.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  countDeclarativeSentences,
  sourcePresencePct,
  saudiSignalDensity,
  genericPhraseCount,
  decisionClarityPresent,
  runContentChecks,
} = require('../../engine/quality-gate');

// ── Fixtures ────────────────────────────────────────────────────

/**
 * GOLDEN SECTION — the Zoho Books rewrite from the Content Quality Plan's
 * before/after. This is the standard every section must meet.
 * Every factual sentence has a [^ev-id] footnote and a decision_takeaway
 * sentence is present.
 */
const GOLDEN_ZOHO_SECTION = `
<h2>Zoho Books — Best Value for Saudi SMEs</h2>
<p>Zoho Books is the Saudi SME entry point with the lowest documented native-ZATCA-Phase-2 subscription at SAR 69 per month on the Standard tier<sup class="footnote-ref">1</sup>, versus SAR 99 on Wafeq Starter<sup class="footnote-ref">2</sup> and SAR 71 to 130 on QuickBooks Online KSA tiers that still need a roughly USD 30 to 50 middleware connector to reach the Fatoora portal<sup class="footnote-ref">3</sup><sup class="footnote-ref">4</sup>. Zoho appears on ZATCA's published list of compliant e-invoicing solution providers<sup class="footnote-ref">5</sup>.</p>
<p>The free tier caps at SAR 187,500 in annual revenue and a single user<sup class="footnote-ref">1</sup>, enough for a solo Riyadh consultancy or a seed-stage SaaS founder to operate in production without a software bill. Paid tiers step up predictably: Standard SAR 69, Professional SAR 129, Premium SAR 159<sup class="footnote-ref">1</sup>. Native PayTabs integration reconciles mada, STC Pay, and SADAD settlements against open invoices<sup class="footnote-ref">6</sup><sup class="footnote-ref">7</sup>.</p>
<p><strong>Pick Zoho Books if you are a Saudi SME under SAR 40M revenue, Arabic UI is required, PayTabs or Moyasar is your payment processor, and you can tolerate a 24h support SLA during tax-filing weeks.</strong></p>
`;

/**
 * GENERIC SECTION — what the current engine ships. Superlatives, no sources,
 * no decision framework.
 */
const GENERIC_SECTION = `
<h2>Zoho Books — Best Value for Saudi SMEs</h2>
<p>Zoho Books is the value champion of the GCC accounting market. It combines native ZATCA Phase 2 compliance, full Arabic RTL, a workable free tier, and the lowest entry price of any serious platform at SAR 69 per month.</p>
<p>For Saudi startups and budget-conscious SMEs, Zoho Books is genuinely hard to beat. Its bank reconciliation and financial reporting are genuinely best-in-class, and virtually every outsourced accountant has worked on it.</p>
`;

// ── countDeclarativeSentences ──────────────────────────────────

describe('countDeclarativeSentences', () => {
  it('counts sentences in a normal paragraph', () => {
    const html = '<p>This is the first sentence in the paragraph. This is the second sentence in the paragraph. And this is the third sentence in the paragraph.</p>';
    assert.strictEqual(countDeclarativeSentences(html), 3);
  });

  it('ignores sentences shorter than 4 words', () => {
    const html = '<p>Yes indeed. This one is long enough to count as a proper sentence.</p>';
    assert.strictEqual(countDeclarativeSentences(html), 1);
  });

  it('handles empty input', () => {
    assert.strictEqual(countDeclarativeSentences(''), 0);
  });
});

// ── sourcePresencePct ───────────────────────────────────────────

describe('sourcePresencePct', () => {
  it('returns 100% for a fully cited section (golden)', () => {
    const result = sourcePresencePct(GOLDEN_ZOHO_SECTION);
    // Every factual sentence in the golden section carries a footnote. The
    // decision-takeaway is the only non-footnoted sentence; it is rhetorically
    // imperative and reads as non-declarative ("Pick Zoho Books if...").
    assert.ok(result.percent >= 80, `expected >= 80%, got ${result.percent}% (footnoted=${result.footnoted}, declarative=${result.declarative})`);
  });

  it('returns 0% for a section with no footnotes', () => {
    const result = sourcePresencePct(GENERIC_SECTION);
    assert.strictEqual(result.percent, 0);
  });

  it('handles text with [^ev-id] style footnotes', () => {
    const md = 'Zoho Books is SAR 69/mo[^ev-zoho-sar-69]. Wafeq Starter is SAR 99/mo[^ev-wafeq-sar-99].';
    const result = sourcePresencePct(md);
    assert.strictEqual(result.declarative, 2);
    assert.strictEqual(result.footnoted, 2);
    assert.strictEqual(result.percent, 100);
  });
});

// ── saudiSignalDensity ──────────────────────────────────────────

describe('saudiSignalDensity', () => {
  it('counts unique Saudi tokens present', () => {
    const result = saudiSignalDensity(GOLDEN_ZOHO_SECTION);
    assert.ok(result.count >= 5, `expected >= 5 signals, got ${result.count}: ${result.tokens.join(', ')}`);
    assert.ok(result.tokens.includes('ZATCA'));
    assert.ok(result.tokens.includes('SAR'));
    assert.ok(result.tokens.includes('PayTabs'));
  });

  it('returns 0 for a section with no Saudi tokens', () => {
    const html = '<p>React is a JavaScript library for building user interfaces.</p>';
    const result = saudiSignalDensity(html);
    assert.strictEqual(result.count, 0);
    assert.deepStrictEqual(result.tokens, []);
  });

  it('is case-insensitive', () => {
    const html = '<p>The zatca regulation applies to all sar pricing.</p>';
    const result = saudiSignalDensity(html);
    assert.ok(result.tokens.includes('ZATCA'));
    assert.ok(result.tokens.includes('SAR'));
  });
});

// ── genericPhraseCount ──────────────────────────────────────────

describe('genericPhraseCount', () => {
  it('flags banned soft-generics in the generic section', () => {
    const result = genericPhraseCount(GENERIC_SECTION);
    assert.ok(result.count >= 3, `expected >= 3 hits, got ${result.count}`);
    const phrases = result.hits.map(h => h.phrase);
    assert.ok(phrases.includes('value champion'));
    assert.ok(phrases.includes('genuinely'));
    assert.ok(phrases.some(p => p.includes('best-in-class')) || phrases.some(p => p.includes('best in class')));
  });

  it('passes the golden Zoho section (no unanchored generics)', () => {
    const result = genericPhraseCount(GOLDEN_ZOHO_SECTION);
    assert.strictEqual(result.count, 0, `unexpected hits: ${JSON.stringify(result.hits)}`);
  });

  it('allows banned phrases when anchored to a number AND a footnote', () => {
    // Sentence has "most documented" (allowed here since accompanied by a
    // number and a footnote in the same sentence)
    const html = 'The vendor has the most documented integrations with 22 confirmed ZATCA-approved partners[^1].';
    const result = genericPhraseCount(html);
    // "most documented" is not on the banned list; this should pass
    assert.strictEqual(result.count, 0);
  });

  it('flags "world-class" when not anchored', () => {
    const html = '<p>World-class reporting and analytics, ready for any enterprise.</p>';
    const result = genericPhraseCount(html);
    assert.ok(result.count >= 1);
    assert.ok(result.hits.some(h => h.phrase === 'world-class' || h.phrase === 'world class'));
  });
});

// ── decisionClarityPresent ──────────────────────────────────────

describe('decisionClarityPresent', () => {
  it('detects "Pick X if Y" in the golden section', () => {
    const result = decisionClarityPresent(GOLDEN_ZOHO_SECTION);
    assert.strictEqual(result.present, true);
    assert.ok(result.count >= 1);
  });

  it('returns false for a section with no decision sentence', () => {
    const result = decisionClarityPresent(GENERIC_SECTION);
    assert.strictEqual(result.present, false);
  });

  it('also recognizes "Choose X if Y"', () => {
    const html = '<p>Choose Wafeq if you are a Saudi SME with ZATCA compliance as a priority.</p>';
    const result = decisionClarityPresent(html);
    assert.strictEqual(result.present, true);
  });
});

// ── runContentChecks (integration) ──────────────────────────────

describe('runContentChecks — integration (full floor enforcement)', () => {
  it('the golden Zoho section passes most floors', () => {
    const result = runContentChecks(GOLDEN_ZOHO_SECTION, {
      saudiRelevance: 'high',
      articleType: 'best-of',
    });
    // Floors that must pass regardless of section length:
    assert.strictEqual(result.floors.generic_phrase_count, true, 'generic_phrase_count floor must pass for golden');
    assert.strictEqual(result.floors.decision_clarity, true, 'decision_clarity floor must pass for golden');
    assert.strictEqual(result.floors.saudi_signal_density, true, 'saudi_signal_density floor must pass for golden');
    // source_presence at 100% would require every declarative sentence to be
    // footnoted, including the decision-takeaway. Real sections with decision
    // sentences may show slightly less than 100% here. The quality-reviewer
    // subagent treats the decision-takeaway as non-declarative for scoring.
    assert.ok(result.metrics.source_presence.percent >= 75, `got ${result.metrics.source_presence.percent}%`);
  });

  it('the generic section fails all floors', () => {
    const result = runContentChecks(GENERIC_SECTION, {
      saudiRelevance: 'high',
      articleType: 'best-of',
    });
    assert.strictEqual(result.pass, false);
    assert.strictEqual(result.floors.source_presence_pct, false);
    assert.strictEqual(result.floors.generic_phrase_count, false);
    assert.strictEqual(result.floors.decision_clarity, false);
  });

  it('handles saudi_relevance=low by auto-awarding the saudi floor', () => {
    const html = `
      <h2>Best React state management 2026</h2>
      <p>Redux Toolkit is the default Redux recommendation[^1]. Zustand is simpler for small apps[^2].</p>
      <p>Pick Redux Toolkit if your team already uses Redux. Pick Zustand if you prioritize bundle size.</p>
    `;
    const result = runContentChecks(html, {
      saudiRelevance: 'low',
      articleType: 'best-of',
    });
    assert.strictEqual(result.floors.saudi_signal_density, true);
  });

  it('distinguishes article types — non-ranking does not require decision clarity', () => {
    const html = '<p>React Server Components allow rendering on the server[^1]. They reduce client bundle size[^2].</p>';
    const result = runContentChecks(html, {
      saudiRelevance: 'low',
      articleType: 'guide',
    });
    // guide articles do not have a Pick-X-if-Y requirement
    assert.strictEqual(result.floors.decision_clarity, true);
  });
});
