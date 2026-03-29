import { getTranslations } from 'next-intl/server';

export default async function AffiliateDisclosure() {
  const t = await getTranslations('Affiliate');

  return (
    <div className="affiliate-disclosure">
      <svg className="affiliate-disclosure__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <p className="affiliate-disclosure__text">{t('disclosure')}</p>
    </div>
  );
}
