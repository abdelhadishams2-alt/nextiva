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
  { id: 'section-2', label: 'Wave 24 Explained' },
  { id: 'section-3', label: 'All Wave Deadlines' },
  { id: 'section-4', label: 'Technical Requirements' },
  { id: 'section-5', label: 'Odoo Modules' },
  { id: 'section-6', label: 'Cost Comparison' },
  { id: 'section-7', label: 'Implementation Roadmap' },
  { id: 'section-8', label: 'Partner Selection' },
  { id: 'section-9', label: 'FAQ' },
  { id: 'section-10', label: 'Summary & Sources' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'The Wave 24 Wake-Up Call' },
  { id: 'section-3', label: 'Full ZATCA Compliance Timeline' },
  { id: 'section-4', label: 'What Compliance Actually Requires' },
  { id: 'section-5', label: "Odoo's ZATCA-Ready Toolkit" },
  { id: 'section-6', label: 'Comply vs. Ignore: The Real Cost' },
  { id: 'section-7', label: 'Zero to Compliant: 90-Day Roadmap' },
  { id: 'section-8', label: 'Choosing an Odoo Partner in KSA' },
  { id: 'section-9', label: 'Frequently Asked Questions' },
  { id: 'section-10', label: 'Action Summary and Sources' },
];

export async function generateMetadata() {
  const t = await getTranslations('Articles.odooSaudiArabia');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: 'ZATCA Wave 24, Odoo ERP Saudi Arabia, e-invoicing Phase 2, Saudi SME compliance, ZATCA e-invoice integration, Odoo ZATCA module, Saudi ERP implementation',
  };
}

export default async function OdooSaudiArabiaPage() {
  const t = await getTranslations('Articles.odooSaudiArabia');

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section article-hero">
          <div className="article-hero__bg">
            <img src="/assets/articles/article-odoo-zatca-1.jpeg" alt={t('heroImageAlt')} />
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
              <span>
                <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                {t('heroDate')}
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
                <div className="author-avatar">NR</div>
                <div className="author-info">
                  <span className="author-name">{t('authorName')}</span>
                  <span className="author-meta">{t('authorMeta')}</span>
                  <span className="last-updated">{t('authorUpdated')}</span>
                </div>
              </div>

              {/* SECTION 2 — The Wave 24 Wake-Up Call */}
              <section id="section-2" className="fade-up article-section article-prose">
                <h2>{t('s2Title')}</h2>
                <p className="lead">{t('s2Lead')}</p>

                <div className="highlight-callout">
                  <div className="highlight-callout__number">{t('s2CalloutNumber')}</div>
                  <div className="highlight-callout__text">
                    <h4>{t('s2CalloutTitle')}</h4>
                    <p>{t('s2CalloutP1')}</p>
                    <p dangerouslySetInnerHTML={{ __html: t.raw('s2CalloutP2') }} />
                  </div>
                </div>

                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-odoo-zatca-2.jpeg" alt={t('s2ImageAlt')} />
                  <figcaption>{t('s2ImageCaption')}</figcaption>
                </figure>

                <p>{t('s2P1')}</p>
                <p>{t('s2P2')}</p>
              </section>

              {/* SECTION 3 — Full ZATCA Timeline */}
              <section id="section-3" className="fade-up article-section article-prose">
                <h2>{t('s3Title')}</h2>
                <p>{t('s3Intro')}</p>

                <div className="timeline-v3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="timeline-v3__item">
                      <div className="timeline-v3__dot" />
                      <span className="timeline-v3__date">{t(`s3Timeline${n}Date`)}</span>
                      <div className="timeline-v3__title">{t(`s3Timeline${n}Title`)}</div>
                      <div className="timeline-v3__desc">{t(`s3Timeline${n}Desc`)}</div>
                    </div>
                  ))}
                  <div className="timeline-v3__item timeline-v3__item--active">
                    <div className="timeline-v3__dot" />
                    <span className="timeline-v3__date">{t('s3Timeline6Date')}</span>
                    <div className="timeline-v3__title">{t('s3Timeline6Title')}</div>
                    <div className="timeline-v3__desc">{t('s3Timeline6Desc')}</div>
                  </div>
                  <div className="timeline-v3__item">
                    <div className="timeline-v3__dot" />
                    <span className="timeline-v3__date">{t('s3Timeline7Date')}</span>
                    <div className="timeline-v3__title">{t('s3Timeline7Title')}</div>
                    <div className="timeline-v3__desc">{t('s3Timeline7Desc')}</div>
                  </div>
                </div>

                <p>{t('s3Conclusion')}</p>
              </section>

              {/* SECTION 4 — Technical Requirements */}
              <section id="section-4" className="fade-up article-section article-prose">
                <h2>{t('s4Title')}</h2>
                <p>{t('s4Intro')}</p>

                <figure className="article-image article-image--supporting">
                  <img src="/assets/articles/article-odoo-zatca-3.jpeg" alt={t('s4ImageAlt')} />
                  <figcaption>{t('s4ImageCaption')}</figcaption>
                </figure>

                <div className="numbered-practices">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="numbered-practices__item">
                      <div className="numbered-practices__num" />
                      <div className="numbered-practices__content">
                        <h4>{t(`s4Req${n}Title`)}</h4>
                        <p>{t(`s4Req${n}Desc`)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="expert-callout">
                  <p>{t('s4CalloutText')}</p>
                  <cite>{t('s4CalloutCite')}</cite>
                </div>

                <p>{t('s4Conclusion')}</p>
              </section>

              {/* SECTION 5 — Odoo Modules */}
              <section id="section-5" className="fade-up article-section article-prose">
                <h2>{t('s5Title')}</h2>
                <p>{t('s5Intro')}</p>

                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-odoo-zatca-4.jpeg" alt={t('s5ImageAlt')} />
                  <figcaption>{t('s5ImageCaption')}</figcaption>
                </figure>

                <div className="service-cards">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="service-card">
                      <div className="service-card__icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0066ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      </div>
                      <h4>{t(`s5Card${n}Title`)}</h4>
                      <p>{t(`s5Card${n}Desc`)}</p>
                    </div>
                  ))}
                </div>

                <p>{t('s5Conclusion')}</p>
              </section>

              {/* SECTION 6 — Comply vs Ignore */}
              <section id="section-6" className="fade-up article-section article-prose">
                <h2>{t('s6Title')}</h2>
                <p>{t('s6Intro')}</p>

                <div className="before-after-grid">
                  <div className="ba-col ba-col--before">
                    <h4>{t('s6IgnoreTitle')}</h4>
                    <ul>
                      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                        <li key={n}>{t(`s6Ignore${n}`)}</li>
                      ))}
                    </ul>
                    <div className="ba-total">{t('s6IgnoreTotal')}</div>
                  </div>
                  <div className="ba-col ba-col--after">
                    <h4>{t('s6ComplyTitle')}</h4>
                    <ul>
                      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                        <li key={n}>{t(`s6Comply${n}`)}</li>
                      ))}
                    </ul>
                    <div className="ba-total">{t('s6ComplyTotal')}</div>
                  </div>
                </div>

                <p dangerouslySetInnerHTML={{ __html: t.raw('s6P1') }} />
                <p>{t('s6P2')}</p>
              </section>

              {/* SECTION 7 — 90-Day Roadmap */}
              <section id="section-7" className="fade-up article-section article-prose">
                <h2>{t('s7Title')}</h2>
                <p>{t('s7Intro')}</p>

                <figure className="article-image article-image--supporting">
                  <img src="/assets/articles/article-odoo-zatca-5.jpeg" alt={t('s7ImageAlt')} />
                  <figcaption>{t('s7ImageCaption')}</figcaption>
                </figure>

                <div className="process-flow">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="process-flow__step">
                      <span className="process-flow__badge">{t(`s7Phase${n}Badge`)}</span>
                      <h4>{t(`s7Phase${n}Title`)}</h4>
                      <ul>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <li key={i}>{t(`s7Phase${n}Item${i}`)}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <p>{t('s7Conclusion')}</p>
              </section>

              {/* SECTION 8 — Partner Selection */}
              <section id="section-8" className="fade-up article-section article-prose">
                <h2>{t('s8Title')}</h2>
                <p>{t('s8Intro')}</p>

                <div className="tip-cards">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="tip-card">
                      <div className="tip-card__icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0066ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                      </div>
                      <div>
                        <h4>{t(`s8Tip${n}Title`)}</h4>
                        <p>{t(`s8Tip${n}Desc`)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <p>{t('s8Conclusion')}</p>
              </section>

              {/* SECTION 9 — FAQ */}
              <section id="section-9" className="fade-up article-section article-prose">
                <h2>{t('s9Title')}</h2>

                <div className="faq-accordion">
                  <ArticleFaq items={[1, 2, 3, 4, 5, 6].map((n) => ({
                    question: t(`s9Faq${n}Q`),
                    answer: t(`s9Faq${n}A`),
                  }))} />
                </div>
              </section>

              {/* SECTION 10 — Summary */}
              <section id="section-10" className="fade-up article-section article-prose">
                <h2>{t('s10Title')}</h2>

                <div className="key-takeaways">
                  <h4>{t('keyTakeawaysLabel')}</h4>
                  <ul>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <li key={n}>{t(`s10Takeaway${n}`)}</li>
                    ))}
                  </ul>
                </div>

                <div className="summary-box">
                  <h4>{t('s10ChecklistTitle')}</h4>
                  <ul>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <li key={n}>{t(`s10Checklist${n}`)}</li>
                    ))}
                  </ul>
                </div>

                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => (
                      <li key={n}>{t(`s10Source${n}`)}</li>
                    ))}
                  </ol>
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
