/**
 * Tests for engine/framework-router.js
 *
 * Covers:
 * - Strategy resolution for each supported framework
 * - Output path generation via resolveOutputPath
 * - Fallback to HTML when framework is unknown or missing
 * - Project config overrides (CSS, TypeScript, router type, Nuxt)
 * - Slug generation edge cases
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  OUTPUT_STRATEGIES,
  getOutputStrategy,
  getOutputPath,
  resolveOutputPath,
  getSuggestedArticleDir,
  slugify,
  listFrameworks,
  isSupported,
} = require('../engine/framework-router');

// ---------------------------------------------------------------------------
// OUTPUT_STRATEGIES structure
// ---------------------------------------------------------------------------

describe('OUTPUT_STRATEGIES', () => {
  const requiredFrameworks = ['next', 'vue', 'svelte', 'astro', 'wordpress', 'html'];

  it('contains all 6 required frameworks', () => {
    for (const fw of requiredFrameworks) {
      assert.ok(OUTPUT_STRATEGIES[fw], `Missing strategy for framework: ${fw}`);
    }
  });

  it('also contains react as a bonus framework', () => {
    assert.ok(OUTPUT_STRATEGIES.react);
  });

  const requiredFields = [
    'fileExtension', 'outputPath', 'wrapper', 'imports',
    'cssStrategy', 'imageComponent', 'features',
  ];

  for (const [key, strategy] of Object.entries(OUTPUT_STRATEGIES)) {
    it(`${key} strategy has all required fields`, () => {
      for (const field of requiredFields) {
        assert.ok(
          field in strategy,
          `Strategy '${key}' missing field '${field}'`
        );
      }
    });

    it(`${key} strategy has editOverlay field`, () => {
      assert.ok(
        'editOverlay' in strategy,
        `Strategy '${key}' missing editOverlay`
      );
      assert.ok(
        ['client-component', 'vanilla-js'].includes(strategy.editOverlay),
        `Strategy '${key}' has invalid editOverlay: ${strategy.editOverlay}`
      );
    });

    it(`${key} strategy outputPath contains {slug} placeholder`, () => {
      assert.ok(
        strategy.outputPath.includes('{slug}'),
        `Strategy '${key}' outputPath '${strategy.outputPath}' must include {slug}`
      );
    });
  }
});

// ---------------------------------------------------------------------------
// getOutputStrategy
// ---------------------------------------------------------------------------

describe('getOutputStrategy', () => {
  it('returns next strategy for "next"', () => {
    const s = getOutputStrategy('next');
    assert.equal(s.name, 'Next.js');
    assert.equal(s.fileExtension, '.tsx');
    assert.equal(s.imageComponent, 'Image');
  });

  it('returns vue strategy for "vue"', () => {
    const s = getOutputStrategy('vue');
    assert.equal(s.name, 'Vue 3');
    assert.equal(s.fileExtension, '.vue');
    assert.equal(s.cssStrategy, 'scoped');
  });

  it('returns svelte strategy for "svelte"', () => {
    const s = getOutputStrategy('svelte');
    assert.equal(s.name, 'SvelteKit');
    assert.equal(s.fileExtension, '.svelte');
    assert.ok(s.features.includes('load-function'));
  });

  it('returns astro strategy for "astro"', () => {
    const s = getOutputStrategy('astro');
    assert.equal(s.name, 'Astro');
    assert.equal(s.fileExtension, '.astro');
    assert.equal(s.imageComponent, 'Image');
  });

  it('returns wordpress strategy for "wordpress"', () => {
    const s = getOutputStrategy('wordpress');
    assert.equal(s.name, 'WordPress');
    assert.equal(s.fileExtension, '.php');
    assert.equal(s.cssStrategy, 'inline');
  });

  it('returns html strategy for "html"', () => {
    const s = getOutputStrategy('html');
    assert.equal(s.name, 'Standalone HTML');
    assert.equal(s.fileExtension, '.html');
    assert.equal(s.cssStrategy, 'inline');
  });

  it('falls back to HTML for unknown framework', () => {
    const s = getOutputStrategy('unknown-framework');
    assert.equal(s.name, 'Standalone HTML');
    assert.equal(s.fileExtension, '.html');
  });

  it('falls back to HTML for null/undefined', () => {
    assert.equal(getOutputStrategy(null).name, 'Standalone HTML');
    assert.equal(getOutputStrategy(undefined).name, 'Standalone HTML');
    assert.equal(getOutputStrategy('').name, 'Standalone HTML');
  });

  it('is case insensitive', () => {
    assert.equal(getOutputStrategy('NEXT').name, 'Next.js');
    assert.equal(getOutputStrategy('Vue').name, 'Vue 3');
    assert.equal(getOutputStrategy('HTML').name, 'Standalone HTML');
  });

  // Project config overrides
  it('overrides CSS strategy to tailwind when detected', () => {
    const s = getOutputStrategy('vue', { cssFramework: 'tailwind' });
    assert.equal(s.cssStrategy, 'tailwind');
  });

  it('does NOT override CSS to tailwind for HTML', () => {
    const s = getOutputStrategy('html', { cssFramework: 'tailwind' });
    assert.equal(s.cssStrategy, 'inline');
  });

  it('adjusts extension to .jsx for JS-only projects', () => {
    const s = getOutputStrategy('next', { language: 'javascript' });
    assert.equal(s.fileExtension, '.jsx');
  });

  it('keeps .tsx for TypeScript projects', () => {
    const s = getOutputStrategy('next', { language: 'typescript' });
    assert.equal(s.fileExtension, '.tsx');
  });

  it('adjusts Next.js for pages router', () => {
    const s = getOutputStrategy('next', { routerType: 'pages' });
    assert.equal(s.outputDir, 'pages/articles');
    assert.ok(s.features.includes('pages-router'));
  });

  it('adjusts Vue for Nuxt', () => {
    const s = getOutputStrategy('vue', { framework: 'nuxt' });
    assert.equal(s.name, 'Nuxt');
    assert.equal(s.outputDir, 'pages/articles');
    assert.ok(s.features.includes('nuxt-page'));
  });
});

// ---------------------------------------------------------------------------
// resolveOutputPath
// ---------------------------------------------------------------------------

describe('resolveOutputPath', () => {
  it('substitutes {slug} in next strategy', () => {
    const s = getOutputStrategy('next');
    const result = resolveOutputPath(s, 'my-article');
    assert.equal(result, 'app/articles/my-article/page.tsx');
  });

  it('substitutes {slug} in html strategy', () => {
    const s = getOutputStrategy('html');
    const result = resolveOutputPath(s, 'hello-world');
    assert.equal(result, 'articles/hello-world.html');
  });

  it('substitutes {slug} in vue strategy', () => {
    const s = getOutputStrategy('vue');
    const result = resolveOutputPath(s, 'test-article');
    assert.equal(result, 'src/views/test-article.vue');
  });

  it('substitutes {slug} in svelte strategy', () => {
    const s = getOutputStrategy('svelte');
    const result = resolveOutputPath(s, 'my-post');
    assert.equal(result, 'src/routes/articles/my-post/+page.svelte');
  });

  it('substitutes {slug} in astro strategy', () => {
    const s = getOutputStrategy('astro');
    const result = resolveOutputPath(s, 'astro-post');
    assert.equal(result, 'src/pages/articles/astro-post.astro');
  });

  it('substitutes {slug} in wordpress strategy', () => {
    const s = getOutputStrategy('wordpress');
    const result = resolveOutputPath(s, 'wp-article');
    assert.equal(result, 'wp-article.php');
  });

  it('handles fallback when strategy has no outputPath', () => {
    const result = resolveOutputPath({ outputDir: 'posts', fileExtension: '.md' }, 'test');
    assert.equal(result, 'posts/test.md');
  });

  it('handles null/undefined strategy gracefully', () => {
    const result = resolveOutputPath(null, 'test');
    assert.equal(result, 'articles/test.html');
  });

  it('handles empty strategy object', () => {
    const result = resolveOutputPath({}, 'test');
    assert.equal(result, 'articles/test.html');
  });
});

// ---------------------------------------------------------------------------
// getOutputPath (higher-level, uses framework + title)
// ---------------------------------------------------------------------------

describe('getOutputPath', () => {
  it('generates correct path for Next.js', () => {
    const result = getOutputPath('next', 'My Great Article');
    assert.equal(result, 'app/articles/my-great-article/page.tsx');
  });

  it('generates correct path for HTML', () => {
    const result = getOutputPath('html', 'Hello World');
    assert.equal(result, 'articles/hello-world.html');
  });

  it('generates correct path for SvelteKit', () => {
    const result = getOutputPath('svelte', 'Svelte Post');
    assert.equal(result, 'src/routes/articles/svelte-post/+page.svelte');
  });

  it('uses detected article directory when available', () => {
    const config = {
      detectedArticlePath: {
        articleDirectory: 'content/blog',
        namingConvention: 'slug-based',
      },
    };
    const result = getOutputPath('html', 'Test', config);
    assert.equal(result, 'content/blog/test.html');
  });

  it('uses directory-based convention for Next.js with detected path', () => {
    const config = {
      detectedArticlePath: {
        articleDirectory: 'app/blog',
        namingConvention: 'directory-based',
      },
    };
    const result = getOutputPath('next', 'My Post', config);
    assert.equal(result, 'app/blog/my-post/page.tsx');
  });

  it('falls back to HTML for unknown framework', () => {
    const result = getOutputPath('unknown', 'Test Title');
    assert.ok(result.endsWith('.html'));
  });
});

// ---------------------------------------------------------------------------
// slugify
// ---------------------------------------------------------------------------

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    assert.equal(slugify('Hello World'), 'hello-world');
  });

  it('removes special characters', () => {
    assert.equal(slugify("What's New in AI?"), 'whats-new-in-ai');
  });

  it('collapses multiple hyphens', () => {
    assert.equal(slugify('hello---world'), 'hello-world');
  });

  it('trims leading and trailing hyphens', () => {
    assert.equal(slugify('--hello--'), 'hello');
  });

  it('truncates to 80 characters', () => {
    const long = 'a'.repeat(100);
    assert.ok(slugify(long).length <= 80);
  });

  it('handles empty string', () => {
    assert.equal(slugify(''), '');
  });
});

// ---------------------------------------------------------------------------
// Edit overlay strategy
// ---------------------------------------------------------------------------

describe('edit overlay strategy', () => {
  it('Next.js uses client-component overlay', () => {
    const s = getOutputStrategy('next');
    assert.equal(s.editOverlay, 'client-component');
  });

  it('React uses client-component overlay', () => {
    const s = getOutputStrategy('react');
    assert.equal(s.editOverlay, 'client-component');
  });

  it('HTML uses vanilla-js overlay', () => {
    const s = getOutputStrategy('html');
    assert.equal(s.editOverlay, 'vanilla-js');
  });

  it('Vue uses vanilla-js overlay', () => {
    const s = getOutputStrategy('vue');
    assert.equal(s.editOverlay, 'vanilla-js');
  });

  it('Svelte uses vanilla-js overlay', () => {
    const s = getOutputStrategy('svelte');
    assert.equal(s.editOverlay, 'vanilla-js');
  });

  it('WordPress uses vanilla-js overlay', () => {
    const s = getOutputStrategy('wordpress');
    assert.equal(s.editOverlay, 'vanilla-js');
  });

  it('Astro uses vanilla-js overlay', () => {
    const s = getOutputStrategy('astro');
    assert.equal(s.editOverlay, 'vanilla-js');
  });
});

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

describe('listFrameworks', () => {
  it('returns array of all frameworks', () => {
    const list = listFrameworks();
    assert.ok(Array.isArray(list));
    assert.ok(list.length >= 7);
    const ids = list.map(f => f.id);
    assert.ok(ids.includes('next'));
    assert.ok(ids.includes('html'));
    assert.ok(ids.includes('vue'));
  });
});

describe('isSupported', () => {
  it('returns true for supported frameworks', () => {
    assert.ok(isSupported('next'));
    assert.ok(isSupported('html'));
    assert.ok(isSupported('vue'));
    assert.ok(isSupported('svelte'));
    assert.ok(isSupported('astro'));
    assert.ok(isSupported('wordpress'));
  });

  it('returns false for unsupported frameworks', () => {
    assert.ok(!isSupported('angular'));
    assert.ok(!isSupported(''));
    assert.ok(!isSupported(null));
    assert.ok(!isSupported(undefined));
  });
});

describe('getSuggestedArticleDir', () => {
  it('returns outputDir for known framework', () => {
    assert.equal(getSuggestedArticleDir('next'), 'app/articles');
    assert.equal(getSuggestedArticleDir('svelte'), 'src/routes/articles');
  });

  it('returns "articles" for HTML', () => {
    assert.equal(getSuggestedArticleDir('html'), 'articles');
  });

  it('returns "articles" for unknown framework', () => {
    assert.equal(getSuggestedArticleDir('unknown'), 'articles');
  });
});
