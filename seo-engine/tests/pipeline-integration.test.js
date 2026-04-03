const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { detectProjectConfig, mapToAdapter } = require('../engine/auto-config');
const { getAdapter, listAdapters } = require('../engine/adapters');
const { getOutputStrategy, getOutputPath } = require('../engine/framework-router');
const { getLanguageConfig, detectLanguage } = require('../engine/language');
const { generateDirectionalCSS } = require('../engine/rtl');
const { PLAN_DEFAULTS } = require('../bridge/supabase-client');

// ── Pipeline Integration: Auto-Config → Adapter → Output ──

describe('Pipeline Integration: Config → Adapter → Output', () => {
  it('Next.js project produces native page.tsx output', async () => {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    // Simulate a Next.js project
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'pipeline-next-'));
    await fs.promises.writeFile(path.join(tmpDir, 'package.json'), JSON.stringify({
      dependencies: { next: '16.0.0', react: '19.0.0', 'react-dom': '19.0.0' }
    }));
    await fs.promises.writeFile(path.join(tmpDir, 'tsconfig.json'), '{}');
    await fs.promises.mkdir(path.join(tmpDir, 'app'), { recursive: true });

    const config = await detectProjectConfig(tmpDir);

    assert.equal(config.framework, 'next');
    assert.equal(config.adapterFramework, 'next');
    assert.equal(config.language, 'typescript');
    assert.equal(config.routerType, 'app');

    // Get adapter and generate
    const adapter = getAdapter(config.adapterFramework);
    const langConfig = getLanguageConfig('en');
    const result = adapter.generate({
      title: 'AI in Football',
      content: '<p>Test content</p>',
      langConfig,
      tokens: {},
      meta: { author: 'Test' },
      sections: [{ id: 'intro', title: 'Introduction' }],
      projectConfig: config
    });

    // Verify output is framework-native
    const page = result.files.find(f => f.path.includes('page.tsx'));
    assert.ok(page, 'Should generate page.tsx');
    assert.ok(page.content.includes("import Image from 'next/image'"), 'Should use next/image');
    assert.ok(page.content.includes('export const metadata'), 'Should export metadata');

    // Verify output path matches framework router
    const outputPath = getOutputPath('next', 'AI in Football');
    assert.ok(outputPath.includes('app/articles/ai-in-football/page.tsx'));

    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it('Vue project produces SFC output', async () => {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'pipeline-vue-'));
    await fs.promises.writeFile(path.join(tmpDir, 'package.json'), JSON.stringify({
      dependencies: { vue: '3.4.0' }
    }));

    const config = await detectProjectConfig(tmpDir);
    assert.equal(config.framework, 'vue');
    assert.equal(config.adapterFramework, 'vue');

    const adapter = getAdapter(config.adapterFramework);
    const result = adapter.generate({
      title: 'Test Article',
      content: '<p>Content</p>',
      langConfig: getLanguageConfig('en'),
      tokens: {},
      meta: {}
    });

    assert.ok(result.files[0].path.endsWith('.vue'));
    assert.ok(result.files[0].content.includes('<template>'));

    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it('Svelte project produces SvelteKit files', async () => {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'pipeline-svelte-'));
    await fs.promises.writeFile(path.join(tmpDir, 'package.json'), JSON.stringify({
      devDependencies: { svelte: '4.0.0', '@sveltejs/kit': '2.0.0' }
    }));

    const config = await detectProjectConfig(tmpDir);
    assert.equal(config.framework, 'svelte');
    assert.equal(config.adapterFramework, 'svelte');

    const adapter = getAdapter(config.adapterFramework);
    const result = adapter.generate({
      title: 'Test',
      content: '<p>Content</p>',
      langConfig: getLanguageConfig('en'),
      tokens: {},
      meta: {}
    });

    assert.ok(result.files.find(f => f.path.includes('+page.svelte')));
    assert.ok(result.files.find(f => f.path.includes('+page.js')));

    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it('Unknown project falls back to HTML adapter', async () => {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'pipeline-empty-'));
    const config = await detectProjectConfig(tmpDir);

    assert.equal(config.framework, 'html');
    assert.equal(config.adapterFramework, undefined); // no package.json → no adapter mapping

    const adapter = getAdapter(config.framework);
    const result = adapter.generate({
      title: 'Test',
      content: '<p>Content</p>',
      langConfig: getLanguageConfig('en'),
      tokens: {},
      meta: {}
    });

    assert.ok(result.files[0].path.endsWith('.html'));
    assert.ok(result.files[0].content.includes('<!DOCTYPE html>'));

    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });
});

// ── Pipeline Integration: Language → RTL → Adapter ──

describe('Pipeline Integration: Language → RTL → Adapter', () => {
  it('Arabic topic produces RTL HTML with correct dir attribute', () => {
    const lang = detectLanguage('الذكاء الاصطناعي في كرة القدم');
    assert.equal(lang, 'ar');

    const langConfig = getLanguageConfig(lang);
    assert.equal(langConfig.isRTL, true);
    assert.equal(langConfig.direction, 'rtl');

    const adapter = getAdapter('html');
    const result = adapter.generate({
      title: 'الذكاء الاصطناعي',
      content: '<p>محتوى المقال</p>',
      langConfig,
      tokens: {},
      meta: {}
    });

    assert.ok(result.files[0].content.includes('dir="rtl"'));
    assert.ok(result.files[0].content.includes('lang="ar"'));
  });

  it('Arabic topic with Next.js adapter produces RTL page', () => {
    const langConfig = getLanguageConfig('ar');
    const adapter = getAdapter('next');
    const result = adapter.generate({
      title: 'الذكاء الاصطناعي',
      content: '<p>محتوى</p>',
      langConfig,
      tokens: {},
      meta: {},
      projectConfig: { language: 'typescript' }
    });

    const page = result.files.find(f => f.path.includes('page.tsx'));
    assert.ok(page.content.includes('dir="rtl"'));
    assert.ok(page.content.includes('lang="ar"'));
  });

  it('RTL CSS includes directional properties', () => {
    const langConfig = getLanguageConfig('ar');
    const css = generateDirectionalCSS(langConfig);
    assert.ok(css.includes('direction: rtl'));
    assert.ok(css.includes('margin-inline-start'));
  });
});

// ── Quota Plan Integration ──

describe('Quota Plan Integration', () => {
  it('all plans have required fields', () => {
    for (const [plan, defaults] of Object.entries(PLAN_DEFAULTS)) {
      assert.ok(typeof defaults.articles_per_month === 'number', `${plan} missing articles_per_month`);
      assert.ok(typeof defaults.edits_per_day === 'number', `${plan} missing edits_per_day`);
      assert.ok(typeof defaults.max_languages === 'number', `${plan} missing max_languages`);
      assert.ok(Array.isArray(defaults.allowed_frameworks), `${plan} missing allowed_frameworks`);
      assert.ok(typeof defaults.api_keys_enabled === 'boolean', `${plan} missing api_keys_enabled`);
    }
  });

  it('free plan restricts framework to html only', () => {
    const free = PLAN_DEFAULTS.free;
    assert.deepEqual(free.allowed_frameworks, ['html']);
    assert.equal(free.api_keys_enabled, false);
  });

  it('starter plan allows react and vue', () => {
    const starter = PLAN_DEFAULTS.starter;
    assert.ok(starter.allowed_frameworks.includes('react'));
    assert.ok(starter.allowed_frameworks.includes('vue'));
    assert.ok(starter.allowed_frameworks.includes('html'));
  });

  it('professional plan allows all frameworks', () => {
    const pro = PLAN_DEFAULTS.professional;
    assert.ok(pro.allowed_frameworks.includes('next'));
    assert.ok(pro.allowed_frameworks.includes('svelte'));
    assert.ok(pro.allowed_frameworks.length >= 5);
  });

  it('enterprise plan has unlimited articles', () => {
    assert.equal(PLAN_DEFAULTS.enterprise.articles_per_month, -1);
  });

  it('framework router strategies cover all pro plan frameworks', () => {
    const proFrameworks = PLAN_DEFAULTS.professional.allowed_frameworks;
    for (const fw of proFrameworks) {
      const strategy = getOutputStrategy(fw);
      assert.ok(strategy, `Missing strategy for ${fw}`);
      assert.ok(strategy.fileExtension, `Missing fileExtension for ${fw}`);
    }
  });

  it('adapters exist for all pro plan frameworks', () => {
    const proFrameworks = PLAN_DEFAULTS.professional.allowed_frameworks;
    for (const fw of proFrameworks) {
      const mapped = mapToAdapter(fw);
      const adapter = getAdapter(mapped);
      assert.ok(adapter, `Missing adapter for ${fw} (mapped: ${mapped})`);
      assert.ok(adapter.generate, `Adapter for ${fw} missing generate()`);
    }
  });
});

// ── Output Strategy Consistency ──

describe('Output Strategy Consistency', () => {
  it('framework router and adapter produce compatible paths', () => {
    const frameworks = ['next', 'react', 'vue', 'svelte', 'html'];
    for (const fw of frameworks) {
      const strategy = getOutputStrategy(fw);
      const mapped = mapToAdapter(fw);
      const adapter = getAdapter(mapped);
      const result = adapter.generate({
        title: 'Test Article',
        content: '<p>Hello</p>',
        langConfig: getLanguageConfig('en'),
        tokens: {},
        meta: {},
        projectConfig: {}
      });

      // Adapter should produce files with correct extension
      const mainFile = result.files[0];
      assert.ok(
        mainFile.path.endsWith(strategy.fileExtension),
        `${fw}: adapter file ${mainFile.path} doesn't match strategy extension ${strategy.fileExtension}`
      );
    }
  });

  it('all adapters return files array with path and content', () => {
    const adapters = listAdapters();
    for (const { name } of adapters) {
      const adapter = getAdapter(name);
      const result = adapter.generate({
        title: 'Test',
        content: '<p>Hi</p>',
        langConfig: getLanguageConfig('en'),
        tokens: {},
        meta: {},
        projectConfig: {}
      });

      assert.ok(Array.isArray(result.files), `${name} adapter should return files array`);
      assert.ok(result.files.length >= 1, `${name} adapter should produce at least 1 file`);
      for (const file of result.files) {
        assert.ok(typeof file.path === 'string', `${name} file missing path`);
        assert.ok(typeof file.content === 'string', `${name} file missing content`);
        assert.ok(file.content.length > 0, `${name} file has empty content`);
      }
    }
  });
});
