'use client';

import { useState } from 'react';

interface ArticleFaqAccordionProps {
  items: { question: string; answer: string }[];
}

export default function ArticleFaqAccordion({ items }: ArticleFaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="faq-accordion__list">
      {items.map((item, i) => (
        <div key={i} className={`faq-accordion__item${openIndex === i ? ' open' : ''}`}>
          <button
            className={`faq-accordion__question${openIndex === i ? ' active' : ''}`}
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            aria-expanded={openIndex === i}
          >
            {item.question}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          <div className="faq-accordion__answer" style={{ maxHeight: openIndex === i ? '600px' : '0' }}>
            <div className="faq-accordion__answer-inner">{item.answer}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
