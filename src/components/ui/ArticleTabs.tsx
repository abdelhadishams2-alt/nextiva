'use client';

import { useState } from 'react';

interface ArticleTabsProps {
  tabs: { id: string; label: string; content: React.ReactNode }[];
}

export default function ArticleTabs({ tabs }: ArticleTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');

  return (
    <div className="tabs-panel">
      <div className="tabs-nav" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
            role="tab"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab-content${activeTab === tab.id ? ' active' : ''}`}
          role="tabpanel"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
