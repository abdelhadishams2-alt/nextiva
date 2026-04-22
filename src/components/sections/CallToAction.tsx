import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { BLUR_DATA_URL } from '@/lib/blur-placeholder';

export async function CallToAction() {
  const t = await getTranslations('CallToAction');

  return (
    <section className="cta-hero" id="contact">
      <div className="cta-hero__bg">
        <Image
          src="/assets/cta-bg-new.webp"
          alt=""
          fill
          /* eager + low priority — starts downloading at page load without competing with the hero LCP */
          loading="eager"
          fetchPriority="low"
          quality={75}
          sizes="100vw"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          style={{ objectFit: 'cover' }}
        />
      </div>

      <div className="cta-hero__content">
        <h2 className="cta-hero__headline">{t('headline')}</h2>
        <p className="cta-hero__subhead">{t('subhead')}</p>

        <div className="cta-hero__cta">
          <a className="cta-hero__btn cta-hero__btn--primary" href="/blogs" data-ph-capture-attribute-button="cta-browse-reviews">
            <span className="cta-hero__btn-text">{t('demoCta')}</span>
            <span className="cta-hero__btn-arrow">
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
            </span>
          </a>

          {/* Subscribe button — uncomment when ready
          <a className="cta-hero__btn cta-hero__btn--ghost" href="/#featured">
            <span className="cta-hero__btn-text">{t('salesCta')}</span>
            <span className="cta-hero__btn-arrow">
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
            </span>
          </a>
          */}
        </div>
      </div>
    </section>
  );
}
