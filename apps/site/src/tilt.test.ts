import { describe, expect, it } from 'vitest';
import { pointerOffset } from '@/tilt';

const rect = { left: 100, top: 50, width: 200, height: 100 };

describe('pointerOffset', () => {
  it('is zero at the centre of the card', () => {
    expect(pointerOffset(rect, 200, 100)).toEqual({ x: 0, y: 0 });
  });

  it('reaches -1 and 1 at the edges', () => {
    expect(pointerOffset(rect, 100, 50)).toEqual({ x: -1, y: -1 });
    expect(pointerOffset(rect, 300, 150)).toEqual({ x: 1, y: 1 });
  });

  it('clamps a pointer outside the card', () => {
    expect(pointerOffset(rect, 900, -400)).toEqual({ x: 1, y: -1 });
  });

  it('stays flat for a card with no size', () => {
    expect(
      pointerOffset({ left: 0, top: 0, width: 0, height: 0 }, 10, 10),
    ).toEqual({ x: 0, y: 0 });
  });
});
