/**
 * Svelte Adapter test suite.
 *
 * Tests the SvelteKit adapter for correct output structure,
 * +page.svelte generation, +page.ts load function, scoped CSS,
 * edit overlay, hero image, sections, code blocks, lists, tables,
 * FAQ schema, and RTL support.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { generate, slugify } = require('../engine/adapters/svelte-adapter');

// ── Shared test data ──

const basicIR = {
  title: 'Getting Started with SvelteKit',
  description: 'A comprehensive guide to SvelteKit.',
  langConfig: { language: 'en', direction: 'ltr' },
  tokens: { 'color-primary': '#ff3e00', 'font-size-base': '16px' },
  images: [
    { src: '/images/svelte-hero.png', alt: 'SvelteKit Hero', width: 1200, height: 630 },
  ],
  sections: [
    { id: 'intro', title: 'Introduction', content: 'SvelteKit is a framework for building web apps.' },
    { type: 'code', content: 'const count = $state(0);', language: 'javascript', title: 'Reactivity' },
    { type: 'list', items: ['Routing', 'SSR', 'SSG'], title: 'Features' },
    { type: 'table', headers: ['Feature', 'Status'], rows: [['SSR', 'Stable'], ['SSG', 'Stable']], title: 'Comparison' },
    { type: 'image', src: '/images/diagram.png', alt: 'Architecture diagram', title: 'Architecture' },
  ],
  faq: [
    { question: 'What is SvelteKit?', answer: 'A framework for building web applications.' },
  ],
  meta: { author: 'Test Author' },
  projectConfig: {},
};

const tailwindIR = {
  ...basicIR,
  projectConfig: { cssFramework: 'tailwind' },
};

const jsIR = {
  ...basicIR,
  projectConfig: { language: 'javascript' },
};

const rtlIR = {
  title: 'Getting Started',
  langConfig: { language: 'ar', direction: 'rtl' },
  tokens: {},
  sections: [
    { id: 'intro', title: 'Introduction', content: 'Content in Arabic.' },
  ],
  images: [],
  faq: [],
  meta: {},
  projectConfig: {},
};

const minimalIR = {
  title: 'Minimal Article',
  sections: [],
  images: [],
  faq: [],
  meta: {},
  projectConfig: {},
};

describe('Svelte Adapter', () => {

  // ── Output contract ──

  it('should return { files: [...] } with correct structure', () => {
    const result = generate(basicIR);
    assert.ok(result.files, 'should have files array');
    assert.ok(Array.isArray(result.files), 'files should be an array');
    assert.ok(result.files.length >= 2, 'should generate at least 2 files');
    for (const file of result.files) {
      assert.ok(typeof file.path === 'string', 'file path should be string');
      assert.ok(typeof file.content === 'string', 'file content should be string');
      assert.ok(file.path.length > 0, 'file path should not be empty');
      assert.ok(file.content.length > 0, 'file content should not be empty');
    }
  });

  it('should generate +page.svelte, +page.ts, and EditOverlay.svelte', () => {
    const result = generate(basicIR);
    const paths = result.files.map(f => f.path);
    assert.ok(paths.some(p => p.endsWith('+page.svelte')), 'should have +page.svelte');
    assert.ok(paths.some(p => p.endsWith('+page.ts')), 'should have +page.ts');
    assert.ok(paths.some(p => p.endsWith('EditOverlay.svelte')), 'should have EditOverlay.svelte');
  });

  it('should generate +page.js for javascript projects', () => {
    const result = generate(jsIR);
    const paths = result.files.map(f => f.path);
    assert.ok(paths.some(p => p.endsWith('+page.js')), 'should have +page.js for JS projects');
  });

  // ── Page component ──

  it('should have svelte:head with SEO metadata', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.endsWith('+page.svelte'));
    assert.ok(page.content.includes('<svelte:head>'), 'should have svelte:head');
    assert.ok(page.content.includes('<title>'), 'should have title tag');
    assert.ok(page.content.includes('meta name="description"'), 'should have meta description');
    assert.ok(page.content.includes('og:title'), 'should have og:title');
    assert.ok(page.content.includes('og:type'), 'should have og:type');
  });

  it('should include og:image when images provided', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.endsWith('+page.svelte'));
    assert.ok(page.content.includes('og:image'), 'should have og:image');
    assert.ok(page.content.includes('/images/svelte-hero.png'), 'should reference hero image src');
  });

  it('should have script block with EditOverlay import and data export', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.endsWith('+page.svelte'));
    assert.ok(page.content.includes('<script>'), 'should have script block');
    assert.ok(page.content.includes("import EditOverlay"), 'should import EditOverlay');
    assert.ok(page.content.includes('export let data'), 'should export data prop');
  });

  // ── Hero image ──

  it('should render hero image', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.endsWith('+page.svelte'));
    assert.ok(page.content.includes('/images/svelte-hero.png'), 'should have hero image src');
    assert.ok(page.content.includes('SvelteKit Hero'), 'should have hero image alt');
  });

  // ── Sections ──

  it('should render section headings with IDs', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.endsWith('+page.svelte'));
    assert.ok(page.content.includes('id="intro"'), 'should have section heading ID');
    assert.ok(page.content.includes('Introduction'), 'should have section heading text');
  });

  it('should render code blocks with language class', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.endsWith('+page.svelte'));
    assert.ok(page.content.includes('<pre'), 'should have pre element');
    assert.ok(page.content.includes('language-javascript'), 'should have language class');
    assert.ok(page.content.includes('const count = $state(0);'), 'should have code content');
  });

  it('should render lists', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.endsWith('+page.svelte'));
    assert.ok(page.content.includes('<ul'), 'should have ul element');
    assert.ok(page.content.includes('<li>Routing</li>'), 'should have list items');
  });

  it('should render tables', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.endsWith('+page.svelte'));
    assert.ok(page.content.includes('<table'), 'should have table element');
    assert.ok(page.content.includes('<th'), 'should have th elements');
    assert.ok(page.content.includes('Feature'), 'should have header text');
    assert.ok(page.content.includes('<td'), 'should have td elements');
  });

  it('should render inline images', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.endsWith('+page.svelte'));
    assert.ok(page.content.includes('/images/diagram.png'), 'should have inline image src');
    assert.ok(page.content.includes('Architecture diagram'), 'should have inline image alt');
  });

  // ── FAQ Schema ──

  it('should include FAQ schema JSON-LD', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.endsWith('+page.svelte'));
    assert.ok(page.content.includes('application/ld+json'), 'should have JSON-LD script');
    assert.ok(page.content.includes('FAQPage'), 'should have FAQPage type');
    assert.ok(page.content.includes('What is SvelteKit?'), 'should have FAQ question');
  });

  it('should NOT include FAQ schema when no FAQ items', () => {
    const result = generate(minimalIR);
    const page = result.files.find(f => f.path.endsWith('+page.svelte'));
    assert.ok(!page.content.includes('FAQPage'), 'should not have FAQ schema');
  });

  // ── TOC ──

  it('should render table of contents from titled sections', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.endsWith('+page.svelte'));
    assert.ok(page.content.includes('Contents'), 'should have TOC heading');
    assert.ok(page.content.includes('href="#intro"'), 'should have TOC links');
  });

  // ── Scoped CSS ──

  it('should include scoped CSS when not using Tailwind', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.endsWith('+page.svelte'));
    assert.ok(page.content.includes('<style>'), 'should have style block');
    assert.ok(page.content.includes('.container'), 'should have container class');
    assert.ok(page.content.includes('.title'), 'should have title class');
    assert.ok(page.content.includes('.hero-image'), 'should have hero-image class');
  });

  it('should include design tokens as CSS variables', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.endsWith('+page.svelte'));
    assert.ok(page.content.includes('--color-primary: #ff3e00'), 'should have color-primary token');
    assert.ok(page.content.includes('--font-size-base: 16px'), 'should have font-size-base token');
  });

  it('should NOT include scoped CSS when using Tailwind', () => {
    const result = generate(tailwindIR);
    const page = result.files.find(f => f.path.endsWith('+page.svelte'));
    assert.ok(!page.content.includes('<style>'), 'should not have style block with Tailwind');
  });

  // ── Load function ──

  it('should generate load function with article data', () => {
    const result = generate(basicIR);
    const load = result.files.find(f => f.path.endsWith('+page.ts'));
    assert.ok(load.content.includes("import type { PageLoad }"), 'should import PageLoad type');
    assert.ok(load.content.includes('export const load'), 'should export load function');
    assert.ok(load.content.includes('Getting Started with SvelteKit'), 'should have title');
    assert.ok(load.content.includes('description'), 'should have description');
  });

  it('should include author in load function when provided', () => {
    const result = generate(basicIR);
    const load = result.files.find(f => f.path.endsWith('+page.ts'));
    assert.ok(load.content.includes('Test Author'), 'should have author');
  });

  // ── Edit overlay ──

  it('should generate EditOverlay.svelte with interactive toggle', () => {
    const result = generate(basicIR);
    const overlay = result.files.find(f => f.path.endsWith('EditOverlay.svelte'));
    assert.ok(overlay, 'should have EditOverlay file');
    assert.ok(overlay.content.includes('let editing'), 'should have editing state');
    assert.ok(overlay.content.includes('on:click'), 'should have click handler');
    assert.ok(overlay.content.includes('{#if'), 'should have Svelte if block');
    assert.ok(overlay.content.includes('{:else}'), 'should have Svelte else block');
    assert.ok(overlay.content.includes('<style>'), 'should have scoped styles');
  });

  // ── RTL support ──

  it('should set dir="rtl" for RTL languages', () => {
    const result = generate(rtlIR);
    const page = result.files.find(f => f.path.endsWith('+page.svelte'));
    assert.ok(page.content.includes('dir="rtl"'), 'should set RTL direction');
    assert.ok(page.content.includes('lang="ar"'), 'should set Arabic language');
  });

  it('should include RTL-specific CSS for RTL languages', () => {
    const result = generate(rtlIR);
    const page = result.files.find(f => f.path.endsWith('+page.svelte'));
    assert.ok(page.content.includes('text-align: right'), 'should have text-align right for RTL');
    assert.ok(page.content.includes('direction: rtl'), 'should set CSS direction');
  });

  // ── Output paths ──

  it('should use SvelteKit route paths', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.endsWith('+page.svelte'));
    assert.ok(page.path.startsWith('src/routes/articles/'), 'should be in src/routes/articles/');
    assert.ok(page.path.includes('getting-started-with-sveltekit'), 'should have slugified title in path');
  });

  // ── Minimal input ──

  it('should handle minimal IR with defaults gracefully', () => {
    const result = generate(minimalIR);
    assert.ok(result.files.length >= 2, 'should produce at least 2 files');
    const page = result.files.find(f => f.path.endsWith('+page.svelte'));
    assert.ok(page.content.includes('<script>'), 'should have script block');
    assert.ok(page.content.includes('svelte:head'), 'should have svelte:head');
    assert.ok(page.content.includes('Minimal Article'), 'should include title');
  });

  // ── Utility ──

  it('slugify should produce URL-safe slugs', () => {
    assert.equal(slugify('Hello World!'), 'hello-world');
    assert.equal(slugify('  Multiple   Spaces  '), 'multiple-spaces');
    assert.equal(slugify('Special @#$ chars'), 'special-chars');
  });
});
