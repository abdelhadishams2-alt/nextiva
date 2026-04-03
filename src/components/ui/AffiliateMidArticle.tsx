'use client';

import { affiliatePartners } from '@/config/affiliates';

interface AffiliateMidArticleProps {
  partner: string;
  variant?: string;
  heading?: string;
  description?: string;
  buttonText?: string;
}

export default function AffiliateMidArticle({ partner, variant, heading, description, buttonText }: AffiliateMidArticleProps) {
  const slug = variant ? `${partner}-${variant}` : `${partner}-mid`;
  const href = `/out/${slug}`;
  const partnerData = affiliatePartners[partner];
  const name = partnerData?.name ?? partner;

  return (
    <div className="affiliate-mid">
      <div className="affiliate-mid__content">
        <span className="affiliate-mid__label">Recommended</span>
        <h4 className="affiliate-mid__heading">{heading ?? name}</h4>
        <p className="affiliate-mid__desc">{description ?? `See why thousands of businesses choose ${name}.`}</p>
        <a
          href={href}
          target="_blank"
          rel="nofollow sponsored noopener"
          className="affiliate-mid__link"
          data-ph-capture-attribute-affiliate={`mid-${partner}`}
        >
          {buttonText ?? `Try ${name} Free`}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    </div>
  );
}
