const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { detectScript, detectLanguage, getLanguageConfig, getSupportedLanguages } = require('../engine/language');
const { generateDirectionalCSS, getHTMLAttributes, isolateLTR } = require('../engine/rtl');
const { getAdapter, listAdapters } = require('../engine/adapters');
const { detectProjectConfig, mapToAdapter, detectShell } = require('../engine/auto-config');

// ── Language Detection ──

describe('Language Detection', () => {
  describe('detectScript', () => {
    it('detects Latin script', () => {
      assert.equal(detectScript('Hello world'), 'latin');
    });
    it('detects Arabic script', () => {
      assert.equal(detectScript('مرحبا بالعالم'), 'arabic');
    });
    it('detects Hebrew script', () => {
      assert.equal(detectScript('שלום עולם'), 'hebrew');
    });
    it('detects CJK script', () => {
      assert.equal(detectScript('你好世界'), 'cjk');
    });
    it('detects Cyrillic script', () => {
      assert.equal(detectScript('Привет мир'), 'cyrillic');
    });
    it('returns latin for empty input', () => {
      assert.equal(detectScript(''), 'latin');
    });
    it('returns latin for null input', () => {
      assert.equal(detectScript(null), 'latin');
    });
  });

  describe('detectLanguage', () => {
    it('detects English from English text', () => {
      assert.equal(detectLanguage('Artificial Intelligence in Healthcare'), 'en');
    });
    it('detects Arabic from Arabic text', () => {
      assert.equal(detectLanguage('الذكاء الاصطناعي في الرعاية الصحية'), 'ar');
    });
    it('detects Hebrew', () => {
      assert.equal(detectLanguage('בינה מלאכותית בבריאות'), 'he');
    });
    it('detects French from French text', () => {
      assert.equal(detectLanguage("L'intelligence artificielle dans les soins de santé et la médecine pour les patients"), 'fr');
    });
    it('detects Russian from Cyrillic text', () => {
      assert.equal(detectLanguage('Искусственный интеллект'), 'ru');
    });
    it('detects Japanese from text with hiragana', () => {
      assert.equal(detectLanguage('人工知能のこと'), 'ja');
    });
    it('detects Chinese from CJK without kana', () => {
      assert.equal(detectLanguage('人工智能'), 'zh');
    });
    it('defaults to English for empty text', () => {
      assert.equal(detectLanguage(''), 'en');
    });
  });

  describe('getLanguageConfig', () => {
    it('returns English config for "en"', () => {
      const config = getLanguageConfig('en');
      assert.equal(config.language, 'en');
      assert.equal(config.direction, 'ltr');
      assert.equal(config.isRTL, false);
    });
    it('returns Arabic config for "ar"', () => {
      const config = getLanguageConfig('ar');
      assert.equal(config.language, 'ar');
      assert.equal(config.direction, 'rtl');
      assert.equal(config.isRTL, true);
      assert.ok(config.fonts.body.includes('Naskh'));
    });
    it('auto-detects from Arabic text', () => {
      const config = getLanguageConfig('الذكاء الاصطناعي');
      assert.equal(config.language, 'ar');
      assert.equal(config.isRTL, true);
    });
    it('auto-detects from English text', () => {
      const config = getLanguageConfig('Machine Learning Applications');
      assert.equal(config.language, 'en');
    });
    it('falls back to English for unknown input', () => {
      const config = getLanguageConfig('xyz123');
      assert.equal(config.language, 'en');
    });
  });

  describe('getSupportedLanguages', () => {
    it('returns array of language objects', () => {
      const langs = getSupportedLanguages();
      assert.ok(Array.isArray(langs));
      assert.ok(langs.length >= 6);
      assert.ok(langs.find(l => l.code === 'ar'));
    });
  });
});

// ── RTL CSS ──

describe('RTL CSS Support', () => {
  describe('generateDirectionalCSS', () => {
    it('generates RTL CSS with direction property', () => {
      const css = generateDirectionalCSS({
        direction: 'rtl',
        fonts: { body: 'Arial', heading: 'Arial' }
      });
      assert.ok(css.includes('direction: rtl'));
      assert.ok(css.includes('unicode-bidi: embed'));
    });

    it('generates LTR CSS', () => {
      const css = generateDirectionalCSS({
        direction: 'ltr',
        fonts: { body: 'system-ui', heading: 'system-ui' }
      });
      assert.ok(css.includes('direction: ltr'));
    });

    it('uses CSS logical properties', () => {
      const css = generateDirectionalCSS({
        direction: 'rtl',
        fonts: { body: 'Arial', heading: 'Arial' }
      });
      assert.ok(css.includes('margin-inline-start'));
      assert.ok(css.includes('padding-inline-start'));
      assert.ok(css.includes('text-align: start'));
    });

    it('isolates code blocks as LTR in RTL context', () => {
      const css = generateDirectionalCSS({
        direction: 'rtl',
        fonts: { body: 'Arial', heading: 'Arial' }
      });
      assert.ok(css.includes('direction: ltr'));
      assert.ok(css.includes('unicode-bidi: isolate'));
    });

    it('includes RTL-specific overrides only for RTL', () => {
      const rtlCSS = generateDirectionalCSS({ direction: 'rtl', fonts: { body: 'a', heading: 'a' } });
      const ltrCSS = generateDirectionalCSS({ direction: 'ltr', fonts: { body: 'a', heading: 'a' } });
      assert.ok(rtlCSS.includes('inset-inline-end'));
      assert.ok(!ltrCSS.includes('inset-inline-end'));
    });
  });

  describe('getHTMLAttributes', () => {
    it('returns dir and lang for RTL', () => {
      const attrs = getHTMLAttributes({ direction: 'rtl', language: 'ar' });
      assert.equal(attrs.dir, 'rtl');
      assert.equal(attrs.lang, 'ar');
    });
  });

  describe('isolateLTR', () => {
    it('wraps content in bidi isolation span', () => {
      const result = isolateLTR('https://example.com');
      assert.ok(result.includes('dir="ltr"'));
      assert.ok(result.includes('unicode-bidi: isolate'));
    });
  });
});

// ── Framework Adapters ──

describe('Framework Adapters', () => {
  const sampleIR = {
    title: 'Test Article',
    content: '<p>Hello world</p>',
    langConfig: getLanguageConfig('en'),
    tokens: {},
    meta: { author: 'Test' }
  };

  describe('listAdapters', () => {
    it('returns available adapters', () => {
      const adapters = listAdapters();
      assert.ok(adapters.length >= 3);
      assert.ok(adapters.find(a => a.name === 'html'));
      assert.ok(adapters.find(a => a.name === 'react'));
      assert.ok(adapters.find(a => a.name === 'vue'));
    });
  });

  describe('getAdapter', () => {
    it('returns html adapter by default', () => {
      const adapter = getAdapter('html');
      assert.ok(adapter.generate);
    });
    it('falls back to html for unknown framework', () => {
      const adapter = getAdapter('unknown');
      assert.ok(adapter.generate);
      assert.equal(adapter.description, getAdapter('html').description);
    });
  });

  describe('HTML adapter', () => {
    it('generates standalone HTML file', () => {
      const result = getAdapter('html').generate(sampleIR);
      assert.ok(result.files.length === 1);
      assert.ok(result.files[0].path.endsWith('.html'));
      assert.ok(result.files[0].content.includes('<!DOCTYPE html>'));
      assert.ok(result.files[0].content.includes('Test Article'));
    });

    it('generates RTL HTML for Arabic', () => {
      const arIR = { ...sampleIR, langConfig: getLanguageConfig('ar') };
      const result = getAdapter('html').generate(arIR);
      assert.ok(result.files[0].content.includes('dir="rtl"'));
      assert.ok(result.files[0].content.includes('lang="ar"'));
    });
  });

  describe('React adapter', () => {
    it('generates JSX component and CSS module', () => {
      const result = getAdapter('react').generate(sampleIR);
      assert.ok(result.files.length === 2);
      assert.ok(result.files.find(f => f.path.endsWith('.tsx')));
      assert.ok(result.files.find(f => f.path.endsWith('.module.css')));
    });

    it('generates valid JSX with className', () => {
      const result = getAdapter('react').generate(sampleIR);
      const jsx = result.files.find(f => f.path.endsWith('.tsx'));
      assert.ok(jsx.content.includes('export default function'));
      assert.ok(jsx.content.includes('className'));
    });
  });

  describe('Vue adapter', () => {
    it('generates Vue SFC', () => {
      const result = getAdapter('vue').generate(sampleIR);
      assert.ok(result.files.length === 1);
      assert.ok(result.files[0].path.endsWith('.vue'));
      assert.ok(result.files[0].content.includes('<script setup>'));
      assert.ok(result.files[0].content.includes('<template>'));
      assert.ok(result.files[0].content.includes('<style scoped>'));
    });
  });

  describe('Next.js adapter', () => {
    it('generates page.tsx with next/image import', () => {
      const nextIR = { ...sampleIR, sections: [{ id: 'intro', title: 'Introduction' }], projectConfig: { language: 'typescript', cssFramework: 'tailwind' } };
      const result = getAdapter('next').generate(nextIR);
      assert.ok(result.files.length >= 2, 'Should generate multiple files');
      const page = result.files.find(f => f.path.includes('page.tsx'));
      assert.ok(page, 'Should have page.tsx');
      assert.ok(page.content.includes("import Image from 'next/image'"), 'Should import next/image');
      assert.ok(page.content.includes('export const metadata'), 'Should export metadata');
    });

    it('generates edit overlay as client component', () => {
      const nextIR = { ...sampleIR, projectConfig: {} };
      const result = getAdapter('next').generate(nextIR);
      const overlay = result.files.find(f => f.path.includes('edit-overlay'));
      assert.ok(overlay, 'Should have edit-overlay');
      assert.ok(overlay.content.includes("'use client'"), 'Should be client component');
    });
  });

  describe('Svelte adapter', () => {
    it('generates SvelteKit page', () => {
      const result = getAdapter('svelte').generate(sampleIR);
      assert.ok(result.files.length === 2, 'Should generate page + load file');
      const page = result.files.find(f => f.path.includes('+page.svelte'));
      assert.ok(page, 'Should have +page.svelte');
      assert.ok(page.content.includes('<script>'), 'Should have script block');
      assert.ok(page.content.includes('<style>'), 'Should have style block');
    });

    it('generates load function', () => {
      const result = getAdapter('svelte').generate(sampleIR);
      const load = result.files.find(f => f.path.includes('+page.js'));
      assert.ok(load, 'Should have +page.js');
      assert.ok(load.content.includes('export function load'), 'Should export load function');
    });
  });
});

// ── Framework Router ──

const { getOutputStrategy, getOutputPath, slugify, listFrameworks, isSupported } = require('../engine/framework-router');

describe('Framework Router', () => {
  it('returns correct strategy for next', () => {
    const strategy = getOutputStrategy('next');
    assert.equal(strategy.name, 'Next.js');
    assert.equal(strategy.fileExtension, '.tsx');
    assert.ok(strategy.imports.includes('next/image'));
  });

  it('returns correct strategy for vue', () => {
    const strategy = getOutputStrategy('vue');
    assert.equal(strategy.name, 'Vue 3');
    assert.equal(strategy.fileExtension, '.vue');
    assert.equal(strategy.cssStrategy, 'scoped');
  });

  it('falls back to html for unknown framework', () => {
    const strategy = getOutputStrategy('unknown');
    assert.equal(strategy.name, 'Standalone HTML');
    assert.equal(strategy.fileExtension, '.html');
  });

  it('overrides CSS strategy based on project config', () => {
    const strategy = getOutputStrategy('react', { cssFramework: 'tailwind' });
    assert.equal(strategy.cssStrategy, 'tailwind');
  });

  it('adjusts Next.js for Pages Router', () => {
    const strategy = getOutputStrategy('next', { routerType: 'pages' });
    assert.ok(strategy.outputDir.includes('pages'));
  });

  it('generates correct output path', () => {
    const outputPath = getOutputPath('next', 'AI in Modern Football');
    assert.ok(outputPath.includes('app/articles/ai-in-modern-football/page.tsx'));
  });

  it('slugifies titles correctly', () => {
    assert.equal(slugify('Hello World'), 'hello-world');
    assert.equal(slugify('AI & ML: The Future!'), 'ai-ml-the-future');
  });

  it('lists all supported frameworks', () => {
    const frameworks = listFrameworks();
    assert.ok(frameworks.length >= 5);
    assert.ok(frameworks.find(f => f.id === 'next'));
    assert.ok(frameworks.find(f => f.id === 'vue'));
    assert.ok(frameworks.find(f => f.id === 'svelte'));
  });

  it('checks supported frameworks', () => {
    assert.equal(isSupported('next'), true);
    assert.equal(isSupported('vue'), true);
    assert.equal(isSupported('flutter'), false);
  });
});

// ── Auto-Config ──

describe('Auto-Config Detection', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'chainiq-test-'));
  });

  after(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it('returns defaults for empty directory', async () => {
    const config = await detectProjectConfig(tmpDir);
    assert.equal(config.packageManager, 'npm');
    assert.equal(config.framework, 'html');
    assert.equal(config.language, 'javascript');
  });

  it('detects npm from package-lock.json', async () => {
    await fs.promises.writeFile(path.join(tmpDir, 'package-lock.json'), '{}');
    const config = await detectProjectConfig(tmpDir);
    assert.equal(config.packageManager, 'npm');
    await fs.promises.unlink(path.join(tmpDir, 'package-lock.json'));
  });

  it('detects Next.js from package.json', async () => {
    await fs.promises.writeFile(path.join(tmpDir, 'package.json'), JSON.stringify({
      dependencies: { next: '16.2.0', react: '19.0.0', 'react-dom': '19.0.0' }
    }));
    const config = await detectProjectConfig(tmpDir);
    assert.equal(config.framework, 'next');
    assert.equal(config.adapterFramework, 'next');
  });

  it('detects TypeScript from tsconfig.json', async () => {
    await fs.promises.writeFile(path.join(tmpDir, 'tsconfig.json'), '{}');
    const config = await detectProjectConfig(tmpDir);
    assert.equal(config.language, 'typescript');
    await fs.promises.unlink(path.join(tmpDir, 'tsconfig.json'));
  });

  it('detects Tailwind CSS', async () => {
    await fs.promises.writeFile(path.join(tmpDir, 'package.json'), JSON.stringify({
      devDependencies: { tailwindcss: '^4.0.0' }
    }));
    const config = await detectProjectConfig(tmpDir);
    assert.equal(config.cssFramework, 'tailwind');
  });

  it('returns defaults for non-existent directory', async () => {
    const config = await detectProjectConfig('/nonexistent/path');
    assert.equal(config.framework, 'html');
  });

  describe('mapToAdapter', () => {
    it('maps next to next', () => assert.equal(mapToAdapter('next'), 'next'));
    it('maps nuxt to vue', () => assert.equal(mapToAdapter('nuxt'), 'vue'));
    it('maps unknown to html', () => assert.equal(mapToAdapter('unknown'), 'html'));
  });

  describe('detectShell', () => {
    it('returns a string', () => {
      const shell = detectShell();
      assert.ok(typeof shell === 'string');
      assert.ok(shell.length > 0);
    });
  });
});
