import { describe, expect, it } from 'vitest';
import type { OrganizationRepository } from '../domain/organization.repository.js';
import type { User, UserRepository } from '../domain/user.repository.js';
import { GetOrCreateSessionOrganizationUseCase } from './get-or-create-session-organization.use-case.js';

function setup(existing: string | null, user: User | null) {
  const created: { name: string; ownerId: string }[] = [];
  const organizations: OrganizationRepository = {
    findMemberRole: async () => null,
    findOldestOrganizationId: async () => existing,
    createWithOwner: async (name, ownerId) => {
      created.push({ name, ownerId });
      return 'org-new';
    },
  };
  const users: UserRepository = { findById: async () => user };
  const useCase = new GetOrCreateSessionOrganizationUseCase(
    organizations,
    users,
  );
  return { useCase, created };
}

describe('GetOrCreateSessionOrganizationUseCase', () => {
  it('returns the oldest membership without creating an organization', async () => {
    const { useCase, created } = setup('org-1', {
      name: 'Ana',
      email: 'ana@example.com',
    });

    await expect(useCase.execute('user-1')).resolves.toBe('org-1');
    expect(created).toEqual([]);
  });

  it.each([
    [{ name: 'Ana', email: 'ana@example.com' }, 'Ana'],
    [{ name: '', email: 'ana.silva@example.com' }, 'ana.silva'],
  ])(
    'creates a personal organization owned by the user',
    async (user, name) => {
      const { useCase, created } = setup(null, user);

      await expect(useCase.execute('user-1')).resolves.toBe('org-new');
      expect(created).toEqual([{ name, ownerId: 'user-1' }]);
    },
  );

  it('fails for an unknown user', async () => {
    const { useCase, created } = setup(null, null);

    await expect(useCase.execute('user-1')).rejects.toThrow();
    expect(created).toEqual([]);
  });
});
