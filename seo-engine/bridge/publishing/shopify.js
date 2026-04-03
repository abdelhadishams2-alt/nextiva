/**
 * Shopify Blog API Publishing Adapter
 *
 * Publishes articles to Shopify blogs via the Admin REST API.
 * Handles blog selection, SEO metafields, image embedding,
 * product-link injection, and Liquid-safe HTML sanitization.
 *
 * Zero npm dependencies — native fetch only.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../logger');
const { decrypt } = require('../key-manager');

// ── Constants ────────────────────────────────────────────────────────────────

const API_VERSION = '2024-01';
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;
const MAX_TITLE_TAG = 70;
const MAX_DESC_TAG = 320;

// Tags that are safe in Shopify Liquid templates
const SAFE_TAGS = new Set([
  'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'a', 'strong', 'em', 'b', 'i', 'u', 's', 'sub', 'sup', 'small', 'mark', 'abbr',
  'blockquote', 'pre', 'code',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  'img', 'figure', 'figcaption', 'picture', 'source', 'video', 'audio',
  'div', 'span', 'section', 'article', 'aside', 'details', 'summary',
  'iframe'
]);

const SAFE_ATTRS = new Set([
  'href', 'src', 'alt', 'title', 'width', 'height', 'class', 'id', 'style',
  'target', 'rel', 'colspan', 'rowspan', 'loading', 'decoding',
  'type', 'media', 'srcset', 'sizes', 'controls', 'autoplay', 'loop', 'muted',
  'allow', 'allowfullscreen', 'frameborder', 'sandbox'
]);

// ── HTML Sanitization ────────────────────────────────────────────────────────

/**
 * Sanitize HTML to be Liquid-safe for Shopify.
 * Strips <script>, <style>, event handlers, and unsafe tags.
 *
 * @param {string} html - Raw article HTML
 * @returns {string} Sanitized HTML
 */
function sanitizeForShopify(html) {
  if (!html || typeof html !== 'string') return '';

  let clean = html;

  // Remove script tags and contents
  clean = clean.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

  // Remove style tags and contents
  clean = clean.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

  // Remove HTML comments
  clean = clean.replace(/<!--[\s\S]*?-->/g, '');

  // Remove event handler attributes (onclick, onerror, onload, etc.)
  clean = clean.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  clean = clean.replace(/\s+on\w+\s*=\s*\S+/gi, '');

  // Remove javascript: protocol in href/src
  clean = clean.replace(/(href|src)\s*=\s*["']javascript:[^"']*["']/gi, '$1=""');

  // Remove Liquid tags that could be injected ({% %} and {{ }})
  clean = clean.replace(/\{%[\s\S]*?%\}/g, '');
  clean = clean.replace(/\{\{[\s\S]*?\}\}/g, '');

  // Strip unsafe tags but keep their content
  clean = clean.replace(/<\/?(\w+)([^>]*)>/g, (match, tag, attrs) => {
    const lower = tag.toLowerCase();
    if (!SAFE_TAGS.has(lower)) return '';

    // For allowed tags, filter attributes
    if (attrs) {
      const filteredAttrs = filterAttributes(attrs);
      if (match.startsWith('</')) return `</${lower}>`;
      const selfClosing = match.endsWith('/>') ? ' /' : '';
      return `<${lower}${filteredAttrs}${selfClosing}>`;
    }
    return match;
  });

  return clean.trim();
}

/**
 * Filter HTML attributes to only safe ones.
 * @param {string} attrString
 * @returns {string}
 */
function filterAttributes(attrString) {
  const result = [];
  const re = /(\w[\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g;
  let m;
  while ((m = re.exec(attrString)) !== null) {
    const name = m[1].toLowerCase();
    const value = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : m[4]);
    if (SAFE_ATTRS.has(name)) {
      result.push(` ${name}="${escapeAttr(value)}"`);
    }
  }
  return result.join('');
}

/**
 * Escape attribute value.
 * @param {string} val
 * @returns {string}
 */
function escapeAttr(val) {
  return val
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Product Awareness ────────────────────────────────────────────────────────

/**
 * Detect product mentions in HTML and inject product links.
 *
 * @param {string} html - Article HTML
 * @param {Array<{title: string, handle: string, url: string}>} products - Known products
 * @returns {string} HTML with product links injected
 */
function injectProductLinks(html, products) {
  if (!html || !products || products.length === 0) return html;

  let result = html;

  for (const product of products) {
    if (!product.title || !product.url) continue;

    // Escape special regex characters in product title
    const escaped = product.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Match product name only when NOT already inside an <a> tag
    // Negative lookbehind for <a...> and negative lookahead for </a>
    // Simple approach: match the text and check surrounding context
    const re = new RegExp(
      `(?<![">])\\b(${escaped})\\b(?![^<]*<\\/a>)`,
      'gi'
    );

    // Only replace the first occurrence to avoid over-linking
    let replaced = false;
    result = result.replace(re, (match) => {
      if (replaced) return match;
      replaced = true;
      const handle = product.handle || product.title.toLowerCase().replace(/\s+/g, '-');
      return `<a href="${escapeAttr(product.url)}" data-product-handle="${escapeAttr(handle)}" class="product-link">${match}</a>`;
    });
  }

  return result;
}

// ── Shopify API Client ───────────────────────────────────────────────────────

/**
 * Make a Shopify Admin API request with retry logic.
 *
 * @param {string} shopDomain - e.g. "mystore.myshopify.com"
 * @param {string} accessToken - Shopify Admin API access token
 * @param {string} method - HTTP method
 * @param {string} endpoint - API path (e.g. "/blogs.json")
 * @param {object} [body] - Request body
 * @param {number} [attempt=0] - Current retry attempt
 * @returns {Promise<{status: number, data: object, headers: object}>}
 */
async function shopifyRequest(shopDomain, accessToken, method, endpoint, body = null, attempt = 0) {
  const url = `https://${shopDomain}/admin/api/${API_VERSION}${endpoint}`;

  const headers = {
    'X-Shopify-Access-Token': accessToken,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const fetchOpts = { method, headers };
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    fetchOpts.body = JSON.stringify(body);
  }

  logger.info('shopify_api_request', {
    method,
    endpoint,
    attempt,
    shopDomain
  });

  let response;
  try {
    response = await fetch(url, fetchOpts);
  } catch (err) {
    // Network error — retry if possible
    if (attempt < MAX_RETRIES) {
      const delay = RETRY_BASE_MS * Math.pow(2, attempt);
      logger.warn('shopify_api_network_error', { endpoint, attempt, error: err.message, retryInMs: delay });
      await sleep(delay);
      return shopifyRequest(shopDomain, accessToken, method, endpoint, body, attempt + 1);
    }
    throw new Error(`Shopify API network error after ${MAX_RETRIES} retries: ${err.message}`);
  }

  // Handle rate limiting (429)
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '2', 10);
    const delay = retryAfter * 1000;
    if (attempt < MAX_RETRIES) {
      logger.warn('shopify_api_rate_limited', { endpoint, attempt, retryAfterSec: retryAfter });
      await sleep(delay);
      return shopifyRequest(shopDomain, accessToken, method, endpoint, body, attempt + 1);
    }
    throw new Error(`Shopify API rate limited after ${MAX_RETRIES} retries`);
  }

  // Handle 5xx server errors — retry
  if (response.status >= 500 && attempt < MAX_RETRIES) {
    const delay = RETRY_BASE_MS * Math.pow(2, attempt);
    logger.warn('shopify_api_server_error', { endpoint, attempt, status: response.status, retryInMs: delay });
    await sleep(delay);
    return shopifyRequest(shopDomain, accessToken, method, endpoint, body, attempt + 1);
  }

  const data = await response.json().catch(() => ({}));

  const responseHeaders = {};
  for (const [k, v] of response.headers) {
    responseHeaders[k] = v;
  }

  return { status: response.status, data, headers: responseHeaders };
}

/**
 * Sleep helper.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Blog Management ──────────────────────────────────────────────────────────

/**
 * List all blogs on the Shopify store.
 *
 * @param {string} shopDomain
 * @param {string} accessToken
 * @returns {Promise<Array<{id: number, title: string, handle: string}>>}
 */
async function listBlogs(shopDomain, accessToken) {
  const { status, data } = await shopifyRequest(shopDomain, accessToken, 'GET', '/blogs.json');

  if (status !== 200) {
    throw new Error(`Failed to list blogs: ${status} - ${JSON.stringify(data.errors || data)}`);
  }

  return (data.blogs || []).map(b => ({
    id: b.id,
    title: b.title,
    handle: b.handle,
    commentable: b.commentable,
    tags: b.tags
  }));
}

/**
 * Get or resolve the target blog ID.
 * If blogId is provided, validate it exists. Otherwise return the first blog (default).
 *
 * @param {string} shopDomain
 * @param {string} accessToken
 * @param {number|null} blogId - Specific blog ID or null for default
 * @returns {Promise<{id: number, title: string, handle: string}>}
 */
async function resolveBlogId(shopDomain, accessToken, blogId = null) {
  const blogs = await listBlogs(shopDomain, accessToken);

  if (blogs.length === 0) {
    throw new Error('No blogs found on this Shopify store. Create a blog first.');
  }

  if (blogId) {
    const match = blogs.find(b => b.id === blogId);
    if (!match) {
      throw new Error(`Blog ID ${blogId} not found. Available blogs: ${blogs.map(b => `${b.id} (${b.title})`).join(', ')}`);
    }
    return match;
  }

  // Return default (first blog, typically "News")
  return blogs[0];
}

// ── Image Handling ───────────────────────────────────────────────────────────

/**
 * Prepare featured image for Shopify article.
 * Shopify accepts image as base64 or src URL.
 *
 * @param {object} featuredImage - Image from payload { src, cdnSrc, alt }
 * @returns {Promise<{src?: string, alt?: string, attachment?: string, filename?: string}>}
 */
async function prepareFeaturedImage(featuredImage) {
  if (!featuredImage) return null;

  const imageUrl = featuredImage.cdnSrc || featuredImage.src;
  if (!imageUrl) return null;

  // If it's already a URL, Shopify can fetch it directly
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return {
      src: imageUrl,
      alt: featuredImage.alt || ''
    };
  }

  // If it's a local file path, read and base64 encode
  try {
    const filePath = imageUrl;
    const data = await fs.promises.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    const filename = path.basename(filePath);

    return {
      attachment: data.toString('base64'),
      filename,
      alt: featuredImage.alt || ''
    };
  } catch (err) {
    logger.warn('shopify_image_read_failed', { src: imageUrl, error: err.message });
    return null;
  }
}

// ── SEO Metafields ───────────────────────────────────────────────────────────

/**
 * Build SEO metafields for a Shopify article.
 *
 * @param {object} seo - SEO data from payload
 * @param {string} title - Article title (fallback)
 * @returns {Array<{namespace: string, key: string, value: string, type: string}>}
 */
function buildSeoMetafields(seo, title) {
  const metafields = [];

  const titleTag = (seo?.title || title || '').slice(0, MAX_TITLE_TAG);
  const descTag = (seo?.description || '').slice(0, MAX_DESC_TAG);

  if (titleTag) {
    metafields.push({
      namespace: 'global',
      key: 'title_tag',
      value: titleTag,
      type: 'single_line_text_field'
    });
  }

  if (descTag) {
    metafields.push({
      namespace: 'global',
      key: 'description_tag',
      value: descTag,
      type: 'single_line_text_field'
    });
  }

  return metafields;
}

// ── Article Creation ─────────────────────────────────────────────────────────

/**
 * Create an article on a Shopify blog.
 *
 * @param {object} options
 * @param {string} options.shopDomain - Shopify store domain
 * @param {string} options.accessToken - Admin API access token
 * @param {object} options.payload - Universal article payload (from payload.js)
 * @param {number|null} [options.blogId] - Target blog ID (null = default blog)
 * @param {Array} [options.products] - Products for link injection [{title, handle, url}]
 * @param {boolean} [options.published=false] - Publish immediately
 * @returns {Promise<{success: boolean, articleId: number, blogId: number, handle: string, url: string, metafields: number}>}
 */
async function createArticle(options) {
  const {
    shopDomain,
    accessToken,
    payload,
    blogId = null,
    products = [],
    published = false
  } = options;

  if (!shopDomain) throw new Error('shopDomain is required');
  if (!accessToken) throw new Error('accessToken is required');
  if (!payload) throw new Error('payload is required');
  if (!payload.title) throw new Error('payload.title is required');
  if (!payload.html) throw new Error('payload.html is required');

  const startTime = Date.now();

  logger.info('shopify_publish_start', {
    shopDomain,
    blogId,
    title: payload.title,
    productCount: products.length
  });

  // 1. Resolve target blog
  const blog = await resolveBlogId(shopDomain, accessToken, blogId);

  // 2. Sanitize HTML for Shopify Liquid
  let bodyHtml = sanitizeForShopify(payload.html);

  // 3. Inject product links if products are provided
  if (products.length > 0) {
    bodyHtml = injectProductLinks(bodyHtml, products);
  }

  // 4. Prepare featured image
  const featuredImage = payload.images?.find(i => i.isFeatured) || payload.images?.[0] || null;
  const image = await prepareFeaturedImage(featuredImage);

  // 5. Build SEO metafields
  const metafields = buildSeoMetafields(payload.seo, payload.title);

  // Add any additional metafields from platform meta
  const shopifyMeta = payload.platformMeta?.shopify;
  if (shopifyMeta?.metafields) {
    for (const mf of shopifyMeta.metafields) {
      // Skip duplicates (same namespace+key)
      if (!metafields.some(m => m.namespace === mf.namespace && m.key === mf.key)) {
        metafields.push(mf);
      }
    }
  }

  // 6. Build the article object
  const articleBody = {
    article: {
      title: payload.title,
      body_html: bodyHtml,
      author: payload.author?.name || 'ChainIQ',
      tags: (payload.tags || []).join(', '),
      published: published,
      summary_html: payload.excerpt || '',
      handle: shopifyMeta?.handle || payload.slug || undefined,
      template_suffix: shopifyMeta?.templateSuffix || undefined,
      metafields: metafields.length > 0 ? metafields : undefined
    }
  };

  // Add image if available
  if (image) {
    articleBody.article.image = image;
  }

  // 7. Create the article via Shopify API
  const { status, data } = await shopifyRequest(
    shopDomain,
    accessToken,
    'POST',
    `/blogs/${blog.id}/articles.json`,
    articleBody
  );

  if (status !== 201 && status !== 200) {
    const errorMsg = data.errors
      ? (typeof data.errors === 'string' ? data.errors : JSON.stringify(data.errors))
      : `HTTP ${status}`;
    logger.error('shopify_publish_failed', {
      shopDomain,
      blogId: blog.id,
      status,
      errors: errorMsg
    });
    throw new Error(`Shopify article creation failed: ${errorMsg}`);
  }

  const createdArticle = data.article;
  if (!createdArticle || !createdArticle.id) {
    throw new Error('Shopify API returned success but no article data');
  }

  const result = {
    success: true,
    articleId: createdArticle.id,
    blogId: blog.id,
    blogTitle: blog.title,
    handle: createdArticle.handle,
    url: `https://${shopDomain}/blogs/${blog.handle}/${createdArticle.handle}`,
    published: createdArticle.published_at !== null,
    metafieldsCount: metafields.length,
    durationMs: Date.now() - startTime
  };

  logger.info('shopify_publish_complete', result);

  return result;
}

// ── Connection Resolver ──────────────────────────────────────────────────────

/**
 * Resolve Shopify credentials from encrypted platform_connections or key-manager.
 *
 * @param {object} keyManager - KeyManager instance
 * @param {string} userId - User ID
 * @returns {Promise<{shopDomain: string, accessToken: string}>}
 */
async function resolveCredentials(keyManager, userId) {
  // Try key-manager first (shopify_domain + shopify_admin_token)
  let shopDomain = null;
  let accessToken = null;

  try {
    shopDomain = await keyManager.getKey('shopify_domain', userId);
  } catch { /* ignore */ }
  if (!shopDomain) {
    try {
      shopDomain = await keyManager.getKey('shopify_domain', 'global');
    } catch { /* ignore */ }
  }

  try {
    accessToken = await keyManager.getKey('shopify_admin_token', userId);
  } catch { /* ignore */ }
  if (!accessToken) {
    try {
      accessToken = await keyManager.getKey('shopify_admin_token', 'global');
    } catch { /* ignore */ }
  }

  if (!shopDomain || !accessToken) {
    throw new Error(
      'Shopify credentials not configured. Store shopify_domain and shopify_admin_token via the API Keys endpoint.'
    );
  }

  // Normalize domain (remove protocol if present)
  shopDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');

  return { shopDomain, accessToken };
}

// ── Status Check ─────────────────────────────────────────────────────────────

/**
 * Check Shopify connection status by making a lightweight API call.
 *
 * @param {string} shopDomain
 * @param {string} accessToken
 * @returns {Promise<{connected: boolean, shopName: string|null, blogCount: number, error: string|null}>}
 */
async function checkStatus(shopDomain, accessToken) {
  try {
    // Quick shop info check
    const { status, data } = await shopifyRequest(shopDomain, accessToken, 'GET', '/shop.json');

    if (status !== 200) {
      return {
        connected: false,
        shopName: null,
        blogCount: 0,
        error: `API returned ${status}: ${JSON.stringify(data.errors || data)}`
      };
    }

    // Also get blog count
    let blogCount = 0;
    try {
      const blogRes = await shopifyRequest(shopDomain, accessToken, 'GET', '/blogs/count.json');
      blogCount = blogRes.data?.count || 0;
    } catch { /* ignore blog count failure */ }

    return {
      connected: true,
      shopName: data.shop?.name || null,
      shopDomain: data.shop?.domain || shopDomain,
      planName: data.shop?.plan_name || null,
      blogCount,
      error: null
    };
  } catch (err) {
    return {
      connected: false,
      shopName: null,
      blogCount: 0,
      error: err.message
    };
  }
}

module.exports = {
  createArticle,
  listBlogs,
  resolveBlogId,
  checkStatus,
  resolveCredentials,
  sanitizeForShopify,
  injectProductLinks,
  buildSeoMetafields,
  prepareFeaturedImage,
  // Exported for testing
  shopifyRequest,
  filterAttributes,
  escapeAttr
};
