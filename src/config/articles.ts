/* ----------------------------------------------------------------
   Articles Registry
   Used by the admin social posting page to list all articles.
   ---------------------------------------------------------------- */

export interface ArticleInfo {
  slug: string;
  title: string;
  description: string;
  image: string;
  category: string;
}

export const articles: ArticleInfo[] = [
  {
    slug: 'article-shopify-saudi',
    title: 'From Zero to First Sale: Building a Shopify Store for the Saudi Market',
    description: 'A comprehensive guide to creating a Shopify store for the Saudi market.',
    image: '/assets/articles/article-shopify-saudi-1.webp',
    category: 'E-Commerce',
  },
  {
    slug: 'article-ecommerce-tco',
    title: 'The True Cost of Your Ecommerce Platform: A Revenue-Tiered TCO Analysis',
    description: 'Compare the real TCO for Shopify, WooCommerce, BigCommerce, and Adobe Commerce.',
    image: '/assets/articles/article-ecommerce-tco-1.webp',
    category: 'E-Commerce',
  },
  {
    slug: 'tap-payment-gateway',
    title: 'The Regulatory Moat: How Tap Payments Locked Down All 6 GCC Licenses',
    description: 'Tap Payments is the only fintech holding all six GCC payment licenses.',
    image: '/assets/articles/article-tap-regulatory-moat-1.webp',
    category: 'Payments',
  },
  {
    slug: 'foodics-saudi-arabia',
    title: 'From POS to Payroll: The Making of a Super-Platform',
    description: 'How Foodics evolved from a Saudi POS startup into a super-platform.',
    image: '/assets/articles/article-foodics-superplatform-1.webp',
    category: 'Restaurant Technology',
  },
  {
    slug: 'article-mpos-hidden-math',
    title: 'The Hidden Math of Mobile POS: What That 2.6% Fee Really Costs You',
    description: 'Compare the true 3-year TCO for Square, Clover, SumUp, Toast, and Shopify POS.',
    image: '/assets/articles/article-mpos-hidden-math-1.webp',
    category: 'POS & Payments',
  },
  {
    slug: 'erp-software-saudi-arabia',
    title: 'ERP Decision Framework for Saudi Businesses',
    description: 'ZATCA compliance, vendor scorecards, and TCO analysis across 8 providers.',
    image: '/assets/articles/article-erp-saudi-1.webp',
    category: 'Enterprise',
  },
  {
    slug: 'odoo-saudi-arabia',
    title: 'ZATCA Wave 24 Countdown: Why Saudi SMEs Must Act on Odoo Before June 2026',
    description: 'ZATCA Wave 24 hits June 2026 with SAR 375K threshold.',
    image: '/assets/articles/article-odoo-zatca-1.webp',
    category: 'Enterprise',
  },
  {
    slug: 'article-saudi-food-delivery',
    title: 'The Great Fragmentation: Saudi Arabia Food Delivery Market',
    description: 'Analysis of Saudi Arabia $10 billion food delivery market.',
    image: '/assets/articles/article-saudi-food-delivery-1.webp',
    category: 'Restaurant & Food',
  },
  {
    slug: 'article-inventory-framework',
    title: 'The Restaurant Inventory Intelligence Framework',
    description: 'A four-pillar framework for restaurant inventory management.',
    image: '/assets/articles/article-inventory-framework-1.webp',
    category: 'Restaurant & Food',
  },
  {
    slug: 'classera-middle-east',
    title: 'From LMS to Education Operating System: How Classera Is Building the Full Stack',
    description: 'Classera has evolved from an Arabic-first LMS into a six-pillar education OS.',
    image: '/assets/articles/article-classera-education-1.webp',
    category: 'Education',
  },
  {
    slug: 'delivery-apps',
    title: 'The Super-App Race: How Delivery Platforms Are Swallowing Everything',
    description: 'Delivery platforms are evolving into super-apps covering groceries, pharmacy, and finance.',
    image: '/assets/articles/article-super-app-race-1.webp',
    category: 'Technology',
  },
  {
    slug: 'cloud-based-inventory-management',
    title: 'Cloud Inventory Security: Why 99% of Breaches Are Your Fault',
    description: '99% of cloud inventory breaches stem from misconfigurations, not vendor failures.',
    image: '/assets/articles/article-cloud-inventory-1.webp',
    category: 'Inventory',
  },
  {
    slug: 'inventory-management-software',
    title: 'AI Inventory Forecasting in 2026: What Works vs. Marketing Hype',
    description: 'Separating proven AI forecasting capabilities from marketing hype.',
    image: '/assets/articles/article-ai-inventory-1.webp',
    category: 'Inventory',
  },
  {
    slug: 'online-inventory-management-system',
    title: 'Real-Time Inventory as Competitive Moat: How Multi-Channel Sync Wins',
    description: 'How real-time inventory synchronization creates durable competitive advantage.',
    image: '/assets/articles/article-realtime-inventory-1.webp',
    category: 'Inventory',
  },
  {
    slug: 'restaurant-inventory-management-system',
    title: 'The $162 Billion Leak: How Restaurants Hemorrhage Money Through Invisible Losses',
    description: 'US restaurants lose $162 billion annually to invisible inventory waste.',
    image: '/assets/articles/article-restaurant-losses-1.webp',
    category: 'Restaurant & Food',
  },
  {
    slug: 'project-management-companies-in-saudi-arabia',
    title: 'Saudi-Born vs. Global Giants: The New Rivalry Reshaping Project Management',
    description: 'How Saudi-born consultancies and international PM giants compete.',
    image: '/assets/articles/article-saudi-pm-1.webp',
    category: 'Saudi Arabia',
  },
];
