import "@/styles/legal.css";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Navbar } from '@/components/sections/Navbar';
import { Footer } from '@/components/sections/Footer';
import { SITE_CONFIG } from '@/config/site';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return [{ locale: 'en' }];
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Terms');
  return {
    title: `${t('title')} — ${SITE_CONFIG.name}`,
    description: t('metaDescription'),
    robots: { index: true, follow: true },
    alternates: { canonical: `${SITE_CONFIG.url}/terms` },
    openGraph: {
      title: `${t('title')} — ${SITE_CONFIG.name}`,
      description: t('metaDescription'),
      url: `${SITE_CONFIG.url}/terms`,
      siteName: SITE_CONFIG.name,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${t('title')} — ${SITE_CONFIG.name}`,
      description: t('metaDescription'),
    },
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Terms');

  return (
    <>
      <Navbar />
      <main className="legal">
        <div className="legal__container">
          <h1 className="legal__title">{t('title')}</h1>
          <p className="legal__updated">{t('lastUpdated')}</p>

          <section className="legal__section">
            <h2 className="legal__heading">{t('acceptance.heading')}</h2>
            <p className="legal__text">{t('acceptance.text')}</p>
          </section>

          <section className="legal__section">
            <h2 className="legal__heading">{t('content.heading')}</h2>
            <p className="legal__text">{t('content.text')}</p>
          </section>

          <section className="legal__section">
            <h2 className="legal__heading">{t('affiliateDisclosure.heading')}</h2>
            <p className="legal__text">{t('affiliateDisclosure.text')}</p>
          </section>

          <section className="legal__section">
            <h2 className="legal__heading">{t('intellectualProperty.heading')}</h2>
            <p className="legal__text">{t('intellectualProperty.text')}</p>
          </section>

          <section className="legal__section">
            <h2 className="legal__heading">{t('disclaimer.heading')}</h2>
            <p className="legal__text">{t('disclaimer.text')}</p>
          </section>

          <section className="legal__section">
            <h2 className="legal__heading">{t('limitation.heading')}</h2>
            <p className="legal__text">{t('limitation.text')}</p>
          </section>

          <section className="legal__section">
            <h2 className="legal__heading">{t('externalLinks.heading')}</h2>
            <p className="legal__text">{t('externalLinks.text')}</p>
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
