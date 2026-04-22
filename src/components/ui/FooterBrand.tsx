'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { BLUR_DATA_URL } from '@/lib/blur-placeholder';

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
    <div className="footer-brand" ref={containerRef}>
      <Image
        src="/assets/footer-desert.webp"
        alt=""
        fill
        loading="lazy"
        quality={75}
        sizes="100vw"
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
        style={{ objectFit: 'cover', zIndex: 0 }}
      />
      <span className="footer-brand__giant-text footer-brand__reveal">
        {t('brandText')}
      </span>

      <div className="footer-brand__bottom">
        <span className="footer-brand__copyright">{t('copyright')}</span>
      </div>
    </div>
  );
}
