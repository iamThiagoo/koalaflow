import {
  All,
  Controller,
  Inject,
  NotFoundException,
  Req,
  Res,
} from '@nestjs/common';
import { toNodeHandler } from 'better-auth/node';
import type { Request, Response } from 'express';
import { AUTH, type Auth } from './IAuth.js';
import { Public } from './Public.Decorator.js';

/**
 * Rule: only the auth routes the product uses are served
 */
const allowedRoutes = new Set([
  'GET get-session',
  'POST sign-out',
  'POST email-otp/send-verification-otp',
  'POST sign-in/email-otp',
  'POST sign-in/social',
  'GET callback/google',
  'GET organization/get-full-organization',
  'GET error',
]);

@Public()
@Controller('auth')
export class AuthController {
  private readonly handler: ReturnType<typeof toNodeHandler>;
  private readonly appHost = new URL(process.env.BETTER_AUTH_URL ?? '').host;

  constructor(@Inject(AUTH) auth: Auth) {
    this.handler = toNodeHandler(auth);
  }

  @All('*path')
  async handle(@Req() req: Request, @Res() res: Response): Promise<void> {
    const route = `${req.method} ${req.path.replace(/^\/api\/auth\//, '')}`;

    if (!allowedRoutes.has(route)) {
      throw new NotFoundException();
    }

    req.headers.host = this.appHost;

    delete req.headers['x-forwarded-proto'];
    delete req.headers[':authority'];

    await this.handler(req, res);
  }
}
