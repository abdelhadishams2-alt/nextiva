/**
 * Project stack auto-detection module for ChainIQ Universal Engine.
 * Zero dependencies — uses only Node.js built-ins.
 *
 * Scans a project directory to detect package manager, framework,
 * CSS framework, TypeScript, monorepo, and deploy target.
 */

const fs = require('fs');
const path = require('path');

// ── Defaults ──

const DEFAULTS = {
  packageManager: 'npm',
  framework: 'html',
  shell: 'bash',
  cssFramework: null,
  typescript: false,
  monorepo: false,
  deployTarget: null,
};

/**
 * Check if a file exists in the given directory.
 *
 * @param {string} dir - Directory path
 * @param {string} filename - File to check
 * @returns {Promise<boolean>}
 */
async function fileExists(dir, filename) {
  try {
    await fs.promises.access(path.join(dir, filename));
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely read and parse a JSON file.
 *
 * @param {string} filePath - Absolute path to JSON file
 * @returns {Promise<object|null>}
 */
async function readJson(filePath) {
  try {
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Detect the package manager used in the project.
 */
async function detectPackageManager(dir) {
  if (await fileExists(dir, 'pnpm-lock.yaml')) return 'pnpm';
  if (await fileExists(dir, 'yarn.lock')) return 'yarn';
  if (await fileExists(dir, 'bun.lockb')) return 'bun';
  if (await fileExists(dir, 'package-lock.json')) return 'npm';
  return DEFAULTS.packageManager;
}

/**
 * Detect the framework from package.json dependencies.
 */
async function detectFramework(dir) {
  // Check for WordPress
  if (await fileExists(dir, 'wp-config.php')) return 'wordpress';

  const pkg = await readJson(path.join(dir, 'package.json'));
  if (!pkg) return DEFAULTS.framework;

  const allDeps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };

  if (allDeps.next) return 'next';
  if (allDeps.nuxt) return 'nuxt';
  if (allDeps.svelte || allDeps['@sveltejs/kit']) return 'svelte';
  if (allDeps.gatsby) return 'gatsby';
  if (allDeps.vue) return 'vue';
  if (allDeps.react) return 'react';
  if (allDeps.angular || allDeps['@angular/core']) return 'angular';

  return DEFAULTS.framework;
}

/**
 * Detect the current shell environment.
 */
function detectShell() {
  if (process.platform === 'win32') return 'powershell';
  return 'bash';
}

/**
 * Detect the CSS framework in use.
 */
async function detectCSSFramework(dir) {
  // Check for Tailwind config files
  if (await fileExists(dir, 'tailwind.config.js')) return 'tailwind';
  if (await fileExists(dir, 'tailwind.config.ts')) return 'tailwind';
  if (await fileExists(dir, 'tailwind.config.mjs')) return 'tailwind';
  if (await fileExists(dir, 'tailwind.config.cjs')) return 'tailwind';

  // Check for PostCSS
  if (await fileExists(dir, 'postcss.config.js')) {
    // Could be tailwind via postcss — check package.json too
    const pkg = await readJson(path.join(dir, 'package.json'));
    if (pkg) {
      const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      if (allDeps.tailwindcss) return 'tailwind';
    }
    return 'postcss';
  }

  // Check package.json for CSS-in-JS
  const pkg = await readJson(path.join(dir, 'package.json'));
  if (pkg) {
    const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    if (allDeps['styled-components']) return 'styled-components';
    if (allDeps['@emotion/react'] || allDeps['@emotion/styled']) return 'emotion';
    if (allDeps.tailwindcss) return 'tailwind';
  }

  return DEFAULTS.cssFramework;
}

/**
 * Detect TypeScript usage.
 */
async function detectTypeScript(dir) {
  return await fileExists(dir, 'tsconfig.json');
}

/**
 * Detect monorepo configuration.
 */
async function detectMonorepo(dir) {
  if (await fileExists(dir, 'lerna.json')) return true;
  if (await fileExists(dir, 'pnpm-workspace.yaml')) return true;
  if (await fileExists(dir, 'nx.json')) return true;

  const pkg = await readJson(path.join(dir, 'package.json'));
  if (pkg && pkg.workspaces) return true;

  return DEFAULTS.monorepo;
}

/**
 * Detect deploy target.
 */
async function detectDeployTarget(dir) {
  if (await fileExists(dir, 'vercel.json')) return 'vercel';
  if (await fileExists(dir, 'netlify.toml')) return 'netlify';
  if (await fileExists(dir, 'fly.toml')) return 'fly';
  if (await fileExists(dir, 'Dockerfile')) return 'docker';
  if (await fileExists(dir, 'app.yaml')) return 'gcp';
  if (await fileExists(dir, '.github/workflows')) return 'github-actions';
  return DEFAULTS.deployTarget;
}

/**
 * Detect the full project configuration from the project directory.
 *
 * @param {string} projectDir - Absolute path to the project root
 * @returns {Promise<{
 *   packageManager: string,
 *   framework: string,
 *   shell: string,
 *   cssFramework: string|null,
 *   typescript: boolean,
 *   monorepo: boolean,
 *   deployTarget: string|null
 * }>}
 */
async function detectProjectConfig(projectDir) {
  const dir = path.resolve(projectDir);

  const [packageManager, framework, cssFramework, typescript, monorepo, deployTarget] =
    await Promise.all([
      detectPackageManager(dir),
      detectFramework(dir),
      detectCSSFramework(dir),
      detectTypeScript(dir),
      detectMonorepo(dir),
      detectDeployTarget(dir),
    ]);

  return {
    packageManager,
    framework,
    shell: detectShell(),
    cssFramework,
    typescript,
    monorepo,
    deployTarget,
  };
}

module.exports = { detectProjectConfig };
