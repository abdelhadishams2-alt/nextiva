/**
 * Astro Adapter — Native .astro page output.
 *
 * Generates an Astro page with frontmatter script, scoped styles,
 * and astro:assets Image component when available.
 */

const description = 'Astro page with frontmatter and scoped styles';
const extensions = ['.astro'];

/**
 * Generate an Astro article page.
 *
 * @param {object} ir - Intermediate representation
 * @returns {{ files: Array<{path: string, content: string}> }}
 */
function generate(ir) {
  const {
    title, content, langConfig, tokens = {}, meta = {},
    images = [], sections = [], projectConfig = {}
  } = ir;

  const dir = langConfig.direction || 'ltr';
  const lang = langConfig.language || 'en';
  const slug = slugify(title);
  const htmlContent = content || '';

  const hasImages = images.length > 0 || htmlContent.includes('<img');
  const useAstroImage = projectConfig.imageStrategy === 'astro-image' || hasImages;

  const tocItems = sections.map(s => ({
    id: s.id || slugify(s.title || ''),
    label: s.sidebarLabel || s.title || '',
  }));

  const astroPage = generateAstroPage({
    title, htmlContent, dir, lang, meta, tocItems, useAstroImage, tokens
  });

  return {
    files: [
      { path: `src/pages/articles/${slug}.astro`, content: astroPage },
    ]
  };
}

function generateAstroPage({ title, htmlContent, dir, lang, meta, tocItems, useAstroImage, tokens }) {
  const imports = [];
  if (useAstroImage) {
    imports.push("import { Image } from 'astro:assets';");
  }

  const tocHTML = tocItems.length > 0 ? `
    <nav class="toc">
      <h3 class="toc-heading">Contents</h3>
      <ul class="toc-list">
${tocItems.map(item => `        <li><a href="#${item.id}" class="toc-link">${escapeHTML(item.label)}</a></li>`).join('\n')}
      </ul>
    </nav>` : '';

  return `---
${imports.length > 0 ? imports.join('\n') + '\n' : ''}const title = ${JSON.stringify(title)};
const description = ${JSON.stringify(meta.description || title)};
---

<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <meta name="description" content={description} />
</head>
<body>
  <article class="article-container">
    <header class="article-header">
      <h1>{title}</h1>
    </header>

    <div class="article-layout">
      <main class="article-main">
${indent(htmlContent, 8)}
      </main>

      <aside class="article-sidebar">
${tocHTML}
      </aside>
    </div>
  </article>
</body>
</html>

<style>
  .article-container {
    max-width: 80rem;
    margin-inline: auto;
    padding: 3rem 1.5rem;
    font-family: ${tokens.fontFamily || 'system-ui, sans-serif'};
    direction: ${dir};
  }

  .article-header {
    margin-block-end: 3rem;
  }

  .article-header h1 {
    font-size: 2.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  .article-layout {
    display: grid;
    grid-template-columns: 1fr 250px;
    gap: 3rem;
  }

  .article-main {
    font-size: 1.125rem;
    line-height: 1.75;
  }

  .article-main :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
  }

  .article-sidebar {
    position: sticky;
    top: 2rem;
    align-self: start;
  }

  .toc-heading {
    font-size: 0.875rem;
    font-weight: 600;
    margin-block-end: 0.75rem;
  }

  .toc-list {
    list-style: none;
    padding: 0;
  }

  .toc-link {
    display: block;
    padding: 0.25rem 0;
    font-size: 0.875rem;
    color: inherit;
    opacity: 0.7;
    text-decoration: none;
  }

  .toc-link:hover {
    opacity: 1;
  }

  @media (max-width: 1024px) {
    .article-layout {
      grid-template-columns: 1fr;
    }
    .article-sidebar {
      display: none;
    }
  }
</style>
`;
}

function slugify(str) {
  return String(str).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function escapeHTML(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function indent(str, spaces) {
  const pad = ' '.repeat(spaces);
  return str.split('\n').map(line => line ? pad + line : line).join('\n');
}

module.exports = { description, extensions, generate };
