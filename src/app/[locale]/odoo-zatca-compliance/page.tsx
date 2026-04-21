import "@/styles/article.css";
import "@/styles/affiliate.css";
import "@/styles/faq.css";
import "@/styles/verdict-scorecard.css";
import "@/styles/odoo-zatca.css";
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SITE_CONFIG } from '@/config/site';
import ReadingProgress from '@/components/ui/ReadingProgress';
import TOCSidebar from '@/components/ui/TOCSidebar';
import TOCInline from '@/components/ui/TOCInline';
import ShareButtons from '@/components/ui/ShareButtons';
import dynamic from 'next/dynamic';
const FadeUpObserver = dynamic(() => import('@/components/ui/FadeUpObserver'));
import { Navbar } from '@/components/sections/Navbar';
import { CallToAction } from '@/components/sections/CallToAction';
import { Footer } from '@/components/sections/Footer';
import AffiliateDisclosure from '@/components/ui/AffiliateDisclosure';
import AffiliateSidebar from '@/components/ui/AffiliateSidebar';
import AffiliateMobileBar from '@/components/ui/AffiliateMobileBar';
import AffiliateMidArticle from '@/components/ui/AffiliateMidArticle';
import { ArticleJsonLd } from '@/components/ui/ArticleJsonLd';
import { BreadcrumbJsonLd } from '@/components/ui/BreadcrumbJsonLd';
import { FaqJsonLd } from '@/components/ui/FaqJsonLd';

const tocItems = [
  { id: 'section-2', label: 'What Is ZATCA Phase 2' },
  { id: 'section-3', label: 'Compliance Requirements' },
  { id: 'section-4', label: 'Community vs Enterprise' },
  { id: 'section-5', label: 'Enterprise Setup Guide' },
  { id: 'section-6', label: 'Community Setup' },
  { id: 'section-7', label: 'Penalties' },
  { id: 'section-8', label: 'Odoo vs SAP vs Zoho' },
  { id: 'section-9', label: 'Common Mistakes' },
  { id: 'section-10', label: 'Pricing' },
  { id: 'section-11', label: 'Who Is It For' },
  { id: 'section-12', label: 'FAQ' },
  { id: 'section-13', label: 'Verdict' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'What Is ZATCA Phase 2 and Why Should Saudi SMEs Care?' },
  { id: 'section-3', label: 'What Makes an Invoice ZATCA Phase 2 Compliant?' },
  { id: 'section-4', label: 'Odoo Community vs Enterprise: Which Supports ZATCA?' },
  { id: 'section-5', label: 'Step-by-Step: Setting Up Odoo Enterprise for ZATCA' },
  { id: 'section-6', label: 'Setting Up Odoo Community (Third-Party Route)' },
  { id: 'section-7', label: 'ZATCA Penalties: What Happens If You Don\'t Comply' },
  { id: 'section-8', label: 'Odoo vs SAP vs Zoho: ZATCA Compliance Compared' },
  { id: 'section-9', label: 'Common ZATCA Setup Mistakes (and How to Avoid Them)' },
  { id: 'section-10', label: 'Odoo ZATCA Pricing: What It Actually Costs' },
  { id: 'section-11', label: 'Who Should Use Odoo for ZATCA Compliance?' },
  { id: 'section-12', label: 'Frequently Asked Questions' },
  { id: 'section-13', label: 'Final Verdict' },
];

export function generateStaticParams() {
  return [{ locale: 'en' }];
}

export async function generateMetadata() {
  const t = await getTranslations('Articles.odooSaudiArabia');
  const title = t('metaTitle');
  const description = t('metaDescription');
  return {
    title,
    description,
    keywords: 'Odoo ZATCA, ZATCA Phase 2, Odoo Saudi Arabia, ZATCA compliance, Odoo Enterprise, e-invoicing Saudi, ZATCA e-invoice Odoo, Saudi ERP, ZATCA penalties, Odoo vs SAP',
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/odoo-zatca-compliance`,
      siteName: SITE_CONFIG.name,
      images: [{ url: `${SITE_CONFIG.url}/assets/articles/odoo-saudi-arabia-1.webp`, width: 1200, height: 630, alt: title }],
      type: 'article',
      publishedTime: '2026-04-06T00:00:00Z',
      authors: [SITE_CONFIG.author],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_CONFIG.url}/assets/articles/odoo-saudi-arabia-1.webp`],
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/odoo-zatca-compliance`,
    },
  };
}

export default async function OdooSaudiArabiaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
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
            <Image src="/assets/articles/odoo-saudi-arabia-1.webp" alt={t('heroImageAlt')} fill priority style={{ objectFit: 'cover' }} />
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
              <AffiliateSidebar partner="odoo" title="Odoo Enterprise ERP" buttonText="Try Odoo Free" />
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
                <h3>{t('keyTakeawaysLabel')}</h3>
                <ul>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <li key={n}>{t(`keyTakeaway${n}`)}</li>
                  ))}
                </ul>
              </div>

              {/* SECTION 2 -- What Is ZATCA Phase 2 */}
              <section id="section-2" className="fade-up article-section">
                <h2>{t('s2Title')}</h2>
                <p className="lead-paragraph">{t('s2Lead')}</p>
                <p>{t('s2P1')}</p>
                <p>{t('s2P2')}</p>
                <p>{t('s2P3')}</p>
                <div className="mini-cards-grid">
                  {(['taxpayers', 'penalty', 'waves', 'deadline'] as const).map((key) => (
                    <div key={key} className="mini-card">
                      <h3>{t(`s2Card_${key}_value`)}</h3>
                      <p>{t(`s2Card_${key}_label`)}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 3 -- Compliance Requirements */}
              <section id="section-3" className="fade-up article-section">
                <h2>{t('s3Title')}</h2>
                <p>{t('s3Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/odoo-saudi-arabia-2.webp" alt={t('s3ImageAlt')} width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>{t('s3ImageCaption')}</figcaption>
                </figure>
                <div className="mini-cards-grid">
                  {(['xml', 'crypto', 'qr', 'uuid', 'api', 'arabic'] as const).map((key) => (
                    <div key={key} className="mini-card">
                      <span className="mini-card-badge">{t(`s3Feature_${key}_icon`)}</span>
                      <h3>{t(`s3Feature_${key}_title`)}</h3>
                      <p>{t(`s3Feature_${key}_desc`)}</p>
                    </div>
                  ))}
                </div>
                <p>{t('s3P1')}</p>
              </section>

              {/* SECTION 4 -- Community vs Enterprise */}
              <section id="section-4" className="fade-up article-section">
                <h2>{t('s4Title')}</h2>
                <p>{t('s4Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/odoo-saudi-arabia-3.webp" alt={t('s4ImageAlt')} width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>{t('s4ImageCaption')}</figcaption>
                </figure>

                <h3>{t('s4CommunityTitle')}</h3>
                <p>{t('s4CommunityP1')}</p>
                <ul>
                  {[1, 2, 3, 4].map((n) => (
                    <li key={n}>{t(`s4CommunityFeature${n}`)}</li>
                  ))}
                </ul>

                <h3>{t('s4EnterpriseTitle')}</h3>
                <p>{t('s4EnterpriseP1')}</p>
                <ul>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <li key={n}>{t(`s4EnterpriseFeature${n}`)}</li>
                  ))}
                </ul>

                <div className="data-table-wrap">
                  <table className="feature-matrix odoo-zatca__comparison-table">
                    <thead>
                      <tr>
                        <th>{t('s4ColFeature')}</th>
                        <th>{t('s4ColCommunity')}</th>
                        <th className="highlight-col">{t('s4ColEnterprise')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['zatca', 'xml', 'crypto', 'qr', 'api', 'coa', 'vat', 'arabic', 'pricing'] as const).map((key) => (
                        <tr key={key}>
                          <td>{t(`s4Row_${key}_label`)}</td>
                          <td>{t(`s4Row_${key}_community`)}</td>
                          <td className="highlight-col">{t(`s4Row_${key}_enterprise`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="expert-callout">
                  <p>{t('s4Callout')}</p>
                </div>
              </section>

              {/* SECTION 5 -- Enterprise Setup Guide */}
              <section id="section-5" className="fade-up article-section">
                <h2>{t('s5Title')}</h2>
                <p>{t('s5Intro')}</p>

                <h3>{t('s5Step1Title')}</h3>
                <p>{t('s5Step1P1')}</p>
                <p>{t('s5Step1P2')}</p>

                <h3>{t('s5Step2Title')}</h3>
                <p>{t('s5Step2P1')}</p>
                <ul>
                  {[1, 2, 3, 4].map((n) => (
                    <li key={n}>{t(`s5Step2Feature${n}`)}</li>
                  ))}
                </ul>

                <h3>{t('s5Step3Title')}</h3>
                <p>{t('s5Step3P1')}</p>
                <p>{t('s5Step3P2')}</p>
                <div className="expert-callout">
                  <p>{t('s5Step3P3')}</p>
                </div>

                <h3>{t('s5Step4Title')}</h3>
                <p>{t('s5Step4P1')}</p>
                <ul>
                  {[1, 2, 3, 4].map((n) => (
                    <li key={n}>{t(`s5Step4Feature${n}`)}</li>
                  ))}
                </ul>
                <p>{t('s5Step4P2')}</p>

                <h3>{t('s5Step5Title')}</h3>
                <p>{t('s5Step5P1')}</p>
                <p>{t('s5Step5P2')}</p>

                <h3>{t('s5Step6Title')}</h3>
                <p>{t('s5Step6P1')}</p>
                <p>{t('s5Step6P2')}</p>

                <h3>{t('s5Step7Title')}</h3>
                <p>{t('s5Step7P1')}</p>
                <p>{t('s5Step7P2')}</p>
              </section>

              {/* Mid-Article CTA */}
              <AffiliateMidArticle
                partner="odoo"
                heading="Try Odoo Enterprise for ZATCA Compliance"
                description="Built-in Saudi localization with ZATCA Phase 2, Arabic invoicing, and VAT 15% pre-configured."
                buttonText="Start Free Trial"
              />

              {/* SECTION 6 -- Community Third-Party Route */}
              <section id="section-6" className="fade-up article-section">
                <h2>{t('s6Title')}</h2>
                <p>{t('s6Intro')}</p>
                <p>{t('s6P1')}</p>
                <div className="data-table-wrap">
                  <table className="scorecard-table odoo-zatca__modules-table">
                    <thead>
                      <tr>
                        <th>{t('s6ColModule')}</th>
                        <th>{t('s6ColDeveloper')}</th>
                        <th>{t('s6ColPrice')}</th>
                        <th>{t('s6ColRating')}</th>
                        <th>{t('s6ColSupport')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['m1', 'm2', 'm3'] as const).map((key) => (
                        <tr key={key}>
                          <td><strong>{t(`s6Row_${key}_module`)}</strong></td>
                          <td>{t(`s6Row_${key}_developer`)}</td>
                          <td>{t(`s6Row_${key}_price`)}</td>
                          <td>{t(`s6Row_${key}_rating`)}</td>
                          <td>{t(`s6Row_${key}_support`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>{t('s6P2')}</p>
                <p>{t('s6P3')}</p>
                <div className="expert-callout">
                  <p>{t('s6Callout')}</p>
                </div>
              </section>

              {/* SECTION 7 -- Penalties */}
              <section id="section-7" className="fade-up article-section">
                <h2>{t('s7Title')}</h2>
                <p>{t('s7Intro')}</p>
                <div className="mini-cards-grid">
                  {([1, 2, 3, 4] as const).map((n) => (
                    <div key={n} className="mini-card odoo-zatca__penalty-card">
                      <span className="mini-card-badge odoo-zatca__penalty-badge">{t(`s7Penalty${n}Amount`)}</span>
                      <h3>{t(`s7Penalty${n}Title`)}</h3>
                      <p>{t(`s7Penalty${n}Desc`)}</p>
                    </div>
                  ))}
                </div>
                <p>{t('s7P1')}</p>
                <div className="expert-callout">
                  <p>{t('s7Callout')}</p>
                </div>
              </section>

              {/* SECTION 8 -- Odoo vs SAP vs Zoho */}
              <section id="section-8" className="fade-up article-section">
                <h2>{t('s8Title')}</h2>
                <p>{t('s8Intro')}</p>
                <div className="data-table-wrap">
                  <table className="feature-matrix odoo-zatca__erp-table">
                    <thead>
                      <tr>
                        <th>{t('s8ColFeature')}</th>
                        <th className="highlight-col">{t('s8ColOdoo')}</th>
                        <th>{t('s8ColSAP')}</th>
                        <th>{t('s8ColZoho')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['zatca', 'xml', 'crypto', 'api', 'inventory', 'manufacturing', 'customization', 'pricing', 'implementation'] as const).map((key) => (
                        <tr key={key}>
                          <td>{t(`s8Row_${key}_label`)}</td>
                          <td className="highlight-col">{t(`s8Row_${key}_odoo`)}</td>
                          <td>{t(`s8Row_${key}_sap`)}</td>
                          <td>{t(`s8Row_${key}_zoho`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>{t('s8P1')}</p>
                <p>{t('s8P2')}</p>
                <div className="expert-callout">
                  <p>{t('s8Callout')}</p>
                </div>
              </section>

              {/* SECTION 9 -- Common Mistakes */}
              <section id="section-9" className="fade-up article-section">
                <h2>{t('s9Title')}</h2>
                <p>{t('s9Intro')}</p>
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="odoo-zatca__mistake-block">
                    <h3>{t(`s9Mistake${n}Title`)}</h3>
                    <p>{t(`s9Mistake${n}Desc`)}</p>
                  </div>
                ))}
                <p>{t('s9P1')}</p>
              </section>

              {/* SECTION 10 -- Pricing */}
              <section id="section-10" className="fade-up article-section">
                <h2>{t('s10Title')}</h2>
                <p>{t('s10Intro')}</p>
                <div className="data-table-wrap">
                  <table className="scorecard-table odoo-zatca__pricing-table">
                    <thead>
                      <tr>
                        <th>{t('s10ColScenario')}</th>
                        <th>{t('s10ColUsers')}</th>
                        <th>{t('s10ColSubscription')}</th>
                        <th>{t('s10ColImplementation')}</th>
                        <th>{t('s10ColTotal1Year')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['micro', 'small', 'medium'] as const).map((key) => (
                        <tr key={key}>
                          <td><strong>{t(`s10Row_${key}_scenario`)}</strong></td>
                          <td>{t(`s10Row_${key}_users`)}</td>
                          <td>{t(`s10Row_${key}_subscription`)}</td>
                          <td>{t(`s10Row_${key}_implementation`)}</td>
                          <td>{t(`s10Row_${key}_total`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>{t('s10P1')}</p>
                <p>{t('s10P2')}</p>
                <div className="expert-callout">
                  <p>{t('s10Callout')}</p>
                </div>
              </section>

              {/* SECTION 11 -- Who Is It For */}
              <section id="section-11" className="fade-up article-section">
                <h2>{t('s11Title')}</h2>
                <p>{t('s11Intro')}</p>
                <div className="mini-cards-grid">
                  {(['sme', 'manufacturing', 'multiCompany', 'existing'] as const).map((key) => (
                    <div key={key} className="mini-card">
                      <h3>{t(`s11Card_${key}_title`)}</h3>
                      <p>{t(`s11Card_${key}_desc`)}</p>
                    </div>
                  ))}
                </div>
                <p>{t('s11P1')}</p>
              </section>

              {/* SECTION 12 -- FAQ */}
              <section id="section-12" className="fade-up article-section">
                <h2>{t('s12Title')}</h2>
                <div className="shopify-guide__faq-list">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <details key={n} className="shopify-guide__faq-item">
                      <summary>
                        <span className="shopify-guide__faq-question">
                          <span className="shopify-guide__faq-number">{String(n).padStart(2, '0')}</span>
                          {t(`s12Q${n}`)}
                        </span>
                        <span className="shopify-guide__faq-chevron" />
                      </summary>
                      <p>{t(`s12A${n}`)}</p>
                    </details>
                  ))}
                </div>
              </section>

              {/* SECTION 13 -- Verdict */}
              <section id="section-13" className="fade-up article-section article-section--verdict article-section--verdict-bg">
                <Image
                  src="/assets/articles/odoo-zatca-verdict-bg.webp"
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 1280px"
                  quality={80}
                  className="article-verdict__bg-image"
                  loading="lazy"
                />
                <div className="article-verdict__overlay" />
                <span className="article-verdict__badge">{t('verdictBadge')}</span>
                <h2>{t('s13Title')}</h2>
                <div className="foodics-review__verdict-card">
                  <div className="foodics-review__verdict-score">
                    <span className="foodics-review__verdict-number">{t('s13Score')}</span>
                    <span className="foodics-review__verdict-max">{t('s13ScoreMax')}</span>
                  </div>
                  <div className="foodics-review__verdict-breakdown">
                    {(['zatca', 'ease', 'value', 'features', 'support'] as const).map((key) => (
                      <div key={key} className="foodics-review__verdict-row">
                        <span className="foodics-review__verdict-label">{t(`s13Cat_${key}_label`)}</span>
                        <div className="foodics-review__verdict-bar-track">
                          <div className="foodics-review__verdict-bar-fill" style={{ width: t(`s13Cat_${key}_width`) }} />
                        </div>
                        <span className="foodics-review__verdict-bar-value">{t(`s13Cat_${key}_score`)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p>{t('s13P1')}</p>
                <p>{t('s13P2')}</p>
                <p>{t('s13P3')}</p>
              </section>

              {/* Conclusion CTA */}
              <AffiliateMidArticle
                partner="odoo"
                variant="conclusion"
                heading="Our Pick for Saudi SME ZATCA Compliance"
                description="Odoo Enterprise scores 4.3/5 — the best mid-market ERP for ZATCA Phase 2 in Saudi Arabia."
                buttonText="Try Odoo Free"
              />

              <ShareButtons shareText={t('shareText')} />

            </div>
          </div>
        </div>
      </main>
      <CallToAction />
      <Footer />
      <AffiliateMobileBar partner="odoo" buttonText="Try Odoo Free" />
      <ArticleJsonLd
        title={t('metaTitle')}
        description={t('metaDescription')}
        url={`${SITE_CONFIG.url}/odoo-zatca-compliance`}
        image={`${SITE_CONFIG.url}/assets/articles/odoo-saudi-arabia-1.webp`}
        datePublished="2026-04-06"
        dateModified="2026-04-06"
      />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: '/' },
        { name: 'Guides', url: '/blogs' },
        { name: t('metaTitle'), url: '/odoo-zatca-compliance' },
      ]} />
      <FaqJsonLd items={[1, 2, 3, 4, 5, 6].map((n) => ({
        question: t(`s12Q${n}`),
        answer: (t.raw(`s12A${n}`) as string).replace(/<[^>]+>/g, ''),
      }))} />
    </>
  );
}
