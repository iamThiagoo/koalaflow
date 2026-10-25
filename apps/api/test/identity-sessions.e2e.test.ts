import { MikroORM } from '@mikro-orm/postgresql';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  CapturedEmails,
  getSession,
  post,
  signIn,
  uniqueEmail,
  uniqueIp,
} from './support/auth.js';
import { startApp, type TestApp } from './support/start-app.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

let app: TestApp;
const emails = new CapturedEmails();

beforeAll(async () => {
  app = await startApp({ overrides: [emails.asOverride()] });
});

afterAll(() => app.close());

afterEach(() => {
  vi.useRealTimers();
});

describe('sessions', () => {
  it('uses UUIDs for the user and the active organization', async () => {
    const session = await getSession(app, await signIn(app, emails));

    expect(session?.user.id).toMatch(uuid);
    expect(session?.session.activeOrganizationId).toMatch(uuid);
  });

  it('treats a tampered token as no session', async () => {
    const cookie = await signIn(app, emails);
    const [name, value] = cookie.split('=');
    const tampered = `${name}=${value.at(0) === 'a' ? 'b' : 'a'}${value.slice(1)}`;

    expect(await getSession(app, tampered)).toBeNull();
  });

  it('expires a session 7 days after its last refresh', async () => {
    const cookie = await signIn(app, emails);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 8 * 24 * 60 * 60 * 1000);

    expect(await getSession(app, cookie)).toBeNull();
  });

  it('revokes the token on sign-out', async () => {
    const cookie = await signIn(app, emails);
    const response = await post(app, 'sign-out', {}, { cookie });

    expect(response.status).toBe(200);
    expect(await getSession(app, cookie)).toBeNull();
  });

  it('rejects a cross-origin sign-out and keeps the session', async () => {
    const cookie = await signIn(app, emails);
    const response = await post(
      app,
      'sign-out',
      {},
      { cookie, origin: 'https://evil.example' },
    );

    expect(response.status).toBe(403);
    expect(await getSession(app, cookie)).not.toBeNull();
  });
});

describe('auth routes outside the allowlist', () => {
  it.each([
    ['x-forwarded-proto', 'http://x/api/auth/ok#'],
    ['host', 'x/api/auth/ok?'],
  ])(
    'cannot be reached by rewriting the URL through %s',
    async (header, value) => {
      const response = await fetch(`${app.url}/api/auth/get-session`, {
        headers: { [header]: value, 'x-forwarded-for': uniqueIp() },
      });

      expect(await response.text()).not.toContain('"ok":true');
    },
  );

  it.each([
    [
      'sign-up/email',
      { email: uniqueEmail(), password: 'a-long-password-1', name: 'x' },
    ],
    ['update-user', { name: 'Renamed' }],
    ['organization/create', { name: 'Second', slug: 'second' }],
    ['organization/delete', {}],
    ['organization/invite-member', { email: uniqueEmail(), role: 'member' }],
  ])('answers 404 with the uniform body to POST %s', async (path, body) => {
    const cookie = await signIn(app, emails);
    const before = await getSession(app, cookie);
    const response = await post(app, path, body, {
      cookie,
      'x-forwarded-for': uniqueIp(),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      requestId: response.headers.get('x-request-id'),
    });

    const connection = app.get(MikroORM).em.getConnection();
    const [{ organizations }] = await connection.execute<
      { organizations: string }[]
    >(`select count(*) as organizations from member where "userId" = ?`, [
      before?.user.id,
    ]);
    expect(Number(organizations)).toBe(1);
    expect((await getSession(app, cookie))?.user).toEqual(before?.user);
  });
});
