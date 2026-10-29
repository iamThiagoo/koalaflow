import { randomInt, randomUUID } from 'node:crypto';
import { EmailSender } from '../../src/contexts/auth/infra/Email.Sender.js';
import type { TestApp } from './start-app.js';

export const appOrigin = 'http://localhost:3001';

/**
 * Rule: rate-limit and send counters live in Redis across runs, so every test uses its own email and client IP.
 */
export const uniqueEmail = () => `user-${randomUUID()}@example.com`;
export const uniqueIp = () =>
  `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;

export class CapturedEmails {
  readonly sent: { to: string; code: string }[] = [];

  async sendSignInCode(to: string, code: string): Promise<void> {
    this.sent.push({ to, code });
  }

  codesFor(email: string): string[] {
    return this.sent.filter((m) => m.to === email).map((m) => m.code);
  }

  lastCode(email: string): string {
    const code = this.codesFor(email).at(-1);
    if (!code) throw new Error(`no code sent to ${email}`);
    return code;
  }

  asOverride(): { provide: typeof EmailSender; useValue: CapturedEmails } {
    return { provide: EmailSender, useValue: this };
  }
}

export function post(
  app: TestApp,
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<Response> {
  return fetch(`${app.url}/api/auth/${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: appOrigin,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

export function requestCode(
  app: TestApp,
  email: string,
  ip: string,
): Promise<Response> {
  return post(
    app,
    'email-otp/send-verification-otp',
    { email, type: 'sign-in' },
    { 'x-forwarded-for': ip },
  );
}

export function signInWithCode(
  app: TestApp,
  email: string,
  otp: string,
  ip: string,
  extra: Record<string, unknown> = {},
): Promise<Response> {
  return post(
    app,
    'sign-in/email-otp',
    { email, otp, ...extra },
    { 'x-forwarded-for': ip },
  );
}

/**
 * The `name=value` pair of the session cookie set by a response, ready for a `cookie` header.
 */
export function sessionCookie(response: Response): string | undefined {
  return response.headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith('better-auth.session_token='))
    ?.split(';')[0];
}

/**
 * Requests a code and signs in with it; returns the session cookie.
 */
export async function signIn(
  app: TestApp,
  emails: CapturedEmails,
  email = uniqueEmail(),
): Promise<string> {
  const ip = uniqueIp();
  await requestCode(app, email, ip);
  const response = await signInWithCode(app, email, emails.lastCode(email), ip);
  const cookie = sessionCookie(response);
  if (response.status !== 200 || !cookie)
    throw new Error(`sign-in failed with ${response.status}`);
  return cookie;
}

export interface SessionBody {
  user: { id: string; email: string; emailVerified: boolean };
  session: { id: string; activeOrganizationId: string | null };
}

export async function getSession(
  app: TestApp,
  cookie: string,
): Promise<SessionBody | null> {
  const response = await fetch(`${app.url}/api/auth/get-session`, {
    headers: { cookie, 'x-forwarded-for': uniqueIp() },
  });
  return (await response.json()) as SessionBody | null;
}
