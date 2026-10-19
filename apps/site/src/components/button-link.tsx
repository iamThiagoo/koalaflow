import type { ReactNode } from 'react';

const sizes = {
  md: 'h-12 px-6 text-base leading-6',
  sm: 'h-10 px-3 text-sm leading-5',
} as const;

/**
 * Koalaflow Button · Primary (Figma 6:8605): eucalyptus pill, no shadow.
 */
export function ButtonLink({
  href,
  size = 'md',
  className = '',
  children,
}: {
  href: string;
  size?: keyof typeof sizes;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className={`inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-primary-strong focus-visible:outline-offset-2 ${sizes[size]} ${className}`}
    >
      {children}
    </a>
  );
}
