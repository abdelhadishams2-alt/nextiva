import { getTranslations } from "next-intl/server";

export async function SpotlightHero() {
  const t = await getTranslations("SpotlightHero");

  return (
    <section className="spotlight-hero">
      <div className="spotlight-hero__container">
        <div className="spotlight-hero__grid">
          {/* Card 1 — XBert icon */}
          <div className="spotlight-hero__card">
            <div className="spotlight-hero__icon">
              <svg
                className="spotlight-hero__xbert-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 18.89 27.41"
                fill="currentColor"
                aria-hidden="true"
              >
                <g>
                  <path d="M10.03,21.82c-1.66,1.72-5.85,5.6-8.29,5.6-1.41,0-1.85-1.23-1.7-2.44.34-2.73,4.07-7.67,5.85-9.88,1.39-1.73,2.58-1.98.3-3.77-.45-.36-2.15-1.58-2.65-1.41-.42.43.12,1.44.33,1.95.27.64,1.04,1.72.96,2.38-.1.89-1.18,1.17-1.83.59-.41-.37-1.77-2.87-2.06-3.49-.52-1.1-1.39-3.05-.66-4.15,1.38-2.07,5.07.69,6.43,1.73.95.72,1.82,1.54,2.7,2.34,1.73-1.48,3.57-3.3,5.66-4.28,1.74-.81,4.03-1,3.8,1.6-.31,3.49-6.33,10.64-8.83,13.23ZM3.38,23.68c.2.59,1.7-.47,2.01-.69,2.97-2.02,8.58-8.49,9.87-11.83.41-1.07.49-1.58-.81-1.02-3.09,1.35-9.7,9.15-10.83,12.34-.11.32-.36.87-.25,1.19Z" />
                  <path d="M10.52,23.46c-.09-.45.34-1.25.79-1.36.85-.22,1.43.6,2.09,1,4.43,2.72.62-2.25.66-3.28.04-.93,1.29-1.35,1.98-.62.53.56,1.68,2.75,2.02,3.53.48,1.08,1.27,2.92.46,3.95-1.37,1.74-4.67-.5-6-1.45-.39-.28-1.93-1.41-2-1.78Z" />
                </g>
                <polygon points="9.44 0 10.56 3.03 13.59 4.15 10.56 5.27 9.44 8.3 8.32 5.27 5.29 4.15 8.32 3.03 9.44 0" />
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

          {/* Card 2 — Shield icon */}
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
                <path d="M12 1l8.217 1.826a1 1 0 0 1 .783.976v9.987a6 6 0 0 1-2.672 4.992L12 23l-6.328-4.219A6 6 0 0 1 3 13.79V3.802a1 1 0 0 1 .783-.976L12 1zm4.452 7.222l-4.95 4.95-2.828-2.828-1.414 1.414L11.503 16l6.364-6.364-1.415-1.414z" />
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

          {/* Card 3 — User handoff icon */}
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
                <path d="M14 14.252V22H4a8 8 0 0 1 10-7.748zM12 13c-3.315 0-6-2.685-6-6s2.685-6 6-6 6 2.685 6 6-2.685 6-6 6zm7.418 4h3.586v2h-3.586l1.829 1.828-1.414 1.415L16.076 18.5l3.757-3.743 1.414 1.415L19.418 18z" />
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
