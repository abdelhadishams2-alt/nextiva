import { getTranslations } from 'next-intl/server';
import ReadingProgress from '@/components/ui/ReadingProgress';
import TOCSidebar from '@/components/ui/TOCSidebar';
import TOCInline from '@/components/ui/TOCInline';
import ShareButtons from '@/components/ui/ShareButtons';
import FadeUpObserver from '@/components/ui/FadeUpObserver';
import { Navbar } from '@/components/sections/Navbar';
import { CallToAction } from '@/components/sections/CallToAction';
import { Footer } from '@/components/sections/Footer';
import ArticleFaq from '@/components/ui/ArticleFaq';

const tocItems = [
  { id: 'section-2', label: 'The $1.4T Market' },
  { id: 'section-3', label: 'Service Convergence' },
  { id: 'section-4', label: 'West vs. MENA Strategies' },
  { id: 'section-5', label: 'Dark Stores & Cloud Kitchens' },
  { id: 'section-6', label: 'Drones & Robots' },
  { id: 'section-7', label: 'AI Route Optimization' },
  { id: 'section-8', label: 'Worker Economics' },
  { id: 'section-9', label: 'Industry Expert View' },
  { id: 'section-10', label: 'Future Outlook' },
  { id: 'section-11', label: 'FAQ' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'The $1.4 Trillion Appetite' },
  { id: 'section-3', label: 'From Food to Everything: Five Convergence Verticals' },
  { id: 'section-4', label: 'West vs. MENA: Two Super-App Playbooks' },
  { id: 'section-5', label: 'The Infrastructure Beneath: Dark Stores & Cloud Kitchens' },
  { id: 'section-6', label: 'The Autonomous Frontier: Drones and Robots' },
  { id: 'section-7', label: 'AI as the Invisible Engine' },
  { id: 'section-8', label: 'The Human Cost Equation' },
  { id: 'section-9', label: 'Industry Expert Perspective' },
  { id: 'section-10', label: 'What Comes Next: 2026 to 2035' },
  { id: 'section-11', label: 'Key Questions Answered' },
];

export async function generateMetadata() {
  const t = await getTranslations('Articles.deliveryApps');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: 'super-app, delivery platforms, DoorDash, Uber Eats, autonomous delivery, AI logistics, dark stores, drone delivery',
  };
}

export default async function DeliveryAppsPage() {
  const t = await getTranslations('Articles.deliveryApps');

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section article-hero">
          <div className="article-hero__bg">
            <img src="/assets/articles/article-super-app-race-1.jpeg" alt={t('heroImageAlt')} />
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
              <span className="last-updated">{t('heroUpdated')}</span>
            </div>
          </div>
        </section>

        <div className="container-article">
          <div className="article-layout">
            <TOCSidebar items={tocItems} />
            <div className="article-main">
              <TOCInline items={tocItemsFull} />

              {/* SECTION 2 — Stats Cards */}
              <section id="section-2" className="fade-up article-section article-prose">
                <h2>{t('s2Title')}</h2>
                <p>{t('s2P1')}</p>
                <div className="stats-grid">
                  {(['stat1', 'stat2', 'stat3', 'stat4'] as const).map((key) => (
                    <div key={key} className="stat-card">
                      <div className="stat-number">{t(`s2_${key}_number`)}</div>
                      <div className="stat-label">{t(`s2_${key}_label`)}</div>
                    </div>
                  ))}
                </div>
                <p>{t('s2P2')}</p>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    <li>{t('s2Source1')}</li>
                    <li>{t('s2Source2')}</li>
                    <li>{t('s2Source3')}</li>
                    <li>{t('s2Source4')}</li>
                  </ol>
                </div>
              </section>

              {/* SECTION 3 — Numbered Cards */}
              <section id="section-3" className="fade-up article-section article-prose">
                <h2>{t('s3Title')}</h2>
                <p>{t('s3Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-super-app-race-2.jpeg" alt={t('s3ImageAlt')} />
                  <figcaption>{t('s3ImageCaption')}</figcaption>
                </figure>
                <ol className="numbered-list">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <li key={n}>
                      <div className="item-content">
                        <h4>{t(`s3Item${n}Title`)}</h4>
                        <p>{t(`s3Item${n}Desc`)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              {/* SECTION 4 — Comparison Table */}
              <section id="section-4" className="fade-up article-section article-prose">
                <h2>{t('s4Title')}</h2>
                <p>{t('s4Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-super-app-race-3.jpeg" alt={t('s4ImageAlt')} />
                  <figcaption>{t('s4ImageCaption')}</figcaption>
                </figure>
                <div className="comparison-table-wrap">
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th>{t('s4ColDimension')}</th>
                        <th>{t('s4ColWestern')}</th>
                        <th>{t('s4ColMENA')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['strategy', 'players', 'financial', 'ridehailing', 'speed', 'regulatory', 'infrastructure'] as const).map((key) => (
                        <tr key={key}>
                          <td><strong>{t(`s4Row_${key}_dim`)}</strong></td>
                          <td>{t(`s4Row_${key}_western`)}</td>
                          <td>{t(`s4Row_${key}_mena`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>{t('s4Conclusion')}</p>
              </section>

              {/* SECTION 5 — Feature Grid */}
              <section id="section-5" className="fade-up article-section article-prose">
                <h2>{t('s5Title')}</h2>
                <p>{t('s5Intro')}</p>
                <figure className="article-image article-image--supporting">
                  <img src="/assets/articles/article-super-app-race-4.jpeg" alt={t('s5ImageAlt')} />
                  <figcaption>{t('s5ImageCaption')}</figcaption>
                </figure>
                <div className="feature-grid">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="feature-card">
                      <div className="feature-icon">{t(`s5Feature${n}Icon`)}</div>
                      <h4>{t(`s5Feature${n}Title`)}</h4>
                      <p>{t(`s5Feature${n}Desc`)}</p>
                    </div>
                  ))}
                </div>
                <p>{t('s5Conclusion')}</p>
              </section>

              {/* SECTION 6 — Metric Highlights */}
              <section id="section-6" className="fade-up article-section article-prose">
                <h2>{t('s6Title')}</h2>
                <p>{t('s6Intro')}</p>
                <div className="metric-highlight">
                  <div className="metric-highlight-number">{t('s6Metric1Number')}</div>
                  <div className="metric-highlight-text">
                    <h4>{t('s6Metric1Title')}</h4>
                    <p>{t('s6Metric1Desc')}</p>
                  </div>
                </div>
                <div className="metric-highlight">
                  <div className="metric-highlight-number">{t('s6Metric2Number')}</div>
                  <div className="metric-highlight-text">
                    <h4>{t('s6Metric2Title')}</h4>
                    <p>{t('s6Metric2Desc')}</p>
                  </div>
                </div>
                <p>{t('s6P1')}</p>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    <li>{t('s6Source1')}</li>
                    <li>{t('s6Source2')}</li>
                    <li>{t('s6Source3')}</li>
                  </ol>
                </div>
              </section>

              {/* SECTION 7 — Before/After */}
              <section id="section-7" className="fade-up article-section article-prose">
                <h2>{t('s7Title')}</h2>
                <p>{t('s7Intro')}</p>
                <div className="before-after">
                  <div className="before-after__panel before-after__panel--before">
                    <span className="before-after__label">{t('s7BeforeLabel')}</span>
                    <ul className="before-after__list">
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <li key={n}>{t(`s7Before${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="before-after__panel before-after__panel--after">
                    <span className="before-after__label">{t('s7AfterLabel')}</span>
                    <ul className="before-after__list">
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <li key={n}>{t(`s7After${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p>{t('s7Conclusion1')}</p>
                <p>{t('s7Conclusion2')}</p>
              </section>

              {/* SECTION 8 — Worker Economics */}
              <section id="section-8" className="fade-up article-section article-prose">
                <h2>{t('s8Title')}</h2>
                <p>{t('s8Intro')}</p>
                <div className="callout-block">
                  <div className="callout-block__header">
                    <div className="callout-block__icon">!</div>
                    <span className="callout-block__title">{t('s8CalloutTitle')}</span>
                  </div>
                  <p>{t('s8CalloutP1')}</p>
                </div>
                <p>{t('s8P1')}</p>
                <p>{t('s8P2')}</p>
                <div className="key-takeaways">
                  <h4>{t('keyTakeawaysLabel')}</h4>
                  <ul>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <li key={n}>{t(`s8Takeaway${n}`)}</li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* SECTION 9 — Expert Quote */}
              <section id="section-9" className="fade-up article-section article-prose">
                <h2>{t('s9Title')}</h2>
                <div className="expert-callout">
                  <p>{t('s9Quote')}</p>
                  <cite>{t('s9Cite')}</cite>
                </div>
                <p>{t('s9P1')}</p>
                <p>{t('s9P2')}</p>
              </section>

              {/* SECTION 10 — Timeline */}
              <section id="section-10" className="fade-up article-section article-prose">
                <h2>{t('s10Title')}</h2>
                <p>{t('s10Intro')}</p>
                <figure className="article-image article-image--atmospheric">
                  <img src="/assets/articles/article-super-app-race-5.jpeg" alt={t('s10ImageAlt')} />
                  <figcaption>{t('s10ImageCaption')}</figcaption>
                </figure>
                <div className="timeline-container">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="timeline-label">{t(`s10Timeline${n}Year`)}</div>
                      <h4>{t(`s10Timeline${n}Title`)}</h4>
                      <p>{t(`s10Timeline${n}Desc`)}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 11 — FAQ */}
              <section id="section-11" className="fade-up article-section article-prose">
                <h2>{t('s11Title')}</h2>
                <div className="faq-container">
                  <ArticleFaq items={[1, 2, 3, 4, 5, 6].map((n) => ({
                    question: t(`s11Faq${n}Q`),
                    answer: t(`s11Faq${n}A`),
                  }))} />
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
