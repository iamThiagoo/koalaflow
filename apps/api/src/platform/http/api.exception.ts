import { HttpException, HttpStatus } from '@nestjs/common';

export class ApiException extends HttpException {
  constructor(status: HttpStatus, message: string) {
    super(message, status);
  }
}
