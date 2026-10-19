import { describe, expect, it } from 'vitest';
import { resolveHref } from '@/links';

const context = {
  config: {
    appUrl: 'https://app.staging.koalaflow.com',
    salesContactUrl: 'mailto:sales@koalaflow.com',
  },
  supportEmail: 'suporte@koalaflow.com',
};

describe('resolveHref', () => {
  it('points app links to the configured app URL', () => {
    expect(resolveHref('app', context)).toBe(
      'https://app.staging.koalaflow.com',
    );
  });

  it('points sales links to the configured sales contact', () => {
    expect(resolveHref('sales', context)).toBe('mailto:sales@koalaflow.com');
  });

  it('opens the support mailbox for support links', () => {
    expect(resolveHref('support', context)).toBe(
      'mailto:suporte@koalaflow.com',
    );
  });

  it('keeps in-page anchors relative', () => {
    expect(resolveHref('#como-funciona', context)).toBe('#como-funciona');
  });
});
