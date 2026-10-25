import { createHmac } from 'node:crypto';
import { Redis } from 'ioredis';
import { afterAll, beforeAll, expect, it } from 'vitest';
import {
  CapturedEmails,
  requestCode,
  uniqueEmail,
  uniqueIp,
} from './support/auth.js';
import { startApp, type TestApp } from './support/start-app.js';

let app: TestApp;
const emails = new CapturedEmails();

/**
 * The test client connects from loopback, which plays the trusted proxy that appends the client address.
 */
beforeAll(async () => {
  app = await startApp({
    env: { TRUSTED_PROXIES: '127.0.0.1/32,::1/128' },
    overrides: [emails.asOverride()],
  });
});

afterAll(() => app.close());

it('answers 429 to a fourth code request from one IP within a minute', async () => {
  const ip = uniqueIp();
  const statuses: number[] = [];
  for (let i = 0; i < 4; i++)
    statuses.push((await requestCode(app, uniqueEmail(), ip)).status);

  expect(statuses).toEqual([200, 200, 200, 429]);
});

it('stops emailing one address after five codes an hour, with the normal response', async () => {
  const email = uniqueEmail();
  const responses: string[] = [];
  for (let i = 0; i < 6; i++) {
    const response = await requestCode(app, email, uniqueIp());
    responses.push(`${response.status} ${await response.text()}`);
  }

  expect(new Set(responses).size).toBe(1);
  expect(responses[0]).toMatch(/^200 /);
  expect(emails.codesFor(email)).toHaveLength(5);
});

it('keeps the limit when the client forges an X-Forwarded-For prefix', async () => {
  const ip = uniqueIp();
  for (let i = 0; i < 3; i++) await requestCode(app, uniqueEmail(), ip);

  const forged = await requestCode(app, uniqueEmail(), `203.0.113.7, ${ip}`);
  expect(forged.status).toBe(429);
});

it('does not keep the email in the Redis key of the cap', async () => {
  const email = uniqueEmail();
  await requestCode(app, email, uniqueIp());
  const keys = await app.get(Redis).keys('identity:otp-sends:*');
  const hashed = createHmac('sha256', process.env.BETTER_AUTH_SECRET ?? '')
    .update(email)
    .digest('hex');

  expect(keys).toContain(`identity:otp-sends:${hashed}`);
  expect(keys.join()).not.toContain(email);
});
