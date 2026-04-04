'use client';

import { useState, useRef, useEffect } from 'react';

interface PricingPlan {
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  description: string;
  isPopular?: boolean;
  features: string[];
  ctaText: string;
  ctaUrl: string;
}

interface PricingCardsProps {
  heading: string;
  description: string;
  badge?: string;
  plans: PricingPlan[];
  monthlyLabel?: string;
  yearlyLabel?: string;
  saveLabel?: string;
}

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden="true">
    <path d="M3 8l3.5 3.5L13 4.5" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 14 14" fill="currentColor" width="13" height="13" aria-hidden="true">
    <path d="M7 1l1.6 3.3 3.6.5-2.6 2.5.6 3.6L7 9.3l-3.2 1.6.6-3.6L1.8 4.8l3.6-.5L7 1z" />
  </svg>
);

export default function PricingCards({
  heading,
  description,
  badge,
  plans,
  monthlyLabel = 'Monthly',
  yearlyLabel = 'Annual',
  saveLabel = 'Save 20%',
}: PricingCardsProps) {
  const [isYearly, setIsYearly] = useState(false);
  const [activeCard, setActiveCard] = useState(plans.findIndex(p => p.isPopular) ?? 0);
  const gridRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const isDragging = useRef(false);
  const startX = useRef(0);
  const savedScrollLeft = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth > 768) return;
    const grid = gridRef.current;
    const popularIdx = plans.findIndex(p => p.isPopular);
    const card = cardRefs.current[popularIdx >= 0 ? popularIdx : 0];
    if (!grid || !card) return;
    requestAnimationFrame(() => {
      grid.scrollLeft = card.offsetLeft - (grid.clientWidth - card.offsetWidth) / 2;
    });
  }, [plans]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const handleScroll = () => {
      const gridCenter = grid.scrollLeft + grid.clientWidth / 2;
      let closestIndex = 0;
      let closestDist = Infinity;
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const dist = Math.abs(card.offsetLeft + card.offsetWidth / 2 - gridCenter);
        if (dist < closestDist) { closestDist = dist; closestIndex = i; }
      });
      setActiveCard(closestIndex);
    };
    grid.addEventListener('scroll', handleScroll, { passive: true });
    return () => grid.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (typeof window === 'undefined' || window.innerWidth > 768) return;
    const grid = gridRef.current;
    if (!grid) return;
    isDragging.current = true;
    startX.current = e.clientX;
    savedScrollLeft.current = grid.scrollLeft;
    grid.setPointerCapture(e.pointerId);
    grid.classList.add('is-dragging');
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !gridRef.current) return;
    gridRef.current.scrollLeft = savedScrollLeft.current - (e.clientX - startX.current);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !gridRef.current) return;
    isDragging.current = false;
    gridRef.current.releasePointerCapture(e.pointerId);
    gridRef.current.classList.remove('is-dragging');
  };

  const scrollToCard = (index: number) => {
    const grid = gridRef.current;
    const card = cardRefs.current[index];
    if (!grid || !card) return;
    grid.scrollTo({ left: card.offsetLeft - (grid.clientWidth - card.offsetWidth) / 2, behavior: 'smooth' });
  };

  return (
    <section className="pricing-cards">
      <div className="pricing-cards__header">
        {badge && <span className="pricing-cards__badge">{badge}</span>}
        <h2 className="pricing-cards__heading">{heading}</h2>
        <p className="pricing-cards__desc">{description}</p>
      </div>

      <div className="pricing-cards__toggle">
        <span className={`pricing-cards__toggle-label${!isYearly ? ' pricing-cards__toggle-label--active' : ''}`}>
          {monthlyLabel}
        </span>
        <button
          className={`pricing-cards__switch${isYearly ? ' pricing-cards__switch--on' : ''}`}
          onClick={() => setIsYearly(y => !y)}
          role="switch"
          aria-checked={isYearly}
          aria-label="Toggle annual billing"
        >
          <span className="pricing-cards__thumb" />
        </button>
        <span className={`pricing-cards__toggle-label${isYearly ? ' pricing-cards__toggle-label--active' : ''}`}>
          {yearlyLabel} <span className="pricing-cards__save">{saveLabel}</span>
        </span>
      </div>

      <div
        className="pricing-cards__grid"
        ref={gridRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {plans.map((plan, i) => (
          <div
            key={plan.name}
            ref={el => { cardRefs.current[i] = el; }}
            className={`pricing-cards__card${plan.isPopular ? ' pricing-cards__card--popular' : ''}`}
          >
            {plan.isPopular && (
              <div className="pricing-cards__popular-badge">
                <StarIcon />
                <span>Popular</span>
              </div>
            )}

            <p className="pricing-cards__plan-name">{plan.name}</p>

            <div className="pricing-cards__price-row">
              <span className="pricing-cards__price-amount">
                {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
              </span>
              <span className="pricing-cards__price-period">/mo</span>
            </div>

            <p className="pricing-cards__billing">
              {isYearly ? 'billed annually' : 'billed monthly'}
            </p>

            <p className="pricing-cards__plan-desc">{plan.description}</p>

            <div className="pricing-cards__divider" />

            <ul className="pricing-cards__features">
              {plan.features.map((f) => (
                <li key={f} className="pricing-cards__feature">
                  <CheckIcon />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <a
              href={plan.ctaUrl}
              className={`pricing-cards__btn${plan.isPopular ? ' pricing-cards__btn--popular' : ''}`}
            >
              {plan.ctaText}
            </a>
          </div>
        ))}
      </div>

      <div className="pricing-cards__dots" aria-hidden="true">
        {plans.map((plan, i) => (
          <button
            key={plan.name}
            className={`pricing-cards__dot${activeCard === i ? ' pricing-cards__dot--active' : ''}`}
            onClick={() => scrollToCard(i)}
            aria-label={`View ${plan.name} plan`}
          />
        ))}
      </div>
    </section>
  );
}
