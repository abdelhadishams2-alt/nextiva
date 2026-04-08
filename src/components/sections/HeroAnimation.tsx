'use client';

import { useEffect } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

export function HeroAnimation() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      /* Background Ken Burns zoom */
      gsap.fromTo(
        '.hero__bg img',
        { scale: 1.15 },
        { scale: 1, duration: 8, ease: 'power1.out' }
      );

      /* Overlay fade in */
      tl.fromTo(
        '.hero__overlay',
        { opacity: 0 },
        { opacity: 1, duration: 1.2 },
        0
      );

      /* Rating / eyebrow — fade down */
      tl.fromTo(
        '.hero__eyebrow',
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        0.3
      );

      /* Title — fade up with slight scale */
      tl.fromTo(
        '.hero__title',
        { y: 60, opacity: 0, scale: 0.97 },
        { y: 0, opacity: 1, scale: 1, duration: 1 },
        0.5
      );

      /* Description — fade up */
      tl.fromTo(
        '.hero__description',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        0.9
      );

      /* CTA buttons — stagger in */
      tl.fromTo(
        '.hero__btn',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.15 },
        1.2
      );

      /* Stars twinkle — subtle pulse loop */
      gsap.to('.hero__star', {
        opacity: 0.5,
        duration: 1.2,
        stagger: { each: 0.2, repeat: -1, yoyo: true },
        ease: 'sine.inOut',
        delay: 2,
      });

      /* Parallax on scroll — desktop only (breaks pull-to-refresh & feels janky on mobile) */
      if (window.innerWidth > 768) {
        gsap.to('.hero__bg img', {
          y: 150,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }

    });

    return () => ctx.revert();
  }, []);

  return null;
}
