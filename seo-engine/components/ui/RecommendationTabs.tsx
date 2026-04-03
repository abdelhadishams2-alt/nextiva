'use client';

import { useState } from 'react';

interface RecommendationTabsProps {
  recommended: string[];
  notRecommended: string[];
  productName: string;
}

export default function RecommendationTabs({
  recommended,
  notRecommended,
  productName,
}: RecommendationTabsProps) {
  const [activeTab, setActiveTab] = useState<'recommended' | 'notRecommended'>('recommended');

  const items = activeTab === 'recommended' ? recommended : notRecommended;

  return (
    <div className="recommendation-tabs">
      <h3 className="recommendation-tabs__heading">
        Is {productName} the right choice for you?
      </h3>

      <div className="recommendation-tabs__wrapper">
        <ul className="recommendation-tabs__nav" role="tablist">
          <li
            className={`recommendation-tabs__tab${activeTab === 'recommended' ? ' recommendation-tabs__tab--active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'recommended'}
            tabIndex={0}
            onClick={() => setActiveTab('recommended')}
            onKeyDown={(e) => e.key === 'Enter' && setActiveTab('recommended')}
          >
            <svg
              className="recommendation-tabs__icon recommendation-tabs__icon--check"
              width="18"
              height="18"
              viewBox="0 0 16 10"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M1 4.68L5.41 9.08L14.7 1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Recommended If
          </li>
          <li
            className={`recommendation-tabs__tab${activeTab === 'notRecommended' ? ' recommendation-tabs__tab--active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'notRecommended'}
            tabIndex={0}
            onClick={() => setActiveTab('notRecommended')}
            onKeyDown={(e) => e.key === 'Enter' && setActiveTab('notRecommended')}
          >
            <svg
              className="recommendation-tabs__icon recommendation-tabs__icon--cross"
              width="14"
              height="14"
              viewBox="0 0 11 11"
              fill="none"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M1.28033 0.21967C0.987437 -0.0732233 0.512563 -0.0732233 0.21967 0.21967C-0.0732233 0.512563 -0.0732233 0.987437 0.21967 1.28033L4.37212 5.43278L0.21967 9.58523C-0.0732233 9.87813 -0.0732233 10.353 0.21967 10.6459C0.512563 10.9388 0.987437 10.9388 1.28033 10.6459L5.43278 6.49344L9.58523 10.6459C9.87813 10.9388 10.353 10.9388 10.6459 10.6459C10.9388 10.353 10.9388 9.87813 10.6459 9.58523L6.49344 5.43278L10.6459 1.28033C10.9388 0.987437 10.9388 0.512563 10.6459 0.21967C10.353 -0.0732233 9.87813 -0.0732233 9.58523 0.21967L5.43278 4.37212L1.28033 0.21967Z"
                fill="currentColor"
              />
            </svg>
            Not Recommended If
          </li>
        </ul>

        <div className="recommendation-tabs__panel" role="tabpanel">
          <ul
            className={`recommendation-tabs__list${activeTab === 'notRecommended' ? ' recommendation-tabs__list--cons' : ''}`}
          >
            {items.map((item, i) => (
              <li key={i} className="recommendation-tabs__item">
                <p>{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
