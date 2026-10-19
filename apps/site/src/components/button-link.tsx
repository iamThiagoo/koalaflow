import type { ReactNode } from 'react';

const variants = {
  primary:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:outline-brand-600',
  secondary:
    'bg-white text-ink-900 ring-1 ring-ink-200 ring-inset hover:bg-ink-50 focus-visible:outline-ink-400',
} as const;

export function ButtonLink({
  href,
  variant = 'primary',
  children,
}: {
  href: string;
  variant?: keyof typeof variants;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center rounded-control px-5 py-3 font-semibold text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${variants[variant]}`}
    >
      {children}
    </a>
  );
}
