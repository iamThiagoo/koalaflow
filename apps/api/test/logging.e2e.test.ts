import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { requestLines, waitForLine } from './support/logs.js';
import { startApp, type TestApp } from './support/start-app.js';
import {
  internalErrorMessage,
  TestRoutesModule,
} from './support/test-routes.module.js';

const errorLevel = 50;

describe('at info level', () => {
  let app: TestApp;

  beforeAll(async () => {
    app = await startApp({ imports: [TestRoutesModule] });
  });

  afterAll(() => app.close());

  it('writes one structured line per request', async () => {
    const response = await fetch(`${app.url}/api/health/live`);
    const requestId = response.headers.get('x-request-id');
    const line = await waitForLine(app, requestId);

    expect(requestLines(app, requestId)).toHaveLength(1);
    expect(line).toMatchObject({
      req: { id: requestId, method: 'GET', path: '/api/health/live' },
      res: { statusCode: 200 },
    });
    expect(line.responseTime).toEqual(expect.any(Number));
  });

  it('never logs credentials or the query string', async () => {
    const response = await fetch(
      `${app.url}/api/health/live?signature=abc123&token=xyz`,
      {
        headers: {
          authorization: 'Bearer secret-token',
          cookie: 'session=secret-cookie',
        },
      },
    );
    const line = await waitForLine(app, response.headers.get('x-request-id'));
    const text = JSON.stringify(app.logs);

    expect(line.req).toEqual(
      expect.objectContaining({ path: '/api/health/live' }),
    );
    expect(text).not.toMatch(/abc123|xyz|secret-token|secret-cookie/);
  });

  it('logs an unexpected error with its stack and the request id', async () => {
    const response = await fetch(`${app.url}/api/test/internal-error`);
    const line = await waitForLine(app, response.headers.get('x-request-id'));

    expect(line.level).toBe(errorLevel);
    expect((line.err as { stack?: string }).stack).toContain(
      internalErrorMessage,
    );
  });

  it('logs a client error without a stack', async () => {
    const response = await fetch(`${app.url}/api/test/names`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'NOT VALID' }),
    });
    const line = await waitForLine(app, response.headers.get('x-request-id'));

    expect(response.status).toBe(400);
    expect(line.level).toBeLessThan(errorLevel);
    expect(line).not.toHaveProperty('err');
  });
});
