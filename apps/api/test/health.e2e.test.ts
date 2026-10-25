import { afterAll, beforeAll, expect, it } from 'vitest';
import { startApp, type TestApp } from './support/start-app.js';

let app: TestApp;

beforeAll(async () => {
  app = await startApp();
});

afterAll(() => app.close());

it('reports liveness', async () => {
  const response = await fetch(`${app.url}/api/health/live`);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: 'ok' });
});

it('answers 404 to another method on liveness', async () => {
  const response = await fetch(`${app.url}/api/health/live`, {
    method: 'POST',
  });
  expect(response.status).toBe(404);
  expect(await response.json()).toMatchObject({
    statusCode: 404,
    error: 'Not Found',
  });
});

it('reports readiness with the database and Redis up', async () => {
  const response = await fetch(`${app.url}/api/health/ready`);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    status: 'ok',
    checks: { database: 'up', cache: 'up' },
  });
});
