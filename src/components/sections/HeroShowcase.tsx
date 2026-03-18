'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

export function HeroShowcase() {
  const t = useTranslations('HeroShowcase');
  const callLabelInit = t('callCard.label');
  const [callTime, setCallTime] = useState('0:00');
  const [callLabel, setCallLabel] = useState(callLabelInit);
  const [showSummary, setShowSummary] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);

  // Stats card toggle
  const [statsPeriod, setStatsPeriod] = useState<'today' | 'monthly'>('today');
  const [displayStats, setDisplayStats] = useState({
    calls: parseInt(t('statsCard.callsValue')),
    appts: parseInt(t('statsCard.apptsValue')),
    faqs: parseInt(t('statsCard.faqsValue')),
    satisfaction: parseInt(t('statsCard.satisfactionValue')),
  });
  const animFrameRef = useRef<number | null>(null);

  const handleStatsToggle = () => {
    const newPeriod = statsPeriod === 'today' ? 'monthly' : 'today';
    setStatsPeriod(newPeriod);

    const targetStats = {
      calls: parseInt(newPeriod === 'today' ? t('statsCard.callsValue') : t('statsCard.callsMonthly')),
      appts: parseInt(newPeriod === 'today' ? t('statsCard.apptsValue') : t('statsCard.apptsMonthly')),
      faqs: parseInt(newPeriod === 'today' ? t('statsCard.faqsValue') : t('statsCard.faqsMonthly')),
      satisfaction: parseInt(newPeriod === 'today' ? t('statsCard.satisfactionValue') : t('statsCard.satisfactionMonthly')),
    };

    const startStats = { ...displayStats };
    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayStats({
        calls: Math.round(startStats.calls + (targetStats.calls - startStats.calls) * eased),
        appts: Math.round(startStats.appts + (targetStats.appts - startStats.appts) * eased),
        faqs: Math.round(startStats.faqs + (targetStats.faqs - startStats.faqs) * eased),
        satisfaction: Math.round(startStats.satisfaction + (targetStats.satisfaction - startStats.satisfaction) * eased),
      });

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      setCallTime(`${mins}:${secs.toString().padStart(2, '0')}`);
    }, 1000);

    // After ~11s, stop timer and show final time
    const endTimer = setTimeout(() => {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallTime('3m 44s');
      setCallLabel('CALL COMPLETED');
    }, 11000);

    // After ~13s, switch to AI Summary view
    const summaryTimer = setTimeout(() => {
      setShowSummary(true);
    }, 13000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearTimeout(endTimer);
      clearTimeout(summaryTimer);
    };
  }, []);

  return (
    <div className="showcase">
      {/* Desktop App Window */}
      <div className="showcase__app-bg">
        <div className="showcase__app-window">
          {/* App Header */}
          <div className="showcase__app-header">
            <div className="showcase__app-header-left">
              <span className="showcase__app-title">{t('appTitle')}</span>
            </div>
            <div className="showcase__app-header-right">
              <div className="showcase__header-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748Z" /></svg>
              </div>
              <div className="showcase__header-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L21.5 6.5V17.5L12 23L2.5 17.5V6.5L12 1ZM12 3.311L4.5 7.65311V16.3469L12 20.689L19.5 16.3469V7.65311L12 3.311ZM12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12C16 14.2091 14.2091 16 12 16ZM12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 11 10.8954 11 12C11 13.1046 10.8954 14 12 14Z" /></svg>
              </div>
            </div>
          </div>

          {/* App Body */}
          <div className="showcase__app-body">
            {/* Sidebar */}
            <div className="showcase__sidebar">
              <div className="showcase__sidebar-header">
                <span className="showcase__sidebar-title">{t('messagesTitle')}</span>
                <div className="showcase__sidebar-action">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6.41421 15.89L16.5563 5.74785L15.1421 4.33363L5 14.4758V15.89H6.41421ZM7.24264 17.89H3V13.6474L14.435 2.21231C14.8256 1.82179 15.4587 1.82179 15.8492 2.21231L18.6777 5.04074C19.0682 5.43126 19.0682 6.06443 18.6777 6.45495L7.24264 17.89ZM3 19.89H21V21.89H3V19.89Z" /></svg>
                </div>
              </div>
              <div className="showcase__conversation-list">
                {/* Conversation 1 - Active */}
                <div className="showcase__conversation-item showcase__conversation-item--active">
                  <div className="showcase__conversation-avatar">
                    <Image
                      src="/assets/avatar-curly-hair.png"
                      alt={t('conversations.sarah.name')}
                      width={36}
                      height={36}
                      className="showcase__conversation-avatar-img"
                    />
                    <span className="showcase__status-dot showcase__status-dot--online" />
                  </div>
                  <div className="showcase__conversation-info">
                    <span className="showcase__conversation-name">{t('conversations.sarah.name')}</span>
                    <span className="showcase__conversation-preview">{t('conversations.sarah.preview')}</span>
                  </div>
                  <span className="showcase__conversation-time">{t('conversations.sarah.time')}</span>
                </div>
                {/* Conversation 2 */}
                <div className="showcase__conversation-item">
                  <div className="showcase__conversation-avatar">
                    <span>JD</span>
                  </div>
                  <div className="showcase__conversation-info">
                    <span className="showcase__conversation-name">{t('conversations.john.name')}</span>
                    <span className="showcase__conversation-preview">{t('conversations.john.preview')}</span>
                  </div>
                  <span className="showcase__conversation-time">{t('conversations.john.time')}</span>
                </div>
                {/* Conversation 3 - Team */}
                <div className="showcase__conversation-item">
                  <div className="showcase__conversation-avatar showcase__conversation-avatar--team">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2 22C2 17.5817 5.58172 14 10 14C14.4183 14 18 17.5817 18 22H16C16 18.6863 13.3137 16 10 16C6.68629 16 4 18.6863 4 22H2ZM10 13C6.685 13 4 10.315 4 7C4 3.685 6.685 1 10 1C13.315 1 16 3.685 16 7C16 10.315 13.315 13 10 13ZM10 11C12.21 11 14 9.21 14 7C14 4.79 12.21 3 10 3C7.79 3 6 4.79 6 7C6 9.21 7.79 11 10 11ZM18.2837 14.7028C21.0644 15.9561 23 18.752 23 22H21C21 19.564 19.5483 17.4671 17.4628 16.5271L18.2837 14.7028ZM17.5962 3.41321C19.5944 4.23703 21 6.20361 21 8.5C21 10.7964 19.5944 12.763 17.5962 13.5868L16.8197 11.7639C18.1236 11.2106 19 9.95621 19 8.5C19 7.04379 18.1236 5.78945 16.8197 5.23609L17.5962 3.41321Z" /></svg>
                  </div>
                  <div className="showcase__conversation-info">
                    <span className="showcase__conversation-name">{t('conversations.salesTeam.name')}</span>
                    <span className="showcase__conversation-preview">{t('conversations.salesTeam.preview')}</span>
                  </div>
                  <span className="showcase__conversation-time">{t('conversations.salesTeam.time')}</span>
                </div>
                {/* Conversation 4 */}
                <div className="showcase__conversation-item">
                  <div className="showcase__conversation-avatar">
                    <span>AR</span>
                    <span className="showcase__status-dot showcase__status-dot--online" />
                  </div>
                  <div className="showcase__conversation-info">
                    <span className="showcase__conversation-name">{t('conversations.alex.name')}</span>
                    <span className="showcase__conversation-preview">{t('conversations.alex.preview')}</span>
                  </div>
                  <span className="showcase__conversation-time">{t('conversations.alex.time')}</span>
                </div>
                {/* Conversation 5 */}
                <div className="showcase__conversation-item">
                  <div className="showcase__conversation-avatar">
                    <span>DP</span>
                  </div>
                  <div className="showcase__conversation-info">
                    <span className="showcase__conversation-name">{t('conversations.david.name')}</span>
                    <span className="showcase__conversation-preview">{t('conversations.david.preview')}</span>
                  </div>
                  <span className="showcase__conversation-time">{t('conversations.david.time')}</span>
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="showcase__chat">
              <div className="showcase__chat-header">
                <div className="showcase__chat-header-info">
                  <span className="showcase__chat-recipient">{t('conversations.sarah.name')}</span>
                  <span className="showcase__chat-status">
                    <span className="showcase__chat-status-dot" />
                    {t('statusOnline')}
                  </span>
                </div>
                <div className="showcase__chat-header-actions">
                  <div className="showcase__chat-action">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9.36556 10.6821C10.302 12.3288 11.6712 13.698 13.3179 14.6344L14.2024 13.3961C14.4965 12.9845 15.0516 12.8573 15.4956 13.0998C16.9024 13.8683 18.4571 14.3353 20.0789 14.4637C20.5906 14.5049 21 14.9389 21 15.4525V19.9525C21 20.4084 20.6744 20.8013 20.2216 20.8649C19.5633 20.9565 18.8917 21.0037 18.2093 21.0037C9.52649 21.0037 2.50244 13.9797 2.50244 5.29688C2.50244 4.61449 2.54964 3.9429 2.64117 3.28455C2.70484 2.83175 3.09768 2.50613 3.5536 2.50613H8.05355C8.5671 2.50613 9.00107 2.91555 9.04229 3.42733C9.17069 5.04907 9.63772 6.60378 10.4062 8.01058C10.6487 8.45459 10.5215 9.00977 10.1099 9.30381L8.87168 10.1883L9.36556 10.6821Z" /></svg>
                  </div>
                  <div className="showcase__chat-action">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 9.2L22.2133 5.55071C22.4395 5.39235 22.7513 5.44737 22.9096 5.6736C22.9684 5.75764 23 5.85774 23 5.96033V18.0397C23 18.3158 22.7761 18.5397 22.5 18.5397C22.3974 18.5397 22.2973 18.5081 22.2133 18.4493L17 14.8V19C17 19.5523 16.5523 20 16 20H2C1.44772 20 1 19.5523 1 19V5C1 4.44772 1.44772 4 2 4H16C16.5523 4 17 4.44772 17 5V9.2Z" /></svg>
                  </div>
                  <div className="showcase__chat-action">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C11.175 3 10.5 3.675 10.5 4.5C10.5 5.325 11.175 6 12 6C12.825 6 13.5 5.325 13.5 4.5C13.5 3.675 12.825 3 12 3ZM12 18C11.175 18 10.5 18.675 10.5 19.5C10.5 20.325 11.175 21 12 21C12.825 21 13.5 20.325 13.5 19.5C13.5 18.675 12.825 18 12 18ZM12 10.5C11.175 10.5 10.5 11.175 10.5 12C10.5 12.825 11.175 13.5 12 13.5C12.825 13.5 13.5 12.825 13.5 12C13.5 11.175 12.825 10.5 12 10.5Z" /></svg>
                  </div>
                </div>
              </div>
              <div className="showcase__chat-messages">
                <div className="showcase__message showcase__message--sent">
                  <span>{t('chatMessages.sent1')}</span>
                </div>
                <div className="showcase__message showcase__message--received">
                  <span>{t('chatMessages.received1')}</span>
                </div>
              </div>
              <div className="showcase__chat-input">
                <div className="showcase__input-actions">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z" /></svg>
                </div>
                <div className="showcase__input-field">{t('inputPlaceholder')}</div>
                <button className="showcase__input-send" aria-label="Send message">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M1.94631 9.31555C1.42377 9.14137 1.41965 8.86034 1.9504 8.6812L21.0781 1.94006C21.5993 1.76418 21.8955 2.05203 21.7398 2.56383L15.6973 21.0547C15.5388 21.5758 15.2361 21.5988 15.0249 21.1023L11.4951 13.5099L17.9999 5.99997L10.485 12.5048L1.94631 9.31555Z" /></svg>
                </button>
              </div>
            </div>

            {/* Customer Panel */}
            <div className="showcase__customer-panel">
              <div className="showcase__customer-panel-header">
                <span className="showcase__customer-panel-title">{t('customerInfo.title')}</span>
                <div className="showcase__customer-panel-action">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C11.175 3 10.5 3.675 10.5 4.5C10.5 5.325 11.175 6 12 6C12.825 6 13.5 5.325 13.5 4.5C13.5 3.675 12.825 3 12 3ZM12 18C11.175 18 10.5 18.675 10.5 19.5C10.5 20.325 11.175 21 12 21C12.825 21 13.5 20.325 13.5 19.5C13.5 18.675 12.825 18 12 18ZM12 10.5C11.175 10.5 10.5 11.175 10.5 12C10.5 12.825 11.175 13.5 12 13.5C12.825 13.5 13.5 12.825 13.5 12C13.5 11.175 12.825 10.5 12 10.5Z" /></svg>
                </div>
              </div>
              <div className="showcase__customer-profile">
                <div className="showcase__customer-avatar">
                  <Image
                    src="/assets/avatar-curly-hair.png"
                    alt={t('conversations.sarah.name')}
                    width={48}
                    height={48}
                    className="showcase__customer-avatar-img"
                  />
                </div>
                <div className="showcase__customer-name">{t('conversations.sarah.name')}</div>
                <div className="showcase__customer-email">{t('customerInfo.email')}</div>
                <div className="showcase__customer-tags">
                  <span className="showcase__customer-tag">{t('customerInfo.tagVip')}</span>
                  <span className="showcase__customer-tag">{t('customerInfo.tagEnterprise')}</span>
                </div>
              </div>
              {/* Recent Activity */}
              <div className="showcase__customer-section">
                <div className="showcase__customer-section-title">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM13 6V11.5858L16.2426 14.8284L14.8284 16.2426L11 12.4142V6H13Z" /></svg>
                  {t('customerInfo.recentActivity')}
                </div>
                <div className="showcase__activity-list">
                  <div className="showcase__activity-item">
                    <span className="showcase__activity-icon">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M9.36556 10.6821C10.302 12.3288 11.6712 13.698 13.3179 14.6344L14.2024 13.3961C14.4965 12.9845 15.0516 12.8573 15.4956 13.0998C16.9024 13.8683 18.4571 14.3353 20.0789 14.4637C20.5906 14.5049 21 14.9389 21 15.4525V19.9525C21 20.4084 20.6744 20.8013 20.2216 20.8649C19.5633 20.9565 18.8917 21.0037 18.2093 21.0037C9.52649 21.0037 2.50244 13.9797 2.50244 5.29688C2.50244 4.61449 2.54964 3.9429 2.64117 3.28455C2.70484 2.83175 3.09768 2.50613 3.5536 2.50613H8.05355C8.5671 2.50613 9.00107 2.91555 9.04229 3.42733C9.17069 5.04907 9.63772 6.60378 10.4062 8.01058C10.6487 8.45459 10.5215 9.00977 10.1099 9.30381L8.87168 10.1883L9.36556 10.6821Z" /></svg>
                    </span>
                    <span className="showcase__activity-text">{t('customerInfo.activity1')}</span>
                    <span className="showcase__activity-time">{t('customerInfo.activity1Time')}</span>
                  </div>
                  <div className="showcase__activity-item">
                    <span className="showcase__activity-icon">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3ZM20 7.23792L12.0718 14.338L4 7.21594V19H20V7.23792ZM4.51146 5L12.0619 11.662L19.501 5H4.51146Z" /></svg>
                    </span>
                    <span className="showcase__activity-text">{t('customerInfo.activity2')}</span>
                    <span className="showcase__activity-time">{t('customerInfo.activity2Time')}</span>
                  </div>
                  <div className="showcase__activity-item">
                    <span className="showcase__activity-icon">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M9 1V3H15V1H17V3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H7V1H9ZM20 10H4V19H20V10ZM15.0355 11.136L16.4497 12.5503L11.5 17.5L7.96447 13.9645L9.37868 12.5503L11.5 14.6716L15.0355 11.136ZM7 5H4V8H20V5H17V6H15V5H9V6H7V5Z" /></svg>
                    </span>
                    <span className="showcase__activity-text">{t('customerInfo.activity3')}</span>
                    <span className="showcase__activity-time">{t('customerInfo.activity3Time')}</span>
                  </div>
                </div>
              </div>
              {/* Customer Value */}
              <div className="showcase__customer-section">
                <div className="showcase__customer-section-title">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3H5V21H3V3ZM7 3H9V21H7V3ZM11 3H13V21H11V3ZM15 3H17V21H15V3ZM19 3H21V21H19V3Z" /></svg>
                  {t('customerInfo.customerValue')}
                </div>
                <div className="showcase__customer-stats-grid">
                  <div className="showcase__customer-stat">
                    <span className="showcase__customer-stat-value">{t('customerInfo.lifetimeValue')}</span>
                    <span className="showcase__customer-stat-label">{t('customerInfo.lifetimeValueLabel')}</span>
                  </div>
                  <div className="showcase__customer-stat">
                    <span className="showcase__customer-stat-value">{t('customerInfo.interactions')}</span>
                    <span className="showcase__customer-stat-label">{t('customerInfo.interactionsLabel')}</span>
                  </div>
                </div>
              </div>
              {/* Sentiment */}
              <div className="showcase__customer-section">
                <div className="showcase__customer-section-title">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM8 13H16C16 15.2091 14.2091 17 12 17C9.79086 17 8 15.2091 8 13ZM8 11C7.17157 11 6.5 10.3284 6.5 9.5C6.5 8.67157 7.17157 8 8 8C8.82843 8 9.5 8.67157 9.5 9.5C9.5 10.3284 8.82843 11 8 11ZM16 11C15.1716 11 14.5 10.3284 14.5 9.5C14.5 8.67157 15.1716 8 16 8C16.8284 8 17.5 8.67157 17.5 9.5C17.5 10.3284 16.8284 11 16 11Z" /></svg>
                  {t('customerInfo.sentiment')}
                </div>
                <div className="showcase__customer-sentiment">
                  <div className="showcase__sentiment-bar">
                    <div className="showcase__sentiment-fill" style={{ width: '85%' }} />
                  </div>
                  <span className="showcase__sentiment-label">{t('customerInfo.sentimentLabel')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating UI Showcase */}
      <div className="showcase__ui">
        {/* Call Card */}
        <div className="showcase__call-card">
          <div className="showcase__call-card-header">
            <div className="showcase__call-header-left">
              {callLabel === 'CALL COMPLETED' ? (
                <svg className="showcase__call-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9.9997 15.1709L19.1921 5.97852L20.6063 7.39273L9.9997 17.9993L3.63574 11.6354L5.04996 10.2212L9.9997 15.1709Z" /></svg>
              ) : (
                <svg className="showcase__call-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9.36556 10.6821C10.302 12.3288 11.6712 13.698 13.3179 14.6344L14.2024 13.3961C14.4965 12.9845 15.0516 12.8573 15.4956 13.0998C16.9024 13.8683 18.4571 14.3353 20.0789 14.4637C20.5906 14.5049 21 14.9389 21 15.4525V19.9525C21 20.4084 20.6744 20.8013 20.2216 20.8649C19.5633 20.9565 18.8917 21.0037 18.2093 21.0037C9.52649 21.0037 2.50244 13.9797 2.50244 5.29688C2.50244 4.61449 2.54964 3.9429 2.64117 3.28455C2.70484 2.83175 3.09768 2.50613 3.5536 2.50613H8.05355C8.5671 2.50613 9.00107 2.91555 9.04229 3.42733C9.17069 5.04907 9.63772 6.60378 10.4062 8.01058C10.6487 8.45459 10.5215 9.00977 10.1099 9.30381L8.87168 10.1883L9.36556 10.6821Z" /></svg>
              )}
              <span className="showcase__call-label">{callLabel}</span>
              <div className="showcase__sound-wave">
                <span className="showcase__sound-bar" />
                <span className="showcase__sound-bar" />
                <span className="showcase__sound-bar" />
                <span className="showcase__sound-bar" />
                <span className="showcase__sound-bar" />
              </div>
            </div>
            <span className="showcase__call-time">{callTime}</span>
          </div>
          {!showSummary ? (
            <>
              <div className="showcase__call-main">
                <div className="showcase__call-title-row">
                  <div className="showcase__caller-avatar">
                    <Image
                      src="/assets/avatar-curly-hair.png"
                      alt={t('callCard.callerName')}
                      width={44}
                      height={44}
                      className="showcase__caller-avatar-img"
                    />
                  </div>
                  <span className="showcase__caller-name">{t('callCard.callerName')}</span>
                  <div className="showcase__ai-badge">
                    <span className="showcase__ai-badge-icon">&#10022;</span>
                    <span className="showcase__ai-badge-text">{t('callCard.aiBadge')}</span>
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
                    XBert AI
                  </div>
                  <div className="showcase__chat-bubble showcase__chat-bubble--xbert">
                    {t('callCard.xbertBubble1')}
                  </div>
                </div>
                <div className="showcase__typing-indicator showcase__typing-indicator--2">
                  <span /><span /><span />
                </div>
                <div className="showcase__chat-bubble-wrapper showcase__chat-bubble-wrapper--caller showcase__chat-bubble-wrapper--2">
                  <div className="showcase__chat-bubble showcase__chat-bubble--caller">
                    {t('callCard.callerBubble1')}
                  </div>
                </div>
                <div className="showcase__typing-indicator showcase__typing-indicator--3">
                  <span /><span /><span />
                </div>
                <div className="showcase__chat-bubble-wrapper showcase__chat-bubble-wrapper--xbert showcase__chat-bubble-wrapper--3">
                  <div className="showcase__chat-bubble-label">
                    <span className="showcase__chat-bubble-label-icon">&#10022;</span>
                    XBert AI
                  </div>
                  <div className="showcase__chat-bubble showcase__chat-bubble--xbert">
                    {t('callCard.xbertBubble2')}
                  </div>
                </div>
              </div>
              <div className="showcase__call-action">
                <div className="showcase__action-label">{t('callCard.appointmentScheduled')}</div>
                <div className="showcase__action-content">
                  <div className="showcase__action-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 1V3H15V1H17V3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H7V1H9ZM20 10H4V19H20V10ZM15.0355 11.136L16.4497 12.5503L11.5 17.5L7.96447 13.9645L9.37868 12.5503L11.5 14.6716L15.0355 11.136ZM7 5H4V8H20V5H17V6H15V5H9V6H7V5Z" /></svg>
                  </div>
                  <div className="showcase__action-details">
                    <span className="showcase__action-title">
                      <span className="showcase__action-title-badge">AI</span>
                      {t('callCard.appointmentConfirmed')}
                    </span>
                    <span className="showcase__action-subtitle">{t('callCard.appointmentTime')}</span>
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
                  <div className="showcase__caller-avatar">
                    <Image
                      src="/assets/avatar-curly-hair.png"
                      alt={t('callCard.callerName')}
                      width={44}
                      height={44}
                      className="showcase__caller-avatar-img"
                    />
                  </div>
                  <span className="showcase__caller-name">{t('callCard.summaryTitle')}</span>
                  <div className="showcase__ai-badge">
                    <span className="showcase__ai-badge-icon">&#10022;</span>
                    <span className="showcase__ai-badge-text">{t('callCard.summaryBadge')}</span>
                  </div>
                </div>
              </div>
              <div className="showcase__call-conversation">
                <div className="showcase__summary-card">
                  <div className="showcase__summary-card-label">{t('callCard.summaryLabel')}</div>
                  <div className="showcase__summary-card-text">{t('callCard.summaryText')}</div>
                </div>
                <div className="showcase__summary-card">
                  <div className="showcase__summary-card-label">{t('callCard.appointmentLabel')}</div>
                  <div className="showcase__summary-card-text">
                    <span className="showcase__summary-badge">{t('callCard.tomorrow')}</span>
                    <span className="showcase__summary-badge">{t('callCard.appointmentBadgeTime')}</span>
                    <span className="showcase__summary-badge showcase__summary-badge--success">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M11.602 13.7599L13.014 15.1719L21.4795 6.7063L22.8938 8.12051L13.014 18.0003L6.65 11.6363L8.06421 10.2221L10.189 12.3469L11.6025 13.7594L11.602 13.7599ZM11.6037 10.9322L16.5563 5.97949L17.9666 7.38977L13.014 12.3424L11.6037 10.9322ZM8.77698 16.5873L7.36396 18.0003L1 11.6363L2.41421 10.2221L3.82723 11.6352L3.82604 11.6363L8.77698 16.5873Z" /></svg>
                    </span>
                  </div>
                </div>
                <div className="showcase__summary-card">
                  <div className="showcase__summary-card-label">{t('callCard.sentimentLabel')}</div>
                  <div className="showcase__summary-card-text">
                    <span className="showcase__summary-badge showcase__summary-badge--positive">{t('callCard.positive')}</span>
                    <span className="showcase__summary-badge showcase__summary-badge--positive">{t('callCard.excited')}</span>
                    <span className="showcase__summary-badge showcase__summary-badge--positive">{t('callCard.curious')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Card */}
        <div className="showcase__stats-card">
          <div className="showcase__stats-header">
            <div className="showcase__stats-header-left">
              <div className="showcase__gyroscope-icon">
                <div className="showcase__gyro-ring showcase__gyro-ring--outer" />
                <div className="showcase__gyro-ring showcase__gyro-ring--middle" />
                <div className="showcase__gyro-ring showcase__gyro-ring--inner" />
              </div>
              <span className="showcase__stats-label">{t('statsCard.label')}</span>
            </div>
            <button
              className="showcase__stats-time-filter"
              data-period={statsPeriod}
              type="button"
              onClick={handleStatsToggle}
            >
              <span className="showcase__stats-time-label">
                {statsPeriod === 'today' ? t('statsCard.today') : t('statsCard.thirtyDays')}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 13.1722L16.95 8.22217L18.3642 9.63638L12 16.0006L5.63604 9.63638L7.05025 8.22217L12 13.1722Z" /></svg>
            </button>
          </div>
          <div className="showcase__stats-grid">
            <div className="showcase__stat-item">
              <div className="showcase__stat-value">{displayStats.calls}</div>
              <div className="showcase__stat-label">{t('statsCard.callsLabel')}</div>
            </div>
            <div className="showcase__stat-item">
              <div className="showcase__stat-value">{displayStats.appts}</div>
              <div className="showcase__stat-label">{t('statsCard.apptsLabel')}</div>
            </div>
            <div className="showcase__stat-item">
              <div className="showcase__stat-value">{displayStats.faqs}</div>
              <div className="showcase__stat-label">{t('statsCard.faqsLabel')}</div>
            </div>
            <div className="showcase__stat-item showcase__stat-item--trend">
              <div className="showcase__stat-value showcase__stat-trend-up">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8L18 14H6L12 8Z" /></svg>
                <span>{displayStats.satisfaction}</span>%
              </div>
              <div className="showcase__stat-label">{t('statsCard.satisfactionLabel')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
