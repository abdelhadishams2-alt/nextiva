import { getTranslations } from 'next-intl/server';
import ReadingProgress from '@/components/ui/ReadingProgress';
import TOCSidebar from '@/components/ui/TOCSidebar';
import TOCInline from '@/components/ui/TOCInline';
import ShareButtons from '@/components/ui/ShareButtons';
import FadeUpObserver from '@/components/ui/FadeUpObserver';
import { Navbar } from '@/components/sections/Navbar';
import { CallToAction } from '@/components/sections/CallToAction';
import { Footer } from '@/components/sections/Footer';

const tocItems = [
  { id: 'section-2', label: 'Super-Platform Thesis' },
  { id: 'section-3', label: 'Key Metrics' },
  { id: 'section-4', label: 'Platform Stack' },
  { id: 'section-5', label: 'Global Expansion' },
  { id: 'section-6', label: 'Acquisition Playbook' },
  { id: 'section-7', label: 'Foodics Capital' },
  { id: 'section-8', label: 'Market Tailwind' },
  { id: 'section-9', label: 'Competitive Landscape' },
  { id: 'section-10', label: 'IPO Outlook' },
  { id: 'section-11', label: 'Takeaways' },
  { id: 'section-12', label: "What's Next" },
];

const tocItemsFull = [
  { id: 'section-2', label: 'The Super-Platform Thesis' },
  { id: 'section-3', label: 'Foodics by the Numbers' },
  { id: 'section-4', label: 'The Platform Stack -- What Foodics Actually Does Now' },
  { id: 'section-5', label: 'From Riyadh to 35+ Countries' },
  { id: 'section-6', label: 'The Acquisition Playbook' },
  { id: 'section-7', label: 'Foodics Capital -- Banking the Unbankable' },
  { id: 'section-8', label: 'The Saudi F&B Tailwind' },
  { id: 'section-9', label: 'Foodics vs. Toast vs. Square' },
  { id: 'section-10', label: 'What a Tadawul IPO Would Mean' },
  { id: 'section-11', label: 'Key Takeaways' },
  { id: 'section-12', label: 'Where the Super-Platform Goes Next' },
];

export async function generateMetadata() {
  const t = await getTranslations('Articles.foodicsSaudiArabia');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: 'Foodics, Saudi restaurant tech, POS system, MENA SaaS, restaurant super-platform, Foodics Capital, embedded finance, Saudi F&B market',
  };
}

export default async function FoodicsSaudiArabiaPage() {
  const t = await getTranslations('Articles.foodicsSaudiArabia');

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section article-hero">
          <div className="article-hero__bg">
            <img src="/assets/articles/article-foodics-superplatform-1.jpeg" alt={t('heroImageAlt')} />
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
            <TOCSidebar items={tocItems} />
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

              {/* SECTION 2 — The Super-Platform Thesis */}
              <section id="section-2" className="fade-up article-section">
                <div className="article-excerpt">
                  <span className="article-excerpt__tag">{t('s2Tag')}</span>
                  <h2 className="article-excerpt__title">{t('s2Title')}</h2>
                  <div className="article-excerpt__text">
                    <p>{t('s2P1')}</p>
                    <p>{t('s2P2')}</p>
                    <p>{t('s2P3')}</p>
                  </div>
                </div>
              </section>

              {/* SECTION 3 — Foodics by the Numbers */}
              <section id="section-3" className="fade-up article-section metrics-section">
                <h2 className="section-heading">{t('s3Title')}</h2>
                <div className="metrics-hero">
                  <div className="metrics-hero__value">{t('s3HeroValue')}</div>
                  <div className="metrics-hero__label">{t('s3HeroLabel')}</div>
                </div>
                <div className="metrics-grid">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="metric-card">
                      <div className="metric-card__value">{t(`s3Metric${n}Value`)}</div>
                      <div className="metric-card__label">{t(`s3Metric${n}Label`)}</div>
                      <div className="metric-card__source">{t(`s3Metric${n}Source`)}</div>
                    </div>
                  ))}
                </div>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    <li>{t('s3Source1')}</li>
                    <li>{t('s3Source2')}</li>
                    <li>{t('s3Source3')}</li>
                    <li>{t('s3Source4')}</li>
                  </ol>
                </div>
              </section>

              {/* SECTION 4 — The Platform Stack */}
              <section id="section-4" className="fade-up article-section hub-spoke">
                <h2>{t('s4Title')}</h2>
                <p className="hub-spoke__subtitle">{t('s4Subtitle')}</p>
                <div className="hub-spoke__diagram">
                  <svg className="hub-spoke__svg" viewBox="0 0 640 640">
                    <line x1="320" y1="320" x2="320" y2="72" />
                    <line x1="320" y1="320" x2="555" y2="170" />
                    <line x1="320" y1="320" x2="555" y2="470" />
                    <line x1="320" y1="320" x2="320" y2="568" />
                    <line x1="320" y1="320" x2="85" y2="470" />
                    <line x1="320" y1="320" x2="85" y2="170" />
                  </svg>
                  <div className="hub-spoke__center">
                    <div className="hub-spoke__center-icon">&#9741;</div>
                    <div className="hub-spoke__center-label">{t('s4CenterLabel')}</div>
                  </div>
                  {[
                    { top: '11.25%', left: '50%', icon: '\u{1F4B3}', n: 1 },
                    { top: '26.5%', left: '86.7%', icon: '\u{1F4B0}', n: 2 },
                    { top: '73.5%', left: '86.7%', icon: '\u{1F4E6}', n: 3 },
                    { top: '88.75%', left: '50%', icon: '\u{1F4CA}', n: 4 },
                    { top: '73.5%', left: '13.3%', icon: '\u{1F4D1}', n: 5 },
                    { top: '26.5%', left: '13.3%', icon: '\u{1F5A5}', n: 6 },
                  ].map((node) => (
                    <div key={node.n} className="hub-spoke__node" style={{ top: node.top, left: node.left }}>
                      <div className="hub-spoke__node-circle">{node.icon}</div>
                      <div className="hub-spoke__node-title">{t(`s4Node${node.n}Title`)}</div>
                      <div className="hub-spoke__node-desc">{t(`s4Node${node.n}Desc`)}</div>
                    </div>
                  ))}
                </div>
                <div className="section-body" style={{ marginTop: '32px' }}>
                  <p>{t('s4P1')}</p>
                  <p>{t('s4P2')}</p>
                </div>
              </section>

              {/* SECTION 5 — From Riyadh to 35+ Countries */}
              <section id="section-5" className="fade-up article-section map-infographic">
                <h2>{t('s5Title')}</h2>
                <p className="map-infographic__subtitle">{t('s5Subtitle')}</p>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-foodics-superplatform-2.jpeg" alt={t('s5ImageAlt')} />
                  <figcaption>{t('s5ImageCaption')}</figcaption>
                </figure>
                <div className="map-infographic__regions">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="map-region">
                      <div className="map-region__name">{t(`s5Region${n}Name`)}</div>
                      <div className="map-region__stat">{t(`s5Region${n}Stat`)}</div>
                      <div className="map-region__detail">{t(`s5Region${n}Detail`)}</div>
                    </div>
                  ))}
                </div>
                <div className="section-body" style={{ marginTop: '24px' }}>
                  <p>{t('s5P1')}</p>
                </div>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    <li>{t('s5Source1')}</li>
                    <li>{t('s5Source2')}</li>
                  </ol>
                </div>
              </section>

              {/* SECTION 6 — The Acquisition Playbook */}
              <section id="section-6" className="fade-up article-section timeline-section">
                <h2>{t('s6Title')}</h2>
                <p className="timeline-section__subtitle">{t('s6Subtitle')}</p>
                <div className="timeline-v2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className={`timeline-v2__entry timeline-v2__entry--${n % 2 === 1 ? 'left' : 'right'}`}>
                      {n % 2 === 1 ? (
                        <>
                          <div className="timeline-v2__content">
                            <div className="timeline-v2__date">{t(`s6Event${n}Date`)}</div>
                            <div className="timeline-v2__title">{t(`s6Event${n}Title`)}</div>
                            <div className="timeline-v2__desc">{t(`s6Event${n}Desc`)}</div>
                          </div>
                          <div className="timeline-v2__spacer" />
                          <div className="timeline-v2__marker" />
                        </>
                      ) : (
                        <>
                          <div className="timeline-v2__spacer" />
                          <div className="timeline-v2__content">
                            <div className="timeline-v2__date">{t(`s6Event${n}Date`)}</div>
                            <div className="timeline-v2__title">{t(`s6Event${n}Title`)}</div>
                            <div className="timeline-v2__desc">{t(`s6Event${n}Desc`)}</div>
                          </div>
                          <div className="timeline-v2__marker" />
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className="expert-callout">
                  <p>{t('s6Quote')}</p>
                  <cite>{t('s6QuoteCite')}</cite>
                </div>
              </section>

              {/* SECTION 7 — Foodics Capital */}
              <section id="section-7" className="fade-up article-section stat-quote">
                <h2>{t('s7Title')}</h2>
                <div className="stat-quote__grid">
                  <div className="stat-quote__stat-side">
                    <div className="stat-quote__stat-value">{t('s7StatValue')}</div>
                    <div className="stat-quote__stat-label" dangerouslySetInnerHTML={{ __html: t.raw('s7StatLabel') }} />
                  </div>
                  <div className="stat-quote__quote-side">
                    <div className="stat-quote__quote-text">{t('s7QuoteText')}</div>
                    <div className="stat-quote__quote-cite">{t('s7QuoteCite')}</div>
                  </div>
                </div>
                <figure className="article-image article-image--atmospheric" style={{ marginTop: '28px' }}>
                  <img src="/assets/articles/article-foodics-superplatform-3.jpeg" alt={t('s7ImageAlt')} />
                  <figcaption>{t('s7ImageCaption')}</figcaption>
                </figure>
                <div className="section-body" style={{ marginTop: '24px' }}>
                  <p>{t('s7P1')}</p>
                  <p>{t('s7P2')}</p>
                </div>
              </section>

              {/* SECTION 8 — The Saudi F&B Tailwind */}
              <section id="section-8" className="fade-up article-section bar-chart-section">
                <h2>{t('s8Title')}</h2>
                <p className="bar-chart-section__subtitle">{t('s8Subtitle')}</p>
                <figure className="article-image article-image--atmospheric">
                  <img src="/assets/articles/article-foodics-superplatform-4.jpeg" alt={t('s8ImageAlt')} />
                  <figcaption>{t('s8ImageCaption')}</figcaption>
                </figure>
                <div className="bar-chart" style={{ marginTop: '48px' }}>
                  <div className="bar-chart__bar-wrap">
                    <div className="bar-chart__value">{t('s8Bar1Value')}</div>
                    <div className="bar-chart__bar bar-chart__bar--current" style={{ height: '210px' }} />
                    <div className="bar-chart__label">{t('s8Bar1Label')}</div>
                  </div>
                  <div className="bar-chart__bar-wrap">
                    <div className="bar-chart__value">{t('s8Bar2Value')}</div>
                    <div className="bar-chart__bar bar-chart__bar--projected" style={{ height: '260px' }} />
                    <div className="bar-chart__label">{t('s8Bar2Label')}</div>
                  </div>
                </div>
                <p className="bar-chart__source">{t('s8BarSource')}</p>
                <div className="section-body" style={{ marginTop: '24px' }}>
                  <p>{t('s8P1')}</p>
                  <p>{t('s8P2')}</p>
                </div>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    <li>{t('s8Source1')}</li>
                    <li>{t('s8Source2')}</li>
                  </ol>
                </div>
              </section>

              {/* SECTION 9 — Foodics vs Toast vs Square */}
              <section id="section-9" className="fade-up article-section mini-cards">
                <h2>{t('s9Title')}</h2>
                <div className="mini-cards__grid">
                  {(['foodics', 'toast', 'square'] as const).map((c) => (
                    <div key={c} className="mini-card">
                      <span className={`mini-card__badge mini-card__badge--${c}`}>{t(`s9Card_${c}_badge`)}</span>
                      <h4 className="mini-card__title">{t(`s9Card_${c}_title`)}</h4>
                      <p className="mini-card__desc">{t(`s9Card_${c}_desc`)}</p>
                      <div className="mini-card__tag">{t(`s9Card_${c}_tag`)}</div>
                    </div>
                  ))}
                </div>
                <div className="section-body" style={{ marginTop: '28px' }}>
                  <p>{t('s9P1')}</p>
                  <p>{t('s9P2')}</p>
                </div>
              </section>

              {/* SECTION 10 — What a Tadawul IPO Would Mean */}
              <section id="section-10" className="fade-up article-section futurist-quote">
                <h2>{t('s10Title')}</h2>
                <div className="futurist-quote__card">
                  <div className="futurist-quote__text">{t('s10QuoteText')}</div>
                  <div className="futurist-quote__attribution">{t('s10QuoteCite')}</div>
                </div>
                <div className="section-body" style={{ marginTop: '28px' }}>
                  <p>{t('s10P1')}</p>
                  <p>{t('s10P2')}</p>
                </div>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    <li>{t('s10Source1')}</li>
                    <li>{t('s10Source2')}</li>
                  </ol>
                </div>
              </section>

              {/* SECTION 11 — Key Takeaways */}
              <section id="section-11" className="fade-up article-section takeaway-summary">
                <h2>{t('s11Title')}</h2>
                <div className="key-takeaways">
                  <h4>{t('s11BoxHeader')}</h4>
                  <ul>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <li key={n} dangerouslySetInnerHTML={{ __html: t.raw(`s11Takeaway${n}`) }} />
                    ))}
                  </ul>
                </div>
              </section>

              {/* SECTION 12 — Where the Super-Platform Goes Next */}
              <section id="section-12" className="fade-up article-section bordered-quote">
                <h2>{t('s12Title')}</h2>
                <div className="bordered-quote__card">
                  <div className="bordered-quote__text" dangerouslySetInnerHTML={{ __html: t.raw('s12QuoteText') }} />
                  <div className="bordered-quote__attribution">{t('s12QuoteAttribution')}</div>
                </div>
                <figure className="article-image article-image--contextual" style={{ marginTop: '28px' }}>
                  <img src="/assets/articles/article-foodics-superplatform-5.jpeg" alt={t('s12ImageAlt')} />
                  <figcaption>{t('s12ImageCaption')}</figcaption>
                </figure>
                <div className="section-body" style={{ marginTop: '24px' }}>
                  <p>{t('s12P1')}</p>
                  <p>{t('s12P2')}</p>
                </div>
                <ShareButtons shareText={t('shareText')} />
              </section>

            </div>
          </div>
        </div>
      </main>
      <CallToAction />
      <Footer />
    </>
  );
}
