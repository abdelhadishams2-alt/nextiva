/* ----------------------------------------------------------------
   Affiliate Links Registry
   Central config for all partner/affiliate URLs.
   Replace placeholder URLs with real affiliate links after signing
   up for each partner program.
   ---------------------------------------------------------------- */

export interface AffiliatePartner {
  name: string;
  url: string;
  commission: string;
  programUrl: string;
}

export const affiliatePartners: Record<string, AffiliatePartner> = {
  shopify: {
    name: 'Shopify',
    url: 'https://www.shopify.com?ref=lkwjd',
    commission: '$150 per paid signup',
    programUrl: 'https://partners.shopify.com',
  },
  hubspot: {
    name: 'HubSpot',
    url: 'https://www.hubspot.com?ref=lkwjd',
    commission: '30% recurring for 1 year',
    programUrl: 'https://www.hubspot.com/partners',
  },
  wix: {
    name: 'Wix',
    url: 'https://www.wix.com?ref=lkwjd',
    commission: '$100 per premium signup',
    programUrl: 'https://affiliate.wix.com',
  },
  hostinger: {
    name: 'Hostinger',
    url: 'https://www.hostinger.com?ref=lkwjd',
    commission: '60% of first purchase',
    programUrl: 'https://www.hostinger.com/affiliates',
  },
  odoo: {
    name: 'Odoo',
    url: 'https://www.odoo.com?ref=lkwjd',
    commission: 'Contact for terms',
    programUrl: 'https://www.odoo.com/partners',
  },
  foodics: {
    name: 'Foodics',
    url: 'https://www.foodics.com?ref=lkwjd',
    commission: 'Contact for terms',
    programUrl: 'https://www.foodics.com',
  },
  tap: {
    name: 'Tap Payments',
    url: 'https://www.tap.company?ref=lkwjd',
    commission: 'Contact for terms',
    programUrl: 'https://www.tap.company',
  },
  classera: {
    name: 'Classera',
    url: 'https://www.classera.com?ref=lkwjd',
    commission: 'Contact for terms',
    programUrl: 'https://www.classera.com',
  },
  woocommerce: {
    name: 'WooCommerce',
    url: 'https://woocommerce.com?ref=lkwjd',
    commission: 'Contact for terms',
    programUrl: 'https://woocommerce.com/affiliates',
  },
  square: {
    name: 'Square',
    url: 'https://squareup.com?ref=lkwjd',
    commission: 'Contact for terms',
    programUrl: 'https://squareup.com/affiliates',
  },
  clover: {
    name: 'Clover',
    url: 'https://www.clover.com?ref=lkwjd',
    commission: 'Contact for terms',
    programUrl: 'https://www.clover.com',
  },
  toast: {
    name: 'Toast',
    url: 'https://pos.toasttab.com?ref=lkwjd',
    commission: 'Contact for terms',
    programUrl: 'https://pos.toasttab.com/partners',
  },
  sumup: {
    name: 'SumUp',
    url: 'https://www.sumup.com?ref=lkwjd',
    commission: 'Contact for terms',
    programUrl: 'https://www.sumup.com',
  },
  clickup: {
    name: 'ClickUp',
    url: 'https://www.clickup.com?ref=lkwjd',
    commission: 'Contact for terms',
    programUrl: 'https://clickup.com/partners',
  },
  monday: {
    name: 'Monday.com',
    url: 'https://www.monday.com?ref=lkwjd',
    commission: 'Contact for terms',
    programUrl: 'https://monday.com/partners',
  },
  asana: {
    name: 'Asana',
    url: 'https://www.asana.com?ref=lkwjd',
    commission: 'Contact for terms',
    programUrl: 'https://asana.com/partners',
  },
  zoho: {
    name: 'Zoho Books',
    url: 'https://www.zoho.com/sa/books/?ref=lkwjd',
    commission: 'Contact for terms',
    programUrl: 'https://www.zoho.com/partners',
  },
  wafeq: {
    name: 'Wafeq',
    url: 'https://www.wafeq.com?ref=lkwjd',
    commission: 'Contact for terms',
    programUrl: 'https://www.wafeq.com',
  },
};

/**
 * Get an affiliate partner's URL by key.
 * Returns the affiliate URL if the partner exists, or the fallback URL.
 */
export function getAffiliateUrl(partnerKey: string, fallbackUrl?: string): string {
  const partner = affiliatePartners[partnerKey];
  return partner?.url ?? fallbackUrl ?? '#';
}
