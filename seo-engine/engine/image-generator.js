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
 * Brand color guidance for lkwjd.
 * Included in every prompt to keep images on-brand.
 */
const BRAND_GUIDANCE = [
  'Color palette: navy blue (#02122c), blue (#0062b8), white, subtle warm neutrals.',
  'Style: clean, professional, editorial. No cartoons, no stock photo feel.',
  'Text in image: NONE. Never include any text, labels, watermarks, or readable words in the image.',
  'Language: NEVER include Arabic script, Arabic text, Arabic characters, or any RTL text in the image. All UI/screens shown must use English only.',
  'Cultural props: Do NOT add Saudi/Arab cultural props (Arabic coffee dallah, dates, prayer beads, camels, desert scenes, Arabic calligraphy) unless the article is specifically about those topics. Focus ONLY on the article subject matter.',
  'Background: clean gradients or subtle geometric patterns, not busy.',
].join(' ');

/**
 * Hero-specific guidance.
 * Hero images sit BEHIND text (title, badge, meta) so they must be:
 * - Dark enough for white text readability
 * - No objects/faces in the center (text goes there)
 * - Abstract/minimal — not illustrative
 */
const HERO_GUIDANCE = [
  'This image will be used as a BACKGROUND behind white text.',
  'The center must be dark and empty — no objects, faces, or bright elements in the center area.',
  'Keep visual elements (geometric patterns, light effects) at the edges and corners only.',
  'The overall image must be dark (navy/deep blue) so white text overlaid on it is perfectly readable.',
  'Think: premium SaaS landing page background, not an illustration.',
  'NEVER include any text, words, labels, or readable characters in the image.',
  'NEVER include Arabic script, Arabic text, or Arabic characters anywhere in the image. All visible UI, screens, and signage must be in English only.',
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
  const { title, slug, articleType, sections = [], count = 4, description } = opts;

  const prompts = [];

  // 1. Hero image — content-relevant scene representing the article topic
  const heroPreset = STYLE_PRESETS.hero;
  prompts.push({
    name: `${slug}-1`,
    prompt: buildHeroPrompt({
      subject: title,
      description: description || sections.map(s => s.title || s.sidebarLabel).filter(Boolean).join(', '),
    }),
    preset: 'hero',
    width: heroPreset.width,
    height: heroPreset.height,
    outputPath: `public/assets/articles/${slug}-1.webp`,
  });

  // 2. Section images — each must visually represent its specific section topic
  const sectionCount = Math.min(count - 1, sections.length, 5);
  for (let i = 0; i < sectionCount; i++) {
    const section = sections[i];
    const sectionTitle = section.title || section.sidebarLabel || `Section ${i + 2}`;
    const sectionDesc = section.description || section.summary || '';

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
        context: sectionDesc
          ? `This section covers: ${sectionDesc}. Show a realistic scene that directly illustrates this specific topic.`
          : `This section is about "${sectionTitle}" in an article titled "${title}". Show a realistic scene that directly illustrates this specific topic — not a generic image.`,
        style: preset.style,
        articleTitle: title,
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
 *
 * IMPORTANT: Every image must visually represent the specific article topic
 * and section content. Generic or unrelated images hurt user trust and SEO.
 *
 * @param {object} opts
 * @param {string} opts.subject - Section title
 * @param {string} opts.context - What the section is about
 * @param {string} opts.style - Visual style preset
 * @param {string} opts.articleTitle - Full article title (for context)
 */
function buildPrompt({ subject, context, style, articleTitle }) {
  return [
    `Create a photorealistic editorial image for a section titled "${subject}" in an article about "${articleTitle || subject}".`,
    `The image MUST visually represent this specific topic: ${context}`,
    'Show a realistic scene, objects, tools, or environment directly related to the section topic. The viewer should immediately understand what the section is about just by looking at the image.',
    'Do NOT create generic stock photos, abstract patterns, or unrelated scenes. The image must be SPECIFIC to the content.',
    'Do NOT add Saudi/Arab cultural props (coffee dallah, dates, camels, desert, Arabic calligraphy) unless the section is specifically about those topics. Focus on the subject matter only.',
    `Visual style: ${style}. Photorealistic, professional editorial photography.`,
    'IMPORTANT: Do not include any Arabic text, Arabic script, or Arabic characters anywhere in the image. Any text visible on screens, signs, or UI must be in English only.',
    BRAND_GUIDANCE,
  ].join('\n');
}

/**
 * Build a hero-specific image prompt.
 *
 * Hero images must be content-relevant — showing real objects, tools,
 * or environments related to the article topic. They sit behind text
 * so they need a dark overlay-friendly composition.
 *
 * @param {object} opts
 * @param {string} opts.subject - Article title
 * @param {string} [opts.description] - Brief description of what the article covers
 */
function buildHeroPrompt({ subject, description }) {
  return [
    `Create a cinematic, content-relevant hero image for an article titled: "${subject}".`,
    description
      ? `The article covers: ${description}. The image MUST visually represent this topic.`
      : `The image MUST visually represent the topic "${subject}" — show realistic objects, tools, screens, or environments directly related to this subject.`,
    'Show a realistic scene that a reader would immediately associate with this article topic.',
    'Composition: the image will have white text overlaid, so ensure the left side and center-bottom are slightly darker or have less visual detail. Important visual elements should be on the right side and top.',
    'Do NOT create generic abstract backgrounds, geometric patterns, or unrelated scenes.',
    'Do NOT add Saudi/Arab cultural props (coffee dallah, dates, camels, desert scenes, Arabic calligraphy, traditional clothing) unless the article is specifically about those topics. The image should look international and focus purely on the subject matter.',
    'IMPORTANT: Do not include any Arabic text, Arabic script, or Arabic characters anywhere in the image. Any text visible on screens, signs, or UI must be in English only.',
    HERO_GUIDANCE,
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

/**
 * Convert a Gemini-generated image (JPEG/PNG) to WebP.
 * All article images MUST be .webp — never .jpeg or .png.
 *
 * @param {string} sourcePath - Absolute path to source image
 * @param {string} destPath - Absolute path to .webp destination
 * @param {number} [quality=80] - WebP quality (0-100)
 * @returns {Promise<boolean>} Whether conversion succeeded
 */
async function convertToWebP(sourcePath, destPath, quality = 80) {
  try {
    await execAsync(`ffmpeg -y -i "${sourcePath}" -quality ${quality} "${destPath}"`);
    return true;
  } catch {
    try {
      await execAsync(`cwebp -q ${quality} "${sourcePath}" -o "${destPath}"`);
      return true;
    } catch {
      await fs.promises.copyFile(sourcePath, destPath);
      return false;
    }
  }
}

module.exports = {
  STYLE_PRESETS,
  BRAND_GUIDANCE,
  HERO_GUIDANCE,
  generateImagePrompts,
  buildPrompt,
  buildHeroPrompt,
  copyGeneratedImage,
  convertToWebP,
  ensureImageDir,
};
