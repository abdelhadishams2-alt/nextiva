import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/sections/Navbar';
import { CallToAction } from '@/components/sections/CallToAction';
import { Footer } from '@/components/sections/Footer';
import BlogsGrid from '@/components/ui/BlogsGrid';

const articles = [
  {
    slug: 'odoo-saudi-arabia',
    image: '/assets/articles/odoo-saudi-arabia-1.webp',
    badge: 'Step-by-Step Guide',
    title: 'Odoo ZATCA Compliance 2026: The Complete Setup Guide for Saudi SMEs',
    excerpt: 'Complete guide to setting up Odoo for ZATCA Phase 2 e-invoicing — Community vs Enterprise, step-by-step configuration, penalties, and comparison with SAP and Zoho.',
    date: 'April 6, 2026',
    readTime: '22 min read',
    category: 'enterprise',
  },
  {
    slug: 'best-website-builders-saudi',
    image: '/assets/articles/best-website-builders-saudi-1.webp',
    badge: 'Best Of',
    title: '6 Best Website Builders in Saudi Arabia (2026)',
    excerpt: 'We tested Wix, Shopify, Salla, Zid, WordPress, and Squarespace for Saudi businesses. Honest comparison of pricing, Arabic support, ZATCA compliance, and features.',
    date: 'April 6, 2026',
    readTime: '20 min read',
    category: 'website-builders',
  },
  {
    slug: 'shopify-vs-salla',
    image: '/assets/articles/shopify-vs-salla-1.webp',
    badge: 'Comparison',
    title: 'Shopify vs Salla: Which Is Better for Saudi Sellers?',
    excerpt: 'Side-by-side comparison of Shopify and Salla covering pricing, features, Arabic support, ZATCA compliance, payment gateways, and shipping integration for Saudi e-commerce.',
    date: 'April 4, 2026',
    readTime: '16 min read',
    category: 'ecommerce',
  },
  {
    slug: 'how-to-build-shopify-store',
    image: '/assets/articles/how-to-build-shopify-store-2.webp',
    badge: 'Step-by-Step Guide',
    title: 'How to Build a Shopify Store in Saudi Arabia',
    excerpt: 'Complete 10-step guide to launching your Shopify store — from sign up to ZATCA compliance, Tap Payments, Arabic RTL support, and essential apps for Saudi sellers.',
    date: 'April 4, 2026',
    readTime: '18 min read',
    category: 'ecommerce',
  },
  {
    slug: 'foodics-review',
    image: '/assets/articles/foodics-review-1.webp',
    badge: 'Review',
    title: 'Foodics Review 2026: The All-in-One Restaurant POS Built for Saudi Arabia',
    excerpt: 'An honest breakdown of Foodics — the Saudi-born restaurant management platform. Covering POS, inventory, delivery integration, ZATCA compliance, pricing, and competitors.',
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

export async function generateMetadata() {
  const t = await getTranslations('Blogs');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function BlogsPage() {
  const t = await getTranslations('Blogs');

  return (
    <>
      <Navbar transparent />

      <main>
        {/* Hero */}
        <section className="blogs-hero">
          <div className="blogs-hero__bg">
            <img src="/assets/blogs-hero-bg.webp" alt="" loading="eager" />
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
