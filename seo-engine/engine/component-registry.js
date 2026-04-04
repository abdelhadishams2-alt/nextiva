/**
 * Component Registry for SEO Engine.
 *
 * Maps article types to their recommended components.
 * Priority: Mansati components (primary) → 193 blueprint registry (fallback).
 *
 * Each component entry includes:
 *   - name: Component display name
 *   - file: TSX filename in seo-engine/components/ui/
 *   - css: CSS filename in seo-engine/components/ui/
 *   - articleTypes: Which article types use this component
 *   - placement: Where in the article it appears
 *   - priority: 'primary' (Mansati) or 'fallback' (193 registry)
 */

const MANSATI_COMPONENTS = {
  // ── Review Components ─────────────────────────────────────────
  ReviewHeroCard: {
    name: 'Review Hero Card',
    file: 'ReviewHeroCard.tsx',
    css: 'review-hero-card.css',
    articleTypes: ['review', 'best-of', 'versus'],
    placement: 'hero',
    priority: 'primary',
    variants: ['full', 'compact', 'versus'],
    description: 'Product header with logo, score circle, pros/cons, pricing, CTA, and Review/Pricing tabs.',
  },

  RankingTable: {
    name: 'Ranking Table',
    file: 'RankingTable.tsx',
    css: 'ranking-table.css',
    articleTypes: ['best-of', 'comparison'],
    placement: 'body',
    priority: 'primary',
    description: 'Ranked comparison table with logos, ratings, pricing, pros/cons, and per-tool CTAs.',
  },

  ArticleIntro: {
    name: 'Article Intro',
    file: 'ArticleIntro.tsx',
    css: 'article-intro.css',
    articleTypes: ['review', 'comparison', 'versus', 'best-of', 'guide', 'analysis'],
    placement: 'intro',
    priority: 'primary',
    description: 'Article header with title, subtitle, date, authors, methodology box, badge, and intro paragraphs.',
  },

  // ── Pricing & Tables ──────────────────────────────────────────
  PricingTable: {
    name: 'Pricing Comparison Table',
    file: 'PricingTable.tsx',
    css: 'pricing-table.css',
    articleTypes: ['comparison', 'best-of', 'guide'],
    placement: 'body',
    priority: 'primary',
    description: 'Provider pricing comparison table with responsive data-th labels.',
  },

  PlanPricingTable: {
    name: 'Plan Pricing Table',
    file: 'PlanPricingTable.tsx',
    css: 'plan-pricing-table.css',
    articleTypes: ['review', 'comparison', 'guide'],
    placement: 'body',
    priority: 'primary',
    description: 'Detailed plan pricing with monthly/yearly prices, features, and discount footnote.',
  },

  FeatureMatrix: {
    name: 'Feature Matrix',
    file: 'FeatureMatrix.tsx',
    css: 'feature-matrix.css',
    articleTypes: ['review', 'comparison'],
    placement: 'body',
    priority: 'primary',
    description: 'Grouped feature comparison matrix with section headings and plan columns.',
  },

  SimplePricing: {
    name: 'Simple Pricing',
    file: 'SimplePricing.tsx',
    css: 'simple-pricing.css',
    articleTypes: ['review', 'guide'],
    placement: 'body',
    priority: 'primary',
    description: 'Simplified pricing display with price/name/description rows.',
  },

  PricingCards: {
    name: 'Pricing Cards',
    file: 'PricingCards.tsx',
    css: 'pricing-cards.css',
    articleTypes: ['review', 'comparison', 'guide', 'best-of'],
    placement: 'body',
    priority: 'primary',
    variants: ['light', 'dark-popular'],
    description: 'Interactive pricing plan cards with monthly/annual toggle, popular highlight, mobile carousel with drag.',
  },

  // ── Content Blocks ────────────────────────────────────────────
  FaqAccordion: {
    name: 'FAQ Accordion',
    file: 'FaqAccordion.tsx',
    css: 'faq-accordion.css',
    articleTypes: ['review', 'guide', 'analysis', 'comparison'],
    placement: 'body',
    priority: 'primary',
    description: 'Expandable FAQ with aria attributes and smooth transitions.',
  },

  RecommendationTabs: {
    name: 'Recommendation Tabs',
    file: 'RecommendationTabs.tsx',
    css: 'recommendation-tabs.css',
    articleTypes: ['review', 'guide', 'comparison'],
    placement: 'body',
    priority: 'primary',
    description: 'Two-tab component: "Recommended If" (green) and "Not Recommended If" (red).',
  },

  ReviewSummary: {
    name: 'Review Summary',
    file: 'ReviewSummary.tsx',
    css: 'review-summary.css',
    articleTypes: ['review', 'analysis'],
    placement: 'body',
    priority: 'primary',
    description: 'Summary info box with accent border and rich content support.',
  },

  MethodologyBox: {
    name: 'Methodology Box',
    file: 'MethodologyBox.tsx',
    css: 'methodology-box.css',
    articleTypes: ['review', 'comparison', 'guide', 'analysis'],
    placement: 'intro',
    priority: 'primary',
    description: 'Credibility box with author avatars, verified badges, and methodology link.',
  },

  // ── Media ─────────────────────────────────────────────────────
  VideoPlayer: {
    name: 'Video Player',
    file: 'VideoPlayer.tsx',
    css: 'video-player.css',
    articleTypes: ['review', 'guide'],
    placement: 'body',
    priority: 'primary',
    description: 'Tabbed multi-video player with lazy iframe loading and thumbnail overlays.',
  },

  VideoEmbed: {
    name: 'Video Embed',
    file: 'VideoEmbed.tsx',
    css: 'video-embed.css',
    articleTypes: ['review', 'guide'],
    placement: 'body',
    priority: 'primary',
    description: 'Single YouTube embed with thumbnail+play overlay and optional CTA.',
  },

  ExampleCarousel: {
    name: 'Example Carousel',
    file: 'ExampleCarousel.tsx',
    css: 'example-carousel.css',
    articleTypes: ['best-of', 'review', 'comparison'],
    placement: 'body',
    priority: 'primary',
    description: 'Category-filtered horizontal carousel with site cards, drag support, and navigation.',
  },

  // ── Interactive ───────────────────────────────────────────────
  QuickStartGuide: {
    name: 'Quick Start Guide',
    file: 'QuickStartGuide.tsx',
    css: 'quick-start-guide.css',
    articleTypes: ['guide', 'review'],
    placement: 'body',
    priority: 'primary',
    description: 'Collapsible step-by-step guide with ordered steps and images.',
  },

  SmartQuiz: {
    name: 'Smart Quiz',
    file: 'SmartQuiz.tsx',
    css: 'smart-quiz.css',
    articleTypes: ['review', 'guide'],
    placement: 'body',
    priority: 'primary',
    description: 'Multi-step scoring quiz with results and affiliate CTA.',
  },

  // ── Navigation & Utility ──────────────────────────────────────
  Breadcrumbs: {
    name: 'Breadcrumbs',
    file: 'Breadcrumbs.tsx',
    css: 'breadcrumbs.css',
    articleTypes: ['review', 'comparison', 'versus', 'best-of', 'guide', 'analysis'],
    placement: 'nav',
    priority: 'primary',
    description: 'Linked breadcrumb trail with current page highlight.',
  },

  NewsletterBanner: {
    name: 'Newsletter Banner',
    file: 'NewsletterBanner.tsx',
    css: 'newsletter-banner.css',
    articleTypes: ['review', 'comparison', 'versus', 'best-of', 'guide', 'analysis'],
    placement: 'between-sections',
    priority: 'primary',
    description: 'Dark navy CTA banner for newsletter signup.',
  },
};

/**
 * Get components for an article type, ordered by placement.
 *
 * @param {string} articleType - review, comparison, versus, best-of, guide, analysis
 * @returns {Array<object>} Components sorted by placement order
 */
function getComponentsForType(articleType) {
  const placementOrder = ['nav', 'hero', 'intro', 'body', 'between-sections'];

  return Object.entries(MANSATI_COMPONENTS)
    .filter(([, comp]) => comp.articleTypes.includes(articleType))
    .map(([key, comp]) => ({ key, ...comp }))
    .sort((a, b) => placementOrder.indexOf(a.placement) - placementOrder.indexOf(b.placement));
}

/**
 * Get a specific component by key.
 *
 * @param {string} key - Component key (e.g. 'ReviewHeroCard')
 * @returns {object|null}
 */
function getComponent(key) {
  return MANSATI_COMPONENTS[key] || null;
}

/**
 * List all Mansati components.
 */
function listComponents() {
  return Object.entries(MANSATI_COMPONENTS).map(([key, comp]) => ({
    key,
    name: comp.name,
    articleTypes: comp.articleTypes,
    placement: comp.placement,
  }));
}

/**
 * Get the component layout for an article type.
 * Returns the recommended component stack from top to bottom.
 *
 * @param {string} articleType
 * @returns {object} Layout with named slots
 */
function getArticleLayout(articleType) {
  const components = getComponentsForType(articleType);

  const layouts = {
    review: {
      nav: ['Breadcrumbs'],
      hero: ['ReviewHeroCard'],
      intro: ['ArticleIntro'],
      body: [
        'ReviewSummary',
        'QuickStartGuide',
        'VideoPlayer',
        'PlanPricingTable',
        'FeatureMatrix',
        'RecommendationTabs',
        'FaqAccordion',
        'SmartQuiz',
      ],
      between: ['NewsletterBanner'],
    },
    comparison: {
      nav: ['Breadcrumbs'],
      hero: [],
      intro: ['ArticleIntro'],
      body: [
        'RankingTable',
        'PricingTable',
        'FeatureMatrix',
        'RecommendationTabs',
        'FaqAccordion',
        'ExampleCarousel',
      ],
      between: ['NewsletterBanner'],
    },
    versus: {
      nav: ['Breadcrumbs'],
      hero: ['ReviewHeroCard'],  // two cards side by side (versus variant)
      intro: ['ArticleIntro'],
      body: [
        'PricingTable',
        'FeatureMatrix',
        'RecommendationTabs',
        'FaqAccordion',
      ],
      between: ['NewsletterBanner'],
    },
    'best-of': {
      nav: ['Breadcrumbs'],
      hero: [],
      intro: ['ArticleIntro'],
      body: [
        'RankingTable',
        'ReviewHeroCard',  // compact variant, repeated per tool
        'PricingTable',
        'ExampleCarousel',
        'FaqAccordion',
      ],
      between: ['NewsletterBanner'],
    },
    guide: {
      nav: ['Breadcrumbs'],
      hero: [],
      intro: ['ArticleIntro'],
      body: [
        'QuickStartGuide',
        'VideoEmbed',
        'SimplePricing',
        'PlanPricingTable',
        'SmartQuiz',
        'FaqAccordion',
      ],
      between: ['NewsletterBanner'],
    },
    analysis: {
      nav: ['Breadcrumbs'],
      hero: [],
      intro: ['ArticleIntro'],
      body: [
        'ReviewSummary',
        'PricingTable',
        'FaqAccordion',
      ],
      between: ['NewsletterBanner'],
    },
  };

  return layouts[articleType] || layouts.analysis;
}

module.exports = {
  MANSATI_COMPONENTS,
  getComponentsForType,
  getComponent,
  listComponents,
  getArticleLayout,
};
