'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

type TabId = 'customer-interactions' | 'xbert-ai' | 'customer-experience' | 'connected-tools';

export function NextPlatform() {
  const t = useTranslations('NextPlatform');
  const [activeTab, setActiveTab] = useState<TabId>('customer-interactions');

  return (
    <section className="next-platform">
      {/* Header Row */}
      <div className="next-platform__header">
        <div className="next-platform__header-left">
          <span className="next-platform__badge">{t('badge')}</span>
          <h2 className="next-platform__heading">{t('title')}</h2>
        </div>

        <div className="next-platform__stats">
          <div className="next-platform__stat">
            <div className="next-platform__stat-icon">
              <Image src="/assets/stat-icon-1.png" alt="" width={20} height={20} />
            </div>
            <span className="next-platform__stat-title">
              <span className="next-platform__stat-counter">{t('stat1Value')}</span>
              {' '}{t('stat1Label')}
            </span>
            <span className="next-platform__stat-desc">{t('stat1Desc')}</span>
          </div>
          <div className="next-platform__stat">
            <div className="next-platform__stat-icon">
              <Image src="/assets/stat-icon-2.png" alt="" width={20} height={20} />
            </div>
            <span className="next-platform__stat-title">
              <span className="next-platform__stat-counter">{t('stat2Value')}</span>
              {' '}{t('stat2Label')}
            </span>
            <span className="next-platform__stat-desc">{t('stat2Desc')}</span>
          </div>
          <div className="next-platform__stat">
            <div className="next-platform__stat-icon">
              <Image src="/assets/stat-icon-3.png" alt="" width={20} height={20} />
            </div>
            <span className="next-platform__stat-title">
              <span className="next-platform__stat-counter">{t('stat3Value')}</span>
              {' '}{t('stat3Label')}
            </span>
            <span className="next-platform__stat-desc">{t('stat3Desc')}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="next-platform__tabs">
        <button
          className={`next-platform__tab${activeTab === 'customer-interactions' ? ' next-platform__tab--active' : ''}`}
          type="button"
          onClick={() => setActiveTab('customer-interactions')}
        >
          <span className="next-platform__tab-icon">
            <svg className="next-platform__tab-svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.29117 20.8242L2 22L3.17581 16.7088C2.42544 15.3056 2 13.7025 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C10.2975 22 8.6944 21.5746 7.29117 20.8242ZM7.58075 18.711L8.23428 19.0605C9.38248 19.6745 10.6655 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 13.3345 4.32549 14.6175 4.93949 15.7657L5.28896 16.4192L4.63416 19.3658L7.58075 18.711Z" />
            </svg>
          </span>
          {t('tabCustomerInteractions')}
        </button>
        <button
          className={`next-platform__tab${activeTab === 'xbert-ai' ? ' next-platform__tab--active' : ''}`}
          type="button"
          onClick={() => setActiveTab('xbert-ai')}
        >
          <span className="next-platform__tab-icon">
            <svg className="next-platform__tab-svg next-platform__tab-svg--xbert" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18.89 27.41" fill="currentColor">
              <g>
                <path d="M10.03,21.82c-1.66,1.72-5.85,5.6-8.29,5.6-1.41,0-1.85-1.23-1.7-2.44.34-2.73,4.07-7.67,5.85-9.88,1.39-1.73,2.58-1.98.3-3.77-.45-.36-2.15-1.58-2.65-1.41-.42.43.12,1.44.33,1.95.27.64,1.04,1.72.96,2.38-.1.89-1.18,1.17-1.83.59-.41-.37-1.77-2.87-2.06-3.49-.52-1.1-1.39-3.05-.66-4.15,1.38-2.07,5.07.69,6.43,1.73.95.72,1.82,1.54,2.7,2.34,1.73-1.48,3.57-3.3,5.66-4.28,1.74-.81,4.03-1,3.8,1.6-.31,3.49-6.33,10.64-8.83,13.23ZM3.38,23.68c.2.59,1.7-.47,2.01-.69,2.97-2.02,8.58-8.49,9.87-11.83.41-1.07.49-1.58-.81-1.02-3.09,1.35-9.7,9.15-10.83,12.34-.11.32-.36.87-.25,1.19Z" />
                <path d="M10.52,23.46c-.09-.45.34-1.25.79-1.36.85-.22,1.43.6,2.09,1,4.43,2.72.62-2.25.66-3.28.04-.93,1.29-1.35,1.98-.62.53.56,1.68,2.75,2.02,3.53.48,1.08,1.27,2.92.46,3.95-1.37,1.74-4.67-.5-6-1.45-.39-.28-1.93-1.41-2-1.78Z" />
              </g>
              <polygon points="9.44 0 10.56 3.03 13.59 4.15 10.56 5.27 9.44 8.3 8.32 5.27 5.29 4.15 8.32 3.03 9.44 0" />
            </svg>
          </span>
          {t('tabXbertAI')}
          <span className="next-platform__tab-pill">{t('tabXbertAIBadge')}</span>
        </button>
        <button
          className={`next-platform__tab${activeTab === 'customer-experience' ? ' next-platform__tab--active' : ''}`}
          type="button"
          onClick={() => setActiveTab('customer-experience')}
        >
          <span className="next-platform__tab-icon">
            <svg className="next-platform__tab-svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM8 13H16C16 15.2091 14.2091 17 12 17C9.79086 17 8 15.2091 8 13ZM8 11C7.17157 11 6.5 10.3284 6.5 9.5C6.5 8.67157 7.17157 8 8 8C8.82843 8 9.5 8.67157 9.5 9.5C9.5 10.3284 8.82843 11 8 11ZM16 11C15.1716 11 14.5 10.3284 14.5 9.5C14.5 8.67157 15.1716 8 16 8C16.8284 8 17.5 8.67157 17.5 9.5C17.5 10.3284 16.8284 11 16 11Z" />
            </svg>
          </span>
          {t('tabCustomerExperience')}
        </button>
        <button
          className={`next-platform__tab${activeTab === 'connected-tools' ? ' next-platform__tab--active' : ''}`}
          type="button"
          onClick={() => setActiveTab('connected-tools')}
        >
          <span className="next-platform__tab-icon">
            <svg className="next-platform__tab-svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.6567 14.8284L16.2425 13.4142L17.6567 12C19.2188 10.4379 19.2188 7.90524 17.6567 6.34314C16.0946 4.78105 13.5619 4.78105 11.9998 6.34314L10.5856 7.75736L9.17139 6.34314L10.5856 4.92893C12.9287 2.58578 16.7277 2.58578 19.0709 4.92893C21.414 7.27208 21.414 11.0711 19.0709 13.4142L17.6567 14.8284ZM14.8282 17.6569L13.414 19.0711C11.0709 21.4142 7.27189 21.4142 4.92875 19.0711C2.5856 16.7279 2.5856 12.9289 4.92875 10.5858L6.34296 9.17157L7.75717 10.5858L6.34296 12C4.78086 13.5621 4.78086 16.0948 6.34296 17.6569C7.90506 19.219 10.4377 19.219 11.9998 17.6569L13.414 16.2426L14.8282 17.6569ZM14.8282 7.75736L16.2425 9.17157L9.17139 16.2426L7.75717 14.8284L14.8282 7.75736Z" />
            </svg>
          </span>
          {t('tabConnectedTools')}
        </button>
      </div>
    </section>
  );
}
