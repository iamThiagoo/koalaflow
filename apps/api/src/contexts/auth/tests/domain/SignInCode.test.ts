import { describe, expect, it } from 'vitest';
import { generateCode, normalizeCode } from '../../domain/sign-in-code.js';

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

describe('generateCode', () => {
  it('returns 6 symbols from the unambiguous alphabet', () => {
    for (let i = 0; i < 1000; i++) {
      expect(generateCode()).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);
    }
  });

  it('uses every symbol of the alphabet', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 10_000; i++)
      for (const c of generateCode()) seen.add(c);
    expect([...seen].sort().join('')).toBe(ALPHABET);
  });
});

describe('normalizeCode', () => {
  it('uppercases and removes hyphens and spaces', () => {
    expect(normalizeCode('k7q-m4x')).toBe('K7QM4X');
    expect(normalizeCode(' K7Q M4X ')).toBe('K7QM4X');
  });
});
