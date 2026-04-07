import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/sections/Navbar';
import { Footer } from '@/components/sections/Footer';
import { SITE_CONFIG } from '@/config/site';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('PrivacyPolicy');
  return {
    title: `${t('title')} — ${SITE_CONFIG.name}`,
    description: t('metaDescription'),
    robots: { index: true, follow: true },
    alternates: { canonical: `${SITE_CONFIG.url}/privacy-policy` },
  };
}

export default async function PrivacyPolicyPage() {
  const t = await getTranslations('PrivacyPolicy');

  return (
    <>
      <Navbar />
      <main className="legal">
        <div className="legal__container">
          <h1 className="legal__title">{t('title')}</h1>
          <p className="legal__updated">{t('lastUpdated')}</p>

          <section className="legal__section">
            <h2 className="legal__heading">{t('intro.heading')}</h2>
            <p className="legal__text">{t('intro.text')}</p>
          </section>

          <section className="legal__section">
            <h2 className="legal__heading">{t('dataCollection.heading')}</h2>
            <p className="legal__text">{t('dataCollection.text')}</p>
            <ul className="legal__list">
              <li>{t('dataCollection.item1')}</li>
              <li>{t('dataCollection.item2')}</li>
              <li>{t('dataCollection.item3')}</li>
              <li>{t('dataCollection.item4')}</li>
            </ul>
          </section>

          <section className="legal__section">
            <h2 className="legal__heading">{t('analytics.heading')}</h2>
            <p className="legal__text">{t('analytics.text')}</p>
          </section>

          <section className="legal__section">
            <h2 className="legal__heading">{t('cookies.heading')}</h2>
            <p className="legal__text">{t('cookies.text')}</p>
          </section>

          <section className="legal__section">
            <h2 className="legal__heading">{t('affiliateLinks.heading')}</h2>
            <p className="legal__text">{t('affiliateLinks.text')}</p>
          </section>

          <section className="legal__section">
            <h2 className="legal__heading">{t('thirdParty.heading')}</h2>
            <p className="legal__text">{t('thirdParty.text')}</p>
          </section>

          <section className="legal__section">
            <h2 className="legal__heading">{t('yourRights.heading')}</h2>
            <p className="legal__text">{t('yourRights.text')}</p>
            <ul className="legal__list">
              <li>{t('yourRights.item1')}</li>
              <li>{t('yourRights.item2')}</li>
              <li>{t('yourRights.item3')}</li>
            </ul>
          </section>

          <section className="legal__section">
            <h2 className="legal__heading">{t('changes.heading')}</h2>
            <p className="legal__text">{t('changes.text')}</p>
          </section>

          <section className="legal__section">
            <h2 className="legal__heading">{t('contact.heading')}</h2>
            <p className="legal__text">{t('contact.text')}</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
