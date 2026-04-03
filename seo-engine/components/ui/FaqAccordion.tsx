'use client';

import { useState, type ReactNode } from 'react';

interface FaqItem {
  question: string;
  answer: string | ReactNode;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="faq-accordion">
      {items.map((item, index) => {
        const isOpen = openItems.has(index);
        const panelId = `faq-panel-${index}`;
        const triggerId = `faq-trigger-${index}`;

        return (
          <div
            className={`faq-accordion__item${isOpen ? ' faq-accordion__item--active' : ''}`}
            key={index}
          >
            <button
              id={triggerId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="faq-accordion__trigger"
              onClick={() => toggleItem(index)}
            >
              <span className="faq-accordion__question">{item.question}</span>
              <span className="faq-accordion__icon" aria-hidden="true" />
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              className={`faq-accordion__body${isOpen ? ' faq-accordion__body--open' : ''}`}
            >
              <div className="faq-accordion__content">
                {typeof item.answer === 'string' ? <p>{item.answer}</p> : item.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
