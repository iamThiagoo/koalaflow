'use client';

import { useEffect } from 'react';
import { pointerOffset } from '@/tilt';

export function CardTilt() {
  useEffect(() => {
    const query = window.matchMedia(
      '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
    );
    if (!query.matches) return;

    const cards = [...document.querySelectorAll<HTMLElement>('[data-tilt]')];
    const cleanups = cards.map((card) => {
      let frame = 0;
      let clientX = 0;
      let clientY = 0;

      const update = () => {
        frame = 0;
        const offset = pointerOffset(
          card.getBoundingClientRect(),
          clientX,
          clientY,
        );
        card.style.setProperty('--tilt-px', offset.x.toFixed(3));
        card.style.setProperty('--tilt-py', offset.y.toFixed(3));
        card.dataset.tilting = '';
      };
      const onMove = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return;
        clientX = event.clientX;
        clientY = event.clientY;
        if (!frame) frame = requestAnimationFrame(update);
      };
      const onLeave = () => {
        cancelAnimationFrame(frame);
        frame = 0;
        delete card.dataset.tilting;
      };

      card.addEventListener('pointermove', onMove);
      card.addEventListener('pointerleave', onLeave);
      return () => {
        onLeave();
        card.removeEventListener('pointermove', onMove);
        card.removeEventListener('pointerleave', onLeave);
      };
    });

    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, []);

  return null;
}
