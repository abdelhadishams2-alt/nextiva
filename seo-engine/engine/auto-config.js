/**
 * Auto-Config Detection for ChainIQ Universal Engine.
 *
 * Detects the target project's tech stack without manual configuration.
 * Returns a PROJECT_CONFIG object used by the pipeline to select
 * the correct framework adapter and output format.
 */

const fs = require('fs');
const path = require('path');

// File patterns for framework detection
const FRAMEWORK_INDICATORS = [
  { framework: 'next',     files: ['next.config.js', 'next.config.ts', 'next.config.mjs'], deps: ['next'] },
  { framework: 'nuxt',     files: ['nuxt.config.js', 'nuxt.config.ts'], deps: ['nuxt'] },
  { framework: 'svelte',   files: ['svelte.config.js', 'svelte.config.ts'], deps: ['svelte', '@sveltejs/kit'] },
  { framework: 'vue',      files: ['vue.config.js'], deps: ['vue'] },
  { framework: 'angular',  files: ['angular.json'], deps: ['@angular/core'] },
  { framework: 'astro',    files: ['astro.config.mjs', 'astro.config.ts'], deps: ['astro'] },
  { framework: 'vite',     files: ['vite.config.js', 'vite.config.ts', 'vite.config.mjs'], deps: ['vite'] },
  { framework: 'react',    files: [], deps: ['react', 'react-dom'] },
  { framework: 'wordpress', files: ['wp-config.php', 'functions.php', 'style.css'], deps: [] },
];

const PACKAGE_MANAGERS = [
  { name: 'bun',   lockfile: 'bun.lockb' },
  { name: 'pnpm',  lockfile: 'pnpm-lock.yaml' },
  { name: 'yarn',  lockfile: 'yarn.lock' },
  { name: 'npm',   lockfile: 'package-lock.json' },
];

const CSS_FRAMEWORKS = [
  { name: 'tailwind', files: ['tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.cjs'], deps: ['tailwindcss'] },
  { name: 'styled-components', files: [], deps: ['styled-components'] },
  { name: 'emotion', files: [], deps: ['@emotion/react', '@emotion/styled'] },
  { name: 'css-modules', files: [], deps: [] }, // detected by file pattern
];

const I18N_LIBRARIES = [
  { name: 'next-intl', deps: ['next-intl'], files: [] },
  { name: 'next-i18next', deps: ['next-i18next'], files: [] },
  { name: 'react-intl', deps: ['react-intl'], files: [] },
  { name: 'i18next', deps: ['i18next'], files: [] },
];

const DEPLOY_TARGETS = [
  { name: 'vercel',   files: ['vercel.json', 'vercel.ts', '.vercel'] },
  { name: 'netlify',  files: ['netlify.toml', '_redirects'] },
  { name: 'docker',   files: ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml'] },
  { name: 'fly',      files: ['fly.toml'] },
];

/**
 * Detect the project configuration from a directory.
 *
 * @param {string} projectDir - Absolute path to the project directory
 * @returns {Promise<object>} PROJECT_CONFIG with fields:
 *   packageManager, framework, frameworkVersion, language, cssFramework,
 *   shell, cicd, deployTarget, monorepo, adapterFramework,
 *   componentLibrary, imageStrategy, routerType, existingBlogPattern,
 *   typescript (object with strict, strictNullChecks, etc.)
 */
async function detectProjectConfig(projectDir) {
  const config = {
    packageManager: 'npm',
    framework: 'html',
    frameworkVersion: null,
    language: 'javascript',
    cssFramework: 'inline',
    cssStrategy: null,
    shell: detectShell(),
    cicd: null,
    deployTarget: null,
    monorepo: false,
    routerType: null,
    componentLibrary: null,
    existingBlogPattern: null,
    typescript: null,
    imageStrategy: 'standard',
    i18nLibrary: null,
    i18nMessagesPath: null,
    localeRouting: false,
    hasSiteConfig: false,
    siteConfigPath: null,
  };

  let files;
  try {
    files = await fs.promises.readdir(projectDir);
  } catch {
    return config;
  }

  const fileSet = new Set(files);

  // Detect package manager
  for (const pm of PACKAGE_MANAGERS) {
    if (fileSet.has(pm.lockfile)) {
      config.packageManager = pm.name;
      break;
    }
  }

  // Read package.json for dependency-based detection
  let pkgJson = null;
  try {
    const raw = await fs.promises.readFile(path.join(projectDir, 'package.json'), 'utf-8');
    pkgJson = JSON.parse(raw);
  } catch {
    // No package.json — check for WordPress
    if (fileSet.has('wp-config.php') || fileSet.has('functions.php')) {
      config.framework = 'wordpress';
    }
    return config;
  }

  const allDeps = {
    ...(pkgJson.dependencies || {}),
    ...(pkgJson.devDependencies || {})
  };

  // Detect framework (order matters — more specific first)
  for (const indicator of FRAMEWORK_INDICATORS) {
    const hasFile = indicator.files.some(f => fileSet.has(f));
    const hasDep = indicator.deps.some(d => allDeps[d]);
    if (hasFile || hasDep) {
      config.framework = indicator.framework;
      // Get version if available
      const depName = indicator.deps.find(d => allDeps[d]);
      if (depName) config.frameworkVersion = allDeps[depName].replace(/[\^~>=<]/g, '');
      break;
    }
  }

  // Map framework to output adapter
  config.adapterFramework = mapToAdapter(config.framework);

  // Detect component library
  config.componentLibrary = detectComponentLibrary(allDeps);

  // Detect image strategy
  config.imageStrategy = detectImageStrategy(config.framework, allDeps);

  // Detect TypeScript — language field + detailed typescript config object
  if (fileSet.has('tsconfig.json') || allDeps['typescript']) {
    config.language = 'typescript';
    config.typescript = await detectTypeScriptConfig(projectDir);
  }

  // Detect CSS framework
  for (const cssfw of CSS_FRAMEWORKS) {
    const hasFile = cssfw.files.some(f => fileSet.has(f));
    const hasDep = cssfw.deps.some(d => allDeps[d]);
    if (hasFile || hasDep) {
      config.cssFramework = cssfw.name;
      break;
    }
  }

  // Detect CI/CD
  if (fileSet.has('.github')) config.cicd = 'github-actions';
  else if (fileSet.has('.gitlab-ci.yml')) config.cicd = 'gitlab-ci';
  else if (fileSet.has('Jenkinsfile')) config.cicd = 'jenkins';

  // Detect deploy target
  for (const target of DEPLOY_TARGETS) {
    if (target.files.some(f => fileSet.has(f))) {
      config.deployTarget = target.name;
      break;
    }
  }

  // Detect monorepo
  if (fileSet.has('turbo.json') || fileSet.has('lerna.json') || fileSet.has('pnpm-workspace.yaml')) {
    config.monorepo = true;
  }

  // Detect router type for Next.js (App Router vs Pages Router)
  if (config.framework === 'next') {
    config.routerType = await detectNextRouterType(projectDir, fileSet);
  }

  // Detect Nuxt version (Nuxt 3 vs Nuxt 2)
  if (config.framework === 'nuxt') {
    config.routerType = await detectNuxtVersion(projectDir, fileSet, allDeps);
  }

  // Detect existing blog/article patterns
  config.existingBlogPattern = await detectBlogPattern(projectDir, fileSet, config.framework);

  // Detect i18n library
  for (const i18n of I18N_LIBRARIES) {
    if (i18n.deps.some(d => allDeps[d])) {
      config.i18nLibrary = i18n.name;
      break;
    }
  }

  // Detect messages directory (next-intl pattern)
  if (config.i18nLibrary === 'next-intl') {
    const messagesPaths = ['messages/en.json', 'messages/en.ts', 'src/messages/en.json'];
    for (const mp of messagesPaths) {
      try {
        await fs.promises.access(path.join(projectDir, mp));
        config.i18nMessagesPath = mp;
        break;
      } catch {}
    }
  }

  // Detect [locale] dynamic segment routing
  const localeDirs = ['src/app/[locale]', 'app/[locale]'];
  for (const ld of localeDirs) {
    try {
      await fs.promises.access(path.join(projectDir, ld));
      config.localeRouting = true;
      break;
    } catch {}
  }

  // Detect BEM CSS convention (plain CSS files in src/styles/ with BEM naming)
  await detectCSSStrategy(projectDir, config);

  // Detect SITE_CONFIG
  const siteConfigPaths = ['src/config/site.ts', 'src/config/site.js', 'config/site.ts'];
  for (const sp of siteConfigPaths) {
    try {
      await fs.promises.access(path.join(projectDir, sp));
      config.hasSiteConfig = true;
      config.siteConfigPath = sp;
      break;
    } catch {}
  }

  return config;
}

/**
 * Detect component library in use
 */
function detectComponentLibrary(allDeps) {
  if (allDeps['@shadcn/ui'] || allDeps['@radix-ui/react-dialog']) return 'shadcn';
  if (allDeps['vuetify']) return 'vuetify';
  if (allDeps['@mui/material']) return 'material-ui';
  if (allDeps['@chakra-ui/react']) return 'chakra';
  if (allDeps['antd']) return 'antd';
  if (allDeps['@mantine/core']) return 'mantine';
  return null;
}

/**
 * Detect Next.js router type (App Router vs Pages Router)
 */
async function detectNextRouterType(projectDir, fileSet) {
  const path = require('path');
  const fs = require('fs');

  // Check for app/ directory (App Router)
  try {
    const appDir = path.join(projectDir, 'app');
    const srcAppDir = path.join(projectDir, 'src', 'app');
    const [appExists, srcAppExists] = await Promise.all([
      fs.promises.access(appDir).then(() => true).catch(() => false),
      fs.promises.access(srcAppDir).then(() => true).catch(() => false),
    ]);
    if (appExists || srcAppExists) return 'app';
  } catch {}

  // Check for pages/ directory (Pages Router)
  try {
    const pagesDir = path.join(projectDir, 'pages');
    const srcPagesDir = path.join(projectDir, 'src', 'pages');
    const [pagesExists, srcPagesExists] = await Promise.all([
      fs.promises.access(pagesDir).then(() => true).catch(() => false),
      fs.promises.access(srcPagesDir).then(() => true).catch(() => false),
    ]);
    if (pagesExists || srcPagesExists) return 'pages';
  } catch {}

  return 'app'; // Default to App Router for new Next.js projects
}

/**
 * Detect existing blog/article patterns in the project
 */
async function detectBlogPattern(projectDir, fileSet, framework) {
  const path = require('path');
  const fs = require('fs');

  const blogDirs = ['blog', 'articles', 'posts', 'news'];
  const searchPaths = framework === 'next'
    ? blogDirs.flatMap(d => [`app/${d}`, `src/app/${d}`, `pages/${d}`, `src/pages/${d}`])
    : blogDirs.flatMap(d => [`src/${d}`, d, `src/views/${d}`, `src/pages/${d}`]);

  for (const dir of searchPaths) {
    try {
      await fs.promises.access(path.join(projectDir, dir));
      return dir;
    } catch {}
  }

  return null;
}

/**
 * Detect Nuxt version — Nuxt 3 uses nuxt.config.ts, Nuxt 2 uses nuxt.config.js.
 * Also checks the nuxt dependency version in package.json.
 *
 * @returns {Promise<string>} 'nuxt3' or 'nuxt2'
 */
async function detectNuxtVersion(projectDir, fileSet, allDeps) {
  // nuxt.config.ts is a strong Nuxt 3 signal
  if (fileSet.has('nuxt.config.ts')) return 'nuxt3';

  // Check version string from deps
  if (allDeps['nuxt']) {
    const ver = allDeps['nuxt'].replace(/[\^~>=<\s]/g, '');
    const major = parseInt(ver.split('.')[0], 10);
    if (major >= 3) return 'nuxt3';
    if (major > 0 && major < 3) return 'nuxt2';
  }

  // nuxt.config.js alone — could be either, default to nuxt2 for safety
  if (fileSet.has('nuxt.config.js')) return 'nuxt2';

  return 'nuxt3'; // Default to Nuxt 3 for new projects
}

/**
 * Detect TypeScript strictness from tsconfig.json.
 *
 * @param {string} projectDir
 * @returns {Promise<object>} { enabled: true, strict: bool, strictNullChecks: bool, ... }
 */
async function detectTypeScriptConfig(projectDir) {
  const result = {
    enabled: true,
    strict: false,
    strictNullChecks: false,
    noImplicitAny: false,
    target: null,
    jsx: null,
  };

  try {
    const raw = await fs.promises.readFile(path.join(projectDir, 'tsconfig.json'), 'utf-8');
    // Strip single-line comments (tsconfig supports them)
    const cleaned = raw.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const tsconfig = JSON.parse(cleaned);
    const co = tsconfig.compilerOptions || {};

    result.strict = co.strict === true;
    result.strictNullChecks = co.strictNullChecks === true || co.strict === true;
    result.noImplicitAny = co.noImplicitAny === true || co.strict === true;
    if (co.target) result.target = co.target;
    if (co.jsx) result.jsx = co.jsx;
  } catch {
    // tsconfig.json doesn't exist or is malformed — defaults are fine
  }

  return result;
}

/**
 * Detect image strategy based on framework and dependencies.
 *
 * @param {string} framework
 * @param {object} allDeps - Combined dependencies
 * @returns {string} 'next-image' | 'nuxt-image' | 'lazy-img' | 'standard'
 */
function detectImageStrategy(framework, allDeps) {
  if (framework === 'next') return 'next-image';
  if (allDeps['@nuxt/image'] || allDeps['@nuxt/image-edge']) return 'nuxt-image';
  if (allDeps['lazysizes'] || allDeps['lozad']) return 'lazy-img';
  return 'standard';
}

/**
 * Map detected framework to the adapter framework name.
 * Several frameworks map to the same adapter (e.g., next → react).
 */
function mapToAdapter(framework) {
  const mapping = {
    next: 'next',       // Native Next.js adapter (Phase 3)
    react: 'react',
    nuxt: 'vue',
    vue: 'vue',
    svelte: 'svelte',   // Native Svelte adapter (Phase 3)
    angular: 'html',    // No Angular adapter yet, fall back
    astro: 'astro',
    vite: 'html',       // Vite is a bundler, not a framework — detect underlying
    wordpress: 'wordpress',
    html: 'html',
  };
  return mapping[framework] || 'html';
}

/**
 * Detect current shell environment
 */
function detectShell() {
  if (process.env.SHELL) {
    const shell = path.basename(process.env.SHELL);
    return shell;
  }
  if (process.env.PSModulePath || process.env.PSVersionTable) return 'powershell';
  if (process.platform === 'win32') return 'cmd';
  return 'bash';
}

/**
 * Detect CSS strategy by analyzing project file patterns.
 * Checks for BEM naming in CSS files (plain CSS in src/styles/).
 * Also checks globals.css for @import pattern (indicates BEM + plain CSS).
 */
async function detectCSSStrategy(projectDir, config) {
  // If tailwind is detected, skip BEM detection
  if (config.cssFramework === 'tailwind') return;

  try {
    // Check for src/styles/ directory with plain CSS files
    const stylesDir = path.join(projectDir, 'src', 'styles');
    const files = await fs.promises.readdir(stylesDir);
    const cssFiles = files.filter(f => f.endsWith('.css'));

    if (cssFiles.length > 0) {
      // Read a sample CSS file to check for BEM patterns
      const sampleFile = cssFiles.find(f => f !== 'tokens.css' && f !== 'fonts.css' && f !== 'base.css') || cssFiles[0];
      const content = await fs.promises.readFile(path.join(stylesDir, sampleFile), 'utf-8');

      // BEM pattern: .block__element or .block--modifier
      const hasBEM = /\.[a-z][\w-]*__[a-z][\w-]*|\.[\w-]+--[\w-]+/i.test(content);
      // Check for @import pattern in globals.css
      const globalsPath = path.join(projectDir, 'src', 'app', 'globals.css');
      let hasImportPattern = false;
      try {
        const globalsContent = await fs.promises.readFile(globalsPath, 'utf-8');
        hasImportPattern = (globalsContent.match(/@import/g) || []).length >= 3;
      } catch {}

      if (hasBEM || (cssFiles.length >= 5 && hasImportPattern)) {
        config.cssStrategy = 'bem';
        config.cssFramework = 'plain-css';
      }
    }
  } catch {
    // No src/styles/ directory — not BEM
  }
}

module.exports = {
  detectProjectConfig,
  mapToAdapter,
  detectShell,
  detectComponentLibrary,
  detectImageStrategy,
  detectTypeScriptConfig,
  detectNuxtVersion,
  detectCSSStrategy,
};
