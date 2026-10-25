import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { SignOutButton } from './sign-out-button';

interface Session {
  user: { email: string };
}

export default async function HomePage() {
  const session = await apiFetch<Session | null>('/api/auth/get-session');

  if (!session) redirect('/login');

  const organization = await apiFetch<{ name: string }>(
    '/api/auth/organization/get-full-organization',
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface-subtle p-6">
      <h1 className="font-semibold text-4xl text-text-primary">Koalaflow</h1>
      <dl className="grid gap-1 text-center text-text-secondary">
        <dt className="sr-only">E-mail</dt>
        <dd className="text-text-body">{session.user.email}</dd>
        <dt className="sr-only">Organização</dt>
        <dd>{organization.name}</dd>
      </dl>
      <SignOutButton />
    </main>
  );
}
