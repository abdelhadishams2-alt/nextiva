/**
 * RTL (Right-to-Left) CSS Support for ChainIQ Universal Engine.
 *
 * Generates CSS that uses logical properties for bidirectional support.
 * Articles in Arabic/Hebrew get proper RTL layout with code blocks
 * isolated as LTR.
 */

/**
 * Generate RTL-aware CSS for an article.
 * Uses CSS logical properties so the same CSS works for both LTR and RTL.
 *
 * @param {object} options
 * @param {string} options.direction - 'rtl' or 'ltr'
 * @param {object} options.fonts - { body, heading }
 * @param {object} [options.tokens] - Design tokens (colors, spacing)
 * @returns {string} CSS string
 */
function generateDirectionalCSS(options) {
  const { direction, fonts, tokens = {} } = options;
  const isRTL = direction === 'rtl';

  const spacing = tokens.spacing || '1.5rem';
  const lineHeight = isRTL ? '1.8' : '1.6';

  return `
/* Direction: ${direction} */
.article-container {
    direction: ${direction};
    unicode-bidi: embed;
    font-family: ${fonts.body};
    line-height: ${lineHeight};
    text-align: start;
}

/* Headings */
.article-container h1,
.article-container h2,
.article-container h3,
.article-container h4 {
    font-family: ${fonts.heading};
    text-align: start;
}

/* Paragraphs and blocks — use logical properties */
.article-container p,
.article-container ul,
.article-container ol,
.article-container blockquote {
    margin-block-start: 0;
    margin-block-end: 1rem;
    margin-inline-start: 0;
    margin-inline-end: 0;
}

/* Lists */
.article-container ul,
.article-container ol {
    padding-inline-start: ${spacing};
}

/* Blockquote */
.article-container blockquote {
    border-inline-start: 4px solid var(--border-color, #e5e7eb);
    padding-inline-start: 1rem;
    margin-inline-start: 0;
    margin-inline-end: 0;
}

/* Code blocks — always LTR regardless of article direction */
.article-container pre,
.article-container code {
    direction: ltr;
    unicode-bidi: isolate;
    text-align: left;
    font-family: "Fira Code", "Consolas", monospace;
}

/* Tables */
.article-container table {
    text-align: start;
}

.article-container th,
.article-container td {
    padding-inline-start: 0.75rem;
    padding-inline-end: 0.75rem;
    text-align: start;
}

/* Images */
.article-container figure {
    margin-inline-start: 0;
    margin-inline-end: 0;
}

.article-container figcaption {
    text-align: center;
}
${isRTL ? `
/* RTL-specific overrides */
.article-container .edit-button {
    inset-inline-end: 0.5rem;
    inset-inline-start: auto;
}

/* Ensure numbers in RTL context display correctly */
.article-container .number,
.article-container .metric,
.article-container .date {
    direction: ltr;
    unicode-bidi: isolate;
}
` : ''}`.trim();
}

/**
 * Generate the dir attribute and lang attribute for the HTML container.
 */
function getHTMLAttributes(langConfig) {
  return {
    dir: langConfig.direction,
    lang: langConfig.language
  };
}

/**
 * Wrap content that should always be LTR (code, URLs, numbers)
 * with appropriate bidi isolation.
 */
function isolateLTR(content) {
  return `<span dir="ltr" style="unicode-bidi: isolate;">${content}</span>`;
}

module.exports = {
  generateDirectionalCSS,
  getHTMLAttributes,
  isolateLTR
};
