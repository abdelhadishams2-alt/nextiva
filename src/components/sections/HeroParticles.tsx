'use client';

import { useEffect, useRef } from 'react';

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function HeroParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    function spawnParticle() {
      if (!container) return;
      const rect = container.getBoundingClientRect();

      const span = document.createElement('span');
      span.className = 'hero__particle';

      const x = rand(0, rect.width);
      const y = rand(0, rect.height);
      span.style.left = `${x}px`;
      span.style.top = `${y}px`;

      const size = rand(2, 4);
      span.style.width = `${size}px`;
      span.style.height = `${size * 1.5}px`;

      const roll = Math.random();
      let r: number, g: number, b: number;
      if (roll < 0.4) {
        r = Math.round(200 + 40 * Math.random());
        g = Math.round(210 + 35 * Math.random());
        b = Math.round(240 + 15 * Math.random());
        span.style.boxShadow = '0 0 6px rgba(100, 160, 255, 0.7)';
      } else if (roll < 0.75) {
        r = Math.round(10 + 20 * Math.random());
        g = Math.round(80 + 40 * Math.random());
        b = Math.round(220 + 35 * Math.random());
      } else {
        r = Math.round(0 + 20 * Math.random());
        g = Math.round(100 + 30 * Math.random());
        b = Math.round(240 + 15 * Math.random());
      }
      span.style.background = `rgba(${r}, ${g}, ${b}, 1)`;

      container.appendChild(span);

      const dx = rand(60, 180);
      const dy = rand(-120, -40);
      const rotation = rand(-360, 360);
      const scale = rand(0.6, 1.2);
      const duration = rand(2500, 4000);

      const animation = span.animate(
        [
          {
            transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)',
            opacity: 1,
          },
          {
            transform: `translate3d(${dx}px, ${dy}px, 0) rotate(${rotation}deg) scale(${scale})`,
            opacity: 0.3,
          },
        ],
        { duration, easing: 'linear', fill: 'forwards' }
      );

      animation.onfinish = () => span.remove();
    }

    function startParticles() {
      if (intervalId) return;
      intervalId = setInterval(() => {
        const count = Math.round(rand(3, 7));
        for (let i = 0; i < count; i++) {
          spawnParticle();
        }
      }, 200);
    }

    function stopParticles() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      container?.querySelectorAll('.hero__particle').forEach((el) => el.remove());
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startParticles();
          } else {
            stopParticles();
          }
        });
      },
      { threshold: 0 }
    );

    observer.observe(container);

    if (container.getBoundingClientRect().top < window.innerHeight) {
      startParticles();
    }

    return () => {
      observer.disconnect();
      stopParticles();
    };
  }, []);

  return <div className="hero__particles" ref={containerRef} aria-hidden="true" />;
}
