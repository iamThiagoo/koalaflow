import { describe, expect, it } from 'vitest';
import { resolveRequestId } from './request-id.js';

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('resolveRequestId', () => {
  it('generates an id when none is sent', () => {
    expect(resolveRequestId(undefined)).toMatch(uuid);
  });

  it('reuses a well-formed UUID', () => {
    const id = '0b6f3e52-8d0c-4c1f-9a51-1d2a3b4c5d6e';
    expect(resolveRequestId(id)).toBe(id);
  });

  it.each([
    ['line breaks', '0b6f3e52-8d0c-4c1f-9a51-1d2a3b4c5d6e\r\nlevel=fatal'],
    ['an over-long value', `${'a'.repeat(36)}${'b'.repeat(1000)}`],
    ['free text', 'my-request'],
    ['an empty value', ''],
  ])('replaces %s with a new id', (_, value) => {
    const id = resolveRequestId(value);
    expect(id).not.toBe(value);
    expect(id).toMatch(uuid);
  });

  it('replaces a repeated header with a new id', () => {
    expect(
      resolveRequestId(['0b6f3e52-8d0c-4c1f-9a51-1d2a3b4c5d6e', 'x']),
    ).toMatch(uuid);
  });
});
