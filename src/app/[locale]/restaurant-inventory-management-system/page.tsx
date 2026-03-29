import { getTranslations } from 'next-intl/server';
import { SITE_CONFIG } from '@/config/site';
import ReadingProgress from '@/components/ui/ReadingProgress';
import TOCSidebar from '@/components/ui/TOCSidebar';
import TOCInline from '@/components/ui/TOCInline';
import ShareButtons from '@/components/ui/ShareButtons';
import FadeUpObserver from '@/components/ui/FadeUpObserver';
import { Navbar } from '@/components/sections/Navbar';
import { CallToAction } from '@/components/sections/CallToAction';
import { Footer } from '@/components/sections/Footer';
import ArticleFaq from '@/components/ui/ArticleFaq';
import ArticleAccordionProcess from '@/components/ui/ArticleAccordionProcess';
import AffiliateDisclosure from '@/components/ui/AffiliateDisclosure';
import AffiliateLink from '@/components/ui/AffiliateLink';
import AffiliateSidebar from '@/components/ui/AffiliateSidebar';
import AffiliateMobileBar from '@/components/ui/AffiliateMobileBar';
import AffiliateMidArticle from '@/components/ui/AffiliateMidArticle';

const tocItems = [
  { id: 'section-2', label: 'The Invisible Bleed' },
  { id: 'section-3', label: 'Waste By the Numbers' },
  { id: 'section-4', label: 'Anatomy of a Leaking Kitchen' },
  { id: 'section-5', label: 'Where the Money Goes' },
  { id: 'section-6', label: 'The 42% Problem' },
  { id: 'section-7', label: 'AI Enters the Walk-In' },
  { id: 'section-8', label: 'Real Recovery Stories' },
  { id: 'section-9', label: 'Platform Landscape' },
  { id: 'section-10', label: 'The $7 Return' },
  { id: 'section-11', label: 'FAQ' },
  { id: 'section-12', label: 'Stop the Leak' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'The Invisible Bleed' },
  { id: 'section-3', label: "Your Restaurant's Waste, By the Numbers" },
  { id: 'section-4', label: 'The Anatomy of a Leaking Kitchen' },
  { id: 'section-5', label: 'Where the Money Actually Goes' },
  { id: 'section-6', label: 'The 42% Problem' },
  { id: 'section-7', label: 'AI Enters the Walk-In' },
  { id: 'section-8', label: 'Real Kitchens, Real Recoveries' },
  { id: 'section-9', label: 'The Platform Landscape' },
  { id: 'section-10', label: 'The $7 Return' },
  { id: 'section-11', label: 'Frequently Asked Questions' },
  { id: 'section-12', label: 'Stop the Leak' },
];

export async function generateMetadata() {
  const t = await getTranslations('Articles.restaurantInventoryManagementSystem');
  const title = t('metaTitle');
  const description = t('metaDescription');
  return {
    title,
    description,
    keywords: 'restaurant inventory management, food waste costs, restaurant technology, inventory software, food cost control, AI inventory, restaurant operations',
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/restaurant-inventory-management-system`,
      siteName: SITE_CONFIG.name,
      images: [{ url: `${SITE_CONFIG.url}/assets/articles/article-restaurant-inventory-leak-1.webp`, width: 1200, height: 630, alt: title }],
      type: 'article',
      publishedTime: '2026-03-24T00:00:00Z',
      authors: [SITE_CONFIG.author],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_CONFIG.url}/assets/articles/article-restaurant-inventory-leak-1.webp`],
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/restaurant-inventory-management-system`,
    },
  };
}

export default async function RestaurantInventoryManagementSystemPage() {
  const t = await getTranslations('Articles.restaurantInventoryManagementSystem');

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section article-hero">
          <div className="article-hero__bg">
            <img src="/assets/articles/article-restaurant-inventory-leak-1.webp" alt={t('heroImageAlt')} />
          </div>
          <div className="article-hero__overlay" />
          <div className="article-hero__content">
            <span className="article-hero__badge">{t('heroBadge')}</span>
            <h1>{t('heroTitle')}</h1>
            <div className="article-hero__meta">
              <span className="reading-time">
                <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                {t('heroReadTime')}
              </span>
              <span>{t('heroDate')}</span>
              <span>{t('heroAuthor')}</span>
            </div>
          </div>
        </section>

        <div className="container-article">
          <div className="article-layout">
            <TOCSidebar items={tocItems}>
              <AffiliateSidebar partner="foodics" title="Restaurant Inventory" buttonText="Try Foodics Free" />
            </TOCSidebar>
            <div className="article-main">
              <TOCInline items={tocItemsFull} />

              {/* SECTION 2 — Introduction */}
              <section id="section-2" className="fade-up article-section article-prose">
                <h2>{t('s2Title')}</h2>
                <p className="drop-cap" dangerouslySetInnerHTML={{ __html: t.raw('s2P1') }} />
                <p>{t('s2P2')}</p>
                <p>{t('s2P3')}</p>

                <div className="author-box">
                  <div className="author-avatar">ET</div>
                  <div className="author-info">
                    <span className="author-name">{t('authorName')}</span>
                    <span className="author-meta">{t('authorMeta')}</span>
                  </div>
                </div>

                {/* Affiliate Disclosure */}
                <AffiliateDisclosure />
              </section>

              {/* SECTION 3 — Stats Grid */}
              <section id="section-3" className="fade-up article-section article-prose">
                <h2>{t('s3Title')}</h2>
                <p>{t('s3Intro')}</p>

                <div className="stat-grid">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="stat-grid__card">
                      <div className="stat-grid__number">{t(`s3Stat${n}Value`)}</div>
                      <div className="stat-grid__label">{t(`s3Stat${n}Label`)}</div>
                      <div className="stat-grid__source">{t(`s3Stat${n}Source`)}</div>
                    </div>
                  ))}
                </div>

                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    {[1, 2, 3, 4].map((n) => (
                      <li key={n}>{t(`s3Source${n}`)}</li>
                    ))}
                  </ol>
                </div>
              </section>

              {/* SECTION 4 — Accordion Process */}
              <section id="section-4" className="fade-up article-section article-prose">
                <h2>{t('s4Title')}</h2>
                <p>{t('s4Intro')}</p>

                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-restaurant-inventory-leak-2.webp" alt={t('s4ImageAlt')} />
                  <figcaption>{t('s4ImageCaption')}</figcaption>
                </figure>

                <ArticleAccordionProcess items={[1, 2, 3, 4, 5].map((n) => ({
                  number: n,
                  title: t(`s4Accordion${n}Title`),
                  content: (
                    <>
                      <p>{t(`s4Accordion${n}P1`)}</p>
                      <p dangerouslySetInnerHTML={{ __html: t.raw(`s4Accordion${n}P2`) }} />
                    </>
                  ),
                }))} />
              </section>

              {/* SECTION 5 — Pie Chart */}
              <section id="section-5" className="fade-up article-section article-prose">
                <h2>{t('s5Title')}</h2>
                <p>{t('s5Intro')}</p>

                <div className="pie-chart-section">
                  <svg className="pie-chart-svg" viewBox="0 0 42 42" role="img" aria-label={t('s5ChartAria')}>
                    <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#0066ff" strokeWidth="6" strokeDasharray="30 70" strokeDashoffset="25" />
                    <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#02122c" strokeWidth="6" strokeDasharray="25 75" strokeDashoffset="95" />
                    <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#0062b8" strokeWidth="6" strokeDasharray="20 80" strokeDashoffset="70" />
                    <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#a39e9b" strokeWidth="6" strokeDasharray="13 87" strokeDashoffset="50" />
                    <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#e1deda" strokeWidth="6" strokeDasharray="12 88" strokeDashoffset="37" />
                  </svg>

                  <div className="pie-chart-legend">
                    {[
                      { color: '#0066ff', label: t('s5Legend1Label'), value: '30%' },
                      { color: '#02122c', label: t('s5Legend2Label'), value: '25%' },
                      { color: '#0062b8', label: t('s5Legend3Label'), value: '20%' },
                      { color: '#a39e9b', label: t('s5Legend4Label'), value: '13%' },
                      { color: '#e1deda', label: t('s5Legend5Label'), value: '12%' },
                    ].map((item) => (
                      <div key={item.label} className="pie-chart-legend__item">
                        <span className="pie-chart-legend__dot" style={{ background: item.color }} />
                        <span className="pie-chart-legend__label">{item.label}</span>
                        <span className="pie-chart-legend__value">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    {[1, 2].map((n) => (
                      <li key={n}>{t(`s5Source${n}`)}</li>
                    ))}
                  </ol>
                </div>
              </section>

              {/* SECTION 6 — The 42% Problem */}
              <section id="section-6" className="fade-up article-section article-prose">
                <h2>{t('s6Title')}</h2>
                <p dangerouslySetInnerHTML={{ __html: t.raw('s6Intro') }} />

                <div className="stat-before-after stat-before-after--with-image">
                  <div className="stat-ba__card stat-ba__card--after">
                    <div className="stat-ba__label">{t('s6WithLabel')}</div>
                    <div className="stat-ba__number">42%</div>
                    <div className="stat-ba__desc">{t('s6WithDesc')}</div>
                  </div>
                  <div className="stat-ba__card stat-ba__card--before">
                    <div className="stat-ba__label">{t('s6WithoutLabel')}</div>
                    <div className="stat-ba__number">58%</div>
                    <div className="stat-ba__desc">{t('s6WithoutDesc')}</div>
                  </div>
                  <figure className="stat-ba__image">
                    <img src="/assets/articles/article-restaurant-inventory-leak-3.webp" alt={t('s6ImageAlt')} />
                    <figcaption>{t('s6ImageCaption')}</figcaption>
                  </figure>
                </div>

                <p>{t('s6P1')}</p>

                <div className="expert-callout">
                  <p>{t('s6CalloutText')}</p>
                  <cite>{t('s6CalloutCite')}</cite>
                </div>
              </section>

              {/* SECTION 7 — AI Flowchart */}
              <section id="section-7" className="fade-up article-section article-prose">
                <h2>{t('s7Title')}</h2>
                <p dangerouslySetInnerHTML={{ __html: t.raw('s7Intro') }} />

                <div className="flowchart">
                  <div className="flowchart__track">
                    {[1, 2, 3, 4, 5, 6].map((n, i) => (
                      <span key={n}>
                        <div className={`flowchart__node flowchart__node--${t(`s7Node${n}Type`)}`}>
                          <div className="flowchart__node-icon">{t(`s7Node${n}Icon`)}</div>
                          <div className="flowchart__node-text">
                            <div className="flowchart__node-title">{t(`s7Node${n}Title`)}</div>
                            <div className="flowchart__node-desc">{t(`s7Node${n}Desc`)}</div>
                          </div>
                        </div>
                        {i < 5 && <div className="flowchart__connector" />}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    {[1, 2].map((n) => (
                      <li key={n}>{t(`s7Source${n}`)}</li>
                    ))}
                  </ol>
                </div>
              </section>

              {/* Mid-Article CTA */}
              <AffiliateMidArticle
                partner="foodics"
                heading="Stop the Inventory Losses"
                description="Foodics tracks every ingredient in real-time across all locations."
                buttonText="Try Foodics Free"
              />

              {/* SECTION 8 — Case Studies */}
              <section id="section-8" className="fade-up article-section article-prose">
                <h2>{t('s8Title')}</h2>
                <p>{t('s8Intro')}</p>

                <figure className="article-image article-image--supporting">
                  <img src="/assets/articles/article-restaurant-inventory-leak-4.webp" alt={t('s8ImageAlt')} />
                  <figcaption>{t('s8ImageCaption')}</figcaption>
                </figure>

                <div className="case-studies-grid">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="case-study-card">
                      <div className="case-study-card__brand">{t(`s8Case${n}Brand`)}</div>
                      <div className="case-study-card__metric">{t(`s8Case${n}Metric`)}</div>
                      <div className="case-study-card__label">{t(`s8Case${n}Label`)}</div>
                      <div className="case-study-card__desc">{t(`s8Case${n}Desc`)}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 9 — Platform Landscape Table */}
              <section id="section-9" className="fade-up article-section article-prose">
                <h2>{t('s9Title')}</h2>
                <p dangerouslySetInnerHTML={{ __html: t.raw('s9Intro') }} />

                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t('s9ColPlatform')}</th>
                        <th>{t('s9ColScale')}</th>
                        <th>{t('s9ColBestFor')}</th>
                        <th>{t('s9ColStrength')}</th>
                        <th>{t('s9ColPOS')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <tr key={n}>
                          <td>{t(`s9Row${n}Platform`)}</td>
                          <td>{t(`s9Row${n}Scale`)}</td>
                          <td>{t(`s9Row${n}BestFor`)}</td>
                          <td>{t(`s9Row${n}Strength`)}</td>
                          <td>{t(`s9Row${n}POS`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '12px' }}>{t('s9TableNote')}</p>
              </section>

              {/* SECTION 10 — The $7 Return */}
              <section id="section-10" className="fade-up article-section article-prose">
                <h2>{t('s10Title')}</h2>
                <p>{t('s10Intro')}</p>

                <div className="countdown-metrics">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="countdown-card">
                      <div className="countdown-card__number">{t(`s10Metric${n}Value`)}</div>
                      <div className="countdown-card__unit">{t(`s10Metric${n}Unit`)}</div>
                      <div className="countdown-card__desc">{t(`s10Metric${n}Desc`)}</div>
                    </div>
                  ))}
                </div>

                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-restaurant-inventory-leak-5.webp" alt={t('s10ImageAlt')} />
                  <figcaption>{t('s10ImageCaption')}</figcaption>
                </figure>

                <div className="key-takeaways">
                  <h4>{t('keyTakeawaysLabel')}</h4>
                  <ul>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <li key={n}>{t(`s10Takeaway${n}`)}</li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* SECTION 11 — FAQ */}
              <section id="section-11" className="fade-up article-section article-prose">
                <h2>{t('s11Title')}</h2>

                <div className="faq-accordion">
                  <ArticleFaq items={[1, 2, 3, 4, 5, 6, 7].map((n) => ({
                    question: t(`s11Faq${n}Q`),
                    answer: t(`s11Faq${n}A`),
                  }))} />
                </div>
              </section>

              {/* SECTION 12 — Share */}
              <section id="section-12" className="fade-up article-section">
                <AffiliateLink partner="foodics">
                  Try Foodics Free
                </AffiliateLink>

                <ShareButtons shareText={t('shareText')} />
                <p className="last-updated">{t('lastUpdated')}</p>
              </section>

            </div>
          </div>
        </div>
      </main>
      <CallToAction />
      <Footer />
      <AffiliateMobileBar partner="foodics" buttonText="Try Foodics Free" />
    </>
  );
}
