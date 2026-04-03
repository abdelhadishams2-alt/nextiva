/**
 * Universal Article Payload — Unit Tests
 *
 * Tests for payload assembly, image pipeline extraction, SEO field extraction,
 * structured data generation, platform formatting, and validation.
 *
 * Run: node --test tests/universal-payload.test.js
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// ── Load modules under test ─────────────────────────────────────────────────

const {
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
} = require('../bridge/publishing/payload');

const {
  extractImages,
  guessMimeType,
  generateFilename,
  processImages,
  createPassthroughUploader
} = require('../bridge/publishing/image-pipeline');

// ── Test fixtures ───────────────────────────────────────────────────────────

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>10 Best SEO Tools for 2026</title>
  <meta name="description" content="Discover the top SEO tools that will boost your rankings in 2026.">
  <meta property="og:title" content="Best SEO Tools 2026">
  <meta property="og:description" content="Top SEO tools for rankings.">
  <meta property="og:image" content="https://example.com/og-image.jpg">
  <meta property="og:type" content="article">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="https://example.com/seo-tools-2026">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "10 Best SEO Tools for 2026",
    "author": { "@type": "Person", "name": "Jane Doe" }
  }
  </script>
</head>
<body>
  <h1>10 Best SEO Tools for 2026</h1>
  <p>Search engine optimization requires the right tools. Here are the best options for 2026.</p>
  <figure>
    <img src="https://example.com/images/tool1.png" alt="SEO Tool Dashboard" width="800" height="600">
    <figcaption>Screenshot of Tool 1 Dashboard</figcaption>
  </figure>
  <h2>Tool 1: Keyword Explorer</h2>
  <p>This tool provides comprehensive keyword research capabilities with volume data and difficulty scores.</p>
  <img src="https://example.com/images/tool2.webp" alt="Keyword Explorer Interface">
  <h2>Tool 2: Rank Tracker</h2>
  <p>Track your rankings across multiple search engines with daily updates.</p>
  <h2>Frequently Asked Questions</h2>
  <h3>What is the best SEO tool?</h3>
  <p>The best SEO tool depends on your needs. For keyword research, Keyword Explorer leads the pack.</p>
  <h3>How much do SEO tools cost?</h3>
  <p>SEO tools range from free to several hundred dollars per month for enterprise plans.</p>
</body>
</html>`;

const SAMPLE_ARTICLE = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  user_id: 'user-123',
  title: '10 Best SEO Tools for 2026',
  topic: 'best seo tools',
  keyword: 'best seo tools 2026',
  language: 'en',
  framework: 'html',
  status: 'draft',
  html_content: SAMPLE_HTML,
  word_count: 85,
  image_count: 2,
  meta_description: 'Discover the top SEO tools for 2026.',
  metadata: {
    author: 'Jane Doe',
    categories: ['SEO', 'Marketing'],
    tags: ['seo-tools', 'keyword-research', 'rank-tracking']
  },
  created_at: '2026-03-01T10:00:00Z',
  updated_at: '2026-03-15T14:30:00Z',
  published_at: null
};

// ── Schema Tests ────────────────────────────────────────────────────────────

describe('Payload Schema', () => {
  it('should load the JSON schema successfully', () => {
    const schema = getSchema();
    assert.equal(schema.title, 'UniversalArticlePayload');
    assert.ok(schema.required.includes('title'));
    assert.ok(schema.required.includes('slug'));
    assert.ok(schema.required.includes('html'));
    assert.ok(schema.required.includes('keyword'));
    assert.ok(schema.required.includes('status'));
    assert.ok(schema.required.includes('format'));
  });

  it('should define all expected top-level properties', () => {
    const schema = getSchema();
    const expectedFields = [
      'title', 'slug', 'html', 'excerpt', 'keyword', 'author',
      'categories', 'tags', 'seo', 'images', 'structuredData',
      'qualityScore', 'voiceProfile', 'publishedAt', 'status',
      'format', 'language', 'wordCount', 'readingTimeMinutes', 'platformMeta'
    ];
    for (const field of expectedFields) {
      assert.ok(schema.properties[field], `Schema missing field: ${field}`);
    }
  });

  it('should define SEO sub-properties', () => {
    const schema = getSchema();
    const seoProps = schema.properties.seo.properties;
    assert.ok(seoProps.title);
    assert.ok(seoProps.description);
    assert.ok(seoProps.canonical);
    assert.ok(seoProps.og);
    assert.ok(seoProps.twitter);
  });

  it('should define platform meta for all supported platforms', () => {
    const schema = getSchema();
    const platforms = schema.properties.platformMeta.properties;
    assert.ok(platforms.wordpress);
    assert.ok(platforms.shopify);
    assert.ok(platforms.ghost);
  });
});

// ── Slug Tests ──────────────────────────────────────────────────────────────

describe('slugify', () => {
  it('should convert title to lowercase slug', () => {
    assert.equal(slugify('Hello World'), 'hello-world');
  });

  it('should handle special characters', () => {
    assert.equal(slugify('What is SEO? A Guide!'), 'what-is-seo-a-guide');
  });

  it('should collapse multiple dashes', () => {
    assert.equal(slugify('Hello   ---   World'), 'hello-world');
  });

  it('should return "untitled" for empty input', () => {
    assert.equal(slugify(''), 'untitled');
    assert.equal(slugify(null), 'untitled');
  });

  it('should truncate long slugs to 200 chars', () => {
    const longTitle = 'a'.repeat(300);
    assert.ok(slugify(longTitle).length <= 200);
  });
});

// ── Excerpt Tests ───────────────────────────────────────────────────────────

describe('extractExcerpt', () => {
  it('should strip HTML tags', () => {
    const excerpt = extractExcerpt('<p>Hello <strong>world</strong></p>');
    assert.equal(excerpt, 'Hello world');
  });

  it('should truncate at word boundary', () => {
    const longHtml = '<p>' + 'word '.repeat(100) + '</p>';
    const excerpt = extractExcerpt(longHtml, 50);
    assert.ok(excerpt.length <= 54); // 50 + '...'
    assert.ok(excerpt.endsWith('...'));
  });

  it('should strip script and style tags', () => {
    const html = '<p>Content</p><script>alert("x")</script><style>.a{}</style>';
    assert.equal(extractExcerpt(html), 'Content');
  });

  it('should return empty string for null input', () => {
    assert.equal(extractExcerpt(null), '');
  });
});

// ── Word Count Tests ────────────────────────────────────────────────────────

describe('countWords', () => {
  it('should count words in HTML content', () => {
    assert.equal(countWords('<p>Hello world foo bar</p>'), 4);
  });

  it('should ignore HTML tags', () => {
    assert.equal(countWords('<p>One <strong>two</strong> three</p>'), 3);
  });

  it('should return 0 for empty input', () => {
    assert.equal(countWords(''), 0);
    assert.equal(countWords(null), 0);
  });
});

// ── Image Extraction Tests ──────────────────────────────────────────────────

describe('extractImages', () => {
  it('should extract images from HTML', () => {
    const images = extractImages(SAMPLE_HTML);
    assert.equal(images.length, 2);
    assert.equal(images[0].src, 'https://example.com/images/tool1.png');
    assert.equal(images[1].src, 'https://example.com/images/tool2.webp');
  });

  it('should extract alt text', () => {
    const images = extractImages(SAMPLE_HTML);
    assert.equal(images[0].alt, 'SEO Tool Dashboard');
    assert.equal(images[1].alt, 'Keyword Explorer Interface');
  });

  it('should extract width and height', () => {
    const images = extractImages(SAMPLE_HTML);
    assert.equal(images[0].width, 800);
    assert.equal(images[0].height, 600);
    assert.equal(images[1].width, null);
  });

  it('should extract caption from figcaption', () => {
    const images = extractImages(SAMPLE_HTML);
    assert.equal(images[0].caption, 'Screenshot of Tool 1 Dashboard');
  });

  it('should mark first image as featured', () => {
    const images = extractImages(SAMPLE_HTML);
    assert.equal(images[0].isFeatured, true);
    assert.equal(images[1].isFeatured, false);
  });

  it('should skip data URIs', () => {
    const html = '<img src="data:image/png;base64,abc123" alt="data"><img src="https://example.com/real.jpg" alt="real">';
    const images = extractImages(html);
    assert.equal(images.length, 1);
    assert.equal(images[0].src, 'https://example.com/real.jpg');
  });

  it('should return empty array for no images', () => {
    assert.deepEqual(extractImages('<p>No images here</p>'), []);
  });

  it('should return empty array for null input', () => {
    assert.deepEqual(extractImages(null), []);
  });
});

// ── MIME Type Tests ─────────────────────────────────────────────────────────

describe('guessMimeType', () => {
  it('should detect common image types', () => {
    assert.equal(guessMimeType('https://example.com/photo.jpg'), 'image/jpeg');
    assert.equal(guessMimeType('https://example.com/photo.png'), 'image/png');
    assert.equal(guessMimeType('https://example.com/photo.webp'), 'image/webp');
    assert.equal(guessMimeType('https://example.com/photo.gif'), 'image/gif');
    assert.equal(guessMimeType('https://example.com/photo.svg'), 'image/svg+xml');
  });

  it('should default to image/jpeg for unknown extensions', () => {
    assert.equal(guessMimeType('https://example.com/photo.xyz'), 'image/jpeg');
  });
});

// ── Filename Generation Tests ───────────────────────────────────────────────

describe('generateFilename', () => {
  it('should generate deterministic filenames', () => {
    const f1 = generateFilename('https://example.com/photo.jpg');
    const f2 = generateFilename('https://example.com/photo.jpg');
    assert.equal(f1, f2);
  });

  it('should produce different names for different URLs', () => {
    const f1 = generateFilename('https://example.com/photo1.jpg');
    const f2 = generateFilename('https://example.com/photo2.jpg');
    assert.notEqual(f1, f2);
  });

  it('should preserve file extension', () => {
    assert.ok(generateFilename('https://example.com/photo.png').endsWith('.png'));
    assert.ok(generateFilename('https://example.com/photo.webp').endsWith('.webp'));
  });

  it('should start with article-img- prefix', () => {
    assert.ok(generateFilename('https://example.com/photo.jpg').startsWith('article-img-'));
  });
});

// ── SEO Extraction Tests ────────────────────────────────────────────────────

describe('extractSeoFields', () => {
  it('should extract meta description', () => {
    const seo = extractSeoFields(SAMPLE_HTML, SAMPLE_ARTICLE);
    assert.equal(seo.description, 'Discover the top SEO tools that will boost your rankings in 2026.');
  });

  it('should extract title from <title> tag', () => {
    const seo = extractSeoFields(SAMPLE_HTML, SAMPLE_ARTICLE);
    assert.equal(seo.title, '10 Best SEO Tools for 2026');
  });

  it('should extract OpenGraph fields', () => {
    const seo = extractSeoFields(SAMPLE_HTML, SAMPLE_ARTICLE);
    assert.equal(seo.og.title, 'Best SEO Tools 2026');
    assert.equal(seo.og.image, 'https://example.com/og-image.jpg');
    assert.equal(seo.og.type, 'article');
  });

  it('should extract Twitter card fields', () => {
    const seo = extractSeoFields(SAMPLE_HTML, SAMPLE_ARTICLE);
    assert.equal(seo.twitter.card, 'summary_large_image');
  });

  it('should extract canonical URL', () => {
    const seo = extractSeoFields(SAMPLE_HTML, SAMPLE_ARTICLE);
    assert.equal(seo.canonical, 'https://example.com/seo-tools-2026');
  });

  it('should fall back to article meta_description when no HTML meta', () => {
    const seo = extractSeoFields('<p>Plain content</p>', SAMPLE_ARTICLE);
    assert.equal(seo.description, 'Discover the top SEO tools for 2026.');
  });

  it('should fall back to article title when no <title> tag', () => {
    const seo = extractSeoFields('<p>Plain content</p>', SAMPLE_ARTICLE);
    assert.equal(seo.title, '10 Best SEO Tools for 2026');
  });
});

// ── Structured Data Tests ───────────────────────────────────────────────────

describe('extractStructuredData', () => {
  it('should extract Article JSON-LD', () => {
    const sd = extractStructuredData(SAMPLE_HTML);
    assert.ok(sd.article);
    assert.equal(sd.article['@type'], 'Article');
    assert.equal(sd.article.headline, '10 Best SEO Tools for 2026');
  });

  it('should return null for missing types', () => {
    const sd = extractStructuredData(SAMPLE_HTML);
    // Our sample has Article but not FAQPage or HowTo
    assert.equal(sd.faq, null);
    assert.equal(sd.howTo, null);
    assert.equal(sd.breadcrumb, null);
  });

  it('should handle malformed JSON-LD gracefully', () => {
    const html = '<script type="application/ld+json">{ invalid json }</script>';
    const sd = extractStructuredData(html);
    assert.equal(sd.article, null);
  });

  it('should return all nulls for no JSON-LD', () => {
    const sd = extractStructuredData('<p>No structured data</p>');
    assert.equal(sd.article, null);
    assert.equal(sd.faq, null);
  });
});

// ── FAQ Extraction Tests ────────────────────────────────────────────────────

describe('extractFaqJsonLd', () => {
  it('should extract FAQ pairs from FAQ section', () => {
    const faq = extractFaqJsonLd(SAMPLE_HTML);
    assert.ok(faq);
    assert.equal(faq['@type'], 'FAQPage');
    assert.ok(faq.mainEntity.length >= 1);
    assert.equal(faq.mainEntity[0]['@type'], 'Question');
  });

  it('should return null when no FAQ section exists', () => {
    const html = '<h2>About Us</h2><p>We are a company.</p>';
    assert.equal(extractFaqJsonLd(html), null);
  });
});

// ── Passthrough Image Pipeline Tests ────────────────────────────────────────

describe('processImages (passthrough)', () => {
  it('should process images with passthrough uploader', async () => {
    const uploader = createPassthroughUploader();
    const { html, images } = await processImages(SAMPLE_HTML, uploader);

    assert.ok(html.includes('https://example.com/images/tool1.png'));
    assert.equal(images.length, 2);
    assert.equal(images[0].cdnSrc, images[0].src); // passthrough keeps original
  });

  it('should handle empty HTML gracefully', async () => {
    const uploader = createPassthroughUploader();
    const { html, images } = await processImages('', uploader);
    assert.equal(html, '');
    assert.equal(images.length, 0);
  });

  it('should handle null HTML gracefully', async () => {
    const uploader = createPassthroughUploader();
    const { html, images } = await processImages(null, uploader);
    assert.equal(html, '');
    assert.equal(images.length, 0);
  });
});

// ── Validation Tests ────────────────────────────────────────────────────────

describe('validatePayload', () => {
  it('should pass for valid payload', () => {
    const result = validatePayload({
      title: 'Test Article',
      slug: 'test-article',
      html: '<p>Content</p>',
      keyword: 'test',
      status: 'draft',
      format: 'generic'
    });
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it('should fail for missing required fields', () => {
    const result = validatePayload({});
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
    assert.ok(result.errors.some(e => e.includes('title')));
    assert.ok(result.errors.some(e => e.includes('html')));
  });

  it('should fail for invalid status', () => {
    const result = validatePayload({
      title: 'Test', slug: 'test', html: '<p>x</p>',
      keyword: 'k', status: 'invalid', format: 'generic'
    });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('status')));
  });

  it('should fail for invalid format', () => {
    const result = validatePayload({
      title: 'Test', slug: 'test', html: '<p>x</p>',
      keyword: 'k', status: 'draft', format: 'medium'
    });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('format')));
  });

  it('should fail for title exceeding max length', () => {
    const result = validatePayload({
      title: 'x'.repeat(501), slug: 'test', html: '<p>x</p>',
      keyword: 'k', status: 'draft', format: 'generic'
    });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('500 characters')));
  });
});

// ── Platform Formatting Tests ───────────────────────────────────────────────

describe('formatForWordPress', () => {
  it('should add WordPress-specific metadata', () => {
    const payload = {
      title: 'Test', slug: 'test', keyword: 'test keyword',
      seo: { title: 'SEO Title', description: 'SEO desc', canonical: '' },
      images: [{ isFeatured: true, mediaId: '42', src: 'test.jpg' }],
      platformMeta: {}
    };
    const result = formatForWordPress(payload);
    assert.ok(result.platformMeta.wordpress);
    assert.equal(result.platformMeta.wordpress.postType, 'post');
    assert.equal(result.platformMeta.wordpress.featuredMediaId, 42);
    assert.equal(result.platformMeta.wordpress.yoastMeta.focuskw, 'test keyword');
  });
});

describe('formatForShopify', () => {
  it('should add Shopify-specific metadata', () => {
    const payload = {
      title: 'Test', slug: 'test-article',
      seo: { title: 'SEO Title', description: 'SEO desc' },
      platformMeta: {}
    };
    const result = formatForShopify(payload);
    assert.ok(result.platformMeta.shopify);
    assert.equal(result.platformMeta.shopify.handle, 'test-article');
    assert.ok(result.platformMeta.shopify.metafields.length > 0);
  });
});

describe('formatForGhost', () => {
  it('should add Ghost-specific metadata', () => {
    const payload = {
      title: 'Test',
      images: [{ isFeatured: true, cdnSrc: 'https://cdn.example.com/img.jpg', alt: 'Test Image', src: 'test.jpg' }],
      structuredData: { article: { '@type': 'Article' } },
      platformMeta: {}
    };
    const result = formatForGhost(payload);
    assert.ok(result.platformMeta.ghost);
    assert.equal(result.platformMeta.ghost.featureImage, 'https://cdn.example.com/img.jpg');
    assert.equal(result.platformMeta.ghost.featureImageAlt, 'Test Image');
    assert.ok(result.platformMeta.ghost.codeinjectionHead.includes('application/ld+json'));
  });
});

// ── Full Assembly Tests ─────────────────────────────────────────────────────

describe('assemblePayload', () => {
  it('should assemble a complete generic payload', async () => {
    const { payload, validation } = await assemblePayload(SAMPLE_ARTICLE, {
      format: 'generic'
    });

    assert.equal(validation.valid, true);
    assert.equal(payload.title, '10 Best SEO Tools for 2026');
    assert.ok(payload.slug.length > 0);
    assert.ok(payload.html.length > 0);
    assert.ok(payload.excerpt.length > 0);
    assert.equal(payload.keyword, 'best seo tools 2026');
    assert.equal(payload.format, 'generic');
    assert.equal(payload.language, 'en');
    assert.equal(payload.status, 'draft');
    assert.ok(payload.wordCount > 0);
    assert.ok(payload.readingTimeMinutes >= 1);
  });

  it('should include SEO fields', async () => {
    const { payload } = await assemblePayload(SAMPLE_ARTICLE, { format: 'generic' });

    assert.ok(payload.seo);
    assert.equal(payload.seo.title, '10 Best SEO Tools for 2026');
    assert.ok(payload.seo.description.length > 0);
    assert.equal(payload.seo.canonical, 'https://example.com/seo-tools-2026');
    assert.ok(payload.seo.og);
    assert.ok(payload.seo.twitter);
  });

  it('should extract images from HTML', async () => {
    const { payload } = await assemblePayload(SAMPLE_ARTICLE, { format: 'generic' });

    assert.ok(payload.images.length >= 2);
    assert.equal(payload.images[0].src, 'https://example.com/images/tool1.png');
    assert.equal(payload.images[0].isFeatured, true);
  });

  it('should include structured data', async () => {
    const { payload } = await assemblePayload(SAMPLE_ARTICLE, { format: 'generic' });

    assert.ok(payload.structuredData);
    assert.ok(payload.structuredData.article);
  });

  it('should include taxonomy from metadata', async () => {
    const { payload } = await assemblePayload(SAMPLE_ARTICLE, { format: 'generic' });

    assert.deepEqual(payload.categories, ['SEO', 'Marketing']);
    assert.deepEqual(payload.tags, ['seo-tools', 'keyword-research', 'rank-tracking']);
  });

  it('should allow category/tag override', async () => {
    const { payload } = await assemblePayload(SAMPLE_ARTICLE, {
      format: 'generic',
      categories: ['Custom Cat'],
      tags: ['custom-tag']
    });

    assert.deepEqual(payload.categories, ['Custom Cat']);
    assert.deepEqual(payload.tags, ['custom-tag']);
  });

  it('should include quality data when provided', async () => {
    const qualityData = {
      checklist: { score: 75, passedCount: 45, totalCount: 60, categoryScores: { seo: 80 } },
      eeat: { totalScore: 18, maxScore: 25, grade: 'B+', dimensions: {} },
      sevenSignals: [
        { name: 'Content', weightedScore: 8, maxWeightedScore: 10 },
        { name: 'SEO', weightedScore: 7, maxWeightedScore: 10 }
      ]
    };

    const { payload } = await assemblePayload(SAMPLE_ARTICLE, {
      format: 'generic',
      qualityData
    });

    assert.ok(payload.qualityScore);
    assert.equal(payload.qualityScore.checklist.score, 75);
    assert.equal(payload.qualityScore.eeat.grade, 'B+');
    assert.ok(payload.qualityScore.sevenSignals);
    assert.ok(payload.qualityScore.overall > 0);
  });

  it('should assemble wordpress format with platform meta', async () => {
    const { payload } = await assemblePayload(SAMPLE_ARTICLE, { format: 'wordpress' });

    assert.equal(payload.format, 'wordpress');
    assert.ok(payload.platformMeta.wordpress);
    assert.equal(payload.platformMeta.wordpress.postType, 'post');
    assert.ok(payload.platformMeta.wordpress.yoastMeta);
  });

  it('should assemble shopify format with platform meta', async () => {
    const { payload } = await assemblePayload(SAMPLE_ARTICLE, { format: 'shopify' });

    assert.equal(payload.format, 'shopify');
    assert.ok(payload.platformMeta.shopify);
    assert.ok(payload.platformMeta.shopify.handle);
  });

  it('should assemble ghost format with platform meta', async () => {
    const { payload } = await assemblePayload(SAMPLE_ARTICLE, { format: 'ghost' });

    assert.equal(payload.format, 'ghost');
    assert.ok(payload.platformMeta.ghost);
    assert.equal(payload.platformMeta.ghost.visibility, 'public');
  });

  it('should handle article with minimal fields', async () => {
    const minimalArticle = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Minimal',
      topic: 'test',
      html_content: '<p>Hello world</p>',
      status: 'draft',
      metadata: {}
    };

    const { payload, validation } = await assemblePayload(minimalArticle, { format: 'generic' });
    assert.equal(validation.valid, true);
    assert.equal(payload.title, 'Minimal');
    assert.equal(payload.wordCount, 2);
  });

  it('should handle article with empty HTML', async () => {
    const emptyArticle = {
      id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Empty',
      topic: 'test',
      html_content: '',
      status: 'draft',
      metadata: {}
    };

    const { payload, validation } = await assemblePayload(emptyArticle, { format: 'generic' });
    // Validation should fail because html is required
    assert.equal(validation.valid, false);
    assert.ok(validation.errors.some(e => e.includes('html')));
  });
});

// ── Article JSON-LD Generation Tests ────────────────────────────────────────

describe('generateArticleJsonLd', () => {
  it('should generate valid Article JSON-LD', () => {
    const payload = {
      title: 'Test Article',
      excerpt: 'Test excerpt',
      images: [{ src: 'https://example.com/img.jpg' }],
      publishedAt: '2026-03-01T10:00:00Z',
      updatedAt: '2026-03-15T14:30:00Z',
      author: { name: 'Jane Doe', url: 'https://example.com/jane' },
      seo: { canonical: 'https://example.com/test' },
      wordCount: 500,
      language: 'en',
      tags: ['seo', 'testing'],
      keyword: 'test keyword'
    };

    const jsonLd = generateArticleJsonLd(SAMPLE_ARTICLE, payload);
    assert.equal(jsonLd['@context'], 'https://schema.org');
    assert.equal(jsonLd['@type'], 'Article');
    assert.equal(jsonLd.headline, 'Test Article');
    assert.equal(jsonLd.author.name, 'Jane Doe');
    assert.equal(jsonLd.wordCount, 500);
    assert.equal(jsonLd.inLanguage, 'en');
  });
});
