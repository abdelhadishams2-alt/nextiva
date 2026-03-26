'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function FeaturedStoriesAnimation() {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

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
        const text = el.textContent || '';
        const numMatch = text.match(/[\d.]+/);
        if (!numMatch) return;

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

  return null;
}
