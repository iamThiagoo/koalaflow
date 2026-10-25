import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import { GetTenantUseCase } from '../application/get-tenant.use-case.js';
import type { TenantRequest } from './current-tenant.decorator.js';
import { AUTH, type Auth } from './iauth.js';
import { IS_PUBLIC } from './public.decorator.js';

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Rule: every route needs a session unless it is public; writes must come from the app origin (CSRF).
 * Rule: the tenant comes only from the session's active organization, re-checked against the membership on every request.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  private readonly appOrigin = new URL(process.env.BETTER_AUTH_URL ?? '')
    .origin;

  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTH) private readonly auth: Auth,
    private readonly getTenant: GetTenantUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request & TenantRequest>();

    const session = await this.auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      throw new UnauthorizedException();
    }

    if (
      unsafeMethods.has(req.method) &&
      req.headers.origin !== this.appOrigin
    ) {
      throw new ForbiddenException();
    }

    const tenant = await this.getTenant.execute(
      session.user.id,
      session.session.activeOrganizationId,
    );

    if (!tenant) throw new ForbiddenException();

    req.tenant = tenant;
    return true;
  }
}
