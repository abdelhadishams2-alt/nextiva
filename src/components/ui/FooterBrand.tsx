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
      style={{ backgroundImage: "url('/assets/footer-bg-mansati.jpg')" }}
    >
      <span className="footer-brand__giant-text footer-brand__reveal">
        {t('brandText')}
      </span>

      <div className="footer-brand__bottom">
        <span className="footer-brand__copyright">{t('copyright')}</span>
      </div>
    </div>
  );
}
