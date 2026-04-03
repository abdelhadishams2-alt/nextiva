/**
 * Framework adapter factory for ChainIQ Universal Engine.
 * Zero dependencies — uses only Node.js built-ins.
 *
 * Converts an article Intermediate Representation (IR) into
 * framework-specific output: HTML, React, Vue, Svelte, or WordPress.
 */

// ── Available adapter names ──

const ADAPTER_NAMES = ['html', 'react', 'vue', 'svelte', 'wordpress'];

// ── Helper: escape HTML entities ──

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Helper: generate CSS from design tokens ──

function tokensToCSS(tokens) {
  if (!tokens || typeof tokens !== 'object') return '';
  const lines = [];
  for (const [key, value] of Object.entries(tokens)) {
    lines.push(`  --${key}: ${value};`);
  }
  return lines.length ? `:root {\n${lines.join('\n')}\n}` : '';
}

// ── Helper: render sections to HTML content ──

function renderSectionsHtml(sections, indent = '') {
  if (!sections || !Array.isArray(sections) || sections.length === 0) return '';
  const parts = [];
  for (const section of sections) {
    const type = section.type || 'paragraph';
    const content = section.content || '';
    switch (type) {
      case 'heading':
        parts.push(`${indent}<h2>${escapeHtml(content)}</h2>`);
        break;
      case 'paragraph':
        parts.push(`${indent}<p>${escapeHtml(content)}</p>`);
        break;
      case 'image':
        parts.push(`${indent}<figure><img src="${escapeHtml(section.src || '')}" alt="${escapeHtml(content)}" /></figure>`);
        break;
      case 'list': {
        const items = Array.isArray(section.items) ? section.items : [];
        const listItems = items.map(i => `${indent}  <li>${escapeHtml(i)}</li>`).join('\n');
        parts.push(`${indent}<ul>\n${listItems}\n${indent}</ul>`);
        break;
      }
      case 'code':
        parts.push(`${indent}<pre><code>${escapeHtml(content)}</code></pre>`);
        break;
      default:
        parts.push(`${indent}<div>${escapeHtml(content)}</div>`);
    }
  }
  return parts.join('\n');
}

// ── Helper: direction attribute ──

function dirAttr(ir) {
  const lang = ir.language || {};
  return lang.direction === 'rtl' ? ' dir="rtl"' : '';
}

function langAttr(ir) {
  const lang = ir.language || {};
  return lang.language ? ` lang="${lang.language}"` : '';
}

// ── HTML Adapter ──

function htmlAdapter() {
  return {
    name: 'html',
    extension: '.html',
    render(ir) {
      const title = ir.title || 'Untitled';
      const tokenCSS = tokensToCSS(ir.designTokens);
      const dir = dirAttr(ir);
      const lang = langAttr(ir);
      const sectionsHtml = renderSectionsHtml(ir.sections || [], '    ');

      return `<!DOCTYPE html>
<html${lang}${dir}>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
${tokenCSS}
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
  </style>
</head>
<body>
  <article>
    <h1>${escapeHtml(title)}</h1>
${sectionsHtml}
  </article>
</body>
</html>`;
    },
  };
}

// ── React Adapter ──

function reactAdapter() {
  return {
    name: 'react',
    extension: '.jsx',
    render(ir) {
      const title = ir.title || 'Untitled';
      const dir = (ir.language || {}).direction === 'rtl' ? 'rtl' : 'ltr';
      const langCode = (ir.language || {}).language || 'en';
      const tokenVars = {};
      if (ir.designTokens) {
        for (const [key, value] of Object.entries(ir.designTokens)) {
          tokenVars[`--${key}`] = value;
        }
      }
      const styleObj = JSON.stringify(tokenVars, null, 2);

      const sectionJsx = (ir.sections || []).map(section => {
        const type = section.type || 'paragraph';
        const content = section.content || '';
        switch (type) {
          case 'heading':
            return `      <h2>${content}</h2>`;
          case 'paragraph':
            return `      <p>${content}</p>`;
          case 'image':
            return `      <figure><img src="${section.src || ''}" alt="${content}" /></figure>`;
          case 'list': {
            const items = (section.items || []).map(i => `          <li>${i}</li>`).join('\n');
            return `      <ul>\n${items}\n      </ul>`;
          }
          case 'code':
            return `      <pre><code>${content}</code></pre>`;
          default:
            return `      <div>${content}</div>`;
        }
      }).join('\n');

      return `import React from 'react';
import styles from './Article.module.css';

export default function Article() {
  const designTokens = ${styleObj};

  return (
    <article className={styles.article} dir="${dir}" lang="${langCode}" style={designTokens}>
      <h1 className={styles.title}>${title}</h1>
${sectionJsx}
    </article>
  );
}`;
    },
  };
}

// ── Vue Adapter ──

function vueAdapter() {
  return {
    name: 'vue',
    extension: '.vue',
    render(ir) {
      const title = ir.title || 'Untitled';
      const dir = (ir.language || {}).direction === 'rtl' ? 'rtl' : 'ltr';
      const langCode = (ir.language || {}).language || 'en';
      const sectionsHtml = renderSectionsHtml(ir.sections || [], '      ');
      const tokenCSS = tokensToCSS(ir.designTokens);

      return `<template>
  <article dir="${dir}" lang="${langCode}">
    <h1>{{ title }}</h1>
${sectionsHtml ? sectionsHtml.split('\n').map(l => '    ' + l).join('\n') : ''}
  </article>
</template>

<script setup>
import { ref } from 'vue';

const title = ref('${title.replace(/'/g, "\\'")}');
</script>

<style scoped>
${tokenCSS}
article { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
</style>`;
    },
  };
}

// ── Svelte Adapter ──

function svelteAdapter() {
  return {
    name: 'svelte',
    extension: '.svelte',
    render(ir) {
      const title = ir.title || 'Untitled';
      const dir = (ir.language || {}).direction === 'rtl' ? 'rtl' : 'ltr';
      const langCode = (ir.language || {}).language || 'en';
      const sectionsHtml = renderSectionsHtml(ir.sections || [], '    ');
      const tokenCSS = tokensToCSS(ir.designTokens);

      return `<script>
  let title = '${title.replace(/'/g, "\\'")}';
</script>

<article dir="${dir}" lang="${langCode}">
  <h1>{title}</h1>
${sectionsHtml}
</article>

<style>
${tokenCSS}
  article { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
</style>`;
    },
  };
}

// ── WordPress Adapter ──

function wordpressAdapter() {
  return {
    name: 'wordpress',
    extension: '.php',
    render(ir) {
      const title = ir.title || 'Untitled';
      const dir = (ir.language || {}).direction === 'rtl' ? 'rtl' : 'ltr';
      const langCode = (ir.language || {}).language || 'en';
      const sectionsHtml = renderSectionsHtml(ir.sections || [], '    ');
      const tokenCSS = tokensToCSS(ir.designTokens);

      return `<?php
/**
 * Template: ${title}
 * Generated by ChainIQ Universal Engine
 */

// Enqueue styles
function chainiq_article_styles() {
  wp_enqueue_style('chainiq-article', get_template_directory_uri() . '/assets/css/article.css');
}
add_action('wp_enqueue_scripts', 'chainiq_article_styles');

get_header();
?>

<article dir="<?php echo esc_attr('${dir}'); ?>" lang="<?php echo esc_attr('${langCode}'); ?>">
  <h1><?php echo esc_html('${title.replace(/'/g, "\\'")}'); ?></h1>
${sectionsHtml}
</article>

<style>
${tokenCSS}
  article { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
</style>

<?php get_footer(); ?>`;
    },
  };
}

// ── Adapter registry ──

const ADAPTERS = {
  html: htmlAdapter,
  react: reactAdapter,
  vue: vueAdapter,
  svelte: svelteAdapter,
  wordpress: wordpressAdapter,
};

/**
 * Create a framework adapter.
 *
 * @param {string} framework - One of: 'html', 'react', 'vue', 'svelte', 'wordpress'
 * @returns {{ name: string, extension: string, render: function }}
 * @throws {Error} If framework is not supported
 */
function createAdapter(framework) {
  const factory = ADAPTERS[framework];
  if (!factory) {
    throw new Error(`Unsupported framework: "${framework}". Available: ${ADAPTER_NAMES.join(', ')}`);
  }
  return factory();
}

/**
 * Get the list of all available adapter names.
 *
 * @returns {string[]}
 */
function getAvailableAdapters() {
  return [...ADAPTER_NAMES];
}

module.exports = { createAdapter, getAvailableAdapters };
