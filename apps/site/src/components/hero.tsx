import Image from 'next/image';
import type { ReactNode } from 'react';
import { HeadlineChip } from '@/components/headline-chip';
import { ProductShowcase } from '@/components/product-showcase';
import type { HomeContent } from '@/content/home';
import { enterDelay, heroEntrance } from '@/motion';

/**
 * "Hero region" (Figma 26:583 desktop, 26:181 mobile).
 * Rule: line breaks follow the Figma lines: three on desktop, six on mobile.
 */
export function Hero({
  content,
  header,
  appUrl,
}: {
  content: HomeContent['hero'];
  header: ReactNode;
  appUrl: string;
}) {
  const { headline } = content;
  return (
    <section className="bg-surface p-2 md:p-6">
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-b from-[#eefaf4] to-[#d6f3e5] md:rounded-[56px]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(62.5%_90.9%_at_50%_80%,rgba(127,214,176,0.4),rgba(127,214,176,0))]"
        />
        {header}
        <div className="relative flex flex-col items-center gap-4 px-5 pt-36 text-center md:pt-54">
          <h1
            style={enterDelay(heroEntrance.headline)}
            className="-my-0.5 max-w-245 animate-enter font-bold text-[32px] text-text-primary leading-11 tracking-[-2px] md:-my-1 md:text-[40px] md:leading-14"
          >
            {headline.lead}
            <br className="md:hidden" />
            <HeadlineChip
              className="md:ml-2.5"
              tone="brand"
              label={content.contentTypeLabel}
              options={content.contentTypes}
            />
            <br className="hidden md:inline" />
            <span className="ml-2 md:ml-0">{headline.bridge}</span>
            <br className="md:hidden" /> {headline.bridgeTail}{' '}
            <span className="whitespace-nowrap">
              <HeadlineChip
                tone="domain"
                label={content.domainLabel}
                options={content.domains}
              />
              {headline.end}
            </span>
            <br />
            {headline.closing}
            <br className="md:hidden" />
            <span className="text-danger md:ml-2.5">
              {headline.closingAccent}
            </span>
          </h1>
          <p
            style={enterDelay(heroEntrance.description)}
            className="min-h-18 max-w-200 animate-enter text-base text-text-secondary leading-6 md:min-h-0"
          >
            {content.description}
          </p>
          <div
            style={enterDelay(heroEntrance.actions)}
            className="flex w-full animate-enter flex-col items-center gap-4"
          >
            <a
              href={appUrl}
              className="flex h-12 w-full max-w-[334px] items-center rounded-full bg-primary px-[17px] font-semibold text-base text-primary-foreground leading-6 transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-primary-strong focus-visible:outline-offset-2 md:w-51 md:px-2"
            >
              <span className="flex-1 px-6 text-center">
                {content.primaryCta}
              </span>
              <Image
                src="/landing/arrow-right.svg"
                alt=""
                width={20}
                height={20}
                className="size-5 shrink-0"
              />
            </a>
            <p className="min-h-8 max-w-[270px] text-text-secondary text-xs leading-4 md:min-h-0 md:max-w-none">
              <strong className="font-bold">{content.microcopyStrong}</strong>
              {content.microcopy}
            </p>
          </div>
        </div>
        <ProductShowcase content={content.showcase} />
      </div>
    </section>
  );
}
