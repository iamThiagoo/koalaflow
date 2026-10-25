import { MikroORM } from '@mikro-orm/postgresql';
import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

const readinessTimeoutMs = 2000;

type CheckStatus = 'up' | 'down';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly orm: MikroORM,
    private readonly redis: Redis,
  ) {}

  checkDatabase(): Promise<CheckStatus> {
    return this.check('database', () =>
      this.orm.em.getConnection().execute('select 1'),
    );
  }

  checkRedis(): Promise<CheckStatus> {
    return this.check('redis', () => this.redis.ping());
  }

  private async check(
    name: string,
    probe: () => Promise<unknown>,
  ): Promise<CheckStatus> {
    let timer: NodeJS.Timeout | undefined;

    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`${name} check timed out`)),
        readinessTimeoutMs,
      );
    });

    try {
      await Promise.race([probe(), timeout]);

      return 'up';
    } catch (error) {
      this.logger.warn({ err: error }, `${name} readiness check failed`);
      return 'down';
    } finally {
      clearTimeout(timer);
    }
  }
}
