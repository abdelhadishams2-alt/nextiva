'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import Image from 'next/image';

function NewBadge() {
  return <span className="navbar__badge">NEW</span>;
}

function MegaMenuItem({ title, desc, badge }: { title: string; desc: string; badge?: boolean }) {
  return (
    <a href="#" className="mega-menu__item">
      <span className="mega-menu__item-title">
        {title}
        {badge && <NewBadge />}
      </span>
      <span className="mega-menu__item-desc">{desc}</span>
    </a>
  );
}

function ProductsDropdown() {
  const t = useTranslations('Navbar.productsMenu');
  return (
    <div className="mega-menu mega-menu--products">
      <div className="mega-menu__grid mega-menu__grid--4col">
        <div className="mega-menu__column">
          <h4 className="mega-menu__heading">{t('product')}</h4>
          <MegaMenuItem title={t('nextPlatform')} desc={t('nextPlatformDesc')} badge />
          <MegaMenuItem title={t('xbert')} desc={t('xbertDesc')} badge />
          <MegaMenuItem title={t('contactCenter')} desc={t('contactCenterDesc')} />
          <MegaMenuItem title={t('businessPhone')} desc={t('businessPhoneDesc')} />
        </div>
        <div className="mega-menu__column">
          <h4 className="mega-menu__heading">{t('aiCapabilities')}</h4>
          <MegaMenuItem title={t('aiEmployee')} desc={t('aiEmployeeDesc')} />
          <MegaMenuItem title={t('agentAssist')} desc={t('agentAssistDesc')} />
          <MegaMenuItem title={t('aiReceptionist')} desc={t('aiReceptionistDesc')} />
        </div>
        <div className="mega-menu__column">
          <h4 className="mega-menu__heading">{t('channels')}</h4>
          <MegaMenuItem title={t('voiceTexting')} desc={t('voiceTextingDesc')} />
          <MegaMenuItem title={t('liveChat')} desc={t('liveChatDesc')} />
          <MegaMenuItem title={t('messenger')} desc={t('messengerDesc')} />
          <MegaMenuItem title={t('email')} desc={t('emailDesc')} />
          <MegaMenuItem title={t('socialReviews')} desc={t('socialReviewsDesc')} />
          <MegaMenuItem title={t('videoMeetings')} desc={t('videoMeetingsDesc')} />
        </div>
        <div className="mega-menu__column">
          <h4 className="mega-menu__heading">{t('advanced')}</h4>
          <MegaMenuItem title={t('integrations')} desc={t('integrationsDesc')} />
          <MegaMenuItem title={t('analyticsReporting')} desc={t('analyticsReportingDesc')} />
          <MegaMenuItem title={t('workforceEngagement')} desc={t('workforceEngagementDesc')} />
          <MegaMenuItem title={t('journeyOrchestration')} desc={t('journeyOrchestrationDesc')} />
        </div>
      </div>
      <div className="mega-menu__footer">
        <Image src="/assets/xbert-icon.svg" alt="" width={32} height={32} className="mega-menu__footer-icon" />
        <div className="mega-menu__footer-text">
          <strong>{t('meetXbert')}</strong>
          <span>{t('meetXbertDesc')}</span>
        </div>
      </div>
    </div>
  );
}

function SolutionsDropdown() {
  const t = useTranslations('Navbar.solutionsMenu');
  return (
    <div className="mega-menu mega-menu--solutions">
      <div className="mega-menu__grid mega-menu__grid--3col">
        <div className="mega-menu__column">
          <h4 className="mega-menu__heading">{t('industries')}</h4>
          <MegaMenuItem title={t('healthcare')} desc={t('healthcareDesc')} />
          <MegaMenuItem title={t('accounting')} desc={t('accountingDesc')} />
          <MegaMenuItem title={t('realEstate')} desc={t('realEstateDesc')} />
          <MegaMenuItem title={t('retail')} desc={t('retailDesc')} />
          <MegaMenuItem title={t('automotive')} desc={t('automotiveDesc')} />
          <MegaMenuItem title={t('legal')} desc={t('legalDesc')} />
        </div>
        <div className="mega-menu__column mega-menu__column--no-border">
          <h4 className="mega-menu__heading mega-menu__heading--hidden">{t('industries')}</h4>
          <MegaMenuItem title={t('insurance')} desc={t('insuranceDesc')} />
          <MegaMenuItem title={t('logistics')} desc={t('logisticsDesc')} />
          <MegaMenuItem title={t('restaurants')} desc={t('restaurantsDesc')} />
          <MegaMenuItem title={t('nonprofit')} desc={t('nonprofitDesc')} />
          <MegaMenuItem title={t('education')} desc={t('educationDesc')} />
          <MegaMenuItem title={t('government')} desc={t('governmentDesc')} />
        </div>
        <div className="mega-menu__column">
          <h4 className="mega-menu__heading">{t('solutions')}</h4>
          <MegaMenuItem title={t('smallBusiness')} desc={t('smallBusinessDesc')} />
          <MegaMenuItem title={t('midMarketEnterprise')} desc={t('midMarketEnterpriseDesc')} />
          <MegaMenuItem title={t('partners')} desc={t('partnersDesc')} />
        </div>
      </div>
    </div>
  );
}

function ResourcesDropdown() {
  const t = useTranslations('Navbar.resourcesMenu');
  return (
    <div className="mega-menu mega-menu--resources">
      <div className="mega-menu__grid mega-menu__grid--3col">
        <div className="mega-menu__column">
          <h4 className="mega-menu__heading">{t('company')}</h4>
          <MegaMenuItem title={t('leadership')} desc={t('leadershipDesc')} />
          <MegaMenuItem title={t('boardOfDirectors')} desc={t('boardOfDirectorsDesc')} />
          <MegaMenuItem title={t('careers')} desc={t('careersDesc')} />
          <MegaMenuItem title={t('trustReliability')} desc={t('trustReliabilityDesc')} />
          <MegaMenuItem title={t('contactUs')} desc={t('contactUsDesc')} />
        </div>
        <div className="mega-menu__column">
          <h4 className="mega-menu__heading">{t('helpfulAssets')}</h4>
          <MegaMenuItem title={t('downloadNextiva')} desc={t('downloadNextivaDesc')} />
          <MegaMenuItem title={t('resourceCenter')} desc={t('resourceCenterDesc')} />
          <MegaMenuItem title={t('blog')} desc={t('blogDesc')} />
          <MegaMenuItem title={t('demoCenter')} desc={t('demoCenterDesc')} />
          <MegaMenuItem title={t('serviceDelivery')} desc={t('serviceDeliveryDesc')} />
        </div>
        <div className="mega-menu__column">
          <h4 className="mega-menu__heading">{t('highlightsInsights')}</h4>
          <MegaMenuItem title={t('customerStories')} desc={t('customerStoriesDesc')} />
          <MegaMenuItem title={t('news')} desc={t('newsDesc')} />
          <MegaMenuItem title={t('awards')} desc={t('awardsDesc')} />
          <MegaMenuItem title={t('amazingService')} desc={t('amazingServiceDesc')} />
          <MegaMenuItem title={t('events')} desc={t('eventsDesc')} />
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
          <Image
            src="/assets/xbert-icon.svg"
            alt=""
            width={20}
            height={20}
            className="navbar__logo-icon"
          />
          <svg
            className="navbar__logo-wordmark"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64.66 15.01"
            aria-label={t('logo')}
          >
            <path d="M0,14.72V4.49h2.56v1.34h.37c.17-.36.47-.7.93-1.02.45-.32,1.14-.48,2.06-.48.8,0,1.49.18,2.09.55s1.06.87,1.39,1.5c.33.64.5,1.38.5,2.24v6.1h-2.6v-5.9c0-.77-.19-1.35-.57-1.73s-.92-.58-1.62-.58c-.8,0-1.42.26-1.85.79-.44.53-.66,1.27-.66,2.22v5.19H0Z" fill="currentColor" />
            <path d="M16.12,15.01c-1.02,0-1.91-.22-2.69-.65-.78-.43-1.38-1.04-1.81-1.83s-.65-1.72-.65-2.79v-.25c0-1.07.21-2,.64-2.79.43-.79,1.02-1.4,1.79-1.83.77-.43,1.66-.65,2.68-.65s1.88.22,2.62.67c.74.45,1.32,1.07,1.73,1.86s.62,1.71.62,2.75v.89h-7.44c.03.7.29,1.27.78,1.71.5.44,1.1.66,1.81.66s1.26-.16,1.61-.47c.34-.32.6-.67.78-1.05l2.12,1.11c-.19.36-.47.75-.83,1.17s-.85.78-1.45,1.07c-.6.29-1.37.44-2.31.44ZM13.62,8.43h4.78c-.05-.59-.29-1.06-.71-1.42-.42-.36-.97-.54-1.64-.54s-1.26.18-1.67.54-.67.83-.76,1.42Z" fill="currentColor" />
            <path d="M20.55,14.72l3.71-5.15-3.67-5.07h3.01l2.33,3.4h.37l2.33-3.4h3.01l-3.67,5.07,3.71,5.15h-3.05l-2.33-3.44h-.37l-2.33,3.44h-3.05Z" fill="currentColor" />
            <path d="M39.47,6.63v-2.14h-2.8V1.32h-2.6v3.17h-1l-1.55,2.14h2.55v5.77c0,.71.21,1.27.63,1.68.42.42.97.63,1.64.63h2.89v-2.14h-1.98c-.39,0-.58-.21-.58-.62v-5.32h2.8Z" fill="currentColor" />
            <path d="M41.89,3.3c-.47,0-.86-.15-1.18-.45-.32-.3-.48-.7-.48-1.2s.16-.89.48-1.2c.32-.3.72-.45,1.18-.45s.88.15,1.2.45c.32.3.47.7.47,1.2s-.16.89-.47,1.2c-.32.3-.71.45-1.2.45Z" fill="currentColor" />
            <rect x="40.59" y="4.49" width="2.6" height="10.22" fill="currentColor" />
            <path d="M46.98,14.72l-3.26-10.22h2.76l2.37,8.33h.37l2.37-8.33h2.76l-3.26,10.22h-4.12Z" fill="currentColor" />
            <path d="M57.82,15.01c-.73,0-1.38-.13-1.96-.38s-1.03-.62-1.37-1.11c-.34-.49-.5-1.08-.5-1.78s.17-1.29.5-1.76c.34-.47.8-.83,1.4-1.07.6-.24,1.28-.36,2.05-.36h2.8v-.58c0-.48-.15-.88-.45-1.18-.3-.31-.78-.46-1.44-.46s-1.13.15-1.44.44c-.32.29-.52.68-.62,1.14l-2.39-.8c.17-.52.43-1,.79-1.43s.85-.78,1.46-1.05c.61-.27,1.36-.4,2.24-.4,1.35,0,2.41.34,3.2,1.01.78.67,1.17,1.65,1.17,2.93v3.81c0,.41.19.62.58.62h.82v2.14h-1.73c-.51,0-.93-.12-1.26-.37-.33-.25-.49-.58-.49-.99v-.02h-.39c-.06.17-.18.38-.37.65-.19.27-.5.5-.91.71s-.98.31-1.69.31ZM58.27,12.9c.73,0,1.32-.2,1.78-.61.46-.41.69-.95.69-1.62v-.21h-2.62c-.48,0-.86.1-1.13.31-.28.21-.41.5-.41.87s.14.67.43.91c.29.23.71.35,1.26.35Z" fill="currentColor" />
          </svg>
        </a>

        <nav className="navbar__nav">
          <ul className="navbar__list">
            <li
              className={`navbar__item ${activeMenu === 'products' ? 'navbar__item--active' : ''}`}
              onMouseEnter={() => openMenu('products')}
              onMouseLeave={scheduleClose}
            >
              <button className="navbar__link navbar__link--dropdown" type="button">
                {t('products')}
                <svg className="navbar__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {activeMenu === 'products' && (
                <div
                  className="navbar__dropdown"
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                >
                  <ProductsDropdown />
                </div>
              )}
            </li>
            <li
              className={`navbar__item ${activeMenu === 'solutions' ? 'navbar__item--active' : ''}`}
              onMouseEnter={() => openMenu('solutions')}
              onMouseLeave={scheduleClose}
            >
              <button className="navbar__link navbar__link--dropdown" type="button">
                {t('solutions')}
                <svg className="navbar__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {activeMenu === 'solutions' && (
                <div
                  className="navbar__dropdown"
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                >
                  <SolutionsDropdown />
                </div>
              )}
            </li>
            <li
              className={`navbar__item ${activeMenu === 'resources' ? 'navbar__item--active' : ''}`}
              onMouseEnter={() => openMenu('resources')}
              onMouseLeave={scheduleClose}
            >
              <button className="navbar__link navbar__link--dropdown" type="button">
                {t('resources')}
                <svg className="navbar__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {activeMenu === 'resources' && (
                <div
                  className="navbar__dropdown"
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                >
                  <ResourcesDropdown />
                </div>
              )}
            </li>
            <li className="navbar__item">
              <a href="/pricing" className="navbar__link">
                {t('pricing')}
              </a>
            </li>
          </ul>
        </nav>

        <div className="navbar__actions">
          <a href="tel:8007990600" className="navbar__phone">
            <svg className="navbar__phone-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M14.5 11.35v1.9a1.27 1.27 0 01-1.38 1.27 12.52 12.52 0 01-5.46-1.94 12.34 12.34 0 01-3.8-3.8A12.52 12.52 0 011.92 3.3 1.27 1.27 0 013.18 1.93h1.9a1.27 1.27 0 011.27 1.09c.08.6.23 1.2.44 1.77a1.27 1.27 0 01-.29 1.34L5.7 6.93a10.16 10.16 0 003.8 3.8l.8-.8a1.27 1.27 0 011.34-.29c.57.21 1.17.36 1.77.44a1.27 1.27 0 011.09 1.27z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t('salesPhone')}
          </a>
          <button className="navbar__link navbar__link--dropdown" type="button">
            {t('support')}
            <svg className="navbar__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button className="navbar__login" type="button">
            {t('logIn')}
            <svg className="navbar__chevron" width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <a href="/demo" className="navbar__cta">
            {t('getADemo')}
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
