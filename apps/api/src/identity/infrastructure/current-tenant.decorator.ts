import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { TenantContext } from '../domain/tenant-context.js';

export type TenantRequest = { tenant?: TenantContext };

export const CurrentTenant = createParamDecorator(
  (_: unknown, context: ExecutionContext): TenantContext | undefined =>
    context.switchToHttp().getRequest<TenantRequest>().tenant,
);
