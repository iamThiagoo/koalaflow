import type { PipeTransform } from '@nestjs/common';
import type { z } from 'zod';
import { ValidationException, type ValidationIssue } from './api.exception.js';

const maxIssues = 20;
const maxSegmentLength = 64;

function segment(key: PropertyKey): string {
  return String(key).slice(0, maxSegmentLength);
}

/**
 * Rule: validation errors carry field paths and codes only, never the submitted values.
 * Rule: unknown keys are reported by path, truncated and capped so a hostile body cannot bloat the response.
 */
function toValidationIssues(error: z.ZodError): ValidationIssue[] {
  const issues = error.issues.flatMap((issue): ValidationIssue[] => {
    const path = issue.path.map(segment);
    if (issue.code === 'unrecognized_keys') {
      return issue.keys.map((key) => ({
        path: [...path, segment(key)].join('.'),
        code: issue.code,
      }));
    }
    return [{ path: path.join('.'), code: issue.code }];
  });
  return issues.slice(0, maxIssues);
}

/**
 * Validates one handler parameter. Use `z.strictObject` so unknown fields are rejected.
 */
export class ZodValidationPipe<T extends z.ZodType>
  implements PipeTransform<unknown, z.output<T>>
{
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.output<T> {
    const result = this.schema.safeParse(value);
    if (!result.success)
      throw new ValidationException(toValidationIssues(result.error));
    return result.data;
  }
}
