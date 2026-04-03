/**
 * Framework Router for ChainIQ Universal Engine.
 *
 * Maps detected framework to a native output strategy with correct
 * file extensions, output paths, imports, and CSS strategies.
 * Used by the draft-writer agent to generate framework-native code.
 */

const OUTPUT_STRATEGIES = {
  next: {
    name: 'Next.js',
    fileExtension: '.tsx',
    outputPath: 'src/app/[locale]/{slug}/page.tsx',
    outputDir: 'src/app/[locale]',
    outputFile: 'page.tsx',
    cssOutputDir: 'src/styles',
    globalsPath: 'src/app/globals.css',
    messagesPath: 'messages/en.json',
    wrapper: 'NextPageWrapper',
    imports: ['next/image', 'next/link', 'next-intl/server'],
    cssStrategy: 'bem',
    imageComponent: 'Image',
    imageImport: "import Image from 'next/image';",
    features: ['metadata', 'server-component', 'next-intl', 'bem-css', 'locale-routing'],
    editOverlay: 'client-component',
    supportsTypeScript: true,
    generatesMultipleFiles: true,
  },

  react: {
    name: 'React',
    fileExtension: '.tsx',
    outputPath: 'src/components/articles/{slug}/Article.tsx',
    outputDir: 'src/components/articles',
    outputFile: 'Article.tsx',
    wrapper: 'ReactComponentWrapper',
    imports: [],
    cssStrategy: 'css-modules',
    imageComponent: 'img',
    imageImport: null,
    features: ['component'],
    editOverlay: 'client-component',
    supportsTypeScript: true,
    generatesMultipleFiles: true,
  },

  vue: {
    name: 'Vue 3',
    fileExtension: '.vue',
    outputPath: 'src/views/{slug}.vue',
    outputDir: 'src/views',
    outputFile: 'ArticlePage.vue',
    wrapper: 'VueSFCWrapper',
    imports: [],
    cssStrategy: 'scoped',
    imageComponent: 'img',
    imageImport: null,
    features: ['script-setup', 'scoped-css', 'defineProps'],
    editOverlay: 'vanilla-js',
    supportsTypeScript: true,
    generatesMultipleFiles: false,
  },

  svelte: {
    name: 'SvelteKit',
    fileExtension: '.svelte',
    outputPath: 'src/routes/articles/{slug}/+page.svelte',
    outputDir: 'src/routes/articles',
    outputFile: '+page.svelte',
    wrapper: 'SveltePageWrapper',
    imports: [],
    cssStrategy: 'scoped',
    imageComponent: 'img',
    imageImport: null,
    features: ['load-function', 'scoped-css'],
    editOverlay: 'vanilla-js',
    supportsTypeScript: true,
    generatesMultipleFiles: true,
  },

  astro: {
    name: 'Astro',
    fileExtension: '.astro',
    outputPath: 'src/pages/articles/{slug}.astro',
    outputDir: 'src/pages/articles',
    outputFile: 'article.astro',
    wrapper: 'AstroPageWrapper',
    imports: [],
    cssStrategy: 'scoped',
    imageComponent: 'Image',
    imageImport: "import { Image } from 'astro:assets';",
    features: ['frontmatter', 'island-architecture'],
    editOverlay: 'vanilla-js',
    supportsTypeScript: true,
    generatesMultipleFiles: false,
  },

  wordpress: {
    name: 'WordPress',
    fileExtension: '.php',
    outputPath: '{slug}.php',
    outputDir: '',
    outputFile: 'template-article.php',
    wrapper: 'WordPressTemplate',
    imports: [],
    cssStrategy: 'inline',
    imageComponent: 'img',
    imageImport: null,
    features: ['wp-functions', 'the-content'],
    editOverlay: 'vanilla-js',
    supportsTypeScript: false,
    generatesMultipleFiles: false,
  },

  html: {
    name: 'Standalone HTML',
    fileExtension: '.html',
    outputPath: 'articles/{slug}.html',
    outputDir: 'articles',
    outputFile: 'article.html',
    wrapper: 'StandaloneHTML',
    imports: [],
    cssStrategy: 'inline',
    imageComponent: 'img',
    imageImport: null,
    features: ['standalone', 'inline-css', 'inline-js'],
    editOverlay: 'vanilla-js',
    supportsTypeScript: false,
    generatesMultipleFiles: false,
  },
};

/**
 * Get the output strategy for a framework.
 * Merges with auto-detected project config for context-aware output.
 *
 * @param {string} framework - Framework identifier (e.g., 'next', 'vue', 'html')
 * @param {object} projectConfig - Auto-detected project config from auto-config.js
 * @returns {object} Output strategy
 */
function getOutputStrategy(framework, projectConfig = {}) {
  const key = (framework || 'html').toLowerCase();
  const base = OUTPUT_STRATEGIES[key] || OUTPUT_STRATEGIES.html;
  const strategy = { ...base };

  // Override CSS strategy based on detected CSS framework
  // BEM takes priority (detected from project conventions)
  if (projectConfig.cssStrategy === 'bem') {
    strategy.cssStrategy = 'bem';
  } else if (projectConfig.cssFramework === 'tailwind' && key !== 'html') {
    strategy.cssStrategy = 'tailwind';
  }

  // Override TypeScript based on detection
  if (projectConfig.language === 'typescript') {
    strategy.supportsTypeScript = true;
  } else if (projectConfig.language === 'javascript' && key !== 'html') {
    // Adjust file extensions for JS-only projects
    if (strategy.fileExtension === '.tsx') strategy.fileExtension = '.jsx';
  }

  // Adjust Next.js output for App Router vs Pages Router
  if (key === 'next' && projectConfig.routerType === 'pages') {
    strategy.outputDir = 'pages/articles';
    strategy.outputFile = '[slug].tsx';
    strategy.features = ['getStaticProps', 'pages-router'];
  }

  // Adjust Vue output for Nuxt
  if (key === 'vue' && projectConfig.framework === 'nuxt') {
    strategy.name = 'Nuxt';
    strategy.outputDir = 'pages/articles';
    strategy.outputFile = '[slug].vue';
    strategy.features = ['nuxt-page', 'script-setup', 'scoped-css'];
  }

  return strategy;
}

/**
 * Generate a slug-safe path from a title.
 */
function slugify(title) {
  return String(title)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

/**
 * Get the full output path for an article.
 *
 * If the project analyzer detected an existing article directory and naming
 * convention, those are used instead of the hardcoded defaults. The detected
 * values arrive via `projectConfig.detectedArticlePath`.
 *
 * @param {string} framework - Framework identifier
 * @param {string} title - Article title (used for slug)
 * @param {object} projectConfig - Auto-detected config
 * @param {object} [projectConfig.detectedArticlePath] - From project-analyzer Substep 7
 * @param {string} [projectConfig.detectedArticlePath.articleDirectory] - Detected article dir
 * @param {string} [projectConfig.detectedArticlePath.namingConvention] - slug-based, date-prefixed, directory-based, etc.
 * @returns {string} Relative output path
 */
function getOutputPath(framework, title, projectConfig = {}) {
  const strategy = getOutputStrategy(framework, projectConfig);
  const slug = slugify(title);
  const detected = projectConfig.detectedArticlePath;

  // If the project analyzer found an existing article directory, use it
  if (detected && detected.articleDirectory) {
    const dir = detected.articleDirectory;
    const convention = detected.namingConvention || 'slug-based';

    // Directory-based conventions (Next.js App Router, SvelteKit)
    if (convention === 'directory-based' || framework === 'next' || framework === 'svelte') {
      return `${dir}/${slug}/${strategy.outputFile}`;
    }

    // Default: dir/slug.ext
    const ext = strategy.fileExtension;
    return `${dir}/${slug}${ext}`;
  }

  // Fallback to hardcoded defaults when no articles detected
  if (framework === 'next') {
    // Next.js App Router: app/articles/[slug]/page.tsx
    return `${strategy.outputDir}/${slug}/${strategy.outputFile}`;
  }

  if (framework === 'svelte') {
    // SvelteKit: src/routes/articles/[slug]/+page.svelte
    return `${strategy.outputDir}/${slug}/${strategy.outputFile}`;
  }

  // Default: output-dir/slug.ext
  const ext = strategy.fileExtension;
  const baseName = slug + ext;
  return strategy.outputDir ? `${strategy.outputDir}/${baseName}` : baseName;
}

/**
 * Resolve the concrete output file path from a strategy and slug.
 *
 * Takes a strategy object (from getOutputStrategy) and a pre-computed slug
 * string, substitutes `{slug}` into the strategy's outputPath template,
 * and returns the concrete relative file path.
 *
 * @param {object} strategy - Output strategy from getOutputStrategy()
 * @param {string} slug - URL-safe slug (already slugified)
 * @returns {string} Concrete relative file path
 */
function resolveOutputPath(strategy, slug) {
  if (!strategy || !strategy.outputPath) {
    // Fallback: construct from outputDir + slug + extension
    const dir = (strategy && strategy.outputDir) || 'articles';
    const ext = (strategy && strategy.fileExtension) || '.html';
    return dir ? `${dir}/${slug}${ext}` : `${slug}${ext}`;
  }
  return strategy.outputPath.replace(/\{slug\}/g, slug);
}

/**
 * Get the suggested output directory for a framework when no articles exist yet.
 * Used by the orchestrator to propose a path and ask the user for confirmation.
 *
 * @param {string} framework - Framework identifier
 * @param {object} projectConfig - Auto-detected config
 * @returns {string} Suggested directory path
 */
function getSuggestedArticleDir(framework, projectConfig = {}) {
  const strategy = getOutputStrategy(framework, projectConfig);
  return strategy.outputDir || 'articles';
}

/**
 * List all supported output frameworks.
 */
function listFrameworks() {
  return Object.entries(OUTPUT_STRATEGIES).map(([key, strategy]) => ({
    id: key,
    name: strategy.name,
    fileExtension: strategy.fileExtension,
    features: strategy.features,
  }));
}

/**
 * Check if a framework is supported.
 */
function isSupported(framework) {
  return framework && OUTPUT_STRATEGIES.hasOwnProperty(framework.toLowerCase());
}

module.exports = {
  OUTPUT_STRATEGIES,
  getOutputStrategy,
  getOutputPath,
  resolveOutputPath,
  getSuggestedArticleDir,
  slugify,
  listFrameworks,
  isSupported,
};
