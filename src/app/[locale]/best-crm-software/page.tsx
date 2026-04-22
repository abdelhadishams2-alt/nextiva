import "@/styles/article.css";
import "@/styles/affiliate.css";
import "@/styles/faq.css";
import "@/styles/article-best-crm-saudi.css";
import Image from 'next/image';
import { BLUR_DATA_URL } from '@/lib/blur-placeholder';
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
  { id: 'section-2', label: 'Why CRM Matters' },
  { id: 'section-3', label: 'Quick Comparison' },
  { id: 'section-4', label: 'HubSpot' },
  { id: 'section-5', label: 'Zoho CRM' },
  { id: 'section-6', label: 'Salesforce' },
  { id: 'section-7', label: 'Freshsales' },
  { id: 'section-8', label: 'Others' },
  { id: 'section-9', label: 'How to Choose' },
  { id: 'section-10', label: 'Pricing' },
  { id: 'section-11', label: 'Verdict' },
  { id: 'section-12', label: 'FAQ' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'Why Every Saudi Business Needs a CRM in 2026' },
  { id: 'section-3', label: 'Quick Comparison: All 7 CRM Platforms at a Glance' },
  { id: 'section-4', label: 'HubSpot: Best Free CRM for Marketing Teams' },
  { id: 'section-5', label: 'Zoho CRM: Best Value with Full Arabic Support' },
  { id: 'section-6', label: 'Salesforce: Best Enterprise CRM for Saudi Arabia' },
  { id: 'section-7', label: 'Freshsales: Best Budget CRM for Sales Teams' },
  { id: 'section-8', label: 'Bitrix24, Dynamics 365 & Pipedrive' },
  { id: 'section-9', label: 'How to Choose the Right CRM for Your Business' },
  { id: 'section-10', label: 'Full Pricing Comparison' },
  { id: 'section-11', label: 'Our Verdict: Which CRM Should You Choose?' },
  { id: 'section-12', label: 'Frequently Asked Questions' },
];

export function generateStaticParams() {
  return [{ locale: 'en' }];
}

export async function generateMetadata() {
  const t = await getTranslations('Articles.bestCrmSaudi');
  const title = t('metaTitle');
  const description = t('metaDescription');
  return {
    title,
    description,
    keywords: 'best CRM Saudi Arabia, CRM software KSA, HubSpot Saudi, Zoho CRM Arabic, Salesforce Riyadh, Freshsales Middle East, CRM comparison Saudi, customer relationship management Saudi Arabia',
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/best-crm-software`,
      siteName: SITE_CONFIG.name,
      images: [{ url: `${SITE_CONFIG.url}/assets/articles/best-crm-saudi-1.webp`, width: 1200, height: 630, alt: title }],
      type: 'article',
      publishedTime: '2026-04-06T00:00:00Z',
      authors: [SITE_CONFIG.author],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_CONFIG.url}/assets/articles/best-crm-saudi-1.webp`],
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/best-crm-software`,
    },
  };
}

export default async function BestCrmSaudiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Articles.bestCrmSaudi');

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section article-hero">
          <div className="article-hero__bg">
            <Image src="/assets/articles/best-crm-saudi-1.webp" alt={t('heroImageAlt')} fill priority fetchPriority="high" quality={80} sizes="100vw" placeholder="blur" blurDataURL="data:image/webp;base64,UklGRlwAAABXRUJQVlA4IFAAAAAQAgCdASoMAAcAA4BaJQBWD+ACRCYiqplwAP7rXjfDjDCDQGADpXgwuyFwPdfc5Bt7nybhhlW8ULa8LaAujsw8AJVZWoJAYDFXoIhoc2AAAA==" style={{ objectFit: 'cover' }} />
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
              <AffiliateSidebar partner="hubspot" title="HubSpot CRM" buttonText="Try HubSpot Free" />
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

              {/* SECTION 2 -- Why CRM Matters */}
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
                  <table className="feature-matrix crm-saudi__comparison-table">
                    <thead>
                      <tr>
                        <th>{t('s3ColPlatform')}</th>
                        <th>{t('s3ColBestFor')}</th>
                        <th>{t('s3ColStartingPrice')}</th>
                        <th>{t('s3ColArabic')}</th>
                        <th>{t('s3ColFreeTier')}</th>
                        <th>{t('s3ColRating')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['hubspot', 'zoho', 'salesforce', 'freshsales', 'bitrix24', 'dynamics365', 'pipedrive'] as const).map((key) => (
                        <tr key={key}>
                          <td><strong>{t(`s3Row_${key}_name`)}</strong></td>
                          <td>{t(`s3Row_${key}_bestFor`)}</td>
                          <td>{t(`s3Row_${key}_price`)}</td>
                          <td>{t(`s3Row_${key}_arabic`)}</td>
                          <td>{t(`s3Row_${key}_freeTier`)}</td>
                          <td><span className="crm-saudi__score">{t(`s3Row_${key}_rating`)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* SECTION 4 -- HubSpot */}
              <section id="section-4" className="fade-up article-section">
                <h2>{t('s4Title')}</h2>
                <p className="lead-paragraph">{t('s4Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/best-crm-saudi-hubspot.webp" alt="HubSpot CRM dashboard interface" width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                  <figcaption>HubSpot offers one of the most generous free CRM plans on the market</figcaption>
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

              {/* SECTION 5 -- Zoho CRM */}
              <section id="section-5" className="fade-up article-section">
                <h2>{t('s5Title')}</h2>
                <p className="lead-paragraph">{t('s5Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/best-crm-saudi-zoho-crm.webp" alt="Zoho CRM with Arabic interface" width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                  <figcaption>Zoho CRM offers full Arabic and RTL support out of the box</figcaption>
                </figure>
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

              <AffiliateMidArticle partner="zoho" heading="Zoho CRM" description="Full Arabic support, AI assistant, and free for 3 users" buttonText="Try Zoho CRM Free" />

              {/* SECTION 6 -- Salesforce */}
              <section id="section-6" className="fade-up article-section">
                <h2>{t('s6Title')}</h2>
                <p className="lead-paragraph">{t('s6Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/best-crm-saudi-salesforce.webp" alt="Salesforce CRM enterprise dashboard" width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                  <figcaption>Salesforce opened its Riyadh headquarters in January 2025</figcaption>
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

              {/* SECTION 7 -- Freshsales */}
              <section id="section-7" className="fade-up article-section">
                <h2>{t('s7Title')}</h2>
                <p className="lead-paragraph">{t('s7Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/best-crm-saudi-freshsales.webp" alt="Freshsales CRM pipeline view" width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                  <figcaption>Freshsales combines an affordable price with built-in AI capabilities</figcaption>
                </figure>
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

              <AffiliateMidArticle partner="hubspot" heading="HubSpot CRM" description="Free forever with unlimited contacts and powerful marketing tools" buttonText="Get HubSpot Free" variant="conclusion" />

              {/* SECTION 8 -- Others */}
              <section id="section-8" className="fade-up article-section">
                <h2>{t('s8Title')}</h2>
                <p>{t('s8Intro')}</p>
                <div className="article-others-list">
                  {(['bitrix24', 'dynamics365', 'pipedrive'] as const).map((key) => {
                    const tiers = t(`s8_${key}_price`).split('|').map((s) => s.trim()).filter(Boolean);
                    return (
                      <article key={key} className="article-others-row">
                        <div className="article-others-main">
                          <h3>{t(`s8_${key}_name`)}</h3>
                          <p className="article-others-summary">{t(`s8_${key}_summary`)}</p>
                          <p className="article-others-verdict">{t(`s8_${key}_verdict`)}</p>
                        </div>
                        <aside className="article-others-pricing">
                          <span className="article-others-pricing-label">Pricing</span>
                          <ul className="article-others-pricing-list">
                            {tiers.map((tier, i) => (
                              <li key={i}>{tier}</li>
                            ))}
                          </ul>
                        </aside>
                      </article>
                    );
                  })}
                </div>
              </section>

              {/* SECTION 9 -- How to Choose */}
              <section id="section-9" className="fade-up article-section">
                <h2>{t('s9Title')}</h2>
                <p className="lead-paragraph">{t('s9Intro')}</p>
                <div className="article-factors-grid">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="article-factor-card">
                      <div className="article-factor-header">
                        <span className="article-factor-number">{String(n).padStart(2, '0')}</span>
                        <h3>{t(`s9Factor${n}Title`)}</h3>
                      </div>
                      <p>{t(`s9Factor${n}Desc`)}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 10 -- Pricing Table */}
              <section id="section-10" className="fade-up article-section">
                <h2>{t('s10Title')}</h2>
                <p>{t('s10Intro')}</p>
                <div className="data-table-wrap">
                  <table className="scorecard-table crm-saudi__pricing-table">
                    <thead>
                      <tr>
                        <th>{t('s10ColPlatform')}</th>
                        <th>{t('s10ColFree')}</th>
                        <th>{t('s10ColStarter')}</th>
                        <th>{t('s10ColProfessional')}</th>
                        <th>{t('s10ColEnterprise')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['hubspot', 'zoho', 'salesforce', 'freshsales', 'bitrix24', 'dynamics365', 'pipedrive'] as const).map((key) => (
                        <tr key={key}>
                          <td><strong>{t(`s10Row_${key}_name`)}</strong></td>
                          <td>{t(`s10Row_${key}_free`)}</td>
                          <td>{t(`s10Row_${key}_starter`)}</td>
                          <td>{t(`s10Row_${key}_professional`)}</td>
                          <td>{t(`s10Row_${key}_enterprise`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* SECTION 11 -- Verdict */}
              <section id="section-11" className="fade-up article-section article-section--verdict article-section--verdict-bg">
                <Image
                  src="/assets/articles/best-crm-verdict-bg.webp"
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 1280px"
                  quality={80}
                  className="article-verdict__bg-image"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
                <div className="article-verdict__overlay" />
                <span className="article-verdict__badge">{t('verdictBadge')}</span>
                <h2>{t('s11Title')}</h2>
                <p className="lead-paragraph">{t('s11Intro')}</p>
                <div className="crm-saudi__verdict-grid">
                  {([
                    { cat: 'SME', productKey: 'zoho', label: 'Best for SMEs' },
                    { cat: 'Enterprise', productKey: 'salesforce', label: 'Best for Enterprise' },
                    { cat: 'Budget', productKey: 'freshsales', label: 'Best for Budget' },
                    { cat: 'Sales', productKey: 'hubspot', label: 'Best Free to Start' },
                  ] as const).map(({ cat, productKey, label }) => {
                    const score = t(`s11_${productKey}_score`);
                    const fullText = t(`s11Verdict${cat}`);
                    const reasoning = fullText.split(' — ').slice(1).join(' — ') || fullText;
                    return (
                      <div key={cat} className="crm-saudi__verdict-card">
                        <span className="crm-saudi__verdict-label">{label}</span>
                        <div className="crm-saudi__verdict-product">
                          <span className="crm-saudi__verdict-product-name">{t(`s3Row_${productKey}_name`)}</span>
                          <span className="crm-saudi__verdict-product-score">{score}{t('s11ScoreMax')}</span>
                        </div>
                        <div className="crm-saudi__verdict-score-bar">
                          <div className="crm-saudi__verdict-score-fill" style={{ width: `${(parseFloat(score) / 5) * 100}%` }} />
                        </div>
                        <p>{reasoning}</p>
                      </div>
                    );
                  })}
                </div>
              </section>

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

              <ShareButtons shareText="Best CRM Software in Saudi Arabia (2026): Honest Comparison for Saudi Businesses" />
            </div>
          </div>
        </div>

        <CallToAction />
      </main>

      <Footer />
      <AffiliateMobileBar partner="hubspot" buttonText="Try HubSpot Free" />
      <ArticleJsonLd
        title={t('metaTitle')}
        description={t('metaDescription')}
        url={`${SITE_CONFIG.url}/best-crm-software`}
        image={`${SITE_CONFIG.url}/assets/articles/best-crm-saudi-1.webp`}
        datePublished="2026-04-06"
        dateModified="2026-04-06"
      />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: '/' },
        { name: 'Reviews', url: '/blogs' },
        { name: t('metaTitle'), url: '/best-crm-software' },
      ]} />
      <FaqJsonLd items={[1, 2, 3, 4, 5].map((n) => ({
        question: t(`s12Q${n}`),
        answer: (t.raw(`s12A${n}`) as string).replace(/<[^>]+>/g, ''),
      }))} />
    </>
  );
}
