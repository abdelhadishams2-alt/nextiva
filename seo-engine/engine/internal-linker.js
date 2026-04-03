/**
 * Internal Linking Engine for SEO Engine.
 *
 * Scans existing articles in the project and automatically generates
 * internal links between related articles. Follows the Tooltester pattern
 * of 15-40 internal links per article.
 *
 * Link types:
 *   1. Inline contextual — "read our [Wix review](/wix-review)"
 *   2. Related articles section — "You might also like" block
 *   3. Cross-reference — "See our [comparison of CRM tools](/best-crm-tools)"
 *
 * How it works:
 *   1. Scans src/app/[locale]/ for existing article pages
 *   2. Reads their metadata (title, keywords, type) from messages/en.json
 *   3. For a new article, finds related existing articles by keyword overlap
 *   4. Returns link suggestions with anchor text and placement recommendations
 */

const fs = require('fs');
const path = require('path');

/**
 * Scan the project for existing articles and build an article index.
 *
 * @param {string} projectDir - Absolute path to project root
 * @returns {Promise<Array<{slug: string, path: string, title: string, keywords: string[]}>>}
 */
async function scanExistingArticles(projectDir) {
  const articles = [];

  // Scan src/app/[locale]/ for article directories
  const localeDir = path.join(projectDir, 'src', 'app', '[locale]');

  let entries;
  try {
    entries = await fs.promises.readdir(localeDir, { withFileTypes: true });
  } catch {
    return articles;
  }

  // Skip non-article directories
  const skipDirs = new Set(['out', 'blogs', 'admin', 'api']);

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (skipDirs.has(entry.name)) continue;
    if (entry.name.startsWith('(') || entry.name.startsWith('[')) continue;

    const slug = entry.name;
    const pagePath = path.join(localeDir, slug, 'page.tsx');

    try {
      await fs.promises.access(pagePath);
    } catch {
      continue;
    }

    // Extract title from the page file (look for getTranslations namespace)
    const pageContent = await fs.promises.readFile(pagePath, 'utf-8');
    const nsMatch = pageContent.match(/getTranslations\(['"]Articles\.(\w+)['"]\)/);
    const namespace = nsMatch ? nsMatch[1] : null;

    // Extract keywords from metadata function
    const keywordsMatch = pageContent.match(/keywords:\s*['"]([^'"]+)['"]/);
    const keywords = keywordsMatch
      ? keywordsMatch[1].split(',').map(k => k.trim().toLowerCase())
      : extractKeywordsFromSlug(slug);

    // Try to get the title from messages/en.json
    let title = slug.replace(/-/g, ' ').replace(/\barticle\b/gi, '').trim();
    if (namespace) {
      try {
        const messagesPath = path.join(projectDir, 'messages', 'en.json');
        const messages = JSON.parse(await fs.promises.readFile(messagesPath, 'utf-8'));
        const articleMsgs = messages.Articles?.[namespace];
        if (articleMsgs?.metaTitle) title = articleMsgs.metaTitle;
        else if (articleMsgs?.heroTitle) title = articleMsgs.heroTitle;
      } catch {}
    }

    articles.push({ slug, path: `/${slug}`, title, keywords, namespace });
  }

  return articles;
}

/**
 * Find related articles for a new article based on keyword overlap.
 *
 * @param {object} newArticle - { title, keywords, slug }
 * @param {Array} existingArticles - From scanExistingArticles()
 * @param {number} [maxLinks=20] - Maximum related articles to return
 * @returns {Array<{slug, path, title, relevance, anchorText}>}
 */
function findRelatedArticles(newArticle, existingArticles, maxLinks = 20) {
  const newKeywords = new Set([
    ...(newArticle.keywords || []),
    ...extractKeywordsFromSlug(newArticle.slug),
    ...extractKeywordsFromTitle(newArticle.title),
  ]);

  const scored = existingArticles
    .filter(a => a.slug !== newArticle.slug)
    .map(article => {
      const articleKeywords = new Set([
        ...(article.keywords || []),
        ...extractKeywordsFromSlug(article.slug),
      ]);

      // Calculate relevance score based on keyword overlap
      let overlap = 0;
      for (const kw of newKeywords) {
        if (articleKeywords.has(kw)) overlap++;
        // Partial match (e.g. "shopify" matches "shopify-saudi")
        for (const ak of articleKeywords) {
          if (ak.includes(kw) || kw.includes(ak)) overlap += 0.5;
        }
      }

      const relevance = overlap / Math.max(newKeywords.size, 1);

      return {
        ...article,
        relevance,
        anchorText: generateAnchorText(article),
      };
    })
    .filter(a => a.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxLinks);

  return scored;
}

/**
 * Generate internal link suggestions for a new article.
 *
 * Returns ready-to-use link objects that the adapter can inject
 * into the article JSX.
 *
 * @param {object} opts
 * @param {string} opts.title - New article title
 * @param {string} opts.slug - New article slug
 * @param {Array}  opts.keywords - New article keywords
 * @param {Array}  opts.sections - New article sections
 * @param {Array}  opts.existingArticles - From scanExistingArticles()
 * @returns {object} Link plan
 */
function generateLinkPlan(opts) {
  const { title, slug, keywords = [], sections = [], existingArticles = [] } = opts;

  const related = findRelatedArticles({ title, slug, keywords }, existingArticles);

  const plan = {
    inlineLinks: [],
    relatedSection: [],
    crossReferences: [],
    totalLinks: 0,
  };

  // 1. Inline contextual links — placed within section paragraphs
  //    Rule: 1-2 internal links per section, max 15 total
  const inlineMax = Math.min(15, related.length);
  let inlineCount = 0;

  sections.forEach((section, sectionIdx) => {
    if (inlineCount >= inlineMax) return;

    // Find 1-2 related articles relevant to this section
    const sectionKeywords = extractKeywordsFromTitle(section.title || '');
    const sectionRelated = related
      .filter(r => !plan.inlineLinks.some(l => l.slug === r.slug))
      .filter(r => {
        const rKeywords = new Set(r.keywords || []);
        return sectionKeywords.some(sk => rKeywords.has(sk) || r.slug.includes(sk));
      })
      .slice(0, 2);

    // If no section-specific match, take next from general pool
    const links = sectionRelated.length > 0
      ? sectionRelated
      : related.filter(r => !plan.inlineLinks.some(l => l.slug === r.slug)).slice(0, 1);

    links.forEach(link => {
      if (inlineCount >= inlineMax) return;
      plan.inlineLinks.push({
        slug: link.slug,
        path: link.path,
        anchorText: link.anchorText,
        sectionIndex: sectionIdx,
        translationKey: `internalLink${inlineCount + 1}`,
      });
      inlineCount++;
    });
  });

  // 2. Related articles section — "You might also like" (3-5 articles)
  plan.relatedSection = related
    .filter(r => !plan.inlineLinks.some(l => l.slug === r.slug))
    .slice(0, 5)
    .map(r => ({
      slug: r.slug,
      path: r.path,
      title: r.title,
      anchorText: r.anchorText,
    }));

  // 3. Cross-references — links from existing articles BACK to the new one
  //    (these are suggestions to update existing articles)
  plan.crossReferences = related.slice(0, 10).map(r => ({
    existingSlug: r.slug,
    existingPath: r.path,
    suggestedAnchorText: generateAnchorText({ slug, title }),
    newArticlePath: `/${slug}`,
  }));

  plan.totalLinks = plan.inlineLinks.length + plan.relatedSection.length;

  return plan;
}

/**
 * Generate natural anchor text for linking to an article.
 */
function generateAnchorText(article) {
  const title = article.title || article.slug.replace(/-/g, ' ');

  // Patterns: "our X review", "X comparison", "guide to X"
  if (article.slug.includes('review')) {
    const toolName = title.replace(/review/i, '').trim();
    return `our ${toolName} review`;
  }
  if (article.slug.includes('vs') || article.slug.includes('comparison')) {
    return `${title} comparison`;
  }
  if (article.slug.includes('how-to') || article.slug.includes('guide')) {
    return `our guide on ${title.replace(/how to/i, '').trim()}`;
  }
  if (article.slug.includes('best')) {
    return title.toLowerCase();
  }

  return title.toLowerCase();
}

/**
 * Extract keywords from a slug string.
 */
function extractKeywordsFromSlug(slug) {
  if (!slug) return [];
  return slug
    .split('-')
    .filter(w => w.length > 2)
    .filter(w => !['the', 'and', 'for', 'with', 'from', 'how', 'article'].includes(w))
    .map(w => w.toLowerCase());
}

/**
 * Extract keywords from a title string.
 */
function extractKeywordsFromTitle(title) {
  if (!title) return [];
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .filter(w => !['the', 'and', 'for', 'with', 'from', 'how', 'what', 'this', 'that', 'are'].includes(w));
}

/**
 * Summarize a link plan for logging.
 */
function summarizeLinkPlan(plan) {
  const lines = [];
  lines.push(`Total internal links: ${plan.totalLinks}`);
  lines.push('');

  if (plan.inlineLinks.length > 0) {
    lines.push(`Inline links (${plan.inlineLinks.length}):`);
    plan.inlineLinks.forEach((l, i) => {
      lines.push(`  ${i + 1}. "${l.anchorText}" → ${l.path} (section ${l.sectionIndex + 1})`);
    });
    lines.push('');
  }

  if (plan.relatedSection.length > 0) {
    lines.push(`"Related articles" section (${plan.relatedSection.length}):`);
    plan.relatedSection.forEach((r, i) => {
      lines.push(`  ${i + 1}. ${r.title} → ${r.path}`);
    });
    lines.push('');
  }

  if (plan.crossReferences.length > 0) {
    lines.push(`Cross-references to update (${plan.crossReferences.length}):`);
    plan.crossReferences.forEach((cr, i) => {
      lines.push(`  ${i + 1}. Add link in ${cr.existingPath} → "${cr.suggestedAnchorText}"`);
    });
  }

  return lines.join('\n');
}

module.exports = {
  scanExistingArticles,
  findRelatedArticles,
  generateLinkPlan,
  summarizeLinkPlan,
};
