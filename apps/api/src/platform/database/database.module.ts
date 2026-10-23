import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { type DynamicModule, Module } from '@nestjs/common';
import type { AppConfig } from '../config/config.schema.js';
import { mikroOrmOptions } from './mikro-orm.options.js';

@Module({})
export class DatabaseModule {
  static forRoot(config: AppConfig): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        MikroOrmModule.forRootAsync({
          driver: PostgreSqlDriver,
          useFactory: () => mikroOrmOptions(config),
        }),
      ],
    };
  }
}
