import { type DynamicModule, Module } from '@nestjs/common';
import type { DestinationStream } from 'pino';
import { AuthModule } from './contexts/auth/infra/Auth.Module.js';
import { HealthModule } from './health/Health.Module.js';
import { RedisModule } from './infra/cache/Redis.Module.js';
import { DatabaseModule } from './infra/database/Database.Module.js';
import { HttpModule } from './infra/http/Http.Module.js';
import { LoggingModule } from './infra/logging/Logging.Module.js';

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
        AuthModule,
      ],
    };
  }
}
