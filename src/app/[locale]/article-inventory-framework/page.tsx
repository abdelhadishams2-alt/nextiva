import { Fragment } from 'react';
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
  { id: 'section-2', label: 'The Profit Crisis' },
  { id: 'section-3', label: 'Four-Pillar Framework' },
  { id: 'section-4', label: 'Pillar 1: Visibility' },
  { id: 'section-5', label: 'Pillar 2: Velocity' },
  { id: 'section-6', label: 'Pillar 3: Variance' },
  { id: 'section-7', label: 'Pillar 4: Value' },
  { id: 'section-8', label: 'Technology Selection' },
  { id: 'section-9', label: '30-Day Roadmap' },
  { id: 'section-10', label: 'Common Pitfalls' },
  { id: 'section-11', label: 'Key Takeaways' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'The Profit Crisis Hiding in Your Walk-In' },
  { id: 'section-3', label: 'Introducing the Four-Pillar Framework' },
  { id: 'section-4', label: 'Pillar 1: Visibility -- Know What You Have' },
  { id: 'section-5', label: 'Pillar 2: Velocity -- How Fast It Moves' },
  { id: 'section-6', label: 'Pillar 3: Variance -- Theoretical vs. Actual' },
  { id: 'section-7', label: 'Pillar 4: Value -- Inventory as Profit Lever' },
  { id: 'section-8', label: 'Choosing the Right Technology Stack' },
  { id: 'section-9', label: 'Your 30-Day Implementation Roadmap' },
  { id: 'section-10', label: 'The Human Factor: Where Systems Fail' },
  { id: 'section-11', label: 'Framework at a Glance' },
];

export async function generateMetadata() {
  const t = await getTranslations('Articles.articleInventoryFramework');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: 'restaurant inventory management, food cost control, inventory framework, restaurant profit margins, food waste reduction, inventory technology, supply chain optimization',
  };
}

export default async function ArticleInventoryFrameworkPage() {
  const t = await getTranslations('Articles.articleInventoryFramework');

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section">
          <div className="hero-outer">
            <div className="hero-inner">
              <img className="hero-bg" src="/assets/articles/article-inventory-framework-1.webp" alt={t('heroImageAlt')} />
              <div className="hero-overlay" />
              <div className="hero-content">
                <span className="hero-tag">{t('heroBadge')}</span>
                <h1>{t('heroTitle')}</h1>
                <div className="hero-meta">
                  <span className="hero-meta-item">
                    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    {t('heroReadTime')}
                  </span>
                  <span className="hero-meta-item">
                    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    {t('heroDate')}
                  </span>
                </div>
              </div>
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
                <div className="author-avatar">RC</div>
                <div className="author-info">
                  <span className="author-name">{t('authorName')}</span>
                  <span className="author-meta">{t('authorMeta')}</span>
                </div>
              </div>

              {/* SECTION 2 — KPI Row */}
              <section id="section-2" className="fade-up article-section article-prose">
                <h2>{t('s2Title')}</h2>
                <p className="lead">{t('s2Lead')}</p>

                <div className="kpi-row">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="kpi-card">
                      <div className="kpi-value">{t(`s2Kpi${n}Value`)}</div>
                      <div className="kpi-label">{t(`s2Kpi${n}Label`)}</div>
                      <div className="kpi-desc">{t(`s2Kpi${n}Desc`)}</div>
                    </div>
                  ))}
                </div>

                <p>{t('s2Conclusion')}</p>
              </section>

              {/* SECTION 3 — Four-Pillar Framework */}
              <section id="section-3" className="fade-up article-section article-prose">
                <h2>{t('s3Title')}</h2>
                <p>{t('s3P1')}</p>
                <p>{t('s3P2')}</p>

                <div className="circular-process">
                  {[1, 2, 3, 4].map((n, i) => (
                    <Fragment key={n}>
                      <div className="process-node">
                        <span className="process-node-num">{n}</span>
                        <span className="process-node-title">{t(`s3Node${n}Title`)}</span>
                        <span className="process-node-sub">{t(`s3Node${n}Sub`)}</span>
                      </div>
                      {i < 3 && <span className="process-arrow">&rarr;</span>}
                    </Fragment>
                  ))}
                </div>

                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-inventory-framework-2.webp" alt={t('s3ImageAlt')} />
                  <figcaption>{t('s3ImageCaption')}</figcaption>
                </figure>

                <p>{t('s3P3')}</p>
              </section>

              {/* SECTION 4 — Pillar 1: Visibility */}
              <section id="section-4" className="fade-up article-section article-prose">
                <h2>{t('s4Title')}</h2>

                <div className="chapter-intro">
                  <span className="chapter-num">01</span>
                  <div className="chapter-body">
                    <p>{t('s4ChapterP1')}</p>
                    <p>{t('s4ChapterP2')}</p>
                  </div>
                </div>

                <div className="expert-callout">
                  <p>{t('s4CalloutText')}</p>
                  <cite>{t('s4CalloutCite')}</cite>
                </div>

                <h3>{t('s4SubTitle')}</h3>
                <p>{t('s4P1')}</p>
                <p>{t('s4P2')}</p>
              </section>

              {/* SECTION 5 — Pillar 2: Velocity */}
              <section id="section-5" className="fade-up article-section article-prose">
                <h2>{t('s5Title')}</h2>
                <p>{t('s5Intro')}</p>

                <div className="donut-row">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="donut-card">
                      <div className="donut-ring" style={{ background: t.raw(`s5Donut${n}Gradient`) }}>
                        <div className="donut-ring-inner"><span>{t(`s5Donut${n}Value`)}</span></div>
                      </div>
                      <div className="donut-label">{t(`s5Donut${n}Label`)}</div>
                      <div className="donut-desc">{t(`s5Donut${n}Desc`)}</div>
                    </div>
                  ))}
                </div>

                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-inventory-framework-3.webp" alt={t('s5ImageAlt')} />
                  <figcaption>{t('s5ImageCaption')}</figcaption>
                </figure>

                <h3>{t('s5SubTitle')}</h3>
                <p>{t('s5P1')}</p>
                <p>{t('s5P2')}</p>
              </section>

              {/* SECTION 6 — Pillar 3: Variance */}
              <section id="section-6" className="fade-up article-section article-prose">
                <h2>{t('s6Title')}</h2>

                <div className="side-annotation-layout">
                  <div className="side-annotation-main">
                    <p>{t('s6P1')}</p>
                    <p>{t('s6P2')}</p>
                    <p>{t('s6P3')}</p>

                    <div className="expert-callout">
                      <p>{t('s6CalloutText')}</p>
                      <cite>{t('s6CalloutCite')}</cite>
                    </div>

                    <h3>{t('s6SubTitle')}</h3>
                    <p>{t('s6P4')}</p>
                  </div>

                  <div className="side-annotations">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="annotation-card">
                        <div className="annotation-label">{t(`s6Annotation${n}Label`)}</div>
                        <div className="annotation-formula">{t(`s6Annotation${n}Formula`)}</div>
                        <div className="annotation-note">{t(`s6Annotation${n}Note`)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* SECTION 7 — Pillar 4: Value */}
              <section id="section-7" className="fade-up article-section article-prose">
                <h2>{t('s7Title')}</h2>

                <figure className="article-image article-image--atmospheric">
                  <img src="/assets/articles/article-inventory-framework-4.webp" alt={t('s7ImageAlt')} />
                  <figcaption>{t('s7ImageCaption')}</figcaption>
                </figure>

                <div className="editorial-two-col">
                  <div className="editorial-col">
                    <p>{t('s7Col1P1')}</p>
                    <p>{t('s7Col1P2')}</p>
                  </div>
                  <div className="editorial-col">
                    <p>{t('s7Col2P1')}</p>
                    <p>{t('s7Col2P2')}</p>
                  </div>
                </div>
              </section>

              {/* SECTION 8 — Technology Selection */}
              <section id="section-8" className="fade-up article-section article-prose">
                <h2>{t('s8Title')}</h2>
                <p>{t('s8Intro')}</p>

                <div className="red-flags-grid">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="red-flag-card">
                      <div className="red-flag-icon">&#9888;</div>
                      <div className="red-flag-content">
                        <h4>{t(`s8Flag${n}Title`)}</h4>
                        <p>{t(`s8Flag${n}Desc`)}</p>
                      </div>
                    </div>
                  ))}
                  {[5, 6].map((n) => (
                    <div key={n} className="red-flag-card">
                      <div className="red-flag-icon green-flag-icon">&#10003;</div>
                      <div className="red-flag-content">
                        <h4>{t(`s8Flag${n}Title`)}</h4>
                        <p>{t(`s8Flag${n}Desc`)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <p>{t('s8Conclusion')}</p>
              </section>

              {/* SECTION 9 — 30-Day Roadmap */}
              <section id="section-9" className="fade-up article-section article-prose">
                <h2>{t('s9Title')}</h2>
                <p>{t('s9Intro')}</p>

                <figure className="article-image article-image--supporting">
                  <img src="/assets/articles/article-inventory-framework-5.webp" alt={t('s9ImageAlt')} />
                  <figcaption>{t('s9ImageCaption')}</figcaption>
                </figure>

                <div className="gantt-timeline">
                  <div className="gantt-header">
                    <div className="gantt-header-cell">{t('s9GanttTask')}</div>
                    <div className="gantt-header-cell">{t('s9GanttWeek1')}</div>
                    <div className="gantt-header-cell">{t('s9GanttWeek2')}</div>
                    <div className="gantt-header-cell">{t('s9GanttWeek3')}</div>
                    <div className="gantt-header-cell">{t('s9GanttWeek4')}</div>
                  </div>
                  <div className="gantt-row">
                    <div className="gantt-task">{t('s9Task1')}</div>
                    <div className="gantt-cell"><div className="gantt-bar">Full</div></div>
                    <div className="gantt-cell" /><div className="gantt-cell" /><div className="gantt-cell" />
                  </div>
                  <div className="gantt-row">
                    <div className="gantt-task">{t('s9Task2')}</div>
                    <div className="gantt-cell"><div className="gantt-bar--light" style={{ height: '24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600 }}>Eval</div></div>
                    <div className="gantt-cell"><div className="gantt-bar">Setup</div></div>
                    <div className="gantt-cell" /><div className="gantt-cell" />
                  </div>
                  <div className="gantt-row">
                    <div className="gantt-task">{t('s9Task3')}</div>
                    <div className="gantt-cell" />
                    <div className="gantt-cell"><div className="gantt-bar">Full</div></div>
                    <div className="gantt-cell" /><div className="gantt-cell" />
                  </div>
                  <div className="gantt-row">
                    <div className="gantt-task">{t('s9Task4')}</div>
                    <div className="gantt-cell" /><div className="gantt-cell" />
                    <div className="gantt-cell"><div className="gantt-bar">Full</div></div>
                    <div className="gantt-cell" />
                  </div>
                  <div className="gantt-row">
                    <div className="gantt-task">{t('s9Task5')}</div>
                    <div className="gantt-cell" /><div className="gantt-cell" />
                    <div className="gantt-cell"><div className="gantt-bar--light" style={{ height: '24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600 }}>Start</div></div>
                    <div className="gantt-cell"><div className="gantt-bar">Full</div></div>
                  </div>
                  <div className="gantt-row">
                    <div className="gantt-task">{t('s9Task6')}</div>
                    <div className="gantt-cell" /><div className="gantt-cell" /><div className="gantt-cell" />
                    <div className="gantt-cell"><div className="gantt-bar">Review</div></div>
                  </div>
                  <div className="gantt-row">
                    <div className="gantt-task">{t('s9Task7')}</div>
                    <div className="gantt-cell" /><div className="gantt-cell" /><div className="gantt-cell" />
                    <div className="gantt-cell"><div className="gantt-bar--light" style={{ height: '24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600 }}>Begin</div></div>
                  </div>
                </div>

                <p dangerouslySetInnerHTML={{ __html: t.raw('s9Week1') }} />
                <p dangerouslySetInnerHTML={{ __html: t.raw('s9Week2') }} />
                <p dangerouslySetInnerHTML={{ __html: t.raw('s9Week3') }} />
                <p dangerouslySetInnerHTML={{ __html: t.raw('s9Week4') }} />
              </section>

              {/* SECTION 10 — Human Factor */}
              <section id="section-10" className="fade-up article-section article-prose">
                <h2>{t('s10Title')}</h2>
                <p>{t('s10Intro')}</p>

                <div className="numbered-list">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="numbered-item">
                      <span className="numbered-item-num">{String(n).padStart(2, '0')}</span>
                      <div className="numbered-item-content">
                        <h4>{t(`s10Item${n}Title`)}</h4>
                        <p>{t(`s10Item${n}Desc`)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="expert-callout">
                  <p>{t('s10CalloutText')}</p>
                  <cite>{t('s10CalloutCite')}</cite>
                </div>
              </section>

              {/* SECTION 11 — Key Takeaways */}
              <section id="section-11" className="fade-up article-section article-prose">
                <h2>{t('s11Title')}</h2>
                <p>{t('s11Intro')}</p>

                <div className="key-takeaways">
                  <h4>{t('keyTakeawaysLabel')}</h4>
                  <ul>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <li key={n} dangerouslySetInnerHTML={{ __html: t.raw(`s11Takeaway${n}`) }} />
                    ))}
                  </ul>
                </div>

                <p>{t('s11Conclusion')}</p>

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
