import { getTranslations } from 'next-intl/server';

const TRUST_LOGOS = [
  { name: 'Slack', svg: (
    <svg width="110" height="36" viewBox="0 0 85 28" fill="none">
      <rect x="2" y="2" width="10" height="10" rx="2" fill="#E01E5A"/>
      <rect x="16" y="2" width="10" height="10" rx="2" fill="#36C5F0"/>
      <rect x="2" y="16" width="10" height="10" rx="2" fill="#2EB67D"/>
      <rect x="16" y="16" width="10" height="10" rx="2" fill="#ECB22E"/>
      <text x="32" y="19" fontFamily="var(--font-body)" fontSize="14" fontWeight="700" fill="#1A1C22">Slack</text>
    </svg>
  )},
  { name: 'Monday', svg: (
    <svg width="137" height="36" viewBox="0 0 105 28" fill="none">
      <circle cx="8" cy="18" r="5" fill="#FF3D57"/>
      <circle cx="20" cy="12" r="5" fill="#FFCB00"/>
      <circle cx="14" cy="20" r="5" fill="#00CA72"/>
      <text x="30" y="19" fontFamily="var(--font-body)" fontSize="14" fontWeight="700" fill="#1A1C22">Monday</text>
    </svg>
  )},
  { name: 'Notion', svg: (
    <svg width="124" height="36" viewBox="0 0 95 28" fill="none">
      <rect x="4" y="4" width="20" height="20" rx="3" fill="#1A1C22"/>
      <path d="M10 9h8v2h-8zM10 13h8v2h-8zM10 17h5v2h-5z" fill="#fff"/>
      <text x="30" y="19" fontFamily="var(--font-body)" fontSize="14" fontWeight="700" fill="#1A1C22">Notion</text>
    </svg>
  )},
  { name: 'Salesforce', svg: (
    <svg width="156" height="36" viewBox="0 0 120 28" fill="none">
      <path d="M20 4c-3.3 0-6.2 1.6-8 4A9.5 9.5 0 0 0 4.5 14c0 5.2 4.3 9.5 9.5 9.5 1.8 0 3.4-.5 4.8-1.3A9.5 9.5 0 0 0 34 14c0-1.8-.5-3.5-1.4-5A10 10 0 0 0 20 4z" fill="#00A1E0"/>
      <text x="48" y="19" fontFamily="var(--font-body)" fontSize="14" fontWeight="700" fill="#1A1C22">Salesforce</text>
    </svg>
  )},
  { name: 'HubSpot', svg: (
    <svg width="143" height="36" viewBox="0 0 110 28" fill="none">
      <circle cx="14" cy="14" r="10" fill="#FF7A59"/>
      <circle cx="14" cy="14" r="4" fill="#fff"/>
      <text x="32" y="19" fontFamily="var(--font-body)" fontSize="14" fontWeight="700" fill="#1A1C22">HubSpot</text>
    </svg>
  )},
  { name: 'Shopify', svg: (
    <svg width="130" height="36" viewBox="0 0 100 28" fill="none">
      <path d="M18 3l-2 1 1 5s-2-1-4-1c-4 0-4 3-4 3s0 5 5 8c4 2 7 5 7 5s3-3 3-8c0-4-1-11-1-11L18 3z" fill="#96BF48"/>
      <text x="28" y="19" fontFamily="var(--font-body)" fontSize="14" fontWeight="700" fill="#1A1C22">Shopify</text>
    </svg>
  )},
  { name: 'Mailchimp', svg: (
    <svg width="150" height="36" viewBox="0 0 115 28" fill="none">
      <circle cx="14" cy="14" r="12" fill="#FFE01B"/>
      <path d="M10 16c1-2 4-3 6-2s3 3 2 5" stroke="#1A1C22" strokeWidth="1.5" fill="none"/>
      <circle cx="11" cy="12" r="1.5" fill="#1A1C22"/>
      <circle cx="17" cy="12" r="1.5" fill="#1A1C22"/>
      <text x="32" y="19" fontFamily="var(--font-body)" fontSize="14" fontWeight="700" fill="#1A1C22">Mailchimp</text>
    </svg>
  )},
  { name: 'Zendesk', svg: (
    <svg width="137" height="36" viewBox="0 0 105 28" fill="none">
      <path d="M4 22L18 6v16H4z" fill="#03363D"/>
      <circle cx="11" cy="8" r="6" fill="#03363D"/>
      <text x="28" y="19" fontFamily="var(--font-body)" fontSize="14" fontWeight="700" fill="#1A1C22">Zendesk</text>
    </svg>
  )},
];

export async function LogoTrustBar() {
  const t = await getTranslations('LogoTrustBar');

  return (
    <section className="logo-trust-bar">
      <div className="logo-trust-bar__inner">
        <p className="logo-trust-bar__label">{t('text')}</p>
        <div className="logo-trust-bar__marquee">
          <div className="logo-trust-bar__track">
            <div className="logo-trust-bar__set">
              {TRUST_LOGOS.map((logo) => (
                <div key={logo.name} className="logo-trust-bar__logo">{logo.svg}</div>
              ))}
            </div>
            <div className="logo-trust-bar__set" aria-hidden="true">
              {TRUST_LOGOS.map((logo) => (
                <div key={`${logo.name}-dup`} className="logo-trust-bar__logo">{logo.svg}</div>
              ))}
            </div>
            <div className="logo-trust-bar__set" aria-hidden="true">
              {TRUST_LOGOS.map((logo) => (
                <div key={`${logo.name}-dup2`} className="logo-trust-bar__logo">{logo.svg}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
