import { MikroORM } from '@mikro-orm/postgresql';
import { Controller, Get, HttpStatus, Logger, Res } from '@nestjs/common';
import type { Response } from 'express';

const readinessTimeoutMs = 2000;

type CheckStatus = 'up' | 'down';

/**
 * Rule: health endpoints are public and return only fixed statuses, never versions, hosts or errors.
 */
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly orm: MikroORM) {}

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready(@Res({ passthrough: true }) res: Response) {
    const database = await this.checkDatabase();
    if (database === 'down') res.status(HttpStatus.SERVICE_UNAVAILABLE);
    return { status: database === 'up' ? 'ok' : 'error', checks: { database } };
  }

  private async checkDatabase(): Promise<CheckStatus> {
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
