import type { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/config/site';

const articleSlugs = [
  'article-ecommerce-tco',
  'article-inventory-framework',
  'article-mpos-hidden-math',
  'article-saudi-food-delivery',
  'article-shopify-saudi',
  'classera-middle-east',
  'cloud-based-inventory-management',
  'delivery-apps',
  'erp-software-saudi-arabia',
  'foodics-saudi-arabia',
  'inventory-management-software',
  'odoo-saudi-arabia',
  'online-inventory-management-system',
  'project-management-companies-in-saudi-arabia',
  'restaurant-inventory-management-system',
  'tap-payment-gateway',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = articleSlugs.map((slug) => ({
    url: `${SITE_CONFIG.url}/${slug}`,
    lastModified: new Date('2026-03-24'),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: SITE_CONFIG.url,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_CONFIG.url}/blogs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...articles,
  ];
}
