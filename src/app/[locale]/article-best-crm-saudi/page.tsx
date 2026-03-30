import { getTranslations } from 'next-intl/server';
import { SITE_CONFIG } from '@/config/site';
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
  { id: 'section-2', label: 'Why Saudi Needs CRM' },
  { id: 'section-3', label: 'Must-Have Features' },
  { id: 'section-4', label: 'Top 10 CRM Platforms' },
  { id: 'section-5', label: 'Best by Business Size' },
  { id: 'section-6', label: 'Best by Industry' },
  { id: 'section-7', label: 'Pricing Comparison' },
  { id: 'section-8', label: 'Data Residency' },
  { id: 'section-9', label: 'Real-World Adoption' },
  { id: 'section-10', label: 'How to Choose' },
  { id: 'section-11', label: 'CRM FAQ' },
  { id: 'section-12', label: 'Final Verdict' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'Why Saudi Arabia Needs Specialized CRM Software' },
  { id: 'section-3', label: '6 Must-Have Features for Saudi CRM Success' },
  { id: 'section-4', label: 'Top 10 CRM Platforms for Saudi Arabia in 2026' },
  { id: 'section-5', label: 'Best CRM by Business Size' },
  { id: 'section-6', label: 'Best CRM by Industry Vertical' },
  { id: 'section-7', label: 'Complete Pricing Comparison (USD & SAR)' },
  { id: 'section-8', label: 'Saudi Data Residency & PDPL Compliance' },
  { id: 'section-9', label: 'Real-World CRM Adoption in the Kingdom' },
  { id: 'section-10', label: 'How to Choose the Right CRM' },
  { id: 'section-11', label: 'Frequently Asked Questions' },
  { id: 'section-12', label: 'Final Verdict & Recommendations' },
];

export async function generateMetadata() {
  const t = await getTranslations('Articles.articleBestCrmSaudi');
  const title = t('metaTitle');
  const description = t('metaDescription');
  return {
    title,
    description,
    keywords: 'best CRM software Saudi Arabia, CRM for Saudi businesses, CRM Saudi Arabia 2026, Salesforce Saudi Arabia, Zoho CRM KSA, HubSpot Saudi, CRM Vision 2030, Arabic CRM software, CRM ZATCA compliance',
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/article-best-crm-saudi`,
      siteName: SITE_CONFIG.name,
      images: [{ url: `${SITE_CONFIG.url}/assets/articles/article-best-crm-saudi-1.webp`, width: 1200, height: 630, alt: title }],
      type: 'article',
      publishedTime: '2026-03-30T00:00:00Z',
      authors: [SITE_CONFIG.author],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_CONFIG.url}/assets/articles/article-best-crm-saudi-1.webp`],
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/article-best-crm-saudi`,
    },
  };
}

export default async function ArticleBestCrmSaudiPage() {
  const t = await getTranslations('Articles.articleBestCrmSaudi');

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section">
          <div className="article-hero-outer">
            <div className="article-hero-inner">
              <div className="article-hero-bg">
                <img src="/assets/articles/article-best-crm-saudi-1.webp" alt={t('heroImageAlt')} />
              </div>
              <div className="article-hero-overlay" />
              <div className="article-hero-content">
                <span className="hero-tag">{t('heroBadge')}</span>
                <h1>{t('heroTitle')}</h1>
                <div className="hero-meta-row">
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
            </div>
          </div>
        </section>

        <div className="container-article">
          <div className="article-layout">
            <TOCSidebar items={tocItems}>
              <AffiliateSidebar partner="zoho" title="Try Zoho CRM Free" buttonText="Start Free Trial" />
            </TOCSidebar>
            <div className="article-main">
              <TOCInline items={tocItemsFull} />

              {/* Author Box */}
              <div className="author-box">
                <div className="author-avatar">{t('authorInitials')}</div>
                <div className="author-info">
                  <span className="author-name">{t('authorName')}</span>
                  <span className="author-meta">{t('authorMeta')}</span>
                </div>
              </div>

              {/* Affiliate Disclosure */}
              <AffiliateDisclosure />

              {/* Key Takeaways */}
              <div className="key-takeaways">
                <h4>{t('keyTakeawaysLabel')}</h4>
                <ul>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <li key={n}>{t(`keyTakeaway${n}`)}</li>
                  ))}
                </ul>
              </div>

              {/* SECTION 2 — Why Saudi Arabia Needs Specialized CRM Software */}
              <section id="section-2" className="fade-up article-section">
                <h2>{t('s2Title')}</h2>
                <p className="lead-paragraph">{t('s2Lead')}</p>
                <p>{t('s2P1')}</p>
                <p>{t('s2P2')}</p>
                <div className="stats-trio">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="stat-card">
                      <div className="stat-card__number">{t(`s2Stat${n}Number`)}</div>
                      <div className="stat-card__label">{t(`s2Stat${n}Label`)}</div>
                    </div>
                  ))}
                </div>
                <p>{t('s2P3')}</p>
                <p>{t('s2P4')}</p>
              </section>

              {/* SECTION 3 — Must-Have Features */}
              <section id="section-3" className="fade-up article-section">
                <h2>{t('s3Title')}</h2>
                <p>{t('s3Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-best-crm-saudi-2.webp" alt={t('s3ImageAlt')} />
                  <figcaption>{t('s3ImageCaption')}</figcaption>
                </figure>
                <div className="feature-cards-grid">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="feature-card">
                      <div className="feature-card__icon">{t(`s3Feature${n}Icon`)}</div>
                      <h4 className="feature-card__title">{t(`s3Feature${n}Title`)}</h4>
                      <p className="feature-card__desc">{t(`s3Feature${n}Desc`)}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 4 — Top 10 CRM Platforms */}
              <section id="section-4" className="fade-up article-section">
                <h2>{t('s4Title')}</h2>
                <p>{t('s4Intro')}</p>
                <div className="data-table-wrap">
                  <table className="scorecard-table">
                    <thead>
                      <tr>
                        <th>{t('s4ColPlatform')}</th>
                        <th>{t('s4ColBestFor')}</th>
                        <th>{t('s4ColArabic')}</th>
                        <th>{t('s4ColDataKsa')}</th>
                        <th>{t('s4ColFree')}</th>
                        <th>{t('s4ColPrice')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['salesforce', 'zoho', 'hubspot', 'dynamics', 'odoo', 'freshsales', 'pipedrive', 'daftra', 'hollat', 'bitrix'] as const).map((platform) => (
                        <tr key={platform}>
                          <td>{t(`s4Row_${platform}_name`)}</td>
                          <td>{t(`s4Row_${platform}_bestFor`)}</td>
                          <td>{t(`s4Row_${platform}_arabic`)}</td>
                          <td>{t(`s4Row_${platform}_dataKsa`)}</td>
                          <td>{t(`s4Row_${platform}_free`)}</td>
                          <td>{t(`s4Row_${platform}_price`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>{t('s4P1')}</p>
              </section>

              {/* SECTION 5 — Best by Business Size */}
              <section id="section-5" className="fade-up article-section">
                <h2>{t('s5Title')}</h2>
                <p>{t('s5Intro')}</p>
                <figure className="article-image article-image--supporting">
                  <img src="/assets/articles/article-best-crm-saudi-4.webp" alt={t('s5ImageAlt')} />
                  <figcaption>{t('s5ImageCaption')}</figcaption>
                </figure>
                <div className="rec-cards-grid">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="rec-card">
                      <span className="rec-card__badge">{t(`s5Card${n}Badge`)}</span>
                      <h4 className="rec-card__title">{t(`s5Card${n}Title`)}</h4>
                      <div className="rec-card__pick">{t(`s5Card${n}Pick`)}</div>
                      <p className="rec-card__reason">{t(`s5Card${n}Reason`)}</p>
                      <div className="rec-card__alt">{t(`s5Card${n}Alt`)}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 6 — Best by Industry */}
              <section id="section-6" className="fade-up article-section">
                <h2>{t('s6Title')}</h2>
                <p>{t('s6Intro')}</p>
                <div className="mini-cards-grid">
                  {(['retail', 'realEstate', 'financial', 'healthcare', 'government', 'education'] as const).map((key) => (
                    <div key={key} className="mini-card">
                      <span className="mini-card-badge">{t(`s6Card_${key}_badge`)}</span>
                      <h4>{t(`s6Card_${key}_title`)}</h4>
                      <p>{t(`s6Card_${key}_desc`)}</p>
                      <div className="mini-card-tag">{t(`s6Card_${key}_tag`)}</div>
                    </div>
                  ))}
                </div>
                <p>{t('s6P1')}</p>
              </section>

              {/* Mid-Article CTA */}
              <AffiliateMidArticle
                partner="zoho"
                heading="Try Zoho CRM Free"
                description="Start with Zoho's free tier — Arabic support, local data centers, ZATCA-ready."
                buttonText="Try Zoho Free"
              />

              {/* SECTION 7 — Pricing Comparison */}
              <section id="section-7" className="fade-up article-section">
                <h2>{t('s7Title')}</h2>
                <p>{t('s7Intro')}</p>
                <div className="data-table-wrap">
                  <table className="scorecard-table">
                    <thead>
                      <tr>
                        <th>{t('s7ColPlatform')}</th>
                        <th>{t('s7ColFree')}</th>
                        <th>{t('s7ColStarterUsd')}</th>
                        <th>{t('s7ColStarterSar')}</th>
                        <th>{t('s7ColEntUsd')}</th>
                        <th>{t('s7ColEntSar')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['salesforce', 'zoho', 'hubspot', 'dynamics', 'odoo', 'freshsales', 'pipedrive', 'daftra', 'hollat', 'bitrix'] as const).map((platform) => (
                        <tr key={platform}>
                          <td>{t(`s7Row_${platform}_name`)}</td>
                          <td>{t(`s7Row_${platform}_free`)}</td>
                          <td>{t(`s7Row_${platform}_starterUsd`)}</td>
                          <td>{t(`s7Row_${platform}_starterSar`)}</td>
                          <td>{t(`s7Row_${platform}_entUsd`)}</td>
                          <td>{t(`s7Row_${platform}_entSar`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>{t('s7P1')}</p>
                <p>{t('s7P2')}</p>
              </section>

              {/* SECTION 8 — Data Residency & Compliance */}
              <section id="section-8" className="fade-up article-section">
                <h2>{t('s8Title')}</h2>
                <p>{t('s8Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-best-crm-saudi-3.webp" alt={t('s8ImageAlt')} />
                  <figcaption>{t('s8ImageCaption')}</figcaption>
                </figure>
                <div className="two-col-grid">
                  <div className="two-col-item">
                    <h4>{t('s8PdplTitle')}</h4>
                    <ul>
                      {[1, 2, 3, 4].map((n) => (
                        <li key={n}>{t(`s8Pdpl${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="two-col-item">
                    <h4>{t('s8CompliantTitle')}</h4>
                    <ul>
                      {[1, 2, 3, 4].map((n) => (
                        <li key={n}>{t(`s8Compliant${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="expert-callout">
                  <p>{t('s8ExpertQuote')}</p>
                  <cite>{t('s8ExpertCite')}</cite>
                </div>
                <p>{t('s8P1')}</p>
              </section>

              {/* SECTION 9 — Real-World Adoption */}
              <section id="section-9" className="fade-up article-section">
                <h2>{t('s9Title')}</h2>
                <p>{t('s9Intro')}</p>
                <figure className="article-image article-image--atmospheric">
                  <img src="/assets/articles/article-best-crm-saudi-5.webp" alt={t('s9ImageAlt')} />
                  <figcaption>{t('s9ImageCaption')}</figcaption>
                </figure>
                <div className="big-stat-card">
                  <span className="big-stat-badge">{t('s9StatBadge')}</span>
                  <div className="big-stat-number">{t('s9StatNumber')}</div>
                  <div className="big-stat-label">{t('s9StatLabel')}</div>
                  <div className="big-stat-desc">{t('s9StatDesc')}</div>
                </div>
                <p>{t('s9P1')}</p>
                <p>{t('s9P2')}</p>
                <p>{t('s9P3')}</p>
              </section>

              {/* SECTION 10 — How to Choose */}
              <section id="section-10" className="fade-up article-section">
                <h2>{t('s10Title')}</h2>
                <p>{t('s10Intro')}</p>
                <div className="checklist-grid">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="checklist-item">
                      <span className="checklist-item__icon">&#10003;</span>
                      <span className="checklist-item__text">{t(`s10Check${n}`)}</span>
                    </div>
                  ))}
                </div>
                <p>{t('s10P1')}</p>
              </section>

              {/* SECTION 11 — FAQ */}
              <section id="section-11" className="fade-up article-section">
                <h2>{t('s11Title')}</h2>
                <div className="qa-grid">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="qa-card">
                      <h4><span className="qa-icon">Q</span> {t(`s11Q${n}`)}</h4>
                      <p>{t(`s11A${n}`)}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 12 — Final Verdict */}
              <section id="section-12" className="fade-up article-section">
                <h2>{t('s12Title')}</h2>
                <p>{t('s12Intro')}</p>
                <div className="action-panel">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="action-item">
                      <span className={`action-priority action-priority--${t(`s12Action${n}Priority`)}`} />
                      <div>
                        <div className="action-text" dangerouslySetInnerHTML={{ __html: t.raw(`s12Action${n}Text`) }} />
                        <div className="action-deadline">{t(`s12Action${n}Deadline`)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <p>{t('s12P1')}</p>
              </section>

              {/* Sources Block */}
              <div className="sources-block">
                <h4>{t('sourcesTitle')}</h4>
                <ol>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <li key={n}>{t(`source${n}`)}</li>
                  ))}
                </ol>
              </div>

              <AffiliateLink partner="zoho">
                Try Zoho CRM Free
              </AffiliateLink>

              <ShareButtons shareText={t('shareText')} />

            </div>
          </div>
        </div>
      </main>
      <CallToAction />
      <Footer />
      <AffiliateMobileBar partner="zoho" buttonText="Try Zoho Free" />
    </>
  );
}
