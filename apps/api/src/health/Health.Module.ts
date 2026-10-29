import { Module } from '@nestjs/common';
import { HealthController } from './Health.Controller.js';
import { HealthService } from './Health.Service.js';

@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
