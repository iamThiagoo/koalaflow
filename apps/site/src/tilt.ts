export type TiltRect = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>;

/**
 * Pointer position relative to the card centre, from -1 (left/top edge) to 1 (right/bottom edge).
 * Rule: values are clamped, so a pointer that slips past the edge never over-tilts the card.
 */
export function pointerOffset(
  rect: TiltRect,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  return {
    x: normalize(clientX - rect.left, rect.width),
    y: normalize(clientY - rect.top, rect.height),
  };
}

function normalize(position: number, size: number): number {
  if (size <= 0) return 0;
  return Math.min(1, Math.max(-1, (position / size) * 2 - 1));
}
