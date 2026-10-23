import { describe, expect, it } from 'vitest';
import { approach, slideEndAt, slideProgress } from '@/scroll-slide';

const viewport = 1000;

describe('slideProgress', () => {
  it('is zero while the art is below the viewport', () => {
    expect(slideProgress({ top: viewport }, viewport)).toBe(0);
    expect(slideProgress({ top: viewport + 400 }, viewport)).toBe(0);
  });

  it('reaches the final position at the end of the range', () => {
    expect(slideProgress({ top: viewport * slideEndAt }, viewport)).toBe(1);
  });

  it('stays in place after scrolling past the range', () => {
    expect(slideProgress({ top: -500 }, viewport)).toBe(1);
  });

  it('eases out, covering most of the way in the first half', () => {
    const halfway = viewport - (viewport * (1 - slideEndAt)) / 2;
    expect(slideProgress({ top: halfway }, viewport)).toBeCloseTo(0.875);
  });

  it('keeps the art in place for an empty viewport', () => {
    expect(slideProgress({ top: 0 }, 0)).toBe(1);
  });
});

describe('approach', () => {
  it('moves part of the way toward the target', () => {
    const next = approach(0, 1, 16, 140);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(1);
  });

  it('is frame-rate independent', () => {
    const oneLongFrame = approach(0, 1, 32, 140);
    const twoShortFrames = approach(approach(0, 1, 16, 140), 1, 16, 140);
    expect(twoShortFrames).toBeCloseTo(oneLongFrame);
  });

  it('snaps to the target once the gap is invisible', () => {
    expect(approach(0.9995, 1, 16, 140)).toBe(1);
    expect(approach(1, 1, 16, 140)).toBe(1);
  });
});
