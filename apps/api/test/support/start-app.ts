import { Writable } from 'node:stream';
import type { ModuleMetadata } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from '../../src/App.Module.js';

export type LogLine = Record<string, unknown> & { level: number; msg?: string };

export interface TestApp {
  url: string;
  logs: LogLine[];
  get<T>(token: string | (abstract new (...args: never[]) => T)): T;
  close(): Promise<void>;
}

/**
 * Database and Redis settings default to the compose stack and the CI services; DB_* and REDIS_URL override them.
 */
function testEnv(
  overrides: Record<string, string> = {},
): Record<string, string> {
  return {
    NODE_ENV: 'test',
    LOG_LEVEL: 'info',
    DB_HOST: process.env.DB_HOST ?? '127.0.0.1',
    DB_PORT: process.env.DB_PORT ?? '5432',
    DB_NAME: process.env.DB_NAME ?? 'koalaflow',
    DB_USER: process.env.DB_USER ?? 'koalaflow',
    DB_PASSWORD: process.env.DB_PASSWORD ?? 'koalaflow',
    DB_SSL: 'false',
    REDIS_URL: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
    BETTER_AUTH_SECRET: 'test-secret-with-at-least-32-characters',
    BETTER_AUTH_URL: 'http://localhost:3001',
    ...overrides,
  };
}

let started = false;

/**
 * Boots the real AppModule on a random port, capturing log lines in memory.
 * Rule: one app per test file; nestjs-pino keeps the first app's logger for the whole process.
 * Rule: the app reads process.env, which Vitest keeps separate for each test file.
 */
export async function startApp(
  options: {
    env?: Record<string, string>;
    imports?: ModuleMetadata['imports'];
    overrides?: { provide: unknown; useValue: unknown }[];
  } = {},
): Promise<TestApp> {
  if (started)
    throw new Error('startApp can only be called once per test file');
  started = true;

  const logs: LogLine[] = [];
  const logStream = new Writable({
    write(chunk, _encoding, done) {
      for (const line of chunk.toString().split('\n')) {
        if (line) logs.push(JSON.parse(line));
      }
      done();
    },
  });

  Object.assign(process.env, testEnv(options.env));
  const builder = Test.createTestingModule({
    imports: [AppModule.forRoot({ logStream }), ...(options.imports ?? [])],
  });
  for (const { provide, useValue } of options.overrides ?? [])
    builder.overrideProvider(provide).useValue(useValue);
  const moduleRef = await builder.compile();
  /**
   * Rule: mirrors the app setup in src/main.ts; change both together.
   */
  const app = moduleRef.createNestApplication<NestExpressApplication>({
    bodyParser: false,
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
      },
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );
  await app.listen(0, '127.0.0.1');

  return {
    url: await app.getUrl(),
    logs,
    get: (token) => app.get(token),
    close: () => app.close(),
  };
}

export async function compileApp(env: Record<string, string>): Promise<void> {
  Object.assign(process.env, testEnv(env));
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule.forRoot()],
  }).compile();
  await moduleRef.close();
}
