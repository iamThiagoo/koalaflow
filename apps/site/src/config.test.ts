import { describe, expect, it } from 'vitest';
import { parseSiteConfig } from '@/config';

const env = {
  SITE_URL: 'https://koalaflow.com',
  APP_URL: 'https://app.koalaflow.com',
  SALES_CONTACT_URL: 'mailto:sales@koalaflow.com',
};

describe('parseSiteConfig', () => {
  it('reads every URL from the environment', () => {
    expect(parseSiteConfig(env)).toEqual({
      siteUrl: 'https://koalaflow.com',
      appUrl: 'https://app.koalaflow.com',
      salesContactUrl: 'mailto:sales@koalaflow.com',
    });
  });

  it('throws when a variable is unset', () => {
    const { APP_URL: _, ...rest } = env;

    expect(() => parseSiteConfig(rest)).toThrow('APP_URL is not set');
  });

  it('treats an empty variable as unset', () => {
    expect(() => parseSiteConfig({ ...env, SITE_URL: '  ' })).toThrow(
      'SITE_URL is not set',
    );
  });

  it('removes trailing slashes', () => {
    const config = parseSiteConfig({
      ...env,
      SITE_URL: 'https://koalaflow.com/',
      APP_URL: 'https://app.koalaflow.com//',
    });

    expect(config.siteUrl).toBe('https://koalaflow.com');
    expect(config.appUrl).toBe('https://app.koalaflow.com');
  });

  it('throws on an invalid URL', () => {
    expect(() =>
      parseSiteConfig({ ...env, SITE_URL: 'koalaflow.com' }),
    ).toThrow('SITE_URL is not a valid URL');
  });

  it('rejects a protocol that cannot be a link target', () => {
    expect(() =>
      parseSiteConfig({ ...env, APP_URL: 'mailto:a@b.com' }),
    ).toThrow('APP_URL must use https: or http:');
    expect(() =>
      parseSiteConfig({ ...env, SALES_CONTACT_URL: 'javascript:alert(1)' }),
    ).toThrow('SALES_CONTACT_URL must use');
  });
});
