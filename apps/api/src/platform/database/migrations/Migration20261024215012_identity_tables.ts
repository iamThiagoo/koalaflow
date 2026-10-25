import { Migration } from '@mikro-orm/migrations';

/**
 * Rule: Better Auth's tables
 */
export class Migration20261024215012_identity_tables extends Migration {
  override name = 'Migration20261024215012_identity_tables';

  override up(): void {
    this.addSql(`
      create table "user" (
        "id" uuid default pg_catalog.gen_random_uuid() not null primary key,
        "name" text not null,
        "email" text not null unique,
        "emailVerified" boolean not null,
        "image" text,
        "createdAt" timestamptz default CURRENT_TIMESTAMP not null,
        "updatedAt" timestamptz default CURRENT_TIMESTAMP not null
      );
    `);

    this.addSql(`
      create table "session" (
        "id" uuid default pg_catalog.gen_random_uuid() not null primary key,
        "expiresAt" timestamptz not null,
        "token" text not null unique,
        "createdAt" timestamptz default CURRENT_TIMESTAMP not null,
        "updatedAt" timestamptz not null,
        "ipAddress" text,
        "userAgent" text,
        "userId" uuid not null references "user" ("id") on delete cascade,
        "activeOrganizationId" text
      );
    `);
    this.addSql(`create index "session_userId_idx" on "session" ("userId");`);

    this.addSql(`
      create table "account" (
        "id" uuid default pg_catalog.gen_random_uuid() not null primary key,
        "accountId" text not null,
        "providerId" text not null,
        "userId" uuid not null references "user" ("id") on delete cascade,
        "accessToken" text,
        "refreshToken" text,
        "idToken" text,
        "accessTokenExpiresAt" timestamptz,
        "refreshTokenExpiresAt" timestamptz,
        "scope" text,
        "password" text,
        "createdAt" timestamptz default CURRENT_TIMESTAMP not null,
        "updatedAt" timestamptz not null
      );
    `);
    this.addSql(`create index "account_userId_idx" on "account" ("userId");`);

    this.addSql(`
      create table "organization" (
        "id" uuid default pg_catalog.gen_random_uuid() not null primary key,
        "name" text not null,
        "slug" text not null unique,
        "logo" text,
        "createdAt" timestamptz not null,
        "metadata" text
      );
    `);

    this.addSql(`
      create table "member" (
        "id" uuid default pg_catalog.gen_random_uuid() not null primary key,
        "organizationId" uuid not null references "organization" ("id") on delete cascade,
        "userId" uuid not null references "user" ("id") on delete cascade,
        "role" text not null,
        "createdAt" timestamptz not null
      );
    `);
    this.addSql(
      `create index "member_organizationId_idx" on "member" ("organizationId");`,
    );
    this.addSql(`create index "member_userId_idx" on "member" ("userId");`);

    this.addSql(`
      create table "invitation" (
        "id" uuid default pg_catalog.gen_random_uuid() not null primary key,
        "organizationId" uuid not null references "organization" ("id") on delete cascade,
        "email" text not null,
        "role" text,
        "status" text not null,
        "expiresAt" timestamptz not null,
        "createdAt" timestamptz default CURRENT_TIMESTAMP not null,
        "inviterId" uuid not null references "user" ("id") on delete cascade
      );
    `);
    this.addSql(
      `create index "invitation_organizationId_idx" on "invitation" ("organizationId");`,
    );
    this.addSql(
      `create index "invitation_email_idx" on "invitation" ("email");`,
    );
  }

  override down(): void {
    this.addSql(
      `drop table "invitation", "member", "organization", "account", "session", "user";`,
    );
  }
}
