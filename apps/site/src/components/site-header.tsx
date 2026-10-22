import { ButtonLink } from '@/components/button-link';
import { HeaderScrollState } from '@/components/header-scroll-state';
import { Logo } from '@/components/logo';
import { MobileHeader } from '@/components/mobile-header';
import type { HomeContent } from '@/content/home';
import { type LinkContext, resolveHref } from '@/links';

/**
 * Floating header (Figma 26:586) from lg up; the mobile header (Figma 22:610) below it.
 * Rule: the header is fixed at every size, starting where it sits in the hero card so it never jumps.
 * Rule: it stays above the headline chip menus (z-30) that scroll under it.
 * Rule: once the page leaves the top it compacts in 300ms: it slides closer to the edge (translate
 * only, no layout) and the pill gets a more solid background and a shadow to stay legible over
 * dark sections. Scrolling back to the top reverses it.
 */
export function SiteHeader({
  content,
  links,
}: {
  content: HomeContent['header'];
  links: LinkContext;
}) {
  const navigation = content.navigation.map((item) => ({
    label: item.label,
    href: resolveHref(item.to, links),
  }));
  const appUrl = resolveHref('app', links);
  return (
    <header className="fixed inset-x-6 top-5 z-40 animate-enter in-data-scrolled:-translate-y-3 motion-safe:transition-[translate] motion-safe:duration-300 motion-safe:ease-reveal md:inset-x-10 md:top-9 md:in-data-scrolled:-translate-y-5 lg:inset-x-6 lg:top-6 lg:in-data-scrolled:-translate-y-6">
      <HeaderScrollState />
      <div className="absolute top-4 left-1/2 hidden h-16 w-[min(880px,calc(100%-32px))] -translate-x-1/2 items-center justify-between overflow-hidden rounded-full border border-white/80 bg-white/55 py-2 pr-2 pl-6 backdrop-blur-md in-data-scrolled:bg-white/85 in-data-scrolled:shadow-lg in-data-scrolled:shadow-text-primary/8 motion-safe:transition-[background-color,box-shadow] motion-safe:duration-300 motion-safe:ease-reveal lg:flex">
        <div className="flex items-center gap-8">
          <a href="/" aria-label={content.homeLabel} className="rounded-sm">
            <Logo />
          </a>
          <nav aria-label={content.navigationLabel}>
            <ul className="flex items-center gap-8 text-sm text-text-primary leading-5">
              {navigation.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="transition-colors hover:text-primary-strong"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <a
            href={appUrl}
            className="font-semibold text-sm text-text-primary leading-5 transition-colors hover:text-primary-strong"
          >
            {content.signIn}
          </a>
          <ButtonLink href={appUrl}>{content.primaryCta}</ButtonLink>
        </div>
      </div>
      <MobileHeader
        className="lg:hidden"
        content={content}
        navigation={navigation}
        appUrl={appUrl}
        salesUrl={resolveHref('sales', links)}
      />
    </header>
  );
}
