'use client';

import { useEffect, useRef } from 'react';
import posthog from 'posthog-js';

export default function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const milestonesHit = useRef<Set<number>>(new Set());

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const milestones = [25, 50, 75, 100];

    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const percent = total > 0 ? (window.scrollY / total) * 100 : 0;
      bar.style.width = `${percent}%`;

      for (const milestone of milestones) {
        if (percent >= milestone && !milestonesHit.current.has(milestone)) {
          milestonesHit.current.add(milestone);
          posthog.capture('scroll_depth', {
            depth: milestone,
            page: window.location.pathname,
          });
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return <div className="reading-progress" ref={barRef} />;
}
