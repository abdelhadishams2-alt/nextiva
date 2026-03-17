import { getTranslations } from "next-intl/server";

export async function Navbar() {
  const t = await getTranslations("Navbar");

  return (
    <nav className="navbar">
      <div className="navbar__inner container">
        <span className="navbar__logo">{t("logo")}</span>
        <div className="navbar__links">
          <a href="#features" className="navbar__link">
            {t("features")}
          </a>
          <a href="#about" className="navbar__link">
            {t("about")}
          </a>
          <a href="#contact" className="navbar__link">
            {t("contact")}
          </a>
          <a href="#" className="navbar__cta">
            {t("cta")}
          </a>
        </div>
      </div>
    </nav>
  );
}
