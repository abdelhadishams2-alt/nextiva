import { getTranslations } from "next-intl/server";

export async function Hero() {
  const t = await getTranslations("Hero");

  return (
    <section className="hero">
      <div className="hero__content container">
        <h1 className="hero__title">{t("title")}</h1>
        <p className="hero__subtitle">{t("subtitle")}</p>
        <div className="hero__actions">
          <a href="#" className="hero__btn hero__btn--primary">
            {t("primaryCta")}
          </a>
          <a href="#" className="hero__btn hero__btn--secondary">
            {t("secondaryCta")}
          </a>
        </div>
      </div>
    </section>
  );
}
