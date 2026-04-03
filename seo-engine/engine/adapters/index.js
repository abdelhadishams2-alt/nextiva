/**
 * Framework Adapter System for ChainIQ Universal Engine.
 *
 * Transforms an intermediate representation (IR) of article content
 * into framework-specific output. Each adapter produces idiomatic code
 * for its target framework.
 */

const htmlAdapter = require('./html');
const reactAdapter = require('./react');
const vueAdapter = require('./vue');
const nextAdapter = require('./next');
const svelteAdapter = require('./svelte');
const astroAdapter = require('./astro');
const wordpressAdapter = require('./wordpress');

const ADAPTERS = {
  html: htmlAdapter,
  react: reactAdapter,
  vue: vueAdapter,
  next: nextAdapter,
  svelte: svelteAdapter,
  astro: astroAdapter,
  wordpress: wordpressAdapter,
};

/**
 * Get an adapter by framework name.
 * Falls back to HTML adapter if framework is unknown.
 *
 * @param {string} framework - 'html', 'react', 'vue', 'svelte', 'wordpress'
 * @returns {object} Adapter with generate() method
 */
function getAdapter(framework) {
  const name = (framework || 'html').toLowerCase();
  return ADAPTERS[name] || ADAPTERS.html;
}

/**
 * List all available adapters
 */
function listAdapters() {
  return Object.keys(ADAPTERS).map(name => ({
    name,
    description: ADAPTERS[name].description,
    extensions: ADAPTERS[name].extensions,
  }));
}

module.exports = { getAdapter, listAdapters, ADAPTERS };
