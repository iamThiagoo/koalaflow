import { createHmac } from 'node:crypto';
import { redisStorage } from '@better-auth/redis-storage';
import { EntityManager } from '@mikro-orm/postgresql';
import { Logger } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { emailOTP, organization } from 'better-auth/plugins';
import { Redis } from 'ioredis';
import { GetOrCreateSessionOrganizationUseCase } from '../application/GetOrCreateSessionOrganization.UseCase.js';
import { generateCode, normalizeCode } from '../domain/SignInCode.js';
import { EmailSender } from './Email.Sender.js';
import { Auth } from './IAuth.js';

export function createAuth(
  em: EntityManager,
  redis: Redis,
  emails: EmailSender,
  getOrCreateSessionOrganization: GetOrCreateSessionOrganizationUseCase,
): Auth {
  const secret = process.env.BETTER_AUTH_SECRET ?? '';

  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error(
      'BETTER_AUTH_SECRET must have at least 32 characters in production',
    );
  }

  const hmac = (value: string) =>
    createHmac('sha256', secret).update(value).digest('hex');

  const logger = new Logger('BetterAuth');

  const { GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret } =
    process.env;

  return betterAuth({
    database: { db: em.getKysely(), type: 'postgres' },
    secondaryStorage: redisStorage({ client: redis }),
    session: { storeSessionInDatabase: true },
    rateLimit: { enabled: true },
    advanced: {
      disableOriginCheck: false,
      database: { generateId: 'uuid' },
      ipAddress: {
        trustedProxies: process.env.TRUSTED_PROXIES?.split(',')
          .map((proxy) => proxy.trim())
          .filter(Boolean),
      },
    },
    socialProviders:
      clientId && clientSecret
        ? { google: { clientId, clientSecret } }
        : undefined,
    logger: {
      log: (level, message) => {
        if (level === 'error') logger.error(message);
        else if (level === 'warn') logger.warn(message);
        else if (level === 'info') logger.log(message);
        else logger.debug(message);
      },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        const email: unknown = ctx.body?.email;

        if (
          ctx.path === '/email-otp/send-verification-otp' &&
          typeof email === 'string' &&
          email.length > 254
        ) {
          throw new APIError('BAD_REQUEST', { message: 'Invalid email' });
        }
      }),
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => ({
            data: {
              ...session,
              activeOrganizationId:
                await getOrCreateSessionOrganization.execute(session.userId),
            },
          }),
        },
      },
    },
    plugins: [
      emailOTP({
        generateOTP: generateCode,
        storeOTP: { hash: async (otp) => hmac(normalizeCode(otp)) },
        sendVerificationOTP: async ({ email, otp, type }) => {
          if (type !== 'sign-in') return;

          const sent = await redis.eval(
            `local sent = redis.call('INCR', KEYS[1])
              if sent == 1 then redis.call('EXPIRE', KEYS[1], 3600) end
              return sent
            `,
            1,
            `identity:otp-sends:${hmac(email)}`,
          );

          if (Number(sent) > 5) return;

          void emails
            .sendSignInCode(email, otp)
            .catch((error: unknown) =>
              logger.error(
                `sign-in code email failed: ${error instanceof Error ? error.name : 'unknown'}`,
              ),
            );
        },
      }),
      organization({
        allowUserToCreateOrganization: false,
        disableOrganizationDeletion: true,
      }),
    ],
  });
}
