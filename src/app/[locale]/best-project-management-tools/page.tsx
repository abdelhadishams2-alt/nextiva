import "@/styles/article.css";
import "@/styles/affiliate.css";
import "@/styles/faq.css";
import "@/styles/article-best-pm-tools.css";
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
  { id: 'section-2', label: 'Why PM Tools Matter' },
  { id: 'section-3', label: 'Quick Comparison' },
  { id: 'section-4', label: 'Solo & Freelancers' },
  { id: 'section-5', label: 'Small Teams (2-10)' },
  { id: 'section-6', label: 'Mid-Sized (11-50)' },
  { id: 'section-7', label: 'Enterprise (50+)' },
  { id: 'section-8', label: 'Others' },
  { id: 'section-9', label: 'How to Choose' },
  { id: 'section-10', label: 'Pricing' },
  { id: 'section-11', label: 'Verdict' },
  { id: 'section-12', label: 'FAQ' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'Why Project Management Tools Are Non-Negotiable in 2026' },
  { id: 'section-3', label: 'Quick Comparison: 10 PM Tools at a Glance' },
  { id: 'section-4', label: 'Solo & Freelancers: Best Tools for One-Person Operations' },
  { id: 'section-5', label: 'Small Teams (2-10): Best Tools for Growing Startups' },
  { id: 'section-6', label: 'Mid-Sized Teams (11-50): Best Tools for Scaling Operations' },
  { id: 'section-7', label: 'Enterprise (50+): Best Tools for Complex Organizations' },
  { id: 'section-8', label: 'Airtable, Smartsheet & Regional Alternatives' },
  { id: 'section-9', label: 'How to Choose the Right PM Tool for Your Team' },
  { id: 'section-10', label: 'Full Pricing Comparison' },
  { id: 'section-11', label: 'Our Verdict: Which PM Tool Should You Choose?' },
  { id: 'section-12', label: 'Frequently Asked Questions' },
];

export function generateStaticParams() {
  return [{ locale: 'en' }];
}

export async function generateMetadata() {
  const t = await getTranslations('Articles.bestProjectManagement');
  const title = t('metaTitle');
  const description = t('metaDescription');
  return {
    title,
    description,
    keywords: 'best project management tools, project management software, ClickUp, Monday.com, Asana, Notion, Jira, Trello, PM tools comparison, project management 2026',
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/best-project-management-tools`,
      siteName: SITE_CONFIG.name,
      images: [{ url: `${SITE_CONFIG.url}/assets/articles/best-pm-tools-1.webp`, width: 1200, height: 630, alt: title }],
      type: 'article',
      publishedTime: '2026-04-07T00:00:00Z',
      authors: [SITE_CONFIG.author],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_CONFIG.url}/assets/articles/best-pm-tools-1.webp`],
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/best-project-management-tools`,
    },
  };
}

export default async function BestProjectManagementToolsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Articles.bestProjectManagement');

  return (
    <>
      <ReadingProgress />
      <FadeUpObserver />
      <Navbar transparent />

      <main>
        {/* HERO */}
        <section id="section-1" className="article-section article-hero">
          <div className="article-hero__bg">
            <Image src="/assets/articles/best-pm-tools-1.webp" alt={t('heroImageAlt')} fill priority fetchPriority="high" quality={80} sizes="100vw" placeholder="blur" blurDataURL="data:image/webp;base64,UklGRk4AAABXRUJQVlA4IEIAAAAQAgCdASoMAAcAA4BaJZACdAECpW3D6zwAAP7t4ZNeWdnAzqn1XAPA5D2Adag2xOXzKjpRARGLZlqwL8LYYByAAAA=" style={{ objectFit: 'cover' }} />
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
              <AffiliateSidebar partner="clickup" title="ClickUp" buttonText="Try ClickUp Free" />
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

              {/* SECTION 2 -- Why PM Tools Matter */}
              <section id="section-2" className="fade-up article-section">
                <h2>{t('s2Title')}</h2>
                <p className="lead-paragraph">{t('s2Lead')}</p>
                <p>{t('s2P1')}</p>
                <p>{t('s2P2')}</p>
                <p>{t('s2P3')}</p>
              </section>

              {/* SECTION 3 -- Quick Comparison */}
              <section id="section-3" className="fade-up article-section">
                <h2>{t('s3Title')}</h2>
                <p>{t('s3Intro')}</p>
                <div className="data-table-wrap">
                  <table className="feature-matrix pm-tools__comparison-table">
                    <thead>
                      <tr>
                        <th>{t('s3ColPlatform')}</th>
                        <th>{t('s3ColBestFor')}</th>
                        <th>{t('s3ColStartingPrice')}</th>
                        <th>{t('s3ColFreeTier')}</th>
                        <th>{t('s3ColEaseOfUse')}</th>
                        <th>{t('s3ColRating')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['clickup', 'monday', 'asana', 'notion', 'jira', 'trello', 'wrike', 'basecamp', 'teamwork', 'msproject'] as const).map((key) => (
                        <tr key={key}>
                          <td><strong>{t(`s3Row_${key}_name`)}</strong></td>
                          <td>{t(`s3Row_${key}_bestFor`)}</td>
                          <td>{t(`s3Row_${key}_price`)}</td>
                          <td>{t(`s3Row_${key}_freeTier`)}</td>
                          <td>{t(`s3Row_${key}_ease`)}</td>
                          <td><span className="pm-tools__score">{t(`s3Row_${key}_rating`)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* SECTION 4 -- Solo & Freelancers */}
              <section id="section-4" className="fade-up article-section">
                <h2>{t('s4Title')}</h2>
                <p className="lead-paragraph">{t('s4Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/best-pm-tools-solo.webp" alt={t('s4ImageAlt')} width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>{t('s4ImageCaption')}</figcaption>
                </figure>

                <h3>{t('s4NotionTitle')}</h3>
                <p>{t('s4NotionP1')}</p>
                <p>{t('s4NotionP2')}</p>
                <div className="problem-solution-grid">
                  <div className="solution-col">
                    <h3>{t('s4NotionProsTitle')}</h3>
                    <ul>
                      {[1, 2, 3].map((n) => (<li key={n}>{t(`s4NotionPro${n}`)}</li>))}
                    </ul>
                  </div>
                  <div className="problem-col">
                    <h3>{t('s4NotionConsTitle')}</h3>
                    <ul>
                      {[1, 2].map((n) => (<li key={n}>{t(`s4NotionCon${n}`)}</li>))}
                    </ul>
                  </div>
                </div>

                <h3>{t('s4TrelloTitle')}</h3>
                <p>{t('s4TrelloP1')}</p>
                <div className="problem-solution-grid">
                  <div className="solution-col">
                    <h3>{t('s4TrelloProsTitle')}</h3>
                    <ul>
                      {[1, 2, 3].map((n) => (<li key={n}>{t(`s4TrelloPro${n}`)}</li>))}
                    </ul>
                  </div>
                  <div className="problem-col">
                    <h3>{t('s4TrelloConsTitle')}</h3>
                    <ul>
                      {[1, 2].map((n) => (<li key={n}>{t(`s4TrelloCon${n}`)}</li>))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* SECTION 5 -- Small Teams */}
              <section id="section-5" className="fade-up article-section">
                <h2>{t('s5Title')}</h2>
                <p className="lead-paragraph">{t('s5Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/best-pm-tools-small-team.webp" alt={t('s5ImageAlt')} width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>{t('s5ImageCaption')}</figcaption>
                </figure>

                <h3>{t('s5ClickUpTitle')}</h3>
                <p>{t('s5ClickUpP1')}</p>
                <p>{t('s5ClickUpP2')}</p>
                <div className="problem-solution-grid">
                  <div className="solution-col">
                    <h3>{t('s5ClickUpProsTitle')}</h3>
                    <ul>
                      {[1, 2, 3, 4].map((n) => (<li key={n}>{t(`s5ClickUpPro${n}`)}</li>))}
                    </ul>
                  </div>
                  <div className="problem-col">
                    <h3>{t('s5ClickUpConsTitle')}</h3>
                    <ul>
                      {[1, 2].map((n) => (<li key={n}>{t(`s5ClickUpCon${n}`)}</li>))}
                    </ul>
                  </div>
                </div>

                <h3>{t('s5MondayTitle')}</h3>
                <p>{t('s5MondayP1')}</p>
                <p>{t('s5MondayP2')}</p>
                <div className="problem-solution-grid">
                  <div className="solution-col">
                    <h3>{t('s5MondayProsTitle')}</h3>
                    <ul>
                      {[1, 2, 3].map((n) => (<li key={n}>{t(`s5MondayPro${n}`)}</li>))}
                    </ul>
                  </div>
                  <div className="problem-col">
                    <h3>{t('s5MondayConsTitle')}</h3>
                    <ul>
                      {[1, 2].map((n) => (<li key={n}>{t(`s5MondayCon${n}`)}</li>))}
                    </ul>
                  </div>
                </div>
              </section>

              <AffiliateMidArticle partner="clickup" heading="ClickUp" description="Free forever plan with unlimited members and 15+ views" buttonText="Try ClickUp Free" />

              {/* SECTION 6 -- Mid-Sized Teams */}
              <section id="section-6" className="fade-up article-section">
                <h2>{t('s6Title')}</h2>
                <p className="lead-paragraph">{t('s6Intro')}</p>

                <h3>{t('s6AsanaTitle')}</h3>
                <p>{t('s6AsanaP1')}</p>
                <p>{t('s6AsanaP2')}</p>
                <div className="problem-solution-grid">
                  <div className="solution-col">
                    <h3>{t('s6AsanaProsTitle')}</h3>
                    <ul>
                      {[1, 2, 3, 4].map((n) => (<li key={n}>{t(`s6AsanaPro${n}`)}</li>))}
                    </ul>
                  </div>
                  <div className="problem-col">
                    <h3>{t('s6AsanaConsTitle')}</h3>
                    <ul>
                      {[1, 2].map((n) => (<li key={n}>{t(`s6AsanaCon${n}`)}</li>))}
                    </ul>
                  </div>
                </div>

                <h3>{t('s6TeamworkTitle')}</h3>
                <p>{t('s6TeamworkP1')}</p>
                <div className="problem-solution-grid">
                  <div className="solution-col">
                    <h3>{t('s6TeamworkProsTitle')}</h3>
                    <ul>
                      {[1, 2, 3].map((n) => (<li key={n}>{t(`s6TeamworkPro${n}`)}</li>))}
                    </ul>
                  </div>
                  <div className="problem-col">
                    <h3>{t('s6TeamworkConsTitle')}</h3>
                    <ul>
                      {[1, 2].map((n) => (<li key={n}>{t(`s6TeamworkCon${n}`)}</li>))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* SECTION 7 -- Enterprise */}
              <section id="section-7" className="fade-up article-section">
                <h2>{t('s7Title')}</h2>
                <p className="lead-paragraph">{t('s7Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/best-pm-tools-enterprise.webp" alt={t('s7ImageAlt')} width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>{t('s7ImageCaption')}</figcaption>
                </figure>

                <h3>{t('s7JiraTitle')}</h3>
                <p>{t('s7JiraP1')}</p>
                <p>{t('s7JiraP2')}</p>
                <div className="problem-solution-grid">
                  <div className="solution-col">
                    <h3>{t('s7JiraProsTitle')}</h3>
                    <ul>
                      {[1, 2, 3, 4].map((n) => (<li key={n}>{t(`s7JiraPro${n}`)}</li>))}
                    </ul>
                  </div>
                  <div className="problem-col">
                    <h3>{t('s7JiraConsTitle')}</h3>
                    <ul>
                      {[1, 2].map((n) => (<li key={n}>{t(`s7JiraCon${n}`)}</li>))}
                    </ul>
                  </div>
                </div>

                <h3>{t('s7WrikeTitle')}</h3>
                <p>{t('s7WrikeP1')}</p>
                <div className="problem-solution-grid">
                  <div className="solution-col">
                    <h3>{t('s7WrikeProsTitle')}</h3>
                    <ul>
                      {[1, 2, 3].map((n) => (<li key={n}>{t(`s7WrikePro${n}`)}</li>))}
                    </ul>
                  </div>
                  <div className="problem-col">
                    <h3>{t('s7WrikeConsTitle')}</h3>
                    <ul>
                      {[1, 2].map((n) => (<li key={n}>{t(`s7WrikeCon${n}`)}</li>))}
                    </ul>
                  </div>
                </div>
              </section>

              <AffiliateMidArticle partner="monday" heading="Monday.com" description="Visual work OS with AI-powered automations for teams of all sizes" buttonText="Try Monday.com Free" variant="conclusion" />

              {/* SECTION 8 -- Others */}
              <section id="section-8" className="fade-up article-section">
                <h2>{t('s8Title')}</h2>
                <p>{t('s8Intro')}</p>
                <div className="article-others-list">
                  {(['airtable', 'smartsheet', 'basecamp'] as const).map((key) => {
                    const tiers = t(`s8_${key}_price`).split('|').map((s) => s.trim()).filter(Boolean);
                    return (
                      <article key={key} className="article-others-row">
                        <div className="article-others-main">
                          <h3>{t(`s8_${key}_name`)}</h3>
                          <p className="article-others-summary">{t(`s8_${key}_summary`)}</p>
                          <p className="article-others-verdict">{t(`s8_${key}_verdict`)}</p>
                        </div>
                        <aside className="article-others-pricing">
                          <span className="article-others-pricing-label">Pricing</span>
                          <ul className="article-others-pricing-list">
                            {tiers.map((tier, i) => (
                              <li key={i}>{tier}</li>
                            ))}
                          </ul>
                        </aside>
                      </article>
                    );
                  })}
                </div>
              </section>

              {/* SECTION 9 -- How to Choose */}
              <section id="section-9" className="fade-up article-section">
                <h2>{t('s9Title')}</h2>
                <p className="lead-paragraph">{t('s9Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <Image src="/assets/articles/best-pm-tools-analytics.webp" alt={t('s9ImageAlt')} width={1200} height={630} quality={80} sizes="(max-width: 768px) 100vw, 800px" loading="lazy" />
                  <figcaption>{t('s9ImageCaption')}</figcaption>
                </figure>
                <div className="article-factors-grid">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="article-factor-card">
                      <div className="article-factor-header">
                        <span className="article-factor-number">{String(n).padStart(2, '0')}</span>
                        <h3>{t(`s9Factor${n}Title`)}</h3>
                      </div>
                      <p>{t(`s9Factor${n}Desc`)}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 10 -- Pricing Table */}
              <section id="section-10" className="fade-up article-section">
                <h2>{t('s10Title')}</h2>
                <p>{t('s10Intro')}</p>
                <div className="data-table-wrap">
                  <table className="scorecard-table pm-tools__pricing-table">
                    <thead>
                      <tr>
                        <th>{t('s10ColPlatform')}</th>
                        <th>{t('s10ColFree')}</th>
                        <th>{t('s10ColStarter')}</th>
                        <th>{t('s10ColProfessional')}</th>
                        <th>{t('s10ColEnterprise')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['clickup', 'monday', 'asana', 'notion', 'jira', 'trello', 'wrike', 'basecamp', 'teamwork', 'msproject'] as const).map((key) => (
                        <tr key={key}>
                          <td><strong>{t(`s10Row_${key}_name`)}</strong></td>
                          <td>{t(`s10Row_${key}_free`)}</td>
                          <td>{t(`s10Row_${key}_starter`)}</td>
                          <td>{t(`s10Row_${key}_professional`)}</td>
                          <td>{t(`s10Row_${key}_enterprise`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* SECTION 11 -- Verdict */}
              <section id="section-11" className="fade-up article-section article-section--verdict article-section--verdict-bg">
                <Image
                  src="/assets/articles/best-pm-tools-verdict-bg.webp"
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 1280px"
                  quality={80}
                  className="article-verdict__bg-image"
                  loading="lazy"
                />
                <div className="article-verdict__overlay" />
                <span className="article-verdict__badge">{t('verdictBadge')}</span>
                <h2>{t('s11Title')}</h2>
                <p className="lead-paragraph">{t('s11Intro')}</p>
                <div className="pm-tools__verdict-grid">
                  {([
                    { cat: 'Solo', productKey: 'notion' },
                    { cat: 'SmallTeam', productKey: 'clickup' },
                    { cat: 'MidSize', productKey: 'asana' },
                    { cat: 'Enterprise', productKey: 'jira' },
                  ] as const).map(({ cat, productKey }) => {
                    const score = t(`s11_${productKey}_score`);
                    return (
                      <div key={cat} className="pm-tools__verdict-card">
                        <span className="pm-tools__verdict-label">{t(`s11Label${cat}`)}</span>
                        <div className="pm-tools__verdict-product">
                          <span className="pm-tools__verdict-product-name">{t(`s3Row_${productKey}_name`)}</span>
                          <span className="pm-tools__verdict-product-score">{score}{t('s11ScoreMax')}</span>
                        </div>
                        <div className="pm-tools__verdict-score-bar">
                          <div className="pm-tools__verdict-score-fill" style={{ width: `${(parseFloat(score) / 5) * 100}%` }} />
                        </div>
                        <p>{t(`s11Verdict${cat}`)}</p>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* SECTION 12 -- FAQ */}
              <section id="section-12" className="fade-up article-section">
                <h2>{t('s12Title')}</h2>
                <div className="shopify-guide__faq-list">
                  {[1, 2, 3, 4, 5].map((n) => (
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

              <ShareButtons shareText="From Chaos to Control: The Best Project Management Tools for Every Team Size (2026)" />
            </div>
          </div>
        </div>

        <CallToAction />
      </main>

      <Footer />
      <AffiliateMobileBar partner="clickup" buttonText="Try ClickUp Free" />
      <ArticleJsonLd
        title={t('metaTitle')}
        description={t('metaDescription')}
        url={`${SITE_CONFIG.url}/best-project-management-tools`}
        image={`${SITE_CONFIG.url}/assets/articles/best-pm-tools-1.webp`}
        datePublished="2026-04-07"
        dateModified="2026-04-07"
      />
      <BreadcrumbJsonLd items={[
        { name: 'Home', url: '/' },
        { name: 'Reviews', url: '/blogs' },
        { name: t('metaTitle'), url: '/best-project-management-tools' },
      ]} />
      <FaqJsonLd items={[1, 2, 3, 4, 5].map((n) => ({
        question: t(`s12Q${n}`),
        answer: (t.raw(`s12A${n}`) as string).replace(/<[^>]+>/g, ''),
      }))} />
    </>
  );
}
