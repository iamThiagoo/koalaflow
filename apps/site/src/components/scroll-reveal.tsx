'use client';

import { useEffect } from 'react';

export function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const root = document.documentElement;
    const elements = [
      ...document.querySelectorAll<HTMLElement>('[data-reveal]'),
    ];
    const pending: HTMLElement[] = [];
    for (const element of elements) {
      const { top, bottom } = element.getBoundingClientRect();
      if (top < window.innerHeight && bottom > 0) {
        element.dataset.revealed = 'instant';
      } else {
        pending.push(element);
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.revealed = 'in';
          observer.unobserve(entry.target);
        }
      },
      // Rule: any visible pixel counts, so mostly-clipped art (the final illustration) still reveals.
      { rootMargin: '0px 0px -10% 0px', threshold: 0 },
    );
    for (const element of pending) observer.observe(element);
    root.dataset.revealReady = '';

    return () => {
      observer.disconnect();
      delete root.dataset.revealReady;
    };
  }, []);

  return null;
}
