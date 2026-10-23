interface SerializedRequest {
  id?: unknown;
  method?: string;
  url?: string;
}

interface SerializedResponse {
  statusCode?: number;
}

/**
 * Rule: request logs never contain headers, bodies or query strings (tokens, cookies, signed URLs).
 */
function pathOf(url: string | undefined): string | undefined {
  if (url === undefined) return undefined;
  const end = url.search(/[?#]/);
  return end === -1 ? url : url.slice(0, end);
}

export const logSerializers = {
  req: (req: SerializedRequest) => ({
    id: req.id,
    method: req.method,
    path: pathOf(req.url),
  }),
  res: (res: SerializedResponse) => ({ statusCode: res.statusCode }),
};

/**
 * Second line of defense in case a log call adds headers explicitly.
 */
export const redactedPaths = [
  'headers.authorization',
  'headers.cookie',
  'headers["x-api-key"]',
  'headers["set-cookie"]',
];
