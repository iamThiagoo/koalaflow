import { STATUS_CODES } from 'node:http';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiException,
  ValidationException,
  type ValidationIssue,
} from './api.exception.js';

export interface ErrorBody {
  statusCode: number;
  error: string;
  message: string;
  requestId: string;
  issues?: ValidationIssue[];
}

const genericMessages: Record<number, string> = {
  404: 'Resource not found',
  413: 'Request body too large',
  415: 'Unsupported request body encoding',
  500: 'Internal server error',
};

/**
 * Rule: clients only see messages from ApiException; every other error gets a generic message per status.
 * Rule: unexpected errors become 500 and their details stay in the server log.
 */
export function toErrorBody(exception: unknown, requestId: string): ErrorBody {
  const statusCode =
    exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
  const body: ErrorBody = {
    statusCode,
    error: STATUS_CODES[statusCode] ?? 'Error',
    message:
      exception instanceof ApiException
        ? exception.message
        : (genericMessages[statusCode] ?? STATUS_CODES[statusCode] ?? 'Error'),
    requestId,
  };
  if (exception instanceof ValidationException) body.issues = exception.issues;
  return body;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    if (res.headersSent) return;

    const body = toErrorBody(exception, String(req.id));
    if (body.statusCode >= 500) {
      res.err =
        exception instanceof Error ? exception : new Error('Non-error thrown');
    }
    res.status(body.statusCode).json(body);
  }
}
