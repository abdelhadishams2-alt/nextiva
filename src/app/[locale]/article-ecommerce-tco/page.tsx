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
  { id: 'section-2', label: 'Why TCO Matters' },
  { id: 'section-3', label: 'Market Landscape 2026' },
  { id: 'section-4', label: 'Platform Contenders' },
  { id: 'section-5', label: 'Tier 1: $10K\u2013$50K' },
  { id: 'section-6', label: 'Tier 2: $50K\u2013$100K' },
  { id: 'section-7', label: 'Tier 3: $100K\u2013$500K' },
  { id: 'section-8', label: 'Crossover Analysis' },
  { id: 'section-9', label: 'Migration Costs' },
  { id: 'section-10', label: 'Modernization Trends' },
  { id: 'section-11', label: 'TCO FAQ' },
  { id: 'section-12', label: 'Action Plan' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'Why TCO Beats Sticker Price' },
  { id: 'section-3', label: 'The $13.92B Platform Market in 2026' },
  { id: 'section-4', label: 'Platform Contenders at a Glance' },
  { id: 'section-5', label: 'TCO Breakdown: $10K\u2013$50K Revenue Tier' },
  { id: 'section-6', label: 'TCO Breakdown: $50K\u2013$100K Revenue Tier' },
  { id: 'section-7', label: 'TCO Breakdown: $100K\u2013$500K Revenue Tier' },
  { id: 'section-8', label: 'TCO Crossover Points: Where Platforms Flip' },
  { id: 'section-9', label: 'The Hidden Migration Tax' },
  { id: 'section-10', label: 'What 88% of Enterprises Know' },
  { id: 'section-11', label: 'Frequently Asked TCO Questions' },
  { id: 'section-12', label: 'Your Next Move' },
];

export async function generateMetadata() {
  const t = await getTranslations('Articles.articleEcommerceTco');
  const title = t('metaTitle');
  const description = t('metaDescription');
  return {
    title,
    description,
    keywords: 'ecommerce platform TCO, total cost of ownership, Shopify vs WooCommerce, BigCommerce pricing, ecommerce cost comparison, platform migration cost, ecommerce 2026',
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/article-ecommerce-tco`,
      siteName: SITE_CONFIG.name,
      images: [{ url: `${SITE_CONFIG.url}/assets/articles/article-ecommerce-tco-1.webp`, width: 1200, height: 630, alt: title }],
      type: 'article',
      publishedTime: '2026-03-24T00:00:00Z',
      authors: [SITE_CONFIG.author],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_CONFIG.url}/assets/articles/article-ecommerce-tco-1.webp`],
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/article-ecommerce-tco`,
    },
  };
}

export default async function ArticleEcommerceTcoPage() {
  const t = await getTranslations('Articles.articleEcommerceTco');

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
                <img src="/assets/articles/article-ecommerce-tco-1.webp" alt={t('heroImageAlt')} />
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
              <AffiliateSidebar partner="shopify" title="Compare Ecommerce Platforms" buttonText="Compare Plans Now" />
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

              {/* SECTION 2 — Why TCO Beats Sticker Price */}
              <section id="section-2" className="fade-up article-section">
                <h2>{t('s2Title')}</h2>
                <p className="lead-paragraph">{t('s2Lead')}</p>
                <p>{t('s2P1')}</p>
                <p>{t('s2P2')}</p>
                <div className="problem-solution-grid">
                  <div className="problem-col">
                    <h4><span>{'\u274C'}</span> {t('s2StickerTitle')}</h4>
                    <ul>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <li key={n}>{t(`s2Sticker${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="arrow-separator">{'\u2192'}</div>
                  <div className="solution-col">
                    <h4><span>{'\u2705'}</span> {t('s2TcoTitle')}</h4>
                    <ul>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <li key={n} dangerouslySetInnerHTML={{ __html: t.raw(`s2Tco${n}`) }} />
                      ))}
                    </ul>
                  </div>
                </div>
                <p>{t('s2P3')}</p>
              </section>

              {/* SECTION 3 — Market Data */}
              <section id="section-3" className="fade-up article-section">
                <h2>{t('s3Title')}</h2>
                <p>{t('s3Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-ecommerce-tco-2.webp" alt={t('s3ImageAlt')} />
                  <figcaption>{t('s3ImageCaption')}</figcaption>
                </figure>
                <p>{t('s3P1')}</p>
                <div className="bar-chart-container">
                  {(['shopify', 'woocommerce', 'adobe', 'bigcommerce', 'salesforce', 'others'] as const).map((key) => (
                    <div key={key} className="bar-row">
                      <span className="bar-label">{t(`s3Bar_${key}_label`)}</span>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: t(`s3Bar_${key}_width`), background: t(`s3Bar_${key}_color`) }} />
                      </div>
                      <span className="bar-value">{t(`s3Bar_${key}_value`)}</span>
                    </div>
                  ))}
                </div>
                <p className="inline-source">{t('s3BarSource')}</p>
                <p>{t('s3P2')}</p>
              </section>

              {/* SECTION 4 — Platform Contenders */}
              <section id="section-4" className="fade-up article-section">
                <h2>{t('s4Title')}</h2>
                <p>{t('s4Intro')}</p>
                <div className="mini-cards-grid">
                  {(['shopify', 'woocommerce', 'bigcommerce', 'adobe'] as const).map((key) => (
                    <div key={key} className="mini-card">
                      <span className="mini-card-badge" dangerouslySetInnerHTML={{ __html: t.raw(`s4Card_${key}_badge`) }} />
                      <h4>{t(`s4Card_${key}_title`)}</h4>
                      <p>{t(`s4Card_${key}_desc`)}</p>
                      <div className="mini-card-tag">{t(`s4Card_${key}_tag`)}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 5 — TCO Tier 1 */}
              <section id="section-5" className="fade-up article-section">
                <h2>{t('s5Title')}</h2>
                <p>{t('s5Intro1')}</p>
                <p>{t('s5Intro2')}</p>
                <div className="data-table-wrap">
                  <table className="scorecard-table">
                    <thead>
                      <tr>
                        <th>{t('s5ColBucket')}</th>
                        <th>{t('s5ColShopify')}</th>
                        <th>{t('s5ColWoo')}</th>
                        <th>{t('s5ColBigC')}</th>
                        <th>{t('s5ColAdobe')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['subscription', 'transactionFees', 'paymentProcessing', 'appsPlugins', 'hosting', 'devCustomization', 'maintenance'] as const).map((key) => (
                        <tr key={key}>
                          <td>{t(`s5Row_${key}_label`)}</td>
                          <td dangerouslySetInnerHTML={{ __html: t.raw(`s5Row_${key}_shopify`) }} />
                          <td dangerouslySetInnerHTML={{ __html: t.raw(`s5Row_${key}_woo`) }} />
                          <td dangerouslySetInnerHTML={{ __html: t.raw(`s5Row_${key}_bigc`) }} />
                          <td dangerouslySetInnerHTML={{ __html: t.raw(`s5Row_${key}_adobe`) }} />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="scorecard-overall">
                  <span>{t('s5TotalLabel')}</span>
                  <span>{t('s5TotalValues')}</span>
                </div>
                <p>{t('s5P1')}</p>
                <p className="inline-source">{t('s5Sources')}</p>
              </section>

              {/* SECTION 6 — TCO Tier 2 */}
              <section id="section-6" className="fade-up article-section">
                <h2>{t('s6Title')}</h2>
                <p>{t('s6Intro')}</p>
                <figure className="article-image article-image--supporting">
                  <img src="/assets/articles/article-ecommerce-tco-3.webp" alt={t('s6ImageAlt')} />
                  <figcaption>{t('s6ImageCaption')}</figcaption>
                </figure>
                <p>{t('s6P1')}</p>
                <div className="comparison-bars-container">
                  <div className="comparison-legend">
                    <span><span className="legend-dot" style={{ background: 'var(--accent)' }} /> {t('s6LegendShopify')}</span>
                    <span><span className="legend-dot" style={{ background: '#7c3aed' }} /> {t('s6LegendWoo')}</span>
                  </div>
                  {(['subscription', 'transactionFees', 'paymentProcessing', 'appsPlugins', 'hosting', 'devMaintenance'] as const).map((key) => (
                    <div key={key} className="comparison-row">
                      <div className="comparison-center-label">{t(`s6Bar_${key}_label`)}</div>
                      <div className="comparison-bar-left">
                        <div className="comparison-bar-track-left" style={{ width: t(`s6Bar_${key}_leftWidth`), background: 'var(--accent)' }} />
                        <span className="comparison-val comparison-val-left">{t(`s6Bar_${key}_leftVal`)}</span>
                      </div>
                      <div className="comparison-bar-right">
                        <div className="comparison-bar-track-right" style={{ width: t(`s6Bar_${key}_rightWidth`), background: '#7c3aed' }} />
                        <span className="comparison-val comparison-val-right">{t(`s6Bar_${key}_rightVal`)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p dangerouslySetInnerHTML={{ __html: t.raw('s6P2') }} />
                <p>{t('s6P3')}</p>
                <p className="inline-source">{t('s6Sources')}</p>
              </section>

              {/* SECTION 7 — TCO Tier 3 */}
              <section id="section-7" className="fade-up article-section">
                <h2>{t('s7Title')}</h2>
                <p>{t('s7Intro')}</p>
                <div className="data-table-wrap">
                  <table className="feature-matrix">
                    <thead>
                      <tr>
                        <th>{t('s7ColCapability')}</th>
                        <th>{t('s7ColShopifyPlus')}</th>
                        <th className="highlight-col">{t('s7ColWoo')}</th>
                        <th>{t('s7ColBigCEnt')}</th>
                        <th>{t('s7ColAdobe')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['subscription', 'transactionFee', 'paymentProcessing', 'hosting', 'appsExtensions', 'devCustomization', 'maintenance', 'customCheckout', 'multiStore', 'headless'] as const).map((key) => (
                        <tr key={key}>
                          <td>{t(`s7Row_${key}_label`)}</td>
                          <td dangerouslySetInnerHTML={{ __html: t.raw(`s7Row_${key}_shopify`) }} />
                          <td className="highlight-col" dangerouslySetInnerHTML={{ __html: t.raw(`s7Row_${key}_woo`) }} />
                          <td dangerouslySetInnerHTML={{ __html: t.raw(`s7Row_${key}_bigc`) }} />
                          <td dangerouslySetInnerHTML={{ __html: t.raw(`s7Row_${key}_adobe`) }} />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p dangerouslySetInnerHTML={{ __html: t.raw('s7P1') }} />
                <div className="expert-callout">
                  <p>{t('s7ExpertQuote')}</p>
                  <cite>{t('s7ExpertCite')}</cite>
                </div>
                <p>{t('s7P2')}</p>
                <p className="inline-source">{t('s7Sources')}</p>
              </section>

              {/* Mid-Article CTA */}
              <AffiliateMidArticle
                partner="shopify"
                heading="Compare Platforms Now"
                description="See the real cost breakdown before choosing your e-commerce platform."
                buttonText="Compare Plans Now"
              />

              {/* SECTION 8 — Crossover Points */}
              <section id="section-8" className="fade-up article-section">
                <h2>{t('s8Title')}</h2>
                <p>{t('s8Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-ecommerce-tco-4.webp" alt={t('s8ImageAlt')} />
                  <figcaption>{t('s8ImageCaption')}</figcaption>
                </figure>
                <div className="stacked-chart-container">
                  <div className="chart-legend">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="chart-legend-item">
                        <span className="chart-legend-swatch" style={{ background: t(`s8Legend${n}Color`) }} />
                        {t(`s8Legend${n}Label`)}
                      </div>
                    ))}
                  </div>
                  <div className="chart-tiers">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="chart-tier">
                        <div className="chart-tier-label">{t(`s8Tier${n}Label`)}</div>
                        <div className="chart-tier-value">{t(`s8Tier${n}Value`)}</div>
                        <div className="chart-tier-sub">{t(`s8Tier${n}Sub`)}</div>
                        <div className="chart-stack-row">
                          <div className="chart-stack-bar">
                            {[1, 2, 3, 4].map((s) => (
                              <div
                                key={s}
                                className="chart-stack-segment"
                                style={{
                                  width: t(`s8Tier${n}Seg${s}Width`),
                                  background: t(`s8Tier${n}Seg${s}Color`),
                                }}
                              >
                                {t(`s8Tier${n}Seg${s}Text`)}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p>{t('s8P1')}</p>
                <p>{t('s8P2')}</p>
                <p className="inline-source">{t('s8Sources')}</p>
              </section>

              {/* SECTION 9 — Migration Tax */}
              <section id="section-9" className="fade-up article-section">
                <h2>{t('s9Title')}</h2>
                <p>{t('s9Intro')}</p>
                <div className="big-stat-card">
                  <span className="big-stat-badge">{t('s9StatBadge')}</span>
                  <div className="big-stat-number">{t('s9StatNumber')}</div>
                  <div className="big-stat-label">{t('s9StatLabel')}</div>
                  <div className="big-stat-desc">{t('s9StatDesc')}</div>
                </div>
                <p>{t('s9P1')}</p>
                <p>{t('s9P2')}</p>
                <p>{t('s9P3')}</p>
                <p className="inline-source">{t('s9Sources')}</p>
              </section>

              {/* SECTION 10 — Modernization Trends */}
              <section id="section-10" className="fade-up article-section">
                <h2>{t('s10Title')}</h2>
                <p>{t('s10Intro')}</p>
                <figure className="article-image article-image--atmospheric">
                  <img src="/assets/articles/article-ecommerce-tco-5.webp" alt={t('s10ImageAlt')} />
                  <figcaption>{t('s10ImageCaption')}</figcaption>
                </figure>
                <div className="two-col-grid">
                  <div className="two-col-item">
                    <h4>{t('s10ModTitle')}</h4>
                    <p>{t('s10ModIntro')}</p>
                    <ul>
                      {[1, 2, 3, 4].map((n) => (
                        <li key={n}>{t(`s10Mod${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="two-col-item">
                    <h4>{t('s10AioTitle')}</h4>
                    <p>{t('s10AioIntro')}</p>
                    <ul>
                      {[1, 2, 3, 4].map((n) => (
                        <li key={n}>{t(`s10Aio${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="expert-callout">
                  <p>{t('s10ExpertQuote')}</p>
                  <cite>{t('s10ExpertCite')}</cite>
                </div>
                <p dangerouslySetInnerHTML={{ __html: t.raw('s10P1') }} />
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

              {/* SECTION 12 — Action Plan */}
              <section id="section-12" className="fade-up article-section">
                <h2>{t('s12Title')}</h2>
                <p>{t('s12Intro')}</p>
                <div className="action-panel">
                  <h4>{t('s12PanelTitle')}</h4>
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

              <AffiliateLink partner="shopify">
                Compare Plans Now
              </AffiliateLink>

              <ShareButtons shareText={t('shareText')} />

            </div>
          </div>
        </div>
      </main>
      <CallToAction />
      <Footer />
      <AffiliateMobileBar partner="shopify" buttonText="Compare Plans Now" />
    </>
  );
}
