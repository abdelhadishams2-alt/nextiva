import "@/styles/article.css";
import "@/styles/affiliate.css";
import "@/styles/faq.css";
import "@/styles/article-foodics-review.css";
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
  { id: 'section-2', label: 'Overview' },
  { id: 'section-3', label: 'Key Features' },
  { id: 'section-4', label: 'POS & Cashier' },
  { id: 'section-5', label: 'Inventory' },
  { id: 'section-6', label: 'Delivery Integration' },
  { id: 'section-7', label: 'ZATCA Compliance' },
  { id: 'section-8', label: 'Pricing Plans' },
  { id: 'section-9', label: 'Pros & Cons' },
  { id: 'section-10', label: 'Who Is It For' },
  { id: 'section-11', label: 'Competitors' },
  { id: 'section-12', label: 'FAQ' },
  { id: 'section-13', label: 'Verdict' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'Foodics Overview: From Riyadh Startup to 35+ Countries' },
  { id: 'section-3', label: 'Key Features at a Glance' },
  { id: 'section-4', label: 'POS & Cashier App: iPad-First Experience' },
  { id: 'section-5', label: 'Inventory Management: Real-Time Stock Control' },
  { id: 'section-6', label: 'Delivery Integration: HungerStation, Jahez & More' },
  { id: 'section-7', label: 'ZATCA Phase 2 Compliance: E-Invoicing Built In' },
  { id: 'section-8', label: 'Pricing Plans: What It Actually Costs' },
  { id: 'section-9', label: 'Pros and Cons: The Honest Breakdown' },
  { id: 'section-10', label: 'Who Should Use Foodics?' },
  { id: 'section-11', label: 'Foodics vs Square vs POSRocket vs iiko' },
  { id: 'section-12', label: 'Frequently Asked Questions' },
  { id: 'section-13', label: 'Final Verdict: 4.5 out of 5' },
];

export function generateStaticParams() {
  return [{ locale: 'en' }];
}

export async function generateMetadata() {
  const t = await getTranslations('Articles.foodicsReview');
  const title = t('metaTitle');
  const description = t('metaDescription');
  return {
    title,
    description,
    keywords: 'Foodics review, Foodics POS, restaurant POS Saudi Arabia, Foodics pricing, ZATCA POS system, Foodics inventory, best restaurant POS MENA, Foodics 2026',
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/foodics-review`,
      siteName: SITE_CONFIG.name,
      images: [{ url: `${SITE_CONFIG.url}/assets/articles/foodics-review-1.webp`, width: 1200, height: 630, alt: title }],
      type: 'article',
      publishedTime: '2026-04-03T00:00:00Z',
      authors: [SITE_CONFIG.author],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_CONFIG.url}/assets/articles/foodics-review-1.webp`],
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/foodics-review`,
    },
  };
}

export default async function FoodicsReviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Articles.foodicsReview');

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section article-hero">
          <div className="article-hero__bg">
            <Image src="/assets/articles/foodics-review-1.webp" alt={t('heroImageAlt')} fill priority style={{ objectFit: 'cover' }} />
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
              <AffiliateSidebar partner="foodics" title="Foodics Restaurant POS" buttonText="Try Foodics Free" />
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

              {/* SECTION 2 -- Foodics Overview */}
              <section id="section-2" className="fade-up article-section">
                <h2>{t('s2Title')}</h2>
                <p className="lead-paragraph">{t('s2Lead')}</p>
                <p>{t('s2P1')}</p>
                <p>{t('s2P2')}</p>
                <p>{t('s2P3')}</p>
                <div className="mini-cards-grid">
                  {(['founded', 'establishments', 'funding', 'countries'] as const).map((key) => (
                    <div key={key} className="mini-card">
                      <h3>{t(`s2Card_${key}_value`)}</h3>
                      <p>{t(`s2Card_${key}_label`)}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 3 -- Key Features */}
              <section id="section-3" className="fade-up article-section">
                <h2>{t('s3Title')}</h2>
                <p>{t('s3Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/foodics-review-screenshot-1.webp" alt={t('s3ImageAlt')} width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>{t('s3ImageCaption')}</figcaption>
                </figure>
                <div className="mini-cards-grid">
                  {(['pos', 'inventory', 'kds', 'crm', 'delivery', 'hr'] as const).map((key) => (
                    <div key={key} className="mini-card">
                      <span className="mini-card-badge">{t(`s3Feature_${key}_icon`)}</span>
                      <h3>{t(`s3Feature_${key}_title`)}</h3>
                      <p>{t(`s3Feature_${key}_desc`)}</p>
                    </div>
                  ))}
                </div>
                <p>{t('s3P1')}</p>
              </section>

              {/* SECTION 4 -- POS & Cashier App */}
              <section id="section-4" className="fade-up article-section">
                <h2>{t('s4Title')}</h2>
                <p>{t('s4Intro')}</p>
                {/* Note: t.raw() is used here for trusted, developer-controlled i18n content containing internal links -- not user-generated input */}
                <p dangerouslySetInnerHTML={{ __html: t.raw('s4P1') }} />
                <ul>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <li key={n}>{t(`s4Feature${n}`)}</li>
                  ))}
                </ul>
                <p>{t('s4P2')}</p>
                <div className="expert-callout">
                  <p>{t('s4Callout')}</p>
                </div>
              </section>

              {/* SECTION 5 -- Inventory Management */}
              <section id="section-5" className="fade-up article-section">
                <h2>{t('s5Title')}</h2>
                <p>{t('s5Intro')}</p>
                <ul>
                  {[1, 2, 3, 4].map((n) => (
                    <li key={n}>{t(`s5Feature${n}`)}</li>
                  ))}
                </ul>
                {/* Note: t.raw() is used here for trusted, developer-controlled i18n content containing internal links -- not user-generated input */}
                <p dangerouslySetInnerHTML={{ __html: t.raw('s5P1') }} />
                <p>{t('s5P2')}</p>
              </section>

              {/* SECTION 6 -- Delivery Integration */}
              <section id="section-6" className="fade-up article-section">
                <h2>{t('s6Title')}</h2>
                <p>{t('s6Intro')}</p>
                {/* Note: t.raw() is used here for trusted, developer-controlled i18n content containing internal links -- not user-generated input */}
                <p dangerouslySetInnerHTML={{ __html: t.raw('s6P1') }} />
                <div className="data-table-wrap">
                  <table className="scorecard-table">
                    <thead>
                      <tr>
                        <th>{t('s6ColPlatform')}</th>
                        <th>{t('s6ColIntegration')}</th>
                        <th>{t('s6ColMenuSync')}</th>
                        <th>{t('s6ColStockDepletion')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['hungerstation', 'jahez', 'marsool', 'talabat'] as const).map((key) => (
                        <tr key={key}>
                          <td>{t(`s6Row_${key}_name`)}</td>
                          <td>{t(`s6Row_${key}_integration`)}</td>
                          <td>{t(`s6Row_${key}_sync`)}</td>
                          <td>{t(`s6Row_${key}_depletion`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Note: t.raw() is used here for trusted, developer-controlled i18n content containing internal links -- not user-generated input */}
                <p dangerouslySetInnerHTML={{ __html: t.raw('s6P2') }} />
                <p>{t('s6P3')}</p>
              </section>

              {/* SECTION 7 -- ZATCA Compliance */}
              <section id="section-7" className="fade-up article-section">
                <h2>{t('s7Title')}</h2>
                <p>{t('s7Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/foodics-review-screenshot-3.webp" alt={t('s7ImageAlt')} width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>{t('s7ImageCaption')}</figcaption>
                </figure>
                <ul>
                  {[1, 2, 3, 4].map((n) => (
                    <li key={n}>{t(`s7Feature${n}`)}</li>
                  ))}
                </ul>
                {/* Note: t.raw() is used here for trusted, developer-controlled i18n content containing internal links -- not user-generated input */}
                <p dangerouslySetInnerHTML={{ __html: t.raw('s7P1') }} />
                <div className="expert-callout">
                  <p>{t('s7Callout')}</p>
                </div>
              </section>

              {/* Mid-Article CTA (1 of 1 — middle of article) */}
              <AffiliateMidArticle
                partner="foodics"
                heading="Try Foodics for Your Restaurant"
                description="See why 30,000+ restaurants across the Middle East trust Foodics."
                buttonText="Request a Free Demo"
              />

              {/* SECTION 8 -- Pricing Plans */}
              <section id="section-8" className="fade-up article-section">
                <h2>{t('s8Title')}</h2>
                <p>{t('s8Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/foodics-review-screenshot-2.webp" alt={t('s8ImageAlt')} width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>{t('s8ImageCaption')}</figcaption>
                </figure>
                <div className="data-table-wrap">
                  <table className="scorecard-table foodics-review__pricing-table">
                    <thead>
                      <tr>
                        <th>{t('s8ColPlan')}</th>
                        <th>{t('s8ColMonthly')}</th>
                        <th>{t('s8ColBestFor')}</th>
                        <th>{t('s8ColKeyFeatures')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['starter', 'basic', 'advanced'] as const).map((key) => (
                        <tr key={key}>
                          <td><strong>{t(`s8Row_${key}_plan`)}</strong></td>
                          <td>{t(`s8Row_${key}_price`)}</td>
                          <td>{t(`s8Row_${key}_bestFor`)}</td>
                          {/* Note: t.raw() is used here for trusted, developer-controlled i18n content -- not user-generated input */}
                          <td dangerouslySetInnerHTML={{ __html: t.raw(`s8Row_${key}_features`) }} />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>{t('s8P1')}</p>
                {/* Note: t.raw() is used here for trusted, developer-controlled i18n content containing internal links -- not user-generated input */}
                <p dangerouslySetInnerHTML={{ __html: t.raw('s8P2') }} />
              </section>

              {/* SECTION 9 -- Pros and Cons */}
              <section id="section-9" className="fade-up article-section">
                <h2>{t('s9Title')}</h2>
                <div className="problem-solution-grid">
                  <div className="solution-col">
                    <h3><span>{'\u2705'}</span> {t('s9ProsTitle')}</h3>
                    <ul>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <li key={n}>{t(`s9Pro${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="problem-col">
                    <h3><span>{'\u274C'}</span> {t('s9ConsTitle')}</h3>
                    <ul>
                      {[1, 2, 3].map((n) => (
                        <li key={n}>{t(`s9Con${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p>{t('s9P1')}</p>
              </section>

              {/* SECTION 10 -- Who Is It For */}
              <section id="section-10" className="fade-up article-section">
                <h2>{t('s10Title')}</h2>
                <p>{t('s10Intro')}</p>
                <div className="mini-cards-grid">
                  {(['franchise', 'delivery', 'datadriven', 'zatca'] as const).map((key) => (
                    <div key={key} className="mini-card">
                      <h3>{t(`s10Card_${key}_title`)}</h3>
                      <p>{t(`s10Card_${key}_desc`)}</p>
                    </div>
                  ))}
                </div>
                <p>{t('s10P1')}</p>
              </section>

              {/* SECTION 11 -- Competitor Comparison */}
              <section id="section-11" className="fade-up article-section">
                <h2>{t('s11Title')}</h2>
                {/* Note: t.raw() is used here for trusted, developer-controlled i18n content containing internal links -- not user-generated input */}
                <p dangerouslySetInnerHTML={{ __html: t.raw('s11Intro') }} />
                <div className="data-table-wrap">
                  <table className="feature-matrix foodics-review__comparison-table">
                    <thead>
                      <tr>
                        <th>{t('s11ColFeature')}</th>
                        <th className="highlight-col">{t('s11ColFoodics')}</th>
                        <th>{t('s11ColSquare')}</th>
                        <th>{t('s11ColPosrocket')}</th>
                        <th>{t('s11ColIiko')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['zatca', 'delivery', 'offline', 'hardware', 'pricing', 'arabic', 'multiLocation', 'embedded'] as const).map((key) => (
                        <tr key={key}>
                          <td>{t(`s11Row_${key}_label`)}</td>
                          <td className="highlight-col">{t(`s11Row_${key}_foodics`)}</td>
                          <td>{t(`s11Row_${key}_square`)}</td>
                          <td>{t(`s11Row_${key}_posrocket`)}</td>
                          <td>{t(`s11Row_${key}_iiko`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Note: t.raw() is used here for trusted, developer-controlled i18n content containing internal links -- not user-generated input */}
                <p dangerouslySetInnerHTML={{ __html: t.raw('s11P1') }} />
                <p>{t('s11P2')}</p>
              </section>

              {/* SECTION 12 -- FAQ */}
              <section id="section-12" className="fade-up article-section">
                <h2>{t('s12Title')}</h2>
                <div className="shopify-guide__faq-list">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <details key={n} className="shopify-guide__faq-item">
                      <summary>{t(`s12Q${n}`)}</summary>
                      <p>{t(`s12A${n}`)}</p>
                    </details>
                  ))}
                </div>
              </section>

              {/* SECTION 13 -- Verdict */}
              <section id="section-13" className="fade-up article-section">
                <h2>{t('s13Title')}</h2>
                <div className="foodics-review__verdict-card">
                  <div className="foodics-review__verdict-score">
                    <span className="foodics-review__verdict-number">{t('s13Score')}</span>
                    <span className="foodics-review__verdict-max">{t('s13ScoreMax')}</span>
                  </div>
                  <div className="foodics-review__verdict-breakdown">
                    {(['features', 'ease', 'value', 'support', 'compliance'] as const).map((key) => (
                      <div key={key} className="foodics-review__verdict-row">
                        <span className="foodics-review__verdict-label">{t(`s13Cat_${key}_label`)}</span>
                        <div className="foodics-review__verdict-bar-track">
                          <div className="foodics-review__verdict-bar-fill" style={{ width: t(`s13Cat_${key}_width`) }} />
                        </div>
                        <span className="foodics-review__verdict-bar-value">{t(`s13Cat_${key}_score`)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p>{t('s13P1')}</p>
                <p>{t('s13P2')}</p>
                <p>{t('s13P3')}</p>
              </section>

              {/* Conclusion CTA */}
              <AffiliateMidArticle
                partner="foodics"
                variant="conclusion"
                heading="Our Pick for Saudi Restaurants"
                description="Foodics scores 4.5/5 -- the most complete restaurant platform for the MENA region."
                buttonText="Try Foodics Free"
              />

              <ShareButtons shareText={t('shareText')} />

            </div>
          </div>
        </div>
      </main>
      <CallToAction />
      <Footer />
      <AffiliateMobileBar partner="foodics" buttonText="Try Foodics Free" />
      <ArticleJsonLd
        title={t('metaTitle')}
        description={t('metaDescription')}
        url={`${SITE_CONFIG.url}/foodics-review`}
        image={`${SITE_CONFIG.url}/assets/articles/foodics-review-1.webp`}
        datePublished="2026-04-03"
        dateModified="2026-04-03"
      />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: '/' },
        { name: 'Reviews', url: '/blogs' },
        { name: t('metaTitle'), url: '/foodics-review' },
      ]} />
      <FaqJsonLd items={[1, 2, 3, 4, 5].map((n) => ({
        question: t(`s12Q${n}`),
        answer: t(`s12A${n}`),
      }))} />
    </>
  );
}
