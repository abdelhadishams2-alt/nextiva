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
 * Components used (from Mansati project):
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
    // Single tool — all CTAs point to the same partner
    heroCTA: true,
    sidebar: true,
    mobileBar: true,
    disclosure: true,
    midArticleInterval: 3,    // every 3 sections
    inlineCTAInterval: 2,     // inline CTA every 2 sections (offset from mid)
    conclusionCTA: true,
    maxCTAs: 8,
  },
  comparison: {
    // Multiple tools — CTAs for the "winner" or rotate between tools
    heroCTA: false,            // no single tool to promote in hero
    sidebar: true,
    mobileBar: true,
    disclosure: true,
    midArticleInterval: 3,
    inlineCTAInterval: 0,     // inline CTAs inside comparison tables instead
    conclusionCTA: true,
    perToolCTA: true,          // CTA button per tool in comparison table
    maxCTAs: 10,
  },
  versus: {
    // Two tools — alternate CTAs between them
    heroCTA: false,
    sidebar: true,
    mobileBar: false,
    disclosure: true,
    midArticleInterval: 3,
    inlineCTAInterval: 2,
    conclusionCTA: true,
    alternateCTAs: true,       // switch between tool A and tool B
    maxCTAs: 6,
  },
  'best-of': {
    // Ranked list — CTA per ranked tool
    heroCTA: false,
    sidebar: true,
    mobileBar: true,
    disclosure: true,
    midArticleInterval: 4,
    inlineCTAInterval: 0,
    conclusionCTA: true,
    perToolCTA: true,
    maxCTAs: 12,
  },
  guide: {
    // How-to — CTA for the tool being demonstrated
    heroCTA: true,
    sidebar: true,
    mobileBar: true,
    disclosure: true,
    midArticleInterval: 4,
    inlineCTAInterval: 3,
    conclusionCTA: true,
    maxCTAs: 6,
  },
  analysis: {
    // Market analysis — minimal CTAs, more informational
    heroCTA: false,
    sidebar: true,
    mobileBar: false,
    disclosure: true,
    midArticleInterval: 5,
    inlineCTAInterval: 0,
    conclusionCTA: true,
    maxCTAs: 4,
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

  // 5. Mid-article and inline CTAs (placed between sections)
  sections.forEach((section, i) => {
    if (ctaCount >= maxCTAs) return;
    const sectionNum = i + 1;

    // Mid-article CTA (banner style)
    if (config.midArticleInterval && sectionNum > 1 && sectionNum % config.midArticleInterval === 0) {
      const partner = getPartnerForPosition(sectionNum, {
        primaryPartner, partners, versusInfo, config,
      });

      plan.placements.push({
        position: `after-section-${i + 2}`,
        sectionIndex: i,
        component: 'AffiliateMidArticle',
        props: {
          partner,
          variant: `mid-s${i + 2}`,
        },
      });
      ctaCount++;
    }

    // Inline CTA (text link style)
    if (config.inlineCTAInterval && sectionNum > 1 && sectionNum % config.inlineCTAInterval === 0 && sectionNum % config.midArticleInterval !== 0) {
      if (ctaCount >= maxCTAs) return;

      const partner = getPartnerForPosition(sectionNum, {
        primaryPartner, partners, versusInfo, config,
      });

      plan.placements.push({
        position: `inline-section-${i + 2}`,
        sectionIndex: i,
        component: 'AffiliateLink',
        props: {
          partner,
          variant: `inline-s${i + 2}`,
          inline: true,
        },
      });
      ctaCount++;
    }

    // Per-tool CTA (in comparison tables / ranked cards)
    if (config.perToolCTA && section.partner && ctaCount < maxCTAs) {
      plan.placements.push({
        position: `tool-cta-section-${i + 2}`,
        sectionIndex: i,
        component: 'AffiliateLink',
        props: {
          partner: section.partner,
          variant: `tool-s${i + 2}`,
          inline: false,
        },
      });
      ctaCount++;
    }
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
