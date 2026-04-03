const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Test supabase client methods structure
const supabase = require('../bridge/supabase-client');

describe('Publisher Hub — Supabase Client Methods', () => {

  it('exports upsertPluginInstance function', () => {
    assert.equal(typeof supabase.upsertPluginInstance, 'function');
  });

  it('exports getPluginConfig function', () => {
    assert.equal(typeof supabase.getPluginConfig, 'function');
  });

  it('exports listPluginInstances function', () => {
    assert.equal(typeof supabase.listPluginInstances, 'function');
  });

  it('exports upsertPluginConfig function', () => {
    assert.equal(typeof supabase.upsertPluginConfig, 'function');
  });

  it('exports getUserAnalyticsDetail function', () => {
    assert.equal(typeof supabase.getUserAnalyticsDetail, 'function');
  });
});

// Test auto-config astro mapping
const { mapToAdapter } = require('../engine/auto-config');

describe('Publisher Hub — Auto-Config Mappings', () => {

  it('maps astro to astro adapter (not html)', () => {
    assert.equal(mapToAdapter('astro'), 'astro');
  });

  it('maps wordpress to wordpress adapter (not html)', () => {
    assert.equal(mapToAdapter('wordpress'), 'wordpress');
  });

  it('maps next to next adapter', () => {
    assert.equal(mapToAdapter('next'), 'next');
  });

  it('maps svelte to svelte adapter', () => {
    assert.equal(mapToAdapter('svelte'), 'svelte');
  });

  it('maps vue to vue adapter', () => {
    assert.equal(mapToAdapter('vue'), 'vue');
  });

  it('maps unknown framework to html fallback', () => {
    assert.equal(mapToAdapter('unknown-framework'), 'html');
  });

  it('maps nuxt to vue adapter', () => {
    assert.equal(mapToAdapter('nuxt'), 'vue');
  });
});

// Test adapter registry
const { getAdapter, ADAPTERS } = require('../engine/adapters');

describe('Publisher Hub — Adapter Registry', () => {

  it('astro adapter is registered', () => {
    assert.ok(ADAPTERS.astro, 'astro should be in ADAPTERS');
    assert.equal(typeof ADAPTERS.astro.generate, 'function');
  });

  it('wordpress adapter is registered', () => {
    assert.ok(ADAPTERS.wordpress, 'wordpress should be in ADAPTERS');
    assert.equal(typeof ADAPTERS.wordpress.generate, 'function');
  });

  it('getAdapter returns astro adapter for astro', () => {
    const adapter = getAdapter('astro');
    assert.equal(adapter, ADAPTERS.astro);
  });

  it('getAdapter returns wordpress adapter for wordpress', () => {
    const adapter = getAdapter('wordpress');
    assert.equal(adapter, ADAPTERS.wordpress);
  });

  it('all 7 adapters are registered', () => {
    const expected = ['html', 'react', 'vue', 'next', 'svelte', 'astro', 'wordpress'];
    for (const name of expected) {
      assert.ok(ADAPTERS[name], `${name} adapter should be registered`);
    }
  });
});

// Test WordPress adapter generates output
describe('Publisher Hub — WordPress Adapter', () => {

  it('generates WordPress-compatible HTML', () => {
    const adapter = getAdapter('wordpress');
    const result = adapter.generate({
      title: 'Test Article',
      content: '<p>Hello world</p>',
      langConfig: { language: 'en', direction: 'ltr', fonts: {} },
      tokens: {},
      meta: { author: 'Test Author' },
    });

    assert.ok(result.files, 'Should return files array');
    assert.equal(result.files.length, 1);
    assert.ok(result.files[0].path.endsWith('.html'));
    assert.ok(result.files[0].content.includes('wp:heading'), 'Should include Gutenberg block comments');
    assert.ok(result.files[0].content.includes('chainiq-article'), 'Should include chainiq-article class');
  });

  it('generates WordPress HTML with RTL support', () => {
    const adapter = getAdapter('wordpress');
    const result = adapter.generate({
      title: 'مقال تجريبي',
      content: '<p>مرحبا بالعالم</p>',
      langConfig: { language: 'ar', direction: 'rtl', fonts: { primary: 'Cairo' } },
      tokens: {},
      meta: {},
    });

    assert.ok(result.files[0].content.includes('dir="rtl"'), 'Should include dir=rtl attribute');
  });

  it('generates WordPress HTML with TOC', () => {
    const adapter = getAdapter('wordpress');
    const result = adapter.generate({
      title: 'TOC Test',
      content: '<p>Content</p>',
      langConfig: { language: 'en', direction: 'ltr', fonts: {} },
      tokens: {},
      meta: {},
      toc: { label: 'Table of Contents', items: [{ id: 'intro', text: 'Introduction' }] },
    });

    assert.ok(result.files[0].content.includes('table-of-contents'), 'Should include TOC block');
    assert.ok(result.files[0].content.includes('Introduction'), 'Should include TOC item');
  });
});
