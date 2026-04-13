'use client';

import '@/styles/how-we-review.css';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback, useRef } from 'react';

const STEP_KEYS = ['step1', 'step2', 'step3', 'step4', 'step5'] as const;
const AUTOPLAY_DURATION = 4000;

export function HowWeReview() {
  const t = useTranslations('HowWeReview');
  const [activeStep, setActiveStep] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isAutoPlaying) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    startTimeRef.current = 0;

    const tick = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const pct = Math.min(elapsed / AUTOPLAY_DURATION, 1);
      setProgress(pct);

      if (pct >= 1) {
        /* Advance start time instead of resetting — seamless transition */
        startTimeRef.current += AUTOPLAY_DURATION;
        setActiveStep((prev) => (prev + 1) % STEP_KEYS.length);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isAutoPlaying]);

  const handleStepClick = (index: number) => {
    setActiveStep(index);
    setProgress(0);
    startTimeRef.current = 0;
    setIsAutoPlaying(true);
  };

  const steps = STEP_KEYS.map((key, i) => ({
    key,
    index: i,
    label: t(`steps.${key}.label`),
    name: t(`steps.${key}.name`),
    outcome: t(`steps.${key}.outcome`),
    pills: t.raw(`steps.${key}.pills`) as string[],
    image: t(`steps.${key}.image`),
  }));

  const active = steps[activeStep];

  return (
    <section className="how-we-review" id="reviews">
      <div className="how-we-review__inner">
        {/* Header */}
        <div className="how-we-review__header">
          <span className="how-we-review__eyebrow">{t('eyebrow')}</span>
          <h2 className="how-we-review__title">{t('title')}</h2>
        </div>

        {/* Desktop Timeline */}
        <div className="how-we-review__timeline">
          <div className="how-we-review__connector">
            <svg className="how-we-review__connector-svg" preserveAspectRatio="none">
              <line className="how-we-review__connector-line" x1="0" y1="50%" x2="100%" y2="50%" />
              <line className="how-we-review__connector-beam" x1="0" y1="50%" x2="100%" y2="50%" />
            </svg>
          </div>
          <div className="how-we-review__phases">
            {steps.map((step) => {
              const isActive = step.index === activeStep;
              const isDone = step.index < activeStep;
              const txtFill = isDone ? 100 : isActive ? progress * 100 : 0;
              const phaseClass = [
                'how-we-review__phase',
                isActive && 'how-we-review__phase--active',
                isDone && 'how-we-review__phase--done',
              ].filter(Boolean).join(' ');

              return (
                <div
                  key={step.key}
                  className={phaseClass}
                  onClick={() => handleStepClick(step.index)}
                  style={{ '--txt-fill': `${txtFill}%` } as React.CSSProperties}
                >
                  <div className="how-we-review__phase-card">
                    <span className="how-we-review__phase-number">{step.index + 1}</span>
                    <div className="how-we-review__phase-text">
                      <div className="how-we-review__phase-label">{step.label}</div>
                      <h3 className="how-we-review__phase-name">{step.name}</h3>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Dropdown */}
        <div className={`how-we-review__mobile${mobileOpen ? ' how-we-review__mobile--open' : ''}`}>
          <button
            className="how-we-review__dropdown-trigger"
            onClick={() => setMobileOpen(!mobileOpen)}
            type="button"
          >
            <span>{active.label} — {active.name}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <div className="how-we-review__dropdown-menu">
            {steps.map((step) => (
              <button
                key={step.key}
                className={`how-we-review__dropdown-item${activeStep === step.index ? ' how-we-review__dropdown-item--active' : ''}`}
                onClick={() => { setActiveStep(step.index); setMobileOpen(false); }}
                type="button"
              >
                {step.label} — {step.name}
              </button>
            ))}
          </div>
        </div>

        {/* Detail Strip */}
        <div className="how-we-review__detail-strip">
          <span className="how-we-review__strip-outcome">{active.outcome}</span>
          <div className="how-we-review__strip-items">
            {active.pills.map((pill) => (
              <span className="how-we-review__strip-pill" key={pill}>{pill}</span>
            ))}
          </div>
        </div>

        {/* Mockup Panel — all images stacked, only active one visible */}
        <div className="how-we-review__mockup-area">
          {steps.map((step) => (
            <div
              key={step.key}
              className={`how-we-review__mockup-panel${step.index === activeStep ? ' how-we-review__mockup-panel--active' : ''}`}
            >
              <Image
                src={step.image}
                alt={`${step.label} — ${step.name}`}
                width={1440}
                height={810}
                quality={75}
                className="how-we-review__mockup-img"
                {...(step.index === 0 ? { priority: true } : { loading: 'lazy' as const })}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
