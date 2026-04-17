import "@/styles/article.css";
import "@/styles/affiliate.css";
import "@/styles/faq.css";
import "@/styles/article-best-website-builders-saudi.css";
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SITE_CONFIG } from '@/config/site';
import ReadingProgress from '@/components/ui/ReadingProgress';
import TOCSidebar from '@/components/ui/TOCSidebar';
import TOCInline from '@/components/ui/TOCInline';
import ShareButtons from '@/components/ui/ShareButtons';
import dynamic from 'next/dynamic';
const FadeUpObserver = dynamic(() => import('@/components/ui/FadeUpObserver'));
import { Navbar } from '@/components/sections/Navbar';
import { CallToAction } from '@/components/sections/CallToAction';
import { Footer } from '@/components/sections/Footer';
import AffiliateDisclosure from '@/components/ui/AffiliateDisclosure';
import AffiliateSidebar from '@/components/ui/AffiliateSidebar';
import AffiliateMobileBar from '@/components/ui/AffiliateMobileBar';
import AffiliateMidArticle from '@/components/ui/AffiliateMidArticle';
import { ArticleJsonLd } from '@/components/ui/ArticleJsonLd';
import { BreadcrumbJsonLd } from '@/components/ui/BreadcrumbJsonLd';
import { FaqJsonLd } from '@/components/ui/FaqJsonLd';

const tocItems = [
  { id: 'section-2', label: 'Introduction' },
  { id: 'section-3', label: 'Quick Comparison' },
  { id: 'section-4', label: 'Wix' },
  { id: 'section-5', label: 'Shopify' },
  { id: 'section-6', label: 'Salla' },
  { id: 'section-7', label: 'Zid' },
  { id: 'section-8', label: 'WordPress' },
  { id: 'section-9', label: 'Squarespace' },
  { id: 'section-10', label: 'Pricing' },
  { id: 'section-11', label: 'Verdict' },
  { id: 'section-12', label: 'FAQ' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'Why Choosing the Right Website Builder Matters in Saudi Arabia' },
  { id: 'section-3', label: 'Quick Comparison: All 6 Platforms at a Glance' },
  { id: 'section-4', label: 'Wix: Best All-Round Builder for Beginners' },
  { id: 'section-5', label: 'Shopify: Best for E-Commerce Stores' },
  { id: 'section-6', label: 'Salla: Best Arabic-Native E-Commerce Platform' },
  { id: 'section-7', label: 'Zid: Best for Saudi Omnichannel Sellers' },
  { id: 'section-8', label: 'WordPress: Best for Content-Heavy Sites' },
  { id: 'section-9', label: 'Squarespace: Best for Design-Focused Sites' },
  { id: 'section-10', label: 'Pricing Comparison: Side-by-Side' },
  { id: 'section-11', label: 'Our Verdict: Which Builder Should You Choose?' },
  { id: 'section-12', label: 'Frequently Asked Questions' },
];

export function generateStaticParams() {
  return [{ locale: 'en' }];
}

export async function generateMetadata() {
  const t = await getTranslations('Articles.bestWebsiteBuildersSaudi');
  const title = t('metaTitle');
  const description = t('metaDescription');
  return {
    title,
    description,
    keywords: 'best website builder Saudi Arabia, Wix Saudi Arabia, Shopify Saudi, Salla, Zid, WordPress Saudi, Squarespace Arabic, website builder 2026, Saudi business website',
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/best-website-builders`,
      siteName: SITE_CONFIG.name,
      images: [{ url: `${SITE_CONFIG.url}/assets/articles/best-website-builders-saudi-1.webp`, width: 1200, height: 630, alt: title }],
      type: 'article',
      publishedTime: '2026-04-06T00:00:00Z',
      authors: [SITE_CONFIG.author],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_CONFIG.url}/assets/articles/best-website-builders-saudi-1.webp`],
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/best-website-builders`,
    },
  };
}

export default async function BestWebsiteBuildersSaudiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Articles.bestWebsiteBuildersSaudi');

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section article-hero">
          <div className="article-hero__bg">
            <Image src="/assets/articles/best-website-builders-saudi-1.webp" alt={t('heroImageAlt')} fill priority style={{ objectFit: 'cover' }} />
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
              <AffiliateSidebar partner="wix" title="Wix Website Builder" buttonText="Try Wix Free" />
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

              {/* SECTION 2 -- Introduction */}
              <section id="section-2" className="fade-up article-section">
                <h2>{t('s2Title')}</h2>
                <p className="lead-paragraph">{t('s2Lead')}</p>
                <p>{t('s2P1')}</p>
                <p>{t('s2P2')}</p>
                <p>{t('s2P3')}</p>
              </section>

              {/* SECTION 3 -- Quick Comparison */}
              <section id="section-3" className="fade-up article-section">
                <h2>{t('s3Title')}</h2>
                <p>{t('s3Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/best-website-builders-saudi-2.webp" alt={t('s3ImageAlt')} width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>{t('s3ImageCaption')}</figcaption>
                </figure>
                <div className="data-table-wrap">
                  <table className="feature-matrix best-builders__comparison-table">
                    <thead>
                      <tr>
                        <th>{t('s3ColPlatform')}</th>
                        <th>{t('s3ColBestFor')}</th>
                        <th>{t('s3ColStartingPrice')}</th>
                        <th>{t('s3ColArabicSupport')}</th>
                        <th>{t('s3ColEcommerce')}</th>
                        <th>{t('s3ColRating')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['wix', 'shopify', 'salla', 'zid', 'wordpress', 'squarespace'] as const).map((key) => (
                        <tr key={key}>
                          <td><strong>{t(`s3Row_${key}_name`)}</strong></td>
                          <td>{t(`s3Row_${key}_bestFor`)}</td>
                          <td>{t(`s3Row_${key}_price`)}</td>
                          <td>{t(`s3Row_${key}_arabic`)}</td>
                          <td>{t(`s3Row_${key}_ecommerce`)}</td>
                          <td><span className="best-builders__score">{t(`s3Row_${key}_rating`)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* SECTION 4 -- Wix */}
              <section id="section-4" className="fade-up article-section">
                <h2>{t('s4Title')}</h2>
                <p>{t('s4Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/best-website-builders-saudi-3.webp" alt={t('s4ImageAlt')} width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>{t('s4ImageCaption')}</figcaption>
                </figure>
                <h3>{t('s4ProsTitle')}</h3>
                <ul>
                  {[1, 2, 3, 4].map((n) => (
                    <li key={n}>{t(`s4Pro${n}`)}</li>
                  ))}
                </ul>
                <h3>{t('s4ConsTitle')}</h3>
                <ul>
                  {[1, 2, 3].map((n) => (
                    <li key={n}>{t(`s4Con${n}`)}</li>
                  ))}
                </ul>
                <div className="expert-callout">
                  <p>{t('s4Callout')}</p>
                </div>
              </section>

              {/* SECTION 5 -- Shopify */}
              <section id="section-5" className="fade-up article-section">
                <h2>{t('s5Title')}</h2>
                <p>{t('s5Intro')}</p>
                <h3>{t('s5ProsTitle')}</h3>
                <ul>
                  {[1, 2, 3, 4].map((n) => (
                    <li key={n}>{t(`s5Pro${n}`)}</li>
                  ))}
                </ul>
                <h3>{t('s5ConsTitle')}</h3>
                <ul>
                  {[1, 2, 3].map((n) => (
                    <li key={n}>{t(`s5Con${n}`)}</li>
                  ))}
                </ul>
                <div className="expert-callout">
                  <p>{t('s5Callout')}</p>
                </div>
              </section>

              {/* Mid-Article CTA */}
              <AffiliateMidArticle
                partner="shopify"
                heading="Try Shopify for Your Saudi Store"
                description="3-day free trial, then $1/month for 3 months. Full e-commerce with payment gateways and shipping."
                buttonText="Start Free Trial"
              />

              {/* SECTION 6 -- Salla */}
              <section id="section-6" className="fade-up article-section">
                <h2>{t('s6Title')}</h2>
                <p>{t('s6Intro')}</p>
                <h3>{t('s6ProsTitle')}</h3>
                <ul>
                  {[1, 2, 3, 4].map((n) => (
                    <li key={n}>{t(`s6Pro${n}`)}</li>
                  ))}
                </ul>
                <h3>{t('s6ConsTitle')}</h3>
                <ul>
                  {[1, 2, 3].map((n) => (
                    <li key={n}>{t(`s6Con${n}`)}</li>
                  ))}
                </ul>
                <div className="expert-callout">
                  <p>{t('s6Callout')}</p>
                </div>
              </section>

              {/* SECTION 7 -- Zid */}
              <section id="section-7" className="fade-up article-section">
                <h2>{t('s7Title')}</h2>
                <p>{t('s7Intro')}</p>
                <h3>{t('s7ProsTitle')}</h3>
                <ul>
                  {[1, 2, 3, 4].map((n) => (
                    <li key={n}>{t(`s7Pro${n}`)}</li>
                  ))}
                </ul>
                <h3>{t('s7ConsTitle')}</h3>
                <ul>
                  {[1, 2, 3].map((n) => (
                    <li key={n}>{t(`s7Con${n}`)}</li>
                  ))}
                </ul>
                <div className="expert-callout">
                  <p>{t('s7Callout')}</p>
                </div>
              </section>

              {/* SECTION 8 -- WordPress */}
              <section id="section-8" className="fade-up article-section">
                <h2>{t('s8Title')}</h2>
                <p>{t('s8Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/best-website-builders-saudi-4.webp" alt={t('s8ImageAlt')} width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>{t('s8ImageCaption')}</figcaption>
                </figure>
                <h3>{t('s8ProsTitle')}</h3>
                <ul>
                  {[1, 2, 3, 4].map((n) => (
                    <li key={n}>{t(`s8Pro${n}`)}</li>
                  ))}
                </ul>
                <h3>{t('s8ConsTitle')}</h3>
                <ul>
                  {[1, 2, 3].map((n) => (
                    <li key={n}>{t(`s8Con${n}`)}</li>
                  ))}
                </ul>
                <div className="expert-callout">
                  <p>{t('s8Callout')}</p>
                </div>
              </section>

              {/* SECTION 9 -- Squarespace */}
              <section id="section-9" className="fade-up article-section">
                <h2>{t('s9Title')}</h2>
                <p>{t('s9Intro')}</p>
                <h3>{t('s9ProsTitle')}</h3>
                <ul>
                  {[1, 2, 3, 4].map((n) => (
                    <li key={n}>{t(`s9Pro${n}`)}</li>
                  ))}
                </ul>
                <h3>{t('s9ConsTitle')}</h3>
                <ul>
                  {[1, 2, 3].map((n) => (
                    <li key={n}>{t(`s9Con${n}`)}</li>
                  ))}
                </ul>
                <div className="expert-callout">
                  <p>{t('s9Callout')}</p>
                </div>
              </section>

              {/* SECTION 10 -- Pricing */}
              <section id="section-10" className="fade-up article-section">
                <h2>{t('s10Title')}</h2>
                <p>{t('s10Intro')}</p>
                <div className="data-table-wrap">
                  <table className="scorecard-table best-builders__pricing-table">
                    <thead>
                      <tr>
                        <th>{t('s10ColPlatform')}</th>
                        <th>{t('s10ColFree')}</th>
                        <th>{t('s10ColEntry')}</th>
                        <th>{t('s10ColMid')}</th>
                        <th>{t('s10ColAdvanced')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['wix', 'shopify', 'salla', 'zid', 'wordpress', 'squarespace'] as const).map((key) => (
                        <tr key={key}>
                          <td><strong>{t(`s10Row_${key}_name`)}</strong></td>
                          <td>{t(`s10Row_${key}_free`)}</td>
                          <td>{t(`s10Row_${key}_entry`)}</td>
                          <td>{t(`s10Row_${key}_mid`)}</td>
                          <td>{t(`s10Row_${key}_advanced`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>{t('s10P1')}</p>
                <div className="expert-callout">
                  <p>{t('s10Callout')}</p>
                </div>
              </section>

              {/* SECTION 11 -- Verdict */}
              <section id="section-11" className="fade-up article-section article-section--verdict">
                <span className="article-verdict__badge">{t('verdictBadge')}</span>
                <h2>{t('s11Title')}</h2>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/best-website-builders-saudi-5.webp" alt={t('s11ImageAlt')} width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>{t('s11ImageCaption')}</figcaption>
                </figure>
                <div className="best-builders__verdict-grid">
                  {(['wix', 'shopify', 'salla', 'zid', 'wordpress', 'squarespace'] as const).map((key) => (
                    <div key={key} className={`best-builders__verdict-card best-builders__verdict-card--${key}`}>
                      <h3>{t(`s11Verdict_${key}_title`)}</h3>
                      <p>{t(`s11Verdict_${key}_desc`)}</p>
                    </div>
                  ))}
                </div>
                <p>{t('s11P1')}</p>
                <p>{t('s11P2')}</p>
              </section>

              {/* Conclusion CTA */}
              <AffiliateMidArticle
                partner="wix"
                variant="conclusion"
                heading="Ready to Build Your Website?"
                description="Wix offers a free plan to get started. Salla and Zid have free tiers for Saudi sellers. Try them risk-free."
                buttonText="Start with Wix Free"
              />

              {/* SECTION 12 -- FAQ */}
              <section id="section-12" className="fade-up article-section">
                <h2>{t('s12Title')}</h2>
                <div className="shopify-guide__faq-list">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <details key={n} className="shopify-guide__faq-item">
                      <summary>
                        <span className="shopify-guide__faq-question">
                          <span className="shopify-guide__faq-number">{String(n).padStart(2, '0')}</span>
                          {t(`s12Q${n}`)}
                        </span>
                        <span className="shopify-guide__faq-chevron" />
                      </summary>
                      <p>{t(`s12A${n}`)}</p>
                    </details>
                  ))}
                </div>
              </section>

              <ShareButtons shareText={t('shareText')} />

            </div>
          </div>
        </div>
      </main>
      <CallToAction />
      <Footer />
      <AffiliateMobileBar partner="wix" buttonText="Try Wix Free" />
      <ArticleJsonLd
        title={t('metaTitle')}
        description={t('metaDescription')}
        url={`${SITE_CONFIG.url}/best-website-builders`}
        image={`${SITE_CONFIG.url}/assets/articles/best-website-builders-saudi-1.webp`}
        datePublished="2026-04-06"
        dateModified="2026-04-06"
      />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: '/' },
        { name: 'Reviews', url: '/blogs' },
        { name: t('metaTitle'), url: '/best-website-builders' },
      ]} />
      <FaqJsonLd items={[1, 2, 3, 4, 5].map((n) => ({
        question: t(`s12Q${n}`),
        answer: t(`s12A${n}`),
      }))} />
    </>
  );
}
