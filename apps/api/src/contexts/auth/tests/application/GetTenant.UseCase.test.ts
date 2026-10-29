import { describe, expect, it } from 'vitest';
import { GetTenantUseCase } from '../../application/GetTenant.UseCase.js';
import type { AbstractOrganizationRepository } from '../../domain/AbstractOrganization.Repository.js';

const roles: Record<string, string> = { 'org-1:user-1': 'owner' };
const organizations: AbstractOrganizationRepository = {
  findMemberRole: async (organizationId, userId) =>
    roles[`${organizationId}:${userId}`] ?? null,
  findOldestOrganizationId: async () => null,
  createWithOwner: async () => 'org-new',
};
const useCase = new GetTenantUseCase(organizations);

describe('GetTenantUseCase', () => {
  it('returns the tenant of a member of the active organization', async () => {
    await expect(useCase.execute('user-1', 'org-1')).resolves.toEqual({
      userId: 'user-1',
      organizationId: 'org-1',
      role: 'owner',
    });
  });

  it.each([
    ['no active organization', 'user-1', null],
    ['an organization the user does not belong to', 'user-2', 'org-1'],
  ])('returns nothing for %s', async (_, userId, organizationId) => {
    await expect(useCase.execute(userId, organizationId)).resolves.toBeNull();
  });
});
