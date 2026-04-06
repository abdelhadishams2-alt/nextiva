import type { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/config/site';

const articleSlugs = [
  'best-hr-software',
  'best-crm-software',
  'best-pos-systems',
  'odoo-zatca-compliance',
  'best-website-builders',
  'shopify-vs-salla',
  'how-to-build-shopify-store',
  'foodics-review',
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
