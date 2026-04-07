'use client';

import { useTranslations } from 'next-intl';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('Error');

  return (
    <section className="error-page">
      <div className="error-page__bg" />

      <div className="error-page__content">
        <div className="error-page__icon">
          <i className="ri-error-warning-line" />
        </div>
        <h1 className="error-page__title">{t('title')}</h1>
        <p className="error-page__desc">{t('description')}</p>

        <div className="error-page__actions">
          <button onClick={reset} className="error-page__btn error-page__btn--primary">
            <i className="ri-refresh-line" />
            {t('tryAgain')}
          </button>
          <a href="/" className="error-page__btn error-page__btn--ghost">
            <i className="ri-arrow-left-line" />
            {t('backHome')}
          </a>
        </div>
      </div>
    </section>
  );
}
