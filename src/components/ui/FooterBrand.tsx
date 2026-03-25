'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

export function FooterBrand() {
  const t = useTranslations('Footer');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          container.querySelectorAll('.footer-brand__reveal').forEach((el) => {
            el.classList.add('footer-brand__reveal--visible');
          });
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="footer-brand"
      ref={containerRef}
      style={{ backgroundImage: "url('/assets/footer-bg.jpg')" }}
    >
      <img
        src="/assets/cactus-left.png"
        alt=""
        className="footer-brand__overlay footer-brand__overlay--left footer-brand__reveal"
        aria-hidden="true"
      />
      <span className="footer-brand__giant-text footer-brand__reveal">
        {t('brandText')}
      </span>
      <img
        src="/assets/cactus-right.png"
        alt=""
        className="footer-brand__overlay footer-brand__overlay--right footer-brand__reveal"
        aria-hidden="true"
      />

      <div className="footer-brand__bottom">
        <div className="footer-brand__bottom-left">
          <span className="footer-brand__slogan">
            {t('slogan')} <span className="footer-brand__heart">{t('sloganHeart')}</span>{' '}
            {t('sloganLocation')}{' '}
            <svg
              className="footer-brand__flag"
              width="20"
              height="14"
              viewBox="0 0 20 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="United States flag"
            >
              <rect width="20" height="14" rx="1.5" fill="#B22234" />
              <rect y="2" width="20" height="2" fill="#fff" />
              <rect y="6" width="20" height="2" fill="#fff" />
              <rect y="10" width="20" height="2" fill="#fff" />
              <rect width="9" height="8" rx="0.5" fill="#3C3B6E" />
              <g fill="#fff">
                <circle cx="1.8" cy="1.4" r="0.55" />
                <circle cx="3.6" cy="1.4" r="0.55" />
                <circle cx="5.4" cy="1.4" r="0.55" />
                <circle cx="7.2" cy="1.4" r="0.55" />
                <circle cx="2.7" cy="2.6" r="0.55" />
                <circle cx="4.5" cy="2.6" r="0.55" />
                <circle cx="6.3" cy="2.6" r="0.55" />
                <circle cx="1.8" cy="3.8" r="0.55" />
                <circle cx="3.6" cy="3.8" r="0.55" />
                <circle cx="5.4" cy="3.8" r="0.55" />
                <circle cx="7.2" cy="3.8" r="0.55" />
                <circle cx="2.7" cy="5.0" r="0.55" />
                <circle cx="4.5" cy="5.0" r="0.55" />
                <circle cx="6.3" cy="5.0" r="0.55" />
                <circle cx="1.8" cy="6.2" r="0.55" />
                <circle cx="3.6" cy="6.2" r="0.55" />
                <circle cx="5.4" cy="6.2" r="0.55" />
                <circle cx="7.2" cy="6.2" r="0.55" />
              </g>
            </svg>
          </span>
          <span className="footer-brand__copyright">{t('copyright')}</span>
        </div>

        <div className="footer-brand__bottom-center">
          <div className="footer-brand__badges">
            <span className="footer-brand__badge">{t('badgeSoc2')}</span>
            <span className="footer-brand__badge">{t('badgeHipaa')}</span>
            <span className="footer-brand__badge">{t('badgeUptime')}</span>
          </div>
        </div>

        <div className="footer-brand__legal">
          <a href="/legal.html" target="_blank" rel="noopener noreferrer">{t('legalLink')}</a>
          <a href="/privacy-policy.html">{t('privacyLink')}</a>
          <a href="/wp-content/uploads/pdfs/Nextiva-Patent-Marking-Notice.pdf" target="_blank" rel="noopener noreferrer">{t('patentsLink')}</a>
          <a href="/security-policy.html">{t('securityLink')}</a>
          <a href="/accessibility.html">{t('accessibilityLink')}</a>
          <a href="/sitemap" target="_blank" rel="noopener noreferrer">{t('sitemapLink')}</a>
        </div>
      </div>
    </div>
  );
}
