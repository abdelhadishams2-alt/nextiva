import { getTranslations } from 'next-intl/server';
import { DustParticles } from '@/components/ui/DustParticles';

export async function FromTheFounder() {
  const t = await getTranslations('FromTheFounder');

  return (
    <section className="from-founder">
      <div className="from-founder__container">
        <div className="from-founder__header">
          <span className="from-founder__eyebrow">{t('eyebrow')}</span>
          <h2 className="from-founder__title">{t('title')}</h2>
        </div>

        <div className="from-founder__row">
          {/* Primary Thought Piece Card */}
          <div className="from-founder__card-primary">
            <DustParticles />
            <div className="from-founder__card-content">
              <div className="from-founder__card-top">
                <div className="from-founder__card-meta">
                  <div className="from-founder__avatar">
                    <img
                      src="/assets/tomas-avatar.png"
                      alt={t('avatarAlt')}
                      width={56}
                      height={56}
                    />
                  </div>
                  <div className="from-founder__info">
                    <span className="from-founder__name">{t('name')}</span>
                    <span className="from-founder__role">{t('role')}</span>
                  </div>
                </div>
              </div>

              <div className="from-founder__card-bottom">
                <h3 className="from-founder__card-title">{t('cardTitle')}</h3>
                <p className="from-founder__card-desc">{t('cardDesc')}</p>
                <a href="/thought-leadership" className="from-founder__card-link">
                  {t('readArticle')}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <rect x="2" y="7" width="10" height="2" rx="1" />
                    <path d="M9.5 3.5L14 8l-4.5 4.5V3.5z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* LinkedIn Post Card */}
          <div className="from-founder__linkedin">
            <div className="from-founder__linkedin-inner">
              <div className="from-founder__linkedin-header">
                <svg
                  className="from-founder__linkedin-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                <span className="from-founder__linkedin-label">{t('onLinkedIn')}</span>
              </div>

              <div className="from-founder__linkedin-preview">
                <p className="from-founder__linkedin-text">{t('linkedInPost')}</p>
              </div>

              <div className="from-founder__linkedin-footer">
                <div className="from-founder__mini-avatar">
                  <img
                    src="/assets/tomas-avatar.png"
                    alt={t('avatarAlt')}
                    width={32}
                    height={32}
                  />
                </div>
                <span className="from-founder__linkedin-author">{t('name')}</span>
                <span className="from-founder__linkedin-badge">{t('followers')}</span>
              </div>

              <a
                href="https://www.linkedin.com/in/tomas-gorny"
                className="from-founder__linkedin-link"
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                {t('viewOnLinkedIn')}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <rect x="2" y="7" width="10" height="2" rx="1" />
                  <path d="M9.5 3.5L14 8l-4.5 4.5V3.5z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
