import type { LogLine, TestApp } from './start-app.js';

export function requestLines(
  app: TestApp,
  requestId: string | null,
): LogLine[] {
  return app.logs.filter(
    (line) => (line.req as { id?: string } | undefined)?.id === requestId,
  );
}

/**
 * Pino writes the completion line when the response finishes, which can be just after fetch resolves.
 */
export async function waitForLine(
  app: TestApp,
  requestId: string | null,
): Promise<LogLine> {
  for (let attempt = 0; attempt < 50; attempt++) {
    const [line] = requestLines(app, requestId);
    if (line) return line;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`no log line for request ${requestId}`);
}
