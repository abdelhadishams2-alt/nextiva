/**
 * Tests for Shopify Blog Publishing Adapter
 *
 * Uses node:test — zero npm dependencies.
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const {
  sanitizeForShopify,
  injectProductLinks,
  buildSeoMetafields,
  filterAttributes,
  escapeAttr
} = require('../bridge/publishing/shopify');

// ── sanitizeForShopify ───────────────────────────────────────────────────────

describe('sanitizeForShopify', () => {
  it('returns empty string for falsy input', () => {
    assert.equal(sanitizeForShopify(null), '');
    assert.equal(sanitizeForShopify(''), '');
    assert.equal(sanitizeForShopify(undefined), '');
  });

  it('strips script tags and their contents', () => {
    const html = '<p>Hello</p><script>alert("xss")</script><p>World</p>';
    const result = sanitizeForShopify(html);
    assert.ok(!result.includes('<script'));
    assert.ok(!result.includes('alert'));
    assert.ok(result.includes('<p>Hello</p>'));
    assert.ok(result.includes('<p>World</p>'));
  });

  it('strips style tags and their contents', () => {
    const html = '<p>Hello</p><style>.evil { color: red; }</style>';
    const result = sanitizeForShopify(html);
    assert.ok(!result.includes('<style'));
    assert.ok(!result.includes('.evil'));
    assert.ok(result.includes('<p>Hello</p>'));
  });

  it('removes event handler attributes', () => {
    const html = '<img src="test.jpg" onerror="alert(1)" alt="test">';
    const result = sanitizeForShopify(html);
    assert.ok(!result.includes('onerror'));
    assert.ok(!result.includes('alert'));
    assert.ok(result.includes('src'));
  });

  it('removes javascript: protocol in href', () => {
    const html = '<a href="javascript:alert(1)">Click</a>';
    const result = sanitizeForShopify(html);
    assert.ok(!result.includes('javascript:'));
  });

  it('strips Liquid injection tags', () => {
    const html = '<p>{% include "evil" %} and {{ user.password }}</p>';
    const result = sanitizeForShopify(html);
    assert.ok(!result.includes('{%'));
    assert.ok(!result.includes('{{'));
    assert.ok(!result.includes('evil'));
    assert.ok(!result.includes('user.password'));
  });

  it('removes HTML comments', () => {
    const html = '<p>Hello</p><!-- secret comment --><p>World</p>';
    const result = sanitizeForShopify(html);
    assert.ok(!result.includes('<!--'));
    assert.ok(!result.includes('secret'));
  });

  it('preserves safe tags', () => {
    const html = '<h2>Title</h2><p>Paragraph with <strong>bold</strong> and <em>italic</em></p><ul><li>Item</li></ul>';
    const result = sanitizeForShopify(html);
    assert.ok(result.includes('<h2>'));
    assert.ok(result.includes('<p>'));
    assert.ok(result.includes('<strong>'));
    assert.ok(result.includes('<em>'));
    assert.ok(result.includes('<ul>'));
    assert.ok(result.includes('<li>'));
  });

  it('strips unsafe tags like form and input but keeps content', () => {
    const html = '<form action="/hack"><input type="text"><p>Content</p></form>';
    const result = sanitizeForShopify(html);
    assert.ok(!result.includes('<form'));
    assert.ok(!result.includes('<input'));
    assert.ok(result.includes('<p>Content</p>'));
  });

  it('preserves img tags with safe attributes', () => {
    const html = '<img src="https://cdn.example.com/photo.jpg" alt="Photo" width="800" height="600" loading="lazy">';
    const result = sanitizeForShopify(html);
    assert.ok(result.includes('src='));
    assert.ok(result.includes('alt='));
    assert.ok(result.includes('width='));
    assert.ok(result.includes('loading='));
  });

  it('handles multiline script tags', () => {
    const html = `<p>Before</p>
<script type="text/javascript">
  var x = 1;
  document.write(x);
</script>
<p>After</p>`;
    const result = sanitizeForShopify(html);
    assert.ok(!result.includes('<script'));
    assert.ok(!result.includes('document.write'));
    assert.ok(result.includes('<p>Before</p>'));
    assert.ok(result.includes('<p>After</p>'));
  });
});

// ── injectProductLinks ───────────────────────────────────────────────────────

describe('injectProductLinks', () => {
  const products = [
    { title: 'Super Widget', handle: 'super-widget', url: '/products/super-widget' },
    { title: 'Mega Gadget', handle: 'mega-gadget', url: '/products/mega-gadget' }
  ];

  it('returns html unchanged for empty products', () => {
    const html = '<p>Hello world</p>';
    assert.equal(injectProductLinks(html, []), html);
    assert.equal(injectProductLinks(html, null), html);
  });

  it('injects product link for matching text', () => {
    const html = '<p>Check out the Super Widget today!</p>';
    const result = injectProductLinks(html, products);
    assert.ok(result.includes('href="/products/super-widget"'));
    assert.ok(result.includes('data-product-handle="super-widget"'));
    assert.ok(result.includes('class="product-link"'));
  });

  it('only links first occurrence of product mention', () => {
    const html = '<p>Super Widget is great. Super Widget is amazing.</p>';
    const result = injectProductLinks(html, products);
    const linkCount = (result.match(/product-link/g) || []).length;
    assert.equal(linkCount, 1, 'Should only link first occurrence');
  });

  it('handles multiple different products', () => {
    const html = '<p>The Super Widget and Mega Gadget are both great.</p>';
    const result = injectProductLinks(html, products);
    assert.ok(result.includes('/products/super-widget'));
    assert.ok(result.includes('/products/mega-gadget'));
  });

  it('skips products without title or url', () => {
    const html = '<p>Some text</p>';
    const result = injectProductLinks(html, [{ title: '', url: '' }]);
    assert.equal(result, html);
  });

  it('handles null/empty html', () => {
    assert.equal(injectProductLinks(null, products), null);
    assert.equal(injectProductLinks('', products), '');
  });
});

// ── buildSeoMetafields ──────────────────────────────────────────────────────

describe('buildSeoMetafields', () => {
  it('builds title_tag and description_tag metafields', () => {
    const seo = { title: 'My SEO Title', description: 'My description here' };
    const metafields = buildSeoMetafields(seo, 'Fallback Title');

    assert.equal(metafields.length, 2);

    const titleField = metafields.find(m => m.key === 'title_tag');
    assert.ok(titleField);
    assert.equal(titleField.namespace, 'global');
    assert.equal(titleField.value, 'My SEO Title');
    assert.equal(titleField.type, 'single_line_text_field');

    const descField = metafields.find(m => m.key === 'description_tag');
    assert.ok(descField);
    assert.equal(descField.value, 'My description here');
  });

  it('falls back to article title when seo.title is empty', () => {
    const seo = { title: '', description: 'Desc' };
    const metafields = buildSeoMetafields(seo, 'Article Title');
    const titleField = metafields.find(m => m.key === 'title_tag');
    assert.equal(titleField.value, 'Article Title');
  });

  it('truncates title_tag to 70 characters', () => {
    const longTitle = 'A'.repeat(100);
    const seo = { title: longTitle, description: '' };
    const metafields = buildSeoMetafields(seo, '');
    const titleField = metafields.find(m => m.key === 'title_tag');
    assert.equal(titleField.value.length, 70);
  });

  it('truncates description_tag to 320 characters', () => {
    const longDesc = 'B'.repeat(400);
    const seo = { title: 'Title', description: longDesc };
    const metafields = buildSeoMetafields(seo, 'Title');
    const descField = metafields.find(m => m.key === 'description_tag');
    assert.equal(descField.value.length, 320);
  });

  it('omits empty metafields', () => {
    const seo = { title: '', description: '' };
    const metafields = buildSeoMetafields(seo, '');
    assert.equal(metafields.length, 0);
  });

  it('handles null seo object', () => {
    const metafields = buildSeoMetafields(null, 'Fallback');
    assert.equal(metafields.length, 1);
    assert.equal(metafields[0].key, 'title_tag');
    assert.equal(metafields[0].value, 'Fallback');
  });
});

// ── escapeAttr ──────────────────────────────────────────────────────────────

describe('escapeAttr', () => {
  it('escapes ampersands', () => {
    assert.equal(escapeAttr('a&b'), 'a&amp;b');
  });

  it('escapes double quotes', () => {
    assert.equal(escapeAttr('a"b'), 'a&quot;b');
  });

  it('escapes angle brackets', () => {
    assert.equal(escapeAttr('a<b>c'), 'a&lt;b&gt;c');
  });

  it('handles empty string', () => {
    assert.equal(escapeAttr(''), '');
  });
});

// ── filterAttributes ─────────────────────────────────────────────────────────

describe('filterAttributes', () => {
  it('keeps safe attributes', () => {
    const result = filterAttributes(' href="https://example.com" class="link"');
    assert.ok(result.includes('href='));
    assert.ok(result.includes('class='));
  });

  it('removes unsafe attributes', () => {
    const result = filterAttributes(' onclick="alert(1)" href="safe"');
    assert.ok(!result.includes('onclick'));
    assert.ok(result.includes('href='));
  });

  it('handles empty string', () => {
    const result = filterAttributes('');
    assert.equal(result, '');
  });

  it('handles single-quoted attributes', () => {
    const result = filterAttributes(" src='image.jpg' alt='test'");
    assert.ok(result.includes('src='));
    assert.ok(result.includes('alt='));
  });
});

// ── createArticle (unit-level validation) ────────────────────────────────────

describe('createArticle input validation', () => {
  const { createArticle } = require('../bridge/publishing/shopify');

  it('rejects missing shopDomain', async () => {
    await assert.rejects(
      () => createArticle({ accessToken: 'tok', payload: { title: 'T', html: '<p>H</p>' } }),
      /shopDomain is required/
    );
  });

  it('rejects missing accessToken', async () => {
    await assert.rejects(
      () => createArticle({ shopDomain: 'test.myshopify.com', payload: { title: 'T', html: '<p>H</p>' } }),
      /accessToken is required/
    );
  });

  it('rejects missing payload', async () => {
    await assert.rejects(
      () => createArticle({ shopDomain: 'test.myshopify.com', accessToken: 'tok' }),
      /payload is required/
    );
  });

  it('rejects payload without title', async () => {
    await assert.rejects(
      () => createArticle({ shopDomain: 'test.myshopify.com', accessToken: 'tok', payload: { html: '<p>H</p>' } }),
      /title is required/
    );
  });

  it('rejects payload without html', async () => {
    await assert.rejects(
      () => createArticle({ shopDomain: 'test.myshopify.com', accessToken: 'tok', payload: { title: 'T' } }),
      /html is required/
    );
  });
});

// ── resolveCredentials ──────────────────────────────────────────────────────

describe('resolveCredentials', () => {
  const { resolveCredentials } = require('../bridge/publishing/shopify');

  it('throws when credentials are not configured', async () => {
    const mockKeyManager = {
      getKey: async () => { throw new Error('not found'); }
    };
    await assert.rejects(
      () => resolveCredentials(mockKeyManager, 'user-123'),
      /credentials not configured/
    );
  });

  it('resolves credentials from key manager', async () => {
    const mockKeyManager = {
      getKey: async (name, scope) => {
        if (name === 'shopify_domain') return 'test-store.myshopify.com';
        if (name === 'shopify_admin_token') return 'shpat_test123';
        throw new Error('not found');
      }
    };
    const creds = await resolveCredentials(mockKeyManager, 'user-123');
    assert.equal(creds.shopDomain, 'test-store.myshopify.com');
    assert.equal(creds.accessToken, 'shpat_test123');
  });

  it('strips protocol from domain', async () => {
    const mockKeyManager = {
      getKey: async (name) => {
        if (name === 'shopify_domain') return 'https://test-store.myshopify.com/';
        if (name === 'shopify_admin_token') return 'shpat_test123';
        throw new Error('not found');
      }
    };
    const creds = await resolveCredentials(mockKeyManager, 'user-123');
    assert.equal(creds.shopDomain, 'test-store.myshopify.com');
  });

  it('falls back to global scope when user scope fails', async () => {
    const calls = [];
    const mockKeyManager = {
      getKey: async (name, scope) => {
        calls.push({ name, scope });
        if (scope === 'user-123') throw new Error('not found');
        if (name === 'shopify_domain') return 'global-store.myshopify.com';
        if (name === 'shopify_admin_token') return 'shpat_global';
        throw new Error('not found');
      }
    };
    const creds = await resolveCredentials(mockKeyManager, 'user-123');
    assert.equal(creds.shopDomain, 'global-store.myshopify.com');
    assert.equal(creds.accessToken, 'shpat_global');
  });
});

// ── prepareFeaturedImage ─────────────────────────────────────────────────────

describe('prepareFeaturedImage', () => {
  const { prepareFeaturedImage } = require('../bridge/publishing/shopify');

  it('returns null for null input', async () => {
    const result = await prepareFeaturedImage(null);
    assert.equal(result, null);
  });

  it('returns null for image with no src', async () => {
    const result = await prepareFeaturedImage({ alt: 'test' });
    assert.equal(result, null);
  });

  it('returns URL-based image for http src', async () => {
    const result = await prepareFeaturedImage({
      src: 'https://cdn.example.com/photo.jpg',
      alt: 'A photo'
    });
    assert.deepEqual(result, {
      src: 'https://cdn.example.com/photo.jpg',
      alt: 'A photo'
    });
  });

  it('prefers cdnSrc over src', async () => {
    const result = await prepareFeaturedImage({
      src: 'https://original.com/photo.jpg',
      cdnSrc: 'https://cdn.example.com/photo.jpg',
      alt: 'A photo'
    });
    assert.equal(result.src, 'https://cdn.example.com/photo.jpg');
  });

  it('returns null gracefully for non-existent local file', async () => {
    const result = await prepareFeaturedImage({
      src: '/nonexistent/path/image.jpg',
      alt: 'Missing'
    });
    assert.equal(result, null);
  });
});

// ── checkStatus ──────────────────────────────────────────────────────────────

describe('checkStatus', () => {
  const { checkStatus } = require('../bridge/publishing/shopify');

  it('returns error for unreachable domain', async () => {
    // This will fail with a network error (domain doesn't exist)
    const result = await checkStatus('nonexistent-store-xyz-123456.myshopify.com', 'fake-token');
    assert.equal(result.connected, false);
    assert.ok(result.error);
  });
});
