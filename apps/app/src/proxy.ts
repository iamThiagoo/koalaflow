import { type NextRequest, NextResponse } from 'next/server';

const sessionCookies = [
  'better-auth.session_token',
  '__Secure-better-auth.session_token',
];

const hopHeaders = [
  'host',
  'connection',
  'keep-alive',
  'transfer-encoding',
  'content-length',
  'accept-encoding',
];

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
};

/**
 * Rule: pages need a session and /login needs none
 */
export async function proxy(request: NextRequest): Promise<Response> {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/')) {
    return forwardToApi(request, process.env.API_URL);
  }

  const signedIn = await hasSession(request, process.env.API_URL);

  if (pathname === '/login')
    return signedIn
      ? NextResponse.redirect(new URL('/', request.url))
      : NextResponse.next();

  return signedIn
    ? NextResponse.next()
    : NextResponse.redirect(new URL('/login', request.url));
}

async function forwardToApi(
  request: NextRequest,
  apiUrl: string | undefined,
): Promise<Response> {
  const { pathname, search } = request.nextUrl;

  const headers = new Headers(request.headers);

  for (const name of hopHeaders) {
    headers.delete(name);
  }

  try {
    const upstream = await fetch(new URL(pathname + search, apiUrl), {
      method: request.method,
      headers,
      body: request.body,
      redirect: 'manual',
      duplex: 'half',
    } as RequestInit);

    return new Response(upstream.body, {
      status: upstream.status,
      headers: upstream.headers,
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}

async function hasSession(
  request: NextRequest,
  apiUrl: string | undefined,
): Promise<boolean> {
  if (!sessionCookies.some((name) => request.cookies.has(name))) return false;

  const headers = new Headers({ cookie: request.headers.get('cookie') ?? '' });

  const clientIp = request.headers.get('x-forwarded-for');

  if (clientIp) {
    headers.set('x-forwarded-for', clientIp);
  }

  try {
    const response = await fetch(new URL('/api/auth/get-session', apiUrl), {
      headers,
    });

    return response.ok && (await response.json()) !== null;
  } catch {
    return false;
  }
}
