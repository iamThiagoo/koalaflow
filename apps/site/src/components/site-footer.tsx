import Image from 'next/image';
import { LogoWhite } from '@/components/logo';
import type { HomeContent } from '@/content/home';
import { type LinkContext, resolveHref } from '@/links';
import { revealDelay } from '@/motion';

const socialIcons: Record<string, string> = {
  linkedin: '/landing/linkedin.svg',
  instagram: '/landing/instagram.svg',
  youtube: '/landing/youtube.svg',
  github: '/landing/github.svg',
};

const fullRowOnMobile = new Set(['suporte', 'legal']);

export function SiteFooter({
  content,
  links,
}: {
  content: HomeContent['footer'];
  links: LinkContext;
}) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative z-10 -mt-4 rounded-t-[32px] bg-primary-foreground text-white md:-mt-8 md:rounded-t-[56px]">
      <div className="mx-auto max-w-324 px-5 pt-20 pb-16 md:px-10">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-3 xl:grid-cols-6">
          {content.columns.map((column, index) => (
            <div
              key={column.id}
              id={column.id}
              data-reveal
              style={revealDelay(index, 50)}
              className={`flex flex-col gap-3 ${fullRowOnMobile.has(column.id) ? 'col-span-2 md:col-span-1' : ''}`}
            >
              <h2 className="font-medium text-base leading-6">
                {column.title}
              </h2>
              <ul className="flex flex-col gap-3 text-sm leading-5">
                {column.links.map((link) => (
                  <li key={link.label} className="opacity-70">
                    {'to' in link && link.to ? (
                      <a
                        href={resolveHref(link.to, links)}
                        className="transition-opacity hover:opacity-80"
                      >
                        {link.label}
                      </a>
                    ) : (
                      link.label
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div aria-hidden="true" className="my-12 h-px bg-white/10" />

        <div
          data-reveal
          className="flex flex-col gap-4 md:grid md:grid-cols-[1fr_auto] md:gap-x-8 md:gap-y-3"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-3">
            <LogoWhite />
            <p className="text-sm leading-5 opacity-85">
              © {year} {content.copyright}
            </p>
          </div>
          <ul
            aria-label={content.socialLabel}
            className="flex gap-6 md:col-start-2 md:row-span-2 md:row-start-1"
          >
            {content.socials.map((social) => (
              <li
                key={social.network}
                className="flex size-10 items-center justify-center rounded-full"
              >
                <Image
                  src={socialIcons[social.network]}
                  alt={social.label}
                  width={20}
                  height={20}
                  className="size-5"
                />
              </li>
            ))}
          </ul>
          <p className="max-w-210 text-xs leading-4 opacity-60 md:col-start-1 md:row-start-2">
            {content.legal.before}
            <span className="underline">{content.legal.terms}</span>
            {content.legal.between}
            <span className="underline">{content.legal.privacy}</span>
            {content.legal.after}
          </p>
        </div>
      </div>
    </footer>
  );
}
