'use client';

import { useState } from 'react';

interface FaqTab {
  id: string;
  label: string;
  items: { question: string; answer: string }[];
}

interface ArticleFaqTabsProps {
  tabs: FaqTab[];
}

export default function ArticleFaqTabs({ tabs }: ArticleFaqTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div className="faq-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`faq-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => { setActiveTab(tab.id); setOpenIndex(null); }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`faq-panel${activeTab === tab.id ? ' active' : ''}`}
        >
          {activeTab === tab.id && tab.items.map((item, i) => (
            <div key={i} className={`faq-item${openIndex === i ? ' open' : ''}`}>
              <button
                className="faq-question"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
              >
                <span>{item.question}</span>
                <svg className="faq-chevron" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div className="faq-answer">
                <div className="faq-answer-inner">{item.answer}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
