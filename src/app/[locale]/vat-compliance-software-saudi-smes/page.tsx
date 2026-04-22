import "@/styles/article.css";
import "@/styles/affiliate.css";
import "@/styles/faq.css";
import "@/styles/article-vat-compliance-saudi-smes.css";
import Image from 'next/image';
import { BLUR_DATA_URL } from '@/lib/blur-placeholder';
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
  { id: 'section-2', label: 'The Wave 24 Deadline' },
  { id: 'section-3', label: 'Phase 2 Compliance Primer' },
  { id: 'section-4', label: 'Our Scoring Framework' },
  { id: 'section-5', label: 'The 7 Contenders' },
  { id: 'section-6', label: 'Feature Matrix' },
  { id: 'section-7', label: 'Pricing & Hidden Costs' },
  { id: 'section-8', label: 'Implementation Pitfalls' },
  { id: 'section-9', label: 'ZATCA Reimbursement' },
  { id: 'section-10', label: 'Best-For Picks' },
  { id: 'section-11', label: 'FAQ' },
  { id: 'section-12', label: 'Verdict' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'The Deadline Most Saudi SMEs Are Still Underestimating' },
  { id: 'section-3', label: 'What "ZATCA Phase 2 Compliant" Actually Means' },
  { id: 'section-4', label: 'How We Scored the 7 Platforms' },
  { id: 'section-5', label: 'The 7 Contenders' },
  { id: 'section-6', label: 'Feature Comparison Matrix' },
  { id: 'section-7', label: 'Pricing Breakdown and the Hidden Costs No One Quotes' },
  { id: 'section-8', label: '9 Implementation Pitfalls That Will Cost You' },
  { id: 'section-9', label: "ZATCA Reimbursement and the Monsha'at Mezaya Stack" },
  { id: 'section-10', label: 'Best-For Picks and Our Final Verdict' },
  { id: 'section-11', label: 'Frequently Asked Questions' },
  { id: 'section-12', label: 'The Bottom Line for Saudi SMEs in 2026' },
];

const criteriaKeys = ['integration', 'arabic', 'vat', 'pricing', 'integrations', 'offline', 'multibranch', 'payroll', 'audit', 'support'] as const;
const vendorKeys = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7'] as const;
const matrixRowKeys = ['integration', 'arabic', 'vat', 'pricing', 'integrations', 'offline', 'multibranch', 'payroll', 'support'] as const;
const pricingRowKeys = ['wafeq', 'zoho', 'qoyod', 'mezan', 'rewaa', 'odoo'] as const;
const bestForKeys = ['services', 'startup', 'project', 'retail', 'micro', 'oneTool', 'growth'] as const;
const verdictPickKeys = ['services', 'retail', 'startup', 'enterprise'] as const;

export function generateStaticParams() {
  return [{ locale: 'en' }];
}

export async function generateMetadata() {
  const t = await getTranslations('Articles.vatComplianceSaudiSmes');
  const title = t('metaTitle');
  const description = t('metaDescription');
  return {
    title,
    description,
    keywords: 'VAT software Saudi Arabia, ZATCA Phase 2 software, best VAT compliance software KSA, Wafeq, Zoho Books KSA, Qoyod, Mezan, Rewaa, Odoo Saudi Arabia, Daftra, Saudi SME accounting software, Fatoora, e-invoicing Saudi',
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/vat-compliance-software-saudi-smes`,
      siteName: SITE_CONFIG.name,
      images: [{ url: `${SITE_CONFIG.url}/assets/articles/vat-compliance-software-saudi-smes/hero-riyadh-office.webp`, width: 1200, height: 630, alt: title }],
      type: 'article',
      publishedTime: '2026-04-21T00:00:00Z',
      authors: [SITE_CONFIG.author],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_CONFIG.url}/assets/articles/vat-compliance-software-saudi-smes/hero-riyadh-office.webp`],
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/vat-compliance-software-saudi-smes`,
    },
  };
}

export default async function VatComplianceSaudiSmesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Articles.vatComplianceSaudiSmes');

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section article-hero">
          <div className="article-hero__bg">
            <Image src="/assets/articles/vat-compliance-software-saudi-smes/hero-riyadh-office.webp" alt={t('heroImageAlt')} fill priority fetchPriority="high" quality={80} sizes="100vw" placeholder="blur" blurDataURL="data:image/webp;base64,UklGRloAAABXRUJQVlA4IE4AAAAQAgCdASoMAAcAA4BaJZACdAEUVfm7jwXQAP7t65Ckrz5rUmn8NuXvMVpE3xKpkpzNZS7FtAK848K+19D/jU6qVKAZBlOI9SqlF+7VAAA=" style={{ objectFit: 'cover' }} />
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
              <AffiliateSidebar partner="wafeq" title="Wafeq Accounting" buttonText="Try Wafeq Free" />
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

              {/* SECTION 2 — Deadline urgency */}
              <section id="section-2" className="fade-up article-section">
                <h2>{t('s2Title')}</h2>
                <p className="lead-paragraph">{t('s2Lead')}</p>
                <p>{t('s2P1')}</p>
                <p>{t('s2P2')}</p>
                <p>{t('s2P3')}</p>
                <div className="mini-cards-grid">
                  {(['wave23', 'wave24', 'penalty', 'vat'] as const).map((key) => (
                    <div key={key} className={`mini-card ${key === 'wave24' || key === 'penalty' ? 'vat-saudi__deadline-card' : ''}`}>
                      <span className="mini-card-badge">{t(`s2Card_${key}_value`)}</span>
                      <p>{t(`s2Card_${key}_label`)}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 3 — Compliance Primer */}
              <section id="section-3" className="fade-up article-section">
                <h2>{t('s3Title')}</h2>
                <p>{t('s3Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/vat-compliance-software-saudi-smes/zatca-clearance-flow.webp" alt={t('s3ImageAlt')} width={1920} height={1071} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="eager" fetchPriority="low" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                  <figcaption>{t('s3ImageCaption')}</figcaption>
                </figure>
                <div className="mini-cards-grid">
                  {(['xml', 'csid', 'hash', 'qr', 'clearance', 'archive'] as const).map((key) => (
                    <div key={key} className="mini-card">
                      <span className="mini-card-badge">{t(`s3Feature_${key}_icon`)}</span>
                      <h3>{t(`s3Feature_${key}_title`)}</h3>
                      <p>{t(`s3Feature_${key}_desc`)}</p>
                    </div>
                  ))}
                </div>
                <p>{t('s3P1')}</p>
              </section>

              {/* SECTION 4 — Scoring framework */}
              <section id="section-4" className="fade-up article-section">
                <h2>{t('s4Title')}</h2>
                <p>{t('s4Intro')}</p>
                <div className="mini-cards-grid">
                  {criteriaKeys.map((key) => (
                    <div key={key} className="mini-card">
                      <h3>{t(`s4Crit_${key}_title`)}</h3>
                      <p>{t(`s4Crit_${key}_desc`)}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 5 — The 7 Contenders */}
              <section id="section-5" className="fade-up article-section">
                <h2>{t('s5Title')}</h2>
                <p>{t('s5Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/vat-compliance-software-saudi-smes/sme-owner-comparing.webp" alt={t('s5ImageAlt')} width={1920} height={1071} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="eager" fetchPriority="low" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                  <figcaption>{t('s5ImageCaption')}</figcaption>
                </figure>

                {vendorKeys.map((v) => (
                  <div key={v} className="vat-saudi__vendor-card">
                    <h3>{t(`s5${v}_name`)}</h3>
                    <p>{t(`s5${v}_overview`)}</p>
                    <dl className="vat-saudi__vendor-facts">
                      <dt>HQ</dt>
                      <dd>{t(`s5${v}_hq`)}</dd>
                      <dt>Certification</dt>
                      <dd>{t(`s5${v}_cert`)}</dd>
                      <dt>Pricing</dt>
                      <dd>{t(`s5${v}_pricing`)}</dd>
                      <dt>Arabic</dt>
                      <dd>{t(`s5${v}_arabic`)}</dd>
                      <dt>Strengths</dt>
                      <dd>{t(`s5${v}_strengths`)}</dd>
                      <dt>Weaknesses</dt>
                      <dd>{t(`s5${v}_weaknesses`)}</dd>
                      <dt>Best fit</dt>
                      <dd>{t(`s5${v}_bestfit`)}</dd>
                    </dl>
                  </div>
                ))}
              </section>

              {/* Mid-Article CTA */}
              <AffiliateMidArticle
                partner="wafeq"
                heading="Our Top Pick for Saudi SMEs: Wafeq"
                description="Clean bilingual UX, native Fatoora Phase 2 integration, unlimited users on Premium — essentially free in year one after the SAR 2,500 ZATCA reimbursement."
                buttonText="Start Wafeq Free Trial"
              />

              {/* SECTION 6 — Feature Matrix */}
              <section id="section-6" className="fade-up article-section">
                <h2>{t('s6Title')}</h2>
                <p>{t('s6Intro')}</p>
                <div className="data-table-wrap">
                  <table className="feature-matrix vat-saudi__matrix-table">
                    <thead>
                      <tr>
                        <th>{t('s6ColCriterion')}</th>
                        <th className="highlight-col">{t('s6ColWafeq')}</th>
                        <th>{t('s6ColZoho')}</th>
                        <th>{t('s6ColQoyod')}</th>
                        <th>{t('s6ColDaftra')}</th>
                        <th>{t('s6ColMezan')}</th>
                        <th>{t('s6ColRewaa')}</th>
                        <th>{t('s6ColOdoo')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matrixRowKeys.map((key) => (
                        <tr key={key}>
                          <td>{t(`s6Row_${key}_label`)}</td>
                          <td className="highlight-col">{t(`s6Row_${key}_wafeq`)}</td>
                          <td>{t(`s6Row_${key}_zoho`)}</td>
                          <td>{t(`s6Row_${key}_qoyod`)}</td>
                          <td>{t(`s6Row_${key}_daftra`)}</td>
                          <td>{t(`s6Row_${key}_mezan`)}</td>
                          <td>{t(`s6Row_${key}_rewaa`)}</td>
                          <td>{t(`s6Row_${key}_odoo`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="expert-callout">
                  <p>{t('s6Callout')}</p>
                </div>
              </section>

              {/* SECTION 7 — Pricing */}
              <section id="section-7" className="fade-up article-section">
                <h2>{t('s7Title')}</h2>
                <p>{t('s7Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/vat-compliance-software-saudi-smes/pos-invoice-counter.webp" alt={t('s7ImageAlt')} width={1920} height={1288} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="eager" fetchPriority="low" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                  <figcaption>{t('s7ImageCaption')}</figcaption>
                </figure>
                <div className="data-table-wrap">
                  <table className="scorecard-table vat-saudi__pricing-table">
                    <thead>
                      <tr>
                        <th>{t('s7ColVendor')}</th>
                        <th>{t('s7ColSubscription')}</th>
                        <th>{t('s7ColOnboarding')}</th>
                        <th>{t('s7ColNetY1')}</th>
                        <th>{t('s7ColNotes')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricingRowKeys.map((key) => (
                        <tr key={key}>
                          <td><strong>{t(`s7Row_${key}_vendor`)}</strong></td>
                          <td>{t(`s7Row_${key}_subscription`)}</td>
                          <td>{t(`s7Row_${key}_onboarding`)}</td>
                          <td>{t(`s7Row_${key}_netY1`)}</td>
                          <td>{t(`s7Row_${key}_notes`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>{t('s7P1')}</p>
              </section>

              {/* SECTION 8 — Pitfalls */}
              <section id="section-8" className="fade-up article-section">
                <h2>{t('s8Title')}</h2>
                <p>{t('s8Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/vat-compliance-software-saudi-smes/implementation-pitfalls.webp" alt={t('s8ImageAlt')} width={1920} height={1288} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="eager" fetchPriority="low" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                  <figcaption>{t('s8ImageCaption')}</figcaption>
                </figure>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <div key={n} className="vat-saudi__pitfall-block">
                    <h3>{t(`s8Pitfall${n}_title`)}</h3>
                    <p>{t(`s8Pitfall${n}_desc`)}</p>
                  </div>
                ))}
              </section>

              {/* SECTION 9 — Reimbursement */}
              <section id="section-9" className="fade-up article-section">
                <h2>{t('s9Title')}</h2>
                <p>{t('s9Intro')}</p>
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="vat-saudi__step-block">
                    <h3>{t(`s9Step${n}_title`)}</h3>
                    <p>{t(`s9Step${n}_desc`)}</p>
                  </div>
                ))}
                <div className="expert-callout">
                  <p>{t('s9Callout')}</p>
                </div>
              </section>

              {/* SECTION 10 — Best-For Picks */}
              <section id="section-10" className="fade-up article-section">
                <h2>{t('s10Title')}</h2>
                <p>{t('s10Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/vat-compliance-software-saudi-smes/team-evaluating.webp" alt={t('s10ImageAlt')} width={1920} height={1071} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="eager" fetchPriority="low" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                  <figcaption>{t('s10ImageCaption')}</figcaption>
                </figure>
                <div className="mini-cards-grid">
                  {bestForKeys.map((key) => (
                    <div key={key} className="mini-card">
                      <h3>{t(`s10BestFor_${key}_title`)}</h3>
                      <p>{t(`s10BestFor_${key}_desc`)}</p>
                    </div>
                  ))}
                </div>
                <p>{t('s10P1')}</p>
              </section>

              {/* SECTION 11 — FAQ */}
              <section id="section-11" className="fade-up article-section">
                <h2>{t('s11Title')}</h2>
                <div className="shopify-guide__faq-list">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <details key={n} className="shopify-guide__faq-item">
                      <summary>
                        <span className="shopify-guide__faq-question">
                          <span className="shopify-guide__faq-number">{String(n).padStart(2, '0')}</span>
                          {t(`s11Q${n}`)}
                        </span>
                        <span className="shopify-guide__faq-chevron" />
                      </summary>
                      <p>{t(`s11A${n}`)}</p>
                    </details>
                  ))}
                </div>
              </section>

              {/* SECTION 12 — Verdict (dark bg + best-for grid) */}
              <section id="section-12" className="fade-up article-section article-section--verdict article-section--verdict-bg">
                <Image
                  src="/assets/articles/vat-compliance-software-saudi-smes/verdict-bg.webp"
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 1280px"
                  quality={80}
                  className="article-verdict__bg-image"
                  loading="eager" fetchPriority="low"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
                <div className="article-verdict__overlay" />
                <span className="article-verdict__badge">{t('verdictBadge')}</span>
                <h2>{t('s12Title')}</h2>
                <p className="lead-paragraph">{t('s12Intro')}</p>
                <div className="vat-saudi__verdict-grid">
                  {verdictPickKeys.map((key) => {
                    const score = t(`s12Verdict_${key}_score`);
                    return (
                      <div key={key} className="vat-saudi__verdict-card">
                        <span className="vat-saudi__verdict-label">{t(`s12Verdict_${key}_label`)}</span>
                        <div className="vat-saudi__verdict-product">
                          <span className="vat-saudi__verdict-product-name">{t(`s12Verdict_${key}_vendor`)}</span>
                          <span className="vat-saudi__verdict-product-score">{score}{t('s12ScoreMax')}</span>
                        </div>
                        <div className="vat-saudi__verdict-score-bar">
                          <div className="vat-saudi__verdict-score-fill" style={{ width: `${(parseFloat(score) / 5) * 100}%` }} />
                        </div>
                        <p>{t(`s12Verdict_${key}_reason`)}</p>
                      </div>
                    );
                  })}
                </div>
                <p>{t('s12Close')}</p>
              </section>

              {/* Conclusion CTA */}
              <AffiliateMidArticle
                partner="wafeq"
                variant="conclusion"
                heading="Our Pick: Wafeq for Saudi SME Phase 2 Compliance"
                description="4.5/5 — the best bilingual SME accounting tool for ZATCA Phase 2 in 2026. Free trial, no credit card required."
                buttonText="Try Wafeq Free"
              />

              <ShareButtons shareText={t('shareText')} />

            </div>
          </div>
        </div>
      </main>
      <CallToAction />
      <Footer />
      <AffiliateMobileBar partner="wafeq" buttonText="Try Wafeq Free" />
      <ArticleJsonLd
        title={t('metaTitle')}
        description={t('metaDescription')}
        url={`${SITE_CONFIG.url}/vat-compliance-software-saudi-smes`}
        image={`${SITE_CONFIG.url}/assets/articles/vat-compliance-software-saudi-smes/hero-riyadh-office.webp`}
        datePublished="2026-04-21"
        dateModified="2026-04-21"
      />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: '/' },
        { name: 'Guides', url: '/blogs' },
        { name: t('metaTitle'), url: '/vat-compliance-software-saudi-smes' },
      ]} />
      <FaqJsonLd items={[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
        question: t(`s11Q${n}`),
        answer: (t.raw(`s11A${n}`) as string).replace(/<[^>]+>/g, ''),
      }))} />
    </>
  );
}
