'use client';

import { useEffect } from 'react';
import { isHeaderCompact } from '@/motion';

export function HeaderScrollState() {
  useEffect(() => {
    const root = document.documentElement;
    const update = () =>
      root.toggleAttribute('data-scrolled', isHeaderCompact(window.scrollY));
    update();
    window.addEventListener('scroll', update, { passive: true });

    return () => {
      window.removeEventListener('scroll', update);
      root.removeAttribute('data-scrolled');
    };
  }, []);

  return null;
}
