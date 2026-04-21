export interface FootnoteItem {
  id: string;
  number: number;
  claim: string;
  source_url: string;
  verified_date: string;
  source_label?: string;
}

interface FootnoteListProps {
  items: FootnoteItem[];
  title?: string;
  verifiedLabel?: (date: string) => string;
  backLabel?: string;
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function FootnoteList({
  items,
  title = 'Sources',
  verifiedLabel = (date) => `verified ${date}`,
  backLabel = 'Back to reference',
}: FootnoteListProps) {
  if (!items.length) return null;

  const sorted = [...items].sort((a, b) => a.number - b.number);

  return (
    <aside className="footnote-list" aria-labelledby="footnote-list-label">
      <h2 id="footnote-list-label" className="footnote-list__title">
        {title}
      </h2>
      <ol className="footnote-list__list">
        {sorted.map((item) => (
          <li
            key={item.id}
            id={`fn-${item.number}`}
            className="footnote-list__item"
            data-evidence-id={item.id}
          >
            <span className="footnote-list__claim">{item.claim}</span>{' '}
            <a
              className="footnote-list__source"
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.source_label ?? hostnameOf(item.source_url)}
            </a>{' '}
            <span className="footnote-list__date">
              ({verifiedLabel(item.verified_date)})
            </span>{' '}
            <a
              className="footnote-list__back"
              href={`#fnref-${item.number}`}
              aria-label={backLabel}
            >
              &#x21A9;
            </a>
          </li>
        ))}
      </ol>
    </aside>
  );
}
