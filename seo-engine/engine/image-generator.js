/**
 * Image Generator for SEO Engine — Imagen 4 via Gemini MCP.
 *
 * Generates decorative images for articles:
 * - Hero banners
 * - Section illustrations
 * - Infographic-style visuals
 *
 * Uses the gemini-generate-image MCP tool.
 * Generated images are saved to public/assets/articles/{slug}-{n}.webp
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Gemini MCP output directory
const GEMINI_OUTPUT_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || '',
  '.config', 'gemini-mcp', 'output'
);

/**
 * Image style presets per article type.
 * These guide the prompt to produce consistent, on-brand visuals.
 */
const STYLE_PRESETS = {
  hero: {
    style: 'modern editorial illustration, clean minimalist design, professional tech aesthetic',
    aspect: 'landscape',
    width: 1200,
    height: 630,
  },
  section: {
    style: 'clean infographic style, minimal flat illustration, subtle gradients, professional',
    aspect: 'landscape',
    width: 800,
    height: 450,
  },
  comparison: {
    style: 'side-by-side product comparison visual, clean grid layout, tech editorial style',
    aspect: 'landscape',
    width: 1000,
    height: 560,
  },
  'stat-visual': {
    style: 'data visualization illustration, charts and graphs aesthetic, corporate blue tones',
    aspect: 'landscape',
    width: 800,
    height: 450,
  },
};

/**
 * Brand color guidance for Mansati.
 * Included in every prompt to keep images on-brand.
 */
const BRAND_GUIDANCE = [
  'Color palette: navy blue (#02122c), blue (#0062b8), white, subtle warm neutrals.',
  'Style: clean, professional, editorial. No cartoons, no stock photo feel.',
  'Text in image: NONE. Never include text, labels, or watermarks in the image.',
  'Background: clean gradients or subtle geometric patterns, not busy.',
].join(' ');

/**
 * Generate image prompts for an article.
 *
 * Returns an array of prompt objects that can be passed to the
 * gemini-generate-image MCP tool or to generateImages().
 *
 * @param {object} opts
 * @param {string} opts.title - Article title
 * @param {string} opts.slug - URL slug
 * @param {string} opts.articleType - Article type (review, comparison, etc.)
 * @param {Array}  opts.sections - Article sections
 * @param {number} [opts.count=4] - Number of images to generate (1 hero + sections)
 * @returns {Array<{name: string, prompt: string, preset: string, outputPath: string}>}
 */
function generateImagePrompts(opts) {
  const { title, slug, articleType, sections = [], count = 4 } = opts;

  const prompts = [];

  // 1. Hero image (always)
  const heroPreset = STYLE_PRESETS.hero;
  prompts.push({
    name: `${slug}-1`,
    prompt: buildPrompt({
      subject: title,
      context: 'Hero banner for a professional tech review article.',
      style: heroPreset.style,
    }),
    preset: 'hero',
    width: heroPreset.width,
    height: heroPreset.height,
    outputPath: `public/assets/articles/${slug}-1.webp`,
  });

  // 2. Section images
  const sectionCount = Math.min(count - 1, sections.length, 5);
  for (let i = 0; i < sectionCount; i++) {
    const section = sections[i];
    const sectionTitle = section.title || section.sidebarLabel || `Section ${i + 2}`;

    let preset;
    if (articleType === 'comparison' || articleType === 'versus') {
      preset = STYLE_PRESETS.comparison;
    } else if (articleType === 'analysis') {
      preset = STYLE_PRESETS['stat-visual'];
    } else {
      preset = STYLE_PRESETS.section;
    }

    prompts.push({
      name: `${slug}-${i + 2}`,
      prompt: buildPrompt({
        subject: sectionTitle,
        context: `Illustration for article section about "${sectionTitle}" in an article titled "${title}".`,
        style: preset.style,
      }),
      preset: preset === STYLE_PRESETS.comparison ? 'comparison' : 'section',
      width: preset.width,
      height: preset.height,
      outputPath: `public/assets/articles/${slug}-${i + 2}.webp`,
    });
  }

  return prompts;
}

/**
 * Build a complete image generation prompt.
 */
function buildPrompt({ subject, context, style }) {
  return [
    `Create a professional editorial illustration for: "${subject}".`,
    context,
    `Visual style: ${style}.`,
    BRAND_GUIDANCE,
  ].join('\n');
}

/**
 * Convert a PNG image to WebP format using cwebp or sharp.
 * Falls back to copying as-is if conversion tools aren't available.
 *
 * @param {string} inputPath - Absolute path to source PNG
 * @param {string} outputPath - Absolute path to destination WebP
 * @param {number} [quality=80] - WebP quality (0-100)
 * @returns {Promise<boolean>} Whether conversion succeeded
 */
async function convertToWebP(inputPath, outputPath, quality = 80) {
  try {
    // Try cwebp (Google's official WebP encoder)
    await execAsync(`cwebp -q ${quality} "${inputPath}" -o "${outputPath}"`);
    return true;
  } catch {
    try {
      // Fallback: try ffmpeg
      await execAsync(`ffmpeg -y -i "${inputPath}" -quality ${quality} "${outputPath}"`);
      return true;
    } catch {
      // Last resort: copy the PNG with .webp extension (browsers handle it)
      console.warn('No WebP converter found (cwebp/ffmpeg). Copying PNG as-is.');
      await fs.promises.copyFile(inputPath, outputPath);
      return false;
    }
  }
}

/**
 * Copy a generated image from Gemini MCP output to the project.
 * Automatically converts PNG → WebP for performance.
 *
 * @param {string} sourceName - The image filename in Gemini output dir
 * @param {string} destPath - Destination path relative to project root (must end in .webp)
 * @param {string} projectDir - Absolute path to project root
 * @returns {Promise<boolean>} Whether the copy succeeded
 */
async function copyGeneratedImage(sourceName, destPath, projectDir) {
  const dest = path.join(projectDir, destPath);

  try {
    // Ensure destination directory exists
    await fs.promises.mkdir(path.dirname(dest), { recursive: true });

    // Find the most recent matching file in Gemini output
    const files = await fs.promises.readdir(GEMINI_OUTPUT_DIR);
    const matching = files
      .filter(f => f.includes(sourceName) || f.endsWith('.png') || f.endsWith('.webp'))
      .sort()
      .reverse();

    if (matching.length === 0) {
      console.warn(`No generated image found for: ${sourceName}`);
      return false;
    }

    const sourceFile = path.join(GEMINI_OUTPUT_DIR, matching[0]);
    const isPNG = sourceFile.endsWith('.png') || sourceFile.endsWith('.PNG');
    const destIsWebP = dest.endsWith('.webp');

    if (isPNG && destIsWebP) {
      // Convert PNG → WebP
      return await convertToWebP(sourceFile, dest);
    }

    // Already WebP or no conversion needed
    await fs.promises.copyFile(sourceFile, dest);
    return true;
  } catch (err) {
    console.warn(`Failed to copy image: ${err.message}`);
    return false;
  }
}

/**
 * Ensure the article images directory exists in the project.
 *
 * @param {string} projectDir - Absolute path to project root
 */
async function ensureImageDir(projectDir) {
  const dir = path.join(projectDir, 'public', 'assets', 'articles');
  await fs.promises.mkdir(dir, { recursive: true });
  return dir;
}

module.exports = {
  STYLE_PRESETS,
  BRAND_GUIDANCE,
  generateImagePrompts,
  buildPrompt,
  copyGeneratedImage,
  convertToWebP,
  ensureImageDir,
};
