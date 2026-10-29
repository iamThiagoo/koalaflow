import { Injectable } from '@nestjs/common';
import { AbstractOrganizationRepository } from '../domain/AbstractOrganization.Repository.js';
import type { TenantContext } from '../domain/TenantContext.js';

/**
 * Rule: the tenant is the session's active organization, and only while the user is still a member of it.
 */
@Injectable()
export class GetTenantUseCase {
  constructor(private readonly organizations: AbstractOrganizationRepository) {}

  async execute(
    userId: string,
    activeOrganizationId: string | null | undefined,
  ): Promise<TenantContext | null> {
    if (!activeOrganizationId) return null;

    const role = await this.organizations.findMemberRole(
      activeOrganizationId,
      userId,
    );

    return role ? { userId, organizationId: activeOrganizationId, role } : null;
  }
}
