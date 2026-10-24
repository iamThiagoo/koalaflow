import { afterAll, beforeAll, expect, it } from 'vitest';
import { requestLines } from './support/logs.js';
import { startApp, type TestApp } from './support/start-app.js';

let app: TestApp;

beforeAll(async () => {
  app = await startApp({ env: { LOG_LEVEL: 'warn' } });
});

afterAll(() => app.close());

it('does not log successful requests at warn level', async () => {
  const ok = await fetch(`${app.url}/api/health/live`);
  const notFound = await fetch(`${app.url}/api/does-not-exist`);
  await new Promise((resolve) => setTimeout(resolve, 50));

  expect(ok.status).toBe(200);
  expect(requestLines(app, ok.headers.get('x-request-id'))).toEqual([]);
  // A 404 is logged at warn, which proves this app's logger is the one being checked.
  expect(requestLines(app, notFound.headers.get('x-request-id'))).toHaveLength(
    1,
  );
});
