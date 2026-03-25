'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

/* ----------------------------------------------------------------
   Icons
   ---------------------------------------------------------------- */
function StarIcon({ filled = true }: { filled?: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill={filled ? '#f59e0b' : '#d1d5db'}>
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748Z" /></svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L21.5 6.5V17.5L12 23L2.5 17.5V6.5L12 1ZM12 3.311L4.5 7.65311V16.3469L12 20.689L19.5 16.3469V7.65311L12 3.311ZM12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12C16 14.2091 14.2091 16 12 16ZM12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 11 10.8954 11 12C11 13.1046 10.8954 14 12 14Z" /></svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9.9997 15.1709L19.1921 5.97852L20.6063 7.39273L9.9997 17.9993L3.63574 11.6354L5.04996 10.2212L9.9997 15.1709Z" /></svg>
  );
}

function CrossIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 10.5858L16.9497 5.63604L18.364 7.05025L13.4142 12L18.364 16.9497L16.9497 18.364L12 13.4142L7.05025 18.364L5.63604 16.9497L10.5858 12L5.63604 7.05025L7.05025 5.63604L12 10.5858Z" /></svg>
  );
}

/* Category icons */
function CrmIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2 22C2 17.5817 5.58172 14 10 14C14.4183 14 18 17.5817 18 22H16C16 18.6863 13.3137 16 10 16C6.68629 16 4 18.6863 4 22H2ZM10 13C6.685 13 4 10.315 4 7C4 3.685 6.685 1 10 1C13.315 1 16 3.685 16 7C16 10.315 13.315 13 10 13ZM10 11C12.21 11 14 9.21 14 7C14 4.79 12.21 3 10 3C7.79 3 6 4.79 6 7C6 9.21 7.79 11 10 11ZM18.2837 14.7028C21.0644 15.9561 23 18.752 23 22H21C21 19.564 19.5483 17.4671 17.4628 16.5271L18.2837 14.7028ZM17.5962 3.41321C19.5944 4.23703 21 6.20361 21 8.5C21 10.7964 19.5944 12.763 17.5962 13.5868L16.8197 11.7639C18.1236 11.2106 19 9.95621 19 8.5C19 7.04379 18.1236 5.78945 16.8197 5.23609L17.5962 3.41321Z" /></svg>
  );
}

function HostingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5 11H19V5H5V11ZM21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3H20C20.5523 3 21 3.44772 21 4ZM5 13V19H19V13H5ZM7 15H10V17H7V15ZM7 7H10V9H7V7Z" /></svg>
  );
}

function EcommerceIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4.00436 6.41662L0.761719 3.17398L2.17593 1.75977L5.41857 5.00241H20.6603C21.2126 5.00241 21.6603 5.45013 21.6603 6.00241C21.6603 6.09973 21.6461 6.19653 21.6182 6.28975L19.2182 14.2898C19.0913 14.7127 18.7019 15.0024 18.2603 15.0024H6.00436V17.0024H17.0044V19.0024H5.00436C4.45207 19.0024 4.00436 18.5547 4.00436 18.0024V6.41662ZM6.00436 7.00241V13.0024H17.5124L19.3124 7.00241H6.00436ZM5.50436 23.0024C4.67593 23.0024 4.00436 22.3308 4.00436 21.5024C4.00436 20.674 4.67593 20.0024 5.50436 20.0024C6.33279 20.0024 7.00436 20.674 7.00436 21.5024C7.00436 22.3308 6.33279 23.0024 5.50436 23.0024ZM17.5044 23.0024C16.6759 23.0024 16.0044 22.3308 16.0044 21.5024C16.0044 20.674 16.6759 20.0024 17.5044 20.0024C18.3328 20.0024 19.0044 20.674 19.0044 21.5024C19.0044 22.3308 18.3328 23.0024 17.5044 23.0024Z" /></svg>
  );
}

function ProjectIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2 3.9934C2 3.44476 2.45531 3 2.9918 3H21.0082C21.556 3 22 3.44495 22 3.9934V20.0066C22 20.5552 21.5447 21 21.0082 21H2.9918C2.44405 21 2 20.5551 2 20.0066V3.9934ZM4 5V19H20V5H4ZM7 7H11V13H7V7ZM9 9V11H9V9ZM13 7H17V9H13V7ZM13 11H17V13H13V11ZM7 15H17V17H7V15Z" /></svg>
  );
}

function EmailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3ZM20 7.23792L12.0718 14.338L4 7.21594V19H20V7.23792ZM4.51146 5L12.0619 11.662L19.501 5H4.51146Z" /></svg>
  );
}

export function HeroShowcase() {
  const t = useTranslations('HeroShowcase');
  const analysisLabelInit = t('analysisCard.label');
  const [analysisTime, setAnalysisTime] = useState('0:00');
  const [analysisLabel, setAnalysisLabel] = useState(analysisLabelInit);
  const [showSummary, setShowSummary] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);
  const showcaseRef = useRef<HTMLDivElement>(null);
  const [animStarted, setAnimStarted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const animDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  useEffect(() => {
    const el = showcaseRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setIsVisible(entries[0].isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    animDelayRef.current = setTimeout(() => {
      setAnimStarted(true);
    }, 4000);
    return () => {
      if (animDelayRef.current) clearTimeout(animDelayRef.current);
    };
  }, []);

  useEffect(() => {
    if (!animStarted) return;

    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      setAnalysisTime(`${mins}:${secs.toString().padStart(2, '0')}`);
    }, 1000);

    const endTimer = setTimeout(() => {
      if (timerRef.current) clearInterval(timerRef.current);
      setAnalysisTime('0m 38s');
      setAnalysisLabel(t('analysisCard.labelComplete'));
    }, 13000);

    const summaryTimer = setTimeout(() => {
      setShowSummary(true);
    }, 16000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearTimeout(endTimer);
      clearTimeout(summaryTimer);
    };
  }, [animStarted, t]);

  const categories = [
    { icon: <CrmIcon />, name: t('categories.crm'), count: '24', active: true },
    { icon: <HostingIcon />, name: t('categories.hosting'), count: '18' },
    { icon: <EcommerceIcon />, name: t('categories.ecommerce'), count: '31' },
    { icon: <ProjectIcon />, name: t('categories.projectMgmt'), count: '15' },
    { icon: <EmailIcon />, name: t('categories.email'), count: '12' },
  ];

  return (
    <div className={`showcase${animStarted ? ' showcase--anim-started' : ''}${!isVisible ? ' showcase--offscreen' : ''}`} ref={showcaseRef}>
      {/* Desktop App Window */}
      <div className="showcase__app-bg">
        <div className="showcase__app-window">
          {/* App Header */}
          <div className="showcase__app-header">
            <div className="showcase__app-header-left">
              <span className="showcase__app-title">{t('appTitle')}</span>
            </div>
            <div className="showcase__app-header-right">
              <div className="showcase__header-icon"><SearchIcon /></div>
              <div className="showcase__header-icon"><SettingsIcon /></div>
            </div>
          </div>

          {/* App Body */}
          <div className="showcase__app-body">
            {/* Sidebar — Tool Categories */}
            <div className="showcase__sidebar">
              <div className="showcase__sidebar-header">
                <span className="showcase__sidebar-title">{t('categoriesTitle')}</span>
                <div className="showcase__sidebar-action">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M14 10H10V14H8V10H4V8H8V4H10V8H14V10Z" /></svg>
                </div>
              </div>
              <div className="showcase__conversation-list">
                {categories.map((cat) => (
                  <div key={cat.name} className={`showcase__conversation-item${cat.active ? ' showcase__conversation-item--active' : ''}`}>
                    <div className="showcase__conversation-avatar showcase__conversation-avatar--team">
                      {cat.icon}
                    </div>
                    <div className="showcase__conversation-info">
                      <span className="showcase__conversation-name">{cat.name}</span>
                      <span className="showcase__conversation-preview">{cat.count} {t('toolsLabel')}</span>
                    </div>
                    <span className="showcase__conversation-time">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" opacity="0.4"><path d="M13.1722 12L8.22217 7.04999L9.63638 5.63577L16.0006 12L9.63638 18.364L8.22217 16.9498L13.1722 12Z" /></svg>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Main — Tool Comparison */}
            <div className="showcase__chat">
              <div className="showcase__chat-header">
                <div className="showcase__chat-header-info">
                  <span className="showcase__chat-recipient">{t('comparison.title')}</span>
                  <span className="showcase__chat-status">
                    <span className="showcase__chat-status-dot" />
                    {t('comparison.subtitle')}
                  </span>
                </div>
                <div className="showcase__chat-header-actions">
                  <div className="showcase__chat-action">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 16.1716L18.364 10.8076L19.7782 12.2218L12 20L4.22183 12.2218L5.63604 10.8076L11 16.1716V2H13V16.1716Z" /></svg>
                  </div>
                  <div className="showcase__chat-action">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C11.175 3 10.5 3.675 10.5 4.5C10.5 5.325 11.175 6 12 6C12.825 6 13.5 5.325 13.5 4.5C13.5 3.675 12.825 3 12 3ZM12 18C11.175 18 10.5 18.675 10.5 19.5C10.5 20.325 11.175 21 12 21C12.825 21 13.5 20.325 13.5 19.5C13.5 18.675 12.825 18 12 18ZM12 10.5C11.175 10.5 10.5 11.175 10.5 12C10.5 12.825 11.175 13.5 12 13.5C12.825 13.5 13.5 12.825 13.5 12C13.5 11.175 12.825 10.5 12 10.5Z" /></svg>
                  </div>
                </div>
              </div>
              {/* Comparison Table */}
              <div className="showcase__comparison-table">
                <div className="showcase__comparison-header-row">
                  <div className="showcase__comparison-feature">{t('comparison.feature')}</div>
                  <div className="showcase__comparison-tool">{t('comparison.tool1')}</div>
                  <div className="showcase__comparison-tool">{t('comparison.tool2')}</div>
                </div>
                <div className="showcase__comparison-row">
                  <div className="showcase__comparison-feature">{t('comparison.row1')}</div>
                  <div className="showcase__comparison-value showcase__comparison-value--good">
                    <CheckIcon /> {t('comparison.row1val1')}
                  </div>
                  <div className="showcase__comparison-value showcase__comparison-value--good">
                    <CheckIcon /> {t('comparison.row1val2')}
                  </div>
                </div>
                <div className="showcase__comparison-row">
                  <div className="showcase__comparison-feature">{t('comparison.row2')}</div>
                  <div className="showcase__comparison-value">{t('comparison.row2val1')}</div>
                  <div className="showcase__comparison-value">{t('comparison.row2val2')}</div>
                </div>
                <div className="showcase__comparison-row">
                  <div className="showcase__comparison-feature">{t('comparison.row3')}</div>
                  <div className="showcase__comparison-value showcase__comparison-value--good">
                    <CheckIcon /> {t('comparison.row3val1')}
                  </div>
                  <div className="showcase__comparison-value showcase__comparison-value--bad">
                    <CrossIcon /> {t('comparison.row3val2')}
                  </div>
                </div>
                <div className="showcase__comparison-row">
                  <div className="showcase__comparison-feature">{t('comparison.row4')}</div>
                  <div className="showcase__comparison-value">{t('comparison.row4val1')}</div>
                  <div className="showcase__comparison-value">{t('comparison.row4val2')}</div>
                </div>
                <div className="showcase__comparison-row showcase__comparison-row--highlight">
                  <div className="showcase__comparison-feature">{t('comparison.row5')}</div>
                  <div className="showcase__comparison-value showcase__comparison-value--stars">
                    <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon filled={false} />
                    <span>4.6</span>
                  </div>
                  <div className="showcase__comparison-value showcase__comparison-value--stars">
                    <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon />
                    <span>4.8</span>
                  </div>
                </div>
              </div>
              <div className="showcase__chat-input">
                <div className="showcase__input-actions">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z" /></svg>
                </div>
                <div className="showcase__input-field">{t('inputPlaceholder')}</div>
                <button className="showcase__input-send" aria-label={t('inputPlaceholder')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M1.94631 9.31555C1.42377 9.14137 1.41965 8.86034 1.9504 8.6812L21.0781 1.94006C21.5993 1.76418 21.8955 2.05203 21.7398 2.56383L15.6973 21.0547C15.5388 21.5758 15.2361 21.5988 15.0249 21.1023L11.4951 13.5099L17.9999 5.99997L10.485 12.5048L1.94631 9.31555Z" /></svg>
                </button>
              </div>
            </div>

            {/* Right Panel — Tool Detail */}
            <div className="showcase__customer-panel">
              <div className="showcase__customer-panel-header">
                <span className="showcase__customer-panel-title">{t('toolDetail.title')}</span>
                <div className="showcase__customer-panel-action">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C11.175 3 10.5 3.675 10.5 4.5C10.5 5.325 11.175 6 12 6C12.825 6 13.5 5.325 13.5 4.5C13.5 3.675 12.825 3 12 3ZM12 18C11.175 18 10.5 18.675 10.5 19.5C10.5 20.325 11.175 21 12 21C12.825 21 13.5 20.325 13.5 19.5C13.5 18.675 12.825 18 12 18ZM12 10.5C11.175 10.5 10.5 11.175 10.5 12C10.5 12.825 11.175 13.5 12 13.5C12.825 13.5 13.5 12.825 13.5 12C13.5 11.175 12.825 10.5 12 10.5Z" /></svg>
                </div>
              </div>
              <div className="showcase__customer-profile">
                <div className="showcase__tool-logo">
                  <HostingIcon />
                </div>
                <div className="showcase__customer-name">{t('toolDetail.toolName')}</div>
                <div className="showcase__customer-email">{t('toolDetail.toolType')}</div>
                <div className="showcase__customer-tags">
                  <span className="showcase__customer-tag">{t('toolDetail.tagBest')}</span>
                  <span className="showcase__customer-tag">{t('toolDetail.tagMena')}</span>
                </div>
              </div>
              {/* Pros & Cons */}
              <div className="showcase__customer-section">
                <div className="showcase__customer-section-title">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z" /></svg>
                  {t('toolDetail.prosConsTitle')}
                </div>
                <div className="showcase__activity-list">
                  <div className="showcase__activity-item">
                    <span className="showcase__activity-icon showcase__activity-icon--pro">
                      <CheckIcon />
                    </span>
                    <span className="showcase__activity-text">{t('toolDetail.pro1')}</span>
                  </div>
                  <div className="showcase__activity-item">
                    <span className="showcase__activity-icon showcase__activity-icon--pro">
                      <CheckIcon />
                    </span>
                    <span className="showcase__activity-text">{t('toolDetail.pro2')}</span>
                  </div>
                  <div className="showcase__activity-item">
                    <span className="showcase__activity-icon showcase__activity-icon--con">
                      <CrossIcon />
                    </span>
                    <span className="showcase__activity-text">{t('toolDetail.con1')}</span>
                  </div>
                </div>
              </div>
              {/* Pricing & Rating */}
              <div className="showcase__customer-section showcase__customer-section--merged">
                <div className="showcase__customer-merged-row">
                  <div className="showcase__customer-stat">
                    <span className="showcase__customer-stat-value">{t('toolDetail.price')}</span>
                    <span className="showcase__customer-stat-label">{t('toolDetail.priceLabel')}</span>
                  </div>
                  <div className="showcase__customer-sentiment-ring">
                    <svg viewBox="0 0 52 52" className="showcase__sentiment-ring-svg">
                      <circle cx="26" cy="26" r="22" className="showcase__sentiment-ring-bg" />
                      <circle cx="26" cy="26" r="22" className="showcase__sentiment-ring-fill" style={{ strokeDasharray: '138', strokeDashoffset: '14' }} />
                    </svg>
                    <span className="showcase__sentiment-ring-label">4.8</span>
                  </div>
                  <div className="showcase__customer-stat">
                    <span className="showcase__customer-stat-value">{t('toolDetail.reviewCount')}</span>
                    <span className="showcase__customer-stat-label">{t('toolDetail.reviewLabel')}</span>
                  </div>
                </div>
                <div className="showcase__customer-merged-footer">
                  <span className="showcase__sentiment-label">{t('toolDetail.verdict')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating UI Showcase */}
      <div className="showcase__ui">
        {/* Analysis Card */}
        <div className="showcase__call-card">
          <div className="showcase__call-card-header">
            <div className="showcase__call-header-left">
              {analysisLabel === t('analysisCard.labelComplete') ? (
                <CheckIcon />
              ) : (
                <svg className="showcase__call-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748Z" /></svg>
              )}
              <span className="showcase__call-label">{analysisLabel}</span>
              <div className="showcase__pulse-dots">
                <span className="showcase__pulse-dot" />
                <span className="showcase__pulse-dot" />
                <span className="showcase__pulse-dot" />
              </div>
            </div>
            <span className="showcase__call-time">{analysisTime}</span>
          </div>
          {!showSummary ? (
            <>
              <div className="showcase__call-main">
                <div className="showcase__call-title-row">
                  <div className="showcase__caller-avatar showcase__caller-avatar--tool">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M5.76282 17H20V19H2V4H4V14.2L9.70282 8.49718L14 12.7944L20.4 6.39436L21.8142 7.80858L14 15.6228L9.70282 11.3256L5.76282 17Z" /></svg>
                  </div>
                  <span className="showcase__caller-name">{t('analysisCard.toolComparison')}</span>
                  <div className="showcase__ai-badge">
                    <span className="showcase__ai-badge-icon">&#10022;</span>
                    <span className="showcase__ai-badge-text">{t('analysisCard.aiBadge')}</span>
                  </div>
                </div>
              </div>
              <div className="showcase__call-conversation">
                <div className="showcase__typing-indicator showcase__typing-indicator--1">
                  <span /><span /><span />
                </div>
                <div className="showcase__chat-bubble-wrapper showcase__chat-bubble-wrapper--xbert showcase__chat-bubble-wrapper--1">
                  <div className="showcase__chat-bubble-label">
                    <span className="showcase__chat-bubble-label-icon">&#10022;</span>
                    Mansati AI
                  </div>
                  <div className="showcase__chat-bubble showcase__chat-bubble--xbert">
                    {t('analysisCard.aiBubble1')}
                  </div>
                </div>
                <div className="showcase__typing-indicator showcase__typing-indicator--2">
                  <span /><span /><span />
                </div>
                <div className="showcase__chat-bubble-wrapper showcase__chat-bubble-wrapper--caller showcase__chat-bubble-wrapper--2">
                  <div className="showcase__chat-bubble showcase__chat-bubble--caller">
                    {t('analysisCard.userBubble1')}
                  </div>
                </div>
                <div className="showcase__typing-indicator showcase__typing-indicator--3">
                  <span /><span /><span />
                </div>
                <div className="showcase__chat-bubble-wrapper showcase__chat-bubble-wrapper--xbert showcase__chat-bubble-wrapper--3">
                  <div className="showcase__chat-bubble-label">
                    <span className="showcase__chat-bubble-label-icon">&#10022;</span>
                    Mansati AI
                  </div>
                  <div className="showcase__chat-bubble showcase__chat-bubble--xbert">
                    {t('analysisCard.aiBubble2')}
                  </div>
                </div>
              </div>
              <div className="showcase__call-action">
                <div className="showcase__action-label">{t('analysisCard.reportReady')}</div>
                <div className="showcase__action-content">
                  <div className="showcase__action-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M5.76282 17H20V19H2V4H4V14.2L9.70282 8.49718L14 12.7944L20.4 6.39436L21.8142 7.80858L14 15.6228L9.70282 11.3256L5.76282 17Z" /></svg>
                  </div>
                  <div className="showcase__action-details">
                    <span className="showcase__action-title">
                      <span className="showcase__action-title-badge">AI</span>
                      {t('analysisCard.reportGenerated')}
                    </span>
                    <span className="showcase__action-subtitle">{t('analysisCard.reportDetails')}</span>
                  </div>
                </div>
                <div className="showcase__action-progress">
                  <div className="showcase__action-progress-bar" />
                </div>
              </div>
            </>
          ) : (
            <div className="showcase__summary-view">
              <div className="showcase__call-main">
                <div className="showcase__call-title-row">
                  <div className="showcase__caller-avatar showcase__caller-avatar--tool">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M5.76282 17H20V19H2V4H4V14.2L9.70282 8.49718L14 12.7944L20.4 6.39436L21.8142 7.80858L14 15.6228L9.70282 11.3256L5.76282 17Z" /></svg>
                  </div>
                  <span className="showcase__caller-name">{t('analysisCard.summaryTitle')}</span>
                  <div className="showcase__ai-badge">
                    <span className="showcase__ai-badge-icon">&#10022;</span>
                    <span className="showcase__ai-badge-text">{t('analysisCard.summaryBadge')}</span>
                  </div>
                </div>
              </div>
              <div className="showcase__summary-columns">
                <div className="showcase__summary-col">
                  <div className="showcase__summary-col-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5.76282 17H20V19H2V4H4V14.2L9.70282 8.49718L14 12.7944L20.4 6.39436L21.8142 7.80858L14 15.6228L9.70282 11.3256L5.76282 17Z" /></svg>
                  </div>
                  <div className="showcase__summary-col-label">{t('analysisCard.summaryLabel')}</div>
                  <div className="showcase__summary-col-text">{t('analysisCard.summaryText')}</div>
                </div>
                <div className="showcase__summary-divider" />
                <div className="showcase__summary-col">
                  <div className="showcase__summary-col-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                  </div>
                  <div className="showcase__summary-col-label">{t('analysisCard.topPickLabel')}</div>
                  <div className="showcase__summary-col-badges">
                    <span className="showcase__summary-badge">{t('analysisCard.topPick')}</span>
                    <span className="showcase__summary-badge">{t('analysisCard.topPickScore')}</span>
                    <span className="showcase__summary-badge showcase__summary-badge--success">
                      <CheckIcon />
                    </span>
                  </div>
                </div>
                <div className="showcase__summary-divider" />
                <div className="showcase__summary-col">
                  <div className="showcase__summary-col-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM8 13H16C16 15.2091 14.2091 17 12 17C9.79086 17 8 15.2091 8 13ZM8 11C7.17157 11 6.5 10.3284 6.5 9.5C6.5 8.67157 7.17157 8 8 8C8.82843 8 9.5 8.67157 9.5 9.5C9.5 10.3284 8.82843 11 8 11ZM16 11C15.1716 11 14.5 10.3284 14.5 9.5C14.5 8.67157 15.1716 8 16 8C16.8284 8 17.5 8.67157 17.5 9.5C17.5 10.3284 16.8284 11 16 11Z" /></svg>
                  </div>
                  <div className="showcase__summary-col-label">{t('analysisCard.fitLabel')}</div>
                  <div className="showcase__summary-col-badges">
                    <span className="showcase__summary-badge showcase__summary-badge--positive">{t('analysisCard.fitBudget')}</span>
                    <span className="showcase__summary-badge showcase__summary-badge--positive">{t('analysisCard.fitMena')}</span>
                    <span className="showcase__summary-badge showcase__summary-badge--positive">{t('analysisCard.fitScale')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
