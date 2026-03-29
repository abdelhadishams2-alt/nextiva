import { getTranslations } from 'next-intl/server';
import ReadingProgress from '@/components/ui/ReadingProgress';
import TOCSidebar from '@/components/ui/TOCSidebar';
import TOCInline from '@/components/ui/TOCInline';
import ShareButtons from '@/components/ui/ShareButtons';
import FadeUpObserver from '@/components/ui/FadeUpObserver';
import AffiliateDisclosure from '@/components/ui/AffiliateDisclosure';
import AffiliateLink from '@/components/ui/AffiliateLink';
import AffiliateSidebar from '@/components/ui/AffiliateSidebar';
import AffiliateMobileBar from '@/components/ui/AffiliateMobileBar';
import AffiliateMidArticle from '@/components/ui/AffiliateMidArticle';
import { Navbar } from '@/components/sections/Navbar';
import { CallToAction } from '@/components/sections/CallToAction';
import { Footer } from '@/components/sections/Footer';

const tocItems = [
  { id: 'section-2', label: 'Saudi Market' },
  { id: 'section-3', label: 'Prerequisites' },
  { id: 'section-4', label: 'Store Setup' },
  { id: 'section-5', label: 'Payment Gateways' },
  { id: 'section-6', label: 'Shipping & Logistics' },
  { id: 'section-7', label: 'ZATCA & VAT' },
  { id: 'section-8', label: 'Pre-Launch Checklist' },
  { id: 'section-9', label: 'Common Mistakes' },
  { id: 'section-10', label: 'Growth Strategies' },
  { id: 'section-11', label: 'Key Takeaways' },
  { id: 'section-12', label: 'Get Started' },
];

const tocItemsFull = [
  { id: 'section-2', label: 'The Saudi E-Commerce Landscape — Why Now?' },
  { id: 'section-3', label: 'Essential Prerequisites Before You Start' },
  { id: 'section-4', label: 'Setting Up Your Shopify Store for Saudi Arabia' },
  { id: 'section-5', label: 'Activating Saudi Payment Gateways' },
  { id: 'section-6', label: 'Configuring Shipping & Logistics' },
  { id: 'section-7', label: 'ZATCA Compliance & VAT Configuration' },
  { id: 'section-8', label: 'Pre-Launch Optimization Checklist' },
  { id: 'section-9', label: 'Common Mistakes to Avoid When Launching' },
  { id: 'section-10', label: 'Post-Launch Growth Strategies' },
  { id: 'section-11', label: 'Key Takeaways' },
  { id: 'section-12', label: 'Start Your Journey Now' },
];

export async function generateMetadata() {
  const t = await getTranslations('Articles.articleShopifySaudi');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: 'Shopify Saudi Arabia, ecommerce KSA, Saudi payment gateways, mada payments, Shopify store setup, ZATCA compliance, Saudi online store',
  };
}

export default async function ArticleShopifySaudiPage() {
  const t = await getTranslations('Articles.articleShopifySaudi');

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
              <img className="article-hero-bg" src="/assets/articles/article-shopify-saudi-1.webp" alt={t('heroImageAlt')} />
              <div className="article-hero-overlay" />
              <div className="article-hero-content">
                <span className="article-hero-tag">{t('heroBadge')}</span>
                <h1>{t('heroTitle')}</h1>
                <div className="article-hero-meta">
                  <span className="article-hero-meta-item">
                    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    {t('heroReadTime')}
                  </span>
                  <span className="article-hero-meta-item">
                    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    {t('heroDate')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container-article">
          <div className="article-layout">
            <TOCSidebar items={tocItems}>
              <AffiliateSidebar partner="shopify" title="Launch Your Saudi Store" buttonText="Try Shopify Free" />
            </TOCSidebar>
            <div className="article-main">
              <TOCInline items={tocItemsFull} />

              <div className="article-prose">
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

              {/* SECTION 2 — Market Opportunity */}
              <section id="section-2" className="fade-up article-section">
                <h2>{t('s2Title')}</h2>
                <p className="lead">{t('s2Lead')}</p>
                <p>{t('s2P1')}</p>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-shopify-saudi-2.webp" alt={t('s2ImageAlt')} />
                  <figcaption>{t('s2ImageCaption')}</figcaption>
                </figure>
                <div className="progress-bars-grid">
                  {[
                    { key: 1, width: '57%' },
                    { key: 2, width: '100%' },
                    { key: 3, width: '30%' },
                    { key: 4, width: '78%' },
                  ].map(({ key, width }) => (
                    <div key={key} className="progress-bar-card">
                      <div className="progress-bar-label">{t(`s2Stat${key}Label`)}</div>
                      <div className="progress-bar-value">{t(`s2Stat${key}Value`)}</div>
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width }} />
                      </div>
                      <div className="progress-bar-source">{t(`s2Stat${key}Source`)}</div>
                    </div>
                  ))}
                </div>
                <p>{t('s2P2')}</p>
                <p>{t('s2P3')}</p>
              </section>

              {/* SECTION 3 — Prerequisites */}
              <section id="section-3" className="fade-up article-section">
                <h2>{t('s3Title')}</h2>
                <p>{t('s3Intro')}</p>
                <div className="numbered-list">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="numbered-list__item">
                      <div className="numbered-list__badge">{n}</div>
                      <div className="numbered-list__content">
                        <h3>{t(`s3Item${n}Title`)}</h3>
                        <p>{t(`s3Item${n}Desc`)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="highlight-box">
                  <p>{t('s3Tip')}</p>
                </div>
              </section>

              {/* SECTION 4 — Store Setup */}
              <section id="section-4" className="fade-up article-section">
                <h2>{t('s4Title')}</h2>
                <p>{t('s4Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-shopify-saudi-3.webp" alt={t('s4ImageAlt')} />
                  <figcaption>{t('s4ImageCaption')}</figcaption>
                </figure>
                <div className="step-process">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="step-process__item">
                      <div className="step-process__number">{n}</div>
                      <div className="step-process__content">
                        <h3>{t(`s4Step${n}Title`)}</h3>
                        <p>{t(`s4Step${n}Desc`)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="testimonial-block">
                  <div className="testimonial-quote">
                    <p>{t('s4ExpertQuote')}</p>
                    <cite>{t('s4ExpertCite')}</cite>
                  </div>
                </div>
              </section>

              {/* SECTION 5 — Payment Gateways */}
              <section id="section-5" className="fade-up article-section">
                <h2>{t('s5Title')}</h2>
                <p>{t('s5Intro')}</p>
                <div className="feature-grid">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="feature-card">
                      <h4>{t(`s5Gateway${n}Title`)}</h4>
                      <p>{t(`s5Gateway${n}Desc`)}</p>
                      <span className="def-badge">{t(`s5Gateway${n}Tag`)}</span>
                    </div>
                  ))}
                </div>
                <div className="highlight-box">
                  <span className="highlight-stat">{t('s5HighlightStat')}</span>
                  <p>{t('s5HighlightDesc')}</p>
                </div>
              </section>

              {/* SECTION 6 — Shipping */}
              <section id="section-6" className="fade-up article-section">
                <h2>{t('s6Title')}</h2>
                <p>{t('s6Intro')}</p>
                <figure className="article-image article-image--supporting">
                  <img src="/assets/articles/article-shopify-saudi-4.webp" alt={t('s6ImageAlt')} />
                </figure>
                <p>{t('s6Aramex')}</p>
                <p>{t('s6SMSA')}</p>
                <p>{t('s6JT')}</p>
                <p>{t('s6Naqel')}</p>
                <h3>{t('s6CODTitle')}</h3>
                <p>{t('s6CODDesc')}</p>
                <p>{t('s6NationalAddress')}</p>
              </section>

              {/* SECTION 7 — ZATCA */}
              <section id="section-7" className="fade-up article-section">
                <h2>{t('s7Title')}</h2>
                <p>{t('s7Intro')}</p>
                <div className="callout-block">
                  <div className="callout-block__header">
                    <div className="callout-block__icon">!</div>
                    <span className="callout-block__title">{t('s7CalloutTitle')}</span>
                  </div>
                  <p>{t('s7CalloutVAT')}</p>
                  <p>{t('s7CalloutEInvoice')}</p>
                  <ul>
                    <li>{t('s7Req1')}</li>
                    <li>{t('s7Req2')}</li>
                    <li>{t('s7Req3')}</li>
                  </ul>
                  <p>{t('s7Penalties')}</p>
                </div>
                <p>{t('s7Tip')}</p>
              </section>

              {/* Mid-Article CTA */}
              <AffiliateMidArticle
                partner="shopify"
                heading="Ready to Launch Your Store?"
                description="Start your Saudi e-commerce journey with Shopify's localized tools and Arabic RTL support."
                buttonText="Try Shopify Free"
              />

              {/* SECTION 8 — Pre-launch Optimization */}
              <section id="section-8" className="fade-up article-section">
                <h2>{t('s8Title')}</h2>
                <p>{t('s8Intro')}</p>
                <figure className="article-image article-image--contextual">
                  <img src="/assets/articles/article-shopify-saudi-5.webp" alt={t('s8ImageAlt')} />
                  <figcaption>{t('s8ImageCaption')}</figcaption>
                </figure>
                <div className="before-after">
                  <div className="before-after__panel before-after__panel--after">
                    <span className="before-after__label">{t('s8DoLabel')}</span>
                    <ul className="before-after__list">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <li key={n}>{t(`s8Do${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="before-after__panel before-after__panel--before">
                    <span className="before-after__label">{t('s8DontLabel')}</span>
                    <ul className="before-after__list">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <li key={n}>{t(`s8Dont${n}`)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* SECTION 9 — Common Mistakes */}
              <section id="section-9" className="fade-up article-section">
                <h2>{t('s9Title')}</h2>
                <p>{t('s9Intro')}</p>
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n}>
                    <h3>{t(`s9Mistake${n}Title`)}</h3>
                    <p>{t(`s9Mistake${n}Desc`)}</p>
                  </div>
                ))}
                <div className="testimonial-block">
                  <div className="testimonial-quote">
                    <p>{t('s9ExpertQuote')}</p>
                    <cite>{t('s9ExpertCite')}</cite>
                  </div>
                </div>
              </section>

              {/* SECTION 10 — Growth Strategies */}
              <section id="section-10" className="fade-up article-section">
                <h2>{t('s10Title')}</h2>
                <p>{t('s10Intro')}</p>
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n}>
                    <h3>{t(`s10Strategy${n}Title`)}</h3>
                    <p>{t(`s10Strategy${n}Desc`)}</p>
                  </div>
                ))}
              </section>

              {/* SECTION 11 — Key Takeaways */}
              <section id="section-11" className="fade-up article-section">
                <h2>{t('s11Title')}</h2>
                <div className="key-takeaways">
                  <h4>{t('s11TakeawaysLabel')}</h4>
                  <ul>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <li key={n}>{t(`s11Takeaway${n}`)}</li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* SECTION 12 — CTA */}
              <section id="section-12" className="fade-up article-section">
                <h2>{t('s12Title')}</h2>
                <p>{t('s12Intro')}</p>
                <div className="impact-highlight">
                  <div className="impact-highlight__metric">{t('s12CtaTitle')}</div>
                  <p className="impact-highlight__desc">{t('s12CtaDesc')}</p>
                </div>
                <AffiliateLink partner="shopify">
                  Try Shopify Free
                </AffiliateLink>
                <ShareButtons shareText={t('shareText')} />
              </section>

              {/* Sources */}
              <div className="sources-block">
                <h4>{t('sourcesTitle')}</h4>
                <ol>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <li key={n}>{t(`source${n}`)}</li>
                  ))}
                </ol>
              </div>
              </div>{/* /.article-prose */}

            </div>
          </div>
        </div>
      </main>
      <CallToAction />
      <Footer />
      <AffiliateMobileBar partner="shopify" buttonText="Try Shopify Free" />
    </>
  );
}
