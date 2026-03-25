'use client';

import { useState } from 'react';

interface ArticleFaqProps {
  items: { question: string; answer: string }[];
}

export default function ArticleFaq({ items }: ArticleFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      {items.map((item, i) => (
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
    </>
  );
}
