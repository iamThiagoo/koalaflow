export type SlideRect = Pick<DOMRect, 'top'>;

/**
 * Rule: the slide starts when the art's top edge enters the bottom of the viewport and ends
 * when it reaches this fraction from the top, so the art settles before the section is read.
 */
export const slideEndAt = 0.2;

/**
 * Rule: the drawn position eases toward the scroll position with this time constant, so wheel
 * steps glide instead of jumping.
 */
export const slideSmoothingMs = 140;

/**
 * Scroll progress of the art through the slide range, eased out, from 0 (off screen) to 1 (in place).
 * Rule: values are clamped, so scrolling past the range never overshoots the final position.
 */
export function slideProgress(rect: SlideRect, viewportHeight: number): number {
  const range = viewportHeight * (1 - slideEndAt);
  if (range <= 0) return 1;
  const linear = Math.min(1, Math.max(0, (viewportHeight - rect.top) / range));
  return 1 - (1 - linear) ** 3;
}

/**
 * Moves `current` toward `target` by the share of the gap that `elapsedMs` covers.
 * Rule: the result is frame-rate independent and snaps to the target once the gap is invisible.
 */
export function approach(
  current: number,
  target: number,
  elapsedMs: number,
  smoothingMs: number = slideSmoothingMs,
): number {
  const next = target + (current - target) * Math.exp(-elapsedMs / smoothingMs);
  return Math.abs(next - target) < 0.001 ? target : next;
}
