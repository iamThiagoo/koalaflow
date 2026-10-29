import { EntityManager } from '@mikro-orm/postgresql';
import { type BeforeApplicationShutdown, Inject, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Redis } from 'ioredis';
import { GetOrCreateSessionOrganizationUseCase } from '../application/GetOrCreateSessionOrganization.UseCase.js';
import { GetTenantUseCase } from '../application/GetTenant.UseCase.js';
import { AbstractOrganizationRepository } from '../domain/AbstractOrganization.Repository.js';
import { AbstractUserRepository } from '../domain/AbstractUser.Repository.js';
import { AuthController } from './Auth.Controller.js';
import { createAuth } from './Auth.Factory.js';
import { EmailSender } from './Email.Sender.js';
import { AUTH, type Auth } from './IAuth.js';
import { OrganizationRepository } from './Organization.Repository.js';
import { SessionGuard } from './Session.Guard.js';
import { UserRepository } from './User.Repository.js';

@Module({
  controllers: [AuthController],
  providers: [
    EmailSender,
    {
      provide: AbstractOrganizationRepository,
      useClass: OrganizationRepository,
    },
    { provide: AbstractUserRepository, useClass: UserRepository },
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
