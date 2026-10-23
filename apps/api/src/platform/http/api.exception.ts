import { HttpException, HttpStatus } from '@nestjs/common';

export interface ValidationIssue {
  path: string;
  code: string;
}

/**
 * An error whose message is safe to show to clients. Any other exception gets a generic message.
 */
export class ApiException extends HttpException {
  constructor(status: number, message: string) {
    super(message, status);
  }
}

export class ValidationException extends ApiException {
  constructor(readonly issues: ValidationIssue[]) {
    super(HttpStatus.BAD_REQUEST, 'Validation failed');
  }
}
