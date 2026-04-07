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
    slug: 'best-website-builders',
    title: '6 Best Website Builders in Saudi Arabia 2026: Tested & Compared',
    description: 'We tested Wix, Shopify, Salla, Zid, WordPress, and Squarespace for Saudi businesses.',
    image: '/assets/articles/best-website-builders-saudi-1.webp',
    category: 'Technology',
  },
  {
    slug: 'best-pos-systems',
    title: 'Best POS Systems in Saudi Arabia 2026: ZATCA Compliance, Pricing & Honest Verdicts',
    description: 'We tested 9 POS systems for the Saudi market — Foodics, Marn, Odoo, Loyverse, and more.',
    image: '/assets/articles/best-pos-systems-saudi-1.webp',
    category: 'Technology',
  },
  {
    slug: 'best-crm-software',
    title: 'Best CRM Software in Saudi Arabia (2026): Honest Comparison for Saudi Businesses',
    description: 'Compare the 7 best CRM platforms for Saudi businesses in 2026.',
    image: '/assets/articles/best-crm-saudi-1.webp',
    category: 'Technology',
  },
  {
    slug: 'best-hr-software',
    title: '7 Best HR Software in Saudi Arabia (2026): GOSI, Mudad & Saudization Compliance',
    description: 'Compare 7 HR platforms for Saudi businesses — GOSI integration, Mudad WPS compliance.',
    image: '/assets/articles/best-hr-software-saudi-1.webp',
    category: 'Technology',
  },
  {
    slug: 'best-project-management-tools',
    title: 'Best Project Management Tools (2026): The Right Tool for Every Team Size',
    description: 'We tested ClickUp, Monday.com, Asana, Notion, Jira, Trello, Wrike, and more.',
    image: '/assets/articles/best-pm-tools-1.webp',
    category: 'Business Tools',
  },
  {
    slug: 'odoo-zatca-compliance',
    title: 'Odoo ZATCA Compliance 2026: Step-by-Step Setup Guide for Saudi SMEs',
    description: 'Complete guide to setting up Odoo for ZATCA Phase 2 e-invoicing in Saudi Arabia.',
    image: '/assets/articles/odoo-saudi-arabia-1.webp',
    category: 'Technology',
  },
  {
    slug: 'shopify-vs-salla',
    title: 'Shopify vs Salla: Which Is Better for Saudi Sellers?',
    description: 'Side-by-side comparison of Shopify and Salla for Saudi e-commerce — pricing, features, ZATCA compliance, and verdict.',
    image: '/assets/articles/shopify-vs-salla-1.webp',
    category: 'E-Commerce',
  },
  {
    slug: 'how-to-build-shopify-store',
    title: 'How to Build a Shopify Store in Saudi Arabia',
    description: 'Complete 10-step guide to launching your Shopify store for the Saudi market.',
    image: '/assets/articles/how-to-build-shopify-store-2.webp',
    category: 'E-Commerce',
  },
  {
    slug: 'foodics-review',
    title: 'Foodics Review 2026: The All-in-One Restaurant POS Built for Saudi Arabia',
    description: 'An honest breakdown of Foodics — POS, inventory, delivery, ZATCA compliance, and pricing.',
    image: '/assets/articles/foodics-review-1.webp',
    category: 'Restaurant Technology',
  },
];
