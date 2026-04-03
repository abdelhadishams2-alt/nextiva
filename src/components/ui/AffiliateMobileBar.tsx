'use client';

import { useState, useEffect } from 'react';
import { affiliatePartners } from '@/config/affiliates';

interface AffiliateMobileBarProps {
  partner: string;
  buttonText?: string;
}

export default function AffiliateMobileBar({ partner, buttonText }: AffiliateMobileBarProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const href = `/out/${partner}-mobile`;
  const partnerData = affiliatePartners[partner];
  const name = partnerData?.name ?? partner;

  useEffect(() => {
    const handleScroll = () => {
      if (dismissed) return;
      setVisible(window.scrollY > 600);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [dismissed]);

  if (dismissed || !visible) return null;

  return (
    <div className="affiliate-mobile-bar">
      <a
        href={href}
        target="_blank"
        rel="nofollow sponsored noopener"
        className="affiliate-mobile-bar__link"
        data-ph-capture-attribute-affiliate={`mobile-${partner}`}
      >
        {buttonText ?? `Try ${name} Free`}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
      <button
        className="affiliate-mobile-bar__close"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
