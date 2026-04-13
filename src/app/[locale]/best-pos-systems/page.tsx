import "@/styles/article.css";
import "@/styles/affiliate.css";
import "@/styles/faq.css";
import "@/styles/article-best-pos-systems-saudi.css";
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
  { id: 'section-2', label: 'Why ZATCA Matters' },
  { id: 'section-3', label: 'Quick Comparison' },
  { id: 'section-4', label: 'ZATCA Phase 2' },
  { id: 'section-5', label: 'Foodics' },
  { id: 'section-6', label: 'Marn POS' },
  { id: 'section-7', label: 'Odoo POS' },
  { id: 'section-8', label: 'Loyverse' },
  { id: 'section-9', label: 'Others' },
  { id: 'section-10', label: 'How to Choose' },
  { id: 'section-11', label: 'Verdict' },
  { id: 'section-12', label: 'FAQ' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'Why ZATCA Compliance Is Non-Negotiable in 2025' },
  { id: 'section-3', label: 'Quick Comparison: All 9 POS Systems at a Glance' },
  { id: 'section-4', label: 'Understanding ZATCA Phase 2 Requirements' },
  { id: 'section-5', label: 'Foodics: Best POS for Saudi Restaurants' },
  { id: 'section-6', label: 'Marn POS: Best Saudi-Born All-Rounder' },
  { id: 'section-7', label: 'Odoo POS: Best for ERP-Connected Businesses' },
  { id: 'section-8', label: 'Loyverse: Best Free POS Option' },
  { id: 'section-9', label: 'POSRocket, iiko, Lightspeed, Square & Toast' },
  { id: 'section-10', label: 'How to Choose the Right POS for Your Business' },
  { id: 'section-11', label: 'Our Verdict: Which POS Should You Choose?' },
  { id: 'section-12', label: 'Frequently Asked Questions' },
];

export function generateStaticParams() {
  return [{ locale: 'en' }];
}

export async function generateMetadata() {
  const t = await getTranslations('Articles.bestPosSystemsSaudi');
  const title = t('metaTitle');
  const description = t('metaDescription');
  return {
    title,
    description,
    keywords: 'best POS system Saudi Arabia, POS Saudi Arabia, ZATCA compliant POS, Foodics POS, Marn POS, point of sale Saudi, restaurant POS KSA, retail POS Saudi, mada payment POS, e-invoicing Saudi Arabia',
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/best-pos-systems`,
      siteName: SITE_CONFIG.name,
      images: [{ url: `${SITE_CONFIG.url}/assets/articles/best-pos-systems-saudi-1.webp`, width: 1200, height: 630, alt: title }],
      type: 'article',
      publishedTime: '2026-04-06T00:00:00Z',
      authors: [SITE_CONFIG.author],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_CONFIG.url}/assets/articles/best-pos-systems-saudi-1.webp`],
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/best-pos-systems`,
    },
  };
}

export default async function BestPosSystemsSaudiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Articles.bestPosSystemsSaudi');

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section article-hero">
          <div className="article-hero__bg">
            <Image src="/assets/articles/best-pos-systems-saudi-1.webp" alt={t('heroImageAlt')} fill priority style={{ objectFit: 'cover' }} />
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
              <AffiliateSidebar partner="foodics" title="Foodics POS" buttonText="Try Foodics" />
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

              {/* SECTION 2 -- Why ZATCA Compliance Matters */}
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
                <div className="data-table-wrap">
                  <table className="feature-matrix pos-saudi__comparison-table">
                    <thead>
                      <tr>
                        <th>{t('s3ColPlatform')}</th>
                        <th>{t('s3ColBestFor')}</th>
                        <th>{t('s3ColStartingPrice')}</th>
                        <th>{t('s3ColZatca')}</th>
                        <th>{t('s3ColArabic')}</th>
                        <th>{t('s3ColRating')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['foodics', 'marn', 'odoo', 'loyverse', 'posrocket', 'iiko', 'lightspeed', 'square', 'toast'] as const).map((key) => (
                        <tr key={key}>
                          <td><strong>{t(`s3Row_${key}_name`)}</strong></td>
                          <td>{t(`s3Row_${key}_bestFor`)}</td>
                          <td>{t(`s3Row_${key}_price`)}</td>
                          <td>{t(`s3Row_${key}_zatca`)}</td>
                          <td>{t(`s3Row_${key}_arabic`)}</td>
                          <td><span className="pos-saudi__score">{t(`s3Row_${key}_rating`)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* SECTION 4 -- ZATCA Phase 2 Requirements */}
              <section id="section-4" className="fade-up article-section">
                <h2>{t('s4Title')}</h2>
                <p className="lead-paragraph">{t('s4Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/best-pos-systems-saudi-2.webp" alt={t('s4ImageAlt')} width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>{t('s4ImageCaption')}</figcaption>
                </figure>
                <p>{t('s4P1')}</p>
                <p>{t('s4P2')}</p>
                <div className="expert-callout">
                  <p>{t('s4Callout')}</p>
                </div>
              </section>

              <AffiliateMidArticle partner="foodics" heading="Foodics POS" description="The #1 restaurant POS in Saudi Arabia" buttonText="Try Foodics Free" />

              {/* SECTION 5 -- Foodics */}
              <section id="section-5" className="fade-up article-section">
                <h2>{t('s5Title')}</h2>
                <p className="lead-paragraph">{t('s5Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/best-pos-systems-saudi-3.webp" alt={t('s5ImageAlt')} width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>{t('s5ImageCaption')}</figcaption>
                </figure>
                <p>{t('s5P1')}</p>
                <p>{t('s5P2')}</p>
                <h3>{t('s5PricingIntro')}</h3>
                <div className="mini-cards-grid">
                  {(['Starter', 'Basic', 'Advance'] as const).map((tier) => (
                    <div key={tier} className="mini-card">
                      <span className="mini-card-badge">{tier}</span>
                      <h3>{t(`s5Pricing${tier}`)}</h3>
                    </div>
                  ))}
                </div>
                <div className="problem-solution-grid">
                  <div className="solution-col">
                    <h3>{t('s5ProsTitle')}</h3>
                    <ul>
                      {[1, 2, 3, 4].map((n) => (
                        <li key={n}>{t(`s5Pro${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="problem-col">
                    <h3>{t('s5ConsTitle')}</h3>
                    <ul>
                      {[1, 2].map((n) => (
                        <li key={n}>{t(`s5Con${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* SECTION 6 -- Marn POS */}
              <section id="section-6" className="fade-up article-section">
                <h2>{t('s6Title')}</h2>
                <p className="lead-paragraph">{t('s6Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/best-pos-systems-saudi-4.webp" alt="Retail store owner using a tablet-based POS system in Saudi Arabia" width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>Marn POS is designed specifically for the Saudi retail and service market</figcaption>
                </figure>
                <p>{t('s6P1')}</p>
                <p>{t('s6P2')}</p>
                <div className="problem-solution-grid">
                  <div className="solution-col">
                    <h3>{t('s6ProsTitle')}</h3>
                    <ul>
                      {[1, 2, 3, 4].map((n) => (
                        <li key={n}>{t(`s6Pro${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="problem-col">
                    <h3>{t('s6ConsTitle')}</h3>
                    <ul>
                      {[1, 2].map((n) => (
                        <li key={n}>{t(`s6Con${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* SECTION 7 -- Odoo POS */}
              <section id="section-7" className="fade-up article-section">
                <h2>{t('s7Title')}</h2>
                <p className="lead-paragraph">{t('s7Intro')}</p>
                <p>{t('s7P1')}</p>
                <p>{t('s7P2')}</p>
                <div className="problem-solution-grid">
                  <div className="solution-col">
                    <h3>{t('s7ProsTitle')}</h3>
                    <ul>
                      {[1, 2, 3, 4].map((n) => (
                        <li key={n}>{t(`s7Pro${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="problem-col">
                    <h3>{t('s7ConsTitle')}</h3>
                    <ul>
                      {[1, 2].map((n) => (
                        <li key={n}>{t(`s7Con${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* SECTION 8 -- Loyverse */}
              <section id="section-8" className="fade-up article-section">
                <h2>{t('s8Title')}</h2>
                <p className="lead-paragraph">{t('s8Intro')}</p>
                <p>{t('s8P1')}</p>
                <p>{t('s8P2')}</p>
                <div className="problem-solution-grid">
                  <div className="solution-col">
                    <h3>{t('s8ProsTitle')}</h3>
                    <ul>
                      {[1, 2, 3].map((n) => (
                        <li key={n}>{t(`s8Pro${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="problem-col">
                    <h3>{t('s8ConsTitle')}</h3>
                    <ul>
                      {[1, 2].map((n) => (
                        <li key={n}>{t(`s8Con${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              <AffiliateMidArticle partner="foodics" heading="Foodics POS" description="Trusted by 50,000+ restaurants in the Middle East" buttonText="Get Started with Foodics" variant="conclusion" />

              {/* SECTION 9 -- Others */}
              <section id="section-9" className="fade-up article-section">
                <h2>{t('s9Title')}</h2>
                <p>{t('s9Intro')}</p>
                <div className="pos-saudi__others-grid">
                  {(['posrocket', 'iiko', 'lightspeed', 'square', 'toast'] as const).map((key) => (
                    <div key={key} className="pos-saudi__other-card">
                      <h3>{t(`s9_${key}_name`)}</h3>
                      <p className="pos-saudi__other-price">{t(`s9_${key}_price`)}</p>
                      <p>{t(`s9_${key}_summary`)}</p>
                      <p className="pos-saudi__other-verdict"><strong>{t(`s9_${key}_verdict`)}</strong></p>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 10 -- How to Choose */}
              <section id="section-10" className="fade-up article-section">
                <h2>{t('s10Title')}</h2>
                <p className="lead-paragraph">{t('s10Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/best-pos-systems-saudi-5.webp" alt={t('s10ImageAlt')} width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>{t('s10ImageCaption')}</figcaption>
                </figure>
                <div className="mini-cards-grid mini-cards-grid--2col">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="mini-card">
                      <h3>{t(`s10Factor${n}Title`)}</h3>
                      <p>{t(`s10Factor${n}Desc`)}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 11 -- Verdict */}
              <section id="section-11" className="fade-up article-section">
                <h2>{t('s11Title')}</h2>
                <p className="lead-paragraph">{t('s11Intro')}</p>
                <div className="pos-saudi__verdict-grid">
                  {(['Restaurant', 'Retail', 'Budget', 'Enterprise'] as const).map((cat) => (
                    <div key={cat} className="pos-saudi__verdict-card">
                      <span className="pos-saudi__verdict-label">Best for {cat}</span>
                      <p>{t(`s11Verdict${cat}`)}</p>
                    </div>
                  ))}
                </div>
                <h3>{t('s11ScoreLabel')}</h3>
                <div className="pos-saudi__scores">
                  {(['foodics', 'marn', 'odoo', 'loyverse'] as const).map((key) => (
                    <div key={key} className="pos-saudi__score-row">
                      <span className="pos-saudi__score-name">{t(`s3Row_${key}_name`)}</span>
                      <div className="pos-saudi__score-bar">
                        <div className="pos-saudi__score-fill" style={{ width: `${(parseFloat(t(`s11_${key}_score`)) / 5) * 100}%` }} />
                      </div>
                      <span className="pos-saudi__score-value">{t(`s11_${key}_score`)}{t('s11ScoreMax')}</span>
                    </div>
                  ))}
                </div>
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

              <ShareButtons shareText="Best POS Systems in Saudi Arabia: ZATCA Compliance, Pricing & What Actually Matters" />
            </div>
          </div>
        </div>

        <CallToAction />
      </main>

      <Footer />
      <AffiliateMobileBar partner="foodics" buttonText="Try Foodics" />
      <ArticleJsonLd
        title={t('metaTitle')}
        description={t('metaDescription')}
        url={`${SITE_CONFIG.url}/best-pos-systems`}
        image={`${SITE_CONFIG.url}/assets/articles/best-pos-systems-saudi-1.webp`}
        datePublished="2026-04-06"
        dateModified="2026-04-06"
      />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: '/' },
        { name: 'Reviews', url: '/blogs' },
        { name: t('metaTitle'), url: '/best-pos-systems' },
      ]} />
      <FaqJsonLd items={[1, 2, 3, 4, 5].map((n) => ({
        question: t(`s12Q${n}`),
        answer: t(`s12A${n}`),
      }))} />
    </>
  );
}
