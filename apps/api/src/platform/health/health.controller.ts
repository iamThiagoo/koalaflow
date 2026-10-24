import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { HealthService } from './health.service.js';

/**
 * Rule: health endpoints are public and return only fixed statuses, never versions, hosts or errors.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready(@Res({ passthrough: true }) res: Response) {
    const database = await this.health.checkDatabase();
    if (database === 'down') res.status(HttpStatus.SERVICE_UNAVAILABLE);
    return { status: database === 'up' ? 'ok' : 'error', checks: { database } };
  }
}
