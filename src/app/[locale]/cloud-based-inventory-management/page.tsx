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
  { id: 'section-2', label: 'The Uncomfortable Truth' },
  { id: 'section-3', label: 'Where Breaches Come From' },
  { id: 'section-4', label: 'Cloud vs On-Prem Security' },
  { id: 'section-5', label: '7 Misconfiguration Patterns' },
  { id: 'section-6', label: 'Shared Responsibility Gap' },
  { id: 'section-7', label: 'What Vendors Do Better' },
  { id: 'section-8', label: 'Security Posture Shift' },
  { id: 'section-9', label: 'Case Study' },
  { id: 'section-10', label: 'Security Playbook' },
  { id: 'section-11', label: 'Bottom Line' },
  { id: 'section-12', label: 'Next Steps' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'The Uncomfortable Truth About Cloud Breaches' },
  { id: 'section-3', label: 'Where Breaches Actually Come From' },
  { id: 'section-4', label: 'Cloud vs On-Premise: The Security Scorecard' },
  { id: 'section-5', label: 'The 7 Misconfiguration Patterns That Cause 99% of Failures' },
  { id: 'section-6', label: 'Warning: The Shared Responsibility Blind Spot' },
  { id: 'section-7', label: 'What Your Vendor Already Does Better' },
  { id: 'section-8', label: 'Before and After: Security Posture Shift' },
  { id: 'section-9', label: 'How One Mid-Market Distributor Fixed Everything' },
  { id: 'section-10', label: 'Your 6-Step Cloud Security Configuration Playbook' },
  { id: 'section-11', label: 'The Bottom Line on Cloud Inventory Security' },
  { id: 'section-12', label: 'Security-First Cloud Migration' },
];

export async function generateMetadata() {
  const t = await getTranslations('Articles.cloudBasedInventoryManagement');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: 'cloud inventory security, SaaS inventory management, cloud breaches, shared responsibility model, inventory software security, cloud misconfigurations, warehouse management security',
  };
}

export default async function CloudBasedInventoryManagementPage() {
  const t = await getTranslations('Articles.cloudBasedInventoryManagement');

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section article-hero">
          <div className="article-hero__bg">
            <img src="/assets/articles/article-cloud-security-1.webp" alt={t('heroImageAlt')} />
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
                <span className="reading-time" style={{ marginLeft: 'auto' }}>
                  <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  {t('heroReadTime')}
                </span>
              </div>

              {/* SECTION 2 — Introduction */}
              <section id="section-2" className="fade-up article-section article-prose section-heading">
                <h2>{t('s2Title')}</h2>
                <p className="lead">{t('s2Lead')}</p>
                <p>{t('s2P1')}</p>
                <p>{t('s2P2')}</p>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    <li>{t('s2Source1')}</li>
                    <li>{t('s2Source2')}</li>
                    <li>{t('s2Source3')}</li>
                  </ol>
                </div>
              </section>

              {/* SECTION 3 — Pie Chart */}
              <section id="section-3" className="fade-up article-section">
                <h2>{t('s3Title')}</h2>
                <p>{t('s3Intro')}</p>
                <div className="pie-chart-container">
                  <svg className="pie-chart-svg" width="220" height="220" viewBox="0 0 220 220" aria-label={t('s3ChartAria')}>
                    <circle cx="110" cy="110" r="80" fill="none" stroke="var(--border)" strokeWidth="40" opacity="0.15" />
                    <circle cx="110" cy="110" r="80" stroke="#0062b8" strokeWidth="40" strokeDasharray="271.4 502.65" strokeDashoffset="0" style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
                    <circle cx="110" cy="110" r="80" stroke="#0b4fd9" strokeWidth="40" strokeDasharray="110.6 502.65" strokeDashoffset="-271.4" style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
                    <circle cx="110" cy="110" r="80" stroke="#06f" strokeWidth="40" strokeDasharray="65.3 502.65" strokeDashoffset="-382" style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
                    <circle cx="110" cy="110" r="80" stroke="#a39e9b" strokeWidth="40" strokeDasharray="35.2 502.65" strokeDashoffset="-447.3" style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
                    <circle cx="110" cy="110" r="80" stroke="#e1deda" strokeWidth="40" strokeDasharray="20.1 502.65" strokeDashoffset="-482.5" style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
                    <text x="110" y="106" textAnchor="middle" fontFamily="'Lora', Georgia, serif" fontSize="22" fontWeight="700" fill="#02122c">96%</text>
                    <text x="110" y="124" textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontSize="10" fill="#6c6967">{t('s3ChartCenter')}</text>
                  </svg>
                  <div className="pie-chart-legend">
                    {[
                      { color: '#0062b8', label: t('s3Legend1'), pct: '54%' },
                      { color: '#0b4fd9', label: t('s3Legend2'), pct: '22%' },
                      { color: '#06f', label: t('s3Legend3'), pct: '13%' },
                      { color: '#a39e9b', label: t('s3Legend4'), pct: '7%' },
                      { color: '#e1deda', label: t('s3Legend5'), pct: '4%' },
                    ].map((item) => (
                      <div key={item.label} className="pie-chart-legend__item">
                        <span className="pie-chart-legend__dot" style={{ background: item.color }} />
                        <span>{item.label}</span>
                        <span className="pie-chart-legend__pct">{item.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="pie-chart-source">{t('s3ChartSource')}</p>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol><li>{t('s3Source1')}</li></ol>
                </div>
              </section>

              {/* SECTION 4 — Comparison Table */}
              <section id="section-4" className="fade-up article-section">
                <h2>{t('s4Title')}</h2>
                <p>{t('s4Intro')}</p>
                <div className="comparison-table-wrap">
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th>{t('s4ColDimension')}</th>
                        <th>{t('s4ColCloud')}</th>
                        <th>{t('s4ColOnPrem')}</th>
                        <th>{t('s4ColAdvantage')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['encryption', 'patching', 'compliance', 'disaster', 'monitoring', 'access', 'accuracy'] as const).map((key) => (
                        <tr key={key}>
                          <td><strong>{t(`s4Row_${key}_dim`)}</strong></td>
                          <td className="winner">{t(`s4Row_${key}_cloud`)}</td>
                          <td className="dim">{t(`s4Row_${key}_onprem`)}</td>
                          <td className="winner">{t(`s4Row_${key}_winner`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '8px' }}>{t('s4TableSource')}</p>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    <li>{t('s4Source1')}</li>
                    <li>{t('s4Source2')}</li>
                  </ol>
                </div>
              </section>

              {/* SECTION 5 — Numbered List */}
              <section id="section-5" className="fade-up article-section">
                <h2>{t('s5Title')}</h2>
                <p>{t('s5Intro')}</p>
                <div className="numbered-list">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <div key={n} className="numbered-list__item">
                      <div className="numbered-list__badge">{n}</div>
                      <div className="numbered-list__content">
                        <h3>{t(`s5Item${n}Title`)}</h3>
                        <p>{t(`s5Item${n}Desc`)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-cloud-security-2.webp" alt={t('s5ImageAlt')} />
                  <figcaption>{t('s5ImageCaption')}</figcaption>
                </figure>
              </section>

              {/* SECTION 6 — Callout */}
              <section id="section-6" className="fade-up article-section">
                <h2>{t('s6Title')}</h2>
                <div className="callout-block">
                  <div className="callout-block__header">
                    <div className="callout-block__icon">!</div>
                    <span className="callout-block__title">{t('s6CalloutTitle')}</span>
                  </div>
                  <p>{t('s6CalloutP1')}</p>
                  <p style={{ marginTop: '12px' }}>{t('s6CalloutP2')}</p>
                  <p style={{ marginTop: '12px' }}>{t('s6CalloutP3')}</p>
                </div>
              </section>

              {/* SECTION 7 — Data Table */}
              <section id="section-7" className="fade-up article-section">
                <h2>{t('s7Title')}</h2>
                <p>{t('s7Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-cloud-security-3.webp" alt={t('s7ImageAlt')} />
                  <figcaption>{t('s7ImageCaption')}</figcaption>
                </figure>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t('s7ColCapability')}</th>
                        <th>{t('s7ColCloud')}</th>
                        <th>{t('s7ColOnPrem')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['compliance', 'patching', 'redundancy', 'encryption', 'monitoring', 'uptime'] as const).map((key) => (
                        <tr key={key}>
                          <td><strong>{t(`s7Row_${key}_cap`)}</strong></td>
                          <td className="highlight">{t(`s7Row_${key}_cloud`)}</td>
                          <td>{t(`s7Row_${key}_onprem`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="data-table-footer">{t('s7TableFooter')}</div>
                </div>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    <li>{t('s7Source1')}</li>
                    <li>{t('s7Source2')}</li>
                  </ol>
                </div>
              </section>

              {/* SECTION 8 — Before / After */}
              <section id="section-8" className="fade-up article-section">
                <h2>{t('s8Title')}</h2>
                <p>{t('s8Intro')}</p>
                <div className="before-after">
                  <div className="before-after__panel before-after__panel--before">
                    <span className="before-after__label">{t('s8BeforeLabel')}</span>
                    <ul className="before-after__list">
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <li key={n}>{t(`s8Before${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="before-after__panel before-after__panel--after">
                    <span className="before-after__label">{t('s8AfterLabel')}</span>
                    <ul className="before-after__list">
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <li key={n}>{t(`s8After${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p>{t('s8Conclusion')}</p>
              </section>

              {/* SECTION 9 — Testimonial + Results */}
              <section id="section-9" className="fade-up article-section">
                <h2>{t('s9Title')}</h2>
                <p>{t('s9Intro')}</p>
                <figure className="article-image article-image--supporting">
                  <img src="/assets/articles/article-cloud-security-4.webp" alt={t('s9ImageAlt')} />
                  <figcaption>{t('s9ImageCaption')}</figcaption>
                </figure>
                <p>{t('s9TransitionP')}</p>
                <div className="testimonial-block">
                  <div className="testimonial-quote">
                    <p>{t('s9Quote')}</p>
                    <cite>{t('s9Cite')}</cite>
                  </div>
                  <div className="results-grid">
                    {[
                      { metric: '98%', label: t('s9Result1') },
                      { metric: '3', label: t('s9Result2') },
                      { metric: '20%', label: t('s9Result3') },
                      { metric: '15%', label: t('s9Result4') },
                    ].map((r) => (
                      <div key={r.label} className="result-card">
                        <div className="result-card__metric">{r.metric}</div>
                        <div className="result-card__label">{r.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* SECTION 10 — Step Process */}
              <section id="section-10" className="fade-up article-section">
                <h2>{t('s10Title')}</h2>
                <p>{t('s10Intro')}</p>
                <div className="step-process">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="step-process__item">
                      <div className="step-process__number">{n}</div>
                      <div className="step-process__content">
                        <h3>{t(`s10Step${n}Title`)}</h3>
                        <p>{t(`s10Step${n}Desc`)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 11 — Key Takeaways */}
              <section id="section-11" className="fade-up article-section">
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
              </section>

              {/* SECTION 12 — Impact Highlight + Share */}
              <section id="section-12" className="fade-up article-section">
                <figure className="article-image article-image--atmospheric">
                  <img src="/assets/articles/article-cloud-security-5.webp" alt={t('s12ImageAlt')} />
                  <figcaption>{t('s12ImageCaption')}</figcaption>
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
