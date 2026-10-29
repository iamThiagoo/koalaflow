import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
import { mikroOrmOptions } from './MikroOrm.Config.js';

@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      driver: PostgreSqlDriver,
      useFactory: mikroOrmOptions,
    }),
  ],
})
export class DatabaseModule {}
