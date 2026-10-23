import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

const REQUEST_ID_HEADER = 'X-Request-Id';

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Rule: an incoming request id is reused only when it is a UUID, so it cannot forge or bloat logs.
 */
export function resolveRequestId(
  incoming: string | string[] | undefined,
): string {
  return typeof incoming === 'string' && uuidPattern.test(incoming)
    ? incoming
    : randomUUID();
}

export function assignRequestId(
  req: IncomingMessage,
  res: ServerResponse,
): string {
  const id = resolveRequestId(req.headers[REQUEST_ID_HEADER.toLowerCase()]);
  res.setHeader(REQUEST_ID_HEADER, id);
  return id;
}
