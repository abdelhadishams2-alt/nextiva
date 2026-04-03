/**
 * HTML Adapter — Default output format.
 *
 * Generates standalone HTML files with inline CSS and edit UI JavaScript.
 * No build step required.
 */

const { generateDirectionalCSS, getHTMLAttributes } = require('../rtl');

const description = 'Standalone HTML with inline styles and edit UI';
const extensions = ['.html'];

/**
 * Generate a standalone HTML article.
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
  const css = generateDirectionalCSS({
    direction: langConfig.direction,
    fonts: langConfig.fonts,
    tokens
  });

  const tocHTML = toc ? generateTOC(toc) : '';
  const metaHTML = generateMeta(meta, langConfig);

  const html = `<!DOCTYPE html>
<html ${attrs.dir ? `dir="${attrs.dir}"` : ''} lang="${attrs.lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHTML(title)}</title>
${metaHTML}
    <style>
${css}
    </style>
</head>
<body>
    <div class="article-container">
        <h1>${escapeHTML(title)}</h1>
${tocHTML}
${content}
    </div>
</body>
</html>`;

  return {
    files: [{ path: `${slugify(title)}.html`, content: html }]
  };
}

function generateTOC(toc) {
  if (!toc || !toc.items || toc.items.length === 0) return '';
  const items = toc.items.map(item =>
    `        <li><a href="#${item.id}">${escapeHTML(item.label)}</a></li>`
  ).join('\n');
  return `        <nav class="article-toc">\n            <ul>\n${items}\n            </ul>\n        </nav>`;
}

function generateMeta(meta, langConfig) {
  const tags = [];
  if (meta.description) tags.push(`    <meta name="description" content="${escapeHTML(meta.description)}">`);
  if (meta.author) tags.push(`    <meta name="author" content="${escapeHTML(meta.author)}">`);
  tags.push(`    <meta name="generator" content="ChainIQ">`);
  if (langConfig.locale) tags.push(`    <meta property="og:locale" content="${langConfig.locale}">`);
  return tags.join('\n');
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

module.exports = { description, extensions, generate };
