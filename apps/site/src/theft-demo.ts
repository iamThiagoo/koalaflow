/**
 * Rules of the "tenta roubar" demo: a browser-only simulation of a copied signed video link.
 * Rule: nothing here talks to the real playback context; it only mirrors its two refusals.
 */

/**
 * Rule: the protection headline and the demo countdown both read this value, so they never disagree.
 */
export const linkLifetimeMinutes = 5;
export const linkLifetimeMs = linkLifetimeMinutes * 60_000;

export function formatMinutes(minutes: number): string {
  return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
}

export function remainingMs(
  issuedAt: number,
  now: number,
  lifetimeMs: number = linkLifetimeMs,
): number {
  return Math.min(lifetimeMs, Math.max(0, lifetimeMs - (now - issuedAt)));
}

/**
 * Rule: seconds round up, so a fresh link shows the full lifetime and only an expired one shows 00:00.
 */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export type PlaybackOutcome = 'plays' | 'blocked-domain' | 'expired';

/**
 * Rule: the domain is checked first; the embed refuses an unauthorized site before the link is ever used.
 * Rule: a link expires at exactly its full lifetime.
 */
export function playbackOutcome({
  host,
  authorizedHost,
  remainingMs,
}: {
  host: string;
  authorizedHost: string;
  remainingMs: number;
}): PlaybackOutcome {
  if (host !== authorizedHost) return 'blocked-domain';
  if (remainingMs <= 0) return 'expired';
  return 'plays';
}

/**
 * Where the visitor is looking: the authorized site's own player, or the copied link opened
 * on another site or back on the authorized one.
 */
export type DemoScene = 'original' | 'elsewhere' | 'reopened';

export interface DemoState {
  scene: DemoScene;
  issuedAt: number;
  skippedMs: number;
  linkId: number;
}

export type DemoAction =
  | { type: 'paste-elsewhere' }
  | { type: 'open-authorized' }
  | { type: 'skip-to-expiry' }
  | { type: 'restart'; now: number };

export function initialDemoState(now: number): DemoState {
  return { scene: 'original', issuedAt: now, skippedMs: 0, linkId: 1 };
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'paste-elsewhere':
      return { ...state, scene: 'elsewhere' };
    case 'open-authorized':
      return { ...state, scene: 'reopened' };
    case 'skip-to-expiry':
      return { ...state, skippedMs: linkLifetimeMs };
    case 'restart':
      return {
        scene: 'original',
        issuedAt: action.now,
        skippedMs: 0,
        linkId: state.linkId + 1,
      };
  }
}

export function linkRemainingMs(state: DemoState, now: number): number {
  return remainingMs(state.issuedAt, now + state.skippedMs);
}

/**
 * Outcome of the copied link in the current scene; null while the visitor is still on the
 * authorized site's own player.
 */
export function copiedLinkOutcome(
  state: DemoState,
  now: number,
  hosts: { authorizedHost: string; otherHost: string },
): PlaybackOutcome | null {
  if (state.scene === 'original') return null;
  return playbackOutcome({
    host: state.scene === 'elsewhere' ? hosts.otherHost : hosts.authorizedHost,
    authorizedHost: hosts.authorizedHost,
    remainingMs: linkRemainingMs(state, now),
  });
}

/**
 * A CloudFront-style signed URL for display only; the signature is a stable hash, not a real one.
 */
export function signedLinkUrl(state: DemoState): string {
  const expires = Math.floor((state.issuedAt + linkLifetimeMs) / 1000);
  let hash = 0x811c9dc5;
  for (const char of `${state.linkId}:${expires}`) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193) >>> 0;
  }
  const signature = hash.toString(16).padStart(8, '0').toUpperCase();
  return `https://cdn.koalaflow.com/v/aula-07/master.m3u8?Expires=${expires}&Signature=${signature}`;
}
