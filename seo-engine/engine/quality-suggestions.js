/**
 * Quality Suggestions Generator — QG-001
 *
 * Generates prioritized, actionable fix instructions for failed/warning
 * checklist items and low E-E-A-T dimension scores.
 *
 * Features:
 * - Maps each checklist item to specific fix instructions
 * - Prioritizes by severity: fail > warning > info
 * - Limits output to top 15 most impactful suggestions
 * - Includes impact explanation for each suggestion
 *
 * Zero npm dependencies — Node.js built-ins only.
 */

'use strict';

/**
 * Suggestion templates keyed by checklist item ID.
 * Each provides a specific fix instruction and impact statement.
 */
const SUGGESTION_MAP = {
  1: {
    suggestion: 'Expand content with detailed explanations, examples, and case studies to reach 1,200-2,500 words.',
    impact: 'Comprehensive content ranks higher and keeps readers engaged longer.'
  },
  2: {
    suggestion: 'Add exactly one H1 tag as the main page title with your primary keyword.',
    impact: 'H1 is the strongest on-page SEO signal for topic relevance.'
  },
  3: {
    suggestion: 'Structure your content with 6-10 H2 sections covering subtopics of your main keyword.',
    impact: 'Well-structured content with clear sections improves rankings and user experience.'
  },
  4: {
    suggestion: 'Add 10-15 H3 subsections under your H2 headings for deeper content organization.',
    impact: 'Detailed subsections signal comprehensive coverage to search engines.'
  },
  5: {
    suggestion: 'Include your primary keyword naturally in 30-40% of H2 and H3 headings.',
    impact: 'Keyword presence in headings reinforces topical relevance without over-optimization.'
  },
  6: {
    suggestion: 'Add a table of contents with anchor links at the top of the article.',
    impact: 'TOC improves navigation and can generate sitelinks in search results.'
  },
  7: {
    suggestion: 'Add a quick answer box or summary within the first 300 words.',
    impact: 'Quick answers target featured snippets and improve user satisfaction.'
  },
  8: {
    suggestion: 'Include 2-4 metric highlight boxes with key statistics or data points.',
    impact: 'Visual data highlights improve scannability and engagement.'
  },
  9: {
    suggestion: 'Add 2-3 tables to present data, comparisons, or structured information.',
    impact: 'Tables improve content quality and can appear as rich results in search.'
  },
  10: {
    suggestion: 'Add blockquote elements for expert quotes, testimonials, or key takeaways.',
    impact: 'Quote boxes add credibility and visual variety to content.'
  },
  11: {
    suggestion: 'Add an FAQ section with 8-12 relevant questions and concise answers.',
    impact: 'FAQ sections target featured snippets and answer user questions directly.'
  },
  12: {
    suggestion: 'Add 2-3 call-to-action elements distributed throughout the content.',
    impact: 'CTAs improve conversion rates and guide readers to next steps.'
  },
  13: {
    suggestion: 'Adjust introduction to 200-250 words covering the main topic and what readers will learn.',
    impact: 'A well-crafted introduction sets expectations and reduces bounce rate.'
  },
  14: {
    suggestion: 'Write a conclusion of 150-200 words summarizing key points with a final CTA.',
    impact: 'Strong conclusions reinforce key takeaways and drive reader action.'
  },
  15: {
    suggestion: 'Add a Sources/References section at the end citing all external data.',
    impact: 'Source attribution builds trust and demonstrates research quality.'
  },
  16: {
    suggestion: 'Fix heading hierarchy — ensure H1 is followed by H2, H2 by H3, etc. without skipping levels.',
    impact: 'Proper hierarchy helps search engines understand content structure.'
  },
  17: {
    suggestion: 'Remove or fill empty heading tags with descriptive text.',
    impact: 'Empty headings confuse search engines and harm accessibility.'
  },
  18: {
    suggestion: 'Use your primary keyword 8-15 times throughout the content naturally.',
    impact: 'Proper keyword frequency establishes topical relevance.'
  },
  19: {
    suggestion: 'Reduce keyword usage — density above 2.5% risks keyword stuffing penalties.',
    impact: 'Natural keyword usage prevents search engine penalties.'
  },
  20: {
    suggestion: 'Include related/LSI terms in your headings to broaden topical coverage.',
    impact: 'LSI keywords help search engines understand context and rank for related queries.'
  },
  21: {
    suggestion: 'Add your primary keyword to the title tag, preferably near the beginning.',
    impact: 'Title tag keyword placement is one of the strongest ranking signals.'
  },
  22: {
    suggestion: 'Mention your primary keyword within the first paragraph of the article.',
    impact: 'Early keyword placement establishes topic relevance immediately.'
  },
  23: {
    suggestion: 'Include your keyword naturally in at least one H2 heading.',
    impact: 'Keywords in H2 headings reinforce section-level relevance.'
  },
  24: {
    suggestion: 'Include your keyword in at least one H3 subheading.',
    impact: 'H3 keyword usage supports detailed topical coverage.'
  },
  25: {
    suggestion: 'Adjust title tag to 50-60 characters for optimal search display.',
    impact: 'Proper title length ensures full visibility in search results.'
  },
  26: {
    suggestion: 'Write a meta description of 145-154 characters with keyword and call-to-action.',
    impact: 'Optimized meta descriptions improve click-through rates from search.'
  },
  27: {
    suggestion: 'Set a clear focus keyphrase for the article to guide optimization.',
    impact: 'A defined focus keyword ensures consistent on-page optimization.'
  },
  28: {
    suggestion: 'Optimize the SEO title with primary keyword and compelling language.',
    impact: 'Well-crafted SEO titles improve both rankings and click-through rates.'
  },
  29: {
    suggestion: 'Add 8-12 internal links to related content throughout the article.',
    impact: 'Internal linking distributes authority and keeps visitors on your site.'
  },
  30: {
    suggestion: 'Distribute internal links evenly throughout content, not clustered in one section.',
    impact: 'Even distribution looks natural to search engines and helps readers navigate.'
  },
  31: {
    suggestion: 'Use descriptive anchor text (3+ words) for internal links instead of generic text.',
    impact: 'Descriptive anchors help search engines understand linked page context.'
  },
  32: {
    suggestion: 'Place at least one internal link within the first 200 words.',
    impact: 'Early links help search engine crawlers discover important related content.'
  },
  33: {
    suggestion: 'Spread internal links across multiple paragraphs to avoid clustering.',
    impact: 'Distributed linking patterns look more natural to search engines.'
  },
  34: {
    suggestion: 'Add 2-3 external links to authoritative, relevant sources.',
    impact: 'Quality external links build trust and show thorough research.'
  },
  35: {
    suggestion: 'Use a mix of dofollow (2-3) and nofollow (1-2) external links.',
    impact: 'Mixed link attributes show natural linking patterns.'
  },
  36: {
    suggestion: 'Link only to high-authority, relevant websites as external sources.',
    impact: 'Authoritative source links build credibility with search engines.'
  },
  37: {
    suggestion: 'Add proper attribution with source citations for external data.',
    impact: 'Source attribution improves E-E-A-T signals and reader trust.'
  },
  38: {
    suggestion: 'Ensure each external link adds contextual value to the surrounding content.',
    impact: 'Contextual links provide more value than isolated references.'
  },
  39: {
    suggestion: 'Add a featured image at the top of the article.',
    impact: 'Featured images improve engagement and social sharing appearance.'
  },
  40: {
    suggestion: 'Add at least 4 relevant images distributed throughout the content.',
    impact: 'Images break up text, improve engagement, and can rank in image search.'
  },
  41: {
    suggestion: 'Add descriptive alt text to all images for accessibility and SEO.',
    impact: 'Alt text helps visually impaired users and provides image context to search engines.'
  },
  42: {
    suggestion: 'Include your keyword naturally in at least one image alt text.',
    impact: 'Keyword in alt text reinforces topical relevance for image search.'
  },
  43: {
    suggestion: 'Rename image files to descriptive, keyword-rich names (e.g., keyword-topic.jpg).',
    impact: 'Descriptive filenames improve image search rankings.'
  },
  44: {
    suggestion: 'Add title attributes to images with descriptive hover text.',
    impact: 'Title attributes enhance user experience and provide additional context.'
  },
  45: {
    suggestion: 'Fix heading hierarchy — ensure proper nesting without skipping levels.',
    impact: 'Correct heading structure is essential for accessibility and SEO.'
  },
  46: {
    suggestion: 'Break long paragraphs into 2-4 sentences for better readability.',
    impact: 'Short paragraphs improve scannability and reduce reader fatigue.'
  },
  47: {
    suggestion: 'Add bullet points and numbered lists (at least 3) to organize information.',
    impact: 'Lists improve readability and can appear as featured snippets.'
  },
  48: {
    suggestion: 'Bold key facts, statistics, and important terms throughout the content.',
    impact: 'Bold text improves scannability and highlights important information.'
  },
  49: {
    suggestion: 'Make headers more descriptive — aim for 15+ characters that clearly describe each section.',
    impact: 'Clear headers improve navigation and help search engines understand content.'
  },
  50: {
    suggestion: 'Add more paragraph breaks to increase white space and readability.',
    impact: 'Adequate white space reduces cognitive load and improves reading experience.'
  },
  51: {
    suggestion: 'Arabic content detected — ensure all RTL-specific optimizations are applied.',
    impact: 'Proper language support is essential for Arabic-speaking audiences.'
  },
  52: {
    suggestion: 'Add dir="rtl" attribute to the HTML container for Arabic content.',
    impact: 'RTL direction is essential for correct Arabic text rendering.'
  },
  53: {
    suggestion: 'Use an Arabic-optimized font (Cairo, Tajawal, Amiri) for better readability.',
    impact: 'Arabic-specific fonts significantly improve text legibility.'
  },
  54: {
    suggestion: 'Set text-align: right and direction: rtl for Arabic content sections.',
    impact: 'Proper RTL alignment ensures correct reading flow for Arabic text.'
  },
  55: {
    suggestion: 'Add schema markup (Article, FAQ, BreadcrumbList) using JSON-LD or microdata.',
    impact: 'Schema markup enables rich results in search and improves CTR.'
  },
  56: {
    suggestion: 'Vary sentence lengths — mix short impactful sentences with longer explanatory ones.',
    impact: 'Sentence variety improves readability and maintains reader interest.'
  },
  57: {
    suggestion: 'Include your primary keyword in the conclusion to reinforce topic relevance.',
    impact: 'Keyword in conclusion helps search engines confirm article topic.'
  },
  58: {
    suggestion: 'Add target="_blank" and rel="noopener" to external links for safe browsing.',
    impact: 'Opening external links in new tabs keeps visitors on your site.'
  },
  59: {
    suggestion: 'Add figcaption elements to images for better context and accessibility.',
    impact: 'Image captions are read 300% more than body text and improve engagement.'
  },
  60: {
    suggestion: 'Include your keyword in at least one internal link anchor text.',
    impact: 'Keyword-rich anchors help search engines understand your internal link structure.'
  }
};

/**
 * E-E-A-T improvement suggestions keyed by dimension name.
 */
const EEAT_SUGGESTION_MAP = {
  'Experience': {
    suggestion: 'Add personal experience indicators: case studies, "we tested/observed" language, hands-on examples.',
    impact: 'Google values first-hand experience as a key E-E-A-T signal.'
  },
  'Expertise': {
    suggestion: 'Demonstrate expertise with technical detail, specific data points, and in-depth analysis.',
    impact: 'Expertise signals improve topical authority and rankings.'
  },
  'Authoritativeness': {
    suggestion: 'Add citations to authoritative sources and include a references section.',
    impact: 'Authority signals build trust with both users and search engines.'
  },
  'Trustworthiness': {
    suggestion: 'Add publication dates, update timestamps, and transparent source attribution.',
    impact: 'Transparency signals build reader trust and improve E-E-A-T.'
  },
  'Content Depth': {
    suggestion: 'Expand coverage with more subtopics, FAQ section, and detailed explanations.',
    impact: 'Comprehensive content is more likely to rank for long-tail queries.'
  },
  'Original Research': {
    suggestion: 'Add original data, comparisons, tables, or unique analysis not found elsewhere.',
    impact: 'Original research creates unique value that competitors cannot replicate.'
  },
  'User Intent Match': {
    suggestion: 'Ensure the keyword appears in the title and first paragraph, add FAQ and TOC.',
    impact: 'Matching user intent is the primary ranking factor.'
  },
  'Readability': {
    suggestion: 'Use shorter paragraphs, more lists, and bold key facts for scannability.',
    impact: 'Better readability reduces bounce rate and increases time on page.'
  },
  'Technical Accuracy': {
    suggestion: 'Fix heading hierarchy, ensure single H1, and add schema markup.',
    impact: 'Technical correctness enables proper indexing and rich results.'
  },
  'Freshness': {
    suggestion: 'Include current year references, recent statistics, and update timestamps.',
    impact: 'Fresh content signals relevance for time-sensitive queries.'
  }
};

/**
 * Generate prioritized fix suggestions from checklist and E-E-A-T results.
 *
 * @param {object} checklistResults - Output from runChecklist()
 * @param {object} eeatResults - Output from runEEATScoring()
 * @returns {Array<{ priority: string, category: string, itemId: number|null, issue: string, suggestion: string, impact: string }>}
 */
function generateSuggestions(checklistResults, eeatResults) {
  const suggestions = [];

  // Process checklist failures and warnings
  for (const item of checklistResults.items) {
    if (item.status === 'fail' || item.status === 'warning') {
      const template = SUGGESTION_MAP[item.id];
      if (!template) continue;

      suggestions.push({
        priority: item.status === 'fail' ? 'high' : 'medium',
        category: item.category,
        itemId: item.id,
        issue: item.message,
        suggestion: template.suggestion,
        impact: template.impact
      });
    }
  }

  // Process low E-E-A-T scores (0 or 1 out of 3)
  if (eeatResults && eeatResults.dimensions) {
    for (const dim of eeatResults.dimensions) {
      if (dim.score <= 1) {
        const template = EEAT_SUGGESTION_MAP[dim.name];
        if (!template) continue;

        suggestions.push({
          priority: dim.score === 0 ? 'high' : 'medium',
          category: 'E-E-A-T: ' + dim.name,
          itemId: null,
          issue: `${dim.name} score: ${dim.score}/${dim.maxScore}`,
          suggestion: template.suggestion,
          impact: template.impact
        });
      }
    }
  }

  // Sort: high priority first, then medium, then low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Limit to top 15 suggestions
  return suggestions.slice(0, 15);
}

module.exports = { generateSuggestions, SUGGESTION_MAP, EEAT_SUGGESTION_MAP };
