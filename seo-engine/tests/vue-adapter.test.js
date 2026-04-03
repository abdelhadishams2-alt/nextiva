/**
 * Vue SFC Adapter test suite.
 *
 * Tests the native Vue 3 SFC adapter for correct output structure,
 * defineProps usage, scoped CSS, TOC child component, lazy image loading,
 * and Nuxt vs plain Vue Router path resolution.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { generate, generateTocComponent, slugify, toPascalCase } = require('../engine/adapters/vue-adapter');

// ── Shared test data ──

const basicIR = {
  title: 'Getting Started with Vue 3',
  slug: 'getting-started-with-vue-3',
  description: 'A comprehensive guide to Vue 3 Composition API.',
  langConfig: { language: 'en', direction: 'ltr' },
  tokens: { 'color-primary': '#42b883', 'font-size-base': '16px' },
  sections: [
    { type: 'heading', content: 'Introduction', level: 2 },
    { type: 'paragraph', content: 'Vue 3 introduces the Composition API.' },
    { type: 'image', content: 'Vue logo', src: '/images/vue-logo.png', alt: 'Vue.js Logo' },
    { type: 'list', items: ['Reactivity', 'Composables', 'Teleport'] },
    { type: 'code', content: 'const count = ref(0);', language: 'typescript' },
    { type: 'blockquote', content: 'Progressive framework for building UIs.' },
  ],
  toc: [
    { id: 'introduction', text: 'Introduction', level: 2 },
    { id: 'setup', text: 'Setup', level: 2 },
    { id: 'advanced', text: 'Advanced', level: 3 },
  ],
  projectConfig: {},
};

const nuxtIR = {
  ...basicIR,
  projectConfig: { framework: 'nuxt', language: 'typescript' },
};

const rtlIR = {
  title: 'Getting Started',
  langConfig: { language: 'ar', direction: 'rtl' },
  tokens: {},
  sections: [
    { type: 'paragraph', content: 'Content in Arabic.' },
  ],
  toc: [],
  projectConfig: {},
};

const minimalIR = {
  title: 'Minimal Article',
  sections: [],
  toc: [],
  projectConfig: {},
};

describe('Vue SFC Adapter', () => {

  // ── Basic structure ──

  it('should generate a .vue file with script setup, template, and style scoped blocks', () => {
    const result = generate(basicIR);
    assert.ok(Array.isArray(result.files));
    assert.ok(result.files.length >= 1);

    const main = result.files[0].content;
    assert.ok(main.includes('<script setup lang="ts">'), 'should have script setup with lang="ts"');
    assert.ok(main.includes('<template>'), 'should have template block');
    assert.ok(main.includes('<style scoped>'), 'should have style scoped block');
  });

  it('should use defineProps for article data', () => {
    const result = generate(basicIR);
    const main = result.files[0].content;
    assert.ok(main.includes('defineProps<ArticleProps>'), 'should use typed defineProps');
    assert.ok(main.includes('interface ArticleProps'), 'should define ArticleProps interface');
    assert.ok(main.includes('title?: string'), 'should have title prop');
  });

  it('should include withDefaults for prop defaults', () => {
    const result = generate(basicIR);
    const main = result.files[0].content;
    assert.ok(main.includes('withDefaults(defineProps'), 'should use withDefaults');
    assert.ok(main.includes("title: 'Getting Started with Vue 3'"), 'should set title default');
  });

  // ── Scoped CSS ──

  it('should include scoped CSS with design tokens as CSS variables', () => {
    const result = generate(basicIR);
    const main = result.files[0].content;
    assert.ok(main.includes('--color-primary: #42b883'), 'should include color-primary token');
    assert.ok(main.includes('--font-size-base: 16px'), 'should include font-size-base token');
  });

  it('should include article container styles', () => {
    const result = generate(basicIR);
    const main = result.files[0].content;
    assert.ok(main.includes('.article-container'), 'should have article-container class');
    assert.ok(main.includes('max-width: 800px'), 'should set max-width');
  });

  // ── TOC as child component ──

  it('should reference ArticleToc child component when TOC entries exist', () => {
    const result = generate(basicIR);
    const main = result.files[0].content;
    assert.ok(main.includes("import ArticleToc from './ArticleToc.vue'"), 'should import ArticleToc');
    assert.ok(main.includes('<ArticleToc :items="tocItems"'), 'should use ArticleToc in template');
    assert.ok(main.includes('const tocItems = ['), 'should define tocItems data');
  });

  it('should generate TOC child component file when TOC entries exist', () => {
    const result = generate(basicIR);
    assert.ok(result.files.length >= 2, 'should generate at least 2 files');
    const tocFile = result.files.find(f => f.path.includes('ArticleToc'));
    assert.ok(tocFile, 'should have an ArticleToc file');
    assert.ok(tocFile.content.includes('<nav class="toc"'), 'TOC should be a nav element');
    assert.ok(tocFile.content.includes('v-for="item in items"'), 'TOC should iterate items');
  });

  it('should NOT include TOC component when no TOC entries', () => {
    const result = generate(minimalIR);
    const main = result.files[0].content;
    assert.ok(!main.includes('ArticleToc'), 'should not reference ArticleToc');
    assert.equal(result.files.length, 1, 'should generate only 1 file');
  });

  // ── Image handling ──

  it('should render images with lazy loading and decoding="async"', () => {
    const result = generate(basicIR);
    const main = result.files[0].content;
    assert.ok(main.includes('loading="lazy"'), 'should have lazy loading');
    assert.ok(main.includes('decoding="async"'), 'should have async decoding');
    assert.ok(main.includes('src="/images/vue-logo.png"'), 'should have correct src');
    assert.ok(main.includes('alt="Vue.js Logo"'), 'should have correct alt');
  });

  it('should wrap images in figure with figcaption', () => {
    const result = generate(basicIR);
    const main = result.files[0].content;
    assert.ok(main.includes('<figure class="article-figure">'), 'should have figure wrapper');
    assert.ok(main.includes('<figcaption>'), 'should have figcaption');
  });

  // ── Content sections ──

  it('should render heading sections with id for anchor links', () => {
    const result = generate(basicIR);
    const main = result.files[0].content;
    assert.ok(main.includes('<h2 id="introduction">Introduction</h2>'), 'should render h2 with id');
  });

  it('should render paragraph sections', () => {
    const result = generate(basicIR);
    const main = result.files[0].content;
    assert.ok(main.includes('<p>Vue 3 introduces the Composition API.</p>'), 'should render paragraph');
  });

  it('should render list sections', () => {
    const result = generate(basicIR);
    const main = result.files[0].content;
    assert.ok(main.includes('<ul>'), 'should have ul');
    assert.ok(main.includes('<li>Reactivity</li>'), 'should have list items');
  });

  it('should render code sections with language class', () => {
    const result = generate(basicIR);
    const main = result.files[0].content;
    assert.ok(main.includes('class="language-typescript"'), 'should have language class');
    assert.ok(main.includes('const count = ref(0);'), 'should have code content');
  });

  it('should render blockquote sections', () => {
    const result = generate(basicIR);
    const main = result.files[0].content;
    assert.ok(main.includes('<blockquote>'), 'should have blockquote');
    assert.ok(main.includes('Progressive framework'), 'should have blockquote content');
  });

  // ── Nuxt 3 output ──

  it('should output to pages/ path for Nuxt projects', () => {
    const result = generate(nuxtIR);
    const mainPath = result.files[0].path;
    assert.ok(mainPath.startsWith('pages/articles/'), 'Nuxt should output to pages/articles/');
    assert.ok(mainPath.endsWith('.vue'), 'should end with .vue');
  });

  it('should include useHead for Nuxt SEO', () => {
    const result = generate(nuxtIR);
    const main = result.files[0].content;
    assert.ok(main.includes('useHead({'), 'should have useHead call');
    assert.ok(main.includes("title: 'Getting Started with Vue 3'"), 'should set page title');
  });

  it('should place TOC component in components/ for Nuxt', () => {
    const result = generate(nuxtIR);
    const tocFile = result.files.find(f => f.path.includes('ArticleToc'));
    assert.ok(tocFile, 'should have TOC component');
    assert.ok(tocFile.path.startsWith('components/'), 'Nuxt TOC should be in components/');
  });

  // ── Plain Vue Router output ──

  it('should output to src/views/ path for plain Vue projects', () => {
    const result = generate(basicIR);
    const mainPath = result.files[0].path;
    assert.ok(mainPath.startsWith('src/views/'), 'Vue should output to src/views/');
  });

  it('should place TOC component in src/components/ for plain Vue', () => {
    const result = generate(basicIR);
    const tocFile = result.files.find(f => f.path.includes('ArticleToc'));
    assert.ok(tocFile, 'should have TOC component');
    assert.ok(tocFile.path.startsWith('src/components/'), 'Vue TOC should be in src/components/');
  });

  // ── RTL support ──

  it('should set dir="rtl" for RTL languages', () => {
    const result = generate(rtlIR);
    const main = result.files[0].content;
    assert.ok(main.includes('dir="rtl"'), 'should set RTL direction');
    assert.ok(main.includes('lang="ar"'), 'should set Arabic language');
  });

  it('should include RTL-specific CSS for RTL languages', () => {
    const result = generate(rtlIR);
    const main = result.files[0].content;
    assert.ok(main.includes('text-align: right'), 'should have text-align right for RTL');
    assert.ok(main.includes('direction: rtl'), 'should set CSS direction');
  });

  // ── Minimal input ──

  it('should handle minimal IR with defaults gracefully', () => {
    const result = generate(minimalIR);
    assert.ok(result.files.length >= 1, 'should produce at least 1 file');
    const main = result.files[0].content;
    assert.ok(main.includes('<script setup lang="ts">'), 'should have script setup');
    assert.ok(main.includes('<template>'), 'should have template');
    assert.ok(main.includes('<style scoped>'), 'should have scoped style');
    assert.ok(main.includes('Minimal Article'), 'should include title');
  });

  // ── Utility functions ──

  it('slugify should produce URL-safe slugs', () => {
    assert.equal(slugify('Hello World!'), 'hello-world');
    assert.equal(slugify('  Multiple   Spaces  '), 'multiple-spaces');
    assert.equal(slugify('Special @#$ chars'), 'special-chars');
  });

  it('toPascalCase should convert strings correctly', () => {
    assert.equal(toPascalCase('hello world'), 'HelloWorld');
    assert.equal(toPascalCase('getting started with vue'), 'GettingStartedWithVue');
  });

  // ── TOC child component ──

  it('generateTocComponent should produce valid Vue SFC with TypeScript', () => {
    const toc = generateTocComponent(true);
    assert.ok(toc.includes('<script setup lang="ts">'), 'should have TS script setup');
    assert.ok(toc.includes('interface TocItem'), 'should define TocItem interface');
    assert.ok(toc.includes('<nav class="toc"'), 'should have nav element');
    assert.ok(toc.includes('aria-label="Table of Contents"'), 'should have aria-label');
    assert.ok(toc.includes('<style scoped>'), 'should have scoped styles');
  });

  it('generateTocComponent should produce valid Vue SFC without TypeScript', () => {
    const toc = generateTocComponent(false);
    assert.ok(toc.includes('<script setup>'), 'should have plain script setup');
    assert.ok(!toc.includes('interface TocItem'), 'should NOT have TS interface');
    assert.ok(toc.includes('type: Array'), 'should use options-style props');
  });
});
