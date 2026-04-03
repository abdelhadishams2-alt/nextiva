/**
 * Universal Article Payload Assembler
 *
 * Combines article HTML + metadata + SEO fields + taxonomy + images +
 * structured data + quality scores into a universal payload suitable
 * for publishing to WordPress, Shopify, Ghost, or generic CMS targets.
 *
 * Zero npm dependencies — uses only Node.js built-ins.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../logger');
const imagePipeline = require('./image-pipeline');

// Load schema once at module init
const SCHEMA_PATH = path.join(__dirname, 'payload-schema.json');
let _schema = null;
function getSchema() {
  if (!_schema) {
    _schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
  }
  return _schema;
}

// ── Slug generation ─────────────────────────────────────────────────────────

/**
 * Generate a URL-friendly slug from a title string.
 * Supports Latin and Arabic characters.
 * @param {string} title
 * @returns {string}
 */
function slugify(title) {
  if (!title || typeof title !== 'string') return 'untitled';

  return title
    .toLowerCase()
    .trim()
    .replace(/[\u0600-\u06FF]+/g, (match) => match) // Preserve Arabic chars
    .replace(/[^\w\u0600-\u06FF\s-]/g, '') // Remove non-word chars except Arabic
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200) || 'untitled';
}

// ── Excerpt extraction ──────────────────────────────────────────────────────

/**
 * Extract an excerpt from HTML content.
 * @param {string} html
 * @param {number} [maxLength=300]
 * @returns {string}
 */
function extractExcerpt(html, maxLength = 300) {
  if (!html) return '';

  // Strip HTML tags
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Get first paragraph-worth of content
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > maxLength * 0.5 ? truncated.slice(0, lastSpace) : truncated) + '...';
}

// ── Word count ──────────────────────────────────────────────────────────────

/**
 * Count words in HTML content.
 * @param {string} html
 * @returns {number}
 */
function countWords(html) {
  if (!html) return 0;
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}

// ── Structured data extraction ──────────────────────────────────────────────

const JSON_LD_RE = /<script\s+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/**
 * Extract JSON-LD structured data from HTML.
 * @param {string} html
 * @returns {{article: object|null, faq: object|null, howTo: object|null, breadcrumb: object|null}}
 */
function extractStructuredData(html) {
  const result = { article: null, faq: null, howTo: null, breadcrumb: null };
  if (!html) return result;

  JSON_LD_RE.lastIndex = 0;
  let match;

  while ((match = JSON_LD_RE.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const type = data['@type'] || '';

      if (type === 'Article' || type === 'NewsArticle' || type === 'BlogPosting') {
        result.article = data;
      } else if (type === 'FAQPage') {
        result.faq = data;
      } else if (type === 'HowTo') {
        result.howTo = data;
      } else if (type === 'BreadcrumbList') {
        result.breadcrumb = data;
      }
    } catch (e) {
      // Skip malformed JSON-LD
      logger.warn('structured_data_parse_error', { error: e.message });
    }
  }

  return result;
}

// ── Structured data generation ──────────────────────────────────────────────

/**
 * Generate Article JSON-LD if not already present in HTML.
 * @param {object} article - Article data from database
 * @param {object} payload - Partially assembled payload
 * @returns {object}
 */
function generateArticleJsonLd(article, payload) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: payload.title,
    description: payload.excerpt,
    image: payload.images?.filter(i => i.cdnSrc || i.src).map(i => i.cdnSrc || i.src) || [],
    datePublished: payload.publishedAt || new Date().toISOString(),
    dateModified: payload.updatedAt || new Date().toISOString(),
    author: payload.author?.name ? {
      '@type': 'Person',
      name: payload.author.name,
      url: payload.author.url || undefined
    } : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'ChainIQ'
    },
    mainEntityOfPage: payload.seo?.canonical || undefined,
    wordCount: payload.wordCount,
    inLanguage: payload.language || 'en',
    keywords: payload.tags?.join(', ') || payload.keyword
  };
}

/**
 * Extract FAQ pairs from HTML and generate FAQPage JSON-LD.
 * Looks for common FAQ patterns: <h2>/<h3> with FAQ + following <p>/<div> answers.
 * @param {string} html
 * @returns {object|null}
 */
function extractFaqJsonLd(html) {
  if (!html) return null;

  // Look for FAQ section patterns
  const faqSectionRe = /(?:<h[23][^>]*>.*?(?:faq|frequently\s+asked|common\s+questions).*?<\/h[23]>)([\s\S]*?)(?=<h[12][^>]|$)/i;
  const sectionMatch = html.match(faqSectionRe);
  if (!sectionMatch) return null;

  const faqHtml = sectionMatch[1];
  // Extract Q&A pairs from <h3>...<p>... or <dt>...<dd>... patterns
  const qaPairs = [];

  // Pattern: <h3>Question</h3> followed by <p>Answer</p>
  const qaRe = /<h[34][^>]*>(.*?)<\/h[34]>\s*(?:<[^h][^>]*>)*([\s\S]*?)(?=<h[34]|$)/gi;
  let qaMatch;
  while ((qaMatch = qaRe.exec(faqHtml)) !== null) {
    const question = qaMatch[1].replace(/<[^>]+>/g, '').trim();
    const answer = qaMatch[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (question && answer && answer.length > 10) {
      qaPairs.push({ question, answer });
    }
  }

  if (qaPairs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qaPairs.map(qa => ({
      '@type': 'Question',
      name: qa.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: qa.answer
      }
    }))
  };
}

// ── SEO field extraction ────────────────────────────────────────────────────

const META_RE = /<meta\s+(?:name|property)\s*=\s*["']([^"']+)["']\s+content\s*=\s*["']([^"']*)["'][^>]*>/gi;
const TITLE_RE = /<title[^>]*>(.*?)<\/title>/i;

/**
 * Extract SEO metadata from HTML head.
 * @param {string} html
 * @param {object} article - Article DB record for fallbacks
 * @returns {object}
 */
function extractSeoFields(html, article) {
  const seo = {
    title: '',
    description: '',
    canonical: null,
    og: { title: '', description: '', image: null, type: 'article', locale: '' },
    twitter: { card: 'summary_large_image', title: '', description: '', image: null }
  };

  if (!html) return seo;

  // Extract <title>
  const titleMatch = html.match(TITLE_RE);
  if (titleMatch) seo.title = titleMatch[1].trim();

  // Extract meta tags
  META_RE.lastIndex = 0;
  let match;
  while ((match = META_RE.exec(html)) !== null) {
    const name = match[1].toLowerCase();
    const content = match[2];

    switch (name) {
      case 'description':
        seo.description = content;
        break;
      case 'og:title':
        seo.og.title = content;
        break;
      case 'og:description':
        seo.og.description = content;
        break;
      case 'og:image':
        seo.og.image = content;
        break;
      case 'og:type':
        seo.og.type = content;
        break;
      case 'og:locale':
        seo.og.locale = content;
        break;
      case 'twitter:card':
        seo.twitter.card = content;
        break;
      case 'twitter:title':
        seo.twitter.title = content;
        break;
      case 'twitter:description':
        seo.twitter.description = content;
        break;
      case 'twitter:image':
        seo.twitter.image = content;
        break;
    }
  }

  // Extract canonical link
  const canonicalRe = /<link\s+rel\s*=\s*["']canonical["']\s+href\s*=\s*["']([^"']+)["'][^>]*>/i;
  const canonicalMatch = html.match(canonicalRe);
  if (canonicalMatch) seo.canonical = canonicalMatch[1];

  // Fallbacks from article record
  if (!seo.title) seo.title = article.title || '';
  if (!seo.description) seo.description = article.meta_description || extractExcerpt(html, 160);
  if (!seo.og.title) seo.og.title = seo.title;
  if (!seo.og.description) seo.og.description = seo.description;
  if (!seo.twitter.title) seo.twitter.title = seo.title;
  if (!seo.twitter.description) seo.twitter.description = seo.description;

  return seo;
}

// ── Platform-specific formatting ────────────────────────────────────────────

/**
 * Apply WordPress-specific transformations.
 * @param {object} payload
 * @returns {object}
 */
function formatForWordPress(payload) {
  const wp = {
    postType: 'post',
    postFormat: 'standard',
    featuredMediaId: null,
    customFields: {},
    yoastMeta: {
      title: payload.seo?.title || payload.title,
      metadesc: payload.seo?.description || '',
      focuskw: payload.keyword || '',
      canonical: payload.seo?.canonical || ''
    }
  };

  // Set featured media from first image with a mediaId
  const featured = payload.images?.find(i => i.isFeatured && i.mediaId);
  if (featured) {
    wp.featuredMediaId = parseInt(featured.mediaId, 10) || null;
  }

  payload.platformMeta = { ...payload.platformMeta, wordpress: wp };
  return payload;
}

/**
 * Apply Shopify-specific transformations.
 * @param {object} payload
 * @returns {object}
 */
function formatForShopify(payload) {
  const shopify = {
    blogId: null,
    handle: payload.slug,
    templateSuffix: null,
    metafields: [
      { namespace: 'seo', key: 'title', value: payload.seo?.title || payload.title, type: 'single_line_text_field' },
      { namespace: 'seo', key: 'description', value: payload.seo?.description || '', type: 'single_line_text_field' }
    ]
  };

  payload.platformMeta = { ...payload.platformMeta, shopify };
  return payload;
}

/**
 * Apply Ghost-specific transformations.
 * @param {object} payload
 * @returns {object}
 */
function formatForGhost(payload) {
  const featuredImage = payload.images?.find(i => i.isFeatured);
  const ghost = {
    mobiledoc: null,
    featureImage: featuredImage?.cdnSrc || featuredImage?.src || null,
    featureImageAlt: featuredImage?.alt || '',
    codeinjectionHead: null,
    visibility: 'public'
  };

  // Inject structured data as code injection if present
  const jsonLdParts = [];
  if (payload.structuredData?.article) {
    jsonLdParts.push(JSON.stringify(payload.structuredData.article));
  }
  if (payload.structuredData?.faq) {
    jsonLdParts.push(JSON.stringify(payload.structuredData.faq));
  }
  if (jsonLdParts.length > 0) {
    ghost.codeinjectionHead = jsonLdParts
      .map(j => `<script type="application/ld+json">${j}</script>`)
      .join('\n');
  }

  payload.platformMeta = { ...payload.platformMeta, ghost };
  return payload;
}

// ── Validation ──────────────────────────────────────────────────────────────

/**
 * Validate a payload against required fields (lightweight, no JSON Schema lib).
 * @param {object} payload
 * @returns {{valid: boolean, errors: string[]}}
 */
function validatePayload(payload) {
  const errors = [];
  const schema = getSchema();

  for (const field of schema.required || []) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (payload.title && typeof payload.title !== 'string') {
    errors.push('title must be a string');
  }
  if (payload.title && payload.title.length > 500) {
    errors.push('title exceeds 500 characters');
  }
  if (payload.slug && !/^[a-z0-9\u0600-\u06FF]+(?:-[a-z0-9\u0600-\u06FF]+)*$/.test(payload.slug)) {
    errors.push('slug contains invalid characters');
  }
  if (payload.html && typeof payload.html !== 'string') {
    errors.push('html must be a string');
  }
  if (payload.status && !['draft', 'review', 'scheduled', 'published', 'archived'].includes(payload.status)) {
    errors.push(`Invalid status: ${payload.status}`);
  }
  if (payload.format && !['wordpress', 'shopify', 'ghost', 'contentful', 'strapi', 'webflow', 'webhook', 'generic'].includes(payload.format)) {
    errors.push(`Invalid format: ${payload.format}`);
  }
  if (payload.categories && !Array.isArray(payload.categories)) {
    errors.push('categories must be an array');
  }
  if (payload.tags && !Array.isArray(payload.tags)) {
    errors.push('tags must be an array');
  }

  return { valid: errors.length === 0, errors };
}

// ── Main assembler ──────────────────────────────────────────────────────────

/**
 * Assemble a universal article payload from database record + quality data.
 *
 * @param {object} article - Article record from Supabase
 * @param {object} options
 * @param {string} [options.format='generic'] - Target format: wordpress, shopify, ghost, generic
 * @param {object} [options.qualityData] - Pre-computed quality data { checklist, eeat, sevenSignals }
 * @param {object} [options.voiceProfile] - Voice profile data
 * @param {object} [options.uploader] - Image uploader instance (from image-pipeline)
 * @param {object} [options.author] - Author override
 * @param {string[]} [options.categories] - Category list override
 * @param {string[]} [options.tags] - Tag list override
 * @returns {Promise<{payload: object, validation: {valid: boolean, errors: string[]}}>}
 */
async function assemblePayload(article, options = {}) {
  const {
    format = 'generic',
    qualityData = null,
    voiceProfile = null,
    uploader = null,
    author = null,
    categories = null,
    tags = null
  } = options;

  const startTime = Date.now();
  const html = article.html_content || article.content || '';
  const keyword = article.keyword || article.topic || '';
  const metadata = article.metadata || {};

  logger.info('payload_assembly_start', {
    articleId: article.id,
    format,
    hasUploader: !!uploader,
    htmlLength: html.length
  });

  // Process images through CDN pipeline
  let processedHtml = html;
  let images = [];

  if (uploader) {
    const imageResult = await imagePipeline.processImages(html, uploader);
    processedHtml = imageResult.html;
    images = imageResult.images;
  } else {
    // Extract images without uploading (passthrough)
    images = imagePipeline.extractImages(html).map(img => ({
      ...img,
      cdnSrc: null,
      mediaId: null,
      sizeBytes: null,
      mimeType: null
    }));
  }

  // Extract SEO fields from HTML
  const seo = extractSeoFields(html, article);

  // Update OG/Twitter images with CDN URLs if available
  const featuredImage = images.find(i => i.isFeatured);
  if (featuredImage) {
    const imgUrl = featuredImage.cdnSrc || featuredImage.src;
    if (!seo.og.image) seo.og.image = imgUrl;
    if (!seo.twitter.image) seo.twitter.image = imgUrl;
  }

  // Extract/generate structured data
  const extractedSd = extractStructuredData(html);
  const structuredData = { ...extractedSd };

  // Build base payload
  const payload = {
    title: article.title || '',
    slug: slugify(article.title),
    html: processedHtml,
    excerpt: extractExcerpt(processedHtml),
    keyword,
    author: author || {
      name: metadata.author || '',
      email: null,
      url: null,
      bio: null
    },
    categories: categories || metadata.categories || [],
    tags: tags || metadata.tags || [],
    seo,
    images: images.map(img => ({
      src: img.src,
      cdnSrc: img.cdnSrc || null,
      alt: img.alt || '',
      width: img.width || null,
      height: img.height || null,
      caption: img.caption || null,
      mimeType: img.mimeType || null,
      sizeBytes: img.sizeBytes || null,
      isFeatured: img.isFeatured || false
    })),
    structuredData,
    qualityScore: null,
    voiceProfile: voiceProfile || null,
    publishedAt: article.published_at || null,
    updatedAt: article.updated_at || new Date().toISOString(),
    status: article.status || 'draft',
    format,
    language: article.language || 'en',
    wordCount: article.word_count || countWords(processedHtml),
    readingTimeMinutes: Math.ceil((article.word_count || countWords(processedHtml)) / 200),
    platformMeta: {}
  };

  // Generate Article JSON-LD if not already extracted from HTML
  if (!structuredData.article) {
    structuredData.article = generateArticleJsonLd(article, payload);
  }

  // Try to extract FAQ JSON-LD
  if (!structuredData.faq) {
    structuredData.faq = extractFaqJsonLd(html);
  }

  payload.structuredData = structuredData;

  // Attach quality data
  if (qualityData) {
    const overallScore = qualityData.sevenSignals
      ? (qualityData.sevenSignals.reduce((sum, s) => sum + (s.weightedScore || 0), 0) /
         qualityData.sevenSignals.reduce((sum, s) => sum + (s.maxWeightedScore || 1), 0) * 100)
      : (qualityData.checklist?.score || 0);

    payload.qualityScore = {
      overall: Math.round(overallScore * 100) / 100,
      checklist: qualityData.checklist ? {
        score: qualityData.checklist.score,
        passedCount: qualityData.checklist.passedCount,
        totalCount: qualityData.checklist.totalCount,
        categoryScores: qualityData.checklist.categoryScores || {}
      } : null,
      eeat: qualityData.eeat ? {
        totalScore: qualityData.eeat.totalScore,
        maxScore: qualityData.eeat.maxScore,
        grade: qualityData.eeat.grade,
        dimensions: qualityData.eeat.dimensions || {}
      } : null,
      sevenSignals: qualityData.sevenSignals || null
    };
  }

  // Apply platform-specific formatting
  switch (format) {
    case 'wordpress':
      formatForWordPress(payload);
      break;
    case 'shopify':
      formatForShopify(payload);
      break;
    case 'ghost':
      formatForGhost(payload);
      break;
    case 'generic':
    default:
      // No extra transformation for generic
      break;
  }

  const validation = validatePayload(payload);

  logger.info('payload_assembly_complete', {
    articleId: article.id,
    format,
    valid: validation.valid,
    errorCount: validation.errors.length,
    imageCount: images.length,
    wordCount: payload.wordCount,
    durationMs: Date.now() - startTime
  });

  return { payload, validation };
}

module.exports = {
  assemblePayload,
  validatePayload,
  slugify,
  extractExcerpt,
  countWords,
  extractStructuredData,
  extractSeoFields,
  extractFaqJsonLd,
  generateArticleJsonLd,
  formatForWordPress,
  formatForShopify,
  formatForGhost,
  getSchema
};
