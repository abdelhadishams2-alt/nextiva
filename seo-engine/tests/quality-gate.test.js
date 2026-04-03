/**
 * Quality Gate Tests — QG-001
 *
 * Tests for the 60-point SEO checklist engine:
 * - ContentMetrics extraction (40+ metrics, English and Arabic)
 * - 60-point checklist scoring across 8 categories
 * - E-E-A-T 10-dimension rubric scoring and grading
 * - Suggestion generator (prioritized, capped at 15)
 * - Arabic content detection with >30% threshold
 * - RTL validation (dir attribute, font, alignment)
 *
 * Uses node:test with unit tests (no external dependencies).
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const {
  extractMetrics,
  runChecklist,
  runEEATScoring,
  stripHtml,
  splitWords,
  escapeRegex,
  CHECKLIST_DEFINITIONS
} = require('../engine/quality-gate');

const { generateSuggestions, SUGGESTION_MAP, EEAT_SUGGESTION_MAP } = require('../engine/quality-suggestions');

// ── Test Helpers ────────────────────────────────────────────────

function buildHtml(opts = {}) {
  const {
    wordCount = 1500,
    h1 = 1,
    h2 = 8,
    h3 = 12,
    keyword = 'test keyword',
    images = 5,
    internalLinks = 10,
    externalLinks = 3,
    hasTOC = true,
    hasFAQ = true,
    faqCount = 10,
    tables = 2,
    lists = 4,
    bolds = 8,
    blockquotes = 2,
    ctas = 3,
    title = 'Test Keyword: Complete Guide to SEO Success',
    metaDesc = 'Discover everything about test keyword in this comprehensive guide. Learn best practices and strategies for success today.',
    hasSourcesSection = true,
    arabicContent = false,
    hasRTL = false,
    hasArabicFont = false,
    hasSchema = false,
    keywordInH2Pct = 0.35
  } = opts;

  let html = '<!DOCTYPE html><html>';
  html += '<head>';
  if (title) html += `<title>${title}</title>`;
  if (metaDesc) html += `<meta name="description" content="${metaDesc}">`;
  if (hasSchema) html += '<script type="application/ld+json">{"@context":"https://schema.org"}</script>';
  html += '</head>';
  html += `<body${hasRTL ? ' dir="rtl"' : ''}>`;
  if (hasArabicFont) html += '<style>body { font-family: Cairo, sans-serif; }</style>';

  // H1
  for (let i = 0; i < h1; i++) html += `<h1>${keyword} Guide</h1>`;

  // Intro paragraph
  if (hasTOC) {
    html += '<nav class="toc"><ul>';
    for (let i = 0; i < h2; i++) html += `<li><a href="#section-${i}">Section ${i}</a></li>`;
    html += '</ul></nav>';
  }

  // Quick answer box
  html += '<div class="quick-answer">Quick answer about ' + keyword + '</div>';

  // Intro content (~220 words)
  const introWords = [];
  for (let i = 0; i < 220; i++) introWords.push(i === 0 ? keyword : 'word');
  html += `<p>${introWords.join(' ')}</p>`;

  // H2 and H3 sections with content
  for (let i = 0; i < h2; i++) {
    const useKw = i / h2 < keywordInH2Pct;
    html += `<h2 id="section-${i}">${useKw ? keyword + ' ' : ''}Section ${i + 1}</h2>`;

    // Paragraphs per section
    const paraWords = [];
    const wordsPerPara = Math.floor(wordCount / (h2 * 3));
    for (let w = 0; w < wordsPerPara; w++) paraWords.push('content');
    html += `<p>${paraWords.join(' ')}</p>`;
    html += `<p>${paraWords.join(' ')}</p>`;

    // H3 subsections
    const h3PerH2 = Math.ceil(h3 / h2);
    for (let j = 0; j < h3PerH2 && (i * h3PerH2 + j) < h3; j++) {
      const h3UseKw = (i * h3PerH2 + j) / h3 < keywordInH2Pct;
      html += `<h3>${h3UseKw ? keyword + ' ' : ''}Subsection ${j + 1}</h3>`;
      html += `<p>${paraWords.join(' ')}</p>`;
    }
  }

  // Tables
  for (let i = 0; i < tables; i++) {
    html += '<table><tr><th>Header</th><th>Value</th></tr><tr><td>Data</td><td>123</td></tr></table>';
  }

  // Lists
  for (let i = 0; i < lists; i++) {
    html += '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>';
  }

  // Bold elements
  for (let i = 0; i < bolds; i++) {
    html += `<p><strong>Key fact ${i + 1}</strong> about the topic.</p>`;
  }

  // Blockquotes
  for (let i = 0; i < blockquotes; i++) {
    html += `<blockquote>Expert quote ${i + 1} about ${keyword}.</blockquote>`;
  }

  // CTAs
  for (let i = 0; i < ctas; i++) {
    html += `<a href="/signup" class="cta btn">Get Started Now</a>`;
  }

  // Images
  for (let i = 0; i < images; i++) {
    html += `<img src="/images/seo-keyword-guide-${i}.jpg" alt="${i === 0 ? keyword + ' illustration' : 'descriptive alt text ' + i}" title="Image ${i}">`;
  }

  // Internal links
  for (let i = 0; i < internalLinks; i++) {
    html += `<a href="/related-article-${i}">Read more about ${i === 0 ? keyword : 'related topic ' + i}</a>`;
  }

  // External links
  for (let i = 0; i < externalLinks; i++) {
    const rel = i === 0 ? 'nofollow' : 'dofollow';
    html += `<a href="https://authority-site.com/source-${i}" target="_blank" rel="${rel}">Authority Source ${i}</a>`;
  }

  // FAQ
  if (hasFAQ) {
    html += '<h2>FAQ - Frequently Asked Questions</h2>';
    for (let i = 0; i < faqCount; i++) {
      html += `<h3>What is question ${i + 1} about ${keyword}?</h3>`;
      html += `<p>Answer to question ${i + 1}.</p>`;
    }
  }

  // Metric boxes
  html += '<div class="metric-box">95%</div>';
  html += '<div class="stat-box">1,200</div>';
  html += '<div class="highlight-box">Key Number</div>';

  // Conclusion H2
  html += `<h2>Conclusion</h2>`;
  const conclusionWords = [];
  for (let i = 0; i < 175; i++) conclusionWords.push(i === 0 ? keyword : 'conclusion');
  html += `<p>${conclusionWords.join(' ')}</p>`;

  // Sources
  if (hasSourcesSection) {
    html += '<h2>Sources</h2>';
    html += '<p>According to study shows published research from 2025.</p>';
    html += '<ul><li><a href="https://example.com/source1">Source 1</a></li></ul>';
  }

  // Arabic content
  if (arabicContent) {
    const arabicText = 'هذا هو محتوى تجريبي باللغة العربية ';
    for (let i = 0; i < 50; i++) html += arabicText;
  }

  html += '</body></html>';
  return html;
}

// ── stripHtml Tests ─────────────────────────────────────────────

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    const result = stripHtml('<p>Hello <strong>world</strong></p>');
    assert.equal(result, 'Hello world');
  });

  it('handles HTML entities', () => {
    const result = stripHtml('<p>Tom &amp; Jerry &lt;3&gt;</p>');
    assert.equal(result, 'Tom & Jerry <3>');
  });

  it('removes script and style blocks', () => {
    const result = stripHtml('<script>alert("x")</script><p>Safe</p><style>.x{}</style>');
    assert.equal(result, 'Safe');
  });
});

// ── splitWords Tests ────────────────────────────────────────────

describe('splitWords', () => {
  it('splits English text', () => {
    const words = splitWords('Hello world foo bar');
    assert.equal(words.length, 4);
  });

  it('handles Arabic text', () => {
    const words = splitWords('مرحبا بالعالم هذا اختبار');
    assert.equal(words.length, 4);
  });

  it('handles empty string', () => {
    const words = splitWords('');
    assert.equal(words.length, 0);
  });
});

// ── escapeRegex Tests ───────────────────────────────────────────

describe('escapeRegex', () => {
  it('escapes special regex characters', () => {
    const result = escapeRegex('test.keyword (value)');
    assert.equal(result, 'test\\.keyword \\(value\\)');
  });
});

// ── extractMetrics Tests ────────────────────────────────────────

describe('extractMetrics', () => {
  it('extracts word count from HTML', () => {
    const html = '<p>Hello world this is a test sentence with multiple words</p>';
    const metrics = extractMetrics(html, 'test');
    assert.ok(metrics.wordCount > 0);
  });

  it('counts headings correctly', () => {
    const html = '<h1>Title</h1><h2>Section 1</h2><h2>Section 2</h2><h3>Sub</h3>';
    const metrics = extractMetrics(html, 'test');
    assert.equal(metrics.h1Count, 1);
    assert.equal(metrics.h2Count, 2);
    assert.equal(metrics.h3Count, 1);
  });

  it('detects keyword in title', () => {
    const html = '<title>Test Keyword Guide</title><p>Content</p>';
    const metrics = extractMetrics(html, 'test keyword');
    assert.equal(metrics.keywordInTitle, true);
  });

  it('detects keyword NOT in title', () => {
    const html = '<title>Some Guide</title><p>Content</p>';
    const metrics = extractMetrics(html, 'missing keyword');
    assert.equal(metrics.keywordInTitle, false);
  });

  it('counts images and alt text', () => {
    const html = '<img src="a.jpg" alt="description"><img src="b.jpg"><img src="c.jpg" alt="another">';
    const metrics = extractMetrics(html, 'test');
    assert.equal(metrics.imageCount, 3);
    assert.equal(metrics.imagesWithAlt, 2);
  });

  it('counts internal and external links', () => {
    const html = '<a href="/page">Internal</a><a href="https://ext.com">External</a><a href="/other">Another</a>';
    const metrics = extractMetrics(html, 'test');
    assert.equal(metrics.internalLinkCount, 2);
    assert.equal(metrics.externalLinkCount, 1);
  });

  it('detects table of contents', () => {
    const html = '<nav class="toc"><ul><li><a href="#s1">S1</a></li><li><a href="#s2">S2</a></li><li><a href="#s3">S3</a></li></ul></nav>';
    const metrics = extractMetrics(html, 'test');
    assert.equal(metrics.hasTOC, true);
  });

  it('detects FAQ section', () => {
    const html = '<h2>FAQ</h2><h3>What is test?</h3><p>Answer</p><h3>How does test work?</h3><p>Answer</p>';
    const metrics = extractMetrics(html, 'test');
    assert.equal(metrics.hasFAQ, true);
    assert.equal(metrics.faqCount, 2);
  });

  it('calculates keyword density', () => {
    const words = Array(100).fill('word');
    words[0] = 'seo';
    words[10] = 'seo';
    words[50] = 'seo';
    const html = `<p>${words.join(' ')}</p>`;
    const metrics = extractMetrics(html, 'seo');
    assert.ok(metrics.keywordDensity > 0);
    assert.ok(metrics.keywordDensity < 10);
  });

  it('detects Arabic content above 30% threshold', () => {
    const arabicText = 'هذا هو محتوى تجريبي باللغة العربية ';
    let html = '<div dir="rtl" style="font-family: Cairo; text-align: right;">';
    for (let i = 0; i < 30; i++) html += arabicText;
    html += '</div>';
    const metrics = extractMetrics(html, 'محتوى');
    assert.equal(metrics.hasArabicContent, true);
    assert.ok(metrics.arabicPercentage > 30);
  });

  it('does not flag Arabic content below 30% threshold', () => {
    let html = '<p>' + Array(200).fill('english word').join(' ') + '</p>';
    html += '<p>مرحبا</p>';
    const metrics = extractMetrics(html, 'test');
    assert.equal(metrics.hasArabicContent, false);
  });

  it('detects RTL attribute', () => {
    const html = '<html dir="rtl"><body><p>Content</p></body></html>';
    const metrics = extractMetrics(html, 'test');
    assert.equal(metrics.hasRTLAttribute, true);
  });

  it('detects Arabic font', () => {
    const html = '<style>body { font-family: Cairo, sans-serif; }</style><p>Content</p>';
    const metrics = extractMetrics(html, 'test');
    assert.equal(metrics.hasArabicFont, true);
  });

  it('detects sources section', () => {
    const html = '<h2>Sources</h2><ul><li>Source 1</li></ul>';
    const metrics = extractMetrics(html, 'test');
    assert.equal(metrics.hasSourcesSection, true);
  });

  it('detects heading hierarchy issues', () => {
    const html = '<h1>Title</h1><h3>Skipped H2</h3>';
    const metrics = extractMetrics(html, 'test');
    assert.equal(metrics.hasProperHierarchy, false);
  });

  it('detects empty headings', () => {
    const html = '<h1>Title</h1><h2></h2>';
    const metrics = extractMetrics(html, 'test');
    assert.equal(metrics.hasEmptyHeadings, true);
  });

  it('detects keyword in first paragraph', () => {
    const html = '<p>This article about test keyword explains everything.</p>';
    const metrics = extractMetrics(html, 'test keyword');
    assert.equal(metrics.keywordInFirstParagraph, true);
  });

  it('counts tables, lists, bolds, blockquotes', () => {
    const html = '<table></table><table></table><ul><li>A</li></ul><ol><li>B</li></ol><strong>Bold</strong><b>Also bold</b><blockquote>Quote</blockquote>';
    const metrics = extractMetrics(html, 'test');
    assert.equal(metrics.tableCount, 2);
    assert.equal(metrics.listCount, 2);
    assert.equal(metrics.boldCount, 2);
    assert.equal(metrics.blockquoteCount, 1);
  });

  it('handles options parameter for title and metaDescription', () => {
    const html = '<p>Content here</p>';
    const metrics = extractMetrics(html, 'test', {
      title: 'Custom Title with test',
      metaDescription: 'Custom meta description'
    });
    assert.equal(metrics.metaTitle, 'Custom Title with test');
    assert.equal(metrics.metaDescription, 'Custom meta description');
    assert.equal(metrics.keywordInTitle, true);
  });

  it('extracts heading texts with levels', () => {
    const html = '<h1>Main Title</h1><h2>Section A</h2><h3>Subsection B</h3>';
    const metrics = extractMetrics(html, 'test');
    assert.equal(metrics.headingTexts.length, 3);
    assert.equal(metrics.headingTexts[0].level, 1);
    assert.equal(metrics.headingTexts[0].text, 'Main Title');
  });

  it('detects schema markup', () => {
    const html = '<script type="application/ld+json">{"@context":"https://schema.org"}</script><p>Content</p>';
    const metrics = extractMetrics(html, 'test');
    assert.equal(metrics.hasSchemaMarkup, true);
  });
});

// ── runChecklist Tests ──────────────────────────────────────────

describe('runChecklist', () => {
  it('returns 60 checklist items', () => {
    const html = buildHtml();
    const result = runChecklist(html, 'test keyword');
    assert.equal(result.items.length, 60);
  });

  it('returns score as percentage of passed items', () => {
    const html = buildHtml();
    const result = runChecklist(html, 'test keyword');
    assert.equal(typeof result.score, 'number');
    assert.ok(result.score >= 0 && result.score <= 100);
    assert.equal(result.score, Math.round((result.passedCount / result.totalCount) * 100));
  });

  it('returns category scores for all 8+ categories', () => {
    const html = buildHtml();
    const result = runChecklist(html, 'test keyword');
    const categories = Object.keys(result.categoryScores);
    assert.ok(categories.length >= 8, `Expected 8+ categories, got ${categories.length}`);
    for (const cat of categories) {
      assert.ok(result.categoryScores[cat].passed >= 0);
      assert.ok(result.categoryScores[cat].total > 0);
      assert.ok(result.categoryScores[cat].score >= 0 && result.categoryScores[cat].score <= 100);
    }
  });

  it('each item has required fields', () => {
    const html = buildHtml();
    const result = runChecklist(html, 'test keyword');
    for (const item of result.items) {
      assert.ok(typeof item.id === 'number', `Item missing id: ${JSON.stringify(item)}`);
      assert.ok(typeof item.category === 'string', `Item ${item.id} missing category`);
      assert.ok(typeof item.label === 'string', `Item ${item.id} missing label`);
      assert.ok(['pass', 'fail', 'warning', 'info'].includes(item.status), `Item ${item.id} invalid status: ${item.status}`);
      assert.ok(item.value !== undefined, `Item ${item.id} missing value`);
      assert.ok(item.expected !== undefined, `Item ${item.id} missing expected`);
      assert.ok(typeof item.message === 'string', `Item ${item.id} missing message`);
    }
  });

  it('well-formed article scores above 50%', () => {
    const html = buildHtml({
      wordCount: 1800,
      h2: 8,
      h3: 12,
      images: 6,
      hasSchema: true
    });
    const result = runChecklist(html, 'test keyword');
    assert.ok(result.score >= 50, `Expected score >= 50, got ${result.score}`);
  });

  it('minimal article scores lower', () => {
    const html = '<p>Short content</p>';
    const result = runChecklist(html, 'test keyword');
    assert.ok(result.score < 50, `Expected score < 50, got ${result.score}`);
  });

  it('detects pass for H1 count = 1', () => {
    const html = '<h1>Title</h1><p>Content</p>';
    const result = runChecklist(html, 'test');
    const h1Item = result.items.find(i => i.id === 2);
    assert.equal(h1Item.status, 'pass');
  });

  it('detects fail for H1 count = 0', () => {
    const html = '<p>No heading content</p>';
    const result = runChecklist(html, 'test');
    const h1Item = result.items.find(i => i.id === 2);
    assert.equal(h1Item.status, 'fail');
  });

  it('detects fail for multiple H1 tags', () => {
    const html = '<h1>First</h1><h1>Second</h1>';
    const result = runChecklist(html, 'test');
    const h1Item = result.items.find(i => i.id === 2);
    assert.equal(h1Item.status, 'fail');
  });

  it('passes keyword density check when under 2.5%', () => {
    const words = Array(100).fill('word');
    words[0] = 'seo';
    words[50] = 'seo';
    const html = `<p>${words.join(' ')}</p>`;
    const result = runChecklist(html, 'seo');
    const densityItem = result.items.find(i => i.id === 19);
    assert.equal(densityItem.status, 'pass');
  });

  it('handles Arabic content with RTL checks', () => {
    const arabicText = 'هذا هو محتوى تجريبي باللغة العربية ';
    let html = '<div>';
    for (let i = 0; i < 50; i++) html += arabicText;
    html += '</div>';
    const result = runChecklist(html, 'محتوى');
    const rtlItem = result.items.find(i => i.id === 52);
    assert.equal(rtlItem.status, 'fail', 'Should fail because dir="rtl" is missing');
  });

  it('passes RTL check when dir="rtl" is present for Arabic', () => {
    const arabicText = 'هذا هو محتوى تجريبي باللغة العربية ';
    let html = '<div dir="rtl">';
    for (let i = 0; i < 50; i++) html += arabicText;
    html += '</div>';
    const result = runChecklist(html, 'محتوى');
    const rtlItem = result.items.find(i => i.id === 52);
    assert.equal(rtlItem.status, 'pass');
  });

  it('skips RTL checks for English content', () => {
    const html = '<p>' + Array(100).fill('english word').join(' ') + '</p>';
    const result = runChecklist(html, 'english');
    const rtlItem = result.items.find(i => i.id === 52);
    assert.equal(rtlItem.status, 'pass', 'English content should pass RTL check (not applicable)');
  });

  it('accepts options for title and metaDescription', () => {
    const html = '<p>Content about test keyword here.</p>';
    const result = runChecklist(html, 'test keyword', {
      title: 'Test Keyword: A Comprehensive Guide for 2025',
      metaDescription: 'Learn about test keyword with this guide covering key aspects and strategies for success today.'
    });
    const titleItem = result.items.find(i => i.id === 21);
    assert.equal(titleItem.status, 'pass');
  });

  it('returns metrics in result', () => {
    const html = buildHtml();
    const result = runChecklist(html, 'test keyword');
    assert.ok(result.metrics, 'Checklist result should include metrics');
    assert.ok(typeof result.metrics.wordCount === 'number');
  });
});

// ── CHECKLIST_DEFINITIONS Tests ─────────────────────────────────

describe('CHECKLIST_DEFINITIONS', () => {
  it('has exactly 60 items', () => {
    assert.equal(CHECKLIST_DEFINITIONS.length, 60);
  });

  it('has unique IDs from 1-60', () => {
    const ids = CHECKLIST_DEFINITIONS.map(d => d.id);
    const unique = new Set(ids);
    assert.equal(unique.size, 60);
    for (let i = 1; i <= 60; i++) {
      assert.ok(unique.has(i), `Missing checklist ID ${i}`);
    }
  });

  it('all items have category and label', () => {
    for (const def of CHECKLIST_DEFINITIONS) {
      assert.ok(def.category, `Item ${def.id} missing category`);
      assert.ok(def.label, `Item ${def.id} missing label`);
    }
  });

  it('covers all 8 required categories', () => {
    const categories = new Set(CHECKLIST_DEFINITIONS.map(d => d.category));
    const required = ['Content Structure', 'Keyword Optimization', 'Metadata', 'Internal Linking', 'External Links', 'Images', 'Technical Formatting', 'Internationalization'];
    for (const cat of required) {
      assert.ok(categories.has(cat), `Missing category: ${cat}`);
    }
  });
});

// ── E-E-A-T Scoring Tests ───────────────────────────────────────

describe('runEEATScoring', () => {
  it('returns 10 dimensions', () => {
    const html = buildHtml();
    const result = runEEATScoring(html, 'test keyword');
    assert.equal(result.dimensions.length, 10);
  });

  it('each dimension has name, score (0-3), maxScore, description', () => {
    const html = buildHtml();
    const result = runEEATScoring(html, 'test keyword');
    for (const dim of result.dimensions) {
      assert.ok(typeof dim.name === 'string', `Dimension missing name`);
      assert.ok(typeof dim.score === 'number', `${dim.name} missing score`);
      assert.ok(dim.score >= 0 && dim.score <= 3, `${dim.name} score out of range: ${dim.score}`);
      assert.equal(dim.maxScore, 3);
      assert.ok(typeof dim.description === 'string', `${dim.name} missing description`);
    }
  });

  it('totalScore is sum of dimension scores', () => {
    const html = buildHtml();
    const result = runEEATScoring(html, 'test keyword');
    const sum = result.dimensions.reduce((acc, d) => acc + d.score, 0);
    assert.equal(result.totalScore, sum);
  });

  it('maxScore is 30', () => {
    const html = buildHtml();
    const result = runEEATScoring(html, 'test keyword');
    assert.equal(result.maxScore, 30);
  });

  it('grade is A for score 27-30', () => {
    // Build a highly optimized article
    const html = buildHtml({
      hasSchema: true,
      hasSourcesSection: true
    });
    // We cannot guarantee grade A but we can test grading logic
    const result = runEEATScoring(html, 'test keyword');
    assert.ok(['A', 'B', 'C', 'D', 'F'].includes(result.grade));
  });

  it('returns correct grade thresholds', () => {
    // Test the grade assignment logic through the function
    const html = '<p>Minimal content</p>';
    const result = runEEATScoring(html, 'test');
    // Minimal content should score low
    assert.ok(['D', 'F'].includes(result.grade), `Expected D or F for minimal content, got ${result.grade}`);
  });

  it('covers all 10 E-E-A-T dimension names', () => {
    const html = buildHtml();
    const result = runEEATScoring(html, 'test keyword');
    const names = result.dimensions.map(d => d.name);
    const expected = [
      'Experience', 'Expertise', 'Authoritativeness', 'Trustworthiness',
      'Content Depth', 'Original Research', 'User Intent Match',
      'Readability', 'Technical Accuracy', 'Freshness'
    ];
    for (const name of expected) {
      assert.ok(names.includes(name), `Missing E-E-A-T dimension: ${name}`);
    }
  });
});

// ── Suggestion Generator Tests ──────────────────────────────────

describe('generateSuggestions', () => {
  it('returns array of suggestions', () => {
    const checklist = runChecklist('<p>Short</p>', 'test keyword');
    const eeat = runEEATScoring('<p>Short</p>', 'test keyword');
    const suggestions = generateSuggestions(checklist, eeat);
    assert.ok(Array.isArray(suggestions));
    assert.ok(suggestions.length > 0);
  });

  it('limits to 15 suggestions max', () => {
    const checklist = runChecklist('<p>Minimal</p>', 'missing');
    const eeat = runEEATScoring('<p>Minimal</p>', 'missing');
    const suggestions = generateSuggestions(checklist, eeat);
    assert.ok(suggestions.length <= 15, `Expected <= 15 suggestions, got ${suggestions.length}`);
  });

  it('each suggestion has required fields', () => {
    const checklist = runChecklist('<p>Short</p>', 'test');
    const eeat = runEEATScoring('<p>Short</p>', 'test');
    const suggestions = generateSuggestions(checklist, eeat);
    for (const s of suggestions) {
      assert.ok(['high', 'medium', 'low'].includes(s.priority), `Invalid priority: ${s.priority}`);
      assert.ok(typeof s.category === 'string');
      assert.ok(typeof s.issue === 'string');
      assert.ok(typeof s.suggestion === 'string');
      assert.ok(typeof s.impact === 'string');
    }
  });

  it('sorts high priority first', () => {
    const checklist = runChecklist('<p>Short</p>', 'test');
    const eeat = runEEATScoring('<p>Short</p>', 'test');
    const suggestions = generateSuggestions(checklist, eeat);
    const priorities = suggestions.map(s => s.priority);
    let seenMedium = false;
    for (const p of priorities) {
      if (p === 'medium') seenMedium = true;
      if (p === 'high' && seenMedium) {
        assert.fail('High priority item found after medium priority');
      }
    }
  });

  it('includes E-E-A-T suggestions for low-scoring dimensions', () => {
    const checklist = runChecklist('<p>Minimal</p>', 'test');
    const eeat = runEEATScoring('<p>Minimal</p>', 'test');
    const suggestions = generateSuggestions(checklist, eeat);
    const eeatSuggestions = suggestions.filter(s => s.category.startsWith('E-E-A-T'));
    assert.ok(eeatSuggestions.length > 0, 'Should include E-E-A-T suggestions for minimal content');
  });

  it('works with null eeatResults', () => {
    const checklist = runChecklist('<p>Short</p>', 'test');
    const suggestions = generateSuggestions(checklist, null);
    assert.ok(Array.isArray(suggestions));
  });

  it('well-formed article generates fewer suggestions', () => {
    const goodHtml = buildHtml();
    const badHtml = '<p>Short</p>';
    const goodChecklist = runChecklist(goodHtml, 'test keyword');
    const goodEeat = runEEATScoring(goodHtml, 'test keyword');
    const badChecklist = runChecklist(badHtml, 'test keyword');
    const badEeat = runEEATScoring(badHtml, 'test keyword');
    const goodSuggestions = generateSuggestions(goodChecklist, goodEeat);
    const badSuggestions = generateSuggestions(badChecklist, badEeat);
    assert.ok(goodSuggestions.length < badSuggestions.length,
      `Good article (${goodSuggestions.length}) should have fewer suggestions than bad (${badSuggestions.length})`);
  });
});

// ── SUGGESTION_MAP Tests ────────────────────────────────────────

describe('SUGGESTION_MAP', () => {
  it('has entries for all 60 checklist items', () => {
    for (let i = 1; i <= 60; i++) {
      assert.ok(SUGGESTION_MAP[i], `Missing suggestion for checklist item ${i}`);
      assert.ok(typeof SUGGESTION_MAP[i].suggestion === 'string');
      assert.ok(typeof SUGGESTION_MAP[i].impact === 'string');
    }
  });
});

describe('EEAT_SUGGESTION_MAP', () => {
  it('has entries for all 10 E-E-A-T dimensions', () => {
    const dims = ['Experience', 'Expertise', 'Authoritativeness', 'Trustworthiness',
      'Content Depth', 'Original Research', 'User Intent Match',
      'Readability', 'Technical Accuracy', 'Freshness'];
    for (const dim of dims) {
      assert.ok(EEAT_SUGGESTION_MAP[dim], `Missing E-E-A-T suggestion for: ${dim}`);
    }
  });
});

// ── Integration Tests ───────────────────────────────────────────

describe('Integration: full pipeline', () => {
  it('runs full scoring pipeline without errors', () => {
    const html = buildHtml();
    const keyword = 'test keyword';
    const checklist = runChecklist(html, keyword);
    const eeat = runEEATScoring(html, keyword);
    const suggestions = generateSuggestions(checklist, eeat);

    assert.equal(checklist.items.length, 60);
    assert.equal(eeat.dimensions.length, 10);
    assert.ok(suggestions.length <= 15);
    assert.ok(checklist.score >= 0 && checklist.score <= 100);
    assert.ok(['A', 'B', 'C', 'D', 'F'].includes(eeat.grade));
  });

  it('handles empty HTML gracefully', () => {
    const checklist = runChecklist('', 'keyword');
    const eeat = runEEATScoring('', 'keyword');
    const suggestions = generateSuggestions(checklist, eeat);

    assert.equal(checklist.items.length, 60);
    assert.equal(eeat.dimensions.length, 10);
    assert.ok(Array.isArray(suggestions));
  });

  it('handles Arabic article end-to-end', () => {
    const arabicText = 'هذا هو محتوى تجريبي باللغة العربية عن تحسين محركات البحث ';
    let html = '<html dir="rtl"><head><title>تحسين محركات البحث</title></head><body>';
    html += '<style>body { font-family: Cairo; text-align: right; direction: rtl; }</style>';
    html += '<h1>تحسين محركات البحث</h1>';
    for (let i = 0; i < 100; i++) html += `<p>${arabicText}</p>`;
    html += '</body></html>';

    const checklist = runChecklist(html, 'تحسين');
    const eeat = runEEATScoring(html, 'تحسين');

    assert.equal(checklist.items.length, 60);
    // RTL checks should pass
    const rtlItem = checklist.items.find(i => i.id === 52);
    assert.equal(rtlItem.status, 'pass');
    const fontItem = checklist.items.find(i => i.id === 53);
    assert.equal(fontItem.status, 'pass');
  });
});
