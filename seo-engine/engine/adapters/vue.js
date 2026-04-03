/**
 * Vue Adapter — Single File Component output.
 *
 * Generates a Vue 3 SFC with Composition API and scoped styles.
 * Compatible with Nuxt, Vite.
 */

const description = 'Vue 3 Single File Component (Composition API)';
const extensions = ['.vue'];

/**
 * Generate a Vue article component.
 *
 * @param {object} ir - Intermediate representation
 * @returns {{ files: Array<{path: string, content: string}> }}
 */
function generate(ir) {
  const { title, content, langConfig, tokens = {} } = ir;
  const componentName = toPascalCase(title);

  const { generateDirectionalCSS } = require('../rtl');
  const css = generateDirectionalCSS({
    direction: langConfig.direction,
    fonts: langConfig.fonts,
    tokens
  }).replace(/\.article-container/g, '.container');

  const sfc = `<script setup>
defineProps({
  className: {
    type: String,
    default: ''
  }
});
</script>

<template>
  <article
    :class="['container', className]"
    dir="${langConfig.direction}"
    lang="${langConfig.language}"
  >
    <h1>${escapeHTML(title)}</h1>
${indent(content || '', 4)}
  </article>
</template>

<style scoped>
${css}
</style>
`;

  return {
    files: [{ path: `${componentName}.vue`, content: sfc }]
  };
}

function toPascalCase(str) {
  return String(str)
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function indent(str, spaces) {
  const pad = ' '.repeat(spaces);
  return str.split('\n').map(line => line ? pad + line : line).join('\n');
}

module.exports = { description, extensions, generate };
