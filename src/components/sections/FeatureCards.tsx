import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { DustParticles } from '@/components/ui/DustParticles';
import { EyeRadiate } from '@/components/ui/EyeRadiate';

export async function FeatureCards() {
  const t = await getTranslations('FeatureCards');

  return (
    <section className="feature-cards">
      <div className="feature-cards__row">
        {/* Card 1 — Desert landscape with dust particles */}
        <div className="feature-cards__card">
          <Image
            src="/assets/feature-card-desert.webp"
            alt=""
            fill
            loading="lazy"
            quality={75}
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: 'cover', zIndex: 0 }}
          />
          <DustParticles />
          <div className="feature-cards__overlay">
            <span className="feature-cards__label">{t('card1.label')}</span>
            <h3 className="feature-cards__title">{t('card1.title')}</h3>
            <p className="feature-cards__desc">{t('card1.desc')}</p>
          </div>
        </div>

        {/* Card 2 — Portrait with eye radiate rings */}
        <div className="feature-cards__card feature-cards__card--blue">
          <Image
            src="/assets/feature-card-portrait.webp"
            alt=""
            fill
            loading="lazy"
            quality={75}
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: 'cover', zIndex: 0 }}
          />
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
