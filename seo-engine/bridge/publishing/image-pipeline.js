/**
 * Image CDN Pipeline
 *
 * Extracts images from article HTML, uploads them to the target CMS media
 * library via a generic uploader interface, and replaces original src URLs
 * with CDN/CMS URLs in the HTML.
 *
 * Zero npm dependencies — uses only Node.js built-ins.
 */

'use strict';

const { URL } = require('url');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('../logger');

// ── Image extraction from HTML ──────────────────────────────────────────────

const IMG_RE = /<img\s+[^>]*?src\s*=\s*["']([^"']+)["'][^>]*?>/gi;
const ALT_RE = /alt\s*=\s*["']([^"']*)["']/i;
const WIDTH_RE = /width\s*=\s*["']?(\d+)["']?/i;
const HEIGHT_RE = /height\s*=\s*["']?(\d+)["']?/i;
const CAPTION_RE = /<figcaption[^>]*>(.*?)<\/figcaption>/i;

/**
 * Extract all images from HTML content.
 * @param {string} html - Article HTML
 * @returns {Array<{src: string, alt: string, width: number|null, height: number|null, caption: string|null, index: number}>}
 */
function extractImages(html) {
  if (!html || typeof html !== 'string') return [];

  const images = [];
  let match;
  let idx = 0;

  // Reset lastIndex for global regex
  IMG_RE.lastIndex = 0;

  while ((match = IMG_RE.exec(html)) !== null) {
    const fullTag = match[0];
    const src = match[1];

    // Skip data URIs and empty src
    if (!src || src.startsWith('data:')) continue;

    const altMatch = fullTag.match(ALT_RE);
    const widthMatch = fullTag.match(WIDTH_RE);
    const heightMatch = fullTag.match(HEIGHT_RE);

    // Try to find caption in surrounding <figure> context
    const tagEnd = match.index + fullTag.length;
    const surroundingHtml = html.slice(tagEnd, tagEnd + 500);
    const captionMatch = surroundingHtml.match(CAPTION_RE);

    images.push({
      src,
      alt: altMatch ? altMatch[1] : '',
      width: widthMatch ? parseInt(widthMatch[1], 10) : null,
      height: heightMatch ? parseInt(heightMatch[1], 10) : null,
      caption: captionMatch ? captionMatch[1].replace(/<[^>]+>/g, '').trim() : null,
      index: idx++,
      isFeatured: idx === 1 // First image is featured by default
    });
  }

  return images;
}

// ── Generic uploader interface ──────────────────────────────────────────────

/**
 * @typedef {Object} UploadResult
 * @property {string} cdnUrl - The new CDN/CMS URL for the image
 * @property {string|null} mediaId - CMS media ID (if applicable)
 * @property {number|null} sizeBytes - File size in bytes
 * @property {string|null} mimeType - MIME type
 */

/**
 * @typedef {Object} Uploader
 * @property {function(string, object): Promise<UploadResult>} upload - Upload function
 * @property {string} name - Uploader name for logging
 */

/**
 * Download an image from a URL using native fetch.
 * @param {string} imageUrl - URL to download
 * @param {number} [maxSizeBytes=10485760] - Max file size (default 10MB)
 * @returns {Promise<{buffer: Buffer, mimeType: string, sizeBytes: number}>}
 */
async function downloadImage(imageUrl, maxSizeBytes = 10 * 1024 * 1024) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(imageUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'ChainIQ-ImagePipeline/1.0' }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching image: ${imageUrl}`);
    }

    const contentLength = parseInt(res.headers.get('content-length') || '0', 10);
    if (contentLength > maxSizeBytes) {
      throw new Error(`Image too large: ${contentLength} bytes (max ${maxSizeBytes})`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > maxSizeBytes) {
      throw new Error(`Image too large: ${buffer.length} bytes (max ${maxSizeBytes})`);
    }

    const mimeType = res.headers.get('content-type') || guessMimeType(imageUrl);

    return { buffer, mimeType, sizeBytes: buffer.length };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Guess MIME type from file extension.
 * @param {string} url - Image URL or path
 * @returns {string}
 */
function guessMimeType(url) {
  const ext = path.extname(new URL(url, 'https://placeholder.local').pathname).toLowerCase();
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.avif': 'image/avif',
    '.ico': 'image/x-icon'
  };
  return types[ext] || 'image/jpeg';
}

/**
 * Generate a deterministic filename for caching/dedup.
 * @param {string} src - Original image URL
 * @param {string} [ext] - File extension override
 * @returns {string}
 */
function generateFilename(src, ext) {
  const hash = crypto.createHash('sha256').update(src).digest('hex').slice(0, 16);
  const originalExt = ext || path.extname(new URL(src, 'https://placeholder.local').pathname) || '.jpg';
  return `article-img-${hash}${originalExt}`;
}

// ── Built-in uploaders ──────────────────────────────────────────────────────

/**
 * Create a no-op passthrough uploader (keeps original URLs).
 * @returns {Uploader}
 */
function createPassthroughUploader() {
  return {
    name: 'passthrough',
    async upload(imageUrl) {
      return { cdnUrl: imageUrl, mediaId: null, sizeBytes: null, mimeType: null };
    }
  };
}

/**
 * Create a local filesystem uploader (saves to a directory).
 * @param {string} outputDir - Directory to save images
 * @param {string} publicUrlBase - Base URL prefix for public access
 * @returns {Uploader}
 */
function createLocalUploader(outputDir, publicUrlBase) {
  return {
    name: 'local',
    async upload(imageUrl) {
      const { buffer, mimeType, sizeBytes } = await downloadImage(imageUrl);
      const filename = generateFilename(imageUrl);
      const filePath = path.join(outputDir, filename);

      await fs.promises.mkdir(outputDir, { recursive: true });
      await fs.promises.writeFile(filePath, buffer);

      const publicUrl = publicUrlBase.replace(/\/$/, '') + '/' + filename;
      return { cdnUrl: publicUrl, mediaId: null, sizeBytes, mimeType };
    }
  };
}

/**
 * Create a generic HTTP uploader that POSTs images to a media endpoint.
 * @param {object} options
 * @param {string} options.endpoint - Upload endpoint URL
 * @param {object} [options.headers] - Additional headers (e.g., Authorization)
 * @param {string} [options.fieldName='file'] - Form field name for the file
 * @param {function} [options.parseResponse] - Custom response parser: (json) => { cdnUrl, mediaId }
 * @returns {Uploader}
 */
function createHttpUploader(options) {
  const { endpoint, headers = {}, fieldName = 'file', parseResponse } = options;

  return {
    name: 'http',
    async upload(imageUrl, meta = {}) {
      const { buffer, mimeType, sizeBytes } = await downloadImage(imageUrl);
      const filename = generateFilename(imageUrl);

      // Build multipart form data manually (zero deps)
      const boundary = '----ChainIQ' + crypto.randomBytes(16).toString('hex');
      const parts = [];

      // File part
      parts.push(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\n` +
        `Content-Type: ${mimeType}\r\n\r\n`
      );
      parts.push(buffer);
      parts.push('\r\n');

      // Alt text part
      if (meta.alt) {
        parts.push(
          `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="alt_text"\r\n\r\n` +
          `${meta.alt}\r\n`
        );
      }

      // Caption part
      if (meta.caption) {
        parts.push(
          `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="caption"\r\n\r\n` +
          `${meta.caption}\r\n`
        );
      }

      parts.push(`--${boundary}--\r\n`);

      // Combine parts into a single buffer
      const bodyParts = parts.map(p => typeof p === 'string' ? Buffer.from(p) : p);
      const body = Buffer.concat(bodyParts);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            ...headers,
            'Content-Type': `multipart/form-data; boundary=${boundary}`
          },
          body
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`Upload failed (${res.status}): ${text.slice(0, 200)}`);
        }

        const json = await res.json();

        if (typeof parseResponse === 'function') {
          const parsed = parseResponse(json);
          return { cdnUrl: parsed.cdnUrl, mediaId: parsed.mediaId || null, sizeBytes, mimeType };
        }

        // Default: try common response shapes
        const cdnUrl = json.url || json.source_url || json.link || (json.data && json.data.url) || imageUrl;
        const mediaId = json.id || json.media_id || (json.data && json.data.id) || null;

        return { cdnUrl, mediaId: String(mediaId), sizeBytes, mimeType };
      } finally {
        clearTimeout(timeout);
      }
    }
  };
}

// ── Platform-specific uploader factories ────────────────────────────────────

/**
 * Create a WordPress REST API media uploader.
 * @param {object} options
 * @param {string} options.siteUrl - WordPress site URL
 * @param {string} options.username - Username for Basic Auth or Application Password
 * @param {string} options.password - Application Password
 * @returns {Uploader}
 */
function createWordPressUploader(options) {
  const { siteUrl, username, password } = options;
  const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

  return createHttpUploader({
    endpoint: `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/media`,
    headers: { 'Authorization': `Basic ${basicAuth}` },
    fieldName: 'file',
    parseResponse: (json) => ({
      cdnUrl: json.source_url || json.guid?.rendered || '',
      mediaId: json.id ? String(json.id) : null
    })
  });
}

/**
 * Create a Ghost Admin API media uploader.
 * @param {object} options
 * @param {string} options.apiUrl - Ghost API URL
 * @param {string} options.adminToken - Ghost Admin API token
 * @returns {Uploader}
 */
function createGhostUploader(options) {
  const { apiUrl, adminToken } = options;

  return createHttpUploader({
    endpoint: `${apiUrl.replace(/\/$/, '')}/ghost/api/admin/images/upload/`,
    headers: { 'Authorization': `Ghost ${adminToken}` },
    fieldName: 'file',
    parseResponse: (json) => ({
      cdnUrl: json.images?.[0]?.url || '',
      mediaId: null
    })
  });
}

/**
 * Create a Shopify file upload interface.
 * Note: Shopify uses GraphQL for file uploads; this creates a compatible wrapper.
 * @param {object} options
 * @param {string} options.shopDomain - Shopify shop domain
 * @param {string} options.accessToken - Admin API access token
 * @returns {Uploader}
 */
function createShopifyUploader(options) {
  const { shopDomain, accessToken } = options;

  return {
    name: 'shopify',
    async upload(imageUrl, meta = {}) {
      // Shopify staged uploads require a 2-step process:
      // 1. Create staged upload target
      // 2. Upload to staged target
      // For simplicity, we use the Files API with URL reference
      const graphqlEndpoint = `https://${shopDomain}/admin/api/2024-01/graphql.json`;

      const mutation = `
        mutation fileCreate($files: [FileCreateInput!]!) {
          fileCreate(files: $files) {
            files { id alt preview { image { url } } }
            userErrors { field message }
          }
        }
      `;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      try {
        const res = await fetch(graphqlEndpoint, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken
          },
          body: JSON.stringify({
            query: mutation,
            variables: {
              files: [{
                alt: meta.alt || '',
                contentType: 'IMAGE',
                originalSource: imageUrl
              }]
            }
          })
        });

        if (!res.ok) {
          throw new Error(`Shopify upload failed (${res.status})`);
        }

        const data = await res.json();
        const file = data?.data?.fileCreate?.files?.[0];
        const errors = data?.data?.fileCreate?.userErrors;

        if (errors && errors.length > 0) {
          throw new Error(`Shopify upload errors: ${errors.map(e => e.message).join(', ')}`);
        }

        return {
          cdnUrl: file?.preview?.image?.url || imageUrl,
          mediaId: file?.id || null,
          sizeBytes: null,
          mimeType: null
        };
      } finally {
        clearTimeout(timeout);
      }
    }
  };
}

// ── Pipeline orchestration ──────────────────────────────────────────────────

/**
 * Process all images in article HTML: extract, upload, replace URLs.
 * @param {string} html - Article HTML content
 * @param {Uploader} uploader - Uploader implementation
 * @param {object} [options]
 * @param {number} [options.concurrency=3] - Max parallel uploads
 * @param {boolean} [options.skipOnError=true] - Keep original URL if upload fails
 * @returns {Promise<{html: string, images: Array}>}
 */
async function processImages(html, uploader, options = {}) {
  const { concurrency = 3, skipOnError = true } = options;

  if (!html || typeof html !== 'string') {
    return { html: html || '', images: [] };
  }

  const extracted = extractImages(html);
  if (extracted.length === 0) {
    return { html, images: [] };
  }

  logger.info('image_pipeline_start', {
    uploader: uploader.name,
    imageCount: extracted.length,
    concurrency
  });

  const results = [];
  let processedHtml = html;

  // Process in batches for concurrency control
  for (let i = 0; i < extracted.length; i += concurrency) {
    const batch = extracted.slice(i, i + concurrency);

    const batchResults = await Promise.allSettled(
      batch.map(async (img) => {
        const startTime = Date.now();
        try {
          const result = await uploader.upload(img.src, {
            alt: img.alt,
            caption: img.caption
          });

          logger.info('image_upload_success', {
            uploader: uploader.name,
            originalSrc: img.src.slice(0, 100),
            cdnUrl: result.cdnUrl.slice(0, 100),
            durationMs: Date.now() - startTime
          });

          return {
            ...img,
            cdnSrc: result.cdnUrl,
            mediaId: result.mediaId,
            sizeBytes: result.sizeBytes,
            mimeType: result.mimeType
          };
        } catch (err) {
          logger.warn('image_upload_failed', {
            uploader: uploader.name,
            src: img.src.slice(0, 100),
            error: err.message,
            durationMs: Date.now() - startTime
          });

          if (!skipOnError) throw err;

          return {
            ...img,
            cdnSrc: null,
            mediaId: null,
            sizeBytes: null,
            mimeType: null,
            uploadError: err.message
          };
        }
      })
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }
  }

  // Replace src URLs in HTML for successfully uploaded images
  for (const img of results) {
    if (img.cdnSrc && img.cdnSrc !== img.src) {
      // Escape special regex characters in the original src
      const escaped = img.src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      processedHtml = processedHtml.replace(
        new RegExp(escaped, 'g'),
        img.cdnSrc
      );
    }
  }

  logger.info('image_pipeline_complete', {
    uploader: uploader.name,
    total: extracted.length,
    uploaded: results.filter(r => r.cdnSrc && !r.uploadError).length,
    failed: results.filter(r => r.uploadError).length
  });

  return { html: processedHtml, images: results };
}

module.exports = {
  extractImages,
  downloadImage,
  guessMimeType,
  generateFilename,
  processImages,
  createPassthroughUploader,
  createLocalUploader,
  createHttpUploader,
  createWordPressUploader,
  createGhostUploader,
  createShopifyUploader
};
