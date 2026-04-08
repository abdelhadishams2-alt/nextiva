import { SITE_CONFIG } from '@/config/site';

interface BreadcrumbJsonLdProps {
  items: { name: string; url: string }[];
}

// Note: dangerouslySetInnerHTML is used here for JSON-LD structured data output --
// content is developer-controlled via JSON.stringify, not user-generated input
export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_CONFIG.url}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
