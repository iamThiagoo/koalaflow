import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ErrorBody } from '../src/platform/http/exception.filter.js';
import { startApp, type TestApp } from './support/start-app.js';
import {
  internalErrorMessage,
  TestRoutesModule,
} from './support/test-routes.module.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

let app: TestApp;

beforeAll(async () => {
  app = await startApp({ imports: [TestRoutesModule] });
});

afterAll(() => app.close());

function request(path: string, init?: RequestInit) {
  return fetch(`${app.url}${path}`, init);
}

function postJson(path: string, body: string) {
  return request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
}

async function expectUniformError(
  response: Response,
  statusCode: number,
): Promise<ErrorBody> {
  const body = (await response.json()) as ErrorBody;
  expect(response.status).toBe(statusCode);
  expect(Object.keys(body).sort()).toEqual(
    body.issues
      ? ['error', 'issues', 'message', 'requestId', 'statusCode']
      : ['error', 'message', 'requestId', 'statusCode'],
  );
  expect(body.statusCode).toBe(statusCode);
  expect(body.requestId).toBe(response.headers.get('x-request-id'));
  return body;
}

describe('request id', () => {
  it('generates one when the request has none', async () => {
    const response = await request('/api/health/live');
    expect(response.headers.get('x-request-id')).toMatch(uuid);
  });

  it('reuses a well-formed UUID', async () => {
    const id = '0b6f3e52-8d0c-4c1f-9a51-1d2a3b4c5d6e';
    const response = await request('/api/health/live', {
      headers: { 'x-request-id': id },
    });
    expect(response.headers.get('x-request-id')).toBe(id);
  });

  it('replaces a malformed id', async () => {
    const sent = `${'x'.repeat(40)}-not-a-uuid`;
    const response = await request('/api/health/live', {
      headers: { 'x-request-id': sent },
    });
    expect(response.headers.get('x-request-id')).not.toBe(sent);
    expect(response.headers.get('x-request-id')).toMatch(uuid);
  });
});

describe('errors', () => {
  it('answers an unknown route with 404', async () => {
    const body = await expectUniformError(
      await request('/api/does-not-exist'),
      404,
    );
    expect(body).toMatchObject({
      error: 'Not Found',
      message: 'Resource not found',
    });
  });

  it('hides unexpected errors behind a generic 500', async () => {
    const response = await request('/api/test/internal-error');
    const text = await response.clone().text();
    const body = await expectUniformError(response, 500);

    expect(body.message).toBe('Internal server error');
    expect(text).not.toMatch(
      /ECONNREFUSED|db-internal|admin|at \w+|\.ts:|\.js:/,
    );
    expect(text).not.toContain(internalErrorMessage);
  });
});

describe('request bodies', () => {
  it('rejects malformed JSON without parser details', async () => {
    const response = await postJson(
      '/api/test/names',
      '{"name": "unterminated',
    );
    const text = await response.clone().text();
    const body = await expectUniformError(response, 400);

    expect(body.message).toBe('Malformed request body');
    expect(text).not.toMatch(
      /SyntaxError|JSON at position|unterminated|body-parser/i,
    );
  });

  it('rejects a body over 1 MB with 413', async () => {
    const response = await postJson(
      '/api/test/names',
      JSON.stringify({ name: 'a'.repeat(1024 * 1024) }),
    );
    const body = await expectUniformError(response, 413);
    expect(body.message).toBe('Request body too large');
  });
});

describe('validation', () => {
  it('accepts a valid body', async () => {
    const response = await postJson(
      '/api/test/names',
      JSON.stringify({ name: 'my-video' }),
    );
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ name: 'my-video' });
  });

  it('rejects an unknown field by path', async () => {
    const body = await expectUniformError(
      await postJson(
        '/api/test/names',
        JSON.stringify({ name: 'ok', isAdmin: true }),
      ),
      400,
    );
    expect(body.issues).toEqual([
      { path: 'isAdmin', code: 'unrecognized_keys' },
    ]);
  });

  it.each(['../../etc/passwd', 'a'.repeat(10_000)])(
    'does not echo the invalid value %#',
    async (value) => {
      const response = await postJson(
        '/api/test/names',
        JSON.stringify({ name: value }),
      );
      const text = await response.clone().text();
      const body = await expectUniformError(response, 400);

      expect(body.issues).toEqual([{ path: 'name', code: 'invalid_format' }]);
      expect(text).not.toContain(value.slice(0, 16));
    },
  );
});

describe('security headers', () => {
  it.each([
    ['a successful response', '/api/health/live', 200],
    ['an error response', '/api/does-not-exist', 404],
  ])('are sent on %s', async (_, path, status) => {
    const response = await request(path);

    expect(response.status).toBe(status);
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('strict-transport-security')).toMatch(
      /max-age=\d+/,
    );
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
    expect(response.headers.get('content-security-policy')).toBe(
      "default-src 'none';frame-ancestors 'none'",
    );
    expect(response.headers.has('x-powered-by')).toBe(false);
  });
});

describe('cross-origin', () => {
  it('does not allow a foreign origin', async () => {
    const response = await request('/api/health/live', {
      method: 'OPTIONS',
      headers: {
        origin: 'https://evil.example',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type',
      },
    });
    expect(response.headers.has('access-control-allow-origin')).toBe(false);
  });
});
