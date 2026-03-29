'use client';

import { useState } from 'react';
import { articles } from '@/config/articles';
import { SITE_CONFIG } from '@/config/site';

type PostStatus = Record<string, { x?: string; linkedin?: string }>;

export default function SocialAdminPage() {
  const [status, setStatus] = useState<PostStatus>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const postTo = async (platform: 'x' | 'linkedin', slug: string, title: string, description: string) => {
    const key = `${platform}-${slug}`;
    setLoading((prev) => ({ ...prev, [key]: true }));

    try {
      const res = await fetch(`/api/social/${platform}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, title, description }),
      });

      const data = await res.json();

      setStatus((prev) => ({
        ...prev,
        [slug]: {
          ...prev[slug],
          [platform]: data.success ? 'Posted!' : `Error: ${data.error}`,
        },
      }));
    } catch {
      setStatus((prev) => ({
        ...prev,
        [slug]: { ...prev[slug], [platform]: 'Network error' },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="admin-social">
      <div className="admin-social__header">
        <h1 className="admin-social__title">Social Media Posting</h1>
        <p className="admin-social__desc">Post articles to X (Twitter) and LinkedIn. Each button sends the article title, description, and link.</p>
      </div>

      <div className="admin-social__list">
        {articles.map((article) => (
          <div key={article.slug} className="admin-social__card">
            <div className="admin-social__card-info">
              <span className="admin-social__card-category">{article.category}</span>
              <h3 className="admin-social__card-title">{article.title}</h3>
              <p className="admin-social__card-url">{SITE_CONFIG.url}/{article.slug}</p>
            </div>

            <div className="admin-social__card-actions">
              <button
                className="admin-social__btn admin-social__btn--x"
                onClick={() => postTo('x', article.slug, article.title, article.description)}
                disabled={!!loading[`x-${article.slug}`]}
              >
                {loading[`x-${article.slug}`] ? 'Posting...' : 'Post to X'}
              </button>

              <button
                className="admin-social__btn admin-social__btn--linkedin"
                onClick={() => postTo('linkedin', article.slug, article.title, article.description)}
                disabled={!!loading[`linkedin-${article.slug}`]}
              >
                {loading[`linkedin-${article.slug}`] ? 'Posting...' : 'Post to LinkedIn'}
              </button>
            </div>

            {status[article.slug] && (
              <div className="admin-social__card-status">
                {status[article.slug].x && <span className={status[article.slug].x === 'Posted!' ? 'admin-social__status--success' : 'admin-social__status--error'}>X: {status[article.slug].x}</span>}
                {status[article.slug].linkedin && <span className={status[article.slug].linkedin === 'Posted!' ? 'admin-social__status--success' : 'admin-social__status--error'}>LinkedIn: {status[article.slug].linkedin}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
