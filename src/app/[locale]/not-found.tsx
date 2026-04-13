import '@/styles/not-found.css';
import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/sections/Navbar';
import { Footer } from '@/components/sections/Footer';

export default async function NotFoundPage() {
  const t = await getTranslations('NotFound');

  return (
    <>
      <Navbar />
      <section className="not-found">
        <div className="not-found__bg" />
        <span className="not-found__code">404</span>

        <div className="not-found__content">
          <div className="not-found__icon">
            <i className="ri-compass-3-line" />
          </div>
          <h1 className="not-found__title">{t('title')}</h1>
          <p className="not-found__desc">{t('description')}</p>

          <a href="/" className="not-found__btn">
            <i className="ri-arrow-left-line" />
            {t('backHome')}
          </a>

          <div className="not-found__links">
            <a href="/#editors-pick" className="not-found__link">{t('browseReviews')}</a>
            <a href="/blogs" className="not-found__link">{t('readBlog')}</a>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
