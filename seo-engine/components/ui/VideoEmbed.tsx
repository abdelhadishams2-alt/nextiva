'use client'

import { useState } from 'react'
import './video-embed.css'

interface VideoEmbedProps {
  videoId: string
  title: string
  ctaText?: string
  ctaUrl?: string
}

export default function VideoEmbed({
  videoId,
  title,
  ctaText,
  ctaUrl,
}: VideoEmbedProps) {
  const [playing, setPlaying] = useState(false)

  return (
    <section className="video-embed">
      <div className="video-embed__player">
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="video-embed__iframe"
          />
        ) : (
          <button
            className="video-embed__thumbnail"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${title}`}
          >
            <img
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt={title}
              className="video-embed__img"
            />
            <div className="video-embed__play-button">
              <svg viewBox="0 0 24 24" fill="white" width="30" height="30">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </button>
        )}
      </div>

      {ctaText && ctaUrl && (
        <p className="video-embed__cta">
          <a
            href={ctaUrl}
            target="_blank"
            rel="noopener nofollow"
            className="video-embed__cta-link"
          >
            {ctaText}
          </a>
        </p>
      )}
    </section>
  )
}
