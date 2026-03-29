'use client';

import { useState, useEffect } from 'react';
import posthog from 'posthog-js';

export default function ExitIntent() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !dismissed) {
        setShow(true);
        posthog.capture('exit_intent_shown', { page: window.location.pathname });
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [dismissed]);

  if (!show || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
    posthog.capture('exit_intent_dismissed', { page: window.location.pathname });
  };

  const handleClick = () => {
    posthog.capture('exit_intent_clicked', { page: window.location.pathname });
  };

  return (
    <div className="exit-intent-overlay" onClick={handleDismiss}>
      <div className="exit-intent" onClick={(e) => e.stopPropagation()}>
        <button className="exit-intent__close" onClick={handleDismiss} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <h3 className="exit-intent__title">Before you go...</h3>
        <p className="exit-intent__desc">We have 16+ in-depth tool reviews for the Middle East market. Find the right tool for your business.</p>
        <a href="/blogs" className="exit-intent__link" onClick={handleClick}>
          Browse All Reviews
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </a>
      </div>
    </div>
  );
}
