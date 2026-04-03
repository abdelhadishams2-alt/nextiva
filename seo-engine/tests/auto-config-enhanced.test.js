/**
 * Enhanced auto-config test suite.
 *
 * Tests the new detection capabilities added to engine/auto-config.js:
 *   - Next.js App Router vs Pages Router
 *   - Nuxt 3 vs Nuxt 2
 *   - Component library detection (shadcn/ui, Vuetify, Material UI, Chakra)
 *   - Existing blog/article pattern scanning
 *   - TypeScript strictness from tsconfig.json
 *   - Image strategy detection
 *   - New config output fields
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  detectProjectConfig,
  detectComponentLibrary,
  detectImageStrategy,
  detectTypeScriptConfig,
  detectNuxtVersion,
} = require('../engine/auto-config');

// ── Helpers ──

let tmpBase;

async function makeTmpDir(name) {
  const dir = path.join(tmpBase, name);
  await fs.promises.mkdir(dir, { recursive: true });
  return dir;
}

async function writeFile(dir, filename, content = '') {
  const filePath = path.join(dir, filename);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, content, 'utf-8');
}

async function makeDir(dir, subdir) {
  await fs.promises.mkdir(path.join(dir, subdir), { recursive: true });
}

function pkgJson(deps = {}, devDeps = {}) {
  return JSON.stringify({ dependencies: deps, devDependencies: devDeps });
}

describe('Enhanced auto-config detection', () => {

  before(async () => {
    tmpBase = path.join(os.tmpdir(), `chainiq-enhanced-test-${Date.now()}`);
    await fs.promises.mkdir(tmpBase, { recursive: true });
  });

  after(async () => {
    await fs.promises.rm(tmpBase, { recursive: true, force: true });
  });

  // ── Next.js App Router vs Pages Router ──

  describe('Next.js router type detection', () => {

    it('should detect App Router when app/ directory exists', async () => {
      const dir = await makeTmpDir('next-app-router');
      await writeFile(dir, 'package.json', pkgJson({ next: '^14.0.0', react: '^18.0.0' }));
      await makeDir(dir, 'app');
      const config = await detectProjectConfig(dir);
      assert.equal(config.framework, 'next');
      assert.equal(config.routerType, 'app');
    });

    it('should detect App Router when src/app/ directory exists', async () => {
      const dir = await makeTmpDir('next-src-app-router');
      await writeFile(dir, 'package.json', pkgJson({ next: '^14.0.0', react: '^18.0.0' }));
      await makeDir(dir, 'src/app');
      const config = await detectProjectConfig(dir);
      assert.equal(config.routerType, 'app');
    });

    it('should detect Pages Router when only pages/ directory exists', async () => {
      const dir = await makeTmpDir('next-pages-router');
      await writeFile(dir, 'package.json', pkgJson({ next: '^12.0.0', react: '^18.0.0' }));
      await makeDir(dir, 'pages');
      const config = await detectProjectConfig(dir);
      assert.equal(config.routerType, 'pages');
    });

    it('should default to App Router when neither app/ nor pages/ exists for Next.js', async () => {
      const dir = await makeTmpDir('next-no-dirs');
      await writeFile(dir, 'package.json', pkgJson({ next: '^14.0.0', react: '^18.0.0' }));
      const config = await detectProjectConfig(dir);
      assert.equal(config.routerType, 'app');
    });
  });

  // ── Nuxt 3 vs Nuxt 2 ──

  describe('Nuxt version detection', () => {

    it('should detect Nuxt 3 from nuxt.config.ts', async () => {
      const dir = await makeTmpDir('nuxt3-ts');
      await writeFile(dir, 'package.json', pkgJson({ nuxt: '^3.8.0', vue: '^3.3.0' }));
      await writeFile(dir, 'nuxt.config.ts', 'export default defineNuxtConfig({})');
      const config = await detectProjectConfig(dir);
      assert.equal(config.framework, 'nuxt');
      assert.equal(config.routerType, 'nuxt3');
    });

    it('should detect Nuxt 2 from nuxt.config.js with version 2.x', async () => {
      const dir = await makeTmpDir('nuxt2-js');
      await writeFile(dir, 'package.json', pkgJson({ nuxt: '^2.15.0' }));
      await writeFile(dir, 'nuxt.config.js', 'module.exports = {}');
      const config = await detectProjectConfig(dir);
      assert.equal(config.framework, 'nuxt');
      assert.equal(config.routerType, 'nuxt2');
    });

    it('should detect Nuxt 3 from version >= 3 in package.json', async () => {
      const dir = await makeTmpDir('nuxt3-version');
      await writeFile(dir, 'package.json', pkgJson({ nuxt: '3.9.0', vue: '^3.3.0' }));
      const config = await detectProjectConfig(dir);
      assert.equal(config.framework, 'nuxt');
      assert.equal(config.routerType, 'nuxt3');
    });
  });

  // ── Component library detection ──

  describe('Component library detection', () => {

    it('should detect shadcn/ui from @radix-ui/react-dialog', async () => {
      const dir = await makeTmpDir('shadcn-project');
      await writeFile(dir, 'package.json', pkgJson(
        { react: '^18.0.0', '@radix-ui/react-dialog': '^1.0.0' }
      ));
      const config = await detectProjectConfig(dir);
      assert.equal(config.componentLibrary, 'shadcn');
    });

    it('should detect Vuetify', async () => {
      const dir = await makeTmpDir('vuetify-project');
      await writeFile(dir, 'package.json', pkgJson({ vue: '^3.0.0', vuetify: '^3.0.0' }));
      const config = await detectProjectConfig(dir);
      assert.equal(config.componentLibrary, 'vuetify');
    });

    it('should detect Material UI', async () => {
      const dir = await makeTmpDir('mui-project');
      await writeFile(dir, 'package.json', pkgJson(
        { react: '^18.0.0', '@mui/material': '^5.0.0' }
      ));
      const config = await detectProjectConfig(dir);
      assert.equal(config.componentLibrary, 'material-ui');
    });

    it('should detect Chakra UI', async () => {
      const dir = await makeTmpDir('chakra-project');
      await writeFile(dir, 'package.json', pkgJson(
        { react: '^18.0.0', '@chakra-ui/react': '^2.0.0' }
      ));
      const config = await detectProjectConfig(dir);
      assert.equal(config.componentLibrary, 'chakra');
    });

    it('should return null when no component library detected', async () => {
      const dir = await makeTmpDir('no-lib-project');
      await writeFile(dir, 'package.json', pkgJson({ react: '^18.0.0' }));
      const config = await detectProjectConfig(dir);
      assert.equal(config.componentLibrary, null);
    });
  });

  // ── Existing blog/article pattern detection ──

  describe('Blog pattern detection', () => {

    it('should detect blog/ directory', async () => {
      const dir = await makeTmpDir('blog-pattern');
      await writeFile(dir, 'package.json', pkgJson({ react: '^18.0.0' }));
      await makeDir(dir, 'src/blog');
      const config = await detectProjectConfig(dir);
      assert.equal(config.existingBlogPattern, 'src/blog');
    });

    it('should detect articles/ directory', async () => {
      const dir = await makeTmpDir('articles-pattern');
      await writeFile(dir, 'package.json', pkgJson({ vue: '^3.0.0' }));
      await makeDir(dir, 'src/articles');
      const config = await detectProjectConfig(dir);
      assert.equal(config.existingBlogPattern, 'src/articles');
    });

    it('should detect posts/ directory', async () => {
      const dir = await makeTmpDir('posts-pattern');
      await writeFile(dir, 'package.json', pkgJson({ react: '^18.0.0' }));
      await makeDir(dir, 'src/posts');
      const config = await detectProjectConfig(dir);
      assert.equal(config.existingBlogPattern, 'src/posts');
    });

    it('should detect app/blog/ for Next.js App Router', async () => {
      const dir = await makeTmpDir('next-blog-pattern');
      await writeFile(dir, 'package.json', pkgJson({ next: '^14.0.0', react: '^18.0.0' }));
      await makeDir(dir, 'app');
      await makeDir(dir, 'app/blog');
      const config = await detectProjectConfig(dir);
      assert.equal(config.existingBlogPattern, 'app/blog');
    });

    it('should return null when no blog pattern found', async () => {
      const dir = await makeTmpDir('no-blog');
      await writeFile(dir, 'package.json', pkgJson({ react: '^18.0.0' }));
      const config = await detectProjectConfig(dir);
      assert.equal(config.existingBlogPattern, null);
    });
  });

  // ── TypeScript strictness detection ──

  describe('TypeScript config detection', () => {

    it('should detect strict mode from tsconfig.json', async () => {
      const dir = await makeTmpDir('ts-strict');
      await writeFile(dir, 'package.json', pkgJson({}, { typescript: '^5.0.0' }));
      await writeFile(dir, 'tsconfig.json', JSON.stringify({
        compilerOptions: { strict: true, target: 'ES2022', jsx: 'react-jsx' }
      }));
      const config = await detectProjectConfig(dir);
      assert.equal(config.language, 'typescript');
      assert.ok(config.typescript, 'should have typescript config object');
      assert.equal(config.typescript.enabled, true);
      assert.equal(config.typescript.strict, true);
      assert.equal(config.typescript.strictNullChecks, true);
      assert.equal(config.typescript.noImplicitAny, true);
      assert.equal(config.typescript.target, 'ES2022');
      assert.equal(config.typescript.jsx, 'react-jsx');
    });

    it('should detect non-strict TypeScript config', async () => {
      const dir = await makeTmpDir('ts-non-strict');
      await writeFile(dir, 'package.json', pkgJson({}, { typescript: '^5.0.0' }));
      await writeFile(dir, 'tsconfig.json', JSON.stringify({
        compilerOptions: { strict: false, strictNullChecks: true }
      }));
      const config = await detectProjectConfig(dir);
      assert.equal(config.typescript.strict, false);
      assert.equal(config.typescript.strictNullChecks, true);
      assert.equal(config.typescript.noImplicitAny, false);
    });

    it('should return null typescript when no TypeScript detected', async () => {
      const dir = await makeTmpDir('no-ts');
      await writeFile(dir, 'package.json', pkgJson({ react: '^18.0.0' }));
      const config = await detectProjectConfig(dir);
      assert.equal(config.language, 'javascript');
      assert.equal(config.typescript, null);
    });

    it('should handle tsconfig.json with comments', async () => {
      const dir = await makeTmpDir('ts-comments');
      await writeFile(dir, 'package.json', pkgJson({}, { typescript: '^5.0.0' }));
      await writeFile(dir, 'tsconfig.json', `{
        // This is a comment
        "compilerOptions": {
          "strict": true,
          "target": "ESNext"
        }
      }`);
      const config = await detectProjectConfig(dir);
      assert.equal(config.typescript.strict, true);
      assert.equal(config.typescript.target, 'ESNext');
    });
  });

  // ── Image strategy detection ──

  describe('Image strategy detection', () => {

    it('should detect next-image for Next.js projects', async () => {
      const dir = await makeTmpDir('next-img');
      await writeFile(dir, 'package.json', pkgJson({ next: '^14.0.0', react: '^18.0.0' }));
      const config = await detectProjectConfig(dir);
      assert.equal(config.imageStrategy, 'next-image');
    });

    it('should detect nuxt-image when @nuxt/image is installed', async () => {
      const dir = await makeTmpDir('nuxt-img');
      await writeFile(dir, 'package.json', pkgJson({ nuxt: '^3.0.0', '@nuxt/image': '^1.0.0' }));
      const config = await detectProjectConfig(dir);
      assert.equal(config.imageStrategy, 'nuxt-image');
    });

    it('should detect lazy-img when lazysizes is installed', async () => {
      const dir = await makeTmpDir('lazy-img');
      await writeFile(dir, 'package.json', pkgJson({ react: '^18.0.0', lazysizes: '^5.0.0' }));
      const config = await detectProjectConfig(dir);
      assert.equal(config.imageStrategy, 'lazy-img');
    });

    it('should detect lazy-img when lozad is installed', async () => {
      const dir = await makeTmpDir('lozad-img');
      await writeFile(dir, 'package.json', pkgJson({ vue: '^3.0.0', lozad: '^1.0.0' }));
      const config = await detectProjectConfig(dir);
      assert.equal(config.imageStrategy, 'lazy-img');
    });

    it('should default to standard image strategy', async () => {
      const dir = await makeTmpDir('standard-img');
      await writeFile(dir, 'package.json', pkgJson({ react: '^18.0.0' }));
      const config = await detectProjectConfig(dir);
      assert.equal(config.imageStrategy, 'standard');
    });
  });

  // ── Unit tests for exported helpers ──

  describe('detectComponentLibrary (unit)', () => {
    it('should detect shadcn from @shadcn/ui', () => {
      assert.equal(detectComponentLibrary({ '@shadcn/ui': '^1.0.0' }), 'shadcn');
    });

    it('should detect antd', () => {
      assert.equal(detectComponentLibrary({ antd: '^5.0.0' }), 'antd');
    });

    it('should detect mantine', () => {
      assert.equal(detectComponentLibrary({ '@mantine/core': '^7.0.0' }), 'mantine');
    });
  });

  describe('detectImageStrategy (unit)', () => {
    it('should return next-image for next framework', () => {
      assert.equal(detectImageStrategy('next', {}), 'next-image');
    });

    it('should return standard for unknown framework with no lazy deps', () => {
      assert.equal(detectImageStrategy('react', {}), 'standard');
    });
  });

  // ── New config output fields ──

  describe('Config output fields completeness', () => {

    it('should include all expected fields in config output', async () => {
      const dir = await makeTmpDir('full-config');
      await writeFile(dir, 'package.json', pkgJson(
        { next: '^14.0.0', react: '^18.0.0', '@radix-ui/react-dialog': '^1.0.0' },
        { typescript: '^5.0.0' }
      ));
      await writeFile(dir, 'tsconfig.json', JSON.stringify({ compilerOptions: { strict: true } }));
      await makeDir(dir, 'app');
      await makeDir(dir, 'app/blog');

      const config = await detectProjectConfig(dir);

      // Verify all expected fields exist
      assert.ok('routerType' in config, 'should have routerType');
      assert.ok('componentLibrary' in config, 'should have componentLibrary');
      assert.ok('existingBlogPattern' in config, 'should have existingBlogPattern');
      assert.ok('typescript' in config, 'should have typescript');
      assert.ok('imageStrategy' in config, 'should have imageStrategy');

      // Verify values
      assert.equal(config.routerType, 'app');
      assert.equal(config.componentLibrary, 'shadcn');
      assert.equal(config.existingBlogPattern, 'app/blog');
      assert.equal(config.typescript.strict, true);
      assert.equal(config.imageStrategy, 'next-image');
      assert.equal(config.language, 'typescript');
    });
  });
});
