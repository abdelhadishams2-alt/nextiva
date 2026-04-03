'use client'

import { useState, useCallback } from 'react'
import './video-player.css'

interface Video {
  id: string
  title: string
  thumbnail?: string
}

interface VideoPlayerProps {
  heading?: string
  videos: Video[]
}

export default function VideoPlayer({ heading, videos }: VideoPlayerProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)

  const handleTabClick = useCallback((index: number) => {
    setActiveIndex(index)
    setPlayingIndex(null)
  }, [])

  const handlePlay = useCallback((index: number) => {
    setPlayingIndex(index)
  }, [])

  if (!videos.length) return null

  return (
    <section className="video-player" id="videos">
      {heading && <h2 className="video-player__heading">{heading}</h2>}

      <div className="video-player__wrapper">
        {videos.length > 1 && (
          <ul className="video-player__nav">
            {videos.map((video, i) => (
              <li
                key={video.id}
                className={`video-player__tab${i === activeIndex ? ' video-player__tab--active' : ''}`}
                onClick={() => handleTabClick(i)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleTabClick(i)
                }}
              >
                {video.title}
              </li>
            ))}
          </ul>
        )}

        <div className="video-player__container">
          {videos.map((video, i) => (
            <div
              key={video.id}
              className="video-player__content"
              style={{ display: i === activeIndex ? 'block' : 'none' }}
            >
              <div className="video-player__embed">
                {playingIndex === i ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="video-player__iframe"
                  />
                ) : (
                  <div
                    className="video-player__thumbnail"
                    onClick={() => handlePlay(i)}
                  >
                    <img
                      loading="lazy"
                      alt={video.title}
                      src={
                        video.thumbnail ||
                        `https://img.youtube.com/vi/${video.id}/0.jpg`
                      }
                      className="video-player__img"
                    />
                    <div className="video-player__play-button">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path d="M8 5v14l11-7L8 5z" fill="#fff" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
