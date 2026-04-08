'use client';

import { useEffect } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

export function FeaturedStoriesAnimation() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      const section = document.querySelector('.featured-stories');
      if (!section) return;

      /* Header — eyebrow + title slide up */
      gsap.fromTo(
        '.featured-stories__eyebrow',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.featured-stories__header',
            start: 'top 85%',
            once: true,
          },
        }
      );

      gsap.fromTo(
        '.featured-stories__title',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.featured-stories__header',
            start: 'top 85%',
            once: true,
          },
          delay: 0.15,
        }
      );

      /* Cards — stagger in */
      const cards = section.querySelectorAll('.featured-stories__card');
      gsap.fromTo(
        cards,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: {
            trigger: '.featured-stories__grid',
            start: 'top 80%',
            once: true,
          },
        }
      );

      /* Metric count-up animation */
      const metrics = section.querySelectorAll('.featured-stories__metric');
      metrics.forEach((el) => {
        // Preserve original text in data attribute so StrictMode revert doesn't lose it
        if (!el.getAttribute('data-original')) {
          el.setAttribute('data-original', el.textContent || '');
        }
        const text = el.getAttribute('data-original') || '';
        const numMatch = text.match(/[\d.]+/);
        if (!numMatch) return;

        // Reset text to original before animating (in case StrictMode left it at 0)
        el.textContent = text;

        const target = parseFloat(numMatch[0]);
        const suffix = text.replace(numMatch[0], '');
        const isDecimal = text.includes('.');
        const proxy = { val: 0 };

        gsap.to(proxy, {
          val: target,
          duration: 1.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            once: true,
          },
          onUpdate() {
            if (isDecimal) {
              el.textContent = proxy.val.toFixed(1) + suffix;
            } else {
              el.textContent = Math.round(proxy.val) + suffix;
            }
          },
        });
      });

    });

    return () => ctx.revert();
  }, []);

  /* Mobile: infinite loop — reorder only after touch ends and momentum settles */
  useEffect(() => {
    if (!window.matchMedia('(max-width: 768px)').matches) return;

    const grid = document.querySelector<HTMLElement>('.featured-stories__grid');
    if (!grid) return;

    const GAP = 12;
    let polling: ReturnType<typeof setInterval>;

    const reorder = () => {
      const cards = Array.from(grid.children) as HTMLElement[];
      const count = cards.length;
      if (count < 3) return;
      const max = grid.scrollWidth - grid.clientWidth;

      /* At right edge → move first half of cards to the end */
      if (grid.scrollLeft >= max - 5) {
        const toMove = Math.floor(count / 2);
        let shift = 0;
        for (let i = 0; i < toMove; i++) {
          const card = grid.children[0] as HTMLElement;
          shift += card.offsetWidth + GAP;
          grid.appendChild(card);
        }
        grid.scrollLeft -= shift;
      }
      /* At left edge → move last half of cards to the start */
      else if (grid.scrollLeft <= 5) {
        const toMove = Math.floor(count / 2);
        let shift = 0;
        for (let i = 0; i < toMove; i++) {
          const card = grid.children[grid.children.length - 1] as HTMLElement;
          shift += card.offsetWidth + GAP;
          grid.insertBefore(card, grid.children[0]);
        }
        grid.scrollLeft += shift;
      }
    };

    /* After finger lifts, poll until scroll velocity hits zero, then reorder */
    const onTouchEnd = () => {
      let lastPos = grid.scrollLeft;
      let stableCount = 0;

      clearInterval(polling);
      polling = setInterval(() => {
        if (Math.abs(grid.scrollLeft - lastPos) < 1) {
          stableCount++;
          if (stableCount >= 2) {
            clearInterval(polling);
            reorder();
          }
        } else {
          stableCount = 0;
        }
        lastPos = grid.scrollLeft;
      }, 100);
    };

    grid.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      grid.removeEventListener('touchend', onTouchEnd);
      clearInterval(polling);
    };
  }, []);

  return null;
}
