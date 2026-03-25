'use client';

import { useEffect, useRef } from 'react';

interface TOCItem {
  id: string;
  label: string;
}

interface TOCSidebarProps {
  items: TOCItem[];
}

export default function TOCSidebar({ items }: TOCSidebarProps) {
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const links = sidebar.querySelectorAll<HTMLAnchorElement>('.toc-sidebar-list a');
    const sections: { el: HTMLElement; id: string }[] = [];

    links.forEach((link) => {
      const href = link.getAttribute('href');
      const id = href ? href.replace('#', '') : '';
      if (id) {
        const el = document.getElementById(id);
        if (el) sections.push({ el, id });
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            links.forEach((l) => l.classList.remove('active'));
            const id = entry.target.id;
            links.forEach((l) => {
              if (l.getAttribute('href') === `#${id}`) l.classList.add('active');
            });
          }
        });
      },
      { threshold: 0.15, rootMargin: '-80px 0px -55% 0px' }
    );

    sections.forEach((s) => observer.observe(s.el));

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
      }
    };

    links.forEach((link) => link.addEventListener('click', handleClick));

    return () => {
      observer.disconnect();
      links.forEach((link) => link.removeEventListener('click', handleClick));
    };
  }, []);

  return (
    <aside className="toc-sidebar" ref={sidebarRef} aria-label="Table of Contents">
      <div className="toc-sidebar-inner">
        <p className="toc-sidebar-label">On this page</p>
        <ol className="toc-sidebar-list">
          {items.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`}>{item.label}</a>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
