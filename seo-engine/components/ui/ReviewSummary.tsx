'use client';

import { type ReactNode } from 'react';

interface ReviewSummaryProps {
  heading: string;
  paragraphs: Array<string | ReactNode>;
}

export default function ReviewSummary({ heading, paragraphs }: ReviewSummaryProps) {
  return (
    <section className="review-summary">
      <h2 className="review-summary__heading">{heading}</h2>
      <div className="review-summary__box">
        {paragraphs.map((paragraph, index) => (
          <div key={index} className="review-summary__paragraph">
            {typeof paragraph === 'string' ? <p>{paragraph}</p> : paragraph}
          </div>
        ))}
      </div>
    </section>
  );
}
