import 'server-only';
import { headers } from 'next/headers';

export async function apiFetch<T>(path: string): Promise<T> {
  const incoming = await headers();

  const forwarded = new Headers({ cookie: incoming.get('cookie') ?? '' });

  const clientIp = incoming.get('x-forwarded-for');

  if (clientIp) {
    forwarded.set('x-forwarded-for', clientIp);
  }

  const response = await fetch(new URL(path, process.env.API_URL), {
    headers: forwarded,
  });

  if (!response.ok) {
    throw new Error(`api ${path} answered ${response.status}`);
  }

  return (await response.json()) as T;
}
