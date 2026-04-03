/**
 * WordPress Adapter — Generates WordPress-compatible HTML content.
 *
 * Outputs HTML suitable for the WordPress block editor (Gutenberg) or
 * classic editor. Uses inline styles for portability — no theme dependency.
 *
 * Full WordPress REST API integration (auto-publish via WP REST) is planned
 * for a future release. This stub generates the HTML content that can be
 * pasted into WordPress or posted via the REST API's `content.raw` field.
 */

const { generateDirectionalCSS, getHTMLAttributes } = require('../rtl');

const description = 'WordPress-compatible HTML (Gutenberg/Classic)';
const extensions = ['.html'];

/**
 * Generate WordPress-compatible article HTML.
 *
 * @param {object} ir - Intermediate representation
 * @param {string} ir.title - Article title
 * @param {string} ir.content - HTML content body
 * @param {object} ir.langConfig - Language configuration from language.js
 * @param {object} [ir.tokens] - Design tokens
 * @param {object} [ir.toc] - Table of contents
 * @param {object} [ir.meta] - Metadata (author, date, etc.)
 * @returns {{ files: Array<{path: string, content: string}> }}
 */
function generate(ir) {
  const { title, content, langConfig, tokens = {}, toc, meta = {} } = ir;
  const attrs = getHTMLAttributes(langConfig);
  const dirAttr = attrs.dir ? ` dir="${attrs.dir}"` : '';

  const css = generateDirectionalCSS({
    direction: langConfig.direction,
    fonts: langConfig.fonts,
    tokens
  });

  // WordPress Gutenberg block comments for semantic structure
  const tocBlock = toc ? generateWPToc(toc) : '';

  const metaBlock = meta.author || meta.date ? `
<!-- wp:group {"className":"article-meta"} -->
<div class="wp-block-group article-meta" style="margin-bottom:2rem;padding:1rem;border-left:4px solid ${tokens.primaryColor || '#2563eb'};background:${tokens.surfaceColor || '#f8fafc'};">
  ${meta.author ? `<p style="margin:0;font-weight:600;">${escapeHTML(meta.author)}</p>` : ''}
  ${meta.date ? `<p style="margin:0;color:#64748b;font-size:0.875rem;">${escapeHTML(meta.date)}</p>` : ''}
</div>
<!-- /wp:group -->` : '';

  const html = `<!-- ChainIQ Generated Article — WordPress Format -->
<!-- wp:html -->
<style>
${css}
.chainiq-article { max-width: 720px; margin: 0 auto; font-family: ${tokens.fontFamily || 'Georgia, serif'}; line-height: 1.75; color: ${tokens.textColor || '#1e293b'}; }
.chainiq-article h2 { margin-top: 2rem; margin-bottom: 0.75rem; font-size: 1.5rem; font-weight: 700; }
.chainiq-article h3 { margin-top: 1.5rem; margin-bottom: 0.5rem; font-size: 1.25rem; font-weight: 600; }
.chainiq-article img { max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0; }
.chainiq-article p { margin-bottom: 1rem; }
.chainiq-article blockquote { border-left: 4px solid ${tokens.primaryColor || '#2563eb'}; margin: 1.5rem 0; padding: 0.75rem 1.25rem; background: ${tokens.surfaceColor || '#f8fafc'}; }
</style>
<!-- /wp:html -->

<!-- wp:heading {"level":1} -->
<h1${dirAttr}>${escapeHTML(title)}</h1>
<!-- /wp:heading -->

${metaBlock}

${tocBlock}

<!-- wp:group {"className":"chainiq-article"} -->
<div class="wp-block-group chainiq-article"${dirAttr}>
${content}
</div>
<!-- /wp:group -->`;

  const slug = slugify(title);

  return {
    files: [
      { path: `${slug}.html`, content: html }
    ]
  };
}

function generateWPToc(toc) {
  if (!toc.items || toc.items.length === 0) return '';
  const items = toc.items
    .map(item => `<li><a href="#${item.id}">${escapeHTML(item.text)}</a></li>`)
    .join('\n    ');

  return `
<!-- wp:group {"className":"table-of-contents"} -->
<div class="wp-block-group table-of-contents" style="background:#f8fafc;padding:1.5rem;border-radius:8px;margin-bottom:2rem;">
  <p style="font-weight:700;margin-bottom:0.75rem;">${toc.label || 'Table of Contents'}</p>
  <ol style="margin:0;padding-left:1.25rem;">
    ${items}
  </ol>
</div>
<!-- /wp:group -->`;
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugify(text) {
  return (text || 'article')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'article';
}

module.exports = { description, extensions, generate };
