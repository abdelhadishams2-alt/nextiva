import "@/styles/article.css";
import "@/styles/affiliate.css";
import "@/styles/article-case-study.css";
import Image from 'next/image';
import Link from 'next/link';
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
import { ArticleJsonLd } from '@/components/ui/ArticleJsonLd';
import { BreadcrumbJsonLd } from '@/components/ui/BreadcrumbJsonLd';

const tocItems = [
  { id: 'section-2', label: 'The Challenge' },
  { id: 'section-3', label: 'The Solution' },
  { id: 'section-4', label: 'Deployment Timeline' },
  { id: 'section-6', label: 'Before & After' },
  { id: 'section-7', label: 'Headline Results' },
  { id: 'section-8', label: 'Honest Challenges' },
  { id: 'section-9', label: 'Lessons Learned' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'The Challenge: Scale Broke the Paper-and-Excel Model' },
  { id: 'section-3', label: 'The Solution: A 45-Branch Foodics Rollout in Three Waves' },
  { id: 'section-4', label: 'The Deployment Timeline' },
  { id: 'section-6', label: 'Before and After: The Operational Metrics' },
  { id: 'section-7', label: 'The Headline Results After 12 Months' },
  { id: 'section-8', label: 'The Honest Challenges Along the Way' },
  { id: 'section-9', label: 'Five Lessons for Any Saudi Coffee Chain' },
];

export function generateStaticParams() {
  return [{ locale: 'en' }];
}

export async function generateMetadata() {
  const t = await getTranslations('Articles.rayyanCoffeeCaseStudy');
  const title = t('metaTitle');
  const description = t('metaDescription');
  return {
    title,
    description,
    keywords: 'Foodics case study, Saudi coffee chain Foodics, restaurant POS case study, coffee shop waste reduction, ZATCA Phase 2 coffee chain, multi-branch Foodics rollout, Saudi specialty coffee technology, Foodics ROI, Rayyan Coffee case study',
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/rayyan-coffee-foodics-case-study`,
      siteName: SITE_CONFIG.name,
      images: [{ url: `${SITE_CONFIG.url}/assets/articles/case-study-rayyan-hero.webp`, width: 1200, height: 630, alt: title }],
      type: 'article',
      publishedTime: '2026-04-20T00:00:00Z',
      authors: [SITE_CONFIG.author],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_CONFIG.url}/assets/articles/case-study-rayyan-hero.webp`],
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/rayyan-coffee-foodics-case-study`,
    },
  };
}

export default async function RayyanCoffeeCaseStudyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Articles.rayyanCoffeeCaseStudy');

  const profileCells = [
    { labelKey: 'profileCompanyLabel', valueKey: 'profileCompanyValue' },
    { labelKey: 'profileIndustryLabel', valueKey: 'profileIndustryValue' },
    { labelKey: 'profileSizeLabel', valueKey: 'profileSizeValue' },
    { labelKey: 'profileLocationLabel', valueKey: 'profileLocationValue' },
    { labelKey: 'profileToolLabel', valueKey: 'profileToolValue' },
    { labelKey: 'profileTimelineLabel', valueKey: 'profileTimelineValue' },
  ];

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section article-hero">
          <div className="article-hero__bg">
            <Image src="/assets/articles/case-study-rayyan-hero.webp" alt={t('heroImageAlt')} fill priority fetchPriority="high" quality={80} sizes="100vw" placeholder="blur" blurDataURL="data:image/webp;base64,UklGRloAAABXRUJQVlA4IE4AAADQAQCdASoMAAcAA4BaJYgCdACpjGDMYAD2v6UW8VCY1lDBJzNNl6XX05uvDQ9zXhNlerSRsERgvqjriI2+yiM3WBYjVzhX6JccwugAAAA=" style={{ objectFit: 'cover' }} />
          </div>
          <div className="article-hero__overlay" />
          <div className="article-hero__content">
            <span className="article-hero__badge">{t('heroBadge')}</span>
            <h1>{t('heroTitle')}</h1>
            <p className="article-hero__subtitle">{t('heroSubtitle')}</p>
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
              <AffiliateSidebar partner="foodics" title="Foodics" buttonText="Explore Foodics" />
            </TOCSidebar>
            <div className="article-main">
              <TOCInline items={tocItemsFull} />

              <div className="author-box">
                <div className="author-avatar">{t('authorInitials')}</div>
                <div className="author-info">
                  <span className="author-name">{t('authorName')}</span>
                  <span className="author-meta">{t('authorMeta')}</span>
                </div>
              </div>

              <AffiliateDisclosure />

              {/* Illustrative / composite disclosure */}
              <aside className="case-disclosure" role="note" aria-label={t('disclosureTitle')}>
                <svg className="case-disclosure__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <div className="case-disclosure__body">
                  <h3>{t('disclosureTitle')}</h3>
                  <p>{t('disclosureBody')}</p>
                </div>
              </aside>

              {/* Company profile facts grid */}
              <div className="case-profile" aria-label={t('profileLabel')}>
                {profileCells.map(({ labelKey, valueKey }) => (
                  <div key={labelKey} className="case-profile__item">
                    <span className="case-profile__label">{t(labelKey)}</span>
                    <span className="case-profile__value">{t(valueKey)}</span>
                  </div>
                ))}
                <div className="case-profile__item case-profile__item--full">
                  <span className="case-profile__label">{t('profileResultLabel')}</span>
                  <span className="case-profile__value">{t('profileResultValue')}</span>
                </div>
              </div>

              {/* SECTION 2 -- The Challenge */}
              <section id="section-2" className="fade-up article-section">
                <h2>{t('s2Title')}</h2>
                <p className="lead-paragraph">{t('s2Lead')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/case-study-rayyan-pos.webp" alt="Hands operating a tablet-based restaurant point-of-sale system at a cafe counter" width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>Pre-Foodics, baristas juggled five aggregator tablets per counter — a pattern repeated across most MENA multi-branch chains.</figcaption>
                </figure>
                <ol className="case-challenge-list">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <li key={n} className="case-challenge-list__item">
                      <span className="case-challenge-list__number">{String(n).padStart(2, '0')}</span>
                      <div className="case-challenge-list__body">
                        <h3>{t(`s2Challenge${n}Title`)}</h3>
                        <p>{t(`s2Challenge${n}Desc`)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              {/* SECTION 3 -- The Solution */}
              <section id="section-3" className="fade-up article-section">
                <h2>{t('s3Title')}</h2>
                <p className="lead-paragraph">{t('s3Lead')}</p>
                <p>{t('s3P1')}</p>
                <p>{t('s3P2')}</p>
              </section>

              {/* SECTION 4 -- Deployment Timeline */}
              <section id="section-4" className="fade-up article-section">
                <h2>{t('s4Title')}</h2>
                <p>{t('s4Lead')}</p>
                <ol className="case-timeline">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <li key={n} className="case-timeline__item">
                      <h3 className="case-timeline__title">{t(`s4Milestone${n}Title`)}</h3>
                      <p className="case-timeline__desc">{t(`s4Milestone${n}Desc`)}</p>
                    </li>
                  ))}
                </ol>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/case-study-rayyan-branches.webp" alt="Isometric map of Saudi Arabia with glowing pins representing a multi-branch coffee chain network" width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>Rollout sequenced by region: Riyadh (22 branches) first, then Jeddah (14), then Eastern Province (9).</figcaption>
                </figure>
              </section>

              {/* SECTION 5 -- Pull Quote */}
              <blockquote className="case-pullquote fade-up">
                <p className="case-pullquote__text">{t('s5Quote')}</p>
                <cite className="case-pullquote__attribution">{t('s5QuoteAttribution')}</cite>
              </blockquote>

              {/* SECTION 6 -- Before and After */}
              <section id="section-6" className="fade-up article-section">
                <h2>{t('s6Title')}</h2>
                <p>{t('s6Lead')}</p>
                <div className="case-ba-grid" role="table" aria-label={t('s6Title')}>
                  <div className="case-ba-grid__header" role="row">
                    <div role="columnheader">Metric</div>
                    <div role="columnheader">{t('s6BeforeLabel')}</div>
                    <div role="columnheader">{t('s6AfterLabel')}</div>
                  </div>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="case-ba-grid__row" role="row">
                      <div className="case-ba-grid__metric" role="cell">{t(`s6Row${n}Metric`)}</div>
                      <div className="case-ba-grid__before" role="cell" data-label={t('s6BeforeLabel')}>{t(`s6Row${n}Before`)}</div>
                      <div className="case-ba-grid__after" role="cell" data-label={t('s6AfterLabel')}>{t(`s6Row${n}After`)}</div>
                    </div>
                  ))}
                </div>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/case-study-rayyan-waste.webp" alt="Commercial coffee grinder, precisely labeled bean jars, and a digital scale — representing disciplined inventory tracking" width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>Gram-level tracking of beans and milk is what turned a ~14% waste rate into ~3%.</figcaption>
                </figure>
              </section>

              {/* SECTION 7 -- Headline Results */}
              <section id="section-7" className="fade-up article-section">
                <h2>{t('s7Title')}</h2>
                <p className="lead-paragraph">{t('s7Lead')}</p>
                <div className="case-metrics">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="case-metrics__tile">
                      <span className="case-metrics__value">{t(`s7Metric${n}Value`)}</span>
                      <span className="case-metrics__label">{t(`s7Metric${n}Label`)}</span>
                      <span className="case-metrics__sub">{t(`s7Metric${n}Sub`)}</span>
                    </div>
                  ))}
                </div>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/case-study-rayyan-dashboard.webp" alt="Laptop showing generic analytics dashboard on a warm wood desk beside a latte and coffee beans" width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>The regional data champions spent the first 90 days living inside the Foodics reporting dashboards.</figcaption>
                </figure>
              </section>

              {/* SECTION 8 -- Honest Challenges */}
              <section id="section-8" className="fade-up article-section">
                <h2>{t('s8Title')}</h2>
                <p>{t('s8Lead')}</p>
                <div className="case-challenge-list">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="case-challenge-list__item">
                      <span className="case-challenge-list__number">{String(n).padStart(2, '0')}</span>
                      <div className="case-challenge-list__body">
                        <h3>{t(`s8Challenge${n}Title`)}</h3>
                        <p>{t(`s8Challenge${n}Desc`)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 9 -- Lessons Learned */}
              <section id="section-9" className="fade-up article-section">
                <h2>{t('s9Title')}</h2>
                <p className="lead-paragraph">{t('s9Lead')}</p>
                <div className="case-lessons">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="case-lessons__card">
                      <div className="case-lessons__header">
                        <span className="case-lessons__number">{String(n).padStart(2, '0')}</span>
                        <h3>{t(`s9Lesson${n}Title`)}</h3>
                      </div>
                      <p>{t(`s9Lesson${n}Desc`)}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 10 -- Closing CTA */}
              <section className="case-cta fade-up">
                <h2>{t('s10Title')}</h2>
                <p>{t('s10Body')}</p>
                <Link href={t('s10CtaLink')} className="case-cta__btn">{t('s10CtaText')}</Link>
              </section>

              <ShareButtons shareText={t('heroTitle')} />
            </div>
          </div>
        </div>
      </main>
      <CallToAction />
      <Footer />
      <AffiliateMobileBar partner="foodics" buttonText="Explore Foodics" />
      <ArticleJsonLd
        title={t('metaTitle')}
        description={t('metaDescription')}
        datePublished="2026-04-20T00:00:00Z"
        dateModified="2026-04-20T00:00:00Z"
        image={`${SITE_CONFIG.url}/assets/articles/case-study-rayyan-hero.webp`}
        url={`${SITE_CONFIG.url}/rayyan-coffee-foodics-case-study`}
      />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: '/' },
        { name: 'Guides', url: '/blogs' },
        { name: t('metaTitle'), url: '/rayyan-coffee-foodics-case-study' },
      ]} />
    </>
  );
}
