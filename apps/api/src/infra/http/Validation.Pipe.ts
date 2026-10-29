import {
  type ArgumentMetadata,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { ApiException } from './Api.Exception.js';

export class StrictValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      exceptionFactory: () => {
        return new ApiException(HttpStatus.BAD_REQUEST, 'Validation failed');
      },
    });
  }

  override transform(value: unknown, metadata: ArgumentMetadata) {
    if (
      metadata.metatype &&
      this.toValidate(metadata) &&
      value != null &&
      (typeof value !== 'object' || Array.isArray(value))
    ) {
      throw new ApiException(HttpStatus.BAD_REQUEST, 'Validation failed');
    }
    return super.transform(value, metadata);
  }
}
