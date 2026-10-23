import { Writable } from 'node:stream';
import type { ModuleMetadata } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { loadConfig } from '../../src/platform/config/load-config.js';
import {
  appOptions,
  configureApp,
} from '../../src/platform/http/configure-app.js';

export type LogLine = Record<string, unknown> & { level: number; msg?: string };

export interface TestApp {
  url: string;
  logs: LogLine[];
  close(): Promise<void>;
}

/**
 * Database settings default to the compose stack and the CI service; DB_* variables override them.
 */
function testEnv(
  overrides: Record<string, string> = {},
): Record<string, string | undefined> {
  return {
    NODE_ENV: 'test',
    LOG_LEVEL: 'info',
    DB_HOST: process.env.DB_HOST ?? '127.0.0.1',
    DB_PORT: process.env.DB_PORT ?? '5432',
    DB_NAME: process.env.DB_NAME ?? 'koalaflow',
    DB_USER: process.env.DB_USER ?? 'koalaflow',
    DB_PASSWORD: process.env.DB_PASSWORD ?? 'koalaflow',
    DB_SSL: 'false',
    ...overrides,
  };
}

let started = false;

/**
 * Boots the real AppModule on a random port, capturing log lines in memory.
 * Rule: one app per test file; nestjs-pino keeps the first app's logger for the whole process.
 */
export async function startApp(
  options: {
    env?: Record<string, string>;
    imports?: ModuleMetadata['imports'];
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

  const config = loadConfig(testEnv(options.env));
  const moduleRef = await Test.createTestingModule({
    imports: [
      AppModule.forRoot(config, { logStream }),
      ...(options.imports ?? []),
    ],
  }).compile();
  const app =
    moduleRef.createNestApplication<NestExpressApplication>(appOptions);
  configureApp(app);
  await app.listen(0, '127.0.0.1');

  return { url: await app.getUrl(), logs, close: () => app.close() };
}
