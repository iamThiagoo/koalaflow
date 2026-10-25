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
  requestCode,
  sessionCookie,
  signIn,
  signInWithCode,
  uniqueEmail,
  uniqueIp,
} from './support/auth.js';
import { startApp, type TestApp } from './support/start-app.js';

const alphabet = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;

let app: TestApp;
const emails = new CapturedEmails();

beforeAll(async () => {
  app = await startApp({ overrides: [emails.asOverride()] });
});

afterAll(() => app.close());

afterEach(() => {
  vi.useRealTimers();
});

describe('requesting a code', () => {
  it('answers known and unknown emails identically and sends a code to both', async () => {
    const known = uniqueEmail();
    await signIn(app, emails, known);
    const unknown = uniqueEmail();

    const knownResponse = await requestCode(app, known, uniqueIp());
    const unknownResponse = await requestCode(app, unknown, uniqueIp());

    expect(knownResponse.status).toBe(200);
    expect(unknownResponse.status).toBe(knownResponse.status);
    expect(await unknownResponse.text()).toBe(await knownResponse.text());
    expect(emails.lastCode(known)).toMatch(alphabet);
    expect(emails.lastCode(unknown)).toMatch(alphabet);
  });

  it.each([['not-an-email'], [`${'a'.repeat(243)}@example.com`]])(
    'rejects the malformed email %#',
    async (email) => {
      const response = await requestCode(app, email, uniqueIp());

      expect(response.status).toBe(400);
      expect(emails.codesFor(email)).toEqual([]);
    },
  );

  it('never returns the code', async () => {
    const email = uniqueEmail();
    const response = await requestCode(app, email, uniqueIp());
    const text =
      JSON.stringify([...response.headers]) + (await response.text());

    expect(text).not.toContain(emails.lastCode(email));
  });

  it('invalidates the previous code when a new one is requested', async () => {
    const email = uniqueEmail();
    const ip = uniqueIp();
    await requestCode(app, email, ip);
    const first = emails.lastCode(email);
    await requestCode(app, email, uniqueIp());
    const second = emails.lastCode(email);

    expect((await signInWithCode(app, email, first, ip)).status).toBe(400);
    expect((await signInWithCode(app, email, second, uniqueIp())).status).toBe(
      200,
    );
  });
});

describe('signing in with a code', () => {
  it('creates a verified user on first sign-in and sets the session cookie', async () => {
    const email = uniqueEmail();
    const ip = uniqueIp();
    await requestCode(app, email, ip);
    const response = await signInWithCode(
      app,
      email,
      emails.lastCode(email),
      ip,
    );

    expect(response.status).toBe(200);
    const [setCookie] = response.headers
      .getSetCookie()
      .filter((c) => c.startsWith('better-auth.session_token='));
    expect(setCookie).toMatch(/; HttpOnly/i);
    expect(setCookie).toMatch(/; SameSite=Lax/i);
    expect(setCookie).not.toMatch(/; Domain=/i);

    const session = await getSession(app, sessionCookie(response) ?? '');
    expect(session?.user).toMatchObject({ email, emailVerified: true });
  });

  it('accepts the code in lowercase with a hyphen', async () => {
    const email = uniqueEmail();
    const ip = uniqueIp();
    await requestCode(app, email, ip);
    const code = emails.lastCode(email);
    const loose = `${code.slice(0, 3)}-${code.slice(3)}`.toLowerCase();

    expect((await signInWithCode(app, email, loose, ip)).status).toBe(200);
  });

  it('rejects a wrong code without a cookie or a user', async () => {
    const email = uniqueEmail();
    const ip = uniqueIp();
    await requestCode(app, email, ip);
    const wrong = emails.lastCode(email) === 'AAAAAA' ? 'BBBBBB' : 'AAAAAA';
    const response = await signInWithCode(app, email, wrong, ip);

    expect(response.status).toBe(400);
    expect(sessionCookie(response)).toBeUndefined();
  });

  it('rejects an expired code', async () => {
    const email = uniqueEmail();
    const ip = uniqueIp();
    await requestCode(app, email, ip);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 6 * 60 * 1000);
    const response = await signInWithCode(
      app,
      email,
      emails.lastCode(email),
      ip,
    );

    expect(response.status).toBe(400);
    expect(sessionCookie(response)).toBeUndefined();
  });

  it('rejects a code that was already used', async () => {
    const email = uniqueEmail();
    const ip = uniqueIp();
    await requestCode(app, email, ip);
    const code = emails.lastCode(email);
    await signInWithCode(app, email, code, ip);

    expect(
      (await signInWithCode(app, email, code, uniqueIp())).status,
    ).not.toBe(200);
  });

  it('locks the code after three wrong attempts until a new one is requested', async () => {
    const email = uniqueEmail();
    await requestCode(app, email, uniqueIp());
    const code = emails.lastCode(email);
    const wrong = code === 'AAAAAA' ? 'BBBBBB' : 'AAAAAA';
    for (let i = 0; i < 3; i++)
      await signInWithCode(app, email, wrong, uniqueIp());

    const locked = await signInWithCode(app, email, code, uniqueIp());
    expect(locked.status).not.toBe(200);
    expect(sessionCookie(locked)).toBeUndefined();

    await requestCode(app, email, uniqueIp());
    expect(
      (await signInWithCode(app, email, emails.lastCode(email), uniqueIp()))
        .status,
    ).toBe(200);
  });

  it('ignores unknown body fields', async () => {
    const email = uniqueEmail();
    const ip = uniqueIp();
    await requestCode(app, email, ip);
    const response = await signInWithCode(
      app,
      email,
      emails.lastCode(email),
      ip,
      {
        emailVerified: false,
        role: 'admin',
      },
    );

    expect(response.status).toBe(200);
    const session = await getSession(app, sessionCookie(response) ?? '');
    expect(session?.user.emailVerified).toBe(true);
    expect(session?.user).not.toHaveProperty('role');
  });

  it('answers auth errors with code and message, a request id and no internals', async () => {
    const email = uniqueEmail();
    const ip = uniqueIp();
    await requestCode(app, email, ip);
    const response = await signInWithCode(app, email, '222222', ip);
    const body = await response.json();

    expect(response.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
    expect(body).toEqual({
      code: expect.any(String),
      message: expect.any(String),
    });
    expect(JSON.stringify(body)).not.toMatch(
      /stack|select |\/Users\/|node_modules/i,
    );
  });
});

describe('logs', () => {
  it('never contain the code, the session token or the email', async () => {
    const email = uniqueEmail();
    const cookie = await signIn(app, emails, email);
    const token = decodeURIComponent(cookie.split('=')[1]).split('.')[0];
    const text = JSON.stringify(app.logs);

    expect(text).not.toContain(email);
    expect(text).not.toContain(emails.lastCode(email));
    expect(text).not.toContain(token);
  });
});
