/**
 * Svelte Adapter — SvelteKit page output.
 *
 * Generates a +page.svelte file with scoped CSS.
 */

const description = 'SvelteKit page with scoped CSS';
const extensions = ['.svelte'];

/**
 * Generate a SvelteKit article page.
 *
 * @param {object} ir - Intermediate representation
 * @returns {{ files: Array<{path: string, content: string}> }}
 */
function generate(ir) {
  const { title, content, langConfig, tokens = {}, meta = {} } = ir;
  const dir = langConfig.direction || 'ltr';
  const lang = langConfig.language || 'en';
  const slug = slugify(title);

  const htmlContent = content || '';

  const svelteComponent = `<script>
  /** @type {import('./$types').PageData} */
  export let data;

  const title = ${JSON.stringify(title)};
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content="${escapeAttr(meta.description || title)}" />
</svelte:head>

<article dir="${dir}" lang="${lang}" class="article-container">
  <header class="article-header">
    <h1>{title}</h1>
  </header>

  <div class="article-layout">
    <main class="article-main">
${indent(htmlContent, 6)}
    </main>
  </div>
</article>

<style>
  .article-container {
    max-width: 80rem;
    margin-inline: auto;
    padding: 3rem 1.5rem;
    direction: ${dir};
  }

  .article-header {
    margin-block-end: 3rem;
  }

  .article-header h1 {
    font-size: 2.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .article-layout {
    display: grid;
    grid-template-columns: 1fr;
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
</style>
`;

  const loadFile = `/** @type {import('./$types').PageLoad} */
export function load() {
  return {
    title: ${JSON.stringify(title)},
  };
}
`;

  return {
    files: [
      { path: `src/routes/articles/${slug}/+page.svelte`, content: svelteComponent },
      { path: `src/routes/articles/${slug}/+page.js`, content: loadFile },
    ]
  };
}

function slugify(str) {
  return String(str).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function indent(str, spaces) {
  const pad = ' '.repeat(spaces);
  return str.split('\n').map(line => line ? pad + line : line).join('\n');
}

module.exports = { description, extensions, generate };
