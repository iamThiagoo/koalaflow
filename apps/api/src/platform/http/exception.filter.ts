import { STATUS_CODES } from 'node:http';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiException } from './api.exception.js';

const genericMessages: Record<number, string> = {
  [HttpStatus.NOT_FOUND]: 'Resource not found',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'Request body too large',
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: 'Unsupported request body encoding',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal server error',
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const statusCode = statusOf(exception);

    if (res.headersSent || statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      res.err =
        exception instanceof Error ? exception : new Error('Non-error thrown');
    }
    if (res.headersSent) {
      req.socket.destroy();
      return;
    }

    const error = STATUS_CODES[statusCode] ?? 'Error';
    const body = {
      statusCode,
      error,
      message:
        exception instanceof ApiException
          ? exception.message
          : (genericMessages[statusCode] ?? error),
      requestId: String(req.id),
    };
    res.status(statusCode).json(body);
  }
}

function statusOf(exception: unknown): number {
  if (exception instanceof HttpException) return exception.getStatus();

  const { status, expose } = Object(exception) as {
    status?: unknown;
    expose?: unknown;
  };

  return expose === true && typeof status === 'number'
    ? status
    : HttpStatus.INTERNAL_SERVER_ERROR;
}
