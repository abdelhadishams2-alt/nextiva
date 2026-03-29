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
import ArticleFaqAccordion from '@/components/ui/ArticleFaqAccordion';
import AffiliateDisclosure from '@/components/ui/AffiliateDisclosure';
import AffiliateLink from '@/components/ui/AffiliateLink';
import AffiliateSidebar from '@/components/ui/AffiliateSidebar';
import AffiliateMobileBar from '@/components/ui/AffiliateMobileBar';
import AffiliateMidArticle from '@/components/ui/AffiliateMidArticle';

const tocItems = [
  { id: 'section-2', label: 'The $1.6T Problem' },
  { id: 'section-3', label: 'Distortion by the Numbers' },
  { id: 'section-4', label: 'Sync Architecture' },
  { id: 'section-5', label: 'AI vs Traditional Methods' },
  { id: 'section-6', label: 'Visibility Playbook' },
  { id: 'section-7', label: 'Red Flags to Watch' },
  { id: 'section-8', label: 'Real-World Transformation' },
  { id: 'section-9', label: 'Market Growth & Adoption' },
  { id: 'section-10', label: 'Building the Moat' },
  { id: 'section-11', label: 'FAQ' },
  { id: 'section-12', label: 'Next Steps' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'The $1.6 Trillion Problem Nobody Talks About' },
  { id: 'section-3', label: 'How Inventory Distortion Compounds Across Channels' },
  { id: 'section-4', label: 'Multi-Channel Sync: The Architecture That Wins' },
  { id: 'section-5', label: 'Traditional Methods vs AI-Powered Forecasting' },
  { id: 'section-6', label: 'The Real-Time Visibility Playbook' },
  { id: 'section-7', label: 'Warning Signs Your Inventory Sync Is Broken' },
  { id: 'section-8', label: 'Case in Point: From Chaos to Competitive Advantage' },
  { id: 'section-9', label: 'The Market Momentum Behind Inventory Intelligence' },
  { id: 'section-10', label: 'Building Your Competitive Moat: A Strategic Framework' },
  { id: 'section-11', label: 'Frequently Asked Questions' },
  { id: 'section-12', label: 'What Comes Next' },
];

export async function generateMetadata() {
  const t = await getTranslations('Articles.onlineInventoryManagementSystem');
  const title = t('metaTitle');
  const description = t('metaDescription');
  return {
    title,
    description,
    keywords: 'real-time inventory management, multi-channel sync, inventory optimization, supply chain software, AI forecasting, inventory distortion, demand planning',
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/online-inventory-management-system`,
      siteName: SITE_CONFIG.name,
      images: [{ url: `${SITE_CONFIG.url}/assets/articles/article-inventory-moat-1.webp`, width: 1200, height: 630, alt: title }],
      type: 'article',
      publishedTime: '2026-03-24T00:00:00Z',
      authors: [SITE_CONFIG.author],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_CONFIG.url}/assets/articles/article-inventory-moat-1.webp`],
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/online-inventory-management-system`,
    },
  };
}

export default async function OnlineInventoryManagementSystemPage() {
  const t = await getTranslations('Articles.onlineInventoryManagementSystem');

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section article-hero">
          <div className="article-hero__bg">
            <img src="/assets/articles/article-inventory-moat-1.webp" alt={t('heroImageAlt')} />
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
              <AffiliateSidebar partner="shopify" title="Inventory Management" buttonText="Compare Solutions" />
            </TOCSidebar>
            <div className="article-main">
              <TOCInline items={tocItemsFull} />

              {/* Author Box */}
              <div className="author-box">
                <div className="author-avatar">NE</div>
                <div className="author-info">
                  <span className="author-name">{t('heroAuthor')}</span>
                  <span className="author-meta">{t('authorPublished')}</span>
                  <span className="last-updated">{t('authorUpdated')}</span>
                </div>
              </div>

              {/* Affiliate Disclosure */}
              <AffiliateDisclosure />

              {/* Key Takeaways */}
              <div className="key-takeaways">
                <h4>{t('keyTakeawaysLabel')}</h4>
                <ul>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <li key={n} dangerouslySetInnerHTML={{ __html: t.raw(`takeaway${n}`) }} />
                  ))}
                </ul>
              </div>

              {/* SECTION 2 — Big Stat Callout */}
              <section id="section-2" className="fade-up article-section">
                <div className="big-stat-callout">
                  <div className="big-stat-callout__number">{t('s2StatNumber')}</div>
                  <h4 className="big-stat-callout__label">{t('s2StatLabel')}</h4>
                  <p className="big-stat-callout__desc">{t('s2StatDesc')}</p>
                </div>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol><li>{t('s2Source1')}</li></ol>
                </div>
              </section>

              {/* SECTION 3 — Six Stat Grid */}
              <section id="section-3" className="fade-up article-section">
                <div className="section-prose">
                  <p>{t('s3Intro')}</p>
                </div>
                <div className="stat-grid">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="stat-grid__cell">
                      <div className="stat-grid__number">{t(`s3Stat${n}Number`)}</div>
                      <div className="stat-grid__label">{t(`s3Stat${n}Label`)}</div>
                    </div>
                  ))}
                </div>
                <div className="section-prose">
                  <p>{t('s3Conclusion')}</p>
                </div>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    <li>{t('s3Source1')}</li>
                    <li>{t('s3Source2')}</li>
                    <li>{t('s3Source3')}</li>
                  </ol>
                </div>
              </section>

              {/* SECTION 4 — Two-Track Process */}
              <section id="section-4" className="fade-up article-section">
                <div className="two-track">
                  <h2 className="two-track__heading">{t('s4Title')}</h2>
                  <div className="section-prose">
                    <p>{t('s4Intro')}</p>
                  </div>
                  <figure className="article-image article-image--contextual">
                    <img src="/assets/articles/article-inventory-moat-2.webp" alt={t('s4ImageAlt')} />
                    <figcaption>{t('s4ImageCaption')}</figcaption>
                  </figure>
                  <div className="two-track__grid">
                    <div className="two-track__column">
                      <h4 className="two-track__column-title">{t('s4Track1Title')}</h4>
                      {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="two-track__step">
                          <div className="two-track__dot" />
                          <div className="two-track__step-text" dangerouslySetInnerHTML={{ __html: t.raw(`s4Track1Step${n}`) }} />
                        </div>
                      ))}
                    </div>
                    <div className="two-track__column">
                      <h4 className="two-track__column-title">{t('s4Track2Title')}</h4>
                      {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="two-track__step">
                          <div className="two-track__dot" />
                          <div className="two-track__step-text" dangerouslySetInnerHTML={{ __html: t.raw(`s4Track2Step${n}`) }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 5 — Comparison Data Bars */}
              <section id="section-5" className="fade-up article-section">
                <div className="comparison-bars">
                  <h2 className="comparison-bars__heading">{t('s5Title')}</h2>
                  <p className="comparison-bars__intro">{t('s5Intro')}</p>
                  <div className="comparison-bars__legend">
                    <div className="comparison-bars__legend-item">
                      <div className="comparison-bars__legend-swatch" style={{ background: 'var(--border)' }} />
                      <span>{t('s5LegendTraditional')}</span>
                    </div>
                    <div className="comparison-bars__legend-item">
                      <div className="comparison-bars__legend-swatch" style={{ background: 'linear-gradient(90deg, var(--secondary), var(--accent))' }} />
                      <span>{t('s5LegendAI')}</span>
                    </div>
                  </div>
                  {([
                    { label: 's5Bar1Label', left: 's5Bar1Left', right: 's5Bar1Right', leftW: '90%', rightW: '30%' },
                    { label: 's5Bar2Label', left: 's5Bar2Left', right: 's5Bar2Right', leftW: '50%', rightW: '65%' },
                    { label: 's5Bar3Label', left: 's5Bar3Left', right: 's5Bar3Right', leftW: '50%', rightW: '35%' },
                    { label: 's5Bar4Label', left: 's5Bar4Left', right: 's5Bar4Right', leftW: '100%', rightW: '25%' },
                    { label: 's5Bar5Label', left: 's5Bar5Left', right: 's5Bar5Right', leftW: '33%', rightW: '85%' },
                  ] as const).map((bar) => (
                    <div key={bar.label} className="comparison-bars__row">
                      <div className="comparison-bars__bar-left">
                        <span className="comparison-bars__value">{t(bar.left)}</span>
                        <div className="comparison-bars__bar comparison-bars__bar--traditional" style={{ width: bar.leftW, minWidth: '40px' }} />
                      </div>
                      <div className="comparison-bars__label">{t(bar.label)}</div>
                      <div className="comparison-bars__bar-right">
                        <div className="comparison-bars__bar comparison-bars__bar--ai" style={{ width: bar.rightW, minWidth: '40px' }} />
                        <span className="comparison-bars__value">{t(bar.right)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    <li>{t('s5Source1')}</li>
                    <li>{t('s5Source2')}</li>
                  </ol>
                </div>
              </section>

              {/* SECTION 6 — Process Cards Grid */}
              <section id="section-6" className="fade-up article-section">
                <div className="process-grid">
                  <h2 className="process-grid__heading">{t('s6Title')}</h2>
                  <p className="process-grid__intro">{t('s6Intro')}</p>
                  <figure className="article-image article-image--contextual">
                    <img src="/assets/articles/article-inventory-moat-3.webp" alt={t('s6ImageAlt')} />
                    <figcaption>{t('s6ImageCaption')}</figcaption>
                  </figure>
                  <div className="process-grid__cards">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <div key={n} className="process-grid__card">
                        <div className="process-grid__step-num">{String(n).padStart(2, '0')}</div>
                        <h4 className="process-grid__card-title">{t(`s6Step${n}Title`)}</h4>
                        <p className="process-grid__card-desc">{t(`s6Step${n}Desc`)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* SECTION 7 — Red Flags */}
              <section id="section-7" className="fade-up article-section">
                <div className="red-flags">
                  <h2 className="red-flags__heading">{t('s7Title')}</h2>
                  <p className="red-flags__intro">{t('s7Intro')}</p>
                  <div className="red-flags__grid">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <div key={n} className="red-flags__card">
                        <svg className="red-flags__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                        <span className="red-flags__text">{t(`s7Flag${n}`)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Mid-Article CTA */}
              <AffiliateMidArticle
                partner="shopify"
                heading="Real-Time Inventory Sync"
                description="Keep your inventory accurate across every channel automatically."
                buttonText="Compare Solutions"
              />

              {/* SECTION 8 — Problem/Approach/Results */}
              <section id="section-8" className="fade-up article-section">
                <div className="par-section">
                  <h2 className="par-section__heading">{t('s8Title')}</h2>
                  <p className="par-section__intro">{t('s8Intro')}</p>
                  <figure className="article-image article-image--supporting">
                    <img src="/assets/articles/article-inventory-moat-4.webp" alt={t('s8ImageAlt')} />
                    <figcaption>{t('s8ImageCaption')}</figcaption>
                  </figure>
                  <div className="par-section__grid">
                    <div className="par-section__card par-section__card--problem">
                      <div className="par-section__card-header">
                        <svg className="par-section__card-icon" viewBox="0 0 24 24" fill="none" stroke="#c53030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                        <h4 className="par-section__card-title">{t('s8ProblemTitle')}</h4>
                      </div>
                      <div className="par-section__card-desc">
                        <ul>
                          {[1, 2, 3, 4].map((n) => (
                            <li key={n}>{t(`s8Problem${n}`)}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="par-section__card par-section__card--approach">
                      <div className="par-section__card-header">
                        <svg className="par-section__card-icon" viewBox="0 0 24 24" fill="none" stroke="#0062b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
                        <h4 className="par-section__card-title">{t('s8ApproachTitle')}</h4>
                      </div>
                      <div className="par-section__card-desc">
                        <ul>
                          {[1, 2, 3, 4].map((n) => (
                            <li key={n}>{t(`s8Approach${n}`)}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="par-section__card par-section__card--results">
                      <div className="par-section__card-header">
                        <svg className="par-section__card-icon" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        <h4 className="par-section__card-title">{t('s8ResultsTitle')}</h4>
                      </div>
                      <div className="par-section__card-desc">
                        <ul>
                          {[1, 2, 3, 4].map((n) => (
                            <li key={n}>{t(`s8Result${n}`)}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="expert-callout">
                    <p>{t('s8CalloutText')}</p>
                    <cite>{t('s8CalloutCite')}</cite>
                  </div>
                </div>
              </section>

              {/* SECTION 9 — Metric Trend Cards */}
              <section id="section-9" className="fade-up article-section">
                <div className="trend-cards">
                  <h2 className="trend-cards__heading">{t('s9Title')}</h2>
                  <p className="trend-cards__intro">{t('s9Intro')}</p>
                  <div className="trend-cards__grid">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="trend-cards__card">
                        <div className="trend-cards__label">{t(`s9Card${n}Label`)}</div>
                        <div className="trend-cards__value">{t(`s9Card${n}Value`)}</div>
                        <div className="trend-cards__indicator">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
                          {t(`s9Card${n}Trend`)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '6px' }}>{t(`s9Card${n}Source`)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    <li>{t('s9Source1')}</li>
                    <li>{t('s9Source2')}</li>
                  </ol>
                </div>
              </section>

              {/* SECTION 10 — Two-Col Text (Strategic Framework) */}
              <section id="section-10" className="fade-up article-section">
                <div className="two-col-text">
                  <h2 className="two-col-text__heading">{t('s10Title')}</h2>
                  <div className="section-prose">
                    <p>{t('s10Intro')}</p>
                  </div>
                  <figure className="article-image article-image--atmospheric">
                    <img src="/assets/articles/article-inventory-moat-5.webp" alt={t('s10ImageAlt')} />
                    <figcaption>{t('s10ImageCaption')}</figcaption>
                  </figure>
                  <div className="two-col-text__grid">
                    <div className="two-col-text__column">
                      <h4 className="two-col-text__col-title">{t('s10QuickWinsTitle')}</h4>
                      <ul className="two-col-text__list">
                        {[1, 2, 3].map((n) => (
                          <li key={n} dangerouslySetInnerHTML={{ __html: t.raw(`s10QuickWin${n}`) }} />
                        ))}
                      </ul>
                    </div>
                    <div className="two-col-text__column">
                      <h4 className="two-col-text__col-title">{t('s10LongTermTitle')}</h4>
                      <ul className="two-col-text__list">
                        {[1, 2, 3, 4].map((n) => (
                          <li key={n} dangerouslySetInnerHTML={{ __html: t.raw(`s10LongTerm${n}`) }} />
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 11 — FAQ Accordion */}
              <section id="section-11" className="fade-up article-section">
                <div className="faq-accordion">
                  <h2 className="faq-accordion__heading">{t('s11Title')}</h2>
                  <ArticleFaqAccordion items={[1, 2, 3, 4, 5, 6].map((n) => ({
                    question: t(`s11Q${n}`),
                    answer: t(`s11A${n}`),
                  }))} />
                </div>
              </section>

              {/* SECTION 12 — Blockquote Highlight */}
              <section id="section-12" className="fade-up article-section">
                <div className="blockquote-highlight">
                  <h2 className="blockquote-highlight__heading">{t('s12Title')}</h2>
                  <div className="section-prose">
                    <p>{t('s12P1')}</p>
                    <p>{t('s12P2')}</p>
                  </div>
                  <blockquote>
                    <p dangerouslySetInnerHTML={{ __html: t.raw('s12Quote') }} />
                  </blockquote>
                  <AffiliateLink partner="shopify">
                    Compare Solutions
                  </AffiliateLink>

                  <ShareButtons shareText={t('shareText')} />
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>
      <CallToAction />
      <Footer />
      <AffiliateMobileBar partner="shopify" buttonText="Compare Solutions" />
    </>
  );
}
