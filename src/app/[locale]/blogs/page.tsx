import "@/styles/blogs.css";
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Navbar } from '@/components/sections/Navbar';
import { CallToAction } from '@/components/sections/CallToAction';
import { Footer } from '@/components/sections/Footer';
import BlogsGrid from '@/components/ui/BlogsGrid';
import { SITE_CONFIG } from '@/config/site';

const articles = [
  {
    slug: 'best-project-management-tools',
    image: '/assets/articles/best-pm-tools-1.webp',
    badge: 'Best Of',
    title: 'From Chaos to Control: Best PM Tools for Every Team Size (2026)',
    excerpt: 'We tested ClickUp, Monday.com, Asana, Notion, Jira, Trello, Wrike, and more. Organized by team size with real pricing, AI features, and honest pros/cons.',
    date: 'April 7, 2026',
    readTime: '18 min read',
    category: 'enterprise',
  },
  {
    slug: 'best-hr-software',
    image: '/assets/articles/best-hr-software-saudi-1.webp',
    badge: 'Best Of',
    title: 'Best HR Software (2026): GOSI, Mudad & Saudization Compliance',
    excerpt: 'We tested Jisr, ZenHR, Bayzat, Darwinbox, SAP SuccessFactors, and more for GOSI integration, Mudad compliance, and Saudization tracking.',
    date: 'April 6, 2026',
    readTime: '16 min read',
    category: 'enterprise',
  },
  {
    slug: 'best-crm-software',
    image: '/assets/articles/best-crm-saudi-1.webp',
    badge: 'Best Of',
    title: 'Best CRM Software (2026): Honest Comparison & Pricing',
    excerpt: 'We tested HubSpot, Zoho, Salesforce, Freshsales, Bitrix24, Dynamics 365, and Pipedrive. Arabic support, pricing, and what actually matters.',
    date: 'April 6, 2026',
    readTime: '17 min read',
    category: 'enterprise',
  },
  {
    slug: 'best-pos-systems',
    image: '/assets/articles/best-pos-systems-saudi-1.webp',
    badge: 'Best Of',
    title: 'Best POS Systems (2026): ZATCA Compliance, Pricing & What Matters',
    excerpt: 'We tested 9 POS systems — Foodics, Marn, Odoo, Loyverse, and more. Honest comparison of ZATCA Phase 2 compliance, mada integration, and real pricing.',
    date: 'April 6, 2026',
    readTime: '18 min read',
    category: 'restaurant',
  },
  {
    slug: 'odoo-zatca-compliance',
    image: '/assets/articles/odoo-saudi-arabia-1.webp',
    badge: 'Step-by-Step Guide',
    title: 'Odoo ZATCA Compliance 2026: The Complete Setup Guide',
    excerpt: 'Complete guide to setting up Odoo for ZATCA Phase 2 e-invoicing — Community vs Enterprise, step-by-step configuration, penalties, and comparison.',
    date: 'April 6, 2026',
    readTime: '22 min read',
    category: 'enterprise',
  },
  {
    slug: 'best-website-builders',
    image: '/assets/articles/best-website-builders-saudi-1.webp',
    badge: 'Best Of',
    title: '6 Best Website Builders (2026): Honest Comparison',
    excerpt: 'We tested Wix, Shopify, Salla, Zid, WordPress, and Squarespace. Honest comparison of pricing, Arabic support, ZATCA compliance, and features.',
    date: 'April 6, 2026',
    readTime: '20 min read',
    category: 'website-builders',
  },
  {
    slug: 'shopify-vs-salla',
    image: '/assets/articles/shopify-vs-salla-1.webp',
    badge: 'Comparison',
    title: 'Shopify vs Salla: Which Is Better for Sellers?',
    excerpt: 'Side-by-side comparison of Shopify and Salla covering pricing, features, Arabic support, ZATCA compliance, payment gateways, and shipping integration.',
    date: 'April 4, 2026',
    readTime: '16 min read',
    category: 'ecommerce',
  },
  {
    slug: 'how-to-build-shopify-store',
    image: '/assets/articles/how-to-build-shopify-store-2.webp',
    badge: 'Step-by-Step Guide',
    title: 'How to Build a Shopify Store: Complete 10-Step Guide',
    excerpt: 'Complete 10-step guide to launching your Shopify store — from sign up to ZATCA compliance, Tap Payments, Arabic RTL support, and essential apps.',
    date: 'April 4, 2026',
    readTime: '18 min read',
    category: 'ecommerce',
  },
  {
    slug: 'foodics-review',
    image: '/assets/articles/foodics-review-1.webp',
    badge: 'Review',
    title: 'Foodics Review 2026: The All-in-One Restaurant POS',
    excerpt: 'An honest breakdown of Foodics — the restaurant management platform. Covering POS, inventory, delivery integration, ZATCA compliance, pricing, and competitors.',
    date: 'April 3, 2026',
    readTime: '15 min read',
    category: 'restaurant',
  },
];

const filters = [
  { key: 'all', label: 'All Posts' },
  { key: 'website-builders', label: 'Website Builders' },
  { key: 'ecommerce', label: 'E-Commerce' },
  { key: 'enterprise', label: 'Enterprise Software' },
  { key: 'restaurant', label: 'Restaurant & Food' },
];

export function generateStaticParams() {
  return [{ locale: 'en' }];
}

export async function generateMetadata() {
  const t = await getTranslations('Blogs');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      url: `${SITE_CONFIG.url}/blogs`,
      siteName: SITE_CONFIG.name,
      type: 'website',
      images: [{ url: `${SITE_CONFIG.url}/assets/blogs-hero-bg.webp`, width: 1200, height: 630, alt: t('metaTitle') }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('metaTitle'),
      description: t('metaDescription'),
      images: [`${SITE_CONFIG.url}/assets/blogs-hero-bg.webp`],
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/blogs`,
    },
  };
}

export default async function BlogsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Blogs');

  return (
    <>
      <Navbar transparent />

      <main>
        {/* Hero */}
        <section className="blogs-hero">
          <div className="blogs-hero__bg">
            <Image src="/assets/blogs-hero-bg.webp" alt="" fill priority style={{ objectFit: 'cover' }} />
          </div>
          <div className="blogs-hero__overlay" />
          <div className="blogs-hero__content">
            <span className="blogs-hero__badge">{t('heroBadge')}</span>
            <h1 className="blogs-hero__title">{t('heroTitle')}</h1>
            <p className="blogs-hero__desc">{t('heroDesc')}</p>
          </div>
        </section>

        {/* Filters + Grid (client component) */}
        <BlogsGrid
          articles={articles}
          filters={filters}
          searchPlaceholder={t('searchPlaceholder')}
        />
      </main>

      <CallToAction />
      <Footer />
    </>
  );
}
