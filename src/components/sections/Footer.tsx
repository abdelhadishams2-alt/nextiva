import { getTranslations } from 'next-intl/server';
import { FooterBrand } from '@/components/ui/FooterBrand';

export async function Footer() {
  const t = await getTranslations('Footer');

  return (
    <>
      <footer className="footer">
        <div className="footer__wrapper">
          {/* Left Column — Logo, Download, Social */}
          <div className="footer__logo-section">
            <div className="footer__logo">
              <a href="/">
                <img
                  src="/assets/nextiva-footer-logo.svg"
                  alt={t('logoAlt')}
                  width={188}
                  height={69}
                  loading="lazy"
                />
              </a>
              <div className="footer__sub-heading">{t('subHeading')}</div>
            </div>

            <div className="footer__download">
              <a href="/download" className="footer__download-btn">
                {t('downloadCta')}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </a>
            </div>

            <div className="footer__social">
              <a href="https://www.facebook.com/NEXTIVA/" aria-label={t('socialFacebook')}>
                <img src="/assets/footer-fb.webp" alt={t('socialFacebook')} width={32} height={32} loading="lazy" />
              </a>
              <a href="https://x.com/nextiva" aria-label={t('socialX')}>
                <img src="/assets/footer-x.webp" alt={t('socialX')} width={32} height={32} loading="lazy" />
              </a>
              <a href="https://www.linkedin.com/company/nextiva" aria-label={t('socialLinkedIn')}>
                <img src="/assets/footer-linkedin.webp" alt={t('socialLinkedIn')} width={32} height={32} loading="lazy" />
              </a>
              <a href="https://www.youtube.com/nextiva" aria-label={t('socialYouTube')}>
                <img src="/assets/footer-youtube.webp" alt={t('socialYouTube')} width={32} height={32} loading="lazy" />
              </a>
              <a href="https://www.reddit.com/r/Nextiva/" aria-label={t('socialReddit')}>
                <img src="/assets/footer-reddit.png" alt={t('socialReddit')} width={32} height={32} loading="lazy" />
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
                  <li><a href="/products/customer-communications">{t('col1Links.customerComm')}</a></li>
                  <li><a href="/products/contact-center-solutions">{t('col1Links.contactCenter')}</a></li>
                  <li><a href="/products/business-voice">{t('col1Links.businessVoice')}</a></li>
                  <li><a href="/solutions/local-phone-numbers">{t('col1Links.localNumbers')}</a></li>
                  <li><a href="/products/customer-analytics">{t('col1Links.analytics')}</a></li>
                  <li><a href="/products/ai-receptionist">{t('col1Links.aiReceptionist')}</a></li>
                </ul>
              </div>

              {/* Column 2 */}
              <div className="footer__links-col">
                <span className="footer__links-heading">{t('col2Heading')}</span>
                <ul className="footer__links-list">
                  <li><a href="/resource-center">{t('col2Links.resourceCenter')}</a></li>
                  <li><a href="https://help.nextiva.com/">{t('col2Links.supportCenter')}</a></li>
                  <li><a href="/products/voip-hardware">{t('col2Links.phones')}</a></li>
                  <li><a href="/blog/what-is-contact-center.html">{t('col2Links.contactCenters')}</a></li>
                  <li><a href="/resources/voip-speed-test.html">{t('col2Links.networkTest')}</a></li>
                  <li><a href="/resources/contact-center-staffing-calculator">{t('col2Links.staffingCalc')}</a></li>
                  <li><a href="/resources/missed-calls-calculator">{t('col2Links.missedCallsCalc')}</a></li>
                  <li><a href="/resources/ai-receptionist-calculator">{t('col2Links.aiCalc')}</a></li>
                </ul>
              </div>

              {/* Column 3 */}
              <div className="footer__links-col">
                <span className="footer__links-heading">{t('col3Heading')}</span>
                <ul className="footer__links-list">
                  <li><a href="/products/cloud-phone-system">{t('col3Links.cloudPhone')}</a></li>
                  <li><a href="/products/inbound-call-center">{t('col3Links.inboundVoice')}</a></li>
                  <li><a href="/products/messaging-inbox">{t('col3Links.textMessaging')}</a></li>
                  <li><a href="/products/cloud-call-center">{t('col3Links.callCenter')}</a></li>
                  <li><a href="/products/cloud-pbx">{t('col3Links.cloudPbx')}</a></li>
                  <li><a href="/products/pbx-sip-trunking">{t('col3Links.sipTrunking')}</a></li>
                </ul>
              </div>

              {/* Column 4 */}
              <div className="footer__links-col">
                <span className="footer__links-heading">{t('col4Heading')}</span>
                <ul className="footer__links-list">
                  <li><a href="/company/leadership">{t('col4Links.leadership')}</a></li>
                  <li><a href="/company/board-of-directors">{t('col4Links.board')}</a></li>
                  <li><a href="/company/careers">{t('col4Links.careers')}</a></li>
                  <li><a href="/company/nextiva-cares">{t('col4Links.cares')}</a></li>
                  <li><a href="/company/news">{t('col4Links.news')}</a></li>
                  <li><a href="https://status.nextiva.com/" target="_blank" rel="noopener noreferrer">{t('col4Links.status')}</a></li>
                  <li><a href="/company/contact">{t('col4Links.contact')}</a></li>
                </ul>
              </div>

              {/* Column 5 */}
              <div className="footer__links-col">
                <span className="footer__links-heading">{t('col5Heading')}</span>
                <ul className="footer__links-list">
                  <li><a href="/company/partners">{t('col5Links.channel')}</a></li>
                  <li><a href="/company/events">{t('col5Links.events')}</a></li>
                  <li><a href="/company/affiliates.html">{t('col5Links.affiliates')}</a></li>
                  <li><a href="https://partner.nextiva.com/English/" target="_blank" rel="noopener noreferrer">{t('col5Links.portal')}</a></li>
                  <li><a href="/integrations">{t('col5Links.integrations')}</a></li>
                </ul>
              </div>

              {/* Blog Column */}
              <div className="footer__links-col">
                <span className="footer__links-heading">{t('blogHeading')}</span>
                <ul className="footer__links-list footer__links-list--blog">
                  <li className="footer__blog-card">
                    <a className="footer__blog-link" href="/blog/call-center-software.html">
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
                    <a className="footer__blog-link" href="/blog/what-is-unified-cxm.html">
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
