import "@/styles/article.css";
import "@/styles/article-shopify-vs-salla.css";
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
import { ArticleJsonLd } from '@/components/ui/ArticleJsonLd';
import { BreadcrumbJsonLd } from '@/components/ui/BreadcrumbJsonLd';
import { FaqJsonLd } from '@/components/ui/FaqJsonLd';

const tocItems = [
  { id: 'section-2', label: 'Introduction' },
  { id: 'section-3', label: 'Platform Overview' },
  { id: 'section-4', label: 'Ease of Use' },
  { id: 'section-5', label: 'Design & Themes' },
  { id: 'section-6', label: 'Payment & Shipping' },
  { id: 'section-7', label: 'Pricing' },
  { id: 'section-8', label: 'ZATCA & VAT' },
  { id: 'section-9', label: 'Pros & Cons' },
  { id: 'section-10', label: 'Verdict' },
  { id: 'section-11', label: 'FAQ' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'Why This Comparison Matters for Saudi Sellers' },
  { id: 'section-3', label: 'Platform Overview: Shopify vs Salla' },
  { id: 'section-4', label: 'Ease of Use: Setup, Dashboard & Arabic Support' },
  { id: 'section-5', label: 'Design & Themes: Template Quality and Customization' },
  { id: 'section-6', label: 'Payment & Shipping: Local Integration' },
  { id: 'section-7', label: 'Pricing Comparison: Side-by-Side Plans' },
  { id: 'section-8', label: 'ZATCA & VAT Compliance' },
  { id: 'section-9', label: 'Pros & Cons: Side-by-Side' },
  { id: 'section-10', label: 'Verdict: Which Platform Should You Choose?' },
  { id: 'section-11', label: 'Frequently Asked Questions' },
];

export function generateStaticParams() {
  return [{ locale: 'en' }];
}

export async function generateMetadata() {
  const t = await getTranslations('Articles.shopifyVsSalla');
  const title = t('metaTitle');
  const description = t('metaDescription');
  return {
    title,
    description,
    keywords: 'Shopify vs Salla, Salla vs Shopify, best ecommerce platform Saudi Arabia, Salla review, Shopify Saudi Arabia, ZATCA ecommerce, Saudi online store, Salla pricing, Shopify pricing Saudi',
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/shopify-vs-salla`,
      siteName: SITE_CONFIG.name,
      images: [{ url: `${SITE_CONFIG.url}/assets/articles/shopify-vs-salla-1.webp`, width: 1200, height: 630, alt: title }],
      type: 'article',
      publishedTime: '2026-04-04T00:00:00Z',
      authors: [SITE_CONFIG.author],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_CONFIG.url}/assets/articles/shopify-vs-salla-1.webp`],
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/shopify-vs-salla`,
    },
  };
}

export default async function ShopifyVsSallaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Articles.shopifyVsSalla');

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section article-hero">
          <div className="article-hero__bg">
            <Image src="/assets/articles/shopify-vs-salla-1.webp" alt={t('heroImageAlt')} fill priority style={{ objectFit: 'cover' }} />
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
                <h4>{t('keyTakeawaysLabel')}</h4>
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

              {/* SECTION 3 -- Platform Overview */}
              <section id="section-3" className="fade-up article-section">
                <h2>{t('s3Title')}</h2>
                <p>{t('s3Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/shopify-vs-salla-2.webp" alt={t('s3ImageAlt')} width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>{t('s3ImageCaption')}</figcaption>
                </figure>

                <h3>{t('s3ShopifyTitle')}</h3>
                <p>{t('s3ShopifyP1')}</p>
                <p>{t('s3ShopifyP2')}</p>

                <h3>{t('s3SallaTitle')}</h3>
                <p>{t('s3SallaP1')}</p>
                <p>{t('s3SallaP2')}</p>

                {/* Feature Matrix */}
                <div className="data-table-wrap">
                  <table className="feature-matrix shopify-vs-salla__feature-matrix">
                    <thead>
                      <tr>
                        <th>{t('s3ColFeature')}</th>
                        <th>{t('s3ColShopify')}</th>
                        <th>{t('s3ColSalla')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['arabicRtl', 'zatca', 'paymentGateways', 'appEcosystem', 'delivery', 'multiLang', 'supportArabic'] as const).map((key) => (
                        <tr key={key}>
                          <td>{t(`s3Row_${key}_label`)}</td>
                          <td>{t(`s3Row_${key}_shopify`)}</td>
                          <td>{t(`s3Row_${key}_salla`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* SECTION 4 -- Ease of Use */}
              <section id="section-4" className="fade-up article-section">
                <h2>{t('s4Title')}</h2>
                <p>{t('s4Intro')}</p>

                <h3>{t('s4ShopifyTitle')}</h3>
                <p>{t('s4ShopifyP1')}</p>
                <ul>
                  {[1, 2, 3].map((n) => (
                    <li key={n}>{t(`s4ShopifyFeature${n}`)}</li>
                  ))}
                </ul>

                <h3>{t('s4SallaTitle')}</h3>
                <p>{t('s4SallaP1')}</p>
                <ul>
                  {[1, 2, 3].map((n) => (
                    <li key={n}>{t(`s4SallaFeature${n}`)}</li>
                  ))}
                </ul>

                <div className="expert-callout">
                  <p>{t('s4Callout')}</p>
                </div>
              </section>

              {/* SECTION 5 -- Design & Themes */}
              <section id="section-5" className="fade-up article-section">
                <h2>{t('s5Title')}</h2>
                <p>{t('s5Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/shopify-vs-salla-3.webp" alt={t('s5ImageAlt')} width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>{t('s5ImageCaption')}</figcaption>
                </figure>

                <h3>{t('s5ShopifyTitle')}</h3>
                <p>{t('s5ShopifyP1')}</p>

                <h3>{t('s5SallaTitle')}</h3>
                <p>{t('s5SallaP1')}</p>

                <p>{t('s5P1')}</p>
              </section>

              {/* SECTION 6 -- Payment & Shipping */}
              <section id="section-6" className="fade-up article-section">
                <h2>{t('s6Title')}</h2>
                <p>{t('s6Intro')}</p>

                <h3>{t('s6PaymentTitle')}</h3>
                <div className="data-table-wrap">
                  <table className="scorecard-table">
                    <thead>
                      <tr>
                        <th>{t('s6ColGateway')}</th>
                        <th>{t('s6ColShopify')}</th>
                        <th>{t('s6ColSalla')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['tap', 'tabby', 'tamara', 'stcPay', 'applePay', 'cod'] as const).map((key) => (
                        <tr key={key}>
                          <td>{t(`s6Row_${key}_name`)}</td>
                          <td>{t(`s6Row_${key}_shopify`)}</td>
                          <td>{t(`s6Row_${key}_salla`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h3>{t('s6ShippingTitle')}</h3>
                <div className="data-table-wrap">
                  <table className="scorecard-table">
                    <thead>
                      <tr>
                        <th>{t('s6ColCarrier')}</th>
                        <th>{t('s6ColShopify')}</th>
                        <th>{t('s6ColSalla')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['aramex', 'smsa', 'dhl', 'jt', 'redbox'] as const).map((key) => (
                        <tr key={key}>
                          <td>{t(`s6Ship_${key}_name`)}</td>
                          <td>{t(`s6Ship_${key}_shopify`)}</td>
                          <td>{t(`s6Ship_${key}_salla`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>{t('s6P1')}</p>
              </section>

              {/* Mid-Article CTA */}
              <AffiliateMidArticle
                partner="shopify"
                heading="Try Shopify for Your Saudi Store"
                description="3-day free trial, then $1/month for 3 months. Set up payments, shipping, and Arabic support."
                buttonText="Start Free Trial"
              />

              {/* SECTION 7 -- Pricing Comparison */}
              <section id="section-7" className="fade-up article-section">
                <h2>{t('s7Title')}</h2>
                <p>{t('s7Intro')}</p>
                <div className="data-table-wrap">
                  <table className="scorecard-table shopify-vs-salla__pricing-table">
                    <thead>
                      <tr>
                        <th>{t('s7ColTier')}</th>
                        <th>{t('s7ColShopifyPlan')}</th>
                        <th>{t('s7ColShopifyPrice')}</th>
                        <th>{t('s7ColSallaPlan')}</th>
                        <th>{t('s7ColSallaPrice')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['entry', 'mid', 'advanced'] as const).map((key) => (
                        <tr key={key}>
                          <td><strong>{t(`s7Row_${key}_tier`)}</strong></td>
                          <td>{t(`s7Row_${key}_shopifyPlan`)}</td>
                          <td>{t(`s7Row_${key}_shopifyPrice`)}</td>
                          <td>{t(`s7Row_${key}_sallaPlan`)}</td>
                          <td>{t(`s7Row_${key}_sallaPrice`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>{t('s7P1')}</p>
                <p>{t('s7P2')}</p>
                <div className="expert-callout">
                  <p>{t('s7Callout')}</p>
                </div>
              </section>

              {/* SECTION 8 -- ZATCA & VAT */}
              <section id="section-8" className="fade-up article-section">
                <h2>{t('s8Title')}</h2>
                <p>{t('s8Intro')}</p>

                <h3>{t('s8ShopifyTitle')}</h3>
                <p>{t('s8ShopifyP1')}</p>
                <ul>
                  {[1, 2, 3].map((n) => (
                    <li key={n}>{t(`s8ShopifyFeature${n}`)}</li>
                  ))}
                </ul>

                <h3>{t('s8SallaTitle')}</h3>
                <p>{t('s8SallaP1')}</p>
                <ul>
                  {[1, 2, 3].map((n) => (
                    <li key={n}>{t(`s8SallaFeature${n}`)}</li>
                  ))}
                </ul>

                <div className="expert-callout">
                  <p>{t('s8Callout')}</p>
                </div>
              </section>

              {/* SECTION 9 -- Pros & Cons */}
              <section id="section-9" className="fade-up article-section">
                <h2>{t('s9Title')}</h2>

                <h3>{t('s9ShopifyHeading')}</h3>
                <div className="problem-solution-grid">
                  <div className="solution-col">
                    <h4><span>{'\u2705'}</span> {t('s9ShopifyProsTitle')}</h4>
                    <ul>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <li key={n}>{t(`s9ShopifyPro${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="problem-col">
                    <h4><span>{'\u274C'}</span> {t('s9ShopifyConsTitle')}</h4>
                    <ul>
                      {[1, 2, 3, 4].map((n) => (
                        <li key={n}>{t(`s9ShopifyCon${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <h3>{t('s9SallaHeading')}</h3>
                <div className="problem-solution-grid">
                  <div className="solution-col">
                    <h4><span>{'\u2705'}</span> {t('s9SallaProsTitle')}</h4>
                    <ul>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <li key={n}>{t(`s9SallaPro${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="problem-col">
                    <h4><span>{'\u274C'}</span> {t('s9SallaConsTitle')}</h4>
                    <ul>
                      {[1, 2, 3, 4].map((n) => (
                        <li key={n}>{t(`s9SallaCon${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p>{t('s9P1')}</p>
              </section>

              {/* SECTION 10 -- Verdict */}
              <section id="section-10" className="fade-up article-section">
                <h2>{t('s10Title')}</h2>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/shopify-vs-salla-4.webp" alt={t('s10ImageAlt')} width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>{t('s10ImageCaption')}</figcaption>
                </figure>

                <div className="shopify-vs-salla__verdict-grid">
                  <div className="shopify-vs-salla__verdict-card shopify-vs-salla__verdict-card--shopify">
                    <h3>{t('s10ShopifyVerdictTitle')}</h3>
                    <p>{t('s10ShopifyVerdictP1')}</p>
                    <ul>
                      {[1, 2, 3].map((n) => (
                        <li key={n}>{t(`s10ShopifyBestFor${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="shopify-vs-salla__verdict-card shopify-vs-salla__verdict-card--salla">
                    <h3>{t('s10SallaVerdictTitle')}</h3>
                    <p>{t('s10SallaVerdictP1')}</p>
                    <ul>
                      {[1, 2, 3].map((n) => (
                        <li key={n}>{t(`s10SallaBestFor${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <p>{t('s10P1')}</p>
                <p>{t('s10P2')}</p>
              </section>

              {/* Conclusion CTA */}
              <AffiliateMidArticle
                partner="shopify"
                variant="conclusion"
                heading="Ready to Launch Your Saudi Store?"
                description="Shopify offers a 3-day free trial. Salla has a free plan to get started. Try both and decide."
                buttonText="Start Free Shopify Trial"
              />

              {/* SECTION 11 -- FAQ */}
              <section id="section-11" className="fade-up article-section">
                <h2>{t('s11Title')}</h2>
                <div className="shopify-guide__faq-list">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <details key={n} className="shopify-guide__faq-item">
                      <summary>{t(`s11Q${n}`)}</summary>
                      <p>{t(`s11A${n}`)}</p>
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
      <AffiliateMobileBar partner="shopify" buttonText="Start Free Trial" />
      <ArticleJsonLd
        title={t('metaTitle')}
        description={t('metaDescription')}
        url={`${SITE_CONFIG.url}/shopify-vs-salla`}
        image={`${SITE_CONFIG.url}/assets/articles/shopify-vs-salla-1.webp`}
        datePublished="2026-04-04"
        dateModified="2026-04-04"
      />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: '/' },
        { name: 'Comparisons', url: '/blogs' },
        { name: t('metaTitle'), url: '/shopify-vs-salla' },
      ]} />
      <FaqJsonLd items={[1, 2, 3, 4, 5].map((n) => ({
        question: t(`s11Q${n}`),
        answer: t(`s11A${n}`),
      }))} />
    </>
  );
}
