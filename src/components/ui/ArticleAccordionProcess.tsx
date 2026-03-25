'use client';

import { useState } from 'react';

interface ArticleAccordionProcessProps {
  items: { number: number; title: string; content: React.ReactNode }[];
}

export default function ArticleAccordionProcess({ items }: ArticleAccordionProcessProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="accordion-process">
      {items.map((item, i) => (
        <div key={item.number} className={`accordion-process__item${openIndex === i ? ' open' : ''}`}>
          <button
            className="accordion-process__trigger"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            aria-expanded={openIndex === i}
          >
            <span className="accordion-process__trigger-left">
              <span className="accordion-process__number">{item.number}</span>
              <span>{item.title}</span>
            </span>
            <svg className="accordion-process__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
          <div className="accordion-process__content">
            <div className="accordion-process__inner">
              {item.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
