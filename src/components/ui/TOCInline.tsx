'use client';

import { useEffect, useRef, useState } from 'react';

interface TOCItem {
  id: string;
  label: string;
}

interface TOCInlineProps {
  items: TOCItem[];
}

export default function TOCInline({ items }: TOCInlineProps) {
  const [expanded, setExpanded] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const links = list.querySelectorAll<HTMLAnchorElement>('a');

    const handleClick = (e: Event) => {
      e.preventDefault();
      const link = e.currentTarget as HTMLAnchorElement;
      const href = link.getAttribute('href');
      const id = href ? href.replace('#', '') : '';
      const target = id ? document.getElementById(id) : null;
      if (target) {
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY - 90,
          behavior: 'smooth',
        });
        setExpanded(false);
      }
    };

    links.forEach((link) => link.addEventListener('click', handleClick));
    return () => {
      links.forEach((link) => link.removeEventListener('click', handleClick));
    };
  }, []);

  return (
    <nav className="article-toc-inline">
      <div className="toc-inline-header" onClick={() => setExpanded(!expanded)}>
        <h3>Table of Contents</h3>
        <button
          className={`toc-inline-toggle${expanded ? ' expanded' : ''}`}
          aria-label="Toggle table of contents"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
      <ol className={`toc-inline-list${expanded ? ' expanded' : ''}`} ref={listRef}>
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`}>{item.label}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
