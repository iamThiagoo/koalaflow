export abstract class OrganizationRepository {
  abstract findMemberRole(
    organizationId: string,
    userId: string,
  ): Promise<string | null>;

  abstract findOldestOrganizationId(userId: string): Promise<string | null>;
  abstract createWithOwner(name: string, ownerId: string): Promise<string>;
}
