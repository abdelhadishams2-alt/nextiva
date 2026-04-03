/**
 * WordPress Adapter test suite.
 *
 * Tests the WordPress adapter for correct output structure,
 * PHP template generation, WordPress functions usage,
 * Yoast/RankMath SEO compatibility, hero image, sections,
 * code blocks, lists, tables, FAQ schema, and RTL support.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { generate, slugify } = require('../engine/adapters/wordpress-adapter');

// ── Shared test data ──

const basicIR = {
  title: 'Getting Started with WordPress',
  description: 'A comprehensive guide to WordPress development.',
  langConfig: { language: 'en', direction: 'ltr' },
  tokens: {},
  images: [
    { src: '/images/wp-hero.png', alt: 'WordPress Hero', width: 1200, height: 630 },
  ],
  sections: [
    { id: 'intro', title: 'Introduction', content: 'WordPress powers 40% of the web.' },
    { type: 'code', content: 'the_content();', language: 'php', title: 'Content' },
    { type: 'list', items: ['Themes', 'Plugins', 'Blocks'], title: 'Features' },
    { type: 'table', headers: ['Feature', 'Status'], rows: [['Blocks', 'Stable'], ['FSE', 'Beta']], title: 'Comparison' },
    { type: 'image', src: '/images/diagram.png', alt: 'Architecture diagram', title: 'Architecture' },
  ],
  faq: [
    { question: 'What is WordPress?', answer: 'An open-source content management system.' },
  ],
  meta: { author: 'Test Author' },
  projectConfig: {},
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

const noImageIR = {
  title: 'Article Without Images',
  sections: [
    { id: 'intro', title: 'Introduction', content: 'Some content here.' },
  ],
  images: [],
  faq: [],
  meta: {},
  projectConfig: {},
};

describe('WordPress Adapter', () => {

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

  it('should generate a single PHP template file', () => {
    const result = generate(basicIR);
    assert.equal(result.files.length, 1, 'should generate exactly 1 file');
    assert.ok(result.files[0].path.endsWith('.php'), 'should end with .php');
  });

  // ── PHP template structure ──

  it('should have WordPress template header comment', () => {
    const result = generate(basicIR);
    const php = result.files[0].content;
    assert.ok(php.includes('<?php'), 'should start with PHP opening tag');
    assert.ok(php.includes('Template Name:'), 'should have Template Name comment');
    assert.ok(php.includes('Template Post Type:'), 'should have Template Post Type');
  });

  it('should include get_header() and get_footer()', () => {
    const result = generate(basicIR);
    const php = result.files[0].content;
    assert.ok(php.includes('get_header()'), 'should call get_header()');
    assert.ok(php.includes('get_footer()'), 'should call get_footer()');
  });

  it('should use WordPress functions for custom fields', () => {
    const result = generate(basicIR);
    const php = result.files[0].content;
    assert.ok(php.includes('get_post_meta('), 'should use get_post_meta');
    assert.ok(php.includes('get_the_ID()'), 'should use get_the_ID');
    assert.ok(php.includes('get_the_title()'), 'should use get_the_title');
    assert.ok(php.includes('get_the_date('), 'should use get_the_date');
  });

  it('should use esc_html for output escaping', () => {
    const result = generate(basicIR);
    const php = result.files[0].content;
    assert.ok(php.includes('esc_html($article_title)'), 'should escape title output');
    assert.ok(php.includes('esc_html($article_author)'), 'should escape author output');
  });

  it('should use get_the_author as fallback', () => {
    const noAuthorIR = { ...basicIR, meta: {} };
    const result = generate(noAuthorIR);
    const php = result.files[0].content;
    assert.ok(php.includes('get_the_author()'), 'should fallback to get_the_author');
  });

  // ── Hero image ──

  it('should render hero image when provided', () => {
    const result = generate(basicIR);
    const php = result.files[0].content;
    assert.ok(php.includes('/images/wp-hero.png'), 'should have hero image src');
    assert.ok(php.includes('WordPress Hero'), 'should have hero image alt');
    assert.ok(php.includes('chainiq-hero-img'), 'should have hero image class');
  });

  it('should fallback to WordPress featured image when no hero image', () => {
    const result = generate(noImageIR);
    const php = result.files[0].content;
    assert.ok(php.includes('has_post_thumbnail()'), 'should check for post thumbnail');
    assert.ok(php.includes('the_post_thumbnail('), 'should use the_post_thumbnail');
  });

  // ── Sections ──

  it('should render section headings with IDs', () => {
    const result = generate(basicIR);
    const php = result.files[0].content;
    assert.ok(php.includes('id="intro"'), 'should have section heading ID');
    assert.ok(php.includes('chainiq-section-heading'), 'should have section heading class');
    assert.ok(php.includes('Introduction'), 'should have section heading text');
  });

  it('should render code blocks with language class', () => {
    const result = generate(basicIR);
    const php = result.files[0].content;
    assert.ok(php.includes('<pre'), 'should have pre element');
    assert.ok(php.includes('language-php'), 'should have language class');
    assert.ok(php.includes('the_content();'), 'should have code content');
  });

  it('should render lists', () => {
    const result = generate(basicIR);
    const php = result.files[0].content;
    assert.ok(php.includes('<ul'), 'should have ul element');
    assert.ok(php.includes('<li>Themes</li>'), 'should have list items');
    assert.ok(php.includes('chainiq-list'), 'should have list class');
  });

  it('should render tables', () => {
    const result = generate(basicIR);
    const php = result.files[0].content;
    assert.ok(php.includes('<table'), 'should have table element');
    assert.ok(php.includes('chainiq-table'), 'should have table class');
    assert.ok(php.includes('<th>'), 'should have th elements');
    assert.ok(php.includes('Feature'), 'should have header text');
    assert.ok(php.includes('<td>'), 'should have td elements');
  });

  it('should render inline images', () => {
    const result = generate(basicIR);
    const php = result.files[0].content;
    assert.ok(php.includes('/images/diagram.png'), 'should have inline image src');
    assert.ok(php.includes('Architecture diagram'), 'should have inline image alt');
    assert.ok(php.includes('loading="lazy"'), 'should have lazy loading');
  });

  it('should use the_content() when no sections provided', () => {
    const result = generate(minimalIR);
    const php = result.files[0].content;
    assert.ok(php.includes('the_content()'), 'should fallback to the_content()');
  });

  // ── FAQ Schema / SEO ──

  it('should include FAQ schema JSON-LD for Yoast/RankMath compatibility', () => {
    const result = generate(basicIR);
    const php = result.files[0].content;
    assert.ok(php.includes('application/ld+json'), 'should have JSON-LD script');
    assert.ok(php.includes('FAQPage'), 'should have FAQPage type');
    assert.ok(php.includes('What is WordPress?'), 'should have FAQ question');
    assert.ok(php.includes('schema.org'), 'should reference schema.org');
  });

  it('should NOT include FAQ schema when no FAQ items', () => {
    const result = generate(minimalIR);
    const php = result.files[0].content;
    assert.ok(!php.includes('FAQPage'), 'should not have FAQ schema');
  });

  // ── TOC ──

  it('should render table of contents from titled sections', () => {
    const result = generate(basicIR);
    const php = result.files[0].content;
    assert.ok(php.includes('chainiq-toc'), 'should have TOC nav');
    assert.ok(php.includes('Contents'), 'should have TOC heading');
    assert.ok(php.includes('href="#intro"'), 'should have TOC link');
    assert.ok(php.includes('aria-label="Table of Contents"'), 'should have aria-label');
  });

  // ── Edit overlay ──

  it('should include edit overlay with vanilla JS', () => {
    const result = generate(basicIR);
    const php = result.files[0].content;
    assert.ok(php.includes('chainiq-edit-toggle'), 'should have edit toggle button');
    assert.ok(php.includes('chainiq-edit-button'), 'should have edit button class');
    assert.ok(php.includes('addEventListener'), 'should have event listener');
    assert.ok(php.includes('chainiq-overlay-backdrop'), 'should have overlay backdrop');
    assert.ok(php.includes('chainiq-close-button'), 'should have close button');
  });

  it('should use WordPress esc_js for bridge URL', () => {
    const result = generate(basicIR);
    const php = result.files[0].content;
    assert.ok(php.includes('esc_js('), 'should use esc_js for bridge URL');
    assert.ok(php.includes('get_option('), 'should use get_option for bridge URL');
  });

  // ── Inline CSS ──

  it('should include inline CSS styles', () => {
    const result = generate(basicIR);
    const php = result.files[0].content;
    assert.ok(php.includes('<style>'), 'should have style block');
    assert.ok(php.includes('.chainiq-article'), 'should have article class');
    assert.ok(php.includes('.chainiq-article-title'), 'should have title class');
    assert.ok(php.includes('.chainiq-article-layout'), 'should have layout class');
  });

  it('should include responsive CSS', () => {
    const result = generate(basicIR);
    const php = result.files[0].content;
    assert.ok(php.includes('@media'), 'should have media query');
    assert.ok(php.includes('max-width: 1024px'), 'should have responsive breakpoint');
  });

  // ── RTL support ──

  it('should set dir="rtl" for RTL languages', () => {
    const result = generate(rtlIR);
    const php = result.files[0].content;
    assert.ok(php.includes('dir="rtl"'), 'should set RTL direction');
    assert.ok(php.includes('lang="ar"'), 'should set Arabic language');
  });

  it('should include RTL-specific CSS for RTL languages', () => {
    const result = generate(rtlIR);
    const php = result.files[0].content;
    assert.ok(php.includes('text-align: right'), 'should have text-align right for RTL');
    assert.ok(php.includes('direction: rtl'), 'should set CSS direction');
  });

  // ── Output paths ──

  it('should use WordPress template naming convention', () => {
    const result = generate(basicIR);
    const path = result.files[0].path;
    assert.ok(path.startsWith('template-article-'), 'should start with template-article-');
    assert.ok(path.endsWith('.php'), 'should end with .php');
    assert.ok(path.includes('getting-started-with-wordpress'), 'should have slugified title');
  });

  // ── Minimal input ──

  it('should handle minimal IR with defaults gracefully', () => {
    const result = generate(minimalIR);
    assert.ok(result.files.length >= 1, 'should produce at least 1 file');
    const php = result.files[0].content;
    assert.ok(php.includes('<?php'), 'should have PHP opening tag');
    assert.ok(php.includes('get_header()'), 'should have get_header');
    assert.ok(php.includes('get_footer()'), 'should have get_footer');
    assert.ok(php.includes('Minimal Article'), 'should include title');
  });

  // ── Utility ──

  it('slugify should produce URL-safe slugs', () => {
    assert.equal(slugify('Hello World!'), 'hello-world');
    assert.equal(slugify('  Multiple   Spaces  '), 'multiple-spaces');
    assert.equal(slugify('Special @#$ chars'), 'special-chars');
  });
});
