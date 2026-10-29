import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { AbstractOrganizationRepository } from '../domain/AbstractOrganization.Repository.js';

/**
 * Rule: reads and writes Better Auth's tables with raw SQL on MikroORM's connection; they have no entity.
 */
@Injectable()
export class OrganizationRepository extends AbstractOrganizationRepository {
  constructor(private readonly em: EntityManager) {
    super();
  }

  async findMemberRole(
    organizationId: string,
    userId: string,
  ): Promise<string | null> {
    const [member] = await this.em
      .getConnection()
      .execute<{ role: string }[]>(
        `select role from member where "userId" = ? and "organizationId"::text = ?`,
        [userId, organizationId],
      );

    return member?.role ?? null;
  }

  async findOldestOrganizationId(userId: string): Promise<string | null> {
    const [member] = await this.em
      .getConnection()
      .execute<{ organizationId: string }[]>(
        `select "organizationId" from member where "userId" = ? order by "createdAt" limit 1`,
        [userId],
      );

    return member?.organizationId ?? null;
  }

  async createWithOwner(name: string, ownerId: string): Promise<string> {
    const [organization] = await this.em
      .getConnection()
      .execute<{ id: string }[]>(
        `with created as (
         insert into organization (name, slug, "createdAt")
         values (?, gen_random_uuid()::text, now()) returning id
       ), owner as (
         insert into member ("organizationId", "userId", role, "createdAt")
         select id, ?, 'owner', now() from created
       )
       select id from created`,
        [name, ownerId],
      );

    return organization.id;
  }
}
