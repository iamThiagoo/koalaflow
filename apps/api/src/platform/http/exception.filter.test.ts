import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ApiException, ValidationException } from './api.exception.js';
import { toErrorBody } from './exception.filter.js';

const requestId = '0b6f3e52-8d0c-4c1f-9a51-1d2a3b4c5d6e';

describe('toErrorBody', () => {
  it('uses the message of an ApiException', () => {
    expect(
      toErrorBody(new ApiException(413, 'Request body too large'), requestId),
    ).toEqual({
      statusCode: 413,
      error: 'Payload Too Large',
      message: 'Request body too large',
      requestId,
    });
  });

  it('replaces the message of other HTTP exceptions with a generic one', () => {
    const body = toErrorBody(
      new NotFoundException('Cannot GET /api/<script>'),
      requestId,
    );
    expect(body).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Resource not found',
      requestId,
    });
  });

  it('falls back to the reason phrase for statuses without a generic message', () => {
    const body = toErrorBody(
      new ConflictException('Video v-123 is locked by user u-9'),
      requestId,
    );
    expect(body).toMatchObject({ error: 'Conflict', message: 'Conflict' });
  });

  it('adds validation issues', () => {
    const body = toErrorBody(
      new ValidationException([{ path: 'name', code: 'too_big' }]),
      requestId,
    );
    expect(body).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      requestId,
      issues: [{ path: 'name', code: 'too_big' }],
    });
  });

  it('turns an unexpected error into a generic 500', () => {
    const error = new Error(
      'connect ECONNREFUSED db-internal.local:5432 at /srv/app/dist/main.js',
    );
    const body = toErrorBody(error, requestId);

    expect(body).toEqual({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Internal server error',
      requestId,
    });
    expect(JSON.stringify(body)).not.toMatch(
      /ECONNREFUSED|db-internal|\/srv\/app/,
    );
  });

  it('turns a thrown non-error value into a generic 500', () => {
    expect(toErrorBody('boom', requestId).statusCode).toBe(500);
  });
});
