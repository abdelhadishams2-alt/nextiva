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
  { id: 'section-2', label: 'Market Scale & Capital Flows' },
  { id: 'section-3', label: 'Saudi-Born Firms Profiled' },
  { id: 'section-4', label: 'Global Giants in KSA' },
  { id: 'section-5', label: 'Capability Scorecard' },
  { id: 'section-6', label: 'Saudization & Policy Edge' },
  { id: 'section-7', label: 'Joint Venture Models' },
  { id: 'section-8', label: 'On-Time Delivery Problem' },
  { id: 'section-9', label: 'Portfolio Mapping' },
  { id: 'section-10', label: 'Client Decision Guide' },
  { id: 'section-11', label: 'FAQ' },
  { id: 'section-12', label: 'Final Takeaway & CTA' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'A $196 Billion Arena -- Why the Competition Matters Now' },
  { id: 'section-3', label: 'The Local Contenders -- Dar Al-Handasah, JASARA, and the Saudi-Born Wave' },
  { id: 'section-4', label: 'The International Heavyweights -- Bechtel, Parsons, AECOM, and Hill International' },
  { id: 'section-5', label: 'Head-to-Head -- Capability, Scale, and Strategic Fit' },
  { id: 'section-6', label: 'The Saudization Multiplier -- Policy as Competitive Advantage' },
  { id: 'section-7', label: 'The JV Playbook -- How Alliances Are Redrawing Competitive Lines' },
  { id: 'section-8', label: 'The Delivery Gap -- Why 83% Overruns Change the Equation' },
  { id: 'section-9', label: 'Who Wins Which Giga-Projects -- A Portfolio Map' },
  { id: 'section-10', label: 'What Clients Should Ask Before Choosing a PM Partner' },
  { id: 'section-11', label: 'Frequently Asked Questions' },
  { id: 'section-12', label: 'The Verdict -- Rivalry as Catalyst' },
];

export async function generateMetadata() {
  const t = await getTranslations('Articles.projectManagementCompaniesSaudiArabia');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: 'Saudi project management, construction consulting KSA, Saudization, giga-projects, Dar Al-Handasah, JASARA, Bechtel Saudi Arabia, Vision 2030 construction',
  };
}

export default async function ProjectManagementCompaniesSaudiArabiaPage() {
  const t = await getTranslations('Articles.projectManagementCompaniesSaudiArabia');

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section article-hero">
          <div className="article-hero__bg">
            <img src="/assets/articles/article-saudi-pm-rivalry-1.webp" alt={t('heroImageAlt')} />
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
              <AffiliateSidebar partner="hubspot" title="Project Management Tool" buttonText="Try HubSpot Free" />
            </TOCSidebar>
            <div className="article-main">
              <TOCInline items={tocItemsFull} />

              {/* Affiliate Disclosure */}
              <AffiliateDisclosure />

              {/* SECTION 2 — KPI Row */}
              <section id="section-2" className="fade-up article-section">
                <h2>{t('s2Title')}</h2>
                <p>{t('s2Intro')}</p>
                <div className="kpi-grid">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="kpi-card">
                      <div className="kpi-number">{t(`s2Kpi${n}Number`)}</div>
                      <div className="kpi-label">{t(`s2Kpi${n}Label`)}</div>
                      {t.has(`s2Kpi${n}Trend`) && <div className="kpi-trend">{t(`s2Kpi${n}Trend`)}</div>}
                      <div className="kpi-source">{t(`s2Kpi${n}Source`)}</div>
                    </div>
                  ))}
                </div>
                <p>{t('s2Conclusion')}</p>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    {[1, 2, 3, 4].map((n) => (
                      <li key={n}>{t(`s2Source${n}`)}</li>
                    ))}
                  </ol>
                </div>
              </section>

              {/* SECTION 3 — Profile Cards (Local Contenders) */}
              <section id="section-3" className="fade-up article-section">
                <h2>{t('s3Title')}</h2>
                <p>{t('s3Intro')}</p>
                <div className="profile-cards">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="profile-card">
                      <span className="profile-card-tag">{t(`s3Card${n}Tag`)}</span>
                      <h3>{t(`s3Card${n}Name`)}</h3>
                      <p>{t(`s3Card${n}Desc`)}</p>
                    </div>
                  ))}
                </div>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-saudi-pm-rivalry-2.webp" alt={t('s3ImageAlt')} />
                  <figcaption>{t('s3ImageCaption')}</figcaption>
                </figure>
              </section>

              {/* SECTION 4 — Editorial Two-Col (International Heavyweights) */}
              <section id="section-4" className="fade-up article-section">
                <h2>{t('s4Title')}</h2>
                <p>{t('s4Intro')}</p>
                <div className="editorial-two-col">
                  <div className="editorial-col-main">
                    <p>{t('s4MainP1')}</p>
                    <p>{t('s4MainP2')}</p>
                    <p>{t('s4MainP3')}</p>
                  </div>
                  <div className="editorial-col-side">
                    <h3>{t('s4SideTitle')}</h3>
                    <ul>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <li key={n} dangerouslySetInnerHTML={{ __html: t.raw(`s4Side${n}`) }} />
                      ))}
                    </ul>
                  </div>
                </div>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-saudi-pm-rivalry-3.webp" alt={t('s4ImageAlt')} />
                  <figcaption>{t('s4ImageCaption')}</figcaption>
                </figure>
              </section>

              {/* SECTION 5 — Feature Matrix */}
              <section id="section-5" className="fade-up article-section">
                <h2>{t('s5Title')}</h2>
                <p>{t('s5Intro')}</p>
                <table className="feature-matrix">
                  <thead>
                    <tr>
                      <th>{t('s5ColDimension')}</th>
                      <th>{t('s5ColLocal')}</th>
                      <th>{t('s5ColInternational')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(['localKnowledge', 'gigaTrack', 'saudization', 'jvFlex', 'cost', 'techDepth', 'regAccess'] as const).map((key) => (
                      <tr key={key}>
                        <td>{t(`s5Row_${key}_dim`)}</td>
                        <td className={t(`s5Row_${key}_localClass`)}>{t(`s5Row_${key}_local`)}</td>
                        <td className={t(`s5Row_${key}_intlClass`)}>{t(`s5Row_${key}_intl`)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p>{t('s5Conclusion')}</p>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    {[1, 2, 3].map((n) => (
                      <li key={n}>{t(`s5Source${n}`)}</li>
                    ))}
                  </ol>
                </div>
              </section>

              {/* SECTION 6 — Problem-Solution (Saudization) */}
              <section id="section-6" className="fade-up article-section">
                <h2>{t('s6Title')}</h2>
                <p>{t('s6Intro')}</p>
                <div className="problem-solution">
                  <div className="problem-panel">
                    <h3>{t('s6ProblemTitle')}</h3>
                    <p>{t('s6ProblemDesc')}</p>
                  </div>
                  <div className="solution-panel">
                    <h3>{t('s6SolutionTitle')}</h3>
                    <p>{t('s6SolutionDesc')}</p>
                  </div>
                </div>
              </section>

              {/* SECTION 7 — Decision Flowchart (JV Playbook) */}
              <section id="section-7" className="fade-up article-section">
                <h2>{t('s7Title')}</h2>
                <p>{t('s7Intro')}</p>
                <div className="flowchart">
                  <div className="flow-node flow-node--decision">
                    <h4>{t('s7DecisionTitle')}</h4>
                    <p>{t('s7DecisionDesc')}</p>
                  </div>
                  <div className="flow-connector" />
                  {[1, 2, 3].map((n) => (
                    <div key={n}>
                      <div className="flow-node flow-node--option">
                        <span className="flow-branch-label">{t(`s7Path${n}Label`)}</span>
                        <h4>{t(`s7Path${n}Title`)}</h4>
                        <p>{t(`s7Path${n}Desc`)}</p>
                      </div>
                      {n < 3 && <div className="flow-connector" />}
                    </div>
                  ))}
                </div>
                <figure className="article-image article-image--supporting">
                  <img src="/assets/articles/article-saudi-pm-rivalry-4.webp" alt={t('s7ImageAlt')} />
                  <figcaption>{t('s7ImageCaption')}</figcaption>
                </figure>
              </section>

              {/* Mid-Article CTA */}
              <AffiliateMidArticle
                partner="hubspot"
                heading="Streamline Your Projects"
                description="HubSpot helps teams collaborate and deliver projects on time."
                buttonText="Try HubSpot Free"
              />

              {/* SECTION 8 — Progress Bars (Delivery Gap) */}
              <section id="section-8" className="fade-up article-section">
                <h2>{t('s8Title')}</h2>
                <p>{t('s8Intro')}</p>
                <div className="progress-bars">
                  {([
                    { key: 1, fill: 'danger', width: '83%' },
                    { key: 2, fill: 'warning', width: '68%' },
                    { key: 3, fill: 'info', width: '40%' },
                    { key: 4, fill: 'success', width: '18%' },
                  ] as const).map((bar) => (
                    <div key={bar.key} className="progress-item">
                      <div className="progress-header">
                        <span className="progress-label">{t(`s8Bar${bar.key}Label`)}</span>
                        <span className="progress-value">{t(`s8Bar${bar.key}Value`)}</span>
                      </div>
                      <div className="progress-track">
                        <div className={`progress-fill progress-fill--${bar.fill}`} style={{ width: bar.width }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p>{t('s8Conclusion')}</p>
                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    {[1, 2, 3].map((n) => (
                      <li key={n}>{t(`s8Source${n}`)}</li>
                    ))}
                  </ol>
                </div>
              </section>

              {/* SECTION 9 — Regional Data (Giga-Projects) */}
              <section id="section-9" className="fade-up article-section">
                <h2>{t('s9Title')}</h2>
                <p>{t('s9Intro')}</p>
                <div className="regional-grid">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="regional-card">
                      <span className="regional-tag">{t(`s9Region${n}Tag`)}</span>
                      <h4>{t(`s9Region${n}Name`)}</h4>
                      <p>{t(`s9Region${n}Desc`)}</p>
                    </div>
                  ))}
                </div>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-saudi-pm-rivalry-5.webp" alt={t('s9ImageAlt')} />
                  <figcaption>{t('s9ImageCaption')}</figcaption>
                </figure>
              </section>

              {/* SECTION 10 — Client Decision Checklist */}
              <section id="section-10" className="fade-up article-section">
                <h2>{t('s10Title')}</h2>
                <p>{t('s10Intro')}</p>
                <div className="checklist-panel">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <div key={n} className="checklist-item">
                      <div className="checklist-icon"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg></div>
                      <div className="checklist-text" dangerouslySetInnerHTML={{ __html: t.raw(`s10Check${n}`) }} />
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 11 — FAQ Cards Grid */}
              <section id="section-11" className="fade-up article-section">
                <h2>{t('s11Title')}</h2>
                <div className="faq-grid">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="faq-card">
                      <h4>{t(`s11Q${n}`)}</h4>
                      <p>{t(`s11A${n}`)}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 12 — Verdict + CTA */}
              <section id="section-12" className="fade-up article-section">
                <h2>{t('s12Title')}</h2>
                <p>{t('s12Intro')}</p>
                <div className="key-takeaways">
                  <h4>{t('keyTakeawaysLabel')}</h4>
                  <ul>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <li key={n}>{t(`s12Takeaway${n}`)}</li>
                    ))}
                  </ul>
                </div>
                <AffiliateLink partner="hubspot">
                  Try HubSpot Free
                </AffiliateLink>

                <ShareButtons shareText={t('shareText')} />
              </section>

            </div>
          </div>
        </div>
      </main>
      <CallToAction />
      <Footer />
      <AffiliateMobileBar partner="hubspot" buttonText="Try HubSpot Free" />
    </>
  );
}
