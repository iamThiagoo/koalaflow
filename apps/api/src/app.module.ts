import { type DynamicModule, Module } from '@nestjs/common';
import type { DestinationStream } from 'pino';
import type { AppConfig } from './platform/config/config.schema.js';
import { DatabaseModule } from './platform/database/database.module.js';
import { HealthModule } from './platform/health/health.module.js';
import { HttpModule } from './platform/http/http.module.js';
import { LoggingModule } from './platform/logging/logging.module.js';

export interface AppModuleOptions {
  logStream?: DestinationStream;
}

@Module({})
export class AppModule {
  static forRoot(
    config: AppConfig,
    options: AppModuleOptions = {},
  ): DynamicModule {
    return {
      module: AppModule,
      imports: [
        LoggingModule.forRoot(config, options.logStream),
        HttpModule,
        DatabaseModule.forRoot(config),
        HealthModule,
      ],
    };
  }
}
