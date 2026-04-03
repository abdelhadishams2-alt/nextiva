/**
 * Screenshot Capture for SEO Engine — Playwright MCP.
 *
 * Captures real screenshots from tool websites for:
 * - Single tool reviews (UI walkthrough steps)
 * - Versus articles (both tools side by side)
 * - How-to guides (step-by-step screenshots)
 *
 * Uses the Playwright MCP tools (browser_navigate, browser_snapshot,
 * browser_take_screenshot, browser_click, etc.).
 *
 * Screenshots are saved to public/assets/articles/{slug}-step-{n}.webp
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Screenshot plan — defines what pages/steps to capture for an article.
 *
 * Each plan is an array of steps. Each step describes:
 *   - url: page to navigate to
 *   - action: optional interaction before screenshot (click, scroll, hover)
 *   - selector: optional element to click/interact with
 *   - description: what this screenshot shows (used for alt text)
 *   - crop: optional region to capture { x, y, width, height }
 *   - waitFor: optional selector to wait for before capturing
 *   - delay: optional ms to wait after navigation/action
 */

/**
 * Generate a screenshot plan for a tool review.
 *
 * @param {object} opts
 * @param {string} opts.toolName - Name of the tool (e.g. "Wix", "Shopify")
 * @param {string} opts.toolUrl - Main URL of the tool
 * @param {string} opts.slug - Article slug
 * @param {Array}  [opts.keyPages] - Specific pages to capture
 * @param {number} [opts.maxScreenshots=6] - Max screenshots to take
 * @returns {Array<object>} Screenshot plan steps
 */
function generateReviewPlan(opts) {
  const { toolName, toolUrl, slug, keyPages = [], maxScreenshots = 6 } = opts;

  const baseUrl = toolUrl.replace(/\/+$/, '');
  const plan = [];

  // 1. Homepage / main dashboard
  plan.push({
    url: baseUrl,
    description: `${toolName} homepage`,
    outputPath: `public/assets/articles/${slug}-screenshot-1.webp`,
    waitFor: 'body',
    delay: 2000,
  });

  // 2. Pricing page (common pattern)
  plan.push({
    url: `${baseUrl}/pricing`,
    description: `${toolName} pricing page`,
    outputPath: `public/assets/articles/${slug}-screenshot-2.webp`,
    waitFor: 'body',
    delay: 2000,
  });

  // 3. Key pages specified by the article architect
  keyPages.forEach((page, i) => {
    if (plan.length >= maxScreenshots) return;
    plan.push({
      url: page.url || `${baseUrl}${page.path || ''}`,
      description: page.description || `${toolName} — ${page.name || `page ${i + 3}`}`,
      action: page.action || null,
      selector: page.selector || null,
      outputPath: `public/assets/articles/${slug}-screenshot-${plan.length + 1}.webp`,
      waitFor: page.waitFor || 'body',
      delay: page.delay || 2000,
    });
  });

  return plan;
}

/**
 * Generate a screenshot plan for a versus article (2 tools).
 *
 * @param {object} opts
 * @param {string} opts.toolA - First tool name
 * @param {string} opts.toolAUrl - First tool URL
 * @param {string} opts.toolB - Second tool name
 * @param {string} opts.toolBUrl - Second tool URL
 * @param {string} opts.slug - Article slug
 * @returns {Array<object>} Screenshot plan steps
 */
function generateVersusPlan(opts) {
  const { toolA, toolAUrl, toolB, toolBUrl, slug } = opts;

  return [
    {
      url: toolAUrl,
      description: `${toolA} homepage`,
      outputPath: `public/assets/articles/${slug}-${slugify(toolA)}-home.webp`,
      waitFor: 'body',
      delay: 2000,
    },
    {
      url: toolBUrl,
      description: `${toolB} homepage`,
      outputPath: `public/assets/articles/${slug}-${slugify(toolB)}-home.webp`,
      waitFor: 'body',
      delay: 2000,
    },
    {
      url: `${toolAUrl.replace(/\/+$/, '')}/pricing`,
      description: `${toolA} pricing`,
      outputPath: `public/assets/articles/${slug}-${slugify(toolA)}-pricing.webp`,
      waitFor: 'body',
      delay: 2000,
    },
    {
      url: `${toolBUrl.replace(/\/+$/, '')}/pricing`,
      description: `${toolB} pricing`,
      outputPath: `public/assets/articles/${slug}-${slugify(toolB)}-pricing.webp`,
      waitFor: 'body',
      delay: 2000,
    },
  ];
}

/**
 * Generate a screenshot plan for a how-to guide.
 *
 * @param {object} opts
 * @param {string} opts.toolName - Tool being demonstrated
 * @param {string} opts.toolUrl - Tool URL
 * @param {string} opts.slug - Article slug
 * @param {Array}  opts.steps - Guide steps [{url, action, selector, description}]
 * @returns {Array<object>} Screenshot plan steps
 */
function generateGuidePlan(opts) {
  const { toolName, toolUrl, slug, steps = [] } = opts;

  return steps.map((step, i) => ({
    url: step.url || toolUrl,
    description: step.description || `Step ${i + 1}`,
    action: step.action || null,
    selector: step.selector || null,
    outputPath: `public/assets/articles/${slug}-step-${i + 1}.webp`,
    waitFor: step.waitFor || 'body',
    delay: step.delay || 2000,
  }));
}

/**
 * Build Playwright MCP tool calls from a screenshot plan.
 *
 * Returns an array of MCP tool call objects ready to be executed
 * sequentially by the orchestrator.
 *
 * @param {Array<object>} plan - Screenshot plan from generate*Plan()
 * @returns {Array<{tool: string, params: object, outputPath: string, description: string}>}
 */
function buildMCPCalls(plan) {
  const calls = [];

  for (const step of plan) {
    // Navigate
    calls.push({
      tool: 'mcp__plugin_playwright_playwright__browser_navigate',
      params: { url: step.url },
      description: `Navigate to ${step.description}`,
    });

    // Wait for content
    if (step.waitFor) {
      calls.push({
        tool: 'mcp__plugin_playwright_playwright__browser_wait_for',
        params: { selector: step.waitFor, timeout: 10000 },
        description: `Wait for ${step.waitFor}`,
      });
    }

    // Optional delay
    if (step.delay) {
      calls.push({
        tool: '_delay',
        params: { ms: step.delay },
        description: `Wait ${step.delay}ms for page to settle`,
      });
    }

    // Optional action (click, scroll, etc.)
    if (step.action === 'click' && step.selector) {
      calls.push({
        tool: 'mcp__plugin_playwright_playwright__browser_click',
        params: { selector: step.selector },
        description: `Click ${step.selector}`,
      });
      // Wait after click
      calls.push({
        tool: '_delay',
        params: { ms: 1000 },
        description: 'Wait after click',
      });
    }

    // Take screenshot
    calls.push({
      tool: 'mcp__plugin_playwright_playwright__browser_take_screenshot',
      params: {},
      outputPath: step.outputPath,
      description: `Screenshot: ${step.description}`,
    });
  }

  return calls;
}

/**
 * Convert a Playwright PNG screenshot to WebP.
 *
 * @param {string} pngPath - Absolute path to source PNG
 * @param {string} webpPath - Absolute path to destination WebP
 * @param {number} [quality=80] - WebP quality (0-100)
 * @returns {Promise<boolean>} Whether conversion succeeded
 */
async function convertScreenshotToWebP(pngPath, webpPath, quality = 80) {
  try {
    await execAsync(`cwebp -q ${quality} "${pngPath}" -o "${webpPath}"`);
    // Remove the source PNG after conversion
    await fs.promises.unlink(pngPath);
    return true;
  } catch {
    try {
      await execAsync(`ffmpeg -y -i "${pngPath}" -quality ${quality} "${webpPath}"`);
      await fs.promises.unlink(pngPath);
      return true;
    } catch {
      // Fallback: rename PNG to .webp (browsers handle it)
      await fs.promises.rename(pngPath, webpPath);
      return false;
    }
  }
}

/**
 * Ensure the screenshots directory exists.
 *
 * @param {string} projectDir
 */
async function ensureScreenshotDir(projectDir) {
  const dir = path.join(projectDir, 'public', 'assets', 'articles');
  await fs.promises.mkdir(dir, { recursive: true });
  return dir;
}

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

module.exports = {
  generateReviewPlan,
  generateVersusPlan,
  generateGuidePlan,
  buildMCPCalls,
  ensureScreenshotDir,
  convertScreenshotToWebP,
};
