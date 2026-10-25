import { fileURLToPath } from 'node:url';
import { Migrator } from '@mikro-orm/migrations';
import { defineConfig, type Options } from '@mikro-orm/postgresql';

export function mikroOrmOptions(): Options {
  return defineConfig({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dbName: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    driverOptions: {
      ssl:
        process.env.DB_SSL !== 'false' ? { rejectUnauthorized: true } : false,
      connectionTimeoutMillis: 2000,
    },
    entities: [],
    discovery: { warnWhenNoEntities: false },
    schemaGenerator: {
      skipTables: [
        'user',
        'session',
        'account',
        'organization',
        'member',
        'invitation',
      ],
    },
    extensions: [Migrator],
    migrations: {
      path: fileURLToPath(new URL('./migrations', import.meta.url)),
      snapshot: false,
    },
  });
}

export default mikroOrmOptions;
