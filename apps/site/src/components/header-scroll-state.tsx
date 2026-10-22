'use client';

import { useEffect } from 'react';
import { isHeaderCompact } from '@/motion';

/**
 * Marks `<html data-scrolled>` once the page leaves the top, so the fixed header compacts.
 * Rule: a passive scroll listener only toggles one attribute; the header animates in CSS.
 */
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
