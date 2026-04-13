import "@/styles/article.css";
import "@/styles/affiliate.css";
import "@/styles/faq.css";
import "@/styles/article-best-hr-software-saudi.css";
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
  { id: 'section-2', label: 'Why HR Software' },
  { id: 'section-3', label: 'Quick Comparison' },
  { id: 'section-4', label: 'Jisr' },
  { id: 'section-5', label: 'ZenHR' },
  { id: 'section-6', label: 'Bayzat' },
  { id: 'section-7', label: 'Darwinbox' },
  { id: 'section-8', label: 'Others' },
  { id: 'section-9', label: 'Saudi Compliance' },
  { id: 'section-10', label: 'How to Choose' },
  { id: 'section-11', label: 'Verdict' },
  { id: 'section-12', label: 'FAQ' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'Why Every Saudi Business Needs HR Software in 2026' },
  { id: 'section-3', label: 'Quick Comparison: All 7 HR Platforms at a Glance' },
  { id: 'section-4', label: 'Jisr: Best HR Software for Saudi SMEs' },
  { id: 'section-5', label: 'ZenHR: Best Value MENA-Focused HR Platform' },
  { id: 'section-6', label: 'Bayzat: Best All-in-One HR + Insurance Platform' },
  { id: 'section-7', label: 'Darwinbox: Best Enterprise HR for Fast-Growing Companies' },
  { id: 'section-8', label: 'SAP SuccessFactors, BambooHR & MudadHR' },
  { id: 'section-9', label: 'Saudi Compliance: GOSI, Mudad, Nitaqat & Qiwa Explained' },
  { id: 'section-10', label: 'How to Choose the Right HR Software' },
  { id: 'section-11', label: 'Our Verdict: Which HR Software Should You Choose?' },
  { id: 'section-12', label: 'Frequently Asked Questions' },
];

export function generateStaticParams() {
  return [{ locale: 'en' }];
}

export async function generateMetadata() {
  const t = await getTranslations('Articles.bestHrSoftwareSaudi');
  const title = t('metaTitle');
  const description = t('metaDescription');
  return {
    title,
    description,
    keywords: 'best HR software Saudi Arabia, HR system KSA, Jisr HR, ZenHR Saudi, Bayzat KSA, GOSI integration, Mudad compliance, Saudization tracking, Nitaqat HR, payroll software Saudi Arabia',
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/best-hr-software`,
      siteName: SITE_CONFIG.name,
      images: [{ url: `${SITE_CONFIG.url}/assets/articles/best-hr-software-saudi-1.webp`, width: 1200, height: 630, alt: title }],
      type: 'article',
      publishedTime: '2026-04-06T00:00:00Z',
      authors: [SITE_CONFIG.author],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_CONFIG.url}/assets/articles/best-hr-software-saudi-1.webp`],
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/best-hr-software`,
    },
  };
}

export default async function BestHrSoftwareSaudiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Articles.bestHrSoftwareSaudi');

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section article-hero">
          <div className="article-hero__bg">
            <Image src="/assets/articles/best-hr-software-saudi-1.webp" alt={t('heroImageAlt')} fill priority style={{ objectFit: 'cover' }} />
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
              <AffiliateSidebar partner="jisr" title="Jisr HR" buttonText="Try Jisr" />
            </TOCSidebar>
            <div className="article-main">
              <TOCInline items={tocItemsFull} />

              <div className="author-box">
                <div className="author-avatar">{t('authorInitials')}</div>
                <div className="author-info">
                  <span className="author-name">{t('authorName')}</span>
                  <span className="author-meta">{t('authorMeta')}</span>
                </div>
              </div>

              <AffiliateDisclosure />

              <div className="key-takeaways">
                <h3>{t('keyTakeawaysLabel')}</h3>
                <ul>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <li key={n}>{t(`keyTakeaway${n}`)}</li>
                  ))}
                </ul>
              </div>

              {/* SECTION 2 */}
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
                  <table className="feature-matrix hr-saudi__comparison-table">
                    <thead>
                      <tr>
                        <th>{t('s3ColPlatform')}</th>
                        <th>{t('s3ColBestFor')}</th>
                        <th>{t('s3ColStartingPrice')}</th>
                        <th>{t('s3ColGosi')}</th>
                        <th>{t('s3ColArabic')}</th>
                        <th>{t('s3ColRating')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['jisr', 'zenhr', 'bayzat', 'darwinbox', 'sap', 'bamboohr', 'mudadhr'] as const).map((key) => (
                        <tr key={key}>
                          <td><strong>{t(`s3Row_${key}_name`)}</strong></td>
                          <td>{t(`s3Row_${key}_bestFor`)}</td>
                          <td>{t(`s3Row_${key}_price`)}</td>
                          <td>{t(`s3Row_${key}_gosi`)}</td>
                          <td>{t(`s3Row_${key}_arabic`)}</td>
                          <td><span className="hr-saudi__score">{t(`s3Row_${key}_rating`)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* SECTION 4 -- Jisr */}
              <section id="section-4" className="fade-up article-section">
                <h2>{t('s4Title')}</h2>
                <p className="lead-paragraph">{t('s4Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/best-hr-software-saudi-3.webp" alt="Saudi employees using HR mobile self-service app" width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>Jisr provides a mobile-first experience for employee self-service</figcaption>
                </figure>
                <p>{t('s4P1')}</p>
                <p>{t('s4P2')}</p>
                <div className="problem-solution-grid">
                  <div className="solution-col">
                    <h3>{t('s4ProsTitle')}</h3>
                    <ul>
                      {[1, 2, 3, 4].map((n) => (
                        <li key={n}>{t(`s4Pro${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="problem-col">
                    <h3>{t('s4ConsTitle')}</h3>
                    <ul>
                      {[1, 2].map((n) => (
                        <li key={n}>{t(`s4Con${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* SECTION 5 -- ZenHR */}
              <section id="section-5" className="fade-up article-section">
                <h2>{t('s5Title')}</h2>
                <p className="lead-paragraph">{t('s5Intro')}</p>
                <p>{t('s5P1')}</p>
                <p>{t('s5P2')}</p>
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

              <AffiliateMidArticle partner="jisr" heading="Jisr HR" description="The #1 HR platform built for Saudi businesses" buttonText="Try Jisr Free" />

              {/* SECTION 6 -- Bayzat */}
              <section id="section-6" className="fade-up article-section">
                <h2>{t('s6Title')}</h2>
                <p className="lead-paragraph">{t('s6Intro')}</p>
                <p>{t('s6P1')}</p>
                <p>{t('s6P2')}</p>
                <div className="problem-solution-grid">
                  <div className="solution-col">
                    <h3>{t('s6ProsTitle')}</h3>
                    <ul>
                      {[1, 2, 3].map((n) => (
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

              {/* SECTION 7 -- Darwinbox */}
              <section id="section-7" className="fade-up article-section">
                <h2>{t('s7Title')}</h2>
                <p className="lead-paragraph">{t('s7Intro')}</p>
                <p>{t('s7P1')}</p>
                <p>{t('s7P2')}</p>
                <div className="problem-solution-grid">
                  <div className="solution-col">
                    <h3>{t('s7ProsTitle')}</h3>
                    <ul>
                      {[1, 2, 3].map((n) => (
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

              {/* SECTION 8 -- Others */}
              <section id="section-8" className="fade-up article-section">
                <h2>{t('s8Title')}</h2>
                <p>{t('s8Intro')}</p>
                <div className="hr-saudi__others-grid">
                  {(['sap', 'bamboohr', 'mudadhr'] as const).map((key) => (
                    <div key={key} className="hr-saudi__other-card">
                      <h3>{t(`s8_${key}_name`)}</h3>
                      <p className="hr-saudi__other-price">{t(`s8_${key}_price`)}</p>
                      <p>{t(`s8_${key}_summary`)}</p>
                      <p className="hr-saudi__other-verdict"><strong>{t(`s8_${key}_verdict`)}</strong></p>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 9 -- Saudi Compliance */}
              <section id="section-9" className="fade-up article-section">
                <h2>{t('s9Title')}</h2>
                <p className="lead-paragraph">{t('s9Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/best-hr-software-saudi-2.webp" alt="Saudi HR compliance workflow showing GOSI, Mudad, Nitaqat, and Qiwa" width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>Saudi HR compliance requires integration with multiple government platforms</figcaption>
                </figure>
                <p>{t('s9P1')}</p>
                <p>{t('s9P2')}</p>
                <div className="expert-callout">
                  <p>{t('s9Callout')}</p>
                </div>
              </section>

              <AffiliateMidArticle partner="zenhr" heading="ZenHR" description="GOSI, Mudad & Saudization compliance built-in" buttonText="Try ZenHR" variant="conclusion" />

              {/* SECTION 10 -- How to Choose */}
              <section id="section-10" className="fade-up article-section">
                <h2>{t('s10Title')}</h2>
                <p className="lead-paragraph">{t('s10Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/best-hr-software-saudi-4.webp" alt="6 key factors for choosing HR software in Saudi Arabia" width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>Key factors to evaluate when selecting HR software for your Saudi business</figcaption>
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
                <div className="hr-saudi__verdict-grid">
                  {(['SME', 'Enterprise', 'Budget', 'Startup'] as const).map((cat) => (
                    <div key={cat} className="hr-saudi__verdict-card">
                      <span className="hr-saudi__verdict-label">Best for {cat}</span>
                      <p>{t(`s11Verdict${cat}`)}</p>
                    </div>
                  ))}
                </div>
                <h3>{t('s11ScoreLabel')}</h3>
                <div className="hr-saudi__scores">
                  {(['jisr', 'zenhr', 'bayzat', 'darwinbox'] as const).map((key) => (
                    <div key={key} className="hr-saudi__score-row">
                      <span className="hr-saudi__score-name">{t(`s3Row_${key}_name`)}</span>
                      <div className="hr-saudi__score-bar">
                        <div className="hr-saudi__score-fill" style={{ width: `${(parseFloat(t(`s11_${key}_score`)) / 5) * 100}%` }} />
                      </div>
                      <span className="hr-saudi__score-value">{t(`s11_${key}_score`)}{t('s11ScoreMax')}</span>
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

              <ShareButtons shareText="Best HR Software in Saudi Arabia (2026): GOSI, Mudad & Saudization Compliance" />
            </div>
          </div>
        </div>

        <CallToAction />
      </main>

      <Footer />
      <AffiliateMobileBar partner="jisr" buttonText="Try Jisr" />
      <ArticleJsonLd
        title={t('metaTitle')}
        description={t('metaDescription')}
        url={`${SITE_CONFIG.url}/best-hr-software`}
        image={`${SITE_CONFIG.url}/assets/articles/best-hr-software-saudi-1.webp`}
        datePublished="2026-04-06"
        dateModified="2026-04-06"
      />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: '/' },
        { name: 'Reviews', url: '/blogs' },
        { name: t('metaTitle'), url: '/best-hr-software' },
      ]} />
      <FaqJsonLd items={[1, 2, 3, 4, 5].map((n) => ({
        question: t(`s12Q${n}`),
        answer: t(`s12A${n}`),
      }))} />
    </>
  );
}
