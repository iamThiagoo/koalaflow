import { EntityManager } from '@mikro-orm/postgresql';
import { type BeforeApplicationShutdown, Inject, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Redis } from 'ioredis';
import { GetOrCreateSessionOrganizationUseCase } from '../application/get-or-create-session-organization.use-case.js';
import { GetTenantUseCase } from '../application/get-tenant.use-case.js';
import { OrganizationRepository as OrganizationRepositoryPort } from '../domain/organization.repository.js';
import { UserRepository as UserRepositoryPort } from '../domain/user.repository.js';
import { AuthController } from './auth.controller.js';
import { createAuth } from './auth.js';
import { EmailSender } from './email.sender.js';
import { AUTH, type Auth } from './iauth.js';
import { OrganizationRepository } from './organization.repository.js';
import { SessionGuard } from './session.guard.js';
import { UserRepository } from './user.repository.js';

@Module({
  controllers: [AuthController],
  providers: [
    EmailSender,
    {
      provide: OrganizationRepositoryPort,
      useClass: OrganizationRepository,
    },
    { provide: UserRepositoryPort, useClass: UserRepository },
    GetOrCreateSessionOrganizationUseCase,
    GetTenantUseCase,
    {
      provide: AUTH,
      useFactory: createAuth,
      inject: [
        EntityManager,
        Redis,
        EmailSender,
        GetOrCreateSessionOrganizationUseCase,
      ],
    },
    { provide: APP_GUARD, useClass: SessionGuard },
  ],
})
export class AuthModule implements BeforeApplicationShutdown {
  constructor(@Inject(AUTH) private readonly auth: Auth) {}

  async beforeApplicationShutdown(): Promise<void> {
    await (await this.auth.$context).checkSchema?.()?.catch(() => undefined);
  }
}
