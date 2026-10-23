import type { z } from 'zod';
import { type AppConfig, configSchema } from './config.schema.js';

export class ConfigError extends Error {
  override readonly name = 'ConfigError';
}

/**
 * Rule: configuration errors name the variable and the problem, never the value.
 */
function describe(issues: z.core.$ZodIssue[]): string {
  return issues
    .map((issue) => `${issue.path.join('.') || '(root)'} (${issue.code})`)
    .join(', ');
}

export function loadConfig(env: Record<string, string | undefined>): AppConfig {
  const result = configSchema.safeParse(env);
  if (!result.success) {
    throw new ConfigError(
      `Invalid configuration: ${describe(result.error.issues)}`,
    );
  }
  Object.freeze(result.data.database);
  return Object.freeze(result.data);
}
