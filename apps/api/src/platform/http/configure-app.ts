import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

export const appOptions = { bodyParser: false, bufferLogs: true } as const;

export function configureApp(app: NestExpressApplication): void {
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api');
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
      },
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );
  app.enableShutdownHooks();
}
