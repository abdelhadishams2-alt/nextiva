'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState, useCallback, useEffect } from 'react';

const CARD_KEYS = [
  'card1', 'card2', 'card3', 'card4', 'card5',
  'card6', 'card7', 'card8', 'card9', 'card10',
] as const;

export function ProvenResults() {
  const t = useTranslations('ProvenResults');
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const updateNavState = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    updateNavState();
    el.addEventListener('scroll', updateNavState, { passive: true });
    return () => el.removeEventListener('scroll', updateNavState);
  }, [updateNavState]);

  const scroll = (direction: 'prev' | 'next') => {
    const el = carouselRef.current;
    if (!el) return;
    const cardWidth = 320 + 16; // card flex-basis + gap
    el.scrollBy({ left: direction === 'next' ? cardWidth : -cardWidth, behavior: 'smooth' });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const el = carouselRef.current;
    if (!el) return;
    isDragging.current = true;
    startX.current = e.clientX;
    scrollLeft.current = el.scrollLeft;
    el.classList.add('proven-results__carousel--dragging');
    el.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !carouselRef.current) return;
    const dx = e.clientX - startX.current;
    carouselRef.current.scrollLeft = scrollLeft.current - dx;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    carouselRef.current?.classList.remove('proven-results__carousel--dragging');
    carouselRef.current?.releasePointerCapture(e.pointerId);
  };

  return (
    <section className="proven-results">
      <div className="proven-results__container">
        <div className="proven-results__header">
          <h3 className="proven-results__title">{t('title')}</h3>
          <div className="proven-results__nav">
            <button
              className="proven-results__nav-btn"
              aria-label={t('prevLabel')}
              disabled={!canScrollLeft}
              onClick={() => scroll('prev')}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              className="proven-results__nav-btn"
              aria-label={t('nextLabel')}
              disabled={!canScrollRight}
              onClick={() => scroll('next')}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        <div
          className="proven-results__carousel"
          ref={carouselRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="proven-results__track">
            {CARD_KEYS.map((key) => (
              <div className="proven-results__card" key={key}>
                <div className="proven-results__card-header">
                  <span className="proven-results__badge">{t(`${key}.badge`)}</span>
                </div>

                <div className="proven-results__stats">
                  <div className="proven-results__metric">{t(`${key}.metric`)}</div>
                  <div className="proven-results__metric-label">{t(`${key}.metricLabel`)}</div>
                </div>

                <h4 className="proven-results__company">{t(`${key}.company`)}</h4>
                <p className="proven-results__desc">{t(`${key}.desc`)}</p>

                <a href={t(`${key}.link`)} className="proven-results__link">
                  {t('readCaseStudy')}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <rect x="2" y="7" width="10" height="2" rx="1" />
                    <path d="M9.5 3.5L14 8l-4.5 4.5V3.5z" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
