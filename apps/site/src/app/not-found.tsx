import type { Metadata } from 'next';
import { home } from '@/content/home';

export const metadata: Metadata = {
  title: home.notFound.title,
};

export default function NotFound() {
  const { notFound } = home;
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-6">
      <p className="font-bold text-6xl text-primary-strong">404</p>
      <h1 className="font-semibold text-primary-foreground text-xl">
        {notFound.title}
      </h1>
      <p className="text-text-secondary">{notFound.message}</p>
      <a
        href="/"
        className="font-medium text-primary-strong hover:text-text-primary"
      >
        {notFound.backHome}
      </a>
    </main>
  );
}
