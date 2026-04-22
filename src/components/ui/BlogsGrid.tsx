'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BLUR_DATA_URL } from '@/lib/blur-placeholder';

interface Article {
  slug: string;
  image: string;
  badge: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
}

interface Filter {
  key: string;
  label: string;
}

interface BlogsGridProps {
  articles: Article[];
  filters: Filter[];
  searchPlaceholder: string;
}

const PER_PAGE = 6;

export default function BlogsGrid({ articles, filters, searchPlaceholder }: BlogsGridProps) {
  const t = useTranslations('Blogs');
  const searchParams = useSearchParams();
  const gridRef = useRef<HTMLElement>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const category = searchParams.get('category');
    if (category && filters.some((f) => f.key === category)) {
      setActiveFilter(category);
    }
  }, [searchParams, filters]);

  const filtered = articles.filter((article) => {
    const matchesCategory = activeFilter === 'all' || article.category === activeFilter;
    const matchesSearch =
      !search ||
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(search.toLowerCase()) ||
      article.badge.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const handleFilterChange = (key: string) => {
    setActiveFilter(key);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  return (
    <>
      {/* Filter Bar */}
      <section className="blogs-filters">
        <div className="blogs-filters__inner">
          <div className="blogs-filters__left">
            <span className="blogs-filters__label">{t('filterLabel')}</span>
            <div className="blogs-filters__pills">
              {filters.map((f) => (
                <button
                  key={f.key}
                  className={`blogs-filters__pill${activeFilter === f.key ? ' blogs-filters__pill--active' : ''}`}
                  onClick={() => handleFilterChange(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="blogs-filters__search">
            <svg className="blogs-filters__search-icon" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="blogs-filters__search-input"
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Article Grid */}
      <section className="blogs-grid" ref={gridRef}>
        <div className="blogs-grid__inner">
          {filtered.length === 0 && (
            <p className="blogs-grid__empty">{t('noResults')}</p>
          )}
          <div className="blogs-grid__list">
            {paged.map((article) => (
              <Link
                key={article.slug}
                href={`/${article.slug}`}
                className="blogs-card"
              >
                <div className="blogs-card__image">
                  <Image src={article.image} alt={article.title} width={600} height={400} loading="lazy" quality={75} sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                </div>
                <div className="blogs-card__body">
                  <div className="blogs-card__top">
                    <span className="blogs-card__badge">{article.badge}</span>
                  </div>
                  <h3 className="blogs-card__title">{article.title}</h3>
                  <p className="blogs-card__excerpt">{article.excerpt}</p>
                  <div className="blogs-card__footer">
                    <span className="blogs-card__date">{article.date}</span>
                    <span className="blogs-card__meta-divider" />
                    <span className="blogs-card__read-time">{article.readTime}</span>
                    <svg className="blogs-card__arrow" viewBox="0 0 24 24">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="blogs-pagination">
              <button
                className="blogs-pagination__btn"
                disabled={currentPage === 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`blogs-pagination__btn${currentPage === page ? ' blogs-pagination__btn--active' : ''}`}
                  onClick={() => goToPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                className="blogs-pagination__btn"
                disabled={currentPage === totalPages}
                onClick={() => goToPage(currentPage + 1)}
              >
                <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </nav>
          )}
        </div>
      </section>
    </>
  );
}
