'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import Image from 'next/image';

function smoothScroll(e: React.MouseEvent<HTMLAnchorElement>) {
  const href = e.currentTarget.getAttribute('href') || '';
  const hashIndex = href.indexOf('#');
  if (hashIndex === -1) return;

  const path = href.slice(0, hashIndex);
  if (path && path !== '/' && path !== window.location.pathname) return;

  const id = href.slice(hashIndex + 1);
  const target = document.getElementById(id);
  if (!target) return;

  e.preventDefault();

  /* Kill any in-flight scroll tweens to prevent stacking */
  gsap.killTweensOf(window);

  gsap.to(window, {
    scrollTo: { y: target, offsetY: 80, autoKill: true },
    duration: 0.9,
    ease: 'power2.out',
    onComplete: () => {
      /* Update URL hash only after scroll finishes — avoids native jump */
      window.history.replaceState(null, '', `#${id}`);
    },
  });
}

function MegaMenuItem({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <a href={href} className="mega-menu__item">
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
        {/* Website Builders */}
        <div className="mega-menu__column">
          <h4 className="mega-menu__heading">{t('websiteBuilders')}</h4>
          <MegaMenuItem title={t('websiteBuildersItems.wordpress')} desc={t('websiteBuildersItems.wordpressDesc')} href="/best-website-builders" />
          <MegaMenuItem title={t('websiteBuildersItems.wix')} desc={t('websiteBuildersItems.wixDesc')} href="/best-website-builders" />
          <MegaMenuItem title={t('websiteBuildersItems.squarespace')} desc={t('websiteBuildersItems.squarespaceDesc')} href="/best-website-builders" />
          <MegaMenuItem title={t('websiteBuildersItems.shopify')} desc={t('websiteBuildersItems.shopifyDesc')} href="/how-to-build-shopify-store" />
          <MegaMenuItem title={t('websiteBuildersItems.webflow')} desc={t('websiteBuildersItems.webflowDesc')} href="/best-website-builders" />
        </div>
        {/* Business Tools */}
        <div className="mega-menu__column">
          <h4 className="mega-menu__heading">{t('hosting')}</h4>
          <MegaMenuItem title={t('hostingItems.cloudways')} desc={t('hostingItems.cloudwaysDesc')} href="/best-website-builders" />
          <MegaMenuItem title={t('hostingItems.siteground')} desc={t('hostingItems.sitegroundDesc')} href="/best-website-builders" />
          <MegaMenuItem title={t('hostingItems.bluehost')} desc={t('hostingItems.bluehostDesc')} href="/best-website-builders" />
          <MegaMenuItem title={t('hostingItems.hostinger')} desc={t('hostingItems.hostingerDesc')} href="/best-website-builders" />
        </div>
        {/* E-Commerce */}
        <div className="mega-menu__column">
          <h4 className="mega-menu__heading">{t('ecommerce')}</h4>
          <MegaMenuItem title={t('ecommerceItems.shopify')} desc={t('ecommerceItems.shopifyDesc')} href="/shopify-vs-salla" />
          <MegaMenuItem title={t('ecommerceItems.woocommerce')} desc={t('ecommerceItems.woocommerceDesc')} href="/best-pos-systems" />
          <MegaMenuItem title={t('ecommerceItems.bigcommerce')} desc={t('ecommerceItems.bigcommerceDesc')} href="/best-pos-systems" />
        </div>
        {/* CRM & Marketing */}
        <div className="mega-menu__column">
          <h4 className="mega-menu__heading">{t('marketing')}</h4>
          <MegaMenuItem title={t('marketingItems.mailchimp')} desc={t('marketingItems.mailchimpDesc')} href="/best-crm-software" />
          <MegaMenuItem title={t('marketingItems.hubspot')} desc={t('marketingItems.hubspotDesc')} href="/best-crm-software" />
          <MegaMenuItem title={t('marketingItems.semrush')} desc={t('marketingItems.semrushDesc')} href="/best-crm-software" />
        </div>
      </div>
    </div>
  );
}

export function Navbar({ transparent = false }: { transparent?: boolean }) {
  const t = useTranslations('Navbar');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
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

  const toggleMobile = () => setMobileOpen((prev) => !prev);

  /* Lock body scroll when mobile menu is open */
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const mobileSmooth = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setMobileOpen(false);
    smoothScroll(e);
  };

  const navClass = [
    'navbar',
    transparent ? 'navbar--transparent' : '',
    mobileOpen ? 'navbar--mobile-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={navClass} ref={navRef}>
      <div className="navbar__inner container">
        <a href="/" className="navbar__logo">
          <Image
            src="/assets/footerbigbelow-logo.webp"
            alt={t('logo')}
            width={120}
            height={46}
            priority
            style={{ objectFit: 'contain', height: 'auto' }}
          />
        </a>

        <nav className="navbar__nav">
          <ul className="navbar__list">
            <li className="navbar__item">
              <a href="/#featured" className="navbar__link" onClick={smoothScroll}>
                {t('reviews')}
              </a>
            </li>
            <li
              className={`navbar__item ${activeMenu === 'categories' ? 'navbar__item--active' : ''}`}
              onMouseEnter={() => openMenu('categories')}
              onMouseLeave={scheduleClose}
            >
              <button className="navbar__link navbar__link--dropdown" type="button" aria-expanded={activeMenu === 'categories'} aria-label={t('categories')}>
                {t('categories')}
                <svg className="navbar__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
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
              <a href="/#editors-pick" className="navbar__link" onClick={smoothScroll}>
                {t('compare')}
              </a>
            </li>
            <li className="navbar__item">
              <a href="/#reviews" className="navbar__link" onClick={smoothScroll}>
                {t('about')}
              </a>
            </li>
            <li className="navbar__item">
              <a href="/blogs" className="navbar__link">
                {t('blog')}
              </a>
            </li>
          </ul>
        </nav>

        <div className="navbar__actions">
          <a href="/#contact" className="navbar__cta" onClick={smoothScroll} data-ph-capture-attribute-button="navbar-browse-reviews">
            {t('newsletter')}
          </a>
        </div>

        <button
          className={`navbar__hamburger ${mobileOpen ? 'navbar__hamburger--open' : ''}`}
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
          onClick={toggleMobile}
        >
          <span className="navbar__hamburger-line" />
          <span className="navbar__hamburger-line" />
          <span className="navbar__hamburger-line" />
        </button>
      </div>

      <div className={`navbar__mobile-menu ${mobileOpen ? 'navbar__mobile-menu--open' : ''}`}>
        <nav className="navbar__mobile-nav">
          <a href="/#featured" className="navbar__mobile-link" onClick={mobileSmooth}>
            {t('reviews')}
          </a>

          <div className="navbar__mobile-accordion">
            <button
              className={`navbar__mobile-link navbar__mobile-link--accordion ${mobileCategoriesOpen ? 'navbar__mobile-link--expanded' : ''}`}
              type="button"
              onClick={() => setMobileCategoriesOpen((prev) => !prev)}
            >
              {t('categories')}
              <svg className="navbar__mobile-chevron" width="12" height="7" viewBox="0 0 12 7" fill="none">
                <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className={`navbar__mobile-categories ${mobileCategoriesOpen ? 'navbar__mobile-categories--open' : ''}`}>
              {/* Technology */}
              <div className="navbar__mobile-cat-group">
                <span className="navbar__mobile-cat-heading">{t('categoriesMenu.websiteBuilders')}</span>
                <a href="/best-website-builders" className="navbar__mobile-cat-item" onClick={() => setMobileOpen(false)}>{t('categoriesMenu.websiteBuildersItems.wordpress')}</a>
                <a href="/best-pos-systems" className="navbar__mobile-cat-item" onClick={() => setMobileOpen(false)}>{t('categoriesMenu.websiteBuildersItems.wix')}</a>
                <a href="/best-crm-software" className="navbar__mobile-cat-item" onClick={() => setMobileOpen(false)}>{t('categoriesMenu.websiteBuildersItems.squarespace')}</a>
                <a href="/best-hr-software" className="navbar__mobile-cat-item" onClick={() => setMobileOpen(false)}>{t('categoriesMenu.websiteBuildersItems.shopify')}</a>
                <a href="/odoo-zatca-compliance" className="navbar__mobile-cat-item" onClick={() => setMobileOpen(false)}>{t('categoriesMenu.websiteBuildersItems.webflow')}</a>
              </div>
              {/* Business Tools */}
              <div className="navbar__mobile-cat-group">
                <span className="navbar__mobile-cat-heading">{t('categoriesMenu.hosting')}</span>
                <a href="/how-to-build-shopify-store" className="navbar__mobile-cat-item" onClick={() => setMobileOpen(false)}>{t('categoriesMenu.hostingItems.cloudways')}</a>
                <a href="/odoo-zatca-compliance" className="navbar__mobile-cat-item" onClick={() => setMobileOpen(false)}>{t('categoriesMenu.hostingItems.siteground')}</a>
                <a href="/best-crm-software" className="navbar__mobile-cat-item" onClick={() => setMobileOpen(false)}>{t('categoriesMenu.hostingItems.bluehost')}</a>
                <a href="/best-hr-software" className="navbar__mobile-cat-item" onClick={() => setMobileOpen(false)}>{t('categoriesMenu.hostingItems.hostinger')}</a>
              </div>
              {/* E-Commerce */}
              <div className="navbar__mobile-cat-group">
                <span className="navbar__mobile-cat-heading">{t('categoriesMenu.ecommerce')}</span>
                <a href="/shopify-vs-salla" className="navbar__mobile-cat-item" onClick={() => setMobileOpen(false)}>{t('categoriesMenu.ecommerceItems.shopify')}</a>
                <a href="/best-pos-systems" className="navbar__mobile-cat-item" onClick={() => setMobileOpen(false)}>{t('categoriesMenu.ecommerceItems.woocommerce')}</a>
                <a href="/best-website-builders" className="navbar__mobile-cat-item" onClick={() => setMobileOpen(false)}>{t('categoriesMenu.ecommerceItems.bigcommerce')}</a>
              </div>
              {/* Restaurant & Food */}
              <div className="navbar__mobile-cat-group">
                <span className="navbar__mobile-cat-heading">{t('categoriesMenu.marketing')}</span>
                <a href="/foodics-review" className="navbar__mobile-cat-item" onClick={() => setMobileOpen(false)}>{t('categoriesMenu.marketingItems.mailchimp')}</a>
                <a href="/best-pos-systems" className="navbar__mobile-cat-item" onClick={() => setMobileOpen(false)}>{t('categoriesMenu.marketingItems.hubspot')}</a>
                <a href="/best-hr-software" className="navbar__mobile-cat-item" onClick={() => setMobileOpen(false)}>{t('categoriesMenu.marketingItems.semrush')}</a>
              </div>
            </div>
          </div>

          <a href="/#editors-pick" className="navbar__mobile-link" onClick={mobileSmooth}>
            {t('compare')}
          </a>
          <a href="/#reviews" className="navbar__mobile-link" onClick={mobileSmooth}>
            {t('about')}
          </a>
          <a href="/blogs" className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>
            {t('blog')}
          </a>
        </nav>
        <a href="/#contact" className="navbar__mobile-cta" onClick={mobileSmooth} data-ph-capture-attribute-button="navbar-mobile-browse-reviews">
          {t('newsletter')}
        </a>
      </div>
    </header>
  );
}
