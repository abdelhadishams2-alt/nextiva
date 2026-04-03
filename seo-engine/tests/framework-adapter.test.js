/**
 * Framework adapter test suite.
 *
 * Tests adapter creation and rendering for all supported frameworks.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createAdapter, getAvailableAdapters } = require('../bridge/framework-adapter');

// ── Shared test IR ──

const sampleIR = {
  title: 'Test Article',
  sections: [
    { type: 'heading', content: 'Introduction' },
    { type: 'paragraph', content: 'This is the first paragraph.' },
    { type: 'list', items: ['Item one', 'Item two', 'Item three'] },
    { type: 'code', content: 'console.log("hello");' },
    { type: 'image', content: 'A test image', src: '/images/test.png' },
  ],
  designTokens: {
    'color-primary': '#007bff',
    'font-size-base': '16px',
  },
  language: { language: 'en', direction: 'ltr' },
};

const rtlIR = {
  title: 'مقال اختبار',
  sections: [
    { type: 'heading', content: 'مقدمة' },
    { type: 'paragraph', content: 'هذه الفقرة الأولى.' },
  ],
  designTokens: { 'color-primary': '#007bff' },
  language: { language: 'ar', direction: 'rtl' },
};

const emptyIR = {
  title: 'Empty Article',
  sections: [],
  designTokens: {},
  language: { language: 'en', direction: 'ltr' },
};

describe('Framework adapter', () => {

  // ── getAvailableAdapters ──

  it('should return all 5 available adapters', () => {
    const adapters = getAvailableAdapters();
    assert.equal(adapters.length, 5);
    assert.ok(adapters.includes('html'));
    assert.ok(adapters.includes('react'));
    assert.ok(adapters.includes('vue'));
    assert.ok(adapters.includes('svelte'));
    assert.ok(adapters.includes('wordpress'));
  });

  // ── Unknown framework ──

  it('should throw error for unknown framework', () => {
    assert.throws(() => createAdapter('angular'), /Unsupported framework/);
  });

  // ── HTML Adapter ──

  it('should produce valid HTML with DOCTYPE', () => {
    const adapter = createAdapter('html');
    assert.equal(adapter.name, 'html');
    assert.equal(adapter.extension, '.html');
    const output = adapter.render(sampleIR);
    assert.ok(output.startsWith('<!DOCTYPE html>'));
    assert.ok(output.includes('<html'));
    assert.ok(output.includes('</html>'));
  });

  it('should render title in HTML', () => {
    const output = createAdapter('html').render(sampleIR);
    assert.ok(output.includes('<title>Test Article</title>'));
    assert.ok(output.includes('<h1>Test Article</h1>'));
  });

  it('should include design tokens as CSS variables in HTML', () => {
    const output = createAdapter('html').render(sampleIR);
    assert.ok(output.includes('--color-primary: #007bff'));
    assert.ok(output.includes('--font-size-base: 16px'));
  });

  it('should handle RTL direction in HTML', () => {
    const output = createAdapter('html').render(rtlIR);
    assert.ok(output.includes('dir="rtl"'));
    assert.ok(output.includes('lang="ar"'));
  });

  it('should handle empty sections in HTML', () => {
    const output = createAdapter('html').render(emptyIR);
    assert.ok(output.includes('<h1>Empty Article</h1>'));
    assert.ok(output.includes('<!DOCTYPE html>'));
  });

  // ── React Adapter ──

  it('should produce JSX with className (not class)', () => {
    const adapter = createAdapter('react');
    assert.equal(adapter.name, 'react');
    assert.equal(adapter.extension, '.jsx');
    const output = adapter.render(sampleIR);
    assert.ok(output.includes('className'));
    assert.ok(!output.includes(' class='));
  });

  it('should include CSS module import in React', () => {
    const output = createAdapter('react').render(sampleIR);
    assert.ok(output.includes("import styles from"));
    assert.ok(output.includes('.module.css'));
  });

  it('should render title in React', () => {
    const output = createAdapter('react').render(sampleIR);
    assert.ok(output.includes('Test Article'));
  });

  it('should handle RTL in React', () => {
    const output = createAdapter('react').render(rtlIR);
    assert.ok(output.includes('dir="rtl"'));
    assert.ok(output.includes('lang="ar"'));
  });

  it('should apply design tokens in React', () => {
    const output = createAdapter('react').render(sampleIR);
    assert.ok(output.includes('--color-primary'));
  });

  // ── Vue Adapter ──

  it('should produce template, script setup, and scoped style blocks', () => {
    const adapter = createAdapter('vue');
    assert.equal(adapter.name, 'vue');
    assert.equal(adapter.extension, '.vue');
    const output = adapter.render(sampleIR);
    assert.ok(output.includes('<template>'));
    assert.ok(output.includes('<script setup>'));
    assert.ok(output.includes('<style scoped>'));
  });

  it('should render title in Vue', () => {
    const output = createAdapter('vue').render(sampleIR);
    assert.ok(output.includes('{{ title }}'));
    assert.ok(output.includes("'Test Article'"));
  });

  it('should handle RTL in Vue', () => {
    const output = createAdapter('vue').render(rtlIR);
    assert.ok(output.includes('dir="rtl"'));
    assert.ok(output.includes('lang="ar"'));
  });

  it('should apply design tokens in Vue', () => {
    const output = createAdapter('vue').render(sampleIR);
    assert.ok(output.includes('--color-primary'));
  });

  // ── Svelte Adapter ──

  it('should produce valid .svelte structure', () => {
    const adapter = createAdapter('svelte');
    assert.equal(adapter.name, 'svelte');
    assert.equal(adapter.extension, '.svelte');
    const output = adapter.render(sampleIR);
    assert.ok(output.includes('<script>'));
    assert.ok(output.includes('<article'));
    assert.ok(output.includes('<style>'));
    assert.ok(output.includes('{title}'));
  });

  it('should handle RTL in Svelte', () => {
    const output = createAdapter('svelte').render(rtlIR);
    assert.ok(output.includes('dir="rtl"'));
    assert.ok(output.includes('lang="ar"'));
  });

  // ── WordPress Adapter ──

  it('should include PHP tags and wp_enqueue in WordPress', () => {
    const adapter = createAdapter('wordpress');
    assert.equal(adapter.name, 'wordpress');
    assert.equal(adapter.extension, '.php');
    const output = adapter.render(sampleIR);
    assert.ok(output.includes('<?php'));
    assert.ok(output.includes('wp_enqueue_style'));
    assert.ok(output.includes('wp_enqueue_scripts'));
    assert.ok(output.includes('get_header()'));
    assert.ok(output.includes('get_footer()'));
  });

  it('should render title in WordPress', () => {
    const output = createAdapter('wordpress').render(sampleIR);
    assert.ok(output.includes('Test Article'));
    assert.ok(output.includes('esc_html'));
  });

  it('should handle RTL in WordPress', () => {
    const output = createAdapter('wordpress').render(rtlIR);
    assert.ok(output.includes("'rtl'"));
    assert.ok(output.includes("'ar'"));
  });

  it('should apply design tokens in WordPress', () => {
    const output = createAdapter('wordpress').render(sampleIR);
    assert.ok(output.includes('--color-primary'));
  });

  // ── All adapters handle empty sections ──

  it('should handle empty sections gracefully for all adapters', () => {
    for (const name of getAvailableAdapters()) {
      const adapter = createAdapter(name);
      const output = adapter.render(emptyIR);
      assert.ok(output.length > 0, `${name} adapter should produce non-empty output`);
      assert.ok(output.includes('Empty Article'), `${name} adapter should include title`);
    }
  });
});
