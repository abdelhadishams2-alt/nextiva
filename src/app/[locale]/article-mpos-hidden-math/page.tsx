import { getTranslations } from 'next-intl/server';
import ReadingProgress from '@/components/ui/ReadingProgress';
import TOCSidebar from '@/components/ui/TOCSidebar';
import TOCInline from '@/components/ui/TOCInline';
import ShareButtons from '@/components/ui/ShareButtons';
import FadeUpObserver from '@/components/ui/FadeUpObserver';
import { Navbar } from '@/components/sections/Navbar';
import { CallToAction } from '@/components/sections/CallToAction';
import { Footer } from '@/components/sections/Footer';
import ArticleTabs from '@/components/ui/ArticleTabs';

const tocItems = [
  { id: 'section-2', label: 'The Fee Illusion' },
  { id: 'section-3', label: 'Hardware Costs Upfront' },
  { id: 'section-4', label: 'Monthly SaaS Fees' },
  { id: 'section-5', label: 'Interchange Markups' },
  { id: 'section-6', label: '3-Year Total Cost Comparison' },
  { id: 'section-7', label: 'Cheapest vs. Most Expensive' },
  { id: 'section-8', label: 'SoftPOS Disruption' },
  { id: 'section-9', label: 'Expert Perspectives' },
  { id: 'section-10', label: 'How to Choose' },
  { id: 'section-11', label: 'Final Takeaway' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'The Fee Illusion: Why Your POS Costs More Than You Think' },
  { id: 'section-3', label: 'Hardware: What You Pay Upfront' },
  { id: 'section-4', label: 'The SaaS Layer Nobody Reads' },
  { id: 'section-5', label: 'Interchange Markups Decoded' },
  { id: 'section-6', label: '3-Year Cost Showdown' },
  { id: 'section-7', label: 'The Cheapest Option Is the Expensive One' },
  { id: 'section-8', label: 'SoftPOS: The Variable Nobody Modeled' },
  { id: 'section-9', label: 'What the Experts Actually Say' },
  { id: 'section-10', label: 'Decision Framework' },
  { id: 'section-11', label: 'Final Calculation' },
];

export async function generateMetadata() {
  const t = await getTranslations('Articles.articleMposHiddenMath');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: 'mobile POS cost comparison, mPOS total cost of ownership, Square vs Clover vs Toast, payment terminal fees, SoftPOS, interchange markup, POS hardware pricing',
  };
}

export default async function ArticleMposHiddenMathPage() {
  const t = await getTranslations('Articles.articleMposHiddenMath');

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section article-hero">
          <div className="article-hero__bg">
            <img src="/assets/articles/article-mpos-hidden-math-1.webp" alt={t('heroImageAlt')} />
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

              {/* SECTION 2 — The Fee Illusion */}
              <section id="section-2" className="fade-up article-section article-prose">
                <h2>{t('s2Title')}</h2>
                <p className="lead">{t('s2Lead')}</p>
                <div className="highlight-box">
                  <span className="highlight-stat">{t('s2HighlightStat')}</span>
                  <p>{t('s2HighlightP1')}</p>
                  <p>{t('s2HighlightP2')}</p>
                </div>
                <p>{t('s2P1')}</p>
              </section>

              {/* SECTION 3 — Hardware Costs */}
              <section id="section-3" className="fade-up article-section article-prose">
                <h2>{t('s3Title')}</h2>
                <p>{t('s3Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-mpos-hidden-math-2.webp" alt={t('s3ImageAlt')} />
                  <figcaption>{t('s3ImageCaption')}</figcaption>
                </figure>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t('s3ColPlatform')}</th>
                        <th>{t('s3ColDevice')}</th>
                        <th>{t('s3ColCost')}</th>
                        <th>{t('s3ColForm')}</th>
                        <th>{t('s3ColFeature')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['squareReader', 'squareTerminal', 'sumup', 'shopify', 'clover', 'toast'] as const).map((key) => (
                        <tr key={key}>
                          <td><strong>{t(`s3Row_${key}_platform`)}</strong></td>
                          <td>{t(`s3Row_${key}_device`)}</td>
                          <td>{t(`s3Row_${key}_cost`)}</td>
                          <td>{t(`s3Row_${key}_form`)}</td>
                          <td>{t(`s3Row_${key}_feature`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>{t('s3Conclusion')}</p>
              </section>

              {/* SECTION 4 — SaaS Fees */}
              <section id="section-4" className="fade-up article-section article-prose">
                <h2>{t('s4Title')}</h2>
                <p>{t('s4Intro')}</p>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t('s4ColPlatform')}</th>
                        <th>{t('s4ColMonthly')}</th>
                        <th>{t('s4Col12')}</th>
                        <th>{t('s4Col24')}</th>
                        <th>{t('s4Col36')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['square', 'sumup', 'clover', 'shopify', 'toast'] as const).map((key) => (
                        <tr key={key}>
                          <td className="td-highlight">{t(`s4Row_${key}_platform`)}</td>
                          <td>{t(`s4Row_${key}_monthly`)}</td>
                          <td>{t(`s4Row_${key}_12`)}</td>
                          <td>{t(`s4Row_${key}_24`)}</td>
                          <td><strong>{t(`s4Row_${key}_36`)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>{t('s4P1')}</p>
                <p>{t('s4P2')}</p>
              </section>

              {/* SECTION 5 — Interchange Markups */}
              <section id="section-5" className="fade-up article-section article-prose">
                <h2>{t('s5Title')}</h2>
                <p>{t('s5Intro')}</p>
                <div className="definition-list">
                  {(['interchange', 'assessment', 'markup', 'fixedFee', 'tokenization'] as const).map((key) => (
                    <div key={key} className="definition-item">
                      <div className="definition-term">
                        {t(`s5Def_${key}_term`)}
                        <span className="def-badge">{t(`s5Def_${key}_badge`)}</span>
                      </div>
                      <p className="definition-desc">{t(`s5Def_${key}_desc`)}</p>
                    </div>
                  ))}
                </div>
                <div className="expert-callout">
                  <p>{t('s5ExpertQuote')}</p>
                  <cite>{t('s5ExpertCite')}</cite>
                </div>
              </section>

              {/* SECTION 6 — 3-Year TCO */}
              <section id="section-6" className="fade-up article-section article-prose">
                <h2>{t('s6Title')}</h2>
                <p>{t('s6Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-mpos-hidden-math-3.webp" alt={t('s6ImageAlt')} />
                  <figcaption>{t('s6ImageCaption')}</figcaption>
                </figure>
                <ArticleTabs tabs={(['sumup', 'shopify', 'clover', 'square', 'toast'] as const).map((key) => ({
                  id: `tab-${key}`,
                  label: t(`s6_${key}_platform`),
                  content: (
                    <div className="tco-card">
                      <div className="tco-header">
                        <span className="tco-platform">{t(`s6_${key}_platform`)}</span>
                        <span className="tco-total">{t(`s6_${key}_totalValue`)}<small>{t('s6TotalSuffix')}</small></span>
                      </div>
                      <div className="tco-breakdown">
                        <div className="tco-item">
                          <div className="tco-item-label">{t('s6HwLabel')}</div>
                          <div className="tco-item-value">{t(`s6_${key}_hwValue`)}</div>
                          <div className="tco-item-detail">{t(`s6_${key}_hwDetail`)}</div>
                        </div>
                        <div className="tco-item">
                          <div className="tco-item-label">{t('s6SaasLabel')}</div>
                          <div className="tco-item-value">{t(`s6_${key}_saasValue`)}</div>
                          <div className="tco-item-detail">{t(`s6_${key}_saasDetail`)}</div>
                        </div>
                        <div className="tco-item">
                          <div className="tco-item-label">{t('s6TxLabel')}</div>
                          <div className="tco-item-value">{t(`s6_${key}_txValue`)}</div>
                          <div className="tco-item-detail">{t(`s6_${key}_txDetail`)}</div>
                        </div>
                      </div>
                      <div className="tco-note" dangerouslySetInnerHTML={{ __html: t.raw(`s6_${key}_note`) }} />
                    </div>
                  ),
                }))} />
                <div className="sources-block">
                  <h4>{t('s6SourcesTitle')}</h4>
                  <ol>
                    <li>{t('s6Source1')}</li>
                    <li>{t('s6Source2')}</li>
                    <li>{t('s6Source3')}</li>
                  </ol>
                </div>
              </section>

              {/* SECTION 7 — Cost Reversal */}
              <section id="section-7" className="fade-up article-section article-prose">
                <h2>{t('s7Title')}</h2>
                <p>{t('s7Intro')}</p>
                <div className="pros-cons-grid">
                  <div className="pros-col">
                    <h4>{t('s7ProLabel')}</h4>
                    <ul>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <li key={n} dangerouslySetInnerHTML={{ __html: t.raw(`s7Pro${n}`) }} />
                      ))}
                    </ul>
                  </div>
                  <div className="cons-col">
                    <h4>{t('s7ConLabel')}</h4>
                    <ul>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <li key={n} dangerouslySetInnerHTML={{ __html: t.raw(`s7Con${n}`) }} />
                      ))}
                    </ul>
                  </div>
                </div>
                <p>{t('s7Conclusion')}</p>
              </section>

              {/* SECTION 8 — SoftPOS */}
              <section id="section-8" className="fade-up article-section article-prose">
                <h2>{t('s8Title')}</h2>
                <p>{t('s8Intro')}</p>
                <figure className="article-image article-image--atmospheric">
                  <img src="/assets/articles/article-mpos-hidden-math-4.webp" alt={t('s8ImageAlt')} />
                  <figcaption>{t('s8ImageCaption')}</figcaption>
                </figure>
                <div className="feature-grid">
                  {[
                    <svg key="i1" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0066ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>,
                    <svg key="i2" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0066ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
                    <svg key="i3" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0066ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
                    <svg key="i4" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0066ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
                    <svg key="i5" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0066ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>,
                    <svg key="i6" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0066ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
                  ].map((icon, i) => (
                    <div key={i} className="feature-card">
                      <div className="feature-icon">{icon}</div>
                      <h4>{t(`s8Feature${i + 1}Title`)}</h4>
                      <p>{t(`s8Feature${i + 1}Desc`)}</p>
                    </div>
                  ))}
                </div>
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

              {/* SECTION 9 — Expert Quotes */}
              <section id="section-9" className="fade-up article-section article-prose">
                <h2>{t('s9Title')}</h2>
                <p>{t('s9Intro')}</p>
                <div className="testimonial-grid">
                  <div className="testimonial-card">
                    <blockquote>{t('s9Quote1')}</blockquote>
                    <cite>{t('s9Cite1')}<span className="cite-role">{t('s9CiteRole1')}</span></cite>
                  </div>
                  <div className="testimonial-card">
                    <blockquote>{t('s9Quote2')}</blockquote>
                    <cite>{t('s9Cite2')}<span className="cite-role">{t('s9CiteRole2')}</span></cite>
                  </div>
                </div>
                <p>{t('s9P1')}</p>
                <p>{t('s9P2')}</p>
              </section>

              {/* SECTION 10 — Decision Framework */}
              <section id="section-10" className="fade-up article-section article-prose">
                <h2>{t('s10Title')}</h2>
                <p>{t('s10Intro')}</p>
                <div className="key-takeaways">
                  <h4>{t('s10TakeawaysTitle')}</h4>
                  <ul>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <li key={n}>{t(`s10Takeaway${n}`)}</li>
                    ))}
                  </ul>
                </div>
                <ul className="checklist">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <li key={n}>
                      <span className="check-icon"><svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></span>
                      <span dangerouslySetInnerHTML={{ __html: t.raw(`s10Check${n}`) }} />
                    </li>
                  ))}
                </ul>
              </section>

              {/* SECTION 11 — Final Calculation */}
              <section id="section-11" className="fade-up article-section article-prose">
                <h2>{t('s11Title')}</h2>
                <p>{t('s11P1')}</p>
                <p>{t('s11P2')}</p>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-mpos-hidden-math-5.webp" alt={t('s11ImageAlt')} />
                  <figcaption>{t('s11ImageCaption')}</figcaption>
                </figure>
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
