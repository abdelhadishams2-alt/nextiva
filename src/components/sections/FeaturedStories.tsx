import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { FeaturedStoriesAnimation } from './FeaturedStoriesAnimation';

const CARD_KEYS = ['card1', 'card2', 'card3', 'card4'] as const;

export async function FeaturedStories() {
  const t = await getTranslations('FeaturedStories');

  return (
    <section className="featured-stories" id="featured">
      <FeaturedStoriesAnimation />
      <div className="featured-stories__container">
        <div className="featured-stories__header">
          <span className="featured-stories__eyebrow">{t('eyebrow')}</span>
          <h3 className="featured-stories__title">{t('title')}</h3>
        </div>

        <div className="featured-stories__grid">
          {CARD_KEYS.map((key) => (
            <a href={t(`${key}.link`)} className="featured-stories__card" key={key}>
              <div className="featured-stories__card-image">
                <Image
                  src={t(`${key}.image`)}
                  alt={t(`${key}.company`)}
                  width={768}
                  height={578}
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="featured-stories__card-img"
                />
              </div>

              <div className="featured-stories__card-header">
                <span className="featured-stories__badge">{t(`${key}.badge`)}</span>
              </div>

              <div className="featured-stories__stats">
                <div className="featured-stories__metric">{t(`${key}.metric`)}</div>
                <div className="featured-stories__metric-label">{t(`${key}.metricLabel`)}</div>
              </div>

              <h4 className="featured-stories__company">{t(`${key}.company`)}</h4>
              <p className="featured-stories__desc">{t(`${key}.desc`)}</p>

              <span className="featured-stories__link">
                {t('readArticle')}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <rect x="2" y="7" width="10" height="2" rx="1" />
                  <path d="M9.5 3.5L14 8l-4.5 4.5V3.5z" />
                </svg>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
