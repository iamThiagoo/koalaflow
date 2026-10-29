import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { json } from 'express';
import { GlobalExceptionFilter } from './Exception.Filter.js';
import { StrictValidationPipe } from './Validation.Pipe.js';

@Module({
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_PIPE, useClass: StrictValidationPipe },
  ],
})
export class HttpModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(json({ limit: '1mb' })).forRoutes('{/*splat}');
  }
}
