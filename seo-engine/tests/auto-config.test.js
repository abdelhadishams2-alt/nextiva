/**
 * Auto-config test suite.
 *
 * Tests project stack auto-detection by creating temporary directories
 * with various config files and verifying detection results.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { detectProjectConfig } = require('../bridge/auto-config');

// ── Helpers ──

let tmpBase;

async function makeTmpDir(name) {
  const dir = path.join(tmpBase, name);
  await fs.promises.mkdir(dir, { recursive: true });
  return dir;
}

async function writeFile(dir, filename, content = '') {
  await fs.promises.writeFile(path.join(dir, filename), content, 'utf-8');
}

describe('Auto-config detector', () => {

  before(async () => {
    tmpBase = path.join(os.tmpdir(), `chainiq-test-${Date.now()}`);
    await fs.promises.mkdir(tmpBase, { recursive: true });
  });

  after(async () => {
    await fs.promises.rm(tmpBase, { recursive: true, force: true });
  });

  // ── Package manager detection ──

  it('should detect npm from package-lock.json', async () => {
    const dir = await makeTmpDir('npm-project');
    await writeFile(dir, 'package-lock.json', '{}');
    const config = await detectProjectConfig(dir);
    assert.equal(config.packageManager, 'npm');
  });

  it('should detect pnpm from pnpm-lock.yaml', async () => {
    const dir = await makeTmpDir('pnpm-project');
    await writeFile(dir, 'pnpm-lock.yaml', '');
    const config = await detectProjectConfig(dir);
    assert.equal(config.packageManager, 'pnpm');
  });

  it('should detect yarn from yarn.lock', async () => {
    const dir = await makeTmpDir('yarn-project');
    await writeFile(dir, 'yarn.lock', '');
    const config = await detectProjectConfig(dir);
    assert.equal(config.packageManager, 'yarn');
  });

  // ── Framework detection ──

  it('should detect Next.js from package.json deps', async () => {
    const dir = await makeTmpDir('next-project');
    await writeFile(dir, 'package.json', JSON.stringify({
      dependencies: { next: '^14.0.0', react: '^18.0.0' },
    }));
    const config = await detectProjectConfig(dir);
    assert.equal(config.framework, 'next');
  });

  it('should detect Vue from package.json deps', async () => {
    const dir = await makeTmpDir('vue-project');
    await writeFile(dir, 'package.json', JSON.stringify({
      dependencies: { vue: '^3.0.0' },
    }));
    const config = await detectProjectConfig(dir);
    assert.equal(config.framework, 'vue');
  });

  it('should detect WordPress from wp-config.php', async () => {
    const dir = await makeTmpDir('wp-project');
    await writeFile(dir, 'wp-config.php', '<?php // config');
    const config = await detectProjectConfig(dir);
    assert.equal(config.framework, 'wordpress');
  });

  // ── TypeScript detection ──

  it('should detect TypeScript from tsconfig.json', async () => {
    const dir = await makeTmpDir('ts-project');
    await writeFile(dir, 'tsconfig.json', '{}');
    const config = await detectProjectConfig(dir);
    assert.equal(config.typescript, true);
  });

  // ── CSS framework detection ──

  it('should detect Tailwind from tailwind.config.js', async () => {
    const dir = await makeTmpDir('tailwind-project');
    await writeFile(dir, 'tailwind.config.js', 'module.exports = {};');
    const config = await detectProjectConfig(dir);
    assert.equal(config.cssFramework, 'tailwind');
  });

  // ── Monorepo detection ──

  it('should detect monorepo from pnpm-workspace.yaml', async () => {
    const dir = await makeTmpDir('monorepo-project');
    await writeFile(dir, 'pnpm-workspace.yaml', 'packages:\n  - packages/*');
    const config = await detectProjectConfig(dir);
    assert.equal(config.monorepo, true);
  });

  it('should detect monorepo from workspaces in package.json', async () => {
    const dir = await makeTmpDir('workspaces-project');
    await writeFile(dir, 'package.json', JSON.stringify({
      workspaces: ['packages/*'],
    }));
    const config = await detectProjectConfig(dir);
    assert.equal(config.monorepo, true);
  });

  // ── Deploy target detection ──

  it('should detect Vercel from vercel.json', async () => {
    const dir = await makeTmpDir('vercel-project');
    await writeFile(dir, 'vercel.json', '{}');
    const config = await detectProjectConfig(dir);
    assert.equal(config.deployTarget, 'vercel');
  });

  it('should detect Docker from Dockerfile', async () => {
    const dir = await makeTmpDir('docker-project');
    await writeFile(dir, 'Dockerfile', 'FROM node:20');
    const config = await detectProjectConfig(dir);
    assert.equal(config.deployTarget, 'docker');
  });

  // ── Fallback ──

  it('should return defaults when no config files exist', async () => {
    const dir = await makeTmpDir('empty-project');
    const config = await detectProjectConfig(dir);
    assert.equal(config.packageManager, 'npm');
    assert.equal(config.framework, 'html');
    assert.equal(config.cssFramework, null);
    assert.equal(config.typescript, false);
    assert.equal(config.monorepo, false);
    assert.equal(config.deployTarget, null);
  });

  // ── Shell detection ──

  it('should detect shell based on platform', async () => {
    const dir = await makeTmpDir('shell-project');
    const config = await detectProjectConfig(dir);
    // On Windows, should be powershell; on others, bash
    if (process.platform === 'win32') {
      assert.equal(config.shell, 'powershell');
    } else {
      assert.equal(config.shell, 'bash');
    }
  });
});
