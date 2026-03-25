'use client';

import { useState } from 'react';

interface ArticleAccordionProps {
  items: { number: number; title: string; desc: string }[];
}

export default function ArticleAccordion({ items }: ArticleAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="accordion-process">
      {items.map((item, i) => (
        <div key={item.number} className={`accordion-step${openIndex === i ? ' open' : ''}`}>
          <button
            className="accordion-header"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <span className="accordion-number">{item.number}</span>
            <span className="accordion-title">{item.title}</span>
          </button>
          <div className="accordion-panel">
            <div className="accordion-panel-inner">
              <p>{item.desc}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
