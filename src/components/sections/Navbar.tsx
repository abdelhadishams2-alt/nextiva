'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

function MegaMenuItem({ title, desc }: { title: string; desc: string }) {
  return (
    <a href="#" className="mega-menu__item">
      <span className="mega-menu__item-title">{title}</span>
      <span className="mega-menu__item-desc">{desc}</span>
    </a>
  );
}

function CategoriesDropdown() {
  const t = useTranslations('Navbar.categoriesMenu');
  return (
    <div className="mega-menu mega-menu--categories">
      <div className="mega-menu__grid">
        <div className="mega-menu__column">
          <h4 className="mega-menu__heading">{t('websiteBuilders')}</h4>
          <MegaMenuItem title={t('websiteBuildersItems.wordpress')} desc={t('websiteBuildersItems.wordpressDesc')} />
          <MegaMenuItem title={t('websiteBuildersItems.wix')} desc={t('websiteBuildersItems.wixDesc')} />
          <MegaMenuItem title={t('websiteBuildersItems.squarespace')} desc={t('websiteBuildersItems.squarespaceDesc')} />
          <MegaMenuItem title={t('websiteBuildersItems.shopify')} desc={t('websiteBuildersItems.shopifyDesc')} />
          <MegaMenuItem title={t('websiteBuildersItems.webflow')} desc={t('websiteBuildersItems.webflowDesc')} />
        </div>
        <div className="mega-menu__column">
          <h4 className="mega-menu__heading">{t('hosting')}</h4>
          <MegaMenuItem title={t('hostingItems.cloudways')} desc={t('hostingItems.cloudwaysDesc')} />
          <MegaMenuItem title={t('hostingItems.siteground')} desc={t('hostingItems.sitegroundDesc')} />
          <MegaMenuItem title={t('hostingItems.bluehost')} desc={t('hostingItems.bluehostDesc')} />
          <MegaMenuItem title={t('hostingItems.hostinger')} desc={t('hostingItems.hostingerDesc')} />
        </div>
        <div className="mega-menu__column">
          <h4 className="mega-menu__heading">{t('ecommerce')}</h4>
          <MegaMenuItem title={t('ecommerceItems.shopify')} desc={t('ecommerceItems.shopifyDesc')} />
          <MegaMenuItem title={t('ecommerceItems.woocommerce')} desc={t('ecommerceItems.woocommerceDesc')} />
          <MegaMenuItem title={t('ecommerceItems.bigcommerce')} desc={t('ecommerceItems.bigcommerceDesc')} />
        </div>
        <div className="mega-menu__column">
          <h4 className="mega-menu__heading">{t('marketing')}</h4>
          <MegaMenuItem title={t('marketingItems.mailchimp')} desc={t('marketingItems.mailchimpDesc')} />
          <MegaMenuItem title={t('marketingItems.hubspot')} desc={t('marketingItems.hubspotDesc')} />
          <MegaMenuItem title={t('marketingItems.semrush')} desc={t('marketingItems.semrushDesc')} />
        </div>
      </div>
    </div>
  );
}

export function Navbar({ transparent = false }: { transparent?: boolean }) {
  const t = useTranslations('Navbar');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = (menu: string) => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
    setActiveMenu(menu);
  };

  const scheduleClose = () => {
    closeTimeout.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
  };

  const cancelClose = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  };

  const navClass = [
    'navbar',
    transparent ? 'navbar--transparent' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={navClass} ref={navRef}>
      <div className="navbar__inner container">
        <a href="/" className="navbar__logo">
          <span className="navbar__logo-mark">M</span>
          <span className="navbar__logo-text">{t('logo')}</span>
        </a>

        <nav className="navbar__nav">
          <ul className="navbar__list">
            <li className="navbar__item">
              <a href="/reviews" className="navbar__link">
                {t('reviews')}
              </a>
            </li>
            <li
              className={`navbar__item ${activeMenu === 'categories' ? 'navbar__item--active' : ''}`}
              onMouseEnter={() => openMenu('categories')}
              onMouseLeave={scheduleClose}
            >
              <button className="navbar__link navbar__link--dropdown" type="button">
                {t('categories')}
                <svg className="navbar__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {activeMenu === 'categories' && (
                <div
                  className="navbar__dropdown"
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                >
                  <CategoriesDropdown />
                </div>
              )}
            </li>
            <li className="navbar__item">
              <a href="/compare" className="navbar__link">
                {t('compare')}
              </a>
            </li>
            <li className="navbar__item">
              <a href="/about" className="navbar__link">
                {t('about')}
              </a>
            </li>
          </ul>
        </nav>

        <div className="navbar__actions">
          <a href="/newsletter" className="navbar__cta">
            {t('newsletter')}
          </a>
        </div>

        <button className="navbar__hamburger" type="button" aria-label="Toggle navigation">
          <span className="navbar__hamburger-line" />
          <span className="navbar__hamburger-line" />
          <span className="navbar__hamburger-line" />
        </button>
      </div>
    </header>
  );
}
