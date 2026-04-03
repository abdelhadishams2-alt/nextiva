/**
 * Content Inventory Crawler — DI-004
 *
 * HTTP content crawler that discovers all URLs on a client's site,
 * extracts page metadata (title, meta description, H1, word count,
 * heading structure, internal/external links, images, schema types),
 * and populates the content_inventory table.
 *
 * Features:
 * - Sitemap discovery (standard + sitemap index)
 * - BFS link-following with rate limiting (2 req/sec)
 * - robots.txt parsing and respect
 * - Full HTML metadata extraction via regex (no DOMParser)
 * - Body text extraction (article/main/[role=main] priority)
 * - Content hash via SHA-256
 * - Status classification (ok/thin/old/no_meta/redirect/removed/error)
 * - Max 1 concurrent crawl per user
 * - URL validation (reject localhost, private IPs, non-HTTP(S))
 *
 * Zero npm dependencies — Node.js built-ins only.
 */

const crypto = require('crypto');
const logger = require('../logger');
const supabase = require('../supabase-client');

// ── Constants ──────────────────────────────────────────────────

const RETRY_DELAYS = [5000, 15000, 45000];
const UPSERT_BATCH_SIZE = 500;
const DEFAULT_MAX_PAGES = 10000;
const DEFAULT_MAX_DEPTH = 3;
const RATE_LIMIT_MS = 500; // 2 req/sec
const USER_AGENT = 'ChainIQ-Crawler/1.0 (+https://chainiq.ai/bot)';
const FETCH_TIMEOUT_MS = 30000;

// Private/reserved IP ranges (CIDR notation simplified to prefix checks)
const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
  /^fd/i,
  /^fe80:/i,
  /^localhost$/i
];

// ── Helper: sleep ──────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Helper: get Supabase admin config ─────────────────────────

function getSupabaseAdmin() {
  const config = supabase.loadConfig();
  const serviceRoleKey = supabase.getServiceRoleKey();
  if (!config || !serviceRoleKey) {
    throw new Error('Supabase admin config not available. Set SUPABASE_SERVICE_ROLE_KEY env var.');
  }
  return { config, serviceRoleKey };
}

// ── URL Validation ─────────────────────────────────────────────

/**
 * Validate a URL is safe to crawl.
 * Rejects: localhost, private IPs, non-HTTP(S), malformed URLs.
 *
 * @param {string} urlString - URL to validate
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateUrl(urlString) {
  try {
    const parsed = new URL(urlString);

    // Must be http or https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, reason: 'Only HTTP and HTTPS URLs are allowed' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Reject localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return { valid: false, reason: 'Localhost URLs are not allowed' };
    }

    // Reject private IPs
    for (const pattern of PRIVATE_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return { valid: false, reason: 'Private IP addresses are not allowed' };
      }
    }

    return { valid: true };
  } catch (e) {
    return { valid: false, reason: 'Invalid URL format: ' + e.message };
  }
}

// ── Robots.txt Parser ──────────────────────────────────────────

/**
 * Parse robots.txt content and extract rules for a user agent.
 *
 * @param {string} robotsTxt - Raw robots.txt content
 * @param {string} userAgent - User agent to match (default: '*')
 * @returns {{ disallowed: string[], crawlDelay: number|null, sitemaps: string[] }}
 */
function parseRobotsTxt(robotsTxt, userAgent = '*') {
  const result = {
    disallowed: [],
    crawlDelay: null,
    sitemaps: []
  };

  if (!robotsTxt || typeof robotsTxt !== 'string') return result;

  const lines = robotsTxt.split('\n');
  let currentAgent = null;
  let matchesOurAgent = false;
  let matchedSpecific = false;
  const wildcardRules = { disallowed: [], crawlDelay: null };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Skip comments and empty lines
    if (!line || line.startsWith('#')) continue;

    // Remove inline comments
    const cleanLine = line.replace(/#.*$/, '').trim();
    if (!cleanLine) continue;

    const colonIdx = cleanLine.indexOf(':');
    if (colonIdx === -1) continue;

    const directive = cleanLine.substring(0, colonIdx).trim().toLowerCase();
    const value = cleanLine.substring(colonIdx + 1).trim();

    if (directive === 'sitemap') {
      result.sitemaps.push(value);
      continue;
    }

    if (directive === 'user-agent') {
      currentAgent = value.toLowerCase();
      matchesOurAgent = (currentAgent === userAgent.toLowerCase() || currentAgent === '*');
      if (currentAgent === userAgent.toLowerCase()) {
        matchedSpecific = true;
      }
      continue;
    }

    if (!matchesOurAgent) continue;

    if (directive === 'disallow' && value) {
      if (currentAgent === '*' && !matchedSpecific) {
        wildcardRules.disallowed.push(value);
      } else if (currentAgent === userAgent.toLowerCase()) {
        result.disallowed.push(value);
      }
    }

    if (directive === 'crawl-delay') {
      const delay = parseFloat(value);
      if (!isNaN(delay) && delay > 0) {
        if (currentAgent === '*' && !matchedSpecific) {
          wildcardRules.crawlDelay = delay;
        } else if (currentAgent === userAgent.toLowerCase()) {
          result.crawlDelay = delay;
        }
      }
    }
  }

  // If no specific agent rules found, use wildcard rules
  if (!matchedSpecific) {
    result.disallowed = wildcardRules.disallowed;
    if (wildcardRules.crawlDelay !== null) {
      result.crawlDelay = wildcardRules.crawlDelay;
    }
  }

  return result;
}

/**
 * Check if a URL path is disallowed by robots.txt rules.
 *
 * @param {string} urlPath - URL path to check
 * @param {string[]} disallowed - List of disallowed paths
 * @returns {boolean}
 */
function isDisallowed(urlPath, disallowed) {
  for (const rule of disallowed) {
    if (urlPath.startsWith(rule)) return true;
  }
  return false;
}

// ── Sitemap Discovery ──────────────────────────────────────────

/**
 * Discover URLs from a site's sitemap.xml.
 * Handles both standard sitemaps and sitemap index files.
 *
 * @param {string} siteUrl - Base URL of the site
 * @returns {Promise<string[]>} List of discovered URLs
 */
async function discoverFromSitemap(siteUrl) {
  const base = siteUrl.replace(/\/+$/, '');
  const sitemapUrls = [
    base + '/sitemap.xml',
    base + '/sitemap_index.xml',
    base + '/sitemap/',
    base + '/sitemap.txt'
  ];

  let allUrls = [];

  for (const sitemapUrl of sitemapUrls) {
    try {
      const urls = await fetchSitemap(sitemapUrl);
      if (urls.length > 0) {
        allUrls = allUrls.concat(urls);
        logger.info('crawler_sitemap_found', { sitemapUrl, urlCount: urls.length });
        break; // Use the first successful sitemap
      }
    } catch (e) {
      logger.info('crawler_sitemap_not_found', { sitemapUrl, error: e.message });
    }
  }

  // Deduplicate
  return [...new Set(allUrls)];
}

/**
 * Fetch and parse a single sitemap URL.
 * If it's a sitemap index, recursively fetch child sitemaps.
 *
 * @param {string} sitemapUrl - URL of the sitemap
 * @param {number} depth - Current recursion depth (max 3)
 * @returns {Promise<string[]>}
 */
async function fetchSitemap(sitemapUrl, depth = 0) {
  if (depth > 3) return [];

  const res = await fetchWithTimeout(sitemapUrl, {
    headers: { 'User-Agent': USER_AGENT }
  });

  if (!res.ok) return [];

  const text = await res.text();

  // Check if it's a sitemap index (contains <sitemapindex>)
  if (/<sitemapindex[\s>]/i.test(text)) {
    return parseSitemapIndex(text, depth);
  }

  // Standard sitemap — extract <loc> elements
  return parseSitemapLocs(text);
}

/**
 * Parse <loc> elements from a sitemap XML string.
 *
 * @param {string} xml - Sitemap XML content
 * @returns {string[]}
 */
function parseSitemapLocs(xml) {
  const urls = [];
  const locRegex = /<loc>\s*(.*?)\s*<\/loc>/gi;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    const url = match[1].trim();
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      urls.push(decodeHtmlEntities(url));
    }
  }
  return urls;
}

/**
 * Parse a sitemap index and recursively fetch child sitemaps.
 *
 * @param {string} xml - Sitemap index XML content
 * @param {number} depth - Current depth
 * @returns {Promise<string[]>}
 */
async function parseSitemapIndex(xml, depth) {
  const childUrls = parseSitemapLocs(xml);
  const allUrls = [];

  for (const childUrl of childUrls) {
    try {
      const urls = await fetchSitemap(childUrl, depth + 1);
      allUrls.push(...urls);
    } catch (e) {
      logger.warn('crawler_child_sitemap_error', { childUrl, error: e.message });
    }
  }

  return allUrls;
}

/**
 * Decode basic HTML entities in URLs.
 */
function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// ── Link-Following Crawler ─────────────────────────────────────

/**
 * Discover URLs by crawling from the homepage using BFS.
 * Rate-limited to 2 req/sec, same-domain only.
 *
 * @param {string} siteUrl - Base URL of the site
 * @param {number} maxDepth - Maximum crawl depth (default: 3)
 * @param {number} maxPages - Maximum pages to discover (default: 10000)
 * @returns {Promise<string[]>}
 */
async function discoverFromCrawling(siteUrl, maxDepth = DEFAULT_MAX_DEPTH, maxPages = DEFAULT_MAX_PAGES) {
  const base = new URL(siteUrl);
  const domain = base.hostname;
  const discovered = new Set();
  const queue = [{ url: normalizeUrl(siteUrl), depth: 0 }];
  discovered.add(normalizeUrl(siteUrl));

  while (queue.length > 0 && discovered.size < maxPages) {
    const { url, depth } = queue.shift();

    if (depth > maxDepth) continue;

    try {
      await sleep(RATE_LIMIT_MS);
      const res = await fetchWithTimeout(url, {
        headers: { 'User-Agent': USER_AGENT }
      });

      if (!res.ok) continue;

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) continue;

      const html = await res.text();
      const links = extractLinks(html, url);

      for (const link of links) {
        try {
          const parsed = new URL(link);
          if (parsed.hostname !== domain) continue;
          const normalized = normalizeUrl(link);
          if (!discovered.has(normalized) && discovered.size < maxPages) {
            discovered.add(normalized);
            if (depth + 1 <= maxDepth) {
              queue.push({ url: normalized, depth: depth + 1 });
            }
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
    } catch (e) {
      logger.warn('crawler_page_error', { url, error: e.message });
    }
  }

  return [...discovered];
}

/**
 * Extract all href links from HTML using regex.
 *
 * @param {string} html - HTML content
 * @param {string} baseUrl - Base URL for resolving relative links
 * @returns {string[]}
 */
function extractLinks(html, baseUrl) {
  const links = [];
  const hrefRegex = /<a\s[^>]*href\s*=\s*["']([^"'#]*?)["'][^>]*>/gi;
  let match;

  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1].trim();
    if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      continue;
    }

    try {
      const resolved = new URL(href, baseUrl).href;
      links.push(resolved);
    } catch (e) {
      // Invalid URL, skip
    }
  }

  return links;
}

/**
 * Normalize a URL by removing fragments, trailing slashes, and lowercasing the hostname.
 *
 * @param {string} urlString - URL to normalize
 * @returns {string}
 */
function normalizeUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    parsed.hash = '';
    // Remove trailing slash except for root
    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${pathname}${parsed.search}`;
  } catch (e) {
    return urlString;
  }
}

// ── HTML Metadata Extraction ───────────────────────────────────

/**
 * Extract comprehensive metadata from an HTML page using regex.
 * Ported from old-seo-blog-checker/lib/metadata-extractor.ts but
 * adapted for Node.js (regex-only, no DOMParser).
 *
 * @param {string} html - Full HTML content
 * @param {string} url - URL of the page (for classifying internal/external links)
 * @returns {object} Extracted metadata
 */
function extractMetadata(html, url) {
  const pageUrl = new URL(url);
  const domain = pageUrl.hostname;

  // Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? stripTags(titleMatch[1]).trim() : null;

  // Meta description
  const metaDescMatch = html.match(/<meta\s[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["']([\s\S]*?)["'][^>]*>/i)
    || html.match(/<meta\s[^>]*content\s*=\s*["']([\s\S]*?)["'][^>]*name\s*=\s*["']description["'][^>]*>/i);
  const meta_description = metaDescMatch ? decodeHtmlEntities(metaDescMatch[1]).trim() : null;

  // H1
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1_text = h1Match ? stripTags(h1Match[1]).trim() : null;

  // Heading counts and structure
  const headingStructure = [];
  const headingRegex = /<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi;
  let headingMatch;
  let h2_count = 0;
  let h3_count = 0;
  while ((headingMatch = headingRegex.exec(html)) !== null) {
    const level = parseInt(headingMatch[1].charAt(1), 10);
    const text = stripTags(headingMatch[2]).trim();
    headingStructure.push({ level, text });
    if (level === 2) h2_count++;
    if (level === 3) h3_count++;
  }

  // Author
  const authorMatch = html.match(/<meta\s[^>]*name\s*=\s*["']author["'][^>]*content\s*=\s*["']([\s\S]*?)["'][^>]*>/i)
    || html.match(/<meta\s[^>]*content\s*=\s*["']([\s\S]*?)["'][^>]*name\s*=\s*["']author["'][^>]*>/i);
  const author = authorMatch ? decodeHtmlEntities(authorMatch[1]).trim() : null;

  // Publish date (article:published_time or datePublished in schema)
  const publishDateMatch = html.match(/<meta\s[^>]*(?:property|name)\s*=\s*["']article:published_time["'][^>]*content\s*=\s*["']([^"']+)["'][^>]*>/i)
    || html.match(/<meta\s[^>]*content\s*=\s*["']([^"']+)["'][^>]*(?:property|name)\s*=\s*["']article:published_time["'][^>]*>/i)
    || html.match(/"datePublished"\s*:\s*"([^"]+)"/i);
  const publish_date = publishDateMatch ? parseDate(publishDateMatch[1]) : null;

  // Modified date
  const modifiedDateMatch = html.match(/<meta\s[^>]*(?:property|name)\s*=\s*["']article:modified_time["'][^>]*content\s*=\s*["']([^"']+)["'][^>]*>/i)
    || html.match(/<meta\s[^>]*content\s*=\s*["']([^"']+)["'][^>]*(?:property|name)\s*=\s*["']article:modified_time["'][^>]*>/i)
    || html.match(/"dateModified"\s*:\s*"([^"]+)"/i);
  const modified_date = modifiedDateMatch ? parseDate(modifiedDateMatch[1]) : null;

  // Language
  const langMatch = html.match(/<html[^>]*\slang\s*=\s*["']([^"']+)["'][^>]*>/i);
  const language = langMatch ? langMatch[1].trim().substring(0, 10) : 'en';

  // Canonical URL
  const canonicalMatch = html.match(/<link\s[^>]*rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']+)["'][^>]*>/i)
    || html.match(/<link\s[^>]*href\s*=\s*["']([^"']+)["'][^>]*rel\s*=\s*["']canonical["'][^>]*>/i);
  const canonical_url = canonicalMatch ? canonicalMatch[1].trim() : null;

  // Links (internal vs external)
  const allLinks = extractLinks(html, url);
  let internal_link_count = 0;
  let external_link_count = 0;
  for (const link of allLinks) {
    try {
      const linkHost = new URL(link).hostname;
      if (linkHost === domain) {
        internal_link_count++;
      } else {
        external_link_count++;
      }
    } catch (e) {
      // Invalid URL
    }
  }

  // Images
  const imgRegex = /<img\s[^>]*>/gi;
  const images = [];
  let imgMatch;
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    images.push(imgMatch[0]);
  }
  const image_count = images.length;
  const images_with_alt_count = images.filter(img => /alt\s*=\s*["'][^"']+["']/i.test(img)).length;

  // Schema types (JSON-LD)
  const schemaTypes = [];
  const schemaRegex = /<script\s[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let schemaMatch;
  while ((schemaMatch = schemaRegex.exec(html)) !== null) {
    try {
      const schemaData = JSON.parse(schemaMatch[1]);
      if (schemaData['@type']) {
        const types = Array.isArray(schemaData['@type']) ? schemaData['@type'] : [schemaData['@type']];
        schemaTypes.push(...types);
      }
      // Handle @graph arrays
      if (schemaData['@graph'] && Array.isArray(schemaData['@graph'])) {
        for (const item of schemaData['@graph']) {
          if (item['@type']) {
            const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
            schemaTypes.push(...types);
          }
        }
      }
    } catch (e) {
      // Invalid JSON-LD, skip
    }
  }

  // Body text extraction (for word count and content hash)
  const bodyText = extractBodyText(html);
  const word_count = countWords(bodyText, language);

  // Content hash (SHA-256 of body text)
  const content_hash = crypto.createHash('sha256').update(bodyText).digest('hex');

  return {
    title,
    meta_description,
    h1_text,
    h2_count,
    h3_count,
    heading_structure: headingStructure,
    author,
    publish_date,
    modified_date,
    language,
    canonical_url,
    internal_link_count,
    external_link_count,
    image_count,
    images_with_alt_count,
    schema_types: [...new Set(schemaTypes)],
    word_count,
    content_hash,
    body_text: bodyText
  };
}

/**
 * Extract main body text from HTML, stripping tags and focusing on
 * article/main/[role=main] content areas.
 *
 * Ported from old metadata-extractor.ts extractMainContent() but using regex.
 *
 * @param {string} html - Full HTML content
 * @returns {string}
 */
function extractBodyText(html) {
  let content = html;

  // Try to extract from main content areas (priority order)
  const contentSelectors = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<[^>]*role\s*=\s*["']main["'][^>]*>([\s\S]*?)<\/[^>]+>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i
  ];

  for (const regex of contentSelectors) {
    const match = content.match(regex);
    if (match) {
      content = match[1];
      break;
    }
  }

  // If no main content area found, use body
  if (content === html) {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      content = bodyMatch[1];
    }
  }

  // Remove unwanted elements
  const unwantedPatterns = [
    /<script[\s\S]*?<\/script>/gi,
    /<style[\s\S]*?<\/style>/gi,
    /<noscript[\s\S]*?<\/noscript>/gi,
    /<iframe[\s\S]*?<\/iframe>/gi,
    /<nav[\s\S]*?<\/nav>/gi,
    /<header[\s\S]*?<\/header>/gi,
    /<footer[\s\S]*?<\/footer>/gi
  ];

  for (const pattern of unwantedPatterns) {
    content = content.replace(pattern, ' ');
  }

  // Strip all remaining HTML tags
  content = stripTags(content);

  // Clean whitespace
  content = content
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  return content;
}

/**
 * Strip HTML tags from a string.
 */
function stripTags(str) {
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Count words in text, Unicode-aware for Arabic and other scripts.
 *
 * @param {string} text - Text to count
 * @param {string} language - Language code
 * @returns {number}
 */
function countWords(text, language = 'en') {
  if (!text || !text.trim()) return 0;

  // For Arabic and similar scripts, also split on Unicode word boundaries
  // Arabic words are separated by spaces but also contain different characters
  const cleaned = text.trim();

  // Use a Unicode-aware split: split on whitespace and filter empty strings
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  return words.length;
}

/**
 * Parse a date string into YYYY-MM-DD format, or null if invalid.
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return null;
  }
}

// ── Status Classification ──────────────────────────────────────

/**
 * Classify page status based on extracted metadata and HTTP response.
 *
 * @param {object} metadata - Extracted metadata
 * @param {number} httpStatus - HTTP status code
 * @param {string|null} redirectUrl - Redirect destination if applicable
 * @returns {string} Status: ok|thin|old|no_meta|redirect|removed|error
 */
function classifyStatus(metadata, httpStatus, redirectUrl = null) {
  // HTTP-level classification
  if (httpStatus >= 500) return 'error';
  if (httpStatus === 404 || httpStatus === 410) return 'removed';
  if (httpStatus >= 300 && httpStatus < 400) return 'redirect';

  // Content-level classification
  if (!metadata.title && !metadata.meta_description) return 'no_meta';
  if (metadata.word_count < 200) return 'thin';

  // Old content: published more than 18 months ago with no recent modification
  if (metadata.publish_date) {
    const published = new Date(metadata.publish_date);
    const eighteenMonthsAgo = new Date();
    eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18);
    if (published < eighteenMonthsAgo) {
      // Check if modified recently
      if (!metadata.modified_date) return 'old';
      const modified = new Date(metadata.modified_date);
      if (modified < eighteenMonthsAgo) return 'old';
    }
  }

  return 'ok';
}

// ── Fetch with Timeout ─────────────────────────────────────────

/**
 * Fetch with a timeout and redirect handling.
 *
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      redirect: 'follow'
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Crawl Session Management ───────────────────────────────────

/**
 * Create a new crawl session in the database.
 */
async function createCrawlSession(userId, siteUrl, discoveryMethod, maxPages) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  const session = {
    user_id: userId,
    site_url: siteUrl,
    status: 'running',
    discovery_method: discoveryMethod,
    urls_discovered: 0,
    urls_crawled: 0,
    urls_errored: 0,
    max_pages: maxPages
  };

  const res = await fetch(
    `${config.url}/rest/v1/crawl_sessions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(session)
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error('Failed to create crawl session: ' + (errBody.message || res.statusText));
  }

  const rows = await res.json();
  return rows[0];
}

/**
 * Update a crawl session's status and counters.
 */
async function updateCrawlSession(sessionId, updates) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  await fetch(
    `${config.url}/rest/v1/crawl_sessions?id=eq.${encodeURIComponent(sessionId)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(updates)
    }
  );
}

/**
 * Check if user has a running crawl session.
 */
async function hasRunningCrawl(userId) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  const res = await fetch(
    `${config.url}/rest/v1/crawl_sessions?user_id=eq.${encodeURIComponent(userId)}&status=eq.running&select=id`,
    {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey
      }
    }
  );

  if (!res.ok) return false;
  const rows = await res.json();
  return rows && rows.length > 0;
}

/**
 * Get a crawl session by ID (owned by userId).
 */
async function getCrawlSession(userId, sessionId) {
  const { config, serviceRoleKey } = getSupabaseAdmin();

  const res = await fetch(
    `${config.url}/rest/v1/crawl_sessions?id=eq.${encodeURIComponent(sessionId)}&user_id=eq.${encodeURIComponent(userId)}&select=*`,
    {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey
      }
    }
  );

  if (!res.ok) return null;
  const rows = await res.json();
  return rows && rows.length > 0 ? rows[0] : null;
}

// ── Content Inventory Upsert ───────────────────────────────────

/**
 * Upsert a batch of content inventory records.
 */
async function upsertInventoryBatch(records) {
  if (!records || records.length === 0) return { inserted: 0, errors: 0 };

  const { config, serviceRoleKey } = getSupabaseAdmin();
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < records.length; i += UPSERT_BATCH_SIZE) {
    const batch = records.slice(i, i + UPSERT_BATCH_SIZE);

    try {
      const res = await fetch(
        `${config.url}/rest/v1/content_inventory?on_conflict=user_id,url`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': 'Bearer ' + serviceRoleKey,
            'Prefer': 'resolution=merge-duplicates,return=minimal'
          },
          body: JSON.stringify(batch)
        }
      );

      if (res.ok) {
        inserted += batch.length;
      } else {
        const errBody = await res.json().catch(() => ({}));
        logger.error('crawler_upsert_batch_failed', {
          batchStart: i,
          batchSize: batch.length,
          error: errBody.message || res.statusText
        });
        errors += batch.length;
      }
    } catch (e) {
      logger.error('crawler_upsert_batch_error', {
        batchStart: i,
        batchSize: batch.length,
        error: e.message
      });
      errors += batch.length;
    }
  }

  return { inserted, errors };
}

// ── Main Crawl Orchestrator ────────────────────────────────────

/**
 * Run a full content crawl for a site.
 *
 * 1. Check for running crawl (max 1 concurrent per user)
 * 2. Create crawl session
 * 3. Fetch robots.txt
 * 4. Discover URLs (sitemap first, then crawling as fallback)
 * 5. Crawl each URL, extract metadata
 * 6. Upsert to content_inventory
 * 7. Update crawl session status
 *
 * @param {string} userId - User UUID
 * @param {string} siteUrl - Site base URL
 * @param {object} options - { maxPages, maxDepth, discoveryMethod }
 * @returns {Promise<object>} Crawl result summary
 */
async function runCrawl(userId, siteUrl, options = {}) {
  const maxPages = options.maxPages || DEFAULT_MAX_PAGES;
  const maxDepth = options.maxDepth || DEFAULT_MAX_DEPTH;
  const preferredMethod = options.discoveryMethod || 'sitemap';

  // Validate URL
  const urlCheck = validateUrl(siteUrl);
  if (!urlCheck.valid) {
    throw new Error('Invalid site URL: ' + urlCheck.reason);
  }

  // Check for concurrent crawl
  const running = await hasRunningCrawl(userId);
  if (running) {
    throw new CrawlerError('A crawl is already running. Please wait for it to complete.', 409);
  }

  logger.info('crawler_start', { userId, siteUrl, maxPages, maxDepth, preferredMethod });

  // Create crawl session
  const session = await createCrawlSession(userId, siteUrl, preferredMethod, maxPages);
  const sessionId = session.id;

  try {
    // Fetch and parse robots.txt
    let robotsRules = { disallowed: [], crawlDelay: null, sitemaps: [] };
    try {
      const robotsUrl = siteUrl.replace(/\/+$/, '') + '/robots.txt';
      const robotsRes = await fetchWithTimeout(robotsUrl, {
        headers: { 'User-Agent': USER_AGENT }
      });
      if (robotsRes.ok) {
        const robotsTxt = await robotsRes.text();
        robotsRules = parseRobotsTxt(robotsTxt, '*');
      }
    } catch (e) {
      logger.info('crawler_robots_unavailable', { siteUrl, error: e.message });
    }

    // Rate limit: respect crawl-delay if specified (minimum our rate limit)
    const crawlDelayMs = robotsRules.crawlDelay
      ? Math.max(robotsRules.crawlDelay * 1000, RATE_LIMIT_MS)
      : RATE_LIMIT_MS;

    // Discover URLs
    let urls = [];
    let discoveryMethod = preferredMethod;

    if (preferredMethod === 'sitemap') {
      urls = await discoverFromSitemap(siteUrl);
      if (urls.length === 0) {
        logger.info('crawler_sitemap_empty_fallback', { siteUrl });
        urls = await discoverFromCrawling(siteUrl, maxDepth, maxPages);
        discoveryMethod = 'homepage_crawl';
      }
    } else {
      urls = await discoverFromCrawling(siteUrl, maxDepth, maxPages);
      discoveryMethod = 'homepage_crawl';
    }

    // Limit to maxPages
    if (urls.length > maxPages) {
      urls = urls.slice(0, maxPages);
    }

    await updateCrawlSession(sessionId, {
      urls_discovered: urls.length,
      discovery_method: discoveryMethod
    });

    logger.info('crawler_urls_discovered', { sessionId, count: urls.length, method: discoveryMethod });

    // Crawl each URL
    let crawled = 0;
    let errored = 0;
    const inventoryRecords = [];

    for (const url of urls) {
      // Check robots.txt
      try {
        const urlPath = new URL(url).pathname;
        if (isDisallowed(urlPath, robotsRules.disallowed)) {
          logger.info('crawler_robots_blocked', { url });
          continue;
        }
      } catch (e) {
        continue;
      }

      // Rate limit
      await sleep(crawlDelayMs);

      try {
        const res = await fetchWithTimeout(url, {
          headers: { 'User-Agent': USER_AGENT },
          redirect: 'manual' // Handle redirects manually for tracking
        });

        const httpStatus = res.status;
        let redirectUrl = null;
        let metadata = {};
        let bodyText = '';

        if (httpStatus >= 300 && httpStatus < 400) {
          redirectUrl = res.headers.get('location');
          metadata = {
            title: null,
            meta_description: null,
            h1_text: null,
            h2_count: 0,
            h3_count: 0,
            heading_structure: [],
            author: null,
            publish_date: null,
            modified_date: null,
            language: 'en',
            canonical_url: null,
            internal_link_count: 0,
            external_link_count: 0,
            image_count: 0,
            images_with_alt_count: 0,
            schema_types: [],
            word_count: 0,
            content_hash: null
          };
        } else if (httpStatus >= 200 && httpStatus < 300) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('text/html')) {
            const html = await res.text();
            metadata = extractMetadata(html, url);
            bodyText = metadata.body_text || '';
          } else {
            // Non-HTML content
            metadata = {
              title: null,
              meta_description: null,
              h1_text: null,
              h2_count: 0,
              h3_count: 0,
              heading_structure: [],
              author: null,
              publish_date: null,
              modified_date: null,
              language: 'en',
              canonical_url: null,
              internal_link_count: 0,
              external_link_count: 0,
              image_count: 0,
              images_with_alt_count: 0,
              schema_types: [],
              word_count: 0,
              content_hash: null
            };
          }
        } else {
          // 4xx/5xx
          metadata = {
            title: null,
            meta_description: null,
            h1_text: null,
            h2_count: 0,
            h3_count: 0,
            heading_structure: [],
            author: null,
            publish_date: null,
            modified_date: null,
            language: 'en',
            canonical_url: null,
            internal_link_count: 0,
            external_link_count: 0,
            image_count: 0,
            images_with_alt_count: 0,
            schema_types: [],
            word_count: 0,
            content_hash: null
          };
        }

        const status = classifyStatus(metadata, httpStatus, redirectUrl);

        inventoryRecords.push({
          user_id: userId,
          url,
          canonical_url: metadata.canonical_url,
          title: metadata.title,
          meta_description: metadata.meta_description,
          word_count: metadata.word_count,
          h1_text: metadata.h1_text,
          h2_count: metadata.h2_count,
          h3_count: metadata.h3_count,
          heading_structure: metadata.heading_structure,
          author: metadata.author,
          publish_date: metadata.publish_date,
          modified_date: metadata.modified_date,
          language: metadata.language,
          internal_link_count: metadata.internal_link_count,
          external_link_count: metadata.external_link_count,
          image_count: metadata.image_count,
          images_with_alt_count: metadata.images_with_alt_count,
          schema_types: metadata.schema_types,
          content_hash: metadata.content_hash,
          status,
          http_status: httpStatus,
          redirect_url: redirectUrl,
          crawl_session_id: sessionId,
          last_crawled_at: new Date().toISOString()
        });

        crawled++;

        // Periodic batch upsert (every 100 URLs)
        if (inventoryRecords.length >= 100) {
          await upsertInventoryBatch(inventoryRecords);
          inventoryRecords.length = 0; // clear array
          await updateCrawlSession(sessionId, {
            urls_crawled: crawled,
            urls_errored: errored
          });
        }
      } catch (e) {
        errored++;
        logger.warn('crawler_url_error', { url, error: e.message });
      }
    }

    // Final batch upsert
    if (inventoryRecords.length > 0) {
      await upsertInventoryBatch(inventoryRecords);
    }

    // Complete the session
    await updateCrawlSession(sessionId, {
      status: 'completed',
      urls_crawled: crawled,
      urls_errored: errored,
      completed_at: new Date().toISOString()
    });

    logger.info('crawler_complete', {
      sessionId,
      userId,
      urlsDiscovered: urls.length,
      urlsCrawled: crawled,
      urlsErrored: errored
    });

    return {
      sessionId,
      urlsDiscovered: urls.length,
      urlsCrawled: crawled,
      urlsErrored: errored,
      status: 'completed'
    };

  } catch (e) {
    // Mark session as errored
    await updateCrawlSession(sessionId, {
      status: 'error',
      error_log: [{ message: e.message, timestamp: new Date().toISOString() }],
      completed_at: new Date().toISOString()
    }).catch(() => {});

    throw e;
  }
}

// ── Custom Error ───────────────────────────────────────────────

class CrawlerError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'CrawlerError';
    this.statusCode = statusCode;
  }
}

// ── Endpoint Handlers ──────────────────────────────────────────

/**
 * Handle POST /api/ingestion/crawl
 *
 * Triggers a content crawl for the user's site.
 *
 * @param {string} userId - Authenticated user ID
 * @param {object} body - { siteUrl, maxPages?, maxDepth?, discoveryMethod? }
 * @returns {Promise<object>}
 */
async function handleTrigger(userId, body = {}) {
  const { siteUrl, maxPages, maxDepth, discoveryMethod } = body;

  if (!siteUrl) {
    return { success: false, error: 'siteUrl is required', statusCode: 400 };
  }

  // Validate URL
  const urlCheck = validateUrl(siteUrl);
  if (!urlCheck.valid) {
    return { success: false, error: urlCheck.reason, statusCode: 400 };
  }

  // Check for running crawl
  const running = await hasRunningCrawl(userId);
  if (running) {
    return {
      success: false,
      error: 'A crawl is already running. Please wait for it to complete.',
      statusCode: 409
    };
  }

  logger.info('crawler_trigger', { userId, siteUrl, maxPages, maxDepth, discoveryMethod });

  // Fire-and-forget — don't block the HTTP response
  const crawlPromise = runCrawl(userId, siteUrl, { maxPages, maxDepth, discoveryMethod });

  crawlPromise.catch(e => {
    logger.error('crawler_run_failed', { userId, siteUrl, error: e.message });
  });

  // Return session info (wait briefly for session creation)
  // The session is created at the start of runCrawl, but since it's fire-and-forget,
  // we create a preliminary response
  return {
    success: true,
    data: {
      siteUrl,
      status: 'started',
      maxPages: maxPages || DEFAULT_MAX_PAGES,
      discoveryMethod: discoveryMethod || 'sitemap',
      message: 'Content crawl started. Use the status endpoint to monitor progress.'
    }
  };
}

/**
 * Handle GET /api/ingestion/crawl/status/:sessionId
 *
 * Returns the current crawl session status.
 *
 * @param {string} userId - Authenticated user ID
 * @param {string} sessionId - Crawl session UUID
 * @returns {Promise<object>}
 */
async function handleStatus(userId, sessionId) {
  if (!sessionId) {
    return { success: false, error: 'sessionId is required', statusCode: 400 };
  }

  const session = await getCrawlSession(userId, sessionId);

  if (!session) {
    return { success: false, error: 'Crawl session not found', statusCode: 404 };
  }

  return {
    success: true,
    data: {
      id: session.id,
      siteUrl: session.site_url,
      status: session.status,
      discoveryMethod: session.discovery_method,
      urlsDiscovered: session.urls_discovered,
      urlsCrawled: session.urls_crawled,
      urlsErrored: session.urls_errored,
      maxPages: session.max_pages,
      startedAt: session.started_at,
      completedAt: session.completed_at,
      errorLog: session.error_log
    }
  };
}

// ── Exports ────────────────────────────────────────────────────

module.exports = {
  handleTrigger,
  handleStatus,
  // Exported for testing
  validateUrl,
  parseRobotsTxt,
  isDisallowed,
  discoverFromSitemap,
  discoverFromCrawling,
  extractMetadata,
  extractBodyText,
  extractLinks,
  stripTags,
  countWords,
  parseDate,
  classifyStatus,
  normalizeUrl,
  parseSitemapLocs,
  parseSitemapIndex,
  decodeHtmlEntities,
  runCrawl,
  CrawlerError,
  createCrawlSession,
  updateCrawlSession,
  hasRunningCrawl,
  getCrawlSession,
  upsertInventoryBatch,
  fetchSitemap,
  fetchWithTimeout,
  sleep,
  // Constants
  RETRY_DELAYS,
  UPSERT_BATCH_SIZE,
  DEFAULT_MAX_PAGES,
  DEFAULT_MAX_DEPTH,
  RATE_LIMIT_MS,
  USER_AGENT
};
