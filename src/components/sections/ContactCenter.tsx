import { getTranslations } from 'next-intl/server';

const ArrowIcon = () => (
  <span className="contact-center__link-arrow">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2" y="7" width="10" height="2" rx="1" />
      <path d="M9.5 3.5L14 8l-4.5 4.5V3.5z" />
    </svg>
  </span>
);

export async function ContactCenter() {
  const t = await getTranslations('ContactCenter');

  return (
    <section className="contact-center">
      <div className="contact-center__row">
        <div
          className="contact-center__card"
          style={{
            backgroundImage: 'url(/assets/contact-center-desert.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="contact-center__overlay">
            <span className="contact-center__label">{t('card1.label')}</span>
            <h3 className="contact-center__title">{t('card1.title')}</h3>
            <p className="contact-center__desc">{t('card1.desc')}</p>
            <a href="/blogs" className="contact-center__link">
              {t('card1.link')}
              <ArrowIcon />
            </a>
          </div>
        </div>

        <div
          className="contact-center__card contact-center__card--blue"
          style={{
            backgroundImage: 'url(/assets/contact-center-agent.webp)',
            backgroundSize: 'auto 130%',
            backgroundPosition: 'left bottom',
          }}
        >
          <div className="contact-center__overlay">
            <span className="contact-center__label">{t('card2.label')}</span>
            <h3 className="contact-center__title">{t('card2.title')}</h3>
            <p className="contact-center__desc">{t('card2.desc')}</p>
            <a href="/blogs" className="contact-center__link">
              {t('card2.link')}
              <ArrowIcon />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
