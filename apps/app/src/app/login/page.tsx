import type { Metadata } from 'next';
import dotGrid from './images/dot-grid.svg';
import { LoginForm } from './login-form';
import { enter } from './motion';
import { Showcase } from './showcase';

export const metadata: Metadata = { title: 'Entrar · Koalaflow' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="relative flex min-h-dvh bg-surface lg:py-4 lg:pr-4">
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-50 w-full animate-enter bg-size-[640px_240px] bg-repeat-x lg:h-60 lg:w-160"
        style={{
          ...enter(300, { duration: 1200 }),
          backgroundImage: `url(${dotGrid.src})`,
        }}
      />
      <div className="relative flex flex-1 items-center justify-center px-6 py-12">
        <LoginForm
          siteUrl={process.env.SITE_URL}
          googleFailed={error === 'google'}
        />
      </div>
      <Showcase />
    </main>
  );
}
