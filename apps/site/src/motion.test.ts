import { describe, expect, it } from 'vitest';
import {
  enterDelay,
  headerCompactAfterPx,
  isHeaderCompact,
  revealDelay,
  staggerStepMs,
} from '@/motion';

describe('revealDelay', () => {
  it('starts the first element of a group without delay', () => {
    expect(revealDelay(0)).toEqual({ '--reveal-delay': '0ms' });
  });

  it('staggers each following element by one step', () => {
    expect(revealDelay(3)).toEqual({
      '--reveal-delay': `${3 * staggerStepMs}ms`,
    });
  });

  it('accepts a custom step for dense groups', () => {
    expect(revealDelay(2, 50)).toEqual({ '--reveal-delay': '100ms' });
  });
});

describe('enterDelay', () => {
  it('sets the animation delay for page-load entrances', () => {
    expect(enterDelay(240)).toEqual({ animationDelay: '240ms' });
  });
});

describe('isHeaderCompact', () => {
  it('keeps the header expanded at the top of the page', () => {
    expect(isHeaderCompact(0)).toBe(false);
  });

  it('ignores small scroll jitter up to the threshold', () => {
    expect(isHeaderCompact(headerCompactAfterPx)).toBe(false);
  });

  it('compacts once the page scrolls past the threshold', () => {
    expect(isHeaderCompact(headerCompactAfterPx + 1)).toBe(true);
  });
});
