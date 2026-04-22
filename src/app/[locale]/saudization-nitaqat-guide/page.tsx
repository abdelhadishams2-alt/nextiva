import "@/styles/article.css";
import "@/styles/affiliate.css";
import "@/styles/faq.css";
import "@/styles/article-saudization-nitaqat.css";
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

const tocItems = [
  { id: 'section-2', label: 'Why It Got Harder in 2026' },
  { id: 'section-3', label: 'The Nitaqat Bands' },
  { id: 'section-4', label: 'Weighted Saudisation' },
  { id: 'section-5', label: 'Profession Expansions' },
  { id: 'section-6', label: 'Compliance Ecosystem' },
  { id: 'section-7', label: '10-Step Playbook' },
  { id: 'section-8', label: 'Penalties' },
  { id: 'section-9', label: 'HRDF Levers' },
  { id: 'section-10', label: 'HR Software' },
  { id: 'section-11', label: 'Pitfalls' },
  { id: 'section-12', label: 'Verdict' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'Why Nitaqat Just Got Harder in 2026' },
  { id: 'section-3', label: 'How the Nitaqat Bands Actually Work in 2026' },
  { id: 'section-4', label: 'Weighted Saudisation Counting — the Rule That Catches Most SMEs' },
  { id: 'section-5', label: 'The 2025–26 Profession Expansions — Sector by Sector' },
  { id: 'section-6', label: 'The Compliance Ecosystem: Qiwa, Mudad, GOSI, Muqeem, Ajeer' },
  { id: 'section-7', label: 'The 10-Step SME Compliance Playbook' },
  { id: 'section-8', label: 'Penalties & the Real Cost of Non-Compliance' },
  { id: 'section-9', label: "HRDF Support Levers — the Money You're Leaving on the Table" },
  { id: 'section-10', label: 'HR Software That Keeps SMEs in the Green' },
  { id: 'section-11', label: 'Common Nitaqat Pitfalls — Check These First' },
  { id: 'section-12', label: 'Our Verdict: Which HR Stack Keeps an SME in the Green?' },
];

const urgencyCardKeys = ['yellow', 'waves', 'wps', 'najiz'] as const;
const bandKeys = ['platinum', 'highGreen', 'midGreen', 'lowGreen', 'yellow', 'red'] as const;
const weightKeys = ['standard', 'mid', 'low', 'woman', 'disability', 'exPrisoner', 'parttime', 'gcc', 'owner'] as const;
const professionRowKeys = ['accounting', 'pharmacy', 'engineering', 'techEng', 'dentistry', 'hr', 'cashier', 'marketing'] as const;
const platformKeys = ['qiwa', 'mudad', 'gosi', 'muqeem', 'ajeer', 'najiz'] as const;
const stepNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const penaltyKeys = ['role', 'permit', 'mismatch', 'recruit', 'wps', 'records', 'article30'] as const;
const leverKeys = ['hadaf', 'tamheer', 'doroob', 'tourism'] as const;
const vendorKeys = ['jisr', 'zenhr', 'bayzat', 'mudad', 'darwinbox', 'sap'] as const;
const pitfallNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const verdictPickKeys = ['services', 'growth', 'insurance', 'micro'] as const;

export function generateStaticParams() {
  return [{ locale: 'en' }];
}

export async function generateMetadata() {
  const t = await getTranslations('Articles.saudizationNitaqatGuide');
  const title = t('metaTitle');
  const description = t('metaDescription');
  return {
    title,
    description,
    keywords: 'Saudization, Nitaqat, Qiwa, Mudad, GOSI, HRSD, HRDF, Hadaf, Tamheer, Saudi labor law, Nitaqat bands, weighted Saudisation, Ajeer, Najiz, WPS Saudi Arabia, Jisr, ZenHR, Bayzat, Saudi HR software',
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/saudization-nitaqat-guide`,
      siteName: SITE_CONFIG.name,
      images: [{ url: `${SITE_CONFIG.url}/assets/articles/saudization-nitaqat-guide/hero-riyadh-kafd.webp`, width: 1200, height: 630, alt: title }],
      type: 'article',
      publishedTime: '2026-04-21T00:00:00Z',
      authors: [SITE_CONFIG.author],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_CONFIG.url}/assets/articles/saudization-nitaqat-guide/hero-riyadh-kafd.webp`],
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/saudization-nitaqat-guide`,
    },
  };
}

export default async function SaudizationNitaqatGuidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Articles.saudizationNitaqatGuide');

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section article-hero">
          <div className="article-hero__bg">
            <Image src="/assets/articles/saudization-nitaqat-guide/hero-riyadh-kafd.webp" alt={t('heroImageAlt')} fill priority fetchPriority="high" quality={80} sizes="100vw" placeholder="blur" blurDataURL="data:image/webp;base64,UklGRkQAAABXRUJQVlA4IDgAAAAQAgCdASoMAAcAA4BaJYwCdIExGBaEn1XAAP68hJDjIbr0L96rpHvEEVFg2wWbDa8P6gyzAJyoAA==" style={{ objectFit: 'cover' }} />
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
              <AffiliateSidebar partner="zoho" title="Zoho People HRIS" buttonText="Try Zoho People" />
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

              {/* SECTION 2 — Why it got harder */}
              <section id="section-2" className="fade-up article-section">
                <h2>{t('s2Title')}</h2>
                <p className="lead-paragraph">{t('s2Lead')}</p>
                <p>{t('s2P1')}</p>
                <p>{t('s2P2')}</p>
                <p>{t('s2P3')}</p>
                <div className="mini-cards-grid">
                  {urgencyCardKeys.map((key) => (
                    <div key={key} className="mini-card">
                      <span className="mini-card-badge">{t(`s2Card_${key}_value`)}</span>
                      <p>{t(`s2Card_${key}_label`)}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 3 — Bands */}
              <section id="section-3" className="fade-up article-section">
                <h2>{t('s3Title')}</h2>
                <p>{t('s3Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/saudization-nitaqat-guide/nitaqat-bands-abstract.webp" alt={t('s3ImageAlt')} width={1920} height={1288} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>{t('s3ImageCaption')}</figcaption>
                </figure>
                {bandKeys.map((key) => (
                  <div key={key} className={`nitaqat__band-card nitaqat__band-card--${key}`}>
                    <h3>{t(`s3Band_${key}_label`)}</h3>
                    <p>{t(`s3Band_${key}_desc`)}</p>
                  </div>
                ))}
                <p>{t('s3P1')}</p>
              </section>

              {/* SECTION 4 — Weighted counting */}
              <section id="section-4" className="fade-up article-section">
                <h2>{t('s4Title')}</h2>
                <p>{t('s4Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/saudization-nitaqat-guide/workforce-office.webp" alt={t('s4ImageAlt')} width={1920} height={1071} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>{t('s4ImageCaption')}</figcaption>
                </figure>
                <div className="mini-cards-grid">
                  {weightKeys.map((key) => (
                    <div key={key} className="nitaqat__weight-card">
                      <h3>{t(`s4Weight_${key}_label`)}</h3>
                      <p>{t(`s4Weight_${key}_desc`)}</p>
                    </div>
                  ))}
                </div>
                <p>{t('s4P1')}</p>
              </section>

              {/* Mid-article CTA */}
              <AffiliateMidArticle
                partner="zoho"
                heading="Track Saudisation and Payroll in One Dashboard"
                description="Zoho People integrates with GOSI, Mudad, and Qiwa workflows and scales from a 5-person SME to 500+. Free trial."
                buttonText="Try Zoho People Free"
              />

              {/* SECTION 5 — Profession expansions */}
              <section id="section-5" className="fade-up article-section">
                <h2>{t('s5Title')}</h2>
                <p>{t('s5Intro')}</p>
                <div className="data-table-wrap">
                  <table className="feature-matrix nitaqat__profession-table">
                    <thead>
                      <tr>
                        <th>{t('s5ColProfession')}</th>
                        <th>{t('s5ColRate')}</th>
                        <th>{t('s5ColEffective')}</th>
                        <th>{t('s5ColThreshold')}</th>
                        <th>{t('s5ColRuling')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {professionRowKeys.map((key) => (
                        <tr key={key}>
                          <td><strong>{t(`s5Row_${key}_profession`)}</strong></td>
                          <td>{t(`s5Row_${key}_rate`)}</td>
                          <td>{t(`s5Row_${key}_effective`)}</td>
                          <td>{t(`s5Row_${key}_threshold`)}</td>
                          <td>{t(`s5Row_${key}_ruling`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="expert-callout">
                  <p>{t('s5Callout')}</p>
                </div>
              </section>

              {/* SECTION 6 — Compliance ecosystem */}
              <section id="section-6" className="fade-up article-section">
                <h2>{t('s6Title')}</h2>
                <p>{t('s6Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/saudization-nitaqat-guide/compliance-ecosystem.webp" alt="Saudi SME owner checking compliance dashboards on a smartphone" width={1920} height={1288} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>Owners now log into five MHRSD-operated platforms on a regular cadence — Qiwa and Mudad at least weekly during hiring.</figcaption>
                </figure>
                <div className="mini-cards-grid">
                  {platformKeys.map((key) => (
                    <div key={key} className="mini-card">
                      <span className="mini-card-badge">{t(`s6Platform_${key}_icon`)}</span>
                      <h3>{t(`s6Platform_${key}_title`)}</h3>
                      <p>{t(`s6Platform_${key}_desc`)}</p>
                    </div>
                  ))}
                </div>
                <p>{t('s6P1')}</p>
              </section>

              {/* SECTION 7 — 10-step playbook */}
              <section id="section-7" className="fade-up article-section">
                <h2>{t('s7Title')}</h2>
                <p>{t('s7Intro')}</p>
                {stepNumbers.map((n) => (
                  <div key={n} className="nitaqat__step-block">
                    <h3>{t(`s7Step${n}_title`)}</h3>
                    <p>{t(`s7Step${n}_desc`)}</p>
                  </div>
                ))}
              </section>

              {/* SECTION 8 — Penalties */}
              <section id="section-8" className="fade-up article-section">
                <h2>{t('s8Title')}</h2>
                <p>{t('s8Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/saudization-nitaqat-guide/najdi-courtyard.webp" alt={t('s8ImageAlt')} width={1920} height={1288} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>{t('s8ImageCaption')}</figcaption>
                </figure>
                <div className="mini-cards-grid">
                  {penaltyKeys.map((key) => (
                    <div key={key} className="mini-card nitaqat__penalty-card">
                      <span className="mini-card-badge nitaqat__penalty-badge">{t(`s8Penalty_${key}_amount`)}</span>
                      <h3>{t(`s8Penalty_${key}_label`)}</h3>
                      <p>{t(`s8Penalty_${key}_desc`)}</p>
                    </div>
                  ))}
                </div>
                <p>{t('s8P1')}</p>
              </section>

              {/* SECTION 9 — HRDF levers */}
              <section id="section-9" className="fade-up article-section">
                <h2>{t('s9Title')}</h2>
                <p>{t('s9Intro')}</p>
                {leverKeys.map((key) => (
                  <div key={key} className="nitaqat__lever-card">
                    <h3>{t(`s9Lever_${key}_title`)}</h3>
                    <p>{t(`s9Lever_${key}_desc`)}</p>
                  </div>
                ))}
                <p>{t('s9P1')}</p>
              </section>

              {/* SECTION 10 — HR software */}
              <section id="section-10" className="fade-up article-section">
                <h2>{t('s10Title')}</h2>
                <p>{t('s10Intro')}</p>
                {vendorKeys.map((key) => (
                  <div key={key} className="nitaqat__vendor-block">
                    <h3>{t(`s10Vendor_${key}_name`)}</h3>
                    <p>{t(`s10Vendor_${key}_desc`)}</p>
                  </div>
                ))}
                <p>{t('s10P1')}</p>
              </section>

              {/* SECTION 11 — Pitfalls */}
              <section id="section-11" className="fade-up article-section">
                <h2>{t('s11Title')}</h2>
                <p>{t('s11Intro')}</p>
                {pitfallNumbers.map((n) => (
                  <div key={n} className="nitaqat__pitfall-block">
                    <h3>{t(`s11Pitfall${n}_title`)}</h3>
                    <p>{t(`s11Pitfall${n}_desc`)}</p>
                  </div>
                ))}
              </section>

              {/* SECTION 12 — Verdict */}
              <section id="section-12" className="fade-up article-section article-section--verdict article-section--verdict-bg">
                <Image
                  src="/assets/articles/saudization-nitaqat-guide/verdict-bg.webp"
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 1280px"
                  quality={80}
                  className="article-verdict__bg-image"
                  loading="lazy"
                />
                <div className="article-verdict__overlay" />
                <span className="article-verdict__badge">{t('verdictBadge')}</span>
                <h2>{t('s12Title')}</h2>
                <p className="lead-paragraph">{t('s12Intro')}</p>
                <div className="nitaqat__verdict-grid">
                  {verdictPickKeys.map((key) => {
                    const score = t(`s12Verdict_${key}_score`);
                    return (
                      <div key={key} className="nitaqat__verdict-card">
                        <span className="nitaqat__verdict-label">{t(`s12Verdict_${key}_label`)}</span>
                        <div className="nitaqat__verdict-product">
                          <span className="nitaqat__verdict-product-name">{t(`s12Verdict_${key}_vendor`)}</span>
                          <span className="nitaqat__verdict-product-score">{score}{t('s12ScoreMax')}</span>
                        </div>
                        <div className="nitaqat__verdict-score-bar">
                          <div className="nitaqat__verdict-score-fill" style={{ width: `${(parseFloat(score) / 5) * 100}%` }} />
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
                partner="zoho"
                variant="conclusion"
                heading="The Easiest Way to Stay in the Green"
                description="Zoho People plus Zoho Payroll for KSA handles GOSI filings, payroll, and leave — the Nitaqat tracking becomes a background workflow. Free to start."
                buttonText="Try Zoho People Free"
              />

              <ShareButtons shareText={t('shareText')} />

            </div>
          </div>
        </div>
      </main>
      <CallToAction />
      <Footer />
      <AffiliateMobileBar partner="zoho" buttonText="Try Zoho People" />
      <ArticleJsonLd
        title={t('metaTitle')}
        description={t('metaDescription')}
        url={`${SITE_CONFIG.url}/saudization-nitaqat-guide`}
        image={`${SITE_CONFIG.url}/assets/articles/saudization-nitaqat-guide/hero-riyadh-kafd.webp`}
        datePublished="2026-04-21"
        dateModified="2026-04-21"
      />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: '/' },
        { name: 'Guides', url: '/blogs' },
        { name: t('metaTitle'), url: '/saudization-nitaqat-guide' },
      ]} />
    </>
  );
}
