/**
 * SEO Quality Gate Engine — QG-001
 *
 * 60-point SEO checklist across 8 categories + E-E-A-T 10-dimension rubric.
 * Scores generated articles against comprehensive quality criteria.
 *
 * Features:
 * - 40+ content metrics extraction from HTML (regex-based, no DOM library)
 * - 60-point checklist: pass/fail/warning/info per item
 * - E-E-A-T rubric: 10 dimensions, 0-3 each, letter grade A-F
 * - Unicode-aware: supports English and Arabic content
 * - Arabic/RTL detection with >30% threshold
 *
 * Zero npm dependencies — Node.js built-ins only.
 */

'use strict';

// ── Regex Helpers ───────────────────────────────────────────────

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Unicode-aware word splitting. Handles Latin, Arabic, and mixed content.
 * Arabic words are separated by spaces and punctuation, same as Latin.
 */
function splitWords(text) {
  return text.split(/\s+/).filter(w => w.length > 0);
}

/**
 * Count sentences — handles English and Arabic sentence-ending punctuation.
 * Arabic uses ؟ (U+061F) for question mark, ، for comma, ۔ for period.
 */
function countSentences(text) {
  const endings = text.match(/[.!?؟۔]+/g) || [];
  return Math.max(endings.length, 1);
}

// ── ContentMetrics Extraction ───────────────────────────────────

/**
 * Extract 40+ content metrics from raw HTML.
 *
 * @param {string} html - Raw article HTML
 * @param {string} keyword - Primary focus keyword
 * @param {object} [options] - Optional: { title, metaDescription }
 * @returns {object} ContentMetrics
 */
function extractMetrics(html, keyword, options = {}) {
  const { title, metaDescription } = options;
  const plainText = stripHtml(html);
  const words = splitWords(plainText);
  const wordCount = words.length;

  // ── Keyword analysis ──
  const kwEscaped = escapeRegex(keyword);
  const keywordRegex = new RegExp(kwEscaped, 'gi');
  const keywordMatches = plainText.match(keywordRegex) || [];
  const keywordCount = keywordMatches.length;
  const keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;

  // ── Heading counts ──
  const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
  const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
  const h3Count = (html.match(/<h3[^>]*>/gi) || []).length;
  const h4Count = (html.match(/<h4[^>]*>/gi) || []).length;
  const h5Count = (html.match(/<h5[^>]*>/gi) || []).length;
  const h6Count = (html.match(/<h6[^>]*>/gi) || []).length;

  // ── Heading texts ──
  const headingTexts = [];
  const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let hMatch;
  while ((hMatch = headingRegex.exec(html)) !== null) {
    headingTexts.push({
      level: parseInt(hMatch[1], 10),
      text: stripHtml(hMatch[2])
    });
  }

  // ── Keyword in H2/H3 headings ──
  const h2h3Texts = headingTexts
    .filter(h => h.level === 2 || h.level === 3)
    .map(h => h.text);
  const keywordInH2H3Count = h2h3Texts.filter(t =>
    new RegExp(kwEscaped, 'i').test(t)
  ).length;

  // ── Paragraphs ──
  const paragraphs = html.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
  const paragraphCount = paragraphs.length;
  const paragraphWordCounts = paragraphs.map(p => splitWords(stripHtml(p)).length);
  const avgParagraphLength = paragraphCount > 0
    ? paragraphWordCounts.reduce((a, b) => a + b, 0) / paragraphCount
    : 0;

  // ── Sentences ──
  const sentenceCount = countSentences(plainText);
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;

  // ── Links ──
  const linkRegex = /<a[^>]*href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const links = [];
  let linkMatch;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const href = linkMatch[1];
    const anchorText = stripHtml(linkMatch[2]);
    const tagContent = linkMatch[0];
    const isExternal = /^https?:\/\//i.test(href);
    const hasNofollow = /rel\s*=\s*["'][^"']*nofollow[^"']*["']/i.test(tagContent);
    links.push({ href, anchorText, isExternal, hasNofollow });
  }
  const internalLinks = links.filter(l => !l.isExternal);
  const externalLinks = links.filter(l => l.isExternal);
  const internalLinkCount = internalLinks.length;
  const externalLinkCount = externalLinks.length;

  // ── Images ──
  const imgRegex = /<img[^>]*>/gi;
  const imageMatches = html.match(imgRegex) || [];
  const imageCount = imageMatches.length;
  const imagesWithAlt = imageMatches.filter(img =>
    /alt\s*=\s*["'][^"']+["']/i.test(img)
  ).length;
  const imagesWithTitle = imageMatches.filter(img =>
    /title\s*=\s*["'][^"']+["']/i.test(img)
  ).length;
  const imagesWithKeywordAlt = imageMatches.filter(img => {
    const altMatch = img.match(/alt\s*=\s*["']([^"']*)["']/i);
    return altMatch && new RegExp(kwEscaped, 'i').test(altMatch[1]);
  }).length;
  const imagesWithDescriptiveFilename = imageMatches.filter(img => {
    const srcMatch = img.match(/src\s*=\s*["']([^"']*)["']/i);
    if (!srcMatch) return false;
    const filename = srcMatch[1].split('/').pop().split('?')[0];
    return filename && /[a-z]+-[a-z]+/i.test(filename) && !/^(img|image|photo|pic)\d*\./i.test(filename);
  }).length;

  // ── Content structure ──
  const hasTOC = /<(nav|div|ul|ol)[^>]*class\s*=\s*["'][^"']*toc[^"']*["']/i.test(html)
    || /table\s+of\s+contents|جدول\s+المحتويات/i.test(html)
    || (html.match(/<a[^>]*href\s*=\s*["']#[^"']+["']/gi) || []).length >= 3;

  const hasFAQ = /faq|frequently\s+asked\s+questions|الأسئلة\s+الشائعة/i.test(html);
  const faqQuestions = (html.match(/<h[2-6][^>]*>[^<]*\?[^<]*<\/h[2-6]>/gi) || []).length;

  const hasQuickAnswer = (() => {
    const firstH2Pos = html.search(/<h2[^>]*>/i);
    if (firstH2Pos === -1) return false;
    const beforeFirstH2 = html.substring(0, firstH2Pos);
    const beforeText = stripHtml(beforeFirstH2);
    const beforeWords = splitWords(beforeText);
    return beforeWords.length <= 300 && (
      /class\s*=\s*["'][^"']*(quick-answer|answer-box|highlight-box|summary)[^"']*["']/i.test(beforeFirstH2)
      || /<(div|section|aside)[^>]*>[\s\S]{20,}<\/(div|section|aside)>/i.test(beforeFirstH2)
    );
  })();

  const tableCount = (html.match(/<table[^>]*>/gi) || []).length;
  const listCount = (html.match(/<[uo]l[^>]*>/gi) || []).length;
  const boldCount = (html.match(/<(strong|b)[\s>]/gi) || []).length;
  const blockquoteCount = (html.match(/<blockquote[^>]*>/gi) || []).length;

  const ctaPatterns = /\b(sign\s*up|get\s*started|learn\s*more|contact\s*us|try\s*free|download|subscribe|register|buy\s*now|order\s*now|start\s*free|book\s*now|اشترك|سجل|تواصل)\b/gi;
  const ctaButtonPatterns = /<(a|button)[^>]*class\s*=\s*["'][^"']*(cta|btn|button)[^"']*["'][^>]*>/gi;
  const ctaTextCount = (plainText.match(ctaPatterns) || []).length;
  const ctaButtonCount = (html.match(ctaButtonPatterns) || []).length;
  const ctaCount = Math.max(ctaTextCount, ctaButtonCount);

  // ── Meta data ──
  const metaTitleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaTitle = title || (metaTitleTag ? stripHtml(metaTitleTag[1]) : '');
  const metaDescTag = html.match(/<meta[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["']([^"']*)["']/i)
    || html.match(/<meta[^>]*content\s*=\s*["']([^"']*)["'][^>]*name\s*=\s*["']description["']/i);
  const metaDescriptionText = metaDescription || (metaDescTag ? metaDescTag[1] : '');

  // ── Keyword placement ──
  const keywordInTitle = metaTitle ? new RegExp(kwEscaped, 'i').test(metaTitle) : false;

  // First paragraph keyword check
  const firstParagraphMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const firstParagraphText = firstParagraphMatch ? stripHtml(firstParagraphMatch[1]) : '';
  const keywordInFirstParagraph = new RegExp(kwEscaped, 'i').test(firstParagraphText);

  // ── Intro and conclusion word counts ──
  // Intro: content before first H2
  const firstH2Index = html.search(/<h2[^>]*>/i);
  const introHtml = firstH2Index > 0 ? html.substring(0, firstH2Index) : '';
  const introText = stripHtml(introHtml);
  const introWordCount = splitWords(introText).length;

  // Conclusion: content after last H2 section
  const lastH2Index = html.lastIndexOf('<h2');
  const altLastH2 = html.lastIndexOf('<H2');
  const effectiveLastH2 = Math.max(lastH2Index, altLastH2);
  let conclusionWordCount = 0;
  if (effectiveLastH2 > 0) {
    const afterLastH2 = html.substring(effectiveLastH2);
    const conclusionText = stripHtml(afterLastH2);
    conclusionWordCount = splitWords(conclusionText).length;
  }

  // ── Sources section ──
  const hasSourcesSection = /sources|references|مراجع|المصادر/i.test(html)
    && /<h[2-6][^>]*>[^<]*(sources|references|مراجع|المصادر)[^<]*<\/h[2-6]>/i.test(html);

  // ── Heading hierarchy validation ──
  let hasProperHierarchy = true;
  let hasEmptyHeadings = false;
  let prevLevel = 0;
  for (const h of headingTexts) {
    if (h.text.trim().length === 0) {
      hasEmptyHeadings = true;
    }
    if (prevLevel > 0 && h.level > prevLevel + 1) {
      hasProperHierarchy = false;
    }
    prevLevel = h.level;
  }

  // ── Metric highlight boxes ──
  const metricBoxCount = (html.match(
    /class\s*=\s*["'][^"']*(metric|stat|highlight|number-box|kpi)[^"']*["']/gi
  ) || []).length;

  // ── Link distribution (first 200 words) ──
  const first200Words = words.slice(0, 200).join(' ');
  const hasLinkInFirst200 = internalLinks.some(l => {
    return first200Words.includes(l.anchorText.split(' ')[0]);
  });

  // ── Dofollow / nofollow mix for external links ──
  const nofollowExternalCount = externalLinks.filter(l => l.hasNofollow).length;
  const dofollowExternalCount = externalLinks.filter(l => !l.hasNofollow).length;

  // ── Arabic language detection ──
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
  const arabicChars = plainText.match(arabicRegex) || [];
  const nonSpaceChars = plainText.replace(/\s/g, '').length;
  const arabicPercentage = nonSpaceChars > 0 ? (arabicChars.length / nonSpaceChars) * 100 : 0;
  const hasArabicContent = arabicPercentage > 30;

  // ── RTL support checks ──
  const hasRTLAttribute = /dir\s*=\s*["']rtl["']/i.test(html);
  const hasArabicFont = /font-family[^;]*(?:cairo|tajawal|amiri|kufi|noto\s+naskh|droid\s+arabic|almarai|ibm\s+plex\s+arabic)/i.test(html)
    || /class\s*=\s*["'][^"']*font-arabic[^"']*["']/i.test(html);
  const hasRTLAlignment = /text-align\s*:\s*right/i.test(html)
    || /direction\s*:\s*rtl/i.test(html);

  // ── Schema markup ──
  const hasSchemaMarkup = /itemtype\s*=\s*["']https?:\/\/schema\.org/i.test(html)
    || /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>/i.test(html);

  // ── Keyword in conclusion ──
  const keywordInConclusion = effectiveLastH2 > 0
    ? new RegExp(kwEscaped, 'i').test(stripHtml(html.substring(effectiveLastH2)))
    : false;

  // ── LSI keyword approximation (related terms in headings) ──
  const keywordParts = keyword.toLowerCase().split(/\s+/);
  const lsiTermCount = h2h3Texts.filter(t => {
    const lower = t.toLowerCase();
    return keywordParts.some(part => lower.includes(part)) && !new RegExp(kwEscaped, 'i').test(t);
  }).length;

  return {
    wordCount,
    characterCount: plainText.length,
    paragraphCount,
    avgParagraphLength,
    sentenceCount,
    avgSentenceLength,
    h1Count,
    h2Count,
    h3Count,
    h4Count,
    h5Count,
    h6Count,
    headingTexts,
    imageCount,
    imagesWithAlt,
    imagesWithTitle,
    imagesWithKeywordAlt,
    imagesWithDescriptiveFilename,
    internalLinkCount,
    externalLinkCount,
    internalLinks,
    externalLinks,
    keywordCount,
    keywordDensity,
    keywordInTitle,
    keywordInFirstParagraph,
    keywordInH2H3Count,
    keywordInConclusion,
    lsiTermCount,
    metaTitle,
    metaDescription: metaDescriptionText,
    titleLength: metaTitle.length,
    metaDescriptionLength: metaDescriptionText.length,
    hasTOC,
    hasFAQ,
    faqCount: faqQuestions,
    hasQuickAnswer,
    tableCount,
    listCount,
    boldCount,
    blockquoteCount,
    ctaCount,
    metricBoxCount,
    introWordCount,
    conclusionWordCount,
    hasSourcesSection,
    hasProperHierarchy,
    hasEmptyHeadings,
    hasLinkInFirst200,
    dofollowExternalCount,
    nofollowExternalCount,
    hasArabicContent,
    arabicPercentage,
    hasRTLAttribute,
    hasArabicFont,
    hasRTLAlignment,
    hasSchemaMarkup
  };
}

// ── 60-Point Checklist ──────────────────────────────────────────

/**
 * Checklist category definitions with IDs, labels, and categories.
 */
const CHECKLIST_DEFINITIONS = [
  // Content Structure (17 items, IDs 1-17)
  { id: 1, category: 'Content Structure', label: 'Content length 1200-2500 words' },
  { id: 2, category: 'Content Structure', label: 'Exactly 1 H1 tag' },
  { id: 3, category: 'Content Structure', label: '6-10 H2 tags' },
  { id: 4, category: 'Content Structure', label: '10-15 H3 tags' },
  { id: 5, category: 'Content Structure', label: '30-40% of H2/H3 include primary keyword' },
  { id: 6, category: 'Content Structure', label: 'Table of contents with anchor links' },
  { id: 7, category: 'Content Structure', label: 'Quick answer box in first 300 words' },
  { id: 8, category: 'Content Structure', label: '2-4 metric highlight boxes' },
  { id: 9, category: 'Content Structure', label: '2-3 tables present' },
  { id: 10, category: 'Content Structure', label: 'Quote boxes present (blockquote)' },
  { id: 11, category: 'Content Structure', label: 'FAQ section with 8-12 questions' },
  { id: 12, category: 'Content Structure', label: '2-3 CTA elements' },
  { id: 13, category: 'Content Structure', label: 'Intro paragraph 200-250 words' },
  { id: 14, category: 'Content Structure', label: 'Conclusion paragraph 150-200 words' },
  { id: 15, category: 'Content Structure', label: 'Sources/References section' },
  { id: 16, category: 'Content Structure', label: 'Proper heading hierarchy (no skipped levels)' },
  { id: 17, category: 'Content Structure', label: 'No empty headings' },

  // Keyword Optimization (7 items, IDs 18-24)
  { id: 18, category: 'Keyword Optimization', label: 'Primary keyword 8-15 times' },
  { id: 19, category: 'Keyword Optimization', label: 'Keyword density under 2.5%' },
  { id: 20, category: 'Keyword Optimization', label: 'LSI/related terms in headings' },
  { id: 21, category: 'Keyword Optimization', label: 'Keyword in title tag' },
  { id: 22, category: 'Keyword Optimization', label: 'Keyword in first paragraph' },
  { id: 23, category: 'Keyword Optimization', label: 'Keyword in H2 headings' },
  { id: 24, category: 'Keyword Optimization', label: 'Keyword in H3 headings' },

  // Metadata (4 items, IDs 25-28)
  { id: 25, category: 'Metadata', label: 'Title tag 50-60 characters' },
  { id: 26, category: 'Metadata', label: 'Meta description 145-154 characters' },
  { id: 27, category: 'Metadata', label: 'Focus keyphrase set' },
  { id: 28, category: 'Metadata', label: 'SEO title optimized with keyword' },

  // Internal Linking (5 items, IDs 29-33)
  { id: 29, category: 'Internal Linking', label: '8-12 internal links per article' },
  { id: 30, category: 'Internal Linking', label: 'Links naturally integrated in context' },
  { id: 31, category: 'Internal Linking', label: 'Descriptive anchor text' },
  { id: 32, category: 'Internal Linking', label: 'Link in first 200 words' },
  { id: 33, category: 'Internal Linking', label: 'Even link distribution (no clustering)' },

  // External Links (5 items, IDs 34-38)
  { id: 34, category: 'External Links', label: '2-3 authority links per article' },
  { id: 35, category: 'External Links', label: 'Dofollow/nofollow mix' },
  { id: 36, category: 'External Links', label: 'Authoritative sources only' },
  { id: 37, category: 'External Links', label: 'Proper source attribution' },
  { id: 38, category: 'External Links', label: 'Links add contextual value' },

  // Images (6 items, IDs 39-44)
  { id: 39, category: 'Images', label: 'Featured image present' },
  { id: 40, category: 'Images', label: 'Minimum 4 images in article' },
  { id: 41, category: 'Images', label: 'All images have alt text' },
  { id: 42, category: 'Images', label: 'Keyword in image alt text' },
  { id: 43, category: 'Images', label: 'Descriptive image filenames' },
  { id: 44, category: 'Images', label: 'Title attributes on images' },

  // Technical Formatting (6 items, IDs 45-50)
  { id: 45, category: 'Technical Formatting', label: 'Proper heading hierarchy (H1>H2>H3)' },
  { id: 46, category: 'Technical Formatting', label: 'Short paragraphs (2-4 sentences)' },
  { id: 47, category: 'Technical Formatting', label: 'Bullet/numbered lists present' },
  { id: 48, category: 'Technical Formatting', label: 'Bold key facts for scannability' },
  { id: 49, category: 'Technical Formatting', label: 'Clear descriptive headers' },
  { id: 50, category: 'Technical Formatting', label: 'Adequate white space' },

  // Internationalization (4 items, IDs 51-54)
  { id: 51, category: 'Internationalization', label: 'Arabic content detection' },
  { id: 52, category: 'Internationalization', label: 'dir="rtl" attribute when Arabic detected' },
  { id: 53, category: 'Internationalization', label: 'Arabic-friendly font family' },
  { id: 54, category: 'Internationalization', label: 'RTL text alignment' },

  // Extra checks to reach 60 (IDs 55-60)
  { id: 55, category: 'Technical Formatting', label: 'Schema markup present' },
  { id: 56, category: 'Content Structure', label: 'Adequate sentence variety' },
  { id: 57, category: 'Keyword Optimization', label: 'Keyword in conclusion' },
  { id: 58, category: 'External Links', label: 'External links open safely' },
  { id: 59, category: 'Images', label: 'Image captions when appropriate' },
  { id: 60, category: 'Internal Linking', label: 'Anchor text includes keywords' }
];

/**
 * Run the 60-point SEO checklist against article HTML.
 *
 * @param {string} html - Article HTML content
 * @param {string} keyword - Primary focus keyword
 * @param {object} [options] - { title, metaDescription }
 * @returns {{ items: Array, score: number, passedCount: number, totalCount: number, categoryScores: object }}
 */
function runChecklist(html, keyword, options = {}) {
  const metrics = extractMetrics(html, keyword, options);
  const items = [];

  function check(id, status, value, expected, message) {
    const def = CHECKLIST_DEFINITIONS.find(d => d.id === id);
    items.push({
      id,
      category: def.category,
      label: def.label,
      status,
      value,
      expected,
      message
    });
  }

  // ── Content Structure (1-17) ──

  // 1. Content length
  if (metrics.wordCount >= 1200 && metrics.wordCount <= 2500) {
    check(1, 'pass', metrics.wordCount, '1200-2500', `Word count ${metrics.wordCount} is optimal`);
  } else if (metrics.wordCount < 1200) {
    check(1, 'fail', metrics.wordCount, '1200-2500', `Too short: ${metrics.wordCount} words (need 1200+)`);
  } else {
    check(1, 'warning', metrics.wordCount, '1200-2500', `Very long: ${metrics.wordCount} words (recommended max 2500)`);
  }

  // 2. Exactly 1 H1
  if (metrics.h1Count === 1) {
    check(2, 'pass', metrics.h1Count, 1, 'Exactly 1 H1 tag found');
  } else {
    check(2, 'fail', metrics.h1Count, 1, metrics.h1Count === 0 ? 'No H1 tag found' : `${metrics.h1Count} H1 tags (should be exactly 1)`);
  }

  // 3. 6-10 H2 tags
  if (metrics.h2Count >= 6 && metrics.h2Count <= 10) {
    check(3, 'pass', metrics.h2Count, '6-10', `${metrics.h2Count} H2 tags found`);
  } else if (metrics.h2Count < 6) {
    check(3, 'warning', metrics.h2Count, '6-10', `Only ${metrics.h2Count} H2 tags (need 6-10)`);
  } else {
    check(3, 'warning', metrics.h2Count, '6-10', `${metrics.h2Count} H2 tags (recommended 6-10)`);
  }

  // 4. 10-15 H3 tags
  if (metrics.h3Count >= 10 && metrics.h3Count <= 15) {
    check(4, 'pass', metrics.h3Count, '10-15', `${metrics.h3Count} H3 tags found`);
  } else if (metrics.h3Count < 10) {
    check(4, 'warning', metrics.h3Count, '10-15', `Only ${metrics.h3Count} H3 tags (need 10-15)`);
  } else {
    check(4, 'info', metrics.h3Count, '10-15', `${metrics.h3Count} H3 tags (more than recommended)`);
  }

  // 5. 30-40% H2/H3 include keyword
  const totalH2H3 = metrics.h2Count + metrics.h3Count;
  const kwHeadingPct = totalH2H3 > 0 ? (metrics.keywordInH2H3Count / totalH2H3) * 100 : 0;
  if (kwHeadingPct >= 30 && kwHeadingPct <= 40) {
    check(5, 'pass', `${kwHeadingPct.toFixed(0)}%`, '30-40%', `${kwHeadingPct.toFixed(0)}% of H2/H3 include keyword`);
  } else if (kwHeadingPct < 30) {
    check(5, 'warning', `${kwHeadingPct.toFixed(0)}%`, '30-40%', `Only ${kwHeadingPct.toFixed(0)}% of H2/H3 include keyword`);
  } else {
    check(5, 'warning', `${kwHeadingPct.toFixed(0)}%`, '30-40%', `${kwHeadingPct.toFixed(0)}% — too high, risk of over-optimization`);
  }

  // 6. Table of contents
  check(6, metrics.hasTOC ? 'pass' : 'warning', metrics.hasTOC, true,
    metrics.hasTOC ? 'Table of contents found' : 'No table of contents detected');

  // 7. Quick answer box
  check(7, metrics.hasQuickAnswer ? 'pass' : 'info', metrics.hasQuickAnswer, true,
    metrics.hasQuickAnswer ? 'Quick answer box detected' : 'No quick answer box in first 300 words');

  // 8. Metric highlight boxes
  if (metrics.metricBoxCount >= 2 && metrics.metricBoxCount <= 4) {
    check(8, 'pass', metrics.metricBoxCount, '2-4', `${metrics.metricBoxCount} metric boxes found`);
  } else if (metrics.metricBoxCount < 2) {
    check(8, 'info', metrics.metricBoxCount, '2-4', `Only ${metrics.metricBoxCount} metric highlight boxes`);
  } else {
    check(8, 'info', metrics.metricBoxCount, '2-4', `${metrics.metricBoxCount} metric highlight boxes`);
  }

  // 9. Tables (2-3)
  if (metrics.tableCount >= 2 && metrics.tableCount <= 3) {
    check(9, 'pass', metrics.tableCount, '2-3', `${metrics.tableCount} tables found`);
  } else if (metrics.tableCount < 2) {
    check(9, 'warning', metrics.tableCount, '2-3', `Only ${metrics.tableCount} tables (need 2-3)`);
  } else {
    check(9, 'info', metrics.tableCount, '2-3', `${metrics.tableCount} tables found`);
  }

  // 10. Blockquotes
  check(10, metrics.blockquoteCount > 0 ? 'pass' : 'info', metrics.blockquoteCount, '1+',
    metrics.blockquoteCount > 0 ? `${metrics.blockquoteCount} quote boxes found` : 'No blockquote/quote boxes found');

  // 11. FAQ section (8-12 questions)
  if (metrics.hasFAQ && metrics.faqCount >= 8 && metrics.faqCount <= 12) {
    check(11, 'pass', metrics.faqCount, '8-12', `FAQ section with ${metrics.faqCount} questions`);
  } else if (metrics.hasFAQ && metrics.faqCount > 0) {
    check(11, 'warning', metrics.faqCount, '8-12', `FAQ section with ${metrics.faqCount} questions (need 8-12)`);
  } else {
    check(11, 'warning', 0, '8-12', 'No FAQ section found');
  }

  // 12. CTAs (2-3)
  if (metrics.ctaCount >= 2 && metrics.ctaCount <= 3) {
    check(12, 'pass', metrics.ctaCount, '2-3', `${metrics.ctaCount} CTAs found`);
  } else if (metrics.ctaCount < 2) {
    check(12, 'warning', metrics.ctaCount, '2-3', `Only ${metrics.ctaCount} CTAs (need 2-3)`);
  } else {
    check(12, 'info', metrics.ctaCount, '2-3', `${metrics.ctaCount} CTAs found`);
  }

  // 13. Intro 200-250 words
  if (metrics.introWordCount >= 200 && metrics.introWordCount <= 250) {
    check(13, 'pass', metrics.introWordCount, '200-250', `Introduction is ${metrics.introWordCount} words`);
  } else if (metrics.introWordCount < 200) {
    check(13, 'warning', metrics.introWordCount, '200-250', `Introduction too short: ${metrics.introWordCount} words`);
  } else {
    check(13, 'warning', metrics.introWordCount, '200-250', `Introduction too long: ${metrics.introWordCount} words`);
  }

  // 14. Conclusion 150-200 words
  if (metrics.conclusionWordCount >= 150 && metrics.conclusionWordCount <= 200) {
    check(14, 'pass', metrics.conclusionWordCount, '150-200', `Conclusion is ${metrics.conclusionWordCount} words`);
  } else if (metrics.conclusionWordCount < 150) {
    check(14, 'warning', metrics.conclusionWordCount, '150-200', `Conclusion too short: ${metrics.conclusionWordCount} words`);
  } else {
    check(14, 'warning', metrics.conclusionWordCount, '150-200', `Conclusion too long: ${metrics.conclusionWordCount} words`);
  }

  // 15. Sources section
  check(15, metrics.hasSourcesSection ? 'pass' : 'warning', metrics.hasSourcesSection, true,
    metrics.hasSourcesSection ? 'Sources/references section found' : 'No sources/references section');

  // 16. Proper heading hierarchy
  check(16, metrics.hasProperHierarchy ? 'pass' : 'fail', metrics.hasProperHierarchy, true,
    metrics.hasProperHierarchy ? 'Heading hierarchy is correct' : 'Heading levels are skipped (e.g., H1 to H3)');

  // 17. No empty headings
  check(17, !metrics.hasEmptyHeadings ? 'pass' : 'fail', !metrics.hasEmptyHeadings, true,
    !metrics.hasEmptyHeadings ? 'No empty headings' : 'Empty headings detected');

  // ── Keyword Optimization (18-24) ──

  // 18. Keyword 8-15 times
  if (metrics.keywordCount >= 8 && metrics.keywordCount <= 15) {
    check(18, 'pass', metrics.keywordCount, '8-15', `Keyword appears ${metrics.keywordCount} times`);
  } else if (metrics.keywordCount < 8) {
    check(18, 'warning', metrics.keywordCount, '8-15', `Keyword appears only ${metrics.keywordCount} times`);
  } else {
    check(18, 'fail', metrics.keywordCount, '8-15', `Keyword appears ${metrics.keywordCount} times (over-optimized)`);
  }

  // 19. Keyword density under 2.5%
  if (metrics.keywordDensity <= 2.5) {
    check(19, 'pass', `${metrics.keywordDensity.toFixed(2)}%`, '<2.5%', `Keyword density ${metrics.keywordDensity.toFixed(2)}%`);
  } else {
    check(19, 'fail', `${metrics.keywordDensity.toFixed(2)}%`, '<2.5%', `Keyword density ${metrics.keywordDensity.toFixed(2)}% is too high`);
  }

  // 20. LSI terms
  if (metrics.lsiTermCount >= 3) {
    check(20, 'pass', metrics.lsiTermCount, '3+', `${metrics.lsiTermCount} related terms found in headings`);
  } else if (metrics.lsiTermCount > 0) {
    check(20, 'info', metrics.lsiTermCount, '3+', `${metrics.lsiTermCount} related terms in headings`);
  } else {
    check(20, 'info', 0, '3+', 'No LSI/related terms detected in headings');
  }

  // 21. Keyword in title
  check(21, metrics.keywordInTitle ? 'pass' : 'fail', metrics.keywordInTitle, true,
    metrics.keywordInTitle ? 'Keyword found in title' : 'Keyword NOT in title');

  // 22. Keyword in first paragraph
  check(22, metrics.keywordInFirstParagraph ? 'pass' : 'fail', metrics.keywordInFirstParagraph, true,
    metrics.keywordInFirstParagraph ? 'Keyword in first paragraph' : 'Keyword NOT in first paragraph');

  // 23. Keyword in H2s
  const kwInH2 = metrics.headingTexts.filter(h => h.level === 2)
    .some(h => new RegExp(escapeRegex(keyword), 'i').test(h.text));
  check(23, kwInH2 ? 'pass' : 'warning', kwInH2, true,
    kwInH2 ? 'Keyword found in H2 headings' : 'Keyword not found in any H2 heading');

  // 24. Keyword in H3s
  const kwInH3 = metrics.headingTexts.filter(h => h.level === 3)
    .some(h => new RegExp(escapeRegex(keyword), 'i').test(h.text));
  check(24, kwInH3 ? 'pass' : 'info', kwInH3, true,
    kwInH3 ? 'Keyword found in H3 headings' : 'Keyword not found in any H3 heading');

  // ── Metadata (25-28) ──

  // 25. Title length
  if (metrics.titleLength >= 50 && metrics.titleLength <= 60) {
    check(25, 'pass', metrics.titleLength, '50-60', `Title is ${metrics.titleLength} characters`);
  } else if (metrics.titleLength === 0) {
    check(25, 'fail', 0, '50-60', 'No title tag found');
  } else if (metrics.titleLength < 50) {
    check(25, 'warning', metrics.titleLength, '50-60', `Title too short: ${metrics.titleLength} chars`);
  } else {
    check(25, 'warning', metrics.titleLength, '50-60', `Title too long: ${metrics.titleLength} chars`);
  }

  // 26. Meta description length
  if (metrics.metaDescriptionLength >= 145 && metrics.metaDescriptionLength <= 154) {
    check(26, 'pass', metrics.metaDescriptionLength, '145-154', `Meta description is ${metrics.metaDescriptionLength} chars`);
  } else if (metrics.metaDescriptionLength === 0) {
    check(26, 'fail', 0, '145-154', 'No meta description found');
  } else if (metrics.metaDescriptionLength < 145) {
    check(26, 'warning', metrics.metaDescriptionLength, '145-154', `Meta description too short: ${metrics.metaDescriptionLength} chars`);
  } else {
    check(26, 'warning', metrics.metaDescriptionLength, '145-154', `Meta description too long: ${metrics.metaDescriptionLength} chars`);
  }

  // 27. Focus keyphrase
  check(27, keyword && keyword.length > 0 ? 'pass' : 'fail', !!keyword, true,
    keyword ? 'Focus keyphrase is set' : 'No focus keyphrase provided');

  // 28. SEO title optimized
  const titleHasKw = metrics.keywordInTitle;
  const titleGoodLength = metrics.titleLength >= 50 && metrics.titleLength <= 60;
  if (titleHasKw && titleGoodLength) {
    check(28, 'pass', true, true, 'SEO title is optimized with keyword and proper length');
  } else if (titleHasKw) {
    check(28, 'warning', true, true, 'Title has keyword but length is not optimal');
  } else {
    check(28, 'fail', false, true, 'SEO title not optimized — missing keyword');
  }

  // ── Internal Linking (29-33) ──

  // 29. 8-12 internal links
  if (metrics.internalLinkCount >= 8 && metrics.internalLinkCount <= 12) {
    check(29, 'pass', metrics.internalLinkCount, '8-12', `${metrics.internalLinkCount} internal links`);
  } else if (metrics.internalLinkCount < 8) {
    check(29, 'warning', metrics.internalLinkCount, '8-12', `Only ${metrics.internalLinkCount} internal links`);
  } else {
    check(29, 'info', metrics.internalLinkCount, '8-12', `${metrics.internalLinkCount} internal links (many)`);
  }

  // 30. Links naturally integrated
  const avgLinkSpacing = metrics.internalLinkCount > 0 ? metrics.wordCount / metrics.internalLinkCount : 0;
  const wellDistributed = avgLinkSpacing >= 80 && avgLinkSpacing <= 300;
  check(30, wellDistributed ? 'pass' : 'info', `${Math.round(avgLinkSpacing)} words/link`, 'even',
    wellDistributed ? 'Links are well distributed' : 'Review link distribution for natural integration');

  // 31. Descriptive anchor text
  const descriptiveAnchors = metrics.internalLinks.filter(l => l.anchorText.length >= 3).length;
  const descriptivePct = metrics.internalLinkCount > 0 ? (descriptiveAnchors / metrics.internalLinkCount) * 100 : 100;
  check(31, descriptivePct >= 80 ? 'pass' : 'warning', `${descriptivePct.toFixed(0)}%`, '80%+',
    descriptivePct >= 80 ? 'Anchor text is descriptive' : 'Some anchor text is too short or generic');

  // 32. Link in first 200 words
  check(32, metrics.hasLinkInFirst200 ? 'pass' : 'info', metrics.hasLinkInFirst200, true,
    metrics.hasLinkInFirst200 ? 'Link found in first 200 words' : 'No link in first 200 words');

  // 33. Even distribution (no clustering)
  check(33, wellDistributed ? 'pass' : 'info', wellDistributed, true,
    wellDistributed ? 'No link clustering detected' : 'Review for potential link clustering');

  // ── External Links (34-38) ──

  // 34. 2-3 authority links
  if (metrics.externalLinkCount >= 2 && metrics.externalLinkCount <= 3) {
    check(34, 'pass', metrics.externalLinkCount, '2-3', `${metrics.externalLinkCount} external links`);
  } else if (metrics.externalLinkCount < 2) {
    check(34, 'warning', metrics.externalLinkCount, '2-3', `Only ${metrics.externalLinkCount} external links`);
  } else {
    check(34, 'info', metrics.externalLinkCount, '2-3', `${metrics.externalLinkCount} external links`);
  }

  // 35. Dofollow/nofollow mix
  const hasGoodMix = metrics.dofollowExternalCount >= 1 && metrics.nofollowExternalCount >= 1;
  if (metrics.externalLinkCount === 0) {
    check(35, 'info', 'N/A', 'mixed', 'No external links to evaluate');
  } else {
    check(35, hasGoodMix ? 'pass' : 'info',
      `${metrics.dofollowExternalCount} dofollow / ${metrics.nofollowExternalCount} nofollow`, 'mixed',
      hasGoodMix ? 'Good dofollow/nofollow mix' : 'Consider mixing dofollow and nofollow links');
  }

  // 36. Authoritative sources
  check(36, metrics.externalLinkCount >= 2 ? 'pass' : 'info', metrics.externalLinkCount, '2+',
    metrics.externalLinkCount >= 2 ? 'External sources present for authority' : 'Add authoritative external sources');

  // 37. Source attribution
  check(37, metrics.hasSourcesSection ? 'pass' : 'info', metrics.hasSourcesSection, true,
    metrics.hasSourcesSection ? 'Source attribution section present' : 'Consider adding source citations');

  // 38. Links add value
  check(38, metrics.externalLinkCount > 0 ? 'pass' : 'info', metrics.externalLinkCount > 0, true,
    metrics.externalLinkCount > 0 ? 'External links provide contextual value' : 'No external links for context');

  // ── Images (39-44) ──

  // 39. Featured image
  check(39, metrics.imageCount >= 1 ? 'pass' : 'fail', metrics.imageCount >= 1, true,
    metrics.imageCount >= 1 ? 'Featured image present' : 'No images found');

  // 40. Min 4 images
  if (metrics.imageCount >= 4) {
    check(40, 'pass', metrics.imageCount, '4+', `${metrics.imageCount} images found`);
  } else {
    check(40, 'warning', metrics.imageCount, '4+', `Only ${metrics.imageCount} images (need 4+)`);
  }

  // 41. All images have alt text
  const altPct = metrics.imageCount > 0 ? (metrics.imagesWithAlt / metrics.imageCount) * 100 : 100;
  if (metrics.imageCount === 0) {
    check(41, 'info', 'N/A', '100%', 'No images to evaluate');
  } else if (altPct === 100) {
    check(41, 'pass', '100%', '100%', 'All images have alt text');
  } else {
    check(41, 'fail', `${altPct.toFixed(0)}%`, '100%', `${metrics.imagesWithAlt}/${metrics.imageCount} images have alt text`);
  }

  // 42. Keyword in alt text
  if (metrics.imageCount === 0) {
    check(42, 'info', 'N/A', '1+', 'No images to evaluate');
  } else {
    check(42, metrics.imagesWithKeywordAlt > 0 ? 'pass' : 'warning', metrics.imagesWithKeywordAlt, '1+',
      metrics.imagesWithKeywordAlt > 0 ? `Keyword in ${metrics.imagesWithKeywordAlt} image alt texts` : 'No images have keyword in alt text');
  }

  // 43. Descriptive filenames
  if (metrics.imageCount === 0) {
    check(43, 'info', 'N/A', 'descriptive', 'No images to evaluate');
  } else {
    const descPct = (metrics.imagesWithDescriptiveFilename / metrics.imageCount) * 100;
    check(43, descPct >= 50 ? 'pass' : 'info', `${descPct.toFixed(0)}%`, '50%+',
      descPct >= 50 ? 'Image filenames are descriptive' : 'Consider using more descriptive image filenames');
  }

  // 44. Title attributes
  if (metrics.imageCount === 0) {
    check(44, 'info', 'N/A', 'present', 'No images to evaluate');
  } else {
    const titlePct = (metrics.imagesWithTitle / metrics.imageCount) * 100;
    check(44, titlePct >= 50 ? 'pass' : 'info', `${titlePct.toFixed(0)}%`, '50%+',
      titlePct >= 50 ? 'Image title attributes present' : 'Add title attributes to images');
  }

  // ── Technical Formatting (45-50) ──

  // 45. Heading hierarchy
  check(45, metrics.hasProperHierarchy ? 'pass' : 'fail', metrics.hasProperHierarchy, true,
    metrics.hasProperHierarchy ? 'Heading hierarchy is correct' : 'Heading levels skip (e.g., H1 directly to H3)');

  // 46. Short paragraphs
  if (metrics.avgParagraphLength >= 30 && metrics.avgParagraphLength <= 80) {
    check(46, 'pass', Math.round(metrics.avgParagraphLength), '30-80 words', 'Paragraph length is optimal');
  } else if (metrics.avgParagraphLength > 80) {
    check(46, 'warning', Math.round(metrics.avgParagraphLength), '30-80 words', 'Paragraphs too long — break into shorter ones');
  } else {
    check(46, 'info', Math.round(metrics.avgParagraphLength), '30-80 words', 'Paragraphs are short');
  }

  // 47. Lists present
  check(47, metrics.listCount >= 3 ? 'pass' : 'warning', metrics.listCount, '3+',
    metrics.listCount >= 3 ? `${metrics.listCount} lists found` : `Only ${metrics.listCount} lists — add more`);

  // 48. Bold usage
  check(48, metrics.boldCount >= 5 ? 'pass' : 'info', metrics.boldCount, '5+',
    metrics.boldCount >= 5 ? `${metrics.boldCount} bold elements for scannability` : `Only ${metrics.boldCount} bold elements`);

  // 49. Clear headers
  const avgHeaderLen = metrics.headingTexts.length > 0
    ? metrics.headingTexts.reduce((sum, h) => sum + h.text.length, 0) / metrics.headingTexts.length
    : 0;
  check(49, avgHeaderLen >= 15 ? 'pass' : 'info', Math.round(avgHeaderLen), '15+ chars',
    avgHeaderLen >= 15 ? 'Headers are clear and descriptive' : 'Some headers may be too short');

  // 50. White space (paragraphs should have reasonable count relative to word count)
  const whiteSpaceRatio = metrics.wordCount > 0 ? metrics.paragraphCount / (metrics.wordCount / 100) : 0;
  check(50, whiteSpaceRatio >= 1.5 ? 'pass' : 'info', `${whiteSpaceRatio.toFixed(1)}`, '1.5+ per 100 words',
    whiteSpaceRatio >= 1.5 ? 'Adequate white space' : 'Consider adding more paragraph breaks');

  // ── Internationalization (51-54) ──

  // 51. Arabic detection
  if (metrics.hasArabicContent) {
    check(51, 'info', `${metrics.arabicPercentage.toFixed(1)}%`, '>30%', `Arabic content detected (${metrics.arabicPercentage.toFixed(1)}% of characters)`);
  } else {
    check(51, 'pass', `${metrics.arabicPercentage.toFixed(1)}%`, 'N/A', 'No Arabic content detected');
  }

  // 52. RTL attribute
  if (metrics.hasArabicContent) {
    check(52, metrics.hasRTLAttribute ? 'pass' : 'fail', metrics.hasRTLAttribute, true,
      metrics.hasRTLAttribute ? 'dir="rtl" attribute present' : 'Missing dir="rtl" for Arabic content');
  } else {
    check(52, 'pass', 'N/A', 'N/A', 'RTL not required (no Arabic content)');
  }

  // 53. Arabic font
  if (metrics.hasArabicContent) {
    check(53, metrics.hasArabicFont ? 'pass' : 'warning', metrics.hasArabicFont, true,
      metrics.hasArabicFont ? 'Arabic-friendly font detected' : 'No Arabic font detected — use Cairo, Tajawal, etc.');
  } else {
    check(53, 'pass', 'N/A', 'N/A', 'Arabic font not required');
  }

  // 54. RTL alignment
  if (metrics.hasArabicContent) {
    check(54, metrics.hasRTLAlignment ? 'pass' : 'warning', metrics.hasRTLAlignment, true,
      metrics.hasRTLAlignment ? 'RTL text alignment configured' : 'Review text alignment for RTL layout');
  } else {
    check(54, 'pass', 'N/A', 'N/A', 'RTL alignment not required');
  }

  // ── Extra checks (55-60) ──

  // 55. Schema markup
  check(55, metrics.hasSchemaMarkup ? 'pass' : 'info', metrics.hasSchemaMarkup, true,
    metrics.hasSchemaMarkup ? 'Schema markup detected' : 'No schema markup found');

  // 56. Sentence variety
  const sentenceVariety = metrics.avgSentenceLength >= 10 && metrics.avgSentenceLength <= 25;
  check(56, sentenceVariety ? 'pass' : 'info', Math.round(metrics.avgSentenceLength), '10-25 words',
    sentenceVariety ? 'Good sentence variety' : 'Consider varying sentence lengths');

  // 57. Keyword in conclusion
  check(57, metrics.keywordInConclusion ? 'pass' : 'warning', metrics.keywordInConclusion, true,
    metrics.keywordInConclusion ? 'Keyword found in conclusion' : 'Keyword not found in conclusion');

  // 58. External links open safely (target="_blank" or noopener)
  const safeExtLinks = metrics.externalLinks.filter(l => {
    const tag = html.substring(html.indexOf(l.href) - 50, html.indexOf(l.href) + l.href.length + 50);
    return /target\s*=\s*["']_blank["']/i.test(tag);
  }).length;
  if (metrics.externalLinkCount === 0) {
    check(58, 'info', 'N/A', 'target="_blank"', 'No external links to evaluate');
  } else {
    check(58, safeExtLinks === metrics.externalLinkCount ? 'pass' : 'info',
      `${safeExtLinks}/${metrics.externalLinkCount}`, 'all',
      safeExtLinks === metrics.externalLinkCount ? 'All external links open in new tab' : 'Some external links missing target="_blank"');
  }

  // 59. Image captions
  const figcaptionCount = (html.match(/<figcaption[^>]*>/gi) || []).length;
  if (metrics.imageCount === 0) {
    check(59, 'info', 'N/A', 'when appropriate', 'No images to evaluate');
  } else {
    check(59, figcaptionCount > 0 ? 'pass' : 'info', figcaptionCount, '1+',
      figcaptionCount > 0 ? `${figcaptionCount} image captions found` : 'No image captions — consider adding where appropriate');
  }

  // 60. Anchor text includes keywords
  const anchorWithKw = metrics.internalLinks.filter(l =>
    new RegExp(escapeRegex(keyword), 'i').test(l.anchorText)
  ).length;
  if (metrics.internalLinkCount === 0) {
    check(60, 'info', 'N/A', '1+', 'No internal links to evaluate');
  } else {
    check(60, anchorWithKw > 0 ? 'pass' : 'info', anchorWithKw, '1+',
      anchorWithKw > 0 ? `${anchorWithKw} anchors include keyword` : 'No anchor text includes keyword');
  }

  // ── Calculate scores ──
  const passedCount = items.filter(i => i.status === 'pass').length;
  const totalCount = items.length;
  const score = Math.round((passedCount / totalCount) * 100);

  // Category scores
  const categoryScores = {};
  const categories = [...new Set(items.map(i => i.category))];
  for (const cat of categories) {
    const catItems = items.filter(i => i.category === cat);
    const catPassed = catItems.filter(i => i.status === 'pass').length;
    categoryScores[cat] = {
      passed: catPassed,
      total: catItems.length,
      score: Math.round((catPassed / catItems.length) * 100)
    };
  }

  return { items, score, passedCount, totalCount, categoryScores, metrics };
}

// ── E-E-A-T Rubric ─────────────────────────────────────────────

/**
 * E-E-A-T 10-dimension rubric scoring (0-3 each, max 30 points).
 *
 * Dimensions:
 * 1. Experience — firsthand experience indicators
 * 2. Expertise — depth of knowledge signals
 * 3. Authoritativeness — credibility markers
 * 4. Trustworthiness — accuracy and transparency
 * 5. Content Depth — comprehensiveness
 * 6. Original Research — unique data/insights
 * 7. User Intent Match — answers the query
 * 8. Readability — ease of consumption
 * 9. Technical Accuracy — correct information signals
 * 10. Freshness — up-to-date content
 *
 * @param {string} html - Article HTML
 * @param {string} keyword - Focus keyword
 * @returns {{ dimensions: Array, totalScore: number, maxScore: number, grade: string }}
 */
function runEEATScoring(html, keyword) {
  const metrics = extractMetrics(html, keyword);
  const plainText = stripHtml(html);
  const dimensions = [];

  // 1. Experience — case studies, personal examples, "in my experience"
  let experienceScore = 0;
  if (/in\s+(my|our)\s+experience|we\s+(found|discovered|tested|observed)|case\s+study/i.test(plainText)) experienceScore++;
  if (metrics.blockquoteCount > 0) experienceScore++;
  if (/years?\s+of\s+experience|worked\s+with|hands-on/i.test(plainText)) experienceScore++;
  dimensions.push({ name: 'Experience', score: experienceScore, maxScore: 3, description: 'First-hand experience indicators' });

  // 2. Expertise — technical depth, terminology, specific numbers
  let expertiseScore = 0;
  if (metrics.wordCount >= 1200) expertiseScore++;
  if (metrics.h3Count >= 5) expertiseScore++;
  if (/\d+(\.\d+)?%|\d{4,}|\$[\d,]+/g.test(plainText)) expertiseScore++;
  dimensions.push({ name: 'Expertise', score: expertiseScore, maxScore: 3, description: 'Depth of knowledge signals' });

  // 3. Authoritativeness — external citations, credentials
  let authorityScore = 0;
  if (metrics.externalLinkCount >= 2) authorityScore++;
  if (metrics.hasSourcesSection) authorityScore++;
  if (/according\s+to|study\s+(shows|found|published)|research\s+(from|by|shows)/i.test(plainText)) authorityScore++;
  dimensions.push({ name: 'Authoritativeness', score: authorityScore, maxScore: 3, description: 'Credibility markers' });

  // 4. Trustworthiness — transparency, dates, attributions
  let trustScore = 0;
  if (metrics.hasSourcesSection) trustScore++;
  if (/updated|published|last\s+modified|\d{4}/i.test(plainText)) trustScore++;
  if (metrics.externalLinkCount > 0 && metrics.nofollowExternalCount >= 0) trustScore++;
  dimensions.push({ name: 'Trustworthiness', score: trustScore, maxScore: 3, description: 'Accuracy and transparency' });

  // 5. Content Depth — word count, sections, FAQs
  let depthScore = 0;
  if (metrics.wordCount >= 1500) depthScore++;
  if (metrics.h2Count >= 6) depthScore++;
  if (metrics.hasFAQ && metrics.faqCount >= 5) depthScore++;
  dimensions.push({ name: 'Content Depth', score: depthScore, maxScore: 3, description: 'Comprehensiveness of coverage' });

  // 6. Original Research — unique data, statistics, comparisons
  let researchScore = 0;
  if (metrics.tableCount >= 1) researchScore++;
  if (/survey|analysis|data\s+shows|findings|results/i.test(plainText)) researchScore++;
  if (metrics.metricBoxCount >= 1) researchScore++;
  dimensions.push({ name: 'Original Research', score: researchScore, maxScore: 3, description: 'Unique data and insights' });

  // 7. User Intent — answers query, structured for featured snippets
  let intentScore = 0;
  if (metrics.keywordInTitle && metrics.keywordInFirstParagraph) intentScore++;
  if (metrics.hasFAQ) intentScore++;
  if (metrics.hasTOC) intentScore++;
  dimensions.push({ name: 'User Intent Match', score: intentScore, maxScore: 3, description: 'Answers the search query' });

  // 8. Readability — short paragraphs, lists, formatting
  let readabilityScore = 0;
  if (metrics.avgParagraphLength <= 80) readabilityScore++;
  if (metrics.listCount >= 3) readabilityScore++;
  if (metrics.boldCount >= 5) readabilityScore++;
  dimensions.push({ name: 'Readability', score: readabilityScore, maxScore: 3, description: 'Ease of consumption' });

  // 9. Technical Accuracy — proper structure, schema, hierarchy
  let techScore = 0;
  if (metrics.hasProperHierarchy) techScore++;
  if (metrics.h1Count === 1) techScore++;
  if (metrics.hasSchemaMarkup) techScore++;
  dimensions.push({ name: 'Technical Accuracy', score: techScore, maxScore: 3, description: 'Correct structural implementation' });

  // 10. Freshness — dates, recent references
  let freshnessScore = 0;
  const currentYear = new Date().getFullYear();
  if (new RegExp(`${currentYear}|${currentYear - 1}`).test(plainText)) freshnessScore++;
  if (/latest|recent|new|updated|current/i.test(plainText)) freshnessScore++;
  if (/\d{1,2}[\s/.-]\d{1,2}[\s/.-]\d{2,4}/.test(plainText)) freshnessScore++;
  dimensions.push({ name: 'Freshness', score: freshnessScore, maxScore: 3, description: 'Up-to-date content signals' });

  const totalScore = dimensions.reduce((sum, d) => sum + d.score, 0);
  const maxScore = 30;

  let grade;
  if (totalScore >= 27) grade = 'A';
  else if (totalScore >= 22) grade = 'B';
  else if (totalScore >= 16) grade = 'C';
  else if (totalScore >= 10) grade = 'D';
  else grade = 'F';

  return { dimensions, totalScore, maxScore, grade };
}

// ── Exports ─────────────────────────────────────────────────────

module.exports = {
  extractMetrics,
  runChecklist,
  runEEATScoring,
  stripHtml,
  splitWords,
  escapeRegex,
  CHECKLIST_DEFINITIONS
};
