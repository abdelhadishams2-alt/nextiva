'use client';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  current: string;
}

export default function Breadcrumbs({ items, current }: BreadcrumbsProps) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumbs__list">
        {items.map((item, idx) => (
          <li key={idx} className="breadcrumbs__item">
            <a href={item.href} className="breadcrumbs__link">
              {item.label}
            </a>
            <span className="breadcrumbs__separator" aria-hidden="true">
              &raquo;
            </span>
          </li>
        ))}
        <li className="breadcrumbs__item">
          <span className="breadcrumbs__current" aria-current="page">
            {current}
          </span>
        </li>
      </ol>
    </nav>
  );
}
