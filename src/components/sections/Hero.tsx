import Image from "next/image";
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";
import { HeroShowcase } from "./HeroShowcase";
import { DeferredOnIdle } from "@/components/ui/DeferredOnIdle";
const HeroParticles = dynamic(() => import("./HeroParticles").then(m => ({ default: m.HeroParticles })));
const HeroAnimation = dynamic(() => import("./HeroAnimation").then(m => ({ default: m.HeroAnimation })));

function ArrowIcon() {
  return (
    <span className="hero__btn-arrow">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="2" y="7" width="10" height="2" rx="1" />
        <path d="M9.5 3.5L14 8l-4.5 4.5V3.5z" />
      </svg>
    </span>
  );
}

export async function Hero() {
  const t = await getTranslations("Hero");

  return (
    <section className="hero" id="hero">
      <div className="hero__bg">
        <Image
          src="/assets/hero-backgrounds/hero-main.webp"
          alt=""
          fill
          priority
          fetchPriority="high"
          quality={80}
          sizes="100vw"
          placeholder="blur"
          blurDataURL="data:image/webp;base64,UklGRkgAAABXRUJQVlA4IDwAAADQAQCdASoMAAgAA4BaJQBOgCFqwJ6rAAD+5gvi1dPqI+oulxUeP59bt9bQcdviu8tDJOgPdL2JVXOAAAA="
          style={{ objectFit: 'cover', objectPosition: 'center 40%' }}
        />
      </div>
      <div className="hero__overlay" />
      <div className="hero__blur-bottom" />
      <DeferredOnIdle>
        <HeroParticles />
        <HeroAnimation />
      </DeferredOnIdle>
      <div className="hero__container">
        <div className="hero__content">
          <div className="hero__eyebrow">
            <div className="hero__rating">
              <div className="hero__stars">
                <span className="hero__star">★</span>
                <span className="hero__star">★</span>
                <span className="hero__star">★</span>
                <span className="hero__star">★</span>
                <span className="hero__star hero__star--half">★</span>
              </div>
              <span className="hero__rating-badge">{t("ratingScore")}</span>
              <span className="hero__rating-text">
                <span className="hero__rating-number">{t("ratingNumber")}</span>
                <span className="hero__rating-suffix">{t("ratingSuffix")}</span>
              </span>
            </div>
          </div>

          <h1 className="hero__title">{t("title")}</h1>

          <div className="hero__description">
            <p>
              <strong>{t("subtitleBold")}</strong>
              {t("subtitleRest")}
            </p>
          </div>

          <div className="hero__ctas">
            <a href="/blogs" className="hero__btn hero__btn--primary" data-ph-capture-attribute-button="hero-read-reviews">
              <span className="hero__btn-text">{t("primaryCta")}</span>
              <ArrowIcon />
            </a>
            <a href="/#reviews" className="hero__btn hero__btn--ghost" data-ph-capture-attribute-button="hero-how-we-review">
              <span className="hero__btn-text">{t("secondaryCta")}</span>
              <ArrowIcon />
            </a>
          </div>

          <HeroShowcase />
        </div>
      </div>
    </section>
  );
}
