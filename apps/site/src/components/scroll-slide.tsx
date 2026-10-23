'use client';

import { useEffect } from 'react';
import { approach, slideProgress } from '@/scroll-slide';

export function ScrollSlide() {
  useEffect(() => {
    const query = window.matchMedia(
      '(min-width: 64rem) and (prefers-reduced-motion: no-preference)',
    );
    const scenes = [
      ...document.querySelectorAll<HTMLElement>('[data-scroll-slide]'),
    ];
    if (scenes.length === 0) return;

    const progress = new Map<HTMLElement, number>();
    let frame = 0;
    let lastTime = 0;

    const draw = (time: number) => {
      const elapsed = lastTime ? time - lastTime : 0;
      lastTime = time;
      let moving = false;
      for (const scene of scenes) {
        const target = slideProgress(
          scene.getBoundingClientRect(),
          window.innerHeight,
        );
        const current = progress.get(scene) ?? target;
        const next = approach(current, target, elapsed);
        progress.set(scene, next);
        scene.style.setProperty('--slide', next.toFixed(4));
        if (next !== target) moving = true;
      }
      frame = moving ? requestAnimationFrame(draw) : 0;
      if (!frame) lastTime = 0;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };

    const start = () => {
      progress.clear();
      document.documentElement.dataset.scrollSlide = '';
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
      schedule();
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      delete document.documentElement.dataset.scrollSlide;
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      for (const scene of scenes) scene.style.removeProperty('--slide');
    };
    const onChange = () => (query.matches ? start() : stop());

    onChange();
    query.addEventListener('change', onChange);
    return () => {
      query.removeEventListener('change', onChange);
      stop();
    };
  }, []);

  return null;
}
