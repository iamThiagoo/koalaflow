import { expect, it } from 'vitest';
import { compileApp } from './support/start-app.js';

const productionTls = {
  NODE_ENV: 'production',
  REDIS_URL: 'rediss://cache.internal:6379',
};

it.each([
  [
    'plain Redis',
    { ...productionTls, REDIS_URL: 'redis://cache.internal:6379' },
    'REDIS_URL',
    'cache.internal',
  ],
  [
    'a missing auth secret',
    { ...productionTls, BETTER_AUTH_SECRET: '' },
    'BETTER_AUTH_SECRET',
    undefined,
  ],
  [
    'a short auth secret',
    { ...productionTls, BETTER_AUTH_SECRET: 'short-secret-1234' },
    'BETTER_AUTH_SECRET',
    'short-secret-1234',
  ],
])(
  'refuses %s in production without printing the value',
  async (_, env, variable, value) => {
    const failure = await compileApp(env).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toContain(variable);
    if (value) expect((failure as Error).message).not.toContain(value);
  },
);
