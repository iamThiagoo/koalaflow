import { afterAll, beforeAll, expect, it } from 'vitest';
import { startApp, type TestApp } from './support/start-app.js';

let app: TestApp;

beforeAll(async () => {
  app = await startApp({ env: { DB_PASSWORD: 'wrong-password' } });
});

afterAll(() => app.close());

it('discloses only the status and keeps the reason in the server log', async () => {
  const response = await fetch(`${app.url}/api/health/ready`);
  const text = await response.text();

  expect(response.status).toBe(503);
  expect(JSON.parse(text)).toEqual({
    status: 'error',
    checks: { database: 'down' },
  });
  expect(text).not.toMatch(
    /password|authentication|127\.0\.0\.1|postgres|version/i,
  );
  expect(JSON.stringify(app.logs)).toMatch(/password authentication failed/);
});
