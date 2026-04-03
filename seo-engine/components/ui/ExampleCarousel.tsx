'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import './example-carousel.css'

interface Site {
  name: string
  description: string
  image: string
  category: string
  stats?: {
    traffic?: string
    industry?: string
  }
}

interface ExampleCarouselProps {
  heading: string
  categories: string[]
  sites: Site[]
}

export default function ExampleCarousel({
  heading,
  categories,
  sites,
}: ExampleCarouselProps) {
  const allCategories = useMemo(() => ['All', ...categories], [categories])
  const [activeCategory, setActiveCategory] = useState('All')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const trackRef = useRef<HTMLDivElement>(null)
  const dragStartX = useRef(0)
  const dragStartTime = useRef(0)

  const filteredSites = useMemo(() => {
    if (activeCategory === 'All') return sites
    return sites.filter((s) => s.category === activeCategory)
  }, [activeCategory, sites])

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
    setCurrentSlide(0)
    setDragOffset(0)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setDragOffset(0)
  }

  const goPrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
      setDragOffset(0)
    }
  }

  const goNext = () => {
    if (currentSlide < filteredSites.length - 1) {
      setCurrentSlide(currentSlide + 1)
      setDragOffset(0)
    }
  }

  const getSlideWidth = useCallback(() => {
    if (!trackRef.current) return 0
    const container = trackRef.current.parentElement
    return container ? container.offsetWidth : 0
  }, [])

  const handleDragStart = useCallback((clientX: number) => {
    setIsDragging(true)
    dragStartX.current = clientX
    dragStartTime.current = Date.now()
  }, [])

  const handleDragMove = useCallback(
    (clientX: number) => {
      if (!isDragging) return
      const diff = clientX - dragStartX.current
      setDragOffset(diff)
    },
    [isDragging]
  )

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)

    const slideWidth = getSlideWidth()
    const velocity = dragOffset / (Date.now() - dragStartTime.current)
    const threshold = slideWidth * 0.25

    let newSlide = currentSlide
    if (dragOffset < -threshold || velocity < -0.3) {
      newSlide = Math.min(currentSlide + 1, filteredSites.length - 1)
    } else if (dragOffset > threshold || velocity > 0.3) {
      newSlide = Math.max(currentSlide - 1, 0)
    }

    setCurrentSlide(newSlide)
    setDragOffset(0)
  }, [isDragging, dragOffset, currentSlide, filteredSites.length, getSlideWidth])

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX),
    [handleDragStart]
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX),
    [handleDragMove]
  )

  const onTouchEnd = useCallback(() => handleDragEnd(), [handleDragEnd])

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      handleDragStart(e.clientX)
    },
    [handleDragStart]
  )

  useEffect(() => {
    if (!isDragging) return

    const onMove = (e: MouseEvent) => handleDragMove(e.clientX)
    const onUp = () => handleDragEnd()

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  const slideWidth = getSlideWidth()
  const translateX = -(currentSlide * slideWidth) + dragOffset

  return (
    <div className="example-carousel">
      <h2 className="example-carousel__title">{heading}</h2>

      <div className="example-carousel__categories">
        {allCategories.map((cat) => (
          <button
            key={cat}
            className={`example-carousel__pill${activeCategory === cat ? ' example-carousel__pill--active' : ''}`}
            onClick={() => handleCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="example-carousel__categories-mobile">
        <select
          value={activeCategory}
          onChange={(e) => handleCategoryChange(e.target.value)}
        >
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="example-carousel__slider">
        <button
          className={`example-carousel__arrow example-carousel__arrow--prev${currentSlide === 0 ? ' example-carousel__arrow--disabled' : ''}`}
          onClick={goPrev}
          aria-label="Previous slide"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 19l-7-7 7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="example-carousel__viewport">
          <div
            ref={trackRef}
            className={`example-carousel__track${isDragging ? ' example-carousel__track--dragging' : ''}`}
            style={{ transform: `translateX(${translateX}px)` }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
          >
            {filteredSites.map((site, i) => (
              <div
                key={`${site.name}-${i}`}
                className="example-carousel__slide"
              >
                <div className="example-carousel__image-wrap">
                  <img
                    src={site.image}
                    alt={site.name}
                    className="example-carousel__image"
                    loading="lazy"
                    draggable={false}
                  />
                </div>
                <div className="example-carousel__content">
                  <h3 className="example-carousel__name">{site.name}</h3>
                  <p className="example-carousel__description">
                    {site.description}
                  </p>
                  {site.stats && (
                    <div className="example-carousel__info">
                      {site.stats.industry && (
                        <div className="example-carousel__info-item">
                          <h4 className="example-carousel__info-label">
                            Industry
                          </h4>
                          <p className="example-carousel__info-value">
                            {site.stats.industry}
                          </p>
                        </div>
                      )}
                      {site.stats.traffic && (
                        <div className="example-carousel__info-item">
                          <h4 className="example-carousel__info-label">
                            Traffic
                          </h4>
                          <p className="example-carousel__info-value">
                            {site.stats.traffic}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          className={`example-carousel__arrow example-carousel__arrow--next${currentSlide === filteredSites.length - 1 ? ' example-carousel__arrow--disabled' : ''}`}
          onClick={goNext}
          aria-label="Next slide"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 5l7 7-7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {filteredSites.length > 1 && (
        <div className="example-carousel__pagination">
          {filteredSites.map((_, i) => (
            <button
              key={i}
              className={`example-carousel__dot${i === currentSlide ? ' example-carousel__dot--active' : ''}`}
              onClick={() => goToSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
