import { getTranslations } from 'next-intl/server';
import { FooterBrand } from '@/components/ui/FooterBrand';

export async function Footer() {
  const t = await getTranslations('Footer');

  return (
    <>
      <footer className="footer">
        <div className="footer__wrapper">
          {/* Left Column — Logo, Social */}
          <div className="footer__logo-section">
            <div className="footer__logo">
              <a href="/">
                <img
                  src="/assets/mansati-logo.svg"
                  alt={t('logoAlt')}
                  width={188}
                  height={69}
                  loading="lazy"
                />
              </a>
              <div className="footer__sub-heading">{t('subHeading')}</div>
            </div>

            <div className="footer__social">
              <a href="https://x.com/mansati" aria-label={t('socialX')}>
                <img src="/assets/footer-x.webp" alt={t('socialX')} width={32} height={32} loading="lazy" />
              </a>
              <a href="https://www.linkedin.com/company/mansati" aria-label={t('socialLinkedIn')}>
                <img src="/assets/footer-linkedin.webp" alt={t('socialLinkedIn')} width={32} height={32} loading="lazy" />
              </a>
              <a href="https://www.youtube.com/@mansati" aria-label={t('socialYouTube')}>
                <img src="/assets/footer-youtube.webp" alt={t('socialYouTube')} width={32} height={32} loading="lazy" />
              </a>
            </div>
          </div>

          {/* Right Column — Link Columns */}
          <div className="footer__links-wrapper">
            <div className="footer__links">
              {/* Column 1 */}
              <div className="footer__links-col">
                <span className="footer__links-heading">{t('col1Heading')}</span>
                <ul className="footer__links-list">
                  <li><a href="/reviews/website-builders">{t('col1Links.websiteBuilders')}</a></li>
                  <li><a href="/reviews/email-marketing">{t('col1Links.emailMarketing')}</a></li>
                  <li><a href="/reviews/ecommerce">{t('col1Links.ecommerce')}</a></li>
                  <li><a href="/reviews/hosting">{t('col1Links.hosting')}</a></li>
                  <li><a href="/reviews/crm">{t('col1Links.crm')}</a></li>
                  <li><a href="/reviews/project-management">{t('col1Links.projectMgmt')}</a></li>
                </ul>
              </div>

              {/* Column 2 */}
              <div className="footer__links-col">
                <span className="footer__links-heading">{t('col2Heading')}</span>
                <ul className="footer__links-list">
                  <li><a href="/guides">{t('col2Links.guides')}</a></li>
                  <li><a href="/comparisons">{t('col2Links.comparisons')}</a></li>
                  <li><a href="/best">{t('col2Links.bestOf')}</a></li>
                  <li><a href="/pricing">{t('col2Links.pricing')}</a></li>
                  <li><a href="/tutorials">{t('col2Links.tutorials')}</a></li>
                  <li><a href="/glossary">{t('col2Links.glossary')}</a></li>
                </ul>
              </div>

              {/* Column 3 */}
              <div className="footer__links-col">
                <span className="footer__links-heading">{t('col3Heading')}</span>
                <ul className="footer__links-list">
                  <li><a href="/categories/marketing">{t('col3Links.marketing')}</a></li>
                  <li><a href="/categories/analytics">{t('col3Links.analytics')}</a></li>
                  <li><a href="/categories/design">{t('col3Links.design')}</a></li>
                  <li><a href="/categories/ai">{t('col3Links.ai')}</a></li>
                  <li><a href="/categories/communication">{t('col3Links.communication')}</a></li>
                  <li><a href="/categories/accounting">{t('col3Links.accounting')}</a></li>
                </ul>
              </div>

              {/* Column 4 */}
              <div className="footer__links-col">
                <span className="footer__links-heading">{t('col4Heading')}</span>
                <ul className="footer__links-list">
                  <li><a href="/about">{t('col4Links.about')}</a></li>
                  <li><a href="/methodology">{t('col4Links.methodology')}</a></li>
                  <li><a href="/careers">{t('col4Links.careers')}</a></li>
                  <li><a href="/contact">{t('col4Links.contact')}</a></li>
                  <li><a href="/advertise">{t('col4Links.advertise')}</a></li>
                </ul>
              </div>

              {/* Blog Column */}
              <div className="footer__links-col">
                <span className="footer__links-heading">{t('blogHeading')}</span>
                <ul className="footer__links-list footer__links-list--blog">
                  <li className="footer__blog-card">
                    <a className="footer__blog-link" href="/blog/best-website-builders">
                      <div className="footer__blog-content">
                        <div className="footer__blog-title">{t('blogPost1Title')}</div>
                        <div className="footer__blog-go">
                          <p>{t('goLearn')}</p>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                    </a>
                  </li>
                  <li className="footer__blog-card">
                    <a className="footer__blog-link" href="/blog/email-marketing-tools-compared">
                      <div className="footer__blog-content">
                        <div className="footer__blog-title">{t('blogPost2Title')}</div>
                        <div className="footer__blog-go">
                          <p>{t('goLearn')}</p>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Giant Brand Section */}
      <FooterBrand />
    </>
  );
}
