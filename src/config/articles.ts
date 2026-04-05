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
