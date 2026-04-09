import "@/styles/article.css";
import "@/styles/article-how-to-build-shopify-store.css";
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SITE_CONFIG } from '@/config/site';
import ReadingProgress from '@/components/ui/ReadingProgress';
import TOCSidebar from '@/components/ui/TOCSidebar';
import TOCInline from '@/components/ui/TOCInline';
import ShareButtons from '@/components/ui/ShareButtons';
import FadeUpObserver from '@/components/ui/FadeUpObserver';
import { Navbar } from '@/components/sections/Navbar';
import { CallToAction } from '@/components/sections/CallToAction';
import { Footer } from '@/components/sections/Footer';
import AffiliateDisclosure from '@/components/ui/AffiliateDisclosure';
import AffiliateSidebar from '@/components/ui/AffiliateSidebar';
import AffiliateMobileBar from '@/components/ui/AffiliateMobileBar';
import AffiliateMidArticle from '@/components/ui/AffiliateMidArticle';
import PricingCards from '@/components/ui/PricingCards';
import { ArticleJsonLd } from '@/components/ui/ArticleJsonLd';
import { BreadcrumbJsonLd } from '@/components/ui/BreadcrumbJsonLd';
import { FaqJsonLd } from '@/components/ui/FaqJsonLd';

const tocItems = [
  { id: 'section-2', label: 'Why Shopify' },
  { id: 'section-3', label: 'Sign Up' },
  { id: 'section-4', label: 'Dashboard' },
  { id: 'section-5', label: 'Themes' },
  { id: 'section-6', label: 'Products' },
  { id: 'section-7', label: 'Payments' },
  { id: 'section-8', label: 'Shipping' },
  { id: 'section-9', label: 'VAT / ZATCA' },
  { id: 'section-10', label: 'Domain' },
  { id: 'section-11', label: 'Essential Apps' },
  { id: 'section-12', label: 'Launch Checklist' },
  { id: 'section-13', label: 'Pricing' },
  { id: 'section-14', label: 'FAQ' },
  { id: 'section-15', label: 'Final Tips' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'Why Shopify for E-Commerce in Saudi Arabia?' },
  { id: 'section-3', label: 'Step 1 — Sign Up for Shopify' },
  { id: 'section-4', label: 'Step 2 — Understand the Shopify Dashboard' },
  { id: 'section-5', label: 'Step 3 — Choose & Customize Your Theme' },
  { id: 'section-6', label: 'Step 4 — Add Your Products' },
  { id: 'section-7', label: 'Step 5 — Set Up Payment Gateway' },
  { id: 'section-8', label: 'Step 6 — Configure Shipping Zones & Rates' },
  { id: 'section-9', label: 'Step 7 — Set Up 15% VAT (ZATCA Compliance)' },
  { id: 'section-10', label: 'Step 8 — Connect a Custom Domain' },
  { id: 'section-11', label: 'Step 9 — Install Essential Apps' },
  { id: 'section-12', label: 'Step 10 — Launch Checklist' },
  { id: 'section-13', label: 'Shopify Pricing Plans (2026)' },
  { id: 'section-14', label: 'Frequently Asked Questions' },
  { id: 'section-15', label: 'Final Tips for Saudi Sellers' },
];

export function generateStaticParams() {
  return [{ locale: 'en' }];
}

export async function generateMetadata() {
  const t = await getTranslations('Articles.howToBuildShopifyStore');
  const title = t('metaTitle');
  const description = t('metaDescription');
  return {
    title,
    description,
    keywords: 'how to build Shopify store Saudi Arabia, Shopify Saudi guide, Shopify ZATCA, Shopify Tap Payments, Shopify Arabic RTL, Shopify pricing 2026, e-commerce Saudi Arabia',
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/how-to-build-shopify-store`,
      siteName: SITE_CONFIG.name,
      images: [{ url: `${SITE_CONFIG.url}/assets/articles/how-to-build-shopify-store-2.webp`, width: 1200, height: 630, alt: title }],
      type: 'article',
      publishedTime: '2026-04-04T00:00:00Z',
      authors: [SITE_CONFIG.author],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_CONFIG.url}/assets/articles/how-to-build-shopify-store-2.webp`],
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/how-to-build-shopify-store`,
    },
  };
}

export default async function HowToBuildShopifyStorePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Articles.howToBuildShopifyStore');

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section article-hero">
          <div className="article-hero__bg">
            <Image src="/assets/articles/how-to-build-shopify-store-2.webp" alt={t('heroImageAlt')} fill priority style={{ objectFit: 'cover' }} />
          </div>
          <div className="article-hero__overlay" />
          <div className="article-hero__content">
            <span className="article-hero__badge">{t('heroBadge')}</span>
            <h1>{t('heroTitle')}</h1>
            <div className="article-hero__meta">
              <span>
                <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                {t('heroAuthor')}
              </span>
              <span>
                <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                {t('heroDate')}
              </span>
              <span className="reading-time">
                <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                {t('heroReadTime')}
              </span>
            </div>
          </div>
        </section>

        <div className="container-article">
          <div className="article-layout">
            <TOCSidebar items={tocItems}>
              <AffiliateSidebar partner="shopify" title="Shopify E-Commerce" buttonText="Start Free Trial" />
            </TOCSidebar>
            <div className="article-main">
              <TOCInline items={tocItemsFull} />

              {/* Author Box */}
              <div className="author-box">
                <div className="author-avatar">{t('authorInitials')}</div>
                <div className="author-info">
                  <span className="author-name">{t('authorName')}</span>
                  <span className="author-meta">{t('authorMeta')}</span>
                </div>
              </div>

              {/* Affiliate Disclosure */}
              <AffiliateDisclosure />

              {/* Key Takeaways */}
              <div className="key-takeaways">
                <h3>{t('keyTakeawaysLabel')}</h3>
                <ul>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <li key={n}>{t(`keyTakeaway${n}`)}</li>
                  ))}
                </ul>
              </div>

              {/* SECTION 2 -- Why Shopify */}
              <section id="section-2" className="fade-up article-section">
                <h2>{t('s2Title')}</h2>
                <p className="lead-paragraph">{t('s2Intro')}</p>
                <p>{t('s2P1')}</p>
                <p>{t('s2P2')}</p>
              </section>

              {/* SECTION 3 -- Sign Up */}
              <section id="section-3" className="fade-up article-section">
                <h2>
                  <span className="shopify-guide__step-number">1</span>
                  {t('s3Title')}
                </h2>
                <p>{t('s3Intro')}</p>
                <ol className="shopify-guide__steps">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <li key={n}>{/* Note: t.raw() is used here for trusted, developer-controlled i18n content containing internal links -- not user-generated input */}<span dangerouslySetInnerHTML={{ __html: t.raw(`s3Step${n}`) }} /></li>
                  ))}
                </ol>
                <div className="shopify-guide__tip">
                  <p>{t('s3Tip')}</p>
                </div>
              </section>

              {/* SECTION 4 -- Dashboard */}
              <section id="section-4" className="fade-up article-section">
                <h2>
                  <span className="shopify-guide__step-number">2</span>
                  {t('s4Title')}
                </h2>
                <p>{t('s4Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/how-to-build-shopify-store-2.webp" alt="Shopify admin dashboard overview" width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                </figure>
                <ol className="shopify-guide__steps">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <li key={n}>{/* Note: t.raw() is used here for trusted, developer-controlled i18n content containing internal links -- not user-generated input */}<span dangerouslySetInnerHTML={{ __html: t.raw(`s4Step${n}`) }} /></li>
                  ))}
                </ol>
                <div className="shopify-guide__tip">
                  <p>{t('s4Tip')}</p>
                </div>
              </section>

              {/* SECTION 5 -- Themes */}
              <section id="section-5" className="fade-up article-section">
                <h2>
                  <span className="shopify-guide__step-number">3</span>
                  {t('s5Title')}
                </h2>
                <p>{t('s5Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/how-to-build-shopify-store-4.webp" alt="Shopify theme store and Dawn theme customizer" width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                </figure>
                <ol className="shopify-guide__steps">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <li key={n}>{/* Note: t.raw() is used here for trusted, developer-controlled i18n content containing internal links -- not user-generated input */}<span dangerouslySetInnerHTML={{ __html: t.raw(`s5Step${n}`) }} /></li>
                  ))}
                </ol>
                <div className="shopify-guide__tip">
                  <p>{t('s5Tip')}</p>
                </div>
              </section>

              {/* SECTION 6 -- Products */}
              <section id="section-6" className="fade-up article-section">
                <h2>
                  <span className="shopify-guide__step-number">4</span>
                  {t('s6Title')}
                </h2>
                <p>{t('s6Intro')}</p>
                <ol className="shopify-guide__steps">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <li key={n}>{/* Note: t.raw() is used here for trusted, developer-controlled i18n content containing internal links -- not user-generated input */}<span dangerouslySetInnerHTML={{ __html: t.raw(`s6Step${n}`) }} /></li>
                  ))}
                </ol>
                <div className="shopify-guide__tip">
                  <p>{t('s6Tip')}</p>
                </div>
              </section>

              {/* SECTION 7 -- Payments */}
              <section id="section-7" className="fade-up article-section">
                <h2>
                  <span className="shopify-guide__step-number">5</span>
                  {t('s7Title')}
                </h2>
                <p>{t('s7Intro')}</p>
                <ol className="shopify-guide__steps">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <li key={n}>{/* Note: t.raw() is used here for trusted, developer-controlled i18n content containing internal links -- not user-generated input */}<span dangerouslySetInnerHTML={{ __html: t.raw(`s7Step${n}`) }} /></li>
                  ))}
                </ol>
                <div className="shopify-guide__tip">
                  {/* Note: t.raw() is used here for trusted, developer-controlled i18n content containing internal links -- not user-generated input */}<p dangerouslySetInnerHTML={{ __html: t.raw('s7Tip') }} />
                </div>
              </section>

              {/* SECTION 8 -- Shipping */}
              <section id="section-8" className="fade-up article-section">
                <h2>
                  <span className="shopify-guide__step-number">6</span>
                  {t('s8Title')}
                </h2>
                <p>{t('s8Intro')}</p>
                <ol className="shopify-guide__steps">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <li key={n}>{/* Note: t.raw() is used here for trusted, developer-controlled i18n content containing internal links -- not user-generated input */}<span dangerouslySetInnerHTML={{ __html: t.raw(`s8Step${n}`) }} /></li>
                  ))}
                </ol>
                <div className="shopify-guide__tip">
                  <p>{t('s8Tip')}</p>
                </div>
              </section>

              {/* Mid-Article CTA */}
              <AffiliateMidArticle
                partner="shopify"
                heading="Ready to Start Your Shopify Store?"
                description="3-day free trial, then just $1/month for 3 months. No credit card required."
                buttonText="Start Free Trial"
              />

              {/* SECTION 9 -- VAT / ZATCA */}
              <section id="section-9" className="fade-up article-section">
                <h2>
                  <span className="shopify-guide__step-number">7</span>
                  {t('s9Title')}
                </h2>
                <p>{t('s9Intro')}</p>
                <ol className="shopify-guide__steps">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <li key={n}>{/* Note: t.raw() is used here for trusted, developer-controlled i18n content containing internal links -- not user-generated input */}<span dangerouslySetInnerHTML={{ __html: t.raw(`s9Step${n}`) }} /></li>
                  ))}
                </ol>
                <div className="shopify-guide__tip">
                  <p>{t('s9Tip')}</p>
                </div>
              </section>

              {/* SECTION 10 -- Domain */}
              <section id="section-10" className="fade-up article-section">
                <h2>
                  <span className="shopify-guide__step-number">8</span>
                  {t('s10Title')}
                </h2>
                <p>{t('s10Intro')}</p>
                <ol className="shopify-guide__steps">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <li key={n}>{/* Note: t.raw() is used here for trusted, developer-controlled i18n content containing internal links -- not user-generated input */}<span dangerouslySetInnerHTML={{ __html: t.raw(`s10Step${n}`) }} /></li>
                  ))}
                </ol>
                <div className="shopify-guide__tip">
                  <p>{t('s10Tip')}</p>
                </div>
              </section>

              {/* SECTION 11 -- Essential Apps */}
              <section id="section-11" className="fade-up article-section">
                <h2>
                  <span className="shopify-guide__step-number">9</span>
                  {t('s11Title')}
                </h2>
                <p>{t('s11Intro')}</p>
                <ol className="shopify-guide__steps">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <li key={n}>{/* Note: t.raw() is used here for trusted, developer-controlled i18n content containing internal links -- not user-generated input */}<span dangerouslySetInnerHTML={{ __html: t.raw(`s11Step${n}`) }} /></li>
                  ))}
                </ol>
                <div className="shopify-guide__tip">
                  <p>{t('s11Tip')}</p>
                </div>
              </section>

              {/* SECTION 12 -- Launch Checklist */}
              <section id="section-12" className="fade-up article-section">
                <h2>
                  <span className="shopify-guide__step-number">10</span>
                  {t('s12Title')}
                </h2>
                <p>{t('s12Intro')}</p>
                <ol className="shopify-guide__steps shopify-guide__steps--checklist">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <li key={n}>{/* Note: t.raw() is used here for trusted, developer-controlled i18n content containing internal links -- not user-generated input */}<span dangerouslySetInnerHTML={{ __html: t.raw(`s12Step${n}`) }} /></li>
                  ))}
                </ol>
                <div className="shopify-guide__tip">
                  <p>{t('s12Tip')}</p>
                </div>
              </section>

              {/* SECTION 13 -- Pricing */}
              <section id="section-13" className="fade-up article-section">
                <h2>{t('s13Title')}</h2>
                {/* Note: t.raw() is used here for trusted, developer-controlled i18n content containing internal links -- not user-generated input */}
                <p dangerouslySetInnerHTML={{ __html: t.raw('s13Intro') }} />
                <p>{t('s13P1')}</p>
                <PricingCards
                  heading={t('s13PricingHeading')}
                  description={t('s13PricingDesc')}
                  badge={t('s13PricingBadge')}
                  monthlyLabel={t('s13MonthlyLabel')}
                  yearlyLabel={t('s13YearlyLabel')}
                  saveLabel={t('s13SaveLabel')}
                  plans={[
                    {
                      name: t('s13Plan1Name'),
                      monthlyPrice: '$27',
                      yearlyPrice: '$19',
                      description: t('s13Plan1Desc'),
                      isPopular: true,
                      features: [
                        t('s13Plan1F1'),
                        t('s13Plan1F2'),
                        t('s13Plan1F3'),
                        t('s13Plan1F4'),
                        t('s13Plan1F5'),
                      ],
                      ctaText: t('s13PlanCta'),
                      ctaUrl: '/out/shopify-pricing',
                    },
                    {
                      name: t('s13Plan2Name'),
                      monthlyPrice: '$72',
                      yearlyPrice: '$54',
                      description: t('s13Plan2Desc'),
                      features: [
                        t('s13Plan2F1'),
                        t('s13Plan2F2'),
                        t('s13Plan2F3'),
                        t('s13Plan2F4'),
                        t('s13Plan2F5'),
                        t('s13Plan2F6'),
                      ],
                      ctaText: t('s13PlanCta'),
                      ctaUrl: '/out/shopify-pricing',
                    },
                    {
                      name: t('s13Plan3Name'),
                      monthlyPrice: '$399',
                      yearlyPrice: '$299',

                      description: t('s13Plan3Desc'),
                      features: [
                        t('s13Plan3F1'),
                        t('s13Plan3F2'),
                        t('s13Plan3F3'),
                        t('s13Plan3F4'),
                        t('s13Plan3F5'),
                        t('s13Plan3F6'),
                        t('s13Plan3F7'),
                      ],
                      ctaText: t('s13PlanCta'),
                      ctaUrl: '/out/shopify-pricing',
                    },
                  ]}
                />
                <p>{t('s13PricingNote')}</p>
              </section>

              {/* SECTION 14 -- FAQ */}
              <section id="section-14" className="fade-up article-section">
                <h2>Frequently Asked Questions</h2>
                <div className="shopify-guide__faq-list">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <details key={n} className="shopify-guide__faq-item">
                      <summary>{t(`faq${n}Q`)}</summary>
                      {/* Note: t.raw() is used here for trusted, developer-controlled i18n content containing internal links -- not user-generated input */}
                      <p dangerouslySetInnerHTML={{ __html: t.raw(`faq${n}A`) }} />
                    </details>
                  ))}
                </div>
              </section>

              {/* Bottom CTA */}
              <AffiliateMidArticle
                partner="shopify"
                variant="conclusion"
                heading="Start Building Your Shopify Store Today"
                description="Join 4.8 million merchants worldwide. 3-day free trial, $1/month for 3 months."
                buttonText="Start Free Trial"
              />

              {/* SECTION 15 -- Final Tips */}
              <section id="section-15" className="fade-up article-section">
                <h2>{t('s15Title')}</h2>
                <p>{t('s15P1')}</p>
                <p>{t('s15P2')}</p>
                <p>{t('s15P3')}</p>
              </section>

              <ShareButtons shareText={t('shareText')} />

            </div>
          </div>
        </div>
      </main>
      <CallToAction />
      <Footer />
      <AffiliateMobileBar partner="shopify" buttonText="Start Free Trial" />
      <ArticleJsonLd
        title={t('metaTitle')}
        description={t('metaDescription')}
        url={`${SITE_CONFIG.url}/how-to-build-shopify-store`}
        image={`${SITE_CONFIG.url}/assets/articles/how-to-build-shopify-store-2.webp`}
        datePublished="2026-04-04"
        dateModified="2026-04-04"
      />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: '/' },
        { name: 'Guides', url: '/blogs' },
        { name: t('metaTitle'), url: '/how-to-build-shopify-store' },
      ]} />
      <FaqJsonLd items={[1, 2, 3, 4, 5, 6].map((n) => ({
        question: t(`faq${n}Q`),
        answer: t(`faq${n}A`),
      }))} />
    </>
  );
}
