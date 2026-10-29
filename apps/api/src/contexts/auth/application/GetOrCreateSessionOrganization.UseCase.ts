import { Injectable } from '@nestjs/common';
import { AbstractOrganizationRepository } from '../domain/AbstractOrganization.Repository.js';
import { AbstractUserRepository } from '../domain/AbstractUser.Repository.js';

/**
 * Rule: every user belongs to an organization; the oldest membership is the one a new session starts in.
 * Rule: a user without one gets a personal organization with them as owner, named after them (or their email's local part).
 */
@Injectable()
export class GetOrCreateSessionOrganizationUseCase {
  constructor(
    private readonly organizations: AbstractOrganizationRepository,
    private readonly users: AbstractUserRepository,
  ) {}

  async execute(userId: string): Promise<string> {
    const organization =
      await this.organizations.findOldestOrganizationId(userId);

    if (organization) return organization;

    const user = await this.users.findById(userId);

    if (!user) throw new Error(`User ${userId} not found`);

    return this.organizations.createWithOwner(
      user.name || user.email.split('@')[0],
      userId,
    );
  }
}
