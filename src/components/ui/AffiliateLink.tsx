'use client';

interface AffiliateLinkProps {
  partner: string;
  variant?: string;
  fallbackUrl?: string;
  children: React.ReactNode;
  className?: string;
  inline?: boolean;
}

export default function AffiliateLink({ partner, variant, fallbackUrl, children, className, inline }: AffiliateLinkProps) {
  const slug = variant ? `${partner}-${variant}` : partner;
  const href = fallbackUrl || `/out/${slug}`;

  if (inline) {
    return (
      <a
        href={href}
        target="_blank"
        rel="nofollow sponsored noopener"
        className={className ?? 'affiliate-inline'}
        data-ph-capture-attribute-affiliate={partner}
      >
        {children}
      </a>
    );
  }

  return (
    <div className="affiliate-cta">
      <a
        href={href}
        target="_blank"
        rel="nofollow sponsored noopener"
        className={className ?? 'affiliate-cta__link'}
        data-ph-capture-attribute-affiliate={partner}
      >
        {children}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </div>
  );
}
