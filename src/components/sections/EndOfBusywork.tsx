import { getTranslations } from 'next-intl/server';

export async function EndOfBusywork() {
  const t = await getTranslations('EndOfBusywork');

  return (
    <section className="busywork">
      <div className="busywork__card">
        {/* Left — Text content */}
        <div className="busywork__content">
          <div className="busywork__top">
            <span className="busywork__label">{t('label')}</span>
            <h2 className="busywork__headline">{t('headline')}</h2>
          </div>

          <div className="busywork__bottom">
            <h3 className="busywork__tagline">
              {t('tagline')}
            </h3>
            <p className="busywork__desc">{t('desc')}</p>
            <a className="busywork__cta" href="/products/next-platform">
              <span className="busywork__cta-text">{t('cta')}</span>
              <span className="busywork__cta-arrow">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <rect x="2" y="7" width="10" height="2" rx="1" />
                  <path d="M9.5 3.5L14 8l-4.5 4.5V3.5z" />
                </svg>
              </span>
            </a>
          </div>
        </div>

        {/* Right — Visual with atom animation */}
        <div
          className="busywork__visual"
          style={{ backgroundImage: 'url(/assets/busywork-desert.webp)' }}
        >
          <div className="busywork__atom">
            <div className="busywork__nucleus" />
            <div className="busywork__orbit busywork__orbit--1" />
            <div className="busywork__orbit busywork__orbit--2" />
            <div className="busywork__orbit busywork__orbit--3" />
          </div>
        </div>
      </div>
    </section>
  );
}
