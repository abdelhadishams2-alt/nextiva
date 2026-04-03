/**
 * Article Type Auto-Detector for SEO Engine.
 *
 * Analyzes the input keyword/topic and infers the article type.
 * Supports manual override via "type:{type}" suffix.
 *
 * Article types:
 *   - review      → Single tool deep dive (scores, pros/cons, pricing, screenshots)
 *   - comparison   → 3+ tools compared (tables, winner cards, pricing grids)
 *   - versus       → Exactly 2 tools head-to-head (split layout, scoring per category)
 *   - best-of      → Ranked listicle (numbered cards, mini ratings, badges)
 *   - guide        → Step-by-step how-to (numbered steps, callouts, screenshots)
 *   - analysis     → Data-driven market/industry insights (stat cards, charts, quotes)
 */

const ARTICLE_TYPES = {
  review: {
    name: 'Single Tool Review',
    description: 'Deep dive into one tool — scores, pros/cons, pricing tiers, screenshots',
    imageStrategy: 'screenshots',
    components: ['score-card', 'pros-cons', 'pricing-tiers', 'feature-checklist', 'verdict-box', 'who-is-this-for', 'alternatives'],
  },
  comparison: {
    name: 'Comparison Article',
    description: 'Compare 3+ tools head-to-head — tables, winner cards, pricing grids',
    imageStrategy: 'decorative',
    components: ['comparison-table', 'winner-card', 'pricing-grid', 'pros-cons', 'verdict-box', 'methodology'],
  },
  versus: {
    name: 'Versus Article',
    description: 'Head-to-head between exactly 2 tools — split layout, scoring per category',
    imageStrategy: 'screenshots',
    components: ['split-comparison', 'category-scoring', 'winner-badge', 'decision-block', 'verdict-box'],
  },
  'best-of': {
    name: 'Best-of Listicle',
    description: 'Ranked list with mini-reviews — numbered cards, badges, quick specs',
    imageStrategy: 'decorative',
    components: ['ranked-card', 'mini-rating', 'quick-specs', 'editors-pick-badge', 'comparison-cta'],
  },
  guide: {
    name: 'How-To Guide',
    description: 'Step-by-step tutorial — numbered steps, tips, screenshots',
    imageStrategy: 'screenshots',
    components: ['step-process', 'callout-block', 'checklist', 'time-difficulty', 'tip-warning'],
  },
  analysis: {
    name: 'Industry Analysis',
    description: 'Data-driven insights — stat cards, charts, expert quotes, timelines',
    imageStrategy: 'decorative',
    components: ['stat-card', 'data-table', 'expert-quote', 'timeline', 'source-citation', 'bar-chart'],
  },
};

// Patterns for auto-detection (order matters — more specific first)
const DETECTION_RULES = [
  // Versus: exactly 2 tools with "vs"
  {
    type: 'versus',
    patterns: [
      /^(.+)\s+vs\.?\s+(.+)$/i,
      /^(.+)\s+versus\s+(.+)$/i,
      /^(.+)\s+compared\s+to\s+(.+)$/i,
      /^(.+)\s+or\s+(.+)\s*[\?:]/i,
    ],
    validate: (match) => {
      // Only "versus" if it's exactly 2 things (no additional "vs")
      const full = match[0];
      const vsCount = (full.match(/\bvs\.?\b|\bversus\b/gi) || []).length;
      return vsCount === 1;
    },
  },

  // Review: single tool name + "review" keyword
  {
    type: 'review',
    patterns: [
      /\breview\b/i,
      /\breviewed\b/i,
      /\bin-depth\s+look\b/i,
      /\bhands[- ]on\b/i,
      /\bfull\s+breakdown\b/i,
      /\bis\s+it\s+worth\b/i,
      /\bhonest\s+take\b/i,
    ],
  },

  // Guide: how-to patterns
  {
    type: 'guide',
    patterns: [
      /\bhow\s+to\b/i,
      /\bstep[- ]by[- ]step\b/i,
      /\btutorial\b/i,
      /\bguide\s+to\b/i,
      /\bbeginner'?s?\s+guide\b/i,
      /\bsetup\s+guide\b/i,
      /\bcomplete\s+guide\b/i,
      /\bgetting\s+started\b/i,
      /\bwalkthrough\b/i,
    ],
  },

  // Best-of: ranked list patterns
  {
    type: 'best-of',
    patterns: [
      /\bbest\s+\d*/i,
      /\btop\s+\d+/i,
      /\b\d+\s+best\b/i,
      /\bcheapest\b/i,
      /\bfastest\b/i,
      /\bmost\s+popular\b/i,
      /\bour\s+picks?\b/i,
      /\brecommended\b/i,
      /\bfree\s+\w+\s+(tools?|software|apps?|platforms?)/i,
    ],
  },

  // Comparison: multiple tools compared
  {
    type: 'comparison',
    patterns: [
      /\bcompar(e|ison|ing)\b/i,
      /\bvs\.?\s+.+\s+vs\.?\b/i,  // 3+ tools with multiple "vs"
      /\balternatives?\s+to\b/i,
      /\bwhich\s+(is|are)\s+better\b/i,
      /\bside[- ]by[- ]side\b/i,
      /\bprice\s+comparison\b/i,
      /\bfeature\s+comparison\b/i,
    ],
  },

  // Analysis: data/market patterns
  {
    type: 'analysis',
    patterns: [
      /\bmarket\b/i,
      /\bindustry\b/i,
      /\btrends?\b.*\b20\d{2}\b/i,
      /\bstatistics\b/i,
      /\bforecast\b/i,
      /\bstate\s+of\b/i,
      /\bresearch\b/i,
      /\breport\b/i,
      /\blandscape\b/i,
      /\b20\d{2}\b.*\b(outlook|predictions?|trends?)\b/i,
    ],
  },
];

/**
 * Detect article type from a keyword/topic string.
 *
 * Supports manual override: "Wix Review type:review"
 *
 * @param {string} input - The topic keyword or title
 * @returns {{ type: string, meta: object, input: string }}
 *   type  — one of: review, comparison, versus, best-of, guide, analysis
 *   meta  — article type metadata (name, description, imageStrategy, components)
 *   input — cleaned input (override suffix stripped)
 */
function detectArticleType(input) {
  if (!input || typeof input !== 'string') {
    return { type: 'analysis', meta: ARTICLE_TYPES.analysis, input: input || '' };
  }

  // Check for manual override: "topic type:review"
  const overrideMatch = input.match(/\btype:(\w[\w-]*)\s*$/i);
  if (overrideMatch) {
    const override = overrideMatch[1].toLowerCase();
    const cleanInput = input.replace(/\btype:\w[\w-]*\s*$/i, '').trim();
    if (ARTICLE_TYPES[override]) {
      return { type: override, meta: ARTICLE_TYPES[override], input: cleanInput };
    }
  }

  const cleanInput = input.replace(/\btype:\w[\w-]*\s*$/i, '').trim();

  // Run detection rules
  for (const rule of DETECTION_RULES) {
    for (const pattern of rule.patterns) {
      const match = cleanInput.match(pattern);
      if (match) {
        // Run validator if present
        if (rule.validate && !rule.validate(match)) continue;
        return { type: rule.type, meta: ARTICLE_TYPES[rule.type], input: cleanInput };
      }
    }
  }

  // Default: analysis (safest fallback — works for any topic)
  return { type: 'analysis', meta: ARTICLE_TYPES.analysis, input: cleanInput };
}

/**
 * Get the image strategy for an article type.
 *
 * @param {string} type - Article type
 * @returns {'screenshots' | 'decorative' | 'mixed'}
 */
function getImageStrategy(type) {
  const meta = ARTICLE_TYPES[type];
  return meta ? meta.imageStrategy : 'decorative';
}

/**
 * Get the recommended components for an article type.
 *
 * @param {string} type - Article type
 * @returns {string[]} Component names
 */
function getTypeComponents(type) {
  const meta = ARTICLE_TYPES[type];
  return meta ? meta.components : [];
}

/**
 * List all article types.
 */
function listArticleTypes() {
  return Object.entries(ARTICLE_TYPES).map(([id, meta]) => ({
    id,
    ...meta,
  }));
}

module.exports = {
  ARTICLE_TYPES,
  detectArticleType,
  getImageStrategy,
  getTypeComponents,
  listArticleTypes,
};
