import { describe, expect, it } from 'vitest';
import { type ContentLink, home } from '@/content/home';
import {
  formatCountdown,
  linkLifetimeMinutes,
  linkLifetimeMs,
} from '@/theft-demo';

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

  it('links the footer "Preços" item to the pricing section', () => {
    const links = home.footer.columns.flatMap(
      (column): ContentLink[] => column.links,
    );
    const prices = links.find((link) => link.label === 'Preços');
    expect(prices?.to).toBe(`#${home.pricing.anchor}`);
  });

  it('states the same link lifetime the demo counts down', () => {
    expect(home.protection.claim).toBe(`${linkLifetimeMinutes} minutos.`);
    expect(formatCountdown(linkLifetimeMs)).toBe(
      `${String(linkLifetimeMinutes).padStart(2, '0')}:00`,
    );
  });
});
