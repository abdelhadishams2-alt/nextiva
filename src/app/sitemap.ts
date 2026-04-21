import type { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/config/site';

const articleDates: Record<string, string> = {
  'rayyan-coffee-foodics-case-study': '2026-04-20',
  'best-payment-gateways': '2026-04-20',
  'best-accounting-software': '2026-04-20',
  'best-hr-software': '2026-04-06',
  'best-crm-software': '2026-04-06',
  'best-pos-systems': '2026-04-06',
  'best-project-management-tools': '2026-04-07',
  'odoo-zatca-compliance': '2026-04-06',
  'best-website-builders': '2026-04-06',
  'shopify-vs-salla': '2026-04-04',
  'how-to-build-shopify-store': '2026-04-04',
  'foodics-review': '2026-04-03',
};

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = Object.entries(articleDates).map(([slug, date]) => ({
    url: `${SITE_CONFIG.url}/${slug}`,
    lastModified: new Date(date),
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
    {
      url: `${SITE_CONFIG.url}/privacy-policy`,
      lastModified: new Date('2026-04-07'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_CONFIG.url}/terms`,
      lastModified: new Date('2026-04-07'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
