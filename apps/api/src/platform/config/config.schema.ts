import { z } from 'zod';

const port = z.coerce.number().int().min(1).max(65535);
const booleanString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const logLevels = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
] as const;

/**
 * Rule: variables the api does not declare are ignored.
 * Rule: production requires TLS to the database.
 */
export const configSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']),
    PORT: port.default(3000),
    LOG_LEVEL: z.enum(logLevels).default('info'),
    DB_HOST: z.string().min(1).max(255),
    DB_PORT: port,
    DB_NAME: z.string().min(1).max(63),
    DB_USER: z.string().min(1).max(63),
    DB_PASSWORD: z.string().min(1).max(1024),
    DB_SSL: booleanString,
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && !env.DB_SSL) {
      ctx.addIssue({
        code: 'custom',
        path: ['DB_SSL'],
        message: 'must be true in production',
      });
    }
  })
  .transform((env) => ({
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    database: {
      host: env.DB_HOST,
      port: env.DB_PORT,
      name: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      ssl: env.DB_SSL,
    },
  }));

export type AppConfig = z.output<typeof configSchema>;
