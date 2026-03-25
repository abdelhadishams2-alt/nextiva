'use client';

import { useState } from 'react';

interface ArticleAccordionFaqProps {
  items: { question: string; answer: string }[];
}

export default function ArticleAccordionFaq({ items }: ArticleAccordionFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="accordion">
      {items.map((item, i) => (
        <div key={i} className={`accordion-item${openIndex === i ? ' open' : ''}`}>
          <button
            className={`accordion-btn${openIndex === i ? ' open' : ''}`}
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            aria-expanded={openIndex === i}
          >
            {item.question}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          <div className={`accordion-answer${openIndex === i ? ' open' : ''}`}>
            <p>{item.answer}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
