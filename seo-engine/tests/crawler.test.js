/**
 * Content Inventory Crawler Tests — DI-004
 *
 * Tests for the content crawler module:
 * - Sitemap parsing (standard + sitemap index)
 * - Link extraction from HTML
 * - Robots.txt parsing
 * - Metadata extraction (title, description, h1, word count, links, images, schema)
 * - Arabic content word count
 * - Content hash consistency
 * - Status classification
 * - URL validation (reject localhost/private IPs)
 * - Concurrent crawl rejection
 *
 * Uses node:test with mocked fetch.
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

// Set env vars before requiring modules
process.env.SUPABASE_URL = 'https://test-project.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

const crawler = require('../bridge/ingestion/crawler');

// ── Helper: Mock fetch ──────────────────────────────────────

let fetchHandler;
const originalFetch = globalThis.fetch;

function mockFetch(handler) {
  fetchHandler = handler;
  globalThis.fetch = async (url, opts) => {
    return fetchHandler(url, opts);
  };
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

function mockResponse(body, status = 200, headers = {}) {
  const isString = typeof body === 'string';
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {
      get: (name) => headers[name.toLowerCase()] || null
    },
    json: async () => isString ? JSON.parse(body) : body,
    text: async () => isString ? body : JSON.stringify(body)
  };
}

// ── URL Validation Tests ────────────────────────────────────

describe('Crawler — URL Validation', () => {
  it('accepts valid HTTPS URLs', () => {
    const result = crawler.validateUrl('https://example.com');
    assert.equal(result.valid, true);
  });

  it('accepts valid HTTP URLs', () => {
    const result = crawler.validateUrl('http://example.com');
    assert.equal(result.valid, true);
  });

  it('rejects FTP URLs', () => {
    const result = crawler.validateUrl('ftp://example.com');
    assert.equal(result.valid, false);
    assert.ok(result.reason.includes('HTTP'));
  });

  it('rejects localhost', () => {
    const result = crawler.validateUrl('http://localhost/path');
    assert.equal(result.valid, false);
    assert.ok(result.reason.includes('Localhost'));
  });

  it('rejects 127.0.0.1', () => {
    const result = crawler.validateUrl('http://127.0.0.1:8080/path');
    assert.equal(result.valid, false);
    assert.ok(result.reason.includes('Localhost'));
  });

  it('rejects private IP 10.x.x.x', () => {
    const result = crawler.validateUrl('http://10.0.0.1/path');
    assert.equal(result.valid, false);
    assert.ok(result.reason.includes('Private'));
  });

  it('rejects private IP 192.168.x.x', () => {
    const result = crawler.validateUrl('http://192.168.1.1/path');
    assert.equal(result.valid, false);
    assert.ok(result.reason.includes('Private'));
  });

  it('rejects private IP 172.16.x.x', () => {
    const result = crawler.validateUrl('http://172.16.0.1/path');
    assert.equal(result.valid, false);
    assert.ok(result.reason.includes('Private'));
  });

  it('rejects malformed URLs', () => {
    const result = crawler.validateUrl('not-a-url');
    assert.equal(result.valid, false);
    assert.ok(result.reason.includes('Invalid'));
  });

  it('rejects javascript: URLs', () => {
    const result = crawler.validateUrl('javascript:alert(1)');
    assert.equal(result.valid, false);
  });
});

// ── Robots.txt Parsing Tests ────────────────────────────────

describe('Crawler — Robots.txt Parsing', () => {
  it('parses basic Disallow rules for wildcard agent', () => {
    const robotsTxt = `
User-agent: *
Disallow: /admin/
Disallow: /private/
Crawl-delay: 2

Sitemap: https://example.com/sitemap.xml
    `;
    const result = crawler.parseRobotsTxt(robotsTxt);
    assert.deepEqual(result.disallowed, ['/admin/', '/private/']);
    assert.equal(result.crawlDelay, 2);
    assert.deepEqual(result.sitemaps, ['https://example.com/sitemap.xml']);
  });

  it('uses specific agent rules over wildcard', () => {
    const robotsTxt = `
User-agent: *
Disallow: /all-blocked/

User-agent: ChainIQ-Crawler
Disallow: /specific-blocked/
Crawl-delay: 5
    `;
    const result = crawler.parseRobotsTxt(robotsTxt, 'ChainIQ-Crawler');
    assert.deepEqual(result.disallowed, ['/specific-blocked/']);
    assert.equal(result.crawlDelay, 5);
  });

  it('falls back to wildcard when agent not found', () => {
    const robotsTxt = `
User-agent: *
Disallow: /blocked/
    `;
    const result = crawler.parseRobotsTxt(robotsTxt, 'OtherBot');
    assert.deepEqual(result.disallowed, ['/blocked/']);
  });

  it('handles empty or null robots.txt', () => {
    assert.deepEqual(crawler.parseRobotsTxt(null).disallowed, []);
    assert.deepEqual(crawler.parseRobotsTxt('').disallowed, []);
  });

  it('extracts sitemap URLs', () => {
    const robotsTxt = `
Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/sitemap-news.xml
User-agent: *
Disallow:
    `;
    const result = crawler.parseRobotsTxt(robotsTxt);
    assert.equal(result.sitemaps.length, 2);
    assert.ok(result.sitemaps.includes('https://example.com/sitemap.xml'));
  });

  it('isDisallowed checks path prefix', () => {
    assert.equal(crawler.isDisallowed('/admin/settings', ['/admin/']), true);
    assert.equal(crawler.isDisallowed('/public/page', ['/admin/']), false);
    assert.equal(crawler.isDisallowed('/admin', ['/admin/']), false); // exact prefix mismatch
  });
});

// ── Sitemap Parsing Tests ───────────────────────────────────

describe('Crawler — Sitemap Parsing', () => {
  it('parseSitemapLocs extracts URLs from standard sitemap', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/page1</loc>
    <lastmod>2024-01-01</lastmod>
  </url>
  <url>
    <loc>https://example.com/page2</loc>
  </url>
  <url>
    <loc>https://example.com/page3</loc>
  </url>
</urlset>`;
    const urls = crawler.parseSitemapLocs(xml);
    assert.equal(urls.length, 3);
    assert.ok(urls.includes('https://example.com/page1'));
    assert.ok(urls.includes('https://example.com/page2'));
    assert.ok(urls.includes('https://example.com/page3'));
  });

  it('parseSitemapLocs decodes HTML entities in URLs', () => {
    const xml = `<urlset>
  <url><loc>https://example.com/page?a=1&amp;b=2</loc></url>
</urlset>`;
    const urls = crawler.parseSitemapLocs(xml);
    assert.equal(urls[0], 'https://example.com/page?a=1&b=2');
  });

  it('parseSitemapLocs ignores non-HTTP URLs', () => {
    const xml = `<urlset>
  <url><loc>ftp://example.com/file</loc></url>
  <url><loc>https://example.com/page</loc></url>
</urlset>`;
    const urls = crawler.parseSitemapLocs(xml);
    assert.equal(urls.length, 1);
    assert.equal(urls[0], 'https://example.com/page');
  });

  it('discoverFromSitemap fetches and parses sitemap', async () => {
    mockFetch(async (url) => {
      if (url.includes('sitemap.xml')) {
        return mockResponse(`<?xml version="1.0"?>
<urlset>
  <url><loc>https://example.com/page1</loc></url>
  <url><loc>https://example.com/page2</loc></url>
</urlset>`);
      }
      return mockResponse('', 404);
    });

    const urls = await crawler.discoverFromSitemap('https://example.com');
    assert.equal(urls.length, 2);
    restoreFetch();
  });

  it('handles sitemap index with child sitemaps', async () => {
    mockFetch(async (url) => {
      if (url === 'https://example.com/sitemap.xml') {
        return mockResponse(`<?xml version="1.0"?>
<sitemapindex>
  <sitemap><loc>https://example.com/sitemap-posts.xml</loc></sitemap>
  <sitemap><loc>https://example.com/sitemap-pages.xml</loc></sitemap>
</sitemapindex>`);
      }
      if (url === 'https://example.com/sitemap-posts.xml') {
        return mockResponse(`<urlset>
  <url><loc>https://example.com/post1</loc></url>
  <url><loc>https://example.com/post2</loc></url>
</urlset>`);
      }
      if (url === 'https://example.com/sitemap-pages.xml') {
        return mockResponse(`<urlset>
  <url><loc>https://example.com/about</loc></url>
</urlset>`);
      }
      return mockResponse('', 404);
    });

    const urls = await crawler.discoverFromSitemap('https://example.com');
    assert.equal(urls.length, 3);
    assert.ok(urls.includes('https://example.com/post1'));
    assert.ok(urls.includes('https://example.com/about'));
    restoreFetch();
  });
});

// ── Link Extraction Tests ───────────────────────────────────

describe('Crawler — Link Extraction', () => {
  it('extracts absolute links from HTML', () => {
    const html = `
<a href="https://example.com/page1">Page 1</a>
<a href="https://example.com/page2">Page 2</a>
<a href="https://other.com/external">External</a>
    `;
    const links = crawler.extractLinks(html, 'https://example.com');
    assert.equal(links.length, 3);
  });

  it('resolves relative links using base URL', () => {
    const html = `
<a href="/about">About</a>
<a href="contact">Contact</a>
    `;
    const links = crawler.extractLinks(html, 'https://example.com/pages/');
    assert.ok(links.includes('https://example.com/about'));
    assert.ok(links.includes('https://example.com/pages/contact'));
  });

  it('skips javascript: and mailto: links', () => {
    const html = `
<a href="javascript:void(0)">Click</a>
<a href="mailto:test@test.com">Email</a>
<a href="tel:+1234567890">Call</a>
<a href="https://example.com/real">Real</a>
    `;
    const links = crawler.extractLinks(html, 'https://example.com');
    assert.equal(links.length, 1);
    assert.equal(links[0], 'https://example.com/real');
  });

  it('handles links with various quote styles', () => {
    const html = `
<a href="https://example.com/a">A</a>
<a href='https://example.com/b'>B</a>
    `;
    const links = crawler.extractLinks(html, 'https://example.com');
    assert.equal(links.length, 2);
  });
});

// ── Metadata Extraction Tests ───────────────────────────────

describe('Crawler — Metadata Extraction', () => {
  const sampleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Test Page Title</title>
  <meta name="description" content="Test meta description for the page">
  <meta name="author" content="John Doe">
  <meta property="article:published_time" content="2024-06-15T10:00:00Z">
  <meta property="article:modified_time" content="2024-12-01T15:30:00Z">
  <link rel="canonical" href="https://example.com/test-page">
  <script type="application/ld+json">
  {
    "@type": "Article",
    "datePublished": "2024-06-15"
  }
  </script>
</head>
<body>
  <header><nav><a href="/nav-link">Nav</a></nav></header>
  <article>
    <h1>Main Heading H1</h1>
    <p>This is the first paragraph of content with enough words to make it meaningful.</p>
    <h2>Subheading One</h2>
    <p>More content here in the article body section with additional text for word count.</p>
    <h2>Subheading Two</h2>
    <h3>Detail Section</h3>
    <p>Even more content with links and images.</p>
    <a href="https://example.com/internal-link">Internal Link</a>
    <a href="https://other-site.com/external">External Link</a>
    <img src="/image1.jpg" alt="Image with alt text">
    <img src="/image2.jpg">
    <img src="/image3.jpg" alt="Another described image">
  </article>
  <footer>Footer content</footer>
</body>
</html>`;

  it('extracts title', () => {
    const meta = crawler.extractMetadata(sampleHtml, 'https://example.com/test-page');
    assert.equal(meta.title, 'Test Page Title');
  });

  it('extracts meta description', () => {
    const meta = crawler.extractMetadata(sampleHtml, 'https://example.com/test-page');
    assert.equal(meta.meta_description, 'Test meta description for the page');
  });

  it('extracts H1 text', () => {
    const meta = crawler.extractMetadata(sampleHtml, 'https://example.com/test-page');
    assert.equal(meta.h1_text, 'Main Heading H1');
  });

  it('counts H2 and H3 headings', () => {
    const meta = crawler.extractMetadata(sampleHtml, 'https://example.com/test-page');
    assert.equal(meta.h2_count, 2);
    assert.equal(meta.h3_count, 1);
  });

  it('builds heading structure', () => {
    const meta = crawler.extractMetadata(sampleHtml, 'https://example.com/test-page');
    assert.ok(Array.isArray(meta.heading_structure));
    // H1 + 2 H2 + 1 H3 = 4 headings
    assert.equal(meta.heading_structure.length, 4);
    assert.equal(meta.heading_structure[0].level, 1);
    assert.equal(meta.heading_structure[0].text, 'Main Heading H1');
  });

  it('extracts author', () => {
    const meta = crawler.extractMetadata(sampleHtml, 'https://example.com/test-page');
    assert.equal(meta.author, 'John Doe');
  });

  it('extracts publish date', () => {
    const meta = crawler.extractMetadata(sampleHtml, 'https://example.com/test-page');
    assert.equal(meta.publish_date, '2024-06-15');
  });

  it('extracts modified date', () => {
    const meta = crawler.extractMetadata(sampleHtml, 'https://example.com/test-page');
    assert.equal(meta.modified_date, '2024-12-01');
  });

  it('extracts language', () => {
    const meta = crawler.extractMetadata(sampleHtml, 'https://example.com/test-page');
    assert.equal(meta.language, 'en');
  });

  it('extracts canonical URL', () => {
    const meta = crawler.extractMetadata(sampleHtml, 'https://example.com/test-page');
    assert.equal(meta.canonical_url, 'https://example.com/test-page');
  });

  it('counts internal links', () => {
    const meta = crawler.extractMetadata(sampleHtml, 'https://example.com/test-page');
    assert.ok(meta.internal_link_count >= 1); // At least the internal link + nav link
  });

  it('counts external links', () => {
    const meta = crawler.extractMetadata(sampleHtml, 'https://example.com/test-page');
    assert.equal(meta.external_link_count, 1);
  });

  it('counts images', () => {
    const meta = crawler.extractMetadata(sampleHtml, 'https://example.com/test-page');
    assert.equal(meta.image_count, 3);
  });

  it('counts images with alt text', () => {
    const meta = crawler.extractMetadata(sampleHtml, 'https://example.com/test-page');
    assert.equal(meta.images_with_alt_count, 2);
  });

  it('extracts schema types', () => {
    const meta = crawler.extractMetadata(sampleHtml, 'https://example.com/test-page');
    assert.ok(meta.schema_types.includes('Article'));
  });

  it('calculates word count > 0', () => {
    const meta = crawler.extractMetadata(sampleHtml, 'https://example.com/test-page');
    assert.ok(meta.word_count > 0);
  });

  it('generates content hash (SHA-256 hex)', () => {
    const meta = crawler.extractMetadata(sampleHtml, 'https://example.com/test-page');
    assert.ok(meta.content_hash);
    assert.equal(meta.content_hash.length, 64); // SHA-256 hex = 64 chars
    assert.ok(/^[a-f0-9]+$/.test(meta.content_hash));
  });

  it('extracts meta description with content before name attribute', () => {
    const html = '<html><head><meta content="Reversed order desc" name="description"></head><body></body></html>';
    const meta = crawler.extractMetadata(html, 'https://example.com');
    assert.equal(meta.meta_description, 'Reversed order desc');
  });

  it('handles missing metadata gracefully', () => {
    const html = '<html><body><p>Just a paragraph</p></body></html>';
    const meta = crawler.extractMetadata(html, 'https://example.com');
    assert.equal(meta.title, null);
    assert.equal(meta.meta_description, null);
    assert.equal(meta.h1_text, null);
    assert.equal(meta.author, null);
    assert.equal(meta.language, 'en'); // default
  });

  it('handles @graph schema structures', () => {
    const html = `<html><head>
<script type="application/ld+json">
{
  "@graph": [
    { "@type": "WebSite" },
    { "@type": "Organization" }
  ]
}
</script>
</head><body></body></html>`;
    const meta = crawler.extractMetadata(html, 'https://example.com');
    assert.ok(meta.schema_types.includes('WebSite'));
    assert.ok(meta.schema_types.includes('Organization'));
  });
});

// ── Content Hash Consistency Tests ──────────────────────────

describe('Crawler — Content Hash Consistency', () => {
  it('produces same hash for same content', () => {
    const html = '<html><body><p>Hello World</p></body></html>';
    const meta1 = crawler.extractMetadata(html, 'https://example.com');
    const meta2 = crawler.extractMetadata(html, 'https://example.com');
    assert.equal(meta1.content_hash, meta2.content_hash);
  });

  it('produces different hash for different content', () => {
    const html1 = '<html><body><p>Hello World</p></body></html>';
    const html2 = '<html><body><p>Goodbye World</p></body></html>';
    const meta1 = crawler.extractMetadata(html1, 'https://example.com');
    const meta2 = crawler.extractMetadata(html2, 'https://example.com');
    assert.notEqual(meta1.content_hash, meta2.content_hash);
  });
});

// ── Arabic Word Count Tests ─────────────────────────────────

describe('Crawler — Arabic Content Word Count', () => {
  it('counts Arabic words correctly', () => {
    // "The programming language is the best" in Arabic - space-separated words
    const arabicText = 'لغة البرمجة هي الأفضل في العالم';
    const count = crawler.countWords(arabicText, 'ar');
    assert.equal(count, 6);
  });

  it('counts mixed Arabic/English words', () => {
    const mixedText = 'هذا هو Node.js framework للتطوير';
    const count = crawler.countWords(mixedText, 'ar');
    assert.equal(count, 5);
  });

  it('handles Arabic HTML content', () => {
    const html = `<html lang="ar"><body>
<article>
  <h1>عنوان المقال</h1>
  <p>هذا هو محتوى المقال باللغة العربية وهو يحتوي على عدة كلمات</p>
</article>
</body></html>`;
    const meta = crawler.extractMetadata(html, 'https://example.com');
    assert.equal(meta.language, 'ar');
    assert.ok(meta.word_count > 5);
  });

  it('returns 0 for empty text', () => {
    assert.equal(crawler.countWords('', 'en'), 0);
    assert.equal(crawler.countWords('   ', 'en'), 0);
  });
});

// ── Status Classification Tests ─────────────────────────────

describe('Crawler — Status Classification', () => {
  const baseMetadata = {
    title: 'Test',
    meta_description: 'Description',
    word_count: 500,
    publish_date: '2025-01-01',
    modified_date: '2025-06-01'
  };

  it('classifies 200 with good metadata as ok', () => {
    assert.equal(crawler.classifyStatus(baseMetadata, 200), 'ok');
  });

  it('classifies 404 as removed', () => {
    assert.equal(crawler.classifyStatus(baseMetadata, 404), 'removed');
  });

  it('classifies 410 as removed', () => {
    assert.equal(crawler.classifyStatus(baseMetadata, 410), 'removed');
  });

  it('classifies 500 as error', () => {
    assert.equal(crawler.classifyStatus(baseMetadata, 500), 'error');
  });

  it('classifies 301 as redirect', () => {
    assert.equal(crawler.classifyStatus(baseMetadata, 301, 'https://example.com/new'), 'redirect');
  });

  it('classifies missing title and description as no_meta', () => {
    const noMeta = { ...baseMetadata, title: null, meta_description: null };
    assert.equal(crawler.classifyStatus(noMeta, 200), 'no_meta');
  });

  it('classifies low word count as thin', () => {
    const thin = { ...baseMetadata, word_count: 100 };
    assert.equal(crawler.classifyStatus(thin, 200), 'thin');
  });

  it('classifies old content (>18 months, no recent modification) as old', () => {
    const old = {
      ...baseMetadata,
      publish_date: '2023-01-01',
      modified_date: null
    };
    assert.equal(crawler.classifyStatus(old, 200), 'old');
  });

  it('does not classify recently modified old content as old', () => {
    const recentlyModified = {
      ...baseMetadata,
      publish_date: '2023-01-01',
      modified_date: new Date().toISOString().slice(0, 10) // today
    };
    assert.equal(crawler.classifyStatus(recentlyModified, 200), 'ok');
  });
});

// ── URL Normalization Tests ─────────────────────────────────

describe('Crawler — URL Normalization', () => {
  it('removes trailing slashes', () => {
    assert.equal(crawler.normalizeUrl('https://example.com/path/'), 'https://example.com/path');
  });

  it('preserves root slash', () => {
    const normalized = crawler.normalizeUrl('https://example.com/');
    assert.equal(normalized, 'https://example.com/');
  });

  it('removes fragments', () => {
    const normalized = crawler.normalizeUrl('https://example.com/page#section');
    assert.ok(!normalized.includes('#'));
  });

  it('lowercases hostname', () => {
    const normalized = crawler.normalizeUrl('https://EXAMPLE.COM/Path');
    assert.ok(normalized.includes('example.com'));
    assert.ok(normalized.includes('/Path')); // path case preserved
  });
});

// ── Body Text Extraction Tests ──────────────────────────────

describe('Crawler — Body Text Extraction', () => {
  it('extracts text from article element', () => {
    const html = '<html><body><nav>Nav content</nav><article><p>Article content here</p></article></body></html>';
    const text = crawler.extractBodyText(html);
    assert.ok(text.includes('Article content'));
    // Nav stripped since we're inside article
  });

  it('falls back to body when no article/main found', () => {
    const html = '<html><body><p>Body content only</p></body></html>';
    const text = crawler.extractBodyText(html);
    assert.ok(text.includes('Body content'));
  });

  it('strips script and style tags', () => {
    const html = '<html><body><script>var x = 1;</script><style>.a{}</style><p>Real content</p></body></html>';
    const text = crawler.extractBodyText(html);
    assert.ok(text.includes('Real content'));
    assert.ok(!text.includes('var x'));
    assert.ok(!text.includes('.a{}'));
  });
});

// ── Concurrent Crawl Rejection Tests ────────────────────────

describe('Crawler — Concurrent Crawl Rejection', () => {
  afterEach(() => {
    restoreFetch();
  });

  it('handleTrigger rejects when crawl already running', async () => {
    mockFetch(async (url) => {
      // hasRunningCrawl query returns a running session
      if (url.includes('crawl_sessions') && url.includes('status=eq.running')) {
        return mockResponse([{ id: 'existing-session-id' }]);
      }
      return mockResponse([]);
    });

    const result = await crawler.handleTrigger('user-123', { siteUrl: 'https://example.com' });
    assert.equal(result.success, false);
    assert.equal(result.statusCode, 409);
    assert.ok(result.error.includes('already running'));
  });

  it('handleTrigger rejects missing siteUrl', async () => {
    const result = await crawler.handleTrigger('user-123', {});
    assert.equal(result.success, false);
    assert.equal(result.statusCode, 400);
    assert.ok(result.error.includes('siteUrl'));
  });

  it('handleTrigger rejects invalid URL', async () => {
    const result = await crawler.handleTrigger('user-123', { siteUrl: 'http://localhost' });
    assert.equal(result.success, false);
    assert.equal(result.statusCode, 400);
  });

  it('handleTrigger starts crawl for valid request', async () => {
    mockFetch(async (url) => {
      // hasRunningCrawl returns empty (no running crawl)
      if (url.includes('crawl_sessions') && url.includes('status=eq.running')) {
        return mockResponse([]);
      }
      // createCrawlSession
      if (url.includes('crawl_sessions') && !url.includes('status=eq.running')) {
        return mockResponse([{ id: 'new-session-id', status: 'running' }]);
      }
      // Any other call (sitemap fetch, etc)
      return mockResponse('', 404);
    });

    const result = await crawler.handleTrigger('user-123', { siteUrl: 'https://example.com' });
    assert.equal(result.success, true);
    assert.equal(result.data.status, 'started');
  });
});

// ── Status Endpoint Tests ───────────────────────────────────

describe('Crawler — Status Endpoint', () => {
  afterEach(() => {
    restoreFetch();
  });

  it('handleStatus returns 400 for missing sessionId', async () => {
    const result = await crawler.handleStatus('user-123', null);
    assert.equal(result.success, false);
    assert.equal(result.statusCode, 400);
  });

  it('handleStatus returns 404 for non-existent session', async () => {
    mockFetch(async () => mockResponse([]));
    const result = await crawler.handleStatus('user-123', 'non-existent-id');
    assert.equal(result.success, false);
    assert.equal(result.statusCode, 404);
    restoreFetch();
  });

  it('handleStatus returns session data for valid session', async () => {
    mockFetch(async () => mockResponse([{
      id: 'session-123',
      site_url: 'https://example.com',
      status: 'running',
      discovery_method: 'sitemap',
      urls_discovered: 50,
      urls_crawled: 25,
      urls_errored: 2,
      max_pages: 10000,
      started_at: '2024-01-01T00:00:00Z',
      completed_at: null,
      error_log: []
    }]));

    const result = await crawler.handleStatus('user-123', 'session-123');
    assert.equal(result.success, true);
    assert.equal(result.data.id, 'session-123');
    assert.equal(result.data.status, 'running');
    assert.equal(result.data.urlsDiscovered, 50);
    assert.equal(result.data.urlsCrawled, 25);
    restoreFetch();
  });
});

// ── parseDate Tests ─────────────────────────────────────────

describe('Crawler — parseDate', () => {
  it('parses ISO date strings', () => {
    assert.equal(crawler.parseDate('2024-06-15T10:00:00Z'), '2024-06-15');
  });

  it('parses simple date strings', () => {
    assert.equal(crawler.parseDate('2024-06-15'), '2024-06-15');
  });

  it('returns null for invalid dates', () => {
    assert.equal(crawler.parseDate('not-a-date'), null);
    assert.equal(crawler.parseDate(null), null);
    assert.equal(crawler.parseDate(''), null);
  });
});

// ── decodeHtmlEntities Tests ────────────────────────────────

describe('Crawler — decodeHtmlEntities', () => {
  it('decodes &amp;', () => {
    assert.equal(crawler.decodeHtmlEntities('a&amp;b'), 'a&b');
  });

  it('decodes &lt; and &gt;', () => {
    assert.equal(crawler.decodeHtmlEntities('&lt;p&gt;'), '<p>');
  });

  it('decodes &quot;', () => {
    assert.equal(crawler.decodeHtmlEntities('&quot;hello&quot;'), '"hello"');
  });
});
