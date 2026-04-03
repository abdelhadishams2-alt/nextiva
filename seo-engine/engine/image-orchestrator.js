/**
 * Image Orchestrator for SEO Engine.
 *
 * Decides the image strategy based on article type, then delegates to:
 * - image-generator.js (Imagen 4 via Gemini) for decorative images
 * - screenshot-capture.js (Playwright) for real screenshots
 *
 * Article type → Image strategy:
 *   review      → Playwright screenshots + Imagen hero
 *   comparison  → Imagen decorative (components ARE the visuals)
 *   versus      → Playwright screenshots of both tools + Imagen hero
 *   best-of     → Imagen decorative (ranked cards ARE the visuals)
 *   guide       → Playwright step-by-step screenshots + Imagen hero
 *   analysis    → Imagen stat visuals + decorative
 */

const { generateImagePrompts, ensureImageDir } = require('./image-generator');
const {
  generateReviewPlan,
  generateVersusPlan,
  generateGuidePlan,
  buildMCPCalls,
  ensureScreenshotDir,
} = require('./screenshot-capture');
const { getImageStrategy } = require('./article-type-detector');

/**
 * Create a complete image plan for an article.
 *
 * Returns both Imagen prompts (for Gemini MCP) and Playwright plans
 * (for screenshot MCP), ready to be executed by the pipeline orchestrator.
 *
 * @param {object} opts
 * @param {string} opts.title - Article title
 * @param {string} opts.slug - URL slug
 * @param {string} opts.articleType - Detected article type
 * @param {Array}  opts.sections - Article sections
 * @param {object} [opts.toolInfo] - Tool information for screenshots
 * @param {string} [opts.toolInfo.name] - Tool name
 * @param {string} [opts.toolInfo.url] - Tool website URL
 * @param {Array}  [opts.toolInfo.keyPages] - Key pages to screenshot
 * @param {object} [opts.versusInfo] - For versus articles
 * @param {object} [opts.versusInfo.toolA] - { name, url }
 * @param {object} [opts.versusInfo.toolB] - { name, url }
 * @param {Array}  [opts.guideSteps] - For guide articles [{url, action, selector, description}]
 * @param {string} opts.projectDir - Absolute path to project root
 * @returns {object} Image plan
 */
async function createImagePlan(opts) {
  const {
    title, slug, articleType, sections = [],
    toolInfo = {}, versusInfo = {}, guideSteps = [],
    projectDir,
  } = opts;

  const strategy = getImageStrategy(articleType);
  const plan = {
    articleType,
    strategy,
    imagenPrompts: [],
    playwrightPlan: [],
    playwrightMCPCalls: [],
    totalImages: 0,
  };

  // Ensure output directory exists
  await ensureImageDir(projectDir);

  switch (articleType) {
    case 'review':
      // Hero via Imagen + screenshots via Playwright
      plan.imagenPrompts = generateImagePrompts({
        title, slug, articleType, sections, count: 1, // hero only
      });
      if (toolInfo.url) {
        plan.playwrightPlan = generateReviewPlan({
          toolName: toolInfo.name || title,
          toolUrl: toolInfo.url,
          slug,
          keyPages: toolInfo.keyPages || [],
          maxScreenshots: 6,
        });
        plan.playwrightMCPCalls = buildMCPCalls(plan.playwrightPlan);
      }
      break;

    case 'versus':
      // Hero via Imagen + screenshots of both tools
      plan.imagenPrompts = generateImagePrompts({
        title, slug, articleType, sections, count: 1,
      });
      if (versusInfo.toolA && versusInfo.toolB) {
        plan.playwrightPlan = generateVersusPlan({
          toolA: versusInfo.toolA.name,
          toolAUrl: versusInfo.toolA.url,
          toolB: versusInfo.toolB.name,
          toolBUrl: versusInfo.toolB.url,
          slug,
        });
        plan.playwrightMCPCalls = buildMCPCalls(plan.playwrightPlan);
      }
      break;

    case 'guide':
      // Hero via Imagen + step screenshots via Playwright
      plan.imagenPrompts = generateImagePrompts({
        title, slug, articleType, sections, count: 1,
      });
      if (guideSteps.length > 0) {
        plan.playwrightPlan = generateGuidePlan({
          toolName: toolInfo.name || title,
          toolUrl: toolInfo.url || '',
          slug,
          steps: guideSteps,
        });
        plan.playwrightMCPCalls = buildMCPCalls(plan.playwrightPlan);
      }
      break;

    case 'comparison':
    case 'best-of':
      // Decorative only — components ARE the visuals
      plan.imagenPrompts = generateImagePrompts({
        title, slug, articleType, sections, count: 3,
      });
      break;

    case 'analysis':
      // Decorative stat visuals
      plan.imagenPrompts = generateImagePrompts({
        title, slug, articleType, sections, count: 4,
      });
      break;

    default:
      plan.imagenPrompts = generateImagePrompts({
        title, slug, articleType, sections, count: 3,
      });
  }

  plan.totalImages = plan.imagenPrompts.length + plan.playwrightPlan.length;

  return plan;
}

/**
 * Get a human-readable summary of the image plan.
 *
 * @param {object} plan - From createImagePlan()
 * @returns {string} Summary text
 */
function summarizePlan(plan) {
  const lines = [];
  lines.push(`Article type: ${plan.articleType}`);
  lines.push(`Image strategy: ${plan.strategy}`);
  lines.push(`Total images: ${plan.totalImages}`);
  lines.push('');

  if (plan.imagenPrompts.length > 0) {
    lines.push(`Imagen 4 (decorative): ${plan.imagenPrompts.length} images`);
    plan.imagenPrompts.forEach((p, i) => {
      lines.push(`  ${i + 1}. ${p.name} → ${p.outputPath}`);
    });
    lines.push('');
  }

  if (plan.playwrightPlan.length > 0) {
    lines.push(`Playwright (screenshots): ${plan.playwrightPlan.length} captures`);
    plan.playwrightPlan.forEach((s, i) => {
      lines.push(`  ${i + 1}. ${s.description} → ${s.outputPath}`);
    });
    lines.push('');
  }

  if (plan.playwrightMCPCalls.length > 0) {
    lines.push(`MCP tool calls needed: ${plan.playwrightMCPCalls.length}`);
  }

  return lines.join('\n');
}

module.exports = {
  createImagePlan,
  summarizePlan,
};
