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
  const targetUrl = new URL(partner.url);

  // Add tracking parameters
  targetUrl.searchParams.set('utm_source', 'mansati');
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
