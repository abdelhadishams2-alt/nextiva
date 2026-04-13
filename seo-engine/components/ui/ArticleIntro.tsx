'use client';

import { ReactNode } from 'react';

interface Author {
  name: string;
  role: string;
  avatar: string;
  verified?: boolean;
}

interface Badge {
  heading: string;
  subtext: string;
  image: string;
  imageAlt: string;
}

interface ArticleIntroProps {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  updatesUrl?: string;
  methodologyText: string;
  methodologyUrl: string;
  authors: Author[];
  badge?: Badge;
  introParagraphs: (string | ReactNode)[];
  disclaimerText?: string;
}

export default function ArticleIntro({
  title,
  subtitle,
  lastUpdated,
  updatesUrl,
  methodologyText,
  methodologyUrl,
  authors,
  badge,
  introParagraphs,
  disclaimerText = 'lkwjd is supported by readers like yourself. We may earn an affiliate commission when you purchase through our links, which enables us to offer our research for free.',
}: ArticleIntroProps) {
  return (
    <article className="article-intro">
      {/* Article heading */}
      <div className="article-intro__header">
        <h1 className="article-intro__title">
          {title}
          {subtitle && (
            <span className="article-intro__subtitle">{subtitle}</span>
          )}
        </h1>
        <p className="article-intro__date">
          Last updated: {lastUpdated}
          {updatesUrl && (
            <>
              {'  '}
              <a href={updatesUrl} className="article-intro__updates-link">
                SEE UPDATES
              </a>
            </>
          )}
        </p>
      </div>

      {/* Methodology / Authors box */}
      <div className="article-intro__methodology">
        <div className="article-intro__methodology-text">
          <p className="article-intro__methodology-desc">{methodologyText}</p>
          <a href={methodologyUrl} className="article-intro__methodology-link">
            LEARN MORE ABOUT OUR METHODOLOGY <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
        <div className="article-intro__authors">
          {authors.map((author, i) => (
            <div key={i} className="article-intro__author">
              <img
                src={author.avatar}
                alt={author.name}
                className="article-intro__avatar"
                loading="lazy"
                width={60}
                height={60}
              />
              <div className="article-intro__author-info">
                <p className="article-intro__author-name">
                  {author.name}
                  {author.verified !== false && (
                    <svg className="article-intro__verified" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="8" fill="var(--brand-blue)" />
                      <path d="M5 8L7 10L11 6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </p>
                <p className="article-intro__author-role">{author.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Affiliate disclaimer */}
      <p className="article-intro__disclaimer">{disclaimerText}</p>

      {/* Badge section */}
      {badge && (
        <div className="article-intro__badge">
          <div className="article-intro__badge-text">
            <p className="article-intro__badge-heading">{badge.heading}</p>
            <p className="article-intro__badge-subtext">{badge.subtext}</p>
          </div>
          <img
            src={badge.image}
            alt={badge.imageAlt}
            className="article-intro__badge-img"
            loading="lazy"
            width={160}
            height={180}
          />
        </div>
      )}

      {/* Intro paragraphs */}
      {introParagraphs.map((text, i) => (
        <p key={i} className="article-intro__paragraph">{text}</p>
      ))}
    </article>
  );
}
