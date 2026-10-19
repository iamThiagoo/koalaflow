import { describe, expect, it } from 'vitest';
import { parseSiteConfig } from '@/config';

describe('parseSiteConfig', () => {
  it('uses production defaults when variables are unset', () => {
    expect(parseSiteConfig({})).toEqual({
      siteUrl: 'https://koalaflow.com',
      appUrl: 'https://app.koalaflow.com',
      salesContactUrl: 'mailto:sales@koalaflow.com',
    });
  });

  it('treats empty variables as unset', () => {
    expect(parseSiteConfig({ SITE_URL: '  ', APP_URL: '' }).siteUrl).toBe(
      'https://koalaflow.com',
    );
  });

  it('uses a custom origin when provided', () => {
    const config = parseSiteConfig({
      SITE_URL: 'https://staging.koalaflow.com',
      APP_URL: 'https://app.staging.koalaflow.com',
      SALES_CONTACT_URL: 'https://koalaflow.com/contact',
    });

    expect(config).toEqual({
      siteUrl: 'https://staging.koalaflow.com',
      appUrl: 'https://app.staging.koalaflow.com',
      salesContactUrl: 'https://koalaflow.com/contact',
    });
  });

  it('removes trailing slashes', () => {
    const config = parseSiteConfig({
      SITE_URL: 'https://koalaflow.com/',
      APP_URL: 'https://app.koalaflow.com//',
    });

    expect(config.siteUrl).toBe('https://koalaflow.com');
    expect(config.appUrl).toBe('https://app.koalaflow.com');
  });

  it('throws on an invalid URL', () => {
    expect(() => parseSiteConfig({ SITE_URL: 'koalaflow.com' })).toThrow(
      'SITE_URL is not a valid URL',
    );
  });

  it('rejects a protocol that cannot be a link target', () => {
    expect(() => parseSiteConfig({ APP_URL: 'mailto:a@b.com' })).toThrow(
      'APP_URL must use https: or http:',
    );
    expect(() =>
      parseSiteConfig({ SALES_CONTACT_URL: 'javascript:alert(1)' }),
    ).toThrow('SALES_CONTACT_URL must use');
  });
});
