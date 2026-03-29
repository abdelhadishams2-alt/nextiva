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
import AffiliateDisclosure from '@/components/ui/AffiliateDisclosure';
import AffiliateLink from '@/components/ui/AffiliateLink';
import AffiliateSidebar from '@/components/ui/AffiliateSidebar';
import AffiliateMobileBar from '@/components/ui/AffiliateMobileBar';
import AffiliateMidArticle from '@/components/ui/AffiliateMidArticle';

const tocItems = [
  { id: 'section-2', label: 'The $10B Appetite' },
  { id: 'section-3', label: "HungerStation's Decline" },
  { id: 'section-4', label: 'The Challengers' },
  { id: 'section-5', label: "Jahez's Trajectory" },
  { id: 'section-6', label: 'Cloud Kitchen Boom' },
  { id: 'section-7', label: 'Q-Commerce Race' },
  { id: 'section-8', label: 'Why Fragmentation Accelerates' },
  { id: 'section-9', label: 'Impact on Restaurants' },
  { id: 'section-10', label: 'Future Outlook' },
  { id: 'section-11', label: 'FAQ' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'The $10 Billion Appetite' },
  { id: 'section-3', label: 'How HungerStation Lost Its Grip' },
  { id: 'section-4', label: 'The Challengers: Who Joined the Fight' },
  { id: 'section-5', label: 'Jahez: From Nomu IPO to Tadawul Reckoning' },
  { id: 'section-6', label: 'The Cloud Kitchen Multiplier' },
  { id: 'section-7', label: 'Q-Commerce: The 15-Minute Front' },
  { id: 'section-8', label: 'Why Saudi Arabia Fragments Faster' },
  { id: 'section-9', label: 'What Fragmentation Means for Restaurants' },
  { id: 'section-10', label: 'Where the Market Goes Next' },
  { id: 'section-11', label: 'Frequently Asked Questions' },
];

export async function generateMetadata() {
  const t = await getTranslations('Articles.articleSaudiFoodDelivery');
  const title = t('metaTitle');
  const description = t('metaDescription');
  return {
    title,
    description,
    keywords: 'Saudi Arabia food delivery, HungerStation, Jahez, Mrsool, q-commerce Saudi Arabia, cloud kitchens Riyadh, food delivery market analysis, Saudi ARPU',
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/article-saudi-food-delivery`,
      siteName: SITE_CONFIG.name,
      images: [{ url: `${SITE_CONFIG.url}/assets/articles/article-saudi-food-delivery-1.webp`, width: 1200, height: 630, alt: title }],
      type: 'article',
      publishedTime: '2026-03-24T00:00:00Z',
      authors: [SITE_CONFIG.author],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_CONFIG.url}/assets/articles/article-saudi-food-delivery-1.webp`],
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/article-saudi-food-delivery`,
    },
  };
}

export default async function ArticleSaudiFoodDeliveryPage() {
  const t = await getTranslations('Articles.articleSaudiFoodDelivery');

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section article-hero">
          <div className="article-hero__bg">
            <img src="/assets/articles/article-saudi-food-delivery-1.webp" alt={t('heroImageAlt')} />
          </div>
          <div className="article-hero__overlay" />
          <div className="article-hero__content">
            <span className="article-hero__badge">{t('heroBadge')}</span>
            <h1>{t('heroTitle')}</h1>
            <p className="article-hero__subtitle">{t('heroSubtitle')}</p>
            <div className="article-hero__meta">
              <span>
                <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                {t('heroAuthor')}
              </span>
              <span className="reading-time">
                <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                {t('heroReadTime')}
              </span>
              <span>
                <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                {t('heroDate')}
              </span>
            </div>
          </div>
        </section>

        <div className="container-article">
          <div className="article-layout">
            <TOCSidebar items={tocItems}>
              <AffiliateSidebar partner="foodics" title="Food Delivery Technology" buttonText="Explore Foodics" />
            </TOCSidebar>
            <div className="article-main">
              <TOCInline items={tocItemsFull} />

              {/* Author Box */}
              <div className="author-box">
                <div className="author-avatar">MA</div>
                <div className="author-info">
                  <span className="author-name">{t('heroAuthor')}</span>
                  <span className="author-meta">{t('authorMeta')}</span>
                </div>
              </div>

              {/* Affiliate Disclosure */}
              <AffiliateDisclosure />

              {/* SECTION 2 — Stat Dashboard */}
              <section id="section-2" className="fade-up article-section article-prose">
                <h2>{t('s2Title')}</h2>
                <p className="lead">{t('s2Lead')}</p>
                <div className="stat-dashboard">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="stat-card">
                      <div className="stat-number">{t(`s2Stat${n}Number`)}</div>
                      <div className="stat-label">{t(`s2Stat${n}Label`)}</div>
                      <div className="stat-context">{t(`s2Stat${n}Context`)}</div>
                    </div>
                  ))}
                </div>
                <p>{t('s2P1')}</p>
                <p>{t('s2P2')}</p>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    {[1, 2, 3].map((n) => (
                      <li key={n}>{t(`s2Source${n}`)}</li>
                    ))}
                  </ol>
                </div>
              </section>

              {/* SECTION 3 — Timeline */}
              <section id="section-3" className="fade-up article-section article-prose">
                <h2>{t('s3Title')}</h2>
                <p>{t('s3Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-saudi-food-delivery-2.webp" alt={t('s3ImageAlt')} />
                  <figcaption>{t('s3ImageCaption')}</figcaption>
                </figure>
                <div className="timeline-container">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="timeline-date">{t(`s3Timeline${n}Date`)}</div>
                      <div className="timeline-title">{t(`s3Timeline${n}Title`)}</div>
                      <div className="timeline-desc">{t(`s3Timeline${n}Desc`)}</div>
                    </div>
                  ))}
                </div>
                <p>{t('s3Conclusion')}</p>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    {[1, 2].map((n) => (
                      <li key={n}>{t(`s3Source${n}`)}</li>
                    ))}
                  </ol>
                </div>
              </section>

              {/* SECTION 4 — Profile Cards */}
              <section id="section-4" className="fade-up article-section article-prose">
                <h2>{t('s4Title')}</h2>
                <p>{t('s4Intro')}</p>
                <div className="profile-grid">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="profile-card">
                      <div className="profile-card-name">{t(`s4Card${n}Name`)}</div>
                      <div className="profile-card-position">{t(`s4Card${n}Position`)}</div>
                      <p>{t(`s4Card${n}Desc`)}</p>
                      <div className="profile-card-stat">{t(`s4Card${n}Stat`)}</div>
                    </div>
                  ))}
                </div>
                <p>{t('s4Conclusion')}</p>
              </section>

              {/* SECTION 5 — Jahez Data Bars */}
              <section id="section-5" className="fade-up article-section article-prose">
                <h2>{t('s5Title')}</h2>
                <p>{t('s5Intro')}</p>
                <figure className="article-image article-image--supporting">
                  <img src="/assets/articles/article-saudi-food-delivery-3.webp" alt={t('s5ImageAlt')} />
                  <figcaption>{t('s5ImageCaption')}</figcaption>
                </figure>
                <div className="data-bars-container">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="data-bar-item">
                      <div className="data-bar-header">
                        <span className="data-bar-label">{t(`s5Bar${n}Label`)}</span>
                        <span className={`data-bar-value${n === 3 ? ' negative' : ''}`}>{t(`s5Bar${n}Value`)}</span>
                      </div>
                      <div className="data-bar-track">
                        <div className={`data-bar-fill${n === 3 ? ' negative' : ''}`} style={{ width: t(`s5Bar${n}Width`) }} />
                      </div>
                      <div className="data-bar-context">{t(`s5Bar${n}Context`)}</div>
                    </div>
                  ))}
                </div>
                <p>{t('s5P1')}</p>
                <p>{t('s5P2')}</p>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    {[1, 2].map((n) => (
                      <li key={n}>{t(`s5Source${n}`)}</li>
                    ))}
                  </ol>
                </div>
              </section>

              {/* SECTION 6 — Cloud Kitchen */}
              <section id="section-6" className="fade-up article-section article-prose stacked-image-stats">
                <h2>{t('s6Title')}</h2>
                <p>{t('s6Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-saudi-food-delivery-4.webp" alt={t('s6ImageAlt')} />
                  <figcaption>{t('s6ImageCaption')}</figcaption>
                </figure>
                <div className="stats-row">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="stat-block">
                      <div className="stat-block-number">{t(`s6Stat${n}Number`)}</div>
                      <div className="stat-block-label">{t(`s6Stat${n}Label`)}</div>
                    </div>
                  ))}
                </div>
                <p>{t('s6P1')}</p>
                <p>{t('s6P2')}</p>
                <p>{t('s6P3')}</p>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    {[1, 2].map((n) => (
                      <li key={n}>{t(`s6Source${n}`)}</li>
                    ))}
                  </ol>
                </div>
              </section>

              {/* Mid-Article CTA */}
              <AffiliateMidArticle
                partner="foodics"
                heading="Power Your Delivery Operations"
                description="Foodics integrates POS, delivery, and analytics in one platform."
                buttonText="Explore Foodics"
              />

              {/* SECTION 7 — Q-Commerce Progress Bars */}
              <section id="section-7" className="fade-up article-section article-prose">
                <h2>{t('s7Title')}</h2>
                <p>{t('s7Intro')}</p>
                <div className="progress-bars-container">
                  {([
                    { key: 1, width: '28%' },
                    { key: 2, width: '100%' },
                    { key: 3, width: '72%' },
                    { key: 4, width: '55%' },
                  ] as const).map((bar) => (
                    <div key={bar.key} className="progress-bar-item">
                      <div className="progress-bar-header">
                        <span className="progress-bar-label">{t(`s7Bar${bar.key}Label`)}</span>
                        <span className="progress-bar-value">{t(`s7Bar${bar.key}Value`)}</span>
                      </div>
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width: bar.width }} />
                      </div>
                      <div className="progress-bar-context">{t(`s7Bar${bar.key}Context`)}</div>
                    </div>
                  ))}
                </div>
                <p>{t('s7P1')}</p>
                <p>{t('s7P2')}</p>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    {[1, 2].map((n) => (
                      <li key={n}>{t(`s7Source${n}`)}</li>
                    ))}
                  </ol>
                </div>
              </section>

              {/* SECTION 8 — Feature Cards (Why Fragmentation) */}
              <section id="section-8" className="fade-up article-section article-prose">
                <h2>{t('s8Title')}</h2>
                <p>{t('s8Intro')}</p>
                <figure className="article-image article-image--atmospheric">
                  <img src="/assets/articles/article-saudi-food-delivery-5.webp" alt={t('s8ImageAlt')} />
                  <figcaption>{t('s8ImageCaption')}</figcaption>
                </figure>
                <div className="feature-grid">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="feature-card">
                      <div className="feature-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {n === 1 && <><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>}
                          {n === 2 && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>}
                          {n === 3 && <><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>}
                          {n === 4 && <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>}
                          {n === 5 && <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></>}
                        </svg>
                      </div>
                      <h4>{t(`s8Feature${n}Title`)}</h4>
                      <p>{t(`s8Feature${n}Desc`)}</p>
                    </div>
                  ))}
                </div>
                <p>{t('s8P1')}</p>
                <p>{t('s8P2')}</p>
              </section>

              {/* SECTION 9 — Split Editorial */}
              <section id="section-9" className="fade-up article-section article-prose">
                <h2>{t('s9Title')}</h2>
                <p>{t('s9Intro')}</p>
                <div className="split-editorial">
                  <div className="split-col split-col--positive">
                    <h4>{t('s9ConsumerTitle')}</h4>
                    <ul>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <li key={n}>{t(`s9Consumer${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="split-col split-col--challenging">
                    <h4>{t('s9RestaurantTitle')}</h4>
                    <ul>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <li key={n}>{t(`s9Restaurant${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p>{t('s9P1')}</p>
                <div className="expert-callout">
                  <p>{t('s9CalloutText')}</p>
                  <cite>{t('s9CalloutCite')}</cite>
                </div>
                <p>{t('s9P2')}</p>
              </section>

              {/* SECTION 10 — Final Takeaways */}
              <section id="section-10" className="fade-up article-section article-prose">
                <h2>{t('s10Title')}</h2>
                <p>{t('s10Intro')}</p>
                <div className="key-takeaways">
                  <h4>{t('keyTakeawaysLabel')}</h4>
                  <ul>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <li key={n}>{t(`s10Takeaway${n}`)}</li>
                    ))}
                  </ul>
                </div>
                <div className="takeaways-box">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="takeaway-item">
                      <div className="takeaway-number">{n}</div>
                      <div className="takeaway-text" dangerouslySetInnerHTML={{ __html: t.raw(`s10Detail${n}`) }} />
                    </div>
                  ))}
                </div>
                <AffiliateLink partner="foodics">
                  Explore Foodics
                </AffiliateLink>

                <ShareButtons shareText={t('shareText')} />
              </section>

              {/* SECTION 11 — FAQ Cards Grid */}
              <section id="section-11" className="fade-up article-section article-prose">
                <h2>{t('s11Title')}</h2>
                <div className="faq-grid">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="faq-card">
                      <h4>{t(`s11Q${n}`)}</h4>
                      <p>{t(`s11A${n}`)}</p>
                    </div>
                  ))}
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>
      <CallToAction />
      <Footer />
      <AffiliateMobileBar partner="foodics" buttonText="Explore Foodics" />
    </>
  );
}
