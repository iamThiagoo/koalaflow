'use client';

import Image from 'next/image';
import { useCallback, useId, useRef, useState } from 'react';
import { ButtonLink } from '@/components/button-link';
import { Logo } from '@/components/logo';
import { useDismiss } from '@/components/use-dismiss';
import type { HomeContent } from '@/content/home';

const menuItemClass =
  'flex h-11 items-center rounded-lg px-4 text-base text-text-primary leading-6 transition-colors hover:bg-surface-subtle focus-visible:bg-surface-subtle focus-visible:outline-none';

/**
 * Koalaflow/mobile-header (Figma 22:610): pill bar with a dropdown menu, fixed by `SiteHeader`.
 */
export function MobileHeader({
  className,
  content,
  navigation,
  appUrl,
  salesUrl,
}: {
  className: string;
  content: HomeContent['header'];
  navigation: { label: string; href: string }[];
  appUrl: string;
  salesUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, rootRef, toggleRef);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div className="flex h-16 w-full items-center justify-between rounded-full border border-border bg-surface py-2 pr-2 pl-4 in-data-scrolled:shadow-lg in-data-scrolled:shadow-text-primary/8 motion-safe:transition-shadow motion-safe:duration-300 motion-safe:ease-reveal">
        <a href="/" aria-label={content.homeLabel} className="rounded-sm">
          <Logo />
        </a>
        <div className="flex items-center gap-2">
          <ButtonLink href={appUrl} size="sm">
            {content.primaryCtaShort}
          </ButtonLink>
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? content.closeMenu : content.openMenu}
            onClick={() => setOpen((value) => !value)}
            className="flex size-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-primary-strong focus-visible:outline-offset-2"
          >
            {open ? (
              <Image src="/landing/close.svg" alt="" width={15} height={15} />
            ) : (
              <Image
                src="/landing/hamburger.svg"
                alt=""
                width={18}
                height={14}
              />
            )}
          </button>
        </div>
      </div>
      <nav
        id={menuId}
        aria-label={content.navigationLabel}
        hidden={!open}
        className="absolute top-18 right-0 z-30 w-50 overflow-hidden rounded-2xl border border-border-card bg-surface p-2"
      >
        <ul className="flex flex-col">
          {navigation.map((item) => (
            <li key={item.label}>
              <a href={item.href} onClick={close} className={menuItemClass}>
                {item.label}
              </a>
            </li>
          ))}
          <li>
            <a href={salesUrl} onClick={close} className={menuItemClass}>
              {content.salesCta}
            </a>
          </li>
          <li aria-hidden="true" className="h-px bg-border" />
          <li>
            <a href={appUrl} onClick={close} className={menuItemClass}>
              {content.signIn}
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}
