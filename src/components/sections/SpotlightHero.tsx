import { getTranslations } from "next-intl/server";

export async function SpotlightHero() {
  const t = await getTranslations("SpotlightHero");

  return (
    <section className="spotlight-hero">
      <div className="spotlight-hero__container">
        <div className="spotlight-hero__grid">
          {/* Card 1 — Search/Review icon */}
          <div className="spotlight-hero__card">
            <div className="spotlight-hero__icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                width="20"
                height="20"
              >
                <path d="M18.031 16.617l4.283 4.282-1.415 1.415-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9 9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617zm-2.006-.742A6.977 6.977 0 0 0 18 11c0-3.868-3.133-7-7-7-3.868 0-7 3.132-7 7 0 3.867 3.132 7 7 7a6.977 6.977 0 0 0 4.875-1.975l.15-.15zm-3.847-8.699l2.038 4.135 4.56.662-3.3 3.215.779 4.54-4.077-2.144-4.078 2.144.78-4.54-3.3-3.215 4.559-.662 2.039-4.135z" />
              </svg>
            </div>
            <div className="spotlight-hero__body">
              <h3 className="spotlight-hero__card-title">
                {t("card1.title")}
              </h3>
              <p className="spotlight-hero__card-desc">{t("card1.desc")}</p>
            </div>
            <div className="spotlight-hero__badges">
              <span className="spotlight-hero__badge-tag">
                {t("card1.badge1")}
              </span>
              <span className="spotlight-hero__badge-tag">
                {t("card1.badge2")}
              </span>
            </div>
          </div>

          {/* Card 2 — Compare/Scale icon */}
          <div className="spotlight-hero__card">
            <div className="spotlight-hero__icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                width="20"
                height="20"
              >
                <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 2a6 6 0 0 1 6 6h-6V6z" />
              </svg>
            </div>
            <div className="spotlight-hero__body">
              <h3 className="spotlight-hero__card-title">
                {t("card2.title")}
              </h3>
              <p className="spotlight-hero__card-desc">{t("card2.desc")}</p>
            </div>
            <div className="spotlight-hero__badges">
              <span className="spotlight-hero__badge-tag">
                {t("card2.badge1")}
              </span>
              <span className="spotlight-hero__badge-tag">
                {t("card2.badge2")}
              </span>
            </div>
          </div>

          {/* Card 3 — Expert/Award icon */}
          <div className="spotlight-hero__card">
            <div className="spotlight-hero__icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                width="20"
                height="20"
              >
                <path d="M17 15.245v6.872a.5.5 0 0 1-.757.429L12 20l-4.243 2.546a.5.5 0 0 1-.757-.43v-6.87a8 8 0 1 1 10 0zm-5 .755a6 6 0 1 0 0-12 6 6 0 0 0 0 12zm0-3l-2.939 1.545.561-3.272-2.377-2.318 3.286-.478L12 5.5l1.469 2.977 3.286.478-2.377 2.318.56 3.272L12 13z" />
              </svg>
            </div>
            <div className="spotlight-hero__body">
              <h3 className="spotlight-hero__card-title">
                {t("card3.title")}
              </h3>
              <p className="spotlight-hero__card-desc">{t("card3.desc")}</p>
            </div>
            <div className="spotlight-hero__badges">
              <span className="spotlight-hero__badge-tag">
                {t("card3.badge1")}
              </span>
              <span className="spotlight-hero__badge-tag">
                {t("card3.badge2")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
