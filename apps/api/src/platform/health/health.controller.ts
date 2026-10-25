import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../../identity/infrastructure/public.decorator.js';
import { HealthService } from './health.service.js';

/**
 * Rule: health endpoints are public and return only fixed statuses, never versions, hosts or errors.
 */
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready(@Res({ passthrough: true }) res: Response) {
    const [database, cache] = await Promise.all([
      this.health.checkDatabase(),
      this.health.checkRedis(),
    ]);

    const ok = database === 'up' && cache === 'up';

    if (!ok) res.status(HttpStatus.SERVICE_UNAVAILABLE);

    return { status: ok ? 'ok' : 'error', checks: { database, cache } };
  }
}
