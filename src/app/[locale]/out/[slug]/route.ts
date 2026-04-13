import { NextRequest, NextResponse } from 'next/server';
import { affiliatePartners } from '@/config/affiliates';

/**
 * Affiliate redirect route: /out/[slug]
 *
 * Supports two slug formats:
 *   /out/shopify          → redirects to Shopify affiliate URL
 *   /out/shopify-pricing  → redirects to Shopify affiliate URL (variant tracking)
 *
 * The base partner key is extracted by matching the longest known partner
 * prefix. The remainder (e.g. "-pricing", "-cta", "-sidebar") is preserved
 * as a tracking variant in the utm_content parameter.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Find matching partner — try exact match first, then prefix match
  const { partnerKey, variant } = resolvePartner(slug);

  if (!partnerKey || !affiliatePartners[partnerKey]) {
    // Unknown partner — redirect to homepage
    return NextResponse.redirect(new URL('/', request.url), 302);
  }

  const partner = affiliatePartners[partnerKey];

  // Resolve variant-specific URL or fall back to base partner URL
  const baseUrl = resolveVariantUrl(partnerKey, variant, partner.url);
  const targetUrl = new URL(baseUrl);

  // Add tracking parameters
  targetUrl.searchParams.set('utm_source', 'lkwjd');
  targetUrl.searchParams.set('utm_medium', 'affiliate');
  if (variant) {
    targetUrl.searchParams.set('utm_content', variant);
  }

  // Set caching headers — short cache so clicks are tracked accurately
  const response = NextResponse.redirect(targetUrl.toString(), 302);
  response.headers.set('Cache-Control', 'private, max-age=0, no-cache');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');

  return response;
}

/**
 * Resolve a slug to a partner key and optional variant.
 *
 * Examples:
 *   "shopify"          → { partnerKey: "shopify", variant: null }
 *   "shopify-pricing"  → { partnerKey: "shopify", variant: "pricing" }
 *   "shopify-cta"      → { partnerKey: "shopify", variant: "cta" }
 *   "tap-payments"     → { partnerKey: "tap", variant: "payments" }  (if "tap" is a partner but "tap-payments" is not)
 */
/**
 * Variant-specific destination URLs per partner.
 * When a variant is known, the user lands on the relevant page
 * (e.g. pricing, themes, app store listing) instead of the homepage.
 */
const VARIANT_URLS: Record<string, Record<string, string>> = {
  shopify: {
    signup: 'https://www.shopify.com/free-trial',
    pricing: 'https://www.shopify.com/pricing',
    themes: 'https://themes.shopify.com',
    admin: 'https://admin.shopify.com',
    translate: 'https://apps.shopify.com/translate-and-adapt',
    tap: 'https://apps.shopify.com/tap',
    oto: 'https://apps.shopify.com/oto',
    marmin: 'https://apps.shopify.com/marmin-e-invoicing-ksa-test',
    sufio: 'https://apps.shopify.com/sufio',
    apps: 'https://apps.shopify.com',
  },
  wix: {
    signup: 'https://www.wix.com',
    pricing: 'https://www.wix.com/upgrade/website',
    templates: 'https://www.wix.com/website/templates',
  },
  hostinger: {
    signup: 'https://www.hostinger.com',
    pricing: 'https://www.hostinger.com/pricing',
  },
  foodics: {
    signup: 'https://www.foodics.com',
    pricing: 'https://www.foodics.com/pricing',
    demo: 'https://www.foodics.com/request-demo',
  },
  odoo: {
    signup: 'https://www.odoo.com',
    pricing: 'https://www.odoo.com/pricing',
  },
};

/**
 * Resolve the destination URL for a partner + variant combination.
 * Falls back to the base partner URL if no variant mapping exists.
 */
function resolveVariantUrl(partnerKey: string, variant: string | null, baseUrl: string): string {
  if (!variant) return baseUrl;
  const partnerVariants = VARIANT_URLS[partnerKey];
  if (partnerVariants && partnerVariants[variant]) {
    return partnerVariants[variant];
  }
  return baseUrl;
}

function resolvePartner(slug: string): { partnerKey: string | null; variant: string | null } {
  // Exact match
  if (affiliatePartners[slug]) {
    return { partnerKey: slug, variant: null };
  }

  // Find longest matching partner prefix
  const partnerKeys = Object.keys(affiliatePartners).sort((a, b) => b.length - a.length);
  for (const key of partnerKeys) {
    if (slug.startsWith(`${key}-`)) {
      const variant = slug.slice(key.length + 1);
      return { partnerKey: key, variant };
    }
  }

  return { partnerKey: null, variant: null };
}
