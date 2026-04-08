'use client';

import { useEffect, useRef } from 'react';

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function DustParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let cachedWidth = 0;
    let cachedHeight = 0;
    const MAX_PARTICLES = 25;

    function updateSize() {
      cachedWidth = container!.offsetWidth;
      cachedHeight = container!.offsetHeight;
    }

    // Warm desert palette
    const colors = [
      [249, 156, 121],
      [249, 178, 99],
      [248, 156, 73],
      [250, 146, 93],
      [246, 96, 38],
      [255, 195, 122],
      [247, 112, 40],
      [251, 173, 74],
      [251, 205, 74],
      [244, 172, 50],
      [253, 159, 28],
    ];

    function spawnParticle() {
      if (!container || cachedWidth === 0) return;
      if (container.querySelectorAll('.feature-cards__dust').length >= MAX_PARTICLES) return;
      const span = document.createElement('span');
      span.className = 'feature-cards__dust';

      const x = rand(0, cachedWidth);
      const y = rand(0, cachedHeight);
      span.style.left = `${x}px`;
      span.style.top = `${y}px`;

      const size = rand(2, 5);
      span.style.width = `${size}px`;
      span.style.height = `${size}px`;

      const [r, g, b] = colors[Math.floor(rand(0, colors.length))];
      span.style.background = `rgb(${r}, ${g}, ${b})`;
      span.style.boxShadow = `0 0 ${size + 3}px rgba(${r}, ${g}, ${b}, 0.8)`;

      container.appendChild(span);

      const driftX = rand(100, 280);
      const driftY = rand(-200, -80);
      const duration = rand(1500, 3500);
      const maxOpacity = rand(0.6, 1);

      const animation = span.animate(
        [
          { transform: 'translate3d(0,0,0)', opacity: maxOpacity },
          { transform: `translate3d(${driftX}px,${driftY}px,0)`, opacity: 0 },
        ],
        { duration, easing: 'linear', fill: 'forwards' }
      );

      animation.onfinish = () => span.remove();
    }

    function startParticles() {
      if (intervalId) return;
      updateSize();
      intervalId = setInterval(() => {
        const count = Math.round(rand(1, 3));
        for (let i = 0; i < count; i++) spawnParticle();
      }, 700);
    }

    function stopParticles() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      container?.querySelectorAll('.feature-cards__dust').forEach((el) => el.remove());
    }

    const resizeObserver = new ResizeObserver(() => { updateSize(); });
    resizeObserver.observe(container);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) startParticles();
        else stopParticles();
      },
      { threshold: 0 }
    );
    observer.observe(container);

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      stopParticles();
    };
  }, []);

  return <div className="feature-cards__particles" ref={containerRef} aria-hidden="true" />;
}
