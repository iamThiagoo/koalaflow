import { describe, expect, it } from 'vitest';
import { home } from '@/content/home';

function emptyLeaves(value: unknown, path: string): string[] {
  if (typeof value === 'string') return value.trim() ? [] : [path];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      emptyLeaves(item, `${path}[${index}]`),
    );
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) =>
      emptyLeaves(item, path ? `${path}.${key}` : key),
    );
  }
  return [path];
}

describe('home content', () => {
  it('has no empty or non-string texts', () => {
    expect(emptyLeaves(home, '')).toEqual([]);
  });
});
