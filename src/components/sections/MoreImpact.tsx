'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 60;
const BLUE_COLORS = [
  'rgb(1, 106, 236)', 'rgb(7, 96, 250)', 'rgb(10, 114, 242)',
  'rgb(2, 111, 246)', 'rgb(2, 100, 251)', 'rgb(18, 108, 252)',
  'rgb(8, 101, 247)', 'rgb(15, 120, 233)', 'rgb(9, 111, 245)',
  'rgb(3, 107, 236)', 'rgb(14, 95, 251)', 'rgb(6, 107, 248)',
];
const GLOW_COLORS = [
  'rgb(185, 242, 255)', 'rgb(230, 211, 255)', 'rgb(194, 213, 255)',
  'rgb(204, 234, 255)', 'rgb(238, 238, 255)', 'rgb(212, 234, 255)',
  'rgb(245, 239, 255)', 'rgb(186, 220, 255)', 'rgb(209, 222, 255)',
];

function spawnParticles(container: HTMLElement) {
  const { clientWidth: w, clientHeight: h } = container;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const el = document.createElement('span');
    el.className = 'more-impact__particle';

    const isGlow = Math.random() < 0.2;
    const color = isGlow
      ? GLOW_COLORS[Math.floor(Math.random() * GLOW_COLORS.length)]
      : BLUE_COLORS[Math.floor(Math.random() * BLUE_COLORS.length)];
    const size = 2 + Math.random() * 2;

    el.style.left = `${Math.random() * w}px`;
    el.style.top = `${Math.random() * h}px`;
    el.style.width = `${size}px`;
    el.style.height = `${size * 1.5}px`;
    el.style.background = color;
    if (isGlow) {
      el.style.boxShadow = 'rgba(255, 255, 255, 0.8) 0px 0px 6px';
    }

    container.appendChild(el);

    const duration = 6000 + Math.random() * 10000;
    const driftX = (Math.random() - 0.5) * 120;
    const driftY = -(30 + Math.random() * 80);

    el.animate(
      [
        { transform: 'translate(0, 0)', opacity: 0 },
        { opacity: 0.9, offset: 0.15 },
        { opacity: 0.5, offset: 0.85 },
        { transform: `translate(${driftX}px, ${driftY}px)`, opacity: 0 },
      ],
      { duration, iterations: Infinity, delay: Math.random() * duration }
    );
  }
}

export function MoreImpact() {
  const t = useTranslations('MoreImpact');
  const particlesRef = useRef<HTMLDivElement>(null);
  const spawnedRef = useRef(false);

  useEffect(() => {
    const container = particlesRef.current;
    if (!container || spawnedRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          spawnParticles(container);
          spawnedRef.current = true;
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="more-impact">
      <div className="more-impact__card">
        <div className="more-impact__overlay" />
        <div
          className="more-impact__particles"
          ref={particlesRef}
          aria-hidden="true"
        />

        <div className="more-impact__content">
          <div className="more-impact__top">
            <div className="more-impact__logo-row">
              <span className="more-impact__pill">{t('pill')}</span>
            </div>
          </div>

          <div className="more-impact__bottom">
            <h2 className="more-impact__headline">{t('headline')}</h2>
            <p className="more-impact__subhead">{t('subhead')}</p>
            <div className="more-impact__cta">
              <a className="more-impact__btn" href="/blogs">
                <span className="more-impact__btn-text">{t('cta')}</span>
                <span className="more-impact__btn-arrow">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <rect x="2" y="7" width="10" height="2" rx="1" />
                    <path d="M9.5 3.5L14 8l-4.5 4.5V3.5z" />
                  </svg>
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
