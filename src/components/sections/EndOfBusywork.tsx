import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

export async function EndOfBusywork() {
  const t = await getTranslations('EndOfBusywork');

  return (
    <section className="busywork" id="features">
      <div className="busywork__section-header">
        <span className="busywork__label">{t('label')}</span>
        <h2 className="busywork__section-title">{t('headline')}</h2>
      </div>

      <div className="busywork__card">
        {/* Left — Text content */}
        <div className="busywork__content">
          <div className="busywork__top">
            <span className="busywork__label busywork__label--desktop">{t('label')}</span>
            <h2 className="busywork__headline">{t('headline')}</h2>
          </div>

          <div className="busywork__bottom">
            <h3 className="busywork__tagline">
              {t('tagline')}
            </h3>
            <p className="busywork__desc">{t('desc')}</p>
            <a className="busywork__cta" href="/#reviews">
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

        {/* Right — Visual */}
        <div className="busywork__visual">
          <Image
            src="/assets/why-trust-mansati.webp"
            alt=""
            fill
            loading="lazy"
            quality={75}
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: 'cover' }}
          />
        </div>
      </div>
    </section>
  );
}
