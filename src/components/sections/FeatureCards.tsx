import { getTranslations } from 'next-intl/server';
import { DustParticles } from '@/components/ui/DustParticles';
import { EyeRadiate } from '@/components/ui/EyeRadiate';

export async function FeatureCards() {
  const t = await getTranslations('FeatureCards');

  return (
    <section className="feature-cards">
      <div className="feature-cards__row">
        {/* Card 1 — Desert landscape with dust particles */}
        <div
          className="feature-cards__card"
          style={{ backgroundImage: 'url(/assets/feature-card-desert.webp)' }}
        >
          <DustParticles />
          <div className="feature-cards__overlay">
            <span className="feature-cards__label">{t('card1.label')}</span>
            <h3 className="feature-cards__title">{t('card1.title')}</h3>
            <p className="feature-cards__desc">{t('card1.desc')}</p>
          </div>
        </div>

        {/* Card 2 — Portrait with eye radiate rings */}
        <div
          className="feature-cards__card feature-cards__card--blue"
          style={{ backgroundImage: 'url(/assets/feature-card-portrait.webp)' }}
        >
          <EyeRadiate />
          <div className="feature-cards__overlay">
            <span className="feature-cards__label">{t('card2.label')}</span>
            <h3 className="feature-cards__title">{t('card2.title')}</h3>
            <p className="feature-cards__desc">{t('card2.desc')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
