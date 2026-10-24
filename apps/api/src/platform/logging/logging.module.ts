import { randomUUID } from 'node:crypto';
import { type DynamicModule, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import type { DestinationStream, LevelWithSilent } from 'pino';
import type { Options } from 'pino-http';

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Module({})
export class LoggingModule {
  static forRoot(stream?: DestinationStream): DynamicModule {
    const options: Options = {
      level: process.env.LOG_LEVEL ?? 'info',
      genReqId: (req, res) => {
        const incoming = req.headers['x-request-id'];
        const id =
          typeof incoming === 'string' && uuidPattern.test(incoming)
            ? incoming
            : randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
      },
      serializers: {
        req: (req: { id?: unknown; method?: string; url?: string }) => ({
          id: req.id,
          method: req.method,
          path: req.url?.split(/[?#]/, 1)[0],
        }),
        res: (res: { statusCode?: number }) => ({
          statusCode: res.statusCode,
        }),
      },
      redact: {
        paths: [
          'headers.authorization',
          'headers.cookie',
          'headers["x-api-key"]',
          'headers["set-cookie"]',
        ],
        censor: '[redacted]',
      },
      customLogLevel: (_req, res, err): LevelWithSilent => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    };

    return {
      module: LoggingModule,
      imports: [
        LoggerModule.forRoot({
          pinoHttp: stream ? [options, stream] : options,
        }),
      ],
    };
  }
}
