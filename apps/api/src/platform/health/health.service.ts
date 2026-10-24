import { MikroORM } from '@mikro-orm/postgresql';
import { Injectable, Logger } from '@nestjs/common';

const readinessTimeoutMs = 2000;

type CheckStatus = 'up' | 'down';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly orm: MikroORM) {}

  async checkDatabase(): Promise<CheckStatus> {
    let timer: NodeJS.Timeout | undefined;

    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error('database check timed out')),
        readinessTimeoutMs,
      );
    });

    try {
      await Promise.race([
        this.orm.em.getConnection().execute('select 1'),
        timeout,
      ]);

      return 'up';
    } catch (error) {
      this.logger.warn({ err: error }, 'database readiness check failed');
      return 'down';
    } finally {
      clearTimeout(timer);
    }
  }
}
