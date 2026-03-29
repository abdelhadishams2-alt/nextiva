import { getTranslations } from 'next-intl/server';
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
  { id: 'section-2', label: 'The Full-Stack Thesis' },
  { id: 'section-3', label: 'Classera at a Glance' },
  { id: 'section-4', label: 'LMS to Platform Empire' },
  { id: 'section-5', label: 'Six Pillars of the Ed OS' },
  { id: 'section-6', label: 'Expert Solutions Acquisition' },
  { id: 'section-7', label: 'The Arabic Content Gap' },
  { id: 'section-8', label: 'MENA Market Dynamics' },
  { id: 'section-9', label: 'C.XSEED Venture Builder' },
  { id: 'section-10', label: 'Implications for the Sector' },
  { id: 'section-11', label: 'Key Takeaways' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'The Full-Stack Thesis' },
  { id: 'section-3', label: 'Classera at a Glance' },
  { id: 'section-4', label: 'From Classroom Tool to Platform Empire' },
  { id: 'section-5', label: 'The Six Pillars of the Education OS' },
  { id: 'section-6', label: 'The Expert Solutions Acquisition' },
  { id: 'section-7', label: 'The Arabic Content Gap' },
  { id: 'section-8', label: 'MENA EdTech Market Dynamics' },
  { id: 'section-9', label: 'C.XSEED and the Venture Builder Model' },
  { id: 'section-10', label: 'What "Education OS" Means for the Sector' },
  { id: 'section-11', label: 'Key Takeaways' },
];

export async function generateMetadata() {
  const t = await getTranslations('Articles.classeraMiddleEast');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: 'Classera, MENA EdTech, education operating system, LMS, Arabic education technology, Saudi EdTech, learning management system, education ERP',
  };
}

export default async function ClasseraMiddleEastPage() {
  const t = await getTranslations('Articles.classeraMiddleEast');

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section article-hero">
          <div className="article-hero__bg">
            <img src="/assets/articles/article-classera-education-os-1.webp" alt={t('heroImageAlt')} />
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
              <AffiliateSidebar partner="classera" title="Education Platform" buttonText="Visit Classera" />
            </TOCSidebar>
            <div className="article-main">
              <TOCInline items={tocItemsFull} />

              {/* Author Box */}
              <div className="author-box">
                <div className="author-avatar">RD</div>
                <div className="author-info">
                  <span className="author-name">{t('heroAuthor')}</span>
                  <span className="author-meta">{t('authorPublished')}</span>
                </div>
              </div>

              {/* Affiliate Disclosure */}
              <AffiliateDisclosure />

              {/* SECTION 2 — The Full-Stack Thesis */}
              <section id="section-2" className="fade-up article-section article-prose section-intro">
                <h2>{t('s2Title')}</h2>
                <p className="lead">{t('s2Lead')}</p>
                <p>{t('s2P1')}</p>
                <p>{t('s2P2')}</p>
              </section>

              {/* SECTION 3 — Classera at a Glance */}
              <section id="section-3" className="fade-up article-section article-prose">
                <h2>{t('s3Title')}</h2>
                <div className="metric-cards-grid">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="metric-card">
                      <div className="metric-card__number">{t(`s3Metric${n}Number`)}</div>
                      <div className="metric-card__label">{t(`s3Metric${n}Label`)}</div>
                      <div className="metric-card__detail">{t(`s3Metric${n}Detail`)}</div>
                    </div>
                  ))}
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

              {/* SECTION 4 — From Classroom Tool to Platform Empire */}
              <section id="section-4" className="fade-up article-section article-prose">
                <h2>{t('s4Title')}</h2>
                <p>{t('s4Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-classera-education-os-2.webp" alt={t('s4ImageAlt')} />
                  <figcaption>{t('s4ImageCaption')}</figcaption>
                </figure>
                <div className="milestones-track">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="milestone-item">
                      <div className="milestone-item__dot" />
                      <div className="milestone-item__year">{t(`s4Milestone${n}Year`)}</div>
                      <div className="milestone-item__text">{t(`s4Milestone${n}Text`)}</div>
                    </div>
                  ))}
                </div>
                <p>{t('s4Conclusion')}</p>
              </section>

              {/* SECTION 5 — The Six Pillars of the Education OS */}
              <section id="section-5" className="fade-up article-section article-prose">
                <h2>{t('s5Title')}</h2>
                <p>{t('s5Intro')}</p>
                <div className="image-feature-layout">
                  <figure className="article-image" style={{ margin: 0 }}>
                    <img src="/assets/articles/article-classera-education-os-3.webp" alt={t('s5ImageAlt')} />
                    <figcaption>{t('s5ImageCaption')}</figcaption>
                  </figure>
                  <ul className="feature-list">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <li key={n} className="feature-list__item">
                        <div className="feature-list__icon">{n}</div>
                        <div className="feature-list__content">
                          <div className="feature-list__title">{t(`s5Pillar${n}Title`)}</div>
                          <div className="feature-list__desc">{t(`s5Pillar${n}Desc`)}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <p>{t('s5Conclusion')}</p>
              </section>

              {/* SECTION 6 — The Expert Solutions Acquisition */}
              <section id="section-6" className="fade-up article-section article-prose">
                <h2>{t('s6Title')}</h2>
                <p>{t('s6Intro')}</p>
                <div className="problem-solution-grid">
                  <div className="ps-panel ps-panel--problem">
                    <span className="ps-panel__label">{t('s6ProblemLabel')}</span>
                    <p>{t('s6ProblemP1')}</p>
                    <p>{t('s6ProblemP2')}</p>
                  </div>
                  <div className="ps-panel ps-panel--solution">
                    <span className="ps-panel__label">{t('s6SolutionLabel')}</span>
                    <p>{t('s6SolutionP1')}</p>
                    <p>{t('s6SolutionP2')}</p>
                  </div>
                </div>
                <p>{t('s6Conclusion')}</p>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    <li>{t('s6Source1')}</li>
                    <li>{t('s6Source2')}</li>
                  </ol>
                </div>
              </section>

              {/* Mid-Article CTA */}
              <AffiliateMidArticle
                partner="classera"
                heading="Transform Your Learning Platform"
                description="See how Classera powers education across the Middle East."
                buttonText="Visit Classera"
              />

              {/* SECTION 7 — The Arabic Content Gap */}
              <section id="section-7" className="fade-up article-section article-prose">
                <h2>{t('s7Title')}</h2>
                <figure className="article-image article-image--atmospheric">
                  <img src="/assets/articles/article-classera-education-os-4.webp" alt={t('s7ImageAlt')} />
                  <figcaption>{t('s7ImageCaption')}</figcaption>
                </figure>
                <div className="blockquote-highlight" style={{ borderLeft: 'none' }}>
                  <div className="blockquote-highlight__stat">{t('s7Stat')}</div>
                  <div className="blockquote-highlight__stat-label">{t('s7StatLabel')}</div>
                </div>
                <p>{t('s7P1')}</p>
                <p>{t('s7P2')}</p>
                <div className="expert-callout">
                  <p>{t('s7Quote')}</p>
                  <cite>{t('s7QuoteCite')}</cite>
                </div>
                <p>{t('s7P3')}</p>
              </section>

              {/* SECTION 8 — MENA EdTech Market Dynamics */}
              <section id="section-8" className="fade-up article-section article-prose">
                <h2>{t('s8Title')}</h2>
                <p>{t('s8Intro')}</p>
                <div className="bar-chart">
                  {[
                    { label: t('s8Bar1Label'), value: t('s8Bar1Value'), width: '100%' },
                    { label: t('s8Bar2Label'), value: t('s8Bar2Value'), width: '91%' },
                    { label: t('s8Bar3Label'), value: t('s8Bar3Value'), width: '45%' },
                    { label: t('s8Bar4Label'), value: t('s8Bar4Value'), width: '9%' },
                  ].map((bar) => (
                    <div key={bar.label} className="bar-chart__item">
                      <div className="bar-chart__header">
                        <span className="bar-chart__label">{bar.label}</span>
                        <span className="bar-chart__value">{bar.value}</span>
                      </div>
                      <div className="bar-chart__track">
                        <div className="bar-chart__fill" style={{ width: bar.width }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p>{t('s8P1')}</p>
                <p>{t('s8P2')}</p>
                <p>{t('s8P3')}</p>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    <li>{t('s8Source1')}</li>
                    <li>{t('s8Source2')}</li>
                    <li>{t('s8Source3')}</li>
                    <li>{t('s8Source4')}</li>
                  </ol>
                </div>
              </section>

              {/* SECTION 9 — C.XSEED and the Venture Builder Model */}
              <section id="section-9" className="fade-up article-section article-prose">
                <h2>{t('s9Title')}</h2>
                <p>{t('s9Intro')}</p>
                <div className="two-track-layout">
                  <div className="track">
                    <div className="track__header">{t('s9Track1Header')}</div>
                    <div className="track__subtitle">{t('s9Track1Subtitle')}</div>
                    <ul className="track__steps">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <li key={n} className="track__step">{t(`s9Track1Step${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="track">
                    <div className="track__header">{t('s9Track2Header')}</div>
                    <div className="track__subtitle">{t('s9Track2Subtitle')}</div>
                    <ul className="track__steps">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <li key={n} className="track__step">{t(`s9Track2Step${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p>{t('s9P1')}</p>
                <p>{t('s9P2')}</p>
              </section>

              {/* SECTION 10 — What Education OS Means for the Sector */}
              <section id="section-10" className="fade-up article-section article-prose">
                <h2>{t('s10Title')}</h2>
                <p>{t('s10Intro')}</p>
                <figure className="article-image article-image--supporting">
                  <img src="/assets/articles/article-classera-education-os-5.webp" alt={t('s10ImageAlt')} />
                  <figcaption>{t('s10ImageCaption')}</figcaption>
                </figure>
                <div className="signals-grid">
                  <div className="signals-panel signals-panel--positive">
                    <div className="signals-panel__label">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      {t('s10SignalsLabel')}
                    </div>
                    <ul>
                      {[1, 2, 3, 4].map((n) => (
                        <li key={n}>{t(`s10Signal${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="signals-panel signals-panel--caution">
                    <div className="signals-panel__label">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                      {t('s10CautionLabel')}
                    </div>
                    <ul>
                      {[1, 2, 3, 4].map((n) => (
                        <li key={n}>{t(`s10Caution${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p>{t('s10Conclusion')}</p>
              </section>

              {/* SECTION 11 — Key Takeaways */}
              <section id="section-11" className="fade-up article-section article-prose">
                <h2>{t('s11Title')}</h2>
                <div className="takeaways-box">
                  <div className="takeaways-box__header">{t('s11BoxHeader')}</div>
                  <ol className="takeaways-list">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <li key={n}>{t(`s11Takeaway${n}`)}</li>
                    ))}
                  </ol>
                </div>
                <AffiliateLink partner="classera">
                  Visit Classera
                </AffiliateLink>

                <ShareButtons shareText={t('shareText')} />
              </section>

            </div>
          </div>
        </div>
      </main>
      <CallToAction />
      <Footer />
      <AffiliateMobileBar partner="classera" buttonText="Visit Classera" />
    </>
  );
}
