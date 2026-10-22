import { describe, expect, it } from 'vitest';
import {
  estimate,
  fillCount,
  formatBrl,
  formatCompact,
  hoursRange,
  minutesRange,
  positionOf,
  pricing,
  sliderSteps,
  snap,
  stepOf,
  stepTo,
  ticks,
  valueAt,
} from '@/pricing';

/** Intl uses non-breaking spaces; compare with plain ones. */
const plain = (text: string) => text.replace(/\s/g, ' ');

describe('estimate', () => {
  it('prices the default usage', () => {
    const result = estimate(120_000, 200);
    expect(result).toMatchObject({
      billableMinutes: 119_000,
      delivery: 595,
      storage: 120,
      total: 715,
      students: 250,
      courses: 25,
    });
    expect(result.perStudent).toBeCloseTo(2.86, 10);
  });

  it('charges no delivery within the free allowance', () => {
    const result = estimate(1_000, 10);
    expect(result.delivery).toBe(0);
    expect(result.total).toBe(result.storage);
    expect(result.total).toBe(6);
  });

  it('counts at least whole students and divides the total among them', () => {
    const result = estimate(1_000, 10);
    expect(result.students).toBe(2);
    expect(result.perStudent).toBe(3);
  });

  it('never counts fewer than one student or course', () => {
    const result = estimate(100, 1);
    expect(result.students).toBe(1);
    expect(result.courses).toBe(1);
  });

  it('prices both sliders at their maximum', () => {
    expect(estimate(minutesRange.max, hoursRange.max).total).toBe(10_995);
  });

  it('makes the total the sum of the rounded lines', () => {
    // Unrounded: 1,40 + 7,20 = 8,60, which would round to 9.
    const result = estimate(1_280, 12);
    expect(result.delivery).toBe(1);
    expect(result.storage).toBe(7);
    expect(result.total).toBe(8);
  });

  it('starts delivery after a changed free allowance', () => {
    const prices = { ...pricing, freeMinutes: 2_000 };
    expect(estimate(2_000, 10, prices).delivery).toBe(0);
    expect(estimate(4_000, 10, prices).delivery).toBe(10);
  });
});

describe('snap', () => {
  it('rounds to two significant figures', () => {
    expect(snap(123_456)).toBe(120_000);
    expect(snap(1_049)).toBe(1_000);
    expect(snap(195)).toBe(200);
    expect(snap(10)).toBe(10);
  });
});

describe('slider scale', () => {
  it('maps the ends of the slider to the ends of the range', () => {
    expect(valueAt(0, minutesRange)).toBe(1_000);
    expect(valueAt(sliderSteps, minutesRange)).toBe(1_000_000);
    expect(valueAt(0, hoursRange)).toBe(10);
    expect(valueAt(sliderSteps, hoursRange)).toBe(10_000);
  });

  it('clamps positions and values outside the range', () => {
    expect(valueAt(-20, minutesRange)).toBe(1_000);
    expect(valueAt(sliderSteps + 20, minutesRange)).toBe(1_000_000);
    expect(positionOf(10, minutesRange)).toBe(0);
    expect(positionOf(5_000_000, minutesRange)).toBe(sliderSteps);
  });

  it('round trips the defaults and the ends', () => {
    for (const value of [1_000, 120_000, 1_000_000]) {
      expect(valueAt(positionOf(value, minutesRange), minutesRange)).toBe(
        value,
      );
    }
    for (const value of [10, 200, 10_000]) {
      expect(valueAt(positionOf(value, hoursRange), hoursRange)).toBe(value);
    }
  });

  it('only produces round numbers in between', () => {
    expect(valueAt(69, minutesRange)).toBe(120_000);
    expect(valueAt(43, hoursRange)).toBe(190);
  });

  it('always moves one value per arrow step, even when snapping repeats a value', () => {
    // Positions 70 and 71 both snap to 130,000 minutes.
    expect(valueAt(71, minutesRange)).toBe(130_000);
    expect(stepTo(71, 130_000, minutesRange)).toBe(140_000);
    expect(stepTo(69, 130_000, minutesRange)).toBe(120_000);
  });

  it('keeps the value when an event repeats the current position', () => {
    // 130,000 minutes sits at position 70.46, which the input holds as 70.
    expect(stepOf(130_000, minutesRange)).toBe(70);
    expect(stepTo(70, 130_000, minutesRange)).toBe(130_000);
  });

  it('stays at the ends when there is nowhere left to step', () => {
    expect(stepTo(sliderSteps, 1_000_000, minutesRange)).toBe(1_000_000);
    expect(stepTo(0, 1_000, minutesRange)).toBe(1_000);
  });

  it('places a tick on every power of ten', () => {
    expect(ticks(minutesRange)).toEqual([1_000, 10_000, 100_000, 1_000_000]);
    expect(ticks(hoursRange)).toEqual([10, 100, 1_000, 10_000]);
  });
});

describe('formatting', () => {
  it('formats reais with and without cents', () => {
    expect(plain(formatBrl(715))).toBe('R$ 715');
    expect(plain(formatBrl(10_995))).toBe('R$ 10.995');
    expect(plain(formatBrl(2.86, 2))).toBe('R$ 2,86');
    expect(plain(formatBrl(pricing.pricePerMinute, 3))).toBe('R$ 0,005');
  });

  it('shortens large numbers the Brazilian way', () => {
    expect(plain(formatCompact(120_000))).toBe('120 mil');
    expect(plain(formatCompact(1_000_000))).toBe('1 mi');
    expect(plain(formatCompact(1_200))).toBe('1,2 mil');
  });

  it('uses the singular form for one', () => {
    const forms = {
      one: '≈ {count} curso de {hours} horas',
      other: '≈ {count} cursos de {hours} horas',
    };
    expect(fillCount(forms, 1, { hours: 8 })).toBe('≈ 1 curso de 8 horas');
    expect(fillCount(forms, 25, { hours: 8 })).toBe('≈ 25 cursos de 8 horas');
    expect(fillCount(forms, 1_250, { hours: 8 })).toBe(
      '≈ 1.250 cursos de 8 horas',
    );
  });
});
