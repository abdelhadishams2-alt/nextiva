import Image from "next/image";
import { getTranslations } from "next-intl/server";

const TREND_ICON = (
  <svg
    className="customer-stories__metric-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M16 6L18.29 8.29L13.41 13.17L9.41 9.17L2 16.59L3.41 18L9.41 12L13.41 16L19.71 9.71L22 12V6H16Z" />
  </svg>
);

const BAR_ICON = (
  <svg
    className="customer-stories__metric-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M2 13H8V21H2V13ZM9 3H15V21H9V3ZM16 8H22V21H16V8Z" />
  </svg>
);

interface CardData {
  key: string;
  logo: string;
  logoAlt: string;
  logoWidth: number;
  logoHeight: number;
  icon: React.ReactNode;
}

const CARDS: CardData[] = [
  { key: "card1", logo: "/assets/logo-hyundai.png", logoAlt: "Hyundai", logoWidth: 213, logoHeight: 56, icon: TREND_ICON },
  { key: "card2", logo: "/assets/logo-dhl.png", logoAlt: "DHL", logoWidth: 144, logoHeight: 20, icon: TREND_ICON },
  { key: "card3", logo: "/assets/logo-nothing-bundt-cakes.png", logoAlt: "Nothing Bundt Cakes", logoWidth: 300, logoHeight: 300, icon: BAR_ICON },
  { key: "card4", logo: "/assets/logo-franklin-street.png", logoAlt: "Franklin Street", logoWidth: 40, logoHeight: 40, icon: BAR_ICON },
  { key: "card5", logo: "/assets/logo-tabarka.png", logoAlt: "Tabarka Studio", logoWidth: 40, logoHeight: 40, icon: TREND_ICON },
  { key: "card6", logo: "/assets/logo-shelby-circle.png", logoAlt: "Shelby American", logoWidth: 300, logoHeight: 300, icon: TREND_ICON },
];

export async function CustomerStories() {
  const t = await getTranslations("CustomerStories");

  return (
    <section className="customer-stories">
      <div className="customer-stories__container">
        {/* Header Row */}
        <div className="customer-stories__header-row">
          <div className="customer-stories__header">
            <span className="customer-stories__eyebrow">{t("eyebrow")}</span>
            <h2 className="customer-stories__title">{t("title")}</h2>
          </div>

          <div className="customer-stories__trust-badges">
            <div className="customer-stories__badge-item">
              <Image
                src="/assets/logo-trustpilot.png"
                alt="Trustpilot"
                width={300}
                height={74}
                className="customer-stories__badge-logo"
              />
              <span className="customer-stories__stars">★★★★★</span>
              <span className="customer-stories__rating">
                {t("badges.trustpilot")}
              </span>
            </div>
            <div className="customer-stories__badge-item">
              <Image
                src="/assets/logo-g2.png"
                alt="G2"
                width={100}
                height={100}
                className="customer-stories__badge-logo"
              />
              <span className="customer-stories__stars">★★★★★</span>
              <span className="customer-stories__rating">
                {t("badges.g2")}
              </span>
            </div>
            <div className="customer-stories__badge-item">
              <Image
                src="/assets/logo-gartner.webp"
                alt="Gartner"
                width={300}
                height={170}
                className="customer-stories__badge-logo customer-stories__badge-logo--gartner"
              />
              <span className="customer-stories__stars">★★★★★</span>
              <span className="customer-stories__rating">
                {t("badges.gartner")}
              </span>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="customer-stories__cards">
          {CARDS.map((card) => (
            <div key={card.key} className="customer-stories__card">
              <div className="customer-stories__card-header">
                <div className="customer-stories__card-logo">
                  <Image
                    src={card.logo}
                    alt={card.logoAlt}
                    width={card.logoWidth}
                    height={card.logoHeight}
                  />
                </div>
                <span className="customer-stories__card-metric">
                  {card.icon}
                  {t(`${card.key}.metric`)}
                </span>
              </div>

              <p className="customer-stories__card-text">
                {t(`${card.key}.text`)}
              </p>

              <div className="customer-stories__card-footer">
                <div className="customer-stories__card-stars">★★★★★</div>
                <div className="customer-stories__card-author">
                  <span className="customer-stories__card-name">
                    {t(`${card.key}.name`)}
                  </span>
                  <span className="customer-stories__card-role">
                    {t(`${card.key}.role`)}
                  </span>
                  <span className="customer-stories__card-company">
                    {t(`${card.key}.company`)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
