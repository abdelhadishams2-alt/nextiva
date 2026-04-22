'use client';

import '@/styles/editors-pick.css';
import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { BLUR_DATA_URL } from '@/lib/blur-placeholder';

const TOOL_KEYS = ['notion', 'zoom', 'hubspot', 'canva'] as const;
const ROTATE_INTERVAL = 5000;

export function EditorsPick() {
  const t = useTranslations('EditorsPick');
  const [activeIndex, setActiveIndex] = useState(0);
  // 'idle' = visible, 'exit' = sliding out left, 'enter' = sliding in from right
  const [phase, setPhase] = useState<'idle' | 'exit' | 'enter'>('idle');

  const animate = useCallback((nextIndex: number) => {
    if (phase !== 'idle') return;
    // Phase 1: slide old image out to the left
    setPhase('exit');
    setTimeout(() => {
      // Phase 2: swap data, instantly position off-screen right (no transition)
      setActiveIndex(nextIndex);
      setPhase('enter');
      // Phase 3: after a frame, slide in from right
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase('idle');
        });
      });
    }, 500);
  }, [phase]);

  const goToTool = useCallback((index: number) => {
    if (index === activeIndex) return;
    animate(index);
  }, [activeIndex, animate]);

  useEffect(() => {
    const timer = setInterval(() => {
      animate((activeIndex + 1) % TOOL_KEYS.length);
    }, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [activeIndex, animate]);

  const key = TOOL_KEYS[activeIndex];

  return (
    <section className="editors-pick" id="editors-pick">
      <div className="editors-pick__container">
        <div className="editors-pick__header">
          <span className="editors-pick__eyebrow">{t('eyebrow')}</span>
          <h2 className="editors-pick__title">{t('title')}</h2>
        </div>

        {/* Dot Indicators */}
        <div className="editors-pick__dots">
          {TOOL_KEYS.map((toolKey, i) => (
            <button
              key={toolKey}
              className={`editors-pick__dot${i === activeIndex ? ' editors-pick__dot--active' : ''}`}
              onClick={() => goToTool(i)}
              aria-label={`View ${t(`tools.${toolKey}.name`)}`}
            />
          ))}
        </div>

        <div className="editors-pick__row">
          {/* Featured Tool Card */}
          <div className={`editors-pick__card-primary${phase === 'exit' ? ' editors-pick--exit' : phase === 'enter' ? ' editors-pick--enter' : ' editors-pick--idle'}`}>
            <Image
              className="editors-pick__card-image"
              src={t(`tools.${key}.image`)}
              alt={t(`tools.${key}.imageAlt`)}
              width={600}
              height={400}
              quality={75}
              loading="lazy"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
            <div className="editors-pick__card-overlay" />
            <div className="editors-pick__card-content">
              <div className="editors-pick__card-top">
                <span className="editors-pick__card-badge">{t(`tools.${key}.badge`)}</span>
                <div className="editors-pick__card-rating">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--rating-star)" aria-hidden="true">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span>{t(`tools.${key}.rating`)}</span>
                </div>
              </div>

              <div className="editors-pick__card-bottom">
                <span className="editors-pick__card-category">{t(`tools.${key}.category`)}</span>
                <h3 className="editors-pick__card-title">{t(`tools.${key}.name`)}</h3>
                <p className="editors-pick__card-desc">{t(`tools.${key}.desc`)}</p>
                <a href={t(`tools.${key}.link`)} className="editors-pick__card-link">
                  {t('readReview')}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <rect x="2" y="7" width="10" height="2" rx="1" />
                    <path d="M9.5 3.5L14 8l-4.5 4.5V3.5z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Stats Sidebar */}
          <div className={`editors-pick__sidebar${phase === 'exit' ? ' editors-pick--fade-out' : phase === 'enter' ? ' editors-pick--fade-enter' : ' editors-pick--fade-in'}`}>
            <div className="editors-pick__sidebar-inner">
              <div className="editors-pick__sidebar-header">
                <svg className="editors-pick__sidebar-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
                <span className="editors-pick__sidebar-label">{t('quickVerdict')}</span>
              </div>

              <div className="editors-pick__pros">
                <h4 className="editors-pick__pros-title">{t('prosTitle')}</h4>
                <ul className="editors-pick__pros-list">
                  <li>{t(`tools.${key}.pro1`)}</li>
                  <li>{t(`tools.${key}.pro2`)}</li>
                  <li>{t(`tools.${key}.pro3`)}</li>
                </ul>
              </div>

              <div className="editors-pick__cons">
                <h4 className="editors-pick__cons-title">{t('consTitle')}</h4>
                <ul className="editors-pick__cons-list">
                  <li>{t(`tools.${key}.con1`)}</li>
                  <li>{t(`tools.${key}.con2`)}</li>
                </ul>
              </div>

              <div className="editors-pick__sidebar-footer">
                <div className="editors-pick__price-label">{t('priceLabel')}</div>
                <div className="editors-pick__price-value">{t(`tools.${key}.price`)}</div>
              </div>

              <a href={t(`tools.${key}.link`)} className="editors-pick__sidebar-link">
                {t('fullReview')}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <rect x="2" y="7" width="10" height="2" rx="1" />
                  <path d="M9.5 3.5L14 8l-4.5 4.5V3.5z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Prewarm — off-screen copies of every carousel image so the browser caches
            them on first paint. Without this, each 5 s rotation triggers a fresh fetch. */}
        <div aria-hidden="true" className="editors-pick__prewarm">
          {TOOL_KEYS.map((toolKey) => (
            <Image
              key={`prewarm-${toolKey}`}
              src={t(`tools.${toolKey}.image`)}
              alt=""
              width={600}
              height={400}
              quality={75}
              loading="lazy"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
