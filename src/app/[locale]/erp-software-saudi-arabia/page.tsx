import { getTranslations } from 'next-intl/server';
import ReadingProgress from '@/components/ui/ReadingProgress';
import TOCSidebar from '@/components/ui/TOCSidebar';
import TOCInline from '@/components/ui/TOCInline';
import ShareButtons from '@/components/ui/ShareButtons';
import FadeUpObserver from '@/components/ui/FadeUpObserver';
import { Navbar } from '@/components/sections/Navbar';
import { CallToAction } from '@/components/sections/CallToAction';
import { Footer } from '@/components/sections/Footer';
import ArticleFaqTabs from '@/components/ui/ArticleFaqTabs';
import ArticleAccordion from '@/components/ui/ArticleAccordion';
import AffiliateDisclosure from '@/components/ui/AffiliateDisclosure';
import AffiliateLink from '@/components/ui/AffiliateLink';
import AffiliateSidebar from '@/components/ui/AffiliateSidebar';
import AffiliateMobileBar from '@/components/ui/AffiliateMobileBar';
import AffiliateMidArticle from '@/components/ui/AffiliateMidArticle';

const tocItems = [
  { id: 'section-2', label: 'Framework Overview' },
  { id: 'section-3', label: 'Market Numbers' },
  { id: 'section-4', label: 'Size-Based Selection' },
  { id: 'section-5', label: 'Industry Fit' },
  { id: 'section-6', label: 'Vendor Scorecard' },
  { id: 'section-7', label: 'Budget & TCO' },
  { id: 'section-8', label: 'ZATCA Compliance' },
  { id: 'section-9', label: 'Cloud vs On-Premise' },
  { id: 'section-10', label: 'Case Studies' },
  { id: 'section-11', label: 'Selection Checklist' },
  { id: 'section-12', label: 'FAQ' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'At a Glance -- What This Framework Covers' },
  { id: 'section-3', label: 'The Saudi ERP Market in Numbers' },
  { id: 'section-4', label: 'Size Your ERP -- SME vs. Enterprise Requirements' },
  { id: 'section-5', label: 'Industry Vertical Fit -- Manufacturing, Retail, and Services' },
  { id: 'section-6', label: 'Vendor Capability Scorecard' },
  { id: 'section-7', label: 'Budget Tiers and True TCO' },
  { id: 'section-8', label: 'ZATCA Compliance -- The Non-Negotiable Filter' },
  { id: 'section-9', label: 'Cloud vs. On-Premise Decision Path' },
  { id: 'section-10', label: 'Real-World Results -- SABIC and Al Homaidhi' },
  { id: 'section-11', label: 'Your ERP Selection Checklist' },
  { id: 'section-12', label: 'Common Questions About ERP in Saudi Arabia' },
];

export async function generateMetadata() {
  const t = await getTranslations('Articles.erpSoftwareSaudiArabia');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: 'ERP Saudi Arabia, ERP software, SAP S/4HANA Saudi, ZATCA compliance, Saudi ERP market, Oracle NetSuite Saudi, Dynamics 365 Saudi, HAL ERP',
  };
}

export default async function ErpSoftwareSaudiArabiaPage() {
  const t = await getTranslations('Articles.erpSoftwareSaudiArabia');

  const vendors = ['sap', 'oracle', 'dynamics', 'odoo', 'hal', 'focus', 'sowaan', 'daftra'] as const;
  const dimensions = ['zatca', 'arabic', 'cloud', 'scalability', 'support', 'tco'] as const;

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section article-hero">
          <div className="article-hero__bg">
            <img src="/assets/articles/article-erp-saudi-framework-1.webp" alt={t('heroImageAlt')} />
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
              <AffiliateSidebar partner="odoo" title="ERP for Saudi Business" buttonText="Try Odoo Free" />
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

              {/* SECTION 2 — Summary Box */}
              <section id="section-2" className="fade-up article-section article-prose">
                <h2>{t('s2Title')}</h2>
                <p>{t('s2Intro')}</p>
                <div className="summary-box">
                  <h4>{t('s2BoxTitle')}</h4>
                  <ul>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <li key={n} dangerouslySetInnerHTML={{ __html: t.raw(`s2Item${n}`) }} />
                    ))}
                  </ul>
                </div>
              </section>

              {/* SECTION 3 — Market Metrics */}
              <section id="section-3" className="fade-up article-section article-prose">
                <h2>{t('s3Title')}</h2>
                <p>{t('s3Intro')}</p>
                <div className="metric-grid">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="metric-card">
                      <div className="metric-number">{t(`s3Metric${n}Number`)}</div>
                      <div className="metric-label">{t(`s3Metric${n}Label`)}</div>
                      <div className="metric-desc">{t(`s3Metric${n}Desc`)}</div>
                    </div>
                  ))}
                </div>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    <li>{t('s3Source1')}</li>
                    <li>{t('s3Source2')}</li>
                  </ol>
                </div>
              </section>

              {/* SECTION 4 — Pricing Tiers */}
              <section id="section-4" className="fade-up article-section article-prose">
                <h2>{t('s4Title')}</h2>
                <p>{t('s4P1')}</p>
                <p>{t('s4P2')}</p>
                <div className="tier-grid">
                  {(['starter', 'growth', 'enterprise'] as const).map((tier) => (
                    <div key={tier} className={`tier-card${tier === 'growth' ? ' tier-card--recommended' : ''}`}>
                      {tier === 'growth' && <span className="tier-badge">{t('s4GrowthBadge')}</span>}
                      <h4>{t(`s4Tier_${tier}_name`)}</h4>
                      <div className="tier-price">{t(`s4Tier_${tier}_price`)}</div>
                      <div className="tier-period">{t('s4PriceUnit')}</div>
                      <ul className="tier-features">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <li key={n}>{t(`s4Tier_${tier}_f${n}`)}</li>
                        ))}
                      </ul>
                      <div className="tier-target" dangerouslySetInnerHTML={{ __html: t.raw(`s4Tier_${tier}_vendors`) }} />
                    </div>
                  ))}
                </div>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-erp-saudi-framework-2.webp" alt={t('s4ImageAlt')} />
                  <figcaption>{t('s4ImageCaption')}</figcaption>
                </figure>
              </section>

              {/* SECTION 5 — Industry Vertical Fit */}
              <section id="section-5" className="fade-up article-section article-prose">
                <h2>{t('s5Title')}</h2>
                <p>{t('s5P1')}</p>
                <p>{t('s5P2')}</p>
                <div className="use-case-table-wrap">
                  <table className="use-case-table">
                    <thead>
                      <tr>
                        <th>{t('s5ColVendor')}</th>
                        <th>{t('s5ColManufacturing')}</th>
                        <th>{t('s5ColRetail')}</th>
                        <th>{t('s5ColServices')}</th>
                        <th>{t('s5ColConstruction')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['sap', 'oracle', 'dynamics', 'hal', 'focus', 'odoo', 'sowaan', 'daftra'] as const).map((v) => (
                        <tr key={v}>
                          <td><strong>{t(`s5Row_${v}_name`)}</strong></td>
                          <td className={t(`s5Row_${v}_mfg_class`)}>{t(`s5Row_${v}_mfg`)}</td>
                          <td className={t(`s5Row_${v}_ret_class`)}>{t(`s5Row_${v}_ret`)}</td>
                          <td className={t(`s5Row_${v}_svc_class`)}>{t(`s5Row_${v}_svc`)}</td>
                          <td className={t(`s5Row_${v}_con_class`)}>{t(`s5Row_${v}_con`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-erp-saudi-framework-3.webp" alt={t('s5ImageAlt')} />
                  <figcaption>{t('s5ImageCaption')}</figcaption>
                </figure>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    <li>{t('s5Source1')}</li>
                    <li>{t('s5Source2')}</li>
                  </ol>
                </div>
              </section>

              {/* SECTION 6 — Vendor Capability Scorecard */}
              <section id="section-6" className="fade-up article-section article-prose">
                <h2>{t('s6Title')}</h2>
                <p>{t('s6P1')}</p>
                <p>{t('s6P2')}</p>
                <div className="scorecard-grid">
                  {vendors.map((v) => (
                    <div key={v} className="scorecard-card">
                      <h4>{t(`s6Card_${v}_name`)}</h4>
                      {dimensions.map((d) => (
                        <div key={d} className="scorecard-row">
                          <span className="scorecard-label">{t(`s6Dim_${d}`)}</span>
                          <span className="scorecard-dots">
                            {[1, 2, 3, 4, 5].map((dot) => (
                              <span key={dot} className={`scorecard-dot ${t(`s6Card_${v}_${d}_d${dot}`)}`} />
                            ))}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    <li>{t('s6Source1')}</li>
                    <li>{t('s6Source2')}</li>
                    <li>{t('s6Source3')}</li>
                  </ol>
                </div>
              </section>

              {/* SECTION 7 — Budget Tiers and True TCO */}
              <section id="section-7" className="fade-up article-section article-prose">
                <h2>{t('s7Title')}</h2>
                <p>{t('s7P1')}</p>
                <p>{t('s7P2')}</p>
                <div className="bar-chart">
                  {(['starter', 'growth', 'enterprise'] as const).map((tier) => (
                    <div key={tier} className="bar-row">
                      <div className="bar-label">
                        <span className="bar-label-text">{t(`s7Bar_${tier}_label`)}</span>
                        <span className="bar-label-value">{t(`s7Bar_${tier}_value`)}</span>
                      </div>
                      <div className="bar-track"><div className={`bar-fill bar-fill--${tier}`} style={{ width: tier === 'starter' ? '12%' : tier === 'growth' ? '45%' : '90%' }} /></div>
                      <div className="bar-subtext">{t(`s7Bar_${tier}_sub`)}</div>
                    </div>
                  ))}
                </div>
                <h3>{t('s7HiddenTitle')}</h3>
                <ul>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <li key={n} dangerouslySetInnerHTML={{ __html: t.raw(`s7Hidden${n}`) }} />
                  ))}
                </ul>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    <li>{t('s7Source1')}</li>
                    <li>{t('s7Source2')}</li>
                  </ol>
                </div>
              </section>

              {/* Mid-Article CTA */}
              <AffiliateMidArticle
                partner="odoo"
                heading="Find Your ERP Match"
                description="Compare ERP options and find the right fit for your Saudi business."
                buttonText="Try Odoo Free"
              />

              {/* SECTION 8 — ZATCA Compliance */}
              <section id="section-8" className="fade-up article-section article-prose">
                <h2>{t('s8Title')}</h2>
                <p>{t('s8P1')}</p>
                <p>{t('s8P2')}</p>
                <div className="do-dont-grid">
                  <div className="do-panel">
                    <div className="do-panel-header">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                      {t('s8DoLabel')}
                    </div>
                    <ul>
                      {[1, 2, 3].map((n) => (
                        <li key={n}>{t(`s8Do${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="dont-panel">
                    <div className="dont-panel-header">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                      {t('s8DontLabel')}
                    </div>
                    <ul>
                      {[1, 2, 3].map((n) => (
                        <li key={n}>{t(`s8Dont${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    <li>{t('s8Source1')}</li>
                    <li>{t('s8Source2')}</li>
                    <li>{t('s8Source3')}</li>
                  </ol>
                </div>
              </section>

              {/* SECTION 9 — Cloud vs On-Premise */}
              <section id="section-9" className="fade-up article-section article-prose">
                <h2>{t('s9Title')}</h2>
                <p>{t('s9P1')}</p>
                <p>{t('s9P2')}</p>
                <ArticleAccordion items={[1, 2, 3, 4, 5].map((n) => ({
                  number: n,
                  title: t(`s9Step${n}Title`),
                  desc: t(`s9Step${n}Desc`),
                }))} />
                <figure className="article-image article-image--supporting">
                  <img src="/assets/articles/article-erp-saudi-framework-4.webp" alt={t('s9ImageAlt')} />
                  <figcaption>{t('s9ImageCaption')}</figcaption>
                </figure>
              </section>

              {/* SECTION 10 — Case Studies */}
              <section id="section-10" className="fade-up article-section article-prose">
                <h2>{t('s10Title')}</h2>
                <p>{t('s10Intro')}</p>
                <div className="case-study-grid">
                  {(['sabic', 'homaidhi'] as const).map((c) => (
                    <div key={c} className="case-card">
                      <div className="case-card-header">
                        <h4>{t(`s10Case_${c}_name`)}</h4>
                        <span className="case-tag">{t(`s10Case_${c}_tag`)}</span>
                      </div>
                      <div className="case-label">{t('s10ChallengeLabel')}</div>
                      <p className="case-text">{t(`s10Case_${c}_challenge`)}</p>
                      <div className="case-label">{t('s10SolutionLabel')}</div>
                      <p className="case-text">{t(`s10Case_${c}_solution`)}</p>
                      <div className="case-results">
                        {[1, 2, 3].map((n) => {
                          const key = `s10Case_${c}_result${n}`;
                          const val = t.raw(key);
                          if (!val || val === key) return null;
                          return (
                            <div key={n}>
                              <div className="case-metric-num">{t(`s10Case_${c}_result${n}Num`)}</div>
                              <div className="case-metric-label">{t(`s10Case_${c}_result${n}Label`)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-erp-saudi-framework-5.webp" alt={t('s10ImageAlt')} />
                  <figcaption>{t('s10ImageCaption')}</figcaption>
                </figure>
              </section>

              {/* SECTION 11 — Selection Checklist */}
              <section id="section-11" className="fade-up article-section article-prose">
                <h2>{t('s11Title')}</h2>
                <p>{t('s11Intro')}</p>
                <ul className="checklist-list">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <li key={n}>
                      <span className="checklist-icon"><svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></span>
                      <span dangerouslySetInnerHTML={{ __html: t.raw(`s11Check${n}`) }} />
                    </li>
                  ))}
                </ul>
              </section>

              {/* SECTION 12 — FAQ */}
              <section id="section-12" className="fade-up article-section article-prose">
                <h2>{t('s12Title')}</h2>
                <ArticleFaqTabs tabs={[
                  { id: 'general', label: t('s12TabGeneral'), items: [1, 2].map((n) => ({ question: t(`s12Faq_general_q${n}`), answer: t(`s12Faq_general_a${n}`) })) },
                  { id: 'compliance', label: t('s12TabCompliance'), items: [1, 2].map((n) => ({ question: t(`s12Faq_compliance_q${n}`), answer: t(`s12Faq_compliance_a${n}`) })) },
                  { id: 'technical', label: t('s12TabTechnical'), items: [1, 2].map((n) => ({ question: t(`s12Faq_technical_q${n}`), answer: t(`s12Faq_technical_a${n}`) })) },
                ]} />
                <AffiliateLink partner="odoo">
                  Try Odoo Free
                </AffiliateLink>

                <ShareButtons shareText={t('shareText')} />
              </section>

            </div>
          </div>
        </div>
      </main>
      <CallToAction />
      <Footer />
      <AffiliateMobileBar partner="odoo" buttonText="Try Odoo Free" />
    </>
  );
}
