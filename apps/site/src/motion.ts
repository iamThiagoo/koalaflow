import type { CSSProperties } from 'react';

/**
 * Rule: related elements enter one after another with a short step, so the whole group
 * settles in well under a second.
 */
export const staggerStepMs = 80;

/**
 * Page-load entrance of the hero, in ms after first paint.
 * Rule: copy and the primary CTA are in place within ~250ms; the product mockup and its
 * floating details follow, so decoration never delays reading.
 */
export const heroEntrance = {
  header: 0,
  headline: 80,
  description: 160,
  actions: 240,
  showcase: 320,
  player: 480,
  pills: [560, 620, 680, 740],
  annotation: 800,
} as const;

/**
 * Delay for a page-load entrance (`animate-enter`).
 */
export function enterDelay(ms: number): CSSProperties {
  return { animationDelay: `${ms}ms` };
}

/**
 * Delay for the nth element of a group revealed on scroll (`data-reveal`).
 */
export function revealDelay(
  index: number,
  stepMs: number = staggerStepMs,
): CSSProperties {
  return { '--reveal-delay': `${index * stepMs}ms` } as CSSProperties;
}

/**
 * Rule: the fixed header compacts once the page has scrolled past this many pixels,
 * so tiny scroll jitter at the top never toggles it.
 */
export const headerCompactAfterPx = 16;

export function isHeaderCompact(scrollY: number): boolean {
  return scrollY > headerCompactAfterPx;
}
