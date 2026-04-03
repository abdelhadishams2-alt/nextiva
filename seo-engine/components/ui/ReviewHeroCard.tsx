'use client';

interface ReviewHeroCardProps {
  productName: string;
  productLogo: string;
  rating: number;
  pros: string[];
  cons: string[];
  startingPrice: string;
  hasFreePlan?: boolean;
  partner: string;
  reviewUrl: string;
  pricingUrl: string;
  activeTab?: 'review' | 'pricing';
  rank?: number;
  variant?: 'full' | 'compact' | 'versus';
}

export default function ReviewHeroCard({
  productName,
  productLogo,
  rating,
  pros,
  cons,
  startingPrice,
  hasFreePlan = false,
  partner,
  reviewUrl,
  pricingUrl,
  activeTab = 'review',
  rank,
  variant = 'full',
}: ReviewHeroCardProps) {
  const ratingPercent = (rating / 5) * 100;

  return (
    <div className={`review-hero-card ${variant !== 'full' ? `review-hero-card--${variant}` : ''}`}>
      <header className="review-hero-card__header">
        <div className="review-hero-card__cover">&nbsp;</div>

        <div className="review-hero-card__inner">
          {/* Rank badge (best-of only) */}
          {rank && (
            <div className="review-hero-card__rank">
              <span>#{rank}</span>
            </div>
          )}

          {/* Product logo */}
          <div className="review-hero-card__logo">
            <a href={`/out/${partner}-logo`} rel="noopener nofollow" target="_blank">
              <img src={productLogo} loading="lazy" alt={`${productName} logo`} />
            </a>
          </div>

          {/* Rating circle */}
          <div className="review-hero-card__score">
            <div
              className={`review-hero-card__circle ${variant === 'compact' ? '' : 'review-hero-card__circle--large'}`}
              style={{
                background: `conic-gradient(var(--brand-navy) ${ratingPercent}%, var(--border-subtle) 0 100%)`,
              }}
            >
              <span>{rating}</span>
            </div>
          </div>

          {/* Summary: Best / Worst / Pricing */}
          <div className="review-hero-card__summary">
            <div className="review-hero-card__summary-col">
              <a href="#pros-cons" className="review-hero-card__anchor">
                <p className="review-hero-card__label">The Best</p>
                <ul className="review-hero-card__list">
                  {pros.map((text, i) => (
                    <li key={i}>
                      <svg className="review-hero-card__icon-check" width="16" height="10" viewBox="0 0 16 10" fill="none">
                        <path d="M1 4.68L5.41 9.08L14.7 1" stroke="#8FE0B4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {text}
                    </li>
                  ))}
                </ul>
              </a>
            </div>

            <div className="review-hero-card__summary-col">
              <a href="#pros-cons" className="review-hero-card__anchor">
                <p className="review-hero-card__label">The Worst</p>
                <ul className="review-hero-card__list review-hero-card__list--cons">
                  {cons.map((text, i) => (
                    <li key={i}>
                      <svg className="review-hero-card__icon-cross" width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path fillRule="evenodd" clipRule="evenodd" d="M1.28033 0.21967C0.987437 -0.0732233 0.512563 -0.0732233 0.21967 0.21967C-0.0732233 0.512563 -0.0732233 0.987437 0.21967 1.28033L4.37212 5.43278L0.21967 9.58523C-0.0732233 9.87813 -0.0732233 10.353 0.21967 10.6459C0.512563 10.9388 0.987437 10.9388 1.28033 10.6459L5.43278 6.49344L9.58523 10.6459C9.87813 10.9388 10.353 10.9388 10.6459 10.6459C10.9388 10.353 10.9388 9.87813 10.6459 9.58523L6.49344 5.43278L10.6459 1.28033C10.9388 0.987437 10.9388 0.512563 10.6459 0.21967C10.353 -0.0732233 9.87813 -0.0732233 9.58523 0.21967L5.43278 4.37212L1.28033 0.21967Z" fill="#E97979" />
                      </svg>
                      {text}
                    </li>
                  ))}
                </ul>
              </a>
            </div>

            <div className="review-hero-card__summary-col review-hero-card__summary-col--pricing">
              <p className="review-hero-card__label">Starting From</p>
              <p className="review-hero-card__price">{startingPrice}</p>
              {hasFreePlan && (
                <ul className="review-hero-card__list">
                  <li>
                    <svg className="review-hero-card__icon-check" width="16" height="10" viewBox="0 0 16 10" fill="none">
                      <path d="M1 4.68L5.41 9.08L14.7 1" stroke="#8FE0B4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Free plan
                  </li>
                </ul>
              )}
            </div>
          </div>

          {/* CTA button */}
          <div className="review-hero-card__cta">
            <a
              href={`/out/${partner}-hero`}
              target="_blank"
              rel="nofollow sponsored noopener"
              className="review-hero-card__btn"
            >
              Try for free
            </a>
          </div>

          {/* Tab navigation (full variant only) */}
          {variant === 'full' && (
            <nav className="review-hero-card__nav">
              <ul className="review-hero-card__tabs">
                <li>
                  <a
                    href={reviewUrl}
                    className={`review-hero-card__tab ${activeTab === 'review' ? 'review-hero-card__tab--active' : ''}`}
                  >
                    Review
                  </a>
                </li>
                <li>
                  <a
                    href={pricingUrl}
                    className={`review-hero-card__tab ${activeTab === 'pricing' ? 'review-hero-card__tab--active' : ''}`}
                  >
                    Pricing
                  </a>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </header>
    </div>
  );
}
