import { fileURLToPath } from 'node:url';
import { Migrator } from '@mikro-orm/migrations';
import { defineConfig, type Options } from '@mikro-orm/postgresql';
import type { AppConfig } from '../config/config.schema.js';

const migrationsDir = fileURLToPath(new URL('./migrations', import.meta.url));

export function mikroOrmOptions(config: AppConfig): Options {
  return defineConfig({
    host: config.database.host,
    port: config.database.port,
    dbName: config.database.name,
    user: config.database.user,
    password: config.database.password,
    driverOptions: {
      ssl: config.database.ssl ? { rejectUnauthorized: true } : false,
      connectionTimeoutMillis: 2000,
    },
    entities: [],
    discovery: { warnWhenNoEntities: false },
    extensions: [Migrator],
    migrations: { path: migrationsDir, snapshot: false },
  });
}
