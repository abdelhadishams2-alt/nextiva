import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations("Footer");

  return (
    <footer className="footer">
      <div className="footer__inner container">
        <span className="footer__copy">{t("copy")}</span>
        <div className="footer__links">
          <a href="#" className="footer__link">
            {t("privacy")}
          </a>
          <a href="#" className="footer__link">
            {t("terms")}
          </a>
        </div>
      </div>
    </footer>
  );
}
