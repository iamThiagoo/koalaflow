import { describe, expect, it } from 'vitest';
import { ConfigError, loadConfig } from './load-config.js';

const valid = {
  NODE_ENV: 'development',
  PORT: '3000',
  LOG_LEVEL: 'info',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_NAME: 'koalaflow',
  DB_USER: 'koalaflow',
  DB_PASSWORD: 's3cr3t-password-value',
  DB_SSL: 'false',
};

function errorOf(env: Record<string, string | undefined>): ConfigError {
  try {
    loadConfig(env);
  } catch (error) {
    if (error instanceof ConfigError) return error;
    throw error;
  }
  throw new Error('expected loadConfig to throw');
}

describe('loadConfig', () => {
  it('parses a valid environment', () => {
    expect(loadConfig(valid)).toEqual({
      nodeEnv: 'development',
      port: 3000,
      logLevel: 'info',
      database: {
        host: 'localhost',
        port: 5432,
        name: 'koalaflow',
        user: 'koalaflow',
        password: 's3cr3t-password-value',
        ssl: false,
      },
    });
  });

  it('applies defaults for port and log level', () => {
    const config = loadConfig({
      ...valid,
      PORT: undefined,
      LOG_LEVEL: undefined,
    });
    expect(config.port).toBe(3000);
    expect(config.logLevel).toBe('info');
  });

  it('ignores variables it does not declare', () => {
    expect(
      loadConfig({ ...valid, HOME: '/Users/someone', PATH: '/bin' }),
    ).not.toHaveProperty('HOME');
  });

  it('rejects a missing database host', () => {
    expect(errorOf({ ...valid, DB_HOST: undefined }).message).toContain(
      'DB_HOST',
    );
  });

  it.each(['70000', 'abc', '0'])('rejects port %s', (value) => {
    expect(errorOf({ ...valid, PORT: value }).message).toContain('PORT');
  });

  it('rejects an unknown log level', () => {
    expect(errorOf({ ...valid, LOG_LEVEL: 'verbose' }).message).toContain(
      'LOG_LEVEL',
    );
  });

  it('requires database TLS in production', () => {
    expect(errorOf({ ...valid, NODE_ENV: 'production' }).message).toContain(
      'DB_SSL',
    );
  });

  it('allows a database without TLS in development', () => {
    expect(loadConfig(valid).database.ssl).toBe(false);
  });

  it('never includes the provided values in the error', () => {
    const env = {
      ...valid,
      NODE_ENV: 'staging',
      PORT: 'port-value-xyz',
      DB_PASSWORD: '',
      DB_SSL: 'yes-tls',
    };
    const { message } = errorOf(env);

    expect(message).toContain('DB_PASSWORD');
    for (const value of [
      'staging',
      'port-value-xyz',
      'yes-tls',
      valid.DB_HOST,
      valid.DB_USER,
    ]) {
      expect(message).not.toContain(value);
    }
  });

  it('never includes the password when another variable is invalid', () => {
    expect(errorOf({ ...valid, DB_PORT: 'x' }).message).not.toContain(
      valid.DB_PASSWORD,
    );
  });

  it('returns a frozen configuration', () => {
    const config = loadConfig(valid);
    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.database)).toBe(true);
  });
});
