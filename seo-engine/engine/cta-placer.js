/**
 * Auto CTA Placement for SEO Engine.
 *
 * Automatically injects affiliate CTAs into generated articles following
 * the Tooltester pattern: 6-8 CTAs per article, placed strategically.
 *
 * Placement rules:
 *   1. Hero CTA — "Try {tool} Free" button in hero section
 *   2. After section 2 — AffiliateMidArticle component
 *   3. Every 2-3 sections — alternating inline CTA and mid-article CTA
 *   4. Sidebar — AffiliateSidebar (always present)
 *   5. Mobile bar — AffiliateMobileBar (sticky on scroll)
 *   6. Conclusion — final CTA before footer
 *
 * Components used (from lkwjd project):
 *   - AffiliateLink (inline and button)
 *   - AffiliateMidArticle (mid-article banner)
 *   - AffiliateSidebar (TOC sidebar widget)
 *   - AffiliateMobileBar (sticky mobile bar)
 *   - AffiliateDisclosure (top of article)
 */

const { ARTICLE_TYPES } = require('./article-type-detector');

/**
 * CTA placement configuration per article type.
 */
const CTA_CONFIGS = {
  review: {
    // 3 CTA cards (sidebar, middle, bottom) + mobile sticky bar
    // All other affiliate links are inline text links (Tooltester style)
    heroCTA: false,
    sidebar: true,
    mobileBar: true,
    disclosure: true,
    midArticleCount: 1,        // exactly 1 mid-article card
    inlineCTAInterval: 0,      // no inline CTA cards — use text links instead
    conclusionCTA: true,       // 1 bottom card
    maxCTAs: 3,                // sidebar + middle + bottom = 3 cards total
  },
  comparison: {
    // 3 CTA cards: sidebar + middle + bottom. Per-tool CTAs are inline text links.
    heroCTA: false,
    sidebar: true,
    mobileBar: true,
    disclosure: true,
    midArticleCount: 1,
    inlineCTAInterval: 0,
    conclusionCTA: true,
    perToolCTA: false,
    maxCTAs: 3,
  },
  versus: {
    // 3 CTA cards: sidebar + middle + bottom
    heroCTA: false,
    sidebar: true,
    mobileBar: true,
    disclosure: true,
    midArticleCount: 1,
    inlineCTAInterval: 0,
    conclusionCTA: true,
    alternateCTAs: true,
    maxCTAs: 3,
  },
  'best-of': {
    // 3 CTA cards: sidebar + middle + bottom. Per-tool CTAs are inline text links.
    heroCTA: false,
    sidebar: true,
    mobileBar: true,
    disclosure: true,
    midArticleCount: 1,
    inlineCTAInterval: 0,
    conclusionCTA: true,
    perToolCTA: false,
    maxCTAs: 3,
  },
  guide: {
    // 3 CTA cards: sidebar + middle + bottom
    heroCTA: false,
    sidebar: true,
    mobileBar: true,
    disclosure: true,
    midArticleCount: 1,
    inlineCTAInterval: 0,
    conclusionCTA: true,
    maxCTAs: 3,
  },
  analysis: {
    // 3 CTA cards: sidebar + middle + bottom
    heroCTA: false,
    sidebar: true,
    mobileBar: true,
    disclosure: true,
    midArticleCount: 1,
    inlineCTAInterval: 0,
    conclusionCTA: true,
    maxCTAs: 3,
  },
};

/**
 * Generate a CTA placement plan for an article.
 *
 * Returns an array of CTA insertions with their position, type,
 * and component props — ready for the adapter to render as JSX.
 *
 * @param {object} opts
 * @param {string} opts.articleType - Detected article type
 * @param {Array}  opts.sections - Article sections
 * @param {string} [opts.primaryPartner] - Main affiliate partner key (e.g. "wix")
 * @param {Array}  [opts.partners] - All partners mentioned (for comparison/best-of)
 * @param {object} [opts.versusInfo] - { toolA: { partner }, toolB: { partner } }
 * @returns {object} CTA plan
 */
function generateCTAPlan(opts) {
  const {
    articleType,
    sections = [],
    primaryPartner,
    partners = [],
    versusInfo = {},
  } = opts;

  const config = CTA_CONFIGS[articleType] || CTA_CONFIGS.analysis;
  const plan = {
    articleType,
    config,
    placements: [],
  };

  let ctaCount = 0;
  const maxCTAs = config.maxCTAs;

  // 1. Disclosure (always first)
  if (config.disclosure) {
    plan.placements.push({
      position: 'after-author-box',
      component: 'AffiliateDisclosure',
      props: {},
    });
  }

  // 2. Hero CTA
  if (config.heroCTA && primaryPartner && ctaCount < maxCTAs) {
    plan.placements.push({
      position: 'hero',
      component: 'AffiliateLink',
      props: {
        partner: primaryPartner,
        variant: 'hero',
        inline: false,
      },
    });
    ctaCount++;
  }

  // 3. Sidebar
  if (config.sidebar && primaryPartner) {
    plan.placements.push({
      position: 'sidebar',
      component: 'AffiliateSidebar',
      props: {
        partner: primaryPartner,
        variant: 'sidebar',
      },
    });
  }

  // 4. Mobile bar
  if (config.mobileBar && primaryPartner) {
    plan.placements.push({
      position: 'mobile-bar',
      component: 'AffiliateMobileBar',
      props: {
        partner: primaryPartner,
      },
    });
  }

  // 5. Mid-article CTA card (exactly 1, placed at ~middle of article)
  if (config.midArticleCount && primaryPartner && ctaCount < maxCTAs) {
    const midIndex = Math.floor(sections.length / 2);
    const partner = getPartnerForPosition(midIndex, {
      primaryPartner, partners, versusInfo, config,
    });

    plan.placements.push({
      position: `after-section-${midIndex + 2}`,
      sectionIndex: midIndex,
      component: 'AffiliateMidArticle',
      props: {
        partner,
        variant: 'mid',
      },
    });
    ctaCount++;
  }

  // Note: No inline CTA cards or per-tool CTA cards.
  // Affiliate links within article text use plain <a> tags (Tooltester style),
  // not AffiliateMidArticle or AffiliateLink components.
  sections.forEach(() => {
  });

  // 6. Conclusion CTA
  if (config.conclusionCTA && primaryPartner && ctaCount < maxCTAs) {
    plan.placements.push({
      position: 'conclusion',
      component: 'AffiliateMidArticle',
      props: {
        partner: primaryPartner,
        variant: 'conclusion',
      },
    });
    ctaCount++;
  }

  plan.totalCTAs = ctaCount;

  return plan;
}

/**
 * Pick the right partner for a CTA position.
 * For versus articles, alternates between tool A and B.
 * For comparison/best-of, rotates through all partners.
 */
function getPartnerForPosition(sectionNum, { primaryPartner, partners, versusInfo, config }) {
  if (config.alternateCTAs && versusInfo.toolA && versusInfo.toolB) {
    return sectionNum % 2 === 0 ? versusInfo.toolA.partner : versusInfo.toolB.partner;
  }

  if (partners.length > 0) {
    return partners[(sectionNum - 1) % partners.length];
  }

  return primaryPartner;
}

/**
 * Get a human-readable summary of the CTA plan.
 */
function summarizeCTAPlan(plan) {
  const lines = [];
  lines.push(`Article type: ${plan.articleType}`);
  lines.push(`Total CTAs: ${plan.totalCTAs}`);
  lines.push(`Max allowed: ${plan.config.maxCTAs}`);
  lines.push('');
  lines.push('Placements:');
  plan.placements.forEach((p, i) => {
    lines.push(`  ${i + 1}. [${p.position}] <${p.component}> partner=${p.props.partner || 'n/a'}`);
  });
  return lines.join('\n');
}

module.exports = {
  CTA_CONFIGS,
  generateCTAPlan,
  summarizeCTAPlan,
};
