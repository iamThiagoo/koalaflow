import { afterAll, beforeAll, expect, it } from 'vitest';
import { post, uniqueIp } from './support/auth.js';
import { startApp, type TestApp } from './support/start-app.js';

let app: TestApp;

/**
 * Dummy credentials: these tests stop before Google is ever called.
 */
beforeAll(async () => {
  app = await startApp({
    env: {
      GOOGLE_CLIENT_ID: 'test-client',
      GOOGLE_CLIENT_SECRET: 'test-secret',
    },
  });
});

afterAll(() => app.close());

function startGoogle(callbackURL: string) {
  return post(
    app,
    'sign-in/social',
    { provider: 'google', callbackURL },
    { 'x-forwarded-for': uniqueIp() },
  );
}

it('returns the Google authorization URL', async () => {
  const response = await startGoogle('/');
  const { url } = (await response.json()) as { url: string };

  expect(response.status).toBe(200);
  expect(new URL(url).hostname).toBe('accounts.google.com');
});

it('rejects a callback URL outside the app', async () => {
  const response = await startGoogle('https://evil.example/');

  expect(response.status).toBe(403);
  expect(await response.text()).not.toContain('accounts.google.com');
});

it.each([
  ['missing', ''],
  ['forged', '&state=forged-state'],
])('creates no session from a callback with a %s state', async (_, state) => {
  const response = await fetch(
    `${app.url}/api/auth/callback/google?code=fake-code${state}`,
    { redirect: 'manual', headers: { 'x-forwarded-for': uniqueIp() } },
  );

  expect(response.status).toBe(302);
  expect(response.headers.get('location')).toMatch(/error=/);
  expect(
    response.headers
      .getSetCookie()
      .some(
        (c) =>
          c.startsWith('better-auth.session_token=') &&
          !c.includes('Max-Age=0'),
      ),
  ).toBe(false);
});
