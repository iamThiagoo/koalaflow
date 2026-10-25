import { type DynamicModule, Module } from '@nestjs/common';
import type { DestinationStream } from 'pino';
import { IdentityModule } from './identity/infrastructure/identity.module.js';
import { DatabaseModule } from './platform/database/database.module.js';
import { HealthModule } from './platform/health/health.module.js';
import { HttpModule } from './platform/http/http.module.js';
import { LoggingModule } from './platform/logging/logging.module.js';
import { RedisModule } from './platform/redis/redis.module.js';

export interface AppModuleOptions {
  logStream?: DestinationStream;
}

@Module({})
export class AppModule {
  static forRoot(options: AppModuleOptions = {}): DynamicModule {
    return {
      module: AppModule,
      imports: [
        LoggingModule.forRoot(options.logStream),
        HttpModule,
        DatabaseModule,
        RedisModule,
        HealthModule,
        IdentityModule,
      ],
    };
  }
}
