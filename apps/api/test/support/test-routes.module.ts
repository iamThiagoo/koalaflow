import { Body, Controller, Get, Module, Post } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../src/platform/http/zod-validation.pipe.js';

export const internalErrorMessage =
  'connect ECONNREFUSED db-internal.local:5432 for user "admin"';

const nameSchema = z.strictObject({
  name: z.string().regex(/^[a-z0-9-]{1,32}$/),
});

/**
 * Routes that exist only in e2e tests, to exercise failure paths of the HTTP baseline.
 */
@Controller('test')
class TestRoutesController {
  @Get('internal-error')
  internalError(): never {
    throw new Error(internalErrorMessage);
  }

  @Post('names')
  createName(
    @Body(new ZodValidationPipe(nameSchema)) body: z.output<typeof nameSchema>,
  ) {
    return body;
  }
}

@Module({ controllers: [TestRoutesController] })
export class TestRoutesModule {}
