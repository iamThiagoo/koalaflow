import { Controller, Delete, Get, Module, Post } from '@nestjs/common';
import type { TenantContext } from '../../src/contexts/auth/domain/TenantContext.js';
import { CurrentTenant } from '../../src/contexts/auth/infra/CurrentTenant.Decorator.js';

/**
 * A tenant-scoped route, closed like any route without @Public(); it echoes the tenant it received.
 */
@Controller('test-tenant')
class TenantRoutesController {
  @Get()
  read(@CurrentTenant() tenant: TenantContext) {
    return tenant;
  }

  @Post()
  write(@CurrentTenant() tenant: TenantContext) {
    return tenant;
  }

  @Delete()
  remove(@CurrentTenant() tenant: TenantContext) {
    return tenant;
  }
}

@Module({ controllers: [TenantRoutesController] })
export class TenantRoutesModule {}
