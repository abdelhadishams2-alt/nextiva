'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const STEP_KEYS = ['step1', 'step2', 'step3', 'step4', 'step5'] as const;

export function HowWeReview() {
  const t = useTranslations('HowWeReview');
  const [activeStep, setActiveStep] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

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
    <section className="how-we-review">
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
            {steps.map((step) => (
              <div
                key={step.key}
                className={`how-we-review__phase${activeStep === step.index ? ' how-we-review__phase--active' : ''}`}
                onClick={() => setActiveStep(step.index)}
              >
                <div className="how-we-review__phase-card">
                  <span className="how-we-review__phase-number">{step.index + 1}</span>
                  <div className="how-we-review__phase-text">
                    <div className="how-we-review__phase-label">{step.label}</div>
                    <h3 className="how-we-review__phase-name">{step.name}</h3>
                  </div>
                </div>
              </div>
            ))}
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
        <div className="how-we-review__detail-strip" key={activeStep}>
          <span className="how-we-review__strip-outcome">{active.outcome}</span>
          <div className="how-we-review__strip-items">
            {active.pills.map((pill) => (
              <span className="how-we-review__strip-pill" key={pill}>{pill}</span>
            ))}
          </div>
        </div>

        {/* Mockup Panel */}
        <div className="how-we-review__mockup-area">
          <div className="how-we-review__mockup-panel" key={`mockup-${activeStep}`}>
            <Image
              src={active.image}
              alt={`${active.label} — ${active.name}`}
              width={1440}
              height={810}
              className="how-we-review__mockup-img"
              priority={activeStep === 0}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
