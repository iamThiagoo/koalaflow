import { MikroORM } from '@mikro-orm/postgresql';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  appOrigin,
  CapturedEmails,
  getSession,
  signIn,
  uniqueEmail,
  uniqueIp,
} from './support/auth.js';
import { startApp, type TestApp } from './support/start-app.js';
import { TenantRoutesModule } from './support/tenant-routes.module.js';

let app: TestApp;
const emails = new CapturedEmails();

beforeAll(async () => {
  app = await startApp({
    imports: [TenantRoutesModule],
    overrides: [emails.asOverride()],
  });
});

afterAll(() => app.close());

function sql<T>(query: string, params: unknown[]): Promise<T[]> {
  return app.get(MikroORM).em.getConnection().execute<T[]>(query, params);
}

function tenantRoute(
  init: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
    query?: string;
  } = {},
): Promise<Response> {
  return fetch(`${app.url}/api/test-tenant${init.query ?? ''}`, {
    method: init.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': uniqueIp(),
      ...init.headers,
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

describe('personal organization', () => {
  it('creates one on first sign-in with the user as its only member and owner', async () => {
    const session = await getSession(app, await signIn(app, emails));
    const members = await sql<{ userId: string; role: string }>(
      `select "userId", role from member where "organizationId"::text = ?`,
      [session?.session.activeOrganizationId],
    );

    expect(members).toEqual([{ userId: session?.user.id, role: 'owner' }]);
  });

  it('reuses it on later sign-ins', async () => {
    const email = uniqueEmail();
    const first = await getSession(app, await signIn(app, emails, email));
    const second = await getSession(app, await signIn(app, emails, email));
    const memberships = await sql<{ count: string }>(
      `select count(*) from member where "userId" = ?`,
      [first?.user.id],
    );

    expect(second?.session.activeOrganizationId).toBe(
      first?.session.activeOrganizationId,
    );
    expect(Number(memberships[0].count)).toBe(1);
  });
});

describe('closed by default', () => {
  it('answers 401 with the uniform body without a session', async () => {
    const response = await tenantRoute();

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      statusCode: 401,
      error: 'Unauthorized',
      requestId: response.headers.get('x-request-id'),
    });
  });

  it('answers 401 to an invalid session token', async () => {
    const response = await tenantRoute({
      headers: { cookie: 'better-auth.session_token=forged.value' },
    });

    expect(response.status).toBe(401);
  });

  it('keeps health and get-session public', async () => {
    const ready = await fetch(`${app.url}/api/health/ready`);
    const session = await fetch(`${app.url}/api/auth/get-session`);

    expect(ready.status).not.toBe(401);
    expect(session.status).toBe(200);
  });
});

describe('writes', () => {
  it.each([
    ['POST', { origin: 'https://evil.example' }],
    ['DELETE', {}],
  ])(
    'answers 403 to %s from another or a missing origin',
    async (method, headers) => {
      const cookie = await signIn(app, emails);
      const response = await tenantRoute({
        method,
        headers: { cookie, ...headers },
      });

      expect(response.status).toBe(403);
    },
  );

  it('runs a write from the app origin', async () => {
    const cookie = await signIn(app, emails);
    const response = await tenantRoute({
      method: 'POST',
      headers: { cookie, origin: appOrigin },
      body: {},
    });

    expect(response.status).toBe(201);
  });
});

describe('tenant', () => {
  it('is the session organization with the user role', async () => {
    const cookie = await signIn(app, emails);
    const session = await getSession(app, cookie);
    const response = await tenantRoute({ headers: { cookie } });

    expect(await response.json()).toEqual({
      userId: session?.user.id,
      organizationId: session?.session.activeOrganizationId,
      role: 'owner',
    });
  });

  it('ignores another organization id in the query, body or headers', async () => {
    const cookie = await signIn(app, emails);
    const own = (await getSession(app, cookie))?.session.activeOrganizationId;
    const other = (await getSession(app, await signIn(app, emails)))?.session
      .activeOrganizationId;

    const response = await tenantRoute({
      method: 'POST',
      query: `?organizationId=${other}`,
      headers: { cookie, origin: appOrigin, 'x-organization-id': `${other}` },
      body: { organizationId: other },
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ organizationId: own });
  });

  it('is denied once the membership is removed during the session', async () => {
    const cookie = await signIn(app, emails);
    const session = await getSession(app, cookie);
    await sql(`delete from member where "userId" = ?`, [session?.user.id]);

    expect((await tenantRoute({ headers: { cookie } })).status).toBe(403);
  });
});
