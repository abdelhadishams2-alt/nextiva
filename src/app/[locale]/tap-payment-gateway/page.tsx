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
import ArticleFaq from '@/components/ui/ArticleFaq';
import AffiliateDisclosure from '@/components/ui/AffiliateDisclosure';
import AffiliateLink from '@/components/ui/AffiliateLink';
import AffiliateSidebar from '@/components/ui/AffiliateSidebar';
import AffiliateMobileBar from '@/components/ui/AffiliateMobileBar';
import AffiliateMidArticle from '@/components/ui/AffiliateMidArticle';

const tocItems = [
  { id: 'section-2', label: 'The Six-License Achievement' },
  { id: 'section-3', label: 'GCC Regulatory Landscape' },
  { id: 'section-4', label: 'License-by-License Breakdown' },
  { id: 'section-5', label: 'Competitive Licensing Gap' },
  { id: 'section-6', label: 'What Coverage Unlocks' },
  { id: 'section-7', label: 'MENA Market Trajectory' },
  { id: 'section-8', label: 'Merchant Experience Edge' },
  { id: 'section-9', label: 'Strategic Implications' },
  { id: 'section-10', label: 'Common Questions' },
  { id: 'section-11', label: 'The Bottom Line' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'Why Six Licenses Matter More Than You Think' },
  { id: 'section-3', label: 'The GCC Regulatory Landscape at a Glance' },
  { id: 'section-4', label: 'License-by-License: What Tap Holds and What Each Unlocks' },
  { id: 'section-5', label: 'The Competitive Licensing Gap' },
  { id: 'section-6', label: 'What Full Regulatory Coverage Actually Unlocks for Merchants' },
  { id: 'section-7', label: 'MENA Digital Payments Market Trajectory' },
  { id: 'section-8', label: 'The Merchant Experience Edge' },
  { id: 'section-9', label: 'Strategic Implications for MENA Commerce' },
  { id: 'section-10', label: 'Common Questions About GCC Payment Licensing' },
  { id: 'section-11', label: 'The Bottom Line' },
];

export async function generateMetadata() {
  const t = await getTranslations('Articles.tapPaymentGateway');
  const title = t('metaTitle');
  const description = t('metaDescription');
  return {
    title,
    description,
    keywords: 'GCC payment licenses, Tap Payments, MENA fintech, SAMA, CBUAE, digital payments regulation, Gulf payment processing, cross-border payments',
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/tap-payment-gateway`,
      siteName: SITE_CONFIG.name,
      images: [{ url: `${SITE_CONFIG.url}/assets/articles/article-tap-regulatory-moat-1.webp`, width: 1200, height: 630, alt: title }],
      type: 'article',
      publishedTime: '2026-03-24T00:00:00Z',
      authors: [SITE_CONFIG.author],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_CONFIG.url}/assets/articles/article-tap-regulatory-moat-1.webp`],
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/tap-payment-gateway`,
    },
  };
}

export default async function TapPaymentGatewayPage() {
  const t = await getTranslations('Articles.tapPaymentGateway');

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section article-hero">
          <div className="article-hero__bg">
            <img src="/assets/articles/article-tap-regulatory-moat-1.webp" alt={t('heroImageAlt')} />
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
            <TOCSidebar items={tocItems}>
              <AffiliateSidebar partner="tap" title="GCC Payment Gateway" buttonText="Visit Tap Payments" />
            </TOCSidebar>
            <div className="article-main">
              <TOCInline items={tocItemsFull} />

              {/* SECTION 2 — Introduction */}
              <section id="section-2" className="fade-up article-section article-prose">
                <h2>{t('s2Title')}</h2>
                <p className="lead drop-cap-text">{t('s2Lead')}</p>
                <p>{t('s2P1')}</p>
                <p>{t('s2P2')}</p>
                <p>{t('s2P3')}</p>

                <div className="author-box">
                  <div className="author-avatar">NR</div>
                  <div className="author-info">
                    <span className="author-name">{t('authorName')}</span>
                    <span className="author-meta">{t('authorMeta')}</span>
                  </div>
                </div>

                {/* Affiliate Disclosure */}
                <AffiliateDisclosure />
              </section>

              {/* SECTION 3 — GCC Regulatory Landscape */}
              <section id="section-3" className="fade-up article-section article-prose">
                <h2>{t('s3Title')}</h2>
                <p>{t('s3Intro')}</p>

                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-tap-regulatory-moat-2.webp" alt={t('s3ImageAlt')} />
                  <figcaption>{t('s3ImageCaption')}</figcaption>
                </figure>

                <div className="regional-grid">
                  {(['sa', 'uae', 'kw', 'bh', 'om', 'qa'] as const).map((key) => (
                    <div key={key} className="regional-card">
                      <span className="country-flag" aria-hidden="true">{t(`s3Card_${key}_flag`)}</span>
                      <h4>{t(`s3Card_${key}_name`)}</h4>
                      <span className="regulator-name">{t(`s3Card_${key}_regulator`)}</span>
                      <p>{t(`s3Card_${key}_desc`)}</p>
                    </div>
                  ))}
                </div>

                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    {[1, 2, 3].map((n) => (
                      <li key={n}>{t(`s3Source${n}`)}</li>
                    ))}
                  </ol>
                </div>
              </section>

              {/* SECTION 4 — License-by-License Breakdown */}
              <section id="section-4" className="fade-up article-section article-prose">
                <h2>{t('s4Title')}</h2>
                <p>{t('s4Intro')}</p>

                <div className="classification-table-wrap">
                  <table className="classification-table">
                    <thead>
                      <tr>
                        <th>{t('s4ColCountry')}</th>
                        <th>{t('s4ColRegulator')}</th>
                        <th>{t('s4ColLicenseType')}</th>
                        <th>{t('s4ColCapabilities')}</th>
                        <th>{t('s4ColNetwork')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['sa', 'uae', 'kw', 'bh', 'om', 'qa'] as const).map((key) => (
                        <tr key={key}>
                          <td><strong>{t(`s4Row_${key}_country`)}</strong></td>
                          <td>{t(`s4Row_${key}_regulator`)}</td>
                          <td><span className="license-badge">{t(`s4Row_${key}_license`)}</span></td>
                          <td>{t(`s4Row_${key}_capabilities`)}</td>
                          <td className="td-highlight">{t(`s4Row_${key}_network`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p>{t('s4P1')}</p>

                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    {[1, 2, 3, 4].map((n) => (
                      <li key={n}>{t(`s4Source${n}`)}</li>
                    ))}
                  </ol>
                </div>
              </section>

              {/* SECTION 5 — Competitive Licensing Gap */}
              <section id="section-5" className="fade-up article-section article-prose">
                <h2>{t('s5Title')}</h2>
                <p>{t('s5Intro')}</p>

                <div className="capability-table-wrap">
                  <table className="capability-table">
                    <thead>
                      <tr>
                        <th>{t('s5ColProvider')}</th>
                        <th className="provider-highlight">{t('s5ColTap')}</th>
                        <th>{t('s5ColHyperPay')}</th>
                        <th>{t('s5ColPayTabs')}</th>
                        <th>{t('s5ColMoyasar')}</th>
                        <th>{t('s5ColTelr')}</th>
                        <th>{t('s5ColAmazon')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['sa', 'uae', 'kw', 'bh', 'om', 'qa'] as const).map((key) => (
                        <tr key={key}>
                          <td>{t(`s5Row_${key}_label`)}</td>
                          <td className="provider-highlight"><span className="check-yes">&#10003;</span></td>
                          <td dangerouslySetInnerHTML={{ __html: t.raw(`s5Row_${key}_hyperpay`) }} />
                          <td dangerouslySetInnerHTML={{ __html: t.raw(`s5Row_${key}_paytabs`) }} />
                          <td dangerouslySetInnerHTML={{ __html: t.raw(`s5Row_${key}_moyasar`) }} />
                          <td dangerouslySetInnerHTML={{ __html: t.raw(`s5Row_${key}_telr`) }} />
                          <td dangerouslySetInnerHTML={{ __html: t.raw(`s5Row_${key}_amazon`) }} />
                        </tr>
                      ))}
                      <tr style={{ background: 'var(--muted-bg)', fontWeight: 600 }}>
                        <td>{t('s5TotalLabel')}</td>
                        <td className="provider-highlight" style={{ fontSize: '18px' }}><span className="td-highlight" style={{ color: 'var(--accent)' }}>6 / 6</span></td>
                        <td>2 / 6</td>
                        <td>3-4 / 6</td>
                        <td>1 / 6</td>
                        <td>1 / 6</td>
                        <td>2-3 / 6</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p>{t('s5P1')}</p>

                <div className="expert-callout">
                  <p>{t('s5CalloutText')}</p>
                  <cite>{t('s5CalloutCite')}</cite>
                </div>
              </section>

              {/* SECTION 6 — What Coverage Unlocks */}
              <section id="section-6" className="fade-up article-section article-prose">
                <h2>{t('s6Title')}</h2>
                <p>{t('s6Intro')}</p>

                <figure className="article-image article-image--supporting">
                  <img src="/assets/articles/article-tap-regulatory-moat-3.webp" alt={t('s6ImageAlt')} />
                  <figcaption>{t('s6ImageCaption')}</figcaption>
                </figure>

                <div className="feature-grid">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="feature-card">
                      <div className="feature-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      </div>
                      <h4>{t(`s6Feature${n}Title`)}</h4>
                      <p>{t(`s6Feature${n}Desc`)}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Mid-Article CTA */}
              <AffiliateMidArticle
                partner="tap"
                heading="Ready to Accept GCC Payments?"
                description="One integration. Six markets. 25+ payment methods including mada, KNET, and Apple Pay."
                buttonText="Visit Tap Payments"
              />

              {/* SECTION 7 — MENA Market Trajectory */}
              <section id="section-7" className="fade-up article-section article-prose">
                <h2>{t('s7Title')}</h2>
                <p>{t('s7Intro')}</p>

                <figure className="article-image article-image--atmospheric">
                  <img src="/assets/articles/article-tap-regulatory-moat-4.webp" alt={t('s7ImageAlt')} />
                  <figcaption>{t('s7ImageCaption')}</figcaption>
                </figure>

                <div className="metric-trend-grid">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="metric-trend-card">
                      <div className="metric-trend-value">{t(`s7Metric${n}Value`)}</div>
                      <div className="metric-trend-label">{t(`s7Metric${n}Label`)}</div>
                      <div className="metric-trend-detail">{t(`s7Metric${n}Detail`)}</div>
                      <div className="metric-trend-badge">
                        <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /></svg>
                        {t(`s7Metric${n}Badge`)}
                      </div>
                    </div>
                  ))}
                </div>

                <p>{t('s7P1')}</p>
                <p>{t('s7P2')}</p>

                <div className="sources-block">
                  <h4>{t('sourcesLabel')}</h4>
                  <ol>
                    {[1, 2, 3, 4].map((n) => (
                      <li key={n}>{t(`s7Source${n}`)}</li>
                    ))}
                  </ol>
                </div>
              </section>

              {/* SECTION 8 — Merchant Experience Edge */}
              <section id="section-8" className="fade-up article-section article-prose">
                <h2>{t('s8Title')}</h2>
                <p>{t('s8Intro')}</p>

                <div className="testimonial-results-grid">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="testimonial-result-card">
                      <blockquote>{t(`s8Testimonial${n}Quote`)}</blockquote>
                      <cite>{t(`s8Testimonial${n}Cite`)} <span className="cite-role">{t(`s8Testimonial${n}Role`)}</span></cite>
                      <div className="testimonial-result-stat">
                        <span className="stat-num">{t(`s8Testimonial${n}Stat`)}</span>
                        <span className="stat-desc">{t(`s8Testimonial${n}StatDesc`)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 9 — Strategic Implications */}
              <section id="section-9" className="fade-up article-section article-prose">
                <h2>{t('s9Title')}</h2>

                <figure className="article-image article-image--editorial">
                  <img src="/assets/articles/article-tap-regulatory-moat-5.webp" alt={t('s9ImageAlt')} />
                  <figcaption>{t('s9ImageCaption')}</figcaption>
                </figure>

                <p>{t('s9Intro')}</p>

                <div className="key-insight">
                  <h3>{t('s9InsightTitle')}</h3>
                  <p dangerouslySetInnerHTML={{ __html: t.raw('s9InsightText') }} />
                </div>

                <h3>{t('s9Sub1Title')}</h3>
                <p>{t('s9Sub1P')}</p>

                <h3>{t('s9Sub2Title')}</h3>
                <p>{t('s9Sub2P')}</p>

                <h3>{t('s9Sub3Title')}</h3>
                <p>{t('s9Sub3P')}</p>

                <div className="expert-callout">
                  <p>{t('s9CalloutText')}</p>
                  <cite>{t('s9CalloutCite')}</cite>
                </div>
              </section>

              {/* SECTION 10 — FAQ */}
              <section id="section-10" className="fade-up article-section article-prose">
                <h2>{t('s10Title')}</h2>

                <div className="faq-accordion">
                  <ArticleFaq items={[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
                    question: t(`s10Faq${n}Q`),
                    answer: t(`s10Faq${n}A`),
                  }))} />
                </div>
              </section>

              {/* SECTION 11 — The Bottom Line */}
              <section id="section-11" className="fade-up article-section article-prose">
                <h2>{t('s11Title')}</h2>
                <p>{t('s11Intro')}</p>

                <div className="summary-highlights">
                  <h3>{t('s11HighlightsTitle')}</h3>
                  <ul>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <li key={n} dangerouslySetInnerHTML={{ __html: t.raw(`s11Highlight${n}`) }} />
                    ))}
                  </ul>
                </div>

                <p>{t('s11Conclusion')}</p>
                <p className="last-updated">{t('lastUpdated')}</p>

                <AffiliateLink partner="tap">
                  Visit Tap Payments
                </AffiliateLink>

                <ShareButtons shareText={t('shareText')} />
              </section>

            </div>
          </div>
        </div>
      </main>
      <CallToAction />
      <Footer />
      <AffiliateMobileBar partner="tap" buttonText="Visit Tap Payments" />
    </>
  );
}
