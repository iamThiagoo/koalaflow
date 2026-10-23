import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  HttpException,
  HttpStatus,
  Injectable,
  type NestMiddleware,
} from '@nestjs/common';
import { json, type RequestHandler, urlencoded } from 'express';
import { ApiException } from './api.exception.js';

const maxBodySize = '1mb';

const parsers: RequestHandler[] = [
  json({ limit: maxBodySize }),
  urlencoded({ extended: false, limit: maxBodySize }),
];

function toHttpException(error: unknown): HttpException {
  const status = (error as { status?: unknown }).status;
  if (
    status === HttpStatus.PAYLOAD_TOO_LARGE ||
    status === HttpStatus.UNSUPPORTED_MEDIA_TYPE
  ) {
    return new HttpException('', status);
  }
  return new ApiException(HttpStatus.BAD_REQUEST, 'Malformed request body');
}

/**
 * Rule: body parser failures go through the global exception filter, never Express's default
 * handler (which prints stack traces outside production).
 */
@Injectable()
export class BodyParserMiddleware implements NestMiddleware {
  async use(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ): Promise<void> {
    for (const parse of parsers) {
      await new Promise<void>((resolve, reject) => {
        parse(req as never, res as never, (error?: unknown) =>
          error ? reject(toHttpException(error)) : resolve(),
        );
      });
    }
    next();
  }
}
