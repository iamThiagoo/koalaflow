/**
 * Published prices and the usage model behind the pricing calculator.
 * Rule: every price, allowance and conversion shown on the site comes from this object.
 * Rule: these are the published example prices; the billing context must charge these or less.
 */
export const pricing = {
  pricePerMinute: 0.005,
  pricePerStoredHour: 0.6,
  freeMinutes: 1_000,
  minutesPerStudent: 480,
  hoursPerCourse: 8,
} as const;

export type Pricing = { [K in keyof typeof pricing]: number };

export interface SliderRange {
  min: number;
  max: number;
  initial: number;
}

export const minutesRange: SliderRange = {
  min: 1_000,
  max: 1_000_000,
  initial: 120_000,
};

export const hoursRange: SliderRange = { min: 10, max: 10_000, initial: 200 };

/**
 * Rule: sliders have 100 keyboard steps across their log scale (about 7% of the value per step).
 */
export const sliderSteps = 100;

export interface Estimate {
  billableMinutes: number;
  delivery: number;
  storage: number;
  total: number;
  students: number;
  perStudent: number;
  courses: number;
}

/**
 * Rule: delivery is charged only for the minutes above the free allowance.
 * Rule: each line is rounded to whole reais and the total is the sum of the rounded lines.
 * Rule: a student watches `minutesPerStudent` per month; the count never drops below one.
 */
export function estimate(
  minutes: number,
  hours: number,
  prices: Pricing = pricing,
): Estimate {
  const billableMinutes = Math.max(0, minutes - prices.freeMinutes);
  const delivery = Math.round(billableMinutes * prices.pricePerMinute);
  const storage = Math.round(hours * prices.pricePerStoredHour);
  const total = delivery + storage;
  const students = Math.max(1, Math.floor(minutes / prices.minutesPerStudent));
  return {
    billableMinutes,
    delivery,
    storage,
    total,
    students,
    perStudent: total / students,
    courses: Math.max(1, Math.floor(hours / prices.hoursPerCourse)),
  };
}

/**
 * Rounds to two significant figures, so every slider value is a round number.
 */
export function snap(value: number): number {
  if (value <= 0) return 0;
  const unit = 10 ** (Math.floor(Math.log10(value)) - 1);
  return Math.round(value / unit) * unit;
}

function clamp(value: number, range: SliderRange): number {
  return Math.min(range.max, Math.max(range.min, value));
}

/**
 * Value at a slider position (0 to `sliderSteps`, fractions allowed) on a log10 scale.
 */
export function valueAt(position: number, range: SliderRange): number {
  const ratio = Math.min(1, Math.max(0, position / sliderSteps));
  const low = Math.log10(range.min);
  const high = Math.log10(range.max);
  return clamp(snap(10 ** (low + ratio * (high - low))), range);
}

/**
 * Slider position (0 to `sliderSteps`) of a value; the inverse of `valueAt` before snapping.
 */
export function positionOf(value: number, range: SliderRange): number {
  const low = Math.log10(range.min);
  const high = Math.log10(range.max);
  return ((Math.log10(clamp(value, range)) - low) / (high - low)) * sliderSteps;
}

/**
 * Whole slider position of a value, as the native range input holds it.
 */
export function stepOf(value: number, range: SliderRange): number {
  return Math.round(positionOf(value, range));
}

/**
 * Value after the slider moves to `position`, starting from `current`.
 * Rule: a repeated event at the current whole position keeps the current value.
 * Rule: when snapping maps the new position back to the current value, keep stepping the same way,
 * so every arrow key press changes the value until the end of the range.
 */
export function stepTo(
  position: number,
  current: number,
  range: SliderRange,
): number {
  const direction = Math.sign(position - stepOf(current, range));
  if (direction === 0) return current;
  for (
    let next = position;
    next >= 0 && next <= sliderSteps;
    next += direction
  ) {
    const value = valueAt(next, range);
    if (value !== current) return value;
  }
  return current;
}

/**
 * Powers of ten from `min` to `max`, used as slider tick marks.
 */
export function ticks(range: SliderRange): number[] {
  const values: number[] = [];
  for (let value = range.min; value <= range.max; value *= 10) {
    values.push(value);
  }
  return values;
}

export function formatBrl(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatInteger(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export interface CountForms {
  one: string;
  other: string;
}

/**
 * Replaces `{name}` placeholders in a copy template.
 */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}

/**
 * Picks the singular or plural copy for `count` and fills `{count}` and any extra placeholders.
 */
export function fillCount(
  forms: CountForms,
  count: number,
  values: Record<string, string | number> = {},
): string {
  return fill(count === 1 ? forms.one : forms.other, {
    ...values,
    count: formatInteger(count),
  });
}
