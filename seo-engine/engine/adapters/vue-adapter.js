/**
 * Vue SFC Adapter — Native Vue 3 Single File Component output.
 *
 * Generates a Vue 3 SFC with:
 *   - <script setup lang="ts"> with defineProps
 *   - <template> with semantic HTML, lazy-loaded images, TOC child component
 *   - <style scoped> with component styles
 *
 * Supports both Nuxt 3 (pages/) and plain Vue Router (views/) output paths.
 *
 * Zero dependencies — uses only Node.js built-ins.
 */

const description = 'Vue 3 SFC (TypeScript, Composition API, Scoped CSS)';
const extensions = ['.vue'];

/**
 * Article data shape expected by the generated component.
 *
 * @typedef {object} ArticleData
 * @property {string} title
 * @property {string} slug
 * @property {string} [description]
 * @property {string} [author]
 * @property {string} [publishedAt]
 * @property {Array<{id: string, text: string, level: number}>} [toc]
 * @property {Array<{type: string, content: string, src?: string, alt?: string, items?: string[], language?: string}>} sections
 */

/**
 * Generate a Vue 3 SFC article component.
 *
 * @param {object} ir - Intermediate representation
 * @param {string} ir.title - Article title
 * @param {string} [ir.slug] - URL slug
 * @param {string} [ir.description] - Meta description
 * @param {object} [ir.langConfig] - Language config { language, direction, fonts }
 * @param {object} [ir.tokens] - Design tokens
 * @param {Array} [ir.sections] - Content sections
 * @param {Array} [ir.toc] - Table of contents entries
 * @param {object} [ir.projectConfig] - Auto-detected project config
 * @returns {{ files: Array<{path: string, content: string}> }}
 */
function generate(ir) {
  const {
    title = 'Untitled Article',
    slug,
    description: desc,
    langConfig = { language: 'en', direction: 'ltr' },
    tokens = {},
    sections = [],
    toc = [],
    projectConfig = {},
  } = ir;

  const componentName = toPascalCase(title);
  const articleSlug = slug || slugify(title);
  const isNuxt = projectConfig.framework === 'nuxt';
  const useTypeScript = projectConfig.language === 'typescript' || true; // Default to TS

  // Build the SFC content
  const scriptBlock = buildScriptBlock(title, desc, toc, langConfig, useTypeScript, isNuxt);
  const templateBlock = buildTemplateBlock(title, sections, toc, langConfig);
  const styleBlock = buildStyleBlock(langConfig, tokens);

  const sfc = `${scriptBlock}\n\n${templateBlock}\n\n${styleBlock}\n`;

  // Determine output path based on project config
  const outputPath = resolveVueOutputPath(componentName, articleSlug, isNuxt);

  const files = [{ path: outputPath, content: sfc }];

  // Generate TOC child component if TOC entries exist
  if (toc && toc.length > 0) {
    files.push({
      path: resolveTocComponentPath(isNuxt),
      content: generateTocComponent(useTypeScript),
    });
  }

  return { files };
}

/**
 * Build the <script setup> block.
 */
function buildScriptBlock(title, description, toc, langConfig, useTypeScript, isNuxt) {
  const lang = useTypeScript ? ' lang="ts"' : '';
  const lines = [];

  lines.push(`<script setup${lang}>`);

  // Nuxt-specific: useHead for SEO
  if (isNuxt) {
    lines.push('');
    lines.push('useHead({');
    lines.push(`  title: '${escapeQuote(title)}',`);
    if (description) {
      lines.push('  meta: [');
      lines.push(`    { name: 'description', content: '${escapeQuote(description)}' },`);
      lines.push('  ],');
    }
    lines.push('});');
  }

  // Import TOC component if there are TOC entries
  if (toc && toc.length > 0) {
    lines.push('');
    lines.push("import ArticleToc from './ArticleToc.vue';");
  }

  // defineProps interface
  lines.push('');
  if (useTypeScript) {
    lines.push('interface ArticleProps {');
    lines.push('  title?: string;');
    lines.push('  description?: string;');
    lines.push('  author?: string;');
    lines.push('  publishedAt?: string;');
    lines.push('  className?: string;');
    lines.push('}');
    lines.push('');
    lines.push('const props = withDefaults(defineProps<ArticleProps>(), {');
    lines.push(`  title: '${escapeQuote(title)}',`);
    if (description) {
      lines.push(`  description: '${escapeQuote(description)}',`);
    }
    lines.push("  author: '',");
    lines.push("  publishedAt: '',");
    lines.push("  className: '',");
    lines.push('});');
  } else {
    lines.push('const props = defineProps({');
    lines.push('  title: {');
    lines.push('    type: String,');
    lines.push(`    default: '${escapeQuote(title)}',`);
    lines.push('  },');
    lines.push('  description: {');
    lines.push('    type: String,');
    lines.push(`    default: '${escapeQuote(description || '')}',`);
    lines.push('  },');
    lines.push('  author: {');
    lines.push('    type: String,');
    lines.push("    default: '',");
    lines.push('  },');
    lines.push('  publishedAt: {');
    lines.push('    type: String,');
    lines.push("    default: '',");
    lines.push('  },');
    lines.push('  className: {');
    lines.push('    type: String,');
    lines.push("    default: '',");
    lines.push('  },');
    lines.push('});');
  }

  // TOC data if present
  if (toc && toc.length > 0) {
    lines.push('');
    lines.push('const tocItems = [');
    for (const entry of toc) {
      lines.push(`  { id: '${escapeQuote(entry.id || '')}', text: '${escapeQuote(entry.text || '')}', level: ${entry.level || 2} },`);
    }
    lines.push('];');
  }

  lines.push('</script>');
  return lines.join('\n');
}

/**
 * Build the <template> block.
 */
function buildTemplateBlock(title, sections, toc, langConfig) {
  const dir = langConfig.direction || 'ltr';
  const lang = langConfig.language || 'en';
  const lines = [];

  lines.push('<template>');
  lines.push(`  <article :class="['article-container', props.className]" dir="${dir}" lang="${lang}">`);

  // Article header
  lines.push('    <header class="article-header">');
  lines.push('      <h1 class="article-title">{{ props.title }}</h1>');
  lines.push('      <div v-if="props.author || props.publishedAt" class="article-meta">');
  lines.push('        <span v-if="props.author" class="article-author">{{ props.author }}</span>');
  lines.push('        <time v-if="props.publishedAt" class="article-date">{{ props.publishedAt }}</time>');
  lines.push('      </div>');
  lines.push('    </header>');

  // Table of contents
  if (toc && toc.length > 0) {
    lines.push('');
    lines.push('    <ArticleToc :items="tocItems" />');
  }

  // Content sections
  lines.push('');
  lines.push('    <div class="article-content">');

  for (const section of sections) {
    const sectionLines = renderSection(section);
    for (const line of sectionLines) {
      lines.push('      ' + line);
    }
  }

  lines.push('    </div>');
  lines.push('  </article>');
  lines.push('</template>');

  return lines.join('\n');
}

/**
 * Render a single content section to template lines.
 */
function renderSection(section) {
  const type = section.type || 'paragraph';
  const content = section.content || '';
  const lines = [];

  switch (type) {
    case 'heading': {
      const level = section.level || 2;
      const tag = `h${Math.min(Math.max(level, 1), 6)}`;
      const id = slugify(content);
      lines.push(`<${tag} id="${id}">${escapeHTML(content)}</${tag}>`);
      break;
    }
    case 'paragraph':
      lines.push(`<p>${escapeHTML(content)}</p>`);
      break;
    case 'image': {
      const src = section.src || '';
      const alt = section.alt || content || '';
      lines.push('<figure class="article-figure">');
      lines.push(`  <img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" loading="lazy" decoding="async" />`);
      if (alt) {
        lines.push(`  <figcaption>${escapeHTML(alt)}</figcaption>`);
      }
      lines.push('</figure>');
      break;
    }
    case 'list': {
      const items = Array.isArray(section.items) ? section.items : [];
      lines.push('<ul>');
      for (const item of items) {
        lines.push(`  <li>${escapeHTML(item)}</li>`);
      }
      lines.push('</ul>');
      break;
    }
    case 'code': {
      const language = section.language || '';
      lines.push(`<pre><code${language ? ` class="language-${escapeAttr(language)}"` : ''}>${escapeHTML(content)}</code></pre>`);
      break;
    }
    case 'blockquote':
      lines.push(`<blockquote><p>${escapeHTML(content)}</p></blockquote>`);
      break;
    default:
      lines.push(`<div>${escapeHTML(content)}</div>`);
  }

  return lines;
}

/**
 * Build the <style scoped> block.
 */
function buildStyleBlock(langConfig, tokens) {
  const dir = langConfig.direction || 'ltr';
  const isRTL = dir === 'rtl';
  const lines = [];

  lines.push('<style scoped>');

  // CSS custom properties from design tokens
  if (tokens && Object.keys(tokens).length > 0) {
    lines.push('.article-container {');
    for (const [key, value] of Object.entries(tokens)) {
      lines.push(`  --${key}: ${value};`);
    }
    lines.push('}');
    lines.push('');
  }

  // Base container styles
  lines.push('.article-container {');
  lines.push('  max-width: 800px;');
  lines.push('  margin: 0 auto;');
  lines.push('  padding: 2rem;');
  lines.push('  font-family: var(--font-family, system-ui, sans-serif);');
  lines.push('  line-height: 1.7;');
  lines.push(`  direction: ${dir};`);
  if (isRTL) {
    lines.push('  text-align: right;');
  }
  lines.push('}');
  lines.push('');

  // Header
  lines.push('.article-header {');
  lines.push('  margin-bottom: 2rem;');
  lines.push('}');
  lines.push('');

  // Title
  lines.push('.article-title {');
  lines.push('  font-size: var(--font-size-title, 2.5rem);');
  lines.push('  font-weight: 700;');
  lines.push('  line-height: 1.2;');
  lines.push('  margin: 0 0 0.5rem 0;');
  lines.push('}');
  lines.push('');

  // Meta
  lines.push('.article-meta {');
  lines.push('  color: var(--color-text-secondary, #666);');
  lines.push('  font-size: 0.9rem;');
  lines.push('  display: flex;');
  lines.push('  gap: 1rem;');
  if (isRTL) {
    lines.push('  flex-direction: row-reverse;');
  }
  lines.push('}');
  lines.push('');

  // Content
  lines.push('.article-content {');
  lines.push('  font-size: var(--font-size-base, 1rem);');
  lines.push('}');
  lines.push('');

  // Images with lazy loading
  lines.push('.article-figure {');
  lines.push('  margin: 1.5rem 0;');
  lines.push('}');
  lines.push('');
  lines.push('.article-figure img {');
  lines.push('  max-width: 100%;');
  lines.push('  height: auto;');
  lines.push('  border-radius: 8px;');
  lines.push('}');
  lines.push('');
  lines.push('.article-figure figcaption {');
  lines.push('  font-size: 0.85rem;');
  lines.push('  color: var(--color-text-secondary, #666);');
  lines.push('  margin-top: 0.5rem;');
  lines.push('}');

  lines.push('</style>');

  return lines.join('\n');
}

/**
 * Generate the ArticleToc child component.
 */
function generateTocComponent(useTypeScript) {
  const lang = useTypeScript ? ' lang="ts"' : '';

  return `<script setup${lang}>
${useTypeScript ? `interface TocItem {
  id: string;
  text: string;
  level: number;
}

defineProps<{
  items: TocItem[];
}>();` : `defineProps({
  items: {
    type: Array,
    required: true,
  },
});`}
</script>

<template>
  <nav class="toc" aria-label="Table of Contents">
    <h2 class="toc-title">Table of Contents</h2>
    <ul class="toc-list">
      <li
        v-for="item in items"
        :key="item.id"
        :class="'toc-item toc-level-' + item.level"
      >
        <a :href="'#' + item.id">{{ item.text }}</a>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.toc {
  background: var(--color-surface, #f8f9fa);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1.5rem 0;
}

.toc-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-item {
  margin: 0.25rem 0;
}

.toc-item a {
  color: var(--color-primary, #007bff);
  text-decoration: none;
}

.toc-item a:hover {
  text-decoration: underline;
}

.toc-level-3 {
  padding-inline-start: 1rem;
}

.toc-level-4 {
  padding-inline-start: 2rem;
}
</style>
`;
}

/**
 * Resolve the output path for the Vue component.
 * Nuxt 3: pages/articles/[slug].vue
 * Plain Vue Router: src/views/[ComponentName].vue
 */
function resolveVueOutputPath(componentName, slug, isNuxt) {
  if (isNuxt) {
    return `pages/articles/${slug}.vue`;
  }
  return `src/views/${componentName}.vue`;
}

/**
 * Resolve the output path for the TOC child component.
 */
function resolveTocComponentPath(isNuxt) {
  if (isNuxt) {
    return 'components/ArticleToc.vue';
  }
  return 'src/components/ArticleToc.vue';
}

// ── Utility functions ──

function toPascalCase(str) {
  return String(str)
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

function slugify(str) {
  return String(str)
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

function escapeQuote(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/\\/g, '\\\\');
}

module.exports = { description, extensions, generate, generateTocComponent, slugify, toPascalCase };
