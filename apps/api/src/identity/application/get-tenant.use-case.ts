import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from '../domain/organization.repository.js';
import type { TenantContext } from '../domain/tenant-context.js';

/**
 * Rule: the tenant is the session's active organization, and only while the user is still a member of it.
 */
@Injectable()
export class GetTenantUseCase {
  constructor(private readonly organizations: OrganizationRepository) {}

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
