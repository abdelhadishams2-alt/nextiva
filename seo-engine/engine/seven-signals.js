/**
 * 7-Signal Weighted Quality Scoring — QG-002
 *
 * Computes 7 weighted quality signals from article metrics, checklist results,
 * and E-E-A-T scoring. Used by the quality-gate agent and the suggestions API.
 *
 * Signals:
 *   1. Content Depth & Structure (0.20)
 *   2. Keyword Integration (0.18)
 *   3. E-E-A-T Signals (0.16)
 *   4. Technical SEO (0.14)
 *   5. User Experience (0.12)
 *   6. Internal Linking (0.10)
 *   7. Internationalization (0.10)
 *
 * Zero npm dependencies — Node.js built-ins only.
 */

'use strict';

const SIGNAL_WEIGHTS = [
  { name: 'Content Depth & Structure', weight: 0.20 },
  { name: 'Keyword Integration', weight: 0.18 },
  { name: 'E-E-A-T Signals', weight: 0.16 },
  { name: 'Technical SEO', weight: 0.14 },
  { name: 'User Experience', weight: 0.12 },
  { name: 'Internal Linking', weight: 0.10 },
  { name: 'Internationalization', weight: 0.10 }
];

const PASS_THRESHOLD = 7.0;
const MAX_REVISION_PASSES = 2;

/**
 * Clamp a value to the 0-10 range, rounded to 1 decimal.
 */
function clamp(v) {
  return Math.round(Math.min(10, Math.max(0, v)) * 10) / 10;
}

/**
 * Compute 7 quality signals from extracted metrics, checklist, and E-E-A-T results.
 *
 * @param {object} metrics - Output from extractMetrics()
 * @param {object} checklist - Output from runChecklist()
 * @param {object} eeat - Output from runEEATScoring()
 * @returns {Array<{ name: string, score: number, weight: number, weighted_score: number, details: string }>}
 */
function computeSevenSignals(metrics, checklist, eeat) {
  const signals = [];

  // Signal 1: Content Depth & Structure (weight: 0.20)
  let s1 = 0;
  const wc = metrics.wordCount || 0;
  if (wc >= 2500) s1 += 4;
  else if (wc >= 1200) s1 += 2 + ((wc - 1200) / 1300) * 2;
  else if (wc >= 600) s1 += (wc - 600) / 600 * 2;
  else s1 += (wc / 600) * 1;

  if (metrics.h1Count === 1) s1 += 0.8;
  if (metrics.h2Count >= 6) s1 += 1; else s1 += (metrics.h2Count / 6) * 1;
  if (metrics.h3Count >= 10) s1 += 0.8; else s1 += (metrics.h3Count / 10) * 0.8;
  if (metrics.hasTOC) s1 += 1;
  if (metrics.hasFAQ && metrics.faqCount >= 8) s1 += 1;
  else if (metrics.hasFAQ) s1 += 0.5;
  if (metrics.hasQuickAnswer) s1 += 0.7;
  if (metrics.tableCount >= 2) s1 += 0.4;
  else if (metrics.tableCount >= 1) s1 += 0.2;
  if (metrics.blockquoteCount >= 1) s1 += 0.3;

  signals.push({
    name: 'Content Depth & Structure',
    score: clamp(s1),
    weight: 0.20,
    weighted_score: Math.round(clamp(s1) * 0.20 * 100) / 100,
    details: `Words: ${wc}, H2: ${metrics.h2Count}, H3: ${metrics.h3Count}, TOC: ${metrics.hasTOC ? 'yes' : 'no'}, FAQ: ${metrics.hasFAQ ? metrics.faqCount + 'q' : 'no'}`
  });

  // Signal 2: Keyword Integration (weight: 0.18)
  let s2 = 0;
  if (metrics.keywordInTitle) s2 += 2;
  if (metrics.keywordInFirstParagraph) s2 += 1.5;
  if (metrics.keywordInH2H3Count > 0) s2 += 1;
  if (metrics.keywordInH2H3Count > 1) s2 += 0.5;

  const density = metrics.keywordDensity || 0;
  if (density >= 0.8 && density <= 2.5) s2 += 2;
  else if (density > 0 && density < 0.8) s2 += 1;
  else if (density > 2.5) s2 += 0.5;

  const kwCount = metrics.keywordCount || 0;
  if (kwCount >= 8 && kwCount <= 15) s2 += 1.5;
  else if (kwCount >= 4) s2 += 0.8;

  const h2h3Total = (metrics.h2Count || 0) + (metrics.h3Count || 0);
  const kwInHeadings = metrics.keywordInH2H3Count || 0;
  const headingCoverage = h2h3Total > 0 ? kwInHeadings / h2h3Total : 0;
  if (headingCoverage >= 0.3 && headingCoverage <= 0.4) s2 += 1.5;
  else if (headingCoverage > 0) s2 += headingCoverage * 3;

  signals.push({
    name: 'Keyword Integration',
    score: clamp(s2),
    weight: 0.18,
    weighted_score: Math.round(clamp(s2) * 0.18 * 100) / 100,
    details: `Density: ${density.toFixed(2)}%, count: ${kwCount}, in title: ${metrics.keywordInTitle ? 'yes' : 'no'}, heading coverage: ${(headingCoverage * 100).toFixed(0)}%`
  });

  // Signal 3: E-E-A-T Signals (weight: 0.16)
  const eeatTotal = eeat && eeat.totalScore ? eeat.totalScore : 0;
  const eeatMax = eeat && eeat.maxScore ? eeat.maxScore : 30;
  const eeatScore = (eeatTotal / eeatMax) * 10;
  signals.push({
    name: 'E-E-A-T Signals',
    score: clamp(eeatScore),
    weight: 0.16,
    weighted_score: Math.round(clamp(eeatScore) * 0.16 * 100) / 100,
    details: `Grade: ${eeat ? eeat.grade : 'N/A'}, score: ${eeatTotal}/${eeatMax}`
  });

  // Signal 4: Technical SEO (weight: 0.14)
  let s4 = 0;
  const titleLen = (metrics.metaTitle || '').length;
  if (titleLen >= 50 && titleLen <= 60) s4 += 2;
  else if (titleLen > 30 && titleLen < 70) s4 += 1;
  const descLen = (metrics.metaDescription || '').length;
  if (descLen >= 145 && descLen <= 154) s4 += 2;
  else if (descLen >= 120 && descLen <= 160) s4 += 1;
  if (metrics.h1Count === 1) s4 += 2;
  else if (metrics.h1Count > 1) s4 += 0.5;
  if (metrics.hasProperHierarchy) s4 += 2; else s4 += 1;
  if (metrics.hasSchemaMarkup) s4 += 2;

  signals.push({
    name: 'Technical SEO',
    score: clamp(s4),
    weight: 0.14,
    weighted_score: Math.round(clamp(s4) * 0.14 * 100) / 100,
    details: `Title: ${titleLen}ch, desc: ${descLen}ch, H1: ${metrics.h1Count}, schema: ${metrics.hasSchemaMarkup ? 'yes' : 'no'}`
  });

  // Signal 5: User Experience (weight: 0.12)
  let s5 = 0;
  if ((metrics.avgParagraphLength || 0) <= 80) s5 += 2; else s5 += 1;
  if ((metrics.listCount || 0) >= 3) s5 += 2; else s5 += ((metrics.listCount || 0) / 3) * 2;
  if ((metrics.boldCount || 0) >= 5) s5 += 1.5; else s5 += ((metrics.boldCount || 0) / 5) * 1.5;
  if ((metrics.imageCount || 0) >= 4) s5 += 2; else s5 += ((metrics.imageCount || 0) / 4) * 2;
  if (metrics.imageCount > 0 && metrics.imagesWithAlt === metrics.imageCount) s5 += 1.5;
  else if (metrics.imagesWithAlt > 0) s5 += 0.8;
  if ((metrics.ctaCount || 0) >= 1) s5 += 1;

  signals.push({
    name: 'User Experience',
    score: clamp(s5),
    weight: 0.12,
    weighted_score: Math.round(clamp(s5) * 0.12 * 100) / 100,
    details: `Lists: ${metrics.listCount || 0}, images: ${metrics.imageCount || 0}, bolds: ${metrics.boldCount || 0}, CTAs: ${metrics.ctaCount || 0}`
  });

  // Signal 6: Internal Linking (weight: 0.10)
  let s6 = 0;
  const ilc = metrics.internalLinkCount || 0;
  if (ilc >= 12) s6 += 5;
  else if (ilc >= 8) s6 += 4;
  else if (ilc >= 4) s6 += 3;
  else if (ilc >= 1) s6 += ilc;
  // Distribution and anchor quality from checklist
  const linkItems = (checklist.items || []).filter(i => i.category === 'Link Architecture');
  const linkPassed = linkItems.filter(i => i.status === 'pass').length;
  const linkTotal = linkItems.length || 1;
  s6 += (linkPassed / linkTotal) * 5;

  signals.push({
    name: 'Internal Linking',
    score: clamp(s6),
    weight: 0.10,
    weighted_score: Math.round(clamp(s6) * 0.10 * 100) / 100,
    details: `Internal links: ${ilc}, link checklist: ${linkPassed}/${linkTotal} passed`
  });

  // Signal 7: Internationalization (weight: 0.10)
  let s7 = 8.0; // Default for non-Arabic content
  if (metrics.hasArabicContent) {
    s7 = 0;
    if (metrics.hasRTLAttribute) s7 += 3;
    if (metrics.hasArabicFont) s7 += 3;
    if (metrics.hasRTLAlignment) s7 += 2;
    s7 += 2; // Language detected correctly
  }

  signals.push({
    name: 'Internationalization',
    score: clamp(s7),
    weight: 0.10,
    weighted_score: Math.round(clamp(s7) * 0.10 * 100) / 100,
    details: metrics.hasArabicContent
      ? `Arabic content: RTL=${metrics.hasRTLAttribute ? 'yes' : 'no'}, Arabic font=${metrics.hasArabicFont ? 'yes' : 'no'}`
      : 'Non-Arabic content (auto-pass)'
  });

  return signals;
}

/**
 * Compute overall score from 7 signals.
 *
 * @param {Array} signals - Output from computeSevenSignals()
 * @returns {number} Overall score 0-10, rounded to 1 decimal
 */
function computeOverallScore(signals) {
  const sum = signals.reduce((acc, s) => acc + s.weighted_score, 0);
  return Math.round(sum * 10) / 10;
}

/**
 * Determine pass/fail/warning based on overall score and revision pass count.
 *
 * @param {number} overallScore - Overall weighted score 0-10
 * @param {number} revisionPass - Current revision pass number (0, 1, or 2)
 * @returns {{ pass: boolean, pass_with_warning: boolean, needs_revision: boolean }}
 */
function determineResult(overallScore, revisionPass) {
  if (overallScore >= PASS_THRESHOLD) {
    return { pass: true, pass_with_warning: false, needs_revision: false };
  }
  if (revisionPass >= MAX_REVISION_PASSES) {
    return { pass: true, pass_with_warning: true, needs_revision: false };
  }
  return { pass: false, pass_with_warning: false, needs_revision: true };
}

/**
 * Generate revision instructions from signals and suggestions.
 *
 * @param {Array} signals - Output from computeSevenSignals()
 * @param {Array} suggestions - Output from generateSuggestions()
 * @param {number} maxInstructions - Maximum number of instructions (default: 10)
 * @returns {Array<{ signal: string, section: string, action: string, details: string }>}
 */
function generateRevisionInstructions(signals, suggestions, maxInstructions = 10) {
  const instructions = [];

  // Sort signals by score ascending (worst first)
  const failingSignals = signals
    .filter(s => s.score < 7.0)
    .sort((a, b) => a.score - b.score);

  for (const sig of failingSignals) {
    const relatedSuggestions = suggestions.filter(s => {
      if (sig.name === 'Content Depth & Structure') return ['Content Structure', 'Content Elements'].includes(s.category);
      if (sig.name === 'Keyword Integration') return s.category === 'Keyword Optimization';
      if (sig.name === 'E-E-A-T Signals') return s.category && s.category.startsWith('E-E-A-T');
      if (sig.name === 'Technical SEO') return s.category === 'Technical SEO';
      if (sig.name === 'User Experience') return ['Readability & Formatting', 'Media & Images'].includes(s.category);
      if (sig.name === 'Internal Linking') return s.category === 'Link Architecture';
      if (sig.name === 'Internationalization') return s.category === 'Internationalization';
      return false;
    });

    for (const rs of relatedSuggestions.slice(0, 3)) {
      instructions.push({
        signal: sig.name,
        section: 'body',
        action: 'improve',
        details: rs.suggestion
      });
    }
  }

  return instructions.slice(0, maxInstructions);
}

module.exports = {
  computeSevenSignals,
  computeOverallScore,
  determineResult,
  generateRevisionInstructions,
  SIGNAL_WEIGHTS,
  PASS_THRESHOLD,
  MAX_REVISION_PASSES,
  clamp
};
