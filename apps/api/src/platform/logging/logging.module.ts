import { type DynamicModule, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import type { DestinationStream, LevelWithSilent } from 'pino';
import type { Options } from 'pino-http';
import type { AppConfig } from '../config/config.schema.js';
import { assignRequestId } from '../http/request-id.js';
import { logSerializers, redactedPaths } from './serializers.js';

@Module({})
export class LoggingModule {
  /**
   * @param stream destination for log lines; stdout when omitted (tests pass an in-memory stream).
   */
  static forRoot(config: AppConfig, stream?: DestinationStream): DynamicModule {
    const options: Options = {
      level: config.logLevel,
      genReqId: assignRequestId,
      serializers: logSerializers,
      redact: { paths: redactedPaths, censor: '[redacted]' },
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
