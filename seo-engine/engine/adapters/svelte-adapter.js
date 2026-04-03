/**
 * SvelteKit Native Adapter — Full SvelteKit page generation.
 *
 * Generates SvelteKit pages with:
 * - +page.svelte component with Svelte scoped CSS
 * - +page.ts (or +page.js) load function for data
 * - Slot-based layout integration
 * - Hero image, sections, code blocks, lists, tables, FAQ schema
 * - Edit overlay as separate interactive component
 *
 * Zero dependencies — uses only Node.js built-ins.
 */

const description = 'SvelteKit with +page.svelte, +page.ts load function, scoped CSS';
const extensions = ['.svelte', '.ts', '.js'];

/**
 * Generate a complete SvelteKit article page set.
 *
 * @param {object} ir - Intermediate representation of article content
 * @param {string} ir.title - Article title
 * @param {string} [ir.description] - Article description
 * @param {string} [ir.content] - Raw HTML content body
 * @param {object} [ir.langConfig] - Language configuration
 * @param {object} [ir.tokens] - Design tokens
 * @param {object} [ir.meta] - Metadata (author, date, canonical, etc.)
 * @param {Array}  [ir.images] - Array of image objects {src, alt, width, height}
 * @param {Array}  [ir.sections] - Array of section objects {id, title, sidebarLabel, content, type}
 * @param {object} [ir.projectConfig] - Auto-detected project config
 * @param {Array}  [ir.faq] - FAQ items [{question, answer}]
 * @returns {{ files: Array<{path: string, content: string}> }}
 */
function generate(ir) {
  const {
    title = 'Untitled Article',
    description: articleDesc,
    content,
    langConfig = { direction: 'ltr', language: 'en' },
    tokens = {},
    meta = {},
    images = [],
    sections = [],
    projectConfig = {},
    faq = [],
  } = ir;

  const isTS = projectConfig.language !== 'javascript';
  const ext = isTS ? 'ts' : 'js';
  const useTailwind = projectConfig.cssFramework === 'tailwind';
  const slug = slugify(title);
  const dir = langConfig.direction || 'ltr';
  const lang = langConfig.language || 'en';

  const files = [];

  // 1. Main page component (+page.svelte)
  const pageContent = generatePageComponent({
    title, articleDesc, content, langConfig, tokens,
    images, sections, useTailwind, dir, lang, meta, faq,
  });
  files.push({ path: `src/routes/articles/${slug}/+page.svelte`, content: pageContent });

  // 2. Load function (+page.ts or +page.js)
  const loadContent = generateLoadFunction({ title, articleDesc, meta, isTS });
  files.push({ path: `src/routes/articles/${slug}/+page.${ext}`, content: loadContent });

  // 3. Edit overlay (interactive component — separate file)
  const editOverlay = generateEditOverlay();
  files.push({ path: `src/routes/articles/${slug}/EditOverlay.svelte`, content: editOverlay });

  return { files };
}

// ── Page Component (+page.svelte) ──────────────────────────────────

function generatePageComponent(opts) {
  const {
    title, articleDesc, content, langConfig, tokens,
    images, sections, useTailwind, dir, lang, meta, faq,
  } = opts;

  const lines = [];

  // Script block
  lines.push('<script>');
  lines.push("  import EditOverlay from './EditOverlay.svelte';");
  lines.push('');
  lines.push('  export let data;');
  lines.push('</script>');
  lines.push('');

  // svelte:head for SEO metadata
  lines.push('<svelte:head>');
  lines.push(`  <title>${escapeHTML(title)}</title>`);
  if (articleDesc) {
    lines.push(`  <meta name="description" content="${escapeAttr(articleDesc)}" />`);
  }
  const ogImage = images && images.length > 0 ? images[0] : null;
  lines.push(`  <meta property="og:title" content="${escapeAttr(title)}" />`);
  lines.push(`  <meta property="og:description" content="${escapeAttr(articleDesc || title)}" />`);
  lines.push('  <meta property="og:type" content="article" />');
  if (ogImage) {
    lines.push(`  <meta property="og:image" content="${escapeAttr(ogImage.src || ogImage)}" />`);
  }

  // FAQ Schema (JSON-LD)
  if (faq && faq.length > 0) {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };
    lines.push(`  {@html '<script type="application/ld+json">${JSON.stringify(schema)}</script>'}`);
  }

  lines.push('</svelte:head>');
  lines.push('');

  // Build sections HTML
  const sectionsHTML = buildSectionsHTML(sections, images, useTailwind, content);

  // Build hero image
  const heroImage = images && images.length > 0 ? images[0] : null;
  const heroHTML = heroImage ? buildHeroImageHTML(heroImage, useTailwind) : '';

  // Build TOC
  const tocItems = sections
    .filter(s => s.title)
    .map(s => ({ id: s.id || slugify(s.title), label: s.sidebarLabel || s.title }));
  const tocHTML = buildTOCHTML(tocItems, useTailwind);

  // CSS class helpers
  const cn = useTailwind
    ? (tw) => tw
    : (_, mod) => mod;

  // Main template
  lines.push(`<article class="${cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12', 'container')}" dir="${dir}" lang="${lang}">`);

  // Header with hero image
  lines.push(`  <header class="${cn('mb-12', 'header')}">`);
  lines.push(`    <h1 class="${cn('text-4xl font-bold tracking-tight mb-4', 'title')}">${escapeHTML(title)}</h1>`);
  if (articleDesc) {
    lines.push(`    <p class="${cn('text-lg text-muted-foreground', 'description')}">${escapeHTML(articleDesc)}</p>`);
  }
  if (heroHTML) {
    lines.push(heroHTML);
  }
  lines.push('  </header>');
  lines.push('');

  // Layout: main content + sidebar
  lines.push(`  <div class="${cn('grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-12', 'layout')}">`);
  lines.push(`    <main class="${cn('prose prose-lg max-w-none dark:prose-invert', 'main')}">`);
  lines.push(sectionsHTML);
  lines.push('    </main>');
  lines.push('');
  lines.push(`    <aside class="${cn('hidden lg:block', 'sidebar')}">`);
  if (tocHTML) lines.push(tocHTML);
  lines.push('    </aside>');
  lines.push('  </div>');
  lines.push('');
  lines.push('  <EditOverlay />');
  lines.push('</article>');

  // Style block (scoped CSS)
  if (!useTailwind) {
    lines.push('');
    lines.push(generateScopedCSS(langConfig, tokens));
  }

  return lines.join('\n');
}

// ── Sections HTML Builder ──────────────────────────────────────────

function buildSectionsHTML(sections, images, useTailwind, fallbackContent) {
  if ((!sections || sections.length === 0) && fallbackContent) {
    return indent(fallbackContent, 6);
  }
  if (!sections || sections.length === 0) return '';

  const parts = [];
  for (const section of sections) {
    const sectionId = section.id || slugify(section.title || '');
    const sectionContent = section.content || '';
    const sectionType = section.type || 'section';

    if (section.title) {
      const headingLevel = section.headingLevel || 2;
      const tag = `h${headingLevel}`;
      const cls = useTailwind ? ' class="scroll-mt-20"' : ' class="section-heading"';
      parts.push(`      <${tag} id="${sectionId}"${cls}>${escapeHTML(section.title)}</${tag}>`);
    }

    if (sectionType === 'code' || section.codeBlock) {
      parts.push(buildCodeBlockHTML(sectionContent, section.language, useTailwind));
    } else if (sectionType === 'list' && section.items) {
      parts.push(buildListHTML(section.items, section.ordered, useTailwind));
    } else if (sectionType === 'table' && section.rows) {
      parts.push(buildTableHTML(section.headers, section.rows, useTailwind));
    } else if (sectionType === 'image' && section.src) {
      parts.push(buildImageHTML(section, useTailwind));
    } else if (sectionContent) {
      parts.push(indent(sectionContent, 6));
    }
  }

  return parts.join('\n\n');
}

// ── Hero Image ─────────────────────────────────────────────────────

function buildHeroImageHTML(image, useTailwind) {
  const src = image.src || image;
  const alt = image.alt || 'Hero image';
  const cls = useTailwind
    ? 'w-full rounded-xl mt-8 object-cover'
    : 'hero-image';
  return `    <img\n      src="${escapeAttr(src)}"\n      alt="${escapeAttr(alt)}"\n      class="${cls}"\n      loading="eager"\n    />`;
}

// ── Code Block ─────────────────────────────────────────────────────

function buildCodeBlockHTML(code, language, useTailwind) {
  const lang = language || '';
  const cls = useTailwind
    ? 'rounded-lg bg-muted p-4 overflow-x-auto my-6'
    : 'code-block';
  const escapedCode = escapeHTML(code);
  return `      <pre class="${cls}">\n        <code${lang ? ` class="language-${lang}"` : ''}>${escapedCode}</code>\n      </pre>`;
}

// ── List ───────────────────────────────────────────────────────────

function buildListHTML(items, ordered, useTailwind) {
  const tag = ordered ? 'ol' : 'ul';
  const cls = useTailwind
    ? `${ordered ? 'list-decimal' : 'list-disc'} pl-6 my-4 space-y-2`
    : 'list';
  const itemsHTML = items.map(item =>
    `        <li>${escapeHTML(item)}</li>`
  ).join('\n');
  return `      <${tag} class="${cls}">\n${itemsHTML}\n      </${tag}>`;
}

// ── Table ──────────────────────────────────────────────────────────

function buildTableHTML(headers, rows, useTailwind) {
  const tableClass = useTailwind
    ? 'w-full border-collapse my-6'
    : 'table';
  const thClass = useTailwind
    ? 'border border-border px-4 py-2 text-left font-semibold bg-muted'
    : 'th';
  const tdClass = useTailwind
    ? 'border border-border px-4 py-2'
    : 'td';

  let headerRow = '';
  if (headers && headers.length > 0) {
    const ths = headers.map(h => `            <th class="${thClass}">${escapeHTML(h)}</th>`).join('\n');
    headerRow = `        <thead>\n          <tr>\n${ths}\n          </tr>\n        </thead>`;
  }

  let bodyRows = '';
  if (rows && rows.length > 0) {
    const trs = rows.map(row => {
      const cells = (Array.isArray(row) ? row : [row]).map(
        cell => `            <td class="${tdClass}">${escapeHTML(cell)}</td>`
      ).join('\n');
      return `          <tr>\n${cells}\n          </tr>`;
    }).join('\n');
    bodyRows = `        <tbody>\n${trs}\n        </tbody>`;
  }

  return `      <table class="${tableClass}">\n${headerRow}\n${bodyRows}\n      </table>`;
}

// ── Inline Image ───────────────────────────────────────────────────

function buildImageHTML(section, useTailwind) {
  const src = section.src;
  const alt = section.alt || section.content || 'Article image';
  const cls = useTailwind ? 'rounded-lg my-6' : 'image';
  return `      <img\n        src="${escapeAttr(src)}"\n        alt="${escapeAttr(alt)}"\n        class="${cls}"\n        loading="lazy"\n      />`;
}

// ── Table of Contents ──────────────────────────────────────────────

function buildTOCHTML(items, useTailwind) {
  if (!items || items.length === 0) return '';

  const navCls = useTailwind ? 'sticky top-8 space-y-2' : 'toc';
  const headingCls = useTailwind
    ? 'text-sm font-semibold text-muted-foreground mb-3'
    : 'toc-heading';
  const linkCls = useTailwind
    ? 'text-muted-foreground hover:text-foreground transition-colors'
    : 'toc-link';

  const lis = items.map(item =>
    `          <li><a href="#${item.id}" class="${linkCls}">${escapeHTML(item.label)}</a></li>`
  ).join('\n');

  const listCls = useTailwind ? 'space-y-1 text-sm' : 'toc-list';
  return `      <nav class="${navCls}">\n        <h3 class="${headingCls}">Contents</h3>\n        <ul class="${listCls}">\n${lis}\n        </ul>\n      </nav>`;
}

// ── Load Function (+page.ts) ───────────────────────────────────────

function generateLoadFunction({ title, articleDesc, meta, isTS }) {
  const lines = [];

  if (isTS) {
    lines.push("import type { PageLoad } from './$types';");
    lines.push('');
    lines.push('export const load: PageLoad = async () => {');
  } else {
    lines.push('export async function load() {');
  }

  lines.push('  return {');
  lines.push(`    title: ${JSON.stringify(title)},`);
  lines.push(`    description: ${JSON.stringify(articleDesc || title)},`);
  if (meta.author) {
    lines.push(`    author: ${JSON.stringify(meta.author)},`);
  }
  if (meta.publishedAt || meta.date) {
    lines.push(`    publishedAt: ${JSON.stringify(meta.publishedAt || meta.date)},`);
  }
  lines.push('  };');
  lines.push('};');

  return lines.join('\n');
}

// ── Edit Overlay (Interactive Component) ───────────────────────────

function generateEditOverlay() {
  return `<script>
  let editing = false;
  const bridgeUrl = 'http://127.0.0.1:19847';
</script>

{#if !editing}
  <button
    on:click={() => editing = true}
    class="edit-button"
    aria-label="Edit article"
  >
    Edit
  </button>
{:else}
  <div class="overlay-backdrop">
    <div class="overlay-panel">
      <h2>Edit Section</h2>
      <p>
        Click on a section in the article to edit it.
        Changes are processed by the ChainIQ bridge server.
      </p>
      <button on:click={() => editing = false} class="close-button">
        Close
      </button>
    </div>
  </div>
{/if}

<style>
  .edit-button {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 50;
    background: var(--color-primary, #3b82f6);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .edit-button:hover {
    opacity: 0.9;
  }

  .overlay-backdrop {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .overlay-panel {
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    padding: 1.5rem;
    max-width: 32rem;
    width: 100%;
  }

  .overlay-panel h2 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .overlay-panel p {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 1rem;
  }

  .close-button {
    padding: 0.5rem 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background: transparent;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .close-button:hover {
    background: #f3f4f6;
  }
</style>
`;
}

// ── Scoped CSS ─────────────────────────────────────────────────────

function generateScopedCSS(langConfig, tokens) {
  const dir = langConfig.direction || 'ltr';
  const isRTL = dir === 'rtl';
  const fontFamily = tokens.fontFamily
    || (langConfig.fonts ? langConfig.fonts.primary : 'system-ui, sans-serif');

  const lines = [];
  lines.push('<style>');

  // CSS custom properties from design tokens
  if (tokens && Object.keys(tokens).length > 0) {
    lines.push('  .container {');
    for (const [key, value] of Object.entries(tokens)) {
      lines.push(`    --${key}: ${value};`);
    }
    lines.push('  }');
    lines.push('');
  }

  lines.push('  .container {');
  lines.push('    max-width: 80rem;');
  lines.push('    margin-inline: auto;');
  lines.push('    padding: 3rem 1.5rem;');
  lines.push(`    font-family: ${fontFamily};`);
  lines.push(`    direction: ${dir};`);
  if (isRTL) {
    lines.push('    text-align: right;');
  }
  lines.push('  }');
  lines.push('');

  lines.push('  .header {');
  lines.push('    margin-block-end: 3rem;');
  lines.push('  }');
  lines.push('');

  lines.push('  .title {');
  lines.push('    font-size: 2.5rem;');
  lines.push('    font-weight: 700;');
  lines.push('    letter-spacing: -0.02em;');
  lines.push('    line-height: 1.2;');
  lines.push('  }');
  lines.push('');

  lines.push('  .description {');
  lines.push('    font-size: 1.125rem;');
  lines.push('    color: #6b7280;');
  lines.push('    margin-block-start: 0.5rem;');
  lines.push('  }');
  lines.push('');

  lines.push('  .hero-image {');
  lines.push('    width: 100%;');
  lines.push('    border-radius: 0.75rem;');
  lines.push('    margin-block-start: 2rem;');
  lines.push('    object-fit: cover;');
  lines.push('  }');
  lines.push('');

  lines.push('  .layout {');
  lines.push('    display: grid;');
  lines.push('    grid-template-columns: 1fr 250px;');
  lines.push('    gap: 3rem;');
  lines.push('  }');
  lines.push('');

  lines.push('  .main {');
  lines.push('    font-size: 1.125rem;');
  lines.push('    line-height: 1.75;');
  lines.push('  }');
  lines.push('');

  lines.push('  .image {');
  lines.push('    border-radius: 0.5rem;');
  lines.push('    margin-block: 1.5rem;');
  lines.push('  }');
  lines.push('');

  lines.push('  .section-heading {');
  lines.push('    scroll-margin-top: 5rem;');
  lines.push('  }');
  lines.push('');

  lines.push('  .code-block {');
  lines.push('    border-radius: 0.5rem;');
  lines.push('    background: #f3f4f6;');
  lines.push('    padding: 1rem;');
  lines.push('    overflow-x: auto;');
  lines.push('    margin-block: 1.5rem;');
  lines.push('  }');
  lines.push('');

  lines.push('  .list {');
  lines.push('    padding-inline-start: 1.5rem;');
  lines.push('    margin-block: 1rem;');
  lines.push('  }');
  lines.push('');

  lines.push('  .table {');
  lines.push('    width: 100%;');
  lines.push('    border-collapse: collapse;');
  lines.push('    margin-block: 1.5rem;');
  lines.push('  }');
  lines.push('');

  lines.push('  .th {');
  lines.push('    border: 1px solid #e5e7eb;');
  lines.push('    padding: 0.5rem 1rem;');
  lines.push('    text-align: start;');
  lines.push('    font-weight: 600;');
  lines.push('    background: #f9fafb;');
  lines.push('  }');
  lines.push('');

  lines.push('  .td {');
  lines.push('    border: 1px solid #e5e7eb;');
  lines.push('    padding: 0.5rem 1rem;');
  lines.push('  }');
  lines.push('');

  lines.push('  .sidebar {');
  lines.push('    display: block;');
  lines.push('  }');
  lines.push('');

  lines.push('  .toc {');
  lines.push('    position: sticky;');
  lines.push('    top: 2rem;');
  lines.push('  }');
  lines.push('');

  lines.push('  .toc-heading {');
  lines.push('    font-size: 0.875rem;');
  lines.push('    font-weight: 600;');
  lines.push('    margin-block-end: 0.75rem;');
  lines.push('  }');
  lines.push('');

  lines.push('  .toc-list {');
  lines.push('    list-style: none;');
  lines.push('    padding: 0;');
  lines.push('  }');
  lines.push('');

  lines.push('  .toc-link {');
  lines.push('    display: block;');
  lines.push('    padding: 0.25rem 0;');
  lines.push('    font-size: 0.875rem;');
  lines.push('    color: inherit;');
  lines.push('    opacity: 0.7;');
  lines.push('    text-decoration: none;');
  lines.push('  }');
  lines.push('');

  lines.push('  .toc-link:hover {');
  lines.push('    opacity: 1;');
  lines.push('  }');
  lines.push('');

  lines.push('  @media (max-width: 1024px) {');
  lines.push('    .layout {');
  lines.push('      grid-template-columns: 1fr;');
  lines.push('    }');
  lines.push('    .sidebar {');
  lines.push('      display: none;');
  lines.push('    }');
  lines.push('  }');

  lines.push('</style>');

  return lines.join('\n');
}

// ── Shared Utilities ───────────────────────────────────────────────

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function indent(str, spaces) {
  const pad = ' '.repeat(spaces);
  return str.split('\n').map(line => line ? pad + line : line).join('\n');
}

module.exports = { description, extensions, generate, slugify };
