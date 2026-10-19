import { describe, expect, it } from 'vitest';
import {
  copiedLinkOutcome,
  demoReducer,
  formatCountdown,
  formatMinutes,
  initialDemoState,
  linkLifetimeMs,
  linkRemainingMs,
  playbackOutcome,
  signedLinkUrl,
} from '@/theft-demo';

const hosts = {
  authorizedHost: 'alunos.minhaescola.com',
  otherHost: 'cursinho-pirata.example',
};
const start = Date.UTC(2026, 9, 19, 12, 0, 0);

describe('playbackOutcome', () => {
  const authorized = hosts.authorizedHost;

  it('plays a valid link on the authorized site', () => {
    expect(
      playbackOutcome({
        host: authorized,
        authorizedHost: authorized,
        remainingMs: 1,
      }),
    ).toBe('plays');
  });

  it('blocks a valid link on another site', () => {
    expect(
      playbackOutcome({
        host: hosts.otherHost,
        authorizedHost: authorized,
        remainingMs: 60_000,
      }),
    ).toBe('blocked-domain');
  });

  it('refuses an expired link on the authorized site', () => {
    expect(
      playbackOutcome({
        host: authorized,
        authorizedHost: authorized,
        remainingMs: 0,
      }),
    ).toBe('expired');
  });

  it('reports the blocked domain when the link is also expired', () => {
    expect(
      playbackOutcome({
        host: hosts.otherHost,
        authorizedHost: authorized,
        remainingMs: 0,
      }),
    ).toBe('blocked-domain');
  });

  it('does not treat a subdomain of the authorized host as authorized', () => {
    expect(
      playbackOutcome({
        host: `evil.${authorized}`,
        authorizedHost: authorized,
        remainingMs: 60_000,
      }),
    ).toBe('blocked-domain');
  });
});

describe('formatCountdown', () => {
  it('shows the full lifetime for a fresh link', () => {
    expect(formatCountdown(linkLifetimeMs)).toBe('05:00');
  });

  it('counts down by elapsed seconds', () => {
    expect(formatCountdown(linkLifetimeMs - 65_000)).toBe('03:55');
  });

  it('rounds partial seconds up so 00:00 only means expired', () => {
    expect(formatCountdown(1)).toBe('00:01');
    expect(formatCountdown(0)).toBe('00:00');
  });

  it('never goes below zero', () => {
    expect(formatCountdown(-5_000)).toBe('00:00');
  });
});

describe('formatMinutes', () => {
  it('uses the plural for several minutes', () => {
    expect(formatMinutes(5)).toBe('5 minutos');
  });

  it('uses the singular for one minute', () => {
    expect(formatMinutes(1)).toBe('1 minuto');
  });
});

describe('demo flow', () => {
  it('starts on the authorized site with the full lifetime and no outcome yet', () => {
    const state = initialDemoState(start);
    expect(linkRemainingMs(state, start)).toBe(linkLifetimeMs);
    expect(copiedLinkOutcome(state, start, hosts)).toBeNull();
  });

  it('blocks the copied link pasted on another site', () => {
    const state = demoReducer(initialDemoState(start), {
      type: 'paste-elsewhere',
    });
    expect(copiedLinkOutcome(state, start + 10_000, hosts)).toBe(
      'blocked-domain',
    );
  });

  it('plays the copied link on the authorized site before it expires', () => {
    const state = demoReducer(initialDemoState(start), {
      type: 'open-authorized',
    });
    expect(copiedLinkOutcome(state, start + 10_000, hosts)).toBe('plays');
  });

  it('expires the link at exactly its full lifetime', () => {
    const state = demoReducer(initialDemoState(start), {
      type: 'open-authorized',
    });
    expect(copiedLinkOutcome(state, start + linkLifetimeMs - 1, hosts)).toBe(
      'plays',
    );
    expect(copiedLinkOutcome(state, start + linkLifetimeMs, hosts)).toBe(
      'expired',
    );
  });

  it('skipping to expiry zeroes the countdown and expires the link', () => {
    let state = demoReducer(initialDemoState(start), {
      type: 'skip-to-expiry',
    });
    expect(formatCountdown(linkRemainingMs(state, start + 3_000))).toBe(
      '00:00',
    );
    state = demoReducer(state, { type: 'open-authorized' });
    expect(copiedLinkOutcome(state, start + 3_000, hosts)).toBe('expired');
  });

  it('restarting issues a new link with the full lifetime on the authorized site', () => {
    const used = demoReducer(
      demoReducer(initialDemoState(start), { type: 'skip-to-expiry' }),
      { type: 'paste-elsewhere' },
    );
    const later = start + 90_000;
    const fresh = demoReducer(used, { type: 'restart', now: later });
    expect(fresh.scene).toBe('original');
    expect(linkRemainingMs(fresh, later)).toBe(linkLifetimeMs);
    expect(signedLinkUrl(fresh)).not.toBe(signedLinkUrl(used));
  });
});

describe('signedLinkUrl', () => {
  it('is stable for the same link and carries its expiry', () => {
    const state = initialDemoState(start);
    const url = signedLinkUrl(state);
    expect(url).toBe(signedLinkUrl(state));
    expect(url).toContain(`Expires=${(start + linkLifetimeMs) / 1000}`);
  });
});
