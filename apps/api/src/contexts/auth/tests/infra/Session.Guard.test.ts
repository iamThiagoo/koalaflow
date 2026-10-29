import {
  type ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GetTenantUseCase } from '../../application/GetTenant.UseCase.js';
import type { Auth } from '../../infra/IAuth.js';
import { SessionGuard } from '../../infra/Session.Guard.js';

const appOrigin = 'http://localhost:3001';
const session = {
  user: { id: 'user-1' },
  session: { activeOrganizationId: 'org-1' },
};
const tenant = { userId: 'user-1', organizationId: 'org-1', role: 'owner' };

function contextFor(req: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe('SessionGuard', () => {
  let isPublic: boolean;
  let currentSession: typeof session | null;
  let resolved: typeof tenant | null;
  let guard: SessionGuard;

  beforeEach(() => {
    vi.stubEnv('BETTER_AUTH_URL', appOrigin);
    isPublic = false;
    currentSession = session;
    resolved = tenant;
    guard = new SessionGuard(
      { getAllAndOverride: () => isPublic } as unknown as Reflector,
      { api: { getSession: async () => currentSession } } as unknown as Auth,
      { execute: async () => resolved } as unknown as GetTenantUseCase,
    );
  });

  it('lets public routes through without a session', async () => {
    isPublic = true;
    currentSession = null;

    await expect(guard.canActivate(contextFor({ headers: {} }))).resolves.toBe(
      true,
    );
  });

  it('rejects a request without a session', async () => {
    currentSession = null;

    await expect(
      guard.canActivate(contextFor({ method: 'GET', headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it.each([
    ['POST', 'https://evil.example'],
    ['DELETE', undefined],
  ])('rejects %s from origin %s', async (method, origin) => {
    await expect(
      guard.canActivate(contextFor({ method, headers: { origin } })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a user who is no longer a member of the active organization', async () => {
    resolved = null;

    await expect(
      guard.canActivate(contextFor({ method: 'GET', headers: {} })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('attaches the tenant for a member, on reads and same-origin writes', async () => {
    for (const req of [
      { method: 'GET', headers: {} },
      { method: 'POST', headers: { origin: appOrigin } },
    ] as Record<string, unknown>[]) {
      await expect(guard.canActivate(contextFor(req))).resolves.toBe(true);
      expect(req.tenant).toEqual(tenant);
    }
  });
});
