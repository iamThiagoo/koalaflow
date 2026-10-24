import { Body, Controller, Get, Module, Post, Res } from '@nestjs/common';
import { Matches } from 'class-validator';
import type { Response } from 'express';

export const internalErrorMessage =
  'connect ECONNREFUSED db-internal.local:5432 for user "admin"';

class CreateNameDto {
  @Matches(/^[a-z0-9-]{1,32}$/)
  name!: string;
}

/**
 * Routes that exist only in e2e tests, to exercise failure paths of the HTTP baseline.
 */
@Controller('test')
class TestRoutesController {
  @Get('internal-error')
  internalError(): never {
    throw new Error(internalErrorMessage);
  }

  @Get('error-after-headers')
  errorAfterHeaders(@Res() res: Response): never {
    res.write('partial');
    throw new Error(internalErrorMessage);
  }

  @Post('names')
  createName(@Body() body: CreateNameDto) {
    return body;
  }
}

@Module({ controllers: [TestRoutesController] })
export class TestRoutesModule {}
