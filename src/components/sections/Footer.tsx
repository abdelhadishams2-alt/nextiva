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
              <a href="https://x.com/mansati" aria-label={t('socialX')} data-ph-capture-attribute-button="footer-social-x">
                <img src="/assets/footer-x.webp" alt={t('socialX')} width={32} height={32} loading="lazy" />
              </a>
              <a href="https://www.linkedin.com/company/mansati" aria-label={t('socialLinkedIn')} data-ph-capture-attribute-button="footer-social-linkedin">
                <img src="/assets/footer-linkedin.webp" alt={t('socialLinkedIn')} width={32} height={32} loading="lazy" />
              </a>
              <a href="https://www.youtube.com/@mansati" aria-label={t('socialYouTube')} data-ph-capture-attribute-button="footer-social-youtube">
                <img src="/assets/footer-youtube.webp" alt={t('socialYouTube')} width={32} height={32} loading="lazy" />
              </a>
            </div>
          </div>

          {/* Right Column — Link Columns */}
          <div className="footer__links-wrapper">
            <div className="footer__links">
              {/* Column 1 — Tool Reviews */}
              <div className="footer__links-col">
                <span className="footer__links-heading">{t('col1Heading')}</span>
                <ul className="footer__links-list">
                  <li><a href="/tap-payment-gateway">{t('col1Links.websiteBuilders')}</a></li>
                  <li><a href="/erp-software-saudi-arabia">{t('col1Links.ecommerce')}</a></li>
                  <li><a href="/odoo-saudi-arabia">{t('col1Links.crm')}</a></li>
                  <li><a href="/project-management-companies-in-saudi-arabia">{t('col1Links.projectMgmt')}</a></li>
                  <li><a href="/foodics-saudi-arabia">{t('col1Links.hosting')}</a></li>
                  <li><a href="/classera-middle-east">{t('col1Links.emailMarketing')}</a></li>
                </ul>
              </div>

              {/* Column 2 — Resources */}
              <div className="footer__links-col">
                <span className="footer__links-heading">{t('col2Heading')}</span>
                <ul className="footer__links-list">
                  <li><a href="/blogs">{t('col2Links.guides')}</a></li>
                  <li><a href="/#editors-pick">{t('col2Links.comparisons')}</a></li>
                  <li><a href="/#featured">{t('col2Links.bestOf')}</a></li>
                  <li><a href="/#reviews">{t('col2Links.pricing')}</a></li>
                </ul>
              </div>

              {/* Column 3 — Categories */}
              <div className="footer__links-col">
                <span className="footer__links-heading">{t('col3Heading')}</span>
                <ul className="footer__links-list">
                  <li><a href="/delivery-apps">{t('col3Links.marketing')}</a></li>
                  <li><a href="/inventory-management-software">{t('col3Links.analytics')}</a></li>
                  <li><a href="/cloud-based-inventory-management">{t('col3Links.design')}</a></li>
                  <li><a href="/online-inventory-management-system">{t('col3Links.ai')}</a></li>
                  <li><a href="/restaurant-inventory-management-system">{t('col3Links.communication')}</a></li>
                </ul>
              </div>

              {/* Column 4 — Company */}
              <div className="footer__links-col">
                <span className="footer__links-heading">{t('col4Heading')}</span>
                <ul className="footer__links-list">
                  <li><a href="/#features">{t('col4Links.about')}</a></li>
                  <li><a href="/#reviews">{t('col4Links.methodology')}</a></li>
                  <li><a href="/#contact">{t('col4Links.contact')}</a></li>
                </ul>
              </div>

              {/* Blog Column */}
              <div className="footer__links-col">
                <span className="footer__links-heading">{t('blogHeading')}</span>
                <ul className="footer__links-list footer__links-list--blog">
                  <li className="footer__blog-card">
                    <a className="footer__blog-link" href="/article-shopify-saudi">
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
                    <a className="footer__blog-link" href="/article-ecommerce-tco">
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
