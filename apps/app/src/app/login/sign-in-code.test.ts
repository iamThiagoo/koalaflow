import { describe, expect, it } from 'vitest';
import { formatCooldown, toCode } from './sign-in-code';

describe('toCode', () => {
  it('capitalizes and drops spaces and hyphens from a pasted code', () => {
    expect(toCode(' abc-d e f ')).toBe('ABCDEF');
  });

  it('keeps at most six characters', () => {
    expect(toCode('ABCDEFGH')).toBe('ABCDEF');
  });
});

describe('formatCooldown', () => {
  it('shows minutes and two-digit seconds', () => {
    expect(formatCooldown(60)).toBe('1:00');
    expect(formatCooldown(45)).toBe('0:45');
    expect(formatCooldown(5)).toBe('0:05');
  });
});
