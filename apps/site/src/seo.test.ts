import { describe, expect, it } from 'vitest';
import { buildHomeMetadata, buildSitemap } from '@/seo';

describe('buildHomeMetadata', () => {
  it('declares the canonical URL and Portuguese Open Graph locale', () => {
    const metadata = buildHomeMetadata('https://koalaflow.com');

    expect(metadata.alternates).toEqual({
      canonical: 'https://koalaflow.com/',
    });
    expect(metadata.openGraph).toMatchObject({
      url: 'https://koalaflow.com/',
      locale: 'pt_BR',
    });
  });

  it('declares no language alternates', () => {
    const metadata = buildHomeMetadata('https://koalaflow.com');

    expect(metadata.alternates).not.toHaveProperty('languages');
    expect(metadata.openGraph).not.toHaveProperty('alternateLocale');
  });

  it('builds every URL on a non-production origin', () => {
    const metadata = buildHomeMetadata('https://staging.koalaflow.com');

    expect(metadata.alternates?.canonical).toBe(
      'https://staging.koalaflow.com/',
    );
    expect(metadata.openGraph).toMatchObject({
      url: 'https://staging.koalaflow.com/',
    });
  });
});

describe('buildSitemap', () => {
  it('lists only the home page, without language alternates', () => {
    expect(buildSitemap('https://koalaflow.com')).toEqual([
      { url: 'https://koalaflow.com/' },
    ]);
  });

  it('does not list the not-found page', () => {
    const urls = buildSitemap('https://koalaflow.com').map(
      (entry) => entry.url,
    );

    expect(urls.some((url) => url.includes('404'))).toBe(false);
  });
});
