import { randomInt } from 'node:crypto';

/**
 * Rule: codes use digits and uppercase letters without 0, O, 1, I and L, which read alike.
 */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const LENGTH = 6;

/**
 * Rule: each symbol is drawn with randomInt, which is uniform (no modulo bias).
 */
export function generateCode(): string {
  let code = '';
  for (let i = 0; i < LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

/**
 * Rule: codes are accepted in any letter case and with spaces or hyphens.
 */
export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, '');
}
