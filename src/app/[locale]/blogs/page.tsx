import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/sections/Navbar';
import { CallToAction } from '@/components/sections/CallToAction';
import { Footer } from '@/components/sections/Footer';
import BlogsGrid from '@/components/ui/BlogsGrid';

const articles = [
  {
    slug: 'tap-payment-gateway',
    image: '/assets/articles/article-tap-regulatory-moat-1.webp',
    badge: 'GCC Payment Regulation',
    title: 'The Regulatory Moat: How Tap Payments Locked Down All 6 GCC Licenses',
    excerpt: 'Tap Payments is the only fintech holding all six GCC payment licenses. Explore what each license unlocks, the competitive gap, and why it matters for MENA merchants.',
    date: 'March 2026',
    readTime: '12 min read',
    category: 'technology',
  },
  {
    slug: 'restaurant-inventory-management-system',
    image: '/assets/articles/article-restaurant-inventory-leak-1.webp',
    badge: 'Restaurant Operations',
    title: 'The $162 Billion Leak: How Restaurants Hemorrhage Money Through Invisible Losses',
    excerpt: 'US restaurants lose $162 billion annually to invisible inventory waste. Discover the five hidden loss categories and AI-powered solutions.',
    date: 'March 24, 2026',
    readTime: '14 min read',
    category: 'restaurant',
  },
  {
    slug: 'project-management-companies-in-saudi-arabia',
    image: '/assets/articles/article-saudi-pm-rivalry-1.webp',
    badge: 'Construction Consulting',
    title: 'Saudi-Born vs. Global Giants: The New Rivalry Reshaping Project Management',
    excerpt: 'How Saudi-born consultancies and international PM giants compete for $196B in contract awards across giga-project portfolios.',
    date: 'March 24, 2026',
    readTime: '12 min read',
    category: 'saudi',
  },
  {
    slug: 'online-inventory-management-system',
    image: '/assets/articles/article-inventory-moat-1.webp',
    badge: 'Supply Chain Intelligence',
    title: 'Real-Time Inventory as Competitive Moat: How Multi-Channel Sync Wins',
    excerpt: 'How real-time inventory synchronization across channels reduces stockouts, cuts logistics costs, and creates durable competitive advantage.',
    date: 'March 24, 2026',
    readTime: '10 min read',
    category: 'inventory',
  },
  {
    slug: 'odoo-saudi-arabia',
    image: '/assets/articles/article-odoo-zatca-1.webp',
    badge: 'Enterprise Software',
    title: 'ZATCA Wave 24 Countdown: Why Saudi SMEs Must Act on Odoo Before June 2026',
    excerpt: 'ZATCA Wave 24 hits June 2026 with SAR 375K threshold. Learn what Saudi SMEs need for Phase 2 e-invoicing compliance.',
    date: 'Updated March 2026',
    readTime: '14 min read',
    category: 'enterprise',
  },
  {
    slug: 'inventory-management-software',
    image: '/assets/articles/article-ai-inventory-hero.webp',
    badge: 'Inventory Technology',
    title: 'AI Inventory Forecasting in 2026: What Works vs. Marketing Hype',
    excerpt: 'A data-driven analysis separating proven AI forecasting capabilities from marketing hype, with verified ROI metrics.',
    date: 'March 24, 2026',
    readTime: '12 min read',
    category: 'inventory',
  },
  {
    slug: 'foodics-saudi-arabia',
    image: '/assets/articles/article-foodics-superplatform-1.webp',
    badge: 'Restaurant Technology',
    title: 'From POS to Payroll: The Making of a Restaurant Super-Platform',
    excerpt: 'How Foodics evolved from a Saudi POS startup into a super-platform spanning payments, lending, and AI across 35+ countries.',
    date: 'March 24, 2026',
    readTime: '12 min read',
    category: 'restaurant',
  },
  {
    slug: 'erp-software-saudi-arabia',
    image: '/assets/articles/article-erp-saudi-framework-1.webp',
    badge: 'Enterprise Technology',
    title: 'ERP Decision Framework for Saudi Businesses',
    excerpt: 'A structured ERP selection framework covering ZATCA compliance, vendor scorecards, and TCO analysis across 8 providers.',
    date: 'March 24, 2026',
    readTime: '13 min read',
    category: 'enterprise',
  },
  {
    slug: 'delivery-apps',
    image: '/assets/articles/article-super-app-race-1.webp',
    badge: 'Delivery & Logistics',
    title: 'The Super-App Race: How Delivery Platforms Are Swallowing Everything',
    excerpt: 'Delivery platforms are evolving into super-apps covering groceries, pharmacy, and finance in the $1.4 trillion market.',
    date: 'March 24, 2026',
    readTime: '12 min read',
    category: 'technology',
  },
  {
    slug: 'cloud-based-inventory-management',
    image: '/assets/articles/article-cloud-security-1.webp',
    badge: 'Cloud Security',
    title: 'Cloud Inventory Security: Why 99% of Breaches Are Your Fault',
    excerpt: '99% of cloud inventory breaches stem from misconfigurations, not vendor failures. Learn why your security posture is the real risk.',
    date: 'March 24, 2026',
    readTime: '11 min read',
    category: 'inventory',
  },
  {
    slug: 'classera-middle-east',
    image: '/assets/articles/article-classera-education-os-1.webp',
    badge: 'MENA EdTech',
    title: 'From LMS to Education OS: How Classera Is Building the Full Stack of Learning',
    excerpt: 'Classera has evolved from an Arabic-first LMS into a six-pillar education operating system across 40+ countries.',
    date: 'March 24, 2026',
    readTime: '12 min read',
    category: 'saudi',
  },
  {
    slug: 'article-shopify-saudi',
    image: '/assets/articles/article-shopify-saudi-1.webp',
    badge: 'Saudi Ecommerce',
    title: 'From Zero to First Sale: Building a Shopify Store for the Saudi Market',
    excerpt: 'A comprehensive guide to creating a Shopify store for the Saudi market: registration, payment gateways, shipping, and VAT.',
    date: 'March 24, 2026',
    readTime: '12 min read',
    category: 'saudi',
  },
  {
    slug: 'article-saudi-food-delivery',
    image: '/assets/articles/article-saudi-food-delivery-1.webp',
    badge: 'Food Delivery',
    title: 'The Great Fragmentation: Saudi Food Delivery Goes From Duopoly to Battleground',
    excerpt: 'Analysis of Saudi Arabia\'s $10 billion food delivery market as it fragments into an eight-front competitive war.',
    date: 'March 24, 2026',
    readTime: '13 min read',
    category: 'restaurant',
  },
  {
    slug: 'article-mpos-hidden-math',
    image: '/assets/articles/article-mpos-hidden-math-1.webp',
    badge: 'POS & Payments',
    title: 'The Hidden Math of Mobile POS: What That 2.6% Fee Really Costs Over 3 Years',
    excerpt: 'Compare the true 3-year TCO for Square, Clover, SumUp, Toast, and Shopify POS. Hardware, SaaS fees, and markups decoded.',
    date: 'Updated March 2026',
    readTime: '13 min read',
    category: 'technology',
  },
  {
    slug: 'article-inventory-framework',
    image: '/assets/articles/article-inventory-framework-1.webp',
    badge: 'Restaurant Operations',
    title: 'The Restaurant Inventory Intelligence Framework: From Counting to Commanding',
    excerpt: 'A four-pillar framework that transforms stock counting into profit control with a 30-day implementation roadmap.',
    date: 'Updated March 2026',
    readTime: '14 min read',
    category: 'restaurant',
  },
  {
    slug: 'article-ecommerce-tco',
    image: '/assets/articles/article-ecommerce-tco-1.webp',
    badge: 'Ecommerce Technology',
    title: 'The True Cost of Your Ecommerce Platform: A Revenue-Tiered TCO Analysis',
    excerpt: 'Compare the real total cost of ownership for Shopify, WooCommerce, BigCommerce, and Adobe Commerce across three revenue tiers.',
    date: 'March 24, 2026',
    readTime: '14 min read',
    category: 'technology',
  },
];

const filters = [
  { key: 'all', label: 'All Posts' },
  { key: 'technology', label: 'Technology' },
  { key: 'restaurant', label: 'Restaurant & Food' },
  { key: 'saudi', label: 'Saudi Arabia' },
  { key: 'inventory', label: 'Inventory & Supply Chain' },
  { key: 'enterprise', label: 'Enterprise' },
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
