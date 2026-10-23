import { Writable } from 'node:stream';
import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { logSerializers, redactedPaths } from './serializers.js';

describe('request path', () => {
  it.each([
    ['/api/health/live', '/api/health/live'],
    ['/api/health/live?signature=abc123&token=xyz', '/api/health/live'],
    ['/api/videos#fragment', '/api/videos'],
    ['/api/videos?', '/api/videos'],
  ])('maps %s to %s', (url, expected) => {
    expect(logSerializers.req({ url }).path).toBe(expected);
  });
});

describe('logSerializers', () => {
  it('keeps only id, method and path of a request', () => {
    const request = {
      id: 'request-id',
      method: 'GET',
      url: '/api/health/live?signature=abc123&token=xyz',
      headers: {
        authorization: 'Bearer secret-token',
        cookie: 'session=secret-cookie',
      },
      body: { password: 'secret-password' },
    };

    expect(logSerializers.req(request)).toEqual({
      id: 'request-id',
      method: 'GET',
      path: '/api/health/live',
    });
  });

  it('keeps only the status code of a response', () => {
    expect(
      logSerializers.res({
        statusCode: 200,
        headers: { 'set-cookie': 'session=secret' },
      } as never),
    ).toEqual({
      statusCode: 200,
    });
  });
});

describe('redactedPaths', () => {
  it('censors credentials added to a log call', () => {
    const lines: string[] = [];
    const stream = new Writable({
      write(chunk, _encoding, done) {
        lines.push(chunk.toString());
        done();
      },
    });
    const logger = pino(
      { redact: { paths: redactedPaths, censor: '[redacted]' } },
      stream,
    );

    logger.info(
      {
        headers: {
          authorization: 'Bearer secret-token',
          cookie: 'session=secret-cookie',
        },
      },
      'call',
    );

    expect(lines.join('')).not.toMatch(/secret-token|secret-cookie/);
  });
});
