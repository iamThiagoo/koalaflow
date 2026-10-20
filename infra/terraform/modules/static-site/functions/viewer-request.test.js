import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The deployed file is a plain script, so the test evaluates it the same way CloudFront does.
const source = readFileSync(
  new URL('./viewer-request.js', import.meta.url),
  'utf8',
);
const handler = new Function(`${source}\nreturn handler;`)();

function viewerRequest({ host = 'koalaflow.com', uri, querystring = {} }) {
  return {
    request: {
      method: 'GET',
      uri,
      querystring,
      headers: { host: { value: host } },
      cookies: {},
    },
  };
}

describe('viewer-request', () => {
  it('redirects the www host to the apex keeping path and query', () => {
    const result = handler(
      viewerRequest({
        host: 'www.koalaflow.com',
        uri: '/some/path/',
        querystring: { q: { value: '1' } },
      }),
    );

    expect(result.statusCode).toBe(301);
    expect(result.headers.location.value).toBe(
      'https://koalaflow.com/some/path/?q=1',
    );
  });

  it('serves index.html for the root path', () => {
    const result = handler(viewerRequest({ uri: '/' }));

    expect(result.statusCode).toBeUndefined();
    expect(result.uri).toBe('/index.html');
  });

  it("serves a directory path from that directory's index.html", () => {
    const result = handler(viewerRequest({ uri: '/about/' }));

    expect(result.uri).toBe('/about/index.html');
  });

  it('rewrites unsupported locale prefixes so storage answers not found', () => {
    expect(handler(viewerRequest({ uri: '/en/' })).uri).toBe('/en/index.html');
  });

  it('redirects a path without trailing slash keeping the query string', () => {
    const result = handler(
      viewerRequest({
        uri: '/some-page',
        querystring: {
          utm_source: { value: 'ads' },
          tag: {
            value: 'a',
            multiValue: [{ value: 'a' }, { value: 'b%20c' }],
          },
          flag: { value: '' },
        },
      }),
    );

    expect(result.statusCode).toBe(301);
    expect(result.headers.location.value).toBe(
      '/some-page/?utm_source=ads&tag=a&tag=b%20c&flag',
    );
  });

  it('passes file requests through untouched', () => {
    for (const uri of [
      '/robots.txt',
      '/_next/static/chunks/app.js',
      '/404.html',
    ]) {
      const event = viewerRequest({ uri });
      expect(handler(event)).toBe(event.request);
      expect(event.request.uri).toBe(uri);
    }
  });

  it('treats a dot in a parent directory as a page, not a file', () => {
    const result = handler(viewerRequest({ uri: '/v1.2/notes' }));

    expect(result.statusCode).toBe(301);
    expect(result.headers.location.value).toBe('/v1.2/notes/');
  });

  it('does not redirect the apex host', () => {
    const result = handler(viewerRequest({ uri: '/robots.txt' }));

    expect(result.statusCode).toBeUndefined();
  });
});
