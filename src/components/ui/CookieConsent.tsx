'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import posthog from 'posthog-js';

const STORAGE_KEY = 'cookie-consent';

export default function CookieConsent() {
  const t = useTranslations('CookieConsent');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setVisible(true);
    } else if (stored === 'rejected') {
      posthog.opt_out_capturing();
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    posthog.opt_in_capturing();
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem(STORAGE_KEY, 'rejected');
    posthog.opt_out_capturing();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-consent">
      <div className="cookie-consent__inner">
        <p className="cookie-consent__message">{t('message')}</p>
        <div className="cookie-consent__actions">
          <button
            className="cookie-consent__btn cookie-consent__btn--reject"
            onClick={handleReject}
          >
            {t('reject')}
          </button>
          <button
            className="cookie-consent__btn cookie-consent__btn--accept"
            onClick={handleAccept}
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
