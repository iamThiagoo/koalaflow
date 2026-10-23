import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ValidationException } from './api.exception.js';
import { ZodValidationPipe } from './zod-validation.pipe.js';

const pipe = new ZodValidationPipe(
  z.strictObject({
    name: z.string().regex(/^[a-z0-9-]{1,32}$/),
    tags: z.array(z.string().max(20)).max(5).optional(),
  }),
);

function issuesOf(value: unknown) {
  try {
    pipe.transform(value);
  } catch (error) {
    if (error instanceof ValidationException) return error.issues;
    throw error;
  }
  throw new Error('expected the pipe to throw');
}

describe('ZodValidationPipe', () => {
  it('returns the parsed value', () => {
    expect(pipe.transform({ name: 'my-video' })).toEqual({ name: 'my-video' });
  });

  it('rejects an unknown field by path', () => {
    expect(issuesOf({ name: 'ok', role: 'admin' })).toEqual([
      { path: 'role', code: 'unrecognized_keys' },
    ]);
  });

  it.each([
    ['an oversized value', 'a'.repeat(10_000)],
    ['a path traversal', '../../etc/passwd'],
  ])('rejects %s without echoing it', (_, value) => {
    const issues = issuesOf({ name: value });
    expect(issues).toEqual([{ path: 'name', code: 'invalid_format' }]);
    expect(JSON.stringify(issues)).not.toContain(value.slice(0, 16));
  });

  it('reports nested paths', () => {
    expect(issuesOf({ name: 'ok', tags: ['fine', 'x'.repeat(21)] })).toEqual([
      { path: 'tags.1', code: 'too_big' },
    ]);
  });

  it('truncates and caps unknown keys', () => {
    const body = Object.fromEntries(
      Array.from({ length: 50 }, (_, i) => [`${'k'.repeat(100)}${i}`, 1]),
    );
    const issues = issuesOf({ name: 'ok', ...body });

    expect(issues).toHaveLength(20);
    expect(issues.every((issue) => issue.path.length <= 64)).toBe(true);
  });

  it('rejects a body that is not an object', () => {
    expect(issuesOf('name=x')).toEqual([{ path: '', code: 'invalid_type' }]);
  });
});
