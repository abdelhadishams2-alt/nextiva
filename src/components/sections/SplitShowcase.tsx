'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M9.9997 15.1709L19.1921 5.97852L20.6063 7.39273L9.9997 17.9993L3.63574 11.6354L5.04996 10.2212L9.9997 15.1709Z" />
  </svg>
);

const XBertIcon = () => (
  <svg className="split-showcase__xbert-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18.89 27.41" fill="currentColor" aria-hidden="true">
    <g>
      <path d="M10.03,21.82c-1.66,1.72-5.85,5.6-8.29,5.6-1.41,0-1.85-1.23-1.7-2.44.34-2.73,4.07-7.67,5.85-9.88,1.39-1.73,2.58-1.98.3-3.77-.45-.36-2.15-1.58-2.65-1.41-.42.43.12,1.44.33,1.95.27.64,1.04,1.72.96,2.38-.1.89-1.18,1.17-1.83.59-.41-.37-1.77-2.87-2.06-3.49-.52-1.1-1.39-3.05-.66-4.15,1.38-2.07,5.07.69,6.43,1.73.95.72,1.82,1.54,2.7,2.34,1.73-1.48,3.57-3.3,5.66-4.28,1.74-.81,4.03-1,3.8,1.6-.31,3.49-6.33,10.64-8.83,13.23ZM3.38,23.68c.2.59,1.7-.47,2.01-.69,2.97-2.02,8.58-8.49,9.87-11.83.41-1.07.49-1.58-.81-1.02-3.09,1.35-9.7,9.15-10.83,12.34-.11.32-.36.87-.25,1.19Z" />
      <path d="M10.52,23.46c-.09-.45.34-1.25.79-1.36.85-.22,1.43.6,2.09,1,4.43,2.72.62-2.25.66-3.28.04-.93,1.29-1.35,1.98-.62.53.56,1.68,2.75,2.02,3.53.48,1.08,1.27,2.92.46,3.95-1.37,1.74-4.67-.5-6-1.45-.39-.28-1.93-1.41-2-1.78Z" />
    </g>
    <polygon points="9.44 0 10.56 3.03 13.59 4.15 10.56 5.27 9.44 8.3 8.32 5.27 5.29 4.15 8.32 3.03 9.44 0" />
  </svg>
);

function ConstellationSVG() {
  return (
    <svg className="split-showcase__constellation-svg" viewBox="-150 -150 500 500" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {/* Secondary lines from outer nodes to center */}
      <line className="split-showcase__constellation-line--secondary" x1="100" y1="-130" x2="100" y2="100" />
      <line className="split-showcase__constellation-line--secondary" x1="100" y1="330" x2="100" y2="100" />
      <line className="split-showcase__constellation-line--secondary" x1="-130" y1="100" x2="100" y2="100" />
      <line className="split-showcase__constellation-line--secondary" x1="330" y1="100" x2="100" y2="100" />
      <line className="split-showcase__constellation-line--secondary" x1="-100" y1="-100" x2="100" y2="100" />
      <line className="split-showcase__constellation-line--secondary" x1="300" y1="-100" x2="100" y2="100" />
      <line className="split-showcase__constellation-line--secondary" x1="-100" y1="300" x2="100" y2="100" />
      <line className="split-showcase__constellation-line--secondary" x1="300" y1="300" x2="100" y2="100" />
      <line className="split-showcase__constellation-line--secondary" x1="-120" y1="20" x2="100" y2="100" />
      <line className="split-showcase__constellation-line--secondary" x1="320" y1="20" x2="100" y2="100" />
      <line className="split-showcase__constellation-line--secondary" x1="-120" y1="180" x2="100" y2="100" />
      <line className="split-showcase__constellation-line--secondary" x1="320" y1="180" x2="100" y2="100" />
      <line className="split-showcase__constellation-line--secondary" x1="20" y1="-120" x2="100" y2="100" />
      <line className="split-showcase__constellation-line--secondary" x1="180" y1="-120" x2="100" y2="100" />
      <line className="split-showcase__constellation-line--secondary" x1="20" y1="320" x2="100" y2="100" />
      <line className="split-showcase__constellation-line--secondary" x1="180" y1="320" x2="100" y2="100" />

      {/* Primary lines */}
      <line className="split-showcase__constellation-line split-showcase__constellation-line--1" x1="10" y1="10" x2="100" y2="100" />
      <line className="split-showcase__constellation-line split-showcase__constellation-line--2" x1="100" y1="100" x2="190" y2="190" />
      <line className="split-showcase__constellation-line split-showcase__constellation-line--3" x1="190" y1="10" x2="100" y2="100" />
      <line className="split-showcase__constellation-line split-showcase__constellation-line--4" x1="100" y1="100" x2="10" y2="190" />

      {/* Secondary outer nodes */}
      <circle className="split-showcase__constellation-node--secondary" cx="100" cy="-130" r="2.5" />
      <circle className="split-showcase__constellation-node--secondary" cx="100" cy="330" r="2.5" />
      <circle className="split-showcase__constellation-node--secondary" cx="-130" cy="100" r="2.5" />
      <circle className="split-showcase__constellation-node--secondary" cx="330" cy="100" r="2.5" />
      <circle className="split-showcase__constellation-node--secondary" cx="-100" cy="-100" r="2.5" />
      <circle className="split-showcase__constellation-node--secondary" cx="300" cy="-100" r="2.5" />
      <circle className="split-showcase__constellation-node--secondary" cx="-100" cy="300" r="2.5" />
      <circle className="split-showcase__constellation-node--secondary" cx="300" cy="300" r="2.5" />
      <circle className="split-showcase__constellation-node--secondary" cx="-120" cy="20" r="2.5" />
      <circle className="split-showcase__constellation-node--secondary" cx="320" cy="20" r="2.5" />
      <circle className="split-showcase__constellation-node--secondary" cx="-120" cy="180" r="2.5" />
      <circle className="split-showcase__constellation-node--secondary" cx="320" cy="180" r="2.5" />
      <circle className="split-showcase__constellation-node--secondary" cx="20" cy="-120" r="2.5" />
      <circle className="split-showcase__constellation-node--secondary" cx="180" cy="-120" r="2.5" />
      <circle className="split-showcase__constellation-node--secondary" cx="20" cy="320" r="2.5" />
      <circle className="split-showcase__constellation-node--secondary" cx="180" cy="320" r="2.5" />

      {/* Inner secondary lines */}
      <line className="split-showcase__constellation-line--secondary" x1="20" y1="20" x2="100" y2="100" />
      <line className="split-showcase__constellation-line--secondary" x1="180" y1="20" x2="100" y2="100" />
      <line className="split-showcase__constellation-line--secondary" x1="20" y1="180" x2="100" y2="100" />
      <line className="split-showcase__constellation-line--secondary" x1="180" y1="180" x2="100" y2="100" />

      {/* Inner secondary nodes */}
      <circle className="split-showcase__constellation-node--secondary" cx="20" cy="20" r="2.5" />
      <circle className="split-showcase__constellation-node--secondary" cx="180" cy="20" r="2.5" />
      <circle className="split-showcase__constellation-node--secondary" cx="20" cy="180" r="2.5" />
      <circle className="split-showcase__constellation-node--secondary" cx="180" cy="180" r="2.5" />

      {/* Primary nodes */}
      <circle className="split-showcase__constellation-node split-showcase__constellation-node--1" cx="10" cy="10" r="3" />
      <circle className="split-showcase__constellation-node split-showcase__constellation-node--2" cx="100" cy="100" r="4" />
      <circle className="split-showcase__constellation-node split-showcase__constellation-node--3" cx="190" cy="190" r="3" />
      <circle className="split-showcase__constellation-node split-showcase__constellation-node--4" cx="190" cy="10" r="3" />
      <circle className="split-showcase__constellation-node split-showcase__constellation-node--5" cx="10" cy="190" r="3" />
    </svg>
  );
}

export function SplitShowcase() {
  const t = useTranslations('SplitShowcase');
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const cards = section.querySelectorAll('.split-showcase__card');
    const timers: ReturnType<typeof setTimeout>[] = [];
    const intervals: ReturnType<typeof setInterval>[] = [];

    function setItemState(item: Element, isTask: boolean, state: 'pending' | 'active' | 'completed') {
      const prefix = isTask ? 'split-showcase__task-item' : 'split-showcase__benefit-item';
      item.classList.remove(`${prefix}--pending`, `${prefix}--active`, `${prefix}--completed`);
      item.classList.add(`${prefix}--${state}`);
    }

    function animateCard(card: Element) {
      const taskItems = card.querySelectorAll('.split-showcase__task-item');
      const benefitItems = card.querySelectorAll('.split-showcase__benefit-item');

      const groups: { items: NodeListOf<Element>; isTask: boolean }[] = [];
      if (taskItems.length > 0) groups.push({ items: taskItems, isTask: true });
      if (benefitItems.length > 0) groups.push({ items: benefitItems, isTask: false });

      const stepDuration = 1500;
      const itemsDelay = 1200;
      const maxCount = Math.max(...groups.map((g) => g.items.length), 0);
      const pauseAfterAll = 2000;
      const cycleDuration = itemsDelay + (maxCount + 1) * stepDuration + pauseAfterAll;

      function runCycle() {
        // Remove --active to reset all CSS animations (face box, dial fade)
        card.classList.remove('split-showcase__card--active');
        groups.forEach(({ items, isTask }) => {
          items.forEach((item) => setItemState(item, isTask, 'pending'));
        });

        // Force reflow so browser restarts animations
        void (card as HTMLElement).offsetWidth;

        // Re-add --active: face box + dial CSS animations play from scratch
        card.classList.add('split-showcase__card--active');

        // After face box/dial have animated in, reveal items one by one
        for (let step = 0; step < maxCount; step++) {
          const t = setTimeout(() => {
            groups.forEach(({ items, isTask }) => {
              items.forEach((item, i) => {
                if (i < step) setItemState(item, isTask, 'completed');
                else if (i === step) setItemState(item, isTask, 'active');
                else setItemState(item, isTask, 'pending');
              });
            });
          }, itemsDelay + step * stepDuration);
          timers.push(t);
        }

        // After last step, mark all completed
        const tAll = setTimeout(() => {
          groups.forEach(({ items, isTask }) => {
            items.forEach((item) => setItemState(item, isTask, 'completed'));
          });
        }, itemsDelay + maxCount * stepDuration);
        timers.push(tAll);
      }

      runCycle();
      const interval = setInterval(runCycle, cycleDuration);
      intervals.push(interval);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCard(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    cards.forEach((card) => observer.observe(card));

    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
      intervals.forEach(clearInterval);
    };
  }, []);

  return (
    <section className="split-showcase" ref={sectionRef}>
      <div className="split-showcase__grid">
        {/* Card 1 — XBert AI */}
        <div className="split-showcase__card">
          <div className="split-showcase__card-image">
            <img
              loading="lazy"
              decoding="async"
              width={1024}
              height={1024}
              src="/assets/trust-testing.jpg"
              className="split-showcase__img"
              alt=""
            />
            <div className="split-showcase__overlay split-showcase__overlay--ai">
              <div className="split-showcase__face-box split-showcase__face-box--ai">
                <div className="split-showcase__face-label">{t('card1.faceLabel')}</div>
              </div>
              <div className="split-showcase__task-dial">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="split-showcase__task-item">
                    <span className="split-showcase__task-check">
                      <CheckIcon />
                    </span>
                    <span className="split-showcase__task-text">{t(`card1.task${i}`)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="split-showcase__card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h3 className="split-showcase__card-title">{t('card1.title')}</h3>
          <p className="split-showcase__card-desc">{t('card1.desc')}</p>
        </div>

        {/* Card 2 — Team Focus */}
        <div className="split-showcase__card">
          <div className="split-showcase__card-image">
            <img
              loading="lazy"
              decoding="async"
              width={1024}
              height={771}
              src="/assets/trust-no-bias.jpg"
              className="split-showcase__img"
              alt=""
            />
            <div className="split-showcase__overlay split-showcase__overlay--team">
              <div className="split-showcase__face-box split-showcase__face-box--team">
                <div className="split-showcase__face-label">{t('card2.faceLabel')}</div>
              </div>
              <div className="split-showcase__benefits-list">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="split-showcase__benefit-item">
                    <span className="split-showcase__benefit-check">
                      <CheckIcon />
                    </span>
                    <span className="split-showcase__benefit-text">{t(`card2.benefit${i}`)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="split-showcase__card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h3 className="split-showcase__card-title">{t('card2.title')}</h3>
          <p className="split-showcase__card-desc">{t('card2.desc')}</p>
        </div>

        {/* Card 3 — Unified Platform */}
        <div className="split-showcase__card">
          <div className="split-showcase__card-image">
            <img
              loading="lazy"
              decoding="async"
              width={847}
              height={1024}
              src="/assets/trust-mena.jpg"
              className="split-showcase__img"
              alt=""
            />
            <div className="split-showcase__overlay split-showcase__overlay--constellation">
              <ConstellationSVG />
              <div className="split-showcase__constellation-label">
                {t('card3.constellationLabel')}
              </div>
            </div>
          </div>

          <div className="split-showcase__card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <h3 className="split-showcase__card-title">{t('card3.title')}</h3>
          <p className="split-showcase__card-desc">{t('card3.desc')}</p>
        </div>
      </div>
    </section>
  );
}
