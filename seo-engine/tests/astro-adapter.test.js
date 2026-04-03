/**
 * Astro Adapter test suite.
 *
 * Tests the Astro adapter for correct output structure,
 * frontmatter metadata, island architecture, scoped CSS,
 * hero image, sections, code blocks, lists, tables,
 * FAQ schema, and RTL support.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { generate, slugify } = require('../engine/adapters/astro-adapter');

// ── Shared test data ──

const basicIR = {
  title: 'Getting Started with Astro',
  description: 'A comprehensive guide to Astro framework.',
  langConfig: { language: 'en', direction: 'ltr' },
  tokens: { 'color-primary': '#ff5d01', 'font-size-base': '16px' },
  images: [
    { src: '/images/astro-hero.png', alt: 'Astro Hero', width: 1200, height: 630 },
  ],
  sections: [
    { id: 'intro', title: 'Introduction', content: 'Astro is a web framework for content-driven websites.' },
    { type: 'code', content: 'const data = Astro.props;', language: 'typescript', title: 'Props' },
    { type: 'list', items: ['Islands', 'SSG', 'Markdown'], title: 'Features' },
    { type: 'table', headers: ['Feature', 'Status'], rows: [['SSG', 'Stable'], ['SSR', 'Stable']], title: 'Comparison' },
    { type: 'image', src: '/images/diagram.png', alt: 'Architecture diagram', title: 'Architecture' },
  ],
  faq: [
    { question: 'What is Astro?', answer: 'A web framework for content-driven websites.' },
  ],
  meta: { author: 'Test Author', publishedAt: '2026-01-15' },
  projectConfig: {},
};

const tailwindIR = {
  ...basicIR,
  projectConfig: { cssFramework: 'tailwind' },
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

describe('Astro Adapter', () => {

  // ── Output contract ──

  it('should return { files: [...] } with correct structure', () => {
    const result = generate(basicIR);
    assert.ok(result.files, 'should have files array');
    assert.ok(Array.isArray(result.files), 'files should be an array');
    assert.ok(result.files.length >= 1, 'should generate at least 1 file');
    for (const file of result.files) {
      assert.ok(typeof file.path === 'string', 'file path should be string');
      assert.ok(typeof file.content === 'string', 'file content should be string');
      assert.ok(file.path.length > 0, 'file path should not be empty');
      assert.ok(file.content.length > 0, 'file content should not be empty');
    }
  });

  it('should generate .astro page and EditOverlay component', () => {
    const result = generate(basicIR);
    const paths = result.files.map(f => f.path);
    assert.ok(paths.some(p => p.endsWith('.astro') && p.includes('pages/articles/')), 'should have .astro page');
    assert.ok(paths.some(p => p.includes('EditOverlay')), 'should have EditOverlay component');
  });

  // ── Frontmatter ──

  it('should have frontmatter block with metadata', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.includes('pages/articles/'));
    assert.ok(page.content.startsWith('---'), 'should start with frontmatter delimiter');
    assert.ok(page.content.includes("const title ="), 'should define title constant');
    assert.ok(page.content.includes("const description ="), 'should define description constant');
  });

  it('should import EditOverlay in frontmatter', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.includes('pages/articles/'));
    assert.ok(page.content.includes("import EditOverlay"), 'should import EditOverlay');
  });

  it('should include author and publishedAt when provided', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.includes('pages/articles/'));
    assert.ok(page.content.includes('Test Author'), 'should have author');
    assert.ok(page.content.includes('2026-01-15'), 'should have publishedAt');
  });

  // ── HTML structure ──

  it('should generate full HTML page with head and body', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.includes('pages/articles/'));
    assert.ok(page.content.includes('<html'), 'should have html element');
    assert.ok(page.content.includes('<head>'), 'should have head element');
    assert.ok(page.content.includes('<body>'), 'should have body element');
    assert.ok(page.content.includes('</html>'), 'should close html element');
  });

  it('should have SEO metadata in head', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.includes('pages/articles/'));
    assert.ok(page.content.includes('<title>'), 'should have title tag');
    assert.ok(page.content.includes('meta name="description"'), 'should have meta description');
    assert.ok(page.content.includes('og:title'), 'should have og:title');
    assert.ok(page.content.includes('og:type'), 'should have og:type');
    assert.ok(page.content.includes('charset="utf-8"'), 'should have charset');
    assert.ok(page.content.includes('viewport'), 'should have viewport');
  });

  it('should include og:image when images provided', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.includes('pages/articles/'));
    assert.ok(page.content.includes('og:image'), 'should have og:image');
    assert.ok(page.content.includes('/images/astro-hero.png'), 'should reference hero image');
  });

  // ── Hero image ──

  it('should render hero image', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.includes('pages/articles/'));
    assert.ok(page.content.includes('/images/astro-hero.png'), 'should have hero image src');
    assert.ok(page.content.includes('Astro Hero'), 'should have hero image alt');
  });

  // ── Sections ──

  it('should render section headings with IDs', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.includes('pages/articles/'));
    assert.ok(page.content.includes('id="intro"'), 'should have section heading ID');
    assert.ok(page.content.includes('Introduction'), 'should have section heading text');
  });

  it('should render code blocks with language class', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.includes('pages/articles/'));
    assert.ok(page.content.includes('<pre'), 'should have pre element');
    assert.ok(page.content.includes('language-typescript'), 'should have language class');
    assert.ok(page.content.includes('const data = Astro.props;'), 'should have code content');
  });

  it('should render lists', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.includes('pages/articles/'));
    assert.ok(page.content.includes('<ul'), 'should have ul element');
    assert.ok(page.content.includes('<li>Islands</li>'), 'should have list items');
  });

  it('should render tables', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.includes('pages/articles/'));
    assert.ok(page.content.includes('<table'), 'should have table element');
    assert.ok(page.content.includes('<th'), 'should have th elements');
    assert.ok(page.content.includes('Feature'), 'should have header text');
    assert.ok(page.content.includes('<td'), 'should have td elements');
  });

  it('should render inline images with lazy loading', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.includes('pages/articles/'));
    assert.ok(page.content.includes('/images/diagram.png'), 'should have inline image src');
    assert.ok(page.content.includes('loading="lazy"'), 'should have lazy loading');
  });

  // ── FAQ Schema ──

  it('should include FAQ schema JSON-LD in head', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.includes('pages/articles/'));
    assert.ok(page.content.includes('application/ld+json'), 'should have JSON-LD script');
    assert.ok(page.content.includes('FAQPage'), 'should have FAQPage type');
    assert.ok(page.content.includes('What is Astro?'), 'should have FAQ question');
  });

  it('should NOT include FAQ schema when no FAQ items', () => {
    const result = generate(minimalIR);
    const page = result.files.find(f => f.path.includes('pages/articles/'));
    assert.ok(!page.content.includes('FAQPage'), 'should not have FAQ schema');
  });

  // ── TOC ──

  it('should render table of contents from titled sections', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.includes('pages/articles/'));
    assert.ok(page.content.includes('Contents'), 'should have TOC heading');
    assert.ok(page.content.includes('href="#intro"'), 'should have TOC link');
  });

  // ── Scoped CSS ──

  it('should include scoped CSS when not using Tailwind', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.includes('pages/articles/'));
    assert.ok(page.content.includes('<style>'), 'should have style block');
    assert.ok(page.content.includes('.container'), 'should have container class');
    assert.ok(page.content.includes('.title'), 'should have title class');
  });

  it('should include design tokens as CSS variables', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.includes('pages/articles/'));
    assert.ok(page.content.includes('--color-primary: #ff5d01'), 'should have color-primary token');
    assert.ok(page.content.includes('--font-size-base: 16px'), 'should have font-size-base token');
  });

  it('should NOT include scoped CSS when using Tailwind', () => {
    const result = generate(tailwindIR);
    const page = result.files.find(f => f.path.includes('pages/articles/'));
    // There should be no <style> block at the end of the page for Tailwind
    // (the EditOverlay component has its own style, but the main page should not)
    const mainContent = page.content;
    const lastStyleIndex = mainContent.lastIndexOf('<style>');
    // With tailwind there should be no style block in the main page
    assert.ok(lastStyleIndex === -1, 'should not have style block with Tailwind');
  });

  // ── Island architecture ──

  it('should generate EditOverlay with island architecture (vanilla JS)', () => {
    const result = generate(basicIR);
    const overlay = result.files.find(f => f.path.includes('EditOverlay'));
    assert.ok(overlay, 'should have EditOverlay file');
    assert.ok(overlay.content.includes('---'), 'should have frontmatter delimiters');
    assert.ok(overlay.content.includes('<script>'), 'should have client-side script');
    assert.ok(overlay.content.includes('addEventListener'), 'should have event listeners');
    assert.ok(overlay.content.includes('<style>'), 'should have scoped styles');
    assert.ok(overlay.content.includes('edit-toggle'), 'should have edit toggle button');
  });

  // ── RTL support ──

  it('should set dir="rtl" for RTL languages', () => {
    const result = generate(rtlIR);
    const page = result.files.find(f => f.path.includes('pages/articles/'));
    assert.ok(page.content.includes('dir="rtl"'), 'should set RTL direction');
    assert.ok(page.content.includes('lang="ar"'), 'should set Arabic language');
  });

  it('should include RTL-specific CSS for RTL languages', () => {
    const result = generate(rtlIR);
    const page = result.files.find(f => f.path.includes('pages/articles/'));
    assert.ok(page.content.includes('text-align: right'), 'should have text-align right for RTL');
    assert.ok(page.content.includes('direction: rtl'), 'should set CSS direction');
  });

  // ── Output paths ──

  it('should use Astro page paths', () => {
    const result = generate(basicIR);
    const page = result.files.find(f => f.path.includes('pages/articles/'));
    assert.ok(page.path.startsWith('src/pages/articles/'), 'should be in src/pages/articles/');
    assert.ok(page.path.endsWith('.astro'), 'should end with .astro');
    assert.ok(page.path.includes('getting-started-with-astro'), 'should have slugified title');
  });

  // ── Minimal input ──

  it('should handle minimal IR with defaults gracefully', () => {
    const result = generate(minimalIR);
    assert.ok(result.files.length >= 1, 'should produce at least 1 file');
    const page = result.files.find(f => f.path.includes('pages/articles/'));
    assert.ok(page.content.includes('---'), 'should have frontmatter');
    assert.ok(page.content.includes('<html'), 'should have html element');
    assert.ok(page.content.includes('Minimal Article'), 'should include title');
  });

  // ── Utility ──

  it('slugify should produce URL-safe slugs', () => {
    assert.equal(slugify('Hello World!'), 'hello-world');
    assert.equal(slugify('  Multiple   Spaces  '), 'multiple-spaces');
    assert.equal(slugify('Special @#$ chars'), 'special-chars');
  });
});
