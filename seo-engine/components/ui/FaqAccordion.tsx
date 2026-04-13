interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

/**
 * FAQ Accordion — uses native <details>/<summary> elements.
 * Matches the shopify-guide__faq-list pattern used across all lkwjd articles.
 * No client-side JS needed — this is a server component.
 */
export default function FaqAccordion({ items }: FaqAccordionProps) {
  return (
    <div className="shopify-guide__faq-list">
      {items.map((item, index) => (
        <details key={index} className="shopify-guide__faq-item">
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
