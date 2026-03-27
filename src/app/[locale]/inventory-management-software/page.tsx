import { getTranslations } from 'next-intl/server';
import ReadingProgress from '@/components/ui/ReadingProgress';
import TOCSidebar from '@/components/ui/TOCSidebar';
import TOCInline from '@/components/ui/TOCInline';
import ShareButtons from '@/components/ui/ShareButtons';
import FadeUpObserver from '@/components/ui/FadeUpObserver';
import { Navbar } from '@/components/sections/Navbar';
import { CallToAction } from '@/components/sections/CallToAction';
import { Footer } from '@/components/sections/Footer';
import ArticleAccordionFaq from '@/components/ui/ArticleAccordionFaq';

const tocItems = [
  { id: 'section-2', label: 'The AI Inventory Boom' },
  { id: 'section-3', label: 'Proven ROI Data' },
  { id: 'section-4', label: 'What Actually Works' },
  { id: 'section-5', label: 'Hype vs. Reality' },
  { id: 'section-6', label: 'Data Prerequisites' },
  { id: 'section-7', label: 'Adoption Breakdown' },
  { id: 'section-8', label: 'Case Study Evidence' },
  { id: 'section-9', label: 'Before You Sign' },
  { id: 'section-10', label: 'FAQ' },
  { id: 'section-11', label: 'Final Verdict' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'The $9.6B Question' },
  { id: 'section-3', label: 'The Numbers That Actually Hold Up' },
  { id: 'section-4', label: 'Three Capabilities Delivering Real ROI' },
  { id: 'section-5', label: "What's Still Marketing Hype" },
  { id: 'section-6', label: 'The Data Hygiene Problem Nobody Mentions' },
  { id: 'section-7', label: 'Market Adoption: Where the Money Goes' },
  { id: 'section-8', label: 'Real-World Results: Two Companies, Two Outcomes' },
  { id: 'section-9', label: "The Buyer's Reality Check" },
  { id: 'section-10', label: 'Common Questions About AI Forecasting' },
  { id: 'section-11', label: 'The Bottom Line' },
];

export async function generateMetadata() {
  const t = await getTranslations('Articles.inventoryManagementSoftware');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: 'AI inventory forecasting, inventory management software, demand sensing, automated reorder, inventory optimization, AI warehouse management, supply chain AI',
  };
}

export default async function InventoryManagementSoftwarePage() {
  const t = await getTranslations('Articles.inventoryManagementSoftware');

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section article-hero">
          <div className="article-hero__bg">
            <img src="/assets/articles/article-ai-inventory-hero.webp" alt={t('heroImageAlt')} />
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

              {/* SECTION 2 — The $9.6B Question */}
              <section id="section-2" className="fade-up article-section">
                <h2>{t('s2Title')}</h2>
                <div className="lead-drop-cap">
                  <p>{t('s2P1')}</p>
                  <p>{t('s2P2')}</p>
                  <p>{t('s2P3')}</p>
                </div>
                <div className="source-citations">
                  <strong>{t('sourcesLabel')}</strong>
                  {' '}{t('s2Sources')}
                </div>
              </section>

              {/* SECTION 3 — The Numbers That Actually Hold Up */}
              <section id="section-3" className="fade-up article-section">
                <h2>{t('s3Title')}</h2>
                <p>{t('s3Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-ai-inventory-dashboard.webp" alt={t('s3ImageAlt')} />
                  <figcaption>{t('s3ImageCaption')}</figcaption>
                </figure>
                <div className="bar-chart">
                  {[
                    { label: t('s3Bar1Label'), value: t('s3Bar1Value'), width: '15%' },
                    { label: t('s3Bar2Label'), value: t('s3Bar2Value'), width: '20%' },
                    { label: t('s3Bar3Label'), value: t('s3Bar3Value'), width: '35%' },
                    { label: t('s3Bar4Label'), value: t('s3Bar4Value'), width: '62%' },
                    { label: t('s3Bar5Label'), value: t('s3Bar5Value'), width: '35%' },
                  ].map((bar) => (
                    <div key={bar.label} className="bar-chart__row">
                      <span className="bar-chart__label">{bar.label}</span>
                      <div className="bar-chart__track"><div className="bar-chart__fill" style={{ width: bar.width }} /></div>
                      <span className="bar-chart__value">{bar.value}</span>
                    </div>
                  ))}
                </div>
                <p>{t('s3P1')}</p>
                <p>{t('s3P2')}</p>
                <div className="source-citations">
                  <strong>{t('sourcesLabel')}</strong>
                  {' '}{t('s3Sources')}
                </div>
              </section>

              {/* SECTION 4 — Three Capabilities Delivering Real ROI */}
              <section id="section-4" className="fade-up article-section">
                <h2>{t('s4Title')}</h2>
                <p>{t('s4Intro')}</p>
                <div className="case-study-cards">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="case-study-card">
                      <div className="case-study-card__header">
                        <span className="case-study-card__name">{t(`s4Cap${n}Name`)}</span>
                        <span className="case-study-card__tag">{t('s4CapTag')}</span>
                      </div>
                      <div className="case-study-card__body">
                        <h5>{t('s4WhatLabel')}</h5>
                        <p>{t(`s4Cap${n}What`)}</p>
                        <h5>{t('s4WhyLabel')}</h5>
                        <p>{t(`s4Cap${n}Why`)}</p>
                      </div>
                      <div className="case-study-card__results">
                        <div className="case-study-card__metric">
                          <div className="case-study-card__metric-value">{t(`s4Cap${n}Metric1Value`)}</div>
                          <div className="case-study-card__metric-label">{t(`s4Cap${n}Metric1Label`)}</div>
                        </div>
                        <div className="case-study-card__metric">
                          <div className="case-study-card__metric-value">{t(`s4Cap${n}Metric2Value`)}</div>
                          <div className="case-study-card__metric-label">{t(`s4Cap${n}Metric2Label`)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="expert-quote">
                  <p>{t('s4Quote')}</p>
                  <cite>{t('s4QuoteCite')}</cite>
                </div>
              </section>

              {/* SECTION 5 — What's Still Marketing Hype */}
              <section id="section-5" className="fade-up article-section">
                <h2>{t('s5Title')}</h2>
                <p>{t('s5Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-ai-inventory-hype-reality.webp" alt={t('s5ImageAlt')} />
                  <figcaption>{t('s5ImageCaption')}</figcaption>
                </figure>
                <div className="capability-grid">
                  <div className="capability-card capability-card--works">
                    <h4>{t('s5WorksTitle')} <span className="capability-card__status">{t('s5WorksStatus')}</span></h4>
                    <ul>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <li key={n}>{t(`s5Works${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="capability-card capability-card--hype">
                    <h4>{t('s5HypeTitle')} <span className="capability-card__status">{t('s5HypeStatus')}</span></h4>
                    <ul>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <li key={n}>{t(`s5Hype${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p>{t('s5Conclusion')}</p>
                <div className="source-citations">
                  <strong>{t('sourcesLabel')}</strong>
                  {' '}{t('s5Sources')}
                </div>
              </section>

              {/* SECTION 6 — The Data Hygiene Problem */}
              <section id="section-6" className="fade-up article-section">
                <h2>{t('s6Title')}</h2>
                <p>{t('s6Intro')}</p>
                <div className="expert-quote">
                  <p>{t('s6Quote')}</p>
                  <cite>{t('s6QuoteCite')}</cite>
                </div>
                <div className="tip-cards">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="tip-card">
                      <div className="tip-card__number">{n}</div>
                      <h4>{t(`s6Tip${n}Title`)}</h4>
                      <p>{t(`s6Tip${n}Desc`)}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 7 — Market Adoption */}
              <section id="section-7" className="fade-up article-section">
                <h2>{t('s7Title')}</h2>
                <p>{t('s7Intro')}</p>
                <figure className="article-image article-image--atmospheric">
                  <img src="/assets/articles/article-ai-inventory-network.webp" alt={t('s7ImageAlt')} />
                  <figcaption>{t('s7ImageCaption')}</figcaption>
                </figure>
                <div className="donut-grid">
                  {[
                    { pct: '62%', desc: t('s7Donut1Desc'), offset: '119.38' },
                    { pct: '35%', desc: t('s7Donut2Desc'), offset: '204.20', stroke: 'var(--secondary)' },
                    { pct: '43%', desc: t('s7Donut3Desc'), offset: '178.97', stroke: 'var(--primary-hover)' },
                  ].map((d) => (
                    <div key={d.desc} className="donut-item">
                      <svg viewBox="0 0 120 120">
                        <circle className="donut-bg" cx="60" cy="60" r="50" />
                        <circle className="donut-fill" cx="60" cy="60" r="50" strokeDasharray="314.16" strokeDashoffset={d.offset} style={d.stroke ? { stroke: d.stroke } : undefined} />
                      </svg>
                      <div className="donut-item__label">{d.pct}</div>
                      <div className="donut-item__desc">{d.desc}</div>
                    </div>
                  ))}
                </div>
                <p>{t('s7P1')}</p>
                <div className="source-citations">
                  <strong>{t('sourcesLabel')}</strong>
                  {' '}{t('s7Sources')}
                </div>
              </section>

              {/* SECTION 8 — Real-World Results */}
              <section id="section-8" className="fade-up article-section">
                <h2>{t('s8Title')}</h2>
                <p>{t('s8Intro')}</p>
                <div className="image-callout">
                  <img src="/assets/articles/article-ai-inventory-contrast.webp" alt={t('s8ImageAlt')} />
                  <div className="image-callout__box">
                    <h4>{t('s8CalloutTitle')}</h4>
                    <p>{t('s8CalloutDesc')}</p>
                  </div>
                </div>
                <h3>{t('s8CompanyATitle')}</h3>
                <p>{t('s8CompanyAP1')}</p>
                <p>{t('s8CompanyAP2')}</p>
                <h3>{t('s8CompanyBTitle')}</h3>
                <p>{t('s8CompanyBP1')}</p>
                <p>{t('s8CompanyBP2')}</p>
              </section>

              {/* SECTION 9 — The Buyer's Reality Check */}
              <section id="section-9" className="fade-up article-section">
                <h2>{t('s9Title')}</h2>
                <p>{t('s9Intro')}</p>
                <div className="action-panel">
                  <h4>{t('s9PanelTitle')}</h4>
                  <ul className="action-list">
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <li key={n}>
                        <span className={`action-dot action-dot--${n <= 3 ? 'high' : n <= 5 ? 'med' : 'low'}`} />
                        <div dangerouslySetInnerHTML={{ __html: t.raw(`s9Action${n}`) }} />
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* SECTION 10 — FAQ */}
              <section id="section-10" className="fade-up article-section">
                <h2>{t('s10Title')}</h2>
                <ArticleAccordionFaq items={[1, 2, 3, 4, 5].map((n) => ({
                  question: t(`s10Faq${n}Q`),
                  answer: t(`s10Faq${n}A`),
                }))} />
              </section>

              {/* SECTION 11 — The Bottom Line */}
              <section id="section-11" className="fade-up article-section">
                <h2>{t('s11Title')}</h2>
                <p>{t('s11Intro')}</p>
                <div className="summary-box">
                  <h3>{t('s11BoxTitle')}</h3>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="summary-item">
                      <span className="summary-bullet" />
                      <div dangerouslySetInnerHTML={{ __html: t.raw(`s11Takeaway${n}`) }} />
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: '24px' }}>{t('s11Conclusion')}</p>
                <div className="last-updated">{t('s11LastUpdated')}</div>
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
